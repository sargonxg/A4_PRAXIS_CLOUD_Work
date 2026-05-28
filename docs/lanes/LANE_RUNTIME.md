# Lane: Runtime And Agent Spine

## Scope

- Ask runtime, answer envelopes, streaming, source previews.
- AgentRun lifecycle, retry/cancel/status contracts.
- Context resolution, capsule compilation, persistence boundaries.
- Runtime proof and receipts.

## No-Touch Boundaries

- Do not bypass calibration or model policy checks without a documented exemption.
- Do not make graph/Cognee/Neo4j authoritative over Firestore/ContextCapsules without an approved architecture change.
- Do not fake runtime proof, model selection, source state, or agent state.

## Start Reads

- `docs/CODEX_SESSION_BRIEF.md`
- `docs/product/TASKLET_STYLE_PRAXIS_AGENT_RUNTIME_PLAN.md`
- `docs/build/PRAXIS_TASKLET_RUNTIME_AGENT_PROMPTS.md`
- `docs/architecture/PRAXIS_ARCHITECTURE.md`
- `src/lib/ai/`
- `src/lib/agent-runtime/`
- `src/app/api/ai/chat/route.ts`
- `src/app/api/agents/`

## Validation

```powershell
npm run typecheck
npm run test
npm run audit:ask-cockpit-runtime
npm run audit:agent-process-contract
npm run audit:agent-runtime-proof
```

## Done Evidence

- Runtime path traced.
- Contracts changed or preserved.
- Focused tests added/updated.
- Audit output.
- Any local-only env blockers separated from production behavior.
