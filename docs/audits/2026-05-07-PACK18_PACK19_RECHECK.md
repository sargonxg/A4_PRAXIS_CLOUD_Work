# Pack 18 + Pack 19 Recheck

Date: 2026-05-07
Repo: `C:\Users\giuli\praxiscodexworking`
Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`
Production: `https://praxis.tacitus.me`

## Verdict

The current application is healthy as a launch-foundation product, but Pack 18
and Pack 19 are not fully complete under their strict prompt contracts.

The shipped and verified slice is real: canonical public routes, memo tools as
first-class marketplace tools, 22-tool transparency cards, tool-run evidence
drawer, run comparison foundation, and Memo Studio handoff evidence are coded,
audited, committed, deployed, and live-smoked.

The strict launch and v1.1 usefulness gates remain open where the prompt asks
for production evidence that does not yet exist or for larger flows that are not
implemented.

## Current Deployed State

- Commit verified locally: `4669e02`
- Cloud Build: `4e76a579-73bf-447a-bee1-00033850783b`
- Cloud Run revision: `praxis-frontend-00262-vdn`
- Traffic: 100% to `praxis-frontend-00262-vdn`
- Health endpoint: HTTP 200, `status: ok`

## Verification Run

- `npm run audit:gate` passed on 2026-05-07.
- Build passed.
- 138 Vitest files passed.
- 552 tests passed.
- GCP inventory passed with 0 hard failures and 0 soft warnings.
- KG drift verifier passed in example-contract mode with 0 drift for
  `syria-2026` and `nordalia-2026`.

## Production Browser Smoke

| Surface | Result |
|---|---|
| `/demo/syria-2024` | HTTP 200, public read-only demo rendered, no login redirect, zero console/page errors |
| `/waitlist` | HTTP 200, production cohort copy rendered, zero console/page errors |
| `/login/callback` | HTTP 200, callback state rendered, zero console/page errors |
| `/legal/privacy` | HTTP 200, privacy policy rendered, zero console/page errors |
| `/legal/terms` | HTTP 200, terms rendered, zero console/page errors |
| `/legal/security` | HTTP 200, security page rendered, zero console/page errors |
| `/legal/data-retention` | HTTP 200, data-retention page rendered, zero console/page errors |
| `/app/workbench/syria-2026?tab=tools` | Tools marketplace rendered with "Twenty-two focused tools" |
| Memo tools | `Memo Create` and `Memo Refresh` visible after searching `memo` |
| `cross.memo-create` run | Run completed and opened evidence drawer |
| Evidence drawer | Memo Studio handoff, `memoStudioReady`, synthesized/review posture, claims/provenance, context snapshot, and raw output rendered |

## Lighthouse Evidence

Production Lighthouse was run for `/demo/syria-2024`.

- Report: `docs/audits/lighthouse-demo-syria-2024-latest.json`
- Performance: 87
- Accessibility: 95
- Pack 18 target: performance >=92 and accessibility/axe 100
- Status: open gap

## Done Against Pack 18

- Prompt preserved under `docs/codex-prompts/`.
- Public read-only `/demo/syria-2024` exists and is not sign-in gated.
- `/waitlist`, `/login/callback`, and canonical legal pages exist.
- `cross.memo-create` and `cross.memo-refresh` are first-class marketplace
  foundation tools with contracts, skills, and runner support.
- Route/tool/codex-prompt/audit gates cover these slices.
- Production deploy and browser smoke evidence exists for the coded slices.

## Still Open Against Pack 18

- Persona CI streak: 10 consecutive green main runs not evidenced.
- Context/storage production parity: staging/prod round-trip evidence not
  complete.
- Two-phase Firestore/Postgres commit and reconciler crash proof not complete.
- Synthesized review queue for Source Augmenter and Memo Drafter not complete
  as a first-class typed queue/UI/API flow.
- Specialist model-backed handlers for all v1 tools not proven with canaries.
- Seven live Agent Engine runtimes lack eval-fresh, trace, and cost evidence.
- Production Lighthouse/accessibility target is not met.
- Canary 5->25->100 and owner-signed v1.0 readiness are not complete.

## Done Against Pack 19

- Prompt preserved under `docs/codex-prompts/`.
- Transparency cards cover all 22 current marketplace tools.
- Marketplace tool runs expose an evidence drawer with provenance, context,
  raw output, handler posture, and Memo Studio handoff.
- Run comparison foundation is present.
- Production tools-tab smoke confirms the usefulness slice is live.

## Still Open Against Pack 19

- Situation Genesis flow is not implemented.
- Workspace guideline propagation and case fork are not implemented.
- Claim challenge and semantic diffing remain open beyond the current
  evidence/diff foundation.
- Memo redaction, milestones, review workflow, branded exports, and signed cover
  pages remain open.
- Boardroom pause/resume/intervention/history flows remain open.
- Live signal panel remains open.
- 60-second wow flow has no 10-run CI evidence.
- Explainability mode, self-service audit export, and C2PA on memo export remain
  open.
- ADR 0030 and ADR 0031 are not present.

## Next Engineering Slice

The highest leverage next slice is public-demo polish because it is already
live, measurable, and blocks a Pack 18 launch target. Improve performance and
accessibility until Lighthouse reaches at least 92 performance and 100
accessibility, then rerun the same production report.

