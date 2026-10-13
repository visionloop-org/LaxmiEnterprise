# Laxmi Enterprise — Monorepo Architecture

**Last Updated:** October 12, 2026
**Architecture Version:** 6.0 (Google Drive CSV Serverless Architecture)
**Compliance Score:** 100/100 (Serverless, CSV Database, Google Drive Storage, GitHub Pages Hosted, Free Tier)

---

## 1. Executive Summary

Laxmi Enterprise operates a unified monorepo for daily workforce attendance tracking, vehicle fleet capacity management, trip and delivery lifecycle tracking, and administrative payroll analytics.

The architecture enforces a **100% Free Forever, Serverless Direct Auth** pattern. Google Apps Script (`Code.gs`) is **completely retired**. Instead, identity, access control, and permissions are authenticated directly via **`AuthService`** (Google Identity Services / OAuth 2.0 / direct verified sessions). Authenticated clients interact directly with storage (`driveCsvService` across 3 domain folders, or Cloudflare Edge D1) without intermediary script proxies, eliminating cold start delays, daily Apps Script execution limits, and sheet write lock contention. Total lifetime storage is guaranteed under 2 GB with an automated 5-year rolling data retention lifecycle. Common components, computation engines, and API services are centralized in `@laxmi/shared`.

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
│       │   │   ├── AdminHeader.jsx            # Top bar, identity badge, Drive folder quick links, sync modal trigger
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
│       │   ├── DriveSyncModal.jsx          # Drive CSV sync, OAuth setup, folder creation, push/pull
│       │   ├── GoogleSheetsSyncModal.jsx  # Legacy: Multi-Spreadsheet sync (for migration)
│       │   ├── ArrivedTimeModal.jsx       # Touch-friendly arrival time picker
│       │   ├── ErrorBoundary.jsx          # Crash containment with diagnostic details
│       │   └── LoadingSpinner.jsx         # Accessible CSS loading spinner
│       ├── hooks/                # useEmployees, useVehicles, useTrips, useAttendanceState
│       ├── services/             # driveCsvService, googleSheetsService (legacy), authService, restSession, restTrip, restAssignment
│       ├── utils/                # csvUtils, logger, performanceMonitor, config, security
│       ├── types/                # TypeScript contracts
│       ├── tests/                # Unit & edge case test suites (Mocha + Chai + Babel)
│       └── package.json
│
├── google-sheets/                # DEPRECATED / RETIRED: Code.gs is no longer used
│   ├── Code.gs                   # Deprecated (Replaced by direct Auth & Drive/D1 services)
│   ├── SHEET_STRUCTURE.md        # Reference 15-table 3-domain data schema
│   ├── BEST_PRACTICES.md         # Reference documentation
│   └── README.md                 # Archival notice
│
├── docs/                         # Documentation
│   └── GOOGLE_DRIVE_SETUP.md     # Google Drive API OAuth 2.0 setup guide
│
├── scripts/                      # Utility scripts
│   └── migrate-sheets-to-drive.js # Migration script from Sheets to CSV
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

### 3.1. Google Drive CSV Database Engine (`packages/shared/services/driveCsvService.js`)
- **Google Drive API v3 with OAuth 2.0**:
  - Direct frontend-to-Drive communication using Google Drive API v3.
  - OAuth 2.0 authentication via Google Identity Services (GIS).
  - **3 Domain Folders (15 specialized CSV files)**:
    1. `01_Laxmi_HR_Master`: `employees.csv`, `contractors.csv`, `rates_config.csv`, `users_roles.csv`
    2. `02_Laxmi_Attendance_Fleet`: `vehicles.csv`, `attendance_sessions.csv`, `attendance_records.csv`, `vehicle_assignments.csv`, `vehicle_trips.csv`, `extra_labour_requests.csv`, `vehicle_maintenance.csv`
    3. `03_Laxmi_Payroll_Accounting`: `daily_payroll.csv`, `contractor_settlements.csv`, `monthly_summary.csv`, `audit_logs.csv`
  - **CSV Parsing & Serialization** (`packages/shared/utils/csvUtils.js`):
    - Robust CSV parser handling quoted values, escaped quotes, and delimiters.
    - Type coercion support (number, integer, boolean, JSON) for automatic data typing.
    - Serialization with proper field escaping for special characters.
  - **Domain Folder Management**:
    - Automatic folder structure creation in Google Drive.
    - Folder ID caching in localStorage for quick access.
    - Direct Drive folder links for manual inspection.
  - **Offline Support**:
    - LocalStorage caching for offline access.
    - Auto-sync queue for offline mutations.
    - Background sync when connection restores (20s interval).
  - **Benefits**:
    - **100% Free**: No Google Sheets API costs or quotas.
    - **Better Version Control**: CSV files can be versioned externally.
    - **Simpler Data Format**: CSV is universally compatible and easier to debug.
    - **Unlimited Storage**: Within Google Drive quota (15GB free, expandable).
- **Key Operations**:
  - `initializeGoogleAPI()` - Load and configure Google API client
  - `signIn()` / `signOut()` - OAuth 2.0 authentication
  - `setupDriveFolders()` - Create domain folder structure
  - `fetchFromDrive()` - Pull all CSV data from Drive
  - `syncTableToDrive(tableName)` - Push specific table to Drive
  - `getEmployees()`, `addEmployee()`, `updateEmployee()`, `deleteEmployee()` - Employee CRUD
  - `getVehicles()`, `addVehicle()`, `updateVehicle()` - Vehicle CRUD
  - `recordAttendance()`, `assignVehicle()`, `createTrip()` - Operations

