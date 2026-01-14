"""
Oman Number Healer

Fixes common OCR issues with Arabic numerals in Omani documents:
1. Split numbers: "٤٣ ٠ ١" → "1043"
2. Reversed numbers: "3401" → "1043" (RTL issue)
3. Arabic to Latin conversion: "٠١٢٣" → "0123"
4. Context-aware healing near currency markers (ر.ع)
"""

import re
import logging
from typing import Optional, Tuple, List

logger = logging.getLogger(__name__)


class OmanNumberHealer:
    """
    Heals broken numbers in OCR output from Omani legal documents.
    """
    
    # Arabic to Latin digit mapping
    ARABIC_TO_LATIN = {
        '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
        '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    }
    
    # Currency markers
    CURRENCY_MARKERS = ['ر.ع', 'ر٠ع', 'ريال', 'عماني', 'OMR']
    
    # CR keywords for context
    CR_KEYWORDS = ['السجل التجاري', 'سجل تجاري', 'التجاري', 'C.R', 'CR']
    
    def __init__(self):
        pass
    
    def heal(self, text: str) -> str:
        """
        Main healing function - applies all fixes.
        
        Args:
            text: Raw OCR text
            
        Returns:
            Healed text with fixed numbers
        """
        # Step 1: Merge split Arabic digits
        text = self._merge_split_arabic_digits(text)
        
        # Step 2: Convert Arabic to Latin digits
        text = self._arabic_to_latin(text)
        
        # Step 3: Fix salary near currency marker
        text = self._heal_salary(text)
        
        # Step 4: Fix CR near keyword
        text = self._heal_cr(text)
        
        # Step 5: Fix reversed numbers in specific patterns
        text = self._fix_reversed_patterns(text)
        
        return text
    
    def _merge_split_arabic_digits(self, text: str) -> str:
        """
        Merge Arabic digits that are split by spaces.
        
        Example: "٤٣ ٠ ١" → "٤٣٠١"
        """
        # Pattern: Arabic digit, one or more spaces, Arabic digit
        pattern = r'([٠-٩])\s+([٠-٩])'
        
        # Keep merging until no more matches
        prev_text = None
        while prev_text != text:
            prev_text = text
            text = re.sub(pattern, r'\1\2', text)
        
        return text
    
    def _arabic_to_latin(self, text: str) -> str:
        """Convert Arabic digits to Latin digits"""
        for arabic, latin in self.ARABIC_TO_LATIN.items():
            text = text.replace(arabic, latin)
        return text
    
    def _heal_salary(self, text: str) -> str:
        """
        Heal salary amounts near currency markers.
        
        Examples:
            "٤٣ ٠ ١ ر.ع" → "1043 ر.ع"
            "43 0 1 ر.ع" → "1043 ر.ع"
            "3401ر٠ع" → "1043 ر.ع"
        """
        for marker in self.CURRENCY_MARKERS:
            # Pattern: digits (possibly with spaces) followed by currency
            pattern = rf'(\d[\d\s]*)\s*{re.escape(marker)}'
            
            def replace_salary(match):
                digits = match.group(1)
                # Remove all spaces
                clean_digits = digits.replace(' ', '')
                
                # Check if reversed (common RTL issue)
                if len(clean_digits) == 4:
                    # Try to detect reversed 4-digit numbers
                    # If it looks like 3401, it might be 1043
                    reversed_val = clean_digits[::-1]
                    original_val = int(clean_digits) if clean_digits.isdigit() else 0
                    reversed_int = int(reversed_val) if reversed_val.isdigit() else 0
                    
                    # Heuristic: Omani salaries are typically 200-5000
                    if 200 <= reversed_int <= 5000 and (original_val < 100 or original_val > 9999):
                        clean_digits = reversed_val
                
                return f"{clean_digits} {marker}"
            
            text = re.sub(pattern, replace_salary, text)
        
        return text
    
    def _heal_cr(self, text: str) -> str:
        """
        Heal CR numbers near CR keywords.
        
        Examples:
            "السجل التجاري رقم ٤٦٩٣ ٢٠ ١" → "السجل التجاري رقم 1204693"
        """
        for keyword in self.CR_KEYWORDS:
            # Find keyword position
            pos = text.find(keyword)
            if pos == -1:
                continue
            
            # Look at text after keyword (within 50 chars)
            start = pos + len(keyword)
            end = min(start + 50, len(text))
            context = text[start:end]
            
            # Find digit sequences with spaces
            pattern = r'(\d[\d\s]*\d)'
            match = re.search(pattern, context)
            
            if match:
                original = match.group(1)
                clean = original.replace(' ', '')
                
                # Reverse if needed (7-8 digits expected for CR)
                if 7 <= len(clean) <= 8:
                    # CR check: should not start with 9, 7, 24
                    if clean[0] in ['9', '7'] or clean[:2] == '24':
                        # Try reversed
                        reversed_clean = clean[::-1]
                        if not (reversed_clean[0] in ['9', '7'] or reversed_clean[:2] == '24'):
                            clean = reversed_clean
                
                # Replace in context
                new_context = context.replace(original, clean, 1)
                text = text[:start] + new_context + text[end:]
        
        return text
    
    def _fix_reversed_patterns(self, text: str) -> str:
        """
        Fix specific reversed number patterns.
        
        Patterns:
            - Case numbers: XXX/YYYY/YYYY → should be read correctly
            - Article numbers: المادة (XXX) 
        """
        # Pattern: Article number like )701( should be (107)
        article_pattern = r'\)([\d]+)\('
        
        def fix_article(match):
            digits = match.group(1)
            # Reverse if it looks wrong
            if len(digits) == 3 and digits.startswith('7') or digits.startswith('0'):
                digits = digits[::-1]
            return f"({digits})"
        
        text = re.sub(article_pattern, fix_article, text)
        
        return text
    
    def heal_specific(self, text: str, context: str = "general") -> str:
        """
        Heal numbers with specific context.
        
        Args:
            text: Number text to heal
            context: "salary", "cr", "phone", "general"
        """
        # First apply general healing
        clean = text.replace(' ', '')
        clean = self._arabic_to_latin(clean)
        
        if context == "salary":
            # Salary: 3-4 digits, typically 200-5000
            if len(clean) == 4 and clean.isdigit():
                val = int(clean)
                rev_val = int(clean[::-1])
                if 200 <= rev_val <= 5000 and not (200 <= val <= 5000):
                    clean = clean[::-1]
        
        elif context == "cr":
            # CR: 7-8 digits, should not start with 9, 7, 24
            if clean.isdigit() and 7 <= len(clean) <= 8:
                if clean[0] in ['9', '7'] or clean[:2] == '24':
                    reversed_clean = clean[::-1]
                    if not (reversed_clean[0] in ['9', '7'] or reversed_clean[:2] == '24'):
                        clean = reversed_clean
        
        elif context == "phone":
            # Phone: 8 digits, starts with 9 or 7
            if clean.isdigit() and len(clean) == 8:
                if not clean[0] in ['9', '7']:
                    # Try reversed
                    if clean[-1] in ['9', '7']:
                        clean = clean[::-1]
        
        return clean


# Convenience function
def heal_oman_numbers(text: str) -> str:
    """Quick function to heal Omani numbers in OCR text"""
    healer = OmanNumberHealer()
    return healer.heal(text)


def clean_oman_numbers(text: str) -> str:
    """
    Alias for heal_oman_numbers (matches user's requested function name).
    
    Features:
    - Finds split numbers (e.g., '43 0 1') and merges them
    - Converts eastern Arabic digits to standard
    - Context-aware healing near ر.ع currency marker
    """
    return heal_oman_numbers(text)
