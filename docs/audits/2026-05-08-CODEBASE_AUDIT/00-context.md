# Codebase Audit Context

- Date: 2026-05-08
- Audit author: Codex
- Branch: main
- HEAD: 817b7eb54402c0ea7aea0a40c252eb2d4ec2dc4e
- Remote: https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git
- Working tree at start: clean
- Node: v24.12.0
- npm: 11.12.1
- Python: Python 3.12.10
- Audit-relevant tracked files: 2134
- TypeScript/JavaScript modules: 1327
- Python files: 258
- Next route method entries: 210
- FastAPI route entries: 92
- Declared frontend dependencies: 63; dev dependencies: 12

## File Counts By Kind

| kind | count |
|---|---|
| other | 292 |
| lib | 493 |
| config | 37 |
| test | 224 |
| doc | 382 |
| script | 108 |
| component | 397 |
| route | 201 |


## Recent Commits

```text
817b7eb docs: checkpoint v2 prompt pack completion
5d0db47 chore: consolidate deep research routes
93c26a7 feat: add export and demo transition gates
4193eac docs: preserve v2 control loop prompts
498caac feat: add structured telemetry kpi foundation
f60478c docs: record c2 agent engine decision gate
fe1b38c docs: register session c cognee prompts
2da494c docs: register remaining session b prompts
4389376 docs(B0): record postgres kg preflight blocker
b61a5c3 docs: register remaining session a prompts
```

## Architecture Documents Read

- docs/architecture/CAPACITY_PLAN.md
- docs/architecture/COGNEE_MEMORY_LAYER.md
- docs/architecture/CONFLICT_DATA_SOURCES.md
- docs/architecture/COST_NOTES.md
- docs/architecture/DEEP_RESEARCH.md
- docs/architecture/KG_BACKEND.md
- docs/architecture/MODEL_SELECTION.md
- docs/architecture/MULTI_TENANT_MODEL.md
- docs/architecture/ONTOLOGY_SYSTEM.md
- docs/architecture/POSTGRES_SCHEMA.md
- docs/architecture/PRAXIS_ARCHITECTURE.md
- docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md
- docs/architecture/PRAXIS_ONE_PAGE.md
- docs/architecture/TELEMETRY.md
- docs/architecture/WORKBENCH_SURFACES.md

## Claimed Shape From README

README describes PRAXIS as a Next.js 16 frontend plus Python FastAPI backend on Cloud Run, Firebase/Auth/Firestore for core app state, Vertex AI for model work, optional Cognee memory service, and a narrowed workbench/product surface. This audit checks repository shape against that claim rather than assuming the docs are current.
