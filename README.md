# 🏢 Laxmi Enterprise — Workforce Attendance, Fleet & Payroll System

> **Live Production URL:** [https://visionloop-org.github.io/LaxmiEnterprise/](https://visionloop-org.github.io/LaxmiEnterprise/)  
> **Author & Developer:** [Vision Loop](https://github.com/visionloop-org) (`visionloop.in@gmail.com`)  
> **Architecture:** 100% Free Forever Serverless • Multi-User Edge/Client Computation • 5-Year Rolling Lifecycle • <2GB Permanent Footprint

---

## 🌟 Architecture & Free-Forever Guarantee

Laxmi Enterprise is engineered to run **completely free forever** across multiple concurrent users (supervisors, managers, accountants, and workers) while maintaining sub-100ms response times.

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT PWA DEVICES                                 |
|  [Supervisor Mobile/Tablet]       [Admin & HR Dashboard]       [Worker Self-Service]  |
|   - 0ms Local IndexedDB            - Real-time Analytics        - Digital Pay Slips   |
|   - Offline Shift Check-ins        - Payroll Final Approval     - Attendance History  |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|                    100% FREE CLOUD & EDGE INFRASTRUCTURE (<2GB TOTAL)                 |
|                                                                                       |
|  1. Static Hosting (GitHub Pages / Cloudflare Pages) -> Unlimited Bandwidth, ₹0/mo   |
|  2. Client Computation Engine (`ClientComputationService`) -> 100% on Device CPU     |
|  3. Micro-Batch Sync Layer -> Atomic commits, Zero lock contention                   |
|  4. 5-Year Rolling Data Retention Engine -> Auto-prunes records >5 years (<50MB active)|
|  5. Multi-Domain Partitioned Storage -> Google Drive (15 GB Free) / Cloudflare D1     |
+---------------------------------------------------------------------------------------+
```

### Key Guarantees:
- **100% Free Forever:** Designed to operate well within permanent free allowances (Google Drive 15 GB / Cloudflare 5 GB D1), requiring under 2 GB total lifetime storage.
- **5-Year Data Lifecycle:** Automated scheduled pruning deletes attendance and audit records older than 5 years, keeping active operational data under **50 MB** (<1% of storage quota).
- **Zero Server Maintenance:** Fully serverless architecture with no cloud virtual machines, database hosting fees, or backend maintenance costs.
- **Multi-User Concurrency:** Micro-batched writes and client-side queuing eliminate database lock collisions when multiple supervisors submit shifts simultaneously.
- **Offline-First Resilience:** Floor supervisors mark attendance offline without spinners; changes buffer locally and auto-sync on reconnect.

---

## 👥 Role-Based Access Control (RBAC)

The application supports strict role-based authorization across all operational touchpoints:

| Role | Typical User / Account | Core Permissions & Scope |
| :--- | :--- | :--- |
| **`Admin` / `Owner`** | `Gauravjaiswal0304@gmail.com`<br>`admin@gmail.com` | Full governance: Employee rates, wage editing, 1.5x overtime approval, contractor agency settlements, emergency session unlocks, audit log access. |
| **`Accountant` / `HR`** | Finance Desk | Attendance reconciliation, monthly payroll calculation, salary slip generation, bank NEFT/RTGS transfer CSV exports. |
| **`Supervisor`** | `Maalaxmi.godown@gmail.com` | Field & yard operations: Touch attendance marking, vehicle fleet allocation, trip dispatch & delivery tracking, offline sync queue. |
| **`Worker`** | Field Employees | Read-only personal self-service: View monthly punches, overtime hours, and digital salary slips. |
| **`Developer`** | `visionloop.in@gmail.com` | System maintenance, CI/CD pipelines, schema updates, and pre-push quality gates. |

---

## 🔄 5-Year Rolling Data Lifecycle & Sizing Math

Because records older than 5 years are automatically purged, the application's active working dataset remains compact, fast, and light forever:

$$\text{150 workers} \times 365\text{ days} = 54,750\text{ attendance rows/year}$$
$$54,750\text{ rows/year} \times 5\text{ years} = 273,750\text{ maximum active rows}$$
$$273,750\text{ rows} \times 180\text{ bytes/row} \approx \mathbf{49.2\text{ MB}}$$

- **Active Database Size:** Never exceeds **50 MB**, which is a fraction of the 2 GB allowance.
- **Annual Tax/Compliance Summaries:** Before raw daily punches are pruned, monthly and annual aggregate summaries are compiled and preserved in `03_Monthly_Payroll_Reports`.
- **Scheduled Cleanup Trigger:** Executes monthly to purge records where `shift_date < NOW() - 5 YEARS`.

---

## 🌟 Core Feature Modules

- **📲 Installable Progressive Web App (PWA)**:
  - 1-tap install on Android tablets, smartphones, and desktop computers.
  - Complete offline shell caching via Service Workers (`sw.js`).
  - High-resolution vector and maskable icons (192×192, 512×512, Apple touch).

- **⚡ Client-Centric Heavy Computation Architecture**:
  - Computational engine (`ClientComputationService`) executes 100% on the device CPU.
  - Instant client-side payroll calculations, 1.5× overtime formulas, and category wage totals.
  - Automated contractor agency commission settlement engine.
  - Real-time knapsack vehicle allocation and 8-passenger capacity conflict detector.
  - Zero cloud computation costs and zero API lag.

- **📱 Supervisor Attendance Tablet & Mobile App (`/supervisor/`)**:
  - Fast touch check-ins: **On Time**, **Arrived** (with arrival time picker), and **Absent**.
  - Adaptive Android mobile UI with collapsible navigation drawer for small phone screens.
  - Vehicle passenger & driver allocation with real-time capacity validation (8-person limit).
  - Vehicle dispatch, site delivery, and return tracking via `TripTrackerModal`.
  - On-demand contractor extra labour requests (Min / Max crew demand).
  - Instant PDF and Excel attendance report downloads directly on device.
  - Offline-first mutation queue with automatic background sync when connectivity resumes.

- **🏢 Admin & Payroll Management Portal (`/admin/`)**:
  - Full employee and contractor directory with role-based access control.
  - Automated daily wage calculations (Base pay + 1.5x Overtime + Incentives = Grand Total).
  - Contractor payroll and agency commission reconciliation with CSV exports.
  - Bulk wage rate and compensation editor with CSV template import/export.
  - Session lock/unlock controls and historical date filtering.
  - **Drive CSV & Multi-Sheet Sync Center**: 1-click OAuth setup and partitioned sync operations.

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
npm run test:utils --workspace=packages/shared
npm run test:gsheets --workspace=packages/shared
npm run test:computation --workspace=packages/shared

# 6. Build for GitHub Pages & PWA
npm run build:pages
```

---

## 🛡️ Pre-Push Quality & Compilation Gate

To ensure broken code is never pushed to the remote repository, [`.husky/pre-push`](./.husky/pre-push) automatically executes before every `git push`:
1. Compiles `apps/supervisor` via Vite
2. Compiles `apps/admin` via Vite
3. Assembles the unified GitHub Pages static distribution
4. Executes utility test suite (`8/8` passing)
5. Executes Google Sheets service test suite (`11/11` passing)
6. Executes Client Computation Engine test suite (`9/9` passing)

---

## 📚 Documentation Links
- **Goals & Roadmap:** [GOALS.md](./GOALS.md)
- **Workflows & Operations:** [WORKFLOWS.md](./WORKFLOWS.md)
- **Workflow Plan & Milestones:** [WORKFLOW_PLAN.md](./WORKFLOW_PLAN.md)
- **Master Instructions:** [MASTER INSTRUCTIONS.md](./MASTER%20INSTRUCTIONS.md)
- **Architecture Guide:** [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Sheet Structure:** [SHEET_STRUCTURE.md](./google-sheets/SHEET_STRUCTURE.md)
