# Laxmi Enterprise — Complete Operational & Technical Workflows

**Version:** 5.0 (Modular Multi-Spreadsheet & Client-Side PWA Architecture)  
**Last Updated:** September 6, 2026  
**Target Environments:** Android Tablet/Smartphone (PWA) & Office Desktop Workstations  
**Cloud Database:** Google Sheets (3 Partitioned Domain Spreadsheets in Google Drive)

---

## System Workflow Map Overview

```mermaid
flowchart TD
    subgraph Phase1["1. Morning Roster & Check-In"]
        A[Supervisor opens Tablet/Phone PWA] --> B[Mark Attendance: On Time / Arrived / Absent]
        B --> C[Record Min/Max Labour Demands]
        C --> D[Submit Ad-Hoc Worker Requests]
        D --> E[Finalize Attendance - Step 1 Lock]
    end

    subgraph Phase2["2. Fleet Capacity & Vehicle Dispatch"]
        E --> F[Allocate Workers to Vehicles]
        F --> G{Capacity Check: Max 8?}
        G -- Violations --> H[Real-Time Client Conflict Warning]
        H --> F
        G -- Valid --> I[Finalize Daily Sheet - Step 2 Lock]
    end

    subgraph Phase3["3. Trip Lifecycle Tracking"]
        I --> J[Dispatch Vehicle]
        J --> K[Reached Destination / Quarry]
        K --> L[Delivered Materials]
        L --> M[Returned & Completed]
    end

    subgraph Phase4["4. Payroll & Contractor Settlements"]
        M --> N[Admin Portal: Load Shift Data]
        N --> O[Client-Side Engine Calculates 1.5x Overtime & Base]
        O --> P[Contractor Agency Commission Settlements]
        P --> Q[Export CSV / Direct Google Sheets Push]
    end

    subgraph Phase5["5. Cloud Persistence & Backups"]
        Q --> R[(01_Laxmi_HR_Master)]
        Q --> S[(02_Laxmi_Attendance_Fleet)]
        Q --> T[(03_Laxmi_Payroll_Accounting)]
        R & S & T --> U[Automated Daily Drive Backups]
    end
```

---

## Workflow 1: Daily Shift Attendance & Check-In Lifecycle

**Actor:** Field/Godown Supervisor (`Maalaxmi.godown@gmail.com`)  
**Device:** Android Tablet (dallied or landscape) or Android Smartphone (PWA)  
**Location:** Field Godown Yard / Quarry Muster Point  

```mermaid
sequenceDiagram
    autonumber
    actor Sup as Yard Supervisor
    participant App as Supervisor Tablet PWA (Client)
    participant Local as LocalStorage / Cache
    participant GAS as Google Apps Script API
    participant Sheet as 02_Laxmi_Attendance_Fleet

    Sup->>App: Opens PWA (Online or Offline)
    App->>Local: Load today's active workforce roster
    Local-->>App: Display roster with Category Tabs
    
    loop Worker Muster Call
        alt Worker arrives on schedule
            Sup->>App: Taps "On Time" (1-tap instant)
        else Worker arrives late
            Sup->>App: Taps "Arrived" -> Selects Time (e.g. 08:35) -> Confirms
        else Worker absent
            Sup->>App: Taps "Absent"
        end
        App->>Local: Update local record with timestamp
    end

    opt Extra Labour Demand
        Sup->>App: Selects Chalan Man -> Taps "Min" (Standard) or "More" (Extra crew requested)
        App->>Local: Save labour demand state
    end

    Sup->>App: Taps "Finalize Attendance"
    App->>App: Validate: Are all workers marked?
    App->>Local: Set isAttendanceFinalized = true (Step 1 Lock)
    App-->>GAS: Async sync attendance records & session
    GAS-->>Sheet: Append/Update Attendance_Records
```

