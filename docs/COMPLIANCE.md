# PRAXIS Compliance Tracker

Single-source-of-truth for licensing, certifications, and regulatory
posture. Updated whenever a vendor relationship, certification, or
regulatory obligation changes.

---

## 1. Data licensing — Google-grounded and user-source stack

**Strategic posture (2026-05-22):** PRAXIS does not auto-ingest structured
conflict/humanitarian feeds into canonical state. Live research runs through
Google Search grounding, source-linked crawler receipts, user documents/URLs,
and an optional Research graph extra that uses GDELT DOC/API plus Wikidata
SPARQL for advisory receipts only.

### 1.1 Sources actively used and their license posture

| Source | License | Commercial SaaS use | Attribution required | Notes |
|---|---|---|---|---|
| Wikipedia | CC-BY-SA 4.0 | ✅ Yes (with share-alike) | Yes — link to article | Used for actor enrichment summaries; we do not redistribute large excerpts verbatim |
| Wikidata | CC0 | ✅ Yes | Link recommended | Used by Research graph for QIDs, labels, aliases, identifiers, coordinates, and official-site hints |
| GDELT DOC/API | GDELT open data terms | ✅ Yes | Link source URLs | Optional Research graph media-pulse receipts; advisory only, no canonical graph mutation |
| Google Search (grounded via Gemini) | Google AI Terms | ✅ Yes | Per Google attribution rules | Built into Vertex AI |
| Exa Premium web | Exa terms | ✅ Yes | Source URLs in receipts | Paid high-quality open-web discovery lane; remains separate from free Research graph |
| Source-linked web crawler receipts | Per-source terms | Review per source | Link + timestamp required | Optional; stores metadata/excerpts, not full articles |

### 1.2 Sources we deliberately DO NOT use

| Source | Why we don't use it |
|---|---|
| ~~ACLED, UCDP, ReliefWeb, HDX, UN News, UNHCR, SIPRI, Crisis Group, World Bank dedicated feeds~~ | Removed from active runtime; no dedicated clients, workers, or credentials. Use Google-grounded search, Research graph advisory receipts, or source-linked crawler receipts instead. |
| GDELT BigQuery public datasets by default | Google bills public-dataset query processing to the PRAXIS GCP project. BigQuery mode must stay disabled unless `GDELT_BIGQUERY_ENABLED=true`, `RESEARCH_GRAPH_MAX_BYTES_BILLED` is configured, dry-run estimate passes, and bounded date/filter/LIMIT templates are used. |
| ~~Firecrawl / Bright Data / Apify~~ | Paid scrapers introduce vendor lock-in and per-page costs. Replaced with grounded Google Search unless a crawler is explicitly receipt-backed. |
| ~~Anthropic Claude~~ | Operational simplicity — Gemini 3.1 Pro is the single AI line. |
| ~~Tavily / Parallel.ai~~ | Replaced with grounded Google Search. |

### 1.3 Attribution discipline (live in production)

- Every page / report / API response that surfaces live web content carries
  source URL, title, retrieval timestamp, and receipt metadata.
- Research graph receipts must say they are advisory only. GDELT/Wikidata
  findings can feed review-gated graph proposals, but they do not mutate the
  canonical PRAXIS graph automatically.
- The CC-BY-SA share-alike obligation for Wikipedia is honoured by
  treating the actor-enrichment summaries as derivative metadata,
  not redistribution; full attribution links are kept on the actor
  detail page.

### 1.4 the selected situation source library

The the selected situation workspace source library is defined in
`src/lib/user-case/source-library.ts`. Production ingest is deliberately
cost-gated:

- `SYRIA_LIVE_INGEST_ENABLED=false` returns the cached fallback packet
  for recording-safe demos and does not call paid providers.
- `SYRIA_LIVE_INGEST_ENABLED=true` must use grounded search or source-linked
  crawler receipts only.
- Local, wire, and think-tank sources are catalogued for provenance and
  grounded-search workflows, but PRAXIS stores only metadata and short
  excerpts. It does not reproduce full copyrighted articles.
- Every normalized document carries source id, tier, URL, retrieval
  method, retrieved-at timestamp, and whether it came from live ingest
  or the cached fallback.

---

## 2. Certifications

### 2.1 SOC 2 Type II — in scope, not started

