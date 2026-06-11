# PRAXIS — STATUS

## 2026-06-10 — Interactive Dock, Export to Editor, Emerald Coherence (build 2026.06.10.02)

Current product checkpoint:

- The capsule dock now sits at the top of the Ask surface as one compact,
  interactive row: capsule chips with inline detach/make-primary, a readiness
  dot, warnings, and a collapsible provenance detail row. Attach popover also
  offers DIALECTICA/Capsule+ import.
- Assistant answers show PRAXIS augmented-generation activity: triage mode
  (direct answer vs queued agent run), the routed policy agent, and a live
  link to `/agents/{runId}` for timeline, tool calls, and approvals.
- Export to Editor saves an answer's document pack via
  `/api/memos/from-ask-pack` and opens `/app/write?memoId=...` (proxied into
  the memo desk) for word-processor-style editing with citations and
  sourceability gates.
- Capsule repository cards render a deterministic mini graph constellation
  (seeded by capsule id, domain-colored, node/link counts); full graph,
  ontology binding, semantic layers, and tacit knowledge remain in Inspect.
- One emerald identity across pricing, learn, guide, release notes, public
  shell logo, login (rose-gold fully removed), boardroom accents, and the
  shared shell background atmosphere.
- Settings adds a private profile photo (client-side 96px downscale to an
  inline data URL stored on `users/{uid}.photoURL`; no storage-rules change).
- Repo hygiene: tracked dev logs, `artifacts/*.log`, and `output/` removed
  from version control and ignored.

## 2026-06-10 — Verified-Context Home, DIALECTICA Import, Capsule Card Simplification (v6.5.0)

Current product checkpoint:

