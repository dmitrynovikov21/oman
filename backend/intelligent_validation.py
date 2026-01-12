"""
Intelligent Validation Layer for OCR Correction
Mission 11: Fuzzy Matching + Regex Guard

Uses:
- thefuzz for Levenshtein distance matching
- Omani legal dictionary for auto-correction
- Regex patterns for structured field validation
- OpenCV for re-processing failed fragments
"""

import json
import re
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field

try:
    from thefuzz import fuzz, process
    THEFUZZ_AVAILABLE = True
except ImportError:
    THEFUZZ_AVAILABLE = False
    print("Warning: thefuzz not installed. Run: pip install thefuzz")

try:
    import cv2
    import numpy as np
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False


@dataclass
class ValidationResult:
    """Result of validation check"""
    field_name: str
    original_value: str
    corrected_value: str
    was_corrected: bool = False
    confidence: float = 1.0  # 0-1, lower = less confident
    correction_type: str = ""  # "fuzzy", "typo", "regex_fail"
    needs_attention: bool = False
    error_message: str = ""


@dataclass
class DocumentValidation:
    """Complete validation results for a document"""
    results: List[ValidationResult] = field(default_factory=list)
    total_corrections: int = 0
    low_confidence_count: int = 0
    failed_validations: int = 0
    
    def add_result(self, result: ValidationResult):
        self.results.append(result)
        if result.was_corrected:
            self.total_corrections += 1
        if result.confidence < 0.9:
            self.low_confidence_count += 1
        if result.needs_attention:
            self.failed_validations += 1


