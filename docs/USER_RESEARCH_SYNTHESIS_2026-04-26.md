# PRAXIS User Research Synthesis — 2026-04-26

Purpose: turn fictional-but-realistic user walkthroughs into an implementation
backlog. Treat these as structured survey notes for product and engineering
agents; every note should either be solved, linked to an issue/commit, or
explicitly deferred.

## Method

Each persona is an idealized professional user with a concrete task. The
reviewer opens the real app flow, asks what the persona expects, records the
friction, and converts the friction into a product/code brick.

## Survey Findings

### Persona 1 — UN Political Affairs Officer

- Task: prepare a morning readout for an SRSG on a deteriorating situation.
- Tools expected: Dashboard, Daily Brief, Conflict Graph, Early Warning,
  Talking Points, Policy Memo, Documents.
- Comment: "The workspace must know my mandate and audience. I should not have
  to restate that every time I open a tool."
- Comment: "If I hide media tools from the sidebar, I do not want them pushed
  back at me on the dashboard."
- Implemented: live analyst-profile subscription in `AuthProvider`, sidebar
  role/domain display, persistent tool visibility/order, and dashboard
  recommendations that honor hidden/reordered tools.
- Next: dashboard v2 should show source coverage, running jobs, stale outputs,
  and outstanding approvals before generic metrics.

### Persona 2 — Embassy Political Officer

- Task: prepare for a negotiation with a government minister and two opposition
  representatives.
- Tools expected: Negotiation Prep, Stakeholder Map, Mediation Design,
  Talking Points, Dossier, Ask PRAXIS.
- Comment: "I need PRAXIS to explain why it thinks a stakeholder matters, not
  only show a node or label."
- Comment: "Ask PRAXIS should propose changes to the case file, but I need to
  approve them before they become official."
- Next: Conflict Graph v2 and Ask PRAXIS operator mode should use proposed
  graph/source deltas with approve/reject state.

### Persona 3 — Humanitarian Access Analyst

- Task: build an access snapshot for an active field operation.
- Tools expected: Humanitarian, Geospatial Monitor, Early Warning, Documents,
  ReliefWeb/HDX source flows, Export Center.
- Comment: "Show me which feeds are current, stale, failed, or missing for
  this country before giving me a polished summary."
- Comment: "Uploaded assessment PDFs should become cited chunks, not just files
  sitting in a document tab."
- Next: document ingestion trust loop should expose extraction/chunk/citation
  status and propose humanitarian facts for user approval.

### Persona 4 — Think-Tank Analyst

- Task: write a comparative conflict analysis with historical parallels.
- Tools expected: Deep Research Agent, ARGUS, Historical Parallels, Scenario
  Planner, Media Compass, Sources Library.
- Comment: "I need a visible research trail: what was searched, which sources
  were accepted, which claims remain weak."
- Implemented: Sources Library is now a canonical customizable tool and can be
  recommended, hidden, or reordered consistently.
- Next: canonical tool-output envelope should include `retrievalTrace`,
  source quality, assumptions, confidence, and model/provider metadata.

### Persona 5 — Legal/Human Rights Officer

- Task: track alleged violations, legal instruments, accountability paths, and
  commitments over time.
- Tools expected: Human Rights Monitor, Legal & Resolution Tracker, Commitment
  Tracker, Treaty Analysis, Policy Memo.
- Comment: "The difference between reported, corroborated, and legally assessed
  facts has to be explicit."
- Next: graph and tool outputs should distinguish allegation, corroboration,
  assessment, and approved fact status.

## Immediate Implementation Backlog

1. Finish preference propagation across all recommendation surfaces.
   - Status: dashboard/sidebar done; review onboarding and settings entry
     points next.
2. Build dashboard v2 around real work state.
   - Include source coverage, document health, recent changes, running jobs,
     approvals, and role-aware next actions.
3. Define the canonical tool-output envelope.
   - Apply to one high-value tool first, then migrate tool-by-tool.
4. Add proposed knowledge deltas.
   - Start with Conflict Graph and Ask PRAXIS before broad mutation support.
5. Upgrade document ingestion UX.
   - Make extraction/chunk/citation state visible and reusable by tools.

## Claude Code Lane

Claude can safely take the next UX research lane if Codex is working on
dashboard/tool-output code:

```text
You are Claude Code working in tandem with Codex on PRAXIS.

Pull latest main, then read:
- CLAUDE.md
- AGENTS.md
- CHANGELOG.md
- docs/CONTINUATION.md
- docs/PRAXIS_HIGH_IMPACT_PRODUCT_PLAN_2026-04-26.md
- docs/USER_RESEARCH_SYNTHESIS_2026-04-26.md

Own this lane only:
- Landing, login/signup, onboarding, and docs copy.
- Improve the first-run story around profile, situation context, trusted
  sources, documents, and grounded analysis.
- Remove stale source/provider promises from visible public copy.

Do not touch:
- src/lib/auth/auth-context.tsx
- src/components/app/app-sidebar.tsx
- src/components/dashboard/recommended-tools-widget.tsx
- src/lib/navigation/tool-preferences.ts
- backend, cloud functions, infrastructure

Definition of done:
- The app explains why user context and situation context matter.
- Public copy is aligned with Google-native/open-data reality.
- CHANGELOG and CONTINUATION are updated.
- Typecheck/build pass.
- Commit and push to main.
```
