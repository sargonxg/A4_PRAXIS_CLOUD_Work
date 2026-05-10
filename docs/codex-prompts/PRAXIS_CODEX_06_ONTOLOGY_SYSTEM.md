# PRAXIS — Codex Pack 06: Ontology System & Knowledge Structuring

**Branch**: `feature/ontology-system`
**Depends on**: Packs 03, 04, 05 merged.
**Owner gate**: Do not merge to `main` without Giulio's sign-off.
**Estimated effort**: ~5 days (~55 engineering hours).

---

## 0. Why this pack exists

PRAXIS today has one ontology hard-coded into the codebase: the eight ACO primitives (Actor, Claim, Interest, Constraint, Leverage, Commitment, Event, Narrative). They live in `src/lib/graph/core-primitives.ts` as a string array. Extraction logic lives in `backend/graphify_tacitus/extract.py` with prompts that assume a Syria-style geopolitical case. There is no concept of "this case uses ontology X."

That is fine for one demo. It is wrong for a product.

The product premise — surfaced by packs 03 (workbench), 04 (landing), 05 (context vs tools) — is that a user creates a **situation** (any situation: geopolitical conflict, workplace mediation, institutional governance dispute, narrative analysis), and PRAXIS structures the knowledge of that situation into a graph the user can analyze. For that promise to hold, the **structuring layer** must be:

1. **Pluggable** — the eight ACO primitives are the substrate, but each domain gets a *lens* that maps domain-specific concepts onto ACO and adds domain-specific subtypes, validators, extraction prompts, and example libraries.
2. **Pickable** — the case-creation flow lets the user choose an ontology, or accept an auto-suggestion based on case description.
3. **Validated** — every node added to the graph is checked against the active ontology's rules; violations either reject the node or flag a warning that propagates to the Context Health Score (pack 05).
4. **Beautifully introspectable** — the user can inspect the active ontology (primitives, relations, constraints) without leaving the workbench, so they understand what shape their knowledge is taking.
5. **Powered by LangGraph** — ingestion is a deterministic state machine: extract candidates → symbolic-firewall validate → trust-score → human-review-or-auto-merge → persist (Firestore + Neo4j atomic write) → recompute Context Health.

This pack ships four ontologies to prove the pattern: **Conflict** (the canonical ACO ontology, refactored from the existing constants), **Mediation** (party / position / interest / BATNA / ZOPA / agreement clause), **Governance** (institution / mandate / decision / vote / compliance), and **Narrative** (frame / claim / counter-claim / source / audience / sentiment shift). Every ontology maps cleanly to the eight ACO primitives — that constraint preserves graph-layer uniformity. Domain richness lives in *subtypes*, *relation types*, and *validators*.

After this pack, a user can create a workplace-mediation case, get the Mediation ontology auto-suggested from "my team has a conflict," upload a Slack export, watch LangGraph extract Parties and Positions and BATNAs, see those proposals queued for review, accept them, and watch the Context Health Score climb from 0 to 70+. None of that path exists today.

---

## 1. Outcomes

| # | Outcome | Verification |
|---|---|---|
| 1 | Ontology framework with Conflict / Mediation / Governance / Narrative as concrete instances | `src/lib/ontology/registry.ts` lists 4 ontologies; each exports primitives, relations, validators |
| 2 | Every ontology subtype maps to one of the 8 ACO primitives | `npm run audit:ontology-mapping` passes |
| 3 | Case creation flow includes ontology picker + auto-suggest | E2E test: create case → ontology suggested → user accepts/overrides → case persists with `ontologyId` |
| 4 | LangGraph ingestion pipeline accepts a document, returns proposals, validates against active ontology, persists atomically | Integration test: ingest a fixture document for each ontology → expected proposals appear → invalid proposals rejected with reason |
| 5 | Per-ontology validators catch domain-specific violations | Unit tests: 5+ violation cases per ontology |
| 6 | Ontology versioning + migration system | `npm run audit:ontology-versions` lists current versions; migration script `scripts/migrate-ontology-version.ts` exists and dry-runs cleanly |
| 7 | Existing Syria 2026 graph migrated to v1 of Conflict ontology with no data loss | `scripts/verify-syria-migration.ts` passes; node + edge counts identical pre/post |
| 8 | User can browse the active ontology in workbench (read-only schema viewer) | Visit `/app/workbench/<caseId>?tab=ontology` → primitives, subtypes, relations, validators rendered |
| 9 | Audit gate updated: `audit:ontology-coverage`, `audit:ontology-mapping`, `audit:ontology-versions` | `npm run audit:gate` runs all three and exits 0 |

---

## 2. Pre-work confirmation note (Codex must send before writing code)

Codex agent: paste this back to Giulio with your answers BEFORE you touch any file.

> I have read the pack. I understand:
> 1. The eight ACO primitives (Actor, Claim, Interest, Constraint, Leverage, Commitment, Event, Narrative) are the **substrate**. New ontologies are **lenses** over that substrate. Domain concepts are encoded as **subtypes** of an ACO primitive plus relation types and validators. I will NOT introduce a new top-level primitive without a Giulio-approved RFC.
> 2. The four ontologies to ship are: **Conflict** (canonical, generalized from current Syria-shaped extractor), **Mediation** (workplace + multi-party negotiation), **Governance** (institutional decision-making), **Narrative** (frame/discourse analysis). Each lives under `src/lib/ontology/<id>/`.
> 3. Ingestion runs through a LangGraph state machine in `backend/ingestion/pipeline.py` with checkpointing via the existing `langgraph-checkpoint-postgres` dependency.
> 4. Every node and edge written to the graph carries `ontologyId`, `ontologyVersion`, `subtype`, and the four pack-05 truth-layer fields (`layer`, `confidence`, `provenance[]`, `validFrom`/`validTo` + `assertedFrom`/`assertedTo`).
> 5. I will NOT weaken `firestore.rules`, will NOT add model strings outside `src/lib/ai/providers.ts`, will NOT bypass `withCalibration` or `withContextHealthGate`, will NOT bypass the symbolic firewall.
> 6. I will run `npm run audit:gate` and `pytest backend/ -q` after each prompt; both must pass before moving to the next.
>
> Open questions for Giulio:
> - **Q1**: Mediation ontology subtype list — proposed: `Party` (Actor), `Position` / `Interest` / `BATNA` / `ZOPA` / `AgreementClause` / `Breach` (Claim variants), `TrustSignal` (Event), `Escalation` / `DeEscalation` (Event). Confirm or amend.
> - **Q2**: Auto-suggest threshold — when LLM classifier returns confidence ≥ 0.75 for a single ontology, default-select it and let user override; below 0.75, present top 2 options. Acceptable?
> - **Q3**: Multi-ontology cases — should a case be allowed to use a primary ontology + secondary "lens" (e.g., a Syria conflict case ALSO viewed through the Narrative lens)? Recommendation: yes, single primary `ontologyId`, optional `auxiliaryLenses: string[]`. Confirm.
> - **Q4**: Existing Syria graph — confirmed migration target is `conflict@v1.0.0`. Subtype assignment for current nodes will be inferred from existing `metadata.subtype` if present, else defaulted to the primitive type itself (e.g., an Actor with no subtype becomes `Actor.generic`). Acceptable?

