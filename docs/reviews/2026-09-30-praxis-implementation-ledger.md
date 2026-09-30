# PRAXIS implementation ledger — 2026-09-30

Status: the integrated local gate and fresh production build passed; corrective deployment and fresh live acceptance remain pending. Earlier named releases passed signup/onboarding, capsule-aware Ask, reviewed exports, three model routes, upload/reuse and 55 Rules guard checks. A real worker memo-persistence failure is fixed locally and must pass the next deployed worker journey. The [release record](2026-09-30-praxis-live-release.md) owns exact current proof.

This ledger maps all 80 [baseline recommendations](2026-09-30-praxis-improvement-analysis.md) to work and acceptance. Dated packet/disposition rows retain initial states; the integrated evidence below records subsequent progress. Packet assignment or a single happy path does not imply completion.


## Delivery states

| State | Meaning |
| --- | --- |
| Open | Required work or proof has not yet been delivered. |
| In progress | An owner is implementing the packet; no completion claim. |
| Implemented locally | Source or documentation exists; necessary acceptance checks are still pending. |
| Validated locally | Named meaningful checks passed against the implemented source. This does not prove deployment or provider access. |
| Verified live | A release source/revision and redacted real-service journey prove the behavior. |
| External dependency | Completion requires a configured provider, billing sandbox, restored cloud access, institutional agreement or other external state. |
| Empirical validation pending | Actual representative users or independent analyst assessment are required. Code and synthetic tests cannot complete this state. |

Packets can be partially delivered. Do not mark a packet complete merely because one recommendation or one happy path passes. Record actual files, tests and scope below before promoting a state.

## Verified baseline and release boundary

| Evidence | Baseline |
| --- | --- |
| Served source | `4480650999b5bd2808b55cba58f16e5a9a83d343` |
| Revision / build | `praxis-frontend-01082-nkw` / `4b8fff18-5a9d-4c4a-9d97-5cff8fe89cb8` |
| Runtime observation | September 30, 2026; seven healthy checks. See acceptance and improvement-analysis records for their exact observation times. |
| Previously passed owner journeys | Existing-account login; TXT/PDF/DOCX intake, source proposals and apply/reject persistence; capsule attachment and recall/reload; conversation-to-capsule; research approval and saved memo; edit/save/reopen; responsive Close; actual logout and blocked logged-out private-route access. |
| Previously passed local gate | 390 files / 1,830 tests, zero skips; build/typecheck and non-GCP audits. These figures describe that release, not this new implementation. |
| Analytical limitation | The generated memo contained substantive inference and source-attribution errors. Agent-assisted corrections were saved, but the two-institution original-passage requirement remained incomplete. Operational success is not analytical accuracy. |
| Historical September 30 release | Source `9e95085f` served on `praxis-frontend-01084-s8p` at 100% traffic at readback, build `d7d99db1-a0d2-4ff9-9525-04f82dcc0982`. Its dated journey receipts remain separate from the next corrective release. |

## Release validation

Historical source `9e95085f` passed the final 426-file / 2,174-test suite with zero failures/skips, production build/typecheck and zero-error lint (five existing warnings). Earlier 2,162/2,171-test gates and failed intermediate assertions remain retained in the release evidence directory. Mocked browser checks prove only their fixture behavior.

The next source merges upstream chat-first/capsule work and Next.js 16.3.7 with memo serialization, truthful receipts, supported-plan billing and anti-slop changes. The integrated gate passed 440 files/2,396 tests with zero skips; aggregate build/typecheck, architecture/repository/routes/capsules/agent/GCP/surface/simplification and AI routes passed. GCP: zero hard/soft warnings. ESLint: zero errors/five existing warnings. `final-source-gate.json` and its named logs retain execution evidence. Final settings balance/activity copy passed 17 focused tests and scoped lint after that gate; its fresh production build passed with exit 0 at 2026-09-30T22:09:25.634Z (final-build-receipt.json). Exact-source deployment and authenticated acceptance remain required. See the [release record](2026-09-30-praxis-live-release.md).

### Historical live acceptance and remaining scope

This table supersedes the historical pending deployment cells below only for its named behavior. It does not mark all recommendations complete.

