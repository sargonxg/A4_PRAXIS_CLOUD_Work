# PRAXIS — CODEX Playbook & Improvement Roadmap

> **This is the single authoritative "what to do next" document for CODEX / agent
> sessions.** It supersedes the dated daily audit snapshots and one-off
> improvement plans that were removed on 2026-06-01. Architecture *truth* still
> lives in `docs/architecture/PRAXIS_ARCHITECTURE.md`; this file is the
> *operating manual + prioritized roadmap* that sits on top of it.
>
> Version target: 6.4.1 → 6.5 · Project `praxisbytacitus` · Domain praxis.tacitus.me
> Last rewritten: 2026-06-01

---

## 0. The product in one paragraph

PRAXIS is the AI-native workspace for policy, diplomacy, and political analysis.
A practitioner lands on a **simple, chat-first home** (identical before and after
login, like ChatGPT). They build **Context Capsules** — governed bundles of
sources, claims, graph, temporality, causality, and ontological grounding — that
make every answer *sourceable, temporal, causal, and ontologically grounded*.
They **Ask PRAXIS** (chat about policy, grounded by capsules and a multi-agent
research/triage workflow), open the **Boardroom** to stress-test an idea against
multiple expert personas, and move to the **Memo** desk to draft with sources,
fact-checks, and language checks. Everything must feel **simple but powerful**:
the complexity lives in the capsule + agent runtime, never in the UI.

The non-negotiable design contract: **simplicity on the surface, depth in the
context layer.** When a change adds UI surface area, push back and ask whether it
belongs inside the capsule/agent runtime instead.

---

## 1. Read order (do this before touching code)

1. `README.md`
2. `CLAUDE.md` — invariants, security boundaries, model discipline
3. `AGENTS.md` — hard rules, validation gate, deploy procedure
4. **This file** — current priorities and per-surface work packets
5. `docs/architecture/PRAXIS_ARCHITECTURE.md` — architecture bible
6. `docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md` — shipped vs gated
7. `docs/architecture/PRAXIS_AGENT_RUNTIME_ARCHITECTURE.md` — Ask / AgentRun / Genkit / ADK
8. `docs/product/PRAXIS_CANONICAL_APP_STRUCTURE.md` — current surfaces
9. `docs/product/TASKLET_STYLE_PRAXIS_AGENT_RUNTIME_PLAN.md` — runtime plan
10. `docs/build/PRAXIS_CONTEXT_CAPSULE_APP_BUILD_LEDGER_2026-05-15.md` — active ledger
11. `STATUS.md`, `TODO.md`, and `CHANGELOG.md` `[Unreleased]`

Skipping 4–9 produces duplicate work. The audit snapshots that used to be listed
here are gone; the **latest** state lives in `docs/audits/2026-05-31-*` and
`docs/audits/2026-05-30-red-flags-and-improvement-plan.md`.

---

## 2. Hard rules (never violate without explicit human approval)

These are restated from `CLAUDE.md`/`AGENTS.md` because most regressions come from
ignoring them:

- **Model strings:** never hardcode `gemini-*` outside `src/lib/ai/providers.ts`
  and `src/lib/ai/MODEL_MATRIX.json`. Canon is `gemini-2.5-flash` / `gemini-2.5-pro`.
  Forbidden: `gemini-2.0-*`, `gemini-3-pro-preview`, any `gemini-3-*` unless
  `PRAXIS_ALLOW_GEMINI3_TARGETS=1`. Verify: `rg "gemini-2\.0|gemini-3-pro-preview" src/ backend/` → 0 matches.
- **Security-critical files — stop and ask first:** `src/lib/firebase/admin.ts`,
  `src/lib/api/with-auth.ts`, `src/proxy.ts` (not `middleware.ts`),
  `firestore.rules`, `storage.rules`, `src/lib/auth/cookie-signer.ts`.
