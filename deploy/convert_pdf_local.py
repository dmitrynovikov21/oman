#!/usr/bin/env python3
"""Convert PDF to image locally and download OCR result for comparison"""
import subprocess, sys, os

# Convert PDF to image locally using pdftoppm/poppler
PDF_FILE = r"c:\gravity\gravity\oman-auto-new\filesfortest1\أحمد سالم عبدالله البادي-1-2111.pdf"
OUTPUT_DIR = r"c:\gravity\gravity\expertos\deploy"

# Try to convert using ImageMagick on Windows
print("[1] Converting PDF to PNG...")

try:
    # Using ImageMagick if available
    result = subprocess.run([
        "magick", 
        "-density", "300",
        PDF_FILE,
        "-quality", "100",
        os.path.join(OUTPUT_DIR, "test_page.png")
    ], capture_output=True, text=True, timeout=120)
    
    if result.returncode == 0:
        print("  Converted with ImageMagick")
    else:
        print(f"  ImageMagick error: {result.stderr}")
except Exception as e:
    print(f"  ImageMagick not available: {e}")
    print("  Trying alternative method...")

# Check if file exists
output_file = os.path.join(OUTPUT_DIR, "test_page-0.png")
output_file_alt = os.path.join(OUTPUT_DIR, "test_page.png")

if os.path.exists(output_file):
    print(f"  Created: {output_file}")
elif os.path.exists(output_file_alt):
    print(f"  Created: {output_file_alt}")
else:
    # Try poppler pdftoppm
    try:
        result = subprocess.run([
            "pdftoppm",
            "-png",
            "-r", "300",
            "-f", "1",
            "-l", "1",
            PDF_FILE,
            os.path.join(OUTPUT_DIR, "test_page")
        ], capture_output=True, text=True, timeout=120)
        print(f"  pdftoppm result: {result.returncode}")
    except Exception as e:
        print(f"  pdftoppm not available: {e}")

# List created files
print("\n[2] Files created:")
for f in os.listdir(OUTPUT_DIR):
    if f.startswith("test_page"):
        print(f"  - {f}")