| Packet | Current integrated evidence | Remaining scope |
| --- | --- | --- |
| W03/W04/W06 | Real visible signup, one-time server allowance, fresh full onboarding to Home, preserved capsule attachment/version, owner isolation, relogin, mobile; private notes-to-capsule and latest-version Save and use passed on `9e95085f`. | Verification/reset email delivery, broader expiry/recovery, keyboard/screen-reader tasks and independent first-use studies. |
| W02 | Real saved exact-body approval, reviewed Markdown/DOCX, verified DOCX paragraph text, edit invalidation and rejection of obsolete exports passed. | Generated research memo correction/reopen continuation; native Word heading/table/link fidelity and independent analyst assessment. |
| W05/W07 | TXT/PDF/DOCX extraction, original document/source IDs, reject/apply persistence after reload, final save and real source recall through Ask passed (`approved-upload-live.json`, tag `1790794632163-77bfced5`). Planned internal context steps are distinct from actual tool calls; zero executed tools/web sources/agent dispatch verified. | OCR/scanned material, high-volume inventories and broader interruption/recovery/capacity proof. |
| W01/W15 | Actual Economical `gemini-3.1-flash-lite`, Balanced `gemini-3.5-flash`, Complex `gemini-3.1-pro-preview` executed on Vertex with no fallback and saved histories. | Passage-based agent review does not establish measured benefit or willingness to subscribe; source/decision accuracy still requires review. |
| W08 | Real queued run reached research/owner approval, then failed memo persistence on an absent optional publication date. Original run/artifacts retained; reviewed serializer correction and strict Firestore regression passed. | Corrective release and worker memo edit/save/reopen/logout; concurrent delivery, cancellation and cross-store recovery remain separate. |
| W09/W10/W14 | Refreshed operator access, both-Rules publication/readback, narrow Storage grant and five-permission build-identity role confirmed. All 55 client guard checks passed; exact-identity no-source CI read/hash/compile passed. Runtime healthy; erasure false. | Actual CI publication, complete erasure/reconciliation, restore and load. Active merchant, dedicated Practitioner product/webhook and secure runtime mounts are verified. Checkout remains false; corrective app acceptance and paid lifecycle are pending. Team remains unavailable. |
| W12/W13 | Current user guide/product map, dated 80-item assessment and this integrated evidence ledger delivered; three original real model answers retained for quote-based agent review. | Matched capsule/baseline and blind independent analyst/user studies. Original outputs and faulty inferences must remain visible. |

The original depleted canary correctly enforced its finite allowance. A new ordinarily funded private QA identity was used without regranting balance. The earlier supervisor has ended; its credentials were never exported. The final source needs a fresh funded run. Failed selectors/assertions retain their original receipts and reviewed fixes. Fixture tests do not represent public events or representative-user evidence.

### Later local correction and provider checkpoint

Ask-to-memo normalizes version-zero context to null/null and resolves positive saved pins against exact owner/id/version before writes; 26 focused tests and scoped lint passed. Billing availability coupling passed 46 focused tests/scoped lint and independent review. Provider setup and secret mounts are verified on the upstream-source configuration checkpoint; checkout remains false. Integrated local proof is complete. The fresh final settings-copy build passed at 2026-09-30T22:09:25.634Z. Corrective worker continuation, hosted checkout and signed lifecycle proof remain pending in the release record.

## Work packets and initial acceptance criteria

Home and Capsules remain the primary signed-in surfaces. Library, writing, source review and run inspection stay within the existing cockpit/workbench. Firestore ContextCapsules own product context; the SQL ledger and Cloud Tasks own durable execution. Upstream engines provide reviewable proposals.

