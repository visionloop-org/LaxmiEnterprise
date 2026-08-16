# Laxmi Enterprise TODO & Roadmap

**Last Updated:** August 16, 2026  
**Current System Status:** Production-Ready Monorepo with Shared Architecture, FastAPI Backend, Supervisor Tablet UI, Admin Analytics Portal, Trip Tracking Lifecycle, and Automated OpenAPI Type Sync.

---

## 🚀 Completed Milestones & Features

### 1. Foundation & Backend Core (Completed)
- ✅ Created FastAPI backend service in `ServerSide/` with environment configuration (`MONGODB_URI`, `DEBUG`, `SECRET_KEY`).
- ✅ Configured MongoDB replica set / container support with persistent volume configuration.
- ✅ Implemented JWT authentication (`/api/v1/auth/login`, `/api/v1/auth/me`) with role-based access control (Admin, Supervisor).
- ✅ Built database models & indexes for `employees`, `vehicles`, `attendance_sessions`, `attendance_records`, `vehicle_assignments`, `vehicle_trips`, and `audit_events`.
- ✅ Implemented error handling standard with structured error codes (`CONFLICT`, `VALIDATION_ERROR`, `NOT_FOUND`, `UNAUTHORIZED`).
- ✅ Implemented optimistic concurrency control using `attendance_sessions.version` returning HTTP `409 Conflict` on stale updates.
- ✅ Created database indexes (`app/db/indexes.py`) ensuring uniqueness and high query performance.
- ✅ Implemented comprehensive seed script (`ServerSide/scripts/seed_data.py`) for employees, vehicles, sessions, and demo accounts.

### 2. Core Attendance & Session Management (Completed)
- ✅ Implemented session lifecycle (`GET /api/v1/sessions`, `GET /api/v1/sessions/{id}`, `GET /api/v1/sessions/active`).
- ✅ Implemented attendance recording (`PUT /api/v1/sessions/{id}/attendance/{employeeId}`) supporting statuses: `on_time`, `arrived` (with arrival time), and `absent`.
- ✅ Added immutable audit trail recording (`audit_events`) for every attendance and session mutation.
- ✅ Implemented idempotent session finalization (`POST /api/v1/sessions/{id}/finalize`) with attendance locking.
- ✅ Implemented admin-exclusive session reset/unlock endpoint (`POST /api/v1/sessions/{id}/unlock`) to allow supervisor adjustments when approved.

### 3. Vehicle Assignment & Capacity Engine (Completed)
- ✅ Implemented transaction-safe vehicle assignment and unassignment endpoints (`PUT|DELETE /api/v1/sessions/{id}/assignments/{employeeId}`).
- ✅ Enforced strict server-side domain capacity rules:
  - Maximum 1 Driver per vehicle
  - Maximum 1 Chalan Man per vehicle
  - Maximum 6 Workers / Extra Labour per vehicle
  - Maximum 8 total employees per vehicle
- ✅ Added vehicle status management (`available`, `in_use`, `maintenance`) and vehicle active state toggling.
- ✅ Implemented vehicle assignment history and utilization tracking endpoints.
- ✅ Created structured capacity conflict responses with current vehicle state for seamless client-side resolution.

### 4. Vehicle Trip & Task Completion Lifecycle (Completed)
- ✅ Defined `VehicleTrip` schema and MongoDB persistence with status timeline events (`app/models/trip.py`).
- ✅ Implemented trip lifecycle endpoints (`/api/v1/trips/`):
  - `POST /api/v1/trips/` — Dispatch vehicle with assigned driver, destination location, and product details.
  - `GET /api/v1/trips/` — Filter active and historical trips by session, vehicle, or status.
  - `PUT /api/v1/trips/{id}/status` — Progress trip through the complete task completion flow:
    1. **Dispatched** (Vehicle departs quarry/yard with load)
    2. **Reached Location** (Vehicle arrives at destination site)
    3. **Delivered Product** (Material / aggregate unloaded, receiver name recorded & verified)
    4. **Returned / Completed** (Vehicle returns and becomes available for new assignment)
- ✅ Built quick on-site delivery confirmation modal in `TripTrackerModal.jsx` with receiver name capture and expandable timeline history.
- ✅ Integrated trip monitoring in the admin portal with real-time status display and receiver details.

### 5. Monorepo & Shared Architecture (Completed)
- ✅ Established npm workspaces monorepo: `packages/shared`, `apps/supervisor`, `apps/admin`.
- ✅ Built `@laxmi/shared` package exporting:
  - **Services**: `authService`, `backendApi`, `restAssignmentService`, `restEmployeeService`, `restSessionService`, `restTripService`, `restVehicleService`.
  - **Hooks**: `useEmployees`, `useVehicles`, `useTrips`, `useApproveEmployee`, `useRejectEmployee`, `useUpdateEmployee`, `useDeleteEmployee`, `useCreateTrip`, `useUpdateTripStatus`.
  - **Components**: `ArrivedTimeModal`, `ErrorBoundary`, `LoadingSpinner`.
  - **Types**: Auto-generated TypeScript types (`types/api.ts`).
