/**
 * All monetary values are stored and passed across IPC as integer minor
 * units (centavos for PHP: ₱1.00 = 100 minor units) to avoid floating
 * point currency errors. The renderer only ever deals in these integers
 * plus a display formatter - it never does float math on money.
 */

function toMinorUnits(majorAmount) {
  // Round to the nearest centavo before converting, so 12.345 -> 1235,
  // not a truncated / drifting value.
  return Math.round(Number(majorAmount) * 100);
}

function toMajorUnits(minorAmount) {
  return Number(minorAmount) / 100;
}

/** Returns the 'YYYY-MM' month key for a 'YYYY-MM-DD...' date string. */
function monthOf(dateStr) {
  return String(dateStr).slice(0, 7);
}

/** Adds `delta` calendar months to a 'YYYY-MM' key, e.g. addMonths('2026-01', -1) -> '2025-12'. */
function addMonths(monthKey, delta) {
  const [y, m] = monthKey.split('-').map(Number);
  const total = y * 12 + (m - 1) + delta;
  const newY = Math.floor(total / 12);
  const newM = (total % 12) + 1;
  return `${newY}-${String(newM).padStart(2, '0')}`;
}

module.exports = { toMinorUnits, toMajorUnits, monthOf, addMonths };
