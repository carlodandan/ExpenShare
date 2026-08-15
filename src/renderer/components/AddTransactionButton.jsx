import React, { useEffect, useRef, useState } from 'react';

export default function AddTransactionButton({ onAddIncome, onAddExpense }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-md bg-moss text-lg leading-none text-white hover:opacity-90"
        title="Add transaction"
      >
        +
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-md border border-line bg-surface shadow-md"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onAddIncome();
            }}
            className="block w-full px-3 py-2 text-left text-sm hover:bg-paper"
          >
            + Income
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onAddExpense();
            }}
            className="block w-full px-3 py-2 text-left text-sm hover:bg-paper"
          >
            + Expense
          </button>
        </div>
      )}
    </div>
  );
}
