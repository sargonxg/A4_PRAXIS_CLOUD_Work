# CODEX TASK BRIEF — Context Capsule System Overhaul

**Repo:** `A4_PRAXIS_CLOUD_Work` (PRAXIS by TACITUS)
**Date:** 2026-05-28
**Owner:** Giulio Catanzariti
**Scope:** The Context Capsule subsystem end-to-end — creation (factory), data model, quality/readiness, persistence, Capsule+ export/graph, Cognee memory integration, and consumption inside the agentic runtime.

> **Read this whole brief before writing code.** It is a single coordinated overhaul, not a list of unrelated tickets. Where work items conflict, the ordering in §0 wins. Do NOT regress existing passing tests. Every work item below has explicit acceptance criteria — satisfy them and add tests. Run `npm run lint`, `npm run typecheck`, `vitest run`, and the relevant `scripts/audit-capsule-*.ts` audits before declaring any item done. Backend Python changes must pass `backend/tests`.

---

## 0. CONTEXT & GUARDRAILS (read first)

### What a Context Capsule is today
A capsule is the unit of governed context handed to agents. Canonical store is Firestore: `users/{uid}/capsules/{capsuleId}` with subcollections `versions/`, `reviewCards/`, `notes/`. There are **three overlapping schema layers**:

- **v1** (`src/lib/context/capsule-service.ts`): the `PraxisCapsule` envelope — `capsuleId`, `ownerUid`, `label`, `summary`, `scope`, `coreRefs` (12 core kinds: user, situation, source, document, graph, time, output, tool, objective, product, memory), `trust`, `health`, visibility/sharing. `schemaVersion` is hardcoded to `2` on create (`capsule-service.ts:~465`).
- **v2** (`src/lib/context/capsule-v2.ts`): narrative/sourcing/reasoning layer — `claimLedger[]`, `sourceRefs[]`, `reasoningScaffold`, `outputContracts[]`, `sourcePosture`, `humanGate`, `agentPermissions`, `reviewState`. Has its own `capsuleHealth.score = 100 - diagnostics.length*20`.
- **v3** (`src/lib/context/capsule-v3.ts`): governance + tacit-knowledge + memory layer — 13 sections incl. `humanTacitKnowledge`, `agentOperatingContract`, `memoryPosture` (`canonicalCapsuleFacts[]`, `advisoryCogneeRecall[]`, `cogneeDatasetId`, `cogneeMode:'advisory-only'`), `governance`, `marketplaceProfile`, `evaluation` (5 sub-scores), shelves + badges. **v3 is defined but never auto-applied** — new capsules never become v3.

The factory (`src/lib/agent-runtime/capsule-factory.ts` → 4 Genkit flows in `src/lib/genkit/flows/capsule-factory.ts`) builds drafts: intake (Gemini 2.5 Flash) → research-plan (Flash) → synthesis (Gemini 2.5 Pro) → writing-profile (Flash), each with a hand-coded deterministic fallback.

Quality is computed in **three unreconciled places**: `capsule-quality.ts` (6 weighted dims, 100pts), `capsule-v2.ts` (`capsuleHealth`), and `capsule-service.ts` (`trust.score`).

Consumption: `resolveInjectableContext()` + `buildCapsulePromptBlock()` (`src/lib/agent-runtime/context-injection.ts`) render a `<praxis-context-capsule>` XML block prepended to the system prompt; `buildTurnCapsule()` (`context-kernel.ts`) wraps it. Retrieval is **by-ID only** — no semantic selection, no ranking, fixed `DEFAULT_MAX_INPUT_TOKENS=24_000`, naive char-count budgeting. `capsule-gate.ts` gates tools on missing core kinds (HTTP 412) but `staleCores` is hardwired empty.

Cognee (`backend/services/cognee_*.py`) is a **disabled-first advisory memory layer** (ADR 0049). All 8 ops (`remember/add/cognify/memify/improve/search/recall/forget`) raise `NotImplementedError` — "owned by the isolated praxis-cognee service" which does not exist yet. ACO models cap confidence at 0.600; a provenance firewall (migration 0014) rejects Cognee-origin nodes above 0.600 or outside `Claim`/`Source` layers; tenant isolation via `aco_cognee_link` RLS + dataset shape `{owner_uid}__{case_id}`. Capsule→Cognee link exists only as a **seed-pack proposal artifact** (`scripts/build-capsule-cognee-seed-pack.ts`); nothing is ingested live.

