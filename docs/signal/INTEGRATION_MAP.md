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
| World entrypoint | `SignalWorkspace` opens the public-source world explorer and one AI question box. Existing complete owner-scoped evidence workflow remains behind **Evidence & briefs**, including direct `?desk=` links. |
| World observations | `world-service.ts` keeps a bounded shared public snapshot and fenced twelve-hour refresh control under the existing server-only `signalRuntime` collection. `worldLatest.payload` has an additive indexing exemption; deployed default-deny rules prevent browser Firestore reads. Authenticated `GET /api/signal/world` is read-only and never starts collection. |
| World collector | Cron-secret `POST /api/signal/world/refresh` fetches the fixed permission-checked registry through the existing SSRF-safe collector, outside Firestore transactions. Actual economic years, provider statistical entities, publication/retrieval clocks and source failures remain explicit. This does not read private desks or create accepted evidence. |
| World AI | `POST /api/ai/signal-world` preflights authenticated questions and an actual bounded snapshot before the existing calibrated media-compass gateway. Citations, attribution, links and reported numerical prose come from server records; unreviewed answers do not write evidence or capsules. |
| World visuals | Locally bundled Natural Earth geometry and Three.js render filled country surfaces, country raycasting, camera controls and accessible map fallback. The media source/topic graph links exact sampled headline IDs; visual proximity and counts are not influence or polarization measurements. |

No independent login, graph database, SQLite production store, external model client or parallel capsule schema is introduced. Graphs are reproducible reports_claim projections, not influence or coordination evidence.
