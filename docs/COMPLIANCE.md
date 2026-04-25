# PRAXIS Compliance Tracker

Single-source-of-truth for licensing, certifications, and regulatory posture.
Updated whenever a vendor relationship, certification, or regulatory
obligation changes.

> Compass research artifact §R10 informed the certification roadmap; §R2
> flagged the ACLED licensing risk. See
> `docs/compass_artifact_wf-7af05074-9b31-4316-834d-b3a7500f4cf7_text_markdown.md`.

---

## 1. Data licensing — known risks and obligations

### 1.1 ACLED — **🚨 BLOCKER for paid tier launch**

| Status | Action | Owner | Target date |
|---|---|---|---|
| 🚨 Not licensed for SaaS redistribution | Email `access@acleddata.com`, request Corporate License quote (draft in `docs/USER_ACTION_LIST.md` §1) | Giulio | Immediate |
| Pending negotiation | Negotiate scope (Analyst $49 / Team $199 / Enterprise tiers) | Giulio | ASAP |
| Interim safe-harbour | Gate raw event display behind feature flag; surface only aggregated stats | Engineering (Stream B-9 — playbook at `docs/tacitus-acled-integration-brief.md`) | This sprint |
| Attribution copy added everywhere ACLED data renders | Source: ACLED — acleddata.com — accessed YYYY-MM-DD | Engineering | This sprint |
| ACO mapping for ACLED's 30 columns | Pre-drafted in the integration brief §4 — needs Giulio sign-off before code lands | Giulio (judgement) | Before Phase 1 |

**Verbatim EULA quote (from `compass_artifact` §R2):**
> "It is not sufficient for Licensed Content to simply be supplemented,
> appended, excerpted, reorganized, or made available through Licensee's
> own dashboard."
> "Commercial entities may not access or use the Content and/or Platforms
> without first obtaining a corporate license from Licensor."

**Interim implementation:**
- Env var `ACLED_LICENSE_TIER` ∈ {`none`, `enterprise-pilot`, `corporate-licensed`}
- `none` (default): only return aggregated stats from
  `src/lib/data-feeds/acled-client.ts`
- `enterprise-pilot`: feature-flagged for individual customers under
  written agreement
- `corporate-licensed`: full event display once Corporate License is signed

**Estimated cost:** $5–25k/yr based on industry comparables. Confirm.

### 1.2 GDELT — public domain, attribution required

GDELT 2.0 is public domain ([data page](https://www.gdeltproject.org/data.html))
but their attribution policy requests crediting GDELT in derived work.
Always render "Source: GDELT 2.0" wherever GDELT data appears.

### 1.3 UCDP GED — Creative Commons BY 4.0

Free for commercial use with attribution. Cite "UCDP Georeferenced Event
Dataset (GED), version YYYY".

### 1.4 ReliefWeb / OCHA — terms of use permit SaaS use

ReliefWeb explicitly permits redistribution with attribution. No
licensing concern.

### 1.5 HDX HAPI — CC-BY-4.0 by default per dataset

Each HDX dataset has its own license; HAPI metadata exposes the license
field. Default to CC-BY-4.0; for paid tiers verify per-dataset.

### 1.6 World Bank — open data terms

Open data terms permit commercial redistribution. Attribution required.

### 1.7 UN News RSS — public domain

Per-feed terms of use permit redistribution.

### 1.8 SIPRI Arms Transfer Database — non-commercial unless licensed

Currently scraped via Firecrawl. SIPRI's database license is
non-commercial by default; commercial use requires SIPRI permission.
**Action:** verify status, possibly license per
`https://www.sipri.org/databases/armstransfers/about-our-arms-transfers-database`.

### 1.9 Crisis Group CrisisWatch — copyright protected

Currently scraped. CrisisWatch text is copyright. We do not redistribute
the text verbatim; we summarise. **Action:** confirm with ICG that AI
summarisation of CrisisWatch is permitted before paid launch.

---

## 2. Certifications

### 2.1 SOC 2 Type II — in scope, not started

| Item | Status | Notes |
|---|---|---|
| Auditor selection | Not started | Compass §R10 estimates $25–50k all-in for a startup, 4–9 month timeline |
| Trust Service Criteria scope | Not started | Minimum: Security + Availability + Confidentiality |
| Evidence collection automation | Not started | Drata / Vanta / Secureframe candidates |
| Type II observation window | Not started | Typically 6 months post-Type I |

**Path:** Hire fractional vCISO → engage auditor → 90-day Type I push →
6-month Type II window. Realistic Type I sign-off in ~Q4 2026 if started
this sprint.

### 2.2 ISO 27001 / 27018 — deferred until SOC 2 in flight

ISO 27018 specifically covers cloud-PII. Required for some EU buyers.
Defer until SOC 2 Type I is in observation.

### 2.3 GDPR — DPA published

| Item | Status | Notes |
|---|---|---|
| Data Processing Agreement (DPA) | Drafted (need legal review) | |
| Standard Contractual Clauses (SCCs) for EU↔US transfers | Required | |
| Sub-processor list | Pending publication | Firebase, Vertex AI, Stripe, Firecrawl, Anthropic, ACLED (when licensed) |
| Data Protection Impact Assessment (DPIA) | Pending | Template needed |
| EU data residency | Available | `europe-west1` (Belgium) and `europe-west4` (Netherlands) supported by all GCP services we use |

### 2.4 UNGM (UN Global Marketplace) registration

| Item | Status |
|---|---|
| Level 1 (basic) | Not started |
| Level 2 (>$500k contracts) | Required for UN agency sales |

Compass §R10 says target Level 2 with a comparable-product reference
($50–150k/yr enterprise tier).

---

## 3. Sub-processor inventory

| Vendor | Purpose | Data residency | DPA on file |
|---|---|---|---|
| Google Cloud (Firestore, Cloud Run, BigQuery, Vertex AI, Secret Manager) | Infra + AI | us-central1 (default) · EU on request | Yes (Google Cloud DPA) |
| Stripe (when activated) | Payments | US + EU | Yes (Stripe DPA) |
| Firecrawl (when activated) | Web scraping | US | Verify |
| Anthropic (optional) | LLM (Claude) | US | Yes (Anthropic DPA) |
| ACLED (pending license) | Conflict event data | US | Pending |
| Cloudflare (DNS) | DNS + CDN | Global | Yes |
| Squarespace / GitHub (if used) | Marketing / source | US | Verify |

---

## 4. Audit log

| Date | Event |
|---|---|
| 2026-04-25 | Compliance tracker created. ACLED licensing risk flagged as P0. SOC 2 path documented. |

---

## 5. Open actions (week of 2026-04-25)

- [ ] Email `access@acleddata.com` requesting Corporate License quote
- [ ] Land Stream B-9 (ACLED safe-harbour: aggregated stats only until
  licensed)
- [ ] Verify SIPRI commercial-use status
- [ ] Verify Crisis Group CrisisWatch summarisation permission
- [ ] Engage SOC 2 auditor (Drata / Vanta / Secureframe)
- [ ] Draft public sub-processor list at `https://praxis.tacitus.me/legal/sub-processors`
- [ ] Stand up an EU-residency option (`europe-west1` Cloud Run mirror)
  for UN/EU prospects
