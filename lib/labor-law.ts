/**
 * Omani Labor Law Calculation Utilities v2.0
 * Based on Royal Decree 35/2003 + Tarik's Calibration
 * 
 * Total Award = EOSB + Notice Pay + Leave Pay + Unfair Dismissal
 * - EOSB: 15/30 days on BASIC salary
 * - Notice: 1 month GROSS salary
 * - Leave: Unused days @ GROSS salary
 */

// Production Constants (extracted from formulas)
const EOSB_DAYS_FIRST_3_YEARS = 15;
const EOSB_DAYS_AFTER_3_YEARS = 30;
const EOSB_THRESHOLD_YEARS = 3;
const DAYS_IN_MONTH = 30;

export interface CalculationInputs {
    basicSalary: number;
    grossSalary: number;
    startDate: Date;
    endDate: Date;
    unusedLeaveDays: number;
    isArticle40: boolean; // Termination for gross misconduct
    unfairDismissalMonths: number;
    noticeMonths: number; // Default 1 month
}

export interface CalculationResult {
    yearsOfService: number;
    monthsOfService: number;
    totalMonths: number;
    totalDays: number;
    exactYears: number;
    eosb: number; // End of Service Benefit (on BASIC)
    noticePay: number; // Notice period (on GROSS)
    leavePay: number; // Untaken leave payment (on GROSS)
    unfairDismissalPay: number;
    totalDue: number;
}

/**
 * Calculates the period of service in years, months, and exact days
 */
export function calculateServicePeriod(startDate: Date, endDate: Date) {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Approximation
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    const totalMonths = years * 12 + months;
    const exactYears = diffDays / 365;

    return { years, months, totalMonths, diffDays, exactYears };
}

/**
 * Calculates End of Service Benefit (Gratuity)
 * Uses BASIC salary only.
 * 
 * Article 39: 15 days for first 3 years, 30 days for subsequent years.
 */
export function calculateEOSB(basicSalary: number, exactYears: number, isArticle40: boolean): number {
    if (isArticle40) return 0;
    if (basicSalary <= 0) return 0;

    let eosb = 0;
    const dailyBasic = basicSalary / DAYS_IN_MONTH;

    if (exactYears <= EOSB_THRESHOLD_YEARS) {
        // 15 days per year for first 3 years
        eosb = dailyBasic * EOSB_DAYS_FIRST_3_YEARS * exactYears;
    } else {
        // First 3 years: 15 days per year
        const first3Years = dailyBasic * EOSB_DAYS_FIRST_3_YEARS * EOSB_THRESHOLD_YEARS;
        // Remaining years: 30 days per year
        const remainingYears = dailyBasic * EOSB_DAYS_AFTER_3_YEARS * (exactYears - EOSB_THRESHOLD_YEARS);
        eosb = first3Years + remainingYears;
    }

    return Math.round(eosb * 1000) / 1000;
}

/**
 * Calculates Notice Period payment
 * Uses GROSS salary.
 * 
 * Article 40 = no notice pay.
 */
export function calculateNoticePay(grossSalary: number, months: number, isArticle40: boolean): number {
    if (isArticle40) return 0;
    if (grossSalary <= 0 || months <= 0) return 0;

    return Math.round(grossSalary * months * 1000) / 1000;
}

/**
 * Calculates payment for unused annual leave
 * Uses GROSS salary (post-service claim).
 * 
 * Leave is inalienable - paid even with Article 40.
 */
export function calculateLeavePay(grossSalary: number, unusedDays: number): number {
    if (grossSalary <= 0 || unusedDays <= 0) return 0;

    const dailyGross = grossSalary / DAYS_IN_MONTH;
    return Math.round(dailyGross * unusedDays * 1000) / 1000;
}

/**
 * Calculates compensation for Unfair Dismissal
 * Article 106: Minimum 3 months, Maximum 12 months Gross Salary
 */
export function calculateUnfairDismissal(grossSalary: number, months: number, isArticle40: boolean): number {
    if (isArticle40) return 0;
    if (grossSalary <= 0 || months <= 0) return 0;

    return Math.round(grossSalary * months * 1000) / 1000;
}

/**
 * Main calculation function
 * Returns complete breakdown including Notice Pay
 */
export function calculateEntitlements(inputs: CalculationInputs): CalculationResult {
    const { years, months, totalMonths, diffDays, exactYears } = calculateServicePeriod(
        inputs.startDate,
        inputs.endDate
    );

    // Default notice to 1 month if not specified
    const noticeMonths = inputs.noticeMonths ?? 1;

    const eosb = calculateEOSB(inputs.basicSalary, exactYears, inputs.isArticle40);
    const noticePay = calculateNoticePay(inputs.grossSalary, noticeMonths, inputs.isArticle40);
    const leavePay = calculateLeavePay(inputs.grossSalary, inputs.unusedLeaveDays);
    const unfairDismissalPay = calculateUnfairDismissal(
        inputs.grossSalary,
        inputs.unfairDismissalMonths,
        inputs.isArticle40
    );

    const totalDue = Math.round((eosb + noticePay + leavePay + unfairDismissalPay) * 1000) / 1000;

    return {
        yearsOfService: years,
        monthsOfService: months,
        totalMonths,
        totalDays: diffDays,
        exactYears: Math.round(exactYears * 1000) / 1000,
        eosb,
        noticePay,
        leavePay,
        unfairDismissalPay,
        totalDue
    };
}
