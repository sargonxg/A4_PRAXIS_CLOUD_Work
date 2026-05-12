# PRAXIS — Codex Pack 28: Surfaces Wave 3 — Draft, New-User Case Creation & Surface Hardening

**File**: `PRAXIS_CODEX_28_SURFACES_DRAFT_NEW_USER_AND_HARDENING.md`
**Branch**: `feature/surfaces-wave-3`
**Depends on**: Packs 26 + 27 merged. v1.4.1 tagged. 11 of 12 workbench tabs real. New-user onboarding ships Context Genesis. Eleven subagents on Vertex Agent Engine.
**Estimated effort**: ~10 days (~80 engineering hours).
**Target release**: v1.5
**Voice**: Senior product engineer who knows that the difference between "the architecture is complete" and "real users use the product successfully" is whether a brand-new user, not a power user with a populated case, has a clear path through every surface they hit. Closes the loop.

---

## 0. Why this pack exists

After Packs 26 and 27, eleven of twelve workbench surfaces are real and rendering content for any case. The remaining gap is **Draft**, which still renders through the placeholder `WorkbenchTabPanel`. But this pack does more than close the last surface — it closes the new-user gap end-to-end.

Three concerns drive this pack:

**(1) The Draft tab needs to be the export-ready briefing-assembly surface.** Memos (existing tab) is template-driven memo composition; Draft is the final-stage assembly where the user takes one or more memos, adds executive summary + cover page + appendix selections + redaction layers (per Pack 19 S4) + C2PA content credentials (per Pack 19 S8), and exports as a packaged briefing. Today this is conceptual; this pack makes it real.

**(2) New-user case creation needs full AI assistance, not just demo-case browsing.** Today, when a new user clicks "New case", they get the existing 5-step `case-creation-wizard.tsx` which walks them through name → description → type → conflict-classification → done. But the wizard doesn't suggest content. It expects the user to type their actors, claims, interests manually. Combined with Pack 23 Context Genesis (which runs *after* case creation) and Pack 26 chapter-suggester (which suggests content for chapters), the user has assistance at the periphery but not at the core case-creation moment. This pack adds an AI-first creation mode where the user types one sentence, and the system proposes the entire case scaffold (frame + initial actors + initial claims + ontology recommendation + source set) which the user accepts/edits/rejects through the existing review-queue pattern. The existing manual wizard remains for users who want fine control.

**(3) The six already-implemented tabs (Graph, ACH, Tools, Memos, Boardroom, plus Ontology from Pack 27) need to gracefully handle new-user empty-case states.** A user who completes Context Genesis but hasn't yet run any tools opens the Tools tab — does it surface the right starter recommendations for their role + ontology? They open Boardroom — does it suggest a starter deliberation? They open Memos — does it propose the right starter template? They open Graph — does it show meaningful guidance when the graph has 5 nodes vs 50? Empty-state polish is what separates "technically working" from "a user can complete their first session successfully."

Three structural decisions:

**(A) No new top-level tabs.** Draft already exists in the descriptor; this pack populates it. The AI-first case-creation mode is a button in the existing case-creation flow, not a new flow.

**(B) AI-first case creation routes through the existing review queue.** When the new mode runs, the system produces a `CaseScaffoldProposal` with frame fields + actor candidates + claim candidates + ontology recommendation + source-set recommendation. The user reviews each proposed item with Accept/Edit/Reject controls. Accepted items route through the firewall as user-asserted (not synthesized) content, because the user has explicitly accepted them.

**(C) Empty-state hardening is per-tab and contract-driven.** Each of the six already-real tabs gets a contract for what to render at three case-density levels: empty (0-5 nodes), thin (6-20 nodes), populated (21+ nodes). The contract is implemented as an additional `<EmptyStateGuidance>` component per tab, surfaced when density is empty or thin. Existing rendering is unchanged at populated density.

