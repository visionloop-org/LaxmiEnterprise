# Laxmi Enterprise — Multi-Spreadsheet & Google Drive Architecture

This document defines the complete data schemas, sheet structures, and Google Drive folder hierarchy for the **Laxmi Enterprise** workforce, fleet, and payroll management system.

---

## 1. Google Drive Folder Hierarchy

When you run `setupMultiSpreadsheetArchitecture()` in Google Apps Script, the following structure is automatically provisioned in your Google Drive:

```
📁 Vision Loop - Laxmi Enterprise/
│
├── 📂 01_Live_Database/
│   ├── 📊 01_Laxmi_HR_Master          (Domain 1: HR, Workforce & RBAC)
│   ├── 📊 02_Laxmi_Attendance_Fleet   (Domain 2: Daily Operations, Shifts & Trips)
│   └── 📊 03_Laxmi_Payroll_Accounting (Domain 3: Financials, Settlements & Audit)
│
├── 📂 02_Daily_Attendance_Backups/     (Automated daily snapshots)
│   ├── 📊 01_Laxmi_HR_Master_Backup_2026-09-06_1800
│   ├── 📊 02_Laxmi_Attendance_Fleet_Backup_2026-09-06_1800
│   └── 📊 03_Laxmi_Payroll_Accounting_Backup_2026-09-06_1800
│
├── 📂 03_Monthly_Payroll_Reports/     (Generated wage registers & summaries)
│   ├── 📑 Monthly_Payroll_Summary_September_2026.xlsx
│   └── 📑 Wage_Register_September_2026.pdf
│
├── 📂 04_Supervisor_PDF_Exports/       (Field supervisor shift exports)
│   ├── 📄 Attendance_Sheet_2026-09-06_Morning.pdf
│   └── 📄 Vehicle_Utilization_RunSheet_2026-09-06.pdf
│
└── 📂 05_Contractor_Settlements/       (Agency billing statements)
    ├── 📑 Contractor_Billing_ShreeRam_Sept2026.xlsx
    └── 📑 Extra_Labour_Disbursements.xlsx
```

---

## 2. Multi-Spreadsheet Data Schemas

The 15 system tables are distributed across **3 domain spreadsheets**:

---

### Domain 1: `01_Laxmi_HR_Master`
*Owner: HR / Management · Access: Restricted*

#### 1. `Employees` (Tab Color: Blue `#3b82f6`)
Authoritative employee roster and master profile directory.

| Column | Header | Type | Description |
|---|---|---|---|
| A | `id` | String | Unique identifier (e.g. `EMP001`) |
| B | `employeeId` | String | Employee Badge / ID Number |
| C | `name` | String | Full name |
| D | `category` | Enum | `Drivers`, `Workers`, `Chalan Men`, `Office`, `Extra Labour` |
| E | `status` | Enum | `active`, `pending`, `rejected` |
| F | `phone` | String | 10-digit mobile number |
| G | `contractor` | String | Contractor agency name (if contract labour) |
| H | `baseRate` | Number | Daily wage base rate in ₹ (e.g. `800`, `500`) |
| I | `extraHours` | Number | Overtime hours worked (1.5x hourly calculation) |
| J | `incentive` | Number | Performance bonus in ₹ |
| K | `remarks` | String | Notes / designation info |
| L | `displayOrder`| Number | Order sequence in table |
| M | `attendance` | Enum | Current day status (`on_time`, `arrived`, `absent`) |
| N | `arrivalTime`| String | Timestamp of late arrival (e.g. `08:45 AM`) |
| O | `assignedVehicle` | String | Currently allocated vehicle number |
| P | `updatedAt` | ISO Date | Last update timestamp |

#### 2. `Contractors` (Tab Color: Purple `#8b5cf6`)
Third-party labour supplier registry and commission tracking.

| Column | Header | Type | Description |
|---|---|---|---|
| A | `id` | String | Contractor ID (`CONT-01`) |
| B | `contractorName` | String | Agency Name (e.g. `Shree Ram Labours`) |
| C | `contactPerson` | String | Representative name |
| D | `phone` | String | Contact phone |
| E | `workerCount` | Number | Total workers supplied |
| F | `commissionRate`| String | Agency commission percentage (`10%`) |
| G | `notes` | String | Agreement notes |
| H | `updatedAt` | ISO Date | Timestamp |

