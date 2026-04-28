# PRAXIS Strategy

Status: current as of 2026-04-27. Pair this with
`docs/MONSTER_TODO_2026-04-27.md`, which is the execution queue.

## Product Position

PRAXIS is a calibrated intelligence workspace for policy, diplomacy,
mediation, humanitarian, legal/sanctions, political-risk, and research teams.
It should feel like a professional case-file system with embedded expert
agents, not a generic chatbot.

The product promise is simple: a user opens a situation and gets defensible,
role-aware analysis that is grounded in their mandate, sources, prior work,
tool outputs, and operational constraints. Every output should be citeable,
auditable, and safe to brief upward.

Ambitious operating goal for 2026: PRAXIS becomes the policy professional's
operating room. A user should be able to create a situation, add documents and
sources, ask calibrated questions, watch expert personas deliberate over their
text or uploaded files, red-team the result, and ship a briefing, memo, talking
points, negotiation plan, or knowledge-base answer without leaving the case
file. The full operating model is in
`docs/POLICY_PROFESSIONAL_OPERATING_MODEL_2026-04-28.md`.
The database and dashboard implementation plan is in
`docs/DATABASE_DASHBOARD_IMPROVEMENT_PLAN_2026-04-28.md`.

Primary users:

- Policy officer or political affairs desk
- Diplomatic advisor, envoy team, mediator, or negotiation support cell
- Humanitarian access, protection, or coordination lead
- Legal, sanctions, accountability, or compliance analyst
- Conflict, media, disinformation, or political-risk researcher
- Institutional team that needs repeatable intelligence workflows

## Ten Role Paths

The paid core should stay understandable through ten role paths, not an
unbounded tool catalog:

1. UN / OSCE political officer
2. Bilateral diplomat / country desk
3. Mediator / envoy support
4. Humanitarian access / protection lead
5. IHL / accountability / sanctions analyst
6. Political-risk / private-sector analyst
7. Think-tank / policy researcher
8. Media / disinformation analyst
9. Stabilization / peacebuilding program lead
10. Election / governance specialist

Each path should start from the same situation, then recommend the first ten
core tools in a role-specific order: Dashboard, Early Warning, Risk Monitor,
Actor Profiles, Stakeholder Map, Briefing, Talking Points, Negotiation Prep,
Commitments, and Sanctions.

## Strategic Bets

1. **Situation-first workspace**
   - The active situation is the unit of work.
   - Onboarding, dashboard recommendations, context injection, retrieval,
     tool persistence, agents, and admin diagnostics must all resolve through
     the same situation frame.
   - Empty states should explain which profile, situation, source, document,
     or prior-output context is missing.

2. **Calibrated expert outputs**
   - Every authenticated AI route must prepend the context-injection block
     from `docs/CONTEXT_INJECTION.md`.
   - AnalystProfile, situation frame, domain frame, retrieval context, red
     lines, language, audience, and citation discipline are product
     requirements, not prompt niceties.
   - Expert agents should behave like policy/diplomacy specialists: clear
     assumptions, BLUF, confidence, citations, dissenting views, and concrete
     next actions.

3. **Trustable operational spine**
   - `tool_runs`, `background_jobs`, `system_events`, notifications, audit
     logs, TTL, idempotency, and semaphore states are the shared runtime
     language.
   - Users should see degraded data, stale feeds, failed jobs, and missing
     evidence explicitly.
   - Operators should be able to move from a user-visible failure to the
     source job, tool run, event, retry action, and audit row in a few clicks.

4. **Durable agent runtime**
   - LangGraph on Cloud SQL is the durable runtime for multi-step agents.
   - Firestore remains the user-facing source of truth.
   - Agents may draft, critique, synthesize, and propose graph/profile/timeline
     updates, but they must not silently mutate canonical state.
   - Cloud Tasks should carry long-running jobs; duplicate delivery must be
     idempotent.

