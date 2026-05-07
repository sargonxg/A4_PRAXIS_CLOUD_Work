"""PRAXIS Backend configuration — loads from environment variables."""
from functools import lru_cache
from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings
from ai.providers import (
    COGNEE_EMBED_DIMENSIONS,
    COGNEE_EMBED_MODEL,
    COGNEE_MODEL_FLASH,
    COGNEE_MODEL_PRO,
    COGNEE_VERTEX_PROVIDER,
    MODEL_FLASH,
    MODEL_PRO,
)


class Settings(BaseSettings):
    # GCP
    gcp_project_id: str = "praxisbytacitus"
    gcp_region: str = "us-central1"

    # Neo4j (DIALECTICA graph DB)
    neo4j_uri: str = ""
    neo4j_user: str = Field(default="neo4j", validation_alias=AliasChoices("NEO4J_USER", "NEO4J_USERNAME", "neo4j_user"))
    neo4j_password: str = ""
    neo4j_database: str = "neo4j"

    # Knowledge graph backend. Postgres is the v1 primary; Neo4j is optional
    # for legacy reads or reflective indexing during migration validation.
    graph_backend: str = Field(
        default="postgres",
        validation_alias=AliasChoices("KG_BACKEND", "GRAPH_BACKEND", "graph_backend"),
    )

    # Cognee memory layer. Disabled by default; when enabled it runs as an
    # isolated probabilistic memory plane and never writes canonical ACO rows.
    cognee_enabled: bool = Field(
        default=False,
        validation_alias=AliasChoices("COGNEE_ENABLED", "cognee_enabled"),
    )
    cognee_mode: str = Field(
        default="disabled",
        validation_alias=AliasChoices("COGNEE_MODE", "cognee_mode"),
    )
    cognee_db_host: str = Field(default="pgbouncer", validation_alias=AliasChoices("COGNEE_DB_HOST", "cognee_db_host"))
    cognee_db_port: int = Field(default=6432, validation_alias=AliasChoices("COGNEE_DB_PORT", "cognee_db_port"))
    cognee_db_name: str = Field(default="praxis_cognee", validation_alias=AliasChoices("COGNEE_DB_NAME", "cognee_db_name"))
    cognee_db_user: str = Field(default="praxis_cognee_app", validation_alias=AliasChoices("COGNEE_DB_USER", "cognee_db_user"))
    cognee_db_password: str = Field(default="", validation_alias=AliasChoices("COGNEE_DB_PASSWORD", "cognee_db_password"))
    cognee_kuzu_path: str = Field(default="/var/lib/cognee/kuzu", validation_alias=AliasChoices("COGNEE_KUZU_PATH", "cognee_kuzu_path"))
    cognee_kuzu_gcs_bucket: str = Field(default="", validation_alias=AliasChoices("COGNEE_KUZU_GCS_BUCKET", "cognee_kuzu_gcs_bucket"))
    cognee_neo4j_database: str = Field(default="cognee", validation_alias=AliasChoices("COGNEE_NEO4J_DATABASE", "cognee_neo4j_database"))
    cognee_session_sync_seconds: int = Field(default=60, validation_alias=AliasChoices("COGNEE_SESSION_SYNC_SECONDS", "cognee_session_sync_seconds"))
    cognee_session_ttl_hours: int = Field(default=24, validation_alias=AliasChoices("COGNEE_SESSION_TTL_HOURS", "cognee_session_ttl_hours"))
    cognee_candidate_floor: float = Field(default=0.40, validation_alias=AliasChoices("COGNEE_CANDIDATE_FLOOR", "cognee_candidate_floor"))
    cognee_promotion_confidence_ceiling: float = Field(default=0.60, validation_alias=AliasChoices("COGNEE_PROMOTION_CEILING", "COGNEE_PROMOTION_CONFIDENCE_CEILING", "cognee_promotion_confidence_ceiling"))
    cognee_max_candidates: int = Field(default=50, validation_alias=AliasChoices("COGNEE_MAX_CANDIDATES_PER_DOC", "COGNEE_MAX_CANDIDATES", "cognee_max_candidates"))
    cognee_llm_provider: str = Field(default=COGNEE_VERTEX_PROVIDER, validation_alias=AliasChoices("COGNEE_LLM_PROVIDER", "cognee_llm_provider"))
    cognee_llm_model_pro: str = Field(default=COGNEE_MODEL_PRO, validation_alias=AliasChoices("COGNEE_LLM_MODEL_PRO", "cognee_llm_model_pro"))
    cognee_llm_model_flash: str = Field(default=COGNEE_MODEL_FLASH, validation_alias=AliasChoices("COGNEE_LLM_MODEL_FLASH", "cognee_llm_model_flash"))
    cognee_embedding_model: str = Field(default=COGNEE_EMBED_MODEL, validation_alias=AliasChoices("COGNEE_EMBEDDING_MODEL", "cognee_embedding_model"))
    cognee_embedding_dimensions: int = Field(default=COGNEE_EMBED_DIMENSIONS, validation_alias=AliasChoices("COGNEE_EMBEDDING_DIMENSIONS", "cognee_embedding_dimensions"))
    cognee_llm_api_key: str = Field(default="vertex-adc", validation_alias=AliasChoices("COGNEE_LLM_API_KEY", "LLM_API_KEY", "cognee_llm_api_key"))

    @property
    def cognee_db_dsn(self) -> str:
        host = self.cognee_db_host or self.pgbouncer_host
        port = self.cognee_db_port or self.pgbouncer_port
        return f"postgresql://{self.cognee_db_user}:{self.cognee_db_password}@{host}:{port}/{self.cognee_db_name}"

    @property
    def cognee_promotion_ceiling(self) -> float:
        return self.cognee_promotion_confidence_ceiling

    # LangGraph checkpointing (Cloud SQL Postgres; see docs/GCP_OPERATIONS.md)
    langgraph_checkpoint_backend: str = "postgres"
    langgraph_db_instance_connection_name: str = "praxisbytacitus:us-east4:praxisbytacitus-instance"
    langgraph_db_host: str = "localhost"
    langgraph_db_port: int = 6432
    langgraph_db_name: str = "praxis"
    langgraph_db_user: str = "praxis_app"
    langgraph_db_password_secret: str = "praxis-db-password"
    langgraph_db_password: str = ""

    # Phase 1 application Postgres (all backend SQL goes through PgBouncer).
    database_url: str = Field(
        default="",
        validation_alias=AliasChoices("DATABASE_URL", "database_url"),
    )
    pgbouncer_host: str = Field(
        default="localhost",
        validation_alias=AliasChoices("PGBOUNCER_HOST", "pgbouncer_host"),
    )
    pgbouncer_port: int = Field(
        default=6432,
        validation_alias=AliasChoices("PGBOUNCER_PORT", "pgbouncer_port"),
    )

    # BigQuery
    bigquery_dataset: str = "praxis_analytics"

    # AI Models
    gemini_model: str = MODEL_FLASH
    gemini_deep_model: str = MODEL_PRO

    # CORS — comma-separated origins. Cloud Run URLs auto-allowed via regex in main.py.
    cors_origins_str: str = "http://localhost:3000,http://localhost:3001,https://praxis.tacitus.me"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.cors_origins_str.split(",") if o.strip()]

    # Firebase Admin SDK credentials
    # Priority: FIREBASE_SERVICE_ACCOUNT_KEY (JSON string) > firebase_credentials_path (file) > ADC
    firebase_service_account_key: str = ""  # full JSON string (used in Cloud Run)
    firebase_credentials_path: str = ""     # path to JSON file (used locally)

    # AI API Keys (optional — falls back to ADC / Workload Identity on Cloud Run)
    google_ai_api_key: str = ""

    # Backend service-to-service auth.
    # OIDC audience defaults to the request origin when unset. The allowlist is
    # comma-separated service account emails that may forward X-PRAXIS-UID.
    backend_oidc_audience: str = ""
    backend_trusted_service_accounts: str = ""

    @property
    def trusted_service_accounts(self) -> set[str]:
        configured = {
            email.strip().lower()
            for email in self.backend_trusted_service_accounts.split(",")
            if email.strip()
        }
        project = self.gcp_project_id.strip()
        if project:
            configured.update({
                f"praxis-frontend-sa@{project}.iam.gserviceaccount.com",
                f"praxis-functions-sa@{project}.iam.gserviceaccount.com",
                f"praxis-worker-sa@{project}.iam.gserviceaccount.com",
            })
        return configured

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
