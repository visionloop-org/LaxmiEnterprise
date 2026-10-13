# Laxmi Enterprise — Coherent Workflow Plan

**Last Updated:** September 6, 2026  
**Status:** Phases 1–5.3 Complete (v5.0 Multi-Spreadsheet, PWA, Client-Centric Heavy Computation), Moving to Phase 5.4 (Drive PDF Archival) & Phase 6 (LWAS Hardware)

---

## Current Status Overview

- ✅ **Monorepo & Shared Architecture**: Established `@laxmi/shared` workspace package with shared services, React Query hooks, and UI components.
- ✅ **Supervisor Tablet App**: Touch-first tablet layout with real-time capacity progress indicators and Google Sheets sync.
- ✅ **Admin Dashboard**: Live date range filtering, payroll calculation, contractor settlements, supervisor request approvals, session unlock, and Google Sheets sync center.
- ✅ **Vehicle Trip & Task Completion**: End-to-end trip tracking (`dispatched` → `reached_location` → `delivered` → `returned`).
- ✅ **100% Serverless Google Sheets Architecture**: Google Sheets operational database (`google-sheets/Code.gs`) with 10 structured tables and Drive backups.
- ✅ **Continuous GitHub Pages Deployment**: Automated static builds deployed via `.github/workflows/deploy-pages.yml`.
- ✅ **Quality & Test Automation**: 100% passing tests across hooks, utilities, and components with 0 oxlint errors.

---

## Phase 1: Code Consolidation & Monorepo Unification (Completed)

### 1.1 Refactor Supervisor App to Use Shared Packages ✅
- [x] Update supervisor `package.json` with `@laxmi/shared` dependency.
- [x] Replace local duplicate services with `@laxmi/shared` exports (`backendApi`, `authService`, `restSessionService`, `restVehicleService`, `restAssignmentService`, `restEmployeeService`).
- [x] Remove duplicate service files from `apps/supervisor/src/services/`.
- [x] Verify supervisor tablet app runs cleanly against shared packages.

### 1.2 Move Common UI & Logic to Shared Package ✅
- [x] Centralize `ErrorBoundary` and `LoadingSpinner` in `packages/shared/components/`.
- [x] Create and share `ArrivedTimeModal` for consistent touch arrival time selection.
- [x] Centralize shared React Query hooks (`useEmployees`, `useVehicles`, `useTrips`, `useApproveEmployee`, `useRejectEmployee`, `useUpdateEmployee`, `useDeleteEmployee`).
- [x] Export unified type definitions from `packages/shared/types/api.ts`.

---

## Phase 2: Admin Dashboard & Governance (Completed)

### 2.1 Date Range Filtering & Time-Series View ✅
- [x] Add date range picker with presets (Today, Last 7 Days, Last 30 Days, Custom Range).
- [x] Filter employee attendance and vehicle utilization by date range.
- [x] Implement pagination for large employee and vehicle tables.

### 2.2 Export Functionality ✅
- [x] Implement CSV export for employee attendance and payroll records.
- [x] Implement CSV export for vehicle status and utilization.
- [x] Ensure proper field formatting and escaping in exported CSV files.

### 2.3 Payroll & Compensation Calculation Engine ✅
- [x] Add category base wage presets (Drivers ₹800, Chalan Men ₹650, Workers ₹500, Office ₹750, Extra Labour ₹450).
- [x] Calculate daily base pay, overtime / extra duty hours, and total payout.
- [x] Include comprehensive payroll breakdown in admin data tables and CSV exports.

### 2.4 Multi-Role Approvals & Session Unlock Tool ✅
- [x] Build Pending Approvals queue for supervisor-submitted employee additions.
- [x] Add Admin actions: Approve, Reject, Edit details, Delete.
- [x] Build Session Unlock tool to reset finalized sessions back to in-progress when administrative edits are authorized.

---

## Phase 3: Trip Lifecycle, APIs & Testing (Completed / Advanced)

