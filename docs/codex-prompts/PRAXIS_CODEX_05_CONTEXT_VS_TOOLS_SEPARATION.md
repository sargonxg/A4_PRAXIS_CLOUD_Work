# PRAXIS — Codex Prompt Pack 05
## Context vs Tools — The Truth-Layer Backbone, Persona-Validated

> **Audience:** Codex (OpenAI) and Claude Code.
> **Run after:** Packs 03 (Workbench Architecture) and 04 (Landing Rebuild). This pack assumes `/app/workbench/[caseId]` exists with 8 tabs and the `CaseModule` interface is in place.
> **Read first:** the canonical reading list in `AGENTS.md`, plus `docs/CONTEXT_INJECTION.md`, `docs/CORPUS_ARCHITECTURE.md`, `docs/personas/PERSONA_WALKTHROUGHS_2026-04-26.md`, `backend/dialectica/`, `backend/agents/`, and the Phase 2 spec at `docs/phases/PRAXIS_PHASE_2_AGENTIC_SPINE.md`.
> **Hard rules carried over:** never hardcode `gemini-*` outside `providers.ts`; never bypass `withCalibration`; never weaken `firestore.rules`; never let analysis run on a case before its context is locked.

---

## 0. Why this pack exists

PRAXIS today blurs **two distinct activities** into the same surface:

1. **Building context** — gathering sources, ingesting documents, naming actors, declaring claims, marking constraints, scoping the case file. This is the act of **anchoring the workbench in graph + truth**.
2. **Running tools** — DIALECTICA reasoning, scenario forks, briefings, memos, talking points, advisor deliberations. This is **analysis on top of locked context**.

Today the analyst can run a DIALECTICA recipe before the case has any sources, before the actor list is filled in, before the graph has any structure. The recipe runs anyway, hallucinates the context, and produces an output that looks defensible but isn't grounded. Worse, the same UI surfaces both activities — Context Builder and DIALECTICA sit two clicks apart, with no gating.

This pack:

1. Makes **Context Studio** (a re-imagined Context tab) the **prerequisite** for analysis tools. Every tool has a context-health gate; the gate is named, visible, and actionable.
2. Defines **four truth layers** explicitly: **Source → Claim → Evidence → Verdict**. Each carries provenance, confidence, and time. Every primitive in the graph traces back through these layers.
3. Splits the workbench's chapters into two halves with a clear visual line:
   - **Context (chapters 1–3): Frame, Receipts, Graph** — analyst-curated, graph-anchored, time-stamped. Outputs are **case context artifacts**.
   - **Tools (chapters 4–5): DIALECTICA, Decision Product** — consumes the locked context, produces **analysis artifacts**.
4. Validates the redesign against four named personas (Diplomat, Mediator, Analyst, Researcher) using the existing `docs/personas/` walkthroughs as the test charter. Each persona must complete an end-to-end flow on a case in ≤ 12 minutes.
5. Wires the technical spine correctly: **Firestore** for canonical user state, **Postgres** for vector + agent memory + LangGraph checkpoints, **Neo4j** for graph traversal/projection. No silent demo data into authenticated state.
6. Finishes the **Phase 2 spec promises** that the audit (`docs/PRAXIS_PHASE_SPEC_AUDIT_2026-05-06.md`) flagged as partial: universal symbolic-firewall enforcement, claim-level Trust Score persistence, real Neo4j sync verification.

---

## 1. Outcomes

| # | Outcome |
|---|---|
| 1 | The workbench has a clear **Context | Tools** divider. Chapters 1–3 are Context. Chapters 4–5 are Tools. The divider is visible in the UI. |
| 2 | A new **Context Health** primitive (`ContextHealthScore` 0–100) is computed from 6 dimensions. Tools refuse to run when the score is below 60 unless the analyst explicitly overrides with a logged justification. |
| 3 | Four truth layers — **Source / Claim / Evidence / Verdict** — are first-class types. Every graph node and every tool output carries `(layer, confidence, provenance[], validFrom, validTo, assertedFrom, assertedTo)`. |
| 4 | The Symbolic Firewall enforces on **every** AI route, not just DIALECTICA. Streaming routes verify each emitted claim against the graph before committing it to the response stream. |
| 5 | Trust Scores are persisted at claim level for every analyst-saved output. Boardroom, Draft, briefings, and DIALECTICA all write claim-level provenance to Firestore. |
| 6 | Neo4j ↔ Firestore drift verifier runs in CI and on a 6-hour schedule in production. Drift > 2% on any case raises an alert. |
| 7 | Each of four personas (Diplomat, Mediator, Analyst, Researcher) has a Playwright e2e flow that exercises Context Studio → DIALECTICA → Decision Product on a single case in ≤ 12 minutes. |
| 8 | All work is multi-user-correct: every action is scoped to `users/{uid}/situations/{caseId}/...` and tested for cross-user isolation. |

---

## 2. Pre-work — Codex agent must confirm before starting

