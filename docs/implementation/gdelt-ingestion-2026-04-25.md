# GDELT Ingestion — Implementation Playbook for PRAXIS

**Target file location:** `docs/implementation/gdelt-ingestion-2026-04-25.md`
**Owner:** Backend / data-feeds
**Related:** R3 of the Decision Brief (2026-04-25)
**Existing scaffold:** `cloud_functions/gdelt_poller`, `src/lib/data-feeds/`, `src/lib/knowledge/feed-layer.ts`

---

## 0 · What we're building & why

GDELT GKG (Global Knowledge Graph) publishes a new file every 15 minutes containing themes, persons, organizations, locations, tone, and embedded knowledge graph triplets extracted from worldwide news. Google maintains a free, fully-mirrored BigQuery copy at `gdelt-bq.gdeltv2.*` updated on the same 15-minute cadence.

PRAXIS needs three things from this firehose:

1. **Per-situation event feed** — when a user opens a situation for "Sudan", we show the latest GDELT events relevant to Sudan.
2. **Density / heatmap visualization** — global event density over time, filtered by themes (e.g., `PROTEST`, `KILL`).
3. **ACO entity extraction signal** — feed GDELT entities (persons, organizations) into the Situation Knowledge Core graph layer.

We will **not** mirror the whole GKG into our own BigQuery (too expensive for current scale). Instead we use a **two-tier pull pattern**:

| Tier | Mechanism | Purpose | Latency | Cost |
|---|---|---|---|---|
| **T1 — Direct query** | Server-side query of `gdelt-bq.gdeltv2.gkg_partitioned` with 15-min cache in Firestore | Per-situation reads, ad-hoc analyst queries | ~2-4s cold, sub-200ms cached | First 1 TB/mo free |
| **T2 — Hot materialized slice** | Cloud Run Job every 15 min materializes last 7 days into `praxis_analytics.gdelt_situation_events` for *active* situations only | Real-time dashboard updates | Sub-second | ~$2–5/mo at MVP scale |

We ship T1 today; we add T2 once we have 10+ active situations.

---

## 1 · Prerequisites

```bash
# Verify environment
gcloud config set project praxisbytacitus
gcloud config set run/region us-central1
gcloud auth application-default login

# Required APIs (enable once)
gcloud services enable \
  bigquery.googleapis.com \
  bigquerydatatransfer.googleapis.com \
  cloudscheduler.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com

# Confirm BigQuery access to public dataset (no setup needed; just verify)
bq query --use_legacy_sql=false --max_rows=1 \
'SELECT GKGRECORDID FROM `gdelt-bq.gdeltv2.gkg_partitioned`
 WHERE _PARTITIONTIME >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR) LIMIT 1'
```

If the verification query returns a row, your default credentials already have `bigquery.jobs.create` and access to public data. If it errors with `403`, grant your user `roles/bigquery.jobUser`.

---

## 2 · Service accounts & IAM

We need **two** dedicated service accounts:

| SA | Purpose | Roles |
|---|---|---|
| `praxis-gdelt-poller@praxisbytacitus.iam.gserviceaccount.com` | Cloud Run Job that materializes hot slice (T2) | `roles/bigquery.jobUser`, `roles/bigquery.dataEditor` (scoped to `praxis_analytics`), `roles/secretmanager.secretAccessor` |
| `praxis-gdelt-reader@praxisbytacitus.iam.gserviceaccount.com` | Backend Cloud Run service to query GDELT for T1 | `roles/bigquery.jobUser`, `roles/bigquery.dataViewer` (scoped to `praxis_analytics`) |

```bash
# Create SAs
gcloud iam service-accounts create praxis-gdelt-poller \
  --display-name="PRAXIS GDELT Poller" \
  --description="Materializes hot GDELT slice into praxis_analytics every 15 min"

gcloud iam service-accounts create praxis-gdelt-reader \
  --display-name="PRAXIS GDELT Reader" \
  --description="Backend reader for GDELT — public dataset + materialized slice"

# Project-level minimal grants
for SA in praxis-gdelt-poller praxis-gdelt-reader; do
  gcloud projects add-iam-policy-binding praxisbytacitus \
    --member="serviceAccount:${SA}@praxisbytacitus.iam.gserviceaccount.com" \
    --role="roles/bigquery.jobUser" \
    --condition=None
done

# Dataset-scoped grants (least privilege) — applied via dataset policy
bq update --dataset \
  --description="PRAXIS analytics — GDELT shadow + analyst-derived tables" \
  praxisbytacitus:praxis_analytics

# (We bind dataEditor via bq query below — gcloud CLI does not yet support
# dataset-scoped IAM directly, so use bq's dataset access controls.)
bq show --format=prettyjson praxisbytacitus:praxis_analytics > /tmp/dataset.json

# Append entries to the access[] array, then push back:
# {"role": "WRITER", "userByEmail": "praxis-gdelt-poller@praxisbytacitus.iam.gserviceaccount.com"}
# {"role": "READER", "userByEmail": "praxis-gdelt-reader@praxisbytacitus.iam.gserviceaccount.com"}
bq update --source /tmp/dataset.json praxisbytacitus:praxis_analytics
```

