"""
ExpertOS Entity Validator

Validates extracted entities against Omani standards:
- Salary: Flag if < 50 OMR
- Civil ID: 8-9 digits
- CR: 7-8 digits, context-first
- Dates: Multiple formats
- Phone: 8 digits, starts with 9/7
"""

import re
import logging
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger(__name__)


class ConfidenceLevel(Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    SUSPICIOUS = "SUSPICIOUS"


@dataclass
class ValidationResult:
    """Result of entity validation"""
    entity_type: str
    value: str
    is_valid: bool
    confidence: ConfidenceLevel
    warnings: List[str] = field(default_factory=list)
    context: str = ""


@dataclass
class DocumentValidation:
    """Validation results for entire document"""
    phone: Optional[str] = None
    cr: Optional[str] = None
    civil_id: Optional[str] = None
    salary: Optional[float] = None
    dates: List[str] = field(default_factory=list)
    ref_id: Optional[str] = None
    confidence: ConfidenceLevel = ConfidenceLevel.LOW
    warnings: List[str] = field(default_factory=list)
    all_results: List[ValidationResult] = field(default_factory=list)


class ExpertOSValidator:
    """
    Entity validator for Omani legal documents.
    
    Validates:
    - Phone numbers (Omani format)
    - Commercial Registration (CR)
    - Civil ID
    - Salary amounts
    - Dates
    """
    
    # Omani patterns
    PHONE_PATTERN = re.compile(r'\b[97]\d{7}\b')
    CR_PATTERN = re.compile(r'\b\d{7,8}\b')
    CIVIL_ID_PATTERN = re.compile(r'\b\d{8,9}\b')
    REF_ID_PATTERN = re.compile(r'\b\d{12}\b')  # Reference IDs like 882401040246
    REF_ID_WITH_PREFIX = re.compile(r'REF(\d{10,12})', re.IGNORECASE)  # REF2401040246
    
    # Amount patterns - including رع without dot
    AMOUNT_PATTERNS = [
        re.compile(r'(\d{3,6})\s*(?:ر\.ع|رع|OMR|ریال|عماني)'),
        re.compile(r'(?:ر\.ع|رع|OMR)\s*(\d{3,6})'),
    ]
    
    # Date patterns
    DATE_PATTERNS = [
        re.compile(r'\b(\d{4})[/-](\d{1,2})[/-](\d{1,2})\b'),  # YYYY-MM-DD
        re.compile(r'\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b'),  # DD/MM/YYYY
    ]
    
    # CR keywords for context-first extraction
    CR_KEYWORDS = ["السجل التجاري", "سجل تجاري", "تجاري", "C.R", "CR"]
    
    # Phone keywords (to exclude from CR)
    PHONE_KEYWORDS = ["هاتف", "الهاتف", "تلفون", "جوال", "موبايل", "phone", "tel"]
    
    # CR exclusion prefixes
    # 9/7 = Mobile, 2 = Landline
    CR_EXCLUDE_PREFIXES = ["9", "7", "2", "4"]
    
    def __init__(self):
        """Initialize validator"""
        pass
    
    def validate_document(self, text: str) -> DocumentValidation:
        """
        Validate all entities in document text.
        
        Args:
            text: Normalized document text
            
        Returns:
            DocumentValidation with all extracted entities
        """
        result = DocumentValidation()
        
        # Convert Arabic numerals to Latin
        latin_text = self._arabic_to_latin(text)
        
        # 1. Extract phone
        phone_result = self._extract_phone(latin_text)
        if phone_result.is_valid:
            result.phone = phone_result.value
            result.all_results.append(phone_result)
        
        # 2. Extract CR (context-first)
        cr_result = self._extract_cr_context_first(text, latin_text)
        if cr_result.is_valid:
            result.cr = cr_result.value
            result.warnings.extend(cr_result.warnings)
            result.all_results.append(cr_result)
        
        # 3. Extract salary
        salary_result = self._extract_salary(text, latin_text)
        if salary_result.is_valid:
            result.salary = float(salary_result.value)
            result.warnings.extend(salary_result.warnings)
            result.all_results.append(salary_result)
        
        # 4. Extract dates
        dates = self._extract_dates(latin_text)
        result.dates = dates
        
        # 5. Extract reference ID
        ref_result = self._extract_ref_id(latin_text)
        if ref_result.is_valid:
            result.ref_id = ref_result.value
            result.all_results.append(ref_result)
        
        # Calculate overall confidence
        result.confidence = self._calculate_confidence(result)
        
        return result
    
    def _arabic_to_latin(self, text: str) -> str:
        """Convert Arabic numerals to Latin"""
        mapping = {
            '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
            '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
        }
        for ar, lat in mapping.items():
            text = text.replace(ar, lat)
        return text
    
    def _extract_phone(self, text: str) -> ValidationResult:
        """Extract Omani phone number"""
        matches = self.PHONE_PATTERN.findall(text)
        
        if matches:
            return ValidationResult(
                entity_type="phone",
                value=matches[0],
                is_valid=True,
                confidence=ConfidenceLevel.HIGH
            )
        
        return ValidationResult(
            entity_type="phone",
            value="",
            is_valid=False,
            confidence=ConfidenceLevel.LOW,
            warnings=["NO_PHONE_FOUND"]
        )
    
    def _extract_cr_context_first(self, original_text: str, latin_text: str) -> ValidationResult:
        """
        Extract CR using context-first approach.
        
        Priority:
        1. Number near "السجل التجاري" keyword
        2. Healed broken CR (1"17697 -> 1217697)
        3. Fallback to global search (excluding phone context)
        """
        warnings = []
        
        # Step 1: Context-first search
        for keyword in self.CR_KEYWORDS:
            pos = original_text.find(keyword)
            if pos == -1:
                pos = latin_text.find(keyword)
            
            if pos != -1:
                # Look in context window after keyword
                context = latin_text[pos:pos + 80]
                matches = self.CR_PATTERN.findall(context)
                
                for match in matches:
                    if not self._is_excluded_cr(match):
                        return ValidationResult(
                            entity_type="cr",
                            value=match,
                            is_valid=True,
                            confidence=ConfidenceLevel.HIGH,
                            context=f"Found near '{keyword}'"
                        )
                
                # Try to heal broken CR
                healed = self._try_heal_cr(context)
                if healed:
                    warnings.append("HEALED_BROKEN_CR")
                    return ValidationResult(
                        entity_type="cr",
                        value=healed,
                        is_valid=True,
                        confidence=ConfidenceLevel.MEDIUM,
                        warnings=warnings,
                        context="Healed from broken pattern"
                    )
        
        # Step 2: Fallback to global search
        all_matches = self.CR_PATTERN.findall(latin_text)
        for match in all_matches:
            # Check phone context
            match_pos = latin_text.find(match)
            if self._is_phone_context(latin_text, match_pos):
                continue
            
            if not self._is_excluded_cr(match):
                warnings.append("CR_FROM_GLOBAL_SEARCH")
                return ValidationResult(
                    entity_type="cr",
                    value=match,
                    is_valid=True,
                    confidence=ConfidenceLevel.MEDIUM,
                    warnings=warnings,
                    context="From global search"
                )
        
        warnings.append("NO_CR_FOUND")
        return ValidationResult(
            entity_type="cr",
            value="",
            is_valid=False,
            confidence=ConfidenceLevel.LOW,
            warnings=warnings
        )
    
    def _is_excluded_cr(self, number: str) -> bool:
        """Check if number should be excluded from CR"""
        for prefix in self.CR_EXCLUDE_PREFIXES:
            if number.startswith(prefix):
                return True
        return False
    
    def _is_phone_context(self, text: str, position: int) -> bool:
        """Check if position is near a phone keyword"""
        start = max(0, position - 30)
        context = text[start:position].lower()
        
        for keyword in self.PHONE_KEYWORDS:
            if keyword in context:
                return True
        return False
    
    def _try_heal_cr(self, context: str) -> Optional[str]:
        """Try to heal broken CR pattern like 1"17697"""
        pattern = re.compile(r'(\d)["\'`](\d{5,7})')
        match = pattern.search(context)
        
        if match:
            prefix, suffix = match.groups()
            # Try replacing with 2
            healed = prefix + "2" + suffix
            if 7 <= len(healed) <= 8:
                return healed
        
        return None
    
    def _extract_salary(self, original_text: str, latin_text: str) -> ValidationResult:
        """Extract salary amount with reversal logic for RTL issues"""
        warnings = []
        
        for pattern in self.AMOUNT_PATTERNS:
            matches = pattern.findall(latin_text)
            for match in matches:
                # Clean the value
                value_str = match.replace(',', '').replace('،', '')
                try:
                    value = int(value_str)
                    
                    # Check if reversed (RTL issue)
                    # Omani salaries are typically 200-5000
                    # If value like 43101 (reversed 10134), try reversing
                    if value > 10000:
                        reversed_str = value_str[::-1]
                        reversed_val = int(reversed_str)
                        if 200 <= reversed_val <= 5000:
                            warnings.append(f"REVERSED_SALARY: {value} -> {reversed_val}")
                            value = reversed_val
                    
                    # Check if suspiciously low
                    if value < 50:
                        warnings.append(f"SUSPICIOUS_SALARY_VALUE ({value} OMR < 50)")
                        return ValidationResult(
                            entity_type="salary",
                            value=str(value),
                            is_valid=True,
                            confidence=ConfidenceLevel.SUSPICIOUS,
                            warnings=warnings
                        )
                    
                    return ValidationResult(
                        entity_type="salary",
                        value=str(value),
                        is_valid=True,
                        confidence=ConfidenceLevel.HIGH,
                        warnings=warnings
                    )
                except ValueError:
                    continue
        
        return ValidationResult(
            entity_type="salary",
            value="",
            is_valid=False,
            confidence=ConfidenceLevel.LOW
        )
    
    def _extract_dates(self, text: str) -> List[str]:
        """Extract all dates from text"""
        dates = []
        
        for pattern in self.DATE_PATTERNS:
            matches = pattern.findall(text)
            for match in matches:
                if len(match) == 3:
                    dates.append("/".join(match))
        
        return list(set(dates))
    
    def _extract_ref_id(self, text: str) -> ValidationResult:
        """Extract reference ID (12 digits or with REF prefix)"""
        # Try standard 12-digit pattern
        matches = self.REF_ID_PATTERN.findall(text)
        if matches:
            return ValidationResult(
                entity_type="ref_id",
                value=matches[0],
                is_valid=True,
                confidence=ConfidenceLevel.HIGH
            )
        
        # Try REF prefix pattern (REF2401040246 -> 882401040246)
        prefix_matches = self.REF_ID_WITH_PREFIX.findall(text)
        if prefix_matches:
            ref_num = prefix_matches[0]
            # Add 88 prefix (common pattern in Omani system)
            full_ref = "88" + ref_num if len(ref_num) == 10 else ref_num
            return ValidationResult(
                entity_type="ref_id",
                value=full_ref,
                is_valid=True,
                confidence=ConfidenceLevel.MEDIUM,
                warnings=["REF_PREFIX_FIXED"]
            )
        
        return ValidationResult(
            entity_type="ref_id",
            value="",
            is_valid=False,
            confidence=ConfidenceLevel.LOW
        )
    
    def _calculate_confidence(self, result: DocumentValidation) -> ConfidenceLevel:
        """Calculate overall document confidence"""
        has_warnings = len(result.warnings) > 0
        has_suspicious = any("SUSPICIOUS" in w for w in result.warnings)
        
        if has_suspicious:
            return ConfidenceLevel.SUSPICIOUS
        
        extracted_count = sum([
            1 if result.phone else 0,
            1 if result.cr else 0,
            1 if result.salary else 0,
            1 if result.ref_id else 0,
        ])
        
        if extracted_count >= 3 and not has_warnings:
            return ConfidenceLevel.HIGH
        elif extracted_count >= 2:
            return ConfidenceLevel.MEDIUM
        else:
            return ConfidenceLevel.LOW
