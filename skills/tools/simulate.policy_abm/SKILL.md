# Simulate Policy ABM

## Purpose
Run an agent-based scenario stress-test over a case, starting with the v1 `escalation_ladder_with_mediator` template.

## When To Use
Use this to stress-test assumptions about mediator strength, faction count, and escalation dynamics under explicit parameters.

## When Not To Use
Do not call the output a forecast or prediction. Do not use it for operational targeting or unattended decision making.

## Inputs
- `scenarioId`: `escalation_ladder_with_mediator`.
- `numFactions`: Number of modeled factions.
- `mediatorStrength`: Intervention strength from `0` to `1`.
- `maxSteps`: Simulation steps, capped at `100`.
- `seed`: Deterministic random seed.

## Outputs
- Step trajectory with average aggression and faction values.
- Summary statistics.
- Seed and parameter provenance.
- Standard scenario-stress-test disclaimer.

## Context Requirements
Requires conflict, mediation, or security context and a graph-informed case frame. Documents are not required.

## Composition
Can chain into brief export. It should be cited as an assumptions-bound stress-test annex.

## Examples
Run a 30-step mediator-strength sweep to see whether the scenario remains stable under weaker intervention assumptions.

## Pitfalls
ABM outputs are sensitive to rules and parameters. Keep assumptions, seed, and limits visible in every memo or export.
