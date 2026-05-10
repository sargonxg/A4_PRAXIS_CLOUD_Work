# PRAXIS Phase 1 Self-Audit - Topic E: Tools and Marketplace

Date: 2026-05-06
Worktree: `C:\Users\giuli\praxis-audit-tools-and-marketplace`
Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`
Write scope: this Markdown report and `docs/audits/2026-05-06-tools-and-marketplace.json` only.

## Scope

This audit reviewed architecture bible section 11, Pack 08, Pack 11, Pack 13, the comprehensive audit, the tool contract inventory, and the current registry/runtime/suggestion/composition source for Topic E: tools and marketplace.

No app fixes, pushes, deploys, dependency installs, or code rewrites were performed.

## Command Evidence

The assigned worktree has no `node_modules`, so direct `npm run ...` initially failed with `tsx is not recognized`. Per operational note, commands were rerun with the installed sibling binary path from `C:\Users\giuli\praxiscodexworking\node_modules\.bin`.

| Command | Result |
|---|---|
| `npm run audit:tool-marketplace` | Initial environment failure: `tsx` not found |
| `npm run audit:tool-marketplace` with sibling `.bin` on PATH | PASS: 16 curated tools, handler contracts, foundation execution |
| `npm run audit:tool-contract-v2` with sibling `.bin` on PATH | PASS: 16 tools |
| `npm run audit:tool-skills-present` with sibling `.bin` on PATH | PASS: 16 tools and 4 subagents |
| `npm run audit:tool-skill-conforms` with sibling `.bin` on PATH | PASS via alias to skills-present |
| `npm run audit:memo-studio` with sibling `.bin` on PATH | PASS |
| Manual SKILL heading order check | PASS: all 16 tool skills match canonical section order |

## Executive Summary

Topic E is green as a foundation, not complete as the fully model-backed Pack 13 marketplace. The repo has exactly 16 curated v1 marketplace tools, each with v2 contract fields, a SKILL.md in the canonical nine-section order, handler prompt contracts, ContextProvider-backed foundation execution, authenticated artifact persistence, run history, retry/cancel UI, recommendations, and chain buttons.

The main red flags are capability posture: handlers are `prompt-contract` foundation runs rather than specialist model-backed handlers; memo-create/memo-refresh are specified but not registered as marketplace tools; composition v2 has visible chain affordances but not parent-run context flow; and canaries are declared case IDs, not executable per-tool canary fixtures.

## Per-Tool Table

| Tool | Skill | v2 Contract | Handler/runtime | Canary fixtures | Composition |
|---|---:|---:|---|---|---|
| `conflict.leverage-trace` | PASS | PASS | prompt-contract foundation | `syria-2026`, `nordalia-2026` | into `cross.brief-exporter`, `cross.contradiction-finder`; default projection |
| `conflict.commitment-check` | PASS | PASS | prompt-contract foundation | `syria-2026` | into `cross.brief-exporter`, `cross.contradiction-finder`; default projection |
| `conflict.escalation-timeline` | PASS | PASS | prompt-contract foundation | `syria-2026`, `nordalia-2026` | into `cross.brief-exporter`, `cross.contradiction-finder`; default projection |
| `mediation.position-vs-interest` | PASS | PASS | prompt-contract foundation | `nordalia-2026` | into `cross.brief-exporter`, `cross.contradiction-finder`; default projection |
| `mediation.zopa-finder` | PASS | PASS | prompt-contract foundation | `nordalia-2026` | into `cross.brief-exporter`, `cross.contradiction-finder`; default projection |
| `mediation.mediation-brief` | PASS | PASS | prompt-contract foundation | `syria-2026`, `nordalia-2026` | into `cross.brief-exporter`, `cross.contradiction-finder`; default projection |
| `governance.veto-probability` | PASS | PASS | prompt-contract foundation | `nordalia-2026` | into `cross.brief-exporter`, `cross.contradiction-finder`; default projection |
| `governance.mandate-traceback` | PASS | PASS | prompt-contract foundation | `syria-2026` | into `cross.brief-exporter`, `cross.contradiction-finder`; default projection |
| `governance.coalition-map` | PASS | PASS | prompt-contract foundation | `nordalia-2026` | into `cross.brief-exporter`, `cross.contradiction-finder`; default projection |
| `narrative.frame-cascade` | PASS | PASS | prompt-contract foundation | `syria-2026` | into `cross.brief-exporter`, `cross.contradiction-finder`; default projection |
| `narrative.counter-narrative-finder` | PASS | PASS | prompt-contract foundation | `syria-2026` | into `cross.brief-exporter`, `cross.contradiction-finder`; default projection |
| `narrative.fact-check-traceback` | PASS | PASS | prompt-contract foundation | `syria-2026`, `nordalia-2026` | into `cross.brief-exporter`, `cross.contradiction-finder`; default projection |
| `cross.contradiction-finder` | PASS | PASS | prompt-contract foundation | `syria-2026`, `nordalia-2026` | no outgoing chain targets |
| `cross.context-health-explainer` | PASS | PASS | prompt-contract foundation | `syria-2026`, `nordalia-2026` | no outgoing chain targets |
| `cross.brief-exporter` | PASS | PASS | prompt-contract foundation; writes memo blocks declared | `syria-2026`, `nordalia-2026` | no outgoing chain targets |
| `cross.scenario-projector` | PASS | PASS | prompt-contract foundation | `syria-2026`, `nordalia-2026` | no outgoing chain targets |

## Suggestions And Composition

Suggestion status: `src/lib/tools/marketplace/suggestions.ts` ranks tools from ontology fit, context health, cost, runtime, and graceful-context support. `ToolMarketplace.tsx` renders the top three recommendations with rationales.

Suggestion gaps:

- No dedicated backend tool-suggestions API route was found.
- No Pack 13 recall@3 eval set for 16 user/case scenarios was found.
- No onboarding starter-tool integration was found.

Composition status: every non-cross tool declares chain targets into `cross.brief-exporter` and `cross.contradiction-finder`. The UI renders `ToolChainActions` after a run.

Composition gaps:

- No `parentRunId` request field or persisted chain tree was found in the marketplace run route.
- All tools point to one default projection module, not per-chain projection maps.
- No runtime merge of parent output into the child tool's ContextProvider snapshot was found.
- No composition context-flow E2E was found.

## Memo-Tool Posture

Memo Studio itself is present and passed `audit:memo-studio`. Evidence includes `src/types/memo.ts`, `src/components/memo/MemoStudio.tsx`, `src/lib/firebase/memo-service.ts`, and `src/app/api/memos/route.ts`.

The memo-tool posture is partial:

- Architecture section 11 and Pack 13 M8 specify `cross.memo-create` and `cross.memo-refresh`.
- Neither `cross.memo-create` nor `cross.memo-refresh` appears in `MARKETPLACE_TOOLS`.
- `skills/subagents/memo-drafter/SKILL.md` exists, but no `backend/agents/memo_drafter` LangGraph runtime or eval set was found.
- The existing memo inventory still lists citation side panel and server-side footnoted DOCX/PDF/Markdown exports as remaining implementation.

## 17th-Tool Spike Feasibility

Verdict: feasible for a foundation-only tool, but not yet the promised one-folder operation.

What works:

- `skills/templates/SKILL_TEMPLATE.md` exists.
- The current tool helper auto-fills v2 defaults, loose schemas, persistence posture, default projection, side effects, and skill file path.
- Existing audits catch registry count, schemas, ontology references, handler-contract presence, skill presence, and projection-file existence.

What blocks a clean spike:

- `MARKETPLACE_TOOLS` is a central array, not file-based discovery.
- A new tool also needs a central handler contract in `handler-contracts.ts`.
- `docs/contributing/AUTHORING_A_TOOL.md` is missing.
- `audit:tool-marketplace` enforces exactly 16 tools, so adding a real 17th tool requires an intentional gate change.
- Canary fixtures are IDs only, not executable canary runs with expected fields.

Estimated effort: 60-120 minutes for a foundation-only 17th tool, longer if the spike includes a model-backed handler, composition-specific projections, eval set, and executable canary.

## Findings

| ID | Severity | Finding | Evidence | Impact |
|---|---|---|---|---|
| E-HIGH-001 | High | Marketplace handlers are prompt-contract foundation runs, not specialist model-backed handlers. | `handler-contracts.ts` uses `executionStage: 'prompt-contract'`; `runner.ts` emits deterministic foundation posture; comprehensive audit lists specialist handlers as a gap. | Do not represent all 16 tools as fully analytical model-backed execution. |
| E-HIGH-002 | High | Memo tools promised by architecture and Pack 13 are not registered marketplace tools. | `cross.memo-create` and `cross.memo-refresh` are in docs/specs but absent from `MARKETPLACE_TOOLS`. | Memo Studio is not yet unified under the same tool contract. |
| E-HIGH-003 | High | Composition v2 context flow is partial. | Chain UI exists, but no `parentRunId`, per-chain projection maps, or parent-output context merge was found. | Chaining is a convenience rerun surface, not full context-flow composition. |
| E-MED-001 | Medium | Canary fixtures are declared but not executable per-tool canary runs. | `canaryCaseIds` are checked for non-empty values; no `audit:tool-coverage` exists. | Canary posture is weaker than Pack 08's end-to-end bar. |
| E-MED-002 | Medium | `audit:tool-skill-conforms` aliases to presence checks and does not enforce order. | `package.json` maps it to `audit:tool-skills-present`; current files pass manual order check. | Future section-order drift would not be caught by the named script. |
| E-MED-003 | Medium | Suggestion engine lacks the full Pack 13 eval and surface set. | Tools-tab ranking exists; no recall@3 eval, suggestion API, or onboarding surface found. | Recommendation posture is useful but incomplete. |
| E-MED-004 | Medium | 17th-tool authoring is not yet one-folder. | Central registry, central handler contracts, missing authoring doc, exact-16 audit gate. | Spike is feasible but requires coordinated central edits. |

## Bottom Line

The 16-tool marketplace is structurally sound for Phase 1 self-audit purposes: registry, contracts, skills, suggestion banner, ContextProvider-backed foundation runs, and artifact persistence are present and green under the available audits. The honest status is `partial_foundation_green`: strong enough to build from, not yet the fully live Pack 13 tool marketplace.