### Hard guardrails — do NOT violate
1. **Cognee stays disabled-first and advisory-only.** Do not enable Cognee by default, do not let Cognee-derived data exceed 0.600 confidence, and do not let it write canonical state without a review card. Preserve `test_cognee_no_openai_egress.py`, `test_cognee_firewall.py`, `test_cognee_tenant_isolation.py` semantics. Vertex AI only — no OpenAI/Anthropic egress from the Cognee path.
2. **Firestore remains canonical truth** for capsules. Capsule+ and Cognee are advisory/derived.
3. **No breaking changes to the public `/api/context/capsules` contract** without a versioned route or back-compat shim. Existing capsules in Firestore must keep loading.
4. **No `Co-Authored-By` lines in commits.** Commit author email: `giuliocatanzariti@gmail.com`.
5. Mobile-ready, production-quality: every UI change must be responsive and pass lint/typecheck/tests.

### Execution order (do in this sequence; later items depend on earlier)
1. §1 Schema unification + migration  →  2. §2 Factory hardening  →  3. §3 Quality reconciliation  →  4. §4 Capsule+ wiring  →  5. §5 Agentic consumption (retrieval/budget/staleness)  →  6. §6 Cognee integration  →  7. §7 Feedback loop  →  8. §8 Tests/observability/docs.

---

## 1. UNIFY THE SCHEMA (v1/v2/v3 sprawl → one versioned model)

**Problem:** Three parallel schemas, `schemaVersion` hardcoded to `2`, v3 never gates new capsules, no upgrade path. Quality and persistence read different shapes.

**Do:**
1. Create `src/lib/context/capsule-schema.ts` as the **single source of truth**: a discriminated union `CapsuleSchemaVersion = 1 | 2 | 3` with a canonical `PraxisCapsuleV3` type that **supersets** v1+v2 (envelope + v2 narrative + v3 governance/tacit/memory). Export Zod schemas for each version and a `CapsuleAnyVersionSchema`.
2. Implement pure, tested upgrade functions: `upgradeV1toV2(c)`, `upgradeV2toV3(c)`, and `normalizeToLatest(c): PraxisCapsuleV3` that idempotently lifts any stored capsule to v3 **in memory on read** (lazy migration — do not bulk-rewrite Firestore). Missing v2/v3 sections get safe empty defaults (empty `claimLedger`, `memoryPosture.cogneeMode:'advisory-only'`, etc.).
3. Change `capsule-service.ts` create path to stamp `schemaVersion: 3` and persist the full v3 envelope for new capsules. On read of older docs, run `normalizeToLatest` so all downstream code (factory, quality, injection) sees one shape.
4. Add a **migration audit + optional backfill script** `scripts/migrate-capsules-to-v3.ts` (dry-run by default, `--apply` flag) that reports how many capsules are v1/v2/v3 and can backfill on demand. Log counts; never silently truncate.
5. Wire `versions/{vN}` snapshots to store the **normalized v3 shape** so history/diff (`/history`, `/diff` routes) compare like-for-like.

**Acceptance:** New capsules persist as v3. Loading any pre-existing v1/v2 fixture returns a valid v3 object (add fixtures + round-trip tests). `audit-capsule-contract.ts` and `audit-capsule-depth.ts` pass. No call site reads `schemaVersion`-specific fields directly anymore — they go through `normalizeToLatest`.

---

## 2. HARDEN THE FACTORY (validation gates, fallback fidelity, transactional apply)

**Problems:** deterministic fallbacks are hand-coded regex heuristics with no fidelity tests; `createCapsuleReviewCard()` accepts an arbitrary `proposedEnvelopePatch` with no schema validation (agents could patch unlisted fields); applying review cards is a batch write with no transactional guarantee; `resolveCapsuleOntologyStack()` never verifies referenced ontology docs exist.

**Do:**
1. **Validate review-card patches.** Define `CapsuleEnvelopePatchSchema` (an allow-list of mutable fields: label, summary, coreRefs additions, sourceRefs, claimLedger entries, outputContracts, sourcePosture, agentPermissions). `createCapsuleReviewCard()` (`capsule-service.ts:~817`) must `.parse()` the patch and reject (typed error) any field outside the allow-list. Add an audit entry on rejection.
2. **Make review-card application transactional.** Replace the batch write (`capsule-service.ts:~898`) with a Firestore `runTransaction`: read capsule + card, apply patch, bump version, write version snapshot, flip card state to `approved`/`applied` atomically. On failure, card stays `proposed` and capsule is untouched.
3. **Fallback fidelity harness.** For each of the 4 flows, add golden tests in `src/lib/genkit/flows/__tests__/capsule-factory.fallback.test.ts` asserting the deterministic fallback produces a schema-valid, non-degenerate output for representative inputs (temporal query, handover request, sourced brief). Extract the regexes (`TEMPORAL_RE`, `TALKING_POINTS_RE`, `BRIEF_RE`, `HANDOVER_RE`) into a documented `factory-heuristics.ts` with unit tests, so LLM-path and fallback-path stay observably consistent.
4. **Validate ontology stack.** `resolveCapsuleOntologyStack()` (`~:908`) should (a) cap at 3 active ontologies (already), and (b) gain an async companion `validateOntologyStack(uid, refs)` that confirms referenced ontology docs exist in Firestore and returns diagnostics for dangling refs. Call it in the apply path; surface dangling refs as a capsule diagnostic, not a hard crash.
5. **Emit structured factory telemetry.** Every flow run (LLM success vs fallback) should emit an event via the existing `mirrorGenkitFlowEvent()` with a `path: 'llm' | 'fallback'` tag so we can measure fallback rate in production.

