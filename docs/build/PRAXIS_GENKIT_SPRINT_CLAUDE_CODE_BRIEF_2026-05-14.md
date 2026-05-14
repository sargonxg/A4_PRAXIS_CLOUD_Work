# PRAXIS Genkit Sprint — CLAUDE CODE BRIEF

**Date:** 2026-05-14
**Audience:** Claude Code (or any UX/frontend-focused engineering agent working in parallel with Codex)
**Owner:** Giulio Catanzariti
**Mirror brief for Codex:** `docs/build/PRAXIS_GENKIT_SPRINT_CODEX_BRIEF_2026-05-14.md`

You are working in parallel with a Codex agent. Both agents share this repo and the PR queue. Your job is **UX, visualization, interaction polish, animation, frontend integration with new Genkit APIs**. The other agent handles heavy backend / schema / Genkit infra. Daily sync via PR reviews.

---

## 0. Before you touch any code

### Required reading in this repo

1. `CLAUDE.md` — project canon
2. `AGENTS.md` — hard rules, validation gate, deploy procedure
3. `ARCHITECTURE.md` and `docs/architecture/PRAXIS_ARCHITECTURE.md`
4. `docs/architecture/PRAXIS_GENKIT_NEO4J_INTEGRATION_PLAN_2026-05-14.md` — design doc this sprint executes (Neo4j parts deferred)
5. `docs/architecture/PRAXIS_VISION_v4_01_VISION.md` — three-persona market frame
6. `docs/build/PRAXIS_v5_EXECUTION_LEDGER.md`
7. `src/components/cores/{capsule-board,capsule-slot,specimen-card,domain-picker}.tsx` — current 7-slot capsule UI (path slot has placeholder UI, schema not yet wired — Codex CX-2 ships it)
8. `src/components/ask/AskWorkspacePage.tsx` and surrounding `ask/` components
9. `src/components/memo/memo-desk.tsx` — Tiptap editor + slash commands (partial)
10. `src/components/landing/phase8-wow-landing.tsx` — landing hero + specimen ticker
11. `src/app/onboarding/step-perspective.tsx` — Step 2 (perspective)
12. `src/lib/utils/cn.ts`, design tokens in `tailwind.config.ts`

### Required documentation to fetch and study (do this first)

Use WebFetch or your browser. Do not skim.

