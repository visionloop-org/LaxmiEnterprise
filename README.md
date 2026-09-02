# 🏢 Laxmi Enterprise — Workforce Attendance, Fleet & Payroll System

> **Live GitHub Pages URL:** [https://visionloop-org.github.io/LaxmiEnterprise/](https://visionloop-org.github.io/LaxmiEnterprise/)  
> **Author & Developer:** [Vision Loop](https://github.com/visionloop-org) (`visionloop.in@gmail.com`)  
> **Architecture:** 100% Serverless • Google Sheets Database • Google Drive Storage • GitHub Pages Hosted

---

## 🌟 Features Overview

- **📱 Supervisor Attendance Tablet App (`/supervisor/`)**:
  - Fast touch check-ins: **On Time**, **Arrived** (with arrival time picker), and **Absent**.
  - Vehicle passenger & driver allocation with real-time capacity validation (8-person limit).
  - Vehicle dispatch, site delivery, and return tracking.
  - On-demand contractor extra labour requests.
  - Instant PDF and Excel attendance report downloads.
  - Offline-first mutation queue with automatic sync when connectivity resumes.

- **🏢 Admin & Payroll Management Portal (`/admin/`)**:
  - Full employee and contractor directory with role-based access control.
  - Automated daily wage calculations (Base pay + 1.5x Overtime + Incentives = Grand Total).
  - Bulk wage rate and compensation editor with CSV template import/export.
  - Session lock/unlock controls and historical date filtering.
  - **Google Sheets Sync Center**: Live two-way sync, connection health check, and direct sheet links.
  - Modular single-responsibility component architecture (<150 lines per component).

- **🔐 100% Serverless Google Authentication**:
  - Direct integration with **Google Identity Services (GIS)** using OAuth 2.0 / OpenID Connect JWT tokens.
  - Zero passwords stored: login verified via user's secure Gmail account or biometric prompt.
  - Access control and permissions managed via the `Users_Roles` table in Google Sheets.

- **📊 Google Sheets Sole Database Engine**:
  - 10 structured master, transaction, and audit worksheets (`Employees`, `Vehicles`, `Contractors`, `Rates_Config`, `Users_Roles`, `Attendance_Sessions`, `Attendance_Records`, `Vehicle_Assignments`, `Vehicle_Trips`, `Daily_Payroll`, `Audit_Logs`).
  - Google Apps Script Web App JSON REST API ([`google-sheets/Code.gs`](./google-sheets/Code.gs)) with Formula Injection defense (CWE-1236) and concurrency locking (`LockService`).
  - Automated Google Drive folder management (`01_Live_Database`, `02_Daily_Attendance_Backups`, `03_Monthly_Payroll_Reports`, `04_Supervisor_PDF_Exports`, `05_Contractor_Settlements`).

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Clone the repository
git clone https://github.com/visionloop-org/LaxmiEnterprise.git
cd LaxmiEnterprise

# 2. Install dependencies
npm install

# 3. Run Supervisor App (Port 5173)
npm run dev:supervisor

# 4. Run Admin Portal (Port 5174)
npm run dev:admin

# 5. Run Shared Test Suite
npm run test:shared

# 6. Build for GitHub Pages
npm run build:pages
```

---

## 📋 Google Sheets Setup Guide

1. Open [sheets.new](https://sheets.new) and create a new spreadsheet.
2. Go to **Extensions** > **Apps Script**.
3. Copy & paste the contents of [`google-sheets/Code.gs`](./google-sheets/Code.gs).
4. Run the function **`setupLaxmiEnterpriseSystem`** once to create all sheets, format headers, and generate Google Drive folders.
5. Click **Deploy** > **New deployment** > **Web app** > Access: **Anyone** > Copy the **Web App URL**.
6. Open the Admin portal at [https://visionloop-org.github.io/LaxmiEnterprise/admin/](https://visionloop-org.github.io/LaxmiEnterprise/admin/) -> Click **📊 Google Sheets Sync** -> Paste URL & Save!
   *(Alternatively, onboard field supervisors by opening `https://visionloop-org.github.io/LaxmiEnterprise/supervisor/?scriptUrl=<YOUR_WEB_APP_URL>`)*

Detailed sheet documentation: [SHEET_STRUCTURE.md](./google-sheets/SHEET_STRUCTURE.md)  
Best practices guide: [BEST_PRACTICES.md](./google-sheets/BEST_PRACTICES.md)

---

## 🛡️ Pre-Push Quality & Compilation Gate

To ensure broken code is never pushed to the remote repository, [`.husky/pre-push`](./.husky/pre-push) automatically executes before every `git push`:
1. Compiles `apps/supervisor` via Vite
2. Compiles `apps/admin` via Vite
3. Assembles the unified GitHub Pages static distribution
4. Executes the full Mocha test suite (`84 / 84` passing)

If any compilation step or test fails, the push is immediately aborted.

---

## 🚢 Continuous Deployment to GitHub Pages

Every commit pushed to `master` automatically triggers the GitHub Actions workflow [`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml), building the unified static bundle and publishing it live to **`https://visionloop-org.github.io/LaxmiEnterprise/`**.

---

## 👤 Developer & Access Permissions

| User | Gmail / GitHub ID | Role | Access Level |
|---|---|---|---|
| **Vision Loop** | `visionloop.in@gmail.com` • [visionloop-org](https://github.com/visionloop-org) | **Developer** | **Admin (Full Unrestricted Access)** |
| **System Admin** | `admin@gmail.com` | **Admin** | **Admin (Payroll, Rates, Master Data)** |
| **Shift Supervisors** | Registered in `Users_Roles` | **Supervisor** | **Supervisor (Attendance, Fleet, Trips)** |
