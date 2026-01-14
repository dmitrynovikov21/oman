"""
Hybrid OCR Pipeline: Surya Layout + OpenCV Preprocessing + EasyOCR

Architecture:
1. Surya-OCR: Layout analysis → bboxes
2. OpenCV: Crop + Padding + Otsu binarization + 2x upscale
3. EasyOCR: Text recognition per zone (paragraph=False)
4. Post-processing: Number healing + Tnkeeh

Target: 95% accuracy on Omani legal documents
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
from pathlib import Path
import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class TextZone:
    """A detected text zone from layout analysis"""
    bbox: Tuple[int, int, int, int]  # x1, y1, x2, y2
    zone_type: str  # text, table, header, footer
    text: str = ""
    confidence: float = 0.0
    order: int = 0


@dataclass
class HybridOCRResult:
    """Result from hybrid OCR pipeline"""
    zones: List[TextZone] = field(default_factory=list)
    full_text: str = ""
    cleaned_text: str = ""
    entities: Dict[str, Any] = field(default_factory=dict)
    confidence: float = 0.0
    processing_time_ms: int = 0


class HybridOCRPipeline:
    """
    Hybrid OCR Pipeline for Arabic Legal Documents.
    
    Combines:
    - Surya-OCR for layout detection
    - OpenCV for image preprocessing
    - EasyOCR for text recognition
    - Custom post-processing for Omani documents
    """
    
    def __init__(
        self,
        use_surya: bool = True,
        use_preprocessing: bool = True,
        languages: List[str] = None,
        gpu: bool = False,
        padding: int = 10,
        upscale_factor: float = 2.0,
    ):
        """
        Initialize the hybrid pipeline.
        
        Args:
            use_surya: Use Surya for layout detection
            use_preprocessing: Apply OpenCV preprocessing
            languages: OCR languages (default: ['ar', 'en'])
            gpu: Use GPU acceleration
            padding: Padding around cropped zones (pixels)
            upscale_factor: Image upscale factor for OCR
        """
        self.use_surya = use_surya
        self.use_preprocessing = use_preprocessing
        self.languages = languages or ['ar', 'en']
        self.gpu = gpu
        self.padding = padding
        self.upscale_factor = upscale_factor
        
        # Lazy load components
        self._easyocr = None
        self._surya_detector = None
        self._number_healer = None
    
    @property
    def easyocr(self):
        """Lazy load EasyOCR"""
        if self._easyocr is None:
            import easyocr
            logger.info(f"Loading EasyOCR ({', '.join(self.languages)})...")
            self._easyocr = easyocr.Reader(self.languages, gpu=self.gpu)
            logger.info("EasyOCR loaded")
        return self._easyocr
    
    @property
    def surya_detector(self):
        """Lazy load Surya layout detector"""
        if self._surya_detector is None and self.use_surya:
            try:
                from surya.detection import DetectionPredictor
                logger.info("Loading Surya detector...")
                self._surya_detector = DetectionPredictor()
                logger.info("Surya loaded")
            except Exception as e:
                logger.warning(f"Surya not available: {e}")
                self.use_surya = False
        return self._surya_detector
    
    @property
    def number_healer(self):
        """Lazy load number healer"""
        if self._number_healer is None:
            try:
                from .number_healer import OmanNumberHealer
            except ImportError:
                from number_healer import OmanNumberHealer
            self._number_healer = OmanNumberHealer()
        return self._number_healer
    
    def process_image(self, image) -> HybridOCRResult:
        """
        Process a single image through the hybrid pipeline.
        
        Args:
            image: PIL Image or numpy array
            
        Returns:
            HybridOCRResult with detected text and entities
        """
        import time
        from PIL import Image
        import cv2
        
        start_time = time.time()
        
        # Ensure numpy array
        if isinstance(image, Image.Image):
            img_array = np.array(image)
        else:
            img_array = image
        
        height, width = img_array.shape[:2]
        zones = []
        
        # Step 1: Layout Detection (Surya or full-page fallback)
        if self.use_surya and self.surya_detector is not None:
            zones = self._detect_layout_surya(image)
            logger.info(f"Surya detected {len(zones)} zones")
        
        # Fallback: treat whole page as one zone
        if not zones:
            zones = [TextZone(
                bbox=(0, 0, width, height),
                zone_type="text",
                order=0
            )]
        
        # Step 2: Process each zone
        all_text = []
        for i, zone in enumerate(zones):
            # Crop with padding
            crop = self._crop_with_padding(img_array, zone.bbox)
            
            # Preprocess
            if self.use_preprocessing:
                crop = self._preprocess_opencv(crop)
            
            # OCR with paragraph=False
            results = self.easyocr.readtext(crop, paragraph=False)
            
            # Extract text
            zone_text = " ".join([r[1] for r in results])
            zone.text = zone_text
            zone.confidence = np.mean([r[2] for r in results]) if results else 0.0
            
            all_text.append(zone_text)
        
        # Step 3: Combine and post-process
        full_text = "\n".join(all_text)
        cleaned_text = self._postprocess(full_text)
        
        # Step 4: Extract entities
        entities = self._extract_entities(cleaned_text)
        
        # Calculate overall confidence
        avg_confidence = np.mean([z.confidence for z in zones]) if zones else 0.0
        
        return HybridOCRResult(
            zones=zones,
            full_text=full_text,
            cleaned_text=cleaned_text,
            entities=entities,
            confidence=avg_confidence,
            processing_time_ms=int((time.time() - start_time) * 1000)
        )
    
    def _detect_layout_surya(self, image) -> List[TextZone]:
        """Detect layout using Surya"""
        zones = []
        
        try:
            if self.surya_detector is None:
                return zones
            
            # Run detection
            results = self.surya_detector([image])
            
            if results and len(results) > 0:
                page_result = results[0]
                
                for i, box in enumerate(page_result.bboxes):
                    # Convert bbox format
                    x1, y1, x2, y2 = [int(v) for v in box.bbox]
                    
                    zones.append(TextZone(
                        bbox=(x1, y1, x2, y2),
                        zone_type=getattr(box, 'label', 'text'),
                        order=i
                    ))
            
            # Sort by reading order (top-down, right-to-left)
            zones = self._sort_zones_rtl(zones)
            
        except Exception as e:
            logger.error(f"Surya layout detection failed: {e}")
        
        return zones
    
    def _sort_zones_rtl(self, zones: List[TextZone]) -> List[TextZone]:
        """Sort zones in RTL reading order"""
        if not zones:
            return zones
        
        # Sort by Y (top to bottom), then by X descending (right to left)
        sorted_zones = sorted(
            zones,
            key=lambda z: (z.bbox[1], -z.bbox[0])
        )
        
        for i, zone in enumerate(sorted_zones):
            zone.order = i
        
        return sorted_zones
    
    def _crop_with_padding(
        self, 
        image: np.ndarray, 
        bbox: Tuple[int, int, int, int]
    ) -> np.ndarray:
        """Crop image region with padding"""
        x1, y1, x2, y2 = bbox
        h, w = image.shape[:2]
        
        # Add padding
        x1 = max(0, x1 - self.padding)
        y1 = max(0, y1 - self.padding)
        x2 = min(w, x2 + self.padding)
        y2 = min(h, y2 + self.padding)
        
        return image[y1:y2, x1:x2]
    
    def _preprocess_opencv(self, image: np.ndarray) -> np.ndarray:
        """
        Apply OpenCV preprocessing for better OCR.
        
        Steps:
        1. Convert to grayscale
        2. Apply Otsu binarization
        3. Upscale 2x
        """
        import cv2
        
        # Convert to grayscale if needed
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        else:
            gray = image
        
        # Otsu binarization
        _, binary = cv2.threshold(
            gray, 0, 255, 
            cv2.THRESH_BINARY + cv2.THRESH_OTSU
        )
        
        # Upscale
        if self.upscale_factor > 1.0:
            h, w = binary.shape
            new_size = (int(w * self.upscale_factor), int(h * self.upscale_factor))
            binary = cv2.resize(binary, new_size, interpolation=cv2.INTER_CUBIC)
        
        # Convert back to RGB for EasyOCR
        result = cv2.cvtColor(binary, cv2.COLOR_GRAY2RGB)
        
        return result
    
    def _postprocess(self, text: str) -> str:
        """
        Apply post-processing to OCR text.
        
        Steps:
        1. Number healing (split digits)
        2. Kashida removal (Tnkeeh)
        3. Common OCR error fixes
        """
        # Step 1: Number healing
        text = self.number_healer.heal(text)
        
        # Step 2: Kashida removal
        text = self._remove_kashida(text)
        
        # Step 3: Common OCR fixes
        text = self._fix_common_errors(text)
        
        return text
    
    def _remove_kashida(self, text: str) -> str:
        """Remove Kashida (Tatweel) using Tnkeeh or fallback"""
        try:
            import tnkeeh
            # Try different tnkeeh methods
            if hasattr(tnkeeh, 'remove_tatweel'):
                return tnkeeh.remove_tatweel(text)
            elif hasattr(tnkeeh, 'clean_text'):
                return tnkeeh.clean_text(text)
        except:
            pass
        
        # Fallback: manual removal
        return text.replace('\u0640', '')
    
    def _fix_common_errors(self, text: str) -> str:
        """Fix common OCR errors in Arabic legal text"""
        import re
        
        fixes = [
            # Court names
            (r'الحكمة(?!\s*الموقرة)', 'المحكمة'),
            (r'الابتدانية|الأبتدانية', 'الابتدائية'),
            
            # Common errors
            (r'دعسوى', 'دعوى'),
            (r'قلمات', 'قلهات'),
            (r'السلطئة', 'السلطنة'),
            (r'الجيري', 'الجبري'),
            
            # Split words
            (r'المحك\s+مة', 'المحكمة'),
            (r'الابتدا\s+ئية', 'الابتدائية'),
            (r'دعو\s+ى', 'دعوى'),
            
            # Alef normalization
            (r'[أإآٱ]', 'ا'),
        ]
        
        for pattern, replacement in fixes:
            text = re.sub(pattern, replacement, text)
        
        return text
    
    def _extract_entities(self, text: str) -> Dict[str, Any]:
        """Extract entities from cleaned text"""
        entities = {
            'phone': None,
            'cr': None,
            'salary': None,
            'ref_id': None,
            'warnings': [],
        }
        
        try:
            from .validator import ExpertOSValidator
        except ImportError:
            try:
                from validator import ExpertOSValidator
            except ImportError:
                return entities
        
        validator = ExpertOSValidator()
        result = validator.validate_document(text)
        
        entities['phone'] = result.phone
        entities['cr'] = result.cr
        entities['salary'] = result.salary
        entities['ref_id'] = result.ref_id
        entities['warnings'] = result.warnings
        entities['confidence'] = result.confidence.value
        
        return entities


# Convenience function
def process_with_hybrid_ocr(image, **kwargs) -> HybridOCRResult:
    """Quick function to process an image with hybrid OCR"""
    pipeline = HybridOCRPipeline(**kwargs)
    return pipeline.process_image(image)
