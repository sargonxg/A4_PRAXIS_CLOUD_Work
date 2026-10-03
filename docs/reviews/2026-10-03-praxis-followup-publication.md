# PRAXIS follow-up publication — 3 October 2026 UTC

Published the verified follow-up changes following Giulio's explicit request to publish the work completed so far. This supersedes the local candidate's publication status only; the broader agentic milestone remains incomplete.

## Identity

- Public application: https://praxis.tacitus.me/
- Projects: https://praxis.tacitus.me/app/projects
- Repository: `sargonxg/A4_PRAXIS_CLOUD_Work`.
- Release branch: `release/praxis-followup-20261003`; original candidate branch `build/praxis-followup-20261002` and its uncommitted work remain intact.
- Base: `97c54994cc6248fef5bad25909f4ad5a967b879a`; fetched `origin/main` remained `8ff509b877f1dcd2b3ed6d074d2d5e96e3f9b923`.
- Application commit: 74b0260c35c24c352e107e772c3f02a826e31c11.
- Cloud Build: 696047d2-e532-46a0-8c45-06f8cc846046.
- Cloud Run: `praxisbytacitus` / `us-central1` / `praxis-frontend`, revision praxis-frontend-01105-nov.
- Resolved image digest: sha256:ff78f110b88ccce32d391e02053079e0c996da0cf513dd60be313277e16c44f6.
- Final traffic/configuration observation: 100% pinned to the verified revision at 2026-10-03T03:22:26Z; before/staged/after configuration and IAM comparisons passed with zero unexpected differences. Routing deliberately pins the verified revision rather than allowing a concurrently deployed latest revision to receive traffic; later publication must explicitly update traffic.

Application source was released from the new isolated checkout `C:\Users\giuli\output\praxis-followup-release-20261003`. The original candidate, other worktrees, inherited edits and port 3102 / PID 15776 were preserved. The source manifest and clean release commit identify the candidate; HEAD of the uncommitted original alone does not. No main merge/push occurred. The application diff from the candidate base covers 80 files, 2,271 insertions and 393 deletions; the publication receipt is a separate documentation commit and does not change the served application SHA.

## What this release changes

- Questions no longer travel as raw text in new sign-in URLs. A same-tab opaque reference supports explicit recovery; scoped drafts and failure handling preserve newer work and account boundaries.
- Project inventory has honest loading/error states and late-response protection. Existing private projects/context pins/draft assignments remain available.
- Memo saves use a client base version and digest-bound operation replay; conflicts retain edits. Changed content clears human approval, and legacy unsigned final labels downgrade on read.
- The research-memo evidence lookup validates the captured exact capsule version instead of silently using latest.
- Selected-version Markdown/DOCX exports retain recorded evidence IDs, source versions/hashes/dates/language/rights/anchors and review scope. General source text remains reference-only; unsafe/credential-bearing/oversized locators are explicitly withheld.
- A narrow Busboy 3.2.1 override addresses the two identified multipart DoS advisories. Official upstream metadata and MIT license were reviewed; the installed local parser's edge cases were regression-tested.
- Guarded local Firebase emulator tooling enables genuine isolated authentication/persistence tests. The production build does not enable or mount it, and the source upload excludes local account/data snapshots and emulator launch configuration.

The staged screenshot caught an additional recovery-card bug: two absent IDs compared equal and falsely offered anonymous users a saved question. An explicit nonempty recovery-record guard fixes it. The regression failed before the fix (1 failed / 17 passed) and passed afterward (18 passed); a read-only reviewer checked the correction. The unmounted legacy standalone MemoDesk still lacks saved-base hydration after reopen and would return a safe 409 if reintroduced. The exposed Tasklet memo editor hydrates and validates its base; this release does not expose the legacy component.

No production migration was required. Older cached memo clients need to refresh before saving under the new API contract. Conflicts must not be resolved by submitting a guessed latest version. Existing records, historic versions and signed review history remain readable; a receipt is not a truth certificate.

## Deployment scope and rollback

The main-only triggers were inspected. The standard `deploy:frontend:main-safe` command requires main equality and uses the broader legacy configuration, so this release reused the documented scoped Cloud Build path in [the release configuration](2026-10-03-praxis-followup-cloudbuild.yaml). Only the image, ten exact release-provenance environment fields, four release labels, a staging tag and staged/final routing changed.

There was no rules publication, IAM grant, secret update, credential repair, service-account change, production feature-flag change, billing enablement, erasure enablement, source/customer ingestion, production account creation, task dispatch or model generation. Non-release runtime configuration and IAM fingerprints are compared before/staged/after. Paid checkout and account erasure remain disabled. The container still uses the existing `npm install --ignore-scripts --legacy-peer-deps` path; dependency resolution is not claimed byte-identical to local Windows validation.

Source upload used the existing ignore rules plus an external file excluding worktree `.git` pointers, all `.env*`, local output, emulator launch configuration and tooling. The official installed Cloud SDK ignore implementation generated the inspected inventory. No credentials or synthetic Auth/Firestore exports entered the archive.

