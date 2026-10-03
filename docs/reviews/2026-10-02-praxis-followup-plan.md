# PRAXIS local follow-up: evidence map and execution contract

Evidence date: 2026-10-02. Candidate path: `C:\Users\giuli\output\praxis-workspace-local-20261002`.
Branch: `build/praxis-followup-20261002`; base/HEAD before local edits: `97c54994cc6248fef5bad25909f4ad5a967b879a`.
Remote verified: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`.
The dirty primary checkout and other worktrees remain separate. No follow-up commit, push, merge or publication is authorized by the follow-up file.

## Baseline and scope

The earlier [local candidate](2026-10-02-praxis-workspace-local-candidate.md) and [publication receipt](2026-10-02-praxis-workspace-publication.md) are historical evidence. The publication receipt supersedes the earlier expired-auth release blocker. It does not prove this follow-up's authenticated journey, model fidelity or portable semantics.

| Capability at follow-up start | Real implementation and records | Acceptance boundary |
| --- | --- | --- |
| Login/session | `/login`, `/api/auth/session`, `auth-context.tsx`, `current-token.ts`, `with-auth.ts`; signed HttpOnly cookie, Firebase identity and `users/{uid}` | Existing controlled contracts pass; raw question URLs leak. Genuine local emulator path absent. |
| Source intake | Builder, document upload/intake APIs, owner situation documents, extraction/receipts | Existing TXT/PDF/DOCX implementation; this run must not count purpose-only or supplied text as extraction acceptance. |
| Capsule proposal/review/save | `/api/context/capsules`, review cards/audits; `users/{uid}/capsules/{id}`; `capsule-builder-draft.ts`, `capsule-service.ts` | Existing author preferences and proposals; complete semantic correction UI remains partial. |
| Version/library/reuse | Numeric `versions/vN`, exact resolver, capsule library/search and fork/combine | Historical snapshots mergeable; some semantic fields lost by copy/bump. Project hashes detect drift but do not make history immutable. |
| Conversations | Owner conversation and Ask thread stores, `/api/conversations`, `/api/ai/chat` | Preserved; project links incomplete. |
| Projects | `/app/projects`, `/api/projects`, detail API; `users/{uid}/projects/{id}`, `revisions/rN` | Real private scope/context/draft assignment persistence implemented. Existing browser tests mock backend/auth. |
| Execution | AgentRun Postgres ledger, Cloud Tasks, dispatch/execute/retry/cancel/approvals/stream, execution lease | Durable backend exists. Project dispatch is absent. Research-memo evidence path ignores captured version. |
| Artifact editing/review | Owner situation memos/versions, `memo-service.ts`, Memo artifact editor and human review panel | Exact-body approval exists; client base version absent from saves and unsigned final labels can survive reads. |
| Export | Work-product DOCX/PDF; reviewed saved memo Markdown/DOCX | Genuine files exist; memo review export currently lacks PDF. Saved-version and full evidence appendix acceptance still incomplete. |
| Team authorization | Server-derived uid, owner-scoped stores/rules | Private project isolation; real collaborator role enforcement not implemented. Do not expose team invites/shared library promises. |
| Portability | `.core`, Capsule+ ZIP, DIALECTICA proposal import, memo handover | Shell/reference paths exist. Capsule+ semantic row persistence and isolated semantic round trip remain partial. |

## Smallest architecture and data contracts

Keep Firestore capsules/projects/memos and Postgres AgentRun ledger. No new provider, framework, database or worker engine. Capsule envelope schema 3, nested V3 projection, numeric content revision and legacy `capsule/v2` semver are different dimensions. User/Situation/Tool/Output are content roles; workspace scope and chat attachment role are different fields and grant no access.

1. Temporary question continuity: opaque UUID in a sanitized return URL, same-tab sessionStorage text, 30-minute logical expiry, explicit account claim. Claimed text requires matching uid. It is not canonical persistence or server authorization. Storage failure retains visible text and prevents navigation. Restoration never replaces a nonempty draft. Browser opener copying and shared-device local access are exposure limits; use a separate browser profile for confidential work. Expired bytes are lazily removed when accessed or when the tab closes, not by a guaranteed background erasure process. Historical logs are not purged by this change.
2. Owned Ask draft: account/thread-keyed temporary session record; no anonymous fallback on session expiry. Saved conversations remain server-owned.
3. Local acceptance: explicit `demo-praxis-local`, matching loopback Auth/Firestore endpoints, no credential reads, no public REST identity fallback, no Cloud Run identity. External execution/intake integrations unavailable; do not infer paid-provider authorization. Separate Next build output protects the existing dev server.
4. Memo save: API requires nullable `expectedVersionId` (null means create-only) and stable `operationId`. Transaction checks caller base/current root and existing version, with a digest-bound replay receipt. Internal trusted workers retain their existing optional version contract. Old operation records without digests remain compatible; they cannot establish the new digest guarantee retroactively. Edited versions clear human approval; loaded final status requires a valid signed body/version-bound approval.
5. Worker: resolve the server-captured capsule version before research-memo work and pass it to evidence retrieval. Mismatched evidence fails; never select latest as a fallback. Unsaved v0 is not a saved evidence snapshot for this path.

These are additive contracts; no production migration or new collection is necessary for these slices. Rollback: revert the code changes and stop only the local harness processes. Existing memo/version fields remain readable. Do not rewrite historical records to manufacture valid approval or digests.

## Responsibility map

| Responsibility | Existing boundary | Smallest remaining repair |
| --- | --- | --- |
| Evidence | Document/source receipts, source spine, evidence packs | Exact source versions/hashes and resolvable span completeness across extraction/import/export |
| Claims | V3 claim ledger and review cards | Qualified semantic editing and support/contradiction preservation |
| SituationGraph | Embedded graph and owner situation/project scope | Actor disambiguation and reviewed relationship edits |
| Temporal | Temporality, source metadata, project cutoff | Keep publication/event/effective/retrieval times distinct through extraction |
| Ontology | Bindings, controlled vocabularies and V3 schemas | Validated semantic diff and reviewed changes |
| Reasoning | Reasoning scaffold, workflow plan and concise receipts | Visible assumptions/method/alternatives without hidden model reasoning |
| Memory | Owner capsule/project/conversation/memo stores | Dependable semantic reuse and correction propagation |
| Governance | Owner authorization, human review, access policy | Direct publication/reuse gates, revocation/expiry and collaborator roles |
| Runtime | AgentRun ledger, Cloud Tasks and execution lease | Project-to-run bridge plus cross-store artifact-link reconciliation |

## Ordered restartable work

1. Finish and test auth URL privacy/recovery, including actual browser interruption paths.
2. Real emulator login → purpose-only capsule create/edit → project/pin/assignment → refresh/relogin; outsider/rules/revocation checks. Preserve mocked test labels.
3. Capsule transaction writer: conditional immutable snapshots for every writer; caller revision conflicts; deep fork/combine/clone with origin reviews retained as history, private quarantine and current publication/reuse gates. Then semantic proposal editor using existing review-card contract. Do not expose arbitrary privileged PATCH.
4. Memo caller concurrency and signed review labels; pinned research-memo evidence; project dispatch bridge into the existing ledger, no parallel queue. Persist authorized project/run/artifact links before success, and reconcile already-saved memos without regeneration.
5. Saved-version evidence appendix/Word/PDF export; full Capsule+ proposed semantic persistence and isolated reader round trip; source-version → claim/capsule/run/artifact stale review propagation.
6. Provider evaluation requires separate dataset/provider/run-plan/spend-cap approval. Practitioner usefulness, latency/cost comparison and customer-pilot acceptance remain pending.

Auth/Firestore proves no Postgres/Cloud Tasks recovery and no model behavior. Java/tooling, SQL/runtime prerequisites and unrun document rendering must be reported separately from authorization blockers. Final evidence belongs in a dated follow-up receipt with exact commands and counts.
