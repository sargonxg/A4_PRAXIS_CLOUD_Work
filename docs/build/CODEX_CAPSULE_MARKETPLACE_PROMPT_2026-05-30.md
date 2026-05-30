# Codex Working Prompts — PRAXIS Capsule Marketplace, Agentic Engine & UX Simplification

This file gives you: (A) a **master prompt** Codex can work from for a long session, then (B) **three
short sequential prompts** to paste one after another, and (C) a **fourth audit/verify/deploy prompt**.
All of them point at the authoritative plan:
`docs/product/PRAXIS_CAPSULE_MARKETPLACE_IMPROVEMENT_PLAN_2026-05-30.md`.

The product thesis to hold onto the whole time: **the real capability is the Capsule, the Agentic
engine that orchestrates research, and the Capsule Marketplace.** Everything else must get simpler,
lighter, and progressively disclosed. Pre-login sells; post-login works.

---

## A. MASTER PROMPT (long-running)

> You are Codex working in the `A4_PRAXIS_CLOUD_Work` repository — PRAXIS by TACITUS, a deployed
> Next.js 16 (App Router, React 19, TS) + Python FastAPI product on GCP Cloud Run (Firestore, Vertex
> AI/Gemini 2.5, Cloud Tasks, Pub/Sub, Secret Manager). It already has a ContextCapsule schema (ADR
> 0050), User/Situation Cores, an AnalystProfile calibration contract (`withCalibration()`), an
> 11-domain taxonomy with prototypal merge (`src/lib/domain/resolve.ts`), ACO v2.0 ontology, the SKC
> 4-layer GraphRAG (`src/lib/knowledge/*`), 55 tool surfaces, a credits spine, and Free/$49/$199/
> Institution pricing.
>
> MISSION: execute the plan in `docs/product/PRAXIS_CAPSULE_MARKETPLACE_IMPROVEMENT_PLAN_2026-05-30.md`,
> Phases 0–1. Make Context Capsules first-class (composable/versioned/signed/evaluated), ship the
> Capsule Builder and the Capsule Marketplace, deepen the agentic research→sourcing→drafting loop with
> full citations, AND radically simplify the pre/post-login UX (plan §8). Extend working systems — do
> NOT rewrite them. Keep the user-facing surface to three plain capabilities: **Capsules**, **Research
> runs**, **Marketplace**; everything else is progressively disclosed or flag-gated.
>
> READ FIRST (in order): the plan above (implement its §13 backlog and §8 UX), then `CLAUDE.md`,
> `AGENTS.md`, `ARCHITECTURE.md`, `docs/adr/0050-context-capsule-unified-schema.md`,
> `docs/product/TASKLET_STYLE_PRAXIS_AGENT_RUNTIME_PLAN.md`, and `src/lib/domain/resolve.ts`.
>
> NON-NEGOTIABLE CONVENTIONS:
> - Model strings ONLY via `src/lib/ai/providers.ts` + `src/lib/ai/MODEL_MATRIX.json`. Never hardcode
>   `gemini-*`. Forbidden: `gemini-2.0-*`, `gemini-3-pro-preview`.
> - Every AI route wraps `withCalibration(toolId, creditOpType)` → `withAuth` → credits; persist via
>   `saveToolOutput`; structured output via `Output.object()` + Zod re-validation (and Gemini
>   `responseJsonSchema`, with `propertyOrdering` matching prompt order).
> - Gate tool UI with `useSituationGuard()`; navigate with `PraxisLink`/`usePraxisRoute()`.
> - DO NOT modify Security Boundary files without asking the human: `src/lib/api/with-auth.ts`,
>   `src/lib/firebase/admin.ts`, `src/proxy.ts`, `firestore.rules` (extend only — never loosen
>   owner-only isolation), `src/lib/auth/cookie-signer.ts`, `storage.rules`.
> - Keep the surface small: new product UI lands inside Home + Capsules; no new top-level nav. The
>   public route must never render the cockpit or make authenticated data calls.
>
> EXECUTE EPICS IN THIS ORDER, one PR per epic, each with tests + passing gates + a PR description that
> references the plan section and its acceptance criteria:
> 1. **EPIC 1.9 — Pre/post-login simplification & homepage rebuild (§8)** — DO THIS FIRST.
> 2. **EPIC 0.1 — Hardening & durable AgentRun.**
> 3. **EPIC 1.1 — Capsule schema v2 + `resolveCapsule()`** (generalize `src/lib/domain/resolve.ts`).
> 4. **EPIC 1.2 — Capsule CRUD API + storage** (`src/app/api/capsules/*`, Firestore `capsules/{id}` +
>    immutable `versions/{hash}`, extend `firestore.rules` + rules tests).
> 5. **EPIC 1.3 — Capsule Builder UI (wizard + advanced mode)** + AI-assist routes.
> 6. **EPIC 1.4 — Declarative sourcing + retrieval** (SourcingPolicy/RetrievalConfig; Vertex RAG Engine
>    client; feature-flagged connectors Exa/Tavily/Firecrawl/GDELT/ACLED/ReliefWeb/OpenAlex).
> 7. **EPIC 1.5 — Agentic research run (cited)** (Genkit/ADK flow plan→source→retrieve→verify→
>    synthesize into `AgentRun`; parse `groundingMetadata`; run timeline UI streaming via `onSnapshot` +
>    AI SDK v6).
> 8. **EPIC 1.6 — Drafting workspace + export** (TipTap citation editor; brief/memo/SITREP templates;
>    DOCX/PDF/Google Docs export; shareable links).
> 9. **EPIC 1.7 — Dry-run capsule eval** (computation metrics + RAGAS Faithfulness + citation coverage,
>    surfaced in the Builder).
> 10. **EPIC 1.8 — Seed 8–10 launch capsules** (`scripts/seed-capsules.ts`, idempotent, with golden sets).
>
> AFTER EVERY EPIC, all must pass: `npx tsc --noEmit && npm run build && npm run lint && npx vitest run`,
> plus `node scripts/audit-ai-routes.mjs`, `npm run audit:repo-shape`, `npm run audit:gate`. Add tests
> for new logic (Vitest/pytest); add a Playwright check for UI epics. Update `STATUS.md` and the
> `[Unreleased]` section of `CHANGELOG.md`. Commit messages must NOT contain Co-Authored-By lines.
>
> If an acceptance criterion can't be met, STOP and report — never loosen a security boundary, fake
> output, or hardcode a model string to make a gate pass. Ask before adding any new paid third-party
> service. Phase 2 (full eval engine + Vertex Gen AI Eval + promptfoo red-team + Sigstore/in-toto
> signing + Stripe Connect marketplace + collaboration) and Phase 3 (enterprise/RBAC/data residency/
> SOC2) come only after Phase 1 is merged and verified.

