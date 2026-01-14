"""
Validation utilities for Omani document entities
"""

import re
from typing import Optional, Tuple
from dataclasses import dataclass
from enum import Enum


class ValidationResult(Enum):
    VALID = "valid"
    INVALID = "invalid"
    SUSPICIOUS = "suspicious"


@dataclass
class PhoneValidation:
    result: ValidationResult
    normalized: Optional[str]
    message: str


@dataclass
class CRValidation:
    result: ValidationResult
    normalized: Optional[str]
    message: str


def validate_omani_phone(phone: str) -> PhoneValidation:
    """
    Validate Omani mobile phone number.
    
    Rules:
    - Exactly 8 digits
    - Starts with 9 or 7
    - 9xxxxx = Omantel/Ooredoo mobile
    - 7xxxxx = Ooredoo mobile
    """
    # Clean input
    cleaned = re.sub(r'[^\d]', '', phone)
    
    # Check length
    if len(cleaned) != 8:
        return PhoneValidation(
            result=ValidationResult.INVALID,
            normalized=None,
            message=f"Phone must be 8 digits, got {len(cleaned)}"
        )
    
    # Check prefix
    if cleaned[0] not in ('9', '7'):
        return PhoneValidation(
            result=ValidationResult.INVALID,
            normalized=None,
            message=f"Omani mobile must start with 9 or 7, got {cleaned[0]}"
        )
    
    return PhoneValidation(
        result=ValidationResult.VALID,
        normalized=cleaned,
        message="Valid Omani mobile number"
    )


def validate_omani_cr(cr: str) -> CRValidation:
    """
    Validate Omani Commercial Registration number.
    
    Rules:
    - 7 or 8 digits
    - Should NOT start with:
      - 9, 7 (mobile phone prefixes)
      - 24 (Muscat landline)
      - 202 (year pattern)
    """
    # Clean input
    cleaned = re.sub(r'[^\d]', '', cr)
    
    # Check length
    if len(cleaned) not in (7, 8):
        return CRValidation(
            result=ValidationResult.INVALID,
            normalized=None,
            message=f"CR must be 7-8 digits, got {len(cleaned)}"
        )
    
    # Check excluded prefixes
    if cleaned.startswith('9'):
        return CRValidation(
            result=ValidationResult.INVALID,
            normalized=None,
            message="CR cannot start with 9 (mobile phone prefix)"
        )
    
    if cleaned.startswith('7'):
        return CRValidation(
            result=ValidationResult.INVALID,
            normalized=None,
            message="CR cannot start with 7 (mobile phone prefix)"
        )
    
    if cleaned.startswith('24'):
        return CRValidation(
            result=ValidationResult.INVALID,
            normalized=None,
            message="CR cannot start with 24 (Muscat landline prefix)"
        )
    
    if cleaned.startswith('202'):
        return CRValidation(
            result=ValidationResult.INVALID,
            normalized=None,
            message="CR cannot start with 202 (year pattern)"
        )
    
    return CRValidation(
        result=ValidationResult.VALID,
        normalized=cleaned,
        message="Valid Omani CR number"
    )


def validate_salary(amount: float, min_expected: float = 50.0) -> Tuple[ValidationResult, str]:
    """
    Validate salary amount.
    
    Flags suspicious values that are too low (likely OCR errors).
    """
    if amount < 0:
        return ValidationResult.INVALID, "Salary cannot be negative"
    
    if amount < min_expected:
        return ValidationResult.SUSPICIOUS, f"Salary {amount} OMR is below minimum expected ({min_expected} OMR)"
    
    if amount > 50000:
        return ValidationResult.SUSPICIOUS, f"Salary {amount} OMR seems unusually high"
    
    return ValidationResult.VALID, "Valid salary amount"


def validate_civil_id(civil_id: str) -> Tuple[ValidationResult, Optional[str], str]:
    """
    Validate Omani Civil ID.
    
    Rules:
    - 8 or 9 digits
    """
    cleaned = re.sub(r'[^\d]', '', civil_id)
    
    if len(cleaned) not in (8, 9):
        return ValidationResult.INVALID, None, f"Civil ID must be 8-9 digits, got {len(cleaned)}"
    
    return ValidationResult.VALID, cleaned, "Valid Civil ID format"
