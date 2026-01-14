#!/usr/bin/env python3
"""
Test EasyOCR on Arabic document
"""

import sys
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

from pathlib import Path
import time

# Test PDF path
test_pdf = Path(r"c:\gravity\gravity\oman-auto-new\filesfortest1") / "أحمد سالم عبدالله البادي-1-2111.pdf"

print(f"Testing EasyOCR on: {test_pdf.name}")
print("=" * 60)

# Convert PDF to images
import fitz
from PIL import Image

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

print(f"Converted to {len(images)} images")

# Initialize EasyOCR
print("\nLoading EasyOCR (Arabic + English)...")
start = time.time()

import easyocr
import numpy as np

reader = easyocr.Reader(['ar', 'en'], gpu=False)
print(f"EasyOCR loaded in {time.time() - start:.1f}s")

# Process each page
print("\n" + "=" * 60)
print("RESULTS")
print("=" * 60)

all_text = []

for i, img in enumerate(images):
    print(f"\n[Page {i+1}]")
    start = time.time()
    
    # Convert PIL to numpy
    img_array = np.array(img)
    
    # Run OCR
    results = reader.readtext(img_array)
    
    # Extract text
    page_text = "\n".join([r[1] for r in results])
    all_text.append(page_text)
    
    print(f"  Time: {time.time() - start:.1f}s")
    print(f"  Blocks: {len(results)}")
    print(f"  Text sample: {page_text[:200]}...")

# Combine and validate
full_text = "\n\n".join(all_text)

print("\n" + "=" * 60)
print("ENTITY EXTRACTION")
print("=" * 60)

# Import validator
from validator import ExpertOSValidator

validator = ExpertOSValidator()
result = validator.validate_document(full_text)

print(f"Phone: {result.phone}")
print(f"CR: {result.cr}")
print(f"Salary: {result.salary}")
print(f"Ref ID: {result.ref_id}")
print(f"Dates: {result.dates}")
print(f"Confidence: {result.confidence.value}")
print(f"Warnings: {result.warnings}")

# Save output
output_path = Path("./results/easyocr_output.txt")
output_path.parent.mkdir(exist_ok=True)
output_path.write_text(full_text, encoding='utf-8')
print(f"\nFull text saved to: {output_path}")

print("\n[DONE]")
