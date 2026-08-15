import { app, BrowserWindow } from 'electron';
import { getDatabase, closeDatabase } from './database/database.js';
import path from 'path';

import * as incomeIpc from './ipc/income.ipc.js';
import * as expensesIpc from './ipc/expenses.ipc.js';
import * as dashboardIpc from './ipc/dashboard.ipc.js';
import * as extraBudgetIpc from './ipc/extraBudget.ipc.js';
import * as settingsIpc from './ipc/settings.ipc.js';
import * as reportsIpc from './ipc/reports.ipc.js';
import * as backupIpc from './ipc/backup.ipc.js';

import squirrelStartup from 'electron-squirrel-startup';
if (squirrelStartup) {
  app.quit();
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#f7f7f5',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }
}

function registerIpcHandlers() {
  incomeIpc.register();
  expensesIpc.register();
  dashboardIpc.register();
  extraBudgetIpc.register();
  settingsIpc.register();
  reportsIpc.register();
  backupIpc.register();
}

app.whenReady().then(() => {
  // Initializes the DB, runs migrations, and seeds defaults on first launch.
  getDatabase();
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    closeDatabase();
    app.quit();
  }
});

app.on('before-quit', () => {
  closeDatabase();
});