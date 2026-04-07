"""PRAXIS Backend configuration — loads from environment variables."""
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # GCP
    gcp_project_id: str = "praxisbytacitus"
    gcp_region: str = "us-central1"

    # Neo4j (DIALECTICA graph DB)
    neo4j_uri: str = ""
    neo4j_user: str = "neo4j"
    neo4j_password: str = ""

    # FalkorDB (alternative graph backend)
    falkordb_host: str = "localhost"
    falkordb_port: int = 6379

    # BigQuery
    bigquery_dataset: str = "praxis_analytics"

    # AI Models
    gemini_model: str = "gemini-2.5-flash"
    gemini_deep_model: str = "gemini-2.5-pro"

    # CORS — comma-separated origins, e.g. "https://praxis.tacitus.me,http://localhost:3000"
    # Defaults to localhost. Set CORS_ORIGINS env var in Cloud Run to include the frontend URL.
    cors_origins_str: str = "http://localhost:3000,http://localhost:3001"

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

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
