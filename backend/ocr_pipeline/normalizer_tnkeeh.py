"""
Tnkeeh Arabic Text Normalizer

Handles:
- Kashida (Tatweel) removal
- Diacritics removal
- Character normalization
- Common OCR error fixes
"""

import re
import logging
from typing import List, Dict, Tuple
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class NormalizationResult:
    """Result of text normalization"""
    original: str
    normalized: str
    changes_made: List[str]
    kashida_removed: int
    diacritics_removed: int


class TnkeehNormalizer:
    """
    Arabic text normalizer using Tnkeeh patterns.
    
    Normalizes:
    - Removes Kashida (ـ)
    - Removes diacritics (harakat)
    - Normalizes Alef variants
    - Fixes common OCR errors
    """
    
    # Arabic diacritics (tashkeel)
    DIACRITICS = [
        '\u064B',  # FATHATAN
        '\u064C',  # DAMMATAN
        '\u064D',  # KASRATAN
        '\u064E',  # FATHA
        '\u064F',  # DAMMA
        '\u0650',  # KASRA
        '\u0651',  # SHADDA
        '\u0652',  # SUKUN
        '\u0653',  # MADDAH
        '\u0654',  # HAMZA ABOVE
        '\u0655',  # HAMZA BELOW
        '\u0670',  # SUPERSCRIPT ALEF
    ]
    
    # Kashida (Tatweel)
    KASHIDA = '\u0640'
    
    # Alef variants to normalize
    ALEF_VARIANTS = {
        'أ': 'ا',  # Alef with Hamza above
        'إ': 'ا',  # Alef with Hamza below
        'آ': 'ا',  # Alef with Madda
        'ٱ': 'ا',  # Alef Wasla
    }
    
    # Unicode garbage ranges (OCR hallucinations)
    UNICODE_GARBAGE = [
        (0x1400, 0x167F),  # Canadian Aboriginal
        (0x16A0, 0x16FF),  # Runic
        (0x1800, 0x18AF),  # Mongolian
        (0x1700, 0x177F),  # Tagalog/Hanunoo/etc
        (0xA000, 0xA4CF),  # Yi Syllables
    ]
    
    # Common OCR error fixes
    OCR_FIXES = [
        # Court names
        (r'الحكمة(?!\s*الموقرة)', 'المحكمة'),
        (r'الأبتدانية|الابتدانية', 'الابتدائية'),
        # Common errors
        (r'بصصسور', 'بصور'),
        (r'قلمات', 'قلهات'),
        (r'اللوضوع|الوضوع|الموضوء', 'الموضوع'),
        (r'العنسوان', 'العنوان'),
        (r'الصوقائع', 'الوقائع'),
        (r'السلطئة|المطنة|الملطنة|السملطنة', 'السلطنة'),
        (r'الجيري', 'الجبري'),
        (r'علبها|علها', 'عليها'),
        (r'علبهم|علهم', 'عليهم'),
        (r'الهائف', 'الهاتف'),
        (r'رفم', 'رقم'),
        (r'المحكهة', 'المحكمة'),
        (r'فضيلهة', 'فضيلة'),
        (r'دعسوى', 'دعوى'),
        (r'المدععيعليها|المدىعليها', 'المدعى عليها'),
    ]
    
    def __init__(self, use_tnkeeh: bool = True):
        """
        Initialize normalizer.
        
        Args:
            use_tnkeeh: Try to use tnkeeh library if available
        """
        self.tnkeeh = None
        if use_tnkeeh:
            try:
                import tnkeeh
                self.tnkeeh = tnkeeh
                logger.info("Tnkeeh library loaded")
            except ImportError:
                logger.info("Tnkeeh not available, using built-in normalizer")
    
    def normalize(self, text: str) -> NormalizationResult:
        """
        Normalize Arabic text.
        
        Args:
            text: Raw OCR text
            
        Returns:
            NormalizationResult with normalized text and stats
        """
        original = text
        changes = []
        
        # Step 1: Remove Unicode garbage
        text, garbage_count = self._remove_unicode_garbage(text)
        if garbage_count > 0:
            changes.append(f"Removed {garbage_count} garbage Unicode chars")
        
        # Step 2: Remove Kashida
        kashida_count = text.count(self.KASHIDA)
        text = text.replace(self.KASHIDA, '')
        if kashida_count > 0:
            changes.append(f"Removed {kashida_count} Kashida chars")
        
        # Step 3: Remove diacritics
        diacritics_count = 0
        for d in self.DIACRITICS:
            count = text.count(d)
            diacritics_count += count
            text = text.replace(d, '')
        if diacritics_count > 0:
            changes.append(f"Removed {diacritics_count} diacritics")
        
        # Step 4: Normalize Alef variants
        for variant, normalized in self.ALEF_VARIANTS.items():
            if variant in text:
                text = text.replace(variant, normalized)
                changes.append(f"Normalized {variant} -> {normalized}")
        
        # Step 5: Apply OCR fixes
        for pattern, replacement in self.OCR_FIXES:
            if re.search(pattern, text):
                text = re.sub(pattern, replacement, text)
                changes.append(f"Fixed OCR: {pattern} -> {replacement}")
        
        # Step 6: Use Tnkeeh if available
        if self.tnkeeh:
            try:
                text = self.tnkeeh.clean_text(text)
                changes.append("Applied Tnkeeh cleaning")
            except Exception as e:
                logger.warning(f"Tnkeeh failed: {e}")
        
        # Step 7: Clean whitespace
        text = self._clean_whitespace(text)
        
        # Step 8: Remove garbage lines
        text = self._remove_garbage_lines(text)
        
        return NormalizationResult(
            original=original,
            normalized=text,
            changes_made=changes,
            kashida_removed=kashida_count,
            diacritics_removed=diacritics_count
        )
    
    def _remove_unicode_garbage(self, text: str) -> Tuple[str, int]:
        """Remove non-Arabic Unicode hallucinations"""
        count = 0
        result = []
        
        for char in text:
            code = ord(char)
            is_garbage = False
            
            for start, end in self.UNICODE_GARBAGE:
                if start <= code <= end:
                    is_garbage = True
                    count += 1
                    break
            
            if not is_garbage:
                result.append(char)
        
        return ''.join(result), count
    
    def _clean_whitespace(self, text: str) -> str:
        """Clean up whitespace"""
        # Multiple spaces to single
        text = re.sub(r'[ \t]+', ' ', text)
        # Max 2 newlines
        text = re.sub(r'\n{3,}', '\n\n', text)
        # Trim each line
        lines = [line.strip() for line in text.split('\n')]
        return '\n'.join(lines)
    
    def _remove_garbage_lines(self, text: str) -> str:
        """Remove lines with <30% Arabic content"""
        lines = text.split('\n')
        cleaned = []
        
        for line in lines:
            if not line.strip():
                cleaned.append(line)
                continue
            
            arabic_count = len(re.findall(r'[\u0600-\u06FF]', line))
            total_count = len(line.replace(' ', ''))
            
            if total_count == 0:
                continue
            
            ratio = arabic_count / total_count
            
            # Keep if >30% Arabic or >50% digits
            digit_count = len(re.findall(r'\d', line))
            digit_ratio = digit_count / total_count
            
            if ratio > 0.3 or digit_ratio > 0.5:
                cleaned.append(line)
        
        return '\n'.join(cleaned)


# Convenience function
def normalize_arabic(text: str) -> str:
    """Quick normalization of Arabic text"""
    normalizer = TnkeehNormalizer()
    result = normalizer.normalize(text)
    return result.normalized
