const router = require('express').Router();
const { get, all, run, exec } = require('../db/helper');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const { company_id } = req.query;

    const rows = company_id
      ? await all('SELECT * FROM vehicles WHERE company_id = ? ORDER BY name', [company_id])
      : await all('SELECT * FROM vehicles ORDER BY name');

    res.json(rows);
  } catch (err) {
    console.error('[GET /vehicles]', err.message);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

module.exports = router;
