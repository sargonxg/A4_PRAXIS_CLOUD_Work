# PRAXIS — Architecture Bible

**File**: `PRAXIS_ARCHITECTURE.md` (canonical reference; supersedes any prior `ARCHITECTURE.md`)
**Owner**: Giulio Catanzariti (TACITUS)
**Status**: Authoritative as of 2026-05-06
**Audience**: Engineers (human and AI) building, reviewing, or evolving PRAXIS.
**Deployment target**: praxis.tacitus.me on Google Cloud, with **Gemini Enterprise Agent Platform** (formerly Vertex AI) as the AI runtime.

---

## 0. How to read this document

This is the canonical architecture reference. It is the single source of truth for **what PRAXIS is, how it is structured, what is inviolable, and how it evolves**. Anything that contradicts this document — a stale comment in a code file, an outdated section in a pack prompt, a half-remembered conversation — is wrong; this document is right.

### How Codex (or any AI engineer) uses this document

1. **Read it whole on entering the project.** Do not start writing code until §0 through §6 are in your head and §17 is on your screen.
2. **Treat §3 (Foundational Invariants) as binding.** Any change that would weaken an invariant requires an Architecture Decision Record at `docs/adr/<NNNN>-<slug>.md` and Giulio's signed sign-off. No exceptions.
3. **Use §17 (Decision Tree) when unsure where new code belongs.** The decision tree is exhaustive for v1; if you find a case it doesn't cover, that is itself a finding to surface in §22 (Update Protocol).
4. **Run the audit chain in §19 before every merge.** A green chain means the architecture invariants hold for that commit. A red chain means stop and fix.
5. **Update this document in the same PR as the code change it describes.** Architectural changes that ship without a doc update are defects.

### How this document changes

This document changes through one mechanism only: a PR that (a) edits the relevant section, (b) adds an ADR explaining the change, (c) updates any audit scripts that enforce the changed invariant, and (d) is signed by Giulio. Changes are versioned in §23 (Changelog).

---

## 1. The product in one paragraph

PRAXIS is a workbench for **policy, conflict, mediation, and diplomacy professionals** to build and reason about complex situations. A user signs in via magic link, opens or creates a **situation** (a case — a dispute, a negotiation, a policy file, a conflict arena), and works inside a **workbench** with chapters for sources, ontology, graph, tools, memos, and runs. Every fact about the situation lives as a typed node in a **knowledge graph** governed by one or more ontology lenses (Conflict, Mediation, Governance, Narrative, Human Rights, Economic, Humanitarian, Legal, or Security) which map domain-specific subtypes onto eight universal **ACO primitives** (Actor, Claim, Interest, Constraint, Leverage, Commitment, Event, Narrative). The user runs **tools** from a marketplace; tools read from a four-layer **context substrate** (User, Workspace, Situation, Conversation), invoke **subagents** when AI assistance is needed, and produce outputs that become tool-runs, graph augmentations (gated by a deterministic symbolic firewall), or memo blocks. **Memos** are the artifact the user takes out of PRAXIS into a meeting, a hearing, a publication. The whole product runs on Google Cloud, with **Gemini Enterprise Agent Platform** as the AI runtime, **Firestore** for owner-scoped metadata, **Postgres + pgvector** for the knowledge graph, and **Cloud Storage** for blobs.

---

## 2. The mental model in one diagram

```
                                    USER
                                      │
                                      ▼
                              ┌───────────────┐
                              │   WORKSPACE   │  ← personal in v1, team in v2
                              │ (org context) │
                              └───────┬───────┘
                                      │
                              has many │
                                      ▼
                              ┌───────────────┐
                              │   SITUATION   │  ← the selected situation 2024, Northwind, UN CTED…
                              │   (a case)    │
                              └───────┬───────┘
                                      │
                              ┌───────┴───────────────────────────────────┐
                              │                                           │
                       ┌──────▼──────┐                            ┌───────▼──────┐
                       │ KNOWLEDGE   │  ← typed by ontology       │  ARTIFACTS   │
                       │   GRAPH     │     under ACO substrate     │ runs, memos  │
                       └──────┬──────┘                            └──────────────┘
                              │
                ┌─────────────┼──────────────┐
                ▼             ▼              ▼
            actors        claims         events
            constraints   interests      narratives
            leverage      commitments
                              ▲
                              │
                       ┌──────┴──────┐
                       │   TOOLS     │  ← marketplace; consume context;
                       │ + SUBAGENTS │     produce output through symbolic firewall
                       └──────┬──────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │ GEMINI ENTERPRISE     │  ← Agent Engine + Sessions + Memory Bank
                  │  AGENT PLATFORM       │     models: Gemini 3.1 Pro / 3 Flash / Flash-Lite
                  │  (formerly Vertex AI) │              Claude Opus 4.7 (via Model Garden)
                  └───────────────────────┘
```

Two facts about this diagram are non-negotiable:

- The **eight ACO primitives** are the only types graph nodes can have. Ontologies are lenses that map subtypes onto them.
- The **four context layers** (User, Workspace, Situation, Conversation) are the only context. Tools read through `ContextProvider`; nothing else.

---

## 3. Foundational invariants

These rules govern every part of PRAXIS. Violating any of them is a defect, even if the test suite passes.

### 3.1 The eight ACO primitives are the substrate

PRAXIS v5 keeps the eight ACO primitives stable and adds a second ontology
category for work mandates. Domain ontologies stay under
`backend/data/ontologies/specializations/`; work ontologies live under
`backend/data/ontologies/work/` and currently cover Foreign Policy Research,
Domestic Policy Analysis, and Corporate Strategic Analysis. A Context can stack
domain lenses with one active work ontology so the app can distinguish the
subject matter from the analyst's job-to-be-done.

```sql
primitive TEXT NOT NULL CHECK (primitive IN
  ('Actor', 'Claim', 'Interest', 'Constraint', 'Leverage',
   'Commitment', 'Event', 'Narrative'))
```

Every node in `graph_nodes` has exactly one primitive. Adding a ninth requires an ADR + a database migration + a code-wide refactor. It will not happen casually.

### 3.2 The four context layers are the only context

`UserContext`, `WorkspaceContext`, `CaseContext`, `ConversationContext`. Defined once in `src/types/context.ts` and `backend/types/context.py` at byte parity. Read exclusively through `ContextProvider`. A tool handler that reads Firestore directly is a contract violation, statically caught by `audit:tool-context-isolation`.

### 3.3 Owner scoping is absolute

Every Firestore read carries `ownerUid`. Every Postgres query carries `owner_uid` and (where applicable) `case_id`. There is no `findAll()`-shaped API. Three independent enforcement points (TypeScript/mypy require them as parameters, Firestore rules check at the database, Postgres CHECK constraints validate). Getting it wrong in code can't leak data.

### 3.4 The symbolic firewall has two tiers

This invariant was recalibrated in this revision; see §6 for the full specification.

- **Hard tier (deterministic).** The structural core — episodes, actors, stakeholders, constraints, causal links, ontology-required relations, bi-temporal consistency — is enforced by deterministic validators. AI proposals that would violate it are rejected, not overridden.
- **Soft tier (advisory).** Confidence below threshold, missing optional relations, communication-style mismatches — these surface as advisories on the response, not as errors. The user is informed, not blocked.

### 3.5 Two-phase commit is atomic

Every write that touches both Firestore (metadata) and Postgres (graph) goes through `in_transaction`: Firestore staged with `status='pending'` → Postgres write → Firestore marked `'committed'`. The reconciler runs every 6 hours via Cloud Scheduler; the design is correct without it, the reconciler is the safety net.

### 3.6 Bi-temporal validity is mandatory

Every node and edge carries `valid_from`, `valid_to`, `asserted_from`, `asserted_to`. Defaults: `asserted_from = now()` at insert; `valid_from` defaults to document publication date when extracted, otherwise null with explicit caller acknowledgment. The graph viewer's timeline mode and the `time_bounded_slice` traversal both depend on these.

### 3.7 Model strings live in two files only

`src/lib/ai/providers.ts` and `backend/ai/providers.py`. Models are declared in `src/lib/ai/MODEL_MATRIX.json`. Any other file that hard-codes a model name is a contract violation, statically caught by `audit:ai-provider-isolation`.

### 3.8 Every AI route is wrapped

`withCalibration` records tokens, cost, latency, model. `withContextAware` computes the snapshot and attaches advisories. No AI route bypasses either.

### 3.9 Every tool has a SKILL.md

`skills/tools/<tool_id>/SKILL.md` with the nine canonical sections (Purpose, When to use, When NOT to use, Inputs, Outputs, Context requirements, Composition, Examples, Pitfalls). PRs that add a tool without one fail CI.

### 3.10 Every subagent invocation is logged, costed, traced

Cost ceiling enforced at the runtime. Per-call latency budget. Cloud Trace span propagated. Diagnostics dashboard panel updates within 60 seconds.

### 3.11 Persona suites are the production bar

Diplomat-the selected situation, Mediator-Northwind, Analyst-Sahel, Researcher-the selected situation. Ten consecutive green CI runs before any merge to `main`.

### 3.12 Terraform is the only sanctioned infrastructure

No hand-clicking in Cloud Console. Drift detection runs in CI and fails the gate on any human-clicked resource.

### 3.13 Canary deploys are mandatory

Every production push goes 5% → 25% → 100% over 48 hours. Auto-rollback on error-rate spike or latency anomaly.

