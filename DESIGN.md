---
version: alpha
name: PRAXIS by TACITUS
description: >-
  Institutional intelligence aesthetic for a policy, diplomacy, and
  conflict-analysis workspace. Pairs a deep navy "operations room"
  surface with a warm cream broadsheet surface, anchored by a single
  burnished-gold accent for action and authority. Headlines are set
  in a transitional serif (EB Garamond) to evoke briefing-room
  gravitas; body and UI are in Inter for forensic legibility; data
  and source IDs are in JetBrains Mono. The system reads like a
  modern foreign-affairs publication that happens to be a software
  product — quiet, dense, citable.
colors:
  # ─── Institutional dark surfaces (operations room) ──────────────
  navy-950: "#050A18"
  navy-900: "#0B1120"
  navy-800: "#0F172A"
  navy-700: "#1E293B"
  navy-600: "#334155"
  navy-500: "#475569"
  navy-400: "#64748B"
  navy-300: "#94A3B8"
  navy-200: "#CBD5E1"
  navy-100: "#E2E8F0"
  navy-50:  "#F1F5F9"

  # ─── Institutional light surfaces (broadsheet / app) ────────────
  cream-50:  "#FAFAF8"
  cream-100: "#F8F7F4"
  cream-200: "#F0EDE8"
  cream-300: "#E2DDD5"

  # ─── Burnished-gold accent (the only call-to-action color) ──────
  gold-300: "#F5D978"
  gold-400: "#F0CA4D"
  gold-500: "#E8B931"
  gold-600: "#C8961E"
  gold-700: "#A37A14"

  # ─── Diplomatic accents (links, secondary chrome) ───────────────
  diplomatic-blue: "#1B3A5C"
  un-blue:         "#4B92DB"

  # ─── App light-theme surface tokens ─────────────────────────────
  app-bg:           "#FAFBFD"
  app-surface:      "#FFFFFF"
  app-surface-alt:  "#F5F7FA"
  app-border:       "#E2E8F0"
  app-border-light: "#F1F5F9"
  app-text:           "#0F172A"
  app-text-secondary: "#334155"
  app-text-muted:     "#64748B"

  # ─── Conflict-grammar primitives (categorical, never decorative) ─
  # Used at 20% fill / 30% border / full-saturation text for badges,
  # graph nodes, taxonomy chips, and timeline markers.
  terracotta: "#C75B39"   # claim / territorial
  teal:       "#4A90A4"   # interest
  sage:       "#5B8C5A"   # cooperative / low-risk
  steel:      "#3D5A80"   # institution / structural
  crimson:    "#A63D40"   # risk / antagonistic / destructive
  purple:     "#7B6D8D"   # narrative
  tan:        "#D4A373"   # resource

  # ─── Semantic role tokens (resolve into the palettes above) ─────
  primary:               "{colors.gold-500}"
  on-primary:            "{colors.navy-950}"
  primary-container:     "{colors.gold-400}"
  on-primary-container:  "{colors.navy-950}"

  secondary:              "{colors.diplomatic-blue}"
  on-secondary:           "{colors.cream-50}"
  secondary-container:    "{colors.un-blue}"
  on-secondary-container: "{colors.navy-950}"

  background:    "{colors.navy-950}"
  on-background: "{colors.navy-100}"
  surface:                  "{colors.app-surface}"
  on-surface:               "{colors.app-text}"
  surface-variant:          "{colors.app-surface-alt}"
  on-surface-variant:       "{colors.app-text-secondary}"
  surface-container-lowest: "{colors.app-bg}"
  surface-container-low:    "{colors.app-surface-alt}"
  surface-container:        "{colors.app-surface}"
  surface-container-high:   "{colors.cream-100}"
  surface-container-highest: "{colors.cream-200}"

  outline:         "{colors.app-border}"
  outline-variant: "{colors.app-border-light}"

  error:               "{colors.crimson}"
  on-error:            "{colors.navy-50}"
  error-container:     "#F8D7DA"
  on-error-container:  "{colors.crimson}"

  success:               "{colors.sage}"
  warning:               "{colors.gold-600}"
  info:                  "{colors.un-blue}"

  # Selection + focus
  selection-bg:   "#E8B931"      # apply at ~27% opacity over light surfaces, ~30% over dark
  selection-text: "{colors.navy-950}"
  ring:           "{colors.gold-500}"

