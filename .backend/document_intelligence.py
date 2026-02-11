"""
Mission 15: Document Intelligence Hub
Пакетная обработка, авто-классификация и Truth Engine

Компоненты:
1. DocumentClassifier - AI-классификация документов
2. PageAnalyzer - постраничный анализ
3. TruthEngine - детектор противоречий
4. BatchProcessor - пакетная обработка
"""

import re
import json
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from enum import Enum


class DocumentCategory(str, Enum):
    """Категории документов"""
    COURT = "COURT"                         # Судебные документы
    PLAINTIFF_EVIDENCE = "PLAINTIFF_EVIDENCE"  # Доказательства истца
    DEFENDANT_EVIDENCE = "DEFENDANT_EVIDENCE"  # Доказательства ответчика
    FINANCIAL = "FINANCIAL"                 # Финансовые документы
    EXPERT_WORK = "EXPERT_WORK"             # Работа эксперта
    CONTRACT = "CONTRACT"                   # Договоры
    OTHER = "OTHER"                         # Прочее


class ConflictStatus(str, Enum):
    """Статус конфликта данных"""
    NONE = "NONE"           # Нет конфликта
    MINOR = "MINOR"         # Незначительное расхождение
    MAJOR = "MAJOR"         # Серьезный конфликт
    UNVERIFIED = "UNVERIFIED"  # Не проверено


@dataclass
class ExtractedMetric:
    """Извлеченная метрика из документа"""
    field_name: str           # Название поля (date, amount, name, etc)
    value: str                # Извлеченное значение
    source: str               # Источник: "ocr", "ai", "human"
    confidence: float = 1.0   # Уверенность (0-1)
    page_number: int = 1      # Номер страницы
    bbox: Optional[Tuple[int, int, int, int]] = None  # Координаты


@dataclass
class PageMetadata:
    """Метаданные одной страницы документа"""
    page_number: int
    metrics: List[ExtractedMetric] = field(default_factory=list)
    ai_summary: str = ""
    ai_summary_masked: str = ""  # Privacy Mirror версия
    has_conflict: bool = False
    conflict_details: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        return {
            "page_number": self.page_number,
            "metrics": [
                {
                    "field": m.field_name,
                    "value": m.value,
                    "source": m.source,
                    "confidence": m.confidence
                }
                for m in self.metrics
            ],
            "ai_summary": self.ai_summary,
            "has_conflict": self.has_conflict,
            "conflict_details": self.conflict_details
        }


@dataclass
class DocumentIntelligence:
    """Полный интеллект документа"""
    document_id: str
    filename: str
    category: DocumentCategory = DocumentCategory.OTHER
    total_pages: int = 0
    pages: List[PageMetadata] = field(default_factory=list)
    overall_summary: str = ""
    conflicts: List[Dict] = field(default_factory=list)
    processing_status: str = "pending"  # pending, processing, done, error
    
    def to_dict(self) -> Dict:
        return {
            "document_id": self.document_id,
            "filename": self.filename,
            "category": self.category.value,
            "total_pages": self.total_pages,
            "pages": [p.to_dict() for p in self.pages],
            "overall_summary": self.overall_summary,
            "conflicts_count": len(self.conflicts),
            "conflicts": self.conflicts,
            "status": self.processing_status
        }


class DocumentClassifier:
    """
    AI-классификатор документов по категориям.
    Использует ключевые слова и паттерны.
    """
    
    # Ключевые слова для классификации (арабский + английский)
    CATEGORY_KEYWORDS = {
        DocumentCategory.COURT: [
            "محكمة", "قاضي", "حكم", "دعوى", "جلسة",
            "court", "judge", "verdict", "case", "hearing"
        ],
        DocumentCategory.PLAINTIFF_EVIDENCE: [
            "المدعي", "مستند", "إثبات", "شهادة",
            "plaintiff", "evidence", "proof", "witness"
        ],
        DocumentCategory.DEFENDANT_EVIDENCE: [
            "المدعى عليه", "رد", "دفاع",
            "defendant", "response", "defense"
        ],
        DocumentCategory.FINANCIAL: [
            "راتب", "حساب", "بنك", "مالي", "دفع", "ريال",
            "salary", "bank", "financial", "payment", "OMR"
        ],
        DocumentCategory.EXPERT_WORK: [
            "خبير", "تقرير الخبير", "محاسب",
            "expert", "report", "accountant"
        ],
        DocumentCategory.CONTRACT: [
            "عقد", "اتفاقية", "توظيف", "عمل",
            "contract", "agreement", "employment"
        ]
    }
    
    def classify(self, text: str) -> Tuple[DocumentCategory, float]:
        """
        Классифицировать документ по тексту.
        
        Returns:
            Tuple[category, confidence]
        """
        text_lower = text.lower()
        scores: Dict[DocumentCategory, int] = {}
        
        for category, keywords in self.CATEGORY_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            if score > 0:
                scores[category] = score
        
        if not scores:
            return DocumentCategory.OTHER, 0.5
        
        best_category = max(scores, key=scores.get)
        confidence = min(scores[best_category] / 5, 1.0)  # Normalize
        
        return best_category, confidence


