#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ExpertOS - EasyOCR Test for Arabic PDF
"""
import easyocr
import fitz  # PyMuPDF
import sys
import io
from pathlib import Path

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def pdf_to_images(pdf_path: str, output_dir: str = "temp_images"):
    """Convert PDF pages to images"""
    import os
    os.makedirs(output_dir, exist_ok=True)
    
    doc = fitz.open(pdf_path)
    image_paths = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        mat = fitz.Matrix(2, 2)  # 2x resolution
        pix = page.get_pixmap(matrix=mat)
        image_path = f"{output_dir}/page_{page_num + 1}.png"
        pix.save(image_path)
        image_paths.append(image_path)
        print(f"Page {page_num + 1} converted")
    
    doc.close()
    return image_paths

def ocr_with_easyocr(image_paths: list):
    """Run EasyOCR on images with Arabic + English"""
    reader = easyocr.Reader(['ar', 'en'], gpu=False)
    
    all_text = []
    
    for img_path in image_paths:
        print(f"OCR on {Path(img_path).name}...")
        result = reader.readtext(img_path, detail=0, paragraph=True)
        page_text = "\n".join(result) if result else "[NO TEXT]"
        all_text.append(page_text)
        print(f"  Got {len(result)} text blocks")
    
    return all_text

if __name__ == "__main__":
    pdf_path = r"c:\gravity\gravity\oman-auto-new\filesfortest1\أحمد سالم عبدالله البادي.pdf"
    
    if not Path(pdf_path).exists():
        print(f"File not found!")
        sys.exit(1)
    
    print(f"Processing: {Path(pdf_path).name}")
    print("="*60)
    
    # Convert PDF to images
    print("\n[1/2] Converting PDF to images...")
    image_paths = pdf_to_images(pdf_path)
    
    # Run EasyOCR
    print("\n[2/2] Running EasyOCR (Arabic + English)...")
    extracted_text = ocr_with_easyocr(image_paths)
    
    # Save result
    full_text = "\n\n=== PAGE BREAK ===\n\n".join(extracted_text)
    output_file = "easyocr_result.txt"
    
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(f"Source: {Path(pdf_path).name}\n")
        f.write(f"Pages: {len(extracted_text)}\n")
        f.write("="*60 + "\n\n")
        f.write(full_text)
    
    print(f"\n{'='*60}")
    print(f"SUCCESS!")
    print(f"Total chars: {len(full_text)}")
    print(f"Saved to: {output_file}")
    print(f"\nFirst 800 chars:")
    print("-"*40)
    print(full_text[:800])
