# PRAXIS High-Impact Product Plan — 2026-04-26

Purpose: give Codex, Claude Code, and future teammates a concrete multi-day
plan for turning PRAXIS into a useful daily workspace for policy officers,
diplomats, analysts, mediators, and humanitarian/legal teams.

This document complements `docs/SPRINT_EXECUTION_PLAN_2026-04-25.md`. The
sprint file tracks immediate workstreams; this file defines the product and
knowledge architecture those workstreams should build toward.

## Product North Star

PRAXIS should help a user move from raw context to defensible action:

1. Define who they are: role, mandate, audience, domain, red lines, language.
2. Define what they are working on: situation, actors, claims, documents,
   sources, geography, timeline, constraints, and uncertainty.
3. Build a structured knowledge base: graph, documents, source records,
   event feeds, tool outputs, advisor memory, and approved user notes.
4. Use specialized tools: briefing, conflict graph, risk, media, legal,
   negotiation, scenario, humanitarian, sanctions, and reports.
5. Preserve meaning: every output records the prompt context, model, sources,
   confidence, provenance, and what changed in the situation knowledge base.
6. Let Ask PRAXIS operate as an interface to the workspace, not a generic chat:
   explain, retrieve, update, recommend tools, and propose structured changes
   for user approval.

## System Principles

- User context is first-class. Profile, preferences, audience, and role shape
  every output and every recommended next action.
- Situation context is first-class. Tools should never operate as disconnected
  pages; each should read and write meaningful situation state.
- Source truth beats model fluency. Outputs should cite approved sources,
  uploaded documents, open feeds, or explicit reasoning gaps.
- User approval matters. PRAXIS may propose graph/entity/source changes, but
  canonical situation knowledge should record whether the user approved them.
- Operational status is visible. Users should know what is running, stale,
  failed, queued, or waiting for more input.
- Plan-based product copy. Internal metering exists for reliability and abuse
  control, but public UX should sell useful workspaces, not credit arithmetic.

## Knowledge Architecture

Current canonical stores:

- `users/{uid}/profile/analyst`: role, seniority, mandate, audience, domains,
  regions, language, red lines, analytical style, version history.
- `users/{uid}/preferences/default`: citation style, report length, default
  language, confidence labeling, time horizon, preferred advisor, hidden tool
  IDs, and tool order.
- `users/{uid}/situations/{situationId}`: situation title, region, actors,
  domain, source URLs, context notes, status, timestamps.
- `users/{uid}/situations/{situationId}/tool-data/{toolId}`: UI/SKC-facing
  generated output with versions.
- `users/{uid}/situations/{situationId}/tools/{toolId}`: legacy/server output
  path that still powers recent-tool surfaces.
- `tool_runs`, `background_jobs`, `system_events`, `notifications`: operational
  spine and user-visible status.

Target knowledge layers:

1. Profile layer: who the user is and how they want analysis framed.
2. Situation layer: canonical facts, actors, sources, geography, timeline.
3. Document layer: uploaded files, extracted text, chunks, metadata, citations.
4. Event/feed layer: GDELT/UCDP/ReliefWeb/HDX/UN News/World Bank/UNHCR records.
5. Graph layer: ACO nodes/edges, confidence, provenance, proposed deltas.
6. Vector/RAG layer: embeddings and retrieval over documents, notes, outputs,
   feed summaries, and approved graph facts.
7. Tool-output layer: structured outputs, assumptions, confidence, citations,
   profile/domain versions, and reusable derived facts.
8. Advisor/interaction layer: recent tool runs, Ask PRAXIS conversation memory,
   user approvals, and rolling advisor summaries.

Managed Google Cloud path:

- Keep Firestore as the operational source of truth for user-owned state.
- Use Cloud Storage for uploaded source documents and export artifacts.
- Use BigQuery for analytics, feed hot slices, long-running audit queries, and
  cross-situation aggregate intelligence.
- Use Vertex AI embeddings plus Vertex AI Vector Search or Vertex AI RAG Engine
  for semantic retrieval once the Firestore/SKC contract is stable.
- Use Vertex AI Search where PRAXIS needs managed search over document corpora
  or structured/unstructured collections.
- Use Pub/Sub and Cloud Tasks for durable background work and fan-out.
- Use Cloud Run for frontend/backend and Cloud Functions/Eventarc for
  situation/document triggers.
- Evaluate TrustGraph-style semantic layers later as an adapter behind the SKC
  interface, not as a first dependency.

## Recursive Work Loop

Each brick should follow the same loop:

1. Pick one user workflow and one owner.
2. Read the page, API route, persistence path, tests, and docs.
3. Define the expected user story in one paragraph.
4. Make the smallest coherent code change.
5. Add or update focused tests.
6. Run typecheck/build/focused tests and broader gates when appropriate.
7. Update `CHANGELOG.md`, `docs/CONTINUATION.md`, and the relevant product doc.
8. Commit and push.
9. Smoke-test as a user: buttons, empty state, loading, success, persistence,
   reload, and error state.
10. Record the next brick and any human action needed.

