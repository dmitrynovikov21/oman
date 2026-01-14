"""
ExpertOS OCR Pipeline v4.0

Architecture:
- Surya-OCR: Layout detection, RTL reading order
- Arabic-Nougat: Structural OCR with Markdown output
- Tnkeeh: Arabic text normalization
- Validator: Entity extraction with Omani standards

Usage:
    from ocr_pipeline import ExpertOSInference, process_document
    
    # Quick usage
    result = process_document("document.pdf")
    
    # Full control
    pipeline = ExpertOSInference(device="cuda")
    result = pipeline.process_pdf("document.pdf", output_dir="./results")
"""

from .inference import ExpertOSInference, process_document, DocumentResult
from .layout_surya import SuryaLayoutDetector, PageLayout, LayoutBlock
from .ocr_nougat import ArabicNougatOCR, OCRResult
from .normalizer_tnkeeh import TnkeehNormalizer, normalize_arabic
from .validator import ExpertOSValidator, DocumentValidation

__version__ = "4.0.0"
__all__ = [
    # Main classes
    "ExpertOSInference",
    "process_document",
    "DocumentResult",
    
    # Layout
    "SuryaLayoutDetector",
    "PageLayout",
    "LayoutBlock",
    
    # OCR
    "ArabicNougatOCR",
    "OCRResult",
    
    # Normalization
    "TnkeehNormalizer",
    "normalize_arabic",
    
    # Validation
    "ExpertOSValidator",
    "DocumentValidation",
]
