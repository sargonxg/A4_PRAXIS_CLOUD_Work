"""PRAXIS Backend configuration — loads from environment variables."""
from functools import lru_cache
from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # GCP
    gcp_project_id: str = "praxisbytacitus"
    gcp_region: str = "us-central1"

    # Neo4j (DIALECTICA graph DB)
    neo4j_uri: str = ""
    neo4j_user: str = Field(default="neo4j", validation_alias=AliasChoices("NEO4J_USER", "NEO4J_USERNAME", "neo4j_user"))
    neo4j_password: str = ""
    neo4j_database: str = "neo4j"

    # FalkorDB (alternative graph backend)
    falkordb_host: str = "localhost"
    falkordb_port: int = 6379

    # Cloud Spanner Graph (production multi-region backend)
    graph_backend: str = "firestore"  # options: firestore, neo4j, falkordb, spanner
    spanner_project_id: str = ""
    spanner_instance_id: str = "praxis-graph"
    spanner_database_id: str = "praxis-graph-db"

    # LangGraph checkpointing (Cloud SQL Postgres; see docs/LANGGRAPH_CLOUDSQL_CHECKPOINTING.md)
    langgraph_checkpoint_backend: str = "postgres"
    langgraph_db_instance_connection_name: str = "praxisbytacitus:us-east4:praxisbytacitus-instance"
    langgraph_db_host: str = "10.101.0.3"
    langgraph_db_port: int = 5432
    langgraph_db_name: str = "praxis_langgraph"
    langgraph_db_user: str = "praxis_langgraph"
    langgraph_db_password_secret: str = "praxis-langgraph-db-password"
    langgraph_db_password: str = ""

    # BigQuery
    bigquery_dataset: str = "praxis_analytics"

    # AI Models
    gemini_model: str = "gemini-2.5-flash"
    gemini_deep_model: str = "gemini-2.5-pro"
    graphiti_llm_model: str = "gemini-2.5-flash"
    graphiti_embedder_model: str = "gemini-embedding-2-preview"

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
    anthropic_api_key: str = ""

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