After this pack ships, a brand-new user who has never used PRAXIS:
1. Signs up via magic link (existing Pack 18 R7 flow).
2. Completes onboarding (role + objective + sources, existing flow extended with Pack 23 Context Genesis trigger).
3. Sees a "Create case with AI assistance" CTA on first-case landing.
4. Types "I want to track ceasefire compliance in Sudan over Q3 2026, with focus on Khartoum and West Darfur".
5. Within 90s, sees a Case Scaffold Proposal card: "Suggested case name: Sudan Ceasefire Compliance Q3 2026 / Suggested ontology: Conflict (primary) + Humanitarian (secondary) / Suggested initial sources: UCDP, ICG, UN, ReliefWeb / Suggested initial actors: Government of Sudan, RSF, SAF, UNITAMS / Accept All / Edit / Reject"
6. Accepts (or edits/rejects per item).
7. Context Genesis runs (Pack 23) using the accepted source set.
8. Lands on workbench. Chapters tab populated (Pack 26). Desk tab shows next-best-actions. Tools tab shows starter tool recommendations. Boardroom suggests starter deliberation. Memos suggests Country Brief template.
9. Opens Tools, runs first tool. Output appears.
10. Opens Memos, populates Country Brief from accepted graph state.
11. Opens Draft, assembles the memo into an export-ready briefing with cover page + redaction levels.
12. Exports DOCX with C2PA content credentials.

End-to-end: empty state to first export-ready briefing. The architecture promised this; this pack delivers it.

---

## 1. Outcomes

| # | Outcome | Verification |
|---|---|---|
| 1 | Draft tab renders as briefing-assembly surface: select-memos + cover page editor + appendix picker + redaction layer selector + export controls | E2E `tests/e2e/workbench/draft-briefing-assembly.spec.ts` |
| 2 | New AI-first case-creation mode: user types one sentence → `CaseScaffoldProposal` rendered with frame/actors/claims/ontology/sources for review | E2E `tests/e2e/onboarding/ai-first-case-creation.spec.ts` |
| 3 | New `case_scaffolder` subagent (12th on Vertex Agent Engine, `balanced` task kind) produces structured CaseScaffoldProposal from objective text | Subagent deployed; eval ≥80% on 30 hand-labeled objectives |
| 4 | Accepted scaffold proposals route through firewall + two-phase commit; rejected proposals discarded with audit log | Firewall coverage unchanged; audit log includes scaffolder events |
| 5 | Six already-implemented tabs (Graph, ACH, Tools, Memos, Boardroom, Ontology) get empty-state guidance components surfaced at empty/thin density | Per-tab snapshot tests at the three density levels |
| 6 | Empty-state guidance gives concrete starter actions per role + ontology (e.g., diplomat-Conflict gets "Run cross.contradiction-finder", mediator-Mediation gets "Run mediation.zopa-finder") | Manual review of 4 role × 5 ontology = 20 starter guidance combinations |
| 7 | Performance: Draft tab TTI ≤900ms (slightly higher due to potential complex assembly); AI-first creation P95 ≤90s | Lighthouse + custom timing |
| 8 | Cost: case_scaffolder P95 ≤$0.20 per invocation; full new-user end-to-end flow (onboarding → AI-first creation → Genesis → first export) ≤$1.20 P95 | Cost telemetry |
| 9 | New-user end-to-end flow green for 10 consecutive runs in CI | `tests/e2e/onboarding/new-user-end-to-end.spec.ts` runs 10x |
| 10 | Two new ADRs: 0044 (Draft as briefing-assembly contract), 0045 (AI-first case creation pattern) | ADRs reviewed and merged |

---

## 2. Pre-work confirmation note

