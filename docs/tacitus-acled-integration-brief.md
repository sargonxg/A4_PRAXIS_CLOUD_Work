# TACITUS × ACLED API — Integration Brief  *(OBSOLETE)*

> **⚠ HISTORICAL DOCUMENT — DO NOT IMPLEMENT.**
>
> PRAXIS dropped ACLED entirely on 2026-04-25 as part of the open-source
> data pivot. The 2026 ACLED EULA's prohibition on SaaS redistribution
> made it incompatible with our self-serve product. Event-level
> intelligence now flows from **GDELT BigQuery + UCDP GED** — see
> `docs/implementation/gdelt-ingestion-2026-04-25.md` for the
> live ingestion playbook and `docs/COMPLIANCE.md` §1 for the
> open-license posture.
>
> This file is preserved for historical / audit-trail reasons only.
> Any agent reading this should redirect to `docs/SPRINT_BACKLOG.md`
> §B-10 (the active GDELT work) and `docs/USER_ACTION_LIST.md` §3.

**Audience:** Claude Code (autonomous build) + GC (manual decisions)
**Context:** Wiring ACLED's event dataset into TACITUS as a structured input feed for the Agentic Conflict Ontology (ACO), DIALECTICA backend, and the TCGC corpus.
**Stack assumed:** GCP (Cloud Run, Firestore, BigQuery, Secret Manager, Cloud Scheduler), Python, Neo4j/FalkorDB for the conflict graph.

---

## 1. ACLED API in 60 seconds

ACLED exposes a REST API at `https://acleddata.com/api/` with three endpoints:

- `acled` — the core event dataset (political violence, demonstrations, strategic developments). **This is the one we want.**
- `deleted` — events that have been retracted (we need this for graph hygiene).
- `cast` — Conflict Alert System Tracker forecasts (potential future input to Wind Tunnel).

Every call follows the shape: `https://acleddata.com/api/{endpoint}/read?_format={csv|json|xml}&{filter1}=value&{filter2}=value&page={n}`.

**Defaults to know:**
- 5,000 row hard cap per call → must paginate via `&page=N` for anything larger.
- JSON is default; we should explicitly use `_format=json` for machine ingestion.
- Query filters can chain with `&`, multi-value with `|`, cross-field with `:OR:`.
- Default query type is `=`; can be overridden with `{filter}_where={LIKE|>|<|BETWEEN|%3D}`.

---

## 2. What GC must do manually (cannot be automated)

These steps require your account, your judgment, or your signature. Do these first; everything else can run autonomously.

1. **Account + consent.** Confirm `tacitus.me` operating account on `myACLED` exists, is approved, and has the "API" access group enabled. ACLED returns a `403 Consent must be accepted` error if profile consent isn't checked — log in once and click through any pending consent screens.
2. **Review ACLED Terms of Use** for redistribution and derivative-product constraints. Specifically check whether TACITUS can:
   - Cache ACLED events in our own datastore (yes, with attribution).
   - Surface ACLED-derived events to paying customers (likely requires the *Commercial / Government* license tier, not the free academic one).
   - Republish events as part of TCGC on HuggingFace (probably **no** — this is the load-bearing question for the corpus).
   Get this in writing if there's any ambiguity. Email `access@acleddata.com`.
3. **Decide scope of ingestion.** Pick one of:
   - *Full mirror:* every event globally, refreshed weekly. Heavy (~3M rows, ~2GB JSON).
   - *Tiered geographic:* full mirror for ~15 priority conflict zones (Syria, Sudan, DRC, Ukraine, Israel/Palestine, Myanmar, Yemen, Sahel cluster, Ethiopia, etc.); rest pulled on-demand.
   - *Customer-driven:* pull only when a tenant's `group_id` registers an interest in a country/region.
   Recommend tiered for v1 — keeps egress cheap and lets us reason about freshness SLOs.
4. **Provide credentials to Secret Manager** (one time):
   ```bash
   gcloud secrets create acled-username --replication-policy=automatic
   echo -n "your_email@tacitus.me" | gcloud secrets versions add acled-username --data-file=-
   gcloud secrets create acled-password --replication-policy=automatic
   echo -n "your_password" | gcloud secrets versions add acled-password --data-file=-
   ```
5. **Approve the ACO mapping** in §4 below. The semantic mapping from ACLED's 30 columns to our 8 ACO primitives + 42 relationships is the part of this work that *cannot* be delegated — it shapes how the corpus reads downstream forever.

