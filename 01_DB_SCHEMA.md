# EXPERTOS — DATABASE SCHEMA SPECIFICATION (v1.1)

## 1. CORE & ACCESS (FOUNDATION)

### `organizations`
*Expert Firm (Tenant).*
* `id` (UUID, PK)
* `name` (String) — e.g., "Al-Adl Experts"
* `settings` (JSONB) — Global defaults.
    * `increment_base`: "GROSS" | "BASIC"
    * `eosb_rule`: "FIXED_30"
* `bank_details_template` (Text) — **NEW:** Bank info for "Fee Request Letter" (e.g., "Bank Muscat, Account...").
* `created_at` (Timestamp)

### `users`
*System Users (Experts, Admins).*
* `id` (UUID, PK)
* `organization_id` (UUID, FK) — **Isolation Key**
* `email` (String, Unique)
* `password_hash` (String)
* `role` (Enum: `SUPER_ADMIN`, `ORG_ADMIN`, `EXPERT`)
* `full_name` (String)
* `license_number` (String) — **NEW:** For Report Footer.
* `signature_image_path` (String) — **NEW:** Path to signature scan for auto-signing.
* `is_active` (Boolean)

---

## 2. CASE MANAGEMENT (INTAKE)

### `master_courts`
*Lookup Table (System Wide).*
* `id` (Serial, PK)
* `name_ar` (String)
* `name_en` (String)
* `region` (String)

### `cases`
*The main entity.*
* `id` (UUID, PK)
* `organization_id` (UUID, FK)
* `expert_id` (UUID, FK)
* `case_number` (String) — "1409/2024"
* `court_id` (Integer, FK)
* `status` (Enum: `DRAFT`, `ACTIVE`, `REVIEW`, `CLOSED`, `OBJECTION_RECEIVED`)
* `assignment_date` (Date)
* `deadline_date` (Date)
* `closed_date` (Date)
* `folder_path` (String) — Local path to files.

### `parties`
* `id` (UUID, PK)
* `case_id` (UUID, FK)
* `role` (Enum: `PLAINTIFF`, `DEFENDANT`)
* `name` (String)
* `nationality` (Enum: `OMANI`, `EXPAT`) — **Critical for Pension logic.**
* `representative` (String) — Lawyer name.

---

## 3. DOCUMENTS & PRIVACY

### `documents`
* `id` (UUID, PK)
* `case_id` (UUID, FK)
* `type` (Enum: `MANDATE`, `CLAIM`, `CONTRACT`, `EVIDENCE`)
* `file_path` (String)
* `original_filename` (String)
* `ocr_status` (Enum: `PENDING`, `DONE`)
* `privacy_token_map` (JSONB) — Encrypted.
* `extracted_text_masked` (Text)

---

## 4. CALCULATION ENGINE (MATH)

### `salary_components`
* `id` (UUID, PK)
* `case_id` (UUID, FK)
* `name` (String) — "Basic", "Housing"
* `amount` (Decimal 10,3)
* `is_gross_part` (Boolean)
* `effective_date` (Date)

### `time_slices`
*To handle Salary History changes.*
* `id` (UUID, PK)
* `case_id` (UUID, FK)
* `start_date` (Date)
* `end_date` (Date)
* `rule_type` (Enum: `ALLOWANCE_CHANGE`, `GRADE_CHANGE`)
* `value` (JSONB)

### `calculations`
*Input parameters and Results.*
* `id` (UUID, PK)
* `case_id` (UUID, FK)
* `scenario_type` (Enum: `LEGAL_DEFAULT`, `PLAINTIFF_CLAIM`)
* `is_article_40` (Boolean) — **Toggle for Gross Misconduct.**
* `unfair_dismissal_months` (Integer) — 3 to 12.
* `total_eosb` (Decimal 12,3)
* `total_leave` (Decimal 12,3)
* `details_json` (JSONB) — Full calculation log.

---

## 5. MEETING INTELLIGENCE

### `meetings`
* `id` (UUID, PK)
* `case_id` (UUID, FK)
* `meeting_date` (Date)
* `audio_path` (String)
* `transcript_masked` (Text)
* `summary_protocol` (Text) — **Result PDF content.**

---

## 6. FINANCE (FEES)

### `fees_ledger`
* `id` (UUID, PK)
* `case_id` (UUID, FK, Unique)
* `agreed_amount` (Decimal 10,3)
* `payer_name` (String)
* `invoice_path` (String)
* `payment_status` (Enum: `UNPAID`, `PAID`)
* `payment_date` (Date)
* `proof_path` (String)

---

## 7. ANALYTICS (BI)

### `analytics_firm_stats`
*Materialized View (Refresh Hourly).*
* `organization_id` (UUID)
* `active_cases` (BigInt)
* `avg_turnaround_days` (Float)
* `total_revenue` (Decimal)