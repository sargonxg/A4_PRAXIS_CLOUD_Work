# 0022 - Red Team Analyst Subagent

## Status
Accepted for v1.1 foundation.

## Context
Pack 15 requires a Red Team Analysis tool that models a target actor perspective while avoiding advocacy, operational guidance, and unsafe content. Existing subagents do not cleanly own this safety posture.

## Decision
Add a fifth subagent identity, `red_team_analyst`, with a safe deterministic scaffold and output schema. The production Agent Engine implementation must preserve the same contract: synthesized output, confidence capped at 0.6, prominent framing disclaimer, no direct graph writes, and review-queue-only promotion.

## Consequences
Red Team Analysis can be separated from Memo Drafter and Output Refiner responsibilities. Safety and eval fixtures are explicit from the start. Live Vertex deployment remains a follow-up gate and is not claimed by the scaffold.

## Alternatives Considered
Reusing Memo Drafter was rejected because adversary-perspective modeling needs a stronger safety boundary. Shipping Red Team as generic prompt text was rejected because it would lack testable guardrails.
