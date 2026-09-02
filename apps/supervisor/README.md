# Supervisor Attendance Tracking & Fleet Management System

A high-speed, touch-first web interface for field supervisors to track employee attendance, manage vehicle assignments, track trip/delivery lifecycles, and request extra labour, optimized for landscape tablets.

---

## 🌟 Key Features

### 1. Attendance Management
- **Real-Time Attendance Marking**: Large 48–56px touch targets for instant marking of **On Time** and **Absent**.
- **Arrived Time Flow (`ArrivedTimeModal`)**: Popover with quick presets (e.g. 08:15, 08:30, 09:00) and manual arrival time selection.
- **Category Organization**: Category tabs for All, Workers, Drivers, Chalan Men, Extra Labour, Office, and Vehicles with dynamic count chips.
- **Fast Search & Filter Chips**: Instant search by Employee ID/Name, Attendance status filter (Pending, Completed, All), and Alphabetical range chips.
- **Attendance Locking**: Once the session is confirmed finalized, controls lock to prevent accidental modification.

### 2. Vehicle Capacity & Assignment Engine
- **Capacity Constraints**: Strictly validates max 1 Driver, 1 Chalan Man, 6 Workers / Extra Labour, and 8 total employees per vehicle.
- **Visual Utilization Indicators**: Color-coded progress bars displaying current headcount against seat limits.
- **Conflict Resolution (`CapacityConflictModal`)**: Instant feedback on capacity violations with one-click resolution.
- **Inline Assignment & Removal**: Assign or unassign present employees directly from vehicle or employee rows.
- **Assignment History (`VehicleAssignmentHistory`)**: Complete per-vehicle assignment and unassignment timelines.

### 3. Vehicle Trip & Task Completion Lifecycle (`TripTrackerModal`)
- **Task Progression Flow**: Track vehicle dispatches through four distinct operational milestones:
  1. **Dispatched**: Vehicle departs quarry/yard with driver and product payload.
  2. **Reached Location**: Vehicle arrives at the designated destination site.
  3. **Delivered Product**: Material / aggregate delivery verified and unloaded.
  4. **Returned / Completed**: Vehicle returns to base and becomes available for new dispatch.
- **Timeline Tracking**: Visual event log recording timestamps, acting supervisors, and site remarks.

### 4. Workforce Requests (`RequestEmployeeModal`)
- Enables on-site supervisors to quickly request extra labour or temporary workers.
- Submitted entries enter the Admin Approval queue with a `Pending Approval` badge until authorized.

### 5. Resilient Offline Mode & Google Sheets Persistence
- **Direct Google Sheets Integration**: Operations persist directly to Google Sheets via `googleSheetsService.js` and local storage buffer.
- **Offline Mutation Queue**: Buffers mutations locally during network dropouts and synchronizes automatically upon reconnecting.
- **Client-Side PDF Generator**: Generates formatted attendance and fleet allocation reports with exception breakdowns.

---

## 🛠️ Architecture & Tech Stack

- **Framework**: React 19 with Vite
- **Data Layer**: `@laxmi/shared` React Query hooks (`useEmployees`, `useVehicles`, `useTrips`, `useCreateTrip`, `useUpdateTripStatus`)
- **API Transport**: Direct Google Apps Script Web App REST API with exponential backoff & jitter
- **Styling**: TailwindCSS 3.4 & Vanilla CSS with landscape tablet optimization
- **PDF Engine**: jsPDF with custom tabular renderers and layout manager

---

## 🚀 Getting Started

### Local Development
```bash
# From workspace root
npm run dev:supervisor

# Or from apps/supervisor directory
cd apps/supervisor
npm install
npm run dev
```
Runs at `http://localhost:5173` (or `http://localhost:5173/supervisor/` via unified dev runner).

### Production Build & Linting
```bash
npm run build
npm run lint
```

---

## 🔐 Authentication & Access Governance

- **Serverless Google Authentication**: Sign in using your registered Gmail account via Google Identity Services (GIS).
- **Access Verification**: Authorized accounts are defined in the `Users_Roles` sheet in Google Sheets.
- **Demo Fallback (Offline)**: `supervisor` / `password123`
