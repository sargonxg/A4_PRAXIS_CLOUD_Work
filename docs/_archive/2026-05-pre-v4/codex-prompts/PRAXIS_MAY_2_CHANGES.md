# PRAXIS — CODEX Prompt Pack 02
## Frontend, Syria Showcase Walkthrough, and End-to-End Testing

> **Author:** Strategic engineering brief for Codex (OpenAI) and Claude Code agents.
> **Repo:** `sargonxg/A4_PRAXIS_CLOUD_Work` · branch `main`
> **Companion file:** `CODEX_PROMPTS_01_ARCHITECTURE_AND_DIALECTICA.md` (must be executed first — this pack assumes A1–A10 are landed).
> **Read first:** `AGENTS.md`, `CLAUDE.md`, `docs/SYRIA_CASE_RECORDING_RUNBOOK.md`, `docs/CONTEXT_INJECTION.md`, `docs/PRAXIS_15_APP_WIDE_IMPROVEMENTS_2026-04-29.md`, the new `docs/PRAXIS_DIALECTICA_V1_ARCHITECTURE.md` produced by Pack 01.
> **Hard rules:** never hardcode `gemini-*` strings outside `src/lib/ai/providers.ts`; never bypass `withCalibration`; never silently mix demo data into authenticated user state.

---

## Why this pack exists

Pack 01 made the engine real: live Syria ingest, real ACO extraction, five named DIALECTICA reasoning recipes against the live graph, confidence and provenance on every node, a TCGC evaluation harness, and consolidation down to 12 hero tools. **Pack 02 makes the engine demo-able to its actual buyers** — diplomats, mediators, intelligence analysts, security advisors, humanitarian coordinators, and policy directors. It does this through:

1. **A redesigned `/app/syria-case` workspace** as a single, narrative-coherent showcase that walks any analyst through context → sources → graph → reasoning → brief in a guided 8-minute flow.
2. **Five "wow" interactions** the strategic memo identified as deal-closers, ported into the Syria context: 90-second graph, counterfactual slider, both-sides narrative split, provenance click-through, pattern detector.
3. **A guided tour engine** (already partly present as `recording=1`) extended into a true narrative tour with five chapters mapped to the five reasoning recipes.
4. **A typed persona-testing harness** — six personas (diplomat, mediator, intel analyst, military planner, CRO, humanitarian coordinator) each with an end-to-end Playwright spec running the showcase from their viewpoint.
5. **A statecraft-grade output finishing pass** — the briefing, the policy memo, the talking points all carry the new provenance backbone visibly, exportable to DOCX with citations preserved.
6. **A trust-and-credibility surface** — every screen has the "why should I trust this?" affordance one click away.

Each prompt below is a standalone CODEX work order. They are ordered. Each has prerequisites, files to touch, an explicit Definition-of-Done, and a verification command. **Run `npm run audit:gate` (Pack 01 prompt A11) at the end of every prompt.**

---

## Pack overview

| # | Prompt ID | Outcome | Est. effort |
|---|---|---|---|
| **B1** | `showcase/syria-page-redesign` | Rebuild `/app/syria-case` as a 5-chapter narrative workspace | 8 h |
| **B2** | `showcase/recipe-cards-live` | Make the five reasoning recipes the centerpiece, with live results | 6 h |
| **B3** | `showcase/wow-90-second-graph` | The "paste a source, watch the graph build live" interaction | 6 h |
| **B4** | `showcase/wow-counterfactual-slider` | The "what if SDF withdraws?" slider that re-runs PATH-SEARCH live | 8 h |
| **B5** | `showcase/wow-both-sides-narrative` | Two-column counter-narrative split with citation underlines | 6 h |
| **B6** | `showcase/wow-provenance-clickthrough` | 3-click path: recommendation → primitive nodes → exact source span | 4 h |
| **B7** | `showcase/wow-pattern-detector` | "Cases like this one" surface across closed/related cases | 4 h |
| **B8** | `tour/guided-walkthrough-engine` | A first-class `<GuidedTour>` that drives any case workspace | 8 h |
| **B9** | `outputs/briefing-with-provenance` | Briefing studio renders provenance footnotes; DOCX export preserves them | 6 h |
| **B10** | `outputs/policy-memo-and-talking-points` | Same provenance discipline for policy memo + UN toolkit talking points | 6 h |
| **B11** | `personas/six-persona-test-harness` | Playwright suite — diplomat, mediator, intel analyst, military planner, CRO, humanitarian | 12 h |
| **B12** | `trust/why-should-i-trust-this` | The "trust panel" affordance available on every screen | 4 h |
| **B13** | `qa/visual-regression-syria` | Visual regression baseline for the Syria showcase | 4 h |
| **B14** | `polish/error-states-and-empty-states` | Make every empty/error state useful, not anxious | 4 h |
| **B15** | `release/showcase-readiness-checklist` | A signed-off readiness checklist before Syria goes public | 2 h |

Total: 4–6 focused engineering days for one Codex agent or 2–3 days in tandem.

---

## Prompt B1 — `showcase/syria-page-redesign`

### Outcome
Replace the current `/app/syria-case` page with a 5-chapter narrative workspace. Each chapter corresponds to a real intellectual moment in the analyst's day. The page becomes the single canonical entry point for any analyst evaluating PRAXIS — diplomat, mediator, intel analyst, CRO — not just a recording-only page.

### Why this matters
Today's Syria page is a recording runway: cards listing sub-tools, a 45-second voiceover, scene scripts. That works for a 45-second YouTube. It does *not* work for a senior analyst spending 8–15 minutes evaluating whether to recommend the platform. The narrative chapters fix this.

### The five chapters (lock now)

| # | Chapter | Question it answers | Headline metric/visual | Time on chapter |
|---|---|---|---|---|
| **1** | **Situation Frame** | What am I actually looking at? | Risk score, Glasl stage, key actors, source coverage, data freshness | 60–90 s |
| **2** | **Source Receipts** | Why should I believe any of this? | Source list with reliability tiers, retrieval timestamps, click-through to spans | 60–90 s |
| **3** | **Conflict Graph** | How do these pieces connect? | The live ACO graph with view-mode toggle (Episodic / Semantic / Stance) | 90–120 s |
| **4** | **DIALECTICA Reasoning** | What does this graph mean? | The five recipe cards (LEVERAGE-TRACE, COMMITMENT-CHECK, INTEREST-vs-POSITION, COUNTER-NARRATIVE, PATH-SEARCH) running live | 180–240 s |
| **5** | **Decision Product** | What should I do, and how do I defend it? | Briefing draft + policy memo + talking points, all with provenance footnotes | 90–120 s |