typography:
  display-lg:
    fontFamily: "EB Garamond"
    fontSize: 64px
    fontWeight: "500"
    lineHeight: 72px
    letterSpacing: -0.02em
  display-md:
    fontFamily: "EB Garamond"
    fontSize: 48px
    fontWeight: "500"
    lineHeight: 56px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: "EB Garamond"
    fontSize: 36px
    fontWeight: "500"
    lineHeight: 44px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: "EB Garamond"
    fontSize: 28px
    fontWeight: "500"
    lineHeight: 36px
  headline-sm:
    fontFamily: "EB Garamond"
    fontSize: 22px
    fontWeight: "500"
    lineHeight: 30px
  title-lg:
    fontFamily: "Inter"
    fontSize: 18px
    fontWeight: "600"
    lineHeight: 26px
    letterSpacing: -0.005em
  title-md:
    fontFamily: "Inter"
    fontSize: 16px
    fontWeight: "600"
    lineHeight: 24px
  body-lg:
    fontFamily: "Inter"
    fontSize: 17px
    fontWeight: "400"
    lineHeight: 28px
  body-md:
    fontFamily: "Inter"
    fontSize: 15px
    fontWeight: "400"
    lineHeight: 24px
  body-sm:
    fontFamily: "Inter"
    fontSize: 13px
    fontWeight: "400"
    lineHeight: 20px
  label-md:
    fontFamily: "Inter"
    fontSize: 13px
    fontWeight: "500"
    lineHeight: 18px
  label-sm:
    fontFamily: "Inter"
    fontSize: 12px
    fontWeight: "600"
    lineHeight: 16px
    letterSpacing: 0.02em
  overline:
    fontFamily: "Inter"
    fontSize: 11px
    fontWeight: "600"
    lineHeight: 16px
    letterSpacing: 0.12em
  caption:
    fontFamily: "Inter"
    fontSize: 12px
    fontWeight: "400"
    lineHeight: 16px
  code-md:
    fontFamily: "JetBrains Mono"
    fontSize: 13px
    fontWeight: "400"
    lineHeight: 20px
  code-sm:
    fontFamily: "JetBrains Mono"
    fontSize: 12px
    fontWeight: "400"
    lineHeight: 18px

rounded:
  none: 0px
  xs:   2px
  sm:   4px
  DEFAULT: 6px
  md:   8px
  lg:   12px
  xl:   16px
  "2xl": 24px
  full: 9999px

spacing:
  unit: 4px
  "0":   0px
  "1":   4px
  "2":   8px
  "3":   12px
  "4":   16px
  "5":   20px
  "6":   24px
  "8":   32px
  "10":  40px
  "12":  48px
  "16":  64px
  "20":  80px
  "24":  96px
  gutter:           24px
  card-gap:         16px
  section-margin:   40px
  page-padding:     24px
  page-padding-md:  16px
  sidebar-width:    260px
  header-height:    56px
  content-max:      1280px
  prose-max:        72ch

elevation:
  level-0: "none"
  level-1: "0 1px 2px 0 rgba(15, 23, 42, 0.05)"
  level-2: "0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.06)"
  level-3: "0 4px 12px -2px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.06)"
  level-4: "0 12px 32px -8px rgba(15, 23, 42, 0.12), 0 4px 8px -4px rgba(15, 23, 42, 0.06)"
  level-5: "0 24px 56px -16px rgba(5, 10, 24, 0.24), 0 8px 16px -8px rgba(5, 10, 24, 0.12)"
  ring-focus:    "0 0 0 2px #E8B931"
  ring-focus-offset: "0 0 0 2px #FAFBFD, 0 0 0 4px #E8B931"
  inset-divider: "inset 0 -1px 0 0 rgba(226, 232, 240, 1)"

