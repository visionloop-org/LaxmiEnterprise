# Laxmi Enterprise — Master Workspace Instructions

**Version:** 5.0  
**Last Updated:** September 6, 2026

---

## 1. Purpose

This document governs the active projects in this monorepo workspace:

1. **`apps/supervisor`** — Supervisor-facing installable PWA (Progressive Web App) optimized for Android tablets and smartphones.
2. **`apps/admin`** — Administrative analytics, automated payroll, contractor settlements, and governance portal (PWA supported).
3. **`packages/shared`** — Centralized React Query hooks, Google Sheets services, client computation engine (`ClientComputationService`), UI components, and TypeScript contracts.
4. **`google-sheets`** — Google Apps Script Web App API (`Code.gs`) routing across 3 domain-specific spreadsheets, backup routines, and schema definitions.
5. **`Marker-CS-Extractor`** — Python document data extraction utility.

This master document establishes core boundaries, multi-spreadsheet partitioning, user role assignments, client-side heavy computation rules, and interaction protocols.

---

## 2. Source of Truth & Database Partitioning

The **Google Sheets database and Google Drive storage** are the absolute, 100% serverless single source of truth partitioned across **3 domain-specific Google Spreadsheets** inside Google Drive (`Vision Loop - Laxmi Enterprise / 01_Live_Database /`):

1. **`01_Laxmi_HR_Master`**:
   - `Employees`, `Contractors`, `Rates_Config`, `Users_Roles`
2. **`02_Laxmi_Attendance_Fleet`**:
   - `Vehicles`, `Attendance_Sessions`, `Attendance_Records`, `Vehicle_Assignments`, `Vehicle_Trips`, `Extra_Labour_Requests`, `Vehicle_Maintenance`
3. **`03_Laxmi_Payroll_Accounting`**:
   - `Daily_Payroll`, `Contractor_Settlements`, `Monthly_Summary`, `Audit_Logs`

### Automated Daily Snapshots & 5-Year Rolling Lifecycle
1. The Google Apps Script routine `backupSpreadsheetToDrive()` executes daily to clone all 3 active sheets into `Vision Loop - Laxmi Enterprise / 02_Daily_Attendance_Backups/` with date-time stamps.
2. **5-Year Data Retention Engine**: Attendance records, trip histories, and audit logs older than 5 years (1,825 days) are automatically deleted via a monthly scheduled routine. Active operational data is strictly maintained under **50 MB** (<1% of the 2 GB lifetime allowance). Annual payroll summaries are archived prior to purge.

---

## 3. Role Assignments & Access Governance

User authentication is performed via Google Identity Services (GIS) OpenID Connect JWT tokens, mapped to roles in the `Users_Roles` worksheet of `01_Laxmi_HR_Master`:

| Email / Role | Assigned Role | Permissions & Access Scope |
|---|---|---|
| **`Gauravjaiswal0304@gmail.com`** / **`admin@gmail.com`** | **Admin / Owner** | Full system access across all spreadsheets: workforce directory, base wage editing, 1.5x overtime approval, contractor agency settlements, session emergency unlocks, and system configuration. |
| **Finance Desk** | **Accountant / HR** | Attendance reconciliation, monthly payroll calculation, wage discrepancy adjustments, 1-click Bank Bulk Transfer CSV exports (NEFT/RTGS), and salary slip generation. |
| **`Maalaxmi.godown@gmail.com`** | **Supervisor** | Field operations access restricted to `02_Laxmi_Attendance_Fleet` and `01_Laxmi_HR_Master`: daily shift check-ins, vehicle capacity allocations, trip dispatch & delivery tracking, and extra labour requests. |
| **Field Employees** | **Worker** | Self-service read-only access: View personal attendance punch history, overtime hours, and digital salary slips. |

---

## 4. Client-Centric Heavy Computation Architecture