Total budget: 8–11 minutes. Anyone who can sit through that has signaled real interest.

### Files to touch
- Replace: `src/app/app/syria-case/page.tsx`. Keep the existing imports of `SYRIA_DEMO_*` constants — the live data flows in from Pack 01's A7+A8.
- New: `src/components/syria/chapter-frame.tsx` — generic chapter wrapper with: header, sub-text, content slot, and "next chapter" affordance.
- New: `src/components/syria/chapter-1-situation-frame.tsx`
- New: `src/components/syria/chapter-2-source-receipts.tsx`
- New: `src/components/syria/chapter-3-conflict-graph.tsx`
- New: `src/components/syria/chapter-4-dialectica.tsx`
- New: `src/components/syria/chapter-5-decision-product.tsx`
- New: `src/lib/syria/chapter-flow.ts` — typed flow descriptor used by the guided tour (B8) and the persona harness (B11).
- Modify: `src/lib/constants/syria-demo-workspace.ts` — `SYRIA_INVESTOR_WALKTHROUGH_ITEMS` becomes `SYRIA_CHAPTER_FLOW`, replacing the prior list.

### Visual hierarchy
- Header is one line: `Syria Transition · Northeast Integration & Regional Spillover · Public-source case file`. No "investor demo" framing. The buyer is a working analyst, not an investor.
- Sub-header: a single sentence calibrated by analyst profile (`buildCalibratedContext`) — UN officials get diplomatic register; CROs get risk-management register.
- Right rail: chapter index (5 dots, current highlighted) + estimated time + "skip to chapter X" affordances.
- No 45-second-voice-over CTA on the page itself. Move that into a small "Press kit" button in the page footer for journalists/investors who want it.

### Calibration
On the Syria page, the analyst profile defaults to `SYRIA_DEMO_ANALYST_PROFILE` for demo users. For authenticated users with their own profile, the profile is used as-is; the chapters adapt their language but show the same Syria data. Test with at least three profiles: UN official / senior, mediator / mid, journalist / mid.

### Definition of Done
1. Visiting `/app/syria-case` (in dev) shows the 5 chapters with the chapter index right-rail. Default starts at Chapter 1 visible, others collapsed.
2. Each chapter has working content (Pack 01 data flows in).
3. The page never shows hardcoded demo strings — every metric/value/citation traces to the live (or cached-fallback) data store.
4. Clicking the chapter index scrolls (or opens, if accordion-style) the matching section. Keyboard `1`–`5` jumps to chapter.
5. Mobile: chapters stack vertically; right rail collapses to a sticky bottom progress bar.

### Verification
```bash
npx vitest run tests/unit/components/syria
npx tsc --noEmit
npm run build
# Manual: visit /app/syria-case in dev with three different profiles loaded.
```

---

## Prompt B2 — `showcase/recipe-cards-live`

### Outcome
Chapter 4 (DIALECTICA Reasoning) becomes the *centerpiece* of the page. Five recipe cards. Each card runs its recipe live against the Syria graph, renders the result with a typed result-component, shows confidence + provenance, and can be replayed.

### Why this matters
This is the single most distinctive thing the platform does. Other tools render a graph; PRAXIS *reasons* over it with named, defensible recipes. Make this the loudest signal on the page.

### The five recipe cards (recap from Pack 01 A5/A9)

| Card | Recipe | Headline output |
|---|---|---|
| **Leverage trace** | `LEVERAGE-TRACE` | Damascus's leverage on SDF (and vice versa) — with score, type, chain |
| **Commitment integrity** | `COMMITMENT-CHECK` | The 30 January agreement, fragile clauses, downstream chain |
| **Interests under positions** | `INTEREST-vs-POSITION` | ZOPA candidates between Damascus, SDF, regional powers |
| **Both-sides narrative** | `COUNTER-NARRATIVE` | Three competing accounts of southern Syria flashpoints |
| **Action paths** | `PATH-SEARCH` | Top 3–5 sequenced UN/envoy actions over next 60 days |

### Files to touch
- Modify: `src/components/syria/chapter-4-dialectica.tsx` — render the five `<RecipeCard>` instances.
- Reuse: `src/components/dialectica/recipe-result-panel.tsx` (created in Pack 01 A5).
- New: `src/components/dialectica/leverage-trace-result.tsx`
- New: `src/components/dialectica/commitment-check-result.tsx`
- New: `src/components/dialectica/interest-vs-position-result.tsx`
- New: `src/components/dialectica/counter-narrative-result.tsx`
- New: `src/components/dialectica/path-search-result.tsx`
- New: `src/components/dialectica/recipe-loading-state.tsx` — a thoughtful loading state that streams in the rule chain *as it executes* (not just a spinner). Use the Vercel AI SDK streaming primitives.
- Modify: `src/app/api/dialectica/reason/[recipe]/route.ts` — emit Server-Sent Events for the rule chain so the loading state can surface intermediate steps ("loading semantic view... 142 nodes loaded... applying rule LEV-1... 14 paths found... ranking...").

### Recipe-card UX requirements
- **Title** — recipe name with one-line explanation.
- **Question** — the diplomat-friendly question the recipe answers ("What leverage does Damascus hold over SDF?").
- **Result** — typed renderer per recipe.
- **Provenance click-through** — each result item shows confidence; clicking opens the source span in a side drawer.
- **Replay** — a small button re-runs the recipe with current graph (in case the analyst has approved hypotheses since the last run). Default cache lifetime: 30 min.
- **Cached badge** — if the result came from `cached-recipe-results.ts` (offline demo path), show a small "cached for demo" pill. Never silent.

### Definition of Done
1. Each of the five cards renders a real result against the live Syria graph in < 8s end-to-end.
2. Streaming loading state surfaces ≥ 3 intermediate steps ("loading view → applying rule → ranking").
3. Each result item is hover-able for provenance and click-able for source span.
4. Replay re-runs the recipe and updates the result.
5. If the backend is unavailable, the card falls back to cached results with the visible "cached" badge.
6. Mobile: cards stack 1-column; provenance drawer becomes full-screen sheet.

