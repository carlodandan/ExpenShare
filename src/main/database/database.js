const path = require('node:path');
const fs = require('node:fs');
const { app } = require('electron');
const Database = require('better-sqlite3');
const { runMigrations } = require('./migrations');

let db = null;

/**
 * Opens (or creates) the SQLite database in Electron's userData directory,
 * runs any pending migrations, and seeds default reference data.
 * Safe to call multiple times; returns the existing connection if already open.
 */
function getDatabase() {
  if (db) return db;

  const userDataDir = app.getPath('userData');
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  const dbPath = path.join(userDataDir, 'budget-tracker.db');
  db = new Database(dbPath);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  runMigrations(db);

  return db;
}

function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDatabase, closeDatabase };
