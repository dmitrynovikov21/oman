#!/usr/bin/env python3
"""
ExpertOS OCR Pipeline - CLI Runner

Usage:
    python run_pipeline.py --pdf path/to/document.pdf
    python run_pipeline.py --pdf document.pdf --output ./results
    python run_pipeline.py --check-gpu
"""

import argparse
import logging
import sys
import json
from pathlib import Path

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s'
)
logger = logging.getLogger(__name__)


def check_gpu():
    """Check GPU availability"""
    print("=" * 60)
    print("GPU CHECK")
    print("=" * 60)
    
    try:
        import torch
        
        if torch.cuda.is_available():
            gpu_name = torch.cuda.get_device_name(0)
            total_mem = torch.cuda.get_device_properties(0).total_memory / (1024**3)
            print(f"[OK] GPU: {gpu_name}")
            print(f"[OK] VRAM: {total_mem:.1f} GB")
            
            if total_mem >= 10:
                print("[OK] Sufficient for Surya + Nougat")
            elif total_mem >= 6:
                print("[WARN] May need to run models sequentially")
            else:
                print("[FAIL] Insufficient VRAM")
            return True
        else:
            print("[WARN] No CUDA GPU available")
            return False
            
    except ImportError:
        print("[FAIL] PyTorch not installed")
        return False


def process_pdf(pdf_path: str, output_dir: str = None, device: str = "auto"):
    """Process a PDF document"""
    print("=" * 60)
    print("ExpertOS OCR Pipeline v4.0")
    print("=" * 60)
    
    pdf_path = Path(pdf_path)
    if not pdf_path.exists():
        print(f"[FAIL] PDF not found: {pdf_path}")
        return None
    
    print(f"Input: {pdf_path}")
    print(f"Device: {device}")
    
    try:
        from inference import ExpertOSInference
        
        pipeline = ExpertOSInference(device=device)
        result = pipeline.process_pdf(str(pdf_path), output_dir)
        
        print("\n" + "=" * 60)
        print("RESULTS")
        print("=" * 60)
        
        # Print validation results
        print("\n[METADATA]")
        print(f"  Phone: {result.validation.get('phone', 'N/A')}")
        print(f"  CR: {result.validation.get('cr', 'N/A')}")
        print(f"  Salary: {result.validation.get('salary', 'N/A')}")
        print(f"  Ref ID: {result.validation.get('ref_id', 'N/A')}")
        print(f"  Confidence: {result.validation.get('confidence', 'N/A')}")
        
        if result.validation.get('warnings'):
            print(f"  Warnings: {', '.join(result.validation['warnings'])}")
        
        print(f"\n[STATS]")
        print(f"  Pages: {len(result.pages)}")
        print(f"  Processing time: {result.processing_time_ms}ms")
        print(f"  VRAM used: {result.metadata.get('vram_gb', 0)} GB")
        
        # Print first page text sample
        if result.pages:
            first_page = result.pages[0]
            text_sample = first_page.normalized_text[:500]
            print(f"\n[TEXT SAMPLE (page 1)]")
            print("-" * 40)
            print(text_sample)
            print("-" * 40)
        
        # Save to output
        if output_dir:
            output_path = Path(output_dir)
            output_path.mkdir(parents=True, exist_ok=True)
            
            json_file = output_path / f"final_output.json"
            json_file.write_text(result.to_json(), encoding='utf-8')
            print(f"\n[OUTPUT] Saved to {json_file}")
        
        return result
        
    except ImportError as e:
        print(f"[FAIL] Missing dependency: {e}")
        print("Run: python setup_expertos.py --install-deps")
        return None
    except Exception as e:
        print(f"[FAIL] Processing error: {e}")
        import traceback
        traceback.print_exc()
        return None


def main():
    parser = argparse.ArgumentParser(
        description="ExpertOS OCR Pipeline v4.0",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python run_pipeline.py --pdf document.pdf
    python run_pipeline.py --pdf document.pdf --output ./results
    python run_pipeline.py --check-gpu
        """
    )
    
    parser.add_argument("--pdf", type=str, help="Path to PDF file")
    parser.add_argument("--output", "-o", type=str, help="Output directory")
    parser.add_argument("--device", type=str, default="auto", 
                       choices=["auto", "cuda", "cpu"],
                       help="Device to use")
    parser.add_argument("--check-gpu", action="store_true", help="Check GPU")
    
    args = parser.parse_args()
    
    if args.check_gpu:
        check_gpu()
    elif args.pdf:
        process_pdf(args.pdf, args.output, args.device)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
