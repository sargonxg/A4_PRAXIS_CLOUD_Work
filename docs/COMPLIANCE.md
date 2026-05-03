# PRAXIS Compliance Tracker

Single-source-of-truth for licensing, certifications, and regulatory
posture. Updated whenever a vendor relationship, certification, or
regulatory obligation changes.

---

## 1. Data licensing — open-source-only stack

**Strategic posture (2026-04-25):** PRAXIS ships exclusively on
open-license data feeds. We do not redistribute commercially-licensed
data to customers. This dramatically simplifies our compliance posture
and removes per-customer license negotiation as a launch blocker.

### 1.1 Sources actively used and their license posture

| Source | License | Commercial SaaS use | Attribution required | Notes |
|---|---|---|---|---|
| GDELT 2.0 (BigQuery `gdelt-bq.gdeltv2.*`) | Public domain | ✅ Yes | Yes — "Source: GDELT 2.0" | Hosted free up to 1 TB/mo BigQuery query |
| UCDP GED | CC-BY 4.0 | ✅ Yes | Yes — cite version + DOI | Free, georeferenced events |
| ReliefWeb | Open redistribution permitted | ✅ Yes | Yes — link back | OCHA situation reports |
| HDX HAPI | Per-dataset (mostly CC-BY-4.0) | ✅ Mostly yes | Yes — per-dataset | License field exposed by HAPI |
| UNHCR Refugee Data Finder | Open | ✅ Yes | Yes — "Source: UNHCR" | Population stats |
| World Bank WDI / WGI | Open data terms | ✅ Yes | Yes — "Source: World Bank" | |
| UN News RSS | Public domain | ✅ Yes | Yes — link back | |
| Wikipedia | CC-BY-SA 4.0 | ✅ Yes (with share-alike) | Yes — link to article | Used for actor enrichment summaries; we do not redistribute large excerpts verbatim |
| Google Search (grounded via Gemini) | Google AI Terms | ✅ Yes | Per Google attribution rules | Built into Vertex AI |
| Vertex AI Deep Research (Reasoning Engine) | Google Cloud Terms | ✅ Yes | n/a | Computation, not data |
| BigQuery public datasets (GHCN, NOAA, WHO, IMF, Census) | Per-dataset (mostly open) | ✅ Mostly yes | Per-dataset | Free first 1 TB/mo |

### 1.2 Sources we deliberately DO NOT use

| Source | Why we don't use it |
|---|---|
| ~~ACLED~~ | ACLED's 2026 EULA forbids SaaS dashboards from redistributing event data without a per-customer Corporate License (~$5–25k/yr). Replaced with GDELT BigQuery + UCDP GED for event data. |
| ~~Firecrawl / Bright Data / Apify~~ | Paid scrapers introduce vendor lock-in and per-page costs. Replaced with Vertex AI Deep Research + grounded Google Search. |
| ~~Crisis Group CrisisWatch~~ | Required scraping with attribution risk. ICG content reachable via grounded search instead. |
| ~~SIPRI Arms Transfer Database scrape~~ | Same. Macro indicators come from World Bank / UCDP. |
| ~~Anthropic Claude~~ | Operational simplicity — Gemini 3.1 Pro is the single AI line. |
| ~~Tavily / Parallel.ai~~ | Replaced with grounded Google Search. |

### 1.3 Attribution discipline (live in production)

- Every page / report / API response that surfaces feed-derived
  content carries an attribution line of the form
  `Source: <feed-name> — <feed-url> — accessed YYYY-MM-DD`.
- Per-dataset HDX licenses are surfaced in the Sources Library
  whenever an HDX-derived row is rendered.
- The CC-BY-SA share-alike obligation for Wikipedia is honoured by
  treating the actor-enrichment summaries as derivative metadata,
  not redistribution; full attribution links are kept on the actor
  detail page.

### 1.4 Syria source library

The Syria workspace source library is defined in
`src/lib/syria/source-library.ts`. Production ingest is deliberately
cost-gated:

- `SYRIA_LIVE_INGEST_ENABLED=false` returns the cached fallback packet
  for recording-safe demos and does not call paid providers.
- `SYRIA_LIVE_INGEST_ENABLED=true` currently enables free ReliefWeb and
  GDELT pulls for the last seven days, then merges with labeled cached
  fallback material.
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

**Removed from this list (no longer used):** ACLED, Firecrawl,
Anthropic, Tavily, Parallel.ai. Their entries are kept in the audit
log below for historical traceability.

---

## 4. Audit log

| Date | Event |
|---|---|
| 2026-04-25 (initial) | Compliance tracker created. ACLED licensing risk flagged as P0. |
| 2026-04-25 (pivot) | Strategic pivot: dropped ACLED, Firecrawl, Anthropic from the dependency stack. Sub-processor list reduced to Google Cloud + Stripe + Cloudflare + GitHub. ACLED Corporate License negotiation cancelled. |
| 2026-04-27 (LangGraph) | Added private-IP-only Cloud SQL Postgres as the approved LangGraph checkpoint store. This remains within the Google Cloud sub-processor boundary; user-visible canonical state stays in Firestore. |
| 2026-04-28 (billing) | Began Stripe-to-Polar transition. New payments stack uses Polar hosted Checkout, Customer Portal, webhooks, and Firestore entitlement mirroring. |

---

## 5. Open actions (week of 2026-04-25)

- [x] Open-source-only data stance documented and reflected in
  landing page + system-health activation guide
- [ ] Verify GDELT 2.0 attribution copy renders on every
  GDELT-derived surface
- [ ] Decide whether the LangGraph Cloud SQL region should move from
  `us-east4` to `us-central1` before production agent traffic, or keep
  `us-east4` because it was created there by Firebase/Cloud SQL setup
- [ ] Deploy GDELT BigQuery hot slice per
  `docs/implementation/gdelt-ingestion-2026-04-25.md`
- [ ] Engage SOC 2 auditor (Drata / Vanta / Secureframe)
- [ ] Draft public sub-processor list at
  `https://praxis.tacitus.me/legal/sub-processors`
- [ ] Stand up an EU-residency option (`europe-west1` Cloud Run
  mirror) for UN/EU prospects
- [ ] Lawyer review of DPA template before publication
