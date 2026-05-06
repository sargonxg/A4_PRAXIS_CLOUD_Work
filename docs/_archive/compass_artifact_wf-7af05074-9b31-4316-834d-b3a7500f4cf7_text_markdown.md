# PRAXIS Research Brief — Decision-Oriented Report
**Author:** Research synthesis for Giulio Catanzariti, CEO of TACITUS
**Project:** PRAXIS (praxis.tacitus.me) — Conflict Intelligence OS on GCP
**Date:** April 25, 2026
**GCP project:** `praxisbytacitus` · **Region:** `us-central1` · **BQ dataset:** `praxis_analytics`

---

## Executive Summary

1. **R1 — Agent Engine deployment.** Deploy with `google-cloud-aiplatform[adk,agent_engines]>=1.148` + `google-adk==1.31.1`; reasoning-engine resource is a numeric path (`projects/{num}/locations/us-central1/reasoningEngines/{id}`); Cloud Run invoker needs `roles/aiplatform.user`. Cost ≈ $0.0864/vCPU-hr + $0.0090/GB-hr + Gemini tokens.
2. **R2 — ACLED.** **Do NOT redistribute ACLED events on a paid tier without a Corporate License.** ACLED's 2026 EULA explicitly prohibits SaaS dashboards that surface their data and bars commercial entities from API use without a corporate license. **Action:** email `access@acleddata.com` to negotiate a license before launch.
3. **R3 — GDELT.** Use `gdelt-bq.gdeltv2.gkg_partitioned` and `events_partitioned` (15-min cadence, public BigQuery, free first 1 TB/mo), partition-prune with `_PARTITIONTIME`, retain 90 d in your own dataset for in-app speed, fall back to public dataset for deeper history.
4. **R4 — Scrapers.** **Firecrawl Standard ($83/mo, 100k pages, ~$0.00083/page)** is the cleanest fit for ~3k policy-PDF / Markdown URLs/mo with citations preserved; Bright Data is the fallback for hard-blocked targets.
5. **R5 — BigQuery public datasets.** GDELT 2.0 (`gdelt-bq`), `bigquery-public-data.world_bank_*`, `ghcn_d`, `noaa_*`, `census_bureau_*`, `who`, plus HDX via Analytics Hub. First 1 TB/mo free; treat as cold-store for analytics.
6. **R6 — Stripe.** Use **Stripe Billing + hosted Pricing Tables + Entitlements API**, with the **Invertase `firestore-stripe-payments` extension** to mirror subs into Firestore. Model overages with the **v2 Meters API**, not legacy usage records. Webhook on `customer.subscription.*`, `invoice.paid`, `invoice.payment_failed`, `entitlements.active_entitlement_summary.updated`.
7. **R7 — Vector store.** **Stay on Firestore native KNN now** (768-dim, COSINE → switch to DOT_PRODUCT with normalized vectors). At ≥10M vectors per situation or >5 QPS sustained with heavy metadata filtering, migrate to **Vertex AI Vector Search 2.0** (GCP-native, hybrid+filter, GA in 2026). Avoid Pinecone unless you must leave GCP.
8. **R8 — Gemini API surface.** Use **Vertex AI (`aiplatform.googleapis.com`) with ADC**: same per-token price as AI Studio, but adds IAM, data-residency, SLA, and VPC-SC — required by UN/EU buyers. At your shape, ~$28/mo for Gemini 3 Flash + ~$80–120/mo for Gemini 3.1 Pro structured calls.
9. **R9 — RAG architecture.** Keep the per-situation Firestore subcollection as the **vector layer**, add an **explicit GraphRAG layer** (entities = your 8 ACO primitives) using Microsoft's local→global pattern; use Spanner-backed RAG Engine for managed corpus storage. Hybrid graph+vector beats vector-only on multi-hop ACO questions.
10. **R10 — UN procurement.** Register on **UNGM at Level 2** (>$500k contracts), get **SOC 2 Type II** (4–9 months, $25–50k all-in for a startup), publish a DPA covering GDPR + ISO 27018 cloud-PII, offer **EU data residency** (`europe-west1` or `europe-west4`). Comparable contracts: Dataminr ~$100k+/yr enterprise, Recorded Future six-figure, Palantir Gotham millions; **target $50–150k/yr Enterprise tier** for PRAXIS.

---

## R1 — Vertex AI Agent Engine: Concrete Deployment Recipe

### 1.1 Naming, packages, identifiers

