# PRAXIS Genkit Sprint — CODEX BRIEF

**Date:** 2026-05-14
**Audience:** Codex (or any heavy-lift engineering agent working in parallel with Claude Code)
**Owner:** Giulio Catanzariti
**Mirror brief for Claude Code:** `docs/build/PRAXIS_GENKIT_SPRINT_CLAUDE_CODE_BRIEF_2026-05-14.md`

You are working in parallel with a Claude Code agent. Both agents share this repo and the PR queue. Your job is **heavy backend / schema / Genkit infra / data plane**. The other agent handles UX / visualization / polish. Daily sync via PR reviews.

---

## 0. Before you touch any code

### Required reading in this repo (already exists)

1. `CLAUDE.md` — project canon
2. `AGENTS.md` — hard rules, validation gate, deploy procedure
3. `ARCHITECTURE.md` and `docs/architecture/PRAXIS_ARCHITECTURE.md`
4. `docs/architecture/PRAXIS_GENKIT_NEO4J_INTEGRATION_PLAN_2026-05-14.md` — the design doc this sprint executes against (Neo4j parts deferred)
5. `docs/build/PRAXIS_v5_EXECUTION_LEDGER.md` — phase status, owners, validation
6. `src/lib/context/profile-context.ts` and `src/lib/api/with-calibration.ts` — the calibration spine you will extend
7. `src/lib/domain/{seeds,resolve,types}.ts` — model your Path Core after this shape
8. `src/components/cores/{capsule-board,capsule-slot,specimen-card,domain-picker}.tsx` — current 7-slot capsule UI (path slot already present, schema not yet wired)
9. `backend/ai/{genkit_app,flows,providers}.py` — existing Python Genkit usage; you will mirror this on JS side
10. `src/lib/ai/MODEL_MATRIX.json` — **only** source of truth for model IDs

### Required documentation to fetch and study (do this first, even deeper than I have)

Use WebFetch or your browser. Do not skim — read fully and capture patterns.

**Genkit core (JS):**
- https://genkit.dev/docs/js/get-started/
- https://genkit.dev/docs/js/flows/
- https://genkit.dev/docs/js/dotprompt/
- https://genkit.dev/docs/js/tool-calling/
- https://genkit.dev/docs/js/rag/
- https://genkit.dev/docs/js/evaluation/
- https://genkit.dev/docs/js/devtools/
- https://genkit.dev/docs/js/plugins/google-genai/
- https://genkit.dev/docs/js/plugins/google-cloud/
- https://genkit.dev/docs/js/observability/
- https://genkit.dev/docs/js/chat/
- https://genkit.dev/docs/js/interrupts/
- https://genkit.dev/docs/js/models/
- https://github.com/genkit-ai/genkit

**Google Cloud surfaces you will touch:**
- https://docs.cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/overview
- https://docs.cloud.google.com/vertex-ai/generative-ai/docs/memory-bank/overview
- https://docs.cloud.google.com/vertex-ai/generative-ai/docs/sessions/overview
- https://docs.cloud.google.com/bigquery/docs/vector-search
- https://docs.cloud.google.com/bigquery/docs/generate-text-tutorial
- https://docs.cloud.google.com/bigquery/docs/generate-embeddings
- https://docs.cloud.google.com/firestore/docs/vector-search
- https://docs.cloud.google.com/run/docs/configuring/services/websockets
- https://docs.cloud.google.com/pubsub/docs/overview
- https://docs.cloud.google.com/trace/docs

**Stripe (subscription replacement):**
- https://docs.stripe.com/billing/subscriptions/overview
- https://docs.stripe.com/billing/subscriptions/build-subscriptions
- https://docs.stripe.com/customer-management/integrate-customer-portal
- https://docs.stripe.com/webhooks/signatures

**MCP (structure now, light wiring later):**
- https://modelcontextprotocol.io/introduction
- https://genkit.dev/docs/js/mcp/

**Plus**: any time you hit an unfamiliar Genkit primitive, fetch its doc page. Do **not** guess API shape from memory — `genkit-cli` is installed; check `genkit list-actions` and the dev UI before assuming.

### Research expectations

