# PRAXIS Architecture and Agent Handoff

**Date:** 2026-05-06  
**Repository:** https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work  
**Production:** https://praxis.tacitus.me  
**Current production commit:** `54e9f50`  
**Final Phase 3 Cloud Build:** `39134256-fc38-409a-b2a4-1e4f98cf9830`  
**Cloud Run revisions:** frontend `praxis-frontend-00230-2pm`, backend `praxis-backend-00102-6rg`, worker `gdelt-poller-00005-xg2`

## Executive State

PRAXIS is a Next.js App Router product deployed to Google Cloud Run with Firebase/Firestore as canonical user state, Cloud SQL Postgres for relational/vector/agent memory, Neo4j Aura as the graph index, Vertex AI Gemini as the only model provider, and a Python backend for agentic reasoning flows.

The app shell now matches the Phase 3 product surface: the default sidebar renders eight surfaces only: Desk, Context, Library, Research, Graph, Boardroom, Draft, Tools. The unified Workbench has expanded tabs for Chapters, Desk, Context, Library, Research, Ontology, Graph, Tools, Memos, Boardroom, and Draft. Legacy and specialist `/app/*` routes remain live and are exposed through Tools or the `?show_archive=1` sidebar switch.

For the detailed line-by-line phase-spec audit, known red flags, missing work, and next iteration order, read `docs/PRAXIS_PHASE_SPEC_AUDIT_2026-05-06.md`.

## Phase Audit

| Phase | Status | What is complete | Validation evidence | Caveat |
|---|---:|---|---|---|
| Phase 1 Foundation | Shipped | Cloud SQL private path, Neo4j secrets/IAM, GCP audit, model/provider cleanup, route calibration, health checks, production deploy. | `phase-1-foundation-shipped`; Cloud Build `463da685-707e-434d-a4fe-316dfb421ae4`; production `/api/health` green at ship time. | None currently blocking. |
| Phase 2 Agentic Spine | Shipped | LangGraph/checkpointer scaffold, five agent registrations, deterministic DIALECTICA recipes, symbolic-firewall helpers, `/api/ai/dialectica`, backend recipe tests, production deploy. | `phase-2-agentic-spine-shipped`; Cloud Build `7673e615-ad2b-441b-b77c-aa194ccc092f`; full backend and frontend tests green at ship time. | The original "62 routes collapse to 20 verbs" remains policy/scaffold rather than a literal route-count collapse; route audit now reports 66 calibrated AI route files. |
| Phase 3 Product Surface | Shipped | Eight-surface sidebar, archive exposure, `/app/desk`, `/app/context`, `/app/research`, `/app/graph`, `/app/boardroom`, `/app/draft`, Library split routes, Draft provenance editor, Boardroom room, read-only Cypher validator/API, graph diff/SSE stubs, AI Act ack routes, cost-cap API/UI, landing copy refresh. | `npx tsc --noEmit`; `npm run build`; `npm run lint` zero errors; `npx vitest run` 114 files/502 tests; `npm run audit:routes`; `scripts/audit-phase3-product-surface.ts`; `scripts/audit-verb-hookup.ts`; production Cloud Build `39134256-fc38-409a-b2a4-1e4f98cf9830`; production Playwright public smoke 4/4. | Streaming Boardroom, live Neo4j execution, DOCX footer embedding, and production cost-cap persistence are functional scaffolds, not full live provider flows. |

## Runtime Architecture

| Layer | Owner | Purpose |
|---|---|---|
| Next.js frontend | `src/app`, `src/components`, `src/lib` | Product UI, app shell, route handlers, calibrated AI route boundary. |
| Python backend | `backend/` | Agent registry, DIALECTICA recipes, symbolic firewall, Postgres/Neo4j service adapters. |
| Firestore | `users/{uid}/situations/{id}/...` | Canonical user-owned app state, documents, sources, work products, provenance, graph proposals, preferences. |
| Cloud SQL Postgres | `praxis` database | Relational state, vector/memory/checkpoints, future LangGraph persistence. |
| Neo4j Aura | Secret-backed connection | Graph index for analytical traversal; Firestore remains canonical. |
| Vertex AI Gemini | Server-side only | AI provider. Do not add Claude, Firecrawl, Tavily, Parallel, Falkor, Spanner, or unmanaged model fallbacks. |
| Cloud Run | `praxis-frontend`, `praxis-backend`, workers | Production runtime behind `praxis.tacitus.me`. |

## Phase 3 Surface Contract

The eight product surfaces live in `src/lib/navigation/product-surfaces.ts`.

| Surface | Route | Canonical tool |
|---|---|---|
| Desk | `/app/desk` | `dashboard` |
| Context | `/app/context` | `context-builder` |
| Library | `/app/library` | `library` |
| Research | `/app/research` | `source-scout` |
| Graph | `/app/graph` | `graphops` |
| Boardroom | `/app/boardroom` | `brainstorming-table` |
| Draft | `/app/draft` | `policy-memo` |
| Tools | `/app/tools` | `tools` |

Important files:

