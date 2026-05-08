# Lying routes

| route | issue | action |
|---|---|---|
| /api/ai/deep-research | Name implies canonical deep research but Z3 makes deep-search-agent canonical. | Keep soft-deprecated until consumers measured. |
| /api/tools/marketplace/run | Can look AI-backed if called directly; UI now stages recipes. | Consider 410 after all consumers migrate. |
| /api/memory/[...slug] | Boundary exists while Cognee disabled by default. | Keep but ensure UI remains feature-gated. |
| /api/backend/[...path] | Proxy hides FastAPI surface area. | Keep allowlist/gates and document consumers. |
