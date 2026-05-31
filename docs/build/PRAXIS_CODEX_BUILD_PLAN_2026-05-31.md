# PRAXIS Codex Build Plan - 2026-05-31

Repo: `sargonxg/A4_PRAXIS_CLOUD_Work`
Live surface: `https://praxis.tacitus.me`

This repo-local copy records the sequential Codex build track for the five-session PRAXIS push.

## Session Status

| Session | Focus | Status |
|---|---|---|
| 1 | Capsule Studio and living graph | Complete locally on `feature/capsule-studio-living-graph` |
| 2 | Live agents and proof rail | Pending |
| 3 | Approvals and real multi-agent orchestration | Pending |
| 4 | Boardroom depth | Pending |
| 5 | Public surface, billing, and ship proof | Pending |

## Prompt 1 Completion Notes

- Replaced the static 14-node SVG capsule graph with a lazy-loaded `react-force-graph-2d` Capsule Studio graph.
- Removed view-model graph truncation so the workbench emits the full source, document, claim, memory, output, agent, ontology, and review graph.
- Added node click detail, edge hover detail, search-to-focus, zoom-to-fit, right-click proposal entry, review-state shape encoding, ACO entity colors, and level-of-detail clustering above 150 nodes.
- Added review-gated graph proposal APIs:
  - `POST /api/context/capsules/[capsuleId]/graph/nodes`
  - `POST /api/context/capsules/[capsuleId]/graph/edges`
- Added graph proposal service helpers that create review cards and reuse `applyCapsuleReviewCard` for approval/version bumps.
- Added Studio overview rails for sources/freshness, claim ledger, tools, outputs, memory/tacit knowledge, trust/readiness, and history/diff.
- Added Firestore starter loader and idempotent seed script for `config/capsule_starters` plus `config/capsule_starters_history`.
- Added focused unit contracts and a skipped-unless-auth Playwright spec for create -> graph -> propose -> approve.

## Validation Output

```text
npx tsc --noEmit
PASS

npm run build
PASS - Next.js production build compiled and generated 167 static pages.
Note: existing Firebase Admin credential warnings appeared during static generation; they did not fail the build.

npm run lint
PASS

npx vitest run
PASS - 282 files, 1204 tests.

npm run audit:capsule-v3
PASS - audit:capsule-v3 OK

npm run audit:capsule-context-capture
PASS - audit:capsule-context-capture OK (205 starters, avg prompt 9441 chars)

npm run audit:capsule-graphlite-projections
PASS - audit:capsule-graphlite-projections OK; Starters: 205; Named graphs: 205

npm run check:landing-bundle
PASS - Landing route JS: 58.3 KB gzip across 4 chunks.

npm run check:authenticated-app-bundle
PASS - Authenticated app route assets: 760.9 KB gzip across 22 chunks.
```

## Handoff For Session 2

1. Reuse the Capsule Studio graph proposal routes instead of adding new graph mutation paths.
2. Use review cards as the proof rail for graph/capsule changes; approvals already bump capsule versions.
3. `buildCapsuleWorkbenchViewModel` now emits full graph metadata with entity type, provenance, confidence, source receipts, and relationship type.
4. Starters now have Firestore loader/seed plumbing, but broader runtime adoption should continue by moving remaining catalog reads behind server/API loaders.
5. Keep Session 2 work inside the existing Ask/cockpit surfaces and wire live agent proof into the same review/proposal language.