- Spend the first 30–60 minutes reading. Capture notes locally if useful.
- Before each prompt below, re-read the matching Genkit doc page. APIs move; v1.34 (May 2026) is current.
- When in doubt, run `genkit start --watch` and inspect the live action registry.
- Treat all version numbers in this doc as advisory — check `npm view <pkg> version` for latest.
- If a Genkit pattern conflicts with this brief, the **Genkit docs win** — flag the conflict in the PR description and adapt.

---

## 1. Sprint context

### What PRAXIS is right now

Policy / diplomacy / political-intelligence workspace. Next.js 16 + Python FastAPI on Cloud Run. 73 AI routes hand-rolled with AI SDK v6. 55 tool surfaces. 11 domains (locked, Firestore-seeded). Capsule board with 7 slots is shipped; path slot has UI but no schema. Calibration contract live and good. Ask PRAXIS routes exist but orchestration is hand-rolled and not streaming.

### What we're doing this sprint

Pivot the entire AI orchestration to Genkit + dotprompt + tool-calling + Vertex AI surfaces. Drop per-call credits → monthly Stripe subscriptions. Make the capsule board a real drag-and-drop mix-and-match workbench. Ship the **Path Core** as the keystone schema (10 paths on top of the generic policy analyst). Defer Neo4j — use Firestore native KNN + BigQuery vector search for now.

### Strategic recommendation: yes, build on Genkit hard

- Backend already uses Python Genkit. Going JS-side closes the loop.
- Locks into Google stack (Vertex, Firestore, BigQuery, Cloud Trace) you have already chosen.
- Replaces fragile hand-rolled glue (schema retries, structured output, tool calls, sessions, traces, evals) with one primitive each.
- Caveat: keep AI SDK v6 only for the `useChat` UI hook layer until Genkit has React parity; everything server-side migrates.

### Working relationship with Claude Code

- The other agent owns: capsule swap drawer UI, path picker visualization, capsule radar, Ask PRAXIS streaming UI, interrupt cards, readiness card, memo grounded UX, lineage tree, working memory pane, subscription gate UI, landing refresh.
- You own: Genkit foothold, dotprompt, path schema, 12 route migrations, Genkit tool registry, Ask PRAXIS streaming flow, readiness contract, BigQuery semantic, subscription billing, capsule swap/fork/share APIs, drag-from-rail backend + autosave.
- Coordination: each agent's prompts reference the other's. When you ship an API, ping the matching CC prompt in the PR description. When you need a UX deliverable to validate end-to-end, list it as a blocker.
- Both agents share `npm run audit:*` gates and the persona-smoke CI workflow.

---

## 2. Sprint structure

### Sprint 0 — today, 8 hours

Goal by EOD: Genkit ships in the JS codebase, one flow runs end-to-end via dotprompt + dev UI, Path Core schema is queryable, capsule swap API is live, tool registry is registered.

| Hour | Prompts |
|---|---|
| 0–2 | CX-1 Genkit foothold + dotprompt + first migrated flow |
| 2–4 | CX-2 Path Core schema + seeds + resolver + admin |
| 4–6 | CX-3 (begin) — migrate `situation-brief`, `actor-map`, `escalation-monitor` (3 of 12) |
| 6–8 | CX-4 PRAXIS tools as Genkit tools (first 6 tools registered) |

### Days 1–6

| Day | You ship |
|---|---|
| 1 | Finish CX-1/2, complete CX-3 wave (12 routes), full CX-4 (12 tools) |
| 2 | CX-5 Ask PRAXIS streaming flow + Vertex Memory Bank wire |
| 3 | CX-6 Context Readiness contract + Genkit eval gate in CI |
| 4 | CX-7 Capsule swap/fork/share/suggestions APIs |
| 5 | CX-8 BigQuery semantic layer + retro-eval Cloud Scheduler |
| 6 | CX-9 Subscription billing replace credits + CX-10 drag-from-rail backend + autosave + WebSocket presence |

Each PR ships with: unit + integration tests, Playwright spec where UI is touched, audit gate update, dev UI screenshot, Cloud Trace screenshot for new flows.

---

## 3. Your 10 prompts

### CX-1. Genkit foothold: singleton, dotprompt, dev UI, first migrated flow

**Goal**: install Genkit JS, ship a singleton, configure dotprompt, wire dev UI, migrate `/api/ai/situation-intelligence` end-to-end as the proof flow.

