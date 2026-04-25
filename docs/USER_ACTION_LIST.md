# PRAXIS — Things Only You Can Do (Giulio)

> **This is the file to open when you have 30 minutes and want to unblock
> something.** Every action below is a step neither Codex nor Claude Code
> can perform on their own — they need vendor authentication, GCP-console
> access, your email, your signature, or your judgement call. Everything
> else is in `docs/SPRINT_BACKLOG.md` for the agents to handle.

**Doc location:** `docs/USER_ACTION_LIST.md` (this file).
**Tracked from:** `docs/CONTINUATION.md` § "What only you can do".
**Updated:** 2026-04-25 (third session, post-research integration).

---

## Quick map — what to do, in what order

| # | Action | Time | Cost | Blocks |
|---|---|---|---|---|
| 1 | 🚨 Email ACLED for Corporate License | 15 min | $5–25k/yr (when signed) | Paid-tier launch with raw events |
| 2 | Sign up Firecrawl ($83/mo) and store key | 30 min | $83/mo | CrisisWatch + SIPRI in conflict profiles |
| 3 | Deploy Vertex AI Agent Engine | 1–2 h | ~$0.25 / 1M tokens | Deep Research Agent |
| 4 | Switch Cloud Run to Vertex AI provider | 15 min | Same per-token | UN/EU compliance posture |
| 5 | Stripe Dashboard: create products + webhook | 2 h | 2.9% + $0.30 / txn | Paid-tier monetisation |
| 6 | (Optional) Anthropic Claude API key | 10 min | $0.003 / 1k tokens | Slightly better deep-analysis output |
| 7 | Engage SOC 2 auditor (Drata / Vanta / Secureframe) | 2 h initial | $25–50k all-in | UN / IO procurement (≥6 mo timeline) |
| 8 | UNGM Level 2 registration | 1 h | Free | Bidding on UN contracts >$500k |
| 9 | DPA + sub-processor list publication | 2 h legal review | Lawyer fee | Enterprise procurement |
| 10 | Activate `PRAXIS_AUDIENCE_TUNED_BRIEFING=1` in production | 5 min | Free | Audience-tuned briefings on for everyone |

The order is rough priority. Items 1 and 4 are the highest-leverage if
you have an hour. Items 7–9 are slow and can run in parallel.

---

## 1. 🚨 ACLED Corporate License — email today

**Why this is critical:** ACLED's 2026 EULA forbids SaaS dashboards from
redistributing event data without a Corporate License. The verbatim
clause is in `docs/COMPLIANCE.md` §1.1; the deeper analysis is in the
compass research artifact at
`docs/compass_artifact_wf-7af05074-9b31-4316-834d-b3a7500f4cf7_text_markdown.md`
§R2. You currently cannot show raw ACLED events to a paying customer.

**Expected outcome:** A signed Corporate License agreement covering the
Analyst $49 / Team $199 / Enterprise tiers. Until then, agents will
keep raw events behind `ACLED_LICENSE_TIER=corporate-licensed` and
ship only aggregated stats by default.

**Step-by-step:**

1. Compose an email to `access@acleddata.com` (draft below).
2. Paste your TACITUS one-liner, your three plan tiers, expected
   monthly active users (~500–5,000 for the next 12 months), and the
   exact set of ACLED data products you want to redistribute.
3. CC `giulio@tacitus.me` so the thread is on your business inbox.
4. After they reply with quote + draft license, forward to your
   counsel for review.
5. Once signed, set `ACLED_LICENSE_TIER=corporate-licensed` in
   `cloudbuild.yaml` and redeploy. Engineering work is already done
   (Stream B-9, see `docs/SPRINT_BACKLOG.md`).
6. Update `docs/COMPLIANCE.md` §1.1 status to `signed YYYY-MM-DD`,
   include scope and renewal date.

**Email draft:**

