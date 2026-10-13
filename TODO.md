# Laxmi Enterprise TODO & Roadmap

**Last Updated:** September 6, 2026  
**Current System Status:** Production-Ready Serverless Monorepo (v5.0) with Multi-Spreadsheet Google Sheets Architecture, Google Drive Storage, Installable PWA Suite, Client-Centric Heavy Computation, Supervisor Tablet/Phone UI, Admin Analytics Portal, and GitHub Pages Deployment.

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
  - Hook tests (37 passing: `useEmployees`, `useVehicles`, `useTrips`, `usePerformanceMonitor`, `useStatistics`)
  - Utility tests (8 passing: `requestId`, `security`, `config`)
  - Health check service tests (`healthCheck`)

### 9. Frontend Performance, Security & Developer Experience (Completed)
- ✅ **React Query v5 Optimizations**: Configured fine-tuned `staleTime` and `gcTime` policies (`staleTime: 5m` for employees, `3m` for vehicles, `30s` for trips), eliminated query key collisions, and added global `QueryCache` and `MutationCache` 401 authentication handlers.
- ✅ **Structured JSON Logging & Tracing**: Implemented `packages/shared/utils/logger.js` with structured levels (`DEBUG`, `INFO`, `WARN`, `ERROR`), request tracing, and automated sensitive data redaction.
- ✅ **Request ID Lifecycle Tracking**: Implemented `packages/shared/utils/requestId.js` generating `REQ-<timestamp>-<rand>` identifiers propagated across `X-Request-ID` headers.
- ✅ **Performance Profiling Hook**: Created `usePerformanceMonitor.js` to track component render count, detect slow renders (>16ms), measure async execution duration (`measureAsync`), and set performance marks.
- ✅ **Code Splitting & Bundle Optimization**: Code-split heavy supervisor modals (`TripTrackerModal`, `CapacityConflictModal`, `CapacityReportModal`, `VehicleAssignmentHistory`, `RequestEmployeeModal`) with scoped `<Suspense>` boundaries.
- ✅ **Pre-Commit Quality Gate**: Integrated Husky (`.husky/pre-commit`) and `.lintstagedrc.json` with automated `oxlint` checks on staged files.
- ✅ **UI Category Count Bug Fix**: Corrected `useStatistics.js` category count calculation so the Vehicles tab renders accurate live fleet counts (`Vehicles (25)`).

### 10. Google Sheets Serverless Architecture Migration (Completed)
- ✅ **Serverless Single Source of Truth**: Replaced server infrastructure with Google Sheets & Apps Script Web App API (`google-sheets/Code.gs`).
- ✅ **10 Structured Worksheets**: `Employees`, `Vehicles`, `Contractors`, `Rates_Config`, `Users_Roles`, `Attendance_Sessions`, `Attendance_Records`, `Vehicle_Assignments`, `Vehicle_Trips`, `Daily_Payroll`, `Audit_Logs`.
- ✅ **Automated Google Drive Storage**: Created hierarchical folder structure under `Vision Loop - Laxmi Enterprise/` with automated daily attendance spreadsheet backups to `02_Daily_Attendance_Backups`.
- ✅ **GoogleSheetsService Engine**: Built `@laxmi/shared/services/googleSheetsService.js` providing offline-first `localStorage` resilience with automatic background synchronization upon network reconnection.
- ✅ **Shared Google Sheets Sync Center**: Re-exported `GoogleSheetsSyncModal` from `@laxmi/shared` accessible on both Admin portal and Supervisor tablet with connection testing, pull, and push utilities.
- ✅ **React Hooks Rules Compliance**: Fixed conditional hook ordering in `TripTrackerModal.jsx`, ensuring 100% React Hooks rules adherence and zero oxlint errors.
- ✅ **Direct Persistence Integration**: Wired supervisor attendance marking (`on_time`, `arrived`, `absent`), vehicle assignment transfers, and extra labour additions directly into `googleSheetsService`.
- ✅ **GitHub Pages Continuous Deployment**: Configured automated GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) publishing the unified frontend static bundle to `https://visionloop-org.github.io/LaxmiEnterprise/`.

