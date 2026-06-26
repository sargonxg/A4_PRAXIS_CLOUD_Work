# Ask Praxis — With & Without Capsules (Production-Ready Agentic Workflow)

**Date:** 2026-06-26
**Owner:** Giulio Catanzariti
**Status:** Draft for approval
**Target surface:** `praxis.tacitus.me` (Cloud Run `praxis-frontend`)

---

## 1. Goal

Make the **Ask Praxis** agentic workflow work **with and without capsules**, with real agents
running that: check sources, respect temporality, structure ontologies, and respond excellently to
user requests. Ship it fully production-ready to `praxis.tacitus.me`.

## 2. Current state (verified)

- Entry: `/api/ai/ask-praxis/route.ts` → aliases `/api/ai/chat/route.ts`.
- Engine: `streamText()` with `stepCountIs(15)` and 6 real tools (grounded search, Exa,
  Vertex ADK deep research, research-graph over BigQuery/WikiData/GDELT, write-to-tool,
  propose-graph-delta). Provider: Vertex AI (Gemini 3.5 Flash primary, 2.5 Flash fallback).
  **So a bounded multi-step agent loop already exists** — the work is to make it genuinely
  agentic and to remove the no-capsule blocker.
- **Blocker:** `chat/route.ts:181-191` — if `hasConversationCapsuleSignal()` is false, the
  request is hard-rejected with `412 capsule_context_required`. Ask Praxis therefore **cannot run
  without a capsule today**. This is the opposite of the goal.
- Capsule-grounded path is mature: `buildEnrichedTurnCapsule()`
  (`src/lib/knowledge/context-enrichment-adapter.ts`), `buildCapsuleEvidencePack()`,
  temporality (`src/lib/context/temporal-timeline.ts`), ontology binding
  (`src/types/context-capsule.ts`).
- Baseline `npm run typecheck` is green.

## 3. Decisions (approved by user 2026-06-26)

1. **No-capsule mode = Ephemeral "Instant Context".** Auto-synthesize a throwaway capsule from
   the prompt (domain detect → light ontology → sourcing + temporality policy) → run the same
   grounded agent loop. Offer to save it as a real capsule.
2. **Agent depth = bounded multi-step loop** (build on the existing 15-step loop, make it real).
3. **Cleanup = surgical + targeted** (remove dead/demo scaffolding only in touched paths).
4. **Deploy = preview/canary then promote.**

## 4. Architecture

### 4.1 New unit: Instant Context builder

`src/lib/ai/instant-context.ts`

- `buildInstantContextCapsule({ uid, prompt, situation? }): Promise<InstantContextResult>`
  where `InstantContextResult = { turnCapsule: TurnCapsule; capsuleContext: InjectableContext;
  ephemeral: true; rationale: string }`.
- Pipeline (cheap, single fast model call + deterministic assembly):
  1. **Domain + intent detect** — reuse `classifyAskIntent()`; add a light domain classifier
     (diplomacy / armed-conflict / humanitarian / economic / legal / general) via a small
     structured Gemini-flash call (`src/lib/ai/providers.ts` model ids only).
  2. **Light ontology** — map detected domain → a minimal `ontologyBinding` (domainId,
     a small ACO primitive set, taxonomyPath) reusing existing domain ontology registry.
  3. **Sourcing policy** — default `mode: 'live-search'`, min 1–2 sources/claim, recency window
     by domain (news 30d, legal/treaty multi-year), required source types per domain.
  4. **Temporality** — anchor `as-of = now`; if `isTemporalIntent(prompt)`, widen window and
     flag timeline handling.
  5. Assemble a `TurnCapsule` + `InjectableContext` shaped exactly like the enriched path, marked
     `ephemeral: true`, `trust.level: 'amber'`, health note "instant context (not saved)".
- Reuses existing prompt-block builders so the system prompt layering is identical to the
  capsule path — no divergent prompt code.

### 4.2 Chat route change (the gate)

`src/app/api/ai/chat/route.ts`

- Replace the `412` early-return with: if no capsule signal **and not demo mode**, build an
  instant-context capsule and continue on the normal live path. Tag `turnMetadata.contextMode =
  'instant'` so receipts/UI reflect it.
- In instant mode, drive the evidence pack from **live search tools** (grounded search / research
  graph) instead of the situation corpus (which is empty without a capsule).
- Keep the 412 only for a genuinely malformed/abusive request (none — instant always succeeds).

### 4.3 Agent loop quality (engine)

- Strengthen the Ask Praxis system prompt to enforce an explicit agentic contract in **both**
  modes: (a) plan briefly, (b) **call a search/grounding tool whenever the answer depends on
  current or checkable facts**, (c) structure findings against the (instant or real) ontology and
  propose graph deltas when warranted, (d) answer with inline citations + a claim ledger, naming
  evidence gaps honestly.
- Ensure `groundedSearchFetch` and `researchGraphSearch` are **enabled by default in instant
  mode** (today some are server/tier gated). Premium tools (Exa, Vertex ADK deep research) stay
  tier-gated.
- Temporality: ensure `isTemporalIntent()` expansion runs in instant mode too.
- Keep `stepCountIs(15)`; add budget receipts already present (`AskGenerationBudgetReceipt`).

### 4.4 Frontend

`src/components/ask/*`

- When `contextMode === 'instant'`: show an "Instant context (not saved)" chip + a one-click
  **"Save as capsule"** action (POST to existing capsule-create with the ephemeral payload).
- Provenance/quality strips already render from receipts — feed them instant-mode receipts so
  source-spine, citations, and temporal badges show in both modes.

## 5. Error handling

- Instant-context build failure → fall back to the existing `buildThinCapsuleFallback()` (amber)
  rather than 412, so the user always gets an answer with an honest trust signal.
- Live-search tool failure → degrade to model-knowledge answer with explicit "unverified" claim
  badges (no silent confident answers).
- All failures emit `AskContextHealthDegradation` receipts (existing mechanism).

## 6. Testing

- Unit (Vitest): `instant-context` builder (domain/ontology/sourcing/temporality assembly);
  no-capsule route path returns a streamed answer (not 412); evidence-pack scoring; temporal
  detection; tool gating in instant vs capsule mode.
- Integration: capsule path unchanged (regression), instant path produces citations.
- Live smoke (canary): two real Ask turns — one with a capsule, one without — asserting sources,
  temporality handling, and ontology structuring appear in responses.

## 7. Production rollout

1. Green: typecheck, lint, `vitest run`, `next build`.
2. Canary: deploy Cloud Run revision with **no traffic** (or staging service); run live smoke.
3. Verify Ask with + without capsule on the canary URL.
4. Promote revision to `praxis.tacitus.me`.
5. Operational: schedule `/api/cron/agent-runs-sweep` (Cloud Scheduler, every 15m).

## 8. Execution model (strategy engine + codex)

- I act as strategy engine: scope, design, integrate, review, verify, deploy.
- Token-intensive code reading and first-draft implementation of self-contained units
  (e.g. `instant-context.ts`, test files) are delegated to `codex exec` and/or subagents; I
  review and integrate every change. Nothing merges without a green typecheck + tests.

## 9. Out of scope (YAGNI for this pass)

- Sigstore crypto verification of DIALECTICA imports (deliberate boundary).
- Capsule marketplace expansion.
- Cognee memory layer (stays disabled).
- Broad refactors beyond touched paths.

## 10. Success criteria

- Ask Praxis answers **with a capsule** and **without one** (no 412), both with real agent tool
  calls, source checking, temporality, and ontology structuring visible in receipts.
- All checks green; canary smoke passes; promoted to `praxis.tacitus.me`.
