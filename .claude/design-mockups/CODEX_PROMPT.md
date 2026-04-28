# Codex prompt — PRAXIS visual system continuation

> Drop this whole file into your Codex session as the opening message.
> It contains everything you need: context, what was already built, what
> remains, and the order in which to do it.

---

## 1. Context — what you are working on

You are Codex inside the repo `C:\Users\giuli\praxiscodexworking`
(GitHub: `sargonxg/A4_PRAXIS_CLOUD_Work`). The repo is shared with
Claude Code in the same directory; both agents must respect each
other's files.

PRAXIS by TACITUS is a Next.js 16 + Firebase + Cloud Run platform for
policy/diplomacy/conflict analysts. The canonical visual system is
**`DESIGN.md`** in the repo root — Institutional Broadsheet aesthetic,
navy + cream + burnished gold + EB Garamond / Inter / JetBrains Mono.
Read `DESIGN.md` start-to-finish before doing anything else; it
overrides anything older in the codebase that disagrees.

`CLAUDE.md` (also in repo root) describes the architecture, the
calibration contract (`AnalystProfile`), the operational spine, and
the strict security boundaries. Do not modify files listed in the
"Security Boundaries — DO NOT TOUCH" section.

## 2. What Claude Code already produced

Folder: `.claude/design-mockups/`

- `tokens.css` — production-quality CSS distilled from `DESIGN.md`.
  Custom properties for every color, the full type scale, elevation,
  motion, the three-zone shell, badges/chips with the 20%/30%/100%
  taxonomy recipe, the Ask PRAXIS pill, and the dark "ops-room"
  override. Treat this file as the source of truth — when you wire
  the mockups into the actual Next.js code, port these tokens into
  `tailwind.config` / global CSS verbatim.
- `dashboard.html` — three-zone shell (sidebar + header + canvas),
  Risk Composite / Escalation Stage / Early Warning Triggers cards,
  timeline + Recommended for You split, Active Work Queue table,
  floating Ask PRAXIS pill. Responsive: collapses sidebar at <768px.
- `conflict-graph.html` — D3-style SVG force graph with ACO-typed
  nodes (terracotta / steel / sage / teal / crimson / purple / tan),
  community hulls, typed-edge styling (causal / antagonistic /
  cooperative), entity inspector panel, ACO legend, zoom controls.
  Inspector becomes a bottom sheet on mobile.
- `briefing.html` — long-form 72ch article with EB Garamond
  headlines + Inter body + JetBrains Mono citations, sticky chapter
  TOC rail, calibration sidecar, and a working **Broadsheet ⇄ Ops
  Room** toggle that swaps to the dark surface (`navy-950`,
  `gold-400` links and inline code).
- `onboarding.html` — step 2 of 3 (Perspective). Mandate chips,
  drag-to-reorder analytical-lens list with weights, primary
  domain + audience selects, region chips. Right side renders the
  live `<analyst-profile>` XML preview on a navy-950 surface with a
  gold-400 embedding sparkline — a literal preview of what
  `buildCalibratedContext()` will inject into the system prompt.

## 3. What still needs to be built (mockups)

In `.claude/design-mockups/`, in this order:

### 3.1 `ask-praxis.html` — Floating Ask PRAXIS chat

Two viewports in one responsive file:

- **Desktop** — full app behind (a faded screenshot of the dashboard
  is fine; reuse the same shell), with the **floating PRAXIS
  panel** docked lower-right at `380px × 560px`, `rounded-xl`
  (`16px`), `navy-900` surface, `level-3` shadow, 1px `navy-700`
  hairline. Header strip with the gold sparkle icon, "PRAXIS",
  context badge ("Sahel · v7"), and a close `×`.
  Conversation: assistant message in `navy-800` bubble with
  `body-sm` Inter, `gold-400` inline code (e.g. `withCalibration()`,
  source IDs `[S-217]`), and 4 "source" rows underneath each answer
  showing `JetBrains Mono` source IDs that link to the briefing.
  Show one user message in plain text right-aligned.
  Composer at the bottom: `navy-950` input with `gold-500` focus
  ring, paperclip + slash-command icon, gold-500 "Send" affordance.
  Above the composer, a "calibration trace" line: `analyst.v7 ·
  situation/sahel-mali-2026q2 · 14 nodes retrieved · 2 credits`.
