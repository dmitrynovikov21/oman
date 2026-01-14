#!/usr/bin/env python3
"""
Test Hybrid OCR Pipeline

Tests Surya layout + OpenCV preprocessing + EasyOCR on Omani legal documents.
"""

import sys
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import time
from pathlib import Path

# Test PDF
test_pdf = Path(r"c:\gravity\gravity\oman-auto-new\filesfortest1") / "أحمد سالم عبدالله البادي-1-2111.pdf"

print("=" * 70)
print("HYBRID OCR PIPELINE TEST")
print("Surya Layout + OpenCV Preprocessing + EasyOCR")
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
zoom = 200 / 72.0
matrix = fitz.Matrix(zoom, zoom)

images = []
for page_num in range(len(doc)):
    page = doc.load_page(page_num)
    pix = page.get_pixmap(matrix=matrix)
    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    images.append(img)
doc.close()

print(f"   Converted: {len(images)} pages")

# Initialize pipeline
print("\n[2] Initializing Hybrid Pipeline...")
from hybrid_pipeline import HybridOCRPipeline

pipeline = HybridOCRPipeline(
    use_surya=False,  # Disable Surya for now (API issues)
    use_preprocessing=True,  # Enable OpenCV preprocessing
    gpu=False,
    padding=10,
    upscale_factor=2.0,
)

# Process each page
print("\n[3] Processing pages...")
total_start = time.time()

all_results = []
for i, img in enumerate(images):
    print(f"\n   [Page {i+1}]")
    result = pipeline.process_image(img)
    all_results.append(result)
    
    print(f"   Time: {result.processing_time_ms}ms")
    print(f"   Zones: {len(result.zones)}")
    print(f"   Confidence: {result.confidence:.2f}")
    print(f"   Text preview: {result.cleaned_text[:100]}..." if result.cleaned_text else "   No text")

total_time = time.time() - total_start

# Combine results
print("\n" + "=" * 70)
print("RESULTS")
print("=" * 70)

# Get entities from first page
entities = all_results[0].entities if all_results else {}

print(f"\n[ENTITIES]")
print(f"   Phone:      {entities.get('phone', 'N/A')}")
print(f"   CR:         {entities.get('cr', 'N/A')}")
print(f"   Salary:     {entities.get('salary', 'N/A')}")
print(f"   Ref ID:     {entities.get('ref_id', 'N/A')}")
print(f"   Confidence: {entities.get('confidence', 'N/A')}")
print(f"   Warnings:   {entities.get('warnings', [])}")

print(f"\n[STATS]")
print(f"   Total time: {total_time:.1f}s")
print(f"   Pages: {len(images)}")

# Save output
output_dir = Path("./results")
output_dir.mkdir(exist_ok=True)

# Save full text
full_text = "\n\n".join([r.cleaned_text for r in all_results])
(output_dir / "hybrid_output.txt").write_text(full_text, encoding='utf-8')
print(f"\n[OUTPUT] Saved to results/hybrid_output.txt")

# Save JSON
import json
json_output = {
    "document": test_pdf.name,
    "pages": len(images),
    "total_time_s": total_time,
    "entities": entities,
    "page_results": [
        {
            "page": i + 1,
            "time_ms": r.processing_time_ms,
            "zones": len(r.zones),
            "confidence": r.confidence,
            "text": r.cleaned_text[:500] + "..." if len(r.cleaned_text) > 500 else r.cleaned_text,
        }
        for i, r in enumerate(all_results)
    ]
}
(output_dir / "hybrid_output.json").write_text(
    json.dumps(json_output, ensure_ascii=False, indent=2),
    encoding='utf-8'
)
print(f"[OUTPUT] Saved to results/hybrid_output.json")

print("\n" + "=" * 70)
print("GROUND TRUTH COMPARISON")
print("=" * 70)

ground_truth = {
    "phone": "95788279",
    "cr": "112693",
    "salary": "1043",
    "ref_id": "882401040246",
}

print(f"\n{'Field':<15} {'Ground Truth':<20} {'OCR Result':<20} {'Status'}")
print("-" * 70)

for field, expected in ground_truth.items():
    got = str(entities.get(field, "N/A"))
    if got == "None":
        got = "N/A"
    
    if expected in got or got in expected:
        status = "[OK]"
    elif got != "N/A":
        status = "[PARTIAL]"
    else:
        status = "[FAIL]"
    
    print(f"{field:<15} {expected:<20} {got:<20} {status}")

print("\n[DONE]")