### Verification
```bash
npx vitest run tests/unit/components/dialectica
# Manual: open /app/syria-case → Chapter 4 → click each card → verify streaming loading.
```

---

## Prompt B3 — `showcase/wow-90-second-graph`

### Outcome
The "paste a source, watch the graph build live" wow moment. A panel inside Chapter 1 (or accessible from the header) labeled **"Add a source, see the graph grow."** The user pastes a URL or text from any of the Syria source library; PRAXIS scrapes/extracts; nodes and edges *animate in* with provenance attached; the graph stays consistent because of the hypotheses → facts gate.

### Why this matters
The strategic memo names this as the canonical demo moment. For Syria, the version is: paste a UN Geneva briefing → watch new actors, claims, commitments, events appear on the graph in real time. Diplomats and analysts find this irresistible because it mirrors how they actually work.

### Files to touch
- New: `src/components/syria/grow-the-graph-panel.tsx` — the paste box + "Run extraction" button + live graph diff visualization.
- New: `src/lib/syria/grow-stream.ts` — server-sent events from `/api/situations/[id]/syria-extract/stream` that emit per-extracted-entity events.
- New: `src/app/api/situations/[id]/syria-extract/stream/route.ts` — wraps the existing extract endpoint (Pack 01 A8) with an SSE wrapper.
- Modify: `src/components/visualizations/force-graph.tsx` — accept incoming-node and incoming-edge animation hooks (cubic-out fade-in over 600ms for nodes, 400ms for edges; new nodes pulse a 1.2× scale once for emphasis).

### UX flow
1. User pastes a URL from the Syria library (or any URL — guarded by domain allowlist).
2. PRAXIS confirms (one line: "Pulling https://... ; will create up to ~12 hypothesis nodes").
3. Server scrapes (Firecrawl / grounded-search), extracts, streams back primitives one at a time.
4. Each primitive appears on the graph with a fade+pulse, sub-labeled "hypothesis" (visually distinct color: amber border).
5. User clicks any new node → side panel: "Approve into facts? Edit?" Approve flips the color to canonical (saturated).
6. Audit trail: a `system_event` records the run with retrieval method, model version, and per-entity confidence.

### Edge cases
- Source returns 0 entities → friendly message, no errors. Show what *was* attempted (queries used, time spent).
- Source returns > 50 entities → cap at 30; offer "see the rest in GraphOps" link.
- User pastes a URL not in the allowed domains → reject with explainer.

### Definition of Done
1. Pasting `https://www.ungeneva.org/en/news-media/news/2026/02/115867/syria-transition-gains-ground-kurdish-deal-violence-and-humanitarian` extracts ≥ 8 hypothesis nodes within 12s, all animated in.
2. The graph state cleanly distinguishes hypothesis (amber outline) from facts (canonical color).
3. Approving a hypothesis from the side-panel writes to canonical graph + emits a `system_event`.
4. If the SSE stream errors mid-flight, partial results remain in hypotheses (no rollback) and a banner explains.
5. Demo cache: if the user is in `recording=1` mode, the stream is replayed from a fixture (deterministic timing) so the recording never varies.

### Verification
```bash
npx vitest run tests/integration/syria-grow-stream.spec.ts
# Manual: paste a UN Geneva URL on /app/syria-case Chapter 1; confirm animation.
```

---

## Prompt B4 — `showcase/wow-counterfactual-slider`

### Outcome
A counterfactual slider on the Conflict Graph (Chapter 3) and on PATH-SEARCH (Chapter 4 card 5). The slider lets the analyst toggle a *named hypothesis* on or off — "What if SDF withdraws from the integration agreement?" — and the affected nodes/edges *and* the recipe outputs recompute live.

### Why this matters
Counterfactual reasoning over a live graph is something virtually no other tool offers. It's also exactly the workflow a J2 or a Special Envoy actually does in their head — and PRAXIS makes it explicit.

### Files to touch
- New: `src/components/syria/counterfactual-controls.tsx` — slider strip with 4–6 named hypotheses (from a curated list).
- New: `src/lib/syria/counterfactuals.ts` — typed list of hypotheses for the Syria case:
  - `sdf_withdraws_from_jan_agreement` — flips Commitment "30 Jan SDF integration" status to violated, propagates fragility.
  - `israel_escalates_southern_incursions` — adds new Event nodes; flips Constraint severity for southern flashpoints.
  - `humanitarian_funding_collapse` — flips Constraint "donor liquidity" to hard.
  - `damascus_drops_kurdish_rights_clauses` — flips Claim status; propagates Narrative divergence.
  - `regional_war_escalation` — adds Event nodes for spillover.
- Modify: `backend/dialectica/recipes/path_search.py` — accept a `counterfactual_set` parameter that overlays Hypothesis toggles before reasoning.
- Modify: `src/components/visualizations/force-graph.tsx` — visually mark counterfactual deltas (dashed border for nodes that change state; striped edges for edges added by the counterfactual).
- Modify: `src/components/dialectica/path-search-result.tsx` — show "current state" vs "counterfactual state" delta in the ranked actions.

### UX requirements
- The slider is *additive*. Each toggle stacks. A small "counterfactual chips" row shows what's currently active.
- Recompute time budget: < 4s per toggle change. Cache aggressively at the recipe level keyed by the counterfactual set.
- "Reset" button clears all toggles.
- Confidence on counterfactual paths is multiplied by a counterfactual penalty (`× 0.7` per active toggle, capped at `× 0.3`). Confidence visibly degrades as the analyst stacks toggles. This is honest reasoning under uncertainty.

### Definition of Done
1. Toggling `sdf_withdraws_from_jan_agreement` re-runs PATH-SEARCH and produces a *different* top-ranked action than the baseline.
2. The graph visually marks the affected nodes/edges within 600ms.
3. Provenance click-through still works (the hypothesis adds a synthetic provenance step labeled "counterfactual: sdf_withdraws_from_jan_agreement").
4. The counterfactual chip row clearly shows what is active; user can reset.
5. Tests: at least one Vitest spec validates counterfactual stacking + confidence decay.

### Verification
```bash
npx vitest run tests/unit/lib/syria/counterfactuals.test.ts
npx vitest run tests/integration/syria-counterfactual.spec.ts
# Manual: toggle each hypothesis on /app/syria-case Chapter 3 + 4; verify recompute.
```

