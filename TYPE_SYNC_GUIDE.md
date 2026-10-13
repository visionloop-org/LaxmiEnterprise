# Data Schema & Type Synchronization Guide

**Version:** 5.0  
**Architecture:** Serverless Google Sheets & TypeScript Contracts

---

## 1. Overview

In Laxmi Enterprise v5.0, the backend operates as a **100% serverless multi-spreadsheet database** in Google Sheets & Google Drive. TypeScript definitions and JSDoc annotations in `packages/shared/` provide compile-time safety and runtime contracts across the Admin and Supervisor applications.

---

## 2. Schema Source of Truth

The canonical database definitions are documented in:
- **Specification**: [`google-sheets/SHEET_STRUCTURE.md`](./google-sheets/SHEET_STRUCTURE.md) (Column definitions, types, and constraints across 15 worksheets)
- **Apps Script Implementation**: [`google-sheets/Code.gs`](./google-sheets/Code.gs) (`setupMultiSpreadsheetArchitecture()` and `getTableSpreadsheet()`)

The schemas partition across 3 Google Spreadsheets:
1. **`01_Laxmi_HR_Master`**: `Employees`, `Contractors`, `Rates_Config`, `Users_Roles`
2. **`02_Laxmi_Attendance_Fleet`**: `Vehicles`, `Attendance_Sessions`, `Attendance_Records`, `Vehicle_Assignments`, `Vehicle_Trips`, `Extra_Labour_Requests`, `Vehicle_Maintenance`
3. **`03_Laxmi_Payroll_Accounting`**: `Daily_Payroll`, `Contractor_Settlements`, `Monthly_Summary`, `Audit_Logs`

---

## 3. TypeScript Contracts & Type Safety

Frontend applications (`apps/admin`, `apps/supervisor`) consume type contracts defined in `@laxmi/shared`:

```
packages/shared/
├── types/
│   └── api.ts          # Core entity interfaces (Employee, Vehicle, Session, Trip, Payroll)
├── services/
│   ├── googleSheetsService.js      # JSDoc annotated API client & offline storage
│   └── clientComputationService.js # High-speed client mathematical models & conflict assertions
└── tsconfig.json       # TypeScript configuration with allowJs & checkJs
```

### Type Checking
To run type validation across `@laxmi/shared`:

```bash
# From workspace root or packages/shared
cd packages/shared
npx tsc --noEmit
```

---

## 4. Updating a Schema

When adding or modifying fields:

1. **Update Sheet Structure**: Document the new column in [`google-sheets/SHEET_STRUCTURE.md`](./google-sheets/SHEET_STRUCTURE.md).
2. **Update Apps Script**:
   - Add the column header to the appropriate sheet array in `google-sheets/Code.gs`.
   - Update object mapping functions in `Code.gs` (`mapRowToEmployee`, `mapRowToRecord`, etc.).
3. **Update Client Types & Services**:
   - Update interfaces in `packages/shared/types/api.ts`.
   - Update serialization in `packages/shared/services/googleSheetsService.js`.
   - If calculations or constraints are affected, update `packages/shared/services/clientComputationService.js`.
4. **Run Validation Gates**:
   ```bash
   npm run test:computation
   npm run test:gsheets
   npm run test:utils
   npm run build:pages
   ```

---

## 5. Historical Reference (v1.0 FastAPI Backend)

> [!NOTE]
> Early v1.0 prototypes of Laxmi Enterprise utilized a local FastAPI + MongoDB container backend (`ServerSide/`). In v5.0, all infrastructure was eliminated in favor of a 100% serverless, zero-maintenance architecture on Google Sheets, Google Drive, and GitHub Pages.

