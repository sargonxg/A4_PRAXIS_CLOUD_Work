# 00 — PRAXIS v7 · Vision and Operating Principles

> **Audience:** Codex (and any AI agent or human) working on
> `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work`.
> **Branch:** commit directly to `main` as soon as each unit of work is green.
> **Production target:** `praxis.tacitus.me` on GCP project `praxisbytacitus`
> (Cloud Run `praxis-frontend` + `praxis-backend`, Firebase Auth, Postgres + pgvector,
> Cloud Storage, Vertex AI / Gemini Enterprise model runtime).
> **Read order:** this file first, then `01` → `02` → `03` → `04`.

---

## 1. Why this rewrite exists

PRAXIS today is technically powerful but visually overwhelming. The repo has:

- A 4-tab / 7-chapter workbench (Context, Library, Ontology, Graph + Desk, Research, Memos, Draft, ACH, Tools, Boardroom).
- An "archive" sidebar with eight more entry points (Source Scout, GraphOps, Briefing Studio, Advisor Table, Documents, Sanctions, Media Compass, Methodology).
- 57 analyst tools under `skills/tools/`, 7 subagents under `skills/subagents/`.
- 9 domain ontologies + 10 case types under `src/lib/ontology/`.
- A floating PRAXIS chat, a debug panel, an activity panel, an onboarding wrapper, a global search, a demo banner, and three error boundaries — all stacked in `src/components/app/app-shell.tsx`.

A new analyst opening the app sees ~30 first-class surfaces and is asked to choose. **That is the bug.** The rewrite is not about removing capability. It is about hiding the toolbox behind one assistant-driven workspace, so the user sees five questions, not fifty buttons.

The five questions an analyst should be answering at any moment are:

1. **What am I working on?** (which Situation)
2. **What does PRAXIS already know?** (Context Cores in scope)
3. **What is missing?** (gaps, sources, claims, actors, time)
4. **What should I do next?** (PRAXIS suggests; user confirms)
5. **What output do I need?** (memo, brief, dossier, talking points, export)

If a screen does not visibly help with one of those five questions, it is in the wrong place. Fold it into **Ask PRAXIS**, **Cores Library**, or **Outputs**, or retire it.

---

## 2. The doctrine, in one paragraph

> **PRAXIS is a context operating system with a single front door called Ask PRAXIS.**
> Analysts open a Situation, ask a question in natural language, and PRAXIS answers using the cores and skills the user explicitly attached. Cores are inheritable, shareable, owner-scoped artifacts that hold preferences, ontologies, evidence, structure, and outputs. Skills (formerly "tools") are routed automatically by Ask PRAXIS or selected manually. Outputs preserve provenance. Memory (Cognee) is optional and the product works without it.

Everything in `01`–`04` follows from that paragraph.

---

## 3. The Context Cores model

A "core" is a named, owner-scoped, versioned bundle of structured knowledge that PRAXIS can attach to a conversation or a workflow. There are eight core types in v7. Some are scaffolded today; the rewrite makes them first-class:

| Core | What it holds | Owner / scope | Status today |
|---|---|---|---|
| **PRAXIS Core** | Platform brain: tool registry, workflows, answer rules, validators, the conflict grammar v1, truth layers v1 | Platform-level, read-only | Implicit in `src/lib/`; needs a single `praxis_core.json` manifest |
| **User Core** | Identity, role, mandate, communication style, model/cost preferences, saved defaults, jurisdiction, language | Per-user (`owner_uid`) | Partial in `src/lib/context/profile-context.ts`; needs a real Postgres table + UI |
| **Team Core** | Org/team-level shared preferences, shared situations, shared sources, shared rubrics | Per-team (`team_id`), members opted-in | Stub in `MULTI_TENANT_MODEL.md`; needs MT-1..5 decisions resolved |
| **Situation Core** | The active case: frame, goals, geography, timeline, actors, hypotheses, gaps, assumptions, recent work | Per-user, optionally team-shared | Partial: `situation` records exist; needs to absorb the Context tab + extend |
| **Source Core** | Source receipts, credibility posture, coverage gaps, retrievable fragments | Per-situation | Partial via `source_receipts` |
| **Document Core** | Uploaded files, extracted text, entities, fragments, OCR posture, document provenance | Per-situation, can be promoted to team | Partial via `documents-service` |
| **Graph Core** | ACO graph (8 primitives × 4 layers), candidate vs canonical, ontology binding, embeddings | Per-situation | Solid: `graph_nodes`, `graph_edges`, `graph_embeddings`, `graph_audit` |
| **Output Core** | Memos, briefs, drafts, handovers, talking points, exports, dossier packages, board packs | Per-situation, exportable | Partial across `chapters/` |