**Genkit core (for understanding what Codex's APIs return):**
- https://genkit.dev/docs/js/get-started/
- https://genkit.dev/docs/js/flows/ (streaming pattern — you'll consume SSE)
- https://genkit.dev/docs/js/tool-calling/ (interrupts pattern — you'll render the cards)
- https://genkit.dev/docs/js/devtools/
- https://genkit.dev/docs/js/chat/
- https://genkit.dev/docs/js/interrupts/

**Animation + UX libraries:**
- https://www.framer.com/motion/ — `motion`, `AnimatePresence`, `layoutId`, `useReducedMotion`, spring configs, `whileInView`, `staggerChildren`
- https://docs.dndkit.com/ — current capsule board uses `@dnd-kit/core` + `@dnd-kit/sortable`
- https://tiptap.dev/docs — Tiptap editor (MemoDesk)
- https://tiptap.dev/docs/editor/extensions/custom-extensions/node-views/react — Tiptap React node views (you'll build `ReceiptInline`)

**Accessibility:**
- https://www.w3.org/WAI/ARIA/apg/patterns/ — APG patterns (dialog, listbox, tree)
- https://web.dev/articles/prefers-reduced-motion

**SSE consumption:**
- https://developer.mozilla.org/en-US/docs/Web/API/EventSource

**Stripe (for billing UI):**
- https://docs.stripe.com/payments/checkout/how-checkout-works
- https://docs.stripe.com/customer-management/integrate-customer-portal

**Lighthouse & web vitals:**
- https://web.dev/articles/lighthouse-performance
- https://web.dev/articles/vitals

### Research expectations

- Spend the first 30–45 minutes reading. Especially Framer-motion layout animations, dnd-kit accessibility, and the Genkit streaming flow doc (so you know what SSE chunks to expect from Codex's flows).
- Before each prompt, re-read the matching doc page.
- For unfamiliar primitives, check `node_modules/<pkg>/dist/index.d.ts` for the live type signature.
- White background `#F6F8FB` is locked — keep depth via shadow, scale, and subtle radial gradients, not by changing background.
- Respect `prefers-reduced-motion` on every animated component.

---

## 1. Sprint context

### What PRAXIS is

Policy / diplomacy / political-intelligence workspace. Next.js 16 App Router on Cloud Run. Capsule board with 7 slots (user, situation, path, source, graph, time, output) shipped. Ask PRAXIS routes exist but UI is not yet streaming. MemoDesk has a Tiptap editor with stubbed slash commands. Landing page has a static hero + specimens ticker.

### What we're doing this sprint

Make the workbench feel alive. Real drag-and-drop mix-and-match of cores with visual feedback. Stream Ask PRAXIS framework-walk into the UI. Ship Path Picker visualization. Build Context Readiness radar. Polish memo `/grounded` slash command + Gap Filler. Replace credit displays with subscription tier UI. Refresh landing with the 7th capsule (Path) and orbital animation.

### Strategic constraint

Drop Neo4j visualization for now — Codex defers the projector. Lean fully into the Vertex/Genkit stack the other agent is building. Your UI consumes Codex's new endpoints (`/api/paths`, `/api/context/readiness`, `/api/capsules/{id}/swap`, SSE from `/api/ai/ask-praxis`, etc.).

### Working relationship with Codex

- The other agent owns: Genkit foothold, dotprompt, path schema, 12 route migrations, Genkit tool registry, Ask PRAXIS streaming flow, readiness contract, BigQuery semantic, subscription billing, capsule swap/fork/share APIs, drag-from-rail backend.
- You own: capsule swap drawer UI, path picker visualization, capsule radar, Ask PRAXIS streaming UI, interrupt cards, readiness card, memo grounded UX, lineage tree, working memory pane, subscription gate UI, landing refresh.
- Coordination: every CC prompt below has a matching CX prompt that ships the backend. If your endpoint is missing, ping the CX prompt id in your PR — don't block, build with a mock that matches the contract.
- Persona-smoke CI must stay green. Add new Playwright specs when you touch flows.

---

## 2. Sprint structure

### Sprint 0 — today, 8 hours

Goal by EOD: capsule swap drawer ships with mock backend (real backend lands same day from Codex), Path Picker visualization renders 10 paths from `/api/paths`, Capsule Radar renders from `/api/context/readiness`, and drag-from-rail polish is in place.

| Hour | Prompts |
|---|---|
| 0–2 | CC-1 Capsule swap drawer + drag-from-rail interactions |
| 2–4 | CC-2 Path Picker visualization |
| 4–6 | CC-3 Capsule Radar |
| 6–8 | CC-4 (begin) Ask PRAXIS streaming UI scaffolding |

### Days 1–6

| Day | You ship |
|---|---|
| 1 | Finish CC-1/2/3, complete CC-4 Ask streaming UI |
| 2 | CC-5 Interrupt confirmation card |
| 3 | CC-6 Live Context Readiness card with deep-link fixes |
| 4 | CC-7 Memo `/grounded` + Gap Filler rail |
| 5 | CC-8 Lineage tree + fork/share UI + CC-9 Working Memory pane |
| 6 | CC-10 Subscription gate UI + landing refresh |

Each PR ships with: component tests, Playwright spec when interaction changes, Lighthouse run on landing changes, screenshots in PR body.

---

## 3. Your 10 prompts

### CC-1. Capsule swap drawer + drag-from-rail interactions

Update `src/components/cores/capsule-board.tsx` and `capsule-slot.tsx`. On slot click or drop, open a side drawer `src/components/cores/CoreSwapDrawer.tsx` that fetches `/api/cores/library?kind={slot.kind}` (Codex CX-10), shows ranked options: name, lineage badge, completeness pill, "preview impact" hover showing projected readiness delta. Clicking a core fires `POST /api/capsules/{id}/swap` (Codex CX-7) optimistically; rollback on failure with toast.

Drag-from-rail: dnd-kit accepts external sources from a fixed left rail `src/components/cores/CoreLibraryRail.tsx`. Drop animates with `layoutId` shared element (spring `{stiffness: 240, damping: 28}`). Reduced-motion: instant snap.

**Acceptance**:
- Keyboard accessible (Enter on slot opens drawer, arrow keys nav options).
- Playwright spec `tests/e2e/capsule-swap-drawer.spec.ts` covers drag + click + keyboard paths.
- Storybook story with mock library.

**Research first**: Framer-motion `layoutId`, dnd-kit `DragOverlay` + sensors, WAI-ARIA dialog pattern.

---

### CC-2. Path Picker visualization — radial lens chart + framework chain

Build `src/components/cores/PathPicker.tsx` rendering 10 paths in 5×2 grid (read from `/api/paths`). Each card: icon, name, `PRX-PATH-{id}` serial, color tint.

On hover: card lifts, side preview panel shows:
- **Radial lens chart** (SVG, 9 axes for the 9 lens types, filled polygon = `lensTop3` boost over domain weights)
- **Framework chain** horizontal flow `Glasl → Stedman → Fearon` with arrows
- **Example output snippet** (2-line generated sample from path's prompt voice — Codex returns from a small Genkit flow)

Mount on `/app/contexts` above CapsuleBoard and in onboarding Step 2. Selecting a path triggers `POST /api/capsules/{id}/swap` for the path slot. Animations: Framer `whileHover` lift, radial chart draws on enter (`pathLength` motion).

**Acceptance**:
- 10 paths visible.
- Hover preview correct on all.
- Picker round-trips to capsule.
- `tests/components/path-picker.test.tsx` covers selection.
- Mobile: tap to expand preview (no hover).

---

### CC-3. Capsule Radar visualization — 7-axis completeness

Build `src/components/cores/CapsuleRadar.tsx` rendering a 7-axis radar (User, Situation, Path, Sources, Graph, Time, Output). Axis values 0–1 from `/api/context/readiness` (Codex CX-6). Filled polygon = current state; dashed outer = target (path's `contextRecipe` requirements). Axis labels clickable → opens corresponding swap drawer.

Empty axes pulse amber (`animate={{ opacity: [0.4, 1, 0.4] }}`, `transition: { repeat: Infinity, duration: 2 }`). Mount inline in capsule board header. Build a smaller variant for global header chip click drawer.

**Acceptance**:
- Live updates within 500ms of a swap.
- Axis click opens correct drawer.
- Storybook story with 3 mock states (broken / thin / ready).
- Reduced-motion drops pulse.
- A11y: axes are keyboard-navigable as a listbox.

---

### CC-4. Ask PRAXIS streaming UI with framework-walk cards

Update `src/components/ask/AskWorkspacePage.tsx` to consume SSE from `/api/ai/ask-praxis` (Codex CX-5). Render each streamed step as a stacked card:

- `retrieve` → small chip row "12 claims · 8 actors · 14 events"
- `framework` → full card with framework name header, finding body, citations footer. Color-coded per framework (read from `framework.colorHex`).
- `tool_call` → inline collapsed card "🔧 escalation_monitor → stage 6 · 4 signals" (expand for full output).
- `synthesis` → final answer panel with receipt strip.

Cards stagger-in via `AnimatePresence` + `staggerChildren: 0.05`. Sticky "thinking..." pill while in flight. Pinned **capsule indicator bar** above input: `User · Situation · Path · 5 Sources · 12 Tools` — clicking any opens swap drawer.

**Acceptance**:
- Stream visible end-to-end on seeded Nordalia question.
- ≥ 3 framework cards render.
- `tests/e2e/ask-stream-cards.spec.ts` passes.
- Reduced-motion respect.
- Cancel button aborts the SSE stream cleanly.

**Research first**: `EventSource`, AbortController patterns for SSE, Framer `AnimatePresence` exit anims.

---

### CC-5. Interrupt confirmation card for HITL tools

When Ask PRAXIS hits a Genkit interrupt (Codex CX-4 registers `redline_finder` and `brief_builder` with `interrupt: true`), the SSE stream emits `{ stage: 'interrupt', toolName, request }`. Build `src/components/ask/InterruptCard.tsx`:

- Tool name + intended inputs.
- Why it's confirming (tool description).
- [Approve / Modify / Cancel] buttons.
- Approve → `POST /api/ai/ask-praxis/resume?turnId=&interruptId=` continues the flow.
- Modify → opens inline form to edit inputs before resume.

Animations: slides in with spring, attention pulse on the buttons. Keyboard: Enter approves, Esc cancels.

**Acceptance**:
- Redline-finder triggers card visibly.
- Approve resumes the stream.
- Modify round-trips.
- `tests/e2e/ask-interrupt.spec.ts` covers all three.
- A11y: card is a focus-trapped dialog with proper labels.

---

### CC-6. Live Context Readiness card with deep-link fixes

Build `src/components/context/ContextReadinessCard.tsx`:
- **Compact mode**: 7 colored dots horizontally; click expands.
- **Full panel**: per-core completeness %, lens coverage bar, source-gap chips with claim previews, freshness gauge, token-budget meter.

Reads `/api/context/readiness` (Codex CX-6), polls every 30s when visible, refreshes on capsule mutation events (subscribe to a window event from CC-1's optimistic swap).

Each gap has a "Fix" CTA that deep-links to the right swap drawer (e.g., "Add 2 sources to satisfy path's `sourceMix`"). Pin on `/app/contexts`, `/app/write`, `/app/assistant`. Pulse animations on dots during active Ask flow (subscribe to SSE state).

**Acceptance**:
- Card renders in 3 mount points.
- Gap CTAs deep-link correctly.
- Polling pauses when tab hidden (`document.visibilityState`).
- `tests/components/readiness-card.test.tsx` green.
- A11y: dots are buttons with `aria-label`.

---

### CC-7. Memo `/grounded` slash command + Gap Filler rail

Finish slash-command handling in `src/components/memo/memo-desk.tsx`. Wire `/grounded <topic>` to `POST /api/memos/grounded-paragraph` (Codex builds the Genkit flow + endpoint as part of route migration wave).

Tiptap inserts paragraph + a custom node `<ReceiptInline chunkId={...} sourceId={...} />` per citation; receipts render as footnote markers `[^chunkId]` styled in mono gold. Build the Tiptap React node view at `src/components/memo/nodes/ReceiptInline.tsx`.

A4 styling pass: EB Garamond body 11/16, 2.54cm margins, footnote strip at page bottom (CSS `@page` rules), proper page breaks.

New right rail `src/components/memo/GapFillerRail.tsx`: scans the doc for sentences without `[^...]` markers, lists them as gap chips, each with "Source this" CTA running the grounded flow scoped to the gap text.

**Acceptance**:
- Type `/grounded`, paragraph + receipts appear.
- Gap chips list ungrounded sentences.
- Clicking inserts receipts.
- Mobile pane toggle still works.
- `tests/e2e/memo-grounded.spec.ts` covers full path.

**Research first**: Tiptap custom node views, Handlebars in dotprompt (so you know what the flow returns).

---

### CC-8. Capsule Lineage Tree + fork/share UI

Build `src/components/cores/CapsuleLineageTree.tsx` (D3 force-directed or pure SVG, ~80 LOC). Reads `/api/capsules/{id}/lineage` (Codex CX-7). Renders parent → children tree, current capsule highlighted. Each node clickable to open that capsule.

Add **"Fork this capsule"** button on `/app/contexts/page.tsx` toolbar → calls `/api/capsules/{id}/fork`, navigates to new capsule. **"Share"** button → calls `/api/capsules/{id}/share`, shows modal with signed URL + copy button + expiry.

New page `/app/contexts/import/[token]/page.tsx` validates token via `/api/capsules/import/{token}` and shows accept/decline.

Animations: tree nodes fade-in by depth.

**Acceptance**:
- Fork creates new node visible in tree.
- Share URL round-trips.
- Tree handles depth 5+.
- `tests/e2e/capsule-fork-share.spec.ts` covers all three flows.

---

### CC-9. Working Memory pane (Vertex Memory Bank surface)

Build `src/components/ask/WorkingMemoryPane.tsx`. Right-side collapsible pane in Ask PRAXIS reading `/api/memory/working?capsuleId=` (Codex provisions Vertex Memory Bank in CX-5).

Renders persistent facts grouped by `kind: preference | fact | directive`. Each:
- Editable inline (Enter to save).
- Pin toggle (pinned = always injected).
- Forget button (X icon).

New facts auto-suggested by the Ask flow appear as ghost cards with "Adopt" / "Dismiss" CTAs. Search/filter input at top. Last-used badge per fact.

**Acceptance**:
- Facts persist 24h+ in test environment.
- Pinning round-trips.
- Adoption from suggestion writes to Memory Bank.
- `tests/components/working-memory.test.tsx` covers CRUD.

---

### CC-10. Subscription gate UI + landing page hero refresh

Two coupled deliverables.

**A) Subscription**:
Remove all credit displays from header, sidebar, admin (Codex CX-9 removes server-side). Build `src/components/billing/QuotaIndicator.tsx`:
- Monthly flow counter, tokens used, paths unlocked.
- Soft-warn pill at 80%, hard-block modal at 100% with upgrade CTA.

Build `/app/billing/upgrade` page with 3 plan cards (Free, Practitioner, Team) wired to Stripe Checkout via `POST /api/billing/checkout`. Build `/app/billing/manage` portal redirect. Add `useQuota()` hook reading `/api/billing/quota`.

**B) Landing page hero refresh**:
Update `src/components/landing/phase8-wow-landing.tsx`. Keep white background `#F6F8FB`. CoreCapsuleHero gets the **7th capsule (Path)** prominently — distinct color, microcopy "pick your operator." Six existing capsules orbit slowly (Framer `repeat: Infinity, duration: 24s`). Hover any capsule → it lifts, reveals top-3 frameworks for that core kind.

Specimen cards stagger-in on viewport entry. Ticker rows pulse gold on freshness < 30s. Add subscription tier pricing band beneath specimens.

**Acceptance**:
- Zero credit references in components.
- Stripe test mode works end-to-end (Codex provides webhook).
- Landing animation polished, respects reduced motion.
- Lighthouse ≥ 90 Performance, ≥ 95 Accessibility.
- Both features ship on the same PR (small enough; UI-only).

---

## 4. Cross-cutting rules

- **White background `#F6F8FB` is locked.** Depth via shadow, scale, radial gradients — never bg color shift.
- **Animations**: default spring `{type: 'spring', stiffness: 240, damping: 28}`. Always wrap in `useReducedMotion()` guard.
- **Accessibility**: every interactive element keyboard-navigable, `aria-label` set, dialogs focus-trapped, `prefers-reduced-motion` respected.
- **Design tokens**: Navy `#0F172A`, Emerald `#10B981`, Gold `#E8B931`, Diplomatic Blue `#1B3A5C`. EB Garamond for serif body, Inter for UI, JetBrains Mono for code.
- **No new color tokens** without checking `tailwind.config.ts`.
- **Build verification**: `npx tsc --noEmit` + `npm run build` before every PR.
- **Lighthouse**: run on landing changes, must stay ≥ 90 Performance / ≥ 95 Accessibility.
- **No backend changes** unless explicitly part of a CC prompt — ping Codex if you need an endpoint.

## 5. PR conventions

- Title: `feat(ui): CC-N short description`
- Body: link this brief + the matching CX prompt + screenshots (compact + full panel where relevant) + Playwright run artifact + Lighthouse for landing/perf touches.
- Ping Codex in the description with the CX prompt you depend on. If the backend isn't ready, mock the contract and list it as a blocker.
- Use `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.

## 6. When you get stuck

1. Re-read the matching doc page (Framer, dnd-kit, Tiptap, MDN SSE).
2. Inspect the live API response: `curl /api/<path> | jq` — works only after Codex ships the endpoint.
3. If Codex's endpoint isn't ready, mock it in `src/lib/mocks/` and proceed — flag the contract assumption in the PR.
4. For animation timing, use Framer-motion dev tools or `console.time` per frame.
5. Leave `TODO(claude-code): <question>` comments rather than guessing.

## 7. Mirror agent (Codex) prompt index — for cross-reference

| Claude Code prompt | Codex mirror |
|---|---|
| CC-1 Swap drawer + drag rail | CX-10 Drag-from-rail backend + autosave |
| CC-2 Path picker viz | CX-2 Path schema |
| CC-3 Capsule radar | CX-6 Readiness contract |
| CC-4 Ask streaming UI | CX-5 Ask streaming flow |
| CC-5 Interrupt card | CX-4 Tool registry (interrupts) |
| CC-6 Readiness card | CX-6 Readiness contract |
| CC-7 Memo grounded + Gap Filler | CX-3 Route migration (grounded paragraph flow) |
| CC-8 Lineage tree + fork/share | CX-7 Swap/fork/share APIs |
| CC-9 Working Memory pane | CX-5 Memory Bank wire-up |
| CC-10 Subscription + landing | CX-9 Stripe billing |

End of Claude Code brief. Start with CC-1.
