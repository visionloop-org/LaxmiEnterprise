import logging
import sys
from app.core.middleware import get_request_id

class RequestIDFilter(logging.Filter):
    def filter(self, record):
        record.request_id = get_request_id() or "N/A"
        return True

def setup_logging():
    log_format = "%(asctime)s [%(levelname)s] [req_id:%(request_id)s] %(name)s: %(message)s"
    formatter = logging.Formatter(log_format)

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    req_filter = RequestIDFilter()
    handler.addFilter(req_filter)

    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    # Avoid duplicate handlers on re-initialization
    root_logger.handlers.clear()
    root_logger.addHandler(handler)

logger = logging.getLogger("app")
