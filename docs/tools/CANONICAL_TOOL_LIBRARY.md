# Canonical PRAXIS Tool Library

This document is generated from the code-backed tool registries. Do not hand-edit the tool inventory here; update the registry and rerun `npm run generate:canonical-tool-library`.

## Summary

- Total tools: 12
- Default visible tools: 12
- Archived or specialist tools: 0
- Tools with route/API wiring: 12

## Source Of Truth

- `src/lib/tools/contract.ts`
- `src/lib/tools/canonical.ts`

## Tool Entries

### Ask PRAXIS

- ID: `ask-praxis`
- Short label: Ask PRAXIS
- Surface: hero
- API route: `/api/ai/ask-praxis`
- UI target: inline
- Required cores: `user`, `situation`
- Output: text
- Model tier: flash
- Credits: 1
- Frameworks: Professional editorial standards, Fisher-Ury principled negotiation, Context injection
- Limits: It is a command plane, not an automatic mutation engine. Tool runs and graph updates remain confirmation-gated.

Ask PRAXIS answers from the attached User Core and Situation Core, then routes the next step to writing, research, graph repair, or a specialist policy tool. It should explain the basis for the answer, show gaps, and propose actions before writing into the workspace.

### Context Builder

- ID: `context-builder`
- Short label: Context
- Surface: hero
- API route: `/api/situations/classify-domain`
- UI target: workbench
- Required cores: `situation`
- Output: structured
- Model tier: flash
- Credits: 0
- Frameworks: Situation context health, Policy workflow pathing, ACO Conflict Grammar
- Limits: It strengthens the case file but does not replace expert source judgment or full graph review.

Context Builder is the intake and repair gate. It checks whether the situation has enough scope, actors, sources, mission framing, assumptions, and graph structure before heavier AI work runs.

### Grounded Research

- ID: `grounded-research`
- Short label: Research
- Surface: hero
- API route: `/api/ai/source-scout`
- UI target: workbench
- Required cores: `situation`, `source`
- Output: structured
- Model tier: pro
- Credits: 3
- Frameworks: Source triangulation, Reliability tiers, OSINT source hierarchy
- Limits: Fresh web coverage depends on provider availability and the specificity of the situation frame.

Grounded Research proposes defensible sources ranked by recency, diversity, and reliability. It checks the situation corpus first to avoid duplicates, then returns a search plan, source receipts, and gaps still missing from the Source Graph.

### Stakeholder Map

- ID: `stakeholder-map`
- Short label: Stakeholders
- Surface: hero
- API route: `/api/ai/stakeholder-map`
- UI target: workbench
- Required cores: `situation`
- Output: structured
- Model tier: pro
- Credits: 3
- Frameworks: Mitchell-Agle-Wood stakeholder theory, Barnett-Duvall power taxonomy, Lederach peacebuilding pyramid
- Limits: Actor salience is only as strong as the Situation Core and source coverage.

Stakeholder Map visualizes alliances, adversarial dyads, third-party postures, power, legitimacy, urgency, leverage, and Track I/II/III positions so the analyst can see who matters and why.

### Position vs Interest

- ID: `position-vs-interest`
- Short label: Positions
- Surface: hero
- API route: `/api/ai/negotiation`
- UI target: workbench
- Required cores: `situation`
- Output: structured
- Model tier: pro
- Credits: 3
- Frameworks: Fisher-Ury principled negotiation, Harvard PON BATNA analysis, Lax-Sebenius 3D negotiation
- Limits: It should be rerun when actor incentives or mandates change.

Position vs Interest separates stated positions from underlying needs, constraints, red lines, BATNAs, and possible issue bundles. It helps PRAXIS move from actor description to negotiation strategy.

### Scenario Projector

- ID: `scenario-projector`
- Short label: Scenarios
- Surface: hero
- API route: `/api/ai/scenario`
- UI target: workbench
- Required cores: `situation`, `time`
- Output: structured
- Model tier: deep
- Credits: 2
- Frameworks: Glasl escalation model, Structured uncertainty matrix, Zartman ripeness theory
- Limits: Scenario probabilities are structured judgments, not forecasts with statistical certainty.

