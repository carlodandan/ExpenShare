import * as people from './people.js';

export function getAll(db) {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  rows.forEach((r) => {
    settings[r.key] = r.value;
  });
  return { ...settings, people: people.list(db) };
}

export function set(db, key, value) {
  db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(key, String(value));
  return getAll(db);
}