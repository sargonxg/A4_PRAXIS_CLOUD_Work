# PRAXIS Cleanup + Context/Ask Wiring Audit

Date: 2026-05-15

## Scope

This pass checked the active Context Core Lite, DIALECTICA future-boundary, Ask
PRAXIS routing, source posture, and user-facing simplicity contract. The app
spine remains unchanged: Home, Ask PRAXIS, Library, Memo Studio, Canvas, and
Advanced.

## Cleaned

- Ask PRAXIS no longer tells users to open the removed
  `/app/brainstorming-table` surface. Heavy strategic questions now route to
  Memo Studio for options memos, Canvas for structured mapping, or Advanced for
  internal receipts/review.
- The deep research Ask extension no longer returns `/app/deep-search-agent`.
  It returns a routed internal Grounded Research directive and keeps the user in
  Ask PRAXIS or the tool repository.
- Ask PRAXIS now derives its visible capability count and prompt posture from
  `PRAXIS_CANONICAL_TOOLS` instead of a stale hard-coded count.
- Active context-injection docs and the source core template now refer to
  UCDP/GDELT event posture. ACLED remains only withdrawn/compliance-history
  material in active docs.

## Verified

- Startup state was clean on `main` after `git pull origin main`.
- Context Core Lite mode is already implemented as `praxis_lite`, with
  `dialectica_future` visible but disabled as a future mode.
- The one-click builder creates or connects a Situation Core, Capsule, Context
  Package, active context stack binding, and resolve preview through the
  existing context APIs.
- `/api/context/resolve` remains the preview path for what Ask PRAXIS receives.
- Ask PRAXIS accepts `messages`, `situation`, `currentToolId`, `currentPath`,
  `contextPackageId`, `capsuleId`, `activeContextStack`, `threadId`, and
  `aiSettings`, then builds a turn capsule from the active stack/package.

## Context Core Lite Reality

Context Core Lite can create the PRAXIS MVP working object: Situation Core,
optional User Core link, Praxis Capsule, Context Package, active context stack,
health score, missing cores, assumptions, and evidence gaps. It is a working
workbench context, not a full ingestion or graph-provenance system.

Thin sources remain gaps. The Ask context contract instructs answers to mark
missing evidence as intelligence gaps and avoid unsupported causal claims.

## DIALECTICA Future Boundary

DIALECTICA by TACITUS remains the future owner for full context creation,
ingestion, extraction, graph construction, provenance, ontology management,
versioning, and advanced context packages. PRAXIS is adapter-ready through the
typed DIALECTICA export contract, but this pass did not make DIALECTICA live.

## Ask PRAXIS Can Call Today

- Context resolution through the existing capsule/context package stack.
- Situation corpus retrieval through `searchSituationCorpus` and context-package
  retrieval through `localKnowledgeAdapter.buildContextPack`.
- Source/document retrieval and grounded URL fetch through the Ask extension
  tools where tier/key gates allow.
- Review-gated graph proposals through `proposeGraphDelta`.
- Tool-output writes through `writeToTool`.
- Memo/draft routing through Memo Studio and canonical `memo-drafter` routing.
- Context health and next-action suggestions through the turn capsule/context
  kernel.

## Stubbed Or Unavailable

- Full DIALECTICA core creation is not live.
- Deep research is a routed internal Grounded Research directive, not a direct
  open page.
- Specialist deliberation/boardroom behavior is internal/routed and should not
  be presented as a live top-level surface.
- Named multi-stack UX, richer Canvas graph editing, and production-grade
  source auto-structure remain TODO items.

## Validation

- `npx tsc --noEmit --pretty false` passed.
- `npm run build` passed. Turbopack still reports the known NFT trace warning
  through `src/lib/semantica/rust-runtime.ts`.
- `npm run audit:repo-shape`, `npm run audit:capsule-contract`,
  `npm run audit:context-health`, and `node scripts/audit-ai-routes.mjs`
  passed.
- `npx vitest run` passed: 181 files, 685 tests.
- `graphify update .` refreshed `graphify-out/`.
- `npm run audit:gate` passed through local build/static audits and stopped at
  `audit:gcp` because `gcloud` token refresh requires interactive reauth:
  `Reauthentication failed. cannot prompt during non-interactive execution.`
