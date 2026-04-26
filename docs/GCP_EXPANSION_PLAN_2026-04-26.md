# PRAXIS Google Cloud Expansion Plan — 2026-04-26

> Authored after the tenth-session multi-lane sprint. Identifies high-impact
> Google Cloud services PRAXIS does not yet leverage, ranks them by user
> value × shippability, and names the brick that owns each one.
>
> Pair with `docs/PRAXIS_BIG_IMPROVEMENTS_2026-04-26.md` (canonical roadmap)
> and `docs/CORPUS_ARCHITECTURE.md` (retrieval contract).

## Stack today (recap)

```
Cloud Run (frontend Next.js + backend FastAPI)
Firestore (auth, data, real-time, vector pilot in documents/chunks)
Vertex AI (Gemini 3 Pro/Flash, text-embedding-004, ADK Agent Engine)
Cloud Storage (gs://praxisbytacitus-praxis-uploads)
Pub/Sub (5 topics)
Cloud Functions (3: situation, document, GDELT)
Cloud Scheduler (GDELT 15m, alert sweep 6am, briefing 5am)
Cloud Tasks (3 queues: research, agents, embeddings — provisioned, not yet
fan-out wired)
Cloud Build / Artifact Registry (CI/CD)
Secret Manager (5 secrets)
BigQuery (praxis_analytics dataset)
```

## Twelve services to layer in

