# Pack 20 Dynamic Ontologies Pass

Date: 2026-05-07
Repo: `C:\Users\giuli\praxiscodexworking`
Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`
Source prompt: `docs/codex-prompts/PRAXIS_CODEX_20_DYNAMIC_ONTOLOGIES.md`

## Executive Summary

Pack 20 is a v1.1 dynamic-ontology expansion pack. Its stated preconditions are
not fully true yet because Pack 18 is still not closed under the strict launch
contract and v1.0.0 is not tagged. This pass therefore implements the safe
foundation slice that does not weaken the eight-primitive substrate: five new
ontology lenses, role-aware ontology suggestions, optional multi-ontology case
fields, backend mirrors for the new lenses, audit coverage, and an ADR. The
second pass wires the lenses into real situation creation and adds a repeatable
ontology classifier accuracy gate.

## Implemented In This Pass

| Pack 20 item | Status | Evidence |
|---|---|---|
| Prompt preservation | CLOSED | `docs/codex-prompts/PRAXIS_CODEX_20_DYNAMIC_ONTOLOGIES.md`, `scripts/audit-codex-prompts.ts` |
| Five new ontology lenses | CLOSED foundation | `src/lib/ontology/{human-rights,economic,humanitarian,legal,security}/index.ts` |
| OntologyId union extended to 9 ids | CLOSED | `src/lib/ontology/types.ts` |
| Registry returns 9 ontology definitions | CLOSED | `src/lib/ontology/registry.ts`, `npm run audit:ontology-mapping` |
| Backend mirrors for new lenses | CLOSED foundation | `backend/ontology/*.py`, `scripts/audit-ontology-mapping.ts` |
| Role taxonomy extension | CLOSED foundation | `src/types/context.ts`, `backend/services/context_layers.py`, `src/types/situation.ts` |
| Optional multi-ontology case fields | CLOSED foundation | `CaseContext.ontologyIds`, `CaseContext.primaryOntologyId` |
| Profession-aware suggestion helper | CLOSED | `src/lib/ontology/suggestions.ts`, `tests/unit/lib/ontology/suggestions.test.ts` |
| Situation creation ontology picker | CLOSED | `src/app/app/situations/new/page.tsx` persists `ontologyIds`, `primaryOntologyId`, and override posture |
| API ontology persistence | CLOSED | `src/app/api/situations/route.ts`, `src/lib/firebase/situations.ts`, `src/types/situation.ts` |
| Advisory ontology classifier baseline | CLOSED foundation | `src/lib/ontology/classifier.ts`, `/api/situations/classify-domain`, `tests/fixtures/ontology-classifier/cases.json` |
| Classifier accuracy audit | CLOSED foundation | `npm run audit:ontology-classifier-accuracy`, included in `audit:gate` |
| ADR | CLOSED foundation | `docs/adr/0030-dynamic-ontology-lenses.md` |

## Current Ontology Set

1. `conflict`
2. `mediation`
3. `governance`
4. `narrative`
5. `human-rights`
6. `economic`
7. `humanitarian`
8. `legal`
9. `security`

Each ontology maps node subtypes onto the same eight ACO primitives: Actor,
Claim, Interest, Constraint, Leverage, Commitment, Event, and Narrative.

## Role-Aware Defaults

The first foundation mapping is deterministic and advisory:

| Role | Suggested ontologies |
|---|---|
| `diplomat` | `conflict`, `governance`, `narrative` |
| `mediator` | `mediation`, `conflict` |
| `analyst` | `conflict`, `narrative` |
| `researcher` | `narrative`, `conflict` |
| `policy_advisor` | `governance`, `conflict` |
| `human_rights_officer` | `human-rights`, `legal` |
| `sanctions_analyst` | `economic`, `governance` |
| `humanitarian_coordinator` | `humanitarian`, `conflict` |
| `treaty_lawyer` | `legal`, `governance` |
| `defense_analyst` | `security`, `conflict` |
| `other` | `conflict` |

Selections are normalized to at most three ontology ids. The first id is the
primary ontology. The `/app/situations/new` wizard now exposes these as
selectable ontology lenses in the actor/role step, shows the selected primary
lens during review, and sends the bounded list to `/api/situations` for
Firestore persistence.

## Advisory Classifier Baseline

The Pack 20 prompt asks for Gemini cheap-classify ontology routing with an
accuracy gate. The current implementation is deliberately advisory and
deterministic: `classifyOntologySignals()` scores case text, source URLs, and
the user role against ontology-specific signal terms. It never blocks case
creation. The legacy domain classifier route now returns both domain fields and
ontology recommendation fields so the wizard can update the lenses when the
user has not manually overridden them.

This is not yet the final Gemini-backed classifier. It is a green local guard
that prevents regression while the production Situation Genesis path and
review queue mature.

## Verification

- `npm run audit:ontology-mapping` passed for 9 ontologies.
- `npm run audit:ontology-versions` passed for 9 ontologies.
- `npm run audit:ontology-classifier-accuracy` passed 10/10 fixture cases.
- `npm run audit:context-types-parity` passed.
- `npm run audit:codex-prompts` passed with Pack 20 included.
- `npm run typecheck` passed.
- `npm run audit:tool-marketplace` passed for the existing 22 curated tools.
- `npx vitest run tests/unit/lib/ontology/registry.test.ts tests/unit/lib/ontology/suggestions.test.ts` passed.
- `npx vitest run tests/unit/lib/ontology/suggestions.test.ts tests/unit/lib/ontology/classifier.test.ts` passed.
- Scoped ESLint passed for the situation wizard, situation API routes, ontology classifier, suggestion helper, and classifier audit script.
- Python compile passed for `backend/ontology/*.py` and `backend/services/context_layers.py`.

## Remaining Pack 20 Work

These items are not marked complete in this foundation pass:

- Full multi-ontology write-path enforcement in the firewall and ContextProvider.
- Ingestion-driven ontology suggestion advisories and review-queue integration.
- Gemini cheap-classify ontology classifier with the full 50-case eval set.
- Sample situations for the five new ontologies.
- Visual snapshot tests for every new ontology in the workbench ontology tab.
- ADR 0031 and ADR 0032 if/when the later classifier and multi-ontology runtime
  semantics are fully implemented.

## Next Slice

The next implementation slice should add sample situations and visual snapshots
for the five new lenses, while keeping classifier-based routing advisory until
Pack 19 Situation Genesis and Pack 18 review-queue gaps are closed.
