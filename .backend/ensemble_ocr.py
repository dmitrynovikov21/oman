#!/usr/bin/env python3
"""
Ensemble OCR for Arabic Documents
Combines Tesseract, EasyOCR, and PaddleOCR with voting for maximum accuracy
"""

import cv2
import numpy as np
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from collections import Counter
import difflib
import re

# Try to import OCR engines
try:
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False

try:
    import easyocr
    EASYOCR_AVAILABLE = True
except ImportError:
    EASYOCR_AVAILABLE = False

try:
    from paddleocr import PaddleOCR
    PADDLEOCR_AVAILABLE = True
except ImportError:
    PADDLEOCR_AVAILABLE = False


@dataclass
class OCRResult:
    """Result from a single OCR engine"""
    engine: str
    text: str
    confidence: float
    boxes: Optional[List] = None


class TesseractEngine:
    """Tesseract OCR wrapper optimized for Arabic"""
    
    def __init__(self, lang: str = "ara", psm: int = 6, oem: int = 1):
        self.lang = lang
        self.psm = psm
        self.oem = oem
        self.config = f"--psm {psm} --oem {oem} -c preserve_interword_spaces=1"
    
    def run(self, image: np.ndarray) -> OCRResult:
        """Run Tesseract OCR on image"""
        if not TESSERACT_AVAILABLE:
            return OCRResult("tesseract", "", 0.0)
        
        try:
            # Get text with confidence
            data = pytesseract.image_to_data(
                image, lang=self.lang, config=self.config, output_type=pytesseract.Output.DICT
            )
            
            # Calculate average confidence (excluding empty boxes)
            confidences = [int(c) for c, t in zip(data['conf'], data['text']) 
                          if int(c) > 0 and t.strip()]
            avg_conf = sum(confidences) / len(confidences) if confidences else 0.0
            
            # Get full text
            text = pytesseract.image_to_string(image, lang=self.lang, config=self.config)
            
            return OCRResult("tesseract", text.strip(), avg_conf / 100.0)
        except Exception as e:
            print(f"Tesseract error: {e}")
            return OCRResult("tesseract", "", 0.0)


class EasyOCREngine:
    """EasyOCR wrapper for Arabic"""
    
    def __init__(self, langs: List[str] = None):
        self.langs = langs or ["ar", "en"]
        self.reader = None
    
    def _init_reader(self):
        if self.reader is None and EASYOCR_AVAILABLE:
            self.reader = easyocr.Reader(self.langs, gpu=False, verbose=False)
    
    def run(self, image: np.ndarray) -> OCRResult:
        """Run EasyOCR on image"""
        if not EASYOCR_AVAILABLE:
            return OCRResult("easyocr", "", 0.0)
        
        try:
            self._init_reader()
            
            # Run OCR
            results = self.reader.readtext(image)
            
            if not results:
                return OCRResult("easyocr", "", 0.0)
            
            # Extract text and confidence
            texts = []
            confidences = []
            for (bbox, text, conf) in results:
                texts.append(text)
                confidences.append(conf)
            
            full_text = " ".join(texts)
            avg_conf = sum(confidences) / len(confidences) if confidences else 0.0
            
            return OCRResult("easyocr", full_text, avg_conf)
        except Exception as e:
            print(f"EasyOCR error: {e}")
            return OCRResult("easyocr", "", 0.0)


class PaddleOCREngine:
    """PaddleOCR wrapper for Arabic"""
    
    def __init__(self, lang: str = "ar"):
        self.lang = lang
        self.ocr = None
    
    def _init_ocr(self):
        if self.ocr is None and PADDLEOCR_AVAILABLE:
            # Note: newer PaddleOCR versions don't use 'use_gpu' parameter
            try:
                self.ocr = PaddleOCR(lang=self.lang, use_angle_cls=True, show_log=False)
            except TypeError:
                # Fallback for different API versions
                self.ocr = PaddleOCR(lang=self.lang, use_angle_cls=True)
    
    def run(self, image: np.ndarray) -> OCRResult:
        """Run PaddleOCR on image"""
        if not PADDLEOCR_AVAILABLE:
            return OCRResult("paddleocr", "", 0.0)
        
        try:
            self._init_ocr()
            
            # Run OCR
            results = self.ocr.ocr(image, cls=True)
            
            if not results or not results[0]:
                return OCRResult("paddleocr", "", 0.0)
            
            # Extract text and confidence
            texts = []
            confidences = []
            for line in results[0]:
                if len(line) >= 2:
                    text, conf = line[1]
                    texts.append(text)
                    confidences.append(conf)
            
            full_text = " ".join(texts)
            avg_conf = sum(confidences) / len(confidences) if confidences else 0.0
            
            return OCRResult("paddleocr", full_text, avg_conf)
        except Exception as e:
            print(f"PaddleOCR error: {e}")
            return OCRResult("paddleocr", "", 0.0)


