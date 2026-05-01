const db = require('./index');

function run(sql, params = []) {
  return Promise.resolve(db.ready).then(() => new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) {
        reject(err);
        return;
      }

      resolve({ lastID: this.lastID, changes: this.changes });
    });
  }));
}

function get(sql, params = []) {
  return Promise.resolve(db.ready).then(() => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(row);
    });
  }));
}

function all(sql, params = []) {
  return Promise.resolve(db.ready).then(() => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(rows);
    });
  }));
}

function exec(sql) {
  return Promise.resolve(db.ready).then(() => new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  }));
}

module.exports = { run, get, all, exec };
