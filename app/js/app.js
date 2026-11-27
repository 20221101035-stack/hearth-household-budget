// app.js — Hearth's wiring: hash router, month picker, dialogs and events.
// State lives in store.js; pages are rendered by views.js.

import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  loadState,
  saveState,
  buildSampleState,
  emptyState,
  newGoalId,
  newTransactionId,
} from './store.js';
import { dollarsToCents, monthLabel, todayIso } from './format.js';
import {
  drawDashboardCharts,
  drawReportCharts,
  renderBudgets,
  renderDashboard,
  renderGoals,
  renderReports,
  renderTransactions,
} from './views.js';

const view = document.getElementById('view');
const monthLabelEl = document.getElementById('month-label');
const sampleBanner = document.getElementById('sample-banner');

let state = loadState();

// The month on screen. Defaults to November 2026, the sample household's
// current month, so first-time visitors land on a full, realistic month.
let current = { year: 2026, month: 10 };
try {
  const now = new Date();
  current = { year: now.getFullYear(), month: now.getMonth() };
} catch {
  // keep the default
}

const txFilter = { kind: 'all', category: 'all', query: '' };

function route() {
  const hash = window.location.hash || '#/dashboard';
  const name = hash.replace(/^#\//, '').split('?')[0] || 'dashboard';
  return ['dashboard', 'transactions', 'budgets', 'goals', 'reports'].includes(name) ? name : 'dashboard';
}

function setActiveNav(name) {
  document.querySelectorAll('[data-nav]').forEach((a) => {
    a.classList.toggle('active', a.dataset.nav === name);
  });
}

function render() {
  const name = route();
  setActiveNav(name);
  monthLabelEl.textContent = monthLabel(current.year, current.month);
  sampleBanner.hidden = !state.isSample;

  const ctx = { state, year: current.year, month: current.month };
  if (name === 'dashboard') {
    view.innerHTML = renderDashboard(ctx);
    drawDashboardCharts(ctx);
  } else if (name === 'transactions') {
    view.innerHTML = renderTransactions(ctx, txFilter);
  } else if (name === 'budgets') {
    view.innerHTML = renderBudgets(ctx);
  } else if (name === 'goals') {
    view.innerHTML = renderGoals(ctx);
  } else if (name === 'reports') {
    view.innerHTML = renderReports(ctx);
    drawReportCharts(ctx);
  }
}

function rerender() {
  saveState(state);
  render();
}

function shiftMonth(delta) {
  const d = new Date(current.year, current.month + delta, 1);
  current = { year: d.getFullYear(), month: d.getMonth() };
  render();
}

// ---- transaction dialog ----------------------------------------------

const txDialog = document.getElementById('tx-dialog');
const txForm = document.getElementById('tx-form');

function fillCategoryOptions(kind) {
  const select = document.getElementById('tx-category');
  const list = kind === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  select.innerHTML = list.map((c) => '<option value="' + c + '">' + c + '</option>').join('');
}

function openTxDialog(existing) {
  document.getElementById('tx-error').hidden = true;
  if (existing) {
    document.getElementById('tx-dialog-title').textContent = 'Edit transaction';
    document.getElementById('tx-id').value = existing.id;
    document.getElementById('tx-kind').value = existing.kind;
    fillCategoryOptions(existing.kind);
    document.getElementById('tx-category').value = existing.category;
    document.getElementById('tx-amount').value = (existing.amountCents / 100).toFixed(2);
    document.getElementById('tx-date').value = existing.date;
    document.getElementById('tx-note').value = existing.note || '';
  } else {
    document.getElementById('tx-dialog-title').textContent = 'Add transaction';
    document.getElementById('tx-id').value = '';
    document.getElementById('tx-kind').value = 'expense';
    fillCategoryOptions('expense');
    document.getElementById('tx-amount').value = '';
    document.getElementById('tx-date').value = todayIso();
    document.getElementById('tx-note').value = '';
  }
  txDialog.showModal();
}

document.getElementById('tx-kind').addEventListener('change', (e) => {
  fillCategoryOptions(e.target.value);
});

document.getElementById('tx-cancel').addEventListener('click', () => txDialog.close());

txForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const amountCents = dollarsToCents(document.getElementById('tx-amount').value);
  const date = document.getElementById('tx-date').value;
  const error = document.getElementById('tx-error');
  if (amountCents <= 0 || !date) {
    error.hidden = false;
    return;
  }
  const id = document.getElementById('tx-id').value;
  const record = {
    id: id || newTransactionId(),
    kind: document.getElementById('tx-kind').value,
    category: document.getElementById('tx-category').value,
    amountCents,
    date,
    note: document.getElementById('tx-note').value.trim(),
  };
  if (id) {
    const i = state.transactions.findIndex((t) => t.id === id);
    if (i !== -1) state.transactions[i] = record;
  } else {
    state.transactions.push(record);
  }
  const [y, m] = date.split('-').map(Number);
  current = { year: y, month: m - 1 };
  txDialog.close();
  rerender();
});

// ---- goal dialogs ------------------------------------------------------

const goalDialog = document.getElementById('goal-dialog');
const goalForm = document.getElementById('goal-form');
const fundsDialog = document.getElementById('funds-dialog');
const fundsForm = document.getElementById('funds-form');

