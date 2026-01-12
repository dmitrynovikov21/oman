import Link from "next/link";

import { constructMetadata } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard/header";
import { Icons } from "@/components/shared/icons";

export const metadata = constructMetadata({
    title: "Reports – ExpertOS",
    description: "View and manage generated reports.",
});

const mockReports = [
    {
        id: "report-1",
        caseNumber: "1409/2024",
        title: "Expert Report - Case 1409/2024",
        template: "Standard EOSB Report",
        status: "APPROVED",
        version: 3,
        createdAt: "2024-01-20",
        submittedAt: "2024-01-22",
        size: "245 KB",
    },
    {
        id: "report-2",
        caseNumber: "1387/2024",
        title: "Expert Report - Case 1387/2024",
        template: "Detailed Analysis Report",
        status: "DRAFT",
        version: 1,
        createdAt: "2024-01-18",
        submittedAt: null,
        size: "189 KB",
    },
    {
        id: "report-3",
        caseNumber: "1356/2024",
        title: "Expert Report - Case 1356/2024",
        template: "Standard EOSB Report",
        status: "REVIEW",
        version: 2,
        createdAt: "2024-01-15",
        submittedAt: null,
        size: "312 KB",
    },
];

function getStatusStyle(status: string) {
    switch (status) {
        case "APPROVED": return "bg-zinc-900 text-white";
        case "DRAFT": return "bg-zinc-100 text-zinc-600";
        case "REVIEW": return "bg-zinc-200 text-zinc-700";
        case "SUBMITTED": return "bg-zinc-700 text-white";
        default: return "bg-zinc-100 text-zinc-600";
    }
}

export default function ReportsPage() {
    return (
        <>
            <DashboardHeader
                heading="Reports"
                text="View and manage generated expert reports"
            >
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Icons.arrowUpRight className="mr-2 size-4" />
                        Export All
                    </Button>
                    <Link href="/templates">
                        <Button variant="outline">
                            <Icons.settings className="mr-2 size-4" />
                            Templates
                        </Button>
                    </Link>
                </div>
            </DashboardHeader>

            {/* Stats - Monochrome */}
            <div className="grid gap-6 md:grid-cols-4 mb-8">
                <div className="bg-white border border-zinc-100 rounded-3xl p-6">
                    <p className="text-3xl font-light text-zinc-900 tracking-tight">24</p>
                    <p className="text-sm text-zinc-500">Total Reports</p>
                </div>
                <div className="bg-white border border-zinc-100 rounded-3xl p-6">
                    <p className="text-3xl font-light text-zinc-900 tracking-tight">18</p>
                    <p className="text-sm text-zinc-500">Submitted</p>
                </div>
                <div className="bg-white border border-zinc-100 rounded-3xl p-6">
                    <p className="text-3xl font-light text-zinc-900 tracking-tight">3</p>
                    <p className="text-sm text-zinc-500">Under Review</p>
                </div>
                <div className="bg-white border border-zinc-100 rounded-3xl p-6">
                    <p className="text-3xl font-light text-zinc-900 tracking-tight">3</p>
                    <p className="text-sm text-zinc-500">Drafts</p>
                </div>
            </div>

            {/* Reports List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>All Reports</CardTitle>
                            <CardDescription>Generated expert reports</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                                Filter
                            </Button>
                            <Button variant="outline" size="sm">
                                Sort
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {mockReports.map((report) => (
                            <div
                                key={report.id}
                                className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 hover:bg-zinc-100 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 rounded-xl bg-zinc-100">
                                        <Icons.fileText className="size-5 text-zinc-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-zinc-900">{report.title}</p>
                                        <div className="flex items-center gap-2 text-sm text-zinc-500">
                                            <span>{report.template}</span>
                                            <span>•</span>
                                            <span>v{report.version}</span>
                                            <span>•</span>
                                            <span>{report.size}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusStyle(report.status)}`}>
                                        {report.status}
                                    </span>
                                    <span className="text-sm text-zinc-400">
                                        {report.createdAt}
                                    </span>
                                    <div className="flex gap-1">
                                        <button className="p-2 hover:bg-zinc-200 rounded-lg transition-colors">
                                            <Icons.arrowUpRight className="size-4 text-zinc-600" />
                                        </button>
                                        <button className="p-2 hover:bg-zinc-200 rounded-lg transition-colors">
                                            <Icons.copy className="size-4 text-zinc-600" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
