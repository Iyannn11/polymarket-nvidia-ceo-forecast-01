# polymarket-nvidia-ceo-forecast-01 entry

Minute-by-minute quantile forecast of Polymarket's "Next CEO of NVIDIA?" Yes prices, 240 minutes ahead.

Model: empirical-volatility random walk. sigma = mean absolute 1-minute diff over the last 360 minutes (x0.9, floor 0.0005); quantiles = last price + z_tau * sigma * sqrt(h), tails narrowed 0.9, clamped [0,1], 6 decimals. Offline, Node 22 stdlib only.

Practice backtest pinball loss: 0.278 (house persistence baseline: 0.364).

Run: `MAKEFUN_INPUT_DIR=input MAKEFUN_OUTPUT_DIR=out node --experimental-strip-types main.ts`
