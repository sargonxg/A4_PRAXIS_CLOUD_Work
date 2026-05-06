# PRAXIS — Codex Pack 12: Context Architecture Rebuild

**Branch**: `feature/context-architecture-v2`
**Depends on**: Packs 03, 04, 05, 06, 07, 08, 09, 10, 11 merged.
**Owner gate**: This pack changes a load-bearing invariant — the Context Health Gate from pack 05 D2 stops being a hard blocker and becomes advisory + AI-assisted. Do not merge to `main` without Giulio's explicit sign-off on the new behavior contract.
**Estimated effort**: ~7 days (~58 engineering hours).
**Voice**: Architect + product engineer. Constructive. Builds the new system, integrates with the old without ripping it out, and ships it to praxis.tacitus.me.

---

## 0. Why this pack exists

Pack 05 D2 introduced `withContextHealthGate` as a middleware that returned **412 Precondition Failed** when a case's Context Health Score fell below 60. The intent was sound: don't run analytical tools on cases with insufficient grounding, because the outputs would be unreliable. The execution, in retrospect, was too strict for a working product. A user who is *building* a case — ingesting their first three documents, sketching the actor map, exploring the ontology — hits the 60 threshold maybe twenty minutes into a session. Until then, every analytical tool returns a 412 and a wall. PRAXIS becomes a tool that won't help you until you've already done the work it was supposed to help with.

Worse, pack 05's "context" is exclusively the **case graph plus frame**. It does not include who the user is, what they're trying to accomplish, what their organization's methodology is, what reference documents they routinely consult, or what they were just talking about thirty seconds ago. A diplomat at the UK Mission writing a Mandate brief on UN CTED renewal has a different context than a mediator at a corporate dispute resolution practice writing a session summary, even when both happen to be using the same ontology and the same case-graph density. PRAXIS today treats them identically because user context does not exist in the system.

This pack rebuilds context as a **layered substrate** that tools query through a unified API, with AI assistance available wherever context is thin. The four layers:

- **User context.** Identity, role, organization, expertise, mandate, preferred ontologies, default templates, suggested tools, communication style. Persistent. Configurable in settings. Captured progressively from the sign-up form (pack 09 I7), the onboarding coach (pack 09 I7), and explicit preferences UI (this pack).
- **Workspace context.** Organization-level reference material. Methodology guides ("Harvard PON method primer," "FCDO mandate-brief style guide"), org-internal documents, glossaries, named-entity dictionaries. Shared across all cases the user works on within that workspace. Pack-12-v1 supports a single personal workspace per user; v2 extends to multi-tenant teams.
- **Case context.** What pack 05 already meant by "context": the case frame, the ingested sources, the documents, the graph itself, the case-specific notes. Owner-scoped per the existing invariants.
- **Conversation context.** The transient state of *what is happening right now*: which workbench tab, which node was just inspected, which tool is the user about to run, which memo block did they just edit. Lives only for the duration of the session. Feeds tool runs and the Context Preparer subagent so that "run this on the thing I just clicked" works without the user re-stating the focus.

The architectural shift in tool gating: `withContextHealthGate` (412 blocker) is replaced by `withContextAware` (advisory wrapper). Tools always run; the wrapper attaches a `contextSnapshot` to the request showing what context is present and where the gaps are. When a gap matters, the tool can invoke the **Context Preparer subagent** — a LangGraph subagent that summarizes what exists, extracts relevant snippets, drafts a synthetic bundle covering the gap (with confidence flags), and asks the user to confirm before the tool consumes it. The user is never blocked; they are informed and offered help.

The architectural shift in tool authoring: every tool now declares a **`contextSpec`** statically — what user fields it needs, what workspace docs it benefits from, what graph predicates it requires, what the floor is for graceful no-signal output. The Tool Suggestion Engine (pack 13) reads these specs to recommend tools per user per case. The Context Preparer reads them to know what to fill.

After this pack, PRAXIS understands its users, knows its organization, remembers what the conversation is about, and helps when context is thin instead of refusing to help. The deployment target is praxis.tacitus.me; every change is verified against the production environment before launch.

---

## 1. Outcomes

| # | Outcome | Verification |
|---|---|---|
| 1 | Four-layer context type model — User, Workspace, Case, Conversation — with TypeScript types and Pydantic mirrors at byte parity | `pytest backend/tests/test_context_parity.py -q` and `npm run test -- src/types/context` green |
| 2 | Persistence schema for User and Workspace context: Firestore collections `users/{uid}/profile/preferences`, `users/{uid}/profile/expertise`, `workspaces/{wsId}/guidelines/{docId}` | Rules tests + integration tests green |
| 3 | `withContextAware` middleware replaces `withContextHealthGate`. Tools never receive 412. They receive a `contextSnapshot` request decoration | Integration tests confirm no 412 from `/v1/cases/*/tools/*/run`; legacy 412 paths return 200 + advisory snapshot |
| 4 | Context Preparer subagent (`backend/agents/context_preparer/`) is functional: given a `ContextSpec` and current substrate, returns a `PreparedContext` bundle with summaries, extractions, gap notes, and a confidence vector | Eval set ≥ 16 cases; gap-fill quality reviewed manually; integration tests cover happy path + degraded path |
| 5 | User Preferences UI at `/app/settings/preferences` lets the user set role, organization, mandate, communication style, default templates | Manual smoke + Playwright spec |
| 6 | Workspace Guidelines UI at `/app/settings/workspace` lets the user upload reference documents (PDFs, MD, DOCX); each is parsed and indexed for retrieval | Manual smoke + integration test |
| 7 | Conversation context is captured by the workbench layout component and exposed via a `ConversationContext` provider; tools and subagents can read it | Round-trip test: change focus → run tool → tool sees correct focus in `contextSnapshot` |
| 8 | Diagnostics dashboard adds a "Context Health Distribution" panel (extending pack 08 G9) showing per-layer health, Preparer invocation count, gap-fill success rate, preference completeness | Panel renders real data; alert thresholds set |
| 9 | Existing surfaces using `withContextHealthGate` migrated to `withContextAware`. Pack 05 invariants preserved (model strings only in providers; symbolic firewall on writes; etc.) | `npm run audit:context-aware-coverage` exits 0; pack-05 audits still green |
| 10 | Deployed to staging environment of praxis.tacitus.me and smoke-tested before production cutover | Staging smoke recorded in PR; production deploy gated on smoke pass |

