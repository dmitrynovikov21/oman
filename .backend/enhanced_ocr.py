#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ExpertOS - ENHANCED OCR with preprocessing
Улучшенный OCR: 4x разрешение, предобработка, постобработка
"""
import easyocr
import fitz  # PyMuPDF
import cv2
import numpy as np
import sys
import io
import os
import re
from pathlib import Path

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Common Arabic OCR error corrections
ARABIC_CORRECTIONS = {
    'الحكمة': 'المحكمة',
    'دعسوى': 'دعوى',
    'الوضوع': 'الموضوع',
    'الدعي': 'المدعي',
    'الترف': 'الطرف',
    'ممارسسات': 'ممارسات',
    'المسدعى': 'المدعى',
    ')': '(',
    '(': ')',
}

def pdf_to_images_high_res(pdf_path: str, output_dir: str) -> list:
    """Convert PDF to HIGH RESOLUTION images (4x)"""
    os.makedirs(output_dir, exist_ok=True)
    
    doc = fitz.open(pdf_path)
    image_paths = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        # 4x resolution for better OCR
        mat = fitz.Matrix(4, 4)
        pix = page.get_pixmap(matrix=mat)
        image_path = os.path.join(output_dir, f"page_{page_num + 1}_hires.png")
        pix.save(image_path)
        image_paths.append(image_path)
        print(f"Page {page_num + 1}: converted at 4x resolution")
    
    doc.close()
    return image_paths

def preprocess_image(image_path: str) -> str:
    """Preprocess image for better OCR accuracy"""
    # Read image
    img = cv2.imread(image_path)
    
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Denoise
    denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
    
    # Increase contrast using CLAHE
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    enhanced = clahe.apply(denoised)
    
    # Slight sharpening
    kernel = np.array([[-1,-1,-1], 
                       [-1, 9,-1], 
                       [-1,-1,-1]])
    sharpened = cv2.filter2D(enhanced, -1, kernel)
    
    # Save preprocessed image
    preprocessed_path = image_path.replace('.png', '_preprocessed.png')
    cv2.imwrite(preprocessed_path, sharpened)
    
    return preprocessed_path

def postprocess_arabic_text(text: str) -> str:
    """Fix common Arabic OCR errors"""
    result = text
    
    for wrong, correct in ARABIC_CORRECTIONS.items():
        result = result.replace(wrong, correct)
    
    # Remove single character lines (noise)
    lines = result.split('\n')
    cleaned_lines = [line for line in lines if len(line.strip()) > 1]
    result = '\n'.join(cleaned_lines)
    
    # Fix parentheses (Arabic uses opposite direction)
    # This is handled in corrections dict
    
    return result

def ocr_with_preprocessing(image_paths: list) -> dict:
    """Run OCR with preprocessing and postprocessing"""
    reader = easyocr.Reader(['ar', 'en'], gpu=False)
    
    all_text = []
    
    for i, img_path in enumerate(image_paths):
        print(f"Processing page {i+1}...")
        
        # Preprocess image
        print(f"  Preprocessing...")
        preprocessed_path = preprocess_image(img_path)
        
        # Run OCR on preprocessed image
        print(f"  Running OCR...")
        result = reader.readtext(preprocessed_path, detail=0, paragraph=True)
        page_text = "\n".join(result) if result else ""
        
        # Postprocess text
        page_text = postprocess_arabic_text(page_text)
        
        all_text.append(page_text)
        print(f"  Extracted {len(page_text)} chars")
    
    full_text = "\n\n=== PAGE BREAK ===\n\n".join(all_text)
    
    return {
        "pages": len(all_text),
        "full_text": full_text,
        "total_chars": len(full_text)
    }

if __name__ == "__main__":
    pdf_path = r"c:\gravity\gravity\oman-auto-new\filesfortest1\أحمد سالم عبدالله البادي.pdf"
    
    if not Path(pdf_path).exists():
        print(f"File not found!")
        sys.exit(1)
    
    print(f"ENHANCED OCR Processing")
    print(f"File: {Path(pdf_path).name}")
    print("="*60)
    
    # Step 1: Convert to high-res images
    print("\n[1/3] Converting PDF to HIGH-RES images (4x)...")
    output_dir = "temp_images_enhanced"
    image_paths = pdf_to_images_high_res(pdf_path, output_dir)
    
    # Step 2: OCR with preprocessing
    print("\n[2/3] Running ENHANCED OCR with preprocessing...")
    result = ocr_with_preprocessing(image_paths)
    
    # Step 3: Save result
    print("\n[3/3] Saving result...")
    output_file = "enhanced_ocr_result.txt"
    
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(f"Source: {Path(pdf_path).name}\n")
        f.write(f"Pages: {result['pages']}\n")
        f.write(f"Method: Enhanced OCR (4x res + preprocessing + postprocessing)\n")
        f.write("="*60 + "\n\n")
        f.write(result['full_text'])
    
    print(f"\n{'='*60}")
    print(f"SUCCESS!")
    print(f"Total chars: {result['total_chars']}")
    print(f"Saved to: {output_file}")
    print(f"\nFirst 1000 chars:")
    print("-"*40)
    print(result['full_text'][:1000])
