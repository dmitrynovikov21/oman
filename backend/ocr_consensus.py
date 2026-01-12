"""
Mission 12: Dual OCR Ensemble (Consensus Layer)

Runs PaddleOCR and EasyOCR in parallel and compares results.
- If results match → mark as 'verified'
- If results differ → mark as 'conflict' with both values
"""

import asyncio
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
from pathlib import Path
import json
import re

# OCR availability flags
PADDLE_AVAILABLE = False
EASYOCR_AVAILABLE = False

try:
    from paddleocr import PaddleOCR
    PADDLE_AVAILABLE = True
except ImportError:
    print("Warning: PaddleOCR not installed. Run: pip install paddleocr")

try:
    import easyocr
    EASYOCR_AVAILABLE = True
except ImportError:
    print("Warning: EasyOCR not installed. Run: pip install easyocr")


@dataclass
class OCRResult:
    """Single OCR extraction result"""
    text: str
    confidence: float
    bbox: Optional[Tuple[int, int, int, int]] = None  # x, y, w, h
    source: str = ""  # "paddle" or "easyocr"


@dataclass
class ConsensusResult:
    """Result of comparing two OCR outputs"""
    field_name: str
    paddle_value: str
    easyocr_value: str
    final_value: str
    status: str  # "verified", "conflict", "single_source"
    confidence: float
    needs_review: bool = False
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "field": self.field_name,
            "paddle": self.paddle_value,
            "easyocr": self.easyocr_value,
            "final": self.final_value,
            "status": self.status,
            "confidence": self.confidence,
            "needs_review": self.needs_review
        }


@dataclass
class DocumentConsensus:
    """Complete consensus results for a document"""
    document_id: str
    results: List[ConsensusResult] = field(default_factory=list)
    verified_count: int = 0
    conflict_count: int = 0
    total_fields: int = 0
    processed_at: str = field(default_factory=lambda: datetime.now().isoformat())
    
    def add_result(self, result: ConsensusResult):
        self.results.append(result)
        self.total_fields += 1
        if result.status == "verified":
            self.verified_count += 1
        elif result.status == "conflict":
            self.conflict_count += 1
    
    @property
    def accuracy_rate(self) -> float:
        if self.total_fields == 0:
            return 0.0
        return self.verified_count / self.total_fields


