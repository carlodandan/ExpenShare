const { ipcMain, dialog, BrowserWindow } = require('electron');
const fs = require('node:fs');
const { getDatabase } = require('../database/database');
const { buildCsv, buildPdf } = require('../reports');
const settings = require('../database/settings');

function register() {
  ipcMain.handle('reports:export', async (event, { month, format }) => {
    const db = getDatabase();
    const currentSettings = settings.getAll(db);
    const symbol = currentSettings.currency_symbol || '₱';

    const win = BrowserWindow.fromWebContents(event.sender);
    const extension = format === 'pdf' ? 'pdf' : 'csv';
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: 'Export Budget Report',
      defaultPath: `budget-report-${month}.${extension}`,
      filters:
        format === 'pdf'
          ? [{ name: 'PDF', extensions: ['pdf'] }]
          : [{ name: 'CSV', extensions: ['csv'] }],
    });

    if (canceled || !filePath) return { canceled: true };

    if (format === 'pdf') {
      await buildPdf(db, month, symbol, filePath);
    } else {
      fs.writeFileSync(filePath, buildCsv(db, month, symbol), 'utf-8');
    }

    return { canceled: false, filePath };
  });
}

module.exports = { register };
