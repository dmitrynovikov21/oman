import Link from "next/link";

import { constructMetadata } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard/header";
import { Icons } from "@/components/shared/icons";

export const metadata = constructMetadata({
    title: "Report Templates – ExpertOS",
    description: "Manage report templates.",
});

const templates = [
    {
        id: "standard",
        name: "Standard EOSB Report",
        nameAr: "تقرير نهاية الخدمة القياسي",
        description: "Comprehensive report with all standard sections for labor court submissions",
        sections: 7,
        usageCount: 145,
        isDefault: true,
        lastModified: "2024-01-15",
    },
    {
        id: "detailed",
        name: "Detailed Analysis Report",
        nameAr: "تقرير التحليل المفصل",
        description: "Extended report with document analysis, timeline, and comparison sections",
        sections: 10,
        usageCount: 42,
        isDefault: false,
        lastModified: "2024-01-10",
    },
    {
        id: "summary",
        name: "Summary Report",
        nameAr: "تقرير ملخص",
        description: "Brief report with essential information only",
        sections: 5,
        usageCount: 28,
        isDefault: false,
        lastModified: "2024-01-05",
    },
    {
        id: "appeal",
        name: "Appeal Response Report",
        nameAr: "تقرير رد الاستئناف",
        description: "Specialized template for appeal case responses",
        sections: 8,
        usageCount: 12,
        isDefault: false,
        lastModified: "2024-01-02",
    },
];

export default function TemplatesPage() {
    return (
        <>
            <DashboardHeader
                heading="Report Templates"
                text="Manage and customize report templates"
            >
                <Button>
                    <Icons.add className="mr-2 size-4" />
                    Create Template
                </Button>
            </DashboardHeader>

            <div className="grid gap-4 md:grid-cols-2">
                {templates.map((template) => (
                    <Card key={template.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        {template.name}
                                        {template.isDefault && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                                Default
                                            </span>
                                        )}
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                        {template.nameAr}
                                    </CardDescription>
                                </div>
                                <Button variant="ghost" size="sm">
                                    <Icons.settings className="size-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                {template.description}
                            </p>
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex gap-4">
                                    <span className="text-muted-foreground">
                                        <strong>{template.sections}</strong> sections
                                    </span>
                                    <span className="text-muted-foreground">
                                        <strong>{template.usageCount}</strong> uses
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm">
                                        Preview
                                    </Button>
                                    <Button variant="outline" size="sm">
                                        Edit
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Template Sections */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Available Sections</CardTitle>
                    <CardDescription>Sections that can be included in report templates</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 md:grid-cols-3">
                        {[
                            { id: "header", name: "Report Header", required: true },
                            { id: "parties", name: "Parties Information", required: true },
                            { id: "employment", name: "Employment Details", required: false },
                            { id: "documents", name: "Documents List", required: false },
                            { id: "claims", name: "Plaintiff Claims", required: false },
                            { id: "calculation", name: "EOSB Calculation", required: true },
                            { id: "comparison", name: "Claims Comparison", required: false },
                            { id: "timeline", name: "Case Timeline", required: false },
                            { id: "opinion", name: "Expert Opinion", required: true },
                            { id: "signature", name: "Signature Block", required: true },
                        ].map((section) => (
                            <div
                                key={section.id}
                                className="flex items-center justify-between p-3 rounded-lg border"
                            >
                                <div className="flex items-center gap-2">
                                    <Icons.fileText className="size-4 text-muted-foreground" />
                                    <span className="text-sm">{section.name}</span>
                                </div>
                                {section.required && (
                                    <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                                        Required
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
