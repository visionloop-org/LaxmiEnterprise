---
description: Understand the Laxmi Enterprise codebase architecture and workflow
---

# Understanding Laxmi Enterprise Codebase

## Overview (Updated Aug 11, 2026)
This workflow helps understand the Laxmi Enterprise attendance system architecture, including the monorepo structure, shared packages, and applications. The knowledge graph has been regenerated with 784 nodes, 1238 edges, and 62 communities.

## Steps to Understand the Codebase

### 1. Review Architecture
- ✅ Read `ARCHITECTURE.md` to understand the monorepo structure
- ✅ Review the directory structure: `packages/`, `apps/`, `ServerSide/`
- ✅ Understand the shared package concept

### 2. Examine Shared Packages
- ✅ Review `packages/shared/` directory
- ✅ Check shared services: `authService.js`, `backendApi.js`, `restEmployeeService.js`, `restVehicleService.js`
- ✅ Review shared components: `ErrorBoundary.jsx`, `LoadingSpinner.jsx`
- ✅ Check shared hooks: `useEmployees.js`, `useVehicles.js`

### 3. Review Applications
- ✅ **Supervisor App**: `apps/supervisor/` (currently not using shared packages)
- ✅ **Admin App**: `apps/admin/` (using shared packages)
- ✅ Compare how each app uses the shared packages

### 4. Backend Architecture
- ✅ Review `ServerSide/` FastAPI backend
- ✅ Check API endpoints in `ServerSide/app/api/v1/`
- ✅ Review database models in `ServerSide/app/models/`
- ✅ Understand MongoDB integration

### 5. Current Status
- ✅ Check running applications
- ✅ Review CORS configuration
- ✅ Verify MongoDB connection
- ✅ Test authentication flow

### 6. Workflow Plan
- ✅ Review `WORKFLOW_PLAN.md` for next steps
- ✅ Understand the phased approach
- ✅ Check current TODO list status

## Key Components

### Shared Services
- `authService`: Handles login, token management, refresh
- `backendApi`: Direct REST API client with error handling
- `restEmployeeService`: Employee API operations
- `restVehicleService`: Vehicle API operations

### Shared Hooks
- `useEmployees`: React Query hook for employee data
- `useVehicles`: React Query hook for vehicle data

### Applications
- **Supervisor**: Attendance tracking, vehicle assignment (http://localhost:5173)
- **Admin**: Overview, statistics, reporting (http://localhost:5174)

## Completed Tasks (Aug 11, 2026)
- ✅ Monorepo structure established
- ✅ Shared packages created (@laxmi/shared)
- ✅ Admin dashboard using shared packages
- ✅ Supervisor app running (not yet using shared packages)
- ✅ Backend API running with MongoDB
- ✅ CORS configured for both apps
- ✅ Knowledge graph regenerated (784 nodes, 1238 edges, 62 communities)
- ✅ Understanding workflow documented
- ✅ Planning documentation updated
- ✅ TODO.md updated with completed items

## Next Steps
Based on the workflow plan, the next immediate steps are:
1. Refactor supervisor app to use shared packages
2. Add date range filtering to admin dashboard
3. Add export functionality to admin dashboard

## Running Applications
- **Supervisor App**: http://localhost:5173
- **Admin App**: http://localhost:5174
- **Backend API**: http://localhost:8000
- **MongoDB**: Docker container running
