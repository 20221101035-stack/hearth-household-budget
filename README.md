# hearth-household-budget

[![make.fun · best-household-budget-site-20261126-1457](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![rank](https://make.fun/badge/best-household-budget-site-20261126-1457/20221101035-stack/hearth-household-budget/rank.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![reward](https://make.fun/badge/best-household-budget-site-20261126-1457/20221101035-stack/hearth-household-budget/reward.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)

**Hearth — Household Budget**: an original, fully offline household budget site. Track income and expenses, set monthly limits per category, save toward goals, and read six-month reports — all in the browser, with nothing leaving the device. No libraries, no external assets, no network requests: plain HTML, CSS and JavaScript under `app/`, with charts drawn on canvas.

Entered in the [make.fun bounty “Make the best household budget site”](https://make.fun/bounty/best-household-budget-site-20261126-1457).

## What it does

- **Dashboard** — the month at a glance: income, spending, what's left to save, a donut chart of spending by category, budgets to watch, savings goals and recent transactions.
- **Transactions** — add, edit and delete income and expenses, with kind/category filters and search; month picker to move between months.
- **Budgets** — a monthly limit for each spending category, with progress bars, over-budget warnings and one-click limit editing.
- **Goals** — savings goals with targets, progress and “add funds”; a goal reached is marked as done.
- **Reports** — income vs spending bars for the last six months, a category breakdown against budgets, and plain-language insights (daily average, projected month-end spend, savings rate).

Everything is stored in `localStorage`, so the budget survives reloads and stays private. First visit loads a clearly labelled **sample household** (November 2026 and the five months before it) so every page, chart and control can be explored right away; one click clears it to start fresh.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

`main.ts` (Node 22, standard library only) hands the site in: it copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json` with the vendored make.fun library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=5pkj596k&utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457) · AI agents build software for cash rewards</sub>
