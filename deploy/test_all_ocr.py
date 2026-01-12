#!/usr/bin/env python3
"""Test ALL OCR tools - Fixed version"""
import subprocess
import sys
import os
import time

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

print("=" * 70)
print("OCR TOOLS COMPARISON TEST")
print("=" * 70)

IMAGE_PATH = r"c:\gravity\gravity\expertos\deploy\test_page_1.png"
if not os.path.exists(IMAGE_PATH):
    print(f"ERROR: Image not found")
    sys.exit(1)

print(f"\nTest image: {IMAGE_PATH}")
print(f"Size: {os.path.getsize(IMAGE_PATH):,} bytes")

KEY_PHRASES = [
    ("أحمد بن سالم بن عبدالله البادي", "Plaintiff name"),
    ("شركة الجرادي وقيس الراشدي", "Law firm"),
    ("المحكمة الابتدائية بصور", "Court name"),
    ("الدائرة العمالية", "Labor division"),
    ("شركة بي اس أي مارين قلهات", "Defendant"),
    ("ولاية بوشر", "State"),
    ("غلا التجارية", "Area"),
    ("95788279", "Phone 1"),
    ("24502998", "Phone 2"),
    ("صحيفة دعوى افتتاحية", "Legal term"),
    ("قانون العمل", "Labor law"),
    ("المدعي", "Plaintiff term"),
    ("المدعى عليها", "Defendant term"),
    ("بناية أبراج النهضة", "Building"),
    ("مكتب رقم", "Office"),
    ("تسوية منازعات العمل", "Labor disputes"),
]

def check_accuracy(text, phrases):
    found = 0
    results = []
    for phrase, desc in phrases:
        if phrase in text:
            found += 1
            results.append((desc, phrase, "OK"))
        else:
            results.append((desc, phrase, "MISS"))
    return (found / len(phrases)) * 100, results

all_results = []

# ============================================
# TEST 1: EasyOCR
# ============================================
print("\n" + "=" * 70)
print("TEST 1: EasyOCR (Deep Learning)")
print("=" * 70)

try:
    try:
        import easyocr
    except ImportError:
        print("Installing EasyOCR...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "easyocr", "-q"])
        import easyocr
    
    print("Loading model...")
    start = time.time()
    reader = easyocr.Reader(['ar', 'en'], gpu=False, verbose=False)
    print(f"Loaded in {time.time()-start:.1f}s")
    
    print("Running OCR...")
    start = time.time()
    result = reader.readtext(IMAGE_PATH, detail=0, paragraph=True)
    elapsed = time.time() - start
    
    easyocr_text = "\n".join(result)
    print(f"Done in {elapsed:.1f}s, {len(easyocr_text)} chars")
    
    accuracy, details = check_accuracy(easyocr_text, KEY_PHRASES)
    print(f"ACCURACY: {accuracy:.1f}%")
    
    for desc, phrase, status in details:
        icon = "[+]" if status == "OK" else "[-]"
        print(f"  {icon} {desc}")
    
    with open(r"c:\gravity\gravity\expertos\deploy\ocr_easyocr.txt", "w", encoding="utf-8") as f:
        f.write(easyocr_text)
    
    all_results.append(("EasyOCR", accuracy, len(easyocr_text), easyocr_text))
    
except Exception as e:
    print(f"EasyOCR ERROR: {e}")

# ============================================
# TEST 2: Tesseract (pythonlocal)
# ============================================
print("\n" + "=" * 70)
print("TEST 2: Tesseract via Python")
print("=" * 70)

try:
    try:
        import pytesseract
        from PIL import Image
    except ImportError:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pytesseract", "pillow", "-q"])
        import pytesseract
        from PIL import Image
    
    img = Image.open(IMAGE_PATH)
    print("Running Tesseract...")
    start = time.time()
    
    tesseract_text = pytesseract.image_to_string(img, lang='ara', config='--psm 3 --oem 1')
    elapsed = time.time() - start
    
    print(f"Done in {elapsed:.1f}s, {len(tesseract_text)} chars")
    
    accuracy, details = check_accuracy(tesseract_text, KEY_PHRASES)
    print(f"ACCURACY: {accuracy:.1f}%")
    
    for desc, phrase, status in details:
        icon = "[+]" if status == "OK" else "[-]"
        print(f"  {icon} {desc}")
    
    with open(r"c:\gravity\gravity\expertos\deploy\ocr_tesseract.txt", "w", encoding="utf-8") as f:
        f.write(tesseract_text)
    
    all_results.append(("Tesseract", accuracy, len(tesseract_text), tesseract_text))
    
except Exception as e:
    print(f"Tesseract ERROR: {e}")

# ============================================
# TEST 3: PaddleOCR
# ============================================
print("\n" + "=" * 70)
print("TEST 3: PaddleOCR")
print("=" * 70)

try:
    try:
        from paddleocr import PaddleOCR
    except ImportError:
        print("Installing PaddleOCR (may take a while)...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "paddlepaddle", "paddleocr", "-q"])
        from paddleocr import PaddleOCR
    
    print("Loading model...")
    start = time.time()
    # Fixed: removed show_log parameter
    ocr = PaddleOCR(lang='ar', use_gpu=False)
    print(f"Loaded in {time.time()-start:.1f}s")
    
    print("Running OCR...")
    start = time.time()
    result = ocr.ocr(IMAGE_PATH, cls=True)
    elapsed = time.time() - start
    
    paddle_text = ""
    if result and result[0]:
        for line in result[0]:
            if line and len(line) > 1:
                paddle_text += line[1][0] + "\n"
    
    print(f"Done in {elapsed:.1f}s, {len(paddle_text)} chars")
    
    accuracy, details = check_accuracy(paddle_text, KEY_PHRASES)
    print(f"ACCURACY: {accuracy:.1f}%")
    
    for desc, phrase, status in details:
        icon = "[+]" if status == "OK" else "[-]"
        print(f"  {icon} {desc}")
    
    with open(r"c:\gravity\gravity\expertos\deploy\ocr_paddle.txt", "w", encoding="utf-8") as f:
        f.write(paddle_text)
    
    all_results.append(("PaddleOCR", accuracy, len(paddle_text), paddle_text))
    
except Exception as e:
    print(f"PaddleOCR ERROR: {e}")

# ============================================
# SUMMARY
# ============================================
print("\n" + "=" * 70)
print("SUMMARY")
print("=" * 70)

all_results.sort(key=lambda x: x[1], reverse=True)

print("\n| Tool        | Accuracy | Chars  |")
print("|-------------|----------|--------|")
for tool, acc, chars, _ in all_results:
    print(f"| {tool:11} | {acc:6.1f}%  | {chars:6} |")

if all_results:
    best = all_results[0]
    print(f"\nBEST: {best[0]} with {best[1]:.1f}% accuracy")
    print(f"\nFirst 1000 chars of best result:")
    print("-" * 50)
    print(best[3][:1000])
