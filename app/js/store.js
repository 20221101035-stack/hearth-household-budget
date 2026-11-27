// store.js — Hearth's data: categories, budgets, goals and transactions.
// Everything lives in localStorage under one key, so the site works offline
// and a household's numbers never leave its own browser.

export const STORAGE_KEY = 'hearth-budget-v1';

export const EXPENSE_CATEGORIES = [
  'Housing',
  'Groceries',
  'Dining Out',
  'Transport',
  'Utilities',
  'Entertainment',
  'Health',
  'Shopping',
  'Subscriptions',
  'Other',
];

export const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Refunds', 'Other Income'];

export const CATEGORY_COLORS = {
  Housing: '#16624a',
  Groceries: '#4f7d8c',
  'Dining Out': '#e8a33d',
  Transport: '#7a6aa8',
  Utilities: '#8a9a5b',
  Entertainment: '#c4533f',
  Health: '#3f8f6f',
  Shopping: '#b06a8e',
  Subscriptions: '#5b7fa6',
  Other: '#9a8f7a',
  Salary: '#16624a',
  Freelance: '#4f7d8c',
  Refunds: '#8a9a5b',
  'Other Income': '#9a8f7a',
};

const DEFAULT_BUDGETS_CENTS = {
  Housing: 150000,
  Groceries: 52000,
  'Dining Out': 22000,
  Transport: 18000,
  Utilities: 22000,
  Entertainment: 12000,
  Health: 15000,
  Shopping: 20000,
  Subscriptions: 4500,
  Other: 10000,
};

let uidCounter = 0;
function uid(prefix) {
  uidCounter += 1;
  return prefix + '-' + Date.now().toString(36) + '-' + uidCounter;
}

