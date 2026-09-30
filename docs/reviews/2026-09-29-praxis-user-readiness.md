# PRAXIS user readiness â€” 2026-09-29

Status: user-approved release candidate; deployment and production acceptance are in progress.
Scope: access/login, Ask and writing with attached ContextCapsules, and separate
capsule creation/review/reuse inside the existing Home and Capsules surfaces.

## Current verdict

The initial production audit found the site available and its Firebase/runtime
configuration healthy. Deeper real journeys then reproduced capsule inventory
heap exhaustion and upload 503s, rejected Ask persistence writes, and a saved
research memo that could not reopen. Availability does not establish that these
user journeys work. This repair wave must be released and repeated on the served
revision before its local fixes count as production recovery.

The dated baseline was commit `163469a7f0984d0096f0c67c4265305542865b3d`, revision
`praxis-frontend-01076-92d`. See the [runtime audit](2026-09-29-praxis-runtime-evidence.md)
for cloud/log evidence and the [acceptance plan](2026-09-29-praxis-user-journeys-plan.md)
for the two product workflows. The preexisting local `2026-09-29-praxis-live-release.md`
is historical evidence; it has not been overwritten or promoted into a pass for
this repair wave.

## Local repairs and review

| Problem | Reviewed local behavior | Source boundary |
| --- | --- | --- |
| Account changes exposed browser state | Home Ask, guide chat and active context use owner-scoped caches, mask stale state immediately, gate writes/sends on hydration, and cancel stale requests. Unsent drafts are scoped too. | `praxis-chat.tsx`, `ask-chat-cache.ts`, `tasklet-workbench-conversation.ts`, `use-active-context-stack.ts` |
| Large inventories exhausted the frontend heap | Firestore inventory queries select metadata at the database boundary. Only the selected capsule loads full evidence. Browsing no longer creates every starter automatically. | `capsule-service.ts`, `/api/context/capsules`, `tasklet-praxis-workbench.tsx` |
| Builders did not share a durable canonical draft | The wizard saves a private canonical capsule, validates source ownership/workspace and preserves source IDs. Home resolves Use in Ask links through owner-checked canonical attachment and gates sending until confirmed save/query consumption. Purpose/output preferences remain author instructions, not verified evidence. | `capsule-builder-draft.ts`, `CapsuleBuilderWizard.tsx`, `ask-handoff.ts`, `praxis-chat-first-shell.tsx` |
| Rebuilding reset reviewed proposals | Architect proposals include a fingerprint of the actual source text and preferences. Unchanged rebuilds preserve decided cards; changed input creates fresh proposals. Transaction rereads protect decisions against races; document refs are retained. | `capsule-service.ts` |
| Firestore rejected optional source-card fields | All Ask conversation/turn writes share recursive undefined-field removal, preserving provenance, array positions, falsy values and native Firestore values. | `ask-thread-service.ts`, `/api/ai/chat` |
| Saved agent memos required a missing index | Canonical memo IDs resolve directly to the existing owner/case path and validate owner, ID, case and template. Legacy reads retain their scoped compatibility path. | `memo-service.ts` |
| Saved memo links did not open the writing surface | A bounded, single memo ID opens the existing workbench from `/app`; ordinary Home retains the simple chat shell. Repeated/invalid IDs fall back safely. Memo dialogs sit above floating account/help controls so Close remains usable. | `/app/page.tsx`, `tasklet-praxis-workbench.tsx`, `audit-public-surface.ts` |
| Input checks falsely reassured users about generated writing | The primary generated body is checked before persistence. One hash-bound review receipt survives memo/version/block/output/run serialization; input-evidence counts stay separate. Unapplied critique, including legacy embedded feedback, is shown separately, and edited bodies invalidate their earlier review. Generated memos remain under whole-draft review. | `output-review.ts`, `worker.ts`, `schema.ts`, `memo-service.ts`, `sourceability-request.ts`, `proof-summary.ts`, `tasklet-praxis-workbench.tsx` |
| Direct instant-mode API turns used changing history IDs | A shared stable owner/thread partition is used for history reads and both stores while ephemeral model-context IDs stay in receipts. Failed prompts restore without replacing a newer draft; automatic handoffs are consumed once. | `ask-conversation.ts`, `/api/ai/chat`, `praxis-chat.tsx` |

Independent source review found no blocking issue in these slices. Unit lifecycle
simulations and mocked UI tests remain regression evidence; they do not prove
real account-switch timing, model quality, or deployed persistence. The direct
Ask history/retry repair has passed source review; its final integration proof
is pending. Its changing-partition defect was in raw instant-mode API calls,
not a reproduced Home failure; Home already supplied a thin fallback signal.
Metadata projection reduces payloads; inventory pagination and capacity/load
proof remain follow-up work.

