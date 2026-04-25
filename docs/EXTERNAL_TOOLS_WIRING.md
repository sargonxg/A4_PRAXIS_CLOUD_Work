# PRAXIS — External Tools Wiring Map

> Single source of truth for **which feed lights up which tool**, **what
> situation/profile context flows into each call**, and **what the
> degradation chain looks like when a feed is unconfigured**. Read this
> when you're wiring a new tool, debugging "why is my map empty?", or
> evaluating whether a new feed earns its place in the platform.

Anchored in the data-feed audit (compass artifact §R3, §R4, §R5) and
the Context Injection Contract (`docs/CONTEXT_INJECTION.md`).

---

## Overview

A PRAXIS tool's call graph is always:

```
User intent
   └─► Tool page (situation-guarded, calibrated)
         └─► /api/ai/<tool>  (withCalibration)
               └─► buildCalibratedContext()
                     └─► retrieves: graph + vector + feed + tool-output layers
                           └─► feed clients (this doc maps which)
```

Every feed below is invoked **with the active situation in scope** so
the call carries `region`, `actors`, `domain`, time-window, and the
analyst's lens preferences as filters. None of the feeds are queried
"globally" without context.

---

## Per-feed → tools map

### GDELT (free, BigQuery preferred)

| Tools that call it | Through |
|---|---|
| Geospatial Monitor | `/api/data/geospatial` → `gdelt-client.ts` |
| Risk Monitor | `getSituationIntelligence()` → instability index |
| Early Warning | `getSituationIntelligence()` → tone + spike detection |
| Timeline | event-by-time enrichment |
| Media Roundup | mention volume per outlet |
| Auto-Briefing | `getSituationIntelligence()` |

**Context flowed in:** `situation.region` (country filter), date window
derived from situation age + UI scrubber.

**Auth:** none (public). Hosted BigQuery is the preferred path —
`gdelt-bq.gdeltv2.gkg_partitioned`. Full implementation playbook at
**`docs/implementation/gdelt-ingestion-2026-04-25.md`** (1,036 lines —
service accounts, two-tier pull pattern, BigQuery table DDL, Cloud Run
Job source layout, Cloud Scheduler config, Firestore cache, T1 vs T2
trade-offs). Migration tracked as Stream B-10 in
`docs/SPRINT_BACKLOG.md`.

### ~~ACLED~~ — withdrawn 2026-04-25

PRAXIS no longer ingests ACLED. The 2026 EULA's prohibition on SaaS
redistribution made it incompatible with our open-source-only stance.
**Replacement:** event-level intelligence now flows from
**GDELT BigQuery + UCDP GED** (both open license, both already wired
above). The brief at `docs/tacitus-acled-integration-brief.md` is
kept as historical context only.

### UCDP GED (free, CC-BY 4.0)

| Tools | Through |
|---|---|
| Geospatial Monitor | historical events |
| Compare | historical conflict comparisons |
| Risk Monitor | structural fatality dimension |

**Context:** `situation.region`, situation start date.
**Auth:** none.

### UNHCR Refugee Data Finder (free)

| Tools | Through |
|---|---|
| Humanitarian | displacement figures |
| Risk Monitor | vulnerability dimension |
| Briefing | displacement context |

**Context:** `situation.region`, period of analysis.
**Auth:** none.

### HDX HAPI (free, license per dataset)

| Tools | Through |
|---|---|
| Humanitarian | IPC food-security phases |
| Risk Monitor | coping-capacity dimension |
| Briefing | humanitarian access summary |

**Context:** `situation.region`, optional country code (ISO-3).
**Auth:** none. Per-dataset licenses tracked in
`docs/COMPLIANCE.md` §1.5.

### ReliefWeb (free, attribution required)

| Tools | Through |
|---|---|
| Auto-Briefing | OCHA situation reports |
| Briefing | source pulls |
| Humanitarian | sitrep summaries |
| Daily Brief | OCHA + agency updates |

