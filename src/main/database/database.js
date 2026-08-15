import path from 'node:path';
import fs from 'node:fs';
import { app } from 'electron';
import { DatabaseSync } from 'node:sqlite';
import { runMigrations } from './migrations.js';

let db = null;

/**
 * Opens (or creates) the SQLite database in Electron's userData directory,
 * runs any pending migrations, and seeds default reference data.
 * Safe to call multiple times; returns the existing connection if already open.
 */
export function getDatabase() {
  if (db) return db;

  const userDataDir = app.getPath('userData');
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }

  const dbPath = path.join(userDataDir, 'budget-tracker.db');
  db = new DatabaseSync(dbPath);

  // node:sqlite's DatabaseSync has no .pragma() helper (unlike
  // better-sqlite3) - pragmas are just run as plain SQL via .exec().
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');

  runMigrations(db);

  return db;
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}