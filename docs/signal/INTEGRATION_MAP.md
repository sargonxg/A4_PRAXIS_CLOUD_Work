# SIGNAL integration map

Baseline: 276d9cbb62c2cd6a212770c4fa78547c901ee82b, clean `work` branch equal to origin/main, Node 24.19.0/npm 11.9.0, 2026-10-05.

| Responsibility | Current integration |
| --- | --- |
| Identity | `src/lib/api/with-auth.ts`: signed existing Firebase session, deletion and quota guards. API never accepts tenant identity from a browser. |
| Route | `src/app/signal/layout.tsx` reuses AuthProvider/AppShell and validates the existing auth wrapper server-side. Login return-target helper admits exact /signal only. |
| Canonical ledger | `src/lib/signal/store.ts`: server-only `users/{uid}/signalDesks/{id}`, owner-checked Firestore transactions and optimistic versions. Existing rules default-deny these collections to browsers. |
| Evidence | `schema.ts`/`domain.ts`: original exact text, hashes, immutable revisions, separate capture occurrence/publication clocks, declaration of rights. Discovery headlines cannot ground substantive claims. |
| Native context | `capsules.ts` adapts to canonical SourceReceipt, ContextCapsule and CognitiveCapsule; compiler is `cognitive-compiler/0.3.0`. Only matching human accepted source readings compile. |
| Models | `/api/ai/signal` uses withCalibration with existing media-compass tool/credits and central providers/model runtime policy. Structured proposals pass exact-span validation before persistence. |
| Workers | `jobs.ts`: Firestore transactional outbox and fenced lease, existing Cloud Tasks queue and worker OIDC verifier. Browser cookie cannot authorize worker. Sweep uses existing cron authentication. |
| Release | Existing Cloud Build frontend pipeline and Cloud Run praxis-frontend; staging and traffic promotion checked separately. |

No independent login, graph database, SQLite production store, external model client or parallel capsule schema is introduced. Graphs are reproducible reports_claim projections, not influence or coordination evidence.
