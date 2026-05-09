# Slice 08 - Analyst Skills Panel

**State:** in-progress
**Brief:** 04
**Owner (human):** GC
**Owner (agent):** Codex
**Depends on:** Slice 01, Slice 02, Slice 04, Slice 05
**Blocks:** Ask skill routing, slash commands, manual skill override
**Estimated size:** S (under 200 LOC functional surface, plus audit/docs)

---

## Goal in one sentence

Present the existing consolidated tool code as a small set of Analyst Skills inside Cores Library, with clear AI/structural posture and a direct path to stage work in Ask PRAXIS.

---

## In scope

- [x] Add `V7AnalystSkillsPanel` under `src/components/v7/`.
- [x] Reuse `getSimplifiedCapabilityLedger()` instead of inventing another skill registry.
- [x] Group skills by analyst work: Structure, Research, Analysis, Production.
- [x] Label deterministic structural skills as `Structural - no AI`.
- [x] Label remaining consolidated capabilities as `Calibrated AI`.
- [x] Provide `Stage in Ask` links with the selected skill id in the query string.
- [x] Show a staged skill card on `/app/ask?skill=<id>`.
- [x] Show suggested skills on Ask PRAXIS before a skill is staged.
- [x] Show an input/output contract for the active or suggested skill.
- [x] Render the panel inside `V7CoresSurface`.
- [x] Add `audit:v7-analyst-skills-panel`.
- [x] Add `audit:v7-ask-skill-routing`.
- [x] Wire the audit into `audit:gate` and `audit:architecture-chain`.
- [x] Extend the v7 Playwright smoke for the panel.

## Out of scope

- New skill handlers.
- New third-party marketplace authoring.
- Runtime execution of staged skills from `/app/ask`.
- Manifest `category` and `ontology_compat` fields on all 57 raw skill ids.
- Persisted Ask thread routing and skill invocation logs.

## Acceptance criteria

- [x] Cores Library renders an Analyst Skills panel.
- [x] The panel avoids the old marketplace framing and presents skills as analyst work.
- [x] Structural skills are explicitly labeled as no-AI.
- [x] Stage links navigate to Ask PRAXIS with a skill query parameter.
- [x] Ask PRAXIS visibly acknowledges the staged skill.
- [x] Ask PRAXIS shows three suggested skills and the input/output contract.
- [x] `npm run audit:v7-analyst-skills-panel` passes.
- [x] `npm run audit:v7-ask-skill-routing` passes.
- [x] `npm run audit:v7-cores-surface` passes.
- [x] `npm run audit:v7-shell-skeleton` passes.
- [x] `npm run audit:architecture-chain` passes.
- [x] `npx tsc --noEmit` passes.
- [x] `npm run lint` passes with existing warnings only.
- [x] `npm run build` passes.
- [x] Flag-on Playwright smoke passes.

## Rollback

Delete `src/components/v7/v7-analyst-skills-panel.tsx` and `scripts/audit-v7-analyst-skills-panel.ts`; remove the panel from `V7CoresSurface`; remove the audit from `package.json`, `audit:gate`, and `audit-architecture-chain`; revert the v7 Playwright smoke assertion.

## Open questions

- [ ] Should every raw skill id receive a v7 `category` and `ontology_compat` manifest field before cutover? Default: yes, but do it in a separate registry slice.
- [ ] Should `Stage in Ask` immediately create an Ask draft or only preselect the skill until Ask persistence lands? Default: preselect only until runtime Ask threads are owner-scoped.

## Notes for Codex

This slice reorganizes existing capability code for comprehension. It does not claim that Ask PRAXIS can run every staged skill end-to-end yet.