**Tasks**:
1. `npm i genkit @genkit-ai/google-genai genkitx-google-cloud zod`. (`genkit-cli` already installed globally.)
2. Create `src/lib/genkit/index.ts` exporting singleton `ai = genkit({ plugins: [googleAI(), googleCloud({ telemetryConfig: { sampler: 'parentbased_always_on' } })], promptDir: 'prompts' })`. Export model refs `gemini25Flash`, `gemini25Pro` read from `src/lib/ai/MODEL_MATRIX.json` via a helper. **No hardcoded model strings**.
3. Create `prompts/situation-intelligence.prompt` with frontmatter declaring `model: googleai/gemini-2.5-pro`, `config: { temperature: 0.4 }`, `input.schema` + `output.schema` (Picoschema) matching the existing Zod shape in `src/lib/ai/schemas/situation-intelligence.ts`. Handlebars body uses partials `{{> _user-frame}}`, `{{> _situation-frame}}`, `{{> _path-frame}}` placed at `prompts/_user-frame.prompt` etc.
4. Create `src/lib/genkit/flows/situation-intelligence.ts`:
   ```ts
   export const situationIntelligenceFlow = ai.defineFlow(
     { name: 'situationIntelligence', inputSchema, outputSchema },
     async (input) => {
       const prompt = ai.prompt('situation-intelligence');
       const { output } = await prompt({ ...input });
       return output!;
     }
   );
   ```
5. Update `src/app/api/ai/situation-intelligence/route.ts` to call `situationIntelligenceFlow(input)`. Keep `withCalibration('situation-intelligence', 'deep')` wrapper.
6. Add `npm run genkit:dev` → `genkit start -- tsx src/lib/genkit/dev-runner.ts` where `dev-runner.ts` imports every flow module so the dev UI discovers them.
7. Confirm Cloud Trace export works in staging.

**Verification**:
- `npm run build` passes.
- `npm run genkit:dev` opens http://localhost:4000, flow visible, "Run" works with seeded input, trace shows token count.
- `curl -X POST http://localhost:3000/api/ai/situation-intelligence` returns the same shape as before migration.
- New test `tests/genkit/situation-intelligence-flow.test.ts` mocks model + asserts output schema.

**Research first**: `genkit.dev/docs/js/get-started`, `flows`, `dotprompt`, `plugins/google-genai`, `plugins/google-cloud`, `observability`.

---

### CX-2. Path Core schema + seeds + resolver + admin (the keystone)

**Goal**: ship the 10 Path Cores as first-class Firestore-backed entities.

**Tasks**:
1. Create `src/lib/path/types.ts` with `PathConfig`:
   ```ts
   export interface PathConfig {
     id: PathId;
     name: string;
     domainId: DomainId;
     version: number;
     toolBundle: ToolId[];
     frameworkPath: FrameworkId[];
     lensTop3: LensId[];
     timeHorizonDefault: TimeHorizon;
     audienceDefault: AudienceId;
     sourceMix: { feed: FeedId; weight: number }[];
     promptVoice: { tone; hedging; citationStyle; jargonLevel };
     outputDefaults: { format; length; footnoteStyle };
     contextRecipe: ContextCoreId[];
     colorHex: string;
     iconId: string;
   }
   ```
2. Create `src/lib/path/seeds.ts` with the 10 paths from `docs/architecture/PRAXIS_GENKIT_NEO4J_INTEGRATION_PLAN_2026-05-14.md`: conflict, diplomacy, humanitarian, rights, governance, economic, development, climate, info, transnational. Lock the ids.
3. Create `src/lib/path/resolve.ts` with `resolvePath(id)`, `mergeUserSituationDomainPath(u, s)` → `MergedContextConfig`. 5-minute in-process cache, bust on admin edits.
4. Build `scripts/seed-paths.ts` (idempotent) → writes `config/paths/{id}` Firestore docs.
5. Build admin UI at `/app/admin/paths` (gate via `ADMIN_ALLOWLIST`), versioned snapshots in `config/paths_history/{id}_{prev}`. Reuse domain admin component shape.
6. Wire `buildCalibratedContext` (`src/lib/context/profile-context.ts`) to emit `<path-frame>` alongside `<domain-frame>`.
7. Build classifier flow `src/lib/genkit/flows/classify-path.ts` (Gemini Flash): inputs domain + seed text, output `{ pathId, confidence, alternates: [{id, confidence}] }`. Exposed at `POST /api/paths/classify`.