motion:
  duration:
    instant: 0ms
    fast:    100ms
    base:    150ms
    medium:  200ms
    slow:    300ms
    slower:  500ms
  easing:
    standard:    "cubic-bezier(0.2, 0, 0, 1)"
    emphasized:  "cubic-bezier(0.3, 0, 0, 1)"
    decelerate:  "cubic-bezier(0, 0, 0.2, 1)"
    accelerate:  "cubic-bezier(0.4, 0, 1, 1)"
    spring:      "cubic-bezier(0.34, 1.56, 0.64, 1)"
  transition-default: "all 150ms cubic-bezier(0.2, 0, 0, 1)"

breakpoints:
  sm:  640px
  md:  768px
  lg:  1024px
  xl:  1280px
  "2xl": 1536px

icons:
  family:        "lucide"
  stroke-width:  1.75
  size-sm: 14px
  size-md: 16px
  size-lg: 20px
  size-xl: 24px

components:
  # ─── Buttons ───────────────────────────────────────────────────
  button-primary:
    backgroundColor: "{colors.gold-500}"
    textColor:       "{colors.navy-950}"
    typography:      "{typography.label-md}"
    rounded:         "{rounded.DEFAULT}"
    height:          36px
    padding:         "0 16px"
  button-primary-hover:
    backgroundColor: "{colors.gold-400}"
  button-primary-active:
    backgroundColor: "{colors.gold-600}"

  button-secondary:
    backgroundColor: "{colors.navy-700}"
    textColor:       "{colors.navy-100}"
    typography:      "{typography.label-md}"
    rounded:         "{rounded.DEFAULT}"
    height:          36px
    padding:         "0 16px"
  button-secondary-hover:
    backgroundColor: "{colors.navy-600}"

  button-outline:
    backgroundColor: "transparent"
    textColor:       "{colors.app-text}"
    typography:      "{typography.label-md}"
    rounded:         "{rounded.DEFAULT}"
    height:          36px
    padding:         "0 16px"
  button-outline-hover:
    backgroundColor: "{colors.app-surface-alt}"

  button-ghost:
    backgroundColor: "transparent"
    textColor:       "{colors.navy-300}"
    typography:      "{typography.label-md}"
    rounded:         "{rounded.DEFAULT}"
    height:          36px
    padding:         "0 12px"
  button-ghost-hover:
    backgroundColor: "{colors.navy-800}"
    textColor:       "{colors.navy-100}"

  button-destructive:
    backgroundColor: "{colors.crimson}"
    textColor:       "{colors.navy-50}"
    typography:      "{typography.label-md}"
    rounded:         "{rounded.DEFAULT}"
    height:          36px
    padding:         "0 16px"

  button-link:
    backgroundColor: "transparent"
    textColor:       "{colors.diplomatic-blue}"
    typography:      "{typography.label-md}"

  # The signature "Ask PRAXIS" pill — appears in the top header.
  ask-praxis-pill:
    backgroundColor: "{colors.gold-500}"
    textColor:       "{colors.navy-950}"
    typography:      "{typography.label-md}"
    rounded:         "{rounded.full}"
    height:          32px
    padding:         "0 14px"

  # ─── Surfaces ──────────────────────────────────────────────────
  card:
    backgroundColor: "{colors.app-surface}"
    textColor:       "{colors.app-text}"
    rounded:         "{rounded.lg}"
    padding:         24px
  card-dark:
    backgroundColor: "{colors.navy-800}"
    textColor:       "{colors.navy-100}"
    rounded:         "{rounded.lg}"
    padding:         24px
  card-muted:
    backgroundColor: "{colors.app-surface-alt}"
    textColor:       "{colors.app-text}"
    rounded:         "{rounded.lg}"
    padding:         24px
  panel-bordered:
    backgroundColor: "{colors.app-surface}"
    textColor:       "{colors.app-text}"
    rounded:         "{rounded.lg}"
    padding:         20px

  # ─── Form controls ─────────────────────────────────────────────
  input-field:
    backgroundColor: "{colors.app-surface}"
    textColor:       "{colors.app-text}"
    typography:      "{typography.body-sm}"
    rounded:         "{rounded.DEFAULT}"
    height:          36px
    padding:         "0 12px"
  input-field-dark:
    backgroundColor: "{colors.navy-900}"
    textColor:       "{colors.navy-100}"
    typography:      "{typography.body-sm}"
    rounded:         "{rounded.DEFAULT}"
    height:          36px
    padding:         "0 12px"
  textarea:
    backgroundColor: "{colors.app-surface}"
    textColor:       "{colors.app-text}"
    typography:      "{typography.body-md}"
    rounded:         "{rounded.DEFAULT}"
    padding:         12px
  select-trigger:
    backgroundColor: "{colors.app-surface}"
    textColor:       "{colors.app-text}"
    typography:      "{typography.body-sm}"
    rounded:         "{rounded.DEFAULT}"
    height:          36px
    padding:         "0 12px"

  # ─── Badges & chips ────────────────────────────────────────────
  badge-default:
    backgroundColor: "{colors.gold-500}"
    textColor:       "{colors.navy-950}"
    typography:      "{typography.label-sm}"
    rounded:         "{rounded.full}"
    padding:         "2px 10px"
  badge-secondary:
    backgroundColor: "{colors.navy-700}"
    textColor:       "{colors.navy-200}"
    rounded:         "{rounded.full}"
    padding:         "2px 10px"
  badge-outline:
    backgroundColor: "transparent"
    textColor:       "{colors.app-text-secondary}"
    rounded:         "{rounded.full}"
    padding:         "2px 10px"
  badge-risk-low:
    backgroundColor: "#5B8C5A33"
    textColor:       "{colors.sage}"
    rounded:         "{rounded.full}"
  badge-risk-medium:
    backgroundColor: "#E8B93133"
    textColor:       "{colors.gold-600}"
    rounded:         "{rounded.full}"
  badge-risk-high:
    backgroundColor: "#A63D4033"
    textColor:       "{colors.crimson}"
    rounded:         "{rounded.full}"
  badge-actor:       { backgroundColor: "#3D5A8033", textColor: "{colors.steel}",      rounded: "{rounded.full}" }
  badge-claim:       { backgroundColor: "#C75B3933", textColor: "{colors.terracotta}", rounded: "{rounded.full}" }
  badge-interest:    { backgroundColor: "#4A90A433", textColor: "{colors.teal}",       rounded: "{rounded.full}" }
  badge-narrative:   { backgroundColor: "#7B6D8D33", textColor: "{colors.purple}",     rounded: "{rounded.full}" }
  badge-resource:    { backgroundColor: "#D4A37333", textColor: "{colors.tan}",        rounded: "{rounded.full}" }

  # ─── Navigation chrome ─────────────────────────────────────────
  app-shell:
    backgroundColor: "{colors.app-bg}"
    textColor:       "{colors.app-text}"
  sidebar:
    backgroundColor: "{colors.app-surface}"
    textColor:       "{colors.app-text}"
    width:           260px
    padding:         "16px 12px"
  sidebar-section-label:
    textColor:       "{colors.app-text-muted}"
    typography:      "{typography.overline}"
    padding:         "12px 12px 4px 12px"
  sidebar-item:
    backgroundColor: "transparent"
    textColor:       "{colors.app-text-secondary}"
    typography:      "{typography.body-sm}"
    rounded:         "{rounded.DEFAULT}"
    padding:         "8px 12px"
  sidebar-item-hover:
    backgroundColor: "{colors.app-surface-alt}"
    textColor:       "{colors.app-text}"
  sidebar-item-active:
    backgroundColor: "{colors.cream-200}"
    textColor:       "{colors.navy-950}"
  header:
    backgroundColor: "{colors.app-surface}"
    textColor:       "{colors.app-text}"
    height:          56px
    padding:         "0 24px"
  breadcrumb:
    textColor:  "{colors.app-text-muted}"
    typography: "{typography.body-sm}"

  # ─── Tables & data dense surfaces ─────────────────────────────
  table-row:
    backgroundColor: "{colors.app-surface}"
    textColor:       "{colors.app-text}"
    typography:      "{typography.body-sm}"
    padding:         "10px 16px"
  table-row-hover:
    backgroundColor: "{colors.app-surface-alt}"
  table-header:
    backgroundColor: "{colors.app-surface-alt}"
    textColor:       "{colors.app-text-secondary}"
    typography:      "{typography.overline}"
    padding:         "10px 16px"

  # ─── Floating PRAXIS chat (dark conversational surface) ───────
  floating-praxis-panel:
    backgroundColor: "{colors.navy-900}"
    textColor:       "{colors.navy-100}"
    rounded:         "{rounded.xl}"
    padding:         16px
  floating-praxis-message:
    backgroundColor: "{colors.navy-800}"
    textColor:       "{colors.navy-100}"
    typography:      "{typography.body-sm}"
    rounded:         "{rounded.lg}"
    padding:         12px

  # ─── Tooltip / popover ────────────────────────────────────────
  tooltip:
    backgroundColor: "{colors.navy-900}"
    textColor:       "{colors.navy-50}"
    typography:      "{typography.label-sm}"
    rounded:         "{rounded.sm}"
    padding:         "6px 10px"
  popover:
    backgroundColor: "{colors.app-surface}"
    textColor:       "{colors.app-text}"
    rounded:         "{rounded.md}"
    padding:         12px

  # ─── Banners ──────────────────────────────────────────────────
  banner-demo:
    backgroundColor: "#E8B93114"
    textColor:       "{colors.gold-700}"
    typography:      "{typography.label-md}"
    padding:         "8px 16px"
  banner-warning:
    backgroundColor: "#C8961E1A"
    textColor:       "{colors.gold-700}"
  banner-error:
    backgroundColor: "#A63D401A"
    textColor:       "{colors.crimson}"

  # ─── Risk gauge / data viz primitives ─────────────────────────
  gauge-track:
    backgroundColor: "{colors.app-border}"
    rounded:         "{rounded.full}"
  gauge-fill-low:
    backgroundColor: "{colors.sage}"
    rounded:         "{rounded.full}"
  gauge-fill-medium:
    backgroundColor: "{colors.gold-500}"
    rounded:         "{rounded.full}"
  gauge-fill-high:
    backgroundColor: "{colors.crimson}"
    rounded:         "{rounded.full}"
