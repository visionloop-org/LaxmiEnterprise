# Laxmi Enterprise — Admin Analytics & Governance Portal

The Admin Portal is an administrative dashboard for Laxmi Enterprise management. It provides organization-wide attendance analytics, automated daily payroll computations, supervisor workforce request approvals, emergency session unlocking, fleet utilization tracking, and data export tools.

---

## 🌟 Key Features

### 1. Attendance & Historical Date Range Filtering
- Filter all workforce attendance records across flexible date ranges:
  - **Quick Presets**: Today, Last 7 Days, Last 30 Days.
  - **Custom Range**: Start date and end date selectors.
- Overview KPI summary cards: Total Registered Workforce, Active Fleet Vehicles, Present Today, Vehicles Currently In Use.

### 2. Automated Payroll & Overtime Engine
- Automatically computes daily base compensation and extra duty/overtime pay based on verified attendance records.
- Configurable category wage presets:
  - **Drivers**: ₹800/day
  - **Office Staff**: ₹750/day
  - **Chalan Men**: ₹650/day
  - **Workers**: ₹500/day
  - **Extra Labour**: ₹450/day
- Calculates 1.5x overtime rates for extra hours recorded during field shifts.

### 3. Supervisor Request Approval Center
- Review on-the-fly employee and extra labour addition requests submitted by field supervisors.
- Admin governance actions:
  - **Approve**: Activates the employee record for full assignment and payroll eligibility.
  - **Reject**: Declines the addition with reason logging.
  - **Edit**: Corrects name, category, or contractor details inline.
  - **Delete**: Permanently removes obsolete or invalid employee entries.

### 4. Emergency Session Unlock (Admin Exclusive)
- Allows administrators to reset a finalized session back to `in_progress` if corrections are required after a supervisor has finalized the daily sheet.
- Emits an append-only audit event (`audit_events`) logging the unlocking administrator and timestamp.

### 5. Fleet Utilization & Trip Monitoring
- Real-time vehicle status indicators (`Available`, `In Use`, `Maintenance`).
- Integrated trip monitoring displaying vehicle dispatch and delivery stages.

### 6. One-Click CSV Exports
- **Payroll & Attendance CSV**: Comprehensive employee export including base pay, extra duty hours, arrival times, and total compensation.
- **Vehicle Status CSV**: Fleet allocation, status, and assignment data for logistics reporting.

---

## 🛠️ Architecture & Tech Stack

- **Framework**: React 19 with Vite
- **Data Layer**: `@laxmi/shared` React Query hooks (`useEmployees`, `useVehicles`, `useTrips`, `useApproveEmployee`, `useRejectEmployee`, `useUpdateEmployee`, `useDeleteEmployee`)
- **Authentication**: JWT token management via `authService`
- **Styling**: Vanilla CSS (`App.css`, `index.css`) with responsive design

---

## 🚀 Getting Started

### Local Development
```bash
# From workspace root
npm run dev:admin

# Or from apps/admin directory
cd apps/admin
npm install
npm run dev
```
The application runs on `http://localhost:5174`.

### Production Build & Linting
```bash
npm run build
npm run lint
```

### Docker Container
```bash
# Build and run standalone container
docker build -t laxmi-admin .
docker run -p 5174:5174 -e VITE_API_BASE_URL=http://localhost:8000/api/v1 laxmi-admin
```

---

## 🔐 Default Credentials (Demo)

- **Username**: `admin`
- **Password**: `password123`