- The shared public/signed-in home keeps the one-prompt + capsule-deck
  contract and now carries the TACITUS verified-context identity: PRAXIS
  emerald accents, a receipt-first subline ("Every claim has a receipt ·
  every judgment has an author"), mono kickers, and a quiet TACITUS ◳ link in
  the sidebar.
- `POST /api/context/capsules/import/dialectica` imports the published
  `2026-05-15.prx-dialectica-context.v1` DIALECTICA context contract. Claims
  map to the capsule claim ledger (fact → supported/needs_source,
  conflicting_claim → disputed with caveat, evidence_gap → needs_source) and
  source receipts map to capsule source refs; everything stays review-gated
  behind an intake review card. No auto-apply.
- `CapsuleImportButton` accepts DIALECTICA `.json` packages and Capsule+
  `.zip` bundles from the Capsules header and the home context drawer, and
  refreshes the library/stack on success.
- Capsule repository cards are decluttered: duplicate policy-team/domain
  chips and the seven-tile meta grid are gone; cards lead with type, domain,
  quality, sources, and unsupported-claim posture. Dossier, graph-seed,
  GraphLite, and fork diagnostics remain in the Inspect lane.
- Capsule Studio inspection shows a DIALECTICA lineage badge for imported
  capsules; the capsule deck and context drawer mark the primary capsule with
  an emerald rail.
- The signed-in home adds a quiet four-chip "Agentic workflows" row for the
  live agents (Capsule AI, Research Memo Agent, Boardroom Discussion, Output
  Formatter) linking into existing surfaces; planned agents stay out of the
  home surface.
- Verification: `npx tsc --noEmit`, `npm run lint`, full `npx vitest run`
  (305 files, 1306 tests), `npm run audit:release-notes`, and `npm run build`
  all pass locally at build `2026.06.10.01`.

## 2026-05-31 — Five-Session PRAXIS Build Track Checkpoint

What shipped across the five-session track:

- Session 1 made ContextCapsules the core product object with Capsule Studio,
  an interactive living graph, proposal-gated graph edits, review cards, and
  Firestore starter plumbing.
- Session 2 replaced deterministic agent scaffolds with live sourced agent
  phases, sourceability checks, unsupported-claim export gates, proof rail
  streaming, and honest degraded runtime states.
- Session 3 made approvals durable and restart-safe, added real
  research/draft/red-team/revise multi-agent orchestration, and enforced
  per-capsule operating contracts.
- Session 4 made Boardroom live and chaired with per-turn streaming, history,
  registry-backed personas, strict evidence refs, Boardroom Lite consolidation,
  and immutable capsule reads.
- Session 5 rebuilt the public/signed-in entry around policy missions, wired
  billing checkout and Manage billing, updated Learn/legal/trust posture,
  applied the Civic Atelier design pass, added a modular audit runner, and
  wired the authenticated golden-path CI proof gate.

Known remaining gaps:

- `npm run test:auth-runtime` is blocked in this shell because
  `TEST_FIREBASE_EMAIL` and `TEST_FIREBASE_PASSWORD` are missing and ADC needs
  `gcloud auth application-default login --project=praxisbytacitus`.
- The CI golden path is present but will skip until the disposable Firebase
  credentials are configured as secrets.
- Polar checkout is wired; environments without live Polar product ids still
  show sandbox/unconfigured copy honestly.
- Audit orchestration is consolidated through `scripts/audit-runner.ts`, but
  historical leaf audit files remain until docs/tests/runbooks that reference
  them are migrated.

## 2026-05-31 — GraphLite Capsule Graph Integration

Current graph checkpoint:

- Installed/configured the local Rust stable toolchain and `gql-cli` `0.0.1`;
  the installed binary is `graphlite`.
- Added `npm run doctor:graphlite`, which initializes a disposable GraphLite
  database, creates a capsule graph, inserts a capsule node, queries it back,
  and deletes the temporary database.
- Added disabled-first GraphLite bridge contracts for capsule sync and
  provenance-bound advisory recall. Firestore ContextCapsules remain canonical,
  and GraphLite hits are injected only as review-gated advisory context.
- Updated health/feature flags, env examples, and workbench enrichment copy so
  GraphLite is the primary embedded graph label while TrustGraph remains a
  legacy optional compatibility lane.
- Verification so far: GraphLite CLI smoke, `npm run doctor:graphlite`, and
  focused Vitest contracts for GraphLite, context enrichment, context kernel,
  answer envelopes, and Capsule+ export behavior.

## 2026-05-30 — Capsule Research-Dossier Audit Hardening

Current audit checkpoint:

- Fixed the capsule consolidation gate for the current
  `2026-05-30-research-dossier-firestore-proof-v16` starter catalog instead of
  the older v15 consolidation label.
- Reduced the default starter prompt projection to an average of 9,292
  characters while preserving full research dossiers, claim ledgers, human
  workflow examples, source refresh dockets, graph seeds, and review gates in
  the capsule snapshot/data model.
- Added/validated capsule research-dossier and backfill-readiness audits in the
  full `audit:gate` path.
- Verification: focused capsule/workbench Vitest contracts, full
  `npx vitest run` (`274` files, `1181` tests), `npm run lint`, and
  `npm run audit:gate` all pass locally. GCP audit has zero hard failures and
  one soft runtime-proof warning tied to local shell env, not deployed health.

## 2026-05-30 — Ask PRAXIS Context Chat Polish

Current UX checkpoint:

- Rebuilt signed-in `/app` as a chat-first Ask PRAXIS workspace with a
  capsule/context editor pinned above the composer, a relevant workspace
  sidebar, Learn/Changelog links, recent work, and sample cited policy
  artifacts.
- Added `/app/recent-work` as a coherent recent-artifacts page with live
  created-work rows plus PRAXIS sample artifacts and official source links.
- Fixed created-work hydration on the launchpad by reading
  `primaryAction.href`, not only a legacy `href` field.
- Fixed demo session hydration so signed demo sessions accepted by middleware
  are also accepted by the client auth context.
- Local verification: `npx tsc --noEmit`, focused Vitest contracts,
  `npm run lint`, `npm run build`, and Playwright screenshots for public
  home, login, `/app`, `/app/recent-work`, and boardroom prompt prefill.

## 2026-05-30 — Phases 0-1 Verification Checkpoint

Current deploy-readiness checkpoint:

- Full frontend gates are green on the working branch: `npx tsc --noEmit`,
  `npm run build`, `npm run lint`, `npx vitest run`,
  `node scripts/audit-ai-routes.mjs`, `npm run audit:repo-shape`,
  `npm run audit:architecture-reference`, `npm run audit:gcp`, and
  `npm run audit:gate`.
- Graphify was refreshed with `graphify update .`; `graphify-out/graph.json`,
  `graphify-out/GRAPH_REPORT.md`, and `graphify-out/manifest.json` now match
  this checkout.
- Frontend smokes are green: `npm run smoke:app-usability`,
  `npm run smoke:core-flows`, `npm run smoke:authenticated-app`, and the
  authenticated runtime lane.
- The Phase 1 backend database tests were rerun inside Cloud Run against an
  isolated temporary Cloud SQL database with `DATABASE_URL` set; the backend
  command completed with `161 passed, 0 skipped` and the temporary database/job
  were deleted afterward.
- Production canary proof for the already deployed service is healthy; a fresh
  deployment still needs the main-safe Cloud Build/Cloud Run checkpoint and
  live screenshot pass.

## 2026-05-30 — EPIC 1.8 Launch Capsule Seed Set

Current launch-capsule checkpoint:

- Added the ten §10 launch capsules as a stable `capsule/v2` library: conflict
  analysis, sanctions impact, economic policy, mediation readiness, treaty
  review, humanitarian SITREP, election risk, energy/resource security,
  stakeholder decision memo, and OSINT source-to-brief.
- Each launch capsule carries sourcing posture, retrieval posture, guardrails,
  marketplace metadata, golden-set samples, source snippets, and a passing
  dry-run `eval.lastRun`.
- Added idempotent `scripts/seed-capsules.ts` for root `capsules/{id}` writes
  plus immutable `versions/{hash}` writes.
- Verification so far: focused launch-capsule and seed-script Vitest
  contracts, scoped lint, and `npx tsc --noEmit`.

## 2026-05-30 — EPIC 1.7 Capsule Dry-Run Eval

Current eval checkpoint:

- Added deterministic capsule dry-run evaluation in TypeScript and a backend
  Python mirror for computation metrics, citation coverage, schema conformance,
  context recall, safety, and a RAGAS-compatible faithfulness proxy.
- Added authenticated `/api/capsules/eval/dry-run`, returning scores,
  failures, and an `eval.lastRun` patch suitable for the publish gate.
- Replaced the Builder's synthetic eval shortcut with a real dry-run eval call
  that applies the returned patch and shows faithfulness, citation, and schema
  scores.
- The dry-run path performs no external judge call and no live retrieval.
- Verification so far: focused capsule eval Vitest, builder contract Vitest,
  backend capsule eval pytest, scoped lint, and `npx tsc --noEmit`.

## 2026-05-30 — EPIC 1.6 Citation Drafting And Export

Current drafting checkpoint:

- Added TipTap citation editing primitives with a `citation` mark carrying
  source id, claim id, title, and URL attributes.
- Added a compact citation editor that mounts StarterKit, links, placeholders,
  citation marks, and source-card insertion controls.
- Added distinct brief, policy memo, SITREP, talking-points, and decision-memo
  templates with quality gates and sourceability-before-export flags where
  needed.
- Added calibrated `/api/ai/drafting-action` for redraft, expand, tighten,
  tone, and fact-check actions. The route persists tool output and does not
  perform hidden web retrieval.
- Added `/api/export/work-product` for DOCX, PDF, disabled-safe Google Docs,
  and share-link export paths.
- Verification so far: focused drafting/export/action Vitest contracts,
  scoped lint, and `npx tsc --noEmit`.

## 2026-05-30 — EPIC 1.5 Agentic Research Flow And Run Timeline

Current AgentRun research checkpoint:

- Added a backend Genkit/ADK flow skeleton in `backend/ai/flows.py` for
  `plan → source → retrieve → verify → synthesize`, with deterministic dry-run
  helpers and optional AgentRun event persistence callbacks.
- Added claim grounding enforcement for `minSourcesPerClaim` and
  `maxUngroundedClaims` so source gates can block synthesis before unsupported
  claims reach a deliverable.
- Added a Google/Vertex grounding metadata parser that builds inline citation
  maps by walking `groundingSupports` in descending `endIndex` order.
- Added `RunTimeline`, a reusable Firestore `onSnapshot` timeline component
  that surfaces the five research phases and AI SDK stream status.
- Verification so far: focused grounding/run-timeline Vitest contracts,
  backend agentic-flow pytest, scoped lint, and `npx tsc --noEmit`.

## 2026-05-30 — EPIC 1.4 Declarative Sourcing And Retrieval

Current sourcing checkpoint:

- Added a capsule-driven sourcing plan that turns `SourcingPolicy` and
  `RetrievalConfig` into explicit lanes for Google Search grounding, the
  Situation Knowledge Corpus, and Vertex AI RAG Engine corpora.
- Added source connector contracts plus feature-flagged Exa, Tavily,
  Firecrawl, GDELT, ACLED, ReliefWeb, and OpenAlex clients. Vendor and feed
  clients remain disabled by default and require explicit connector flags plus
  Secret Manager-backed environment variables where applicable.
- Added fuse/dedupe/trust-rank logic so capsule retrieval can merge live
  grounding, SKC results, and corpus receipts without duplicate source cards.
- Added a disabled-safe backend Vertex RAG Engine client for
  `retrieveContexts`; it returns an explicit disabled result unless
  `VERTEX_RAG_ENABLED=true`.
- Verification so far: focused sourcing/fuse Vitest contracts, backend Vertex
  RAG pytest, and `npx tsc --noEmit`.

## 2026-05-30 — EPIC 1.3 Capsule Builder Wizard

Current builder checkpoint:

- Added `/app/capsules/builder` as a signed-in Capsule Builder surface with a
  six-step guided wizard for Job, Sources, Output, Tools, Test & evaluate, and
  Publish.
- Added advanced JSON mode with Monaco and a live `capsule/v2` preview for
  technical users while keeping the default path nontechnical.
- Added calibrated `/api/capsules/assist/[action]` routes for persona,
  output-schema, sources, and few-shot suggestions, with tool-output
  persistence when a situation id is present.
- Verification so far: focused builder/assist/static route Vitest contracts,
  capsule lifecycle route tests, and `npx tsc --noEmit`.

## 2026-05-30 — EPIC 1.2 Capsule CRUD API And Storage

Current root capsule store checkpoint:

- Added root Firestore capsule lifecycle storage for `capsules/{id}` plus
  immutable `versions/{hash}` publish snapshots, separate from legacy
  user-scoped context capsules.
- Added authenticated `/api/capsules` create/list, get/update-draft,
  fork, and publish routes.
- Extended Firestore rules so owners can write draft root capsules, public and
  unlisted capsules are readable, org capsules check org claims, and version
  documents remain client-immutable.
- Verification so far: focused storage, route, and rules Vitest contracts plus
  `npx tsc --noEmit`.

## 2026-05-30 — EPIC 1.1 Capsule V2 Schema And Resolver

Current capsule marketplace checkpoint:

- Added the ADR 0050 `capsule/v2` TypeScript type surface, Zod schema, and
  backend Pydantic mirror for lineage, composability, sourcing, retrieval,
  guardrails, eval, provenance, and marketplace metadata.
- Added `resolveCapsule(ref)` for root `capsules/{id}` documents and immutable
  `versions/{hash}` reads, with `extends` and `imports` resolution, merge
  strategies, cycle protection, and a canonical stable `contentHash`.
- Verification so far: focused resolver/schema/backend mirror Vitest contracts
  and `npx tsc --noEmit`.

## 2026-05-30 — EPIC 0.1 Durable AgentRun Hardening

Current runtime checkpoint:

- AgentRun remains canonical in the existing Cloud SQL ledger, with Cloud Tasks
  dispatch and Pub/Sub event publication intact.
- The ledger now mirrors owner-scoped run state into
  `users/{uid}/runs/{runId}` with `events`, `toolCalls`, and `approvals`
  subcollections so the UI can stream the durable run timeline via Firestore
  `onSnapshot`.
- Firestore rules now allow owners to read their own run mirrors while direct
  client writes remain denied; server runtime writes continue through Admin SDK.
- Ask queued-run proof now prefers the Firestore live timeline and falls back
  to the existing SSE stream while Cloud SQL remains the execution ledger.
- Verification so far: `npx tsc --noEmit`, `npm run lint`, `npm run build`,
  focused AgentRun Vitest contracts, and `npm run audit:agent-runtime-proof`.
  The runtime audit passes with local-env warnings for missing live Cloud SQL,
  worker auth/target, model, and ADK variables in this shell.

## 2026-05-30 — EPIC 1.9 Homepage Simplification

Current public/signed-in home checkpoint:

- `/` is now a light public marketing route with one prompt, one primary
  "Start free" action, three capability cards, a marketplace teaser, trust
  strip, pricing strip, and footer.
- The public route no longer imports or renders the cockpit workbench, landing
  workbench preview, created-work fetches, runtime-health semaphore, diagnostics
  strip, app search, or capsule filter facets.
- `/app` now renders a calm signed-in launchpad with one prompt, one capsule
  chip, up to four recent work items, three quiet links, and a collapsed
  "Advanced / Edit context" disclosure for the context model.
- Operator chrome is gated behind `NEXT_PUBLIC_PRAXIS_DEBUG`; legacy workspace
  vocabulary is consolidated toward "Workspace" while `/app/repository`
  remains a redirect into Capsules for compatibility.
- Verification so far: focused Vitest homepage/workbench contracts,
  `npx tsc --noEmit`, `npm run lint`, `npm run build`, and local Playwright
  public-home/mobile/runtime checks. Screenshots are in
  `artifacts/epic-1-9/before-home.png` and
  `artifacts/epic-1-9/after-home.png`.

## 2026-05-30 — Docs, Red Flags, And Improvement Queue

Current documentation/readiness checkpoint:

- Added `docs/README.md` as the current documentation map and
  `docs/audits/README.md` as the audit routing index.
- Added `docs/audits/2026-05-30-red-flags-and-improvement-plan.md` with the
  current red flags, 10 important improvements, and documentation cleanup
  decision.
- Root README, product docs index, and TODO now point at the capsule v15
  posture, current red flags, and consolidation policy.
- No exact duplicate Markdown files were found outside `docs/_archive`; dated
  historical audits are retained as evidence until a later cleanup pass proves
  they are unreferenced.

## 2026-05-30 — Expert Capsule Context V15

Current capsule-content checkpoint:

- The starter catalog is now `2026-05-30-capsule-consolidation-expert-grade-v15`
  with 205 starters across situation, tool, output, and user capsules.
- Every starter is normalized through an expert-use contract before it is used
  by Ask, tools, graph capture, Cognee recall, or drafting surfaces.
- Agent-facing capsule context now explicitly carries active-capsule identity,
  sourceability posture, tacit assumptions, ontology hints, graph proposal
  boundaries, output goal, and human review gates.
- The new expert-grade unit gate requires every starter audit score to be 1.0
  with no source, agent, device, or reviewable audit gaps before the catalog can
  pass.

## 2026-05-30 — Personal Knowledge Board And Active File Polish

Current boardroom/home checkpoint:

- `/app/boardroom` now uses the same simple homepage-style center composer:
  one decision question, one optional context/details box, and one chaired
  AgentRun.
- The boardroom still keeps participants, transcript, proof, and synthesis
  visible, but the first interaction is a personal knowledge board rather than
  a dense agent dashboard.
- Home and Capsule Studio now launch the boardroom as "Your Personal Knowledge
  Board".
- The Active Policy File strip is compacted to file identity, target, source
  posture, open/unsupported counts, review gate, and next action without the
  duplicate low-level capsule framing.

## 2026-05-30 — Capsule Workbench Visualization

Current capsule UX checkpoint:

- Clicking a capsule now surfaces a structured Capsule Workbench instead of a
  scattered inspector-only readout.
- The workbench shows overview, 12-core anatomy, evidence posture,
  graph/ontology structure, tacit knowledge, agent workflow, outputs, and
  review queue state in one reusable panel.
- The readable graph distinguishes canonical nodes from proposed or missing
  items; graph, ontology, source-gap, and advisory-memory changes remain
  review-gated.
- Saved capsule memories load from the existing capsule memories API and appear
  in the tacit-knowledge section so reviewer caveats, assumptions, decisions,
  commitments, and open questions can travel with the policy file.

## 2026-05-28 — Context Capsule Overhaul

Current capsule checkpoint:

- Capsules lazily normalize to v3 on read and new capsules persist as
  `schemaVersion: 3`; Firestore remains canonical.
- Review-card patches are allow-listed, rejection-audited, and applied through
  transactional version snapshots when Firestore transaction support is present.
- Capsule+ export now materializes v3 claims, sources, output contracts, and
  capped memory facts into reviewable graph proposals; import keeps graph rows
  proposed rather than canonical.
- Runtime consumption now reports dropped cores, stale core gates, and
  configurable token budgets. Usage rollups from read receipts feed readiness.
- Cognee remains disabled-first and advisory-only. The backend now defines the
  isolated `praxis-cognee` HTTP client contract, disabled shapes are explicit,
  browser recall can populate non-canonical advisory memory, seed packs can
  create review cards, and the capsule manager exposes a gated recall panel.
- Verified locally: `npm run typecheck`, focused Vitest capsule/runtime/Capsule+
  suite, and Python parse checks for Cognee files. Backend pytest is blocked on
  local Windows `pyicu`/ICU build prerequisites for the backend `uv` environment.

## 2026-05-21 — Product Surface Contract And Canary Audit Repair

Current stabilization checkpoint:

- The repo contract is public Home plus signed-in Home + Capsules. Ask PRAXIS,
  library/source work, memo drafting, canvas, diagnostics, and AgentRun proof
  stay inside the existing cockpit/workbench as panels and actions.
- Legacy signed-in URLs and focused run URLs may redirect or deep-link for
  compatibility, but they are not new primary navigation or new top-level
  signed-in product surfaces.
- `scripts/audit-capsule-depth.ts` now derives its expected starter totals and
  category counts from the live `CAPSULE_STARTER_DEFINITIONS` catalog instead
  of stale hard-coded assumptions. The regenerated audit passes with 69
  starters across situation/tool/output/user categories.
- `doctor:praxis:canary` now has a credential-gated authenticated golden-path
  contract: public Home, Firebase/app session, active canary capsule, Ask
  thread, AgentRun creation/dispatch/worker completion, Memo Studio draft, and
  same-thread receipt. It still blocks honestly when Firebase, Cloud SQL, Cloud
  Tasks, worker auth, or model runtime configuration is missing.
- Early verification for this pass includes capsule-depth, route consolidation,
  release-note, capsule contract, capsule-memory contract, agent-runtime proof,
  agent-process contract, Genkit runtime, Genkit coverage inventory, and the
  focused doctor canary unit test.

## 2026-05-19 — Senior Engineering Cleanup And Naming Hardening

Current cleanup checkpoint:

- Launch readiness was regenerated with live header probes enabled:
  `npm run audit:launch-readiness` now records 41 passing checks, 0 warnings,
  and 0 failures in `docs/audits/2026-05-19-launch-readiness.*`.
- `npm run audit:names` now reports 0 warnings after hidden archive aliases were
  distinguished from live canonical tools: `assistant` is documented as Legacy
  Assistant Chat, `commitments` as Legacy Commitments Monitor, and
  Sourceability uses `Sourceability` as its canonical short label.
- A regression test now guards canonical tool names against hidden archive alias
  collisions in `src/__tests__/consolidated-tools.test.ts`.
- The senior-engineering audit ledger for this pass is
  `docs/audits/2026-05-19-senior-engineering-improvement-audit.md`.
- API route inventory and cleanup-map artifacts now cover 210 routes, classify
  compatibility/staged/admin/runtime posture, preserve agentic runtime lanes,
  and keep deletion candidates at 0 pending stronger evidence.
- Build `2026.05.19.01` closes the static deep pre-ship blockers: 140 PASS,
  1 WARN, 0 BLOCKED. The remaining warning is the allowed Gemini 2.5 fallback
  marker in the central model policy/tests.
- The two retired graph staging endpoints now return archived 410 responses
  with `/api/graph/proposals` as the replacement, so the cleanup map reports 0
  archive candidates and 0 deletion candidates.
- Runtime proof remains structurally guarded, but full live worker proof still
  requires a credentialed shell with Cloud SQL, Cloud Tasks worker URL/auth, and
  Genkit/Vertex runtime configuration.

## 2026-05-17 — Ask PRAXIS Agentic Conversation Runtime

Current runtime checkpoint:

- Central app metadata is now build `2026.05.17.07`.
- Every live Ask PRAXIS turn now builds a deterministic orchestration receipt
  before streaming: triage, ContextCapsule posture, tool routing, approval
  gates, and supervisor decision.
- Ask answer envelopes and persisted thread turns now preserve the
  orchestration receipt alongside source previews, claim grounding, context
  receipt, and Memo Studio document-pack candidate.
- Deep/current/multi-source Ask turns can automatically create and dispatch a
  capsule-bound Research Memo agent run through the existing Cloud SQL/Cloud
  Tasks runtime when the runtime is configured; failures are receipt-visible
  and do not block the direct answer.
- The Ask panel now shows compact orchestration chips for triage, capsule,
  tool-router, approval-gated tools, and queued AgentRun status without adding
  a new app page or navigation item.
- `/app/settings` is now the canonical account/settings hub while older
  settings subpages remain removed from the route surface.
- Starter ContextCapsules now carry domain, source-pack, excerpt,
  source-readiness, suggested-question, next-action, and preferred-agent
  workflow metadata for sustainability, finance, HR, diplomacy, and
  humanitarian-rights workflows.

## 2026-05-17 — Ask PRAXIS Source-Rich Conversation Pack

Current product checkpoint:

- Central app metadata is now build `2026.05.17.06`.
- Ask PRAXIS answer envelopes now normalize uploaded document chunks, Knowledge
  Library corpus records, source receipts, document digests, and grounded fetch
  results into always-visible source preview cards.
- Claim grounding now scores each answer claim against the available source
  preview text instead of assigning the first available sources heuristically;
  unmatched claims stay visibly unsupported for review.
- Ask source previews expose page/chunk locators, source receipt links, and
  text-extraction fallback labels, and follow-up chips now repopulate the
  composer as actionable prompts.
- `/api/memos/from-ask-pack` accepts the richer source-card contract and
  preserves answer text, quote previews, source receipt ids, gaps,
  capsule/context provenance, and generated timestamps in Memo Studio blocks.

## 2026-05-17 — Runtime Proof And Retired GDELT Posture

Current runtime checkpoint:

- Central app metadata is now build `2026.05.17.05`.
- Public `/api/health/runtime` stays sanitized for homepage and non-admin
  settings use: it exposes status, summary, checked time, debug href, check
  labels, check status, and latency only.
- Admin `/api/admin/system-health` remains admin-only and carries endpoint
  detail plus repair guidance after auth.
- `npm run audit:runtime-health-live` verifies production `/api/health`,
  production `/api/health/runtime`, Cloud Run ready revisions for
  `praxis-frontend` and `praxis-backend`, and confirms the retired
  `gdelt-poller` worker pool is absent.
- `pipeline/ingest-gdelt` remains an intentional compatibility no-op so old
  callers receive an acknowledged retired response without recreating or
  redeploying dedicated GDELT workers.

## 2026-05-17 — Operational Agent Workspaces

Current product checkpoint:

- Central app metadata is now build `2026.05.17.04`.
- `/agents/[runId]` is now the canonical private workspace URL for a durable
  capsule-bound agent run on `praxis.tacitus.me`.
- Creating an agent run from the shared cockpit now queues/dispatches the run
  and opens `/agents/{runId}`, where the same PRAXIS workbench focuses the
  selected run, active capsule, run events, tool-call/approval counts, and
  output link.
- Focused run workspaces now poll active runs, can retry failed/cancelled/
  expired runs, can cancel queued/running/waiting-approval runs, and can approve
  or reject pending approvals without introducing a second agent dashboard.
- Research Memo and Output Formatter worker completions now return direct Memo
  Studio links (`/app?panel=memo&memoId=...`) instead of a generic app target.
- `/app/agents/[runId]` redirects to `/agents/[runId]` for compatibility, and
  login/onboarding middleware preserves the deep-link target without creating a
  second app domain or top-level navigation item.
- `npm run audit:agent-process-contract` now guards the route, middleware
  matcher, focused-run workbench wiring, and retry/cancel/approval action
  surface.

## 2026-05-17 — Capsule Agent Lane

Current product checkpoint:

- Central app metadata is now build `2026.05.17.02`.
- `/app` now exposes capsule-bound agents as first-class capsule contents:
  live/queued/planned readiness, risk, slots, allowed tools, and recent durable
  runs are visible from the capsule detail panel and Capsule Map.
- The cockpit can queue a durable Research Memo or Output Formatter run through
  `/api/agents/runs` and dispatch it through the existing worker route when the
  runtime is configured.
- Output Formatter now has a worker path that creates Memo Studio drafts with
  export-readiness, sourceability, and gap-preservation receipts.

## 2026-05-17 — Knowledge Library Backend

Current product checkpoint:

- Central app metadata is now build `2026.05.17.01`.
- PRAXIS now has user-scoped Knowledge Library repositories over the existing
  document ingestion, chunking, embedding, Cloud Storage, and capsule contracts.
- Uploads can carry repository, category, tag, source-note, and multi-capsule
  association metadata without adding a new top-level app page.
- Knowledge documents can be attached to capsules and summarized through a
  Vertex/Gemini structured digest that captures claims, actors, dates,
  causality, human friction, sourceability warnings, and follow-up questions.
- Ask PRAXIS retrieval can use Knowledge Library digests alongside stored
  document chunks.

## 2026-05-16 — Capsule Cockpit Repository And Span Workflow

Current product checkpoint:

- Central app metadata is now build `2026.05.16.14`.
- `/app` now has cockpit sheets/dialogs for capsule building, repository review,
  capsule inspection, and capsule-aware research actions.
- Ask PRAXIS assistant messages expose copy, retry, save-to-capsule, memo, and
  source-check actions.
- Selected text can be attached to Sourceability, Temporality, Causality, Human
  Friction, Rules, or Open Questions through a capsule span API.

## 2026-05-16 — Public Learn And TACITUS Links

Current product checkpoint:

- Central app metadata is now build `2026.05.16.13`.
- `/learn` is restored as a concise public ContextCapsule explainer, not a
  second app surface.
- `/tacitus` now redirects externally to `https://tacitus.me`.
- `/app` and legacy app URLs remain consolidated into the single signed-in
  cockpit.

## 2026-05-16 — Temporal, Causal, And Friction Capsules

Current product checkpoint:

- Central app metadata is now build `2026.05.16.12`.
- PRAXIS now has explicit capsule templates for temporal-causal mapping, human
  friction mapping, and decision-clock work.
- Policy-team presets can seed these capsules when teams need sequence,
  causality, blockers, incentives, stale assumptions, and decision windows.
- The capsule capability map now names Causality and Human Friction as first
  class reasoning areas for Ask PRAXIS and agent handover.

## 2026-05-16 — Capsule Policy-Team Routing

Current product checkpoint:

- Central app metadata is now build `2026.05.16.11`.
- The capsule product contract now has canonical policy-team categories for
  economic/sanctions, diplomacy, security/defence, humanitarian, rights/legal,
  governance, climate/development, information/cyber, crisis/ops, and
  research/strategy work.
- `/app` can create category-seeded ContextCapsules, save category tags through
  the existing capsule API, and attach suggested PRAXIS tools from the capsule
  detail panel.
- The user core library now indexes capsule category tags plus attached
  tool/product ids so capsules are easier to find, filter, and reuse.

## 2026-05-16 — Policy-Team Cockpit Polish

Current product checkpoint:

- Central app metadata is now build `2026.05.16.10`.
- The shared cockpit has a compact policy-team next-action strip for Ask,
  source-check, memo drafting, and handover without leaving `/app`.
- Ask PRAXIS answers render as Markdown so generated text reads like a usable
  policy product with headings, lists, and tables.
- Capsule category editing is now inline on the capsule card instead of using
  browser prompts.

## 2026-05-16 — Capsule Manager Surface

Current product checkpoint:

- Central app metadata is now build `2026.05.16.09`.
- `/app` now exposes the capsule library as the primary signed-in product
  surface: search, category filters, active selection, upload, improve,
  archive, refresh, and capsule metadata all live in the one cockpit.
- Capsule cards show stored ids through the detail panel plus version,
  source/document/tool/output counts, tags, scope, and trust label when
  available.
- Public navigation is narrowed around Home, Learn, Pricing, Release notes, and
  the external TACITUS link.

## 2026-05-16 — One-Page App Consolidation

Current product checkpoint:

- Central app metadata is now build `2026.05.16.08`.
- `/app` is the single authenticated PRAXIS surface; legacy dashboard,
  assistant, contexts, tools, writing, canvas, situations, profile, and settings
  routes redirect there instead of maintaining separate page implementations.
- Public navigation is narrowed to Learn, Pricing, Release notes, and TACITUS
  at `https://tacitus.me`.
- The cockpit keeps the animated TACITUS square mark visible, preserves the
  capsule bar/chat surface, and sends uploaded library documents with the active
  ContextCapsule id for capsule-owned intake.

## 2026-05-16 — Route Cleanup And Cockpit Smoke Alignment

Current cleanup checkpoint:

- Central app metadata is now build `2026.05.16.07`.
- Redundant App Router `/app` page files are removed; legacy `retired user-owned routes` URLs
  continue to redirect through `src/proxy.ts` into `/app/workbench/*`.
- The unused guided-tour component stack is deleted.
- The old dashboard-command-center Playwright smoke is replaced with shared
  PRAXIS cockpit checks for desktop and mobile.
- user-owned fixture verification now validates seed context quality without
  requiring a public `/app/[contextId]` route implementation.

## 2026-05-16 — Release Notes And Build Number Governance

Current release checkpoint:

- Central app metadata is now `PRAXIS v6.4.1` with build number
  `2026.05.16.06` in `src/lib/constants/app-version.ts`.
- `/release-notes` reads from the centralized
  `src/lib/product/release-notes.ts` registry instead of a page-local notes
  array.
- `npm run audit:release-notes` now checks that package version, app version,
  current build number, release registry, release page import, and changelog
  entry stay aligned.
- Significant product/runtime/documentation changes should bump
  `APP_BUILD_NUMBER`, add a release note entry, and update `CHANGELOG.md`.

## 2026-05-16 — Gemini 3.1 Pro Runtime Selector

Current runtime checkpoint:

- The central model matrix now defaults deep reasoning, long-context, and
  writing-quality work to `gemini-3.1-pro-preview`.
- The cockpit selector keeps Gemini 3 Flash Preview as the fast default and
  exposes Gemini 3.1 Pro Preview and Gemini 2.5 fallbacks for model-specific
  runs.
- This follows the current Google Cloud Gemini 3 guidance for global Vertex
  endpoints while keeping the visible app simple.

## 2026-05-16 — Inline Capsule-Aware Discussion

Current runtime checkpoint:

- The shared cockpit bar now starts Ask PRAXIS directly from the dashboard
  without depending on the floating assistant launcher.
- Signed-in runs send the concatenated ContextCapsule stack, selected policy
  tools, output template, user lens, and selected Gemini model to
  `/api/ai/ask-praxis`.
- The dashboard renders the response inline, while public Home keeps the same
  visible surface and routes attempted runs through login handoff.

## 2026-05-16 — Capsule Stack Mechanics And Gemini Choices

Current cockpit checkpoint:

- The capsule rail above Ask PRAXIS is now the single editable stack: users can
  add, change, remove, search, drag/drop, and replace capsules from the library.
- The same popup exposes tool/core toggles so the discussion bar can carry the
  selected capsule stack and selected policy tools together.
- The composer supports Enter to send, Shift+Enter for a new line, and Shift+Up
  to restore the last queued prompt for editing.
- The runtime selector includes Gemini 3 Flash/Pro Preview plus Gemini 2.5
  Pro/Flash/Flash-Lite Vertex fallback options.

## 2026-05-16 — Dashboard And Context Shell Coherence

Current surface checkpoint:

- `/app/dashboard` keeps the same public/auth cockpit surface and no longer
  mounts the bottom-right floating Ask launcher.
- Context Capsule concatenation now lives only in the rail above the Ask bar:
  users can search by capsule name/code, drag/drop capsules, or apply compact
  recipe actions from that one place.
- `/app/contexts` is now the context management and trust surface, focused on
  context health, portable `.core` packages, sharing posture, tool filtering,
  manage-stack controls, and lineage.

## 2026-05-16 — Cockpit Visual Polish And Learn Hub

Current public/app surface checkpoint:

- Public Home and signed-in `/app/dashboard` use the same shared cockpit again;
  the public landing no longer appends separate below-fold marketing sections.
- The cockpit now uses a subtle policy-grid background, rounder capsule and
  composer surfaces, stronger hover motion, and product-language runtime copy.
- Internal labels such as provider grounding, Genkit flow, Agent Engine memory,
  visible token balances, and per-question token cost are removed from the main
  cockpit surface.
- `/learn` is rebuilt as a compact guide with a sidebar and clickable sections
  for Context Capsule cores, ten policy paths, tool families, Output Capsules,
  connectors, and planned scaffolded capabilities.

## 2026-05-16 — First OutputCapsule Product Slice

Current output checkpoint:

- Added the first code-backed OutputCapsule registry under
  `src/lib/output-capsules/` with template metadata, payload schema ids and
  versions, deterministic run planning, quality policy checks, and composition
  helpers.
- Registered the initial daily, country, actor, media, humanitarian, risk,
  governance, diplomatic, talking-points, options-memo, and country-pack
  templates without storing Zod schema objects in Firestore records.
- Bound existing hidden/default tools such as media-roundup, info-environment,
  electoral-risk, peacebuilding-index, scenarios, humanitarian, policy-memo,
  and talking-points to durable output templates through an adapter function.
- The public and authenticated cockpit remain the same shared PRAXIS surface;
  it now includes a compact Produce selector that shows selected output type,
  active capsule, missing cores, and suggested producer steps.
- Live scope is registry/planner/quality/composition/UI affordance only. Real
  persistence of generated OutputCapsules from agent/tool runs remains the next
  runtime wave.

## 2026-05-15 — Aggressive Tasklet Cleanup Checkpoint

Current cleanup checkpoint:

- Full v5 build prompt packs and May 14 Genkit sprint briefs are archived under
  `docs/_archive/build/`.
- Active `docs/build/` keeps short pointer stubs for older references plus the
  current Tasklet runtime docs.
- `/tour` now redirects to `/`, keeping the public product entry on the
  Tasklet-style PRAXIS workbench.
- `retired user-owned routes` remains as redirect/sample-session compatibility until the remaining
  user-owned-copy and smoke-test references are removed.

## 2026-05-15 — Tasklet-Style Login And Welcome Handoff

Current entry checkpoint:

- Public Tasklet-style prompts now store both the prompt and selected
  `policyAgentId`, then route through `/login?mode=signup&redirect=/app/dashboard`.
- The login page now displays the queued PRAXIS policy-agent run and uses
  ContextCapsule agent-workspace language instead of an unrelated platform
  frame.
- Normal sign-in, onboarding skip, and onboarding completion now land on
  `/app/dashboard`, so users see the Tasklet-style Home before deeper Library
  surfaces.
- Authenticated Home reads the saved public prompt and selected policy agent
  from local storage, then clears them once a run is created.
- The welcome modal now teaches the simple visible loop: choose capsule, run
  agent, open output.

## 2026-05-15 — Tasklet-Style Policy Workbench And Research Memo Agent

Current product/runtime checkpoint:

- The homepage first viewport now uses a Tasklet-style PRAXIS workbench:
  left sidebar, big prompt, active ContextCapsule, recent runs, suggested
  policy agents, and approval-gated advanced posture.
- Authenticated Home uses the same shared surface, so the public preview and
  live app no longer diverge.
- The raw tool marketplace is reframed as PRAXIS policy agents with concrete
  destinations: Memo Studio, Canvas, Library, or Handover.
- Added `src/lib/product/policy-agents.ts` as the canonical agent registry for
  Research Memo, Daily Brief, Conflict Monitor, Sourceability Reviewer,
  Red-Team Analyst, and Handover Builder.
- The worker boundary now routes `policyAgentId=research-memo` runs into a
  Research Memo Agent step that creates a Memo Studio draft with source and gap
  receipts instead of only completing as a no-op.
- Added `npm run audit:tasklet-policy-workbench` to guard the Tasklet surface,
  concrete output destinations, deferred integration claims, and memo-worker
  wiring.

## 2026-05-15 — Tasklet-Style MVP Foundation And Cleanup Ledger

Current foundation checkpoint:

- Public navigation now centers the requested product pages: Learn, TACITUS,
  Pricing, and Release notes, with the homepage still acting as the
  prompt-first ContextCapsule entry point.
- Added `/learn`, `/tacitus`, and `/release-notes` so the public site supports
  the Tasklet-style PRAXIS model without sending users into old user-owned-first
  pages.
- `/app/contexts` now includes a capsule composition panel for pick/fork/lock
  and combination-recipe review, keeping complex context assembly inside the
  capsule manager rather than creating another top-level product.
- Pricing copy now describes ContextCapsule workspaces and user/capsule/tool
  value instead of user-owned-era walkthrough packaging.
- Added `docs/audits/2026-05-15-tasklet-mvp-cleanup-ledger.md` and
  `npm run audit:tasklet-mvp-foundation` to keep cleanup evidence-based before
  route/component deletion.

## 2026-05-15 — Ask PRAXIS Capsule AI Readiness Panel

Current Ask PRAXIS checkpoint:

- Ask PRAXIS now shows a compact run-readiness panel beside the composer so
  users can see the active capsule, User Core, Situation Core,
  Sources/Documents state, and Output goal before asking.
- The panel marks Genkit path classification and Sourceability as available
  checks and keeps capsule tool routing visible without adding new run buttons.
- ADK Research Memo agents are labeled as planned behind the queued run ledger;
  the UI does not imply live ADK execution or external tool action.

## 2026-05-15 — Real App Shell Coherence Pass

Current app-surface checkpoint:

- The authenticated app keeps the canonical visible navigation: Home, Ask
  PRAXIS, Library, Memo Studio, Canvas, and Advanced.
- The header now stays focused on breadcrumbs, the command/Ask bar, active
  capsule posture, trust posture, and notifications.
- The sidebar is the single account/profile surface. Its user block now opens
  the Profile/User Core area, while sign out remains in the sidebar footer.
- Home now places the ContextCapsule library directly below the AI bar, then
  follows with the one-click builder and live capsule preview.

## 2026-05-15 — Path-Aware Homepage ContextCapsule Toolbar

Current product checkpoint:

- The homepage AI toolbar now previews a policy path from the shared
  `POLICY_PATH_PROFILES` registry while attempting the authenticated
  classifier route when it is available.
- Visitors can choose the suggested path and output goal before signup, and
  the ContextCapsule preview updates with User Core, Situation Core, Path,
  Sources pending, suggested tools, and selected output.
- Signup/login now preserves the prompt, selected path, and output goal in the
  existing pending-capsule handoff flow. The page stays explicit that no agent
  run or tool execution happens before login.

## 2026-05-15 — ADK Research Memo Bridge Contract

Current backend/runtime checkpoint:

- Added `src/lib/agent-runtime/adk-bridge.ts` as the PRAXIS-owned boundary for
  capsule-aware ADK agent execution.
- The bridge defines ADK agent kinds for deep research, research memo, daily
  brief, and watchlist runs, validates capsule id/risk constraints, and builds
  a ContextCapsule prompt from user, situation, source, output, and memory
  context.
- ADK text, status, source, error, done, and tool-call events can now be mapped
  into durable PRAXIS run-ledger events without replacing the Cloud SQL ledger
  with ADK sessions.
- The first pass is contract-only. It does not call live Agent Engine, execute
  tools, send external messages, promote graph facts, or expose internal
  estimated cost/spend fields.

## 2026-05-15 — Visible AI-Bar Sourceability Wave

Current product checkpoint:

- Public homepage now shows the AI-bar run plan: understand the request, attach
  the active capsule, run capsule-aware tools, and ship to Memo Studio or
  handover.
- Ask PRAXIS now exposes first-click presets for Sourceability Check, Tool
  Plan, and Memo Handoff so the tool layer is visible from the bar.
- The tools repository now includes Sourceability in research and review
  filters, instead of hiding it only in the full canonical list.
- The ADK bridge contract now has a typed prompt/event mapper for capsule-owned
  runs, with approval checks before high-risk ADK actions.

## 2026-05-15 — Sourceability Canonical Tool Wiring

Current tools checkpoint:

- Promoted Sourceability Check into `PRAXIS_CANONICAL_TOOLS` so the AI bar,
  tool library, capsule gates, and recommendation logic can treat the new
  Genkit claim-review route as a first-class capsule-aware tool.
- Sourceability is now boosted for research and reporting stages, where weak
  claims and memo paragraphs most need citation repair before export.
- Capsule-gate coverage now requires source or document evidence before the
  sourceability tool is considered ready.

## 2026-05-15 — Genkit Sourceability Flow

Current Genkit/sourceability checkpoint:

- Added a typed Genkit `sourceabilityFlow` that checks one claim against only
  provided source snippets and returns `supported`, `weak`, `unsupported`, or
  `needs_date_check`.
- The output now includes an explanation, supporting source ids, missing
  evidence, a cautious suggested rewrite, and citation warnings for Memo Studio
  and future capsule-aware agent workers.
- The flow has a deterministic fallback for provider outages and never browses
  the web, mutates graph state, or treats unsupported facts as true.
- Added calibrated `POST /api/ai/sourceability` with `ai_sourceability` credit
  mapping for API use without exposing provider internals.

## 2026-05-15 — Genkit ContextCapsule Path Classifier

Current Genkit checkpoint:

- `classifyPathFlow` now maps homepage/user prompt text into the canonical
  `POLICY_PATH_PROFILES` registry instead of the older route/path taxonomy.
- The flow returns typed capsule defaults: `policyPathId`, confidence,
  suggested User Core, suggested Situation Core, suggested tools, suggested
  outputs, missing-information questions, and alternates.
- The deterministic fallback remains in place for unavailable Genkit/provider
  execution and covers foreign policy, HR policy, legal/compliance, crisis, and
  unclear generic prompts.
- `POST /api/paths/classify` stays authenticated and read-only. It classifies
  prompts only; it does not create capsules, call tools, or claim integrations
  are live.

## 2026-05-15 — Agent Runtime Mirror For Genkit + ADK

Current runtime bridge checkpoint:

- Added `src/lib/agent-runtime/mirror.ts` as the PRAXIS-owned bridge for
  recording worker, Genkit flow, and ADK agent events into the Cloud SQL run
  ledger.
- The no-op worker now emits explicit capsule-context resolution and no-op
  step completion events before terminal success. This proves the worker can
  carry run id, capsule id, selected cores, context package, and trace id into
  future Genkit/ADK execution.
- Added focused mirror tests covering capsule worker context extraction,
  Genkit flow event normalization, ADK event normalization, and text preview
  bounding.
- The implementation is bridge-ready only. Research Memo Agent, live Genkit
  worker execution, and queued ADK Deep Search are still follow-up waves.
- Added two Codex prompts and one Claude Code prompt to the runtime prompt pack
  for Genkit bridge, queued ADK Deep Research, and AI-bar/tools/capsule UX.

## 2026-05-15 — ADK + Genkit Runtime Integration Map

Current architecture checkpoint:

- Added `docs/product/PRAXIS_ADK_GENKIT_INTEGRATION_PLAN.md` to map the
  current ADK and Genkit code into the ContextCapsule runtime.
- ADK is documented as the substrate for long-running, multi-step,
  multi-agent workers, currently represented by the Vertex Agent Engine deep
  research deployment and `/api/ai/deep-search-agent`.
- Genkit is documented as the substrate for typed flows, tools, structured
  outputs, and evals, currently represented by `classifyPathFlow`,
  `situationIntelligenceFlow`, provider resolution, tool registry, and runtime
  audits.
- The boundary is explicit: ContextCapsules remain canonical context,
  Firestore remains capsule/app state, Cloud SQL remains the agent run ledger,
  and every ADK/Genkit event or tool call must be mirrored into PRAXIS-owned
  run records.
- Safe next build is the worker mirror adapter plus the first queued Genkit or
  ADK worker behind the existing Cloud Tasks dispatch boundary.

## 2026-05-15 — Agent Runtime Queues 4-5

Current backend runtime checkpoint:

- Queue 4 API boundary is now library-owned instead of route-local: Zod
  schemas for create/list/get/output live in
  `src/lib/agent-runtime/schema.ts`, and API routes consume those schemas.
- Normal run DTOs expose only `runId`, `status`, `capsuleId`, and
  `createdAt`; internal estimated cost/spend fields remain ledger-only.
- Queued run creation now records a normalized `run.queued` event.
- Queue 4 adds the first capsule-aware agent run ledger contract in
  `src/lib/agent-runtime/`: typed runs/events/tool calls/approvals/triggers,
  selected core ids, trace ids, parent run ids, idempotency keys, hard run caps,
  and internal cost/spend fields.
- The queued-run control plane now includes `POST /api/agents/runs`,
  `GET /api/agents/runs?capsuleId=...`, and
  `GET /api/agents/runs/[runId]`. It creates queued runs only; no model or
  tool execution happens in Queue 4.
- Queue 5 adds the Cloud Tasks dispatch boundary:
  `POST /api/agents/runs/[runId]/dispatch` enqueues an `agent-runs` task, and
  `POST /api/agents/runs/[runId]/execute` is the private worker route.
- The first worker pass is intentionally no-op. It verifies Cloud Tasks OIDC or
  a local shared secret, then records `queued -> running -> succeeded`.
- The no-op worker path is retry-safe for already succeeded runs and now marks
  runs `failed` with a persisted failure transition if the worker step throws
  before terminal success.
- Production runtime verification still needs Cloud SQL, Cloud Tasks queue,
  worker base URL, and worker service-account env wiring.

## 2026-05-15 — Canonical ContextCapsule Agent Runtime Direction

Current product/runtime direction:

- The public landing now makes the usable app path more explicit: the capsule
  prompt bar shows an active-bar glimpse, sign-up/login continuation, policy
  path previews, capsule combination examples, output products, and connector
  posture.
- The policy/statecraft capsule guide is saved in
  `docs/product/CONTEXT_CAPSULE_POLICY_RESEARCH_GUIDE.md`.
- The active implementation ledger is saved in
  `docs/build/PRAXIS_CONTEXT_CAPSULE_APP_BUILD_LEDGER_2026-05-15.md`, and the
  parallel Codex/Claude prompt pack now points agents to that queue first.
- `src/lib/product/context-capsules.ts` now carries the code-backed registry
  for policy paths, outputs, connector ideas, and combination recipes, with
  focused unit tests enforcing internal references.
- PRAXIS is now documented as a ContextCapsule-native, Tasklet-style agent
  workbench for `praxis.tacitus.me`, not a generic automation clone.
- Canonical app structure is saved in
  `docs/product/PRAXIS_CANONICAL_APP_STRUCTURE.md`.
- The implementation blueprint is saved in
  `docs/product/TASKLET_STYLE_PRAXIS_AGENT_RUNTIME_PLAN.md` and enforced by
  `src/lib/product/tasklet-style-runtime.ts` plus focused unit tests.
- Parallel Codex and Claude Code startup prompts are saved in
  `docs/build/PRAXIS_TASKLET_RUNTIME_AGENT_PROMPTS.md`.
- The external Tasklet-class browser-agent research was reviewed and folded
  into `docs/product/TASKLET_RESEARCH_INTAKE_2026-05-15.md` and
  `docs/product/PRAXIS_FOUNDATION_COHERENCE_CHECK_2026-05-15.md`.
- Relevant additions: browser-use plus Steel.dev as the deferred browser lane,
  SSE-first run streaming, run step timeline, pause/cancel/approval UX, hard
  max-step/session/cost caps, idempotency keys, parent-run retries, mandatory
  audit logs, and Langfuse-style tracing as a later observability layer.
- The visible app spine remains Home, Ask PRAXIS, Library, Memo Studio, Canvas,
  and Advanced.
- The production runtime target is Google Cloud native: Cloud Run first, Cloud
  SQL Postgres for the durable agent run ledger, Firestore for capsules and
  active app state, Cloud Tasks for per-run dispatch, Pub/Sub for event fan-out,
  Cloud Scheduler for recurring briefs/watchlists, Vertex AI for model calls,
  Cloud Storage for artifacts, Secret Manager/KMS for secrets, and GKE only
  later for heavy browser/code sandbox pools.
- Next implementation wave is the Cloud SQL Agent Run Ledger: `agents`,
  `agent_runs`, `agent_run_events`, `tool_calls`, `approvals`,
  `agent_triggers`, and document/chunk links back to active capsules.

## 2026-05-15 — Cleanup + Ask Wiring Pass

Current cleanup checkpoint:

- Ask PRAXIS now describes the current 12 canonical capabilities from
  `PRAXIS_CANONICAL_TOOLS` instead of stale hard-coded tool counts or removed
  pages.
- Heavy strategic questions stay inside the simple app spine: Memo Studio,
  Canvas, Ask PRAXIS, Library, and Advanced. Legacy redirects still preserve
  older links, but Ask no longer presents removed pages as live surfaces.
- Deep research is marked as a routed internal Grounded Research capability
  rather than a fake-live `/app/deep-search-agent` page.
- Active context-source copy was cleaned so UCDP/GDELT/ReliefWeb/HDX/UN News
  remain the documented event/source posture. ACLED remains documented only as
  withdrawn/compliance history.
- Context Core Lite remains the available PRAXIS MVP path; DIALECTICA by
  TACITUS remains future/full context creation through the typed adapter
  contract.

## 2026-05-13 — v5 MVP Queue Status

The older v5 queue and pointer stubs were retired during the Tasklet cleanup.
The active tracker is now
`docs/build/PRAXIS_CONTEXT_CAPSULE_APP_BUILD_LEDGER_2026-05-15.md`.

Current local cleanup pass:

- Context creation now has an explicit mode boundary. `Context Core Lite` is
  the available PRAXIS MVP path; `DIALECTICA Core Builder` is shown as coming
  soon and adapter-ready. The contract is documented in
  `docs/architecture/DIALECTICA_PRAXIS_CONTEXT_CONTRACT.md`, with typed guards
  ensuring unsupported gaps and conflicting claims remain review material
  instead of becoming facts.
- Experimental Grafeo Context Core Lite graph capture is now implemented behind
  `PRAXIS_CONTEXT_GRAPH_BACKEND=grafeo_experimental`. The default MVP spine
  remains Firestore capsules/context packages; Grafeo currently provides an
  opt-in deterministic graph mirror, material ingestion path, ontology presets
  for policy/conflict/procurement/humanitarian-access review, visualization
  payloads, and context-core evolution actions. Full context creation still
  belongs to future DIALECTICA by TACITUS work.
- Google Cloud and Firebase auth were refreshed on 2026-05-13. `gcloud`,
  Application Default Credentials, and Firebase CLI all work for
  `giulio@tacitus.me`; `npm run audit:gcp` passed with 0 hard failures and 0
  soft warnings. Live findings and cleanup candidates are recorded in
  `docs/audits/2026-05-13-gcp-firebase-auth-cleanup.md`.
- Landing page is being consolidated around Ask PRAXIS, User Core, Situation
  Core, suggested tools, and memo output. The previous "Live user-owned bar",
  cached-answer CTA, and read-only context CTA are removed from active landing
  copy.
- Public duplicate routes `retired user-owned routes`, `/contexts*`, `/methods*`, `/draft*`, and
  `/users*` are legacy redirects into canonical `/app/*` surfaces rather than
  first-class product pages.
- `audit:mvp-route-shape` now guards the simplified route posture and the
  default sidebar surface.
- Dashboard next moves now persist for authenticated user Situation Cores via
  `/api/workspace/next-moves`; users can mark moves done or dismiss them, and
  Ask PRAXIS responses can add generated follow-up moves directly. Public
  example situations remain local-only.
- Dashboard first-screen copy now makes the standalone MVP moat explicit:
  vetted context, stakeholder read, user judgment, and inheritable policy work
  are visible before the user asks PRAXIS or drafts a memo.
- The authenticated app shell now follows the simplified workbench contract:
  Home, Ask PRAXIS, Library, Memo Studio, Canvas, and Advanced. The persistent
  context bar shows User Core, Situation Core, source count, and deterministic
  context health. Home has a drag/drop Active Context Stack; Ask and Home show
  only three next-best actions; Memo Studio uses a page-like TipTap canvas with
  outline/provenance rails; Canvas is live as a review-gated structure view.
- Active User Core selection, active Situation Core selection, attached
  document IDs, output goal, and Canvas node layout now hydrate through the
  owner-scoped default Active Context Stack. Named multi-stack UX remains a
  follow-up, not a claimed production feature.
- Active Context Stack persistence is now implemented through
  `/api/workspace/context-stack`, stored at `users/{uid}/contextStacks/default`
  with owner-only Firestore rules. user-owned sessions remain non-mutating.
- The "Work on this" action menu is live on core cards, next actions, Canvas
  nodes, and selected Library receipts. Memo Studio now exposes deterministic
  claim-level Evidence Gap Reports with `supported`, `weak`, `unsupported`, and
  `needs_date_check` statuses plus find-source, cautious-rewrite, and
  evidence-gap actions.
- The simplicity design contract is now explicit in `DESIGN.md`: five visible
  primary surfaces, one dominant action per surface, persistent context,
  command-palette-first secondary actions, progressive disclosure, and
  workbench visual rules. The app shell includes a `cmdk` command palette for
  Home, Ask PRAXIS, Library, Memo Studio, Canvas, and core context actions.
- user-owned-to-real conversion now supports the three v5 user-owned Situation Cores:
  Indo-Pacific Strategic Competition 2026, AI Regulation 2026 - US Federal
  and State Landscape, and Food and Beverage Regulatory and Sustainability
  Outlook 2026. The copy endpoint creates a user-owned Situation, structured
  User/Situation/Source/Graph/Output Core records under `users/{uid}/cores`,
  source receipts under the copied Situation, a default active context stack,
  and starter next moves. user-owned copy remains on the older dedicated user-owned path.
- Library source intake now has a visible drop zone backed by the existing
  `/api/documents/upload` and library ingest path. TXT/MD/HTML, PDF, and DOCX
  uploads extract inline, chunk for retrieval, attach document IDs to the
  active Situation Core, and persist structured title/date/source-type,
  key-claim, actor, timeline, and provenance fields. It does not claim Cognee
  is live when the feature flag is disabled.
- Context Canvas now surfaces concrete structure nodes for actors, sources,
  claims, timeline events, and drafts with contextual "Work on this" actions
  and draggable layout persisted in `canvasLayout`. It uses the existing graph
  preview stack rather than introducing React Flow in this pass.
- Focused validation for the simplified shell passed on 2026-05-13:
  `npm run typecheck`, `npm run build`, `npm run lint` with existing warnings,
  `npx playwright test tests/e2e/simplified-workbench-smoke.spec.ts`,
  `npm run audit:mvp-route-shape`, and
  `npm run audit:architecture-reference`.
- Focused validation for the user-owned-core pass passed on 2026-05-13:
  `npm run typecheck`, `npx vitest run src/__tests__/context-health.test.ts`,
  `npx playwright test tests/e2e/simplified-workbench-smoke.spec.ts`,
  `npm run build`, `npm run audit:mvp-route-shape`,
  `npm run audit:architecture-reference`, and `graphify update .`.

Current Phase 9 blockers:

- Persona CI wiring exists, but the "10 consecutive passes" requirement cannot
  be claimed until the workflow has actually produced those runs. Current
  recorded streak: 3/10.
- Checkout/pricing still needs production billing provider configuration and a
  final implementation decision against the current Polar billing routes before
  Phase 9 can close.
- Cognee remains disabled/unconfigured in production by design until the
  separate `praxis-cognee` service is deployed and approved.

Latest production deploy evidence:

- user-owned-core context workbench deploy:
  - Commit `435ca95a` pushed to `main`.
  - Cloud Build `dfc67dd4-1b85-4fc7-b439-c574ceb65d87` succeeded.
  - Cloud Run frontend revision `praxis-frontend-00374-g8v` became ready with 100% traffic.
  - Docs/status alignment commit `90871d59` was also pushed to `main`.
  - Final Cloud Build `3c03bbeb-e055-4d89-befe-8107025c6c32` succeeded from latest `main`.
  - Final Cloud Run frontend revision `praxis-frontend-00376-kqd` became ready with 100% traffic.
  - `https://praxis.tacitus.me/` returned HTTP 200.
  - `/api/health` returned HTTP 200 with Firestore, AI provider, cookie secret, and Vertex ADK healthy; Cognee memory and Polar remain explicitly unconfigured.
  - `/app/dashboard`, `/app/assistant`, and `/app/canvas` returned expected unauthenticated HTTP 307 redirects.
  - Production `npm run smoke:public` passed 4/4 specs against `https://praxis.tacitus.me`.
- Context-first workbench deploy:
  - Command-palette simplicity checkpoint commit `e02245d3` pushed to `main`.
  - Cloud Build `cbebec7f-1800-452a-867e-c78e0e8a11f9` succeeded.
  - Cloud Run frontend revision `praxis-frontend-00370-zjz` became ready with 100% traffic.
  - `https://praxis.tacitus.me/` and `/api/health` returned HTTP 200.
  - `/app/dashboard`, `/app/assistant`, and `/app/canvas` returned expected unauthenticated HTTP 307 redirects.
  - Production `npm run smoke:public` passed 4/4 specs against `https://praxis.tacitus.me`.
  - Commit `a0952e61` pushed to `main`.
  - Cloud Build `c6029035-4419-402e-8ded-4dda6a79809c` succeeded.
  - Cloud Run frontend revision `praxis-frontend-00364-7tc` became ready with 100% traffic.
  - Docs-only follow-up commit `2a410ff4` was also deployed by Cloud Build
    `9ebb37f4-dc28-438a-8603-f7a73d1d2878`; Cloud Run frontend revision
    `praxis-frontend-00366-5vp` became ready with 100% traffic.
  - `https://praxis.tacitus.me/` and `/api/health` returned HTTP 200.
  - `/app/dashboard`, `/app/assistant`, `/app/write`, and `/app/canvas` returned expected unauthenticated HTTP 307 redirects.
  - Production `npm run smoke:public` passed 4/4 specs against `https://praxis.tacitus.me`.
- Landing simplification deploy:
  - Commit `0cd7973f` pushed to `main`.
  - Cloud Build `26b39fd7-1603-47b9-9fe4-d3e87b87dee0` succeeded.
- Context/core-flow improvement deploy:
  - Commit `781b6728` pushed to `main`.
  - Cloud Build `93061520-328b-416e-8bcf-8f970bc21e3e` succeeded.
  - Cloud Run frontend revision `praxis-frontend-00312-9nl` became ready with 100% traffic.
  - `https://praxis.tacitus.me/`, `/contexts`, `/draft`, and `/api/health` returned HTTP 200.
  - Production `npm run smoke:core-flows` passed against `https://praxis.tacitus.me`.
  - Deprecated live GDELT HTTP function and paused legacy Scheduler job were removed; Cloud Run Worker Pool `gdelt-poller` remained `Ready`.
- Cloud Builds `1314022b-3069-44ac-b1d0-f09242e39161` and
  `f78fc2fa-3a86-4194-87e7-3f0033e55595` succeeded.
- Cloud Run frontend revision `praxis-frontend-00308-29d` became ready.
- Final cleanup revision `praxis-frontend-00310-bqx` became ready after Cloud
  Build `337715b7-ec55-4cec-b15b-5511f6861684`.
- `https://praxis.tacitus.me/`, `/api/health`, three public user-owned routes,
  `/pricing`, and `/login` returned HTTP 200.
- Production browser checks across desktop/mobile reported no console
  warnings/errors on the checked routes.
- Production persona smoke passed 6/6 specs, and the final 100% canary monitor
  passed with 0 error rate and p95 latency 192 ms after one cold-start retry.
- Final product QA is recorded in
  `docs/audits/2026-05-11-v5-final-product-qa.md`.

---

## 2026-05-10 — v5 MVP Phase 0

Phase 0 is implemented locally as the v5 build adoption checkpoint, but it is
blocked from commit/push until the existing Pack 22 audit-gate mismatch is
repaired. The repo now treats the v4/v5 vision docs and `docs/build/` execution
ledger as the active MVP build queue.

| Phase | Goal | Status |
|---|---|---|
| Phase 0 | Vision adopt + persona addendum + 4 ADRs | blocked pending gate repair |
| Phase 1 | Ontology layer surfacing + 3 work ontologies + tacitus-ontology MIT package | not-started |
| Phase 2A | Context page shell + 8-panel sidebar | not-started |
| Phase 2B | Document pipeline (Docling + GLiNER + Gemini extraction) | not-started |
| Phase 2C | Research pipeline (Google Grounded + Wikidata) | not-started |
| Phase 2D | Source Tier system + audit | not-started |
| Phase 2E | Episode + Timeline module | not-started |
| Phase 3 | User Models module + 3 seeded personas + capture loop | not-started |
| Phase 4 | Methods marketplace + Top 10 Methods | not-started |
| Phase 5 | Ask homepage + Public landing | not-started |
| Phase 6 | Drafting Studio + 5 templates | not-started |
| Phase 7 | Subagent runtime on Vertex Agent Engine | not-started |
| Phase 8 | user-owned seeding (3 Contexts) + Polish + Ship | not-started |

Phase 0 repo notes:

- The old standalone v4/v5 vision files were removed during the Tasklet cleanup;
  current product/runtime direction lives under `docs/product/`.
- Historical duplicate v5 ADRs were removed during the Tasklet cleanup; current
  architectural decisions are listed in `docs/adr/README.md`.
- The eight v5 audit stubs are intentionally red and are wired only into
  `audit:v5-readiness`, not `audit:gate`.
- `audit:gate` currently fails in existing `audit:pack22-verification` because
  `docs/codex-prompts/PRAXIS_CODEX_22_GCP_GEMINI_VERIFICATION.md` is absent
  after the v4 cleanup/archive pass.

---

## 2026-05-10 — repo cleanup

Removed historical specs, codex prompt packs, V2/Z session intakes,
superseded phase-foundation docs, six orphan one-shot scripts, the
833-line session-log TODO, and the obsolete `gemini-3` blocker. CLAUDE.md
"Model String Discipline" corrected to match `MODEL_MATRIX.json`
(`gemini-2.5-*` is current canon). Agent handoff lists trimmed to the
canonical trinity (architecture bible, live alignment, simplified context
core) plus v7 STATUS.

**Next:** Giulio approves v7 Slice 1; next agent ships it behind a flag.

---

# Historical: PRAXIS Codex Night Pack — STATUS (2026-05-08)

> Morning brief for the 2026-05-08 night-pack pass. This file is intentionally candid: the session resumed with marketplace, calibration, and Cognee honesty changes already present in the dirty tree, so the clean diagnostic baseline requested by `01_DIAGNOSTICS` is not available from this checkpoint.

## Morning Brief

- Prompts completed: `01_DIAGNOSTICS`, `02_MARKETPLACE_HONESTY`, `03_CALIBRATION_INVARIANT`, `04_COGNEE_UI_HONESTY`, `05_CHAPTER_CODE_SPLIT`, `06_LIBRARY_INGEST_CONSOLIDATION` static implementation, `07_ONBOARDING_GATE`, `08_THIN_CASE_CALIBRATION`, `10_ACO_EXPLAINER`, `11_AUDIT_PROMOTION`, `12_HYGIENE` low-risk items, `13_ITERATE_LOOP`, `STATUS_TEMPLATE`, `COMPREHENSIVE_AUDIT` read-only evidence pass, `V2_00_README`, `V2_A0_MT_DATA_MODEL`, `V2_B0_KG_PREFLIGHT` local attempt, `V2_D0_STRUCTURED_EVENTS` static implementation, `V2_D1_KPI_PIPELINE` static assets, `V2_ITERATE_LOOP`, `V2_STATUS_TEMPLATE`, `V2_Z1_EXPORT_E2E`, `V2_Z2_user-owned_TRANSITION`, `V2_Z3_DEEP_RESEARCH_CONSOLIDATE`.
- Prompts deferred: Cloud SQL live row counts from `01` and `V2_B0_KG_PREFLIGHT` are blocked locally by private IP plus missing local `psql`/Cloud SQL Proxy; `V2_A1_ORGID_CONTEXT` through `V2_A6_MT_AUDIT_LOG` are blocked until all MT approval rows below are marked approved or explicitly revised; `V2_B1_DUAL_WRITE_GRAPH` through `V2_B3_RETIRE_FIRESTORE_GRAPH` are blocked until B0 live counts select and approve Case 1/2/3, B1 runs clean for 7 days, and B2 runs clean for 7 days; `V2_C0_COGNEE_LIVE` and `V2_C1_MEMORY_RECALL_IN_CALIBRATION` are blocked because `praxis-cognee` is not deployed in Cloud Run; `V2_C2_AGENT_ENGINE_SUBAGENTS` is blocked pending the deploy-vs-rename decision.
- Recovery loop resolved: `audit:ux-polish`, `audit:workbench`, `audit:evidence-drawer`, `audit:graph-viewer`, `audit:visualization`, `audit:master-charter`, stale Graphify outputs, and withCalibration unit fixture drift.
- Measured deltas:
  - Workbench root JS gzipped: current built workbench initial client JS is `514.2 KB gzip`, guarded by `audit:workbench-bundle` at `520 KB`.
  - Tools chapter density: live user-owned DOM count is 54 interactive controls after opening the closed Recipe library.
  - Prompt-health: thin synthetic case `72/red`, rich user-owned user-owned `94/yellow`, prompt block delta `+2179` bytes for rich.
- Next-session priorities: deploy telemetry and confirm production Cloud Logging emits `praxis.telemetry.*`; run browser E2E for briefing downloads, user-owned copy-to-workspace, and Deep Research Agent fallback stream shape; then wire BigQuery sink/dashboard; run KG preflight from a VPC-connected shell; deploy or provision `praxis-cognee`; runtime document ingest parity and production app smoke remain carried follow-ups.
- Blockers requiring GC: none for the low-risk code changes here; production deployment/commit approval remains separate.

---

## Session Metadata

- Started: 2026-05-08T00:27:51-04:00 checkpoint.
- Branch: `main`
- Last commit at start: `46d8cf1`
- Last commit at end: current `main` HEAD after this status-template pass.
- Total commits this session: `17` including the V2 README pass.
- Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`

## Tasks

| File | Status | Notes |
|---|---|---|
| 01_DIAGNOSTICS | done | Gate attempted and stopped at `audit:ux-polish`; Cloud SQL instance discovered but live counts blocked by missing local `psql`/Cloud SQL Proxy and private IP; bundle, DOM density, prompt-health, Cognee copy, marketplace strings, and surface registry measured. |
| 02_MARKETPLACE_HONESTY | done | Tools chapter is a Recipe library; 53 non-SAT recipes stage hero-tool context; deterministic foundation strings are redacted from UI; stage-target coverage and UI-copy audits are wired. |
| 03_CALIBRATION_INVARIANT | done | All 55 registry tools are tiered (`46` calibrated AI, `9` deterministic structural); deterministic structural tools are labeled; calibrated AI hero routes are audited for `withCalibration`; negative flip test catches `context-builder`; docs updated. |
| 04_COGNEE_UI_HONESTY | done | `/api/health/features` exposes server-derived flags with reasons; Cognee/memory UI copy is gated or neutralized; user-facing memory panel/client removed; Agent Engine subagent labels are hidden unless `VERTEX_AGENT_ENGINE_ID` is set; legacy Cognee audits now enforce the boundary instead of requiring deleted UI. |
| 05_CHAPTER_CODE_SPLIT | done | Six heavy chapters and four substrate tabs are dynamic islands with skeletons; shell/tab modal only mount active children; `audit:workbench-bundle` is wired into gate and now enforces dynamic imports, closed Tools-by-default, skeleton presence, and conditional mounting. |
| 06_LIBRARY_INGEST_CONSOLIDATION | partial | Upload UI now saves and chunks through `/api/documents/upload`, passes the returned `documentId` into backend Library ingest, and reports source-receipt deferral honestly. Static parity audit and ingest parity doc added. Runtime upload -> source receipt -> hero-tool retrieval verification still not run. |
| 07_ONBOARDING_GATE | done | Shared onboarding helper gates calibrated routes, client auth state, and server cookie onboarding resolution; post-login redirect and Next proxy route incomplete/stale-claim profiles to `/onboarding`; completion refreshes signed session claim; workbench banner and profile edit link are wired; audit expanded. |
| 08_THIN_CASE_CALIBRATION | done | `/api/context/prompt-health` exposes prompt health; calibrated routes append `<context-quality>` below 80 and refuse below 30 unless `forceRun` is true; prompt-health badge and run-anyway help panel are wired into shared AI generation UI and the direct Executive Intelligence panel; `audit:thin-case-handling` is in gate. |
| 09_EMBEDDING_DIMENSION | done | Canonical constants added for `text-embedding-005` at 768d; Firestore vector writes stamp model/dimension; Postgres migration `0012_embedding_dim_alignment.py` supersedes legacy `vector(1536)`; `EmbeddingRepo` validates query vector length; `audit:embedding-dim` now checks config, model matrix, migration, Cognee guard, and repo validation. Live migration remains gated by `SELECT count(*) FROM graph_embeddings`. |
| 10_ACO_EXPLAINER | done | Added the 14-entity ACO copy source of truth, first-case overlay with localStorage dismissal, permanent Ontology-tab reference button, onboarding mention, and `audit:aco-parity` in `audit:gate`. |
| 11_AUDIT_PROMOTION | done | Audit pass messages now carry tier labels, runtime-proof variants exist for KG drift, Cognee, owner scoping, and tool-context isolation, `audit:gate-with-cloud` and `audit:gate-runtime-full` are wired, runtime audits skip without opt-ins, and `docs/audits/README.md` documents the taxonomy. |
| 12_HYGIENE | done | `background_jobs` global reads now admin-only; surface registry coherence audit includes tabs, chapters, and visible hero tools; deleted memory UI files stayed deleted; forbidden legacy model string grep returned 0; committed-secret grep found no leaks beyond env/config references; lint baseline recorded at `98` problems before this cleanup. |
| 13_ITERATE_LOOP | done | Recovery loop applied until `audit:gate` passed; fixed UX smoke markers, redirect-only visible route counting, evidence drawer immediate-run markers, lazy graph audit expectations, stale Graphify output, and withCalibration unit fixtures. |
| STATUS_TEMPLATE | done | Root `STATUS.md` now conforms to the template contract with morning brief, metadata, baselines, pre-existing audit failures, per-prompt notes, blockers, and next-session notes. |
| V2_00_README | done | Preserved the PRAXIS V2 institutional-foundations README under `docs/codex-prompts/`; audited the precondition as green; next executable prompt is Session A `A0_MT_DATA_MODEL.md`. |
| V2_A0_MT_DATA_MODEL | done | Created `docs/architecture/MULTI_TENANT_MODEL.md`, recorded current single-user state, preserved A0-A3 prompts, and added the required MT approval gate. |
| V2_A1_ORGID_CONTEXT | blocked | Must not start until MT-1 through MT-5 are approved or explicitly revised by GC. |
| V2_A2_COLLABORATORS_SCHEMA | blocked | Depends on A1 and the MT approval gate. |
| V2_A3_FIRESTORE_RULES | blocked | Depends on A1, A2, migration confirmation, and security tests; no rules changes made in A0. |
| V2_A4_TEAM_INVITE_FLOW | blocked | Depends on A1 org context, A3 invitation rules, and invite token secret/email deploy decisions. |
| V2_A5_ROLE_PILLS_AND_GUARDS | blocked | Depends on A2 effective-role helpers and A3 server/rules enforcement. |
| V2_A6_MT_AUDIT_LOG | blocked | Depends on A1 org context, A3 audit-log rules, and state-changing route mapping. |
| V2_B0_KG_PREFLIGHT | blocked | Local preflight documented at `docs/audits/2026-05-08-POSTGRES_KG_PREFLIGHT.md`; Cloud SQL instance is private-IP and local shell lacks `psql` plus Cloud SQL Auth Proxy. |
| V2_B1_DUAL_WRITE_GRAPH | blocked | Must not start until B0 records live row counts, latency, schema/index health, selected Case 1/2/3, and approval. |
| V2_B2_READ_PATH_POSTGRES | blocked | Must not start until B1 has run for at least 7 production days with `KG_DUAL_WRITE=true`, parity drift is below 5%, backlog is near-empty, and B0 latency is acceptable. |
| V2_B3_RETIRE_FIRESTORE_GRAPH | blocked | Must not start until B2 has run for at least 7 production days with Postgres reads, shadow drift is below 0.1%, telemetry is over 99% Postgres, and GC explicitly signs off. |
| V2_C0_COGNEE_LIVE | blocked | `praxis-cognee` Cloud Run service is not present in `praxisbytacitus`; repo also lacks `infrastructure/cloudrun/praxis-cognee/`. |
| V2_C1_MEMORY_RECALL_IN_CALIBRATION | blocked | Depends on C0 smoke-green with `COGNEE_ENABLED=true`; must not wire memory recall into calibration before live Cognee exists. |
| V2_C2_AGENT_ENGINE_SUBAGENTS | blocked | No `VERTEX_AGENT*` secrets or visible Agent Engine CLI surface; decision required: Option A deploy real artifacts or Option B rename subagent claims to calibrated pipeline. |
| V2_D0_STRUCTURED_EVENTS | done | Typed schema, server emitter, browser intake, critical route hooks, 1KB details cap, unit test, docs, and `audit:telemetry-coverage` added. |
| V2_D1_KPI_PIPELINE | partial | BigQuery views/queries, deploy helper, alert definitions, KPI/dashboard docs, and `audit:bq-views` added; live sink/dashboard verification waits for production D0 events. |
| V2_ITERATE_LOOP | done | Preserved `ITERATE_LOOP.md` as a V2 control prompt, registered it in `audit:codex-prompts`, and kept the recovery playbook available for future audit/test failures. |
| V2_STATUS_TEMPLATE | done | Preserved `STATUS_TEMPLATE.md` as a V2 control prompt, registered it in `audit:codex-prompts`, and reconciled its required operational-step structure with this richer status ledger. |
| V2_Z1_EXPORT_E2E | partial | Briefing export structure, telemetry hooks, client progress, prompt preservation, and `audit:export-coverage` are built; live browser download and Cloud Logging telemetry confirmation remain deployment gates. |
| V2_Z2_user-owned_TRANSITION | partial | Public user-owned copy CTA, authenticated `/api/situations/copy-from-user-owned`, canonical graph seed, workspace banner, prompt preservation, and `audit:user-owned-claim` are built; authenticated production copy smoke remains a deployment gate. |
| V2_Z3_DEEP_RESEARCH_CONSOLIDATE | partial | `/api/ai/deep-search-agent` is canonical, `/api/ai/deep-research` is soft-deprecated with the same SSE envelope, active consumers point to the canonical route, tool docs regenerated, and `audit:deep-research-canonical` is in gate; D1 p50/p95/cost/failure metrics remain unavailable locally. |
| COMPREHENSIVE_AUDIT | done | Read-only audit saved at `docs/audits/2026-05-08-CODEBASE_AUDIT/`; generated 44+ evidence artifacts plus the source prompt, mapped deletion/consolidation/refactor candidates, and intentionally executed no source deletions per the prompt's hard rule. |

Status legend: `not_started`, `in_progress`, `partial`, `done`, `deferred`, `blocked`.

## Approvals Required

These rows gate PRAXIS V2 Session A. A1-A6 cannot start until all five rows are
marked `approved` or `revised: <alternative>`.

| decision | option | approved_by | timestamp |
|---|---|---|---|
| MT-1 org model | A (implicit self-org) | pending GC | |
| MT-2 case ownership | C (user-owned, org-scoped) | pending GC | |
| MT-3 roles | owner/editor/viewer/commenter | pending GC | |
| MT-4 invite | email + direct add | pending GC | |
| MT-5 migration | lazy script | pending GC | |

## B0 KG Preflight Approval

| decision | status | approved_by | timestamp |
|---|---|---|---|
| B0 KG preflight | blocked: live SQL counts and latency not measured from local shell | pending GC | |

## C2 Agent Engine Decision

| decision | recommended option | status | approved_by | timestamp |
|---|---|---|---|---|
| C2 Agent Engine subagents | B (rename labels to calibrated pipeline unless GC explicitly chooses deploy) | pending GC | | |

## Pending Operational Steps

| id | prompt | step | command | who | status |
|---|---|---|---|---|---|
| OP-001 | V2_A1_ORGID_CONTEXT | Approve MT-1 through MT-5 before org context work starts | Update the `## Approvals Required` rows in this file with `approved` or a revised option | GC | pending |
| OP-002 | V2_B0_KG_PREFLIGHT | Run live Postgres graph counts from a VPC-connected shell | `psql "$PRAXIS_DATABASE_URL" -f docs/audits/2026-05-08-POSTGRES_KG_PREFLIGHT.sql` or run the equivalent queries in Cloud Shell | GC | pending |
| OP-003 | V2_C0_COGNEE_LIVE | Deploy/provision `praxis-cognee` and bind service-to-service auth | Follow `docs/codex-prompts/PRAXIS_V2_C0_COGNEE_LIVE.md`; expected checks include `gcloud run services describe praxis-cognee --region=us-east4 --project=praxisbytacitus` | GC | pending |
| OP-004 | V2_C2_AGENT_ENGINE_SUBAGENTS | Choose Agent Engine subagent posture | Mark C2 as Option A deploy or Option B rename in `## C2 Agent Engine Decision` | GC | pending |
| OP-005 | V2_D1_KPI_PIPELINE | Create the D1 BigQuery dataset after D0 telemetry is deployed | `bq --project_id=praxisbytacitus mk --dataset praxis_telemetry` | GC | pending |
| OP-006 | V2_D1_KPI_PIPELINE | Create/update the D1 Cloud Logging sink for structured telemetry | `gcloud logging sinks create praxis-telemetry-sink bigquery.googleapis.com/projects/praxisbytacitus/datasets/praxis_telemetry --log-filter='jsonPayload.message:"praxis.telemetry."' --project=praxisbytacitus` | GC | pending |
| OP-007 | V2_D1_KPI_PIPELINE | Deploy D1 KPI views after sink rows exist | `PROJECT_ID=praxisbytacitus infrastructure/bigquery/deploy-views.sh` | GC | pending |

## Baselines And Checks

### audit:gate composition

`audit:gate` currently includes 69 `npm run audit:*` commands. Full gate passed on 2026-05-08 after the iterate-loop recovery pass.

| audit | status | tier | notes |
|---|---|---|---|
| typecheck | pass | runtime-build | `tsc --noEmit` completed. |
| build | pass | runtime-build | `next build` completed; 197 app pages generated. |
| audit:routes | pass | static-marker | `66 AI route files, 66 calibrated, 5 exempt.` |
| audit:architecture-chain | pass | static-marker | `47 §19 npm scripts accounted for.` |
| audit:architecture-reference | pass | static-marker | `ok`. |
| audit:ai-provider-isolation | pass | static-marker | `ok`. |
| audit:ai-provider-vertex-default | pass | static-marker | `ok`. |
| audit:model-matrix-coverage | pass | static-marker | `7 task kinds.` |
| audit:runbook-bundle | pass | static-marker | `17 Pack 22 runbooks.` |
| audit:pack22-verification | pass | static-marker | `passed`. |
| audit:observability-coverage | pass | static-marker | `ok`. |
| audit:telemetry-coverage | pass | static-marker | Added for D0 structured events; validates schema, emitter, browser intake, core emit sites, and 1KB details cap. |
| audit:ux-polish | pass | static-marker | Workbench smoke now asserts the Recipe library and Memo Studio surfaces. |
| audit:no-deterministic-tool-output-in-ui | pass | static-marker | Prevents `deterministic-foundation`, `foundation-run`, and `marketplace-foundation-v1` from visible UI. |
| audit:hero-tool-calibration-coverage | pass | static-marker | Checked 12 visible hero tools and catches deterministic/calibrated mismatches. |
| audit:thin-case-handling | pass | static-marker | New gate for prompt-health endpoint, `<context-quality>` compensation, 422 refusal, and UI run-anyway handling. |
| audit:cognee-ui-honesty | pass | static-marker | Verifies Cognee/memory copy is not exposed by default-disabled UI and marketplace subagent pills are feature-gated. |
| audit:surface-registry-coherence | pass | static-marker | Ensures product surfaces are reachable through tabs, chapters, or visible hero tools. |
| audit:workbench-bundle | pass | build-output | Measured current workbench initial client JS at `511.4 KB gzip` with a `520 KB` budget; also enforces dynamic chapter/tab imports and active-only mounting. |
| audit:library-ingest-consolidation | pass | static-marker | Ensures upload UI calls both document save and backend ingest paths and passes `documentId`. |
| audit:document-ingest-parity | pass | static-marker | Guards visible Library upload order, `documentId` handoff, canonical upload route, and backend metadata retention. |
| audit:graph-viewer | pass | static-marker | Verifies the graph tab routes through lazy `WorkbenchGraphPanel`, which renders `PraxisGraphView`. |
| audit:visualization | pass | static-marker | Verifies visualization-wave graph surfaces follow the current lazy tab path. |
| audit:master-charter | pass | static-marker | Graphify outputs refreshed at current commit. |
| audit:bq-views | pass | static-marker | Added for D1 KPI pipeline assets; validates BigQuery SQL, alert definitions, docs, and gate membership. |
| npm test | pass | runtime-test | 146 files and 573 tests passed. |
| audit:gcp | pass | runtime-proof | Hard failures 0, soft warnings 0. |
| audit:gcp-production-posture | pass | runtime-proof | Hard failures 0, soft warnings 3: inherited public-access prevention, Terraform state bucket permission denied, and Cloud Armor policy warning. |

### Verification Commands Run

| command | result |
|---|---|
| `npm run typecheck` | pass |
| `npm run build` | pass |
| `npm run audit:surface-registry-coherence` | pass |
| `npm run audit:workspace-tabs-chapters` | pass |
| `npm run audit:no-deterministic-tool-output-in-ui` | pass |
| `npm run audit:stage-target-coverage` | pass, 53 non-SAT recipes staged |
| `npm run audit:cognee-ui-honesty` | pass |
| `npm run audit:cognee` | pass |
| `npm run audit:cognee-operations` | pass |
| `npm run audit:hero-tool-calibration-coverage` | pass |
| `npm run audit:thin-case-handling` | pass |
| `npm run audit:library-ingest-consolidation` | pass |
| `npm run audit:document-ingest-parity` | pass |
| `npm run audit:workbench-bundle` | pass, `511.4 KB gzip` |
| `npm run audit:embedding-dim` | pass |
| `npm run audit:telemetry-coverage` | pass |
| `npm run audit:bq-views` | pass |
| `npm run audit:codex-prompts` | pass, V2 prompts A0-A6, B0-B3, C0-C2, D0-D1, Z1-Z3, and control prompts included |
| `npm run audit:v2-prompt-pack-completion` | pass, all V2 prompts preserved, status rows present, blocker gates explicit, and D/Z guard audits in `audit:gate` |
| `node docs/audits/2026-05-08-CODEBASE_AUDIT/generate-audit.mjs` | pass, generated comprehensive audit evidence and cleanup plan |
| `npx --yes madge --ts-config tsconfig.json --circular src` | pass, no circular dependency found |
| `npx --yes depcheck --json` | findings captured, expected nonzero audit result |
| `npx --yes knip --reporter json` | findings captured, expected nonzero audit result |
| `npx --yes jscpd src backend --reporters json` | pass, clone report captured |
| `npm run test -- tests/unit/lib/telemetry/emit.test.ts` | pass, 2 tests |
| `npm run audit:ai-provider-isolation` | pass |
| `npm run audit:model-matrix-coverage` | pass |
| `/api/health/features` direct route smoke | pass, defaults off; env flip enables `cognee`, `postgresKg`, and `agentEngineSubagents` |
| `npm run audit:gate` | pass after iterate-loop recovery |
| `npm run audit:gate` | partial rerun on 2026-05-08: passed through `audit:codex-prompts`, stopped at stale Graphify; `graphify update .` refreshed 5843 nodes, 9952 edges, 834 communities; failed tail then passed. |
| `npm run audit:onboarding-gate` | pass |
| `npm run audit:workbench` | pass; redirect-only compatibility shims no longer count as visible app pages |
| `npm run audit:ux-polish` | pass; smoke spec now covers Recipe library and Memo Studio |
| `npm run audit:evidence-drawer` | pass; immediate SAT artifact sources remain visible while deterministic markers stay redacted |
| `npm run audit:graph-viewer` | pass |
| `npm run audit:visualization` | pass |
| `npm run audit:master-charter` | pass after Graphify refresh |
| `npm run test` | pass, 147 files and 575 tests |
| `graphify update .` | pass, latest rebuild 5887 nodes, 10024 edges, and 829 communities; HTML skipped because the graph exceeds the 5000-node render limit |

### Postgres KG Live Counts

- Cloud SQL instance discovered: `praxisbytacitus-instance`, `POSTGRES_16`, `us-east4`, `db-f1-micro`, private IP `10.101.0.3`.
- `graph_nodes total`: blocked.
- `graph_nodes real_user_rows`: blocked.
- `graph_edges total`: blocked.
- `graph_embeddings total`: blocked.
- `graph_audit total`: blocked.
- Blocker: local shell has no `psql` and no `cloud-sql-proxy`; instance is private-IP. The attempted `gcloud sql connect ... -- -c` path is not supported by this local `gcloud sql connect` command.

### Bundle Baseline

- Current `/app/workbench/[caseId]` initial client JS raw: `1748.4 KB` across 18 client chunks.
- Current `/app/workbench/[caseId]` initial client JS gzipped: `511.3 KB`.
- Per-chapter chunks: Turbopack chunk filenames are hashed in the route client-reference manifest, so per-chapter attribution was not recoverable from filenames. Static lazy-loading audit confirms chapter islands.
- Chapters lazy-loaded: `6/6` (`ResearchTab`, `MemoStudio`, `DraftTab`, `ACHIndex`, `ToolMarketplace`, `BoardroomIndex`).
- Substrate tabs lazy-loaded: `4/4` (`ContextTab`, `LibraryTab`, `OntologySchemaViewer`, `WorkbenchGraphPanel`).

### Tools Chapter Density

- Runtime path: local production server on `localhost:3032`, user-owned session cookie, `/app/workbench/user-owned-2026`, opened the closed `Tools` chapter.
- Container: `[data-testid="tool-marketplace"]`.
- Heading: `Recipe library`.
- Buttons: `51`.
- Links: `1`.
- Selects: `1`.
- Inputs: `1`.
- Role buttons: `0`.
- Total interactive: `54`.

### Prompt-Health Baseline

- Thin synthetic case: `72/red`.
- Thin missing/weak layers: no source/document evidence, thin graph, no retrieved chunks or episodes.
- Rich user-owned user-owned case: `94/yellow`.
- Rich finding: freshness warning, `Situation context has not been refreshed in 6 day(s).`
- Prompt block bytes: thin `3022`, rich `5201`, delta `+2179`.
- Prompt files written for this diagnostic run: `%TEMP%\prompt-thin.txt`, `%TEMP%\prompt-rich.txt`.
- Caveat: the one-shot diagnostic used the same deterministic context-health path and prompt renderer, not live Firestore-backed `buildCalibratedContext`; Firestore Admin was unavailable in the local shell.

### Cognee Copy Inventory

- Files with Cognee/memory strings under `src/components` and `src/app`: `9`.
- Distinct matching lines: `59`.
- Components/routes: `MemoStudio`, `ResearchTab`, `LibraryTab`, `DocumentUploadInline`, `GraphIntelligencePanels`, notification settings, `/api/health`, `/api/health/features`, `/api/memory/[...slug]`.
- `/api/health/features` cache: 60s.
- Cognee flag semantics: enabled only when `COGNEE_ENABLED === 'true'` and `COGNEE_BACKEND_URL` is configured.
- `MemoryPanel.tsx` and `src/lib/memory/client.ts` removed.
- `audit:cognee-ui-honesty`: pass.

### Marketplace Deterministic Output

- `audit:no-deterministic-tool-output-in-ui`: pass.
- Non-SAT recipes now stage hero tool context instead of presenting deterministic foundation runs as AI-backed output.
- `rg 'deterministic-foundation|foundation-run|marketplace-foundation-v1' src/components src/app -n`: `0` locations.

### Surface Registry Orphans

- `audit:surface-registry-coherence`: pass.
- Counts: product surfaces `8`, tabs `4`, chapters `7`, visible hero tools `12`.
- In product surfaces but unreachable: `[]`.
- Reachable but not in product surfaces: `['ontology', 'memos', 'ach']`.
- Allowed non-product registry surfaces: `ontology` tab, `memos` chapter, `ach` chapter.

### Hygiene Baseline

- `background_jobs` client read path is user-scoped via `where('uid', '==', uid)` in `useBackgroundJobs`; admin/operator and job-service paths use Admin SDK or backend service credentials.
- `MemoryPanel.tsx`: absent.
- `src/lib/memory/client.ts`: absent.
- Forbidden legacy model string grep: `0` matches in `src/` and `backend/`.
- Secret marker grep: no committed API secrets; matches are env/config diagnostics only.
- Dated TODO sweep: `0` matches for `TODO(20xx)` in `src/` and `backend/`.
- Lint baseline before the focused cleanup: `98` problems (`2` errors, `96` warnings); after the two focused registry fixes: `96` problems (`0` errors, `96` warnings). No broad `--fix` was run.

## Pre-existing Audit Failures Surfaced This Session

| audit | failure | session of fix |
|---|---|---|
| audit:ux-polish | Workbench smoke spec missing `tool-marketplace` and `Memo Studio` coverage. | fixed in `13_ITERATE_LOOP` |
| audit:workbench | Visible app route count included redirect-only compatibility shims. | fixed in `13_ITERATE_LOOP` |
| audit:evidence-drawer | Immediate SAT run artifact sources were redacted too aggressively for the evidence audit. | fixed in `13_ITERATE_LOOP` |
| audit:graph-viewer / audit:visualization | Static audits expected the old direct graph viewer import path instead of the lazy `WorkbenchGraphPanel` route. | fixed in `13_ITERATE_LOOP` |
| audit:master-charter | Graphify outputs were stale against the current codebase. | fixed in `13_ITERATE_LOOP` |
| npm test | withCalibration unit fixtures lagged current `withContextAware` and onboarding profile contracts. | fixed in `13_ITERATE_LOOP` |

## Failures And Recoveries

| task | date | failure | ITERATE_LOOP pattern | recovery | result |
|---|---|---|---|---|---|
| V2_D0_D1 | 2026-05-08 | `audit:gate` stopped at `audit:master-charter` because Graphify output was stale after telemetry/KPI changes. | Pattern 1 — failing audit/test | Ran `graphify update .`, then reran the failed gate tail from `audit:master-charter` through GCP posture. | success; tail passed and Graphify now reports 5843 nodes, 9952 edges, 834 communities. |
| V2_ITERATE_LOOP_STATUS_TEMPLATE | 2026-05-08 | No runtime failure; control prompts were not preserved in `docs/codex-prompts/` or enforced by `audit:codex-prompts`. | Pattern 10 adjacent — operational/control step would be lost without a status row | Preserved both files, added marker-specific audit checks, and added `## Pending Operational Steps`. | success; `audit:codex-prompts` should now guard both control prompts. |

## Per-Prompt Notes

### 01_DIAGNOSTICS

- Completed: 2026-05-08.
- Commits: `c16dcd7`, plus baseline hardening already present in `879871a`.
- Diagnostic output: captured gate composition, Cloud SQL reachability, bundle size, Tools density, prompt-health deltas, Cognee copy inventory, marketplace deterministic strings, surface registry coherence, and hygiene baselines.
- Issues encountered: live Cloud SQL row counts blocked by private IP plus missing local `psql`/Cloud SQL Proxy.

### 02_MARKETPLACE_HONESTY

- Completed: 2026-05-08.
- Commit: `c2d2b6f`.
- Stage targets populated: `53` non-SAT recipes staged into hero tools.
- Hero staging behavior: non-SAT marketplace recipes stage context instead of firing a marketplace POST; SAT recipes retain their existing routing.
- audit:no-deterministic-tool-output-in-ui: pass.

### 03_CALIBRATION_INVARIANT

- Completed: 2026-05-08.
- Commit: `cbca72e`.
- Tier field on visible hero tools: yes.
- audit:hero-tool-calibration-coverage: pass for 12 visible hero tools.
- Doc updated: yes, `docs/CONTEXT_INJECTION.md` now states the calibrated-ai hero route contract instead of overclaiming every authenticated AI request.

### 04_COGNEE_UI_HONESTY

- Completed: 2026-05-08.
- Commit: `ac4683f`.
- `/api/health/features` endpoint live: yes, with 60s cache semantics.
- Components gated: Research, Library, upload, Memo Studio, graph intelligence, notifications, and new-situation copy.
- MemoryPanel deleted: yes; `src/lib/memory/client.ts` deleted; boundary files remain.
- audit:cognee-ui-honesty: pass.

### 05_CHAPTER_CODE_SPLIT

- Completed: 2026-05-08.
- Commit: `1e4b651`.
- Chapters lazy: `6/6`.
- Substrate tabs lazy: `4/4`.
- Bundle gzipped result: `514 KB` against a `520 KB` budget in the latest gate.
- audit:workbench-bundle: pass.

### 06_LIBRARY_INGEST_CONSOLIDATION

- Completed: 2026-05-08 as a static implementation; runtime ingest remains deferred.
- Commit: `44594cd`.
- DocumentUploadInline calls both endpoints: yes.
- Document on a fresh case retrievable by RAG: not runtime-verified yet.
- audit:document-ingest-parity: pass.

### 07_ONBOARDING_GATE

- Completed: 2026-05-08.
- Commits: `b3193c7`, `4b403ee`.
- `/login/callback` redirects incomplete profiles: yes.
- Middleware/proxy enforces incomplete profile routing: yes.
- Cookie includes onboardingComplete resolution: yes, via refreshed signed session claim after completion.
- audit:onboarding-gate: pass.

### 08_THIN_CASE_CALIBRATION

- Completed: 2026-05-08.
- Commit: `8516030`.
- Badge mounted on shared AI generation UI and the direct Executive Intelligence panel.
- Compensation block injected below prompt-health `80`: yes.
- 422 refusal below prompt-health `30`: yes unless `forceRun` is true.
- audit:thin-case-handling: pass.

### 09_EMBEDDING_DIMENSION

- Completed: 2026-05-08.
- Commit: `6ac1bd0`.
- Canonical embedding config created: yes.
- Migration `0012_embedding_dim_alignment.py` created: yes.
- Pre-flight count: blocked until live SQL access is available.
- Migration applied locally: not applied in this session.
- audit:embedding-dim: pass.

### 10_ACO_EXPLAINER

- Completed: 2026-05-08.
- Commit: `4ec44f2`.
- `aco-copy.ts` has 14 entries: yes.
- Overlay mounts on first case open: yes by static audit; manual browser smoke still recommended.
- audit:aco-parity: pass.

### 11_AUDIT_PROMOTION

- Completed: 2026-05-08.
- Commit: `f46c2cf`.
- Audits tagged with tier labels where touched.
- Runtime audits created or promoted: `audit:gate-with-cloud`, `audit:gate-runtime-full`, and runtime-proof variants for KG drift, Cognee, owner scoping, and tool-context isolation.
- audit:gate-with-cloud composition: yes.

### 12_HYGIENE

- Completed: 2026-05-08.
- Commit: `a4add50`.
- `background_jobs` rule tightened: client reads are user-scoped and global reads remain admin/service-only.
- audit:surface-registry-coherence: pass.
- Forbidden model strings: `0`.
- Lint count delta: `98` problems to `96` problems after focused cleanup.

### 13_ITERATE_LOOP

- Completed: 2026-05-08.
- Commit: `a4d2651`.
- Recovery loop result: `npm run audit:gate` passed after fixing the surfaced audit/test drift.
- Graphify refresh: `5818` nodes, `9917` edges, `821` communities; HTML render skipped by Graphify because the graph exceeds the 5000-node render limit.
- Issues encountered: none requiring GC; production browser smoke remains a next-session runtime task.

### STATUS_TEMPLATE

- Completed: 2026-05-08.
- Commit: current status-template pass.
- Template applied: yes; root `STATUS.md` now contains the morning brief, metadata, task table, baselines, pre-existing failures, per-prompt notes, blockers, and next-session notes from `STATUS_TEMPLATE.md`.
- Issues encountered: none.

### V2_00_README

- Completed: 2026-05-08.
- Commit: current V2 README pass.
- Source preserved: `docs/codex-prompts/PRAXIS_V2_00_README.md`.
- Precondition check: satisfied; the night-pack status ledger shows honesty/calibration/Cognee guardrails complete and `npm run audit:gate` passed.
- Session map recorded: Session A multi-tenant foundations, Session B Postgres KG cutover, Session C Cognee plus Agent Engine, Session D observability.
- Next executable file: `A0_MT_DATA_MODEL.md`.
- Issues encountered: none; no production data or Firestore rule changes made in this README pass.

### V2_A0_MT_DATA_MODEL

- Completed: 2026-05-08.
- Commit: current A0 pass.
- Decision doc: `docs/architecture/MULTI_TENANT_MODEL.md`.
- Current-state scan: `collaborators` has no current code hits; `orgId` exists in profile/context/service metadata but is not an access-control model; Firestore situation rules are still owner-only.
- Approval gate: MT-1 through MT-5 are pending GC in `## Approvals Required`.
- Prompt preservation: A0-A3 copied into `docs/codex-prompts/` and registered in `audit:codex-prompts`.
- Issues encountered: A0 explicitly forbids starting A1 before approval, so A1-A3 implementation was not started.

### V2_A4_A5_A6_INTAKE

- Completed: 2026-05-08.
- Commit: current A4-A6 intake pass.
- Prompt preservation: A4-A6 copied into `docs/codex-prompts/` and registered in `audit:codex-prompts`.
- Implementation status: blocked by the same MT approval gate, plus dependencies on A1-A3.
- Operational notes captured: A4 needs `PRAXIS_INVITE_TOKEN_SECRET` and a production email provider decision; A6 needs an audit-action route map before broad code edits.
- Issues encountered: no code implementation started because A0 still blocks A1-A6.

### V2_B0_KG_PREFLIGHT

- Completed: 2026-05-08 as a local blocked preflight.
- Commit: current B0/B1 intake pass.
- Decision doc: `docs/audits/2026-05-08-POSTGRES_KG_PREFLIGHT.md`.
- Connection evidence: `gcloud` sees `praxisbytacitus-instance` at private IP `10.101.0.3`; local `psql` and Cloud SQL Auth Proxy are missing; `gcloud sql connect` fails because Cloud SQL Proxy v2 is not in PATH.
- Counts and latency: not measured; Case 1/2/3 not selected.
- B1 status: blocked until B0 is rerun from Cloud Shell, a VPC-connected host, or a temporary worker in the existing VPC.

### V2_B2_B3_INTAKE

- Completed: 2026-05-08.
- Commit: current B2/B3 intake pass.
- Prompt preservation: B2-B3 copied into `docs/codex-prompts/` and registered in `audit:codex-prompts`.
- B2 status: blocked until B1 has at least 7 clean production days of dual-write, parity drift below 5%, near-empty retry backlog, and acceptable B0 pgvector latency.
- B3 status: blocked until B2 has at least 7 clean production days of Postgres reads, shadow drift below 0.1%, more than 99% Postgres source telemetry, no graph regressions, and explicit GC sign-off.
- Issues encountered: no graph read/write code, Firestore rules, or environment flags changed because the cutover preconditions are not met.

### V2_C0_C1_INTAKE

- Completed: 2026-05-08.
- Commit: current C0/C1 intake pass.
- Prompt preservation: C0-C1 copied into `docs/codex-prompts/` and registered in `audit:codex-prompts`.
- Live service check: `gcloud run services describe praxis-cognee --region=us-east4 --project=praxisbytacitus` returned `Cannot find service [praxis-cognee]`.
- Cloud Run inventory: `praxis-frontend`, `praxis-backend`, two document/situation handlers, `gdelt-poller`, and Dialectica services exist; `praxis-cognee` does not.
- Repo infrastructure check: `infrastructure/cloudrun/praxis-cognee/` is missing.
- C0 status: blocked until the isolated Cognee service is deployed, healthy, and reachable via service-to-service auth.
- C1 status: blocked until C0 smoke test is green and production has `COGNEE_ENABLED=true` plus `COGNEE_BACKEND_URL`.
- Issues encountered: no memory/calibration code changed because wiring recall into calibration before live Cognee would violate the current honesty guardrails.

### V2_C2_AGENT_ENGINE_SUBAGENTS

- Completed: 2026-05-08 as a decision-gate intake.
- Commit: current C2 intake pass.
- Prompt preservation: C2 copied into `docs/codex-prompts/` and registered in `audit:codex-prompts`.
- Runtime check: no `VERTEX_AGENT*` secrets found in Secret Manager.
- CLI check: local `gcloud ai` does not expose `reasoning-engines`; Agent Engine deployment cannot be verified from this shell.
- Codebase check: marketplace `subagentDeps` metadata still exists, while visible marketplace pills remain gated behind the Agent Engine feature flag.
- Decision status: pending GC. Default recommendation from C2 is Option B, rename labels to "calibrated pipeline" unless GC explicitly approves deploying real Agent Engine artifacts.
- Issues encountered: no registry/docs rename and no Agent Engine deployment prep were started because the C2 decision is binary and explicit.

### V2_D0_STRUCTURED_EVENTS

- Completed: 2026-05-08 as a static implementation.
- Prompt preservation: D0 copied into `docs/codex-prompts/` and registered in `audit:codex-prompts`.
- Structured telemetry: added `src/types/telemetry.ts`, `src/lib/telemetry/emit.ts`, browser helper, and authenticated `/api/telemetry/log`.
- Emit sites: case create/delete, withCalibration snapshot/refusal/force-run/tool lifecycle, document upload, graph populate, and telemetry intake rate-limit drops.
- Enforcement: `audit:telemetry-coverage` added and wired into `audit:gate`; unit test covers schema JSON-line emission and 1KB details cap.
- Issues encountered: production Cloud Logging verification is deferred until this commit is deployed.

### V2_D1_KPI_PIPELINE

- Completed: 2026-05-08 as static repo assets; live operations remain pending.
- Prompt preservation: D1 copied into `docs/codex-prompts/` and registered in `audit:codex-prompts`.
- Assets: BigQuery normalized events view, daily KPI/route/tool views, deploy helper, monitoring alert definitions, KPI runbook, and Looker Studio dashboard outline.
- Enforcement: `audit:bq-views` added and wired into `audit:gate`.
- Issues encountered: D1 requires D0 to be live with structured Cloud Logging rows before the BigQuery sink and dashboard can be verified.

### V2_ITERATE_LOOP

- Completed: 2026-05-08.
- Prompt preservation: `ITERATE_LOOP.md` copied into `docs/codex-prompts/PRAXIS_V2_ITERATE_LOOP.md`.
- Audit update: `audit:codex-prompts` now validates the recovery playbook with marker checks for Pattern 1, Pattern 12, and the fallback path.
- Issues encountered: none in this pass; latest prior recovery was stale Graphify after Session D telemetry/KPI changes.

### V2_STATUS_TEMPLATE

- Completed: 2026-05-08.
- Prompt preservation: `STATUS_TEMPLATE.md` copied into `docs/codex-prompts/PRAXIS_V2_STATUS_TEMPLATE.md`.
- Audit update: `audit:codex-prompts` now validates status-template markers for pending operational steps, diagnostics log, and morning brief.
- Status reconciliation: added `## Pending Operational Steps` with the active GC/operator gates for Sessions A-D.
- Issues encountered: the current `STATUS.md` is intentionally richer than the template, so it was updated in place rather than overwritten.

## Blockers

- Runtime verification still needed for: production workbench first mount, staged recipe navigation, document upload -> retrieval, thin-case prompt-health, and live fresh-account onboarding enforcement.
- Live Cloud SQL row counts remain blocked until `psql`/Cloud SQL Proxy or a VPC-connected shell is available.
- V2 Session B remains risk-gated on live Cloud SQL graph row counts; do not cut over graph reads/writes until `B0_KG_PREFLIGHT.md` is completed.
- V2 Session A implementation is blocked until GC approves or revises MT-1 through MT-5 in `STATUS.md` or `docs/architecture/MULTI_TENANT_MODEL.md`.
- B1 dual-write implementation is blocked until `docs/audits/2026-05-08-POSTGRES_KG_PREFLIGHT.md` has live counts, pgvector latency, schema/index health, selected Case 1/2/3, and GC approval.
- B2/B3 graph cutover work is blocked by the required 7-day verification windows after B1 and B2.
- C0/C1 are blocked until `praxis-cognee` exists as a healthy Cloud Run service with service-to-service auth and production env binding.
- C2 is blocked until GC chooses Option A deploy or Option B rename; current evidence supports Option B as the lower-cost honest path.
- D1 live verification is blocked until D0 is deployed and Cloud Logging shows structured `praxis.telemetry.*` rows.

## Notes For Next Session

- Start V2 Session A implementation only after approving MT-1 through MT-5; then read `docs/codex-prompts/PRAXIS_V2_A1_ORGID_CONTEXT.md`.
- To unblock B0, run the documented SQL from a VPC-connected Cloud Shell/bastion/worker against `praxisbytacitus:us-east4:praxisbytacitus-instance`.
- To unblock C0, deploy/provision `praxis-cognee`, add monolith `roles/run.invoker`, set `COGNEE_BACKEND_URL`, then run the smoke test before enabling `COGNEE_ENABLED=true`.
- To unblock C2, mark `C2 Agent Engine subagents` approved for Option A or Option B in `STATUS.md`; Option B should be the default unless Agent Engine deployment is explicitly funded.
- To unblock D1, deploy the D0 code, confirm Cloud Logging structured rows, create/update the BigQuery sink into `praxis_telemetry`, run `infrastructure/bigquery/deploy-views.sh`, then build the Looker Studio dashboard from `praxis_telemetry.kpis_daily`.
- Keep solo-user backwards compatibility as a hard invariant while adding team/org scaffolding.
- Firestore rules changes in V2 Session A require matching tests in `tests/security/firestore-rules.test.ts`.
- Runtime-smoke `08_THIN_CASE_CALIBRATION`: verify a real thin case returns 422, the help panel renders, and `forceRun: true` reaches the model with `<context-quality>` attached.
- Manual-smoke `10_ACO_EXPLAINER`: clear `praxis:aco-overlay-dismissed:<uid>`, open a case, dismiss the primer, refresh, then reopen via Ontology tab.
- Add runtime document ingest parity: upload a file, verify saved document/chunks, backend source receipt, and retrieval.
- Run a browser smoke against `praxis.tacitus.me` after commit/deploy.
