import React from 'react';
import { formatMoney, formatDateTime } from '../utils/format.js';
import { useAppContext } from '../hooks/AppContext.jsx';
import EmptyState from './EmptyState.jsx';

export default function IncomeSection({ income, onAdd, onEdit, onDelete }) {
  const { currencySymbol } = useAppContext();

  if (income.length === 0) {
    return <EmptyState message="No income recorded for this month." actionLabel="Add Income" onAction={onAdd} />;
  }

  const byPerson = {};
  income.forEach((tx) => {
    byPerson[tx.personId] = byPerson[tx.personId] || { name: tx.personName, items: [], total: 0 };
    byPerson[tx.personId].items.push(tx);
    byPerson[tx.personId].total += tx.amountMinor;
  });

  return (
    <div className="space-y-4">
      {Object.entries(byPerson).map(([personId, group]) => (
        <div key={personId}>
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold">{group.name}</p>
            <p className="tabular text-sm font-semibold">{formatMoney(group.total, currencySymbol)}</p>
          </div>
          <ul className="mt-1 divide-y divide-line">
            {group.items.map((tx) => (
              <li key={tx.id} className="group flex items-center justify-between py-2">
                <div>
                  <p className="text-sm">{tx.description || 'Income'}</p>
                  <p className="text-xs text-ink-muted">{formatDateTime(tx.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular text-sm">{formatMoney(tx.amountMinor, currencySymbol)}</span>
                  <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => onEdit(tx)}
                      className="text-xs text-denim hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(tx)}
                      className="text-xs text-rust hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