> I am Codex. I have read pack 28. I understand:
> 1. **Draft is the last placeholder tab.** This pack makes it real.
> 2. **AI-first case creation is an additional mode**, not a replacement for the existing `case-creation-wizard.tsx`. Users who want fine manual control retain that path.
> 3. **CaseScaffoldProposal items route through the existing review queue or directly through the firewall as user-asserted** — the user's explicit Accept makes them user-asserted, not synthesized. This is consistent with how Pack 26 Z2 chapter-suggester accepted items are handled.
> 4. **Empty-state guidance is per-tab additive**, not a refactor. Each tab's existing rendering is unchanged at populated density; only at empty/thin density does the additional `<EmptyStateGuidance>` component surface.
> 5. **The 12th subagent** `case_scaffolder` deploys to Vertex AI Agent Engine following the established pattern.
> 6. **Architecture invariants from the bible (§3) hold.** ContextProvider-only access. Symbolic firewall enforced. Owner scoping absolute. Model strings only in `MODEL_MATRIX.json`.
> 7. **The 60-second wow flow (Pack 19 S7) extends to a 90s "create case with AI" flow** as the new headline activation metric.
>
> Open questions for Giulio:
> - **Q1**: Draft tab structure — propose: 5 sections (Memos selection, Cover Page editor, Appendix picker, Redaction settings, Export controls). Acceptable, or different decomposition?
> - **Q2**: AI-first creation — propose: a button "Create with AI assistance" alongside the existing "Create manually" CTA on the case-creation entry point; AI-first flow is fully optional. Acceptable?
> - **Q3**: case_scaffolder eval — propose: 30 hand-labeled objectives (3 per the 10 user roles or close approximation); pass criteria: ≥80% of fields in the proposal are correct or near-correct on human review. Acceptable?
> - **Q4**: Empty-state contract — propose: empty (0-5 nodes), thin (6-20), populated (21+); each tab's empty-state guidance is hand-crafted per (role × ontology) pair, with role-and-ontology-aware starter actions. Acceptable, or smaller matrix (e.g., per role only)?
> - **Q5**: New-user end-to-end test — propose: a single Playwright spec that covers onboarding → AI-first creation → Context Genesis → open Tools and run first tool → open Memos and create first memo → open Draft and assemble first briefing → export. Acceptable as the headline integration test, or split across multiple specs?

Wait for answers before proceeding.

---

## 3. Pack overview

| Prompt | Outcome | Est. hrs |
|---|---|---:|
| BB1 | Draft tab: 5-section briefing-assembly surface | 14 |
| BB2 | Draft: export pipeline with C2PA + redaction layer filtering | 8 |
| BB3 | AI-first case-creation mode: UI + flow | 8 |
| BB4 | `case_scaffolder` subagent: deployment + eval | 10 |
| BB5 | Empty-state guidance: per-tab contract + components | 12 |
| BB6 | Empty-state guidance content: role × ontology starter actions matrix | 10 |
| BB7 | New-user end-to-end test | 6 |
| BB8 | ADRs + integration + perf budgets + verification + tag | 6 |
| BB9 | Final hardening sweep + persona suite expansion + documentation | 6 |
| **Total** | | **~80** |

---

## 4. Hard rules

- **No new graphical primitives.** Reuse `Card`, `Badge`, `Button`, `Loader2`, dropdown/select, list-row, modal, the existing memo-block patterns from MemoStudio.
- **No new top-level tabs.** Draft already exists; this pack populates it.
- **AI-first case creation does not bypass the firewall.** Accepted scaffold items route through firewall + two-phase commit. Rejected items discarded with audit log.
- **Empty-state guidance is additive.** Existing tab rendering unchanged at populated density. Only the new `<EmptyStateGuidance>` component is conditionally surfaced.
- **Performance budgets enforced.** Draft tab TTI ≤900ms. AI-first creation P95 ≤90s. New-user end-to-end ≤180s P95.
- **All architecture invariants from packs 03-27 hold.**

---

## 5. Prompt BB1 — Draft tab: 5-section briefing-assembly surface

### Persona
Frontend engineer + product designer. Knows that the Draft tab is where the user takes their accumulated work and packages it for an audience.

### Phase 1 — Read & report

