import Link from "next/link";

import { constructMetadata } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard/header";
import { Icons } from "@/components/shared/icons";

export const metadata = constructMetadata({
    title: "Help – ExpertOS",
    description: "Documentation and support resources.",
});

const quickGuides = [
    {
        title: "Creating a New Case",
        description: "Learn how to set up a new case with documents and parties",
        icon: Icons.add,
        href: "#create-case",
    },
    {
        title: "EOSB Calculation",
        description: "Understand the End of Service Benefits calculation formula",
        icon: Icons.lineChart,
        href: "#eosb-calculation",
    },
    {
        title: "Generating Reports",
        description: "Create professional court-ready expert reports",
        icon: Icons.fileText,
        href: "#reports",
    },
    {
        title: "Meeting Transcription",
        description: "Record and transcribe party meetings with privacy controls",
        icon: Icons.messages,
        href: "#meetings",
    },
];

const faqItems = [
    {
        question: "How is EOSB calculated under Oman Labor Law?",
        answer: "EOSB is calculated as: (Basic Salary / 30) × 15 days × Years of Service for the first 3 years, then (Basic Salary / 30) × 30 days × Years for subsequent years. Article 40 termination (gross misconduct) may result in forfeiture of EOSB.",
    },
    {
        question: "What document formats are supported for OCR?",
        answer: "ExpertOS supports PDF, JPG, PNG, and TIFF formats. The system automatically detects whether native PDF extraction or OCR is needed based on text layer detection.",
    },
    {
        question: "How do I handle confidential party information in reports?",
        answer: "Use the Privacy Toggle in the meeting transcript viewer to switch between masked ([PLAINTIFF], [DEFENDANT]) and original speaker names. The masked version can be exported for court submissions.",
    },
    {
        question: "Can I compare plaintiff claims with my calculations?",
        answer: "Yes, the Calculation Engine includes a Comparison View that shows a side-by-side breakdown of plaintiff claims versus expert calculations with variance analysis.",
    },
];

const keyboardShortcuts = [
    { keys: ["⌘", "K"], description: "Open Quick Search" },
    { keys: ["⌘", "N"], description: "Create New Case" },
    { keys: ["⌘", "S"], description: "Save Current Work" },
    { keys: ["Esc"], description: "Close Modal / Cancel" },
];

export default function HelpPage() {
    return (
        <>
            <DashboardHeader
                heading="Help & Documentation"
                text="Learn how to use ExpertOS effectively"
            >
                <Button variant="outline">
                    <Icons.arrowUpRight className="mr-2 size-4" />
                    Contact Support
                </Button>
            </DashboardHeader>

            {/* Quick Start Guides */}
            <section className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Quick Start Guides</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {quickGuides.map((guide) => (
                        <Link key={guide.title} href={guide.href}>
                            <Card className="h-full hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer">
                                <CardHeader>
                                    <div className="p-2 w-fit rounded-lg bg-primary/10 mb-2">
                                        <guide.icon className="size-5 text-primary" />
                                    </div>
                                    <CardTitle className="text-base">{guide.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription>{guide.description}</CardDescription>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column - FAQ */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Frequently Asked Questions</CardTitle>
                            <CardDescription>Common questions about ExpertOS features</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {faqItems.map((item, index) => (
                                <div key={index} className="pb-4 border-b last:border-0 last:pb-0">
                                    <h3 className="font-semibold mb-2 flex items-start gap-2">
                                        <span className="text-primary mt-0.5">Q:</span>
                                        {item.question}
                                    </h3>
                                    <p className="text-muted-foreground text-sm pl-6">
                                        {item.answer}
                                    </p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Keyboard Shortcuts */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Keyboard Shortcuts</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {keyboardShortcuts.map((shortcut, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                                    <div className="flex gap-1">
                                        {shortcut.keys.map((key, i) => (
                                            <kbd
                                                key={i}
                                                className="px-2 py-1 text-xs bg-muted rounded border font-mono"
                                            >
                                                {key}
                                            </kbd>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Oman Labor Law Reference */}
                    <Card className="border-primary/30 bg-primary/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Icons.bookOpen className="size-5" />
                                Legal Reference
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                ExpertOS calculations are based on Oman Labor Law (Royal Decree 35/2003)
                                and subsequent amendments.
                            </p>
                            <Button variant="outline" className="w-full" size="sm">
                                <Icons.arrowUpRight className="mr-2 size-4" />
                                View Labor Law Reference
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Version Info */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground">ExpertOS Version</p>
                                <p className="text-2xl font-bold">1.0.0</p>
                                <p className="text-xs text-muted-foreground mt-1">Build 2024.01.08</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
