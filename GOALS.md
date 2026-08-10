# Laxmi Enterprise Goals

## Product Goal

Deliver a reliable supervisor attendance system that records daily attendance, manages vehicle assignments, and produces auditable official reports for Laxmi Enterprise.

## Architecture Goals

1. Establish the FastAPI service and MongoDB as the single source of truth.
2. Keep the supervisor UI, Python applications, mobile clients, and automation tools independent consumers of the same versioned `/api/v1` contract.
3. Keep UI rendering, workflow orchestration, API transport, business rules, and persistence as separate layers.
4. Prevent all client applications from directly writing attendance-session data to MongoDB.
5. Publish OpenAPI documentation and provide tested TypeScript and Python client integrations.

## Attendance Goals

1. Create one attendance session for each date and shift.
2. Record each employee once per session as On Time, Arrived with an arrival time, or Absent.
3. Let supervisors correct attendance only while the session is in progress.
4. Finalize sessions through the server, lock further edits, and preserve the finalized result.
5. Maintain complete audit history for attendance, assignment, unlock, and finalization actions.

## Vehicle Goals

1. Assign only present, eligible employees to active, non-maintenance vehicles.
2. Enforce capacity on the server: one Driver, one Chalan Man, six Workers/Extra Labour, and eight total employees per vehicle.
3. Support assignment, unassignment, reassignment, and clear capacity-conflict responses.
4. Provide current utilization, violations, and assignment history to every client.

## Reliability Goals

1. Use MongoDB transactions for all multi-document attendance, assignment, finalization, and audit changes.
2. Use optimistic concurrency and return `409 Conflict` for stale session updates.
3. Make finalization idempotent so duplicate requests cannot create duplicate finalization events or reports.
4. Store reports and official records from server-side persisted data only.
5. Support secure recovery from connectivity failures with an explicit offline queue, if offline mode is introduced.

## User Experience Goals

1. Optimize the supervisor interface for landscape tablets and quick daily entry.
2. Keep filters stable until changed by the user.
3. Provide inline, accessible feedback rather than blocking browser dialogs.
4. Display loading, success, validation, and conflict states clearly for every server mutation.
5. Generate downloadable attendance and vehicle reports from the finalized session.

## Delivery Milestones

### Milestone 1 — API Foundation

- Create the FastAPI project, MongoDB connection, authentication, OpenAPI documentation, and health checks.
- Implement employee, vehicle, session, and attendance read/write endpoints.

### Milestone 2 — Core Attendance

- Implement attendance recording, authorization, audit events, session locking, and finalization.
- Update the supervisor UI to load and mutate server-backed session data.

### Milestone 3 — Vehicle Assignments

- Implement transaction-safe assignment, capacity validation, unassignment, reassignment, and conflict responses.
- Replace frontend-only assignment rules with API-backed flows.

### Milestone 4 — Reports and Operations

- Add asynchronous PDF/CSV report generation, authorized downloads, monitoring, backups, and error logging.
- Add integration tests for high-risk API flows and contract tests for TypeScript and Python clients.

## Definition of Done

The system is ready for operational use when attendance and vehicle assignment data survives refreshes and concurrent use, all official changes are server-validated and audited, finalized sessions cannot be altered, reports come from persisted server data, and every supported client uses the documented API contract.
