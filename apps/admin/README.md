# Laxmi Enterprise — Admin Analytics & Governance Portal

The Admin Portal is an administrative dashboard for Laxmi Enterprise management. It provides organization-wide attendance analytics, automated daily payroll computations, supervisor workforce request approvals, emergency session unlocking, fleet utilization tracking, and data export tools.

Authorized Administrator: **`Gauravjaiswal0304@gmail.com`**

---

## 🌟 Key Features

### 1. Installable Web App (PWA) & Standalone Mode
- **In-App PWA Installation**: Tap the **"Install App"** button ([`InstallAppButton`](../../packages/shared/components/InstallAppButton.jsx)) on desktop Chrome/Edge or Android mobile/tablet devices to install the Admin portal as a standalone app.
- **Offline Caching**: Static shell assets and stylesheets are cached via `sw.js` for instant application loading.

### 2. Client-Centric Heavy Computation Engine
All calculation-intensive logic is processed on the client device CPU using [`ClientComputationService`](../../packages/shared/services/clientComputationService.js):
- **Dynamic 1.5x Overtime Wage Computation**: Computes exact base earnings and 1.5x overtime wages (`extraHours * (baseRate / 8) * 1.5`) across 150+ workers in 0ms.
- **Contractor Agency Settlements**: Aggregates man-days, gross wages, and commission fees (`wages * (rate / 100)`) grouped by contractor.
- **Fleet Cargo & Headcount Knapsack Packing**: Optimizes passenger seat assignments and vehicle capacity distributions.
- **High-Speed In-Memory Filtering**: Instant search and filtering across thousands of attendance records without server latency.

### 3. Attendance & Historical Date Range Filtering
- Filter all workforce attendance records across flexible date ranges:
  - **Quick Presets**: Today, Last 7 Days, Last 30 Days.
  - **Custom Range**: Start date and end date selectors.
- Overview KPI summary cards: Total Registered Workforce, Active Fleet Vehicles, Present Today, Vehicles Currently In Use.

### 4. Contractor Agency Settlements
- Aggregates daily wages, overtime, and incentive bonuses grouped by labour contractor agency.
- Instant CSV export for contractor bank settlement and NEFT payouts.

### 5. Supervisor Request Approval Center
- Review on-the-fly employee and extra labour addition requests submitted by field supervisors.
- Admin governance actions:
  - **Approve**: Activates the employee record for full assignment and payroll eligibility.
  - **Reject**: Declines the addition with reason logging.
  - **Edit**: Corrects name, category, or contractor details inline.
  - **Delete**: Permanently removes obsolete or invalid employee entries.

### 6. Emergency Session Unlock (Admin Exclusive)
- Allows administrators to reset a finalized session back to `in_progress` if corrections are required after a supervisor has finalized the daily sheet.

### 7. Fleet Utilization & Trip Monitoring
- Real-time vehicle status indicators (`Available`, `In Use`, `Maintenance`).
- Integrated trip monitoring displaying vehicle dispatch and delivery stages.

### 8. Multi-Spreadsheet Management & Quick Links
- Direct 1-click links in the header to open each domain spreadsheet:
  - **👥 HR**: `01_Laxmi_HR_Master`
  - **🚛 Fleet**: `02_Laxmi_Attendance_Fleet`
  - **💰 Payroll**: `03_Laxmi_Payroll_Accounting`
- Interactive Google Sheets Sync Modal ([`GoogleSheetsSyncModal`](../../packages/shared/components/GoogleSheetsSyncModal.jsx)) with live health checks and manual push/pull overrides.

---

## 🛠️ Architecture & Modular Components

The Admin application follows a strict single-responsibility design where all UI files are kept under 150 lines:

```
apps/admin/src/
├── components/
│   ├── AdminHeader.jsx             # Top bar with user role badge, PWA install button, and domain sheet links
│   ├── LoginPage.jsx               # Dedicated sign-in view for Gmail and admin credentials
│   ├── StatsOverview.jsx           # KPI metrics & fleet utilization cards
│   ├── PendingApprovalsBanner.jsx  # Supervisor worker addition approval alert
│   ├── ContractorPayrollPanel.jsx  # Agency settlement breakdown & CSV export
│   ├── EmployeeManagementTable.jsx # Searchable, filterable, paginated employee master table
│   ├── FleetManagementTable.jsx    # Vehicle fleet status & live trip dispatch tracker
│   ├── SessionUnlockPanel.jsx      # Admin session unlock/reset tool
│   ├── BulkCompensationModal.jsx   # Batch rate editor with presets & CSV upload/download
│   ├── EditEmployeeModal.jsx       # Individual worker compensation & contractor editor
│   └── AdminDashboard.jsx          # Clean composition layer
├── App.jsx                         # Concise 20-line authentication shell
└── App.css                         # Dark/light responsive theme styling
```

---

## 🚀 Getting Started

### Local Development
```bash
# From workspace root
npm run dev:admin

# Or from apps/admin directory
cd apps/admin
npm install
npm run dev
```
The application runs on `http://localhost:5174` (or `http://localhost:5173/admin/` via unified dev runner).

### Production Build & Linting
```bash
npm run build
npm run lint
```

---

## 🔐 Authentication & Access Governance

- **Google Identity Services (GIS)**: Sign in with your verified Gmail account.
- **Authorized Administrator**: `Gauravjaiswal0304@gmail.com`
- **Role Governance**: Permissions are managed directly inside the `Users_Roles` worksheet in `01_Laxmi_HR_Master`.
- **Demo Fallback (Offline)**: `admin` / `password123`

