# PRAXIS Vision v4 - MVP Build Plan

Status: canonical build direction for the v5 MVP build
Date adopted: 2026-05-10
Source: `docs/build/PRAXIS_v5_BUILD_01_AGENT_OPERATING_GUIDE.md`

This document records the build direction required by Phase 0. The executable
prompts live in:

- `docs/build/PRAXIS_v5_BUILD_02_BACKEND_PHASES_0-3.md`
- `docs/build/PRAXIS_v5_BUILD_03_FRONTEND_AND_SHIP.md`

## MVP Scope

The MVP build is intentionally phased so the repository can be worked by Codex,
Claude Code, Antigravity agents, and human operators without losing source of
truth. Phase 0 and Phase 1 are sequential. Wave 2 can split into parallel
lanes after Phase 1.

## Phase Plan

| Phase | Goal | Sequential / Parallel | Wave | Estimated Effort |
|---|---|---|---|---|
| Phase 0 | Vision adopt + persona addendum + 4 ADRs | sequential | 1 | 1-2 days |
| Phase 1 | Ontology layer surfacing + 3 work ontologies + tacitus-ontology MIT package | sequential | 1 | 3-5 days |
| Phase 2A | Context page shell + 8-panel sidebar | parallel | 2 | 1 week |
| Phase 2B | Document pipeline (Docling + GLiNER + Gemini extraction) | parallel | 2 | 1 week |
| Phase 2C | Research pipeline (Google Grounded + Wikidata) | parallel | 2 | 1 week |
| Phase 2D | Source Tier system + audit | parallel | 2 | 3 days |
| Phase 2E | Episode + Timeline module | parallel | 2 | 4 days |
| Phase 3 | User Models module + 3 seeded personas + capture loop | parallel | 2 | 1 week |
| Phase 4 | Methods marketplace + Top 10 Methods | parallel | 3 | 2 weeks |
| Phase 5 | Ask homepage + Public landing | sequential | 4 | 1 week |
| Phase 6 | Drafting Studio + 5 templates | sequential | 4 | 1.5 weeks |
| Phase 7 | Subagent runtime on Vertex Agent Engine | parallel | 3 | 1 week |
| Phase 8 | Demo seeding (3 Contexts) + Polish + Ship | sequential | 5 | 1.5 weeks |

## ADR Topics

Phase 0 opens four Proposed ADRs:

- User Models as first-class versioned artifacts.
- Two-context product model on dual ontology layer.
- Seven logical graphs behind one user-facing graph.
- Twelve named LLM/graph interaction patterns.

These ADRs are Proposed until Giulio signs them off. Phase work can use them as
planning anchors, but Accepted status requires explicit approval.

## Build Governance

Every phase updates `docs/build/PRAXIS_v5_EXECUTION_LEDGER.md`, runs the
phase-specific verification commands, stages explicit files only, and pushes
to `main` only after validation.