**Context:** `situation.region`, last 30 days.
**Auth:** none.

### UN News RSS (free, public domain)

| Tools | Through |
|---|---|
| Auto-Briefing | SG statements, Security Council items |
| Daily Brief | UN headlines |
| Briefing | UN-track context |

**Context:** `situation.region` and `situation.actors` for filtering.
**Auth:** none.

### World Bank WDI/WGI (free)

| Tools | Through |
|---|---|
| Risk Monitor | governance + economic indicators |
| Compare | structural cross-conflict context |
| Economic Impact | macro dimensions |

**Context:** country code derived from `situation.region`.
**Auth:** none.

### ~~SIPRI / Crisis Group scraped sources~~ — withdrawn 2026-04-25

Both required Firecrawl-mediated scraping. Replaced by **grounded
Google Search** for Crisis Group framing in briefings, and by
**World Bank + UCDP** for arms-flow / structural conflict context in
profiles.

### Google Search Grounding (free fallback)

| Tools | Through |
|---|---|
| ARGUS Grounded | `/api/ai/grounded-search` |
| Auto-Briefing deep mode | grounded synthesis |
| Assistant grounded mode | `/api/ai/grounded-search` |
| All feed-aggregator routes | terminal fallback when structured feeds empty |

**Context:** the entire `<analyst-profile>` + `<situation-frame>` is in
the system prompt; query is the user's input plus situation name.
**Auth:** Google AI key (or Vertex AI ADC).

### ~~Firecrawl~~ — withdrawn 2026-04-25

Open-source pivot. Web research now flows through **Vertex AI Deep
Research + grounded Google Search**. ARGUS and Sources Library use
the same path; Conflict Profile gets its enrichment from Wikipedia +
World Bank + UCDP rather than scraped Crisis Group / SIPRI.

### Vertex AI Reasoning Engine (Deep Research Agent)

| Tools | Through |
|---|---|
| Deep Research Agent | `/api/ai/deep-search-agent` → `vertex-agent.ts` |

**Context:** full `systemPromptBlock` plus user query streamed into the
3-phase pipeline.
**Auth:** `VERTEX_AGENT_ENGINE_ID`. When unset → falls back to
`getProModel()` (Gemini 3.1 Pro) without multi-phase pipeline.

### ~~Anthropic Claude~~ — withdrawn 2026-04-25

Open-source / single-AI-line pivot. `getAnalysisModel()` now always
returns Gemini 3.1 Pro on Vertex AI.

---

## Per-tool → feeds (inverse view)

For the top-traffic tools — quick lookup of what's required to make
each tool "fully alive" in production.

### Dashboard

- **Hard requirements:** `GOOGLE_AI_API_KEY` (or Vertex ADC)
- **Lights up further with:** ACLED, GDELT, ReliefWeb, HDX, World Bank
  (all via the SKC retrieval; the Daily Read enriches when present)

### Geospatial Monitor

- **Best-case:** ACLED (events) + GDELT (instability) + UCDP (history)
- **Without ACLED:** map shows GDELT events only; reduced precision
- **Without anything:** falls back to grounded-search hot-fetch (slow)

### Risk Monitor

- **Best-case:** ACLED + HDX + World Bank + UNHCR (full INFORM
  dimensions)
- **Without ACLED:** Hazard dimension uses GDELT only; less precise
- **Without HDX/World Bank:** Vulnerability + Coping Capacity
  approximated by Gemini grounded search

### Briefing / Auto-Briefing

- **Best-case:** GDELT + ACLED + ReliefWeb + UN News + Crisis Group +
  Firecrawl deep search + Vertex ADK (deep mode)
- **Without Firecrawl:** loses Crisis Group + SIPRI; everything else
  works

### Deep Research Agent

- **Hard requirement:** `VERTEX_AGENT_ENGINE_ID` for full multi-phase
- **Without it:** silently falls back to Gemini 3.1 Pro grounded
  search (functional but the demo loses its multi-agent narrative)

