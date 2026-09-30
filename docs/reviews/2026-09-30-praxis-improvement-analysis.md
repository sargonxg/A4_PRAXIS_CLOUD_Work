# PRAXIS improvement analysis — 2026-09-30

PRAXIS has passed real signup, capsule-aware Ask, upload/review/reuse, model-route and writing/export journeys on named earlier releases. The integrated merged-source gate passed 440 files/2,396 tests. The fresh production build after the final settings copy passed at `2026-09-30T22:09:25.634Z`; corrective deployment and new live acceptance remain pending. See the [release record](2026-09-30-praxis-live-release.md) for exact source and deployment evidence.

This analysis retains all 80 findings from the September 30 baseline. Their labels describe that observation, not the present state of every implementation. The [implementation ledger](2026-09-30-praxis-implementation-ledger.md) maps each item to an owner, acceptance criterion and subsequent evidence. Successful execution does not establish analytical accuracy, measured benefit or institutional readiness.


## Current priorities

| Priority / area | Improvement | Proof needed |
| --- | --- | --- |
| P0: analytical fidelity | Keep missing information unknown. Make pilot, authority and funding recommendations conditional on actual evidence. | Original outputs and passage-based corrections; independent analyst review of the final body. Larger-model execution alone is insufficient. |
| P0: claims and sources | Link material claims to original supporting or contradicting passages, accurate publisher/role/date/locator, and explicit unavailable states. | Inspect originals and claim bindings; duplicated formats/cards must not imply independent corroboration. |
| P0: failed-run recovery | Persist missing optional source metadata safely; recover without duplicate products or overwritten human edits. | Retain the actual publication-date failure, prove the corrected live worker journey, then inject lost responses and interrupted writes. |
| P0: supported paid plan | Finish corrective runtime and truthful checkout activation for the dedicated $49/month Practitioner plan. | Merchant, product, seven-event raw webhook and secure runtime mounts are verified; checkout is disabled. Hosted checkout and genuine signed subscription lifecycle remain unproven. Team is unavailable. |
| P1: account lifecycle | Complete verification/reset/expiry recovery and bounded deletion across every configured owner store. | Disposable-account lifecycle and reconciliation receipts. Erasure remains disabled until complete cleanup/retry/Auth removal passes. |
| P1: useful written products | Improve decision briefs, options, claims maps, narrative comparison and handover; preserve review and source lineage. | Representative analyst tasks and native Word heading/table/link/locator fidelity. |
| P1: capsule/library scale | Make freshness, review status, actors/topics and older selected documents easy to find. Bound difficult and interrupted uploads. | Large-library/search/pagination tasks, late-file retrieval and ingestion recovery. OCR needs separate acceptance. |
| P1: economical routing | Use cheap extraction, balanced analysis and premium reasoning where useful; show actual execution/fallback. | Corrected deployed receipts plus matched quality, usage and latency workloads. No assumption that premium is always better. |
| P1: adoption/accessibility | Shorten copy and first-use steps; make source inspection, capsule creation and review usable on mobile, keyboard and screen reader. | Intended users complete tasks without coaching; measure useful-output time, revision burden, recovery and willingness to pay. |
| P1: operations | Prove restore, concurrent execution/load, bounded capacity and sanitized outcome monitoring. | Named thresholds, owners, failure/restore receipts and recovery actions. Healthy endpoints are narrower evidence. |
| P2: maintainability | Share typed context/evidence/review/run contracts and split responsibilities at established ownership seams. | Meaningful regressions and simpler developer entrypoints; keep the visible workbench compact. |