### 11. Component Modularization & Clean File Architecture (Completed)
- ✅ **Admin Monolith Decomposition**: Decomposed 1,166-line `apps/admin/src/App.jsx` into focused, single-responsibility components each under 150 lines:
  - `LoginPage.jsx` — Dedicated sign-in view.
  - `AdminHeader.jsx` — App top bar with user badge and Google Sheets sync modal trigger.
  - `StatsOverview.jsx` — KPI metric summary and fleet utilization cards.
  - `PendingApprovalsBanner.jsx` — Supervisor worker addition requests alert.
  - `ContractorPayrollPanel.jsx` — Agency settlement breakdown table with CSV export.
  - `EmployeeManagementTable.jsx` — Searchable, filterable, paginated employee master table.
  - `FleetManagementTable.jsx` — Vehicle fleet status and live trip dispatch tracker.
  - `SessionUnlockPanel.jsx` — Admin session unlock/reset tool.
  - `BulkCompensationModal.jsx` — Batch rate editor with presets and CSV upload/download.
  - `EditEmployeeModal.jsx` — Worker compensation and contractor editing modal.
  - `AdminDashboard.jsx` — Clean assembly layer.
  - `App.jsx` — Streamlined 20-line authentication shell.
- ✅ **Centralized `StatusBadge` Component**: Created [`packages/shared/components/StatusBadge.jsx`](./packages/shared/components/StatusBadge.jsx) to unify color-coded badges across Admin and Supervisor apps.
- ✅ **Duplicate Component Elimination**: Removed duplicate `GoogleSheetsSyncModal.jsx` from `apps/admin` and imported the canonical component from `@laxmi/shared`.
- ✅ **Net Codebase Reduction**: Reduced monorepo code by 657 net lines while eliminating redundancy and boosting readability.

### 12. Pre-Push Compilation Gate & Test Automation (Completed)
- ✅ **Automated `.husky/pre-push` Hook**: Configured mandatory 4-step compilation test gate before any `git push`:
  1. Supervisor app Vite compilation
  2. Admin app Vite compilation
  3. GitHub Pages static bundle assembly
  4. Full shared Mocha test suite
- ✅ **Mocha Process Termination Fix**: Added `--exit` flag to all test scripts in `packages/shared/package.json` to eliminate hanging background Node.js processes.
- ✅ **100% Passing Status**: 84/84 tests passing in 2 seconds, 0 lint errors, and 100% green CI/CD deployment runs on GitHub Pages.

### 13. Serverless Google Authentication (Completed Design & Verification)
- ✅ **Zero-Backend Identity**: Designed and verified Google Identity Services (GIS) OAuth 2.0 / OpenID Connect JWT client authentication.
- ✅ **Spreadsheet Role Governance**: Mapped Gmail addresses to permissions via the `Users_Roles` worksheet in Google Sheets.
- ✅ **Zero Password Exposure**: No credentials stored in Google Sheets; security handled directly by Google's multi-factor authentication (2FA) and biometrics.

### 14. Multi-Spreadsheet Modular Serverless Architecture (v5.0 - Completed)
- ✅ **3 Domain Spreadsheets Database**: Partitioned the database across 3 specialized Google Spreadsheets in `Vision Loop - Laxmi Enterprise / 01_Live_Database /`:
  - `01_Laxmi_HR_Master` (Employees, Contractors, Rates_Config, Users_Roles)
  - `02_Laxmi_Attendance_Fleet` (Vehicles, Attendance_Sessions, Attendance_Records, Vehicle_Assignments, Vehicle_Trips, Extra_Labour_Requests, Vehicle_Maintenance)
  - `03_Laxmi_Payroll_Accounting` (Daily_Payroll, Contractor_Settlements, Monthly_Summary, Audit_Logs)
