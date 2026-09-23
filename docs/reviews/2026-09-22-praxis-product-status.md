# PRAXIS: two-pillar product assessment

The product is one policy workbench: **ask and write with optional context**, and **build reusable context capsules from evidence and analyst input**. Capsules should help, not become a prerequisite for a general question. Source checking, challenge/red-team review and writing belong within these workflows, not separate products.

This is a release-checkpoint assessment, not certification that every route, subscription or autonomous workflow is ready for sale. Unknown is not a pass.

| Capability | Evidence at this checkpoint | Remaining acceptance gate |
| --- | --- | --- |
| Public home and mobile | Question-first home, compact navigation, login handoffs; six browser checks pass at 360/390/768 px. | Repeat after deployment; accessibility audit with assistive technology. |
| Accounts | Existing disposable account signs in through real Firebase and opens the workspace. | Fresh signup, verification, password reset, expired-session and account-deletion journeys. |
| Pillar 1: agentic chat | Existing chat, optional capsule context, research and writing surfaces retained. | Live model answer with no supplied capsule; full agent result/receipt and export proof, not just queued-run status. |
| Capsule attachment | Twelve spotlighted methods/cases/output structures; single-capsule attach passes real browser steps. Saved copies are not overwritten. | Version-aware updates for old snapshots; measure token budgets and multi-capsule conflicts. |
| Specific analytical methods | Inspectable institutional/IAD, fiscal/distributional and counterfactual/chronology recipes. Source references are separated from case evidence. Prompt-injection tests use saved recipe inputs, steps and checks. | Expert-reviewed method correctness and blinded capsule-vs-document outcome comparisons. No guaranteed quality uplift is claimed. |
| Pillar 2: evidence intake | Real text upload, extraction and persistent document/source receipts pass. Private workspaces are created when no case is selected. PDF/DOCX use the canonical parser; scanned documents report missing text. | Live PDF/DOCX/scanned-file matrix; OCR and extraction-quality checks; long-document coverage beyond the clearly disclosed 16,000-character preview. |
| Capsule proposals and review | Full real-Firebase browser journey passes locally in 55 seconds: login, spotlight attachment, source upload, architect proposals, inspection, rejection and read-back of the saved decision. Case-scoped lookup reduced the observed architect request from 106 seconds to 8 seconds. | Repeat on deployed revision, prove approval and subsequent analysis. Extraction is conservative and not a complete conflict ontology; timings are diagnostic samples, not a benchmark. |
| Capsule persistence and updates | Existing version/history, fork and reviewed-update mechanisms are retained. Completed decisions cannot be overwritten. | Reconcile builder draft and canonical schemas; lossless DIALECTICA adapter round trips; explicit catalogue upgrades that preserve private edits. |
| Source checking and writing | Dedicated sourceability API and writing/editor integration exist; thin context is not required by the sourceability route. | Live unsupported-claim check; discoverability from main chat; end-to-end grounded answer → editable brief → exported document with surviving citations. |
| Free access | Free-plan UI and authenticated workspace entry exist. | New-account journey and server-enforced quota/entitlement matrix. Existing test-account access does not establish all free-tier behavior. |
| Paid plans | Pricing and checkout/webhook/portal code exist. Production health reports Polar unconfigured. | Operator-supplied billing setup; sandbox purchase, webhook replay/idempotency, cancellation, downgrade and entitlement tests before charging users. |
| Optional JEV review | An isolated adapter based on the official TypeSafe SDK passes 14 mocked-boundary tests. Conversation-bar control explicitly says Not connected; selection is disabled and no content is transmitted. | Resolve optional Python dependencies, configure a server secret, wire authenticated opt-in routing, evaluate rubrics and verify live calls. No production JEV capability is claimed. |
| Performance | Selected attachment avoids full-library reads; case-scoped tool preparation uses two indexed owner-scoped queries (live diagnostic: 478 ms). | Metadata-only paginated catalogue, removal of implicit bulk starter seeding, representative latency/load budgets. A 312-capsule test inventory was 36.6 MB. |
| Security and operations | Dependency high/critical findings patched; real Firebase/GCP access restored; supplied key stays outside repository and build bundle. | Track moderate/low findings, prove tenant isolation and recovery, retention/deletion, monitoring, incident support and cost controls. |

## Commercial sequence

1. Prove both deployed user journeys, including source inspection and reuse in a later question.
2. Simplify large-library behavior and upgrade old method snapshots through user-visible review.
3. Run analyst-reviewed evaluations: factual errors, unsupported claims, citation correctness, edit time and repeat capsule use.
4. Finish billing and entitlements, then run a small supported paid pilot before claiming Harvey/Legora-level reliability.

