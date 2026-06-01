# PRAXIS — Context Capsule Excellence Plan

> Authoritative design + build plan to make Context Capsules the genuine core of
> PRAXIS: better to **create**, **display**, **use**, **analyze**, and
> **continuously improve** — learning from the user, from documents, and from use,
> with embedded graphs, dynamic ontologies, a semantic layer, sources, and
> instructions all composed into structured context for policy teams.
>
> Pairs with `docs/PRAXIS_CODEX_PLAYBOOK.md` (P2 roadmap) and
> `docs/architecture/PRAXIS_ARCHITECTURE.md` (invariants). When the two disagree on
> capsule specifics, this file wins for capsules; the playbook wins for everything else.
>
> Created 2026-06-01 · Target: capsule subsystem v3 → v4.

---

## 0. North star

A **Context Capsule** is a governed, living bundle of *structured context* that
makes any AI answer **sourceable, temporal, causal, and ontologically grounded**.
A policy team should be able to:

1. **Create** a capsule from one sentence (or a folder of documents) and have a
   co-pilot scaffold the rest — then refine it with progressive depth, never JSON.
2. **See** the capsule as a legible knowledge object: a typed graph, a timeline, a
   claim ledger with receipts, and a live quality meter.
3. **Use** it as the context behind Ask, Boardroom, and Memo — swap capsules in/out,
   merge several, and get answers that cite the capsule's own receipts.
4. **Trust** it: every claim links to evidence with confidence and validity dates;
   contradictions and staleness are detected, not guessed.
5. **Improve** it automatically — from user corrections, newly uploaded documents,
   and from how it gets used — under human-gated governance.

**Design law:** *simplicity on the surface, depth in the capsule.* The user types a
sentence; the capsule carries the complexity.

---

## 1. The four pillars of a capsule (Users · Tools · Output · Situation)

Every capsule is read and built along four pillars. Existing v3 sections
(`src/lib/context/capsule-v3.ts`, `CONTEXT_CAPSULE_V3_SECTION_IDS`) map cleanly onto them — we are not replacing the schema, we are organizing and deepening it.

| Pillar | Question it answers | v3 sections that feed it | What it must become |
|---|---|---|---|
| **USERS** | *Who is this for, and what do they already know?* | `identity`, `businessUseCase` (audience, decision horizon), `humanTacitKnowledge` (10 fields), `reasoningScaffold.privateNotes`, linked `AnalystProfile` | A living model of the team's mandate, red lines, tacit habits, and **what the capsule has learned from their corrections**. |
| **SITUATION** | *What is true, from what sources, when, and why?* | `sourceSpine`, `claimLedger`, `contextCaptureProfile`, the embedded graph, `memoryPosture` | The substantive knowledge core: typed graph + **temporal** + **causal** claim ledger with **receipts**, bound to a **dynamic ontology** and a **semantic layer**. |
| **TOOLS** | *What may agents do here, and how?* | `agentOperatingContract` (allowed/forbidden actions, source requirements, review checkpoints, tool recommendations, stop conditions), `governance.agentsMayMutateCanonical` | An enforceable contract that the orchestrator and every tool actually read at runtime — not just text. |
| **OUTPUT** | *What deliverables, with what proof and review?* | `outputContracts`, `marketplaceProfile`, `evaluation` | Typed deliverables with citation/review requirements and a **filled-in evaluation scorecard** that proves the capsule beats a generic LLM. |

The workbench, the builder, and the consumption layer should all speak in these
four pillars so the mental model is consistent end to end.

---

## 2. What we have done so far (honest current state)

Grounded in a 2026-06-01 code read. Capsule v3 is **amber**: a well-structured
*storage* layer that is not yet a *runtime knowledge* layer.

