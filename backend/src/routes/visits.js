const router = require('express').Router();
const { get, all, run, exec } = require('../db/helper');
const { authenticate } = require('../middleware/auth');

const VALID_STATUSES = ['pending', 'complete', 'missed', 'zero_sales'];

async function getVisit(id) {
  return await get('SELECT * FROM visits WHERE id = ?', [id]);
}

// GET visits for a journey plan
router.get('/', authenticate, async (req, res) => {
  try {
    const { journey_plan_id } = req.query;

    if (!journey_plan_id) {
      return res.status(400).json({ error: 'journey_plan_id required' });
    }

    const rows = await all(
      `SELECT v.*, c.name, c.customer_code, c.address, c.contact_number, c.location_route
       FROM visits v
       JOIN customers c ON v.customer_id = c.id
       WHERE v.journey_plan_id = ?
       ORDER BY v.rowid`,
      [journey_plan_id],
    );

    res.json(rows);
  } catch (err) {
    console.error('[GET /visits]', err.message);
    res.status(500).json({ error: 'Failed to fetch visits' });
  }
});

// Mark visit complete
router.put('/:id/complete', authenticate, async (req, res) => {
  try {
    const visit = await getVisit(req.params.id);
    if (!visit) return res.status(404).json({ error: 'Visit not found' });

    await run(
      `UPDATE visits
       SET status = 'complete', visited_at = datetime('now')
       WHERE id = ?`,
      [req.params.id],
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update notes
router.put('/:id/notes', authenticate, async (req, res) => {
  try {
    const { notes } = req.body;
    if (notes === undefined) return res.status(400).json({ error: 'notes required' });

    const visit = await getVisit(req.params.id);
    if (!visit) return res.status(404).json({ error: 'Visit not found' });

    await run('UPDATE visits SET notes = ? WHERE id = ?', [notes, req.params.id]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sales order
router.put('/:id/sales-order', authenticate, async (req, res) => {
  try {
    const { sales_order } = req.body;
    if (sales_order === undefined) {
      return res.status(400).json({ error: 'sales_order required' });
    }

    const visit = await getVisit(req.params.id);
    if (!visit) return res.status(404).json({ error: 'Visit not found' });

    await run('UPDATE visits SET sales_order = ? WHERE id = ?', [sales_order, req.params.id]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generic status update
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `status must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    const visit = await getVisit(req.params.id);
    if (!visit) return res.status(404).json({ error: 'Visit not found' });

    await run(
      `UPDATE visits
       SET status = ?,
           visited_at = CASE WHEN ? = 'complete' THEN datetime('now') ELSE visited_at END
       WHERE id = ?`,
      [status, status, req.params.id],
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