Send this confirmation note to Giulio and wait for ack:

```
PRAXIS Context vs Tools separation — pre-work confirmation

I have read:
- AGENTS.md, CLAUDE.md, praxis-conventions skill
- docs/CONTEXT_INJECTION.md, docs/CORPUS_ARCHITECTURE.md
- docs/personas/PERSONA_WALKTHROUGHS_2026-04-26.md
- docs/phases/PRAXIS_PHASE_2_AGENTIC_SPINE.md
- docs/PRAXIS_PHASE_SPEC_AUDIT_2026-05-06.md (open red flags)
- backend/dialectica/runner.py, backend/dialectica/recipes/*.py
- backend/agents/registry.py, backend/agents/checkpointer.py
- src/lib/knowledge/* (4 SKC layers)
- src/lib/ai/situation-context.ts (buildToolContext)
- src/lib/api/with-calibration.ts and with-credits.ts
- firestore.rules, firestore.indexes.json
- src/components/workbench/* (from Pack 03)

My understanding of the architecture I will harden:
1. Context Studio (Chapters 1-3 of the workbench: Situation Frame, Source
   Receipts, Conflict Graph) is the analyst's curation surface. It produces
   a "locked context": a graph snapshot with provenance, confidence, and
   time on every primitive.
2. Tools (Chapters 4-5: DIALECTICA Reasoning, Decision Product) consume
   the locked context. They cannot run when ContextHealthScore < 60
   without an explicit logged override.
3. Four truth layers — Source, Claim, Evidence, Verdict — are typed nodes
   in the graph. Each layer has its own provenance and confidence
   semantics. The layers compose: a Verdict is supported by Evidence; an
   Evidence cites a Claim; a Claim is grounded in a Source.
4. Storage split: Firestore is canonical user state (cases, sources,
   documents, claims, work products, provenance). Postgres holds vector
   embeddings, LangGraph checkpoints, and agent memory. Neo4j is the
   read-only graph projection for traversal/queries. Drift between
   Firestore and Neo4j is monitored.

Open questions:
- Q1: ContextHealthScore — propose 6 dimensions: scope-clarity,
       actor-coverage, source-coverage, document-coverage, graph-density,
       provenance-coverage. Each weighted equally. ACK or amend.
- Q2: Override behaviour — if an analyst runs a tool below the gate, do
       we require a typed justification (≥ 50 chars) and log it to the
       case audit trail, or just a checkbox? Default: typed justification.
- Q3: Trust Score model — current backend has trust_scores.py. Confirm
       claim-level Trust Scores persist to Firestore under
       situations/{id}/claims/{claimId}/trust as a sub-document, with
       indexed timestamp + scoreVersion.
- Q4: Personas to validate against. Default 4: Diplomat (Giulio's anchor),
       Mediator (workplace HR Alex/Maya), Analyst (think tank), Researcher
       (academic). ACK or amend.

Branch I will work on: feature/context-vs-tools
Estimated effort: 4-5 engineering days for one Codex agent.
```

Do not start work until Giulio acks Q1, Q2, Q3, Q4.

---

## 3. Pack overview

| # | Prompt ID | Outcome | Est. effort |
|---|---|---|---|
| **D1** | `truth-layers/types-and-schema` | Define the 4 truth-layer types (Source / Claim / Evidence / Verdict) in TypeScript and Pydantic. Versioned JSON Schema. Migration plan for existing graph data | 6 h |
| **D2** | `context-health/score-and-gate` | Implement `ContextHealthScore` (6 dimensions, 0-100). Add a tool-gate that blocks analysis tools below 60 unless overridden with a logged justification | 5 h |
| **D3** | `workbench/context-tools-divider` | Visual divider between Chapters 1-3 (Context) and Chapters 4-5 (Tools) inside `WorkbenchTabs` and `ChapterRenderer`. Locked-state UI for tools when context health is low | 3 h |
| **D4** | `context-studio/redesign` | Refactor the Context tab and Chapters 1-3 into a coherent "Context Studio". Single source of truth for sources, documents, actors, claims, scope. Wired to Firestore + Postgres + Neo4j with provenance | 8 h |
| **D5** | `symbolic-firewall/universal` | Extend the symbolic firewall from DIALECTICA-only to every AI route. Streaming routes verify claims before flushing | 8 h |
| **D6** | `trust-score/claim-level-persistence` | Persist Trust Scores at claim level for every saved tool output across DIALECTICA, Boardroom, Draft, briefings | 6 h |
| **D7** | `neo4j-firestore/drift-verifier` | Real Firestore↔Neo4j sync verifier. Wired into CI + 6-hour Cloud Scheduler. Drift > 2% per case raises an alert | 5 h |
| **D8** | `personas/playwright-flows` | Four Playwright flows (Diplomat, Mediator, Analyst, Researcher) — each exercises Context Studio → DIALECTICA → Decision Product on a single case ≤ 12 min | 6 h |
| **D9** | `audit-and-tests` | `scripts/audit-context-vs-tools.ts`. Wired into `npm run audit:gate`. Final verification | 3 h |

