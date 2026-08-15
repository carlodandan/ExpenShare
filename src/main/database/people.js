function list(db) {
  return db.prepare('SELECT id, name, sort_order FROM people ORDER BY sort_order').all();
}

function rename(db, id, name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) throw new Error('Name cannot be empty.');
  db.prepare(
    "UPDATE people SET name = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(trimmed, id);
  return db.prepare('SELECT id, name, sort_order FROM people WHERE id = ?').get(id);
}

module.exports = { list, rename };