#### 3. `Rates_Config` (Tab Color: Amber `#f59e0b`)
Wage rules, overtime multipliers, and category base rates.

| Column | Header | Type | Example Values |
|---|---|---|---|
| A | `category` | String | `Drivers`, `Workers`, `Chalan Men`, `Office`, `Extra Labour` |
| B | `defaultBaseRate` | Number | `800`, `500`, `650`, `750`, `450` |
| C | `overtimeMultiplier` | Number | `1.5` (Overtime rate = `(Base / 8) * 1.5 * ExtraHours`) |
| D | `standardHours` | Number | `8` |
| E | `currency` | String | `INR (₹)` |
| F | `notes` | String | Policy description |
| G | `updatedAt` | ISO Date | Timestamp |

#### 4. `Users_Roles` (Tab Color: Indigo `#6366f1`)
Gmail account access control and permission mapping.

| Column | Header | Type | Description |
|---|---|---|---|
| A | `email` | String | Gmail ID (e.g. `owner@gmail.com`, `supervisor1@gmail.com`) |
| B | `name` | String | User's full name |
| C | `role` | Enum | `Admin` (Full access), `Supervisor` (Attendance/Trips), `Viewer` |
| D | `status` | Enum | `Active`, `Suspended` |
| E | `assignedShift` | String | `All`, `Morning Shift`, `Evening Shift` |
| F | `notes` | String | User notes or department |
| G | `updatedAt` | ISO Date | Last update timestamp |

---

### Domain 2: `02_Laxmi_Attendance_Fleet`
*Owner: Field Supervisors / Fleet Managers · Access: Operational*

#### 5. `Vehicles` (Tab Color: Green `#10b981`)
Fleet capacity limits and vehicle dispatch status.

| Column | Header | Type | Description |
|---|---|---|---|
| A | `id` | String | Vehicle identifier (`VEH-101`) |
| B | `number` | String | Vehicle registration number |
| C | `type` | String | Vehicle category (`Truck`, `Van`, `Tipper`, `Dumper`) |
| D | `name` | String | Friendly display name |
| E | `capacity` | Number | Maximum worker passenger capacity (e.g. `8`) |
| F | `status` | Enum | `available`, `dispatched`, `maintenance` |
| G | `active` | Boolean | `TRUE` / `FALSE` |
| H | `assignedDriver` | String | Assigned driver Employee ID |
| I | `updatedAt` | ISO Date | Last update timestamp |

#### 6. `Attendance_Sessions` (Tab Color: Cyan `#06b6d4`)
Daily shift sessions and lock status.

| Column | Header | Type | Description |
|---|---|---|---|
| A | `id` | String | Session ID (`SES-2026-09-06-Morning`) |
| B | `sessionId` | String | Session Identifier |
| C | `sessionDate` | Date | `YYYY-MM-DD` |
| D | `shift` | String | `Morning`, `Evening`, `Night` |
| E | `supervisorId` | String | Supervisor username |
| F | `status` | Enum | `in_progress`, `finalized` |
| G | `totalWorkers` | Number | Total headcount on roster |
| H | `presentCount` | Number | Total present headcount |
| I | `version` | Number | Concurrency version |
| J | `finalizedAt` | ISO Date | Finalization timestamp |
| K | `unlockedAt` | ISO Date | Unlock timestamp (if unlocked by Admin) |
| L | `createdAt` | ISO Date | Creation timestamp |

#### 7. `Attendance_Records` (Tab Color: Pink `#ec4899`)
Individual worker daily check-ins.

| Column | Header | Type | Description |
|---|---|---|---|
| A | `id` | String | Composite key (`SES-2026-09-06-Morning_EMP001`) |
| B | `sessionId` | String | Foreign key to `Attendance_Sessions` |
| C | `employeeId` | String | Foreign key to `Employees` |
| D | `employeeName`| String | Employee name |
| E | `category` | String | Category |
| F | `status` | Enum | `on_time`, `arrived`, `absent` |
| G | `arrivalTime` | String | Late arrival time (e.g. `08:35 AM`) |
| H | `basePay` | Number | Daily base wage |
| I | `extraPay` | Number | Overtime wage |
| J | `totalPay` | Number | Total wage (`basePay + extraPay`) |
| K | `remarks` | String | Supervisor / worker remarks |
| L | `updatedAt` | ISO Date | Timestamp |

