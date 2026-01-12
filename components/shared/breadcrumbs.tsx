"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "@/components/shared/icons";

interface BreadcrumbItem {
    label: string;
    href?: string;
}

// Route to breadcrumb mapping
const routeLabels: Record<string, string> = {
    dashboard: "Dashboard",
    cases: "Cases",
    new: "New Case",
    calculation: "Calculation",
    meetings: "Meetings",
    report: "Report",
    finance: "Finance",
    calendar: "Calendar",
    analytics: "Analytics",
    help: "Help",
    settings: "Settings",
    billing: "Billing",
};

export function Breadcrumbs() {
    const pathname = usePathname();

    if (!pathname || pathname === "/") return null;

    const segments = pathname.split("/").filter(Boolean);

    const breadcrumbs: BreadcrumbItem[] = segments.map((segment, index) => {
        const href = "/" + segments.slice(0, index + 1).join("/");

        // Check if it's a case ID (starts with "case-" or is alphanumeric)
        const isCaseId = segment.startsWith("case-") || /^[a-zA-Z0-9-]+$/.test(segment) && index === 1 && segments[0] === "cases";

        let label = routeLabels[segment] || segment;

        if (isCaseId) {
            // Format case ID nicely
            label = `Case ${segment.replace("case-", "#")}`;
        }

        return { label, href };
    });

    // Don't show breadcrumbs for single-level routes
    if (breadcrumbs.length <= 1) return null;

    return (
        <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-4">
            <Link href="/" className="hover:text-foreground transition-colors">
                <Icons.home className="size-4" />
            </Link>
            {breadcrumbs.map((item, index) => (
                <div key={item.href} className="flex items-center">
                    <Icons.chevronRight className="size-4 mx-1" />
                    {index === breadcrumbs.length - 1 ? (
                        <span className="font-medium text-foreground">{item.label}</span>
                    ) : (
                        <Link
                            href={item.href || "#"}
                            className="hover:text-foreground transition-colors"
                        >
                            {item.label}
                        </Link>
                    )}
                </div>
            ))}
        </nav>
    );
}