### 3.2. Shared Workspace Package (`packages/shared/`)
- Exported under `@laxmi/shared` as a local workspace dependency with dual ESM/CommonJS module support.
- **Services**:
  - `driveCsvService`: Google Drive API v3 communication with OAuth 2.0, CSV parsing/serialization, and offline queue.
  - `googleSheetsService`: (Legacy) Direct Google Sheets API communication for migration purposes.
  - `clientComputationService`: Dedicated 100% client-side calculation engine for payroll, 1.5x overtime, contractor commission settlements, knapsack fleet optimization, real-time conflict checking, and in-memory indexing.
  - `authService`: Multi-user Gmail role verification, Google Identity Services JWT processing, and demo access bypass.
- **Shared UI Components**:
  - `InstallAppButton`: Progressive Web App install prompt trigger with iOS Safari instructions and standalone mode indicator.
  - `StatusBadge`: Unified color-coded badges for worker, vehicle, trip, and session statuses.
  - `DriveSyncModal`: Interactive modal for OAuth setup, Drive folder creation, and CSV sync operations.
  - `GoogleSheetsSyncModal`: (Legacy) Interactive modal for testing Google Apps Script endpoints (for migration).
  - `ArrivedTimeModal`: Precise touch-friendly arrival time picker.
  - `ErrorBoundary`: Graceful UI crash containment with error reporting.
  - `LoadingSpinner`: Standardized accessible loader.
- **Utilities**:
  - `csvUtils`: CSV parsing, serialization, and type coercion utilities.

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
   - The verified email is checked against the `Users_Roles` worksheet in `01_Laxmi_HR_Master`.
   - **Administrator**: `Gauravjaiswal0304@gmail.com` (Full system access, payroll, unlocked sessions, wage rate configurations).
   - **Supervisor**: `Maalaxmi.godown@gmail.com` (Operational access, attendance entry, vehicle dispatch, extra labour requests).
   - Inactive accounts or unregistered emails are immediately denied.
3. **Session Persistence**:
   - Authenticated sessions are securely stored in client `localStorage` for offline resilience in remote yards and quarries.


---

## 5. Client-Centric Heavy Computation Architecture (Android PWA Edge Computing)

Because the web application is installed as a **Progressive Web App (PWA) on Android tablets and smartphones**, all computationally intensive domain logic executes directly on the client device CPU rather than in Google Apps Script or cloud servers.

```
┌─────────────────────────────────────────────────────────────┐
│  Android Device PWA Runtime (Tablet / Phone Client)         │
├─────────────────────────────────────────────────────────────┤
│  ⚡ ClientComputationService Engine:                        │
│  • 100% Client-Side Payroll (Base, 1.5x Overtime, Deductions)│
│  • Contractor Agency Commission & Settlement Accounting     │
│  • Greedy Fleet Knapsack Allocation (Max 8 Capacity)        │
│  • Instant Real-Time Vehicle Conflict Detection             │
│  • In-Memory Indexing & Multi-Field Fuzzy Search            │
│  • Client-Side PDF Generation (jsPDF / html2canvas)         │
│  • Offline LocalStorage / IndexedDB Mutation Queue          │
└──────────────────────────────┬──────────────────────────────┘
                               │ Lightweight Pre-Computed Rows
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Google Apps Script & Google Sheets (Persistence Layer)     │
│  • Fast Append/Upsert of Pre-Calculated Summary Rows        │
│  • Zero Calculation Bottlenecks / Zero Apps Script Timeouts │
│  • Immutable Append-Only Audit Logging                      │
└─────────────────────────────────────────────────────────────┘
```

### 5.1. Rationale & Benefits
1. **Zero Cloud Latency & Quota Immunity**: Google Apps Script enforces a strict 6-minute execution ceiling and cell modification quotas. By delegating all calculations to the client, Apps Script acts strictly as a lightweight append/update storage proxy.
2. **Instant Field UX (0ms Delay)**: Supervisors marking attendance or allocating vehicles receive instantaneous validation and capacity warnings without waiting for HTTP round-trips.
3. **100% Offline Autonomy**: In remote quarries, stone crushers, and rural transit yards where mobile networks are spotty or non-existent, the Android tablet/phone completes full shift rosters, overtime computations, and PDF export completely offline.
4. **Pre-Calculated Sheet Appends**: When network connectivity is established, the client pushes finalized objects (`Daily_Payroll`, `Contractor_Settlements`, `Vehicle_Assignments`) directly into Google Sheets without requiring Google Sheets formula recalculation.

---

## 6. Automated Quality & Pre-Push Compilation Gate

To guarantee repository integrity, Git enforces a mandatory 4-tier check in [`.husky/pre-push`](./.husky/pre-push) before any code is pushed to remote:

```
[git push] ──► 1. Supervisor Build (Vite) ──► 2. Admin Build (Vite) ──► 3. Pages Bundle Assembly ──► 4. Shared Test Suite (Mocha) ──► [Push Allowed]
                      │                              │                            │                               │
                      ▼                              ▼                            ▼                               ▼
                 [Abort Push]                   [Abort Push]                 [Abort Push]                    [Abort Push]
```

---

## 7. Continuous Deployment to GitHub Pages

Every commit pushed to `master` triggers [`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml), executing:
1. Canonical two-job build and deployment targeting the official `github-pages` environment.
2. Direct publishing to **`https://visionloop-org.github.io/LaxmiEnterprise/`**.
