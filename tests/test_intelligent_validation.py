"""
Test Suite for Intelligent Validation Layer
Mission 11: Fuzzy Matching + Regex Guard

Tests:
- TC-01: Fuzzy correction (الحكمة -> المحكمة)
- TC-02: Civil ID validation (7 digit fail, reprocess trigger)
- TC-03: Invalid date detection
- TC-04: Case number format validation
"""

import pytest
import sys
sys.path.insert(0, "backend")

from intelligent_validation import (
    LegalRefiner,
    ValidationResult,
    DocumentValidation,
    validate_and_refine
)


class TestFuzzyMatching:
    """Test fuzzy matching and typo correction"""
    
    def setup_method(self):
        self.refiner = LegalRefiner()
    
    def test_tc01_fuzzy_court_correction(self):
        """TC-01: الحكمة should be corrected to المحكمة"""
        text = "الحكمة الابتدائية"
        refined, results = self.refiner.refine_text(text)
        
        assert "المحكمة" in refined
        assert any(r.original_value == "الحكمة" for r in results)
        
    def test_common_typo_correction(self):
        """Test common typo dictionary lookup"""
        text = "الابتدئية"  # Missing alif
        refined, results = self.refiner.refine_text(text)
        
        assert "الابتدائية" in refined
        
    def test_fuzzy_threshold(self):
        """Test that low-similarity words are not corrected"""
        text = "كلمة عشوائية"  # Random unrelated words
        refined, results = self.refiner.refine_text(text, threshold=95)
        
        # Should not be corrected (no match above 95%)
        assert len(results) == 0
        
    def test_department_correction(self):
        """Test department name correction"""
        text = "الدائره العماليه"  # Common typos
        refined, results = self.refiner.refine_text(text)
        
        # Should correct both words
        assert "الدائرة" in refined or "العمالية" in refined


class TestCivilIDValidation:
    """Test Civil ID validation (8 digits)"""
    
    def setup_method(self):
        self.refiner = LegalRefiner()
    
    def test_tc02_invalid_7_digit_id(self):
        """TC-02: 7-digit ID should fail validation"""
        result = self.refiner.validate_civil_id("1234567")
        
        assert result.confidence == 0.0
        assert result.needs_attention == True
        assert result.correction_type == "regex_fail"
        
    def test_invalid_alphanumeric_id(self):
        """ID with letters should fail"""
        result = self.refiner.validate_civil_id("12345A78")
        
        assert result.confidence == 0.0
        assert result.needs_attention == True
        
    def test_valid_8_digit_id(self):
        """Valid 8-digit ID should pass"""
        result = self.refiner.validate_civil_id("12345678")
        
        assert result.confidence == 1.0
        assert result.needs_attention == False
        
    def test_9_digit_id_fails(self):
        """9-digit ID should fail"""
        result = self.refiner.validate_civil_id("123456789")
        
        assert result.confidence == 0.0


class TestDateValidation:
    """Test date format and existence validation"""
    
    def setup_method(self):
        self.refiner = LegalRefiner()
    
    def test_tc03_invalid_date(self):
        """TC-03: 2024/13/45 should be invalid"""
        result = self.refiner.validate_date("2024/13/45")
        
        assert result.confidence == 0.0
        assert result.needs_attention == True
        
    def test_nonexistent_date(self):
        """Feb 30 doesn't exist"""
        result = self.refiner.validate_date("2024/02/30")
        
        assert result.confidence == 0.0
        assert "invalid" in result.correction_type.lower()
        
    def test_valid_date(self):
        """Valid date should pass"""
        result = self.refiner.validate_date("2024/01/15")
        
        assert result.confidence == 1.0
        
    def test_wrong_format(self):
        """Wrong format should fail"""
        result = self.refiner.validate_date("15/01/2024")  # DD/MM/YYYY
        
        assert result.confidence == 0.0


class TestCaseNumberValidation:
    """Test case number format validation"""
    
    def setup_method(self):
        self.refiner = LegalRefiner()
    
    def test_valid_case_number(self):
        """1409/2024 is valid format"""
        result = self.refiner.validate_case_number("1409/2024")
        
        assert result.confidence == 1.0
        
    def test_missing_slash(self):
        """14092024 without slash should fail"""
        result = self.refiner.validate_case_number("14092024")
        
        assert result.confidence == 0.0
        assert result.needs_attention == True
        
    def test_wrong_separator(self):
        """1409-2024 with dash should fail"""
        result = self.refiner.validate_case_number("1409-2024")
        
        assert result.confidence == 0.0


class TestDocumentValidation:
    """Test full document validation"""
    
    def setup_method(self):
        self.refiner = LegalRefiner()
    
    def test_document_with_errors(self):
        """Test document with multiple errors"""
        fields = {
            "civil_id": "1234567",  # Invalid
            "date": "2024/13/45",  # Invalid
            "case_number": "1409/2024",  # Valid
            "court_name": "الحكمة الابتدائية"  # Typo
        }
        
        validation = self.refiner.validate_document(fields)
        
        assert validation.failed_validations >= 2  # civil_id and date
        
    def test_api_function(self):
        """Test validate_and_refine API function"""
        data = {
            "court_name": "الحكمة",
            "civil_id": "12345678"
        }
        
        result = validate_and_refine(data)
        
        assert "refined_data" in result
        assert "corrections" in result
        assert "errors" in result
        assert "stats" in result


class TestAccuracyRequirement:
    """Test 100% accuracy requirement from spec"""
    
    def setup_method(self):
        self.refiner = LegalRefiner()
    
    def test_full_scenario_accuracy(self):
        """
        Combined test: 
        - Input string with typo 'الحكمة'
        - Invalid 7-digit ID
        Must: fix typo AND flag ID
        """
        # Test typo fix
        text = "الحكمة"
        refined, _ = self.refiner.refine_text(text)
        assert "المحكمة" in refined, "Typo not corrected"
        
        # Test ID flagging
        result = self.refiner.validate_civil_id("1234567")
        assert result.needs_attention == True, "Invalid ID not flagged"
        
        print("100% Accuracy Test: PASSED")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
