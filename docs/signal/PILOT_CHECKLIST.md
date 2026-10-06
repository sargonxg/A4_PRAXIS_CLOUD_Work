# SIGNAL text pilot checklist

Code implementation and focused fixture tests do not establish production readiness or customer demand. A release operator and a named reviewer must close the live gates before the founder runs a real pilot. The release operator gates below are backed by 498 files / 3,034 tests and actual tagged/public authentication, model, worker, rights, deletion and scheduler receipts. Human reviewer/customer evaluation remains pending. Image/audio/video analysis disabled; sampled licensed headline metadata is available. GDELT remains disabled after observed provider failures; at least 200 human-labelled gold items remain required.

## Release operator

- [x] Record exact tested commit, image/revision and rollback revision from RELEASE_PLAN.
- [x] Pass the full root AGENTS gate; distinguish baseline results from the new SIGNAL revision.
- [x] Verify tagged staging sign-in on an approved Firebase browser origin.
- [x] Read back all 15 additive field overrides and required READY indexes; deployed existing rules deny direct client access 403, with no rules source changes.
- [x] Run an authenticated two-tenant create/capture/review/context/assessment/approve/export/delete journey; verify owner isolation and rejected/stale evidence behavior.
- [x] Verify worker rejects missing/wrong OIDC, cron rejects wrong secret and queue lease recovery is bounded and fenced.
- [x] Demonstrate real watch pause and two-phase generated-capsule/job/desk deletion. Verify retry exhaustion, crash lease recovery and preservation of attached originals in deterministic tests; no live crash injection or real customer account deletion is claimed.
- [x] Verify production worker target before traffic promotion, then public `/signal`, authenticated workflows and existing PRAXIS regression surfaces.

- [x] Verify default world explorer and retained evidence workflow: eight exact-source staged and eight plain-public browser tests, with zero skipped/failed/flaky tests.
- [x] Collect the actual bounded public snapshot and validate calibrated staged/global and public/Brazil AI citations, values and attribution without promoting evidence or sharing private questions.
- [x] Read back the separate twelve-hour world schedule and observe actual HTTP 200 transport; preserve the hourly private watch job. Receipt: [release-world-36389842.json](proofs/release-world-36389842.json).

## Reviewer and source-panel owner

- [ ] Define customer question, decision audience, scope, languages, observation window and review cadence.
- [ ] Choose real permitted sources, record capture/export rights basis and identify sources that are discovery-only.
- [ ] Record panel omissions, publication/event-time uncertainty, syndication/reuse dependence and provider health denominators.
- [ ] Assign a named reviewer for every enabled language and expert context; use original exact wording and UTF-16 spans.
- [ ] Label at least 200 representative gold items with speaker, literal anchor, modality, conditions and acceptance/error categories; include disagreement, negatives, missing dates and revisions.
- [ ] Measure extraction/review accuracy and error categories against gold before claiming validated multilingual performance. Fixture passes alone are insufficient.
- [ ] Produce the first reviewed assessment and cited approved brief with alternatives, uncertainty, invalidators and pinned native context/evidence versions.
- [ ] Export only rights-cleared approved artifacts; confirm synthetic demos are separated and labelled.

## Founder measurements

- [ ] Before use, record manual time to find evidence, review source readings and prepare an approved brief for the same question.
- [ ] During use, record active desks/watches, actual collection/analysis attempts, failures/partial results, returned revisions, reviewed readings, corrections and approved briefs.
- [ ] Measure reviewer time and actual customer use with consent. Capture whether an approved brief aided the stated decision; do not fabricate outcomes or demand.
- [ ] Record model token receipts and provider invoices separately. Counts/tokens and internal estimates are not measured dollar expenditure.
- [ ] Review quota/capacity behavior: 20 desks, 5 watches, default 24 collections and 10 analyses per desk per UTC day. Keep watch paused where live recovery/provider health is unverified.
- [ ] Decide whether the quality/time/use evidence supports expanding the pilot; founder owns outreach and commercial decisions. No outreach is authorized by this checklist.

## Remaining risk ownership

| Open check | Owner | Next evidence |
| --- | --- | --- |
| Future release regressions and live crash drills | Release operator | Repeat exact-revision gates; targeted disposable staging crash exercise before raising capacity |
| Provider health and bounded panel coverage | Source-panel owner | Successful receipts with denominators and explicit gaps; GDELT recovery if enabled |
| Human gold set and language quality | Reviewer | At least 200 labelled items and measured error categories |
| Account-level erasure guard | Platform owner | Separate existing account-deletion verification; do not enable it solely for SIGNAL |
| Disabled image/audio/video tiers | Product/release owner | Rights-cleared provider/runtime validation before any enablement |

Keep PROGRESS and the release plan current with dated evidence. Unchecked boxes remain pending, even if the UI is reachable.

GDELT discovery is gated by `SIGNAL_GDELT_ENABLED` and disabled for this release following the observed provider HTTP 503. Enable it only after a bounded successful live discovery check; supplied text and permissioned RSS are available.