---

## Overview

PRAXIS by TACITUS is a workspace for policy analysts, diplomats, and
conflict researchers — people whose deliverable is a defensible
written assessment with citations. The visual identity has to earn
trust before anyone reads a word: this looks like the software a
foreign-affairs desk would actually use, not a consumer dashboard
dressed up in serious colors.

The aesthetic is **Institutional Broadsheet**. Two surfaces share a
spine and a single accent:

- A **dark navy operations room** (`navy-950` → `navy-700`) for the
  marketing site, the floating "Ask PRAXIS" assistant, and any
  briefing-mode reading view. Reads like a war-room screen at low
  light.
- A **warm broadsheet workspace** (`app-bg`, `cream-*`) for the
  authenticated app. White cards float on a near-white page with a
  trace of warmth — closer to the paper of a quality newspaper than
  to a generic SaaS gray.

A single **burnished gold** (`#E8B931`) is the only color allowed to
demand action. It marks the primary button, focus rings, the
"Ask PRAXIS" pill, and active selection. Because nothing else
competes, gold also functions as a subtle status cue (medium risk,
upgrade prompts, scroll progress).

The emotional register is *quiet authority*. The product should feel
calm under pressure, like a desk that has handled hard problems for
a long time. Generous whitespace, transitional serif headlines,
forensic monospace for source IDs, and a refusal to use bright
saturated colors except as categorical primitives in the conflict
graph.

