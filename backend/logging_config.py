"""Structured JSON logging for Cloud Logging / Datadog / ELK.

Replaces the default text logger with JSON-formatted output
that can be parsed by cloud logging platforms.
"""
import logging
import json
import sys
import uuid
from contextvars import ContextVar
from datetime import datetime, timezone

# Thread-safe request ID for correlating logs
request_id_var: ContextVar[str] = ContextVar("request_id", default="")


def get_request_id() -> str:
    """Get the current request ID, generating one if not set."""
    rid = request_id_var.get()
    if not rid:
        rid = str(uuid.uuid4())[:8]
        request_id_var.set(rid)
    return rid


class StructuredFormatter(logging.Formatter):
    """JSON formatter for structured cloud logging."""

    def format(self, record):
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        # Include request ID for correlation
        rid = request_id_var.get()
        if rid:
            log_entry["request_id"] = rid
        if record.exc_info and record.exc_info[1]:
            log_entry["exception"] = str(record.exc_info[1])
        if hasattr(record, "extra_fields"):
            log_entry.update(record.extra_fields)
        return json.dumps(log_entry, default=str)


def setup_logging(level: int = logging.INFO):
    """Configure root logger with structured JSON output.

    Call once at application startup.
    """
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(StructuredFormatter())
    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(level)

    # Quiet down noisy libraries
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("motor").setLevel(logging.WARNING)
    logging.getLogger("asyncio").setLevel(logging.WARNING)

    return root
