"""
Shared observability utilities for request tracking and logging.
Avoids circular imports between main and middlewares.
"""

import logging
from contextvars import ContextVar

# ── Global Request Correlation Context ──
# "system" is the default for logs outside of a request context (startup/shutdown)
request_id_ctx: ContextVar[str] = ContextVar("request_id", default="system")

class ContextFilter(logging.Filter):
    """Injects the current request_id from context into every log record."""
    def filter(self, record):
        record.request_id = request_id_ctx.get()
        return True