## Colors

The palette is built around a single accent against neutral
foundations, plus a small categorical system for taxonomy.

- **Navy (`#050A18` → `#F1F5F9`):** The structural color. Body text,
  navigation, dark surfaces, sidebar chrome. Use `navy-950` for
  primary text on light surfaces, `navy-300` for muted secondary
  copy on dark surfaces. Never use a pure black; always navy.
- **Cream (`#FAFAF8` → `#E2DDD5`):** Warm light foundations. The app
  background reads as #FAFBFD with a hair of warmth — pure white is
  reserved for cards so they read as elevated.
- **Gold (`#E8B931` family):** The single voice of authority and the
  *only* color allowed for primary actions. Reserve it. Do not use
  gold for decorative flourishes, hover halos, or dividers — that
  dilutes its function as a focus signal.
- **Diplomatic Blue (`#1B3A5C`) and UN Blue (`#4B92DB`):** The link
  color and the secondary-action color. These exist so that
  navigational and informational moments have a distinct voice from
  the gold action moments.
- **Conflict-grammar primitives (terracotta, teal, sage, steel,
  crimson, purple, tan):** These are categorical, not decorative.
  Each maps to a typed entity in the analytical ontology
  (claim, interest, cooperative, institutional, antagonistic,
  narrative, resource). Always render them as a 20% fill, 30%
  border, full-saturation text — never as solid blocks.