**Acceptance:** Patch-validation rejects an out-of-allow-list field in a test. Concurrent review-card apply test shows no lost updates. Fallback golden tests pass for all 4 flows. Dangling-ontology fixture produces a diagnostic, not an exception.

---

## 3. RECONCILE QUALITY / READINESS (one score, clear precedence)

**Problem:** Three competing quality signals: `capsule-quality.ts` (6-dim weighted 0–100), `capsule-v2.ts` `capsuleHealth` (100 − diagnostics×20), and `capsule-service.ts` `trust.score`. No precedence; UI and gate may disagree.

**Do:**
1. Make `deriveCapsuleQuality()` in `capsule-quality.ts` the **single authoritative readiness computation**. Its 6 dimensions (completeness, source_support, freshness, human_review_provenance, output_readiness, agent_operability) stay, but it must now also fold in v3 `evaluation` sub-scores (`tacitKnowledgeScore`, `sourceSpineScore`, `agentOperabilityScore`, `marketplaceReadinessScore`) as additional dimensions OR explicitly document why they are separate.
2. Make `capsule-v2.ts` `capsuleHealth` and `capsule-service.ts` `trust.score` **derive from** `deriveCapsuleQuality()` (thin adapters) rather than computing independently. Keep the field names for back-compat but route the math through one function.
3. Persist a `readiness` block on the capsule: `{ score, tier: 'red'|'amber'|'green', breakdown[], diagnostics[], computedAt }`. Recompute on every write and on review-card apply.
4. The capsule-gate (§5) and all UI badges must read this single `readiness` block.

**Acceptance:** A capsule's `trust.score`, `health.score`, and `readiness.score` are all consistent (derive from one source) — add a test asserting they agree. `audit-capsule-depth.ts` still passes.

---

## 4. WIRE CAPSULE+ (export/graph proposals are orphaned)

**Problem:** `src/lib/capsule-plus/` defines a `capsule-plus.v1` ZIP-bundle schema (manifest + capsule + GraphProposal nodes/edges + source receipts) and the `/capsule-plus` export/import routes exist, but **nothing materializes v3 graph proposals into Capsule+ bundles**, and there is no V2→V3 section upgrade tooling exposed.

**Do:**
1. Implement `materializeCapsulePlusBundle(capsule: PraxisCapsuleV3): CapsulePlusBundle` that derives `GraphProposal` nodes/edges from the capsule's `claimLedger`, `sourceRefs`, actors/commitments in coreRefs, and `memoryPosture` — typed (Actor, Claim, Commitment, Event, Source) with `AUTHORED_BY/SUPPORTS/CONTRADICTS` edges, each carrying `provenance.sourceIds` and `reviewState`.
2. Wire it into the existing `GET /api/context/capsules/[capsuleId]/capsule-plus` route so the export reflects live capsule content (not a stub).
3. On `POST /capsule-plus/import`, validate against `capsule-plus.v1` schema, map graph proposals into `reviewCards/` (state `proposed`) rather than writing graph state directly — preserves the review-gate invariant.
4. Round-trip test: export a v3 capsule → import into a fresh workspace → assert capsule + proposed review cards reconstruct.

**Acceptance:** Export of a capsule with claims/sources yields a non-empty, schema-valid graph proposal. Import creates review cards, never canonical graph writes. Round-trip test passes.

---

## 5. UPGRADE AGENTIC CONSUMPTION (semantic retrieval, token budgeting, staleness, fallback recovery)

**Problems:** by-ID-only retrieval (no ranking/semantic selection); naive char-count token budget with no per-source importance weighting; `freshnessWindowDays` is a declared policy but never enforced (`staleCores` always empty); thin fallback silently degrades with no re-attempt; no cross-capsule impact tracking.

