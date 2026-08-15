import { ipcMain } from 'electron';
import { getDatabase } from '../database/database.js';
import * as income from '../database/income.js';

export function register() {
  ipcMain.handle('income:listForMonth', (event, month) => {
    const db = getDatabase();
    return income.listForMonth(db, month);
  });

  ipcMain.handle('income:create', (event, payload) => {
    const db = getDatabase();
    return income.create(db, payload);
  });

  ipcMain.handle('income:update', (event, id, payload) => {
    const db = getDatabase();
    return income.update(db, id, payload);
  });

  ipcMain.handle('income:delete', (event, id) => {
    const db = getDatabase();
    return income.remove(db, id);
  });
}