Total: ~50 hours, ~4–5 engineering days.

---

## 4. Truth-layer model (target state)

```
                         ┌─────────────┐
                         │   VERDICT   │  ← analyst-defended judgment
                         └──────┬──────┘     (e.g., "Glasl 5", "Risk 78", "BATNA: walkaway")
                                │ supports
                         ┌──────▼──────┐
                         │  EVIDENCE   │  ← graph pattern derived from claims
                         └──────┬──────┘     (e.g., "3 claims agree, 1 dissents on actor goal")
                                │ derives_from
                         ┌──────▼──────┐
                         │   CLAIM     │  ← extracted assertion from a source
                         └──────┬──────┘     (e.g., "SDF will integrate by Mar 2026")
                                │ cited_in
                         ┌──────▼──────┐
                         │   SOURCE    │  ← UN report, news article, doc, dataset
                         └─────────────┘     (e.g., UN Geneva 2026-02-13)
```

Every node carries:

```ts
type TruthLayerNode = {
  id: string;
  layer: 'source' | 'claim' | 'evidence' | 'verdict';
  confidence: number;              // 0..1
  provenance: ProvenanceRef[];     // each ref: {sourceId, span, retrievedAt}
  validFrom: ISO8601;              // bi-temporal: when the claim is true
  validTo:   ISO8601 | null;
  assertedFrom: ISO8601;           // bi-temporal: when we recorded it
  assertedTo:   ISO8601 | null;
  caseId: string;                  // multi-user scoping
  ownerUid: string;                // multi-user scoping
};
```

Edges between layers carry their own confidence and provenance. The 8-primitive ACO Conflict Grammar (Actor, Claim, Interest, Constraint, Leverage, Commitment, Event, Narrative) **maps onto** these layers — Actor/Event live in Source/Claim layers, Interest/Constraint/Leverage are derived Evidence, Commitment is a Verdict. Codex must preserve the existing ACO ontology and add the truth-layer dimension orthogonally.

---

## 5. Prompt D1 — `truth-layers/types-and-schema`

### Outcome
Four truth-layer types are defined in TypeScript (`src/types/truth-layers.ts`), Pydantic (`backend/services/truth_layers.py`), and a versioned JSON Schema (`schemas/truth-layers-v1.json`). Existing ACO entities are augmented with a `layer` field. A migration script back-fills `layer` on historical Firestore graph documents.

### Files to create
- `src/types/truth-layers.ts`
- `backend/services/truth_layers.py`
- `schemas/truth-layers-v1.json`
- `schemas/truth-layers-v1.md` (human-readable doc)
- `scripts/migrate-truth-layers.ts` (idempotent Firestore back-fill)
- `tests/types/truth-layers-roundtrip.spec.ts`

### Schema contract (TS)

```ts
export type TruthLayer = 'source' | 'claim' | 'evidence' | 'verdict';

export interface ProvenanceRef {
  sourceId: string;
  span?: { start: number; end: number };  // char offsets in source text
  retrievedAt: string;                     // ISO 8601
  retriever?: 'analyst' | 'gdelt' | 'ucdp' | 'reliefweb' | 'hdx' | 'unhcr' | 'un-news' | 'world-bank' | 'google-grounded' | 'private-corpus';
}

export interface TruthLayerNode {
  id: string;
  caseId: string;
  ownerUid: string;
  layer: TruthLayer;
  confidence: number;                     // 0..1
  provenance: ProvenanceRef[];
  validFrom: string;
  validTo: string | null;
  assertedFrom: string;
  assertedTo: string | null;
}

// ACO entity augmented with truth layer
export interface AcoActor extends TruthLayerNode { layer: 'source' | 'claim'; kind: 'actor'; ... }
export interface AcoEvent  extends TruthLayerNode { layer: 'source' | 'claim'; kind: 'event';  ... }
export interface AcoClaim  extends TruthLayerNode { layer: 'claim';            kind: 'claim';  ... }
export interface AcoVerdict extends TruthLayerNode { layer: 'verdict';         kind: 'verdict'; ... }
// ... etc for the 8 ACO primitives, mapped to layers
```

### Migration plan

1. Codex enumerates all `users/{uid}/situations/{caseId}/graph` docs.
2. For each node, infers the layer from `kind`:
   - `actor`, `event`, `narrative` → mostly `claim` (extracted from sources). If the node has no `provenance`, mark as `claim` with `confidence: 0.5` until repaired.
   - `interest`, `constraint`, `leverage` → `evidence`.
   - `commitment` → `verdict`.
3. The script reports counts before/after, and is dry-run by default. Codex does not run it on production data without Giulio's sign-off.