---

## Prompt B5 — `showcase/wow-both-sides-narrative`

### Outcome
A two-column "both sides" view inside Chapter 4 card 4 (COUNTER-NARRATIVE). Left column: Damascus's narrative on a contested event. Right column: SDF's narrative. Citation underlines link to source spans. A divergence score badge shows how much they cite-overlap.

### Why this matters
This single screen is the most direct visualization of *why* PRAXIS exists. The diplomat / mediator immediately recognizes their own work. The CRO sees a way to reduce litigation risk. The defense analyst sees IO/influence-operations modeling.

### Files to touch
- Replace: `src/components/dialectica/counter-narrative-result.tsx` — split-pane layout. Each pane has actor name, narrative text, citations as underlined hover-able phrases.
- New: `src/components/syria/citation-overlap-meter.tsx` — vertical strip between the two panes. Bands of overlapping citations are connected with thin lines (use D3 or SVG path).
- Modify: `backend/dialectica/recipes/counter_narrative.py` — output now includes `citation_overlap.jaccard ∈ [0, 1]` and per-citation `documentId` mapping.

### UX requirements
- Each pane labeled with actor name + a small color chip (consistent with graph color of that actor).
- Citation underlines: hover shows a 200-character excerpt + retrieval timestamp; click opens full source span in a drawer.
- The vertical overlap meter shows overlap visually (e.g., "Damascus and SDF cite 3 of the same UN reports; differ on 7").
- A small footer line: "Divergence score: 0.71 — narratives use largely non-overlapping evidence."
- Optional: a "third side" pane (Israel) on click; the layout becomes 3-column.

### Definition of Done
1. The COUNTER-NARRATIVE recipe on the Syria graph produces a two-pane render with citation underlines on both sides.
2. Citation overlap meter renders proportionally to actual overlap.
3. Click on any underlined phrase opens the source span drawer.
4. Mobile: panes stack; overlap meter becomes a horizontal bar.
5. Tests: visual regression baseline (B13) for this component.

### Verification
```bash
npx vitest run tests/unit/components/dialectica/counter-narrative-result.test.tsx
# Manual: visit Chapter 4 card 4 with the Syria graph; verify both panes + meter.
```

---

## Prompt B6 — `showcase/wow-provenance-clickthrough`

### Outcome
The 3-click path: any sentence in any decision product (Briefing, Policy Memo, Talking Points) → the underlying primitive nodes that supported the claim → the exact source span in the original document. This is the GC-defensibility moment.

### Why this matters
Every senior analyst has seen GenAI confidently lie. The first thing a GC asks of any AI output is: *"Where does this come from?"* PRAXIS answers in three clicks. The strategic memo names this as a wow interaction; the Pack 01 provenance backbone makes it possible.

### Files to touch
- New: `src/components/praxis/inline-provenance-link.tsx` — a small superscript number `[1]` or `[2]` that decorates any AI-generated sentence in a decision product. Hover shows the rule + primitive set; click opens the side drawer.
- Modify: `src/components/praxis/citation.tsx` — extend to support both `SourceSpan` (raw source) and `ReasoningStep` (rule chain) targets.
- Modify: every output rendering location:
  - `src/components/syria/chapter-5-decision-product.tsx`
  - `src/app/app/policy-memo/page.tsx` — Syria case path
  - `src/app/app/briefing/page.tsx` — Syria case path
  - `src/app/app/talking-points/page.tsx` — Syria case path
  Each must accept a `provenanceMap` prop that ties decision-product sentences to their backing primitives.
- Modify: `src/app/api/ai/policy-memo/route.ts`, `briefing-generate/route.ts`, `talking-points/route.ts` — output schema now includes `provenance_map: Record<sentenceId, ProvenanceRef>`.

### The 3 clicks
1. **Click on the superscript `[3]`** — a side drawer opens. Header: "This sentence is supported by 3 primitives: 2 commitments, 1 event."
2. **Click on a primitive** — the conflict graph opens in the drawer with the primitive highlighted; surrounding subgraph rendered.
3. **Click on the primitive's source-span chip** — the original document opens in a panel with the supporting span highlighted in yellow.

### Definition of Done
1. The Syria briefing has at least 12 sentences each with a working `[n]` superscript.
2. Each click chain works as described — within < 200ms per click.
3. Keyboard: pressing `Esc` at any step closes back to the previous level.
4. The provenance drawer is accessibility-compliant (focus trap, aria-labels, screen-reader announcements).
5. Tests: at least one Vitest spec asserts the click-chain renders the right components.

### Verification
```bash
npx vitest run tests/unit/components/praxis/inline-provenance-link.test.tsx
npx vitest run tests/integration/syria-provenance-clickthrough.spec.ts
```

---

## Prompt B7 — `showcase/wow-pattern-detector`

### Outcome
A "Cases like this one" surface in Chapter 5. The system finds *prior* (or other related) cases with similar conflict-grammar patterns — same primitive types, similar narrative-divergence structure, similar leverage asymmetries — and offers them as context. For Syria, prime candidates: Lebanon 1989 (Taif), Bosnia 1995 (Dayton), South Sudan 2018 (R-ARCSS), Iraq 2017 (Kurdish referendum aftermath).

### Why this matters
Senior diplomats reason analogically. "What's our Lebanese-Taif option?" is something a senior envoy actually says. PRAXIS surfacing the analog is gold. The strategic memo lists this as a wow moment. For demo purposes we ship with 4–6 curated comparison cases.

### Files to touch
- New: `src/lib/syria/comparison-cases.ts` — typed list of 6 historical analog cases with brief summaries, key primitive counts, and what makes them comparable (or not).
- New: `src/components/syria/comparison-case-card.tsx` — renders one analog with a similarity score, the 2–3 most-similar primitive patterns, and a "lessons" snippet.
- New: `src/lib/syria/pattern-similarity.ts` — computes a simple Jaccard-style similarity over primitive-type distributions and edge-vocabulary distributions.
- Modify: `src/components/syria/chapter-5-decision-product.tsx` — add the comparison row at the top.

