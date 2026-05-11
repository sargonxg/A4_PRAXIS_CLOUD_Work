---
name: analysis.coalition-detector
description: Detect supportive, blocking, swing, and bridge actors around a move or policy action.
---

## Purpose
`analysis.coalition-detector` turns actor relationships into coalition posture for strategy work.

## When To Use
Use for coalition planning, mandate review, voting risk, and blocking-risk analysis.

## When Not To Use
Do not use when actor relationships are absent or when clusters would imply formal alliance without evidence.

## Inputs
Requires `caseId`; optional weighting scheme and target action.

## Outputs
Returns communities, cohesion, bridge actors, blocking risks, citations, and engagement priorities.

## Context Requirements
Needs actors, positions, relationship evidence, and institutional ties where available.

## Composition
Consumes Stakeholder Power-Interest Map and Position-vs-Interest; feeds Scenario Projector and Memo Drafter.

## Examples
Foreign policy: coalition around a diplomatic move. Domestic policy: support and opposition to AI regulation. Corporate: alliance and opposition around sustainability rules.

## Pitfalls
Do not present deterministic clusters as political certainty; label weak ties and missing evidence.
