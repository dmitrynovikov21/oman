"""
ExpertOS OCR Pipeline Configuration

All settings for the autonomous Arabic document parsing service.
Designed for 100% offline operation.
"""

import os
from pathlib import Path

# === PATHS ===
BASE_DIR = Path(__file__).parent
MODELS_DIR = BASE_DIR / "models"
TEMP_DIR = BASE_DIR / "temp"

# Create directories
MODELS_DIR.mkdir(exist_ok=True)
TEMP_DIR.mkdir(exist_ok=True)

# === SERVICE CONFIG ===
SERVICE_HOST = "0.0.0.0"
SERVICE_PORT = 5100

# === OFFLINE MODE ===
# Force HuggingFace to use local models only
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"

# === MODEL PATHS ===
# Arabic-Nougat for OCR
ARABIC_NOUGAT_MODEL = "MohamedRashad/arabic-base-nougat"
ARABIC_NOUGAT_LOCAL = MODELS_DIR / "arabic-base-nougat"

# Surya for layout analysis
SURYA_MODEL_LOCAL = MODELS_DIR / "surya"

# === OCR SETTINGS ===
OCR_CONFIG = {
    "dpi": 300,  # PDF to image resolution
    "max_pages": 20,  # Max pages to process
    "batch_size": 1,  # For GPU memory management
    "language": "ara",  # Arabic
}

# === ENTITY EXTRACTION RULES (Omani Standards) ===

# Phone: 8 digits starting with 9 or 7
PHONE_PATTERN = r"\b[97]\d{7}\b"

# CR: 7-8 digits, context-first, exclude phone prefixes
CR_PATTERN = r"\b\d{7,8}\b"
CR_KEYWORDS = ["السجل التجاري", "سجل تجاري", "سجل", "C.R", "CR", "تجاري"]
CR_EXCLUDE_PREFIXES = ("9", "7", "24", "202")  # Mobile, Landline, Year
CR_CONTEXT_WINDOW = 50  # Characters after keyword to search

# Civil ID: 8-9 digits
CIVIL_ID_PATTERN = r"\b\d{8,9}\b"

# Amount patterns
AMOUNT_PATTERNS = [
    r"(\d{1,3}(?:[,،]\d{3})*(?:\.\d{1,3})?)\s*(?:ر\.ع|OMR|ریال|عماني)",
    r"([٠-٩]{1,3}(?:[,،][٠-٩]{3})*(?:\.[٠-٩]{1,3})?)\s*(?:ر\.ع|ریال)",
]

# Date patterns
DATE_PATTERNS = {
    "gregorian": [
        r"\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b",  # DD/MM/YYYY
        r"\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b",  # YYYY-MM-DD
    ],
    "hijri": [
        r"([٠-٩]{4})[\/\-]([٠-٩]{1,2})[\/\-]([٠-٩]{1,2})",
        r"([٠-٩]{1,2})[\/\-]([٠-٩]{1,2})[\/\-]([٠-٩]{4})",
    ],
}

# === ARABIC TEXT PROCESSING ===

# Arabic to Latin numeral mapping
ARABIC_TO_LATIN = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
}

# Characters to remove (kashida, diacritics)
REMOVE_CHARS = [
    '\u0640',  # Kashida (ـ)
    '\u064B',  # Fathatan
    '\u064C',  # Dammatan
    '\u064D',  # Kasratan
    '\u064E',  # Fatha
    '\u064F',  # Damma
    '\u0650',  # Kasra
    '\u0651',  # Shadda
    '\u0652',  # Sukun
]

# === VALIDATION THRESHOLDS ===
MIN_CONFIDENCE = 0.85
SUSPICIOUS_SALARY_THRESHOLD = 50  # OMR - if salary < this, flag as suspicious

# === LOGGING ===
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FORMAT = "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
