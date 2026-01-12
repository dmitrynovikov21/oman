"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/shared/icons";

interface ConfirmDialogProps {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "default" | "danger";
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
}

export function ConfirmDialog({
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "default",
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

            {/* Dialog */}
            <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-lg">
                <div className="flex flex-col items-center text-center">
                    <div
                        className={`p-3 rounded-full mb-4 ${variant === "danger" ? "bg-red-100" : "bg-muted"
                            }`}
                    >
                        {variant === "danger" ? (
                            <Icons.warning className="size-6 text-red-600" />
                        ) : (
                            <Icons.messages className="size-6 text-muted-foreground" />
                        )}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{title}</h3>
                    <p className="text-muted-foreground mb-6">{message}</p>
                    <div className="flex gap-3 w-full">
                        <Button variant="outline" onClick={onCancel} className="flex-1" disabled={loading}>
                            {cancelLabel}
                        </Button>
                        <Button
                            variant={variant === "danger" ? "destructive" : "default"}
                            onClick={handleConfirm}
                            className="flex-1"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Icons.spinner className="size-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                confirmLabel
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}

// Hook for using confirm dialog
export function useConfirmDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [config, setConfig] = useState<Omit<ConfirmDialogProps, "onCancel"> | null>(null);

    const confirm = (options: Omit<ConfirmDialogProps, "onCancel" | "onConfirm">) => {
        return new Promise<boolean>((resolve) => {
            setConfig({
                ...options,
                onConfirm: () => {
                    setIsOpen(false);
                    resolve(true);
                },
            });
            setIsOpen(true);
        });
    };

    const dialog = isOpen && config ? (
        <ConfirmDialog
            {...config}
            onCancel={() => {
                setIsOpen(false);
            }}
        />
    ) : null;

    return { confirm, dialog };
}
