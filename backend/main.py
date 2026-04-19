"""PRAXIS Python Backend — FastAPI application entry point.

Runs on Google Cloud Run. Authenticates via Firebase ID tokens.
Writes all results back to Firestore (single source of truth).
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from config import get_settings
from logging_config import configure_logging

# Install structured JSON logging before anything else imports a logger.
configure_logging()

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

# Scope Cloud Run regex to our project number only — prevents any Cloud Run URL
# in any GCP org from hitting this backend with CORS credentials attached.
# Project number: 852128226674 (praxisbytacitus). Adjust via CORS_RUN_REGEX if needed.
_default_run_regex = r"https://praxis-(frontend|backend)-852128226674\.us-central1\.run\.app"
_cors_run_regex = getattr(settings, "cors_run_regex", "") or _default_run_regex

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=_cors_run_regex,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-Id"],
)


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Attach request-id + Cloud Trace id to every log emitted during the request."""

    async def dispatch(self, request: Request, call_next):
        import uuid
        req_id = request.headers.get("X-Request-Id") or uuid.uuid4().hex
        trace_header = request.headers.get("X-Cloud-Trace-Context", "")
        trace = ""
        if trace_header and settings.gcp_project_id:
            trace_id = trace_header.split("/")[0]
            trace = f"projects/{settings.gcp_project_id}/traces/{trace_id}"

        # Propagate via logging filter on the root logger
        old_factory = logging.getLogRecordFactory()

        def factory(*args, **kwargs):
            record = old_factory(*args, **kwargs)
            record.request_id = req_id
            if trace:
                record.trace = trace
            record.path = request.url.path
            record.method = request.method
            return record

        logging.setLogRecordFactory(factory)
        try:
            response = await call_next(request)
        finally:
            logging.setLogRecordFactory(old_factory)
        response.headers["X-Request-Id"] = req_id
        return response


app.add_middleware(RequestContextMiddleware)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "praxis-backend", "version": "6.2.0"}


# Router registration
from routers import pipeline, graph, analyze  # noqa: E402

app.include_router(pipeline.router, prefix="/api/v1/pipeline", tags=["pipeline"])
app.include_router(graph.router, prefix="/api/v1/graph", tags=["graph"])
app.include_router(analyze.router, prefix="/api/v1/analyze", tags=["analyze"])
