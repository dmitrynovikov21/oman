#!/usr/bin/env python3
"""Debug salary extraction"""

import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import re

# Raw OCR text from the document
text = "وقدره ٤٣١ ٠ ١ ر٠ع"
print(f"Original: {text}")

# Test pattern
pattern = r'([٠-٩\d\s]{3,8})\s*(?:ر٠ع|رع|ر\.ع|OMR)'
matches = re.findall(pattern, text)
print(f"Matches: {matches}")

if matches:
    raw = matches[0]
    print(f"Raw match: '{raw}'")
    
    # Clean digits
    arabic_map = {
        '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
        '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
    }
    cleaned = ""
    for c in raw:
        if c in arabic_map:
            cleaned += arabic_map[c]
        elif c.isdigit():
            cleaned += c
    
    print(f"Cleaned: '{cleaned}'")
    
    # Check if reversed
    if cleaned:
        val = int(cleaned)
        reversed_val = int(cleaned[::-1])
        print(f"Value: {val}, Reversed: {reversed_val}")
        
        # Logic: if > 10000 and reversed is 200-5000
        if val > 10000 and 200 <= reversed_val <= 5000:
            print(f"REVERSING: {val} -> {reversed_val}")
        else:
            print(f"Not reversing (val={val}, rev={reversed_val})")

# The issue: 43101 reversed = 10134, not 1043!
# The OCR is actually reading "431 0 1" which becomes "43101"
# But the real value is "1043" written as ١٠٤٣

print("\n--- SOLUTION ---")
print("The real issue is that OCR reads LEFTOVER digits")
print("In Arabic text: ٤٣١ ٠ ١ should be read as individual groups:")
print("  ٤٣١ = 431")
print("  ٠ = 0") 
print("  ١ = 1")
print("But these are SEPARATE groups, not one number!")
print("The actual salary 1043 is written as ١٠٤٣ (no spaces)")
