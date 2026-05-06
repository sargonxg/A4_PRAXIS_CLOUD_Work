# Context Preparer

## Purpose
Prepare advisory context bundles when a tool has thin User, Workspace, Case, or Conversation context.

## When To Use
Use before a tool run when `contextSpec` is not fully satisfied but the tool can run gracefully.

## When Not To Use
Do not use to write graph facts, raise confidence to verdict, or bypass review queues.

## Inputs
ContextSnapshot, ContextSpec, active tool id, and optional user prompt.

## Outputs
PreparedContext with summaries, extractions, gap notes, and confidence by layer.

## Context Requirements
Requires owner-scoped user and case context; workspace context is optional at v1.

## Composition
Feeds every v2 tool and may be followed by Source Augmenter or Output Refiner.

## Examples
Prepare a Syria policy memo run when no workspace methodology guide exists.

## Pitfalls
Synthesized context is always labeled and capped at low confidence.
