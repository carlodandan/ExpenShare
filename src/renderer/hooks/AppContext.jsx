import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [dataVersion, setDataVersion] = useState(0);
  const [toast, setToast] = useState(null);

  const refreshSettings = useCallback(async () => {
    const s = await window.api.settings.getAll();
    setSettings(s);
    return s;
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  // Call after any create/update/delete so every page listening on
  // dataVersion refetches - keeps Gross/Net/Total/Extra Budget in sync
  // without a heavier state-management library.
  const notifyDataChanged = useCallback(() => {
    setDataVersion((v) => v + 1);
  }, []);

  const showToast = useCallback((message, tone = 'default') => {
    setToast({ message, tone, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const currencySymbol = settings?.currency_symbol || '₱';
  const people = settings?.people || [];

  return (
    <AppContext.Provider
      value={{
        settings,
        refreshSettings,
        dataVersion,
        notifyDataChanged,
        currencySymbol,
        people,
        toast,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
