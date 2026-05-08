# Unknowns

| # | question | suspected_resolution | who |
|---|---|---|---|
| 1 | Which orphan API routes have external consumers or production traffic? | Use Cloud Logging route counts before deletion. | GC/Codex with observability access |
| 2 | Are landing _archive components heritage assets or safe deletion candidates? | Likely archive-only; preserve if visual history matters. | GC |
| 3 | Are depcheck unused map libraries intentionally kept for near-term map work? | Possibly future-useful because maps remain a requested surface. | GC/product |
| 4 | Should /api/tools/marketplace/run return 410 now? | Only after confirming no clients post to it. | GC/Codex logs |
| 5 | Can Agent Engine labels be renamed now? | Blocked by C2 decision. | GC |
| 6 | Can Postgres KG replace Firestore graph paths? | Blocked by B0-B3 live gates. | GC with Cloud SQL/VPC shell |
| 7 | Can Cognee memory UI and calibration recall be enabled? | Blocked by C0 service deployment. | GC/platform |
| 8 | Which script files are historical but useful for forensic reproduction? | Move to docs/archive instead of deleting if unsure. | GC/Codex |