- **Every AI route** goes through `withCalibration(toolId, creditOpType)` →
  `withAuth` → credits → `buildCalibratedContext` → handler → `saveToolOutput`.
  Never add a no-auth AI route. Never skip the credit deduction.
- **Backend is private Cloud Run.** Browser → Next.js API → backend via
  `src/lib/api/praxis-backend-server.ts` with OIDC. Never expose `praxis-backend`.
- **Firestore is the canonical graph store.** Neo4j/Falkor/GraphLite are *derived
  indexes*, advisory-only. Do not make them a source of truth.
- **Navigation:** `PraxisLink` / `usePraxisRoute()` only. Do not add new top-level
  product surfaces; capsules + the cockpit are the product. New capability =
  panel/action inside the shared cockpit/workbench, not a new route.
- **Cognee** stays disabled-by-default; only `backend/services/cognee_memory.py`
  imports the SDK.

---

## 3. Validation gate (run before every deploy / PR)

```bash
npx tsc --noEmit                 # types must be clean
npx vitest run                   # or focused: vitest run <touched area>
npm run lint                     # warnings allowed (React Compiler backlog), errors not
npm run build                    # Linux Cloud Build is authoritative; Windows may warn on node:* chunks
npm run audit:repo-shape
npm run audit:gate               # umbrella audit (see scripts/audit-runner.ts)
node scripts/audit-ai-routes.mjs # every AI route calibrated
```

Deploy via Cloud Build only:
```bash
gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus
# frontend-only fast path:
npm run deploy:frontend:cloud
```
Cloud Build runs preflight gates (model strings, calibration, GCP audit) → install
→ lint → typecheck → backend image+deploy → frontend image+deploy. There are **no
error suppressions** (`next.config.ts` has no `ignoreBuildErrors`); keep it that way.

---

## 4. Vision → live-state gap map

Maturity as of 2026-06-01 review. **Solid** = shipping; **Partial** = works but
incomplete vs vision; **Stub** = scaffolded, not yet a real experience.

| Surface | State | Where it lives | The gap that matters |
|---|---|---|---|
| **Homepage (chat-first, same pre/post login)** | Solid | `src/app/page.tsx`, `src/components/marketing/praxis-marketing-home.tsx`, `src/components/app/praxis-app-launchpad.tsx`, `src/components/app/praxis-chat-first-shell.tsx` | P3.1 complete: public and authenticated entry points use the shared chat-first shell; `/` keeps SEO metadata in `page.tsx` and logged-out users get the same composer with a sign-in affordance. |
| **Context Capsules** | Solid capture + derived graph | `src/lib/context/capsule-v3.ts` (14 sections), `src/components/capsules/CapsuleBuilderWizard.tsx`, `capsule-service.ts`, `CapsuleWorkbenchPanel.tsx` | P2 complete: creation captures temporality, causality, and ontology/domain bindings, and the workbench surfaces the derived GraphLite projection while Firestore remains canonical. |
| **Ask PRAXIS** | Solid/sourceable | `src/app/api/ai/chat/route.ts`, `src/lib/ai/ask-orchestrator.ts`, `src/components/ask/AskStreamPanel.tsx`, `receipt-card.tsx` | P0/P1 complete: streamed answers surface sourceability verdicts and traces expose triage/source-check activity. Next gaps are quality/polish, not plumbing. |
| **Agentic workflow (orchestration/triage/multi-agent)** | Solid visible runtime | `src/lib/agent-runtime/workflow-plan.ts`, `src/lib/agents/run-agent.ts` + `registry.ts`, `src/lib/ai/ask-orchestrator.ts` | Explicit triage and the source-checker lane are wired into AgentRun traces. Future work should harden telemetry and eval coverage around long-running research workflows. |
| **Boardroom** | Solid capsule-grounded discussion | `src/app/app/boardroom/page.tsx`, `src/components/boardroom/boardroom-workspace.tsx`, `src/lib/boardroom/{schema,live-runner,brainstorming-table}.ts` | P1.2 complete: turn feed, evidence, critique, recommendation, confidence, status, and synthesis are built against active capsule evidence. |
| **Memo** | Solid checks | `src/components/memo/memo-desk.tsx`, `GapFillerRail.tsx`, `source-mention-menu.tsx`, `src/lib/memo/templates/registry.ts` | P0.2 complete: claim checks and language checks run through calibrated plumbing and persist provenance. Remaining work is UX polish and broader red-line coverage. |
| **Pre-login pages (changelog/learn/pricing)** | Exist | `src/app/changelog`, `src/app/(landing)/learn`, `src/app/pricing`, `guide`, `help` | All present as shells; content/polish is the open item, not plumbing. |
| **Build/CI health** | Green w/ reduced debt | `.github/workflows/*`, `cloudbuild.yaml`, `scripts/audit-runner.ts` | P3.2/P3.3 complete: `persona-smoke` fails early without disposable Firebase secrets and audit gates run through runner lanes. Keep migrating one-off checks into durable lanes as new audits are added. |