- Inspect existing MemoStudio (`src/components/memo/MemoStudio.tsx`) — Draft consumes its output.
- Inspect existing memo export utilities (`src/lib/memo/export.ts`).
- Inspect existing Pack 19 S4 redaction layer infrastructure (if shipped).
- Inspect existing Pack 19 S8 C2PA content credentials infrastructure.
- Output `docs/audits/2026-NN-NN-DRAFT_TAB_BASELINE.md`.

### Phase 2 — Propose & confirm

Five sections, all composed of existing primitives:

**Section 1 — Memos Selection**:
- Lists all memo versions in the case (existing memo data).
- User picks one or more for inclusion.
- "Set as primary memo" assigns top-of-document position.
- "Append as section" assigns to a section in the briefing.

**Section 2 — Cover Page Editor**:
- Workspace branding from existing settings (Pack 19 S4 if shipped).
- Title, author, date, classification, distribution list, version inputs.
- Live preview using existing memo export rendering.

**Section 3 — Appendix Picker**:
- Lists tool runs, source receipts, graph snapshots eligible as appendices.
- User checks the ones to include.

**Section 4 — Redaction Settings**:
- Per-block redaction level (public / internal / restricted) — Pack 19 S4 schema.
- "Export as" picker: which audience the export targets.
- Redacted blocks render as "[REDACTED]" with reason in the export.

**Section 5 — Export Controls**:
- Format: DOCX | PDF | Markdown.
- "Embed C2PA content credentials" checkbox (default on).
- "Embed audit-trail manifest" checkbox.
- Export button.

Wait for sign-off.

### Phase 3 — Execute

- Author 5 section components in `src/components/workbench/draft/`.
- Author `DraftTab.tsx` composing the sections.
- Edit `workbench-tab-content.tsx` to dispatch Draft tab.
- Author `tests/e2e/workbench/draft-briefing-assembly.spec.ts`.

### Phase 4 — Verify

- E2E: open Draft on populated case → 5 sections render → select memo → edit cover page → pick appendices → set redaction → export → DOCX downloads with correct content.

### Files

- `src/components/workbench/draft/DraftTab.tsx`.
- `src/components/workbench/draft/MemosSelection.tsx`.
- `src/components/workbench/draft/CoverPageEditor.tsx`.
- `src/components/workbench/draft/AppendixPicker.tsx`.
- `src/components/workbench/draft/RedactionSettings.tsx`.
- `src/components/workbench/draft/ExportControls.tsx`.
- Edits to `workbench-tab-content.tsx`.

---

## 6. Prompt BB2 — Draft export pipeline with C2PA + redaction

### Persona
Backend engineer.

### Outcome

Backend export pipeline at `backend/services/draft_export/`:

```python
async def export_briefing(
    *,
    case_id: str,
    owner_uid: str,
    primary_memo_id: str,
    section_memo_ids: list[str],
    cover_page: CoverPageInput,
    appendix_refs: list[AppendixRef],
    audience_redaction_level: Literal['public', 'internal', 'restricted'],
    format: Literal['docx', 'pdf', 'markdown'],
    embed_c2pa: bool,
    embed_audit_manifest: bool,
) -> ExportedBriefing:
    """
    1. Load all memos + filter blocks by audience_redaction_level.
    2. Apply cover page template (workspace branding).
    3. Append memo sections in order (primary first).
    4. Append appendix items.
    5. If embed_c2pa: generate C2PA chain via Pack 19 S8.
    6. If embed_audit_manifest: append signed audit JSON.
    7. Render in chosen format using existing memo export utilities.
    8. Persist exported artifact in `users/{uid}/situations/{sitId}/exports/`.
    """
```

### Files

- `backend/services/draft_export/exporter.py`.
- `backend/services/draft_export/templates/` (cover page templates per workspace branding).
- API route `POST /v1/cases/{caseId}/draft/export`.
- Tests including redaction filtering and C2PA chain validity.

---

## 7. Prompt BB3 — AI-first case-creation mode UI + flow

