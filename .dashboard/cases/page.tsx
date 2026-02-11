import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { format } from "date-fns";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard/header";
import { Icons } from "@/components/shared/icons";

export const metadata = constructMetadata({
    title: "Cases – ExpertOS",
    description: "Manage your judicial cases.",
});

function getStatusColor(status: string) {
    switch (status) {
        case "ACTIVE":
        case "RECEIVED":
            return "bg-emerald-50/80 text-emerald-700 border-emerald-100";
        case "REVIEW":
            return "bg-amber-50/80 text-amber-700 border-amber-100";
        case "DRAFT":
            return "bg-zinc-100/80 text-zinc-600 border-zinc-200";
        case "CLOSED":
            return "bg-zinc-50/80 text-zinc-500 border-zinc-100";
        default:
            return "bg-zinc-100/80 text-zinc-600 border-zinc-200";
    }
}

function CaseCard({ caseData }: { caseData: any }) {
    return (
        <Link href={`/cases/${caseData.id}`}>
            <Card className="bg-white rounded-3xl p-0 border border-zinc-100 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer h-full">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="text-base font-medium text-zinc-900">{caseData.caseNumber}</CardTitle>
                            <CardDescription className="mt-1 text-sm text-zinc-500">{caseData.courtName || "Unspecified Court"}</CardDescription>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(caseData.status)}`}>
                            {caseData.status}
                        </span>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {/* Parties */}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-zinc-400 block text-xs uppercase tracking-wider">Plaintiff</span>
                                <p className="font-medium text-zinc-900 truncate" title={caseData.plaintiffName || "N/A"}>
                                    {caseData.plaintiffName || "N/A"}
                                </p>
                            </div>
                            <div>
                                <span className="text-zinc-400 block text-xs uppercase tracking-wider">Defendant</span>
                                <p className="font-medium text-zinc-900 truncate" title={caseData.defendantName || "N/A"}>
                                    {caseData.defendantName || "N/A"}
                                </p>
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center justify-between pt-3 border-t border-zinc-100 text-sm mt-2">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1 text-zinc-500">
                                    <Icons.fileText className="size-4" />
                                    <span>{caseData._count.documents} docs</span>
                                </div>
                                {caseData.deadlineDate && (
                                    <div className="flex items-center gap-1 text-zinc-500">
                                        <Icons.timer className={`size-4 ${new Date(caseData.deadlineDate) < new Date() ? "text-red-500" : ""
                                            }`} />
                                        <span>Due: {format(new Date(caseData.deadlineDate), 'MMM d, yyyy')}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

// Stats Cards (Connected to DB in a real scenario, keeping simple for now)
async function CaseStats() {
    const stats = [
        { label: "Total Cases", value: await prisma.case.count(), icon: Icons.fileText },
        { label: "Active", value: await prisma.case.count({ where: { status: "ACTIVE" } }), icon: Icons.settings },
        { label: "Drafts", value: await prisma.case.count({ where: { status: "DRAFT" } }), icon: Icons.edit },
        { label: "Due Soon", value: "0", icon: Icons.timer },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, i) => (
                <div key={i} className="bg-white border border-zinc-100 rounded-3xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-zinc-500">{stat.label}</p>
                            <p className="text-3xl font-light text-zinc-900 tracking-tight">{stat.value}</p>
                        </div>
                        <stat.icon className="size-8 text-zinc-400" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default async function CasesPage() {
    const user = await getCurrentUser();

    // Fetch real cases
    const cases = await prisma.case.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            _count: {
                select: { documents: true }
            }
        }
    });

    return (
        <>
            <DashboardHeader
                heading="Cases"
                text="Manage your judicial expert cases"
            >
                <Link href="/cases/new">
                    <Button className="bg-zinc-950 text-white hover:bg-zinc-800 rounded-2xl px-4 py-2 text-sm font-medium shadow-sm transition-transform active:scale-95">
                        <Icons.add className="mr-2 size-4" />
                        New Case
                    </Button>
                </Link>
            </DashboardHeader>

            <Suspense fallback={<div>Loading stats...</div>}>
                <CaseStats />
            </Suspense>

            {/* Cases Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {cases.map((caseData) => (
                    <CaseCard key={caseData.id} caseData={caseData} />
                ))}
            </div>

            {/* Empty State (shown when no cases) */}
            {cases.length === 0 && (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Icons.fileText className="size-12 text-zinc-300 mb-4" />
                        <h3 className="text-lg font-semibold mb-1 text-zinc-900">No cases yet</h3>
                        <p className="text-sm text-zinc-500 mb-4">
                            Create your first case to get started
                        </p>
                        <Link href="/cases/new">
                            <Button className="bg-zinc-950 text-white hover:bg-zinc-800 rounded-2xl px-4 py-2 text-sm font-medium shadow-sm transition-transform active:scale-95">
                                <Icons.add className="mr-2 size-4" />
                                Create Case
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}
        </>
    );
}
