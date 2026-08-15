function validate({ categoryId, amountMinor, date }) {
  if (!categoryId) throw new Error('Category is required.');
  if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
    throw new Error('Amount must be greater than zero.');
  }
  if (!date || Number.isNaN(Date.parse(date))) {
    throw new Error('A valid date is required.');
  }
}

export function listCategories(db) {
  return db
    .prepare(
      `SELECT id, name, type, is_active AS isActive, sort_order AS sortOrder
       FROM expense_categories WHERE is_active = 1 ORDER BY sort_order`
    )
    .all();
}

/**
 * Returns every active category for the given month, each with its total
 * and (for repeatable categories) the individual transactions.
 */
export function listForMonth(db, month) {
  const categories = listCategories(db);
  const totalsStmt = db.prepare(
    `SELECT COALESCE(SUM(amount_minor), 0) AS total FROM expenses
     WHERE category_id = ? AND substr(date, 1, 7) = ?`
  );
  const transactionsStmt = db.prepare(
    `SELECT id, category_id AS categoryId, amount_minor AS amountMinor, description, date,
            created_at AS createdAt
     FROM expenses WHERE category_id = ? AND substr(date, 1, 7) = ?
     ORDER BY date ASC, id ASC`
  );

  return categories.map((category) => {
    const { total } = totalsStmt.get(category.id, month);
    const transactions =
      category.type === 'repeatable' ? transactionsStmt.all(category.id, month) : transactionsStmt.all(category.id, month);
    return { ...category, totalMinor: total, transactions };
  });
}

export function totalForMonth(db, month) {
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(amount_minor), 0) AS total FROM expenses
       WHERE substr(date, 1, 7) = ?`
    )
    .get(month);
  return row.total;
}

export function create(db, { categoryId, amountMinor, description, date }) {
  validate({ categoryId, amountMinor, date });
  const result = db
    .prepare(
      `INSERT INTO expenses (category_id, amount_minor, description, date)
       VALUES (?, ?, ?, ?)`
    )
    .run(categoryId, amountMinor, description || '', date);
  return db.prepare('SELECT * FROM expenses WHERE id = ?').get(result.lastInsertRowid);
}

/**
 * Fixed categories have a single value per month. This upserts that
 * month's row for the category rather than appending a new transaction,
 * so "fixed" categories never accumulate duplicate rows within a month.
 */
export function setFixedForMonth(db, { categoryId, amountMinor, month }) {
  if (!Number.isFinite(amountMinor) || amountMinor < 0) {
    throw new Error('Amount must be zero or greater.');
  }
  const date = `${month}-01`;
  const existing = db
    .prepare(
      `SELECT id FROM expenses WHERE category_id = ? AND substr(date, 1, 7) = ?`
    )
    .get(categoryId, month);

  if (amountMinor === 0) {
    if (existing) db.prepare('DELETE FROM expenses WHERE id = ?').run(existing.id);
    return null;
  }

  if (existing) {
    db.prepare(
      `UPDATE expenses SET amount_minor = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(amountMinor, existing.id);
    return db.prepare('SELECT * FROM expenses WHERE id = ?').get(existing.id);
  }

  const result = db
    .prepare(
      `INSERT INTO expenses (category_id, amount_minor, description, date) VALUES (?, ?, '', ?)`
    )
    .run(categoryId, amountMinor, date);
  return db.prepare('SELECT * FROM expenses WHERE id = ?').get(result.lastInsertRowid);
}

export function update(db, id, { categoryId, amountMinor, description, date }) {
  validate({ categoryId, amountMinor, date });
  db.prepare(
    `UPDATE expenses SET category_id = ?, amount_minor = ?, description = ?, date = ?,
     updated_at = datetime('now') WHERE id = ?`
  ).run(categoryId, amountMinor, description || '', date, id);
  return db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
}

export function remove(db, id) {
  db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
  return { id };
}

export function totalAllTime(db) {
  const row = db.prepare('SELECT COALESCE(SUM(amount_minor), 0) AS total FROM expenses').get();
  return row.total;
}

/** Category breakdown across all recorded history, for the donut chart. */
export function breakdownAllTime(db) {
  return db
    .prepare(
      `SELECT expense_categories.name AS name,
              COALESCE(SUM(expenses.amount_minor), 0) AS totalMinor
       FROM expense_categories
       LEFT JOIN expenses ON expenses.category_id = expense_categories.id
       WHERE expense_categories.is_active = 1
       GROUP BY expense_categories.id
       ORDER BY totalMinor DESC`
    )
    .all();
}