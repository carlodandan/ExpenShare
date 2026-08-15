import { ipcMain } from 'electron';
import { getDatabase } from '../database/database.js';
import * as extraBudget from '../database/extraBudget.js';

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
}