#### 8. `Vehicle_Assignments` (Tab Color: Teal `#14b8a6`)
Personnel assigned to vehicles for transportation and site work.

| Column | Header | Type | Description |
|---|---|---|---|
| A | `id` | String | Composite key (`SES_VEH_EMP`) |
| B | `sessionId` | String | Foreign key to `Attendance_Sessions` |
| C | `vehicleId` | String | Foreign key to `Vehicles` |
| D | `employeeId` | String | Foreign key to `Employees` |
| E | `employeeName`| String | Employee name |
| F | `role` | Enum | `Driver`, `Chalan Man`, `Worker`, `Passenger` |
| G | `assignedAt` | ISO Date | Timestamp |

#### 9. `Vehicle_Trips` (Tab Color: Orange `#f97316`)
Trip dispatch, customer delivery, site arrival, and return tracking.

| Column | Header | Type | Description |
|---|---|---|---|
| A | `id` | String | Unique Trip ID (`TRIP-1788211000`) |
| B | `tripId` | String | Trip Identifier |
| C | `sessionId` | String | Session ID |
| D | `vehicleId` | String | Vehicle Number |
| E | `destination` | String | Site / Customer destination |
| F | `status` | Enum | `Dispatched`, `Arrived At Site`, `Delivered`, `Returned` |
| G | `departureTime`| String | Time departed |
| H | `arrivalTime` | String | Time arrived |
| I | `driverName` | String | Designated Driver |
| J | `notes` | String | Delivery / cargo notes |
| K | `createdAt` | ISO Date | Creation timestamp |

#### 10. `Extra_Labour_Requests` (Tab Color: Red `#ef4444`)
Supervisor emergency labour requests submitted for admin approval.

| Column | Header | Type | Description |
|---|---|---|---|
| A | `id` | String | Request ID (`REQ-001`) |
| B | `requestId` | String | Requisition Identifier |
| C | `requestDate` | Date | Request date |
| D | `shift` | String | `Morning Shift`, `Evening Shift` |
| E | `supervisorId` | String | Requester email |
| F | `contractorName`| String | Proposed contractor |
| G | `workersRequested`| Number | Number of workers |
| H | `purpose` | String | Justification |
| I | `status` | Enum | `Pending`, `Approved`, `Rejected` |
| J | `approvedCount` | Number | Quantity authorized |
| K | `approvedBy` | String | Admin who approved |
| L | `approvedAt` | ISO Date | Approval timestamp |
| M | `notes` | String | Review comments |

#### 11. `Vehicle_Maintenance` (Tab Color: Yellow `#eab308`)
Fleet maintenance, service intervals, and fuel tracking.

| Column | Header | Type | Description |
|---|---|---|---|
| A | `id` | String | Service record ID (`MNT-101`) |
| B | `vehicleId` | String | Vehicle ID |
| C | `vehicleNumber`| String | Registration number |
| D | `entryDate` | Date | Date of service |
| E | `serviceType` | String | Routine / Repair / Inspection |
| F | `odometerKm` | Number | Current odometer |
| G | `fuelLiters` | Number | Fuel added |
| H | `costInr` | Number | Total cost in ₹ |
| I | `vendorName` | String | Service center / workshop |
| J | `nextServiceDueKm` | Number | Next service odometer |
| K | `nextServiceDueDate`| Date | Next service calendar due date |
| L | `remarks` | String | Service notes |
| M | `createdAt` | ISO Date | Timestamp |

---

### Domain 3: `03_Laxmi_Payroll_Accounting`
*Owner: Finance / Accounting · Access: Confidential*

#### 12. `Daily_Payroll` (Tab Color: Lime `#84cc16`)
Daily finalized wage disbursements and totals.

