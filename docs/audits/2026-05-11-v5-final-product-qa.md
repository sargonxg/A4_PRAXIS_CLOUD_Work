# PRAXIS v5 Final Product QA And Red-Team Review

Date: 2026-05-11  
Owner: Codex  
Production target: `https://praxis.tacitus.me`

## Executive Status

PRAXIS is live and usable on the production domain after the approved frontend
deploy. The public landing page, three v5 public demo contexts, pricing, login,
authenticated persona smoke paths, GCP posture, and Cloud Run service readiness
all passed this QA pass.

This is not a full commercial-launch closeout yet. Billing provider secrets are
not configured, Cognee remains disabled-first by design, and the required
10-run persona CI streak has only started.

## Production Evidence

- Final deployed frontend revision before this QA pass:
  `praxis-frontend-00308-29d`.
- Final deployed frontend revision after checkout-fallback cleanup:
  `praxis-frontend-00310-bqx`.
- Final cleanup deploy Cloud Build:
  `337715b7-ec55-4cec-b15b-5511f6861684`.
- Cloud Run services in `us-central1` reported Ready:
  `praxis-frontend`, `praxis-backend`, `gdelt-poller`,
  `on-document-uploaded`, `on-situation-created`, `dialectica-api`, and
  `dialectica-web`.
- Public health endpoint: `status=ok`; Firestore, AI provider, cookie secret,
  and Vertex ADK reported `ok`; Cognee and Polar reported `unconfigured`.
- Production browser verification on desktop and mobile loaded:
  `/`, `/demo/indo-pacific-2026`, `/demo/ai-regulation-2026`,
  `/demo/fb-sustainability-2026`, `/pricing`, `/login`, and `/app`.
- `/app` correctly sent unauthenticated users to
  `/login?redirect=%2Fapp`.
- Production persona smoke passed 6/6 specs against `praxis.tacitus.me`.
- GitHub Actions persona smoke run `25652333690` passed on commit `1b3a6c69`.
- GitHub Actions persona smoke run `25652772692` passed on commit `6c9e407c`.
- Canary monitor passed at 100% with 12 samples, 0 error rate, and p95 latency
  272 ms.
- After the final cleanup deploy, the first canary hit a cold-start p95 of
  19216 ms with 0 errors; the immediate retry passed with p95 192 ms.

## Severity-Ranked Findings

### F1 - Billing Checkout Is Not Production-Configured

- Severity: launch blocker for paid self-serve plans; not a blocker for demo or
  evaluator use.
- Paths: `/pricing`, `/app/settings?upgrade=analyst`, `/api/polar/checkout`,
  `/api/health`.
- Evidence: Secret Manager has no Polar/Stripe/Cognee matching secrets visible
  to the active account; `/api/health` reports `polar=unconfigured`.
- Impact: paid plan buttons can route users toward checkout intent, but a real
  checkout session cannot be created until provider secrets and product IDs are
  configured.
- Fix applied in this pass: Settings now shows an explicit
  `Checkout Not Available` message instead of silently stopping when Polar is
  unconfigured.
- Remaining action: configure Polar production secrets and product IDs, or
  approve a Stripe migration and implement `/api/stripe/*` routes before
  claiming paid checkout complete.
- Launch blocking: yes for self-serve paid launch.

### F2 - Persona CI Streak Has Started But Is Not Complete

- Severity: launch governance blocker for the v5 tag/release gate.
- Paths: `.github/workflows/persona-smoke.yml`,
  `docs/audits/persona-green-streak.md`.
- Evidence: run `25652333690` passed, but the target is 10 consecutive CI green
  runs after reset.
- Fix applied in this pass: official GitHub Actions were upgraded to Node 24
  runtime-compatible major versions to remove upcoming runner deprecation
  noise.
- Remaining action: let the workflow run through nine more successful
  consecutive passes, or record a revised acceptance rule.
- Launch blocking: yes for the strict v5 release gate; no for current live MVP
  evaluation.

### F3 - Cognee Is Honest But Not Live

- Severity: non-blocking product scope gap.
- Paths: `/api/health`, `/app/settings/system-health`, `BLOCKERS.md`.
- Evidence: `cognee_memory=unconfigured`, `cogneeMemoryEnabled=false`, and no
  `praxis-cognee` Cloud Run service exists in the current regional inventory.
- Impact: the app does not claim live Cognee memory as active, but memory recall
  remains a future service-owned slice.
- Remaining action: deploy/provision the isolated `praxis-cognee` service, set
  `COGNEE_BACKEND_URL`, run live memory acceptance paths, then enable it.
- Launch blocking: no for the current MVP as long as copy stays honest.

### F4 - Notification External Providers Remain Unconfigured

- Severity: non-blocking operations gap.
- Paths: `BLOCKERS.md`, notification provider routes/preferences.
- Evidence: no matching provider secrets were visible in the filtered Secret
  Manager inventory.
- Impact: in-app notification contracts can remain, but external sends should
  stay queued or provider-unconfigured.
- Remaining action: configure provider secrets and dispatch jobs when external
  notification delivery becomes a launch requirement.
- Launch blocking: no for current MVP evaluation.

## Buyer-Experience Notes

- First impression: the landing page explains PRAXIS as policy work with live
  context and shows concrete demo contexts quickly.
- Five-minute wow moment: the public demo contexts expose graph, source, and
  workbench-style analysis without requiring a paid account.
- Claims posture: public routes do not expose internal cost values and the
  health/system copy keeps unconfigured providers explicit.
- Auth posture: app routes require login; public demos remain reachable.
- Mobile posture: checked routes render on mobile without console errors.

## Validation Commands

- `npm run lint -- src\app\app\settings\page.tsx`
- `npm run typecheck`
- `npm run build`
- `PLAYWRIGHT_BASE_URL=https://praxis.tacitus.me npm run smoke:personas -- --reporter=line`
- `npx tsx scripts/canary-monitor.ts --phase=100 --url=https://praxis.tacitus.me --samples=3`
- `gh run watch 25652333690 --repo sargonxg/A4_PRAXIS_CLOUD_Work --exit-status`
- Final live route/browser/persona/canary checks after deploy
  `337715b7-ec55-4cec-b15b-5511f6861684`

## Next Improvement Round

1. Decide and configure billing: Polar production setup is the smallest path;
   Stripe is a migration.
2. Let persona CI accumulate the remaining nine consecutive green runs.
3. Decide Cognee posture: keep disabled-first or deploy the isolated service.
4. Run live export/download checks for briefing and boardroom artifacts.
5. Start a new improvement queue focused on buyer polish: pricing activation,
   onboarding clarity, system-health copy, and authenticated dashboard delight.
