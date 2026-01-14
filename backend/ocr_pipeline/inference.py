"""
ExpertOS OCR Pipeline - Main Inference Class

Combines:
- Surya (Layout detection)
- Arabic-Nougat (OCR)
- Tnkeeh (Normalization)
- Validator (Entity extraction)

Usage:
    from inference import ExpertOSInference
    
    pipeline = ExpertOSInference()
    result = pipeline.process_pdf("document.pdf")
"""

import os
import json
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field, asdict
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@dataclass  
class ContentBlock:
    """A content block from OCR"""
    block_type: str
    text: str
    markdown: str = ""
    bbox: Dict[str, float] = None
    confidence: float = 0.0
    order: int = 0


@dataclass
class PageResult:
    """OCR result for a single page"""
    page_number: int
    width: int = 0
    height: int = 0
    content: List[ContentBlock] = field(default_factory=list)
    layout_map: str = ""
    raw_text: str = ""
    normalized_text: str = ""


@dataclass
class DocumentResult:
    """Complete OCR result for a document"""
    document_id: str
    filename: str
    pages: List[PageResult] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    validation: Dict[str, Any] = field(default_factory=dict)
    processing_time_ms: int = 0
    
    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return asdict(self)
    
    def to_json(self) -> str:
        """Convert to JSON string"""
        return json.dumps(self.to_dict(), ensure_ascii=False, indent=2)


