# Supervisor Attendance Tracking System

A touch-first web interface for tracking employee attendance and vehicle assignments, optimized for landscape tablets.

## Features

### Attendance Management
- **Real-time attendance tracking** with instant search and filtering
- **Category-based organization**: Workers, Drivers, Chalan Men, Extra Labour, Office
- **Attendance statuses**: On Time, Arrived (with time recording), Absent
- **Touch-optimized UI** with large touch targets and spreadsheet-style layout
- **Filter chips** for category, attendance status, and alphabet ranges
- **Extra Labour management** with contractor and remarks fields

### Vehicle Assignment System
- **Vehicle capacity management** with real-time utilization tracking
- **Capacity constraints**: Max 1 Driver, 1 Chalan Man, 6 Workers per vehicle (total 8)
- **Visual capacity indicators** with color-coded progress bars
- **Inline employee removal** directly from vehicle rows
- **Capacity violation detection** with "Fix Violations" workflow
- **Vehicle status management**: Available, In Use, Maintenance
- **Vehicle locking** to prevent further assignments
- **Assignment history** per vehicle
- **Bulk reassignment** of employees between vehicles
- **Auto-suggest available vehicles** based on capacity and category
- **Capacity report modal** showing empty, under-utilized, optimal, and full vehicles
- **CSV export** for vehicle assignments
- **Vehicle efficiency metrics** in the right panel

### UI Features
- **Table sorting** by clicking headers (ID, Name, Category, Status, Capacity)
- **Sticky headers** for easy navigation
- **Responsive design** optimized for landscape tablets
- **Real-time filtering** without page refreshes
- **Auto-save** to localStorage
- **PDF report generation** with attendance and vehicle assignment details

## Tech Stack

- **React** with Vite
- **TailwindCSS** for styling
- **jsPDF** for PDF generation
- **LocalStorage** for data persistence

## Project Structure

```
app/src/
├── components/
│   ├── CategoryTabs.jsx          # Category navigation
│   ├── EmployeeTable.jsx         # Employee table with sorting
│   ├── EmployeeRow.jsx           # Individual employee row
│   ├── FilterChips.jsx           # Active filter display
│   ├── LeftColumn.jsx            # Sidebar with filters
│   ├── RightColumn.jsx           # Statistics panel
│   ├── VehicleTable.jsx          # Vehicle management table
│   ├── CapacityReportModal.jsx   # Capacity analysis modal
│   ├── CapacityConflictModal.jsx  # Conflict resolution modal
│   ├── VehicleAssignmentHistory.jsx # Assignment history modal
│   └── pdf/                      # PDF generation
│       ├── pdfHandler.js
│       ├── PDFRenderer.js
│       ├── renderers/
│       │   ├── VehicleSectionRenderer.js
│       │   └── ...
│       └── layout/
├── hooks/
│   ├── useAttendanceState.js     # State management
│   ├── useAttendanceHandlers.js  # Event handlers
│   ├── useFilters.js             # Filtering logic
│   ├── useStatistics.js          # Statistics calculation
│   └── useTableSort.js           # Table sorting
└── data/
    ├── generateEmployees.js
    └── generateVehicles.js
```

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Usage

1. **Select a category** from the tabs (All, Workers, Drivers, Chalan Men, Extra Labour, Office, Vehicles)
2. **Filter employees** using search, attendance status, or alphabet range
3. **Mark attendance** by clicking On Time, Arrived, or Absent
4. **Assign vehicles** from the Vehicles tab or employee dropdown
5. **Monitor capacity** using the visual indicators and progress bars
6. **Fix violations** by clicking "Fix Violations" and removing employees
7. **Generate reports** using the Download Report button (when finalized)

## Vehicle Capacity Rules

- **Drivers**: Maximum 1 per vehicle
- **Chalan Men**: Maximum 1 per vehicle
- **Workers/Extra Labour**: Maximum 6 per vehicle
- **Total Capacity**: 8 employees per vehicle
- **Violations** are highlighted in orange and must be resolved before finalizing

## PDF Report

The generated PDF includes:
- Session summary (total, completed, pending counts)
- Category breakdown
- Employee attendance details
- Vehicle assignments with capacity breakdown
- Vehicle efficiency metrics
- Capacity violations (if any)
- Exception report

## Data Persistence

All data is automatically saved to localStorage under the key `attendanceAppState`.

## Version

Current Version: 2.0

