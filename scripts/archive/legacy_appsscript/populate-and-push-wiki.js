import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const WIKI_DIR = 'C:\\Users\\pc\\AppData\\Local\\Temp\\laxmi-wiki-repo'

const files = {
  '_Sidebar.md': `### 📖 Navigation
* [[Home]]
* [[Project Roadmap]]
* [[Architecture and Tech Stack]]
* [[Google Sheets Database]]
* [[Supervisor Tablet App]]
* [[Admin Management Portal]]
* [[Deployment and CI-CD]]

---
### 🌐 Live Production Links
* [Admin Portal](https://visionloop-org.github.io/LaxmiEnterprise/admin/)
* [Supervisor App](https://visionloop-org.github.io/LaxmiEnterprise/)
* [Google Sheet Database](https://docs.google.com/spreadsheets/d/1VHvHCOzwzMhkG5K4NfE8BHNF-KGzgG4IVedN-Jr4tCI/edit)
* [Apps Script API](https://script.google.com/macros/s/AKfycbwVjlUPjX59Oy5G7nruqE_5iR5iKy0mevyHZuA0r_twa3UCx0Jc2QkYtMaWBjIwRNx4/exec)
`,

  '_Footer.md': `---
*Laxmi Enterprise &bull; Designed and Maintained by Vision Loop Core Engineering Team &bull; © 2026 Vision Loop*
`,

  'Project-Roadmap.md': `# 🗺️ Project Roadmap & Current Status

This roadmap outlines the past, present, and future engineering milestones for the **Laxmi Enterprise Workforce Attendance and Vehicle Fleet Dispatch Platform**.

---

## 📊 Status Matrix

| Phase | Milestone | Version | Target Cadence | Status |
| :--- | :--- | :---: | :---: | :---: |
| **Phase 1** | Foundation & Mobile Tablet Architecture | v1.0 | Q1 2026 | ✅ Complete |
| **Phase 2** | Fleet Management & Dynamic Vehicle Dispatch | v2.0 | Q2 2026 | ✅ Complete |
| **Phase 3** | Serverless Google Sheets Cloud Engine | v3.0 | Q3 2026 | ✅ Complete |
| **Phase 4** | Component Modularization (<150 LOC) & Quality Gates | v4.1 | Q3 2026 | ✅ Complete |
| **Phase 5** | Biometric Scanner Sync & WhatsApp Shift Reports | v4.5 | Q4 2026 | 📋 Planned |
| **Phase 6** | Predictive Workforce Analytics & Odoo Enterprise Sync | v5.0 | Q1 2027 | 📋 Backlog |

---

## 🏁 Detailed Milestone Breakdown

### Phase 1: Foundation & Mobile Tablet Architecture (✅ Complete)
- **Monorepo Structure**: Initialized clean npm workspaces monorepo containing \`apps/admin\`, \`apps/supervisor\`, and \`packages/shared\`.
- **Field-Ready Tablet UI**: High-contrast, large-button mobile interface designed for outdoor sunlight legibility during 06:00 AM field roll calls.
- **Single-Tap Attendance**: Click-to-cycle statuses (\`Pending\` &rarr; \`On Time\` &rarr; \`Late / Arrived\` &rarr; \`Absent\`).
- **Offline-First State**: Immediate storage in browser \`localStorage\` to guarantee zero data loss during unstable field connectivity.

### Phase 2: Fleet Management & Dynamic Dispatch (✅ Complete)
- **Vehicle Master Database**: Fleet classification (40-Seater Buses, 14-Seater Force Travelers, Pickup Trucks, Personal Bikes).
- **Seat Allocation & Conflict Alerts**: Automated verification that passenger headcount does not exceed vehicle seating capacity, triggering visual warning dialogs.
- **Trip Tracking**: Logs dispatch departure times, arrival times, route details, and odometer readings.

### Phase 3: Serverless Google Sheets Cloud Database (✅ Complete)
- **Cloud Database Provisioning**: Automated creation of **15 specialized sheets** inside Google Spreadsheet \`Laxmi Enterprise Database\` owned by \`visionloop.in@gmail.com\`.
- **Apps Script REST Engine**: Deployed live Web App API (\`doGet\` / \`doPost\`) supporting \`ping\`, \`getAll\`, \`batchSync\`, \`recordAttendance\`, \`assignVehicle\`, and role authorization.
- **Google Drive Storage Hierarchy**: Auto-generation of 5 backup subfolders in Google Drive for daily reports, PDFs, and contractor settlements.

### Phase 4: Component Modularization & Enterprise Hardening (✅ Complete)
- **Component Decomposition**: Decomposed monolithic admin and supervisor files into reusable components under 150 lines each.
- **Automated Pre-Push Compilation Gate**: Integrated Husky pre-push hooks running full Vite builds and Mocha test suites before any git push.
- **Multi-Role Google Auth**: Seamless Google Identity integration enabling passwordless supervisor and admin authentication.

### Phase 5: Hardware & Integration Upgrades (📋 Planned - Q4 2026)
- **Biometric USB / Bluetooth Fingerprint Scanner**: Direct WebUSB integration with optical fingerprint readers for biometric fraud prevention.
- **Automated WhatsApp PDF Digests**: Apps Script trigger automatically rendering morning and evening shift PDF summaries and transmitting them to management via WhatsApp Business API.
- **Offline SQLite / IndexedDB Upgrade**: Transitioning local cache from \`localStorage\` to IndexedDB for high-volume photo attachments.

---
`,

  'Architecture-and-Tech-Stack.md': `# 🏗️ Architecture & Technology Stack

The Laxmi Enterprise platform is engineered as a **100% serverless, zero-maintenance system** deployed globally via GitHub Pages with Google Sheets serving as the live transactional cloud database.

---

## 📐 System Architecture Diagram

\`\`\`mermaid
flowchart TB
    subgraph ClientLayer["Frontend Client Layer (GitHub Pages)"]
        A["Supervisor Tablet PWA\n(apps/supervisor)"]
        B["Admin Operations Portal\n(apps/admin)"]
        C["Shared Core Library\n(packages/shared)"]
    end

    subgraph StateLayer["Offline-First State Layer"]
        D["Local Storage Engine\n(Instant Zero-Latency Read/Write)"]
        E["React Query v5 Cache\n(Optimistic Updates & Query Deduplication)"]
    end

    subgraph CloudLayer["Google Cloud Serverless Infrastructure"]
        F["Google Apps Script REST API\n(Code.gs Web App Endpoint)"]
        G["Google Spreadsheet Database\n(15 Specialized Sheets)"]
        H["Google Drive Cloud Storage\n(Root Backup Folder ID: 17ZL1U...)"]
    end

    A <--> C
    B <--> C
    C <--> E
    E <--> D
    C <-->|"HTTPS REST\n(GET / POST JSON)"| F
    F <--> G
    F <--> H
\`\`\`

---

## 🛠️ Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :---: | :--- |
| **Frontend Framework** | React | 19.x | High-performance reactive user interface. |
| **Build & Bundler** | Vite | 8.x | Ultra-fast HMR and minified ESM bundle generation. |
| **State Management** | TanStack Query | 5.x | Server-state caching, automatic refetching, and offline mutations. |
| **Database** | Google Sheets | Cloud | Real-time tabular database with 15 synchronized sheets. |
| **API Middleware** | Google Apps Script | V8 Engine | Serverless REST API with OAuth 2.0 access control. |
| **Cloud Storage** | Google Drive | Cloud | Automated PDF shift backups and contractor billing sheets. |
| **Hosting & CDN** | GitHub Pages | Global CDN | Free-forever high-availability global static hosting. |
| **Quality & CI/CD** | Husky + GitHub Actions | Latest | Automated pre-push compilation gates and deployment pipelines. |

---

## 📦 Monorepo Architecture

\`\`\`
d:\\VisionLoop\\Projects\\LaxmiEnterprise\\
├── apps/
│   ├── admin/              # Admin Portal (Workforce, Wages, Fleet, Approvals)
│   │   ├── src/components/ # Modular components (<150 lines each)
│   │   └── .env            # Configured with live Web App URL
│   └── supervisor/         # Supervisor Tablet App (Field Attendance, Vehicles)
│       ├── src/components/ # Touch-optimized tablet components
│       └── .env            # Configured with live Web App URL
├── packages/
│   └── shared/             # Reusable Core Domain Services & UI
│       ├── components/     # StatusBadge, GoogleSheetsSyncModal, ErrorBoundary
│       ├── hooks/          # useEmployees, useVehicles, useTrips, useRates
│       ├── services/       # googleSheetsService, authService, restServices
│       └── utils/          # requestId, calculation helpers, formatters
├── google-sheets/          # Cloud Backend
│   ├── Code.gs             # Apps Script REST API & Database Setup Code
│   ├── README.md           # Deployment records and setup documentation
│   └── SHEET_STRUCTURE.md  # Column-by-column schema specifications
└── .husky/                 # Pre-push compilation and test verification hooks
\`\`\`
`,

  'Google-Sheets-Database.md': `# 📊 Google Sheets Cloud Database Specification

The system uses a centralized Google Spreadsheet as its relational database. The database is titled **\`Laxmi Enterprise Database\`** and is hosted securely under \`visionloop.in@gmail.com\`.

---

## 🔗 Cloud Endpoints & IDs

* **Spreadsheet ID**: \`1VHvHCOzwzMhkG5K4NfE8BHNF-KGzgG4IVedN-Jr4tCI\`
* **Spreadsheet Link**: [Open Database](https://docs.google.com/spreadsheets/d/1VHvHCOzwzMhkG5K4NfE8BHNF-KGzgG4IVedN-Jr4tCI/edit)
* **Apps Script API URL**: \`https://script.google.com/macros/s/AKfycbwVjlUPjX59Oy5G7nruqE_5iR5iKy0mevyHZuA0r_twa3UCx0Jc2QkYtMaWBjIwRNx4/exec\`
* **Apps Script Project ID**: \`1OG48kjlgZg7urhWL6rzdS4-wOuzqnFPF3VElTWBPSN8fazK89OA70Ry3\`
* **Drive Root Folder ID**: \`17ZL1U_N_AE-F1iP0t31e9-DGZGDNMSFp\`

---

## 📑 15 Specialized Data Sheets

\`\`\`mermaid
erDiagram
    Employees ||--o{ Attendance_Records : "has many"
    Employees ||--o{ Vehicle_Assignments : "assigned in"
    Vehicles ||--o{ Vehicle_Assignments : "transports"
    Vehicles ||--o{ Vehicle_Trips : "executes"
    Contractors ||--o{ Employees : "supplies"
    Attendance_Sessions ||--o{ Attendance_Records : "contains"
    Attendance_Sessions ||--o{ Daily_Payroll : "aggregates"
    Contractors ||--o{ Contractor_Settlements : "billed in"
\`\`\`

### 1. Master Tables
1. **\`Employees\`**: Employee ID, Full Name, Category (\`Drivers\`, \`Workers\`, \`Chalan Men\`, \`Supervisors\`), Status, Phone Number, Contractor Agency, Daily Base Rate (₹), Extra Hours, Incentive, Photo URL, Display Order.
2. **\`Vehicles\`**: Vehicle Registration ID, Model Name, Seating Capacity, Type (\`Bus\`, \`Traveler\`, \`Truck\`, \`Bike\`), Operational Status, Assigned Regular Driver.
3. **\`Contractors\`**: Contractor ID, Agency Name, Contact Person, Phone, Commission Rate (%), Active Labor Count, Settlement Frequency.
4. **\`Rates_Config\`**: Shift Type, Shift Base Hours, Regular Shift Rate, Overtime Multiplier, Holiday Incentive Bonus.
5. **\`Users_Roles\`**: User Email, Display Name, Role (\`Admin\`, \`Supervisor\`, \`Developer\`), Active Status.

### 2. Transaction Tables
6. **\`Attendance_Sessions\`**: Session ID, Shift Date, Shift Name (\`Morning\`, \`Evening\`), Supervisor Name, Session Status (\`Open\`, \`Locked\`), Lockdown Timestamp.
7. **\`Attendance_Records\`**: Record ID, Session ID, Employee ID, Status (\`On Time\`, \`Late\`, \`Absent\`), Arrival Time, Overtime Hours, Incentive (₹), Remarks.
8. **\`Vehicle_Assignments\`**: Assignment ID, Session ID, Employee ID, Vehicle ID, Seat Number, Boarding Time.
9. **\`Vehicle_Trips\`**: Trip ID, Vehicle ID, Driver Name, Start Time, End Time, Start Odometer, End Odometer, Route Name, Trip Status.
10. **\`Daily_Payroll\`**: Payroll ID, Session ID, Employee ID, Base Wage, Overtime Pay, Incentive Amount, Penalty Deductions, Net Total Wage.

### 3. Workflow & Maintenance Tables
11. **\`Contractor_Settlements\`**: Settlement ID, Contractor ID, Period Start, Period End, Total Labor Days, Gross Billed, Agency Commission, Net Payable.
12. **\`Extra_Labour_Requests\`**: Request ID, Session ID, Supervisor Name, Required Worker Count, Reason, Approval Status (\`Pending\`, \`Approved\`, \`Rejected\`).
13. **\`Vehicle_Maintenance\`**: Log ID, Vehicle ID, Service Date, Service Type, Workshop Name, Total Cost (₹), Invoiced By.
14. **\`Monthly_Summary\`**: Month-Year, Total Shift Count, Total Labor Days, Gross Payroll Total, Total Fleet Fuel Cost.
15. **\`Audit_Logs\`**: Timestamp, User Email, Action Performed, Target Table, Record Key, Previous Value, New Value, Client IP.

---

## 🔌 Apps Script REST API Endpoints

### GET Requests
* \`?action=ping\`: Health check verifying spreadsheet connectivity.
* \`?action=getAll\`: Fetches all 14 tabular domains in a single JSON payload.
* \`?action=getData&sheet=<sheetName>\`: Fetches records from a specific table.
* \`?action=checkRole&email=<userEmail>\`: Returns user privileges for Google Identity.

### POST Requests
* \`action=batchSync\`: Atomically updates multiple records across multiple sheets.
* \`action=recordAttendance\`: Saves individual employee check-in and overtime data.
* \`action=assignVehicle\`: Updates vehicle seat assignment with capacity validation.
* \`action=lockSession\`: Locks the shift to prevent further edits.
`,

  'Supervisor-Tablet-App.md': `# 📱 Supervisor Tablet Application Guide

The **Supervisor Application** is a specialized, mobile-optimized progressive web app designed for field supervisors operating at industrial worksites during high-pressure shift roll calls.

---

## 🌅 Daily Shift Workflow

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Sup as Field Supervisor
    participant App as Tablet App (Local Cache)
    participant Cloud as Google Sheets Cloud API

    Sup->>App: 1. Launch App (06:00 AM)
    App->>Cloud: Fetch latest employee master roster
    Sup->>App: 2. Tap employee card (Cycle: On Time / Arrived / Absent)
    App->>App: Instant zero-latency UI update
    Sup->>App: 3. Assign employees to buses / travelers
    App->>App: Verify passenger count <= Vehicle capacity
    Sup->>App: 4. Tap "Confirm Attendance & Close Shift"
    App->>Cloud: Atomic batch upload to Attendance_Records & Vehicle_Assignments
    Cloud-->>App: Sync Confirmed (Notice displayed)
\`\`\`

---

## 🔑 Key Features

### 1. High-Contrast Field Visuals
- Designed with high-contrast color badges to ensure clear readability under direct bright sunlight.
- Touch targets exceed 48px to enable rapid single-tap inputs without precision issues.

### 2. Vehicle Dispatch & Capacity Guard
- Shows real-time passenger counters on vehicle cards (e.g., \`12 / 14 Seats\`).
- If an additional employee is assigned to a full vehicle, a **Capacity Conflict Warning Dialog** is triggered preventing unsafe transport overloads.

### 3. Extra Labour On-Demand Requests
- When additional hands are required at the worksite, the supervisor can submit an **Extra Worker Request** specifying headcounts and contractor agencies directly from the field.

### 4. Zero-Latency Offline Storage
- Every tap immediately writes to \`localStorage\`. If field cellular signal is lost, the supervisor continues operations uninterrupted; data pushes automatically once signal recovers.
`,

  'Admin-Management-Portal.md': `# 🖥️ Admin Operations & Governance Portal

The **Admin Portal** is the centralized executive command dashboard for Laxmi Enterprise owners, accountants, and dispatch coordinators.

---

## 🎯 Executive Dashboard Features

### 1. Live Operational KPIs
* **Total Workforce Active**: Total drivers, workers, and chalan men registered.
* **Shift Attendance Rate**: Real-time percentage of present workforce vs expected roster.
* **Daily Accrued Payroll**: Live calculation of total wages accrued for the day including regular rates, overtime hours, and holiday bonuses.
* **Fleet Dispatch Readiness**: Available seats vs assigned workers across the fleet.

---

## 👥 Workforce Management
* **Search & Filter**: Rapidly filter employees by category (\`Drivers\`, \`Workers\`, \`Chalan Men\`), contractor agency, or active status.
* **Batch Wage Editor**: Update base rates, overtime multipliers, or incentive rules across dozens of workers simultaneously with preset templates.
* **Individual Employee Profile**: Edit contact numbers, assign default vehicles, adjust daily base rates, and attach photos.

---

## 🤝 Third-Party Contractor Settlements
* Automatic calculation of contractor agency invoices based on verified daily attendance logs.
* Breaks down labor days supplied, gross billed amounts, agency commission percentages, and net payable balances.

---

## 🔒 Session Lockdown & Integrity Controls
* Once a morning or evening shift is completed by the supervisor, the session enters **Locked Status**.
* Once locked, attendance records cannot be tampered with or modified from the field without explicit Admin Session Unlock authorization.
* All changes generate an immutable record in the **\`Audit_Logs\`** sheet.
`,

  'Deployment-and-CI-CD.md': `# 🚀 Deployment & CI/CD Pipeline

The Laxmi Enterprise platform employs automated continuous integration and deployment pipelines to ensure code reliability and global availability.

---

## 🌐 Free-Forever Production Architecture

\`\`\`mermaid
flowchart LR
    Dev["Developer Git Push"] --> Husky["Local Husky Pre-Push Gate\n(Build & Tests)"]
    Husky --> GitHub["GitHub Repository\n(visionloop-org/LaxmiEnterprise)"]
    GitHub --> Action["GitHub Actions Workflow\n(.github/workflows/deploy.yml)"]
    Action --> Build["Build Vite Admin & Supervisor Apps"]
    Build --> Pages["Deploy to GitHub Pages CDN\n(Global HTTPS)"]
    Pages --> Live["Live Users Worldwide"]
\`\`\`

---

## 🛡️ Pre-Push Quality Gate

To enforce code quality and prevent broken code from ever reaching production, a mandatory Git pre-push hook is installed at \`.husky/pre-push\`:

\`\`\`bash
#!/bin/sh
# 1. Build all workspaces to verify zero syntax/compilation errors
npm run build --workspaces

# 2. Run shared package unit tests
npm run test:gsheets --workspace=packages/shared
npm run test:utils --workspace=packages/shared
\`\`\`

If any app fails to build or any test fails, the push is **aborted automatically**.

---

## ⚙️ Environment Variables

Both \`apps/admin\` and \`apps/supervisor\` configure the live Google Sheets Web App endpoint:

\`\`\`env
# .env
VITE_GOOGLE_SHEETS_WEBAPP_URL=https://script.google.com/macros/s/AKfycbwVjlUPjX59Oy5G7nruqE_5iR5iKy0mevyHZuA0r_twa3UCx0Jc2QkYtMaWBjIwRNx4/exec
VITE_GOOGLE_SHEET_ID=1VHvHCOzwzMhkG5K4NfE8BHNF-KGzgG4IVedN-Jr4tCI
VITE_GOOGLE_SHEET_URL=https://docs.google.com/spreadsheets/d/1VHvHCOzwzMhkG5K4NfE8BHNF-KGzgG4IVedN-Jr4tCI/edit
\`\`\`
`
}

for (const [filename, content] of Object.entries(files)) {
  const filePath = path.join(WIKI_DIR, filename)
  fs.writeFileSync(filePath, content.trim() + '\n', 'utf8')
  console.log(`Created wiki file: ${filename}`)
}

console.log('All wiki pages created! Staging and committing to git...')
execSync('git add -A', { cwd: WIKI_DIR, stdio: 'inherit' })
execSync('git commit -m "docs(wiki): add complete enterprise wiki documentation, roadmap, and architecture"', { cwd: WIKI_DIR, stdio: 'inherit' })
console.log('Pushing to GitHub wiki repository...')
execSync('git push origin master', { cwd: WIKI_DIR, stdio: 'inherit' })
console.log('🎉 GitHub Wiki successfully populated and pushed!')