---

## 4. The seven layers (outside-in)

```
┌───────────────────────────────────────────────────────────────┐
│  L7  PRESENTATION    Next.js workbench (browser)              │
├───────────────────────────────────────────────────────────────┤
│  L6  EDGE            Cloud Run + LB + Cloud Armor + Cloud CDN │
├───────────────────────────────────────────────────────────────┤
│  L5  API             FastAPI + middleware stack               │
├───────────────────────────────────────────────────────────────┤
│  L4  CONTEXT + TOOLS ContextProvider + Tool Contract v2       │
├───────────────────────────────────────────────────────────────┤
│  L3  AGENTS          4 LangGraph subagents on Agent Engine    │
├───────────────────────────────────────────────────────────────┤
│  L2  DATA            Firestore + Postgres+pgvector + Storage  │
├───────────────────────────────────────────────────────────────┤
│  L1  PLATFORM        GCP project + IAM + Terraform + secrets  │
└───────────────────────────────────────────────────────────────┘
```

Layer responsibilities don't cross. L4 doesn't touch L2 directly — it goes through L3 (subagents) or repository methods that live at L2's edge. L7 doesn't touch L5 directly — it goes through Next.js server components or the typed API client. The discipline of these boundaries is what lets the architecture compose.

---

## 5. The user model: User → Workspace → Situation → Artifacts

PRAXIS has a deliberately simple user model:

| Concept | Definition | Cardinality (v1) | Persistence |
|---|---|---|---|
| **User** | An authenticated identity | one per real person | Identity Platform + `users/{uid}/profile/` |
| **Workspace** | Org-level context, methodology guides, glossary | one per user | `workspaces/{wsId}/` |
| **Situation** | A case (dispute, negotiation, policy file, conflict arena) | many per workspace | `users/{uid}/situations/{caseId}/` + Postgres rows |
| **Artifact** | A tool run or a memo | many per situation | `…/runs/{runId}/` + `…/memos/{memoId}/` |

In v2 the workspace model becomes multi-tenant (org + team + user). The schema already carries `workspaceId` so the migration is data-only.

The user's path through PRAXIS:

```
landing (/)                       ← public, value prop in 15s
  ↓
demo (/demo/user-case-2024)           ← public, read-only, watermarked
  ↓
waitlist or magic-link (/login)
  ↓
welcome (60-second wow)           ← Welcome → sample case → first memo → DOCX
  ↓
contexts (/app/contexts)          ← ContextCapsule library and source intake
  ↓
Ask · Memo Studio · Canvas · Tools ← reasoning, writing, graph view, advanced runs
  ↓
settings (/app/settings)          ← preferences + workspace guidelines
admin (/app/admin)                ← owner-only (diagnostics, users, ops, cost)
```

**Eight top-level routes, total.** Anything that *was* a top-level route in earlier sprawl (`/app/actors`, `/app/talking-points`, `/app/dossier`, `/app/desks`, etc.) is now either a workbench tab or a tool inside the marketplace. The canonical map is sealed.

---

## 6. The recalibrated symbolic firewall

This is the section to read carefully because the firewall is what makes PRAXIS structurally sound without being annoying.

### 6.1 The principle

A workbench for policy, conflict, and mediation professionals must enforce structural determinism on the **core entities of complex situations** — because if those drift, the user's reasoning is unreliable, the memos that come out are unreliable, and the whole product loses its credibility. But a workbench cannot be precious. A user mid-build, with three sources ingested and a case still taking shape, must not be told "you cannot run this tool because your context health score is 58." That is the failure mode of the original gate from pack 05 D2.

The recalibrated firewall has **three tiers**, each with a different enforcement strength.

### 6.2 The structural core (Hard tier — deterministic)

These are the entities and relations that define the **logical structure of any situation**. They must be deterministically valid, and AI proposals never override them.

**Episodes** — a situation is composed of episodes (a session, a meeting, a vote, an incident, a publication). Each episode is an `Event` node with mandatory `valid_from`. Episodes must be temporally consistent: `valid_to >= valid_from`. The graph viewer's timeline depends on this; analytical tools depend on this.

**Actors and stakeholders** — every situation has actors. Each `Actor` has at minimum: a `label`, a `subtype` (per the active ontology — `StateActor`, `Party`, `VetoPlayer`, `Outlet`, etc.), and at least one `valid_from`. Actors involved in any relation must exist as nodes — you cannot have a `Claim` made by a phantom Actor.

**Constraints** — legal mandates, treaty obligations, organizational rules, structural limits. Each `Constraint` has at minimum: a `subtype`, a `label`, and a `source` provenance entry pointing to the document or authority that establishes it.

**Causal links** — edges typed `CAUSED_BY`, `ENABLED_BY`, `CONSTRAINED_BY`, `TRIGGERED`, `LED_TO`. These are the edges that carry the user's reasoning about *how* the situation evolves. They must connect two valid nodes whose temporal validity windows overlap or are causally ordered (`source.valid_to <= target.valid_from + epsilon` for `CAUSED_BY`).

**Reasoning relations** — edges typed `SUPPORTS`, `CONTRADICTS`, `RELIES_ON`, `INFERRED_FROM`. These connect Claims to their evidentiary basis (which is a Source, a Document, or another Claim). Every Claim at the `Verdict` truth layer must have at least one inbound `SUPPORTS` or `INFERRED_FROM` edge — a Verdict without evidence is rejected.

**Ontology-required relations** — each ontology declares which relations are mandatory for each subtype (e.g., `mediation.Position` requires an inbound `HELD_BY` edge from an `Actor.Party`; `governance.Vote` requires inbound `CAST_BY` from an `Actor.VetoPlayer` and a target `Decision`). These declarations live at `src/lib/ontology/<id>/relations.ts` and are enforced by the firewall.

**Owner scoping and bi-temporal completeness** — covered by §3.3 and §3.6.

When the firewall encounters a write that violates the hard tier, it **rejects** with a typed error. The tool that submitted the write either resolves the gap (by asking the user to disambiguate, or by routing to the review queue) or returns an error. AI subagents never override the hard tier; their proposals go through it like any other proposal.

### 6.3 The advisory layer (Soft tier — informative, never blocking)

These are conditions that should inform the user but never stop them.

- **Confidence below threshold.** A Claim with confidence below 0.4 surfaces as a yellow indicator on the graph and a warning on tool-run inputs. The user can still run analysis on it.
- **Missing optional relations.** An Actor without a stated Interest is fine; it surfaces as a hint ("you might want to add an Interest for this Actor") but isn't required.
- **Communication-style mismatches.** If a memo template's auto-population produces blocks that clash with the user's communication-style preference, the Output Refiner subagent suggests alternatives — but the user makes the call.
- **Low Context Health Score (the artifact formerly known as the gate).** A 0-100 composite score is computed at every request through `withContextAware`. It is attached to the response as `contextSnapshot.composite.health` along with a list of `advisories`. **It is never thrown.** The user always gets to run the tool. The tool may return a no-signal result; that's acceptable; the user iterates.

### 6.4 The synthesized layer (AI proposals, always labeled)

When subagents (Context Preparer, Source Augmenter, Output Refiner, Memo Drafter) produce structured assertions, those assertions are **always**:

- Labeled `synthesized: true` in their metadata.
- Capped at the `Claim` truth layer (never `Verdict`).
- Capped at confidence ≤ 0.6.
- Tagged with `provenance` pointing to the subagent run that produced them.

If a synthesized assertion would change something in the structural core — adding a new Actor, asserting a causal link, declaring a Constraint — it goes to the **review queue** at `users/{uid}/situations/{caseId}/review-queue/`. The user reviews and accepts (which promotes it through the firewall the same way any user-asserted Claim would be promoted) or rejects.

### 6.5 What the firewall is for

A useful test: when in doubt, ask "would a senior policy analyst in a UN delegation, reading this graph cold, find the structural claims trustworthy?" The hard tier exists because the answer must be yes. The soft tier exists because the answer should not be "the system refused to run."

### 6.6 Implementation

Hard-tier validators live at:

- `src/lib/ontology/<id>/validators.ts` — per-ontology relation requirements.
- `src/lib/firewall/structural.ts` — cross-ontology rules (bi-temporal, owner, ACO primitive).
- `backend/ontology/<id>/validators.py` and `backend/firewall/structural.py` — Python parity.

Soft-tier advisories live at:

- `backend/middleware/with_context_aware.py` — composite health + advisory list.
- `src/lib/context/advisories.ts` — UI rendering.

Synthesized labeling lives at:

- `backend/agents/<id>/output_schema.py` — every subagent's output schema enforces the `synthesized` flag.
- `backend/firewall/synthesis_gate.py` — refuses to write Verdict-layer assertions with `synthesized: true`.

### 6.7 What is NOT the firewall's job

