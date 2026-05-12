# C0 — Cognee live: bind the service, verify handlers

## Goal

The `praxis-cognee` Cloud Run service exists. Its boundary code is in
the monolith (`src/lib/knowledge/memory-layer.ts`,
`/api/memory/[...slug]/route.ts`,
`backend/services/cognee_memory.py`). The night pack made the UI
honest about the disconnect (no Cognee badges without a flag).

This file actually turns it on. Bind `COGNEE_BACKEND_URL` and
`COGNEE_ENABLED` in production env, smoke-test the handlers, and
flip the UI flag to live. **Operational work — Codex prepares, GC
executes the deploy steps.**

## Pre-conditions

1. `praxis-cognee` Cloud Run service is healthy
   (`gcloud run services describe praxis-cognee --region=...`).
2. The service has its own service account with Vertex AI + GCS
   permissions (Cognee uses both internally).
3. The monolith Cloud Run service can reach `praxis-cognee` over
   internal traffic.
4. Night-pack `06_COGNEE_HONEST.md` shipped (UI flag-gated).

## Files Codex must read first

- `src/lib/knowledge/memory-layer.ts`
- `src/app/api/memory/[...slug]/route.ts`
- `backend/services/cognee_memory.py`
- `backend/routers/memory.py` (if exists)
- `infrastructure/cloudrun/praxis-cognee/` — existing service config
- `STATUS.md`

## Tasks

### 1. Health-check endpoint on praxis-cognee

If not present, add one to the cognee service:

```python
# praxis-cognee/main.py (or equivalent)

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "version": COGNEE_VERSION,
        "vertex_reachable": await _ping_vertex(),
        "gcs_reachable": await _ping_gcs(),
    }
```

Codex confirms the service responds:

```bash
gcloud run services describe praxis-cognee --region=<region> --format='value(status.url)'
# returns https://praxis-cognee-XXX.run.app

curl -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
  https://praxis-cognee-XXX.run.app/health
# expect 200 with status:ok
```

Document the URL in `STATUS.md`.

### 2. Auth between monolith and praxis-cognee

The monolith needs to call praxis-cognee over a trusted channel.
Three options:

**Option A: Cloud Run service-to-service auth (preferred)**

The monolith's service account gets `roles/run.invoker` on
`praxis-cognee`. Each call from monolith mints an ID token via
the metadata server and includes it as `Authorization: Bearer
<id_token>`.

**Option B: VPC-internal traffic with allow-internal**

Both services in the same VPC; `praxis-cognee` accepts only internal
traffic. Simpler auth (any internal call is trusted).

**Option C: Shared HMAC secret**

Both services share a secret in Secret Manager. Monolith signs a
request hash; praxis-cognee verifies. Works but adds custom code.

**Recommended: Option A**. Standard GCP pattern; no custom auth.

Codex updates `praxis-cognee` deployment config:

```yaml
# infrastructure/cloudrun/praxis-cognee/service.yaml
spec:
  template:
    spec:
      serviceAccountName: praxis-cognee@PROJECT.iam.gserviceaccount.com
  # Allow only authenticated invocations
```

And IAM:

```bash
gcloud run services add-iam-policy-binding praxis-cognee \
  --member='serviceAccount:praxis-monolith@PROJECT.iam.gserviceaccount.com' \
  --role='roles/run.invoker' \
  --region=<region>
```

GC executes the IAM bind. Codex provides the command in `STATUS.md`.

### 3. ID token mint in monolith

In `src/lib/knowledge/cognee-client.ts` (create):

```typescript
import { GoogleAuth } from 'google-auth-library';

const auth = new GoogleAuth();

export async function cogneeFetch(
  pathSuffix: string,
  init: RequestInit = {},
): Promise<Response> {
  const baseUrl = process.env.COGNEE_BACKEND_URL;
  if (!baseUrl) throw new Error('COGNEE_BACKEND_URL not set');

  const targetAudience = baseUrl;
  const client = await auth.getIdTokenClient(targetAudience);
  const idToken = await client.idTokenProvider.fetchIdToken(targetAudience);

  return fetch(`${baseUrl}${pathSuffix}`, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(30000),  // Cognee can be slow
  });
}
```

This works in Cloud Run automatically (uses metadata server). For
local dev, set `GOOGLE_APPLICATION_CREDENTIALS` to a service-account
key JSON, or use Application Default Credentials.

### 4. Update memory-layer to use cogneeFetch

