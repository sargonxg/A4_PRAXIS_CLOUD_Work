# PRAXIS Canonical Tool Library

The default PRAXIS surface is twelve attachable tools. Ask PRAXIS recommends three based on the active Core stack.

## 1. Ask PRAXIS

### What it does
Ask PRAXIS produces text output through inline.

### Cores it needs
- User Core
- Situation Core

### Output
Produces text via `/api/ai/ask-praxis`.

### Methodology
Ask PRAXIS answers from the attached User Core and Situation Core, then routes the next step to writing, research, graph repair, or a specialist policy tool. It should explain the basis for the answer, show gaps, and propose actions before writing into the workspace.

### Frameworks
- Professional editorial standards
- Fisher-Ury principled negotiation
- Context injection

### Limits
It is a command plane, not an automatic mutation engine. Tool runs and graph updates remain confirmation-gated.

## 2. Context Builder

### What it does
Context Builder produces structured output through workbench.

### Cores it needs
- Situation Core

### Output
Produces structured via `/api/situations/classify-domain`.

### Methodology
Context Builder is the intake and repair gate. It checks whether the situation has enough scope, actors, sources, mission framing, assumptions, and graph structure before heavier AI work runs.

### Frameworks
- Situation context health
- Policy workflow pathing
- ACO Conflict Grammar

### Limits
It strengthens the case file but does not replace expert source judgment or full graph review.

## 3. Grounded Research

### What it does
Grounded Research produces structured output through workbench.

### Cores it needs
- Situation Core
- Source Graph

### Output
Produces structured via `/api/ai/source-scout`.

### Methodology
Grounded Research proposes defensible sources ranked by recency, diversity, and reliability. It checks the situation corpus first to avoid duplicates, then returns a search plan, source receipts, and gaps still missing from the Source Graph.

### Frameworks
- Source triangulation
- Reliability tiers
- OSINT source hierarchy

### Limits
Fresh web coverage depends on provider availability and the specificity of the situation frame.

## 4. Stakeholder Map

### What it does
Stakeholder Map produces structured output through workbench.

### Cores it needs
- Situation Core

### Output
Produces structured via `/api/ai/stakeholder-map`.

### Methodology
Stakeholder Map visualizes alliances, adversarial dyads, third-party postures, power, legitimacy, urgency, leverage, and Track I/II/III positions so the analyst can see who matters and why.

### Frameworks
- Mitchell-Agle-Wood stakeholder theory
- Barnett-Duvall power taxonomy
- Lederach peacebuilding pyramid

### Limits
Actor salience is only as strong as the Situation Core and source coverage.

## 5. Position vs Interest

### What it does
Position vs Interest produces structured output through workbench.

### Cores it needs
- Situation Core

### Output
Produces structured via `/api/ai/negotiation`.

### Methodology
Position vs Interest separates stated positions from underlying needs, constraints, red lines, BATNAs, and possible issue bundles. It helps PRAXIS move from actor description to negotiation strategy.

### Frameworks
- Fisher-Ury principled negotiation
- Harvard PON BATNA analysis
- Lax-Sebenius 3D negotiation

### Limits
It should be rerun when actor incentives or mandates change.

## 6. Scenario Projector

### What it does
Scenario Projector produces structured output through workbench.

### Cores it needs
- Situation Core
- Time Core

### Output
Produces structured via `/api/ai/scenario`.

### Methodology
Scenario Projector identifies uncertain high-impact drivers, projects best/likely/worst trajectories, and names indicators that would move probability. It keeps time horizon and warning signals explicit.

### Frameworks
- Glasl escalation model
- Structured uncertainty matrix
- Zartman ripeness theory

### Limits
Scenario probabilities are structured judgments, not forecasts with statistical certainty.

## 7. Analysis of Competing Hypotheses

### What it does
Analysis of Competing Hypotheses produces structured output through workbench.

### Cores it needs
- Situation Core
- Source Graph

### Output
Produces structured via `/api/sats/ach`.

### Methodology
ACH compares hypotheses against evidence, forcing disconfirming evidence and weak assumptions into view. It is the default PRAXIS method when a core judgment may be overfit to a single narrative.

### Frameworks
- Heuer ACH
- Structured analytic techniques
- Evidence diagnostics

### Limits
The matrix is only useful when hypotheses are meaningfully distinct and evidence is attached.

## 8. Contradiction Finder

### What it does
Contradiction Finder produces structured output through workbench.

### Cores it needs
- Situation Core
- Source Graph

### Output
Produces structured via `/api/ai/red-team-review`.

### Methodology
Contradiction Finder reviews a claim, memo, or tool output for unstated assumptions, source diversity issues, motivated reasoning, missing intelligence, and evidence that would change the conclusion.

### Frameworks
- Heuer SAT
- Devil’s advocacy
- ICD 203 probability language

### Limits
It critiques reasoning quality; it does not independently verify every cited source.

## 9. Frame Narrative

### What it does
Frame Narrative produces text output through writer.

### Cores it needs
- Situation Core

### Output
Produces text via `/api/ai/info-environment`.

### Methodology
Frame Narrative explains how actors describe the situation, which frames are gaining traction, where legitimacy claims diverge, and how a memo or briefing should avoid adopting an unexamined frame.

### Frameworks
- NATO STRATCOM taxonomy
- 4D influence framework
- GDELT GCAM tone analysis

### Limits
Narrative reads need fresh media/source coverage and should be caveated by language and platform gaps.

## 10. Coalition Detector

### What it does
Coalition Detector produces graph delta output through workbench.

### Cores it needs
- Situation Core

### Output
Produces graph delta via `/api/ai/power-map`.

### Methodology
Coalition Detector looks for clusters, brokers, dependencies, patrons, and likely alignment shifts. It turns the Situation Core into testable graph proposals rather than just prose about relationships.

### Frameworks
- Social network analysis
- Power mapping
- Brokerage and alignment analysis

### Limits
Coalition inferences should be reviewed before mutating the canonical graph.

## 11. Commitment Tracker

### What it does
Commitment Tracker produces structured output through workbench.

### Cores it needs
- Situation Core
- Time Core

### Output
Produces structured via `/api/ai/commitment-scan`.

### Methodology
Commitment Tracker records obligations, deadlines, verification mechanisms, compliance posture, and violation type. It is the PRAXIS memory for promises that need follow-up.

### Frameworks
- UCDP Peace Agreement Dataset
- Agreement compliance monitoring
- Stedman implementation analysis

### Limits
It needs temporal anchors and source receipts; vague political statements should be marked as weak commitments.

## 12. Memo Drafter

### What it does
Memo Drafter produces work product output through writer.

### Cores it needs
- User Core
- Situation Core
- Output Core

### Output
Produces work product via `/api/ai/writer/ask`.

### Methodology
Memo Drafter turns the active User Core, Situation Core, sources, and selected tool outputs into a reviewable work product in PraxisWriter. It preserves provenance and keeps gaps visible before export.

### Frameworks
- Policy memo standards
- Putnam two-level analysis
- PRAXIS provenance model

### Limits
It drafts the work product; the analyst still owns source review, tone, and final judgment.
