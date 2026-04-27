"""Local LangGraph Postgres smoke test.

Run from backend/ after setting LANGGRAPH_DB_* against a local Postgres
container, for example:

    docker run --rm -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16
    $env:LANGGRAPH_DB_HOST="127.0.0.1"
    $env:LANGGRAPH_DB_NAME="postgres"
    $env:LANGGRAPH_DB_USER="postgres"
    $env:LANGGRAPH_DB_PASSWORD="postgres"
    python -m agents.langgraph._smoke
"""
from __future__ import annotations

from typing import TypedDict
from uuid import uuid4

from langgraph.graph import END, START, StateGraph

from agents.langgraph.checkpointing import get_checkpointer


class SmokeState(TypedDict):
    count: int


def _increment(state: SmokeState) -> SmokeState:
    return {"count": state["count"] + 1}


def run_smoke() -> None:
    thread_id = f"smoke-{uuid4().hex}"
    graph = StateGraph(SmokeState)
    graph.add_node("increment", _increment)
    graph.add_edge(START, "increment")
    graph.add_edge("increment", END)

    app = graph.compile(checkpointer=get_checkpointer())
    config = {"configurable": {"thread_id": thread_id}}
    first = app.invoke({"count": 0}, config=config)
    resumed = app.invoke(first, config=config)

    if first["count"] != 1 or resumed["count"] != 2:
        raise RuntimeError(f"Unexpected smoke state: first={first} resumed={resumed}")

    print(f"LangGraph Postgres smoke OK thread_id={thread_id} count={resumed['count']}")


if __name__ == "__main__":
    run_smoke()
