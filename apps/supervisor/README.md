# Supervisor Attendance Tracking & Fleet Management System

A high-speed, touch-first web interface for field supervisors to track employee attendance, manage vehicle assignments, track trip/delivery lifecycles, and request extra labour, optimized for landscape tablets.

---

## 🌟 Key Features

### 1. Attendance Management
- **Real-Time Attendance Marking**: Large 48–56px touch targets for instant marking of **On Time** and **Absent**.
- **Arrived Time Flow (`ArrivedTimeModal`)**: Popover with quick presets (e.g. 08:15, 08:30, 09:00) and manual arrival time selection.
- **Category Organization**: Category tabs for All, Workers, Drivers, Chalan Men, Extra Labour, Office, and Vehicles.
- **Fast Search & Filter Chips**: Instant search by Employee ID/Name, Attendance status filter (Pending, Completed, All), and Alphabetical range chips.
- **Attendance Locking**: Once the session is confirmed finalized by the server, all controls lock to prevent accidental modification.

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

### 5. Resilient Offline Mode & PDF Reporting
- **Offline Mutation Queue (`offlineQueue.js`)**: Buffers mutations locally during network dropouts and synchronizes automatically upon reconnecting.
- **Client-Side PDF Generator**: Generates formatted attendance and fleet allocation reports with exception breakdowns.

---

## 🛠️ Architecture & Tech Stack

- **Framework**: React 19 with Vite
- **Data Layer**: `@laxmi/shared` React Query hooks (`useEmployees`, `useVehicles`, `useTrips`, `useCreateTrip`, `useUpdateTripStatus`)
- **API Transport**: `backendApi` with automatic JWT bearer token injection and optimistic updates
- **Styling**: TailwindCSS 3.4 & Vanilla CSS with landscape tablet optimization
- **PDF Engine**: jsPDF with custom tabular renderers and layout manager

---

## 📁 Directory Structure

```
apps/supervisor/src/
├── components/
│   ├── attendance/               # ArrivedBadge, AttendanceButtons, LockedAttendance
│   ├── pdf/                      # PDFRenderer, LayoutManager, Renderers
│   ├── ui/                       # ButtonGroup, LabourRequestButtons, VehicleSelect, Toast
│   ├── ArrivedTimeModal.jsx      # Arrival time picker (from @laxmi/shared)
│   ├── CapacityConflictModal.jsx # Overcapacity resolution modal
│   ├── CapacityReportModal.jsx   # Fleet capacity overview modal
│   ├── CategoryTabs.jsx          # Tab navigation
│   ├── EmployeeRow.jsx           # Individual touch table row
│   ├── EmployeeTable.jsx         # Touch spreadsheet table
│   ├── FilterChips.jsx           # Active filter chips
│   ├── LeftColumn.jsx            # Filter sidebar & finalization trigger
│   ├── LoginModal.jsx            # Authentication modal
│   ├── RequestEmployeeModal.jsx  # Extra labour request modal
│   ├── RightColumn.jsx           # Live stats & PDF download button
│   ├── SyncStatus.jsx            # Online/offline sync badge
│   ├── TripTrackerModal.jsx      # Trip & task completion lifecycle modal
│   ├── VehicleAssignmentHistory.jsx # Assignment audit modal
│   └── VehicleTable.jsx          # Vehicle fleet assignment table
│
├── hooks/
│   ├── useAttendanceHandlers.js  # Event handler orchestrations
│   ├── useAttendanceState.js     # Component UI state management
│   ├── useFilters.js             # Table filtering and search logic
│   ├── useStatistics.js          # Shift stats calculation
│   └── useTableSort.js           # Multi-column sorting
│
└── services/
    ├── offlineQueue.js           # Local offline mutation buffer
    └── reportService.js          # Client-side PDF generation service
```

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
Runs at `http://localhost:5173`.

### Production Build & Linting
```bash
npm run build
npm run lint
```

### Docker Container
```bash
docker build -t laxmi-supervisor .
docker run -p 5173:5173 -e VITE_API_BASE_URL=http://localhost:8000/api/v1 laxmi-supervisor
```

---

## 🔐 Default Credentials (Demo)

- **Username**: `supervisor` (or `admin`)
- **Password**: `password123`
