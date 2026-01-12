"use client";

import { useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/shared/icons";

interface UnpaidWarningModalProps {
    isOpen: boolean;
    onClose: () => void;
    onContinue: () => void;
    onMarkAsPaid: () => void;
    caseNumber: string;
    feeAmount?: number;
    isMarkingPaid?: boolean;
}

/**
 * Warning modal shown when trying to download report for unpaid case.
 * Uses Shadcn AlertDialog as per spec.
 */
export function UnpaidWarningModal({
    isOpen,
    onClose,
    onContinue,
    onMarkAsPaid,
    caseNumber,
    feeAmount,
    isMarkingPaid = false,
}: UnpaidWarningModalProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                        <Icons.warning className="h-6 w-6 text-amber-600" />
                    </div>
                    <AlertDialogTitle className="text-center">
                        Fee Not Paid
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center">
                        The fee for case <strong>{caseNumber}</strong> has not been marked as paid.
                        {feeAmount && (
                            <span className="block mt-2 text-lg font-semibold text-foreground">
                                Outstanding: {feeAmount.toLocaleString()} OMR
                            </span>
                        )}
                        <span className="block mt-2">
                            Are you sure you want to download the report?
                        </span>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <AlertDialogCancel onClick={onClose}>
                        Cancel
                    </AlertDialogCancel>
                    <Button
                        variant="outline"
                        onClick={onMarkAsPaid}
                        disabled={isMarkingPaid}
                        className="border-green-500 text-green-600 hover:bg-green-50"
                    >
                        {isMarkingPaid ? (
                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Icons.check className="mr-2 h-4 w-4" />
                        )}
                        Mark as Paid
                    </Button>
                    <AlertDialogAction onClick={onContinue}>
                        Continue Anyway
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

interface PaymentStatusBadgeProps {
    status: "UNPAID" | "PAID";
    onToggle?: () => void;
    isLoading?: boolean;
}

/**
 * Badge component showing payment status with optional toggle.
 */
export function PaymentStatusBadge({
    status,
    onToggle,
    isLoading = false,
}: PaymentStatusBadgeProps) {
    const isPaid = status === "PAID";

    return (
        <button
            onClick={onToggle}
            disabled={isLoading || !onToggle}
            className={`
                inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium
                transition-colors cursor-pointer
                ${isPaid
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                }
                ${isLoading ? "opacity-50 cursor-wait" : ""}
                ${!onToggle ? "cursor-default" : ""}
            `}
        >
            {isLoading ? (
                <Icons.spinner className="h-3 w-3 animate-spin" />
            ) : isPaid ? (
                <Icons.check className="h-3 w-3" />
            ) : (
                <Icons.timer className="h-3 w-3" />
            )}
            {isPaid ? "Paid" : "Unpaid"}
        </button>
    );
}
