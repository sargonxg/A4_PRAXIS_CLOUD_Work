import pytest

from config import get_settings
from services.postgres import tenant_session, verify_extensions


pytestmark = pytest.mark.skipif(
    not get_settings().database_url,
    reason="Phase 1 Postgres smoke tests require DATABASE_URL",
)


@pytest.mark.asyncio
async def test_extensions_installed():
    await verify_extensions()


@pytest.mark.asyncio
async def test_tenant_session_isolation():
    async with tenant_session("user_a") as conn:
        result = await conn.fetchval("SELECT current_setting('app.tenant_id')")
        assert result == "user_a"
    async with tenant_session("user_b") as conn:
        result = await conn.fetchval("SELECT current_setting('app.tenant_id')")
        assert result == "user_b"


@pytest.mark.asyncio
async def test_pool_recycles_connections():
    for _ in range(50):
        async with tenant_session("test") as conn:
            assert await conn.fetchval("SELECT 1") == 1