### Hard rules
- The 8-primitive ACO ontology is **not** replaced. It is augmented with the `layer` field. Existing tools that read `kind: 'actor'` continue to work.
- No node may have `confidence > 1.0` or `< 0.0`. Add a runtime check.
- `validFrom` must be ≤ `validTo` (when both present). Add a runtime check.
- Migration script is idempotent. Re-running it on already-migrated data is a no-op.

### Definition of Done
- TS types, Python types, and JSON Schema are kept in sync (verified by `scripts/codegen-schema.ts` if present, otherwise by a roundtrip test).
- Migration script runs on a Firestore export with 1,000 nodes and produces the expected layer distribution (confirmed by a snapshot test).
- `npx tsc --noEmit && cd backend && pytest tests/services/test_truth_layers.py -v` both pass.

### Verification
```bash
npx tsc --noEmit
cd backend && pytest tests/services/test_truth_layers.py -v
node scripts/migrate-truth-layers.ts --dry-run
```

---

## 6. Prompt D2 — `context-health/score-and-gate`

### Outcome
A `ContextHealthScore` (0–100) is computed for every case from 6 dimensions. Each dimension is a 0–100 sub-score; the total is the unweighted mean. The score is visible in the workbench header, in the Desk tab, and inline at the top of every Tools tab. Tools refuse to run when the score is < 60 unless the analyst types a justification (≥ 50 chars) that is logged to the case audit trail.

### The 6 dimensions

| Dimension | Score 100 means | Score 0 means |
|---|---|---|
| `scope-clarity` | Case has name, region, type, primary question, mandate framing | None of these are filled |
| `actor-coverage` | ≥ 5 actors with role, interest, leverage, constraint each | 0 actors |
| `source-coverage` | ≥ 8 sources spanning ≥ 3 reliability tiers (UN, Local, Think Tank) | 0 sources |
| `document-coverage` | ≥ 3 documents uploaded, all OCR'd, all chunked into RAG | 0 documents |
| `graph-density` | ≥ 25 nodes, ≥ 40 edges, > 0.6 typed-edge ratio | < 5 nodes |
| `provenance-coverage` | ≥ 90% of claim-layer nodes have ≥ 1 cited source | 0% |

Each sub-score caps at 100. The mean is the `ContextHealthScore`.

### Files to create
- `src/lib/context/context-health-score.ts` — pure function `computeContextHealthScore(situation, sources, documents, graph): ContextHealthScore`.
- `src/lib/context/context-health-gate.ts` — `assertContextReady(score, threshold = 60)`; throws `ContextHealthGateError` with the lowest dimension named.
- `src/components/workbench/context-health-chip.tsx` — chip rendered in the workbench header showing the score, its lowest dimension, and a "fix it" link to Context Studio.
- `src/components/workbench/tool-gate.tsx` — wraps any tool tab; renders a locked-state UI when the score is below threshold; provides the "type a justification to override" path.
- `src/app/api/situations/[id]/context-health/route.ts` — GET returns the current score; POST records an override justification.
- `firestore.rules` — already correct for `situations/{id}` writes; no changes.
- `firestore.indexes.json` — add an index for `users/{uid}/situations/{caseId}/audit-log` ordered by `at` desc.

### UI contract

- The chip is **always visible** in the workbench header. Clicking it opens a small popover listing the 6 dimensions with sub-scores.
- The chip is colored: green (≥ 80), amber (60–79), red (< 60).
- When red, every Tools tab (DIALECTICA, Decision Product) shows a locked card with: title, current score, lowest dimension, "Open Context Studio" button, "Type a justification to override (≥ 50 chars)" form.

### Audit-log entry shape

```ts
{
  at: serverTimestamp(),
  uid: <user>,
  action: 'context_health_override',
  caseId,
  scoreAtOverride: 42,
  lowestDimension: 'source-coverage',
  justification: '<the analyst typed text>',
  toolThatRan: 'dialectica.leverage-trace',
}
```

### Hard rules
- The gate is a **frontend gate** for UX, but the **backend AI routes** must also enforce it. Add `withContextHealthGate(threshold = 60)` middleware that wraps `withCalibration`. The middleware reads the score from the situation and rejects with 412 (Precondition Failed) when below threshold, unless `X-Context-Health-Override-Hash` is present (the SHA256 of the saved override justification).
- The override justification is **not** an opt-out. It is a logged decision the analyst can be questioned on later. Make this clear in the UI copy.
- Demo cases (`syria-2026`, `nordalia-2026`) ship with a pre-computed `ContextHealthScore ≥ 85` because their `CaseModule`s are fully populated.

### Definition of Done
- The score renders correctly on Syria and Nordalia (both ≥ 85) and on a fresh empty case (≤ 10).
- Running DIALECTICA on an empty case returns 412 from the backend. Running it after typing a 50-char justification works and records the audit log.
- `npx vitest run src/lib/context/` passes including a fixture-based score test.

### Verification
```bash
npx vitest run src/lib/context
npx playwright test tests/e2e/context-health-gate.spec.ts
```

