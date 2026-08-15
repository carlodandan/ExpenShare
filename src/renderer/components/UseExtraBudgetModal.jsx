import React, { useState } from 'react';
import { toMinorUnits, currentMonthKey, formatMoney } from '../utils/format.js';
import { useAppContext } from '../hooks/AppContext.jsx';

export default function UseExtraBudgetModal({ availableMinor, onCancel, onSubmit }) {
  const { currencySymbol } = useAppContext();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [month, setMonth] = useState(currentMonthKey());
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const amountMinor = toMinorUnits(amount);

    if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }
    if (amountMinor > availableMinor) {
      setError('Amount cannot exceed the available Extra Budget.');
      return;
    }
    if (!month) {
      setError('Please choose a month to apply this to.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ amountMinor, description: reason, month });
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-line bg-surface p-5 shadow-lg"
      >
        <h2 className="text-sm font-semibold">Use Extra Budget</h2>
        <p className="mt-1 text-xs text-ink-muted">
          Available: <span className="tabular">{formatMoney(availableMinor, currencySymbol)}</span>
        </p>

        <label className="mt-4 block text-xs font-medium text-ink-muted" htmlFor="wd-amount">
          Amount
        </label>
        <input
          id="wd-amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="tabular mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm"
        />

        <label className="mt-3 block text-xs font-medium text-ink-muted" htmlFor="wd-reason">
          Reason
        </label>
        <input
          id="wd-reason"
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Emergency expense"
          className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm"
        />

        <label className="mt-3 block text-xs font-medium text-ink-muted" htmlFor="wd-month">
          Apply to month
        </label>
        <input
          id="wd-month"
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="tabular mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm"
        />

        {error && <p className="mt-3 text-sm text-rust">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-line px-3 py-1.5 text-sm hover:bg-paper"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-denim px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            Confirm
          </button>
        </div>
      </form>
    </div>
  );
}
