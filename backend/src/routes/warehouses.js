const router = require('express').Router();
const { get, all, run, exec } = require('../db/helper');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const { company_id } = req.query;

    const rows = company_id
      ? await all('SELECT * FROM warehouses WHERE company_id = ? ORDER BY name', [company_id])
      : await all('SELECT * FROM warehouses ORDER BY name');

    res.json(rows);
  } catch (err) {
    console.error('[GET /warehouses]', err.message);
    res.status(500).json({ error: 'Failed to fetch warehouses' });
  }
});

module.exports = router;
