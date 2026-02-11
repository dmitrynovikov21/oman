"""
Mission 13: Hybrid Privacy - PII Anonymization

Masks sensitive data before sending to external AI:
- Names → [PLAINTIFF_1], [DEFENDANT_1]
- Civil IDs → [CIVIL_ID_1]
- Phone numbers → [PHONE_1]
- Bank accounts → [BANK_1]

Maintains a token registry for de-masking responses.
"""

import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
import json
import uuid


@dataclass
class TokenMapping:
    """Single token-to-value mapping"""
    token: str
    real_value: str
    category: str  # "name", "civil_id", "phone", "bank"
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class TokenRegistry:
    """Registry of all token mappings for a session"""
    session_id: str
    mappings: Dict[str, TokenMapping] = field(default_factory=dict)
    reverse_lookup: Dict[str, str] = field(default_factory=dict)
    
    def add_mapping(self, token: str, real_value: str, category: str):
        mapping = TokenMapping(token=token, real_value=real_value, category=category)
        self.mappings[token] = mapping
        self.reverse_lookup[real_value] = token
    
    def get_real_value(self, token: str) -> Optional[str]:
        if token in self.mappings:
            return self.mappings[token].real_value
        return None
    
    def get_token(self, real_value: str) -> Optional[str]:
        return self.reverse_lookup.get(real_value)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "mappings": {k: {"real_value": v.real_value, "category": v.category} 
                        for k, v in self.mappings.items()}
        }


