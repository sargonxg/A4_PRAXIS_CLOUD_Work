# PRAXIS — Codex Pack 27: Surfaces Wave 2 — Library, Research, Ontology

**File**: `PRAXIS_CODEX_27_SURFACES_LIBRARY_RESEARCH_ONTOLOGY.md`
**Branch**: `feature/surfaces-wave-2`
**Depends on**: Pack 26 merged. v1.4.0 tagged. Chapters / Desk / Context tabs populated. The chapter_suggester and desk_advisor subagents live.
**Estimated effort**: ~9 days (~70 engineering hours).
**Target release**: v1.4.1
**Voice**: Senior product engineer who knows that an analyst's workflow lives in the Library (their accumulated sources), in Research (where they hunt for new sources), and in Ontology (where they understand what the structured graph means). Three surfaces, three core analyst workflows, all currently placeholders.

---

## 0. Why this pack exists

After Pack 26 closes Chapters / Desk / Context, three more workbench tabs remain placeholder-rendered: **Library** (lists sources, documents, saved claims, work products tied to the active case), **Research** (Source Scout, deep research, staged collection plans), and **Ontology** (case ontology, primitives, validators, recommended-tool mappings). Of the three, only Ontology has a partially-implemented viewer (`src/components/ontology/OntologySchemaViewer.tsx` is wired in `WorkbenchTabContent`); Library and Research render through the placeholder `WorkbenchTabPanel` showing only a title + body + 4 metrics.

This is the second wave of surface-closure. After this pack:

**(1) Library becomes the canonical browser** for everything the case knows: documents (per Pack 24's schema discipline + Pack 23's canonical-source provenance), source receipts, saved claims, completed memo versions, exported work products. It uses the Context Library tab pattern from Pack 24 X4 — composed of `Card` + `Badge` + list-row primitives — and extends it with the three additional artifact types (saved claims, memo versions, exports) that pack 24 didn't cover. The user finds anything in three clicks: filter by type, search by content, drill into the artifact.

**(2) Research becomes a real Source Scout workspace.** Today PRAXIS has substantial research infrastructure (`src/lib/ai/web-research.ts` with Google Search grounding via `getGroundedModel()`, `discover-sources` API at `src/app/api/ai/discover-sources/route.ts`, query-intelligence module, the Wikipedia + UCDP + ICG + ReliefWeb adapters from Pack 23) — but no consolidated UI surface where the user can run targeted research and see results. The Research tab becomes that surface: structured query builder, source-set picker, result browser with relevance ranking, "ingest into case" button per result that routes through Context Genesis non-destructively (Pack 26 Z8). The user can hunt for sources without leaving the workbench.

**(3) Ontology becomes interactive, not just a viewer.** The existing `OntologySchemaViewer.tsx` shows the case's primary ontology as a static schema. This pack extends it to: show all active ontologies (multi-ontology cases per Pack 20); show validator-pass-rate per active ontology computed against the case graph; show coverage-by-primitive (which of the 8 ACO primitives have nodes vs which are empty); show recommended tools that haven't been run yet; allow the user to add/remove an active ontology from the case (one primary + 0-2 secondary, per Pack 20 multi-ontology rules); show the source-affinity table for each active ontology so the user understands which sources Context Genesis will pull from on re-genesis.

Three structural decisions:

**(A) No new graphical primitives.** Library composes existing list-row + filter-bar patterns from Pack 24. Research composes existing Card + Badge + Loader2 patterns. Ontology extends the existing `OntologySchemaViewer` component with new sections, not new components.

**(B) Library and Context Library are the same data, different views.** Pack 24 X4 introduced the Context Library tab inside the Context tab's scope panel — that view is collection-centric (document-by-collection). The Library tab is artifact-centric (document/source/claim/memo/export, faceted by type). They share the same Firestore reads. The Library tab is the comprehensive view; the Context Library is the scope-panel-embedded view. Both keep their place in the navigation.

**(C) Research never silently writes to the case graph.** Research results land in a "candidate sources" panel; the user explicitly chooses which to ingest via Context Genesis (re-genesis mode per Pack 26 Z8). This preserves the firewall + review queue invariants without adding new mutation paths.

After this pack: a user opens Library, sees every artifact in their case organized by type with full faceted filtering. Opens Research, types "recent ICG analysis on West Darfur RSF operations", picks `crisisgroup + un + reuters` source set, gets 10 ranked candidate sources, ingests the 3 most relevant through one-click re-genesis. Opens Ontology, sees their case is Conflict (primary) + Humanitarian (secondary) with 73% validator pass rate on Conflict and 41% on Humanitarian, sees that 4 of the 8 ACO primitives have no nodes for the Humanitarian lens yet, sees 3 recommended tools they haven't run.