**Verification:**

```bash
gcloud iam service-accounts get-iam-policy \
  praxis-gdelt-poller@praxisbytacitus.iam.gserviceaccount.com
```

---

## 3 · Phase 1 — Ship the direct-query path today

### 3.1 BigQuery view for filtered situation queries

Create a saved logical view that encapsulates partition pruning + standard projection. This stops every dev from forgetting `_PARTITIONTIME` and burning the free tier.

```sql
-- File: infrastructure/bigquery/views/v_gdelt_recent_gkg.sql
CREATE OR REPLACE VIEW `praxisbytacitus.praxis_analytics.v_gdelt_recent_gkg` AS
SELECT
  GKGRECORDID                                        AS gkg_record_id,
  PARSE_TIMESTAMP('%Y%m%d%H%M%S', CAST(DATE AS STRING)) AS event_ts,
  V2Locations                                        AS locations_raw,
  V2Themes                                           AS themes_raw,
  V2Persons                                          AS persons_raw,
  V2Organizations                                    AS organizations_raw,
  V2Tone                                             AS tone_raw,
  V2EnhancedDates                                    AS enhanced_dates_raw,
  DocumentIdentifier                                 AS source_url,
  SourceCommonName                                   AS source_domain,
  -- pre-extracted helpers
  REGEXP_EXTRACT(V2Locations, r'^[2-5]#[^#]*#([A-Z]{2})#') AS country_code,
  SAFE_CAST(SPLIT(V2Tone, ',')[OFFSET(0)] AS FLOAT64)     AS tone_score
FROM `gdelt-bq.gdeltv2.gkg_partitioned`
WHERE _PARTITIONTIME >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY);
```

Apply it:

```bash
bq query --use_legacy_sql=false < infrastructure/bigquery/views/v_gdelt_recent_gkg.sql
```

> The `_PARTITIONTIME` filter is **inside the view** so any downstream query inherits it — this is your primary cost guardrail. If a developer writes `SELECT * FROM v_gdelt_recent_gkg WHERE country_code = 'SD'`, it scans only 7 days of partitions, not all of GDELT 2.0.

### 3.2 TypeScript client — `src/lib/data-feeds/gdelt-client.ts`

This file already exists per the repo layout. Replace its body (or merge into the existing module) with the canonical client below. Conventions followed:

- Reads via the **server-side** `BigQuery` client only (never client-side; SA credentials never reach the browser).
- Returns the strict `GdeltEvent` type used by `feed-layer.ts`.
- Caches results in Firestore for 15 minutes (TTL == GDELT cadence).

```typescript
// src/lib/data-feeds/gdelt-client.ts
import { BigQuery } from '@google-cloud/bigquery';
import { adminFirestore } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export type GdeltEvent = {
  gkgRecordId: string;
  eventTs: string;          // ISO
  countryCode: string | null;
  themes: string[];
  persons: string[];
  organizations: string[];
  toneScore: number | null;
  sourceUrl: string;
  sourceDomain: string;
};

const bq = new BigQuery({ projectId: 'praxisbytacitus' });

const CACHE_COLL = '_caches/gdelt';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 min == GDELT cadence

export type GdeltQueryParams = {
  countryCodes?: string[];        // ISO-2, e.g. ['SD','SS']
  themes?: string[];              // e.g. ['PROTEST','KILL','REFUGEES']
  daysBack?: number;              // default 7, max 7 (view limit)
  limit?: number;                 // default 200, max 1000
};

function cacheKey(p: GdeltQueryParams): string {
  return Buffer.from(JSON.stringify({
    c: (p.countryCodes ?? []).sort(),
    t: (p.themes ?? []).sort(),
    d: p.daysBack ?? 7,
    l: p.limit ?? 200,
  })).toString('base64url');
}

export async function queryGdeltGkg(
  params: GdeltQueryParams,
): Promise<{ events: GdeltEvent[]; cached: boolean }> {
  const key = cacheKey(params);
  const ref = adminFirestore.doc(`${CACHE_COLL}/${key}`);

  const snap = await ref.get();
  if (snap.exists) {
    const doc = snap.data()!;
    if (Date.now() - doc.cachedAt.toMillis() < CACHE_TTL_MS) {
      return { events: doc.events as GdeltEvent[], cached: true };
    }
  }

  const limit = Math.min(params.limit ?? 200, 1000);
  const daysBack = Math.min(params.daysBack ?? 7, 7);

  // Build dynamic predicates
  const wheres: string[] = [
    `event_ts >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL @daysBack DAY)`,
  ];
  const queryParams: Record<string, unknown> = { daysBack, limit };

  if (params.countryCodes?.length) {
    wheres.push('country_code IN UNNEST(@countries)');
    queryParams.countries = params.countryCodes;
  }
  if (params.themes?.length) {
    // V2Themes is a comma-separated string of theme tokens with offsets
    wheres.push(
      `EXISTS (SELECT 1 FROM UNNEST(@themes) AS th WHERE STRPOS(themes_raw, th) > 0)`,
    );
    queryParams.themes = params.themes;
  }

  const sql = `
    SELECT
      gkg_record_id,
      FORMAT_TIMESTAMP('%FT%H:%M:%SZ', event_ts) AS event_ts,
      country_code,
      themes_raw,
      persons_raw,
      organizations_raw,
      tone_score,
      source_url,
      source_domain
    FROM \`praxisbytacitus.praxis_analytics.v_gdelt_recent_gkg\`
    WHERE ${wheres.join(' AND ')}
    ORDER BY event_ts DESC
    LIMIT @limit
  `;

  const [rows] = await bq.query({
    query: sql,
    params: queryParams,
    location: 'us-central1',
    maximumBytesBilled: '10000000000', // 10 GB hard cap per query
  });

  const events: GdeltEvent[] = rows.map((r) => ({
    gkgRecordId: r.gkg_record_id,
    eventTs: r.event_ts,
    countryCode: r.country_code ?? null,
    themes: parseThemes(r.themes_raw),
    persons: parseSemicolonList(r.persons_raw),
    organizations: parseSemicolonList(r.organizations_raw),
    toneScore: r.tone_score ?? null,
    sourceUrl: r.source_url,
    sourceDomain: r.source_domain,
  }));

  await ref.set({ events, cachedAt: Timestamp.now() });
  return { events, cached: false };
}

