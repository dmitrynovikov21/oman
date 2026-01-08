

### 📄 ФАЙЛ 4: `.specs/03_INTAKE_MODULE.md`

```markdown
# MODULE 2: INTELLIGENT INGESTION & OCR (v2.0 - STRICT)

## 1. OBJECTIVE
Implement the backend pipeline for ingesting "dirty" files (scans, ZIPs), processing them via PaddleOCR (Arabic), and extracting metadata to create a Case Draft.

## 2. TECH STACK & LIBRARIES (MANDATORY)
* **Framework:** FastAPI + Celery (Redis) for async processing.
* **File Handling:** `python-multipart`, `aiofiles`.
* **PDF/Image Processing:** `PyMuPDF` (fitz) for rendering PDF pages to images.
* **OCR Engine:** `paddlepaddle` + `paddleocr`.
    * **CRITICAL:** Must verify that Arabic (`ar`) and English (`en`) models are downloaded and loaded.
* **Testing:** `pytest`, `pytest-asyncio`, `httpx` (for API simulation).

## 3. DATABASE SCHEMA UPDATES
Update `models.py` (SQLAlchemy) to reflect these exact changes:

```sql
-- CASES TABLE UPDATES
ALTER TABLE cases ADD COLUMN folder_path VARCHAR(500); -- Path: /data/cases/{uuid}/
ALTER TABLE cases ADD COLUMN ocr_raw_text TEXT; -- Full raw text for debugging
ALTER TABLE cases ADD COLUMN parsing_confidence FLOAT; -- Confidence Score (0.0 - 1.0)

-- NEW DOCUMENTS TABLE
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    original_filename VARCHAR(255),
    file_path VARCHAR(500), -- Path to specific file
    file_type VARCHAR(50), -- 'application/pdf', 'image/jpeg'
    is_mandate BOOLEAN DEFAULT FALSE, -- Flag: Is this the Court Mandate letter?
    ocr_status VARCHAR(50) DEFAULT 'PENDING', -- 'PROCESSING', 'DONE', 'FAILED'
    created_at TIMESTAMP DEFAULT NOW()
);

```

## 4. BUSINESS LOGIC (THE PIPELINE)

### A. Ingest (API Level)

**Logic:**

1. Save incoming file(s) to a temporary buffer: `/tmp/ingest/{upload_id}/`.
2. **ZIP Handler:** If file is `.zip`, extract contents immediately.
3. **Move:** Transfer valid files to permanent storage: `/data/cases/{case_uuid}/source/`.
4. Create DB records in `cases` and `documents`.
5. Trigger Celery Task: `process_case_files.delay(case_id)`.

### B. OCR Task (Celery Worker)

**Logic:**

1. Identify the "Mandate Letter" (PDF or Image).
2. **Preprocessing:** If PDF -> Convert **first 3 pages** to high-res images (300 DPI) using PyMuPDF.
3. **Recognition:** Run `PaddleOCR(lang='ar')` on these images.
4. **Aggregation:** Concatenate all results into one string: `full_text`.
5. **Save:** Update `cases.ocr_raw_text`.

### C. Parsing Logic (Regex Extraction)

Implement specific Regex patterns to extract metadata from `full_text`:

1. **Case Number (Номер дела):**
* Pattern: Digits / Digits.
* Regex: `r"(\d{3,4})\s*[\/|\\]\s*(\d{4})"` (Example: 1409/2024).


2. **Court Name (Суд):**
* Look for lines starting with "المحكمة".
* Keywords: `["المحكمة الابتدائية", "الدائرة العمالية", "محكمة السيب"]`.


3. **Plaintiff (Истец):**
* Logic: Text found AFTER `["المدعي", "طالب التنفيذ"]` and BEFORE `["ضد"]`.


4. **Defendant (Ответчик):**
* Logic: Text found AFTER `["ضد", "المدعى عليها", "المدعى عليه"]`.



## 5. API ENDPOINTS (CONTRACT)

### `POST /api/v1/ingest/upload`

* **Body:** `Multipart/Form-Data` (files: List).
* **Response:** `{ "case_id": "uuid...", "status": "PROCESSING" }`.
* **Performance:** Must return immediately (non-blocking). Heavy lifting happens in Celery.

### `GET /api/v1/cases/{id}/status`

* **Logic:** Check DB status column.
* **Response:** `{ "status": "READY", "data": { "case_no": "1409/2024", ... } }`.


**TASK:**
1.  Load files from `./filesfortest1/`.
2.  Loop through every file (PDFs and extracted ZIP contents).
3.  **For every page of every file:**
    * Run `PyMuPDF` -> Log time & text preview.
    * Run `PaddleOCR` -> Log time & text preview.
4.  **OUTPUT REPORT:**
    Print a Markdown table to the console summarizing the quality:

    | File Name | Page | Tool | Time (s) | Chars Extracted | Contains "Mahkama"? |
    | :--- | :--- | :--- | :--- | :--- | :--- |
    | Ahmed.pdf | 1 | PyMuPDF | 0.01 | 1500 | ✅ |
    | Ahmed.pdf | 1 | Paddle | 2.50 | 1480 | ✅ |
    | Scan.pdf | 1 | PyMuPDF | 0.01 | 5 | ❌ (Garbage) |
    | Scan.pdf | 1 | Paddle | 3.10 | 800 | ✅ |

5.  **CONCLUSION:**
    Based on this report, the Agent must hardcode the best threshold strategy (e.g., "If digital text < 50 chars, force OCR").

**Do not submit the code until you show me this table generated from MY real files.**