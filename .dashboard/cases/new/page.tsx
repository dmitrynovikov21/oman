"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/shared/icons";
import { FileUploadZone } from "@/components/dashboard/file-upload-zone";

// Courts for selection (could be fetched from API later)
const courts = [
    { id: 1, name: "Primary Labor Court - Muscat" },
    { id: 2, name: "Seeb Court" },
    { id: 3, name: "Sohar Court" },
    { id: 4, name: "Salalah Court" },
    { id: 5, name: "Nizwa Court" },
];

export default function NewCasePage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // Track the case created during file upload
    const [existingCaseId, setExistingCaseId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        caseNumber: "",
        courtId: "",
        plaintiffName: "",
        plaintiffNationality: "OMANI",
        defendantName: "",
        defendantNationality: "EXPAT",
        assignmentDate: "",
        deadlineDate: "",
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleUploadComplete = (documents: any[]) => {
        if (documents && documents.length > 0) {
            // Capture the case ID from the first document
            // The document object from API matches the Prisma model
            const caseId = documents[0].caseId;
            if (caseId) {
                console.log("Captured existing case ID from upload:", caseId);
                setExistingCaseId(caseId);
            }
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);

        try {
            // Prepare payload
            // Parse year from case number (e.g., "1409/2024" -> 2024)
            const yearMatch = formData.caseNumber.match(/\/(\d{4})$/);
            const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();

            const court = courts.find(c => c.id === parseInt(formData.courtId));

            const payload = {
                caseNumber: formData.caseNumber,
                year: year,
                courtName: court?.name,
                status: "ACTIVE", // Or DRAFT if we want explicit draft phase
                assignedDate: formData.assignmentDate ? new Date(formData.assignmentDate) : undefined,
                deadlineDate: formData.deadlineDate ? new Date(formData.deadlineDate) : undefined,
                plaintiffName: formData.plaintiffName,
                defendantName: formData.defendantName,
                // userId is handled by session in backend if not provided, or associated with current user
            };

            let response;
            if (existingCaseId) {
                // Update existing case
                response = await fetch(`/api/cases/${existingCaseId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                // Create new case
                response = await fetch('/api/cases', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            if (!response.ok) {
                throw new Error("Failed to save case");
            }

            const result = await response.json();
            const finalCaseId = result.case.id;

            // Redirect to the case workspace
            router.push(`/cases/${finalCaseId}`);

        } catch (error) {
            console.error("Error creating case:", error);
            // Ideally show toast notification here
            alert("Failed to create case. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8">
            {/* Minimal Text Stepper */}
            <nav className="flex items-center gap-6 mb-12">
                <span className={step === 1 ? "text-zinc-950 font-semibold" : step > 1 ? "text-zinc-400" : "text-zinc-400"}>
                    Upload
                </span>
                <Icons.chevronRight className="size-4 text-zinc-300" />
                <span className={step === 2 ? "text-zinc-950 font-semibold" : step > 2 ? "text-zinc-400" : "text-zinc-400"}>
                    Details
                </span>
                <Icons.chevronRight className="size-4 text-zinc-300" />
                <span className={step === 3 ? "text-zinc-950 font-semibold" : "text-zinc-400"}>
                    Review
                </span>
            </nav>



            {/* Step 1: Upload Documents */}
            {step === 1 && (
                <div className="space-y-8">
                    <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
                        Upload your documents
                    </h2>
                    <p className="text-zinc-500 -mt-4">
                        Our OCR will extract case details automatically.
                    </p>

                    <FileUploadZone onUploadComplete={handleUploadComplete} />

                    <div className="flex justify-between items-center pt-8 border-t border-zinc-100">
                        <button
                            onClick={() => setStep(2)}
                            className="text-zinc-500 hover:text-zinc-900 px-6 py-2 transition-colors"
                        >
                            Skip for now
                        </button>
                        <button
                            onClick={() => setStep(2)}
                            className="bg-zinc-950 text-white rounded-2xl px-8 py-3 font-medium hover:bg-zinc-800 transition-colors"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Case Details */}
            {step === 2 && (
                <div className="space-y-8">
                    <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
                        Case details
                    </h2>
                    <p className="text-zinc-500 -mt-4">
                        Enter or verify the extracted information.
                    </p>

                    {/* Case Info */}
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="caseNumber" className="text-zinc-700 font-medium">Case Number</Label>
                            <Input
                                id="caseNumber"
                                name="caseNumber"
                                placeholder="e.g., 1409/2024"
                                value={formData.caseNumber}
                                onChange={handleInputChange}
                                className="rounded-xl border-zinc-200 focus:border-zinc-400 focus:ring-0"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="courtId" className="text-zinc-700 font-medium">Court</Label>
                            <select
                                id="courtId"
                                name="courtId"
                                className="w-full h-10 px-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 focus:border-zinc-400 focus:outline-none"
                                value={formData.courtId}
                                onChange={handleInputChange}
                            >
                                <option value="">Select court...</option>
                                {courts.map((court) => (
                                    <option key={court.id} value={court.id}>
                                        {court.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="assignmentDate" className="text-zinc-700 font-medium">Assignment Date</Label>
                            <Input
                                id="assignmentDate"
                                name="assignmentDate"
                                type="date"
                                value={formData.assignmentDate}
                                onChange={handleInputChange}
                                className="rounded-xl border-zinc-200 focus:border-zinc-400 focus:ring-0"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="deadlineDate" className="text-zinc-700 font-medium">Deadline</Label>
                            <Input
                                id="deadlineDate"
                                name="deadlineDate"
                                type="date"
                                value={formData.deadlineDate}
                                onChange={handleInputChange}
                                className="rounded-xl border-zinc-200 focus:border-zinc-400 focus:ring-0"
                            />
                        </div>
                    </div>

                    {/* Plaintiff */}
                    <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100">
                        <h4 className="font-medium text-zinc-900 mb-4">Plaintiff (المدعي)</h4>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="plaintiffName" className="text-zinc-600">Name</Label>
                                <Input
                                    id="plaintiffName"
                                    name="plaintiffName"
                                    placeholder="Full name"
                                    value={formData.plaintiffName}
                                    onChange={handleInputChange}
                                    className="rounded-xl border-zinc-200 bg-white focus:border-zinc-400 focus:ring-0"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="plaintiffNationality" className="text-zinc-600">Nationality</Label>
                                <select
                                    id="plaintiffNationality"
                                    name="plaintiffNationality"
                                    className="w-full h-10 px-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 focus:border-zinc-400 focus:outline-none"
                                    value={formData.plaintiffNationality}
                                    onChange={handleInputChange}
                                >
                                    <option value="OMANI">Omani</option>
                                    <option value="EXPAT">Expat</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Defendant */}
                    <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100">
                        <h4 className="font-medium text-zinc-900 mb-4">Defendant (المدعى عليه)</h4>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="defendantName" className="text-zinc-600">Name</Label>
                                <Input
                                    id="defendantName"
                                    name="defendantName"
                                    placeholder="Company or individual"
                                    value={formData.defendantName}
                                    onChange={handleInputChange}
                                    className="rounded-xl border-zinc-200 bg-white focus:border-zinc-400 focus:ring-0"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="defendantNationality" className="text-zinc-600">Nationality</Label>
                                <select
                                    id="defendantNationality"
                                    name="defendantNationality"
                                    className="w-full h-10 px-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 focus:border-zinc-400 focus:outline-none"
                                    value={formData.defendantNationality}
                                    onChange={handleInputChange}
                                >
                                    <option value="OMANI">Omani</option>
                                    <option value="EXPAT">Expat</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-8 border-t border-zinc-100">
                        <button
                            onClick={() => setStep(1)}
                            className="text-zinc-500 hover:text-zinc-900 px-6 py-2 transition-colors"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => setStep(3)}
                            className="bg-zinc-950 text-white rounded-2xl px-8 py-3 font-medium hover:bg-zinc-800 transition-colors"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Review & Create */}
            {step === 3 && (
                <div className="space-y-8">
                    <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
                        Review & create
                    </h2>
                    <p className="text-zinc-500 -mt-4">
                        Double-check the details before creating.
                    </p>

                    {/* Summary Grid */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-100">
                            <h4 className="text-sm text-zinc-500 mb-1">Case Number</h4>
                            <p className="font-medium text-zinc-900">{formData.caseNumber || "Not specified"}</p>
                        </div>
                        <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-100">
                            <h4 className="text-sm text-zinc-500 mb-1">Court</h4>
                            <p className="font-medium text-zinc-900">
                                {courts.find(c => c.id === parseInt(formData.courtId))?.name || "Not selected"}
                            </p>
                        </div>
                        <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-100">
                            <h4 className="text-sm text-zinc-500 mb-1">Plaintiff</h4>
                            <p className="font-medium text-zinc-900">{formData.plaintiffName || "Not specified"}</p>
                            <p className="text-sm text-zinc-400">{formData.plaintiffNationality}</p>
                        </div>
                        <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-100">
                            <h4 className="text-sm text-zinc-500 mb-1">Defendant</h4>
                            <p className="font-medium text-zinc-900">{formData.defendantName || "Not specified"}</p>
                            <p className="text-sm text-zinc-400">{formData.defendantNationality}</p>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-8 border-t border-zinc-100">
                        <button
                            onClick={() => setStep(2)}
                            className="text-zinc-500 hover:text-zinc-900 px-6 py-2 transition-colors"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="bg-zinc-950 text-white rounded-2xl px-8 py-3 font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <Icons.spinner className="size-4 animate-spin" />
                                    {existingCaseId ? "Updating..." : "Creating..."}
                                </span>
                            ) : (
                                existingCaseId ? "Update Case" : "Create Case"
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