---

## 1. Outcomes

| # | Outcome | Verification |
|---|---|---|
| 1 | Library tab renders all 5 artifact types (sources, documents, saved claims, memo versions, exports) with faceted filtering and search | E2E `tests/e2e/workbench/library-faceted-browse.spec.ts` |
| 2 | Library shares Firestore reads with Pack 24 Context Library; both views stay consistent | Cross-view consistency test: action in one reflects in the other within 1s |
| 3 | Research tab provides structured query + source-set picker + result browser using existing `web-research.ts` and `discover-sources` API | E2E `tests/e2e/workbench/research-source-scout.spec.ts` |
| 4 | Research results show relevance ranking, one-click "ingest into case" routes through Pack 26 Z8 re-genesis | E2E test verifies result → ingest → new Source-layer node in graph |
| 5 | New `research_planner` subagent (11th on Vertex Agent Engine, `balanced` task kind) suggests staged collection plans for complex research questions | Subagent deployed; eval ≥80% on 25 cases |
| 6 | Ontology tab shows all active ontologies with: validator-pass-rate, primitive-coverage breakdown, recommended-but-not-run tools, source-affinity per ontology | E2E `tests/e2e/workbench/ontology-interactive.spec.ts` |
| 7 | Ontology tab supports add/remove of secondary ontology (multi-ontology case management per Pack 20) with firewall enforcement | E2E test: add Humanitarian to a Conflict case → graph viewer reflects, source affinity updates |
| 8 | Performance: each tab TTI ≤800ms; Research result fetch P95 ≤6s | Lighthouse + custom timing test |
| 9 | Cost: Research run P95 ≤$0.30; research_planner P95 ≤$0.05; both within existing budget envelope | Cost telemetry per-tab |
| 10 | Two new ADRs: 0042 (Library tab as artifact-faceted view of same data as Context Library), 0043 (Research as ingestion-front-door for re-genesis) | ADRs reviewed and merged |

---

## 2. Pre-work confirmation note

> I am Codex. I have read pack 27. I understand:
> 1. **Three placeholder tabs become real**, all rendered through the existing `WorkbenchTabContent` dispatch with replacement components.
> 2. **No new graphical primitives.** Library composes the Pack 24 X4 list-row + filter-bar pattern. Research composes existing Card + Badge + Loader2 + dropdown primitives. Ontology extends the existing `OntologySchemaViewer` with new sections.
> 3. **Library and Context Library share the same Firestore reads.** Both surface the same documents/sources data, faceted differently. Cross-view writes propagate within 1s (existing real-time Firestore listeners).
> 4. **Research never silently writes to the case graph.** Research results land in a "candidate sources" panel; user explicitly ingests via re-genesis (Pack 26 Z8 non-destructive mode). The firewall + review queue invariants are preserved.
> 5. **New 11th subagent** `research_planner` deploys to Vertex AI Agent Engine following the established pattern (Pack 18 R4 + Pack 26 Z3 + Z5).
> 6. **Multi-ontology management is owner-scoped.** A user can add/remove a secondary ontology on their own case via the Ontology tab; cross-tenant ontology mutations are 403.
> 7. **Architecture invariants from the bible (§3) hold.** ContextProvider-only access. Symbolic firewall enforced. Owner scoping absolute. Model strings only in `MODEL_MATRIX.json`.
>
> Open questions for Giulio:
> - **Q1**: Library faceting — propose: 5 facets (type, category for documents, collection, tag, date range). Acceptable, or different facet set?
> - **Q2**: Research source set — propose: user picks from the same 10 sources as onboarding (existing `situation-onboarding.tsx` source list); plus the user's existing case-attached uploaded-document set as a "search my docs" option. Acceptable?
> - **Q3**: Research result ingestion — propose: per-result "ingest" CTA invokes re-genesis with the single source URL added; the user can also batch-ingest selected results. Acceptable?
> - **Q4**: Ontology multi-ontology limit — Pack 20 specifies 1-3 active ontologies. Propose: Ontology tab enforces this, with a clear UI affordance ("you have 3 active; remove one to add another"). Acceptable?
> - **Q5**: research_planner subagent — propose: invoked when user types a complex multi-faceted question; produces a staged plan ("Step 1: Wikipedia background → Step 2: ICG recent analysis → Step 3: UN documents → Step 4: cross-reference"); each step one-click executable. Acceptable, or simpler model?

