#!/usr/bin/env python3
"""
Test Zoom-OCR Pipeline

Tests Multi-Scale EasyOCR with voting on Omani legal documents.
"""

import sys
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import time
from pathlib import Path
import json

# Test PDF
test_pdf = Path(r"c:\gravity\gravity\oman-auto-new\filesfortest1") / "أحمد سالم عبدالله البادي-1-2111.pdf"

print("=" * 70)
print("ZOOM-OCR PIPELINE TEST")
print("Surya Layout + Multi-DPI (1x, 2x, 3x) + Voting")
print("=" * 70)

print(f"\nPDF: {test_pdf.name}")
print(f"Exists: {test_pdf.exists()}")

if not test_pdf.exists():
    print("[FAIL] PDF not found!")
    sys.exit(1)

# Convert PDF to images
print("\n[1] Converting PDF to images...")
import fitz
from PIL import Image
import numpy as np

doc = fitz.open(str(test_pdf))
zoom = 300 / 72.0  # Higher DPI for better digit recognition
matrix = fitz.Matrix(zoom, zoom)

images = []
for page_num in range(len(doc)):
    page = doc.load_page(page_num)
    pix = page.get_pixmap(matrix=matrix)
    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    images.append(img)
doc.close()

print(f"   Converted: {len(images)} pages at 300 DPI")

# Initialize pipeline
print("\n[2] Initializing Zoom-OCR Pipeline...")
from zoom_ocr import ZoomOCRPipeline

pipeline = ZoomOCRPipeline(
    use_surya=False,  # Disable until API fixed
    scales=[1.0, 2.0, 3.0],
    padding=15,
)

# Process first page only for speed
print("\n[3] Processing page 1...")
total_start = time.time()

result = pipeline.process_image(images[0])

print(f"   Time: {result.processing_time_ms}ms")
print(f"   Fields found: {len(result.fields)}")

# Show results
print("\n" + "=" * 70)
print("EXTRACTED FIELDS")
print("=" * 70)

for field_name, field in result.fields.items():
    print(f"\n[{field_name.upper()}]")
    print(f"   Value: {field.value}")
    print(f"   Confidence: {field.confidence}")
    if field.scale_results:
        print(f"   Scale results:")
        for scale, text in field.scale_results.items():
            print(f"      {scale}: '{text}'")

# Ground truth comparison
print("\n" + "=" * 70)
print("GROUND TRUTH COMPARISON")
print("=" * 70)

ground_truth = {
    "phone": "95788279",
    "cr": "112693",
    "salary": "1043",
    "ref_id": "882401040246",
}

print(f"\n{'Field':<15} {'Expected':<20} {'Got':<20} {'Status'}")
print("-" * 70)

correct = 0
total = len(ground_truth)

for field, expected in ground_truth.items():
    got = result.fields.get(field, None)
    got_value = got.value if got else "N/A"
    
    if expected == got_value:
        status = "[OK]"
        correct += 1
    elif got_value != "N/A" and (expected in got_value or got_value in expected):
        status = "[PARTIAL]"
    else:
        status = "[FAIL]"
    
    print(f"{field:<15} {expected:<20} {got_value:<20} {status}")

accuracy = (correct / total) * 100
print(f"\nAccuracy: {correct}/{total} = {accuracy:.1f}%")

# Save output
output_dir = Path("./results")
output_dir.mkdir(exist_ok=True)

json_output = {
    "document": test_pdf.name,
    "processing_time_ms": result.processing_time_ms,
    "accuracy": accuracy,
    "fields": {
        name: {
            "value": f.value,
            "confidence": f.confidence,
            "scale_results": f.scale_results
        }
        for name, f in result.fields.items()
    },
    "full_text_preview": result.full_text[:500] + "..." if len(result.full_text) > 500 else result.full_text,
}

(output_dir / "zoom_ocr_output.json").write_text(
    json.dumps(json_output, ensure_ascii=False, indent=2),
    encoding='utf-8'
)
print(f"\n[OUTPUT] Saved to results/zoom_ocr_output.json")

print("\n[DONE]")
