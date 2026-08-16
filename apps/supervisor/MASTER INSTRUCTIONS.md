# Attendance System
# Supervisor Web Application Instructions

**Version:** 3.1  
**Last Updated:** August 16, 2026

---

## 1. Objective

Provide a fast, touch-first landscape-tablet web application for on-site supervisors to record daily attendance, manage vehicle assignments, track trip/delivery tasks, and request extra labour.

The application communicates solely via the versioned REST API at `/api/v1` through the `@laxmi/shared` workspace package. The server is authoritative for validation, capacity, locking, trips, audits, and official records.

---

## 2. Architecture & Shared Package Integration

- **Presentation Layer Only**: React components emit user intent. State and network synchronization are managed by `@laxmi/shared` services and React Query hooks (`useEmployees`, `useVehicles`, `useTrips`).
- **No Direct DB Access**: The supervisor app never communicates with MongoDB.
- **Offline Support**: `services/offlineQueue.js` buffers mutations when offline and syncs them automatically upon network restoration.
- **Optimistic Reconciliation**: Mutations update UI state optimistically and reconcile immediately with server responses. On `409 Conflict`, reload server state and display inline notifications.

---

## 3. Required API Flows via `@laxmi/shared`

- `GET /api/v1/sessions/{sessionId}` — Load editable session.
- `PUT /api/v1/sessions/{sessionId}/attendance/{employeeId}` — Record On Time, Arrived, or Absent.
- `PUT /api/v1/sessions/{sessionId}/assignments/{employeeId}` — Assign present employee to vehicle.
- `DELETE /api/v1/sessions/{sessionId}/assignments/{employeeId}` — Remove vehicle assignment.
- `POST /api/v1/trips` & `PUT /api/v1/trips/{id}/status` — Dispatch vehicles and advance trip delivery stages.
- `POST /api/v1/employees` — Request extra labour or new employee addition (status: `pending_approval`).
- `POST /api/v1/sessions/{sessionId}/finalize` — Idempotently finalize and lock session.

---

## 4. UI Layout & User Experience

### 4.1. Layout
- Fixed left sidebar and scrollable spreadsheet table optimized for touch interaction (48–56px row height).
- Real-time search by Employee ID or Name.
- Quick filter chips: Category tabs (All, Workers, Drivers, Chalan Men, Extra Labour, Office, Vehicles), Attendance status (Pending, Completed, All), and Alphabetical range chips.

### 4.2. Attendance Marking
- Segmented touch buttons: **On Time**, **Arrived**, **Absent**.
- On Time and Absent submit immediately.
- Arrived opens `ArrivedTimeModal` allowing quick time presets (e.g. 08:15, 08:30, 09:00) or manual time selection.
- Display server-confirmed status badge (e.g. `Arrived (08:30)`) upon successful mutation.

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
- Finalization submits to `POST /api/v1/sessions/{id}/finalize`.
- Once confirmed by the server, editable controls lock and status changes to "Attendance Locked".
- Local PDF generation module produces clean formatted attendance sheets and vehicle utilization reports.