### 3.1 Vehicle Trip & Task Completion Lifecycle ✅
- [x] Define `VehicleTrip` schema, models, and timeline event structure.
- [x] Build REST endpoints (`POST /api/v1/trips/`, `GET /api/v1/trips/`, `PUT /api/v1/trips/{id}/status`).
- [x] Build `TripTrackerModal` in supervisor application for live task progression:
  1. Vehicle Dispatched
  2. Reached Location
  3. Delivered Product
  4. Returned / Completed
- [x] Integrate trip tracking overview in the Admin dashboard.

### 3.2 Automated Type Synchronization ✅
- [x] Server-independent OpenAPI spec exporter (`ServerSide/scripts/export_openapi.py`).
- [x] TypeScript type generation script (`npm run generate:types`).
- [x] Git pre-commit hook to prevent backend/frontend type drift.

### 3.3 Test Automation Suites ✅
- [x] Pytest backend suite (`ServerSide/tests/`) covering authentication, session transitions, concurrency, assignments, trips, and error handling.
- [x] Mocha/Chai test suite in `packages/shared/tests/` for services, hooks, and components.

---

## Phase 4: Serverless Google Sheets Architecture & Deployment (Completed)

### 4.1 Google Sheets Operational Database & Apps Script API ✅
- [x] Implement complete Google Apps Script Web App in `google-sheets/Code.gs`.
- [x] Configure 10 structured worksheets for master and transactional records.
- [x] Implement automated Google Drive folder management (`Vision Loop - Laxmi Enterprise/`).
- [x] Configure automated daily attendance spreadsheet backups to `02_Daily_Attendance_Backups`.

### 4.2 Shared Service Unification & Offline Sync ✅
- [x] Build `googleSheetsService.js` in `@laxmi/shared` with offline `localStorage` fallback.
- [x] Re-export `GoogleSheetsSyncModal` from `@laxmi/shared` for both Admin and Supervisor apps.
- [x] Wire supervisor tablet mutations (attendance, vehicle assignments, extra labour) directly to `googleSheetsService`.
- [x] Fix conditional hook execution in `TripTrackerModal.jsx` achieving 0 oxlint errors.
- [x] Achieve 100% test passing across hooks, utilities, and components.

### 4.3 GitHub Pages Continuous Deployment ✅
- [x] Build unified static deployment script `scripts/build-gh-pages.js`.
- [x] Configure GitHub Actions deployment workflow `.github/workflows/deploy-pages.yml`.
- [x] Setup unified landing portal linking to Supervisor Tablet App and Admin Portal.

### 4.4 Component Modularization & Clean File Architecture ✅
- [x] Decompose 1,166-line `apps/admin/src/App.jsx` into 10 single-responsibility components (<150 lines each).
- [x] Centralize `StatusBadge` in `packages/shared/components/` for shared cross-app status styling.
- [x] Remove duplicate `GoogleSheetsSyncModal.jsx` from `apps/admin` and import from `@laxmi/shared`.
- [x] Net codebase reduction of 657 lines with zero feature loss.

### 4.5 Automated Pre-Push Compilation Gate & Test Optimization ✅
- [x] Add automated `.husky/pre-push` gate compiling both apps, Pages bundle, and running test suite.
- [x] Add `--exit` flag to all Mocha test scripts in `@laxmi/shared` to eliminate hanging background tasks.
- [x] Maintain 84/84 passing tests and 0 lint errors across the monorepo.

### 4.6 Serverless Google Authentication (GIS) ✅
- [x] Integrate Google Identity Services (GIS) OIDC JWT sign-in model with zero backend server dependencies.
- [x] Connect authentication authorization to the `Users_Roles` worksheet in Google Sheets.
- [x] Enable instant access revocation via sheet status updates without password resets.

---

## Phase 5: PWA, Multi-Spreadsheet & Client-Side Computation (Completed) ✅

### 5.1 Service Worker & PWA Manifest ✅
- [x] Implement Progressive Web App (PWA) manifest for Android tablet, phone, and desktop installation.
- [x] Configure Service Worker static asset pre-caching (`sw.js`) for 100% offline app loading in remote quarries.
- [x] Generate crisp vector and adaptive maskable PWA icons (192×192, 512×512, Apple touch).
- [x] Implement in-app `InstallAppButton` trigger with native prompt and iOS Safari instructions.
- [x] Adapt supervisor layout for Android smartphones with mobile drawer navigation and touch optimization.

