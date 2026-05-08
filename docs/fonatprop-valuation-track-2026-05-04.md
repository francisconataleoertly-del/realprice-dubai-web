# FonatProp Valuation Track

Date: 2026-05-04

This note separates the current honest baselines from the stronger workflow slices we can already use in the product.

## Dubai

### Global live holdout

Source: `https://web-production-9051f.up.railway.app/metrics`

- MAPE: `12.70%`
- MAE: `AED 469,117`
- Within 10%: `58.08%`
- Within 20%: `81.64%`
- R2: `0.8888`
- Test rows: `19,755`

This is the real broad-market baseline today.

### Address-backed workflow slice

Source: `realprice-api/address-inference-eval-v6-similarity.json`

- Building-backed checks: `500`
- Mean error: `10.20%`
- Median error: `7.62%`
- Within 10%: `59.8%`
- Within 15%: `75.4%`
- Within 20%: `85.2%`

This slice is stronger because it reflects the workflow where the broker has building or project context and the engine can use address-backed evidence.

### Product decision

For the public Dubai observatory:

- show the stronger address-backed workflow numbers as the hero metric
- keep the broader live holdout visible in secondary copy

That is both more useful and still honest.

## France

### Current broad baseline

Source: `docs/fonatprop-valuation-error-baseline-2026-05-04.md`

- V1 MAPE: `39.36%`
- MAE: `EUR 90,988`
- Within 20%: `43.78%`
- Holdout: `2025`

This is the honest commune-level baseline and it is still too wide for a defendable AVM.

### France V2 status

The live France valuation route is already wired to:

- `src/lib/server/france-valuation-v2.ts`
- `src/app/api/france/valuation/route.ts`

V2 adds:

- postcode-weighted DVF comparables
- room and area similarity weighting
- commune fallback when postcode evidence is weak

### Experimental result

In earlier local time-split holdout experiments on 2025 samples, V2 improved materially versus the V1 commune baseline:

- MAPE moved from about `39.4%` to about `35.4%`
- Within 20% moved from about `43.8%` to about `46.6%`
- MAE moved from about `EUR 90.9k` to about `EUR 84.9k`

These improvements are directionally real, but the new standalone benchmark harness still needs stabilization before it can replace the published V1 baseline as the official reproducible number.

### Product decision

For France:

- keep treating the current margin as broad market guidance
- continue using V2 in the route because it is directionally better
- do not market France as Dubai-level precision yet

## Next reduction path

### Dubai

1. Rebuild the backtest from the same clean training/test population used by the live backend.
2. Add stronger building alias cleanup for the worst address-backed misses.
3. Add post-model residual calibration by zone and product subtype only if it improves the real holdout, not just demo slices.

### France

1. Stabilize the V2 benchmark harness so the improvement is fully reproducible.
2. Add `RNB + BDNB` enrichment.
3. Add `DPE` and parcel/building signals.
4. Move from postcode comparables to a richer ML model after those features exist.
