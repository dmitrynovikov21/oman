"""
Mission 15: Parallel OCR Pipeline
Интеграция с ocr_consensus.py для пакетной обработки

Запускает PaddleOCR и EasyOCR параллельно, 
извлекает якорные переменные через regex.
"""

import asyncio
import re
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any

# Импорт существующих модулей
try:
    from ocr_consensus import OCRConsensusEngine
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
    print("Warning: ocr_consensus not available")

try:
    from intelligent_validation import LegalRefiner, validate_and_refine
    VALIDATION_AVAILABLE = True
except ImportError:
    VALIDATION_AVAILABLE = False

try:
    from privacy_masking import MaskingEngine
    PRIVACY_AVAILABLE = True
except ImportError:
    PRIVACY_AVAILABLE = False


@dataclass
class AnchorVariable:
    """Якорная переменная, извлечённая из текста"""
    name: str           # salary, date, civil_id, case_number
    value: str          # Извлечённое значение
    confidence: float   # 0-1
    source: str         # "regex", "fuzzy", "ai"
    page_number: int = 1
    position: Optional[Tuple[int, int]] = None  # Start, end in text


@dataclass
class OCRPageResult:
    """Результат OCR для одной страницы"""
    page_number: int
    text_paddle: str
    text_easyocr: str
    consensus_text: str
    has_conflict: bool
    anchors: List[AnchorVariable]
    ai_summary: str = ""
    masked_text: str = ""


class AnchorExtractor:
    """
    Извлекает якорные переменные из текста через Regex.
    """
    
    PATTERNS = {
        "civil_id": r'\b\d{8}\b',  # 8-значный Civil ID
        "case_number": r'\b\d{1,5}/\d{4}\b',  # 1234/2024
        "date_gregorian": r'\b\d{4}[/-]\d{2}[/-]\d{2}\b',  # 2024/01/15
        "date_arabic": r'\b\d{1,2}\s+(?:محرم|صفر|ربيع|جمادى|رجب|شعبان|رمضان|شوال|ذو)\s+\d{4}\b',
        "amount_omr": r'\b\d{1,3}(?:,\d{3})*\.\d{3}\b',  # 1,234.567
        "phone_oman": r'\b(?:\+968)?\s*\d{8}\b',  # +968 99887766
        "iban": r'\bOM\d{2}[A-Z]{4}\d{16}\b',  # Omani IBAN
    }
    
    def extract_all(self, text: str, page_number: int = 1) -> List[AnchorVariable]:
        """Извлечь все якорные переменные из текста"""
        anchors = []
        
        for name, pattern in self.PATTERNS.items():
            matches = re.finditer(pattern, text)
            for match in matches:
                anchors.append(AnchorVariable(
                    name=name,
                    value=match.group(),
                    confidence=0.95,  # Regex = высокая уверенность
                    source="regex",
                    page_number=page_number,
                    position=(match.start(), match.end())
                ))
        
        return anchors
    
    def extract_salaries(self, text: str, page_number: int = 1) -> List[AnchorVariable]:
        """Специальный экстрактор для зарплат"""
        anchors = []
        
        # Паттерны для зарплат
        salary_patterns = [
            (r'(?:salary|راتب|أساسي)[:\s]*(\d{1,3}(?:,\d{3})*\.?\d*)', "basic_salary"),
            (r'(?:gross|إجمالي)[:\s]*(\d{1,3}(?:,\d{3})*\.?\d*)', "gross_salary"),
            (r'(?:eosb|مكافأة)[:\s]*(\d{1,3}(?:,\d{3})*\.?\d*)', "eosb"),
        ]
        
        for pattern, name in salary_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                anchors.append(AnchorVariable(
                    name=name,
                    value=match.group(1).replace(',', ''),
                    confidence=0.90,
                    source="regex",
                    page_number=page_number
                ))
        
        return anchors


