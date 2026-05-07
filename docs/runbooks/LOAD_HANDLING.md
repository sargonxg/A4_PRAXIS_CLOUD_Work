# Load Handling

## Signals
- Latency or error rate rises under user, ingestion, or tool-run load.
- Cloud Run concurrency or Cloud SQL connections saturate.
- AI cost spikes during tool-heavy sessions.

## Triage
1. Identify the dominant bottleneck: frontend, backend, database, storage, or AI provider.
2. Check Cloud Run concurrency and instance counts.
3. Check tool-run cost class distribution.

## Mitigation
- Reduce high-cost route concurrency if AI cost or provider latency is the cause.
- Scale Cloud Run only after confirming Cloud SQL can absorb connection pressure.

## Escalation
Load tests above smoke intensity are cost-impacting and require owner approval.
