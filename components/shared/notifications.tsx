"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/shared/icons";

interface Notification {
    id: string;
    type: "deadline" | "payment" | "document" | "system";
    title: string;
    message: string;
    time: string;
    read: boolean;
    href?: string;
}

const mockNotifications: Notification[] = [
    {
        id: "1",
        type: "deadline",
        title: "Deadline Approaching",
        message: "Case 1387/2024 - Court appearance in 2 days",
        time: "5 min ago",
        read: false,
        href: "/cases/case-2",
    },
    {
        id: "2",
        type: "payment",
        title: "Payment Received",
        message: "500 OMR received for Case 1356/2024",
        time: "1 hour ago",
        read: false,
        href: "/cases/case-3/finance",
    },
    {
        id: "3",
        type: "document",
        title: "Document Processed",
        message: "OCR completed for Employment Contract.pdf",
        time: "2 hours ago",
        read: true,
        href: "/cases/case-1",
    },
    {
        id: "4",
        type: "system",
        title: "System Update",
        message: "New EOSB calculation formula available",
        time: "Yesterday",
        read: true,
    },
];

function getNotificationIcon(type: Notification["type"]) {
    switch (type) {
        case "deadline":
            return <Icons.timer className="size-4 text-amber-600" />;
        case "payment":
            return <Icons.billing className="size-4 text-green-600" />;
        case "document":
            return <Icons.fileText className="size-4 text-blue-600" />;
        case "system":
            return <Icons.settings className="size-4 text-gray-600" />;
    }
}

export function NotificationsDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState(mockNotifications);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const markAllRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    return (
        <div className="relative">
            {/* Trigger Button */}
            <Button
                variant="ghost"
                size="sm"
                className="relative"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Icons.messages className="size-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </Button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Panel */}
                    <div className="absolute right-0 top-full mt-2 w-80 z-50 rounded-lg border bg-background shadow-lg">
                        {/* Header */}
                        <div className="flex items-center justify-between p-3 border-b">
                            <h3 className="font-semibold">Notifications</h3>
                            {unreadCount > 0 && (
                                <Button variant="ghost" size="sm" onClick={markAllRead}>
                                    Mark all read
                                </Button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-80 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    No notifications
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`flex gap-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer ${!notification.read ? "bg-primary/5" : ""
                                            }`}
                                        onClick={() => {
                                            setNotifications((prev) =>
                                                prev.map((n) =>
                                                    n.id === notification.id ? { ...n, read: true } : n
                                                )
                                            );
                                            if (notification.href) {
                                                setIsOpen(false);
                                            }
                                        }}
                                    >
                                        <div className="shrink-0 mt-0.5">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-medium text-sm">{notification.title}</p>
                                                {!notification.read && (
                                                    <span className="size-2 bg-primary rounded-full shrink-0 mt-1.5" />
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-muted-foreground/70 mt-1">
                                                {notification.time}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-2 border-t">
                            <Button variant="ghost" className="w-full" size="sm">
                                View all notifications
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
