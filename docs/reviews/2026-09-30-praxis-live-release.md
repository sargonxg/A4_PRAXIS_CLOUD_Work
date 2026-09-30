# PRAXIS refinement release — September 30, 2026

Status: initial refinement release live; onboarding and framework security corrections are undergoing release validation. Complete real-service acceptance remains in progress.

This record covers source `2441af6ccecc343d7201ef31e75993c32422128c`, separately from the [previous acceptance](2026-09-29-praxis-production-acceptance.md). The user approved implementation and production deployment. Home and Capsules remain the visible product; Firestore ContextCapsules own user context and PostgreSQL/Cloud Tasks own durable execution.

## Delivered application changes

- Safer session validation, question/redirect continuity, onboarding and account-switch masking; server-owned one-time funded signup allowance.
- Purpose → Material → Review/save capsule creation, owner-scoped recovery, explicit persistence scope, and current-snapshot Save and use.
- Private/starter/archive library distinctions, honest completeness, pagination/filtering and owner-scoped lifecycle actions.
- Selected-document retrieval before ranking; bounded TXT/PDF/DOCX ingestion with durable indexing checkpoints and retained original-source lineage.
- Economical, balanced and complex-task routing with bounded fallback and actual executed model/provider receipts.
- Inspectable original source passages separated from generated grounding; stale review conflicts rejected; saved memo approval bound to exact body/version, intended use and limitations.
- Server-validated reviewed Markdown/Word export; memo editing invalidates approval. Word exports preserve paragraph text; native heading/table/link formatting remains a separate improvement.
- SQL execution leases, conditional transitions, generation checkpoints and stable artifact operation IDs. Cross-store effects are not universally atomic or exactly once.
- Updated user guide, synthetic worked policy example, truthful beta/pricing/legal language, architecture/product map, evaluation runner and [80-recommendation analysis](2026-09-30-praxis-improvement-analysis.md).

## Local and remote validation

Local frozen-source validation: 426 Vitest files / 2,162 tests passed; production build and TypeScript passed; full lint had zero errors and five existing warnings. Dependency audit reported 44 moderate and three low findings, zero high/critical. Application route, capsule, agent, architecture, surface and simplification audits passed; static runtime deep-preship reported 140 PASS / two WARN / zero BLOCKED.

Local browser fixtures passed Ask/auth, writing/review, builder/library and responsive public checks. Their APIs were mocked; they do not establish provider, database or session behavior. GitHub `verify-main` run `36742427165` passed for the release source. Production evidence is recorded separately below.

Local Google operator credentials expired. Cloud Build must independently pass its resource preflight. Existing operator environment/secrets are preserved by update flags; account erasure remains explicitly disabled.

The onboarding correction passed all 426 test files / 2,171 tests, production build/typecheck, zero-error lint and the existing audit gate. A fresh dependency check then detected today's critical Next.js advisory [GHSA-vcvr-r3jv-pc5j](https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j). The correction includes the smallest compatible patch: Next.js and eslint-config-next 16.3.6. The new audit reports 44 moderate / three low / zero high / zero critical findings. The app's sole `next/og` ImageResponse renders static branding with no observed user-input data flow; that inspection is not an exploit test.

Final patched-source gate: **426 files / 2,174 tests passed**, zero failures/skips (`security-patch-vitest-final.json`), production build/typecheck passed and full lint retained zero errors / five existing warnings. An earlier full run skipped two route-audit assertions after suite setup failed while graph refresh overlapped; its isolated rerun and the subsequent complete run both passed. Records are retained rather than replaced. Route/repository/architecture checks passed, the graph update completed, and the nine Rules-release tests plus independent source review passed. Rules denial receipts now retain only bounded identifiers/numeric codes, never raw error messages or credentials. Exact-source production acceptance remains pending.

## Production acceptance

Initial release `2441af6ccecc343d7201ef31e75993c32422128c` is served as `praxis-frontend-01083-hls`, build `c1d042d7-1c6c-4e65-90af-62c432af6bd5`. Both GitHub checks and all nine Cloud Build steps passed. The real cloud preflight reported zero hard failures and one Scheduler warning; all seven runtime checks were healthy. Five public pages passed real-browser checks at 320 and 1440 pixels: ten renders, zero document overflow and zero page exceptions (`public-live.json`).

The original canary had exhausted its 1,000-token allowance (balance zero; total used 1,000), correctly returning a nonretryable 429. A fresh funded QA account passed real login, library filters, private notes capsule creation, current-version Save and use, actual Vertex answer with saved/reloaded history, exact-body internal review, Markdown and Word downloads, edit invalidation and mobile layouts. Another new account received 1,000 tokens through server initialization. These are partial checks, not a passed overall fresh-account journey.

Full onboarding exposed a production navigation defect: after a 200 completion response, the completed canonical profile and session were correct, but cached client navigation stayed on onboarding. A full document navigation reached `/app`. A separate early click could run before auth/profile readiness and produce no save request. The correction uses validated full navigation and owner-scoped readiness, responsive serialized field saves, bounded retry and stale-response masking. Independent review closed retry, account-switch summary and failed-section recovery findings; 36 focused tests passed. Its exact-source production acceptance is pending.

Firestore Rules publication failed on the initial release read with HTTP 403. No Rules writes occurred. Source publication, Storage guards and user-level propagation remain unverified; erasure stays disabled. Ordinary observed signup does not prove a global immutable 1,000-token bootstrap guarantee under legacy client rules.

Serial complete source, model, upload/review/reuse and queued-worker receipts must be reconciled here after the correction is served. Analytical quality remains a separate unscored/independent-review gate.

Evidence directory: `output/playwright/practical-refinement-20260930/` (ignored local receipts; no auth-state exports).

## Remaining product and operational gates

1. Configured paid checkout and a real sandbox purchase/webhook/entitlement/cancellation/refund lifecycle. Paid plans remain proposed until proven.
2. Firestore/Storage Rules propagation and deletion-state enforcement, external provider erasure, storage reconciliation and retained-record exceptions. Account erasure is disabled; existing signed URLs expire independently.
3. Independent analysts and representative users: measured capsule-versus-baseline quality, citation fidelity, task completion, revision burden and willingness to subscribe. Synthetic operational acceptance cannot establish these outcomes.
4. Backup restoration, concurrent-user/load/capacity and broader interrupted/cancelled cross-store recovery proof. Health checks and local fault tests have narrower claims.
5. Failed-run refund idempotency/workspace settlement, OCR/scanned-document support and native Word formatting.
6. Institutional SSO/roles/residency/private deployments and optional JEV or upstream DIALECTICA integrations retain their separate agreements and acceptance gates.

Rollback: preserve generated user work and redeploy a reviewed corrective commit or revert the application release through the existing main trigger. Rules changes require their own previous-ruleset receipt and scoped rollback; application rollback does not imply Rules rollback. Monitor runtime and key user journeys after any change.

The [implementation ledger](2026-09-30-praxis-implementation-ledger.md) maps every recommendation to implementation, evidence and remaining gates. Historical findings remain dated; live acceptance does not erase limitations or constitute an analytical-quality study.
