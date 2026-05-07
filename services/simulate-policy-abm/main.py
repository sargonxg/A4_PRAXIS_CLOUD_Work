from __future__ import annotations

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from scenarios.escalation_ladder_with_mediator import run_escalation_ladder

app = FastAPI(title="PRAXIS policy ABM worker", version="1.0.0")


class SimulateRequest(BaseModel):
    scenario_id: str = "escalation_ladder_with_mediator"
    num_factions: int = Field(default=5, ge=2, le=25)
    mediator_strength: float = Field(default=0.5, ge=0, le=1)
    max_steps: int = Field(default=30, ge=1, le=100)
    seed: int = 42


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok", "scenario": "scenario stress-test"}


@app.post("/simulate")
def simulate(req: SimulateRequest) -> dict:
    if req.scenario_id != "escalation_ladder_with_mediator":
        raise HTTPException(status_code=400, detail="Unknown scenario; v1 supports escalation_ladder_with_mediator")
    return run_escalation_ladder(
        num_factions=req.num_factions,
        mediator_strength=req.mediator_strength,
        max_steps=req.max_steps,
        seed=req.seed,
    )

