const { ipcMain } = require('electron');
const { getDatabase } = require('../database/database');
const dashboard = require('../database/dashboard');

function register() {
  ipcMain.handle('dashboard:getMonthly', (event, month) => {
    const db = getDatabase();
    return dashboard.getMonthly(db, month);
  });

  ipcMain.handle('dashboard:getTotal', () => {
    const db = getDatabase();
    return dashboard.getTotal(db);
  });
}

module.exports = { register };
