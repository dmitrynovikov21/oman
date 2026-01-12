"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/shared/icons";

// Fee structure
interface FeeItem {
    id: string;
    description: string;
    amount: number;
    status: "PENDING" | "PAID";
    paidDate?: string;
}

const initialFees: FeeItem[] = [
    { id: "1", description: "Expert Report Fee", amount: 500, status: "PAID", paidDate: "2024-01-20" },
    { id: "2", description: "Court Appearance Fee", amount: 150, status: "PENDING" },
    { id: "3", description: "Document Review Fee", amount: 100, status: "PENDING" },
];

export default function FinancePage({ params }: { params: { id: string } }) {
    const [fees, setFees] = useState<FeeItem[]>(initialFees);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedFee, setSelectedFee] = useState<string | null>(null);

    const totalFees = fees.reduce((sum, f) => sum + f.amount, 0);
    const paidAmount = fees.filter(f => f.status === "PAID").reduce((sum, f) => sum + f.amount, 0);
    const pendingAmount = totalFees - paidAmount;

    const markAsPaid = (id: string) => {
        setFees(prev =>
            prev.map(f =>
                f.id === id
                    ? { ...f, status: "PAID" as const, paidDate: new Date().toISOString().split("T")[0] }
                    : f
            )
        );
    };

    const addFee = () => {
        const newId = `fee-${Date.now()}`;
        setFees(prev => [
            ...prev,
            { id: newId, description: "New Fee", amount: 0, status: "PENDING" },
        ]);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <Link href={`/cases/${params.id}`} className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors mb-2 inline-block">
                        ← Back to Case
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Finance & Delivery</h1>
                    <p className="text-zinc-500 mt-1">Case 1409/2024 - Fee Management</p>
                </div>
                <button
                    onClick={addFee}
                    className="bg-zinc-950 text-white px-4 py-2 rounded-xl font-medium hover:bg-zinc-800 transition-all flex items-center gap-2"
                >
                    <Icons.add className="size-4" />
                    Add Fee
                </button>
            </div>

            {/* Warning Banner - Monochrome */}
            {pendingAmount > 0 && (
                <div className="p-4 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center gap-3">
                    <div className="p-2 bg-zinc-900 rounded-full">
                        <Icons.warning className="size-4 text-white" />
                    </div>
                    <div>
                        <p className="font-medium text-zinc-900">Outstanding Balance: {pendingAmount} OMR</p>
                        <p className="text-sm text-zinc-500">
                            Download is available but discouraged until fees are settled.
                        </p>
                    </div>
                </div>
            )}

            {/* Stats - Monochrome */}
            <div className="grid gap-6 md:grid-cols-3">
                <div className="bg-white border border-zinc-100 rounded-3xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-zinc-500">Total Fees</p>
                            <p className="text-3xl font-light text-zinc-900 tracking-tight">{totalFees} OMR</p>
                        </div>
                        <div className="p-3 bg-zinc-100 rounded-full">
                            <Icons.billing className="size-6 text-zinc-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-zinc-100 rounded-3xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-zinc-500">Paid</p>
                            <p className="text-3xl font-light text-zinc-900 tracking-tight">{paidAmount} OMR</p>
                        </div>
                        <div className="p-3 bg-zinc-900 rounded-full">
                            <Icons.check className="size-6 text-white" />
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-zinc-100 rounded-3xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-zinc-500">Pending</p>
                            <p className="text-3xl font-light text-zinc-900 tracking-tight">{pendingAmount} OMR</p>
                        </div>
                        <div className="p-3 bg-zinc-100 rounded-full">
                            <Icons.timer className="size-6 text-zinc-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column - Fees List */}
                <div className="lg:col-span-2">
                    <div className="bg-white border border-zinc-100 rounded-3xl p-6">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-6">Fee Items</h3>
                        <div className="space-y-3">
                            {fees.map((fee) => (
                                <div
                                    key={fee.id}
                                    className={`flex items-center justify-between p-4 rounded-2xl transition-colors ${fee.status === "PAID"
                                            ? "bg-zinc-50 border border-zinc-100"
                                            : "bg-zinc-50 border border-dashed border-zinc-200"
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-full ${fee.status === "PAID" ? "bg-zinc-900" : "bg-zinc-100"
                                            }`}>
                                            {fee.status === "PAID" ? (
                                                <Icons.check className="size-4 text-white" />
                                            ) : (
                                                <Icons.timer className="size-4 text-zinc-500" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-zinc-900">{fee.description}</p>
                                            {fee.paidDate && (
                                                <p className="text-xs text-zinc-400">
                                                    Paid on {fee.paidDate}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <p className="font-medium text-lg text-zinc-900">{fee.amount} OMR</p>
                                        {fee.status === "PENDING" && (
                                            <button
                                                onClick={() => markAsPaid(fee.id)}
                                                className="px-3 py-1.5 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-700 transition-colors"
                                            >
                                                Mark Paid
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column - Actions */}
                <div className="space-y-6">
                    {/* Invoice Generation */}
                    <div className="bg-white border border-zinc-100 rounded-3xl p-6">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Invoice</h3>
                        <div className="space-y-3">
                            <button className="w-full bg-zinc-50 border border-zinc-200 text-zinc-700 rounded-xl py-3 font-medium hover:bg-zinc-100 flex items-center justify-center gap-2 transition-all">
                                <Icons.fileText className="size-4" />
                                Generate Invoice PDF
                            </button>
                            <button className="w-full bg-zinc-50 border border-zinc-200 text-zinc-700 rounded-xl py-3 font-medium hover:bg-zinc-100 flex items-center justify-center gap-2 transition-all">
                                <Icons.copy className="size-4" />
                                Copy Bank Details
                            </button>
                        </div>
                    </div>

                    {/* Delivery Bundle */}
                    <div className="bg-white border border-zinc-100 rounded-3xl p-6">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Delivery Bundle</h3>
                        <p className="text-sm text-zinc-500 mb-4">Prepare final submission package</p>

                        <div className="space-y-2 mb-4">
                            <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-100 cursor-pointer hover:bg-zinc-100 transition-colors">
                                <input type="checkbox" checked readOnly className="rounded border-zinc-300" />
                                <span className="text-sm text-zinc-700">Expert Report</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-100 cursor-pointer hover:bg-zinc-100 transition-colors">
                                <input type="checkbox" checked readOnly className="rounded border-zinc-300" />
                                <span className="text-sm text-zinc-700">Calculation Tables</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-100 cursor-pointer hover:bg-zinc-100 transition-colors">
                                <input type="checkbox" className="rounded border-zinc-300" />
                                <span className="text-sm text-zinc-700">Supporting Documents</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-100 cursor-pointer hover:bg-zinc-100 transition-colors">
                                <input type="checkbox" className="rounded border-zinc-300" />
                                <span className="text-sm text-zinc-700">Expert License Copy</span>
                            </label>
                        </div>

                        <button
                            className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${pendingAmount > 0
                                    ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                                    : "bg-zinc-950 text-white hover:bg-zinc-800"
                                }`}
                            disabled={pendingAmount > 0}
                        >
                            <Icons.fileText className="size-4" />
                            {pendingAmount > 0 ? "Pay to Download" : "Download Bundle"}
                        </button>

                        {pendingAmount > 0 && (
                            <p className="text-xs text-center text-zinc-400 mt-2">
                                Clear pending fees to enable download
                            </p>
                        )}
                    </div>

                    {/* Court Submission */}
                    <div className="bg-white border border-zinc-100 rounded-3xl p-6">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Court Submission</h3>
                        <button className="w-full bg-zinc-100 text-zinc-700 rounded-xl py-3 font-medium hover:bg-zinc-200 flex items-center justify-center gap-2 transition-all">
                            <Icons.upload className="size-4" />
                            Submit to Court Portal
                        </button>
                        <p className="text-xs text-zinc-400 text-center mt-2">
                            Electronically submit to Oman Courts system
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
