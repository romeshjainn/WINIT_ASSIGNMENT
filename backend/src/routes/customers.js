const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const { get, all, run, exec } = require('../db/helper');
const { authenticate, requireRole } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

// List customers
router.get('/', authenticate, async (req, res) => {
  try {
    const { company_id, warehouse_id, search, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = [];
    const params = [];

    if (company_id) {
      where.push('c.company_id = ?');
      params.push(company_id);
    }
    if (warehouse_id) {
      where.push('c.warehouse_id = ?');
      params.push(warehouse_id);
    }
    if (search) {
      where.push('(c.name LIKE ? OR c.customer_code LIKE ? OR c.contact_number LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const totalRow = await get(`SELECT COUNT(*) as count FROM customers c ${whereClause}`, params);

    const rows = await all(
      `SELECT c.*, co.name AS company_name, w.name AS warehouse_name
       FROM customers c
       LEFT JOIN companies co ON c.company_id = co.id
       LEFT JOIN warehouses w ON c.warehouse_id = w.id
       ${whereClause}
       ORDER BY c.name
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset],
    );

    res.json({
      data: rows,
      total: totalRow.count,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error('GET customers error:', err.message);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// CSV export
router.get('/export', authenticate, async (req, res) => {
  try {
    const { company_id, warehouse_id } = req.query;
    const where = [];
    const params = [];

    if (company_id) {
      where.push('company_id = ?');
      params.push(company_id);
    }
    if (warehouse_id) {
      where.push('warehouse_id = ?');
      params.push(warehouse_id);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const rows = await all(
      `SELECT name, customer_code, address, contact_number, location_route, company_id, warehouse_id
       FROM customers ${whereClause}`,
      params,
    );

    const headers = [
      'name',
      'customer_code',
      'address',
      'contact_number',
      'location_route',
      'company_id',
      'warehouse_id',
    ];

    const csv = [
      headers.join(','),
      ...rows.map((r) =>
        headers
          .map((h) => {
            const val = r[h] ?? '';
            return val.toString().includes(',') ? `"${val}"` : val;
          })
          .join(','),
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="customers.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single
router.get('/:id', authenticate, async (req, res) => {
  try {
    const customer = await get(
      `SELECT c.*, co.name AS company_name, w.name AS warehouse_name
       FROM customers c
       LEFT JOIN companies co ON c.company_id = co.id
       LEFT JOIN warehouses w ON c.warehouse_id = w.id
       WHERE c.id = ?`,
      [req.params.id],
    );

    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const {
      name,
      customer_code,
      address,
      contact_number,
      location_route,
      company_id,
      warehouse_id,
    } = req.body;

    if (!name || !customer_code || !company_id) {
      return res.status(400).json({ error: 'name, customer_code, company_id required' });
    }

    const id = uuidv4();

    await run(
      `INSERT INTO customers
       (id, name, customer_code, address, contact_number, location_route, company_id, warehouse_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name,
        customer_code,
        address || null,
        contact_number || null,
        location_route || null,
        company_id,
        warehouse_id || null,
      ],
    );

    res.status(201).json({ id, name, customer_code });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update
router.put('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const existing = await get('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Customer not found' });

    const {
      name,
      customer_code,
      address,
      contact_number,
      location_route,
      company_id,
      warehouse_id,
    } = req.body;

    await run(
      `UPDATE customers SET
        name = ?, customer_code = ?, address = ?, contact_number = ?,
        location_route = ?, company_id = ?, warehouse_id = ?
       WHERE id = ?`,
      [
        name || existing.name,
        customer_code || existing.customer_code,
        address !== undefined ? address : existing.address,
        contact_number !== undefined ? contact_number : existing.contact_number,
        location_route !== undefined ? location_route : existing.location_route,
        company_id || existing.company_id,
        warehouse_id !== undefined ? warehouse_id : existing.warehouse_id,
        req.params.id,
      ],
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const existing = await get('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Customer not found' });

    await run('DELETE FROM customers WHERE id = ?', [req.params.id]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CSV import
router.post(
  '/import',
  authenticate,
  requireRole('admin'),
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

      const lines = req.file.buffer.toString('utf8').split('\n').filter(Boolean);
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));

      let count = 0;

      await exec('BEGIN TRANSACTION');

      for (const row of lines.slice(1)) {
        const cols = row.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        const rec = {};
        headers.forEach((h, i) => (rec[h] = cols[i]));

        if (!rec.name || !rec.customer_code || !rec.company_id) continue;

        await run(
          `INSERT OR IGNORE INTO customers
         (id, name, customer_code, address, contact_number, location_route, company_id, warehouse_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            uuidv4(),
            rec.name,
            rec.customer_code,
            rec.address || null,
            rec.contact_number || null,
            rec.location_route || null,
            rec.company_id,
            rec.warehouse_id || null,
          ],
        );

        count++;
      }

      await exec('COMMIT');

      res.json({ imported: count });
    } catch (err) {
      await exec('ROLLBACK');
      res.status(500).json({ error: err.message });
    }
  },
);

module.exports = router;
