import { ipcMain, dialog, BrowserWindow } from 'electron';
import fs from 'node:fs';
import { getDatabase } from '../database/database.js';
import { buildCsv, buildPdf } from '../reports.js';
import * as settings from '../database/settings.js';

export function register() {
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