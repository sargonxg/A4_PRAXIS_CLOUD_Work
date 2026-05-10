from __future__ import annotations

from typing import Any


def scoped_graph_nodes_query() -> str:
    return (
        "SELECT * FROM graph_nodes "
        "WHERE owner_uid = %(owner_uid)s AND case_id = %(case_id)s "
        "AND valid_from <= %(episode_valid_from)s "
        "AND (valid_to IS NULL OR valid_to > %(episode_valid_from)s)"
    )


def scoped_sources_query() -> str:
    return (
        "SELECT * FROM document_chunks "
        "WHERE owner_uid = %(owner_uid)s AND case_id = %(case_id)s "
        "AND valid_from <= %(episode_valid_from)s "
        "AND (valid_to IS NULL OR valid_to > %(episode_valid_from)s)"
    )


def scoped_drafts(case_id: str, episode_id: str, owner_uid: str) -> dict[str, Any]:
    return {"case_id": case_id, "work_episode_id": episode_id, "owner_uid": owner_uid}
