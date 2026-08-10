from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from app.db.mongodb import db
import uvicorn
from contextlib import asynccontextmanager
from app.api.v1.auth import router as auth_router
from app.api.v1.employees.routes import router as employees
from app.api.v1.vehicles.routes import router as vehicles
from app.api.v1.sessions.routes import router as sessions
from app.api.v1.attendance.routes import router as attendance
from app.api.v1.assignments.routes import router as assignments

@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect()
    yield
    await db.close()

app = FastAPI(
    title="Laxmi Enterprise API",
    description="Centralized Attendance and Vehicle Management Service",
    version="2.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Error Handlers
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal Server Error", "message": str(exc)},
    )

# Routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(employees, prefix="/api/v1/employees", tags=["Employees"])
app.include_router(vehicles, prefix="/api/v1/vehicles", tags=["Vehicles"])
app.include_router(sessions, prefix="/api/v1/sessions", tags=["Sessions"])
app.include_router(attendance, prefix="/api/v1/attendance", tags=["Attendance"])
app.include_router(assignments, prefix="/api/v1/assignments", tags=["Assignments"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "database": settings.MONGODB_DATABASE}

@app.get("/ready")
async def readiness_check():
    return {"status": "ready"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
