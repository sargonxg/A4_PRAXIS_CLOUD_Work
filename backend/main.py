"""PRAXIS Python Backend — FastAPI application entry point.

Runs on Google Cloud Run. Authenticates via Firebase ID tokens.
Writes all results back to Firestore (single source of truth).
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings

logger = logging.getLogger("praxis")
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("PRAXIS Backend v6.2.0 starting — project=%s region=%s",
                settings.gcp_project_id, settings.gcp_region)
    yield
    logger.info("PRAXIS Backend shutting down")


app = FastAPI(
    title="PRAXIS Backend",
    description="Conflict intelligence graph processing service",
    version="6.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"https://.*\.run\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "praxis-backend", "version": "6.2.0"}


# Router registration
from routers import pipeline, graph, analyze  # noqa: E402

app.include_router(pipeline.router, prefix="/api/v1/pipeline", tags=["pipeline"])
app.include_router(graph.router, prefix="/api/v1/graph", tags=["graph"])
app.include_router(analyze.router, prefix="/api/v1/analyze", tags=["analyze"])
