"""
Test Suite for Privacy and Role-Based Access Control
Missions 13 & 14

Tests:
- PII masking (no leaks)
- De-masking (real names restored)
- RBAC permissions
- Role-based route access
"""

import pytest
import sys
sys.path.insert(0, "backend")
sys.path.insert(0, "lib")

from privacy_masking import MaskingEngine
from rbac import RBACManager, Permissions, UserRole


class TestPrivacyMasking:
    """Test PII masking and security"""
    
    def test_name_masking_no_leak(self):
        """Test that real names are not leaked"""
        engine = MaskingEngine()
        
        text = "المدعي أحمد سالم بن علي يطالب شركة عمان بالتعويض"
        known = {"plaintiff": "أحمد سالم بن علي", "defendant": "شركة عمان"}
        
        masked = engine.mask_text(text, known)
        
        # Verify no PII leaked
        assert "أحمد سالم" not in masked
        assert "شركة عمان" not in masked
        
        # Verify tokens present
        assert "[PLAINTIFF_1]" in masked
        assert "[DEFENDANT_1]" in masked
    
    def test_civil_id_masking(self):
        """Test Civil ID is masked"""
        engine = MaskingEngine()
        
        text = "رقم الهوية المدنية: 12345678"
        masked = engine.mask_text(text)
        
        assert "12345678" not in masked
        assert "[CIVIL_ID_1]" in masked
    
    def test_phone_masking(self):
        """Test phone numbers are masked"""
        engine = MaskingEngine()
        
        text = "للتواصل: +96899887766"
        masked = engine.mask_text(text)
        
        assert "99887766" not in masked
        assert "[PHONE_1]" in masked
    
    def test_demasking_restores_names(self):
        """Test that de-masking restores real names"""
        engine = MaskingEngine()
        
        # First mask
        text = "المدعي أحمد سالم"
        known = {"plaintiff": "أحمد سالم"}
        engine.mask_text(text, known)
        
        # AI response with tokens
        ai_response = "[PLAINTIFF_1] يستحق التعويض بقيمة 5000 ريال"
        demasked = engine.demask_text(ai_response)
        
        assert "أحمد سالم" in demasked
        assert "[PLAINTIFF_1]" not in demasked
    
    def test_verify_no_pii_leak(self):
        """Test leak verification function"""
        engine = MaskingEngine()
        
        text = "المدعي أحمد سالم, هوية 12345678"
        known = {"plaintiff": "أحمد سالم"}
        known_pii = ["أحمد سالم", "12345678"]
        
        masked = engine.mask_text(text, known)
        is_safe, leaks = engine.verify_no_pii(masked, known_pii)
        
        assert is_safe, f"PII leaked: {leaks}"
        assert len(leaks) == 0


class TestRoleBasedAccess:
    """Test RBAC permissions"""
    
    def test_admin_full_access(self):
        """Admin should have all permissions"""
        perms = RBACManager.get_user_permissions("ADMIN")
        
        assert len(perms) == 13
        assert RBACManager.can_view_firm_analytics("ADMIN")
        assert RBACManager.can_manage_settings("ADMIN")
        assert RBACManager.can_generate_reports("ADMIN")
    
    def test_expert_limited_access(self):
        """Expert should have limited permissions"""
        perms = RBACManager.get_user_permissions("EXPERT")
        
        assert len(perms) == 5
        assert RBACManager.can_generate_reports("EXPERT")
        assert not RBACManager.can_view_firm_analytics("EXPERT")
        assert not RBACManager.can_manage_settings("EXPERT")
    
    def test_reviewer_read_only(self):
        """Reviewer should be read-only"""
        perms = RBACManager.get_user_permissions("REVIEWER")
        
        assert len(perms) == 3
        assert RBACManager.has_permission("REVIEWER", Permissions.VIEW_ALL_CASES)
        assert not RBACManager.can_generate_reports("REVIEWER")
        assert not RBACManager.can_manage_settings("REVIEWER")
    
    def test_reviewer_no_analytics_access(self):
        """Reviewer should not access firm analytics"""
        can_access = RBACManager.can_view_firm_analytics("REVIEWER")
        assert not can_access
    
    def test_admin_routes(self):
        """Admin should access admin routes"""
        routes = RBACManager.get_accessible_routes("ADMIN")
        
        assert "/admin/settings" in routes
        assert "/analytics" in routes
        assert "/finance" in routes
    
    def test_expert_no_admin_routes(self):
        """Expert should not access admin routes"""
        routes = RBACManager.get_accessible_routes("EXPERT")
        
        assert "/admin/settings" not in routes
        assert "/analytics" in routes  # Own analytics only
    
    def test_invalid_role_defaults(self):
        """Invalid role should default to USER permissions"""
        perms = RBACManager.get_user_permissions("INVALID_ROLE")
        
        assert len(perms) == 2  # USER has 2 permissions


class TestSecurityIntegration:
    """Integration tests for security"""
    
    def test_full_security_flow(self):
        """Test complete security flow"""
        # 1. Check role permissions
        assert RBACManager.can_view_firm_analytics("ADMIN")
        assert not RBACManager.can_view_firm_analytics("EXPERT")
        
        # 2. Mask PII before AI
        engine = MaskingEngine()
        sensitive_text = "المدعي أحمد سالم, ID 12345678"
        masked = engine.mask_text(sensitive_text, {"plaintiff": "أحمد سالم"})
        
        # 3. Verify no leaks
        is_safe, _ = engine.verify_no_pii(masked, ["أحمد سالم", "12345678"])
        assert is_safe
        
        # 4. Demask AI response
        ai_response = "[PLAINTIFF_1] approved"
        demasked = engine.demask_text(ai_response)
        assert "أحمد سالم" in demasked


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
