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

# Initialize ExpertOS Inference Pipeline
print("Loading ExpertOS Pipeline...")
try:
    from ocr_pipeline.inference import ExpertOSInference
    pipeline = ExpertOSInference(device="auto")
    print("ExpertOS Pipeline loaded!")
except ImportError as e:
    print(f"Failed to load pipeline: {e}")
    # Fallback to direct easyocr if pipeline missing (unlikely)
    import easyocr
    pipeline = None
    reader = easyocr.Reader(['ar', 'en'], gpu=False)

@app.get("/")
async def root():
    return {"status": "running", "service": "ExpertOS OCR API (Hybrid Logic)"}

@app.get("/health")
async def health():
    return {"status": "healthy", "ocr_ready": True}

@app.post("/ocr/pdf")
async def ocr_pdf(file: UploadFile = File(...)):
    """
    Extract text using ExpertOS Pipeline (Zoom-OCR)
    """
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Save uploaded file temporarily
    with tempfile.TemporaryDirectory() as temp_dir:
        pdf_path = os.path.join(temp_dir, file.filename)
        
        with open(pdf_path, "wb") as f:
            content = await file.read()
            f.write(content)
            
        if pipeline:
            # Use sophisticated pipeline
            try:
                result = pipeline.process_pdf(pdf_path)
                return {
                    "success": True,
                    "filename": file.filename,
                    "result": {
                        "full_text": "\n\n".join([p.normalized_text for p in result.pages]),
                        "metadata": result.validation,
                        "pages": [
                            {
                                "page": p.page_number,
                                "text": p.normalized_text
                            } for p in result.pages
                        ]
                    }
                }
            except Exception as e:
                print(f"Pipeline error: {e}")
                raise HTTPException(status_code=500, detail=str(e))
        else:
            # Fallback Legacy
            return {"error": "Pipeline not initialized"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