Wait for answers. Do not proceed without them.

---

## 3. Pack overview

| Prompt | Outcome | Est. hrs |
|---|---|---|
| E1 | Ontology framework: types, base interfaces, registry skeleton | 5 |
| E2 | Migrate Conflict ontology (the canonical 8 primitives + subtypes + validators) | 6 |
| E3 | Ship Mediation ontology | 5 |
| E4 | Ship Governance ontology | 5 |
| E5 | Ship Narrative ontology | 5 |
| E6 | Ontology picker UI in case creation + workbench schema viewer | 6 |
| E7 | Auto-suggest classifier (LangGraph) for ontology selection | 5 |
| E8 | LangGraph ingestion pipeline with symbolic-firewall + transactional persistence | 12 |
| E9 | Per-ontology validators, drift tests, versioning + migration system | 6 |
| **Total** | | **~55** |

---

## 4. Hard rules (apply to every prompt in this pack)

- The eight ACO primitives in `src/lib/graph/core-primitives.ts` are immutable. New domain concepts become **subtypes** of an existing primitive, never a 9th primitive.
- Every persisted node carries: `id`, `caseId`, `ownerUid`, `ontologyId`, `ontologyVersion`, `primitive` (one of the 8), `subtype`, `label`, `confidence`, `layer` (Source/Claim/Evidence/Verdict from pack 05), `provenance: ProvenanceEntry[]`, `validFrom`, `validTo`, `assertedFrom`, `assertedTo`, `createdAt`, `createdBy`, `updatedAt`. Schema is enforced by Zod on the TS side and Pydantic on the Python side. JSON Schema mirror lives at `schemas/node.schema.json`.
- Every persisted edge carries: `id`, `caseId`, `ontologyId`, `relationType`, `sourceId`, `targetId`, `confidence`, `provenance: ProvenanceEntry[]`, `validFrom`, `validTo`, `assertedFrom`, `assertedTo`, `createdAt`, `createdBy`. Same triple-schema rule.
- Ingestion is **always** transactional. Firestore write and Neo4j write succeed together or roll back together. Implement via the two-phase pattern: write to Firestore with `status: 'pending'`, write to Neo4j, mark Firestore `status: 'committed'`. Reconciler in `scripts/verify-firestore-neo4j-sync.ts` (built in pack 05) catches stragglers.
- Every ingestion run is checkpointed via `langgraph-checkpoint-postgres`. A run can be resumed after crash without duplicate writes.
- The symbolic firewall (`backend/agents/firewall/`) sits between extraction and persistence. No node or edge bypasses it.
- Model strings remain ONLY in `src/lib/ai/providers.ts`. Backend Python equivalents live ONLY in `backend/ai/providers.py`.
- Every AI-touching API route uses `withCalibration`. Every analysis route also uses `withContextHealthGate` (pack 05). Ingestion routes use `withCalibration` only (they are how Context Health goes UP, so gating them on Context Health would be circular).
- No client-side Firestore reads cross `ownerUid` boundaries. Every query starts at `users/{uid}/situations/{caseId}/...`.
- All new code is TypeScript strict / Python typed (mypy --strict on new modules). No `any`, no `# type: ignore` without a comment explaining why.
- Tests live next to code: `*.test.ts` for TS, `tests/test_*.py` for Python. Each prompt's DoD includes new tests.

---

## 5. Prompt E1 — Ontology framework: types, base interfaces, registry skeleton

### Persona
You are a staff-level type-system designer. You build the abstraction once, correctly, because every later prompt in this pack depends on it. You do not generalize prematurely (no plugin loader, no DSL); you generalize exactly enough that four concrete ontologies fit cleanly.

### Outcome
The codebase has a typed, versioned ontology framework. Four ontology entries exist as empty-but-well-typed scaffolds. The registry compiles. No runtime behavior has changed yet — that is E2-E5.

### Files to create

- `src/lib/ontology/types.ts` — the core types:
  - `OntologyId = 'conflict' | 'mediation' | 'governance' | 'narrative'`
  - `SemVer = \`${number}.${number}.${number}\``
  - `OntologyPrimitive` — one of the eight ACO primitives (re-exported from `core-primitives.ts`)
  - `OntologySubtype { id: string; primitive: OntologyPrimitive; label: string; description: string; icon: string; constraints: SubtypeConstraint[] }`
  - `OntologyRelation { id: string; label: string; sourceSubtypeIds: string[]; targetSubtypeIds: string[]; cardinality: 'one-to-one' | 'one-to-many' | 'many-to-many'; required: boolean }`
  - `OntologyValidator { id: string; severity: 'reject' | 'warn'; appliesTo: 'node' | 'edge' | 'graph'; check: (input: unknown, ctx: ValidatorContext) => ValidatorResult }`
  - `Ontology { id: OntologyId; version: SemVer; label: string; description: string; suggestedFor: string[]; subtypes: OntologySubtype[]; relations: OntologyRelation[]; validators: OntologyValidator[]; examplePrompts: string[]; sampleCaseIds: string[] }`
  - `ValidatorContext { caseId: string; ownerUid: string; existingGraph: GraphSummary; currentDocuments: DocumentRef[] }`
  - `ValidatorResult { ok: boolean; reason?: string; remediation?: string }`
- `src/lib/ontology/registry.ts` — exports `getOntology(id: OntologyId): Ontology`, `listOntologies(): Ontology[]`, throws on unknown id. Empty `subtypes`/`relations`/`validators` arrays for now.
- `src/lib/ontology/conflict/index.ts`, `mediation/index.ts`, `governance/index.ts`, `narrative/index.ts` — each exports a stub `Ontology` with id, version `0.0.1`, label, description, empty arrays. These are filled in E2-E5.
- `src/types/ontology-bound-node.ts` — the canonical node shape every ontology must produce. Carries every field from §4 above.
- `src/types/ontology-bound-edge.ts` — same for edges.
- `schemas/node.schema.json`, `schemas/edge.schema.json` — JSON Schema versions, generated from the Zod schemas via `zod-to-json-schema`.
- `backend/ontology/__init__.py`, `backend/ontology/types.py` — Pydantic mirrors of `Ontology`, `OntologySubtype`, `OntologyRelation`, `OntologyValidator`. Pydantic models enforce the same field set as Zod.
- `src/lib/ontology/__tests__/registry.test.ts` — tests: registry returns all 4 ids; unknown id throws; every ontology has unique subtype ids; every subtype's primitive is one of the eight ACO primitives.
- `backend/tests/test_ontology_types.py` — Python parity test: every ontology id present, every subtype maps to one of the eight primitives.
- `scripts/audit-ontology-mapping.ts` — for every subtype across all ontologies, assert `subtype.primitive ∈ TACITUS_CORE_PRIMITIVES`. Print a table. Exit 1 on violation.

