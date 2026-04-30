# PRAXIS Tool Operating System - 2026-04-30

## Objective

Every PRAXIS tool should behave like a purposeful micro-app, not a disconnected
button. A professional user should understand:

- why the tool exists;
- what decision or workflow it supports;
- what situation and user context it reads;
- what questions it must ask before generating;
- what output it creates;
- how Ask PRAXIS can explain, challenge, correct, or rewrite that output;
- where the result is saved and how later tools can reuse it.

## Implemented foundation

This wave adds a central operating contract layer:

- `src/lib/tools/tool-operating-contracts.ts`
  - one computed contract for every registered tool;
  - category defaults for context, analysis, intelligence, drafting,
    simulation, and workspace tools;
  - explicit overrides for flagship tools such as Dashboard, Conflict Graph,
    Timeline, Stakeholder Map, Early Warning, Geospatial Monitor, Policy Memo,
    Talking Points, UN Toolkit, Legal Tracker, Treaty Analyzer, ARGUS, Deep
    Search Agent, Sources Library, Documents, Settings, Team, and Advisory.
- `src/components/praxis/tool-operating-contract-panel.tsx`
  - reusable UI panel showing objective, questions, outputs, product mode,
    Ask PRAXIS actions, situation inputs, and quality bar.
- `src/components/praxis/tool-info-from-registry.tsx`
  - now renders both the registry methodology panel and the operating contract
    panel for pages using `RegistryToolInfo`.
- `src/app/api/tools/contracts/route.ts`
  - metadata API for retrieving all tool contracts or a single tool contract.
- `scripts/audit-tool-contracts.ts`
  - writes `docs/audits/tool-contracts-YYYY-MM-DD.md` and checks route/page,
    objective, questions, outputs, Ask PRAXIS editability, and quality bar.
- Ask PRAXIS chat route
  - accepts `currentToolId` and `currentPath`;
  - injects the active tool operating contract into the system prompt;
  - instructs the assistant to ask missing required questions and then use
    `writeToTool` for structured corrections when appropriate.
- Floating Ask PRAXIS
  - maps current UI paths to tool ids and sends that context to chat.
- `src/lib/tools/tool-path-taxonomy.ts`
  - codifies the generic PRAXIS core plus the ten policy workflow paths;
  - marks the current implementation focus as `generic-core` +
    `political-officer` / Conflict Political Analyst;
  - assigns tools by core, primary, secondary, specialized, premium-future, and
    hidden-default tiers;
  - gives the dashboard/sidebar recommendation system a path-aware ranking
    layer while preserving future paths for economic, human-rights, media,
    legal, humanitarian, stabilization, and governance workflows.
- `src/lib/tools/tool-context-blueprints.ts`
  - computes the required context layers for every tool;
  - declares canonical database paths, version history, graph proposal path,
    source/document corpus paths, and audit trail target;
  - marks each tool's current graph-backbone mode and future Dialectica role;
  - declares evidence/degraded-state policy and document-production /
    LibreOffice readiness.
- `scripts/generate-tool-docs.ts`
  - generates `docs/tools/generated/{toolId}.md` for all registered tools from
    the live registry, operating contracts, path taxonomy, and context
    blueprints.

## Product standard for each tool

Each tool must satisfy this standard before being considered production-grade:

1. Purpose: the user can tell what decision or workflow the tool supports.
2. Inputs: the tool declares situation fields, user profile fields, and source
   classes it needs.
3. Required questions: if critical context is missing, the tool asks before
   generating instead of guessing.
4. Method: the tool applies a named framework or explicit reasoning method.
5. Output: the result is interesting and useful: map, graph, scorecard,
   table, timeline, feed, draft, brief, or workspace state.
6. Provenance: the result distinguishes evidence, inference, confidence, and
   gaps.
7. Persistence: generated output is saved to canonical `tool-data/{toolId}`
   and compatibility `tools/{toolId}` where relevant.
8. Ask PRAXIS integration: users can ask "this stakeholder is wrong" or
   "move this event earlier" and the assistant has enough contract context to
   write a structured correction.
9. Applicability: core tools are always visible; specialized tools remain
   visible but can be visually secondary or recommended only for relevant
   domains.
10. Maintainability: routes, schemas, UI, docs, tests, and audit metadata are
    structured so future sprints can improve one tool without breaking others.

## Next sprint lanes

### Lane 0 - Active path focus

Work only on the generic core plus conflict/political analyst path until the
core loop is excellent. Future paths are codified, but should not distract
implementation until the generic/political tools generate useful, saved,
source-aware outputs.

Active path tools:

- Generic core: Dashboard, Executive Intelligence, Ask PRAXIS, Sources Library,
  Documents, Conflict Graph, Timeline, Briefing, Report Studio, Deep Search.
- Conflict/political primary: Early Warning, Risk Monitor, Actor Profiles,
  Stakeholder Map, Geospatial Monitor, Commitment Tracker, Info Environment,
  Media Roundup, ARGUS, Deep Search Agent, Policy Memo, Talking Points, Dossier.
- Conflict/political secondary: Scenarios, Historical Parallels, Game Theory,
  Power Map, External Actors, Legal Tracker, Human Rights, Sanctions, Treaty
  Analyzer, UN Toolkit, Mediation Design, Negotiation Prep, Economic Impact.

### Lane A - Contract adoption on pages

Apply `RegistryToolInfo` or `ToolOperatingContractPanel` to every tool page that
does not yet use `ToolPageShell`.

Acceptance:

- all sidebar tools show operating contract UI;
- no page has a vague or missing purpose statement;
- browser smoke confirms panels do not overlap or break mobile layout.

### Lane B - Generation baseline

For every AI-backed tool:

- route uses `withCalibration`;
- request schema accepts `situationId`, embedded `situation`, and user intent;
- route builds situation, graph, corpus, and web-grounded context through a
  shared helper;
- output is schema validated;
- output saves with `saveToolOutput`;
- failure path returns useful confidence/gap notes.

### Lane C - Ask PRAXIS writeback

Create typed writeback adapters per output family:

- graph patches: add/update/delete node and edge;
- timeline patches: add/update/order events;
- draft patches: rewrite section, tone, audience, red lines;
- scorecard patches: change assumption, recalculate rationale;
- source patches: add source, rate credibility, attach source to claim.

### Lane D - Tool folder architecture

Move new or heavily refactored tools toward a consistent folder structure:

```text
src/features/tools/{toolId}/
  contract.ts
  schema.ts
  server.ts
  page-client.tsx
  components/
  tests/
```

Do not mass-move existing files in one sprint. Use this structure when a tool
is being substantively upgraded.

### Lane E - Professional applicability

Use situation type, domain, workflow path, and analyst profile to mark tools as:

- core;
- recommended;
- specialized;
- operator/admin.

This should affect sidebar visual weight and "For you" recommendations without
hiding useful capabilities from advanced users.

## Verification commands

```powershell
npm run audit:tool-contracts
npm run generate:tool-docs
npm run generate:tool-backlog
npm run audit:tools
npm run audit:routes
npx tsc --noEmit
npx vitest run tests/unit/lib/tools/tool-operating-contracts.test.ts
```