Everything below this line, Claude Code can do.

---

## 3. What Claude Code can build autonomously

A single prompt sequence, broken into four phases. Each phase is independently verifiable.

### Phase 1 — Auth + ingestion service skeleton

**Prompt to Claude Code:**

> Build a Python 3.11 Cloud Run *job* (not service — this is batch, not request/response) called `acled-ingest` under `backend/services/acled/`. It must:
> 1. Read `acled-username` and `acled-password` from GCP Secret Manager via `google-cloud-secret-manager`.
> 2. Implement an `ACLEDClient` class with OAuth password-grant flow against `https://acleddata.com/oauth/token` (`client_id="acled"`, `scope="authenticated"`). Cache the access token + refresh token in Firestore (`secrets/acled_tokens`) keyed by username; refresh proactively when `expires_at` is within 5 minutes.
> 3. Expose `client.read(endpoint, filters: dict, fields: list[str] | None = None) -> Iterator[dict]` that handles pagination automatically: increments `&page=N` until a page returns fewer rows than the limit. Yield events one at a time so callers can stream.
> 4. Use `tenacity` for retries: exponential backoff on 5xx and 429, no retry on 4xx (those are bugs in our request).
> 5. Add structured logging via `structlog`, with `tenant_id`, `endpoint`, `page`, `row_count`, `duration_ms` fields. Write to Cloud Logging.
> 6. Cover with `pytest` + `pytest-vcr` for replay tests. Mock the OAuth flow with `responses`.
>
> Do NOT hardcode credentials, do NOT use `requests.session()` without a timeout, do NOT swallow exceptions silently.

This phase produces a tested, reusable client. It's pure plumbing — no ACLED-specific business logic yet.

### Phase 2 — Storage layer (raw landing zone)

**Prompt to Claude Code:**

> Create a BigQuery dataset `acled_raw` in our GCP project with one table `events` that mirrors ACLED's column structure exactly (see ACLED codebook). Use partitioning on `event_date` and clustering on `country, event_type`. Add a `_ingested_at` timestamp and a `_source_query` JSON column for provenance.
>
> Write `acled.storage.BigQueryWriter` that streams events from `ACLEDClient.read()` into the table via `load_table_from_json` in 1,000-row batches. Use `MERGE` semantics on `event_id_cnty` so re-ingesting overlapping windows is idempotent.
>
> Also create `acled_raw.deleted_events` for the `/deleted` endpoint output. Run a daily reconciliation job that hard-deletes any `event_id_cnty` appearing in `deleted_events` from `events`. This is critical for graph hygiene — ACLED retracts events when sources are corrected.

Why BigQuery for raw before the graph: cheap, schema-stable, queryable for ad-hoc analysis, and gives us a "source of truth" we can always rebuild the graph from. The graph is opinionated; the raw layer is faithful.

### Phase 3 — ACO mapping pipeline

This is where the Conflict Grammar earns its keep. See §4 for the mapping spec — give that section to Claude Code along with this prompt.

**Prompt to Claude Code:**

> Build `acled.transform.ACOMapper` that takes a single ACLED event dict and emits a list of ACO primitives + relationships, ready for Graphiti ingestion. Use the mapping spec in `docs/acled-aco-mapping.md` (forthcoming — for now, ask GC). Each primitive must include `source_event_id` for traceability and `tenant_id` for multi-tenant isolation (use `group_id="acled_global"` for the public mirror).
>
> Output Pydantic models matching the existing ACO schema in `dialectica/ontology/aco.py`. Validate every emitted primitive — fail loudly on schema violations, do not silently drop fields.
>
> Add a Pub/Sub publisher that emits `aco.event.created` messages downstream so CONCORDIA, PRAXIS, and ARGUS can subscribe to fresh events without polling.

### Phase 4 — Scheduling, observability, incremental sync

**Prompt to Claude Code:**

> Wire the `acled-ingest` Cloud Run job to Cloud Scheduler. Create three schedules:
> 1. **Hourly** — incremental pull using `&timestamp={last_seen_unix}&timestamp_where=%3E` (greater than). Read `last_seen` from Firestore `state/acled_ingest`, write the max timestamp seen at the end. This is how we stay fresh without re-pulling everything.
> 2. **Daily 03:00 UTC** — pull `/deleted` endpoint for the last 7 days, run reconciliation against `events` and the graph.
> 3. **Weekly Sunday 04:00 UTC** — backfill sweep for the last 30 days using `event_date BETWEEN`, in case any timestamp-based pulls missed updates.
>
> Add Cloud Monitoring alerts: page on (a) job failure, (b) zero rows ingested for 6+ hours during business hours, (c) >5% of events failing ACO validation, (d) OAuth refresh failure.
>
> Write a `make acled-backfill COUNTRIES="Syria Sudan" YEARS="2018-2026"` target that runs the full historical pull for a country list, paginating and rate-limited to ≤30 calls/min to stay polite.