- ✅ **Zero Concurrency Lock Contention**: Solved spreadsheet write lock contention between field supervisors recording check-ins and finance admins running payroll.
- ✅ **Google Drive Access Control**: Partitioned sensitive payroll and contractor settlement records into a dedicated spreadsheet for restricted owner/accountant permissions.
- ✅ **Apps Script Gateway Router (`Code.gs` v5.0)**: Built `getTableSpreadsheet(tableName)` dynamically routing read/write operations to the appropriate spreadsheet via ScriptProperties caching, automatic Drive discovery, and graceful single-sheet fallback.
- ✅ **Automated Multi-Spreadsheet Provisioning**: Implemented `setupMultiSpreadsheetArchitecture()` to automatically create, format, color-code, and seed data into all 3 spreadsheets with 1 click.
- ✅ **Frontend Multi-Spreadsheet Service & UI**:
  - Upgraded `@laxmi/shared/services/googleSheetsService.js` with `fetchMultiSpreadsheetMeta()`, `setupMultiSpreadsheets()`, and `openSpreadsheet()`.
  - Redesigned `GoogleSheetsSyncModal.jsx` displaying live status, direct 1-click sheet links, and XLSX exports for all 3 domain spreadsheets.
  - Added quick-access buttons (`👥 HR`, `🚛 Fleet`, `💰 Payroll`) to `AdminHeader.jsx`.
- ✅ **Test Verification**: Added comprehensive unit test coverage in `googleSheetsService.test.js` passing 100% green.

### 15. Installable Web App (PWA) & Client-Centric Heavy Computation (v5.0 - Completed)
- ✅ **Progressive Web App (PWA) Suite**:
  - Web App Manifests in `apps/supervisor/public/manifest.json` and `apps/admin/public/manifest.json` with standalone mode, orientation support, shortcuts, and curated high-resolution icons (192px, 512px, maskable).
  - Service worker offline caching (`sw.js`) for fast boot in remote quarry/yard locations without internet.
  - Reusable [`InstallAppButton.jsx`](./packages/shared/components/InstallAppButton.jsx) supporting Android `beforeinstallprompt` and iOS Safari installation workflows.
  - Unified root portal PWA manifest and service worker in `dist/`.
- ✅ **Client-Centric Heavy Computation Engine**:
  - Built [`ClientComputationService.js`](./packages/shared/services/clientComputationService.js) executing all computation on the client device CPU (phone, tablet, PC).
  - Implemented 1.5x overtime wage calculation (`extraHours * (baseRate / 8) * 1.5`).
  - Implemented contractor commission settlements (`wages * (rate / 100)`).
  - Implemented knapsack cargo and passenger capacity optimization (max 1 Driver, 1 Chalan Man, 6 Workers, 8 Total).
  - Implemented live capacity violation and conflict detection.
  - Implemented instant in-memory multi-attribute filtering.
- ✅ **Mobile Ergonomics**:
  - Compact header and sliding drawer menu for Android smartphones in `apps/supervisor`.
  - Live check-in counters (`Present: X / Y`).
  - Touch-optimized targets with `touch-action: manipulation`.
- ✅ **Automated Unit Testing**:
  - Created [`clientComputationService.test.js`](./packages/shared/tests/services/clientComputationService.test.js) with 9/9 passing tests in 11ms.
  - Integrated `test:computation` into package scripts and `.husky/pre-push`.
- ✅ **Role Assignments**:
  - Admin: `Gauravjaiswal0304@gmail.com`
  - Supervisor: `Maalaxmi.godown@gmail.com`

---

## 🛠️ In Progress & Current Focus (Milestone 5.4 & 5.5)

