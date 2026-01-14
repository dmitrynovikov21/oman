"""
Arabic Text Normalizer

Cleans and normalizes Arabic OCR output:
- Remove kashida (tatweel)
- Normalize Arabic numerals to Latin
- Remove diacritics
- Fix common OCR errors
"""

import re
import logging
from typing import List, Tuple
from dataclasses import dataclass

from ..config import ARABIC_TO_LATIN, REMOVE_CHARS

logger = logging.getLogger(__name__)


@dataclass
class NormalizationResult:
    """Result of text normalization"""
    original: str
    normalized: str
    changes_made: List[str]


class ArabicNormalizer:
    """
    Normalizes Arabic text for entity extraction.
    
    Implements cleaning rules based on Omani legal document standards.
    """
    
    def __init__(self):
        # Common OCR character substitution errors
        self.char_fixes: List[Tuple[str, str]] = [
            # Court names
            ("الحكمة", "المحكمة"),
            ("الأبتدانية", "الابتدائية"),
            ("الابتدانية", "الابتدائية"),
            
            # Common typos
            ("الهائف", "الهاتف"),
            ("رفم", "رقم"),
            ("علها", "عليها"),
            ("علهم", "عليهم"),
            ("الوضوع", "الموضوع"),
            ("الموضوء", "الموضوع"),
            ("دعسوى", "دعوى"),
            
            # Country/region
            ("المطنة", "السلطنة"),
            ("الملطنة", "السلطنة"),
            ("السملطنة", "السلطنة"),
            
            # Legal terms
            ("المحكهة", "المحكمة"),
            ("فضيلهة", "فضيلة"),
            ("المدىعليها", "المدعى عليها"),
            ("البدبهة", "البديهة"),
            
            # Enhanced model specific
            ("بصصسور", "بصور"),
            ("اللوضوع", "الموضوع"),
            ("العنسوان", "العنوان"),
            ("الصوقائع", "الوقائع"),
            ("المدععيعليها", "المدعى عليها"),
            ("السلطئة", "السلطنة"),
            ("الجيري", "الجبري"),
            ("علبها", "عليها"),
            ("علبهم", "عليهم"),
            
            # Company names
            ("قلمات", "قلهات"),
        ]
        
        # Regex-based fixes
        self.regex_fixes: List[Tuple[re.Pattern, str]] = [
            # Phone formatting
            (re.compile(r'(هاتف):?(\d{8})'), r'\1 \2'),
            
            # Multiple spaces
            (re.compile(r'  +'), ' '),
            
            # Multiple newlines
            (re.compile(r'\n{3,}'), '\n\n'),
            
            # Arabic comma normalization
            (re.compile(r'،'), ','),
        ]
    
    def normalize(self, text: str) -> NormalizationResult:
        """
        Normalize Arabic text.
        
        Args:
            text: Raw OCR text
            
        Returns:
            NormalizationResult with cleaned text and change log
        """
        original = text
        result = text
        changes = []
        
        # Step 1: Remove kashida and diacritics
        result, removed = self._remove_noise_chars(result)
        if removed:
            changes.append(f"Removed {removed} noise characters")
        
        # Step 2: Apply character fixes
        for wrong, correct in self.char_fixes:
            if wrong in result:
                count = result.count(wrong)
                result = result.replace(wrong, correct)
                changes.append(f"Fixed '{wrong}' -> '{correct}' ({count}x)")
        
        # Step 3: Apply regex fixes
        for pattern, replacement in self.regex_fixes:
            new_result = pattern.sub(replacement, result)
            if new_result != result:
                changes.append(f"Applied regex: {pattern.pattern[:30]}...")
                result = new_result
        
        # Step 4: Normalize whitespace
        result = self._normalize_whitespace(result)
        
        return NormalizationResult(
            original=original,
            normalized=result,
            changes_made=changes
        )
    
    def _remove_noise_chars(self, text: str) -> Tuple[str, int]:
        """Remove kashida, diacritics, and other noise"""
        removed = 0
        for char in REMOVE_CHARS:
            count = text.count(char)
            if count > 0:
                text = text.replace(char, '')
                removed += count
        return text, removed
    
    def _normalize_whitespace(self, text: str) -> str:
        """Clean up whitespace issues"""
        # Replace multiple spaces with single space
        text = re.sub(r' +', ' ', text)
        
        # Remove spaces before punctuation
        text = re.sub(r' ([.,;:!?])', r'\1', text)
        
        # Trim lines
        lines = [line.strip() for line in text.split('\n')]
        text = '\n'.join(lines)
        
        return text.strip()
    
    def convert_arabic_numerals(self, text: str) -> str:
        """Convert Arabic-Indic numerals to Latin"""
        for arabic, latin in ARABIC_TO_LATIN.items():
            text = text.replace(arabic, latin)
        return text
    
    def extract_numbers(self, text: str, convert: bool = True) -> List[str]:
        """
        Extract all number sequences from text.
        
        Args:
            text: Input text
            convert: If True, convert Arabic numerals to Latin
            
        Returns:
            List of number strings
        """
        if convert:
            text = self.convert_arabic_numerals(text)
        
        # Find all digit sequences
        numbers = re.findall(r'\d+', text)
        return numbers
