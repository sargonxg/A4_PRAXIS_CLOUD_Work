# Parallel implementations

| set | files | recommendation |
|---|---|---|
| Deep research routes | /api/ai/deep-search-agent + /api/ai/deep-research | Keep canonical + soft-deprecated fallback until production consumers are measured. |
| Documents versus Library ingest | /api/documents/upload + backend tabs/library ingest | Consolidate once Cognee service is live and source receipts are production-verified. |
| Graph backends | Firestore graph layer + Neo4j verifier + Postgres KG docs/migrations | Follow B0-B3 gates before deleting any backend path. |
| Marketplace recipes versus hero tools | ToolMarketplace recipe staging + hero routes | Keep recipe library but avoid AI-backed claims for deterministic recipes. |
| Cognee boundary | /api/memory proxy + backend/services/cognee_memory.py + feature gates | Keep disabled-safe boundary until C0 is deployed. |
