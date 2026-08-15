/**
 * Simple versioned migration runner. Each migration is applied at most once,
 * tracked in schema_migrations, and executed inside a transaction so a
 * failure never leaves the schema half-updated.
 */
const MIGRATIONS = [
  {
    version: 1,
    name: 'initial_schema',
    up(db) {
      db.exec(`
        CREATE TABLE people (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE income (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
          amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
          description TEXT NOT NULL DEFAULT '',
          date TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX idx_income_date ON income(date);
        CREATE INDEX idx_income_person_id ON income(person_id);

        CREATE TABLE expense_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          type TEXT NOT NULL CHECK (type IN ('fixed', 'repeatable')),
          is_active INTEGER NOT NULL DEFAULT 1,
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category_id INTEGER NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,
          amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
          description TEXT NOT NULL DEFAULT '',
          date TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX idx_expenses_date ON expenses(date);
        CREATE INDEX idx_expenses_category_id ON expenses(category_id);

        CREATE TABLE extra_budget_transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL CHECK (type IN ('withdrawal', 'adjustment')),
          amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
          description TEXT NOT NULL DEFAULT '',
          month TEXT NOT NULL,
          date TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX idx_extra_budget_date ON extra_budget_transactions(date);
        CREATE INDEX idx_extra_budget_month ON extra_budget_transactions(month);

        CREATE TABLE settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);
    },
  },
  {
    version: 2,
    name: 'seed_defaults',
    up(db) {
      const insertPerson = db.prepare(
        'INSERT INTO people (name, sort_order) VALUES (?, ?)'
      );
      insertPerson.run('P1', 1);
      insertPerson.run('P2', 2);

      const insertCategory = db.prepare(
        'INSERT INTO expense_categories (name, type, sort_order) VALUES (?, ?, ?)'
      );
      const defaults = [
        ['Electricity', 'fixed'],
        ['Water', 'fixed'],
        ['Internet', 'fixed'],
        ['Savings', 'fixed'],
        ['Groceries', 'repeatable'],
        ['Miscellaneous', 'repeatable'],
      ];
      defaults.forEach(([name, type], i) => insertCategory.run(name, type, i + 1));

      const insertSetting = db.prepare(
        'INSERT INTO settings (key, value) VALUES (?, ?)'
      );
      insertSetting.run('currency', 'PHP');
      insertSetting.run('currency_symbol', '₱');
    },
  },
];

function runMigrations(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const appliedVersions = new Set(
    db.prepare('SELECT version FROM schema_migrations').all().map((r) => r.version)
  );

  for (const migration of MIGRATIONS) {
    if (appliedVersions.has(migration.version)) continue;

    // node:sqlite's DatabaseSync has no db.transaction() helper (unlike
    // better-sqlite3), so we wrap each migration in an explicit transaction
    // by hand to keep the same "all or nothing" guarantee.
    db.exec('BEGIN');
    try {
      migration.up(db);
      db.prepare(
        'INSERT INTO schema_migrations (version, name) VALUES (?, ?)'
      ).run(migration.version, migration.name);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }
}

module.exports = { runMigrations, MIGRATIONS };