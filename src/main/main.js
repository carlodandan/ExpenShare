import { app, BrowserWindow, autoUpdater, ipcMain } from 'electron';
import { getDatabase, closeDatabase } from './database/database.js';
import { updateElectronApp, UpdateSourceType, makeUserNotifier } from "update-electron-app";
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

updateElectronApp({
    updateSource: {
        type: UpdateSourceType.ElectronPublicUpdateService,
        repo: 'carlodandan/ExpenShare'
    },
    updateInterval: '5 minutes',
    logger: require('electron-log'),
    notifyUser: false
});

app.setAppUserModelId("com.budget.tracker.desktop");

let mainWindow = null;
let updateWindow = null;

function createUpdateWindow() {
  const version = app.getVersion();
  if (updateWindow && !updateWindow.isDestroyed()) {
    updateWindow.focus();
    return;
  }

  updateWindow = new BrowserWindow({
    width: 440,
    height: 300,

    resizable: false,
    minimizable: false,
    maximizable: false,

    modal: true,
    parent: mainWindow,

    autoHideMenuBar: true,

    backgroundColor: '#f7f7f5',

    webPreferences: {
      preload: path.join(__dirname, 'update-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },

    icon: path.join(__dirname, '../../icons/expenshare.ico'),
  });

  updateWindow.loadURL(
    `data:text/html;charset=UTF-8,${encodeURIComponent(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              font-family:
                -apple-system,
                BlinkMacSystemFont,
                "Segoe UI",
                sans-serif;

              background: #f7f7f5;
              color: #222;

              height: 100vh;

              display: flex;
              align-items: center;
              justify-content: center;
            }

            .container {
              width: 100%;
              padding: 32px;
            }

            .icon {
              width: 48px;
              height: 48px;

              border-radius: 12px;

              background: #222;
              color: white;

              display: flex;
              align-items: center;
              justify-content: center;

              font-size: 24px;

              margin-bottom: 20px;
            }

            h1 {
              margin: 0 0 8px;
              font-size: 22px;
              font-weight: 600;
            }

            p {
              margin: 0;
              color: #666;
              line-height: 1.5;
              font-size: 14px;
            }

            .version {
              margin-top: 8px;
              font-size: 13px;
              color: #999;
            }

            .buttons {
              display: flex;
              justify-content: flex-end;
              gap: 10px;

              margin-top: 28px;
            }

            button {
              border: 0;
              border-radius: 8px;

              padding: 10px 16px;

              font-size: 14px;
              cursor: pointer;
            }

            .later {
              background: transparent;
              color: #555;
            }

            .later:hover {
              background: #e9e9e7;
            }

            .restart {
              background: #222;
              color: white;
            }

            .restart:hover {
              background: #333;
            }
          </style>
        </head>

        <body>
          <div class="container">
            <h1>Update Ready</h1>

            <p>
              A new version of ExpenShare has been downloaded
              and is ready to install.
            </p>

            <div class="version">
              Version ${version}
            </div>

            <div class="buttons">
              <button class="later" id="later">
                Later
              </button>

              <button class="restart" id="restart">
                Restart & Update
              </button>
            </div>

          </div>

          <script>
            document
              .getElementById('later')
              .addEventListener('click', () => {
                window.updateAPI.close();
              });

            document
              .getElementById('restart')
              .addEventListener('click', () => {
                window.updateAPI.restart();
              });
          </script>
        </body>
      </html>
    `)}`
  );

  updateWindow.on('closed', () => {
    updateWindow = null;
  });
}

function createWindow() {
  const isDev = !!MAIN_WINDOW_VITE_DEV_SERVER_URL;

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,

    autoHideMenuBar: !isDev,

    backgroundColor: '#f7f7f5',

    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      sandbox: true,
    },

    icon: path.join(__dirname, '../../icons/expenshare.ico'),
  });

  if (isDev) {
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

ipcMain.on('update-window-close', () => {
  if (updateWindow && !updateWindow.isDestroyed()) {
    updateWindow.close();
  }
});

ipcMain.on('update-window-restart', () => {
  if (updateWindow && !updateWindow.isDestroyed()) {
    updateWindow.close();
  }

  autoUpdater.quitAndInstall();
});

autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
  const version = app.getVersion();

  createUpdateWindow(releaseName || version);
});

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