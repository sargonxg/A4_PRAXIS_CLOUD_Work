# 0021 - SATs as First-Class Analyst Toolkit Surfaces

## Status
Accepted for v1.1 foundation.

## Context
PRAXIS already had graph operations, marketplace tools, memos, and challenge-oriented helpers, but the user-facing vocabulary did not expose the canonical Structured Analytic Techniques used by trained analysts. Pack 15 identifies Analysis of Competing Hypotheses, Key Assumptions Check, Red Team Analysis, and Premortem as the highest-leverage initial set.

## Decision
PRAXIS will expose these techniques as an Analyst's Toolkit. ACH receives a first-class workbench surface because the hypothesis x evidence matrix is a persistent artifact. KAC, Red Team, and Premortem are marketplace tools with `satCategory` metadata and SAT-specific skill files.

Every SAT output that creates structured assertions remains synthesized and advisory until a user promotes it through review. Heuer-Pherson attribution is shown in skills and UI. Premortem uses the Klein 2007 formulation.

## Consequences
Analysts see familiar professional vocabulary and can start from ACH/KAC/Red Team/Premortem without learning PRAXIS-specific naming. The marketplace registry grows from 16 to 20 curated tools while the consolidated primary workspace cap remains unchanged.

## Alternatives Considered
Keeping SATs as generic challenge buttons was rejected because it hides the recognizable analyst workflow. Implementing all SATs as one-shot tools was rejected because ACH needs a persistent matrix.
