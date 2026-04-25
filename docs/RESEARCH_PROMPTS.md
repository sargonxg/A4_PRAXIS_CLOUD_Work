# PRAXIS Research Prompts

Copy-paste-ready research prompts for **you** to run when you have access to a
deeper research tool (Claude with web access, GPT-5 Deep Research, Perplexity
Pro, ChatGPT Deep Research, etc.). Each prompt is scoped tightly so the result
comes back in a form Claude Code or Codex can act on without further triage.

When you bring back the results, dump them into a new file under
`docs/research/<topic>-<YYYY-MM-DD>.md` and the next agent will turn them into
code.

---

## Status

> **All 10 prompts (R1–R10) below were answered on 2026-04-25.** The
> deep-research artifact is at
> `docs/compass_artifact_wf-7af05074-9b31-4316-834d-b3a7500f4cf7_text_markdown.md`
> (789 lines). The implementation tasks each one unblocked are tracked in
> `docs/SPRINT_BACKLOG.md` Stream G. The prompts below are kept as
> reference for future deltas (e.g., when ACLED's licensing terms change,
> re-run R2; when GDELT 3.0 lands, re-run R3).

---

## R1 · Vertex AI Agent Engine — concrete deployment recipe

**Why:** PRAXIS's Deep Research Agent currently falls back to plain Gemini
grounded search because `VERTEX_AGENT_ENGINE_ID` is unset in production.
Documentation has been moving fast since GA.

**Prompt:**

> I need a step-by-step recipe to deploy a Vertex AI Reasoning Engine for a
> production GCP project (`praxisbytacitus`, region `us-central1`). The
> engine must (1) accept a streaming POST request, (2) run a 3-phase
> agentic flow (planner → web researcher → synthesizer) using Google's
> Agent Development Kit (ADK), (3) return structured Markdown plus
> citations.
>
> Requirements I need confirmed:
> - The exact Python `google.adk` package versions that match Vertex AI
>   Agent Engine in 2026.
> - Whether the Reasoning Engine ID is numeric, a UUID, or a path; how to
>   retrieve it after creation; and whether it needs a custom service
>   account or inherits the project default.
> - The minimum IAM roles required on the Cloud Run service account that
>   will invoke the engine (e.g.,
>   `roles/aiplatform.reasoningEngineUser`?).
> - A working `deploy.py` example that registers the agent.
> - Cost characteristics — what's billable per token / per request, and
>   what the typical session looks like.
>
> Cite primary sources only (cloud.google.com, github.com/google,
> developers.google.com). Avoid Medium articles unless they include
> verbatim cloud.google.com excerpts.

---

## R2 · ACLED API current rate limits + bulk export options (2026)

**Why:** The PRAXIS ACLED client targets a per-12-second cadence based on
older docs. The free academic tier may have changed, and we may have a
higher-throughput option for production.

**Prompt:**

> Get the **current** (2026) rate limits, request-size caps, and bulk-export
> options for ACLED's API (developer.acleddata.com). I specifically need:
> - The official requests-per-second / per-minute / per-hour cap for the
>   free academic / non-profit tier.
> - The maximum events per response on the free tier.
> - Whether there is a paid tier that offers bulk download or higher QPS,
>   and at what price.
> - The license terms for redistributing event data inside a SaaS dashboard
>   that bills users monthly. Specifically: am I allowed to surface ACLED
>   events to authenticated users on a paid plan, with attribution?
> - Recommended cache TTL for an event-density map (we currently use ~1h).
>
> Cite the canonical ACLED docs and licensing pages directly. Quote the
> license terms that apply to commercial redistribution.

---

## R3 · GDELT GKG ingestion best practices for a real-time dashboard

**Why:** PRAXIS already polls GDELT but we want the in-app feeds to refresh
near real-time without exceeding free-tier capacity.

**Prompt:**

> I need 2026-current best practices for ingesting GDELT GKG (Knowledge
> Graph) data for real-time conflict-monitoring dashboards. Specifically:
> - The official cadence: how often do GKG files publish (15 min still?
>   or has GDELT 3.0 changed it?), and what's the canonical URL pattern
>   for fetching the latest file?
> - Recommended schema for storing GKG records in BigQuery for downstream
>   analytics (we already have a `praxis_analytics` dataset).
> - Whether there's a hosted BigQuery public dataset that already mirrors
>   GKG, and the dataset name + cost-per-query characteristics.
> - Any free or cheap CDC pattern: detect changes since last poll without
>   re-downloading the entire GKG file.
> - A reasonable retention window for in-app querying (we keep 90 days
>   today).
>
> I want practitioner sources — GDELT blog, Google Cloud Solutions
> docs, ICEWS comparisons. No clickbait articles.

---

## R4 · Firecrawl alternatives for paid tiers — competitive sweep 2026

**Why:** Firecrawl is wired but pricier than expected at scale. Want a
comparison before committing.

**Prompt:**

> Compare in 2026 (current pricing): Firecrawl, Bright Data, Apify, Diffbot,
> Browserless, ScrapingBee, ScraperAPI, ZenRows. For each, give:
> - Per-1000-request cost at the lowest paid tier.
> - JS-rendering support (yes/no/extra cost).
> - PDF extraction support.
> - Built-in markdown/structured output (or do you have to post-process).
> - Maximum concurrent requests on a $50–$100/mo tier.
> - Any obvious red flags (vendor reliability, ToS issues for SaaS
>   redistribution, region restrictions).
>
> My use case: scrape ~3k unique URLs per month, primarily Crisis Group,
> SIPRI, UN agency reports, government white papers. Need clean Markdown
> output with citations preserved.

---

## R5 · BigQuery Public Datasets for conflict + humanitarian data

