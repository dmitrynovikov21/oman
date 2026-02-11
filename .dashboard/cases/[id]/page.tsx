import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { format } from "date-fns";

import { constructMetadata } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/shared/icons";

export async function generateMetadata({ params }: { params: { id: string } }) {
    const caseData = await prisma.case.findUnique({
        where: { id: params.id },
        select: { caseNumber: true }
    });

    if (!caseData) return constructMetadata({ title: "Case Not Found" });

    return constructMetadata({
        title: `Case ${caseData.caseNumber} – ExpertOS`,
        description: "Case workspace",
    });
}

function getStatusDot(status: string) {
    const colors: Record<string, string> = {
        ACTIVE: "bg-zinc-900",
        RECEIVED: "bg-zinc-900",
        REVIEW: "bg-zinc-400",
        DRAFT: "bg-zinc-300",
        CLOSED: "bg-zinc-200",
    };
    return colors[status] || colors.DRAFT;
}

function DocumentRow({ doc }: { doc: any }) {
    return (
        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 transition-colors group">
            <div className="flex items-center gap-3">
                <Icons.fileText className="size-5 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
                <div>
                    <p className="text-sm font-medium text-zinc-900" title={doc.name}>
                        {doc.name}
                    </p>
                    <p className="text-xs text-zinc-400">
                        {doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : ""}
                        {doc.createdAt && ` • ${format(new Date(doc.createdAt), 'MMM d')}`}
                    </p>
                </div>
            </div>
            <a
                href={`/${doc.filePath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-900">
                    <Icons.arrowUpRight className="size-4" />
                </Button>
            </a>
        </div>
    );
}

export default async function CaseWorkspacePage({ params }: { params: { id: string } }) {
    const caseData = await prisma.case.findUnique({
        where: { id: params.id },
        include: {
            documents: {
                orderBy: { createdAt: 'desc' }
            },
            calculations: true, // Assuming one calculation per case usually, or take latest
            meetings: true,
        }
    });

    if (!caseData) {
        notFound();
    }

    // Default calculations if none exist
    const calculation = caseData.calculations[0] || {
        totalEosb: 0,
        totalLeave: 0,
        unfairMonths: 0
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <Link href="/cases" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors mb-2 inline-block">
                        ← All Cases
                    </Link>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight text-zinc-950">{caseData.caseNumber}</h1>
                        <span className={`w-2 h-2 rounded-full ${getStatusDot(caseData.status)}`} title={caseData.status} />
                    </div>
                    <p className="text-zinc-500 mt-1">{caseData.courtName || "Unspecified Court"}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-zinc-600">
                        <Icons.settings className="mr-2 size-4" />
                        Settings
                    </Button>
                    <Button size="sm" className="bg-zinc-950 hover:bg-zinc-800">
                        <Icons.fileText className="mr-2 size-4" />
                        Generate Report
                    </Button>
                </div>
            </div>

            {/* Navigation Tabs - Vercel Style */}
            <nav className="border-b border-zinc-200">
                <div className="flex gap-6">
                    <Link href={`/cases/${params.id}`} className="pb-3 px-1 text-sm font-medium border-b-2 border-zinc-950 text-zinc-950">
                        Overview
                    </Link>
                    <Link href={`/cases/${params.id}/calculation`} className="pb-3 px-1 text-sm font-medium border-b-2 border-transparent text-zinc-500 hover:text-zinc-900 transition-colors">
                        Calculation
                    </Link>
                    <Link href={`/cases/${params.id}/documents`} className="pb-3 px-1 text-sm font-medium border-b-2 border-transparent text-zinc-500 hover:text-zinc-900 transition-colors">
                        Documents
                    </Link>
                    <Link href={`/cases/${params.id}/meetings`} className="pb-3 px-1 text-sm font-medium border-b-2 border-transparent text-zinc-500 hover:text-zinc-900 transition-colors">
                        Meetings
                    </Link>
                    <Link href={`/cases/${params.id}/report`} className="pb-3 px-1 text-sm font-medium border-b-2 border-transparent text-zinc-500 hover:text-zinc-900 transition-colors">
                        Report
                    </Link>
                    <Link href={`/cases/${params.id}/finance`} className="pb-3 px-1 text-sm font-medium border-b-2 border-transparent text-zinc-500 hover:text-zinc-900 transition-colors">
                        Finance
                    </Link>
                </div>
            </nav>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column - Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Parties Section - Flat Design */}
                    <div className="pt-4">
                        <h3 className="text-xs font-semibold tracking-wider text-zinc-400 uppercase mb-6">Parties</h3>
                        <div className="grid gap-8 md:grid-cols-2">
                            {/* Plaintiff */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">Plaintiff</span>
                                </div>
                                <p className="text-base text-zinc-900 font-medium">{caseData.plaintiffName || "Not specified"}</p>
                                <p className="text-sm text-zinc-500">Omani</p>
                            </div>

                            {/* Defendant */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
                                    <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">Defendant</span>
                                </div>
                                <p className="text-base text-zinc-900 font-medium">{caseData.defendantName || "Not specified"}</p>
                                <p className="text-sm text-zinc-500">Expat</p>
                            </div>
                        </div>
                    </div>

                    {/* Documents Section - Finder Style */}
                    <div className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">Documents ({caseData.documents.length})</h3>
                            <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-900">
                                <Icons.upload className="mr-2 size-4" />
                                Upload
                            </Button>
                        </div>
                        <div className="divide-y divide-zinc-100">
                            {caseData.documents.length > 0 ? (
                                caseData.documents.map((doc) => (
                                    <DocumentRow key={doc.id} doc={doc} />
                                ))
                            ) : (
                                <p className="text-sm text-zinc-400 text-center py-8">No documents uploaded yet</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column - Sidebar */}
                <div className="space-y-6">
                    {/* Timeline Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Timeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Assignment</span>
                                    <span className="font-medium">
                                        {caseData.assignedDate ? format(new Date(caseData.assignedDate), 'MMM d, yyyy') : '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Deadline</span>
                                    <span className="font-medium text-amber-600">
                                        {caseData.deadlineDate ? format(new Date(caseData.deadlineDate), 'MMM d, yyyy') : '-'}
                                    </span>
                                </div>
                                {caseData.deadlineDate && (
                                    <div className="pt-2 border-t">
                                        <div className="flex items-center gap-2">
                                            <Icons.timer className="size-4 text-amber-500" />
                                            <span className="text-sm font-medium">
                                                {/* Simple days calc */}
                                                {Math.ceil((new Date(caseData.deadlineDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Calculation Preview */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Calculation Summary</CardTitle>
                            <CardDescription>Based on current inputs</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Total EOSB</span>
                                    <span className="font-bold text-lg">
                                        {(calculation.totalEosb || 0).toLocaleString()} OMR
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Leave Entitlement</span>
                                    <span className="font-medium">
                                        {(calculation.totalLeave || 0).toLocaleString()} OMR
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Unfair Dismissal</span>
                                    <span className="font-medium">
                                        {calculation.unfairMonths || 0} months
                                    </span>
                                </div>
                                <div className="pt-3 border-t">
                                    <Link href={`/cases/${params.id}/calculation`}>
                                        <Button variant="outline" className="w-full" size="sm">
                                            View Full Calculation
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Link href={`/cases/${params.id}/report`}>
                                <Button variant="outline" className="w-full justify-start" size="sm">
                                    <Icons.fileText className="mr-2 size-4" />
                                    Generate Report
                                </Button>
                            </Link>
                            <Link href={`/cases/${params.id}/finance`}>
                                <Button variant="outline" className="w-full justify-start" size="sm">
                                    <Icons.billing className="mr-2 size-4" />
                                    Create Invoice
                                </Button>
                            </Link>
                            <Link href={`/cases/${params.id}/calculation`}>
                                <Button variant="outline" className="w-full justify-start" size="sm">
                                    <Icons.lineChart className="mr-2 size-4" />
                                    Open Calculator
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
