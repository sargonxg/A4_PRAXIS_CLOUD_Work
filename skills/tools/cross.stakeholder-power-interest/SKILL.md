# Stakeholder Power Interest

## Purpose
Plot actors on a power-interest grid and identify engagement posture by quadrant.

## When To Use
Use when the active situation needs The standard policy 2x2 makes actor prioritization legible across every ontology. and the user wants a structured, reviewable marketplace run.

## When Not To Use
Do not use when the case lacks any relevant actors, claims, events, or source receipts. Run context preparation or ingestion first when the user needs grounded assertions.

## Inputs
Analyst prompt, active case context, ontology requirements (conflict, mediation, governance, narrative, human-rights, economic, humanitarian, legal, security), source receipts, graph snippets, and optional focused node or prior tool output.

## Outputs
Structured summary, evidence-grounded findings, synthesized options where appropriate, confidence and gap notes, next actions, and a preserved context dump.

## Context Requirements
Requires user role/preferences, workspace methodology when available, active case graph context, conversation focus, and graceful handling for weak context. Minimum context health target: 25%.

## Composition
Can start from the active case context. Can chain into: cross.brief-exporter, cross.assumption-mapper

## Examples
Run Stakeholder Power Interest against the active case and export accepted findings to the workbench evidence drawer or Memo Studio.

## Pitfalls
Do not turn synthesized output into durable graph assertions without review. Keep missing receipts, ontology mismatch, and low confidence visible as advisories.
