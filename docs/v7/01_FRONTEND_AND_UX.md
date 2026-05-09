# 01 — Frontend & UX

> **Track A.** This file owns the visual product: landing page, app shell, the four-surface IA, Ask PRAXIS, drag-and-drop core attachment, mobile, accessibility, and the slice plan to ship the rewrite incrementally.
> **Read after `00`.**

---

## 1. The product story we are telling

The new PRAXIS UI tells one story in three sentences:

> **PRAXIS is a workbench for analysts of complex situations.**
> **Open a Situation. Ask PRAXIS. Get a grounded, cited answer or a useful output.**
> **Cores carry your context — preferences, evidence, structure, methodology — so you never start from zero.**

Every page, every empty state, every error state must reinforce that story. If a screen forces the analyst to think about which tool to pick, it has failed the story.

Reference doc the rewrite must keep aligned with: `docs/architecture/PRAXIS_ONE_PAGE.md`. After v7 ships, that doc must read like a description of the live app, not a target.

---

## 2. Landing page (`src/app/(landing)/`)

The landing has 23 sections today (`hero`, `six-steps`, `dialectica`, `live-demo`, `built-for`, `trust`, `pricing-cta`, `waitlist`, `footer`, plus three Dialectica demo sub-components, six step icons, three live-demo screens, hero narrative layers, etc.). It is too long and too dense.

Goals for the landing rewrite:

- **One above-the-fold message:** "Ask PRAXIS about a Situation. Get cited, decision-ready work."
- **One demo CTA** ("Try a Situation") and **one auth CTA** ("Sign in"). No competing waitlist + demo + pricing CTAs in the hero.
- **Five sections only**, in this order:
  1. **Hero** — message, primary CTA, one looping micro-demo of Ask PRAXIS answering on a Situation Core. Reuse `live-demo-screens/` content but compressed.
  2. **How it works** — Situation → Ask → Evidence → Model → Output. Five panels, illustrated. Reuse `six-steps.tsx` but reduced to five.
  3. **What you can do** — three example Situations as click-to-explore guest sessions (Syria, US housing, workplace mediation). Reuse `example-cases-gallery.tsx` and `example-cases-modal.tsx`.
  4. **Trust & evidence** — provenance, audit posture, owner scoping, evidence layers. Reuse `dialectica-trust-score.tsx` and `grounding-backbone.tsx`.
  5. **Built for** — analysts, mediators, policy officers, sanctions teams, humanitarian leads. Reuse `built-for.tsx`.
- **One waitlist module** at the bottom of the page. Pricing moves to `/pricing` and is linked from the footer only — not the hero.
- **Footer** — minimal: legal, security, contact, status, github. Use existing `footer.tsx` shape.

Components to retire from the landing tree:

- `dialectica-firewall-demo.tsx`, `dialectica-graph-3d.tsx`, `dialectica.tsx` — collapse the three Dialectica components into one explainer card inside §4 Trust.
- `methodology-section.tsx`, `problem-section.tsx`, `security-section.tsx`, `syria-case-proof.tsx` — fold key sentences into other sections. The `_archive/` folder absorbs the rest.
- `hero-narrative-layers/`, `hero-quadrant-tour.tsx`, `hero-visual.tsx` — keep one, retire the others. The hero must load fast.
- `pricing-teaser.tsx` — remove from landing; it lives at `/pricing` only.

JSON-LD, OG image, sitemap, robots, Sentry config: leave in place. They work.

`audit:landing-bundle` and `audit:legal-pages-present` must continue to pass.

---

## 3. App shell (`src/components/app/app-shell.tsx`, `app-sidebar.tsx`, `header.tsx`)

The shell collapses from "sidebar with 30+ items + header + floating PRAXIS + debug + activity + onboarding banner" to:

- **Header** (top): app logo, current Situation pill (clickable, opens Situation switcher), Ask shortcut hint (⌘K), user menu.
- **Sidebar** (left, collapsible): four sections only — Home, Ask, Cores Library, Outputs. Plus a small "recent cores" panel at the bottom showing the user's last 5 cores as drag handles.
- **Main pane** (centre): the active destination renders here.
- **Right rail** (only on Home and Ask): suggestions, attached cores, gaps. On all other destinations the right rail is collapsed by default.

