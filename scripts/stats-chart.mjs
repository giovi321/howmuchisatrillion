// Fetches the last 90 days of whole-site visits from the GoatCounter API and
// renders a self-contained cosmic-dark SVG line chart to assets/visits.svg.
// Zero dependencies — run by .github/workflows/stats.yml, or locally with
//   GOATCOUNTER_API_TOKEN=<token> node scripts/stats-chart.mjs
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const SITE = 'https://howmuchisatrillion.goatcounter.com';
const DAYS = 90;
const OUT = 'assets/visits.svg';

// dark palette from the diagram-design plugin (assets/template-dark.html)
const C = {
  paper: '#1c1a17', ink: '#f1efe7', muted: '#a8a69d', accent: '#ff6a30',
  grid: 'rgba(241,239,231,0.10)',
};

const token = process.env.GOATCOUNTER_API_TOKEN;
if (!token) {
  console.error('GOATCOUNTER_API_TOKEN is not set');
  process.exit(1);
}

const ymd = (d) => d.toISOString().slice(0, 10);

// window: the last DAYS days, ending today (UTC)
const end = new Date();
const start = new Date(end);
start.setUTCDate(start.getUTCDate() - (DAYS - 1));

const url = `${SITE}/api/v0/stats/total?start=${ymd(start)}&end=${ymd(end)}`;
const res = await fetch(url, {
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
});
if (!res.ok) {
  console.error(`GoatCounter API ${res.status}: ${await res.text()}`);
  process.exit(1);
}
const data = await res.json();

// /stats/total returns stats[] = [{ day: 'YYYY-MM-DD', daily: N }, ...]
const byDay = new Map((data.stats ?? []).map((s) => [s.day, s.daily ?? 0]));
const days = [];
for (let i = 0; i < DAYS; i++) {
  const d = new Date(start);
  d.setUTCDate(start.getUTCDate() + i);
  const key = ymd(d);
  days.push({ day: key, value: byDay.get(key) ?? 0 });
}

const total = days.reduce((a, b) => a + b.value, 0);
const peak = Math.max(1, ...days.map((d) => d.value));
const last = days[days.length - 1].value;

// geometry — extra top room so the title clears the top gridline
const W = 820, H = 210;
const pad = { t: 34, r: 16, b: 26, l: 16 };
const iw = W - pad.l - pad.r;
const ih = H - pad.t - pad.b;
const x = (i) => pad.l + (i / (days.length - 1)) * iw;
const y = (v) => pad.t + ih - (v / peak) * ih;

const line = days.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(' ');
const area = `M${x(0).toFixed(1)},${(pad.t + ih).toFixed(1)} ` +
  days.map((d, i) => `L${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(' ') +
  ` L${x(days.length - 1).toFixed(1)},${(pad.t + ih).toFixed(1)} Z`;

// 3 horizontal gridlines + value labels (0, mid, peak)
const grid = [0, 0.5, 1].map((f) => {
  const gy = pad.t + ih - f * ih;
  const val = Math.round(f * peak).toLocaleString('en-US');
  return `<line x1="${pad.l}" y1="${gy.toFixed(1)}" x2="${(W - pad.r).toFixed(1)}" y2="${gy.toFixed(1)}" stroke="${C.grid}"/>` +
    `<text x="${(W - pad.r).toFixed(1)}" y="${(gy - 4).toFixed(1)}" text-anchor="end" fill="${C.muted}" font-size="11">${val}</text>`;
}).join('');

const lastX = x(days.length - 1), lastY = y(last);
const fmtDate = (s) => new Date(s + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

// evenly spaced date ticks along the x-axis (edges anchored inward so they don't clip)
const TICKS = 6;
const xticks = Array.from({ length: TICKS }, (_, k) => {
  const i = Math.round((k / (TICKS - 1)) * (days.length - 1));
  const anchor = k === 0 ? 'start' : k === TICKS - 1 ? 'end' : 'middle';
  return `<text x="${x(i).toFixed(1)}" y="${H - 8}" text-anchor="${anchor}" fill="${C.muted}" font-size="11">${fmtDate(days[i].day)}</text>`;
}).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="'Geist Mono',ui-monospace,monospace" role="img" aria-label="Visits over the last ${DAYS} days: ${total.toLocaleString('en-US')} total">
  <defs>
    <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${C.accent}" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="${C.accent}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" rx="10" fill="${C.paper}"/>
  <text x="${pad.l}" y="18" fill="${C.muted}" font-size="11" letter-spacing="0.04em">howmuchisatrillion.com site visits</text>
  ${grid}
  <path d="${area}" fill="url(#fill)"/>
  <path d="${line}" fill="none" stroke="${C.accent}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
  <circle cx="${lastX.toFixed(1)}" cy="${lastY.toFixed(1)}" r="3.5" fill="${C.ink}"/>
  ${xticks}
</svg>
`;

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, svg);
console.log(`Wrote ${OUT} — ${total.toLocaleString('en-US')} visits over ${DAYS} days (peak ${peak}/day).`);
