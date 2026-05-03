from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from auth import verify_firebase_token
from dialectica.runner import run_recipe
from services.firestore_sync import FirestoreSync

router = APIRouter()


class ReasonRequest(BaseModel):
    situation_id: str | None = Field(default=None, alias="situationId")
    graph: dict[str, Any] | None = None
    params: dict[str, Any] = Field(default_factory=dict)

    model_config = {"populate_by_name": True}


@router.post("/{recipe}")
async def reason(recipe: str, req: ReasonRequest, token: dict = Depends(verify_firebase_token)):
    graph_payload = req.graph
    if graph_payload is None:
        if not req.situation_id:
            raise HTTPException(status_code=400, detail="Provide graph or situationId")
        uid = token["uid"]
        graph_payload = await FirestoreSync().read_graph_snapshot(uid, req.situation_id)
    try:
        return run_recipe(recipe, graph_payload, req.params)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
