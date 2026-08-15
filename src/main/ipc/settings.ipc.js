const { ipcMain } = require('electron');
const { getDatabase } = require('../database/database');
const settings = require('../database/settings');
const people = require('../database/people');

function register() {
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

module.exports = { register };