- **Risk semantics:** Sage = low. Gold = medium. Crimson = high.
  These are the same hues used as conflict primitives, but applied
  with the risk fill/border/text recipe so a "Low" gauge reads green
  but in the same visual family as the rest of the system.

Selection uses gold at ~27% opacity over light, ~30% over dark.
Focus is always a 2px gold ring with a 2px offset on the page color.

## Typography

Three families, used for distinct jobs.

- **EB Garamond (serif)** — Headlines, dossier titles, hero
  statements, marketing display copy. The transitional serif gives
  the product a publication feel and visually separates "what this
  is" from "what you do here." Set with a slight negative
  letter-spacing on display sizes (`-0.02em` to `-0.005em`); this
  keeps Garamond from feeling loose at large weights.
- **Inter (sans-serif)** — Every UI surface, body copy, table cells,
  buttons, and form labels. Use 400 for prose, 500 for UI labels,
  600 for titles and overlines. Body copy on dark surfaces should
  step down by one weight (use 300/regular only on light surfaces;
  on dark, regular reads thin and ghostly).
- **JetBrains Mono** — Source IDs, CAMEO codes, lat/long, model
  strings, citation keys, coordinates, JSON snippets in tooltips.
  The monospace earns its place: any value the analyst needs to
  copy-paste verbatim or audit by character belongs here.

The **overline** style (`11px / 600 / 0.12em uppercase`) is the
section-label voice — it appears above dashboard panels, in sidebar
group headers, and as table headers. Prefer it over a small bold
heading; it keeps hierarchy obvious without adding visual weight.

Long-form prose (briefings, dossier output) uses a `72ch` measure,
serif headings, and Inter body — the page should feel like a
broadsheet article rather than a wiki page.

## Layout

A clean three-zone shell: sidebar / header / canvas.

- **Sidebar (260px):** Pinned left, white surface, navy text. Items
  group under uppercase overline labels (`INTELLIGENCE`,
  `WORKSPACE`, `ADMIN`). The active item uses a soft `cream-200`
  fill with `navy-950` text — never the gold accent (gold is
  reserved for primary action, not navigation state).
- **Header (56px):** White, separated from canvas by a 1px
  `app-border` divider. Holds the workspace breadcrumb on the left
  and three persistent affordances on the right: an `Ask PRAXIS`
  gold pill, a search button, and the avatar/notification cluster.
- **Canvas:** Centered with `max-width: 1280px` and `24px` page
  padding (16px on mobile). Vertical rhythm follows an 8px scale.
  Cards within the canvas use a `16px` gap; sections separate with a
  `40px` margin.

Mobile (<768px) collapses the sidebar into a drawer behind a
backdrop blur. The header retains the Ask PRAXIS pill — it is the
single most important affordance and must remain reachable.

## Elevation & Depth

