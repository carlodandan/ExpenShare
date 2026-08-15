const { monthOf } = require('./money');

function validate({ personId, amountMinor, date }) {
  if (!personId) throw new Error('Person is required.');
  if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
    throw new Error('Amount must be greater than zero.');
  }
  if (!date || Number.isNaN(Date.parse(date))) {
    throw new Error('A valid date is required.');
  }
}

function listForMonth(db, month) {
  return db
    .prepare(
      `SELECT income.id, income.person_id AS personId, people.name AS personName,
              income.amount_minor AS amountMinor, income.description, income.date,
              income.created_at AS createdAt
       FROM income
       JOIN people ON people.id = income.person_id
       WHERE substr(income.date, 1, 7) = ?
       ORDER BY income.date ASC, income.id ASC`
    )
    .all(month);
}

function totalForMonth(db, month) {
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(amount_minor), 0) AS total FROM income
       WHERE substr(date, 1, 7) = ?`
    )
    .get(month);
  return row.total;
}

function create(db, { personId, amountMinor, description, date }) {
  validate({ personId, amountMinor, date });
  const result = db
    .prepare(
      `INSERT INTO income (person_id, amount_minor, description, date)
       VALUES (?, ?, ?, ?)`
    )
    .run(personId, amountMinor, description || '', date);
  return db.prepare('SELECT * FROM income WHERE id = ?').get(result.lastInsertRowid);
}

function update(db, id, { personId, amountMinor, description, date }) {
  validate({ personId, amountMinor, date });
  db.prepare(
    `UPDATE income SET person_id = ?, amount_minor = ?, description = ?, date = ?,
     updated_at = datetime('now') WHERE id = ?`
  ).run(personId, amountMinor, description || '', date, id);
  return db.prepare('SELECT * FROM income WHERE id = ?').get(id);
}

function remove(db, id) {
  db.prepare('DELETE FROM income WHERE id = ?').run(id);
  return { id };
}

/** All-time total, used by the Total Dashboard. */
function totalAllTime(db) {
  const row = db.prepare('SELECT COALESCE(SUM(amount_minor), 0) AS total FROM income').get();
  return row.total;
}

module.exports = { listForMonth, totalForMonth, create, update, remove, totalAllTime, monthOf };