```
To: access@acleddata.com
Subject: Corporate License inquiry — TACITUS / PRAXIS conflict-intelligence platform

Dear ACLED Licensing Team,

I'm Giulio Catanzariti, founder of TACITUS (https://tacitus.me) and
the PRAXIS conflict-intelligence platform (https://praxis.tacitus.me).
PRAXIS is an AI-native workspace for UN Political Affairs Officers,
diplomatic mediators, conflict analysts, and humanitarian coordinators.

We currently surface ACLED data in three places, all behind
authenticated, paid access:

  - Geospatial Monitor — event-level map with hotspot clustering
  - Risk Monitor — composite INFORM-style score; ACLED supplies the
    fatality and event-frequency dimensions
  - Early Warning — Glasl-stage escalation signal informed by ACLED
    spikes

Our pricing is plan-based and monthly:

  - Demo (free, single-situation, no live ACLED)
  - Analyst — USD 49/month
  - Team — USD 199/month
  - Enterprise — custom

Expected scale over the next 12 months: 500–5,000 monthly active
authenticated users; an estimated 50–500 active "situations" each
representing a region of focus; a peak query load below 5 requests/sec.

We honour your Attribution Policy in every rendering, and our
infrastructure already implements EULA §7.2 controls preventing raw
row download.

Could you send a quote and a draft Corporate License covering this
use case? Happy to share a deeper architecture brief or set up a
short call. Regions of priority interest: sub-Saharan Africa, the
Sahel, Yemen, Ukraine, and Latin America.

Many thanks,
Giulio Catanzariti
Founder, TACITUS
giulio@tacitus.me
```

**Where to paste results:**

- Quote / draft license → save as `docs/legal/acled-license-quote-YYYY-MM-DD.pdf`
- Final signed agreement → save as `docs/legal/acled-license-signed-YYYY-MM-DD.pdf`
- Update `docs/COMPLIANCE.md` §1.1 with status

---

## 2. Firecrawl signup ($83/mo Standard)

**Why:** Powers the CrisisWatch (ICG monthly outlook) scraper plus
SIPRI arms-transfer extraction inside conflict profiles. Compass §R4
chose Firecrawl over Bright Data / Apify / Diffbot. Without it, those
two data sources stay empty.

**Expected outcome:** `/api/health` reports `firecrawl: 'ok'`. The
"Conflict Profile" section of any actor / situation page populates
arms-transfer rows and the latest CrisisWatch text.

**Step-by-step:**

1. Visit https://www.firecrawl.dev/ → sign up.
2. Pick **Standard** tier ($83/mo, 100k pages, ~$0.00083/page).
   Smaller plans are too thin for our 3k unique URLs/mo target.
3. From the dashboard, copy the API key (starts `fc-…`).
4. Run:
   ```bash
   echo -n "fc-..." | gcloud secrets create praxis-firecrawl-api-key \
     --data-file=- --project=praxisbytacitus
   gcloud secrets add-iam-policy-binding praxis-firecrawl-api-key \
     --member="serviceAccount:852128226674-compute@developer.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor" \
     --project=praxisbytacitus
   ```
5. Edit `cloudbuild.yaml` — find the frontend `--update-secrets` line
   and append `,FIRECRAWL_API_KEY=praxis-firecrawl-api-key:latest`.
6. `git commit && git push` (or ask the next agent to).
7. `gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus`.
8. Verify: `curl -s https://praxis.tacitus.me/api/health | jq '.checks.firecrawl'` should now read `"ok"`.

**Where to paste results:** None — secret stays in Secret Manager only.

---

## 3. Vertex AI Agent Engine — full deploy walk-through

**Why:** The Deep Research Agent today silently falls back to plain
Gemini grounded search because `VERTEX_AGENT_ENGINE_ID` is unset.
Deploying the engine unlocks the planner → researcher → synthesizer
3-phase agentic flow, which is a flagship differentiator.

**Expected outcome:** `/api/health` reports `vertex_adk: 'ok'`.
Visiting `/app/deep-search-agent` and asking a question returns
streaming structured Markdown with citations, generated by the
multi-agent pipeline rather than the fallback.

This walk-through is grounded in compass research §R1 (verified
2026-04-25). Pin the exact versions below — Agent Engine moved fast in
late 2025 / early 2026 and older recipes are broken.

### 3.1 Pre-flight (one-time)

```bash
# Set project and region
gcloud config set project praxisbytacitus
gcloud config set run/region us-central1

# Enable APIs
gcloud services enable aiplatform.googleapis.com storage.googleapis.com --project=praxisbytacitus

# Create the staging bucket the ADK uploads code to
gsutil mb -p praxisbytacitus -l us-central1 gs://praxisbytacitus-agent-staging
```

### 3.2 Backend scaffolding (already in repo as of this session)

Engineering already created `backend/agents/` with the deploy script.
You only need Python locally:

