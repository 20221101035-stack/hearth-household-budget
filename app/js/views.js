// views.js — Hearth's pages. Each renderer returns HTML for one hash route;
// app.js puts it in #view and draws the charts afterwards.

import {
  CATEGORY_COLORS,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  lastSixMonths,
  monthTotals,
  monthTransactions,
  spendingByCategory,
} from './store.js';
import { dateLabel, escapeHtml, money, monthLabel, monthShort, pct } from './format.js';
import { drawDonut, drawMonthBars } from './charts.js';

function statCard(kind, label, value, sub) {
  return (
    '<section class="card stat ' + kind + '">' +
    '<div class="label">' + label + '</div>' +
    '<div class="value">' + value + '</div>' +
    '<p class="sub">' + sub + '</p>' +
    '</section>'
  );
}

function categoryChip(category) {
  return '<span class="cat">' + escapeHtml(category) + '</span>';
}

function txRow(t) {
  return (
    '<tr>' +
    '<td class="hide-sm">' + dateLabel(t.date) + '</td>' +
    '<td>' + categoryChip(t.category) +
    (t.note ? '<div class="note">' + escapeHtml(t.note) + '</div>' : '') + '</td>' +
    '<td class="amount ' + (t.kind === 'expense' ? 'exp' : 'inc') + '">' +
    (t.kind === 'expense' ? '−' : '+') + money(t.amountCents) + '</td>' +
    '<td class="row-actions">' +
    '<button type="button" class="btn ghost small" data-action="edit-tx" data-id="' + t.id + '">Edit</button>' +
    '<button type="button" class="btn ghost small" data-action="delete-tx" data-id="' + t.id + '">Delete</button>' +
    '</td></tr>'
  );
}

function txTable(list) {
  if (!list.length) {
    return '<p class="empty">Nothing here yet. Add your first transaction and it will show up here.</p>';
  }
  return (
    '<table class="tx"><thead><tr>' +
    '<th class="hide-sm">Date</th><th>What it was</th><th style="text-align:right">Amount</th><th></th>' +
    '</tr></thead><tbody>' + list.map(txRow).join('') + '</tbody></table>'
  );
}

function budgetRow(state, year, month, category, spent) {
  const limit = state.budgets[category] || 0;
  const remaining = limit - spent;
  const used = pct(spent, limit);
  const barClass = spent > limit ? 'over' : used >= 85 ? 'warm' : '';
  const note = spent > limit
    ? 'Over budget by ' + money(spent - limit) + ' — worth a look before the month ends.'
    : remaining >= 0
      ? money(remaining) + ' left of ' + money(limit) + ' (' + used + '% used)'
      : '';
  return (
    '<div class="budget-row">' +
    '<div class="budget-top"><span class="name">' + escapeHtml(category) + '</span>' +
    '<span class="figures"><b>' + money(spent) + '</b> of ' + money(limit) + '</span></div>' +
    '<div class="meter" role="img" aria-label="' + escapeHtml(category) + ' budget ' + used + '% used">' +
    '<span class="' + barClass + '" style="width:' + Math.min(100, used) + '%"></span></div>' +
    '<p class="budget-note' + (spent > limit ? ' over' : '') + '">' + note + '</p>' +
    '<div class="budget-edit"><label>Monthly limit $<input type="number" min="0" step="1" inputmode="decimal" ' +
    'data-budget-input="' + escapeHtml(category) + '" value="' + (limit / 100) + '" aria-label="Monthly limit for ' + escapeHtml(category) + '"></label>' +
    '<button type="button" class="btn ghost small" data-action="save-budget" data-category="' + escapeHtml(category) + '">Save limit</button></div>' +
    '</div>'
  );
}

function goalCard(goal) {
  const used = pct(goal.savedCents, goal.targetCents);
  const done = goal.savedCents >= goal.targetCents;
  return (
    '<article class="card goal-card">' +
    '<div class="goal-head"><h3>' + escapeHtml(goal.name) + '</h3>' +
    '<span class="target"><b>' + money(goal.savedCents) + '</b> of ' + money(goal.targetCents) + '</span></div>' +
    '<div class="meter" role="img" aria-label="' + escapeHtml(goal.name) + ' ' + used + '% funded">' +
    '<span style="width:' + Math.min(100, used) + '%"></span></div>' +
    '<div class="goal-meta"><span>' + used + '% funded</span>' +
    (done
      ? '<span class="goal-done">Goal reached — nicely done.</span>'
      : '<span>' + money(goal.targetCents - goal.savedCents) + ' to go</span>') +
    '</div>' +
    '<div class="goal-actions">' +
    '<button type="button" class="btn primary small" data-action="add-funds" data-id="' + goal.id + '">Add funds</button>' +
    '<button type="button" class="btn ghost small" data-action="edit-goal" data-id="' + goal.id + '">Edit</button>' +
    '<button type="button" class="btn ghost small" data-action="delete-goal" data-id="' + goal.id + '">Delete</button>' +
    '</div></article>'
  );
}