function parseThemes(raw: string | null): string[] {
  if (!raw) return [];
  // Format: "THEME,offset;THEME,offset;..."
  const set = new Set<string>();
  for (const part of raw.split(';')) {
    const [theme] = part.split(',');
    if (theme) set.add(theme.trim());
  }
  return Array.from(set);
}

function parseSemicolonList(raw: string | null): string[] {
  if (!raw) return [];
  // V2Persons format: "Name1,offset;Name2,offset;..."
  const set = new Set<string>();
  for (const part of raw.split(';')) {
    const [name] = part.split(',');
    if (name) set.add(name.trim());
  }
  return Array.from(set).slice(0, 50); // cap for sanity
}
```

### 3.3 API route — `src/app/api/feeds/gdelt/route.ts`

Follows the standard PRAXIS API route pattern (`withAuth`, validation, no credit deduction since this is a cheap read).

```typescript
// src/app/api/feeds/gdelt/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { validateAiRequest } from '@/lib/api/validate-request';
import { queryGdeltGkg } from '@/lib/data-feeds/gdelt-client';

export const maxDuration = 30;

const requestSchema = z.object({
  countryCodes: z.array(z.string().length(2)).max(10).optional(),
  themes: z.array(z.string().max(64)).max(20).optional(),
  daysBack: z.number().int().min(1).max(7).optional(),
  limit: z.number().int().min(1).max(1000).optional(),
});

