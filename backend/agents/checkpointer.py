"""Shared LangGraph checkpointer factory for Phase 2 flows."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from psycopg_pool import AsyncConnectionPool

_pool: AsyncConnectionPool | None = None
_saver: Any | None = None


@dataclass
class NoopAsyncSaver:
    """Small test/local fallback when LangGraph is not installed."""

    writes: list[dict[str, Any]] = field(default_factory=list)
    ready: bool = False

    async def setup(self) -> None:
        self.ready = True

    async def aput(self, config: dict[str, Any], checkpoint: dict[str, Any], metadata: dict[str, Any], new_versions: dict[str, Any]) -> dict[str, Any]:
        self.writes.append({
            "config": config,
            "checkpoint": checkpoint,
            "metadata": metadata,
            "new_versions": new_versions,
        })
        return config


async def init_checkpointer(conn_str: str | None) -> Any:
    """Initialize and return the process-wide async checkpointer.

    A real Postgres saver is used when LangGraph is installed and ``conn_str`` is
    a Postgres URL. Tests can pass ``memory://`` to force the deterministic
    fallback.
    """
    global _pool, _saver

    if _saver is not None:
        return _saver

    if not conn_str:
        raise RuntimeError("DATABASE_URL is required for Phase 2 LangGraph checkpointing")

    if conn_str.startswith("memory://"):
        _saver = NoopAsyncSaver()
        await _saver.setup()
        return _saver

    try:
        from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
    except ModuleNotFoundError:
        _saver = NoopAsyncSaver()
        await _saver.setup()
        return _saver

    _pool = AsyncConnectionPool(
        conninfo=conn_str,
        min_size=1,
        max_size=8,
        open=True,
        kwargs={"autocommit": True, "prepare_threshold": 0},
    )
    _saver = AsyncPostgresSaver(_pool)
    await _saver.setup()
    return _saver


def get_checkpointer() -> Any | None:
    return _saver


async def close_checkpointer() -> None:
    global _pool, _saver
    if _pool is not None:
        await _pool.close()
    _pool = None
    _saver = None