## Release evidence

Initial release `edce8440bf3618f440b67f6d89b1338a63833ac4` was pushed to GitHub and deployed successfully. Manual Cloud Build `725b20c4-1401-409a-bf19-8207bb197d9e` succeeded; the custom domain reported that exact source commit. A successful build or healthy configuration alone is not proof of successful analysis.

Initial production smoke: seven checks passed (real login/chat without supplied capsules, missing-evidence source check and six mobile checks); the builder journey failed. Logs identified PDF.js initialization breaking even TXT uploads, concurrent full-library reads exhausting the Node heap, and undefined optional chat metadata preventing history persistence. These are recorded rather than treating the first deployment as a successful two-pillar release.

The follow-up correction isolates parsers by file format, includes native PDF runtime files and Genkit prompts in the container, deduplicates pending owner-scoped inventory work without retaining stale snapshots, sanitizes optional history metadata, and changes frontend Cloud Run limits from 1 GiB/concurrency 80 to 2 GiB/concurrency 8. This increases per-instance memory cost; it is a containment measure, not a replacement for pagination/load testing. Both manual and on-push build definitions carry the resource setting.

- Local suite: 363 files / 1,550 tests passed (`output/praxis-tests-final.log`).
- Capsule journey: passed (`output/praxis-journey-final.log`); screenshot inspected (`output/playwright/capsule-review-journey.png`).
- JEV: 14 Python tests passed (`output/praxis-jev-tests.log`); no SDK installation or live provider call.
- Public mobile: six tests passed (`output/praxis-mobile-final.log`).
- Production dependency audit: zero critical/high; 44 moderate and 3 low (`output/praxis-audit-production-ship.json`).
- Test fixtures are explicitly synthetic and remain in the disposable canary workspace, not a public capsule catalogue.

## Copy-ready continuation prompts

### 1. Complete optional JEV review

> Continue in C:\Users\giuli\tacitus-products\praxis. Read AGENTS.md and docs/reviews/2026-09-22-praxis-product-status.md. Complete the existing optional JEV adapter using the official TypeSafe Python SDK, not a fork of jev-usecases. Check dependency compatibility, use an operator-supplied server-side secret, add authenticated/calibrated opt-in routing, and enable the existing conversation-bar control only when readiness is proven. Send minimal selected evidence with explicit consent. Preserve advisory-only results, abstentions, deadlines and provider-error states; never call probabilistic scores truth. Test tenant isolation, disabled mode, cost limits and live Choice/Score/Noul responses. Deploy and prove one end-to-end opted-in turn, reporting anything still blocked.

### 2. Complete the capsule lifecycle and scale

> Continue PRAXIS using its existing capsule surfaces. Replace full inventory transfer and implicit bulk starter seeding with an owner-scoped metadata-only paginated catalogue and on-demand detail reads. Preserve search, sorting, counts, attachment and private edits. Reconcile builder drafts with canonical capsules through the narrow DIALECTICA review boundary. Prove PDF/DOCX/text intake, approve/reject with provenance, graph/ontology inspection, versioned updates, attachment and actual later analysis. Add scanned-document/OCR and long-document coverage tests; measure 1,000-capsule performance and cross-tenant access. Ship only after real deployed browser journeys pass.

### 3. Finish accounts, free/paid entitlements and paid-pilot operations

> Audit then complete fresh signup, verification, password reset, session expiry and account deletion. Implement server-enforced free/paid quotas around existing product surfaces. Use the operator's Polar sandbox configuration; prove purchase, signed idempotent webhooks, cancellation, downgrade and billing portal before enabling paid checkout. Review tenant isolation, retention, backups/recovery, error monitoring and cost limits. Do not activate real charges or invent billing credentials. Return a launch checklist separating passing evidence from missing operator decisions.

### 4. Prove analytical value and writing delivery

> Build a small analyst-reviewed evaluation set comparing no capsule, raw documents and structured capsules for political/institutional, fiscal/distributional and conflict/chronology analysis. Measure unsupported claims, source entailment, factual/date errors, counterarguments, uncertainty and analyst editing time. Complete answer-to-editable-brief-to-export with citations surviving export, plus source-checker discoverability. Validate all twelve spotlights and repair legacy synthetic review/rating data only through a reviewed migration. Do not claim quality uplift without measured results. Ship tested improvements inside Ask PRAXIS/cockpit/workbench, with a bounded follow-up list.