**Core inheritance rules.** A core can declare a parent core. When attached to an Ask PRAXIS conversation, a child inherits its parent's contents unless it explicitly overrides. Inheritance is shallow (one parent), not multiple. A User Core can clone defaults from another User Core only at creation time; after that they diverge. A Situation Core can fork from another Situation Core — that is the most common pattern: "open a new analysis on Country X, inherit the methodology, sources, and stakeholder map from my Country Y core."

**Core sharing rules.** A core is private by default. A user can share a core to a team, to specific users by email, or to a public read-only link. Share grants are audited (`graph_audit` already exists; extend it to a generic `core_audit` table — see `02`).

**Core attachment in Ask PRAXIS.** The Ask PRAXIS bar shows a horizontal strip of "attached cores" chips: User Core (always), Situation Core (current case, default attached), and any optional cores the user picked from the core library or dragged from the sidebar. Drag-and-drop is non-negotiable: `@dnd-kit/core` is already in `package.json`, use it.

---

## 4. The simplified surface (what the user sees)

After the rewrite, the authenticated app has exactly **four top-level destinations**:

1. **Home** — operating desk: active Situation card, recent Situations, "next actions", and Ask PRAXIS as the first thing on the page.
2. **Ask** — full-screen Ask PRAXIS: command bar at top, attached cores strip, conversation thread, suggestion rail.
3. **Cores Library** — the user's structured knowledge model: User, Team, Situation, Source, Document, Graph, and Output Cores. This absorbs today's Situation, Sources, Context, Library, Ontology, Graph, Settings, Admin, ACH, Boardroom, and specialist surfaces as progressively disclosed panels.
4. **Outputs** — the work product surface: memos, briefs, drafts, handovers, talking points, exports, and board packs.

That is the entire primary navigation. The 30+ surfaces from today must collapse into those four, with no silent loss of capability. Legacy compatibility routes such as `/app/situation`, `/app/sources`, and `/app/advanced` may exist temporarily, but they are not product destinations. Mapping is in `01`.

A separate **Policy Product** lives at the org/team level — see `04` §6. It is reachable from Outputs and from Cores Library specialist panels, but it is not a fifth destination.

---

## 5. What stays, what hides, what is retired

**Stays as-is (do not rewrite):**

- The Postgres KG contract (`graph_nodes`, `graph_edges`, `graph_embeddings`, `graph_audit`) and its migrations 0011–0018.
- The 9 ontology modules under `src/lib/ontology/` and `backend/ontology/`.
- The 8-primitive ACO and 4-layer truth model.
- The `withCalibration` context-injection contract (`docs/CONTEXT_INJECTION.md`).
- The Cognee disabled-safe binding posture in `backend/services/cognee_memory.py`.
- The 30+ audit scripts. They guard the architecture; we add to them, we do not weaken them.
- The Vertex AI / Gemini Enterprise model isolation.
- Firebase Auth, Firestore for user metadata, Cloud Storage for blobs.
- The deploy pipeline (`cloudbuild.yaml`, `cloudbuild.frontend.yaml`).

**Hides behind Ask PRAXIS, Cores Library, or Outputs (do not delete):**

