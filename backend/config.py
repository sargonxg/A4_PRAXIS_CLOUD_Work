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

    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3001"]

    # Firebase Admin SDK credentials (path to service account JSON, or empty to use ADC)
    firebase_credentials_path: str = ""

    # Optional: Google AI API key (for non-Vertex AI usage)
    google_ai_api_key: str = ""

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
