# PRAXIS — Design System

> Single visual identity shared by the public landing **and** the post-sign-in
> app shell. The app surface inherits the same tokens, shadows, and component
> primitives so the brand reads identically on both sides of authentication.

Aesthetic north star: **Instrument Pro: diplomatic instrument, not SaaS dashboard.**
Think Swiss watch face, Bloomberg Terminal Pro, Linear marketing. Tactile,
museum-grade, deliberate. No generic AI gradients.

---

## 1. Tokens

All tokens live in `src/app/globals.css` inside `@theme inline`. Do not add
ad-hoc hex values in components — extend tokens here first.

### Palette

| Token | Hex | Usage |
|---|---|---|
| `--color-ink` | `#0A1628` | Body text on cream, primary copy. Deeper than `navy-950`; 17:1 contrast on cream. |
| `--color-navy-950` → `--color-navy-50` | dark scale | App shell surfaces, dense product copy. |
| `--color-cream-50/100/200/300` | warm whites | Landing background, light surfaces. |
| `--color-vellum` | `#F8F1E0` | Inner card surfaces, capsule chambers. |
| `--color-diplomatic-blue` | `#1B3A5C` | Logo, headings, secondary borders. |
| `--color-un-blue` | `#4B92DB` | Civic/source accents. |
| `--color-gold-500` | `#E8B931` | **CTA only**. Active state. Never decorative. |
| `--color-gold-400/600/700` | gradient stops | Capsule button gradient. |
| `--color-rose-gold` | `#C9A961` | Hairlines, dividers, non-CTA accents. |
| `--color-rose-gold-soft` | `#E8D9AE` | Faded hairlines, gradient fades. |
| `--color-terracotta` / `--color-teal` / `--color-sage` / `--color-crimson` | accent set | Status indicators only. |

**Rule of gold separation**: `--color-gold-500` is reserved for primary CTAs
and active state. Hairlines and ornamentation use `--color-rose-gold`. Gold
must signal *do this* — not decorate.

### Typography

- **Headings**: EB Garamond, weight 500, tracking `-0.02em`. Use `font-serif`.
- **Body / UI**: Inter, 16–17px, line-height 1.6.
- **Hints / code / data**: JetBrains Mono, 12–13px, tracking widest for badges.

Per-word gradient mask is allowed on the rotating noun only (`navy-900 →
diplomatic-blue → gold-600`). Do not gradient whole headlines.

### Radius

Everything rounded:

- Capsule pills → `rounded-full`
- Instrument controls / rail cells / windows → `rounded-md` through `rounded-[10px]`
- Repeated marketing cards → `rounded-2xl`
- Hero / capsule containers → `rounded-3xl` only when genuinely focal
- Dividers / table cells → `rounded-md`

### Elevation

Two-layer stacked shadows, never single solid drops:

```css
.shadow-capsule    /* default surface depth */
.shadow-capsule-lg /* hero surface depth */
.shadow-gold-halo  /* primary CTA hover */
```

### Surface treatments

- `surface-glass` — translucent white + backdrop-blur for floating cards on
  cream.
- `surface-glass-dark` — translucent ink + rose-gold hairline for floating
  cards on dark surfaces (post-sign-in or dark mode).
- `surface-vellum` — warmer cream for inner card chambers.
- `border-brushed-gold` — wrapper element + `p-px` to render a 1px conic-
  gradient gold rim on capsules.
- `paper-texture` — body-level fractal-noise overlay at 2.5% opacity.

### Motion

Honor `prefers-reduced-motion`. Reduced-motion variants are baked into
`.btn-capsule-*` CSS. For Framer Motion, gate animations with the standard
`useReducedMotion()` hook.

Preset durations:

| Token | Curve | Use |
|---|---|---|
| `120ms` | linear | Color-only state changes. |
| `200ms` | ease | Hover lifts, fades. |
| `320ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | Surface transitions. |
| `480ms` | same | Rise-in on view. |
| `900–1200ms` | same | Gold sweeps, filament traces. |

---

## 2. Component primitives

### Instrument primitives (`src/components/ui/instrument.tsx`)

Use these before adding route-local card systems:

```tsx
<InstrumentWindow eyebrow="Repository" title="Source posture">
  ...
</InstrumentWindow>

<LivingContextRail
  cells={[
    { id: "profile", label: "Profile", value: "Analyst", state: "ready" },
    { id: "context", label: "Context", value: "Syria policy", state: "active" },
  ]}
  actionHref="/app/capsules"
