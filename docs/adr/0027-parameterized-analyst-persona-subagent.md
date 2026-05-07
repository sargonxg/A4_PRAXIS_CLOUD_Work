# ADR 0027: Parameterized Analyst Persona Subagent

## Status

Accepted

## Context

Pack 16 calls for ten canonical personas and custom personas. Maintaining one Agent Engine deployment per persona would create unnecessary deployment and evaluation overhead.

## Decision

Use one `analyst_persona` subagent parameterized by `persona_id`. The persona id resolves the persona spec, corpus namespace, tool affinity, voice profile, and output schema. Custom personas must use a `custom:` namespace and remain sandboxed to declared corpora and tools.

## Consequences

Persona behavior stays consistent under one schema and one deployment contract. Eval coverage still runs per persona because parameterization can drift by spec.

## Alternatives Considered

- Ten separate canonical subagents. Rejected because deployment overhead scales poorly.
- Free-form persona prompts. Rejected because they are hard to audit and unsafe for custom personas.