function openGoalDialog(existing) {
  document.getElementById('goal-error').hidden = true;
  if (existing) {
    document.getElementById('goal-dialog-title').textContent = 'Edit goal';
    document.getElementById('goal-id').value = existing.id;
    document.getElementById('goal-name').value = existing.name;
    document.getElementById('goal-target').value = (existing.targetCents / 100).toFixed(0);
    document.getElementById('goal-saved').value = (existing.savedCents / 100).toFixed(2);
  } else {
    document.getElementById('goal-dialog-title').textContent = 'New savings goal';
    document.getElementById('goal-id').value = '';
    document.getElementById('goal-name').value = '';
    document.getElementById('goal-target').value = '';
    document.getElementById('goal-saved').value = '0';
  }
  goalDialog.showModal();
}

document.getElementById('goal-cancel').addEventListener('click', () => goalDialog.close());

goalForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('goal-name').value.trim();
  const targetCents = dollarsToCents(document.getElementById('goal-target').value);
  const savedRaw = Number(document.getElementById('goal-saved').value);
  const savedCents = Number.isFinite(savedRaw) && savedRaw > 0 ? Math.round(savedRaw * 100) : 0;
  const error = document.getElementById('goal-error');
  if (!name || targetCents <= 0) {
    error.hidden = false;
    return;
  }
  const id = document.getElementById('goal-id').value;
  if (id) {
    const g = state.goals.find((x) => x.id === id);
    if (g) {
      g.name = name;
      g.targetCents = targetCents;
      g.savedCents = savedCents;
    }
  } else {
    state.goals.push({ id: newGoalId(), name, targetCents, savedCents });
  }
  goalDialog.close();
  rerender();
});

function openFundsDialog(goal) {
  document.getElementById('funds-error').hidden = true;
  document.getElementById('funds-title').textContent = 'Add to ' + goal.name;
  document.getElementById('funds-goal-id').value = goal.id;
  document.getElementById('funds-amount').value = '';
  fundsDialog.showModal();
}

document.getElementById('funds-cancel').addEventListener('click', () => fundsDialog.close());

fundsForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const amountCents = dollarsToCents(document.getElementById('funds-amount').value);
  const error = document.getElementById('funds-error');
  if (amountCents <= 0) {
    error.hidden = false;
    return;
  }
  const goal = state.goals.find((g) => g.id === document.getElementById('funds-goal-id').value);
  if (goal) goal.savedCents += amountCents;
  fundsDialog.close();
  rerender();
});

// ---- clicks inside #view (event delegation) ----------------------------

view.addEventListener('click', (e) => {
  const button = e.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;

  if (action === 'add-tx') openTxDialog(null);
  if (action === 'edit-tx') {
    const tx = state.transactions.find((t) => t.id === button.dataset.id);
    if (tx) openTxDialog(tx);
  }
  if (action === 'delete-tx') {
    const tx = state.transactions.find((t) => t.id === button.dataset.id);
    if (tx && window.confirm('Delete this transaction (' + tx.category + ', ' + (tx.amountCents / 100).toFixed(2) + ')?')) {
      state.transactions = state.transactions.filter((t) => t.id !== tx.id);
      rerender();
    }
  }
  if (action === 'save-budget') {
    const category = button.dataset.category;
    const input = view.querySelector('[data-budget-input="' + category + '"]');
    const value = Number(input ? input.value : NaN);
    if (Number.isFinite(value) && value >= 0) {
      state.budgets[category] = Math.round(value * 100);
      rerender();
    }
  }
  if (action === 'add-goal') openGoalDialog(null);
  if (action === 'edit-goal') {
    const goal = state.goals.find((g) => g.id === button.dataset.id);
    if (goal) openGoalDialog(goal);
  }
  if (action === 'delete-goal') {
    const goal = state.goals.find((g) => g.id === button.dataset.id);
    if (goal && window.confirm('Delete the goal "' + goal.name + '"?')) {
      state.goals = state.goals.filter((g) => g.id !== goal.id);
      rerender();
    }
  }
  if (action === 'add-funds') {
    const goal = state.goals.find((g) => g.id === button.dataset.id);
    if (goal) openFundsDialog(goal);
  }
});

// Filters on the transactions page re-render on change/input.
view.addEventListener('change', (e) => {
  if (e.target.id === 'filter-kind') {
    txFilter.kind = e.target.value;
    txFilter.category = 'all';
    render();
  }
  if (e.target.id === 'filter-category') {
    txFilter.category = e.target.value;
    render();
  }
});
view.addEventListener('input', (e) => {
  if (e.target.id === 'filter-query') {
    txFilter.query = e.target.value;
    // Re-render the list without losing focus: only the table area changes
    // if we re-render whole view the search box loses focus, so debounce
    // the full re-render and keep typing smooth.
    clearTimeout(window.__hearthSearchTimer);
    window.__hearthSearchTimer = setTimeout(render, 250);
  }
});

// ---- header, banner, footer --------------------------------------------

document.getElementById('month-prev').addEventListener('click', () => shiftMonth(-1));
document.getElementById('month-next').addEventListener('click', () => shiftMonth(1));

document.getElementById('dismiss-sample').addEventListener('click', () => {
  sampleBanner.hidden = true;
});

document.getElementById('clear-sample').addEventListener('click', () => {
  if (!window.confirm('Clear the sample household and start with empty budgets?')) return;
  state = emptyState();
  rerender();
});

document.getElementById('load-sample').addEventListener('click', () => {
  if (!window.confirm('Replace your current data with the sample household?')) return;
  state = buildSampleState();
  current = { year: 2026, month: 10 };
  rerender();
});

document.getElementById('wipe-all').addEventListener('click', () => {
  if (!window.confirm('Erase every transaction, budget and goal stored in this browser?')) return;
  state = emptyState();
  rerender();
});

// Keep the month label honest when the hash changes without a reload.
window.addEventListener('hashchange', render);

render();