```typescript
// src/lib/knowledge/memory-layer.ts

import { cogneeFetch } from './cognee-client';

const ENABLED = process.env.COGNEE_ENABLED === 'true';

export class MemoryLayer {
  static get isEnabled(): boolean { return ENABLED; }

  async cognify(payload: CognifyRequest): Promise<CognifyResponse> {
    if (!ENABLED) {
      return { stored: false, reason: 'cognee disabled' };
    }
    const res = await cogneeFetch('/api/v1/cognify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error('cognee cognify failed', res.status, await res.text());
      return { stored: false, reason: `upstream ${res.status}` };
    }
    return await res.json();
  }

  async recall(payload: RecallRequest): Promise<RecallResponse> {
    if (!ENABLED) {
      return { results: [], reason: 'cognee disabled' };
    }
    const res = await cogneeFetch('/api/v1/recall', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error('cognee recall failed', res.status);
      return { results: [], reason: `upstream ${res.status}` };
    }
    return await res.json();
  }

  // search, forget, etc.
}
```

### 5. Smoke-test endpoint

`src/app/api/admin/cognee-smoke/route.ts`:

```typescript
import { withAuth } from '@/lib/api/with-auth';
import { MemoryLayer } from '@/lib/knowledge/memory-layer';

export const POST = withAuth(async (req, user) => {
  // Only owners (defense — also gate by env in prod)
  if (!user.roles.includes('owner') && !user.email.endsWith('@tacitus.me')) {
    return Response.json({ error: 'forbidden' }, { status: 403 });
  }

  const layer = new MemoryLayer();
  const t0 = Date.now();
  const cognify = await layer.cognify({
    caseId: 'smoke-test',
    text: 'PRAXIS Cognee smoke test at ' + new Date().toISOString(),
    metadata: { kind: 'smoke', uid: user.uid },
  });
  const t1 = Date.now();
  const recall = await layer.recall({
    caseId: 'smoke-test',
    query: 'PRAXIS smoke test',
    limit: 3,
  });
  const t2 = Date.now();

  return Response.json({
    enabled: MemoryLayer.isEnabled,
    cognify: { ...cognify, latencyMs: t1 - t0 },
    recall: { ...recall, latencyMs: t2 - t1 },
    backendUrl: process.env.COGNEE_BACKEND_URL?.replace(/(https?:\/\/[^.]+).*/, '$1...'),
  });
});
```

Document the smoke test in `STATUS.md`. Run after every deploy that
touches Cognee config.

### 6. Rate-limit budget

Cognee can be expensive (it pulls Vertex calls). Two protections:

- **Per-case budget**: max 50 cognify calls / case / day.
- **Per-org budget**: max 500 recall calls / org / day.

Implement in `cogneeFetch` with a Firestore counter:

```typescript
async function checkBudget(uid: string, orgId: string, kind: 'cognify' | 'recall'): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);
  const docRef = adminFirestore()
    .collection('cognee_budgets').doc(orgId).collection('days').doc(today);
  const doc = await docRef.get();
  const count = (doc.data()?.[kind] ?? 0) + 1;
  const limit = kind === 'cognify' ? 50 : 500;
  if (count > limit) return false;
  await docRef.set({ [kind]: count }, { merge: true });
  return true;
}
```

Bypass for owner-tier accounts; expose budget metric to the audit
log (action `cognee.budget-exceeded`).

### 7. Flag flip (operational)

Production env update:

```bash
COGNEE_ENABLED=true
COGNEE_BACKEND_URL=https://praxis-cognee-XXX.run.app
```

GC sets these in Cloud Run via console or `gcloud run services update`.
Codex provides the exact commands in `STATUS.md`.

### 8. UI flag flips to live

In `src/lib/feature-flags.ts` (or wherever the flag from night pack
06 lives):

```typescript
export function useCogneeEnabled(): boolean {
  // Was always returning false during the gate period.
  // Now reads server-provided flag from the user context.
  return cogneeFlagFromServer();
}
```

The server reads `process.env.COGNEE_ENABLED` and includes it in the
authed user context (`AuthenticatedUser.featureFlags.cognee`).

### 9. Audit: `audit:cognee-config`

```typescript
// scripts/audit-cognee-config.ts
// Static-marker. Confirms:
//   - cognee-client.ts exists and imports google-auth-library
//   - memory-layer.ts uses cogneeFetch (not raw fetch)
//   - smoke endpoint exists
//   - feature flag plumbing reads COGNEE_ENABLED
```

