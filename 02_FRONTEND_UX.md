# EXPERTOS — FRONTEND UX & ARCHITECTURE (v1.0)

## 0. PHASE 0: SCAFFOLDING & CLEANUP (CRITICAL START)
**Context:** We are using `next-saas-stripe-starter` as the base.
**Action Plan:**
1.  **Audit:** Analyze existing pages.
2.  **Purge:** Delete all Marketing pages (`app/(marketing)`), Blog, Documentation.
3.  **Preserve:** Keep `Auth` (NextAuth), `Prisma`, `Stripe` logic.
4.  **RTL Setup:** Configure `layout.tsx` with `dir="rtl"` and `IBM Plex Sans Arabic` font.
5.  **Result:** A clean dashboard skeleton available at `/dashboard`.

---

## 1. DESIGN SYSTEM (AESTHETICS)
**Vibe:** "Swiss Bank meets ElevenLabs". Clean, trustworthy, expensive.
**Colors:**
* **Bg:** `bg-zinc-50` (Global background).
* **Cards:** `bg-white` + `shadow-[0_2px_8px_rgba(0,0,0,0.04)]` (Floating paper effect).
* **Accents:** `text-zinc-900` (Primary), `text-zinc-500` (Secondary). Gold/Amber for Finance.
**Animation:** Framer Motion for micro-interactions (hover lift, smooth page transitions).
**Components:** Shadcn UI + Lucide React (Thin stroke `1.5px`).

---

## 2. MODULE 1: AUTH & DASHBOARD

### Screen: `/auth/login`
* **Layout:** 50/50 Split.
* **Left (Content):** Clean Login Form (Email/Pass). Microsoft 365 Social Button.
* **Right (Visual):** Abstract 3D Render (Glass/Gold) placeholder.
* **Animation:** Form slides up gently (`y: 20 -> 0`).

### Screen: `/dashboard` (App Shell)
* **Sidebar (Right - RTL):** Sticky, collapsible. Icons: Dashboard, Cases, Calendar, Settings.
* **Content:**
    * **KPI Cards:** "Active Cases", "Revenue", "Avg Turnaround". Data from `analytics_firm_stats`.
    * **Pipeline Widget:** Horizontal progress bar (Draft -> Active -> Review -> Closed).
    * **Deadline Feed:** List of urgent cases.

---

## 3. MODULE 2: CASE WORKSPACE (THE FOLDER)

### Screen: `/cases/[id]/workspace`
**Concept:** "Evidence Wall" (not a table).
* **Toolbar:** Floating "Glassmorphism" bar. Actions: `Upload`, `Scan`, `Record Audio`.
* **Main Grid:** Masonry Grid of files.
    * **Cards:** Preview thumbnail + Smart Badge (e.g., "Contract", "WhatsApp").
    * **Empty State:** "Ghost Documents" outlines (Passport, Claim) prompting upload.
* **Interaction:** Click card -> Open Lightbox (PDF Viewer).

### Screen: `/cases/new` (Ingestion Wizard)
* **Step 1:** Drag & Drop files. Show OCR Progress (Scanning -> Masking -> Ready).
* **Step 2:** Metadata Verification.
    * **Case No:** Regex extracted.
    * **Court:** Combobox with Fuzzy Match against `master_courts`.
    * **Parties:** Table with "Nationality" toggle (Omani/Expat).

---

## 4. MODULE 3: CALCULATION ENGINE (THE BRAIN)

### Screen: `/cases/[id]/calculation`
**Concept:** "Comparison Grid" (Plaintiff vs Expert).
* **Layout:**
    * **Col 1:** Plaintiff Claim (What they want).
    * **Col 2:** Expert Opinion (The Truth - Highlighted in Gold).
* **Input Components:**
    * **Salary History:** Editable Table (from OCR).
    * **Ghost Timeline:** Chart (Recharts) showing Salary Gaps.
    * **Toggles:** `[ ] Article 40` (Zeroes out EOSB), `[ ] COVID Indexation`.
* **Results:** "Rolling Numbers" animation when inputs change.

---

## 5. MODULE 4: REPORT FACTORY

### Screen: `/cases/[id]/report`
**Concept:** "Smart Form Filling" (NO AI Writer).
* **Left Panel (Form):**
    * **Opinion:** Textarea for Expert's conclusion.
    * **Toggles:** "Include Calc Table?", "Include Annexes?".
* **Right Panel (Preview):** PDF Preview of the generated DOCX.
* **Action:** "Select Template" -> "Generate Draft" (Downloads .docx).

---

## 6. MODULE 5: MEETINGS

### Screen: `/cases/[id]/meetings/[meeting_id]`
**Concept:** "Smart Player".
* **Left:** Audio Waveform + Transcript.
    * **Privacy Toggle:** Show Masked (`[PERSON_1]`) vs Original (`Ahmed`).
* **Right:** Checklist.
    * Questions generated from Case context.
    * Action: "Export Protocol" (PDF).

---

## 7. MODULE 6: FINANCE & DELIVERY

### Screen: `/cases/[id]/finance`
**Concept:** "The Gatekeeper".
* **Status Banner:** If `UNPAID` -> Yellow Warning: "Fee not settled. Download allowed but discouraged."
* **Actions:**
    * "Generate Invoice" (PDF).
    * "Mark as Paid" (Manual Modal: Date + Proof Upload).
* **Bundling:** Drag & Drop list of sections (Report, Annexes, ID).
* **Final Action:** "Sign & Seal" -> Downloads `Submission_Bundle.pdf`.