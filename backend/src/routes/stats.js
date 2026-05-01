const router = require('express').Router();
const { get, all, run, exec } = require('../db/helper');
const { authenticate, requireRole } = require('../middleware/auth');

// Admin dashboard stats
router.get('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const totalRoutes = (await get('SELECT COUNT(*) AS c FROM routes')).c;
    const activeRoutes = (await get("SELECT COUNT(*) AS c FROM routes WHERE status = 'active'")).c;
    const totalCustomers = (await get('SELECT COUNT(*) AS c FROM customers')).c;
    const totalUsers = (await get("SELECT COUNT(*) AS c FROM users WHERE role = 'van_sales_user'"))
      .c;
    const totalJourneyPlans = (await get('SELECT COUNT(*) AS c FROM journey_plans')).c;
    const todayPlans = (
      await get("SELECT COUNT(*) AS c FROM journey_plans WHERE date = ? AND status = 'active'", [
        today,
      ])
    ).c;
    const totalVisits = (await get('SELECT COUNT(*) AS c FROM visits')).c;
    const completedVisits = (
      await get("SELECT COUNT(*) AS c FROM visits WHERE status = 'complete'")
    ).c;
    const pendingVisits = (await get("SELECT COUNT(*) AS c FROM visits WHERE status = 'pending'"))
      .c;

    res.json({
      routes: { total: totalRoutes, active: activeRoutes },
      customers: { total: totalCustomers },
      van_sales_users: { total: totalUsers },
      journey_plans: { total: totalJourneyPlans, today: todayPlans },
      visits: { total: totalVisits, completed: completedVisits, pending: pendingVisits },
    });
  } catch (err) {
    console.error('[GET /stats]', err.message);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