class ParallelOCRPipeline:
    """
    Пайплайн параллельной обработки документов.
    """
    
    def __init__(self):
        self.anchor_extractor = AnchorExtractor()
        self.executor = ThreadPoolExecutor(max_workers=4)
        
        if OCR_AVAILABLE:
            self.ocr_engine = OCRConsensusEngine()
        else:
            self.ocr_engine = None
        
        if PRIVACY_AVAILABLE:
            self.masking_engine = MaskingEngine()
        else:
            self.masking_engine = None
        
        if VALIDATION_AVAILABLE:
            self.refiner = LegalRefiner()
        else:
            self.refiner = None
    
    def process_document(
        self,
        file_path: str,
        extract_anchors: bool = True,
        apply_privacy: bool = False
    ) -> List[OCRPageResult]:
        """
        Обработать документ с параллельным OCR.
        
        Returns:
            Список OCRPageResult для каждой страницы
        """
        path = Path(file_path)
        results = []
        
        if not path.exists():
            return results
        
        # Для одностраничных изображений
        if path.suffix.lower() in ['.png', '.jpg', '.jpeg', '.tiff']:
            page_result = self._process_single_page(str(path), page_number=1)
            
            if extract_anchors:
                page_result.anchors = self.anchor_extractor.extract_all(
                    page_result.consensus_text, 
                    page_number=1
                )
            
            if apply_privacy and self.masking_engine:
                page_result.masked_text = self.masking_engine.mask_text(
                    page_result.consensus_text
                )
            
            results.append(page_result)
        
        # TODO: Обработка PDF через pdf2image
        
        return results
    
    def _process_single_page(
        self, 
        image_path: str, 
        page_number: int = 1
    ) -> OCRPageResult:
        """Обработать одну страницу"""
        
        if self.ocr_engine:
            # Реальный OCR
            paddle_results, easyocr_results = self.ocr_engine.run_dual(image_path)
            
            text_paddle = " ".join([r.text for r in paddle_results])
            text_easyocr = " ".join([r.text for r in easyocr_results])
            
            # Консенсус
            consensus = self.ocr_engine.compare_specific_values({
                "full_text": (text_paddle, text_easyocr)
            })
            
            has_conflict = consensus.conflict_count > 0
            consensus_text = text_paddle  # По умолчанию используем Paddle
            
        else:
            # Fallback без OCR
            text_paddle = ""
            text_easyocr = ""
            consensus_text = ""
            has_conflict = False
        
        return OCRPageResult(
            page_number=page_number,
            text_paddle=text_paddle,
            text_easyocr=text_easyocr,
            consensus_text=consensus_text,
            has_conflict=has_conflict,
            anchors=[]
        )
    
    async def process_batch_async(
        self,
        file_paths: List[str],
        on_progress: Optional[callable] = None
    ) -> Dict[str, List[OCRPageResult]]:
        """
        Асинхронная пакетная обработка.
        
        Returns:
            Dict: file_path -> List[OCRPageResult]
        """
        results = {}
        total = len(file_paths)
        
        for i, path in enumerate(file_paths):
            # Обработка в thread pool
            loop = asyncio.get_event_loop()
            page_results = await loop.run_in_executor(
                self.executor,
                self.process_document,
                path
            )
            
            results[path] = page_results
            
            if on_progress:
                on_progress(i + 1, total, path)
        
        return results
    
    def generate_page_summary(
        self,
        page_result: OCRPageResult,
        use_ai: bool = False
    ) -> str:
        """
        Генерировать краткое описание страницы.
        """
        text = page_result.consensus_text
        anchors = page_result.anchors
        
        if not text:
            return "Пустая страница"
        
        # Базовое резюме на основе якорей
        summary_parts = []
        
        anchor_types = set(a.name for a in anchors)
        
        if "case_number" in anchor_types:
            summary_parts.append("Судебный документ")
        if "civil_id" in anchor_types:
            summary_parts.append("Содержит Civil ID")
        if "amount_omr" in anchor_types or "basic_salary" in anchor_types:
            summary_parts.append("Финансовые данные")
        if "date_gregorian" in anchor_types:
            summary_parts.append("Содержит даты")
        
        if summary_parts:
            return ". ".join(summary_parts)
        
        # Ограниченное резюме из текста
        return text[:100] + "..." if len(text) > 100 else text


def test_pipeline():
    """Тест пайплайна"""
    print("=== Parallel OCR Pipeline Test ===\n")
    
    # Тест AnchorExtractor
    print("Test 1: Anchor Extraction")
    extractor = AnchorExtractor()
    
    test_text = """
    Case Number: 1409/2024
    Civil ID: 12345678
    Date: 2024/01/15
    Salary: 750.000 OMR
    IBAN: OM12BMCM1234567890123456
    Phone: +968 99887766
    """
    
    anchors = extractor.extract_all(test_text)
    print(f"  Found {len(anchors)} anchors:")
    for a in anchors:
        print(f"    - {a.name}: {a.value}")
    
    # Тест пайплайна (без реального OCR)
    print("\nTest 2: Pipeline Structure")
    pipeline = ParallelOCRPipeline()
    print(f"  OCR Available: {OCR_AVAILABLE}")
    print(f"  Privacy Available: {PRIVACY_AVAILABLE}")
    print(f"  Validation Available: {VALIDATION_AVAILABLE}")
    
    print("\n=== Tests Complete ===")


if __name__ == "__main__":
    test_pipeline()
