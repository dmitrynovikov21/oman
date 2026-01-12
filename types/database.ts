// Shared types for ExpertOS
// SQLite doesn't support enums, so we use string literal types

export type UserRole = "SUPER_ADMIN" | "ORG_ADMIN" | "EXPERT" | "USER" | "ADMIN";

export type CaseStatus = "DRAFT" | "ACTIVE" | "REVIEW" | "CLOSED" | "OBJECTION_RECEIVED";

export type DocumentType = "MANDATE" | "CLAIM" | "CONTRACT" | "EVIDENCE" | "OTHER";

export type OcrStatus = "PENDING" | "PROCESSING" | "DONE" | "FAILED";

export type PaymentStatus = "UNPAID" | "PAID";

export type ScenarioType = "LEGAL_DEFAULT" | "PLAINTIFF_CLAIM";
