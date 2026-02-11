#!/usr/bin/env python3
"""
OpenCV Preprocessing for Arabic OCR
Improves OCR accuracy through image enhancement
"""

import cv2
import numpy as np
from pathlib import Path
from typing import Tuple, Optional
import subprocess
import tempfile
import os


def pdf_to_images(pdf_path: str, dpi: int = 600) -> list:
    """Convert PDF to high-resolution images using pdftoppm"""
    images = []
    with tempfile.TemporaryDirectory() as tmp_dir:
        # Use pdftoppm for conversion
        base_name = os.path.join(tmp_dir, "page")
        subprocess.run([
            "pdftoppm", "-png", "-r", str(dpi), pdf_path, base_name
        ], check=True, capture_output=True)
        
        # Load all generated images
        for img_file in sorted(Path(tmp_dir).glob("page-*.png")):
            img = cv2.imread(str(img_file))
            if img is not None:
                images.append(img)
    
    return images


def deskew_image(image: np.ndarray, max_angle: float = 10.0) -> np.ndarray:
    """
    Correct document skew/rotation
    Uses Hough transform to detect text line angles
    """
    # Convert to grayscale
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image.copy()
    
    # Edge detection
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
    
    # Detect lines using Hough transform
    lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=100,
                            minLineLength=100, maxLineGap=10)
    
    if lines is None:
        return image
    
    # Calculate average angle
    angles = []
    for line in lines:
        x1, y1, x2, y2 = line[0]
        angle = np.degrees(np.arctan2(y2 - y1, x2 - x1))
        if abs(angle) < max_angle:  # Only consider small angles
            angles.append(angle)
    
    if not angles:
        return image
    
    avg_angle = np.median(angles)
    
    # Rotate image to correct skew
    (h, w) = image.shape[:2]
    center = (w // 2, h // 2)
    rotation_matrix = cv2.getRotationMatrix2D(center, avg_angle, 1.0)
    
    # Calculate new image size to avoid cropping
    cos = np.abs(rotation_matrix[0, 0])
    sin = np.abs(rotation_matrix[0, 1])
    new_w = int((h * sin) + (w * cos))
    new_h = int((h * cos) + (w * sin))
    
    rotation_matrix[0, 2] += (new_w / 2) - center[0]
    rotation_matrix[1, 2] += (new_h / 2) - center[1]
    
    return cv2.warpAffine(image, rotation_matrix, (new_w, new_h),
                          flags=cv2.INTER_CUBIC, 
                          borderMode=cv2.BORDER_REPLICATE)


def denoise_image(image: np.ndarray, strength: int = 10) -> np.ndarray:
    """
    Remove noise while preserving text edges
    Uses Non-local Means Denoising
    """
    if len(image.shape) == 3:
        return cv2.fastNlMeansDenoisingColored(image, None, strength, strength, 7, 21)
    else:
        return cv2.fastNlMeansDenoising(image, None, strength, 7, 21)


def enhance_contrast(image: np.ndarray, clip_limit: float = 2.0, 
                     tile_size: int = 8) -> np.ndarray:
    """
    Enhance local contrast using CLAHE
    (Contrast Limited Adaptive Histogram Equalization)
    """
    if len(image.shape) == 3:
        # Convert to LAB color space
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        
        # Apply CLAHE to L channel
        clahe = cv2.createCLAHE(clipLimit=clip_limit, 
                                 tileGridSize=(tile_size, tile_size))
        l = clahe.apply(l)
        
        # Merge and convert back
        lab = cv2.merge([l, a, b])
        return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
    else:
        clahe = cv2.createCLAHE(clipLimit=clip_limit,
                                 tileGridSize=(tile_size, tile_size))
        return clahe.apply(image)


def adaptive_binarize(image: np.ndarray, 
                      block_size: int = 11, 
                      c: int = 2) -> np.ndarray:
    """
    Adaptive binarization for uneven lighting
    Works well for scanned documents
    """
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image
    
    # Apply adaptive thresholding
    binary = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        block_size, c
    )
    
    return binary


def remove_small_noise(image: np.ndarray, min_area: int = 50) -> np.ndarray:
    """
    Remove small noise blobs using morphological operations
    """
    # Ensure binary image
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        _, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
    else:
        binary = image.copy()
    
    # Find connected components
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(
        255 - binary, connectivity=8
    )
    
    # Create mask for large components only
    mask = np.zeros_like(binary)
    for i in range(1, num_labels):  # Skip background
        if stats[i, cv2.CC_STAT_AREA] >= min_area:
            mask[labels == i] = 255
    
    return 255 - mask


def preprocess_for_ocr(image: np.ndarray, 
                       do_deskew: bool = True,
                       do_denoise: bool = True,
                       do_contrast: bool = True,
                       do_binarize: bool = True) -> np.ndarray:
    """
    Complete preprocessing pipeline for OCR
    """
    result = image.copy()
    
    # Step 1: Deskew
    if do_deskew:
        result = deskew_image(result)
    
    # Step 2: Denoise
    if do_denoise:
        result = denoise_image(result, strength=10)
    
    # Step 3: Enhance contrast
    if do_contrast:
        result = enhance_contrast(result, clip_limit=2.5)
    
    # Step 4: Binarize
    if do_binarize:
        result = adaptive_binarize(result, block_size=15, c=5)
        result = remove_small_noise(result, min_area=30)
    
    return result


def preprocess_pdf_for_ocr(pdf_path: str, dpi: int = 600) -> list:
    """
    Complete PDF preprocessing pipeline
    Returns list of preprocessed images ready for OCR
    """
    # Convert PDF to images
    images = pdf_to_images(pdf_path, dpi)
    
    # Preprocess each page
    processed = []
    for img in images:
        processed_img = preprocess_for_ocr(img)
        processed.append(processed_img)
    
    return processed


if __name__ == "__main__":
    # Test preprocessing
    import sys
    if len(sys.argv) > 1:
        pdf_path = sys.argv[1]
        print(f"Processing: {pdf_path}")
        
        images = preprocess_pdf_for_ocr(pdf_path)
        print(f"Processed {len(images)} pages")
        
        # Save first page for inspection
        if images:
            cv2.imwrite("preprocessed_page_1.png", images[0])
            print("Saved: preprocessed_page_1.png")
