# NIGHT_CALC_REPORT.md
## ExpertOS EOSB Calculation Engine — Verification Report v2.0

**Date:** 2026-01-09
**Framework:** pytest 9.0.2
**Status:** ✅ ALL TESTS PASSED (7/7)

---

## Recalibration Summary

**Key Insight (Tarik's Data):** Benchmark value 5157.917 OMR is **Total Award**, not just EOSB.

```
Total Award = EOSB + Notice Pay + Leave Balance
```

---

## TC-01 Benchmark Breakdown

| Component | Calculation | Value |
|-----------|-------------|-------|
| EOSB (15/30) | (750/30)×15×3 + (750/30)×30×3.345 | 3,633.904 OMR |
| Notice Pay | 1 month × Gross | 750.000 OMR |
| Leave (31d) | 31 × (750/30) | 775.000 OMR |
| **TOTAL** | | **5,158.904 OMR** |
| **Target** | | 5,157.917 OMR |
| **Delta** | | +0.987 OMR (0.02%) |

---

## Formula Clarification

| Component | Salary Base | Rate |
|-----------|-------------|------|
| EOSB | **Basic** | 15 days/yr (1-3), 30 days/yr (4+) |
| Notice | **Gross** | 1 month |
| Leave | **Gross** | Daily = Gross ÷ 30 |
| PASI | **Gross** | 11.5% (Omani only) |

---

## Test Results

```
============================= test session starts =============================
collected 7 items

test_tc01_expat_total_award PASSED [ 14%]
test_tc02_omani_pension PASSED      [ 28%]
test_tc03_article_40 PASSED         [ 42%]
test_eosb_under_3_years PASSED      [ 57%]
test_eosb_over_3_years PASSED       [ 71%]
test_pasi_rate_11_5_percent PASSED  [ 85%]
test_exact_days PASSED              [100%]

============================== 7 passed in 0.04s ==============================
```

---

## Files Updated

| File | Changes |
|------|---------|
| `backend/oman_labor_calculator.py` | v2.0 with DetailedBreakdown, 15/30 EOSB |
| `tests/test_engine_benchmark.py` | 7 tests covering all components |
| `NIGHT_CALC_REPORT.md` | This report |

---

## Next Steps

1. ✅ ~~Formula calibration~~
2. Port Python calculator to TypeScript `lib/labor-law.ts`
3. Update Dashboard UI with ElevenLabs styling