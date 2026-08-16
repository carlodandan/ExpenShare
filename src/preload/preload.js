const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  income: {
    listForMonth: (month) => ipcRenderer.invoke('income:listForMonth', month),
    create: (payload) => ipcRenderer.invoke('income:create', payload),
    update: (id, payload) => ipcRenderer.invoke('income:update', id, payload),
    delete: (id) => ipcRenderer.invoke('income:delete', id),
  },
  expenses: {
    listCategories: () => ipcRenderer.invoke('expenses:listCategories'),
    listForMonth: (month) => ipcRenderer.invoke('expenses:listForMonth', month),
    create: (payload) => ipcRenderer.invoke('expenses:create', payload),
    setFixedForMonth: (payload) => ipcRenderer.invoke('expenses:setFixedForMonth', payload),
    update: (id, payload) => ipcRenderer.invoke('expenses:update', id, payload),
    delete: (id) => ipcRenderer.invoke('expenses:delete', id),
  },
  dashboard: {
    getMonthly: (month) => ipcRenderer.invoke('dashboard:getMonthly', month),
    getTotal: () => ipcRenderer.invoke('dashboard:getTotal'),
  },
  extraBudget: {
    getHistory: () => ipcRenderer.invoke('extraBudget:getHistory'),
    listWithdrawals: () => ipcRenderer.invoke('extraBudget:listWithdrawals'),
    withdraw: (payload) => ipcRenderer.invoke('extraBudget:withdraw', payload),
    deleteWithdrawal: (id) => ipcRenderer.invoke('extraBudget:deleteWithdrawal', id),
    withdrawAndExpense: (payload) => ipcRenderer.invoke('extraBudget:withdrawAndExpense', payload),
  },
  settings: {
    getAll: () => ipcRenderer.invoke('settings:getAll'),
    set: (key, value) => ipcRenderer.invoke('settings:set', key, value),
    renamePerson: (id, name) => ipcRenderer.invoke('settings:renamePerson', id, name),
    getVersion: () => ipcRenderer.invoke('settings:getVersion'),
  },
  reports: {
    export: (month, format) => ipcRenderer.invoke('reports:export', { month, format }),
  },
  backup: {
    export: () => ipcRenderer.invoke('backup:export'),
    restore: () => ipcRenderer.invoke('backup:restore'),
  },
  appInfo: {
    getVersion: () => ipcRenderer.invoke('get-app-info'),
  },
});