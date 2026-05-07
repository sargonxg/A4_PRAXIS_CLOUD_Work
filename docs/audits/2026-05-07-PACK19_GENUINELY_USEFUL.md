# Pack 19 Genuinely Useful Pass

Date: 2026-05-07
Repo: `C:\Users\giuli\praxiscodexworking`
Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`
Source prompt: `docs/codex-prompts/PRAXIS_CODEX_19_GENUINELY_USEFUL.md`

## Executive Summary

Pack 19 is a v1.1 usefulness pack, but its own preconditions are not fully
true in the current repo: Pack 18 has not been fully closed, v1.0.0 is not
tagged, ten green persona CI runs are not evidenced, live Agent Engine runtime
evidence is incomplete, and specialist model-backed marketplace handlers remain
an open launch gap. This pass therefore preserved the prompt, documented the
dependency mismatch, and implemented a safe Pack 19 foundation slice: visible
transparency cards on marketplace tools.

## Implemented In This Pass

| Pack 19 item | Status | Evidence |
|---|---|---|
| Prompt preservation | CLOSED | `docs/codex-prompts/PRAXIS_CODEX_19_GENUINELY_USEFUL.md`, `scripts/audit-codex-prompts.ts` |
| S9 transparency cards foundation | CLOSED for 20 current marketplace tools | `src/lib/tools/marketplace/transparency.ts`, `src/components/tools/ToolTransparencyCard.tsx`, `src/components/tools/ToolMarketplace.tsx` |
| Regression audit | CLOSED | `scripts/audit-transparency-cards.ts`, `npm run audit:transparency-cards`, included in `npm run audit:gate` |

## Current Scope Note

Pack 19 says "22 tools" because it assumes Pack 18 has added `cross.memo-create`
and `cross.memo-refresh` as first-class marketplace tools. The current audited
registry has 20 tools. This pass covers all 20 current marketplace tools and
leaves the two memo tools tracked under the Pack 18 remaining gap.

## What The Transparency Card Shows

Each card derives from the marketplace registry and handler contract:

- methodology: objective plus core analysis moves;
- limitations: execution-stage reality, context floor, and review posture;
- evaluation posture: canary count, quality-check count, runtime budget, context floor;
- expected error modes: quality-bar failures, stale/missing receipts, ontology mismatch;
- last updated date and cost class.

## Remaining Pack 19 Work

These remain open until the Pack 18 launch gaps are truly closed:

| Prompt | Gap | Status |
|---|---|---|
| S1 | Situation Genesis flow | Not started; requires orchestration decision and review-queue integration |
| S2 | Workspace guideline propagation + case fork | Not started |
| S3 | Evidence drawer, output diffing, claim challenge | Not started |
| S4 | Memo redaction, milestones, review workflow, branded exports | Not started |
| S5 | Boardroom intervention and deliberation history | Not started |
| S6 | Live signal panel | Not started; depends on signal integrations |
| S7 | 60-second wow 10-run streak | Not evidenced |
| S8 | Explainability, audit export, C2PA | Not started |
| S10 | Final persona/performance gate | Blocked by previous prompts |

## Verification Targets

- `npm run audit:transparency-cards`
- `npm run audit:codex-prompts`
- `npm run audit:tool-marketplace`
- `npm run typecheck`
- `npm run build`

## Local Verification Evidence

Executed against `next start -p 3119` after production build:

| Surface | Result |
|---|---|
| `/app/workbench/syria-2026?tab=tools` in demo session | Marketplace rendered with `data-testid="tool-marketplace"` |
| Transparency cards | 11 visible in the filtered default marketplace view; all 20 covered by `npm run audit:transparency-cards` |
| Browser errors | 0 console errors, 0 page errors |
