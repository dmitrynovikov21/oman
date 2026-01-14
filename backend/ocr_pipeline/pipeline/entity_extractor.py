"""
Entity Extractor for Omani Legal Documents

Extracts structured data using Context-First approach:
- Phone numbers (Omani mobile)
- CR numbers (Commercial Registration)
- Civil ID
- Dates (Hijri/Gregorian)
- Amounts (OMR)
"""

import re
import logging
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum

from ..config import (
    PHONE_PATTERN,
    CR_PATTERN,
    CR_KEYWORDS,
    CR_EXCLUDE_PREFIXES,
    CR_CONTEXT_WINDOW,
    CIVIL_ID_PATTERN,
    AMOUNT_PATTERNS,
    DATE_PATTERNS,
    ARABIC_TO_LATIN,
    SUSPICIOUS_SALARY_THRESHOLD
)

logger = logging.getLogger(__name__)


class Confidence(Enum):
    """Extraction confidence levels"""
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    SUSPICIOUS = "SUSPICIOUS"


@dataclass
class ExtractedEntity:
    """A single extracted entity"""
    entity_type: str
    value: str
    confidence: Confidence
    source_context: str = ""  # Surrounding text
    position: int = -1  # Character position in text
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ExtractionResult:
    """Complete extraction result for a document"""
    phone: Optional[str] = None
    cr: Optional[str] = None
    civil_id: Optional[str] = None
    dates: List[Dict[str, str]] = field(default_factory=list)
    amounts: List[Dict[str, Any]] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    confidence: Confidence = Confidence.MEDIUM
    all_entities: List[ExtractedEntity] = field(default_factory=list)


