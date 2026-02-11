"""
Debug script to find exact TC-01 breakdown
"""
from decimal import Decimal, ROUND_HALF_UP

# TC-01 Input
basic = Decimal("750")
gross = basic  # Assuming same for now
days = 2316    # 2018-06-13 to 2024-10-15
years = Decimal(str(days)) / Decimal("365")
target = Decimal("5157.917")

# Rates
daily_basic = basic / 30
daily_gross = gross / 30

# EOSB (15/30)
eosb_first3 = daily_basic * 15 * 3
eosb_after3 = daily_basic * 30 * (years - 3)
eosb = (eosb_first3 + eosb_after3).quantize(Decimal("0.001"), ROUND_HALF_UP)

# Notice (1 month gross)  
notice = gross

print(f"Service: {years:.4f} years ({days} days)")
print(f"Daily Basic: {daily_basic:.3f} OMR")
print(f"\nEOSB Breakdown:")
print(f"  First 3 years: {eosb_first3:.3f} OMR")
print(f"  After 3 years: {eosb_after3:.3f} OMR")
print(f"  Total EOSB: {eosb:.3f} OMR")
print(f"\nNotice Pay: {notice:.3f} OMR")

# Calculate needed leave
leave_needed = target - eosb - notice
print(f"\nLeave needed to match target: {leave_needed:.3f} OMR")

# Test different leave days
for leave_days in [30, 31, 32]:
    leave = daily_gross * leave_days
    total = eosb + notice + leave
    delta = total - target
    print(f"  {leave_days} days leave: {leave:.3f} OMR -> Total: {total:.3f} (delta: {delta:+.3f})")

# Find exact leave days
exact_days = leave_needed / daily_gross
print(f"\nExact leave days needed: {exact_days:.2f} days")