### The 6 analog cases (lock now)
| Case | Era | Why it's a useful analog for Syria 2026 |
|---|---|---|
| Lebanon — Taif Agreement | 1989 | Confessional power-sharing as a transition device; durability test |
| Bosnia — Dayton | 1995 | International framework imposing federation + integration |
| South Sudan — R-ARCSS | 2018 | Phased security integration with persistent fragility |
| Iraq — Kurdish region post-2017 | 2017–22 | Centralized state vs. federal autonomous region after a referendum |
| Mozambique — RENAMO integration | 2014–19 | Armed-group integration into national forces |
| Colombia — FARC | 2016 | Comprehensive peace with rights-protective implementation problems |

For each, the constants file carries: name, year, jurisdiction, 2-sentence summary, primitive counts (real numbers if extractable, else hand-set), and `lessons_for_syria` (3 short bullets the analyst can paste into a memo).

### Definition of Done
1. Chapter 5 shows 3 of the 6 analogs (top-similarity for Syria), each as a card with similarity bar.
2. Clicking a card opens a panel with the 2-page summary + lessons.
3. There is a clear "this is curated, not auto-discovered" disclosure — we don't pretend the system trawled history. (Future work: auto-mining from a TCGC corpus.)
4. Mobile: cards become a horizontal scroll.

### Verification
```bash
npx vitest run tests/unit/lib/syria/pattern-similarity.test.ts
# Manual: scroll to Chapter 5 on /app/syria-case; verify analog row.
```

---

## Prompt B8 — `tour/guided-walkthrough-engine`

### Outcome
A first-class `<GuidedTour>` engine that drives any chapter flow, replacing the ad-hoc `recording=1&case=syria` URL pattern. The Syria showcase is its first user; the engine is reusable for other showcase cases later (HR/Alex-vs-Maya, M&A, supplier dispute).

### Why this matters
Today's `recording=1` is a thin URL flag with hardcoded scene timings. We want a real walkthrough engine: chapter sequencing, optional audio, optional scripted text, keyboard navigation, restartability, deep-link to any chapter, and per-chapter "explain this to me" tooltips.

### Files to touch
- New: `src/components/tour/guided-tour.tsx` — the top-level component.
- New: `src/components/tour/chapter-pip.tsx` — the floating "you are here" pill (replaces existing recording runway when in tour mode).
- New: `src/components/tour/chapter-narration.tsx` — optional audio player + transcript synced to the chapter.
- New: `src/lib/tour/chapter-flow.ts` — the typed flow shape:
  ```typescript
  interface TourChapter {
    id: string;
    title: string;
    estimateSeconds: number;
    target: { selector: string; offsetTop?: number };
    narration?: { audioUrl?: string; text: string };
    onEnter?: () => Promise<void>;
    onExit?: () => Promise<void>;
  }
  ```
- New: `src/lib/tour/syria-flow.ts` — Syria-specific chapter flow.
- Modify: `src/app/app/syria-case/page.tsx` — wraps the page in `<GuidedTour flow={SYRIA_FLOW}>`.
- Modify: `src/components/demo/syria-recording-director.tsx` — *deprecate*, replace by the new tour engine. Keep a thin shim that maps the old query params for back-compat.

### Tour features (lock)
- Keyboard: `Space` toggles play/pause, arrows for prev/next chapter, `1`–`5` jumps.
- Audio: optional, off by default, controllable in the chapter pip.
- Restart: from any chapter, "Start over" restarts at chapter 1.
- Deep link: `?chapter=3` opens directly at chapter 3.
- A11y: focus moves to the chapter content region on chapter change; aria-live region announces.

### Definition of Done
1. `/app/syria-case` runs the guided tour seamlessly.
2. `/app/syria-case?chapter=4` deep-links to Chapter 4.
3. Old `?recording=1&case=syria` still works (back-compat shim).
4. Chapter pip respects user's reduced-motion / dark-mode / contrast preferences.
5. Vitest unit tests for the engine state machine.

### Verification
```bash
npx vitest run tests/unit/components/tour
# Manual: keyboard-test the tour on Syria.
```

---

## Prompt B9 — `outputs/briefing-with-provenance`

### Outcome
The Briefing tool, when used on the Syria case, produces a decision brief whose every fact and recommendation traces to a primitive + source span. The DOCX export preserves the citations as Word footnotes (`[1]` superscripts → end-of-document footnotes with hyperlinks). This is the senior-decision-maker handoff artifact.

### Why this matters
Every analyst writes briefs. PRAXIS's brief differs because it's *defensible*. The Word/LibreOffice export must preserve that defensibility. A brief stripped of citations is just a worse Wikipedia article.

### Files to touch
- Modify: `src/lib/exports/briefing-docx.ts` — extend to emit `<w:footnoteReference>` for each `[n]` superscript and a `<w:footnote>` block at end of doc.
- Modify: `src/app/app/briefing/page.tsx` — the Syria-bound rendering branch uses the new provenance components.
- Modify: `src/lib/ai/schemas/situation-intelligence.ts` (or its briefing equivalent) — output now includes `provenance_map`.
- New: `tests/unit/lib/exports/briefing-docx.test.ts` — asserts that a brief with N `[n]` superscripts produces N Word footnotes with valid IDs.
- Modify: the briefing PDF export path (if present) — same logic for PDF footnotes.

### Brief structure (lock for Syria — extends to other cases later)
1. **BLUF** — 2 sentences, every clause cited.
2. **Situation** — Glasl stage, risk score, 3-line context.
3. **Actors** — top 6, each with stated position + inferred interest (cited).
4. **Commitments at risk** — output of COMMITMENT-CHECK (cited).
5. **Leverage map** — output of LEVERAGE-TRACE (cited).
6. **Recommended actions** — output of PATH-SEARCH (cited; confidence shown).
7. **Triggers and indicators** — what would change the assessment.
8. **Open questions** — what we don't know.
9. **Source basis** — the source-receipt list with reliability tiers.
10. **Methodology** — one-page appendix on ACO + DIALECTICA + provenance contract.

### Definition of Done
1. Generating a brief on Syria produces a 5–8 page document with sections 1–10.
2. The DOCX export opens cleanly in LibreOffice 24+ and Word 2024+, with footnotes intact and hyperlinked.
3. Every numbered citation in the body resolves to a footnote with: source name, retrieval date, URL, excerpt (≤ 80 chars).
4. The brief includes ≥ 12 distinct citations.
5. Tests: docx integration test asserts well-formed XML.

