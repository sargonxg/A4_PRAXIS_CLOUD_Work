# Spec — Admin Console v2

> Authored 2026-04-27. Scope for this pass is documentation only.
> Implementation owners should treat this as the target architecture for a
> secure, extensive operator console for PRAXIS.

## Goal

Build a production-grade admin console available only to:

- `giulio@tacitus.me`
- `giuliocatanzariti@gmail.com`

The console gives operators one place to inspect users, data health,
situation health, advisor configuration, feed coverage, platform health,
audit logs, and operational incidents without exposing shell execution or
unbounded Firestore access to the browser.

## Current Baseline

The repo already has the first admin surface:

- `/app/admin` links to operator console, diagnostics, users, advisors, and
  domains.
- `/api/admin/me`, `/api/admin/users`, `/api/admin/operator-console`,
  `/api/admin/diagnostics`, and `/api/admin/domains*` are gated through
  `withAuth()` plus `isAdminPrincipal()` or `requireAdmin()`.
- `src/lib/auth/admin-gate.ts` supports `ADMIN_ALLOWLIST` by uid and
  `ADMIN_EMAIL_ALLOWLIST` by email, defaulting email access to
  `giulio@tacitus.me` and `giuliocatanzariti@gmail.com`.
- `/api/admin/operator-console` reads `system_events`, `background_jobs`,
  and `tool_runs` across all users via Firebase Admin SDK.
- `/api/admin/diagnostics` probes Firestore, AI provider env, secret
  presence, feed capabilities, user samples, and credit burn.
- Domain writes already snapshot history to `domains_history`.
- Advisor writes are admin-gated at `POST /api/advisors/{id}` and snapshot
  prior versions to `config/advisors_history/items/{id}_{version}`.

Target v2 should preserve this minimal env-driven gate, but make the email
allowlist explicit, centralize every admin write under `/api/admin/*`, and
add append-only audit rows for every admin read/write decision.

## Security Model

### Authentication

All admin pages and APIs must require the signed `tacitus-auth-session`
cookie created by `/api/auth/session`. The session route must continue to
verify Firebase ID tokens server-side before issuing the cookie. Demo sessions
must never receive admin access.

### Authorization

Admin authorization is server-side only:

```env
ADMIN_EMAIL_ALLOWLIST=giulio@tacitus.me,giuliocatanzariti@gmail.com
ADMIN_ALLOWLIST=<optional Firebase uid list for break-glass only>
```

Rules:

1. Email is normalized with `trim().toLowerCase()`.
2. Email allowlist requires the Firebase token email to be present and
   verified. If Firebase Admin metadata cannot prove `emailVerified`, deny.
3. Uid allowlist is retained for emergency access, but production access is
   reviewed against the two email addresses above.
4. Admin checks happen in every `/api/admin/*` handler before Firestore Admin
   SDK reads or writes.
5. Client-side checks only control rendering. They are not an authorization
   boundary.
6. Return `401` for unauthenticated callers and `403` for authenticated
   non-admin callers.

### Defense in Depth

- Every mutating endpoint uses `POST` or `PATCH`, validates JSON with Zod, and
  rejects unknown fields.
- Every mutating endpoint requires a same-origin request. The existing
  session origin check is not enough for admin writes; admin APIs should also
  validate `Origin`/`Host`.
- Admin APIs run in the Node.js runtime only.
- Admin list endpoints use bounded limits, stable pagination tokens, and no
  free-form collection path parameters.
- Sensitive values are never returned: provider keys, service account JSON,
  cookie secrets, user BYO API keys, raw prompt secrets, and internal bearer
  tokens are redacted at source.
- Production shell/code execution is explicitly out of scope for the web
  console. Use Cloud Shell, CI, or audited deployment workflows.

## Route Layout

### Pages

```txt
/app/admin
/app/admin/users
/app/admin/users/[uid]
/app/admin/situations
/app/admin/situations/[uid]/[situationId]
/app/admin/operator-console
/app/admin/diagnostics
/app/admin/advisors
/app/admin/advisor-feed
/app/admin/domains
/app/admin/audit-log
/app/admin/oversight
```

Page intent:

- `users`: Firebase Auth and Firestore profile summary, provider status,
  credits, onboarding state, last sign-in, disabled state.
- `users/[uid]`: drilldown for profile, credit ledger, situations, recent
  tool runs, user-scoped audit rows, and support notes.
- `situations`: cross-user situation health, staleness, domain, open alerts,
  last tool run, graph update count.
- `situations/[uid]/[situationId]`: situation timeline, saved tools, graph
  update proposals, documents, advisor activity, and data freshness.