Wait for answers before proceeding.

---

## 3. Pack overview

| Prompt | Outcome | Est. hrs |
|---|---|---:|
| AA1 | Library tab: artifact-faceted browser composing Pack 24 patterns | 12 |
| AA2 | Library: saved claims + memo versions + exports rendering | 6 |
| AA3 | Research tab: query builder + source-set picker + result browser | 12 |
| AA4 | Research: one-click ingest via re-genesis; batch ingest | 6 |
| AA5 | `research_planner` subagent: deployment + eval + integration | 8 |
| AA6 | Ontology tab: validator-pass-rate + primitive-coverage + recommended-not-run | 8 |
| AA7 | Ontology tab: add/remove secondary ontology (multi-ontology case management) | 6 |
| AA8 | ADRs + integration + perf budgets + verification | 4 |
| Total | | **~70** |

---

## 4. Hard rules

- **No new graphical primitives.** Reuse `Card`, `Badge`, `Button`, `Loader2`, dropdown/select, list-row, filter-bar from Pack 24 X4.
- **No new top-level tabs.** Library, Research, Ontology already exist; this pack populates them.
- **Library + Context Library consistency.** Both views read the same Firestore data; mutations in one reflect in the other within 1s.
- **Research is read-only against external sources.** No external API gets a write; all writes are to the user's own case via re-genesis.
- **Re-genesis from Research is rate-limited per Pack 26 Z8** (3 per case per day).
- **Ontology mutations route through firewall + two-phase commit.** Adding a secondary ontology to a case is a structural change; subject to all the same write-path discipline.
- **Performance budgets enforced.** Tab TTI ≤800ms. Research result fetch P95 ≤6s (mostly upstream API latency).
- **All prior invariants from packs 03-26 hold.**

---

## 5. Prompt AA1 — Library tab: artifact-faceted browser

### Persona
Frontend engineer. Composes existing primitives.

### Phase 1 — Read & report

- Inspect Pack 24 X4's `ContextLibraryTab.tsx` and `DocumentListRow.tsx`.
- Inspect existing services: `documents-service.ts`, `sources-service.ts`, `claims-service.ts`, `memo-versions` collection.
- Inspect existing review queue Pack 18 R1 list pattern.
- Output `docs/audits/2026-NN-NN-LIBRARY_BASELINE.md`.

### Phase 2 — Propose & confirm

```ts
// src/components/workbench/library/LibraryTab.tsx (composition; no new primitives)

type ArtifactType = 'document' | 'source' | 'claim' | 'memo' | 'export';

interface LibraryFilter {
  types: ArtifactType[];                    // multi-select
  category?: UserDocumentCategory;          // for documents
  collectionId?: string;
  tags?: string[];
  dateRange?: { from: string; to: string };
  search?: string;                           // free-text
}

// LibraryTab composes:
//   FilterBar (existing patterns)
//   ArtifactList (extends Pack 24 X4's list-row pattern)
//   detail panel slides in from right edge (existing entity-panel pattern)
```

The list-row shows: artifact-type badge, title, summary line, date, action-affordance. Different artifact types show different secondary fields (e.g., document shows category + collection; memo shows template + version count).

Wait for sign-off on the facet ordering and the row composition.

### Phase 3 — Execute

- Author `LibraryTab.tsx`, `FilterBar.tsx`, `ArtifactList.tsx`, type-specific row components for the 5 types.
- Wire the existing services for each artifact type.
- Edit `workbench-tab-content.tsx` to dispatch Library tab to the new component.

### Phase 4 — Verify

- E2E `tests/e2e/workbench/library-faceted-browse.spec.ts`: open Library on populated case → all 5 artifact types appear → filter by type works → search works → click row opens detail.
- Cross-view consistency: action in Context Library reflects in Library within 1s.

### Files

- `src/components/workbench/library/LibraryTab.tsx`.
- `src/components/workbench/library/FilterBar.tsx`.
- `src/components/workbench/library/ArtifactList.tsx`.
- `src/components/workbench/library/rows/{DocumentRow|SourceRow|ClaimRow|MemoRow|ExportRow}.tsx`.
- Edits to `workbench-tab-content.tsx`.

---

## 6. Prompt AA2 — Library: saved claims + memo versions + exports

### Outcome

Wire the three artifact types Pack 24 didn't cover:

**Saved claims** — claims the user has explicitly saved (e.g., from a tool output) that aren't in the graph yet. New Firestore subcollection `users/{uid}/situations/{sitId}/saved-claims/{cid}` if not present. Owner-scoped.