### Files to edit
- `package.json` — add `audit:ontology-mapping` script: `tsx scripts/audit-ontology-mapping.ts`. Add `audit:ontology-mapping` to the `audit:gate` chain.
- `src/lib/graph/core-primitives.ts` — re-export `TACITUS_CORE_PRIMITIVES as ACO_PRIMITIVES` for ontology-layer code that should NOT depend on the legacy name. Keep the original export for backward compat.

### Hard rules
- The four ontology stubs MUST compile, MUST be importable, MUST register on the registry. They are not yet functional.
- Do not put any case-specific logic in `types.ts`. It is pure types + Zod schemas.
- The Pydantic mirrors MUST be field-for-field identical with the Zod schemas. Add a parity test that loads both and asserts field name equality.

### Definition of Done
- `npm run typecheck` clean.
- `npm run audit:ontology-mapping` exits 0 (passes vacuously since stubs have no subtypes — that is OK at this stage).
- `pytest backend/tests/test_ontology_types.py -q` green.
- `npm run test src/lib/ontology` green.
- New file count: 11. Lines added: ~600.

### Verification commands
```bash
npm run typecheck
npm run audit:ontology-mapping
npm run test -- src/lib/ontology
pytest backend/tests/test_ontology_types.py -q
```

---

## 6. Prompt E2 — Conflict ontology (canonical)

### Persona
You are a domain expert who has spent eight years on the Syria desk authoring 600+ analytical products. You know what an Actor is. You know the difference between an Interest and a Position. You know that a Commitment that is not Verifiable is a Narrative dressed up as a Commitment. You are encoding that knowledge.

### Outcome
The Conflict ontology is fully populated: 8 primitives × N subtypes (target: ~25-30 subtypes total), ~15-20 relation types, ~12 validators. Existing extraction logic in `backend/graphify_tacitus/extract.py` is refactored to consume the ontology declaratively (no more hard-coded prompts hidden in functions).

### Files to create / edit
- `src/lib/ontology/conflict/subtypes.ts` — subtypes. Suggested set:
  - Actor: `StateActor`, `NonStateArmedGroup`, `IGO`, `INGO`, `Diaspora`, `IndividualLeader`, `Mediator`
  - Claim: `Position`, `Interest`, `Constraint`, `Leverage`, `Commitment`, `Verdict`
  - Event: `Incident`, `Negotiation`, `Agreement`, `Breach`, `Escalation`, `DeEscalation`
  - Narrative: `Frame`, `CounterFrame`, `Disinformation`
  - (Interest, Constraint, Leverage, Commitment also exist as primitives — this is intentional; the primitive is the substrate, the subtype is a typed slot for graph queries)
- `src/lib/ontology/conflict/relations.ts` — relations: `ALLIES_WITH`, `OPPOSES`, `MEDIATES_BETWEEN`, `HAS_INTEREST`, `HAS_CONSTRAINT`, `MADE_COMMITMENT`, `BREACHED_COMMITMENT`, `PARTICIPATED_IN`, `RESULTED_IN`, `ESCALATES`, `DE_ESCALATES`, `FRAMES`, `COUNTERS`, `CITES_SOURCE`, `CONTRADICTS`.
- `src/lib/ontology/conflict/validators.ts` — at minimum:
  - `commitmentMustHaveDeadline` (warn if a Commitment lacks `validTo`)
  - `breachRequiresPriorCommitment` (reject a `BREACHED_COMMITMENT` edge if no prior Commitment)
  - `mediatorMustNotBeParty` (warn if an Actor is both `Mediator` and an endpoint of `OPPOSES`)
  - `claimNeedsAttribution` (reject a Claim without ≥1 provenance entry whose `kind === 'document'`)
  - `verdictRequiresEvidence` (reject a Verdict without ≥2 supporting Evidence-layer nodes — see pack 05 truth layers)
  - `escalationOrdering` (warn if an Escalation event timestamps before any Incident in the case)
- `src/lib/ontology/conflict/extraction-prompts.ts` — the prompt fragments the LangGraph extractor uses. One per primitive. Each prompt receives `{documentText, caseSummary, existingActorNames}` and returns JSON validated against a per-primitive Zod schema.
- `src/lib/ontology/conflict/index.ts` — wire the four files into the `Ontology` export. Bump version to `1.0.0`. Set `suggestedFor: ['armed conflict', 'geopolitical dispute', 'sanctions regime', 'peace negotiation']`. Set `sampleCaseIds: ['syria-2026', 'sahel-2026']`.
- `src/lib/ontology/conflict/__tests__/validators.test.ts` — at least 3 violation cases per validator (positive, negative, edge case).
- `backend/ontology/conflict.py` — Python parity: subtypes, relations, validators (validators in Python are the runtime check used during ingestion). Pydantic models for each subtype's payload schema.
- `backend/graphify_tacitus/extract.py` — refactor to read prompts from `backend/ontology/conflict.py` instead of hard-coding. Replace `extract_actors`, `extract_claims`, etc. functions with one parameterized `extract_for_subtype(ontology_id, subtype_id, document_text, context)` that loads the right prompt at runtime.
- `scripts/migrate-syria-to-conflict-v1.ts` — for the existing Syria 2026 case, walk every node and edge, attach `ontologyId='conflict'`, `ontologyVersion='1.0.0'`, infer `subtype` from existing `metadata.subtype` (fallback per Q4). Dry-run mode prints diff. Real mode writes Firestore + Neo4j atomically.
- `scripts/verify-syria-migration.ts` — pre/post node + edge counts must match. Pre: capture from current Syria case. Post: re-query after migration. Diff = 0 or fail.

### Hard rules
- Subtype IDs are stable strings (`'StateActor'`, `'Position'`). They become Firestore keys and Neo4j labels. Once shipped, they cannot be renamed without a migration.
- The migration script MUST be idempotent — running it twice does not double-stamp ontologyId.
- Every validator has a unit test with at least one passing and one failing case.
- Extraction prompts MUST forbid the LLM from inventing actors not grounded in the document. Inject `existingActorNames` into the prompt; instruct the model to reuse them when reasonable; if the model invents a new actor, the validator `claimNeedsAttribution` should reject claims attached to ungrounded actors at write time.

