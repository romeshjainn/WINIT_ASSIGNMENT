const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { get, all, run, exec } = require('../db/helper');
const { authenticate, requireRole } = require('../middleware/auth');

// ─── Admin: list all journey plans ─────────────────────────
router.get('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { date, assigned_to, status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = [];
    const params = [];

    if (date) {
      where.push('jp.date = ?');
      params.push(date);
    }
    if (assigned_to) {
      where.push('jp.assigned_to = ?');
      params.push(assigned_to);
    }
    if (status) {
      where.push('jp.status = ?');
      params.push(status);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const totalRow = await get(
      `SELECT COUNT(*) as count FROM journey_plans jp ${whereClause}`,
      params,
    );

    const rows = await all(
      `SELECT jp.*,
        u.name AS assigned_to_name,
        u.username AS assigned_to_username,
        r.route_name,
        r.route_code,
        (SELECT COUNT(*) FROM visits v WHERE v.journey_plan_id = jp.id) AS total_visits,
        (SELECT COUNT(*) FROM visits v WHERE v.journey_plan_id = jp.id AND v.status = 'complete') AS completed_visits
      FROM journey_plans jp
      LEFT JOIN users u ON jp.assigned_to = u.id
      LEFT JOIN routes r ON jp.route_id = r.id
      ${whereClause}
      ORDER BY jp.date DESC, jp.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset],
    );

    res.json({ data: rows, total: totalRow.count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Mobile: today plan ─────────────────────────
router.get('/today', authenticate, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const plan = await get(
      `SELECT jp.*, r.route_name, r.route_code, r.frequency
       FROM journey_plans jp
       LEFT JOIN routes r ON jp.route_id = r.id
       WHERE jp.assigned_to = ? AND jp.date = ? AND jp.status = 'active'`,
      [req.user.id, today],
    );

    if (!plan) return res.json(null);

    const visits = await all(
      `SELECT v.*, c.name, c.customer_code, c.address, c.contact_number, c.location_route
       FROM visits v
       JOIN customers c ON v.customer_id = c.id
       WHERE v.journey_plan_id = ?
       ORDER BY v.rowid`,
      [plan.id],
    );

    res.json({ ...plan, visits });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Get single ─────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const plan = await get(
      `SELECT jp.*, u.name AS assigned_to_name, u.username AS assigned_to_username,
              r.route_name, r.route_code
       FROM journey_plans jp
       LEFT JOIN users u ON jp.assigned_to = u.id
       LEFT JOIN routes r ON jp.route_id = r.id
       WHERE jp.id = ?`,
      [req.params.id],
    );

    if (!plan) return res.status(404).json({ error: 'Journey plan not found' });

    const visits = await all(
      `SELECT v.*, c.name, c.customer_code, c.address, c.contact_number, c.location_route
       FROM visits v
       JOIN customers c ON v.customer_id = c.id
       WHERE v.journey_plan_id = ?
       ORDER BY v.rowid`,
      [plan.id],
    );

    res.json({ ...plan, visits });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Create ─────────────────────────
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  const { route_id, date, assigned_to, customers = [], plan_name } = req.body;

  if (!date) return res.status(400).json({ error: 'date is required' });

  try {
    await exec('BEGIN');

    if (route_id) {
      const route = await get('SELECT * FROM routes WHERE id = ?', [route_id]);
      if (!route) return res.status(404).json({ error: 'Route not found' });

      const existing = await get('SELECT id FROM journey_plans WHERE route_id = ? AND date = ?', [
        route_id,
        date,
      ]);

      if (existing) return res.status(409).json({ error: 'Plan exists' });

      const effectiveAssignedTo = assigned_to || route.primary_employee_id;

      const routeCustomers = await all(
        'SELECT * FROM route_customers WHERE route_id = ? ORDER BY order_index',
        [route_id],
      );

      const jpId = uuidv4();

      await run(
        `INSERT INTO journey_plans (id, plan_name, route_id, assigned_to, date, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          jpId,
          plan_name || route.route_name + ' — ' + date,
          route_id,
          effectiveAssignedTo,
          date,
          'active',
          req.user.id,
        ],
      );

      for (const rc of routeCustomers) {
        await run(
          `INSERT INTO visits (id, journey_plan_id, customer_id, van_sales_user_id, status)
           VALUES (?, ?, ?, ?, ?)`,
          [uuidv4(), jpId, rc.customer_id, effectiveAssignedTo, 'pending'],
        );
      }

      await exec('COMMIT');
      return res.status(201).json({ id: jpId });
    } else {
      if (!assigned_to || !customers.length) {
        return res.status(400).json({ error: 'Invalid direct plan' });
      }

      const jpId = uuidv4();

      await run(
        `INSERT INTO journey_plans (id, plan_name, route_id, assigned_to, date, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          jpId,
          plan_name || 'Journey Plan — ' + date,
          null,
          assigned_to,
          date,
          'active',
          req.user.id,
        ],
      );

      for (let i = 0; i < customers.length; i++) {
        await run(`INSERT INTO journey_plan_customers VALUES (?, ?, ?, ?)`, [
          uuidv4(),
          jpId,
          customers[i],
          i + 1,
        ]);

        await run(`INSERT INTO visits VALUES (?, ?, ?, ?, ?)`, [
          uuidv4(),
          jpId,
          customers[i],
          assigned_to,
          'pending',
        ]);
      }

      await exec('COMMIT');
      return res.status(201).json({ id: jpId });
    }
  } catch (err) {
    await exec('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// ─── Update ─────────────────────────
router.put('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const plan = await get('SELECT * FROM journey_plans WHERE id = ?', [req.params.id]);
    if (!plan) return res.status(404).json({ error: 'Not found' });

    const { date, status, assigned_to, plan_name } = req.body;

    await exec('BEGIN');

    await run(`UPDATE journey_plans SET date=?, status=?, assigned_to=?, plan_name=? WHERE id=?`, [
      date || plan.date,
      status || plan.status,
      assigned_to || plan.assigned_to,
      plan_name ?? plan.plan_name,
      req.params.id,
    ]);

    if (assigned_to && assigned_to !== plan.assigned_to) {
      await run(
        `UPDATE visits SET van_sales_user_id=? WHERE journey_plan_id=? AND status='pending'`,
        [assigned_to, req.params.id],
      );
    }

    await exec('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await exec('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// ─── Delete ─────────────────────────
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const plan = await get('SELECT * FROM journey_plans WHERE id = ?', [req.params.id]);
    if (!plan) return res.status(404).json({ error: 'Not found' });

    await exec('BEGIN');

    await run('DELETE FROM visits WHERE journey_plan_id=?', [req.params.id]);
    await run('DELETE FROM journey_plan_customers WHERE journey_plan_id=?', [req.params.id]);
    await run('DELETE FROM journey_plans WHERE id=?', [req.params.id]);

    await exec('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await exec('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