**Verification**:
- `npx tsc --noEmit` clean.
- `tests/unit/path/resolve.test.ts` covers merge logic.
- `tests/unit/path/classifier.test.ts` covers classifier with mocked Gemini.
- `npm run audit:path-coverage` (new) confirms every domain has ≥ 1 default path and every tool in `tool-registry` is referenced by ≥ 1 path's `toolBundle` OR marked `archive`.
- Seeded docs visible in Firestore console.

---

### CX-3. Migrate 12 hottest AI routes to Genkit dotprompted flows

**Goal**: kill inline prompts + ad-hoc `generateText + Output.object()` glue.

**Routes (order: easiest → hardest)**:
1. `situation-intelligence` (done by CX-1)
2. `situation-brief`
3. `actor-map`
4. `escalation-monitor`
5. `leverage-map`
6. `scenario-tree`
7. `brief-builder`
8. `redline-finder`
9. `needs-assessment`
10. `narrative-map`
11. `attribution-graph`
12. `next-moves`

**Pattern per route**:
1. Extract prompt → `prompts/{name}.prompt` with Picoschema frontmatter.
2. Create `src/lib/genkit/flows/{name}.ts` exporting `ai.defineFlow` calling `ai.prompt('{name}')`.
3. Update route to `await {name}Flow(input)`.
4. Snapshot test at `tests/genkit/flows/{name}.snap.ts` with golden input → recorded output (deterministic mock).
5. Read `<path-frame>` from `ctx.calibration.systemPromptBlock`, pass as input variable.

**Tooling**:
- Build `scripts/audit-genkit-coverage.mjs` walking `src/app/api/ai/**/route.ts`, greps for `@ai-sdk/*` imports, prints migration % + remaining list. Add to `audit:all`.

**Verification**:
- 12 flows visible in dev UI.
- `audit:genkit-coverage` shows 12/73 with remaining list.
- All `vitest run` + contract tests pass.
- Cloud Trace shows flow runs in staging.

**Research first**: `genkit.dev/docs/js/dotprompt`, `flows` (streaming + sub-flow patterns).

---

### CX-4. PRAXIS tools as Genkit tools — Ask PRAXIS self-orchestrates

**Goal**: every tool surface becomes `ai.defineTool` so Gemini calls them mid-reason.

**Tasks**:
1. Create `src/lib/genkit/tools/registry.ts`. For each canonical tool in `src/lib/tools/canonical.ts`, export `ai.defineTool` wrapping existing flow/route.
2. Start with 12 tools: `escalation_monitor, leverage_map, actor_map, scenario_tree, brief_builder, redline_finder, needs_assessment, narrative_map, attribution_graph, source_search, claim_extract, fact_check`.
3. Path-aware filtering: `getToolsForPath(pathId)` returns only tools in `path.toolBundle[]`.
4. `maxTurns: 8` (policy reasoning chains are longer than default 5).
5. **Interrupts** for destructive tools: `redline_finder`, `brief_builder` registered with `interrupt: true`. Claude Code (CC-5) builds the UI.
6. MCP server stub at `src/lib/genkit/mcp/index.ts` ready to register external MCP tools (UCDP, GDELT, ReliefWeb). Don't ship live MCP today; structure the wiring.

**Verification**:
- `tests/genkit/tools/escalation-tool.test.ts` invokes via `generate({ tools, prompt: 'is Nordalia escalating?' })` and asserts tool was called.
- Dev UI shows 12 tools under "Tools" panel.
- `audit:tool-path-coverage` confirms path's `toolBundle` references only registered tools.

**Research first**: `genkit.dev/docs/js/tool-calling`, `interrupts`, `mcp`.

---

### CX-5. Ask PRAXIS as streaming Genkit flow with framework-walk

**Goal**: rebuild Ask PRAXIS as the showcase flow.

**Tasks**:
1. Create `prompts/ask-praxis.prompt` + partials `_framework-walk.prompt`, `_synthesis.prompt`.
2. Create `src/lib/genkit/flows/ask-praxis.ts` with `streamSchema: AskStep`:
   ```ts
   AskStep = z.discriminatedUnion('stage', [
     z.object({ stage: z.literal('retrieve'), retrieved: z.object({ claims, actors, events }) }),
     z.object({ stage: z.literal('framework'), frameworkId, finding }),
     z.object({ stage: z.literal('tool_call'), toolName, request, response }),
     z.object({ stage: z.literal('synthesis'), answer, citations }),
     z.object({ stage: z.literal('interrupt'), toolName, request }),
   ]);
   ```
