# Pack 21 Marketplace Depth Audit

Date: 2026-05-07  
Prompt: `docs/codex-prompts/PRAXIS_CODEX_21_MARKETPLACE_DEPTH.md`  
Commit target: Pack 21 foundation slice

## Executive Summary

Pack 21 is implemented as a 52-tool marketplace foundation. The source prompt
contains a count conflict: it requires **30 new tools / 52 total**, while the
detailed list names 36 new tools. The shipped slice honors the explicit 52-tool
cap by adding 30 tools over the Pack 18 baseline:

- 20 Pack 20 ontology-forward tools across Human Rights, Economic/Sanctions,
  Humanitarian, Legal/Treaty, and Security/Defense.
- 7 cross-cutting depth tools.
- 3 conflict-depth tools.

The six deferred candidates are `mediation.batna-watna-explorer`,
`mediation.face-saving-options`, `governance.veto-coalition-mapper`,
`governance.compliance-monitor`,
`narrative.disinformation-network-mapper`, and
`narrative.frame-coalition-shift`.

## Implemented

- `src/lib/tools/marketplace/registry.ts` now exposes 52 Tool Contract v2
  marketplace tools.
- `skills/tools/<id>/SKILL.md` exists for all 52 tools with the nine canonical
  sections in order.
- `src/lib/tools/marketplace/handler-contracts.ts` provides explicit or
  generated specialist prompt contracts for every registered tool.
- Pack 20 ontology recommended tool ids now resolve to registered Pack 21 ids
  in TypeScript and Python mirrors.
- The marketplace category filter includes the five new ontology categories.
- New audits:
  - `npm run audit:tool-canary-executable`
  - `npm run audit:tool-composition-static`
  - `npm run audit:tool-suggestion-eval`
- ADRs:
  - `docs/adr/0033-marketplace-depth-strategy.md`
  - `docs/adr/0034-composition-chain-governance.md`

## Verification

Current green checks:

```text
npm run audit:tool-marketplace
npm run audit:tool-contract-v2
npm run audit:tool-skills-present
npm run audit:tool-canary-executable
npm run audit:tool-composition-static
npm run audit:tool-suggestion-eval
npm run typecheck
npx vitest run tests/unit/lib/tools/marketplace.test.ts tests/unit/lib/tools/tool-contract-v2.test.ts tests/unit/lib/tools/marketplace-handler-contracts.test.ts tests/unit/lib/tools/marketplace-runner.test.ts
```

## Remaining Pack 21 Work

- Replace prompt-contract foundation execution with genuinely model-backed
  specialist handlers where runtime evidence and provider cost controls exist.
- Expand persona suites to exercise the new tools in real browser flows and
  rebuild the 10-green-run CI streak.
- Decide whether the six deferred original-ontology depth candidates should
  replace lower-value tools, become a later v1.3 expansion, or be rejected.
- Add richer per-tool semantic canary fixtures beyond the current executable
  foundation run.
- Run and record production browser evidence after deployment.
