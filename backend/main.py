"""PRAXIS Python Backend — FastAPI application entry point.

Runs on Google Cloud Run. Authenticates via Firebase ID tokens.
Writes all results back to Firestore (single source of truth).
"""
import logging
from contextlib import asynccontextmanager
from datetime import UTC, datetime, timedelta
import asyncio

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from config import get_settings
from logging_config import configure_logging

# Install structured JSON logging before anything else imports a logger.
configure_logging()

from auth import verify_firebase_token, verify_service_token  # noqa: E402

# Observability — Sentry. No-op when SENTRY_DSN is not set in env.
import os as _os
_sentry_dsn = _os.environ.get("SENTRY_DSN", "").strip()
if _sentry_dsn:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.starlette import StarletteIntegration

        sentry_sdk.init(
            dsn=_sentry_dsn,
            integrations=[FastApiIntegration(), StarletteIntegration()],
            traces_sample_rate=float(_os.environ.get("SENTRY_TRACES_SAMPLE_RATE", "0.1")),
            environment=_os.environ.get("SENTRY_ENVIRONMENT", "production"),
            release=_os.environ.get("SENTRY_RELEASE", "praxis-backend@6.2.0"),
            send_default_pii=False,
        )
    except Exception as exc:  # Sentry init must never break the app
        logging.getLogger("praxis").warning("Sentry init failed: %s", exc)

logger = logging.getLogger("praxis")
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("PRAXIS Backend v6.2.0 starting — project=%s region=%s",
                settings.gcp_project_id, settings.gcp_region)
    try:
        from services.postgres import open_pool
        await open_pool()
        app.state.postgres_ready = True
    except Exception as exc:
        app.state.postgres_ready = False
        logger.warning("Postgres pool open failed: %s", exc)
    try:
        from agents.checkpointer import init_checkpointer
        from agents.registry import build_registry

        conn_str = settings.database_url
        if not conn_str and not _os.environ.get("K_SERVICE"):
            conn_str = "memory://startup"
        checkpointer = await init_checkpointer(conn_str)
        app.state.checkpointer = checkpointer
        app.state.flows = build_registry(checkpointer)
        logger.info("Phase 2 agent registry initialized with %s flows", len(app.state.flows))
    except Exception as exc:
        app.state.checkpointer = None
        app.state.flows = {}
        logger.warning("Phase 2 agent registry init failed: %s", exc)
    yield
    try:
        from services.postgres import close_pool
        await close_pool()
    except Exception as exc:
        logger.warning("Postgres pool close failed: %s", exc)
    try:
        from agents.checkpointer import close_checkpointer
        await close_checkpointer()
    except Exception as exc:
        logger.warning("LangGraph checkpointer close failed: %s", exc)
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
    allow_headers=["Authorization", "Content-Type", "X-Firebase-Token", "X-PRAXIS-UID", "X-Request-Id"],
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


@app.get("/healthz")
async def healthz() -> dict:
    return {"ok": True, "service": "praxis-backend", "version": "6.2.0"}


@app.get("/v1/health")
async def cognee_service_health(_service: dict = Depends(verify_service_token)) -> dict:
    from services import cognee_memory

    health = cognee_memory.health()
    body = {
        "ok": health.ready or not health.enabled,
        "version": "6.2.0",
        "features": {
            "cogneeMemoryEnabled": health.enabled,
            "cogneeMode": health.mode,
            "provider": health.provider,
            "embeddingModel": health.embedding_model,
            "embeddingDimensions": health.embedding_dimensions,
        },
        "reason": health.reason,
    }
    if health.enabled and not health.ready:
        raise HTTPException(status_code=503, detail=body)
    return body


@app.post("/admin/quiesce")
async def cognee_admin_quiesce(_service: dict = Depends(verify_service_token)) -> dict:
    app.state.cognee_quiesced = True
    logger.warning("Cognee quiesce requested for snapshot/maintenance")
    return {"ok": True, "quiesced": True}


@app.post("/admin/resume")
async def cognee_admin_resume(_service: dict = Depends(verify_service_token)) -> dict:
    app.state.cognee_quiesced = False
    logger.warning("Cognee resume requested after snapshot/maintenance")
    return {"ok": True, "quiesced": False}


