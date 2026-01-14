#!/usr/bin/env python3
"""
Test Zoom-OCR Pipeline using Production Module (zoom_ocr.py)
"""

import sys
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import time
import json
import numpy as np
from pathlib import Path
from zoom_ocr import ZoomOCRPipeline

# Test PDF
test_pdf = Path(r"c:\gravity\gravity\oman-auto-new\filesfortest1") / "أحمد سالم عبدالله البادي-1-2111.pdf"

# Cache file
CACHE_FILE = Path("results/simple_zoom_text.txt")

print("=" * 70)
print("ZOOM-OCR PIPELINE TEST (Updated)")
print("Using zoom_ocr.py logic (Smart Healer + Anti-Phone CR)")
print("=" * 70)

print(f"\nPDF: {test_pdf.name}")

if not test_pdf.exists():
    print("[FAIL] PDF not found!")
    sys.exit(1)

# Initialize Pipeline
pipeline = ZoomOCRPipeline(scales=[1.0, 1.5])

# Check cache
skip_ocr = False
if CACHE_FILE.exists():
    print(f"\n[INFO] Found cached text in {CACHE_FILE}, using it for fast regex validation...")
    skip_ocr = True

scale_results = {}

if not skip_ocr:
    # Convert PDF to images
    print("\n[1] Converting PDF to images...")
    import fitz
    from PIL import Image

    doc = fitz.open(str(test_pdf))
    zoom = 300 / 72.0
    matrix = fitz.Matrix(zoom, zoom)

    page = doc.load_page(0)
    pix = page.get_pixmap(matrix=matrix)
    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    img_array = np.array(img)
    doc.close()

    print(f"   Page 1 loaded at 300 DPI ({img_array.shape[1]}x{img_array.shape[0]})")

    # Multi-DPI OCR
    print("\n[2] Running Multi-DPI OCR...")
    start = time.time()
    
    for scale in [1.0, 1.5]:
        print(f"   Processing {scale}x...")
        text = pipeline._run_ocr(img_array, scale)
        scale_results[f"{scale}x"] = text
        print(f"      Got {len(text)} chars")
    
    # Save best text to cache
    CACHE_FILE.parent.mkdir(exist_ok=True, parents=True)
    CACHE_FILE.write_text(scale_results["1.5x"], encoding='utf-8')
    print(f"   Total time: {time.time() - start:.1f}s")
else:
    # Load from cache
    cached_text = CACHE_FILE.read_text(encoding='utf-8')
    scale_results = {"1.5x": cached_text, "1.0x": cached_text} # Mock 1.0 same as 1.5 for regex test
    print("\n[1-2] Skipped OCR (Cached)")

# Extract entities
print("\n[3] Extracting entities via ZoomOCRPipeline methods...")

all_extractions = {
    "phone": {},
    "salary": {},
    "cr": {},
    "ref_id": {}
}

for scale, text in scale_results.items():
    phone, _ = pipeline._extract_phone(text)
    salary, _ = pipeline._extract_salary(text)
    cr, _ = pipeline._extract_cr(text)
    ref_id, _ = pipeline._extract_ref_id(text)
    
    all_extractions["phone"][scale] = phone
    all_extractions["salary"][scale] = salary 
    all_extractions["cr"][scale] = cr
    all_extractions["ref_id"][scale] = ref_id
    
    print(f"   [{scale}] Phone={phone}, Salary={salary}, CR={cr}, RefID={ref_id}")

# Voting
print("\n[4] Voting on results...")

final_results = {}
for field in all_extractions:
    # Use pipeline vote method logic manually or implementation
    values = [v for v in all_extractions[field].values() if v]
    if values:
        val, conf = pipeline._vote(values)
        final_results[field] = {"value": val, "confidence": conf}
    else:
        final_results[field] = {"value": None, "confidence": "LOW"}
    
    print(f"   {field}: {final_results[field]['value']} ({final_results[field]['confidence']})")

# Ground truth comparison
print("\n" + "=" * 70)
print("GROUND TRUTH COMPARISON")
print("=" * 70)

ground_truth = {
    "phone": "95788279",
    "cr": "112693", # Or reversed 469320...?
    "salary": "1043",
    "ref_id": "882401040246",
}

correct = 0
total = len(ground_truth)

print(f"\n{'Field':<12} {'Expected':<15} {'Got':<15} {'Conf':<15} {'Status'}")
print("-" * 70)

for field, expected in ground_truth.items():
    got = final_results.get(field, {}).get("value") or "N/A"
    conf = final_results.get(field, {}).get("confidence", "LOW")
    
    # Relaxed match for CR/Salary due to reversal ambiguity
    status = "[FAIL]"
    if str(expected) == str(got):
        status = "[OK]"
        correct += 1
    elif got != "N/A":
        # Check if matched expected or expected reversed
        exp_s = str(expected)
        got_s = str(got)
        if exp_s in got_s or got_s in exp_s:
             status = "[PARTIAL]"
             
    print(f"{field:<12} {expected:<15} {got:<15} {conf:<15} {status}")

accuracy = (correct / total) * 100
print(f"\nAccuracy: {correct}/{total} = {accuracy:.1f}%")
print("[DONE]")