class TruthEngine:
    """
    Детектор противоречий.
    Сравнивает данные из OCR, AI и ручного ввода.
    """
    
    # Допустимые отклонения
    DATE_TOLERANCE_DAYS = 1
    AMOUNT_TOLERANCE_PERCENT = 0.01  # 1%
    
    def __init__(self):
        self.conflicts: List[Dict] = []
    
    def compare_values(
        self,
        field_name: str,
        ocr_value: str,
        ai_value: Optional[str] = None,
        human_value: Optional[str] = None
    ) -> ConflictStatus:
        """
        Сравнить три источника данных.
        
        Returns:
            ConflictStatus и детали конфликта
        """
        values = {
            "ocr": ocr_value,
            "ai": ai_value,
            "human": human_value
        }
        
        # Убрать пустые
        values = {k: v for k, v in values.items() if v}
        
        if len(values) < 2:
            return ConflictStatus.UNVERIFIED
        
        # Проверка по типу поля
        if field_name in ["date", "start_date", "end_date"]:
            return self._compare_dates(values)
        elif field_name in ["amount", "salary", "fee", "eosb"]:
            return self._compare_amounts(values)
        else:
            return self._compare_strings(values)
    
    def _compare_dates(self, values: Dict[str, str]) -> ConflictStatus:
        """Сравнить даты с допуском"""
        try:
            from datetime import datetime
            
            parsed = {}
            for source, val in values.items():
                # Попробовать разные форматы
                for fmt in ["%Y/%m/%d", "%Y-%m-%d", "%d/%m/%Y"]:
                    try:
                        parsed[source] = datetime.strptime(val, fmt)
                        break
                    except ValueError:
                        continue
            
            if len(parsed) < 2:
                return ConflictStatus.UNVERIFIED
            
            dates = list(parsed.values())
            max_diff = max(abs((d1 - d2).days) for d1 in dates for d2 in dates)
            
            if max_diff <= self.DATE_TOLERANCE_DAYS:
                return ConflictStatus.NONE
            elif max_diff <= 7:
                return ConflictStatus.MINOR
            else:
                return ConflictStatus.MAJOR
                
        except Exception:
            return ConflictStatus.UNVERIFIED
    
    def _compare_amounts(self, values: Dict[str, str]) -> ConflictStatus:
        """Сравнить денежные суммы"""
        try:
            amounts = {}
            for source, val in values.items():
                # Убрать нечисловые символы
                clean = re.sub(r'[^\d.,]', '', val)
                clean = clean.replace(',', '')
                if clean:
                    amounts[source] = float(clean)
            
            if len(amounts) < 2:
                return ConflictStatus.UNVERIFIED
            
            values_list = list(amounts.values())
            avg = sum(values_list) / len(values_list)
            max_deviation = max(abs(v - avg) / avg for v in values_list) if avg > 0 else 0
            
            if max_deviation <= self.AMOUNT_TOLERANCE_PERCENT:
                return ConflictStatus.NONE
            elif max_deviation <= 0.05:  # 5%
                return ConflictStatus.MINOR
            else:
                return ConflictStatus.MAJOR
                
        except Exception:
            return ConflictStatus.UNVERIFIED
    
    def _compare_strings(self, values: Dict[str, str]) -> ConflictStatus:
        """Сравнить строки"""
        normalized = [v.strip().lower() for v in values.values()]
        
        if len(set(normalized)) == 1:
            return ConflictStatus.NONE
        
        # Проверить частичное совпадение
        first = normalized[0]
        if all(first in v or v in first for v in normalized):
            return ConflictStatus.MINOR
        
        return ConflictStatus.MAJOR
    
    def triangulate(
        self,
        metrics: List[ExtractedMetric]
    ) -> List[Dict]:
        """
        Триангуляция: сравнить все метрики по полям.
        
        Returns:
            Список конфликтов
        """
        conflicts = []
        
        # Группировать по полю
        by_field: Dict[str, Dict[str, str]] = {}
        for m in metrics:
            if m.field_name not in by_field:
                by_field[m.field_name] = {}
            by_field[m.field_name][m.source] = m.value
        
        # Сравнить каждое поле
        for field_name, sources in by_field.items():
            status = self.compare_values(
                field_name,
                ocr_value=sources.get("ocr", ""),
                ai_value=sources.get("ai"),
                human_value=sources.get("human")
            )
            
            if status in [ConflictStatus.MINOR, ConflictStatus.MAJOR]:
                conflicts.append({
                    "field": field_name,
                    "status": status.value,
                    "sources": sources
                })
        
        return conflicts