| Packet | Recommendations | Owner / initial state | Concrete work and acceptance |
| --- | --- | --- | --- |
| W01 Evidence and policy methods | 1, 2, 3, 4, 6, 7, 30, 32, 33, 40, 41, 42, 43, 44 | research; in progress | Distinguish original upload/web passage, generated grounding summary, actor claim, instruction and inference. Preserve publisher identity, capture date, passage locator and claim binding. Institutional-source requests remain incomplete if authority/passages are unavailable. Funding unknown never proves no expenditure; a deadline never proves completion. Narrative examples retain exact quotation, attribution and corpus limits. Hostile source text cannot change instruction/tool scope. |
| W02 Writing and review | 5, 34, 35, 36, 37, 38, 39, 59, 64, 65 | root; in progress | Source details are inspectable from the writing/claim surface using keyboard or touch. One readable product and clear save/review action. Approval binds owner/reviewer, exact body/version, intended use and unresolved limitations; editing revokes it. Unapplied critique cannot approve the body. Export fidelity and full task accessibility require explicit checks. |
| W03 Public experience | 8, 9, 10, 11, 12, 13, 60, 66, 68 | coordinator + ask_auth + builder_ui; implemented locally, browser proof pending | Ask is the clear first task; separate capsule creation is discoverable. Explain saved context in ordinary language, retain TACITUS visual identity, label examples and beta/institutional claims accurately, preserve indexing of public text and privacy of work. Mobile completion and wording need actual usability checks; proposed benefits are not measured outcomes. |
| W04 Access, onboarding and navigation | 14, 15, 16, 17, 18, 19, 20, 21 | ask_auth; in progress | One destination vocabulary; only the appropriate active item. Preserve validated destination/question through login and either onboarding path. Slow hydration cannot submit an unready form. Disposable-account signup/reset/expiry/deletion and two-account switching prove lifecycle/isolation separately from existing-account login. |
| W05 Builder and capsule lifecycle | 22, 23, 24, 25, 26, 27 | builder_ui + capsule; in progress | Every editable field has an explicit persistence scope. Supported private preferences round-trip; package-only fields are labeled. Unsaved edits are visible; Save and use attaches the newest saved supported state. Summaries show purpose, scope, as-of date, evidence, assumptions and gaps. Stale proposals must not overwrite newer reviewed context silently. Fork/archive/version actions preserve source lineage. |
| W06 Context composition and picker | 28, 29, 31 | ask_auth; in progress | For A primary/B reference/C tool, promote B while retaining A/C and pinned versions/document refs. Picker loading, empty and failed states differ and offer recovery. Quick supplied-context questions remain brief/direct and do not dispatch unrequested research. |
| W07 Library, retrieval and ingestion | 45, 46, 47, 48, 49, 50 | capsule + builder_ui; in progress | Selected documents constrain retrieval before ranking. Find late-document facts despite competing unselected material. Distinguish not indexed, no evidence, failed and out-of-scope retrieval. Enforce advertised byte/text/chunk limits before expensive work, bound writes, and identify upload retries. Pagination/search must expose older selected material and state whether results are partial. Scanned PDF/OCR remains unsupported until proven. |
| W08 Durable execution and recovery | 51, 52, 53, 54 | root; in progress | Concurrent deliveries have one execution owner through leases/conditional transitions. Inject lost responses and interrupted artifact/version writes; recover one intended product with preserved review/source lineage. Cancellation and user-visible limits are enforced at useful boundaries. Run states show what exists and the next action. Dispatch deduplication alone is insufficient. |
| W09 Privacy and institutional governance | 55, 56, 57, 58 | cloud_evidence + coordinator + root; copy implemented locally, erasure in progress | Inventory owner-scoped Firestore, Storage, SQL and trace records; prove deletion or disclose concrete retention exceptions. Legal text matches real processing/provider posture. Preview intentional sharing and revocation. Roles, SSO/SAML, residency and private deployments retain separate proof/agreement gates. No data-leak claim follows from an unverified erasure path. |
| W10 Usage, billing and support | 61, 62, 63 | cloud_evidence + root; external dependency / open | State enforced user-facing upload/research/workspace limits. Verify supported-plan provider configuration and hosted checkout before activation; separately prove genuine signed delivery, entitlements, cancellation/refunds and deletion effects. Provide redacted problem reporting; do not include private source text implicitly. Paid-unavailable copy stays truthful until activation gates pass. |
| W11 Contracts and maintainability | 69, 70, 71 | all implementation owners; in progress | Extract responsibilities only at existing ownership seams while making fixes; share typed persistence/context/evidence/review/run contracts. Preserve Firestore and SQL responsibilities. Regression coverage, rather than file-size reduction alone, proves safe simplification. No additional orchestration framework or canonical store. |
| W12 Documentation and validation entrypoints | 72, 73, 74, 77 | coordinator + root; in progress | Current user guide matches Home/Capsules/writing labels and separates historical target design. Product map points to this ledger and exact acceptance. Fast local, release and live-journey gates have distinct claims. Retain all passing production journeys and add relevant lifecycle/recovery/capacity proof. |
| W13 Measured quality and performance | 67, 75, 76 | research + root; empirical validation pending | Retain real-provider outputs from 6–10 matched policy/narrative tasks with/without capsules; same sources/model/budget and blind analyst rubric where practical. Score factual/citation fidelity, uncertainty, narrative attribution, decision usefulness, revision time and cost. Structural preset deltas are not improvement evidence. Representative users complete tasks without coaching; cold/warm/slow-device timings are measured. |
| W14 Cloud evidence and operation | 78, 79, 80 | cloud_evidence + root; external dependency / open | Restore scoped cloud-read access, inspect exact source/service state and final-journey logs. Monitor outcome failures without unnecessary private text. Prove backup restore, simultaneous-user/load/rate-limit behavior and storage growth before institutional reliability claims. Healthy endpoints do not prove clean historical logs. |
| W15 Model choice and agentic routing | Additional explicit user requirement | research + root; in progress | Offer understandable automatic, economical and premium choices through the existing provider abstraction. Choose task-appropriate models/tools, preserve no-research restrictions and expose actual provider/model/fallback receipts. Unavailable premium access is explicit; never silently label a cheaper fallback premium. Local routing tests and real-provider streaming/task journeys are separate acceptance gates. No internal provider credit costs in user-facing UI. |

