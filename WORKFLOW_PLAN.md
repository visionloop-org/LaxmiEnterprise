# Laxmi Enterprise — Coherent Workflow Plan

**Last Updated:** September 3, 2026  
**Status:** Phases 1–4 Complete, Moving to Phase 5 (PWA & Field Offline) & Phase 6 (LWAS Gate Hardware)

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

## Phase 5: PWA & Field Offline Resilience (Current Focus)

### 5.1 Service Worker & PWA Manifest
- [ ] Implement Progressive Web App (PWA) manifest for Android/iPad tablet home screen installation.
- [ ] Configure Workbox / Service Worker static asset pre-caching for 100% offline app loading.
- [ ] Implement background sync retry queue when field supervisor tablets re-enter cell coverage.

### 5.2 Google Drive PDF Auto-Archival
- [ ] Add direct Apps Script endpoint to upload client-generated PDF attendance sheets into `04_Supervisor_PDF_Exports`.
- [ ] Trigger automated daily snapshot compilation for monthly payroll records.

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
Sep 04 – Sep 12, 2026:  Phase 5 (PWA offline caching & Google Drive PDF upload)
Sep 13 – Sep 30, 2026:  Phase 6 (Gate scanner, QR camera & turnstile hardware prototype)
```
