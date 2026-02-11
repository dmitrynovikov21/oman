#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ExpertOS - Real OCR Test with PaddleOCR
Извлечение текста из СКАНИРОВАННОГО арабского PDF
"""
from paddleocr import PaddleOCR
import fitz  # PyMuPDF
import sys
import io
from pathlib import Path

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def pdf_to_images(pdf_path: str, output_dir: str = "temp_images"):
    """Конвертирует PDF страницы в изображения"""
    import os
    os.makedirs(output_dir, exist_ok=True)
    
    doc = fitz.open(pdf_path)
    image_paths = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        # Render at 2x resolution for better OCR
        mat = fitz.Matrix(2, 2)
        pix = page.get_pixmap(matrix=mat)
        image_path = f"{output_dir}/page_{page_num + 1}.png"
        pix.save(image_path)
        image_paths.append(image_path)
        print(f"Converted page {page_num + 1} to image")
    
    doc.close()
    return image_paths

def ocr_images(image_paths: list, lang: str = 'ar'):
    """Выполняет OCR на изображениях с арабским языком"""
    # Initialize PaddleOCR with Arabic language support (new API)
    ocr = PaddleOCR(lang=lang)
    
    all_text = []
    
    for img_path in image_paths:
        print(f"Running OCR on {Path(img_path).name}...")
        result = ocr.ocr(img_path)
        
        page_text = []
        if result and result[0]:
            for line in result[0]:
                # line[1][0] contains the recognized text
                text = line[1][0]
                page_text.append(text)
        
        all_text.append("\n".join(page_text))
        print(f"  Extracted {len(page_text)} text blocks")
    
    return all_text

if __name__ == "__main__":
    pdf_path = r"c:\gravity\gravity\oman-auto-new\filesfortest1\أحمد سالم عبدالله البادي.pdf"
    
    if not Path(pdf_path).exists():
        print(f"File not found: {pdf_path}")
        sys.exit(1)
    
    print(f"Processing: {Path(pdf_path).name}")
    print("="*60)
    
    # Step 1: Convert PDF to images
    print("\n[1/2] Converting PDF pages to images...")
    image_paths = pdf_to_images(pdf_path)
    print(f"Converted {len(image_paths)} pages")
    
    # Step 2: Run OCR on images
    print("\n[2/2] Running PaddleOCR (Arabic)...")
    extracted_text = ocr_images(image_paths)
    
    # Save result
    output_file = "ocr_result_arabic.txt"
    full_text = "\n\n---PAGE BREAK---\n\n".join(extracted_text)
    
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(f"Source: {Path(pdf_path).name}\n")
        f.write(f"Pages: {len(extracted_text)}\n")
        f.write("="*60 + "\n\n")
        f.write(full_text)
    
    print(f"\n{'='*60}")
    print(f"SUCCESS! OCR complete.")
    print(f"Total characters extracted: {len(full_text)}")
    print(f"Result saved to: {output_file}")
    print(f"\nFirst 500 characters:")
    print("-"*40)
    print(full_text[:500])
