import { ipcMain, dialog, app, BrowserWindow } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { closeDatabase, getDatabase } from '../database/database.js';

function dbPath() {
  return path.join(app.getPath('userData'), 'budget-tracker.db');
}

export function register() {
  ipcMain.handle('backup:export', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: 'Backup ExpenShare Data',
      defaultPath: `budget-tracker-backup-${new Date().toISOString().slice(0, 10)}.db`,
      filters: [{ name: 'ExpenShare Backup', extensions: ['db'] }],
    });
    if (canceled || !filePath) return { canceled: true };

    const sourcePath = dbPath();

    // Ensure source exists; if not, create an empty DB by opening and closing it.
    if (!fs.existsSync(sourcePath)) {
      // Create the DB (and its directory) if it doesn't exist.
      getDatabase();
      closeDatabase();
    }

    try {
      // If DB is open, flush the WAL to the main file for a consistent copy.
      const db = getDatabase(); // opens if closed
      db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
    } catch (err) {
      console.error('Failed to checkpoint DB before backup:', err);
    }

    // Close the database so we can safely copy the file.
    closeDatabase();

    try {
      fs.copyFileSync(sourcePath, filePath);
    } catch (err) {
      console.error('Failed to copy database file:', err);
      // Reopen the DB before returning.
      getDatabase();
      return { canceled: false, error: true };
    }

    // Reopen the database.
    getDatabase();
    return { canceled: false, filePath };
  });

  ipcMain.handle('backup:restore', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Restore ExpenShare Data',
      properties: ['openFile'],
      filters: [{ name: 'ExpenShare Backup', extensions: ['db'] }],
    });
    if (canceled || filePaths.length === 0) return { canceled: true };

    // Close the database before overwriting.
    closeDatabase();

    const targetPath = dbPath();
    try {
      fs.copyFileSync(filePaths[0], targetPath);
    } catch (err) {
      console.error('Failed to restore database:', err);
      // Reopen the original DB (if any) or create a new one.
      getDatabase();
      return { canceled: false, error: true };
    }

    // Reopen the restored database (migrations will run automatically).
    getDatabase();
    return { canceled: false, restarted: true };
  });
}