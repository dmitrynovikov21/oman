# Utils subpackage
from .arabic_utils import (
    arabic_to_latin_numerals,
    latin_to_arabic_numerals,
    remove_diacritics,
    remove_kashida,
    normalize_arabic,
    is_arabic,
    extract_arabic_only,
)
from .validation import (
    validate_omani_phone,
    validate_omani_cr,
    validate_salary,
    validate_civil_id,
    ValidationResult,
)
