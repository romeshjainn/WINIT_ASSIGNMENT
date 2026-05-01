const db = require('./src/db/index');
const bcrypt = require('bcryptjs');

const password = 'Password@123';
const hash = bcrypt.hashSync(password, 10);

// check tables
db.all(`SELECT name FROM sqlite_master WHERE type='table'`, [], (err, tables) => {
  if (err) {
    console.error('Error fetching tables:', err.message);
    return;
  }

  console.log('Tables:', tables);

  // update users
  db.run(`UPDATE users SET password_hash = ?`, [hash], function (err) {
    if (err) {
      console.error('Update failed:', err.message);
    } else {
      console.log('✅ All users updated');
      console.log('👉 Password for all users: Password@123');
    }
  });
});
