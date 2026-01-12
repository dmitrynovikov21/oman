"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/shared/icons";
import { calculateEntitlements, CalculationResult } from "@/lib/labor-law";

// Types
interface SalaryComponent {
    id: string;
    name: string;
    amount: number;
    isGrossPart: boolean;
}

// Initial salary components
const initialComponents: SalaryComponent[] = [
    { id: "basic", name: "Basic Salary", amount: 800, isGrossPart: true },
    { id: "housing", name: "Housing Allowance", amount: 200, isGrossPart: true },
    { id: "transport", name: "Transport Allowance", amount: 100, isGrossPart: true },
    { id: "food", name: "Food Allowance", amount: 50, isGrossPart: true },
];

export default function CalculationPage() {
    const params = useParams();
    const caseId = params.id as string;

    // State
    const [components, setComponents] = useState<SalaryComponent[]>(initialComponents);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]); // Today default or load
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [unusedLeaveDays, setUnusedLeaveDays] = useState(31);
    const [isArticle40, setIsArticle40] = useState(false);
    const [unfairDismissalMonths, setUnfairDismissalMonths] = useState(0);
    const [noticeMonths, setNoticeMonths] = useState(1); // Default 1 month notice
    const [result, setResult] = useState<CalculationResult | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Initial load
    useEffect(() => {
        async function loadData() {
            try {
                const response = await fetch(`/api/cases/${caseId}/calculations`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.calculation && data.calculation.detailsJson) {
                        const saved = JSON.parse(data.calculation.detailsJson);
                        if (saved.inputs) {
                            setComponents(saved.inputs.components || initialComponents);
                            setStartDate(saved.inputs.startDate || new Date().toISOString().split('T')[0]);
                            setEndDate(saved.inputs.endDate || new Date().toISOString().split('T')[0]);
                            setUnusedLeaveDays(saved.inputs.unusedLeaveDays || 0);
                            setIsArticle40(saved.inputs.isArticle40 || false);
                            setUnfairDismissalMonths(saved.inputs.unfairDismissalMonths || 0);
                        }
                    } else {
                        // Set defaults based on case data (could fetch case details here to get assignment date etc)
                        setStartDate("2020-01-01");
                    }
                }
            } catch (error) {
                console.error("Failed to load calculation:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [caseId]);

    // Calculate totals
    const grossSalary = components
        .filter(c => c.isGrossPart)
        .reduce((sum, c) => sum + c.amount, 0);

    const basicSalary = components.find(c => c.id === "basic")?.amount || 0;

    // Update component amount
    const updateComponent = (id: string, amount: number) => {
        setComponents(prev =>
            prev.map(c => (c.id === id ? { ...c, amount } : c))
        );
    };

    // Add new component
    const addComponent = () => {
        const newId = `custom-${Date.now()}`;
        setComponents(prev => [
            ...prev,
            { id: newId, name: "New Allowance", amount: 0, isGrossPart: true },
        ]);
    };

    // Remove component
    const removeComponent = (id: string) => {
        if (id === "basic") return; // Can't remove basic salary
        setComponents(prev => prev.filter(c => c.id !== id));
    };

    // Run calculations whenever inputs change
    useEffect(() => {
        const inputs = {
            basicSalary,
            grossSalary,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            unusedLeaveDays,
            isArticle40,
            unfairDismissalMonths,
            noticeMonths
        };

        const res = calculateEntitlements(inputs);
        setResult(res);
    }, [components, startDate, endDate, unusedLeaveDays, isArticle40, unfairDismissalMonths, basicSalary, grossSalary]);

    // Save functionality
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload = {
                inputs: {
                    components,
                    startDate,
                    endDate,
                    unusedLeaveDays,
                    isArticle40,
                    unfairDismissalMonths
                },
                results: result
            };

            const response = await fetch(`/api/cases/${caseId}/calculations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("Failed to save");

            // Show toast/feedback?
            // console.log("Saved successfully");
        } catch (error) {
            console.error("Error saving:", error);
            alert("Failed to save calculation");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center">Loading calculation data...</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <Link href={`/cases/${caseId}`} className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors mb-2 inline-block">
                        ← Back to Case
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Calculation Engine</h1>
                    <p className="text-zinc-500 mt-1">EOSB & Entitlements Calculator</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving} className="text-zinc-600">
                        {isSaving ? (
                            <Icons.spinner className="mr-2 size-4 animate-spin" />
                        ) : (
                            <Icons.copy className="mr-2 size-4" />
                        )}
                        {isSaving ? "Saving..." : "Save Scenario"}
                    </Button>
                    <Button size="sm" className="bg-zinc-950 hover:bg-zinc-800">
                        <Icons.fileText className="mr-2 size-4" />
                        Export to Report
                    </Button>
                </div>
            </div>

            {/* Main Grid - 2/3 + 1/3 Layout */}
            <div className="flex gap-8">
                {/* Left Column - Inputs (2/3) */}
                <div className="w-2/3 space-y-8">
                    {/* Salary Components */}
                    <div>
                        <h3 className="text-xs font-semibold tracking-wider text-zinc-400 uppercase mb-4">Salary Components</h3>
                        <p className="text-sm text-zinc-500 mb-6">Monthly salary breakdown</p>

                        <div className="space-y-3">
                            {components.map((comp) => (
                                <div
                                    key={comp.id}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-100"
                                >
                                    <div className="flex-1">
                                        <Input
                                            value={comp.name}
                                            onChange={(e) =>
                                                setComponents(prev =>
                                                    prev.map(c =>
                                                        c.id === comp.id ? { ...c, name: e.target.value } : c
                                                    )
                                                )
                                            }
                                            className="font-medium bg-transparent border-0 p-0 h-auto text-zinc-900 focus-visible:ring-0"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Input
                                            type="number"
                                            value={comp.amount}
                                            onChange={(e) =>
                                                updateComponent(comp.id, parseFloat(e.target.value) || 0)
                                            }
                                            className="w-28 text-right bg-white border-0 ring-1 ring-zinc-200 rounded-xl px-4 py-2.5 text-zinc-900 focus:ring-2 focus:ring-zinc-950 transition-all"
                                        />
                                        <span className="text-sm text-zinc-400 w-10">OMR</span>
                                        <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none text-zinc-500">
                                            <input
                                                type="checkbox"
                                                checked={comp.isGrossPart}
                                                onChange={(e) =>
                                                    setComponents(prev =>
                                                        prev.map(c =>
                                                            c.id === comp.id
                                                                ? { ...c, isGrossPart: e.target.checked }
                                                                : c
                                                        )
                                                    )
                                                }
                                                className="rounded border-zinc-300"
                                            />
                                            Gross
                                        </label>
                                        {comp.id !== "basic" && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeComponent(comp.id)}
                                                className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-600"
                                            >
                                                <Icons.trash className="size-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Add Component Button */}
                            <button
                                onClick={addComponent}
                                className="w-full border border-dashed border-zinc-300 text-zinc-500 rounded-xl py-3 hover:border-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-all flex items-center justify-center gap-2"
                            >
                                <Icons.add className="size-4" />
                                Add Component
                            </button>

                            {/* Totals */}
                            <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
                                <span className="font-medium text-zinc-900">Gross Salary</span>
                                <span className="text-xl font-semibold text-zinc-950">{grossSalary.toFixed(3)} OMR</span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-zinc-500">
                                <span>Basic Salary</span>
                                <span>{basicSalary.toFixed(3)} OMR</span>
                            </div>
                        </div>
                    </div>

                    {/* Service Period */}
                    <div>
                        <h3 className="text-xs font-semibold tracking-wider text-zinc-400 uppercase mb-4">Service Period</h3>
                        <p className="text-sm text-zinc-500 mb-6">Employment duration for EOSB calculation</p>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-600 block">Start Date</label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-zinc-50 border-0 ring-1 ring-zinc-200 rounded-xl px-4 py-3 text-zinc-900 focus:ring-2 focus:ring-zinc-950 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-600 block">End Date (Termination)</label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-zinc-50 border-0 ring-1 ring-zinc-200 rounded-xl px-4 py-3 text-zinc-900 focus:ring-2 focus:ring-zinc-950 transition-all"
                                />
                            </div>
                        </div>
                        {result && (
                            <div className="mt-4 p-4 rounded-2xl bg-zinc-100 border border-zinc-200">
                                <p className="text-sm font-medium text-zinc-900">
                                    Service Duration: {result.yearsOfService} years, {result.monthsOfService} months
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Calculation Options */}
                    <div>
                        <h3 className="text-xs font-semibold tracking-wider text-zinc-400 uppercase mb-4">Calculation Options</h3>
                        <p className="text-sm text-zinc-500 mb-6">Special conditions and adjustments</p>

                        <div className="space-y-3">
                            {/* Article 40 Toggle */}
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                                <div>
                                    <p className="font-medium text-zinc-900">Article 40 (Gross Misconduct)</p>
                                    <p className="text-sm text-zinc-500">If checked, EOSB and unfair dismissal are zeroed</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isArticle40}
                                        onChange={(e) => setIsArticle40(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-zinc-950/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-950"></div>
                                </label>
                            </div>

                            {/* Unused Leave */}
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                                <div>
                                    <p className="font-medium text-zinc-900">Unused Annual Leave</p>
                                    <p className="text-sm text-zinc-500">Days to be compensated</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        value={unusedLeaveDays}
                                        onChange={(e) => setUnusedLeaveDays(parseInt(e.target.value) || 0)}
                                        className="w-20 text-right bg-white border-0 ring-1 ring-zinc-200 rounded-xl px-3 py-2 text-zinc-900 focus:ring-2 focus:ring-zinc-950"
                                    />
                                    <span className="text-sm text-zinc-400">days</span>
                                </div>
                            </div>

                            {/* Notice Period */}
                            {!isArticle40 && (
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                                    <div>
                                        <p className="font-medium text-zinc-900">Notice Period</p>
                                        <p className="text-sm text-zinc-500">Months of notice pay</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            min={0}
                                            max={3}
                                            value={noticeMonths}
                                            onChange={(e) => setNoticeMonths(Math.min(3, Math.max(0, parseInt(e.target.value) || 0)))}
                                            className="w-20 text-right bg-white border-0 ring-1 ring-zinc-200 rounded-xl px-3 py-2 text-zinc-900 focus:ring-2 focus:ring-zinc-950"
                                        />
                                        <span className="text-sm text-zinc-400">months</span>
                                    </div>
                                </div>
                            )}

                            {/* Unfair Dismissal */}
                            {!isArticle40 && (
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                                    <div>
                                        <p className="font-medium text-zinc-900">Unfair Dismissal Compensation</p>
                                        <p className="text-sm text-zinc-500">Number of months (3-12 per court discretion)</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            min={0}
                                            max={12}
                                            value={unfairDismissalMonths}
                                            onChange={(e) =>
                                                setUnfairDismissalMonths(
                                                    Math.min(12, Math.max(0, parseInt(e.target.value) || 0))
                                                )
                                            }
                                            className="w-20 text-right bg-white border-0 ring-1 ring-zinc-200 rounded-xl px-3 py-2 text-zinc-900 focus:ring-2 focus:ring-zinc-950"
                                        />
                                        <span className="text-sm text-zinc-400">months</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column - Results (1/3) */}
                <div className="w-1/3 sticky top-6 h-fit space-y-6">
                    {/* Dark Results Summary */}
                    <div className="bg-zinc-900 text-white rounded-3xl p-8 shadow-2xl shadow-zinc-200">
                        <h3 className="text-sm font-medium text-zinc-400 mb-6">Calculation Results</h3>

                        {result && (
                            <>
                                {/* Total Amount - Hero */}
                                <div className="mb-8">
                                    <p className="text-5xl font-light tracking-tight text-white mb-2">
                                        {result.totalDue.toLocaleString()}
                                    </p>
                                    <p className="text-zinc-400 text-sm">OMR Total Due</p>
                                </div>

                                {/* Line Items */}
                                <div className="space-y-0">
                                    <div className="text-zinc-400 text-sm flex justify-between py-3 border-b border-zinc-800">
                                        <span>End of Service Benefit</span>
                                        <span className="text-white font-medium">{result.eosb.toLocaleString()} OMR</span>
                                    </div>
                                    {!isArticle40 && noticeMonths > 0 && (
                                        <div className="text-zinc-400 text-sm flex justify-between py-3 border-b border-zinc-800">
                                            <span>Notice Pay ({noticeMonths}m)</span>
                                            <span className="text-white font-medium">{result.noticePay.toLocaleString()} OMR</span>
                                        </div>
                                    )}
                                    <div className="text-zinc-400 text-sm flex justify-between py-3 border-b border-zinc-800">
                                        <span>Leave Entitlement ({unusedLeaveDays}d)</span>
                                        <span className="text-white font-medium">{result.leavePay.toLocaleString()} OMR</span>
                                    </div>
                                    {!isArticle40 && unfairDismissalMonths > 0 && (
                                        <div className="text-zinc-400 text-sm flex justify-between py-3 border-b border-zinc-800 last:border-0">
                                            <span>Unfair Dismissal ({unfairDismissalMonths}m)</span>
                                            <span className="text-white font-medium">{result.unfairDismissalPay.toLocaleString()} OMR</span>
                                        </div>
                                    )}
                                </div>

                                {isArticle40 && (
                                    <p className="text-xs text-zinc-400 mt-4">
                                        ⚠️ Article 40 applied - EOSB zeroed
                                    </p>
                                )}
                            </>
                        )}
                    </div>

                    {/* Formula Reference */}
                    <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100">
                        <h4 className="text-xs font-semibold tracking-wider text-zinc-400 uppercase mb-4">Formula Reference</h4>
                        <div className="text-xs text-zinc-500 space-y-2">
                            <p><span className="text-zinc-700 font-medium">EOSB (≤3y):</span> Basic ÷ 30 × 15 × Years</p>
                            <p><span className="text-zinc-700 font-medium">EOSB (&gt;3y):</span> First 3y + (Basic ÷ 30 × 30 × Remaining)</p>
                            <p><span className="text-zinc-700 font-medium">Leave:</span> Gross ÷ 30 × Unused Days</p>
                            <p><span className="text-zinc-700 font-medium">Unfair Dismissal:</span> Gross × Months (3-12)</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
