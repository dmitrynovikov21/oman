"use client";

import { useState, useEffect } from "react";
import { Icons } from "@/components/shared/icons";

interface ToastProps {
    id: string;
    title: string;
    description?: string;
    type?: "default" | "success" | "error" | "warning";
    duration?: number;
    onClose: (id: string) => void;
}

function Toast({ id, title, description, type = "default", duration = 5000, onClose }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, duration);
        return () => clearTimeout(timer);
    }, [id, duration, onClose]);

    const typeStyles = {
        default: "bg-background border",
        success: "bg-green-50 border-green-200 text-green-900",
        error: "bg-red-50 border-red-200 text-red-900",
        warning: "bg-amber-50 border-amber-200 text-amber-900",
    };

    const icons = {
        default: null,
        success: <Icons.check className="size-5 text-green-600" />,
        error: <Icons.close className="size-5 text-red-600" />,
        warning: <Icons.warning className="size-5 text-amber-600" />,
    };

    return (
        <div
            className={`flex items-start gap-3 p-4 rounded-lg shadow-lg border animate-in slide-in-from-right ${typeStyles[type]}`}
        >
            {icons[type] && <div className="shrink-0">{icons[type]}</div>}
            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{title}</p>
                {description && <p className="text-sm opacity-80 mt-0.5">{description}</p>}
            </div>
            <button onClick={() => onClose(id)} className="shrink-0 opacity-60 hover:opacity-100">
                <Icons.close className="size-4" />
            </button>
        </div>
    );
}

// Toast container and hook
let toastId = 0;

interface ToastItem {
    id: string;
    title: string;
    description?: string;
    type?: "default" | "success" | "error" | "warning";
}

const listeners: Set<(toasts: ToastItem[]) => void> = new Set();
let toasts: ToastItem[] = [];

function notify(listeners: Set<(toasts: ToastItem[]) => void>) {
    listeners.forEach((listener) => listener([...toasts]));
}

export function toast(options: Omit<ToastItem, "id">) {
    const id = `toast-${++toastId}`;
    toasts = [...toasts, { ...options, id }];
    notify(listeners);
}

export function dismissToast(id: string) {
    toasts = toasts.filter((t) => t.id !== id);
    notify(listeners);
}

export function ToastContainer() {
    const [items, setItems] = useState<ToastItem[]>([]);

    useEffect(() => {
        listeners.add(setItems);
        return () => { listeners.delete(setItems); };
    }, []);

    if (items.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
            {items.map((item) => (
                <Toast key={item.id} {...item} onClose={dismissToast} />
            ))}
        </div>
    );
}

// Convenience methods
toast.success = (title: string, description?: string) => toast({ title, description, type: "success" });
toast.error = (title: string, description?: string) => toast({ title, description, type: "error" });
toast.warning = (title: string, description?: string) => toast({ title, description, type: "warning" });
