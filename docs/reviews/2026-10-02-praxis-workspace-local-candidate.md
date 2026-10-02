# PRAXIS workspace local candidate

Evidence date: October 2, 2026. This is a reviewable private-project foundation,
not completion of the requested agentic workspace. P0 has local regression proof
with authentication/environment and model-fidelity acceptance still pending. P1
now has saved private projects and bounded **draft** assignments; semantic capsule
authoring and immutable capsule revisions remain incomplete. P2/P3 remain work.
No commit, push, merge, deployment, production mutation, model request, billing or
erasure activation was performed. Human usefulness, customer use and production
acceptance are unclaimed.

## Candidate and preservation

- Expected and verified remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`.
- Existing checkout: `C:\Users\giuli\tacitus-products\praxis`, `main`.
- Base and unchanged HEAD: `8ff509b877f1dcd2b3ed6d074d2d5e96e3f9b923`.
- Candidate: `C:\Users\giuli\output\praxis-workspace-local-20261002`.
- Candidate branch: `build/praxis-workspace-local-20261002`; all candidate changes
  are uncommitted. No other branch or worktree was seized.
- Other registered worktrees: `output/praxis-chat-first`,
  `output/tacitus-praxis-pricing`, `praxis-seo-2026-09-29`. Their HEADs and branches
  are captured in the local handover receipt. They were not edited.
- The original checkout's unrelated docs, `.serena/project.yml`, graph artifacts
  and generated AGENTS block remain intact. Candidate audit and graph output is
  separately generated and must not be mistaken for their edits.
- Locked dependencies installed using `npm ci --ignore-scripts --no-audit --no-fund`.
  No package or lockfile change, new provider, graph database, framework or MCP server.
  A newly created node_modules junction was removed after Turbopack refused it;
  the candidate uses its own installation.

## Before and after capability matrix

“Tested” below means the stated local deterministic/service/browser evidence,
including mocks where indicated. It never implies real Firebase, provider or
cloud-worker acceptance. Existing implementation was read at the base above.

| Capability | Before | Candidate after | Routes, records and runnable evidence |
|---|---|---|---|
| Login/session | Implemented; current local login proof blocked | Unchanged; blocked for genuine local login/relogin | `/login`, `/api/auth/session`; `src/lib/auth/auth-context.tsx`, `session-sync.ts`, `src/lib/api/with-auth.ts`. Project route tests exercise the signed-session wrapper with mocked Firebase verification. Browser test supplies a fixture session. |
| Source intake | Partial | Unchanged; no intake journey in project demo | `/api/documents/upload`, document detail/extract-stored; `src/lib/firebase/documents-service.ts`; owner situation documents/chunks; TXT/PDF/DOCX parsers. `documents-upload.test.ts`, `architect-document-intake.test.ts`. Original blob persistence is best-effort. Scanned/OCR and comprehensive corrupt/duplicate recovery remain open. |
| Capsule proposal/review/save | Partial, implemented builder and review cards | Preserved; no new semantic editor | `/api/context/capsules`, save-builder-draft; graph node/edge proposal routes; `capsule-service.ts`; owner capsules/reviewCards/reviewAudits/versions. Builder/version and review tests remain in suite. Demo capsule is pre-seeded, not extracted through UI. |
| Capsule editing/versioning/library | Partial | Exact version/hash attachment tested; semantic editing/revision acceptance still partial | `/app/capsules`, `/app/capsules/builder`, history/diff; `CapsuleLibrary`, `capsule-v2.ts`, `capsule-v3.ts`, `capsule-version-resolution.ts`. Existing numeric versions can still mutate in place. New project guards detect such changes; they do not make global capsule versions immutable. |
| Conversations | Implemented owner persistence; UI acceptance pending | Existing records preserved in fixture; no project link yet | `/api/conversations`, detail/turn APIs and `/app/conversations/[conversationId]`; owner conversations, `ask-thread-service.ts`; `conversations-isolation.test.ts`, turns/Ask contracts. Project creation never migrates them. |
| Projects | Design-only for requested model; persisted situations provided a partial surrogate | Implemented and tested in transactional fixture and real UI; genuine Firestore journey blocked | New `/app/projects`, `/api/projects`, `/api/projects/[projectId]`; `users/{uid}/projects/{id}` plus `revisions/rN`; `src/lib/projects/*`, `src/components/projects/*`; project service/API tests and `projects-local.spec.ts`. |
| Task execution | Existing bounded AgentRun backend; environment-gated | Draft project work items implemented/tested; dispatch bridge missing | Existing `/api/agents/runs` create/detail/dispatch/execute/retry/cancel/approvals/stream; SQL ledger, Cloud Tasks, Firestore mirrors; `agent-runtime/worker.ts`, `execution-lease.ts`, `state.ts`. New project work is only `draft`/`cancelled`, with no Run button. |
| Artifact edit/persist/review | Memo path implemented; shared multi-output system partial | Preserved; not connected to new project assignments | `/api/memos`, detail/from-ask-pack/review/export; `memo-service.ts`, owner situation memos/versions; output-capsule storage separate. `memo-service.test.ts`, saved-artifact, human-review and reviewed-export tests. No persisted brief/map is produced by the new project demo. |
| DOCX/PDF export | Genuine bytes; PDF lost sourceCards and could clip or corrupt text | PDF source appendix/wrapping fixed and tested; unsupported scripts fail explicitly; DOCX XML preserves multilingual text | `/api/export/work-product`, `src/lib/drafting/export.ts`; `export-evidence-preservation.test.ts`. Short and long controlled PDFs rendered and inspected. Approved memo export still supports Markdown/DOCX, not PDF. DOCX visual QA pending. |
| Team authorization | Owner isolation implemented; membership foundations design/partial | Private projects only; outsider tests passed in fixture | Server-derived uid, `withAuth`, `withDocumentOwnerWrite`; strict payloads, owner paths, default-deny client rules. `project-service.test.ts`, `api/projects.test.ts`. No collaborator/invite/shared-library UI; no claim of role enforcement for teams. |
| Import/export portability | Partial Capsule+ and memo handover formats | Unchanged; isolated semantic round-trip not accepted | `/api/context/capsules/[id]/capsule-plus`, `/capsule-plus/import`, `/api/memos/[id]/handover-package`; `src/lib/capsule-plus/index.ts`; capsule-plus/handover tests. Import reconstructs shell/coreRefs and proposals, not a lossless semantic/review/source package. |

## What the project slice actually does

An owner creates and reopens a private project with title, question, intended use,
audience, jurisdiction, nullable analytical cutoff, language, organizational
mandate and approved conventions. Unknown cutoff remains null and is explicitly
separate from source publication, event and effective dates. Existing Chat and
Capsules navigation remains; Projects is the explicitly requested additional
surface. Settings stays separate.

A selected capsule pin records stable capsule ID, numeric version, role, label,
semantic SHA-256 and document/source references. User/Situation/Tool/Output are
common context-role tags, not privileges or a claim that four editors exist.
References are not copies. A later version is advertised without automatically
upgrading the pin. A changed/missing pin blocks **new** assignments; earlier work
retains its captured scope and pins. The inspector opens separately so the draft
editor stays mounted. This is not a complete evidence or source-staleness index.

A draft work item records its own ID, instruction, requested output kind,
timestamps, project revision, scope and selected context. Brief, map, notes,
scenario and talking-point values describe requested work, not runnable templates.
The UI says dispatch/deliverables are not connected. Cancellation persists a
draft cancellation; no running agent is simulated.

Every project write passes a strict server schema, owner/account guard and
Firestore transaction. Server-selected owner/workspace cannot be supplied by the
client. `expectedRevision` prevents silent concurrent correction. A successful
receipt contains the canonical project ID/revision only after transaction
completion. Operation IDs reject changed-payload reuse and replay exact writes.
Project revision snapshots are retained; they are change receipts, not truth
certificates or human approvals. No model can assign a review through these APIs.

Creation request receipts and unsaved form text use owner/project-scoped
sessionStorage only for recovery. Canonical saved work is Firestore-owned. Pending
creation key plus exact payload survives a committed write with a lost response
and refresh. A changed pending payload is blocked until reconciliation; opening
the matching saved project clears the receipt. If browser receipt storage fails,
creation is withheld before dispatch with an actionable message. New project
restores the pending receipt's original scope even after a pre-commit interruption
and a changed/discarded draft; canonical project-link loading also reconciles
after an authorized read. Scope/assignment recovery retains its original revision
check. Navigation guards cover links,
New chat, sign-out, Ask event and keyboard routes. Browser Back/Forward may navigate
without a modal; a recovered draft appears on return. Other editors' history
behavior is not established by this slice.

Bounds are deliberate: 20 context pins, 40 draft work items, 200 mutation receipts,
700 KB project record, 30 KB request body. Receipts are not evicted to manufacture
idempotency. Recent projects are ordered before a 100-record limit, disclosed in
UI; older records need their saved project link. Cursor pagination and record
compaction remain future work.

## Architecture and migration decisions

1. Reuse Firestore and existing authentication/account guards; do not reuse
   `/api/situations` POST for no-cost onboarding because it automatically triggers
   extraction. New projects have no automatic provider calls.
2. Schema version 1 and a new owner collection; no existing capsule/conversation
   migration, destructive backfill or production index/rule change. Project
   APIs use Admin SDK exclusively. Existing default-deny covers project client
   reads/writes; ordered single-field `updatedAt` queries need the normal Firestore
   single-field index, not a new composite index. Emulator/rules proof is pending.
3. Safe fallback is to stop serving the new Projects route/API/navigation while
   retaining all owner project documents for future schema-aware recovery.
   Legacy routes/data remain usable; never delete records for rollback. Future
   incompatible changes must retain the v1 reader or provide reversible migration.
4. Numeric capsule versions are not sufficient evidence immutability in the base.
   Semantic pins fail closed on changed content. Full immutable revision IDs,
   parent hashes, qualified claim edits and stale human review need a dedicated
   extension to existing capsule storage, not four independent systems.
5. No new dependency. Existing `docx`, jsPDF and pdf-parse power exports/QA. PDF's
   built-in WinAnsi font cannot support arbitrary source languages. Unsupported
   glyphs return 422 directing DOCX; general export failures return 503. No claim
   of multilingual PDF completeness or live approval lineage.

| Responsibility | Existing records/code | Candidate contribution and smallest next behavior |
|---|---|---|
| Evidence | Documents/chunks, source spans, evidence receipts | Pins keep reference IDs; next bind each exact passage to source hash/version, extraction status and rights. |
| Claims | `ContextCapsuleClaim`, claimLedger/support/caveats and proposal cards | No new semantic editor; next preserve modality, negation, actor and supporting/contradicting anchors in edits/review. |
| Situation | Situations, capsule coreRefs/body | Project question/purpose/audience/jurisdiction/cutoff now visible/persisted; next link sources, conversations and artifacts. |
| Temporal | Capsule timeline/claim intervals | Nullable project analytical cutoff; next distinct publication/event/effective/recorded/reviewed fields and unknown handling. |
| Ontology | Registry and reviewed graph nodes/edges | Reused; next validated relationship edits with review scope, never global authority from imported data. |
| Reasoning | Method references, caveats, evidence/runtime receipts | Inspectable mandate/conventions/instruction; next artifact assumptions/alternatives/rationale. Never private model reasoning. |
| Memory | Saved capsules/conversations/memo versions/corrections | Continuing project scope and draft snapshots; next “used in” dependency index and deliberate revision reuse. |
| Governance | Owner guards, capsule review audits, memo human review | Private owner paths/concurrency; next explicit membership scopes, rights/redaction policy and imported-history quarantine. |
| Runtime | SQL runs, queue, worker leases, tools/retry/events | Durable draft assignment only; next idempotent bridge and canonical artifact before success. |

These are responsibilities across current modules, not nine new services.

## Changed files and review scope

The exact file/hash/line inventory, branch/base/HEAD, worktrees, tracked diff and
original checkout status are in
[`output/projects/checks/candidate.json`](../../output/projects/checks/candidate.json).
There are 32 application/test/script/document files in this review inventory;
generated audit and graph files are separate tool output. Line counts in the
inventory are total file size, not added-line counts; `trackedApplicationDiff`
records tracked additions/removals and new files are listed explicitly.

| Area | Changed paths |
|---|---|
| Private data/API | New `src/lib/projects/{schema,service,http}.ts`, `src/app/api/projects/route.ts`, `src/app/api/projects/[projectId]/route.ts` |
| Project UI/recovery | New `src/app/app/projects/page.tsx`, `src/components/projects/{project-workspace,project-scope-form,project-work-panel}.tsx`, `src/components/projects/use-project-draft.ts`, `src/lib/navigation/unsaved-work.ts` |
| Existing shell | `src/components/app/{app-shell,app-sidebar,mobile-bottom-nav}.tsx`, `src/lib/navigation/{primary-nav,v3-surface-classification}.ts`, `scripts/audit-mvp-route-shape.ts` |
| Export | `src/lib/drafting/export.ts`, `src/app/api/export/work-product/route.ts` |
| Fixture/demo/regressions | New `scripts/demonstrate-project-slice.ts`, `tests/fixtures/example-advisory-dossier.json`, `tests/helpers/project-firestore.ts`, `tests/e2e/projects-local.spec.ts`, project API/service/export test files; three existing navigation/settings route contracts updated |
| Documentation | `CHANGELOG.md`, `docs/product/README.md`, this handover |

The large generated graph diff is not new product functionality. Review source
separately from graph backups, LATEST audit timestamps/reports and Next's AGENTS
block. No rules, indexes, production flags, auth provider configuration, secrets,
package manifest or lockfile changed.

## Fixed root causes and remaining fidelity gaps

- PDF discarded `sourceCards`: now writes a readable source appendix. Wrapped
  title/headings/body/appendix check page boundaries. Actual extracted PDF text
  and DOCX XML, not prompt strings, assert qualifications and references.
- PDF font silently mishandled unsupported scripts: explicit export failure with
  DOCX fallback. Arabic/Japanese survive DOCX XML; PDF support is bounded.
- Hashing the entire normalized capsule made read-receipt timestamps appear to
  change evidence: hash selects semantic fields. Read receipts do not invalidate
  a pin; changed rationale/caveats do. This does not certify semantic equivalence.
- Unordered latest-100 list could omit recently saved projects: server query now
  orders before limiting; fixture implements the limit and regression exceeds 100.
- Discard/reload left assignment text despite clearing its dirty marker: editor
  remount/recovery handling now clears it only after an accepted discard.
- Programmatic shell navigation bypassed unsaved guards: shared navigation gate
  now includes Ask shortcuts/event. Browser regression exercises refusal/recovery.
- Lost creation response plus refresh forgot the idempotency key: expanded E2E
  first failed with two projects, then passed with one after pending-receipt recovery.

Historical generation remains **unresolved**. Read
[`2026-09-30-praxis-quality-evaluation.md`](2026-09-30-praxis-quality-evaluation.md).
The retained exact `cf04c6bb` answers include “No capital has been secured,
allocated, or expended” and a conditional pilot “becomes mandatory.” The former
is unsupported negative capital status, not proof that capital was secured; both
exceed the supplied undecided funding/optional pilot. Original answer/question/
provider receipts were recovered in the original checkout under
`output/playwright/practical-refinement-20260930/model-policy-live-1790815848620-bcb1ab63.*`
and `coordinator-model-content-review-1790815848620-bcb1ab63.json`. Original upload
bytes have not been verified. The replacement Example Advisory fixture is
explicitly synthetic. No current model evidence establishes these defects fixed.

Extraction → proposal → retrieval → compilation → generation → postprocessing →
saved artifact → export was not traced completely this run. Next trace the exact
retained case and add span-support assertions at the earliest supported defect.
Existing evidence-pack selection/ranking order and truncated fallback deserve
tests; a stronger prompt, disclaimer or banned word is insufficient acceptance.
Same-name actors, changed dates/numbers, contradictory accounts, source injection,
irrelevant citations and held-out multilingual variants still need the requested
release regressions through saved artifacts. Prior generated outputs stay derived.

## Reproducible local demonstration and its boundaries

Dataset: [`tests/fixtures/example-advisory-dossier.json`](../../tests/fixtures/example-advisory-dossier.json).
Three redistributable synthetic sources: Day 1 proposed January start/undecided
funding/optional pilot; Day 8 industry transition request; Day 15 July under
consideration without adoption, retaining Portuguese *poderá* and funding
condition. Two snapshots, six prepared evaluation questions and an explicitly
synthetic named review example are provided. That example is not an actual human
sign-off. The current demo checks only part of this dataset's possible journey.

From this candidate in PowerShell:

```powershell
npm ci --ignore-scripts --no-audit --no-fund
npm run dev -- --hostname 127.0.0.1 --port 3102
```

In another PowerShell terminal in the same candidate:

```powershell
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:3102'
npx playwright test tests/e2e/projects-local.spec.ts --workers=1
npx tsx scripts/demonstrate-project-slice.ts
npx tsx scripts/evaluate-policy-narrative-quality.ts --dry-run
```

Browser proof is actual Next UI with actual project service, but browser API
interception provides transactional in-memory Firestore, fixture session and
ancillary responses. External requests and unknown mutations are blocked.
Server authentication tests separately use real signed-session wrapper with
mocked Firebase verification. **Neither is a Firebase emulator or genuine login.**
Clearing/readding the fixture cookie proves fixture-session reopening only.

The browser journey creates scope, loses a committed creation response, refreshes,
recovers/retries without duplication, attaches a seeded version, saves a draft,
refreshes/reopens, rejects a stale correction while retaining text, exercises
discard choices, refuses New chat/Ask transitions, recovers after browser history,
detects changed context and blocks new work, switches to an empty new project and
reopens through fixture session restoration. It asserts no unhandled page errors
or unknown writes. Dev logs still report CSP/eval and smooth-scroll warnings;
the Next development indicator remains visible in screenshots. These were not
hidden or used to justify relaxing production CSP.

Service tests cover two isolated owner identities, missing/foreign pins, same
version content change, concurrent writes, account-deletion guard, strict
privileged-field rejection, date validation, missing cancellation and operation
replay. They do not cover genuine authorized collaborators or revoked membership.
Worker timeout/failure/retry/cancellation/model-unavailable contracts exist in the
full unit suite, but no project task was dispatched. Lost connection is simulated
at creation-response transport; no real worker reconnect is claimed.

## Exports and visual evidence

Controlled export artifacts and receipt:
[`output/projects/demonstration-1790957456994/receipt.json`](../../output/projects/demonstration-1790957456994/receipt.json).
Short output: [DOCX](../../output/projects/demonstration-1790957456994/short.docx),
[PDF](../../output/projects/demonstration-1790957456994/short.pdf),
[page](../../output/projects/demonstration-1790957456994/short-page-1.png).
Long output: [DOCX](../../output/projects/demonstration-1790957456994/long.docx),
[PDF](../../output/projects/demonstration-1790957456994/long.pdf),
pages [1](../../output/projects/demonstration-1790957456994/long-page-1.png),
[2](../../output/projects/demonstration-1790957456994/long-page-2.png),
[3](../../output/projects/demonstration-1790957456994/long-page-3.png),
[4](../../output/projects/demonstration-1790957456994/long-page-4.png).

All five PDF pages were rendered and inspected in this task: readable text,
references and qualification retained, no observed clipping. Long output repeats
fixture excerpts to exercise pagination; it is not a professionally authored long
brief or model output. No Word/LibreOffice renderer was established: DOCX is a real
ZIP Word document and XML checked, but visual pagination/RTL/tables/link behavior
remain pending. Source URLs are readable synthetic locators, not source downloads
or established clickable links. Exports call the product's actual helper contract
with controlled input; no approved persisted-artifact export journey is claimed.

Output example from the controlled draft: “Funding remains undecided. Capital
secured, allocated or spent is unknown. No adopted start date is established. A
pilot remains an optional recommendation subject to funding.” EA-D1/EA-D15 retain
the supporting original source text. Citation entailment for generated answers
has not been evaluated.

Fresh browser captures under `output/projects/walkthrough/` show project scope and
changed context at 320/768/1440 px and 200% root text with reduced motion. These
are fixture screens from the candidate, not older production screenshots. Welcome
overlay was dismissed; internal scroll position was set explicitly. Keyboard
Enter and refusal of global shortcuts are tested; no horizontal document overflow
was observed. This is not exhaustive accessibility, long-list, every panel or
every product viewport acceptance.

## Validation record

Final exact outcomes are recorded in
[`output/projects/checks/validation.json`](../../output/projects/checks/validation.json)
and adjacent logs. Required checks must be interpreted with their environment
boundaries. The aggregate gate passed local typecheck/build/routes/capsules/
agents/architecture/surface, then failed at GCP runtime verification. It did not
complete. `audit:simplification` was run separately; no skip flag converts the
cloud failure into a pass. Expired gcloud tokens yielded 34 audit hard failures
and four warnings; these are unverified resources, not proven production outages.
No auth/credential repair was attempted.

Historical reconciliation only: the October 1 canary read HTTP health around
18:34 UTC for source `52102b5c4e775a0744a16af96c01e3a09e350123` and
`praxis-frontend-01099-wpp`; the `8ff509b` checkout then differed in documentation.
`--skip-deploy-check` did not suppress that health request. No new PRAXIS production
health or state-changing canary was run here. Today's public TACITUS page reads
are separate reference evidence, not acceptance of today's PRAXIS served code.

The first complete unit run had 445 passing files and one navigation contract
failure; its expected navigation was updated for the explicitly requested
Projects/Chat/Capsules model. The next run passed 446 files/2638 tests before the
final two recovery fixes. A final full run/build/lint is recorded separately.
Focused 11-file/60-test run passed; final expanded browser run passed. Assertions
were expanded for recovery and ordering rather than removed. Root lint warnings
remain existing technical debt.

| Final check | Result and local receipt |
|---|---|
| `npm run typecheck` | Passed; `typecheck-final.log` |
| `npm run build` | Passed; `build-final.log`; missing Admin credentials are runtime warnings, not configured persistence |
| `npm run lint` | Passed, zero errors/five existing warnings; `lint-final.log` |
| `npx vitest run --maxWorkers=2 --reporter=dot` | 446 files/2638 tests passed after final application edits; `unit-all-final.log` |
| Project browser E2E | One expanded journey passed; `e2e-project-final.log`; fixture session/storage, with fresh screenshots |
| Focused regression run | 11 files/60 tests passed; `focused-final.log`; broader final run includes them |
| Aggregate gate | Failed at expired-auth GCP audit, 34 hard failures/four warnings; `aggregate-gate.log` |
| Local route/capsule/agent/architecture/surface/simplification audits | Final results in `audit-local-final.log`/`validation.json`; these do not replace the failed aggregate cloud gate |
| Graphify AST update | Passed, optional SQL/Terraform parsers missing; `graphify-final.log` |
| Evaluation dry run | Passed preparation only, zero generated answers; `evaluation-dry-run.log` |
| Source/document diff whitespace | Passed; `diff-check.log` |
| Genuine auth/emulator/worker/provider E2E | Not run; emulator/SQL/queue wiring absent; paid generation unapproved |
| DOCX visual and semantic portable round-trip | Not run; local Word renderer unavailable; package implementation incomplete |

Graphify AST update succeeded without API/model calls. The final update produced
18,707 nodes, 41,324 edges, 872 communities and an aggregate visualization. Six Terraform/four
SQL files lacked optional parsers; no LLM relabeling was done. Generated graphs,
audit LATEST files and Next's generated AGENTS block are task/tool output, not
application behavior changes. Final graph receipt reflects the recovery edits.

## Evaluation, portability and team limits

Existing `scripts/evaluate-policy-narrative-quality.ts --dry-run` prepared eight
synthetic cases/two prompt conditions without provider requests. All model outputs,
human verdicts, analyst minutes, acceptance scores, latency and cost comparisons
remain unavailable/unmeasured. The harness isolates framing, not capsule retrieval
or complete workspace benefit. Example Advisory questions are not yet a complete
scored fidelity harness. Controlled-output export tests prove plumbing only.

Next evaluation must separately measure extraction, retrieval, material claim
support/qualifications, reviewer corrections, source updates and whole journeys.
Compare strong retrieval with notes, unreviewed capsules and reviewed capsules
with updates; give a secondary retrieval baseline the same reviewed annotations.
Keep evidence/model/settings/context/token/cost budgets comparable and count
setup/review/update work for the first three deliverables. Human measurements
stay null until real assessment. Paid generation needs separate approval with
dataset, provider, settings/run count and spending cap; no request was made here.

The current trust page's exact loss warning was recovered: “PRAXIS export/import
is not yet lossless: document and workspace references need further work.” The
candidate does not resolve those losses. No isolated reader without indexes,
semantic export→import comparison, source-anchor movement, permission downgrade,
malformed-package quarantine or imported-review trust test was completed. A small
versioned manifest with source hashes/anchors, qualified assertions, review hashes,
rights and lineage is the next portability slice; do not treat shell equality as
acceptance or imported reviews as permission.

Fresh read-only reference captures/HTTP/hash receipts are in
`output/projects/references/`: TACITUS product/trust, Legora workflow inspiration,
W3C PROV-O/Web Annotation and Meta CLM license. W3C exact/prefix/suffix selectors
and derivation/activity/actor terms inform the next practical record contract;
no RDF service was added. CLM license still says Attribution-NonCommercial 4.0
International on this date; no CLM source/model integration or commercial reuse.
Legora's workflow clarity supplies inspiration only, no copied claims/branding.

## Acceptance questions answered

| Requested journey | Current answer |
|---|---|
| Log in/create/reopen real persisted work | Partial: actual UI/service with durable fixture records; genuine Firebase login/Firestore blocked. |
| Create/inspect/correct/version/find/reuse capsules | Partial existing builder/library; exact selected pins visible. Full Situation/Output semantic edit/review/reuse UI journey unrun. |
| Dispatch bounded task/recover without loss or duplicates | No new project dispatch. Draft creation/recovery tested; worker contracts only, no executed task. |
| Inspect source/correct/save draft/create second deliverable | Existing memo paths preserved; complete same-project brief+map acceptance not demonstrated. |
| Funding/modality/attribution/date fidelity through export | Controlled source text/PDF/DOCX assertions pass; real-generation fidelity unresolved. |
| Source change marks dependent review without rewriting history | Project capsule-hash change blocks new work and retains old pins; source-level claim/artifact stale review missing. |
| Actual Word/PDF and semantic portable round-trip | Real export bytes; all PDF pages inspected; DOCX visual QA and semantic round-trip pending. |
| Second user/worker access only if authorized | Private owner/outsider fixture tests pass; real membership/collaborator/revocation/worker scope journey pending. |
| Mocks/unrun checks/production limits explicit | Yes in this document and check receipts; no production acceptance claim. |

## Restartable next slices

1. **P0 local authenticated foundation.** Configure existing Firebase Auth/Firestore
   emulator wiring with non-production demo project and documented ephemeral test
   identity; do not copy production service-account secrets. Current candidate
   Admin initialization requires configured credentials. Prove true login,
   logout/relogin, expired session, denied API and real persisted reopen. Retain
   existing source/capsule/conversation/memo tests. GCP refresh is a separate
   optional operator lane, not needed to implement local emulators.
2. **P0 fidelity.** Recover/hash the historical original upload if authorized;
   otherwise keep the missing-source case pending. Trace source/proposal/retrieval/
   compilation/output/save/export and fix the earliest observed defect. Add exact
   supporting-span and held-out modality/attribution/injection/false-premise tests.
   Real generation is a separately approved bounded run, not a mock score.
3. **P1 capsule lifecycle.** Extend existing capsule store with immutable revision
   IDs, parent/semantic hashes and optimistic semantic edits; add qualified claims,
   relationship/date/source edits and per-item review decisions tied to hashes.
   Preserve imported review as history. Test Situation and Output UI journeys,
   validate User/Tool data roles, library search/filters/preview/dependencies,
   explicit reference vs copy and deliberate project revision updates. No legacy
   migration without versioned fixture and fallback reader.
4. **P1 project continuity.** Link actual source versions, conversations and
   artifacts to project identity and enforce selected evidence before retrieval.
   Add record validation on reads, recent-project pagination and capacity handling.
   Build first-run sample intake through existing TXT/PDF/DOCX/purpose paths;
   preserve current provider/retention notices.
5. **P2 bounded execution.** Bridge saved work to existing AgentRun SQL/queue/lease
   state machine with project/user identity, allowed source/tool IDs, exact capsule
   revision/hash and idempotency. Start with no-cost deterministic local adapter;
   label controlled outputs. Persist artifact before success receipt. Prove retry,
   cancel/timeout/failure/stale worker/reconnect/unavailable model. No Run UI until
   those paths work. No production queue canary.
6. **P2 artifacts and exports.** Reuse memo/output contracts for source-grounded
   brief and attributed stakeholder map; edit/save/reopen/version/scoped human
   review, then export canonical snapshot. Regeneration creates a separate
   candidate preserving human edits and previous approval. Extend only proven
   templates to notes/scenarios/talking points. Embed a licensed maintained Unicode
   PDF font only after need/license review; render all Word/PDF pages locally.
7. **P3 safe updates/portability.** Dependency index maps source revisions → claims
   → capsule revisions → tasks/artifacts. Changed evidence marks affected review
   stale without rewriting approved history. Add rights-aware JSON+Markdown
   package, referential/hash/size/schema validation, extension quarantine and
   isolated-reader round-trip. References needing access must say so.
8. **P3 teams.** Only after private flow passes, define owner/editor/reviewer/viewer
   membership scopes on server/storage/retrieval/exports and worker execution.
   Test two tenants, real collaborator, outsider, revocation and role changes,
   cache switches and source restrictions in emulators. Keep invite/shared-library
   actions unavailable until enforced. No deployed rule/permission changes.

Concrete environment blockers: candidate has no configured Firebase Admin/Auth
test environment; real worker needs local SQL/queue identity/adapter wiring;
DOCX renderer unavailable; GCP read audit needs operator reauthentication. Most
remaining product slices are **implementation gaps**, not authorization blockers.
Only real provider/cost/data-sharing/production/user-study actions need new scoped
approval. No approval is needed to continue the listed local implementation.