### Persona
Frontend engineer. Adds a parallel mode to the existing case-creation flow.

### Phase 2 — Propose & confirm

Entry point: existing case-creation entry now shows two CTAs:
- "Create with AI assistance" (new) — left CTA, primary visual weight.
- "Create manually" (existing wizard) — right CTA, secondary visual weight.

AI-first flow steps:

1. **Objective Input**: single text input "Describe the case you want to work on" with examples placeholder.
2. **AI Scaffolding**: shows progress: "Reviewing objective..." → "Identifying ontology..." → "Suggesting actors..." → "Recommending sources..." (≤30s P95). Calls `case_scaffolder` subagent (BB4).
3. **Scaffold Review**: renders `CaseScaffoldProposal`:
   - Suggested case name (editable).
   - Suggested primary ontology + optional secondaries (multi-select, max 3 per Pack 20).
   - Suggested initial actors (list with checkboxes; user can edit names, add/remove).
   - Suggested initial claims (list with checkboxes; same).
   - Suggested source set for Context Genesis (10-source picker, pre-selected per recommendation).
   - "Create case with these" button.
4. **Genesis Trigger**: existing Context Genesis flow (Pack 23) runs with accepted scaffold.
5. **Workbench Lands**: Chapters/Desk/Context populated per Pack 26.

### Files

- `src/components/onboarding/ai-first-case-creation/EntryPoint.tsx` (modified existing entry).
- `src/components/onboarding/ai-first-case-creation/ObjectiveInput.tsx`.
- `src/components/onboarding/ai-first-case-creation/ScaffoldReview.tsx`.
- `src/app/api/cases/scaffold/route.ts` (POST invokes case_scaffolder).
- `tests/e2e/onboarding/ai-first-case-creation.spec.ts`.

### Phase 4 — Verify

- E2E: type objective → wait ≤30s → review scaffold → accept → Genesis runs → workbench lands populated within 90s total.

---

## 8. Prompt BB4 — `case_scaffolder` subagent

### Persona
Agent engineer.

### Outcome

A new subagent `backend/agents/case_scaffolder/` deployed to Vertex AI Agent Engine. Uses `balanced` task kind (gemini-2.5-flash).

### Subagent design

Five-node LangGraph: parse_objective → recommend_ontology → extract_initial_actors → extract_initial_claims → recommend_sources.

Output:

```python
# backend/agents/case_scaffolder/output_schema.py
class CaseScaffoldProposal(BaseModel):
    suggested_case_name: str
    suggested_description: str
    primary_ontology_id: OntologyId
    secondary_ontology_ids: list[OntologyId]   # 0..2
    initial_actors: list[ProposedActor]         # 3-8
    initial_claims: list[ProposedClaim]         # 0-5
    suggested_source_kinds: list[CanonicalSourceKind]
    rationale: str

class ProposedActor(BaseModel):
    name: str
    actor_type: str
    description: str
    importance_score: float                     # 0..1
    rationale: str

class ProposedClaim(BaseModel):
    actor_name: str
    text: str
    claim_type: Literal['demand', 'position', 'fact_assertion']
    rationale: str
```

