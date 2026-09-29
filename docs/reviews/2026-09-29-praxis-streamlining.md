# PRAXIS streamlining and workflow repairs — 2026-09-29

## Scope and release state

Local improvements to the existing Ask PRAXIS and capsule surfaces. No new primary navigation, datastore, provider credentials, or production configuration was introduced. Existing unrelated work in AGENTS.md and Serena configuration was preserved. Existing graph artifacts were refreshed with the repository-required `graphify update .`; include only intentional files in a release commit.

The production baseline inspected was commit `062463864ec6d54cf5ef80d8512311da8741736a`, Cloud Run revision `praxis-frontend-01072-56h`. The user subsequently authorized publishing and verification of both product workflows. This document records implementation and pre-release checkpoints; final served revision and authenticated production evidence belong in the release receipt.

## Changes

- Put the initial signed-in question composer before setup and empty-state cards. Collapse optional analyst personalization and first-run help; retain access to every existing workflow.
- Simplify the reading surface, sidebar spacing, composer typography and focus styling. Remove the duplicated plus sign on the capsule action and avoid displaying a permanently stale "Run in progress" label.
- Make capsule-builder steps scroll horizontally on smaller screens, with clear current-step semantics. Explain the source/review/private-draft workflow in plain language.
- Keep starter notes visible after upload or attachment failures. Reuse the already-created capsule and known upload receipt on retry; prevent repeated saves and edits during saving. Extract the upload/attachment sequence into a tested helper.
- Subscribe to the newest agent events and tool calls, with chronological display. Preserve pending approvals outside the recent history window. Reset subscriptions on user/run changes and prevent stale requests from overwriting a retried run.
- Prefer newer durable API/Firestore status receipts. Clear stale dispatch-failure presentation after successful recovery.
- Explicitly enable the provider's Google Search tool. Keep generated overview prose separate from independent source citations; count live receipts separately from pre-existing uploaded evidence. Map provider-attributed segments to their specific citation URLs; query echoes, titles and empty snippets cannot support claims.
- Keep context gaps separate from factual claims. Preserve explicit review gates for genuinely unsupported claims and searches that produce no live evidence.
- Remove an obsolete launchpad requirement from the pre-ship audit. Exclude generated browser artifacts from ESLint and keep Playwright CLI artifacts out of Git.
- Add explicit conversation-to-capsule actions in simple Ask and the workbench. Carry an owner-scoped, bounded transcript into the existing builder; label user statements and assistant suggestions separately. Typed ideas and notes use the same stored-document and review-proposal path.
- Hydrate Capsule Factory from owner-scoped document evidence and preserve missing-evidence warnings. Keep all proposed changes subject to review.
- Make saved capsule selection update the workspace pointer without overwriting document/source cores or bumping the capsule version. Preserve same-capsule workspace overrides across partial updates. Failed remote saves keep the prior attachment and show a recoverable error.

## Evidence

