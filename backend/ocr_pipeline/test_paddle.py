
import sys
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

from paddleocr import PaddleOCR
import fitz
from PIL import Image
import numpy as np
import time

PDF_PATH = "test.pdf"

print("Initializing PaddleOCR...")
# use_angle_cls=True helps with skewed scans
# lang='ar' loads Arabic + English models because Arabic model covers English chars too usually
ocr = PaddleOCR(use_angle_cls=True, lang='ar') 

print(f"Processing {PDF_PATH}...")

# 1. Convert to Image (300 DPI)
doc = fitz.open(PDF_PATH)
page = doc.load_page(0)
zoom = 300 / 72.0
matrix = fitz.Matrix(zoom, zoom)
pix = page.get_pixmap(matrix=matrix)
img_array = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3) # RGB
doc.close()

print(f"Image shape: {img_array.shape}")

# 2. Run PaddleOCR
start = time.time()
print("Running PaddleOCR extraction...")

# result is a list of [box, (text, score)]
result = ocr.ocr(img_array)

print(f"Time: {time.time() - start:.2f}s")

# 3. Print Results
full_text = []

print(f"DEBUG Type: {type(result)}")
if isinstance(result, list):
    print(f"DEBUG Len: {len(result)}")
    if len(result) > 0:
        print(f"DEBUG Item 0: {result[0]}")
        
# Parse PaddleOCR v4 Output (Dictionary)
if isinstance(result, list) and len(result) > 0 and isinstance(result[0], dict):
    res_dict = result[0]
    
    if 'rec_texts' in res_dict and 'rec_scores' in res_dict:
        texts = res_dict['rec_texts']
        scores = res_dict['rec_scores']
        
        print(f"DEBUG: Found {len(texts)} text lines.")
        
        for i, txt in enumerate(texts):
            score = scores[i]
            full_text.append(txt)
            
            # Check specific keywords
            if "دعوى" in txt or "شركة" in txt or "سالم" in txt or "المحكمة" in txt:
                 print(f"  FOUND: {txt} ({score:.2f})")
    else:
        print(f"DEBUG: Unexpected dict keys: {res_dict.keys()}")
else:
    # Legacy Fallback
    print("DEBUG: Using legacy parsing...")
    lines = result[0] if result else []
    for line in lines:
        try:
            txt = line[1][0]
            full_text.append(txt)
        except: pass

print("\n--- FULL TEXT ---")
print("\n".join(full_text))
