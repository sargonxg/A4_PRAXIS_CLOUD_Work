# Context Health Explainer

## Purpose
Explain missing context, stale receipts, weak graph coverage, and next collection moves.

## When To Use
Use when context health is low or a tool run needs gap explanation.

## When Not To Use
Do not use for substantive policy judgment by itself.

## Inputs
ContextSnapshot, tool spec, active case, and optional prompt.

## Outputs
Layer-by-layer advisories and next collection steps.

## Context Requirements
Needs all available context layers; gracefully handles missing layers.

## Composition
Can precede any analysis tool.

## Examples
Explain why a case is thin before running Scenario Projector.

## Pitfalls
Do not block the user; advise and offer next actions.
