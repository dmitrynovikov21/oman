"""
Combined Test Suite for OCR Intelligence Modules
Missions 11, 12, 13 - Validation, Consensus, Privacy

Tests:
- Fuzzy correction of Arabic typos
- OCR conflict detection between models
- PII masking and de-masking
"""

import pytest
import sys
sys.path.insert(0, "backend")

from intelligent_validation import LegalRefiner, validate_and_refine
from ocr_consensus import OCRConsensusEngine, ConsensusResult
from privacy_masking import MaskingEngine


class TestOCRIntelligence:
    """Combined tests for OCR intelligence features"""
    
    # ===================
    # Mission 11: Fuzzy Matching
    # ===================
    
    def test_fuzzy_typo_correction(self):
        """الحكمة should be corrected to المحكمة"""
        refiner = LegalRefiner()
        text = "الحكمة الابتدائية"
        refined, results = refiner.refine_text(text)
        
        assert "المحكمة" in refined
        assert any(r.correction_type == "typo" for r in results)
    
    def test_common_arabic_typos(self):
        """Test common OCR typos are corrected"""
        refiner = LegalRefiner()
        
        test_cases = [
            ("الابتدئية", "الابتدائية"),
            ("الدائره", "الدائرة"),
            ("العماليه", "العمالية"),
        ]
        
        for typo, expected in test_cases:
            refined, _ = refiner.refine_text(typo)
            assert expected in refined, f"Failed to correct {typo}"
    
    # ===================
    # Mission 12: OCR Consensus
    # ===================
    
    def test_consensus_unity_verified(self):
        """Test Unity: Clear digit 750 should be verified"""
        engine = OCRConsensusEngine()
        result = engine.compare_values(
            field_name="salary",
            paddle_value="750",
            easyocr_value="750"
        )
        
        assert result.status == "verified"
        assert result.needs_review == False
        assert result.confidence >= 0.9
    
    def test_consensus_conflict_detection(self):
        """Test Conflict: Different values should be flagged"""
        engine = OCRConsensusEngine()
        result = engine.compare_values(
            field_name="date",
            paddle_value="ABC123",
            easyocr_value="XYZ789"  # Completely different
        )
        
        assert result.status == "conflict"
        assert result.needs_review == True
        assert result.paddle_value != result.easyocr_value
    
    def test_consensus_number_conflict(self):
        """Test: 103 vs 108 should be conflict"""
        engine = OCRConsensusEngine()
        result = engine.compare_values(
            field_name="amount",
            paddle_value="103",
            easyocr_value="108"
        )
        
        assert result.status == "conflict"
        assert result.needs_review == True
    
    def test_consensus_arabic_match(self):
        """Test: Matching Arabic text should be verified"""  
        engine = OCRConsensusEngine()
        result = engine.compare_values(
            field_name="court",
            paddle_value="المحكمة الابتدائية",
            easyocr_value="المحكمة الابتدائية" 
        )
        
        assert result.status == "verified"
    
    # ===================
    # Mission 13: Privacy Masking
    # ===================
    
    def test_privacy_name_masking(self):
        """Test: Names should be masked with tokens"""
        engine = MaskingEngine()
        text = "المدعي: أحمد سالم بن علي"
        known = {"plaintiff": "أحمد سالم بن علي"}
        
        masked = engine.mask_text(text, known)
        
        assert "أحمد سالم" not in masked
        assert "[PLAINTIFF_1]" in masked
    
    def test_privacy_civil_id_masking(self):
        """Test: Civil ID should be masked"""
        engine = MaskingEngine()
        text = "رقم الهوية: 12345678"
        
        masked = engine.mask_text(text)
        
        assert "12345678" not in masked
        assert "[CIVIL_ID_1]" in masked
    
    def test_privacy_demasking(self):
        """Test: Tokens should be restored to real values"""
        engine = MaskingEngine()
        text = "المدعي: أحمد سالم"
        known = {"plaintiff": "أحمد سالم"}
        
        masked = engine.mask_text(text, known)
        
        # Simulate AI response with tokens
        ai_response = "[PLAINTIFF_1] يستحق التعويض"
        demasked = engine.demask_text(ai_response)
        
        assert "أحمد سالم" in demasked
        assert "[PLAINTIFF_1]" not in demasked
    
    def test_privacy_no_leaks(self):
        """Test Leak: No real PII in masked output"""
        engine = MaskingEngine()
        
        text = "المدعي أحمد سالم, هوية 12345678"
        known = {"plaintiff": "أحمد سالم"}
        known_pii = ["أحمد سالم", "12345678"]
        
        masked = engine.mask_text(text, known)
        is_safe, leaks = engine.verify_no_pii(masked, known_pii)
        
        assert is_safe, f"PII leaked: {leaks}"
    
    # ===================
    # Integration Test
    # ===================
    
    def test_full_pipeline(self):
        """
        Full pipeline test:
        1. Validate/refine OCR text
        2. Check consensus
        3. Mask PII
        4. Verify no leaks
        """
        # Step 1: Refine OCR text
        refiner = LegalRefiner()
        ocr_text = "الحكمة الابتدائية - المدعي: أحمد سالم"
        refined, _ = refiner.refine_text(ocr_text)
        
        assert "المحكمة" in refined  # Typo corrected
        
        # Step 2: Mask PII
        masker = MaskingEngine()
        masked = masker.mask_text(refined, {"plaintiff": "أحمد سالم"})
        
        assert "أحمد سالم" not in masked
        assert "[PLAINTIFF_1]" in masked
        
        # Step 3: Verify no leaks
        is_safe, _ = masker.verify_no_pii(masked, ["أحمد سالم"])
        assert is_safe
        
        print("Full pipeline test: PASSED")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
