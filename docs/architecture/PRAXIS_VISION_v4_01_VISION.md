# PRAXIS Vision v4 - Product Vision

Status: canonical product direction for the v5 MVP build
Date adopted: 2026-05-10
Source: `docs/build/PRAXIS_v5_BUILD_01_AGENT_OPERATING_GUIDE.md`

This document records the product-facing v4 vision references required by the
v5 build pack. The original standalone v4 vision files were not present in this
checkout when Phase 0 began, so this file preserves the repo-local canonical
product direction from the authoritative v5 operating guide.

## Product Definition

PRAXIS is a vertical AI workbench for policy, conflict, mediation, and
political work. The v5 MVP must be shippable on top of the existing
`praxis.tacitus.me` app in project `praxisbytacitus`, region `us-central1`.

The MVP should produce a credible "this is great" reaction within five minutes
of a new visitor reaching the public product path. That first wow moment comes
from showing a serious policy analyst workflow: open a context, ask PRAXIS,
inspect grounded sources and graph structure, run a method, and produce a
usable draft.

## Locked MVP Personas

The MVP demonstrates three buyer markets through three personas and demo
Contexts:

| Persona | Demo Context | Work Ontology | Buyer Reach |
|---|---|---|---|
| Foreign Policy Analyst | Indo-Pacific Strategic Competition 2026 | Foreign Policy Research | think tanks, foreign correspondents, government-affairs, foreign ministries |
| Domestic Policy Analyst | AI Regulation 2026 - US Federal & State Landscape | Domestic Policy Analysis | domestic think tanks, advocacy, legislative staff, civic-tech |
| Corporate Strategic Analyst (Public Affairs + Sustainability) | Food & Beverage Regulatory & Sustainability Outlook 2026 | Corporate Strategic Analysis | multinationals, sustainability consultancies, government-affairs firms |

## MVP Cuts

The MVP is intentionally smaller than the broader architecture:

- 3 domain ontologies active: Conflict, Mediation, Humanitarian.
- 3 work ontologies active: Foreign Policy Research, Domestic Policy Analysis,
  Corporate Strategic Analysis.
- 10 surfaced MVP Methods; retained legacy tools stay available behind the
  broader registry and archive surfaces.
- 5 drafting templates.
- 2 deployed MVP subagents: Memo Drafter and Output Refiner.
- 1 canonical graph with Evidence and Analytical layers.
- Cognee, Graphiti, CozoDB, Firecrawl, and Parallel AI stay deferred.
- Research pipeline is simplified to Google Grounded Search plus Wikidata
  SPARQL.
- Compare User Models and dedicated mobile shell are deferred.

## Product Bar

The product must stay honest about live versus staged capability. Demo and
cached content can support the wow arc, but labels and trust posture must make
clear what is live, cached, staged, or deferred.
