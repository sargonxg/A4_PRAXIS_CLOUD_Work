# SIGNAL build and release progress

## Published geographic visualization and feedback refinement

Application source `cc4e6f6cac87c4dd30a8da5c23e16dad9479c452` is published at https://praxis.tacitus.me/signal. Canonical main build `d8d1d36f-b697-4913-9993-fb9315b0bc35` created revision `praxis-frontend-01119-c5g`, serving 100% of public traffic with all seven runtime checks passing. Existing resources, secret bindings, unrelated tags and hourly watched-desk scheduling are preserved. Rollback is `praxis-frontend-01117-68m`.

All 492 test files / 2,990 tests and the full configured source gate pass. An official Playwright Cloud Build completed all five exact-source staged browser tests, followed by plain-public build `691fab0c-0589-4095-a0f5-0ec6e52c5441`: five passed, none skipped, failed or flaky, without forwarding. Actual public second-identity feedback isolation and complete scoped cleanup passed. Safe receipt: `proofs/release-refinement-cc4e6f6c.json`. Earlier blocked/partial receipts remain dated historical evidence; they no longer describe the active publication status.

The simpler default world explorer, AI question box and twelve-hour public-source panel are a separate frozen candidate. Its full configured gate, lint (zero errors / five existing unrelated warnings) and all 498 unit files / 3,033 tests pass. The initial real cache, calibrated AI, eight-browser-test staging/public gates and twelve-hour scheduling proofs remain pending. These features are not included in this published revision. Real customer feedback and the human gold benchmark remain open.

## Verified initial text-pilot release

- Public application: https://praxis.tacitus.me/signal, using existing PRAXIS sign-in.
- Deployed source: cad3eb2b5ec355052607bf528a4e23d3fc5a3c72, canonical GitHub main frontend pipeline.
- Public Cloud Build/revision/image: Cloud Build 8f6398b7-5303-477f-860c-d50614c3e36e (us-central1), revision praxis-frontend-01117-68m, digest sha256:b96bdebefed2e142c533e07b73f7efcbc97f5c291cb8e712f0fce48ebbaf974b.
- Rollback: praxis-frontend-01112-6x6. Existing PRAXIS/customer work and protected auth/rules/model gateway files preserved.
- Uploaded kit: RELEASE.json v0.2.0, BOOTSTRAP and twelve phases 00–11. The upload's filename says v3; it does not contain a sixteen-phase v0.3 specification.
- Cloud workspace: /workspace/A4_PRAXIS_CLOUD_Work, Node 24/npm 11; production uses the repository Node 22 Docker image. Signed-in Google CLI and user ADC verified for praxisbytacitus; GitHub read/write verified. Credentials never committed.

| Phase | Status | Verified evidence |
| --- | --- | --- |
| 00 Audit | complete | Baseline 477 test files / 2,851 tests; integration map; actual identity, repository and cloud permissions. |
| 01 Contracts | complete | Owner-only transaction ledger, immutable exact revisions, CAS and bounded owner/desk/storage limits; actual two-tenant read/graph/export 404. |
| 02 UI | complete | Six views, country/regional/theatre scopes, existing sign-in, native capsule inspector; authenticated browser, mobile bounds and contrast 7.611:1. |
| 03 Capture | complete for enabled text/RSS | Actual NASA RSS 10 sources through trusted worker; original UTF-16 spans, four clocks, rights, revision/partial/error state. GDELT unavailable 503 and explicitly disabled. |
| 04 Analysis | complete for bounded text proposals | Actual calibrated Vertex model receipt; exact span validation and unaccepted proposals. Human 200-item gold quality benchmark remains unmeasured. |
| 05 Review/context | complete | Native compiler pins reviewed evidence; real inspection; stale context rejected before allowances/credits; explicit rebuild and epoch-bound renewed review. |
| 06 Assessments/briefs | complete | Reviewed assessment and exact approved MD/JSON export, immutable historical artifact after correction; context-only source withdrawal denies both exports 403. |
| 07 Watched desks | complete | Actual browser-independent Cloud Tasks dispatch, first-attempt receipt, pause and hourly public scheduler. Crash/retry/cancellation/quotas verified by deterministic tests; no live crash injection claimed. |
| 08 Operations | complete tooling; pilot evaluation open | Coverage/attempt/error/token denominators, evaluator and three-country/two-language synthetic examples. Analyst-labelled 200-item benchmark/customer outcomes not fabricated. |
| 09 Media | explicitly disabled | No validated rights-cleared image/audio/video provider enabled. |
| 10 Release | complete | Full source gates, exact corrected tagged staging, canonical main deployment, public provenance and authenticated workflows. |
| 11 Handoff | complete | README, RUNBOOK, DEMO, PILOT_CHECKLIST, RELEASE_PLAN and safe live proof receipts. Human pilot prerequisites remain explicit. |

