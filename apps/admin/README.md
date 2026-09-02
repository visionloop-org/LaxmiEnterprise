# Laxmi Enterprise — Admin Analytics & Governance Portal

The Admin Portal is an administrative dashboard for Laxmi Enterprise management. It provides organization-wide attendance analytics, automated daily payroll computations, supervisor workforce request approvals, emergency session unlocking, fleet utilization tracking, and data export tools.

---

## 🌟 Key Features

### 1. Attendance & Historical Date Range Filtering
- Filter all workforce attendance records across flexible date ranges:
  - **Quick Presets**: Today, Last 7 Days, Last 30 Days.
  - **Custom Range**: Start date and end date selectors.
- Overview KPI summary cards: Total Registered Workforce, Active Fleet Vehicles, Present Today, Vehicles Currently In Use.

### 2. Automated Payroll & Overtime Engine
- Automatically computes daily base compensation and extra duty/overtime pay based on verified attendance records.
- Configurable category wage presets:
  - **Drivers**: ₹800/day
  - **Office Staff**: ₹750/day
  - **Chalan Men**: ₹650/day
  - **Workers**: ₹500/day
  - **Extra Labour**: ₹450/day
- Calculates 1.5x overtime rates for extra hours recorded during field shifts.

### 3. Contractor Agency Settlements
- Aggregates daily wages, overtime, and incentive bonuses grouped by labour contractor agency.
- Instant CSV export for contractor bank settlement and NEFT payouts.

### 4. Supervisor Request Approval Center
- Review on-the-fly employee and extra labour addition requests submitted by field supervisors.
- Admin governance actions:
  - **Approve**: Activates the employee record for full assignment and payroll eligibility.
  - **Reject**: Declines the addition with reason logging.
  - **Edit**: Corrects name, category, or contractor details inline.
  - **Delete**: Permanently removes obsolete or invalid employee entries.

### 5. Emergency Session Unlock (Admin Exclusive)
- Allows administrators to reset a finalized session back to `in_progress` if corrections are required after a supervisor has finalized the daily sheet.

### 6. Fleet Utilization & Trip Monitoring
- Real-time vehicle status indicators (`Available`, `In Use`, `Maintenance`).
- Integrated trip monitoring displaying vehicle dispatch and delivery stages.

### 7. Google Sheets Cloud Database Sync
- Interactive Google Sheets Sync Modal ([`GoogleSheetsSyncModal`](../../packages/shared/components/GoogleSheetsSyncModal.jsx)) with live health checks and manual push/pull overrides.

---

## 🛠️ Architecture & Modular Components

The Admin application follows a strict single-responsibility design where all UI files are kept under 150 lines:

```
apps/admin/src/
├── components/
│   ├── AdminHeader.jsx             # Top bar with user role badge and Google Sheets sync modal trigger
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
- **Role Governance**: Permissions are managed directly inside the `Users_Roles` worksheet in Google Sheets (`Admin`, `Supervisor`, `Viewer`).
- **Demo Fallback (Offline)**: `admin` / `password123`
