"""
Fee Request Generator with Hijri Date Support
Based on 07_FINANCE_ANALYTICS.md specification

Generates Arabic fee request letters using Tariq's template
with both Gregorian and Hijri dates.
"""

import os
import json
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from typing import Dict, Any, Optional
from dataclasses import dataclass

try:
    from docxtpl import DocxTemplate
    DOCXTPL_AVAILABLE = True
except ImportError:
    DOCXTPL_AVAILABLE = False

try:
    from hijri_converter import Hijri, Gregorian
    HIJRI_AVAILABLE = True
except ImportError:
    HIJRI_AVAILABLE = False
    print("Warning: hijri-converter not installed. Run: pip install hijri-converter")


@dataclass
class FeeRequestData:
    """Data structure for fee request generation"""
    # Case info
    case_number: str
    court_name: str
    
    # Parties
    plaintiff_name: str
    defendant_name: str
    
    # Fee
    agreed_amount: Decimal
    requested_amount: Optional[Decimal] = None  # User may adjust
    
    # Bank Details
    bank_name: str = "Bank Muscat"
    bank_name_ar: str = "بنك مسقط"
    account_number: str = ""
    iban: str = ""
    
    # Dates
    gregorian_date: Optional[str] = None
    hijri_date: Optional[str] = None
    
    # Expert
    expert_name: str = "طارق الخبير"


def gregorian_to_hijri(date: datetime) -> str:
    """
    Convert Gregorian date to Hijri format.
    Returns format: "12 ربيع الأول 1446هـ"
    """
    if not HIJRI_AVAILABLE:
        return ""
    
    try:
        hijri = Gregorian(date.year, date.month, date.day).to_hijri()
        
        # Arabic month names
        hijri_months = [
            "محرم", "صفر", "ربيع الأول", "ربيع الثاني",
            "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان",
            "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
        ]
        
        month_name = hijri_months[hijri.month - 1]
        return f"{hijri.day} {month_name} {hijri.year}هـ"
        
    except Exception as e:
        print(f"Hijri conversion error: {e}")
        return ""


def format_omani_number(amount: Decimal) -> str:
    """Format number in Omani style: 1,234.567"""
    return f"{float(amount):,.3f}"


class FeeRequestGenerator:
    """
    Generator for Arabic fee request documents.
    Uses Tariq's template: نموذج طلب أمانة الخبرة.docx
    """
    
    TEMPLATES_DIR = Path(__file__).parent / "templates"
    OUTPUT_DIR = Path(__file__).parent.parent / "public" / "generated_reports"
    TEMPLATE_NAME = "fee_request_template.docx"
    
    def __init__(self):
        self.TEMPLATES_DIR.mkdir(parents=True, exist_ok=True)
        self.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    def generate(self, data: FeeRequestData) -> Dict[str, Any]:
        """
        Generate fee request document.
        
        Returns dict with:
        - success: bool
        - docx_path: str (if success)
        - error: str (if failed)
        """
        if not DOCXTPL_AVAILABLE:
            return {"success": False, "error": "docxtpl not installed"}
        
        template_path = self.TEMPLATES_DIR / self.TEMPLATE_NAME
        
        if not template_path.exists():
            return {"success": False, "error": f"Template not found: {template_path}"}
        
        try:
            # Calculate dates
            now = datetime.now()
            gregorian_date = data.gregorian_date or now.strftime("%Y/%m/%d")
            hijri_date = data.hijri_date or gregorian_to_hijri(now)
            
            # Use requested amount if provided, otherwise agreed amount
            final_amount = data.requested_amount or data.agreed_amount
            
            # Prepare context
            context = {
                # Case
                "case_number": data.case_number,
                "court_name": data.court_name,
                
                # Parties
                "plaintiff_name": data.plaintiff_name,
                "defendant_name": data.defendant_name,
                
                # Dates
                "gregorian_date": gregorian_date,
                "hijri_date": hijri_date,
                "date_combined": f"{gregorian_date}م / {hijri_date}",
                
                # Fee
                "fee_amount": format_omani_number(final_amount),
                "fee_amount_raw": float(final_amount),
                
                # Bank Details
                "bank_name": data.bank_name,
                "bank_name_ar": data.bank_name_ar,
                "account_number": data.account_number,
                "iban": data.iban,
                
                # Expert
                "expert_name": data.expert_name,
            }
            
            # Load and render template
            doc = DocxTemplate(template_path)
            doc.render(context)
            
            # Generate output filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            safe_case = data.case_number.replace("/", "-").replace("\\", "-")
            output_filename = f"fee_request_{safe_case}_{timestamp}.docx"
            output_path = self.OUTPUT_DIR / output_filename
            
            # Save
            doc.save(output_path)
            
            return {
                "success": True,
                "docx_path": str(output_path),
                "download_url": f"/generated_reports/{output_filename}",
                "hijri_date": hijri_date,
                "gregorian_date": gregorian_date,
                "amount": float(final_amount)
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}


if __name__ == "__main__":
    from decimal import Decimal
    import sys
    
    # Force UTF-8 for console output
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    
    # Test Hijri conversion
    print("Testing Hijri date conversion...")
    today_hijri = gregorian_to_hijri(datetime.now())
    print(f"Today in Hijri: {today_hijri}")
    
    # Test generation
    print("\nTesting fee request generation...")
    
    test_data = FeeRequestData(
        case_number="1409/2024",
        court_name="Court of Muscat",
        plaintiff_name="Test Plaintiff",
        defendant_name="Test Defendant",
        agreed_amount=Decimal("1500.000"),
        bank_name_ar="Bank Muscat",
        account_number="1234567890",
        iban="OM12BMCM12345678901234"
    )
    
    generator = FeeRequestGenerator()
    result = generator.generate(test_data)
    
    print(f"Result: {json.dumps(result, indent=2, ensure_ascii=True)}")
    print(f"\nHijri date in result: {result.get('hijri_date', 'N/A')}")
