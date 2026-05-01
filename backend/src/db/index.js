const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../db.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ DB connection failed:', err.message);
  } else {
    console.log('✅ Connected to SQLite DB');
  }
});

// helper
function runExec(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// 🔥 IMPORTANT: run init but NEVER block server start
(async () => {
  try {
    await runExec('PRAGMA journal_mode = WAL');
    await runExec('PRAGMA foreign_keys = ON');

    const schemaPath = path.join(__dirname, 'schema.sql');

    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await runExec(schema);
    }

    const safeAlter = async (sql) => {
      try {
        await runExec(sql);
      } catch (_) {}
    };

    await safeAlter('ALTER TABLE customers ADD COLUMN contact_number TEXT');
    await safeAlter('ALTER TABLE customers ADD COLUMN location_route TEXT');

    await safeAlter('ALTER TABLE warehouses ADD COLUMN address TEXT');
    await safeAlter('ALTER TABLE warehouses ADD COLUMN city TEXT');
    await safeAlter('ALTER TABLE warehouses ADD COLUMN state TEXT');

    await safeAlter('ALTER TABLE users ADD COLUMN phone TEXT');

    await runExec(`
      CREATE TABLE IF NOT EXISTS journey_plan_customers (
        id TEXT PRIMARY KEY,
        journey_plan_id TEXT NOT NULL,
        customer_id TEXT NOT NULL,
        order_index INTEGER DEFAULT 0,
        FOREIGN KEY (journey_plan_id) REFERENCES journey_plans(id) ON DELETE CASCADE,
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      )
    `);

    console.log('✅ DB ready');
  } catch (e) {
    console.error('❌ DB init error:', e.message);
  }
})();

module.exports = db;
