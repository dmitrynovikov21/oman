"""
Layout Analyzer using Surya-OCR

Detects document structure:
- Tables
- Headers/Titles
- Paragraphs
- Reading order (RTL for Arabic)
"""

import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from enum import Enum

try:
    from surya.detection import batch_detection
    from surya.layout import batch_layout_detection
    from surya.model.detection.segformer import load_model as load_det_model
    from surya.model.layout.encoderdecoder import load_model as load_layout_model
    SURYA_AVAILABLE = True
except ImportError:
    SURYA_AVAILABLE = False
    logging.warning("Surya-OCR not installed. Layout analysis will be limited.")

from PIL import Image

logger = logging.getLogger(__name__)


class RegionType(Enum):
    """Types of document regions"""
    HEADER = "header"
    TITLE = "title"
    PARAGRAPH = "paragraph"
    TABLE = "table"
    LIST = "list"
    FOOTER = "footer"
    UNKNOWN = "unknown"


@dataclass
class BoundingBox:
    """Bounding box coordinates"""
    x1: float
    y1: float
    x2: float
    y2: float
    
    @property
    def width(self) -> float:
        return self.x2 - self.x1
    
    @property
    def height(self) -> float:
        return self.y2 - self.y1
    
    @property
    def area(self) -> float:
        return self.width * self.height


@dataclass
class DocumentRegion:
    """A detected region in the document"""
    region_type: RegionType
    bbox: BoundingBox
    confidence: float
    page_number: int
    reading_order: int = 0
    text: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)


class LayoutAnalyzer:
    """
    Analyzes document layout using Surya-OCR.
    
    Detects structural elements and establishes reading order
    for proper RTL Arabic text flow.
    """
    
    def __init__(self):
        self.det_model = None
        self.layout_model = None
        self._initialized = False
        
    def initialize(self) -> bool:
        """Load models. Call once before processing."""
        if self._initialized:
            return True
            
        if not SURYA_AVAILABLE:
            logger.warning("Surya not available. Using fallback layout detection.")
            self._initialized = True
            return True
            
        try:
            logger.info("Loading Surya detection model...")
            self.det_model = load_det_model()
            
            logger.info("Loading Surya layout model...")
            self.layout_model = load_layout_model()
            
            self._initialized = True
            logger.info("Layout analyzer initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize layout analyzer: {e}")
            return False
    
    def analyze(self, images: List[Image.Image]) -> List[List[DocumentRegion]]:
        """
        Analyze layout of document pages.
        
        Args:
            images: List of PIL Images (one per page)
            
        Returns:
            List of regions per page, sorted by reading order (RTL)
        """
        if not self._initialized:
            self.initialize()
            
        all_regions = []
        
        for page_num, image in enumerate(images, start=1):
            if SURYA_AVAILABLE and self.layout_model:
                regions = self._analyze_with_surya(image, page_num)
            else:
                regions = self._analyze_fallback(image, page_num)
                
            # Sort by reading order (RTL: right-to-left, top-to-bottom)
            regions = self._establish_reading_order(regions)
            all_regions.append(regions)
            
        return all_regions
    
    def _analyze_with_surya(self, image: Image.Image, page_num: int) -> List[DocumentRegion]:
        """Use Surya-OCR for layout detection"""
        regions = []
        
        try:
            # Run layout detection
            layout_results = batch_layout_detection([image], self.layout_model, self.det_model)
            
            if layout_results and len(layout_results) > 0:
                result = layout_results[0]
                
                for idx, bbox_data in enumerate(result.bboxes):
                    region_type = self._map_label_to_type(bbox_data.label)
                    
                    region = DocumentRegion(
                        region_type=region_type,
                        bbox=BoundingBox(
                            x1=bbox_data.bbox[0],
                            y1=bbox_data.bbox[1],
                            x2=bbox_data.bbox[2],
                            y2=bbox_data.bbox[3]
                        ),
                        confidence=bbox_data.confidence if hasattr(bbox_data, 'confidence') else 0.9,
                        page_number=page_num,
                        reading_order=idx
                    )
                    regions.append(region)
                    
        except Exception as e:
            logger.error(f"Surya layout detection failed on page {page_num}: {e}")
            regions = self._analyze_fallback(image, page_num)
            
        return regions
    
    def _analyze_fallback(self, image: Image.Image, page_num: int) -> List[DocumentRegion]:
        """
        Fallback layout detection when Surya is not available.
        Creates a single full-page region.
        """
        width, height = image.size
        
        return [DocumentRegion(
            region_type=RegionType.PARAGRAPH,
            bbox=BoundingBox(x1=0, y1=0, x2=width, y2=height),
            confidence=1.0,
            page_number=page_num,
            reading_order=0
        )]
    
    def _map_label_to_type(self, label: str) -> RegionType:
        """Map Surya labels to our RegionType enum"""
        label_map = {
            "Title": RegionType.TITLE,
            "Text": RegionType.PARAGRAPH,
            "Table": RegionType.TABLE,
            "Figure": RegionType.UNKNOWN,
            "List": RegionType.LIST,
            "Header": RegionType.HEADER,
            "Footer": RegionType.FOOTER,
        }
        return label_map.get(label, RegionType.UNKNOWN)
    
    def _establish_reading_order(self, regions: List[DocumentRegion]) -> List[DocumentRegion]:
        """
        Establish reading order for Arabic (RTL).
        Sort by: y-position (top to bottom), then x-position (right to left)
        """
        # Group regions by approximate rows (same y-level)
        row_threshold = 50  # pixels
        
        sorted_regions = sorted(regions, key=lambda r: (r.bbox.y1, -r.bbox.x1))
        
        for idx, region in enumerate(sorted_regions):
            region.reading_order = idx
            
        return sorted_regions
    
    def crop_region(self, image: Image.Image, region: DocumentRegion) -> Image.Image:
        """Extract a region from the page image"""
        bbox = region.bbox
        return image.crop((int(bbox.x1), int(bbox.y1), int(bbox.x2), int(bbox.y2)))