- The 4 substrate tabs (Context, Library, Ontology, Graph) — fold their UIs into the **Cores Library** as Situation, Source, Document, and Graph Core panels.
- The 7 chapters (Desk, Research, Memos, Draft, ACH, Tools, Boardroom) — fold Memos/Draft/Boardroom produce flows into **Outputs**, fold Research into **Ask PRAXIS**, and surface ACH/Tools/Boardroom as specialist panels inside **Cores Library** instead of primary navigation.
- The archive links (Source Scout, GraphOps, Briefing Studio, Advisor Table, Documents, Sanctions, Media Compass, Methodology) — Source Scout and Documents become Source/Document Core actions; GraphOps, Sanctions, Media Compass, and Methodology become Cores Library specialist panels; Briefing Studio merges into **Outputs**; Advisor Table becomes a Boardroom workflow under Cores/Outputs.
- The floating PRAXIS button — replaced by the always-visible Ask bar in **Home** and **Ask** (still available everywhere as a slim command-K palette).
- The debug and activity panels — live under **Cores Library → Diagnostics**.

**Retired (delete after grace period):**

- Any standalone marketing-style page inside the authenticated app (e.g., archived `_archive/` landing components stay in `(landing)/` only).
- Duplicate "tools" indexes once the Analyst Skills surface in `04` lands.
- The `/syria-case` standalone route — it becomes a **demo Situation Core** seeded into the new surface, not a separate page.

**Decision rule when in doubt:** if a surface does not directly help with one of the five analyst questions in §1, it becomes a specialist panel inside Cores Library or is retired. Never invented from scratch in the new shell.

---

## 6. Recategorization map (current → v7)

This is the canonical mapping Codex must follow. Treat it as a contract; if a piece of code does not fit, write a short ADR under `docs/adr/` and ask before deviating.

| Today (file/route) | v7 destination |
|---|---|
| `src/app/app/dashboard/` | **Home** |
| `src/components/app/floating-praxis.tsx` | merged into **Home** Ask bar + global ⌘K palette |
| `src/components/assistant/` | becomes the **Ask** surface engine |
| `src/tabs/context/` | **Cores Library → Situation Core / Frame** panel |
| `src/tabs/library/` | **Cores Library → Source + Document Cores** panel |
| `src/tabs/ontology/` | **Cores Library → Graph Core / Ontology** panel |
| `src/tabs/graph/` | **Cores Library → Graph Core** panel |
| `src/chapters/desk/` | **Home** dashboard widgets + **Outputs** entry list |
| `src/chapters/research/` | folded into **Ask** as "deep research" mode |
| `src/chapters/memos/`, `draft/` | **Outputs → Memos / Drafts** |
| `src/chapters/ach/` | **Cores Library → ACH** specialist panel |
| `src/chapters/tools/` | **Cores Library → Analyst Skills** registry and Ask routing source |
| `src/chapters/boardroom/` | **Cores Library → Boardroom** plus **Outputs** synthesis |
| `/source-scout`, `/documents` | **Cores Library → Source + Document Cores** |
| `/graphops`, `/sanctions`, `/media-compass`, `/methodology` | **Cores Library** specialist panels |
| `/briefing` | **Outputs → Briefing** |
| `/brainstorming-table` | **Cores Library → Boardroom** (renamed) |
| `/syria-case` | seed **Situation Core** template, not a route |
| `src/app/app/admin/`, `settings/`, `profile/` | **Cores Library** account/admin panels |
| `skills/tools/*` (57 tools) | **Analyst Skills** registry, see `04` |
| `skills/subagents/*` (7 subagents) | **Subagent registry** behind Ask routing, see `04` §3 |
| `src/app/app/cases/`, `situations/`, `workbench/` | unify as **Situation Cores** under `/app/cores` and compatibility workbench routes until cutover |
| `src/lib/context/*` | absorbs into **User Core** + **Situation Core** services |
| `src/components/landing/*` | landing redesign, see `01` §2 |

Codex must not delete any of the above before its replacement is wired and the relevant audit (e.g., `audit:tool-marketplace`, `audit:context-aware-coverage`, `audit:ux-polish`) passes.

---

## 7. Operating principles for Codex

These are non-negotiable. Every PR Codex opens against `main` must satisfy them.

