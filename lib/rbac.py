"""
Mission 14: Enterprise Admin - Role-Based Access Control

Implements RBAC with three roles:
- ADMIN: Full access to finances, all experts' stats, firm settings
- EXPERT: Only own cases and personal statistics  
- REVIEWER: Read-only access, cannot generate reports
"""

from enum import Enum
from dataclasses import dataclass
from typing import List, Optional, Dict, Any
from functools import wraps


class UserRole(str, Enum):
    """User role levels"""
    ADMIN = "ADMIN"
    EXPERT = "EXPERT"
    REVIEWER = "REVIEWER"
    USER = "USER"  # Default


@dataclass
class Permission:
    """Permission definition"""
    name: str
    description: str


# Define all permissions
class Permissions:
    # Case permissions
    VIEW_OWN_CASES = Permission("view_own_cases", "View own cases")
    VIEW_ALL_CASES = Permission("view_all_cases", "View all cases in firm")
    EDIT_CASES = Permission("edit_cases", "Edit case details")
    DELETE_CASES = Permission("delete_cases", "Delete cases")
    
    # Report permissions
    GENERATE_REPORTS = Permission("generate_reports", "Generate DOCX/PDF reports")
    VIEW_REPORTS = Permission("view_reports", "View generated reports")
    
    # Analytics permissions
    VIEW_OWN_ANALYTICS = Permission("view_own_analytics", "View own performance stats")
    VIEW_FIRM_ANALYTICS = Permission("view_firm_analytics", "View firm-wide analytics")
    VIEW_FINANCIAL = Permission("view_financial", "View revenue/profit data")
    
    # Admin permissions
    MANAGE_USERS = Permission("manage_users", "Add/remove/edit users")
    MANAGE_SETTINGS = Permission("manage_settings", "Edit firm settings")
    MANAGE_BILLING = Permission("manage_billing", "Manage payment/billing")
    EXPORT_DATA = Permission("export_data", "Export firm data")


# Role to permissions mapping
ROLE_PERMISSIONS: Dict[UserRole, List[Permission]] = {
    UserRole.ADMIN: [
        Permissions.VIEW_OWN_CASES,
        Permissions.VIEW_ALL_CASES,
        Permissions.EDIT_CASES,
        Permissions.DELETE_CASES,
        Permissions.GENERATE_REPORTS,
        Permissions.VIEW_REPORTS,
        Permissions.VIEW_OWN_ANALYTICS,
        Permissions.VIEW_FIRM_ANALYTICS,
        Permissions.VIEW_FINANCIAL,
        Permissions.MANAGE_USERS,
        Permissions.MANAGE_SETTINGS,
        Permissions.MANAGE_BILLING,
        Permissions.EXPORT_DATA,
    ],
    UserRole.EXPERT: [
        Permissions.VIEW_OWN_CASES,
        Permissions.EDIT_CASES,
        Permissions.GENERATE_REPORTS,
        Permissions.VIEW_REPORTS,
        Permissions.VIEW_OWN_ANALYTICS,
    ],
    UserRole.REVIEWER: [
        Permissions.VIEW_ALL_CASES,
        Permissions.VIEW_REPORTS,
        Permissions.VIEW_OWN_ANALYTICS,
    ],
    UserRole.USER: [
        Permissions.VIEW_OWN_CASES,
        Permissions.VIEW_OWN_ANALYTICS,
    ],
}