export const POST = withAuth(async (req) => {
  try {
    const body = await req.json();
    const validation = validateAiRequest(body, requestSchema);
    if (!validation.success) return validation.response;

    const { events, cached } = await queryGdeltGkg(validation.data);

    return NextResponse.json(
      { events, cached, count: events.length },
      {
        headers: {
          'Cache-Control': cached
            ? 'public, max-age=900, s-maxage=900'
            : 'public, max-age=60, s-maxage=900',
        },
      },
    );
  } catch (err) {
    return handleRouteError(err, 'feeds/gdelt');
  }
});
```

### 3.4 Wire into the SKC feed-layer

`src/lib/knowledge/feed-layer.ts` already defines the canonical interface for situation feeds. Add a `refreshGdeltSlice` function that pulls relevant events for a situation and stores a snapshot.

```typescript
// src/lib/knowledge/feed-layer.ts (add this function)
import { queryGdeltGkg, type GdeltEvent } from '@/lib/data-feeds/gdelt-client';
import { adminFirestore } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function refreshGdeltSlice(
  uid: string,
  situationId: string,
): Promise<{ added: number; total: number }> {
  // Read situation metadata to derive filters
  const sitRef = adminFirestore
    .doc(`users/${uid}/situations/${situationId}/metadata/main`);
  const sitSnap = await sitRef.get();
  if (!sitSnap.exists) {
    throw new Error(`Situation ${situationId} not found for user ${uid}`);
  }
  const sit = sitSnap.data()!;

  const { events } = await queryGdeltGkg({
    countryCodes: sit.countryCodes ?? [],
    themes: sit.gdeltThemes ?? ['PROTEST', 'KILL', 'REFUGEES', 'MIL_*'],
    daysBack: 7,
    limit: 500,
  });

  const feedRef = adminFirestore
    .collection(`users/${uid}/situations/${situationId}/feeds/gdelt/events`);

  // Idempotent upsert keyed by gkgRecordId
  const batch = adminFirestore.batch();
  let added = 0;
  for (const ev of events) {
    const docRef = feedRef.doc(ev.gkgRecordId.replace(/[^A-Za-z0-9_-]/g, '_'));
    batch.set(
      docRef,
      { ...ev, ingestedAt: Timestamp.now() },
      { merge: true },
    );
    added += 1;
  }
  await batch.commit();

  // Update feed-layer index doc
  await adminFirestore
    .doc(`users/${uid}/situations/${situationId}/feeds/gdelt`)
    .set(
      {
        lastRefreshAt: Timestamp.now(),
        lastBatchCount: added,
        totalCount: (sit.gdeltTotalCount ?? 0) + added,
      },
      { merge: true },
    );

  return { added, total: events.length };
}
```

### 3.5 Cron route — refresh on a schedule

We use the existing `/api/cron/*` pattern (CRON_SECRET-protected). Cloud Scheduler hits this route every 15 min and the route fans out to all active situations.

```typescript
// src/app/api/cron/refresh-gdelt-feeds/route.ts
import { NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';
import { refreshGdeltSlice } from '@/lib/knowledge/feed-layer';

export const maxDuration = 300; // 5 min ceiling for the fan-out

export async function POST(req: Request) {
  // Bearer-token auth (Cloud Scheduler OIDC OR shared secret)
  const auth = req.headers.get('authorization') ?? '';
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Find all situations marked active in the last 7 days
  const ACTIVE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
  const cutoff = new Date(Date.now() - ACTIVE_WINDOW_MS);

  const snap = await adminFirestore
    .collectionGroup('metadata')
    .where('lastOpenedAt', '>=', cutoff)
    .get();

  const results: Array<{ uid: string; sid: string; added: number }> = [];
  for (const doc of snap.docs) {
    const path = doc.ref.path; // users/{uid}/situations/{sid}/metadata/main
    const m = path.match(/^users\/([^/]+)\/situations\/([^/]+)\/metadata\//);
    if (!m) continue;
    const [, uid, sid] = m;
    try {
      const { added } = await refreshGdeltSlice(uid, sid);
      results.push({ uid, sid, added });
    } catch (e) {
      console.error(`gdelt refresh failed for ${uid}/${sid}:`, e);
    }
  }

  return NextResponse.json({
    refreshed: results.length,
    results,
  });
}
```

Schedule it:

```bash
# 1) Create CRON_SECRET if not already in Secret Manager
gcloud secrets create cron-secret --replication-policy=automatic 2>/dev/null || true
echo -n "$(openssl rand -hex 32)" | \
  gcloud secrets versions add cron-secret --data-file=-

# 2) Create the Cloud Scheduler job (every 15 min)
gcloud scheduler jobs create http refresh-gdelt-feeds \
  --location=us-central1 \
  --schedule="*/15 * * * *" \
  --time-zone="UTC" \
  --uri="https://praxis.tacitus.me/api/cron/refresh-gdelt-feeds" \
  --http-method=POST \
  --headers="Authorization=Bearer $(gcloud secrets versions access latest --secret=cron-secret)" \
  --attempt-deadline=300s \
  --max-retry-attempts=2
```

> **Convention reminder:** `CRON_SECRET` must already be set as an env var on the `praxis-frontend` Cloud Run service. If not, add it to `cloudbuild.yaml` under the env section.

### 3.6 Frontend hook — `src/hooks/useGdeltFeed.ts`

```typescript
// src/hooks/useGdeltFeed.ts
import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth/auth-context';
import type { GdeltEvent } from '@/lib/data-feeds/gdelt-client';

export function useGdeltFeed(situationId: string, opts?: { limit?: number }) {
  const { user } = useAuth();
  const [events, setEvents] = useState<GdeltEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !situationId) return;
    const q = query(
      collection(
        db,
        'users', user.uid, 'situations', situationId, 'feeds', 'gdelt', 'events',
      ),
      orderBy('eventTs', 'desc'),
      limit(opts?.limit ?? 50),
    );
    const unsub = onSnapshot(q, (snap) => {
      setEvents(snap.docs.map((d) => d.data() as GdeltEvent));
      setLoading(false);
    });
    return () => unsub();
  }, [user, situationId, opts?.limit]);

  return { events, loading };
}
```

### 3.7 Verification (run after Phase 1 deploy)

```bash
# 1) BigQuery view exists
bq show --view praxisbytacitus:praxis_analytics.v_gdelt_recent_gkg

# 2) Direct query works (smoke test as the reader SA)
gcloud auth application-default login --impersonate-service-account=\
  praxis-gdelt-reader@praxisbytacitus.iam.gserviceaccount.com

bq query --use_legacy_sql=false --max_rows=5 \
'SELECT country_code, COUNT(*) c
 FROM `praxisbytacitus.praxis_analytics.v_gdelt_recent_gkg`
 WHERE country_code = "SD"
 GROUP BY country_code'

# 3) API route smoke test (replace with real session cookie)
curl -X POST https://praxis.tacitus.me/api/feeds/gdelt \
  -H "Cookie: __session=..." \
  -H "Content-Type: application/json" \
  -d '{"countryCodes":["SD"],"themes":["PROTEST","KILL"],"limit":10}'

