# PRAXIS Product Documentation Index

Date: 2026-05-15  
Status: canonical index for the current app structure

## Read These First

1. [`PRAXIS_CANONICAL_APP_STRUCTURE.md`](./PRAXIS_CANONICAL_APP_STRUCTURE.md)
   - Main source of truth for what `praxis.tacitus.me` is becoming.
   - Defines the ContextCapsule-native app spine, Google Cloud runtime,
     Firestore/Cloud SQL state boundary, first agents, governance, and build
     waves.
2. [`TASKLET_STYLE_PRAXIS_AGENT_RUNTIME_PLAN.md`](./TASKLET_STYLE_PRAXIS_AGENT_RUNTIME_PLAN.md)
   - Implementation plan for the Tasklet-style PRAXIS runtime.
   - Explains what to copy from Tasklet's product class and what not to copy.
3. [`CONTEXT_CAPSULE_PRODUCT_REBUILD_PLAN.md`](./CONTEXT_CAPSULE_PRODUCT_REBUILD_PLAN.md)
   - Product narrative and UX plan for ContextCapsules, landing, app shell,
     tool marketplace, handover, and capsule combination.
4. [`CONTEXT_CAPSULE_POLICY_RESEARCH_GUIDE.md`](./CONTEXT_CAPSULE_POLICY_RESEARCH_GUIDE.md)
   - Canonical guide for building policy/statecraft ContextCapsules.
   - Defines core anatomy, generic versus path-bound users, personas,
     combination rules, tools, connectors, outputs, and usable app shape.
5. [`TASKLET_RESEARCH_INTAKE_2026-05-15.md`](./TASKLET_RESEARCH_INTAKE_2026-05-15.md)
   - Intake note for the external Tasklet-class browser-agent research.
   - Records what PRAXIS adopted, deferred, or rejected.
6. [`PRAXIS_FOUNDATION_COHERENCE_CHECK_2026-05-15.md`](./PRAXIS_FOUNDATION_COHERENCE_CHECK_2026-05-15.md)
   - Senior-engineering coherence check across app structure, docs, substrate,
     and build order.
7. [`PRAXIS_ADK_GENKIT_INTEGRATION_PLAN.md`](./PRAXIS_ADK_GENKIT_INTEGRATION_PLAN.md)
   - Repo-grounded map for using ADK as the long-running worker substrate and
     Genkit as the typed flow/tool/eval substrate while keeping
     ContextCapsules, Firestore app state, and the Cloud SQL run ledger
     PRAXIS-owned.
8. [`PRAXIS_FUNDING_AND_PITCH_PACK.md`](./PRAXIS_FUNDING_AND_PITCH_PACK.md)
   - Funder-facing PRAXIS explanation pack with the 300-character elevator
     pitch, business model, funding needs, and textual pitch deck.

## Build Queue

Use [`../build/PRAXIS_CONTEXT_CAPSULE_APP_BUILD_LEDGER_2026-05-15.md`](../build/PRAXIS_CONTEXT_CAPSULE_APP_BUILD_LEDGER_2026-05-15.md)
as the current implementation ledger. Read older `/app/contexts` items as
capsule-manager work inside `/app`: public-to-app usability, capsule
onboarding, document/source intake, Cloud SQL run ledger, Cloud Tasks dispatch,
Research Memo Agent, daily brief, approvals, MCP/connectors, and the deferred
browser/sandbox lane.

Use [`../build/PRAXIS_TASKLET_RUNTIME_AGENT_PROMPTS.md`](../build/PRAXIS_TASKLET_RUNTIME_AGENT_PROMPTS.md)
for paste-ready Codex and Claude Code prompts.

## Current Canonical Direction

PRAXIS is a ContextCapsule-native agent workbench for serious policy work.

The product is not a generic Tasklet clone. It should become a full working app
with the same class of runtime capability:

- prompt-first creation;
- persistent agent runs;
- triggers and schedules;
- tool calls;
- integrations/MCP;
- browser/code sandbox later;
- audit logs;
- human approvals;
- generated work products.

But the PRAXIS version is domain-specific:

- policy analysis;
- conflict and statecraft;
- public-sector and institutional work;
- sourceable memos;
- review-gated graph changes;
- inheritable handover capsules.
- generic users who can start from one prompt;
- path-bound users with policy, statecraft, legal, HR, crisis, strategy, and
  research-direction defaults.

## App Spine

Keep the visible app simple:

```text
Home
Capsules
```

Pricing and Release notes are public pages. Login remains operational but is
not a product surface. Do not add new signed-in top-level pages for agents,
library, memo, canvas, or advanced tools.

- Home: prompt bar, active capsule, recent work, and direct Ask PRAXIS.
- Capsules: searchable stored ContextCapsules with ids, versions, categories,
  source/document refs, upload, improve, archive, and AI-guided build actions.
- Deeper memo, canvas, library, run-log, and diagnostic behavior should open as
  panels/actions inside the capsule manager or remain admin/debug-only.

## Runtime Spine

Use Google Cloud as the main runtime:

- Cloud Run first.
- Cloud SQL Postgres for the durable agent run ledger.
- Firestore for capsules, active context stacks, and owner-scoped app state.
- Cloud Tasks for per-run execution.
- Pub/Sub for events.
- Cloud Scheduler for daily briefs and watchlists.
- Vertex AI/Gemini as default model runtime.
- ADK for long-running/multi-step/multi-agent workers, with every material
  event mirrored into the PRAXIS run ledger.
- Genkit for typed flows, tools, structured outputs, and evals; Genkit traces
  are not canonical product state.
- Claude-on-Vertex only through the provider abstraction if evaluated.
- Browser automation later via `browser-use` plus Steel.dev managed first,
  self-hosted on GKE only when the workload proves it.
- Cloud Storage for artifacts.
- Secret Manager/KMS for secrets and user token encryption.
- GKE later only for heavy browser/code sandbox pools.

## Older Documentation Policy

Older v4/v5 docs remain useful evidence and historical context. They should
not override the current canonical app structure.

Use older docs this way:

- `docs/architecture/*`: architecture invariants, source-of-truth constraints,
  provider/security boundaries.
- `docs/_archive/*`: historical prompt packs and audits only.

When a new wave changes the canonical structure, update this index,
`PRAXIS_CANONICAL_APP_STRUCTURE.md`, `ARCHITECTURE.md`, `STATUS.md`,
`TODO.md`, and `CHANGELOG.md` together.

Old docs that no longer describe the Tasklet-style ContextCapsule product
should be deleted after references and audits are updated.