**Memo versions** — already exist via Pack 11/19 memo studio. Library lists them with title, template, version, last-updated.

**Exports** — work products the user has exported (DOCX, PDF, JSON audit-trail). Already persisted via Pack 19 S8. Library lists them with format, exported-at, "re-download" CTA.

### Files

- Service for saved-claims (if missing): `src/lib/firebase/saved-claims-service.ts`.
- Type-specific row renderers from AA1 wired to the actual data.
- Tests.

---

## 7. Prompt AA3 — Research tab: query builder + source-set picker + result browser

### Persona
Frontend + backend integration engineer. Surfaces the existing research infrastructure.

### Outcome

The Research tab as a Source Scout workspace:

```ts
// src/components/workbench/research/ResearchTab.tsx

// Layout: 3 sections vertically
//   1. Query Builder (top): question text input, source-set checkboxes (10 onboarding sources + "search my docs"), depth selector (light|standard|deep)
//   2. Optional: research_planner advice panel (renders a staged plan if user types a complex question)
//   3. Result Browser (bottom): ranked list of results with relevance score, source provider badge, "Open" + "Ingest" CTAs
```

Backend integration:

```ts
// New API route POST /v1/cases/{caseId}/research
// Wraps existing `web-research.ts.searchWeb()` with case-context augmentation.

// New API route POST /v1/cases/{caseId}/research/plan
// Invokes research_planner subagent (AA5).
```

### Files

- `src/components/workbench/research/ResearchTab.tsx`.
- `src/components/workbench/research/QueryBuilder.tsx`.
- `src/components/workbench/research/ResultBrowser.tsx`.
- `src/app/api/cases/[caseId]/research/route.ts`.
- `src/app/api/cases/[caseId]/research/plan/route.ts`.
- Edits to `workbench-tab-content.tsx`.

### Phase 4 — Verify

- E2E `tests/e2e/workbench/research-source-scout.spec.ts`: type query → pick sources → submit → results appear within 6s P95 → click "Ingest" → re-genesis runs → new Source-layer node in graph.

---

## 8. Prompt AA4 — Research: one-click ingest + batch ingest

### Outcome

Per-result and batch ingest flows that wrap Pack 26 Z8's re-genesis:

```ts
// One-click: clicking "Ingest" on a single result
//   → POST /v1/cases/{caseId}/genesis with mode='re_genesis', selected_sources=[<source-kind>], user_uploads=[],
//     and an optional explicit URL via a new param `additional_urls` accepted by the orchestrator.

// Batch: user checkboxes multiple results, clicks "Ingest selected"
//   → same, but additional_urls list contains all selected.
```

Re-genesis rate limit (3/day from Z8) applies. UI shows remaining count and disables ingest when exhausted.

### Files

- `src/components/workbench/research/IngestActions.tsx`.
- Edit `backend/services/context_genesis/orchestrator.py` to accept `additional_urls`.
- Tests.

---

## 9. Prompt AA5 — `research_planner` subagent

### Persona
Agent engineer.

### Outcome

A new subagent `backend/agents/research_planner/` deployed to Vertex AI Agent Engine. Uses `balanced` task kind (gemini-2.5-flash).

### Subagent design

Three-node LangGraph: parse_question → decompose_into_steps → structure_plan.

Output:

```ts
// backend/agents/research_planner/output_schema.py
class ResearchPlanStep(BaseModel):
    step_number: int
    description: str           # "Wikipedia background on Sudanese Armed Forces"
    suggested_sources: list[CanonicalSourceKind]
    suggested_queries: list[str]
    expected_output: str       # what we'll know after this step
    rationale: str

class ResearchPlan(BaseModel):
    question: str
    steps: list[ResearchPlanStep]   # 3-5 steps
    total_estimated_runtime_minutes: int
```

Eval set: 25 cases at `backend/agents/research_planner/eval/cases.json`. Pass rate ≥80%.

### Integration

- API route invokes the subagent.
- Research tab renders the plan in the advice panel (AA3); each step has a "Run this step" CTA that pre-fills the query builder.

### Files

- `backend/agents/research_planner/` (full structure).
- `infrastructure/agent-engine-deployments.json` — 11th subagent.
- `skills/subagents/research_planner/SKILL.md`.

---

## 10. Prompt AA6 — Ontology tab: validator-pass-rate + primitive-coverage + recommended-not-run

### Persona
Frontend engineer. Extends the existing `OntologySchemaViewer`.

### Outcome

