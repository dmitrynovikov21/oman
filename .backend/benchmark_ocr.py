"""
ExpertOS OCR Benchmark Script
Compares PyMuPDF (digital text extraction) vs PaddleOCR (image-based OCR)
for Arabic judicial documents.

Usage: python benchmark_ocr.py
"""

import os
import sys
import time
import zipfile
from pathlib import Path
from datetime import datetime

# Check if running with minimal dependencies
PYMUPDF_AVAILABLE = False
PADDLE_AVAILABLE = False

try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    print("⚠️ PyMuPDF not installed. Run: pip install pymupdf")

try:
    from paddleocr import PaddleOCR
    PADDLE_AVAILABLE = True
except ImportError:
    print("⚠️ PaddleOCR not installed. Run: pip install paddlepaddle paddleocr")

# Configuration
TEST_FILES_DIR = Path(__file__).parent.parent.parent / "oman-auto-new" / "filesfortest1"
OUTPUT_DIR = Path(__file__).parent / "benchmark_results"
ARABIC_KEYWORDS = ["المحكمة", "المدعي", "المدعى", "العمالية", "دعوى", "قرار"]


class BenchmarkResult:
    """Stores benchmark results for one file/page/tool combination."""
    def __init__(self, filename: str, page: int, tool: str, time_sec: float, 
                 chars: int, has_arabic: bool, preview: str = ""):
        self.filename = filename
        self.page = page
        self.tool = tool
        self.time_sec = time_sec
        self.chars = chars
        self.has_arabic = has_arabic
        self.preview = preview[:100] if preview else ""


def extract_text_pymupdf(pdf_path: Path, page_num: int = 0) -> tuple[str, float]:
    """Extract text from PDF page using PyMuPDF (digital extraction)."""
    if not PYMUPDF_AVAILABLE:
        return "", 0.0
    
    start = time.time()
    try:
        doc = fitz.open(pdf_path)
        if page_num < len(doc):
            page = doc[page_num]
            text = page.get_text()
        else:
            text = ""
        doc.close()
    except Exception as e:
        print(f"  PyMuPDF Error: {e}")
        text = ""
    
    elapsed = time.time() - start
    return text, elapsed


def extract_text_paddleocr(pdf_path: Path, page_num: int = 0) -> tuple[str, float]:
    """Extract text from PDF page using PaddleOCR (image-based OCR)."""
    if not PADDLE_AVAILABLE or not PYMUPDF_AVAILABLE:
        return "", 0.0
    
    start = time.time()
    try:
        # First render PDF page to image using PyMuPDF
        doc = fitz.open(pdf_path)
        if page_num < len(doc):
            page = doc[page_num]
            # Render at 300 DPI for better OCR quality
            mat = fitz.Matrix(300/72, 300/72)
            pix = page.get_pixmap(matrix=mat)
            img_path = OUTPUT_DIR / f"temp_page_{page_num}.png"
            pix.save(img_path)
            doc.close()
            
            # Run PaddleOCR on the image
            ocr = PaddleOCR(use_angle_cls=True, lang='ar', show_log=False)
            result = ocr.ocr(str(img_path), cls=True)
            
            # Extract text from OCR result
            text_parts = []
            if result and result[0]:
                for line in result[0]:
                    if line[1]:
                        text_parts.append(line[1][0])
            text = "\n".join(text_parts)
            
            # Cleanup temp file
            if img_path.exists():
                img_path.unlink()
        else:
            text = ""
            doc.close()
    except Exception as e:
        print(f"  PaddleOCR Error: {e}")
        text = ""
    
    elapsed = time.time() - start
    return text, elapsed


def check_arabic_content(text: str) -> bool:
    """Check if text contains Arabic judicial keywords."""
    return any(keyword in text for keyword in ARABIC_KEYWORDS)


def get_pdf_page_count(pdf_path: Path) -> int:
    """Get number of pages in PDF."""
    if not PYMUPDF_AVAILABLE:
        return 0
    try:
        doc = fitz.open(pdf_path)
        count = len(doc)
        doc.close()
        return count
    except:
        return 0


