# Agent Engine Incident

## Signals
- Agent Engine secret is missing or stale.
- Subagent invocation latency or failure rate spikes.
- Context Preparer, Source Augmenter, Output Refiner, Memo Drafter, Red Team Analyst, Analyst Persona, or Moderator evals fail.

## Triage
1. Verify `praxis-vertex-adk-engine-id` in Secret Manager.
2. Inspect Cloud Run logs for agent invocation errors.
3. Check the latest Agent Engine deployment metadata and eval timestamp.

## Mitigation
- Route affected features to deterministic foundation fallback.
- Disable only the failing subagent dependency when the tool can still produce advisory output.

## Escalation
Escalate before deleting or redeploying Agent Engine resources; deployment changes are owner-gated.
