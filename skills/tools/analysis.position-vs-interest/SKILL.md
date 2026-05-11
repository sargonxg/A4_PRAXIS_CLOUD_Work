---
name: analysis.position-vs-interest
description: Separate stated positions from likely underlying interests with confidence and test questions.
---

## Purpose
`analysis.position-vs-interest` helps analysts and mediators distinguish demands from incentives.

## When To Use
Use for negotiation prep, actor diagnosis, mediation briefs, and stakeholder engagement.

## When Not To Use
Do not use when actor claims are absent or when inferred interests would be treated as settled facts.

## Inputs
Requires `caseId`; optional `actorId` or `actorIds` and analyst focus.

## Outputs
Returns position-interest rows, confidence, evidence, mediator questions, gaps, and citations.

## Context Requirements
Needs named actors, claims or demands, source receipts, and enough context to mark uncertainty.

## Composition
Can consume Stakeholder Power-Interest Map and feed Coalition Detector, Scenario Projector, and Memo Drafter.

## Examples
Foreign policy: state positions versus security interests. Domestic policy: industry positions versus commercial interests. Corporate: public commitments versus operational incentives.

## Pitfalls
Do not hide inference; every interest should show why it is inferred and how to test it.
