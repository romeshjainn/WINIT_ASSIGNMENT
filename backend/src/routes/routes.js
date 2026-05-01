const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { get, all, run, exec } = require('../db/helper');
const { authenticate, requireRole } = require('../middleware/auth');

// ─── List all routes ─────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const rows = await all(`
      SELECT r.*,
        c.name AS company_name,
        w.name AS warehouse_name,
        v.name AS vehicle_name,
        u.name AS primary_employee_name
      FROM routes r
      LEFT JOIN companies c ON r.company_id = c.id
      LEFT JOIN warehouses w ON r.warehouse_id = w.id
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
      LEFT JOIN users u ON r.primary_employee_id = u.id
      ORDER BY r.created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error('[GET /routes]', err.message);
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
});

// ─── Get single route ─────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const route = await get(
      `SELECT r.*,
        c.name AS company_name,
        w.name AS warehouse_name,
        v.name AS vehicle_name,
        u.name AS primary_employee_name
      FROM routes r
      LEFT JOIN companies c ON r.company_id = c.id
      LEFT JOIN warehouses w ON r.warehouse_id = w.id
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
      LEFT JOIN users u ON r.primary_employee_id = u.id
      WHERE r.id = ?`,
      [req.params.id],
    );

    if (!route) return res.status(404).json({ error: 'Route not found' });

    const customers = await all(
      `SELECT rc.*, cu.name, cu.customer_code, cu.address, cu.contact_number, cu.location_route
       FROM route_customers rc
       JOIN customers cu ON rc.customer_id = cu.id
       WHERE rc.route_id = ?
       ORDER BY rc.order_index`,
      [req.params.id],
    );

    res.json({ ...route, customers });
  } catch (err) {
    console.error('[GET /routes/:id]', err.message);
    res.status(500).json({ error: 'Failed to fetch route' });
  }
});

// ─── Create route ─────────────────────────
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  const {
    route_name,
    route_code,
    valid_from,
    valid_to,
    status,
    company_id,
    warehouse_id,
    vehicle_id,
    role,
    primary_employee_id,
    frequency,
    customers = [],
  } = req.body;

  if (!route_name || !route_code || !valid_from || !valid_to || !company_id || !frequency) {
    return res.status(400).json({
      error: 'route_name, route_code, valid_from, valid_to, company_id, frequency required',
    });
  }

  const routeId = uuidv4();

  try {
    await exec('BEGIN');

    await run(
      `INSERT INTO routes
       (id, route_name, route_code, valid_from, valid_to, status,
        company_id, warehouse_id, vehicle_id, role,
        primary_employee_id, frequency, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        routeId,
        route_name,
        route_code,
        valid_from,
        valid_to,
        status || 'active',
        company_id,
        warehouse_id || null,
        vehicle_id || null,
        role || null,
        primary_employee_id || null,
        frequency,
        req.user.id,
      ],
    );

    for (let i = 0; i < customers.length; i++) {
      const c = customers[i];

      await run(
        `INSERT INTO route_customers
         (id, route_id, customer_id, duration, scheduled_time, priority, order_index)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          routeId,
          c.customer_id,
          c.duration || null,
          c.scheduled_time || null,
          c.priority || 'normal',
          c.order_index ?? i,
        ],
      );
    }

    await exec('COMMIT');
    res.status(201).json({ id: routeId });
  } catch (err) {
    await exec('ROLLBACK');
    console.error('[POST /routes]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Update route ─────────────────────────
router.put('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const existing = await get('SELECT * FROM routes WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Route not found' });

    const {
      route_name,
      route_code,
      valid_from,
      valid_to,
      status,
      company_id,
      warehouse_id,
      vehicle_id,
      role,
      primary_employee_id,
      frequency,
    } = req.body;

    await run(
      `UPDATE routes SET
        route_name = ?, route_code = ?, valid_from = ?, valid_to = ?, status = ?,
        company_id = ?, warehouse_id = ?, vehicle_id = ?, role = ?,
        primary_employee_id = ?, frequency = ?
       WHERE id = ?`,
      [
        route_name || existing.route_name,
        route_code || existing.route_code,
        valid_from || existing.valid_from,
        valid_to || existing.valid_to,
        status || existing.status,
        company_id || existing.company_id,
        warehouse_id !== undefined ? warehouse_id : existing.warehouse_id,
        vehicle_id !== undefined ? vehicle_id : existing.vehicle_id,
        role !== undefined ? role : existing.role,
        primary_employee_id !== undefined ? primary_employee_id : existing.primary_employee_id,
        frequency || existing.frequency,
        req.params.id,
      ],
    );

    res.json({ success: true });
  } catch (err) {
    console.error('[PUT /routes/:id]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Delete route ─────────────────────────
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const existing = await get('SELECT * FROM routes WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Route not found' });

    await exec('BEGIN');

    await run('DELETE FROM route_customers WHERE route_id = ?', [req.params.id]);
    await run('DELETE FROM routes WHERE id = ?', [req.params.id]);

    await exec('COMMIT');

    res.json({ success: true });
  } catch (err) {
    await exec('ROLLBACK');
    console.error('[DELETE /routes/:id]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
