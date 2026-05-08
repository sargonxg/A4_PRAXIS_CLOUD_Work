# PRAXIS Repo Purpose Audit

Date: 2026-05-08

Repo: `C:\Users\giuli\praxiscodexworking`

Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`

Branch: `main`

## Scope

This pass classified every tracked file in the repository with `git ls-files`, grouped files by purpose, spot-checked the largest active files and obvious generated artifacts with `rg`, then removed older archive/generated evidence that no longer needed to live in the active tree. The full post-cleanup per-file inventory is in `file-purpose-inventory.csv`.

## High-Level Finding

The repository is now substantially leaner. The main non-runtime weight that remains is intentional: Graphify output, source prompt packs, current May 8 audit ledgers, and root handoff/config docs.

| Bucket | Files | Bytes | Meaning |
| --- | ---: | ---: | --- |
| Active-ish runtime and product code | 2,015 | 11,340,477 | `src`, `backend`, `services`, `cloud_functions`, infra, schemas, tests, scripts, root config/docs |
| Reference, current generated, and retained evidence | 123 | 8,017,126 | prompt packs, `graphify-out`, current May 8 audit ledgers, landing component archive |
| Total tracked/new inventory after cleanup | 2,138 | 19,357,603 | All tracked files plus new retained-evidence doc |

This cleanup removed 160 tracked reference/generated files, about 5.0 MB, without deleting application code.

## Area Purpose Map

| Area | Files | Purpose | Keep / Action |
| --- | ---: | --- | --- |
| `src/app` | 84 | Next.js App Router pages, authenticated app surfaces, landing/demo/legal routes | Keep. Split very large pages into local components. |
| `src/app/api` | 202 | Next.js API boundary, auth gates, AI routes, backend proxies, health/audit routes | Keep. Continue consolidating repeated auth/proxy helpers. |
| `src/components` | 316 | Product UI: workbench, chapters, marketplace, graph, memos, onboarding, assistant primitives | Keep. Consolidate repeated cards/panels only where behavior is duplicated. |
| `src/lib` | 354 | Tool registries, AI helpers, calibration, constants, case data, services, adapters | Keep. This is the largest active code concentration and the main refactor target. |
| `backend` | 312 | FastAPI backend, agents, Cognee boundary, orchestrator, graph/storage services | Keep. Some paths may be shelf code from the UI perspective, but they support planned backend lanes. |
| `tests` | 171 | Unit, audit, route, and behavior tests | Keep. Promote useful audits into gate rather than deleting. |
| `scripts` | 107 | Audit, generation, migration, smoke, and repo-shape scripts | Keep. Remove only scripts that are provably superseded by newer gate scripts. |
| `docs/audits` | 59 | Current May 8 audit/status evidence and retained gate markers | Keep current evidence only. Historical details are recoverable from git history. |
| `docs/codex-prompts` | 53 | Prompt/spec source material used to drive previous implementation waves | Keep as source-of-truth history, but index it better. |
| `graphify-out` | 4 | Generated codebase graph used by audit scripts and architecture checks | Keep unless audit scripts are changed. It is ignored by deploy packaging. |
| `infrastructure` | 41 | Terraform, Firebase, cloud/deploy config | Keep. |
| `services` | 32 | Worker/service support code | Keep until backend route usage audit proves otherwise. |
| `cloud_functions` | 10 | Firebase/Cloud Functions support | Keep until deploy target is retired. |
| root config | 25 | Package, TypeScript, Next, Tailwind, ESLint, lockfile, handoff docs, env/deploy config | Keep. |

## Largest Tracked Files

| File | Bytes | Purpose | Assessment |
| --- | ---: | --- | --- |
| `graphify-out/graph.json` | 5,381,601 | Generated codebase graph | Intentional, but should stay deploy-ignored. |
| `package-lock.json` | 883,686 | Dependency lockfile | Keep. |
| `docs/audits/2026-05-08-REPO_PURPOSE_AUDIT/file-purpose-inventory.csv` | 368,872 | Current per-file purpose inventory | Keep as the latest repo map. |
| `graphify-out/manifest.json` | 359,707 | Generated Graphify manifest | Keep with Graphify output. |
| `docs/audits/2026-05-08-REPO_PURPOSE_AUDIT/review-candidates.csv` | 104,472 | Current cleanup/refactor candidate list | Keep as the latest cleanup queue. |
| `src/lib/ai/tools.ts` | 163,834 | AI SDK tool definitions/helpers | Active but too large. Split behind same exports. |
| `src/lib/constants/tool-registry.ts` | 94,973 | Core tool registry | Active but too large. Split by domain/surface behind same exports. |
| `src/app/app/situations/new/page.tsx` | 83,997 | New situation wizard page | Active but too large. Extract local components/hooks. |

## Active Code Hotspots

These files are active and should not be deleted. They are good simplification targets because they concentrate too much responsibility.

| File | Why it is active | Suggested simplification |
| --- | --- | --- |
| `src/lib/ai/tools.ts` | Imported by AI chat, advisor-chat, auto-structure, and tests | Split into `tools/context`, `tools/web`, `tools/graph`, and a re-exporting index. |
| `src/lib/constants/tool-registry.ts` | Imported by marketplace, workbench, audits, docs generators, and tests | Split into domain files under `src/lib/tools/registry/` while preserving exported `TOOL_REGISTRY`. |
| `src/app/app/situations/new/page.tsx` | Main case creation route | Move step data, validation, and panels into local modules. |
| `src/components/praxis/situation-dashboard.tsx` | Dashboard shell and visual sections | Split dashboard metrics, map/timeline, and insight panels. |
| `src/app/api/ai/concordia/route.ts` | Large API route | Extract shared request validation and prompt assembly helpers. |
| `src/lib/constants/*demo*` and `src/lib/constants/cases/*` | Demo data is actively imported by demo routes and case registry | Move demo case data into case packages and lazy import where possible. |

## Cleanup Executed

Executed in this pass:

| Removed | Count / size | Reason |
| --- | --- | --- |
| `docs/_archive/*` | 86 files | Historical planning/reference docs. Removed from active tree; recoverable from git history. |
| Old `docs/audits/2026-05-06-*` and `2026-05-07-*` snapshots | 57 files | Superseded by current retained evidence and May 8 audits. |
| Old generated audit JSON/DOT/MJS payloads | 11 files | Large machine output no longer needed in active tree. Human-readable markdown outputs remain. |
| Root/generated Lighthouse payloads | 2 files | `lighthouse-landing.json` and stale demo Lighthouse JSON were generated artifacts. |
| Older generated tool contract/tool docs snapshots | 4 files | Kept only the current May 8 tool contract output. |

The gate scripts that previously referenced older dated audits now point at `docs/audits/2026-05-08-CLEANUP_RETAINED_EVIDENCE.md`, so the repository keeps audit proof without carrying every historical one-off report.

## Do Not Delete Without A Separate Usage Audit

- `backend/`: some routes are not obvious from frontend imports because they are reached through `/api/backend/*` proxies and planned backend lanes.
- `services/` and `cloud_functions/`: keep until deployment and route usage are checked.
- `graphify-out/`: current repo-shape/master-charter audits expect Graphify output.
- Demo constants: Syria, Nordalia, Northwind, CTED, and related fixtures are actively imported by demo routes and tests.
- `docs/codex-prompts/`: these are implementation source prompts and should stay discoverable.
- `src/components/landing/_archive/`: the landing audit expects the retired heritage components to exist.

## Recommended Cleanup Order

1. Split `src/lib/ai/tools.ts` behind stable exports.
2. Split `src/lib/constants/tool-registry.ts` behind stable exports.
3. Extract the new-situation wizard and dashboard into smaller local modules.
4. Add a lightweight docs/audit retention policy so future generated JSON does not accumulate.
5. Run a backend proxy usage audit before touching `backend/`, `services/`, or `cloud_functions/`.

## Audit Artifacts

- `file-purpose-inventory.csv`: every tracked file, classified by path, area, purpose, status, and suggested action.
- `area-summary.csv`: grouped by product area.
- `top-directory-summary.csv`: grouped by top-level directory.
- `largest-files.csv`: largest tracked files.
- `review-candidates.csv`: files flagged as cleanup, split, archive, or generated-output candidates.