5. **Evidence and data quality before breadth**
   - Structured extraction, OCR/layout fallback, corpus normalization,
     provenance, and RAG faithfulness matter more than adding more visible
     tools.
   - All retrievable knowledge should normalize toward `CorpusItem` or the
     canonical Firestore tool-output contract.
   - Graph and entity work should start with canonical naming, schema
     validation, and approval queues before adding more storage systems.

6. **Launch-grade commercial surface**
   - Public pricing is monthly and plan-based: `free`, `analyst`, `team`,
     `enterprise`.
   - Polar is the launch billing provider. Checkout, portal, and webhooks must
     mirror entitlements into Firestore; Organization Access Tokens never
     appear in client code.
   - Free is not a dead demo. It keeps grounded research, situation setup,
     Google-first analysis, limited web/source tools, and enough credits for a
     serious user to see the policy workflow.
   - `PROMO_FULL_ACCESS_CODES` supports one-week full-access pilots. Promo
     access is expiry-aware in the server tier resolver and should be rotated
     after each cohort.
   - Internal credits, token costs, and meter plumbing remain private unless
     intentionally exposed in admin/billing surfaces.
   - Landing, onboarding, and first-run workflows must make PRAXIS legible to
     serious buyers without leaking demo data or retired vendor names.

7. **Knowledge-base products**
   - PRAXIS should let teams turn their corpus into an internal or public
     policy chatbot: upload sources, approve extraction, tune persona and
     citation rules, publish an ARGUS-style assistant, and monitor gaps.
   - Firestore vector search is the near-term personal/situation corpus path.
     Vertex AI Vector Search and Vertex AI Search/RAG become the managed
     path when corpora exceed Firestore latency, scale, or governance limits.
   - Published bots must be source-bounded, citation-first, and revocable.
     They should answer from approved corpora, disclose uncertainty, and
     refuse unsupported claims.

## Technical Strategy

Current production stack:

- Cloud Run: `praxis-frontend`, `praxis-backend`
- Firebase Auth and Firestore: identity and primary application state
- Cloud SQL Postgres: LangGraph checkpointing only
- Secret Manager: service credentials, AI keys, cron/cookie/user secrets,
  LangGraph database password
- Cloud Build and Artifact Registry: build and deploy path
- Pub/Sub, Cloud Tasks, Cloud Scheduler: async and scheduled work
- BigQuery: analytics and long-tail operational analysis
- Cloud Storage and Document AI: uploads and OCR/layout extraction

Source-of-truth decisions:

- Firestore is canonical for users, situations, tool outputs, jobs, events,
  notifications, audit logs, and agent run metadata.
- Cloud SQL stores LangGraph checkpoints and should not become product state.
- Tool outputs should converge on one canonical write helper and one readable
  envelope.
- Model selection flows through `src/lib/ai/providers.ts`.
- Retired vendors do not appear in user-facing copy.

GCP/API posture checked on 2026-04-28:

- Enabled and strategically useful now: Vertex AI (`aiplatform`), Firebase
  Vertex AI, Firestore, Firebase Auth, Secret Manager, Cloud Run, Cloud Tasks,
  Cloud Scheduler, Pub/Sub, BigQuery, Cloud Storage, Model Armor, and
  Text-to-Speech.
- Use official Google paths for the next build decisions:
  - Vertex AI Agent Engine supports ADK, LangChain, and LangGraph style
    agents.
  - Vertex AI Vector Search is the managed semantic search layer for larger
    RAG and recommendation workloads.
  - Firestore vector search is appropriate for user/situation-scoped chunks
    that should stay close to canonical app state.

Operational checks:

- `npx tsc --noEmit`
- `npm run build`
- `npm run audit:gcp`
- `node scripts/audit-ai-routes.mjs`
- `npx vitest run`
- Production smoke: `/`, `/login`, `/api/health`, and backend
  `/agents/health` when agent runtime changed

## Current High-Impact Coding Queue

This is the strategy-level queue. The detailed acceptance criteria and owner
notes live in `docs/MONSTER_TODO_2026-04-27.md`.

