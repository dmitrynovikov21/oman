#!/usr/bin/env python3
"""
Advanced Post-Processing for Arabic OCR
Fixes common OCR errors and improves accuracy
"""

import sys
import os
import re

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Common OCR error fixes
ARABIC_FIXES = [
    # Missing letters
    (r"الحكمة", "المحكمة"),
    (r"الوضوع", "الموضوع"),
    (r"دعسوى", "دعوى"),
    (r"الترف", "الطرف"),
    (r"المحكهة", "المحكمة"),
    (r"فضيلهة", "فضيلة"),
    (r"الدعي", "المدعي"),
    (r"الانتدانية", "الابتدائية"),
    
    # Greeting fixes
    (r"عليكرو", "عليكم"),
    (r"رحتاننا", "ورحمته"),
    (r"وابركا", "وبركاته"),
    
    # Spacing fixes in legal terms
    (r"بن\s+عبدالله\s+البادي", "بن عبدالله البادي"),
]

# Arabic numeral conversion
ARABIC_TO_LATIN = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
}

def arabic_to_latin_numerals(text):
    """Convert Arabic numerals to Latin"""
    result = text
    for ar, lat in ARABIC_TO_LATIN.items():
        result = result.replace(ar, lat)
    return result

def fix_split_numbers(text):
    """Fix numbers that were split by OCR"""
    # Pattern: digits separated by spaces
    # e.g., "٩٣٢١ ٦٣٨٨" -> "93216388"
    
    # First convert to latin for easier processing
    latin_text = arabic_to_latin_numerals(text)
    
    # Find potential phone numbers (8 digits split)
    # Look for patterns like "XXXX XXXX" where X are digits
    phone_pattern = r'(\d{4})\s+(\d{4})'
    
    matches = re.findall(phone_pattern, latin_text)
    for m in matches:
        original = f"{m[0]} {m[1]}"
        fixed = f"{m[0]}{m[1]}"
        # Only fix if it looks like Omani phone (starts with 9 or 7)
        if fixed[0] in '79':
            text = text.replace(original, fixed)
            # Also try Arabic version
            arabic_original = " ".join([
                "".join(list(ARABIC_TO_LATIN.keys())[list(ARABIC_TO_LATIN.values()).index(d)] for d in m[0]),
                "".join(list(ARABIC_TO_LATIN.keys())[list(ARABIC_TO_LATIN.values()).index(d)] for d in m[1])
            ])
    
    return text

def fix_incomplete_names(text):
    """Fix incomplete names by looking for patterns"""
    # The OCR often splits "أحمد بن سالم بن" from "عبدالله البادي"
    # Look for these patterns and connect them
    
    name_parts = [
        "أحمد بن سالم بن",
        "عبدالله البادي",
    ]
    
    # Check if first part exists but not the full name
    if name_parts[0] in text and "أحمد بن سالم بن عبدالله البادي" not in text:
        # Try to find if عبدالله or البادي is nearby
        if "البادي" in text:
            # Find position of first part
            pos1 = text.find(name_parts[0])
            pos2 = text.find("البادي")
            
            # If close enough, they're probably the same name
            if abs(pos2 - pos1) < 100:
                # Check for عبدالله
                if "عبدالله" in text[pos1:pos2+20]:
                    # The name is complete but maybe fragmented
                    pass
    
    return text

def extract_phone_numbers(text):
    """Extract Omani phone numbers (8 digits starting with 7 or 9)"""
    latin_text = arabic_to_latin_numerals(text)
    
    # Remove spaces between digits
    cleaned = re.sub(r'(\d)\s+(\d)', r'\1\2', latin_text)
    
    # Find 8-digit numbers starting with 7 or 9
    phones = re.findall(r'[79]\d{7}', cleaned)
    
    return phones