## Recommendation coverage register (initial dispositions)

Every recommendation has one primary packet; owners coordinate across packets where necessary. Packet assignment is not a completion claim.

| Recommendation IDs | Primary packet | Initial delivery disposition |
| --- | --- | --- |
| 1–4, 6–7 | W01 | Evidence contract, attribution, methodological and hostile-source cases in progress; actual source-passage proof pending. |
| 5 | W02 | Source-inspection interaction open. |
| 8–13 | W03 | Public simplification and labeled persona examples open. |
| 14–21 | W04 | Navigation/return flow implementation in progress; disposable-account/representative-user proof pending. |
| 22–27 | W05 | Persistence, unsaved changes and lifecycle work in progress. |
| 28–29 | W06 | Promotion/picker implementation in progress. |
| 30 | W01 | Actual evidence-scope display in progress. |
| 31 | W06 | Previously repaired direct recall must pass again against the new release. |
| 32–33 | W01 | Research scope and readable source attribution in progress. |
| 34–39 | W02 | Editor/review/export/revision work in progress; exact-body approval and export proof pending. |
| 40–44 | W01 | Policy/narrative templates and comparisons in progress; usefulness requires empirical assessment. |
| 45–50 | W07 | Corpus/retrieval/ingestion/library work in progress; OCR and capacity proof pending. |
| 51–54 | W08 | Lease/recovery/state/cancellation work in progress; fault injection and live task proof pending. |
| 55–58 | W09 | Privacy inventory and governance proof open; institutional services externally gated. |
| 59 | W02 | Reviewer accountability depends on exact-body approval implementation/proof. |
| 60 | W03 | Paid-unavailable baseline preserved; revised plans remain truthful to activation state. |
| 61–63 | W10 | Limits/support open; configured billing sandbox and lifecycle proof externally gated. |
| 64–65 | W02 | Passing responsive baseline retained; keyboard/touch/screen-reader task checks pending. |
| 66 | W03 | Shorter mobile first-use path open; benefit unmeasured. |
| 67 | W13 | Real performance measurements pending. |
| 68 | W03 | Existing metadata/indexing preserved; changed public/private URL verification pending. |
| 69–71 | W11 | Incremental extraction/shared contracts in progress; canonical ownership invariant retained. |
| 72–74 | W12 | User-guide/product-map/validation documentation in progress. |
| 75–76 | W13 | Real-provider matched evaluation and independent user/analyst studies pending. |
| 77 | W12 | New-source production acceptance pending root integration/deploy. |
| 78–80 | W14 | Fresh privileged cloud window, monitoring and recovery/capacity evidence pending. |

## Delivery evidence

Update this table with implemented files and actual check results. Do not backfill a passed status from a plan, mocked provider test or historical journey.