1. **Simplify the surface, not the substrate.** Backend contracts, ontologies, the KG schema, audits, and provenance stay. Only the UX collapses.
2. **One destination per concept.** No more "Cases vs Situations vs Workbench" in primary navigation. Pick one user-facing home for structured context: **Cores Library**.
3. **Ask PRAXIS is the front door.** Every workflow must be reachable from Ask. If a panel cannot be invoked through Ask, write the routing intent in `04` §3 first.
4. **Cores are first-class.** Every new endpoint, hook, and component takes core IDs as inputs, not loose strings.
5. **Owner scoping is mandatory.** No new table, no new endpoint, no new query without `owner_uid` (and `team_id` when shareable). `audit:owner-scoping` must continue to pass.
6. **Cognee remains optional.** If `COGNEE_ENABLED=false`, the app must work end-to-end with empty memory recall. `audit:cognee-ui-honesty` continues to pass.
7. **Provenance is preserved.** Every claim in an output traces back to a source receipt or a graph node + ontology binding. No naked AI text in a memo without a citation chip.
8. **Advisory by default.** AI-generated graph nodes/edges are **candidate** until a human promotes them. The symbolic firewall (`backend/services/firewall*`) stays.
9. **Models routed through Vertex.** No direct model-string drift. `audit:ai-provider-vertex-default` and `audit:ai-provider-isolation` continue to pass.
10. **Commits to `main` only after green local gate.** Run `npx tsc --noEmit && npm run lint && npm run build && npm run audit:gate && npx vitest run` locally. Do not merge red.
11. **Small, deployable increments.** Ship the rewrite in slices — see `01` §10 for the slice plan. Never a 10k-line PR.
12. **Document as you go.** Every slice updates `STATUS.md`, `CHANGELOG.md`, and the relevant doc under `docs/`. ADRs go under `docs/adr/`.
13. **No new dependencies without a justification line in the PR.** The repo has 57 prod deps; we should be subtracting, not adding.
14. **Mobile is a real target.** The new surface must work at 380 px. Sidebar collapses, Ask bar stays, drag-and-drop falls back to a "Add core" sheet.
15. **Accessibility is not optional.** WCAG 2.1 AA, keyboard navigation for Ask and core attachment, focus traps in modals.

---

## 8. How Codex should organize the work

Codex should treat the rewrite as **five tracks running in parallel**, one per file in this brief:

- **Track A — Frontend & UX** (`01_FRONTEND_AND_UX.md`)
- **Track B — Backend, Database & Deployment** (`02_BACKEND_DATABASE_AND_DEPLOYMENT.md`)
- **Track C — Context Cores & Dynamic Ontologies** (`03_CONTEXT_CORES_AND_DYNAMIC_ONTOLOGIES.md`)
- **Track D — Analyst Skills, Policy Product & Outputs** (`04_ANALYST_SKILLS_POLICY_PRODUCT_AND_OUTPUTS.md`)
- **Track E — this brief** (vision/principles, kept current as decisions are made)

Each track has its own work breakdown inside its file. Codex must keep a top-level `docs/v7/` folder that mirrors the five briefs, plus a single live ledger `docs/v7/STATUS.md` that lists every slice with state `proposed | in-progress | shipped | reverted`.

Order of operations:

1. **Foundations week.** Introduce the `core_*` tables (Track B), the cores TypeScript domain (Track C), and the new app-shell skeleton (Track A) behind a feature flag `NEXT_PUBLIC_PRAXIS_V7=true`. Old shell still default.
2. **Home + Ask slice.** Make Home and Ask work end-to-end with stub cores. Drag-and-drop attachment works.
3. **Cores Library slice.** Fold Situation, Source, Document, Graph, Settings, Admin, ACH, Boardroom, and Analyst Skills entry points into one progressively disclosed Cores surface. Existing data shows up.
4. **Outputs slice.** Memos + Draft + Briefing + Boardroom synthesis collapse into Outputs.
5. **Analyst Skills routing slice.** Tools registry becomes the Analyst Skills capability layer inside Cores Library and the routing layer for Ask.
7. **Cutover.** Flip the feature flag default to `true`, leave the legacy shell reachable at `/app/legacy/*` for one release cycle, then remove.
8. **Polish & audit hardening.** Add the new audits described in `02` §9 and `03` §8.

---

## 9. Definition of done (for the whole rewrite)

The v7 rewrite is "done" when **all** of these are true:

