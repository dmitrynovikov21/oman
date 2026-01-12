// Validation utilities for ExpertOS

/**
 * Validate Omani Civil ID (8 digits)
 */
export function validateOmaniCivilId(id: string): boolean {
    return /^\d{8}$/.test(id.replace(/\s/g, ""));
}

/**
 * Validate Omani CR Number (7 digits)
 */
export function validateCRNumber(cr: string): boolean {
    return /^\d{7}$/.test(cr.replace(/\s/g, ""));
}

/**
 * Validate Omani phone number (+968 XXXX XXXX)
 */
export function validateOmaniPhone(phone: string): boolean {
    const cleaned = phone.replace(/\s|-/g, "");
    return /^(\+968|00968|968)?[279]\d{7}$/.test(cleaned);
}

/**
 * Validate email address
 */
export function validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate case number format (XXXX/YYYY)
 */
export function validateCaseNumber(caseNumber: string): boolean {
    return /^\d{1,6}\/\d{4}$/.test(caseNumber);
}

/**
 * Validate IBAN (Oman format: OM + 2 check digits + 3 bank code + 16 account)
 */
export function validateOmaniIBAN(iban: string): boolean {
    const cleaned = iban.replace(/\s/g, "").toUpperCase();
    return /^OM\d{2}[A-Z]{3}\d{16}$/.test(cleaned);
}

/**
 * Validate salary amount (positive number, max 3 decimals)
 */
export function validateSalary(amount: number): boolean {
    return amount >= 0 && amount <= 1000000 && Number.isFinite(amount);
}

/**
 * Validate date range (end date after start date)
 */
export function validateDateRange(startDate: string, endDate: string): boolean {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return end > start;
}

/**
 * Validate file type for upload
 */
export function validateFileType(filename: string, allowedTypes: string[]): boolean {
    const ext = filename.split(".").pop()?.toLowerCase();
    return ext ? allowedTypes.includes(ext) : false;
}

/**
 * Validate file size (in bytes)
 */
export function validateFileSize(size: number, maxSizeMB: number): boolean {
    return size <= maxSizeMB * 1024 * 1024;
}

/**
 * Sanitize text input
 */
export function sanitizeText(text: string): string {
    return text
        .trim()
        .replace(/[<>]/g, "") // Remove HTML tags
        .slice(0, 1000); // Limit length
}

/**
 * Validate Arabic text (contains Arabic characters)
 */
export function containsArabic(text: string): boolean {
    return /[\u0600-\u06FF]/.test(text);
}

/**
 * Format phone number for display
 */
export function formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("968")) {
        return `+968 ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
    }
    return phone;
}