async def _emit_agents_health_failure(exc: Exception) -> None:
    try:
        from google.cloud import firestore
        from google.cloud.firestore_v1 import SERVER_TIMESTAMP

        db = firestore.AsyncClient(project=settings.gcp_project_id or None)
        event_id = f"agents-health-failed-{datetime.now(UTC).strftime('%Y%m%d%H%M%S')}"
        await db.collection("system_events").document(event_id).set({
            "kind": "agents.health.failed",
            "severity": "error",
            "uid": None,
            "situationId": None,
            "message": str(exc)[:500],
            "createdAt": SERVER_TIMESTAMP,
            "expiresAt": datetime.now(UTC) + timedelta(days=30),
            "source": "praxis-backend",
        })
    except Exception as emit_exc:
        logger.warning("Failed to emit agents.health.failed system_event: %s", emit_exc)


@app.get("/agents/health")
async def agents_health(_service: dict = Depends(verify_service_token)) -> dict:
    try:
        from agents.langgraph import health_check
        return await asyncio.to_thread(health_check)
    except Exception as exc:
        logger.exception("LangGraph health check failed")
        await _emit_agents_health_failure(exc)
        raise HTTPException(status_code=503, detail="LangGraph checkpoint store unavailable") from exc


@app.get("/v1/debug/ontology/cache")
async def ontology_cache_debug(_service: dict = Depends(verify_service_token)) -> dict:
    from services.ontology_system import ontology_cache_snapshot

    return ontology_cache_snapshot()


@app.get("/v1/debug/case/{case_id}/ontology")
async def case_ontology_debug(case_id: str, token: dict = Depends(verify_firebase_token)) -> dict:
    from services.ontology_system import ontology_stack_for_case_types
    from services.postgres import tenant_session

    case_type = None
    case_type_secondary = None
    async with tenant_session(token["uid"]) as conn:
        frame_rows = await conn.fetch(
            "SELECT metadata FROM situation_frames WHERE owner_uid = %s AND case_id = %s LIMIT 1",
            token["uid"],
            case_id,
        )
        if frame_rows:
            metadata = frame_rows[0].get("metadata") or {}
            case_type = metadata.get("caseType") or metadata.get("case_type")
            case_type_secondary = metadata.get("caseTypeSecondary") or metadata.get("case_type_secondary")
        if not case_type:
            source_rows = await conn.fetch(
                """
                SELECT metadata
                FROM source_receipts
                WHERE owner_uid = %s AND case_id = %s
                ORDER BY updated_at DESC
                LIMIT 1
                """,
                token["uid"],
                case_id,
            )
            if source_rows:
                metadata = source_rows[0].get("metadata") or {}
                case_type = metadata.get("caseType") or metadata.get("case_type")
                case_type_secondary = metadata.get("caseTypeSecondary") or metadata.get("case_type_secondary")
    return {
        "caseId": case_id,
        "caseType": case_type,
        "caseTypeSecondary": case_type_secondary,
        "ontologyFilePaths": list(ontology_stack_for_case_types(case_type, case_type_secondary)),
    }


# Router registration
from routers import pipeline, graph, analyze, reason, memory, tabs, chapters, workspace, notifications  # noqa: E402

app.include_router(pipeline.router, prefix="/api/v1/pipeline", tags=["pipeline"])
app.include_router(graph.router, prefix="/api/v1/graph", tags=["graph"])
app.include_router(analyze.router, prefix="/api/v1/analyze", tags=["analyze"])
app.include_router(reason.router, prefix="/api/v1/reason", tags=["reason"])
app.include_router(memory.router, prefix="/api/v1/memory", tags=["memory"])
app.include_router(memory.router, prefix="/v1/memory", tags=["memory"])
app.include_router(tabs.router, prefix="/api/v1/tabs", tags=["tabs"])
app.include_router(tabs.router, prefix="/v1/tabs", tags=["tabs"])
app.include_router(chapters.router, prefix="/api/v1/chapters", tags=["chapters"])
app.include_router(chapters.router, prefix="/v1/chapters", tags=["chapters"])
app.include_router(workspace.router, prefix="/api/v1/workspace", tags=["workspace"])
app.include_router(workspace.router, prefix="/v1/workspace", tags=["workspace"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["notifications"])
app.include_router(notifications.router, prefix="/v1/notifications", tags=["notifications"])