**Solid today**
- **Schema depth** — `capsule-v3.ts` (~1,130 lines) models 13 sections. `humanTacitKnowledge` (10 fields), `sourceSpine` (freshness/independence), `claimLedger` (supported/weak/unsupported/disputed/stale/inferred buckets), `governance` (human-gate + review cards), `agentOperatingContract` are all richly typed. Stored at `ContextCapsules/{id}` with `versions/{vN}` snapshots (`capsule-service.ts`, `capsule-details-service.ts`).
- **Guided creation** — `CapsuleBuilderWizard.tsx` is a no-JSON, 6-step flow (Job → Sources → Output → Tools → Test → Publish) with AI-assisted hydration from a login prompt (`inferDomainFromPrompt`, `inferTagsFromPrompt`).
- **Display** — `CapsuleWorkbenchPanel.tsx` (~1,186 lines) renders an embedded `react-force-graph-2d` graph colored by ACO type (`aco-colors.ts`) with typed edges, plus Claims/Sources/Memory/History tabs.
- **Quality scoring** — `capsule-quality.ts` `deriveCapsuleQuality()` scores 6 dimensions (completeness, source support, freshness, human review, output readiness, agent operability) with diagnostic codes.
- **Ontology + extraction defined** — ACO v2.0 (14 entity types, 72 relationships) in `src/lib/graph/core-primitives.ts`; 9 ontology domains in `src/lib/ontology/`; `entity-extraction.ts` turns documents into ACO nodes/edges via Gemini Pro + Zod.

**The 8 biggest gaps** (these define the roadmap in §4)

1. **Capsules are not in the Ask context stack.** They are built and stored but unreachable by Ask — `ActiveContextStack` is situation-shaped; capsules have no parallel attach/swap path. *Capsules exist in isolation.*
2. **No temporal modeling.** Claims/sources/capsules lack `validFrom`/`validUntil`/`asOf`. Freshness is a heuristic, not a tracked dimension.
3. **Ontology is external.** The ACO graph exists, but a capsule never declares the entity/relationship subtypes it owns; `contextCaptureProfile` is effectively a placeholder. No validation, no *dynamic* (capsule-local) ontology.
4. **No closed-loop learning.** `feedback-service.ts` captures user feedback; capsules don't improve from it. Quality scores name gaps but nothing patches them.
5. **Graph embedding is optional.** A capsule can exist with no graph; the graph is an external index, not the capsule's runtime model.
6. **Evaluation section is empty.** The 13th section has no internal schema; dry-run eval returns pass/fail with no scorecard.
7. **Sources lack receipts.** `sourceSpine` is a flat reference list — no claim-level proof-points, snippets, page/char offsets, or confidence coupling.
8. **Causality is missing.** Causal relationships exist in the graph type system but capsules don't surface or enforce cause→effect chains.

---

## 3. Target capability upgrades (the substance)

### 3.1 Creation — co-pilot + document-first + progressive depth
- **One-sentence start, depth optional.** Keep step 1 as a single prompt. Everything else is co-pilot-proposed and human-gated, surfaced only when the user wants depth.
- **Capsule Architect agent.** From the job prompt + any dropped documents, propose: domain + **ontology bindings** (which ACO entity/relationship subtypes this capsule owns), candidate **sources**, a draft **claim ledger** with receipts, and a short list of **tacit-knowledge questions** to ask the user. Each proposal lands as a review card (reuse the governance/review-card flow), never auto-committed.
- **Document-first path.** Drop a folder → `entity-extraction.ts` → proposed graph + claims + sources → user curates. Make creation *start* from evidence, not a blank form.
- **Structured elicitation.** Short guided interview that fills `humanTacitKnowledge` (red lines, constraints, approval politics, heuristics), the **decision horizon / validity window** (temporality), and the **primary causal drivers** (causality) — the data the schema almost models but the builder never asks for.

### 3.2 Content — claim ledger 2.0 (temporal · causal · receipted · typed)
Upgrade `ContextCapsuleClaim` so each claim carries:
- **Temporality** — `validFrom`, `validUntil`, `asOf`; staleness derived from validity, not heuristics; supports "as-of" queries.
- **Causality** — directed links (`causes`, `causedBy`, `enables`, `blocks`, `escalates`, `deEscalates`) between claims/events, reusing the ACO causal relationship set.
- **Receipts** — `EvidenceReceipt[]`: `{sourceId, url, publisher, date, reliabilityTier, snippet, charOffset|page, embedding, confidence}`. Claim support status is *computed* from receipts, not asserted. This is the capsule-side counterpart of the `sourceability-ledger` work in the playbook P0.1.
- **Ontology type** — every claim/node tagged with its ACO entity type + subtype; validated against the capsule's declared ontology binding.
- **Lifecycle** — `proposed → reviewed → canonical → disputed → stale`, governed by review cards.

