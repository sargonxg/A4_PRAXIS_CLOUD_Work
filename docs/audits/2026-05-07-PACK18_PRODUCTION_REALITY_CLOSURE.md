# Pack 18 Production Reality Closure Pass

Date: 2026-05-07
Repo: `C:\Users\giuli\praxiscodexworking`
Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`
Source prompt: `docs/codex-prompts/PRAXIS_CODEX_18_PRODUCTION_REALITY_CLOSURE.md`

## Executive Summary

Pack 18 is the launch-gate closure brief: it asks PRAXIS to stop adding broad
new surfaces and close the live production gaps that still prevent an honest
v1.0.0 claim. This pass preserved the prompt in-repo, converted one confirmed
S1 gap into shipped route code, and expanded the guardrail audit that protects
canonical entry and legal routes.

## Implemented In This Pass

| Pack 18 gap | Status | Evidence |
|---|---|---|
| Public read-only `/demo/syria-2024` route | CLOSED foundation | `src/app/demo/syria-2024/page.tsx`, `src/proxy.ts`, landing CTA updates |
| Canonical `/waitlist` route | CLOSED foundation | `src/app/waitlist/page.tsx`, `src/app/waitlist/waitlist-page-client.tsx` |
| Canonical `/login/callback` route | CLOSED foundation | `src/app/(auth)/login/callback/page.tsx` |
| Canonical `/legal/privacy` and `/legal/terms` routes | CLOSED foundation | `src/app/legal/privacy/page.tsx`, `src/app/legal/terms/page.tsx` |
| Canonical `/legal/security` route | CLOSED foundation | `src/app/legal/security/page.tsx` |
| Canonical `/legal/data-retention` route | CLOSED foundation | `src/app/legal/data-retention/page.tsx` |
| Entry-route regression guard | CLOSED | `scripts/audit-legal-pages-present.ts` now checks public demo, waitlist, login callback, legal routes, landing demo CTAs, and proxy matchers |
| `cross.memo-create` first-class marketplace tool | CLOSED foundation | `src/lib/tools/marketplace/registry.ts`, `src/lib/tools/marketplace/handler-contracts.ts`, `skills/tools/cross.memo-create/SKILL.md`, `src/lib/tools/marketplace/runner.ts` |
| `cross.memo-refresh` first-class marketplace tool | CLOSED foundation | `src/lib/tools/marketplace/registry.ts`, `src/lib/tools/marketplace/handler-contracts.ts`, `skills/tools/cross.memo-refresh/SKILL.md`, `src/lib/tools/marketplace/runner.ts` |
| Memo-tool regression guards | CLOSED | `npm run audit:tool-marketplace`, `npm run audit:tool-contract-v2`, `npm run audit:tool-skills-present`, and `npm run audit:transparency-cards` now pass for 22 tools |
| Prompt preservation | CLOSED | `docs/codex-prompts/PRAXIS_CODEX_18_PRODUCTION_REALITY_CLOSURE.md`, `scripts/audit-codex-prompts.ts` |

## Remaining Pack 18 Launch Gaps

These are not marked complete until production-backed evidence exists.

| Priority | Gap | Next implementation slice |
|---|---|---|
| S0 | Persona suites need 10 consecutive green CI runs | Add CI history evidence collection and publish streak status under `docs/audits/health-trends.md` |
| S1 | Context/storage production parity | Run parity checks against staging/prod and document Firestore/Postgres round trips |
| S1 | Two-phase Firestore/Postgres commit and reconciler proof | Run crash-injection tests, scheduler freshness check, and drift dry run |
| S1 | Structural firewall on every graph write path | Extend AST audit and deliberate-failure fixtures for all graph mutation routes |
| S1 | Synthesized review queue for Source Augmenter and Memo Drafter | Implement typed queue storage, review UI, accept/reject APIs, and no-auto-persist invariant |
| S1 | Marketplace tools need specialist output depth | Replace placeholder/general handlers with per-tool specialist behavior and canary fixtures; memo tools are now first-class foundation tools but still need audited model-backed runtime evidence before v1.0 sign-off |
| S1 | Seven live Agent Engine runtimes | Requires deployment/eval/trace/cost evidence; do not claim until GCP evidence is captured |
| S1 | Production deploy posture | Requires staging-green window, canary evidence, Cloud SQL posture, and signed readiness log |

## Proposed Next Loop

1. Build the synthesized review queue because it is the main missing safety
   bridge between permissive AI generation and durable graph persistence.
2. Add Pack 18 health trend evidence for persona CI streaks, Cloud SQL posture,
   and deployment canary status so production reality is visible rather than
   inferred from local checks.
3. Replace remaining placeholder/general marketplace tool handlers with
   specialist outputs and canary fixtures.

## Verification Targets

- `npm run audit:legal-pages-present`
- `npm run audit:tool-marketplace`
- `npm run audit:tool-contract-v2`
- `npm run audit:tool-skills-present`
- `npm run audit:transparency-cards`
- `npm run audit:codex-prompts`
- `npm run typecheck`
- `npm run build`
- Browser smoke for `/demo/syria-2024` signed out: 200, watermark text, no
  console errors, no redirect to `/login`.
- Browser smoke for `/waitlist`, `/login/callback`, `/legal/privacy`,
  `/legal/terms`, `/legal/security`, and `/legal/data-retention`.

## Local Verification Evidence

Executed against `next start -p 3118` after production build:

| Route | HTTP | Browser result |
|---|---:|---|
| `/demo/syria-2024` | 200 | Rendered `Syria transition case, source-grounded and graph-first.`, watermark present, no redirect to `/login`, zero console/page errors |
| `/waitlist` | 200 | Rendered `Join the PRAXIS production cohort.`, zero console/page errors |
| `/login/callback` | 200 | Rendered `Completing secure sign-in`, zero console/page errors |
| `/legal/privacy` | 200 | Rendered `Privacy Policy`, zero console/page errors |
| `/legal/terms` | 200 | Rendered `Terms of Service`, zero console/page errors |
| `/legal/security` | 200 | Rendered `Security`, zero console/page errors |
| `/legal/data-retention` | 200 | Rendered `Data Retention`, zero console/page errors |
| `/app/workbench/syria-2026?tab=tools` memo search | 200 | Rendered `Twenty-two focused tools`; `Memo Create` and `Memo Refresh` visible after search |
| `cross.memo-create` demo run | 200 | Completed from marketplace, opened Evidence drawer, rendered `Memo Studio handoff`, `memoStudioReady`, `synthesized`, and `reviewRequired`; zero console/page errors |
| Full audit gate | pass | `npm run audit:gate` passed after the memo-tool slice: build, 22-tool marketplace audits, evidence-drawer audit, master-charter audit, 138 Vitest files, 552 tests, KG drift, GCP audit |

This evidence is local only until the memo-tool slice is deployed. Pack 18
still requires production Lighthouse/axe, CI streak, canary, live Agent Engine,
specialist model-backed handler, and cloud posture evidence before v1.0.0
readiness.

## Production Verification Evidence

Deployment:

- Commit deployed: `ae6a00d`
- Command: `npm run deploy:frontend:cloud`
- Cloud Build: `43779fe0-dfc2-4e9b-8a38-cfe4430123e6`
- Status: `SUCCESS`

Live checks against `https://praxis.tacitus.me` after deploy:

| Route | HTTP | Browser result |
|---|---:|---|
| `/demo/syria-2024` | 200 | Rendered `Syria transition case, source-grounded and graph-first.`, watermark present, no redirect to `/login`, zero console/page errors |
| `/waitlist` | 200 | Rendered `Join the PRAXIS production cohort.`, zero console/page errors |
| `/login/callback` | 200 | Rendered `Completing secure sign-in`, zero console/page errors |
| `/legal/privacy` | 200 | HTTP 200 confirmed |
| `/legal/terms` | 200 | HTTP 200 confirmed |
| `/legal/security` | 200 | Rendered `Security`, zero console/page errors |
| `/legal/data-retention` | 200 | Rendered `Data Retention`, zero console/page errors |

Remaining evidence gap: production Lighthouse/axe has not yet been run for
`/demo/syria-2024`, and the Pack 18 CI streak/canary requirements are still
open.
