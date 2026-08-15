const { ipcMain, dialog, app, BrowserWindow } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { closeDatabase, getDatabase } = require('../database/database');

function dbPath() {
  return path.join(app.getPath('userData'), 'budget-tracker.db');
}

function register() {
  ipcMain.handle('backup:export', async (event) => {
    // Ensure the DB has been created/opened at least once.
    getDatabase();
    const win = BrowserWindow.fromWebContents(event.sender);
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: 'Backup Budget Tracker Data',
      defaultPath: `budget-tracker-backup-${new Date().toISOString().slice(0, 10)}.db`,
      filters: [{ name: 'Budget Tracker Backup', extensions: ['db'] }],
    });
    if (canceled || !filePath) return { canceled: true };

    fs.copyFileSync(dbPath(), filePath);
    return { canceled: false, filePath };
  });

  ipcMain.handle('backup:restore', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Restore Budget Tracker Data',
      properties: ['openFile'],
      filters: [{ name: 'Budget Tracker Backup', extensions: ['db'] }],
    });
    if (canceled || filePaths.length === 0) return { canceled: true };

    closeDatabase();
    fs.copyFileSync(filePaths[0], dbPath());
    getDatabase(); // reopen + re-run migrations if the backup predates a newer schema
    return { canceled: false, restarted: true };
  });
}

module.exports = { register };
