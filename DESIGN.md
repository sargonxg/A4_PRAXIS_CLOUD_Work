# PRAXIS Civic Atelier Design Contract

Status: active pilot. This is the Civic Atelier design contract for the landing page, Capsules, Repository, Boardroom, and shared PRAXIS work surfaces. Do not sweep unrelated Settings, Memo Studio, Advanced, auth, or admin screens except where shared tokens naturally affect them.

## North Star

PRAXIS should read as a professional statecraft product with a proprietary object model, not as a generic AI dashboard. The visual system is **Civic Atelier**: dense policy instruments, dossier spines, capsule chains, source receipts, proof rails, and restrained map-like structure.

The interface should feel designed for analysts, policy teams, and operators who need source posture and reusable context to be visible without turning the main screen into a manual.

## Typography

- Display and headings: `EB Garamond`, loaded through `next/font/google`.
- Body, labels, controls: `Inter`.
- Receipts, citations, IDs, page spans, model/tool traces, and machine-readable evidence: `JetBrains Mono`.
- Compatibility rule: `font-serif` remains available as a heading/display alias during migration. Do not describe it as a generic serif token in new docs.

## Palette

Use PRAXIS tokens first. Gold is a rare action/focus signal, not the brand's main color.

| Token | Role |
|---|---|
| `--color-deep-ink` | Primary text, dark receipt surfaces. |
| `--color-mineral` / `--color-mineral-soft` | Borders, quiet state, cartographic lines. |
| `--color-oxide` / `--color-clay` | Review/action emphasis, not decorative flood color. |
| `--color-archive-paper` / `--color-archive-paper-strong` | Page and specimen surfaces. |
| `--color-graphite` | Dense neutral text and low-chrome controls. |
| `--color-civic-blue` | Selected civic/system signal. |
| `--color-evidence-ready` / `--color-evidence-review` / `--color-evidence-muted` | Receipts, source posture, readiness states. |
| `--color-gold-*` | Single primary action, focus ring, or rare active signal only. |
| `--color-lab-void` / `--color-lab-ink` / `--color-lab-panel` | Legacy dark operating surfaces for proof rails and agent workspaces. |
| `--color-lab-cyan` / `--color-lab-lime` / `--color-lab-plasma` / `--color-lab-warning` | Restrained AI, receipt, agent, and review signals. |
| `--color-lab-line` | Source-flow lines, capsule borders, and technical map structure. |

Pilot surfaces must not introduce raw `#ca4a25`, default Tailwind `slate-*`, `amber-*`, or `emerald-*` as the core visual language when a PRAXIS token exists. Legacy classes can remain outside the pilot until touched.

## Layout Grammar

### Dossier Spine

Use a left or right vertical metadata/action rail for high-value work surfaces. The spine carries navigation, context metadata, and work state without becoming a second app.

CSS hook: `dossier-spine`.

### Specimen Cards

ContextCapsules are catalogued policy objects. Render them as specimen cards with restrained borders, inner frames, IDs, source posture, and next action. Avoid generic SaaS cards, oversized marketing cards, and nested cards.

CSS hook: `specimen-card`.

### Receipt Slips

Citations, source posture, runtime proof, and provider/tool receipts render as compact dark strips with mono evidence text. Never expose internal provider names, internal costs, raw prompts, or secrets in public receipts.

CSS hook: `receipt-slip`.

### Cartographic Grid

Repository, Capsules, and Workbench surfaces use a quiet coordinate/grid rhythm to suggest mapped evidence and context, not decoration.

CSS hook: `cartographic-grid`.

### Context Chain

Active capsules render as a composed chain/stack. Avoid scattered chips that make applied context look incidental.

canonical_component: ContextChain

Mobile rule: the active ContextChain must remain reachable through a sticky compact bar or bottom sheet. Do not hide critical capsule state behind desktop-only rails.

### Civic Atelier Primitives

Use `civic-atelier-shell`, `cartographic-grid`, `dossier-spine`, `specimen-card`, `receipt-slip`, `context-chain`, `capsule-state-active`, `capsule-state-reference`, `capsule-state-review`, `capsule-state-missing`, and `capsule-mobile-sheet` inside public, app, capsule, source receipt, and agent proof surfaces.

### Living Context Rail

`LivingContextRail` remains valid for compact status strips on secondary surfaces, onboarding, login previews, and settings-style summary rows.

canonical_component: LivingContextRail

## Shared Primitives

Primary implementation point: `src/components/ui/instrument.tsx`.

Use these primitives before route-local styling:

- `InstrumentSurface`
- `InstrumentWindow`
- `InstrumentToolbar`
- `InstrumentButton`
- `LivingContextRail`
- `SourcePostureChip`
- `WorkActionMenu`
- `PublicPageShell`

## Implementation Order

For any Civic Atelier change: **token first, primitive second, route-local styling last**.

1. Add or reuse a CSS token/class in `src/app/globals.css`.
2. Prefer shared primitives in `src/components/ui/instrument.tsx`.
3. Apply route-local Tailwind only for layout, spacing, and one-off composition.
4. Update `tests/unit/components/instrument-visual-contract.test.ts` for new reusable patterns.
5. Run `npm run audit:design`, `npm run audit:design:strict` when token migration is complete, and the focused unit tests for touched surfaces.

## Anti-Patterns

- Decorative blobs, generic gradients, glow buttons, or neon as decoration.
- Card grids where ContextCapsules look like generic feature tiles.
- Gold used as section decoration.
- Visible explanatory copy that teaches the interface instead of doing the work.
- Parallel repository/capsule search surfaces. Keep Capsules and Repository aligned through the shared workbench.
- Provider names, internal costs, raw prompts, secrets, or undocumented model routing in public UI.