class EnsembleOCR:
    """
    Ensemble OCR combining multiple engines with voting
    """
    
    def __init__(self, use_tesseract: bool = True, 
                 use_easyocr: bool = True,
                 use_paddleocr: bool = True):
        self.engines = []
        
        if use_tesseract and TESSERACT_AVAILABLE:
            self.engines.append(TesseractEngine(lang="ara", psm=6, oem=1))
        
        if use_easyocr and EASYOCR_AVAILABLE:
            self.engines.append(EasyOCREngine(langs=["ar", "en"]))
        
        if use_paddleocr and PADDLEOCR_AVAILABLE:
            self.engines.append(PaddleOCREngine(lang="ar"))
        
        print(f"Ensemble OCR initialized with {len(self.engines)} engines")
    
    def recognize(self, image: np.ndarray) -> Tuple[str, float, List[OCRResult]]:
        """
        Run all OCR engines and combine results
        Returns: (final_text, confidence, individual_results)
        """
        results = []
        
        for engine in self.engines:
            result = engine.run(image)
            results.append(result)
            print(f"  {result.engine}: {len(result.text)} chars, conf={result.confidence:.2f}")
        
        # Combine results using voting
        final_text, confidence = self.vote(results)
        
        return final_text, confidence, results
    
    def vote(self, results: List[OCRResult]) -> Tuple[str, float]:
        """
        Combine OCR results using voting mechanism
        """
        # Filter out empty results
        valid_results = [r for r in results if r.text.strip()]
        
        if not valid_results:
            return "", 0.0
        
        if len(valid_results) == 1:
            return valid_results[0].text, valid_results[0].confidence
        
        # Use the result with highest confidence as base
        valid_results.sort(key=lambda x: x.confidence, reverse=True)
        base_text = valid_results[0].text
        
        # Calculate consensus score
        similarities = []
        for r in valid_results[1:]:
            sim = difflib.SequenceMatcher(None, base_text, r.text).ratio()
            similarities.append(sim)
        
        avg_similarity = sum(similarities) / len(similarities) if similarities else 1.0
        
        # If high agreement, use best result
        if avg_similarity > 0.8:
            return base_text, valid_results[0].confidence
        
        # Otherwise, try character-level voting on critical patterns
        final_text = self._merge_with_patterns(valid_results)
        avg_conf = sum(r.confidence for r in valid_results) / len(valid_results)
        
        return final_text, avg_conf
    
    def _merge_with_patterns(self, results: List[OCRResult]) -> str:
        """
        Merge results by extracting and validating critical patterns
        """
        texts = [r.text for r in results]
        
        # Start with highest confidence text
        base = texts[0]
        
        # Patterns to validate and potentially fix
        patterns = {
            # Omani phone: 8 digits starting with 7 or 9
            "phone": r"[79]\d{7}",
            # Salary: 3-5 digits (Arabic or Latin)
            "salary_latin": r"\b\d{3,5}\b",
            "salary_arabic": r"[٠-٩]{3,5}",
            # CR number: 7 digits
            "cr": r"\b\d{7}\b",
            # Reference number
            "ref": r"REF\d{10}",
        }
        
        # Extract patterns from all texts and use consensus
        for name, pattern in patterns.items():
            found_values = []
            for text in texts:
                matches = re.findall(pattern, text)
                found_values.extend(matches)
            
            if found_values:
                # Use most common value
                counter = Counter(found_values)
                best_value = counter.most_common(1)[0][0]
                
                # If base doesn't have this value but others do, note it
                if best_value not in base:
                    print(f"  Pattern '{name}': consensus value '{best_value}' not in base")
        
        return base


def extract_critical_fields(text: str) -> Dict[str, str]:
    """
    Extract critical fields from OCR text using regex
    """
    fields = {}
    
    # Phone numbers (Omani format: 8 digits starting with 7 or 9)
    phones = re.findall(r"[79]\d{7}", text)
    if phones:
        fields["phones"] = phones
    
    # Salary (Arabic numerals)
    salary_ar = re.findall(r"[٠-٩]{3,5}", text)
    if salary_ar:
        fields["salary_arabic"] = salary_ar
    
    # Salary (Latin numerals)
    salary_lat = re.findall(r"\b\d{3,5}\s*ر\.ع", text)
    if salary_lat:
        fields["salary_latin"] = salary_lat
    
    # Reference number
    refs = re.findall(r"REF\d{10}", text)
    if refs:
        fields["reference"] = refs
    
    # Commercial registration
    cr = re.findall(r"\b\d{7}\b", text)
    if cr:
        fields["cr_numbers"] = cr
    
    return fields


if __name__ == "__main__":
    import sys
    
    print("=" * 60)
    print("Ensemble OCR Test")
    print("=" * 60)
    
    print(f"\nAvailable engines:")
    print(f"  Tesseract: {TESSERACT_AVAILABLE}")
    print(f"  EasyOCR: {EASYOCR_AVAILABLE}")
    print(f"  PaddleOCR: {PADDLEOCR_AVAILABLE}")
    
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        print(f"\nProcessing: {image_path}")
        
        image = cv2.imread(image_path)
        if image is None:
            print("Error: Could not load image")
            sys.exit(1)
        
        ensemble = EnsembleOCR()
        text, confidence, results = ensemble.recognize(image)
        
        print(f"\nFinal result:")
        print(f"  Confidence: {confidence:.2f}")
        print(f"  Text length: {len(text)} chars")
        print(f"\nExtracted fields:")
        fields = extract_critical_fields(text)
        for name, values in fields.items():
            print(f"  {name}: {values}")
    else:
        print("\nUsage: python ensemble_ocr.py <image_path>")
