import { NextRequest, NextResponse } from "next/server";

// User preferences structure
const defaultPreferences = {
    theme: "system",
    language: "en",
    dateFormat: "DD/MM/YYYY",
    currency: "OMR",
    notifications: {
        email: true,
        push: true,
        deadlineReminders: true,
        paymentAlerts: true,
        systemUpdates: false,
    },
    display: {
        compactMode: false,
        showArabic: true,
        defaultView: "list",
    },
    calculation: {
        autoSave: true,
        showFormulas: true,
        defaultTemplate: "standard",
    },
    export: {
        defaultFormat: "pdf",
        includeArabic: true,
        includeBreakdown: true,
    },
};

// Mock user preferences
const mockUserPrefs = {
    "user-1": { ...defaultPreferences, theme: "light" },
};

// GET /api/preferences - Get user preferences
export async function GET(request: NextRequest) {
    try {
        const userId = request.headers.get("x-user-id") || "user-1";
        const prefs = mockUserPrefs[userId as keyof typeof mockUserPrefs] || defaultPreferences;

        return NextResponse.json({ preferences: prefs });
    } catch (error) {
        console.error("Error fetching preferences:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH /api/preferences - Update user preferences
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const userId = request.headers.get("x-user-id") || "user-1";

        // Deep merge with existing preferences
        const currentPrefs = mockUserPrefs[userId as keyof typeof mockUserPrefs] || defaultPreferences;
        const updatedPrefs = { ...currentPrefs, ...body };

        return NextResponse.json({
            preferences: updatedPrefs,
            updated: true,
        });
    } catch (error) {
        console.error("Error updating preferences:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/preferences/reset - Reset to defaults
export async function POST(request: NextRequest) {
    try {
        return NextResponse.json({
            preferences: defaultPreferences,
            reset: true,
        });
    } catch (error) {
        console.error("Error resetting preferences:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