Add to `audit:gate`.

### 10. Documentation

Update `docs/architecture/MEMORY_LAYER.md` (create if missing):

```markdown
# PRAXIS Memory Layer (Cognee)

## Role

Cognee provides per-case associative memory: ingest text/events
during a case, recall relevant context when running hero tools.

## Boundary

Frontend calls /api/memory/* in the Next monolith. The monolith
proxies to praxis-cognee Cloud Run via authenticated calls. Cognee
internally uses Vertex AI + GCS; PRAXIS code does not touch those
directly.

## Production state

- COGNEE_ENABLED=true
- COGNEE_BACKEND_URL=https://praxis-cognee-XXX.run.app
- Auth: Cloud Run service-to-service ID tokens.
- Rate limits: 50 cognify/case/day, 500 recall/org/day.

## Smoke test

POST /api/admin/cognee-smoke as an owner-tier user. Expects
cognify+recall both succeed with latency < 5s each.

## When something goes wrong

If recall times out: the hero tool falls back to
`memory_layer_disabled` mode and emits a warning in calibration
diagnostics. User-visible label: "Memory layer offline."
```

## Acceptance criteria

1. `praxis-cognee` health endpoint returns 200.
2. Service-to-service auth bound (or VPC alternative documented).
3. `cogneeFetch` helper uses ID-token auth.
4. `MemoryLayer.cognify` and `recall` route through `cogneeFetch`.
5. Smoke endpoint returns success with reasonable latency.
6. Rate-limit budget enforced.
7. `COGNEE_ENABLED=true` and `COGNEE_BACKEND_URL` set in production.
8. UI flag flips to live; Cognee badges visible in workbench.
9. `audit:cognee-config` passes.
10. Documentation updated.

## Diagnostics

```bash
# 1. Service health
gcloud run services describe praxis-cognee --region=<region> --format='value(status.url)'
curl -H "Authorization: Bearer $(gcloud auth print-identity-token)" $(URL)/health

# 2. Smoke test (after deploy)
curl -H "Authorization: Bearer $(SESSION_TOKEN)" \
  -X POST https://praxis.tacitus.me/api/admin/cognee-smoke
# expect: enabled=true, cognify.stored=true, recall.results length > 0

# 3. Audit
npm run audit:cognee-config && echo OK

# 4. Build
npm run build && echo OK

# 5. Confirm production env
gcloud run services describe praxis-monolith --region=<region> \
  --format='value(spec.template.spec.containers[0].env)' | grep COGNEE
```

## If Codex stops short

**Failure mode A**: Smoke test returns `enabled=false`. Re-prompt:

> "COGNEE_ENABLED is unset in this environment. Confirm it's set in
> Cloud Run's monolith service env. If GC hasn't done the env update,
> document the exact gcloud command in STATUS.md and stop."

**Failure mode B**: Smoke test times out. Re-prompt:

> "Confirm the monolith's service account has roles/run.invoker on
> praxis-cognee. Run:
>   gcloud run services get-iam-policy praxis-cognee --region=...
> If the binding is missing, document the bind command in STATUS.md.
> If present, check VPC routing: monolith and cognee both in same VPC
> connector?"

**Failure mode C**: Cognify succeeds, recall returns empty. Re-prompt:

> "Cognee may have eventual-consistency between cognify and recall.
> Add a 2-second sleep in the smoke test between the two calls.
> If still empty, the issue is in the cognee service itself —
> check its logs:
>   gcloud run services logs read praxis-cognee --region=...
> Surface the error in STATUS.md."

**Failure mode D**: Budget logic blocks legitimate use. Re-prompt:

> "Tune the budget: 50 cognify/case/day is for early days. If a real
> case is ingesting docs and hits the limit, raise to 200. Owner-tier
> accounts get 5x. Add a budget-overage alert that posts to the audit
> log. Don't drop user requests silently."

## Commit (operational steps separate from code)

```
feat(C0): cognee live binding

Wires praxis-cognee Cloud Run service into the monolith via
service-to-service ID-token auth. Adds cogneeFetch helper, updates
MemoryLayer to route through it, exposes /api/admin/cognee-smoke
for verification, enforces per-case and per-org rate limits.

Production deploy steps documented in STATUS.md:
- IAM bind (run.invoker)
- COGNEE_BACKEND_URL env
- COGNEE_ENABLED=true env

audit:cognee-config gates the contract.

Refs: V2_WORK_PACK/C0_COGNEE_LIVE.md
```