| Packet / recommendation | Delivered behavior | Local evidence | Deployment / live evidence | Remaining gate |
| --- | --- | --- | --- | --- |
| W12 / 72–73 | Current Home/Capsules user path, policy/narrative examples, review/export/model behavior, funded allowance and erasure boundaries documented. May research and the old six-item navigation proposal marked historical; product index/map reference the ledger, acceptance and retained quality runner. | Five owned Markdown files checked: zero missing local links; all 80 recommendation IDs assigned exactly once without omissions/duplicates. | Documentation only; no application claim | Root reconciles the new release source/revision and final real-service proof. |
| W03 / 9–13, 60; W09 / 55, 57 | Plain capsule definition and entirely synthetic worked-policy example in full Guide and compact Home. Public pricing separates beta/proposed paid/agreement scope, gates complete checkout configuration, and states finite starter allowance without refill/unlimited guarantees. Legal copy discloses original/extracted/chunk data, erasure gating and retained exceptions. | Coordinator public/copy/billing/auth checks: 3 files / 23 tests pass; 5 additional harness tests pass. Scoped ESLint and owned whitespace check clean. Local Home/Guide/Pricing/Privacy/Retention inspected at 320/1440; zero 320 document overflow, native example Enter and focusable ArrowRight table scroll pass, builder sign-in target retained. Receipt `output/playwright/coordinator-public-20260930/receipt.json`. | None for this new source. Local CSP development warnings and Firebase localhost-referrer 403s remain explicit; no zero-console-error claim. | Exact-source live proof, full task accessibility and representative-user outcomes pending. Actual erasure/sharing/institutional acceptance remains separate. |
| W04/W06 / 14–19, 28–29, 31 | Target/question survives login and onboarding choices; hydration-disabled login, picker loading/empty/error retry, immediate account masking, keyboard focus and primary promotion preserve references/version pins. Drafts and create-first onboarding use existing surfaces. Review pagination adds Load more/Retry/stale-capsule guard. | ask_auth reports 94 earlier focused tests and final 7-file compatibility/memo/review group 91/91; overlapping sets are not summed. Ask/auth browser 10/10 and memo browser 7/7 pass with no page exceptions in local mocked fixtures; receipts and TDD reports in `output/playwright/practical-refinement-20260930/`. Scoped lint exits 0 with zero warnings; whitespace clean. | None for new source; no real account/provider/DB/signature claim follows from mocks. | Disposable signup/reset/expiry/two-account isolation, real account persistence, signed-review/export and integration/live gate pending. |
| W01/W15 / evidence capture and model routing | Bounded DNS-vetted, address-pinned HTTPS with every-hop validation preserves original passage text/locator; generated grounding stays separate and proposition support remains unverified. Economical recall/extraction, Balanced analysis and Complex synthesis/review use bounded task budgets. Substantive unclassified prose now defaults to Balanced. Worker/chat retain actual constructed and response model, usage, attempts/fallback/checkpoints. | research reports 7 evidence/router suites / 60 tests and 7 integration suites / 68 tests; sets overlap and must not be summed. One read-only Google documentation capture proves transport. Coordinator source/SSRF review found no material defect. Root integration typecheck/live proof still required. | None for new application source. Public-source capture does not establish premium availability or analytical quality. | Exact-source provider/model/fallback/source-binding journeys and independent analyst quality remain pending. |
| W05/W07 / builder/library/ingestion | Purpose → Material → Review and save; advanced/package scope separated. Current-snapshot Save and use, visible unsaved state, owner-scoped 24h optional recovery, private copy/archive, loaded counts/cursor paging. Retrieval filters selected docs before ranking; ingestion bounded/idempotent with reusable checkpoints and indexing/error states. New review proposals bind touched field/source/document refs; legacy proposals remain unbound. | builder_ui reports 39 focused lifecycle tests plus desktop/mobile mocked browser proof; receipt `output/playwright/refinement-20260930/builder-library-local.json`. capsule reports 135 distinct focused tests across 10 files, including later-attachment checkpoint recovery. Scoped lint/diff clean. | None for new source; UI proof uses mocks. | Real uploads/larger inventory/retry/stale-review/failure journeys and integration pending. OCR and freshness protection for old unbound proposals not claimed. |
| W02 / writing review and export | Owner-scoped approval binds signed reviewer/current body/version/use/limitations; editing clears approval. Reviewed Markdown/Word export revalidates current signed approval and preserves intended-use and caveat labels. Memo UI shows intended use, acknowledgements, original passage/status and exact-version download; concurrent-save edits preserved. | Root reports 8 export tests including changed/forged/wrong-reviewer/stale-version cases. Coordinator source review found no material security defect. ask_auth memo mocked browser 7/7 and final focused compatibility group 91/91 passed; scoped lint/whitespace clean. | None for new source; mocked memo responses do not prove server signatures/persistence. | Complete edit/save/approve/edit-revoke/export journey with real persistence pending. Word text preserved in paragraphs; native heading/table/link fidelity needs separate acceptance. |
| W08 / durable execution | Execution lease/token, conditional owner/status transitions and lease-wrapped status updates protect worker ownership; operation IDs/checkpoints support interrupted product recovery. | Root local lease tests and coordinator source review; final integration/fault-injection counts still pending. | None for new source. | SQL lease validation and Firestore commit are not atomic: cancellation/expiry after a pre-write check can permit an in-flight write. Do not claim universally fenced/exactly-once cross-store effects. Test blocked persistence/recovery. |
| W09/W10 / erasure, billing and allowance | Erasure requires verified storage guards; active renewing subscription blocks cleanup; partial cleanup stays pending. Minimal deletion marker/receipt retained, configured external cleanup and provider/backup/accounting exceptions disclosed. Funded balance/workspace cap/reservation receipt commit before model work; no refill or profile creation. | cloud_evidence implementation evidence and final auth/erasure/billing tests pending. builder_ui funded quota: 52 focused tests green, scoped lint clean. Depletion 429 nonretryable; deleting/missing profile 409; datastore 503 with 15s retry. | No billing activation or deployed guard/erasure proof. | Rules/control-plane deploy, disposable erasure and configured sandbox billing journeys pending. Existing refund helper lacks receipt idempotency/workspace settlement and has no callers; failed-run settlement remains open. |
| W13 / 75–76 | Executable retained baseline/context-framed provider comparison uses identical supplied synthetic evidence/question/model/budget and no grading answers/fallback/retries. Output/model/usage/error/hash receipts and unscored per-trial analyst rubric retained. | 5 focused harness tests; all-eight-case dry run retained 16 prompts. Single economical probe recorded two pre-request errors: no local provider configured. See quality evaluation document. | No generated output, premium access or quality benefit proved. | Real generation with matched reported models, independent analyst review, six representative written-product tasks and user outcomes remain pending. |
| All application packets | Local implementations and owner-specific receipts consolidated; all 80 recommendations remain mapped exactly once. | Integrated build/typecheck/audits and 440-file/2,396-test gate passed; final settings copy passed 17 focused tests/scoped lint. Fresh production build passed with exit 0 at 2026-09-30T22:09:25.634Z; final graph update pending. | New-source deploy/acceptance pending. | Root records exact served commit/revision and real-service journeys; do not mark every recommendation complete from code or mocks. |