# 4) Cron route manual trigger
curl -X POST https://praxis.tacitus.me/api/cron/refresh-gdelt-feeds \
  -H "Authorization: Bearer $(gcloud secrets versions access latest --secret=cron-secret)"

# 5) Confirm Firestore writes appeared
gcloud firestore documents list \
  "users/<UID>/situations/<SID>/feeds/gdelt/events" --limit=5
```

Phase 1 is complete when (a) the API route returns events for `countryCodes:["SD"]`, (b) the cron route writes to Firestore, and (c) `useGdeltFeed` renders events on a situation page within 60 s of opening it.

---

## 4 · Phase 2 — Materialize the hot slice (after MVP)

Trigger: ≥10 active situations, OR the per-request BigQuery cost crosses ~$1/day, OR the dashboard becomes noticeably slow on cache miss.

### 4.1 Create the shadow table

```sql
-- File: infrastructure/bigquery/tables/gdelt_situation_events.sql
CREATE TABLE IF NOT EXISTS `praxisbytacitus.praxis_analytics.gdelt_situation_events`
(
  gkg_record_id      STRING NOT NULL,
  event_ts           TIMESTAMP NOT NULL,
  country_code       STRING,
  themes             ARRAY<STRING>,
  persons            ARRAY<STRING>,
  organizations      ARRAY<STRING>,
  tone_score         FLOAT64,
  source_url         STRING,
  source_domain      STRING,
  -- multi-tenant:
  situation_ids      ARRAY<STRING>,    -- which situations this event maps to
  ingested_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY DATE(event_ts)
CLUSTER BY country_code, source_domain
OPTIONS (
  description = "Hot 7-day GDELT slice for active PRAXIS situations",
  partition_expiration_days = 90,
  require_partition_filter = true
);
```

`require_partition_filter = true` is the cost guardrail: any query that forgets `WHERE event_ts >= ...` fails with a clear error rather than scanning all partitions.

### 4.2 The Cloud Run Job — `cloud_functions/gdelt_poller`

```python
# cloud_functions/gdelt_poller/main.py
"""GDELT hot-slice materializer. Runs every 15 min via Cloud Scheduler."""
import os
import logging
from datetime import datetime, timedelta, timezone

from google.cloud import bigquery, firestore

PROJECT = "praxisbytacitus"
DATASET = "praxis_analytics"
TABLE = "gdelt_situation_events"
ACTIVE_WINDOW_DAYS = 7

bq = bigquery.Client(project=PROJECT)
fs = firestore.Client(project=PROJECT)
log = logging.getLogger("gdelt_poller")
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))


