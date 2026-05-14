# PRAXIS Full Build-Solution Audit

Date: 2026-05-14
Repo: `C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work`
Branch: `main`
HEAD: `a213eb3efe487832796966db2cf8de4a4ce74161`

## Executive Verdict

PRAXIS should be built as a simple policy workbench over a much deeper
context, evidence, and reasoning backend.

The best product shape is not another tool marketplace and not a generic chat
app. The best solution is:

1. One universal Ask PRAXIS command surface.
2. One active context capsule that carries User, Situation, Sources/Documents,
   Graph, Time, and Output posture.
3. Three or fewer recommended next moves instead of visible tool sprawl.
4. A memo-first output pipeline where every serious answer can become a
   reviewable work product with citations, gaps, and handover state.
5. A trust layer that makes evidence coverage, source freshness, graph
   readiness, and claim support inspectable.
6. A hidden deterministic backend spine for extraction, actor/event
   canonicalization, graph deltas, retrieval, and audit.

PRAXIS is already moving in this direction. The next work should consolidate
and harden it, not add new visible surfaces.

## What PRAXIS Is Becoming

PRAXIS is a policy-analysis workspace for people who need AI to reason from
their actual context:

- who the user is;
- what situation they are working on;
- which sources and documents are trusted;
- which actors, claims, constraints, events, and commitments matter;
- what output is needed;
- what evidence is weak or missing.

The durable product frame is:

```text
Ask PRAXIS
  -> active capsule
  -> source/document/graph retrieval
  -> recommended next moves
  -> memo / brief / handover output
  -> reviewable evidence and graph deltas
```

The visible product should stay small. The backend can be powerful, but the
normal user should not have to understand every route, provider, subagent, or
tool registry to get value.

## Current Repo Reality

### Strong Foundations

- The README, DESIGN contract, architecture docs, and STATUS all agree on the
  core direction: Ask PRAXIS first, User/Situation Cores, source-grounded work,
  memo output, and small surface area.
- The authenticated app now has grouped navigation in
  `src/lib/navigation/primary-nav.ts`: Workspace, Advanced, and
  Administration.
- A capsule service now exists in `src/lib/context/capsule-service.ts`.
  It supports create, list, activate, fork, version bump, and legacy
  `contextStacks/default` migration.
- Capsule API routes now exist under `src/app/api/context/capsules/*`,
  including share/import support.
- Trust posture is implemented at `GET /api/context/trust-posture` with
  evidence coverage, source freshness, graph readiness, claim support, and
  missing gaps.
- Ask-to-memo provenance exists through `/api/memos/from-ask` and
  `src/lib/memo/from-ask.ts`.
- Read/tool audit events exist in `src/lib/audit/read-ledger.ts`.
- Next moves are centralized in `src/lib/assistant/next-moves.ts` and locked
  to max three visible moves.
- AI route calibration is intact: `npm run audit:routes` reports 67 AI route
  files, 67 calibrated, 5 exempt.
- Production health is good at the time of this audit: `/api/health` reports
  Firestore, AI provider, cookie secret, and Vertex ADK as `ok`.

### Current Drift / Risk

- The app still has many route-era remnants:
  `/app/cases`, `/app/situations`, `/app/profile`, `/app/tools`,
  `/app/workbench`, `/app/dashboard`, `/app/canvas`, settings subsections,
  and admin pages. Some are valid Advanced/Admin surfaces, but the normal path
  still feels larger than the product contract.
- `src/app/api/ai/chat/route.ts` is too large. It resolves calibration,
  system identity, product explanation, RAG, graph context, tool routing,
  streaming, response actions, and persistence in one route. This works but
  should be split into smaller backend units.
- Genkit exists but is not yet the dominant AI route runtime. The Genkit audit
  reports only 1/67 `src/app/api/ai` routes importing Genkit flows and 1/12
  sprint target routes migrated.
- Genkit is also still Google-AI-key-first rather than Vertex-first, while the
  production app is configured for Vertex/GCP posture.
- The graphify report is stale relative to HEAD: graph was built from
  `5f6aff8a`, while this audit is at `a213eb3e`.
- Cognee remains disabled/unconfigured by design. Do not market live memory
  until the separate service is deployed and verified.