### Verification
```bash
npx vitest run tests/unit/lib/exports/briefing-docx.test.ts
# Manual: generate brief, export DOCX, open in LibreOffice, scroll to footnotes.
```

---

## Prompt B10 — `outputs/policy-memo-and-talking-points`

### Outcome
Same provenance discipline applied to Policy Memo and Talking Points. Both export to DOCX with footnotes. Both render `[n]` superscripts inline. Talking Points get a special speaker-notes mode (large type, slow-pace cues).

### Files to touch
- Modify: `src/app/app/policy-memo/page.tsx` (Syria branch).
- Modify: `src/app/app/talking-points/page.tsx`.
- Modify: `src/app/api/ai/policy-memo/route.ts` and `src/app/api/ai/talking-points/route.ts` — schema includes `provenance_map`.
- Modify: `src/lib/exports/policy-memo-docx.ts` and `src/lib/exports/talking-points-docx.ts` — emit footnotes.
- New: `src/components/talking-points/speaker-mode.tsx` — full-screen reading mode for use in actual delivery; large type, citation index in margin.

### Definition of Done
1. Generating a Syria policy memo with provenance produces a 3–5 page DOCX with footnotes.
2. Generating Syria talking points (3 talking points × 4 supporting bullets each) produces a card-per-talking-point output with citations.
3. Speaker-mode renders one talking point at a time, full-screen, with a large pause cue and the citation list in a sidebar.
4. Tests: snapshot tests for memo + talking-points DOCX structure.

### Verification
```bash
npx vitest run tests/unit/lib/exports
npx vitest run tests/unit/components/talking-points
```

---

## Prompt B11 — `personas/six-persona-test-harness`

### Outcome
A Playwright suite that runs the Syria showcase end-to-end from six distinct personas. Each persona has a calibrated profile and a script that exercises the chapters from its perspective. CI runs the suite nightly. Anyone can run `npm run test:personas` locally against a deployed preview URL.

### Why this matters
The strategic memo lists six personas; we want each one's experience to be *good*. Engineers tend to test the path they built; persona testing surfaces the gaps engineers don't see.

### The six personas (lock)

| Persona | Role | Calibration profile values | What they care about |
|---|---|---|---|
| **Diplomat** | UN PAO, mid-senior | role: un_official, seniority: senior, lenses: ['diplomatic','mediation','legal_ihl'], audience: senior_leadership | Briefs, treaties, diplomatic register, IHL framing |
| **Mediator** | Independent envoy, mid | role: mediator, seniority: mid, lenses: ['mediation','humanitarian'], audience: counterparts | Interest-vs-position, ZOPA, BATNA, durable settlement language |
| **Intel analyst** | NIC / J2 mid | role: intel_analyst, seniority: mid, lenses: ['security','intelligence'], audience: command_briefer | Leverage, faction dynamics, IO, sourced evidence |
| **Military planner** | CCMD planner, mid | role: military, seniority: mid, lenses: ['security','operational'], audience: command_briefer | PATH-SEARCH, escalation triggers, scenario forks |
| **CRO** | Multinational risk officer | role: enterprise_risk, seniority: senior, lenses: ['risk','operational','legal_ihl'], audience: board | Constraint cascades, supply chain spillover, scenario-driven exposure |
| **Humanitarian** | OCHA / NGO field officer | role: humanitarian, seniority: mid, lenses: ['humanitarian','protection'], audience: peers_analysts | Access, returns, IDP, donor liquidity |

### Files to touch
- New: `tests/e2e/personas/_helpers.ts` — log-in helpers, profile-load helpers, screenshot helpers.
- New: `tests/e2e/personas/diplomat-syria.spec.ts`
- New: `tests/e2e/personas/mediator-syria.spec.ts`
- New: `tests/e2e/personas/intel-analyst-syria.spec.ts`
- New: `tests/e2e/personas/military-planner-syria.spec.ts`
- New: `tests/e2e/personas/cro-syria.spec.ts`
- New: `tests/e2e/personas/humanitarian-syria.spec.ts`
- Modify: `playwright.config.ts` — add a `personas` project that runs against `PLAYWRIGHT_BASE_URL`.
- New: `.github/workflows/personas.yml` — runs nightly against the staging deploy.

### What each spec does (template)
1. Log in as the persona-bound test user (each has a fixture profile).
2. Visit `/app/syria-case`.
3. Walk through chapters 1–5 verifying *that persona's* expected affordances:
   - Diplomat: treaty-clause language in briefings, IHL never-call-terrorist red line respected.
   - Mediator: INTEREST-vs-POSITION recipe is prominently surfaced; ZOPA card visible.
   - Intel analyst: LEVERAGE-TRACE returns OSINT-rooted leverage; provenance to specific reports.
   - Military planner: PATH-SEARCH counterfactual slider works; escalation triggers visible.
   - CRO: scenario forks render constraint cascades; export to PDF works for board.
   - Humanitarian: humanitarian access constraints are first-class; OCHA/UNHCR sources prominent.
4. Generate a decision product (brief / memo / talking points) and verify ≥ 5 citations + a downloadable DOCX.
5. Take a final screenshot for visual regression baseline.

### Definition of Done
1. All six specs pass against a staging deploy.
2. Each spec runtime is < 4 minutes.
3. Each spec produces a `screenshots/personas/{name}/` directory used by B13.
4. Each spec has at least 12 assertions covering the persona's specific concerns.
5. CI workflow runs nightly and posts results to a Slack/Discord webhook.

### Verification
```bash
PLAYWRIGHT_BASE_URL=https://staging.praxis.tacitus.me npx playwright test tests/e2e/personas
npm run test:personas    # alias
```

---

## Prompt B12 — `trust/why-should-i-trust-this`

### Outcome
A persistent "Trust" affordance in the workspace header — small shield icon — that opens a side drawer with the platform's trust posture for the active situation: source library, methodology, model provenance (which model produced this graph), data freshness, evaluation results, and a link to the methodology PDF. This is what wins the security/trust review persona in the strategic memo.

### Why this matters
A senior security reviewer will ask: "What model produced this? When? Against what eval? What sources are excluded? Where does my data sit?" These answers should be one click away, not buried in `/docs`.

