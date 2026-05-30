# PRAXIS Agentic Kernel Continuation Prompt

Use this prompt for the next agent:

```text
We are continuing PRAXIS in C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work.

Live URL: https://praxis.tacitus.me
Branch: main
Current HEAD at this checkpoint: 095c0d13441dbb32aad19907060c31a15151e35a
Origin sync at slice start: git fetch origin main; git rev-list --left-right --count HEAD...origin/main -> 0 0

Goal: implement the PRAXIS Simplification + Agentic Kernel plan. Keep the visible app to Home + Capsules while strengthening the hidden context compiler, agent runtime, capsule structure, graph/Cognee review layer, and GCP-backed execution path.

Start by reading:
- AGENTS.md
- docs/roadmap/PRAXIS_SIMPLIFICATION_AGENTIC_KERNEL_LEDGER_2026-05-28.md
- ARCHITECTURE.md
- docs/product/PRAXIS_CANONICAL_APP_STRUCTURE.md
- docs/architecture/PRAXIS_AGENT_RUNTIME_ARCHITECTURE.md
- docs/product/CONTEXT_CAPSULE_V3_HUMAN_GATED_CONTEXT_INFRASTRUCTURE.md

Completed in the current slice:
1. Created the simplification/kernel ledger at docs/roadmap/PRAXIS_SIMPLIFICATION_AGENTIC_KERNEL_LEDGER_2026-05-28.md.
2. Added tests/unit/simplification/visible-vocabulary-contract.test.ts to lock Ask/first-run/front-door surfaces to Home, Capsules, Ask PRAXIS, Context, Sources, Work, and Proof vocabulary.
3. Reworded targeted Ask prompt, onboarding, Ask helper, context, source/work/proof, and compatibility helper labels away from visible Library / Memo Studio / Canvas / Advanced routing.
4. Reframed visible Boardroom launch CTAs from the workbench as Your Personal Knowledge Board while preserving /app/boardroom compatibility.
5. Tightened src/lib/agent-runtime/tool-registry.ts so agent tools use strict Zod input/output schemas instead of generic record fallback; updated tests/unit/lib/agent-runtime/tool-registry.test.ts.
6. Updated output target display labels in Ask/AgentRun DTOs from Memo Studio/Canvas to Work/Context while preserving persisted enum values.

Dirty-tree warning:
- This repo was already dirty before the slice began. There are unrelated or pre-existing edits in Codex config/agent roles, docs, graphify output, runtime tests, package/playwright scripts, deploy helpers, and local .tmp-next-dev files.
- Do not revert unrelated changes. Before commit/push/deploy, isolate which edits belong to this slice and which belong to previous/user work.

No-touch constraints:
- Do not add a new top-level app page or primary nav item.
- Do not make Cognee, ADK memory, Genkit traces, or graph extraction canonical state.
- Do not overwrite user capsule state or version history.
- Do not hide runtime proof; make it simpler and more truthful.
- Do not push/deploy until local gates pass and dirty-tree scope is reviewed.
- Preserve compatibility routes such as /app/write, /app/canvas, /app/contexts, /app/tools, and /app/boardroom unless a dedicated redirect/change plan is approved.

Validation gates to rerun:
- npx vitest run tests/unit/simplification/visible-vocabulary-contract.test.ts tests/unit/lib/agent-runtime/tool-registry.test.ts tests/unit/components/tasklet-workbench-contract.test.ts tests/unit/lib/agent-runtime/api-schema.test.ts tests/unit/lib/ai/ask-orchestrator.test.ts
- npm run audit:simplification
- npm run audit:capsule-v3
- npm run audit:capsule-contract
- npm run audit:capsule-memory-contract
- npm run audit:graph-proposal-review-contract
- npm run audit:cognee
- npm run audit:genkit-runtime
- npm run audit:agent-runtime-proof
- npm run typecheck
- npm run build
- git diff --check

Next exact task:
1. Review the current gate results in the ledger.
2. If local gates are green, define and implement the single compiled-context contract used by Ask and AgentRun. It should include active capsule v3 identity, capsule stack, source receipts, evidence pack, graph posture, memory posture, sourceability ledger, allowed tools, gaps, and stop conditions.
3. Keep Firestore ContextCapsules canonical. Cognee, graph extraction, and memory recall should produce review cards only.
4. Update the ledger with files touched, commands, exact results, blockers, and the next prompt.

Ship path after local gates:
- Review dirty tree and isolate unrelated changes.
- Commit coherently on main only after gates pass.
- Push to GitHub.
- Verify GitHub Actions/checks with gh run list / gh run view.
- Deploy only after GitHub gates are green.
- Verify Cloud Run latest revision and traffic.
- Check https://praxis.tacitus.me/, /login, /api/health, /api/health/runtime, and /api/health/agentic-search.
- Record live revision, commit SHA, endpoint statuses, and remaining warnings in the ledger.
```
