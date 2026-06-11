# PRAXIS — Builder Handover (Architect Brief + CODEX Prompt Queue)

> Written 2026-06-11. Owner: Giulio Catanzariti. Audience: CODEX / Claude Code
> sessions doing heavy build work on `sargonxg/A4_PRAXIS_CLOUD_Work`.
> Read `CLAUDE.md` and `AGENTS.md` first — hard rules, validation gate, and
> deploy procedure live there and are not repeated here. This file says WHAT
> to build and WHY, at architect level, with sequenced prompts at the end.

---

## 1. The objective

PRAXIS must be the best possible AI workbench for policy analysis, research,
and briefing — and the differentiator is NOT the chat. It is the
**ContextCapsule**: a delimited, inspectable, reviewable context object that
captures what a capable human analyst carries in their head — sources, claims,
tacit constraints, ontology bindings, graph context, methods, and output
contracts. PRAXIS is "just" the workbench; the capsules are the product.
Think: **the Wikipedia of context for agents** — capsules are authored,
reviewed, forked, shared, and they make every generation measurably better
than a bare LLM chat.

The user-facing contract stays radically simple:

- A ChatGPT/Claude-grade conversation surface (Ask PRAXIS) with one tweak:
  the **Capsule Dock** — exactly four typed slots (User / Situation / Tool /
  Output) above the composer.
- Every answer is capsule-governed: RAG is encapsulated INSIDE the capsule
  (its source spine, retrieval policy, graph refs decide what gets read).
- Agentic runs are transparent: while working, the UI explains which agents
  are running (triage → research → extraction → sourceability review →
  red-team → approval gates) with receipts and a durable ledger.
- Every conversation and run has a unique shareable URL and shows up in the
  user's Recents.

## 2. Current state (verified shipped as of 2026-06-11)

- **Four-slot Capsule Dock** in `src/components/app/ask-context-bar.tsx`,
  backed by `buildCapsuleDockSlots` / `assignCapsuleToDockSlot` /
  `clearCapsuleDockSlot` in `src/lib/context/active-context-stack.ts`.
  Situation capsule governs the stack pointer; legacy refs land in overflow.
- **Dock-aware generation**: `resolveInjectableContext`
  (`src/lib/context/context-injection.ts`) loads all four docked capsules and
  injects a `[capsule_dock]` prompt layer with per-role contracts
  (situation→facts, user→voice, tool→method, output→format).
- **Boardroom capsule grounding**: `/api/boardroom/runs` compiles the dock
  into `metadata.contextInjectionPromptBlock`; the live runner prepends it to
  every board turn and synthesis. The boardroom sidebar shows the dock state.
- **Conversations**: unique URL pushed on first message
  (`tasklet-workbench-conversation.ts`), titles derived from the first user
  prompt (turns route), Recents list in the home sidebar
  (`praxis-chat-first-shell.tsx`, GET `/api/conversations`).
- **Agent runtime**: durable Postgres ledger (`agent_runs`, events, tool
  calls, approvals), Cloud Tasks dispatch, Firestore mirror, `/agents/{runId}`
  deep link into the shared cockpit.
- **Cleanup done**: 22 verifiably dead files removed (old stores, hooks,
  prompts, engines, mock auth, capsule-client) plus duplicate TierBadge.
- **/learn** explains PRAXIS-augmented generation (resolver, governed
  retrieval, checking agents, layered truth).

Deploys: push to `main` triggers `frontend-main-on-push` Cloud Build →
praxis.tacitus.me. Verify with `/api/health/runtime` (`build.commit`).

## 3. Architecture invariants (do not break)

1. **Capsule is canonical context.** No AI route may bypass capsule
   resolution (`withCalibration` + `resolveInjectableContext`). Outside
   knowledge is supplemental and must be labeled.
2. **Human review makes truth canonical.** Agents propose (review cards,
   graph proposals, source gaps); only human approval mutates a capsule.
3. **Four dock slots, one app surface.** No new primary pages or nav items.
   Ask, capsules, boardroom, memos, runs are panels of the one cockpit.