### Files to touch
- New: `src/components/praxis/trust-drawer.tsx` — the side drawer.
- New: `src/components/app/trust-shield.tsx` — the header icon. Use `lucide-react`'s `ShieldCheck`.
- Modify: `src/components/app/Header.tsx` (or wherever the workspace header lives) — mount the trust shield.
- New: `src/lib/trust/trust-state.ts` — derives the current trust posture from the active situation, model state, and last-eval-result.
- New: `docs/PRAXIS_METHODOLOGY.pdf` — a 6-page PDF (build with the existing pdf skill) describing ACO, DIALECTICA, confidence model, provenance contract, source library tiers, eval harness.

### What the drawer shows (lock)
1. **Active model** — exact `getProModel()` return value, with a "this model is current as of {date}" line.
2. **Active analyst profile** — your role, your lenses, your red lines (link to /app/profile).
3. **Active source library** — list of allowed source domains for this situation, with last-fetched timestamps.
4. **Last evaluation** — TCGC-Syria last run date, all 5 metrics with pass/fail icons.
5. **Privacy posture** — "Your data: stored in your Firebase project (US-central1). Documents encrypted at rest. API keys envelope-encrypted (AES-256-GCM)." Two-sentence version of `SECURITY.md`.
6. **Methodology** — link to the PDF.
7. **What this system does NOT do** — explicit list:
   - "Does not train on your data."
   - "Does not call third-party LLMs without your explicit consent."
   - "Does not reproduce copyrighted articles in full."
   - "Does not bypass analyst review for canonical graph mutations."

### Definition of Done
1. Shield icon visible in the header on every authenticated page.
2. Drawer opens in < 100ms; all sections render with current data.
3. Last-eval section pulls from the latest `eval/tcgc/syria/v0/results.csv`.
4. Methodology PDF is buildable from a single source (`docs/methodology/`) and signs the document with a checksum.
5. Vitest unit tests for `trust-state.ts`.

### Verification
```bash
npx vitest run tests/unit/lib/trust
# Manual: any page → click shield icon → confirm all 7 sections.
```

---

## Prompt B13 — `qa/visual-regression-syria`

### Outcome
A visual-regression baseline for the Syria showcase using Playwright's screenshot comparison. Every chapter, every recipe card, every wow interaction has a baseline. CI runs visual regression on PR. Pixel-diff threshold tuned for AI-generated content (text fingerprints differ; layout doesn't).

### Files to touch
- Modify: `playwright.config.ts` — add a `visual-regression` project with a deterministic browser config (Chromium, fixed viewport, fixed font stack).
- New: `tests/e2e/visual-regression/syria.spec.ts` — captures baselines for every chapter + recipe card + wow interaction.
- New: `tests/e2e/visual-regression/baselines/syria/*.png` — the baseline images.
- Modify: `.github/workflows/ci.yml` — visual-regression job that diff-compares on PR.

### What we screenshot
- Each chapter (5 images): baseline state.
- Each recipe card with cached results loaded (5 images).
- Counterfactual slider with each toggle on (6 images).
- Counter-narrative split view (1 image).
- Provenance click-through drawer (3 states: closed, level-1, level-2).
- The Trust drawer (1 image, all sections visible).

