#!/usr/bin/env python3
"""
EasyOCR Service for Arabic Documents
Runs as a microservice in Docker for high-quality OCR
"""
from flask import Flask, request, jsonify
import easyocr
import os
import tempfile
import base64

app = Flask(__name__)

# Initialize EasyOCR reader (Arabic + English)
print("Loading EasyOCR model...")
reader = easyocr.Reader(['ar', 'en'], gpu=False, verbose=False)
print("Model loaded!")

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "model": "easyocr-arabic"})

@app.route('/ocr', methods=['POST'])
def ocr():
    """
    OCR endpoint
    Accepts: 
    - file: multipart file upload
    - image_base64: base64 encoded image
    - image_path: path to image file
    """
    try:
        image_path = None
        temp_file = None
        
        # Handle different input types
        if 'file' in request.files:
            file = request.files['file']
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.png')
            file.save(temp_file.name)
            image_path = temp_file.name
            
        elif request.json and 'image_base64' in request.json:
            image_data = base64.b64decode(request.json['image_base64'])
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.png')
            temp_file.write(image_data)
            temp_file.close()
            image_path = temp_file.name
            
        elif request.json and 'image_path' in request.json:
            image_path = request.json['image_path']
            
        else:
            return jsonify({"error": "No image provided"}), 400
        
        # Run OCR
        result = reader.readtext(image_path, detail=1, paragraph=False)
        
        # Extract text and confidence
        lines = []
        full_text = ""
        total_confidence = 0
        
        for detection in result:
            bbox, text, confidence = detection
            lines.append({
                "text": text,
                "confidence": float(confidence),
                "bbox": [[int(p[0]), int(p[1])] for p in bbox]
            })
            full_text += text + "\n"
            total_confidence += confidence
        
        avg_confidence = total_confidence / len(result) if result else 0
        
        # Cleanup temp file
        if temp_file and os.path.exists(temp_file.name):
            os.unlink(temp_file.name)
        
        return jsonify({
            "success": True,
            "text": full_text.strip(),
            "lines": lines,
            "line_count": len(lines),
            "character_count": len(full_text),
            "average_confidence": float(avg_confidence)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
