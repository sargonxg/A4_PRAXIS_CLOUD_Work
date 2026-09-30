# PRAXIS user journeys and acceptance plan — 2026-09-29

Status: coordination plan; completion requires current production evidence.
Current checkpoint: [user-readiness receipt](2026-09-29-praxis-user-readiness.md).
Audience: policymakers, analysts, researchers, and people analyzing narratives.
Scope: the existing Home/Capsules cockpit and workbench.

## Product outcome

PRAXIS should support two understandable starting points:

1. Ask a question or draft a product, attach sources or saved context, inspect
   the evidence and assumptions, then save and continue the work.
2. Build a ContextCapsule from documents, notes, or conversation; inspect and
   accept/reject proposed content; save it privately; attach it to later work.

For policy and narrative work, outputs should distinguish what sources say,
the analyst's interpretation, competing explanations, uncertainty, and options.
Saved context improves continuity; it does not independently verify a claim.
The public framing remains “Policy analysis you can inspect.” The primary
navigation remains Home and Capsules; deeper actions stay in the cockpit.

## Evidence baseline and source map

The checkout and graph report were inspected at `163469a7`. The graph report
contains 17,678 nodes; it is a navigation aid, not runtime proof. No generated
wiki was present. Confirm the served revision separately for each live run.

| Responsibility | Existing source seam |
| --- | --- |
| Login and safe post-login handoff | `src/lib/auth/auth-context.tsx`, `src/lib/auth/post-login-redirect.ts`, `src/app/api/auth/session/route.ts` |
| Home chat, cache, conversation restoration | `src/components/app/praxis-chat.tsx`, `src/lib/firebase/ask-thread-service.ts`, `src/app/api/ai/chat/route.ts` |
| Capsule selection and prompt context | `src/lib/context/active-context-stack.ts`, `src/lib/context/context-injection.ts`, `src/lib/ai/context-kernel.ts` |
| Builder intake and reviewed content | `src/components/capsules/CapsuleBuilderWizard.tsx`, `src/lib/context/conversation-capsule-handoff.ts`, `src/lib/context/architect-document-intake.ts`, `src/lib/context/capsule-service.ts`, `src/app/api/context/capsules/route.ts`, `src/app/api/documents/upload/route.ts` |
| Agent evidence and output | `src/lib/agent-runtime/evidence-pack.ts`, `src/lib/agent-runtime/sourceability-ledger.ts`, `src/lib/ai/ask-orchestrator.ts` |
| Saved writing products | `src/app/api/memos/from-ask-pack/route.ts`, `src/lib/firebase/memo-service.ts`, `src/lib/created-work/service.ts` |

The [user-readiness receipt](2026-09-29-praxis-user-readiness.md) tracks the
current repair wave. The preexisting local `2026-09-29-praxis-live-release.md`
and earlier [streamlining notes](2026-09-29-praxis-streamlining.md) describe
historical checkpoints. Their dated results must not be promoted into a fresh
“works for users” claim without reproduction.

## Five concrete slices

