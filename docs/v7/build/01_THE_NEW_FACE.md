# THE NEW FACE

> **Path:** `docs/v7/build/01_THE_NEW_FACE.md`
> **What this is:** the concrete spec for what the user sees in v7. Homepage,
> landing page, the Ask surface, the cores picker, the tools strip. Visual,
> opinionated, paste-into-Figma specific.
> **Read alongside:** the 5 strategic briefs in `docs/v7/00..04`. This doc
> is the execution layer, not a replacement.
> **Iteration model:** four loops, each shippable as one PR. A loop ends
> when its acceptance gate is green and the loop's screenshot diff is
> reviewed.

---

## The product story, one sentence

> **PRAXIS v7 is a single page where an analyst types a question, picks the cores that frame it, and gets cited, decision-grade work — with everything else (situations, sources, outputs, skills) one click away.**

Everything in this doc serves that sentence. If a screen, a button, or a link does not, cut it.

---

## The mental model the user must form in 10 seconds

When a first-time user lands on the authenticated app, they should grasp this without reading any copy:

1. **There's a bar.** I type my question here.
2. **Above the bar there are some chips.** Those are the cores — they tell PRAXIS who I am, what situations are attached, and which methodology/source/rubric should frame the answer.
3. **Below the bar there are a few tools.** They wake up once at least one Situation Core is picked or created.
4. **To the right there's a small panel.** It tells me what's missing, what's next.
5. **At the top left there's a workspace switcher.** That's where I jump to a different case, output, or settings.

Five things. No tabs. No archive sidebar. No floating button. No tool grid demanding triage.

---

## Loop 1 — The new homepage (`/app/home`)

**Goal of this loop:** ship the Ask-first homepage, with stub data flowing through real backend endpoints. Stub responses are fine; the surface is what matters.

### Layout (desktop, 1440×900 reference)

```
┌──────────────────────────────────────────────────────────────────────┐
│  [PRAXIS]  ▾ My workspace · No Situation selected  ⌘K   👤 GC       │  ← header (56px)
├────┬─────────────────────────────────────────────────────────────────┤
│    │                                                                 │
│ Q  │   My workspace                                                  │
│ ★  │   Pick or create a Situation Core to start.                     │
│ S  │                                                                 │
│ R  │   ┌───────────────────────────────────────────────────────┐     │
│ O  │   │ 🟦 User Core · + attach core                         │     │  ← empty cores strip
│ A  │   │                                                       │     │
│    │   │  Pick or create a Situation Core to start             │     │  ← disabled ask bar
│    │   │                                                       │     │  (multiline,
│    │   │                                      [Ask disabled]  │     │   visible on
│    │   └───────────────────────────────────────────────────────┘     │   first paint)
│    │   Quick · Deep · Plan · Memo · Brief                            │  ← disabled mode strip
│    │                                                                 │
│    │   Available after you attach a Situation:                       │
│    │   [Stakeholder map] [Timeline] [Devil's advocate] [Find gaps]   │  ← 4 grey tools
│    │                                                                 │
│    │   ─────────────────────────────────────────────────────         │
│    │                                                                 │
│    │   What's missing right now                  Recent              │
│    │   ┌──────────────────────────┐    ┌────────────────────┐        │
│    │   │ Attach a Situation Core  │    │ No recent work yet │        │
│    │   │ to compute gaps.         │    │                    │        │
│    │   │                          │    │                    │        │
│    │   └──────────────────────────┘    └────────────────────┘        │
│    │                                                                 │
└────┴─────────────────────────────────────────────────────────────────┘
```

The left rail is the **cores rail**: 5 icons stacked (Q=Ask threads, ★=Cores, S=Situations, R=Sources, O=Outputs, A=Advanced). Hover expands. This is the *only* persistent navigation.

### Header

- Left: logo. Click → `/app/home`.
- Center: workspace + active situation pill. Click → opens the first-class core picker (a Radix `Combobox` with search and examples). The pill defaults to **"No Situation selected"** until the user attaches at least one Situation Core.
- Right: ⌘K palette trigger, user menu (Profile, Settings, Sign out).
- No "Ask PRAXIS" button in the header. The Ask bar is the page.

### Cores strip (above the Ask bar)