- ✅ Refactored both `apps/supervisor` and `apps/admin` to consume `@laxmi/shared` with zero code duplication.
- ✅ Automated OpenAPI TypeScript synchronization pipeline (`scripts/export_openapi.py`, `sync.py`, `check-types.js`, pre-commit hooks).

### 6. Supervisor Web Application (Completed)
- ✅ Touch-first landscape tablet optimized spreadsheet layout with large 48–56px touch rows.
- ✅ Category navigation tabs: All, Workers, Drivers, Chalan Men, Extra Labour, Office, Vehicles.
- ✅ Real-time search by ID/Name, Attendance status filter (Pending, Completed, All), and alphabetical range chips.
- ✅ Inline attendance buttons with instant feedback for On Time / Absent.
- ✅ `ArrivedTimeModal` with time presets and manual arrival time selection.
- ✅ Visual vehicle capacity indicators with color-coded utilization progress bars and violation alerts.
- ✅ Capacity conflict resolution modal and vehicle assignment history modal.
- ✅ Employee addition request workflow (`RequestEmployeeModal.jsx`) allowing supervisors to request new workers/contractors for admin approval.
- ✅ Offline mutation queue with background synchronization and visual sync indicator (`SyncStatus.jsx`).
- ✅ Client-side PDF generation module with clean tabular layout, vehicle breakdown, and exception reports.

### 7. Admin Portal & Analytics (Completed)
- ✅ Role-gated Admin authentication interface.
- ✅ Date range filtering (Today, Last 7 Days, Last 30 Days, Custom Range).
- ✅ Real-time attendance summary (Total Employees, Total Vehicles, Present Today, Vehicles In Use).
- ✅ Automated Payroll & Extra Duty calculation engine based on category hourly rates.
- ✅ Contractor Payroll & Settlement Engine aggregating daily wages and overtime grouped by labour contractor.
- ✅ Dedicated "Export Contractor Settlement CSV" for accounting and bank NEFT/RTGS disbursements.
- ✅ Pending Employee Request Approval workflow (Approve, Reject, Edit, Delete).
- ✅ Emergency Session Unlock tool to reset finalized sessions.
- ✅ One-click CSV exports for Employee Payroll/Attendance and Vehicle Status.

### 8. Testing & Validation Suite (Completed)
- ✅ Backend pytest test suite (`ServerSide/tests/`):
  - `test_auth.py` — Authentication & JWT validation
  - `test_employees.py` — Employee CRUD and approval workflows
  - `test_sessions.py` — Session creation, locking, and unlocking
  - `test_attendance.py` — Attendance transitions and concurrency
  - `test_assignments.py` — Vehicle assignment rules and capacity limits
  - `test_trips.py` — Trip lifecycle and task completion state transitions
  - `test_vehicles.py` — Vehicle status and utilization
  - `test_error_handling.py` — Standardized error responses
- ✅ Frontend test suite in `packages/shared/tests/` (Mocha + Chai + Babel):
  - Service unit and edge case tests (`authService`, `backendApi`, `restEmployeeService`, `restVehicleService`, `restAssignmentService`)
  - Hook tests (`useEmployees`, `useVehicles`, `useTrips`)
  - Component tests (`ArrivedTimeModal`, `ErrorBoundary`, `LoadingSpinner`)

---

## 🛠️ In Progress & Current Focus

- [ ] **Automated CI/CD Pipeline**: Setup GitHub Actions workflow to run backend pytest and shared package tests on PRs.
- [ ] **Server-Side PDF Generation**: Add Python `ReportLab` worker to generate official auditable PDF reports directly from persisted MongoDB session data.
- [ ] **WebSocket / SSE Realtime Updates**: Broadcast live attendance and vehicle changes across supervisor and admin dashboards.
- [ ] **E2E Integration Testing**: Playwright test suite validating end-to-end supervisor attendance marking, vehicle assignment, trip tracking, and admin approvals.

---

## 🔮 Upcoming Roadmap

### Phase 4: Production Infrastructure & Background Jobs
- [ ] Add Redis container and Celery/RQ background worker for asynchronous report exports.
- [ ] Add structured JSON logging and OpenTelemetry/Sentry error monitoring.
- [ ] Implement automated MongoDB backup scripts and restore procedures.
- [ ] Configure HTTPS/TLS reverse proxy (Nginx / Caddy) with Docker production profiles.

### Phase 5: Hardware & Attendance Scanner Integrations (LWAS Prototype)
- [ ] USB QR Scanner keyboard-wedge listener for rapid worker ID scanning at entry gates.
- [ ] Turnstile rotation sensor integration for physical gate access verification.
- [ ] Thermal token printer integration for single-use physical entry tokens.
- [ ] Mobile/PWA camera QR scanner support for field supervisors.
- [ ] Long-term hardware evaluation: NFC/RFID badge readers and biometric/face recognition modules.