| Column | Header | Type | Description |
|---|---|---|---|
| A | `date` | Date | Session date (`YYYY-MM-DD`) |
| B | `sessionId` | String | Session ID |
| C | `totalEmployees` | Number | Headcount |
| D | `totalBasePay` | Number | Total base wages in ₹ |
| E | `totalExtraPay`| Number | Total overtime wages in ₹ |
| F | `totalIncentives`| Number | Total bonus incentives in ₹ |
| G | `grandTotal` | Number | Final daily payroll disbursement in ₹ |
| H | `status` | Enum | `Finalized`, `Disbursed` |
| I | `approvedBy` | String | Admin user who authorized |
| J | `notes` | String | Remarks |
| K | `generatedAt` | ISO Date | Timestamp |

#### 13. `Contractor_Settlements` (Tab Color: Violet `#a855f7`)
Agency settlement calculations, commissions, and bank disbursement tracking.

| Column | Header | Type | Description |
|---|---|---|---|
| A | `id` | String | Settlement ID (`SET-2026-001`) |
| B | `settlementDate`| Date | Settlement date |
| C | `contractorId` | String | Foreign key to `Contractors` |
| D | `contractorName`| String | Agency Name |
| E | `workersCount` | Number | Deployed headcount |
| F | `totalDays` | Number | Working days billed |
| G | `dailyRate` | Number | Base daily rate in ₹ |
| H | `grossAmount` | Number | Gross labour cost |
| I | `commissionPercent`| String | Agreed commission (`10%`) |
| J | `commissionAmount` | Number | Agency commission in ₹ |
| K | `netPayable` | Number | Total disbursement (`gross + commission`) |
| L | `paymentStatus` | Enum | `Pending`, `Processed`, `Paid` |
| M | `transactionRef`| String | Bank UTR / Cheque Ref |
| N | `approvedBy` | String | Admin authorizer |
| O | `notes` | String | Billing notes |
| P | `createdAt` | ISO Date | Timestamp |

#### 14. `Monthly_Summary` (Tab Color: Dark Emerald `#059669`)
Aggregated monthly operational and financial performance summary.

| Column | Header | Type | Description |
|---|---|---|---|
| A | `monthYear` | String | `2026-09` |
| B | `totalOperatingDays` | Number | Working days in month |
| C | `totalActiveEmployees`| Number | Total workforce size |
| D | `totalManDays` | Number | Sum of daily present workers |
| E | `totalBasePayroll` | Number | Base wage sum in ₹ |
| F | `totalOvertimePayroll`| Number | Overtime compensation in ₹ |
| G | `totalIncentives` | Number | Bonuses in ₹ |
| H | `totalContractorPayout`| Number | Agency payouts in ₹ |
| I | `grandTotalExpense` | Number | Total workforce expenditure in ₹ |
| J | `finalizedBy` | String | Executive authorizer |
| K | `finalizedAt` | ISO Date | Finalization timestamp |
| L | `notes` | String | Monthly observations |

#### 15. `Audit_Logs` (Tab Color: Slate `#64748b`)
Immutable log of mutations, attendance locks, rate updates, and sync actions.

| Column | Header | Description |
|---|---|---|
| A | `timestamp` | UTC Timestamp |
| B | `action` | `SAVE_EMPLOYEE`, `BULK_SAVE_EMPLOYEES`, `DELETE_EMPLOYEE`, `FINALIZE_PAYROLL`, `DAILY_BACKUP`, etc. |
| C | `user` | User / role who performed action |
| D | `entity` | Target entity (`Employee`, `Vehicle`, `Session`, `Payroll`) |
| E | `entityId` | Affected record ID |
| F | `details` | Details / summary |
| G | `ip` | Client origin (`WebClient`) |

---

## 3. Automated Backup & Export Functions

In Google Apps Script (`Code.gs`), automated multi-spreadsheet routines are available:

1. **`setupMultiSpreadsheetArchitecture()`**: Provisions all 3 spreadsheets, links them to `Vision Loop - Laxmi Enterprise / 01_Live_Database /`, and populates default master data.
2. **`backupSpreadsheetToDrive()`**: Automatically clones all 3 live spreadsheets into `02_Daily_Attendance_Backups/` with date-time stamps.
3. **`saveExportToDrive(folderType, fileName, base64Data, mimeType)`**: Accepts base64 PDF exports from the web app and stores them in `04_Supervisor_PDF_Exports/`.
4. **`sendDailyAttendanceEmailReport(recipientEmail)`**: Compiles a rich HTML digest summarizing workforce, fleet, and attendance with direct links to all 3 Google Sheets and sends it via GmailApp.
