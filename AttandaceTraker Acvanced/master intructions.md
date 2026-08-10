\# ATTENDANCE SYSTEM - MASTER DEVELOPMENT INSTRUCTIONS



\*\*Project Name:\*\* Local Workforce Attendance System (LWAS)



\*\*Version:\*\* 0.1 (Prototype)



\---



\# 1. Project Objective



Develop a completely self-hosted attendance system for approximately \*\*120–150 workers\*\*, primarily consisting of daily wage labourers.



The system must:



\* Run entirely on a local network.

\* Have zero mandatory monthly subscription costs.

\* Expose open APIs for future integration.

\* Be modular.

\* Allow replacement of hardware without major software changes.

\* Keep complete ownership of all data.



This project is intended to become the foundation for future modules such as payroll, visitor management, contractor management, and workforce analytics.



\---



\# 2. Development Philosophy



The project shall follow these principles:



1\. Software First

2\. Hardware Agnostic

3\. Event Driven

4\. Modular

5\. Offline First

6\. API First

7\. Audit Everything

8\. Replaceable Components



No business logic shall depend on any specific hardware vendor.



\---



\# 3. Initial Hardware Assumptions



Prototype hardware:



\* Windows PC

\* USB QR Scanner

\* QR Worker ID Cards

\* Turnstile

\* Turnstile Rotation Sensor

\* Thermal Token Printer

\* Supervisor QR Scanner



Future hardware:



\* NFC

\* RFID

\* Face Recognition

\* Fingerprint

\* Mobile Devices



Future hardware shall require no modification to business logic.



\---



\# 4. Core Workflow



Worker arrives



↓



Scan Worker QR ID



↓



Authentication



↓



Turnstile Unlock



↓



Worker Rotates Turnstile



↓



Entry Session Created



↓



Random Token Generated



↓



QR Token Printed



↓



Worker Proceeds To Supervisor



↓



Supervisor Scans Token



↓



Worker Details Displayed



↓



Supervisor Approves



↓



Attendance Created



\---



\# 5. System Architecture



The system shall be divided into independent services.



Initial services:



\* Authentication Service

\* Turnstile Service

\* Entry Session Service

\* QR Token Service

\* Supervisor Verification Service

\* Attendance Service

\* Audit Service



No service shall directly manipulate another service's internal data.



Communication shall occur only through defined APIs or events.



\---



\# 6. Event Driven Architecture



Every action generates an event.



Examples:



authentication.success



authentication.failed



turnstile.unlocked



turnstile.rotated



entry.created



token.generated



token.printed



token.scanned



verification.approved



verification.rejected



attendance.created



attendance.updated



attendance.cancelled



Every event must contain:



\* UUID

\* Timestamp (UTC)

\* Source Service

\* Event Type

\* Payload



\---



\# 7. State Machine



Worker Authentication



↓



Turnstile Authorization



↓



Turnstile Rotation



↓



Entry Session



↓



Token Generation



↓



Waiting Verification



↓



Approved



↓



Attendance Created



Every transition must be logged.



\---



\# 8. Worker Identity



Every worker has:



WorkerID



Name



Photo



Contractor



Department



Daily Wage



Credential



Status



Credentials are replaceable.



Initially:



QR



Future:



NFC



RFID



Face



Fingerprint



No business logic shall depend on credential type.



\---



\# 9. Entry Session



Entry Session represents a single physical entry.



Fields:



EntrySessionID



WorkerID



GateID



CreatedAt



Status



TokenID



SupervisorID



VerifiedAt



Remarks



Entry Sessions never change identity.



\---



\# 10. Token Rules



Token is NOT identity.



Token represents:



One Physical Entry.



Properties:



\* Random UUID

\* Single Use

\* Database Generated

\* Time Limited

\* Linked to Entry Session



QR contains only TokenID.



No worker information shall be stored inside the QR.



\---



\# 11. Supervisor Responsibilities



Supervisor application shall ONLY:



Scan Token



Display Worker



Display Photo



Approve



Reject



Supervisor shall NOT:



Authenticate Worker



Unlock Turnstile



Generate Tokens



Modify Worker Information



\---



\# 12. Attendance Rules



Attendance is created ONLY when:



Authentication Successful



AND



Turnstile Rotated



AND



Supervisor Approved



Otherwise:



No attendance exists.



\---



\# 13. Security Principles



Every request:



Timestamped



UUID



Authenticated



Audited



No silent failures.



No hidden updates.



No deleted logs.



\---



\# 14. Audit Logging



Every operation shall be permanently logged.



Example:



Worker Authenticated



Turnstile Opened



Turnstile Rotated



Entry Session Created



Token Generated



Token Printed



Supervisor Approved



Attendance Created



Audit records are immutable.



\---



\# 15. Database Philosophy



Each service owns its own tables.



No direct cross-service updates.



Future services communicate only through APIs/events.



\---



\# 16. API Philosophy



Every service exposes:



GET



POST



Health Check



Status



Version



No internal implementation details are exposed.



\---



\# 17. Coding Standards



\* Python 3.13+

\* FastAPI

\* PostgreSQL

\* SQLAlchemy

\* Pydantic

\* React + TypeScript

\* Docker

\* Alembic for migrations

\* Pytest for testing



All services shall expose OpenAPI documentation.



\---



\# 18. Error Handling



Every failure must return:



Status



Reason



Error Code



Timestamp



Correlation ID



Errors shall never be silently ignored.



\---



\# 19. Future Expansion



The architecture shall support adding:



\* NFC Authentication

\* Face Recognition

\* Fingerprint Authentication

\* Visitor Management

\* Contractor Portal

\* Payroll

\* Shift Management

\* Leave Management

\* Mobile Applications

\* Analytics

\* AI Insights



without redesigning the core architecture.



\---



\# 20. Development Roadmap



Phase 1



✓ Communication Protocol



✓ Database Schema



✓ Authentication Service



✓ Turnstile Service



✓ Entry Session Service



✓ QR Token Service



✓ Supervisor Service



✓ Attendance Service



✓ Audit Logging



Phase 2



\* Dashboard

\* Reports

\* Payroll Integration

\* Analytics



Phase 3



\* NFC

\* Face Recognition

\* Mobile App

\* Visitor Module



\---



\# 21. Rule for All Future Development



Before implementing any feature, verify:



1\. Does it violate modularity?

2\. Does it introduce vendor lock-in?

3\. Can it be replaced later?

4\. Does it expose an API?

5\. Is it fully auditable?

6\. Can it be tested independently?



If the answer to any is "No", redesign the feature before implementation.



