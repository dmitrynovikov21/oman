#!/usr/bin/env python3
"""Quick test script for the OCR pipeline"""

import sys

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

sys.path.insert(0, '.')

from pathlib import Path

# Test PDF path
test_pdf = Path(r"c:\gravity\gravity\oman-auto-new\filesfortest1") / "أحمد سالم عبدالله البادي-1-2111.pdf"

print(f"Testing: {test_pdf}")
print(f"Exists: {test_pdf.exists()}")

if not test_pdf.exists():
    print("PDF not found!")
    sys.exit(1)

# Run pipeline
from run_pipeline import process_pdf

result = process_pdf(str(test_pdf), output_dir="./results", device="cpu")

if result:
    print("\n[SUCCESS] Pipeline completed!")
else:
    print("\n[FAIL] Pipeline failed")