class RBACManager:
    """Role-Based Access Control Manager"""
    
    @staticmethod
    def get_user_permissions(role: str) -> List[Permission]:
        """Get all permissions for a role"""
        try:
            user_role = UserRole(role)
        except ValueError:
            user_role = UserRole.USER
        
        return ROLE_PERMISSIONS.get(user_role, [])
    
    @staticmethod
    def has_permission(role: str, permission: Permission) -> bool:
        """Check if role has specific permission"""
        permissions = RBACManager.get_user_permissions(role)
        return permission in permissions
    
    @staticmethod
    def can_view_firm_analytics(role: str) -> bool:
        """Check if user can view firm-wide analytics"""
        return RBACManager.has_permission(role, Permissions.VIEW_FIRM_ANALYTICS)
    
    @staticmethod
    def can_generate_reports(role: str) -> bool:
        """Check if user can generate reports"""
        return RBACManager.has_permission(role, Permissions.GENERATE_REPORTS)
    
    @staticmethod
    def can_manage_settings(role: str) -> bool:
        """Check if user can access admin settings"""
        return RBACManager.has_permission(role, Permissions.MANAGE_SETTINGS)
    
    @staticmethod
    def can_view_all_cases(role: str) -> bool:
        """Check if user can view all cases (not just own)"""
        return RBACManager.has_permission(role, Permissions.VIEW_ALL_CASES)
    
    @staticmethod
    def get_accessible_routes(role: str) -> List[str]:
        """Get list of routes accessible to role"""
        permissions = RBACManager.get_user_permissions(role)
        routes = ["/dashboard", "/cases"]  # Base routes for all
        
        if Permissions.VIEW_OWN_ANALYTICS in permissions:
            routes.append("/analytics")
        
        if Permissions.VIEW_FIRM_ANALYTICS in permissions:
            routes.append("/analytics/firm")
        
        if Permissions.VIEW_FINANCIAL in permissions:
            routes.append("/finance")
        
        if Permissions.MANAGE_SETTINGS in permissions:
            routes.append("/admin/settings")
            routes.append("/admin/users")
        
        return routes


def require_permission(permission: Permission):
    """
    Decorator for API routes requiring specific permission.
    
    Usage:
    @require_permission(Permissions.VIEW_FIRM_ANALYTICS)
    async def get_firm_analytics(request):
        ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # In real implementation, get user role from session/token
            user_role = kwargs.get("user_role", "USER")
            
            if not RBACManager.has_permission(user_role, permission):
                return {
                    "error": "Forbidden",
                    "message": f"Permission denied: {permission.name}",
                    "status": 403
                }
            
            return func(*args, **kwargs)
        return wrapper
    return decorator


def test_rbac():
    """Test RBAC functionality"""
    print("=== RBAC Tests ===\n")
    
    # Test 1: Admin has all permissions
    print("Test 1: Admin Permissions")
    admin_perms = RBACManager.get_user_permissions("ADMIN")
    print(f"  Admin has {len(admin_perms)} permissions")
    assert len(admin_perms) == 13, "Admin should have all permissions"
    assert RBACManager.can_view_firm_analytics("ADMIN")
    assert RBACManager.can_manage_settings("ADMIN")
    print("  ✓ PASSED\n")
    
    # Test 2: Expert limited permissions
    print("Test 2: Expert Permissions")
    expert_perms = RBACManager.get_user_permissions("EXPERT")
    print(f"  Expert has {len(expert_perms)} permissions")
    assert RBACManager.can_generate_reports("EXPERT")
    assert not RBACManager.can_view_firm_analytics("EXPERT")
    assert not RBACManager.can_manage_settings("EXPERT")
    print("  ✓ PASSED\n")
    
    # Test 3: Reviewer read-only
    print("Test 3: Reviewer Permissions")
    reviewer_perms = RBACManager.get_user_permissions("REVIEWER")
    print(f"  Reviewer has {len(reviewer_perms)} permissions")
    assert RBACManager.has_permission("REVIEWER", Permissions.VIEW_ALL_CASES)
    assert not RBACManager.can_generate_reports("REVIEWER")
    print("  ✓ PASSED\n")
    
    # Test 4: Route access
    print("Test 4: Route Access")
    admin_routes = RBACManager.get_accessible_routes("ADMIN")
    expert_routes = RBACManager.get_accessible_routes("EXPERT")
    print(f"  Admin routes: {len(admin_routes)}")
    print(f"  Expert routes: {len(expert_routes)}")
    assert "/admin/settings" in admin_routes
    assert "/admin/settings" not in expert_routes
    print("  ✓ PASSED\n")
    
    print("=== All RBAC Tests Passed ===")


if __name__ == "__main__":
    test_rbac()
