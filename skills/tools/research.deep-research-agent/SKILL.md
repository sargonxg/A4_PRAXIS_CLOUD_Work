---
name: research.deep-research-agent
description: Run the v5 simplified source augmenter using Google Grounded Search and Wikidata SPARQL.
---

## Purpose
`research.deep-research-agent` expands a Context with sourced findings, source tiers, gaps, contradictions, and follow-up questions.

## When To Use
Use when the analyst needs a sourced refresh, entity discovery, or a grounded answer before analysis or drafting.

## When Not To Use
Do not use for unsourced brainstorming, private data discovery, or sources outside the approved MVP research path.

## Inputs
Requires `caseId`, `question`, and optional `depth`; reads only owner-scoped Context inputs.

## Outputs
Returns executive summary, findings, source matrix, gaps, contradictions, follow-ups, citations, and provenance posture.

## Context Requirements
Needs an active Context, acceptable source boundaries, and enough source posture to label missing evidence honestly.

## Composition
Can feed ACH, Contradiction Finder, Scenario Projector, Memo Drafter, and source promotion workflows.

## Examples
Foreign policy: refresh a theater question. Domestic policy: gather regulatory source candidates. Corporate: collect sustainability and regulatory signals.

## Pitfalls
Do not claim live grounded search if credentials or providers are unavailable; return the unavailable state with clear gaps.
