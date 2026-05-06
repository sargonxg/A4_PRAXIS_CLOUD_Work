# PRAXIS Comprehensive Audit

Date: 2026-05-06

## Executive Summary

PRAXIS is now a unified case workbench for diplomatic, mediation, policy, and research users. The product centers on cases, source receipts, ontology-backed graph structure, context health, curated tools, and memo production.

The current codebase is launch-foundation ready, not finished in every pack-13 sense. The Workbench, ontology, graph, context-aware advisory substrate, signed conversation context, Tool Contract v2, tool skills, tool recommendations, permissive firewall, tabbed admin, Postgres KG repository foundation, and Memo Studio draft workflow with owner-scoped server persistence are real and verified. The remaining launch gaps are backend depth: live Cloud SQL migration execution, ingestion cutover, full marketplace handlers, LangGraph subagent runtimes, and operational dashboards.

## What's Done

| Area | Status | Quality | Notes |
|---|---|---|---|
| Workbench shell | DONE | B | Unified tabs and example cases are live. |
| Landing entry | DONE | B | Workbench-first entry, Syria as example. |
| Context/tools separation | DONE | B | Context health and firewall gates are wired. |
| Ontology system | DONE | B | Four front-end ontology definitions over ACO primitives. |
| Graph view | DONE | B | Canonical case graph scaffold is visible. |
| Tools marketplace | DONE | B | 16-tool registry and UI, execution deferred. |
| Verification docs | DONE | B | Reality check, backlog, prompt preservation. |
| Admin consolidation | DONE | B | `/app/admin` now owns tabs; old admin subroutes redirect. |
| Postgres KG direction | PARTIAL | B+ | Schema contract, default flag, and owner/case-scoped repositories present; deploy cutover deferred. |
| Memo Studio | DONE | B+ | Templates, block editing, local/server version history, and Markdown/DOCX/PDF draft export present. |
| Context architecture v2 | DONE | B+ | Four-layer model, advisory middleware, signed conversation token, and runtime provider present; LangGraph orchestration deferred. |
| Tool-context interop | DONE | B+ | Tool Contract v2, skills, suggestions, ContextProvider DI, and default projection present. |

## What's Broken

| Gap | Severity | Owner | Timeline |
|---|---|---|---|
| Postgres graph production cutover is not complete | S2 | Backend | v1.1 |
| Tool marketplace cards are not all executable | S2 | AI/tools | v1.1 |
| Seven-panel diagnostics dashboard is incomplete | S2 | Ops/admin | v1.1 |
| Context Preparer and new subagent runtimes are not live | S2 | Backend/agents | v1.1 |

## What's Next

See `docs/roadmap/v1.1-and-beyond.md` for the prioritized roadmap.

## Launch Readiness

The repo now has gates for Workbench, landing, context/tools, ontology, marketplace, graph viewer, prompt preservation, KG backend, Memo Studio, and reality-check docs. Production deployment verification must confirm the final commit SHA is serving at `https://praxis.tacitus.me`.
