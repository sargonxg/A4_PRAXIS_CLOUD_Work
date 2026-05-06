"""LangSmith configuration shim.

Production observability is controlled by environment variables. This module
keeps local/test imports no-op when LangSmith is absent or disabled.
"""
from __future__ import annotations

import os


def langsmith_enabled() -> bool:
    return os.getenv("LANGSMITH_TRACING", "").lower() in {"1", "true", "yes"}