The [persisted synthetic research memo inspection](../../output/playwright/user-readiness-20260929/memo-inspection.json)
confirmed saved source receipts, the labeled synthetic review deadline and
unconfirmed funding. It also found a commitment-versus-implementation category
error: an appended self-critique identified the correction, but the saved body
still contained the error. Its footer reported zero unsupported claims despite
nine verifier flags. Saving a memo and retaining citations therefore does not
establish a publication-ready product. Review findings, body corrections and
export/readiness counts must agree before that quality gate passes.
These flags are review signals, including some headings and labels; they are
not nine independently established false factual claims. Input-evidence checks
and generated-body verification must remain distinct and visibly scoped.
A bounded local consistency repair has passed independent source review. It
checks the primary generated body before saving, retains the same review receipt
and hash across artifacts and the actual run API serializer, and separates
unapplied critique from the editable body. Missing/disabled/zero-span verification
cannot approve a draft; a supported selected claim cannot clear whole-draft review.
This slice does not include a body-bound human approval action, so even zero
findings do not make generated writing export-ready. It exposes the review work
honestly; it does not automatically correct the observed factual or conceptual
errors. Final integration and served-revision proof remain required.

## Validation record

Evidence directory: [output/playwright/user-readiness-20260929](../../output/playwright/user-readiness-20260929).
Root integration owns the final totals and release result.

