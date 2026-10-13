# Attendance & Fleet Management System
# Supervisor Web Application Instructions

**Version:** 5.0  
**Last Updated:** September 6, 2026

---

## 1. Objective

Provide a fast, touch-first installable Progressive Web App (PWA) optimized for Android tablets and smartphones for on-site field supervisors to record daily attendance, manage vehicle assignments, track trip/delivery tasks, and request extra labour.

Authorized Supervisor Account: **`Maalaxmi.godown@gmail.com`**

The application connects to the **100% serverless Google Sheets multi-spreadsheet database** through the `@laxmi/shared` workspace package and Google Apps Script Web App router (`Code.gs`).

---

## 2. Architecture & Shared Package Integration

- **Installable PWA & Offline Support**: Installed directly on Android devices via Web App Manifest (`manifest.json`) and service worker caching (`sw.js`). In remote quarry/yard locations without connectivity, operations are buffered in `localStorage` and synchronized automatically upon reconnecting.
- **Client-Centric Heavy Computation**: All real-time conflict checking, vehicle capacity enforcement (max 1 Driver, 1 Chalan Man, 6 Workers, 8 Total), and high-speed in-memory filtering are executed on the client device CPU via [`ClientComputationService`](../../packages/shared/services/clientComputationService.js), ensuring 0ms tactile feedback.
- **Multi-Spreadsheet Domain Separation**: Operational data flows directly to:
  - `01_Laxmi_HR_Master` (`Employees`, `Users_Roles`)
  - `02_Laxmi_Attendance_Fleet` (`Vehicles`, `Attendance_Sessions`, `Attendance_Records`, `Vehicle_Assignments`, `Vehicle_Trips`, `Extra_Labour_Requests`)
- **Optimistic Reconciliation**: Mutations update UI state optimistically and reconcile in the background. If a concurrency conflict occurs, the latest server state is reloaded safely.

---

## 3. Required API Flows via `@laxmi/shared`

- `fetchInitialData()` / `fetchEmployees()` / `fetchVehicles()` — Load workforce roster and fleet from `01_Laxmi_HR_Master` and `02_Laxmi_Attendance_Fleet`.
- `saveAttendanceRecord(record)` — Record On Time, Arrived (with time), or Absent.
- `saveVehicleAssignment(assignment)` / `deleteVehicleAssignment(id)` — Assign or unassign present employees to vehicles.
- `createTrip(trip)` / `updateTripStatus(tripId, status)` — Dispatch vehicles and advance trip delivery stages (`Dispatched` → `Reached Location` → `Delivered` → `Returned`).
- `saveEmployee(worker)` — Request extra labour or new employee addition (status: `pending_approval`).
- `finalizeSession(sessionId)` — Idempotently finalize and lock the daily shift session.

---

## 4. UI Layout & User Experience

### 4.1. Layout & Responsive Adaptations
- **Tablet Landscape Layout**: Fixed left sidebar and scrollable spreadsheet table optimized for touch interaction (48–56px row height).
- **Mobile Phone Mode**: Compact header bar with hamburger button opening a slide-out drawer menu, allowing full operation on smaller Android screens.
- **Live Counters**: Real-time present counter badge (e.g. `Present: 82 / 120`) updated on every check-in.
- **Search & Filter Chips**: Instant search by Employee ID or Name, Category tabs (All, Workers, Drivers, Chalan Men, Extra Labour, Office, Vehicles), Attendance status (Pending, Completed, All), and Alphabetical range chips.

### 4.2. Attendance Marking
- Segmented touch buttons: **On Time**, **Arrived**, **Absent**.
- On Time and Absent submit immediately with zero lag.
- Arrived opens `ArrivedTimeModal` allowing quick time presets (e.g. 08:15, 08:30, 09:00) or manual time selection.
- Status badge dynamically reflects server confirmation (e.g. `Arrived (08:30)`).

### 4.3. Vehicle Capacity & Conflict Management
- Displays live vehicle capacity bars (max 1 Driver, 1 Chalan Man, 6 Workers, 8 Total).
- Capacity violations highlight in warning colors and trigger `CapacityConflictModal` with automated fix options.
- Assignment history per vehicle available in `VehicleAssignmentHistory`.

### 4.4. Vehicle Trip & Task Completion Lifecycle
- `TripTrackerModal` allows supervisors to:
  1. Dispatch vehicle with assigned driver, destination location, and product details.
  2. Advance trip status through task completion milestones:
     - **Dispatched** → **Reached Location** → **Delivered Product** → **Returned / Completed**.
  3. View historical and active trip timelines.

### 4.5. Extra Labour & Employee Requests
- `RequestEmployeeModal` enables supervisors to request additional labour on the fly.
- Newly requested workers display `Pending Approval` badge until approved by an administrator.

### 4.6. Finalization & Reporting
- Finalization submits to Google Sheets.
- Once confirmed, editable controls lock and status changes to "Attendance Locked".
- Local PDF generation module produces clean formatted attendance sheets and vehicle utilization reports.

