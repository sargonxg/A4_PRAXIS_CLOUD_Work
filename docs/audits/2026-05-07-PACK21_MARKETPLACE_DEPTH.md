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
  - `npm run audit:tool-semantic-canaries`
  - `npm run audit:tool-persona-coverage`
  - `npm run audit:tool-authoring-spike`
  - `npm run audit:tool-composition-static`
  - `npm run audit:tool-suggestion-eval`
- ADRs:
  - `docs/adr/0033-marketplace-depth-strategy.md`
  - `docs/adr/0034-composition-chain-governance.md`
  - `docs/adr/0035-marketplace-cap-and-deferred-candidates.md`
- Pack 21 records:
  - `docs/audits/2026-05-07-TOOL_AUTHORING_SPIKE.md`
  - `docs/audits/persona-green-streak.md`

## Verification

Current green checks:

```text
npm run audit:tool-marketplace
npm run audit:tool-contract-v2
npm run audit:tool-skills-present
npm run audit:tool-canary-executable
npm run audit:tool-semantic-canaries
npm run audit:tool-persona-coverage
npm run audit:tool-authoring-spike
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
- The six deferred original-ontology depth candidates are formally governed by
  ADR 0035; they require replacement, a cap-change ADR, or a role-specific
  advanced bundle.
- Run and record production browser evidence after deployment.

## Still Not Claimed Complete

Pack 21's explicit 52-tool marketplace surface is complete under local audit.
The prompt's stricter runtime bar still remains open: model-backed specialist
handlers, live provider cost controls, and 10 consecutive green CI persona runs.
`docs/audits/persona-green-streak.md` resets the streak honestly at 0/10.