### Definition of Done
- `npm run audit:ontology-mapping` shows ~25-30 conflict subtypes, all mapping to ACO.
- `npm run test src/lib/ontology/conflict` green.
- `pytest backend/tests/test_conflict_ontology.py -q` green.
- `npx tsx scripts/migrate-syria-to-conflict-v1.ts --dry-run` prints expected diff and exits 0.
- After running for real, `npx tsx scripts/verify-syria-migration.ts` exits 0 (no node/edge count drift).
- Existing Syria E2E flow (Workbench → Syria case → 5 chapters) still passes Playwright.

### Verification commands
```bash
npm run audit:ontology-mapping
npm run test -- src/lib/ontology/conflict
pytest backend/tests/test_conflict_ontology.py -q
npx tsx scripts/migrate-syria-to-conflict-v1.ts --dry-run
npx playwright test e2e/workbench/syria-case.spec.ts
```

---

## 7. Prompt E3 — Mediation ontology

### Persona
You are a mediator certified in interest-based negotiation. You are encoding the Harvard Negotiation Project canon (Fisher, Ury) into a graph schema. You know that Position ≠ Interest, that BATNA is a property of an actor not an event, and that ZOPA is a derived geometry, not a thing parties type out.

### Outcome
The Mediation ontology is fully populated. The HR test case from Giulio's memory (Alex / Maya / Northwind Support / mediated by Jordan) becomes a runnable sample case under `src/lib/cases/northwind-mediation/`.

