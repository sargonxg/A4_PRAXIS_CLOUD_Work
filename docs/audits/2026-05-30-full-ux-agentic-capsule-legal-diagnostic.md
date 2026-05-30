# PRAXIS Full UX, Agentic, Capsule, And Legal Diagnostic

Date: 2026-05-30
Status: remediation pass ready for deploy

## Scope

This pass checked the public app, legal/privacy pages, agentic health, capsule
creation contracts, boardroom contracts, launch readiness, dependency posture,
and live Cloud Run health for `https://praxis.tacitus.me`.

External references used:

- WCAG 2.2 Success Criterion 1.4.3 requires at least 4.5:1 contrast for normal
  text and 3:1 for large text: https://www.w3.org/TR/WCAG22/#contrast-minimum
- W3C WAI recommends clear page titles, meaningful headings, meaningful links,
  and concise content for accessible writing:
  https://www.w3.org/WAI/tips/writing/
- W3C WAI heading guidance says headings communicate page organization and aid
  browser and assistive-technology navigation:
  https://www.w3.org/WAI/tutorials/page-structure/headings/
- FTC privacy/security guidance emphasizes clear descriptions of data practices
  and honoring privacy-policy promises:
  https://www.ftc.gov/business-guidance/privacy-security

This is not legal advice. The legal pages remain marked as pending formal legal
review where appropriate.

## Issues Found And Fixed

| Area | Finding | Fix |
| --- | --- | --- |
| Legal readability | The small `PRAXIS by TACITUS` legal-page back-link used `gold-700`, which measured about 3.66:1 contrast on the cream page background. | Changed the link to diplomatic blue and raised the metadata text opacity so legal pages clear the normal-text contrast threshold. |
| Legal regression coverage | Legal pages had static launch checks but no browser-level contrast, heading, landmark, or overflow regression test. | Added `tests/e2e/legal-pages-readability.spec.ts` covering all eight legal pages at mobile and desktop widths. |
| Agentic proof audit | `audit:agentic-search-proof` still expected queued-run proof labels inside `AskStreamPanel`, even though the UI had moved into `AskQueuedAgentRunPanel`. | Updated the audit to verify `AskStreamPanel` mounts the proof panel and to verify labels/fields in the actual queued-run panel. |

## Diagnostics Evidence

| Check | Result |
| --- | --- |
| Git branch sync | `main...origin/main` was `0 0` before edits. |
| GitHub Actions baseline | Latest `verify-main` and `persona-smoke` for commit `4a0be1a0a4c4def8e0e813e95c089fcf9f2050e6` were successful. |
| Cloud Run baseline | `praxis-frontend-00917-4z2` served image tag `4a0be1a0a4c4def8e0e813e95c089fcf9f2050e6`. |
| Live public health | `/api/health` returned `ok`; `/api/health/runtime` returned `ok`; `/api/health/agentic-search` returned `ready`. |
| Live protected unauth behavior | `/app/boardroom` and `/app/capsules` returned 307 to login; protected API routes returned 401 or expected 405 for unsupported GET. |
| Legal browser test | Local patched run: `npx playwright test tests/e2e/legal-pages-readability.spec.ts --reporter=line` passed 8/8. |
| Public/capsule/boardroom E2E | Local run passed public checks; authenticated capsule and boardroom tests skipped because this shell lacks test Firebase credentials. |
| Capsule contracts | Capsule unit tests and audits passed, including depth, consolidation, contract, memory contract, v3, context capture, and legibility. |
| Agentic contracts | Agent process, runtime proof, research graph, app search, app-search contract, and agentic-search proof audits passed. |
| Launch readiness | `audit:launch-readiness` passed with 46 pass, 1 warning, 0 fail. |

## Remaining Red Flags

| Red flag | Status | Required next action |
| --- | --- | --- |
| Authenticated production E2E | Blocked locally by missing `TEST_FIREBASE_EMAIL` and `TEST_FIREBASE_PASSWORD`; ADC refresh also fails non-interactively. | Run the authenticated lane with the disposable Firebase canary account after credentials are exported in the shell. |
| Local agentic env parity | `audit:agentic-search` is blocked in this shell because production-only env vars are not present locally, while live `/api/health/agentic-search` is ready. | Keep local-vs-production env status explicit; do not treat local missing secrets as production outage. |
| Dependency audit | `npm audit --audit-level=moderate` still reports AI SDK provider-utils and Genkit/Anthropic transitive advisories; npm suggests breaking `--force` changes. | Assign a dependency-curator branch for AI SDK React/provider-utils and Genkit/Anthropic compatibility upgrades. Do not force-upgrade on `main` without a focused migration. |
| Live legal contrast | Pre-fix live pages fail the new contrast test until this commit is deployed. | Re-run `tests/e2e/legal-pages-readability.spec.ts` against `https://praxis.tacitus.me` after deploy. |

## Product Quality Notes

- Legal/privacy pages are structurally simple and readable: one main landmark,
  one H1, section H2s, readable body copy, and cross-links to every legal page.
- Capsule creation and use are covered by service/unit contracts and visual
  diagnostics, but authenticated browser proof still needs a canary account in
  the shell.
- Boardroom is covered by route/unit contracts and a mocked E2E workflow; live
  unauthenticated behavior is correct, but authenticated live browser proof is
  still gated by canary credentials.
- Agentic search is production-ready according to live health, but local audit
  scripts intentionally fail without Cloud SQL, worker auth, Vertex, grounding,
  and runtime env variables.