- A first-time user lands on `praxis.tacitus.me`, signs in via Firebase, and sees Home with one active Situation, an Ask bar, and a "Next actions" rail. They have not been asked to pick a tool from a list of 50.
- The user can ask any of the five analyst questions and get a grounded answer with citations or a clear "I don't have enough context" with a suggested next step.
- The user can drag a Situation Core from the sidebar onto the Ask bar and the next answer reflects that core. They can detach it the same way.
- The user can fork a Situation Core into a new analysis and the methodology/sources/stakeholder map are inherited.
- The user can produce a memo, brief, talking points, or export with full provenance, in under five clicks from Ask.
- A second user invited to the same team sees the shared cores; private cores remain invisible.
- All existing audits pass. New audits added by Tracks B/C/D pass.
- The Cognee toggle works: `disabled` → app fully functional with empty memory; `postgres-kuzu` → memory recall improves.
- The app loads under 2.5 s p95 on a cold cache on Cloud Run and Lighthouse Performance ≥ 85 on the landing.
- `praxis.tacitus.me` serves the new shell behind the v7 flag flipped on.
- `STATUS.md` says `v7 shipped` and the legacy shell is removed.

---

## 10. Anti-goals (things Codex must not do)

- **Do not redesign the ontology system.** It is correct and audit-locked.
- **Do not switch databases.** Postgres + pgvector stays. Firestore for user metadata stays.
- **Do not swap auth providers.** Firebase Auth stays.
- **Do not reintroduce FalkorDB or treat Neo4j as primary.** Postgres is v1 KG; Neo4j is optional secondary.
- **Do not add a chat sidebar to every page.** One Ask surface, one ⌘K palette, that is it.
- **Do not invent new ACO primitives or truth layers.** Eight primitives, four layers, locked.
- **Do not generate marketing copy unprompted.** Landing changes go through `01` §2 only.
- **Do not skip the audits.** Audits exist because the codebase has been silently broken before. Treat them as hard gates.
- **Do not call OpenAI or Anthropic SDKs directly.** Vertex routing only. `audit:ai-provider-isolation` enforces this.
- **Do not write secrets into the repo.** Use Secret Manager via `cloudbuild.yaml`.

---

## 11. Glossary (use these terms in code and copy)

- **Situation** — the active case the analyst is working on (e.g., "Syria 2026 transition", "US housing access in California").
- **Core** — a named, owner-scoped, versioned bundle of structured knowledge (User, Team, Situation, Source, Document, Graph, Output, plus the platform PRAXIS Core).
- **Ask PRAXIS** — the unified command plane where the analyst types a question or instruction.
- **Analyst Skill** — a deterministic or AI-backed capability that PRAXIS can run against the active cores (formerly "tool"). The marketplace is renamed accordingly.
- **Subagent** — a higher-level orchestrated agent that composes multiple skills (e.g., `red-team-analyst`, `memo-drafter`).
- **Frame** — the four-field situation framing (what is happening, why it matters, what would change the assessment, what is the policy question).
- **Candidate vs Canonical** — AI-extracted graph elements (candidate, capped at 0.6 confidence) vs human-reviewed graph elements (canonical).
- **Provenance** — the chain from a claim in an output back to a source, document, or canonical graph node.
- **Owner-scoped** — every row is keyed by `owner_uid`; team-shared rows additionally carry `team_id` and a sharing grant.
- **Advisory** — labelled "candidate / pending review", not yet promoted to canonical.
- **Calibration** — the four-layer context block (`<analyst-profile>`, `<situation>`, `<domain>`, `<skc>`) prepended to every calibrated-AI tool call.
- **Policy Product** — the org-facing offer (Track D, §6): a shareable, branded, structured deliverable surface.

If a term in code or copy contradicts this glossary, fix the code or the copy. The glossary is the source of truth.

---

## 12. Final word

The user-facing story of v7 is:

> *Open a Situation. Ask PRAXIS. Pick the cores you want. Get a grounded answer. Produce the output.*

If after this rewrite a new analyst still has to learn 30 surfaces, the rewrite has failed. If after this rewrite a senior analyst can do in two clicks what used to take eight, the rewrite has succeeded.

Hold the line on simplicity. Hold the line on provenance. Hold the line on audits. Everything else is negotiable.
