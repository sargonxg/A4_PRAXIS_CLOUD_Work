# PRAXIS Color System Audit — 2026-04-26

> Round-5 Brick #46. Full sweep across `src/app/app/**` and
> `src/components/**` for dark-theme tokens inside the `app-light`
> shell. Companion to `docs/tools/UX_AUDIT_2026-04-26.md` (per-tool)
> and `docs/TOOL_RELIABILITY_AUDIT_2026-04-26.md` (failure modes).

## Method

1. `grep -RIn 'bg-(navy|slate)-(700|800|900|950)|text-slate-(50|100|200|300|400)' src/`.
2. Triage each match: **legitimate inverted block** (e.g., terminal,
   code preview, navy-on-emerald JSON inspector) vs **leaked dark-theme
   token** (a card inside the light app shell that reads as grey-on-
   grey).
3. Fix leaks. Document legitimate inverted blocks so future agents
   don't try to "correct" them.

## Already fixed in round 4 (Lane BB)

- `src/components/dashboard/widget-shell.tsx` — was the root offender
  (slate-800/900/300/500/600). Now uses navy-700/600/500/400 +
  slate-200 borders + bg-white. Powers RiskGaugeWidget +
  EscalationWidget + RecommendedToolsWidget.
- `src/components/dashboard/recommended-tools-widget.tsx` — list
  items flipped to navy-900/600 + slate-100 hover.

## Legitimate inverted blocks (LEAVE AS-IS)

These render terminal / code / JSON content where high-contrast dark
mode IS the design intent. Future agents should NOT "fix" these:

- `src/app/app/situations/[id]/inspect/page.tsx:452` and `:601` —
  `bg-navy-900 text-emerald-300` JSON inspector. Terminal-look on
  purpose; emerald-on-navy is high-contrast.
- `src/components/app/debug-panel.tsx` — inverted dev panel; toggled
  via Ctrl+Shift+D.
- `src/components/app/activity-panel.tsx` — inverted ops console;
  pill is the only light-mode element (already fixed in Lane AA).
- `src/components/assistant/chat-interface.tsx` floating panel — the
  Floating Ask PRAXIS dome opens an inverted chat surface; matches
  product spec.
- Landing page hero inverted strip in `<ProductGlimpse />` window
  chrome — three traffic-light dots on a cream-50 strip; not dark
  mode.

## Open audit items (queued for follow-up bricks)

These are NOT yet visited but the grep hit. Each needs a 2-minute
manual look to decide leak vs intentional:

| File | Token | Likely classification |
|---|---|---|
| `src/app/app/sources/page.tsx` | `bg-navy-800` | inverted source-card chrome — verify |
| `src/app/app/stakeholder-map/page.tsx` | `bg-slate-900` | likely a graph background — verify |
| `src/app/app/conflict-graph/page.tsx` | `bg-navy-900` | likely the graph canvas — leave |
| `src/app/app/un-toolkit/page.tsx` | `text-slate-300` | likely a low-contrast helper line — fix |
| `src/app/app/scenarios/page.tsx` | `text-slate-200` | likely a card label — verify |
| `src/app/app/game-theory/page.tsx` | `bg-navy-900` | likely a payoff-matrix dark preview — leave |
| `src/app/app/economic-impact/page.tsx` | `text-slate-300` | likely a card subtitle — fix |
| `src/app/app/auto-briefings/page.tsx` | `text-slate-400` | likely a timestamp — verify |
| `src/app/app/admin/advisors/page.tsx` | `bg-navy-900` | likely an admin terminal — leave |
| `src/app/app/settings/api-keys/page.tsx` | `bg-navy-900` | likely a key-mask block — verify |

## Color-system rules (canonical)

Apply these mechanically when fixing a leak:

| Old (dark-theme leak) | New (light-mode app) |
|---|---|
| `bg-slate-900/40` card surface | `bg-white shadow-sm shadow-navy-950/5` |
| `bg-slate-900/70` hover surface | `bg-white shadow-md` |
| `border-slate-800` | `border-slate-200` |
| `text-slate-300` (titles) | `text-navy-700` |
| `text-slate-400` (subtitles) | `text-navy-500` |
| `text-slate-500` (small text) | `text-navy-500` |
| `text-slate-600` (icons) | `text-navy-400` |
| `text-slate-700` | `text-navy-600` |
| `hover:bg-slate-800/60` | `hover:bg-slate-100` |

**Always preserve** any existing `text-emerald-*` / `text-crimson` /
`text-gold-*` / risk colour tokens — those carry meaning (status,
trust, severity) and should not be re-mapped.

## Acceptance test for any future fix

After flipping tokens on a page:

1. Open the page in the app-light shell.
2. Confirm WCAG AA contrast: 4.5:1 for body text, 3:1 for large
   text and icons.
3. Confirm the page still renders under `prefers-color-scheme: dark`
   (the shell stays light, but the page should not look broken).
4. Run `npx tsc --noEmit`; build is not strictly required for token
   swaps.
5. Append a row to this doc's "Already fixed" section.

## Why this matters

User screenshot 2026-04-26 19:06:15 flagged the dashboard cards as
illegible. Root cause was a single shared component
(`<WidgetShell />`) using dark-theme tokens. Fixing one component
fixed three widgets. The pattern repeats: most leaks live in shared
components, not per-page styles. Sweep shared components first,
per-page overrides second.