Light-mode elevation is achieved with **soft, low-contrast shadows
and a single hairline border**, not with darker grays. Cards on the
broadsheet surface get `level-2` shadow plus a 1px `app-border` —
this is what makes them read as paper on paper rather than panels in
a dashboard.

- `level-1`: Hover lift on rows and list items.
- `level-2`: Default card resting state (the most-used elevation).
- `level-3`: Popovers, dropdowns, and the floating PRAXIS chat
  panel.
- `level-4`: Modals, full-screen dialogs, the global search overlay.
- `level-5`: Reserved for the dark "operations room" surfaces —
  shadows there use `rgba(5, 10, 24, ...)` so they recede into the
  navy ground rather than flatten it.

The dark surface uses a different depth language: instead of
shadows, layers separate by stepping the navy palette
(`navy-950` page → `navy-900` rail → `navy-800` card →
`navy-700` border). Borders on dark surfaces are visible
(`navy-700`) — on light surfaces they are nearly invisible
(`app-border`/`#E2E8F0`). This asymmetry is intentional: light mode
relies on shadow, dark mode relies on tone.

Focus uses a 2px gold ring with a 2px offset matched to the local
surface (`app-bg` on light, `navy-950` on dark). Never use a glow
or animated focus state; the analyst is reading, not playing.

## Shapes

The shape language is **modest, paper-like rounding**. The product
is institutional, not playful — corners should suggest a printed
form, not a chat bubble.

- `rounded.sm` (4px): inputs, table cells, code chips.
- `rounded.DEFAULT` (6px): buttons, badges-as-rectangles, dropdown
  triggers.
- `rounded.lg` (12px): cards, panels, dialog surfaces.
- `rounded.xl` (16px): the floating PRAXIS chat surface and the
  occasional hero/stat container that needs to read as
  "conversational" rather than "structural."
- `rounded.full`: pills (`Ask PRAXIS`), risk badges, taxonomy chips,
  avatars.

Never use rounding above 16px on a structural surface; it starts to
read as consumer-app, not analyst-tool.

Iconography is Lucide at 1.75 stroke width. Icons sit at 16px in
buttons and rows, 20px in headers, and 14px in dense tables.
Always use stroke icons, never filled — the system reads as drawn,
not stamped.

## Components

### The "Ask PRAXIS" pill

The signature element. A `rounded.full` gold pill in the top header,
labeled `Ask PRAXIS` in Inter 500 with a 14px right-side glyph.
Hover lightens to `gold-400`; focus shows the gold ring against the
white header. This pill is the only place gold appears in the header
chrome, which is what makes it act as the product's "go ahead, ask
anything" invitation.

### Buttons

Primary action is gold-on-navy, 36px tall, 6px corner. Secondary is
solid navy-700 on dark contexts, outline on light contexts. Ghost
buttons are used densely inside tables and toolbars and have *no*
resting background; they only acquire a `app-surface-alt` fill on
hover. Destructive actions use `crimson` and require a confirmation
step — never let a destructive button be the default action of a
form.

Buttons have a single transition: `all 150ms standard easing`.
Don't animate scale, don't animate shadow on hover — these read as
gimmicky in an institutional product.

### Cards & panels

The default card is white, `rounded.lg`, `level-2` shadow, 24px
padding. The dashboard shows them in a 3-column grid with a 16px
gap, each card opening with an overline-style category label
(`RISK COMPOSITE`, `ESCALATION STAGE`, `RECOMMENDED FOR YOU`)
followed by a single dominant visual or list. Resist filling cards
with multiple competing visualizations; one card, one assertion.

Dark cards (`card-dark`, `navy-800`) appear inside the operations-room
surface, the floating PRAXIS panel, and any "briefing mode" reader.
They use the same 12px corner and 24px padding so the muscle memory
between modes stays consistent.

### Badges & taxonomy chips

Two badge families coexist:

- **Status badges:** filled gold/navy/crimson rectangles for
  primary states.
- **Taxonomy chips:** `rounded.full`, 20% colored fill, 30%
  colored border, full-saturation colored text. These render the
  analytical ontology — Actor, Claim, Interest, Risk, etc. — and
  must use the conflict-grammar primitives, not the gold/navy
  palette.

