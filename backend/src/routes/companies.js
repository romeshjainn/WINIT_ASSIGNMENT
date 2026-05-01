const router = require('express').Router();
const { get, all, run, exec } = require('../db/helper');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const companies = await all('SELECT * FROM companies ORDER BY name');

    res.json(companies);
  } catch (err) {
    console.error('Companies fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

module.exports = router;