```bash
cd backend/agents
python3 -m venv .venv
source .venv/bin/activate    # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

That installs the pinned versions per compass §R1:

```
google-cloud-aiplatform[adk,agent_engines]>=1.148.1
google-adk==1.31.1
google-genai>=1.0.0
```

(Python 3.10–3.12 — Agent Engine doesn't yet support 3.13+.)

### 3.3 Authenticate to GCP

```bash
gcloud auth application-default login
# This opens a browser tab; consent gives the ADK ADC tokens to deploy.
```

### 3.4 Run the deploy

```bash
python deploy.py
```

`deploy.py` (already in `backend/agents/deploy.py`) does this:

1. Initialises Vertex AI with project + location + staging bucket.
2. Builds three `LlmAgent` instances:
   - **Planner** (`gemini-3-flash`) — decomposes the user question
     into 3–5 sub-queries.
   - **Researcher** (`gemini-3-flash` + `google_search` tool) —
     executes each sub-query, returns findings with quotes + URLs.
   - **Synthesizer** (`gemini-3.1-pro-preview`) — writes a Markdown
     report with citations.
3. Wraps them in a `SequentialAgent`, calls `agent_engines.create()`.
4. Prints the resource path:
   ```
   projects/852128226674/locations/us-central1/reasoningEngines/<NUMERIC_ID>
   ```

Save the `<NUMERIC_ID>`. That's what we need.

### 3.5 IAM — grant the Cloud Run runtime SA permission

```bash
gcloud projects add-iam-policy-binding praxisbytacitus \
  --member="serviceAccount:852128226674-compute@developer.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

(There is **no** `roles/aiplatform.reasoningEngineUser` role as of
April 2026 — `roles/aiplatform.user` is the canonical invoker role.)

### 3.6 Store the engine ID and wire to Cloud Run

```bash
echo -n "<NUMERIC_ID>" | gcloud secrets create praxis-vertex-adk-engine-id \
  --data-file=- --project=praxisbytacitus
gcloud secrets add-iam-policy-binding praxis-vertex-adk-engine-id \
  --member="serviceAccount:852128226674-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=praxisbytacitus
```

Then edit `cloudbuild.yaml` — find the frontend deploy step and
append `,VERTEX_AGENT_ENGINE_ID=praxis-vertex-adk-engine-id:latest`
to the existing `--update-secrets` flag.

### 3.7 Redeploy and verify

```bash
gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus
curl -s https://praxis.tacitus.me/api/health | jq '.checks.vertex_adk'   # expect "ok"
```

