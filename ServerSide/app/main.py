from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from core.config import settings
from app.db.mongodb import db
import uvicorn
import logging
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from pymongo.errors import PyMongoError

from app.core.exceptions import AppException
from app.core.middleware import RequestIDMiddleware, get_request_id
from app.core.logging_config import setup_logging, logger

from app.api.v1.auth import router as auth_router
from app.api.v1.employees.routes import router as employees
from app.api.v1.vehicles.routes import router as vehicles
from app.api.v1.sessions.routes import router as sessions
from app.api.v1.attendance.routes import router as attendance
from app.api.v1.assignments.routes import router as assignments
from app.api.v1.pay.routes import router as pay_router
from app.api.v1.trips.routes import router as trips_router

# Initialize structured logging

setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Laxmi Enterprise API server...")
    await db.connect()
    yield
    await db.close()
    logger.info("Server shutdown complete.")

app = FastAPI(
    title="Laxmi Enterprise API",
    description="Centralized Attendance and Vehicle Management Service",
    version="2.0",
    lifespan=lifespan
)

# Custom Middleware
app.add_middleware(RequestIDMiddleware)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://192.168.1.8:5173",
        "http://192.168.1.8:5174",
        "http://192.168.1.8:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def build_error_response(
    status_code: int,
    code: str,
    message: str,
    path: str,
    details: any = None
) -> JSONResponse:
    request_id = get_request_id()
    error_payload = {
        "code": code,
        "message": message,
        "details": details,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "path": path,
        "requestId": request_id,
    }
    return JSONResponse(
        status_code=status_code,
        content={
            "detail": message,
            "error": error_payload
        }
    )

# Exception Handlers
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    logger.warning(f"AppException [{exc.code}] on {request.url.path}: {exc.message}")
    return build_error_response(
        status_code=exc.status_code,
        code=exc.code,
        message=exc.message,
        path=request.url.path,
        details=exc.details
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    logger.warning(f"HTTPException [{exc.status_code}] on {request.url.path}: {exc.detail}")
    
    code = "HTTP_ERROR"
    message = str(exc.detail)
    details = None

    if isinstance(exc.detail, dict):
        code = exc.detail.get("error", "HTTP_ERROR")
        message = exc.detail.get("message", str(exc.detail))
        details = exc.detail

    if exc.status_code == 401:
        code = "UNAUTHORIZED"
    elif exc.status_code == 403:
        code = "FORBIDDEN"
    elif exc.status_code == 404:
        code = "NOT_FOUND"
    elif exc.status_code == 409:
        code = "CONFLICT"

    return build_error_response(
        status_code=exc.status_code,
        code=code,
        message=message,
        path=request.url.path,
        details=details
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"Validation error on {request.url.path}: {exc.errors()}")
    return build_error_response(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        code="VALIDATION_ERROR",
        message="Request payload validation failed",
        path=request.url.path,
        details=exc.errors()
    )

@app.exception_handler(PyMongoError)
async def pymongo_exception_handler(request: Request, exc: PyMongoError):
    logger.error(f"Database error on {request.url.path}: {exc}", exc_info=True)
    return build_error_response(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        code="DATABASE_UNAVAILABLE",
        message="Database connection unavailable. Please check if MongoDB service is running.",
        path=request.url.path,
        details=str(exc)
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url.path}: {exc}", exc_info=True)
    return build_error_response(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        code="INTERNAL_SERVER_ERROR",
        message="An unexpected server error occurred.",
        path=request.url.path,
        details=str(exc) if settings.DEBUG else None
    )

# Routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(employees, prefix="/api/v1/employees", tags=["Employees"])
app.include_router(vehicles, prefix="/api/v1/vehicles", tags=["Vehicles"])
app.include_router(sessions, prefix="/api/v1/sessions", tags=["Sessions"])
app.include_router(attendance, prefix="/api/v1/attendance", tags=["Attendance"])
app.include_router(assignments, prefix="/api/v1/assignments", tags=["Assignments"])
app.include_router(pay_router, prefix="/api/v1/pay", tags=["Pay"])
app.include_router(trips_router, prefix="/api/v1/trips", tags=["Trips"])


@app.get("/health")
async def health_check():
    return {
        "status": "healthy" if db.is_connected else "degraded",
        "database_connected": db.is_connected,
        "database": settings.MONGODB_DATABASE
    }

@app.get("/ready")
async def readiness_check():
    if not db.is_connected:
        await db.connect()
    return {
        "status": "ready" if db.is_connected else "not_ready",
        "database_connected": db.is_connected
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
