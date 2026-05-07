# Cluster Coordinator

## Purpose
Surface cluster activities, gaps, deconfliction needs, and memo-ready coordination notes.

## When To Use
Use when the active situation needs Cluster coordination is fragmented and benefits from graph-backed situational synthesis. and the user wants a structured, reviewable marketplace run.

## When Not To Use
Do not use when the case lacks any relevant actors, claims, events, or source receipts. Run context preparation or ingestion first when the user needs grounded assertions.

## Inputs
Analyst prompt, active case context, ontology requirements (humanitarian), source receipts, graph snippets, and optional focused node or prior tool output.

## Outputs
Structured summary, evidence-grounded findings, synthesized options where appropriate, confidence and gap notes, next actions, and a preserved context dump.

## Context Requirements
Requires user role/preferences, workspace methodology when available, active case graph context, conversation focus, and graceful handling for weak context. Minimum context health target: 40%.

## Composition
Can follow humanitarian.needs-aggregator, humanitarian.access-map. Can chain into: cross.brief-exporter

## Examples
Run Cluster Coordinator against the active case and export accepted findings to the workbench evidence drawer or Memo Studio.

## Pitfalls
Do not turn synthesized output into durable graph assertions without review. Keep missing receipts, ontology mismatch, and low confidence visible as advisories.
