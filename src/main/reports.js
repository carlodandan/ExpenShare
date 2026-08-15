import fs from 'node:fs';
import PDFDocument from 'pdfkit';
import * as dashboard from './database/dashboard.js';
import { toMajorUnits } from './database/money.js';

function money(minor, symbol = '₱') {
  return `${symbol}${toMajorUnits(minor).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function monthLabel(month) {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function buildCsv(db, month, symbol) {
  const data = dashboard.getMonthly(db, month);
  const lines = [];
  lines.push(`Budget Report,${monthLabel(month)}`);
  lines.push('');
  lines.push('INCOME');
  lines.push('Person,Description,Date,Amount');
  data.income.forEach((tx) => {
    lines.push([tx.personName, csvSafe(tx.description), tx.date, toMajorUnits(tx.amountMinor)].join(','));
  });
  lines.push(`,,TOTAL GROSS,${toMajorUnits(data.grossMinor)}`);
  lines.push('');
  lines.push('EXPENSES');
  lines.push('Category,Description,Date,Amount');
  data.expenseCategories.forEach((cat) => {
    if (cat.type === 'fixed') {
      lines.push([cat.name, '', '', toMajorUnits(cat.totalMinor)].join(','));
    } else {
      cat.transactions.forEach((tx) => {
        lines.push([cat.name, csvSafe(tx.description), tx.date, toMajorUnits(tx.amountMinor)].join(','));
      });
      if (cat.transactions.length === 0) {
        lines.push([cat.name, '', '', 0].join(','));
      }
    }
  });
  lines.push(`,,TOTAL EXPENSES,${toMajorUnits(data.expensesMinor)}`);
  lines.push('');
  lines.push(`,,NET,${toMajorUnits(data.netMinor)}`);
  lines.push('');
  lines.push('EXTRA BUDGET');
  lines.push(`,,Used this month,${toMajorUnits(data.extraBudget.usedMinor)}`);
  lines.push(`,,Remaining balance,${toMajorUnits(data.extraBudget.runningBalanceMinor)}`);
  if (data.extraBudget.shortfallMinor > 0) {
    lines.push(`,,Shortfall,${toMajorUnits(data.extraBudget.shortfallMinor)}`);
  }
  return lines.join('\n');
}

function csvSafe(value) {
  const v = String(value ?? '');
  return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
}

function buildPdf(db, month, symbol, outputPath) {
  const data = dashboard.getMonthly(db, month);
  const doc = new PDFDocument({ margin: 50 });
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  doc.fontSize(18).text('Budget Report', { align: 'left' });
  doc.fontSize(12).fillColor('#666').text(monthLabel(month));
  doc.moveDown();

  doc.fillColor('#000').fontSize(14).text('Income');
  doc.moveDown(0.3);
  const byPerson = {};
  data.income.forEach((tx) => {
    byPerson[tx.personName] = byPerson[tx.personName] || [];
    byPerson[tx.personName].push(tx);
  });
  Object.entries(byPerson).forEach(([person, txs]) => {
    doc.fontSize(11).text(person, { continued: false });
    txs.forEach((tx) => {
      doc
        .fontSize(10)
        .fillColor('#333')
        .text(`  ${tx.description || 'Income'} — ${money(tx.amountMinor, symbol)}  (${tx.date})`);
    });
    doc.fillColor('#000');
  });
  doc.moveDown(0.3);
  doc.fontSize(12).text(`TOTAL GROSS: ${money(data.grossMinor, symbol)}`, { underline: true });
  doc.moveDown();

  doc.fontSize(14).text('Expenses');
  doc.moveDown(0.3);
  data.expenseCategories.forEach((cat) => {
    doc.fontSize(11).text(`${cat.name}: ${money(cat.totalMinor, symbol)}`);
    if (cat.type === 'repeatable') {
      cat.transactions.forEach((tx) => {
        doc
          .fontSize(10)
          .fillColor('#333')
          .text(`  ${tx.description || 'Expense'} — ${money(tx.amountMinor, symbol)}  (${tx.date})`);
      });
      doc.fillColor('#000');
    }
  });
  doc.moveDown(0.3);
  doc.fontSize(12).text(`TOTAL EXPENSES: ${money(data.expensesMinor, symbol)}`, { underline: true });
  doc.moveDown();

  doc.fontSize(14).text(`NET: ${money(data.netMinor, symbol)}`);
  doc.moveDown();

  doc.fontSize(14).text('Extra Budget');
  doc.fontSize(11).text(`Used this month: ${money(data.extraBudget.usedMinor, symbol)}`);
  doc.fontSize(11).text(`Remaining balance: ${money(data.extraBudget.runningBalanceMinor, symbol)}`);
  if (data.extraBudget.shortfallMinor > 0) {
    doc.fillColor('#b91c1c').text(`Shortfall: ${money(data.extraBudget.shortfallMinor, symbol)}`);
    doc.fillColor('#000');
  }

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
}

export { buildCsv, buildPdf };