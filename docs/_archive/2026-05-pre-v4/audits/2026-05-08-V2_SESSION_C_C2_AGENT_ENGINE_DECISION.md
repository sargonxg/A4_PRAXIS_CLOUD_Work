# PRAXIS V2 Session C C2 Agent Engine Decision

Date: 2026-05-08
Repo: `C:\Users\giuli\praxiscodexworking`
Source prompt: `docs/codex-prompts/PRAXIS_V2_C2_AGENT_ENGINE_SUBAGENTS.md`

## Result

C2 has been preserved and registered. No deploy or rename code path was
executed in this pass because C2 requires a binary GC decision before code:

- Option A: deploy real Vertex Agent Engine artifacts.
- Option B: rename/remove subagent claims and describe the actual calibrated
  pipeline.

The prompt recommends Option B by default, but the repo now records the
decision as pending GC review before changing registry/docs semantics.

## Runtime Evidence

Secret Manager has no Vertex Agent Engine resource bindings matching
`VERTEX_AGENT`:

```text
gcloud secrets list --project=praxisbytacitus --filter="name~VERTEX_AGENT"
<no rows>
```

The local `gcloud ai` surface does not expose a reasoning-engines command:

```text
gcloud ai reasoning-engines list --region=us-central1 --project=praxisbytacitus
ERROR: (gcloud.ai) Invalid choice: 'reasoning-engines'.
```

Cloud Run currently has no `praxis-cognee` service either, so Session C is
already blocked at C0.

## Codebase Evidence

The named labels still appear as marketplace metadata:

- `src/lib/tools/marketplace/types.ts` defines
  `context-preparer`, `source-augmenter`, `output-refiner`, `memo-drafter`,
  and `red-team-analyst`.
- `src/lib/tools/marketplace/registry.ts` attaches those labels through
  `subagentDeps`.
- `src/components/tools/ToolMarketplace.tsx` only renders those labels when
  the Agent Engine feature flag is enabled, which keeps the visible UI honest
  while the decision is pending.

## Decision Needed

Recommended next step: approve Option B unless GC explicitly wants to fund and
operate Agent Engine deployments now.

If Option B is approved, the implementation should:

1. Replace marketplace `subagentDeps` user-facing semantics with an honest
   calibrated `pipeline` field.
2. Update transparency cards and suggestions so they say "calibrated pipeline"
   rather than implying deployed subagents.
3. Add `audit:no-subagent-claims`.
4. Preserve legitimate internal/backend agent terminology where it refers to
   real local scaffolds, SAT proposal provenance, or Codex orchestration docs.

If Option A is approved, first add deploy specs under `infrastructure/agent_engine/`
and create Secret Manager bindings before wiring `withCalibration`.
