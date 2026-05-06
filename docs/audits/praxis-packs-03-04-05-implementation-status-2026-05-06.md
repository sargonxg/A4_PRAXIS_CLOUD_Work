# PRAXIS Packs 03-05 Implementation Status

Date: 2026-05-06
Repo: `C:\Users\giuli\praxiscodexworking`
Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`
Branch: `main` (local worktree, latest PRAXIS workbench/firewall pass)

## Pack 03 - Workbench Architecture

Implemented in this branch:

- Canonical `/app/workbench` case picker and `/app/workbench/[caseId]` active case route.
- Generic workbench tabs: `chapters`, `desk`, `context`, `library`, `research`, `graph`, `boardroom`, `draft`.
- Generic five-chapter flow: Situation Frame, Source Receipts, Conflict Graph, DIALECTICA Reasoning, Decision Product.
- `CaseModule` interface, registry, `syria-2026` example, `nordalia-2026` example, and server-side `loadUserCaseModule` scaffold.
- Legacy entry redirects for `/app`, `/app/dashboard`, `/app/cockpit`, `/app/syria-case`, `/app/demo-guide`, and `/demo`.
- Workbench audit script wired as `npm run audit:workbench`.
- `/app/*` route surface culled to 25 `page.tsx` files. The remaining authenticated routes are workbench, cases, situations/new, settings/profile, tools/archive, admin, and legacy dashboard/Syria redirects.
- `src/components/app/app-sidebar.tsx` rewritten to a 198-line shell focused on Workbench, My Cases, New Case, Settings, Profile, Sign out, and an explicit `?show_archive=1` archive.
- Deleted legacy tool URLs are aliased at the proxy/navigation layer into the matching workbench tab so archive links do not 404 after the route cull.

Still not complete from the full pack:

- Cross-user Firestore integration tests are not yet implemented as the full Firebase-user flow described in B7. The workbench keeps user-case loading behind the `loadUserCaseModule(uid, caseId)` boundary, and `audit:workbench` enforces the route/sidebar/shell contract.
- The full active-case-aware redirect behavior for every historical URL is represented by workbench aliases rather than a separate route file for each legacy surface, preserving the route cap.

## Pack 04 - Landing And Entry Rebuild

Implemented in this branch:

- Hero leads with the workbench and has one primary CTA to `/login`.
- Secondary hero action opens an example-case dialog instead of treating Syria as the product.
- Registry-backed `ExampleCasesGallery` renders available cases and planned placeholders.
- `SyriaCaseProof` is no longer imported by the landing page.
- Retired landing components moved into `src/components/landing/_archive/`.
- Landing JSON-LD describes PRAXIS as a workbench and lists multiple example cases.
- OpenGraph image copy now leads with the workbench, not Syria.
- Post-login redirect helper sends authenticated users to `/app/workbench` and demo users to `/app/workbench/<example>?tab=chapters`.
- Landing audit script tightened and wired as `npm run audit:landing`.
- The landing route keeps the workbench-first story: Syria appears only as one example case, not the product spine.
- The post-login redirect helper centralizes authenticated and demo entry into `/app/workbench`.

Still not complete from the full pack:

- Four additional example cases are visible as planned placeholders, not fully authored `CaseModule`s. Pack 03 currently ships real modules for `syria-2026` and `nordalia-2026`.
- Deployed Lighthouse and schema.org validator checks remain manual deployment follow-ups. Local Playwright smoke covers the hero modal and workbench entries.

## Pack 05 - Context Vs Tools Separation

Implemented in this branch:

- Workbench chapters visibly split Context (chapters 1-3) from Tools (chapters 4-5).
- Tools tabs use a context-health gate with a typed override requirement.
- `ContextHealthScore` pure scoring primitive added with the six requested dimensions.
- `/api/situations/[id]/context-health` added for score reads and persisted override audit-log writes.
- Four truth layers (`source`, `claim`, `evidence`, `verdict`) added in TypeScript, Python/Pydantic, JSON Schema, and human-readable schema docs.
- Dry-run truth-layer migration preview script added.
- Context-vs-tools audit script tightened and wired as `npm run audit:context-vs-tools`.
- Shared calibrated AI route boundary now invokes `withContextHealthGate` before credit execution and then runs `withFirewall` on successful JSON responses. Low-health non-demo requests receive a 412 with `X-Praxis-Safeguard: context_health_gate` unless a saved override hash is provided.
- Tool-gate UI requires a typed override justification and records the returned override hash for subsequent tool calls.
- Backend truth-layer service and dry-run migration scaffold are present for Source / Claim / Evidence / Verdict parity.
- `src/lib/api/with-firewall.ts` now extracts claim-like output fields, classifies sourced/inferred/unverified claims, attaches a firewall report to JSON responses, and emits `X-Praxis-Firewall-*` headers.
- Claim-level Trust Score persistence is implemented at `users/{uid}/situations/{situationId}/claims/{claimId}` through `src/lib/firebase/claims-service.ts`, with collection-group Firestore indexes and unit tests.
- Neo4j drift verification is implemented in `src/lib/graph/neo4j-drift-verifier.ts`, exposed through `scripts/verify-neo4j-sync.ts`, protected by `/api/cron/verify-neo4j-sync`, scheduled by `infrastructure/scheduler/neo4j-drift-verifier-cron.yaml`, and included in `audit:gate`.
- Four persona Playwright flows now cover diplomat, mediator, analyst, and researcher paths through the unified example workbench.
- `audit:context-vs-tools` now checks the firewall verifier, claim persistence, claim indexes, drift verifier, drift cron route/scheduler, and persona specs.

Known operating boundary:

- Streamed responses are still routed through the shared firewall boundary and receive firewall headers, but claim extraction is applied to JSON responses where claims are inspectable before the response body is returned. Inline token-by-token claim annotation remains a later product enhancement, not a missing route wrapper.

## Validation Used

- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run audit:routes`
- `npm run audit:gcp`
- `npm run audit:workbench`
- `npm run audit:landing`
- `npm run audit:context-vs-tools`
- `npm run verify:neo4j-sync`
- `npx vitest run`
- `npx vitest run tests/unit/lib/api/with-firewall.test.ts tests/unit/lib/firebase/claims-service.test.ts tests/unit/lib/graph/neo4j-drift-verifier.test.ts`
- `PLAYWRIGHT_BASE_URL=http://localhost:3011 npx playwright test tests/e2e/landing.spec.ts`
- `PLAYWRIGHT_BASE_URL=http://localhost:3011 npx playwright test tests/e2e/personas`
- Browser smoke of `/`, `/app`, `/app/workbench/syria-2026?tab=chapters`, and `/app/workbench/nordalia-2026?tab=chapters`

This document is intentionally explicit about the current operating boundary so the branch does not overstate token-level streaming annotation while still confirming the shared route wrapper, claim persistence, drift verifier, and persona flows are coded and audited.