class BatchProcessor:
    """
    Пакетный процессор документов.
    Обрабатывает папки файлов параллельно.
    """
    
    def __init__(self):
        self.classifier = DocumentClassifier()
        self.truth_engine = TruthEngine()
    
    def process_batch(
        self,
        file_paths: List[str],
        case_id: str
    ) -> List[DocumentIntelligence]:
        """
        Обработать пакет файлов.
        
        Returns:
            Список DocumentIntelligence для каждого файла
        """
        results = []
        
        for path in file_paths:
            doc = self._process_single(path, case_id)
            results.append(doc)
        
        return results
    
    def _process_single(
        self,
        file_path: str,
        case_id: str
    ) -> DocumentIntelligence:
        """Обработать один файл"""
        path = Path(file_path)
        
        doc = DocumentIntelligence(
            document_id=f"{case_id}_{path.stem}",
            filename=path.name,
            processing_status="processing"
        )
        
        try:
            # TODO: Реальный OCR через ocr_consensus.py
            # Пока заглушка для структуры
            
            # Классифицировать
            sample_text = path.stem  # В реальности - OCR текст
            category, confidence = self.classifier.classify(sample_text)
            doc.category = category
            
            doc.processing_status = "done"
            
        except Exception as e:
            doc.processing_status = "error"
            print(f"Error processing {path}: {e}")
        
        return doc


def test_intelligence():
    """Тест Document Intelligence"""
    print("=== Document Intelligence Hub Test ===\n")
    
    # Тест 1: Классификатор
    print("Test 1: Document Classifier")
    classifier = DocumentClassifier()
    
    tests = [
        ("محكمة الابتدائية - قرار", DocumentCategory.COURT),
        ("عقد توظيف شركة", DocumentCategory.CONTRACT),
        ("كشف راتب بنك مسقط", DocumentCategory.FINANCIAL),
        ("تقرير الخبير المحاسبي", DocumentCategory.EXPERT_WORK),
    ]
    
    for text, expected in tests:
        category, conf = classifier.classify(text)
        status = "OK" if category == expected else "FAIL"
        print(f"  [{status}] '{text[:20]}...' -> {category.value} ({conf:.0%})")
    
    # Тест 2: Truth Engine
    print("\nTest 2: Truth Engine")
    engine = TruthEngine()
    
    # Тест дат
    result = engine.compare_values(
        "date",
        ocr_value="2024/01/15",
        ai_value="2024/01/15",
        human_value="2024/01/16"
    )
    print(f"  Date conflict: {result.value}")
    
    # Тест сумм
    result = engine.compare_values(
        "salary",
        ocr_value="750.000",
        ai_value="750",
        human_value="751"
    )
    print(f"  Amount conflict: {result.value}")
    
    # Тест триангуляции
    print("\nTest 3: Triangulation")
    metrics = [
        ExtractedMetric("salary", "750.000", "ocr"),
        ExtractedMetric("salary", "750", "ai"),
        ExtractedMetric("salary", "800", "human"),  # Конфликт!
        ExtractedMetric("date", "2024/01/15", "ocr"),
        ExtractedMetric("date", "2024/01/15", "ai"),
    ]
    
    conflicts = engine.triangulate(metrics)
    print(f"  Found {len(conflicts)} conflict(s):")
    for c in conflicts:
        print(f"    - {c['field']}: {c['status']}")
    
    print("\n=== All Tests Complete ===")


if __name__ == "__main__":
    test_intelligence()