---

## B. THREE SHORT SEQUENTIAL PROMPTS (paste one at a time)

Run these in order. Wait for each to finish, merge/verify, then paste the next.

### ▶ PROMPT 1 — Simplify the app + harden the runtime (UX first)

> Read `docs/product/PRAXIS_CAPSULE_MARKETPLACE_IMPROVEMENT_PLAN_2026-05-30.md` §8 and §13, plus
> `CLAUDE.md` and `AGENTS.md`. Implement **EPIC 1.9 (pre/post-login simplification & homepage rebuild)**
> then **EPIC 0.1 (hardening & durable AgentRun)**.
>
> For 1.9: rebuild `src/app/page.tsx` as a LIGHT public marketing page (nav → hero with ONE prompt +
> ONE "Start free" CTA → three capability cards: Context Capsules / Agentic research / Capsule
> marketplace → marketplace teaser → trust strip → pricing → footer). Remove the cockpit and ALL
> authenticated/cockpit data fetches from the public route. Rebuild `src/app/app/page.tsx` as a calm
> launchpad: one hero prompt + a capsule chip + ≤4 recent items + three quiet links; collapse the
> 5-column context model into an "Advanced / Edit context" disclosure. Flag-gate all operator chrome
> (Diagnostics, "systems ready", Search app, "catalogued" counts, context-health "red flags") behind
> `ADMIN_ALLOWLIST` or a `NEXT_PUBLIC_PRAXIS_DEBUG` flag. Move receipts/filter facets into the
> Capsules/Marketplace page as collapsible filters. Unify "Capsule workspace / Repository lane /
> Personal Knowledge Board" into ONE term, keeping legacy routes as redirects. New marketing components
> go in `src/components/marketing/*`.
>
> For 0.1: make all gates green and finalize the durable `AgentRun` (Firestore model + Cloud Tasks
> dispatch + Pub/Sub events + `onSnapshot` streaming) per the Tasklet runtime plan; extend
> `firestore.rules` (runs collection, owner-only) — extend, do not loosen.
>
> Honor every convention in `CLAUDE.md` (model strings via `providers.ts`, `withCalibration`,
> `useSituationGuard`, no edits to Security Boundary files without asking). After finishing: run
> `npx tsc --noEmit && npm run build && npm run lint && npx vitest run`,
> `node scripts/audit-ai-routes.mjs`, `npm run audit:repo-shape`, `npm run audit:gate`; add a Playwright
> test that `/` shows the marketing hero and NOT the cockpit; capture before/after screenshots; update
> `STATUS.md` + `CHANGELOG.md`. One PR per epic, no Co-Authored-By lines. Stop and report if any
> acceptance criterion fails.

