# PRAXIS follow-up: verified local slices and remaining implementation

Evidence window: 2 October 2026 America/New_York; machine receipts extend into 3 October UTC. This is an **incomplete, uncommitted local candidate**, not pilot acceptance or a publication receipt.

The follow-up repaired question privacy/recovery, established genuine local authentication and private persistence, hardened memo concurrency/review, pinned the research-memo evidence lookup, and validated saved Markdown/DOCX lineage. The requested first agentic workflow is still incomplete: project dispatch, semantic capsule authoring/copy, immutable capsule writers, dependency invalidation and semantic interchange need implementation. Actual generation and practitioner assessment were not performed.

## Candidate identity and preservation

- Directory: `C:\Users\giuli\output\praxis-workspace-local-20261002`.
- Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`, verified from this checkout.
- Branch: `build/praxis-followup-20261002`.
- Base and unchanged HEAD: `97c54994cc6248fef5bad25909f4ad5a967b879a`. The tested code includes uncommitted edits; HEAD alone does not identify it.
- `output/followup/candidate/source-manifest.json`: 78 scoped source/test/config/documentation files, each with SHA256 and byte count. Manifest SHA256: `7c7371dc0d506dce269589c7a24274229f41c32fe5a70bb9130c410c64cdf13b`. This receipt is an additional documentation file outside that original manifest.
- `tracked-source.patch` and `diff-stat.txt` in the same directory: 56 tracked files, 1,029 insertions / 393 deletions before this receipt; untracked additions are listed in the manifest. Inherited AGENTS/audit/graph changes are excluded.
- All 78 hashes were rechecked in `source-verification.json`; final preservation verification is recorded separately below.
- Primary worktree remains `C:\Users\giuli\tacitus-products\praxis`, main at `8ff509b8`. The other five worktrees were inspected and left intact. No reset, clean, stash, commit, push, merge or deployment was performed for this follow-up.
- Historical release worktree `cfe8e481` / `praxis-frontend-01102-piy` is separate evidence; no new served-code assertion is made here. The old release authentication blocker was superseded by its publication receipt. Initial follow-up preflight still recorded a local ADC refresh failure, while its read-only GCP resource audit passed. No credential repair was attempted.
- Existing port 3102 / PID 15776 was preserved. Only the follow-up's port 3020 application sessions and its isolated demo emulators were used. Final process/export status is recorded below.

## Before / after capability matrix

“Tested” below means the stated local scope. Code contracts and controlled outputs do not establish actual model behavior or production acceptance.

| Capability | Before follow-up | After and exact evidence boundary |
| --- | --- | --- |
| Login/session | Real Firebase/session code; raw question text entered auth URLs; no genuine isolated acceptance | **Implemented and locally tested:** Firebase SDK login → `/api/auth/session` → signed session, actual onboarding skip, logout/relogin, invalid token/origin and disabled-user denial. `current-token.ts`, `with-auth.ts`, `firebase/admin.ts`, `firebase/config.ts`; real browser tests below. OAuth production journey and broad session-expiry matrix not rerun. |
| Draft continuity | Prompt query parameters; failure could lose submitted text | **Implemented and tested in bounded paths:** opaque UUID handoff, explicit account claim, owner/thread Ask drafts and non-overwriting HTTP/network/stream failure recovery. `question-handoff.ts`, `ask-draft.ts`, `post-login-redirect.ts`, login/Chat/Ask components and contract tests. Back/refresh after cancelled login tested in real browser. Temporary same-tab recovery is not durable authenticated storage. |
| Source intake | Existing TXT/PDF/DOCX extraction paths | **Partial, unchanged acceptance:** this harness deliberately denies external/source-byte integrations. Purpose-only capsule and supplied synthetic passages are not extraction. Scanned/corrupt/partial-upload/OCR and complete multilingual extraction acceptance remain unrun. |
| Capsule proposal/review/save | Existing builder and V3 review cards | **Purpose authoring implemented and locally tested:** `/app/capsules/builder`, `POST /api/context/capsules` action `save-builder-draft`, `users/{uid}/capsules/{id}`; purpose corrected and reopened as v2. Qualified-claim/actor/date/relationship semantic editor and proposal acceptance remain partial. |
| Capsule versions/library/reuse | Existing exact resolver/library; some mergeable history and incomplete semantic copies | **Partial:** real v1/v2 records; project attaches exact v1 and shows newer v2. Existing owner library retained. Every-writer immutable published snapshots, revision conflicts, deep fork/combine/shared-token clone, semantic diff and cross-project reuse are not completed or newly UI-accepted. |
| Conversations | Existing owner conversation/Ask stores | **Preserved; partial project integration:** `/api/conversations`, `/api/ai/chat`, conversation/Ask stores remain. Draft recovery contracts tested. No model answer or new saved-conversation/project linkage acceptance claimed. |
| Projects | Real private schema/API; earlier browser tests mocked auth/backend | **Implemented and locally tested within private scope:** `/app/projects`, `/api/projects`, `/api/projects/[projectId]`, `users/{uid}/projects/{id}`, `revisions/rN`; scope, exact context pin, one draft work item, refresh/relogin and disk restoration. Inventory race/loading/error guards repaired in `project-workspace.tsx`. Collaborators and authoritative deliverable links remain absent. |
| Task execution | Postgres AgentRun + Cloud Tasks/leases exist; no project dispatch | **Partial:** research-memo lookup now requests and validates the captured exact capsule version (`worker.ts`, unit tests). Project work items remain `draft | cancelled`; no project task was queued/executed. Runtime proof tests are controlled contracts, not a running Postgres/Cloud Tasks journey. |
| Artifact editing/review | Owner memo versions and signed review; saves lacked client base; legacy final labels could persist | **Implemented and locally tested for supplied memos:** `/api/memos`, `/api/memos/[id]`, `/api/memos/[id]/review`; `users/{uid}/situations/{caseId}/memos/{memoId}`, child `versions`. Transactional version checks/replay, UI correction/save/reopen, exact-version owner review. No generated second deliverable or project→run→artifact bridge. |
| Export | Existing work-product DOCX/PDF; reviewed memo MD/DOCX lacked fuller lineage acceptance | **MD/DOCX implemented and locally tested:** `/api/memos/[id]/export`, selected saved version and signed review, exact evidence appendix; actual files downloaded, Markdown bytes and DOCX XML inspected. General evidence is reference-only. Reviewed-memo PDF and all-page visual Word/PDF QA remain gaps. |
| Team authorization | Owner-scoped APIs/rules; descriptive sharing fields | **Private isolation locally tested:** owner A and outsider B; copied project/capsule/memo/export IDs denied, list excludes A title, direct Firestore outsider denied, disabled account denied. Genuine owner/editor/reviewer/viewer membership, role changes, revocation during work and worker/export sharing enforcement remain unimplemented. |
| Import/export portability | Existing `.core` / Capsule+ / proposal paths; incomplete semantic import rows | **Partial:** operational Auth/Firestore export→stop→import→original-record reopen passed. This is not semantic capsule interchange. Durable semantic rows, rights/quarantine, isolated reader round trip and permission downgrade acceptance remain incomplete. |

## Root causes repaired and architectural decisions

1. **Private text in URLs and recovery races.** URL builders and return-target handling now remove raw `prompt` / `capsulePrompt`, sensitive fields/fragments and unsafe targets, while carrying a UUID reference. Unnamed forms avoid browser GET serialization of analytical text. A 30-minute same-tab sessionStorage handoff is explicitly claimed by the authenticated account; recovered text never replaces newer text. Ask drafts are account/thread scoped. Chat restores failed HTTP/network/stream submissions only for the same current account/draft, respecting aborts and later edits. Temporary storage may be copied by a browser opener or read on a shared device; expiry removal is lazy. Historical logs were not purged.
2. **A nominal local mode could fall back to live resources.** `emulator-config.ts` requires an explicit flag, matching `demo-*` project, both literal loopback endpoints and no Cloud Run identity before credential reads. Real SDK emulator connections and guarded CSP were added. Identity Toolkit fallback, Cloud Logging, provider constructors, Postgres and unsupported cloud routes fail closed in this lane. The local UI names its limitations. Separate `.next-local-persistence` / `.next-local-validation` outputs protect the other server.
3. **Stale and repeated memo saves could conflict silently.** The API requires nullable `expectedVersionId` and a stable `operationId`. `memo-service.ts` transactionally checks current revision and immutable version identity; identical digest-bound replay returns the saved object; a changed/stale request returns 409. Editors retain text on failure. Legacy receipts without digests remain readable but do not gain the new guarantee. Trusted internal callers retain their optional contract; every possible worker writer is not newly end-to-end accepted.
4. **Review labels could outlive reviewed content.** A material save clears approval. Loaded final labels require the signed owner/body/version-bound review. Legacy unsigned final status downgrades on read without rewriting history. Review records intended use and limitations; automation in this demonstration activates the real controls with a synthetic account, not an independent practitioner judgment.
5. **Research memo lookup could use latest context.** Existing worker evidence calls now receive the server-captured version; owner/version mismatch and unsaved v0 fail rather than substituting latest. Existing exact-version resolution is reused. This repair does not make all historical capsule version writes immutable.
6. **Export could lose lineage or disclose/truncate source locators.** `memo/evidence-appendix.ts` reads only the selected saved memo's context snapshot. It reports exact source identity/version/hash/publication date/language/rights/offsets and unresolved or duplicate references. Only server-allowlisted synthetic passages with matching version, full-span offsets and recomputed hash are included. Caller rights labels grant no redistribution. General source text remains reference-only; unsafe/credential-bearing/unknown-query/oversized URLs are withheld explicitly. Edited-claim support is not certified by the existence of this appendix.
7. **A dependency audit uncovered multipart DoS exposure.** Override `@fastify/busboy` 3.2.0 → 3.2.1 addresses `GHSA-xjh9-v7x6-24jw` and `GHSA-x8mw-p69m-v3mx`. Official npm/tag evidence and MIT license are in `output/followup/dependency-update`; compatible with Firebase Admin 13.10.0 `^3.0.0`. The lock review proves other existing package records unchanged. The installed Dicer parser is tested in bounded subprocesses for oversized boundary and prototype-named headers. No new application provider/framework was added.

Firestore remains canonical for capsules/projects/memos, Postgres for AgentRun and Cloud Tasks for dispatch. No new queue/database/agent engine or production migration was introduced. The nine responsibility map, role/schema distinctions and unchanged architecture boundaries are in the [follow-up plan](2026-10-02-praxis-followup-plan.md).

Compatibility/rollback: existing records remain readable; the new memo API requires older clients to refresh. Local emulator exports contain synthetic account state and stay ignored/local. Roll back code as one reviewed patch, restoring the matching package/lock pair and clients together; stop only owned harness processes. No production data rewrite is required. Do not retroactively create approval, operation digests or immutable-history guarantees. Capsule envelope schema 3, nested V3, numeric revision and legacy capsule/v2 semver remain distinct.

## Checks and provenance

Environment: Windows PowerShell, Node v24.12.0, npm 11.20.0, Next.js 16.3.7, Vitest 4.1.11; Chromium; official portable Temurin Java 21 tooling; Firebase Auth/Firestore `demo-praxis-local` on loopback. Full final checks run sequentially against the manifest's source, with local build output isolation. No actual provider/model call was made.

Final runner: `.\output\followup\run-final-checks.ps1 -EvidenceDirectory output/followup/after-security-gate`. Individual results are in that directory's `results.json`; the wrapper's exit 0 is not an all-green result.

| Exact check | Final result |
| --- | --- |
| `graphify update .` | **Passed, exit 0**, AST only, no API/model cost; 18,799 nodes / 41,538 edges / 902 communities. Generated evidence archived before inherited artifacts were restored. |
| `npm run lint` | **Passed, exit 0**, 0 errors / **6 warnings**, retained navigation/hook debt. |
| `npm run typecheck` | **Passed, exit 0**. |
| `npx --no-install vitest run --maxWorkers=2` | **Passed, exit 0: 454 files / 2,697 tests**, duration 355.82 seconds. Coverage was not measured. |
| `npm run audit:gate` | **Passed, exit 0**, ending `[audit-runner] gate complete`. Includes typecheck, genuine production build (compiled in 74s), AI route inventory, capsule/agent/architecture/surface/runtime/simplification contracts and read-only GCP inventory; GCP reported 0 hard failures / 0 soft warnings. Contract audits do not close product acceptance gaps. |
| `npm audit --omit=dev --json` | **Failed, exit 1: 47 findings — 3 low / 44 moderate / 0 high / 0 critical**. Remaining findings are open debt, not a clean security gate. |
| `git diff --check -- <78 manifest paths>` | **Passed, exit 0** (`candidate/scoped-diff-check.json`). The earlier whole-tree whitespace check failed on 1,366 inherited `graphify-out/GRAPH_REPORT.md` whitespace locations; those unrelated bytes are preserved, not fixed or hidden. |

Final checks ended at `2026-10-03T01:41:02.5461221Z`. Post-gate verification at `01:41:57Z` found **78 source hashes matching, 0 mismatches**. `after-security-gate/preservation.json` records **70 captured / 70 restored exactly / 0 differing** inherited audit/graph files. Archived newly generated output is under `after-security-gate/generated`.

Additional executed evidence retained under `output/followup`:

| Check | Result and boundary |
| --- | --- |
| Real browser creation/edit/relogin/isolation | `checks/browser-accepted.log`: **2 passed / 5.4 min**, no auth/API route mocks. Purpose-only capsule and supplied memo; draft work item only. |
| Emulator disk restart/import/original reopen | `checks/disk-restoration.log`: **1 passed / 1.8 min**. After dependency fix/application restart, `dependency-update/reopen-browser.log`: **1 passed / 2.1 min**. Same IDs, exact MD and DOCX source XML checked. Original full create journey predates Busboy fix; affected login/reopen/export path was rerun afterward. |
| Corrected routing/Chat failure contracts | `checks/contracts-repaired-final.log`: **7 files / 62 tests passed**. Earlier failed assertions were replaced with meaningful privacy/recovery assertions; failure logs retained. |
| Runtime contracts | `checks/runtime-final.log`: **3 files / 99 tests passed**, controlled mocks. Does not prove project dispatch or production workers. |
| Export rights/locators/snapshots | `checks/export-rights-final.log`: **1 file / 14 tests passed**, including MD/DOCX safe withholding and fixture source binding. |
| Multipart + affected upload/session/export regressions | `dependency-update/focused.log`: **4 files / 48 tests passed**; actual installed parser, other integrations controlled. |
| Evaluation preparation | `evaluation-plan-3/manifest.json`: **16 scenarios, 32 planned paired outputs, not executed**, human scores null. Retains eight existing and eight Advisory cases. Requested plan: Gemini 3.5 Flash, temperature 0, 2,000 output tokens, no retries, 45-second timeout; no reported provider/model/usage. This is a limited matched-material framing plan, not the full RAG/unreviewed/reviewed comparison or proof of capsule benefit. |
| Review | `candidate_review` static review found no blocker in the narrow Busboy update and regressions; it ran no tests. The separate capability-baseline agent could not run because its configured model was unsupported; this receipt uses directly inspected code and executed evidence instead. No independent comprehensive candidate review is claimed. |

Historical `final-gate` unit failures remain archived. The intermediate `verified-gate` passed 453 files / 2,695 tests, build/aggregate and preserved 70 inherited files, but its audit found the now-repaired high vulnerability. It is superseded for final acceptance. Initial ADC preflight failure is local metadata, not evidence of a production outage. The aggregate's read-only cloud inventory is separate from application acceptance.

Not run or incomplete: full repository browser suite; coverage measurement; complete automated accessibility scan/manual keyboard audit; broad session-expiry and interrupted review/save/export matrix; real extraction; every template/second output; Postgres/Cloud Tasks recovery; project dispatch/cancel/retry/timeout/lost-connection/revoked-worker journey; semantic import; team roles; all-page short/long Word/PDF rendering; model fidelity and practitioner usefulness; p50/p95/cost/time-savings comparisons. No launch-readiness or production acceptance claim.

## One coherent synthetic demonstration and real objects

Fixture: `tests/fixtures/example-advisory-dossier.json`, SHA256 `a1ebdef5cc948733aa167b8a9a9a88b8b4beb9ef0400c35f21555cef161166f5`. It supplies Day 1 proposed January start, Day 8 industry transition request and Day 15 consultation considering July, without adoption; uncertain funding, optional pilot and Portuguese modality. Publication/event/effective/cutoff fields remain distinct, with unknown event/effective dates null. The tests did not perform extraction or qualified human language assessment.

Real local records from `journey/receipt.json`:

| Object | Identifier |
| --- | --- |
| Project | `project_3cde905b990cbb1bb0c0dd696ff4bc6c` |
| Capsule | `capsule-64126b23-65c3-4dc9-b699-115ba210774b`; project pin v1, latest v2 |
| Draft work item | `work_675d5e1745bd61b45ab557d925a3a893` |
| Memo | `project_3cde905b990cbb1bb0c0dd696ff4bc6c__policy-memo` |
| Corrected/reviewed version | `project_3cde905b990cbb1bb0c0dd696ff4bc6c__policy-memo-v2` |
| Owner | `KIr4wIA27d4w1UoJwtNSO4mwiwsB` |
| Synthetic UI review actor | `synthetic-a-cccd9342-e2dd-48d9-bc91-a0074e093e32@example.test` |

The memo uses the project ID in the existing situation/memo namespace; this does **not** establish an authoritative project→run→deliverable link. Context role does not grant access. User/Tool semantic authoring and resulting Output capsule creation were not newly demonstrated.

Actual walkthrough: real SDK login/onboarding skip → create private project with inspectable mandate/scope/cutoff → purpose-only capsule save/reopen/correct to v2 → attach v1 and inspect newer-version warning → save and replay one draft assignment → supplied controlled memo saved twice concurrently as one version → UI correction saved as v2 → stale save rejected → refresh/reopen → synthetic owner review for internal analysis → selected-version MD/DOCX download → logout/relogin → original records reopened → outsider/rules/disabled-user denial → emulator disk export/stop/import → original login/IDs/text/export reopened. No generated output or source update propagation is included in that walkthrough.

The supplied, saved and exported text retains:

> Funding remains undecided. [EA-D1]
> The pilot is optional and subject to funding. [EA-D1, EA-D15]
> July is considered in consultation; no start date has been adopted. [EA-D15]
> Original language: O piloto poderá ser realizado, sujeito a financiamento. [EA-D15]

Human correction: “July remains a proposed option, not an adopted effective date.” The actual fixture quotes/version hashes and full UTF-16 offsets are in the appendix. This proves controlled text plumbing, not analytical performance. The September 30 historical funding/mandate generation failures remain unresolved without current real-generation output evidence; these replacement synthetic cases do not close them.

Artifacts: `output/followup/journey/restored-reviewed.md` and `restored-reviewed.docx`. Restored MD SHA256 `95fec1724630f0acbf3431f47c310dda65922822d6f0310a53bb7969fbf75aae`; restored DOCX SHA256 `419848c65a16cf6c16e6875594f7fbd885d0c9b7358576c73472304a3675669f`. DOCX is an actual ZIP/XML document, not renamed text. No Word/LibreOffice renderer was found in PATH or standard install locations; layout/clipping/table/page/link QA remains pending. Reviewed-memo PDF is not implemented. Recipients need separate access to reference-only or redacted sources; downloaded exports cannot be revoked.

Screenshots from the actual local candidate: `journey/project-desktop.png`, `project-tablet.png`, `project-mobile.png`, `project-text-200.png`, `corrected-memo.png`, `restored-memo.png`. The browser exercised 1440/768/375 widths, reduced motion, root text at 200%, overflow assertions and title→question Tab focus. Images were inspected. The dismissible quick-start panel overlaps the harness notice on narrow/200% views; this and fuller focus/dialog/large-source acceptance remain UI work. The review panel accurately labels synthetic limitations and intended use. These are screenshots plus executable walkthrough, not a recorded video or a complete accessibility certification.

## Restartable next steps, in order

The [harness runbook](../runbooks/PRAXIS_LOCAL_PERSISTENCE_HARNESS.md) has exact local startup/test/disk-restoration commands. Preserve the current working tree and its scoped manifest; do not treat generated audit artifacts or other worktrees as disposable.

1. **Make every capsule writer safe.** Inspect `capsule-service.ts` writers (`bumpCapsuleVersion`, reviewed changes, fork/combine/shared clone and access mutation). Add conditional immutable published numeric snapshots and caller revision conflicts while retaining exact legacy resolution. Test competing vN writes and missing pins; no latest fallback. Implement complete semantic copy/merge with conflict ledger and origin reviews retained as history, plus server publication/reuse gates. Acceptance: all fields/source anchors survive copies; stale review cannot become the new owner's approval.
2. **Finish semantic correction in existing builder/inspector.** Qualified claims, support/contradiction, actor aliases, dates/relationships and scoped proposal review; dirty/conflict/diff states. Acceptance: correct and review a Situation capsule and resulting Output capsule via UI; shared User/Tool shell validated. Purpose edits alone do not satisfy it.
3. **Repair existing Capsule+ import.** Persist full private proposed semantic/graph rows using current envelope and `.praxis` package, size/schema/hash/reference validation, rights/quarantine and identity remapping. Imported review is historical, never local authorization. Acceptance: isolated-reader export/import without original vector index, with missing/reference-only sources, malicious fields, permissions downgrade and concurrent correction.
4. **Bridge the existing project work item into AgentRun.** Extend project schema/work panel and existing run creation with owner/project/work revision, exact capsule/evidence/tool scope and idempotency. Use local synthetic Postgres/queue adapter clearly labeled; do not reuse production credentials or invent another engine. Persist/reconcile the authorized project→run→memo/output-capsule link before success. Acceptance: duplicate dispatch, refresh/reconnect, cancellation, timeout, worker failure/retry, stale worker, unavailable provider and saved-memo/link-failure recovery without re-generation/double charge. These are implementation/environment prerequisites, not proof that the cloud engine is absent.
5. **Propagate evidence changes.** Extend existing `writeDependencyInvalidationNotes` through source version→claims→capsule→runs/artifacts. Acceptance: visibly stale current-use review while old pinned output/history remain unchanged; explicit opt-in project update/reuse elsewhere.
6. **Complete export and interaction acceptance.** Add reviewed-memo PDF through the existing genuine document path; provide a renderer, inspect every short/long page and repeat affected tests. Finish second useful output using the shared artifact contract; dismiss/position onboarding so critical notices remain readable; broad keyboard/accessibility/interruption/large-source acceptance. PDF/layout are implementation/tooling gaps, not paid-model approval blockers.
7. **Address dependency debt and independent review.** Audit still fails on low/moderate findings. Plan compatible updates with official maintenance/license evidence, review the entire candidate and repeat affected gates. Do not infer the Busboy-only static review covers all auth, concurrency or export changes.
8. **Separately authorize real evaluation.** Prepare dataset/provider/run plan and explicit spending cap before calls. Recover exact historical failure sources/questions/outputs when available; retain missing originals as pending. Execute current app-path generation and held-out source-span checks, then a fair matched-budget retrieval/unreviewed/reviewed comparison with equal-human-annotation baseline. Practitioner work, real language review, total analyst minutes and first/second/third deliverable usefulness remain unmeasured. No contacts or paid calls by inference. Genuine team roles/revocation stay unavailable until enforced/tested across API, retrieval, worker and export.

Final cleanup: the original interactive emulator session stopped without a verified exit export; its already exported and browser-verified `emulator-data` was retained. A separate local `firebase emulators:exec` imported that snapshot, ran a no-op command and **successfully re-exported** to `output/followup/emulator-final-snapshot`, then shut down cleanly, exit 0 (`checks/emulator-final-export.log`). This re-export is operational backup evidence, not another browser journey or portable import acceptance. Both local snapshots remain available. Port 3020 and emulator ports 9099/8080/4400 were stopped; port 3102 / PID 15776 remains intact. No credential, production flag, permission, billing, erasure or live data change was made.

The final candidate manifest adds this receipt to the original 78 scoped files; evidence/check/snapshot directories remain ignored local artifacts. `output/followup/candidate/agent-self-evaluation.md` separately assesses this handover; its subjective agent scores are not model fidelity or practitioner usefulness scores.

The first agentic milestone is not complete. Keep this candidate local for review and continue the ordered implementation above; no follow-up publication has occurred.
