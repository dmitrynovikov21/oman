# EXPERTOS: OVERNIGHT EXECUTION MASTER PLAN (v1.1)

## ⚠️ MANDATORY DIRECTIVE FOR THE AGENT
* **Autonomy:** Execute all missions autonomously. Do not wait for user confirmation.
* **Language:** Use **ENGLISH** as the primary language for the UI and code for now. Arabic (RTL) is postponed to the localization phase.
* **Verification:** For every function and tool, you MUST generate a **Test Report**. No task is "Done" without a proven test result.

---

## MISSION 1: SCAFFOLDING & CLEANUP
**Instructions:** See `.specs/000_INIT_MISSION.md`
**Goal:** 1. Unpack starter, purge marketing/blog bloat.
2. Configure English (LTR) as the default.
3. Ensure `npm run build` passes.
**Deliverable:** `tests/report_mission_1.md` containing the list of deleted folders and a screenshot of the clean dashboard.

## MISSION 2: DATABASE ARCHITECTURE
**Instructions:** See `.specs/01_DB_SCHEMA.md`
**Goal:** 1. Update `models.py` and run `alembic` migrations.
**Deliverable:** `tests/report_mission_2.md` with the output of `alembic history` and a confirmation of table creation.

## MISSION 3: INTAKE R&D & TESTING
**Instructions:** See `.specs/03_INTAKE_MODULE.md`
**Goal:** 1. Split PDFs from `./filesfortest1/` and benchmark PyMuPDF vs. PaddleOCR.
2. Implement `POST /ingest` using the best tool.
**Deliverable:** `tests/report_mission_3.md` containing the **Full Quality Benchmark Table** and logs of successful file ingestion.

## MISSION 4: INITIAL UI & INTEGRATION
**Instructions:** See `.specs/02_FRONTEND_UX.md`
**Goal:** 1. Build Login and Dashboard shell (LTR/English).
2. Connect "New Case" upload button to the Backend.
**Deliverable:** `tests/report_mission_4.md` showing API response logs when a file is uploaded via the UI.

---

## DEFINITION OF DONE & FINAL REPORT
Create `NIGHT_SUMMARY.md` in the root:
1. Executive summary of all missions.
2. **Benchmark Table** (PyMuPDF vs PaddleOCR).
3. Links to all individual Test Reports in the `tests/` folder.
4. Step-by-step instructions for the user to test the results in the morning.