Then open https://praxis.tacitus.me/app/deep-search-agent in a
browser, ask a real question (e.g., "Summarise the last 30 days of
diplomatic developments around the Hodeidah ceasefire"), and confirm
the response is streaming, multi-phase, and contains citations.

### 3.8 Costs to expect

Per compass §R1: vCPU is billed at $0.0864/hr, RAM at
$0.0090/GB-hr, plus the Gemini token cost per phase. A typical
3-phase research run is a few cents. Daily spend at 50 researches is
~$5–8.

### 3.9 Where to paste results

- Numeric engine ID → only into the secret above; do **not** commit
  it to the repo
- Deploy command output (success line + endpoint path) → paste into
  `docs/DEPLOYMENT_LOG.md` for the day you ran it

---

## 4. Switch Cloud Run to the Vertex AI provider

**Why:** Compass §R8 — same per-token price as AI Studio, but adds
IAM, data residency, SLA, and VPC-SC, all required by UN/EU buyers.
Engineering work is already done; the toggle is one env var.

**Step-by-step:**

1. Edit `cloudbuild.yaml`, frontend deploy step. Find the
   `--set-env-vars` line. Add `AI_PROVIDER=vertex` if not present, or
   change `AI_PROVIDER=googleai` to `AI_PROVIDER=vertex`.
2. The Cloud Run service account already has `roles/aiplatform.user`
   (we set it during the Vertex ADK step). If you haven't run §3 yet,
   add the role:
   ```bash
   gcloud projects add-iam-policy-binding praxisbytacitus \
     --member="serviceAccount:852128226674-compute@developer.gserviceaccount.com" \
     --role="roles/aiplatform.user"
   ```
3. `gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus`.
4. Verify: `curl -s https://praxis.tacitus.me/api/health/provider | jq` —
   should report `vertex: true`.

**Why this matters strategically:** Once you start UN procurement
conversations, the buyer will ask "where is our data processed?". With
Vertex AI you can answer "any GCP region you choose, including
`europe-west1` (Belgium) or `europe-west4` (Netherlands)". With AI
Studio, the answer is "US, take it or leave it".

---

## 5. Stripe billing — products, prices, webhook

**Why:** Until configured, `/api/stripe/checkout` returns 503 and
nobody can pay you. Compass §R6 chose Stripe Billing + hosted Pricing
Tables + Entitlements API + the Invertase `firestore-stripe-payments`
extension + v2 Meters API for overages.

**Step-by-step:**

1. Visit https://dashboard.stripe.com/, finish account setup.
2. Products → create:
   - **PRAXIS Analyst** — recurring monthly $49.00
   - **PRAXIS Team** — recurring monthly $199.00
   - (Enterprise: do not create a fixed price; sales-led only.)
3. Copy the price IDs (start `price_…`) for each.
4. Set up the webhook:
   - Endpoint URL: `https://praxis.tacitus.me/api/stripe/webhook`
   - Events to listen on: `customer.subscription.created`,
     `customer.subscription.updated`, `customer.subscription.deleted`,
     `invoice.paid`, `invoice.payment_failed`,
     `entitlements.active_entitlement_summary.updated`
   - Copy the webhook signing secret (starts `whsec_…`).
5. Install the Invertase extension in Firebase (per compass §R6):
   - Firebase Console → Extensions → "Run Payments with Stripe"
   - Connect to project `praxisbytacitus`.
   - This mirrors subscriptions + customers into Firestore so PRAXIS
     can entitlement-check without a Stripe round-trip.
6. Store secrets:
   ```bash
   echo -n "sk_live_..." | gcloud secrets create praxis-stripe-secret \
     --data-file=- --project=praxisbytacitus
   echo -n "whsec_..." | gcloud secrets create praxis-stripe-webhook-secret \
     --data-file=- --project=praxisbytacitus

   for s in praxis-stripe-secret praxis-stripe-webhook-secret; do
     gcloud secrets add-iam-policy-binding $s \
       --member="serviceAccount:852128226674-compute@developer.gserviceaccount.com" \
       --role="roles/secretmanager.secretAccessor" \
       --project=praxisbytacitus
   done
   ```
7. Edit `cloudbuild.yaml`:
   - Add to `--update-secrets`:
     `STRIPE_SECRET_KEY=praxis-stripe-secret:latest,STRIPE_WEBHOOK_SECRET=praxis-stripe-webhook-secret:latest`
   - Add to `--set-env-vars`:
     `STRIPE_PRICE_ANALYST=price_xxx,STRIPE_PRICE_TEAM=price_yyy`
8. Redeploy.
9. Test the checkout flow: open `/pricing`, click "Start Analyst
   Plan", complete a Stripe test card (`4242 4242 4242 4242`).

**Engineering note:** The current `src/app/api/stripe/checkout/route.ts`
and `webhook/route.ts` are placeholder shells. Once Stripe is live in
prod, ask Codex to pick up Stream C-4 to align them with the v2
Meters API recipe per compass §R6.

---

## 6. (Optional) Anthropic Claude API

**Why:** Marginal quality bump on deep-analysis tasks. Gemini 3.1 Pro
fallback is already strong; you can defer this until a customer
specifically asks for Claude-grade output.

**Step-by-step (10 min):**

```bash
# After signing up at https://console.anthropic.com/
echo -n "sk-ant-..." | gcloud secrets create praxis-anthropic-api-key \
  --data-file=- --project=praxisbytacitus
gcloud secrets add-iam-policy-binding praxis-anthropic-api-key \
  --member="serviceAccount:852128226674-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=praxisbytacitus
```

Add to `cloudbuild.yaml`:
`ANTHROPIC_API_KEY=praxis-anthropic-api-key:latest`.

---

## 7. SOC 2 Type II — engage an auditor

**Why:** Compass §R10 — required by UN agencies, EU missions, large
NGOs (ICG, ICRC, MSF). Without SOC 2, enterprise procurement
conversations stall after the first compliance form. 4–9 month
timeline, $25–50k all-in for a startup.

**Step-by-step:**

1. Get quotes from three:
   - Drata: https://drata.com/
   - Vanta: https://www.vanta.com/
   - Secureframe: https://secureframe.com/
2. Pick one (Drata is most common for GCP-first startups).
3. Set scope: minimum is **Security + Availability +
   Confidentiality** Trust Service Criteria. Add Privacy if you sell
   to EU residents (you do).
4. They'll deploy automated evidence collection agents — let them.
5. Initial Type I audit takes 90 days; Type II observation window
   adds 6 months.
6. Realistic Type I sign-off in Q4 2026 if started this sprint.

**Where to paste results:** create
`docs/legal/soc2-engagement-YYYY-MM-DD.pdf` for the SOW. Update
`docs/COMPLIANCE.md` §2.1 quarterly with status.

---

## 8. UNGM — register at Level 2

**Why:** Required to bid on UN agency contracts >$500k per compass §R10.
Free, but the questionnaire is detailed (~2h to complete).

**Step-by-step:**

1. Visit https://www.ungm.org/Vendor/Registration → start a new
   vendor registration.
2. Have ready: company registration certificate, VAT/EIN,
   2 banking references, 2 client references (academic OK at Level 2),
   audited financials (or letter of explanation if pre-revenue),
   product/service description matching UNSPSC codes (PRAXIS maps to
   `81141500 Risk management consulting services` and
   `83121701 Information research services`).
3. Submit. Approval typically 4–8 weeks.
4. Once at Level 2 you can bid; UN agencies will then start sending
   you EOIs (Expressions of Interest) directly.

**Where to paste results:** Update `docs/COMPLIANCE.md` §2.4 status
once approved.

---

## 9. DPA + sub-processor list publication

**Why:** Required by every enterprise prospect. EU mandates GDPR
Article 28 contractually; UN agencies have their own data-processing
clauses. Compass §R10 says publish a public sub-processor list at
`/legal/sub-processors` so the buyer doesn't have to ask.

**Step-by-step:**

1. Use a template DPA (e.g., the Iubenda generator, or a lawyer
   draft) covering GDPR Art. 28 + ISO 27018 cloud-PII clauses.
2. Inventory sub-processors (already drafted in `docs/COMPLIANCE.md`
   §3): Google Cloud, Stripe, Firecrawl, Anthropic, ACLED (when
   licensed), Cloudflare.
3. Publish two pages on the marketing site:
   - `/legal/dpa.pdf` — the DPA template, downloadable
   - `/legal/sub-processors` — table with vendor + purpose + region
     + DPA link
4. Add a CTA to the footer of `praxis.tacitus.me`: "Compliance →
   /legal".
5. Get a lawyer review before publishing — €1–3k for a one-time
   review on a templated DPA.

---

## 10. Activate audience-tuning in production

**Why:** Engineering shipped audience-tuned briefing presets behind
`PRAXIS_AUDIENCE_TUNED_BRIEFING=1`. Activate when you want
`auto-briefing`, `dashboard-summary`, and `briefing-generate` to
explicitly enforce the AnalystProfile audience tone (BLUF for senior
leadership, plain language for public, etc.).

**Step-by-step (5 min):**

1. Edit `cloudbuild.yaml`, frontend deploy step, `--set-env-vars`.
2. Append `,PRAXIS_AUDIENCE_TUNED_BRIEFING=1`.
3. `git commit -am "ops: turn on audience-tuned briefings in prod"`.
4. `gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus`.
5. Test on the dashboard: sign in as a user with
   `audience: 'senior_leadership'`, click "Generate Daily Read", see
   bottom-line-up-front output. Then change profile to
   `audience: 'public'`, regenerate, confirm the tone shifts.

---

## After every action above

Update `docs/COMPLIANCE.md` (where relevant) and append a one-line
note to `docs/DEPLOYMENT_LOG.md` if a deploy was involved. The agents
read both on session start.

---

## Items that *don't* need you

The agents will pick these up from `docs/SPRINT_BACKLOG.md` without
asking — listed here only so you know they're in flight:

- **Stream B** persistence retrofits (Assistant chat, Dossier,
  Negotiation Prep, Actor Profiles, Report Studio, Early Warning,
  Sources Library, ARGUS Grounded)
- **Stream A** continuation (audience presets in production once you
  flip the flag, sidebar role-aware reordering, empty-state
  microcopy)
- **Stream D** ops hygiene (middleware → proxy migration, lint
  backlog, npm audit triage)
- **Stream E** tool catalogue (deep specs for the remaining 8
  high-traffic tools)

---

## Where this doc lives

`docs/USER_ACTION_LIST.md` — bookmark it, you'll come back to this
file every time you have an hour to unblock the team.

When you finish an item above, change its status in
`docs/COMPLIANCE.md` (for licensing/cert items) or in
`docs/SPRINT_BACKLOG.md` Stream G (for engineering-coupled items),
and tell the next agent in `docs/CONTINUATION.md` so they know.