---

## 4. ACO mapping specification

This is the part you (GC) need to sign off on. ACLED gives us strong coverage of two ACO primitives directly, weak coverage of two more inferentially, and nothing for four — those four are LLM-extraction territory (your OAG thesis in action).

### 4.1 Direct primitive mappings

| ACO Primitive | ACLED Source Fields | Notes |
|---|---|---|
| **Event** | `event_id_cnty`, `event_date`, `event_type`, `sub_event_type`, `disorder_type`, `latitude`, `longitude`, `location`, `admin1-3`, `fatalities`, `time_precision`, `geo_precision` | 1:1 mapping. ACLED's event is our atomic Event node. Use `event_id_cnty` as stable external ID. |
| **Actor** | `actor1`, `actor2`, `assoc_actor_1`, `assoc_actor_2`, `inter1`, `inter2` | Each unique actor string becomes an Actor node. Deduplicate across events on exact-match name (with caveats — ACLED actor naming is mostly stable but versioned, e.g., "Military Forces of Mexico (2018-)"). |
| **Narrative** | `notes`, `source`, `source_scale` | The `notes` field is a short prose description — treat as a low-resolution Narrative. Run LLM extraction (Phase 5, future) to lift higher-fidelity Narrative claims out of it. |

### 4.2 Inferential mappings (good-enough for v1)

| ACO Primitive | Derivation |
|---|---|
| **Claim** | Synthesize from `(disorder_type, event_type, sub_event_type, civilian_targeting)`. E.g., a `Violence against civilians / Attack` event implies a Claim of legitimacy-of-force by `actor1` against `actor2`. Document this as a derivation rule, not a fact — flag `claim_source: "derived"` so it's distinguishable from extracted Claims. |
| **Leverage** | `fatalities` count is a crude leverage proxy (kinetic capacity demonstrated). Geographic concentration (events per `admin1` per month) is another. Compute these as derived numerical attributes on the Actor node, not as standalone Leverage primitives. |

### 4.3 Out of scope from ACLED alone

ACLED **does not provide** — and we shouldn't pretend it does:

- **Interest** — actors' underlying goals. Requires either analyst input or LLM extraction from broader corpus.
- **Constraint** — what's stopping an actor from acting. Same as above.
- **Commitment** — public/private promises. Requires speech-act extraction from text sources, which ACLED's `notes` field is too thin to support reliably.

These are the gaps OAG fills. ACLED gives us the verifiable spine of *what happened*; DIALECTICA's extraction layer adds *why* and *what they said*.

### 4.4 Relationship mappings (subset of the 42 typed)

| Relationship | Trigger |
|---|---|
| `Actor —[PARTICIPATED_IN]→ Event` | For `actor1`, `actor2`, and each entry in `assoc_actor_1`/`assoc_actor_2` (semicolon-split). |
| `Actor —[TARGETED]→ Actor` | When `civilian_targeting == "Civilian targeting"`, edge from `actor1` to `actor2`. |
| `Event —[OCCURRED_IN]→ Location` | Location node keyed by `(country, admin1, admin2, lat, lon)`. |
| `Event —[CAUSED]→ Fatalities(n)` | Attribute on the Event, not a separate node. Don't over-graph trivial scalars. |
| `Actor —[ALLIED_WITH]→ Actor` | When two actors co-appear as `actor1` + `assoc_actor_1` repeatedly across events. Compute as a derived relationship after ingestion, with a co-occurrence threshold (e.g., ≥5 shared events in 90 days). |

Open question for you: does ACO have a typed relationship for "actor coalition emergence over time"? If not, the co-occurrence pattern above is a candidate for a 43rd relationship type.

---

## 5. Production considerations

### 5.1 Rate limiting & politeness