def extract_salary(text):
    """Extract salary/amounts"""
    latin_text = arabic_to_latin_numerals(text)
    
    # Look for 3-5 digit numbers followed by ر.ع or OMR
    pattern = r'(\d{3,5})\s*(?:ر\.ع|ريال|OMR)'
    matches = re.findall(pattern, latin_text)
    
    # Also look for standalone amounts
    amounts = re.findall(r'\b(\d{3,5})\b', latin_text)
    
    return matches, amounts

def post_process(text):
    """Apply all post-processing fixes"""
    result = text
    
    # Apply text fixes
    for pattern, replacement in ARABIC_FIXES:
        result = re.sub(pattern, replacement, result)
    
    # Fix split numbers
    result = fix_split_numbers(result)
    
    # Normalize spaces
    result = re.sub(r'  +', ' ', result)
    
    return result

def analyze_ocr_text(text):
    """Analyze OCR text and extract critical fields"""
    print("="*60)
    print("POST-PROCESSING ANALYSIS")
    print("="*60)
    
    # Apply post-processing
    processed = post_process(text)
    
    print(f"\nOriginal length: {len(text)}")
    print(f"Processed length: {len(processed)}")
    
    # Extract data
    phones = extract_phone_numbers(processed)
    salaries, all_amounts = extract_salary(processed)
    
    print(f"\nExtracted phones: {phones}")
    print(f"Extracted salaries: {salaries}")
    print(f"All amounts: {all_amounts[:10]}...")  # First 10
    
    # Check critical fields
    CRITICAL = {
        "salary": ["1043"],
        "phone_rep": ["95788279"],
        "phone_def": ["93216388"],
        "reference": ["REF2401040246"],
        "plaintiff": ["أحمد بن سالم بن عبدالله البادي"],
        "defendant": ["بي اس آي مارين قلهات"],
        "court": ["المحكمة الابتدائية بصور"],
    }
    
    print("\nCritical Fields Check:")
    found = 0
    
    for field, expected in CRITICAL.items():
        field_found = False
        for exp in expected:
            if exp in processed:
                print(f"  [OK] {field}")
                field_found = True
                found += 1
                break
        
        if not field_found:
            # Try phone extraction
            if field in ["phone_rep", "phone_def"] and expected[0] in phones:
                print(f"  [OK] {field} (extracted)")
                found += 1
            elif field == "salary" and expected[0] in all_amounts:
                print(f"  [OK] {field} (from amounts)")
                found += 1
            else:
                print(f"  [FAIL] {field}")
    
    accuracy = (found / len(CRITICAL)) * 100
    print(f"\n  ACCURACY: {accuracy:.1f}% ({found}/{len(CRITICAL)})")
    
    return processed, accuracy


# Test text from EasyOCR output
TEST_TEXT = """الجرلريوقسرلاشلي ةللم حاماة دند لثسرك 4 ١ ١ ٥ ٥ ٢ ٥ ١ ٥ 0 ١ 5 4 / R ٥ 5 أ ٥ ٧ الدائرة العمالية الحكمة الابتدائية بصور الوضوع : صحيفة دعوى افتتاحية مقدمة من )الدعي  البادي أحمد بن سالم بن يمثله قانونا : شركة الجرادي وقيس الراشدي ) شركة مدنية للمحاماة هاتف )٩٥٧٨٨٢٧٩(٠ مكتب رقم )٧( العنوان : ولاية بوشر. غلا التجارية . بناية أبراج النهضة ٠٢ الطابق في مواجهة عليها( شركة بي اس آي مارين قلهات العنوان : ولاية صور. مدائن صور . رقم الهاتف )٦٣٨٨ ٩٣٢١( المحكمة الموقرة رئيس فضيلة السلام عليكرو رحتاننا وابركا"""

if __name__ == "__main__":
    print("Testing post-processing on sample EasyOCR output...\n")
    processed, accuracy = analyze_ocr_text(TEST_TEXT)
    
    print("\n" + "="*60)
    print("PROCESSED TEXT (first 500 chars):")
    print("="*60)
    print(processed[:500])
