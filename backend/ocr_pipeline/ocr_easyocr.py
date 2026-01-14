"""
EasyOCR Engine Wrapper

Primary OCR engine for Arabic legal documents.
Provides RTL reading order and confidence scoring.
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class TextBlock:
    """A detected text block"""
    text: str
    bbox: Tuple[float, float, float, float]  # x1, y1, x2, y2
    confidence: float
    order: int = 0


@dataclass
class OCRResult:
    """OCR result for a single image"""
    blocks: List[TextBlock] = field(default_factory=list)
    text: str = ""
    confidence: float = 0.0
    method: str = "easyocr"
    metadata: Dict[str, Any] = field(default_factory=dict)


class EasyOCREngine:
    """
    EasyOCR wrapper for Arabic + English text recognition.
    
    Features:
    - Arabic + English language support
    - RTL reading order sorting
    - Confidence scoring per block
    - CPU/GPU support
    """
    
    def __init__(
        self,
        languages: List[str] = None,
        gpu: bool = False,
        model_storage_directory: Optional[str] = None,
    ):
        """
        Initialize EasyOCR reader.
        
        Args:
            languages: List of language codes (default: ['ar', 'en'])
            gpu: Use GPU acceleration
            model_storage_directory: Custom model directory
        """
        self.languages = languages or ['ar', 'en']
        self.gpu = gpu
        self.model_storage_directory = model_storage_directory
        self.reader = None
        self._load_reader()
    
    def _load_reader(self):
        """Load EasyOCR reader"""
        try:
            import easyocr
            
            logger.info(f"Loading EasyOCR ({', '.join(self.languages)})...")
            
            kwargs = {
                'lang_list': self.languages,
                'gpu': self.gpu,
            }
            if self.model_storage_directory:
                kwargs['model_storage_directory'] = self.model_storage_directory
            
            self.reader = easyocr.Reader(**kwargs)
            logger.info("EasyOCR loaded successfully")
            
        except ImportError as e:
            logger.error(f"EasyOCR not installed: {e}")
            raise
        except Exception as e:
            logger.error(f"Failed to load EasyOCR: {e}")
            raise
    
    def process_image(self, image, detail: int = 1) -> OCRResult:
        """
        Process a single image through EasyOCR.
        
        Args:
            image: PIL Image or numpy array
            detail: 0 for simple text, 1 for full results
            
        Returns:
            OCRResult with detected text blocks
        """
        from PIL import Image
        
        # Convert PIL to numpy if needed
        if isinstance(image, Image.Image):
            image = np.array(image)
        
        # Run OCR
        try:
            results = self.reader.readtext(image, detail=detail)
        except Exception as e:
            logger.error(f"EasyOCR failed: {e}")
            return OCRResult(method="easyocr-failed")
        
        if not results:
            return OCRResult(method="easyocr-empty")
        
        # Parse results
        blocks = []
        for i, item in enumerate(results):
            if detail == 1 and len(item) >= 3:
                bbox_raw, text, confidence = item[0], item[1], item[2]
                
                # Convert bbox from polygon to rect
                x_coords = [p[0] for p in bbox_raw]
                y_coords = [p[1] for p in bbox_raw]
                bbox = (min(x_coords), min(y_coords), max(x_coords), max(y_coords))
                
                blocks.append(TextBlock(
                    text=text,
                    bbox=bbox,
                    confidence=confidence,
                    order=i
                ))
            elif detail == 0:
                blocks.append(TextBlock(
                    text=item,
                    bbox=(0, 0, 0, 0),
                    confidence=0.8,
                    order=i
                ))
        
        # Sort by RTL reading order
        blocks = self._sort_rtl(blocks)
        
        # Combine text
        full_text = "\n".join([b.text for b in blocks])
        
        # Calculate average confidence
        avg_confidence = sum(b.confidence for b in blocks) / len(blocks) if blocks else 0.0
        
        return OCRResult(
            blocks=blocks,
            text=full_text,
            confidence=avg_confidence,
            method="easyocr",
            metadata={
                "block_count": len(blocks),
                "languages": self.languages,
                "gpu": self.gpu,
            }
        )
    
    def _sort_rtl(self, blocks: List[TextBlock]) -> List[TextBlock]:
        """
        Sort blocks in RTL reading order.
        
        For Arabic documents:
        1. Top to bottom (primary)
        2. Right to left (secondary)
        """
        if not blocks:
            return blocks
        
        # Calculate line threshold (blocks within this Y distance are on same line)
        avg_height = np.mean([b.bbox[3] - b.bbox[1] for b in blocks])
        line_threshold = avg_height * 0.5
        
        # Group blocks by lines
        lines = []
        sorted_by_y = sorted(blocks, key=lambda b: b.bbox[1])
        
        current_line = [sorted_by_y[0]]
        current_y = sorted_by_y[0].bbox[1]
        
        for block in sorted_by_y[1:]:
            if abs(block.bbox[1] - current_y) <= line_threshold:
                current_line.append(block)
            else:
                lines.append(current_line)
                current_line = [block]
                current_y = block.bbox[1]
        
        if current_line:
            lines.append(current_line)
        
        # Sort each line right-to-left, then flatten
        result = []
        for i, line in enumerate(lines):
            # Sort by X descending (right to left)
            line_sorted = sorted(line, key=lambda b: -b.bbox[0])
            for j, block in enumerate(line_sorted):
                block.order = len(result)
                result.append(block)
        
        return result
    
    def get_supported_languages(self) -> List[str]:
        """Get list of loaded languages"""
        return self.languages


# Convenience function
def create_easyocr_engine(gpu: bool = False) -> EasyOCREngine:
    """Create default EasyOCR engine for Arabic+English"""
    return EasyOCREngine(languages=['ar', 'en'], gpu=gpu)