### 3.3 Embedded graph · dynamic ontology · semantic layer
- **Graph is mandatory, not optional.** A capsule without a graph is "thin"; the quality meter says so. The embedded graph is the capsule's runtime model, mirrored to GraphLite/Neo4j as *derived* indexes only (Firestore canonical).
- **Dynamic ontology binding.** `contextCaptureProfile` becomes a real contract: declared entity/relationship subtypes + **capsule-local ontology extensions** (custom subtypes a team needs). Extensions can be **promoted to the global ACO** via governance + an admin gate (mirrors the domain-evolution pattern in CLAUDE.md). The ontology evolves with use — *dynamic*, not frozen.
- **Semantic layer everywhere.** Embed every section + claim + source snippet (768-dim `text-embedding-005`, `vector-layer.ts`) so retrieval works *within* a capsule and **cross-capsule similarity** is possible (find related capsules, dedupe, suggest merges).
- **Ontology validation on write.** When a claim/source/entity is added, validate it against the declared ontology; unknown types become *candidate extensions* surfaced for the user, not silent drops.

### 3.4 Display / workbench — legible knowledge object
- **Pillar-organized workbench.** Tabs/panels for Situation (graph + **timeline** + claims + sources), Users (profile + tacit), Tools (contract), Output (contracts + drafts) — the §1 mental model made visual.
- **Timeline + causal views.** Add a time-scrubber over the graph and a dedicated causal-chain view (escalation/de-escalation). Reuse `vis-timeline` (already a dep) and the force-graph.
- **Live quality meter.** Render `deriveCapsuleQuality()` per-section with "fix this" actions that open the relevant review card / builder step.
- **Provenance depth.** Click any claim → see its receipts with snippets, dates, reliability, and confidence. No more flat source lists.

### 3.5 Usage / consumption — capsule as first-class context
- **ActiveContextStack supports capsules.** Attach/detach/swap capsules before invoking Ask/Boardroom/Memo; merge several with explicit precedence.
- **`<capsule-frame>` in the system prompt.** `buildCalibratedContext` emits a capsule block (declared ontology, top claims with receipts, validity window, agent contract) alongside `<analyst-profile>` and `<situation-frame>` (`system-prompt-block.ts`).
- **Grounded answers cite the capsule.** Ask answers reference the capsule's receipts, closing the loop with the playbook's sourceability badges (P0.1) and triage/source-checking lane (P1.1).

### 3.6 Analysis & quality 2.0
- **Extend `deriveCapsuleQuality()`** with: temporality coverage, causality coverage, ontology-binding coverage, receipt depth (claims with ≥1 receipt), and **contradiction rate** (claims whose receipts disagree).
- **Fill the `evaluation` section.** A real scorecard: golden questions, grounded-answer rate, contradiction rate, source independence, and a **capsule-vs-generic-LLM** comparison (revive the intent of the retired `agentic-research-evals` as a live eval, stored in `evaluation`).
- **Contradiction detection.** Cross-claim check using the semantic layer + receipt dates; surface disputes into `claimLedger.disputed` automatically (review-gated before canonical).

### 3.7 Learning — closed loop under governance
Three sources of learning, all landing as **human-gated review cards** (never silent mutation of canonical):
- **From the user.** `feedback-service.ts` → patch proposals. When a user corrects an answer or edits a claim, capture the delta into `humanTacitKnowledge` / `claimLedger` as a proposed patch.
- **From documents.** Turn `audit-capsule-research-dossiers` from a diagnostic into a **live backfill worker**: new document → extract entities/claims/sources → propose patches into the graph + claim ledger.
- **From use.** Every grounded Ask logs which claims/sources were used or contradicted → update support scores, flag stale/disputed, and suggest the next sources to acquire (`sourceSpine.gaps`). The capsule gets better the more it's used.

---

## 4. Phased roadmap (CAP-1 … CAP-7)

Ordered by leverage. CAP-1 unblocks the product; CAP-2 makes answers trustworthy;
the rest deepen and compound. Each maps to a work packet in §5.

- **CAP-1 — Wire capsules into Ask (consumption).** *P0.* Without this, every other capsule investment is invisible. Attach/swap in `ActiveContextStack`; emit `<capsule-frame>`.
- **CAP-2 — Claim ledger 2.0: receipts + temporality + causality.** *P0.* Makes capsule answers sourceable, temporal, causal. Ties to playbook P0.1.
- **CAP-3 — Dynamic ontology binding + semantic layer.** *P1.* Make `contextCaptureProfile` real; embed everything; validate on write; capsule-local extensions.
- **CAP-4 — Creation co-pilot + document-first + elicitation.** *P1.* The biggest UX leap for new users.
- **CAP-5 — Workbench upgrades: pillars, timeline, causal view, quality meter, provenance.** *P2.*
- **CAP-6 — Closed-loop learning (user · documents · use).** *P2.*
- **CAP-7 — Quality 2.0 + filled evaluation scorecard + contradiction detection.** *P2.*