def collect_active_situation_filters() -> dict:
    """Return aggregated country codes + themes across all active situations."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=ACTIVE_WINDOW_DAYS)
    docs = fs.collection_group("metadata") \
             .where("lastOpenedAt", ">=", cutoff) \
             .stream()

    countries: set[str] = set()
    themes: set[str] = set()
    situations: list[tuple[str, list[str], list[str]]] = []

    for doc in docs:
        data = doc.to_dict() or {}
        path = doc.reference.path  # users/{uid}/situations/{sid}/metadata/main
        parts = path.split("/")
        if len(parts) < 6 or parts[0] != "users":
            continue
        sid = parts[3]
        cc = data.get("countryCodes") or []
        th = data.get("gdeltThemes") or ["PROTEST", "KILL", "REFUGEES"]
        countries.update(cc)
        themes.update(th)
        situations.append((sid, cc, th))

    return {
        "countries": sorted(countries),
        "themes": sorted(themes),
        "situations": situations,
    }


def materialize_slice(filters: dict) -> int:
    """Pull last 15 min of GKG matching filters, MERGE into shadow table."""
    if not filters["countries"]:
        log.info("No active situations with countries — nothing to materialize.")
        return 0

    sql = """
    MERGE `praxisbytacitus.praxis_analytics.gdelt_situation_events` T
    USING (
      WITH src AS (
        SELECT
          GKGRECORDID                                            AS gkg_record_id,
          PARSE_TIMESTAMP('%Y%m%d%H%M%S', CAST(DATE AS STRING))  AS event_ts,
          REGEXP_EXTRACT(V2Locations, r'^[2-5]#[^#]*#([A-Z]{2})#') AS country_code,
          V2Themes                                               AS themes_raw,
          V2Persons                                              AS persons_raw,
          V2Organizations                                        AS organizations_raw,
          SAFE_CAST(SPLIT(V2Tone, ',')[OFFSET(0)] AS FLOAT64)    AS tone_score,
          DocumentIdentifier                                     AS source_url,
          SourceCommonName                                       AS source_domain
        FROM `gdelt-bq.gdeltv2.gkg_partitioned`
        WHERE _PARTITIONTIME >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 MINUTE)
          AND REGEXP_EXTRACT(V2Locations, r'^[2-5]#[^#]*#([A-Z]{2})#')
              IN UNNEST(@countries)
      )
      SELECT
        gkg_record_id, event_ts, country_code,
        ARRAY(
          SELECT DISTINCT TRIM(SPLIT(t, ',')[SAFE_OFFSET(0)])
          FROM UNNEST(SPLIT(themes_raw, ';')) AS t
          WHERE t IS NOT NULL AND t != ''
        ) AS themes,
        ARRAY(
          SELECT DISTINCT TRIM(SPLIT(p, ',')[SAFE_OFFSET(0)])
          FROM UNNEST(SPLIT(persons_raw, ';')) AS p
          WHERE p IS NOT NULL AND p != ''
        ) AS persons,
        ARRAY(
          SELECT DISTINCT TRIM(SPLIT(o, ',')[SAFE_OFFSET(0)])
          FROM UNNEST(SPLIT(organizations_raw, ';')) AS o
          WHERE o IS NOT NULL AND o != ''
        ) AS organizations,
        tone_score, source_url, source_domain,
        [] AS situation_ids,                  -- backfilled below
        CURRENT_TIMESTAMP() AS ingested_at
      FROM src
      WHERE country_code IS NOT NULL
    ) S
    ON T.gkg_record_id = S.gkg_record_id
    WHEN NOT MATCHED THEN INSERT ROW
    """

    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ArrayQueryParameter("countries", "STRING", filters["countries"]),
        ],
        maximum_bytes_billed=20_000_000_000,  # 20 GB hard cap
    )
    job = bq.query(sql, job_config=job_config, location="us-central1")
    job.result()
    inserted = job.num_dml_affected_rows or 0
    log.info("Inserted %d new GDELT rows", inserted)
    return inserted


def backfill_situation_ids(situations: list[tuple[str, list[str], list[str]]]) -> None:
    """Tag each row with the situation IDs it belongs to (array contains)."""
    for sid, countries, themes in situations:
        if not countries:
            continue
        sql = f"""
        UPDATE `praxisbytacitus.praxis_analytics.gdelt_situation_events`
        SET situation_ids = ARRAY(
          SELECT DISTINCT x FROM UNNEST(ARRAY_CONCAT(situation_ids, [@sid])) AS x
        )
        WHERE event_ts >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 MINUTE)
          AND country_code IN UNNEST(@countries)
          AND EXISTS (
            SELECT 1 FROM UNNEST(themes) AS t
            WHERE t IN UNNEST(@themes)
          )
          AND NOT EXISTS (
            SELECT 1 FROM UNNEST(situation_ids) AS s WHERE s = @sid
          )
        """
        job = bq.query(
            sql,
            job_config=bigquery.QueryJobConfig(
                query_parameters=[
                    bigquery.ScalarQueryParameter("sid", "STRING", sid),
                    bigquery.ArrayQueryParameter("countries", "STRING", countries),
                    bigquery.ArrayQueryParameter("themes", "STRING", themes),
                ],
                maximum_bytes_billed=5_000_000_000,
            ),
            location="us-central1",
        )
        job.result()


def main() -> None:
    log.info("GDELT poller starting at %s", datetime.now(timezone.utc).isoformat())
    filters = collect_active_situation_filters()
    log.info(
        "Active situations: %d, countries: %d, themes: %d",
        len(filters["situations"]), len(filters["countries"]), len(filters["themes"]),
    )
    inserted = materialize_slice(filters)
    if inserted:
        backfill_situation_ids(filters["situations"])
    log.info("GDELT poller done. Inserted=%d", inserted)


if __name__ == "__main__":
    main()
```

```dockerfile
# cloud_functions/gdelt_poller/Dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY main.py .
CMD ["python", "main.py"]
```

```text
# cloud_functions/gdelt_poller/requirements.txt
google-cloud-bigquery==3.27.0
google-cloud-firestore==2.20.0
```

### 4.3 Build & deploy as a Cloud Run Job

```bash
# 1) Build & push image
gcloud builds submit cloud_functions/gdelt_poller \
  --tag us-central1-docker.pkg.dev/praxisbytacitus/praxis/gdelt-poller:latest

# 2) Create the Cloud Run Job
gcloud run jobs create gdelt-poller \
  --region=us-central1 \
  --image=us-central1-docker.pkg.dev/praxisbytacitus/praxis/gdelt-poller:latest \
  --service-account=praxis-gdelt-poller@praxisbytacitus.iam.gserviceaccount.com \
  --task-timeout=10m \
  --max-retries=1 \
  --cpu=1 \
  --memory=512Mi \
  --set-env-vars="LOG_LEVEL=INFO"

# 3) Schedule it every 15 min via Cloud Scheduler
gcloud scheduler jobs create http gdelt-poller-schedule \
  --location=us-central1 \
  --schedule="*/15 * * * *" \
  --time-zone="UTC" \
  --http-method=POST \
  --uri="https://us-central1-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/praxisbytacitus/jobs/gdelt-poller:run" \
  --oauth-service-account-email=praxis-gdelt-poller@praxisbytacitus.iam.gserviceaccount.com \
  --oauth-token-scope=https://www.googleapis.com/auth/cloud-platform
```

> **Why Cloud Run Job + Scheduler instead of Worker Pools?** Worker Pools (in preview as of April 2026) are designed for *continuous* pull-based workers (e.g. consuming a Pub/Sub subscription). GDELT publishes once per 15 min, the job runs ~30-60 s, then exits — the Job + Scheduler shape matches the workload. Migrate to a Worker Pool only if we move to streaming GDELT via Pub/Sub (Phase 3).

### 4.4 Update the API route to read materialized table first

```typescript
// src/lib/data-feeds/gdelt-client.ts — add this fast-path
export async function queryGdeltForSituation(
  situationId: string,
  daysBack = 7,
  limit = 200,
): Promise<{ events: GdeltEvent[]; source: 'materialized' | 'public' }> {
  const sql = `
    SELECT
      gkg_record_id,
      FORMAT_TIMESTAMP('%FT%H:%M:%SZ', event_ts) AS event_ts,
      country_code, themes, persons, organizations,
      tone_score, source_url, source_domain
    FROM \`praxisbytacitus.praxis_analytics.gdelt_situation_events\`
    WHERE event_ts >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL @daysBack DAY)
      AND @sid IN UNNEST(situation_ids)
    ORDER BY event_ts DESC
    LIMIT @limit
  `;
  const [rows] = await bq.query({
    query: sql,
    params: { daysBack, sid: situationId, limit },
    location: 'us-central1',
    maximumBytesBilled: '2000000000', // 2 GB hard cap
  });
  if (rows.length > 0) {
    return {
      events: rows.map((r) => ({
        gkgRecordId: r.gkg_record_id,
        eventTs: r.event_ts,
        countryCode: r.country_code ?? null,
        themes: r.themes ?? [],
        persons: r.persons ?? [],
        organizations: r.organizations ?? [],
        toneScore: r.tone_score ?? null,
        sourceUrl: r.source_url,
        sourceDomain: r.source_domain,
      })),
      source: 'materialized',
    };
  }
  // Fall through to public dataset query (T1 path)
  // ...
}
```

### 4.5 Phase 2 verification

```bash
# Confirm hot table populating
bq query --use_legacy_sql=false \
'SELECT DATE(event_ts) d, COUNT(*) c
 FROM `praxisbytacitus.praxis_analytics.gdelt_situation_events`
 WHERE event_ts >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
 GROUP BY d ORDER BY d DESC'

# Confirm the job runs cleanly
gcloud run jobs executions list --job=gdelt-poller --region=us-central1 --limit=5

# Confirm Cloud Scheduler is firing
gcloud scheduler jobs describe gdelt-poller-schedule --location=us-central1
```

---

## 5 · Cost controls

### 5.1 Per-query hard caps

Already baked in via `maximumBytesBilled` on every `bq.query()` call:

- T1 (direct query, view-backed): 10 GB hard cap → ~$0.06 max per call.
- T2 (materializer MERGE): 20 GB hard cap → ~$0.12 max per run × 96 runs/day = ~$11/day worst case (real cost ≪ this because of partition prune).
- T2 (situation-tag UPDATE): 5 GB hard cap × N situations.

### 5.2 BigQuery on-demand budget alert

```bash
gcloud billing budgets create \
  --billing-account=$(gcloud billing accounts list --format="value(name)" --limit=1) \
  --display-name="PRAXIS BigQuery Monthly" \
  --budget-amount=100USD \
  --threshold-rule=percent=0.5 \
  --threshold-rule=percent=0.9 \
  --threshold-rule=percent=1.0 \
  --filter-services=services/24E6-581D-38E5  # BigQuery service
```

### 5.3 Partition expiration

The shadow table sets `partition_expiration_days = 90` so historical partitions auto-drop. You will never accumulate more than ~$0.50/mo storage at MVP scale.

### 5.4 Custom-cost alert on the public dataset queries

```sql
-- File: infrastructure/bigquery/cost-monitor.sql
CREATE OR REPLACE TABLE `praxisbytacitus.praxis_analytics.bq_cost_audit`
PARTITION BY DATE(creation_time)
AS
SELECT
  creation_time,
  user_email,
  job_id,
  total_bytes_processed,
  total_bytes_processed / POW(10,12) * 6.25 AS estimated_usd
FROM `region-us-central1`.INFORMATION_SCHEMA.JOBS_BY_PROJECT
WHERE creation_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
  AND total_bytes_processed > 0;
```

Schedule a daily refresh + a Cloud Monitoring alert if `SUM(estimated_usd) > $5/day`.

---

## 6 · Monitoring

### 6.1 Freshness alert

Alert if no new GDELT rows have been ingested in the last 30 minutes (catches both Cloud Scheduler outages and GDELT publishing outages):

```yaml
# infrastructure/monitoring/gdelt-freshness-alert.yaml
displayName: "GDELT freshness < 30 min"
combiner: OR
conditions:
  - displayName: "No GDELT rows ingested in last 30m"
    conditionMonitoringQueryLanguage:
      query: |
        fetch bigquery_table::bigquery.googleapis.com/storage/uploaded_row_count
        | filter resource.dataset_id == 'praxis_analytics'
            && resource.table_id == 'gdelt_situation_events'
        | align rate(30m)
        | every 15m
        | condition val() < 1
      duration: 1800s
notificationChannels:
  - "projects/praxisbytacitus/notificationChannels/<YOUR_PAGER_CHANNEL>"
```

### 6.2 Job execution dashboard

```bash
# Pin Cloud Run Job execution chart
gcloud monitoring dashboards create --config-from-file=- <<'EOF'
{
  "displayName": "GDELT Poller",
  "gridLayout": {
    "widgets": [
      {
        "title": "Job runs (success vs fail) — 24h",
        "xyChart": {
          "dataSets": [{
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "resource.type=\"cloud_run_job\" AND resource.labels.job_name=\"gdelt-poller\""
              }
            }
          }]
        }
      }
    ]
  }
}
EOF
```

---

## 7 · Schema crib sheet — GDELT GKG 2.1

The full codebook lives at <http://data.gdeltproject.org/documentation/GDELT-Global_Knowledge_Graph_Codebook-V2.1.pdf>. The fields PRAXIS actually uses:

| GKG field | Semantics | Format |
|---|---|---|
| `GKGRECORDID` | Unique ID per record | `YYYYMMDDHHMMSS-N` |
| `DATE` | Publish time of record | `YYYYMMDDHHMMSS` |
| `V2Locations` | Locations mentioned + offsets | `{type}#{full}#{cc}#{adm1}#{lat}#{lng}#{feature_id}#{offset};...` — `type` 1=country, 2=US state, 3=US city, 4=world city, 5=world region |
| `V2Themes` | GDELT themes hit | `THEME,offset;THEME,offset;...` |
| `V2Persons` | Person mentions | `Name,offset;Name,offset;...` |
| `V2Organizations` | Org mentions | same |
| `V2Tone` | Tone score (-100..+100) | `tone,positive,negative,polarity,activity_ref_density,group_ref_density,word_count` |
| `V2EnhancedDates` | Detected event dates | `dateres#month#day#year#offset;...` |
| `DocumentIdentifier` | Source URL | URL string |
| `SourceCommonName` | Source domain | e.g. `nytimes.com` |
| `Locations`, `Persons`, `Organizations`, `Themes`, `Counts` | V1 legacy versions | Use V2 versions instead |

**Useful theme prefixes** (filter on these):

- `MIL_*` — military / armed forces references
- `PROTEST*` — protests, demonstrations, riots
- `KILL` — fatalities reported
- `REFUGEES`, `DISPLACED` — forced migration
- `TERROR*` — terrorism references
- `CRISIS_*` — humanitarian crises
- `UN_*` — UN agency mentions
- `ELECTION*` — electoral processes
- `SANCTIONS` — sanction regimes
- `WB_*` — World Bank / development indicators

---

## 8 · Roll-back plan

If anything breaks:

```bash
# 1) Pause Cloud Scheduler (stops new ingest immediately)
gcloud scheduler jobs pause gdelt-poller-schedule --location=us-central1
gcloud scheduler jobs pause refresh-gdelt-feeds   --location=us-central1

# 2) Drop the materialized table (T2 only — safe, will be recreated)
bq rm -f -t praxisbytacitus:praxis_analytics.gdelt_situation_events

# 3) Roll the API route back: env flag
# In Cloud Run env: GDELT_USE_MATERIALIZED=false → forces T1 fallback
gcloud run services update praxis-frontend \
  --region=us-central1 \
  --update-env-vars=GDELT_USE_MATERIALIZED=false
```

T1 (direct query) is always available as a fallback because the public BigQuery dataset is Google-managed.

---

## 9 · Roadmap — Phase 3 (later)

Once we cross ~50 active situations or want sub-15-min freshness:

1. **Stream the public GDELT update via Pub/Sub.** Cloud Function on every 15-min publish → Pub/Sub topic `gdelt-gkg-updates` → Cloud Run Worker Pool (the canonical Worker Pool use case).
2. **Per-theme Pub/Sub fan-out.** Subscribers per theme prefix (`MIL_*`, `PROTEST*`, `REFUGEES`) push to Firestore `feeds/gdelt/events` directly with no MERGE.
3. **GraphRAG layer integration.** Persons + Organizations from GDELT become candidate Actors in the ACO graph (R9). A nightly Vertex AI Pipeline reconciles GDELT entities against the situation-scoped graph in Spanner Graph.

---

## 10 · TL;DR — what to do right now

1. Run the IAM commands in §2.
2. Apply the BigQuery view in §3.1.
3. Drop the new `gdelt-client.ts` and the `/api/feeds/gdelt` route in §3.2 / §3.3.
4. Ship — you now have direct GDELT access from any authenticated PRAXIS page.
5. Add the cron route in §3.5 once the SKC `feed-layer` is wired (already exists in `src/lib/knowledge/`).
6. Verify with the smoke tests in §3.7.
7. Defer Phase 2 (materialized hot slice) until you have ≥10 active situations.