### ▶ PROMPT 2 — Capsules: schema v2, CRUD, Builder

> Read the plan §3, §4, and §13 (EPICs 1.1–1.3). Implement them in order.
>
> 1.1: extend ADR 0050 to `capsule/v2` in `src/types/context-capsule.ts` (+ Zod schema in
> `src/lib/ai/schemas/context-capsule.ts`, Pydantic mirror in `backend/`) with lineage
> (`contentHash`/`version`/`forkedFrom`/`immutable`), composability (`extends`/`imports`/
> `mergeStrategy`), `sourcing`, `retrieval`, `guardrails`, `eval`, `provenance`, `market`. Implement
> `resolveCapsule(ref)` in `src/lib/capsules/resolve.ts` by generalizing the prototypal merge in
> `src/lib/domain/resolve.ts`; unit-test merge order and a stable canonical `contentHash`.
>
> 1.2: Firestore `capsules/{id}` + immutable `versions/{hash}`; routes `src/app/api/capsules/*`
> (create/get/list mine|org|public/update-draft/fork/publish) wrapped `withAuth`; extend
> `firestore.rules` (owner writes drafts, published immutable, org/public read) + rules tests.
>
> 1.3: Capsule Builder at `src/app/app/capsules/builder/*` + `src/components/capsules/*` — the 6-step
> wizard (Job/Sources/Output/Tools/Test/Publish) + advanced JSON mode (Monaco + live preview); AI-assist
> routes `/api/capsules/assist/*` (calibrated) for persona/schema/source/few-shot drafting. A
> non-technical user must be able to author and publish a capsule without editing JSON.
>
> Same conventions and same gate commands as before; add tests; update `STATUS.md`/`CHANGELOG.md`; one
> PR per epic; no Co-Authored-By lines; stop and report on any failure.

### ▶ PROMPT 3 — Agentic engine, drafting, eval, launch capsules