## Required acceptance journeys

1. A new disposable user starts a question or builder, signs up, follows or skips onboarding, and returns to the intended work. Reset, expiry and two-account isolation are separate checks; no shared private production account is used by child agents.
2. Upload TXT/PDF/DOCX; preserve original paragraphs; review/apply/reject; edit builder preferences; save/reopen; visibly handle unsaved edits; Save and use; recall a late-file unique fact after reload. Test bounded failure and lost-response retry without a duplicate logical document.
3. Browse/search/page a larger capsule/document library, including older selected records. Distinguish loading, empty, failed and partial inventory. Promote a reference while preserving other attachments/versions.
4. Ask a quick supplied-context question; follow up/reload; request outside research separately; check actual provider/model and source scope. Exercise economical/premium availability and explicit fallback behavior with real responses.
5. Run institutional-source research. Inspect supporting original passages, authority and unavailable-source gaps. Hostile retrieved instructions and synthetic facts cannot alter source/tool scope or gain unrelated institutional citations.
6. Generate a decision brief and narrative comparison; correct substantive claims, inspect exact evidence, save/reopen, approve the exact body for a specified use, edit again and confirm approval is revoked. Unapplied feedback remains separate. Verify draft/export labels and output fidelity.
7. Deliver concurrent/repeated tasks and inject interruption between output/version/status effects in an isolated environment. Recover one intended product and preserve owner, source and reviewer lineage. Verify cancellation/limits.
8. Re-run responsive/keyboard/touch tasks and actual logout; protected routes require login. Bind live evidence to the new served source/revision. Cloud service/log inspection and backup/load tests remain separate operator gates.