---

## 2. Pre-work confirmation note

> I am Codex. I have read pack 12. I understand:
> 1. The contract change for tool gating: tools no longer return 412 on low context health. They return 200 with a `contextSnapshot` describing the situation and, where applicable, an `aiAssist` offer (the tool can be re-invoked with `?prepare=true`, which routes through the Context Preparer subagent before the tool runs).
> 2. The four context layers and their persistence: User and Workspace are owner-scoped Firestore collections; Case context already lives in `users/{uid}/situations/{caseId}/`; Conversation context is in-memory, propagated client-to-server via a request header `X-Praxis-Conversation` carrying a JSON token.
> 3. The Context Preparer is a LangGraph subagent — a graph node that itself runs an LLM call with a constrained system prompt. It is invoked from tool handlers (pack 13) or directly from API endpoints. It reads from the Postgres-backed graph (pack 10) and the Firestore-backed user/workspace data, and writes audit records but no graph mutations. It respects the symbolic firewall: any structured assertion it produces is marked `layer='Claim'` with a low confidence floor, never persisted as `Verdict`.
> 4. User context is captured progressively. At sign-up, the role question (pack 09 I7) is the seed. The onboarding coach (pack 09 I7) extends it. The Preferences UI (this pack L2) makes it explicit. There is no required profile field — every field has a graceful default and an "I'll fill this later" option.
> 5. Workspace context is single-tenant per user at v1. The schema supports `workspaceId` from day one so the v2 multi-tenant migration is a data-only change, not a schema change.
> 6. All deployment targets are praxis.tacitus.me. Every L-prompt's verification step includes a staging smoke. The final L9 includes the production deploy.
>
> Open questions for Giulio:
> - **Q1**: The Context Health Score from pack 05 — propose retaining the 0-100 score and the six dimensions, but expanding to four layers: each layer scores independently, and the case-level dashboard shows a composite. Acceptable, or do you want me to keep a single global score?
> - **Q2**: The "AI assist" offer — propose surfacing it as a one-click button on every tool's run dialog when the tool's `contextSpec` is not fully met. The button reads "Use AI to fill the gap" and shows a preview of what the Preparer produced before the tool runs. Acceptable, or do you want it more aggressive (auto-prepare without confirmation) or more passive (only on explicit user request)?
> - **Q3**: Workspace guidelines — propose supporting upload of PDFs, .docx, .md, .txt up to 10 MB each, up to 50 docs per workspace at v1. Indexed via the pgvector embeddings from pack 10. Acceptable?
> - **Q4**: The Context Preparer's confidence floor — propose: any assertion it produces is `layer='Claim'`, `confidence ≤ 0.6`, never auto-persisted to the graph. Tools consuming Preparer output see the same payload structure as raw context but with a `synthesized: true` flag and per-field provenance pointing back to the Preparer run. Acceptable?

Wait for answers before proceeding.

---

## 3. Pack overview

| Prompt | Outcome | Est. hrs |
|---|---|---|
| L1 | Four-layer context type model: TS + Pydantic at parity, persistence schema, repos | 7 |
| L2 | User context: profile, preferences, expertise, suggested tools, settings UI | 7 |
| L3 | Workspace context: guidelines, methodology docs, reference library, settings UI | 7 |
| L4 | `withContextAware` middleware replacing `withContextHealthGate`; backwards-compat | 6 |
| L5 | Context Preparer subagent (LangGraph): reads spec + substrate, produces PreparedContext | 8 |
| L6 | Conversation context: client-side capture, server-side propagation, scope guarantees | 5 |
| L7 | Diagnostics: Context Health Distribution panel, Preparer telemetry, gap-fill metrics | 5 |
| L8 | Migration of existing surfaces to the new context API; pack-05/06/07/08 invariants preserved | 6 |
| L9 | Final verification gate, audit, docs, staging smoke, production deploy to praxis.tacitus.me | 7 |
| **Total** | | **~58** |

---

## 4. Hard rules