class ExpertOSInference:
    """
    Main inference pipeline for ExpertOS OCR.
    
    Architecture:
    PDF → Images → Surya (Layout) → Arabic-Nougat (OCR) → Tnkeeh (Normalize) → Validator → JSON
    """
    
    def __init__(
        self,
        device: str = "auto",
        models_dir: Optional[str] = None,
        enable_layout: bool = True,
        enable_validation: bool = True,
    ):
        """
        Initialize the pipeline.
        
        Args:
            device: "cuda", "cpu", or "auto"
            models_dir: Path to cached models
            enable_layout: Use Surya for layout detection
            enable_validation: Run entity validation
        """
        self.device = self._get_device(device)
        self.models_dir = Path(models_dir) if models_dir else Path(__file__).parent / "models"
        self.enable_layout = enable_layout
        self.enable_validation = enable_validation
        
        # Initialize components lazily
        self._layout_detector = None
        self._ocr_engine = None
        self._normalizer = None
        self._validator = None
        
        logger.info(f"ExpertOS Inference initialized on {self.device}")
    
    def _get_device(self, device: str) -> str:
        """Determine device to use"""
        if device == "auto":
            try:
                import torch
                return "cuda" if torch.cuda.is_available() else "cpu"
            except ImportError:
                return "cpu"
        return device
    
    @property
    def zoom_pipeline(self):
        """Lazy load Zoom-OCR pipeline"""
        if not hasattr(self, '_zoom_pipeline') or self._zoom_pipeline is None:
            try:
                from .zoom_ocr import ZoomOCRPipeline
            except ImportError:
                from zoom_ocr import ZoomOCRPipeline
            self._zoom_pipeline = ZoomOCRPipeline(scales=[1.0, 1.5])
        return self._zoom_pipeline
    
    def process_pdf(self, pdf_path: str, output_dir: Optional[str] = None) -> DocumentResult:
        """
        Process a PDF document through the Zoom-OCR pipeline.
        
        Args:
            pdf_path: Path to PDF file
            output_dir: Directory for output files (optional)
            
        Returns:
            DocumentResult with all extracted content
        """
        import time
        start_time = time.time()
        
        pdf_path = Path(pdf_path)
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF not found: {pdf_path}")
        
        logger.info(f"Processing (Zoom-OCR): {pdf_path}")
        
        # Create document result
        doc_id = f"doc_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        result = DocumentResult(
            document_id=doc_id,
            filename=pdf_path.name
        )
        
        # Convert PDF to images (300 DPI for Zoom-OCR)
        images = self._pdf_to_images(pdf_path, dpi=300)
        logger.info(f"Converted to {len(images)} page images (300 DPI)")
        
        # Process each page with Zoom-OCR
        all_text = []
        full_validation = {
            "phone": None,
            "cr": None,
            "salary": None,
            "ref_id": None
        }
        
        for i, image in enumerate(images):
            logger.info(f"Processing page {i + 1}/{len(images)} with Zoom-OCR...")
            
            # Run Zoom-OCR on page
            zoom_result = self.zoom_pipeline.process_image(image)
            
            # Convert Zoom results to PageResult format
            page_text = zoom_result.full_text
            all_text.append(page_text)
            
            page_res = PageResult(
                page_number=i+1,
                width=image.size[0],
                height=image.size[1],
                raw_text=page_text,
                normalized_text=page_text # Zoom OCR already normalizes
            )
            result.pages.append(page_res)
            
            # Aggregate entity extractions (Take best confidence)
            for field, data in zoom_result.fields.items():
                if data["value"] and data["confidence"] in ["HIGH", "MEDIUM"]:
                    # Simple rule: First High/Medium result wins for now
                    if full_validation.get(field) is None:
                        full_validation[field] = data["value"]

        # Populate validation results
        result.validation = full_validation
        result.validation["confidence"] = "HIGH" if any(result.validation.values()) else "LOW"
        result.validation["warnings"] = []

        # Calculate processing time
        result.processing_time_ms = int((time.time() - start_time) * 1000)
        
        # Add VRAM usage to metadata
        result.metadata["vram_gb"] = self._get_vram_usage()
        result.metadata["device"] = self.device
        result.metadata["engine"] = "zoom_ocr_v1"
        
        # Save output if directory specified
        if output_dir:
            self._save_output(result, output_dir)
        
        logger.info(f"Processing complete in {result.processing_time_ms}ms")
        return result
    
    def _pdf_to_images(self, pdf_path: Path, dpi: int = 200) -> List:
        """Convert PDF to list of PIL Images using PyMuPDF (no Poppler needed)"""
        from PIL import Image
        
        try:
            import fitz  # PyMuPDF
            
            doc = fitz.open(str(pdf_path))
            images = []
            
            # Calculate zoom factor from DPI (default PDF DPI is 72)
            zoom = dpi / 72.0
            matrix = fitz.Matrix(zoom, zoom)
            
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                pix = page.get_pixmap(matrix=matrix)
                
                # Convert to PIL Image
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                images.append(img)
            
            doc.close()
            return images
            
        except ImportError:
            logger.warning("PyMuPDF not available, trying pdf2image...")
            try:
                from pdf2image import convert_from_path
                return convert_from_path(pdf_path, dpi=dpi)
            except Exception as e:
                logger.error(f"PDF conversion failed: {e}")
                raise
    
    def _process_page(self, image, page_number: int) -> PageResult:
        """Process a single page image"""
        from PIL import Image
        
        width, height = image.size
        page_result = PageResult(
            page_number=page_number,
            width=width,
            height=height
        )
        
        # Step 1: Layout detection (if enabled)
        if self.enable_layout:
            try:
                layout = self.layout_detector.analyze_page(image)
                
                # Process each detected block
                for block in layout.blocks:
                    # Crop block region
                    crop_box = (
                        int(block.bbox.x1),
                        int(block.bbox.y1),
                        int(block.bbox.x2),
                        int(block.bbox.y2)
                    )
                    
                    # Ensure valid crop
                    crop_box = (
                        max(0, crop_box[0]),
                        max(0, crop_box[1]),
                        min(width, crop_box[2]),
                        min(height, crop_box[3])
                    )
                    
                    if crop_box[2] > crop_box[0] and crop_box[3] > crop_box[1]:
                        block_image = image.crop(crop_box)
                        
                        # Run OCR on block
                        ocr_result = self.ocr_engine.process_image(block_image)
                        
                        # Normalize text
                        norm_result = self.normalizer.normalize(ocr_result.text)
                        
                        content_block = ContentBlock(
                            block_type=block.block_type.value,
                            text=norm_result.normalized,
                            markdown=ocr_result.markdown,
                            bbox={
                                "x1": block.bbox.x1,
                                "y1": block.bbox.y1,
                                "x2": block.bbox.x2,
                                "y2": block.bbox.y2
                            },
                            confidence=ocr_result.confidence,
                            order=block.order
                        )
                        page_result.content.append(content_block)
                        
            except Exception as e:
                logger.warning(f"Layout detection failed: {e}, using full-page OCR")
                self.enable_layout = False
        
        # Fallback: full-page OCR
        if not self.enable_layout or len(page_result.content) == 0:
            ocr_result = self.ocr_engine.process_image(image)
            norm_result = self.normalizer.normalize(ocr_result.text)
            
            page_result.content.append(ContentBlock(
                block_type="text",
                text=norm_result.normalized,
                markdown=ocr_result.markdown,
                confidence=ocr_result.confidence,
                order=0
            ))
        
        # Combine all text
        page_result.raw_text = "\n".join([b.text for b in page_result.content])
        page_result.normalized_text = page_result.raw_text
        
        return page_result
    
    def _get_vram_usage(self) -> float:
        """Get current VRAM usage in GB"""
        try:
            import torch
            if torch.cuda.is_available():
                return round(torch.cuda.memory_allocated() / (1024**3), 2)
        except:
            pass
        return 0.0
    
    def _save_output(self, result: DocumentResult, output_dir: str):
        """Save output files"""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Save JSON
        json_path = output_path / f"{result.document_id}.json"
        json_path.write_text(result.to_json(), encoding='utf-8')
        logger.info(f"Saved: {json_path}")


# Convenience function
def process_document(pdf_path: str, output_dir: Optional[str] = None) -> DocumentResult:
    """
    Quick function to process a PDF document.
    
    Args:
        pdf_path: Path to PDF
        output_dir: Output directory (optional)
        
    Returns:
        DocumentResult
    """
    pipeline = ExpertOSInference()
    return pipeline.process_pdf(pdf_path, output_dir)
