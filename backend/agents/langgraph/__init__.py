"""LangGraph durable runtime primitives for PRAXIS agents."""

from datetime import UTC, datetime
from typing import Any

from agents.checkpointer import close_checkpointer, get_checkpointer


def health_check() -> dict[str, Any]:
    checkpointer = get_checkpointer()
    return {
        "ok": checkpointer is not None,
        "checkpointer": {
            "backend": type(checkpointer).__name__ if checkpointer is not None else "uninitialized",
            "schemaSetup": bool(getattr(checkpointer, "ready", checkpointer is not None)),
            "lastCheckedAt": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        },
    }


__all__ = ["close_checkpointer", "get_checkpointer", "health_check"]