// ---- Dashboard -------------------------------------------------------

export function renderDashboard(ctx) {
  const { state, year, month } = ctx;
  const totals = monthTotals(state, year, month);
  const byCat = spendingByCategory(state, year, month);
  const recent = monthTransactions(state, year, month).slice(0, 5);
  const savingsRate = totals.income > 0 ? pct(totals.saved, totals.income) : 0;
  const budgetTotal = EXPENSE_CATEGORIES.reduce((s, c) => s + (state.budgets[c] || 0), 0);
  const topCat = byCat[0];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dailyAvg = totals.spending / daysInMonth;

  const budgetRows = EXPENSE_CATEGORIES.map((c) => {
    const spent = (byCat.find((b) => b.category === c) || { cents: 0 }).cents;
    return { category: c, spent, limit: state.budgets[c] || 0 };
  })
    .filter((r) => r.limit > 0)
    .sort((a, b) => b.spent / b.limit - a.spent / a.limit)
    .slice(0, 4);

  return (
    '<div class="page-head"><div><h1>' + monthLabel(year, month) + ' at a glance</h1>' +
    '<p class="lede">Your household&rsquo;s money this month — what came in, what went out, and what&rsquo;s left for the rest of it.</p></div>' +
    '<button type="button" class="btn primary" data-action="add-tx">+ Add transaction</button></div>' +

    '<div class="grid three">' +
    statCard('income', 'Income', money(totals.income), 'Money in this month') +
    statCard('spending', 'Spending', money(totals.spending), 'Money out this month') +
    statCard(totals.saved >= 0 ? 'good' : 'warn', totals.saved >= 0 ? 'Left to save' : 'Over income', money(Math.abs(totals.saved)), totals.saved >= 0 ? savingsRate + '% of income kept' : 'Spending passed income — see Reports') +
    '</div>' +

    '<div class="grid two" style="margin-top:16px">' +
    '<section class="card"><h2>Where the money went</h2>' +
    '<div class="chart-wrap"><canvas id="donut" width="220" height="220" role="img" aria-label="Donut chart of spending by category"></canvas>' +
    '<ul class="legend">' +
    (byCat.length
      ? byCat.map((b) =>
        '<li><span><span class="swatch" style="background:' + (CATEGORY_COLORS[b.category] || '#9a8f7a') + '"></span>' + escapeHtml(b.category) + '</span><span><b>' + money(b.cents) + '</b> <span class="pct">' + pct(b.cents, totals.spending) + '%</span></span></li>').join('')
      : '<li>No spending recorded yet this month.</li>') +
    '</ul></div>' +
    '<p class="chart-note">' + (topCat
      ? 'Biggest slice: <b>' + escapeHtml(topCat.category) + '</b> at ' + money(topCat.cents) + ' — about ' + money(Math.round(dailyAvg)) + ' a day across everything.'
      : 'Add an expense and the chart fills in.') + '</p></section>' +

    '<section class="card"><h2>Budgets to watch <span class="count">' + money(budgetTotal) + ' planned</span></h2>' +
    (budgetRows.length
      ? budgetRows.map((r) => budgetRow(state, year, month, r.category, r.spent)).join('')
      : '<p class="empty">No budgets set yet — head to Budgets to give each category a monthly limit.</p>') +
    '<p style="margin-top:12px"><a href="#/budgets">See all budgets &rarr;</a></p></section>' +
    '</div>' +

    '<div class="grid two" style="margin-top:16px">' +
    '<section class="card"><h2>Savings goals</h2>' +
    (state.goals.length
      ? state.goals.slice(0, 3).map(goalCard).join('')
      : '<p class="empty">No savings goals yet — set one and watch it fill up month by month.</p>') +
    '<p style="margin-top:12px"><a href="#/goals">All goals &rarr;</a></p></section>' +

    '<section class="card"><h2>Recent transactions</h2>' +
    txTable(recent) +
    '<p style="margin-top:12px"><a href="#/transactions">All transactions &rarr;</a></p></section>' +
    '</div>'
  );
}

export function drawDashboardCharts(ctx) {
  const { state, year, month } = ctx;
  const totals = monthTotals(state, year, month);
  const canvas = document.getElementById('donut');
  if (canvas) drawDonut(canvas, spendingByCategory(state, year, month), totals.spending);
}

// ---- Transactions ----------------------------------------------------