| Area | Result and boundary |
| --- | --- |
| Deployed capsule journey | Passed with the existing disposable Firebase account: TXT, PDF and DOCX intake; evidence proposals; persisted reject and approve decisions; capsule-aware Ask answer; history retrieval. Existing `capsule-studio.spec.ts`, with `PRAXIS_LIVE_ASK=1`. |
| Deployed agent infrastructure | Created run `a1336f29-ded4-43c1-b08b-e987319aac40`; observed dispatch, owner approval, research execution and sourceability review. The old deployed grounding implementation exposed the defects repaired here. No completed source-backed memo is claimed. The disposable run was cancelled after inspection. |
| Real provider call with repaired local code | Final Vertex call at 18:51:37 UTC returned four Google grounding citations, all with substantive provider-attributed text mapped to their source. An earlier attempt failed on transient connection/DNS errors; subsequent calls passed. This proves retrieval wiring and citation text, not deployed final-memo quality or independent verification of every factual statement. |
| Full unit suite checkpoint | 369 files / 1,579 tests passed before the final grounding repair. Additional focused tests cover the later changes. |
| UI/regression checkpoint | 102 tests across nine focused files passed. |
| Agent grounding final checkpoint | 38 tests across five files passed, including worker gates, evidence packs, sourceability ledger, research adapter and provider tool selection. Covers both provider metadata formats, per-source attribution and empty-snippet rejection. Independent rereview found no additional significant defect. |
| Browser layout | Public home, signed-in Ask and capsule builder checked at 320, 390, 768 and 1440 pixels. No document horizontal overflow; no uncaught page errors in the authenticated layout script. Desktop and mobile screenshots visually inspected. |
| Local browser limitation | The shell lacks Firebase Admin service-account configuration. Authenticated layout checks use the repository's existing local canary helper; some local data APIs return 500. These screenshots prove layout, not local persistence. The real persistence journey was verified separately on production. Development also reports the existing React/CSP eval diagnostic; security policy was not weakened. |
| Build/typecheck | Final production build, including TypeScript, passed after the citation-text patch. Local Firebase Admin configuration warnings remain; these do not constitute deployed runtime failures. |
| Lint | Full lint passed with zero errors and seven existing navigation warnings. |
| Audits | Aggregate gate, repository shape, architecture reference and AI route calibration passed. Corrected pre-ship audit: 140 PASS, 2 WARN, 0 BLOCKED. Final GCP audit reported zero hard failures and zero soft warnings. Local missing-env warnings are distinct from deployed runtime health. |

Artifacts are under `output/playwright/`: `improved-home-*.png`, `improved-ask-*.png`, `improved-builder-*.png`, `improvement-qa.json`, `grounding-smoke.json`, `deep-research-final.json`, `deep-research-cleanup.json`, and validation logs. These are local artifacts, not committed credentials or public customer content.

## Remaining release verification

Publish the scoped source changes using the authorized main release path. Verify the served commit/revision, repeat the three-format capsule journey, run conversation-to-capsule creation and later recall, and run Deep research through approvals to a saved, inspectable memo with real citation text. Check the new descending event and pending-approval subscriptions in the deployed browser.

The starter-note helper can reuse a receipt it received. A network failure after a server write but before its response remains an end-to-end idempotency limitation; this patch does not claim otherwise.

## Final verification

- Final grounding regressions: 38 tests across five files passed.
- Final real Vertex smoke: four citations, all with substantive source-associated segments.
- Final production build including TypeScript: passed.
- Final focused grounding ESLint: passed with no warnings or errors.
- Scoped diff whitespace check: passed.
- Public/mobile browser checks against the final production build: all 11 passed in 22.5 seconds, covering public routes, auth boundaries, mobile overflow and touch targets.
- Repository-required graph refresh: passed, with 17,642 nodes and 38,425 edges. Optional Terraform and SQL parsers are absent, so those files are not represented by this refresh. Graphify also reported a pre-existing non-UTF-8 ignore file and refreshed community labels from their hubs.

## Delivery self-evaluation

Pre-release checkpoint: 4.0/5. The local patch is reviewable; production release and complete agent-output proof remain at this checkpoint.

| Axis | Score | Evidence and improvement |
| --- | --- | --- |
| Accuracy | 4/5 | Tests, provider call and live capsule journey are evidenced separately. Complete deployed agent output still requires verification after release. |
| Completeness | 3/5 | UI, capsules and agent defects addressed locally; user-visible production outcome requires approved deployment and final memo proof. |
| Clarity | 5/5 | Change list and evidence table explicitly identify local and deployed boundaries. |
| Actionability | 4/5 | Scoped patch and concrete release steps are ready; the user has authorized push/deploy. |
| Conciseness | 4/5 | Handoff contains detailed evidence for repeatability; the user-facing answer should link here and summarize only the outcome. |

Highest-impact next step: deploy and verify the complete agent-to-saved-memo journey. This would close the completeness gap. Self-check: pre-release checks alone do not establish live readiness.

Copy-ready continuation: "Push and deploy the scoped PRAXIS streamlining changes documented in docs/reviews/2026-09-29-praxis-streamlining.md. Preserve unrelated work, verify the served commit/revision, repeat the TXT/PDF/DOCX capsule journey, and complete Deep research through approvals to a saved memo with inspectable citations."
