---
name: analysis.scenario-projector
description: Project likely, high-risk, and opportunity scenarios with indicators and decision triggers.
---

## Purpose
`analysis.scenario-projector` converts current Context signals into reviewable future paths.

## When To Use
Use for foresight, risk briefings, decision timing, and contingency planning.

## When Not To Use
Do not use when the user expects prediction certainty or when assumptions cannot be stated.

## Inputs
Requires `caseId`; optional horizon, forcing variables, and decision question.

## Outputs
Returns scenario set, probabilities as subjective estimates, indicators, signposts, citations, and gaps.

## Context Requirements
Needs current frame, actors, events, uncertainties, and source coverage.

## Composition
Can consume Deep Research, ACH, and Stakeholder maps; can feed Memo Drafter and Commitment Tracker.

## Examples
Foreign policy: escalation pathways. Domestic policy: regulatory passage scenarios. Corporate: market and compliance outlook scenarios.

## Pitfalls
Never present scenarios as forecasts; preserve assumptions, uncertainty, and watch indicators.
