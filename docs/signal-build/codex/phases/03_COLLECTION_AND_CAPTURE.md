# Phase 03 - collection, source capture and health

Additional required reading: [research/COLLECTOR_ACCESS.md](../../research/COLLECTOR_ACCESS.md). Use these as design inputs; verify current provider/repository contracts in this checkout.

Implement GDELT discovery, configured RSS/official-source intake and customer-supplied material using current server-side services. Consult each provider's current primary documentation. GDELT results are discovery metadata; `seendate` is not publication time. A headline cannot ground a substantive body claim. Avoid unlicensed full-text retention.

Give every collector a typed contract: configured pack and scope revision, bounded window, checkpoint, request signature, normalized candidates, health result and coverage limits. Add finite time/body limits, provider-specific throttles, bounded exponential backoff/jitter, Retry-After handling and durable deduplication. A 250-item GDELT list is potentially saturated; bounded time/query partitioning can improve discovery, but record unresolved saturation instead of claiming completeness.

Fetch configured source representations only where the source pack permits it. Use existing private intake for supplied files. Enforce redirect-aware SSRF defenses, DNS/private address checks, allowed protocols, MIME/size limits and parser isolation. HTML/PDF text, OCR and translations retain their derivation and hash. Store original, publication, discovery, capture and asserted event times separately; unknown values are null with reasons.

Record source identity, immutable revisions, language, rights basis, retention and all capture occurrences. A failure leaves prior evidence available, records a failed collection and does not mark the desk quiet. UI displays source-health state, discovery-only labels, last successful collection and stale evidence.

Acceptance: duplicate and edited feeds, redirects to disallowed addresses, 429/503/timeouts/non-JSON, result saturation, wrong language, missing dates, withdrawn source and repeated jobs are tested. A permissioned intake revision can be opened after reload. If the network is available, run one bounded GDELT smoke and one authorized feed smoke, saving only non-secret request/response summaries. Fixture tests and live provider results must be reported separately. No collector runs worldwide by default.