- **Context Health Score is preserved as a number.** It is no longer a gate. Any code that branches on `score < 60` to throw 412 is removed; any code that wants to *advise* on score is welcome.
- **The four-layer model is the only model.** New code does not invent its own context shape. The `ContextProvider` API (pack 13) is the only sanctioned way to read context inside tools.
- **Owner scoping is absolute.** Every read query against User/Workspace/Case context carries `owner_uid` (and `case_id` where applicable) as a required parameter. There is no `findAll()` shape.
- **Conversation context is in-memory + transient.** It is never persisted server-side. It is propagated per request via `X-Praxis-Conversation` header carrying a signed JWT-like token (signed with a per-session secret, not personally identifying).
- **Synthesized context is labeled.** Anything the Context Preparer produces carries `synthesized: true` and a `confidence ≤ 0.6` floor. Tools consuming it know they are consuming model output, not user-asserted truth.
- **Symbolic firewall preserved.** The Preparer never writes structured assertions to the graph. If a tool wants to *propose* graph additions based on Preparer output, that goes through the existing review queue (pack 06 E5).
- **Model strings only in `src/lib/ai/providers.ts` (TS) and `backend/ai/providers.py` (Python).** The Preparer's model selection lives there.
- **No PII in logs.** User profile fields are reasonable to log at debug level (role, org); freeform text fields (mandate, communication style notes) are not.
- **Backwards compat for the persona suites.** Every pack-08 persona suite keeps passing through the migration. If any suite goes red, the L4/L8 work is incomplete.

---

## 5. Prompt L1 — Four-layer context type model + persistence

### Persona
Architect. Designs the type model once, correctly, before any UI or runtime code is written.

### Phase 1 — Read & report

- Read `src/types/truth-layer.ts` (pack 05) — that is the existing context-adjacent type. The new model wraps and extends it; it does not replace it.
- Read pack 06's ontology types (`src/lib/ontology/types.ts`).
- Read pack 11's memo types (`src/types/memo.ts`).
- Read pack 09 I7's onboarding state (`src/lib/onboarding/state.ts`).
- Output `docs/audits/2026-05-06-CONTEXT_INVENTORY.md` listing every existing surface that touches "context" today, its shape, and how the new model subsumes it.

### Phase 2 — Propose & confirm

Propose the type model:

```ts
// src/types/context.ts

export type WorkspaceId = string;

export interface UserContext {
  uid: string;
  workspaceId: WorkspaceId;            // single workspace per user at v1
  identity: {
    displayName: string;
    role?: 'diplomat' | 'mediator' | 'analyst' | 'researcher' | 'policy_advisor' | 'other';
    organization?: string;
    title?: string;
    expertise?: string[];              // free-form tags
  };
  mandate?: {
    primaryFocus?: string;             // free text e.g. "UN CTED renewal", "Northwind dispute"
    typicalOutputs?: MemoTemplateId[]; // pack 11 memo templates the user often produces
  };
  preferences: {
    preferredOntologies?: OntologyId[];      // pack 06
    defaultMemoTemplate?: MemoTemplateId;
    suggestedTools?: ToolId[];               // populated by suggestion engine; user can pin/unpin
    communicationStyle?: 'concise' | 'thorough' | 'narrative';
    confidenceTolerance?: 'low' | 'medium' | 'high';   // controls Preparer threshold per user
  };
  capturedAt: { signupRoleAt?: string; coachCompletedAt?: string; preferencesUpdatedAt?: string };
}

export interface WorkspaceContext {
  workspaceId: WorkspaceId;
  ownerUid: string;
  label: string;
  guidelines: WorkspaceGuideline[];
  glossary?: GlossaryEntry[];          // user-curated key terms
  methodologyDocs?: WorkspaceGuideline[]; // doc subset flagged as methodology
}

export interface WorkspaceGuideline {
  id: string;
  workspaceId: WorkspaceId;
  title: string;
  kind: 'methodology' | 'style_guide' | 'glossary' | 'reference' | 'other';
  storageRef: string;                  // Cloud Storage URI
  embeddingNodeId?: string;            // refs graph_embeddings via the Postgres pgvector index from pack 10
  uploadedAt: string;
  textHash: string;
}

export interface CaseContext {
  // Pack 05's existing case-level context, refactored into this shape. No new fields.
  caseId: string;
  ownerUid: string;
  ontologyId: OntologyId;
  frame: CaseFrame;                    // pack 05 D5 Context Studio
  sourceCount: number;
  documentCount: number;
  graphNodeCount: number;
  graphEdgeCount: number;
  contextHealth: ContextHealthScore;   // pack 05 D2; SCORE PRESERVED, GATE REMOVED
}

export interface ConversationContext {
  sessionId: string;
  startedAt: string;
  workbenchTab?: WorkbenchTab;         // 'frame' | 'sources' | 'graph' | 'tools' | 'memos' | ...
  focusedNodeId?: string;
  focusedToolId?: ToolId;
  focusedMemoBlockId?: string;
  recentActions: ConversationAction[]; // capped, e.g., last 10 actions
}

export interface ContextSnapshot {
  user: UserContext;
  workspace: WorkspaceContext;
  case: CaseContext;
  conversation: ConversationContext;
  composite: {
    health: number;                     // 0–100, weighted across layers per pack 05 dimensions
    weakestLayer: 'user' | 'workspace' | 'case' | 'conversation';
    advisories: ContextAdvisory[];      // human-readable hints, e.g., "no methodology docs uploaded yet"
  };
}

export interface ContextSpec {
  // What a tool/agent needs from context. All fields optional; presence = required.
  user?: { role?: boolean; mandate?: boolean; preferences?: boolean };
  workspace?: { guidelines?: boolean; glossary?: boolean; methodologyDocs?: boolean };
  caseGraph?: {
    minNodeCount?: number;
    requiredPrimitives?: ACOPrimitive[];   // 8 primitives from pack 06
    requiredOntology?: OntologyId;
  };
  conversation?: { focusedNodeRequired?: boolean };
  minHealthScore?: number;                // ADVISORY, not enforced
  graceful?: boolean;                     // tool tolerates partial context
}

export interface PreparedContext {
  spec: ContextSpec;
  source: ContextSnapshot;
  prepared: {
    summaries: { layer: ContextLayer; summary: string }[];
    extractions: ContextExtraction[];     // relevant snippets pulled from layers
    gaps: ContextGap[];                   // dimensions where prep could not satisfy spec
    syntheticAssertions?: SyntheticAssertion[]; // labeled `synthesized: true`, confidence ≤ 0.6
  };
  confidence: number;                     // 0..1 — Preparer's self-assessment
  preparerRunId: string;
  generatedAt: string;
}
```

