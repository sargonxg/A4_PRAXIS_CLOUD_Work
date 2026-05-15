# PRAXIS Foundation Coherence Check

Date: 2026-05-15  
Scope: product docs, app structure, runtime blueprint, prompt pack, and current
repo substrate

## Verdict

The current foundation is coherent if the next sessions follow the new
canonical structure:

```text
ContextCapsule app spine
  + Cloud SQL agent run ledger
  + Cloud Tasks dispatch
  + PRAXIS tool registry
  + calibrated model routes
  + Memo Studio / Canvas / Library outputs
  + approval gates
  + browser automation later
```

The main risk is not missing technology. The main risk is scope drift:
rebuilding a generic Tasklet clone, adding a new stack, or exposing fake-live
automation before the run ledger, approval gates, and outputs are reliable.

## Canonical Documents

Current startup path is now correct:

- `AGENTS.md`
- `README.md`
- `ARCHITECTURE.md`
- `docs/product/README.md`
- `docs/product/PRAXIS_CANONICAL_APP_STRUCTURE.md`
- `docs/product/TASKLET_STYLE_PRAXIS_AGENT_RUNTIME_PLAN.md`
- `docs/product/TASKLET_RESEARCH_INTAKE_2026-05-15.md`
- `docs/build/PRAXIS_TASKLET_RUNTIME_AGENT_PROMPTS.md`
- `STATUS.md`
- `TODO.md`
- `CHANGELOG.md`

Older architecture/build docs remain useful, but they are no longer the first
product-shaping documents for the Tasklet-style runtime.

## Substrate Alignment

| Foundation | Current decision | Coherence status |
|---|---|---|
| Product object | ContextCapsule | coherent |
| Visible app spine | Home, Ask PRAXIS, Library, Memo Studio, Canvas, Advanced | coherent |
| App/control plane | Next.js on Cloud Run | coherent |
| App state | Firebase Auth + Firestore capsules/stacks/cores | coherent |
| Run ledger | Cloud SQL Postgres | needs implementation |
| Dispatch | Cloud Tasks per run | needs implementation |
| Events | Pub/Sub fan-out | coherent with existing GCP posture |
| Scheduling | Cloud Scheduler | coherent |
| Model runtime | Vertex/Gemini default through provider abstraction | coherent |
| Claude | optional evaluation through provider abstraction or Vertex | coherent if gated |
| Browser automation | browser-use + Steel later, GKE later | coherent as deferred lane |
| MCP | private/read-first gateway | coherent |
| Outputs | Memo Studio, Canvas, Library, handover packets | coherent |
| Governance | approvals, audit log, allowed actions, blocked actions | needs implementation |

## Codebase Alignment

Existing anchors to reuse:

- `src/lib/context/capsule-service.ts`
- `src/lib/context/core-objects.ts`
- `src/lib/product/context-capsules.ts`
- `src/lib/product/tasklet-style-runtime.ts`
- `src/lib/agents/run-agent.ts`
- `src/lib/ai/providers.ts`
- `src/lib/constants/tool-registry.ts`
- `src/lib/tools/contract.ts`
- `src/app/api/context/*`
- `src/app/api/cores/library`
- `src/app/api/ai/*`
- `src/app/api/memos/*`
- `backend/mcp/praxis_server.py`
- `scripts/audit-gcp.mjs`

Do not build parallel versions of these systems unless a migration plan exists.

## Required Next Build Order

1. Cloud SQL Agent Run Ledger.
2. Agent run API control plane.
3. Cloud Tasks dispatch and no-op worker transition.
4. Research Memo Agent with mocked/focused tool execution.
5. Memo Studio output plus run receipt UI.
6. Daily Brief / Watchlist triggers.
7. Approval queue.
8. MCP gateway expansion.
9. Browser automation lane.

This order matters. Browser automation before the run ledger and approvals
would produce a flashy but untrustworthy product.

## Documentation Cleanup Policy

Do:

- keep canonical docs short enough that future agents read them;
- mark older docs as historical/subsumed through indexes;
- keep `STATUS.md`, `TODO.md`, and `CHANGELOG.md` synchronized after each wave;
- use prompt packs for parallel work;
- add audit docs when a cleanup decision is evidence-based.

Do not:

- delete older docs without reference checks;
- leave contradictory architecture claims active;
- add new product concepts without updating `docs/product/README.md`;
- claim a feature is live before tests or production evidence exist.

## Engineering Gate For Each Session

Every coding session must:

1. Pull latest `main`.
2. Inspect dirty state.
3. Own a clear file set.
4. Implement one coherent improvement.
5. Add or update focused tests.
6. Update docs/status/changelog if behavior or direction changes.
7. Run focused validation plus:

```bash
npx tsc --noEmit
npm run build
npm run audit:repo-shape
npm run audit:architecture-reference
node scripts/audit-ai-routes.mjs
```

8. Run `graphify update .` after code changes.
9. Commit and push to `main` when checks pass and credentials are available.

## Current Gaps

- Cloud SQL agent runtime tables are not implemented.
- Agent run API routes are not implemented.
- Cloud Tasks dispatch is not implemented for agent runs.
- Run UI is not implemented.
- Approval queue is not implemented.
- Browser automation is intentionally deferred.
- Billing/pricing strategy remains unresolved and should not be mixed into the
  agent runtime foundation until the product loop is working.

## Senior Engineering Guidance

Keep the app boring underneath and powerful at the boundary:

- boring state transitions;
- boring SQL ledger;
- boring queues;
- boring audit logs;
- boring approval gates;
- powerful ContextCapsule inheritance;
- powerful sourceable memos;
- powerful handover and monitoring loops.

That is the path to a scalable, trustworthy PRAXIS. The browser-agent layer is a
later capability, not the foundation.

