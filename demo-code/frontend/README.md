## Enaya Legal AI — Vue Demo (UI Only)

This is a front-end–only Vue 3 + Vite demo of the **Enaya Legal AI Assistant** for labor court cases.  
All AI behaviour is mocked in the browser with simple timeouts and loaders — **no backend, no external APIs, no real OCR/AI**.

### Tech

- **Framework**: Vue 3, TypeScript, Vite
- **Styling**: Tailwind CSS 4 (via `@tailwindcss/postcss`)
- **State**: simple in-memory store (`src/modules/cases/store.ts`) with mock fixtures (`mockCases.ts`)

### Running locally

```bash
npm install
npm run dev
```

Then open the printed `http://localhost:5173` URL.

### Main screens

- **Dashboard** (`/`):
  - KPI strip for cases and AI-assisted time.
  - Cases table with status pills and glass hover.
  - `+ New case` button opens a glassy modal; new cases are stored in memory for the session.
- **Case Detail** (`/cases/:id`):
  - Header with parties, court, status and chips.
  - Tabs:
    - **Documents**: three document groups, mock upload, simulated processing timeline.
    - **Extracted Data**: editable court assignment data with “Reset to AI suggestion” (demo only).
    - **Analysis**: “Run AI analysis” button shows an overlay and then reveals mocked insights and basic calculations.
    - **Report**: Arabic report sections with a side panel of chips that “insert” data via small toasts, plus mock “Regenerate draft” and “Export DOCX”.

### RTL / Arabic preview

Use the **EN / AR** pill in the left sidebar to toggle `dir="rtl"` for the main shell.  
Arabic content is included in the report sections; the rest of the UI stays in English for this demo.

### Data & limitations

- All data lives in memory, typed via `Case` and related interfaces (`src/modules/cases/types.ts`).
- No persistence, no security, no real legal engine — this is **demo data for illustration only**.

# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).