4. **Receipts everywhere.** Never claim a mutation without a runtime receipt.
   Every agent step lands in the Postgres ledger.
5. **Model strings only in `providers.ts` / `MODEL_MATRIX.json`.**
6. **DIALECTICA is the capsule factory upstream.** Capsules arriving from
   DIALECTICA carry ontology bindings, typed graphs, and claim ledgers; the
   PRAXIS import path (`CapsuleImportButton`, `/api/capsules` import) must
   preserve them losslessly and render them, never flatten them.

## 4. Workstream A — Make each capsule genuinely great (highest priority)

The capsule must capture knowledge the way a top human analyst would. Today's
starter catalog (205 capsules) is broad but shallow in places. Target shape
for EVERY capsule:

- **Identity & use case**: who uses it, for which decision, with what
  audience. One crisp paragraph, not boilerplate.
- **Human tacit knowledge**: the judgment calls, failure modes, red lines,
  and "what an expert would check first" — unique per capsule, never
  templated filler.
- **Source spine**: 5–12 real, current, tiered sources with receipts and a
  refresh cadence. Gaps stated explicitly.
- **Claim ledger**: the load-bearing claims with support posture
  (supported / partially / unsupported / disputed) and receipts.
- **Ontology binding + embedded graph**: bound to the right DIALECTICA/ACO
  ontologies (max 3 active), with a real typed mini-graph (actors, claims,
  events, interests, commitments) — this is what the repository constellation
  renders and what generation reads.
- **Agent operating contract**: allowed tools, forbidden actions, approval
  gates, output contracts.
- **Evaluation**: what "good output" looks like for this capsule; dry-run
  eval thresholds.

Build levers that already exist: Capsule Architect
(`src/lib/context/capsule-architect.ts`), quality audit + improvement
proposals (`proposeCapsuleImprovementsFromQualityAudit` in
`src/lib/product/context-capsules.ts`), review cards, dry-run eval route
(`/api/capsules/eval/dry-run`). Use them; do not invent a parallel schema
(hard rule from TODO.md).

## 5. Workstream B — Repository as the extensible capsule library

`/app/capsules` must feel like a living library: search, facets (type /
domain / policy team), one-click Add-to-dock per slot type, fork, import
(DIALECTICA), inspect (graph, ontology, claims, sources, tacit), health and
trust semaphores, marketplace lane. Extensibility rules:

- New capsule types/domains arrive via taxonomy tags (`type:*`, `domain:*`,
  `team:*`) and Firestore config — never hardcoded lists in components.
- Cards stay light (label, type chip, constellation, health, Add button);
  depth lives in Inspect.
- Every card action writes through the shared active-context-stack helpers —
  one dock, one truth.

## 6. Workstream C — Generation transparency and source attention

While an answer is being produced the user should see, in plain language,
what is happening: which agent is active, what it read, what it found, what
was checked. The receipts already exist (triage, tool-router, supervisor,
sourceability); the work is narrative UI — a compact, calm "agents working"
strip that expands into the run timeline (`/agents/{runId}`). Sources stay
first-class in answers: previews, tier badges, claim grounding, gap chips.

## 7. Workstream D — Graphic coherence (simple, gentle, a bit futuristic)

One design language across public pages, cockpit, repository, boardroom:

- Emerald is the single action/brand signal; navy ink for text; cream/white
  paper surfaces; gold only for archival badges. (DESIGN.md decision tree.)
- EB Garamond for headings, Inter for body, JetBrains Mono for receipts/ids.
- Cards: `praxis-shell-card`; gentle borders, soft shadows, generous spacing.
  No dense dashboards, no competing accent colors, no decorative noise.
- "Futuristic" = restrained signals: the pulse dot on filled dock slots, the
  constellation mini-graphs, the readiness semaphores — not gradients or glow.
- Any new component must reuse the semantic tokens in `globals.css`; if a
  color or radius is typed inline twice, promote it to a token.

## 8. Workstream E — Continuous cleanup

