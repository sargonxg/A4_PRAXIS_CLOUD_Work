# PRAXIS Agentic Research Eval

Generated: 2026-05-22T17:59:59.425Z

| Scenario | PRAXIS | Baseline | Delta | Proof win | Failure mode |
|---|---:|---:|---:|---|---|
| current-events | 100 | 20 | 80 | yes | none |
| conflict-policy-research | 90 | 20 | 70 | yes | none |
| claim-source-discovery | 90 | 20 | 70 | yes | none |
| contradiction-uncertainty | 90 | 30 | 60 | yes | none |
| capsule-grounded-research | 90 | 20 | 70 | yes | none |
| memo-pdf-output | 90 | 20 | 70 | yes | none |
| sourceability-ledger | 90 | 20 | 70 | yes | none |
| multi-agent-review | 90 | 20 | 70 | yes | none |
| handover-package | 90 | 20 | 70 | yes | none |
| degraded-grounding | 65 | 20 | 45 | yes | explicit degraded Google Search grounding receipt |

## Fixed Scenarios

- current-events: Current events and recency
- conflict-policy-research: Conflict and policy research
- claim-source-discovery: Source discovery for a claim
- contradiction-uncertainty: Contradiction and uncertainty check
- capsule-grounded-research: Capsule-grounded research
- memo-pdf-output: Memo and PDF-ready output
- sourceability-ledger: Sourceability claim ledger
- multi-agent-review: Multi-agent review
- handover-package: Handover package
- degraded-grounding: Degraded grounding posture

## Notes

- Scores are deterministic contract checks for planning, source authority, recency, citation fidelity, uncertainty handling, capsule reuse, persistence, audit trail, latency, and failure mode.
- No secrets or user content are written by this eval harness.
