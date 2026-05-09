from pathlib import Path


ROOT = Path(__file__).parents[1]


def test_core_grants_do_not_allow_public_or_link_paths_in_v7():
    migration = (ROOT / "migrations" / "versions" / "0019_cores_baseline.py").read_text(encoding="utf-8")
    router = (ROOT / "routers" / "cores.py").read_text(encoding="utf-8")

    assert "principal_kind text NOT NULL CHECK (principal_kind IN ('user','team'))" in migration
    assert "core_grants.principal_kind = 'public'" not in migration
    assert "public_link_grants_disabled_in_v7" in router


def test_core_list_and_detail_scope_to_owner_platform_or_user_grant():
    source = (ROOT / "routers" / "cores.py").read_text(encoding="utf-8")

    assert "tenant_session(current_user)" in source
    assert source.count("owner_uid = %s") >= 6
    assert source.count("owner_uid = 'platform'") >= 2
    assert source.count("core_grants.principal_kind = 'user'") >= 3
    assert source.count("core_grants.principal_id = %s") >= 3
    assert "principal_kind = 'public'" not in source


def test_core_writes_and_audit_rows_are_owner_scoped():
    source = (ROOT / "routers" / "cores.py").read_text(encoding="utf-8")

    assert "INSERT INTO cores" in source
    assert "owner_uid, core_id, actor_uid, action" in source
    assert "WHERE id = %s::uuid\n              AND owner_uid = %s" in source
    assert "payload.principal_kind in {\"public\", \"link\"}" in source
