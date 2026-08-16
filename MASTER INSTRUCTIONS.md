# Laxmi Enterprise — Master Workspace Instructions

**Version:** 3.0  
**Last Updated:** August 16, 2026

---

## 1. Purpose

This document governs the active projects in this monorepo workspace:

1. **`apps/supervisor`** — Supervisor-facing touch tablet web application.
2. **`apps/admin`** — Administrative analytics, payroll, and governance portal.
3. **`packages/shared`** — Centralized React Query hooks, API transports, UI components, and TypeScript contracts.
4. **`ServerSide`** — Central FastAPI and MongoDB backend service.
5. **`Marker-CS-Extractor`** — Python document data extraction utility.

Each project maintains its own specific instruction document. This master document establishes core boundaries, contracts, and interaction protocols.

---

## 2. Source of Truth

The **FastAPI backend (`ServerSide`) and MongoDB replica set** are the absolute and single source of truth for:
- Employees and category configuration
- Attendance sessions and attendance records
- Vehicle assignments and capacity constraints
- Vehicle trips and task completion lifecycles
- Session finalization, unlocking, and locking states
- Immutable audit trail events
- Official report generation and payroll calculations

**Frontend Rule:** Frontend applications are strictly presentation and user-intent collection layers. Frontends must never connect directly to MongoDB, bypass backend capacity checks, perform local session finalizations, or treat local browser state as authoritative.

---

## 3. Multi-App Integration Contract

All client applications (React web applications, Python automation scripts, mobile clients, and kiosk scanners) communicate solely through the versioned REST API under `/api/v1`.

```
Client Intent → REST API (/api/v1) → Server Validation → MongoDB Transaction → Audit Event → Response (200/409)
```

- **OpenAPI Single Contract:** The backend defines and exports `ServerSide/openapi.json`.
- **Generated Types:** `packages/shared/types/api.ts` must be kept in sync with the backend schema.
- **Optimistic Concurrency:** State-changing requests must supply the current session version. Stale edits return `409 Conflict` with the latest server state to trigger safe client reconciliation.
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
- Never finalize sessions locally or bypass server validation.

### 4.2. Admin Portal (`apps/admin/`)
- Provide high-level organizational analytics across flexible date ranges.
- Calculate daily payroll and overtime compensation based on verified attendance and category rates.
- Manage the pending employee approval queue (Approve, Reject, Edit, Delete).
- Execute audited session unlocks to reset finalized sessions when supervisor corrections are warranted.
- Monitor active fleet utilization and vehicle trip lifecycles.
- Export authoritative CSV reports for payroll, attendance, and fleet status.

### 4.3. Shared Package (`packages/shared/`)
- Encapsulate all REST API communication inside `backendApi.js` and dedicated services.
- Provide synchronized React Query hooks with automatic cache invalidation.
- Share reusable UI components (`ArrivedTimeModal`, `ErrorBoundary`, `LoadingSpinner`).
- Prevent code duplication across applications.

### 4.4. Server Side (`ServerSide/`)
- Authenticate users via JWT and enforce role-based access control (`admin`, `supervisor`).
- Execute all multi-document mutations inside MongoDB transactions.
- Enforce strict vehicle capacity: max 1 Driver, max 1 Chalan Man, max 6 Workers, max 8 total employees.
- Record append-only audit events in `audit_events` for every data change.
- Provide clean OpenAPI documentation and health check endpoints.

---

## 5. Error and Versioning Policy

- Backend errors must return standardized payloads containing:
  - `code` (e.g. `CONFLICT`, `VALIDATION_ERROR`, `UNAUTHORIZED`, `NOT_FOUND`)
  - `message` (Safe user-facing description)
  - `details` / `current_state` (Server state required for client-side conflict resolution)
- If an API breaking change is required:
  1. Update backend models and routes.
  2. Run type sync script (`ServerSide/scripts/sync.py` or `npm run sync:types`).
  3. Update affected consumers in `packages/shared`, `apps/supervisor`, and `apps/admin`.
  4. Increment instruction versions accordingly.