### Steps & Business Rules:
1. **Instant Offline Attendance**: Supervisor records worker presence with 0ms latency.
   - **`On Time`**: Full shift credit.
   - **`Arrived`**: Opens [`ArrivedTimeModal`](file:///D:/VisionLoop/Projects/LaxmiEnterprise/packages/shared/components/ArrivedTimeModal.jsx) to log actual arrival time and remarks.
   - **`Absent`**: Zero hours earned.
2. **Min/Max Labour Demand Verification**: Chalan Men require equipment transport and delivery support. Supervisors capture whether standard (*Minimum*) or surge (*More Labour*) crew is needed.
3. **Step 1 Lock**: Once finalized, attendance buttons are locked to prevent inadvertent field tampering.

---

## Workflow 2: Fleet Allocation & Vehicle Capacity Dispatch

**Actor:** Field/Godown Supervisor (`Maalaxmi.godown@gmail.com`)  
**Objective:** Assign present workers to vehicles while strictly enforcing vehicle safety rules and maximum passenger limits.

```mermaid
stateDiagram-v2
    [*] --> AvailableVehicles: Roster Present
    AvailableVehicles --> AssigningWorkers: Select Vehicle & Worker
    
    state AssigningWorkers {
        [*] --> CheckRoleRatio
        CheckRoleRatio --> DriverCheck: 1 Driver
        DriverCheck --> ChalanCheck: 1 Chalan Man
        ChalanCheck --> WorkerCheck: Up to 6 Workers
    }

    AssigningWorkers --> CapacityValidation: Client Computes Total
    
    state CapacityValidation {
        [*] --> EvaluateCount
        EvaluateCount --> OverCapacity: > 8 Passengers
        EvaluateCount --> SafeCapacity: <= 8 Passengers
    }

    OverCapacity --> ConflictWarning: Real-Time Error Alert
    ConflictWarning --> AssigningWorkers: Re-allocate / Remove excess
    
    SafeCapacity --> DailySheetFinalize: All Teams Dispatched
    DailySheetFinalize --> [*]: Step 2 Full Sheet Lock
```

### Constraints Enforced 100% on Client Device:
- **Maximum Capacity**: Exactly **8 passengers** per vehicle (hard physical limit for tippers/vans).
- **Role Ratio**: Optimal crew composition is **1 Driver**, **1 Chalan Man**, and **up to 6 General Workers**.
- **Instant Conflict Alerts**: If supervisor accidentally assigns 9 workers or 2 drivers to the same vehicle, the client immediately flashes an amber/red warning banner without contacting the server.
- **Step 2 Full Lock**: Supervisor taps **"Finalize Daily Sheet"**, locking all vehicle allocations and extra labour requests.

---

## Workflow 3: Vehicle Trip Lifecycle & Task Progression

**Actor:** Yard Supervisor / Dispatcher  
**Component:** [`TripTrackerModal.jsx`](file:///D:/VisionLoop/Projects/LaxmiEnterprise/apps/supervisor/src/components/TripTrackerModal.jsx)  

```mermaid
flowchart LR
    A([1. Dispatched]) -->|Departure Time Logged| B([2. Reached Location])
    B -->|Site Arrival Confirmed| C([3. Delivered Product])
    C -->|Delivery Slip & Remarks| D([4. Returned & Completed])
    D --> E[(02_Laxmi_Attendance_Fleet / Vehicle_Trips)]
```

### Trip State Machine:
1. **`Dispatched`**: Vehicle departs godown yard. Departure timestamp recorded automatically.
2. **`Reached Location`**: Vehicle reaches customer unloading site, stone crusher, or depot.
3. **`Delivered`**: Material unloaded and quantity verified against chalan.
4. **`Returned`**: Vehicle returns to godown, odometer noted, trip marked closed.

---

## Workflow 4: Daily Shift Payroll & Overtime Calculation

**Actor:** Administrator / Finance Officer (`Gauravjaiswal0304@gmail.com`)  
**Engine:** [`ClientComputationService.js`](file:///D:/VisionLoop/Projects/LaxmiEnterprise/packages/shared/services/clientComputationService.js)  
**Portal:** Admin Portal (`apps/admin`)  

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Finance Admin
    participant Portal as Admin Portal (Client UI)
    participant Calc as ClientComputationService (Device CPU)
    participant GAS as Apps Script API Gateway
    participant Sheets as 03_Laxmi_Payroll_Accounting

    Admin->>Portal: Opens Admin Dashboard
    Portal->>Sheets: Pulls verified shift attendance & hours
    Portal->>Calc: calculateDailyShiftPayroll(employees, { sessionDate })
    
    activate Calc
    Note over Calc: 100% on Client Device CPU<br/>• Base rates by category<br/>• 1.5x Overtime: extraHours * (baseRate / 8) * 1.5<br/>• Late arrival prorations<br/>• Incentives & Deductions
    Calc-->>Portal: Returns finalized summary & category breakdowns
    deactivate Calc

    Portal-->>Admin: Displays Payroll KPIs & Net Payable
    Admin->>Portal: Taps "Push Finalized Payroll to Cloud"
    Portal->>GAS: Sends pre-computed row (Zero formula overhead)
    GAS->>Sheets: Appends directly to Daily_Payroll
    Sheets-->>Portal: 200 OK Confirmed
```

### Standard Compensation Matrix:
| Category | Base Daily Wage (8 Hours) | Overtime Rate (1.5×) | Role Responsibility |
| :--- | :--- | :--- | :--- |
| **Drivers** | **₹800 / day** | ₹150 / hour | Vehicle navigation, fuel oversight, transport safety |
| **Chalan Men** | **₹650 / day** | ₹121.88 / hour | Delivery verification, billing slips, customer sign-off |
| **Workers** | **₹500 / day** | ₹93.75 / hour | Loading, unloading, physical material handling |
| **Office Staff** | **₹750 / day** | ₹140.63 / hour | Weighbridge entry, documentation, admin tracking |
| **Extra Labour** | **₹450 / day** | ₹84.38 / hour | Ad-hoc contractor support during high-volume shifts |

---

## Workflow 5: Contractor Settlements & Agency Reconciliation

**Actor:** Administrator / Auditor  
**Sheets Target:** `03_Laxmi_Payroll_Accounting / Contractor_Settlements`  

```mermaid
flowchart TD
    A[Contractor Workers on Shift Roster] --> B[Filter Active Present Workers]
    B --> C[Compute Gross Wages for Agency Crew]
    C --> D[Fetch Agency Commission Rate e.g. 5%]
    D --> E[Calculate Commission: Wages * Rate / 100]
    E --> F[Generate Settlement Statement]
    F --> G{Admin Action}
    G -->|Export| H[Download CSV Settlement Slip]
    G -->|Commit| I[Save to Google Sheets Contractor_Settlements]
```

---

## Workflow 6: Emergency Administrative Override & Session Unlock

**Actor:** Authorized Admin (`Gauravjaiswal0304@gmail.com`)  
**Component:** [`SessionUnlockPanel.jsx`](file:///D:/VisionLoop/Projects/LaxmiEnterprise/apps/admin/src/components/SessionUnlockPanel.jsx)  

> [!IMPORTANT]
> When a supervisor finalizes a shift attendance or daily sheet, records are locked on tablet devices to maintain field integrity. If late check-ins, vehicle breakdowns, or emergency adjustments occur, an Admin must execute the **Session Unlock Workflow**:

```mermaid
sequenceDiagram
    actor Sup as Yard Supervisor
    actor Admin as System Admin
    participant Panel as Admin SessionUnlockPanel
    participant GAS as Apps Script Web App
    participant Audit as 03_Laxmi_Payroll_Accounting / Audit_Logs

    Sup->>Admin: Requests correction for Session SES-2026-09-06
    Admin->>Panel: Inputs Session ID & reason
    Admin->>Panel: Taps "Unlock Session"
    Panel->>GAS: doPost(action: 'saveSession', { isAttendanceFinalized: false, isSheetFinalized: false })
    GAS->>Audit: Append Immutable Audit Log entry: Admin reset session SES-...
    GAS-->>Panel: Success 200 OK
    Panel-->>Admin: Session unlocked banner
    Admin->>Sup: Notifies supervisor to refresh & update
```

---

## Workflow 7: Multi-Spreadsheet Cloud Synchronization & Offline Queue

**Actor:** Client PWA Engine  
**Service:** [`googleSheetsService.js`](file:///D:/VisionLoop/Projects/LaxmiEnterprise/packages/shared/services/googleSheetsService.js)  

```mermaid
flowchart TD
    A[Field Action: Tap Attendance / Trip] --> B[Save Immediately to LocalStorage / IndexedDB]
    B --> C{Internet Connection Active?}
    C -- No (Offline Quarry) --> D[Push into Offline Mutation Queue]
    D --> E[Show Orange 'Offline Queue' Badge]
    E --> F[User continues working uninterrupted]
    C -- Yes (Online) --> G[Send POST to Google Apps Script]
    F -->|Connection Restored| G
    G --> H{Table Domain Routing}
    H -->|HR / Roles| I[(01_Laxmi_HR_Master)]
    H -->|Attendance / Fleet| J[(02_Laxmi_Attendance_Fleet)]
    H -->|Payroll / Audit| K[(03_Laxmi_Payroll_Accounting)]
    I & J & K --> L[Clear item from Local Mutation Queue]
```

---

## Workflow 8: Quality Gate & GitHub Pages Continuous Delivery

**Actor:** Developer / Git Pre-Push Hook  
**Trigger:** `git push origin master`  

```mermaid
flowchart LR
    A[git push] --> B[1. Build Supervisor PWA]
    B --> C[2. Build Admin Portal]
    C --> D[3. Build Unified Hub Dist]
    D --> E[4. Run Utils Tests: 8/8]
    E --> F[5. Run GSheets Tests: 11/11]
    F --> G[6. Run Client Computation Tests: 9/9]
    G --> H[7. Push to GitHub Master]
    H --> I[GitHub Actions: deploy-pages.yml]
    I --> J([Live at visionloop-org.github.io/LaxmiEnterprise/])
```

---

## Summary of Role Permissions Matrix

| Permission / Action | Godown Yard Supervisor (`Maalaxmi.godown@gmail.com`) | System Admin (`Gauravjaiswal0304@gmail.com`) |
| :--- | :---: | :---: |
| **Mark Daily Shift Attendance** | ✅ | ✅ |
| **Enter Late Arrival Times** | ✅ | ✅ |
| **Allocate Workers to Vehicles (Max 8)** | ✅ | ✅ |
| **Request Ad-Hoc Extra Workers** | ✅ | ✅ (Approve / Reject) |
| **Dispatch & Track Trips (1 to 4)** | ✅ | ✅ |
| **Finalize Daily Shift Sheet** | ✅ | ✅ |
| **Unlock Finalized Sessions** | ❌ (View only when locked) | ✅ |
| **Calculate & Edit 1.5x Overtime Rates** | ❌ | ✅ |
| **Contractor Commission Settlements** | ❌ | ✅ |
| **Export Financial CSVs & Payout Reports** | ❌ | ✅ |
| **Multi-Spreadsheet Cloud Configuration** | 👁️ (View status) | ✅ (Full provisioning & sync) |
