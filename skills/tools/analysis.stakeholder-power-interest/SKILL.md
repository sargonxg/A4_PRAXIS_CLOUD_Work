---
name: analysis.stakeholder-power-interest
description: Plot actors on a power-interest grid with engagement posture and evidence notes.
---

## Purpose
`analysis.stakeholder-power-interest` turns Context actors into an engagement-priority grid.

## When To Use
Use for stakeholder strategy, outreach planning, negotiation prep, and briefing tables.

## When Not To Use
Do not use when the Context has no actor list or when influence and interest evidence cannot be explained.

## Inputs
Requires `caseId`; optional analyst notes may name priority actors, influence cues, or interest cues.

## Outputs
Returns actor coordinates, quadrant labels, engagement posture, missing actor notes, citations, and provenance.

## Context Requirements
Needs actors, source receipts, graph nodes, or analyst notes that support influence and interest judgments.

## Composition
Can feed Coalition Detector, Position-vs-Interest Decoder, Scenario Projector, and Memo Drafter.

## Examples
Foreign policy: prioritize diplomatic outreach. Domestic policy: map regulators and industry groups. Corporate: map regulators, NGOs, suppliers, and customers.

## Pitfalls
Do not present inferred coordinates as objective measurement; label confidence and evidence gaps.