**Do:**
1. **Semantic/ranked core selection.** In `context-kernel.ts` add a `selectCoresForBudget(capsule, turn, budget)` that ranks coreRefs/sourceRefs by relevance to the current turn (start with lexical/embedding similarity against the turn objective + recency + locked-core priority) and packs them under `DEFAULT_MAX_INPUT_TOKENS` using a real token estimate (use the existing tokenizer/`count_tokens` util if available, not raw char count). Locked cores always included; lowest-ranked dropped first with a logged note (no silent truncation — emit a `droppedCores[]` signal into the read receipt).
2. **Enforce staleness.** Add per-core `lastRefreshedAt` / `freshnessExpiresAt` to `coreRefs` (default from `freshnessWindowDays`). Implement the previously-empty `staleCores` computation in `capsule-gate.ts:24-26` so the gate flags stale sources. Surface stale cores in the `<praxis-context-capsule>` block and the FixThisFirstPanel (HTTP 412 payload).
3. **Token budget as a model, not a constant.** Make `DEFAULT_MAX_INPUT_TOKENS`/`DEFAULT_RESERVED_OUTPUT_TOKENS` configurable per model and per call; compute remaining budget from the resolved model's context window. Document the budget math.
4. **Fallback recovery.** When `resolveInjectableContext()` falls to `buildThinCapsuleFallback()`, attempt **one** bounded re-resolution (retry the capsule fetch) before degrading, and emit a runtime warning/telemetry event so degraded turns are observable instead of silent. If still failing, keep the thin-capsule behavior but include an explicit `recoveryAttempted: true` flag in the receipt.
5. **Cross-capsule impact.** Add `getCapsuleDependents(uid, capsuleId)` (reads `associatedCapsuleIds[]` reverse index) and, when a source/claim is added via review card, write a lightweight `dependencyInvalidation` note to dependent capsules' `notes/` subcollection so downstream readiness can be re-evaluated. No automatic mutation of dependents — flag only.

**Acceptance:** A capsule exceeding the token budget packs the highest-ranked cores and reports `droppedCores`. A stale source produces a non-empty `staleCores` and a 412 fix prompt. Thin-fallback path logs a recovery attempt. Dependents of an edited capsule receive an invalidation note (test).

---

## 6. WIRE COGNEE INTO CAPSULES (advisory recall, seed-pack consumption, review surface)

**Problem:** v3 `memoryPosture` defines `advisoryCogneeRecall[]` + `cogneeDatasetId` + `cogneeMode:'advisory-only'` but nothing recalls from Cognee or injects advisory facts; the seed-pack is a static artifact never consumed; all backend ops are `NotImplementedError`; there is no UI to review Cognee candidates. **Keep Cognee disabled-first** — build the wiring so it is *ready* and *safe*, gated behind `COGNEE_ENABLED`.

**Do:**
1. **Define the isolated-service contract** (do NOT implement the service). In `backend/services/cognee_memory.py`, replace the bare `NotImplementedError`s with a thin HTTP client that, when `COGNEE_MODE != 'disabled'` and `COGNEE_BACKEND_URL` is set, proxies to the isolated `praxis-cognee` service; when disabled, keeps the current safe shapes. **Standardize disabled-mode returns**: `search`/`recall` return `{status:'disabled', candidates:[]}`, `remember`/`add`/`cognify`/`forget` return `{status:'queued_disabled'}` — make the asymmetry explicit and documented so callers can distinguish "disabled" from "no results". Update `test_cognee_*` accordingly.
2. **Advisory recall injection (gated).** Add `recallAdvisoryMemory(uid, capsule)` in the frontend memory client that, only when Cognee is enabled, fetches candidates (≤0.600 confidence) for the capsule's `cogneeDatasetId` and populates `memoryPosture.advisoryCogneeRecall[]`. In `buildCapsulePromptBlock()`/`AgentReadContract`, render advisory recall in a clearly-labeled **non-canonical** section: "Advisory memory — NOT canonical until a review card is applied." When disabled, render nothing.
3. **Consume the seed-pack.** Make `build-capsule-cognee-seed-pack.ts` output consumable: add `proposeCogneeSeedReviewCards(uid, capsuleId)` that turns the seed-pack's `reviewCardProposal` (sourceType `cognee`, target `advisoryMemory`, state `proposed`) into actual review cards in `reviewCards/`. This is the bridge from "static proposal" to "reviewable candidate" — still advisory, still gated.
4. **Review UI surface.** Add a Cognee-candidates panel to the capsule manager (`src/components/cores/CapsuleManagerMenu.tsx` / a new `CogneeRecallPanel.tsx`) that lists advisory candidates with confidence, provenance, and approve/reject → which creates/resolves a `target:'advisoryMemory'` review card. Approving promotes the fact into `memoryPosture.canonicalCapsuleFacts[]` (canonical, capsule-scoped), never into the shared graph above 0.600. Responsive + accessible.
5. **Provenance firewall stays authoritative.** Any promotion path must respect migration 0014 constraints (Claim/Source layers only, ≤0.600, `provenance.kind='cognee'` marked). Add a test asserting an attempt to promote a Cognee candidate as a `Verdict` or at >0.600 is rejected.

