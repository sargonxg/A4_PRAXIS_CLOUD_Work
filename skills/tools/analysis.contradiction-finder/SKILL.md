---
name: analysis.contradiction-finder
description: Flag conflicting claims across sources, graph facts, notes, and prior outputs.
---

## Purpose
`analysis.contradiction-finder` protects briefing quality by surfacing unresolved conflicts.

## When To Use
Use before memo export, after research ingestion, or when confidence depends on contested claims.

## When Not To Use
Do not use as a replacement for source review or as proof that one side is correct.

## Inputs
Requires `caseId`; optional scope such as all, recent, or an episode.

## Outputs
Returns contradiction list, source sides, confidence, consequence, resolution tasks, and citations.

## Context Requirements
Needs claim set, provenance, source receipts, and ideally prior outputs.

## Composition
Can consume Deep Research and feed ACH, Memo Drafter, and source review tasks.

## Examples
Foreign policy: contested ceasefire claims. Domestic policy: conflicting implementation claims. Corporate: pledge versus practice conflicts.

## Pitfalls
Do not flatten uncertainty; preserve each side, source tier, and what evidence would resolve it.
