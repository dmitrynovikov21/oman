#!/usr/bin/env python3
"""
Test Ensemble OCR Pipeline Locally
Tests preprocessing and ensemble OCR on test images
"""

import sys
import os

# Fix Windows encoding
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import cv2
import numpy as np
from pathlib import Path

# Try importing our modules
try:
    from opencv_preprocessor import (
        preprocess_for_ocr, 
        deskew_image, 
        denoise_image, 
        enhance_contrast, 
        adaptive_binarize
    )
    print("[OK] opencv_preprocessor imported")
except Exception as e:
    print(f"❌ opencv_preprocessor import failed: {e}")

try:
    from ensemble_ocr import (
        EnsembleOCR, 
        TesseractEngine, 
        EasyOCREngine, 
        extract_critical_fields,
        TESSERACT_AVAILABLE,
        EASYOCR_AVAILABLE,
        PADDLEOCR_AVAILABLE
    )
    print("✅ ensemble_ocr imported")
except Exception as e:
    print(f"❌ ensemble_ocr import failed: {e}")


# Expected critical values from the test document
EXPECTED_VALUES = {
    "salary": ["١٠٤٣", "1043"],  # Either Arabic or Latin OK
    "phones": ["95788279", "24502998", "93216388"],
    "reference": ["REF2401040246"],
    "law_article": ["١٠٧", "107"],
    "cr_number": ["١٢٠٤٦٩٣", "1204693"],
}


def test_preprocessing(image_path: str):
    """Test OpenCV preprocessing functions"""
    print("\n" + "="*60)
    print("Testing Preprocessing Pipeline")
    print("="*60)
    
    img = cv2.imread(image_path)
    if img is None:
        print(f"❌ Could not load image: {image_path}")
        return None
    
    print(f"✅ Loaded image: {img.shape}")
    
    # Test each step
    print("\n1. Deskew...")
    deskewed = deskew_image(img)
    print(f"   Output shape: {deskewed.shape}")
    
    print("\n2. Denoise...")
    denoised = denoise_image(deskewed)
    print(f"   Output shape: {denoised.shape}")
    
    print("\n3. Contrast enhancement...")
    enhanced = enhance_contrast(denoised)
    print(f"   Output shape: {enhanced.shape}")
    
    print("\n4. Adaptive binarization...")
    binary = adaptive_binarize(enhanced)
    print(f"   Output shape: {binary.shape}")
    
    print("\n5. Full pipeline...")
    final = preprocess_for_ocr(img)
    print(f"   Output shape: {final.shape}")
    
    # Save outputs for inspection
    output_dir = Path(image_path).parent / "preprocessing_test"
    output_dir.mkdir(exist_ok=True)
    
    cv2.imwrite(str(output_dir / "1_original.png"), img)
    cv2.imwrite(str(output_dir / "2_deskewed.png"), deskewed)
    cv2.imwrite(str(output_dir / "3_denoised.png"), denoised)
    cv2.imwrite(str(output_dir / "4_enhanced.png"), enhanced)
    cv2.imwrite(str(output_dir / "5_binary.png"), binary)
    cv2.imwrite(str(output_dir / "6_final.png"), final)
    
    print(f"\n✅ Saved outputs to: {output_dir}")
    
    return final


def test_ocr_engines(image: np.ndarray):
    """Test individual OCR engines"""
    print("\n" + "="*60)
    print("Testing OCR Engines")
    print("="*60)
    
    print(f"\nEngine availability:")
    print(f"  Tesseract: {TESSERACT_AVAILABLE}")
    print(f"  EasyOCR: {EASYOCR_AVAILABLE}")
    print(f"  PaddleOCR: {PADDLEOCR_AVAILABLE}")
    
    results = {}
    
    # Test Tesseract
    if TESSERACT_AVAILABLE:
        print("\n1. Testing Tesseract...")
        engine = TesseractEngine(lang="ara", psm=6, oem=1)
        result = engine.run(image)
        results["tesseract"] = result
        print(f"   Text length: {len(result.text)}")
        print(f"   Confidence: {result.confidence:.2f}")
        print(f"   First 200 chars: {result.text[:200]}...")
    
    # Test EasyOCR
    if EASYOCR_AVAILABLE:
        print("\n2. Testing EasyOCR...")
        engine = EasyOCREngine(langs=["ar", "en"])
        result = engine.run(image)
        results["easyocr"] = result
        print(f"   Text length: {len(result.text)}")
        print(f"   Confidence: {result.confidence:.2f}")
        print(f"   First 200 chars: {result.text[:200]}...")
    
    # Test PaddleOCR
    if PADDLEOCR_AVAILABLE:
        print("\n3. Testing PaddleOCR...")
        from ensemble_ocr import PaddleOCREngine
        engine = PaddleOCREngine(lang="ar")
        result = engine.run(image)
        results["paddleocr"] = result
        print(f"   Text length: {len(result.text)}")
        print(f"   Confidence: {result.confidence:.2f}")
        print(f"   First 200 chars: {result.text[:200]}...")
    
    return results


def test_ensemble(image: np.ndarray):
    """Test ensemble OCR with voting"""
    print("\n" + "="*60)
    print("Testing Ensemble OCR")
    print("="*60)
    
    ensemble = EnsembleOCR()
    text, confidence, results = ensemble.recognize(image)
    
    print(f"\n✅ Ensemble result:")
    print(f"   Confidence: {confidence:.2f}")
    print(f"   Text length: {len(text)}")
    
    # Check critical fields
    print("\n🔍 Checking critical fields:")
    fields = extract_critical_fields(text)
    
    accuracy = 0
    total = len(EXPECTED_VALUES)
    
    for field_name, expected in EXPECTED_VALUES.items():
        # Check if any expected value is found
        found = False
        found_value = None
        
        for exp in expected:
            if exp in text:
                found = True
                found_value = exp
                break
        
        if found:
            print(f"   ✅ {field_name}: Found '{found_value}'")
            accuracy += 1
        else:
            print(f"   ❌ {field_name}: NOT FOUND (expected: {expected})")
    
    accuracy_pct = (accuracy / total) * 100
    print(f"\n🎯 Critical Field Accuracy: {accuracy_pct:.1f}% ({accuracy}/{total})")
    
    return text, fields, accuracy_pct


def main():
    print("="*60)
    print("ENSEMBLE OCR PIPELINE TEST")
    print("="*60)
    
    # Find test image
    test_images = [
        r"c:\gravity\gravity\expertos\test-ocr-8-1\page_images\page_1.png",
        r"c:\gravity\gravity\expertos\deploy\test_page_1.png",
    ]
    
    test_image = None
    for path in test_images:
        if os.path.exists(path):
            test_image = path
            break
    
    if not test_image:
        print("❌ No test image found!")
        print("Available test images should be in test-ocr-8-1/page_images/")
        return
    
    print(f"\nUsing test image: {test_image}")
    
    # Test preprocessing
    preprocessed = test_preprocessing(test_image)
    if preprocessed is None:
        return
    
    # Test individual engines
    test_ocr_engines(preprocessed)
    
    # Test ensemble
    text, fields, accuracy = test_ensemble(preprocessed)
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"Critical Field Accuracy: {accuracy:.1f}%")
    print(f"Target: 95-100%")
    
    if accuracy >= 95:
        print("🎉 TARGET ACHIEVED!")
    elif accuracy >= 80:
        print("⚠️ Close to target, needs tuning")
    else:
        print("❌ Below target, needs improvement")


if __name__ == "__main__":
    main()
