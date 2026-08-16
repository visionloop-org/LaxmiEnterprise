# Attendance & Workforce Management System
# Server-Side Instructions

**Version:** 3.0  
**Last Updated:** August 16, 2026

---

## 1. Objective

Provide the central, versioned FastAPI REST API at `/api/v1` for multiple independently deployed web (Supervisor, Admin), Python automation, mobile, and reporting clients.

Persist authoritative workforce attendance data, manage vehicle assignments and capacity limits, track trip and delivery lifecycles, maintain an immutable audit trail in MongoDB, and execute all mutations within ACID transactions.

---

## 2. Technology Stack

- **Framework**: Python 3.11+ and FastAPI 0.115+
- **Database**: MongoDB Atlas or local MongoDB replica set
- **Async Driver**: Motor / PyMongo behind a clean repository and service layer
- **Authentication**: JWT tokens with role-based authorization (`admin`, `supervisor`)
- **Validation**: Pydantic v2 schemas with explicit Create, Update, and Response models
- **Testing**: Pytest test suite with pytest-asyncio and httpx TestClient
- **Documentation**: OpenAPI 3.1 spec auto-exported to `openapi.json` for frontend type sync

---

## 3. Architecture Layers

Keep routes thin and strictly separated:
- **Routes / Controllers (`app/api/v1/`)**: Request validation, auth dependency injection, HTTP status codes.
- **Services / Use Cases (`app/services/`)**: Trip lifecycle progression, attendance recording, vehicle assignments, finalization, unlocking.
- **Domain Rules**: Pure capacity calculation (1 Driver, 1 Chalan Man, 6 Workers, 8 Max), attendance status transitions, trip state machines.
- **Database / Repositories (`app/db/`)**: Motor client, database collections, and index setup.
- **Core / Middleware (`app/core/`)**: Logging, exception handling, CORS middleware, JWT utility.

---

## 4. Collections & Schemas

### `employees`
- Fields: `employeeId`, `name`, `category` (Workers, Drivers, Chalan Men, Extra Labour, Office), `photoPath`, `displayOrder`, `status` (`active`, `pending_approval`, `rejected`), `contractor`, `remarks`, `baseRate`, `createdAt`, `updatedAt`.

### `vehicles`
- Fields: `vehicleNumber`, `vehicleType`, `status` (`available`, `in_use`, `maintenance`), `active`, `createdAt`, `updatedAt`.

### `attendance_sessions`
- Fields: `sessionDate`, `shift`, `status` (`in_progress`, `finalized`), `supervisorId`, `version`, `finalizedAt`, `finalizedBy`, `unlockedAt`, `unlockedBy`, `createdAt`, `updatedAt`.

### `attendance_records`
- Fields: `sessionId`, `employeeId`, `status` (`on_time`, `arrived`, `absent`), `arrivalTime`, `recordedBy`, `recordedAt`, `remarks`, `version`.

### `vehicle_assignments`
- Fields: `sessionId`, `employeeId`, `vehicleId`, `assignedAt`, `assignedBy`, `unassignedAt`, `unassignedBy`.

### `vehicle_trips`
- Fields: `sessionId`, `vehicleId`, `vehicleNumber`, `driverEmployeeId`, `driverName`, `destinationLocation`, `productDetails`, `status` (`dispatched`, `reached_location`, `delivered`, `returned`), `dispatchedAt`, `dispatchedBy`, `reachedLocationAt`, `deliveredAt`, `returnedAt`, `timeline` (Array of `TripTimelineEvent`), `remarks`, `createdAt`, `updatedAt`.

### `audit_events`
- Fields: `sessionId`, `actorId`, `action`, `entityType`, `entityId`, `previousValue`, `newValue`, `createdAt`.

### `users`
- Fields: `username`, `email`, `role` (`admin`, `supervisor`), `hashed_password`, `isActive`, `createdAt`.

---

## 5. Required Endpoints (`/api/v1`)

### Authentication
- `POST /api/v1/auth/login` — Authenticate and issue JWT token.
- `GET /api/v1/auth/me` — Return current authenticated user profile.

### Sessions
- `GET /api/v1/sessions` — List sessions with date and status filters.
- `POST /api/v1/sessions` — Create a new session.
- `GET /api/v1/sessions/{id}` — Retrieve full session details with attendance and assignments.
- `POST /api/v1/sessions/{id}/finalize` — Idempotently finalize and lock session.
- `POST /api/v1/sessions/{id}/unlock` — (Admin only) Reset finalized session to in-progress with audit log.

### Attendance
- `PUT /api/v1/sessions/{id}/attendance/{employeeId}` — Record attendance (`on_time`, `arrived`, `absent`).

### Vehicle Assignments
- `PUT /api/v1/sessions/{id}/assignments/{employeeId}` — Assign present employee to vehicle with capacity validation.
- `DELETE /api/v1/sessions/{id}/assignments/{employeeId}` — Unassign employee from vehicle.

### Vehicle Trips & Task Completion
- `POST /api/v1/trips` — Dispatch vehicle trip with destination, driver, and product details.
- `GET /api/v1/trips` — List trips filtered by `session_id`, `vehicle_id`, or `status`.
- `GET /api/v1/trips/{trip_id}` — Get trip details with complete timeline events.
- `PUT /api/v1/trips/{trip_id}/status` — Progress trip status (`reached_location`, `delivered`, `returned`).

### Employees & Approvals
- `GET /api/v1/employees` — List employees with status and category filtering.
- `POST /api/v1/employees` — Create new employee or submit extra labour request.
- `GET|PUT /api/v1/employees/{id}` — Get or update employee details.
- `DELETE /api/v1/employees/{id}` — (Admin only) Delete employee.
- `POST /api/v1/employees/{id}/approve` — (Admin only) Approve pending employee request.
- `POST /api/v1/employees/{id}/reject` — (Admin only) Reject pending employee request.

### Vehicles
- `GET /api/v1/vehicles` — List vehicles with utilization and capacity details.
- `PATCH /api/v1/vehicles/{id}` — Update vehicle status (`available`, `in_use`, `maintenance`) or active flag.

---

## 6. Business Rules & Consistency

1. **Capacity Limits**: Maximum 1 Driver, 1 Chalan Man, 6 Workers / Extra Labour, and 8 total employees per vehicle. Enforced on the server during the mutation.
2. **Present Employees Only**: Vehicle assignment requires the employee to have recorded attendance (`on_time` or `arrived`).
3. **Trip Task Completion Lifecycle**:
   - `dispatched` → `reached_location` → `delivered` → `returned`
   - Each transition appends an entry to the trip's `timeline` and updates milestone timestamps.
4. **Optimistic Concurrency**: Any session or attendance mutation checks `version`. Return HTTP `409 Conflict` on version mismatch.
5. **Transactions**: All multi-document operations (attendance + audit, assignment + audit, session finalization/unlock) run inside MongoDB transactions.
