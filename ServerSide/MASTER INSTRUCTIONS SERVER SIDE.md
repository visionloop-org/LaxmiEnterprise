# Attendance System
# Server-Side Instructions

Version: 2.0

## Objective

Provide the central, versioned FastAPI REST API at `/api/v1` for multiple independently deployed web, Python, mobile, automation, and reporting applications.

Persist authoritative attendance data in MongoDB, enforce all business rules server-side, maintain an audit trail, and generate official reports from persisted data.

## Technology

- Python and FastAPI
- MongoDB Atlas or a MongoDB replica set
- Motor or PyMongo behind a repository layer
- JWT authentication and role-based authorization
- FastAPI OpenAPI documentation and language-specific generated/contract-tested clients
- Redis with Celery or RQ for report generation and other long-running jobs
- ReportLab for server-generated PDFs

## Architecture

Keep routes thin. Use this separation:

- **Routes/controllers:** request validation, authentication, authorization, HTTP responses.
- **Application/use cases:** attendance recording, assignment, unassignment, finalization, report requests.
- **Domain:** pure capacity and attendance/session-transition rules.
- **Repositories:** MongoDB persistence only.
- **Workers:** reports and long-running background tasks.

No client application receives MongoDB write credentials. All attendance-session writes go through this service.

## Collections

### employees

Employee master data: `employeeId`, `name`, `category`, `photoPath`, `displayOrder`, `status`, `contractor`, `remarks`, `createdAt`, `updatedAt`.

### vehicles

Vehicle master data: `vehicleNumber`, `vehicleType`, `status` (`available`, `in_use`, `maintenance`), `active`, `createdAt`, `updatedAt`.

### attendance_sessions

One document per date and shift: `sessionDate`, `shift`, `status` (`in_progress`, `finalized`), `supervisorId`, `version`, `finalizedAt`, `finalizedBy`, `createdAt`, `updatedAt`.

### attendance_records

One document per employee per session: `sessionId`, `employeeId`, `status` (`on_time`, `arrived`, `absent`), `arrivalTime`, `recordedBy`, `recordedAt`, `remarks`, `version`.

### vehicle_assignments

Assignment history: `sessionId`, `employeeId`, `vehicleId`, `assignedAt`, `assignedBy`, `unassignedAt`, `unassignedBy`.

### daily_labour

Additional labour entries: `date`, `name`, `contractor`, `remarks`, `createdBy`, `createdAt`.

### users, categories, settings

Authenticated user, category configuration, and organization/report configuration data.

### audit_events

Append-only mutation history: `sessionId`, `actorId`, `action`, `entityType`, `entityId`, `previousValue`, `newValue`, `createdAt`.

## Required Endpoints

- `POST /api/v1/auth/login`, `GET /api/v1/auth/me`
- `GET|POST /api/v1/employees`, `GET|PUT /api/v1/employees/{id}`
- `GET|POST /api/v1/sessions`, `GET /api/v1/sessions/{id}`
- `PUT /api/v1/sessions/{id}/attendance/{employeeId}`
- `PUT|DELETE /api/v1/sessions/{id}/assignments/{employeeId}`
- `POST /api/v1/sessions/{id}/finalize`
- `GET|PATCH /api/v1/vehicles`, `PATCH /api/v1/vehicles/{id}`
- `GET|POST /api/v1/daily-labour`
- `POST /api/v1/sessions/{id}/reports`, `GET /api/v1/reports/{id}/download`
- `GET /api/v1/categories`, `GET|PUT /api/v1/settings`

Publish matching OpenAPI documentation. Preserve compatibility or create a new API version for breaking changes.

## Business Rules and Consistency

- Only one attendance record exists for each employee and session.
- Attendance cannot be changed after finalization.
- A vehicle assignment requires a present employee and an active vehicle not in maintenance.
- Each active vehicle assignment allows at most one Driver, one Chalan Man, six Workers/Extra Labour, and eight employees total.
- The server recalculates capacity inside the mutation; never trust a client-provided capacity count.
- Finalization is idempotent. Repeated requests return the same final state and do not create duplicate reports or audits.

All multi-document mutations—attendance plus audit, assignment plus audit, finalization plus audit/report request—run in MongoDB transactions. MongoDB must use a replica set or Atlas.

Use optimistic concurrency with `attendance_sessions.version`. A stale mutation returns HTTP `409 Conflict`, a stable error code, and the current server version/state needed by the client to recover.

## Indexes

- `employees.employeeId` unique; searchable name/category indexes as needed.
- `vehicles.vehicleNumber` unique.
- `attendance_sessions(sessionDate, shift)` unique.
- `attendance_records(sessionId, employeeId)` unique.
- Active assignment lookup index on `vehicle_assignments(sessionId, vehicleId, unassignedAt)`.
- Employee assignment lookup index on `vehicle_assignments(sessionId, employeeId, unassignedAt)`.
- `audit_events(sessionId, createdAt)`.

## Reports, Errors, and Integrations

Generate official PDFs only from persisted database state. For non-immediate reports, create a background job and return report metadata; authorize every download.

Return structured errors with stable codes, safe messages, field details where applicable, and conflict state/version for concurrent edits.

Other Python applications may call this API or run approved background workers. They must not directly update attendance-session collections or copy capacity/finalization logic.

Future payroll, QR attendance, face recognition, shift management, and reporting modules integrate through this API and its domain layer without requiring a schema redesign.