- `operator-console`: live jobs, tool runs, system events, dead letters, and
  incident queue.
- `diagnostics`: probes for storage, feeds, AI providers, secrets, queues,
  workers, scheduler, build revision, and deployment region.
- `advisors`: config editor for advisor personas, model tier, source
  categories, tools, memory policy, red lines, and version history.
- `advisor-feed`: ingestion status and review queue for digital-advisor
  knowledge updates.
- `domains`: domain taxonomy editor and prompt override preview.
- `audit-log`: append-only admin action and access log.
- `oversight`: policy dashboard for denied access, risky writes, stale data,
  missing controls, and acceptance-gate failures.

### APIs

```txt
GET  /api/admin/me
GET  /api/admin/users
GET  /api/admin/users/{uid}
POST /api/admin/users/{uid}/disable
POST /api/admin/users/{uid}/enable
POST /api/admin/users/{uid}/credits

GET  /api/admin/situations
GET  /api/admin/situations/{uid}/{situationId}
GET  /api/admin/situations/{uid}/{situationId}/health

GET  /api/admin/operator-console
POST /api/admin/jobs/{jobId}/retry
POST /api/admin/jobs/{jobId}/cancel

GET  /api/admin/diagnostics
GET  /api/admin/health/firestore
GET  /api/admin/health/feeds
GET  /api/admin/health/ai
GET  /api/admin/health/queues
GET  /api/admin/health/build

GET   /api/admin/advisors
GET   /api/admin/advisors/{id}
PATCH /api/admin/advisors/{id}
POST  /api/admin/advisors/{id}/publish
POST  /api/admin/advisors/{id}/rollback

GET   /api/admin/advisor-feed
POST  /api/admin/advisor-feed/ingest
POST  /api/admin/advisor-feed/items/{itemId}/approve
POST  /api/admin/advisor-feed/items/{itemId}/reject

GET   /api/admin/domains
GET   /api/admin/domains/{id}
PATCH /api/admin/domains/{id}

GET /api/admin/audit-log
GET /api/admin/oversight
```

The existing public `GET /api/advisors` can remain for non-sensitive display,
but all admin advisor editing and listing should move behind
`/api/admin/advisors*` so the admin console never depends on a public route.

## Firestore Reads and Writes

### Read Collections

Admin APIs may read the following through the Admin SDK after authorization:

| Collection | Purpose | Limits |
|---|---|---|
| Firebase Auth users | identity, provider, disabled, email verified | page at 100 users |
| `users/{uid}` | credits, subscription, onboarding, profile summary | redact provider secrets |
| `users/{uid}/situations/{sid}` | situation metadata and health | drilldown only |
| `users/{uid}/situations/{sid}/tools/{toolId}` | saved tool output metadata | redact oversized bodies by default |
| `users/{uid}/situations/{sid}/graph_updates/{id}` | pending/applied graph proposals | latest 100 |
| `tool_runs` | recent tool activity across users | bounded by time and limit |
| `background_jobs` | worker/cron status | bounded by status and updatedAt |
| `system_events` | operational firehose | bounded by severity/time |
| `credit_transactions` | credit ledger and burn | bounded by uid/time |
| `config/advisors/items` | advisor config | full list allowed |
| `config/advisors_history/items` | advisor versions | per advisor |
| `domains` | domain config | full list allowed |
| `domains_history` | domain versions | per domain |
| `admin_audit_logs` | admin actions and denials | bounded by time |
| `advisor_feed_items` | proposed knowledge updates | bounded by status/time |
| `advisor_feed_runs` | ingestion jobs | bounded by updatedAt |

### Write Collections

Writes must be narrow and auditable:

- `config/advisors/items/{id}`: validated advisor patch only.
- `config/advisors_history/items/{id}_{version}`: append-only prior version.
- `domains/{id}`: validated domain patch only.
- `domains_history/{id}_{version}`: append-only prior version.
- `users/{uid}`: support actions such as disable mirror, credit adjustments,
  support flags, and admin notes.
- `credit_transactions/{id}`: credit adjustments with `actorUid`,
  `actorEmail`, `reason`, and `requestId`.
- `background_jobs/{jobId}`: retry/cancel fields only, with CAS checks.
- `advisor_feed_items/{itemId}`: review status, reviewer, rationale, and
  publish target.
- `admin_audit_logs/{logId}`: append-only for every admin access and action.
- `system_events/{eventId}`: operational event for important admin actions.

No admin API should accept a Firestore path from the client.

## Data Health Panels

The data health dashboard should answer:

- Which feeds are configured at platform level and user level?
- Which feed clients are failing, timing out, or returning empty data?
- Which situations have stale source data?
- Which documents failed parsing, embedding, translation, or extraction?
- Which tool outputs were generated with degraded data?
- Which indexes or scheduled ingestion jobs are missing?

Panels:

- Feed matrix: `resolveFeedCapabilities(null)` platform view plus aggregate
  user-key coverage counts.
- Source freshness: last successful ingest per provider and per situation.
- Document pipeline: uploaded, parsed, embedded, failed, retryable.
- Tool quality: failed tool runs, degraded outputs, missing citations, credit
  burn by tool.
- Data integrity: orphaned tool outputs, graph proposals without situation,
  missing `expiresAt`, missing `profileVersion`, missing `domainVersion`.

## Situation Health

Each situation receives a computed health record returned by
`GET /api/admin/situations/{uid}/{situationId}/health`:

```ts
interface AdminSituationHealth {
  uid: string;
  situationId: string;
  semaphore: 'green' | 'yellow' | 'red';
  staleData: boolean;
  staleDataReasons: string[];
  lastToolRunAt: string | null;
  failedToolRuns7d: number;
  pendingGraphUpdates: number;
  documentFailures: number;
  openNotifications: number;
  feedCoverageScore: number;
  topRisks: Array<{ code: string; label: string; severity: 'warn' | 'error' }>;
}
```

The list view should sort red, then yellow, then stale green situations.

## Observability Panels

Operator Console v2 extends the current console with:

- Queue depth, oldest queued job, and dead-letter count per job kind.
- Cloud Scheduler last run and next run for ingestion and cleanup jobs.
- Worker heartbeat by service account and Cloud Run revision.
- Error budget panel: failures per route, per job kind, per provider.
- Incident timeline from `system_events` filtered to warn/error/critical.
- Drillthrough from event to job, tool run, user, situation, and source doc.
- Build panel: Git SHA, Cloud Run revision, deployedAt, region, service
  account, and active env profile.
- Cost panel: credits burned in 24h/7d, tokens by model, top users by burn.

Every panel must tolerate partial failure. A failed probe returns a red card,
not a failed page.

## Digital Advisor Feed

The advisor knowledge feed ingests vetted material that can improve advisor
personas, source preferences, red lines, prompt fragments, and memory policy.

### Sources

- Internal docs under `docs/` tagged as advisor guidance.
- Public methodology updates from approved organizations.
- Domain-specific source lists and analytical frameworks.
- Operator-authored notes from the admin console.
- Post-incident lessons from `system_events` and failed advisor runs.

### Firestore Model

```ts
interface AdvisorFeedRun {
  runId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  source: 'docs' | 'public-web' | 'operator-note' | 'incident-review';
  startedAt: Timestamp;
  completedAt: Timestamp | null;
  itemCount: number;
  error: { code: string; message: string } | null;
}

interface AdvisorFeedItem {
  itemId: string;
  runId: string;
  advisorId: string | null;
  domainId: string | null;
  title: string;
  sourceUrl: string | null;
  sourceHash: string;
  excerpt: string;
  proposedPatch: Record<string, unknown>;
  rationale: string;
  confidence: number;
  status: 'pending' | 'approved' | 'rejected' | 'published';
  reviewedBy: string | null;
  reviewedAt: Timestamp | null;
  reviewNote: string | null;
  createdAt: Timestamp;
}
```

### Ingestion Flow

1. `POST /api/admin/advisor-feed/ingest` creates an `advisor_feed_runs` row.
2. The worker fetches approved sources, deduplicates by `sourceHash`, and
   writes pending `advisor_feed_items`.
3. Admin reviews each item in `/app/admin/advisor-feed`.
4. Approval validates the proposed patch against the advisor/domain schema.
5. Publish writes to `config/advisors/items/{id}` or `domains/{id}`, snapshots
   the previous version, busts caches, emits `system_events`, and writes
   `admin_audit_logs`.
6. Rejection records a rationale and never deletes the item.

No feed item publishes automatically. Human approval is required.

## Audit Logs

Create `admin_audit_logs/{logId}` as the canonical compliance trail:

```ts
interface AdminAuditLog {
  logId: string;
  requestId: string;
  actorUid: string;
  actorEmail: string;
  action:
    | 'admin.access.allowed'
    | 'admin.access.denied'
    | 'user.read'
    | 'user.credit_adjusted'
    | 'user.disabled'
    | 'user.enabled'
    | 'situation.read'
    | 'advisor.updated'
    | 'advisor.published'
    | 'advisor.rolled_back'
    | 'domain.updated'
    | 'job.retried'
    | 'job.cancelled'
    | 'advisor_feed.ingested'
    | 'advisor_feed.approved'
    | 'advisor_feed.rejected';
  targetType: 'user' | 'situation' | 'advisor' | 'domain' | 'job' | 'feed_item' | 'system';
  targetId: string | null;
  method: string;
  route: string;
  status: number;
  reason: string | null;
  diffSummary: Record<string, unknown> | null;
  ipHash: string | null;
  userAgentHash: string | null;
  createdAt: Timestamp;
  expiresAt: Timestamp;
}
```

Audit invariants:

- Every denied admin API call logs `admin.access.denied`.
- Every successful admin page/API access logs at least one allowed action.
- Every write logs a structured diff summary. Do not store raw secrets or
  full prompt bodies in the diff; store field names, version numbers, and
  hashes for large text.
- Audit log writes are best-effort for read-only endpoints but required for
  mutating endpoints. If a mutating endpoint cannot write its audit row, it
  fails closed.
- Retention is at least 365 days.

## Oversight

The oversight page is the admin console's risk review surface:

- Access review: successful and denied admin attempts by actor.
- Write review: advisor/domain/user mutations since last review.
- Health review: red/yellow probes, dead letters, stale situations.
- Data review: missing TTLs, missing provenance, degraded feed coverage.
- Policy review: App Check rollout status, route auth coverage, admin API
  origin-check coverage.
- Acceptance-gate review: latest build, typecheck, test, route audit, and
  GCP audit status when available from CI/deploy metadata.

## Rollout Phases

### Phase 0 — Lock the Gate

- Set `ADMIN_EMAIL_ALLOWLIST` exactly to the two allowed emails.
- Require verified email for email-based admin.
- Ensure demo users are denied.
- Add admin audit logging middleware/helper.
- Acceptance: non-allowlisted authenticated user receives `403` on every
  `/api/admin/*`; both allowlisted emails receive `200` from `/api/admin/me`.

### Phase 1 — Normalize Admin APIs

- Move advisor admin list/write routes to `/api/admin/advisors*`.
- Add origin checks and request IDs to all admin writes.
- Add pagination to user, audit, situation, and event lists.
- Acceptance: no admin page depends on a non-admin mutating route.

### Phase 2 — User and Situation Drilldowns

- Add `/app/admin/users/[uid]` and situation health views.
- Add bounded cross-user situation listing.
- Add credit adjustment with mandatory reason.
- Acceptance: operator can identify a stale or failing user's situation in
  under three clicks from `/app/admin`.

### Phase 3 — Observability v2

- Add queue, scheduler, worker heartbeat, build, and cost panels.
- Add event drillthrough links.
- Acceptance: every critical `system_events` row can be traced to job, tool
  run, user, or situation when such an id exists.

### Phase 4 — Advisor Feed

- Add feed run/item schemas and review UI.
- Add manual approval and publish flow.
- Acceptance: a feed item can propose an advisor patch, be approved, publish
  a new advisor version, write history, bust cache, and create audit/event
  rows.

### Phase 5 — Oversight and Compliance

- Add oversight dashboard and audit-log review workflow.
- Add periodic review markers.
- Acceptance: admin can export or inspect all admin writes for the last 365
  days without direct Firebase Console access.

## Acceptance Criteria

- Only `giulio@tacitus.me` and `giuliocatanzariti@gmail.com` have admin
  access in production.
- Demo sessions and non-allowlisted authenticated users cannot read admin
  APIs or render sensitive admin data.
- All admin APIs enforce server-side admin checks before Admin SDK reads.
- All admin writes validate payloads, enforce origin checks, and write
  `admin_audit_logs`.
- Mutating admin endpoints fail closed if their audit log cannot be written.
- User, situation, event, job, and audit list endpoints are paginated and
  bounded.
- No API returns secrets, user BYO keys, service account JSON, or raw
  sensitive env values.
- Advisor and domain writes snapshot previous versions before publishing.
- Advisor feed ingestion never auto-publishes; human approval is mandatory.
- Operator console shows users, data, situation health, feed status,
  diagnostics, incidents, jobs, audit logs, and oversight.
- Existing validation remains green after implementation:

```bash
npx tsc --noEmit
npm run build
node scripts/audit-ai-routes.mjs
npx vitest run
npm run audit:gcp
```

## Non-goals

- In-browser shell, code execution, database console, or arbitrary Firestore
  explorer.
- SSO/SAML administration.
- Customer-facing support portal.
- Automatic advisor config publishing from external sources.
