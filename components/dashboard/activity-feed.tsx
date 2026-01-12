"use client";

import { Icons } from "@/components/shared/icons";

interface ActivityItem {
    id: string;
    type: "upload" | "calculation" | "report" | "meeting" | "payment" | "status";
    title: string;
    description: string;
    caseNumber?: string;
    timestamp: string;
}

const mockActivity: ActivityItem[] = [
    {
        id: "1",
        type: "upload",
        title: "Documents uploaded",
        description: "4 new documents added",
        caseNumber: "1409/2024",
        timestamp: "5 min ago",
    },
    {
        id: "2",
        type: "calculation",
        title: "EOSB calculation updated",
        description: "Total: 15,750 OMR",
        caseNumber: "1409/2024",
        timestamp: "1 hour ago",
    },
    {
        id: "3",
        type: "status",
        title: "Case status changed",
        description: "Draft → Active",
        caseNumber: "1387/2024",
        timestamp: "2 hours ago",
    },
    {
        id: "4",
        type: "meeting",
        title: "Meeting transcribed",
        description: "Initial Party Meeting",
        caseNumber: "1409/2024",
        timestamp: "3 hours ago",
    },
    {
        id: "5",
        type: "payment",
        title: "Payment received",
        description: "500 OMR - Report Fee",
        caseNumber: "1356/2024",
        timestamp: "Yesterday",
    },
    {
        id: "6",
        type: "report",
        title: "Report generated",
        description: "Standard Report v1",
        caseNumber: "1298/2024",
        timestamp: "2 days ago",
    },
];

function getActivityIcon(type: ActivityItem["type"]) {
    switch (type) {
        case "upload":
            return <Icons.upload className="size-4" />;
        case "calculation":
            return <Icons.lineChart className="size-4" />;
        case "report":
            return <Icons.fileText className="size-4" />;
        case "meeting":
            return <Icons.messages className="size-4" />;
        case "payment":
            return <Icons.billing className="size-4" />;
        case "status":
            return <Icons.settings className="size-4" />;
    }
}

function getActivityColor(type: ActivityItem["type"]) {
    switch (type) {
        case "upload":
            return "bg-blue-100 text-blue-600";
        case "calculation":
            return "bg-purple-100 text-purple-600";
        case "report":
            return "bg-green-100 text-green-600";
        case "meeting":
            return "bg-amber-100 text-amber-600";
        case "payment":
            return "bg-emerald-100 text-emerald-600";
        case "status":
            return "bg-gray-100 text-gray-600";
    }
}

export function ActivityFeed() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">Recent Activity</h3>
                <span className="text-xs text-muted-foreground">Last 7 days</span>
            </div>

            <div className="space-y-3">
                {mockActivity.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                        {/* Icon */}
                        <div className={`p-2 rounded-full shrink-0 ${getActivityColor(item.type)}`}>
                            {getActivityIcon(item.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <p className="font-medium text-sm">{item.title}</p>
                                <span className="text-xs text-muted-foreground shrink-0">
                                    {item.timestamp}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                                {item.description}
                            </p>
                            {item.caseNumber && (
                                <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                                    Case {item.caseNumber}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* View All Link */}
            <button className="w-full text-center text-sm text-primary hover:underline py-2">
                View all activity →
            </button>
        </div>
    );
}