class MaskingEngine:
    """
    PII Masking Engine for Hybrid Privacy.
    
    Replaces sensitive information with tokens before external AI processing.
    Supports de-masking to restore real values in responses.
    """
    
    # Arabic name patterns
    ARABIC_NAME_PATTERN = r'[\u0621-\u064A\s]{3,30}'
    
    # PII patterns
    PATTERNS = {
        "civil_id": r'\b\d{8}\b',  # 8-digit Omani Civil ID
        "phone": r'(\+968\s?)?\d{8}',  # Omani phone with optional +968
        "iban": r'\bOM\d{2}[A-Z]{4}\d{16}\b',  # Omani IBAN
        "email": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
    }
    
    def __init__(self, session_id: Optional[str] = None):
        self.session_id = session_id or str(uuid.uuid4())[:8]
        self.registry = TokenRegistry(session_id=self.session_id)
        self._counters = {
            "plaintiff": 0,
            "defendant": 0,
            "name": 0,
            "civil_id": 0,
            "phone": 0,
            "bank": 0,
            "email": 0,
        }
    
    def _generate_token(self, category: str) -> str:
        """Generate a unique token for a category"""
        self._counters[category] = self._counters.get(category, 0) + 1
        count = self._counters[category]
        return f"[{category.upper()}_{count}]"
    
    def mask_text(
        self, 
        text: str, 
        known_names: Optional[Dict[str, str]] = None
    ) -> str:
        """
        Mask all PII in text.
        
        Args:
            text: Input text with sensitive data
            known_names: Optional dict of role -> name for explicit masking
                        e.g., {"plaintiff": "أحمد سالم", "defendant": "شركة ..."} 
        
        Returns:
            Masked text with tokens
        """
        masked = text
        
        # First, mask known names explicitly
        if known_names:
            for role, name in known_names.items():
                if name and name in masked:
                    token = self._generate_token(role)
                    self.registry.add_mapping(token, name, role)
                    masked = masked.replace(name, token)
        
        # Mask Civil IDs
        for match in re.finditer(self.PATTERNS["civil_id"], masked):
            civil_id = match.group()
            # Check if already masked
            if self.registry.get_token(civil_id):
                continue
            token = self._generate_token("civil_id")
            self.registry.add_mapping(token, civil_id, "civil_id")
            masked = masked.replace(civil_id, token)
        
        # Mask phone numbers
        for match in re.finditer(self.PATTERNS["phone"], masked):
            phone = match.group()
            if self.registry.get_token(phone):
                continue
            token = self._generate_token("phone")
            self.registry.add_mapping(token, phone, "phone")
            masked = masked.replace(phone, token)
        
        # Mask IBANs
        for match in re.finditer(self.PATTERNS["iban"], masked):
            iban = match.group()
            if self.registry.get_token(iban):
                continue
            token = self._generate_token("bank")
            self.registry.add_mapping(token, iban, "bank")
            masked = masked.replace(iban, token)
        
        # Mask emails
        for match in re.finditer(self.PATTERNS["email"], masked, re.IGNORECASE):
            email = match.group()
            if self.registry.get_token(email):
                continue
            token = self._generate_token("email")
            self.registry.add_mapping(token, email, "email")
            masked = masked.replace(email, token)
        
        return masked
    
    def demask_text(self, text: str) -> str:
        """
        Restore real values from tokens in text.
        
        Args:
            text: Text with tokens from AI response
            
        Returns:
            Text with real values restored
        """
        demasked = text
        
        # Replace all tokens with real values
        for token, mapping in self.registry.mappings.items():
            demasked = demasked.replace(token, mapping.real_value)
        
        return demasked
    
    def mask_document_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Mask all PII in a document data dictionary.
        
        Returns masked copy of the data.
        """
        masked_data = {}
        
        # Extract known names for explicit masking
        known_names = {}
        if "plaintiff_name" in data:
            known_names["plaintiff"] = data["plaintiff_name"]
        if "defendant_name" in data:
            known_names["defendant"] = data["defendant_name"]
        
        for key, value in data.items():
            if isinstance(value, str):
                masked_data[key] = self.mask_text(value, known_names)
            elif isinstance(value, dict):
                masked_data[key] = self.mask_document_data(value)
            elif isinstance(value, list):
                masked_data[key] = [
                    self.mask_text(v, known_names) if isinstance(v, str) else v
                    for v in value
                ]
            else:
                masked_data[key] = value
        
        return masked_data
    
    def get_registry_json(self) -> str:
        """Get registry as JSON for storage"""
        return json.dumps(self.registry.to_dict(), ensure_ascii=False, indent=2)
    
    def verify_no_pii(self, text: str, known_pii: List[str]) -> Tuple[bool, List[str]]:
        """
        Verify that text contains no known PII.
        
        Args:
            text: Text to check
            known_pii: List of known PII values that should not appear
            
        Returns:
            (is_safe, list_of_leaked_values)
        """
        leaked = []
        for pii in known_pii:
            if pii in text:
                leaked.append(pii)
        
        return len(leaked) == 0, leaked


def test_masking():
    """Test the masking engine"""
    print("=== PII Masking Engine Test ===\n")
    
    engine = MaskingEngine()
    
    # Test 1: Known names masking
    print("Test 1: Known Names Masking")
    text = """
    القضية رقم 1409/2024
    المدعي: أحمد سالم بن علي
    المدعى عليه: شركة عمان للتنمية
    رقم الهوية: 12345678
    هاتف: +96899887766
    """
    
    known_names = {
        "plaintiff": "أحمد سالم بن علي",
        "defendant": "شركة عمان للتنمية"
    }
    
    masked = engine.mask_text(text, known_names)
    print(f"Original contains 'أحمد سالم': {'أحمد سالم' in text}")
    print(f"Masked contains 'أحمد سالم': {'أحمد سالم' in masked}")
    print(f"Masked contains [PLAINTIFF_1]: {'[PLAINTIFF_1]' in masked}")
    assert "أحمد سالم" not in masked, "Leak test failed - name still visible!"
    assert "[PLAINTIFF_1]" in masked, "Token not inserted!"
    print("  ✓ PASSED\n")
    
    # Test 2: Civil ID masking
    print("Test 2: Civil ID Masking")
    assert "12345678" not in masked, "Civil ID leak!"
    assert "[CIVIL_ID_1]" in masked, "Civil ID token missing!"
    print("  ✓ PASSED\n")
    
    # Test 3: Phone masking
    print("Test 3: Phone Masking")
    assert "+96899887766" not in masked, "Phone leak!"
    assert "[PHONE_1]" in masked, "Phone token missing!"
    print("  ✓ PASSED\n")
    
    # Test 4: De-masking
    print("Test 4: De-masking AI Response")
    ai_response = "بناءً على الوثائق, يستحق [PLAINTIFF_1] تعويضاً من [DEFENDANT_1] بمبلغ 5000 ريال."
    demasked = engine.demask_text(ai_response)
    print(f"AI Response: {ai_response}")
    print(f"Demasked: {demasked}")
    assert "أحمد سالم بن علي" in demasked, "Demasking failed!"
    assert "شركة عمان للتنمية" in demasked, "Defendant demasking failed!"
    print("  ✓ PASSED\n")
    
    # Test 5: Leak verification
    print("Test 5: Leak Verification")
    known_pii = ["أحمد سالم بن علي", "12345678", "+96899887766"]
    is_safe, leaks = engine.verify_no_pii(masked, known_pii)
    print(f"Is Safe: {is_safe}")
    print(f"Leaks: {leaks}")
    assert is_safe, f"Leak detected: {leaks}"
    print("  ✓ PASSED\n")
    
    # Show registry
    print("Token Registry:")
    print(engine.get_registry_json())
    
    print("\n=== All Masking Tests Passed ===")


if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    test_masking()
