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
dependency mismatch, and implemented safe Pack 19 foundation slices: visible
transparency cards on marketplace tools plus inspectable tool-run evidence.

## Implemented In This Pass

| Pack 19 item | Status | Evidence |
|---|---|---|
| Prompt preservation | CLOSED | `docs/codex-prompts/PRAXIS_CODEX_19_GENUINELY_USEFUL.md`, `scripts/audit-codex-prompts.ts` |
| S9 transparency cards foundation | CLOSED for 22 current marketplace tools | `src/lib/tools/marketplace/transparency.ts`, `src/components/tools/ToolTransparencyCard.tsx`, `src/components/tools/ToolMarketplace.tsx` |
| S3 evidence drawer foundation | CLOSED for marketplace tool-run artifacts | `src/components/evidence/EvidenceDrawer.tsx`, `src/components/evidence/RunDiff.tsx`, `src/app/api/tools/marketplace/run/route.ts` |
| Regression audit | CLOSED | `scripts/audit-transparency-cards.ts`, `npm run audit:transparency-cards`, included in `npm run audit:gate` |
| Regression audit | CLOSED | `scripts/audit-evidence-drawer.ts`, `npm run audit:evidence-drawer`, included in `npm run audit:gate` |

## Current Scope Note

Pack 18 now registers `cross.memo-create` and `cross.memo-refresh` as
first-class marketplace foundation tools. Pack 19 transparency and evidence
surfaces therefore cover all 22 current marketplace tools. Model-backed
specialist runtime evidence remains tracked under Pack 18 specialist depth, not
under this Pack 19 usefulness pass.

This pass does not claim Pack 19 complete. It closes and verifies the safe,
shippable Pack 19 foundation slice already coded on `main`: tool transparency,
inspectable run evidence, run comparison scaffolding, and memo-tool evidence
handoff visibility. The larger Pack 19 flows still require the product and
orchestration decisions listed in the remaining-work table.

## What The Transparency Card Shows

Each card derives from the marketplace registry and handler contract:

- methodology: objective plus core analysis moves;
- limitations: execution-stage reality, context floor, and review posture;
- evaluation posture: canary count, quality-check count, runtime budget, context floor;
- expected error modes: quality-bar failures, stale/missing receipts, ontology mismatch;
- last updated date and cost class.

## What The Evidence Drawer Shows

Marketplace runs now keep the full run artifact available to the completed-run
panel instead of reducing the result to opaque text. The drawer exposes:

- run prompt, summary, latency/cost-class telemetry, and handler stage;
- claim text, trust score, provenance, and a graph-tab link for case-backed
  provenance;
- context snapshot health, weakest layer, and projection payload;
- context advisories, next actions, generated artifacts, raw output, handler
  contract, posture, and metadata;
- memo studio handoff payload for memo-producing tool outputs, including
  `memoStudioReady`, `memoDraftId`, `suggestedTemplate`, and synthesized/review
  posture;
- persisted artifact reload by `artifactId` for signed-in users.

The completed-run panel also includes a run comparison control. It compares the
current raw output with the previous persisted run for the same tool when one
exists; demo sessions correctly show that no previous persisted raw output is
available.

## Remaining Pack 19 Work

These remain open until the Pack 18 launch gaps are truly closed:

| Prompt | Gap | Status |
|---|---|---|
| S1 | Situation Genesis flow | Not started; requires orchestration decision and review-queue integration |
| S2 | Workspace guideline propagation + case fork | Not started |
| S3 | Claim challenge and semantic diffing | Evidence drawer, memo handoff visibility, and line-level output diff foundation closed; claim challenge/reasoning-step appeal remains open |
| S4 | Memo redaction, milestones, review workflow, branded exports | Memo marketplace foundation tools are registered; redaction, milestones, review workflow, and branded export polish remain open |
| S5 | Boardroom intervention and deliberation history | Not started |
| S6 | Live signal panel | Not started; depends on signal integrations |
| S7 | 60-second wow 10-run streak | Not evidenced |
| S8 | Explainability, audit export, C2PA | Not started |
| S10 | Final persona/performance gate | Blocked by previous prompts |

## Verification Targets

- `npm run audit:transparency-cards`
- `npm run audit:evidence-drawer`
- `npm run audit:codex-prompts`
- `npm run audit:tool-marketplace`
- `npm run typecheck`
- `npm run build`

## Local Verification Evidence

Executed against `next start -p 3119` and `next start -p 3120` after
production builds:

| Surface | Result |
|---|---|
| `/app/workbench/syria-2026?tab=tools` in demo session | Marketplace rendered with `data-testid="tool-marketplace"` |
| Transparency cards | 11 visible in the filtered default marketplace view; all 22 covered by `npm run audit:transparency-cards` |
| Tool-run evidence drawer | Desktop and mobile browser smokes completed a marketplace run, opened the drawer, and verified claims/provenance, context snapshot, and raw output sections |
| Run comparison | Completed-run Compare control opened the run comparison panel; demo mode correctly showed no previous persisted run when history was absent |
| Full audit gate | `npm run audit:gate` passed, including `npm run audit:evidence-drawer`, `npm run build`, 138 Vitest files, 552 tests, KG drift, GCP, and master-charter checks |
| Browser errors | 0 console errors, 0 page errors |

## Production Verification Evidence

Deployment:

- Current commit deployed: `4669e02`
- Command: `npm run deploy:frontend:cloud`
- Latest Cloud Build: `4e76a579-73bf-447a-bee1-00033850783b`
- Status: `SUCCESS`
- Cloud Run revision: `praxis-frontend-00262-vdn`
- Traffic: 100% to `praxis-frontend-00262-vdn`

Live smoke against `https://praxis.tacitus.me/app/workbench/syria-2026?tab=tools`
after demo-session entry:

| Surface | Result |
|---|---|
| Tools marketplace | Rendered with `data-testid="tool-marketplace"` |
| Tool count and Pack 18/19 alignment | Marketplace copy shows "Twenty-two focused tools"; memo tools are searchable and visible |
| Transparency cards | 11 visible in the filtered default marketplace view; all 22 covered by `npm run audit:transparency-cards` |
| Tool-run evidence drawer | Live demo session completed `cross.memo-create` and verified claims/provenance, context snapshot, raw output, and memo studio handoff sections |
| Run comparison | Live Compare control opened the run comparison panel |
| Browser errors | 0 console errors, 0 page errors |

Final Pack 19 re-check on 2026-05-07 confirmed the same live surface on Cloud
Run revision `praxis-frontend-00262-vdn`: `cross.memo-create` and
`cross.memo-refresh` were visible after searching `memo`; the memo-create run
completed; the evidence drawer exposed `Memo Studio handoff`,
`memoStudioReady`, `synthesized`, `reviewRequired`, claims/provenance, context
snapshot, and raw output; browser console/page errors remained zero.

The full local gate was rerun on 2026-05-07 against current `main` and passed:
`npm run audit:gate` completed the production build, route audits, provider
isolation, workbench/landing/dashboard/boardroom checks, context/type parity,
22-tool marketplace contracts, transparency/evidence drawer audits,
firewall/owner scoping, KG drift, memo studio, 138 Vitest files, 552 tests, and
GCP inventory.
