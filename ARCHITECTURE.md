# Laxmi Enterprise — Monorepo Architecture

**Last Updated:** September 3, 2026  
**Architecture Version:** 4.1 (Modular Serverless Google Sheets Architecture)  
**Compliance Score:** 100/100 (Serverless, Google Sheets Database, Google Drive Storage, GitHub Pages Hosted)

---

## 1. Executive Summary

Laxmi Enterprise operates a unified monorepo for daily workforce attendance tracking, vehicle fleet capacity management, trip and delivery lifecycle tracking, and administrative payroll analytics. 

The architecture enforces a **100% Serverless, Google Sheets-First** pattern where **Google Sheets and Google Drive** serve as the single source of truth for all data storage, retrieval, and backup operations. Frontend applications (`apps/supervisor` and `apps/admin`) operate as stateless presentation layers communicating directly with Google Sheets via Google Apps Script Web App API. Common components, React Query hooks, and API services are centralized in `@laxmi/shared`.

---

## 2. Directory Layout

```
LaxmiEnterprise/
├── apps/
│   ├── supervisor/               # Touch-first tablet application for supervisors (Port 5173)
│   │   ├── src/
│   │   │   ├── components/       # Table, modals (TripTracker, ArrivedTime, Capacity, RequestEmployee)
│   │   │   ├── hooks/            # Local UI & attendance workflow state
│   │   │   ├── services/         # Offline queue & local PDF renderer
│   │   │   └── App.jsx
│   │   └── package.json
│   │
│   └── admin/                    # Administrative analytics & oversight portal (Port 5174)
│       ├── src/
│       │   ├── components/       # Decomposed modular sub-components (<150 lines each)
│       │   │   ├── AdminHeader.jsx            # Top bar, identity badge, Google Sheets sync modal trigger
│       │   │   ├── LoginPage.jsx              # Gmail & credential sign-in card
│       │   │   ├── StatsOverview.jsx          # KPI metrics & fleet utilization cards
│       │   │   ├── PendingApprovalsBanner.jsx # Supervisor worker request approval alert
│       │   │   ├── ContractorPayrollPanel.jsx # Agency settlement breakdown & CSV export
│       │   │   ├── EmployeeManagementTable.jsx# Searchable, paginated employee master table
│       │   │   ├── FleetManagementTable.jsx   # Vehicle fleet status & live trip tracking
│       │   │   ├── SessionUnlockPanel.jsx     # Admin session reset/unlock tool
│       │   │   ├── BulkCompensationModal.jsx  # Batch rate updater with presets & CSV import/export
│       │   │   ├── EditEmployeeModal.jsx      # Individual worker profile & rate editor
│       │   │   └── AdminDashboard.jsx         # Clean composition layer
│       │   ├── App.jsx           # Concise 20-line authentication shell
│       │   └── App.css
│       └── package.json
│
├── packages/
│   └── shared/                   # Core shared library (@laxmi/shared)
│       ├── components/           # Reusable cross-app components
│       │   ├── StatusBadge.jsx            # Standardized color-coded status badge pills
│       │   ├── GoogleSheetsSyncModal.jsx  # Two-way sync, test connection, push/pull modal
│       │   ├── ArrivedTimeModal.jsx       # Touch-friendly arrival time picker
│       │   ├── ErrorBoundary.jsx          # Crash containment with diagnostic details
│       │   └── LoadingSpinner.jsx         # Accessible CSS loading spinner
│       ├── hooks/                # useEmployees, useVehicles, useTrips, useAttendanceState
│       ├── services/             # googleSheetsService, authService, restSession, restTrip, restAssignment
│       ├── types/                # TypeScript contracts
│       ├── tests/                # Unit & edge case test suites (Mocha + Chai + Babel)
│       └── package.json
│
├── google-sheets/                # Google Apps Script Web App & Database Schema
│   ├── Code.gs                   # Complete Google Sheets API & Drive automation
│   ├── SHEET_STRUCTURE.md        # 10-table data schema documentation
│   ├── BEST_PRACTICES.md         # Formula injection defense, concurrency locking, and rate limiting
│   └── README.md                 # Setup & deployment instructions
│
├── .husky/                       # Git quality hooks
│   ├── pre-commit                # oxlint check on staged files
│   └── pre-push                  # Mandatory compilation gate (Supervisor, Admin, Pages, Mocha tests)
├── TODO.md                       # Roadmap & task tracking
├── GOALS.md                      # Product & engineering milestones
├── MASTER INSTRUCTIONS.md        # Monorepo boundary rules
└── WORKFLOW_PLAN.md              # Phased engineering roadmap
```

