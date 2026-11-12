# A4_PRAXIS_CLOUD_Work · purpose and practical use

Retain sources, review context capsules and inspect agent-produced policy drafts inside the existing PRAXIS cockpit.

**Role:** Paused workspace / active source.

**Current boundary:** Hosted AI generation and paid upgrades remain paused according to the current README. Historical live receipts retain their dates; this portfolio pass does not resume services.

## Start with one useful workflow

Node 24 and npm were used for this pass. Application accounts, databases and model providers are optional or required as described by the existing project configuration.

```sh
npm ci
npm run typecheck
npm run build
npm run dev
```

These application commands are separate from the teaching demo below. Check the recorded results before treating a command as verified. A successful bundle build does not establish provider availability, authenticated ownership or a working hosted deployment.

## How the code fits together

| Entry point | What to inspect |
| --- | --- |
| [src/app](src/app) | Implementation/data directory for this workflow. Follow the declared types and source identifiers through the relevant route, compiler or view before adapting it. |
| [src/lib](src/lib) | Implementation/data directory for this workflow. Follow the declared types and source identifiers through the relevant route, compiler or view before adapting it. |
| [docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md](docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md) | Project-specific contract, implementation status or setup reference. Preserve its stated limits. |

## Its place in TACITUS

The common goal is reusable, reviewable policy context: sources → explicit structure → task context → draft/artifact → human review. This repository contributes the role described above. Existing schemas, identity systems and review receipts remain authoritative within each implementation. A similar name such as “graph”, “context” or “capsule” does not establish binary or semantic compatibility.

For a downstream adapter, first pin a source/version and rights notice, state the task and output schema, retain attribution and time qualifications, then test export/re-import and refusal cases against the actual destination. No adapter is represented as working merely because the two projects appear in this portfolio.

## Play the idea before running the stack

[The House of Evidence](tacitus-demo/index.html) is an original four-room point-and-click adventure. Preserve a conditional promise, attribute a claim, inspect its chronology and download a brief with the uncertainty intact. It is a synthetic teaching fixture, not a run of this repository’s engine.

```sh
python -m http.server 8765 --bind 127.0.0.1 --directory tacitus-demo
```

Open `http://127.0.0.1:8765/`. The directory is also a standalone static artifact: copy its contents to a static host to publish only the adventure. No model, credential, database or package installation is needed. Opening `tacitus-demo/index.html` directly works in browsers that allow local files.

The shared teaching engine passed desktop (1440×1080) and mobile (390×844) Chromium checks for wrong answers, incomplete-review refusal, exact quotation export, separate notes, reset and horizontal overflow. [Fixture receipt](tacitus-demo/browser-verification.json). This verifies the shared demo, not the application.

## Research, credit and the contribution to evaluate

[Lewis et al., RAG (2020)](https://arxiv.org/abs/2005.11401), [Liu et al., Lost in the Middle (2023)](https://arxiv.org/abs/2307.03172), and [Edge et al., GraphRAG (2024; revised 2025)](https://arxiv.org/abs/2404.16130) motivate separating retrieval, context use and global synthesis. Read the [methods, evaluation limits and TACITUS design notes](https://github.com/sargonxg/sargonxg/blob/main/docs/RESEARCH_AND_DESIGN.md). Their results are not measurements of this repository.

Retain existing licenses and notices for application dependencies and bundled sources. The new adventure code, synthetic dispatches and generated mansion artwork are credited in [tacitus-demo/CREDITS.md](tacitus-demo/CREDITS.md). The demonstration does not relicense this repository or its external source documents.

The practical improvement to test is whether this workflow reduces a specific failure or repeated task: lost attribution, omitted conditions, stale evidence, untraceable drafting or repeated source preparation. Measure that against a matched baseline with source review, complete costs and held-out tasks before claiming analytical or efficiency gains.

## Verification in this pass

Audited default-branch baseline: `1b5d5f195a2aac3e29801b6dd01e188bd39b4c73`. Changes were prepared from a fresh shallow checkout. The audit covers this branch, not every historical or in-progress branch.

| Command | Local result |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm run build` | Passed |
| `npm run audit:architecture-reference` | Passed |
| `npm run audit:gcp` | Failed (exit 1) |
| `node scripts/audit-ai-routes.mjs` | Passed |
| `npm run audit:repo-shape` | Passed |
| `npx --no-install vitest run` | Failed (exit 1) |
| `npm run audit:gate` | Failed (exit 1) |

A failure is a remaining release blocker for the affected workflow. A passing local test is not a new hosted release. Provider/model quality, current external-service setup and production deployment were not certified.

### Standalone demonstration lint boundary

The first branch CI run exposed React-only lint migration rules being applied to the standalone game. The game is now excluded from Next/React ESLint and checked by `verify:demo` through `prelint`: syntax checks plus its three contract assertions run before ordinary application lint. The repaired `npm run lint` passes locally. Existing application/cloud/process-cleanup limits above remain unchanged.

## Reconciliation checkpoint · 11 November 2026

The saved owner-scoped context stack now determines whether a turn carries its capsule; a delayed/missing library summary cannot silently switch that request to Instant Context. The unchanged authenticated emulator context-readiness scenario passes, including create-before-turn, exact requested scope and delayed-history preservation. Linux owned-process cleanup now distinguishes dead zombies from running descendants while still refusing unknown process state and preserving unrelated processes.

Build, TypeScript, lint, repository shape, architecture reference, calibrated-route checks and all 3,265 unit tests pass (one explicit skip). The runtime cloud audit cannot acquire its required Google audit identity in this workspace; this is not a hosted acceptance result. The first complete local emulator attempt passed onboarding, both golden paths and context readiness, but the protected-routes scenario hit a request timeout while concurrent builds were running; the unchanged suite is being rechecked in CI before merge.
