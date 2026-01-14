"""
OCR Engine using Arabic-Nougat

Converts document images to Markdown text with high accuracy
for Arabic legal documents.
"""

import logging
from pathlib import Path
from typing import List, Optional, Union
from dataclasses import dataclass

try:
    from transformers import NougatProcessor, VisionEncoderDecoderModel
    import torch
    NOUGAT_AVAILABLE = True
except ImportError:
    NOUGAT_AVAILABLE = False
    logging.warning("Nougat/Transformers not installed. OCR will be limited.")

try:
    import easyocr
    EASYOCR_AVAILABLE = True
except ImportError:
    EASYOCR_AVAILABLE = False

from PIL import Image
import numpy as np

from ..config import ARABIC_NOUGAT_MODEL, ARABIC_NOUGAT_LOCAL, OCR_CONFIG

logger = logging.getLogger(__name__)


@dataclass
class OCRResult:
    """Result from OCR processing"""
    text: str
    confidence: float
    model_used: str
    raw_output: Optional[str] = None


class OCREngine:
    """
    Multi-model OCR engine for Arabic documents.
    
    Primary: Arabic-Nougat (best for structured documents)
    Fallback: EasyOCR (reliable backup)
    """
    
    def __init__(self):
        self.nougat_processor = None
        self.nougat_model = None
        self.easyocr_reader = None
        self.device = None
        self._initialized = False
        
    def initialize(self) -> bool:
        """Load OCR models. Call once before processing."""
        if self._initialized:
            return True
            
        # Detect device
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {self.device}")
        
        # Try to load Arabic-Nougat
        if NOUGAT_AVAILABLE:
            try:
                logger.info("Loading Arabic-Nougat model...")
                
                # Check for local model first
                model_path = str(ARABIC_NOUGAT_LOCAL) if ARABIC_NOUGAT_LOCAL.exists() else ARABIC_NOUGAT_MODEL
                
                self.nougat_processor = NougatProcessor.from_pretrained(model_path)
                self.nougat_model = VisionEncoderDecoderModel.from_pretrained(model_path)
                self.nougat_model.to(self.device)
                self.nougat_model.eval()
                
                logger.info("Arabic-Nougat loaded successfully")
                
            except Exception as e:
                logger.warning(f"Failed to load Arabic-Nougat: {e}")
                self.nougat_model = None
        
        # Load EasyOCR as fallback
        if EASYOCR_AVAILABLE:
            try:
                logger.info("Loading EasyOCR as fallback...")
                self.easyocr_reader = easyocr.Reader(
                    ['ar', 'en'],
                    gpu=self.device == "cuda",
                    verbose=False
                )
                logger.info("EasyOCR loaded successfully")
            except Exception as e:
                logger.warning(f"Failed to load EasyOCR: {e}")
        
        self._initialized = True
        return self.nougat_model is not None or self.easyocr_reader is not None
    
    def process(self, image: Image.Image) -> OCRResult:
        """
        Process an image and extract text.
        
        Args:
            image: PIL Image to process
            
        Returns:
            OCRResult with extracted text
        """
        if not self._initialized:
            self.initialize()
        
        # Try Arabic-Nougat first (best quality)
        if self.nougat_model is not None:
            result = self._process_with_nougat(image)
            if result and len(result.text.strip()) > 10:
                return result
        
        # Fallback to EasyOCR
        if self.easyocr_reader is not None:
            return self._process_with_easyocr(image)
        
        # No OCR available
        return OCRResult(
            text="",
            confidence=0.0,
            model_used="none",
            raw_output="No OCR engine available"
        )
    
    def _process_with_nougat(self, image: Image.Image) -> Optional[OCRResult]:
        """Process with Arabic-Nougat model"""
        try:
            # Ensure RGB
            if image.mode != "RGB":
                image = image.convert("RGB")
            
            # Preprocess
            pixel_values = self.nougat_processor(
                images=image,
                return_tensors="pt"
            ).pixel_values.to(self.device)
            
            # Generate
            with torch.no_grad():
                outputs = self.nougat_model.generate(
                    pixel_values,
                    max_length=4096,
                    bad_words_ids=[[self.nougat_processor.tokenizer.unk_token_id]],
                    return_dict_in_generate=True,
                    output_scores=True
                )
            
            # Decode
            generated_text = self.nougat_processor.batch_decode(
                outputs.sequences,
                skip_special_tokens=True
            )[0]
            
            # Calculate confidence from scores
            confidence = self._calculate_confidence(outputs.scores) if outputs.scores else 0.9
            
            return OCRResult(
                text=generated_text,
                confidence=confidence,
                model_used="arabic-nougat",
                raw_output=generated_text
            )
            
        except Exception as e:
            logger.error(f"Nougat processing failed: {e}")
            return None
    
    def _process_with_easyocr(self, image: Image.Image) -> OCRResult:
        """Process with EasyOCR"""
        try:
            # Convert to numpy
            image_np = np.array(image)
            
            # Run OCR
            results = self.easyocr_reader.readtext(image_np)
            
            # Combine results
            texts = []
            confidences = []
            
            for bbox, text, conf in results:
                texts.append(text)
                confidences.append(conf)
            
            combined_text = "\n".join(texts)
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
            
            return OCRResult(
                text=combined_text,
                confidence=avg_confidence,
                model_used="easyocr"
            )
            
        except Exception as e:
            logger.error(f"EasyOCR processing failed: {e}")
            return OCRResult(
                text="",
                confidence=0.0,
                model_used="easyocr",
                raw_output=str(e)
            )
    
    def _calculate_confidence(self, scores) -> float:
        """Calculate average confidence from generation scores"""
        try:
            probs = [torch.softmax(score, dim=-1).max().item() for score in scores[:10]]
            return sum(probs) / len(probs) if probs else 0.9
        except:
            return 0.9
    
    def process_batch(self, images: List[Image.Image]) -> List[OCRResult]:
        """Process multiple images"""
        return [self.process(img) for img in images]