---

## 7. Prompt D3 — `workbench/context-tools-divider`

### Outcome
Inside the workbench, Chapters 1–3 (Context: Frame, Receipts, Graph) and Chapters 4–5 (Tools: DIALECTICA, Decision Product) are visually separated. The 8 tabs from Pack 03 are also grouped: **Context tabs** (Chapters, Context, Library, Research, Graph) and **Tools tabs** (Boardroom, Draft) with Desk standing alone as the overview surface.

### Files to edit
- `src/components/workbench/workbench-tabs.tsx` — render two subgroups divided by a thin separator.
- `src/components/workbench/chapter-renderer.tsx` — between Chapter 3 and Chapter 4, render a `<ContextToolsDivider />` component. The divider says: **"Above: context. Below: tools that consume the context."** It also shows the current `ContextHealthScore` chip.

### Tab grouping

```
[ Desk ]   |   [ Chapters ] [ Context ] [ Library ] [ Research ] [ Graph ]   |   [ Boardroom ] [ Draft ]
                              ── CONTEXT (chapters 1-3) ──                      ── TOOLS (chapters 4-5) ──
```

### Definition of Done
- The divider is visible at desktop, mobile, and reduced-motion settings.
- Visual snapshot test of a populated workbench passes.
- Tabs in the "Tools" group render the locked-state UI when context health is below threshold.

### Verification
```bash
npx playwright test tests/e2e/workbench-divider.spec.ts
```

---

## 8. Prompt D4 — `context-studio/redesign`

### Outcome
The Context tab and Chapters 1–3 are unified into one coherent **Context Studio**. The studio is the single place an analyst goes to **build the case**: name actors, gather sources, upload documents, declare claims, frame the question. Sources, documents, actors, claims, and graph proposals all flow into the same Firestore collections, with provenance, confidence, and time on every primitive. Graph projections to Neo4j are immediate (write-through) but read paths in tools always go through Firestore first, falling back to Neo4j for traversal queries only.

### Files to create
- `src/components/context-studio/index.tsx` — the studio shell with 5 panels: Frame, Sources, Documents, Actors, Graph Proposals.
- `src/components/context-studio/frame-panel.tsx` — the case scope: name, region, type, primary question, mandate framing.
- `src/components/context-studio/sources-panel.tsx` — source intake: URL, Source Scout, manual entry, GDELT/UCDP feeds.
- `src/components/context-studio/documents-panel.tsx` — document upload, OCR status, RAG chunk counts.
- `src/components/context-studio/actors-panel.tsx` — ACO Actor entries with role, interest, leverage, constraint.
- `src/components/context-studio/graph-proposals-panel.tsx` — pending graph proposals from extraction, ready for analyst approval.
- `src/lib/context/studio-state.ts` — Zustand store for the studio session state (draft entries pre-commit).

### Files to refactor (move into Context Studio)
- `src/app/app/context-builder/page.tsx` — its content moves into `frame-panel.tsx`. The route becomes a redirect to `/app/workbench/[caseId]?tab=context`.
- `src/app/app/sources/page.tsx`, `src/app/app/library/sources/page.tsx` — content into `sources-panel.tsx`.
- `src/app/app/documents/page.tsx` — content into `documents-panel.tsx`.
- `src/app/app/actors/page.tsx` — content into `actors-panel.tsx`.

### Architectural rules

- **Firestore is canonical.** Every studio write goes to Firestore first. The function returns only after the write is acknowledged.
- **Postgres holds vector embeddings.** When a document chunk is created, the Firestore write triggers a Cloud Function (`on_document_uploaded`) that embeds and stores the vector in Postgres with the same `claim_id` as the foreign key. Re-use the existing function; do not create a new path.
- **Neo4j is the projection.** Graph proposals when approved are written to Firestore (canonical) and projected to Neo4j (read-only graph index). The projection is async via a separate Cloud Function (`on_graph_node_committed`); the Studio UI does not block on it.
- **No silent demo data.** When a user case is loaded, Studio reads only `users/{uid}/situations/{caseId}`. The `SYRIA_DEMO_*` constants are loaded only for `syria-2026` example cases via the `CaseModule` interface.
- **Provenance is mandatory on commit.** A graph node cannot be committed without ≥ 1 `ProvenanceRef`. The UI enforces this; the API also rejects (400) on commit without provenance.

### Definition of Done
- A new user can create a case via `/app/situations/new`, land in the workbench, click **Context** tab, and complete all 5 panels in ≤ 8 minutes (timed by the persona Playwright flows in D8).
- Every panel saves to Firestore on blur/commit. No optimistic-only UI.
- A Cloud Function emits to Postgres (vector) and Neo4j (graph) within 30 seconds of commit; Drift Verifier in D7 confirms parity.
- Old routes (`/app/context-builder`, `/app/sources`, `/app/documents`, `/app/actors`) redirect to the workbench's Context tab with the right deep-link query.