System prompt key elements:
- Maps user objective to ontology via affinity (e.g., "ceasefire compliance" → Conflict; "violation tracking" → Human Rights).
- Generates actor names using common-sense world knowledge (gemini's training).
- Marks every proposed item with rationale ("included this actor because the objective explicitly mentions Sudan, and Sudanese conflict typically involves these primary parties").
- Confidence calibrated; uncertain proposals marked.

Eval set: 30 hand-labeled objectives at `backend/agents/case_scaffolder/eval/cases.json`. Pass criteria: ≥80% of proposed fields rated correct or near-correct on human review.

### Files

- `backend/agents/case_scaffolder/__init__.py`, `graph.py`, `state.py`, `runner.py`, `output_schema.py`.
- `backend/agents/case_scaffolder/prompts/system.md`.
- `backend/agents/case_scaffolder/eval/cases.json`.
- `backend/agents/case_scaffolder/eval/run_eval.py`.
- `infrastructure/agent-engine-deployments.json` — 12th subagent.
- `skills/subagents/case_scaffolder/SKILL.md`.

---

## 9. Prompt BB5 — Empty-state guidance: per-tab contract + components

### Persona
Frontend + product engineer.

### Outcome

A reusable `<EmptyStateGuidance>` component at `src/components/workbench/empty-state/EmptyStateGuidance.tsx` that renders when a tab's data is empty or thin. Each tab gets a dispatcher that selects content based on case density and (role × ontology).

```ts
// src/components/workbench/empty-state/EmptyStateGuidance.tsx

interface EmptyStateGuidanceProps {
  density: 'empty' | 'thin' | 'populated';
  tabId: WorkbenchTabId;
  caseModule: CaseModule;
  userRole: UserRole;
}

// Renders nothing at populated density.
// At empty/thin density, renders structured guidance:
// - 1-2 sentence "what this tab is for"
// - 3-5 starter actions specific to the tab + role + active ontology
// - Each action is one-click runnable
```

Per-tab integration: each of the 6 already-implemented tabs (Graph, ACH, Tools, Memos, Boardroom, Ontology — already from Pack 27 with own empty handling, but normalize) wraps its existing rendering with:

```tsx
{density === 'populated' ? <ExistingTabContent /> : (
  <>
    <EmptyStateGuidance density={density} tabId={tabId} caseModule={caseModule} userRole={userRole} />
    {density === 'thin' && <ExistingTabContent />}
  </>
)}
```

At thin density, both guidance and existing content show. At empty density, only guidance shows.

### Files

- `src/components/workbench/empty-state/EmptyStateGuidance.tsx`.
- `src/lib/workbench/case-density.ts` (computes density from caseModule).
- Edits to each of the 6 affected tabs.

---

## 10. Prompt BB6 — Empty-state guidance content: role × ontology starter actions

### Outcome

A committed reference at `src/lib/workbench/empty-state-actions.ts` mapping every (role × ontology × tabId) tuple to a specific set of 3-5 starter actions.

```ts
// src/lib/workbench/empty-state-actions.ts
export const EMPTY_STATE_ACTIONS: Record<
  UserRole,
  Record<OntologyId, Record<WorkbenchTabId, EmptyStateAction[]>>
> = {
  diplomat: {
    'conflict': {
      tools: [
        { kind: 'run_tool', toolId: 'cross.contradiction-finder', cta: 'Find contradictions in your sources', why: 'Reveals gaps and contested facts before drafting.' },
        { kind: 'run_tool', toolId: 'governance.coalition-map', cta: 'Map UNSC coalition dynamics', why: 'Shapes your diplomatic strategy.' },
        // ... 3 more
      ],
      memos: [
        { kind: 'create_memo', templateId: 'country-brief', cta: 'Draft country brief', why: 'Standard FCDO output format.' },
        // ...
      ],
      boardroom: [
        { kind: 'convene_boardroom', personas: ['political-analyst', 'security-analyst', 'devils-advocate'], cta: 'Convene strategic deliberation', why: 'Stress-test your read of the situation.' },
        // ...
      ],
      // ... per tab
    },
    // ... per ontology
  },
  // ... per role
};
```

Manual review: Giulio reviews the matrix before it ships (it's the user's first impression of every tab).

### Files

- `src/lib/workbench/empty-state-actions.ts` (substantial reference table).
- Tests verifying the table is well-formed.

---

## 11. Prompt BB7 — New-user end-to-end test

### Outcome

`tests/e2e/onboarding/new-user-end-to-end.spec.ts`:

1. Sign up via magic link.
2. Complete onboarding (role: un_official, objective: Sudan ceasefire monitoring Q3 2026, sources: 5 picked).
3. Click "Create case with AI assistance".
4. Type objective.
5. Wait for scaffold (≤30s).
6. Accept scaffold.
7. Wait for Context Genesis (≤120s).
8. Workbench lands; verify Chapters tab shows populated content.
9. Open Tools tab; verify starter recommendations visible; click first recommended tool; verify run completes.
10. Open Memos tab; verify Country Brief template auto-suggested; create memo; verify auto-populated.
11. Open Draft tab; select memo; configure cover page; export DOCX.
12. Verify DOCX downloads with correct content + C2PA chain.

Total wall-clock budget: ≤180s P95 for the new-user-to-first-export flow.

Run 10 consecutive times; record green-streak.

### Files

- `tests/e2e/onboarding/new-user-end-to-end.spec.ts`.

---

## 12. Prompt BB8 — ADRs + integration + verification

### ADRs

- `0044-draft-as-briefing-assembly-contract.md`.
- `0045-ai-first-case-creation-pattern.md`.

### Final verification

```bash
npm run typecheck && npm run lint && npm run test
pytest backend/ -q

npm run audit:subagent-deployment-fresh   # 12/12
npm run audit:subagent-eval-fresh          # 12/12 ≥ 80%
npm run audit:firewall-coverage             # unchanged
npm run audit:gate

npm run test:e2e:personas                  # 10 consecutive green
npx playwright test tests/e2e/workbench/draft-briefing-assembly.spec.ts
npx playwright test tests/e2e/onboarding/ai-first-case-creation.spec.ts
npx playwright test tests/e2e/onboarding/new-user-end-to-end.spec.ts   # 10 consecutive

npm run lh:ci

git tag v1.5.0
```

---

## 13. Prompt BB9 — Final hardening sweep + persona suite expansion + documentation

### Outcome

After BB1-BB8, the loop is closed. This prompt does the final sweep:

**Persona suite expansion**: 4 personas × 1 new step each = 4 new persona suite steps that exercise the new-user end-to-end flow. Each persona starts from a fresh user profile, runs through AI-first creation, lands on populated workbench, runs at least one tool from each surface category.

**Documentation update**: `README.md` updates with the new headline activation flow (~90s create case + ≤180s to first export). `docs/architecture/PRAXIS_ARCHITECTURE.md` §11 updated to reflect 12 working surfaces. `CHANGELOG.md` 1.5.0 entry.

**Architecture surface map**: `docs/architecture/WORKBENCH_SURFACES.md` documents what each of the 12 tabs renders + where its content comes from + which subagent (if any) supports it. This is the canonical reference for the next engineer.

### Files

- 4 persona suite step extensions.
- Documentation updates.
- `docs/architecture/WORKBENCH_SURFACES.md`.

---

## 14. Closing note

After Pack 28, all twelve workbench surfaces are real. The new-user flow is end-to-end: from sign-up through onboarding through AI-first case creation through Context Genesis through populated workbench through first tool run through first memo through first export — within 180s P95, costing ≤$1.20 P95.

Twelve subagents live on Vertex AI Agent Engine: the 4 base (context_preparer, source_augmenter, output_refiner, memo_drafter) + red_team_analyst + analyst_persona + moderator + policy_scope_reviewer (Pack 23) + chapter_suggester (Pack 26) + desk_advisor (Pack 26) + research_planner (Pack 27) + case_scaffolder (Pack 28).

The architecture bible's claims are matched by re-runnable evidence in the repo. The user opens PRAXIS at 9:14am on a Tuesday with a brief due at noon, types one sentence, and finishes at 11:48 with twelve minutes to read it back.

Branch: `feature/surfaces-wave-3`. Commit prefix `surface(<name>): BB<N> <description>`. PR titled `Pack 28 — Surfaces Wave 3: Draft, AI-First Creation, Surface Hardening`.

After merge, tag `v1.5.0`. The headline product activation metric is now: time-to-first-export ≤180s P95.

---

**File path**: `C:\Users\giuli\Downloads\PRAXIS_CODEX_28_SURFACES_DRAFT_NEW_USER_AND_HARDENING.md`
