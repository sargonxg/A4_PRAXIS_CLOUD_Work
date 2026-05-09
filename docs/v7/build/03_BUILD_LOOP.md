# BUILD LOOP

> **Path:** `docs/v7/build/03_BUILD_LOOP.md`
> **What this is:** the execution playbook for Codex. How to actually
> build the simplified surface (docs 01 and 02), with the AI / Vertex /
> Firebase / Postgres infrastructure wired correctly behind it, in a
> tight iterative loop that catches drift before it lands.
> **Read alongside:** `docs/v7/AGENTS.md` (the contract), the strategic
> briefs in `docs/v7/00..04`, and the visual specs in `01_THE_NEW_FACE.md`
> and `02_CORES_INLINE.md`.

---

## The mission, restated

> Build a simplified PRAXIS where an analyst opens a single page, attaches
> the cores that frame their work, asks PRAXIS a question, and gets cited,
> decision-grade output. Keep every existing capability — 57 skills,
> 7 subagents, 9 ontologies, 8 ACO primitives, 4 truth layers, the audit
> wall, owner scoping, Vertex isolation, Cognee optionality — invisible
> but intact. The product is for top-tier policy and conflict analysis.
> The product fails if it loses provenance, owner scoping, or honesty.

That's the mission. Every PR is judged against it.

---

## The seven build loops, in order

Each loop is one PR against `main` behind the v7 feature flag, ≤ 600 LOC, with the audit gate green.

```
Loop A · Foundations         (cores schema, types, flag, audits stubs)
Loop B · The new homepage    (Ask bar + cores strip + tools, stub responses)
Loop C · The new Ask surface (real routing, real citations, real outputs)
Loop D · The new landing     (5 sections, archive the rest)
Loop E · User Core inline    (drawer for My Core, autosave)
Loop F · Situation Core inline (drawer + create + fork)
Loop G · Cores rail + share  (drag-drop, share dialog, defaults)
```

Loop A is a hard prerequisite for E/F/G. Loops B/C/D ship in parallel with A as the schema isn't blocking on visual progress. After Loop G, the v7 surface is complete and ready for cutover.