3. Flow body:
   - Resolve merged capsule (user × situation × domain × path).
   - Parallel Firestore KNN retrieve (claims, actors, events) top-12 each.
   - For each framework in `path.frameworkPath`: `generate({ tools: getToolsForPath(pathId), model: gemini25Pro, prompt: renderFrameworkPrompt(...), output: { schema: FindingSchema } })`. Emit step.
   - Final synthesis: `generate({ output: { schema: AnswerSchema } })`, stream `synthesis` chunk.
4. Update `src/app/api/ai/ask-praxis/route.ts` to stream SSE.
5. Persist each turn to `users/{uid}/capsules/{capsuleId}/ask_turns/{turnId}` with full step trace.
6. Wire to Vertex AI **Memory Bank**: provision via `infrastructure/setup-memory-bank.sh`. Each turn updates working-memory for `{uid, capsuleId}`. Prepend pinned memory as `<working-memory>` block.

**Verification**:
- Dev UI streams steps live.
- `tests/e2e/ask-praxis-stream.spec.ts` asserts ≥ 3 framework cards stream within 10s on seeded Nordalia.
- `tests/genkit/flows/ask-praxis.test.ts` mocks tools, asserts `escalation_monitor` called when prompt says "escalating".
- Memory Bank facts persist across two sessions.

**Research first**: `genkit.dev/docs/js/flows` (streaming), `tool-calling`, Vertex Memory Bank overview, `cloud.google.com/vertex-ai/generative-ai/docs/sessions/overview`.

---

### CX-6. Context Readiness contract + endpoint + Genkit eval gate

**Goal**: ship the data spine for the live Context Readiness card AND lock it as an eval gate.

**Tasks**:
1. Create `src/lib/context/readiness.ts` exporting `computeReadiness({ uid, capsuleId })` → `ContextReadiness`:
   ```ts
   interface ContextReadiness {
     cores: Record<CoreKind, { state: 'green'|'amber'|'red'; completeness: number; gaps: string[] }>;
     lensCoverage: number;
     freshness: { score: number; oldestSourceAgeDays: number };
     sourceGapClaims: { claimId: string; reason: string }[];
     tokenBudgetEstimate: number;
     overall: 'ready' | 'thin' | 'broken';
   }
   ```
2. `/api/context/readiness?capsuleId=` route, cached 60s.
3. Wire `withCalibration` middleware to call `computeReadiness` and attach to `CalibrationCtx`. Block flows when `overall === 'broken'` with 412 (matches FixThisFirstPanel).
4. Genkit evaluator `src/lib/genkit/evaluators/readiness-faithfulness.ts` using `ai.defineEvaluator`: faithfulness (generated answers cite only retrieved chunks) + path-fidelity (coverage of `path.frameworkPath`).
5. Golden eval datasets `evals/genkit/{pathId}.jsonl` — 15 questions/expected facets per path. Ship conflict, diplomacy, humanitarian first.
6. `npm run eval:genkit` → `genkit eval:flow askPraxisFlow --input evals/genkit/conflict-path.jsonl --evaluators faithfulness,answerRelevance,readinessFidelity`.
7. GitHub Actions `.github/workflows/genkit-evals.yml` on PRs touching `src/lib/genkit/**` or `prompts/**`. Posts markdown comment table. Blocks merge if faithfulness regresses > 5%.

**Verification**:
- Endpoint returns sensible scores on seeded Nordalia.
- 412 block triggers on thin capsule.
- Eval workflow runs in CI, comment appears on test PR.
- 3 datasets × 15 questions = 45 evals.

**Research first**: `genkit.dev/docs/js/evaluation`, `dotprompt` (variants for eval A/B), GitHub Actions best practices.

---

### CX-7. Mix-and-Match engine: capsule swap + suggestions + lineage

**Goal**: real drag-and-drop swap with AI-proposed mixes and fork/share lineage.