Scenario Projector identifies uncertain high-impact drivers, projects best/likely/worst trajectories, and names indicators that would move probability. It keeps time horizon and warning signals explicit.

### Analysis of Competing Hypotheses

- ID: `ach`
- Short label: ACH
- Surface: hero
- API route: `/api/sats/ach`
- UI target: workbench
- Required cores: `situation`, `source`
- Output: structured
- Model tier: flash
- Credits: 0
- Frameworks: Heuer ACH, Structured analytic techniques, Evidence diagnostics
- Limits: The matrix is only useful when hypotheses are meaningfully distinct and evidence is attached.

ACH compares hypotheses against evidence, forcing disconfirming evidence and weak assumptions into view. It is the default PRAXIS method when a core judgment may be overfit to a single narrative.

### Contradiction Finder

- ID: `contradiction-finder`
- Short label: Contradict
- Surface: hero
- API route: `/api/ai/red-team-review`
- UI target: workbench
- Required cores: `situation`, `source`
- Output: structured
- Model tier: pro
- Credits: 3
- Frameworks: Heuer SAT, Devil’s advocacy, ICD 203 probability language
- Limits: It critiques reasoning quality; it does not independently verify every cited source.

Contradiction Finder reviews a claim, memo, or tool output for unstated assumptions, source diversity issues, motivated reasoning, missing intelligence, and evidence that would change the conclusion.

### Frame Narrative

- ID: `frame-narrative`
- Short label: Narrative
- Surface: hero
- API route: `/api/ai/info-environment`
- UI target: writer
- Required cores: `situation`
- Output: text
- Model tier: pro
- Credits: 3
- Frameworks: NATO STRATCOM taxonomy, 4D influence framework, web media tone tone analysis
- Limits: Narrative reads need fresh media/source coverage and should be caveated by language and platform gaps.

Frame Narrative explains how actors describe the situation, which frames are gaining traction, where legitimacy claims diverge, and how a memo or briefing should avoid adopting an unexamined frame.

### Coalition Detector

- ID: `coalition-detector`
- Short label: Coalitions
- Surface: hero
- API route: `/api/ai/power-map`
- UI target: workbench
- Required cores: `situation`
- Output: graph_delta
- Model tier: pro
- Credits: 3
- Frameworks: Social network analysis, Power mapping, Brokerage and alignment analysis
- Limits: Coalition inferences should be reviewed before mutating the canonical graph.

Coalition Detector looks for clusters, brokers, dependencies, patrons, and likely alignment shifts. It turns the Situation Core into testable graph proposals rather than just prose about relationships.

### Commitment Tracker

- ID: `commitment-tracker`
- Short label: Commitments
- Surface: hero
- API route: `/api/ai/commitment-scan`
- UI target: workbench
- Required cores: `situation`, `time`
- Output: structured
- Model tier: pro
- Credits: 2
- Frameworks: peace agreement corpus, Agreement compliance monitoring, Stedman implementation analysis
- Limits: It needs temporal anchors and source receipts; vague political statements should be marked as weak commitments.

Commitment Tracker records obligations, deadlines, verification mechanisms, compliance posture, and violation type. It is the PRAXIS memory for promises that need follow-up.

### Memo Drafter

- ID: `memo-drafter`
- Short label: Memo
- Surface: hero
- API route: `/api/ai/writer/ask`
- UI target: writer
- Required cores: `user`, `situation`, `output`
- Output: work_product
- Model tier: pro
- Credits: 1
- Frameworks: Policy memo standards, Putnam two-level analysis, PRAXIS provenance model
- Limits: It drafts the work product; the analyst still owns source review, tone, and final judgment.

Memo Drafter turns the active User Core, Situation Core, sources, and selected tool outputs into a reviewable work product in PraxisWriter. It preserves provenance and keeps gaps visible before export.