---

## 3. Core System Subsystems

### 3.1. Google Sheets Database Engine (`google-sheets/`)
- **Google Apps Script Web App**:
  - Complete JSON REST API (`doGet`/`doPost`) for frontend communication.
  - **10 structured worksheets**: `Employees`, `Vehicles`, `Contractors`, `Rates_Config`, `Users_Roles`, `Attendance_Sessions`, `Attendance_Records`, `Vehicle_Assignments`, `Vehicle_Trips`, `Daily_Payroll`, `Audit_Logs`.
  - **Security & Integrity**:
    - **Formula Injection Defense (CWE-1236)**: Sanitizes user strings beginning with `=`, `+`, `-`, `@` with a leading `'`.
    - **Concurrency Locking**: Utilizes Google Apps Script `LockService.getScriptLock()` with timeout handling to eliminate race conditions.
  - Automated Google Drive folder management (`Vision Loop - Laxmi Enterprise` root with subfolders).
  - Daily automated backups to `02_Daily_Attendance_Backups`.
  - Role-based access control via Gmail authentication mapped to `Users_Roles`.
- **REST API Endpoints**:
  - `GET ?action=ping` - Health check
  - `GET ?action=getAll` - Fetch all tables
  - `GET ?action=checkRole&email=...` - Role verification
  - `GET ?action=getTable&table=...` - Fetch specific table
  - `POST` actions: `saveEmployee`, `bulkSaveEmployees`, `deleteEmployee`, `saveUser`, `deleteUser`, `saveVehicle`, `saveSession`, `saveAttendanceRecord`, `saveAssignment`, `deleteAssignment`, `saveTrip`, `savePayroll`, `bulkUploadAll`, `uploadReportToDrive`

### 3.2. Shared Workspace Package (`packages/shared/`)
- Exported under `@laxmi/shared` as a local workspace dependency with dual ESM/CommonJS module support.
- **Services**:
  - `googleSheetsService`: Direct Google Sheets API communication with `localStorage` fallback, exponential backoff with jitter, and offline mutation queue.
  - `authService`: Multi-user Gmail role verification, Google Identity Services JWT processing, and demo access bypass.
- **Shared UI Components**:
  - `StatusBadge`: Unified color-coded badges for worker, vehicle, trip, and session statuses.
  - `GoogleSheetsSyncModal`: Interactive modal for testing Google Apps Script endpoints and forcing push/pull syncs.
  - `ArrivedTimeModal`: Precise touch-friendly arrival time picker.
  - `ErrorBoundary`: Graceful UI crash containment with error reporting.
  - `LoadingSpinner`: Standardized accessible loader.

### 3.3. Supervisor Tablet App (`apps/supervisor/`)
- **Design Philosophy**: Touch-first, spreadsheet-style layout tailored for landscape tablets.
- **Performance & Code Splitting**: Heavy modal components (`TripTrackerModal`, `CapacityConflictModal`, `CapacityReportModal`, `VehicleAssignmentHistory`, `RequestEmployeeModal`) are lazily loaded with scoped `<Suspense>` boundaries.
- **Key Capabilities**:
  - Real-time search, category tabs (Workers, Drivers, Chalan Men, Extra Labour, Office, Vehicles) with accurate dynamic counts (`Vehicles (25)`).
  - Fast attendance recording (instant submission for On Time / Absent, modal for Arrived).
  - Vehicle capacity enforcement with color-coded utilization bars (max 1 Driver, 1 Chalan Man, 6 Workers, 8 total).
  - **Trip & Task Completion**: `TripTrackerModal` tracks vehicle dispatch, site arrival, material delivery, and return.
  - Offline mutation queue with background synchronization.
  - Client-side PDF generation for attendance sheets and vehicle utilization.

