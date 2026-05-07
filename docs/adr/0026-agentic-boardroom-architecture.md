# ADR 0026: Agentic Boardroom Architecture

## Status

Accepted

## Context

Pack 16 requires PRAXIS to move beyond single-shot tool outputs into a citable multi-persona deliberation artifact. The boardroom must preserve disagreement, keep synthesis advisory, and fit the existing workbench and ContextProvider model.

## Decision

Ship the Agentic Boardroom as a first-class case artifact with authenticated Next API routes, a workbench route family, deterministic local foundation orchestration, and later live Moderator / analyst_persona Agent Engine deployment. Boardroom outputs are stored under the owning user's case and are labeled `synthesized: true` with confidence capped at `0.6`.

## Consequences

The boardroom can be used and tested locally before live Agent Engine deployment. The foundation does not weaken the symbolic firewall because graph promotion remains review-gated.

## Alternatives Considered

- Reuse the older Brainstorming Table only. Rejected because it does not provide the Pack 16 lifecycle, persona schema depth, or visual boardroom surface.
- Deploy live multi-agent orchestration first. Rejected for this pass because production deployment and cost telemetry need explicit staging and sign-off.
