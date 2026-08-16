---
description: Understand the Laxmi Enterprise codebase architecture and workflow
---

# Understanding Laxmi Enterprise Codebase

## Overview (Updated August 16, 2026)
This workflow provides a guided tour through the Laxmi Enterprise monorepo architecture, shared packages, applications, and backend services.

## Steps to Understand the Codebase

### 1. Review Architecture & Boundaries
- ✅ Read `ARCHITECTURE.md` to understand the monorepo structure and subsystem layers.
- ✅ Review directory structure: `packages/shared/`, `apps/supervisor/`, `apps/admin/`, `ServerSide/`.
- ✅ Read `MASTER INSTRUCTIONS.md` to understand single-source-of-truth rules.

### 2. Examine Shared Package (`@laxmi/shared`)
- ✅ Review `packages/shared/` directory.
- ✅ Check shared services: `authService.js`, `backendApi.js`, `restSessionService.js`, `restEmployeeService.js`, `restVehicleService.js`, `restAssignmentService.js`, `restTripService.js`.
- ✅ Review shared UI components: `ArrivedTimeModal.jsx`, `ErrorBoundary.jsx`, `LoadingSpinner.jsx`.
- ✅ Check React Query hooks: `useEmployees.js`, `useVehicles.js`, `useTrips.js`.
- ✅ Review auto-generated TypeScript contracts: `packages/shared/types/api.ts`.

### 3. Review Applications
- ✅ **Supervisor App (`apps/supervisor/`)**: Touch-first tablet UI for attendance, vehicle capacity, trip progression (`TripTrackerModal`), and labour requests (`RequestEmployeeModal`).
- ✅ **Admin Portal (`apps/admin/`)**: Comprehensive analytics, date range filtering, automated payroll calculation, supervisor request approvals, and session unlocking.
- ✅ **Shared Packages Integration**: Both apps consume `@laxmi/shared` as a direct workspace dependency.

### 4. Backend Architecture (`ServerSide/`)
- ✅ Review `ServerSide/` FastAPI application and route definitions in `app/api/v1/`.
- ✅ Review Pydantic schemas in `app/models/` (Employee, Vehicle, Session, Attendance, Assignment, Trip, User).
- ✅ Review services in `app/services/` (`trip_service.py`) and MongoDB transactions in `app/db/mongodb.py`.
- ✅ Understand optimistic concurrency via `attendance_sessions.version`.

### 5. Type Synchronization Pipeline
- ✅ Review `TYPE_SYNC_GUIDE.md`.
- ✅ Check `ServerSide/scripts/export_openapi.py` and `ServerSide/scripts/sync.py`.

### 6. Workflow Plan & Roadmap
- ✅ Review `WORKFLOW_PLAN.md` for phase progression and delivery schedules.
- ✅ Check `TODO.md` for completed milestones and upcoming tasks.

## Key Services & Endpoints
- **Authentication**: `POST /api/v1/auth/login`, `GET /api/v1/auth/me`
- **Sessions & Locking**: `GET|POST /api/v1/sessions`, `POST /api/v1/sessions/{id}/finalize`, `POST /api/v1/sessions/{id}/unlock`
- **Attendance**: `PUT /api/v1/sessions/{id}/attendance/{employeeId}`
- **Vehicle Capacity & Assignment**: `PUT|DELETE /api/v1/sessions/{id}/assignments/{employeeId}`
- **Trip & Task Completion**: `POST /api/v1/trips`, `GET /api/v1/trips`, `PUT /api/v1/trips/{id}/status`
- **Employees & Approvals**: `GET|POST /api/v1/employees`, `POST /api/v1/employees/{id}/approve`, `POST /api/v1/employees/{id}/reject`
- **Vehicles**: `GET /api/v1/vehicles`, `PATCH /api/v1/vehicles/{id}`

## Running the Applications
- **Supervisor App**: http://localhost:5173 (`npm run dev:supervisor`)
- **Admin Portal**: http://localhost:5174 (`npm run dev:admin`)
- **Backend API**: http://localhost:8000 (`uvicorn app.main:app --reload`)
- **Interactive Swagger Docs**: http://localhost:8000/docs
- **Launch All with Docker**: `.\launch-containers.bat`
