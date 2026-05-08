# PRAXIS codebase audit - 2026-05-08 - summary

## Snapshot

- 2134 audit-relevant tracked files.
- 1327 TS/JS files and 258 Python files.
- 302 route method entries: 210 Next, 92 FastAPI.
- 63 frontend dependencies, 12 dev dependencies.
- Circular dependencies: 0 from Madge.
- Hub modules over 15 importers: 32.
- Orphan module candidates: 269.

## Headlines

1. The repo is large but currently cycle-clean in the TypeScript app graph.
2. The highest-confidence cleanup is not app logic deletion; it is archived UI, old audit scripts, and dependency hygiene.
3. Route surface area remains broad; deletion needs production route-consumer evidence, not static grep alone.
4. The biggest consolidation opportunity is repeated AI/boardroom/research route boilerplate.
5. B0-B3/C0-C2 remain hard gates; cleanup must not erase future-useful scaffolding before those decisions.

## Tier 1 cleanup

- 10 review-ready cleanup candidates.
- Candidate dependency removals: 7 runtime, 3 dev.
- Dead route candidates are medium risk until production logs are checked.

## Decisions needed from GC

1. Keep/delete/archive landing _archive and historical audit scripts.
2. Approve B0-B3 Postgres KG path before graph backend cleanup.
3. Deploy Cognee or keep memory disabled/hidden.
4. Decide Agent Engine runtime artifacts vs label rename.
5. Decide whether marketplace run route can become 410.

## Evidence

- Cleanup plan: 07-cleanup-plan.md
- Unknowns: 08-unknowns.md
- Module graph: 02-graphs/module-graph.mermaid
- Dead code: 03-dead-code/
- Duplications: 04-duplications/
- Hotspots: 05-hotspots/
- Surface area: 06-surface-area/
