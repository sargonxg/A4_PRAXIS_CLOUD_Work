# 0038 - Two-Context Product Model On Dual Ontology Layer

## Status

Proposed

## Context

PRAXIS has historically centered on situations/cases and domain ontology
lenses. The v5 MVP adds an explicit work-context layer: what the analyst is
trying to do, who the audience is, which constraints shape the work, and which
decisions the output supports.

## Decision

Adopt a two-context product model:

- Situation Context: what is happening in the world, typed by domain
  ontologies.
- Work Context: what the user is trying to produce, typed by work ontologies.

The ontology layer is dual:

- Domain ontologies map world facts to the eight ACO primitives.
- Work ontologies map analyst process, audience, constraints, and outputs to
  the same substrate without adding a ninth primitive.

## Persona Decision (2026-05-10)

The v5 MVP locks three personas, three demo Contexts, and three work
ontologies:

| Persona | Demo Context | Work Ontology |
|---|---|---|
| Foreign Policy Analyst | Indo-Pacific Strategic Competition 2026 | Foreign Policy Research |
| Domestic Policy Analyst | AI Regulation 2026 - US Federal & State Landscape | Domestic Policy Analysis |
| Corporate Strategic Analyst (Public Affairs + Sustainability) | Food & Beverage Regulatory & Sustainability Outlook 2026 | Corporate Strategic Analysis |

Why these three together: they demonstrate distinct buyer markets while
sharing the same PRAXIS substrate. The foreign-policy path proves geopolitical
analysis, the domestic-policy path proves legislative/regulatory analysis, and
the corporate strategic path proves public-affairs and sustainability analysis.

## Consequences

- Context pages must show both world-state and work-process structure.
- Methods receive richer ContextSnapshots without reading stores directly.
- Work ontologies become a Phase 1 dependency for later user-model, methods,
  and drafting work.

## Alternatives Considered

- Keep only situation/domain context. This hides the user's actual job and
  weakens drafting quality.
- Make work ontologies separate from ACO. This fragments the graph model.
- Add more than three work ontologies in MVP. This expands scope beyond the
  v5 build plan.

## References

- `docs/architecture/PRAXIS_ARCHITECTURE.md`
- `docs/architecture/PRAXIS_VISION_v4_01_VISION.md`
- `docs/architecture/PRAXIS_VISION_v4_02_ARCHITECTURE.md`
- `docs/build/PRAXIS_v5_BUILD_01_AGENT_OPERATING_GUIDE.md`