Persistence:
- User: `users/{uid}/profile/identity`, `users/{uid}/profile/mandate`, `users/{uid}/profile/preferences`. Owner-scoped Firestore.
- Workspace: `workspaces/{wsId}/guidelines/{guidelineId}` with file content in Cloud Storage at `gs://praxis-workspaces/{wsId}/{guidelineId}/{filename}`.
- Workspace embeddings: leverage pack 10's `graph_embeddings` table with a synthetic node row of primitive `'Constraint'` and subtype `'workspace_guideline'`, owner_uid scoped, no case_id (use a sentinel UUID for cross-case workspace docs). Or — alternative — a separate `workspace_embeddings` table; document the choice.
- Case: existing pack-05 paths.
- Conversation: in-memory client + signed JWT in `X-Praxis-Conversation` header.

Send to Giulio. Confirm: which workspace-embeddings storage strategy (extend `graph_embeddings` vs new table). Wait for sign-off.

### Phase 3 — Execute

- Author `src/types/context.ts` (Zod + TS).
- Author Pydantic mirror `backend/types/context.py` at byte parity.
- Set up Firestore security rules for the new collections (owner-scoped).
- Implement repos:
  - `src/lib/context/user-repo.ts` / `backend/context/user_repo.py`.
  - `src/lib/context/workspace-repo.ts` / `backend/context/workspace_repo.py`.
  - `src/lib/context/conversation.ts` (client-side stateful provider).
- Author `backend/tests/test_context_parity.py` — imports both sides, asserts field-name + type equality.

### Phase 4 — Verify

- Parity test green.
- Schema rules tests green.
- Smoke: insert + read each context layer through repos.
- Pack 05 audits still green (no regression).

### Files to create

- `src/types/context.ts`, `backend/types/context.py`.
- `src/lib/context/user-repo.ts`, `src/lib/context/workspace-repo.ts`, `src/lib/context/conversation.ts`.
- `backend/context/__init__.py`, `backend/context/user_repo.py`, `backend/context/workspace_repo.py`.
- `firestore.rules` updates.
- `backend/tests/test_context_parity.py`.
- `docs/audits/2026-05-06-CONTEXT_INVENTORY.md`.
- `docs/architecture/CONTEXT_MODEL.md` — the canonical reference for the four-layer model.

### Verification commands

```bash
npm run typecheck
pytest backend/tests/test_context_parity.py -q
npm test -- firestore.rules.test
```

---

## 6. Prompt L2 — User context: preferences, expertise, suggested tools, settings UI

### Persona
Product engineer. Knows that the difference between "user has a profile" and "user fills in their profile" is a UI that earns the user's time, not begs for it.

### Outcome