| Gate | Current result | Receipt |
| --- | --- | --- |
| Typecheck | PASS | `typecheck-final-green.txt` |
| Capsule inventory/rebuild regressions | PASS: 61 tests | `inventory-rebuild-green.txt` |
| Ask write sanitization and memo read regressions | PASS: 16 focused tests, scoped lint and whitespace check | [runtime repair evidence](2026-09-29-praxis-runtime-evidence.md#assigned-local-repairs-and-validation) |
| Production build and all aggregate audit lanes | PASS. Memo-only dispatch required a scoped public-surface audit correction; remaining lanes completed after it. Final dialog CSS was rebuilt. | `audit-gate-final.txt`, `audit-gate-completion.txt`, `public-surface-final.txt`, `build-final-green.txt` |
| Full lint | PASS: zero errors, seven tracked warnings; final integration files checked separately | `lint-final.txt`, `integration-lint-final.txt` |
| Full unit suite | PASS: 384 files / 1,712 tests, zero skipped. Final dialog stacking change has additional build/browser validation. | `vitest-final-green.txt` |
| Final responsive local browser regressions | PASS: two journeys, zero skips/failures; 390/1,440 px overflow and Close hit-tests, isolated mock APIs | `user-readiness-browser-final-green.json`, inspected `saved-context-*.png` / `saved-memo-*.png` |
| Live provider/user journeys after this release | PENDING: release not deployed. Dated baseline login and three-format capsule/Ask passed; conversation upload and saved memo read failed. | Runtime evidence and acceptance plan |
| Dependency audit | 47 advisories: 44 moderate, 3 low; no high/critical | `npm-audit.json` |
| Final UI/route contracts and documentation links | PASS: 87 focused tests and 45 local links, zero broken links | `final-ui-contracts.txt`, `release-preparation.txt` |
| Local code graph refresh | Updated: 17,813 nodes / 38,923 edges. Six Terraform and four SQL files lack optional AST parsers; graph extraction is incomplete for those files. No model call was added. | `graph-update-final.txt`; graph files excluded from release |
| Commit/push/deploy/served-revision match for this repair wave | PENDING | User approved all release actions; deployment receipt and live acceptance required |

Read-only production recheck at 2026-09-30 01:10 UTC still served
`163469a7f0984d0096f0c67c4265305542865b3d` / `praxis-frontend-01076-92d`.
The local release has not been pushed or deployed. See
`runtime-final-readonly.json` for the refreshed identity, rather than interpreting
the green health status as recovery of the failed user journeys.

Dependency advisories remain maintenance work. Evaluate compatible patches with
the existing transport/provider tests; do not use forced major upgrades or
downgrades during workflow recovery.

The browser fixtures are restricted to localhost, block external requests and
service workers, and reject unknown mutations. They prove canonical Save â†’
visible dock attachment â†’ Ask request/history isolation/retry, and saved memo
opening, primary-body editing, stale review, separate unapplied feedback and
save/reopen, including older embedded critique. They do not prove Firebase or
model quality. Responsive screenshots are inspected at 390 and 1,440 pixels.

Unrelated preexisting `AGENTS.md`, Serena configuration, audit/graph outputs and
the historical local release note are excluded from the scoped release. No
credentials, Firebase rules, indexes or cloud configuration are changed.

The concrete scoped release is captured in ignored local artifacts
`release-review.patch`, `release-manifest.json` and `release-files/` within the
evidence directory. The patch contains 65 source/test/documentation files and
passes reverse-application checking against the working files. Existing
Cloud Build-on-push automation means approval covers publication/deployment as
well as the source push. Release from a clean scoped checkout and verify the
served commit before repeating the two real user journeys.

## What works, what is missing, and next sessions

| User need | What works or is repaired | Missing acceptance evidence | Next session |
| --- | --- | --- | --- |
| Access and login | Dated production front door/login and protected-route checks passed; the disposable account reached real authenticated work. | Fresh signup, verification, reset, expiry, deletion and real account-switch isolation are not fully proven. | Complete the account lifecycle on the served release with disposable accounts. |
| Ask directly and continue later | Real provider answers were observed; owner-scoped cache/undefined-write repairs are local. | Direct Ask must preserve two questions in one server history despite changing temporary context IDs; reload and failure retry need final proof. | Verify standalone Ask, reload, retained draft on failure and separate attached-capsule history. |
| Attach saved context | Attachment preserves the saved capsule's source refs/version; active-context failure recovery has focused regressions. | Repeat real unique-fact recall and persisted reuse after the final release. | Attach synthetic reviewed context, ask, reload and ask again; inspect the cited document. |
| Build context separately | Real three-format intake has dated evidence; canonical draft save and reviewed-decision durability are repaired locally. | Repeat TXT/PDF/DOCX plus idea/conversation intake, review, save/reopen, attachment and later Ask on this repair wave. | Run the independent builder journey, rejecting one proposal and approving another with a reason. |
| Write and reopen a useful product | A real approved agent produced a persisted memo with source receipts and labeled synthetic context. Exact canonical reads and hash-bound, review-required draft receipts are repaired locally; feedback stays separate from the body. | The inspected historical memo still contains an acknowledged uncorrected error. Final save/edit/reopen UI proof and production repetition remain pending; this slice has no whole-draft human approval action. | Apply review corrections, verify save/edit/reopen with intact citations and lineage, then scope a body-bound human approval/export workflow. |
| Durable agent work | Existing dispatch, owner approval, retrieval and saved-output seams are present. | Completed receipts must match substantive source text and visible saved output; duplicate delivery/lost response recovery is not fully proven. | Run one approved research task through final output, then test controlled retry recovery. |
| Entitlements and optional review | Existing plan gates remain; JEV is optional and disabled. | Free/paid server enforcement and Polar sandbox purchase journeys are not fully proven; JEV has no live provider acceptance. | Use scoped operator-provided sandbox setup for billing; retain JEV's disabled posture until separately proven. |
| Better policy/narrative analysis | Source receipts, uncertainty and reviewed context are available building blocks. | The inspected output preserved its synthetic limits but contained an acknowledged uncorrected error. No numerical capsule-quality improvement is established by contract tests. | Apply review corrections and compare six to ten retained real-provider outputs with/without reviewed capsules using the same sources and an analyst rubric. |

## Focused release and proof checklist

1. Finish direct Ask persistence/retry work, review the final diff, and resolve
   failing required checks. `audit:gate` includes TypeScript and production build.
   Run the remaining repository checks against the same final source:

   ```powershell
   npm run audit:gate
   npm run lint
   npm run audit:repo-shape
   npm run audit:architecture-reference
   npm run audit:gcp
   node scripts/audit-ai-routes.mjs
   npx vitest run
   npm audit --json
   git diff --check
   ```

2. The user explicitly approved all release actions. Preserve unrelated
   user/config/graph work and push the scoped reviewed commit. The active
   `frontend-main-on-push` Cloud Build trigger deploys the clean GitHub source;
   use `deploy:frontend:main-safe` only as a fallback to avoid duplicate builds.
   Record the commit,
   Cloud Build result, Cloud Run revision and served runtime match.
3. With existing disposable Firebase credentials kept out of receipts, run
   authenticated browser proof on `https://praxis.tacitus.me`. Set
   `PLAYWRIGHT_BASE_URL` and `PRAXIS_LIVE_AI_SMOKE=1` for
   `npx playwright test tests/e2e/capsule-studio.spec.ts --workers=1` so its
   real model recall is required. Repeat the standalone Ask, conversation/idea
   builder, account-switch and editable-memo steps that this test does not cover.
   A skipped test does not pass. `test:auth-runtime:live` checks health/GCP only;
   it cannot substitute for these browser journeys.
4. Inspect answers, citations, uncertainty, review decisions, saved outputs and
   later reads. Record UTC time, served revision and capsule/conversation/run/
   memo IDs with screenshots/JSON receipts. Check fresh logs for upload,
   memory, persistence and read failures. Mark unknown or failed gates clearly.

## Tooling and product direction

The [current official-doc/GitHub research](2026-09-29-praxis-tooling-research.md)
supports improving the existing Firebase/Google Cloud/Vertex/Genkit/ADK stack.
Priorities are real two-workflow proof, retry/duplicate-effect recovery, and a
small analytical quality corpus. Compatible maintenance patches follow those
checks; major SDK migrations and extra frameworks belong in separate scoped
work. TACITUS's inspectable-analysis framing informs a simple user loop: ask,
attach context, inspect evidence and assumptions, then save a useful brief.
Policymakers need options and caveats; analysts need claim-to-source fidelity;
narrative analysis must distinguish actor statements from inferred frames.
