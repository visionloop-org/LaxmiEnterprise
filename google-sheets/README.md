# Laxmi Enterprise — Google Sheets Architecture & Setup Guide

> [!WARNING]
> **ARCHITECTURE NOTICE (October 2026):**  
> `Code.gs` is **retired and no longer used in production**. The system now uses **Direct Auth-First Architecture** (`AuthService` with Google Identity Services / OAuth 2.0 / direct verified sessions) and direct storage (`driveCsvService` / Cloudflare D1 edge database). This eliminates Google Apps Script cold starts, execution timeouts, and sheet lock contention. This folder is preserved for schema reference only.

This web application operates as a **100% serverless system** that stores, retrieves, and validates all workforce, attendance, fleet, and payroll records directly via **Direct Auth & Partitioned Storage**.

---

## 🏛️ Multi-Spreadsheet Modular Architecture (v5.0)

Instead of consolidating all tables into a single monolithic spreadsheet, Laxmi Enterprise partitions its database into **3 domain-specific Google Spreadsheets** inside Google Drive (`Vision Loop - Laxmi Enterprise / 01_Live_Database /`):

```
📁 Vision Loop - Laxmi Enterprise/
│
├── 📂 01_Live_Database/
│   ├── 📊 01_Laxmi_HR_Master          (HR, People, Rates & Access Control)
│   ├── 📊 02_Laxmi_Attendance_Fleet   (Shifts, Real-Time Check-ins, Fleet & Trips)
│   └── 📊 03_Laxmi_Payroll_Accounting (Daily Wages, Contractor Settlements, Audit Trail)
│
├── 📂 02_Daily_Attendance_Backups/     (Automated daily timestamped clones)
├── 📂 03_Monthly_Payroll_Reports/     (Archived monthly payroll summaries)
├── 📂 04_Supervisor_PDF_Exports/       (Uploaded supervisor shift PDF reports)
└── 📂 05_Contractor_Settlements/       (Contractor agency statements)
```

### Why Multi-Spreadsheet Architecture?
1. **Zero Concurrency Lock Contention**: Field supervisors logging live attendance or dispatching vehicles interact with `02_Laxmi_Attendance_Fleet` without competing for spreadsheet write locks with finance administrators running payroll in `03_Laxmi_Payroll_Accounting`.
2. **Access Control & Privacy (Drive Permissions)**: `03_Laxmi_Payroll_Accounting` can be restricted to business owners and accountants in Google Drive, while `02_Laxmi_Attendance_Fleet` can be shared with field supervisors.
3. **No Cell Limit Bottlenecks**: Avoids Google Sheets' 10-million cell limit by distributing operational records, trip logs, and audit trails across dedicated files.
4. **Automated Provisioning & Routing**: Google Apps Script (`Code.gs`) acts as a unified, transparent API router. Any call to `saveEmployee` routes to HR, `saveAttendanceRecord` routes to Fleet, and `savePayroll` routes to Accounting automatically.

---

## 📋 The 3 Domain Spreadsheets

### 1. `01_Laxmi_HR_Master`
* **Employees**: Comprehensive worker roster, ID badge numbers, pay rates, phone, contractor links.
* **Contractors**: Third-party labour supplier registry, contact persons, commission rates.
* **Rates_Config**: Base rates per category, 1.5x overtime multipliers, 8-hour workday standards.
* **Users_Roles**: Gmail-based authentication and role mapping (`Admin`, `Supervisor`, `Viewer`).

### 2. `02_Laxmi_Attendance_Fleet`
* **Vehicles**: Fleet registry, registration numbers, types (Truck, Van, Tipper), max capacity (8 pax).
* **Attendance_Sessions**: Daily shift headers, supervisor tracking, finalized / unlocked status.
* **Attendance_Records**: Worker check-ins (`on_time`, `arrived` with arrival time, `absent`), base and extra pay.
* **Vehicle_Assignments**: Shift worker-to-vehicle allocations (enforcing max 1 Driver, max 1 Chalan Man, max 6 Workers).
* **Vehicle_Trips**: Full trip lifecycle (`Dispatched` -> `Arrived At Site` -> `Delivered` -> `Returned`).
* **Extra_Labour_Requests**: Supervisor emergency contractor labour requests.
* **Vehicle_Maintenance**: Odometer, fuel, service logs, and maintenance reminders.

