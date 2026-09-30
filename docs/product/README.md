# PRAXIS Product Documentation Index

Updated: 2026-09-29
Status: canonical index for the current app structure

Start with the [current user-readiness receipt](../reviews/2026-09-29-praxis-user-readiness.md)
for what is verified, what is pending and the next release proof. Architecture
direction and historical receipts do not establish a working live journey.

## Read These First

1. [`PRAXIS_CANONICAL_APP_STRUCTURE.md`](./PRAXIS_CANONICAL_APP_STRUCTURE.md)
   - Main source of truth for what `praxis.tacitus.me` is becoming.
   - Defines the ContextCapsule-native app spine, Google Cloud runtime,
     Firestore/Cloud SQL state boundary, first agents, governance, and build
     waves.
2. [`PRAXIS_PUBLIC_COPY_CONTRACT_2026-06-09.md`](./PRAXIS_PUBLIC_COPY_CONTRACT_2026-06-09.md)
   - Current public and pre-login copy contract.
   - Future agents should keep first-contact UX human-first: ask the question,
     attach sources or saved context when needed, and leave with reviewable
     work.
3. [`PRAXIS_V3_SURFACE_CLASSIFICATION_2026-06-10.md`](./PRAXIS_V3_SURFACE_CLASSIFICATION_2026-06-10.md)
   - Phase 0 v3 route/nav/tool classification artifact.
   - Maps `Ask`, `Library`, `Studio`, `Runs`, and `Labs` onto existing routes
     before any visible navigation changes.
4. [`TASKLET_STYLE_PRAXIS_AGENT_RUNTIME_PLAN.md`](./TASKLET_STYLE_PRAXIS_AGENT_RUNTIME_PLAN.md)
   - Implementation plan for the Tasklet-style PRAXIS runtime.
   - Explains what to copy from Tasklet's product class and what not to copy.
5. [`../PRAXIS_CODEX_PLAYBOOK.md`](../PRAXIS_CODEX_PLAYBOOK.md)
   - Authoritative roadmap + per-surface work packets. Supersedes the removed
     product-rebuild plan; product narrative/UX intent now lives in the canonical
     app structure doc plus this playbook's vision→gap map.
6. [`PRAXIS_CAPSULE_EXCELLENCE_PLAN.md`](./PRAXIS_CAPSULE_EXCELLENCE_PLAN.md)
   - Authoritative capsule design + 7-phase build plan (CAP-1…CAP-7): creation,
     display, content, usage, analysis, learning, embedded graphs, dynamic
     ontologies, semantic layer — organized by Users/Tools/Output/Situation.
7. [`CONTEXT_CAPSULE_POLICY_RESEARCH_GUIDE.md`](./CONTEXT_CAPSULE_POLICY_RESEARCH_GUIDE.md)
   - Canonical guide for building policy/statecraft ContextCapsules.
   - Defines core anatomy, PRAXIS augmented generation, generic versus
     path-bound users, personas, combination rules, tools, connectors,
     outputs, and usable app shape.
   - `CONTEXT_CAPSULE_V3_HUMAN_GATED_CONTEXT_INFRASTRUCTURE.md` remains a
     background design reference. The live capsule contract is
     `src/lib/context/capsule-v3.ts` plus the canonical app structure doc.
8. [`TASKLET_RESEARCH_INTAKE_2026-05-15.md`](./TASKLET_RESEARCH_INTAKE_2026-05-15.md)
   - Intake note for the external Tasklet-class browser-agent research.
   - Records what PRAXIS adopted, deferred, or rejected.
9. [`PRAXIS_FOUNDATION_COHERENCE_CHECK_2026-05-15.md`](./PRAXIS_FOUNDATION_COHERENCE_CHECK_2026-05-15.md)
   - Senior-engineering coherence check across app structure, docs, substrate,
     and build order.
10. [`PRAXIS_ADK_GENKIT_INTEGRATION_PLAN.md`](./PRAXIS_ADK_GENKIT_INTEGRATION_PLAN.md)
   - Repo-grounded map for using ADK as the long-running worker substrate and
     Genkit as the typed flow/tool/eval substrate while keeping
     ContextCapsules, Firestore app state, and the Cloud SQL run ledger
     PRAXIS-owned.
11. [`PRAXIS_FUNDING_AND_PITCH_PACK.md`](./PRAXIS_FUNDING_AND_PITCH_PACK.md)
   - Funder-facing PRAXIS explanation pack with the 300-character elevator
     pitch, business model, funding needs, and textual pitch deck.
12. [`../audits/2026-05-30-red-flags-and-improvement-plan.md`](../audits/2026-05-30-red-flags-and-improvement-plan.md)
    - Current red flags, 10 next improvements, and documentation cleanup
      decision.

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

The public and pre-login surfaces should explain the human job before the
internal machinery: ask the question, attach sources or saved context when
needed, and leave with reviewable work. Keep ContextCapsule language for the
repository, builder, runtime contracts, and technical Learn content.

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
- Boardroom, memo, canvas, library, run-log, and diagnostic behavior opens as
  panels/actions inside the existing cockpit/workbench, with admin-only tools
  kept in their scoped surfaces.
- Legacy signed-in URLs and focused run links may redirect or deep-link into
  the shared cockpit for compatibility. They should not become new primary app
  surfaces.

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
should be archived or deleted only after references and audits are updated. As
of 2026-05-30, no exact duplicate Markdown files were found outside
`docs/_archive`; the current cleanup stance is consolidation through
`../README.md`, `../audits/README.md`, `../../README.md`, `STATUS.md`,
`TODO.md`, and `CHANGELOG.md`.