**Why:** Cheaper than vendor APIs for any historical or analytical query.

**Prompt:**

> List every BigQuery Public Dataset (in 2026) that's relevant to conflict
> intelligence and humanitarian work. For each, give the dataset name,
> table list, refresh frequency, and one example SQL query.
>
> Specifically interested in:
> - GDELT (events, GKG)
> - World Bank indicators
> - UNHCR refugee statistics
> - GHCN climate / weather / disaster
> - HDX / OCHA datasets
> - Any UN, IMF, WHO, or other multilateral datasets
>
> Cite cloud.google.com/bigquery/public-data and the BigQuery Marketplace.

---

## R6 · Stripe billing setup for SaaS with monthly + usage-based hybrid

**Why:** PRAXIS will bill monthly plans (Analyst $49, Team $199) but we may
want optional usage add-ons (extra situations, premium AI runs).

**Prompt:**

> What's the cleanest 2026 Stripe pattern for a B2B SaaS that charges:
> - A flat monthly subscription per plan (Analyst $49, Team $199), and
> - Optional per-seat add-ons for the Team plan, and
> - Optional pay-as-you-go top-ups for additional usage above the plan
>   cap.
>
> Need:
> - Whether to use Stripe Billing, Stripe Pricing Tables, or a custom
>   Checkout flow.
> - Whether to model usage as `metered` line items or as `recurring` line
>   items with manual overage charges.
> - Webhook events I must handle (subscription.created, subscription.updated,
>   invoice.paid, customer.subscription.deleted, payment_intent.failed).
> - The minimum data to store in Firestore for fast entitlement checks
>   without round-tripping to Stripe on every request.
> - Any Stripe Tax considerations for selling to UN agencies and
>   non-profits.
>
> Cite stripe.com/docs only.

---

## R7 · Firestore vector search vs. dedicated vector DB at our scale

**Why:** PRAXIS uses Firestore native KNN (768-dim) today; want to stress-test
that choice before scaling.

**Prompt:**

> I'm running 768-dim COSINE KNN searches inside Firestore native vector
> search. Expected scale: 50k–250k embeddings per situation, ~50
> situations per user, ~10k users. Expected query rate: 5 queries per
> second peak.
>
> Compare in 2026: (a) Firestore native vector index, (b) Vertex AI Vector
> Search, (c) Pinecone, (d) Qdrant Cloud, (e) Weaviate Cloud.
>
> For each, give:
> - Cost at the above scale.
> - p95 query latency.
> - Filter-by-metadata support (we filter by situationId on every query).
> - Index update latency (write-to-searchable).
> - Operational complexity.
>
> Recommend a path. Worst case I'll keep Firestore; best case I'll move to
> Vertex Vector Search if it's clearly better for filter-heavy queries.

---

## R8 · Vertex AI vs. raw Gemini API — cost & latency at our shape

**Why:** We use the Google AI Studio key for Gemini today. Vertex AI may be
cheaper at scale + give better SLAs.

**Prompt:**

> At a request shape of: ~6,000 input tokens, ~2,000 output tokens, calling
> Gemini 3 Flash for chat and Gemini 3.1 Pro for structured generation,
> peak 5 RPS, 1M total monthly tokens — compare in 2026:
> - **Google AI Studio API** (`generativelanguage.googleapis.com`) with a
>   per-key model.
> - **Vertex AI Generative Models** (`aiplatform.googleapis.com`) with
>   ADC service-account auth.
>
> Give for each:
> - Per-1M-token input/output cost (Flash and Pro).
> - p50 / p95 latency.
> - Free quota.
> - SLA / uptime guarantees.
> - Whether streaming token output is supported.
> - Whether structured output (Zod-schema) works the same way on both.
>
> Cite cloud.google.com and ai.google.dev.

---

## R9 · Production RAG patterns for situation-scoped memory at our scale

**Why:** PRAXIS has SituationKnowledgeCore (graph + vector + feed + tool
output layers). Want to validate the architecture against current best
practice.

**Prompt:**

> What does state-of-the-art situation-scoped RAG look like in 2026 for a
> SaaS where each user has 5–25 isolated "situations" and each situation
> has 200–1000 documents, 100–500 entity nodes, and a continuously
> updating event feed?
>
> Compare patterns:
> - Per-situation Firestore subcollection (current PRAXIS approach).
> - Single-tenant per-situation index in a vector DB.
> - Hybrid graph + vector (GraphRAG by Microsoft Research, 2024).
> - Structured + unstructured (table-RAG plus text-RAG).
>
> Cite Microsoft GraphRAG paper, LangChain blog, LlamaIndex docs,
> Pinecone tech blog, Weaviate references. Avoid promotional content
> from a single vendor.

---

## R10 · UN / multilateral procurement requirements for SaaS

**Why:** Selling to UN PAOs, OCHA desks, ICG, etc. They have specific
procurement and compliance asks.

**Prompt:**

> What are the procurement and compliance requirements I should expect
> when selling a $50k–$250k/year SaaS subscription to a UN agency, EU
> mission, or large NGO (ICG, ICRC, MSF) in 2026? Specifically:
> - Required certifications (SOC 2 Type II — what scope, how long does
>   it take to get?).
> - Standard data-residency clauses they ask for.
> - Whether GDPR + a data-processing agreement is enough, or if specific
>   UN data classifications apply (UNCTAD, OCHA OneOCHA standards, etc.).
> - Vendor-onboarding timeline expectations.
> - Common deal-breakers (no-on-prem, no-Russian-server, etc.).
> - Pricing benchmarks from comparable products that have closed UN
>   contracts (e.g., Palantir Gotham, Recorded Future, Dataminr).
>
> Cite official UN procurement portal docs (un.org/Depts/ptd, ungm.org)
> where possible.
