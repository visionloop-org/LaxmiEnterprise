# Laxmi Enterprise
# Master Workspace Instructions

Version: 2.0

## Purpose

This document governs the active attendance projects in this workspace:

1. `apps/supervisor` — supervisor-facing web application.
2. `ServerSide` — central FastAPI and MongoDB service.

Each project has its own instruction document. This file defines their boundaries.

## Source of Truth

The FastAPI service and MongoDB are the single source of truth for employees, sessions, attendance, vehicle assignments, finalization, audits, and official reports.

Frontend applications are responsible only for rendering server data, collecting intent, calling APIs, and displaying results. They must never directly access MongoDB, duplicate business rules, or treat browser storage as final data.

## Multi-App Integration

React, Python, mobile, automation, and reporting applications all integrate through the documented, versioned REST API under `/api/v1`.

The FastAPI service owns all attendance writes. Other applications may use API endpoints, approved background jobs, or documented events; they must not bypass server validation with direct MongoDB writes.

The backend publishes an OpenAPI contract. Consumers should generate or contract-test clients for their language, including TypeScript and Python. Optional WebSocket or Server-Sent Event updates may notify clients, but REST remains authoritative for mutations.

## Responsibilities

### Supervisor Web Application

- Display, search, filter, and collect attendance input.
- Call backend APIs and render server validation errors.
- Maintain temporary UI state only.

It must not calculate capacity rules, finalize locally, generate official reports, access MongoDB, or rely on client-only persistence for attendance data.

### Server Side

- Authenticate and authorize users.
- Validate attendance, assignments, capacities, and session transitions.
- Persist data in MongoDB and write audit events.
- Finalize sessions and generate official reports.
- Provide stable, versioned APIs and background jobs.

It must not contain frontend-specific UI behavior or depend on a particular client framework.

## Required Flow

`Client intent → REST API → server validation → MongoDB transaction → audit event → response → optional realtime notification`

Finalization and report generation originate from persisted server data, never from browser state.

## Error and Versioning Policy

Server validation errors return a stable error code, a safe user-facing message, and current version/state where required. Clients only display or recover from those errors.

When an API changes:

1. Update backend instructions and OpenAPI documentation.
2. Update all affected client instructions and generated clients.
3. Preserve backward compatibility or release a new API version.
4. Increment these workspace instructions when the architecture changes.

## Guiding Principle

Keep clients loosely coupled and server rules centralized. Every future module builds on the same audited MongoDB-backed attendance foundation.