- `src/components/app/app-sidebar.tsx` renders the eight-surface shell and archive switch.
- `src/lib/navigation/tool-preferences.ts` exposes the eight surfaces to preference ordering/hiding.
- `src/components/editor/work-product-editor.tsx` implements the Draft workspace with provenance chips and JSON-LD manifest preview.
- `src/components/boardroom/deliberation-room.tsx` implements the Boardroom surface and Draft handoff.
- `src/components/graph/cypher-console.tsx` plus `src/lib/graph/cypher.ts` enforce read-only Cypher before API execution.
- `src/lib/graph/diff-engine.ts` powers the Desk "what changed" panel and `/api/graph/changes`.
- `src/lib/api/with-ai-act-ack.ts` gates high-risk verbs with `X-AI-Act-Ack`.
- `src/lib/api/with-firewall.ts` is the shared calibrated AI response firewall: JSON outputs are claim-extracted, scored, annotated with firewall metadata, and routed to claim-level Trust Score persistence.
- `src/lib/firebase/claims-service.ts` persists claim Trust Score records under `users/{uid}/situations/{situationId}/claims/{claimId}`.
- `src/lib/ontology/registry.ts` maps active case domains to the nine Pack 20 ontology lenses: conflict, mediation, governance, narrative, human-rights, economic, humanitarian, legal, and security over the ACO/TACITUS primitive substrate.
- `src/components/ontology/OntologySchemaViewer.tsx` renders the Workbench Ontology tab.
- `src/lib/graph/workbench-case-graph.ts` and `src/components/graph/PraxisGraphCanvas.tsx` provide the canonical Workbench graph view.
- `src/lib/tools/marketplace/registry.ts`, `src/components/tools/ToolMarketplace.tsx`, and `src/lib/tools/marketplace/run-artifact.ts` provide the 16-tool marketplace and permissive artifact persistence contract.
- `src/types/memo.ts`, `src/lib/memo/templates/registry.ts`, and `src/components/memo/MemoStudio.tsx` provide the Memo Studio foundation with six launch templates and graph/source citation-ready blocks.
- `src/lib/kg/backend.ts`, `backend/migrations/versions/0011_postgres_kg_contract.py`, and `docs/architecture/KG_BACKEND.md` document the Postgres-first KG direction while retaining Neo4j as an optional legacy/reflective mode.
- `docs/codex-prompts/PRAXIS_CODEX_09_VERIFICATION_AND_ADMIN.md`, `docs/codex-prompts/PRAXIS_CODEX_10_POSTGRES_KNOWLEDGE_GRAPH.md`, and `docs/codex-prompts/PRAXIS_CODEX_11_MEMO_STUDIO_AND_LAUNCH.md` preserve the next-pack prompts for Codex/subagent continuation.
- `src/lib/graph/neo4j-drift-verifier.ts`, `scripts/verify-neo4j-sync.ts`, `/api/cron/verify-neo4j-sync`, and `infrastructure/scheduler/neo4j-drift-verifier-cron.yaml` form the Firestore-to-Neo4j drift verification path.
- `tests/e2e/personas/` contains the diplomat, mediator, analyst, and researcher Playwright workbench flows.

## Validation Commands

Run these before merging or deploying:

```bash
npx tsc --noEmit
npm run lint
npm run build
npx vitest run
npm run audit:routes
npm run audit:workbench
npm run audit:landing
npm run audit:context-vs-tools
npm run audit:ontology
npm run audit:tool-marketplace
npm run audit:graph-viewer
npm run audit:codex-prompts
npm run audit:reality-check
npm run audit:kg-backend
npm run audit:memo-studio
npm run verify:neo4j-sync
npx tsx scripts/audit-spine.ts
npx tsx scripts/audit-phase3-product-surface.ts
npx tsx scripts/audit-verb-hookup.ts
```

Known lint baseline: zero errors with existing warnings allowed.

## Future-Agent Rules

1. Work from a clean branch/worktree; do not reuse `C:\Users\giuli\praxiscodexworking` for shipping merges if it is dirty.
2. Keep `main` deployable. Fetch before merging and never rewrite public history.
3. Every `src/app/api/ai/**/route.ts` must use `withCalibration` unless listed as exempt in `scripts/audit-ai-routes.mjs`.
4. Add Firestore rules and indexes with any new collection/query pattern.
5. Prefer deterministic/local fallbacks for demos and tests; gate expensive provider calls.
6. Keep the public product story aligned with the eight surfaces, not the older 10-tool or 12-hero wording.

## Production Checklist

After merge to `main` and Cloud Build:

```bash
curl -fsSL https://praxis.tacitus.me
curl -fsSL https://praxis.tacitus.me/api/health
curl -i -X POST https://praxis.tacitus.me/api/ai/forecast -H "Content-Type: application/json" -d "{}"
```

Expected unauthenticated protected routes return `401`. With a valid authenticated session, high-risk AI routes without `X-AI-Act-Ack` return `428`.

## Production Verification on 2026-05-06

| Check | Result |
|---|---|
| `https://praxis.tacitus.me` | `200`, landing includes "Eight surfaces" and the eight-surface app copy. |
| `https://praxis.tacitus.me/api/health` | `200`, status `ok`; Firestore, AI provider, cookie secret, and Vertex ADK green; Polar unconfigured. |
| `POST /api/ai/forecast` unauthenticated | `401`, confirming the calibrated AI route is auth-protected before the AI Act acknowledgement gate. |
| Playwright public smoke | 4 passed against production. |
