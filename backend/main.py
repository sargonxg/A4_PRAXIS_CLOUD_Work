"""PRAXIS Python Backend — FastAPI application entry point.

Runs on Google Cloud Run. Authenticates via Firebase ID tokens.
Writes all results back to Firestore (single source of truth).
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings

settings = get_settings()

app = FastAPI(
    title="PRAXIS Backend",
    description="Conflict intelligence graph processing service",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"https://.*\.run\.app",  # allow all Cloud Run URLs automatically
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "praxis-backend"}


# Router registration (added progressively as routers are implemented)
from routers import pipeline, graph, analyze  # noqa: E402

app.include_router(pipeline.router, prefix="/api/v1/pipeline", tags=["pipeline"])
app.include_router(graph.router, prefix="/api/v1/graph", tags=["graph"])
app.include_router(analyze.router, prefix="/api/v1/analyze", tags=["analyze"])