**Tasks**:
1. `POST /api/capsules/{id}/swap` accepts `{ slot: CoreKind, coreId: string | null }`. Validates ownership, kind, readiness not `broken`. Writes new capsule version + lineage record.
2. `GET /api/capsules/{id}/suggestions` runs Genkit flow `suggestCapsuleMix`: given capsule + library + task intent, returns top-3 alternative mixes ranked by readiness + diversity. Each: `{ swap: { slot, coreId }, rationale, projectedReadiness }`.
3. `POST /api/capsules/{id}/fork` deep-copies with `lineage.parentId`. `GET /api/capsules/{id}/lineage` returns the tree.
4. `POST /api/capsules/{id}/share` issues signed JWT (7d TTL, single-use) + `capsule_shares/{token}` doc. `POST /api/capsules/import/{token}` clones into recipient.
5. `firestore.rules` updates for new paths.
6. Audit log writes per swap/fork/share to `audit_log/{eventId}`.

**Verification**:
- `tests/api/capsule-swap.test.ts` covers validation paths.
- `tests/api/capsule-fork-share.test.ts` round-trips fork + share + import.
- Suggestion flow returns 3 sensible alternatives on seeded data, visible in dev UI.
- Concurrent swaps don't race (transaction).

---

### CX-8. BigQuery semantic layer — cross-capsule search + retro-evals

**Tasks**:
1. `infrastructure/bigquery/schema.sql`:
   - `praxis_semantic.memo_chunks` (uid, capsule_id, memo_id, chunk_id, text, embedding ARRAY<FLOAT64>, created_at, citations ARRAY<STRING>)
   - `praxis_semantic.ask_turns` (uid, capsule_id, turn_id, question, answer, framework_findings JSON, tool_calls JSON, citations ARRAY<STRING>, created_at)
   - `praxis_semantic.tool_outputs` (uid, capsule_id, tool_id, output JSON, schema_version, created_at)
   - `praxis_semantic.evals` (run_id, flow_name, faithfulness, answer_relevance, path_fidelity, created_at)
   - `CREATE VECTOR INDEX` on `memo_chunks.embedding` (IVF, COSINE).
2. Cloud Function `cloud_functions/bq_streamer/main.py` subscribed to Pub/Sub topics `memos.chunked`, `ask.turn.persisted`, `tool.run.completed`. Batched inserts.
3. `/api/search/semantic?q=&scope=user|capsule` calling BigQuery `VECTOR_SEARCH`. Wire to global header search.
4. Cloud Scheduler nightly `eval:retro` Genkit flow over yesterday's `ask_turns` scoring faithfulness vs citations. Writes to `evals` table.
5. Admin `/app/admin/quality` page showing daily faithfulness, answer relevance, p50/p95 latency from BigQuery.

**Verification**:
- Schema applies cleanly.
- Pub/Sub → BigQuery latency < 30s.
- `audit:bq-coverage` confirms row count ≈ Firestore (±1%).
- Cross-capsule search returns sensible results.
- Admin dashboard shows 7-day moving avg.

**Research first**: `cloud.google.com/bigquery/docs/vector-search`, `generate-embeddings`, Cloud Scheduler + Genkit pattern.

---

### CX-9. Subscription billing replace credits — Stripe + quota

**Tasks**:
1. Tiers in `src/lib/billing/tiers.ts`:
   - Free: 3 paths, 50 flows/mo, watermarked exports, 1 capsule
   - Practitioner $49: all 10 paths, 5k flows/mo fair-use, full exports, unlimited capsules
   - Team $199/seat: shared capsules + admin
   - Enterprise: custom
2. `src/lib/api/with-quota.ts` replacing `with-credits.ts`. Reads `users/{uid}.subscription`, checks `users/{uid}/usage/{yyyy-mm}` counters, increments on flow start, hard-blocks at 100%, soft-warns at 80% via response header.
3. Stripe: `/api/billing/checkout`, `/api/billing/portal`, `/api/billing/webhook` (signature verified). Persist subscription state.
4. `firestore.rules` for subscription docs (read-own, no-write).
5. Migrate `withCalibration` to call `withQuota(toolId)` instead of `withCredits`.
6. Admin page: remove credit allocation, replace with subscription view.
7. Delete `credit_transactions` writes. Keep history doc read-only for audit.

