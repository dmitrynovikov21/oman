"""
Arabic-Nougat OCR Wrapper

Structural OCR using MohamedRashad/arabic-base-nougat
Outputs clean Markdown from document images.
"""

import logging
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from pathlib import Path

logger = logging.getLogger(__name__)


@dataclass
class OCRResult:
    """OCR result for a single image/region"""
    text: str
    markdown: str
    confidence: float
    method: str
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


class ArabicNougatOCR:
    """
    Arabic OCR using Nougat model.
    
    Model: MohamedRashad/arabic-base-nougat
    Output: Clean Markdown text
    """
    
    def __init__(self, model_path: Optional[str] = None, device: str = "auto"):
        """
        Initialize Arabic-Nougat OCR.
        
        Args:
            model_path: Path to cached model
            device: "cuda", "cpu", or "auto"
        """
        self.model_path = model_path or "MohamedRashad/arabic-base-nougat"
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
        """Load Arabic-Nougat model"""
        try:
            from transformers import NougatProcessor, VisionEncoderDecoderModel
            import torch
            
            logger.info(f"Loading Arabic-Nougat on {self.device}...")
            
            self.processor = NougatProcessor.from_pretrained(self.model_path)
            self.model = VisionEncoderDecoderModel.from_pretrained(self.model_path)
            
            if self.device == "cuda":
                self.model = self.model.to("cuda")
                if torch.cuda.is_available():
                    # Use half precision for memory efficiency
                    self.model = self.model.half()
            
            self.model.eval()
            logger.info("Arabic-Nougat loaded successfully")
            
        except ImportError as e:
            logger.warning(f"Transformers not installed: {e}")
            self.model = None
            self.processor = None
        except Exception as e:
            logger.error(f"Failed to load Arabic-Nougat: {e}")
            self.model = None
            self.processor = None
    
    def process_image(self, image, max_length: int = 4096) -> OCRResult:
        """
        Process a single image through Nougat.
        
        Args:
            image: PIL Image
            max_length: Maximum output tokens
            
        Returns:
            OCRResult with text and markdown
        """
        if self.model is None:
            return self._fallback_ocr(image)
        
        try:
            import torch
            from PIL import Image
            
            # Prepare image
            if not isinstance(image, Image.Image):
                image = Image.fromarray(image)
            
            # Convert to RGB if needed
            if image.mode != "RGB":
                image = image.convert("RGB")
            
            # Process image
            pixel_values = self.processor(image, return_tensors="pt").pixel_values
            
            if self.device == "cuda":
                pixel_values = pixel_values.to("cuda")
                if self.model.dtype == torch.float16:
                    pixel_values = pixel_values.half()
            
            # Generate text
            with torch.no_grad():
                generated_ids = self.model.generate(
                    pixel_values,
                    max_length=max_length,
                    bad_words_ids=[[self.processor.tokenizer.unk_token_id]],
                    do_sample=False,
                    num_beams=1,  # Greedy for speed
                )
            
            # Decode
            generated_text = self.processor.batch_decode(
                generated_ids, 
                skip_special_tokens=True
            )[0]
            
            # Post-process Nougat output
            markdown_text = self._clean_nougat_output(generated_text)
            
            return OCRResult(
                text=self._markdown_to_plain(markdown_text),
                markdown=markdown_text,
                confidence=0.9,
                method="arabic-nougat",
                metadata={
                    "tokens": len(generated_ids[0]),
                    "device": self.device
                }
            )
            
        except Exception as e:
            logger.error(f"Arabic-Nougat inference failed: {e}")
            return self._fallback_ocr(image)
    
    def _clean_nougat_output(self, text: str) -> str:
        """Clean up Nougat output artifacts"""
        import re
        
        # Remove repeated tokens (Nougat sometimes hallucinates)
        text = re.sub(r'(.)\1{5,}', r'\1\1', text)
        
        # Remove [MISSING] markers
        text = re.sub(r'\[MISSING[^\]]*\]', '', text)
        
        # Clean up excessive newlines
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        return text.strip()
    
    def _markdown_to_plain(self, markdown: str) -> str:
        """Convert markdown to plain text"""
        import re
        
        plain = markdown
        
        # Remove markdown headers
        plain = re.sub(r'^#+\s*', '', plain, flags=re.MULTILINE)
        
        # Remove bold/italic markers
        plain = re.sub(r'\*+([^*]+)\*+', r'\1', plain)
        plain = re.sub(r'_+([^_]+)_+', r'\1', plain)
        
        # Keep table content but remove formatting
        plain = re.sub(r'\|', ' ', plain)
        plain = re.sub(r'-{3,}', '', plain)
        
        return plain.strip()
    
    def _fallback_ocr(self, image) -> OCRResult:
        """Fallback to EasyOCR if Nougat fails"""
        try:
            import easyocr
            
            logger.info("Falling back to EasyOCR...")
            reader = easyocr.Reader(['ar', 'en'], gpu=self.device == "cuda")
            
            import numpy as np
            from PIL import Image
            
            if isinstance(image, Image.Image):
                image = np.array(image)
            
            results = reader.readtext(image)
            text = " ".join([r[1] for r in results])
            
            return OCRResult(
                text=text,
                markdown=text,
                confidence=0.6,
                method="easyocr-fallback"
            )
            
        except Exception as e:
            logger.error(f"Fallback OCR also failed: {e}")
            return OCRResult(
                text="",
                markdown="",
                confidence=0.0,
                method="failed"
            )
    
    def get_vram_usage(self) -> float:
        """Get current VRAM usage in GB"""
        try:
            import torch
            if torch.cuda.is_available():
                return torch.cuda.memory_allocated() / (1024**3)
        except:
            pass
        return 0.0
