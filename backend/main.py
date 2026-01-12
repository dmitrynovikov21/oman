"""
ExpertOS FastAPI Backend
Document Ingestion and OCR Processing API
"""

import os
import uuid
import shutil
from pathlib import Path
from datetime import datetime
from typing import Optional, List

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Configuration
UPLOAD_DIR = Path("./data/uploads")
CASES_DIR = Path("./data/cases")
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

# Create directories
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
CASES_DIR.mkdir(parents=True, exist_ok=True)

# Initialize FastAPI app
app = FastAPI(
    title="ExpertOS API",
    description="Document Ingestion and OCR Processing API for Judicial Experts",
    version="1.0.0",
)

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============= Models =============

class CaseResponse(BaseModel):
    case_id: str
    status: str
    message: str
    files_received: int


class CaseStatusResponse(BaseModel):
    case_id: str
    status: str
    ocr_status: str
    files: List[dict]
    created_at: str
    metadata: Optional[dict] = None


class DocumentMetadata(BaseModel):
    case_number: Optional[str] = None
    court_name: Optional[str] = None
    plaintiff: Optional[str] = None
    defendant: Optional[str] = None


# ============= In-Memory Store (Replace with DB) =============

cases_store = {}


# ============= Background Tasks =============

def process_case_documents(case_id: str, file_paths: List[Path]):
    """
    Background task to process uploaded documents.
    This would normally trigger OCR via Celery.
    """
    case = cases_store.get(case_id)
    if not case:
        return
    
    case["ocr_status"] = "PROCESSING"
    
    # Simulate processing
    for file_path in file_paths:
        # In production: call PyMuPDF or PaddleOCR here
        case["files"].append({
            "filename": file_path.name,
            "path": str(file_path),
            "ocr_status": "DONE",
            "chars_extracted": 1500,  # Placeholder
        })
    
    case["ocr_status"] = "DONE"
    case["status"] = "READY"


# ============= API Endpoints =============

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "ExpertOS API",
        "status": "running",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }


@app.post("/api/v1/ingest/upload", response_model=CaseResponse)
async def upload_documents(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
):
    """
    Upload documents to create a new case.
    
    - Accepts multiple PDF/ZIP files
    - Creates a new case folder
    - Triggers background OCR processing
    - Returns immediately with case_id
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    
    # Generate unique case ID
    case_id = str(uuid.uuid4())
    case_folder = CASES_DIR / case_id / "source"
    case_folder.mkdir(parents=True, exist_ok=True)
    
    saved_files = []
    
    for file in files:
        # Validate file type
        if not file.filename:
            continue
            
        ext = Path(file.filename).suffix.lower()
        if ext not in [".pdf", ".zip", ".jpg", ".jpeg", ".png"]:
            continue
        
        # Check file size
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File {file.filename} exceeds 50MB limit"
            )
        
        # Save file
        file_path = case_folder / file.filename
        with open(file_path, "wb") as f:
            f.write(content)
        saved_files.append(file_path)
        
        # TODO: Handle ZIP extraction here
        if ext == ".zip":
            pass  # Extract and add to saved_files
    
    if not saved_files:
        raise HTTPException(status_code=400, detail="No valid files uploaded")
    
    # Store case info
    cases_store[case_id] = {
        "case_id": case_id,
        "status": "PROCESSING",
        "ocr_status": "PENDING",
        "files": [],
        "created_at": datetime.now().isoformat(),
        "metadata": None,
    }
    
    # Trigger background processing
    background_tasks.add_task(process_case_documents, case_id, saved_files)
    
    return CaseResponse(
        case_id=case_id,
        status="PROCESSING",
        message=f"Case created. {len(saved_files)} file(s) queued for OCR.",
        files_received=len(saved_files),
    )


@app.get("/api/v1/cases/{case_id}/status", response_model=CaseStatusResponse)
async def get_case_status(case_id: str):
    """
    Get the processing status of a case.
    
    Returns:
    - Current OCR status
    - List of processed files
    - Extracted metadata (when ready)
    """
    case = cases_store.get(case_id)
    
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    return CaseStatusResponse(
        case_id=case["case_id"],
        status=case["status"],
        ocr_status=case["ocr_status"],
        files=case["files"],
        created_at=case["created_at"],
        metadata=case.get("metadata"),
    )


@app.get("/api/v1/cases")
async def list_cases(limit: int = 10, offset: int = 0):
    """List all cases with pagination."""
    all_cases = list(cases_store.values())
    return {
        "total": len(all_cases),
        "limit": limit,
        "offset": offset,
        "cases": all_cases[offset:offset + limit],
    }


@app.delete("/api/v1/cases/{case_id}")
async def delete_case(case_id: str):
    """Delete a case and its files."""
    if case_id not in cases_store:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Delete folder
    case_folder = CASES_DIR / case_id
    if case_folder.exists():
        shutil.rmtree(case_folder)
    
    # Remove from store
    del cases_store[case_id]
    
    return {"message": f"Case {case_id} deleted"}


# ============= Run Server =============

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
