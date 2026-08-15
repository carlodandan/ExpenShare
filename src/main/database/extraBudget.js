const { monthOf } = require('./money');

/**
 * The Extra Budget balance is never stored directly - it is always
 * recomputed from the underlying income, expense, and extra-budget
 * transaction history (see spec rule: "deterministic from stored
 * transactions"). This walks every month that has any activity, in
 * chronological order, accumulating:
 *
 *   balance += monthlyNet(month)
 *   balance += adjustments(month)
 *   balance -= withdrawals(month)
 *
 * Extra Budget cannot go negative: if a month's net (or withdrawal) would
 * push it below zero, the balance floors at 0 and the shortfall for that
 * month is reported separately rather than hidden.
 */
function computeHistory(db) {
  const months = db
    .prepare(
      `SELECT DISTINCT month FROM (
         SELECT substr(date, 1, 7) AS month FROM income
         UNION
         SELECT substr(date, 1, 7) AS month FROM expenses
         UNION
         SELECT month FROM extra_budget_transactions
       ) ORDER BY month ASC`
    )
    .all()
    .map((r) => r.month);

  const grossStmt = db.prepare(
    `SELECT COALESCE(SUM(amount_minor), 0) AS total FROM income WHERE substr(date, 1, 7) = ?`
  );
  const expenseStmt = db.prepare(
    `SELECT COALESCE(SUM(amount_minor), 0) AS total FROM expenses WHERE substr(date, 1, 7) = ?`
  );
  const withdrawalStmt = db.prepare(
    `SELECT COALESCE(SUM(amount_minor), 0) AS total FROM extra_budget_transactions
     WHERE type = 'withdrawal' AND month = ?`
  );
  const adjustmentStmt = db.prepare(
    `SELECT COALESCE(SUM(amount_minor), 0) AS total FROM extra_budget_transactions
     WHERE type = 'adjustment' AND month = ?`
  );

  let balance = 0;
  const monthly = [];

  for (const month of months) {
    const gross = grossStmt.get(month).total;
    const expensesTotal = expenseStmt.get(month).total;
    const netMinor = gross - expensesTotal;
    const withdrawalsMinor = withdrawalStmt.get(month).total;
    const adjustmentsMinor = adjustmentStmt.get(month).total;

    const beforeFloor = balance + netMinor + adjustmentsMinor - withdrawalsMinor;
    const shortfallMinor = beforeFloor < 0 ? -beforeFloor : 0;
    balance = Math.max(0, beforeFloor);

    monthly.push({
      month,
      grossMinor: gross,
      expensesMinor: expensesTotal,
      netMinor,
      withdrawalsMinor,
      adjustmentsMinor,
      shortfallMinor,
      runningBalanceMinor: balance,
    });
  }

  return { balanceMinor: balance, monthly };
}

function getBalance(db) {
  return computeHistory(db).balanceMinor;
}

function listWithdrawals(db) {
  return db
    .prepare(
      `SELECT id, amount_minor AS amountMinor, description, month, date, created_at AS createdAt
       FROM extra_budget_transactions WHERE type = 'withdrawal' ORDER BY date DESC, id DESC`
    )
    .all();
}

function withdraw(db, { amountMinor, description, month, date }) {
  if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
    throw new Error('Amount must be greater than zero.');
  }
  if (!/^\d{4}-\d{2}$/.test(String(month))) {
    throw new Error('A valid month is required.');
  }
  const available = getBalance(db);
  if (amountMinor > available) {
    throw new Error('Amount cannot exceed the available Extra Budget.');
  }

  const result = db
    .prepare(
      `INSERT INTO extra_budget_transactions (type, amount_minor, description, month, date)
       VALUES ('withdrawal', ?, ?, ?, ?)`
    )
    .run(amountMinor, description || '', month, date || `${month}-01`);

  return db
    .prepare('SELECT * FROM extra_budget_transactions WHERE id = ?')
    .get(result.lastInsertRowid);
}

function removeWithdrawal(db, id) {
  db.prepare("DELETE FROM extra_budget_transactions WHERE id = ? AND type = 'withdrawal'").run(id);
  return { id };
}

module.exports = { computeHistory, getBalance, listWithdrawals, withdraw, removeWithdrawal, monthOf };