---

## 5. CODEX work packets

Each: **Goal · Read · Touch · Done-when.** Always finish with the §6 gate. Use TDD
(failing test first). Respect playbook §2 hard rules: no model-string hardcoding,
no security-file edits, every AI route through `withCalibration`, Firestore
canonical, no new top-level routes (capsule features are panels in the cockpit).

### CAP-1 — Capsules in the Ask context stack
- **Goal:** attach/detach/swap a capsule (or several) before Ask/Boardroom/Memo, and have its context reach the model.
- **Read:** `src/components/app/use-active-context-stack.ts`, `src/lib/context/profile-context.ts` (`buildCalibratedContext`), `src/lib/context/system-prompt-block.ts`, `src/app/api/context/capsules/route.ts`, `capsule-service.ts`.
- **Touch:** extend `ActiveContextStack` to hold capsule refs; add a capsule picker in the Ask/cockpit shell; make `buildCalibratedContext` load attached capsules and emit a `<capsule-frame>` (declared ontology, top claims+receipts, validity window, agent contract) in `systemPromptBlock`. Merge precedence when multiple capsules are attached.
- **Done-when:** attaching a capsule visibly changes an Ask answer and the answer references capsule claims; `npm run audit:capsule-contract` + `node scripts/audit-ai-routes.mjs` pass.

### CAP-2 — Claim ledger 2.0 (receipts · temporality · causality)
- **Goal:** every claim carries receipts, validity dates, and causal links; support status is computed from receipts.
- **Read:** `capsule-v3.ts` (`ContextCapsuleClaim`, `sourceSpine`), `src/lib/knowledge/evidence-envelope.ts`, `src/lib/ai/sourceability-ledger.ts`, `src/lib/graph/core-primitives.ts` (causal relationships).
- **Touch:** add `EvidenceReceipt` type and `validFrom/validUntil/asOf` + causal-link fields to `ContextCapsuleClaim`; compute support status from receipts; migrate existing flat `sourceSpine` refs into receipts (write a one-shot migration, keep back-compat read). Update Zod validators in `capsule-schema.ts` and the version-upgrade path.
- **Done-when:** a claim with a contradicting receipt is auto-marked disputed; an "as-of" read returns only valid claims; `npm run audit:capsule-v3` + `npm run audit:capsule-memory-contract` pass; migration tested.

### CAP-3 — Dynamic ontology binding + semantic layer
- **Goal:** capsules declare and validate their ontology, support capsule-local extensions, and embed every section/claim/source.
- **Read:** `src/lib/ontology/{types,registry}.ts`, `src/lib/graph/core-primitives.ts`, `src/lib/knowledge/vector-layer.ts`, `capsule-v3.ts` (`contextCaptureProfile`), `src/lib/domain/*` (use the domain-evolution + admin-gate pattern as the model for promotion).
- **Touch:** make `contextCaptureProfile` a real binding (entity/relationship subtypes owned + capsule-local extensions); validate entities/claims on write, surfacing unknown types as candidate extensions; embed sections/claims/source snippets via `vector-layer.ts`; add a governance-gated "promote extension to global ACO" admin action.
- **Done-when:** adding an off-ontology entity surfaces a candidate-extension card (not a silent drop); cross-capsule similarity returns sensible neighbors; `npm run audit:ontology` + `npm run audit:embedding-dim` pass.

### CAP-4 — Creation co-pilot + document-first + elicitation
- **Goal:** scaffold a capsule from one sentence or a folder of documents; ask for depth progressively.
- **Read:** `CapsuleBuilderWizard.tsx`, `src/app/api/capsules/route.ts`, `entity-extraction.ts`, `src/lib/context/capsule-associations.ts`, the governance/review-card flow in `capsule-v3.ts`.
- **Touch:** add a "Capsule Architect" route (calibrated AI) that, from prompt + uploaded docs, proposes domain, ontology bindings, sources, a draft receipted claim ledger, and tacit-knowledge questions — all as review cards; add a document-first entry (drop folder → extract → curate); add the elicitation step (red lines, constraints, decision horizon/validity, causal drivers).
- **Done-when:** creating from a prompt + 2 PDFs yields a capsule pre-populated with a graph, ≥3 receipted claims, and a proposed ontology binding, all human-gated; `npm run audit:capsule-context-capture` passes.

