from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Literal

from dialectica.recipes.common import build_graph
from dialectica.recipes import commitment_check, counter_narrative, interest_vs_position, leverage_trace, path_search

RecipeId = Literal["leverage-trace", "commitment-check", "interest-vs-position", "counter-narrative", "path-search"]

_RECIPES = {
    "leverage-trace": leverage_trace.run,
    "commitment-check": commitment_check.run,
    "interest-vs-position": interest_vs_position.run,
    "counter-narrative": counter_narrative.run,
    "path-search": path_search.run,
}


def run_recipe(recipe: RecipeId | str, graph_payload: dict[str, Any], params: dict[str, Any] | None = None) -> dict[str, Any]:
    if recipe not in _RECIPES:
        raise ValueError(f"Unknown DIALECTICA recipe: {recipe}")
    graph = build_graph(graph_payload)
    return _RECIPES[recipe](graph, params or {})


def _fixture_path(name: str) -> Path:
    if name == "syria":
        return Path(__file__).resolve().parents[1] / "tests" / "fixtures" / "syria_aco_sample.json"
    return Path(name)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run a DIALECTICA recipe against a graph fixture.")
    parser.add_argument("--recipe", required=True, choices=sorted(_RECIPES))
    parser.add_argument("--fixture", default="syria")
    parser.add_argument("--params", default="{}")
    args = parser.parse_args()
    graph_payload = json.loads(_fixture_path(args.fixture).read_text(encoding="utf-8"))
    params = json.loads(args.params)
    print(json.dumps(run_recipe(args.recipe, graph_payload, params), indent=2))


if __name__ == "__main__":
    main()
