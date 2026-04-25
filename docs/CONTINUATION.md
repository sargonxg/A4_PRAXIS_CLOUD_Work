# PRAXIS by TACITUS — Next Codex Session Handoff

Use this file to resume in a fresh `codex --full-auto` session.

## Project

- Product: **PRAXIS by TACITUS**
- Positioning: AI-native workspace for **policy, diplomacy, and political analysis**
- Domain: `https://praxis.tacitus.me`
- Repository: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work`
- Local path used this session: `C:\Users\giuli\A4_PRAXIS_CLOUD_Work`
- GCP project ID: `praxisbytacitus`
- GCP project number: `852128226674`
- Default region: `us-central1`
- Firebase project: `praxisbytacitus`
- Active local GCP/Firebase account verified this session: `giulio@tacitus.me`

## Firebase Web Config

The public Firebase client config is already known and safe to keep in build env:

```ts
const firebaseConfig = {
  apiKey: "AIzaSyAHNn4zJdMaxJXziRNa9SmHRFKUvO1q9uA",
  authDomain: "praxisbytacitus.firebaseapp.com",
  projectId: "praxisbytacitus",
  storageBucket: "praxisbytacitus.firebasestorage.app",
  messagingSenderId: "852128226674",
  appId: "1:852128226674:web:535f771c7a3568462c11eb",
  measurementId: "G-7R44KT7CDY"
};
```

Do not paste private service-account JSON or Secret Manager values into chat.

## Auth Status Verified

- `gcloud config list --format=json` showed account `giulio@tacitus.me`, project `praxisbytacitus`, region `us-central1`.
- `gcloud projects describe praxisbytacitus --format=json` succeeded.
- `firebase login:list --json` succeeded for `giulio@tacitus.me`.
- Future sessions should avoid printing token-bearing Firebase JSON.

## What Was Done In The Last Session

- Cloned the repo into `C:\Users\giuli\A4_PRAXIS_CLOUD_Work`.
- Installed npm dependencies with `npm install`.
- Repositioned PRAXIS branding toward policy, diplomacy, and political analysis while keeping `by TACITUS`.
- Reworked public pricing language away from per-tool credits toward monthly workspaces and plan usage buckets.
- Removed public per-tool cost UI from the pricing page, landing teaser, methodology panel, and several tool pages.
- Deleted unused `src/components/shared/credit-cost-badge.tsx`; no imports were found before deletion.
- Fixed missing server credit key `ai_deep_think`, which affected deep-think routes such as scenarios, SAT, Concordia, Treaty Analyzer, Deep Research, and Deep Search Agent.
- Improved `withCalibration` to infer `situationId` from either `body.situationId` or nested `body.situation.id`, and added an optional extractor hook for route-specific body shapes.
- Persisted more situation onboarding choices:
  - initial risk score
  - Glasl stage
  - escalation trend
  - selected source categories
  - source category order
  - custom sources
- Fixed Stripe checkout request mismatch by accepting either `tierId` or `planId`.
- Updated tests to match new pricing shape.

## Validation State

Passed:

```bash
npx tsc --noEmit
npx vitest run src/__tests__/auth-security.test.ts
```

Known validation issues not caused by this session:

- `npm run lint` fails with many existing React Compiler / lint errors across the app.
- Examples include `react-hooks/set-state-in-effect`, `react-hooks/static-components`, `no-require-imports`, `no-explicit-any`, and unescaped entities.
- Do not treat lint as a clean deploy gate until those pre-existing errors are addressed.

Security / dependency note:

- `npm install` reported 31 vulnerabilities, including 1 critical.
- Do not run `npm audit fix --force` blindly. Do a targeted audit and upgrade plan.

## Do Not Deploy Yet Until

Before deploying to `praxis.tacitus.me`, the next session should run:

```bash
npx tsc --noEmit
npm run build
node scripts/audit-ai-routes.mjs
npm run audit:gcp
```

If those pass, deploy with:

```bash
gcloud config set project praxisbytacitus
gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus
```

Then verify:

```bash
curl -sI https://praxis.tacitus.me/
curl -sI https://praxis.tacitus.me/login
curl -sI https://praxis.tacitus.me/onboarding
curl -s https://praxis.tacitus.me/api/health
```

## Immediate Next Tasks

1. Run `npm run build` and fix any build-only failures.
2. Run `npm audit --omit=dev` and identify the critical production vulnerability.
3. Update `README.md` and `CLAUDE.md` so version, tool count, route count, pricing model, and Cloud Run deployment language agree.
4. Finish removing user-facing “credits” language from remaining app surfaces where appropriate, while keeping internal metering for abuse/cost control.
5. Validate all route credit keys used by `withCalibration` exist in `AI_CREDIT_COSTS`.
6. Add an automated script that checks tool-registry IDs, route `withCalibration()` IDs, and credit keys for consistency.
7. Fix demo CTAs to route through `/login?mode=demo` or a dedicated demo-start endpoint, never directly to `/demo/dashboard` without a cookie.
8. Improve user onboarding state refresh so client guards update immediately after onboarding completion.
9. Version profile edits after onboarding: bump profile version, write immutable snapshot, and publish profile event.
10. Persist situation version/provenance so saved tool outputs know which situation snapshot produced them.

## Weekly Ship Plan

### Day 1 — Deployability And Safety

- Run build and Cloud Run local/container checks.
- Fix build failures.
- Run GCP audit and reconcile missing services/env vars.
- Audit npm vulnerabilities and apply targeted safe upgrades.
- Confirm Firebase Auth, Firestore, Storage, Vertex, BigQuery, Pub/Sub, Secret Manager, Cloud Run services.

### Day 2 — Docs And Agent Compatibility

- Rewrite `README.md`, `CLAUDE.md`, `docs/AUTH.md`, and deployment docs.
- Preserve Claude Code / Codex compatibility with clear setup, scripts, env vars, route conventions, and known blockers.
- Archive or delete stale root docs only after reference checks:
  - `praxis agent pack`
  - `Skill.md`
  - `AUDIT_REPORT.md`
  - obsolete docs under `docs/superpowers` if no longer needed operationally.

### Day 3 — Pricing, Plans, Entitlements

- Introduce an explicit entitlement model separate from internal credits.
- Keep internal credits as invisible metering.
- Add plan gating for premium connectors and heavy workflows.
- Fix Stripe webhook/checkout plan naming and monthly subscription semantics.

### Day 4 — Onboarding And Situation Creation

- Make user onboarding fully reactive and versioned.
- Improve situation onboarding with canonical entity pre-check and source coverage.
- Add “create from database/template” for repeatable tests.
- Store selected data backend preferences per user/situation.

### Day 5 — Tool Contract Hardening

- Ensure every tool has:
  - specific route
  - schema
  - provenance
  - stale window
  - source/data health states
  - missing evidence behavior
  - saved output with profile and situation version
- Replace remaining generic chat calls for specialized tools.

### Day 6 — Graph Architecture

- Unify the graph storage contract. Current fragmentation:
  - backend snapshot: `graph/snapshot`
  - frontend array doc: `graph/main`
  - SKC subcollections: `graph/main/nodes` and `graph/main/edges`
- Choose one canonical Firestore graph shape and migrate readers/writers.
- Integrate backend graph adapters consistently:
  - Firestore baseline
  - FalkorDB optional
  - Neo4j optional
  - Spanner Graph recommended GCP-native production path
  - TrustGraph optional sidecar, not core dependency yet

### Day 7 — MCP And Agentic Operations

- Add PRAXIS MCP server skeleton with auth and situation-level permission checks.
- Candidate MCP tools:
  - `list_situations`
  - `get_situation_context`
  - `query_conflict_graph`
  - `canonicalize_entity`
  - `run_praxis_tool`
  - `trace_claim`
  - `generate_brief`
- Add operational runbooks for agentic maintenance.

## Key Architecture Risks Found

- Graph storage is fragmented across incompatible Firestore shapes.
- Spanner adapter exists in backend but is not fully integrated into the main pipeline.
- FalkorDB adapter is partial.
- TypeScript SKC graph layer only supports Firestore/Neo4j, while settings UI exposes Spanner/Falkor.
- Cloud Tasks queues are provisioned but no app code enqueues tasks.
- `profile.events` Pub/Sub publisher exists, but subscriber/worker path needs verification.
- GDELT worker appears to call a stale endpoint.
- BigQuery setup schema and Python insert schema appear mismatched.
- MCP and TrustGraph are not implemented yet.

## Recommended First Prompt For The New Session

```text
Continue PRAXIS by TACITUS from C:\Users\giuli\A4_PRAXIS_CLOUD_Work.
Read docs/CONTINUATION.md, CHANGELOG.md, README.md, CLAUDE.md.
Use gcloud project praxisbytacitus and Firebase project praxisbytacitus.
First, inspect git status and latest commit. Then run npx tsc --noEmit and npm run build.
Do not deploy until build passes. After build passes, run npm run audit:gcp and node scripts/audit-ai-routes.mjs.
Then prepare a safe Cloud Run deploy to praxis.tacitus.me via gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus.
After deploy, verify /, /login, /onboarding, and /api/health.
Priority after deploy: docs consistency, entitlement model, onboarding state/versioning, tool-contract consistency, graph storage unification, then MCP.
```
