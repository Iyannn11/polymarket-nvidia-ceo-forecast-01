// Entry for polymarket-nvidia-ceo-forecast-01: empirical-volatility random-walk forecast.
// For each market: sigma = mean |1-min diff| over the last 360 minutes, scaled 1.0,
// floored at 0.0005. Quantiles = last price + z_tau * sigma * sqrt(h), clamped to
// [0,1], rounded to 6 decimals. Node 22, stdlib only, offline.
// Practice backtest: 0.279 (tails 1.0) / 0.278 (scale 0.9) vs house persistence 0.364 pinball loss.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const INPUT_DIR = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const QUANTILES = [0.05, 0.25, 0.5, 0.75, 0.95];
const Z = [-1.644854, -0.67449, 0, 0.67449, 1.644854];
const WINDOW = 360;
const SCALE = 0.9;
const FLOOR = 0.0005;

interface CaseMarket { id: string; prices: number[]; }
interface Case { horizon_minutes: number; quantiles: number[]; markets: CaseMarket[]; }

const price6 = (x: number): number => Math.round(Math.min(1, Math.max(0, x)) * 1e6) / 1e6 + 0;

function sigmaOf(prices: number[]): number {
  const start = Math.max(1, prices.length - WINDOW);
  let sum = 0, n = 0;
  for (let i = start; i < prices.length; i++) { sum += Math.abs(prices[i] - prices[i - 1]); n++; }
  const meanAbs = n > 0 ? sum / n : 0;
  return Math.max(meanAbs * SCALE, FLOOR);
}

function forecast(m: CaseMarket, horizon: number): number[][] {
  if (m.prices.length === 0) throw new Error(`market ${m.id} has no prices`);
  const x = m.prices[m.prices.length - 1] as number;
  const sig = sigmaOf(m.prices);
  const rows: number[][] = [];
  for (let h = 1; h <= horizon; h++) rows.push(Z.map((z) => price6(x + z * sig * Math.sqrt(h))));
  return rows;
}

mkdirSync(OUTPUT_DIR, { recursive: true });
const inputs = readdirSync(INPUT_DIR).filter((f) => f.endsWith('.in')).sort();
for (const file of inputs) {
  const id = file.slice(0, -'.in'.length);
  const c = JSON.parse(readFileSync(join(INPUT_DIR, file), 'utf8')) as Case;
  if (c.quantiles.length !== QUANTILES.length || c.quantiles.some((t, j) => t !== QUANTILES[j])) throw new Error(`${file}: bad quantiles`);
  const forecasts = c.markets.map((m) => ({ id: m.id, q: forecast(m, c.horizon_minutes) }));
  writeFileSync(join(OUTPUT_DIR, `${id}.out`), `${JSON.stringify({ forecasts })}\n`);
}
