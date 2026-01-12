import { NextRequest, NextResponse } from "next/server";

// Note: Session handling would be imported from your auth setup
// import { getServerSession } from "next-auth/next";
// import { authOptions } from "@/lib/auth";

/**
 * RBAC Middleware
 * Mission 14: Access control for protected routes
 */

// Permission definitions
const PERMISSIONS = {
    ADMIN: [
        "VIEW_ALL_CASES", "EDIT_CASES", "DELETE_CASES",
        "VIEW_FIRM_ANALYTICS", "VIEW_FINANCIAL",
        "MANAGE_USERS", "MANAGE_SETTINGS",
        "VIEW_AUDIT_LOG", "EXPORT_DATA",
        "VIEW_OWN_CASES", "VIEW_REPORTS", "GENERATE_REPORTS", "VIEW_OWN_ANALYTICS"
    ],
    EXPERT: [
        "VIEW_OWN_CASES", "EDIT_CASES",
        "GENERATE_REPORTS", "VIEW_REPORTS",
        "VIEW_OWN_ANALYTICS"
    ],
    REVIEWER: [
        "VIEW_ALL_CASES",
        "VIEW_REPORTS",
        "VIEW_OWN_ANALYTICS"
    ],
    USER: [
        "VIEW_OWN_CASES"
    ]
} as const;

type Role = keyof typeof PERMISSIONS;
type Permission = typeof PERMISSIONS[Role][number];

// Route permission mapping
const ROUTE_PERMISSIONS: Record<string, Permission[]> = {
    "/admin/settings": ["MANAGE_SETTINGS"],
    "/admin/users": ["MANAGE_USERS"],
    "/analytics/firm": ["VIEW_FIRM_ANALYTICS"],
    "/finance": ["VIEW_FINANCIAL"],
    "/cases": ["VIEW_OWN_CASES"],
    "/reports": ["VIEW_REPORTS"],
    "/calculator": ["VIEW_OWN_CASES"],
};

/**
 * Check if user has permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
    return PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if user can access route
 */
export function canAccessRoute(role: Role, path: string): boolean {
    // Find matching route pattern
    for (const [route, permissions] of Object.entries(ROUTE_PERMISSIONS)) {
        if (path.startsWith(route)) {
            return permissions.some(perm => hasPermission(role, perm));
        }
    }
    // Default: allow access if no specific permission required
    return true;
}

/**
 * Get allowed routes for role
 */
export function getAllowedRoutes(role: Role): string[] {
    const allowed: string[] = [];

    for (const [route, permissions] of Object.entries(ROUTE_PERMISSIONS)) {
        if (permissions.some(perm => hasPermission(role, perm))) {
            allowed.push(route);
        }
    }

    return allowed;
}

/**
 * Middleware wrapper for API routes
 */
export function withRBAC(permission: Permission) {
    return async function (
        handler: (req: NextRequest) => Promise<NextResponse>
    ) {
        return async (req: NextRequest) => {
            const session = await getServerSession(authOptions);

            if (!session?.user) {
                return NextResponse.json(
                    { error: "Unauthorized" },
                    { status: 401 }
                );
            }

            const userRole = (session.user as any).role as Role || "USER";

            if (!hasPermission(userRole, permission)) {
                return NextResponse.json(
                    { error: "Forbidden", required: permission },
                    { status: 403 }
                );
            }

            return handler(req);
        };
    };
}

/**
 * React hook helper - check permissions client-side
 */
export function checkClientPermission(role: string, permission: Permission): boolean {
    return hasPermission(role as Role, permission);
}

/**
 * Navigation filter - hide menu items based on role
 */
export function filterNavItems(
    items: Array<{ href: string; label: string }>,
    role: Role
): Array<{ href: string; label: string }> {
    return items.filter(item => canAccessRoute(role, item.href));
}
