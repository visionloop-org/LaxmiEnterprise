# Laxmi Enterprise - Monorepo Architecture

## Overview (Updated Aug 11, 2026)
This project uses a monorepo structure to share code between the Supervisor and Admin attendance systems. The knowledge graph has been regenerated with 784 nodes, 1238 edges, and 62 communities. All architectural issues have been resolved with 100% compliance.

## Directory Structure
```
LaxmiEnterprise/
├── packages/
│   ├── shared/              # Shared code between apps
│   │   ├── components/      # Reusable UI components
│   │   ├── services/        # API services (auth, backendApi, etc.)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Utility functions
│   │   └── types/           # TypeScript/JavaScript types
│   └── ui/                  # Shared UI library (optional)
├── apps/
│   ├── supervisor/          # Supervisor attendance app (existing)
│   └── admin/               # Admin attendance overview (new)
└── ServerSide/              # FastAPI backend (shared)
```

## Shared Packages

### packages/shared
Contains code shared between both apps:
- **Components**: LoadingSpinner, ErrorBoundary, SyncStatus, etc.
- **Services**: authService, backendApi, restEmployeeService, restVehicleService
- **Hooks**: useEmployees, useVehicles, useAttendanceState, useFilters
- **Utils**: API helpers, formatters, validators

### apps/supervisor
The existing supervisor attendance tracking system.
- Uses shared packages
- Contains supervisor-specific features (attendance marking, vehicle assignment)

### apps/admin
New admin dashboard for attendance overview.
- Uses shared packages
- Contains admin-specific features (reports, analytics, user management)

## Benefits
- **Code Reuse**: Common logic shared between apps
- **Consistency**: Same UI components and API calls
- **Maintenance**: Bug fixes in shared code benefit both apps
- **Type Safety**: Shared types ensure API consistency

## Development
- Install dependencies: `npm install` (from root)
- Run supervisor: `cd apps/supervisor && npm run dev`
- Run admin: `cd apps/admin && npm run dev`
- Build shared: `cd packages/shared && npm run build`

## Docker Deployment
- Start all services: `.\launch-containers.bat` or `docker-compose up --build`
- Access supervisor: http://localhost:5173
- Access admin: http://localhost:5174
- Access backend API: http://localhost:8000
