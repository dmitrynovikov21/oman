# MISSION 0: PROJECT SCAFFOLDING & CLEANUP (v1.0)

## 1. OBJECTIVE
Initialize the project using the `next-saas-stripe-starter` template, audit the codebase, remove unnecessary "Marketing/Blog" layers, and configure the core for **ExpertOS (Arabic/RTL)**.

## 2. SOURCE
**Starter Repo:** https://github.com/mickasmt/next-saas-stripe-starter

## 3. STEP-BY-STEP EXECUTION PLAN

### PHASE A: INSTALLATION & AUDIT
1.  **Clone/Unpack:** Deploy the starter into the `apps/web` directory (or root, depending on monorepo structure).
2.  **Install Dependencies:** Run `npm install` (or `pnpm/yarn`).
3.  **Initial Run:** Execute `npm run dev`. Ensure the starter works "as is" before modifying.
4.  **Audit Routes:** Scan the `app/` directory. Identify folders responsible for:
    * Marketing Landing Page (usually `app/(marketing)`).
    * Blog (usually `app/blog` or similar).
    * Documentation (usually `app/docs`).
    * Dashboard/App (usually `app/dashboard` or `app/(app)`).

### PHASE B: THE PURGE (CLEANUP)
*We are building an internal tool, not a marketing site.*
1.  **Delete** the following directories:
    * `app/(marketing)`
    * `app/blog`
    * `content/` (if it contains MDX posts)
    * `public/images/blog`
2.  **Redirect Root:** Modify `app/page.tsx` (or middleware) to redirect `/` immediately to `/login` or `/dashboard`.
3.  **Fix Imports:**
    * Search for references to deleted components in `config/site.ts` or `components/site-header`.
    * Remove dead links from the navigation menu.

### PHASE C: EXPERT OS CONFIGURATION (RTL)
*ExpertOS is strictly Arabic-first.*
1.  **Global Layout (`app/layout.tsx`):**
    * Set the html tag to: `<html lang="ar" dir="rtl">`.
2.  **Typography:**
    * Install `IBM Plex Sans Arabic` via `next/font/google`.
    * Apply it globally in `tailwind.config.js` or `globals.css` as the default font family.
3.  **Tailwind RTL:**
    * Ensure configuration supports logical properties (e.g., use `ms-2` instead of `ml-2`).
    * If using `shadcn-ui`, verify that components render correctly in RTL (e.g., Chevrons in pagination should flip).

### PHASE D: VERIFICATION (DEFINITION OF DONE)
1.  Run `npm run build`. The build **MUST** pass without errors (no "Module not found").
2.  Run `npm run dev`.
3.  Navigate to `http://localhost:3000`. It should redirect to Login.
4.  Navigate to `http://localhost:3000/dashboard` (after auth mock).
    * Text should be aligned **Right-to-Left**.
    * Font should be **IBM Plex Sans Arabic**.
    * No "Blog" or "Features" links in the header.

## 4. AGENT INSTRUCTIONS
* Execute Phase A. Report findings.
* Wait for user confirmation before executing Phase B (Deletion).
* Execute Phase B & C.
* Submit the "Verification Report" from Phase D.