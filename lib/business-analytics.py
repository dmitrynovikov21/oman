"""
Mission 14: Business Analytics & Metrics

Calculates:
- Profitability: Agreed Fee - (Expert Hours + Expenses)
- Lead Time: Average days from Intake to Final Report
- Efficiency metrics per expert
"""

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from decimal import Decimal
from statistics import mean


@dataclass
class CaseMetrics:
    """Metrics for a single case"""
    case_id: str
    case_number: str
    
    # Dates
    intake_date: Optional[datetime] = None
    completion_date: Optional[datetime] = None
    
    # Financials
    agreed_fee: Decimal = Decimal("0")
    expert_hours: float = 0.0
    hourly_rate: Decimal = Decimal("50")  # Default OMR/hour
    expenses: Decimal = Decimal("0")
    
    # Status
    status: str = "ACTIVE"
    expert_id: Optional[str] = None
    
    @property
    def lead_time_days(self) -> Optional[int]:
        """Calculate days from intake to completion"""
        if self.intake_date and self.completion_date:
            delta = self.completion_date - self.intake_date
            return delta.days
        return None
    
    @property
    def labor_cost(self) -> Decimal:
        """Calculate labor cost"""
        return Decimal(str(self.expert_hours)) * self.hourly_rate
    
    @property
    def total_cost(self) -> Decimal:
        """Total case cost"""
        return self.labor_cost + self.expenses
    
    @property
    def profit(self) -> Decimal:
        """Case profitability"""
        return self.agreed_fee - self.total_cost
    
    @property
    def profit_margin(self) -> float:
        """Profit margin percentage"""
        if self.agreed_fee == 0:
            return 0.0
        return float(self.profit / self.agreed_fee * 100)


@dataclass
class ExpertMetrics:
    """Aggregated metrics for an expert"""
    expert_id: str
    expert_name: str
    
    total_cases: int = 0
    completed_cases: int = 0
    active_cases: int = 0
    
    total_revenue: Decimal = Decimal("0")
    total_profit: Decimal = Decimal("0")
    avg_profit_margin: float = 0.0
    
    avg_lead_time: float = 0.0  # days
    total_hours: float = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "expert_id": self.expert_id,
            "expert_name": self.expert_name,
            "total_cases": self.total_cases,
            "completed_cases": self.completed_cases,
            "active_cases": self.active_cases,
            "total_revenue": float(self.total_revenue),
            "total_profit": float(self.total_profit),
            "avg_profit_margin": self.avg_profit_margin,
            "avg_lead_time": self.avg_lead_time,
            "total_hours": self.total_hours,
        }


@dataclass
class FirmMetrics:
    """Firm-wide aggregated metrics"""
    period_start: datetime
    period_end: datetime
    
    total_cases: int = 0
    completed_cases: int = 0
    active_cases: int = 0
    
    total_revenue: Decimal = Decimal("0")
    total_expenses: Decimal = Decimal("0")
    total_profit: Decimal = Decimal("0")
    avg_profit_margin: float = 0.0
    
    avg_lead_time: float = 0.0  # days
    avg_cases_per_expert: float = 0.0
    
    experts_count: int = 0
    top_performer_id: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "period": {
                "start": self.period_start.isoformat(),
                "end": self.period_end.isoformat(),
            },
            "cases": {
                "total": self.total_cases,
                "completed": self.completed_cases,
                "active": self.active_cases,
            },
            "financials": {
                "revenue": float(self.total_revenue),
                "expenses": float(self.total_expenses),
                "profit": float(self.total_profit),
                "profit_margin": self.avg_profit_margin,
            },
            "performance": {
                "avg_lead_time_days": self.avg_lead_time,
                "avg_cases_per_expert": self.avg_cases_per_expert,
                "experts_count": self.experts_count,
            },
        }


