---
name: drafting.memo-drafter
description: Produce reviewable memo blocks from Context findings while preserving citations and gaps.
---

## Purpose
`drafting.memo-drafter` turns accepted Context findings into memo-ready sections for Drafting Studio.

## When To Use
Use after research or analysis methods have produced reviewable findings and citations.

## When Not To Use
Do not use to fabricate unsupported recommendations or bypass analyst review.

## Inputs
Requires `caseId`, template intent, audience, and optional custom instructions.

## Outputs
Returns structured memo blocks, citation gaps, review checklist, and provenance posture.

## Context Requirements
Needs key findings, source receipts, user model posture, and active Context scope.

## Composition
Consumes Deep Research, ACH, Contradiction Finder, Scenario Projector, and stakeholder outputs.

## Examples
Foreign policy: decision memo. Domestic policy: regulatory landscape note. Corporate: board risk brief.

## Pitfalls
Phase 6 owns final templates and section actions; keep this output reviewable and clearly grounded.