### Milestone 5.4: 5-Year Data Retention & Automated Purge Engine
- [x] **5-Year Purge Routine**: Implemented in `DriveCsvService.pruneRecordsOlderThan5Years()` with automated cutoff logic, verified with 4/4 passing unit tests.
- [ ] **Annual Compliance Archive**: Compile annual aggregated attendance and gross compensation totals into `03_Laxmi_Payroll_Accounting / Yearly_Archives` before raw record pruning.
- [ ] **Storage Cap Governance**: Enforce database compaction and vacuuming to guarantee active operational data remains strictly under **50 MB** (<1% of the 2 GB allowance).
- [ ] **Automated Monthly Payroll Run**: Add scheduled trigger to compile and archive monthly payroll summaries into `03_Monthly_Payroll_Reports`.
- [ ] **Google Drive PDF Archival Hook**: Automatically upload generated supervisor PDF attendance sheets directly into Google Drive `04_Supervisor_PDF_Exports`.

### Milestone 5.5: Pure Live Attendance Engine, Batch Sync & File Size Refactoring
- [x] **Pure Online Live Attendance Focus**: Streamlined supervisor view to eliminate extraneous logistics clutter. Categories focused 100% on workers (`Workers`, `Drivers`, `Chalan Men`, `Extra Labour`, `Office`).
- [x] **1-Touch Fast Gate Closure ("Mark Remaining Absent")**: Added instant gate closure action with single confirmation that marks all remaining unpunched workers absent and immediately syncs to Google Sheets.
- [x] **Micro-Batch Sync Queue**: Added `recordAttendanceBatch` to `googleSheetsService.js` and `sheetsDomainOperations.js` for instant, non-blocking multi-record updates in a single pass.
- [x] **Modular Codebase (<600 lines per file)**: Every single active code file across `packages/shared`, `apps/supervisor`, and `apps/admin` refactored to remain strictly under 600 lines (far below 1,000 line ceiling).
- [x] **Zero Operating Costs ($0/₹0)**: Client-side compute with free Google Sheets / Drive / GitHub Pages infrastructure ensuring zero recurring server or API costs.
- [x] **1-Click Bank Transfer CSV Export**: Implemented in `DriveCsvService.exportBankTransferCSV()` generating bank-ready NEFT/RTGS bulk payment files (SBI/Axis/HDFC), verified with unit tests.
- [x] **Mid-Month Salary Advance (Peshgi / Khata) Ledger**: Added dedicated ledger and UI modal in Admin dashboard (`SalaryAdvanceModal.jsx`). Automatically deducts advances from gross wages in `ClientComputationService` and annotates deductions in the bank CSV export.
- [x] **Supervisor App Bundle Optimization**: Converted `pdfHandler` into a lazy on-demand import, reducing initial bundle size from 851 kB to 438 kB (~48% reduction).
- [ ] **RBAC Matrix Enforcement**: Formalize role guards across all views:
  - `Admin` / `Owner`: Full governance, wage rates, emergency unlocks.
  - `Accountant` / `HR`: Attendance audit, payroll calculation, bank exports.
  - `Supervisor`: Touch attendance, vehicle dispatch, offline queue.
  - `Worker`: Read-only punch records and digital pay slip view.
- [ ] **E2E Integration Testing**: End-to-end browser test flow validating supervisor attendance entry, vehicle dispatch, delivery completion, and admin sync.

---

## 🔮 Upcoming Roadmap

### Phase 6: Hardware & Entry Scanner Integrations (LWAS Prototype)
- [x] **Mobile/PWA Camera QR Scanner**: Built native Web `BarcodeDetector` camera QR ID scanner in `CameraQrScannerModal.jsx` for supervisor phone/tablet with auto-chime and on-time rule enforcement (0 hardware cost).
- [ ] **USB QR Scanner Keyboard-Wedge Listener**: Fast USB/Bluetooth 1D/2D barcode reader listener for desktop/laptop entry gates.
- [ ] **Turnstile Rotation Sensor Integration**: Physical gate access verification.
- [ ] **Thermal Token Printer Integration**: Physical single-use token slips for extra labour.
- [ ] **NFC / RFID Badge Readers**: Biometric and proximity card integration.