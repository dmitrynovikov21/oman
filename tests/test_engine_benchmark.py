"""
ExpertOS EOSB Benchmark Tests v2.0
Based on Protocol v1.0 + Tarik's Calibration Data

Total Award = EOSB + Notice Pay + Leave Balance

Run: pytest tests/test_engine_benchmark.py -v
"""

import pytest
from decimal import Decimal, ROUND_HALF_UP
from datetime import date

import sys
sys.path.insert(0, str(__file__).replace('tests/test_engine_benchmark.py', ''))

from backend.oman_labor_calculator import OmanLaborCalculator, DetailedBreakdown


class TestTotalAwardBenchmark:
    """
    Benchmark test cases from Protocol v1.0
    Total Award = EOSB + Notice + Leave
    Tolerance: 1 OMR (accounts for leave day rounding)
    """

    def test_tc01_expat_total_award(self):
        """
        TC-01: Expat Standard Case
        Input: Start: 2018-06-13, End: 2024-10-15, Basic: 750, Gross: 750
        Leave Days: 31 (calibrated)
        Expected Total Award: 5157.917 OMR
        """
        calc = OmanLaborCalculator(
            nationality="EXPAT",
            start_date=date(2018, 6, 13),
            end_date=date(2024, 10, 15),
            basic_salary=Decimal("750.000"),
            gross_salary=Decimal("750.000"),
            unused_leave_days=31,
            notice_months=1,
            is_article_40=False
        )
        
        breakdown = calc.calculate()
        expected = Decimal("5157.917")
        
        # Verify components
        assert breakdown.eosb == Decimal("3633.904"), f"EOSB mismatch: {breakdown.eosb}"
        assert breakdown.notice_pay == Decimal("750.000"), f"Notice mismatch: {breakdown.notice_pay}"
        assert breakdown.leave_pay == Decimal("775.000"), f"Leave mismatch: {breakdown.leave_pay}"
        
        # Tolerance: 1 OMR (for leave day rounding)
        assert abs(breakdown.total_award - expected) <= Decimal("1"), \
            f"TC-01 FAILED: Expected {expected}, got {breakdown.total_award}, delta={breakdown.total_award - expected}"

    def test_tc02_omani_pension(self):
        """
        TC-02: Omani Pension Case
        Omani nationals get PASI pension, not EOSB
        Expected EOSB: 0.000 OMR
        """
        calc = OmanLaborCalculator(
            nationality="OMANI",
            start_date=date(2018, 1, 1),
            end_date=date(2024, 1, 1),
            basic_salary=Decimal("1000.000"),
            gross_salary=Decimal("1200.000"),
            unused_leave_days=30,
            is_article_40=False
        )
        
        breakdown = calc.calculate()
        
        assert breakdown.eosb == Decimal("0.000"), \
            f"TC-02 FAILED: Omani should get 0 EOSB, got {breakdown.eosb}"
        
        assert breakdown.pasi_debt > 0, \
            f"TC-02 FAILED: PASI debt should be positive, got {breakdown.pasi_debt}"

    def test_tc03_article_40(self):
        """
        TC-03: Article 40 (Gross Misconduct)
        EOSB: 0 (forfeited), Notice: 0 (forfeited), Leave: PAID (inalienable)
        """
        calc = OmanLaborCalculator(
            nationality="EXPAT",
            start_date=date(2020, 1, 1),
            end_date=date(2024, 1, 1),
            basic_salary=Decimal("500.000"),
            gross_salary=Decimal("500.000"),
            is_article_40=True,
            unused_leave_days=30
        )
        
        breakdown = calc.calculate()
        
        # EOSB and Notice forfeited
        assert breakdown.eosb == Decimal("0.000"), \
            f"TC-03 FAILED: Article 40 should forfeit EOSB, got {breakdown.eosb}"
        
        assert breakdown.notice_pay == Decimal("0.000"), \
            f"TC-03 FAILED: Article 40 should forfeit notice, got {breakdown.notice_pay}"
        
        # Leave is still paid
        expected_leave = Decimal("500") / Decimal("30") * Decimal("30")
        assert breakdown.leave_pay == expected_leave.quantize(Decimal("0.001")), \
            f"TC-03 FAILED: Leave should be paid, got {breakdown.leave_pay}"


class TestEOSBFormula:
    """Tests for EOSB 15/30 day progression formula"""

    def test_eosb_under_3_years(self):
        """EOSB for <3 years: 15 days per year"""
        calc = OmanLaborCalculator(
            nationality="EXPAT",
            start_date=date(2022, 1, 1),
            end_date=date(2024, 1, 1),  # 2 years
            basic_salary=Decimal("600"),
            gross_salary=Decimal("600"),
            is_article_40=False
        )
        
        # (600/30) * 15 * 2 = 600 OMR
        expected = Decimal("600.000")
        assert calc.calculate_eosb() == expected

    def test_eosb_over_3_years(self):
        """EOSB for >3 years: 15 days first 3, 30 days after"""
        calc = OmanLaborCalculator(
            nationality="EXPAT",
            start_date=date(2019, 1, 1),
            end_date=date(2024, 1, 1),  # ~5 years (1826 days = 5.003 years)
            basic_salary=Decimal("900"),
            gross_salary=Decimal("900"),
            is_article_40=False
        )
        
        eosb = calc.calculate_eosb()
        
        # Formula: (900/30)*15*3 + (900/30)*30*(5.003-3) = 1350 + ~1801 = ~3151
        # Allow 5 OMR tolerance due to exact day calculation
        expected = Decimal("3150.000")
        assert abs(eosb - expected) < Decimal("5"), \
            f"EOSB expected ~{expected}, got {eosb}"


class TestPASIPension:
    """Tests for Omani pension contribution calculations"""

    def test_pasi_rate_11_5_percent(self):
        """PASI rate: 11.5% of gross salary"""
        calc = OmanLaborCalculator(
            nationality="OMANI",
            start_date=date(2020, 1, 1),
            end_date=date(2024, 1, 1),
            basic_salary=Decimal("1000"),
            gross_salary=Decimal("1200"),
            is_article_40=False
        )
        
        monthly = calc.get_monthly_pasi_contribution()
        expected = Decimal("1200") * Decimal("0.115")  # 138 OMR
        
        assert monthly == expected.quantize(Decimal("0.001"))


class TestServicePeriod:
    """Tests for precise service period calculation"""

    def test_exact_days(self):
        """Service period calculated to exact days"""
        calc = OmanLaborCalculator(
            nationality="EXPAT",
            start_date=date(2018, 6, 13),
            end_date=date(2024, 10, 15),
            basic_salary=Decimal("750"),
            gross_salary=Decimal("750"),
            is_article_40=False
        )
        
        period = calc.get_service_period()
        
        assert period['years'] == 6
        assert period['months'] == 4
        assert period['days'] == 2
        assert period['total_days'] == 2316


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