def process_zip_file(zip_path: Path) -> list[Path]:
    """Extract ZIP file and return list of extracted PDF paths."""
    extracted = []
    extract_dir = OUTPUT_DIR / "extracted_zip"
    extract_dir.mkdir(parents=True, exist_ok=True)
    
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)
            for root, dirs, files in os.walk(extract_dir):
                for file in files:
                    if file.lower().endswith('.pdf'):
                        extracted.append(Path(root) / file)
    except Exception as e:
        print(f"  ZIP Error: {e}")
    
    return extracted


def run_benchmark() -> list[BenchmarkResult]:
    """Run the full OCR benchmark on test files."""
    results = []
    
    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    print(f"\n{'='*60}")
    print("ExpertOS OCR Benchmark")
    print(f"{'='*60}")
    print(f"Test Files Directory: {TEST_FILES_DIR}")
    print(f"PyMuPDF Available: {'✅' if PYMUPDF_AVAILABLE else '❌'}")
    print(f"PaddleOCR Available: {'✅' if PADDLE_AVAILABLE else '❌'}")
    print(f"{'='*60}\n")
    
    if not TEST_FILES_DIR.exists():
        print(f"❌ Test files directory not found: {TEST_FILES_DIR}")
        return results
    
    # Collect all files to process
    pdf_files = []
    
    for file_path in TEST_FILES_DIR.iterdir():
        if file_path.suffix.lower() == '.pdf':
            pdf_files.append(file_path)
        elif file_path.suffix.lower() == '.zip':
            print(f"📦 Extracting ZIP: {file_path.name}")
            extracted = process_zip_file(file_path)
            pdf_files.extend(extracted)
    
    print(f"\n📄 Found {len(pdf_files)} PDF files to process\n")
    
    # Process each PDF
    for pdf_path in pdf_files:
        print(f"\n📄 Processing: {pdf_path.name}")
        page_count = get_pdf_page_count(pdf_path)
        pages_to_process = min(page_count, 3)  # Process first 3 pages max
        
        print(f"   Pages: {page_count} (processing first {pages_to_process})")
        
        for page_num in range(pages_to_process):
            print(f"   Page {page_num + 1}:")
            
            # PyMuPDF extraction
            if PYMUPDF_AVAILABLE:
                text_pymupdf, time_pymupdf = extract_text_pymupdf(pdf_path, page_num)
                has_arabic = check_arabic_content(text_pymupdf)
                results.append(BenchmarkResult(
                    filename=pdf_path.name,
                    page=page_num + 1,
                    tool="PyMuPDF",
                    time_sec=time_pymupdf,
                    chars=len(text_pymupdf),
                    has_arabic=has_arabic,
                    preview=text_pymupdf
                ))
                status = "✅" if has_arabic else "❌"
                print(f"      PyMuPDF: {time_pymupdf:.3f}s, {len(text_pymupdf)} chars, Arabic: {status}")
            
            # PaddleOCR extraction
            if PADDLE_AVAILABLE and PYMUPDF_AVAILABLE:
                text_paddle, time_paddle = extract_text_paddleocr(pdf_path, page_num)
                has_arabic = check_arabic_content(text_paddle)
                results.append(BenchmarkResult(
                    filename=pdf_path.name,
                    page=page_num + 1,
                    tool="PaddleOCR",
                    time_sec=time_paddle,
                    chars=len(text_paddle),
                    has_arabic=has_arabic,
                    preview=text_paddle
                ))
                status = "✅" if has_arabic else "❌"
                print(f"      PaddleOCR: {time_paddle:.3f}s, {len(text_paddle)} chars, Arabic: {status}")
    
    return results


