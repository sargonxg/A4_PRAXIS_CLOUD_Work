# Phase 07 - durable watched desks and bounded real-time operation

Additional required reading: [research/COLLECTOR_ACCESS.md](../../research/COLLECTOR_ACCESS.md), [research/TEMPORAL_CONTEXT_GRAPH.md](../../research/TEMPORAL_CONTEXT_GRAPH.md). Use these as design inputs; verify current provider/repository contracts in this checkout.

Implement scheduled collection only for explicitly watched desks through the existing scheduler/Cloud Tasks/trusted worker and current AgentRun triggers. Collection tasks should be lightweight; relevant source changes can trigger bounded analytical runs. Do not create a full analytical AgentRun per headline or rely on a browser tab being open.

Use durable checkpoint windows with overlap, query/pack revisions and idempotency keys. A job retry may rediscover the same evidence but cannot duplicate source revisions, analysis proposals or published artifacts. Authenticate worker invocations with the existing service identity. Use a transactional outbox or equivalent durable change mechanism where ledger writes and event dispatch span stores.

Separate scheduled, running, partial, succeeded, failed and cancelled states. Cancellation stops future work and preserves already committed evidence. Add finite attempts, queue-age limits, dead-letter/recovery handling, backpressure, per-provider quotas and daily desk/model/media spend caps. A lost lease or concurrent dispatch must not double-commit. Reprocessing a failed parser/model version should preserve the previous successful derivation.

Display last collection success, source lag, queued work, failed partitions and degraded coverage. Add independent collector coverage and model-analysis status. Fifteen-minute discovery is a design target, not an SLA or a promise of immediate human review. Use timestamped metrics to establish measured latency before advertising service levels.

Acceptance: simulate duplicate dispatch, out-of-order delivery, worker crash after persistence/before event publication, rate limiting, stale context, source withdrawal, cancellation, quota exhaustion and restart. Verify tenant bounds and the current runtime's actual approval status naming. Run a bounded staging schedule if access exists; otherwise record that scheduling was emulator/fixture-tested only. Persist recovery procedures and prove that re-opening the browser is not necessary for watched collection.
