const path = require('node:path');
const { app, BrowserWindow } = require('electron');
const { getDatabase, closeDatabase } = require('./database/database');

const incomeIpc = require('./ipc/income.ipc');
const expensesIpc = require('./ipc/expenses.ipc');
const dashboardIpc = require('./ipc/dashboard.ipc');
const extraBudgetIpc = require('./ipc/extraBudget.ipc');
const settingsIpc = require('./ipc/settings.ipc');
const reportsIpc = require('./ipc/reports.ipc');
const backupIpc = require('./ipc/backup.ipc');

// Vite-injected globals for the renderer bundle (provided by
// @electron-forge/plugin-vite at build time).
/* global MAIN_WINDOW_VITE_DEV_SERVER_URL, MAIN_WINDOW_VITE_NAME */

if (require('electron-squirrel-startup')) {
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
      preload: path.join(__dirname, '../preload/preload.js'),
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
