# FonatProp Valuation Error Baseline

Date: 2026-05-04

Goal: establish a real, repeatable baseline for valuation error in Dubai and France so the product can reduce it over time with measurable checkpoints.

## Current reality

### Dubai

- Market: Dubai
- Source: live backend metrics endpoint
- Evaluated rows: 19,755 test rows
- MAPE: 12.70%
- MAE: AED 469,117
- Median absolute error: AED 191,651
- Within 10%: 58.08%
- Within 20%: 81.64%
- R²: 0.8888

Interpretation:

- Dubai is already in a commercially credible range for a first-pass AI valuation tool.
- The current live model is not perfect, but it is strong enough to support broker workflow and pricing conversation.
- The next quality jump should come from tighter building-level, time-aware, and address-resolution improvements rather than only more UI polish.

### France

- Market: France
- Source: DVF commune statistical V1 backtest
- Holdout: 2025
- Training years: 2021-2024
- Evaluated rows: 1,027,245
- MAPE: 39.36%
- Median APE: 23.67%
- MAE: EUR 90,988
- Within 10%: 23.50%
- Within 20%: 43.78%

Method:

- Residential only: `Appartement` and `Maison`
- Clean filters:
  - area between 12 and 400 m2
  - value between EUR 15,000 and EUR 5,000,000
  - price per m2 between EUR 300 and EUR 30,000
- Baseline built from commune + property type medians
- Coverage rule: only evaluated 2025 rows where the commune/property-type bucket had at least 15 training transactions
- Applied the same current V1 layout adjustment logic used in the France valuation engine

Interpretation:

- France V1 is still a broad market guidance engine, not a high-precision unit-level AVM.
- The current France product can support a directional seller or investor conversation, but not a tight, defendable valuation at the same level as Dubai.
- The gap is structural: commune-level DVF medians are not enough on their own.

## What these numbers mean

- Dubai current real margin of error: about 12.7%
- France current real margin of error: about 39.4%

That is the honest baseline today.

## Fastest path to reduce the error

### Dubai

1. Stronger building fingerprinting for address resolution
2. Better temporal weighting for recent transactions
3. More reliable building-level priors for towers with enough history
4. Separate calibration by submarket and product subtype
5. Post-model calibration layer for over/underprediction tails

### France

1. Exact address and parcel matching
2. RNB + BDNB building enrichment
3. DPE layer
4. Rent and legal cap layers for investment context
5. Urbanism and risk layers
6. Move from commune statistical V1 to a proper ML model with richer features

## Reproducibility

Use:

```bash
python scripts/evaluate_valuation_error_baseline.py
```

This script queries the live Dubai metrics endpoint and recomputes the current France baseline from the processed DVF parquet files.
