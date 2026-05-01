const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { get, all, run, exec } = require('../db/helper');
const { authenticate, requireRole } = require('../middleware/auth');

// ─── List users ─────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const { role } = req.query;

    const rows = role
      ? await all('SELECT id, username, name, role, phone, created_at FROM users WHERE role = ?', [
          role,
        ])
      : await all('SELECT id, username, name, role, phone, created_at FROM users');

    res.json(rows);
  } catch (err) {
    console.error('[GET /users]', err.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ─── Get single user ─────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await get(
      'SELECT id, username, name, role, phone, created_at FROM users WHERE id = ?',
      [req.params.id],
    );

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);
  } catch (err) {
    console.error('[GET /users/:id]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Create user ─────────────────────────
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { username, password, name, role, phone } = req.body;

    if (!username || !password || !name || !role) {
      return res.status(400).json({ error: 'username, password, name, role required' });
    }

    if (!['admin', 'van_sales_user'].includes(role)) {
      return res.status(400).json({ error: 'role must be admin or van_sales_user' });
    }

    const id = uuidv4();
    const password_hash = bcrypt.hashSync(password, 10);

    await run(
      'INSERT INTO users (id, username, password_hash, name, role, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [id, username, password_hash, name, role, phone || null],
    );

    res.status(201).json({ id, username, name, role });
  } catch (err) {
    console.error('[POST /users]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Update user ─────────────────────────
router.put('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const existing = await get('SELECT * FROM users WHERE id = ?', [req.params.id]);

    if (!existing) return res.status(404).json({ error: 'User not found' });

    const { name, phone, password } = req.body;
    const newHash = password ? bcrypt.hashSync(password, 10) : existing.password_hash;

    await run('UPDATE users SET name = ?, phone = ?, password_hash = ? WHERE id = ?', [
      name || existing.name,
      phone !== undefined ? phone : existing.phone,
      newHash,
      req.params.id,
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error('[PUT /users/:id]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Delete user ─────────────────────────
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const existing = await get('SELECT * FROM users WHERE id = ?', [req.params.id]);

    if (!existing) return res.status(404).json({ error: 'User not found' });

    await run('DELETE FROM users WHERE id = ?', [req.params.id]);

    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE /users/:id]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