### Determinism
- Use cached recipe results (so recipe outputs don't fluctuate run-to-run).
- Inject a fixed timestamp as `now` (mock `Date.now`) for "ago" labels.
- Force light theme; force a fixed font stack via Playwright launch args.

### Definition of Done
1. Baseline images exist and pass on a clean run.
2. PR CI fails with a useful diff if any of these screens regresses by > 0.2% pixels (excluding text antialiasing variance).
3. The `playwright update-snapshots` flow works for intentional updates.

### Verification
```bash
npx playwright test tests/e2e/visual-regression
npx playwright test tests/e2e/visual-regression --update-snapshots   # to refresh
```

---

## Prompt B14 — `polish/error-states-and-empty-states`

### Outcome
Every error state and empty state on the Syria showcase is *useful*. A failed extraction shows what was attempted and offers next steps. An empty graph shows what to do (paste a source). A network error shows a retry button. No bare error toasts; no infinite spinners.

### Files to touch
- Audit pass: `grep -rn "error\|isError\|catch (e)" src/components/syria/` and review each.
- New: `src/components/praxis/empty-state.tsx` — a generic empty-state component with `headline`, `subtext`, `primaryCta`, `secondaryCta`, `illustration?`.
- New: `src/components/praxis/error-state.tsx` — same shape, plus retry mechanic and `?support_email` link.
- Modify: every async-state surface in the Syria flow:
  - Source list empty → "No sources yet. Paste a UN Geneva URL to start."
  - Extraction failed → "Couldn't extract from this URL. Tried: scraping (timeout 8s), grounded search (returned 0 results)." + retry.
  - Recipe failed → "DIALECTICA recipe LEVERAGE-TRACE timed out. Showing the last cached result from {time}." + replay.
  - Provenance click on stale primitive → "This primitive's source moved. Retrieved on {date}; URL no longer reachable." + open archived snapshot if available.

### Definition of Done
1. Every async surface in Syria has a typed empty + error state, never a bare exception.
2. Every error state offers an action — retry, fallback, contact support, or "skip".
3. The error states themselves are screenshot-tested in B13 (add 6 more baseline images).
4. No unhandled promise rejections in the browser console during a full chapter walkthrough.

### Verification
```bash
# A11y/error-state lint:
npx vitest run tests/unit/components/syria/error-states
# Manual: simulate offline mode in DevTools → walk Chapter 1–5 → verify graceful failures.
```

---

## Prompt B15 — `release/showcase-readiness-checklist`

### Outcome
A signed-off readiness checklist for the Syria showcase. Until every item is green, the showcase is "Internal preview" only — not linked from the public landing page. Once green, it ships.

### Files to touch
- New: `docs/SYRIA_SHOWCASE_READINESS_2026-05.md` — the checklist below. The first version is filled in by Codex with current state; Giulio signs off line by line.

### The checklist (15 items)

#### Engineering (Pack 01)
- [ ] **A1 done.** Tool registry collapsed to 12 hero tools; verified via `npm run verify-tools`.
- [ ] **A2 done.** Conflict-grammar v1 schema published; codegen produces clean diff.
- [ ] **A3 done.** Confidence + provenance on every primitive; UI surfaces them.
- [ ] **A4 done.** One graph + 3 views; hypotheses store; scenario forks.
- [ ] **A5 done.** Five named recipes implemented; pytests pass.
- [ ] **A7+A8 done.** Live Syria ingest + extraction works; daily cron deployed.
- [ ] **A9 done.** Recipe payoffs render against the live Syria graph.
- [ ] **A10 done.** TCGC-Syria-v0 thresholds met on locked snapshot.

#### Showcase (Pack 02)
- [ ] **B1–B7 done.** All five chapters work; all five wow interactions live.
- [ ] **B8 done.** Guided tour engine driving the Syria flow.
- [ ] **B9–B10 done.** Briefing + memo + talking-points export with footnotes.

#### Test gate
- [ ] **B11 done.** All six persona Playwright specs pass against staging.
- [ ] **B13 done.** Visual regression baseline established and CI-gated.
- [ ] **B14 done.** No infinite spinners; every error state useful.

#### Release
- [ ] **`npm run audit:gate` green** on a clean main branch.

### Definition of Done
1. The doc exists with all 15 items.
2. CI green on the locked commit (target: a tagged `v6.5.0-syria-showcase`).
3. The doc has a "Signed off by" line for Giulio.

### Verification
```bash
cat docs/SYRIA_SHOWCASE_READINESS_2026-05.md
npm run audit:gate
git tag v6.5.0-syria-showcase   # only when all 15 items green
```

---

## Talk track — what to say while showing the Syria showcase

This is the live narration the analyst uses when running the showcase. Short, calibrated, no marketing. Each chapter has a 30-second target.

### Opening (15 s)
> "PRAXIS is a structured-reasoning workspace for conflict analysts. The Syria case here is a public-source case file — every primitive on this graph traces back to a UN, humanitarian, or independent-media report you can verify. I'll walk you through it in five chapters. About eight minutes."

### Chapter 1 — Situation Frame (45 s)
> "Top-level: Syria transition, Northeast integration, regional spillover. Risk score 78, Glasl stage 5 — that's escalation by force, the high-friction band. Eight actors loaded. Source coverage: UN, humanitarian, conflict data, local independent press, think tanks. Data freshness: pulled in the last 24 hours from {N} sources. None of that is hardcoded. If you paste a new UN Geneva briefing right now, I'll show you what it does to this picture. {Optional: paste demo}"

### Chapter 2 — Source Receipts (45 s)
> "Every claim PRAXIS makes has a receipt. Reliability tier on the left, retrieval timestamp on the right, click-through to the exact paragraph in the original document. UN Geneva 13 February 2026, paragraph 4 — that's where the SDF integration commitment comes from. We score sources for proximity, reliability, and access. If you don't trust an outlet, exclude it from your profile and the system will route around it."

### Chapter 3 — Conflict Graph (75 s)
> "This is the Agentic Conflict Ontology — eight primitives. Actors, claims, interests, constraints, leverage, commitments, events, narratives. Three views: Episodic for the timeline, Semantic for the actor-claim-leverage structure, Stance for the narrative warfare. Hover any node — confidence score, source span, extractor version. Click a primitive — the surrounding subgraph snaps into focus. {Optional: toggle counterfactual slider — 'what if SDF withdraws from the agreement?' watch the affected nodes pulse and the recommended-actions card recompute.}"

### Chapter 4 — DIALECTICA Reasoning (180 s)
> "Five named reasoning recipes. LEVERAGE-TRACE: what does Damascus hold over the SDF, and vice versa — leverage type, chain, score. COMMITMENT-CHECK: which provisions of the 30 January agreement are at risk and what's the downstream — the rights-protection clauses are flagged; here's why. INTEREST-vs-POSITION: where do stated positions diverge from inferred interests — that's where ZOPA candidates are. COUNTER-NARRATIVE: Damascus and SDF on southern Syria, two columns, citation underlines, divergence score. PATH-SEARCH: top three sequenced UN actions over the next 60 days, with cost / risk / probability. Every recipe is deterministic — same graph in, same answer out, unless you toggle a counterfactual."

### Chapter 5 — Decision Product (75 s)
> "All of that converges into a decision brief. Every sentence has a footnote. The footnote points to the primitives in the graph; the primitives point to the source spans. DOCX export preserves the footnotes — Word, LibreOffice. {Click a footnote.} {Open DOCX.} You can defend this brief to a GC, an SRSG, or a Security Council member because the chain doesn't break. Comparison row: similar prior cases — Lebanon Taif, South Sudan R-ARCSS, Mozambique RENAMO integration. Lessons-for-Syria links."

### Closing (30 s)
> "Two things to remember. One: this is structured reasoning over a typed conflict grammar — not chat over documents. Two: every output traces to a source. That's why a senior analyst can sign their name to PRAXIS output. If you want to walk through your own case, we can have a sandbox up by the end of the day."

---

## After this pack

The Syria showcase is now:
- A 5-chapter narrative workspace, calibrated by analyst profile.
- Five live DIALECTICA reasoning recipes against real OSINT.
- Five wow interactions: 90-second graph, counterfactual slider, both-sides narrative, provenance click-through, pattern detector.
- A guided tour engine reusable for future cases.
- DOCX-exportable decision products with footnotes.
- Visually regression-tested.
- Persona-tested across diplomat, mediator, intel analyst, military planner, CRO, humanitarian.
- One-click trust-and-methodology drawer.
- Empty-state and error-state polished.
- Readiness-checklist gated for release.

The showcase does what no other tool in this category does today — it lets a senior diplomat or analyst *defend their answer to themselves* in front of a board, an SRSG, or a court. That is the moat.

---

## Appendix — Anti-pattern reminders (carried over from Pack 01)

- **Never hardcode `gemini-*` strings outside `src/lib/ai/providers.ts`.**
- **Never bypass `withCalibration` on AI routes.**
- **Never write to canonical graph without analyst approval.**
- **Never silently mix demo data into authenticated user state.**
- **Never weaken Firestore rules.**
- **Never ship without `npm run audit:gate` green.**
- **Never reach for Datalog or CozoDB.**
- **Never reproduce copyrighted articles in full** (UN/UNHCR primary content is generally CC-BY or public information; commercial outlets get metadata + ≤80 char excerpts only).
- **Never imply classified access.** "Public-source case file" is the only frame.

---

*End of Prompt Pack 02.*
