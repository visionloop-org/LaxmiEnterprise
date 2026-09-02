# Laxmi Enterprise — Master Workspace Instructions

**Version:** 4.0  
**Last Updated:** September 2, 2026

---

## 1. Purpose

This document governs the active projects in this monorepo workspace:

1. **`apps/supervisor`** — Supervisor-facing touch tablet web application.
2. **`apps/admin`** — Administrative analytics, payroll, and governance portal.
3. **`packages/shared`** — Centralized React Query hooks, Google Sheets services, UI components, and TypeScript contracts.
4. **`google-sheets`** — Google Apps Script Web App API and database schema.
5. **`Marker-CS-Extractor`** — Python document data extraction utility.

Each project maintains its own specific instruction document. This master document establishes core boundaries, contracts, and interaction protocols.

---

## 2. Source of Truth

The **Google Sheets database and Google Drive storage** are the absolute and single source of truth for:
- Employees and category configuration
- Attendance sessions and attendance records
- Vehicle assignments and capacity constraints
- Vehicle trips and task completion lifecycles
- Session finalization, unlocking, and locking states
- Immutable audit trail events
- Official report generation and payroll calculations

**Frontend Rule:** Frontend applications are strictly presentation and user-intent collection layers. Frontends must never bypass Google Sheets validation, treat local browser state as authoritative, or implement business logic that should reside in the Google Apps Script Web App.

---

## 3. Multi-App Integration Contract

All client applications (React web applications, Python automation scripts, mobile clients, and kiosk scanners) communicate solely through the Google Apps Script Web App API.

```
Client Intent → Google Sheets API → Sheet Validation → Drive Storage → Audit Event → Response (200/400)
```

- **Google Sheets Single Contract:** The Google Apps Script Web App defines and exports the complete REST API contract.
- **Type Safety:** `packages/shared/types/` must be kept in sync with the Google Sheets schema.
- **Optimistic Concurrency:** State-changing requests must supply current session data. Conflicts return appropriate error responses to trigger safe client reconciliation.
- **Idempotency:** Session finalization and status mutations must be idempotent. Duplicate requests must never produce duplicate audit events or corrupt session state.

---

## 4. Responsibilities by Component

### 4.1. Supervisor Web Application (`apps/supervisor/`)
- Display fast, landscape tablet-optimized spreadsheet views.
- Capture attendance intent (On Time, Arrived with time, Absent) with non-blocking feedback.
- Manage vehicle assignments and render real-time capacity progress indicators.
- Track vehicle dispatch, site arrival, product delivery, and return via `TripTrackerModal`.
- Submit employee addition requests (`RequestEmployeeModal`) for administrative approval.
- Maintain an offline mutation queue for network interruptions.
- Never finalize sessions locally or bypass Google Sheets validation.

### 4.2. Admin Portal (`apps/admin/`)
- Provide high-level organizational analytics across flexible date ranges.
- Calculate daily payroll and overtime compensation based on verified attendance and category rates.
- Manage the pending employee approval queue (Approve, Reject, Edit, Delete).
- Execute audited session unlocks to reset finalized sessions when supervisor corrections are warranted.
- Monitor active fleet utilization and vehicle trip lifecycles.
- Export authoritative CSV reports for payroll, attendance, and fleet status.
- Configure Google Sheets Web App URL and sync settings.

### 4.3. Shared Package (`packages/shared/`)
- Encapsulate all Google Sheets API communication inside `googleSheetsService.js`.
- Provide synchronized React Query hooks with automatic cache invalidation.
- Share reusable UI components (`ArrivedTimeModal`, `ErrorBoundary`, `LoadingSpinner`).
- Prevent code duplication across applications.
- Implement localStorage fallback for offline operation with auto-sync on reconnection.

### 4.4. Google Sheets Database (`google-sheets/`)
- Authenticate users via Gmail and enforce role-based access control (`admin`, `supervisor`).
- Execute all data mutations inside Google Sheets with audit logging.
- Enforce strict vehicle capacity: max 1 Driver, max 1 Chalan Man, max 6 Workers, max 8 total employees.
- Record append-only audit events in `Audit_Logs` for every data change.
- Provide clean JSON REST API documentation and health check endpoints.
- Automated daily backups to Google Drive `02_Daily_Attendance_Backups` folder.

---

## 5. Error and Versioning Policy

- Google Sheets API errors must return standardized payloads containing:
  - `status` (e.g. `success`, `error`)
  - `message` (Safe user-facing description)
  - `details` (Additional context for client-side error handling)
- If an API breaking change is required:
  1. Update Google Apps Script Web App (`google-sheets/Code.gs`).
  2. Update `packages/shared/services/googleSheetsService.js` to handle new responses.
  3. Update affected consumers in `apps/supervisor` and `apps/admin`.
  4. Increment instruction versions accordingly.