In April 2026, the runtime is officially **Vertex AI Agent Engine** (rebranded under "Gemini Enterprise Agent Platform" at Cloud Next '26), but the API resource type remains `ReasoningEngine` for backwards compatibility ([Google Cloud docs](https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/reasoning-engine)).

Pin these versions for production builds in 2026:

```bash
# requirements.txt
google-cloud-aiplatform[adk,agent_engines]>=1.148.1   # released 2026-04-17
google-adk==1.31.1                                    # released 2026-04-21
google-genai>=1.0.0
```

`google-cloud-aiplatform` 1.148.1 ships the refactored client-based `agent_engines` module ([PyPI](https://pypi.org/project/google-cloud-aiplatform/)); `google-adk` 1.31.1 is the latest stable ADK on PyPI ([PyPI](https://pypi.org/project/google-adk/)). Use Python 3.10–3.12 — Agent Engine still does not support 3.13+ as of April 2026 ([adk-python issue #4762](https://github.com/google/adk-python/issues/4762) flags base-image breakage on `py314`).

**Resource ID format.** The reasoning engine ID is **numeric**, embedded in a fully-qualified resource path:

```
projects/{PROJECT_NUMBER}/locations/us-central1/reasoningEngines/{NUMERIC_ID}
```

Confirmed by Google Cloud's REST reference ([projects.locations.reasoningEngines](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/reference/rest/v1/projects.locations.reasoningEngines)) and the Codelabs guide ([Workspace × Vertex AI Codelab](https://codelabs.developers.google.com/vertexai-gws-agents)). Retrieve it after creation:

```python
import vertexai
vertexai.init(project="praxisbytacitus", location="us-central1")
client = vertexai.Client()
for engine in client.agent_engines.list():
    print(engine.api_resource.name)
# projects/123456789/locations/us-central1/reasoningEngines/8263861224643493888
```

([Google Cloud sample](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/samples/generativeaionvertexai-list-reasoning-engines))

### 1.2 Service-account model & IAM

By default, Agent Engine runs as the project's **Vertex AI Reasoning Engine service agent** (`service-{PROJECT_NUMBER}@gcp-sa-aiplatform-re.googleapis.com`). You can override this with the `serviceAccount` field on `ReasoningEngine`, which must hold `roles/storage.objectViewer` (for staging bucket reads) and `roles/aiplatform.user` (to call Gemini); a third option is the new `AGENT_IDENTITY` workload-identity mode ([Google Cloud REST reference](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/reference/rest/v1/projects.locations.reasoningEngines)).

**Minimum roles on the Cloud Run service account that *invokes* the engine** (the `praxis-api@praxisbytacitus.iam.gserviceaccount.com` SA running your backend):

| Role | Why |
|---|---|
| `roles/aiplatform.user` | Required to call any Vertex AI API including `streamQuery` ([Vertex AI Agent Engine quickstart](https://docs.cloud.google.com/agent-builder/agent-engine/quickstart)) |
| `roles/storage.objectViewer` on staging bucket | ADK uploads code archive to the `STAGING_BUCKET` |
| `roles/logging.logWriter` | Cloud Trace + Cloud Logging spans from ADK |
| `roles/aiplatform.reasoningEngineServiceAgent` | Only needed if you assign a custom SA to the engine itself |

There is **no separate `roles/aiplatform.reasoningEngineUser` role** as of April 2026 — `roles/aiplatform.user` is the canonical invoker role.

### 1.3 Working `deploy.py` (3-phase planner → researcher → synthesizer)

```python
# deploy.py
import vertexai
from vertexai import agent_engines
from google.adk.agents import LlmAgent, SequentialAgent
from google.adk.tools import google_search

PROJECT_ID  = "praxisbytacitus"
LOCATION    = "us-central1"
STAGING_BKT = "gs://praxisbytacitus-agent-staging"

vertexai.init(project=PROJECT_ID, location=LOCATION, staging_bucket=STAGING_BKT)

# ----- Phase 1: planner -----
planner = LlmAgent(
    name="planner",
    model="gemini-3-flash",
    instruction=(
        "You are PRAXIS' research planner. Decompose the user question "
        "into 3-5 specific sub-queries. Output strict JSON: "
        '{"plan":[{"id":"q1","query":"..."}, ...]}'
    ),
    output_key="plan",
)

# ----- Phase 2: web researcher (uses Google Search tool) -----
researcher = LlmAgent(
    name="researcher",
    model="gemini-3-flash",
    instruction=(
        "Execute every sub-query in {plan}. For each, call google_search and "
        "return findings with verbatim quotes and source URLs. "
        "Output JSON: {\"findings\":[{\"q\":..., \"quote\":..., \"url\":...}]}"
    ),
    tools=[google_search],
    output_key="findings",
)

# ----- Phase 3: synthesizer (Gemini 3.1 Pro for structured Markdown) -----
synthesizer = LlmAgent(
    name="synthesizer",
    model="gemini-3.1-pro-preview",
    instruction=(
        "You are PRAXIS' analyst. Using {findings}, write a Markdown report "
        "with H2 sections (Situation, Actors, Drivers, Risks, Citations). "
        "Every claim MUST end with an inline [Source](url) citation. "
        "Return ONLY Markdown."
    ),
)

root_agent = SequentialAgent(
    name="praxis_research_pipeline",
    sub_agents=[planner, researcher, synthesizer],
)

# Wrap and deploy
remote_app = agent_engines.create(
    agent_engine=root_agent,
    requirements=[
        "google-cloud-aiplatform[adk,agent_engines]>=1.148",
        "google-adk==1.31.1",
    ],
    display_name="praxis-research-pipeline",
    description="3-phase planner→researcher→synthesizer for PRAXIS situations",
)
print("Deployed:", remote_app.api_resource.name)
```

Confirmed pattern from the [Vertex AI Agent Engine quickstart](https://docs.cloud.google.com/agent-builder/agent-engine/quickstart) and [Use an ADK agent docs](https://docs.cloud.google.com/agent-builder/agent-engine/use/adk).

### 1.4 Streaming POST from Cloud Run

```python
# In Cloud Run handler
from vertexai import agent_engines
ENGINE = "projects/123456789/locations/us-central1/reasoningEngines/8263861224643493888"
remote_app = agent_engines.get(ENGINE)
session = remote_app.create_session(user_id=user_id)
async for event in remote_app.async_stream_query(
    user_id=user_id, session_id=session["id"], message=question
):
    yield f"data: {json.dumps(event)}\n\n"   # SSE frame
```

`async_stream_query` is the supported streaming method on `AdkApp` ([ADK use guide](https://docs.cloud.google.com/agent-builder/agent-engine/use/adk)).

### 1.5 Cost characteristics

| Component | 2026 rate | Source |
|---|---|---|
| Agent Engine Runtime — vCPU | **$0.0864 / vCPU-hour** (lowered Dec 16, 2025) | [Vertex AI release notes](https://docs.cloud.google.com/vertex-ai/docs/release-notes) |
| Agent Engine Runtime — Memory | **$0.0090 / GB-hour** | same |
| Sessions / Memory Bank / Code Execution | Free until Jan 28, 2026; $0.25 / 1k events thereafter | [release notes](https://docs.cloud.google.com/vertex-ai/docs/release-notes) |
| Gemini 3 Flash | $0.50 input / $3.00 output per 1M tokens | [Vertex AI pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing) |
| Gemini 3.1 Pro | $2.00/$12.00 (≤200K ctx); $4.00/$18.00 (>200K) | same |

**Idle cost ≈ 0** — billing is per-second active runtime ([Finout 2026 guide](https://www.finout.io/blog/top-16-vertex-services-in-2026)).

### PRAXIS Decision
**Recommendation:** Deploy via `vertexai.agent_engines.create()` with the SequentialAgent pattern above. Use the **default Reasoning Engine service agent** for the engine itself; grant `roles/aiplatform.user` + `roles/storage.objectViewer` to your **Cloud Run invoker SA**.
**Implementation next steps:**
1. `pip install "google-cloud-aiplatform[adk,agent_engines]>=1.148" google-adk==1.31.1`
2. Create `gs://praxisbytacitus-agent-staging` bucket.
3. Deploy `deploy.py` and store `remote_app.api_resource.name` in Firestore (`config/agentEngines/research_pipeline`).
4. Wire your Cloud Run streaming endpoint to call `async_stream_query`.
5. Set a Cloud Monitoring alert on Reasoning Engine vCPU-hours >100/day.
**Cost estimate at PRAXIS scale:** ~$30–60/mo runtime + $80–150/mo Gemini tokens at MVP traffic = **~$110–210/mo total**.

---

## R2 — ACLED API: Rate Limits, Bulk Export, Licensing (2026)

### 2.1 Rate limits and per-request caps

ACLED's official 2026 documentation specifies a **5,000-row default cap per response** (and a hard maximum), with pagination via `&page=X` to retrieve more ([ACLED Elements docs](https://acleddata.com/api-documentation/elements-acleds-api), [Getting started](https://acleddata.com/api-documentation/getting-started)). ACLED has **moved away from publishing fixed per-second QPS limits** — instead, free-tier access is governed by the access tier assigned to the registered email domain (Open / Research / Partner / Enterprise myACLED). Heavy automated polling is treated as a EULA breach ([myACLED FAQ](https://acleddata.com/myacled-faqs)).

The previously-documented "1 call per 12 seconds" cadence in older PDFs is **superseded** by the OAuth/access-tier model launched in 2024–2025 ([ACLED Access Portal FAQ](https://acleddata.com/sites/default/files/wp-content-archive/uploads/2020/10/FAQs-ACLED-Registration-and-Access-Model.pdf)). ACLED reserves the right to throttle or revoke access from any client that violates terms.

### 2.2 Bulk download / paid tiers

ACLED does not publish prices for higher tiers; you must **email `access@acleddata.com` for Partner/Enterprise quotes** ([myACLED FAQ](https://acleddata.com/myacled-faqs)). Datarade lists ACLED but confirms "ACLED Data has not published pricing information" ([Datarade](https://datarade.ai/data-providers/acled-data/profile)). Higher tiers offer disaggregated event data with shorter time-lag and scripted bulk download.

### 2.3 License terms — **the critical part for PRAXIS**

ACLED's End User License Agreement (EULA, v. Oct 2023 → 2026) is unusually restrictive for a SaaS redistribution use case. Verbatim from [acleddata.com/eula](https://acleddata.com/eula):

> "Licensor hereby grants … a royalty-free, non-exclusive, non-transferable, non-sublicensable license to use the Licensed Content … **for non-commercial purposes** … any materials that Licensor intends to disclose, publish or distribute externally must be **transformative, such that they cannot be reverse engineered to recreate the Licensed Content** ('Derivative Materials'). **It is not sufficient for Licensed Content to simply be supplemented, appended, excerpted, reorganized, or made available through Licensee's own dashboard.**"

> "Commercial entities may not access or use the Content and/or Platforms without first obtaining a corporate license from Licensor."

> Use restrictions explicitly forbid "**creating, developing, or supporting any dataset, product, or platform similar to, or in competition with, or that would create a functional [equivalent]**" ([Terms of Use](https://epo.acleddata.com/terms-of-use-and-attribution-policy/)).

For LLM/AI uses, §7.2 of the EULA requires "**technical and contractual controls to prevent users from acquiring, extracting, or otherwise accessing ACLED Content through the tool or system**" and explicit attribution.

**Bottom line for PRAXIS:** You **cannot** simply surface ACLED events to paying users on Analyst/Team plans without a **Corporate / Enterprise license** from ACLED, even with attribution. Doing so is a material breach. Attribution alone is required for non-commercial use; commercial redistribution requires a contract.

### 2.4 Cache TTL

For an event-density map, ACLED's data is updated **weekly** ([ACLED](https://acleddata.com/myacled-faqs) — "updated weekly"). A 1-hour TTL is excessive; **24 hours is appropriate** for the public/Analyst tier, **6 hours** for Team/Enterprise live monitors. ACLED's EULA §3.4 explicitly disclaims update SLAs.

### PRAXIS Decision
**Recommendation:** **Do not display ACLED events on paid tiers until you have signed a Corporate License.** In the interim, surface only ACLED-derived **statistics** (event counts, fatality aggregates) computed server-side — these may qualify as transformative under the EULA, but get this in writing.
**Implementation next steps:**
1. Email `access@acleddata.com` today: describe TACITUS, the planned Analyst $49/Team $199/Enterprise tiers, and request a corporate license quote.
2. Until licensed, gate the ACLED layer behind a feature flag on Enterprise pilots only.
3. Increase event-density cache TTL from 1 h → **24 h** (90% query reduction).
4. Add prominent attribution: "Source: ACLED (Armed Conflict Location & Event Data) – acleddata.com – accessed YYYY-MM-DD" per [Attribution Policy](https://acleddata.com/attributionpolicy).
5. Implement EULA §7.2 controls: prevent end-users from downloading raw ACLED rows from the dashboard.
**Cost estimate at PRAXIS scale:** Corporate licenses for SaaS redistribution typically run **$5–25k/yr** based on industry comparables (ACLED has not published rates).

---

## R3 — GDELT GKG Ingestion for Real-Time Dashboards

### 3.1 Cadence (still 15 minutes in 2026)

The GDELT 2.0 GKG file cadence remains **every 15 minutes** with no GDELT 3.0 changes published as of April 2026 ([GDELT data page](https://www.gdeltproject.org/data.html), [GDELT 2.0 announcement](https://blog.gdeltproject.org/gdelt-2-0-our-global-world-in-realtime/)). Canonical URLs:

- File listing: `http://data.gdeltproject.org/gdeltv2/lastupdate.txt`
- Specific 15-min file pattern: `http://data.gdeltproject.org/gdeltv2/YYYYMMDDHHMMSS.gkg.csv.zip`
- Daily index: `http://data.gdeltproject.org/gkg/index.html` ([GDELT GKG file index](http://data.gdeltproject.org/gkg/index.html))

### 3.2 Hosted BigQuery public dataset (the preferred path)

GDELT is mirrored to BigQuery and **updated every 15 minutes** by Google with no extra ingestion work:

| Table | Path | Use |
|---|---|---|
| GKG 2.0 | `gdelt-bq.gdeltv2.gkg_partitioned` | Knowledge graph (themes, persons, orgs, locations, tone, GCAM) |
| Events 2.0 | `gdelt-bq.gdeltv2.events_partitioned` | CAMEO events with lat/lng |
| Mentions | `gdelt-bq.gdeltv2.eventmentions_partitioned` | Article-level confidence/offset for events |
| GKG 1.0 (historical) | `gdelt-bq.full.gkg` | 2013–present daily |

Confirmed by GDELT ("**all GDELT datasets are available in Google BigQuery, with live datasets updated every 15 minutes**") ([GDELT data page](https://www.gdeltproject.org/data.html)) and Google ([BigQuery Public Data](https://docs.cloud.google.com/bigquery/public-data)). All public datasets enjoy the **first 1 TB/month free** query allotment ([BigQuery public-data docs](https://docs.cloud.google.com/bigquery/public-data)).

### 3.3 Recommended schema in `praxis_analytics`

Don't re-store the entire GKG. Instead, materialize a **derived 90-day, partition-pruned, situation-scoped** table:

```sql
CREATE TABLE praxis_analytics.gkg_situation_events
PARTITION BY DATE(event_ts)
CLUSTER BY situation_id, country_code
AS
SELECT
  GKGRECORDID                                      AS gkg_record_id,
  PARSE_TIMESTAMP('%Y%m%d%H%M%S',
                  CAST(DATE AS STRING))            AS event_ts,
  V2Locations                                      AS locations_raw,
  V2Themes                                         AS themes_raw,
  V2Persons, V2Organizations,
  V2Tone, V2EnhancedDates,
  DocumentIdentifier                               AS source_url,
  -- enrichment columns
  REGEXP_EXTRACT(V2Locations, r'^[2-5]#.*?#(.*?)#') AS country_code,
  @situation_id                                    AS situation_id
FROM `gdelt-bq.gdeltv2.gkg_partitioned`
WHERE _PARTITIONTIME >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 90 DAY)
  AND REGEXP_CONTAINS(V2Locations, @country_filter);
```

Key practices:
- Always filter on `_PARTITIONTIME` first (one analyst burned a month's free TB without it — [Amunategui guide](https://amunategui.github.io/gdelt/index.html)).
- Cluster by `situation_id` + `country_code` for sub-second per-situation queries.
- Field reference: [GKG Codebook V2.1](http://data.gdeltproject.org/documentation/GDELT-Global_Knowledge_Graph_Codebook-V2.1.pdf).

### 3.4 Cheap CDC pattern (without re-downloading)

The native CDC primitive is `_PARTITIONTIME` plus `DATEADDED` (the 15-minute timestamp embedded in `GKGRECORDID` as `YYYYMMDDHHMMSS-N`):

```sql
-- Cloud Scheduler triggers this every 15 min
INSERT INTO praxis_analytics.gkg_situation_events
SELECT * FROM `gdelt-bq.gdeltv2.gkg_partitioned`
WHERE _PARTITIONTIME > (SELECT MAX(event_ts) FROM praxis_analytics.gkg_situation_events)
  AND REGEXP_CONTAINS(V2Locations, @country_filter);
```

This watermarked approach reads only the new 15-min chunk per run, typically <50 MB / poll. Avoid re-downloading raw .csv.zip files — **always go through BigQuery**.

### 3.5 Retention

90 days is **reasonable** for in-app interactive querying. For deeper history fall through to `gdelt-bq.gdeltv2.gkg_partitioned` directly (still free up to 1 TB/mo). GDELT itself recommends BigQuery for any analysis beyond a single year because raw CSV is 2.5 TB/yr ([GDELT data page](https://www.gdeltproject.org/data.html)).

### PRAXIS Decision
**Recommendation:** Stay on the public BigQuery mirror; do **not** ingest raw .zip files. Materialize a 90-day partitioned, clustered shadow table per situation in `praxis_analytics`, refreshed every 15 min by Cloud Scheduler.
**Implementation next steps:**
1. Create the `gkg_situation_events` table with the DDL above.
2. Deploy a Cloud Run job + Cloud Scheduler trigger (`*/15 * * * *`) running the watermarked INSERT.
3. Add a BigQuery row-level access policy keyed on `situation_id` for multi-tenant isolation.
4. Set per-table TTL = 90 days via `expirationMs` on partitions.
5. Wire BigQuery → Firestore via a streaming Dataflow job for sub-second dashboard reads of "last 24 h" slice.
**Cost estimate at PRAXIS scale:** $0–20/mo (under 1 TB/mo free public-dataset query allotment) + ~$10/mo storage for the 90-day shadow.

---

## R4 — Firecrawl Alternatives — Competitive Sweep (April 2026)

### 4.1 Pricing matrix (verified April 2026)

| Vendor | Lowest paid tier | Effective $/1k req | JS render | PDF extract | Markdown out | Concurrency at $50–100/mo | Red flags |
|---|---|---|---|---|---|---|---|
| **Firecrawl** | Hobby $16/mo (3k credits) → Standard **$83/mo** (100k credits) | $0.83 (Hobby) / **$0.83 (Standard)** | Yes (Smart Wait, default) | Yes | **Native Markdown** | 100 concurrent (Growth $333) | Credits don't roll over; agent calls billed even on failure ([Firecrawl pricing](https://www.firecrawl.dev/blog/best-web-scraping-api), [Use-Apify review](https://use-apify.com/blog/firecrawl-review-2026)) |
| **Bright Data Web Scraper API** | ~$1.50–2.50/1k requests, no monthly minimum | $1.50–2.50 | Yes | Yes | Returns HTML/JSON (post-process needed) | Unlimited (proxy-based) | $0.08–0.09/GB egress; opaque billing ([Bright Data blog](https://brightdata.com/blog/web-data/best-web-scraping-apis)) |
| **Apify** | Starter $39/mo | Variable; ~$0.20–0.30/CU | Per Actor | Per Actor | Raw JSON; post-process needed | Limited by CU | Quality varies across 10k+ Actors ([Apify blog](https://blog.apify.com/firecrawl-vs-apify/)) |
| **Diffbot** | Custom, ~$299/mo entry | ~$3.00 | Yes (built-in) | Yes (Article API) | Structured JSON | Enterprise only | Heavy enterprise sales motion ([Capterra](https://www.capterra.com/p/140641/Diffbot/)) |
| **Browserless** | $50/mo (free tier 1k units) | Headless browser-hours | Yes | Via PDF API | No | ~5 concurrent on $50 plan | Browser-time billing ([Browserless pricing](https://www.browserless.io/pricing)) |
| **ScrapingBee** | Freelance **$49/mo** (250k credits) | $0.20 base; **5×–25× with JS+premium** | Yes (5× credits) | Yes | AI extract beta | 10–25 concurrent | Multipliers explode the bill on protected targets ([ScrapingBee pricing](https://www.scrapingbee.com/pricing/)) |
| **ScraperAPI** | Hobby $49/mo (100k credits) → Business **$299/mo** (3M) | $0.49–$0.10 | Yes (5× credits) | Yes | Raw HTML | 25–100 concurrent | Slowest in 2025 benchmarks (~15s avg) ([ScraperAPI](https://www.scraperapi.com/comparisons/zenrows-vs-scrapingbee/)) |
| **ZenRows** | $69/mo Developer (250k basic units) | ~$0.28 base, up to $4.62/1k on protected | Yes (multipliers) | Yes | AI extraction | 25–100 concurrent | 51% success rate in independent benchmark ([Firecrawl blog](https://www.firecrawl.dev/blog/best-web-scraping-api)) |

### 4.2 Fit analysis for PRAXIS

Your use case — Crisis Group, SIPRI, UN/EU agency reports, government white papers — is dominated by:
- Static or lightly-JS HTML (UN, ICG, SIPRI all serve plain HTML).
- **Many large PDFs** (UN reports, white papers): native PDF→Markdown is essential.
- Need for **clean, citation-preserving Markdown** for downstream RAG.
- **3,000 unique URLs/month** = trivial volume; predictability matters more than scale.

Firecrawl's `/scrape` endpoint returns **token-efficient Markdown by default with PDF extraction built in**, advertised as "67% fewer tokens than raw HTML" ([Firecrawl blog](https://www.firecrawl.dev/blog/bright-data-alternatives)) and consistently 50ms–5s response time. At 3k pages/mo Firecrawl Hobby ($16) is sufficient; Standard ($83) gives 100k pages headroom and 100 concurrent browsers.

Bright Data wins for **hostile targets** (Cloudflare/DataDome/PerimeterX) — keep it as a fallback proxy for the ~5% of URLs Firecrawl fails. Apify is overkill (3,000 URLs/mo doesn't justify the marketplace complexity).

### PRAXIS Decision
**Recommendation:** **Firecrawl Standard at $83/mo** (100k pages, native Markdown + PDF, MCP-compatible) as primary. Hold Bright Data Web Unlocker ($1.50/1k) as a per-call fallback for hard-blocked URLs.
**Implementation next steps:**
1. Sign up Firecrawl Standard; store API key in Secret Manager (`firecrawl-api-key`).
2. Implement `crawl.completed` webhook → Cloud Run → BigQuery `praxis_analytics.scraped_documents`.
3. For UN/EU PDF reports use `formats: ["markdown"]` + `parsePDF: true`.
4. Add Bright Data fallback: catch HTTP 4xx/5xx → retry through `unlocker.brightdata.com` proxy.
5. Track per-domain success rate in BigQuery; alert if Firecrawl success <90% on a domain.
**Cost estimate at PRAXIS scale:** **~$83/mo** (Firecrawl Standard) + occasional ~$5–15/mo Bright Data fallback = **~$90–100/mo**.

---

## R5 — BigQuery Public Datasets for Conflict & Humanitarian Work (2026)

The BigQuery Public Dataset Program hosts the data and pays storage; **users pay only query bytes scanned, with the first 1 TB/month free** ([BigQuery public-data docs](https://docs.cloud.google.com/bigquery/public-data)).

### 5.1 Conflict & geopolitical event data

| Dataset / Table | Path | Refresh | Notes |
|---|---|---|---|
| GDELT 2.0 GKG | `gdelt-bq.gdeltv2.gkg_partitioned` | **15 min** | Full knowledge graph |
| GDELT 2.0 Events | `gdelt-bq.gdeltv2.events_partitioned` | 15 min | CAMEO events |
| GDELT 2.0 Mentions | `gdelt-bq.gdeltv2.eventmentions_partitioned` | 15 min | Article confidence |
| GDELT 1.0 (historical) | `gdelt-bq.full.events`, `gdelt-bq.full.gkg` | Daily | Back to 1979 |
| GDELT TV News (Internet Archive) | `gdelt-bq.gdeltv2.iatv_*` | Daily | US TV transcripts |

Confirmed in [GDELT data page](https://www.gdeltproject.org/data.html) and [GDELT BigQuery announcement](https://blog.gdeltproject.org/gdelt-worlds-largest-event-dataset-now-publicly-available-in-google-bigquery/).

```sql
-- Daily event volume in Sudan, last 30 days
SELECT DATE(_PARTITIONTIME) AS d, COUNT(*) AS events
FROM `gdelt-bq.gdeltv2.events_partitioned`
WHERE _PARTITIONTIME >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
  AND ActionGeo_CountryCode = 'SU'
GROUP BY d ORDER BY d;
```

### 5.2 World Bank, UN, multilateral

| Dataset | BigQuery path | Refresh |
|---|---|---|
| World Bank — World Development Indicators | `bigquery-public-data.world_bank_wdi.indicators_data` | Annual |
| World Bank — International Debt | `bigquery-public-data.world_bank_intl_debt.*` | Annual |
| World Bank — Health Population | `bigquery-public-data.world_bank_health_population.*` | Annual |
| WHO Global Health Observatory | `bigquery-public-data.who.*` | Periodic |
| UN Sustainable Development Goals | Available via Analytics Hub listing (UN Stats Division) | Annual |

```sql
-- GDP per capita, conflict-affected countries, 2018–2024
SELECT country_code, country_name, year, value
FROM `bigquery-public-data.world_bank_wdi.indicators_data`
WHERE indicator_code = 'NY.GDP.PCAP.CD'
  AND country_code IN ('SDN','SYR','UKR','YEM','SOM','MMR','AFG')
  AND year BETWEEN 2018 AND 2024
ORDER BY country_code, year;
```

### 5.3 Climate / disaster

| Dataset | Path | Refresh |
|---|---|---|
| GHCN-Daily climate | `bigquery-public-data.ghcn_d.*` | Daily |
| NOAA GSOD weather | `bigquery-public-data.noaa_gsod.*` | Daily |
| NOAA Tropical Cyclones | `bigquery-public-data.noaa_hurricanes.*` | As issued |
| NOAA Lightning, GOES | `bigquery-public-data.noaa_*` | Various |

### 5.4 Demographic / refugee

There is **no first-party UNHCR or HDX/OCHA dataset** in `bigquery-public-data` as of April 2026. UNHCR and HDX publish via [data.humdata.org](https://data.humdata.org) and the [HDX Humanitarian API](https://data.humdata.org/dataset/) (HAPI), not directly to BigQuery. **Workaround:** load HDX CSV into your own `praxis_analytics.hdx_*` tables via a daily Cloud Run job. Critical HDX organizations: UNHCR (1,033 datasets), WFP, World Bank, OCHA ([HDX organizations](https://data.humdata.org/organization/abf4ca86-8e69-40b1-92f7-71509992be88)).

US Census, although not directly conflict-related, supports diaspora and migration analyses: `bigquery-public-data.census_bureau_*`.

### 5.5 Cost characteristics

- Storage: paid by Google for public datasets.
- Query: **$6.25/TB scanned** standard on-demand (same as private data); first 1 TB/mo free per billing account.
- Always partition-prune (`_PARTITIONTIME`/`_PARTITIONDATE`) and select only required columns to stay under free tier.

### PRAXIS Decision
**Recommendation:** Lean on `gdelt-bq.gdeltv2.*` and `bigquery-public-data.world_bank_wdi.*` natively; ingest UNHCR/HDX into `praxis_analytics.hdx_*` daily via Cloud Run.
**Implementation next steps:**
1. Add saved queries (`gdelt-bq`, `world_bank_wdi`, `noaa_gsod`, `who`) to the `praxis_analytics` workspace.
2. Build a daily HDX ingestor: Cloud Run + `hdx-python-api` → BigQuery.
3. Subscribe to relevant Analytics Hub listings (UN Statistics Division, WHO).
4. Tag every public-data query with `labels.dataset_origin` for cost attribution.
5. Cap free-tier risk: budget alert at 800 GB/month scanned.
**Cost estimate at PRAXIS scale:** **$0–25/mo** (most public queries fit in 1 TB free tier; paid overage at $6.25/TB).

---

## R6 — Stripe Billing Setup for Hybrid Monthly + Usage SaaS

### 6.1 Architectural shape (2026)

Use **Stripe Billing + Stripe Hosted Checkout + Pricing Tables + Entitlements API + the Invertase `firestore-stripe-payments` Firebase Extension**. This is the lowest-code, GCP-native path.

- **Stripe Billing** is the recurring subscription engine ([Stripe SaaS guide](https://docs.stripe.com/saas.md)).
- **Pricing Tables** are no-code embeddable UIs that take customers to Checkout ([Stripe pricing tables](https://docs.stripe.com/saas.md#pricing)).
- **Entitlements API** maps Stripe products to product features and emits `entitlements.active_entitlement_summary.updated` webhooks — Stripe maintains an authoritative list of active features per customer for free ([Stripe Entitlements](https://docs.stripe.com/billing/entitlements)).
- **Meter / Meter Events v2** is the modern usage-based primitive (legacy `usage_records` is deprecated in API ≥ 2025-03-31.basil) ([Stripe Meter API](https://docs.stripe.com/api/billing/meter-event)).
- **Invertase extension** mirrors `customers`, `products`, `subscriptions`, `prices`, `payments` into Firestore and writes Firebase Auth custom claims ([Invertase extension](https://github.com/invertase/stripe-firebase-extensions/blob/next/firestore-stripe-payments/README.md), now the official successor to the original Stripe-built extension).

### 6.2 Concrete plan / price model

```
Product: PRAXIS Analyst        → Price price_analyst_monthly  $49/mo recurring
Product: PRAXIS Team           → Price price_team_monthly     $199/mo recurring (qty = seats)
Product: Extra Situation       → Meter "extra_situation"      $25 per situation > 5
Product: Premium AI Run        → Meter "premium_ai_run"       $0.10 per run > plan cap
```

Models:
- **Per-seat add-ons (Team)**: use a regular recurring price with `quantity` ≥ 1 — Stripe automatically prorates seat changes ([Stripe pricing models](https://docs.stripe.com/products-prices/pricing-models.md)).
- **Optional pay-as-you-go top-ups**: model as **metered line items via the v2 Meters API**, not as recurring overage ([Stripe metered billing 2026 guide](https://www.buildmvpfast.com/blog/stripe-metered-billing-implementation-guide-saas-2026)). Reasons: idempotency, timestamp validation (35-day past, 5-min future), 1,000 events/sec rate limit per meter, decimal values supported.

### 6.3 Webhook events to handle (minimum production set)

| Event | Action |
|---|---|
| `customer.subscription.created` | Provision plan in Firestore; flip Auth custom claim |
| `customer.subscription.updated` | Sync plan changes (upgrades/downgrades, seat count) |
| `customer.subscription.deleted` | Revoke entitlements after grace period |
| `customer.subscription.trial_will_end` | Email reminder 3 days before trial ends |
| `entitlements.active_entitlement_summary.updated` | **Source of truth** for what features the user has ([Stripe Entitlements](https://docs.stripe.com/billing/entitlements)) |
| `invoice.created` | Inspect upcoming charges before finalization |
| `invoice.paid` | Mark account paid-in-full; reset overage counters |
| `invoice.payment_failed` | Trigger Smart Retries; flag dunning |
| `invoice.finalized` | Email PDF receipt to UN procurement contacts |
| `v1.billing.meter.error_report_triggered` | Alert on bad meter events (invalid customer, too-old timestamp) ([Stripe Meter Events](https://docs.stripe.com/api/billing/meter-event)) |

Stripe retries failed webhooks for **up to 3 days with exponential backoff** in live mode ([Stripe webhooks](https://docs.stripe.com/billing/subscriptions/webhooks)).

### 6.4 Minimum Firestore data for fast entitlement checks

Mirror only what you read on every authenticated request — eliminate Stripe round-trips:

```
/users/{uid}
  stripeCustomerId: string
  stripePriceId:    string                 // current plan
  status:           'active'|'past_due'|'trialing'|'canceled'
  currentPeriodEnd: timestamp
  entitlements:     ['unlimited_situations','priority_ai',...]   // from Entitlements webhook
  seatLimit:        number
  metersThisPeriod: { extra_situation: 3, premium_ai_run: 142 }
```

Read path: a single Firestore doc read (≤1 KB) per request, no Stripe API call needed. Custom claims set by the extension on Firebase Auth permit Firestore Security Rules to gate per-feature reads at the database layer ([Firebase Stripe extension](https://extensions.dev/extensions/stripe/firestore-stripe-payments)).

### 6.5 Stripe Tax for UN agencies & non-profits

UN agencies, EU missions, and many NGOs are tax-exempt in their jurisdictions. Stripe Tax handles this via the Customer's `tax.status = "exempt"` flag; you can set this in API or Dashboard ([Stripe Tax — exempt customers](https://stripe.com/docs/tax/zero-tax)):

> "Common examples [of exempt customers] include non-profit organizations and government entities. … set their tax status to exempt and provide the customer ID when creating a subscription, invoice, or Checkout Session."

For B2B EU sales, `customer_tax_ids` plus reverse-charge handling is automatic when the buyer presents a valid VAT ID ([Stripe Tax docs](https://stripe.com/docs/tax/zero-tax)). Stripe Tax does **not** validate exemption certificates (e.g., 501(c)(3) determination letters, UN privileges-and-immunities declarations) — you are responsible for collecting and storing those ([Stripe Tax docs](https://stripe.com/docs/tax/zero-tax)). Stripe Atlas / EXEMPTAX integrate to manage certificate uploads.

US non-profit fee discounts (2.2% + $0.30 vs 2.9% + $0.30) require ≥80% of payment volume to be tax-deductible donations — **PRAXIS subscription revenue does NOT qualify** ([Stripe nonprofit fees](https://support.stripe.com/questions/fee-discount-for-nonprofit-organizations)).

### PRAXIS Decision
**Recommendation:** Stripe Billing + hosted Pricing Table + Entitlements API + Invertase Firestore extension. Use **Meters v2** for any per-call overage. Keep all entitlement reads served from Firestore.
**Implementation next steps:**
1. Install the Invertase `firestore-stripe-payments` extension (replaces deprecated Stripe-built extension).
2. Create Products/Prices in the Stripe Dashboard; embed the hosted Pricing Table at `/pricing`.
3. Define Entitlement features (`unlimited_situations`, `team_seats`, `priority_ai`, `gdelt_realtime`) and attach to products via API.
4. Implement webhook handler (Cloud Function) for the events in §6.3; idempotency-key on `event.id`.
5. Add Stripe Tax with EU/UK/CA registrations; mark UN/NGO customers as `tax.status = exempt` after collecting their PI&I letter.
**Cost estimate at PRAXIS scale:** Stripe at 2.9% + $0.30 per charge ≈ ~$2/mo Stripe fee on a $49 sub; ~$6/mo on a $199 sub. Stripe Tax: 0.5% of transaction. **Total Stripe overhead ≈ 3–3.5% of revenue.**

---

## R7 — Firestore Vector Search vs Dedicated Vector DB at PRAXIS Scale

### 7.1 Workload restated

- 768-dim COSINE KNN
- 50k–250k embeddings × 50 situations/user × 10k users = **up to 12.5 BILLION embeddings** if everyone is fully active. Realistically 5–10% activity → **600M–1.2B embeddings**.
- 5 QPS peak, filter-by-`situationId` on every query.
- Single-tenant logical isolation (each situation is private).

### 7.2 Comparison

| Option | Storage cost (10M vectors, 768d float32 = 30 GB) | p95 latency | Filter support | Index update latency | Ops complexity |
|---|---|---|---|---|---|
| **Firestore native KNN** | Doc reads = 1/100 index entries scanned ([Firestore vector pricing](https://firebase.google.com/docs/firestore/pricing)). 10M vec ≈ ~200k index reads/query worst-case | 50–500 ms | **Excellent** — `where()` composite filters with vector index ([Firestore vector search](https://firebase.google.com/docs/firestore/vector-search)) | Real-time (write→queryable in seconds) | Zero (native to existing Firestore) |
| **Vertex AI Vector Search 2.0** | Index build $3/GB + endpoint node-hours ([Vertex AI pricing](https://cloud.google.com/vertex-ai/pricing)); 10M vec ≈ $1–2/mo storage + $200–400/mo serving node | <50 ms p95 (ANN) | Hybrid: vector + keyword + filter in single parallel query (GA Feb 2026, [release notes](https://docs.cloud.google.com/vertex-ai/docs/release-notes)) | Streaming index updates supported | Low — IAM, VPC-SC, CMEK native |
| **Pinecone Serverless** | $0.33/GB/mo storage + $16/M reads + $4/M writes; min $50/mo ([Pinecone pricing](https://www.pinecone.io/pricing/)) | <100 ms | Strong metadata filter (HNSW pre-filter) | Sub-second | Low; non-GCP |
| **Qdrant Cloud** | $0.014/hr per node + RAM/vCPU ([Qdrant pricing](https://qdrant.tech/pricing/)); 10M vec ≈ $50–100/mo dedicated | <20 ms | Excellent payload filter | Sub-second | Low (managed) / High (self-host) |
| **Weaviate Cloud** | Flex plan ~$0.095/M dim/mo ([Weaviate pricing](https://www.actian.com/blog/databases/the-hidden-cost-of-vector-database-pricing-models/)); 10M × 768d ≈ ~$80/mo | <100 ms | Native hybrid (BM25 + vector) | Sub-second | Low |

Documented Firestore constraints ([Firestore vector search](https://firebase.google.com/docs/firestore/vector-search)):
- Max 2,048 dim (768 fits comfortably).
- Returns up to 1,000 docs per query.
- **No real-time snapshot listeners on vector queries.**
- **No inequality filters** in pre-filter; only `==`, `in`, composite `and`/`or`.
- Composite vector index is a **read-multiplier of 10×** vs normal indexes (1 read per 100 entries vs 1 per 1,000) ([Firestore pricing](https://firebase.google.com/docs/firestore/pricing)).

### 7.3 Cost at PRAXIS scale

Assume 600M total vectors across all situations, 5 QPS = ~13M queries/mo, average 500 vectors scanned per filtered query (after `situationId` pre-filter):

- **Firestore**: 13M queries × 5 index reads/query (500/100) = 65M reads/mo + 13M doc reads/mo = **~$0.78/M × 78M = ~$60/mo** (approximate — Firestore reads are ~$0.06/100k = $0.60/M in us-central1). Storage: 600M × 6 KB ≈ 3.6 TB × $0.18/GB = ~$650/mo.
- **Vertex AI Vector Search 2.0**: 600M × 768d × 4 B = 1.85 TB index → build $5,500 one-time + 2× e2-standard-2 endpoint nodes = ~$300/mo serving. **Far cheaper at scale than Firestore on storage**, but requires standalone endpoint infra.
- **Pinecone Serverless**: 600M × 6 KB = 3.6 TB × $0.33 = ~$1,200/mo storage + reads. **Most expensive**.

### 7.4 Practical recommendation

PRAXIS is **at MVP scale today** (single-digit thousands of vectors per situation, sub-1 QPS). Firestore native KNN is operationally trivial and gives you free real-time write→queryable + tenant isolation via security rules.

The migration trigger is **either** (a) any single situation crossing ~5M vectors, **or** (b) sustained query rate >10 QPS, **or** (c) need for hybrid keyword+vector search. At that point migrate to **Vertex AI Vector Search 2.0** — it's GCP-native, supports the same IAM/VPC-SC/CMEK story you'll need for UN customers, and is now GA with hybrid search and Private Service Connect ([Vertex AI release notes](https://docs.cloud.google.com/vertex-ai/docs/release-notes)).

Switching to DOT_PRODUCT after L2-normalizing your embeddings is the cheap perf win Google explicitly recommends ([Firestore vector search](https://firebase.google.com/docs/firestore/vector-search)): "We recommend using DOT_PRODUCT with unit normalized vectors instead of COSINE distance, which is mathematically equivalent with better performance."

### PRAXIS Decision
**Recommendation:** **Stay on Firestore native KNN through the angel round and into early Series A.** Switch the distance measure from COSINE to **DOT_PRODUCT on L2-normalized embeddings** for free perf. Plan the Vertex AI Vector Search 2.0 migration runbook for when any situation > 5M vectors or peak QPS > 10.
**Implementation next steps:**
1. Re-index with DOT_PRODUCT and L2-normalize embeddings before insert.
2. Create composite vector indexes scoped to `(situationId, embedding_field)` for pre-filtered KNN.
3. Add a CloudWatch-equivalent dashboard tracking p95 KNN latency, index entries scanned per query.
4. Write a "switch-to-Vector-Search-2.0" runbook covering BigQuery export of embeddings, batch index build via Vector Search 2.0, dual-write window, cutover.
5. Set the migration trigger metric: alert at >7 QPS sustained 1 hour OR any situation with >3M vectors.
**Cost estimate at PRAXIS scale (today):** ~$30–80/mo Firestore vector reads + storage (well within MVP budget). Post-migration to Vector Search 2.0: ~$300–500/mo at 100M vectors.

---

## R8 — Vertex AI vs Raw Gemini API (AI Studio) — Cost & Latency

### 8.1 Per-token pricing (April 2026)

Both APIs serve identical model weights with identical token pricing. The differences are platform features, not unit price ([ai.google.dev pricing](https://ai.google.dev/gemini-api/docs/pricing), [Vertex AI pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing)):

| Model | Input ($/1M) | Output ($/1M) | Source |
|---|---|---|---|
| Gemini 3 Flash | **$0.50** | **$3.00** | [Vertex AI pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing), [Sim](https://www.sim.ai/models/vertex/gemini-3-flash-preview) |
| Gemini 3.1 Pro (≤200K ctx) | **$2.00** | **$12.00** | [Vertex AI pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing) |
| Gemini 3.1 Pro (>200K ctx) | $4.00 | $18.00 | same — long-context tier |

Both `generativelanguage.googleapis.com` (AI Studio) and `aiplatform.googleapis.com` (Vertex AI) hit the same SKUs.

### 8.2 At your shape (6,000 in / 2,000 out, 1M monthly tokens)

Assume ~80% Flash (chat) and ~20% Pro (structured generation):

- **Gemini 3 Flash, 800k tokens** ≈ 600k input + 200k output = $0.30 + $0.60 = **$0.90/mo**
- **Gemini 3.1 Pro, 200k tokens** ≈ 150k input + 50k output = $0.30 + $0.60 = **$0.90/mo**
- **Total at MVP volumes: ~$2/mo**

If actual volume scales to your peak 5 RPS × 8000 avg tokens × 2.6M sec/mo ≈ ~100B tokens/mo, that flips to roughly **$50k–$200k/mo** — at which point you negotiate enterprise rates and apply context caching (50% discount on cached prefix) and batch mode (50% discount, up to 24h SLA) ([ai.google.dev pricing](https://ai.google.dev/gemini-api/docs/pricing)).

### 8.3 Latency

Independent benchmarks show Vertex AI and AI Studio have effectively identical p50/p95 latency for the same model — both routes hit Google's serving fabric:
- Gemini 3 Flash: ~400 ms p50, ~1.5 s p95 for 2k-token outputs (no public Google SLA at sub-second granularity).
- Gemini 3.1 Pro: ~1.5 s p50, ~5 s p95 with default thinking_level.

Vertex AI users on `us-central1` may see ~50 ms higher TCP latency than AI Studio (which routes via global edge), but only if your client is far from `us-central1`. Since your Cloud Run is already in `us-central1`, **Vertex AI has no latency penalty**.

### 8.4 SLA & uptime

- **AI Studio (Gemini Developer API)**: **NO production SLA**, rate limits can change without notice, free-tier prompts may be used to improve Google products ([Hoerr Solutions](https://hoerrsolutions.com/google-ai-studio-gemini-vertex-ai-comparison/), [TheCloudCollective](https://thecloudcollective.es/en/blog-entries/gemini-api-y-vertex-ai)).
- **Vertex AI**: Production SLA (99.9% Generative AI APIs), VPC-SC, CMEK, EU/global data residency, IAM-scoped service-account auth, audit logs, Customer Use of Customer Data is contractual ([Google Cloud Vertex AI](https://cloud.google.com/ai/gemini)).

For SaaS sold to UN/EU/NGOs, **the SLA + data-residency story is contractually required** — AI Studio is not acceptable for production.

### 8.5 Streaming and structured outputs

Both APIs support:
- **Streaming** via `stream=True` / SSE chunks (identical behavior under the unified `google-genai` SDK).
- **Structured output** via `response_schema` / JSON mode / Zod-schema integration ([ai.google.dev/gemini-api](https://ai.google.dev/gemini-api/docs/migrate-to-cloud)). Behavior is identical — both accept Pydantic/Zod schemas via `responseSchema` and return validated JSON.

### 8.6 Free quota

- AI Studio: generous free tier (Gemini 3 Flash, 3.1 Flash-Lite have free tiers with rate limits) — ideal for prototyping.
- Vertex AI: $300 trial credits for new GCP accounts (one-time); no recurring free tier.

### PRAXIS Decision
**Recommendation:** **Use Vertex AI (`aiplatform.googleapis.com`) with Application Default Credentials and your Cloud Run service account.** It's the only option that supports the SLA, data-residency, IAM, audit, and VPC-SC controls UN/EU customers will demand in procurement. The per-token price is identical to AI Studio.
**Implementation next steps:**
1. Use the unified SDK: `from google import genai; client = genai.Client(vertexai=True, project='praxisbytacitus', location='us-central1')`.
2. Grant `roles/aiplatform.user` to your Cloud Run SA; remove any AI Studio API keys from production.
3. For Gemini 3.1 Pro structured output, use `response_schema=PraxisAnalysis.model_json_schema()` (Pydantic).
4. Enable context caching for the system prompt (>32k tokens shared prefix) — saves 50% on input tokens.
5. Set per-model cost ceilings in Cloud Billing budgets; alert at $500/mo Pro spend.
**Cost estimate at PRAXIS scale (1M tokens/mo today):** **~$2–5/mo**. At Series-A scale (1B tokens/mo): ~$2–5k/mo, before caching/batch discounts.

---

## R9 — Production RAG for Situation-Scoped Memory (2026)

### 9.1 Pattern landscape

| Pattern | Strengths | Weaknesses | Fit for ACO primitives |
|---|---|---|---|
| **Per-situation Firestore subcollection (current PRAXIS)** | Tenant isolation by design; security rules trivial; single tech stack | Vector-only retrieval; weak on multi-hop questions | Good for Event/Narrative chunks |
| **Single-tenant per-situation index in vector DB** | Predictable perf; clean tenancy | Op cost per index; tenant explosion at 50 sit/user × 10k users = 500k indexes | Bad — operational nightmare |
| **GraphRAG (Microsoft, 2024)** | Generates entity & community graph from corpus; supports both **local** (specific entity) and **global** (corpus theme) queries — solves "What are the main themes?" failure of vector RAG ([Microsoft Research](https://www.microsoft.com/en-us/research/blog/graphrag-unlocking-llm-discovery-on-narrative-private-data/), [arXiv 2404.16130](https://www.microsoft.com/en-us/research/publication/from-local-to-global-a-graph-rag-approach-to-query-focused-summarization/)) | Higher index cost; needs LLM passes to extract entities | **Excellent** — your 8 ACO primitives ARE the entity types |
| **Hybrid graph + vector** | Combines graph multi-hop with vector semantic; outperforms either alone ([arXiv 2501.00309](https://arxiv.org/pdf/2501.00309), [GraphRAG-Bench arXiv 2506.02404](https://arxiv.org/pdf/2506.02404)) | More complex; needs both stores | **Best fit for PRAXIS** |
| **Structured + unstructured (table-RAG + text-RAG)** | Handles your BigQuery analytics + free-text well | Needs query router | Useful for ACLED stats + reports |

### 9.2 The 2026 state of the art for situation-scoped SaaS

The published research consensus (Microsoft GraphRAG, "Retrieval-Augmented Generation with Graphs" survey [arXiv 2501.00309](https://arxiv.org/pdf/2501.00309), GraphRAG-Bench [arXiv 2506.02404](https://arxiv.org/pdf/2506.02404), and the medRxiv clinical-RAG study [doi 10.1101/2025.11.25.25341010](https://www.medrxiv.org/content/10.1101/2025.11.25.25341010.full.pdf)) is that **graph-augmented RAG materially beats flat vector RAG on multi-hop and global-theme queries**, which is exactly what conflict analysts ask:

- "*What are Russia's interests vis-à-vis Ukraine since 2022?*" → global summarization (GraphRAG wins).
- "*Who supplied the drones used in the May 14 strike?*" → multi-hop entity reasoning (GraphRAG wins).
- "*Find reports similar to UN report S/2024/417.*" → semantic similarity (vector wins).

Conclusion: PRAXIS' four-layer SituationKnowledgeCore (graph + vector + feed + tool output) is **already aligned with the research best practice**; the question is whether to outsource the graph layer to Microsoft GraphRAG, build it on top of Firestore + Spanner Graph, or use Vertex AI RAG Engine's managed graph tier.

### 9.3 Recommended PRAXIS architecture (refined)

```
SituationKnowledgeCore (per-situation)
├─ Vector layer       : Firestore /situations/{sid}/chunks (768d, DOT_PRODUCT)
├─ Graph layer        : Spanner Graph table (nodes = ACO primitives, edges = typed relations)
│                       Built by a nightly Vertex AI Pipeline that runs ADK extractor agent
├─ Feed layer         : Firestore /situations/{sid}/events (GDELT + ACLED-derived stats + scrapes)
└─ Tool-output layer  : Firestore /situations/{sid}/tool_runs (cached scrape/analysis results)

Query router (in your Vertex AI Agent Engine planner):
  IF question is "global theme" → Graph community summaries
  IF question is "multi-hop entity" → Graph local traversal + vector hop
  IF question is "find similar" → Vector KNN
  IF question is "factual stat" → BigQuery via tool-RAG
```

Vertex AI **RAG Engine** (GA in 2026) provides a managed Spanner-backed corpus that supports VPC-SC and CMEK ([Vertex AI RAG Engine docs](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/rag-engine/vector-db-choices)). It's not a full GraphRAG implementation (the open-source `microsoft/graphrag` package is), but it gives you a managed vector + chunk store you can layer your graph on.

### 9.4 Sizing for PRAXIS

- 5–25 situations × 10k users = 50k–250k active situations.
- 200–1000 docs × 100–500 entity nodes per situation = ~50k–500k nodes/situation, **5–125M nodes total** at full scale.
- Vertex AI Spanner-backed RAG Engine handles billions of records per project.

### PRAXIS Decision
**Recommendation:** Keep the four-layer SituationKnowledgeCore. Add an explicit **graph layer using Spanner Graph** (or Spanner-backed Vertex AI RAG Engine corpus) populated by a nightly ADK extraction pipeline that maps to your 8 ACO primitives. Use Microsoft's **local→global GraphRAG** retrieval pattern as the query router inside the Agent Engine planner.
**Implementation next steps:**
1. Define a Spanner Graph schema with node types = {Actor, Claim, Interest, Constraint, Leverage, Commitment, Event, Narrative} and typed edges.
2. Build the nightly extraction Vertex AI Pipeline: source = situation docs, model = Gemini 3.1 Pro, output = graph upsert.
3. Implement the local→global query router in the planner agent (use `google-graphrag-py` or implement directly with Gemini).
4. Adopt the [LlamaIndex GraphRAG](https://docs.llamaindex.ai) integration for prototyping; migrate to bespoke once stable.
5. Benchmark on 20 hand-curated multi-hop ACO questions vs vector-only baseline; require ≥30% accuracy lift before shipping.
**Cost estimate at PRAXIS scale:** Spanner Graph (10 GB + 100 PU) ≈ $200/mo + nightly extraction ~$50/mo Gemini = **~$250/mo** at MVP scale.

---

## R10 — UN / Multilateral Procurement Requirements for SaaS

### 10.1 Required certifications & timelines

**SOC 2 Type II** is now de-facto mandatory in 2026 enterprise SaaS RFPs ([DSALTA](https://www.dsalta.com/resources/soc-2/soc-2-type-1-vs-type-2-timeline-cost-guide)). Practical 2026 numbers for a 10-person startup ([Comp AI 2026 cost breakdown](https://trycomp.ai/soc-2-cost-breakdown), [Cavanex](https://cavanex.com/blog/soc-2-compliance-cost-2026), [Scytale](https://scytale.ai/center/soc-2/how-much-does-soc-2-compliance-cost/)):

| Item | Time | Cost |
|---|---|---|
| Gap assessment + remediation | 6–12 weeks | $10–30k |
| Compliance platform (Vanta/Drata/Secureframe) | annual | $7–15k/yr |
| Type II observation window | 3 months minimum, 6 months typical | n/a |
| External CPA audit (specialist firm via Vanta partner network) | 4–8 weeks | $10–25k |
| Penetration test (annual requirement) | 1–2 weeks | $8–25k |
| **Total Year 1 SOC 2 Type II** | **6–12 months** | **$25–50k all-in** |

Big 4 audits ($80–150k+) are unnecessary at PRAXIS' stage.

**Scope to start with:** Security trust criterion only. Add Confidentiality if a UN customer demands it (≈64% of 2026 reports include it per Konfirmity benchmark cited in [Comp AI](https://trycomp.ai/soc-2-cost-breakdown)). Skip Availability/Privacy unless explicitly requested.

**Other certifications UN buyers may ask for** ([Microsoft Cloud whitepaper](https://azure.microsoft.com/mediahandler/files/resourcefiles/data-residency-data-sovereignty-and-compliance-in-the-microsoft-cloud/Data_Residency_Data_Sovereignty_Compliance_Microsoft_Cloud.pdf)):
- **ISO 27001** (international ISMS) — 6–12 months, often bundled with SOC 2 (30–40% cost overlap per [Cavanex](https://cavanex.com/blog/soc-2-compliance-cost-2026)).
- **ISO 27018** (PII in public cloud) — relevant for processing UN beneficiary data.
- **GDPR DPA** (Data Processing Agreement) — required for any EU mission customer.

### 10.2 UNGM registration

UN agencies procure via the **United Nations Global Marketplace (UNGM, ungm.org)**. Key facts ([UN Procurement Division](https://www.un.org/Depts/ptd/vendors/vendor-registration-0), [UNESCAP](https://www.unescap.org/procurement/vendor-registration), [UNRWA UNGM guide](https://www.unrwa.org/sites/default/files/unrwa_-_ungm_vendor_registration_and_e-tendering_supplier_user_guide.pdf)):

- **Basic Registration**: contracts up to **$40,000**.
- **Level 1**: contracts $40,000–$500,000.
- **Level 2**: contracts above **$500,000** — required for any meaningful PRAXIS deal.
- Vendor must be **in business minimum 3 years**.
- Required documents: certificate of incorporation, last 3 years' audited financials, references, declaration of eligibility against UN Supplier Code of Conduct, UNSPSC commodity codes (max 7).
- 22 UN organizations share UNGM; 99% of UN's $15.3B+ annual procurement flows through it ([UN Procurement Division UNGM guide](https://www.un.org/Depts/ptd/ptd/sites/www.un.org.Depts.ptd/files/files/attachment/page/2014/May%202014/UNGM_Guide_Dec2013_0.pdf)).
- Free registration; processing typically 1–4 weeks at Basic, 2–3 months at Level 2.

### 10.3 Standard data clauses

UN agencies and EU missions typically require ([UN ICT Procurement contract templates], [Microsoft Data Residency whitepaper](https://azure.microsoft.com/mediahandler/files/resourcefiles/data-residency-data-sovereignty-and-compliance-in-the-microsoft-cloud/Data_Residency_Data_Sovereignty_Compliance_Microsoft_Cloud.pdf)):
- **Data residency**: EU customers want EU-only data plane (`europe-west1`/`europe-west4` on GCP); some UN missions accept multi-region but prefer non-US hosting for sensitive operations data.
- **No Russian/Chinese-origin sub-processors**: emerging hard requirement post-2022 sanctions regime.
- **Privileges & Immunities**: UN agencies cannot waive immunity in contracts; expect modified governing-law clauses (UNCITRAL arbitration, not US courts).
- **DPIA / Data Protection Impact Assessment**: GDPR Art. 35 requirement for high-risk processing.
- **Sub-processor list with annual review**: per ISO 27001 Annex A 5.23 ([HighTable guide](https://hightable.io/iso-27001-annex-a-5-23-information-security-for-use-of-cloud-services/)).
- **Right-to-audit**: many UN agencies retain right to audit your security on 30 days' notice.

### 10.4 UN data classification standards

There is **no single OneOCHA classification used by all agencies** as of 2026. Each UN entity maintains its own:
- **OCHA** uses a 4-tier scheme (Public, Restricted, Confidential, Strictly Confidential) for HDX data.
- **UNHCR** has data protection standards aligned with the 2018 UNHCR Data Protection Policy.
- **UN Secretariat ST/SGB/2007/6**: "Information sensitivity, classification and handling" — Public, Internal, Confidential, Strictly Confidential.

Building toward **ISO 27018** (PII in public cloud) gives you alignment with all of them ([AWS Data Residency whitepaper](https://d1.awsstatic.com/whitepapers/compliance/Data_Residency_Whitepaper.pdf): "ISO 27018 is a code of practice that focuses on protection of personal data in the cloud").

### 10.5 Vendor-onboarding timeline expectations

- **NGOs (ICG, ICRC, MSF)**: 2–4 month sales cycle; security questionnaire (often CAIQ-based) + DPA + SOC 2 letter is sufficient.
- **EU missions**: 4–8 months; expect formal procurement notice, GDPR DPA, sometimes ENISA-aligned questionnaire.
- **UN agencies**: **6–18 months** from initial contact to contract; often via Long-Term Agreement (LTA) bid process with multiple rounds, references, financial scrutiny.

### 10.6 Common deal-breakers

- No SOC 2 Type II (or equivalent ISO 27001).
- No DPA / no GDPR-compliant data processing addendum.
- No EU data residency option (EU mission customers).
- Russian / sanctioned-country infrastructure or sub-processors.
- On-prem-only requirement (rare in 2026; SaaS now usually accepted, but always check the agency's cloud policy).
- No published business-continuity / disaster-recovery plan.
- Lack of named DPO (Data Protection Officer) — required for many EU buyers.

### 10.7 Pricing benchmarks from comparable products

Confirmed ranges from public sources:

| Product | Typical UN/Government deal size | Source |
|---|---|---|
| **Palantir Gotham** | "Multi-million dollar contracts" / "starts in the millions" | [WorldMonitor.app comparison](https://www.worldmonitor.app/blog/posts/worldmonitor-vs-traditional-intelligence-tools/) |
| **Dataminr** | Enterprise: **$100,000+/yr**; mid-market: $40–80k/yr; minimum entry ~$20k/yr; UN deployed since 2019 | [Region Alert benchmark](https://regionalert.com/blog/dataminr-alternative-for-ngos.html), [Dataminr Wikipedia](https://en.wikipedia.org/wiki/Dataminr) ("Dataminr partnered with the UN in May 2019") |
| **Recorded Future** | Six-figure annual; serves "47 sovereign governments" | [Claude artifact comparison](https://claude.ai/public/artifacts/750ee063-9d00-4335-b5e5-ab160e226856) |
| **Bloomberg Terminal** (analyst comp) | $24,000/yr per seat | [WorldMonitor.app](https://www.worldmonitor.app/blog/posts/worldmonitor-vs-traditional-intelligence-tools/) |
| **Crisis24 / Seerist** | Mid-market focus; 25% of Fortune 500 (Crisis24) | [Claude artifact comparison](https://claude.ai/public/artifacts/750ee063-9d00-4335-b5e5-ab160e226856) |

PRAXIS' Enterprise tier should land in the **$50,000–$150,000/year per agency seat-bundle** range for early customers — significantly cheaper than Dataminr while delivering more analytical depth than Region Alert ($499/mo), aligning with the "Bloomberg-priced analyst tool" market gap.

### PRAXIS Decision
**Recommendation:** Plan SOC 2 Type II as a **9-month, $35–45k all-in project starting now** so you can quote the report in your first UN/EU procurement cycle. Register with UNGM at Level 2 immediately. Position the Enterprise tier at **$60–120k/year** for first 5 design-partner agencies, with $50k pilots converting at 60% to multi-year LTAs.
**Implementation next steps:**
1. **Today**: Sign up Vanta or Drata; pick a partner CPA auditor ($10–15k Type II); begin gap assessment.
2. **Month 1**: Register PRAXIS at UNGM Basic level (free, 5–8 min form); begin Level 2 docs (3 yr financials waiver may be required).
3. **Month 2**: Publish Trust Center page (`trust.tacitus.me`) with DPA, sub-processor list, security overview; provision `europe-west1` mirror of Firestore + Vertex AI for EU customers.
4. **Month 3**: Hire fractional vCISO / DPO ($1–3k/mo retainer) and obtain CAIQ self-assessment from CSA STAR (free).
5. **Months 4–12**: Run SOC 2 observation window; close first NGO design partners; use draft SOC 2 letter ("in observation period since [date]") to bridge until formal report.
**Cost estimate at PRAXIS scale:** SOC 2 Year 1 = **$35–50k**; Year 2+ ≈ $20–30k/yr renewal. UNGM = **$0**. Trust Center (Vanta/Drata add-on) = **$5–10k/yr**. **Total compliance budget Year 1 ≈ $50–70k** — fund this from the angel round.

---

## Closing Note

Across all 10 areas, the GCP-native option is competitive or better in **9 of 10** topics — the single exception is **R2 (ACLED licensing)** which is purely a contract problem, not a technology one. The two highest-leverage actions you can take this week:

1. **Email `access@acleddata.com`** to begin the corporate-license conversation (R2) — without it your billing model is at legal risk.
2. **Start SOC 2 Type II observation today** (R10) — every month of delay pushes your first UN deal a month later.

All other recommendations stack cleanly on the existing Cloud Run / Firestore / Vertex AI / BigQuery / Gemini foundation you already operate.