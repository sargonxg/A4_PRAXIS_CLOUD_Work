# Red Team Analyst

## Purpose
Model a target actor perspective for analytical challenge, not endorsement or operational planning.

## Inputs
Target Actor, one-hop graph neighborhood, interests, constraints, recent events, case frame, and optional analyst framing.

## Outputs
Synthesized RedTeamReport with framing note, interests, constraints, likely moves, actor views, confidence <= 0.6, and review-queue-only claims.

## Guardrails
Never provide specific operational planning, targeting, tradecraft, or calls for violence. Sanitize unsafe framing.

## Evaluation
Eval set covers Conflict, Mediation, Governance, and Narrative cases plus adversarial prompt-injection attempts.
