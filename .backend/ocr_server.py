#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ExpertOS OCR API - FastAPI Server
Арабский OCR для юридических документов
"""
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import easyocr
import fitz  # PyMuPDF
import tempfile
import os
from pathlib import Path
import uvicorn

app = FastAPI(
    title="ExpertOS OCR API",
    description="Arabic OCR for legal documents",
    version="1.0.0"
)

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize EasyOCR reader (Arabic + English)
print("Loading OCR models...")
reader = easyocr.Reader(['ar', 'en'], gpu=False)
print("OCR models loaded!")

def pdf_to_images(pdf_path: str, output_dir: str) -> list:
    """Convert PDF pages to images"""
    doc = fitz.open(pdf_path)
    image_paths = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        mat = fitz.Matrix(2, 2)  # 2x resolution for better OCR
        pix = page.get_pixmap(matrix=mat)
        image_path = os.path.join(output_dir, f"page_{page_num + 1}.png")
        pix.save(image_path)
        image_paths.append(image_path)
    
    doc.close()
    return image_paths

def ocr_images(image_paths: list) -> dict:
    """Run OCR on images"""
    pages = []
    
    for i, img_path in enumerate(image_paths):
        result = reader.readtext(img_path, detail=0, paragraph=True)
        page_text = "\n".join(result) if result else ""
        pages.append({
            "page": i + 1,
            "text": page_text,
            "chars": len(page_text)
        })
    
    full_text = "\n\n".join([p["text"] for p in pages])
    
    return {
        "pages": pages,
        "full_text": full_text,
        "total_chars": len(full_text),
        "page_count": len(pages)
    }

@app.get("/")
async def root():
    return {"status": "running", "service": "ExpertOS OCR API"}

@app.get("/health")
async def health():
    return {"status": "healthy", "ocr_ready": True}

@app.post("/ocr/pdf")
async def ocr_pdf(file: UploadFile = File(...)):
    """
    Extract text from PDF using OCR
    Supports Arabic and English text
    """
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Save uploaded file temporarily
    with tempfile.TemporaryDirectory() as temp_dir:
        pdf_path = os.path.join(temp_dir, file.filename)
        
        with open(pdf_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Convert PDF to images
        image_paths = pdf_to_images(pdf_path, temp_dir)
        
        # Run OCR
        result = ocr_images(image_paths)
        
        return {
            "success": True,
            "filename": file.filename,
            "result": result
        }

@app.post("/ocr/image")
async def ocr_image(file: UploadFile = File(...)):
    """
    Extract text from image using OCR
    """
    allowed_extensions = ['.png', '.jpg', '.jpeg', '.bmp', '.tiff']
    ext = Path(file.filename).suffix.lower()
    
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"Supported formats: {allowed_extensions}")
    
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_path = temp_file.name
    
    try:
        result = reader.readtext(temp_path, detail=0, paragraph=True)
        text = "\n".join(result) if result else ""
        
        return {
            "success": True,
            "filename": file.filename,
            "text": text,
            "chars": len(text)
        }
    finally:
        os.unlink(temp_path)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
