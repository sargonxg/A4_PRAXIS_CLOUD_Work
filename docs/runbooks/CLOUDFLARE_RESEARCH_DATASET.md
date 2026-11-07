# Private Cloudflare research connection

PRAXIS remains a Google Cloud application. The optional server-side adapter reads the existing private Cloudflare Worker; it does not move canonical capsules to D1 or expose the private dataset to ordinary users.

## Verified on November 7, 2026

- Cloudflare account API authentication and read-only D1 queries succeeded.
- `tacitus-research-v16` contains 120,576 events, 15,272 annual indicators, 55 source profiles and five semantic lenses. Actual table counts matched the stored snapshot metadata.
- `gc-personal-private` binds that database as `RESEARCH_DB`. Its versioned read-only API is `/api/research/*`, behind whole-host Cloudflare Access.
- Snapshot: `9d1f965e9abbeb9eb86e7eb36cdafca20cf453309ec0b2d879a41b48963a8369`; historical coverage 2000–2025. This is not a current news feed.
- R2 returned Cloudflare error 10042 (not enabled). This reader needs no R2 bucket.

These checks establish database availability. They do not establish a deployed PRAXIS connection, model grounding, analytical quality or customer access.

## Configure the existing private boundary

Mount these **server-only** values in the frontend Cloud Run service through Secret Manager and the existing deployment process:

| Variable | Purpose |
| --- | --- |
| `PRAXIS_RESEARCH_API_ORIGIN` | `https://gc-personal-private.giuliocatanzariti.workers.dev` |
| `PRAXIS_RESEARCH_ACCESS_CLIENT_ID` | Access service-token client ID |
| `PRAXIS_RESEARCH_ACCESS_CLIENT_SECRET` | Access service-token secret |

The existing Access application must explicitly permit that service token with a Service Auth policy. Preserve its existing human-access policies. Do not use a bypass policy, a browser-exposed variable or a Cloudflare account administrator token. Scope the token to this application and rotate through the existing secret lifecycle. No service token was created in this code change.

## Verify in order

1. From the PRAXIS server, request the private Worker's `/api/research/status` with both Access headers. Require JSON `api_version=policy-research-db/1`, `status=ready`, `backend=d1`, `read_only=true` and the expected snapshot ID. An Access login page is a failed connection.
2. As a verified PRAXIS admin, GET `/api/admin/research-dataset` (status), then `?resource=events&country=SY&from=2020-01-01&to=2020-12-31&limit=5`. Preserve each result's provenance and pagination cursor.
3. Confirm a non-admin and sample account receive 403; an unauthenticated session receives 401. The route uses the existing authenticated session and admin-principal gates.
4. Remove one service credential in staging. Expect `RESEARCH_UNCONFIGURED` with 503, with no fallback presented as connected data.

Allowed resources: status, datasets, provenance, lenses, events, aggregates, sources and indicators. Request URLs and response sizes are bounded. Redirects are refused, Access credentials are never sent to a redirected origin, responses are private/no-store, and upstream diagnostic bodies are not returned.

## Interpretation and next integration gate

Historical event absence is not evidence of no violence. Preserve provider country labels, date/geographic precision, raw-record digests, attribution and low/best/high estimates. Annual indicators remain separate observations; they do not establish event-level causation.

The admin reader does not automatically inject data into Ask or promote claims into capsules. A later scoped integration must carry source IDs, snapshot IDs, filters, retrieval time, limitations and reviewed claim links through the existing capsule proposal and calibration boundary. Enable wider distribution only with an explicit dataset access policy and an authenticated source-to-answer acceptance test.