**Acceptance:** With `COGNEE_MODE=disabled` (default), behavior is unchanged and all existing Cognee tests pass. With a mocked enabled backend, advisory recall populates `advisoryCogneeRecall[]`, renders as non-canonical, and approve creates a review card that promotes only to capsule-scoped `canonicalCapsuleFacts`. Firewall rejection test passes. No OpenAI egress (audit test green).

---

## 7. CLOSE THE FEEDBACK LOOP (read-receipts → readiness)

**Problem:** `capsule-read-receipt.ts` produces a write-only audit log; nothing feeds back to capsule readiness/health. `capsule-signal.ts` thin fallbacks are emitted but not aggregated.

**Do:**
1. Aggregate read receipts per capsule (e.g., a `usage` rollup: read count, last-used, fallback rate, dropped-core frequency, stale-core hits). Store under `users/{uid}/capsules/{capsuleId}/usage` or as a `usage` field updated transactionally.
2. Feed `usage` signals into `deriveCapsuleQuality()` as a soft dimension (e.g., "operability proven in use" or "frequently degraded → lower readiness"). Document weighting.
3. Add a `GET /api/context/capsules/[capsuleId]/usage` route (or extend `/evaluations`) so the UI can show how a capsule actually performs in agent turns.

**Acceptance:** A simulated sequence of receipts updates the usage rollup and nudges the readiness score (test). UI can read usage.

---

## 8. TESTS, OBSERVABILITY, DOCS (definition of done)

1. **Tests:** Unit tests for every new pure function (upgraders, patch validation, core selection/ranking, staleness, Capsule+ materialization, quality reconciliation). Integration tests for transactional review-card apply and Capsule+ round-trip. Backend: extend `backend/tests/test_cognee_*` for the standardized disabled-mode contract and firewall promotion rejection. Keep/extend the `scripts/audit-capsule-*.ts` suite and run them in CI.
2. **Observability:** Emit metrics for factory fallback rate, thin-capsule fallback rate, dropped-core events, stale-core gate hits, and (when enabled) Cognee recall counts. Add a Cloud Monitoring dashboard entry alongside `monitoring/dashboards/cognee.json`.
3. **Docs:** Update `docs/architecture/COGNEE_MEMORY_LAYER.md` and `ARCHITECTURE.md` with the unified schema, the readiness reconciliation, the Capsule+ materialization path, and the gated Cognee wiring. Add an ADR `docs/adr/0050-context-capsule-unified-schema.md` recording the v1/v2/v3 unification decision. Update `CHANGELOG.md` and `STATUS.md`.
4. **No regressions:** `npm run lint && npm run typecheck && vitest run` green; `playwright` capsule flows green; `backend/tests` green; all `audit-capsule-*` + `audit-cognee-isolation.ts` green.

---

## 9. SUGGESTED PR SEQUENCE (keep PRs reviewable)

1. PR1 — §1 schema unification + lazy migration + fixtures (no behavior change for users).
2. PR2 — §3 quality reconciliation (depends on PR1).
3. PR3 — §2 factory hardening (patch validation + transactional apply + fallback tests).
4. PR4 — §5 consumption upgrades (retrieval/budget/staleness/fallback recovery).
5. PR5 — §4 Capsule+ materialization + round-trip.
6. PR6 — §6 Cognee wiring (gated, disabled by default) + review UI.
7. PR7 — §7 feedback loop + §8 dashboards/docs/ADR.

Each PR: self-contained, tested, lint/typecheck clean, no `Co-Authored-By`, conventional-commit messages.

---

## 10. OPEN QUESTIONS TO FLAG (don't block — note in PR description)
- Should `marketplaceProfile` readiness gate public sharing, or stay informational? (Confirm with owner.)
- Embedding provider for §5 semantic ranking — reuse Vertex embeddings already configured, or lexical-only first pass? (Default: lexical first, embeddings behind a flag.)
- Should the isolated `praxis-cognee` Cloud Run service be scaffolded in this repo or a separate one? (This brief assumes contract-only here; service is separate.)
