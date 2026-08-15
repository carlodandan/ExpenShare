import { ipcMain } from 'electron';
import { getDatabase } from '../database/database.js';
import * as dashboard from '../database/dashboard.js';

export function register() {
  ipcMain.handle('dashboard:getMonthly', (event, month) => {
    const db = getDatabase();
    return dashboard.getMonthly(db, month);
  });

  ipcMain.handle('dashboard:getTotal', () => {
    const db = getDatabase();
    return dashboard.getTotal(db);
  });
}