| Rank | Item | Why it matters |
|---|---|---|
| 1 | LangGraph runtime hardening | Proves durable agents are healthy in Cloud Run, with TTL, indexes, private-IP DB access, and failure events. |
| 2 | Brainstorming Table -> LangGraph + Cloud Tasks | First policy-native long-running agent with persona turns, edit-before-synthesis, checkpoint recovery, and provenance. |
| 3 | Structured ACO extraction validation | Removes the largest silent data-quality failure mode in graph extraction. |
| 4 | Document AI fallback for scanned PDFs | Makes uploaded reports usable for real policy and humanitarian workflows. |
| 5 | Situation/user/data health layer | Gives dashboards and admin surfaces a shared red/yellow/green view of stale feeds, failed jobs, missing profile fields, and degraded corpus coverage. |
| 6 | Cloud Tasks dispatcher | Replaces fragile polling with idempotent, retryable queues for research, agents, and embeddings. |
| 7 | BigQuery `system_events` sink | Makes operational failures queryable beyond Firestore console workflows. |
| 8 | Secure admin console v2 | Lets operators diagnose and retry failures without exposing sensitive payloads. |
| 9 | Digital advisor knowledge feeding | Ensures Ask PRAXIS/SKC reads uploaded docs, notes, Source Scout, grounded search, and prior tool outputs with citations. |
| 10 | Eval harness | Adds quality gates for extraction, RAG faithfulness, and top-tool schema validity. |
| 11 | Landing paid-launch polish | Clarifies the product for buyers and removes remaining funnel, accessibility, and demo-data trust issues. |
| 12 | Postgres checkpoint cleanup | Prevents unbounded LangGraph storage growth using checkpointer APIs, not raw SQL. |
| 13 | Polar billing completion | Turns the paid funnel live with checkout, customer portal, webhooks, trial state, and Firestore entitlements. |
| 14 | Firestore artifact normalization | Unifies research/tool/document outputs so the SKC and Ask PRAXIS retrieve one canonical evidence envelope. |

## Roadmap

### Next 7 days

- Finish LangGraph production hardening and checkpoint cleanup plan.
- Start Brainstorming Table durable runtime after health is proven.
- Land structured extraction validation and Document AI fallback.
- Build the situation/data health helper as a library first, then wire UI.
- Keep demo-leak closures and onboarding/auth audit moving in parallel.
- Finish Polar product/webhook setup and run the checkout-to-entitlement smoke.
- Run a free-account research smoke: grounded-search route, Ask PRAXIS
  fallback, Firecrawl-free URL fetch, and at least three core tools.
- Run a free-account Brainstorming Table smoke over pasted text and one
  uploaded document, then repeat as Analyst/Team with premium provider keys.
- Browser-test `PRAXIS-WEEK-PASS` locally, then replace with real short-lived
  pilot codes in Vercel/Secret Manager before inviting users.

### Next 30 days

- Migrate background work to Cloud Tasks with CAS locking and retries.
- Ship BigQuery system-event sink and admin console v2 drill-down.
- Unify tool-output writes and retrieval so SKC always sees fresh outputs.
- Feed digital advisor/SKC from notes, uploaded docs, grounded search, Source
  Scout, and tool outputs through normalized provenance.
- Add optional eval gates for extraction and RAG quality.
- Convert the ten role paths into onboarding recommendations and dashboard
  quick-start paths.

### Next 90 days

- Expand durable agents beyond Brainstorming Table into source scout, graph
  cartography, timeline editing, red-team review, and negotiation support.
- Scale graph visualization with Sigma.js/Graphology once canonical graph
  quality and approval flows are stable.
- Add App Check enforcement after logging burn-in, stronger admin gating,
  email alerting, and billing/meter visibility.
- Keep Firestore-first until graph traversal or retrieval performance proves
  a concrete need for Neo4j/Falkor/TrustGraph/Spanner.

## Definition Of Done

A change is done when:

- The relevant validation gate passes.
- The route, job, tool, or agent emits spine events with TTL where applicable.
- User-visible degraded, empty, and failure states are explicit.
- Data writes use canonical helpers and preserve provenance.
- Docs reflect what shipped, what remains, and any changed ownership.
- Production deploy and smoke are recorded when runtime behavior changed.