### Verification
```bash
npx playwright test tests/e2e/context-studio-build-flow.spec.ts
```

---

## 9. Prompt D5 — `symbolic-firewall/universal`

### Outcome
The Symbolic Firewall — currently enforced on DIALECTICA recipes only — is enforced on **every** AI route, including streaming routes (chat, brief, report, advisor). For each emitted claim in the AI response, the firewall verifies:

1. The claim's underlying entities (Actor, Event, Claim, Constraint) exist in the case graph.
2. The claim's `confidence` value is ≤ the minimum confidence of its supporting graph nodes.
3. Every cited source exists in the case's source list.

If any check fails, the streaming route **rewrites** the claim to a hedged form ("Based on partial evidence, …") and emits a `firewall_warning` event the UI surfaces.

### Files to create / edit
- `backend/agents/firewall/universal.py` — extends the existing firewall module. New entry points: `verify_claim(claim, graph) -> FirewallResult`; `wrap_stream(claim_iterator, graph) -> claim_iterator`.
- `src/lib/api/with-firewall.ts` — Next-side middleware that wraps `withCalibration` and verifies non-streaming responses; for streaming, posts each chunk to the backend's verify endpoint.
- `backend/main.py` — new endpoint `POST /firewall/verify` returning `{ ok: bool, warnings: [...], hedgedClaim?: string }`.
- `src/components/praxis/firewall-warning-toast.tsx` — frontend toast that surfaces firewall warnings to the analyst.

### Performance constraint
- Firewall must not add > 200ms p50 latency to streaming routes.
- Firewall verification runs in parallel with response generation; the UI surfaces warnings post-hoc when needed, but never blocks first-token rendering.

### Definition of Done
- All 66 calibrated AI routes are wrapped by `withFirewall`. Audit script enforces.
- Boardroom streaming and Draft autocomplete both surface a `firewall_warning` toast when the AI emits an unsupported claim.
- A contrived test case (claim referring to actor not in graph) produces a hedged claim and a logged warning.

### Verification
```bash
cd backend && pytest tests/agents/test_firewall_universal.py -v
npx vitest run src/lib/api/with-firewall.spec.ts
npx playwright test tests/e2e/firewall-streaming.spec.ts
```

---

## 10. Prompt D6 — `trust-score/claim-level-persistence`

### Outcome
Trust Scores are persisted at claim level for every analyst-saved output. The Boardroom, Draft, briefings, and DIALECTICA all write claim-level provenance and Trust Scores to Firestore.

### Storage layout

```
users/{uid}/situations/{caseId}/claims/{claimId}
  text:           string
  layer:          'claim' | 'evidence' | 'verdict'
  provenance:     ProvenanceRef[]
  trust:          {
    score:        number  // 0..100
    version:      string  // e.g., 'trust-v2'
    components:   {
      sourceTier:    number   // 0..100, weighted by reliability tier of cited sources
      confidence:    number   // 0..100, derived from confidence field
      cooberation:   number   // 0..100, count of independent corroborating claims
      recency:       number   // 0..100, decay function of source dates
    }
    computedAt:   serverTimestamp
  }
  emittedBy:      'dialectica' | 'boardroom' | 'draft' | 'briefing' | 'analyst'
  createdAt:      serverTimestamp
  updatedAt:      serverTimestamp
```

### Files to create / edit
- `backend/services/trust_scores.py` — already exists. Extend with `compute_trust_score(claim, graph, sources)` and `persist_claim_trust(case_id, claim_id, trust)`.
- `src/lib/firebase/claims-service.ts` — new service for reading/writing claims.
- For each emitter — Boardroom, Draft, briefings, DIALECTICA — add a `commitClaim(claim)` call after the AI run completes.

### Definition of Done
- A DIALECTICA `LEVERAGE-TRACE` run on Syria saves ≥ 1 claim per leg of the trace, each with a Trust Score.
- A Draft paragraph commit saves the paragraph as a Verdict-layer claim with an aggregated Trust Score.
- A Boardroom advisor turn saves at least one claim per advisor with the advisor's stance Trust Score.
- Cross-user isolation: User B cannot read User A's claims (verified by an integration test).

### Verification
```bash
cd backend && pytest tests/services/test_trust_scores.py -v
npx vitest run src/lib/firebase/claims-service.spec.ts
npx playwright test tests/e2e/trust-score-persistence.spec.ts
```

---

## 11. Prompt D7 — `neo4j-firestore/drift-verifier`

### Outcome
A real Firestore↔Neo4j sync verifier. Compares a sample of nodes/edges per case and reports drift. Wired into CI (every PR) and into Cloud Scheduler (every 6 hours in production). Drift > 2% per case for > 6 hours raises a Cloud Monitoring alert.

