# Supervisor Attendance Tracking & Fleet Management System

A high-speed, touch-first installable Progressive Web App (PWA) for field supervisors to track employee attendance, manage vehicle assignments, track trip/delivery lifecycles, and request extra labour, optimized for Android tablets and smartphones.

Authorized Supervisor: **`Maalaxmi.godown@gmail.com`**

---

## 🌟 Key Features

### 1. Installable Web App (PWA) & Offline Mode
- **Standalone App Installation**: Tap the in-app **"Install App"** button ([`InstallAppButton`](../../packages/shared/components/InstallAppButton.jsx)) on Android tablets or phones to install the application directly to the home screen.
- **Service Worker Offline Caching**: Shell assets and application code are cached locally via `sw.js` for instant loading in remote quarry or transport yard sites without cellular data.
- **Responsive Layout with Mobile Drawer**: Full-width spreadsheet interface for landscape tablets, and a top navigation bar with a sliding drawer menu for smartphone screens.
- **Touch-First Optimization**: Large 48–56px touch targets, fast scrolling, and touch-optimized interactions (`touch-action: manipulation`).

### 2. Client-Centric Heavy Computation
- Real-time client-side conflict checking and capacity enforcement via [`ClientComputationService`](../../packages/shared/services/clientComputationService.js).
- In-memory multi-attribute filtering (category, status, name search, alphabetical ranges) with 0ms UI latency.
- Live check-in counters (`Present: X / Y`) update instantaneously without server roundtrips.

### 3. Attendance Management
- **Instant Attendance Marking**: Large touch buttons for marking **On Time** and **Absent** with non-blocking feedback.
- **Arrived Time Flow (`ArrivedTimeModal`)**: Popover with quick presets (e.g. 08:15, 08:30, 09:00) and manual arrival time selection.
- **Category Organization**: Category tabs for All, Workers, Drivers, Chalan Men, Extra Labour, Office, and Vehicles with dynamic count chips.
- **Attendance Locking**: Once the session is confirmed finalized, controls lock to prevent accidental modification.

### 4. Vehicle Capacity & Assignment Engine
- **Capacity Constraints**: Strictly validates max 1 Driver, 1 Chalan Man, 6 Workers / Extra Labour, and 8 total employees per vehicle.
- **Visual Utilization Indicators**: Color-coded progress bars displaying current headcount against seat limits.
- **Conflict Resolution (`CapacityConflictModal`)**: Instant feedback on capacity violations with one-click resolution.
- **Inline Assignment & Removal**: Assign or unassign present employees directly from vehicle or employee rows.
- **Assignment History (`VehicleAssignmentHistory`)**: Complete per-vehicle assignment and unassignment timelines.

### 5. Vehicle Trip & Task Completion Lifecycle (`TripTrackerModal`)
- **Task Progression Flow**: Track vehicle dispatches through four distinct operational milestones:
  1. **Dispatched**: Vehicle departs quarry/yard with driver and product payload.
  2. **Reached Location**: Vehicle arrives at the designated destination site.
  3. **Delivered Product**: Material / aggregate delivery verified and unloaded.
  4. **Returned / Completed**: Vehicle returns to base and becomes available for new dispatch.
- **Timeline Tracking**: Visual event log recording timestamps, acting supervisors, and site remarks.

### 6. Workforce Requests (`RequestEmployeeModal`)
- Enables on-site supervisors to quickly request extra labour or temporary workers.
- Submitted entries enter the Admin Approval queue with a `Pending Approval` badge until authorized.

### 7. Multi-Spreadsheet Persistence
- Operates against the Google Sheets multi-spreadsheet architecture (`01_Laxmi_HR_Master` and `02_Laxmi_Attendance_Fleet`).
- Direct Google Sheets Integration via `googleSheetsService.js` and local storage buffer.
- Offline Mutation Queue buffers mutations locally during network dropouts and synchronizes automatically upon reconnecting.
- Client-side PDF generator produces clean formatted attendance and fleet allocation reports.

---

## 🛠️ Architecture & Tech Stack

- **Framework**: React 19 with Vite
- **PWA Suite**: Web App Manifest (`manifest.json`), Service Worker (`sw.js`), native install prompts
- **Data Layer**: `@laxmi/shared` React Query hooks (`useEmployees`, `useVehicles`, `useTrips`, `useCreateTrip`, `useUpdateTripStatus`)
- **Computation**: Client-side calculation engine (`ClientComputationService`) for conflict detection & filtering
- **API Transport**: Direct Google Apps Script Web App REST API with exponential backoff & jitter
- **Styling**: TailwindCSS 3.4 & Vanilla CSS with landscape tablet & mobile phone drawer
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
- **Authorized Supervisor**: `Maalaxmi.godown@gmail.com`
- **Access Verification**: Authorized accounts are defined in the `Users_Roles` sheet in `01_Laxmi_HR_Master`.
- **Demo Fallback (Offline)**: `supervisor` / `password123`