The requested [anti-slop review](https://github.com/miqdadbadjuber/anti-slop) applies to existing content and design: remove repeated explanations and unsupported claims, use concrete actions, and keep visuals only when they help a policy task. Preserve source quotations and necessary limitations. The [quality evaluation](2026-09-30-praxis-quality-evaluation.md) separates model execution, agent critique and independent assessment.

## Dated baseline and limits

The 80-item catalogue below was assessed against source `4480650999b5bd2808b55cba58f16e5a9a83d343`, revision `praxis-frontend-01082-nkw`, build `4b8fff18-5a9d-4c4a-9d97-5cff8fe89cb8`. Runtime observation `2026-09-30T13:15:36.261Z` found seven healthy checks. Documentation head `6ae479b9ba36bc335448f29e43007439f8eefbc8` did not redeploy the application. Screenshots are under ignored `output/playwright/improvement-analysis-20260930/`.

That baseline retained real user journeys and memo errors; it did not establish representative-user outcomes, measured capsule benefit, complete erasure, paid lifecycle or institutional reliability. Expired local Google access was later refreshed; it never established a production outage. Later exact-source results belong to the release record and ledger.

**Observed** identifies inspected UI or recorded production behavior. **Source** identifies code-derived findings that may lack live reproduction. **Unproven** identifies missing acceptance evidence. **Proposal** identifies a change requiring validation. Read these labels as dated findings; subsequent implementation evidence can close a finding without changing the original observation.

## 1. Evidence accuracy and analytical trust

1. **Observed/Source — Separate generated text from evidence.** `web-research.ts` collects grounding-support `segment.text`, then stores source-associated content/snippets. These are response segments, not necessarily quotations retrieved from the original page. Preserve them as provider attribution metadata; obtain original passages independently before presenting them as substantiation.
2. **Observed — Correct policy distinctions systematically.** The fresh memo conflated funding allocation/approval and expenditure, inferred no expenditure from unconfirmed funding, and overinterpreted a future review deadline. Add evaluation cases for authorization, obligation, disbursement, expenditure, implementation and review status. Missing evidence must remain unknown.
3. **Observed — Check what a citation actually supports.** GAO was cited around private synthetic Example Council facts, and an independent news source, Kenyan Lens, was presented as an institutional auditing framework. Validate source identity and role; distinguish a general framework from case-specific evidence. The generated self-critique also praised some faulty attribution: a second generated opinion is not independent verification. Derivative copies of one source do not establish independent corroboration.
4. **Proposal — Represent assertions precisely.** Distinguish supplied facts, actor claims, quotations, analyst inferences, assumptions and recommendations. Keep contested assertions attributed rather than flattening them into a single verified fact.
5. **Observed/Source — Make source inspection useful.** Some memo cards show no original preview/link; Home limits visible cards and verdict labels rely on hover titles. Show the claim, original passage, publisher, date, locator and why it supports or challenges the claim. Provide an expandable complete source list.
6. **Source/Proposal — Scope trust language.** Replace unexplained confidence percentages and structural “quality” scores with named assessments. Unknown unsupported-claim counts should say “Not assessed.” “Reviewed” should identify reviewer, version, date and scope. The public “TACITUS VERIFIED CONTEXT” badge needs an explicit, accurate definition.
7. **Proposal — Test hostile source instructions.** Uploaded/web text must remain evidence rather than agent instructions. Exercise a source containing embedded attempts to change retrieval scope, approvals or output destinations.

## 2. Positioning and public content

8. **Observed/Proposal — Retain the restrained visual identity and clear headline.** “Policy analysis you can inspect” and the navy/green/cream design work well. Support the promise with a completed example showing evidence, assumptions, review changes and the final brief.
9. **Proposal — Define capsules in ordinary language.** Suggested copy: “A Context Capsule saves the sources, assumptions and analytical approach you want PRAXIS to reuse.” Then explain that saving context does not independently verify it.
10. **Observed/Proposal — Reduce first-use terminology.** Explain ACH as comparison of competing hypotheses. Move cores, receipts, ontology, JSON, sourceability and engine names behind relevant explanations or advanced detail.
11. **Observed/Proposal — Clarify entry actions.** Make Ask the primary action and Build a capsule the clear secondary action. Explain Deep research by its extra source collection, time and review requirements. Preserve the question when sign-in intervenes.
12. **Proposal — Demonstrate persona outcomes.** Provide one source-backed decision brief, one analyst comparison and one narrative analysis. Explicitly label sample/synthetic material. Show what a capsule adds on the second task.
13. **Proposal — Apply TACITUS framing coherently.** Use “AI you can check” as a practical inspection promise. PRAXIS is the workbench, Context Capsules carry reusable reviewed context, and DIALECTICA remains an internal adapter boundary.

## 3. Navigation and product structure

14. **Source — Unify destination names.** Home uses Ask, Context Capsules library and Drafts while the wider shell uses Home, Capsules and Recent work. Use one vocabulary across desktop, mobile, builder and workbench.
15. **Proposal — Keep Home and Capsules as the visible spine.** Access writing, recent work, Boardroom and advanced tools within existing surfaces. Consolidate overlapping entry points before introducing navigation.
16. **Source — Make active navigation accurate.** Path matching should distinguish descendant routes and query-backed lanes so only the appropriate destination appears selected.
17. **Proposal — Make returning predictable.** Preserve the active question, capsule composition and writing state when users inspect sources, open a memo and return. Clearly distinguish starting new work from resuming a saved conversation.

## 4. Access and onboarding

18. **Source — Preserve intended first-use destinations.** Middleware and onboarding skip/completion can lose a builder or question destination. Carry a validated destination and recoverable question through both onboarding choices.
19. **Observed/Source — Protect login before interactivity.** Earlier automation submitted the form before hydration; subsequent handler-ready login passed. Verify delayed scripts and slow devices, with a visibly ready submit state and preserved redirect on failure.
20. **Unproven — Complete the account lifecycle.** Prove signup, first onboarding, verification/reset, expired-session recovery, logout, deletion and two-account switching with disposable accounts and redacted receipts.
21. **Proposal — Offer optional, short onboarding.** Ask what the person wants to produce, allow a useful sample immediately and let them refine profile/method preferences later. Validate with policymakers and analysts who do not know capsule terminology.

## 5. Capsule creation and lifecycle

22. **Source — Align visible settings with persistence.** Source-domain filters, selected tools, timeline anchors and causal fields are absent from the private Save draft schema. Explicitly separate private preferences, review proposals and immutable package publication; make every supported setting survive save/reopen/attachment.
23. **Source — Handle unsaved changes.** Edits after saving can leave the saved-state indicator and Use in Ask action pointing to an older snapshot. Show unsaved changes immediately and offer Save and use; preserve edits after failures.
24. **Proposal — Simplify the default builder.** Start with Purpose → Material → Review and save. Audience, decision date and desired product use plain questions. Offer advanced configuration when relevant.
25. **Proposal — Give capsules a practical readable summary.** Show purpose, scope, as-of date, owner, reviewed sources, assumptions, open gaps, method and intended output before advanced metadata.
26. **Source/Proposal — Make version and review lifecycle explicit.** Distinguish draft, reviewed version, outdated version and archived capsule; show what changed and which memo or conversation used each version. Require a proposal's base version/content fingerprint to be checked before application; conflicting stale proposals should need renewed review rather than overlay newer reviewed context silently.
27. **Proposal — Support deliberate reuse.** Fork for a new policy situation, set review dates, mark stale facts, and retain original documents and rejected proposals. Generated work should return as a review proposal rather than automatically becoming canonical evidence.

## 6. Ask and context selection

28. **Source — Separate promotion from replacement.** For A primary/B reference/C tool, Make primary on B can replace A and deduplicate B. Promotion should retain A as a reference, retain C and preserve pinned versions/document references.
29. **Source — Make picker failures visible.** Inventory failure currently resembles an empty library in the small picker. Distinguish loading, empty, failed and populated states; provide retry, readable names and useful search.
30. **Proposal — Show actual context use.** List attached sources, selected capsule version and the source types used for this turn. Do not imply all documents were read if only a subset was retrieved.
31. **Observed/Proposal — Keep quick questions quick.** Preserve the repaired direct/no-agent and supplied-only behavior. Keep output-format preferences from forcing every factual recall into a long memo.
32. **Proposal — Make research choices explicit.** Clearly distinguish attached-material analysis from external research. Explain additional work before approval and expose relevant scope limits without requiring users to learn runtime jargon.
33. **Observed/Proposal — Clean ordinary prose.** Replace opaque capsule IDs and generic PRAXIS Graph attribution with readable capsule/document names and accurate source roles.

## 7. Writing, revision and publication

34. **Proposal — Make the written product central.** A decision memo should foreground its decision, options, recommendation, evidence, assumptions, uncertainties and next actions. Source/runtime details should be easy to inspect without competing with the editor.
35. **Observed/Proposal — Complete body-bound human approval.** The corrected memo remains review-required/export-blocked. Add an explicit action for the authorized reviewer to approve a specified saved body/version, with review scope and unresolved issues. Later edits must invalidate that approval.
36. **Proposal — Connect critique to edits.** Show proposed changes beside the current text, apply/reject decisions and differences. Reviewer feedback that has not been applied must not appear as completed review.
37. **Observed/Proposal — Hide internal identifiers by default.** Artifact IDs, capsule IDs and outputCapsuleId none belong in diagnostic detail, while analyst-facing titles, save state and review state belong beside the writing.
38. **Unproven/Proposal — Verify useful exports.** Test source locators, footnotes, headings, links and review-state handling in DOCX/PDF. A draft may be downloadable if explicitly labeled; download and publication approval must remain distinct.
39. **Proposal — Support revision rather than repetition.** Let users request shorter wording, different audience or revised options while retaining unchanged evidence and clearly identifying changed claims.

## 8. Policy and narrative methods

40. **Proposal — Use a few complete templates.** Prioritize decision brief, options comparison, stakeholder/claims map, narrative comparison and handover. Each should expose its assumptions and review steps.
41. **Proposal — Make policy feasibility inspectable.** Include legal authority, implementing institution, resources, political constraints, affected groups, uncertainty and what evidence would change the recommendation when relevant.
42. **Proposal — Preserve narrative attribution.** Capture speaker, wording, audience, place, date, source, expressed claims and analyst-inferred frame separately. Distinguish disagreement over facts from differences in framing.
43. **Proposal — Describe corpus limitations.** State sampling, language, translation, time window and missing voices. Do not infer popularity or population opinion from a small selected document set.
44. **Proposal — Show useful comparisons.** Timeline, claims/evidence matrix and options table are often more useful than a general graph. Tie each visual element to passages and offer accessible text/table equivalents.

## 9. Retrieval, upload and library scale

45. **Source — Filter selected documents before ranking.** The evidence pack requests situation-wide top chunks and then filters to capsule document IDs. Competing unselected documents can displace relevant selected passages; the fallback reads the first 900 characters. Scope retrieval first and test late-document facts amid competing material.
46. **Source — Replace silent retrieval omissions with explicit status.** Several evidence reads catch errors as empty results. Separate no evidence, not indexed, failed retrieval and out-of-scope sources; preserve a recovery path.
47. **Source/Unproven — Bound ingestion before expensive work.** The upload path reads whole buffers/text, stores full extracted text and embeds chunks in a single batch. Enforce byte, extracted-text, chunk and time limits; use bounded writes and visible progress where needed. Random document creation and a separate count update need an upload operation identity so a lost-response retry does not create another logical document/count. Existing TXT/PDF/DOCX journeys pass; this is capacity/recovery hardening.
48. **Source — Paginate documents, capsules and review cards.** Latest-100 document/review-card limits can hide older material; capsule inventory reads and normalizes the full collection. Add cursor-based access, owner/situation/archive filtering and a lightweight summary DTO. Search and page summaries should not silently imply completeness; test hundreds of capsules and older selected documents.
49. **Unproven/Proposal — Handle difficult documents honestly.** Advertise actual supported formats and limits. Identify scanned PDFs or extraction failures; add OCR only behind a tested need and preserve page/paragraph locators.
50. **Proposal — Improve library organization.** Search names/content/actors, filter by purpose, reviewed state and date, and keep personal drafts, starters and externally sourced material clearly identified.

## 10. Agent execution and recovery

51. **Source/Unproven — Enforce execution ownership during concurrent delivery.** Dispatch claims and deterministic task names exist; research output uses a stable per-run ID. However, worker handlers accept queued/running runs and status updates lack a current-status predicate. Test execution leases, conditional transitions and partial-effect recovery; do not infer exactly-once effects from deterministic dispatch names.
52. **Unproven — Inject lost responses and interrupted writes.** Test failure after a memo save but before final status, between version/body/review writes and during approvals. Recovery must preserve owner, sources, decisions and intended output rather than create extra versions or restart blindly.
53. **Proposal — Present actionable run states.** Queued, collecting sources, awaiting approval, drafting, saved, failed and cancelled should explain what exists and what the user can do next. A transport response is not proof that a product was persisted.
54. **Unproven/Proposal — Make cancellation and cost limits meaningful.** Verify cancellation stops further expensive steps where possible and explain any completed work. Use understandable user plan/usage limits; keep internal provider costs in operator telemetry.

## 11. Privacy, collaboration and institutional governance

55. **Observed/Source — Make existing privacy documentation specific.** Legal routes exist and disclose US infrastructure. Add concrete retention periods by data type, deletion timing/backup exceptions, processing purposes and the verified model-provider data-use posture. Explain full extracted-document storage and logs as actually implemented.
56. **Source/Unproven — Prove complete erasure across stores.** Account DELETE removes known situation children, up to 500 credit transactions, the user document and Auth account. Inventory other owner-scoped capsule/output/history records, Storage, SQL and traces; verify erasure or documented retention exceptions. This review did not prove a data leak or complete deletion.
57. **Unproven — Scope institutional claims.** Sharing, roles, SSO/SAML, residency and private deployments each need their own acceptance evidence and agreements. Do not present proposed/custom services as verified self-service capabilities.
58. **Proposal — Make sharing deliberate.** Preview which documents, private notes and products will be shared; show permissions and revocation. Separate viewing, editing, reviewing and publishing responsibilities when team workflows are enabled.
59. **Proposal — Use provenance for accountability.** Record who reviewed which version and what unresolved issues were accepted, while keeping private policy material out of general telemetry and support screenshots.

## 12. Pricing, support and expectations

60. **Observed/Proposal — Preserve the paid-unavailable notice and simplify plans.** Pricing already states paid upgrades are unavailable. Clearly divide current free-beta capabilities, proposed paid capabilities and negotiated institutional services.
61. **Proposal — Show real usage limits.** Explain supported uploads, workspace limits and research allowance where enforced; avoid undefined credits and feature lists that imply unlimited operation.
62. **Unproven — Verify billing before activation.** Exercise sandbox purchase, webhook replay, entitlement enforcement, cancellation/refunds and account deletion effects before enabling checkout.
63. **Proposal — Offer useful support paths.** Add a visible feedback/report-problem action with optional redacted run references, known limitations and recovery guidance. Do not silently include private documents in support reports.

## 13. Accessibility, responsiveness and performance

64. **Observed/Source — Keep the passing mobile layout, improve evidence interaction.** Home/memo responsive checks and Close passed. Hover-only claim details and picker semantics still need keyboard, screen-reader and touch verification.
65. **Proposal — Audit full task accessibility.** Test focus restoration, dialog trapping, file upload, editor/review controls, announcements of save/error states, contrast and zoom. Color cannot be the only carrier of review meaning.
66. **Observed/Proposal — Shorten the mobile first-use path.** Example cards stack into a long page. Present a concise first task and let users reveal examples/methods when needed; validate this rather than assuming it improves completion.
67. **Unproven/Proposal — Measure real performance.** Separate cold/warm first load, login readiness, first answer token, upload processing and completed saved-product latency. Use slow-device/network evidence; this review establishes no general speed or capacity target.
68. **Proposal — Preserve existing search/share metadata.** Metadata, canonical routes, robots and sitemap already exist. Validate indexable public workflow text and preview cards using realistic shared URLs; keep private work out of indexing.

## 14. Codebase and documentation simplicity

69. **Source — Split responsibilities at existing boundaries.** The workbench is 12,292 lines, product context catalog 12,122, worker 5,395 and capsule service 4,962 at this snapshot. Separate generated catalog data from executable behavior; extract editor/review/source/context/run modules according to ownership. File size is a maintenance signal, not proof of a bug.
70. **Proposal — Keep one contract for each concept.** Share typed schemas for capsule persistence, context operations, source passages, review state and run outputs; avoid divergent private/package save shapes masquerading as one operation.
71. **Proposal — Preserve canonical ownership.** ContextCapsules/Firestore own product context; SQL ledger/Cloud Tasks own durable execution; upstream DIALECTICA produces reviewable proposals through a narrow adapter. Avoid duplicate canonical memory stores or routing frameworks.
72. **Source — Correct conflicting product documentation.** The policy guide contains current Home/Capsules instructions alongside an older proposed Home/Ask/Library/Memo/Canvas/Advanced spine. Mark proposals/history clearly or move them out of the current user guide.
73. **Proposal — Give readers clear documentation entry points.** Maintain a short user guide, architecture/ownership map, contributor validation guide and operator runbook. Current acceptance evidence should be linked separately from historical checkpoints.
74. **Proposal — Consolidate validation entry points.** Keep a fast local gate, a release gate and a live user-journey gate. Many script names should not make operators guess which checks establish which claims.

## 15. Quality measurement and operation

75. **Source/Unproven — Measure capsule value using actual outputs.** Existing deterministic contract checks and V3 comparison scenarios with a preset baseline delta are structural proxies, not measured analytical benefit. No direct UI rendering of that comparison score was established. Compare six to ten public or synthetic policy/narrative cases with/without reviewed capsules using the same sources/model snapshot and comparable budget. Use blind analyst review where practical; score factual accuracy, supported claims, uncertainty, narrative attribution and usefulness; retain original outputs and reviewer rationale.
76. **Proposal — Test with representative users.** Ask policymakers, analysts and narrative researchers to complete a brief and reuse context without coaching. Track completion, context mistakes, review comprehension and time spent validating claims; do not invent improvement percentages.
77. **Proposal — Keep the real production journey gate.** Retain document intake/review/reuse, direct Ask, conversation capsule, research/memo editing and logout coverage. Add account/recovery/capacity tests where their evidence is missing, rather than treating more unit tests as analytical validation.
78. **Unproven — Close the operator evidence window.** After scoped Google sign-in renewal, inspect current service state and the logs covering final journeys. Healthy endpoints do not establish clean historical logs or clear the prior heap incident.
79. **Proposal — Monitor meaningful failures.** Track failed saves, stuck approval/runs, extraction/retrieval gaps, duplicate effects and unsuccessful logins without retaining unnecessary private text. Set alerts around user-visible outcomes.
80. **Unproven/Proposal — Prove recovery and sustainable operation.** Exercise backup restore, database/storage growth, simultaneous users, rate limits and load behavior before claiming institutional reliability.

## Tooling decisions

Use the [September 29 official/GitHub tooling review](2026-09-29-praxis-tooling-research.md) as dated evidence, not a blanket upgrade instruction. Existing Genkit evaluation can hold the quality corpus; existing Playwright authentication tooling can prove account and user journeys; existing SQL/Cloud Tasks can support recovery hardening. Google documents that [Cloud Tasks duplicates can occur](https://cloud.google.com/tasks/docs/common-pitfalls#duplicate_execution).

Evaluate compatible maintenance fixes only with the relevant source/stream regression evidence. The reviewed AI SDK 6 maintenance release addresses metadata propagation; SDK 7 is a separate migration with documented stream/result/telemetry changes. ADK continuation is a candidate for an actual interrupted workflow, not a reason to add a second runtime. No new orchestration framework, general browser agent or database is needed to address the highest-priority findings.

Recommended sequencing: first repair evidence identity, saved-state/context semantics and reviewer completion. Then simplify vocabulary/navigation/onboarding, complete account/capacity/recovery proof and improve source interaction. Next measure policy/narrative outcomes and enable institutional features only when their specific gates pass. Refactor incrementally alongside those packets while preserving the passing production journeys.

## Source references

- [Production acceptance](2026-09-29-praxis-production-acceptance.md) and [user readiness](2026-09-29-praxis-user-readiness.md).
- [Web research adapter](../../src/lib/ai/web-research.ts), [agent evidence pack](../../src/lib/agent-runtime/evidence-pack.ts), [document service](../../src/lib/firebase/documents-service.ts).
- [Home shell](../../src/components/app/praxis-chat-first-shell.tsx), [navigation registry](../../src/lib/navigation/primary-nav.ts), [small capsule picker](../../src/components/cores/CapsuleListPicker.tsx).
- [Builder wizard](../../src/components/capsules/CapsuleBuilderWizard.tsx), [private draft schema/service](../../src/lib/context/capsule-builder-draft.ts).
- [Worker](../../src/lib/agent-runtime/worker.ts), [SQL ledger](../../src/lib/agent-runtime/postgres.ts), [workbench](../../src/components/praxis/tasklet-praxis-workbench.tsx).
- [Legal page content](../../src/lib/legal/pages.ts), [account routes](../../src/app/api/account/route.ts), [pricing](../../src/app/pricing/page.tsx), [Guide](../../src/app/guide/page.tsx).
- [Canonical product structure](../product/PRAXIS_CANONICAL_APP_STRUCTURE.md), [policy research guide](../product/CONTEXT_CAPSULE_POLICY_RESEARCH_GUIDE.md), [runtime ownership](../architecture/PRAXIS_AGENT_RUNTIME_ARCHITECTURE.md).

Private acceptance IDs are intentionally not reproduced here. Screenshots and detailed receipts remain in the ignored local evidence directory. The findings describe this snapshot, not every possible user/device/workload.
