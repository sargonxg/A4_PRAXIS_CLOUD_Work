# Scenario Projector

## Purpose
Project plausible scenario paths from graph state, claims, leverage, and constraints.

## When To Use
Use when the user needs structured scenario options.

## When Not To Use
Do not use when source and graph context are too thin for meaningful branching without advisories.

## Inputs
Case graph, assumptions, time horizon, source receipts, and prompt.

## Outputs
Scenario paths, drivers, assumptions, and confidence bands.

## Context Requirements
Needs case graph density, user mandate, and optional workspace methodology.

## Composition
Can consume Escalation Timeline and Leverage Trace outputs.

## Examples
Project diplomatic escalation paths over the next 30 days.

## Pitfalls
Keep assumptions visible and do not imply prediction certainty.