Risk levels (Low/Medium/High) follow the chip recipe and use
sage/gold/crimson respectively.

### Forms

Inputs are 36px tall, `rounded.DEFAULT`, with a `app-border` outline
on light surfaces and a `navy-600` outline on dark. Focus replaces
the outline with a 2px gold ring (no double border). Placeholder
text is `navy-500` on dark and `app-text-muted` on light. Errors
attach a 1px `crimson` border and a `body-sm` crimson helper line
below — never a tooltip-only error.

Textareas grow to fit content and use `body-md` typography — long
analyst input deserves comfortable reading width.

### Sidebar

The sidebar reads top-to-bottom as: workspace switcher → top-level
sections (Dashboard, Conflict Graph, Timeline) → category groups
(Intelligence, Workspace, Admin) under overline labels → the
`Free Plan` upgrade footer with a solid gold `UPGRADE` button. The
upgrade button is the second permitted use of gold-as-action in the
chrome.

Active items use the soft cream highlight described above. Hover is
a fainter `app-surface-alt`. Item rows are 32px tall with a 16px
icon and 13px label.

### Tables

Table headers are `overline` style (uppercase, 11px, 600 weight) on
the `app-surface-alt` band. Rows are 13px Inter on white with a 1px
`app-border-light` divider, and a hover state of
`app-surface-alt`. Data cells right-align numbers and use
JetBrains Mono for any value that should be copy-pasted (IDs,
coordinates, source URLs, model strings).

### The floating PRAXIS chat

A `navy-900` panel pinned to the lower-right corner with `rounded.xl`
and a `level-3` shadow. Inside, message bubbles are `navy-800` with
`navy-100` text in `body-sm`. Inline code uses `navy-950` background
with `gold-400` text — the same gold-on-near-black used for source
references in the briefing reader. Links are `gold-400`, never blue,
because the chat lives on a dark surface.

### Tooltips & popovers

Tooltips are dark (`navy-900`, `navy-50` text) regardless of context
— this gives them a uniform "this is a hint, not a surface" voice.
Popovers and dropdowns inherit the surface they open on (light by
default, dark inside the operations room).

### Risk gauge

A horizontal track in `app-border` with a single colored fill — sage
for low, gold for medium, crimson for high. The numeric value sits
inside the track in `display-md` Garamond. Avoid rainbow gradients;
the system communicates risk with one color at a time.

## Do's and Don'ts

**Do**

- Reserve gold for action, focus, and selection. If you find
  yourself reaching for gold to "make it pop," reach for typographic
  hierarchy instead.
- Use Garamond for what something *is* (a Dossier, a Briefing, a
  Daily Read), and Inter for what you *do* with it (Generate,
  Configure, Export).
- Render taxonomy with the 20%/30%/100% chip recipe so the
  ontology stays legible at a glance and no single chip dominates.
- Keep cards single-purpose. One card, one assertion, one primary
  visual.
- Treat shadow as the elevation language on light surfaces and tone
  stepping as the elevation language on dark surfaces — never mix.
- Use JetBrains Mono for any value the analyst will audit or
  copy-paste.

**Don't**

- Don't use pure black anywhere — always step into navy.
- Don't introduce a second accent color. If a workflow needs a
  third semantic state beyond "primary action / link / neutral,"
  use the conflict-grammar primitives, not a new hue.
- Don't apply heavy drop shadows or glassmorphism. The product is
  paper, not glass.
- Don't animate scale, bounce, or spring on UI chrome. Reserve
  motion for genuine state transitions (drawer open, modal enter)
  and keep them under 200ms with the standard easing.
- Don't use gold for navigation state, decorative dividers, or
  empty-state illustrations — gold means *act*.
- Don't combine more than two of the conflict-grammar primitives in
  a single card; categorical color is information, and overuse turns
  it into noise.
- Don't pair Garamond with bold weights above 600. The serif loses
  its character at heavy weights and starts to compete with
  Inter — keep display copy at 500.
