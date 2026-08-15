import { ipcMain } from 'electron';
import { getDatabase } from '../database/database.js';
import * as settings from '../database/settings.js';
import * as people from '../database/people.js';

export function register() {
  ipcMain.handle('settings:getAll', () => {
    const db = getDatabase();
    return settings.getAll(db);
  });

  ipcMain.handle('settings:set', (event, key, value) => {
    const db = getDatabase();
    return settings.set(db, key, value);
  });

  ipcMain.handle('settings:renamePerson', (event, id, name) => {
    const db = getDatabase();
    people.rename(db, id, name);
    return settings.getAll(db);
  });
}