Because both the supervisor and admin web applications are installed as Progressive Web Apps (PWA) directly on Android mobile phones, tablets, and desktop workstations, **all heavy computation is executed 100% on the client device CPU** via [`ClientComputationService`](./packages/shared/services/clientComputationService.js):

- **Payroll & Overtime Calculations**: Computes base wages, 1.5x overtime compensation (`extraHours * (baseRate / 8) * 1.5`), and incentives with precision.
- **Contractor Agency Settlements**: Aggregates worker man-days, gross labour costs, and contractor commission payouts (`wages * (rate / 100)`).
- **Fleet Knapsack Cargo & Headcount Packing**: Optimizes worker-to-vehicle seat assignments subject to hard constraints (max 1 Driver, 1 Chalan Man, 6 Workers, 8 total passengers).
- **Live Conflict Detection**: Detects capacity violations, duplicate vehicle assignments, and unassigned present drivers in real time.
- **High-Speed In-Memory Filtering**: Performs multi-attribute filtering (category, status, name search, alphabetical ranges) locally with sub-millisecond responsiveness.

**Performance Benefit**: Offloading heavy math from Google Apps Script ensures zero execution timeout errors, avoids Google Sheets formula overhead, and provides an instantaneous 60 FPS user experience even during remote field network latency.

---

## 5. Multi-App Integration Contract

All client applications operate on a **Direct Auth-First Contract**. With `Code.gs` retired, clients communicate directly with partitioned storage via authenticated sessions:

```
User Action → Client Computation Engine (Instant Feedback) → Offline IndexedDB Queue → Direct Auth Verification (AuthService) → Partitioned Storage (Drive CSV / D1) → Success
```

- **Direct Auth Validation**: Operations verify caller role (`Admin`, `Supervisor`, `Accountant/HR`, `Worker`) directly in memory and session claims before performing mutations.
- **Micro-Batch Sync**: Writes are buffered locally in IndexedDB and committed in atomic batches to eliminate lock contention.
- **Offline-First Resilience**: Mutations are instantly saved in local storage and buffered when offline, synchronizing automatically when connectivity is restored.
- **Optimistic Concurrency**: Session updates send version counters to prevent accidental overwrites.
- **5-Year Data Lifecycle**: Pruning policies automatically discard raw shift records and audit logs older than 5 years to keep active storage under 50 MB (<1% of quota).
- **Formula Injection Sanitization**: All user strings beginning with `=`, `+`, `-`, or `@` are sanitized by prepending a single quote `'`.

---

## 6. Installable Web App (PWA) Standards

1. **Manifest Configuration**: Both `apps/supervisor` and `apps/admin` supply valid Web App Manifests with `display: "standalone"`, `orientation: "any"`, high-resolution icons (192x192, 512x512, maskable), and quick-action shortcuts.
2. **Service Worker Offline Caching**: Static shell assets and HTML/CSS/JS bundles are cached for seamless offline launching in remote quarry or yard locations without cellular reception.
3. **In-App Installation**: Both applications integrate [`InstallAppButton.jsx`](./packages/shared/components/InstallAppButton.jsx) providing an intuitive "Install App" button that handles native `beforeinstallprompt` on Android and provides clear guidance for iOS Safari users.
4. **Touch & Mobile Ergonomics**: Android tablets and smartphones feature large 48–56px touch targets, mobile sliding drawers for compact screens, and touch optimizations (`touch-action: manipulation`).

---

## 7. Error and Versioning Policy

- Google Sheets API errors return standardized payloads containing:
  - `status` (`success`, `error`)
  - `message` (User-friendly message)
  - `details` (Contextual debug details)
- If an API schema change is made:
  1. Update Google Apps Script (`google-sheets/Code.gs`).
  2. Update `packages/shared/services/googleSheetsService.js`.
  3. Update `packages/shared/types/` contracts.
  4. Run automated test suites: `npm run test:computation`, `npm run test:gsheets`, `npm run test:utils`.
  5. Assemble production pages bundle: `npm run build:pages`.