### CAP-5 — Workbench: pillars, timeline, causal view, quality meter, provenance
- **Goal:** the capsule reads as a legible knowledge object across the four pillars.
- **Read:** `CapsuleWorkbenchPanel.tsx`, `aco-colors.ts`, `capsule-quality.ts`, deps `vis-timeline` + `react-force-graph-2d`.
- **Touch:** reorganize the workbench into Situation/Users/Tools/Output panels; add a timeline (time-scrubber over the graph) and a causal-chain view; render the live quality meter with per-section "fix this" actions; make claims expand to their receipts (snippet/date/tier/confidence).
- **Done-when:** the workbench shows a timeline, a causal view, a live quality score, and clickable receipts; `npm run audit:capsule-legibility` + `npm run audit:capsule-depth` pass.

### CAP-6 — Closed-loop learning (user · documents · use)
- **Goal:** capsules improve from corrections, new documents, and usage — all human-gated.
- **Read:** `feedback-service.ts`, `scripts/audit-capsule-research-dossiers.ts`, `scripts/backfill-capsule-research-dossiers.ts`, `memoryPosture`/`governance` in `capsule-v3.ts`, `sourceability-ledger.ts`.
- **Touch:** route user feedback + answer corrections into proposed `humanTacitKnowledge`/`claimLedger` patches (review cards); turn the research-dossier backfill into a live worker (new doc → proposed graph/claim patches); log per-answer claim/source usage to update support scores, staleness, and `sourceSpine.gaps`.
- **Done-when:** a thumbs-down with a correction creates a review card that, when approved, updates the capsule and bumps its version; `npm run audit:capsule-backfill-readiness` passes.

### CAP-7 — Quality 2.0 + evaluation scorecard + contradiction detection
- **Goal:** prove capsule quality and that the capsule beats a generic LLM.
- **Read:** `capsule-quality.ts`, `app/api/capsules/eval/dry-run/route.ts`, the `evaluation` section in `capsule-v3.ts`, `scripts/eval-agentic-research.ts`.
- **Touch:** extend `deriveCapsuleQuality()` (temporality/causality/ontology/receipt-depth/contradiction-rate); define the `evaluation` schema and fill it via a golden-question eval (grounded-answer rate, contradiction rate, source independence, capsule-vs-generic comparison); add cross-claim contradiction detection feeding `claimLedger.disputed`.
- **Done-when:** a capsule shows a populated evaluation scorecard and a capsule-vs-generic delta; contradictions auto-surface as disputed (review-gated); `npm run audit:capsule-depth` + `npm run eval:agentic-research` pass.

---

## 6. Capsule validation gate (run before each PR / deploy)

```bash
npx tsc --noEmit
npx vitest run <touched capsule files>
npm run lint
npm run audit:capsule-contract
npm run audit:capsule-v3
npm run audit:capsule-memory-contract
npm run audit:capsule-context-capture
npm run audit:capsule-depth
npm run audit:capsule-legibility
node scripts/audit-ai-routes.mjs        # any new capsule AI route must be calibrated
npm run build
```
Deploy only via Cloud Build after the human signs off (`gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus`).

---

## 7. Sequential CODEX prompts (paste in order)

Each prompt is self-contained, points at this plan, embeds guardrails, and ends with the §6 gate. Run CAP-1 and CAP-2 first; they unblock and de-risk the rest.

**Prompt A — CAP-1 (capsules in Ask):**
```text
Implement CAP-1 from docs/product/PRAXIS_CAPSULE_EXCELLENCE_PLAN.md §5. Make a capsule
attachable/swappable in the Ask context stack and reach the model via a <capsule-frame>.
Read the §5 CAP-1 "Read" list first. Use TDD. Guardrails (playbook §2): no model-string
hardcoding, no security-file edits, every AI route via withCalibration, Firestore canonical,
no new top-level route. Done-when: attaching a capsule changes an Ask answer and the answer
references capsule claims. Run the §6 gate, report diff + gate output, add a CHANGELOG
[Unreleased] entry. Do not deploy.
```

**Prompt B — CAP-2 (claim ledger 2.0):**
```text
Implement CAP-2 from docs/product/PRAXIS_CAPSULE_EXCELLENCE_PLAN.md §5: add EvidenceReceipt,
validFrom/validUntil/asOf, and causal links to ContextCapsuleClaim; compute support from
receipts; migrate flat sourceSpine refs with back-compat reads; update Zod + version upgrade.
Read the §5 CAP-2 list. Use TDD. Same guardrails. Done-when: contradicting receipt auto-marks
a claim disputed and an as-of read filters by validity. Run the §6 gate, report, add CHANGELOG.
Do not deploy.
```

