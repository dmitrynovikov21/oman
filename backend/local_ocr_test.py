#!/usr/bin/env python3
"""
Local OCR Quality Test - Compare different OCR approaches
Tests on page_1.png and measures accuracy on critical fields
"""

import sys
import os

# Fix Windows encoding
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import cv2
import numpy as np
from pathlib import Path

# Expected critical values
CRITICAL_FIELDS = {
    "salary": ["1043", "١٠٤٣"],
    "phone_rep": ["95788279"],
    "phone_def": ["93216388"],
    "reference": ["REF2401040246"],
    "plaintiff_name": ["أحمد بن سالم بن عبدالله البادي"],
    "defendant": ["بي اس آي مارين قلهات", "بي اس أي", "مارين قلهات"],
    "court": ["المحكمة الابتدائية بصور"],
}

def load_test_image():
    """Load test image"""
    paths = [
        r"c:\gravity\gravity\expertos\test-ocr-8-1\page_images\page_1.png",
        r"c:\gravity\gravity\expertos\deploy\test_page_1.png",
    ]
    for p in paths:
        if os.path.exists(p):
            img = cv2.imread(p)
            if img is not None:
                print(f"Loaded: {p}")
                print(f"Size: {img.shape}")
                return img
    return None

def preprocess_image(img):
    """Apply preprocessing for better OCR"""
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Denoise
    denoised = cv2.fastNlMeansDenoising(gray, h=10)
    
    # Enhance contrast (CLAHE)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    enhanced = clahe.apply(denoised)
    
    # Adaptive binarization
    binary = cv2.adaptiveThreshold(
        enhanced, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        15, 5
    )
    
    return binary

def test_easyocr(img):
    """Test with EasyOCR"""
    print("\n" + "="*60)
    print("Testing EasyOCR")
    print("="*60)
    
    try:
        import easyocr
        reader = easyocr.Reader(['ar', 'en'], gpu=False, verbose=False)
        
        # Run OCR
        results = reader.readtext(img)
        
        # Combine text
        text = " ".join([r[1] for r in results])
        confidence = sum([r[2] for r in results]) / len(results) if results else 0
        
        print(f"Text length: {len(text)}")
        print(f"Avg confidence: {confidence:.2f}")
        
        return text, confidence
    except Exception as e:
        print(f"EasyOCR Error: {e}")
        return "", 0

def test_pytesseract(img):
    """Test with Tesseract via pytesseract"""
    print("\n" + "="*60)
    print("Testing Tesseract (pytesseract)")
    print("="*60)
    
    try:
        import pytesseract
        
        # Try different PSM modes
        configs = [
            ("PSM 6 (block)", "--psm 6 --oem 1"),
            ("PSM 3 (auto)", "--psm 3 --oem 1"),
            ("PSM 4 (column)", "--psm 4 --oem 1"),
        ]
        
        best_text = ""
        best_len = 0
        
        for name, config in configs:
            try:
                text = pytesseract.image_to_string(img, lang='ara', config=config)
                print(f"  {name}: {len(text)} chars")
                if len(text) > best_len:
                    best_text = text
                    best_len = len(text)
            except Exception as e:
                print(f"  {name}: Error - {e}")
        
        return best_text, 0.5  # No confidence from basic tesseract
    except Exception as e:
        print(f"Tesseract Error: {e}")
        return "", 0

def check_accuracy(text, name):
    """Check accuracy against critical fields"""
    print(f"\n{name} - Critical Fields Check:")
    found = 0
    total = len(CRITICAL_FIELDS)
    
    for field_name, expected_values in CRITICAL_FIELDS.items():
        field_found = False
        found_value = None
        
        for exp in expected_values:
            if exp in text:
                field_found = True
                found_value = exp
                break
        
        if field_found:
            print(f"  [OK] {field_name}: '{found_value[:30]}...' " if len(found_value) > 30 else f"  [OK] {field_name}: '{found_value}'")
            found += 1
        else:
            print(f"  [FAIL] {field_name}")
    
    accuracy = (found / total) * 100
    print(f"\n  ACCURACY: {accuracy:.1f}% ({found}/{total})")
    return accuracy

def main():
    print("="*60)
    print("LOCAL OCR QUALITY TEST")
    print("="*60)
    
    # Load image
    img = load_test_image()
    if img is None:
        print("ERROR: No test image found!")
        return
    
    # Test without preprocessing
    print("\n--- Testing on ORIGINAL image ---")
    
    easyocr_text, easyocr_conf = test_easyocr(img)
    easyocr_acc = check_accuracy(easyocr_text, "EasyOCR (original)")
    
    tesseract_text, tesseract_conf = test_pytesseract(img)
    tesseract_acc = check_accuracy(tesseract_text, "Tesseract (original)")
    
    # Test with preprocessing
    print("\n--- Testing on PREPROCESSED image ---")
    preprocessed = preprocess_image(img)
    
    # Save preprocessed for inspection
    cv2.imwrite("test_preprocessed.png", preprocessed)
    print("Saved: test_preprocessed.png")
    
    easyocr_text2, easyocr_conf2 = test_easyocr(preprocessed)
    easyocr_acc2 = check_accuracy(easyocr_text2, "EasyOCR (preprocessed)")
    
    tesseract_text2, tesseract_conf2 = test_pytesseract(preprocessed)
    tesseract_acc2 = check_accuracy(tesseract_text2, "Tesseract (preprocessed)")
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"{'Method':<30} {'Original':<12} {'Preprocessed':<12}")
    print("-"*54)
    print(f"{'EasyOCR':<30} {easyocr_acc:.1f}%{'':<6} {easyocr_acc2:.1f}%")
    print(f"{'Tesseract':<30} {tesseract_acc:.1f}%{'':<6} {tesseract_acc2:.1f}%")
    print("-"*54)
    print(f"Target: 95-100%")
    
    # Show sample text
    print("\n--- Sample EasyOCR text (first 500 chars) ---")
    print(easyocr_text[:500] if easyocr_text else "No text")

if __name__ == "__main__":
    main()