| Priority and slice | Concrete problem and scope | Acceptance gate |
| --- | --- | --- |
| 1. Account and conversation isolation | Home chat can persist under a static browser key across logout; capsule changes can reuse a transcript under a different server conversation. Repair the scoped chat cache and asynchronous restoration first. | Real login reaches the intended work; reload retains the user's conversation. Logout/account switch removes prior visible turns and unsent notes; another user cannot restore, send, or convert them into a capsule. Capsule/conversation switch cannot transmit the previous scope's turns, including when an explicit thread ID is reused. Late history/stream callbacks cannot restore an old scope. Legacy unscoped data is ignored/removed. |
| 2. Ask, evidence, and writing | Prove useful real answers and the route from answer to editable saved memo, with the selected capsule actually read. | A real provider answer uses a unique fact found only in an attached synthetic document, preserves its uncertainty label, and shows its source. Save/edit/reopen the memo after reload, with capsule/conversation/source lineage intact. A separate narrative task distinguishes actor framing from established evidence. |
| 3. Build, review, attach, reuse | Treat capsule creation as an independent workflow from chat. Preserve intake and retry states, review decisions, and source identity. | Real TXT/PDF/DOCX intake plus notes/conversation handoff yields inspectable proposals. Reject one and approve another with a reason; reload preserves decisions. Attachment updates the workspace pointer without rewriting capsule source/document refs or version. A later real Ask recalls the accepted context. Failed intake/save leaves a recoverable draft. |
| 4. Durable agent work and accurate receipts | Existing runs reached saved memos while retaining zero-source metadata or missing uploaded-document evidence. Status and source counts must describe completed work. | Owner approval → real retrieval → saved memo produces substantive citation text, nonzero uploaded-document evidence when attached, consistent completed-run receipts, and a visible saved product. Cancel/retry/late responses cannot report the wrong run. A healthy worker endpoint alone does not pass. |
| 5. Simple UX and maintainable documentation | Keep the core workflows easy to find; correct contradictory navigation and storage claims; select new tools only against measured gaps. | Desktop/mobile users can find Ask, attach saved context, build context, review proposals, and continue writing without a new primary page. Current behavior, target architecture, and dated receipts are distinguishable. Focused fixes reuse existing services and avoid adding another runtime/store. Research names a concrete benefit, evidence, cost, and integration boundary before adoption. |

## Coordination and simplicity rules

- The main coordinator owns integration and the final production verdict.
  Workers have explicit file ownership; reviewers inspect source and evidence.
  Preserve existing user changes and other workers' edits.
- Keep auth/cache repairs, builder/reuse repairs, provider/output repairs, and
  docs/research work independent until their source seams meet. Review the
  cache isolation patch before merging it into the shared validation result.
- `tasklet-praxis-workbench.tsx` exceeds 12,000 lines. Extract small helpers
  around behavior being repaired; broad component rewrites would enlarge this
  release without proving either user workflow.
- Firestore currently supplies owner-scoped uploaded-document/chunk reads;
  SQL mirroring is optional. Cloud SQL/pgvector remains the retrieval target
  until its cutover is proven. Keep canonical capsules and approved promotion
  paths intact; graph/memory enrichment remains derived and reviewable.
- Use `tacitus.me` for audience, clarity, restrained visual tone, and examples.
  Do not import a new information architecture merely to mimic its marketing.
- Research current official APIs and maintained GitHub projects for concrete
  defects in ingestion, evidence, durable execution, and inspection. Prefer
  improvements to the existing Firebase/Google Cloud/Vertex/Genkit/ADK stack;
  avoid installing a framework merely because it is newer.

## Verification and reporting contract

Use the narrowest meaningful regression tests during repairs. Before a ship
checkpoint, satisfy the repository's build, typecheck, lint, audit, dependency,
and test requirements. Treat tests that intercept model/history responses as
UI/race regressions; run a separate real-service canary for provider quality
and durable persistence. Keep both forms of evidence.

For each live acceptance gate, record UTC time, served commit/revision, browser
journey, synthetic private QA inputs, capsule/conversation/run/memo IDs as
applicable, screenshots or JSON receipts, and the actual result. Credentials
never belong in receipts. Unknown, skipped, and pending states remain explicit.

The final status should distinguish what works, what is missing, and what
requires another session. No claim of full production readiness is warranted
from health endpoints, local tests, historical receipts, or mocked answers.

## Continuation prompts

| Remaining lane | Copy-ready instruction |
| --- | --- |
| Live user proof | “Verify the currently served PRAXIS revision with real Firebase login, Ask with an attached synthetic capsule, save/edit/reopen writing, and separate TXT/PDF/DOCX capsule build/review/reuse. Keep mocks and real provider evidence separate.” |
| Agent output proof | “Complete owner-approved research on the deployed revision using an uploaded synthetic document and current web sources. Inspect source text, completed read receipts, saved memo lineage, and the visible product; record every unresolved gate.” |
| Maintainability | “Simplify the behavior just repaired through small shared helpers and align canonical docs to verified source. Preserve existing cockpit navigation and owner-scoped stores; do not replace the runtime without an evidenced need.” |
