"""
API Script for generating fee request documents
Called by Next.js API endpoint with JSON argument
"""

import sys
import json
from decimal import Decimal
from fee_request_generator import FeeRequestGenerator, FeeRequestData


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No data provided"}))
        return 1
    
    try:
        # Parse JSON data from command line
        data_str = sys.argv[1]
        data = json.loads(data_str)
        
        # Create FeeRequestData object
        fee_data = FeeRequestData(
            case_number=data.get("case_number", "N/A"),
            court_name=data.get("court_name", ""),
            plaintiff_name=data.get("plaintiff_name", ""),
            defendant_name=data.get("defendant_name", ""),
            agreed_amount=Decimal(str(data.get("agreed_amount", 0))),
            requested_amount=Decimal(str(data.get("requested_amount", 0))) if data.get("requested_amount") else None,
            bank_name=data.get("bank_name", "Bank Muscat"),
            bank_name_ar=data.get("bank_name_ar", "بنك مسقط"),
            account_number=data.get("account_number", ""),
            iban=data.get("iban", ""),
        )
        
        # Generate fee request
        generator = FeeRequestGenerator()
        result = generator.generate(fee_data)
        
        print(json.dumps(result, ensure_ascii=True))
        return 0 if result.get("success") else 1
        
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        return 1


if __name__ == "__main__":
    sys.exit(main())