Removed from the shell:

- Floating PRAXIS button (replaced by the Ask bar on Home and the global ⌘K palette everywhere).
- Debug panel and activity panel as default-mounted children. They live under **Cores Library → Diagnostics** and only mount there.
- The `ARCHIVE_LINKS` array in `app-sidebar.tsx`. Those routes still exist but are not surfaced in the sidebar; they redirect to their v7 destination.
- The "Workbench" section heading and the WORKBENCH_TABS rendering loop. The workbench concept is gone.

The auth flow stays as-is: `AuthProvider` wraps the shell, the middleware checks the session cookie, demo mode keeps the demo banner. None of that changes.

`audit:routes` must continue to pass after the route reshuffle. Codex must add to `scripts/audit-ai-routes.mjs` (or a new `audit:v7-ia.ts`) the assertion that exactly four top-level destinations exist.

---

## 4. The four surfaces in detail

### 4.1 Home (`/app/home`)

The new index. Replaces `/app/dashboard` (which redirects).

Layout:

- **Hero card.** "Welcome back, {name}. You are working on {Situation}." Right-side dropdown to switch Situation.
- **Ask bar.** Always visible, always focused on first paint. Placeholder: "Ask PRAXIS about {Situation}…". Below the input: a strip of attached cores chips (User Core always; Situation Core default; "+ Attach core" affordance). Drag-and-drop a core from the sidebar onto this strip to attach.
- **Next actions rail** (right). Pulled from PRAXIS-suggested gaps: "Three claims have no source", "Timeline missing 2024 events", "Stakeholder map has no power scoring". Each is a clickable card that opens the relevant Situation panel pre-scrolled to the gap, or runs a skill via Ask.
- **Recent Situations strip** (bottom). Clickable cards. Includes a "+ New Situation" tile.

Nothing else. No dashboard widgets, no metrics tiles, no graph orbit. Those move to `Situation → Overview`.

### 4.2 Ask (`/app/ask`, also `/app/ask/[threadId]`)

Full-screen Ask PRAXIS. This is the engine surface.

Layout:

