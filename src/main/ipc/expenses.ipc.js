import { ipcMain } from 'electron';
import { getDatabase } from '../database/database.js';
import * as expenses from '../database/expenses.js';

export function register() {
  ipcMain.handle('expenses:listCategories', () => {
    const db = getDatabase();
    return expenses.listCategories(db);
  });

  ipcMain.handle('expenses:listForMonth', (event, month) => {
    const db = getDatabase();
    return expenses.listForMonth(db, month);
  });

  ipcMain.handle('expenses:create', (event, payload) => {
    const db = getDatabase();
    return expenses.create(db, payload);
  });

  ipcMain.handle('expenses:setFixedForMonth', (event, payload) => {
    const db = getDatabase();
    return expenses.setFixedForMonth(db, payload);
  });

  ipcMain.handle('expenses:update', (event, id, payload) => {
    const db = getDatabase();
    return expenses.update(db, id, payload);
  });

  ipcMain.handle('expenses:delete', (event, id) => {
    const db = getDatabase();
    return expenses.remove(db, id);
  });
}