class EntityExtractor:
    """
    Context-First Entity Extraction for Omani Documents.
    
    Prioritizes finding entities near relevant keywords rather than
    blindly matching patterns anywhere in the document.
    """
    
    def __init__(self):
        self.phone_pattern = re.compile(PHONE_PATTERN)
        self.cr_pattern = re.compile(CR_PATTERN)
        self.civil_id_pattern = re.compile(CIVIL_ID_PATTERN)
        
    def extract_all(self, text: str) -> ExtractionResult:
        """
        Extract all entities from text.
        
        Args:
            text: Normalized OCR text
            
        Returns:
            ExtractionResult with all found entities
        """
        # Convert Arabic numerals for pattern matching
        latin_text = self._convert_numerals(text)
        
        result = ExtractionResult()
        
        # 1. Extract Phone (simple, just pattern match)
        result.phone = self._extract_phone(latin_text)
        
        # 2. Extract CR (CONTEXT-FIRST approach)
        result.cr, cr_warning = self._extract_cr_context_first(text, latin_text)
        if cr_warning:
            result.warnings.append(cr_warning)
        
        # 3. Extract Dates
        result.dates = self._extract_dates(text, latin_text)
        
        # 4. Extract Amounts
        result.amounts, salary_warning = self._extract_amounts(text, latin_text)
        if salary_warning:
            result.warnings.append(salary_warning)
        
        # 5. Set overall confidence
        result.confidence = self._calculate_confidence(result)
        
        return result
    
    def _convert_numerals(self, text: str) -> str:
        """Convert Arabic-Indic numerals to Latin"""
        for arabic, latin in ARABIC_TO_LATIN.items():
            text = text.replace(arabic, latin)
        return text
    
    def _extract_phone(self, text: str) -> Optional[str]:
        """
        Extract Omani mobile phone number.
        
        Pattern: 8 digits starting with 9 or 7
        """
        matches = self.phone_pattern.findall(text)
        if matches:
            # Return first valid match
            return matches[0]
        return None
    
    def _extract_cr_context_first(self, original_text: str, latin_text: str) -> Tuple[Optional[str], Optional[str]]:
        """
        CONTEXT-FIRST CR Extraction.
        
        1. Search for CR keywords (السجل التجاري, etc.)
        2. Look for 7-8 digit number within CONTEXT_WINDOW chars after keyword
        3. Validate against exclusion rules (not a phone, not a year)
        4. If context fails, fallback to global search
        
        Returns:
            (cr_number, warning_message)
        """
        warning = None
        
        # Step 1: Try context-first extraction
        for keyword in CR_KEYWORDS:
            # Find keyword position
            pos = original_text.find(keyword)
            if pos == -1:
                pos = latin_text.find(keyword)
            
            if pos != -1:
                # Extract context window AFTER the keyword
                context_start = pos + len(keyword)
                context_end = context_start + CR_CONTEXT_WINDOW
                context = latin_text[context_start:context_end]
                
                logger.debug(f"CR keyword '{keyword}' found at {pos}, context: '{context}'")
                
                # Look for CR pattern in context
                cr_matches = self.cr_pattern.findall(context)
                
                for match in cr_matches:
                    # Validate: not a phone or year
                    if not self._is_excluded_cr(match):
                        logger.info(f"CR found via context: {match} near '{keyword}'")
                        return match, None
                
                # Check for broken pattern like 1"17697 -> 1217697
                healed = self._try_heal_broken_cr(context)
                if healed:
                    warning = "HEALED_BROKEN_CR"
                    logger.info(f"Healed broken CR: {healed}")
                    return healed, warning
        
        # Step 2: Fallback to global search
        logger.debug("Context-first failed, trying global search...")
        all_matches = self.cr_pattern.findall(latin_text)
        
        for match in all_matches:
            if not self._is_excluded_cr(match):
                warning = "CR_FROM_GLOBAL_SEARCH"
                return match, warning
        
        return None, "NO_CR_FOUND"
    
    def _is_excluded_cr(self, number: str) -> bool:
        """Check if number should be excluded from CR candidates"""
        for prefix in CR_EXCLUDE_PREFIXES:
            if number.startswith(prefix):
                return True
        return False
    
    def _try_heal_broken_cr(self, context: str) -> Optional[str]:
        """
        Attempt to heal OCR-broken CR numbers.
        
        Common patterns:
        - 1"17697 -> 1217697 (quote instead of digit)
        - 1'17697 -> 1117697
        """
        # Pattern: digit + quote/special + digits
        heal_pattern = re.compile(r'(\d)["\'\`](\d{5,7})')
        match = heal_pattern.search(context)
        
        if match:
            # Replace quote with likely digit (usually 1 or 2)
            prefix = match.group(1)
            suffix = match.group(2)
            
            # Try 1 first (most common OCR error)
            healed = prefix + "2" + suffix
            if len(healed) in (7, 8):
                return healed
            
            healed = prefix + "1" + suffix
            if len(healed) in (7, 8):
                return healed
        
        return None
    
    def _extract_dates(self, original_text: str, latin_text: str) -> List[Dict[str, str]]:
        """Extract both Hijri and Gregorian dates"""
        dates = []
        
        # Gregorian dates (use latin_text)
        for pattern_str in DATE_PATTERNS["gregorian"]:
            pattern = re.compile(pattern_str)
            for match in pattern.finditer(latin_text):
                dates.append({
                    "type": "gregorian",
                    "raw": match.group(0),
                    "position": match.start()
                })
        
        # Hijri dates (use original_text to catch Arabic numerals)
        for pattern_str in DATE_PATTERNS["hijri"]:
            pattern = re.compile(pattern_str)
            for match in pattern.finditer(original_text):
                dates.append({
                    "type": "hijri",
                    "raw": match.group(0),
                    "position": match.start()
                })
        
        return dates
    
    def _extract_amounts(self, original_text: str, latin_text: str) -> Tuple[List[Dict[str, Any]], Optional[str]]:
        """
        Extract monetary amounts (OMR).
        
        Returns:
            (amounts_list, salary_warning)
        """
        amounts = []
        salary_warning = None
        
        for pattern_str in AMOUNT_PATTERNS:
            pattern = re.compile(pattern_str)
            
            # Search in both texts
            for text in [original_text, latin_text]:
                for match in pattern.finditer(text):
                    raw_value = match.group(1)
                    
                    # Convert to number
                    numeric_value = self._parse_amount(raw_value)
                    
                    amounts.append({
                        "raw": match.group(0),
                        "value": numeric_value,
                        "position": match.start()
                    })
                    
                    # Check for suspicious salary
                    if numeric_value < SUSPICIOUS_SALARY_THRESHOLD:
                        # Check if this is near a salary keyword
                        context_start = max(0, match.start() - 50)
                        context = text[context_start:match.start()]
                        
                        if re.search(r'إجمالي|الراتب|أجر|salary', context, re.IGNORECASE):
                            salary_warning = f"SUSPICIOUS_SALARY_VALUE ({numeric_value} OMR < {SUSPICIOUS_SALARY_THRESHOLD})"
        
        return amounts, salary_warning
    
    def _parse_amount(self, raw: str) -> float:
        """Parse amount string to float"""
        # Convert Arabic numerals
        for arabic, latin in ARABIC_TO_LATIN.items():
            raw = raw.replace(arabic, latin)
        
        # Remove thousand separators
        raw = raw.replace(',', '').replace('،', '')
        
        try:
            return float(raw)
        except ValueError:
            return 0.0
    
    def _calculate_confidence(self, result: ExtractionResult) -> Confidence:
        """Calculate overall extraction confidence"""
        if result.phone and result.cr and not result.warnings:
            return Confidence.HIGH
        elif result.phone or result.cr:
            if "SUSPICIOUS" in str(result.warnings):
                return Confidence.SUSPICIOUS
            return Confidence.MEDIUM
        return Confidence.LOW
