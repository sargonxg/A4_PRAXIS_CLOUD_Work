# PRAXIS Design System

Aesthetic north star: **Civic Atelier: statecraft dossiers, not a generic AI dashboard.**

This file is the agent-facing implementation guide. The canonical design contract is `DESIGN.md`; this file turns it into tokens, component rules, and review checks.

## Typography

- Heading/display: `Newsreader`, loaded in `src/app/layout.tsx` and exposed as `--font-heading`.
- Body/UI: `Inter`.
- Evidence/receipts/IDs: `JetBrains Mono`.
- Migration: `font-serif` remains as a compatibility alias for heading/display. New guidance should say "heading/display", not "generic serif".

## Core Tokens

Use token classes or CSS variables instead of raw hex values.

| Token | Use |
|---|---|
| `--color-deep-ink` | Primary ink, receipt backgrounds. |
| `--color-mineral` | Borders, quiet map lines, secondary structure. |
| `--color-mineral-soft` | Soft state fills. |
| `--color-oxide` | Review/action emphasis and evidence left rails. |
| `--color-clay` | Warm hover/focus support. |
| `--color-archive-paper` | Main page ground. |
| `--color-archive-paper-strong` | Specimen/card surface. |
| `--color-graphite` | Dense neutral control text. |
| `--color-civic-blue` | Selected civic/system signal. |
| `--color-evidence-ready` | Ready/source-complete evidence state. |
| `--color-evidence-review` | Review/source-gap evidence state. |
| `--color-evidence-muted` | Muted evidence labels. |

Gold tokens remain available only for a single primary action, focus rings, and rare active states. They should not carry the brand by themselves.

## Civic Atelier Components

### Dossier Spine

Use `dossier-spine` for navigation or metadata/action rails. It should feel like a file spine: compact, vertical, and useful. Do not fill it with marketing copy.

### Specimen Cards

Use `specimen-card` for ContextCapsules and capsule-like objects. A specimen card should show:

- object title,
- capsule/category role,
- source posture,
- readiness/health signal,
- best next action,
- compact controls.

Do not nest cards inside specimen cards.

### Receipt Slips

Use `receipt-slip` for source posture, runtime proof, citations, and compact evidence. Receipt text is mono when it contains IDs, spans, providers, or machine-readable state.

Never show provider names, internal costs, raw prompts, secrets, or private routing details in public receipts.

### Cartographic Grid

Use `cartographic-grid` on repository/workbench fields where the user is mapping capsules, sources, documents, or graph proposals. Keep it quiet.

### Context Chain

Use `context-chain` when active capsules are composed together. The chain is the visible applied-context state. Avoid scattering applied capsules as unrelated chips.

### LivingContextRail

`LivingContextRail` remains valid for summary rails on onboarding, login previews, settings-style status, and compact state rows. It is not the primary capsule composition surface.

## Shared Primitive Order

When building or editing UI: **token first, primitive second, route-local styling last**.

1. Add or reuse tokens/classes in `src/app/globals.css`.
2. Add or reuse shared primitives in `src/components/ui/instrument.tsx`.
3. Apply route-local classes only for layout and composition.
4. Add or update tests for shared visual contracts.

## Pilot Scope

The current Civic Atelier pilot covers:

- public landing home through the shared workbench,
- `/app/capsules`,
- `/app/repository`,
- `TaskletPraxisWorkbench` capsule cards, inspector sheets, repository sections, and context chain.

Do not redesign Settings, Memo Studio, Advanced, auth, or admin screens in this first wave except through shared token inheritance.

## Forbidden On Pilot Surfaces

- Raw `#ca4a25` and one-off orange/terracotta literals.
- Default Tailwind `slate-*`, `amber-*`, or `emerald-*` as the primary visual identity when a PRAXIS token exists.
- Decorative AI gradients, blobs, glow buttons, and neon.
- Three-column feature-card marketing grids for ContextCapsules.
- Multiple competing Repository/Capsules search surfaces.
- Public UI that exposes provider names, internal costs, prompts, or secrets.

## Verification

Run the narrowest useful checks after visual edits:

```bash
npx vitest run tests/unit/components/instrument-visual-contract.test.ts
npm run audit:design
npm run audit:design:strict
npx tsc --noEmit
```

Before deploy, add `npm run build`, focused app tests for touched workbench/capsule surfaces, browser screenshots for desktop/mobile landing, `/app/capsules`, and `/app/repository`, then `npm run verify:design` against the shipped URL.
