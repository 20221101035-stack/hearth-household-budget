// charts.js — small canvas charts for Hearth, drawn with plain Canvas 2D.
// No library, no network: every pixel comes from the household's own data.

import { CATEGORY_COLORS } from './store.js';
import { money, moneyShort } from './format.js';

function setupCanvas(canvas, cssWidth, cssHeight) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);
  canvas.style.width = cssWidth + 'px';
  canvas.style.height = cssHeight + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function font(size, weight) {
  return (weight || 400) + ' ' + size + 'px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
}

// A donut of spending by category, with the month's total in the middle.
export function drawDonut(canvas, slices, totalCents) {
  const size = 220;
  const ctx = setupCanvas(canvas, size, size);
  const cx = size / 2;
  const cy = size / 2;
  const outer = 104;
  const inner = 66;

  if (!slices.length || totalCents <= 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, outer, 0, Math.PI * 2);
    ctx.fillStyle = '#ece5d4';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, inner, 0, Math.PI * 2);
    ctx.fillStyle = '#fffdf8';
    ctx.fill();
    ctx.fillStyle = '#5a6b62';
    ctx.font = font(13);
    ctx.textAlign = 'center';
    ctx.fillText('No spending yet', cx, cy + 5);
    return;
  }

  let angle = -Math.PI / 2;
  for (const slice of slices) {
    const sweep = (slice.cents / totalCents) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outer, angle, angle + sweep);
    ctx.closePath();
    ctx.fillStyle = CATEGORY_COLORS[slice.category] || '#9a8f7a';
    ctx.fill();
    angle += sweep;
  }
  ctx.beginPath();
  ctx.arc(cx, cy, inner, 0, Math.PI * 2);
  ctx.fillStyle = '#fffdf8';
  ctx.fill();

  ctx.fillStyle = '#22302a';
  ctx.font = font(20, 800);
  ctx.textAlign = 'center';
  ctx.fillText(moneyShort(totalCents), cx, cy - 2);
  ctx.fillStyle = '#5a6b62';
  ctx.font = font(12);
  ctx.fillText('spent this month', cx, cy + 18);
}

// Grouped bars: income (green) beside spending (coral) for each month.
export function drawMonthBars(canvas, months) {
  const width = 640;
  const height = 260;
  const ctx = setupCanvas(canvas, width, height);
  const padLeft = 56;
  const padRight = 12;
  const padTop = 14;
  const padBottom = 30;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const max = Math.max(1, ...months.flatMap((m) => [m.income, m.spending]));
  const scale = plotH / max;

  // Gridlines with dollar labels.
  ctx.strokeStyle = '#e4dccd';
  ctx.fillStyle = '#5a6b62';
  ctx.font = font(11);
  ctx.textAlign = 'right';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const value = (max / 4) * i;
    const y = padTop + plotH - value * scale;
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(width - padRight, y);
    ctx.stroke();
    ctx.fillText(moneyShort(Math.round(value)), padLeft - 8, y + 4);
  }

  const groupW = plotW / months.length;
  const barW = Math.min(30, (groupW - 18) / 2);
  months.forEach((m, i) => {
    const gx = padLeft + i * groupW + groupW / 2;
    const incomeH = m.income * scale;
    const spendH = m.spending * scale;
    ctx.fillStyle = '#16624a';
    ctx.fillRect(gx - barW - 3, padTop + plotH - incomeH, barW, incomeH);
    ctx.fillStyle = '#c4533f';
    ctx.fillRect(gx + 3, padTop + plotH - spendH, barW, spendH);
    ctx.fillStyle = '#22302a';
    ctx.font = font(12, 700);
    ctx.textAlign = 'center';
    ctx.fillText(m.label, gx, height - 10);
  });

  // Legend.
  ctx.textAlign = 'left';
  ctx.font = font(12);
  ctx.fillStyle = '#16624a';
  ctx.fillRect(padLeft, 0, 12, 12);
  ctx.fillStyle = '#22302a';
  ctx.fillText('Income', padLeft + 18, 11);
  ctx.fillStyle = '#c4533f';
  ctx.fillRect(padLeft + 84, 0, 12, 12);
  ctx.fillStyle = '#22302a';
  ctx.fillText('Spending', padLeft + 102, 11);
}

export { money };
