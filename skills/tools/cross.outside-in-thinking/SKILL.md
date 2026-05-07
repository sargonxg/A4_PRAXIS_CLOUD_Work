# Outside-In Thinking

## Purpose
Apply STEEP/PESTEL-style external-force scanning to expose context the case frame may be missing.

## When To Use
Use when the active situation needs Outside-in review catches environmental forces that internal actor maps miss. and the user wants a structured, reviewable marketplace run.

## When Not To Use
Do not use when the case lacks any relevant actors, claims, events, or source receipts. Run context preparation or ingestion first when the user needs grounded assertions.

## Inputs
Analyst prompt, active case context, ontology requirements (conflict, mediation, governance, narrative, human-rights, economic, humanitarian, legal, security), source receipts, graph snippets, and optional focused node or prior tool output.

## Outputs
Structured summary, evidence-grounded findings, synthesized options where appropriate, confidence and gap notes, next actions, and a preserved context dump.

## Context Requirements
Requires user role/preferences, workspace methodology when available, active case graph context, conversation focus, and graceful handling for weak context. Minimum context health target: 25%.

## Composition
Can start from the active case context. Can chain into: cross.assumption-mapper, cross.brief-exporter

## Examples
Run Outside-In Thinking against the active case and export accepted findings to the workbench evidence drawer or Memo Studio.

## Pitfalls
Do not turn synthesized output into durable graph assertions without review. Keep missing receipts, ontology mismatch, and low confidence visible as advisories.
