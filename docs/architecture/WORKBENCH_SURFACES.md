# PRAXIS Workbench Surfaces

Last updated: 2026-05-07

This is the canonical app-facing map for the current workbench. The product no longer exposes twelve peer tabs. It exposes four persistent substrate tabs - Context, Library, Ontology, Graph - and seven work chapters mounted on the desk - Desk, Research, Memos, Draft, ACH, Tools, Boardroom.

| Surface | Surface Contract | Primary Data Sources | AI/Subagent Posture | Mutation Discipline | Verification |
|---|---|---|---|---|---|
| Desk | Command center: What Changed, Next Best Actions, Open Questions, Stale Context. | `buildWorkbenchSurfaceState`, open questions API, case activity derivation. | `desk_advisor` remains backend follow-up; current actions are deterministic. | Context weakness is advisory, not blocking. Open questions are owner-scoped. | `tests/e2e/workbench/desk-command-center.spec.ts` |
| Context | Editable scope studio for frame, sources, upload handoff, actors, claims, interests, and questions. | Situation fields, source preferences, local draft, owner-scoped context-scope API. | `policy_scope_reviewer` posture is advisory. | Scope saves use authenticated API and audit entries. Full re-genesis remains review/staging follow-up. | `tests/e2e/workbench/context-scope-studio.spec.ts` |
| Library | Artifact-faceted browser for sources, documents, saved claims, memos, and exports. | Case artifacts, saved-claims API, export manifests. | No generative writes. | Saved claims and exports are owner-scoped; Library is browse/retrieve first. | `tests/e2e/workbench/library-faceted-browse.spec.ts` |
| Research | Source Scout query builder, staged collection plan, candidate browser, non-destructive ingest staging. | Research-state helpers, research route, research-plan route, research-ingest route. | `research_planner` remains backend follow-up; deterministic plan route is live. | Candidate sources stage as `re_genesis` review records; no silent graph writes. | `tests/e2e/workbench/research-source-scout.spec.ts` |
| Ontology | Active ontologies, validator pass-rate, primitive coverage, source affinity, recommended tools. | Ontology registry, case ontology ids, graph primitive counts. | No generative writes. | Add/remove secondary ontology is owner-scoped and graph migrations stay review-gated. | `tests/e2e/workbench/ontology-interactive.spec.ts` |
| Graph | Inspectable graph canvas with primitives, truth layers, provenance, and graph projection. | Workbench case graph builder and case module truth layers. | Empty/thin guidance suggests first actions only. | Graph writes stay behind GraphOps/firewall routes. | `tests/e2e/app-usability-smoke.spec.ts` |
| ACH | Analysis of Competing Hypotheses matrices for competing explanations. | SAT/ACH store and case id. | Empty/thin guidance can suggest starting evidence and tools. | ACH artifacts are case-scoped and do not mutate graph facts silently. | `tests/e2e/app-usability-smoke.spec.ts` |
| Tools | Curated ontology-aware marketplace and run history. | Tool registry, tool contracts, case context. | Tool runs use calibrated/context-aware provider routes. | Tool outputs are persisted as outputs; graph promotion remains review-gated. | `tests/e2e/app-usability-smoke.spec.ts` |
| Memos | Template-driven memo studio for cited work products. | Memo studio state, graph/case context, templates. | Memo Drafter support remains synthesized/advisory. | Memo edits are user-controlled; generated text is labeled and reviewable. | `tests/e2e/app-usability-smoke.spec.ts` |
| Boardroom | Advisor deliberation and synthesis workspace. | Boardroom routes, personas, deliberation artifacts. | Moderator/persona orchestration is advisory and citable. | Synthesis promotion routes to review queue. | `tests/e2e/workbench/boardroom-flow.spec.ts` |
| Draft | Briefing assembly: memo selection, cover page, appendices, redactions, export manifest. | Draft assembly state, selected memos, appendices, export API. | No hidden generation in export. | Export manifest persists under the case; signed C2PA and server binaries remain follow-up. | `tests/e2e/workbench/draft-briefing-assembly.spec.ts` |

## Current Honest Boundaries

- Packs 26-28 now have visible app surfaces and browser-verifiable contract tests.
- The Agent Engine subagents named in the prompts are represented by deterministic app-facing routes or documented follow-up unless already deployed elsewhere.
- Research ingest and ontology changes stage or audit structural changes; they do not silently mutate the graph.
- Draft exports persist manifests today; server-rendered binary storage and signed C2PA credentials remain the next backend hardening slice.