class BusinessAnalytics:
    """Business analytics calculator"""
    
    def __init__(self, hourly_rate: Decimal = Decimal("50")):
        self.hourly_rate = hourly_rate
    
    def calculate_case_metrics(self, case_data: Dict[str, Any]) -> CaseMetrics:
        """Calculate metrics for a single case"""
        intake_date = None
        completion_date = None
        
        if case_data.get("assigned_date"):
            intake_date = datetime.fromisoformat(case_data["assigned_date"].replace("Z", ""))
        if case_data.get("completed_date"):
            completion_date = datetime.fromisoformat(case_data["completed_date"].replace("Z", ""))
        
        return CaseMetrics(
            case_id=case_data.get("id", ""),
            case_number=case_data.get("case_number", ""),
            intake_date=intake_date,
            completion_date=completion_date,
            agreed_fee=Decimal(str(case_data.get("fee_amount", 0))),
            expert_hours=float(case_data.get("expert_hours", 0)),
            hourly_rate=self.hourly_rate,
            expenses=Decimal(str(case_data.get("expenses", 0))),
            status=case_data.get("status", "ACTIVE"),
            expert_id=case_data.get("user_id"),
        )
    
    def calculate_expert_metrics(
        self, 
        expert_id: str,
        expert_name: str,
        cases: List[CaseMetrics]
    ) -> ExpertMetrics:
        """Calculate aggregated metrics for an expert"""
        expert_cases = [c for c in cases if c.expert_id == expert_id]
        
        if not expert_cases:
            return ExpertMetrics(expert_id=expert_id, expert_name=expert_name)
        
        completed = [c for c in expert_cases if c.status == "CLOSED"]
        active = [c for c in expert_cases if c.status in ["ACTIVE", "DRAFT", "REVIEW"]]
        
        lead_times = [c.lead_time_days for c in completed if c.lead_time_days is not None]
        profits = [c.profit for c in completed]
        margins = [c.profit_margin for c in completed if c.agreed_fee > 0]
        
        return ExpertMetrics(
            expert_id=expert_id,
            expert_name=expert_name,
            total_cases=len(expert_cases),
            completed_cases=len(completed),
            active_cases=len(active),
            total_revenue=sum(c.agreed_fee for c in completed),
            total_profit=sum(profits) if profits else Decimal("0"),
            avg_profit_margin=mean(margins) if margins else 0.0,
            avg_lead_time=mean(lead_times) if lead_times else 0.0,
            total_hours=sum(c.expert_hours for c in expert_cases),
        )
    
    def calculate_firm_metrics(
        self,
        cases: List[CaseMetrics],
        period_start: Optional[datetime] = None,
        period_end: Optional[datetime] = None
    ) -> FirmMetrics:
        """Calculate firm-wide metrics"""
        now = datetime.now()
        period_start = period_start or (now - timedelta(days=30))
        period_end = period_end or now
        
        # Filter by period
        period_cases = [
            c for c in cases 
            if c.intake_date and period_start <= c.intake_date <= period_end
        ]
        
        completed = [c for c in period_cases if c.status == "CLOSED"]
        active = [c for c in period_cases if c.status in ["ACTIVE", "DRAFT", "REVIEW"]]
        
        lead_times = [c.lead_time_days for c in completed if c.lead_time_days is not None]
        margins = [c.profit_margin for c in completed if c.agreed_fee > 0]
        
        total_revenue = sum(c.agreed_fee for c in completed)
        total_expenses = sum(c.total_cost for c in completed)
        total_profit = sum(c.profit for c in completed)
        
        # Count unique experts
        expert_ids = set(c.expert_id for c in period_cases if c.expert_id)
        
        return FirmMetrics(
            period_start=period_start,
            period_end=period_end,
            total_cases=len(period_cases),
            completed_cases=len(completed),
            active_cases=len(active),
            total_revenue=total_revenue,
            total_expenses=total_expenses,
            total_profit=total_profit,
            avg_profit_margin=mean(margins) if margins else 0.0,
            avg_lead_time=mean(lead_times) if lead_times else 0.0,
            avg_cases_per_expert=len(period_cases) / len(expert_ids) if expert_ids else 0.0,
            experts_count=len(expert_ids),
        )
    
    def get_lead_time_chart_data(
        self, 
        cases: List[CaseMetrics],
        group_by: str = "month"
    ) -> List[Dict[str, Any]]:
        """Get lead time data for charting"""
        completed = [c for c in cases if c.status == "CLOSED" and c.lead_time_days]
        
        # Group by month
        monthly_data: Dict[str, List[int]] = {}
        
        for case in completed:
            if case.completion_date:
                key = case.completion_date.strftime("%Y-%m")
                if key not in monthly_data:
                    monthly_data[key] = []
                monthly_data[key].append(case.lead_time_days)
        
        return [
            {
                "month": month,
                "avg_days": mean(days),
                "case_count": len(days)
            }
            for month, days in sorted(monthly_data.items())
        ]
    
    def get_profitability_chart_data(
        self,
        cases: List[CaseMetrics]
    ) -> List[Dict[str, Any]]:
        """Get profitability data for charting"""
        completed = [c for c in cases if c.status == "CLOSED"]
        
        monthly_data: Dict[str, Dict[str, Decimal]] = {}
        
        for case in completed:
            if case.completion_date:
                key = case.completion_date.strftime("%Y-%m")
                if key not in monthly_data:
                    monthly_data[key] = {"revenue": Decimal("0"), "profit": Decimal("0")}
                monthly_data[key]["revenue"] += case.agreed_fee
                monthly_data[key]["profit"] += case.profit
        
        return [
            {
                "month": month,
                "revenue": float(data["revenue"]),
                "profit": float(data["profit"]),
            }
            for month, data in sorted(monthly_data.items())
        ]


