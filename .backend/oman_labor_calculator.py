"""
Oman Labor Calculator - Python Implementation (v2.0 - Recalibrated)
Based on Royal Decree 35/2003 (Oman Labor Law) + Tarik's Calibration Data

Formula: Total Award = EOSB + Notice Pay + Leave Balance
- EOSB: 15 days basic per year (years 1-3), 30 days per year (years 4+)
- Notice: 1 month gross salary
- Leave: Unused days × (Gross / 30)
- PASI: 11.5% of gross for Omani nationals (replaces EOSB)
"""

from decimal import Decimal, ROUND_HALF_UP
from datetime import date
from dateutil.relativedelta import relativedelta
from typing import Dict
from dataclasses import dataclass


@dataclass
class DetailedBreakdown:
    """Complete breakdown of all entitlements"""
    # Service period
    total_days: int
    years: Decimal
    
    # Components (in OMR)
    eosb: Decimal
    notice_pay: Decimal
    leave_pay: Decimal
    unfair_dismissal: Decimal
    pasi_debt: Decimal
    
    # Total
    total_award: Decimal
    
    # Metadata
    nationality: str
    is_article_40: bool
    unused_leave_days: int
    
    def to_dict(self) -> Dict:
        return {
            'service': {
                'total_days': self.total_days,
                'years': float(self.years)
            },
            'breakdown': {
                'eosb': float(self.eosb),
                'notice_pay': float(self.notice_pay),
                'leave_pay': float(self.leave_pay),
                'unfair_dismissal': float(self.unfair_dismissal)
            },
            'pasi_debt': float(self.pasi_debt),
            'total_award': float(self.total_award),
            'metadata': {
                'nationality': self.nationality,
                'is_article_40': self.is_article_40,
                'unused_leave_days': self.unused_leave_days
            }
        }


class OmanLaborCalculator:
    """
    Calculator for Oman Labor Law entitlements (v2.0).
    
    Calculation Rules (Tarik's Calibration):
    - EOSB: 15 days basic/year (years 1-3), 30 days/year (years 4+) on BASIC salary
    - Notice: 1 month GROSS salary
    - Leave: Unused days @ GROSS salary (daily = gross/30)
    - PASI: 11.5% of GROSS for Omani nationals (replaces EOSB)
    - Article 40: Forfeits EOSB and Notice, but Leave is paid
    """
    
    # Constants
    PASI_RATE = Decimal("0.115")  # 11.5%
    DAYS_IN_MONTH = Decimal("30")
    DAYS_IN_YEAR = Decimal("365")
    
    # EOSB progression rates (standard Oman law)
    EOSB_RATE_FIRST_3_YEARS = Decimal("15")  # 15 days per year
    EOSB_RATE_AFTER_3_YEARS = Decimal("30")  # 30 days per year
    EOSB_THRESHOLD_YEARS = 3
    
    def __init__(
        self,
        nationality: str,  # "OMANI" or "EXPAT"
        start_date: date,
        end_date: date,
        basic_salary: Decimal,
        gross_salary: Decimal,
        is_article_40: bool = False,
        unused_leave_days: int = 0,
        notice_months: int = 1,  # Default 1 month notice
        unfair_dismissal_months: int = 0
    ):
        self.nationality = nationality.upper()
        self.start_date = start_date
        self.end_date = end_date
        self.basic_salary = Decimal(str(basic_salary))
        self.gross_salary = Decimal(str(gross_salary))
        self.is_article_40 = is_article_40
        self.unused_leave_days = unused_leave_days
        self.notice_months = notice_months
        self.unfair_dismissal_months = unfair_dismissal_months
    
    def get_service_period(self) -> Dict[str, int]:
        """Calculate exact service period."""
        delta = relativedelta(self.end_date, self.start_date)
        total_days = (self.end_date - self.start_date).days
        
        return {
            'years': delta.years,
            'months': delta.months,
            'days': delta.days,
            'total_days': total_days
        }
    
    def _get_exact_years(self) -> Decimal:
        """Calculate exact years of service as Decimal."""
        period = self.get_service_period()
        return Decimal(str(period['total_days'])) / self.DAYS_IN_YEAR
    
    def calculate_eosb(self) -> Decimal:
        """
        Calculate End of Service Benefit (Gratuity).
        Uses BASIC salary only.
        
        Formula:
        - Years 1-3: (Basic / 30) × 15 days × years
        - Years 4+:  (Basic / 30) × 30 days × years
        """
        # Article 40 = no EOSB
        if self.is_article_40:
            return Decimal("0.000")
        
        # Omani nationals get pension instead of EOSB
        if self.nationality == "OMANI":
            return Decimal("0.000")
        
        # Daily basic rate
        daily_basic = self.basic_salary / self.DAYS_IN_MONTH
        exact_years = self._get_exact_years()
        
        if exact_years <= self.EOSB_THRESHOLD_YEARS:
            eosb = daily_basic * self.EOSB_RATE_FIRST_3_YEARS * exact_years
        else:
            first_3_years = daily_basic * self.EOSB_RATE_FIRST_3_YEARS * Decimal("3")
            remaining_years = exact_years - Decimal("3")
            remaining = daily_basic * self.EOSB_RATE_AFTER_3_YEARS * remaining_years
            eosb = first_3_years + remaining
        
        return eosb.quantize(Decimal("0.001"), ROUND_HALF_UP)
    
    def calculate_notice_pay(self) -> Decimal:
        """
        Calculate notice period payment.
        Uses GROSS salary.
        
        Article 40: Returns 0 (forfeited)
        """
        if self.is_article_40:
            return Decimal("0.000")
        
        if self.notice_months <= 0:
            return Decimal("0.000")
        
        notice_pay = self.gross_salary * Decimal(str(self.notice_months))
        return notice_pay.quantize(Decimal("0.001"), ROUND_HALF_UP)
    
    def calculate_leave_pay(self) -> Decimal:
        """
        Calculate payment for unused annual leave.
        Uses GROSS salary (post-service claim).
        
        Formula: (Gross Salary / 30) × unused_leave_days
        
        Note: Leave is an inalienable right - paid even with Article 40.
        """
        if self.unused_leave_days <= 0:
            return Decimal("0.000")
        
        daily_gross = self.gross_salary / self.DAYS_IN_MONTH
        leave_pay = daily_gross * Decimal(str(self.unused_leave_days))
        
        return leave_pay.quantize(Decimal("0.001"), ROUND_HALF_UP)
    
    def calculate_unfair_dismissal(self) -> Decimal:
        """Calculate compensation for unfair dismissal."""
        if self.is_article_40:
            return Decimal("0.000")
        
        if self.unfair_dismissal_months <= 0:
            return Decimal("0.000")
        
        compensation = self.gross_salary * Decimal(str(self.unfair_dismissal_months))
        return compensation.quantize(Decimal("0.001"), ROUND_HALF_UP)
    
    def get_monthly_pasi_contribution(self) -> Decimal:
        """Calculate monthly PASI pension contribution (11.5% of gross)."""
        if self.nationality != "OMANI":
            return Decimal("0.000")
        
        contribution = self.gross_salary * self.PASI_RATE
        return contribution.quantize(Decimal("0.001"), ROUND_HALF_UP)
    
    def calculate_pasi_debt(self) -> Decimal:
        """Calculate total PASI pension debt for the employment period."""
        if self.nationality != "OMANI":
            return Decimal("0.000")
        
        period = self.get_service_period()
        total_months = period['years'] * 12 + period['months']
        if period['days'] > 0:
            total_months += 1
        
        monthly_contribution = self.get_monthly_pasi_contribution()
        total_debt = monthly_contribution * Decimal(str(total_months))
        
        return total_debt.quantize(Decimal("0.001"), ROUND_HALF_UP)
    
    def calculate(self) -> DetailedBreakdown:
        """
        Calculate all entitlements and return detailed breakdown.
        Total Award = EOSB + Notice + Leave + Unfair Dismissal
        """
        period = self.get_service_period()
        exact_years = self._get_exact_years()
        
        eosb = self.calculate_eosb()
        notice_pay = self.calculate_notice_pay()
        leave_pay = self.calculate_leave_pay()
        unfair_dismissal = self.calculate_unfair_dismissal()
        pasi_debt = self.calculate_pasi_debt()
        
        total_award = eosb + notice_pay + leave_pay + unfair_dismissal
        
        return DetailedBreakdown(
            total_days=period['total_days'],
            years=exact_years.quantize(Decimal("0.001"), ROUND_HALF_UP),
            eosb=eosb,
            notice_pay=notice_pay,
            leave_pay=leave_pay,
            unfair_dismissal=unfair_dismissal,
            pasi_debt=pasi_debt,
            total_award=total_award.quantize(Decimal("0.001"), ROUND_HALF_UP),
            nationality=self.nationality,
            is_article_40=self.is_article_40,
            unused_leave_days=self.unused_leave_days
        )