### ARGUS / ARGUS Grounded

- **Best-case:** Firecrawl + Gemini grounded
- **Without Firecrawl:** Gemini grounded only

### Sanctions Tracker

- Self-contained — uses curated UN/OFAC/EU/OFSI list datasets bundled
  with the repo. No external auth needed.

---

## Wire-state matrix (per environment)

| Feed | dev (your laptop) | staging (`praxis-frontend-staging`) | prod (today) | prod (after user actions) |
|---|---|---|---|---|
| Google AI | `GOOGLE_AI_API_KEY` in `.env.local` | secret | `praxis-google-ai-key` ✓ | `praxis-google-ai-key` (or migrate to Vertex ADC) |
| Vertex AI ADC | n/a (use API key) | n/a | n/a | enable via `AI_PROVIDER=vertex` |
| GDELT | none | none | none ✓ | optional: BigQuery upsert pipeline |
| ACLED | optional | optional | unset → empty | `ACLED_API_KEY` + `ACLED_EMAIL` + `ACLED_LICENSE_TIER` |
| UCDP | none | none | none ✓ | none ✓ |
| UNHCR | none | none | none ✓ | none ✓ |
| HDX | none | none | none ✓ | none ✓ |
| ReliefWeb | none | none | none ✓ | none ✓ |
| UN News | none | none | none ✓ | none ✓ |
| World Bank | none | none | none ✓ | none ✓ |
| Vertex ADK | unset | unset | unset → fallback | `VERTEX_AGENT_ENGINE_ID` |
| Firecrawl | optional | optional | unset → null | `FIRECRAWL_API_KEY` |
| Anthropic | optional | optional | unset → Gemini | `ANTHROPIC_API_KEY` |
| Stripe | unset | unset | unset → 503 | `STRIPE_*` (when monetising) |

---

## Adding a new feed — checklist

When you wire a new external feed, do all of these in one slice:

1. New client at `src/lib/data-feeds/<name>-client.ts` exporting
   typed functions. **Always** accept the active situation as input;
   never call the upstream without filters.
2. Add capability descriptor in `src/lib/data-feeds/capabilities.ts`
   so `/api/health/feeds` reports correctly.
3. Wire into `feed-aggregator.ts` so any tool calling
   `getSituationIntelligence()` benefits.
4. Update the **license + auth** block in `docs/COMPLIANCE.md` §1.
5. Update this file's per-feed → tools map.
6. Add a row to the wire-state matrix.
7. Update `docs/USER_ACTION_LIST.md` with the signup steps if it's
   paid / freemium.
8. Add a unit test in `tests/unit/lib/data-feeds/<name>-client.test.ts`
   covering the unset-credential degraded path.

---

## When something's not lighting up

Quick diagnostic:

1. **Check `/api/health` and `/api/health/feeds`** — these enumerate
   which feeds the runtime sees.
2. **Open `/app/settings/system-health`** — has a "Copy diagnostic"
   button that exports the full state to clipboard for sharing.
3. **Check Cloud Run logs**: `gcloud run services logs tail
   praxis-frontend --region=us-central1 --project=praxisbytacitus`.
4. **Confirm the secret is mounted**: in the GCP console under Cloud
   Run → praxis-frontend → Variables & Secrets, the env var should
   reference `<secret-name>:latest` and the latest secret version
   should be enabled.
5. **Confirm IAM**: the Cloud Run runtime SA
   (`852128226674-compute@developer.gserviceaccount.com`) must have
   `roles/secretmanager.secretAccessor` on each secret. If the secret
   was added by a different operator, this is the most common
   missing piece.

---

## Where this doc lives

`docs/EXTERNAL_TOOLS_WIRING.md`. Linked from `README.md`'s
documentation table and from `docs/SPRINT_BACKLOG.md` (Stream C).
Update in the same commit as any wiring change to a feed.
