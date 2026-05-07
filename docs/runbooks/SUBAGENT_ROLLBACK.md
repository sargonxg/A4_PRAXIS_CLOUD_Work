# Subagent Rollback

## Signals
- A new subagent version causes eval regression, bad output, or cost spike.
- Trace trees show incomplete spans for a subagent invocation.

## Triage
1. Identify the subagent and version from deployment metadata.
2. Compare latest eval output to the previous green version.
3. Confirm whether the app can fall back to foundation output.

## Mitigation
- Repoint staging to the previous known-good subagent version.
- Keep production on deterministic fallback until staging is green.

## Escalation
Production rollback of Agent Engine deployments requires owner approval and a written audit note.
