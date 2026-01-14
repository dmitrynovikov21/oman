"""
ExpertOS OCR Pipeline - FastAPI Service

Main entry point for the Arabic document parsing API.
Exposes /parse endpoint for PDF processing.
"""

import logging
import tempfile
import os
from pathlib import Path
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image

# PDF processing
try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False

try:
    from pdf2image import convert_from_path, convert_from_bytes
    PDF2IMAGE_AVAILABLE = True
except ImportError:
    PDF2IMAGE_AVAILABLE = False

from .config import SERVICE_HOST, SERVICE_PORT, OCR_CONFIG, LOG_LEVEL, LOG_FORMAT
from .pipeline import LayoutAnalyzer, OCREngine, ArabicNormalizer, EntityExtractor

# Configure logging
logging.basicConfig(level=getattr(logging, LOG_LEVEL), format=LOG_FORMAT)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="ExpertOS OCR Pipeline",
    description="Autonomous Arabic Legal Document Parser",
    version="1.0.0"
)

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pipeline components (lazy init)
layout_analyzer: Optional[LayoutAnalyzer] = None
ocr_engine: Optional[OCREngine] = None
normalizer: Optional[ArabicNormalizer] = None
entity_extractor: Optional[EntityExtractor] = None


# === MODELS ===

class ParseResponse(BaseModel):
    """Response from /parse endpoint"""
    success: bool
    phone: Optional[str] = None
    cr: Optional[str] = None
    civil_id: Optional[str] = None
    dates: List[Dict[str, str]] = []
    amounts: List[Dict[str, Any]] = []
    warnings: List[str] = []
    confidence: str = "MEDIUM"
    raw_text: str = ""
    pages_processed: int = 0
    model_used: str = ""
    error: Optional[str] = None


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    components: Dict[str, bool]


# === ENDPOINTS ===

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Check service health and component availability"""
    return HealthResponse(
        status="healthy",
        components={
            "pymupdf": PYMUPDF_AVAILABLE,
            "pdf2image": PDF2IMAGE_AVAILABLE,
            "pipeline_initialized": layout_analyzer is not None
        }
    )


@app.post("/parse", response_model=ParseResponse)
async def parse_document(file: UploadFile = File(...)):
    """
    Parse an Arabic legal document (PDF).
    
    Pipeline:
    1. PDF → Images
    2. Layout Analysis (Surya-OCR)
    3. OCR (Arabic-Nougat / EasyOCR)
    4. Normalization (Tnkeeh)
    5. Entity Extraction
    
    Returns structured data with phone, CR, dates, amounts.
    """
    global layout_analyzer, ocr_engine, normalizer, entity_extractor
    
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    try:
        # Initialize components if needed
        if layout_analyzer is None:
            logger.info("Initializing pipeline components...")
            layout_analyzer = LayoutAnalyzer()
            ocr_engine = OCREngine()
            normalizer = ArabicNormalizer()
            entity_extractor = EntityExtractor()
            
            layout_analyzer.initialize()
            ocr_engine.initialize()
        
        # Read PDF
        pdf_bytes = await file.read()
        logger.info(f"Processing PDF: {file.filename} ({len(pdf_bytes)} bytes)")
        
        # Convert PDF to images
        images = pdf_to_images(pdf_bytes)
        logger.info(f"Converted to {len(images)} page images")
        
        if not images:
            return ParseResponse(
                success=False,
                error="Failed to convert PDF to images"
            )
        
        # Process each page
        all_text = []
        model_used = ""
        
        for page_num, image in enumerate(images[:OCR_CONFIG["max_pages"]], start=1):
            logger.info(f"Processing page {page_num}/{len(images)}...")
            
            # Layout analysis
            regions = layout_analyzer.analyze([image])[0]
            
            # OCR each region
            for region in regions:
                region_image = layout_analyzer.crop_region(image, region)
                ocr_result = ocr_engine.process(region_image)
                
                if ocr_result.text:
                    region.text = ocr_result.text
                    model_used = ocr_result.model_used
                    all_text.append(ocr_result.text)
        
        # Combine all text
        combined_text = "\n\n".join(all_text)
        logger.info(f"Combined text: {len(combined_text)} chars")
        
        # Normalize
        norm_result = normalizer.normalize(combined_text)
        logger.info(f"Normalization made {len(norm_result.changes_made)} changes")
        
        # Extract entities
        extraction = entity_extractor.extract_all(norm_result.normalized)
        
        return ParseResponse(
            success=True,
            phone=extraction.phone,
            cr=extraction.cr,
            civil_id=extraction.civil_id,
            dates=extraction.dates,
            amounts=extraction.amounts,
            warnings=extraction.warnings,
            confidence=extraction.confidence.value,
            raw_text=norm_result.normalized,
            pages_processed=len(images),
            model_used=model_used
        )
        
    except Exception as e:
        logger.exception("Parse failed")
        return ParseResponse(
            success=False,
            error=str(e)
        )


@app.post("/extract-text")
async def extract_text_only(file: UploadFile = File(...)):
    """
    Extract raw text from PDF without entity extraction.
    Useful for debugging OCR quality.
    """
    global ocr_engine, normalizer
    
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    try:
        if ocr_engine is None:
            ocr_engine = OCREngine()
            normalizer = ArabicNormalizer()
            ocr_engine.initialize()
        
        pdf_bytes = await file.read()
        images = pdf_to_images(pdf_bytes)
        
        all_text = []
        for image in images[:OCR_CONFIG["max_pages"]]:
            result = ocr_engine.process(image)
            if result.text:
                all_text.append(result.text)
        
        combined = "\n\n".join(all_text)
        normalized = normalizer.normalize(combined)
        
        return {
            "success": True,
            "raw_text": combined,
            "normalized_text": normalized.normalized,
            "changes": normalized.changes_made,
            "pages": len(images)
        }
        
    except Exception as e:
        logger.exception("Text extraction failed")
        return {"success": False, "error": str(e)}


# === UTILITIES ===

def pdf_to_images(pdf_bytes: bytes) -> List[Image.Image]:
    """Convert PDF bytes to list of PIL Images"""
    images = []
    
    # Try PyMuPDF first (faster)
    if PYMUPDF_AVAILABLE:
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            for page in doc:
                # Render at configured DPI
                mat = fitz.Matrix(OCR_CONFIG["dpi"] / 72, OCR_CONFIG["dpi"] / 72)
                pix = page.get_pixmap(matrix=mat)
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                images.append(img)
            doc.close()
            return images
        except Exception as e:
            logger.warning(f"PyMuPDF failed: {e}, trying pdf2image...")
    
    # Fallback to pdf2image
    if PDF2IMAGE_AVAILABLE:
        try:
            images = convert_from_bytes(pdf_bytes, dpi=OCR_CONFIG["dpi"])
            return images
        except Exception as e:
            logger.error(f"pdf2image failed: {e}")
    
    return images


# === MAIN ===

def run_server():
    """Run the OCR service"""
    import uvicorn
    logger.info(f"Starting OCR Pipeline on {SERVICE_HOST}:{SERVICE_PORT}")
    uvicorn.run(app, host=SERVICE_HOST, port=SERVICE_PORT)


if __name__ == "__main__":
    run_server()
