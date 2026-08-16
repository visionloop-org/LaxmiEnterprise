# Laxmi Enterprise — Coherent Workflow Plan

**Last Updated:** August 16, 2026  
**Status:** Phase 1 Complete, Phase 2 Complete, Phase 3 Advanced, Moving to Phase 4 & 5

---

## Current Status Overview

- ✅ **Monorepo & Shared Architecture**: Established `@laxmi/shared` workspace package with shared services, React Query hooks, and UI components.
- ✅ **Supervisor Tablet App**: Fully refactored to consume `@laxmi/shared` with zero local service duplication.
- ✅ **Admin Dashboard**: Live with date range filtering, payroll calculation, supervisor request approvals, session unlock, and CSV export.
- ✅ **Vehicle Trip & Task Completion**: End-to-end trip tracking implemented (`dispatched` → `reached_location` → `delivered` → `returned`).
- ✅ **Automated Type Sync**: OpenAPI export script, TypeScript type generator, and pre-commit hook in place.
- ✅ **Backend Test Suite**: Pytest test suite covering auth, sessions, attendance, assignments, trips, and error handling.
- ✅ **Frontend Test Suite**: Mocha + Chai test suite for shared services, hooks, and components.

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

## Phase 4: Server Reports & Background Workers (Current Focus)

### 4.1 Redis & Asynchronous Job Queue
- [ ] Add Redis container to `docker-compose.yml`.
- [ ] Implement Celery or RQ background worker in `ServerSide/`.
- [ ] Add job status monitoring and polling endpoints.

### 4.2 Server-Side PDF Report Generation
- [ ] Build ReportLab PDF generator service in `ServerSide/`.
- [ ] Generate official, tamper-evident PDF reports from persisted MongoDB session records.
- [ ] Add authorized report download endpoint (`GET /api/v1/reports/{id}/download`).

### 4.3 Real-Time Session Updates (WebSockets / SSE)
- [ ] Implement Server-Sent Events (SSE) or WebSocket channel on `/api/v1/ws/sessions`.
- [ ] Broadcast attendance status changes and vehicle assignments in real time.
- [ ] Auto-invalidate React Query caches upon receiving push events.

---

## Phase 5: Production Infrastructure & Security

### 5.1 Security Hardening
- [ ] Migrate authentication tokens to `httpOnly`, `Secure`, `SameSite=Strict` cookies.
- [ ] Implement CSRF double-submit cookie or header validation for mutating endpoints.
- [ ] Implement rate limiting on `/api/v1/auth/login` and sensitive endpoints.

### 5.2 CI/CD & Deployment Automation
- [ ] Configure GitHub Actions workflow for automated linting, type checks, pytest, and mocha tests.
- [ ] Configure production multi-stage Dockerfiles with Nginx reverse proxy.
- [ ] Setup automated database backup and restore routines.

---

## Phase 6: Hardware & Scanner Integrations (LWAS Prototype)

### 6.1 Gate Scanning & Entry Tokens
- [ ] USB QR Scanner keyboard-wedge listener for rapid worker ID scanning at entry gates.
- [ ] Turnstile rotation sensor event processing and gate unlock signaling.
- [ ] ESC/POS thermal token printer integration for single-use physical entry tokens.

---

## Execution Roadmap

```
Aug 16 – Aug 22, 2026:  Phase 4.1 & 4.2 (Redis background queue & Server-side PDF generation)
Aug 23 – Aug 30, 2026:  Phase 4.3 (Real-time SSE updates) & Phase 5.2 (CI/CD GitHub Actions)
Sep 01 – Sep 15, 2026:  Phase 5.1 (Cookie auth & CSRF) & Phase 6 (USB QR & Turnstile prototype)
```