- Spelling, grammar, prose quality. (That is the Output Refiner's job, which the firewall does not gate.)
- Subjective judgments about whether a Claim is "true." (The graph stores claims with provenance and confidence; the user judges.)
- Style adherence to a methodology. (The Memo Drafter consults workspace guidelines via retrieval; the firewall doesn't read style guides.)
- User-experience concerns. (The advisory layer informs; the UI decides how loud.)

---

## 7. Frontend (L7) — Next.js workbench

### 7.1 Route structure

```
src/app/
  (landing)/page.tsx                 ← public landing
  demo/user-case-2024/page.tsx           ← public demo
  waitlist/page.tsx
  login/page.tsx + callback/         ← magic link via Identity Platform
  legal/{privacy,terms,security,data-retention}/
  app/                               ← authenticated; layout enforces auth
    layout.tsx                       ← wraps with all four context providers
    workbench/
      page.tsx                       ← situation picker
      [caseId]/
        page.tsx                     ← case shell with chapter flow
        ontology/page.tsx
        graph/page.tsx
        tools/page.tsx
        tools/[toolId]/page.tsx      ← schema-driven form, sync or SSE-streaming
        memos/[memoId]/page.tsx      ← Lexical block editor
        runs/[runId]/page.tsx
    settings/{preferences,workspace}/
    admin/page.tsx                   ← single route, tabs for diagnostics/users/ops/cost
```

### 7.2 State management

PRAXIS does not use Redux, Zustand, or any global state library. Every layer of state has a clear home:

- **Server state**: TanStack Query (React Query) for all API data. Cache-first, invalidation-driven.
- **Four context layers**: each has a React Context Provider at the workbench root (`UserContextProvider`, `WorkspaceContextProvider`, `CaseContextProvider`, `ConversationContextProvider`). Each fetches from its API endpoint with TanStack Query.
- **Conversation context**: client-side only. Tracks active tab, focused node, focused tool, focused memo block, last 10 actions. Serialized into a signed `X-Praxis-Conversation` header and shipped with every API call.
- **Form state**: React Hook Form for tool inputs and settings forms.
- **Editor state**: Lexical's internal editor state for memos.
- **Graph state**: Cytoscape's internal state for the graph canvas. The adjacent graph-intelligence panels are derived from the case module, timeline adapter, map adapter, actor frame, and Cognee candidate posture; they explain the situation but do not mutate canonical graph facts.

### 7.3 Server vs client components

- **Server components** for read-mostly views: graph viewer first paint, memo preview, runs list, situation picker.
- **Client components** for interactive surfaces: Cytoscape canvas, Lexical editor, tool forms, modals.
- **No `dangerouslySetInnerHTML`.** Memo blocks and tool outputs are React components; HTML strings are never stored.

### 7.4 Streaming

Long-running tool runs use Server-Sent Events. The UI shows a "preparing context…" state when the Context Preparer subagent runs first, then streams subsequent updates. Cancellation kills the subagent run within 1 second.

---

## 8. Edge (L6) — Cloud Run, load balancer, Cloud Armor

```
                       ┌─────────────────────────────┐
   praxis.tacitus.me ──┤  HTTPS Load Balancer        │
                       │  + Cloud Armor (WAF)        │
                       │  + Cloud CDN (static)       │
                       └───┬─────────────────────┬───┘
                           │                     │
              ┌────────────┴───┐    ┌────────────┴───┐
              │ Cloud Run:     │    │ Cloud Run:     │
              │ frontend       │    │ backend        │
              │ (Next.js)      │    │ (FastAPI)      │
              │ canary 5/25/100│    │ canary 5/25/100│
              └────────────────┘    └────────────────┘
```

- **Frontend Cloud Run service**: Next.js. Min instances=1 (no cold starts on landing), max=20, concurrency=80, request timeout 300s.
- **Backend Cloud Run service**: FastAPI. Min=1, max=20, concurrency=40 (more I/O per request), timeout 300s.
- **Cloud Armor** in front of both: OWASP Top 10, 100 req/min per IP, geo-restriction tunable, bot detection.
- **Cloud CDN** for static assets only. `/api/*` and `/app/*` bypass.
- **Canary revisions**: every deploy creates a new revision; traffic splits 5% → 25% → 100% over 48 hours; auto-rollback on error-rate or latency anomaly.

The demo runs on a separate Cloud Run revision behind `/demo/*` paths so its CSP and identity context are completely isolated from the rest of the app.

---

## 9. API (L5) — FastAPI middleware stack

Every backend request flows through this stack in this order:

```
Request
  ↓
[1]  Cloud Trace propagation        extract `traceparent`, start span
[2]  Structured logging             inject traceId/spanId/requestId
[3]  Identity verification          decode Identity Platform JWT, set ownerUid
[4]  Rate limit + budget enforcer   per-user soft + hard caps; 402 if hit
[5]  Conversation context decode    validate signed X-Praxis-Conversation
[6]  withCalibration                AI route wrapper, tracks tokens/cost/latency
[7]  withContextAware               computes ContextSnapshot, attaches advisories
[8]  Route handler                  uses ContextProvider, never raw stores
[9]  Symbolic firewall (on writes)  hard-tier validators, soft advisories
[10] Two-phase commit (on writes)   Firestore staged → Postgres → Firestore committed
  ↓
Response
```

Layers 1-2 make every request observable end-to-end. Layer 3 is the only place identity is checked. Layer 4 is the cost gate. Layer 5 is how the backend knows what the user is looking at without storing it server-side. Layers 6-7 are pack-12 contract surfaces. Layer 8 is business logic that never touches a database directly. Layers 9-10 are the integrity layer.

---

## 10. Context (L4 part 1) — the four-layer substrate

### 10.1 The types

```ts
// src/types/context.ts (canonical; backend/types/context.py at byte parity)

export interface UserContext {
  uid: string;
  workspaceId: WorkspaceId;
  identity: {
    displayName: string;
    role?: 'diplomat' | 'mediator' | 'analyst' | 'researcher' | 'policy_advisor' | 'other';
    organization?: string;
    title?: string;
    expertise?: string[];
  };
  mandate?: {
    primaryFocus?: string;
    typicalOutputs?: MemoTemplateId[];
  };
  preferences: {
    preferredOntologies?: OntologyId[];
    defaultMemoTemplate?: MemoTemplateId;
    suggestedTools?: ToolId[];
    communicationStyle?: 'concise' | 'thorough' | 'narrative';
    confidenceTolerance?: 'low' | 'medium' | 'high';
  };
}

export interface WorkspaceContext {
  workspaceId: WorkspaceId;
  ownerUid: string;
  label: string;
  guidelines: WorkspaceGuideline[];   // methodology docs, style guides
  glossary?: GlossaryEntry[];
}

export interface CaseContext {
  caseId: string;
  ownerUid: string;
  ontologyId: OntologyId;
  ontologyIds?: OntologyId[];
  primaryOntologyId?: OntologyId;
  frame: CaseFrame;
  sourceCount: number;
  documentCount: number;
  graphNodeCount: number;
  graphEdgeCount: number;
  contextHealth: ContextHealthScore;   // 0-100, 6 dimensions; ADVISORY ONLY
}

export interface ConversationContext {
  sessionId: string;
  startedAt: string;
  workbenchTab?: WorkbenchTab;
  focusedNodeId?: string;
  focusedToolId?: ToolId;
  focusedMemoBlockId?: string;
  recentActions: ConversationAction[];
}

export interface ContextSnapshot {
  user: UserContext;
  workspace: WorkspaceContext;
  case: CaseContext;
  conversation: ConversationContext | null;
  composite: {
    health: number;
    weakestLayer: 'user' | 'workspace' | 'case' | 'conversation';
    advisories: ContextAdvisory[];
  };
}
```

### 10.2 The provider

`ContextProvider` is the only sanctioned way to read context inside a tool handler or subagent. It is per-request, owner-scope-bound automatically, and exposes:

```ts
interface ContextProvider {
  user(): Promise<UserContext>;
  workspace(): Promise<WorkspaceContext>;
  case(): Promise<CaseContext>;
  graph(scope?: GraphScope): Promise<CaseGraph>;
  conversation(): Promise<ConversationContext | null>;
  snapshot(): Promise<ContextSnapshot>;

  retrieveWorkspace(query: string, topK?: number): Promise<WorkspaceRetrievalResult[]>;
  searchGraph(query: string, opts?: GraphSearchOpts): Promise<GraphSearchResult[]>;
  prepare(spec: ContextSpec): Promise<PreparedContext>;
  subagent<I, O>(id: SubagentId, input: I): Promise<SubagentRunResult<O>>;

  log(event: ToolLogEvent): Promise<void>;
  cost(): Promise<{ accumulatedUsd: number }>;
}
```

A direct Firestore, Postgres, or workspace-store call from a tool handler is a contract violation. Statically caught.

### 10.3 Persistence

| Layer | Where | Notes |
|---|---|---|
| User | `users/{uid}/profile/{identity,mandate,preferences}` | Firestore, owner-scoped rules |
| Workspace | `workspaces/{wsId}/guidelines/{guidelineId}` + `gs://praxis-workspaces/{wsId}/{guidelineId}/{filename}` | Firestore metadata + Cloud Storage blobs; chunks in Postgres `workspace_chunks` |
| Case | `users/{uid}/situations/{caseId}/` (Firestore metadata) + Postgres `graph_nodes` / `graph_edges` (typed graph) | Two-phase commit |
| Conversation | In-memory client + signed JWT in `X-Praxis-Conversation` header | Never persisted server-side |

---

## 11. Tools (L4 part 2) — the marketplace

### 11.1 Tool Contract v2

Every tool declares its full surface as static fields:

```ts
{
  // identity
  id: 'mediation.zopa-finder',
  version: '1.2.0',
  title: 'ZOPA Finder',
  description: 'Identifies the zone of possible agreement...',
  category: 'analysis',
  ontologyRequirements: ['mediation'],

  // schemas
  inputSchema: { /* JSON Schema */ },
  outputSchema: { /* JSON Schema */ },

  // runtime
  estimatedRuntimeMs: 6000,
  costClass: 'medium',
  streaming: false,

  // ownership
  ownerEmail: 'tools@tacitus.me',

  // context
  contextSpec: {
    user: { role: true, preferences: true },
    workspace: { guidelines: true },
    caseGraph: {
      minNodeCount: 5,
      requiredPrimitives: ['Actor', 'Claim'],
      requiredOntology: 'mediation',
    },
    minHealthScore: 50,                     // ADVISORY, never blocking
    graceful: true,
  },

  // composition
  composition: {
    canChainInto: ['mediation.mediation-brief'],
    canChainFrom: ['mediation.position-vs-interest'],
    contextProjection: 'projections/zopa-finder.ts',
  },

  // side effects
  sideEffects: {
    proposesGraphChanges: false,
    writesMemoBlocks: false,
    writesAuditLogs: true,
  },

  // AI dependencies
  subagentDeps: ['output_refiner'],

  // documentation
  skill: { file: 'skills/tools/mediation.zopa-finder/SKILL.md' },

  // implementation
  handler: async (input, ctx) => { /* ... */ },
}
```

### 11.2 The marketplace UI

At `/app/tools` the user sees:

- **Suggestion banner**: top 3 tools ranked by the suggestion engine, each with a one-sentence rationale ("Recommended because your case is mediation-ontology and you're a mediator").
- **Analyst's Toolkit strip**: key assumptions, red-team review, premortem, and other review methods grouped as gated tools.
- **Card grid**: all 52 curated marketplace tools with `ToolFitBadge` (Ready / Needs more sources / Not for this ontology — colored, advisory).
- **Filters**: by category, ontology, cost class, recent runs.
- **Per-tool page** at `tools/[toolId]`: schema-driven form (via @rjsf/core), composition links, "About this tool" panel rendering the SKILL.md.

### 11.3 The 52 v1.2 marketplace tools

| Ontology | Tools |
|---|---|
| Conflict | leverage-trace, commitment-check, escalation-timeline, escalation-ladder, cease-fire-monitor, actor-alignment-shift |
| Mediation | position-vs-interest, zopa-finder, mediation-brief |
| Governance | veto-probability, mandate-traceback, coalition-map |
| Narrative | frame-cascade, counter-narrative-finder, fact-check-traceback |
| Human Rights | violation-tracker, upr-cycle-mapper, treaty-body-engagement, pattern-detector |
| Economic / Sanctions | designation-tracer, beneficial-ownership-map, sanctions-impact-model, evasion-pattern-detector |
| Humanitarian | needs-aggregator, access-map, cluster-coordinator, aa-trigger-monitor |
| Legal / Treaty | provision-tracer, precedent-finder, reservation-effect-mapper, jurisdictional-analyzer |
| Security / Defense | posture-tracker, capability-assessor, escalation-modeler, alliance-cohesion-map |
| Cross-cutting | contradiction-finder, context-health-explainer, brief-exporter, scenario-projector, stakeholder-power-interest, causal-loop-diagram, indicators-tracker, timeline-comparator, assumption-mapper, outside-in-thinking, devils-advocate |
| Analyst's Toolkit SATs | ach, kac, red-team, premortem |
| Memo Studio | memo-create, memo-refresh |

Pack 21 deliberately preserves the 52-tool cap. The source prompt listed 36
candidate additions while also requiring "30 new / 52 total"; the shipped
foundation set honors the cap by registering the 20 Pack 20 ontology-forward
tools, 7 cross-cutting depth tools, and 3 conflict-depth tools. The deferred
six original-ontology depth candidates require a later cap decision.

Legacy ACH workbench routes have been retired from the default product surface. Structured analytic techniques remain available as review-gated tools behind Advanced and the agent runtime.

### 11.4 Adding a new tool

The contract is "one folder copy from the template." See §17 (Decision Tree) for the exact steps.

### 11.5 Composition

When tool A's output feeds tool B, A's `contextProjection[B.id]` is a pure function mapping A's output into a `Partial<ContextSnapshot>`. Static check at registration time: missing projection for declared chain = registration failure.

### 11.6 Tool runs as artifacts

Every tool execution produces a `ToolRun` record at `users/{uid}/situations/{caseId}/runs/{runId}` with full input, full output, cost, latency, model used, subagent invocations, and audit links. Re-runnable. Compositions persist `parentRunId` to form a tree.

---

## 12. Agents (L3) — Vertex AI Agent Engine

### 12.1 The seven subagents

| Subagent | Purpose | Default model | Cost ceiling | P95 latency |
|---|---|---|---|---|
| **Context Preparer** | Reads spec + substrate, fills gaps with synthesized assertions | gemini-3-flash (gemini-3.1-pro for high-stakes) | $0.05/call | 6s |
| **Source Augmenter** | Suggests authoritative public sources from a domain allowlist | gemini-3-flash | $0.10/call | 8s |
| **Output Refiner** | Adapts tool output to user's communication style; schema-validated, can't change facts | claude-opus-4.7@vertex | $0.03/call | 4s |
| **Memo Drafter** | Drafts memo blocks from prepared context with graph citations | claude-opus-4.7@vertex | $0.08/call | 6s |
| **Red Team Analyst** | Safe adversary-perspective modeling for Pack 15 SATs | gemini-3-flash | $0.06/call | 6s |
| **Tool Runtime Analyst** | Tasklet-style reasoning loop over ContextCapsule state and registered tools | gemini-3-flash (gemini-3.1-pro for high-stakes) | $0.06/call | 8s |
| **Approval Moderator** | Enforces risk gates, human approvals, and synthesis boundaries before high-risk actions | gemini-3-flash | $0.04/gate | 5s |

The old Pack 16 visible Agentic Boardroom/persona UI has been retired from the
default product surface. Multi-perspective review now belongs behind the
Tasklet-style agent runtime: agents reason over the tool registry, emit citable
events, and stop at approval gates rather than sending users to a separate
Boardroom page. Backend Boardroom/persona modules that are still imported by
Agent Engine schemas are historical compatibility code until the backend
migration is complete.

### 12.2 Why Vertex AI Agent Engine

PRAXIS subagents deploy to **Gemini Enterprise Agent Platform** (formerly Vertex AI), specifically to **Agent Engine** as `LanggraphAgent` resources. This is not a build-vs-buy decision; it is the right runtime for this workload because:

- **Native LangGraph deployment** via `vertexai.agent_engines.LanggraphAgent`.
- **Vertex AI Sessions** for conversation continuity, keyed deterministically as `sha256(uid + caseId + subagentId)`.
- **Memory Bank** scoped per-user — the Memo Drafter learns the user's preferred phrasing over time without us building a memory store.
- **Cloud Trace integration end-to-end** — a single trace shows the inbound request, the tool call, the subagent's LangGraph node sequence, and every model call inside.
- **Per-call cost ceilings** enforced at the runtime, not at the application layer.
- **Versioned deployments** with one-command rollback (`agent_engines.update(version=N-1)`).
- **200+ models via Model Garden** — Gemini family, Claude (Opus, Sonnet, Haiku) first-class, Llama, Mistral. Switching the Memo Drafter from claude-opus-4.7 to gemini-3.1-pro is a one-line change in `MODEL_MATRIX.json`.
- **Compliance** — SOC 2, ISO 27001, HIPAA-eligible, VPC Service Controls, CMEK.

### 12.3 The deployment shape

```python
# backend/agents/deploy.py
from vertexai import agent_engines
from backend.agents.context_preparer.graph import build_graph as build_preparer_graph
# ... etc.

def deploy_subagent(name, build_graph_fn, model_task_kind):
    agent = agent_engines.LanggraphAgent(
        graph_builder=build_graph_fn,
        model=resolve_model(model_task_kind),  # from MODEL_MATRIX.json
        sessions={"backend": "vertex"},
        memory_bank={"enabled": True, "scope": "per-user"},
        observability={"trace": "cloud_trace", "log": "cloud_logging"},
    )
    return agent_engines.create(
        agent=agent,
        display_name=f"praxis-{name}",
    )
```

### 12.4 Calling subagents

Tools call subagents through `ContextProvider.subagent()`:

```ts
const refined = await ctx.subagent('output_refiner', {
  raw_output: toolOutput,
  communication_style: (await ctx.user()).preferences.communicationStyle,
  output_schema: this.outputSchema,
});
```

Under the hood this is an HTTPS call to the Agent Engine endpoint, with `traceparent` propagated, cost tracked, retry + circuit-breaker on failure.

### 12.5 Constraints on subagents

- Never write to the graph. Outputs labeled `synthesized: true`, capped at Claim layer, capped at confidence ≤ 0.6.
- Schema-validated outputs. Non-conformant JSON triggers up to 2 retries with stricter system prompts; on third failure, return empty `PreparedContext` with `confidence = 0` and a `gaps[].kind = 'preparer_failure'` entry.
- Per-call cost ceiling. Latency budget. Telemetry surfaced in diagnostics dashboard.
- Eval set per subagent committed to `backend/agents/<id>/eval/cases.json` with a floor enforced in CI (`audit:subagent-eval-fresh`).

### 12.6 Adding a new subagent

Same template pattern as tools: copy `skills/templates/SUBAGENT_TEMPLATE/`, fill in the five files (`graph.py`, `state.py`, `prompts/system.md`, `output_schema.py`, `runner.py`), commit a SKILL.md and an eval set, deploy via `bash scripts/deploy-subagents-staging.sh`.

---

## 13. Data (L2) — Firestore + Postgres + Cloud Storage

### 13.1 The four-store model

```
┌────────────────────────────────────────────────────────────────────┐
│  Firestore                Postgres + pgvector       Cloud Storage  │
│  (metadata, ACL)          (knowledge graph)         (blobs)        │
│                                                                    │
│  • users/                 • graph_nodes             • uploads/     │
│  • workspaces/            • graph_edges             • exports/     │
│  • cases/ (metadata)      • graph_embeddings          (DOCX/PDF/MD)│
│  • runs/                    (pgvector 768-dim)      • snapshots/   │
│  • memos/                 • graph_audit               (demo case)  │
│  • audit/                 • workspace_chunks        • agent-       │
│  • review-queue/                                      artifacts/   │
└────────────────────────────────────────────────────────────────────┘
            ↑                          ↑                       ↑
            │     atomic via two-      │   referenced by URI   │
            └──── phase commit ────────┘                       │
                                                               │
            ┌──────────────────────────────────────────────────┘
            │
       In-memory (per request, never persisted)
       • ConversationContext (signed JWT in header)
```

### 13.2 Why this combination

**Firestore** is the right fit for owner-scoped metadata that benefits from real-time sync, hierarchical paths, and security-rules-based ACL. Every user-visible metadata document path starts with `users/{uid}/...` so security rules enforce ownership at the database — three independent enforcement points (TS/mypy, Firestore rules, application middleware) all check the same thing.

**Postgres + pgvector** is the right fit for the typed knowledge graph because:

- Native ACID transactions for the two-phase commit's local half.
- Recursive CTEs for graph traversal (n-hop neighborhood, shortest path, ego subgraph, time-bounded slice). All bounded, all under 100ms P95 on the 10k-node fixture.
- pgvector for semantic search with IVFFlat index — production-quality at the scales PRAXIS targets in v1.
- One database to operate, back up, monitor, secure.
- Cost order-of-magnitude lower than the original Neo4j Aura specification.

**Cloud Storage** holds blobs: ingested documents, generated memo exports (DOCX/PDF/MD), the demo case snapshot, Vertex AI Agent Engine deployment artifacts. Versioning on, lifecycle to glacier at 90 days, public access prevented at the bucket level.

**In-memory + signed JWT** for `ConversationContext`: ephemeral UI focus state has no business being persisted server-side; it carries one HMAC-signed payload per request via `X-Praxis-Conversation`.

### 13.3 Why Neo4j is retired in v1

Neo4j was specified in early packs as the graph engine. Pack 10 made Postgres primary and gated Neo4j behind `KG_BACKEND=postgres|neo4j|both`. **In v1 there is no Neo4j.** The flag remains in code as a v2 escape hatch — if a future graph-algorithmic query (community detection, Louvain, PageRank-on-graph) becomes product-critical and recursive CTEs can't serve it, Neo4j returns as an asynchronous secondary index alongside Postgres. Until that day, there is no Neo4j cluster, no Neo4j connection in production, no Neo4j-shaped operational surface.

### 13.4 The Postgres schema (essential excerpt)

```sql
CREATE EXTENSION IF NOT EXISTS pgvector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

CREATE TABLE graph_nodes (
    id            UUID PRIMARY KEY,
    case_id       UUID NOT NULL,
    owner_uid     TEXT NOT NULL,
    ontology_id   TEXT NOT NULL,
    ontology_version TEXT NOT NULL,
    primitive     TEXT NOT NULL CHECK (primitive IN
                    ('Actor','Claim','Interest','Constraint','Leverage',
                     'Commitment','Event','Narrative')),
    subtype       TEXT NOT NULL,
    label         TEXT NOT NULL,
    description   TEXT,
    layer         TEXT NOT NULL CHECK (layer IN
                    ('Source','Claim','Evidence','Verdict')),
    confidence    NUMERIC(4,3) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
    provenance    JSONB NOT NULL DEFAULT '[]'::jsonb,
    valid_from    TIMESTAMPTZ,
    valid_to      TIMESTAMPTZ,
    asserted_from TIMESTAMPTZ NOT NULL DEFAULT now(),
    asserted_to   TIMESTAMPTZ,
    metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
    status        TEXT NOT NULL DEFAULT 'committed'
                    CHECK (status IN ('pending','committed','merged','superseded','deleted')),
    synthesized   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by    TEXT NOT NULL,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_nodes_case_primitive  ON graph_nodes (case_id, primitive, subtype) WHERE status = 'committed';
CREATE INDEX idx_nodes_case_layer      ON graph_nodes (case_id, layer)              WHERE status = 'committed';
CREATE INDEX idx_nodes_temporal        ON graph_nodes (case_id, valid_from, valid_to);
CREATE INDEX idx_nodes_owner           ON graph_nodes (owner_uid, case_id);
CREATE INDEX idx_nodes_label_trgm      ON graph_nodes USING gin (label gin_trgm_ops);
CREATE INDEX idx_nodes_metadata_gin    ON graph_nodes USING gin (metadata jsonb_path_ops);

-- graph_edges, graph_embeddings, graph_audit, workspace_chunks: see backend/migrations/alembic/versions/
```

### 13.5 The two-phase commit protocol

```python
async with in_transaction(session) as tx:
    firestore_ref = await firestore_writer.stage(candidate)   # status='pending'
    await node_repo.create(tx, candidate.to_node_record())    # Postgres write
    await firestore_writer.commit(firestore_ref)              # status='committed'
```

Crash between any two steps? The reconciler runs every 6 hours via Cloud Scheduler:

- Finds Firestore docs with `status='pending'` older than 10 minutes.
- For each: checks Postgres for the matching record (idempotent on `proposalId = sha256(case_id + document_id + extracted_span + subtype + label)`).
- If Postgres has it: marks Firestore `committed`.
- If Postgres doesn't: rolls Firestore back.

Drift verifier runs nightly: cross-checks both stores, red-lights any divergence on the diagnostics dashboard.

---

## 14. Platform (L1) — GCP, Terraform, secrets, network

### 14.1 The Terraform layout

```
infrastructure/terraform/
├── envs/
│   ├── staging/      gs://praxis-terraform-state-staging
│   └── production/   gs://praxis-terraform-state-production
└── modules/
    ├── project-bootstrap     APIs, service accounts, IAM
    ├── networking            VPC, firewall, Cloud NAT
    ├── cloud-run             frontend + backend services
    ├── cloud-sql             Postgres 16 + pgvector, HA in production
    ├── firestore             native mode
    ├── cloud-storage         uploads/exports/snapshots/agent-artifacts
    ├── identity-platform     auth + magic links
    ├── secret-manager        API keys, signing secrets
    ├── cloud-tasks           ingestion, embeddings-recompute, async tools
    ├── cloud-scheduler       drift verifier 6h, daily aggs, weekly backups
    ├── cloud-build           CI/CD for frontend, backend, subagents
    ├── agent-engine          4 subagent deployments
    ├── vertex-vector-search  optional KG search index (default disabled in v1)
    ├── monitoring            dashboards, alerts, budgets, uptime
    ├── cloud-dns             praxis.tacitus.me + staging
    └── load-balancer         HTTPS LB, SSL cert, Cloud Armor
```

`bash scripts/terraform-apply.sh staging` provisions a clean staging environment in under 30 minutes. Hand-clicking in Cloud Console is forbidden.

### 14.2 Production extras

- **Customer-managed encryption keys (CMEK)** for Cloud SQL and Cloud Storage via Cloud KMS.
- **VPC Service Controls** around Vertex AI to prevent data exfiltration.
- **High availability** Cloud SQL across two zones with 30-day point-in-time recovery.
- **Least-privilege IAM** — every service account documented with the minimum roles it needs.
- **Cloud Armor** with OWASP Top 10 + 100 req/min rate-limit + tunable geo restrictions.
- **Budget alerts** at 50/80/100% thresholds wired to Sentry + email.

### 14.3 Secrets

All secrets live in Secret Manager. Cloud Run reads via the CSI driver at runtime. No secret ever appears in Terraform state, in Git, or in container images.

### 14.4 Observability

Cloud Trace propagation end-to-end. Cloud Logging structured JSON with `traceId/spanId/userId/caseId/requestId`. Cloud Monitoring dashboards (overview, cost, context-health, graph-ops, tools-marketplace, memo-studio, onboarding-funnel). Error Reporting alerts. Sentry release-tagging tied to git SHA. Uptime checks from 6 regions every 60s.

---

## 15. The AI provider stack

### 15.1 The Model Selection Matrix

`src/lib/ai/MODEL_MATRIX.json` is the canonical declaration of which model is used for which task kind:

```json
{
  "task_kinds": {
    "complex_reasoning":  { "provider": "vertex", "model": "gemini-3.1-pro",       "max_tokens": 8192,  "temperature": 0.2, "cost_class": "expensive" },
    "balanced":           { "provider": "vertex", "model": "gemini-3-flash",       "max_tokens": 4096,  "temperature": 0.3, "cost_class": "medium" },
    "cheap_classify":     { "provider": "vertex", "model": "gemini-2.5-flash-lite","max_tokens": 1024,  "temperature": 0.0, "cost_class": "cheap" },
    "long_context":       { "provider": "vertex", "model": "gemini-3.1-pro",       "max_tokens": 32768, "temperature": 0.2, "cost_class": "expensive_long" },
    "writing_quality":    { "provider": "vertex", "model": "claude-opus-4.7@vertex","max_tokens": 4096, "temperature": 0.4, "cost_class": "expensive" },
    "embeddings_text":    { "provider": "vertex", "model": "text-embedding-005",   "dimensions": 768,                       "cost_class": "cheap" },
    "embeddings_long":    { "provider": "vertex", "model": "gemini-embedding-001", "dimensions": 1536,                      "cost_class": "medium" }
  }
}
```

### 15.2 Why both Gemini and Claude

PRAXIS uses both model families, both via Gemini Enterprise Agent Platform. **Gemini** is the default for analytical reasoning — fast, cheap, native to the platform, well-instrumented. **Claude (Opus 4.7)** is used specifically for writing-quality tasks — the Output Refiner adapting prose to a user's communication style, the Memo Drafter producing stylistically appropriate memo blocks. Both run on Vertex Model Garden; no dual provider authentication, no separate billing, no separate observability. The development-only fallback `AI_PROVIDER=anthropic-direct` exists for offline development without GCP credentials and is never used in production.

### 15.3 Per-consumer mapping

| Consumer | Default task kind |
|---|---|
| Ontology classifier | `cheap_classify` |
| Context Preparer | `balanced` (escalates to `complex_reasoning` for high-stakes cases) |
| Source Augmenter | `balanced` |
| Output Refiner | `writing_quality` |
| Memo Drafter | `writing_quality` |
| Memo block "suggest content" | `writing_quality` |
| `cross.contradiction-finder` | `complex_reasoning` |
| `cross.scenario-projector` | `complex_reasoning` (`long_context` if input > 50k tokens) |
| `mediation.mediation-brief` (subagent path) | `writing_quality` |
| All embeddings | `embeddings_text` (default), `embeddings_long` for documents > 8k tokens |
| Tool suggestion ranker | (no LLM — pure data-structure work) |

### 15.4 Adding or changing a model

One-line edit in `MODEL_MATRIX.json`. The model-string lockdown audit (`audit:ai-provider-isolation`) ensures no consumer hard-codes the model name. ADR required if the change is structural (e.g., switching the Memo Drafter from Claude to Gemini), no ADR required if the change is a within-family upgrade (e.g., gemini-3.1-pro → gemini-3.2-pro when released).

---

## 16. End-to-end: a real request

User clicks "Run mediation brief" in the workbench tools tab. The browser fires `POST /v1/cases/<id>/tools/mediation.mediation-brief/run` with body `{caseId, options}`, the user's Identity Platform JWT in `Authorization`, and a signed `X-Praxis-Conversation` header.

```
T+0ms       Browser issues request.
T+5ms       Cloud Armor: rate-limit + WAF check. Pass.
T+10ms      Load balancer routes to backend Cloud Run revision (currently
            25% canary; this user lands on canary cohort by userId hash).
T+15ms      FastAPI middleware:
              [1] Cloud Trace extracts traceparent, starts root span.
              [2] Structured logger tags subsequent lines with traceId.
              [3] Identity middleware decodes JWT; sets request.ownerUid.
              [4] Budget enforcer: under monthly cap. Pass.
              [5] X-Praxis-Conversation header decoded + HMAC-verified.
T+25ms      withContextAware:
              Reads Firestore (user, workspace, case metadata).
              Reads Postgres (case graph summary stats).
              Computes ContextSnapshot.
              Composite health = 71. Two advisories ("Actor count thin").
T+360ms     Tool handler receives (input, ctx).
              Tool's contract: subagentDeps=[context_preparer, memo_drafter,
              output_refiner]. ContextSpec satisfied (composite health > 50).
T+360ms     ctx.retrieveWorkspace(query="mediation brief structure"):
              pgvector search returns 3 chunks from user's Harvard PON primer.
T+580ms     ctx.subagent('context_preparer', spec):
              HTTPS to Agent Engine endpoint. Trace span propagated.
              LangGraph subgraph runs: gather → summarize_per_layer
              (one gemini-3-flash call) → extract → identify_gaps → self_rate.
              Returns PreparedContext, confidence=0.78. Cost: $0.012.
T+1.98s     ctx.subagent('memo_drafter', input):
              HTTPS to Agent Engine. claude-opus-4.7@vertex generates blocks.
              Each block carries citations to actual graph node IDs.
              All blocks marked synthesized: true.
              Returns MemoBlocks. Cost: $0.038.
T+3.6s      ctx.subagent('output_refiner', input):
              HTTPS to Agent Engine. Schema-validated; numerical and
              categorical values preserved verbatim; prose adjusted to
              user's "thorough" communication style. Cost: $0.008.
T+4.0s      Symbolic firewall:
              Hard-tier validators check structural assertions in tool
              output. Tool doesn't propose graph changes — passes through.
              Synthesis-gate confirms blocks are Claim-layer with
              confidence ≤ 0.6. Pass.
T+4.05s     Two-phase commit writes ToolRun record:
              Firestore users/<uid>/situations/<caseId>/runs/<runId>
                staged with status='pending'.
              Postgres run-detail row inserted.
              Firestore marked 'committed'.
              Audit logged.
T+4.2s      Response: memo content, citations, total cost ($0.058),
              contextSnapshot.advisories=[Actor count thin, ...].
T+4.3s      Browser renders memo content, opens Runs tab with new entry,
              fires TanStack Query invalidation, emits RUM event.
```

One `traceId` linked all of it. One row in `audit/{date}/{runId}` shows the whole story. The cost dashboard updated in near-real-time.

---

## 17. Decision tree — where does new code go?

This is the section to bookmark. When in doubt, walk the tree.

### 17.1 New concept in the situation domain (e.g., "ceasefire violation," "BATNA")

**Map it to one of the 8 ACO primitives.** A ceasefire violation is an `Event`. A BATNA is an `Interest` (or maybe a `Constraint` depending on framing). A vote is an `Event`. A treaty obligation is a `Constraint`. A diplomatic warning is a `Claim`.

If you cannot map it to one of the eight, the architecture is telling you that the concept either (a) belongs to an ontology subtype rather than a new primitive, (b) is actually a *relation* between primitives, or (c) is genuinely outside scope. ADR required if you believe (c).

**Then decide which ontology(ies) need a new subtype** at `src/lib/ontology/<id>/subtypes.ts`. Add the relation declarations at `relations.ts` if it participates in mandatory relations. Update the validator at `validators.ts`. Update the extraction prompt at `extraction-prompts.ts`. Update Python parity at `backend/ontology/<id>/`. Bump the ontology version.

### 17.2 New piece of context (e.g., "user's preferred citation format")

**Map it to one of the 4 layers.**

- User-specific, persistent: User layer → `users/{uid}/profile/preferences/`.
- Org-wide, shared across cases: Workspace layer → `workspaces/{wsId}/`.
- Case-specific: Case layer → either `users/{uid}/situations/{caseId}/` (Firestore metadata) or as a node/edge in the graph (Postgres).
- Session-only: Conversation layer → in-memory + signed JWT.

If it doesn't fit cleanly into one layer, you are conflating two things. Split.

### 17.3 New analytical capability (e.g., "fact-check Russian-language sources")

**It's a tool.** Steps:

1. Copy `skills/templates/TOOL_TEMPLATE/`.
2. Fill in the SKILL.md with all nine sections.
3. Author the v2 contract at `src/lib/tools/registry/<ontology>.<id>.ts`. Declare `contextSpec`, `composition`, `subagentDeps`, `sideEffects`, `skill.file`.
4. Author the input/output JSON schemas.
5. Implement the handler with signature `(input, ctx) => Promise<output>`. Read context via `ctx`. Invoke subagents via `ctx.subagent()`.
6. Author the canary fixture test.
7. Author Python parity if the handler runs server-side.
8. Update the role-affinity table at `src/lib/tools/suggestion/role-affinity.ts` if the tool is recommended for any role.
9. Run `npm run audit:tool-contract-v2 && npm run audit:tool-skills-present && npm run audit:tool-context-isolation`.

The marketplace, suggestion engine, persona suites, and diagnostics dashboard pick the tool up automatically.

### 17.4 New AI capability that doesn't fit a tool's request/response shape (e.g., "translate memo blocks to French")

**It's a subagent.** Same template pattern:

1. Copy `skills/templates/SUBAGENT_TEMPLATE/`.
2. Fill in the SKILL.md.
3. Build the LangGraph subgraph at `backend/agents/<id>/graph.py`.
4. Define typed state at `state.py`.
5. Author the system prompt at `prompts/system.md`.
6. Define the output schema at `output_schema.py` (Pydantic; the runner validates).
7. Build the eval set at `eval/cases.json` with 12-16 (input, expected_output) tuples.
8. Add to `backend/agents/deploy.py` so it deploys to Agent Engine.
9. Update `MODEL_MATRIX.json` with its task kind if needed.
10. Run `bash scripts/deploy-subagents-staging.sh` and `python -m backend.agents.<id>.eval.run_eval --target=staging`.

The diagnostics dashboard's subagent panel picks it up automatically.

### 17.5 New surface in the UI (e.g., "a global search bar")

**It belongs inside an existing surface, not a new top-level route.** Prefer Ask PRAXIS, Contexts, Memo Studio, Canvas, Tools, or Settings. Update the sidebar only if the visible product contract changes. Run `npm run audit:routes`.

### 17.6 New data store (e.g., "a graph database for high-fanout queries")

**It isn't.** The four-store model (Firestore + Postgres + Cloud Storage + in-memory Conversation) covers everything by design. A new store requires an ADR explaining why the existing four can't.

The exception: optional secondary indexes (Vertex AI Vector Search behind a flag, Neo4j as a v2 graph-algorithm engine) are gated by an env flag, default off, primary store unchanged.

### 17.7 New external integration (e.g., "import documents from Google Drive")

**It's a tool that uses an MCP connector or a Cloud Function.** The same v2 contract applies. The handler authenticates via the user's existing OAuth (extending Identity Platform's federation), reads the documents, ingests via the existing pipeline. Document the MCP server in `infrastructure/terraform/modules/mcp-connectors/`.

### 17.8 New infrastructure resource (e.g., "BigQuery for analytics")

**It goes in Terraform.** Add or extend a module under `infrastructure/terraform/modules/`. Test on staging. PR for plan + PR for apply. No human-clicking.

---

## 18. Centralization, evolution, and discipline

A complex application becomes a brittle one not when any single decision is wrong, but when decisions accumulate without discipline. The practices below are how PRAXIS stays maintainable.

### 18.1 Single sources of truth

| What | Where | Consumed by |
|---|---|---|
| ACO primitives | `src/lib/graph/core-primitives.ts` | every node-aware module |
| Ontology subtypes & relations | `src/lib/ontology/<id>/` | extraction, firewall, graph viewer |
| Context type model | `src/types/context.ts` + `backend/types/context.py` | every consumer |
| Model selection | `src/lib/ai/MODEL_MATRIX.json` | every AI consumer |
| Tool contracts | `src/lib/tools/registry/` | marketplace, suggestion engine |
| Subagent definitions | `backend/agents/<id>/` | tool handlers via ContextProvider |
| Memo templates | `src/lib/memo/templates/<id>/` | memo studio |
| Canonical route map | `docs/architecture/ROUTE_MAP.md` | route audit |
| Persona definitions | `e2e/personas/<id>.spec.ts` | CI gate |
| Hard tier firewall rules | `src/lib/firewall/structural.ts` + `backend/firewall/structural.py` | every write path |
| Infrastructure | `infrastructure/terraform/` | every environment |
| Architecture (this file) | `PRAXIS_ARCHITECTURE.md` | every engineer |

If something looks like a duplicate, it is. Consolidate.

### 18.2 The four-phase pattern for every change

Adopted across every pack. Codex follows it; humans follow it.

1. **Read & report.** Before changing anything, audit the relevant area and produce a structured report at `docs/audits/<today>-<topic>.md`.
2. **Propose & confirm.** List the files affected, the risk level, the rollback path. Wait for sign-off.
3. **Execute.** Small, named commits. One concern per commit. One reviewable PR.
4. **Verify.** Run the audit chain. Run the persona suites. Document the diff.

### 18.3 Audit scripts as living guards

Every invariant in §3 has at least one audit script that enforces it. Audits run in CI. A red audit fails the merge gate. The list of audit scripts grows over time; it never shrinks (deleting an audit requires an ADR explaining why it is no longer needed).

### 18.4 Architecture Decision Records

Every architectural change is documented as an ADR at `docs/adr/<NNNN>-<slug>.md` in MADR format (status, context, decision, consequences, alternatives considered). ADR numbering is monotonic. ADRs are never edited after acceptance; they are superseded by later ADRs that reference them.

The current ADR set:

| # | Title | Pack |
|---|---|---|
| 0001 | ACO 8-primitive substrate | 06 |
| 0002 | Ontology-as-lens pattern | 06 |
| 0003 | Cytoscape over Sigma and react-force-graph | 07 |
| 0004 | Two-phase Firestore + Postgres commit | 06/10 |
| 0005 | JSON-Schema-driven tool inputs | 08 |
| 0006 | Workbench shell pattern | 03 |
| 0007 | Truth-layer model | 05 |
| 0008 | Symbolic firewall placement | 05 |
| 0009 | Postgres-first knowledge graph (Neo4j retired in v1) | 10 |
| 0010 | Memo Studio data model | 11 |
| 0011 | Lexical editor choice | 11 |
| 0012 | Context-aware replaces health gate | 12 |
| 0013 | Four-layer context model | 12 |
| 0014 | Context Preparer subagent | 12 |
| 0015 | Tool Contract v2 | 13 |
| 0016 | ContextProvider runtime | 13 |
| 0017 | Skills as first-class | 13 |
| 0018 | Subagent pattern | 13 |
| 0019 | Vertex AI Agent Engine for subagent runtime | 14 |
| 0020 | Symbolic firewall recalibration (hard/soft/synthesized tiers) | this revision |
| 0021 | SATs as first-class Analyst's Toolkit surfaces | 15 |
| 0022 | Red Team Analyst subagent | 15 |
| 0023 | ACH workbench surface | 15 |
| 0030 | Dynamic ontology lenses | 20 |
| 0033 | Marketplace depth strategy | 21 |
| 0034 | Composition chain governance | 21 |
| 0035 | Marketplace cap and deferred candidate governance | 21 |
| 0036 | GCP production verification discipline | 22 |

### 18.5 Persona suites as the production bar

Diplomat-the selected situation, Mediator-Northwind, Analyst-Sahel, Researcher-the selected situation. Each is a Playwright spec running a full user journey end-to-end against a deployed environment. They run on every commit. They must be green for ten consecutive runs before merge to `main`. They catch what unit tests can't: the moment a refactor breaks the flow a real user takes.

### 18.6 Cost discipline

Every AI call is tracked: tokens, model, cost, latency, user, case, tool, subagent. The cost dashboard at `/app/admin/diagnostics?tab=cost` aggregates daily. Per-user soft + hard budget caps in Identity Platform custom claims. Budget alerts at 50/80/100% wired to Sentry + email. Cost projections per user-tier (10/100/1k/10k DAU) maintained at `docs/architecture/COST_PROJECTIONS.md`.

### 18.7 Documentation as code

Every architectural document carries a `Last reviewed: YYYY-MM-DD` line. Markdownlint + Vale + Lychee run in CI. Stale docs are defects.

---

## 19. The audit chain

`npm run audit:gate` runs the full chain in order. A green chain means the architecture invariants hold for that commit.

```
# Foundations
npm run typecheck
npm run lint
npm run test
pytest backend/ -q
mypy backend/ --strict

# Architecture invariants
npm run audit:routes                      # canonical route map
npm run audit:ontology-mapping            # every subtype maps to a primitive
npm run audit:ontology-versions           # version monotonicity
npm run audit:ontology-classifier-accuracy
npm run audit:context-types-parity        # TS/Pydantic byte parity
npm run audit:context-aware-coverage      # no withContextHealthGate references
npm run audit:tool-contract-v2            # every tool conforms
npm run audit:tool-skills-present
npm run audit:tool-skill-conforms
npm run audit:tool-canary-executable      # every marketplace tool can produce a foundation run
npm run audit:tool-semantic-canaries      # every tool carries semantic assertions
npm run audit:tool-persona-coverage       # every tool maps to a professional persona
npm run audit:tool-authoring-spike        # 60-minute authoring target recorded
npm run audit:tool-context-isolation      # no direct store access from handlers
npm run audit:tool-composition-static
npm run audit:tool-suggestion-eval        # recall@3 ≥ 80%
npm run audit:ai-provider-isolation       # no model-string leaks
npm run audit:ai-provider-vertex-default
npm run audit:model-matrix-coverage       # Pack 22 model/runtime coverage
npm run audit:subagent-deployment-fresh
npm run audit:subagent-eval-fresh         # eval ran in last 7 days
npm run audit:firewall-coverage           # every write path goes through firewall
npm run audit:bi-temporal-coverage
npm run audit:owner-scoping
npm run audit:postgres-schema-current
npm run audit:kg-drift                    # Firestore↔Postgres drift dry-run
npm run audit:graph-query-perf            # P95 budgets on 10k-node fixture
npm run audit:embeddings-v2-coverage
npm run audit:terraform-drift             # no hand-clicked resources
npm run audit:gcp-production-posture      # read-only named-resource posture
npm run audit:observability-coverage      # 100% trace on critical paths
npm run audit:legal-pages-present
npm run audit:ux-polish
npm run audit:dead-code
npm run audit:type-safety
npm run audit:test-coverage
npm run audit:docs                        # markdownlint + vale + lychee
npm run audit:runbook-bundle              # operational runbooks present
npm run audit:pack22-verification         # GCP/Gemini evidence package
npm run audit:security                    # npm audit, pip-audit, gitleaks

# Tasklet app smoke — production bar
npm run smoke:tasklet-app

# Performance budgets
npm run lh:ci
npm run audit:bundle-budgets
npm run audit:tool-perf-budgets
```

All exit 0. Persona suites green for ten consecutive runs. PR is mergeable.

---

## 20. The Codex collaboration protocol

This section is read by AI engineers (Codex CLI, Claude Code, future agents). The four-phase pattern is non-negotiable.

### 20.1 On entering the project

Codex reads, in order:

1. This document (`PRAXIS_ARCHITECTURE.md`) — whole, top to bottom.
2. The ten top-level docs: README, AGENTS, CLAUDE, DESIGN, DEPLOYMENT, SECURITY, TESTING, TODO, CHANGELOG, CONTRIBUTING.
3. The Master Charter at `PRAXIS_CODEX_00_MASTER_CHARTER.md`.
4. The conventions skill at `/mnt/skills/user/praxis-conventions/SKILL.md`.
5. The most recent Comprehensive Audit at `docs/audits/<latest>-COMPREHENSIVE.md`.
6. The active blockers section in the Master Charter.

### 20.2 The four-phase pattern (always)

For every change, however small:

- **Phase 1 — Read & report.** Audit the relevant area. Produce a structured status report.
- **Phase 2 — Propose & confirm.** List affected files, risk level, rollback path. Wait for sign-off from Giulio.
- **Phase 3 — Execute.** Small, named commits. One concern per commit.
- **Phase 4 — Verify.** Run the audit chain. Run persona suites. Document the diff.

### 20.3 The five collaboration patterns

Documented at `docs/contributing/CODEX_ORCHESTRATION.md`:

1. **Subagents pattern** — orchestrator spawns specialized children. For 3-5 tasks of similar shape, single repo.
2. **Agent Teams pattern** — multiple agents share a task list, peer-message, file-lock for parallel writes. For 5-15 vertical slices.
3. **Ralph Loop pattern** — hard context reset each iteration; memory through git history. For long iterative tasks where context contamination is the failure mode.
4. **Critic-loop pattern** — every PR reviewed by a senior-engineer-critic subagent before human review. Catches contract violations.
5. **Demo-driven development** — write the persona test first; agent builds until it passes.

Plus the worktree workflow (`git worktree add ../praxis-NN feature/branch`) and typed-schema boundaries (Pydantic / Zod validated at every agent-to-agent boundary).

### 20.4 Hard rules for AI engineers

- Never weaken an invariant in §3 without an ADR + Giulio's sign-off.
- Never skip the four-phase pattern.
- Never edit this document without also updating the relevant audit script and ADR.
- Never deploy to production without staging-green for 24 hours.
- Never bypass the canary protocol.
- Never mark a pack 🟢 in the Master Charter without all seven completion conditions.
- Never commit without running `npm run audit:gate --fast-only`.
- Never push to `main` without running the full audit chain.

### 20.5 The single prompt that triggers Codex

When Giulio wants to trigger an autonomous loop iteration:

> You are Codex acting as supervising senior engineer for PRAXIS. Read the architecture bible at `PRAXIS_ARCHITECTURE.md` and the master charter at `PRAXIS_CODEX_00_MASTER_CHARTER.md`. Run the autonomous loop defined in §2 of the charter. Strictly follow the four-phase pattern (Read & report → Propose & confirm → Execute → Verify). Update the live status table and loop iteration log at the end. Stop and write a Blockers entry if you encounter a question only I can answer. Deployment target is praxis.tacitus.me. Hard rules in §3 of the architecture bible and §8 of the charter are inviolable. Begin.

---

## 21. Anti-patterns

What not to do. Each comes with a concrete reason.

| Anti-pattern | Why it's wrong |
|---|---|
| Reading Firestore directly from a tool handler | Bypasses ContextProvider; future store changes require touching every tool. |
| Hard-coding a model string in a route file | Breaks the model matrix; switching models becomes a search-and-replace risk. |
| Adding a 9th ACO primitive without an ADR | The substrate is the foundation; widening it is a database migration + a code-wide refactor. |
| Throwing 412 on low context health | Pack 12 retired this. Tools always run; advisories inform. |
| Calling a subagent without a cost ceiling | Cost runs are the #1 production surprise; ceilings are non-negotiable. |
| Writing to the graph from a subagent | Bypasses the firewall; synthesized assertions go through the review queue. |
| Adding a top-level route under `/app/` | The canonical map is sealed; new surfaces are workbench tabs or settings sections. |
| Hand-clicking a GCP resource | Terraform drift; CI fails; nobody can reproduce. |
| Pushing to main without the canary protocol | An undetected regression hits 100% of users at once. |
| Marking a pack DONE because tests pass | Tests pass is necessary; persona suites green for 10 consecutive runs is sufficient. |
| Editing this document without an ADR | The architecture bible is the single source of truth; silent edits create drift between code and reality. |

---

## 22. Update protocol

This document is updated when:

1. An invariant in §3 changes (rare; requires ADR).
2. A layer in §4 gains a new responsibility (rare; requires ADR).
3. A new pattern is established that affects engineers' day-to-day work (e.g., a new subagent template, a new audit script).
4. A retirement is finalized (e.g., when Neo4j is removed from the codebase entirely, this section's mention of "may return as a v2 graph-algorithm specialty engine" is updated to a final retirement statement).

Updates flow:

1. Open a PR with the doc change.
2. Add the corresponding ADR.
3. Update any audit scripts that enforce the changed invariant.
4. Update §23 (Changelog).
5. Bump the document version in §0.
6. Sign with Giulio.

---

## 23. Changelog

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-05-06 | Initial canonical bible. Crystallizes architecture across packs 03-14. Recalibrates symbolic firewall to three-tier model (hard/soft/synthesized). Confirms Vertex AI / Gemini Enterprise Agent Platform as runtime. Confirms Neo4j retirement in v1. |
| 1.1 | 2026-05-07 | Adds Pack 22 safe/read-only GCP and Gemini verification guards to the audit chain while keeping cost-impacting infrastructure work owner-gated. |

---

## 24. Quick reference

### 24.1 Files to know by heart

| File | Purpose |
|---|---|
| `PRAXIS_ARCHITECTURE.md` | This document. The bible. |
| `PRAXIS_CODEX_00_MASTER_CHARTER.md` | The autonomous loop driver. |
| `src/lib/graph/core-primitives.ts` | The 8 ACO primitives. |
| `src/types/context.ts` + `backend/types/context.py` | The 4-layer context types. |
| `src/lib/ai/MODEL_MATRIX.json` | The model selection. |
| `src/lib/firewall/structural.ts` + `backend/firewall/structural.py` | The hard-tier firewall validators. |
| `src/lib/tools/registry/<id>.ts` | Tool contracts. |
| `skills/tools/<id>/SKILL.md` | Tool skill files. |
| `backend/agents/<id>/` | Subagent implementations. |
| `infrastructure/terraform/` | Infrastructure-as-code. |
| `docs/adr/` | Architecture decisions. |

### 24.2 Commands to run reflexively

```
npm run audit:gate --fast-only         # before every commit
npm run audit:gate                     # before every push
npm run smoke:tasklet-app              # before every PR
bash scripts/terraform-apply.sh staging  # to provision a fresh environment
bash scripts/deploy-subagents-staging.sh # after subagent changes
npm run lh:ci                          # before any UI-touching merge
```

### 24.3 The model selection cheat sheet

| Need | Use |
|---|---|
| Cheap classification | `cheap_classify` → gemini-2.5-flash-lite |
| Balanced reasoning | `balanced` → gemini-3-flash |
| Complex reasoning | `complex_reasoning` → gemini-3.1-pro |
| Long-context analysis | `long_context` → gemini-3.1-pro (32k+) |
| Writing quality | `writing_quality` → claude-opus-4.7@vertex |
| Embeddings | `embeddings_text` → text-embedding-005 (768-dim) |
| Embeddings (long docs) | `embeddings_long` → gemini-embedding-001 (1536-dim) |

### 24.4 The decision tree in one paragraph

New domain concept? Map to one of 8 ACO primitives, declare a subtype in an ontology. New context? Map to one of 4 context layers. New analytical capability? It's a tool — copy the template, write a SKILL.md, declare the contract. New AI capability? It's a subagent — same template pattern, deploys to Agent Engine. New UI surface? It's a workbench tab or a settings section, never a top-level route. New data store? It isn't — the four-store model covers everything. New external integration? It's a tool with an MCP connector. New infrastructure? It goes in Terraform.

---

## 25. Closing note

PRAXIS is structurally simple at its core. There are eight primitives, four context layers, three firewall tiers, two stores plus blob storage, one runtime (Gemini Enterprise Agent Platform), one workbench, one source of truth (this document). Every additional surface — the curated tool marketplace, six memo templates, nine ontology lenses, four subagents, four sample situations, ten infrastructure modules — fits inside that core without expanding it.

The discipline that keeps the architecture stable is not the rules in §3 in isolation. It is the practice of treating those rules as inviolable until an ADR explicitly retires them. Engineers work on PRAXIS for a long time before they need to retire one. When they do, they retire it deliberately, and they update this document.

When you are inside the codebase trying to figure out where something belongs, the answer is almost always already in §17. When you are not sure whether to weaken an invariant for convenience, the answer is in §3. When you are weighing a refactor, the answer is in §18. When you are about to ship, the answer is in §19.

Everything else is detail.

---

**File path**: `C:\Users\giuli\Downloads\PRAXIS_ARCHITECTURE.md`

**Companion documents**:
- `C:\Users\giuli\Downloads\PRAXIS_CODEX_00_MASTER_CHARTER.md` — autonomous loop driver
- `C:\Users\giuli\Downloads\PRAXIS_CODEX_03_*.md` through `PRAXIS_CODEX_14_*.md` — pack-by-pack engineering plans
