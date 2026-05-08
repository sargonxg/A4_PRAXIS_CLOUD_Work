# PRAXIS Simplified Context Core Model

Date: 2026-05-08

## What PRAXIS Is

PRAXIS is a context-first policy workbench. The simple product promise is:

1. Open or create a Situation.
2. Ask PRAXIS what matters, what is missing, and what to do next.
3. Add sources and documents.
4. Let the system maintain the situation model, graph, timeline, actors, and evidence posture.
5. Produce a brief, memo, handover, or export-ready package.

The simplification does not delete the existing platform. It hides the large tool surface behind a smaller operating model: Home, Ask PRAXIS, Situation Model, Sources, Outputs, and Advanced.

## General And Context-Bound Operation

PRAXIS can work in two modes:

- General PRAXIS mode: the user asks across the platform model, tool catalog, workflow registry, examples, and broad product knowledge. This is powered by the PRAXIS Core.
- Context-bound mode: the same tools attach to a specific user, team, situation, source corpus, document corpus, graph, or output package. In this mode every answer and action is scoped to the active context core.

This is the key simplification: the user does not need to choose from dozens of tools. They choose a Situation and ask for work. PRAXIS decides which consolidated capability should run and which context cores it is allowed to use.

## Context Cores

The code-backed registry lives at `src/lib/product/context-core-map.ts`.

| Core | Scope | What It Holds | Current Posture |
| --- | --- | --- | --- |
| PRAXIS Core | Platform | Tool registry, workflows, answer rules, experience model, audit gates. | Live |
| User Core | User | Profile, preferences, settings, saved situations, model posture. | Live |
| Team Core | Team | Shared workspace context and future multi-user membership policy. | Staged |
| Situation Core | Situation | Goals, actors, geography, timeline, assumptions, gaps, and recent work. | Live |
| Source Core | Situation | Source receipts, credibility posture, coverage gaps, retrievable source fragments. | Live with optional Cognee |
| Document Core | Artifact | Uploaded documents, extracted fragments, entities, and provenance. | Live with optional Cognee |
| Graph Core | Situation | Canonical and advisory graph context, actors, claims, events, edges, and graph health. | Live with optional Cognee |
| Output Core | Artifact | Briefs, memos, drafts, handovers, exports, and saved packages. | Live |

Cognee is treated honestly as an optional memory layer. Source, document, and graph cores can use Cognee recall, ingest, or candidate generation when the feature is enabled and configured. The canonical app must still work without Cognee through source receipts, workspace state, Firestore, backend routes, and review-gated graph writes.

## Multi-User Model

The User Core is the default ownership boundary. A person can have many situations, documents, sources, outputs, and settings. The Team Core is the collaboration boundary: multiple users may share a Situation only through explicit workspace or team authorization.

The product rule is simple:

- Personal work stays under the authenticated user.
- Team work requires a team or workspace grant.
- Situation data, source receipts, document fragments, graph state, and outputs inherit the owner/team scope.
- PRAXIS must not answer from another user's context unless the shared workspace grants access.

This is why the simplified product still needs owner-scoping, cross-user isolation, route-level auth, and audit coverage.

## How Tools Are Incorporated

The old surface had many specialist tools. The simplified surface keeps their code and functionality, but folds them into nine consolidated capabilities:

| Consolidated Capability | User-Facing Area | Context Cores | Preserved Tool Families |
| --- | --- | --- | --- |
| Situation Dashboard | Home | PRAXIS, User, Situation, Sources, Graph, Outputs | dashboard, situation intelligence, risk, early warning, humanitarian, rights, economic impact |
| Context Builder | Situation Model | PRAXIS, User, Team, Situation | context builder, situations, profile, requirements |
| Ask PRAXIS | Ask PRAXIS | PRAXIS, User, Team, Situation, Sources, Documents, Graph, Outputs | assistant, chat, advisory, Concordia |
| Research & Sources | Sources | PRAXIS, Situation, Sources, Documents | source scout, source library, deep search, Argus, source monitor, global search |
| Documents | Sources | User, Situation, Sources, Documents | documents, docs, cases |
| GraphOps | Situation Model | PRAXIS, Situation, Sources, Documents, Graph | GraphOps, Dialectica, conflict graph, power map, external actors |
| Timeline & Signals | Situation Model | Situation, Sources, Graph | timeline, early warning, calendar, alerts, geospatial monitor |
| Actors & Stakeholders | Situation Model | Situation, Sources, Graph, Outputs | stakeholder map, actor profiles, negotiation prep, mediation design, commitments, game theory |
| Briefing Studio | Outputs | PRAXIS, User, Team, Situation, Sources, Documents, Graph, Outputs | briefing, policy memo, talking points, dossier, report studio, exports, legal/sanctions tools |

The source of truth for the capability ledger is `getSimplifiedCapabilityLedger()` in `src/lib/product/context-core-map.ts`. The audit command is `npm run audit:simplified-capability-ledger`.

## What The App Looks Like

The first screen is not a tool marketplace. It is an operating desk:

- Home resumes the active Situation and makes Ask PRAXIS the first action.
- Ask PRAXIS is the command plane: explain, diagnose, plan, act, review, and produce.
- Sources collects evidence, source receipts, document uploads, and research coverage.
- Situation Model shows the structured context: actors, timeline, ontology, graph, and open gaps.
- Outputs turns the context into memos, handovers, drafts, and export-ready packages.
- Advanced keeps the specialist tools, admin, settings, ACH, Boardroom, GraphOps, and deeper controls reachable without making them the user's first burden.

The landing page should mirror this same model: PRAXIS is powerful because the technical system underneath is rich, but the user experience is intentionally simple.

## Technical Complexity Hidden Behind Simplicity

The simple UI depends on several hard technical constraints:

- Context routing: every answer must know whether it is using general PRAXIS context or a specific user/team/situation core.
- Evidence discipline: answers must prefer retrieved sources, saved source receipts, graph facts, and explicit gaps over unsupported claims.
- Multi-user isolation: user and team scopes must be enforced at API, backend, database, and retrieval boundaries.
- Optional Cognee memory: Cognee can improve recall and context construction, but disabled/unavailable Cognee must not break the app.
- Canonical graph safety: generated graph candidates remain advisory until reviewed and promoted.
- Tool preservation: specialist tools are folded into a smaller surface, not deleted.
- Auditability: registries and scripts must prove that each tool family is still mapped, scoped, and reachable.

## Audit Contract

This model is tracked by:

- `src/lib/constants/consolidated-tools.ts` for the nine consolidated capabilities and preserved specialist tool IDs.
- `src/lib/product/experience-map.ts` for the six user-facing app areas.
- `src/lib/product/context-core-map.ts` for context cores, multi-user behavior, Cognee posture, and the capability ledger.
- `scripts/audit-simplified-capability-ledger.ts` for static proof that the model remains coherent.
- `docs/audits/2026-05-08-DESIGN_LED_AGENTIC_APP_AND_LANDING_PASS.md` for delivery evidence.

Runtime claims still require runtime proof. This document describes the intended simplified architecture and the code-backed static ledger; it does not claim every staged team or live Cognee path is production-enabled.
