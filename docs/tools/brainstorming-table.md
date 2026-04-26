# Brainstorming Table

## Status

**PLANNED / NEW** — strategic-uplift tool spec. Implementation target:
Sprint 2-3 after the context packet and tool-id persistence cleanup.

## Route

- App route: `/app/brainstorming-table`
- API route: `/api/ai/brainstorming-table`
- Tool id: `brainstorming-table`
- Primary spec:
  `docs/superpowers/specs/2026-04-26-brainstorming-table-media-intelligence-plan.md`

## Inputs

- `AnalystProfile`: role, audience, language, lenses, red lines, mandate.
- Active `Situation`: name, region, domain, actors, description, risk state.
- Situation Knowledge Core: graph facts, vector retrieval, saved tool outputs,
  uploaded documents, live-feed snippets, media clusters.
- User prompt: use case, decision question, constraints, desired output target.

## Outputs

Persist under the active situation:

```text
users/{uid}/situations/{sid}/tools/brainstorming-table
```

The persisted output should contain `runId`, `useCase`, `contextDigest`,
expert roster, phase rows, citations, confidence levels, consensus,
disagreements, risks, next actions, and export targets.

## Frameworks & Data Sources

- UN DPPA briefing discipline
- Fisher-Ury interests / BATNA / ZOPA
- Glasl escalation model
- Mitchell-Agle-Wood salience
- IHL / IHRL / sanctions screening where relevant
- GDELT, UCDP, ReliefWeb, HDX, UN News, World Bank, grounded Google Search,
  uploaded documents, saved situation sources

## Expert Roster

- Diplomatic Advisor
- Conflict Analyst
- Humanitarian Coordinator
- Legal/Sanctions Analyst
- Media/Information Analyst
- Devil's Advocate

## UX Requirements

- Table view: expert columns, phase rows.
- Every contribution shows confidence and citations.
- The user can pin assumptions and ask for another round.
- Synthesis names consensus, disagreement, weak evidence, and next actions.
- Export to Briefing Room, Policy Memo, Report Studio, or Talking Points.
- Mobile view collapses to one expert card per row with tabs for phases.

## Acceptance

- No uncited factual claims in the final synthesis.
- AnalystProfile audience and red lines visibly affect the output.
- Output reloads after navigation.
- Demo/sample content is labelled.
- `audit-ai-routes` recognizes the route as calibrated.