## Next 10 High-Impact Bricks

1. Live profile and preference propagation.
   - Status: shipped by Codex in `d1fd8c1` plus the follow-on dashboard
     recommendation/preferences brick.
   - Goal: profile edits immediately reshape sidebar/dashboard recommendations.
   - Files: `src/lib/auth/auth-context.tsx`, `src/components/app/app-sidebar.tsx`,
     `src/components/dashboard/recommended-tools-widget.tsx`.

2. Source-truth cleanup across landing/auth/onboarding/system health.
   - Owner: Claude Code recommended.
   - Goal: no stale ACLED/Firecrawl/Anthropic/Tavily/Parallel user promises.
   - Files: use Prompt 1A in `docs/CLAUDE_TANDEM_PROMPTS_2026-04-25.md`.

3. Situation detail overview.
   - Goal: `/app/situations/[id]` becomes the user’s operational case page.
   - Include: status, domain, source health, document health, graph health,
     activity feed, next recommended action, and approval queue.

4. Canonical tool-output contract.
   - Goal: choose one canonical output envelope and map legacy paths.
   - Include: `toolId`, `schemaVersion`, `data`, `generatedAt`, `version`,
     `profileVersion`, `domainVersion`, `model`, `sources`, `confidence`,
     `assumptions`, `approvedFacts`, and `retrievalTrace`.

5. Ask PRAXIS as workspace operator.
   - Goal: chat can explain, retrieve, propose edits, and launch tools.
   - Every mutation should be proposed, previewed, and approved before write.

6. Conflict Graph v2.
   - Goal: graph is not only visual; it becomes a structured case model.
   - Include: proposed graph deltas, confidence, provenance, approve/reject,
     graph health, and “why this edge exists.”

7. Document ingestion trust loop.
   - Goal: upload → extract → chunk → summarize → cite → graph proposals.
   - Include: extraction status, source metadata, citation IDs, and document
     confidence/gaps.

8. Dashboard v2.
   - Status: started by Codex; operational-status panel now surfaces real
     tool freshness/running/failure state from existing semaphores.
   - Goal: command center, not metrics grid.
   - Include: daily read, active risks, recent changes, source coverage,
     outstanding approvals, running jobs, recommended tools, and user role.

9. Tool-by-tool quality pass.
   - Goal: every visible tool has guard, useful empty state, persistence,
     citations, confidence, reload behavior, and export path.
   - Order: Assistant, Conflict Graph, Risk, Early Warning, Briefing, Media
     Roundup, Negotiation Prep, Dossier, Policy Memo, Humanitarian.

10. Operator and reliability pass.
    - Goal: admin can diagnose production without reading raw logs first.
    - Include: job drill-down, retry, linked events, user filter, service
      account state, worker last-success, and deploy checklist status.

## Page And Tool Design Template

Every tool page should answer:

- What question does this tool answer for this user?
- What context does it need from the profile and situation?
- What sources does it trust?
- What output schema does it produce?
- What does it write back to the situation?
- What should the user approve before it becomes canonical knowledge?
- What is stale, missing, uncertain, or low-confidence?
- What is the next best action after reading it?

## Claude Code Parallel Prompt

Use this when Claude should work without touching Codex-owned context/sidebar
files:

```text
You are Claude Code working in tandem with Codex on PRAXIS.

First run:
git pull origin main
git status
git log --oneline -5

Read:
- CLAUDE.md
- AGENTS.md
- CHANGELOG.md
- docs/CONTINUATION.md
- docs/SPRINT_EXECUTION_PLAN_2026-04-25.md
- docs/PRAXIS_HIGH_IMPACT_PRODUCT_PLAN_2026-04-26.md
- docs/CLAUDE_TANDEM_PROMPTS_2026-04-25.md

Task: execute the source-truth cleanup and first-run UX improvement lane.
Own only landing, auth copy, onboarding, system-health copy, and docs listed
in Prompt 1A. Do not touch auth context, sidebar, preferences, tool-output
contracts, backend, cloud functions, or infrastructure.

Definition of done:
- Public copy reflects Google Cloud / Vertex AI / open-data stack.
- Onboarding explains why user profile and situation context matter.
- No stale ACLED/Firecrawl/Anthropic/Tavily/Parallel user promises remain.
- Build and typecheck pass.
- CHANGELOG and CONTINUATION are updated.
- Commit and push to main.
```

## Human Actions Needed

1. Run the Cloud Shell production-finalization block when Codex provides it:
   Firestore rules/indexes deploy, function service-account redeploys, worker
   restart, and smoke-test Firestore rows.
2. Confirm email provider for yellow/red operational notifications:
   SendGrid remains the default unless Giulio chooses otherwise.
3. Confirm whether Stripe checkout should stay disabled/early-access until
   plan products and webhook secrets are configured.
4. Confirm procurement/compliance priorities: DPA, sub-processor page, SOC 2
   readiness tracker, and UN vendor path.
5. Decide when to spend on managed retrieval infrastructure:
   Firestore/SKC first, then Vertex AI Vector Search/RAG Engine pilot.