User context is capturable, viewable, editable. The settings page is clean. The sign-up role question (pack 09 I7) populates the seed. The onboarding coach updates `mandate.primaryFocus`. Suggested tools (populated by pack 13's engine) appear in the Preferences UI for pin/unpin.

### Files to create

- `src/app/app/settings/preferences/page.tsx` — sections: Identity, Mandate, Preferences, Suggested tools.
- `src/components/settings/IdentitySection.tsx`, `MandateSection.tsx`, `PreferencesSection.tsx`, `SuggestedToolsSection.tsx`.
- `src/lib/context/user-defaults.ts` — graceful defaults for any unset field. Returns the same shape the rest of the app expects, so missing fields never crash a consumer.
- `backend/routers/user_context.py` — `GET /v1/me/context`, `PUT /v1/me/context/{section}`. Both wrapped in `withCalibration`.
- `e2e/settings/user-preferences.spec.ts` — round-trip: edit → save → reload → editing UI shows new values.

### Files to edit

- `src/lib/onboarding/state.ts` (pack 09 I7) — extend so coach completion triggers `PUT /v1/me/context/mandate` with the captured focus.
- Sign-up form (pack 09 I7) — the role question now writes to `users/{uid}/profile/identity` directly.
- Sidebar — add a "Settings" item linking to `/app/settings/preferences`.

### Hard rules

- Every field has a graceful default. The app does not display "null" or "undefined" anywhere — defaults to "(not set)" with a CTA to set it.
- Communication style and confidence tolerance affect downstream behavior:
  - `concise` → memo templates default to talking-points-style brevity in their auto-populator.
  - `thorough` → tools that accept verbosity hints set them to high.
  - `low` confidence tolerance → Context Preparer floors output confidence at 0.7 (more conservative); `high` allows down to 0.4.
- The user can clear any field at any time. There is no required profile.
- Every save is `withCalibration`-wrapped; audit logged to `audit/user-context/{uid}/{ts}`.

### Definition of Done

- Settings page works for all four section types.
- Defaults flow through every consumer.
- Communication-style + confidence-tolerance levers measurably change downstream behavior in at least one persona suite.
- E2E round-trip green.

### Verification commands

```bash
npm run test -- src/components/settings
npx playwright test e2e/settings/user-preferences.spec.ts
```

---

## 7. Prompt L3 — Workspace context: guidelines, methodology docs, reference library

### Persona
Backend + product engineer. Knows that uploading 50 PDFs without parsing them is just storing files; the value is in chunking, embedding, and making them retrievable when the user is mid-task.

### Outcome

Workspace settings page where the user uploads org-level reference documents. Each upload is parsed (PDF, DOCX, MD, TXT), chunked, embedded via the pack-10 pgvector pipeline, and made retrievable through a `WorkspaceRetriever` API that the Context Preparer (L5) and tools (pack 13) consume.

### Files to create

- `src/app/app/settings/workspace/page.tsx` — drag-and-drop upload, doc list with kind tagging (methodology / style guide / glossary / reference / other), preview, delete.
- `src/components/settings/WorkspaceUploader.tsx`, `GuidelineList.tsx`, `GuidelineDetail.tsx`.
- `backend/routers/workspace.py` — endpoints:
  - `POST /v1/workspaces/{wsId}/guidelines` (multipart upload).
  - `GET /v1/workspaces/{wsId}/guidelines`.
  - `GET /v1/workspaces/{wsId}/guidelines/{guidelineId}`.
  - `DELETE /v1/workspaces/{wsId}/guidelines/{guidelineId}`.
  - `POST /v1/workspaces/{wsId}/retrieve` (semantic retrieval against guidelines).
- `backend/services/workspace_indexing/__init__.py`.
- `backend/services/workspace_indexing/parser.py` — handles PDF (pdfplumber), DOCX (python-docx), MD (markdown), TXT.
- `backend/services/workspace_indexing/chunker.py` — semantic chunking, ~512 tokens per chunk with overlap.
- `backend/services/workspace_indexing/embedder.py` — uses the same provider pack 10 J6 used. Reuses `text-embedding-3-small`.
- `backend/services/workspace_indexing/retriever.py` — `retrieve(wsId, query, top_k=10) -> list[(chunk, similarity, source_guideline)]`.
- `backend/tests/test_workspace_retrieval.py` — eval set of 20 queries against a fixture workspace; precision-at-5 ≥ 70%.
- `e2e/settings/workspace-guidelines.spec.ts`.

### Hard rules

- File size cap 10 MB per file; total cap 500 MB per workspace. Reject with a friendly error.
- Files are stored in Cloud Storage with private ACLs; signed URLs only on read; expiry 5 minutes.
- Indexing happens asynchronously; the upload UI shows a progress state ("parsing", "chunking", "embedding", "indexed").
- Reindexing of all guidelines is an admin operation, exposed in the diagnostics dashboard.
- Workspace deletion cascades all guidelines + their embeddings + their Cloud Storage blobs.

### Definition of Done

- All four file types parse correctly on representative fixtures.
- Retrieval eval set meets the precision floor.
- Upload → indexed → retrievable round-trip under 60 seconds for a 5-MB PDF.
- Manual smoke: upload "Harvard PON method primer.pdf" and the FCDO mandate-brief style guide; query "how to structure positions vs interests" returns relevant chunks.

### Verification commands

```bash
pytest backend/tests/test_workspace_retrieval.py -q
npx playwright test e2e/settings/workspace-guidelines.spec.ts
```

---

## 8. Prompt L4 — `withContextAware` middleware (replaces `withContextHealthGate`)

### Persona
Backend engineer making a contract change. Knows that "this used to throw 412 and now does not" is a behavior change downstream callers will encounter; documents it explicitly.

### Outcome

A new middleware `withContextAware` that:
1. Gathers the four-layer `ContextSnapshot` for the request.
2. Decorates the request payload with `request.contextSnapshot`.
3. Computes composite Context Health (0-100) but does *not* throw on low values.
4. Computes `ContextAdvisory[]` — human-readable hints surfaced to the response.
5. If the request includes `?prepare=true`, invokes the Context Preparer subagent (L5) and decorates with `request.preparedContext` before passing to the handler.

The legacy `withContextHealthGate` becomes a deprecated alias (logs a warning, calls `withContextAware`, never throws). Removed in pack-13 cleanup.

### Files to create

- `src/lib/context/middleware/withContextAware.ts` — Next.js / API-route wrapper.
- `backend/middleware/with_context_aware.py` — FastAPI dependency.
- `backend/tests/test_with_context_aware.py`.
- `e2e/api/context-aware-no-412.spec.ts` — every legacy 412-emitting endpoint now returns 200.

### Files to edit

- `src/lib/context/middleware/withContextHealthGate.ts` — deprecate, keep as alias.
- `backend/middleware/with_context_health_gate.py` — same.
- All API routes currently using the gate — switch to `withContextAware`. The route handlers themselves remain unchanged; they keep doing whatever they did, just no longer behind a hard gate.

### Hard rules

- The middleware never throws on context state. It only annotates the request.
- The advisory list is bounded (≤ 5 entries, prioritized by impact). Not a wall of text.
- The composite health score uses weights: User 15%, Workspace 15%, Case 60%, Conversation 10%. Documented in `docs/architecture/CONTEXT_MODEL.md`.
- The Preparer is invoked only on opt-in (`?prepare=true` or programmatic equivalent). Never automatic.
- Audit log per request: `audit/context-aware/{uid}/{requestId}` with composite score, advisories, prepared (yes/no).

### Definition of Done

- Every prior 412-emitting path returns 200 with snapshot.
- Pack-05 D-prompts' tests updated to assert advisory annotation instead of 412.
- No persona suite regression.

### Verification commands

```bash
pytest backend/tests/test_with_context_aware.py -q
npx playwright test e2e/api/context-aware-no-412.spec.ts
npm run test:e2e:personas
```

---

## 9. Prompt L5 — Context Preparer subagent (LangGraph)

### Persona
ML/agent engineer. Knows that a subagent that produces structured output reliably is mostly about constrained prompts, JSON-schema-validated decoding, and a tight feedback loop on confidence.

### Outcome

A LangGraph subagent at `backend/agents/context_preparer/` that, given a `ContextSpec` and a `ContextSnapshot`, returns a `PreparedContext`. Self-rated confidence; never persists to the graph; always labels output `synthesized: true`.

### Subagent design

The Preparer is a graph with these nodes:

1. **`gather`** — pulls relevant slices from the substrate. For each spec field:
   - User layer: read `users/{uid}/profile/*`.
   - Workspace layer: invoke `WorkspaceRetriever.retrieve(wsId, query=spec_summary, top_k=5)` (L3).
   - Case layer: invoke pack-10 graph traversal for `requiredPrimitives` and pack-10 J6 semantic search for spec-relevant terms.
   - Conversation layer: read from request decoration.
2. **`summarize_per_layer`** — for each layer, produce a 2-4 sentence factual summary, citing source IDs (node IDs, guideline IDs).
3. **`extract_relevant`** — produce a list of `ContextExtraction` items (verbatim or near-verbatim quotes from the layer, with source IDs). Capped at 8 items.
4. **`identify_gaps`** — explicit list of `ContextGap` items where the spec was not satisfied.
5. **`synthesize_assertions`** — *only if the spec is graceful and the user has opted in*. Generates `SyntheticAssertion` items at `confidence ≤ 0.6`, marked `synthesized: true`. Each has provenance pointing at the Preparer run.
6. **`self_rate`** — final node: produces a 0–1 confidence score for the Preparer's overall output.

System prompt skeleton (lives at `backend/agents/context_preparer/prompts/system.md`):

```
You are the PRAXIS Context Preparer. Your job is to assemble a context bundle
that a downstream tool can consume. You do not make analytical claims. You do
not write to the graph. Every assertion you produce is labeled synthesized.

Inputs:
- The tool's context specification (what it needs).
- The current four-layer context snapshot (what is available).
- A retrieval slice from the workspace guidelines, if relevant.

Output (strict JSON, validated against PreparedContextSchema):
- per-layer summaries (2-4 sentences each, factual, citing source IDs).
- relevant extractions (verbatim, source IDs).
- gaps (what the spec asked for that you could not find).
- synthetic assertions, only if explicitly requested AND the spec is graceful;
  each is `confidence <= 0.6` and labeled.

Hard rules:
- Never produce structured assertions about specific actors, claims, events,
  or other ACO primitives unless they appear verbatim in a source you can
  cite. If you must paraphrase, mark it synthesized.
- Never speculate about user intent beyond what the spec asks.
- Confidence calibration: synthesized assertions cap at 0.6; cited
  extractions at 1.0; summaries at 0.85.
```

### Files to create

- `backend/agents/context_preparer/__init__.py`.
- `backend/agents/context_preparer/graph.py` — LangGraph subgraph definition with the six nodes.
- `backend/agents/context_preparer/state.py` — typed state class.
- `backend/agents/context_preparer/prompts/system.md`, `prompts/per_node/*.md`.
- `backend/agents/context_preparer/output_schema.py` — Pydantic schema for the output, used for JSON-schema-validated decoding.
- `backend/agents/context_preparer/runner.py` — public API: `async def prepare(spec, snapshot, options) -> PreparedContext`.
- `backend/agents/context_preparer/eval/cases.json` — eval set: 16 (spec, snapshot, expected_output) tuples covering all four layers and the four ontologies.
- `backend/agents/context_preparer/eval/run_eval.py`.
- `backend/tests/test_context_preparer.py`.

### Hard rules

- The system prompt is committed in version control and reviewed in PR.
- Output is JSON-schema validated; if the model returns non-conformant JSON, the runner retries up to 2 times with a stricter system prompt; on third failure, returns a `PreparedContext` with empty preparation and `confidence = 0` plus an explicit `gaps[].kind = 'preparer_failure'`.
- Per-call latency budget: P95 ≤ 6 seconds. Tool invocation paths must surface a "preparing context…" UI state.
- Cost ceiling per Preparer call: ≤ $0.05. Cost computed via the pack-08 cost table; logged.
- The Preparer is invoked from at most one place: `withContextAware` middleware via `?prepare=true`, OR explicit tool-handler invocation through the pack-13 ContextProvider API. No other call sites.

### Definition of Done

- Eval set runs; aggregate self-rated confidence ≥ 0.6 mean across the 16 cases.
- Manual review of 4 outputs (one per ontology) by Giulio: outputs are useful and not hallucinatory.
- Latency P95 ≤ 6s on staging.
- Cost per call ≤ $0.05 on staging.

### Verification commands

```bash
pytest backend/tests/test_context_preparer.py -q
python -m backend.agents.context_preparer.eval.run_eval
```

---

## 10. Prompt L6 — Conversation context: capture, propagation, scope

### Persona
Frontend engineer. Knows that "conversation context" without scope discipline becomes a leaky bag of state that ruins reasoning about correctness.

### Outcome

A Conversation context provider on the workbench shell that:
- Tracks the active workbench tab, focused node, focused tool, focused memo block.
- Records the last 10 user actions (open node, run tool, open memo, etc.) with timestamps.
- Serializes to a signed token and attaches to every API call as `X-Praxis-Conversation` header.
- Server-side middleware decodes, validates, exposes via `request.conversationContext`.

### Files to create

- `src/lib/context/conversation/provider.tsx` — React context + hook `useConversationContext()`.
- `src/lib/context/conversation/serialize.ts` — JWT-style HMAC-signed token (per-session secret).
- `src/lib/context/conversation/api-client-wrapper.ts` — fetch wrapper that injects the header.
- `backend/middleware/conversation_context.py` — FastAPI dependency, decodes + validates.
- `src/components/workbench/ConversationContextRoot.tsx` — wraps the workbench shell.
- `e2e/workbench/conversation-context.spec.ts` — focus a node → run a tool → assert the tool received the focused node ID in `contextSnapshot.conversation.focusedNodeId`.

### Files to edit

- Workbench shell (pack 03) — wire the provider at the root.
- Tool dialog (pack 08 G4) — set `focusedToolId` on open.
- Graph canvas (pack 07) — set `focusedNodeId` on selection.
- Memo editor (pack 11) — set `focusedMemoBlockId` on cursor.

### Hard rules

- The conversation token is opaque to the client beyond the SDK that constructs it. The signed token includes `sessionId` and a small payload; tampering is detected server-side.
- The session secret rotates per browser session; never persisted.
- The token is **not** an authentication credential — it carries only ephemeral UI focus state. Auth is still Firebase. The conversation context layer trusts but verifies (HMAC).
- Capping: token payload ≤ 4 KB; oldest actions dropped; specific PII never serialized.

### Definition of Done

- E2E spec round-trips focus through the API.
- Token tampering is rejected server-side with a typed error.
- No-op when conversation context is missing (graceful fallback).

### Verification commands

```bash
npx playwright test e2e/workbench/conversation-context.spec.ts
pytest backend/tests/test_conversation_middleware.py -q
```

---

## 11. Prompt L7 — Diagnostics: Context Health Distribution panel + Preparer telemetry

### Persona
Operator. Wants the dashboard to answer the questions that show up at 3 AM: "is the Preparer melting?", "are users hitting low context health a lot?", "is workspace upload failing?"

### Outcome

A new diagnostics panel and three new audit endpoints. Wires into the pack 08 G9 / pack 09 I5 dashboard.

### Files to create

- `src/components/admin/diagnostics/ContextHealthPanel.tsx`. Shows:
  - Composite health histogram across all active cases (last 24h).
  - Per-layer health breakdown (User / Workspace / Case / Conversation).
  - Preparer invocation count, P95 latency, cost-per-call (last 24h).
  - Gap-fill success rate (Preparer self-rated ≥ 0.6 ÷ all invocations).
  - Workspace upload metrics: upload success rate, parse failure count, indexing latency P95.
  - User profile completeness distribution.
- `backend/routers/diagnostics_context.py` — endpoints feeding the panel.
- `backend/services/diagnostics/context_aggregator.py` — daily/hourly aggregation jobs.
- `infrastructure/cloud-scheduler/aggregate-context-metrics.yaml`.
- `docs/runbooks/CONTEXT_PREPARER.md` — runbook: what each red state means, remediation, rollback.

### Files to edit

- `src/app/app/admin/page.tsx` (pack 09 I6) — add the panel.

### Definition of Done

- Panel populated with non-fixture data.
- Each alert path triggers correctly:
  - Preparer P95 > 10s → red.
  - Preparer cost-per-call > $0.10 → red.
  - Preparer failure rate > 5% → red.
  - Workspace upload failure rate > 10% → red.
- Runbook reviewed.

### Verification commands

```bash
# Manual: open /app/admin → diagnostics → context panel populated
```

---

## 12. Prompt L8 — Migration of existing surfaces; pack-05/06/07/08 invariants preserved

### Persona
Migration engineer. Knows that this is a contract change with downstream consumers, and that the migration is mostly mechanical but has subtle correctness gates.

### Outcome

Every existing surface that read context, called the gate, or persisted context-shaped data is migrated to the new APIs without behavior regression on the persona suites.

### Files to edit

- Every API route currently using `withContextHealthGate` → `withContextAware`.
- Every tool handler currently reading context ad hoc → uses the L1 repos via the (yet-to-come pack-13) `ContextProvider` shim. For pack 12, an interim shim `getContextSnapshot(req)` is acceptable.
- Pack 05 D5 Context Studio — read from the new `CaseContext` type instead of its bespoke shape.
- Pack 06 ingestion pipeline — its review-queue UI reads workspace glossaries from the new repo.
- Pack 11 memo studio — auto-populators read User communication style for verbosity hints.
- Pack 09 I7 onboarding — coach completion writes through new repo.

### Hard rules

- No persona suite regression. Run all four after each migration commit.
- No new 412 paths. Every legacy 412 emitter is now `withContextAware`.
- The pack-13 ContextProvider API is *not* yet available; an interim shim is acceptable; the shim is removed in pack 13 M2.

### Definition of Done

- All migrations done in named small commits.
- Pack 05/06/07/08 audits all green.
- Persona suites green for 10 consecutive runs.

### Verification commands

```bash
npm run audit:gate
npm run test:e2e:personas    # 10 consecutive runs in staging
```

---

## 13. Prompt L9 — Final verification, audits, docs, staging smoke, production deploy to praxis.tacitus.me

### Persona
Release engineer. Closes the loop. Deploys.

### Outcome

The pack is shippable. Every audit green. Documentation refreshed. Deployed to praxis.tacitus.me staging, smoke-tested, then production.

### Files to create

- `scripts/audit-context-aware-coverage.ts` — asserts every API route uses `withContextAware`, no `withContextHealthGate` references remain except the deprecated alias.
- `scripts/audit-context-types-parity.ts` — asserts TS / Pydantic parity at every model.
- `scripts/audit-preparer-eval-fresh.ts` — asserts Preparer eval was run within the last 7 days and meets the floor.
- `docs/architecture/CONTEXT_MODEL.md` — canonical reference.
- `docs/architecture/CONTEXT_PREPARER.md` — Preparer system design + prompt + eval methodology.
- `docs/adr/0012-context-aware-replaces-health-gate.md`.
- `docs/adr/0013-four-layer-context-model.md`.
- `docs/adr/0014-context-preparer-subagent.md`.

### Files to edit

- `package.json` — add the three new audit scripts.
- `audit:gate` chain — append.
- `docs/architecture/SYSTEM_OVERVIEW.md` — diagram now shows the four layers + Preparer.
- `CHANGELOG.md` — entry under the 1.x line.

### Staging + production deploy

- Deploy via existing Cloud Build pipeline to staging (`staging.tacitus.me` or equivalent).
- Smoke checklist:
  - User can open settings → preferences → save → reload, persists.
  - User can upload a workspace guideline → indexed within 60s → retrievable.
  - Tool that previously 412'd on low health now runs and returns advisory snapshot.
  - `?prepare=true` invokes Preparer; output appears in tool input.
  - Conversation focus round-trips through a tool run.
  - Diagnostics panel populated.
- After 24h staging smoke green, deploy to production praxis.tacitus.me.
- Production smoke recorded in PR; rollback plan documented.

### Definition of Done

- All audits green.
- Staging smoke 24h green.
- Production deploy clean.
- Persona suites green on production.

### Verification commands

```bash
npm run audit:gate
npm run audit:context-aware-coverage
npm run audit:context-types-parity
npm run audit:preparer-eval-fresh

# Staging smoke (manual + scripted)
PRAXIS_ENV=staging npm run smoke:context

# Production deploy gated on staging smoke
PRAXIS_ENV=production npm run smoke:context
```

---

## 14. Final verification gate (before merge)

```bash
# Foundations
npm run typecheck
npm run lint
npm run test
pytest backend/ -q
mypy backend/ --strict

# The single gate
npm run audit:gate

# Context-specific audits
npm run audit:context-aware-coverage
npm run audit:context-types-parity
npm run audit:preparer-eval-fresh

# Preparer eval (manual recompute if drift suspected)
python -m backend.agents.context_preparer.eval.run_eval

# Persona suites — must remain green after the contract change
npm run test:e2e:personas

# Staging smoke 24h log green
# Production deploy artifact present
```

All commands exit 0. Staging and production smokes signed.

---

## 15. Out of scope

- Multi-tenant team workspaces (v2).
- Workspace guidelines authored collaboratively (v2 with team mode).
- Auto-Preparer (always-on, no opt-in) — explicitly deferred; current default is opt-in.
- Preparer model fine-tuning — the system prompt is enough at v1.
- Cross-user shared preferences (v3 scope).
- Conversation context replay / undo / history beyond the in-session bounded buffer (v3 scope).

---

## 16. Closing note

The Context Health Gate from pack 05 was an architecturally correct response to a misunderstood threat: that an analytical tool run on insufficient context produces nonsense output that the user might trust. The right response, in retrospect, is not to refuse to run the tool — it's to inform the user, offer help, and let the user choose. PRAXIS is a workbench for thoughtful professionals who can read a "this analysis is based on three sources and our Preparer's gap-fill" disclaimer better than they can read a 412 page.

The four-layer context model is the substrate every downstream pack (especially pack 13) builds on. Get the types right in L1; the rest follows.

The Context Preparer is the AI part of the architecture that the prior eleven packs deliberately deferred. It is bounded — it does not write to the graph, it labels its outputs, it self-rates confidence, it has a per-call cost ceiling — but it is the difference between PRAXIS as a structured-data system and PRAXIS as a working assistant.

Branch: `feature/context-architecture-v2`. Commit prefix `context(<area>): <prompt-id> <description>` (e.g., `context(types): L1 add four-layer context model`). PR titled `Pack 12 — Context Architecture Rebuild`.

Do not merge to `main` without:
1. All audits green.
2. Persona suites green for 10 consecutive runs.
3. Staging deploy green for 24h.
4. ADRs 0012-0014 reviewed and merged.
5. Production deploy to praxis.tacitus.me clean.

After merge, pack 13 begins the tool-context interoperability work.
