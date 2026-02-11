import { NextRequest, NextResponse } from "next/server";

// Master Courts list for ExpertOS (Oman Judicial System)
const courts = [
    // Muscat Region
    { id: 1, name: "Primary Labor Court - Muscat", nameAr: "محكمة العمل الابتدائية - مسقط", region: "Muscat", type: "LABOR" },
    { id: 2, name: "Muscat Primary Court", nameAr: "المحكمة الابتدائية بمسقط", region: "Muscat", type: "PRIMARY" },
    { id: 3, name: "Muscat Appeals Court", nameAr: "محكمة الاستئناف بمسقط", region: "Muscat", type: "APPEALS" },

    // Seeb Region
    { id: 4, name: "Seeb Court", nameAr: "محكمة السيب", region: "Seeb", type: "PRIMARY" },
    { id: 5, name: "Seeb Labor Court", nameAr: "محكمة العمل بالسيب", region: "Seeb", type: "LABOR" },

    // Sohar Region
    { id: 6, name: "Sohar Court", nameAr: "محكمة صحار", region: "Sohar", type: "PRIMARY" },
    { id: 7, name: "Sohar Labor Court", nameAr: "محكمة العمل بصحار", region: "Sohar", type: "LABOR" },

    // Salalah Region
    { id: 8, name: "Salalah Court", nameAr: "محكمة صلالة", region: "Salalah", type: "PRIMARY" },
    { id: 9, name: "Salalah Labor Court", nameAr: "محكمة العمل بصلالة", region: "Salalah", type: "LABOR" },

    // Nizwa Region
    { id: 10, name: "Nizwa Court", nameAr: "محكمة نزوى", region: "Nizwa", type: "PRIMARY" },

    // Sur Region
    { id: 11, name: "Sur Court", nameAr: "محكمة صور", region: "Sur", type: "PRIMARY" },

    // Barka Region
    { id: 12, name: "Barka Court", nameAr: "محكمة بركاء", region: "Barka", type: "PRIMARY" },

    // Supreme Court
    { id: 13, name: "Supreme Court", nameAr: "المحكمة العليا", region: "Muscat", type: "SUPREME" },
];

// GET /api/courts - List all courts
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get("region");
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    let filtered = courts;

    // Filter by region
    if (region) {
        filtered = filtered.filter((c) => c.region.toLowerCase() === region.toLowerCase());
    }

    // Filter by type
    if (type) {
        filtered = filtered.filter((c) => c.type === type.toUpperCase());
    }

    // Search by name
    if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(
            (c) =>
                c.name.toLowerCase().includes(searchLower) ||
                c.nameAr.includes(search) ||
                c.region.toLowerCase().includes(searchLower)
        );
    }

    return NextResponse.json({
        courts: filtered,
        total: filtered.length,
        regions: Array.from(new Set(courts.map((c) => c.region))),
        types: Array.from(new Set(courts.map((c) => c.type))),
    });
}