Ranked by **user-visible value × shippability**. Each item names the
brick in `docs/PRAXIS_BIG_IMPROVEMENTS_2026-04-26.md` that owns it (BIG
#XX), or a NEW brick id if the roadmap doesn't yet track it.

### 1. Document AI — OCR for uploaded PDFs / images (NEW BRICK 31)

**User value.** Researchers, legal analysts, humanitarian leads upload
scanned PDFs (signed agreements, OCHA situation reports, ICC indictments).
Today the document service relies on whatever text the file already has —
scans yield zero entities and zero RAG coverage.

**Path.** Add a Document AI processor (`OCR_PROCESSOR` for general OCR,
`FORM_PARSER_PROCESSOR` for structured docs). Trigger from
`on_document_uploaded` Cloud Function: detect MIME type, route scans
through Document AI, write extracted text + page-level structure into
the existing `documents/{docId}` record before chunking.

**Definition of done.** A scanned PDF produces ≥1 chunk with non-empty
text; Conflict Graph extraction runs over those chunks; analyst sees
extracted entities even on scan-only uploads.

### 2. Cloud Translation — multilingual analyst calibration (NEW BRICK 32)

**User value.** Analysts at UN missions in francophone Africa, MENA,
Latin America: they want output in French / Arabic / Spanish; today the
system prompt directive is honoured but source documents stay
English-only. Translation closes that loop both ways.

**Path.** Wrap Cloud Translation v3 behind
`src/lib/i18n/translate.ts` (server-only). Two routes:
1. Detect document language at upload; if not in
   `outputConstraints.language`, run a translation pass and store
   alongside the original under `documents/{id}.translations.{lang}`.
2. Translate Brainstorming Table / Briefing Room final output if
   `outputLanguage` differs from the model's response language.

**Definition of done.** A French analyst uploads an Arabic OCHA report;
Conflict Graph extraction finds the same entities the English-language
analyst would.

### 3. Vertex AI Search — alternative corpus retrieval (BIG #16 + 32)

**User value.** Firestore vector search has hard limits (no real-time
listeners, 2048 dims). Vertex AI Search ("Discovery Engine") offers
structured + unstructured search with grounded citations against a
private corpus, and is the path the Vertex documentation now points
enterprise customers at.

**Path.** Stand up a Vertex AI Search "data store" per situation,
populated nightly by a Cloud Function reading
`users/{uid}/situations/{sitId}/documents/`. Add an alternate
retrieval layer in `searchSituationCorpus` (selectable via
`layers: ['vertex-search']`) that calls Discovery Engine.

**Definition of done.** A document layer query returns the same top-3
chunks via Vertex AI Search as via the current Firestore hybrid path;
benchmark documented.

### 4. Cloud Workflows — pipeline orchestration (NEW BRICK 33)

**User value.** Today the situation creation pipeline (`extract → build
→ cluster → analyze → report → export`) is hard-coded inside
`backend/routers/pipeline.py` and the Eventarc-triggered
`on_situation_created` Cloud Function. A single retry policy applies.
Cloud Workflows lets ops humans see and re-run individual steps.

**Path.** Convert the 6-step pipeline into a Cloud Workflows definition
(`infrastructure/workflows/situation-pipeline.yaml`) that calls each
step as a Cloud Run service. The Cloud Function becomes a Workflow
launcher.

**Definition of done.** When the cluster step fails, the operator can
re-run from clustering forward without re-doing extraction; the
Operator Console shows step-level state.

### 5. Eventarc + Cloud Tasks — graph delta approval pipeline (BIG #20)

**User value.** Brick #20 already lives in the roadmap; concretely
this means moving from "Cloud Function writes graph_updates" to "Cloud
Function emits an Eventarc event, Cloud Tasks queues an
`enrich-proposal` task, and the frontend reads the proposal queue
once enrichment completes."

**Path.** Use the existing `praxis-agents` queue. Eventarc filter on
`google.cloud.firestore.document.v1.created` for
`graph_updates/{id}` → invokes a `praxis-agents`-bound Cloud Run
endpoint that enriches the proposal with corpus citations before the
analyst sees it.

**Definition of done.** A proposed graph node arrives with three
top-K corpus citations attached; the approval UI renders them inline.

### 6. Cloud KMS — cookie/session secret rotation (NEW BRICK 34)

**User value.** Today `COOKIE_SIGNING_SECRET` is mounted from Secret
Manager (`praxis-cookie-secret`). Rotation requires manual re-deploy.
Cloud KMS lets us key-version the HMAC and rotate without redeploy,
dramatically reducing the blast radius of a leaked secret.

**Path.** Add a `praxis-cookie-key` KMS key. Update
`src/lib/auth/cookie-signer.ts` to sign with the active key version
and verify against the last N versions. Schedule monthly rotation.

**Definition of done.** Manual rotation via `gcloud kms keys versions
create` does not invalidate any existing valid session cookies until
the version's TTL expires; new sessions sign with the new version.

### 7. Cloud Run worker pools / Jobs fallback (BIG #23)

**User value.** Worker pools are documented as Pre-GA. We need a
written fallback to Cloud Run Jobs + Scheduler in case the worker pool
API breaks. Without it, the GDELT poller is a single point of failure.

**Path.** Add `infrastructure/jobs/gdelt-poller-job.yaml` defining a
Cloud Run Job equivalent of the worker pool, with a Cloud Scheduler
trigger every 15 minutes. Document the switchover in
`docs/OPERATIONAL_SPINE.md`.

**Definition of done.** A documented checklist exists; flipping the
switch takes <30 minutes of ops time.

### 8. Vertex AI Generative AI Evaluation — model regression catch (NEW BRICK 35)

**User value.** When we move from Gemini 3 Flash to Gemini 4 Flash
(or whatever ships next), we currently eyeball whether the new model
breaks our tools. Vertex AI Eval has a generative-AI-evaluation
service that scores outputs against rubrics.

**Path.** Define eval rubrics for the top 5 tools (Risk Monitor,
Briefing Room, Humanitarian, Brainstorming Table, Daily Brief). Run
the eval on every model upgrade (manual trigger, then later as a
Cloud Build step on `providers.ts` changes).

**Definition of done.** A rubric run produces a single PASS/FAIL
score per tool; failures block model promotion.

### 9. Cloud Logging + BigQuery sink — system_events mart (BIG #26)

**User value.** Brick #26 already names this. Concretely: the
`system_events` collection grows fast (every tool run = 2 events).
Streaming to BigQuery unlocks SQL questions like "what's the failure
rate of Briefing Room by region by week" without paginating Firestore.

**Path.** Two options:
1. Cloud Logging sink filter on `system_events.create` audit logs →
   BigQuery (no extra code).
2. Firestore-onCreate Cloud Function streaming docs to a typed
   BigQuery table. Cleaner schema; needs a function.

**Definition of done.** The Operator Console shows a 7-day failure
rate panel computed from BigQuery rather than Firestore aggregation.

### 10. Cloud Armor — WAF / rate-limiting at the edge (NEW BRICK 36)

**User value.** Today rate-limiting lives in
`src/lib/api/with-auth.ts` (Firestore-backed, 100 req/min per uid).
That's enforced after the request reaches Cloud Run — paying for
compute we then refuse. Cloud Armor moves WAF + rate-limit to the
edge.

**Path.** Provision Cloud Armor backend security policies on the
external HTTP(S) load balancer fronting Cloud Run. Per-IP rate-limit
on `/api/*`; geofence on admin endpoints.

**Definition of done.** A burst from a single IP receives a 429 from
Cloud Armor before Cloud Run sees the request; admin endpoints reject
non-allowlisted regions.

### 11. Vertex AI Pipelines — embedding refresh orchestration (NEW BRICK 37)

**User value.** Document chunks need their Gemini text-embedding-004
vectors refreshed when:
- The model version changes.
- A document is re-extracted.
- Profile-driven retrieval re-prioritises a layer.

Today this happens ad-hoc inside `chunkAndSaveDocument`. Vertex AI
Pipelines turns it into an idempotent, observable workflow.

**Path.** Define a single Pipeline that takes
`(uid, situationId, optional documentId)` and refreshes embeddings.
Trigger from the existing `praxis-embeddings` queue.

**Definition of done.** A model upgrade refreshes every active
situation's embeddings via a single pipeline run.

### 12. Identity-Aware Proxy (IAP) — admin gating (NEW BRICK 38)

**User value.** `/app/admin/operator-console` and `/app/admin/domains`
are gated by `ADMIN_ALLOWLIST` env var today. IAP gives us an
allowlist enforced at the load balancer with Google identity
verification, before the Next.js middleware runs.

**Path.** Provision IAP on the external HTTP(S) load balancer; map
the existing `ADMIN_ALLOWLIST` to an IAP allowlist.

**Definition of done.** An unlisted Google account hitting
`/app/admin/operator-console` gets the IAP login redirect, not the
Next.js route.

---

## Cross-cutting opportunities

- **Cost observability.** Stripe Meters (already brick #27) gives us
  customer-side cost. Pair with BigQuery `cloudaudit_*` tables to
  reconcile against actual GCP cost — the difference is our gross
  margin per tool.
- **DLP API.** Run Cloud DLP over uploaded documents before storing
  to detect / redact PII. Particularly relevant for humanitarian
  cases where source documents may include casualty records.
- **Confidential Compute (CVMs).** For enterprise customers who require
  confidential VMs for AI inference, we can run an isolated Vertex AI
  endpoint in a confidential VM. Track in `docs/COMPLIANCE.md`.

## Sequence — what to ship first

1. **Document AI (NEW BRICK 31)** — biggest user-visible win, low risk,
   single Cloud Function change.
2. **Cloud Translation (NEW BRICK 32)** — unlocks multilingual usage,
   low risk, single helper module.
3. **Cloud KMS (NEW BRICK 34)** — security upgrade with no user-side
   migration.
4. **Vertex AI Search (BIG #16 + 32)** — corpus retrieval depth.
5. **Cloud Workflows (NEW BRICK 33)** — operational maturity.
6. **Eventarc + Cloud Tasks delta enrichment (BIG #20)** — agentic
   maturity.
7. **Cloud Armor (NEW BRICK 36)** — defence in depth before enterprise
   pilots.
8. **Vertex AI Eval (NEW BRICK 35)** — release-confidence upgrade.
9. **IAP (NEW BRICK 38)** — admin hardening.
10. **Vertex AI Pipelines (NEW BRICK 37)** — embedding ops.
11. **Cloud Run Jobs fallback (BIG #23)** — fallback ready, no
    user-visible change today.
12. **BigQuery system_events sink (BIG #26)** — observability mart.

The first three (Document AI, Translation, KMS) should land within 30
days. The rest are 60–90 day work, paired with brick owners as
defined in `docs/STRATEGIC_AGENTIC_ROADMAP_2026-04-26.md`.
