# Budget Tracker

An offline desktop budget tracker for two people sharing a household budget.
Built with Vite + React + Electron (Electron Forge) + Tailwind CSS v4, backed
by a local SQLite database (`better-sqlite3`). No network access, no cloud
services — everything lives in one local `.db` file.

## Stack

- Electron + Electron Forge (packaging)
- Vite (`@electron-forge/plugin-vite`) for main / preload / renderer builds
- React 18, plain JavaScript (no TypeScript)
- Tailwind CSS v4
- SQLite via `better-sqlite3`, accessed only from the main process
- `pdfkit` for PDF report export

## Architecture

```
React Renderer  →  Preload (contextBridge)  →  IPC  →  better-sqlite3  →  SQLite file
```

The renderer never imports `better-sqlite3` or touches Node APIs directly.
`src/preload/preload.js` exposes a narrow `window.api.*` surface
(`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`); all
database work happens in `src/main/database/*.js` and is wired to the
renderer through `src/main/ipc/*.ipc.js`.

```
src/
├── main/
│   ├── database/        # SQLite connection, migrations, repositories
│   ├── ipc/              # ipcMain.handle registrations, one file per domain
│   ├── reports.js        # CSV / PDF report generation
│   └── main.js            # app entry point, window creation
├── preload/
│   └── preload.js        # contextBridge API surface
└── renderer/
    ├── components/        # Sidebar, modals, cards, chart, etc.
    ├── pages/              # MonthlyDashboard, TotalDashboard, ExtraBudget, Settings
    ├── hooks/AppContext.jsx  # settings + refetch-trigger context
    ├── utils/format.js    # money/date formatting (integer-minor-unit safe)
    └── App.jsx
tests/
└── financial.test.js       # gross/expenses/net/extra-budget/CRUD tests (node:test)
```

## Money handling

All amounts are stored and passed across IPC as **integer minor units**
(centavos: ₱1.00 = 100). The renderer only formats these integers for
display (`formatMoney`) and converts user input back to integers on submit
(`toMinorUnits`) — it never performs floating point arithmetic on money.

## Extra Budget model

The Extra Budget balance is **never stored directly**. It's recomputed from
transaction history every time it's needed (`src/main/database/extraBudget.js`):

```
for each month with activity, in order:
  balance += monthlyNet(month) + adjustments(month) - withdrawals(month)
  balance = max(0, balance)   // floors at zero
  shortfall = amount the floor swallowed, reported (never hidden)
```

Extra Budget withdrawals are their own transactions
(`extra_budget_transactions`, `type = 'withdrawal'`) tied to an "apply to
month," never a direct overwrite of a single balance field.

## Getting started

```bash
npm install
npm run start   # launches the Electron app with the Vite dev server
```

Other scripts:

```bash
npm run test     # runs tests/financial.test.js via node:test
npm run package  # packages the app without building installers
npm run build    # builds installers/distributables via Electron Forge
```

> **Native module note:** `better-sqlite3` is a native module. `npm install`
> triggers `electron-rebuild` (see the `postinstall` script) so the compiled
> binary matches Electron's Node/ABI version rather than your system Node's.
> If you ever see a "NODE_MODULE_VERSION mismatch" error, run
> `npx electron-rebuild -f -w better-sqlite3`.

## Data location

The SQLite database lives in Electron's `userData` directory (not inside the
project folder), so it persists across app updates and reinstalls:

- macOS: `~/Library/Application Support/Budget Tracker/budget-tracker.db`
- Windows: `%APPDATA%\Budget Tracker\budget-tracker.db`
- Linux: `~/.config/Budget Tracker/budget-tracker.db`

Use **Settings → Backup Database / Restore Database** to copy this file
elsewhere or restore from a previous copy.

## What's implemented (MVP scope)

- Monthly Dashboard: month navigation, Gross/Net cards, income by person,
  fixed + repeatable expense categories, add/edit/delete for every
  transaction with confirmation on delete, empty states
- Total Dashboard: all-time Gross/Expenses/Net, expense breakdown donut
  chart, sortable monthly performance table, simple analysis (averages,
  highest income/expense month, largest expense category)
- Extra Budget: running balance, monthly contribution history, withdrawal
  history with delete, deficit/shortfall handling that never hides a
  negative month
- Settings: rename P1/P2, change currency, backup/restore the database file
- Monthly report export to PDF and CSV
- Financial-logic test suite covering gross/expenses/net/extra-budget
  accumulation, withdrawal validation, negative-net shortfall handling,
  CRUD, and month filtering

## Design notes

The UI intentionally avoids a "dashboard product" look in favor of a
household-ledger feel: a cool paper background instead of warm cream, three
restrained semantic accents (moss for income/positive, rust for
expenses/negative, denim for Extra Budget), and all monetary figures set in
a tabular monospace so columns of numbers actually line up like a ledger.
