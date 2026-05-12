# PRAXIS — Codex Pack 19: Make PRAXIS Genuinely Useful

**File**: `PRAXIS_CODEX_19_GENUINELY_USEFUL.md`
**Branch**: `feature/genuinely-useful`
**Depends on**: Pack 18 merged. v1.0.0 tagged. Real subagents live on Agent Engine. Specialist tool handlers shipped.
**Estimated effort**: ~12 days (~95 engineering hours).
**Target release**: v1.1
**Voice**: Senior product engineer who has watched many "technically correct" products fail to be used. Knows that the difference between "I tried it once" and "I open it every morning" is the integration of a hundred small affordances that respect the user's time. Optimizes for the realistic professional workflow: the FCDO desk officer at 9:14am with a cabinet brief due at noon.

---

## 0. Why this pack exists

Pack 18 closes the gaps and earns v1.0.0. PRAXIS now has live subagents, real specialist handlers, the symbolic firewall on every write path, the review queue, two-phase commits, the public demo, the canonical routes, and ten green persona-suite runs. The architecture is honest. The launch is real.

This pack is what comes next. It is the pack that turns "PRAXIS is technically correct" into "PRAXIS is the workbench I open at 9:14am with a cabinet brief due at noon and finish at 11:48 with twelve minutes to read it back." The five things that make the difference between a useful product and a daily-driver tool — and that are *not yet there* in the v1.0 codebase — are:

1. **Situation creation that feels effortless.** Today the user clicks "create new case" and is presented with a near-empty workbench. The pack-19 contract: the user types one sentence describing the situation ("Sudan ceasefire monitoring, July 2026") or pastes a URL or drops a folder of PDFs, and within 90 seconds they have a populated case with a Frame, an ontology selection, an initial actor list, an initial event timeline, and a suggested next-action ("Run a coalition map?"). The activation barrier collapses.

2. **Context that compounds across cases.** Today every case is an island. The user re-uploads the Harvard PON primer for every mediation case. They retype their communication style preference. They re-introduce their organization's house rules. The pack-19 contract: workspace guidelines apply automatically to every case in the workspace, the user's preferences propagate into every tool invocation, and the user can fork a case from a similar past case with the click of a button. Time-compounding.

3. **Tool outputs that earn the user's trust.** v1.0 specialist handlers work; they produce structured output. But the user has no fast way to verify a claim, see the underlying evidence, or compare a tool's output across runs. The pack-19 contract: every output has an evidence drawer one click away showing the exact graph nodes cited; outputs are diffable across runs; the user can challenge a claim and see the specific reasoning step that produced it. Trust earned through inspectability.

4. **Memos that earn their place in real briefings.** v1.0 memo studio produces clean DOCX. But a memo that goes to a UNSC briefing or a cabinet committee needs more: branded headers, signed cover pages, redaction layers, version history with named milestones, comparison-with-prior-memo views, a "submit for review" workflow that locks the version. The pack-19 contract: memos behave like the documents they need to become.