def test_analytics():
    """Test business analytics"""
    print("=== Business Analytics Tests ===\n")
    
    analytics = BusinessAnalytics()
    
    # Create test cases
    cases = [
        CaseMetrics(
            case_id="1",
            case_number="1409/2024",
            intake_date=datetime(2024, 1, 1),
            completion_date=datetime(2024, 1, 15),
            agreed_fee=Decimal("500"),
            expert_hours=8,
            expenses=Decimal("50"),
            status="CLOSED",
            expert_id="expert_1"
        ),
        CaseMetrics(
            case_id="2",
            case_number="1410/2024",
            intake_date=datetime(2024, 1, 10),
            completion_date=datetime(2024, 1, 20),
            agreed_fee=Decimal("750"),
            expert_hours=12,
            expenses=Decimal("75"),
            status="CLOSED",
            expert_id="expert_1"
        ),
        CaseMetrics(
            case_id="3",
            case_number="1411/2024",
            intake_date=datetime(2024, 1, 15),
            agreed_fee=Decimal("600"),
            expert_hours=5,
            status="ACTIVE",
            expert_id="expert_2"
        ),
    ]
    
    # Test 1: Lead Time Calculation
    print("Test 1: Lead Time")
    assert cases[0].lead_time_days == 14
    assert cases[1].lead_time_days == 10
    print(f"  Case 1 lead time: {cases[0].lead_time_days} days")
    print(f"  Case 2 lead time: {cases[1].lead_time_days} days")
    print("  ✓ PASSED\n")
    
    # Test 2: Profit Calculation
    print("Test 2: Profitability")
    case1_profit = cases[0].profit
    print(f"  Case 1: Fee={cases[0].agreed_fee}, Cost={cases[0].total_cost}, Profit={case1_profit}")
    assert case1_profit == Decimal("500") - (Decimal("8") * Decimal("50") + Decimal("50"))
    print("  ✓ PASSED\n")
    
    # Test 3: Expert Metrics
    print("Test 3: Expert Aggregation")
    expert_metrics = analytics.calculate_expert_metrics("expert_1", "Test Expert", cases)
    print(f"  Total cases: {expert_metrics.total_cases}")
    print(f"  Completed: {expert_metrics.completed_cases}")
    print(f"  Avg lead time: {expert_metrics.avg_lead_time} days")
    assert expert_metrics.total_cases == 2
    assert expert_metrics.completed_cases == 2
    print("  ✓ PASSED\n")
    
    # Test 4: Firm Metrics
    print("Test 4: Firm Metrics")
    firm = analytics.calculate_firm_metrics(
        cases,
        period_start=datetime(2024, 1, 1),
        period_end=datetime(2024, 12, 31)
    )
    print(f"  Total revenue: {firm.total_revenue} OMR")
    print(f"  Total profit: {firm.total_profit} OMR")
    print(f"  Avg lead time: {firm.avg_lead_time} days")
    assert firm.completed_cases == 2
    print("  ✓ PASSED\n")
    
    print("=== All Analytics Tests Passed ===")


if __name__ == "__main__":
    test_analytics()
