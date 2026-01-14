#!/usr/bin/env python3
"""
ExpertOS OCR Pipeline v4.0 — Setup Script

Installs dependencies and downloads models for:
- Surya-OCR (Layout detection)
- Arabic-Nougat (Structural OCR)
- Tnkeeh (Arabic normalization)

Usage:
    python setup_expertos.py --install-deps
    python setup_expertos.py --download-models
    python setup_expertos.py --check-gpu
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path

# Configuration
MODELS_DIR = Path(__file__).parent / "models"
CACHE_DIR = Path(__file__).parent / "cache"

# Model URLs and info
MODELS = {
    "surya": {
        "repo": "vikp/surya_layout2",  # Layout detection model
        "size_mb": 1000,
    },
    "arabic-nougat": {
        "repo": "MohamedRashad/arabic-base-nougat",
        "size_mb": 1500,
    },
}

DEPENDENCIES = [
    "torch>=2.0.0",
    "transformers>=4.30.0",
    "surya-ocr",
    "tnkeeh",
    "pdf2image",
    "pillow",
    "numpy",
    "opencv-python",
]


def check_gpu():
    """Check GPU availability and VRAM"""
    print("=" * 60)
    print("GPU CHECK")
    print("=" * 60)
    
    try:
        import torch
        
        if torch.cuda.is_available():
            gpu_count = torch.cuda.device_count()
            print(f"[OK] CUDA available: {gpu_count} GPU(s)")
            
            for i in range(gpu_count):
                name = torch.cuda.get_device_name(i)
                total_mem = torch.cuda.get_device_properties(i).total_memory / (1024**3)
                print(f"  GPU {i}: {name}")
                print(f"    Total VRAM: {total_mem:.1f} GB")
                
                if total_mem >= 10:
                    print(f"    [OK] Sufficient for Surya + Nougat")
                elif total_mem >= 6:
                    print(f"    [WARN] May need to run models sequentially")
                else:
                    print(f"    [FAIL] Insufficient VRAM (<6GB)")
        else:
            print("[WARN] CUDA not available - will use CPU (slow)")
            
    except ImportError:
        print("[FAIL] PyTorch not installed")
        return False
    
    return True


def install_dependencies():
    """Install required Python packages"""
    print("=" * 60)
    print("INSTALLING DEPENDENCIES")
    print("=" * 60)
    
    for dep in DEPENDENCIES:
        print(f"Installing {dep}...")
        try:
            subprocess.check_call([
                sys.executable, "-m", "pip", "install", dep, "-q"
            ])
            print(f"  [OK] {dep}")
        except subprocess.CalledProcessError as e:
            print(f"  [FAIL] {dep}: {e}")
    
    print("\n[OK] Dependencies installed")


def download_models():
    """Download and cache models locally"""
    print("=" * 60)
    print("DOWNLOADING MODELS")
    print("=" * 60)
    
    # Create directories
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    
    # Set HuggingFace cache directory
    os.environ["HF_HOME"] = str(CACHE_DIR)
    os.environ["TRANSFORMERS_CACHE"] = str(CACHE_DIR)
    
    try:
        from huggingface_hub import snapshot_download
        
        for name, info in MODELS.items():
            print(f"\nDownloading {name} ({info['size_mb']}MB)...")
            local_dir = MODELS_DIR / name
            
            try:
                snapshot_download(
                    repo_id=info["repo"],
                    local_dir=str(local_dir),
                    local_dir_use_symlinks=False,
                )
                print(f"  [OK] {name} -> {local_dir}")
            except Exception as e:
                print(f"  [FAIL] {name}: {e}")
                
    except ImportError:
        print("[FAIL] huggingface_hub not installed")
        print("Run: pip install huggingface_hub")
        return False
    
    print("\n[OK] Models downloaded")
    print(f"Cache location: {CACHE_DIR}")
    return True


def setup_offline_mode():
    """Configure for offline operation"""
    print("=" * 60)
    print("CONFIGURING OFFLINE MODE")
    print("=" * 60)
    
    # Create .env file for offline mode
    env_file = Path(__file__).parent / ".env"
    env_content = """# ExpertOS OCR Pipeline - Offline Configuration
HF_HUB_OFFLINE=1
TRANSFORMERS_OFFLINE=1
HF_HOME={cache}
TRANSFORMERS_CACHE={cache}
""".format(cache=str(CACHE_DIR))
    
    env_file.write_text(env_content)
    print(f"[OK] Created {env_file}")
    print("[OK] Offline mode configured")


def verify_installation():
    """Verify all components are working"""
    print("=" * 60)
    print("VERIFICATION")
    print("=" * 60)
    
    checks = []
    
    # Check imports
    imports = [
        ("torch", "PyTorch"),
        ("transformers", "Transformers"),
        ("surya", "Surya-OCR"),
        ("tnkeeh", "Tnkeeh"),
        ("pdf2image", "PDF2Image"),
        ("PIL", "Pillow"),
    ]
    
    for module, name in imports:
        try:
            __import__(module)
            print(f"  [OK] {name}")
            checks.append(True)
        except ImportError:
            print(f"  [FAIL] {name}")
            checks.append(False)
    
    # Check models
    if MODELS_DIR.exists():
        for name in MODELS:
            model_path = MODELS_DIR / name
            if model_path.exists():
                print(f"  [OK] Model: {name}")
                checks.append(True)
            else:
                print(f"  [FAIL] Model: {name}")
                checks.append(False)
    
    if all(checks):
        print("\n[OK] All components ready!")
        return True
    else:
        print("\n[WARN] Some components missing")
        return False


def main():
    parser = argparse.ArgumentParser(description="ExpertOS OCR Pipeline Setup")
    parser.add_argument("--install-deps", action="store_true", help="Install dependencies")
    parser.add_argument("--download-models", action="store_true", help="Download models")
    parser.add_argument("--check-gpu", action="store_true", help="Check GPU availability")
    parser.add_argument("--offline", action="store_true", help="Configure offline mode")
    parser.add_argument("--verify", action="store_true", help="Verify installation")
    parser.add_argument("--all", action="store_true", help="Run all setup steps")
    
    args = parser.parse_args()
    
    if args.all or (not any(vars(args).values())):
        # Default: run all
        check_gpu()
        install_dependencies()
        download_models()
        setup_offline_mode()
        verify_installation()
    else:
        if args.check_gpu:
            check_gpu()
        if args.install_deps:
            install_dependencies()
        if args.download_models:
            download_models()
        if args.offline:
            setup_offline_mode()
        if args.verify:
            verify_installation()


if __name__ == "__main__":
    main()
