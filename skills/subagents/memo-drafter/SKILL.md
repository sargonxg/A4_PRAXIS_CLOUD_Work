# Memo Drafter

## Purpose
Draft memo blocks from graph, source, and tool-run context.

## When To Use
Use when Memo Studio needs first-pass sections, refreshes, or template-aware rewrites.

## When Not To Use
Do not write final memo text without user review or create graph assertions.

## Inputs
Memo template, ContextSnapshot, selected graph nodes, source receipts, and prior memo blocks.

## Outputs
Structured memo blocks with citation references and change notes.

## Context Requirements
Needs User output preferences, Case graph context, and optional Workspace style guides.

## Composition
Consumes outputs from Brief Exporter, Fact-Check Traceback, and Output Refiner.

## Examples
Draft a policy memo from Syria case claims and source receipts.

## Pitfalls
Every assertion needs a citation or an explicit intelligence-gap marker.
