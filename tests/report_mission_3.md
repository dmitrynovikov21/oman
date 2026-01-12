# Mission 3: Intake R&D - Test Report

## ⚠️ Status: PARTIAL (Scripts Ready, Awaiting Python Environment)

**Date:** 2026-01-08

---

## Issue Encountered

Python/pip not available in current system environment. Benchmark scripts have been created and are ready for execution when Python is configured.

---

## Created Files

| File | Purpose |
|------|---------|
| `backend/requirements.txt` | Python dependencies for OCR |
| `backend/benchmark_ocr.py` | Full benchmark script |

---

## To Run Benchmark

```bash
# 1. Install Python 3.10+
# 2. Create virtual environment
cd expertos/backend
python -m venv venv
venv\Scripts\activate

# 3. Install dependencies
pip install pymupdf

# Optional: For full OCR benchmark
pip install paddlepaddle paddleocr

# 4. Run benchmark
python benchmark_ocr.py
```

---

## Expected Benchmark Results (Based on Research)

| Tool | Avg Time | Use Case |
|------|----------|----------|
| **PyMuPDF** | ~0.01s/page | Digital PDFs with embedded text |
| **PaddleOCR** | ~2-5s/page | Scanned documents, images |

### Recommended Strategy

```python
MIN_CHARS_THRESHOLD = 50

def extract_document_text(pdf_path: Path) -> str:
    # Try fast digital extraction first
    text = pymupdf_extract(pdf_path)
    
    # If low quality, fall back to OCR
    if len(text) < MIN_CHARS_THRESHOLD or not contains_arabic(text):
        text = paddleocr_extract(pdf_path)
    
    return text
```

---

## Test Files Available

| File | Size |
|------|------|
| أحمد سالم عبدالله البادي.pdf | 1.2 MB |
| دليل الموظفين الملف الكامل.pdf.zip | 564 KB |
| مذكرة رد على التعقيب (3).pdf | 19.8 MB |

---

## Ingest API Design (Ready for Implementation)

### `POST /api/v1/ingest/upload`
- Accepts multipart file upload
- Returns `{ case_id: uuid, status: "PROCESSING" }`
- Triggers async Celery task

### `GET /api/v1/cases/{id}/status`
- Returns OCR progress and extracted data

---

## Next Steps

1. User configures Python environment
2. Run `benchmark_ocr.py` on test files
3. Implement FastAPI `/ingest` endpoint
4. Connect to Celery for async processing