ACLED publishes no hard rate limit but has clear "be reasonable" expectations. Self-impose:
- ≤30 requests/minute during normal operation.
- ≤10 requests/minute during backfills.
- Single concurrent OAuth session per Cloud Run job instance (don't parallelize the same credentials).
- Pagination calls don't count toward rate limits per their docs — but bursting them is rude. Sleep 200ms between pages.

### 5.2 Token lifecycle

- Access token: 24 hours. Refresh proactively at 23.5 hours, not on 401.
- Refresh token: 14 days. If we go 14 days without an ingestion run, we re-auth from scratch. The Cloud Scheduler hourly job means this should never happen, but handle the case anyway.
- Store both tokens in Firestore with `expires_at` as a server timestamp. Never log token values.

### 5.3 Schema drift

ACLED changed `inter1`/`inter2`/`interaction` from numeric to text on 2024-09-26. They added the `inter_num=1` parameter as a workaround for legacy consumers. **Use `inter_num=1` in our requests** — text-based interaction strings are more readable for humans but numeric codes are more stable for code, and our ACO mapper has explicit lookup tables. If ACLED makes another schema change, our mapper will fail validation rather than silently miscategorize, which is what we want.

### 5.4 Multi-tenant considerations

For the public mirror (default), use `group_id="acled_global"` in Graphiti so all tenants can read it. For tenant-specific enrichments (e.g., a customer's analyst adds annotations to ACLED events), those go under `group_id={tenant_id}` and overlay the public graph at query time. This matches the architecture pattern we tested on 2026-01-06.

### 5.5 Cost envelope

Rough estimate at full global mirror:
- BigQuery storage: ~3M events × 2KB avg = 6GB → $0.12/month.
- BigQuery streaming inserts: $0.05/GB → ~$0.30 per full backfill.
- Cloud Run job: ~5 min hourly = ~60 vCPU-hr/month → ~$1.50.
- Egress from ACLED (free, but counts against their bandwidth): ~50MB/day on incremental, ~2GB on backfill.
- Secret Manager: negligible.

Total: **<$5/month** for the ingestion layer. This will be the cheapest part of TACITUS.

### 5.6 What goes into TCGC

Until ACLED ToS clarity (item 2 in §2) is resolved, **do not** publish ACLED-derived events to HuggingFace under TCGC. Instead, publish only:
- The ACO-mapped primitives we *derived* from ACLED (Claims, derived Leverage scores) without the underlying ACLED event payload.
- Schema-only examples with synthetic event data.
- Real ACLED data only for events we have independent cross-source corroboration for, treating ACLED as one input among several.

This is the conservative read. If access@acleddata.com greenlights broader corpus inclusion, we revise.

---

## 6. Suggested execution order

1. **You:** items 1–4 in §2 (account, ToS, scope decision, credentials). ~1 hour.
2. **You + me, in this chat:** finalize §4 ACO mapping. ~30 min.
3. **Claude Code:** Phase 1 (auth + client). ~2 hours of build, output is testable.
4. **Claude Code:** Phase 2 (BigQuery raw layer). ~2 hours.
5. **You:** spot-check the raw layer against the ACLED dashboard for 2-3 known events. Sanity gate.
6. **Claude Code:** Phase 3 (ACO mapper). ~4 hours — this one needs the most review.
7. **You:** review 50-event sample of mapped output, confirm ACO primitives look right.
8. **Claude Code:** Phase 4 (scheduling + ops). ~2 hours.
9. **Both:** end-to-end test on Syria-only backfill before turning on global.

Total wall-clock: ~2 days of Claude Code work + ~3 hours of your review/decision time.

---

## 7. Open questions for you

These shape the build but don't block starting Phase 1:

1. **Storage target for the graph layer:** Neo4j (current Graphify pipeline) or FalkorDB (the 2026-01-06 test)? Affects how the ACO mapper emits — Cypher vs. RedisGraph dialect.
2. **Real-time vs. hourly:** is hourly fresh enough for PRAXIS use cases, or do we need ACLED's "Curated Data" same-day stream? (Different SKU, more expensive, requires conversation with ACLED.)
3. **Deleted events:** when ACLED retracts an event, do we hard-delete from the graph, or soft-delete (mark `retracted_at`) and keep for audit? I'd argue soft-delete given DIALECTICA's auditability requirements, but it costs storage.
4. **Actor disambiguation:** ACLED actor names are stable but verbose ("Police Forces of Mexico (2018-) Ministerial Federal Police"). Do we run them through the same entity resolution pipeline we built for the HR test case (Alex/Maya/Jordan), or treat ACLED actors as a separate canonical namespace?

Answer these when convenient — I'll fold them into the next pass of the spec.