- The workbench monolith (`tasklet-praxis-workbench.tsx`, ~11k lines) must
  keep shrinking: extract pure helpers into
  `src/components/praxis/workbench/`, leaf panels into their own files.
  No behavior change without tests.
- Before deleting anything, verify zero imports across `src/`, `scripts/`,
  `tests/`, `backend/` (audit scripts pin files — check them).
- Keep compatibility redirects; do not add new primary routes.
- Lint-warning backlog is tracked debt; reduce it in touched files.

## 9. Validation gate + deploy (every checkpoint)

```bash
npx tsc --noEmit
npm run lint
npx vitest run
npm run build
npm run audit:repo-shape
node scripts/audit-ai-routes.mjs
npm run audit:public-surface
npm run audit:release-notes
```

Update `STATUS.md` + `CHANGELOG.md` `[Unreleased]`, commit coherent
checkpoints, push to `main` (this deploys), then verify
`https://praxis.tacitus.me/api/health/runtime` reports the pushed commit.

## 10. CODEX prompt queue (run in order, one prompt = one checkpoint)

**P1 — Capsule depth audit and enrichment loop.**
"Run `npm run audit:capsule-depth` and the capsule quality audit across the
starter catalog. Pick the 20 weakest capsules. For each, regenerate identity,
human tacit knowledge, source spine (real sources, tiered, with receipts),
claim ledger, ontology binding, and embedded mini-graph through the Capsule
Architect + review-card path (no parallel schema). Each capsule must read
like a domain expert wrote it — unique judgment calls, not templates. Ship as
review-gated proposals plus updated starter definitions. Validate with
`audit:capsule-contract`, `audit:capsule-v3`, focused vitest."

**P2 — Capsule Inspect WOW.**
"In the repository Inspect panel, make the DIALECTICA payload shine: render
the ontology binding (active ontologies, ACO primitives), the embedded typed
graph (force layout, entity-type colors from `aco-colors.ts`), the claim
ledger with support posture chips, and the tacit-knowledge card. Keep the
card grid light. Reuse existing graph components; no new heavy deps."

**P3 — Agents-working narrative strip.**
"Above streaming Ask answers, add a calm one-line strip that narrates the
live orchestration receipts (triage decision, active agent, tool calls,
sourceability check, approval gates) and links to `/agents/{runId}`. Use the
receipts already present in the answer envelope; no new backend. Match the
emerald/ink design tokens."

**P4 — Repository facets + slot-aware Add.**
"Give `/app/capsules` fast facet filters (type, domain, team — from
`resolveCapsuleTaxonomy`) and make every card's Add button slot-aware: it
proposes the right dock slot from the capsule's type facet and writes through
`assignCapsuleToDockSlot`. Keep the lane URLs (`?lane=`) stable."

**P5 — Workbench decomposition round.**
"Extract the conversation panel and the recents/history rail from
`tasklet-praxis-workbench.tsx` into `src/components/praxis/workbench/` leaf
modules with characterization tests first. Zero behavior change. Target
≥1,500 lines removed from the monolith."

**P6 — Boardroom dock picker.**
"Boardroom currently displays the dock read-only. Add inline slot pickers
(same `CapsuleListPicker` + `assignCapsuleToDockSlot` flow as the Ask dock)
so users can re-dock capsules without leaving the boardroom. The run request
already injects the compiled dock — no backend change."

**P7 — Design-coherence sweep.**
"Audit every visible surface against Section 7: kill stray colors, inline
radii, duplicated card styles; promote repeated values to tokens; verify with
`npm run verify:design` and the design contract tests. Screenshot-diff the
cockpit, repository, boardroom, learn, pricing."

**P8 — Capsule sharing & fork polish (marketplace lane).**
"Make public capsules forkable with provenance and review state visible
before adoption (trust semaphore, source coverage, last refresh). Fork
copies the capsule with reset provenance and a link to the parent. Keep
visibility rules owner-only by default."

---

*Keep checkpoints small, validated, and pushed. The capsule is the product;
every prompt above should leave capsules more capable, more inspectable, or
easier to wield.*
