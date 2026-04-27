"""Postgres checkpoint store for PRAXIS LangGraph workflows."""
from __future__ import annotations

import logging
from datetime import UTC, datetime
from threading import Lock
from typing import Any
from urllib.parse import quote_plus

from config import get_settings

logger = logging.getLogger("praxis")

_lock = Lock()
_pool: Any | None = None
_checkpointer: Any | None = None
_setup_complete = False


def _resolve_password() -> str:
    settings = get_settings()
    if settings.langgraph_db_password:
        password = settings.langgraph_db_password.strip()
        if not password:
            raise RuntimeError("LANGGRAPH_DB_PASSWORD is set but empty after trimming")
        return password

    try:
        from google.cloud import secretmanager
    except ImportError as exc:
        raise RuntimeError(
            "LANGGRAPH_DB_PASSWORD is unset and google-cloud-secret-manager is not installed"
        ) from exc

    if not settings.gcp_project_id:
        raise RuntimeError("GCP_PROJECT_ID is required to resolve LANGGRAPH_DB_PASSWORD_SECRET")

    secret_name = (
        f"projects/{settings.gcp_project_id}/secrets/"
        f"{settings.langgraph_db_password_secret}/versions/latest"
    )
    client = secretmanager.SecretManagerServiceClient()
    response = client.access_secret_version(request={"name": secret_name})
    password = response.payload.data.decode("utf-8").strip()
    if not password:
        raise RuntimeError(f"Secret {settings.langgraph_db_password_secret} is empty")
    return password


def _conninfo() -> str:
    settings = get_settings()
    password = quote_plus(_resolve_password())
    user = quote_plus(settings.langgraph_db_user)
    host = settings.langgraph_db_host
    db_name = quote_plus(settings.langgraph_db_name)
    return (
        f"postgresql://{user}:{password}@{host}:{settings.langgraph_db_port}/{db_name}"
        "?sslmode=disable"
    )


def get_checkpointer():
    """Return a process-wide PostgresSaver, creating checkpoint tables once.

    LangGraph's Postgres saver requires psycopg3 connections with autocommit
    and dict rows when callers provide their own pool.
    """
    global _pool, _checkpointer, _setup_complete

    if _checkpointer is not None:
        return _checkpointer

    with _lock:
        if _checkpointer is not None:
            return _checkpointer

        from langgraph.checkpoint.postgres import PostgresSaver
        from psycopg.rows import dict_row
        from psycopg_pool import ConnectionPool

        _pool = ConnectionPool(
            conninfo=_conninfo(),
            min_size=1,
            max_size=4,
            kwargs={"autocommit": True, "row_factory": dict_row},
        )
        _checkpointer = PostgresSaver(_pool)
        _checkpointer.setup()
        _setup_complete = True
        return _checkpointer


def close_checkpointer() -> None:
    """Close the process-wide checkpointer pool during app shutdown/tests."""
    global _pool, _checkpointer, _setup_complete

    with _lock:
        if _pool is not None:
            _pool.close()
        _pool = None
        _checkpointer = None
        _setup_complete = False


def health_check() -> dict[str, Any]:
    """Verify checkpoint database reachability and report health metadata."""
    settings = get_settings()
    checkpointer = get_checkpointer()

    # A lightweight list call exercises the pool without creating a checkpoint.
    list(checkpointer.list({"configurable": {"thread_id": "__praxis_health__"}}, limit=1))

    return {
        "ok": True,
        "checkpointer": {
            "backend": settings.langgraph_checkpoint_backend,
            "host": settings.langgraph_db_host,
            "database": settings.langgraph_db_name,
            "schemaSetup": _setup_complete,
            "lastCheckedAt": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        },
    }
