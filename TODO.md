# Laxmi Enterprise TODO

## Completed (Aug 11, 2026)

- ✅ Created FastAPI application in `ServerSide` with environment-based configuration
- ✅ Configured MongoDB (Docker container) for development
- ✅ Added health and readiness endpoints
- ✅ Set up JWT authentication with demo user
- ✅ Defined MongoDB models for employees, vehicles, sessions, attendance records
- ✅ Published `/api/v1` OpenAPI specification
- ✅ Added API error response standards
- ✅ Implemented employee and vehicle read APIs
- ✅ Implemented session creation, loading, and active-session lookup
- ✅ Implemented server-validated attendance recording
- ✅ Recorded immutable audit events for attendance changes
- ✅ Implemented idempotent session finalization and attendance locking
- ✅ Implemented server-side vehicle assignment and unassignment endpoints
- ✅ Added domain validation for assignments
- ✅ Used MongoDB transactions for assignment updates
- ✅ Implemented assignment history and vehicle utilization endpoints
- ✅ Created monorepo structure with shared packages
- ✅ Created admin dashboard using shared packages
- ✅ Configured CORS for both applications
- ✅ Regenerated knowledge graph (784 nodes, 1238 edges, 62 communities)
- ✅ Documented understanding workflow

## Now — Foundation

- [x] Create the FastAPI application in `ServerSide` with environment-based configuration.
- [x] Configure MongoDB Atlas or a local MongoDB replica set for development.
- [x] Add health and readiness endpoints.
- [x] Set up JWT authentication, role-based authorization, and user management.
- [x] Define MongoDB models and indexes for employees, vehicles, sessions, attendance records, assignments, and audit events.
- [x] Publish the initial `/api/v1` OpenAPI specification.
- [x] Add API error response standards and session-version conflict responses.

## Next — Core Attendance API

- [x] Implement employee and vehicle read APIs.
- [x] Implement session creation, loading, and active-session lookup.
- [x] Implement server-validated attendance recording for On Time, Arrived, and Absent.
- [x] Record immutable audit events for every attendance change.
- [x] Implement idempotent session finalization and attendance locking.
- [ ] Add transaction and concurrency tests for attendance mutations.

## Next — Vehicle Assignment API

- [x] Implement server-side vehicle assignment and unassignment endpoints.
- [x] Add domain validation for eligibility, maintenance status, per-role capacity, and total capacity.
- [x] Use MongoDB transactions for assignment and audit-event updates.
- [x] Return structured capacity conflict responses with current vehicle state.
- [x] Implement assignment history and vehicle utilization endpoints.
- [ ] Add tests for single assignment, reassignment, unassignment, concurrent edits, and finalization locks.

## Frontend Migration

- [x] Add a versioned API client to the supervisor web application.
- [x] Replace generated employee and vehicle data with server-loaded session data.
- [x] Replace `localStorage` attendance persistence with API-backed mutations.
- [x] Move direct component state mutations into attendance and vehicle workflow hooks.
- [ ] Remove browser `alert()` and `confirm()` usage; display inline validation and conflict feedback.
- [ ] Implement the Arrived time-selection and confirmation flow.
- [ ] Disable editable controls only after server-confirmed finalization.
- [ ] Add loading, retry, offline, and `409 Conflict` recovery states.

## Reports and Jobs

- [ ] Add Redis and a Python background-job worker.
- [ ] Implement server-side PDF generation from finalized persisted sessions.
- [ ] Implement server-side CSV export with correct field escaping.
- [ ] Add report job status and authorized download endpoints.
- [ ] Store report metadata, access controls, and generation audit events.

## Client Integration

- [ ] Generate or contract-test the TypeScript API client for the supervisor app.
- [ ] Generate or contract-test a Python API client for other applications.
- [ ] Document authentication, pagination, filtering, error codes, and versioning.
- [ ] Add optional realtime session updates with WebSockets or Server-Sent Events.
- [ ] Confirm every external application uses the API rather than direct MongoDB access.

## Quality and Operations

- [ ] Add unit tests for domain rules and application use cases.
- [ ] Add API integration tests against a MongoDB replica set.
- [ ] Add frontend component tests with mocked APIs.
- [ ] Add end-to-end tests for attendance, assignment, conflict, finalization, and report flows.
- [ ] Set up structured logs, error monitoring, backups, and access review.
- [ ] Add deployment configuration for development, staging, and production.
- [ ] Refresh the project dependency graph after major architecture changes.



tak completion like reached location deliverd the prodict etc