## Validation evidence

- Source final gate: 487 Vitest files / 2,945 tests passed; full lint 0 errors / 5 pre-existing warnings; typecheck and production build passed.
- Full audit:gate plus separate repo-shape, architecture-reference and AI route audit passed. Local authenticated GCP 38 checks: 0 hard failures, 0 soft warnings. Cloud Build service-account preflight has one optional scheduler-list visibility warning, separately verified with real operator readback.
- Kit integrity and 29 original reference tests passed; those are distinct from the actual PRAXIS suite/live tests.
- Final Graphify refresh: 20,270 nodes, 45,188 edges, 949 communities; zero model tokens.
- Core staged source 0f20eac8: real calibrated model 4,786 tokens / one unaccepted proposal; actual worker 10 NASA RSS sources; second identity desk/graph/export 404; invalid worker and sweep 401; complete scoped cleanup.
- Staged pinned-context proof: source A is selected only through compiled context while direct approved brief cites B; withdrawing A denies both exports 403, preserves historic text/digest/manifest and leaves B available.
- Final inspector-link staged source cad3eb2b: all 3 tests passed in 1.8 min, including actual native inspector exact ID and browser back, mobile bounds and full correction/rebuild recovery.
- Public browser, worker, pinned-context withdrawal and scheduler: all 3 plain public browser tests passed in 1.3 min (no forwarding); calibrated Gemini 3.5 Flash analysis 200 / 4,246 tokens / one unaccepted proposal; actual first-attempt Cloud Tasks collection 10 NASA RSS sources; real second-user desk/graph/export 404; invalid worker/cron 401; context-only withdrawal exports 403 with immutable history; all scoped cleanup verified. Hourly scheduler ENABLED/header readback verified; manual run actual HTTP 200 at 2026-10-05T21:29:08Z.
- All 13 additive Firestore overrides read back exactly; six retained/new watched/status indexes READY. Existing deployed rules deny direct browser access 403; no rules source edits.

## Operational limits and follow-up

Only explicitly watched desks collect; hourly UTC, 20 desks / 5 watches per owner, default 24 collections / 10 analyses per desk per UTC day. Coverage is the configured panel, not universal monitoring. GDELT and media remain disabled; human gold evaluation remains a reviewer-owned real pilot prerequisite. Counts/tokens are not dollar invoices. Full account erasure remains under the existing independent platform flag; actual desk/generated-capsule/job deletion was verified.

Workspace startup configuration has been saved as an onboarding draft for future environment review/publishing; this is separate from the live product release.

A forwarding test harness earlier exposed a disposable canary session in a log; the artifact was sanitized and the canary sessions revoked with OAuth readback. Subsequent tests used fresh sessions. Platform CA trust was restored without TLS bypass. No customer/signing credentials were exposed.

## Resume

Preserve current work. Read this file, RELEASE_PLAN, RUNBOOK and INTEGRATION_MAP. Use supported authenticated Cloud tools, never print credentials, and distinguish fixture/staging/public proof from human analytical quality. Do not claim customer demand from synthetic acceptance data.

## Safe release receipts

Actual JSON receipts are in [proofs/](proofs/): production-runtime-cad3eb2b.json, production-baseline-cad3eb2b.json, production-browser-cad3eb2b.json, production-worker-cad3eb2b.json, production-context-withdrawal-cad3eb2b.json, production-scheduler-cad3eb2b.json and release-cad3eb2b.json. Staged core/final-browser receipts are retained separately. Screenshot artifacts of actual private synthetic workflows are in output/signal/production-approved-brief-desktop.png and production-approved-brief-mobile.png.

The disposable canary's inherited notification stream/poll BFF returns401 in baseline/staged/public journeys; this is separate from SIGNAL's authenticated APIs and produced no browser runtime exceptions. The prior nonexistent native capsule path was fixed and actual public inspector click-through passes. No unrelated notification-service change is claimed.
