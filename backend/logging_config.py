"""Structured JSON logging for Cloud Run / Cloud Logging.

Emits one JSON object per log record with the fields Cloud Logging auto-parses
(`severity`, `message`, `timestamp`, `logging.googleapis.com/trace`, etc.).

Usage:
    from logging_config import configure_logging
    configure_logging()  # call once at process start, before any logger is used
"""
from __future__ import annotations

import json
import logging
import os
import sys
import time
from typing import Any


# Python logging levels → Google Cloud Logging severity
_SEVERITY_MAP = {
    logging.DEBUG: "DEBUG",
    logging.INFO: "INFO",
    logging.WARNING: "WARNING",
    logging.ERROR: "ERROR",
    logging.CRITICAL: "CRITICAL",
}

# Fields we never want to echo back (stdlib LogRecord internals)
_RESERVED = {
    "args", "asctime", "created", "exc_info", "exc_text", "filename",
    "funcName", "levelname", "levelno", "lineno", "message", "module",
    "msecs", "msg", "name", "pathname", "process", "processName",
    "relativeCreated", "stack_info", "thread", "threadName",
}


class CloudLoggingJsonFormatter(logging.Formatter):
    """Emit each record as a single JSON line keyed for Cloud Logging."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "severity": _SEVERITY_MAP.get(record.levelno, "DEFAULT"),
            "message": record.getMessage(),
            "timestamp": {
                "seconds": int(record.created),
                "nanos": int((record.created - int(record.created)) * 1e9),
            },
            "logger": record.name,
            "logging.googleapis.com/sourceLocation": {
                "file": record.pathname,
                "line": str(record.lineno),
                "function": record.funcName,
            },
        }

        # Surface any structured extras attached via `logger.info(..., extra={...})`
        for key, value in record.__dict__.items():
            if key in _RESERVED or key.startswith("_"):
                continue
            if key in payload:
                continue
            try:
                json.dumps(value)  # serialisable?
                payload[key] = value
            except TypeError:
                payload[key] = repr(value)

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        # Trace correlation: if the request handler attached a Cloud Trace header,
        # propagate it so Cloud Logging links the log to the trace.
        trace = getattr(record, "trace", None)
        if trace:
            payload["logging.googleapis.com/trace"] = trace

        return json.dumps(payload, ensure_ascii=False, default=str)


def configure_logging(level: str | None = None) -> None:
    """Install the JSON formatter on the root logger.

    Idempotent — safe to call multiple times (e.g. in tests).
    Set LOG_LEVEL=DEBUG/INFO/WARNING/ERROR via env to override.
    """
    lvl_name = (level or os.environ.get("LOG_LEVEL") or "INFO").upper()
    lvl = getattr(logging, lvl_name, logging.INFO)

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(CloudLoggingJsonFormatter())
    handler.setLevel(lvl)

    root = logging.getLogger()
    # Clear prior handlers so we don't double-emit when reloaded (uvicorn dev)
    for h in list(root.handlers):
        root.removeHandler(h)
    root.addHandler(handler)
    root.setLevel(lvl)

    # Uvicorn installs its own handlers — silence them so we don't double-emit.
    for noisy in ("uvicorn", "uvicorn.access", "uvicorn.error"):
        lg = logging.getLogger(noisy)
        lg.handlers.clear()
        lg.propagate = True

    logging.getLogger("praxis").info(
        "structured logging configured",
        extra={"log_level": lvl_name, "boot_epoch": int(time.time())},
    )