/>
```

- `LivingContextRail` is the signature motif. It belongs in the cockpit,
  login preview, onboarding preview, repository/capsules, and Settings/System
  when context/readiness posture matters.
- Rail cells show profile, context, source posture, output posture, and
  readiness. Keep labels compact; never expose provider names, internal costs,
  or raw debug details in normal cells.
- `InstrumentSurface`, `InstrumentWindow`, `InstrumentToolbar`, and
  `InstrumentButton` carry the shared paper/vellum treatment, 6-12px radii,
  focus rings, pressed states, and two-layer shadows.
- `SourcePostureChip` is for evidence/risk readiness, not decoration.
- `WorkActionMenu` is the default overflow affordance for "work on this"
  actions when more than two commands would crowd a panel.

### Capsule buttons (`src/components/ui/button.tsx`)

```tsx
<Button variant="capsule" size="pill-lg">New capsule</Button>
<Button variant="capsule-secondary" size="pill">Sign In</Button>
<Button variant="capsule-ghost" size="pill-sm">Learn more</Button>
```

- `capsule` — gold gradient pill with inner highlight + soft halo. Use for the
  *one* primary action per screen.
- `capsule-secondary` — diplomatic-blue 1.5px outline pill. Use for the
  secondary action.
- `capsule-ghost` — ghost text with gold dot prefix and animated underline.
  Use for tertiary / inline actions.

Sizes `pill` / `pill-lg` / `pill-sm` enforce the rounded-full + EB Garamond
treatment.

### Cards

Default surface: `rounded-2xl bg-white surface-glass shadow-capsule`. Hero
surfaces: `rounded-3xl shadow-capsule-lg` with the brushed-gold border
wrapper if the card is the focal element on the page.

### Hairlines

Use `<div class="divider-rose-gold" />` instead of `<hr />` whenever the
divider sits on a cream surface. On dark surfaces use a 1px
`rgba(201, 169, 97, 0.2)` border.

---

## 3. Layout grammar

- **Landing hero**: two-column asymmetric (5/12 + 7/12 on `lg`+, stacked on
  mobile). Left = headline + CTAs. Right = floating capsule hero card tilted
  -2deg.
- **Section rhythm**: 160px gap on `lg`, 96px on mobile. Wrap a stack of
  sections in `class="section-rhythm"` to apply automatically.
- **Max width**: 1280px (`max-w-7xl`) for marketing, 1440px for app dense
  surfaces.
- **Container padding**: `px-5` mobile, `px-8` `lg`+.
- **Touch targets**: 44px minimum on mobile. The mobile drawer uses 11/12-tall
  rows.

---

## 4. Capsule visual language

The product concept (multi-core composable context + output capsules) maps
into the visual identity. When rendering a capsule in the UI:

- Container: rounded-3xl, `surface-glass`, brushed-gold rim if it's the focal
  capsule. Otherwise `border-rose-gold/30`.
- Header strip: 12 core dots (user, situation, path, source, document, graph,
  time, tool, objective, product, output, memory) at 8px, colored per
  `entity-colors`.
- Drag handles: 4×8px rounded rose-gold pill on the left edge.
- Drop target affordance: when a capsule is dragged near a compose zone, the
  zone shows a 2px dashed gold-500 border and a soft gold halo. Snap distance
  16px.
- Composite preview: the resulting capsule renders with the two parent
  capsules tucked into the top-left corner at 32px, lightly rotated.

---

## 5. Mobile

- All capsule buttons grow to `h-11` (44px) on mobile.
- Mobile drawer locks body scroll and stacks Sign In above New capsule.
- Hero stacks: headline → CTAs → floating capsule card last (do not push the
  capsule above the fold — the headline owns the fold on mobile).
- Carousels (output catalog, persona cards) use horizontal scroll-snap with
  visible left/right peek (16px) to telegraph more content.
- Sticky navbar collapses to 56px after 32px scroll on all viewports.

---

## 6. Accessibility

- WCAG AA minimum. Body copy on cream uses `--color-ink` (17:1).
- Focus ring is `2px solid var(--color-gold-500)` with 3px offset. Never
  remove via `outline: none`.
- All interactive elements have a hover *and* focus state — they may share
  styles but the focus must be visually distinct from rest.
- Respect `prefers-reduced-motion` — animations either disable or hold the
  end frame.
- `aria-expanded` / `aria-controls` on the mobile menu toggle.

---

## 7. Anti-patterns (do not do)

- Don't introduce a third accent color beyond gold + rose-gold.
- Don't use `bg-gradient-to-*` rainbow gradients. The only allowed gradients
  are the gold capsule gradient and the per-word headline mask.
- Don't add purple/teal "AI shimmer" backgrounds.
- Don't put sharp corners on user-facing surfaces. Sharp corners exist only
  for dividers, tables, and code blocks.
- Don't use single-layer `shadow-lg`. Use `shadow-capsule` / `shadow-capsule-lg`.
- Don't put body text directly on `--color-cream-100` without `--color-ink`
  for color — the default body color is dark navy and contrast will fail.

---

## 8. Where to extend

- New tokens → `src/app/globals.css` `@theme inline`.
- New utility classes → bottom of `globals.css` under the "PRAXIS visual
  identity" comment header.
- New button variants → `src/components/ui/button.tsx` `buttonVariants`.
- New shared cards / capsule renderers → `src/components/ui/`.
- Landing-only motion / scenes → `src/components/landing/`.

Keep landing + app shell visually identical. If a change improves the
landing, port it to the app shell in the same PR.

Instrument Pro guardrail: if a route needs a new visible surface, first try
`PublicPageShell`, `InstrumentWindow`, or `LivingContextRail`. Add bespoke
Tailwind surface classes only when the primitive cannot express the state.