**Verification**:
- Stripe test mode: subscribe → quota counts → block → upgrade → unblocks.
- `tests/billing/quota-concurrency.test.ts` covers atomic increment.
- Webhook signature failures rejected.
- Zero `credit` references in `src/components/`.

**Research first**: Stripe Subscriptions, Customer Portal, webhook signatures.

---

### CX-10. Drag-from-rail backend + capsule autosave + presence

**Tasks**:
1. `GET /api/cores/library?kind=&q=` returns ranked cores (user workspace + public seeds + path defaults). Pagination cursor.
2. Capsule autosave: debounced `PUT /api/capsules/{id}` on every drop. Optimistic UI. Last-write-wins per slot, version check.
3. WebSocket presence at `/api/realtime/capsule/{id}/ws` (Cloud Run WebSockets) — fall back to Firestore listener if WS too heavy. Broadcasts `{ uid, slotEdited, at }`. Show "Editing in another tab" pill on contested slots.
4. Server-side swap validation double-checks ownership + readiness.
5. New Genkit tool `propose_capsule_swap` (calls CX-7 suggestion flow) registered so Ask PRAXIS itself can propose swaps. UI shows "Adopt swap" CTA.

**Verification**:
- `tests/api/cores-library.test.ts` covers filtering, ranking, pagination.
- `tests/e2e/capsule-drag-drop.spec.ts` drags path → drops on path slot → asserts version bumps + readiness updates.
- Two-tab test: edit slot A in tab 1, slot B in tab 2 → both persist.
- Ask PRAXIS proposes a swap on a thin capsule, "Adopt" applies via swap API.

---

## 4. Cross-cutting rules

- **Model strings**: never hardcode. Always go through `src/lib/ai/MODEL_MATRIX.json` + `providers.ts`.
- **Security boundaries**: do not touch `src/lib/firebase/admin.ts`, `src/lib/api/with-auth.ts`, `src/middleware.ts` or `src/proxy.ts`, `firestore.rules`, `storage.rules`, `src/lib/auth/cookie-signer.ts` without explicit approval.
- **No `unsafe-inline` CSP**, ever. Use nonces.
- **Audit gates**: every PR must keep `npm run audit:repo-shape`, `audit:gcp`, `audit:model-matrix-coverage`, `audit:cognee`, `audit:embedding-dim` green. Add new audits as you ship new contracts.
- **Tests**: focused vitest on touched areas, pytest for backend, Playwright spec when UI changes. Persona-smoke must stay green.
- **Build verification**: `npx tsc --noEmit` and `npm run build` before every PR.
- **Deploy**: never deploy without explicit ask. Use Cloud Build via `infrastructure/deploy.sh`.

## 5. PR conventions

- Title: `feat(genkit): CX-N short description` or `feat(path): ...`
- Body: link this brief + the matching CC prompt + dev UI screenshot + Cloud Trace screenshot for new flows + Lighthouse/Playwright artifact for UI touches.
- Ping the Claude Code agent in the description with the CC prompt id you unblocked.
- Use `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` when relevant.

## 6. When you get stuck

1. Re-read the Genkit doc page for the primitive you're using.
2. Run `genkit start --watch` and inspect the action live.
3. Check `genkit-cli` versions: `npm view genkit version`, `npm view genkit-cli version`.
4. Look at `backend/ai/flows.py` for the Python equivalent — same primitive, same shape.
5. If still stuck, leave a `TODO(codex): <question>` comment and ask in the PR. Don't guess API shape.

## 7. Mirror agent (Claude Code) prompt index — for cross-reference

| Codex prompt | Claude Code mirror |
|---|---|
| CX-1 Genkit foothold | CC-1 Capsule swap drawer UX |
| CX-2 Path schema | CC-2 Path picker visualization |
| CX-3 Route migration | CC-3 Capsule Radar viz |
| CX-4 Tool registry | CC-4 Ask streaming UI |
| CX-5 Ask streaming flow | CC-5 Interrupt card |
| CX-6 Readiness contract | CC-6 Readiness card UI |
| CX-7 Swap/fork APIs | CC-7 Memo grounded + Gap Filler |
| CX-8 BigQuery semantic | CC-8 Lineage tree |
| CX-9 Subscription billing | CC-9 Working Memory pane |
| CX-10 Drag-from-rail backend | CC-10 Subscription gate UI + landing refresh |

End of Codex brief. Start with CX-1.
