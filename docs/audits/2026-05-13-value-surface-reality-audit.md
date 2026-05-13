# PRAXIS Value Surface Reality Audit - 2026-05-13

Scope: audit whether the current PRAXIS value-proposition surface is genuinely
usable after the policy-core pass, identify what is live versus staged, and
clean obsolete public-surface code where the evidence is clear.

## Verdict

PRAXIS is usable as a context-first product preview and authenticated policy
workspace shell, but not every advertised capability is fully production-live.
The safe public claim is:

- Users can understand the product from the landing page.
- Authenticated users are routed into Ask PRAXIS, tools, dashboard, cores, and
  workbench surfaces.
- The visible tool layer is intentionally small: 12 canonical capabilities.
- Specialist machinery is routable/archived, not a default marketplace.
- Some deeper capabilities remain staged or environment-gated.

Do not claim that every specialist tool, billing path, Cognee memory feature,
or runtime export/upload flow is fully production-proven.

## Evidence Collected

Local server: `http://localhost:3001` because port `3000` was already occupied.

Route checks:

| Surface | Local result | Reality |
|---|---:|---|
| `/` | 200 | Public landing renders the policy-core value proposition. |
| `/pricing` | 200 | Public pricing page is reachable. Billing provider still needs final config. |
| `/login` | 200 | Login page is reachable. |
| `/app/assistant` | 307 | Auth-gated; redirects to login as expected. |
| `/app/tools` | 307 | Auth/onboarding-gated; redirects to login/demo selection as expected. |
| `/app/dashboard` | 307 | Auth/onboarding-gated; redirects to login/demo selection as expected. |
| `/api/tools/contracts` | 200 | Tool contract metadata is reachable. |
| `/api/capabilities` | 401 | Requires auth as expected. |
| `/api/health` | 503 | Local environment degraded: `cookie_secret` error; Cognee and Polar unconfigured. |

Tool surface counts from the code registry:

| Metric | Count |
|---|---:|
| Canonical attachable tools | 12 |
| Canonical tools marked `live` | 5 |
| Canonical tools marked `routed` | 4 |
| Canonical tools marked `staged` | 3 |
| Total registry tools | 55 |
| Visible hero tools | 12 |
| Archived/specialist tools | 43 |

## What Really Works

- Landing page: works locally, renders the new "PRAXIS builds inheritable
  policy cores" frame, and no Next.js error overlay was detected.
- Public route gating: app routes correctly redirect unauthenticated users.
- Tool surface policy: tests enforce exactly 12 visible hero tools, with all
  non-hero tools hidden/archive by default.
- Canonical tools: each visible canonical capability now declares a product
  readiness posture and concise user-facing readiness text.
- Ask PRAXIS homepage/card surface: shows the active core-stack model,
  compact readiness signals, and a safe next action.
- Build/type/test baseline: typecheck, production build, lint, focused unit
  tests, and public Playwright smoke were run in this pass.

## What Is Not Fully Working Or Should Not Be Claimed

- Local `/api/health` is degraded until `COOKIE_SIGNING_SECRET` is present in
  the runtime environment. Production status may differ, but this local
  checkpoint is not all-green.
- Cognee memory is intentionally disabled/unconfigured. UI copy must keep
  treating it as unavailable unless `COGNEE_ENABLED=true` and a backend URL are
  configured.
- Polar billing is unconfigured in health output. Pricing can render, but
  checkout/billing should not be described as complete until provider config is
  verified.
- Persona CI has not met the required 10 consecutive green runs; current
  status docs record 3/10.
- Runtime upload to retrieval parity and live export/download checks remain
  follow-ups in `TODO.md`/`STATUS.md`.
- 43 specialist tools are not the default user product. They are compatibility
  and advanced/archive routes unless Ask PRAXIS routes to them from sufficient
  context.
- Older calibration audit notes still show several AI routes below the
  strongest persistence/validation bar; these should be treated as backlog for
  hardening, not as user-facing proof.

## Cleanup Completed

- Fixed stale public Playwright expectations that still asserted the old
  "Policy AI that starts with the right context" and "See PRAXIS write a memo"
  landing surface.
- Fixed landing navigation anchors by adding matching section ids for
  `#core-stack`, `#methods`, `#drafting`, `#real-app`, and `#pricing`.
- Removed the superseded landing component tree, preserving only the active
  `src/components/landing/phase8-wow-landing.tsx`.
- Updated copy-positioning tests to audit the active landing surface instead of
  deleted legacy landing files.

## Remaining Gaps To Queue

1. Add an authenticated browser smoke for `/app/assistant`, `/app/tools`, and
   `/app/dashboard` with a stable demo or test session.
2. Configure or intentionally stub `COOKIE_SIGNING_SECRET` in local smoke
   environments so `/api/health` can distinguish local setup drift from app
   failure.
3. Complete billing provider verification before claiming checkout is live.
4. Keep Cognee disabled-first unless the separate service is deployed and
   health-checked.
5. Promote the three staged canonical capabilities only after temporal/source
   readiness is demonstrably enforced in the relevant user flows.
6. Re-run the AI-route calibration audit and close low-score routes before
   describing the archive/specialist layer as production-hardened.
7. Run live upload -> retrieval and export/download checks before claiming
   those workflows are fully proven.

