---
name: analysis.commitment-tracker
description: Track commitments by monitorability, actor, timeline, verification, and lifecycle state.
---

## Purpose
`analysis.commitment-tracker` checks whether pledges, treaty terms, or implementation promises can be monitored.

## When To Use
Use for agreement drafting, implementation monitoring, regulatory pledges, and accountability review.

## When Not To Use
Do not use when there is no commitment text, responsible actor, or verification cue.

## Inputs
Requires `caseId`; optional scope, commitment text, actor, timeline, and trigger.

## Outputs
Returns commitment table, state, breach analysis, monitorability score, gaps, and citations.

## Context Requirements
Needs agreement text, pledge language, accountable actors, source receipts, and dates where available.

## Composition
Consumes Deep Research and Scenario Projector; feeds Memo Drafter and timeline review.

## Examples
Foreign policy: treaty or ceasefire commitments. Domestic policy: regulatory implementation pledges. Corporate: sustainability commitments and audit triggers.

## Pitfalls
Do not equate vague aspiration with monitorable commitment; mark ambiguity and enforcement gaps.
