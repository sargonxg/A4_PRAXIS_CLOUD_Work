# PRAXIS Tool Improvement Roadmap

**Date:** 2026-04-21
**Owner:** platform
**Status:** Living document

## Overview

40 tools across 6 categories. Five delivery phases. Phase 1 is the foundation-hardening spec dated 2026-04-21; subsequent phases stand on the same `ContextBlock`, `preferences`, and advisor infrastructure shipped there.

Every phase enforces the same cross-cutting pattern (see §Cross-cutting Work below): `withCalibration` wrapper, `useSituationGuard()` + `<NoSituationState />`, `<ToolPageShell>`, methodology README, smoke test, preferences honoured, at least one advisor voice consulted where relevant.

## Phase 1 — Foundation (2026-04-21 to 2026-05-02) ✅

Six flagship tools. Tracked by this spec's sister plan, `2026-04-21-foundation-hardening.md`.

| Tool | Category | Purpose | Current | Target | Effort | Dependencies | Risks |
|---|---|---|---|---|---|---|---|
| Dashboard | Context | Overview | 2/5 | 4/5 | M | preferences, interaction frame | widget failure cascade |
| Conflict Graph | Context | Navigable ACO graph | 3/5 | 5/5 | L | ACO v2 pipeline output | layout perf at >500 nodes |
| Timeline | Context | Chronological view | 2/5 | 4/5 | M | episodes schema stable | noisy feed events |
| Stakeholder Map | Analysis | MAW salience | 2/5 | 4/5 | M | graph, actor profiles | sparse edges → low scores |
| Early-Warning | Analysis | Glasl + triggers | 3/5 | 5/5 | M | feed layer | stage mis-classification |
| Info Environment | Intelligence | Narrative battlefield | 2/5 | 4/5 | L | GDELT + grounded search | cluster labelling drift |

## Phase 2 — Drafting (2026-05-05 to 2026-05-23)

Seven tools. Lean on Takeda voice for diplomatic drafting. Every tool honours `preferences.citationStyle`, `preferences.defaultReportLength`, `preferences.defaultLanguage`.

| Tool | Purpose | Target | Effort |
|---|---|---|---|
| Assistant | Situation-aware Q&A | Use advisor memory + preferences | S |
| Report Studio | Long-form report drafting | Integrate Takeda voice + citation styles | M |
| Dossier | Actor/situation dossier | Multi-section structured output | M |
| Talking Points | Short briefing points | Brief always; audience-tuned | S |
| Briefing Room | Meeting-prep pack | Generates agenda + TPs + background | M |
| Daily Brief | Daily scheduled brief | Cron + `preferences.defaultTimeHorizon` | M |
| UN Toolkit | UN-specific drafting templates | Treaty text, SG letters | M |

## Phase 3 — Simulation (2026-05-26 to 2026-06-13)

Five tools. Voices: Adeyemi + Reyes. Heavy use of `getDeepThinkModel('high')`.

| Tool | Purpose | Target | Effort |
|---|---|---|---|
| Scenarios | Branching futures | 3-horizon model with probabilities | L |
| Negotiation Prep | BATNA/ZOPA prep | Fisher-Ury structured output | M |
| Game Theory | Payoff-matrix analysis | Deep Think model + explainer | L |
| CONCORDIA | Multi-party mediation sim | Agent-based per-party simulation | L |
| Mediation Designer | Process-design template | Berghof-style frameworks | M |

## Phase 4 — Intelligence (2026-06-16 to 2026-07-11)

Ten tools. Voices: Vanderberg for sanctions + finance; all four for Deep Research synthesis.

| Tool | Purpose | Target | Effort |
|---|---|---|---|
| Deep Research Agent | Vertex ADK agent | Restore live + fallback path hardened | L |
| ARGUS | Feed triage | Prioritised alert queue | M |
| Media Compass | Media bias orientation | Cluster ownership map | M |
| Media Roundup | Digest | Scheduled + calibrated | S |
| Geospatial | Map view of events | Clustered events + heat | M |
| Sanctions | Sanctions scan | Network-of-designations viewer | M |
| Commitments | Commitment tracker | Dated promise ledger | M |
| Treaty | Treaty analyser | Parallel translation + clause diff | L |
| Alert Center | Consolidated alerts | Source × severity × actor matrix | M |
| Deep Research | Long research report | Multi-step planning + citations | L |

## Phase 5 — Workspace (2026-07-14 to 2026-08-01)

Four tools. RBAC groundwork (Part 4 spec).

| Tool | Purpose | Target | Effort |
|---|---|---|---|
| Cases | Situation bundle | Multiple situations grouped into a case | M |
| Team | Team workspace | Part 4 RBAC | L |
| Advisory | Advisor panel | Cross-advisor synthesis improvements | M |
| Settings | All user knobs | Align all settings UI under one shell | S |

## Additional scope (not tracked in the 40)

From the foundation-hardening gap analysis, four capability spikes are candidates for dedicated specs once Phase 1 ships:

| Spike | Motivation |
|---|---|
| Wikipedia enrichment | User-requested; bridges actor profiles + grounded search with a reliable entity backbone |
| Deep Search Agent upgrade | Vertex ADK is currently degraded; needs fallback hardening + citation rigour |
| Graph-creation AI upgrades | Users want AI-assisted entity/relationship suggestions during graph editing |
| Global search experience | One-shot search across situations, tools, episodes, and feeds |

Each deserves a brainstorming session + spec before implementation.

## Cross-cutting Work

Every phase adds:

- Smoke test per tool (in `tests/tools/<tool>.smoke.test.ts`).
- README per tool (purpose, methodology, inputs, outputs, frameworks) at `src/app/app/<tool>/README.md`.
- `npm run audit:routes` stays green — every AI route in `src/app/api/ai/` must be wrapped in `withCalibration` or explicitly exempt.
- Preferences honoured: `citationStyle`, `defaultReportLength`, `defaultLanguage`, `confidenceLabelling`, `defaultTimeHorizon`.
- At least one advisor voice consulted where relevant (picker integration).
- `<ToolPageShell>` wrapping so onboarding gate + situation guard + error boundary behave uniformly.

## Risks

- **ACO v2 pipeline drift** breaking Conflict Graph or Stakeholder Map → mitigated by contract tests between the Python pipeline output and the frontend graph schema.
- **Advisor cost creep** as memory and briefing prefetch per-turn costs compound → mitigated by the 5-minute advisor-config cache, rolling summary, and `memoryPolicy.lastTurns` cap. Monitor via `audit:routes` + BigQuery credit-transaction table.
- **User demand for retired personas** after collapsing 10 → 4 advisors → mitigated by the live admin editor at `/app/admin/advisors`: re-introduce on demand as new ids.
- **Preferences fragmentation** if tools bypass the `<preferences>` system-prompt block → mitigated by `audit:routes` guard and the XML-parity live preview in settings.
- **Cron sprawl** as each tool adds refresh endpoints → mitigated by a single `early-warning-refresh` flag pattern: cron marks, user re-fetches on mount under their own credit budget.

## Sequencing notes

- Advisory Council must ship before Phase 2 (Drafting needs Takeda; Phase 3 needs Adeyemi/Reyes) — Phase 1 delivers it.
- Preferences must ship before Phase 2 (citation style / length / language fan out to every drafting tool) — Phase 1 delivers it.
- Salience engine must ship before Phase 2's Dossier (actor-priority ordering in auto-drafted dossier sections) — Phase 1 delivers it.