- **Mobile** — same panel but full-screen sheet (no shell behind).
  Sticky top bar with breadcrumb, sticky composer, and a slide-up
  "Sources" drawer covering bottom 40% when the user taps a source
  pill.

Use the same `tokens.css`. Add this scoped style block:

```css
.ask-panel { background: var(--navy-900); color: var(--navy-100);
  border: 1px solid var(--navy-700); border-radius: var(--r-xl);
  box-shadow: var(--shadow-3); }
.ask-msg-assistant { background: var(--navy-800); border-radius: var(--r-lg);
  padding: 12px 14px; }
.ask-msg-user { color: var(--navy-50); padding: 8px 14px; }
.ask-inline-code { background: var(--navy-950); color: var(--gold-400);
  padding: 1px 6px; border-radius: 4px;
  font-family: 'JetBrains Mono'; font-size: 12px; }
.ask-source-pill { background: var(--navy-950); border: 1px solid var(--navy-700);
  color: var(--navy-200); border-radius: var(--r); padding: 6px 10px;
  font-family: 'JetBrains Mono'; font-size: 11px; }
.ask-composer { background: var(--navy-950); border-top: 1px solid var(--navy-800);
  padding: 12px; }
```

### 3.2 `marketing.html` — Public landing page

Dark ops-room aesthetic top to mid; broadsheet sections below.

- **Top nav** — fixed, `navy-950` with subtle bottom border
  (`navy-800`). Left: PRAXIS wordmark in EB Garamond 500 + the
  gold sparkle + small "by Tacitus" tag in
  `gold-700` overline. Center: anchor links (Product, Method,
  Customers, Pricing, Method note). Right: ghost "Sign in" button
  + a gold-500 pill "Request access".
- **Hero** — `navy-950` background, full viewport height. Big
  Garamond display headline (`64px`, weight 500) e.g.
  *"For desks that have to be right by Friday."* Sub-deck in Inter
  body-lg navy-300, max 60ch. Two buttons: gold-500 primary
  "Request access" and outline-on-dark "See a sample briefing".
  Behind the headline, a subtle SVG line-art map of the Sahel /
  Maghreb / Horn region in `navy-700` strokes with two or three
  glowing gold dots on city locations — strictly background, no
  animation.