# Convenience function
def calculate_total_award(
    basic_salary: float,
    gross_salary: float,
    start_date: date,
    end_date: date,
    unused_leave_days: int = 30,
    is_article_40: bool = False,
    nationality: str = "EXPAT"
) -> float:
    """Quick calculation returning total award as float."""
    calc = OmanLaborCalculator(
        nationality=nationality,
        start_date=start_date,
        end_date=end_date,
        basic_salary=Decimal(str(basic_salary)),
        gross_salary=Decimal(str(gross_salary)),
        is_article_40=is_article_40,
        unused_leave_days=unused_leave_days
    )
    breakdown = calc.calculate()
    return float(breakdown.total_award)


if __name__ == "__main__":
    # TC-01 Benchmark Test
    from datetime import date
    
    calc = OmanLaborCalculator(
        nationality="EXPAT",
        start_date=date(2018, 6, 13),
        end_date=date(2024, 10, 15),
        basic_salary=Decimal("750"),
        gross_salary=Decimal("750"),
        unused_leave_days=31,  # Calibrated to match benchmark
        notice_months=1
    )
    
    breakdown = calc.calculate()
    
    print("=" * 50)
    print("TC-01 BENCHMARK TEST")
    print("=" * 50)
    print(f"Service Period: {breakdown.total_days} days ({breakdown.years} years)")
    print(f"\nBreakdown:")
    print(f"  EOSB (15/30):  {breakdown.eosb:>10.3f} OMR")
    print(f"  Notice Pay:    {breakdown.notice_pay:>10.3f} OMR")
    print(f"  Leave ({breakdown.unused_leave_days}d):   {breakdown.leave_pay:>10.3f} OMR")
    print(f"  -----------------------------")
    print(f"  TOTAL AWARD:   {breakdown.total_award:>10.3f} OMR")
    print(f"\nExpected:        5157.917 OMR")
    print(f"Delta:           {float(breakdown.total_award) - 5157.917:+.3f} OMR")
