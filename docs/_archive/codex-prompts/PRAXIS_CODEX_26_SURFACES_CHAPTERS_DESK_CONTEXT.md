# PRAXIS — Codex Pack 26: Surfaces Wave 1 — Chapters, Desk, Context

**File**: `PRAXIS_CODEX_26_SURFACES_CHAPTERS_DESK_CONTEXT.md`
**Branch**: `feature/surfaces-wave-1`
**Depends on**: Packs 18-25 merged. v1.3.2 tagged. Context Genesis live. Document schema discipline live. Integration paths verified.
**Estimated effort**: ~9 days (~70 engineering hours).
**Target release**: v1.4 (wave 1 of 3 closing the workbench surface gap)
**Voice**: Senior product engineer who has watched real users open a freshly-created case in PRAXIS and seen them disengage within ten seconds because the workbench is empty and the placeholder copy doesn't tell them what to do next. Closes that gap with three surfaces that earn the user's first-session trust.

---

## 0. Why this pack exists

The PRAXIS workbench has 12 tabs declared in `src/lib/workbench/tabs.ts`: Chapters, Desk, Context, Library, Research, Ontology, Graph, ACH, Tools, Memos, Boardroom, Draft. After packs 18-25, six of these (Ontology, Graph, ACH, Tools, Memos, Boardroom) have real, working implementations rendered from `src/components/workbench/workbench-tab-content.tsx`. The other six — Chapters, Desk, Context, Library, Research, Draft — are either rendered through a `WorkbenchTabPanel` placeholder (Desk, Context, Library, Research, Draft show only a title + body + 4 metrics) or render generic placeholder copy unless the case is a hand-coded demo case (Chapters fall back to `GenericChapterContent` for any case that doesn't define `caseModule.chapters`).

The consequence is severe and visible. A new user signs up, completes onboarding, creates their first case ("Sudan ceasefire monitoring Q3 2026"), and lands on a workbench whose default tab (Chapters) shows five collapsible sections each saying: "Frame the mandate, question, actors, constraints, and change indicators for this case." That copy does not tell the user what to do. The Desk tab, which should be the command center, shows risk + Glasl + sources + graph-nodes metrics — all near zero on a fresh case — and one paragraph of static body text. The Context tab shows the same shape with different copy. The user has no path forward. Every prior pack's investment in Context Genesis, the marketplace, the boardroom, the memo studio is gated behind these three surfaces being usable, and they are not.

This pack closes the gap on the first three surfaces — Chapters, Desk, and Context — which together carry the entire arc from "I just created a case" to "I have a populated workbench ready to do work." Three pivotal capabilities ship:

**(1) Chapters renders real, AI-driven content for any case** — not just the hand-coded Syria-2026 and Nordalia-2026 demo cases. The five-chapter flow (Situation Frame, Source Receipts, Conflict Graph, DIALECTICA Reasoning, Decision Product) extracts content from the case's actual state: the user's onboarding-captured frame, the documents Context Genesis ingested, the graph nodes accumulated so far, the tool runs executed, the memos drafted. Each chapter has a deterministic-content path (renders structured data) and an AI-suggestion path (the Genesis-style orchestrator proposes "what should this chapter say?" with an Accept/Edit/Reject control routed through the existing review queue per Pack 18 R1).

**(2) Desk becomes a true command center** for the case. Replaces the four-metric placeholder with: a what-changed panel (latest review-queue items, new graph nodes, new documents, recent tool runs) generated from a structured query against the case's actual state; a next-best-actions panel surfacing 3-5 actions the user should take next, computed from a small `desk_advisor` subagent that examines the case's context-health score, ontology coverage, recent activity, and tool-suggestion engine output; a stale-context advisory when sources haven't been refreshed; an "open questions" board persisting questions the user has parked.

**(3) Context becomes the editable scope studio** for the case. Replaces the placeholder with: an editable case frame (mandate, question, actors, constraints, change indicators) backed by Firestore + the firewall; an AI-suggestion panel using the existing `policy_scope_reviewer` subagent (Pack 23 W6) that suggests scope refinements as the case evolves; document-upload + source-preferences controls that route through the existing Context Genesis pipeline (so the user can re-genesis with new preferences without leaving the tab); the existing actor / claim / interest editing patterns from `case-creation-wizard.tsx` lifted into the Context tab so the user can refine their case post-genesis.

Three structural decisions keep this pack disciplined:

**(A) No new graphical components.** The Chapters tab uses the existing `WorkbenchChapterShell` collapsible. The Desk tab uses existing Card / Badge / List patterns from elsewhere in the codebase (the review-queue list, the diagnostics dashboard panels). The Context tab reuses the existing case-creation-wizard step components.

**(B) The five chapters' content paths are layered.** Each chapter's renderer reads in this order: (1) deterministic content if the case has structured data (e.g., source receipts populated → render them as a table); (2) AI-suggested content if the case has insufficient structured data (e.g., no actors yet → suggest extraction from documents); (3) generic placeholder only if both prior layers fail (a brand-new empty case still shows actionable hints).

**(C) AI suggestions route through the existing review queue.** When the chapter-suggester subagent proposes "Based on the documents you uploaded, the case Frame should be: ...", that proposal lands in the review queue with `source.kind='chapter-suggester'`, the user accepts/rejects through the existing UI (Pack 18 R1), accepted suggestions update the case's structured state. No silent AI writes.

After this pack ships, a brand-new user creating their first case sees: Chapter 1 (Frame) showing AI-extracted mandate + question + initial actors with an "Accept frame" CTA; Chapter 2 (Receipts) showing the source receipts Genesis produced with a "Confirm sources" CTA; Chapter 3 (Graph) showing a small populated graph; Chapter 4 (DIALECTICA) showing 3-5 recommended tools to run with one-click invocation; Chapter 5 (Product) showing memo template suggestions. The Desk tab shows what changed since the last visit + what to do next. The Context tab lets the user refine scope and re-genesis when needed. The user has a clear path from empty workbench to first memo.

---

## 1. Outcomes

| # | Outcome | Verification |
|---|---|---|
| 1 | Five chapters render structured content for any user-created case (not just hand-coded demos), reading from Firestore situation + Context Genesis output + graph nodes + tool runs + review queue | E2E `tests/e2e/workbench/chapters-real-content.spec.ts`: create new case via Genesis, all 5 chapters render non-placeholder content within 10s |
| 2 | New `chapter_suggester` subagent (9th on Vertex Agent Engine, parameterized for `balanced` task kind) produces structured suggestions per chapter when content is thin; suggestions land in review queue per Pack 18 R1 | Subagent deployed; eval ≥80% on 25 cases; review queue receives chapter-suggester items |
| 3 | Desk tab redesigned (existing surface, no new tab) into 4 sections: What Changed, Next Best Actions, Stale Context Advisory, Open Questions Board | E2E `tests/e2e/workbench/desk-command-center.spec.ts` |
| 4 | New `desk_advisor` subagent (10th, `cheap_classify` task kind) computes next-best-actions from case state + tool-suggestion-engine output (Pack 13/21) + context-health score | Subagent deployed; eval ≥80% on 30 cases |
| 5 | Context tab redesigned (existing surface) into editable scope studio: Frame editor, AI-suggestions panel using `policy_scope_reviewer`, source-preferences (re-genesis trigger), document-upload (existing uploader), actor/claim/interest refinement (lifted from case-creation-wizard) | E2E `tests/e2e/workbench/context-scope-studio.spec.ts` |
| 6 | Re-genesis from Context tab: user can change source preferences, click "Refresh sources", new Source-layer nodes added (de-duped against existing) without disrupting case continuity | E2E test verifies non-destructive re-genesis |
| 7 | Open Questions Board: persistent Firestore subcollection `users/{uid}/situations/{sitId}/open-questions/{qid}` with Q&A lifecycle (open → answered/parked/dismissed) | API + Firestore rules + E2E |
| 8 | Performance: each tab's first-paint TTI ≤ 800ms; Chapters expansion of any chapter ≤ 500ms; Context tab edits save debounced ≤ 250ms | Lighthouse + custom timing test |
| 9 | Cost: chapter-suggester ≤ $0.04 per case per chapter run; desk-advisor ≤ $0.02 per Desk view; both within existing budget envelope | Cost telemetry per-tab in dashboard |
| 10 | Two new ADRs: 0040 (Chapters layered-content rendering pattern), 0041 (Desk command-center contract) | ADRs reviewed and merged |

---

## 2. Pre-work confirmation note

> I am Codex. I have read pack 26. I understand:
> 1. **The three surfaces (Chapters, Desk, Context) all render through existing `WorkbenchTabContent.tsx` dispatch.** No new top-level tabs. No new graphical primitives. Reuse `Card`, `Badge`, `Button`, `Loader2`, the existing `WorkbenchChapterShell` collapsible, the dropdown/select primitives.
> 2. **Chapter content is layered**: deterministic structured-data first, AI suggestion second, generic placeholder last. The hand-coded Syria-2026 and Nordalia-2026 chapters are preserved; user-created cases get the layered renderer instead of the GenericChapterContent fallback.
> 3. **AI suggestions are advisory**, route through the existing review queue (Pack 18 R1), and never silently mutate the case's structured state. The user's accept/reject is the trigger for any persisted change.
> 4. **The case-creation-wizard's actor/claim/interest editing UI is lifted** into the Context tab as the post-genesis refinement surface. This is component composition, not duplication.
> 5. **Re-genesis is non-destructive**. Calling Context Genesis again on an existing case adds new Source-layer nodes (de-duped on `provenance.source_chunk_id`), never removes existing ones, never modifies existing graph edges. The user's accumulated work is preserved.
> 6. **Two new subagents** deploy to Vertex AI Agent Engine: `chapter_suggester` (`balanced`, gemini-2.5-flash) and `desk_advisor` (`cheap_classify`, gemini-2.5-flash). Both follow the deployment + eval + Cloud Trace + cost telemetry pattern from Pack 18 R4.
> 7. **All architecture invariants from the bible (§3) hold.** ContextProvider-only access. Symbolic firewall enforced on every write. Owner scoping absolute. Model strings only in `MODEL_MATRIX.json`.
>
> Open questions for Giulio:
> - **Q1**: Chapter content layering — propose: (1) read structured data → (2) if thin, invoke chapter_suggester → (3) if subagent unavailable or empty, render the existing GenericChapterContent. Acceptable, or different fallback order?
> - **Q2**: Chapter-suggester triggering — propose: runs once per chapter on first visit (cached for 24h); user can click "Refresh suggestions" to re-run. Acceptable?
> - **Q3**: Next Best Actions count — propose: 3-5 actions surfaced, each with clear CTA (e.g., "Run cross.contradiction-finder on the 3 conflicting source claims" → one-click invokes the tool). Acceptable?
> - **Q4**: Open Questions Board — propose: lightweight Q&A capture, no thread depth, max 20 open per case. User can add a question, mark answered with reference to memo block / tool run / manual note. Acceptable?
> - **Q5**: Re-genesis cost — propose: re-genesis costs the same as initial genesis ($0.40 P95 ceiling), but is rate-limited to 3 per case per day. Acceptable?

Wait for answers before proceeding.

---

## 3. Pack overview

| Prompt | Outcome | Est. hrs |
|---|---|---:|
| Z1 | Foundations: Layered chapter renderer pattern; tab-content dispatch refactor; types | 5 |
| Z2 | Chapter renderers (5): structured-content paths reading from real case state | 12 |
| Z3 | `chapter_suggester` subagent: deployment + eval + integration with review queue | 8 |
| Z4 | Desk tab redesign: What Changed + Next Best Actions + Stale Context + Open Questions surfaces | 12 |
| Z5 | `desk_advisor` subagent: deployment + eval | 6 |
| Z6 | Open Questions Board: schema, API, UI, lifecycle | 5 |
| Z7 | Context tab redesign: scope editor + AI suggestions + source preferences + actor refinement | 12 |
| Z8 | Re-genesis flow: non-destructive context refresh from Context tab | 4 |
| Z9 | ADRs + final integration + perf budgets + verification | 6 |
| **Total** | | **~70** |

---

## 4. Hard rules

- **No new graphical components.** Reuse `Card`, `Badge`, `Button`, `Loader2`, dropdown/select primitives, `WorkbenchChapterShell`. Compose, don't invent.
- **No new top-level tabs.** Chapters, Desk, Context already exist; this pack populates them.
- **Layered fallback always renders something useful.** A brand-new empty case still has actionable Chapter 1 content (e.g., "Click Re-genesis with these recommended sources to populate this chapter").
- **AI suggestions never silently write.** All chapter-suggester and desk-advisor outputs render as proposals with explicit Accept/Edit/Reject. Accepted proposals route through the firewall + review queue + two-phase commit.
- **Re-genesis is non-destructive.** New source nodes added (deduped); existing nodes preserved; user's accumulated work intact.
- **Performance budgets enforced.** Chapter expansion ≤500ms. Tab TTI ≤800ms. Failure to meet means a sub-prompt for performance work, not a feature compromise.
- **Owner scoping absolute.** Open Questions Board owner-scoped via Firestore rules. Re-genesis only callable on user's own case.
- **All prior invariants from packs 03-25 hold.**

---

## 5. Prompt Z1 — Foundations: Layered chapter renderer + dispatch refactor + types

### Persona
Architect. Defines the layered-content pattern once, correctly, before any rendering code is written.

### Phase 1 — Read & report

- Inspect existing `src/components/workbench/workbench-tab-content.tsx` dispatch.
- Inspect existing `src/components/workbench/chapter-renderer.tsx` and `src/lib/workbench/chapter-flow.ts`.
- Inspect existing Syria-2026 and Nordalia-2026 hand-coded chapters at `src/lib/cases/syria-2026/chapters.tsx` and `nordalia-2026/chapters.tsx`.
- Inspect existing `src/lib/cases/user-cases/loader.ts` and confirm user cases lack `chapters` property.
- Output `docs/audits/2026-NN-NN-WORKBENCH_SURFACES_BASELINE.md` documenting which tabs render real content vs placeholder.

### Phase 2 — Propose & confirm

Layered chapter renderer pattern:

```ts
// src/lib/workbench/chapter-content-layer.ts
import type { ReactNode } from 'react';
import type { CaseModule } from '@/types/case-module';
import type { WorkbenchChapterId } from '@/lib/workbench/chapter-flow';

export interface ChapterContentLayer {
  id: 'hand-coded' | 'structured' | 'ai-suggested' | 'generic';
  available: (caseModule: CaseModule) => boolean;
  render: (caseModule: CaseModule, opts: { onSuggestionAccept: (item: SuggestedChapterItem) => void }) => ReactNode;
}

export interface SuggestedChapterItem {
  chapterId: WorkbenchChapterId;
  proposalKind: 'frame_field' | 'actor' | 'claim' | 'event' | 'memo_block_seed' | 'tool_invocation_hint';
  payload: unknown;
  rationale: string;
  confidence: number;  // 0..1, capped at 0.6 for synthesized
}

// Per chapter, an ordered array of layers. The renderer picks the first layer
// whose `available()` returns true.
export const CHAPTER_LAYERS: Record<WorkbenchChapterId, ChapterContentLayer[]> = {
  // Wired up in Z2.
};
```

Dispatcher refactor:

```ts
// src/components/workbench/chapter-renderer.tsx (refactored)

function renderChapter(chapter: WorkbenchChapterDescriptor, caseModule: CaseModule) {
  // Step 1: hand-coded (Syria-2026, Nordalia-2026 keep their richer renderers)
  const handCoded = caseModule.chapters?.[chapter.id]?.();
  if (handCoded) return handCoded;

  // Step 2: layered renderer for user cases
  const layers = CHAPTER_LAYERS[chapter.id];
  for (const layer of layers) {
    if (layer.available(caseModule)) {
      return layer.render(caseModule, { onSuggestionAccept });
    }
  }

  // Step 3: ultimate fallback
  return <GenericChapterContent chapterId={chapter.id} situationName={caseModule.manifest.name} />;
}
```

Wait for sign-off on the layer ordering and the SuggestedChapterItem shape.

### Phase 3 — Execute

- Author types in `src/lib/workbench/chapter-content-layer.ts`.
- Refactor `src/components/workbench/chapter-renderer.tsx` to consume layers.
- No layer renderers shipped yet — Z2 fills them in.

### Phase 4 — Verify

- Existing Syria-2026 and Nordalia-2026 cases render unchanged.
- User-created case still renders GenericChapterContent (fallback works).
- Type-parity audit green.

---

## 6. Prompt Z2 — Chapter renderers: structured-content paths

### Persona
Frontend engineer who knows how to read graph state and render it cleanly.

### Outcome

For each of the 5 chapters, a structured-content layer renderer that reads real case state and renders it through existing UI primitives.

**Chapter 1 — Situation Frame** (`src/components/workbench/chapters/structured/SituationFrameStructured.tsx`):
- Reads `caseModule.situation.frame` (mandate, question, actors-of-record, constraints, change indicators).
- Renders as a clean two-column layout: left = mandate + question; right = key actors as Badge chips + change indicators as bulleted list.
- Empty state: shows AI-suggestion CTA if any frame field is empty.

**Chapter 2 — Source Receipts** (`SourceReceiptsStructured.tsx`):
- Reads `caseModule.sources` (canonical-source receipts from Context Genesis + user uploads + workspace methodology).
- Renders as the existing review-queue list pattern: title + canonical-source-kind badge + reliability score + retrieved-at + "Open document" button.
- Group-by-source-kind toggle.
- "Add source" button opens existing document-uploader inline.

**Chapter 3 — Conflict Graph** (`ConflictGraphStructured.tsx`):
- Renders a compact version of `PraxisGraphCanvas` (existing) sized for the chapter (~400px height).
- Shows node-count per ACO primitive as Badge chips above the graph.
- "Open full graph" button switches to Graph tab.

**Chapter 4 — DIALECTICA Reasoning** (`DialecticaStructured.tsx`):
- Reads `recommendedToolIds` from the case's active ontology (Pack 20).
- Reads recent tool runs from Firestore.
- Renders 3-5 recommended tools as cards with one-click "Run" CTAs (existing tool-marketplace runner).
- Recent tool runs section: latest 5 runs with status + result snippet + "Open run" button.

**Chapter 5 — Decision Product** (`DecisionProductStructured.tsx`):
- Reads existing memo versions for the case.
- Renders memo cards with "Open in Memo Studio" CTA.
- "Create new memo" CTA opens MemoStudio with the appropriate template based on case ontology.
- Empty state: suggests memo template based on user role.

### Phase 4 — Verify

- E2E test: create user case via Genesis → all 5 chapters render structured content within 10s.
- Each chapter passes visual snapshot test.

### Files

- 5 components in `src/components/workbench/chapters/structured/`.
- `src/lib/workbench/chapter-content-layer.ts` — register the 5 layers.
- E2E `tests/e2e/workbench/chapters-structured-content.spec.ts`.

---

## 7. Prompt Z3 — `chapter_suggester` subagent

### Persona
Agent engineer.

### Outcome

A new subagent at `backend/agents/chapter_suggester/` deployed to Vertex AI Agent Engine, parameterized by `chapter_id`. Single subagent serves all 5 chapters via parameterization (Pack 16 pattern).

### Subagent design

Five-node LangGraph: load_case_state → load_chapter_template → identify_gaps → generate_suggestions → structure_output.

Per chapter, a system prompt template that knows:
- What "good" content for this chapter looks like (e.g., Frame: 5 fields including mandate; Receipts: ≥3 cited sources).
- What gaps to identify (e.g., no Actors yet → suggest extraction from uploaded documents).
- What suggestions to produce (typed per `SuggestedChapterItem.proposalKind`).

System prompt key elements:
- All suggestions cite the source from which they were derived (a document, a graph node, a Frame field).
- Confidence capped at 0.6 (synthesized rule per firewall).
- Output is JSON conforming to `SuggestedChapterItem`.

Eval set: 25 cases at `backend/agents/chapter_suggester/eval/cases.json` (5 per chapter). Pass rate ≥80%.

### Files

- `backend/agents/chapter_suggester/__init__.py`, `graph.py`, `state.py`, `runner.py`, `output_schema.py`.
- `backend/agents/chapter_suggester/prompts/system_template.md`.
- `backend/agents/chapter_suggester/prompts/chapters/<chapter-id>.md` × 5.
- `backend/agents/chapter_suggester/eval/cases.json`.
- `infrastructure/agent-engine-deployments.json` — add 9th subagent.
- `skills/subagents/chapter_suggester/SKILL.md`.

### Integration

- New API route `POST /v1/cases/{caseId}/chapters/{chapterId}/suggest` invokes the subagent.
- Suggestions persist to review queue with `source.kind='chapter-suggester'`.
- AI-suggested chapter layer (in Z1) renders pending suggestions from queue with Accept/Edit/Reject controls.
- Accept routes through firewall + two-phase commit per Pack 18.

---

## 8. Prompt Z4 — Desk tab redesign

### Persona
Senior product engineer who knows what an analyst's "command center" should show.

### Outcome

Desk tab replaces the placeholder panel with four sections, each rendered through existing UI primitives:

**Section 1 — What Changed**:
- Reads recent activity since user's last visit timestamp.
- Lists: new review-queue items, new graph nodes, new documents, new tool runs, new memos, recent boardroom deliberations.
- Each row clickable to the relevant detail.
- "Mark all as seen" updates the last-visit timestamp.

**Section 2 — Next Best Actions**:
- Output of `desk_advisor` subagent.
- 3-5 actions, each with clear CTA: "Run cross.contradiction-finder on 3 conflicting claims" / "Review 5 pending review-queue items" / "Refresh sources (last fetched 14 days ago)" / "Convene boardroom on the open question 'should we recommend lifting sectoral sanctions?'"
- Each action invokable in one click.
- Refreshable via "Suggest different actions" button.

**Section 3 — Stale Context Advisory**:
- Computed deterministically: list of sources whose `retrievalTimestamp` is >30 days old; documents archived but still referenced by non-archived nodes; ontology coverage gaps.
- Each advisory has a remediation CTA.

**Section 4 — Open Questions Board**:
- Lightweight Q&A capture (Z6 ships the schema + API).
- Add question with optional category (e.g., "scope-question", "evidence-gap", "decision-needed").
- Each question card shows status (open/answered/parked) with mark-as-X actions.
- Answered questions reference the artifact that resolved them (a memo block, a tool run, a manual note).

### Files

- `src/components/workbench/desk/WhatChangedPanel.tsx`.
- `src/components/workbench/desk/NextBestActionsPanel.tsx`.
- `src/components/workbench/desk/StaleContextPanel.tsx`.
- `src/components/workbench/desk/OpenQuestionsPanel.tsx`.
- `src/components/workbench/desk/DeskTab.tsx` — composes the four panels.
- Edit `src/components/workbench/workbench-tab-content.tsx` to dispatch Desk tab to the new component.

### Phase 4 — Verify

- E2E `tests/e2e/workbench/desk-command-center.spec.ts`: open Desk tab on populated case → all 4 sections render correctly.
- Performance: Desk TTI ≤800ms.

---

## 9. Prompt Z5 — `desk_advisor` subagent

### Persona
Agent engineer.

### Outcome

A new subagent at `backend/agents/desk_advisor/` deployed to Vertex AI Agent Engine. Uses `cheap_classify` task kind (gemini-2.5-flash).

### Subagent design

Three-node LangGraph: gather_case_signals → rank_actions → structure_output.

Inputs:
- Context-health score (existing).
- Ontology coverage report.
- Recent activity summary (last 7 days).
- Tool-suggestion engine output (Pack 13 / Pack 21).
- User role + preferences.

Output: `NextBestAction[]` (3-5 actions, each with `actionKind` discriminated union: `run_tool` | `refresh_sources` | `review_queue_item` | `convene_boardroom` | `draft_memo`, `payload`, `rationale`, `priority`).

Eval set: 30 cases at `backend/agents/desk_advisor/eval/cases.json`. Pass rate ≥80%.

### Files

- `backend/agents/desk_advisor/` (full structure).
- `infrastructure/agent-engine-deployments.json` — 10th subagent.
- `skills/subagents/desk_advisor/SKILL.md`.

---

## 10. Prompt Z6 — Open Questions Board

### Outcome

Schema + API + UI for the lightweight Q&A capture.

### Schema

```ts
// src/types/open-questions.ts
export interface OpenQuestion {
  id: string;
  caseId: string;
  ownerUid: string;
  question: string;
  category?: 'scope-question' | 'evidence-gap' | 'decision-needed' | 'stakeholder-input' | 'other';
  status: 'open' | 'answered' | 'parked' | 'dismissed';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: 'user' | 'memo-block' | 'tool-run' | 'boardroom-claim';
  resolvedRef?: string;  // ref to the artifact that answered it
  notes?: string;
}
```

Firestore subcollection: `users/{uid}/situations/{sitId}/open-questions/{qid}`. Owner-scoped via existing rules.

### API

- `GET /v1/cases/{caseId}/open-questions` — list (filter by status).
- `POST /v1/cases/{caseId}/open-questions` — create.
- `PATCH /v1/cases/{caseId}/open-questions/{qid}` — update status.
- `DELETE /v1/cases/{caseId}/open-questions/{qid}` — soft-delete.

### UI

The Open Questions Panel (in Z4) renders the list + add-question input. No new component beyond what's needed.

---

## 11. Prompt Z7 — Context tab redesign: scope studio

### Persona
Frontend engineer. Lifts existing case-creation-wizard subcomponents into Context tab as the post-genesis refinement surface.

### Outcome

Context tab replaces placeholder with the following sections (composed of existing primitives):

**Section 1 — Frame Editor**:
- Reads `caseModule.situation.frame`.
- Editable inline: mandate, question, change indicators.
- Saves debounced (250ms) to Firestore through firewall.

**Section 2 — AI Scope Advisory**:
- Renders `ScopeAdvisory` from Pack 23 W6 `policy_scope_reviewer`.
- "Re-run scope review" CTA invokes the subagent.

**Section 3 — Source Preferences**:
- Existing 10-source picker (lifted from `situation-onboarding.tsx` / `case-creation-wizard.tsx`).
- "Refresh sources" CTA invokes Z8 re-genesis.

**Section 4 — Document Upload**:
- Existing `document-uploader.tsx` component embedded inline.
- New uploads route through Context Genesis user-upload adapter (Pack 23 W4) plus categorization classifier (Pack 24 X2).

**Section 5 — Actors / Claims / Interests Refinement**:
- Lifts `WizardActor`, `WizardClaim`, `WizardInterest` patterns from `case-creation-wizard.tsx` into reusable inline editors.
- Operations write through firewall + review queue (synthesized) or directly (user-asserted).

### Files

- `src/components/workbench/context/FrameEditor.tsx`.
- `src/components/workbench/context/ScopeAdvisory.tsx`.
- `src/components/workbench/context/SourcePreferences.tsx`.
- `src/components/workbench/context/DocumentUploadInline.tsx`.
- `src/components/workbench/context/ActorClaimInterestRefiner.tsx` (extracts the patterns from case-creation-wizard).
- `src/components/workbench/context/ContextTab.tsx` — composes the 5 sections.
- Edit `workbench-tab-content.tsx` dispatch.

### Phase 4 — Verify

- E2E `tests/e2e/workbench/context-scope-studio.spec.ts`: edit Frame → save → reload → preserved; edit source preferences → re-genesis available; upload document → appears in Library.

---

## 12. Prompt Z8 — Re-genesis flow (non-destructive)

### Persona
Backend engineer. Knows that the value of re-genesis is that it adds rather than replaces.

### Outcome

Extension of Pack 23's Context Genesis orchestrator with a "re-genesis" mode:

```python
# backend/services/context_genesis/orchestrator.py (extended)
async def run_context_genesis(
    *,
    case_id: str,
    owner_uid: str,
    objective: str,
    selected_sources: list[CanonicalSourceKind],
    ontology_ids: list[OntologyId],
    user_uploads: list[UploadedDocumentRef] = [],
    cost_ceiling_usd: float = 0.40,
    mode: Literal['initial', 're_genesis'] = 'initial',  # NEW
) -> ContextGenesisRun:
    if mode == 're_genesis':
        # 1. Load existing case state.
        # 2. Skip sources whose latest fetch is < 24 hours ago (politeness).
        # 3. For each remaining source, fetch content as in initial mode.
        # 4. On write, deduplicate against existing nodes by `provenance.source_chunk_id`.
        # 5. Update existing nodes' `retrievalTimestamp` if the source returned the same content.
        # 6. Create new nodes only for novel content.
    ...
```

Rate limit: 3 re-genesis runs per case per day (per Q5).

### API

- `POST /v1/cases/{caseId}/genesis` accepts `mode: 're_genesis'`.

### Files

- Edit `backend/services/context_genesis/orchestrator.py`.
- New tests covering re-genesis non-destructiveness.

---

## 13. Prompt Z9 — ADRs + integration + verification

### ADRs

- `0040-chapters-layered-content-rendering.md`.
- `0041-desk-command-center-contract.md`.

### Final verification

```bash
npm run typecheck && npm run lint && npm run test
pytest backend/ -q

npm run audit:subagent-deployment-fresh   # 10/10 (was 8/8)
npm run audit:subagent-eval-fresh          # 10/10 ≥ 80%
npm run audit:firewall-coverage             # unchanged
npm run audit:gate

npm run test:e2e:personas                  # 10 consecutive green
npx playwright test tests/e2e/workbench/chapters-structured-content.spec.ts
npx playwright test tests/e2e/workbench/desk-command-center.spec.ts
npx playwright test tests/e2e/workbench/context-scope-studio.spec.ts

npm run lh:ci   # Chapters/Desk/Context TTI ≤800ms

git tag v1.4.0
```

---

## 14. Closing note

After this pack, three of the six placeholder workbench surfaces become real: Chapters layered content driven by case state + AI suggestions; Desk as command center with what-changed + next-actions + stale-context + open-questions; Context as the editable scope studio with re-genesis. The user lands on a populated workbench within 120s of completing onboarding (Pack 23) and can navigate Chapters → Desk → Context with each surface telling them what to do next.

Branch: `feature/surfaces-wave-1`. Commit prefix `surface(<name>): Z<N> <description>`. PR titled `Pack 26 — Surfaces Wave 1: Chapters, Desk, Context`.

---

**File path**: `C:\Users\giuli\Downloads\PRAXIS_CODEX_26_SURFACES_CHAPTERS_DESK_CONTEXT.md`
