"""
API Script for generating reports
Called by Next.js API endpoint with JSON argument
"""

import sys
import json
from decimal import Decimal
from document_factory import DocumentFactory, ReportData


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No data provided"}))
        return 1
    
    try:
        # Parse JSON data from command line
        data_str = sys.argv[1]
        data = json.loads(data_str)
        
        # Create ReportData object
        report_data = ReportData(
            case_number=data.get("case_number", "N/A"),
            court_name=data.get("court_name", ""),
            wilaya=data.get("wilaya", ""),
            plaintiff_name=data.get("plaintiff_name", ""),
            defendant_name=data.get("defendant_name", ""),
            gregorian_date=data.get("gregorian_date", ""),
            hijri_date=data.get("hijri_date", ""),
            assignment_date=data.get("assignment_date", ""),
            basic_salary=Decimal(str(data.get("basic_salary", 0))),
            gross_salary=Decimal(str(data.get("gross_salary", 0))),
            eosb=Decimal(str(data.get("eosb", 0))),
            notice_pay=Decimal(str(data.get("notice_pay", 0))),
            leave_pay=Decimal(str(data.get("leave_pay", 0))),
            total_due=Decimal(str(data.get("total_due", 0))),
            years_of_service=int(data.get("years_of_service", 0)),
            months_of_service=int(data.get("months_of_service", 0)),
            expert_name=data.get("expert_name", "طارق الخبير"),
        )
        
        # Generate report
        factory = DocumentFactory()
        result = factory.generate_report("eosb_report_template.docx", report_data)
        
        print(json.dumps(result))
        return 0 if result.get("success") else 1
        
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        return 1


if __name__ == "__main__":
    sys.exit(main())
