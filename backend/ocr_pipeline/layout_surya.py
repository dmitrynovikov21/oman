"""
Surya Layout Detection Wrapper

Handles document layout analysis:
- Table detection
- Header/footer detection
- Text block segmentation
- RTL reading order
"""

import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from pathlib import Path
from enum import Enum

logger = logging.getLogger(__name__)


class BlockType(Enum):
    """Types of document blocks"""
    HEADER = "header"
    FOOTER = "footer"
    TABLE = "table"
    TEXT = "text"
    IMAGE = "image"
    LIST = "list"
    TITLE = "title"


@dataclass
class BoundingBox:
    """Bounding box for a detected region"""
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
    
    @property
    def center_x(self) -> float:
        return (self.x1 + self.x2) / 2


@dataclass
class LayoutBlock:
    """A detected layout block"""
    block_type: BlockType
    bbox: BoundingBox
    confidence: float
    text: str = ""
    order: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PageLayout:
    """Layout analysis result for a page"""
    page_number: int
    width: int
    height: int
    blocks: List[LayoutBlock] = field(default_factory=list)
    reading_order: List[int] = field(default_factory=list)


class SuryaLayoutDetector:
    """
    Layout detection using Surya-OCR.
    
    Detects document structure:
    - Tables
    - Headers/Footers
    - Text blocks
    - Establishes RTL reading order
    """
    
    def __init__(self, model_path: Optional[str] = None, device: str = "auto"):
        """
        Initialize Surya layout detector.
        
        Args:
            model_path: Path to cached model (or None for auto-download)
            device: "cuda", "cpu", or "auto"
        """
        self.model_path = model_path
        self.device = self._get_device(device)
        self.model = None
        self.processor = None
        self._load_model()
    
    def _get_device(self, device: str) -> str:
        """Determine device to use"""
        if device == "auto":
            try:
                import torch
                return "cuda" if torch.cuda.is_available() else "cpu"
            except ImportError:
                return "cpu"
        return device
    
    def _load_model(self):
        """Load Surya layout model"""
        try:
            from surya.detection import DetectionPredictor
            from surya.layout import LayoutPredictor
            
            logger.info(f"Loading Surya on {self.device}...")
            
            # Load detection and layout models
            self.det_predictor = DetectionPredictor()
            self.layout_predictor = LayoutPredictor()
            
            logger.info("Surya loaded successfully")
            
        except ImportError as e:
            logger.warning(f"Surya not installed: {e}")
            logger.info("Falling back to simple layout detection")
            self.det_predictor = None
            self.layout_predictor = None
        except Exception as e:
            logger.error(f"Failed to load Surya: {e}")
            self.det_predictor = None
            self.layout_predictor = None
    
    def analyze_page(self, image) -> PageLayout:
        """
        Analyze a single page image.
        
        Args:
            image: PIL Image or numpy array
            
        Returns:
            PageLayout with detected blocks
        """
        from PIL import Image
        import numpy as np
        
        # Ensure PIL Image
        if isinstance(image, np.ndarray):
            image = Image.fromarray(image)
        
        width, height = image.size
        blocks = []
        
        if self.layout_predictor is not None:
            # Use Surya for layout detection
            blocks = self._surya_analyze(image)
        else:
            # Fallback: treat entire page as single text block
            blocks = [LayoutBlock(
                block_type=BlockType.TEXT,
                bbox=BoundingBox(0, 0, width, height),
                confidence=0.5,
                order=0
            )]
        
        # Establish RTL reading order
        reading_order = self._establish_rtl_order(blocks, width)
        
        return PageLayout(
            page_number=0,
            width=width,
            height=height,
            blocks=blocks,
            reading_order=reading_order
        )
    
    def _surya_analyze(self, image) -> List[LayoutBlock]:
        """Run Surya layout analysis"""
        blocks = []
        
        try:
            # Run layout detection
            layout_result = self.layout_predictor([image])
            
            if layout_result and len(layout_result) > 0:
                page_result = layout_result[0]
                
                for i, box in enumerate(page_result.bboxes):
                    block_type = self._map_surya_type(box.label)
                    
                    blocks.append(LayoutBlock(
                        block_type=block_type,
                        bbox=BoundingBox(
                            x1=box.bbox[0],
                            y1=box.bbox[1],
                            x2=box.bbox[2],
                            y2=box.bbox[3]
                        ),
                        confidence=box.confidence if hasattr(box, 'confidence') else 0.9,
                        order=i
                    ))
                    
        except Exception as e:
            logger.error(f"Surya analysis failed: {e}")
        
        return blocks
    
    def _map_surya_type(self, label: str) -> BlockType:
        """Map Surya labels to our BlockType enum"""
        mapping = {
            "Table": BlockType.TABLE,
            "Title": BlockType.TITLE,
            "Text": BlockType.TEXT,
            "List": BlockType.LIST,
            "Figure": BlockType.IMAGE,
            "Caption": BlockType.TEXT,
            "Header": BlockType.HEADER,
            "Footer": BlockType.FOOTER,
        }
        return mapping.get(label, BlockType.TEXT)
    
    def _establish_rtl_order(self, blocks: List[LayoutBlock], page_width: int) -> List[int]:
        """
        Establish RTL (right-to-left) reading order.
        
        For Arabic documents:
        1. Top to bottom (primary)
        2. Right to left (secondary)
        """
        if not blocks:
            return []
        
        # Sort blocks by Y position (top to bottom), then by X (right to left)
        sorted_blocks = sorted(
            enumerate(blocks),
            key=lambda x: (
                x[1].bbox.y1,  # Primary: top to bottom
                -x[1].bbox.x2  # Secondary: right to left (negative for descending)
            )
        )
        
        # Update order in blocks
        for new_order, (orig_idx, block) in enumerate(sorted_blocks):
            blocks[orig_idx].order = new_order
        
        return [orig_idx for orig_idx, _ in sorted_blocks]
    
    def get_vram_usage(self) -> float:
        """Get current VRAM usage in GB"""
        try:
            import torch
            if torch.cuda.is_available():
                return torch.cuda.memory_allocated() / (1024**3)
        except:
            pass
        return 0.0
