import * as income from './income.js';
import * as expenses from './expenses.js';
import * as extraBudget from './extraBudget.js';

export function getMonthly(db, month) {
  const grossMinor = income.totalForMonth(db, month);
  const expensesMinor = expenses.totalForMonth(db, month);
  const netMinor = grossMinor - expensesMinor;

  const history = extraBudget.computeHistory(db);
  const monthEntry = history.monthly.find((m) => m.month === month) || null;

  return {
    month,
    grossMinor,
    expensesMinor,
    netMinor,
    income: income.listForMonth(db, month),
    expenseCategories: expenses.listForMonth(db, month),
    extraBudget: {
      usedMinor: monthEntry ? monthEntry.withdrawalsMinor : 0,
      shortfallMinor: monthEntry ? monthEntry.shortfallMinor : 0,
      runningBalanceMinor: monthEntry ? monthEntry.runningBalanceMinor : history.balanceMinor,
    },
  };
}

export function getTotal(db) {
  const grossMinor = income.totalAllTime(db);
  const expensesMinor = expenses.totalAllTime(db);
  const netMinor = grossMinor - expensesMinor;
  const breakdown = expenses.breakdownAllTime(db);

  const history = extraBudget.computeHistory(db);
  const months = history.monthly;

  const monthlyPerformance = months.map((m) => ({
    month: m.month,
    grossMinor: m.grossMinor,
    expensesMinor: m.expensesMinor,
    netMinor: m.netMinor,
  }));

  const analysis = buildAnalysis(months, breakdown);

  return {
    grossMinor,
    expensesMinor,
    netMinor,
    breakdown,
    monthlyPerformance,
    analysis,
    extraBudgetBalanceMinor: history.balanceMinor,
  };
}

function buildAnalysis(months, breakdown) {
  if (months.length === 0) {
    return {
      avgGrossMinor: 0,
      avgExpensesMinor: 0,
      avgNetMinor: 0,
      highestIncomeMonth: null,
      highestExpenseMonth: null,
      largestExpenseCategory: null,
    };
  }

  const sum = (key) => months.reduce((acc, m) => acc + m[key], 0);
  const avgGrossMinor = Math.round(sum('grossMinor') / months.length);
  const avgExpensesMinor = Math.round(sum('expensesMinor') / months.length);
  const avgNetMinor = Math.round(sum('netMinor') / months.length);

  const highestIncomeMonth = months.reduce((a, b) => (b.grossMinor > a.grossMinor ? b : a)).month;
  const highestExpenseMonth = months.reduce((a, b) =>
    b.expensesMinor > a.expensesMinor ? b : a
  ).month;

  const largestExpenseCategory =
    breakdown.length > 0
      ? breakdown.reduce((a, b) => (b.totalMinor > a.totalMinor ? b : a)).name
      : null;

  return {
    avgGrossMinor,
    avgExpensesMinor,
    avgNetMinor,
    highestIncomeMonth,
    highestExpenseMonth,
    largestExpenseCategory,
  };
}