A horizontal row of reorderable chips. Always shows:
- **User Core** chip (blue, with the user's avatar and short name)

Everything else is optional and explicit. The user can attach zero, one, or many Situation Cores to an Ask thread, plus methodology, team-rubric, source, document, graph, and output cores. The "+ attach core" affordance is prominent on the homepage, not hidden behind a dropdown.

When more than one Situation Core is attached, a small warning appears under the strip: **"Two Situations attached — answers will reference both."** The warning does not block submission.

Each chip:
- Click → opens that core's quick-edit popover (read summary + jump to full editor).
- Hover → tooltip showing what fields the core contributes to the calibration.
- × on hover → detach (User Core cannot be removed; all other cores can).
- Drag handle → re-order.

### Ask bar

- One multiline `textarea`, sized to grow as the user types (max 6 lines before scroll).
- Empty homepage placeholder: `Pick or create a Situation Core to start`.
- Active placeholder: `Ask PRAXIS about a Situation...` or `Ask PRAXIS across {n} attached cores...`.
- Submit: `Cmd/Ctrl + Enter` or the `[⏎ Ask]` button. `Enter` alone inserts a newline.
- Below: the **mode strip** (Quick · Deep · Plan · Memo · Brief). Default `Quick`. The selected mode is highlighted with the existing diplomatic-blue accent.
- Slash commands: typing `/` opens the **skill picker** (filterable list of the 57 skills, grouped by category).
- Submitting opens `/app/ask/{newThreadId}` and streams the response. Home is not a chat — it's a launcher.

### Tools strip (below mode)

Four tool cards, large enough to tap on mobile:
- **Stakeholder map** → runs `cross.stakeholder-power-interest` against the active Situation Core, opens the result in Ask.
- **Timeline** → runs the timeline view from `tabs/graph/` against the situation.
- **Devil's advocate** → runs `cross.devils-advocate` on the most recent claim or memo.
- **Find gaps** → runs the gaps analysis from `chapters/desk/` and drops the result into the right rail.

These four are not the only tools — they're the most-asked starts. A small "see all skills" link below leads to `/app/advanced/skills`.

The four can be reordered per User Core preference (later loop). For loop 1: hardcode the four above.

In the empty state all four render as greyed-out cards with the same disabled reason: "Attach a Situation Core first." They become active as soon as at least one compatible Situation Core is attached.

### What's missing + Recent (right column on home, two stacked cards)

- **What's missing**: top 3 gaps from the situation, each clickable to jump to the relevant Situation panel pre-scrolled. Pulled from existing `chapters/desk/` "next actions" logic.
- **Recent**: last 5 outputs and ask threads, clickable.

### Empty states

- **No active Situation** → the homepage stays generic. It shows the workspace name, only the User Core chip, disabled Ask copy **"Pick or create a Situation Core to start"**, and four greyed-out tools. Primary CTA: "Browse example Situation Cores" → `/app/cores?examples=1`. Secondary: "Create new Situation".
- **No cores attached besides User Core** → the cores strip shows a prominent "+ attach core" button.
- **No "what's missing"** → the card collapses to a one-liner: "Looks complete. Try a stress test in Devil's advocate."

### Seeded example Situation Cores

Syria is not the product and never the default empty state. It is one seed in the shared example library at `/app/cores?examples=1`.

Codex should keep 6-10 diverse seeds covering all 9 ontologies. Required seeds include:
- Syria 2026 transition
- US housing access California
- Workplace mediation
- Sanctions-evasion case
- Humanitarian access NES
- Governance transition Tunisia
- Narrative laundering case
- Treaty interpretation case

Methodology and team-rubric cores are also first-class examples in the same picker, so the user can attach a Situation plus a methodology/rubric/source core before asking.

### Loop 1 acceptance

- [ ] `/app/home` renders the layout above behind the v7 flag.
- [ ] Ask bar focused on first paint, ⌘K palette works.
- [ ] Empty state renders generic workspace name, User Core only, disabled Ask copy, and four greyed-out tools.
- [ ] User Core renders with real data; Situation Core chips render only after the user attaches or creates one (synthesize cores from existing user profile + situation row for now; full cores schema lands in Loop 4).
- [ ] `/app/cores?examples=1` exposes 6-10 seeded examples, including methodology and rubric cores.
- [ ] Submitting the Ask bar opens `/app/ask/{id}` and streams a stub response with a "you asked about X" reply (real routing in Loop 2).
- [ ] Four tools strip cards trigger their respective existing flows (route to the existing `/app/tools/...` URLs is acceptable for loop 1).
- [ ] Mobile view at 380px: header collapses to hamburger + situation pill + ⌘K, cores rail moves to bottom nav, tools strip becomes a horizontally scrollable row.
- [ ] Lighthouse perf ≥ 85 on home (slow 4G simulated).
- [ ] `npm run audit:gate` green.

---

## Loop 2 — The Ask surface (`/app/ask/[threadId]`)

**Goal of this loop:** turn the homepage submit into a real conversation surface with real routing.

### Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  [PRAXIS]  ▾ My workspace · Syria 2026          ⌘K   👤 GC          │
├────┬─────────────────────────────────────────────────────────────────┤
│    │  ← Back to home                                                 │
│ Q  │                                                                 │
│ ★  │  🟦 You · 🟪 Syria 2026 · + attach core                         │
│ S  │  Mode: Quick                                          🔧 cross.… │  ← skill chip
│ R  │                                                                 │     (if locked)
│ O  │  ┌──────────────────────────────────────┐ ┌────────────────┐    │
│ A  │  │ User: Build me a stakeholder map…    │ │ Suggested next │    │
│    │  │                                      │ │ • Add timeline │    │
│    │  │ PRAXIS: Here's what I see (4 actors, │ │ • Find gaps    │    │
│    │  │ 2 claims with thin sources)…         │ │ • Draft memo   │    │
│    │  │ [📎 cite: source receipt 12]         │ │                │    │
│    │  │ [📎 cite: graph node act_alpha]      │ │ Likely skills  │    │
│    │  │ [Promote to canonical?] (button)     │ │ • stakeholder… │    │
│    │  │                                      │ │ • timeline     │    │
│    │  │ User: Now find me 3 contradictions…  │ │ • contradict…  │    │
│    │  │ ...                                  │ │                │    │
│    │  └──────────────────────────────────────┘ │ Save as        │    │
│    │  ┌──────────────────────────────────────┐ │ • Memo         │    │
│    │  │ Type follow-up…              [⏎ Ask] │ │ • Brief        │    │
│    │  └──────────────────────────────────────┘ │ • Talking pts  │    │
│    │  Quick · Deep · Plan · Memo · Brief      └────────────────┘    │
└────┴─────────────────────────────────────────────────────────────────┘
```

### Behaviour

- Each turn shows the user message, then PRAXIS's reply with citations as chips. Citations open a popover with the source receipt or graph node summary + jump to source.
- Mutation actions (e.g., "Promote to canonical?") render as the existing `MutationConfirmCard` and require explicit click before any write.
- The right rail has three zones: **Suggested next** (3 follow-ups based on the latest answer), **Likely skills** (top 3 routing candidates), **Save as** (one click promotes the conversation to memo/brief/talking points).
- The skill chip on the top right is visible only when the user locked a specific skill via `/skill_name` or via "run with a tool".
- Deep mode: a progress indicator stream shows the multi-step plan ("1. Searching sources... 2. Cross-checking against graph... 3. Drafting answer...").
- Plan mode: response is a numbered checklist, each step with a "Run this step" button.
- Memo / Brief modes: the conversation produces a draft that opens in `/app/outputs/{id}` after the response completes; the Ask thread retains a "view draft" link.

### Loop 2 acceptance

- [ ] `/app/ask/[id]` renders the layout above.
- [ ] Routing layer (per `04` brief) picks one of: direct answer, run skill, run subagent plan, clarify. Streams to the UI.
- [ ] Citations are clickable and resolve to existing source receipts or graph nodes.
- [ ] Mode switcher actually changes routing behaviour (Quick = single pass, Deep = multi-step, Plan = checklist, Memo/Brief = produce output).
- [ ] Slash commands open the skill picker; selecting a skill locks it for the next submit.
- [ ] Promote-to-output (right rail) creates a real entry in Outputs.
- [ ] Conversation persists across refresh (server-stored thread).
- [ ] No direct OpenAI/Anthropic SDK calls — Vertex only. `audit:ai-provider-isolation` green.
- [ ] `npm run audit:gate` green.

---

## Loop 3 — The new landing (`/`)

**Goal of this loop:** make the public landing match the simplified app. Five sections, one above-the-fold message, one hero CTA, no marketing bloat.

### The five sections, in order

1. **Hero** — full viewport. One headline, one sub-line, one CTA, one micro-demo loop.
   - Headline: **"Ask PRAXIS about a Situation."**
   - Sub-line: *"A workbench for analysts of conflicts, policy, and complex human friction. Cited, decision-grade work in five minutes, not five days."*
   - CTA: `[ Try the demo ]` (opens `/app/cores?examples=1` so the user picks a seeded Situation Core)
   - Secondary: `Sign in` (small, top-right of the section)
   - Right side: a 12-second screen capture loop rotating through three seeded examples with the generic prompt frame "Ask PRAXIS about a Situation." Use the existing `live-platform-preview.tsx` style as a starting point but compress.

2. **How it works** — 5 panels in a row, with one icon each.
   `Open a Situation` → `Ask PRAXIS` → `Build evidence` → `Model the conflict` → `Produce the output`
   Each panel: 60-word description, one screenshot, an outline-only diagram. Reuse `how-it-works.tsx`.

3. **What you can do** — 6-10 example cores in a compact gallery, covering all 9 ontologies.
   - Syria 2026 transition
   - US housing access California
   - Workplace mediation case
   - Sanctions-evasion case
   - Humanitarian access NES
   - Governance transition Tunisia
   - Narrative laundering case
   - Treaty interpretation case
   Each opens `/app/cores?examples=1` with that example highlighted. Reuse `example-cases-gallery.tsx`, `example-cases-modal.tsx`. Drop the rest of the example case bloat.

4. **Trust & evidence** — provenance, audit posture, owner scoping, evidence layers. One panel, four small claims with proof links:
   - Every claim cites a source.
   - Candidate vs canonical: AI extractions never silently overwrite truth.
   - Owner-scoped: your data is yours.
   - Vertex-routed: no model leakage to third parties.
   Reuse `dialectica-trust-score.tsx`, `grounding-backbone.tsx`. Drop the three Dialectica components.

5. **Built for** — analysts, mediators, policy officers, sanctions teams, humanitarian leads. Five logos or role pictograms. Reuse `built-for.tsx`. Below: a single waitlist module (drop the pricing teaser).

Footer: minimal — Legal, Security, Contact, Status, Github. Pricing link only in the footer.

### Components to retire

Move to `_archive/` (don't delete):
- `dialectica-firewall-demo.tsx`, `dialectica-graph-3d.tsx`, `dialectica.tsx`
- `methodology-section.tsx`, `problem-section.tsx`, `security-section.tsx`, `syria-case-proof.tsx`
- `hero-narrative-layers/`, `hero-quadrant-tour.tsx`
- `pricing-teaser.tsx`
- `agentic-app-section.tsx` (its content folds into "How it works")
- `conflict-grammar-highlight.tsx` (folds into "Trust & evidence")
- `features.tsx` (its content is implicit in the new structure)

Anything in `_archive/` that hasn't been resurrected stays archived.

### Loop 3 acceptance

- [ ] Landing renders five sections in order, no others.
- [ ] Hero CTA opens `/app/cores?examples=1`; choosing any seed opens `/app/home` with that Situation Core attached in guest mode (no auth required for first 5 minutes; soft sign-in prompt after).
- [ ] Lighthouse perf ≥ 85, LCP < 2.5s, CLS < 0.05.
- [ ] All retired components moved to `_archive/`, not deleted.
- [ ] `audit:landing-bundle` and `audit:legal-pages-present` green.
- [ ] `audit:landing-five-sections` (new) green: exactly five top-level sections.
- [ ] Mobile at 380px: hero stacks, nav collapses, every section legible.

---

## Loop 4 — In-page core editing (the hard one)

**Goal of this loop:** the cores strip on the homepage and Ask surface becomes more than chips. Users can create, edit, and fork cores without leaving the page.

This loop depends on the cores schema landing first (per Brief 02 §2) and the cores TypeScript domain (per Brief 03 §3). Don't start this loop until that's merged.

### What "in-page" means

- Click a core chip → a **side drawer** opens from the right (Radix `Sheet`). Not a new page. Not a modal. The Ask bar remains visible behind it.
- Drawer header: core name (editable inline), core type icon, sharing state, three-dot menu.
- Drawer body: the type-appropriate editor (per Brief 03 §3 schemas):
  - **User Core** drawer: role, mandate, language, jurisdiction, style preferences, model preferences, default attached cores.
  - **Situation Core** drawer: frame (4 fields), goals, geography, ontology binding, hypotheses, gaps. Tabs for Actors, Timeline, Hypotheses (each pulling from the existing graph / timeline data).
  - **Source Core** drawer: credibility rules, coverage targets, list of source receipts.
  - **Output Core** drawer: template, branding, list of outputs.
- Edits are autosaved (debounced 600ms). Saving status indicator in the drawer header.
- Closing the drawer commits the last save and returns to the page below.

### Creating a new core

From any "+ attach core" or "+ new" affordance:
1. A small popover opens with a type picker (User clones not allowed mid-session; Situation, Source, Document, Graph, Output are creatable).
2. After type selection, the side drawer opens in **create** mode with required fields highlighted.
3. Save creates the core, attaches it to the current thread, and closes the drawer.
4. For Situation Cores: an optional "Fork from existing" toggle in the create drawer lets the user pick a parent. Forking pre-fills the frame and methodology.

### Editing an existing core

- Click a core chip in the strip → drawer opens in **view** mode.
- Click any field → field becomes editable inline. Tab to next field. Esc cancels. Cmd+S saves immediately.
- Three-dot menu: Fork, Share, Archive, Open in full editor (`/app/cores/[id]`).

### Forking a Situation Core

- The most important interaction. From the Situation Core drawer's three-dot menu → **Fork into new Situation**.
- A small wizard inside the drawer:
  1. Name for the new Situation.
  2. Checkboxes: copy frame? copy methodology? link sources by inheritance? copy ontology binding?
  3. `[ Create ]`
- Result: new Situation Core created with `parent_core_id` set; user is prompted "Open the new Situation now?" → if yes, header pill swaps to the new Situation and Home reloads with the new context.

### Sharing a core (loop 4 minimum)

- From the three-dot menu → **Share**.
- A small dialog shows current grants and lets the user add a new one (by email, by team, or by link).
- Roles: viewer / editor / owner. Default viewer.
- Public link sharing remains hidden behind a flag in v7 (per Brief 02 §16 Q2).

### Loop 4 acceptance

- [ ] All four core-type drawers render and persist edits via the new `cores` API (Brief 02 §3).
- [ ] Creating a core works from the homepage and the Ask surface.
- [ ] Forking a Situation Core works and the resulting core has `parent_core_id` set.
- [ ] Sharing dialog adds and revokes grants; shared cores appear in the recipient's cores rail.
- [ ] Drawer is keyboard-accessible (Tab order, Esc closes, Cmd+S saves).
- [ ] Mobile: drawer becomes a full-screen sheet, not a side panel.
- [ ] `audit:cores-schema`, `audit:cores-types-parity`, `audit:cores-owner-scoping` all green.
- [ ] `audit:core-editor-coverage` (new): every core type has a reachable editor drawer.

---

## Visual language (use what's there, don't reinvent)

The repo already has Tailwind, Radix, lucide-react, and a navy/diplomatic-blue palette. Keep it. v7 is structural, not a re-skin.

- **Type:** Inter for UI, JetBrains Mono for code/citations. Already in `package.json`.
- **Spacing:** 4px grid. Most layouts use multiples of 8 (8, 16, 24, 32, 48, 64).
- **Color:**
  - Primary: existing diplomatic blue (`--color-app-primary`)
  - User Core chip: blue family
  - Situation Core chip: purple family
  - Source/Document chips: green family
  - Output chip: amber family
  - Graph chip: teal family
  - Team Core chip: rose family
- **Icons:** lucide-react. One icon per concept, reused.
- **Motion:** small, fast. 150ms ease-out for hovers, 250ms for drawer open. Use `framer-motion` (already in deps).
- **Empty states:** plain language, no jargon. "Open a Situation to use these tools" not "Initialize case context."

When generating any new page or component, read `/mnt/skills/public/frontend-design/SKILL.md` first for repo conventions.

---

## What this loop sequence is *not*

- **Not a redesign of the substrate.** Postgres, Vertex, Firebase, Cognee posture, ontologies, audits — none of that changes.
- **Not a marketing rewrite.** Landing copy is sharper but not different in tone.
- **Not a chat-only interface.** Ask is the front door, but the substrate (Situation, Sources, Outputs, Advanced) remains reachable via the cores rail. The user is never trapped in chat.
- **Not a deletion of capability.** All 57 skills, all 9 ontologies, all 7 subagents, all chapters and tabs stay. They're recategorized, hidden behind smarter routing, and accessible via the cores rail and Advanced. *No capability is removed.*

---

## The iteration discipline

Each loop is one PR against `main`, behind the v7 feature flag, with a screenshot diff in the PR body.

After each loop merges:
- Update `docs/v7/STATUS.md` slice state.
- Update `docs/v7/build/SCREENSHOTS/` with the new state of the loop's surface.
- Run the verify prompt (`docs/v7/prompts/VERIFY.md`) once before starting the next loop.
- If verify finds a regression, fix it before advancing.

This is the rhythm:

```
build (loop N) → screenshot → verify → fix or advance
                                            │
                                            └─→ build (loop N+1)
```

Don't skip the verify step. The whole point of these four loops is that they ship visible value — and visible regressions are the easiest kind to catch when the bar is "does the page still look right and work?"