- **Top bar.** Attached cores chips (drag-and-drop reorderable). "Mode" selector: `Quick`, `Deep research`, `Plan`, `Memo`. Default `Quick`.
- **Conversation thread.** Reuses `src/components/assistant/chat-interface.tsx`. Citations stay clickable, mutation cards stay confirm-required.
- **Suggestion rail** (right). Three buckets: "Suggested questions" (from `praxis-suggest.tsx`), "Likely skills" (the routing layer's top 3 candidate skills with confidence), "Likely outputs" ("Draft this as a memo", "Export to brief").
- **Input bar.** Multiline, with a mode pill, an attach-core chip, and a "Run" button. Cmd+Enter submits.

Modes:

- **Quick** — single-pass answer with retrieval over attached cores. Cheap model.
- **Deep research** — replaces today's `chapters/research/`. Multi-step, multi-source, longer latency, audit-marked.
- **Plan** — produces a checklist of next actions, each individually executable via "Run this step".
- **Memo / Brief** — long-form output that lands in **Outputs** as a draft.

Threads persist. Each thread is owner-scoped, attached to a Situation by default but can be detached. A thread can be promoted to a memo or saved into the Situation Core as a research thread.

### 4.3 Cores Library (`/app/cores`)

The Cores Library is the single structured-context surface. It replaces separate top-level Situation, Sources, and Advanced destinations. Compatibility routes (`/app/situation`, `/app/sources`, `/app/advanced`) may remain during migration, but they must render or redirect into this surface.

It has six progressive panels, not six navigation tabs:

1. **Situation Core** — frame, goals, geography, tags, ontology binding, owner, sharing, actors, timeline, hypotheses, gaps.
2. **Source + Document Cores** — source receipts, uploaded files, extraction status, credibility, coverage, dedupe, and source gaps.
3. **Graph Core** — ACO graph, ontology binding, primitive filters, graph operations, candidate/canonical posture.
4. **Team/User Cores** — user preferences, voice, methodology defaults, team terminology, approved sources, sharing grants.
5. **Analyst Skills** — the skills registry as a capability source for Ask PRAXIS, not a 50-button dashboard.
6. **Specialist panels** — ACH, Boardroom, GraphOps, Sanctions, Media Compass, Methodology, Diagnostics, Settings, Admin, and Profile.

A right rail on every panel shows attached cores, recent Ask threads, and "Ask PRAXIS about this" with the top 3 routing candidates.

### 4.4 Outputs (`/app/outputs`)

The Output Core editor.

Two panels:

1. **My outputs** — list of memos, briefs, drafts, talking points, board packs, exports. Filterable by Situation, type, status (draft / review / final). Each output card shows last edited, owner, sharing state, provenance integrity score.
2. **New output** — pick a template (Policy memo, Decision brief, Talking points, Handover, Board pack, Custom). Each template launches a guided flow that pre-attaches the relevant Situation Core, asks for outline confirmation, and drafts via the routing layer.

Absorbs `chapters/desk/`, `chapters/memos/`, `chapters/draft/`, `chapters/boardroom/` (the briefing produce side), `/briefing`, and the Briefing Studio. Editing reuses the existing TipTap stack from `package.json`.

The provenance integrity score visible on every output is computed from: % of claims with at least one citation, % of citations that resolve to a graph node or source receipt, and % of canonical-vs-candidate cited material. Threshold for "final" is 100% claim coverage.

The old Advanced concept is no longer a top-level destination. It exists only as a compatibility route and as specialist panels inside Cores Library.

---

## 5. Ask PRAXIS — the command plane

Ask is the most important surface in v7. It must be excellent.

### 5.1 Behaviour contract

When a user submits a query in Ask:

1. The frontend bundles: the query text, the current Mode, the active Situation ID, the attached core IDs (User, Situation, plus optional cores), the conversation thread ID.
2. The backend resolves cores → assembled `CalibrationContext` → `withCalibration` system prompt block (this contract already exists; reuse it).
3. The routing layer (Track D §3) decides: direct answer, run a skill, run a subagent plan, ask a clarifying question.
4. Every assistant turn includes: the answer, citations linked to source receipts or graph nodes, a "what skill ran" footer, and an "uncertainty note" when retrieval was thin.
5. Mutation actions (e.g., "promote this candidate edge") render as `MutationConfirmCard` and require an explicit click. No silent writes.

### 5.2 Drag-and-drop core attachment

`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` are already in `package.json`. Use them.

- The sidebar Cores panel renders each of the user's recent cores as a draggable chip with a type icon (User, Situation, Source, Document, Graph, Output, Team).
- The Ask bar's attached-cores strip is a drop zone. Drag from sidebar → drop on strip. The strip becomes sortable.
- Removing a core: click the × on the chip, or drag it out of the strip.
- Right-click (or three-dot menu) on a chip: View core, Open core in editor, Detach, Pin to thread.
- On mobile, the drag interaction is replaced by a "+ Attach core" sheet listing the user's cores grouped by type.

The drag handle and the chip styling must be consistent across the sidebar and the Ask strip — same component.

### 5.3 Tool/skill picker (manual override)

Sometimes the user wants to run a specific skill, not let routing pick. The Ask bar offers a slash command: typing `/` opens a list of analyst skills filtered as the user types. Selecting one inserts a chip into the bar and constrains the run to that skill. The skill's required inputs are surfaced as inline pills the user can fill from attached cores.

Skill selection from sidebar drag-and-drop also works: dragging a skill chip from **Cores Library → Analyst Skills** onto the Ask bar produces the same effect.

### 5.4 Empty states

The Ask bar is never blank-ugly. When there is no thread:

- Show three suggested prompts pulled from the active Situation's gaps.
- Show "Try one of these Skills on this Situation" with three routing-layer candidates.
- Show a "What is Ask PRAXIS?" link to a one-paragraph explainer (auto-dismissed after first use).

When there is no active Situation: prompt the user to open one. Offer "Open demo Situation" for guests.

---

## 6. Cores UI — sidebar panel and core editor

### 6.1 Sidebar panel

A small fixed-height panel at the bottom of the sidebar:

- Section header "My cores" with a `+` button (creates a new core; opens picker for type).
- A scrollable list of the user's most recently used cores (mixed types), max 10 items shown, expand to see all.
- Each row: type icon, name, "edit" hover action, "drag handle" cursor.

### 6.2 Core editor

Opening a core (from sidebar, Ask chip menu, or `/app/cores/[id]`) shows a focused editor:

- **Header**: name, type, owner, sharing state, last updated, version.
- **Tabs**: Contents, Inheritance, Sharing, History.
- **Contents** layout depends on type — see `03` §3 for per-type fields.

Edits are autosaved. Changing the parent core re-runs the inheritance preview before applying.

### 6.3 Core library page

A single page at `/app/cores` that lists all cores the user owns or has access to, with filters by type, owner (me/team/shared with me), tag, recency. Bulk actions: share, archive, fork.

This page is the third top-level destination. It is reachable from the primary navigation, the sidebar Cores panel header, and the user menu.

---

## 7. Visual language

The repo already has a coherent design system: Tailwind, Radix UI primitives, lucide-react icons, custom CSS vars (`--color-app-border`, `--color-app-sidebar`, `--color-app-surface-alt`), navy/diplomatic-blue palette.

Keep it. The rewrite is structural, not a re-skin. Specific guidance:

- Continue using the existing CSS variables; add new ones only if a current variable cannot express the need.
- Continue using `lucide-react` icons. Pick one icon per concept and reuse: Home (`Home`), Ask (`Sparkles` or `MessageSquare`), Cores Library (`Boxes`), Outputs (`FileText`), and each core type one specific icon.
- Continue using Radix dialogs/dropdowns. No bespoke modal primitives.
- Tone: serious, not playful. Empty states use plain language. No jargon in CTAs ("Open Situation", not "Initialize case context").

Frontend design skill: when generating any new page or component, Codex should consult `/mnt/skills/public/frontend-design/SKILL.md` first to align with the repo's conventions.

---

## 8. Mobile

The app must work at 380 px. The current `app-shell.tsx` already detects mobile via `matchMedia('(max-width: 768px)')`. Extend that:

- **Mobile shell**: header collapses to a hamburger + Situation pill + Ask shortcut. Sidebar becomes a sheet that slides in.
- **Four surfaces** become a bottom tab bar on mobile: Home, Ask, Cores, Outputs.
- **Ask bar on mobile**: full-screen sheet on focus. Attached cores strip becomes a horizontally scrollable row above the input.
- **Drag-and-drop**: replaced by an "+ Attach core" sheet. Same data, different interaction.
- **Right rail**: hidden on mobile; surfaced via a "i" button in the header that opens it as a sheet.

Touch targets ≥ 44 px. Forms use `font-size: 16px` to prevent iOS zoom.

---

## 9. Accessibility

WCAG 2.1 AA, no exceptions.

- All interactive elements keyboard-reachable in DOM order.
- Visible focus rings (use Tailwind's `focus-visible:` utilities).
- Skip-to-content link in the shell.
- Live-region announcements for: new assistant message, skill running, mutation confirmation required, error states.
- Form fields have programmatic labels; error messages are associated via `aria-describedby`.
- Drag-and-drop has a keyboard fallback: focus a core chip, press Space to "lift", arrow keys to choose drop zone, Space to drop.
- Colour contrast checked with `audit:ux-polish` (extend it).
- Screen reader pass on Home and Ask before each release.

---

## 10. Slice plan (how to ship without breaking prod)

The rewrite ships in nine slices. Each slice is a 2–5 day chunk of work that lands on `main` behind a feature flag and passes the audit gate.

| # | Slice | Flag | Notes |
|---|---|---|---|
| 1 | **Foundations.** New `core_*` tables (Track B), TS domain types for cores (Track C), feature flag `NEXT_PUBLIC_PRAXIS_V7`, new `/app/v7/*` route group cloned from `/app/*`. | flag default false | No user-visible change. |
| 2 | **App shell skeleton.** New header, new sidebar/bottom-nav preview with four surfaces, new Cores panel stub. Renders only under the flag. | flag default false | Old shell unchanged. |
| 3 | **Home.** Welcome card, Ask bar (stub backend), Next actions rail (mocked), Recent Situations strip. | flag default false | |
| 4 | **Ask end-to-end.** Conversation thread wired to backend, drag-and-drop core attachment, Quick mode. | flag default false | Citations and mutation cards from existing assistant components. |
| 5 | **Cores Library.** Situation, Source, Document, Graph, User, Team, Analyst Skills, and specialist panels. Old Context/Library/Ontology/Graph tabs hidden under v7 flag. | flag default false | Compatibility routes render into Cores. |
| 6 | **Source/Document Cores.** Library, Inbox, Coverage, Source Scout, and Documents consolidated inside Cores Library. | flag default false | This is a sub-slice of Cores, not a fifth surface. |
| 7 | **Outputs.** My outputs, New output flow with templates. Memos/Draft/Briefing/Boardroom-produce redirects in place. | flag default false | |
| 8 | **Specialist panels.** ACH/GraphOps/Sanctions/Media/Methodology/Diagnostics/Settings/Admin/Profile and Analyst Skills live inside Cores Library. | flag default false | No primary Advanced destination. |
| 9 | **Cutover.** Flip flag default to true. Old shell reachable at `/app/legacy/*` for one release. Deprecation banner on legacy. Then remove legacy after one cycle. | flag default true | Final. |

Each slice opens a single PR against `main`, lands green, and updates `docs/v7/STATUS.md`.

---

## 11. Audits to add (Track A specific)

In addition to the existing audits that must keep passing, add:

- `audit:v7-ia` — exactly four top-level destinations under `/app/(v7)/` (or after cutover, under `/app/`). Fail if a fifth is added.
- `audit:v7-redirects` — every legacy route returns 301 to its v7 destination. Driven by a `legacy-route-map.ts` source of truth.
- `audit:ask-shape` — Ask page renders the attached-cores strip, mode selector, conversation thread, and suggestion rail. Static check.
- `audit:landing-five-sections` — landing has exactly five sections in the new order. Prevents drift.
- `audit:cores-sidebar-present` — every authenticated page renders the Cores sidebar panel.

These run inside `npm run audit:gate`.

---

## 12. Testing posture

- **Unit (vitest)** — every new hook, store, and utility under `src/lib/cores/`, `src/lib/ask/`, and `src/components/v7/` has unit tests.
- **Component (vitest + @testing-library)** — Ask bar, attached-cores strip, drag-and-drop, mode selector, Source Core row, Outputs template picker.
- **E2E (playwright)** — three flows: (a) sign in → Home → ask a question → see citations → save as memo; (b) open Situation → drag a core onto Ask → ask → see different answer; (c) create new Situation forking from existing Situation Core → confirm inheritance.

Existing playwright config is in place. Add a `tests/v7/` folder.

---

## 13. Performance budget

- Landing: Lighthouse Performance ≥ 85 on slow 4G, LCP < 2.5 s, CLS < 0.05.
- App Home: TTI < 3 s on cold cache on Cloud Run; Ask first-token < 1.5 s for Quick mode.
- Bundle: do not increase the existing `app/` bundle by more than 15% net at slice 9 (the goal is to *decrease* it by removing the old shell, but +15% is the ceiling during slices 1–8).
- No client-side libraries with > 60 kb gzip added without a justification line in the PR.

---

## 14. What "frontend done" looks like

The Track A definition of done is the §9 list in `00`, but specifically for the frontend:

- All four surfaces exist, are reachable, and pass `audit:v7-ia`.
- Ask renders end-to-end with attached cores, modes, citations, mutation cards, and suggestion rail.
- Drag-and-drop attachment works on desktop; mobile sheet equivalent works on mobile.
- Landing has five sections, hero CTA leads to demo Situation, Lighthouse ≥ 85.
- Legacy routes redirect.
- Mobile passes design + accessibility review at 380 px.
- All Track A audits green.
- `STATUS.md` says Track A v7 shipped.

If any of those is not true, Track A is not done.