5. **Boardroom that genuinely changes how the user thinks.** v1.0 boardroom (after pack 18 closes Pack 16's gaps) is real — analyst_persona deployed, deliberations real, transcripts citable. But it is one-shot: convene → deliberate → synthesize → close. The pack-19 contract: the user can intervene mid-deliberation ("can the legal adviser address this specific objection?"); deliberations can be paused, returned to, re-opened with new evidence; the user can "appeal" a synthesis claim and re-deliberate it; deliberation history accumulates as case lore. Iterative analytical partnership, not single-shot oracle.

Plus three cross-cutting capabilities that elevate the whole experience:

6. **Live signal monitoring** — VIEWS forecasts and UCDP events flow into the workbench in near-real-time (per pack 17), with notifications when signals shift meaningfully on the user's active cases.

7. **The 60-second wow flow, finally green** — the demo→signup→first-memo flow runs end-to-end consistently (this depends on Pack 18 R7 + R10 having shipped). A new user produces their first DOCX within 90 seconds of signing in.

8. **Trust + governance surface** — explainability mode visible on every output, audit-trail export self-service, C2PA content credentials embedded in every memo export, transparency cards on every tool. The user can answer their organization's compliance questions without opening a ticket.

After this pack, opening PRAXIS at 9:14am with a cabinet brief due at noon feels different from opening any other tool the user has. The opening is faster. The context compounds. The tools produce trustworthy specialist outputs. The boardroom convenes when the user wants depth. The memo lands in cabinet at 11:48 with proper provenance and a signed cover page. The workflow ends cleanly. The user comes back tomorrow.

---

## 1. Outcomes

| # | Outcome | Verification |
|---|---|---|
| 1 | "Situation Genesis" flow: type a sentence, paste a URL, or drop PDFs → 90s later have a populated case (Frame + ontology + initial actors + initial events + suggested next action) | E2E `tests/e2e/onboarding/situation-genesis.spec.ts` runs 5x with median wall-clock ≤ 90s |
| 2 | Workspace guidelines auto-apply to every case in the workspace; user preferences propagate into every tool invocation; case-fork action visible | Manual smoke + `tests/e2e/workspace/preference-propagation.spec.ts` |
| 3 | Evidence drawer on every tool output: one-click reveals graph nodes cited, source documents quoted, subagent reasoning steps | `tests/e2e/workbench/evidence-drawer.spec.ts` |
| 4 | Output diffing: compare two runs of the same tool; semantic + visual diff highlighting changes | UI snapshot test; manual review on 3 sample tool runs |
| 5 | Memo enhancements: branded headers, signed cover pages, redaction layers, version milestones, comparison view, submit-for-review workflow | `tests/e2e/workbench/memo-enhancements.spec.ts` |
| 6 | Boardroom interventions: pause-resume, mid-deliberation question injection, claim appeal + re-deliberation | `tests/e2e/workbench/boardroom-intervention.spec.ts` |
| 7 | Live signal panel in workbench: VIEWS month-over-month delta + UCDP last-7-day event count surface as a notification badge on the case shell | Manual smoke against Sudan-region test case |
| 8 | 60-second wow flow green for 10 consecutive runs in CI | `tests/e2e/onboarding/60-second-wow.spec.ts` runs 10x consecutively, all pass |
| 9 | Explainability mode: every tool output has "How was this generated?" view showing prompts, models, costs, citations | `tests/e2e/trust/explainability.spec.ts` |
| 10 | Audit-trail export: user-initiated download of all activity in a case as JSON or CSV; cryptographically signed | Self-service flow tested; signature verifies |
| 11 | C2PA content credentials embedded in every memo DOCX export | C2PA chain verifiable in the exported file |
| 12 | Transparency cards on every tool's "About" panel: methodology + limitations + evaluation metrics + expected error modes | All 22 tool About panels updated |
| 13 | Two new ADRs: 0030 (Situation Genesis flow), 0031 (Boardroom intervention pattern) | ADRs reviewed and merged |

---

## 2. Pre-work confirmation note

> I am Codex. I have read pack 19. I understand:
> 1. **This pack is post-v1.0.0.** Pack 18 must be tagged before this pack starts. Subagents must be live on Agent Engine. Specialist handlers must be shipped.
> 2. **The five organizing themes** (effortless creation, compounding context, trustworthy outputs, briefing-grade memos, iterative boardroom) drive the prompt structure. Each theme has 1-3 prompts.
> 3. **The 60-second wow flow is the integration test.** A new user signing up at 9:14am should produce their first DOCX by 9:15:30am. If any prompt's implementation makes that flow slower, it goes back for revision.
> 4. **No new ontologies, no new ACO primitives, no new context layers.** This pack works inside the existing substrate.
> 5. **All architecture invariants from the bible (§3) hold.** ACO substrate unchanged. Four-layer context unchanged. ContextProvider-only access. Symbolic firewall enforced.
> 6. **Persona CI green streak resets if any prompt regresses.** Final gate: 10 consecutive green runs after this pack merges.
>
> Open questions for Giulio:
> - **Q1**: Situation Genesis — propose a backend service `genesis_orchestrator.py` that runs ingestion + ontology classification + initial graph extraction in parallel via Cloud Tasks fan-out, with a websocket/SSE stream to the UI showing per-step progress. Acceptable, or different orchestration approach?
> - **Q2**: Live signal panel — propose: signals surface as soft notifications (a small badge with count) on the case-shell sidebar, never as modal interruptions. User opens the panel to see specifics. Acceptable?
> - **Q3**: Boardroom intervention — propose: while a deliberation is in_progress, the user can type a question into a "Inject question" field; the Moderator subagent picks it up at the next round boundary; if the user types "Pause", the moderator finishes the current contribution and waits for resume. Acceptable, or simpler model (e.g., only pause/resume, no question injection)?
> - **Q4**: Memo redaction layers — propose: a memo can have multiple redaction levels (`public`, `internal`, `restricted`); each block tagged with required level; export filters blocks by level. Acceptable, or simpler binary (public/restricted)?
> - **Q5**: Explainability mode — propose: a slide-out panel from the right edge showing the structured "how this was generated" view. Available on every tool output, every memo block, every boardroom contribution. Acceptable?

Wait for answers before proceeding.

---

## 3. Pack overview

| Prompt | Outcome | Theme | Est. hrs |
|---|---|---|---:|
| S1 | Situation Genesis flow: parallel ingestion + ontology + actor extraction + suggested action; 90s end-to-end | Effortless creation | 14 |
| S2 | Workspace guideline auto-application + preference propagation + case-fork | Compounding context | 8 |
| S3 | Evidence drawer + output diffing + claim-challenge view | Trustworthy outputs | 10 |
| S4 | Memo enhancements: branded headers, cover pages, redaction layers, version milestones, comparison view, submit-for-review | Briefing-grade memos | 14 |
| S5 | Boardroom intervention: pause-resume, mid-deliberation question injection, claim appeal + re-deliberation, deliberation history as case lore | Iterative boardroom | 12 |
| S6 | Live signal panel: VIEWS + UCDP signals as notification badges on case shell | Cross-cutting | 6 |
| S7 | 60-second wow flow green for 10 consecutive runs | Cross-cutting | 5 |
| S8 | Explainability mode + audit-trail export + C2PA content credentials | Trust + governance | 10 |
| S9 | Transparency cards + tool About panels updated | Trust + governance | 4 |
| S10 | Final integration: persona suites green for 10 runs; performance budgets validated | Final gate | 12 |
| **Total** | | | **~95** |

---

## 4. Hard rules

- **Effortless creation never bypasses the firewall.** Even auto-extracted candidates from Situation Genesis go through the symbolic firewall and the review queue. The user accepts before anything lands as a Verdict-layer claim.
- **Compounding context respects owner scoping.** Workspace guidelines from user A never bleed into user B's cases. Tested with a cross-user fixture.
- **Output trust depends on provenance.** Every claim displayed in the workbench links to the graph node that supports it; if no support exists, the claim is rendered with a "weak source" indicator.
- **Briefing-grade memos preserve audit history.** Every memo edit is timestamped, attributable to a user action, and exportable. Redaction is additive, not destructive.
- **Boardroom intervention preserves the cost ceiling.** The Moderator subagent's $1.50 ceiling is per-deliberation total, not per-resume; appeals to a synthesis claim consume that budget too.
- **Live signals never auto-mutate the graph.** Signals are advisory; they appear as notifications; the user opens the review queue to act on them.
- **The 60-second wow flow is non-negotiable.** Any prompt's implementation that adds wall-clock to that flow needs a tradeoff justification.
- **All prior invariants from packs 03-18 hold.**

---

## 5. Prompt S1 — Situation Genesis flow

### Persona
Senior frontend + orchestration engineer. Knows that the activation barrier is the highest-leverage thing to fix and that the user does not care how the flow works internally — only that 90 seconds after typing a sentence, they have something they can work with.

### Phase 1 — Read & report

- Walk the current "create new case" flow as a brand-new user. Time it. Note every dead end, every "now what" moment, every empty state.
- Inventory existing ingestion pipeline (cloud_functions/on_document_uploaded), ontology classifier (backend/agents — confirm if real or stub), and actor-extraction logic.
- Output `docs/audits/2026-NN-NN-SITUATION_GENESIS_BASELINE.md` with the current flow's wall-clock breakdown.

### Phase 2 — Propose & confirm

The flow:

```
User clicks "New case"
  ↓
Modal: 3 input modes
  - "Describe the situation"  (natural-language sentence)
  - "Paste URL"               (web page or document URL)
  - "Drop PDFs"               (folder of PDFs)
  ↓
User chooses one + provides input
  ↓
[Backend, parallel via Cloud Tasks fan-out]
  Track 1: Frame extraction      (gemini-3-flash, 5-10s)
  Track 2: Ontology classification (gemini-2.5-flash-lite, 2-5s)
  Track 3: Actor extraction      (context_preparer subagent, 8-15s)
  Track 4: Event timeline seeding (gemini-3-flash, 5-10s)
  ↓
[Frontend, SSE stream]
  Live progress bar showing each track's status
  Each track lands in graph as it completes (review queue)
  ↓
[After all 4 tracks complete]
  Workbench opens with populated case
  Top banner: "We did initial work — review and adjust"
  "Run a coalition map?" suggested next action
  ↓
Total wall-clock budget: 90s P50, 120s P95
```

Wait for sign-off, especially on:
- Whether all four tracks always run, or user can opt to "minimal start" (just Frame + ontology, fastest path).
- Whether the 90s wall-clock is acceptable or needs to be pushed lower (e.g., partial workbench renders within 30s, full population within 90s).

### Phase 3 — Execute

- Backend: `backend/services/genesis_orchestrator.py` with Cloud Tasks fan-out, SSE progress channel.
- Frontend: `src/app/app/situations/new/page.tsx` — three-mode modal, progress UI, transition to workbench.
- Each of the four tracks gets a clean handler in `backend/services/genesis/`.
- Review queue integration: extracted candidates land in queue with `source.kind='situation-genesis'`.
- E2E test: `tests/e2e/onboarding/situation-genesis.spec.ts`.

### Phase 4 — Verify

- Run the test 5x; median wall-clock ≤ 90s, P95 ≤ 120s.
- Manual smoke: type "Sudan ceasefire monitoring July 2026" → wait 90s → workbench has 5+ actors, 10+ events, mediation ontology selected, suggested action visible.

---

## 6. Prompt S2 — Workspace guideline auto-application + preference propagation + case-fork

### Persona
Backend engineer. Knows that the difference between "the user typed it once" and "the user types it every time" is whether the workspace layer actually does its job.

### Phase 2 — Propose & confirm

Three changes:

**(a) Auto-application**: when the user uploads a methodology guide to their workspace (e.g., "Harvard PON principled negotiation primer"), the guide auto-applies to every case in the workspace whose ontology matches (mediation in this example). The user does not re-upload.

**(b) Preference propagation**: the user's `preferences.communicationStyle` already exists in UserContext. Verify it propagates into every tool invocation's prompt assembly (the `output_refiner` subagent already consumes it; check that every other tool that produces user-facing prose does too).

**(c) Case-fork**: a "Fork this case" action on any existing case copies the graph subset selected by the user (or full graph by default), preserves provenance with `forked_from: original_case_id`, opens new case in workbench with a header indicating the fork.

Wait for sign-off.

### Phase 3 — Execute

- For (a): extend `backend/services/case_frame.py` to auto-attach matching workspace guidelines on case creation.
- For (b): AST audit to verify every tool handler reads `userContext.preferences.communicationStyle` (or accepts a documented exemption). Failed handlers get the read added.
- For (c): new API route `POST /v1/cases/{caseId}/fork` + UI button in workbench overflow menu + provenance preserved.

### Phase 4 — Verify

- Upload a guide to workspace; create new case; verify guide is referenced in retrieval.
- Change communication style preference; run any tool; verify output style adapts.
- Fork a case; verify graph subset copied with provenance; original untouched.

---

## 7. Prompt S3 — Evidence drawer + output diffing + claim challenge

### Persona
Frontend engineer + product designer. Knows that the trust the user develops in the system is built on whether they can trace any claim back to its source in three clicks or less.

### Outcome

Three closely-related surfaces:

**(a) Evidence drawer**: a slide-out panel from the right edge of any tool-output view. Shows: the citations rendered in-place in the output, expanded with full quoted excerpts; the graph nodes cited (clickable to open in graph viewer); the prompts and model calls (collapsed by default; the "Explainability mode" deep dive). Available on every tool output, memo block, and boardroom contribution.

**(b) Output diffing**: when a tool has been run more than once on the same case, "Compare runs" shows a side-by-side or unified diff. Semantic diff (which claims changed?) plus visual diff (which prose changed?). Highlights additions/removals/modifications.

**(c) Claim challenge**: each structured claim in any output has a "Challenge this" action. Opens a modal: "Why do you think this is wrong?" → user types reason → the originating tool/subagent re-runs with the challenge as additional context, producing a response that either revises or defends the claim. Both versions retained in run history.

### Files to create

- `src/components/evidence/EvidenceDrawer.tsx`.
- `src/components/evidence/RunDiff.tsx`.
- `src/components/evidence/ClaimChallengeModal.tsx`.
- API: `POST /v1/runs/{runId}/challenge` re-runs originating tool with challenge context.
- E2E tests for each.

### Verification

- Open any tool output → click any cited node → see it in graph viewer.
- Run a tool twice → compare → diff visible.
- Challenge a claim → re-run produces revised or defended version → both visible in history.

---

## 8. Prompt S4 — Memo enhancements (briefing-grade)

### Persona
Document-engineering specialist. Knows that the difference between a memo that goes in the binder and one that stays in the drafts folder is the polish.

### Phase 2 — Propose & confirm

Five enhancements:

**(a) Branded headers + cover pages**: workspace setting for organization branding (logo, color, header/footer template). Cover page generated automatically with title, author, date, classification, distribution list, version.

**(b) Redaction layers**: each block tagged with required level (`public` / `internal` / `restricted`). Export modal asks "for which audience?" and filters blocks accordingly. Redacted blocks render as "[REDACTED]" with reason.

**(c) Version milestones**: user can mark a version as "Draft for review", "Approved", "Final, sent". Each milestone is immutable (subsequent edits fork a new version). Version history view shows the milestone chain.

**(d) Comparison view**: between any two versions of a memo, side-by-side or unified diff at block level.

**(e) Submit-for-review workflow**: user submits a draft to a designated reviewer; reviewer sees in their inbox; can approve/comment/reject; status reflected on the memo. Inbox = Firestore subcollection `users/{uid}/review-inbox`.

Wait for sign-off, especially on:
- Whether redaction is binary (public/restricted) or three-level (public/internal/restricted).
- Whether reviewer must be a workspace member (multi-tenant) or can be invited externally (significantly more complex).

### Phase 3 — Execute

- Memo schema extension: per-block `redactionLevel`, per-version `milestone`, `submitForReview` lifecycle.
- DOCX export: brand template + redaction filter + version stamp.
- UI: cover-page editor, redaction picker per block, milestone timeline, comparison view, submit-for-review CTA.

### Phase 4 — Verify

- Memo with mixed redaction levels exports correctly per audience.
- Approved version is immutable; subsequent edits fork.
- Reviewer flow round-trip works.

---

## 9. Prompt S5 — Boardroom intervention + iterative deliberation

### Persona
Multi-agent systems engineer + UX engineer. Knows that the value of the boardroom doubles when the user can shape the discussion in flight.

### Outcome

Four interventions:

**(a) Pause/Resume**: while deliberation is in_progress, "Pause" finishes the current contribution and waits. "Resume" continues from where it stopped. Cost budget preserved across pauses.

**(b) Inject question**: a "Ask the room" input field while in_progress. Submitted question is queued for the Moderator at the next round boundary; the Moderator routes it to the most relevant persona (or all, depending on phrasing).

**(c) Appeal a synthesis claim**: after deliberation closes, the user can challenge any synthesis claim. Re-opens a small re-deliberation: 2 rounds, focused only on the challenged claim, persona subset chosen by Moderator. Result either upholds or revises the claim.

**(d) Deliberation history as case lore**: all past deliberations on a case render as a chronological "boardroom history" tab; insights from past deliberations available as retrievable context for new deliberations on the same case (the synthesis-lead persona can cite "in our deliberation of 2026-08-15, we concluded…").

### Files to create

- `src/components/boardroom/InterventionPanel.tsx`.
- `src/components/boardroom/AppealClaimModal.tsx`.
- `src/components/boardroom/DeliberationHistoryTab.tsx`.
- API: pause/resume/inject endpoints on `/v1/cases/{caseId}/deliberations/{id}`.
- Backend: extend `moderator` subagent state machine to support pause + inject; extend its eval set with intervention cases.
- Backend: `backend/services/deliberation_history.py` for retrievable past deliberations.

### Verification

- Pause-resume preserves state across 30+ minute gap.
- Injected question appears in next round.
- Appeal of a claim produces a revised or defended response with traceable reasoning.
- Past deliberation cited in a new one (by synthesis lead).

---

## 10. Prompt S6 — Live signal panel

### Persona
Frontend + integration engineer. Knows that signals must inform without interrupting.

### Outcome

A signal-monitoring panel surfaces in the case shell:

- Small badge on case shell sidebar with count of new signals since last view.
- Panel opens to show: VIEWS month-over-month delta (green/yellow/red); UCDP last-7-day event count + breakdown by violence type; any meaningful change since user's last visit.
- Click any signal: opens the relevant review-queue item or graph node.

Implementation reuses pack 17's VIEWS + UCDP integrations. Panel polls signal state on case open; backend computes deltas.

### Files

- `src/components/workbench/SignalPanel.tsx`.
- Backend: `backend/services/signal_aggregator.py`.
- E2E: signals appear, click flows to review queue.

---

## 11. Prompt S7 — 60-second wow flow green

### Persona
Release engineer + UX engineer. Earns the activation metric.

### Outcome

The 60-second wow flow runs green for 10 consecutive CI runs:

```
Sign in (magic link)
  → onboarding role question (one tap)
  → sample case opens (Northwind for mediator role; Syria-2024 for diplomat)
  → "Let's draft your first memo" (auto-pop from template)
  → DOCX downloads
  → confetti
```

Total wall-clock target: ≤ 90s.

This depends on Pack 18 R7 + R10 having shipped. This pack just ensures it remains green and refines any rough edges.

### Files

- `tests/e2e/onboarding/60-second-wow.spec.ts` — green for 10 consecutive runs.
- Refinements to onboarding components based on iteration.

---

## 12. Prompt S8 — Explainability mode + audit-trail export + C2PA

### Persona
Trust + governance engineer. Pre-empts compliance questions.

### Outcome

**(a) Explainability mode**: a slide-out panel from the right edge of any output. Shows:
  - The full prompt(s) sent to the model (sanitized of secrets).
  - The model identifier(s) used.
  - The token counts and cost.
  - The citations and their source documents/nodes.
  - The subagent invocation chain (if any).
  - The exact firewall validations applied.

Available on every tool output, every memo block, every boardroom contribution.

**(b) Audit-trail export**: from `/app/admin` (or `/app/settings/data`), the user can request "Export all activity for case X" or "Export all activity for last 30 days." Generates a signed JSON or CSV with every read, every write, every tool run, every export. Cryptographic signature (HMAC) verifies tampering.

**(c) C2PA content credentials**: every memo DOCX export embeds a C2PA chain claiming PRAXIS as the producer, listing the AI-assisted blocks, the models used, the date. Receiver can verify.

### Files

- `src/components/trust/ExplainabilityPanel.tsx`.
- `src/app/app/settings/data/page.tsx` — audit export self-service.
- `backend/services/audit_export.py` — signed export.
- `backend/services/memo_export/c2pa.py` — C2PA chain embedding.

### Verification

- Open any output → explainability panel renders complete chain.
- Export audit trail → signature verifies.
- Memo export → C2PA chain readable by C2PA verifier tools.

---

## 13. Prompt S9 — Transparency cards on tool About panels

### Persona
Documentation engineer.

### Outcome

Each of the 22 tools (16 + 4 SAT + 2 memo) gets an updated "About" panel rendering its SKILL.md `Methodology + limitations` section, plus:
- Evaluation metrics (pass rate from latest eval).
- Expected error modes (from SKILL.md).
- Last updated date.
- Cost class.

### Files

- `src/components/tools/ToolAboutPanel.tsx`.
- All 22 SKILL.md files extended with the canonical structure.

---

## 14. Prompt S10 — Final integration + persona green streak + performance budgets

### Persona
Release engineer.

### Outcome

After all prior prompts:
- Persona suites green for 10 consecutive runs (counter resets if any prior prompt regresses).
- Performance budgets validated: Lighthouse ≥ 92 desktop on landing/demo/workbench; bundle budgets met; per-tool latency P95 within `estimatedRuntimeMs * 1.5`.
- Integration smoke: full 9:14am-to-11:48am workflow simulation:
  - 9:14am: open PRAXIS, create new case via Situation Genesis on a sample situation.
  - 9:18am: run 3 specialist tools, inspect evidence drawer.
  - 9:30am: convene boardroom, 5 personas, 4 rounds.
  - 9:50am: review boardroom synthesis, accept 3 claims through review queue.
  - 10:00am: open memo studio, auto-populate Country Brief template.
  - 10:30am: edit memo, mark version "Draft for review."
  - 11:00am: explainability check on a contested claim.
  - 11:30am: export memo with C2PA, branded cover page.
  - 11:48am: done.
- Tag `v1.1.0`.

---

## 15. Final verification gate

```bash
# Foundations
npm run typecheck
npm run lint
npm run test
pytest backend/ -q
mypy backend/ --strict

# Pack-19-specific
npm run audit:situation-genesis-fresh    # NEW: orchestrator deployed and running
npm run audit:workspace-propagation       # NEW: AST verifies guideline auto-attach
npm run audit:transparency-cards          # NEW: every tool About panel populated
npm run audit:c2pa-on-export              # NEW: every memo DOCX has C2PA chain

# All prior gates
npm run audit:gate

# Persona suites — production bar
npm run test:e2e:personas   # 10 consecutive green

# Pack-specific E2E
npx playwright test tests/e2e/onboarding/situation-genesis.spec.ts
npx playwright test tests/e2e/onboarding/60-second-wow.spec.ts
npx playwright test tests/e2e/workbench/evidence-drawer.spec.ts
npx playwright test tests/e2e/workbench/memo-enhancements.spec.ts
npx playwright test tests/e2e/workbench/boardroom-intervention.spec.ts
npx playwright test tests/e2e/trust/explainability.spec.ts

# Performance
npm run lh:ci
npm run audit:bundle-budgets
npm run audit:tool-perf-budgets

# Tag
git tag v1.1.0
```

All exit 0. Ten green persona runs. PRAXIS v1.1.0 ships.

---

## 16. Out of scope

- Multi-tenant teams — v2.
- Real-time collaboration on memos — v2.
- Custom ontology authoring — v2.
- Voice deliberation in the boardroom — v2.
- Mobile-first UI — v2.
- White-label deployment — v3.

---

## 17. Closing note

Pack 19 is the pack that makes PRAXIS the workbench the FCDO desk officer opens at 9:14am on a Tuesday. v1.0 (after pack 18) makes the architecture honest. v1.1 makes the experience genuinely useful. The five themes — effortless creation, compounding context, trustworthy outputs, briefing-grade memos, iterative boardroom — are not features individually; they are the integration of dozens of small affordances that respect the user's time. After this pack ships, the time-to-first-memo for a brand-new user is under 90 seconds. The time to a complete cabinet-grade brief is under three hours. The user comes back the next morning.

The architectural cost is small. No new ontologies, no new ACO primitives, no new context layers. The substrate doesn't change. The bible's invariants hold without exception.

Branch: `feature/genuinely-useful`. Commit prefix `useful(<area>): <prompt-id> <description>`. PR titled `Pack 19 — Make PRAXIS Genuinely Useful`.

After merge, tag `v1.1.0`. Begin v1.2 from the roadmap (multi-region, additional SAT depth, advanced OSINT verification).

---

**File path**: `C:\Users\giuli\Downloads\PRAXIS_CODEX_19_GENUINELY_USEFUL.md`