**Prompt C — CAP-3 (dynamic ontology + semantic layer):**
```text
Implement CAP-3 from docs/product/PRAXIS_CAPSULE_EXCELLENCE_PLAN.md §5: make
contextCaptureProfile a real ontology binding with capsule-local extensions, validate on write
(unknown types -> candidate-extension cards), embed sections/claims/sources via vector-layer.ts,
and add a governance-gated promote-to-global admin action (use the domain-evolution pattern).
Read the §5 CAP-3 list. TDD + guardrails. Done-when: off-ontology entity surfaces a candidate
card and cross-capsule similarity works. Run the §6 gate, report, add CHANGELOG. Do not deploy.
```

**Prompt D — CAP-4 (creation co-pilot + document-first):**
```text
Implement CAP-4 from docs/product/PRAXIS_CAPSULE_EXCELLENCE_PLAN.md §5: a calibrated "Capsule
Architect" that scaffolds domain, ontology bindings, sources, a receipted draft claim ledger,
and tacit-knowledge questions from a prompt + uploaded documents — all as human-gated review
cards; plus a document-first entry and the elicitation step (red lines, constraints, decision
horizon/validity, causal drivers). Read the §5 CAP-4 list. TDD + guardrails. Done-when:
prompt + 2 PDFs yields a capsule with a graph, >=3 receipted claims, and a proposed ontology
binding, all gated. Run the §6 gate, report, add CHANGELOG. Do not deploy.
```

**Prompt E — CAP-5 (workbench upgrades):**
```text
Implement CAP-5 from docs/product/PRAXIS_CAPSULE_EXCELLENCE_PLAN.md §5: reorganize
CapsuleWorkbenchPanel into Situation/Users/Tools/Output panels; add a timeline (vis-timeline)
and a causal-chain view; render the live quality meter with "fix this" actions; expand claims
to their receipts. Read the §5 CAP-5 list. TDD + guardrails (no new top-level route — this is a
panel). Done-when: timeline, causal view, live quality score, and clickable receipts all render.
Run the §6 gate, report, add CHANGELOG. Do not deploy.
```

**Prompt F — CAP-6 (closed-loop learning):**
```text
Implement CAP-6 from docs/product/PRAXIS_CAPSULE_EXCELLENCE_PLAN.md §5: route user feedback +
answer corrections into proposed humanTacitKnowledge/claimLedger patches (review cards); turn
the research-dossier backfill into a live worker (new doc -> proposed graph/claim patches);
log per-answer claim/source usage to update support scores, staleness, and sourceSpine.gaps.
All mutations human-gated, never silent. Read the §5 CAP-6 list. TDD + guardrails. Done-when:
a thumbs-down + correction creates a review card that on approval updates the capsule and bumps
its version. Run the §6 gate, report, add CHANGELOG. Do not deploy.
```

**Prompt G — CAP-7 (quality 2.0 + evaluation):**
```text
Implement CAP-7 from docs/product/PRAXIS_CAPSULE_EXCELLENCE_PLAN.md §5: extend
deriveCapsuleQuality() (temporality/causality/ontology/receipt-depth/contradiction-rate);
define and fill the evaluation section via a golden-question eval with a capsule-vs-generic-LLM
delta; add cross-claim contradiction detection feeding claimLedger.disputed (review-gated).
Read the §5 CAP-7 list. TDD + guardrails. Done-when: a capsule shows a populated evaluation
scorecard + capsule-vs-generic delta, and contradictions auto-surface as disputed. Run the §6
gate, report, add CHANGELOG. Then stop and ask the human before deploying.
```

---

## 8. Done-state definition

Capsules are "excellent" when: (1) attaching one measurably changes and improves an
Ask answer with cited receipts; (2) every claim is receipted, dated, and causally
linked; (3) the ontology is declared, validated, and able to evolve; (4) a new user
can create a strong capsule from a sentence or a folder in minutes; (5) the workbench
reads as a knowledge object across the four pillars; (6) the capsule improves itself
from corrections, documents, and use under governance; and (7) an evaluation scorecard
proves it beats a generic LLM. Track this state in this file's §2 as work lands, and
mirror shipped items into `docs/PRAXIS_CODEX_PLAYBOOK.md` §4/§5.
