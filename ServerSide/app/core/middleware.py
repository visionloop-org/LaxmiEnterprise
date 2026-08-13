import uuid
import contextvars
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request

REQUEST_ID_CTX_KEY = "request_id"
_request_id_ctx_var: contextvars.ContextVar[str] = contextvars.ContextVar(REQUEST_ID_CTX_KEY, default="")

def get_request_id() -> str:
    return _request_id_ctx_var.get()

class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        _request_id_ctx_var.set(request_id)
        request.state.request_id = request_id
        
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response