### 3. `03_Laxmi_Payroll_Accounting`
* **Daily_Payroll**: Finalized daily wage disbursements, overtime payouts, incentives, authorized admin.
* **Contractor_Settlements**: Third-party contractor billing, commission calculations, payment references.
* **Monthly_Summary**: Aggregated monthly man-days, operating days, and total payroll expense.
* **Audit_Logs**: Immutable append-only audit trail capturing every system mutation.

---

## ⚡ 1-Minute Deployment & Setup Instructions

### Step 1: Open Google Apps Script
1. Open Google Sheets ([sheets.new](https://sheets.new)) or open [script.google.com](https://script.google.com).
2. Create a new Apps Script project named **`Laxmi Enterprise Web API`**.
3. Paste the entire contents of [`google-sheets/Code.gs`](./Code.gs) into the editor.
4. Save the project (Ctrl+S or the Disk icon).

### Step 2: Run Multi-Spreadsheet Setup
1. In the Apps Script toolbar function dropdown, select **`setupMultiSpreadsheetArchitecture`**.
2. Click **Run**.
3. When prompted for authorization:
   - Click **Review permissions** -> Select your Google account -> Click **Advanced** -> Click **Go to Laxmi Enterprise Web API (unsafe)** -> Click **Allow**.
4. The script automatically:
   - Creates the Google Drive folder hierarchy (`Vision Loop - Laxmi Enterprise / ...`).
   - Provisions `01_Laxmi_HR_Master`, `02_Laxmi_Attendance_Fleet`, and `03_Laxmi_Payroll_Accounting`.
   - Formats all 15 worksheets with color-coded headers and frozen rows.
   - Populates initial seed data with official user role assignments in `Users_Roles`:
     - **Admin**: `Gauravjaiswal0304@gmail.com`
     - **Supervisor**: `Maalaxmi.godown@gmail.com`
   - Saves file IDs in `ScriptProperties` for transparent routing.

### Step 3: Deploy as Web App
1. In Apps Script, click **Deploy** (top right) > **New deployment**.
2. Select type: **Web app**.
3. Configure settings:
   - **Description**: `Laxmi Enterprise v5.0 Multi-Spreadsheet API`
   - **Execute as**: `Me (your-email@gmail.com)`
   - **Who has access**: `Anyone`
4. Click **Deploy**.
5. Copy the generated **Web App URL** (`https://script.google.com/macros/s/AKfycb.../exec`).

### Step 4: Connect in the Web Application
1. Open the Laxmi Enterprise Admin Portal or Supervisor Tablet App.
2. Click **📊 Google Sheets Sync** in the header.
3. Paste the **Web App URL** and click **Test Connection** -> **Save Config**.
4. The system will display the status of all 3 domain spreadsheets with direct 1-click links to open each in Google Sheets!

### API and File-Based Access (No Browser Required)

The deployed Apps Script Web App is a JSON REST API. Use the project CLI for health checks, exports, imports, and direct mutations:

```bash
set LAXMI_SHEETS_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
npm run sheets:api -- ping
npm run sheets:api -- get-table Employees --out employees.json
npm run sheets:api -- export sheets-backup.json
npm run sheets:api -- import sheets-backup.json
npm run sheets:api -- check-role user@example.com
npm run sheets:api -- post saveEmployee employee.json
```

On PowerShell, set the URL with `$env:LAXMI_SHEETS_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec'`. The `import` command accepts either the CLI export format (`{ "data": { ... } }`) or a direct table map. The generic `post` command reads a JSON object and merges it with the requested API action.

---

## ⚡ Client-Centric Heavy Computation Pattern

To protect Google Sheets performance and prevent hitting Google Apps Script execution time limits:
- **Clean Storage Tier**: Google Sheets is used strictly as a structured, reliable storage and audit-logging layer.
- **Client CPU Power**: All heavy computation (1.5x overtime wage calculation, contractor commission aggregation, fleet knapsack cargo packing, and conflict detection) is executed on the client device CPU via [`ClientComputationService`](../packages/shared/services/clientComputationService.js).
- **Zero Formula Overhead**: Rather than populating thousands of CPU-draining `=VLOOKUP` or `=SUM` formulas in Google Sheets, the client app writes final, validated values directly, preserving high spreadsheet performance and 100% quota compliance.

