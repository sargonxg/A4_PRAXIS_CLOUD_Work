# PRAXIS Tool Catalogue

This folder holds one Markdown file per tool. Each file is the canonical
"micro-app" specification for that tool: what it does, what data it consumes
from the active Situation and AnalystProfile, what it persists, what AI route
backs it, what frameworks it implements, and how to extend it.

The catalogue is generated and maintained alongside the code. Every time a
tool is added, removed, promoted (PARTIAL → READY) or hidden, update the
matching file here in the same commit.

> **Single source of truth for IDs:** `src/lib/constants/tool-registry.ts`.
> The filename here matches the tool's `id` field exactly so cross-linking is
> mechanical: `docs/tools/{id}.md`.

## How to read a tool doc

Every doc is structured the same way:

1. **Status** — READY / PARTIAL / PLACEHOLDER / HIDDEN (mirrors the audit
   in `docs/SPRINT_2026-04-25.md`)
2. **Route** — `/app/<id>` and the API route(s) under `/api/ai/<route>`
3. **Inputs (read)** — which parts of `AnalystProfile` and `Situation` the
   tool reads, and from which Firestore paths or live feeds
4. **Outputs (persist)** — Firestore path the tool writes to, plus any
   downstream Pub/Sub topics it publishes
5. **Frameworks & data sources** — the academic frameworks and external
   feeds the tool grounds in
6. **AI model** — which provider tier is used (Gemini Flash / Pro / Claude
   / Vertex ADK)
7. **Extension surface** — how to add a new field, support a new domain, or
   wire a new feed
8. **Operations** — env vars, cost characteristics, common errors

## Status legend

- **READY** — production-quality. Page renders real UI, AI route works,
  output persists per-situation, situation guard active, calibration on.
- **PARTIAL** — has UI + AI but is missing one of: output persistence,
  situation guard, calibration wrapper. Promotion is mechanical.
- **PLACEHOLDER** — UI shell or stub only. Currently hidden or labelled
  "coming soon" until backed by a real route.
- **HIDDEN** — exists in the registry but is not surfaced in the sidebar
  (e.g., Source Monitor, Alert Center cron-only).

## Coverage

The full audit is in `docs/SPRINT_2026-04-25.md` §"What we know now".
Headline counts as of 2026-04-25:

| Status | Count |
|---|---|
| READY | 34 |
| PARTIAL | 8 |
| PLACEHOLDER | 6 |
| **Total registered** | **47** |

## Tools with deep docs in this folder

The full set of 47 tool docs is being written incrementally — priority is
the high-traffic tools first, then PARTIAL → READY promotions, then the
long tail. Tools that already have a doc in this folder:

- `dashboard.md` — Situation overview hub
- `briefing.md` — UN-DPPA-style intelligence briefing
- `assistant.md` — Multi-tool chat assistant
- `early-warning.md` — Glasl-stage escalation monitor
- `argus.md` — Deep web research
- `scenarios.md` — Monte Carlo scenario planner

If the tool you need isn't here yet, the registry definition in
`src/lib/constants/tool-registry.ts` (one entry per tool, ~50 lines each) is
the de-facto interim spec until the full doc is written. Every tool's
registry entry already includes `frameworks`, `dataSources`, `relatedTools`,
`requiredSituationFields`, `methodology`, `staleAfterHours`, and `modelTier`
— that is enough to wire a new tool or migrate an existing one.

As of 2026-04-30, every registered tool also has a computed operating contract
in `src/lib/tools/tool-operating-contracts.ts`. That contract defines objective,
user value, applicability, required questions, expected outputs, Ask PRAXIS
writeback actions, situation inputs, persistence expectations, and quality bar.
Run `npm run audit:tool-contracts` to regenerate the verification report in
`docs/audits/tool-contracts-YYYY-MM-DD.md`.

As of the same sprint, every registered tool also has a computed context
blueprint in `src/lib/tools/tool-context-blueprints.ts`. The blueprint declares
required context layers, database paths, graph-backbone mode, evidence policy,
document-production/LibreOffice readiness, and future Dialectica role. Generated
per-tool specifications are no longer committed; refresh them locally with
`npm run generate:tool-docs` when a tool-contract review needs the expanded
artifact set.

## Authoring guidance for future docs

When adding a new tool's doc:

1. Copy `docs/tools/_TEMPLATE.md` to `docs/tools/<id>.md`.
2. Fill in every section. Don't skip — empty sections will be filled
   later anyway, and the template enforces consistency across the
   catalogue.
3. Cross-link liberally to other tool docs via relative paths (e.g.,
   `[Early Warning](./early-warning.md)`).
4. Update the "Tools with deep docs in this folder" list above.
5. If you change the tool's status (PARTIAL → READY), mirror the change
   in `docs/SPRINT_2026-04-25.md` and `docs/CONTINUATION.md`.

## Changes since 2026-04-25

- Geospatial Monitor: now reads `Situation.region` via
  `src/lib/geo/region-centers.ts` for the initial map centroid when no
  explicit `geoBoundingBox` is set. Previously defaulted to Sudan for
  every bbox-less situation.
- Strategic roadmap and generated tool-doc history were retired during the
  Tasklet-style ContextCapsule cleanup. Current tool behavior lives in the
  registry, operating contracts, and runtime audits.