- Billing/checkout is not fully proven; Polar remains unconfigured in health.
- Persona CI has not reached the required 10 consecutive green runs.

## Best Build Solution

### Product Architecture

Build PRAXIS around three primary user objects:

1. Capsule
   - The live bundle of User Core, Situation Core, sources/documents, graph,
     time posture, output goal, retrieval policy, health, provenance, and
     version.
   - This is what Ask PRAXIS, Memo Studio, Canvas, and tools all inherit.

2. Thread
   - The Ask PRAXIS reasoning session.
   - It should record the prompt, capsule id/version, tool chips, source
     receipts, selected next moves, response actions, and memo handoff state.

3. Work Product
   - Memo, brief, talking points, handover note, export.
   - It must preserve citations, claim checks, graph snapshot id, and
     unsupported gaps.

Everything else is support infrastructure.

### UX Shape

The normal user should see:

- `Ask PRAXIS`: ask and route the work.
- `Cores` or `Home`: assemble/swap/fork the active capsule.
- `Library`: attach and inspect sources/documents.
- `Memo Studio`: write and export work product.
- `Canvas`: inspect structure and graph posture.
- `Advanced`: inspect tools, traces, diagnostics, and raw machinery.

The open product decision is whether the primary nav should say `Home` or
`Cores`. The current code uses `Cores` in the Workspace group and moves `Home`
under Advanced. That is defensible if the capsule/core library is now the
main assembly surface, but the design contract still names Home as a primary
surface. This should be resolved explicitly in `DESIGN.md` and navigation
tests.

### Backend Shape

Keep the frontend simple and make the backend stronger:

- `resolveActiveCapsule()`
- `buildRuntimeContextPack()`
- `retrieveEvidence()`
- `classifyAskIntent()`
- `selectNextMoves()`
- `runToolOrAnswer()`
- `persistAskTurn()`
- `createMemoSourceFromAsk()`
- `proposeReviewOnlyGraphDelta()`
- `writeReadAuditEvent()`

This lets Ask PRAXIS become orchestration over typed contracts instead of one
large route doing everything.

### Knowledge-Layer Boundary

Keep PRAXIS focused on user context, analysis, writing, review, and handover.
Use DIALECTICA as the future ingestion/knowledge layer through a narrow
adapter:

- ingest source/document/url/dataset;
- query cited nodes, edges, passages, confidence, and temporal scope;
- propose graph deltas for review;
- run reasoning recipes;
- explain traces.

Do not couple PRAXIS directly to KAIROS or AGON UI concepts. Let KAIROS and
AGON feed DIALECTICA, and let PRAXIS consume reviewed, provenance-bearing
knowledge from DIALECTICA.

## Recommended Build Order

### Wave 1 - Lock The Capsule Spine

Goal: make capsule the single inherited context object.

Deliverables:

- Make every Ask PRAXIS request resolve exactly one capsule.
- Make Memo Studio and Canvas read the same capsule id/version.
- Keep `contextStacks/default` only as compatibility.
- Add signed-in tests for capsule activation, reload, Ask, and memo handoff.
- Update the visible context strip so it shows the real active capsule.

Why first: every later feature depends on stable inherited context.

### Wave 2 - Split Ask PRAXIS Into Backend Units

Goal: turn `src/app/api/ai/chat/route.ts` into orchestration.

Deliverables:

- Extract prompt construction.
- Extract capsule/context resolution.
- Extract runtime selection.
- Extract tool invocation receipt writing.
- Extract thread/output persistence.
- Add tests around intent -> answer/tool/memo routing.

Why second: Ask PRAXIS is the product front door and currently carries too
much logic in one place.

### Wave 3 - Memo-First Output Pipeline

Goal: every serious answer becomes reusable work product.

Deliverables:

- Persist Ask answers as structured output records.
- Preserve source receipts, graph snapshot, claim checks, and capsule
  version.
- Make "Send to Memo Studio" reliable after reload.
- Verify Markdown/DOCX/PDF exports preserve citation ids or source appendix.

Why third: PRAXIS value is not a chat answer; it is a defensible memo or
handover.

### Wave 4 - Source And Evidence Hardening

Goal: make the trust layer real enough for serious policy work.

Deliverables:

