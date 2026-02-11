#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ExpertOS - PDF Text Extraction Test
Тестирование извлечения текста из арабского PDF
"""
import fitz  # PyMuPDF
import sys
import io
from pathlib import Path

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def extract_text_from_pdf(pdf_path: str) -> dict:
    """Извлекает текст из PDF используя PyMuPDF"""
    doc = fitz.open(pdf_path)
    
    result = {
        "file": Path(pdf_path).name,
        "pages": len(doc),
        "text_by_page": [],
        "full_text": ""
    }
    
    full_text = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()
        result["text_by_page"].append({
            "page": page_num + 1,
            "chars": len(text),
            "preview": text[:500] if text else "[NO TEXT]"
        })
        full_text.append(text)
    
    result["full_text"] = "\n".join(full_text)
    result["total_chars"] = len(result["full_text"])
    
    doc.close()
    return result

def save_result_to_file(result: dict, output_path: str):
    """Сохраняет результат в файл"""
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(f"File: {result['file']}\n")
        f.write(f"Pages: {result['pages']}\n")
        f.write(f"Total characters: {result['total_chars']}\n")
        f.write(f"\n{'='*60}\n")
        f.write("EXTRACTED TEXT:\n")
        f.write(f"{'='*60}\n\n")
        f.write(result['full_text'])

if __name__ == "__main__":
    # Тестовые PDF файлы
    test_files = [
        r"c:\gravity\gravity\oman-auto-new\filesfortest1\أحمد سالم عبدالله البادي.pdf",
    ]
    
    for pdf_path in test_files:
        if Path(pdf_path).exists():
            print("Processing PDF...")
            result = extract_text_from_pdf(pdf_path)
            
            # Сохраняем в файл (UTF-8)
            output_file = "extracted_text_output.txt"
            save_result_to_file(result, output_file)
            
            print(f"SUCCESS!")
            print(f"Pages: {result['pages']}")
            print(f"Total characters extracted: {result['total_chars']}")
            print(f"Output saved to: {output_file}")
            
            # Показываем статус
            if result['total_chars'] > 100:
                print("TEXT WAS EXTRACTED SUCCESSFULLY!")
            else:
                print("WARNING: Very little text extracted (may be scanned image)")
        else:
            print(f"File not found: {pdf_path}")
