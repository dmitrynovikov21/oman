"""
Utility functions for Arabic text processing
"""

from typing import Dict

# Arabic-Indic to Latin numeral mapping
ARABIC_NUMERALS: Dict[str, str] = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
}

# Persian/Urdu numeral variants
PERSIAN_NUMERALS: Dict[str, str] = {
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
}


def arabic_to_latin_numerals(text: str) -> str:
    """Convert all Arabic/Persian numerals to Latin"""
    for arabic, latin in ARABIC_NUMERALS.items():
        text = text.replace(arabic, latin)
    for persian, latin in PERSIAN_NUMERALS.items():
        text = text.replace(persian, latin)
    return text


def latin_to_arabic_numerals(text: str) -> str:
    """Convert Latin numerals to Arabic-Indic"""
    latin_to_arabic = {v: k for k, v in ARABIC_NUMERALS.items()}
    for latin, arabic in latin_to_arabic.items():
        text = text.replace(latin, arabic)
    return text


def remove_diacritics(text: str) -> str:
    """Remove Arabic diacritical marks (tashkeel)"""
    # Unicode ranges for Arabic diacritics
    diacritics = [
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
        '\u0656',  # SUBSCRIPT ALEF
        '\u0670',  # SUPERSCRIPT ALEF
    ]
    for d in diacritics:
        text = text.replace(d, '')
    return text


def remove_kashida(text: str) -> str:
    """Remove kashida (tatweel) character"""
    return text.replace('\u0640', '')


def normalize_arabic(text: str) -> str:
    """
    Full Arabic text normalization:
    - Remove diacritics
    - Remove kashida
    - Normalize alef variants
    - Normalize yeh variants
    """
    # Remove diacritics
    text = remove_diacritics(text)
    
    # Remove kashida
    text = remove_kashida(text)
    
    # Normalize alef variants to bare alef
    alef_variants = ['أ', 'إ', 'آ', 'ٱ']
    for v in alef_variants:
        text = text.replace(v, 'ا')
    
    # Normalize teh marbuta to heh
    text = text.replace('ة', 'ه')
    
    # Normalize yeh variants
    text = text.replace('ى', 'ي')
    text = text.replace('ئ', 'ي')
    
    return text.strip()


def is_arabic(text: str) -> bool:
    """Check if text contains Arabic characters"""
    arabic_range = range(0x0600, 0x06FF + 1)
    return any(ord(c) in arabic_range for c in text)


def extract_arabic_only(text: str) -> str:
    """Extract only Arabic characters and spaces"""
    arabic_chars = []
    for c in text:
        if ord(c) in range(0x0600, 0x06FF + 1) or c.isspace():
            arabic_chars.append(c)
    return ''.join(arabic_chars)
