# Slice 09 - v7 Skill Manifest

**State:** in-progress
**Brief:** 04
**Owner (human):** GC
**Owner (agent):** Codex
**Depends on:** Slice 01, Slice 08
**Blocks:** Ask skill filtering, ontology-aware recommendations, raw skill cutover
**Estimated size:** S (derived manifest plus audit/docs)

---

## Goal in one sentence

Give every existing registered tool a v7 Analyst Skill category and ontology compatibility contract without duplicating or hand-editing the legacy registry.

---

## In scope

- [x] Add `src/lib/tools/v7-skill-manifest.ts`.
- [x] Derive `skillCategory` for every tool from the existing registry category.
- [x] Derive non-empty `ontologyCompat` for every tool from existing metadata.
- [x] Preserve structural/no-AI posture from the existing `tier` field.
- [x] Preserve v7 visibility from the existing `surface === 'hero' && visible` posture.
- [x] Add `audit:v7-skill-manifest`.
- [x] Wire the audit into `audit:gate` and `audit:architecture-chain`.

## Out of scope

- Rewriting all 55 tool registry objects by hand.
- Changing legacy tool routes.
- Changing marketplace runtime behavior.
- Skill execution from Ask.

## Acceptance criteria

- [x] Every `TOOL_REGISTRY` entry has a v7 skill manifest entry.
- [x] Every manifest entry has a valid `skillCategory`.
- [x] Every manifest entry has at least one valid `ontologyCompat` value.
- [x] Manifest structural posture matches `ToolDefinition.tier`.
- [x] Manifest v7 visibility matches hero+visible posture.
- [x] `npm run audit:v7-skill-manifest` passes.
- [x] `npm run audit:architecture-chain` passes.
- [x] `npx tsc --noEmit` passes.
- [x] `npm run build` passes.

## Rollback

Delete `src/lib/tools/v7-skill-manifest.ts` and `scripts/audit-v7-skill-manifest.ts`; remove the audit from `package.json`, `audit:gate`, and `audit-architecture-chain`.

## Open questions

- [ ] Should v7 ontology compatibility become hand-curated per skill before launch? Default: keep derived coverage now, then curate the top 12 visible skills before canary.

## Notes for Codex

This is a manifest bridge, not a runtime change. It makes v7 skill filtering possible while keeping existing tool functionality intact.