- **Trust bar** — uppercase overline "Used by analysts at" + 5–6
  faux organisation marks (e.g. "ICG", "DGAP", "Stiftung
  Wissenschaft", "RUSI", "Brookings", "ECFR") in
  `navy-400` Inter 500.
- **Three-pillar section** (still ops-room, navy-900 cards on
  navy-950 page): "Calibrated to your perspective" /
  "Defensible by source" / "Continuous, not session-based".
  Each card: serif title 28px, body-md prose, one schematic SVG
  (a serif-letter "P" wrapped in tag brackets / a citation graph /
  a continuous-loop arrow). One sentence beneath quoting the
  enabling architecture verbatim from CLAUDE.md
  (e.g. *"Every AI route wraps `withCalibration(toolId, op)` —
  the profile is the prompt."*).
- **Sample briefing strip** — switches surface to **broadsheet
  light** (`#FAFBFD`). Three columns of stylised excerpts from a
  briefing — Garamond H, Inter body, JetBrains Mono source IDs.
  Each column ends in a fading mask and a "Read full briefing"
  link in diplomatic-blue. This proves the product *looks like a
  real briefing*, not a dashboard.
- **Method note** — broadsheet light. A long-form paragraph in EB
  Garamond 22px talking about the ACO ontology (14 entity types,
  72 typed relations) with a small inline graphic of typed edges
  (causal / antagonistic / cooperative).
- **Pricing** — broadsheet light. Three cards: Free /
  Practitioner / Desk. Practitioner is highlighted with a 2px
  gold border; the rest with a 1px hairline. Single gold pill on
  Practitioner; outline buttons on the others. No "Most popular"
  sticker — the gold border is the signal.
- **Footer** — back to `navy-950`. Compact: brand mark, tagline,
  link grid (Product / Company / Legal), tiny line at the bottom
  with `JetBrains Mono` build hash + last-deployed timestamp,
  echoing the operational-spine language.

Mobile: stack everything single-column; nav collapses into a
hamburger with a backdrop-blur drawer; the hero's background map
crops to the centre.

### 3.3 `index.html` — preview index

A single page that shows all six mockups as preview cards, two per
row. Each card: title, one-line description, and **two iframes**
side-by-side at fixed sizes — `width:1280px;height:800px;transform:scale(.32);transform-origin:top left;` for desktop and
`width:375px;height:720px;transform:scale(.5);` for mobile, sitting
inside a clipped container that shows the scaled-down preview.
"Open desktop" / "Open mobile" links beneath each pair.

This is the page Giulio will open in a browser to see everything at
once. Make it gracious — broadsheet surface, Garamond H1
"PRAXIS — Mockups", Inter intro paragraph, and a single ghost button
top-right linking to `DESIGN.md` on disk via `file://` (skip if too
fragile — a plain `<code>` element pointing at the path is enough).

### 3.4 Optional: complete onboarding steps 1 + 3

`onboarding.html` currently shows Step 2 (Perspective). If you have
budget, replace the stepper logic with a JS state machine that
toggles step 1 (Identity — name, role, seniority, organisation) and
step 3 (Working style — preferred sources multiselect, output
language, red-line phrases textarea, tone slider). The live preview
on the right should update its `<analyst-profile>` XML accordingly.
Otherwise leave a `// TODO: step 1, step 3` comment and move on.

## 4. Stitch MCP — what was attempted, what to do

Claude Code created two Stitch projects and one design system asset,
but every `generate_screen_from_text` call timed out at the MCP
harness boundary, even though the design system itself was applied
cleanly. The fault is the harness timeout vs. Stitch generation
time, not the prompts or the credentials.

If you want to try Stitch yourself:

| Resource | ID |
| --- | --- |
| Project (with design system applied) | `projects/16291771805198275030` |
| Backup project (no DS) | `projects/4802016610583184325` |
| Design-system asset | `assets/6113512241119187022` |

The applied design system has: `colorMode: LIGHT`,
`customColor: #E8B931`, overrides primary/secondary/tertiary/neutral,
headline font `EB_GARAMOND`, body & label font `INTER`, roundness
`ROUND_EIGHT`, plus a `designMd` field containing the institutional
broadsheet rule-set distilled from `DESIGN.md`. Reuse it on any new
project via `apply_design_system`.

If you do get a Stitch screen to generate, drop the screenshot under
`.claude/design-mockups/stitch-exports/` and add it to `index.html`
beside the matching HTML. Do **not** rely on Stitch as the canonical
artifact — the `.html` files are.

## 5. Wiring the mockups into the actual Next.js app

After the mockups are done, this is the implementation order. Make
each step its own commit so we can revert cleanly.

### 5.1 Tokens — the only canonical change to the design system

1. Read `tailwind.config.ts` (or `tailwind.config.js`). Map every
   `--navy-*`, `--cream-*`, `--gold-*`, `--diplomatic-blue`,
   conflict-grammar primitive, radius, and shadow from
   `tokens.css` into the Tailwind theme under the same names
   (`navy-950`, `gold-500`, `terracotta`, etc.). Do not invent new
   tokens; mirror the file exactly.
2. In `src/app/globals.css` (or wherever the global CSS lives),
   import the three Google Fonts (EB Garamond 500, Inter
   400/500/600, JetBrains Mono 400/500) and wire them to
   `--font-serif`, `--font-sans`, `--font-mono` so Tailwind's
   `font-serif|sans|mono` works.
3. Verify with `npx tsc --noEmit` and `npm run build`. No code
   changes outside config + globals at this step.

### 5.2 App shell

1. `src/components/app/app-shell.tsx` (or equivalent) — replace
   the existing sidebar markup with the structure from
   `dashboard.html`'s `<aside class="sidebar">` block, ported to
   Tailwind. Keep the existing nav data source; don't hardcode.
2. `src/components/app/sidebar.tsx` — implement the overline
   section labels (`INTELLIGENCE`, `WORKSPACE`, `ADMIN`), the
   active-state cream-200 fill (NEVER gold for nav state), and
   the upgrade card.
3. Header — port the breadcrumb + Ask PRAXIS pill cluster.
4. Floating Ask PRAXIS pill bottom-right of `src/app/app/layout.tsx`.

### 5.3 Tool pages

For each of `dashboard`, `conflict-graph`, `timeline`,
`risk-monitor`, `early-warning`, port the existing page to use the
new shell + the relevant card vocabulary from
`dashboard.html` and `conflict-graph.html`. Risk gauge,
escalation stage, and trigger-row patterns should become reusable
components under `src/components/praxis/`:

- `<RiskGauge value={7.3} delta={+0.4} band="medium" />`
- `<EscalationStage stage={5} />`
- `<TriggerRow icon dot="terracotta" id="ACLED-..." />`
- `<TaxonomyChip kind="actor|claim|interest|narrative|resource|low|medium|high" />`
- `<AskPraxisPill />`

Each component keeps the 20%/30%/100% chip recipe, never reaches
for gold for non-action UI, and uses `font-serif` only on
headlines/numbers, `font-mono` only on IDs/coords/timestamps.

### 5.4 Briefing reader

`src/app/app/briefings/[id]/page.tsx` — adopt the layout from
`briefing.html`. The Broadsheet ⇄ Ops Room toggle goes in the
existing reader header; persist the choice to `localStorage` keyed
by `praxis.reader.mode`. Reuse the actual Markdown/MDX renderer the
repo already has — only the surrounding chrome changes.

### 5.5 Onboarding wizard

`src/app/onboarding/*` — adopt the right-rail live
`<analyst-profile>` preview with the navy-950 surface and the
embedding sparkline. The XML it renders must be the same string
that `renderSystemPromptBlock()` (or whichever helper is canonical
in `src/lib/context/`) emits. If the helper currently lives only
server-side, expose a tiny `/api/profile/preview` route that
streams the same string for the wizard preview pane.

### 5.6 Marketing landing

`src/app/page.tsx` (the public landing) — port the marketing
mockup. The dark ops-room hero must remain reachable without any
JS — it is the trust signal before anyone signs in. Lazy-load only
the broadsheet sections.

### 5.7 Verification

After each step:

```bash
npx tsc --noEmit
npm run lint
npm run build
node scripts/audit-ai-routes.mjs        # must still pass
npm run audit:gcp                       # must still pass
npx vitest run
```

When the full app builds and tests pass, run a smoke local dev
session (`npm run dev`) and load `/`, `/onboarding`,
`/app/dashboard`, `/app/conflict-graph`, `/app/briefings/{any}`.
Visually compare to the matching mockup file. Capture differences
in `.claude/design-mockups/PARITY.md`.

Only after parity is acceptable, deploy through Cloud Build per
`docs/GCP_OPERATIONS.md`. Do not deploy if any of the validation
gates above fail.

## 6. Hard rules

- Do not touch files listed under "Security Boundaries — DO NOT
  TOUCH" in `CLAUDE.md`.
- Do not introduce a second accent colour. If you need a third
  semantic state, use the conflict-grammar primitives.
- Never use gold for navigation state, dividers, or empty-state
  illustrations. Gold means *act*.
- No glassmorphism, no scale/bounce/spring on UI chrome.
- No pure black anywhere — always step into navy.
- Garamond stays at weight 500 for display sizes; never above 600.
- Every AI route stays wrapped in `withCalibration(toolId, op)`.
  Visual changes do not justify bypassing the calibration gate.
- Commits: one logical change per commit, no `Co-Authored-By`
  trailers, author email `giuliocatanzariti@gmail.com`.

## 7. Definition of done

- [ ] `.claude/design-mockups/ask-praxis.html` exists and is
      responsive.
- [ ] `.claude/design-mockups/marketing.html` exists and is
      responsive.
- [ ] `.claude/design-mockups/index.html` exists and previews all
      six mockups.
- [ ] Tokens ported to Tailwind config; build green.
- [ ] App shell, three tool pages, briefing reader, onboarding
      wizard, and landing page match the mockups, with build,
      lint, type-check, AI-route audit, and tests all green.
- [ ] `.claude/design-mockups/PARITY.md` lists any deliberate
      deviations from the mockups.
- [ ] No security-boundary file changed.

Start with §3 (mockups) and stop after §3 to let Giulio review.
Only proceed to §5 once he has approved the mockups.
