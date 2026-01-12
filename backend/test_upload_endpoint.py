import requests
import json
import os
import time

BASE_URL = "http://localhost:3000/api"

def run_test():
    print("1. Creating Test Case...")
    ts = int(time.time())
    case_res = requests.post(f"{BASE_URL}/cases", json={
        "caseNumber": f"UPLOAD-TEST-{ts}",
        "year": 2024,
        "status": "TEST"
    })
    
    if case_res.status_code not in [200, 201]:
        print(f"[FAIL] Failed to create case: {case_res.text}")
        return
    
    case_data = case_res.json()
    case_id = case_data.get("case", {}).get("id")
    print(f"[OK] Case Created: {case_id}")

    print("2. Uploading File...")
    # Create a dummy pdf
    dummy_pdf_content = b"%PDF-1.5 test file content"
    files = {
        'file': ('test.pdf', dummy_pdf_content, 'application/pdf')
    }
    data = {
        'caseId': case_id,
        'type': 'EVIDENCE'
    }

    try:
        upload_res = requests.post(f"{BASE_URL}/documents", files=files, data=data)
        
        if upload_res.status_code in [200, 201]:
            print(f"[OK] Upload Success: {upload_res.json()}")
        else:
            print(f"[FAIL] Upload Failed: {upload_res.status_code}")
            print(upload_res.text)
            
    except Exception as e:
        print(f"[FAIL] Exception during upload: {e}")

if __name__ == "__main__":
    run_test()