---

## 5. Prioritized roadmap

The P0-P3 implementation roadmap is complete as of 2026-06-01. Do not add a
new active item here until §4 has a current gap and §6 has a concrete work
packet.

- **Completed P0:** Ask sourceability badges and Memo claim/language checks.
- **Completed P1:** Ask triage/source-check lane and Boardroom feed/synthesis.
- **Completed P2:** Capsule creation grounding and embedded GraphLite projection.
- **Completed P3:** unified chat-first home, authenticated E2E CI gate, and
  audit-runner lane consolidation.

---

## 6. Per-surface work packets (CODEX-actionable)

Each packet: **Goal · Touch · Done-when.** Always end with the §3 gate.

### P0.1 — Sourceability badges in Ask
- **Goal:** every Ask answer shows per-claim support status from the existing ledger.
- **Touch:** `src/lib/ai/sourceability-ledger.ts` (expose per-claim verdicts on the
  stream), `src/components/ask/AskStreamPanel.tsx` + `receipt-card.tsx` (render
  badges), `src/app/api/ai/chat/route.ts` (include ledger verdicts in the streamed
  payload). Do **not** add a new route.
- **Done-when:** an answer with a contradicted source visibly shows a red/"contradicted"
  badge; a Vitest covers the verdict→badge mapping; no calibration regression
  (`node scripts/audit-ai-routes.mjs`).

### P0.2 — Memo fact-check + language-check
- **Goal:** from the memo desk, a writer can (a) verify a selected claim against
  capsule sources and (b) run a language/tone check against `workingStyle`
  (red-line phrases, output language, audience tone).
- **Touch:** new actions in `src/components/memo/memo-desk.tsx` + `GapFillerRail.tsx`;
  reuse `delegateToAskPraxis()` / sourceability-ledger for fact-check; reuse the
  calibration `<output-constraints>` block for language check. Persist results via
  `saveToolOutput`.
- **Done-when:** selecting text → "Check claim" returns supported/contradicted with
  a receipt; "Language check" flags red-line phrases; both deduct credits correctly.

### P1.1 — Triage + live source-checking lane
- **Goal:** `ask-orchestrator` exposes an explicit triage decision (direct_answer /
  research_brief / multi_agent_review / capsule_governance) and dispatches a
  source-checking agent that updates the ledger mid-run.
- **Touch:** `src/lib/ai/ask-orchestrator.ts`, `src/lib/agent-runtime/workflow-plan.ts`
  (already enumerates `workflowKind`), `src/lib/agents/registry.ts` (add a
  `source-checker` persona/lane), `sourceability-ledger.ts`.
- **Done-when:** an AgentRun trace shows a named triage step + a source-check step;
  the ledger is populated *during* the run; `npm run audit:agent-process-contract`
  passes.