### 3.4. Admin Analytics Portal (`apps/admin/`)
- **Modular Component Architecture**: Decomposed from a monolithic 1,166-line file into single-responsibility components under 150 lines each:
  - `LoginPage.jsx`: Dedicated sign-in view.
  - `AdminHeader.jsx`: Navigation and Google Sheets cloud status indicator.
  - `StatsOverview.jsx`: Primary KPI metrics & fleet utilization cards.
  - `PendingApprovalsBanner.jsx`: Supervisor worker addition approvals.
  - `ContractorPayrollPanel.jsx`: Agency settlement breakdown & CSV export.
  - `EmployeeManagementTable.jsx`: Filterable, searchable employee master table.
  - `FleetManagementTable.jsx`: Vehicle fleet status and live dispatch trip log.
  - `SessionUnlockPanel.jsx`: Emergency session reset tool.
  - `BulkCompensationModal.jsx`: Batch rate and overtime editor with CSV upload.
  - `EditEmployeeModal.jsx`: Individual worker profile and compensation editor.
  - `AdminDashboard.jsx`: Orchestration layer.

---

## 4. 100% Serverless Authentication Architecture

```
┌───────────────────────────┐         ┌─────────────────────────┐
│ 1. User on GitHub Pages   │         │ 2. Google Identity Auth │
│   Clicks "Sign in with    │ ──────► │   Google Accounts       │
│   Google" (GIS)           │         │   biometrics / 2FA      │
└───────────────────────────┘         └────────────┬────────────┘
                                                   │ Signed JWT (ID Token)
                                                   ▼
┌───────────────────────────┐         ┌─────────────────────────┐
│ 4. Access Granted / Denied│ ◄────── │ 3. Role & Shift Lookup  │
│   • Admin or Supervisor   │         │   Checks `Users_Roles`  │
│   • Profile photo loaded  │         │   sheet in Google Sheets│
└───────────────────────────┘         └─────────────────────────┘
```

1. **Google Identity Services (GIS)**:
   - Uses official client-side SDK (`https://accounts.google.com/gsi/client`).
   - Zero passwords stored or transmitted.
   - Google cryptographically signs the user's identity in an OpenID Connect JWT.
2. **Spreadsheet Role Governance (`Users_Roles`)**:
   - The verified email is checked against the `Users_Roles` worksheet in Google Sheets.
   - Active accounts receive permissions (`Supervisor`, `Admin`, `Developer`).
   - Inactive accounts or unregistered emails are immediately denied.
3. **Session Persistence**:
   - Authenticated sessions are securely stored in client `localStorage` for offline resilience in remote yards and quarries.

---

## 5. Automated Quality & Pre-Push Compilation Gate

To guarantee repository integrity, Git enforces a mandatory 4-tier check in [`.husky/pre-push`](./.husky/pre-push) before any code is pushed to remote:

```
[git push] ──► 1. Supervisor Build (Vite) ──► 2. Admin Build (Vite) ──► 3. Pages Bundle Assembly ──► 4. Shared Test Suite (Mocha) ──► [Push Allowed]
                      │                              │                            │                               │
                      ▼                              ▼                            ▼                               ▼
                 [Abort Push]                   [Abort Push]                 [Abort Push]                    [Abort Push]
```

---

## 6. Continuous Deployment to GitHub Pages

Every commit pushed to `master` triggers [`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml), executing:
1. Canonical two-job build and deployment targeting the official `github-pages` environment.
2. Direct publishing to **`https://visionloop-org.github.io/LaxmiEnterprise/`**.
