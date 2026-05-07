"""Async Postgres access for PRAXIS Phase 1.

All tenant-owned SQL work must enter through ``tenant_session`` so RLS policies
can rely on the ``app.tenant_id`` transaction setting.
"""
from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any, AsyncIterator

from psycopg import AsyncConnection
from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool

from config import get_settings
from services.metrics import increment_counter, record_tenant_session_reset


class TenantConnection:
    """Small compatibility wrapper with asyncpg-style helpers used by tests."""

    def __init__(self, conn: AsyncConnection) -> None:
        self._conn = conn

    async def execute(self, query: str, *params: Any) -> Any:
        async with self._conn.cursor() as cur:
            await cur.execute(query, params)
            return cur.statusmessage

    async def fetch(self, query: str, *params: Any) -> list[dict[str, Any]]:
        async with self._conn.cursor(row_factory=dict_row) as cur:
            await cur.execute(query, params)
            rows = await cur.fetchall()
            return [dict(row) for row in rows]

    async def fetchval(self, query: str, *params: Any) -> Any:
        async with self._conn.cursor() as cur:
            await cur.execute(query, params)
            row = await cur.fetchone()
            return row[0] if row else None

    @property
    def raw(self) -> AsyncConnection:
        return self._conn


def _conninfo() -> str:
    settings = get_settings()
    if settings.database_url:
        return settings.database_url
    return (
        f"postgresql://{settings.langgraph_db_user}:{settings.langgraph_db_password}"
        f"@{settings.pgbouncer_host}:{settings.pgbouncer_port}/{settings.langgraph_db_name}"
    )


pool: AsyncConnectionPool = AsyncConnectionPool(
    conninfo=_conninfo(),
    min_size=0,
    max_size=10,
    open=False,
    kwargs={"prepare_threshold": None},
)


async def open_pool() -> None:
    await pool.open(wait=True)


async def close_pool() -> None:
    await pool.close()


@asynccontextmanager
async def tenant_session(uid: str) -> AsyncIterator[TenantConnection]:
    if not uid:
        raise ValueError("tenant_session requires a non-empty uid")
    if pool.closed:
        await open_pool()
    increment_counter("tenant_session_starts_total")
    async with pool.connection() as conn:
        async with conn.transaction():
            async with conn.cursor() as cur:
                await cur.execute("SELECT set_config('app.tenant_id', %s, true)", (uid,))
            try:
                yield TenantConnection(conn)
            finally:
                record_tenant_session_reset()


async def verify_extensions() -> None:
    expected = {"vector", "pg_trgm", "pgcrypto"}
    if pool.closed:
        await open_pool()
    async with pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT extname FROM pg_extension WHERE extname = ANY(%s)",
                (list(expected),),
            )
            found = {row[0] for row in await cur.fetchall()}
    missing = expected - found
    if missing:
        raise RuntimeError(f"Missing required Postgres extensions: {', '.join(sorted(missing))}")