> Read the plan §5, §6, §7, §10, and §13 (EPICs 1.4–1.8). Implement them in order.
>
> 1.4: implement `SourcingPolicy`/`RetrievalConfig`; wire live-search (existing Grounding w/ Google
> Search), SKC layers (`src/lib/knowledge/*`), and a new Vertex AI RAG Engine corpus client in
> `backend/`; add feature-flagged connectors in `src/lib/data-feeds/` (Exa, Tavily, Firecrawl, GDELT,
> ACLED, ReliefWeb, OpenAlex; keys via Secret Manager) with fuse+dedupe+trust-rank.
>
> 1.5: Genkit/ADK flow plan→source→retrieve→verify→synthesize in `backend/ai/flows.py`, persisting to
> `AgentRun`; parse `candidate.groundingMetadata` into an inline citation map (walk `groundingSupports`
> by descending `endIndex`); enforce `minSourcesPerClaim`/`maxUngroundedClaims`; build
> `src/components/runs/run-timeline.tsx` streaming via `onSnapshot` + AI SDK v6.
>
> 1.6: TipTap editor with a citation mark in `src/components/drafting/*`; brief/memo/SITREP/talking-
> points templates; AI actions (redraft/expand/tighten/tone/fact-check) via calibrated routes; export
> service `/api/export/*` → DOCX (`docx`), PDF (`pdf-lib`/Puppeteer), Google Docs (Drive API); shareable
> read-only report links with audit log.
>
> 1.7: backend dry-run eval endpoint (computation metrics + RAGAS Faithfulness + citation coverage +
> schema conformance on 2–3 samples) surfaced in the Builder "Test & evaluate" step.
>
> 1.8: author the §10 capsules (conflict analysis, sanctions impact, economic policy, mediation
> readiness, treaty review, humanitarian SITREP, election risk, energy security, stakeholder decision
> memo, OSINT source-to-brief) as idempotent seed data `scripts/seed-capsules.ts` with golden sets; all
> must pass dry-run eval.
>
> Same conventions and gate commands; add tests; update `STATUS.md`/`CHANGELOG.md`; one PR per epic; no
> Co-Authored-By lines; stop and report on any failure or before adding any paid third-party service.

---

## C. PROMPT 4 — Full audit, verify, and deploy

> Do a complete verification pass over everything implemented from
> `docs/product/PRAXIS_CAPSULE_MARKETPLACE_IMPROVEMENT_PLAN_2026-05-30.md` Phases 0–1, then deploy.
>
> 1. **Gates:** run and report results of `npx tsc --noEmit`, `npm run build`, `npm run lint`,
>    `npx vitest run`, `node scripts/audit-ai-routes.mjs`, `npm run audit:repo-shape`,
>    `npm run audit:gate`, `npm run audit:architecture-reference`, `npm run audit:gcp`, and (backend)
>    `cd backend && python -m pytest tests/ -v`. Fix any failure at its root cause (no skips, no model
>    hardcoding, no security loosening).
> 2. **Acceptance-criteria audit:** for each epic 1.9, 0.1, 1.1–1.8, confirm its plan §13 acceptance
>    criteria are met and list evidence. Explicitly verify the §8.6 simplification criteria: logged-out
>    `/` makes ZERO authenticated/cockpit data calls and shows no Diagnostics/context-model/receipts
>    with exactly one CTA; signed-in `/app` default shows prompt + capsule chip + ≤4 recent items with
>    the context model collapsed; all operator chrome is flag-gated.
> 3. **Runtime smoke:** `npm run smoke:app-usability`, `npm run smoke:core-flows`, and the authenticated
>    runtime lane per `docs/testing/AUTHENTICATED_RUNTIME_TEST_LANE.md`. Run a real end-to-end:
>    pick a Verified launch capsule → ask a question → agentic run produces a cited output → open in the
>    drafting editor → export DOCX/PDF. Report whether it works, with the run id.
> 4. **Convention audit:** confirm no forbidden model strings (`rg "gemini-2\.0|gemini-3-pro-preview"
>    src/ backend/` returns zero), every new AI route is calibrated, and no Security Boundary file was
>    changed without an explicit note.
> 5. **Graph + docs:** run `graphify update .`; ensure `STATUS.md`, `CHANGELOG.md` `[Unreleased]`, and
>    the plan doc reflect what shipped.
> 6. **Deploy:** if and only if all gates are green, deploy via the standard path
>    (`npm run deploy:frontend:main-safe`, Cloud Build → Cloud Run) and verify `https://praxis.tacitus.me/`
>    and `/login` return 200, `/api/health` reports Firestore/AI/cookie `ok`, and the new public home
>    renders the marketing page. Record a production checkpoint in `CLAUDE.md` "Latest Validation
>    Checkpoint" and `docs/DEPLOYMENT_LOG.md`.
> 7. **Report:** produce a short pass/fail table of every gate, every acceptance criterion, and the
>    deploy result. If anything is red, stop before deploying and report exactly what and why.