- Stronger source picker: `@source`, `@doc`, `@core`.
- Better PDF/page provenance and source-span citations.
- Production upload -> retrieval parity check.
- Claim check surfaced in Ask and Memo Studio.
- Review queue for graph deltas.

Why fourth: trust posture needs concrete evidence, not just score math.

### Wave 5 - Genkit / Vertex Alignment

Goal: make the Genkit layer match production's Vertex-first posture.

Deliverables:

- Initialize Genkit with `vertexAI()` from `@genkit-ai/google-genai` when
  `AI_PROVIDER=vertex` or `GOOGLE_VERTEX_PROJECT` is present.
- Keep `googleAI()` as a local/API-key fallback.
- Add a live smoke for one cheap flow after ADC is fixed.
- Migrate only the flows where Genkit adds structure: path classification,
  situation intelligence, source structuring, memo outline, and claim check.

Why fifth: Genkit should be used where it improves typed workflows, not
blindly across every route.

### Wave 6 - Route And Tool Surface Cleanup

Goal: remove visible complexity without deleting needed backend capability.

Deliverables:

- Redirect or demote legacy normal-user pages.
- Keep specialist tools hidden behind Ask routing or Advanced/Admin.
- Keep max-three-next-moves invariant.
- Update route audits so old URLs cannot silently return full legacy pages.

Why sixth: do this after the core flows are stable, or deletion will break
useful escape hatches.

### Wave 7 - DIALECTICA Adapter Proof

Goal: prove the future knowledge-layer boundary with one end-to-end path.

Deliverables:

- One typed PRAXIS-to-DIALECTICA query.
- One cited answer returned to Ask PRAXIS.
- One reviewable graph delta.
- One explain-trace view.

Why seventh: PRAXIS should not become the ingestion monolith, but the adapter
must be real before the product can honestly claim deeper knowledge-layer
power.

## What Not To Do

- Do not add another normal-user top-level surface.
- Do not expose 55 tools as the default user experience.
- Do not promote Cognee/memory as live until the separate service is deployed.
- Do not auto-promote extracted facts into the canonical graph.
- Do not add a new database for workflow state; use the existing owner-scoped
  Firestore paths unless a specific backend contract requires otherwise.
- Do not wire KAIROS or AGON directly into the PRAXIS UI.
- Do not weaken `withCalibration`, owner scoping, or route audits.

## Evidence And Validation

Commands run during this audit:

```text
git status --short --branch
git log --oneline -5
npm run audit:routes
npm run audit:genkit-coverage
npm run audit:mvp-route-shape
npm run audit:next-moves
npm run audit:capsule-contract
npm run audit:admin-only-internals
npm run audit:names
GET https://praxis.tacitus.me/api/health
```

Results:

- `audit:routes`: pass, 67/67 AI route files calibrated, 5 exempt.
- `audit:genkit-coverage`: informational pass, but only 1/67 AI routes use
  Genkit flows and 1/12 sprint targets are migrated.
- `audit:mvp-route-shape`: pass.
- `audit:next-moves`: pass, max-three invariant holds.
- `audit:capsule-contract`: pass.
- `audit:admin-only-internals`: pass, 7 internal paths verified.
- `audit:names`: pass with warnings for intentional name collisions:
  `Ask PRAXIS` and `Commitment Tracker`.
- Production `/api/health`: `status=ok`; Firestore, AI provider, cookie
  secret, and Vertex ADK are `ok`; Cognee and Polar are unconfigured.

Checks not rerun in this audit:

- Full `npm run build`
- Full `npm run audit:gate`
- Full `npx vitest run`
- Authenticated browser smoke
- Live upload -> retrieval -> memo export flow

## Bottom Line

The best way to build PRAXIS is to stop thinking of it as "many AI tools" and
finish turning it into a capsule-centered policy workbench.

Ask PRAXIS should be the front door. Capsule should be the inherited context.
Memo Studio should be the output destination. Canvas and Advanced should make
the reasoning inspectable. DIALECTICA should become the knowledge layer behind
the scenes. Genkit/Vertex should be used for typed, observable AI workflows,
not as a branding layer over every route.

The next concrete slice should be Wave 1: make the capsule spine the single
runtime contract across Ask, Library, Canvas, and Memo Studio, with signed-in
tests and production-safe evidence.