class OCRConsensusEngine:
    """
    Dual-model OCR engine with consensus layer.
    Runs PaddleOCR and EasyOCR and compares results.
    """
    
    def __init__(self, lang: str = "ar"):
        self.lang = lang
        self._paddle_ocr = None
        self._easyocr_reader = None
        
    def _get_paddle(self):
        """Lazy init PaddleOCR"""
        if self._paddle_ocr is None and PADDLE_AVAILABLE:
            self._paddle_ocr = PaddleOCR(
                use_angle_cls=True,
                lang=self.lang,
                use_gpu=False,
                show_log=False
            )
        return self._paddle_ocr
    
    def _get_easyocr(self):
        """Lazy init EasyOCR"""
        if self._easyocr_reader is None and EASYOCR_AVAILABLE:
            self._easyocr_reader = easyocr.Reader(
                [self.lang, 'en'],
                gpu=False
            )
        return self._easyocr_reader
    
    def run_paddle(self, image_path: str) -> List[OCRResult]:
        """Run PaddleOCR on image"""
        paddle = self._get_paddle()
        if paddle is None:
            return []
        
        try:
            result = paddle.ocr(image_path, cls=True)
            ocr_results = []
            
            if result and result[0]:
                for line in result[0]:
                    bbox_points = line[0]
                    text = line[1][0]
                    confidence = line[1][1]
                    
                    # Convert bbox points to (x, y, w, h)
                    x = int(min(p[0] for p in bbox_points))
                    y = int(min(p[1] for p in bbox_points))
                    w = int(max(p[0] for p in bbox_points) - x)
                    h = int(max(p[1] for p in bbox_points) - y)
                    
                    ocr_results.append(OCRResult(
                        text=text,
                        confidence=confidence,
                        bbox=(x, y, w, h),
                        source="paddle"
                    ))
            
            return ocr_results
        except Exception as e:
            print(f"PaddleOCR error: {e}")
            return []
    
    def run_easyocr(self, image_path: str) -> List[OCRResult]:
        """Run EasyOCR on image"""
        reader = self._get_easyocr()
        if reader is None:
            return []
        
        try:
            result = reader.readtext(image_path)
            ocr_results = []
            
            for detection in result:
                bbox_points = detection[0]
                text = detection[1]
                confidence = detection[2]
                
                # Convert bbox to (x, y, w, h)
                x = int(min(p[0] for p in bbox_points))
                y = int(min(p[1] for p in bbox_points))
                w = int(max(p[0] for p in bbox_points) - x)
                h = int(max(p[1] for p in bbox_points) - y)
                
                ocr_results.append(OCRResult(
                    text=text,
                    confidence=confidence,
                    bbox=(x, y, w, h),
                    source="easyocr"
                ))
            
            return ocr_results
        except Exception as e:
            print(f"EasyOCR error: {e}")
            return []
    
    def run_dual(self, image_path: str) -> Tuple[List[OCRResult], List[OCRResult]]:
        """Run both OCR engines on the same image"""
        paddle_results = self.run_paddle(image_path)
        easyocr_results = self.run_easyocr(image_path)
        return paddle_results, easyocr_results
    
    def _normalize_text(self, text: str) -> str:
        """Normalize Arabic text for comparison"""
        # Remove diacritics
        text = re.sub(r'[\u064B-\u065F]', '', text)
        # Normalize alef variants
        text = re.sub(r'[إأآا]', 'ا', text)
        # Remove extra whitespace
        text = ' '.join(text.split())
        return text.strip()
    
    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate text similarity (0-1)"""
        if not text1 or not text2:
            return 0.0
        
        norm1 = self._normalize_text(text1)
        norm2 = self._normalize_text(text2)
        
        if norm1 == norm2:
            return 1.0
        
        # Simple character-based similarity
        if len(norm1) == 0 or len(norm2) == 0:
            return 0.0
        
        common = sum(1 for c in norm1 if c in norm2)
        return common / max(len(norm1), len(norm2))
    
    def compare_values(
        self, 
        field_name: str,
        paddle_value: str, 
        easyocr_value: str,
        similarity_threshold: float = 0.9
    ) -> ConsensusResult:
        """
        Compare values from both OCR engines.
        
        Returns:
        - 'verified' if values match
        - 'conflict' if values differ
        - 'single_source' if only one value available
        """
        # Handle missing values
        if not paddle_value and not easyocr_value:
            return ConsensusResult(
                field_name=field_name,
                paddle_value="",
                easyocr_value="",
                final_value="",
                status="single_source",
                confidence=0.0,
                needs_review=True
            )
        
        if not paddle_value:
            return ConsensusResult(
                field_name=field_name,
                paddle_value="",
                easyocr_value=easyocr_value,
                final_value=easyocr_value,
                status="single_source",
                confidence=0.7,
                needs_review=False
            )
        
        if not easyocr_value:
            return ConsensusResult(
                field_name=field_name,
                paddle_value=paddle_value,
                easyocr_value="",
                final_value=paddle_value,
                status="single_source",
                confidence=0.7,
                needs_review=False
            )
        
        # Compare values
        similarity = self._calculate_similarity(paddle_value, easyocr_value)
        
        if similarity >= similarity_threshold:
            # Verified - use the one with higher confidence or paddle as default
            return ConsensusResult(
                field_name=field_name,
                paddle_value=paddle_value,
                easyocr_value=easyocr_value,
                final_value=paddle_value,  # Prefer paddle
                status="verified",
                confidence=similarity,
                needs_review=False
            )
        else:
            # Conflict - flag for manual review
            return ConsensusResult(
                field_name=field_name,
                paddle_value=paddle_value,
                easyocr_value=easyocr_value,
                final_value="",  # No final value until resolved
                status="conflict",
                confidence=similarity,
                needs_review=True
            )
    
    def process_document(
        self, 
        image_path: str,
        document_id: str = ""
    ) -> DocumentConsensus:
        """
        Process a document with both OCR engines and build consensus.
        
        Returns DocumentConsensus with all field comparisons.
        """
        if not document_id:
            document_id = Path(image_path).stem
        
        consensus = DocumentConsensus(document_id=document_id)
        
        # Run both OCR engines
        paddle_results, easyocr_results = self.run_dual(image_path)
        
        # Match results by position (simplified matching)
        # In production, use bbox overlap detection
        max_len = max(len(paddle_results), len(easyocr_results))
        
        for i in range(max_len):
            paddle_val = paddle_results[i].text if i < len(paddle_results) else ""
            easyocr_val = easyocr_results[i].text if i < len(easyocr_results) else ""
            
            result = self.compare_values(
                field_name=f"field_{i}",
                paddle_value=paddle_val,
                easyocr_value=easyocr_val
            )
            consensus.add_result(result)
        
        return consensus
    
    def compare_specific_values(
        self,
        values: Dict[str, Tuple[str, str]]  # field_name -> (paddle, easyocr)
    ) -> DocumentConsensus:
        """
        Compare pre-extracted values from both engines.
        
        Args:
            values: Dict mapping field names to (paddle_value, easyocr_value) tuples
        """
        consensus = DocumentConsensus(document_id="manual_compare")
        
        for field_name, (paddle_val, easyocr_val) in values.items():
            result = self.compare_values(field_name, paddle_val, easyocr_val)
            consensus.add_result(result)
        
        return consensus


# Simulated OCR for testing (when real OCR not available)
class SimulatedOCR:
    """Simulated OCR for testing consensus logic"""
    
    @staticmethod
    def paddle_result(text: str, noise: float = 0.0) -> str:
        """Simulate PaddleOCR output with optional noise"""
        if noise > 0:
            # Add some variation
            import random
            if random.random() < noise:
                # Simulate digit confusion
                text = text.replace('5', '6').replace('0', 'O')
        return text
    
    @staticmethod
    def easyocr_result(text: str, noise: float = 0.0) -> str:
        """Simulate EasyOCR output with optional noise"""
        if noise > 0:
            import random
            if random.random() < noise:
                # Different error pattern
                text = text.replace('0', '8').replace('1', 'l')
        return text


def test_consensus():
    """Test the consensus engine with simulated data"""
    engine = OCRConsensusEngine()
    
    print("=== OCR Consensus Engine Test ===\n")
    
    # Test 1: Unity (matching values)
    print("Test 1: Unity (Clear digit 750)")
    result = engine.compare_values(
        field_name="salary",
        paddle_value="750",
        easyocr_value="750"
    )
    print(f"  Paddle: {result.paddle_value}")
    print(f"  EasyOCR: {result.easyocr_value}")
    print(f"  Status: {result.status}")
    print(f"  → Expected: verified, Got: {result.status}")
    assert result.status == "verified", "Unity test failed!"
    print("  ✓ PASSED\n")
    
    # Test 2: Conflict (different values)
    print("Test 2: Conflict (Blurry date)")
    result = engine.compare_values(
        field_name="date",
        paddle_value="2024/01/15",
        easyocr_value="2024/01/16"
    )
    print(f"  Paddle: {result.paddle_value}")
    print(f"  EasyOCR: {result.easyocr_value}")
    print(f"  Status: {result.status}")
    print(f"  Needs Review: {result.needs_review}")
    print(f"  → Expected: conflict, Got: {result.status}")
    assert result.status == "conflict", "Conflict test failed!"
    print("  ✓ PASSED\n")
    
    # Test 3: Arabic text consensus
    print("Test 3: Arabic Text Consensus")
    result = engine.compare_values(
        field_name="court_name",
        paddle_value="المحكمة الابتدائية",
        easyocr_value="المحكمة الابتدائية"
    )
    print(f"  Status: {result.status}")
    assert result.status == "verified", "Arabic consensus test failed!"
    print("  ✓ PASSED\n")
    
    # Test 4: Number variation (103 vs 108)
    print("Test 4: Number Conflict (103 vs 108)")
    result = engine.compare_values(
        field_name="amount",
        paddle_value="103",
        easyocr_value="108"
    )
    print(f"  Paddle: {result.paddle_value}")
    print(f"  EasyOCR: {result.easyocr_value}")
    print(f"  Status: {result.status}")
    assert result.status == "conflict", "Number conflict test failed!"
    print("  ✓ PASSED\n")
    
    print("=== All Consensus Tests Passed ===")


if __name__ == "__main__":
    test_consensus()