### P1.2 — Boardroom feed + synthesis
- **Goal:** a real multi-persona discussion you can read, plus a synthesis that
  states consensus, divergence, and decision options — grounded by the active capsule.
- **Touch:** `src/components/boardroom/boardroom-workspace.tsx` (turn feed render),
  `src/lib/boardroom/live-runner.ts` (drive turns), `src/lib/boardroom/schema.ts`
  (synthesis output), wire `useActiveContextStack()` for capsule grounding.
- **Done-when:** running a boardroom on a capsule yields a readable turn feed with
  evidence per turn and a synthesis card; personas pull from the capsule's sources.

### P2.1 — Capsule builder: temporality / causality / ontology
- **Goal:** capsule creation captures the grounding the schema already models.
- **Touch:** `src/components/capsules/CapsuleBuilderWizard.tsx` (new steps),
  `src/lib/context/capsule-v3.ts` (ensure fields are written, not just typed),
  `src/lib/domain/seeds.ts` + ontology types for the binding picker.
- **Done-when:** a new capsule persists timeline anchors, ≥1 causal link, and a
  domain/ontology binding; `npm run audit:capsule-contract` + `audit:capsule-v3` pass.

### P3.1 — Unified chat-first home
- **Goal:** one entry component used pre- and post-login; logged-out users see the
  same chat surface with a sign-in affordance instead of a separate marketing page.
- **Touch:** reconcile `praxis-marketing-home.tsx` and `praxis-app-launchpad.tsx`
  into a shared chat-first shell; keep SEO metadata in `page.tsx`.
- **Done-when:** `/` and `/app` share the same hero chat component; landing-bundle
  budget still passes (`npm run check:landing-bundle`); mobile landing E2E passes.

---

## 7. Documentation hygiene rules (keep the repo legible)

The 2026-06-01 cleanup removed ~115 stale files (the `_archive/` tree, dated daily
`DEEP_PRESHIP_CHECKLIST` / `PRAXIS_DOCTOR` / `launch-readiness` / `tool-contracts`
snapshots, and superseded `PRAXIS_ONE_PAGE` / `SIMPLIFIED_CONTEXT_CORE_MODEL` /
`CONTEXT_CAPSULE_V3` / `PRODUCT_REBUILD_PLAN` docs). To keep it clean:

- **One canonical per topic.** Architecture truth → `PRAXIS_ARCHITECTURE.md`.
  Roadmap/priorities → *this file*. Do not create competing "source of truth" docs.
- **Audit/doctor output is ephemeral.** Generated snapshots belong in `output/` or
  `artifacts/` (gitignored) or in CI logs — **not** committed as dated docs. If you
  must keep one, overwrite a single `docs/audits/LATEST-*.md`, don't add a new date.
- **No dated planning docs in `docs/product/`.** Fold conclusions into this
  playbook's roadmap and delete the dated scratch plan.
- **When you finish a roadmap item:** update §4 maturity, move the item out of §5,
  add a `CHANGELOG.md` `[Unreleased]` entry. Don't write a new "completion" doc.
- **Before adding any `.md`,** ask: does this belong as a section in an existing
  canonical doc? Default to *yes*.

---

## 8. Quick reference

```bash
# Local dev
npm run dev                      # frontend
docker-compose up                # backend + Neo4j + FalkorDB
curl http://localhost:8080/health

# Health / doctor
npm run doctor:praxis
node scripts/audit-ai-routes.mjs

# Deploy
gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus
```

Source-of-truth files you will reach for most: `src/lib/ai/providers.ts` +
`MODEL_MATRIX.json` (models), `src/lib/constants/tool-registry.ts` +
`src/lib/tools/tool-path-taxonomy.ts` (tools), `src/lib/context/capsule-v3.ts`
(capsule shape), `src/lib/api/with-calibration.ts` (the AI-route contract),
`src/proxy.ts` (routing/CSP).
