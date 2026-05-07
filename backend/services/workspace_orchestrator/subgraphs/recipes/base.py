from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Protocol


class BaseRecipe(Protocol):
    recipe_id: str
    token_budget: int

    async def run(self, *, owner_uid: str, case_id: str, input: dict[str, Any]) -> dict[str, Any]:
        ...


@dataclass(frozen=True)
class StaticRecipe:
    recipe_id: str
    name: str
    cognee_mode: str
    token_budget: int = 8000

    async def run(self, *, owner_uid: str, case_id: str, input: dict[str, Any]) -> dict[str, Any]:
        _ = owner_uid
        return {
            "case_id": case_id,
            "recipe_id": self.recipe_id,
            "name": self.name,
            "mode": self.cognee_mode,
            "token_budget": self.token_budget,
            "input": input,
            "status": "queued",
        }