class LegalRefiner:
    """
    Intelligent text refiner using Omani legal dictionary
    and fuzzy matching for OCR correction.
    """
    
    DICTIONARY_PATH = Path(__file__).parent / "data" / "oman_legal_dictionary.json"
    
    # Regex patterns for structured fields
    PATTERNS = {
        "civil_id": r"^\d{8}$",  # Exactly 8 digits
        "date": r"^\d{4}/\d{2}/\d{2}$",  # YYYY/MM/DD
        "case_number": r"^\d+/\d{4}$",  # 1234/2024
        "phone": r"^(\+968)?\d{8}$",  # Omani phone
        "iban": r"^OM\d{2}[A-Z]{4}\d{16}$",  # Omani IBAN
    }
    
    def __init__(self):
        self.dictionary = self._load_dictionary()
        self.all_terms = self._build_term_index()
    
    def _load_dictionary(self) -> Dict:
        """Load legal dictionary from JSON"""
        if not self.DICTIONARY_PATH.exists():
            print(f"Warning: Dictionary not found at {self.DICTIONARY_PATH}")
            return {"courts": [], "departments": [], "roles": [], "common_typos": {}}
        
        with open(self.DICTIONARY_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    
    def _build_term_index(self) -> Dict[str, str]:
        """Build index of all standard terms for quick lookup"""
        index = {}
        
        for category in ["courts", "departments", "roles"]:
            for item in self.dictionary.get(category, []):
                standard = item["standard"]
                index[standard] = standard
                for alias in item.get("aliases", []):
                    index[alias] = standard
        
        return index
    
    def refine_text(self, text: str, threshold: int = 80) -> Tuple[str, List[ValidationResult]]:
        """
        Refine text using fuzzy matching against legal dictionary.
        
        Args:
            text: Input text to refine
            threshold: Minimum similarity score (0-100)
            
        Returns:
            Tuple of (refined_text, list of ValidationResults)
        """
        if not THEFUZZ_AVAILABLE:
            return text, []
        
        results = []
        words = text.split()
        refined_words = []
        
        for word in words:
            # First check common typos (exact match)
            if word in self.dictionary.get("common_typos", {}):
                corrected = self.dictionary["common_typos"][word]
                results.append(ValidationResult(
                    field_name="text",
                    original_value=word,
                    corrected_value=corrected,
                    was_corrected=True,
                    confidence=1.0,
                    correction_type="typo"
                ))
                refined_words.append(corrected)
                continue
            
            # Then check fuzzy match against dictionary
            if len(word) >= 3:  # Skip short words
                match, score = self._fuzzy_match(word)
                
                if match and score >= threshold:
                    if match != word:
                        confidence = score / 100.0
                        correction_type = "fuzzy_high" if score >= 90 else "fuzzy_low"
                        
                        results.append(ValidationResult(
                            field_name="text",
                            original_value=word,
                            corrected_value=match,
                            was_corrected=True,
                            confidence=confidence,
                            correction_type=correction_type,
                            needs_attention=(score < 90)
                        ))
                        refined_words.append(match)
                        continue
            
            refined_words.append(word)
        
        return " ".join(refined_words), results
    
    def _fuzzy_match(self, word: str) -> Tuple[Optional[str], int]:
        """Find best fuzzy match in dictionary"""
        if not self.all_terms:
            return None, 0
        
        # Use process.extractOne for best match
        result = process.extractOne(word, list(self.all_terms.keys()), scorer=fuzz.ratio)
        
        if result:
            matched_key, score = result[0], result[1]  # Handle both 2 and 3 value returns
            # Return the standard form
            return self.all_terms[matched_key], score
        
        return None, 0
    
    def validate_civil_id(self, value: str) -> ValidationResult:
        """Validate Omani Civil ID (8 digits)"""
        cleaned = re.sub(r"\D", "", value)  # Remove non-digits
        
        if re.match(self.PATTERNS["civil_id"], cleaned):
            return ValidationResult(
                field_name="civil_id",
                original_value=value,
                corrected_value=cleaned,
                was_corrected=(value != cleaned),
                confidence=1.0
            )
        
        return ValidationResult(
            field_name="civil_id",
            original_value=value,
            corrected_value=value,
            was_corrected=False,
            confidence=0.0,
            correction_type="regex_fail",
            needs_attention=True,
            error_message=f"Invalid Civil ID format: expected 8 digits, got '{value}'"
        )
    
    def validate_date(self, value: str) -> ValidationResult:
        """Validate date format and existence"""
        # Try to match pattern
        if not re.match(self.PATTERNS["date"], value):
            return ValidationResult(
                field_name="date",
                original_value=value,
                corrected_value=value,
                was_corrected=False,
                confidence=0.0,
                correction_type="regex_fail",
                needs_attention=True,
                error_message=f"Invalid date format: expected YYYY/MM/DD"
            )
        
        # Validate date existence
        try:
            year, month, day = map(int, value.split("/"))
            datetime(year, month, day)
            
            return ValidationResult(
                field_name="date",
                original_value=value,
                corrected_value=value,
                confidence=1.0
            )
        except ValueError:
            return ValidationResult(
                field_name="date",
                original_value=value,
                corrected_value=value,
                was_corrected=False,
                confidence=0.0,
                correction_type="invalid_date",
                needs_attention=True,
                error_message=f"Invalid date: {value} does not exist"
            )
    
    def validate_case_number(self, value: str) -> ValidationResult:
        """Validate case number format (1234/2024)"""
        if re.match(self.PATTERNS["case_number"], value):
            return ValidationResult(
                field_name="case_number",
                original_value=value,
                corrected_value=value,
                confidence=1.0
            )
        
        return ValidationResult(
            field_name="case_number",
            original_value=value,
            corrected_value=value,
            was_corrected=False,
            confidence=0.0,
            correction_type="regex_fail",
            needs_attention=True,
            error_message=f"Invalid case number format: expected 1234/2024"
        )
    
    def validate_document(self, fields: Dict[str, str]) -> DocumentValidation:
        """
        Validate all fields in a document.
        
        Args:
            fields: Dict of field_name -> value
            
        Returns:
            DocumentValidation with all results
        """
        validation = DocumentValidation()
        
        for field_name, value in fields.items():
            if field_name == "civil_id":
                result = self.validate_civil_id(value)
            elif field_name == "date":
                result = self.validate_date(value)
            elif field_name == "case_number":
                result = self.validate_case_number(value)
            elif field_name in ["text", "court_name", "plaintiff", "defendant"]:
                _, results = self.refine_text(value)
                for r in results:
                    r.field_name = field_name
                    validation.add_result(r)
                continue
            else:
                # Generic text refinement
                refined, results = self.refine_text(value)
                result = ValidationResult(
                    field_name=field_name,
                    original_value=value,
                    corrected_value=refined,
                    was_corrected=(value != refined)
                )
            
            validation.add_result(result)
        
        return validation


class ImageReprocessor:
    """
    Re-process image fragments with adjusted contrast/brightness
    when validation fails.
    """
    
    def __init__(self):
        if not OPENCV_AVAILABLE:
            print("Warning: OpenCV not available. Image reprocessing disabled.")
    
    def enhance_fragment(
        self, 
        image_path: str, 
        region: Tuple[int, int, int, int],  # x, y, w, h
        contrast: float = 1.5,
        brightness: int = 20
    ) -> Optional[str]:
        """
        Extract and enhance a fragment of an image.
        
        Args:
            image_path: Path to source image
            region: (x, y, width, height) of region to extract
            contrast: Contrast multiplier (1.0 = no change)
            brightness: Brightness offset
            
        Returns:
            Path to enhanced fragment image, or None if failed
        """
        if not OPENCV_AVAILABLE:
            return None
        
        try:
            # Read image
            img = cv2.imread(image_path)
            if img is None:
                return None
            
            x, y, w, h = region
            
            # Extract fragment
            fragment = img[y:y+h, x:x+w]
            
            # Apply contrast and brightness
            enhanced = cv2.convertScaleAbs(fragment, alpha=contrast, beta=brightness)
            
            # Convert to grayscale for better OCR
            gray = cv2.cvtColor(enhanced, cv2.COLOR_BGR2GRAY)
            
            # Apply adaptive thresholding
            thresh = cv2.adaptiveThreshold(
                gray, 255, 
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                cv2.THRESH_BINARY, 11, 2
            )
            
            # Save enhanced fragment
            output_dir = Path(image_path).parent / "reprocessed"
            output_dir.mkdir(exist_ok=True)
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = output_dir / f"fragment_{timestamp}.png"
            
            cv2.imwrite(str(output_path), thresh)
            
            return str(output_path)
            
        except Exception as e:
            print(f"Fragment enhancement error: {e}")
            return None
    
    def reprocess_for_validation(
        self,
        image_path: str,
        region: Tuple[int, int, int, int],
        ocr_function,  # Callable that takes image path and returns text
        validator_function,  # Callable that takes text and returns ValidationResult
        max_attempts: int = 3
    ) -> Optional[ValidationResult]:
        """
        Re-process a fragment multiple times with increasing contrast.
        
        Returns the first successful validation, or None.
        """
        contrast_levels = [1.5, 2.0, 2.5]
        brightness_levels = [20, 40, 0]
        
        for i in range(min(max_attempts, len(contrast_levels))):
            enhanced_path = self.enhance_fragment(
                image_path, region,
                contrast=contrast_levels[i],
                brightness=brightness_levels[i]
            )
            
            if enhanced_path:
                # Run OCR on enhanced fragment
                text = ocr_function(enhanced_path)
                
                # Validate
                result = validator_function(text)
                
                if result.confidence >= 0.9:
                    return result
        
        return None


# Convenience function for API usage
def validate_and_refine(data: Dict[str, str]) -> Dict[str, Any]:
    """
    API-friendly function to validate and refine document data.
    
    Returns dict with:
    - refined_data: Dict with corrected values
    - corrections: List of corrections made
    - errors: List of validation errors
    """
    refiner = LegalRefiner()
    validation = refiner.validate_document(data)
    
    refined_data = {}
    corrections = []
    errors = []
    
    for result in validation.results:
        refined_data[result.field_name] = result.corrected_value
        
        if result.was_corrected:
            corrections.append({
                "field": result.field_name,
                "original": result.original_value,
                "corrected": result.corrected_value,
                "type": result.correction_type,
                "confidence": result.confidence
            })
        
        if result.needs_attention:
            errors.append({
                "field": result.field_name,
                "value": result.original_value,
                "error": result.error_message
            })
    
    return {
        "refined_data": refined_data,
        "corrections": corrections,
        "errors": errors,
        "stats": {
            "total_corrections": validation.total_corrections,
            "low_confidence": validation.low_confidence_count,
            "failed_validations": validation.failed_validations
        }
    }


if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    
    print("=== Intelligent Validation Test ===\n")
    
    refiner = LegalRefiner()
    
    # Test 1: Fuzzy Matching
    print("Test 1: Fuzzy Matching")
    test_text = "الحكمة الابتدئية بمسقط"  # Typos
    refined, results = refiner.refine_text(test_text)
    print(f"  Input:  {test_text}")
    print(f"  Output: {refined}")
    for r in results:
        print(f"  - Corrected: '{r.original_value}' -> '{r.corrected_value}' ({r.correction_type})")
    
    # Test 2: Civil ID Validation
    print("\nTest 2: Civil ID Validation")
    test_ids = ["12345678", "1234567", "12345A78", "123456789"]
    for tid in test_ids:
        result = refiner.validate_civil_id(tid)
        status = "PASS" if result.confidence > 0 else "FAIL"
        print(f"  {tid} -> {status}")
    
    # Test 3: Date Validation
    print("\nTest 3: Date Validation")
    test_dates = ["2024/01/15", "2024/13/45", "2024/02/30"]
    for td in test_dates:
        result = refiner.validate_date(td)
        status = "VALID" if result.confidence > 0 else "INVALID"
        print(f"  {td} -> {status}")
    
    # Test 4: Case Number Validation
    print("\nTest 4: Case Number Validation")
    test_cases = ["1409/2024", "14092024", "1409-2024"]
    for tc in test_cases:
        result = refiner.validate_case_number(tc)
        status = "VALID" if result.confidence > 0 else "INVALID"
        print(f"  {tc} -> {status}")
    
    print("\n=== All Tests Complete ===")
