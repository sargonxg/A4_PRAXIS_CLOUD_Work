# Unused backend dependencies

Backend has multiple requirement scopes. This pass inventories requirement files and observed top-level imports; it does not remove Python packages because some are service-image-only.

## backend/pyproject.toml

- `[build-system]`
- `requires = ["hatchling"]`
- `build-backend = "hatchling.build"`
- `[project]`
- `name = "praxis-backend"`
- `version = "6.2.0"`
- `requires-python = ">=3.11"`
- `dependencies = [`
- `    "fastapi>=0.115,<1.0",`
- `    "uvicorn[standard]>=0.34,<1.0",`
- `    "networkx>=3.4,<4.0",`
- `    "python-louvain>=0.16,<1.0",`
- `    "followthemoney>=4.0,<5.0",`
- `    "rigour>=1.3,<2.0",`
- `    "graspologic>=3.4,<4.0",`
- `    "pydantic>=2.10,<3.0",`
- `    "pydantic-settings>=2.7,<3.0",`
- `    "google-genai>=1.8,<2.0",`
- `    "google-cloud-firestore>=2.19,<3.0",`
- `    "google-cloud-bigquery>=3.27,<4.0",`
- `    "firebase-admin>=6.6,<7.0",`
- `    "neo4j>=5.26,<6.0",`
- `    "httpx>=0.28,<1.0",`
- `    "python-multipart>=0.0.17",`
- `    "google-auth>=2.0,<3.0",`
- `    "langgraph>=1.1,<2.0",`
- `    "langgraph-checkpoint-postgres>=3.0,<4.0",`
- `    "langchain-google-vertexai>=2.0,<3.0",`
- `    "psycopg[binary,pool]>=3.2,<4.0",`
- `    "pgvector>=0.3,<1.0",`
- `    "alembic>=1.13,<2.0",`
- `    "google-cloud-secret-manager>=2.24,<3.0",`
- `    "cognee==1.0.1",`
- `    "kuzu>=0.4.2,<1.0",`
- `    "litellm>=1.80,<2.0",`
- `    "sentry-sdk[fastapi]>=2.17,<3.0",`
- `]`
- `[project.optional-dependencies]`
- `dev = [`
- `    "pytest>=8.0",`
- `    "pytest-asyncio>=0.23",`
- `]`
- `[tool.hatch.build.targets.wheel]`
- `packages = ["."]`
- `[tool.pytest.ini_options]`
- `asyncio_mode = "auto"`
- `testpaths = ["tests"]`