| Item | Status | Notes |
|---|---|---|
| Auditor selection | Not started | $25–50k all-in, 4–9 months |
| Trust Service Criteria scope | Not started | Min: Security + Availability + Confidentiality |
| Evidence collection automation | Not started | Drata / Vanta / Secureframe |
| Type II observation window | Not started | 6 months post-Type I |

**Path:** Engage auditor → 90-day Type I push → 6-month Type II
window. Realistic Type I sign-off ~Q4 2026 if started this sprint.

### 2.2 ISO 27001 / 27018 — deferred until SOC 2 in flight

ISO 27018 specifically covers cloud-PII. Required for some EU buyers.
Defer until SOC 2 Type I is in observation.

### 2.3 GDPR — DPA published

| Item | Status | Notes |
|---|---|---|
| Data Processing Agreement (DPA) | Drafted (need legal review) | |
| Standard Contractual Clauses (SCCs) | Required | EU↔US transfers via Google Cloud |
| Sub-processor list publication | Pending | |
| DPIA template | Pending | |
| EU data residency | Available | `europe-west1` (Belgium) and `europe-west4` (Netherlands) |

### 2.4 UNGM (UN Global Marketplace) registration

| Item | Status |
|---|---|
| Level 1 (basic) | Not started |
| Level 2 (>$500k contracts) | Required for UN agency sales |

---

## 3. Sub-processor inventory

We have **dramatically simplified** our sub-processor surface as part
of the open-source pivot.

| Vendor | Purpose | Data residency | DPA on file |
|---|---|---|---|
| Google Cloud (Firestore, Cloud Run, Cloud SQL, BigQuery, Vertex AI, Secret Manager, Pub/Sub, Cloud Storage, Cloud Build, Artifact Registry) | Infrastructure, AI, storage, computation, LangGraph checkpointing | us-central1 default; Cloud SQL LangGraph checkpoint instance currently `us-east4`; `europe-west1` / `europe-west4` on request | Yes (Google Cloud DPA) |
| Polar (when activated) | Merchant of Record subscription billing and customer portal | US + EU | Yes (Polar terms/DPA) |
| Cloudflare (DNS) | DNS + CDN | Global | Yes |
| GitHub | Source code hosting (no customer data) | US | Yes |

**Removed from this list (no longer used):** ACLED, UCDP, ReliefWeb,
HDX, UN News, UNHCR, SIPRI, Crisis Group, World Bank dedicated feeds,
Firecrawl, Anthropic, Tavily, Parallel.ai.

---

## 4. Audit log

| Date | Event |
|---|---|
| 2026-04-25 (initial) | Compliance tracker created. ACLED licensing risk flagged as P0. |
| 2026-04-25 (pivot) | Strategic pivot: dropped ACLED, Firecrawl, Anthropic from the dependency stack. Sub-processor list reduced to Google Cloud + Stripe + Cloudflare + GitHub. ACLED Corporate License negotiation cancelled. |
| 2026-04-27 (LangGraph) | Added private-IP-only Cloud SQL Postgres as the approved LangGraph checkpoint store. This remains within the Google Cloud sub-processor boundary; user-visible canonical state stays in Firestore. |
| 2026-04-28 (billing) | Began Stripe-to-Polar transition. New payments stack uses Polar hosted Checkout, Customer Portal, webhooks, and Firestore entitlement mirroring. |
| 2026-05-17 (source cleanup) | Removed dedicated structured feed workers/clients and narrowed live research to Google Search grounding, optional receipt-backed crawlers, and user evidence. |
| 2026-05-22 (research graph extra) | Added optional free Research graph receipts via GDELT DOC/API and Wikidata SPARQL. BigQuery remains disabled-by-default and server-capped because public-dataset query processing can bill PRAXIS. Exa remains the paid Premium web discovery lane. |

---

## 5. Open actions (week of 2026-04-25)

- [x] Open-source-only data stance documented and reflected in
  landing page + system-health activation guide
- [ ] Decide whether the LangGraph Cloud SQL region should move from
  `us-east4` to `us-central1` before production agent traffic, or keep
  `us-east4` because it was created there by Firebase/Cloud SQL setup
- [ ] Engage SOC 2 auditor (Drata / Vanta / Secureframe)
- [ ] Draft public sub-processor list at
  `https://praxis.tacitus.me/legal/sub-processors`
- [ ] Stand up an EU-residency option (`europe-west1` Cloud Run
  mirror) for UN/EU prospects
- [ ] Lawyer review of DPA template before publication