Rollback, prepared but not exercised:

```powershell
gcloud run services update-traffic praxis-frontend --project=praxisbytacitus --region=us-central1 --to-revisions=praxis-frontend-01102-piy=100
```

Verify `/api/health/runtime` returns historical application source `cfe8e481bafcef2e9c66371e28b985d4f52a3bd4`. This pins the former revision rather than deleting the new source or changing data. Returning to LATEST routing is a separate repair decision.

## Verification

Final corrected application source passed lint (six tracked warnings), TypeScript, **454 test files / 2,699 tests**, and the aggregate gate including production build, route, capsule, architecture/reference/repository, GCP and simplification audits. AST-only Graphify updated without paid calls. Results and logs are archived in the release checkout at `output/release-validation` and `output/release-build-repair`.

The first final aggregate attempt failed because Turbopack rejects a `node_modules` junction outside its filesystem root. The owned release junction was preserved outside the source archive; a real release dependency directory was populated with local file hardlinks without modifying installed packages or downloading dependencies. The complete aggregate gate then passed at `2026-10-03T03:11:20.0834504Z`. Both receipts remain available. The runner restored 64/64 inherited artifacts on the first run and 70/70 on the repaired run, with zero differing files.

`npm audit --omit=dev --json` remains **failed**, exit 1: **47 findings (3 low, 44 moderate, 0 high, 0 critical)**. These findings are retained as dependency debt, not relabeled a complete audit pass. The full repository E2E suite, complete accessibility/keyboard audit and all-page visual Word/PDF rendering were not run. The earlier real local emulator persistence/relogin/restoration journey remains dated evidence; the final recovery-card change was checked by component regressions and fresh anonymous live browser checks.

Fresh corrected staged and public-domain browser runs passed: six read-only HTTP assertions each; landing/login 200; protected projects redirect to login; projects/AgentRun APIs 401 without a session; exact source commit and seven healthy runtime checks. Public `/api/health` also returned 200. Desktop 1440, tablet 768 and mobile 375 screenshots were captured with reduced motion and no horizontal document overflow. The corrected recovery panel was absent when no handoff existed. Enter submitted a same-tab synthetic question to an opaque login handoff; Back/refresh retained its text, with no question/raw prompt in observed URLs.

Both runs recorded zero console errors, uncaught page errors, real transport failures or HTTP error responses. The staged run retained 18 cancelled navigation-prefetch requests and the public run retained 16; all were exact `net::ERR_ABORTED` `_rsc` requests. Desktop/mobile/login staged screenshots and desktop/tablet/mobile public screenshots were inspected; fresh images reside in `corrected-staged-browser` and `public-browser` under the local evidence directory. No automated screenshot-baseline comparison, comprehensive accessibility assessment or Web Vitals budget is claimed. These checks used isolated anonymous sessions and no account/task/model/data mutations.

The initial image at `81a22fb5e68acc84b2cc9b950c7d9f47967e43b6` built successfully and remained staged only. Its first anonymous HTTP/browser assertions passed but screenshot inspection found the phantom recovery card. A second browser run timed out waiting 90 seconds for global network idle; its failure receipt is retained. The final harness waits for the actual usable controls, checks absence of a false recovery offer, and tests recovery after Back/refresh. It records HTTP errors and distinguishes exact navigation-cancelled `_rsc` prefetches from genuine transport failures; it does not conceal either category. Initial staged screenshots are historical and are not presented as final release screenshots.

Anonymous health checks include read-only dependency probes. They establish source/revision/build and operational observations, not model fidelity, worker execution, authenticated customer persistence or analyst usefulness. The genuine local emulator journey and restore tests from the [local candidate receipt](2026-10-02-praxis-followup-local-candidate.md) remain separate evidence. No state-changing live canary or paid call was run.

## Remaining work and evidence location

Still incomplete: semantic capsule editing and immutable writes across every writer; full fork/combine/clone semantics; project→AgentRun→artifact linkage/reconciliation; source-change review invalidation; complete semantic portable import and isolated reader; genuine team roles/revocation; reviewed-memo PDF; all-page visual DOCX/PDF QA; real-model fidelity and practitioner assessment. Projects still hold draft/cancelled assignments and do not dispatch agents. No second generated deliverable or complete first agentic milestone is claimed. Historical September 30 generation failures remain unresolved without current actual-generation evidence.

Local release evidence is under `C:\Users\giuli\output\praxis-workspace-local-20261002\output\releases\followup-20261003`: source manifests, scoped commits/diffs/push receipt, initial/corrected build metadata, upload inventory, before/staged/after fingerprints, browser failures and fresh final screenshots, public verification and traffic receipt. The [harness runbook](../runbooks/PRAXIS_LOCAL_PERSISTENCE_HARNESS.md) and local candidate handover contain exact reproduction and ordered next steps. No website repo or commercial commitment was changed by this release.
