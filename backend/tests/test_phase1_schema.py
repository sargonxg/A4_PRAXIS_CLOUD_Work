import pytest

from services.postgres import tenant_session


ZERO_VECTOR = "[" + ",".join(["0"] * 768) + "]"


@pytest.mark.asyncio
async def test_rls_blocks_cross_tenant():
    async with tenant_session("alice") as conn:
        await conn.execute(
            "INSERT INTO embeddings (tenant_id, subject_type, subject_id, content, embedding, model) "
            "VALUES (%s, %s, %s, %s, %s::vector, %s)",
            "alice",
            "doc_chunk",
            "d1",
            "x",
            ZERO_VECTOR,
            "gemini-embedding-2-preview",
        )
    async with tenant_session("mallory") as conn:
        rows = await conn.fetch("SELECT * FROM embeddings WHERE subject_id = %s", "d1")
        assert len(rows) == 0


@pytest.mark.asyncio
async def test_audit_log_insert_only():
    async with tenant_session("alice") as conn:
        await conn.execute(
            "INSERT INTO audit_log (tenant_id, actor_uid, actor_kind, action, this_hash) "
            "VALUES (%s, %s, %s, %s, decode('00', 'hex'))",
            "alice",
            "alice",
            "user",
            "test.action",
        )
        with pytest.raises(Exception):
            await conn.execute("UPDATE audit_log SET action = %s", "other")
        with pytest.raises(Exception):
            await conn.execute("DELETE FROM audit_log")


@pytest.mark.asyncio
async def test_trgm_actor_match():
    async with tenant_session("alice") as conn:
        await conn.execute(
            "INSERT INTO canonical_actors (tenant_id, canonical_name, aco_type) "
            "VALUES (%s, %s, %s)",
            "alice",
            "Hayat Tahrir al-Sham",
            "armed_group",
        )
        rows = await conn.fetch(
            "SELECT canonical_name, similarity(canonical_name, %s) AS sim "
            "FROM canonical_actors WHERE canonical_name %% %s ORDER BY sim DESC",
            "Hay'at Tahrir al Sham",
            "Hay'at Tahrir al Sham",
        )
        assert len(rows) == 1
        assert rows[0]["sim"] > 0.5