### Files to create / edit
- `scripts/verify-neo4j-sync.ts` — already exists with placeholder behavior. Replace with a real verifier:
  1. Pick a deterministic random sample of 50 nodes per case (or all if < 50).
  2. For each node, compare Firestore and Neo4j: `id`, `kind`, `confidence`, `validFrom`, `provenance.length`.
  3. Compute drift% = (mismatches / sampled).
  4. Same for edges.
  5. Write results to Firestore `system/drift-reports/{ts}` and emit a Cloud Logging entry.
- `cloud_functions/drift_verifier/` — new Cloud Function scheduled every 6 hours.
- `infrastructure/monitoring-alerts.sh` — add an alert: drift > 2% for > 6h triggers.

### Definition of Done
- The verifier runs locally (`npx tsx scripts/verify-neo4j-sync.ts --case syria-2026`) and reports drift% per node-type and edge-type.
- The CI run for any PR that touches `src/lib/firebase/graph-service.ts` or `backend/services/graph_adapter.py` includes a drift verifier call.
- A staging deploy shows the Cloud Scheduler running every 6 hours and writing reports.

### Verification
```bash
npx tsx scripts/verify-neo4j-sync.ts --case syria-2026
npx tsx scripts/verify-neo4j-sync.ts --all
```

---

## 12. Prompt D8 — `personas/playwright-flows`

### Outcome
Four Playwright e2e flows, one per persona, exercising Context Studio → DIALECTICA → Decision Product on a fresh case in ≤ 12 minutes each. The flows live under `tests/e2e/personas/`.

### The four personas

| Persona | Source case | Time budget | What they do |
|---|---|---|---|
| **Diplomat** | Adapt the existing `docs/personas/PERSONA_WALKTHROUGHS_2026-04-26.md` Persona 1 | 12 min | Open Syria example; check Daily Brief; run Leverage-Trace; export UNSC briefing. |
| **Mediator** | Workplace mediation (Alex/Maya synthetic) | 10 min | Create the workplace case from scratch; declare actors and constraints; run Interest-vs-Position; export a mediation framing memo. |
| **Analyst** | Sahel example | 12 min | Open Sahel example; run Counter-Narrative on regional spillover claims; export a 1-pager think-tank brief. |
| **Researcher** | Nordalia synthetic NDC | 10 min | Open Nordalia; run Path-Search across 3 hops; export a methodology footnote-rich academic brief. |

### Files to create
- `tests/e2e/personas/diplomat.spec.ts`
- `tests/e2e/personas/mediator.spec.ts`
- `tests/e2e/personas/analyst.spec.ts`
- `tests/e2e/personas/researcher.spec.ts`
- `tests/e2e/personas/_shared/persona-fixtures.ts` — shared setup (sign-in helpers, case-create helpers).

### Each spec must
- Start at `/` (landing).
- Exercise the example-cases modal (Pack 04) or create a new case.
- Verify `ContextHealthScore ≥ 60` before running any Tool tab.
- Surface at least one firewall warning if it fires (or assert none fires for a clean case).
- Persist at least one claim with a Trust Score visible in Library.
- Export a final artifact (briefing/memo/brief) and verify the export contains the cited sources and a JSON-LD provenance manifest.
- Complete within the time budget when run on CI hardware.

### Hard rules
- The persona flows must not share state (one persona's case must not be visible to another's account).
- Personas use **separate test accounts** managed via the existing test-user pool (or create one). Cross-user isolation must be tested at the end of each spec.
- The `Mediator` flow uses a **non-conflict** case (workplace HR), proving the workbench is not Syria-specific.