### Files to create
- `src/lib/ontology/mediation/subtypes.ts`:
  - Actor: `Party`, `Mediator`, `LegalCounsel`, `Witness`
  - Claim: `Position`, `Interest`, `BATNA`, `WATNA`, `ZOPA`, `AgreementClause`, `Breach`
  - Event: `Session`, `Caucus`, `Offer`, `CounterOffer`, `Acceptance`, `Walkout`, `TrustSignalPositive`, `TrustSignalNegative`
  - Narrative: `Story` (each party's account)
  - (Interest, Constraint, Leverage, Commitment as substrate primitives wherever they don't have a subtype-needed-form)
- `src/lib/ontology/mediation/relations.ts`: `IS_PARTY_TO`, `MEDIATED_BY`, `HOLDS_POSITION`, `HOLDS_INTEREST`, `HAS_BATNA`, `MADE_OFFER`, `RESPONDED_WITH`, `AGREED_TO`, `BREACHED`, `WITNESSED_BY`, `RECOUNTS`.
- `src/lib/ontology/mediation/validators.ts`:
  - `everyPartyHasInterest` (warn if an Actor.Party has zero `HOLDS_INTEREST` edges after 1 session)
  - `positionsImplyInterests` (warn if a Position node has no inferred parent Interest)
  - `batnaIsPrivate` (reject — at write time — any provenance entry on a BATNA node whose `audience` is not `'mediator-only'` or `'caucus-only'`)
  - `agreementClauseRequiresAcceptance` (reject an `AgreementClause` not preceded by `Acceptance`)
  - `mediatorImpartiality` (warn if Mediator has `HOLDS_POSITION` or `HOLDS_INTEREST` edges)
  - `walkoutTerminatesSession` (warn if a Walkout event is not the final event in a Session)
- `src/lib/ontology/mediation/extraction-prompts.ts` — domain-specific prompts. The Position vs Interest extraction is famously hard for LLMs; explicitly include 4-shot examples with rationale.
- `src/lib/ontology/mediation/index.ts` — wire it. Version `1.0.0`. `suggestedFor: ['workplace conflict', 'commercial mediation', 'family mediation', 'small-team disputes']`. `sampleCaseIds: ['northwind-mediation']`.
- `backend/ontology/mediation.py` — Python parity.
- `src/lib/cases/northwind-mediation/index.ts` — sample case definition. Pre-loads:
  - Actors: Alex (Party), Maya (Party), Jordan (Mediator)
  - Documents: 3 fictional Slack-export snippets, 1 HR complaint form, 1 manager 1:1 note (all under `src/lib/cases/northwind-mediation/fixtures/`)
  - Pre-extracted graph (so first-run Context Health Score is ~50, demonstrating that uploading the docs and running ingestion brings it to 70+)
- `src/lib/cases/northwind-mediation/__tests__/case.test.ts` — assert case loads, fixtures readable, expected Position/Interest pairs extractable.
- `e2e/workbench/northwind-mediation.spec.ts` — Mediator persona flow (10 min): create case → pick Mediation ontology → upload all 5 fixtures → run ingestion → review proposals → accept → see Context Health > 70 → run "Position vs Interest" tool → see Alex's Position ("I want to be moved off Maya's team") mapped to Interest ("recognition for after-hours support work").

### Hard rules
- BATNA confidentiality is enforced at the data layer, not the UI. Provenance entries on BATNA nodes carry `audience: 'mediator-only' | 'caucus-only' | 'shared'`. Firestore rules (read-only for client) filter on this. Validator above enforces write-time. UI is the third belt; do not rely on it.
- The Northwind sample case is fictional. No real names. Add a banner on the case page: "Synthetic data — do not treat as real".
- The Position-vs-Interest extraction prompt MUST be checked into the repo and reviewed line-by-line before merge. This is the single highest-leverage prompt in the pack.

### Definition of Done
- `npm run audit:ontology-mapping` includes Mediation subtypes, all mapping to ACO.
- `npm run test src/lib/ontology/mediation` green.
- `npm run test src/lib/cases/northwind-mediation` green.
- `pytest backend/tests/test_mediation_ontology.py -q` green.
- Playwright `e2e/workbench/northwind-mediation.spec.ts` green.

### Verification commands
```bash
npm run audit:ontology-mapping
npm run test -- src/lib/ontology/mediation src/lib/cases/northwind-mediation
pytest backend/tests/test_mediation_ontology.py -q
npx playwright test e2e/workbench/northwind-mediation.spec.ts
```

---

## 8. Prompt E4 — Governance ontology

### Persona
You are an institutional designer who has read Ostrom and Tsebelis. You know that a Veto Player is not a Stakeholder, that a Mandate is a kind of Constraint not a kind of Claim, and that Decisions and Votes are different events with different validity rules.

### Outcome
The Governance ontology is populated. A sample case under `src/lib/cases/un-cted-renewal/` (UN Counter-Terrorism Executive Directorate mandate-renewal scenario) demonstrates it.

### Files to create
- `src/lib/ontology/governance/subtypes.ts`:
  - Actor: `Institution`, `Stakeholder`, `VetoPlayer`, `Delegation`, `IndividualOfficial`
  - Claim: `Position`, `PolicyOption`, `LegalOpinion`, `ComplianceStatement`
  - Constraint: `Mandate`, `Procedure`, `Charter`, `Sunset` (substrate primitive used directly when no subtype adds value)
  - Commitment: `Pledge`, `Vote`, `Veto`
  - Event: `Meeting`, `Hearing`, `Negotiation`, `Decision`, `Reconsideration`
  - Narrative: `OfficialPosition`, `BackChannelPosition`
- `src/lib/ontology/governance/relations.ts`: `MEMBER_OF`, `BOUND_BY` (Institution → Mandate), `CHAIRS`, `REPRESENTS`, `VOTED_ON` (Actor → Decision via Vote), `VETOED`, `PROPOSED`, `OPPOSED`, `AMENDED`, `REPLACED_BY`, `CITES_PROCEDURE`.
- `src/lib/ontology/governance/validators.ts`:
  - `decisionRequiresQuorum` (reject Decision event without ≥1 Procedure edge specifying quorum, OR fewer than quorum Vote edges)
  - `vetoPlayerExists` (warn if Decision has only one VetoPlayer; voting bodies usually have more)
  - `mandateBeforeDecision` (reject Decision whose `validFrom` is before the binding Mandate's `validFrom`)
  - `voteAttribution` (reject Vote whose Actor is not `MEMBER_OF` the relevant Institution)
  - `sunsetClauseDetected` (warn if a Mandate has no `validTo`)
  - `procedureCitation` (warn if Decision is not edged to ≥1 Procedure node)
- `src/lib/ontology/governance/extraction-prompts.ts` — prompts emphasize legal/procedural language, distinguish official vs back-channel positions.
- `src/lib/ontology/governance/index.ts` — version `1.0.0`. `suggestedFor: ['institutional decision', 'multilateral negotiation', 'mandate renewal', 'policy change', 'regulatory rulemaking']`. `sampleCaseIds: ['un-cted-renewal']`.
- `backend/ontology/governance.py` — Python parity.
- `src/lib/cases/un-cted-renewal/index.ts` — sample case. Pre-loads UN CTED mandate background (publicly available facts only — UNSC resolutions 1373/1535/2395/2617, etc.), Security Council members, recent debates. All sourced; no fabricated quotes.
- `src/lib/cases/un-cted-renewal/__tests__/case.test.ts` — assert load + fixtures readable + expected primitive counts.
- `e2e/workbench/un-cted-renewal.spec.ts` — Diplomat persona, 12 min: create case → ontology auto-suggests Governance → upload 3 SC resolutions (PDF fixtures) → ingest → review proposals → see VetoPlayer set populated correctly (P5 members) → run "Veto Probability" tool → see informed answer.

### Hard rules
- All real-world UN content uses ONLY publicly available source material. No invented quotes from real officials. If you need a quote-flavored claim, attribute it to a fictional placeholder (`"Senior diplomat from a P5 delegation"`) and tag the source as `synthetic: true`.
- The `decisionRequiresQuorum` validator runs as `severity: 'reject'` only when the `procedure_known: true` flag is set on the Decision; otherwise it's `warn`. (Quorum may not be ingested yet.)

### Definition of Done
- Governance ontology compiles, audits clean, validators tested.
- UN CTED sample case loads.
- Playwright Diplomat flow green.
- Auto-suggest classifier (built in E7, so this DoD is forward-looking — verified after E7) returns `governance` for the case description "UN Security Council debating mandate renewal of subsidiary body".

### Verification commands
```bash
npm run audit:ontology-mapping
npm run test -- src/lib/ontology/governance src/lib/cases/un-cted-renewal
pytest backend/tests/test_governance_ontology.py -q
# Playwright test runs after E7 to validate auto-suggest:
# npx playwright test e2e/workbench/un-cted-renewal.spec.ts
```

---

## 9. Prompt E5 — Narrative ontology

### Persona
You are a discourse analyst who has internalized Lakoff, Entman, and Hall. You know that a Frame is not a Claim, that Narrative is composed but Frame is reusable, that Audience is a first-class entity, and that Sentiment Shift is an Event not an Edge.

### Outcome
The Narrative ontology is populated. A sample case under `src/lib/cases/disinfo-elections-2026/` (synthetic but plausible election-disinformation scenario) demonstrates it.

### Files to create
- `src/lib/ontology/narrative/subtypes.ts`:
  - Actor: `Author`, `Outlet`, `Amplifier`, `Audience`, `BotNetwork`
  - Claim: `Assertion`, `CounterAssertion`, `FactCheckVerdict`
  - Constraint: `PlatformPolicy`, `EditorialStandard`
  - Event: `Publication`, `Amplification`, `SentimentShift`, `RetractionOrCorrection`
  - Narrative: `Frame`, `MetaNarrative`, `CounterNarrative`
- `src/lib/ontology/narrative/relations.ts`: `AUTHORED`, `PUBLISHED_IN`, `AMPLIFIED_BY`, `TARGETS_AUDIENCE`, `INVOKES_FRAME`, `COUNTERS`, `CITES_SOURCE`, `WAS_FACT_CHECKED_BY`.
- `src/lib/ontology/narrative/validators.ts`:
  - `assertionNeedsSource` (reject Assertion without `CITES_SOURCE` edge OR `provenance.kind === 'document'`)
  - `factCheckVerdictAttribution` (reject FactCheckVerdict whose Author is not subtype `Outlet` with `factCheckCertified: true`)
  - `frameReusable` (warn if a Frame is used by only one Publication — Frames are by nature reusable)
  - `audienceSpecificity` (warn if Audience has no demographic descriptor)
  - `amplifierDetection` (warn if a Publication has > 50 `AMPLIFIED_BY` edges to actors with `botSignals.length > 0`)
- `src/lib/ontology/narrative/extraction-prompts.ts`.
- `src/lib/ontology/narrative/index.ts` — version `1.0.0`. `suggestedFor: ['disinformation', 'media analysis', 'frame analysis', 'discourse mapping', 'public opinion shift']`. `sampleCaseIds: ['disinfo-elections-2026']`.
- `backend/ontology/narrative.py` — Python parity.
- `src/lib/cases/disinfo-elections-2026/index.ts` — synthetic sample. The fictional country is **Nordalia** (consistent with the second example case from pack 03). Pre-loads ~12 fake article snippets, a known Frame catalog (Economic Anxiety, Cultural Threat, Anti-Elite), 3 fake Outlets, 1 fake bot network.
- `e2e/workbench/disinfo-nordalia.spec.ts` — Researcher persona, 10 min: create case → ontology auto-suggests Narrative → upload article corpus → ingest → review Frame proposals → see Frame deduplication working (the same Frame invoked by 4 articles is one node) → run "Frame Cascade" tool → see narrative spread map.

### Hard rules
- All Author/Outlet/Audience entities in `disinfo-elections-2026` MUST be fictional. Display a "synthetic data" banner on the case page. Real-world disinformation analysis is reserved for cases users create themselves.
- The Frame deduplication logic is non-trivial: extraction emits Frame proposals with a `canonicalLabel` field; the persistence layer dedupes against existing Frames in the same case via case-insensitive label match. Test this explicitly.

### Definition of Done
- Narrative ontology compiles, audits clean, validators tested.
- Sample case loads.
- Frame deduplication test passes: ingest 4 articles invoking same Frame → exactly 1 Frame node persisted, with 4 `INVOKES_FRAME` edges.
- Playwright Researcher flow green.

### Verification commands
```bash
npm run audit:ontology-mapping
npm run test -- src/lib/ontology/narrative src/lib/cases/disinfo-elections-2026
pytest backend/tests/test_narrative_ontology.py -q
# After E7 + E8:
# npx playwright test e2e/workbench/disinfo-nordalia.spec.ts
```

---

## 10. Prompt E6 — Ontology picker UI + workbench schema viewer

### Persona
You are a product designer who treats the ontology choice as the single most consequential decision a user makes when creating a case. You make it visible, reversible, and explainable. You do NOT bury it three clicks deep.

### Outcome
The case-creation flow (already at `src/app/app/situations/new/page.tsx` per pack 03) gains an Ontology step. The workbench gains a read-only `?tab=ontology` view that shows the active ontology's schema as a beautifully rendered diagram.

### Files to create
- `src/components/ontology/OntologyPickerStep.tsx` — slot into the case-creation wizard between "Frame" and "Sources". Renders 4 cards (one per ontology) with: icon, label, description, suggested-for tags, sample-case link. One card highlighted as auto-suggested (E7 wires the suggestion). User clicks to confirm or override. Selection persists to `users/{uid}/situations/{caseId}.ontologyId`.
- `src/components/ontology/OntologySchemaViewer.tsx` — the schema diagram. Props: `ontologyId`. Renders three panels:
  1. **Primitives** — 8 ACO primitives as a horizontal strip; for each, the count of subtypes the active ontology defines. Click a primitive → expands to show subtypes.
  2. **Relations** — a small adjacency matrix or list view: from-subtype × to-subtype, with relation labels.
  3. **Validators** — a list, grouped by severity (reject / warn), with the human-readable check description.
- `src/components/ontology/OntologyBadge.tsx` — small badge showing the active ontology of a case. Used in the workbench header. Click → opens the schema viewer in a side panel.
- `src/app/app/workbench/[caseId]/ontology/page.tsx` — registers `?tab=ontology` in the workbench shell (per pack 03's `WorkbenchChapterShell`).
- `src/components/ontology/__tests__/OntologyPickerStep.test.tsx`, `OntologySchemaViewer.test.tsx` — render tests, interaction tests.

### Files to edit
- `src/app/app/situations/new/page.tsx` — insert the Ontology step. Adjust step ordering and persistence.
- `src/lib/cases/case-document.ts` (or equivalent type) — add `ontologyId: OntologyId`, `ontologyVersion: SemVer`, `auxiliaryLenses?: OntologyId[]`.
- Workbench tab registry — add `ontology` as an available tab.

### Hard rules
- The ontology picker is reversible UNTIL the first ingestion run. Once ingestion has written nodes, the ontology is locked; switching requires a Giulio-approved migration script. Surface this constraint in the UI: "After your first document is ingested, changing ontology requires support."
- The schema viewer is read-only. No editing of subtypes/relations from the UI. (Editing happens by code change + version bump + migration.)
- Both components are accessible: keyboard navigation, ARIA labels, color-blind-safe palette.

### Definition of Done
- Component tests green.
- Visual: a designer eyeballs the picker and the schema viewer; both look polished.
- E2E: create a new case → pick Mediation → confirm → see Mediation badge in workbench → click badge → schema viewer shows correct subtype counts and relations.
- After-ingestion lock: integration test asserts that POST to `/api/cases/[caseId]/ontology` returns 409 Conflict if any nodes exist for the case.

### Verification commands
```bash
npm run typecheck
npm run test -- src/components/ontology
npx playwright test e2e/workbench/ontology-picker.spec.ts
```

---

## 11. Prompt E7 — Auto-suggest classifier (LangGraph)

### Persona
You are an ML engineer who knows that a 4-way classifier with high-quality prompts beats a 4-way classifier trained on 200 examples. You also know that you must monitor for drift, so you instrument from day one.

### Outcome
A LangGraph state machine `ontology_classifier` that takes `caseSummary` (string), runs a single LLM call, and returns `{ suggestion: OntologyId, confidence: number, top2: [OntologyId, OntologyId] }`. Wired to the case-creation flow per Q2.

### Files to create
- `backend/agents/langgraph/ontology_classifier.py` — LangGraph StateGraph with nodes: `embed_summary` → `score_against_ontology_descriptions` → `format_response`. Uses the model declared in `backend/ai/providers.py`. Checkpoints to Postgres.
- `backend/routers/ontology.py` — FastAPI route `POST /v1/ontology/suggest` body `{ caseSummary: string }` → `{ suggestion, confidence, top2 }`. Wraps in `withCalibration` (Python decorator).
- `src/lib/ontology/suggest.ts` — TS client for the route. Returns the suggestion; falls back to `'conflict'` on network error (with telemetry).
- `backend/agents/langgraph/__tests__/test_ontology_classifier.py` — 16-case eval set: 4 cases per ontology, with a held-out 4 cases. Assert top-1 accuracy ≥ 12/16 (75%) and top-2 accuracy ≥ 15/16 (94%). Eval set checked into repo at `backend/tests/fixtures/ontology_classifier_eval.json`.
- `scripts/eval-ontology-classifier.ts` — runs the eval set against the deployed backend, prints a confusion matrix, exits 1 on regression.

### Files to edit
- `src/components/ontology/OntologyPickerStep.tsx` — call `suggest` on mount with `caseSummary`. Highlight the suggested card. Show confidence as a small chip.
- `package.json` — add `audit:ontology-classifier-accuracy` script.
- `audit:gate` chain — append the new check (runs against a small in-memory subset to keep fast; the full eval runs in CI).

### Hard rules
- The classifier prompt is constructed deterministically from the four ontology descriptions (`ontology.description` + `ontology.suggestedFor`). No hand-written ontology bias in the classifier.
- If the classifier returns confidence < 0.5, the picker shows ALL FOUR options unhighlighted with a "We're not sure — pick one" message. No silent default.
- Telemetry: every classifier call logs `{ caseId, suggestion, confidence, userOverride: boolean, finalChoice }` to `audit/{logId}` for later analysis.

### Definition of Done
- Eval set test passes.
- Live test: create three test cases with summaries crafted for each ontology; classifier picks correctly each time.
- Telemetry: after creating 3 cases, `audit/` collection has 3 entries with the right shape.

### Verification commands
```bash
pytest backend/agents/langgraph/__tests__/test_ontology_classifier.py -q
npm run test -- src/lib/ontology/suggest
npm run audit:ontology-classifier-accuracy
```

---

## 12. Prompt E8 — LangGraph ingestion pipeline (the heart of this pack)

### Persona
You are a data-engineering lead who has built five extraction pipelines. You know that the failure modes are: lost writes (Firestore wrote, Neo4j didn't), zombie checkpoints (LangGraph thinks a run is mid-flight after a crash), prompt regressions (one model upgrade silently lowers quality 12%), and hallucinated entities (the model invented a Director General who does not exist). You design the pipeline so all four are surfaced, not silent.

### Outcome
`backend/ingestion/pipeline.py` is a LangGraph state machine that takes a document and produces persisted nodes + edges atomically across Firestore and Neo4j, validated by the active ontology, gated by the symbolic firewall, with full provenance and trust scoring.

### Files to create

```
backend/ingestion/
  __init__.py
  pipeline.py              # LangGraph StateGraph
  states.py                # IngestionState dataclass
  nodes/
    __init__.py
    parse_document.py      # PDF/DOCX/MD/TXT → {text, sections, metadata}
    extract_candidates.py  # ontology-aware LLM extraction
    validate_against_ontology.py  # run validators
    apply_symbolic_firewall.py    # delegate to backend/agents/firewall
    score_trust.py         # per-node + per-edge trust score (pack 05)
    queue_for_review.py    # push high-uncertainty proposals to user review
    persist_atomic.py      # 2-phase Firestore + Neo4j write
    update_context_health.py      # recompute Context Health Score (pack 05)
  persistence/
    firestore_writer.py
    neo4j_writer.py
    transaction.py         # 2-phase commit primitives
  fixtures/
    syria_un_briefing.pdf
    northwind_slack_export.txt
    un_cted_resolution.pdf
    nordalia_article_corpus/  # 12 .md files
backend/routers/ingestion.py  # POST /v1/cases/{case_id}/ingest, GET .../runs/{run_id}
backend/tests/test_ingestion_pipeline.py
backend/tests/test_ingestion_atomic.py  # crash-injection test
backend/tests/test_ingestion_idempotency.py
src/lib/ingestion/client.ts  # TS client to start a run + poll
src/components/ingestion/IngestionProgress.tsx  # streams run status
src/components/ingestion/ProposalReviewQueue.tsx  # accept/reject UI
e2e/workbench/ingestion-end-to-end.spec.ts
```

### IngestionState shape

```python
@dataclass
class IngestionState:
    run_id: str
    case_id: str
    owner_uid: str
    ontology_id: OntologyId
    ontology_version: SemVer
    document_ref: DocumentRef
    parsed_document: ParsedDocument | None = None
    candidates: list[NodeCandidate | EdgeCandidate] = field(default_factory=list)
    validated: list[ValidatedCandidate] = field(default_factory=list)
    firewall_passed: list[ValidatedCandidate] = field(default_factory=list)
    firewall_rejected: list[FirewallRejection] = field(default_factory=list)
    trust_scored: list[ScoredCandidate] = field(default_factory=list)
    queued_for_review: list[ScoredCandidate] = field(default_factory=list)
    auto_committed: list[ScoredCandidate] = field(default_factory=list)
    persisted_node_ids: list[str] = field(default_factory=list)
    persisted_edge_ids: list[str] = field(default_factory=list)
    context_health_before: int | None = None
    context_health_after: int | None = None
    errors: list[IngestionError] = field(default_factory=list)
    status: Literal['running', 'awaiting_review', 'committed', 'failed'] = 'running'
```

### Pipeline graph (LangGraph)

```
START
  → parse_document
  → extract_candidates
  → validate_against_ontology
  → apply_symbolic_firewall
  → score_trust
  → branch:
      if any candidate.trustScore < AUTO_COMMIT_THRESHOLD (0.7):
          → queue_for_review  → END (status: awaiting_review)
      else:
          → persist_atomic
          → update_context_health
          → END (status: committed)
```

When the user accepts proposals from the review queue (UI in `ProposalReviewQueue.tsx`), the pipeline resumes from `persist_atomic` using LangGraph's checkpoint resumption.

### Hard rules
- Atomicity: `persist_atomic` writes to Firestore with `status: 'pending'`, then to Neo4j; on Neo4j success, marks Firestore `status: 'committed'`. On any failure, the reconciler script (`scripts/verify-firestore-neo4j-sync.ts`, built in pack 05) catches and either replays Neo4j or marks Firestore `status: 'failed'`.
- Idempotency: every node candidate has a deterministic `proposalId = sha256(caseId + documentId + extractedSpan + subtype + label)`. Replaying the same document does not double-write. Test this explicitly.
- Crash injection: `test_ingestion_atomic.py` runs a fixture, crashes the process between Firestore-pending and Neo4j-write, restarts, and asserts the reconciler completes the half-finished run with no data loss.
- Symbolic firewall: every candidate passes through `backend/agents/firewall/` (created in earlier work). Rejected candidates are persisted to `audit/firewall-rejections/{runId}/{candidateId}` for analysis. Never silently dropped.
- Trust score thresholds: `AUTO_COMMIT_THRESHOLD = 0.7`, `REVIEW_FLOOR = 0.4`. Below 0.4 → discarded with audit log entry. 0.4-0.7 → review queue. ≥ 0.7 → auto-commit. Thresholds in `src/lib/constants/trust-thresholds.ts`, mirrored in `backend/ai/trust_thresholds.py`.
- Hallucinated entities: extraction prompt includes `existingActorNames` (queried from Firestore at extraction-time). If model invents an actor name not in `existingActorNames` and not grounded by a span in `parsed_document.text`, that candidate's trust score is automatically capped at 0.5, forcing review.

### Definition of Done
- All ingestion tests green: `test_ingestion_pipeline.py`, `test_ingestion_atomic.py`, `test_ingestion_idempotency.py`.
- E2E: `e2e/workbench/ingestion-end-to-end.spec.ts` runs the full Mediator-on-Northwind flow: upload → extract → review → accept → graph populated → Context Health rises.
- Crash injection passes (manual run for now; CI-flagged for follow-up).
- Drift verifier: `npx tsx scripts/verify-firestore-neo4j-sync.ts` shows zero drift after ingestion completes.
- Symbolic firewall logs visible in `audit/firewall-rejections/` after deliberate trigger (test fixture with disallowed claim).

### Verification commands
```bash
pytest backend/tests/test_ingestion_pipeline.py backend/tests/test_ingestion_atomic.py backend/tests/test_ingestion_idempotency.py -q
npm run test -- src/components/ingestion src/lib/ingestion
npx playwright test e2e/workbench/ingestion-end-to-end.spec.ts
npx tsx scripts/verify-firestore-neo4j-sync.ts
```

---

## 13. Prompt E9 — Per-ontology validators, drift tests, versioning + migration

### Persona
You are a release engineer. You know that ontologies evolve, that v1.0.0 → v1.1.0 will need data migration, and that "we'll figure it out when it happens" is how production graphs become unrecoverable. You ship the versioning + migration tooling now while the schema is small.

### Outcome
- Drift tests for all 4 ontologies fail loudly when a subtype is renamed, a primitive remapping changes, or a relation is removed without a migration.
- `scripts/migrate-ontology-version.ts` accepts `--from <id@version> --to <id@version>` and runs the corresponding migration in `src/lib/ontology/<id>/migrations/`.
- A migration template + lifecycle is documented.

### Files to create
- `src/lib/ontology/<id>/migrations/` directory for each ontology (initially empty for v1.0.0 — these are the place future migrations land).
- `src/lib/ontology/__tests__/drift.test.ts` — for each ontology:
  - Subtype IDs match the snapshot in `__snapshots__/<id>.subtypes.json`. Renaming a subtype updates the snapshot intentionally; removing one fails the test.
  - Relation IDs match snapshot.
  - Validator IDs match snapshot.
- `__snapshots__/conflict.subtypes.json`, `mediation.subtypes.json`, `governance.subtypes.json`, `narrative.subtypes.json` — committed snapshots.
- `scripts/migrate-ontology-version.ts` — CLI:
  ```
  migrate-ontology-version --case <caseId> --from conflict@1.0.0 --to conflict@1.1.0 [--dry-run]
  ```
  Looks up `src/lib/ontology/conflict/migrations/v1.0.0_to_v1.1.0.ts` and runs it.
- `docs/ontology/MIGRATION_PLAYBOOK.md` — when to bump major vs minor vs patch, how to write a migration, how to test it, how to roll back.
- `scripts/audit-ontology-versions.ts` — assert: every persisted node in every case has `ontologyVersion` matching a known version of its `ontologyId`. Print mismatch report. Exit 1 on mismatch.

### Files to edit
- `package.json` — add `audit:ontology-versions`. Append to `audit:gate`.
- `audit:gate` final chain — must include `audit:ontology-mapping`, `audit:ontology-versions`, `audit:ontology-classifier-accuracy`.

### Hard rules
- Ontology versioning is **semver**. Major bump = breaking schema change requiring migration. Minor = additive (new subtype, new relation). Patch = wording / description / prompt tweaks.
- Migrations are TS files exporting `up(case): Promise<void>` and `down(case): Promise<void>`. Both must be transactional.
- A migration cannot run without explicit `--from` and `--to` — never auto-detect.
- `audit:ontology-versions` is the canary: if it ever fails, no further ontology work merges until reconciled.

### Definition of Done
- Drift snapshots match the v1.0.0 reality of all four ontologies.
- `npm run audit:ontology-versions` exits 0 across all sample cases.
- Documentation reviewed for clarity by Giulio.
- The migration template runs end-to-end on a synthetic test ontology (`backend/tests/fixtures/test_ontology_v1.json` → `v2.json`).

### Verification commands
```bash
npm run audit:ontology-versions
npm run test -- src/lib/ontology/__tests__/drift.test.ts
npx tsx scripts/migrate-ontology-version.ts --help
npm run audit:gate
```

---

## 14. Final verification gate (run before opening PR)

```bash
# Frontend
npm run typecheck
npm run lint
npm run test
npm run audit:gate          # must include the 3 new ontology audits

# Backend
pytest backend/ -q
mypy backend/ --strict

# E2E (the four persona × ontology flows)
npx playwright test e2e/workbench/syria-case.spec.ts
npx playwright test e2e/workbench/northwind-mediation.spec.ts
npx playwright test e2e/workbench/un-cted-renewal.spec.ts
npx playwright test e2e/workbench/disinfo-nordalia.spec.ts
npx playwright test e2e/workbench/ingestion-end-to-end.spec.ts

# Drift + sync
npx tsx scripts/audit-ontology-mapping.ts
npx tsx scripts/audit-ontology-versions.ts
npx tsx scripts/verify-firestore-neo4j-sync.ts
npx tsx scripts/eval-ontology-classifier.ts

# Migration smoke
npx tsx scripts/migrate-syria-to-conflict-v1.ts --dry-run
```

All commands must exit 0. Any non-zero exit = stop, surface to Giulio, do not merge.

---

## 15. Out of scope (explicitly NOT in this pack)

- **Custom ontology authoring by end users** — the four shipped ontologies are sealed. User-authored ontologies are a future product surface, not v1.
- **Cross-ontology reasoning** — a tool that consumes a Mediation graph + a Narrative graph simultaneously is out of scope. Auxiliary lenses (Q3) load the schema but do not yet drive analysis.
- **Real-time ingestion** (streaming sources) — only batch ingestion of uploaded documents. Real-time is pack 09+.
- **Multi-language extraction** — English only. i18n is later.
- **Ontology marketplace** — no third-party ontologies, no marketplace UI.
- **Graph visualization improvements** — that is pack 07.
- **Tools curation / marketplace** — that is pack 08.

---

## 16. Closing note for the agent

This pack is the structural backbone of PRAXIS. The previous packs gave the user a workbench shell, a clean entry point, and a separation between context and tools. This pack makes that separation **mean something** — context becomes a typed, validated, versioned graph. The tools downstream (pack 08) consume that typed graph; the visualization (pack 07) renders it.

If anything in this pack feels under-specified, stop and ask. The four ontologies are not interchangeable Lego pieces — each one encodes a tradition (interest-based negotiation, institutional design, discourse analysis, conflict analysis) and the validators are where that tradition becomes machine-checkable. Get the validators wrong and the product silently degrades.

Branch: `feature/ontology-system`. Commit message template: `ontology(<id>): <prompt-id> <short-description>` (e.g., `ontology(mediation): E3 add BATNA confidentiality validator`). Open PR titled `Pack 06 — Ontology System & Knowledge Structuring` linking back to this document.

Do not merge to `main` without Giulio's sign-off.
