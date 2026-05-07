from __future__ import annotations

from typing import Any, Protocol


class BaseRecipe(Protocol):
    recipe_id: str
    token_budget: int

    async def run(self, *, owner_uid: str, case_id: str, input: dict[str, Any]) -> dict[str, Any]:
        ...