### Definition of Done
- Four specs pass on CI within budget.
- Each spec produces a Playwright video; all four are reviewed by Giulio in PR.
- The `Mediator` workplace case shows the workbench works for non-conflict cases (Pack 04's de-Syria-ing of the story is borne out in tests).

### Verification
```bash
npx playwright test tests/e2e/personas/
```

---

## 13. Prompt D9 — `audit-and-tests`

### Outcome
A single audit script enforces the contract from this pack. Wired into `npm run audit:gate`.

### Audit must enforce
1. Every `src/app/api/ai/**/route.ts` is wrapped by both `withCalibration` AND `withFirewall` (or in the explicit exempt list).
2. Every `withCredits`-wrapped route also has `withContextHealthGate`.
3. The `claims` Firestore subcollection has the index for `(emittedBy, createdAt desc)` defined in `firestore.indexes.json`.
4. The 4 truth-layer types are kept in sync between TS, Pydantic, and JSON Schema.
5. The Drift Verifier exits 0 against the local `syria-2026` and `nordalia-2026` example cases.
6. The 4 persona Playwright specs are present and runnable.
7. `wc -l src/components/workbench/*.tsx` totals < 4,000 lines (a soft cap to prevent re-sprawl).

### Wire into the audit gate

```json
{
  "scripts": {
    "audit:context-vs-tools": "tsx scripts/audit-context-vs-tools.ts",
    "audit:gate": "npx tsc --noEmit && npm run lint && npm run build && npm run audit:routes && npm run audit:gcp && npm run audit:workbench && npm run audit:landing && npm run audit:context-vs-tools && npx vitest run"
  }
}
```

### Definition of Done
- `npm run audit:gate` passes.
- All four persona Playwright specs pass within budget.
- A staging deploy shows: `ContextHealthScore` chip on every workbench page, the Tools-locked state on a fresh case, the firewall toast firing on a contrived bad claim, and Trust Scores rendering in Library.

### Verification
```bash
npm run audit:gate
npx playwright test
```

---

## 14. Hard rules — applied to every prompt in this pack

- **No silent demo↔real data mixing.** Demo cases (syria-2026, nordalia-2026, sahel-2026) load from `src/lib/cases/<case>/` only. User cases load from Firestore only. The two paths never merge.
- **No skipping the Context gate** with a "for testing" flag. Tests use a real override flow with a justification.
- **No hardcoded `gemini-*`** outside `src/lib/ai/providers.ts`.
- **No bypass of `withCalibration`, `withFirewall`, or `withContextHealthGate`** on AI routes.
- **No client-side reads of `users/{otherUid}/...`.** Period.
- **No removal or weakening of `firestore.rules`.** New collections need new rules.
- **No new `'unsafe-inline'`, `'unsafe-eval'`** in CSP.
- **No deletion of test fixtures.** Rename and update if needed.
- **No persona spec longer than its time budget.** Personas with too-long flows are evidence the workbench has too much friction; fix the workbench, don't extend the budget.

---

## 15. Verification gate (run at the end of the pack)

```bash
git status
npx tsc --noEmit
npm run lint
npm run build
npm run audit:routes
npm run audit:gcp
npm run audit:workbench
npm run audit:landing
npm run audit:context-vs-tools
npx vitest run
npx playwright test
cd backend && pytest -v
```

All must pass. Then:

```bash
git checkout -b feature/context-vs-tools
git add -A
git commit -m "feat(workbench): truth layers, context-health gate, universal firewall, persona-validated

The workbench separates Context (Chapters 1-3, build the case file) from
Tools (Chapters 4-5, analyze on top of locked context). A new
ContextHealthScore (0-100) gates analysis routes; below 60, tools
require a logged justification.

Four truth layers — Source / Claim / Evidence / Verdict — are
first-class typed nodes carrying provenance, confidence, and
bi-temporal validity. The 8 ACO primitives are augmented orthogonally.

The Symbolic Firewall extends from DIALECTICA-only to every AI route,
including streaming. Trust Scores persist at claim level across
DIALECTICA, Boardroom, Draft, briefings.

A real Firestore↔Neo4j drift verifier runs in CI and every 6 hours in
production. Drift > 2% raises a Cloud Monitoring alert.

Four Playwright persona flows (Diplomat, Mediator, Analyst, Researcher)
exercise Context Studio → DIALECTICA → Decision Product end-to-end on
fresh cases within tight time budgets. The Mediator flow uses a
workplace mediation case — proving the workbench is not Syria-specific.

Closes pack 05 (D1-D9). Verified by audit:gate + Playwright + pytest."
git push origin feature/context-vs-tools
```

Open a PR and tag Giulio for review. **Do not merge to `main` without his sign-off** — this pack changes the analytic contract of the product, and persona walkthroughs are the user-facing test of correctness.

---

## 16. Out of scope

- The 20-verb facade for `/api/ai/*` — separate workstream, called out in the audit.
- Production observability (latency dashboards, error budgets) — a separate ops pack.
- Streaming Boardroom against live LangGraph SSE replay — partial in Phase 3 audit; tracked separately.
- Editor export provenance embedding in DOCX/PDF/Markdown — also from Phase 3 audit; tracked separately.

---

## 17. Closing note for the agent

There are two ways the workbench can fail an analyst.

**The first failure** is letting them run analysis on context that isn't built. They get a confident answer they can't defend. They walk into a meeting carrying a brief that doesn't survive a single source check. They lose trust — in PRAXIS, and in their own reasoning.

**The second failure** is making the act of building context so heavy that nobody finishes it. The case sits half-built. The tools never run. The product feels like a homework assignment.

This pack threads the needle: **make the context gate visible, gradable, and overridable with logged consequence**. The analyst can run a tool against weak context — but only with a typed, recorded justification. That keeps PRAXIS honest *and* usable.

The persona flows are the contract. If a Diplomat cannot complete the Syria flow in 12 minutes, the workbench is too heavy and Giulio will hear about it from his own users. If a Mediator cannot complete the workplace flow in 10 minutes, the workbench is too conflict-coded and we have not de-Syria-ed the story enough.

Run all four. Time them. If any persona flow exceeds its budget, **fix the workbench** (cut steps, simplify panels, improve defaults) before merging. Do not extend the budget.

When in doubt, re-read `praxis-conventions/SKILL.md`, `docs/PRAXIS_PHASE_SPEC_AUDIT_2026-05-06.md`, and the **Hard Rules** section above.
