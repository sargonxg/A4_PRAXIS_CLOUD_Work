# PRAXIS Brainstorming Table + Media Intelligence Uplift

**Date:** 2026-04-26  
**Status:** Execution spec for the strategic-uplift sprint  
**Objective:** Turn PRAXIS from a set of strong individual tools into a situation-centered reasoning workspace where expert agents debate, criticize, cite, and turn their discussion into usable products.

---

## 1. Product Thesis

PRAXIS should behave like an expert policy room around the user's active situation. The user creates context once: role, audience, red lines, situation, actors, sources, documents, and live-feed constraints. Every tool then draws from that same Situation Knowledge Core instead of asking the analyst to rebuild context.

The next high-impact tool is **Brainstorming Table**: a structured, multi-expert deliberation surface. It is not another chat. It is an automatically moderated table where expert personas propose options, critique assumptions, request evidence, and converge into a decision memo with citations.

Primary personas:

- UN political affairs officer preparing options for a mission leadership meeting.
- Mediator designing a multi-party process with spoiler risks.
- Sanctions/legal analyst testing designation theories and legal constraints.
- Humanitarian coordinator balancing access, protection, and neutrality.
- Media/disinformation analyst tracking 24-hour narrative shifts.

---

## 2. Context Architecture

Every run must assemble context in this order:

1. **AnalystProfile:** role, seniority, organization, audience, language, lenses, red lines, citation style.
2. **Situation frame:** name, domain, region, actors, description, active risks, Glasl stage, latest graph summary.
3. **Source frame:** uploaded documents, source URLs, feed coverage, data freshness, unavailable feeds, demo/sample status.
4. **Tool memory:** last outputs for relevant tools, especially risk-monitor, actor-profiles, stakeholder-map, info-environment, legal-tracker, humanitarian, briefing.
5. **Retrieval packet:** SKC graph facts, vector matches, live feed snippets, media roundup snippets, citations.
6. **Run contract:** output schema, expert roles, debate phases, confidence thresholds, citation requirements.

Implementation target:

- Add `src/lib/context/brainstorming-context.ts`.
- Reuse `buildCalibratedContext` and `SituationKnowledgeCore`.
- Return a compact `BrainstormingContextPacket` that can be serialized into prompts and saved for reproducibility.
- Persist every table run under `users/{uid}/situations/{sid}/tools/brainstorming-table/{runId}` or, if the current tool-output shape cannot support nested runs yet, under `tools/brainstorming-table` with a `runs[]` array and a migration note.

---

## 3. Brainstorming Table Tool

Route: `/app/brainstorming-table`  
AI route: `/api/ai/brainstorming-table`  
Tool id: `brainstorming-table`

### Core UX

- Table layout with expert columns and phase rows.
- Phases: framing, proposals, critique, evidence requests, synthesis, decision memo.
- User can pick a use case: negotiation strategy, briefing options, sanctions/legal theory, humanitarian access plan, media response, early-warning action plan.
- User can pin assumptions, lock red lines, and ask for another round.
- Every expert message has citations, confidence, and a "depends on" field.
- Final synthesis exports to Briefing Room, Policy Memo, Report Studio, or Talking Points.

### Expert Roster V1

- Diplomatic Advisor: neutral language, DPPA framing, mediator red lines.
- Conflict Analyst: escalation, actor leverage, risk indicators.
- Humanitarian Coordinator: access, protection, neutrality, operational feasibility.
- Legal/Sanctions Analyst: IHL/IHRL, UNSC/ICC/ICJ, designation constraints.
- Media/Information Analyst: narrative drift, source reliability, influence operations.
- Devil's Advocate: challenges weak evidence, groupthink, missing stakeholders.

### Output Schema

```ts
type BrainstormingTableOutput = {
  runId: string;
  useCase: string;
  contextDigest: string;
  experts: Array<{ id: string; name: string; lens: string; constraints: string[] }>;
  rows: Array<{
    phase: 'framing' | 'proposal' | 'critique' | 'evidence_request' | 'synthesis';
    expertId: string;
    claim: string;
    rationale: string;
    confidence: 'high' | 'medium' | 'low';
    citations: Array<{ label: string; url?: string; sourceType: string }>;
    dependsOn?: string[];
  }>;
  synthesis: {
    consensus: string[];
    liveDisagreements: string[];
    recommendedOption: string;
    risks: string[];
    nextActions: string[];
    exportTargets: Array<'briefing' | 'policy-memo' | 'report' | 'talking-points'>;
  };
};
```

---

## 4. Media Intelligence Uplift

The media tools need to become a real daily intelligence lane, not disconnected research cards.

### Media Scanner

Tool id: `media-scanner` or upgrade existing `media-compass` / `media-roundup` without adding a new route if registry consolidation is preferred.

Capabilities:

- User defines keyword bundles per situation: actors, places, issues, languages, red-line terms.
- Google advanced search query builder with operators: exact phrase, site filters, date window, language, region, source type.
- 24-hour, 72-hour, 7-day windows.
- Source reliability scoring and duplicate clustering.
- Narrative cluster labels stable across refreshes.
- Every cluster links back to raw search results and saved sources.

### 24-Hour Media Roundup

Upgrade `media-roundup`:

- Inputs: user keywords, situation actors, graph aliases, selected languages, source whitelist/blocklist.
- Retrieval: grounded Google Search first, GDELT second, user-saved sources third.
- Output: top developments, narrative shifts, framing comparison, emerging misinformation risks, under-covered events, recommended monitoring queries.
- Persistence: `tools/media-roundup` with `windowStart`, `windowEnd`, `queryPlan`, `clusters`, `citations`.
- Delivery: optional Daily Brief inclusion.

---

## 5. Implementation TODO

- [ ] `registry:` add `brainstorming-table` to `tool-registry` with route, category, framework, data sources, and methodology.
- [ ] `context:` add `BrainstormingContextPacket` builder on top of `buildCalibratedContext`.
- [ ] `api:` add `/api/ai/brainstorming-table` using `withCalibration('brainstorming-table', 'ai_deep_think')`.
- [ ] `ui:` build `/app/app/brainstorming-table/page.tsx` with phase rows, expert columns, source pills, confidence badges, and export buttons.
- [ ] `persistence:` save run output to `tools/brainstorming-table` and add reload/resume.
- [ ] `tests:` add schema unit tests, route audit coverage, and a component smoke test.
- [ ] `media:` add keyword bundle settings per situation.
- [x] `media:` add Google advanced search query builder helper with tests.
- [ ] `media:` upgrade `media-roundup` prompt and schema around query plans, clusters, and citations.
- [ ] `docs:` add tool docs under `docs/tools/brainstorming-table.md` and refresh `docs/tools/media-roundup.md`.

---

## 6. Acceptance Criteria

- A new user can create a situation, run Brainstorming Table, and receive a cited multi-expert table in under 90 seconds on a demo/small situation.
- The table uses AnalystProfile audience, red lines, lenses, and language.
- At least six expert voices produce distinct, non-duplicative contributions.
- The synthesis names consensus, disagreement, evidence gaps, and next actions.
- No sample media events or sample claims appear in authenticated mode without an explicit sample label.
- Media Roundup can run from user-defined keywords and returns a reproducible query plan.
- Outputs persist and reload after navigation.
- `npx tsc --noEmit`, `npm run build`, `node scripts/audit-ai-routes.mjs`, and relevant Vitest tests pass before deployment.
