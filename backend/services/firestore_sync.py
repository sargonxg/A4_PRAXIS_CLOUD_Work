"""Firestore sync — reads and writes all PRAXIS data to Firestore.

Firebase/Firestore is the single source of truth. The frontend listens via
onSnapshot; the backend writes here and the frontend updates automatically.

Path convention: users/{uid}/situations/{sit_id}/...
"""
from __future__ import annotations

from datetime import datetime, timezone

from google.cloud import firestore


class FirestoreSync:
    """Async Firestore client for PRAXIS data operations."""

    def __init__(self) -> None:
        self._db: firestore.AsyncClient | None = None

    def _get_db(self) -> firestore.AsyncClient:
        if self._db is None:
            self._db = firestore.AsyncClient()
        return self._db

    def _sit_ref(self, uid: str, sit_id: str) -> firestore.AsyncDocumentReference:
        return self._get_db().document(f"users/{uid}/situations/{sit_id}")

    # ── Graph data ────────────────────────────────────────────────────────────

    async def write_graph_snapshot(self, uid: str, sit_id: str, snapshot_dict: dict) -> None:
        """Write the graph snapshot (nodes + edges + communities) to Firestore."""
        ref = self._sit_ref(uid, sit_id).collection("graph").document("snapshot")
        snapshot_dict["updatedAt"] = datetime.now(timezone.utc).isoformat()
        await ref.set(snapshot_dict, merge=True)

    async def write_analysis(self, uid: str, sit_id: str, analysis_dict: dict) -> None:
        """Write the graph analysis results to Firestore."""
        ref = self._sit_ref(uid, sit_id).collection("graph").document("analysis")
        analysis_dict["updatedAt"] = datetime.now(timezone.utc).isoformat()
        await ref.set(analysis_dict, merge=True)

    async def read_graph_snapshot(self, uid: str, sit_id: str) -> dict:
        """Read the current graph snapshot from Firestore."""
        ref = self._sit_ref(uid, sit_id).collection("graph").document("snapshot")
        doc = await ref.get()
        return doc.to_dict() or {}

    async def read_analysis(self, uid: str, sit_id: str) -> dict:
        """Read graph analysis from Firestore."""
        ref = self._sit_ref(uid, sit_id).collection("graph").document("analysis")
        doc = await ref.get()
        return doc.to_dict() or {}

    # ── Situation metadata ────────────────────────────────────────────────────

    async def read_situation(self, uid: str, sit_id: str) -> dict:
        doc = await self._sit_ref(uid, sit_id).get()
        return doc.to_dict() or {}

    async def update_situation_metadata(self, uid: str, sit_id: str, updates: dict) -> None:
        updates["updatedAt"] = datetime.now(timezone.utc).isoformat()
        await self._sit_ref(uid, sit_id).update(updates)

    # ── Tool data ─────────────────────────────────────────────────────────────

    async def write_tool_data(self, uid: str, sit_id: str, tool_name: str, data: dict) -> None:
        """Write tool-specific AI output to Firestore."""
        ref = self._sit_ref(uid, sit_id).collection("tools").document(tool_name)
        data["generatedAt"] = datetime.now(timezone.utc).isoformat()
        await ref.set(data, merge=True)

    async def read_tool_data(self, uid: str, sit_id: str, tool_name: str) -> dict:
        ref = self._sit_ref(uid, sit_id).collection("tools").document(tool_name)
        doc = await ref.get()
        return doc.to_dict() or {}

    async def read_all_tool_data(self, uid: str, sit_id: str) -> dict[str, dict]:
        """Read all tool outputs for a situation. Returns {tool_name: data}."""
        tools_ref = self._sit_ref(uid, sit_id).collection("tools")
        docs = tools_ref.stream()
        result = {}
        async for doc in docs:
            result[doc.id] = doc.to_dict()
        return result

    # ── User settings ─────────────────────────────────────────────────────────

    async def read_user_settings(self, uid: str) -> dict:
        """Read user's API keys and model preferences from Firestore."""
        db = self._get_db()
        settings: dict = {}

        api_keys_doc = await db.document(f"users/{uid}/settings/api_keys").get()
        if api_keys_doc.exists:
            settings["api_keys"] = api_keys_doc.to_dict() or {}

        model_prefs_doc = await db.document(f"users/{uid}/settings/model_preferences").get()
        if model_prefs_doc.exists:
            settings["model_preferences"] = model_prefs_doc.to_dict() or {}

        graph_backend_doc = await db.document(f"users/{uid}/settings/graph_backend").get()
        if graph_backend_doc.exists:
            settings["graph_backend"] = graph_backend_doc.to_dict() or {}

        return settings
