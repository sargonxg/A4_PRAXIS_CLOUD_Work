# PRAXIS Repo Purpose Audit

Date: 2026-05-08

Repo: `C:\Users\giuli\praxiscodexworking`

Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`

Branch: `main`

## Scope

This pass classified every tracked file in the repository with `git ls-files`, grouped files by purpose, and spot-checked the largest active files and obvious generated artifacts with `rg`. The full per-file inventory is in `file-purpose-inventory.csv`.

## High-Level Finding

The repository feels larger than the active product because reference and generated material is now bigger than runtime application code.

| Bucket | Files | Bytes | Meaning |
| --- | ---: | ---: | --- |
| Active-ish runtime and product code | 1,309 | 7,833,249 | `src`, `backend`, `services`, `cloud_functions`, infra, schemas, tests, scripts |
| Reference, archive, generated, and audit evidence | 440 | 14,384,288 | `docs/audits`, `docs/_archive`, prompt packs, `graphify-out`, root generated reports |
| Total tracked inventory | 2,291 | 23,908,547 | All tracked files |

The main cleanup opportunity is not deleting application code. It is separating generated/reference artifacts from active code, reducing large monolithic registries and pages, and making the repo shape easier to navigate.

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
| `docs/audits` | 125 | Durable evidence ledger, snapshots, codebase audits, Lighthouse/Graphify outputs | Keep latest evidence. Archive or compress older generated JSON. |
| `docs/_archive` | 86 | Historical specs and older implementation notes | Keep for now as reference. Can be moved out of active docs search later. |
| `docs/codex-prompts` | 53 | Prompt/spec source material used to drive previous implementation waves | Keep as source-of-truth history, but index it better. |
| `graphify-out` | 4 | Generated codebase graph used by audit scripts and architecture checks | Keep unless audit scripts are changed. It is ignored by deploy packaging. |
| `infrastructure` | 41 | Terraform, Firebase, cloud/deploy config | Keep. |
| `services` | 32 | Worker/service support code | Keep until backend route usage audit proves otherwise. |
| `cloud_functions` | 10 | Firebase/Cloud Functions support | Keep until deploy target is retired. |
| root config | 10 | Package, TypeScript, Next, Tailwind, ESLint, lockfile, env/deploy config | Keep. |

## Largest Tracked Files

| File | Bytes | Purpose | Assessment |
| --- | ---: | --- | --- |
| `graphify-out/graph.json` | 5,381,948 | Generated codebase graph | Intentional, but should stay deploy-ignored. |
| `package-lock.json` | 883,686 | Dependency lockfile | Keep. |
| `docs/audits/2026-05-08-CODEBASE_AUDIT/01-inventory/modules.json` | 725,620 | Generated audit inventory | Keep latest, consider compressing/archive policy. |
| `docs/audits/lighthouse-demo-syria-2024-latest.json` | 634,791 | Lighthouse evidence | Keep if latest production evidence. |
| `lighthouse-landing.json` | 609,021 | Root-level Lighthouse artifact | Cleanup candidate. No current source reference found. |
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

## Cleanup Candidates

No deletes were performed in this audit. The following are candidates to review before removal or relocation.

| Candidate | Confidence | Proposed action | Reason |
| --- | --- | --- | --- |
| `lighthouse-landing.json` | High | Move to `docs/audits/` or delete if superseded | Root-level generated artifact, no app references found. |
| Old generated JSON under `docs/audits/*/01-inventory/` | Medium | Keep latest, compress or archive older runs | Useful evidence but not product runtime. |
| Old Lighthouse JSON/screenshots | Medium | Keep latest per route, move older to archive | Prevent audit evidence from dominating active docs. |
| `docs/_archive/*` very old sprint backlogs | Low | Keep for now, add archive index | Historical source material may still explain decisions. |
| Large monolithic runtime files | High | Refactor, do not delete | Simplifies active app without changing behavior. |

## Do Not Delete Without A Separate Usage Audit

- `backend/`: some routes are not obvious from frontend imports because they are reached through `/api/backend/*` proxies and planned backend lanes.
- `services/` and `cloud_functions/`: keep until deployment and route usage are checked.
- `graphify-out/`: current repo-shape/master-charter audits expect Graphify output.
- Demo constants: Syria, Nordalia, Northwind, CTED, and related fixtures are actively imported by demo routes and tests.
- `docs/codex-prompts/`: these are implementation source prompts and should stay discoverable.

## Recommended Cleanup Order

1. Move or retire root generated artifacts, starting with `lighthouse-landing.json`.
2. Add a docs/audit retention policy so generated JSON does not accumulate without boundaries.
3. Split `src/lib/ai/tools.ts` behind stable exports.
4. Split `src/lib/constants/tool-registry.ts` behind stable exports.
5. Extract the new-situation wizard and dashboard into smaller local modules.
6. Run a backend proxy usage audit before touching `backend/`, `services/`, or `cloud_functions/`.

## Audit Artifacts

- `file-purpose-inventory.csv`: every tracked file, classified by path, area, purpose, status, and suggested action.
- `area-summary.csv`: grouped by product area.
- `top-directory-summary.csv`: grouped by top-level directory.
- `largest-files.csv`: largest tracked files.
- `review-candidates.csv`: files flagged as cleanup, split, archive, or generated-output candidates.
