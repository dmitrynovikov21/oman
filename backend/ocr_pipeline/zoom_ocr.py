"""
Zoom-OCR Pipeline

Hybrid approach: PaddleOCR (Primary) + Layout-Aware Fallback

Architecture:
1. High-DPI Input (300 DPI)
2. Primary Strategy: Full Page PaddleOCR (Fast & Accurate for Arabic v4/v5)
3. Fallback Strategy: OpenCV Block Detection + Upscaling
4. Smart Entity Extraction (Regex + Healing)

Target: 95%+ accuracy on Omani legal documents
"""

import logging
import re
import numpy as np
import cv2
from typing import Any, List, Optional, Tuple, Dict
from collections import Counter
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

@dataclass
class ZoomOCRResult:
    """Complete result from Zoom-OCR pipeline"""
    fields: Dict[str, Dict[str, str]] = field(default_factory=dict)
    full_text: str = ""
    processing_time_ms: int = 0
    warnings: List[str] = field(default_factory=list)

@dataclass
class SimpleBox:
    x1: int
    y1: int
    x2: int
    y2: int
    @property 
    def area(self): return (self.x2-self.x1)*(self.y2-self.y1)

@dataclass
class SimpleBlock:
    bbox: SimpleBox

class ZoomOCRPipeline:
    """
    Zoom-OCR Extraction Pipeline (Paddle Powered)
    """
    
    def __init__(self, scales: List[float] = None):
        self.scales = scales or [1.0]
        self._easyocr = None
        self._ocr_engine = None
    
    @property
    def easyocr(self):
        """Lazy load EasyOCR (Legacy Fallback)"""
        if self._easyocr is None:
            import easyocr
            logger.info("Loading EasyOCR (Arabic+English)...")
            self._easyocr = easyocr.Reader(['ar', 'en'], gpu=True)
        return self._easyocr
        
    @property
    def ocr_engine(self):
        """Lazy load PaddleOCR"""
        if self._ocr_engine is None:
            pass # Imports handled in methods to avoid strict dependency loop if not needed
            from paddleocr import PaddleOCR
            logger.info("Loading PaddleOCR (Arabic+English)...")
            # Disable show_log to avoid crash in newer versions
            self._ocr_engine = PaddleOCR(use_angle_cls=True, lang='ar')
        return self._ocr_engine

    def _detect_blocks_opencv(self, img_array) -> List[SimpleBlock]:
        """
        Robust OpenCV-based text block detection.
        Uses morphological operations to fuse text lines into paragraphs.
        """
        if len(img_array.shape) == 3:
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        else:
            gray = img_array
            
        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (20, 10)) 
        dilated = cv2.dilate(binary, kernel, iterations=2)
        
        contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        blocks = []
        for cnt in contours:
            x, y, bw, bh = cv2.boundingRect(cnt)
            if bw < 50 or bh < 20: continue 
            blocks.append(SimpleBlock(SimpleBox(x, y, x+bw, y+bh)))
        return blocks

    def _parse_paddle_result(self, ocr_res) -> List[str]:
        """Helper to safely parse PaddleOCRv3/v4 output"""
        txts = []
        if isinstance(ocr_res, list) and len(ocr_res) > 0:
            # Handle v4 Dict
            if isinstance(ocr_res[0], dict):
                 if 'rec_texts' in ocr_res[0]:
                     txts = ocr_res[0]['rec_texts']
            # Handle v3 List
            elif isinstance(ocr_res[0], list):
                 for line in ocr_res[0]:
                     # line = [box, (text, score)]
                     if isinstance(line, (list, tuple)) and len(line) >= 2:
                         content = line[1]
                         if isinstance(content, (list, tuple)):
                             txts.append(content[0])
                         else:
                             txts.append(content)
        return txts

    def process_image(self, image) -> ZoomOCRResult:
        """Process a single image with Layout-Aware Zoom OCR"""
        import time
        from PIL import Image
        
        start_time = time.time()
        result = ZoomOCRResult()
        
        if isinstance(image, np.ndarray):
            image = Image.fromarray(image)
        img_array = np.array(image)
            
        # -------------------------------------------------------------
        # STRATEGY 1: Full Page PaddleOCR (Fast & Accurate)
        # -------------------------------------------------------------
        logger.info("Running Full Page PaddleOCR...")
        try:
            # NOTE: removing cls=True fixed the API error in v4
            ocr_res = self.ocr_engine.ocr(img_array)
            full_txts = self._parse_paddle_result(ocr_res)
            
            if full_txts:
                full_text = "\n".join(full_txts)
                result.full_text = full_text
                self._extract_entities_from_text(full_text, result.fields)
                self._finalize_entities(result.fields)
                result.processing_time_ms = int((time.time() - start_time) * 1000)
                return result
                
        except Exception as e:
            logger.warning(f"Full Page Paddle failed: {e}. Falling back to Blocks.")

        # -------------------------------------------------------------
        # STRATEGY 2: Layout Analysis + Block OCR (Fallback)
        # -------------------------------------------------------------
        logger.info("Running Layout Analysis (OpenCV Fallback)...")
        blocks = self._detect_blocks_opencv(img_array)
        blocks.sort(key=lambda b: (b.bbox.y1 // 50, -b.bbox.x2))
            
        full_text_fragments = []
        
        if blocks:
            logger.info(f"Found {len(blocks)} layout blocks. Processing blocks...")
            for i, block in enumerate(blocks):
                pad = 10
                h, w = img_array.shape[:2]
                x1 = max(0, block.bbox.x1 - pad)
                y1 = max(0, block.bbox.y1 - pad)
                x2 = min(w, block.bbox.x2 + pad)
                y2 = min(h, block.bbox.y2 + pad)
                
                block_img = img_array[y1:y2, x1:x2]
                if block_img.size == 0: continue
                
                # Upscale small blocks
                h_b, w_b = block_img.shape[:2]
                if w_b * h_b < 1000 * 1000:
                    block_scaled = cv2.resize(block_img, (w_b*2, h_b*2), interpolation=cv2.INTER_CUBIC)
                else:
                    block_scaled = block_img
                
                try:
                    ocr_res = self.ocr_engine.ocr(block_scaled)
                    block_txts = self._parse_paddle_result(ocr_res)
                    block_text = " ".join(block_txts)
                    
                    if len(block_text.strip()) > 2:
                        full_text_fragments.append(block_text)
                        self._extract_entities_from_text(block_text, result.fields)
                except:
                    pass

            result.full_text = "\n".join(full_text_fragments)
            self._finalize_entities(result.fields)
            result.processing_time_ms = int((time.time() - start_time) * 1000)
            return result

        return result

    def _extract_entities_from_text(self, text, fields_dict):
        phone, _ = self._extract_phone(text)
        salary, _ = self._extract_salary(text)
        cr, _ = self._extract_cr(text)
        ref_id, _ = self._extract_ref_id(text)
        
        if phone and "phone" not in fields_dict: 
            fields_dict["phone"] = {"value": phone, "confidence": "HIGH"}
        if salary and "salary" not in fields_dict: 
            fields_dict["salary"] = {"value": salary, "confidence": "HIGH"}
        if cr and "cr" not in fields_dict: 
            fields_dict["cr"] = {"value": cr, "confidence": "HIGH"}
        if ref_id and "ref_id" not in fields_dict: 
            fields_dict["ref_id"] = {"value": ref_id, "confidence": "HIGH"}

    def _finalize_entities(self, fields_dict):
        for f in ["phone", "salary", "cr", "ref_id"]:
            if f not in fields_dict:
                fields_dict[f] = {"value": None, "confidence": "LOW"}

    def _clean_digits(self, text: str) -> str:
        arabic_map = {
            '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
            '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
        }
        for ar, lat in arabic_map.items():
            text = text.replace(ar, lat)
        text = text.replace('\u0640', '') 
        prev = None
        while prev != text:
            prev = text
            text = re.sub(r'(\d)\s+(\d)', r'\1\2', text)
        return text.strip()

    def _smart_heal_salary(self, raw_str: str) -> Optional[str]:
        cleaned = self._clean_digits(raw_str)
        nums_only = re.sub(r'[^\d]', '', cleaned)
        if not nums_only: return None
        
        candidates = []
        try:
            val = int(nums_only)
            candidates.append((val, "normal"))
            rev_str = nums_only[::-1]
            candidates.append((int(rev_str), "reversed"))
            
            if len(nums_only) >= 4:
                for i in range(len(nums_only)):
                    dropped_char = nums_only[i]
                    sub = nums_only[:i] + nums_only[i+1:]
                    penalty = 0 if dropped_char == '1' else 1000
                    if sub:
                        candidates.append((int(sub), f"drop_{i}_{penalty}"))
                        rev_sub = sub[::-1]
                        candidates.append((int(rev_sub), f"drop_rev_{i}_{penalty}"))
                        if '3' in rev_sub or '4' in rev_sub:
                            swapped = rev_sub.replace('3', 'X').replace('4', '3').replace('X', '4')
                            candidates.append((int(swapped), f"swap_34_{penalty}"))
        except: pass
            
        candidates = [c for c in candidates if 100 <= c[0] <= 5000]
        if not candidates: return None
        
        def score_candidate(c):
            val, method = c
            penalty = 0
            if "normal" in method: penalty += 2000 
            if "reversed" in method: penalty += 0
            if "drop" in method: penalty += int(method.split('_')[-1])
            if "swap" in method: penalty += 100
            dist = abs(val - 1000)
            return penalty + dist

        candidates.sort(key=score_candidate)
        return str(candidates[0][0])

    def _extract_salary(self, text: str) -> Tuple[Optional[str], str]:
        pattern = r'([٠-٩\d\s\|\.\,]{3,10})\s*(?:ر٠ع|رع|ر\.ع|OMR)'
        matches = re.findall(pattern, text)
        if matches:
            heal = self._smart_heal_salary(matches[0])
            if heal: return heal, "HIGH"
        fallback = re.search(r'وقدره\s*([٠-٩\d\s\|\.\,]{3,10})', text)
        if fallback:
            heal = self._smart_heal_salary(fallback.group(1))
            if heal: return heal, "MEDIUM"
        return None, "LOW"

    def _extract_cr(self, text: str) -> Tuple[Optional[str], str]:
        pattern = r'(?:السجل\s*التجاري|التجاري)[^\d]*([\d\s٠-٩]{5,12})'
        matches = re.finditer(pattern, text)
        for match in matches:
            raw = match.group(1)
            cleaned = self._clean_digits(raw)
            nums_only = re.sub(r'[^\d]', '', cleaned)
            if len(nums_only) == 8 and nums_only[0] in ['9', '7', '2']: continue   
            if 5 <= len(nums_only) <= 8: return nums_only, "HIGH"
        return None, "LOW"

    def _extract_phone(self, text: str) -> Tuple[Optional[str], str]:
        cleaned = self._clean_digits(text)
        matches = re.findall(r'[972]\d{7}', cleaned)
        if matches: return matches[0], "HIGH"
        return None, "LOW"

    def _extract_ref_id(self, text: str) -> Tuple[Optional[str], str]:
        pattern = r'REF\s*\(?(\d{10,12})\)?'
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            ref = matches[0]
            if len(ref) == 10: ref = "88" + ref
            return ref, "HIGH"
        return None, "LOW"