### 5.2 Client-Centric Heavy Computation Engine ✅
- [x] Implement `ClientComputationService` running 100% on device CPU (Android Snapdragon, MediaTek, etc.).
- [x] Client-side 1.5× overtime calculation, late arrival adjustments, and category wage totals.
- [x] Automated contractor agency commission settlement engine.
- [x] Knapsack vehicle allocation optimization with 8-passenger capacity limits.
- [x] Instant real-time fleet conflict checking without server round-trips.

### 5.3 Multi-Spreadsheet Architecture (v5.0) ✅
- [x] Partition 15 worksheets across 3 specialized domain spreadsheets (`01_Laxmi_HR_Master`, `02_Laxmi_Attendance_Fleet`, `03_Laxmi_Payroll_Accounting`).
- [x] Transparent domain routing via `getTableSpreadsheet` in Google Apps Script.
- [x] Automatic Drive folder discovery and 1-click provisioning.
- [x] Explicit role governance for `Gauravjaiswal0304@gmail.com` (Admin) and `Maalaxmi.godown@gmail.com` (Supervisor).

### 5.4 5-Year Data Retention & Automated Purge Engine
- [ ] Add scheduled monthly Apps Script/Edge maintenance routine to delete attendance records, trip logs, and audit trails older than 5 years (`shift_date < NOW() - 5 YEARS`).
- [ ] Compile annual aggregated attendance and gross compensation totals into `03_Laxmi_Payroll_Accounting / Yearly_Archives` before raw record pruning.
- [ ] Enforce database compaction and vacuuming to guarantee active operational data remains strictly under **50 MB** (<1% of the 2 GB allowance).
- [ ] Direct Apps Script endpoint to upload client-generated PDF attendance sheets into `04_Supervisor_PDF_Exports`.

### 5.5 Multi-User RBAC & Bank Bulk Transfer CSV Export
- [ ] Implement formal role guards across all views:
  - `Admin` / `Owner`: Full governance, wage rates, emergency unlocks.
  - `Accountant` / `HR`: Attendance audit, payroll calculation, bank exports.
  - `Supervisor`: Touch attendance, vehicle dispatch, offline queue.
  - `Worker`: Read-only punch records and digital pay slip view.
- [ ] Upgrade `googleSheetsService.js` and `clientComputationService.js` with micro-batch sync queue to batch flush multi-supervisor submissions in atomic transactions, eliminating sheet lock contention.
- [ ] 1-Click Bank Transfer CSV export module supporting SBI, Axis, and HDFC bulk payroll templates.
- [ ] Digital mobile-friendly salary slip viewer for individual workers.

---

## Phase 6: Hardware & Scanner Integrations (LWAS Prototype)

### 6.1 Gate Scanning & Entry Tokens
- [ ] USB QR Scanner keyboard-wedge listener for rapid worker ID scanning at entry gates.
- [ ] Mobile/PWA camera QR scanner support for field supervisors.
- [ ] Turnstile rotation sensor event processing and gate unlock signaling.
- [ ] ESC/POS thermal token printer integration for single-use physical entry tokens.

---

## Execution Roadmap

```
Sep 01 – Sep 03, 2026:  Phase 4 (100% Serverless Google Sheets & GitHub Pages deployment) ✅
Sep 04 – Sep 06, 2026:  Phase 5.1–5.3 (PWA offline caching, Multi-Spreadsheets, Client Math) ✅
Oct 12 – Oct 20, 2026:  Phase 5.4 (5-Year Data Retention & Auto-Archival Engine)
Oct 20 – Oct 28, 2026:  Phase 5.5 (Multi-User RBAC & 1-Click Bank Transfer Export)
Nov 01 – Nov 25, 2026:  Phase 6 (Gate scanner, QR camera & turnstile hardware prototype)
```
