#!/usr/bin/env python3
"""
Full OCR Analysis - Save and analyze complete text
"""

import sys
import os

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import cv2

def main():
    # Load image
    img_path = r"c:\gravity\gravity\expertos\test-ocr-8-1\page_images\page_1.png"
    img = cv2.imread(img_path)
    print(f"Loaded: {img.shape}")
    
    # Run EasyOCR
    print("\nRunning EasyOCR (full analysis)...")
    import easyocr
    reader = easyocr.Reader(['ar', 'en'], gpu=False, verbose=False)
    results = reader.readtext(img)
    
    print(f"Found {len(results)} text boxes")
    
    # Save full text
    full_text = ""
    with open("ocr_full_output.txt", "w", encoding="utf-8") as f:
        f.write("="*60 + "\n")
        f.write("FULL OCR OUTPUT\n")
        f.write("="*60 + "\n\n")
        
        for i, (bbox, text, conf) in enumerate(results):
            line = f"[{i:03d}] conf={conf:.2f}: {text}\n"
            f.write(line)
            full_text += text + " "
        
        f.write("\n" + "="*60 + "\n")
        f.write("COMBINED TEXT\n")
        f.write("="*60 + "\n\n")
        f.write(full_text)
    
    print(f"Saved: ocr_full_output.txt ({len(full_text)} chars)")
    
    # Search for critical data
    print("\n" + "="*60)
    print("SEARCHING FOR CRITICAL DATA")
    print("="*60)
    
    # Convert Arabic numerals
    ARABIC_TO_LATIN = {
        '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
        '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
    }
    
    latin_text = full_text
    for ar, lat in ARABIC_TO_LATIN.items():
        latin_text = latin_text.replace(ar, lat)
    
    # Search patterns
    import re
    
    # Phone numbers (any 8-digit sequence)
    phones = re.findall(r'\d{8}', latin_text.replace(" ", ""))
    print(f"\nPhone-like numbers (8 digits): {phones}")
    
    # 4-digit numbers (potential salary)
    four_digit = re.findall(r'\b\d{4}\b', latin_text)
    print(f"4-digit numbers: {four_digit[:20]}")
    
    # Look for "1043" or parts
    if "1043" in latin_text:
        print("\n[FOUND] Salary 1043 in text!")
    else:
        # Check for parts
        if "104" in latin_text:
            idx = latin_text.find("104")
            print(f"Found '104' at position {idx}: ...{latin_text[max(0,idx-5):idx+10]}...")
        if "043" in latin_text:
            idx = latin_text.find("043")
            print(f"Found '043' at position {idx}: ...{latin_text[max(0,idx-5):idx+10]}...")
    
    # Search for key Arabic phrases
    key_phrases = [
        "عبدالله",
        "البادي", 
        "بي اس",
        "مارين",
        "قلهات",
        "REF",
        "1043",
        "٩٣٢١",
        "93216388",
    ]
    
    print("\nKey phrase search:")
    for phrase in key_phrases:
        if phrase in full_text or phrase in latin_text:
            print(f"  [FOUND] {phrase}")
        else:
            print(f"  [MISS]  {phrase}")
    
    # Show boxes with high confidence
    print("\n" + "="*60)
    print("HIGH CONFIDENCE BOXES (conf > 0.8)")
    print("="*60)
    for i, (bbox, text, conf) in enumerate(results):
        if conf > 0.8:
            print(f"  [{i:03d}] {conf:.2f}: {text}")

if __name__ == "__main__":
    main()