// A made-up household for November 2026 plus the five months before it,
// so every chart and list has real figures to show. Clearly labelled as
// sample data wherever it appears.
export function buildSampleState() {
  const tx = [];
  const add = (date, kind, category, cents, note) => {
    tx.push({ id: uid('tx'), date, kind, category, amountCents: cents, note });
  };

  // November 2026 — the current month, in detail.
  add('2026-11-01', 'income', 'Salary', 485000, 'November salary — Maya');
  add('2026-11-01', 'expense', 'Housing', 145000, 'Rent');
  add('2026-11-02', 'expense', 'Transport', 6000, 'Gas — Shell on Route 9');
  add('2026-11-03', 'expense', 'Groceries', 13240, 'Weekly shop — Whole Foods');
  add('2026-11-04', 'expense', 'Subscriptions', 1599, 'Streaming bundle');
  add('2026-11-05', 'expense', 'Dining Out', 4280, 'Dinner with Sam — Taqueria Luna');
  add('2026-11-06', 'expense', 'Utilities', 12840, 'Electric bill');
  add('2026-11-08', 'expense', 'Utilities', 6500, 'Internet');
  add('2026-11-09', 'expense', 'Groceries', 8615, 'Weekly shop — Trader Joe\u2019s');
  add('2026-11-10', 'expense', 'Transport', 3500, 'Monthly bus pass');
  add('2026-11-12', 'expense', 'Dining Out', 3650, 'Lunch — Corner Bakery');
  add('2026-11-14', 'income', 'Freelance', 62000, 'Weekend design project');
  add('2026-11-14', 'expense', 'Entertainment', 2800, 'Movie night — two tickets');
  add('2026-11-15', 'expense', 'Subscriptions', 999, 'Music streaming');
  add('2026-11-16', 'expense', 'Groceries', 10460, 'Weekly shop — Whole Foods');
  add('2026-11-18', 'expense', 'Health', 4500, 'Pharmacy — prescriptions');
  add('2026-11-19', 'expense', 'Dining Out', 5825, 'Anniversary dinner — Osteria');
  add('2026-11-20', 'income', 'Refunds', 4500, 'Returned jacket — refund');
  add('2026-11-21', 'expense', 'Shopping', 8999, 'Winter coat — Maya');
  add('2026-11-23', 'expense', 'Groceries', 7890, 'Weekly shop — Trader Joe\u2019s');
  add('2026-11-25', 'expense', 'Dining Out', 2400, 'Coffee and pastries — Blue Door');

  // June–October 2026 — a realistic month each, so the six-month report
  // has something honest to chart.
  const priorMonths = [
    {
      key: '2026-06',
      income: 542000,
      rows: [
        ['Housing', 145000, 'Rent'],
        ['Groceries', 46800, 'Groceries — June'],
        ['Dining Out', 19400, 'Eating out — June'],
        ['Transport', 15200, 'Gas and bus — June'],
        ['Utilities', 19800, 'Electric + internet — June'],
        ['Entertainment', 9600, 'Concert tickets'],
        ['Shopping', 17400, 'Summer clothes'],
        ['Subscriptions', 2598, 'Streaming + music — June'],
      ],
    },
    {
      key: '2026-07',
      income: 547500,
      rows: [
        ['Housing', 145000, 'Rent'],
        ['Groceries', 49100, 'Groceries — July'],
        ['Dining Out', 22100, 'Eating out — July'],
        ['Transport', 16800, 'Gas and bus — July'],
        ['Utilities', 21400, 'Electric + internet — July'],
        ['Entertainment', 13200, 'Weekend trip snacks'],
        ['Health', 12000, 'Dentist check-up'],
        ['Subscriptions', 2598, 'Streaming + music — July'],
      ],
    },
    {
      key: '2026-08',
      income: 539000,
      rows: [
        ['Housing', 145000, 'Rent'],
        ['Groceries', 47500, 'Groceries — August'],
        ['Dining Out', 18700, 'Eating out — August'],
        ['Transport', 14100, 'Gas and bus — August'],
        ['Utilities', 18900, 'Electric + internet — August'],
        ['Shopping', 9800, 'School supplies'],
        ['Subscriptions', 2598, 'Streaming + music — August'],
      ],
    },
    {
      key: '2026-09',
      income: 561000,
      rows: [
        ['Housing', 145000, 'Rent'],
        ['Groceries', 50200, 'Groceries — September'],
        ['Dining Out', 20900, 'Eating out — September'],
        ['Transport', 15900, 'Gas and bus — September'],
        ['Utilities', 20100, 'Electric + internet — September'],
        ['Entertainment', 11000, 'Theatre tickets'],
        ['Health', 6800, 'Flu shots'],
        ['Subscriptions', 2598, 'Streaming + music — September'],
      ],
    },
    {
      key: '2026-10',
      income: 558000,
      rows: [
        ['Housing', 145000, 'Rent'],
        ['Groceries', 48900, 'Groceries — October'],
        ['Dining Out', 23600, 'Eating out — October'],
        ['Transport', 17400, 'Gas and bus — October'],
        ['Utilities', 20700, 'Electric + internet — October'],
        ['Entertainment', 8400, 'Streaming movie rentals'],
        ['Shopping', 12900, 'Autumn jackets'],
        ['Health', 3200, 'Vitamins'],
        ['Subscriptions', 2598, 'Streaming + music — October'],
      ],
    },
  ];

  for (const month of priorMonths) {
    const day = month.key === '2026-10' ? '27' : '15';
    add(month.key + '-01', 'income', 'Salary', month.income, 'Monthly salary');
    for (const [category, cents, note] of month.rows) {
      add(month.key + '-' + day, 'expense', category, cents, note);
    }
  }

  return {
    version: 1,
    isSample: true,
    transactions: tx,
    budgets: { ...DEFAULT_BUDGETS_CENTS },
    goals: [
      { id: uid('goal'), name: 'Emergency fund', targetCents: 600000, savedCents: 385000 },
      { id: uid('goal'), name: 'Summer trip to Lisbon', targetCents: 240000, savedCents: 115000 },
      { id: uid('goal'), name: 'New sofa', targetCents: 90000, savedCents: 42000 },
    ],
  };
}

export function emptyState() {
  return {
    version: 1,
    isSample: false,
    transactions: [],
    budgets: { ...DEFAULT_BUDGETS_CENTS },
    goals: [],
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const state = buildSampleState();
      saveState(state);
      return state;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.transactions)) return buildSampleState();
    return parsed;
  } catch {
    return buildSampleState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable (private mode): the page still works
    // for this visit, it just will not remember the numbers.
  }
}

export function newTransactionId() {
  return uid('tx');
}

export function newGoalId() {
  return uid('goal');
}

// ---- month summaries -------------------------------------------------

export function monthTransactions(state, year, month) {
  const prefix = year + '-' + String(month + 1).padStart(2, '0') + '-';
  return state.transactions
    .filter((t) => t.date.startsWith(prefix))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function monthTotals(state, year, month) {
  let income = 0;
  let spending = 0;
  for (const t of monthTransactions(state, year, month)) {
    if (t.kind === 'income') income += t.amountCents;
    else spending += t.amountCents;
  }
  return { income, spending, saved: income - spending };
}

export function spendingByCategory(state, year, month) {
  const totals = new Map();
  for (const t of monthTransactions(state, year, month)) {
    if (t.kind !== 'expense') continue;
    totals.set(t.category, (totals.get(t.category) || 0) + t.amountCents);
  }
  return [...totals.entries()]
    .map(([category, cents]) => ({ category, cents }))
    .sort((a, b) => b.cents - a.cents);
}

export function lastSixMonths(year, month) {
  const out = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(year, month - i, 1);
    out.push({ year: d.getFullYear(), month: d.getMonth() });
  }
  return out;
}
