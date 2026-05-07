# Premortem

## Purpose
Assume a recommendation has failed and work backward to identify likely failure pathways, triggering conditions, and mitigations. Uses the Gary Klein 2007 premortem formulation.

## When To Use
Use before exporting a memo recommendation, mediation plan, policy option, or implementation proposal.

## When Not To Use
Do not use as a prediction engine or as a substitute for risk monitoring.

## Inputs
Memo recommendation block or free-text proposal, case risks, actor constraints, assumptions, and available mitigation options.

## Outputs
Failure pathways, severity and likelihood bands, triggering conditions, mitigations, and memo annex content.

## Context Requirements
Runs on free text but improves with case graph constraints, recent events, and actor incentives.

## Composition
Can append a Premortem annex to Memo Studio and can chain after Key Assumptions Check.

## Examples
Stress-test a council statement recommendation by assuming it failed catastrophically and identifying what went wrong.

## Pitfalls
Do not treat imagined failure pathways as predictions. Keep them advisory and tied to evidence where available.