The default order is A → B → C → D → E → F → G, but A and D can run in parallel (D doesn't depend on cores). E/F/G are strictly sequential.

---

## Loop A — Foundations

**What ships:** Postgres tables for cores, TypeScript + Pydantic types for cores, the `NEXT_PUBLIC_PRAXIS_V7` and `PRAXIS_V7_BACKEND` flags, audit stubs.

**Files added:**
- `backend/migrations/versions/0019_cores_baseline.py` — `cores`, `core_grants`, `core_audit` (per Brief 02 §2). Reversible downgrade. Tested on ephemeral Postgres.
- `backend/migrations/versions/0020_cores_linkage.py` — nullable `core_id uuid` columns on the existing tables (`situations`, `source_receipts`, `documents`, `graph_nodes`, `graph_edges`, `memos`, `drafts`, `boardroom_briefings`, `recipe_runs`, `research_threads`).
- `src/lib/cores/types/` — Zod schemas for all 8 core kinds (per Brief 03 §3).
- `backend/services/cores/types/` — Pydantic mirrors. **Same field names, same constraints.** A drift here breaks `audit:cores-types-parity`.
- `next.config.ts` and `backend/config.py` — the two flags, both default `false`.
- `scripts/audit-cores-schema.ts` — checks the three tables exist with the required columns.
- `scripts/audit-cores-types-parity.ts` — checks every TS Zod schema has a matching Pydantic model.
- `scripts/audit-cores-owner-scoping.ts` — stub for now (real assertions in Loop C/E/F).
- All three audits wired into `npm run audit:gate` via `scripts/audit-architecture-chain.ts`.

**Files NOT touched:** any UI, any router, `cloudbuild.yaml`, Firestore rules, ontologies, model selection.

**Acceptance:**
- [ ] Migrations apply cleanly on ephemeral Postgres in CI.
- [ ] Migrations downgrade cleanly.
- [ ] `audit:cores-schema` green.
- [ ] `audit:cores-types-parity` green.
- [ ] All other audits stay green.
- [ ] `npm run build` clean with the flag both off and on.

**Why this is first:** without the schema and types, every later loop has to mock cores. With them, every later loop wires real data to real chips. One PR's worth of foundation prevents 6 PRs of mocking.

---

## Loop B — The new homepage

**What ships:** `/app/home` with the Ask bar, cores strip (using real User Core + Situation Core data), tools strip, and the gaps + recent right column. Submitting the Ask bar opens `/app/ask/{newId}` with a stub stream response.

**Files added or rewritten:**
- `src/app/app/home/page.tsx` — the new homepage (mounted only when v7 flag is on).
- `src/app/app/home/layout.tsx` — minimal layout wrapping the new shell.
- `src/components/v7/ask-bar.tsx` — the multiline input with mode strip.
- `src/components/v7/cores-strip.tsx` — the chip row above the Ask bar.
- `src/components/v7/tools-strip.tsx` — the four tool cards.
- `src/components/v7/cores-rail.tsx` — the slim left rail.
- `src/components/v7/header-v7.tsx` — the simplified header with workspace pill and ⌘K.
- `src/lib/v7/use-active-situation.ts` — hook that resolves the active situation from the user's last-used core.
- `scripts/audit-v7-home-shape.ts` — verifies the homepage renders the expected components.

**Files moved (not deleted):**
- The legacy dashboard at `src/app/app/dashboard/` redirects to `/app/home` when the flag is on. Keep the old code path live behind `?legacy=1` for one release cycle.

**Backend wiring (real, no mocks except for the response stream):**
- `GET /cores/me` returns the User Core (synthesize from existing user profile + workspace until Loop E backfills properly).
- `GET /cores?kind=situation&owner=me` returns the user's situations.
- `POST /ask` (stub for this loop): accepts query + cores, returns a streamed "Stub: you asked X about Situation Y with cores [...]" response. Real routing in Loop C.

**Acceptance:**
- [ ] Homepage renders per `01_THE_NEW_FACE.md` Loop 1 visual spec.
- [ ] The cores strip shows a real User Core chip and a real Situation Core chip.
- [ ] Submitting the Ask bar streams a stub response and lands the user on `/app/ask/{id}`.
- [ ] Mobile at 380px works.
- [ ] Lighthouse perf ≥ 85 on slow 4G.
- [ ] `audit:gate` green including the new `audit:v7-home-shape`.
- [ ] Legacy dashboard reachable at `/app/dashboard?legacy=1` (smoke check).

---

## Loop C — The new Ask surface, real routing

**What ships:** `/app/ask/[threadId]` with real Vertex routing, real citations, real mode behaviours, mutation cards, promote-to-output.

**Files added:**
- `src/app/app/ask/[threadId]/page.tsx` — the conversation view.
- `src/components/v7/ask-thread.tsx` — message list + streaming.
- `src/components/v7/ask-rail.tsx` — right rail (suggested next, likely skills, save as).
- `backend/routers/ask.py` — `POST /ask`, `GET /ask/threads/{id}`, `POST /ask/threads/{id}/promote` (per Brief 02 §4).
- `backend/services/ask/router.py` — the routing layer (intent → ontology → cores → skill rank).
- `backend/migrations/versions/0022_ask_threads.py` — `ask_threads`, `ask_messages`, `ask_message_citations`. Owner-scoped.

**Routing layer behaviour (per Brief 04 §3):**
1. Resolve attached cores (User Core implicit, Situation Core from request, plus user-attached extras).
2. Build the four-layer calibration block via the existing `withCalibration` contract — **do not invent a new contract**.
3. Classify intent (`answer | structure | validate | compare | monitor | draft | plan | extract | match | simulate`).
4. Filter skills by ontology + tier + cores compatibility.
5. Rank top 3 candidates; default to the top one or emit a `clarify` action with button choices when the spread is tight.
6. For destructive actions (writes to graph, mutations) emit a `MutationConfirmCard` rather than executing.
7. Stream tokens, then citations, then mutation cards.

**Vertex isolation (non-negotiable):**
- All AI calls go through the existing Vertex client in `src/lib/ai/`.
- Model strings come from the existing model matrix; no literal strings in new code.
- `audit:ai-provider-vertex-default` and `audit:ai-provider-isolation` stay green.
- The Quick mode uses the cheapest model; Deep / Memo use the richer model. Choice is logged.

**Acceptance:**
- [ ] Ask conversations persist (refresh keeps thread).
- [ ] Citations are clickable; click opens the source receipt or graph node popover.
- [ ] Modes change behaviour (Quick = single pass, Deep = multi-step, Plan = checklist, Memo/Brief = output draft).
- [ ] Slash commands open the skill picker; selection locks a skill.
- [ ] Promote-to-output creates a real output entry.
- [ ] Mutation cards confirm before writing to graph.
- [ ] No direct OpenAI/Anthropic SDK imports added.
- [ ] `audit:ai-provider-isolation`, `audit:hero-tool-calibration-coverage`, `audit:cores-owner-scoping` all green.
- [ ] `audit:ask-thread-shape` (new): every Ask request writes one thread, one message, zero or more citation rows.

---

## Loop D — The new landing

**What ships:** the public landing page collapsed to five sections per `01_THE_NEW_FACE.md` Loop 3.

**Files modified or moved:**
- `src/app/(landing)/page.tsx` — renders the five sections in order.
- Components archived to `src/components/landing/_archive/`: `dialectica-firewall-demo.tsx`, `dialectica-graph-3d.tsx`, `dialectica.tsx`, `methodology-section.tsx`, `problem-section.tsx`, `security-section.tsx`, `syria-case-proof.tsx`, `hero-narrative-layers/`, `hero-quadrant-tour.tsx`, `pricing-teaser.tsx`, `agentic-app-section.tsx`, `conflict-grammar-highlight.tsx`, `features.tsx`. **Move, don't delete.**
- `src/components/landing/hero.tsx` — sharpened headline, sub-line, single CTA.
- `src/components/landing/how-it-works.tsx` — five panels.
- `src/components/landing/example-cases-gallery.tsx` and `example-cases-modal.tsx` — Syria, US housing California, workplace mediation. Click opens guest-mode session.
- `src/components/landing/grounding-backbone.tsx` — Trust & evidence section.
- `src/components/landing/built-for.tsx` — five role pictograms.
- `src/components/landing/footer.tsx` — minimal.

**Guest mode for the demo CTA:** clicking "Try the demo" hits `/app/home?demo=syria&guest=1`. The middleware allows guest sessions for 5 minutes (existing demo posture); after that, a soft sign-in prompt appears.

**Acceptance:**
- [ ] Five sections in order, no others above the footer.
- [ ] Hero CTA opens demo Situation in guest mode.
- [ ] Lighthouse perf ≥ 85.
- [ ] `audit:landing-five-sections` (new) green.
- [ ] `audit:landing-bundle` and `audit:legal-pages-present` green.
- [ ] Mobile renders cleanly at 380px.

---

## Loops E, F, G — Cores inline (per `02_CORES_INLINE.md`)

These three loops follow `02_CORES_INLINE.md` exactly. Each one is its own PR. Each one adds one of three audits: `audit:core-editor-coverage`, `audit:cores-fork-integrity`, `audit:cores-grants-coverage`.

The acceptance criteria for E/F/G are listed in `02_CORES_INLINE.md`. Codex follows that doc as the spec for these loops.

After Loop G:
- The user can do every core operation (edit User, edit Situation, create, fork, share, attach) without leaving the homepage.
- All audits added by E/F/G are green.
- `STATUS.md` says all seven loops shipped.

---

## The infrastructure that has to keep working

Every loop above is judged against this checklist. If any item regresses, the PR doesn't merge.

### Vertex AI / Gemini Enterprise

- All AI calls route through `src/lib/ai/` and Vertex clients only.
- No `import OpenAI from 'openai'` or `import Anthropic from '@anthropic-ai/sdk'` anywhere outside the existing allowlist.
- Model strings come from the model matrix in `docs/architecture/MODEL_SELECTION.md`.
- The four-layer calibration block (`<analyst-profile>`, `<situation>`, `<domain>`, `<skc>`) is used for every calibrated-AI tier skill.
- Cost ceilings from the User Core are respected.
- `audit:ai-provider-vertex-default`, `audit:ai-provider-isolation`, `audit:hero-tool-calibration-coverage`, `audit:model-matrix-coverage` — all stay green every loop.

### Firebase

- Auth: Firebase Auth (email/password + Google) — no swaps.
- Middleware checks the session cookie; demo mode allows 5-minute guest sessions.
- Firestore for user metadata; rules in `firestore.rules` enforce `request.auth.uid == uid` for personal docs.
- Cloud Storage for blobs; `storage.rules` mirror the same scoping.
- `audit:firestore-rules-shape` and `audit:storage-rules-shape` (existing) stay green.

### Postgres

- Primary KG store: Postgres + pgvector.
- Migrations applied via Alembic, gated by Cloud Build manual approval for prod.
- `audit:owner-scoping`, `audit:owner-scoping-runtime`, `audit:postgres-kg-contract` stay green.
- The new tables (`cores`, `core_grants`, `core_audit`, `ask_threads`, `ask_messages`, `ask_message_citations`) follow the same owner-scoping rules as existing tables.
- pgvector embeddings stay isolated per owner.

### Cognee (memory layer)

- Default off (`COGNEE_ENABLED=false`).
- The product works end-to-end with empty memory recall.
- When enabled, recall surfaces in the Ask response as candidate-only citations capped at 0.6 confidence; never auto-promoted.
- Cognee imports only inside `backend/services/cognee_memory.py`. `audit:cognee-isolation` stays green.
- The Cognee toggle lives under `/app/advanced/settings/memory`. UI honesty: "Memory: off" or "Memory: postgres-kuzu (5 fragments retrieved)" — never silent claims.
- `audit:cognee-ui-honesty` stays green.

### Ontologies

- 8 ACO primitives, 4 truth layers — locked. No new primitives or layers in v7.
- 9 domain ontologies — locked. No new ontologies in v7 except via the formal promotion workflow (deferred to v7.1).
- Per-Situation local subtype/relation extensions are allowed, scoped to the Situation Core's metadata.
- `audit:ontology`, `audit:ontology-mapping`, `audit:ontology-versions`, `audit:ontology-classifier-accuracy`, `audit:ontology-locked-primitives` (new) all stay green.

### Audits and the gate

The audit gate (`npm run audit:gate`) is the source of truth. Codex never weakens, skips, or marks-skip any audit without an explicit issue + ADR.

Each loop adds at most 2-3 new audits — no audit avalanches.

The full gate runs locally before every push:
```
npx tsc --noEmit
npm run lint
npm run build
npm run audit:gate
npx vitest run
```

Red gate never lands. If a flaky audit is genuinely flaky, mark it flaky in its file (with a comment + issue link), don't skip it.

### Deploy

`cloudbuild.yaml` (full pipeline) and `cloudbuild.frontend.yaml` (frontend-only) stay structurally the same. v7 changes their content:
- Run `alembic upgrade head` against prod Postgres in a manual-approval step before flipping the v7 flag.
- Add a smoke test against `POST /ask` after deploy.
- Re-apply `firestore.indexes.json` and `firestore.rules`.

Domain mapping (`praxis.tacitus.me` → `praxis-frontend`) is already set; no DNS changes.

---

## The iterative verify-build-fix-ship loop

This is the rhythm Codex runs at, every session, every loop:

```
                ┌──────────────────────┐
                │ 1. Read STATUS.md    │
                │    Read the brief    │
                │    Run the gate      │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │ 2. Pick the loop     │
                │    A → G in order    │
                │    or escalate       │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │ 3. Build, bounded    │
                │    ≤ 600 LOC, 1 PR   │
                │    Use subagents     │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │ 4. Self-verify       │
                │    AGENTS.md §4      │
                │    Run gate + flows  │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │ 5. Open PR + log     │
                │    STATUS.md update  │
                │    FIX_LOG.md entry  │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │ 6. Verify after merge│
                │    Run VERIFY prompt │
                │    Catch drift early │
                └──────────────────────┘
                           │
                           └──→ next loop
```

This is just `docs/v7/prompts/ADVANCE.md` and `docs/v7/prompts/VERIFY.md` operating as a pair, on the seven loops.

### Use the repo's own intelligence on the work

While building, invoke the analyst skills and subagents on the rewrite itself:

- **Before starting a loop:** `cross.assumption-mapper` on the loop's spec — what is this loop assuming about user behaviour, infra, or prior work?
- **Mid-build:** `cross.contradiction-finder` on your diff vs. the brief that owns the loop. Surfaces silent drift.
- **Before pushing:** `red-team-analyst` subagent on the loop's acceptance criteria. Looks for what could fail in production.
- **After merge:** `cross.devils-advocate` on the loop's "definition of done" — what claim is this PR making that's not yet proven?

If any of these skills aren't reachable from the dev environment, that's itself a finding — log it.

---

## Definition of "shipped" for the whole rewrite

The v7 rewrite is shipped when **all** of these are true:

- All seven loops (A–G) are merged to `main`.
- The v7 feature flag is on by default in production.
- The legacy shell is reachable at `/app/legacy/*` for one release cycle, then removed.
- A first-time user lands on `praxis.tacitus.me`, signs in, and reaches a working Home with one active Situation, an Ask bar, attached cores, and four tools — all in under five seconds.
- The user can ask a question, get a cited answer, fork the Situation, share it with a teammate, draft a memo, and export it — all in under five minutes.
- A second user joins the team, gets a shared core in their cores rail, and never sees private cores from the first user.
- All audits in `npm run audit:gate` are green for 7 consecutive days.
- Lighthouse perf ≥ 85 on landing and homepage.
- Cognee toggle works in both `disabled` and `postgres-kuzu` modes.
- Vertex isolation holds; no direct OpenAI/Anthropic SDK calls anywhere.
- Owner scoping holds; no cross-tenant leaks in any test.
- `STATUS.md` says `v7 shipped`.

If any of those is not true, the rewrite is not shipped.

---

## What good looks like at the end of every Codex session

1. A merged PR that closes one loop or advances the in-progress loop.
2. `STATUS.md` updated.
3. `FIX_LOG.md` updated.
4. A 3-bullet PR comment summarizing what shipped.
5. A specific suggested next loop or fix in the comment, with reasoning.

Never end a session in quiet uncertainty. Either ship, or escalate via `OPEN_QUESTIONS.md`, or stop with a clear blocker note.

---

## The non-negotiables

These are the things that, if violated, mean the PR is wrong even if it builds and looks good:

1. **Every claim in every output cites a source.** No naked AI text.
2. **Owner scoping holds on every new query.** No exceptions.
3. **Vertex routing only.** No direct external SDK calls.
4. **Candidate vs canonical preserved.** AI extractions are advisory until human-promoted.
5. **The 8 primitives + 4 layers are locked.** No additions in v7.
6. **The audit gate is the source of truth.** No silent skips.
7. **Cognee stays optional.** The product works with memory off.
8. **Drawer-first for cores.** No separate "Settings" page for the User Core.
9. **Two cores visible to the user (User + Situation).** The other six are tabs and back-end concepts.
10. **Honesty in copy.** "Memory: off" not "Smart memory enabled". "3 sources" not "many sources".

If any of these slips, the user's trust in PRAXIS as a serious analysis tool collapses. The product fails not on features but on truthfulness.

---

## A closing note on what we're really building

The product is for people doing real work on consequential cases — conflict analysis, policy decisions, mediation, sanctions, humanitarian access, human rights documentation. Their stakes are not "did the user click the button". Their stakes are "did this analysis hold up when challenged in a meeting with people whose decisions move money, policy, or lives".

PRAXIS earns its place at that table by being:

- **Simple to enter.** One page. One bar. Two cores.
- **Powerful behind the scenes.** Every skill, every ontology, every audit, every layer of provenance still working invisibly.
- **Honest about what it knows.** Citations. Candidate vs canonical. Memory state. Coverage gaps.
- **Owned by the user.** Their cores. Their situations. Their outputs. Their data.

Build to that bar. Hold the audits. Ship the loops in order. Verify after every merge.

The simplification is the product.