Existing `src/components/ontology/OntologySchemaViewer.tsx` is extended with three new sections rendered after the existing schema view:

**Section 1 — Active Ontologies**:
- Lists each active ontology (1-3 per Pack 20).
- For each: name, version, badge "primary" / "secondary", validator-pass-rate (computed per AA7), primitive-coverage badge.
- "Add secondary ontology" button (gated on count <3).
- "Remove" button on secondary entries.

**Section 2 — Validator Pass-Rate Detail**:
- Per ontology, a list of validators with per-validator pass status.
- Failed validators have remediation hints (e.g., "human-rights.has-rights-holder failed: no Actor of subtype rights_holder in graph; add one via [Context tab]").

**Section 3 — Primitive Coverage**:
- For each of the 8 ACO primitives, count of nodes per ontology.
- Empty primitives highlighted with hints (e.g., "Conflict.armed_actor: 0 nodes; consider running cross.contradiction-finder against your sources to surface actor candidates").

**Section 4 — Recommended Tools (Not Yet Run)**:
- For each active ontology, recommended tools that haven't been invoked on this case.
- One-click "Run" CTA per tool.

### Files

- Edits to `src/components/ontology/OntologySchemaViewer.tsx`.
- New helper `src/lib/ontology/validator-pass-rate.ts` (computes deterministically against case graph).
- Tests.

### Phase 4 — Verify

- E2E `tests/e2e/workbench/ontology-interactive.spec.ts`: open Ontology tab on a case → all 4 sections render → click "Run" on a recommended tool → tool runs → coverage updates.

---

## 11. Prompt AA7 — Multi-ontology case management

### Persona
Backend + frontend engineer.

### Outcome

Add/remove secondary ontology flows:

**Add secondary**: opens dropdown of available ontologies (excluding already-active). User picks one. Backend writes through firewall + two-phase commit. New ontology becomes active; its validators run against existing graph; its source-affinity becomes available for next re-genesis.

**Remove secondary**: confirmation modal ("nodes typed against this ontology will become orphaned subtypes; do you want to migrate them to the primary ontology, or keep them?"). User chooses. Backend writes through firewall.

Constraints:
- Cannot remove primary ontology.
- Cannot exceed 3 active ontologies (Pack 20 contract).
- Cannot add an ontology whose primary primitives already conflict (firewall rejection).

### Files

- `src/components/ontology/AddOntologyAction.tsx`.
- `src/components/ontology/RemoveOntologyAction.tsx`.
- Backend route `PATCH /v1/cases/{caseId}/ontologies` accepting add/remove operations.
- `backend/services/case_ontologies/manager.py`.
- Tests including cross-tenant 403 and primary-removal-blocked.

---

## 12. Prompt AA8 — ADRs + integration + verification

### ADRs

- `0042-library-tab-as-artifact-faceted-view.md`.
- `0043-research-as-ingestion-front-door.md`.

### Final verification

```bash
npm run typecheck && npm run lint && npm run test
pytest backend/ -q

npm run audit:subagent-deployment-fresh   # 11/11
npm run audit:subagent-eval-fresh          # 11/11 ≥ 80%
npm run audit:firewall-coverage             # unchanged
npm run audit:gate

npm run test:e2e:personas                  # 10 consecutive green
npx playwright test tests/e2e/workbench/library-faceted-browse.spec.ts
npx playwright test tests/e2e/workbench/research-source-scout.spec.ts
npx playwright test tests/e2e/workbench/ontology-interactive.spec.ts

npm run lh:ci

git tag v1.4.1
```

---

## 13. Closing note

After this pack, six of the twelve workbench surfaces are real (Chapters / Desk / Context from Pack 26 + Library / Research / Ontology from this pack), plus Graph / ACH / Tools / Memos / Boardroom which were already real. Only Draft remains as a placeholder, addressed in Pack 28.

The user's daily workflow now flows: open Desk to see what's changed; open Chapters to walk the case; refine Context if scope shifted; browse Library to find an artifact; run Research to gather more sources; check Ontology to see coverage; run Tools or Boardroom for analysis; draft Memos for output; the Draft tab (Pack 28) for export-ready briefing assembly.

Branch: `feature/surfaces-wave-2`. Commit prefix `surface(<name>): AA<N> <description>`. PR titled `Pack 27 — Surfaces Wave 2: Library, Research, Ontology`.

---

**File path**: `C:\Users\giuli\Downloads\PRAXIS_CODEX_27_SURFACES_LIBRARY_RESEARCH_ONTOLOGY.md`
