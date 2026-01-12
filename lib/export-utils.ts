// Export utilities for ExpertOS

/**
 * Export data as CSV file
 */
export function exportToCSV(data: Record<string, unknown>[], filename: string) {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(","),
        ...data.map((row) =>
            headers.map((h) => {
                const value = row[h];
                // Escape quotes and wrap in quotes if contains comma
                const strValue = String(value ?? "");
                if (strValue.includes(",") || strValue.includes('"') || strValue.includes("\n")) {
                    return `"${strValue.replace(/"/g, '""')}"`;
                }
                return strValue;
            }).join(",")
        ),
    ].join("\n");

    downloadFile(csvContent, `${filename}.csv`, "text/csv");
}

/**
 * Export data as JSON file
 */
export function exportToJSON(data: unknown, filename: string) {
    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, `${filename}.json`, "application/json");
}

/**
 * Export calculation breakdown as text
 */
export function exportCalculation(calculation: {
    input: Record<string, unknown>;
    calculations: Record<string, number>;
    breakdown: Record<string, string>;
}, filename: string) {
    const lines = [
        "═══════════════════════════════════════════",
        "           EOSB CALCULATION REPORT          ",
        "═══════════════════════════════════════════",
        "",
        "INPUT DATA:",
        "───────────────────────────────────────────",
        ...Object.entries(calculation.input).map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`),
        "",
        "CALCULATIONS:",
        "───────────────────────────────────────────",
        ...Object.entries(calculation.calculations).map(([k, v]) => `  ${k}: ${v} OMR`),
        "",
        "BREAKDOWN:",
        "───────────────────────────────────────────",
        ...Object.entries(calculation.breakdown).map(([k, v]) => `  ${k}: ${v}`),
        "",
        "═══════════════════════════════════════════",
        `Generated: ${new Date().toISOString()}`,
        "Law Reference: Oman Labor Law (RD 35/2003)",
        "═══════════════════════════════════════════",
    ].join("\n");

    downloadFile(lines, `${filename}.txt`, "text/plain");
}

/**
 * Trigger file download
 */
function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // Fallback for older browsers
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand("copy");
            return true;
        } catch {
            return false;
        } finally {
            document.body.removeChild(textarea);
        }
    }
}

/**
 * Generate report filename with timestamp
 */
export function generateFilename(prefix: string, caseNumber?: string): string {
    const date = new Date().toISOString().split("T")[0];
    const parts = [prefix];
    if (caseNumber) parts.push(caseNumber.replace("/", "-"));
    parts.push(date);
    return parts.join("_");
}
