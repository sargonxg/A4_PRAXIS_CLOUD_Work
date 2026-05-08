# PRAXIS Phase 1 Self-Audit: Landing Page Fitness

Date: 2026-05-06
Topic: H - landing page fitness
Worktree: `C:\Users\giuli\praxis-audit-landing-page-fitness`
HEAD: `ac2a7bbac66388af8a0f06f0c53324c08af0791e`

## ACCURATE

- The landing page now describes PRAXIS as a policy/conflict workbench, not only
  a Syria tool.
- `src/app/(landing)/page.tsx` has product-aware JSON-LD for PRAXIS by TACITUS.
- The section stack is substantive: Hero, Six Steps, Example Cases, DIALECTICA,
  Live Demo, Built For, Trust, Pricing, Contact/Footer.
- `npm run audit:landing` passes in the installed main checkout.
- Production `/` returns 200.

## OUTDATED

- The architecture/prompt asks for a public no-signup `/demo/syria-2024`; the
  live product redirects `/demo/syria-2024` and `/demo` to
  `/login?mode=demo&example=syria-2026`.
- The Live Demo section says "No login required" while its full click target is
  a login demo URL.
- The CTA hierarchy is not the requested one-primary one-secondary shape:
  current navigation has Sign In plus Try an example, and the contact section
  has email/TACITUS CTAs rather than `/waitlist`.
- Legacy Syria-heavy components and constants remain in the landing component
  set, including `hero-quadrant-tour`, `syria-case-proof`,
  `grounding-backbone`, and `problem-section`.

## MISSING

- `/waitlist` returns 404.
- `/login/callback` returns 404.
- `/legal/privacy`, `/legal/terms`, `/legal/security`, and
  `/legal/data-retention` return 404. `/privacy` and `/terms` are live.
- Explicit landing sections for "16-tool marketplace" and "Memo Studio" are not
  present as first-class product sections.
- Lighthouse/LHCI proof is not wired: no `lh:ci` script and no
  `lighthouserc.json`.

## VISUAL

- The page uses real product-like UI scenes and animated workbench previews.
- It still leans on Syria-specific proof assets instead of a broader set of
  actual workbench screenshots across mediation, governance, narrative, and
  conflict cases.
- Landing smoke test was attempted locally and failed because no dev server was
  running at `localhost:3000`; this is a test-environment blocker, not a visual
  product result.

## Production Route Probe

| Route | Status | Notes |
|---|---:|---|
| `/` | 200 | Landing live |
| `/demo/syria-2024` | 307 | Redirects to login demo |
| `/demo` | 307 | Redirects to login demo |
| `/waitlist` | 404 | Canonical prompt route missing |
| `/login` | 200 | Login live |
| `/login/callback` | 404 | Canonical prompt route missing |
| `/legal/privacy` | 404 | Canonical prompt route missing |
| `/legal/terms` | 404 | Canonical prompt route missing |
| `/legal/security` | 404 | Canonical prompt route missing |
| `/legal/data-retention` | 404 | Canonical prompt route missing |
| `/privacy` | 200 | Current legal route |
| `/terms` | 200 | Current legal route |

## Findings

| ID | Severity | Title | Evidence | Remediation sketch |
|---|---|---|---|---|
| H-01 | S0 | Public demo route is not live as specified | `/demo/syria-2024` redirects to login demo | Implement or explicitly defer public signed-out demo; update primary CTA |
| H-02 | S1 | Canonical entry/legal routes missing | `/waitlist`, `/login/callback`, `/legal/*` return 404 | Add redirects/pages with documented statuses |
| H-03 | S1 | CTA hierarchy does not match pack-04 target | Multiple CTAs, no `/waitlist` route | Normalize to primary demo plus secondary waitlist/contact |
| H-04 | S2 | Syria-heavy legacy copy/assets remain | Multiple landing components still Syria-specific | Rebalance around product, ontologies, marketplace, Memo Studio |
| H-05 | S2 | Marketplace/Memo Studio not explicit enough | No first-class sections for 16 tools or Memo Studio | Add accurate product sections after plan approval |
| H-06 | S2 | Lighthouse targets not proven | No LHCI config; local smoke blocked by no dev server | Add/run performance proof after route decisions |

No landing changes were made.