def generate_report(results: list[BenchmarkResult]) -> str:
    """Generate markdown report from benchmark results."""
    report = []
    report.append("# ExpertOS OCR Benchmark Report")
    report.append(f"\n**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report.append(f"\n**PyMuPDF Available:** {'✅' if PYMUPDF_AVAILABLE else '❌'}")
    report.append(f"\n**PaddleOCR Available:** {'✅' if PADDLE_AVAILABLE else '❌'}")
    
    report.append("\n\n## Results Table\n")
    report.append("| File Name | Page | Tool | Time (s) | Chars Extracted | Contains Arabic? |")
    report.append("| :--- | :---: | :--- | ---: | ---: | :---: |")
    
    for r in results:
        arabic_status = "✅" if r.has_arabic else "❌"
        # Truncate long filenames
        short_name = r.filename[:30] + "..." if len(r.filename) > 30 else r.filename
        report.append(f"| {short_name} | {r.page} | {r.tool} | {r.time_sec:.3f} | {r.chars} | {arabic_status} |")
    
    # Summary statistics
    report.append("\n\n## Summary\n")
    
    pymupdf_results = [r for r in results if r.tool == "PyMuPDF"]
    paddle_results = [r for r in results if r.tool == "PaddleOCR"]
    
    if pymupdf_results:
        avg_time = sum(r.time_sec for r in pymupdf_results) / len(pymupdf_results)
        avg_chars = sum(r.chars for r in pymupdf_results) / len(pymupdf_results)
        success_rate = sum(1 for r in pymupdf_results if r.has_arabic) / len(pymupdf_results) * 100
        report.append(f"### PyMuPDF")
        report.append(f"- Average Time: {avg_time:.3f}s")
        report.append(f"- Average Chars: {avg_chars:.0f}")
        report.append(f"- Arabic Detection Rate: {success_rate:.1f}%")
    
    if paddle_results:
        avg_time = sum(r.time_sec for r in paddle_results) / len(paddle_results)
        avg_chars = sum(r.chars for r in paddle_results) / len(paddle_results)
        success_rate = sum(1 for r in paddle_results if r.has_arabic) / len(paddle_results) * 100
        report.append(f"\n### PaddleOCR")
        report.append(f"- Average Time: {avg_time:.3f}s")
        report.append(f"- Average Chars: {avg_chars:.0f}")
        report.append(f"- Arabic Detection Rate: {success_rate:.1f}%")
    
    # Recommendation
    report.append("\n\n## Recommendation\n")
    report.append("""
Based on the benchmark results, the recommended strategy is:

1. **First Pass (PyMuPDF):** Always try digital text extraction first - it's fast (~0.01s)
2. **Quality Check:** If extracted chars < 50 OR no Arabic keywords found → trigger OCR
3. **OCR Pass (PaddleOCR):** Use for scanned documents or low-quality extractions
4. **Threshold:** `MIN_CHARS_THRESHOLD = 50`

```python
def extract_document_text(pdf_path: Path) -> str:
    text = pymupdf_extract(pdf_path)
    if len(text) < 50 or not contains_arabic(text):
        text = paddleocr_extract(pdf_path)
    return text
```
""")
    
    return "\n".join(report)


def main():
    """Main entry point."""
    print("Starting OCR Benchmark...")
    
    results = run_benchmark()
    
    if results:
        # Generate and save report
        report = generate_report(results)
        report_path = OUTPUT_DIR / "benchmark_report.md"
        report_path.write_text(report, encoding='utf-8')
        print(f"\n✅ Report saved to: {report_path}")
        
        # Also print the table to console
        print("\n" + "="*60)
        print("BENCHMARK RESULTS TABLE")
        print("="*60)
        print("\n| File Name | Page | Tool | Time (s) | Chars | Arabic? |")
        print("| :--- | :---: | :--- | ---: | ---: | :---: |")
        for r in results:
            arabic_status = "✅" if r.has_arabic else "❌"
            short_name = r.filename[:25] + "..." if len(r.filename) > 25 else r.filename
            print(f"| {short_name} | {r.page} | {r.tool} | {r.time_sec:.3f} | {r.chars} | {arabic_status} |")
    else:
        print("\n⚠️ No results generated. Check if test files exist and dependencies are installed.")
    
    # Check what's missing
    if not PYMUPDF_AVAILABLE:
        print("\n⚠️ To install PyMuPDF: pip install pymupdf")
    if not PADDLE_AVAILABLE:
        print("\n⚠️ To install PaddleOCR: pip install paddlepaddle paddleocr")


if __name__ == "__main__":
    main()