## Evidence and policy-method regression cases

Use labeled public or synthetic fixtures. Contract/prompt tests prove their
boundaries; retain actual generated outputs to assess whether a model follows
the boundaries. A second model's critique is another assessment, not an
independent source or human study.

| Fixture | Required analytical behavior | Failing behavior |
| --- | --- | --- |
| Funding approval unconfirmed | Funding and expenditure remain unknown unless financial records establish them. | Claiming no expenditure or a stalled policy solely from missing funding confirmation. |
| Agreement to review a proposal | Record authorization to review; implementation mandate remains separate. | Converting review agreement into implementation authorization. |
| Future review deadline | Record deadline and evidence of actual review activity/outcome separately. | Inferring that review has not started/finished because its deadline is future. |
| Independent news/analysis article | Attribute the publisher and quoted view accurately. | Calling the article a public institutional auditing framework. |
| Private synthetic council facts plus GAO guidance | Uploaded passages substantiate the synthetic illustration; guidance supports only a relevant general proposition. | Giving GAO a citation for facts that occur only in the private fixture. |
| One source uploaded as TXT/PDF/DOCX | Preserve formats and lineage; count one evidentiary origin. | Treating three format copies as three independent corroborating sources. |
| Actor quotation plus analyst frame | Preserve exact quotation/locator and label the frame as interpretation with alternatives. | Presenting inferred intention as the actor's own statement or population opinion. |
| Unavailable original or hostile source instructions | Mark source access/support incomplete; source text cannot change tools, approvals, destination or retrieval scope. | Treating a generated summary as verbatim evidence or executing instructions from source material. |

Minimum outcome tasks for W13: a decision brief, options comparison, commitment
versus implementation assessment, conflicting-source analysis, narrative
comparison and context handover. Hold source set/model snapshot/budget constant
for capsule-versus-baseline comparisons and retain all original outputs, reviewer
ratings and limitations. A successful synthetic regression does not establish
representative-user adoption or a quantified analytical benefit.

## Remaining dependencies and proof

- Final merged-source release and real worker memo continuation; delivery/recovery/load and failed-run settlement remain separate tests.
- Corrective Practitioner runtime and hosted checkout activation; active merchant, dedicated product/webhook and version-1 secret mounts are verified. Checkout remains disabled; Team and purchased subscription lifecycle remain unproven.
- Email verification/reset/expiry, complete erasure, OCR, large-library/long-document capacity, native Word formatting, backup restore and broader accessibility.
- Independent analysts and representative users for accuracy, capsule benefit, revision time and willingness to pay. Synthetic fixtures and agent scores cannot substitute for these studies.
- Optional JEV, sharing/roles, expert verification, SSO, residency and private deployments require individual proof and applicable agreements.

## Documentation and operator entrypoints

- [Current user guide](../product/CONTEXT_CAPSULE_POLICY_RESEARCH_GUIDE.md): ask, build context, inspect evidence and revise writing.
- [Product map](../product/PRAXIS_CANONICAL_APP_STRUCTURE.md): existing surfaces, ownership and target-versus-current boundaries.
- [Runtime architecture](../architecture/PRAXIS_AGENT_RUNTIME_ARCHITECTURE.md): durable execution and review contracts.
- [Session brief](../CODEX_SESSION_BRIEF.md): narrow local checks and full release gate.
- [GCP operations](../GCP_OPERATIONS.md): scoped cloud/operator work.
- [Original improvement analysis](2026-09-30-praxis-improvement-analysis.md): findings and 80-item scope.
- [Previous production acceptance](2026-09-29-praxis-production-acceptance.md): the tested release baseline; do not silently rewrite it as evidence for this wave.
