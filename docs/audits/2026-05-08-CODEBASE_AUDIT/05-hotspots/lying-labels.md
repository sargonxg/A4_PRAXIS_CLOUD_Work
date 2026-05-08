# Lying labels

Potential labels whose names or docs can overstate runtime behavior.

| label | evidence | recommendation |
|---|---|---|
| Agent Engine subagents | STATUS.md C2 gate | Keep hidden/renamed unless deployed artifacts exist. |
| Cognee memory | C0/C1 blockers and feature flags | Only surface when COGNEE_ENABLED=true and backend URL exists. |
| Marketplace tools | Recipe library staging work | Continue labeling deterministic recipes as staging patterns. |
| /api/ai/deep-research | Z3 soft-deprecated route | Use /api/ai/deep-search-agent in new clients. |
| Postgres KG production backend | B0-B3 blocked statuses | Do not claim cutover until live counts and soak gates pass. |
