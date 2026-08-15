import { ipcMain } from 'electron';
import { getDatabase } from '../database/database.js';
import * as extraBudget from '../database/extraBudget.js';
import * as expenses from '../database/expenses.js';

export function register() {
  ipcMain.handle('extraBudget:getHistory', () => {
    const db = getDatabase();
    return extraBudget.computeHistory(db);
  });

  ipcMain.handle('extraBudget:listWithdrawals', () => {
    const db = getDatabase();
    return extraBudget.listWithdrawals(db);
  });

  ipcMain.handle('extraBudget:withdraw', (event, payload) => {
    const db = getDatabase();
    return extraBudget.withdraw(db, payload);
  });

  ipcMain.handle('extraBudget:deleteWithdrawal', (event, id) => {
    const db = getDatabase();
    return extraBudget.removeWithdrawal(db, id);
  });

  // NEW: combined withdrawal + expense creation
  ipcMain.handle('extraBudget:withdrawAndExpense', async (event, { categoryId, amountMinor, description, month, date }) => {
    const db = getDatabase();
    db.exec('BEGIN');
    try {
      // 1. Check available balance
      const balance = extraBudget.getBalance(db);
      if (amountMinor > balance) {
        throw new Error('Insufficient Extra Budget balance.');
      }

      // 2. Insert expense
      const expenseResult = db.prepare(
        `INSERT INTO expenses (category_id, amount_minor, description, date)
         VALUES (?, ?, ?, ?)`
      ).run(categoryId, amountMinor, description || '', date);

      // 3. Insert withdrawal
      const withdrawalResult = db.prepare(
        `INSERT INTO extra_budget_transactions (type, amount_minor, description, month, date)
         VALUES ('withdrawal', ?, ?, ?, ?)`
      ).run(amountMinor, description || '', month, date);

      db.exec('COMMIT');
      return {
        expenseId: expenseResult.lastInsertRowid,
        withdrawalId: withdrawalResult.lastInsertRowid,
      };
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  });
}