export function renderTransactions(ctx, filter) {
  const { state, year, month } = ctx;
  const all = monthTransactions(state, year, month);
  const list = all.filter((t) => {
    if (filter.kind !== 'all' && t.kind !== filter.kind) return false;
    if (filter.category !== 'all' && t.category !== filter.category) return false;
    if (filter.query) {
      const q = filter.query.toLowerCase();
      if (!((t.note || '').toLowerCase().includes(q) || t.category.toLowerCase().includes(q))) return false;
    }
    return true;
  });
  const totals = monthTotals(state, year, month);
  const categories = filter.kind === 'income' ? INCOME_CATEGORIES : filter.kind === 'expense' ? EXPENSE_CATEGORIES : [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

  return (
    '<div class="page-head"><div><h1>Transactions — ' + monthLabel(year, month) + '</h1>' +
    '<p class="lede">Every dollar in and out. ' + money(totals.income) + ' came in and ' + money(totals.spending) + ' went out this month.</p></div>' +
    '<button type="button" class="btn primary" data-action="add-tx">+ Add transaction</button></div>' +

    '<div class="filters" role="search">' +
    '<select id="filter-kind" aria-label="Filter by kind">' +
    '<option value="all"' + (filter.kind === 'all' ? ' selected' : '') + '>All kinds</option>' +
    '<option value="income"' + (filter.kind === 'income' ? ' selected' : '') + '>Income</option>' +
    '<option value="expense"' + (filter.kind === 'expense' ? ' selected' : '') + '>Expenses</option>' +
    '</select>' +
    '<select id="filter-category" aria-label="Filter by category">' +
    '<option value="all">All categories</option>' +
    categories.map((c) => '<option value="' + escapeHtml(c) + '"' + (filter.category === c ? ' selected' : '') + '>' + escapeHtml(c) + '</option>').join('') +
    '</select>' +
    '<input type="search" id="filter-query" placeholder="Search notes or categories…" value="' + escapeHtml(filter.query) + '" aria-label="Search transactions">' +
    '</div>' +

    '<section class="card flat"><p class="hint" style="margin-top:0">Showing ' + list.length + ' of ' + all.length + ' transactions this month.</p>' +
    txTable(list) + '</section>'
  );
}

// ---- Budgets ---------------------------------------------------------

export function renderBudgets(ctx) {
  const { state, year, month } = ctx;
  const byCat = spendingByCategory(state, year, month);
  const spentOf = (c) => (byCat.find((b) => b.category === c) || { cents: 0 }).cents;
  const budgetTotal = EXPENSE_CATEGORIES.reduce((s, c) => s + (state.budgets[c] || 0), 0);
  const spentTotal = EXPENSE_CATEGORIES.reduce((s, c) => s + spentOf(c), 0);
  const over = EXPENSE_CATEGORIES.filter((c) => spentOf(c) > (state.budgets[c] || 0));

  return (
    '<div class="page-head"><div><h1>Budgets — ' + monthLabel(year, month) + '</h1>' +
    '<p class="lede">Give every category a monthly limit. Hearth tracks spending against it as the month goes on, so a category going over never sneaks up on you.</p></div></div>' +

    '<div class="grid three" style="margin-bottom:16px">' +
    statCard('', 'Planned spending', money(budgetTotal), 'Sum of all category limits') +
    statCard('spending', 'Spent so far', money(spentTotal), pct(spentTotal, budgetTotal) + '% of the plan used') +
    statCard(over.length ? 'warn' : 'good', 'Over budget', over.length ? over.length + ' categor' + (over.length === 1 ? 'y' : 'ies') : 'None — on track', over.length ? over.join(', ') + ' over' : 'Every category inside its limit') +
    '</div>' +

    '<section class="card"><h2>Category limits</h2>' +
    EXPENSE_CATEGORIES.map((c) => budgetRow(state, year, month, c, spentOf(c))).join('') +
    '<p class="chart-note">Limits are monthly and roll over with the month picker — change a limit any time and the dashboard updates straight away.</p></section>'
  );
}

// ---- Goals -----------------------------------------------------------

export function renderGoals(ctx) {
  const { state } = ctx;
  const totalSaved = state.goals.reduce((s, g) => s + g.savedCents, 0);
  const totalTarget = state.goals.reduce((s, g) => s + g.targetCents, 0);

  return (
    '<div class="page-head"><div><h1>Savings goals</h1>' +
    '<p class="lede">What the household is saving for — a cushion, a trip, a new sofa. Every dollar put toward a goal is a dollar the month didn&rsquo;t spend.</p></div>' +
    '<button type="button" class="btn primary" data-action="add-goal">+ New goal</button></div>' +

    '<div class="grid three" style="margin-bottom:16px">' +
    statCard('good', 'Saved toward goals', money(totalSaved), state.goals.length + ' active goal' + (state.goals.length === 1 ? '' : 's')) +
    statCard('', 'Total targets', money(totalTarget), 'What all goals add up to') +
    statCard('', 'Still to save', money(Math.max(0, totalTarget - totalSaved)), pct(totalSaved, totalTarget) + '% of the way there') +
    '</div>' +

    (state.goals.length
      ? '<div class="grid two">' + state.goals.map(goalCard).join('') + '</div>'
      : '<section class="card"><p class="empty">No goals yet. Start with something small — a $200 cushion for car repairs, or a weekend away — and add to it whenever the month leaves room.</p>' +
        '<button type="button" class="btn primary" data-action="add-goal">Create your first goal</button></section>')
  );
}

// ---- Reports ---------------------------------------------------------

export function renderReports(ctx) {
  const { state, year, month } = ctx;
  const totals = monthTotals(state, year, month);
  const byCat = spendingByCategory(state, year, month);
  const months = lastSixMonths(year, month).map(({ year: y, month: m }) => {
    const t = monthTotals(state, y, m);
    return { label: monthShort(y, m), income: t.income, spending: t.spending };
  });
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysElapsed = isCurrentMonth ? now.getDate() : daysInMonth;
  const dailyAvg = totals.spending / Math.max(1, daysElapsed);
  const projected = Math.round(dailyAvg * daysInMonth);
  const best = months.reduce((a, b) => (b.spending < a.spending ? b : a), months[0]);
  const savingsRate = totals.income > 0 ? pct(totals.saved, totals.income) : 0;

  return (
    '<div class="page-head"><div><h1>Reports — ' + monthLabel(year, month) + '</h1>' +
    '<p class="lede">Six months of income against spending, and where this month stands. Use it to spot the categories that quietly eat the budget.</p></div></div>' +

    '<section class="card" style="margin-bottom:16px"><h2>Income vs spending — last six months</h2>' +
    '<canvas id="bars" class="bar-chart" width="640" height="260" role="img" aria-label="Bar chart of income and spending for the last six months"></canvas>' +
    '<p class="chart-note">Green is money in, coral is money out. ' + best.label + ' was the lightest spending month at ' + money(best.spending) + '.</p></section>' +

    '<div class="grid two">' +
    '<section class="card"><h2>This month by category</h2>' +
    (byCat.length
      ? '<table class="tx"><thead><tr><th>Category</th><th style="text-align:right">Spent</th><th style="text-align:right">Share</th><th style="text-align:right">Budget</th></tr></thead><tbody>' +
        byCat.map((b) => {
          const limit = state.budgets[b.category] || 0;
          return '<tr><td>' + escapeHtml(b.category) + '</td><td class="amount exp">' + money(b.cents) + '</td><td style="text-align:right">' + pct(b.cents, totals.spending) + '%</td><td style="text-align:right">' + (limit ? money(limit) : '—') + '</td></tr>';
        }).join('') + '</tbody></table>'
      : '<p class="empty">No spending this month yet.</p>') +
    '</section>' +

    '<section class="card"><h2>What the numbers say</h2>' +
    '<div class="insight"><b>' + (byCat[0] ? escapeHtml(byCat[0].category) : 'Nothing') + '</b> is the biggest spend this month' + (byCat[0] ? ' at ' + money(byCat[0].cents) + ' (' + pct(byCat[0].cents, totals.spending) + '% of all spending).' : '.') + '</div>' +
    '<div class="insight">You&rsquo;re spending about <b>' + money(Math.round(dailyAvg)) + ' a day</b>' + (isCurrentMonth ? ' so far this month' : ' in ' + monthLabel(year, month)) + '. At that pace the month lands near <b>' + money(projected) + '</b>.</div>' +
    '<div class="insight">Savings rate this month: <b>' + savingsRate + '%</b> of income kept. A common household target is 20% — ' + (savingsRate >= 20 ? 'you&rsquo;re there, keep it up.' : 'a little under it; the biggest category above is usually the easiest place to find it.') + '</div>' +
    '<div class="insight">Lightest month of the last six: <b>' + best.label + '</b> (' + money(best.spending) + ' spent). Whatever worked then is worth repeating.</div>' +
    '<div class="kv"><span>Income this month</span><span>' + money(totals.income) + '</span></div>' +
    '<div class="kv"><span>Spending this month</span><span>' + money(totals.spending) + '</span></div>' +
    '<div class="kv"><span>Left over</span><span>' + money(totals.saved) + '</span></div>' +
    '</section></div>'
  );
}

export function drawReportCharts(ctx) {
  const { state, year, month } = ctx;
  const canvas = document.getElementById('bars');
  if (!canvas) return;
  const months = lastSixMonths(year, month).map(({ year: y, month: m }) => {
    const t = monthTotals(state, y, m);
    return { label: monthShort(y, m), income: t.income, spending: t.spending };
  });
  drawMonthBars(canvas, months);
}
