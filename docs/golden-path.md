# PRAXIS Golden Path — Free-Tier Walkthrough

Verifies the end-to-end story a first-time user is meant to experience on the
free tier, with only Google-managed credentials. Useful as both a manual QA
script and the specification that `tests/e2e/golden-path.spec.ts` encodes.

## Prerequisites

- PRAXIS deployed (or `npm run dev` running locally)
- One of:
  - Local dev:  `infrastructure/bootstrap-user-key-master.sh --local` has been run
  - Prod:       `praxis-user-key-master` secret exists in Secret Manager and is mounted on both Cloud Run services
- Firebase Auth email/password enabled, or a test Google account available
- No premium API keys set anywhere in the environment (that's the point — we're proving the free tier works)

## Step 1 — Landing page

Open `/`. Expect:

- Hero "From Raw Sources to Credible Intelligence" animation
- Advisory Council section with exactly **four** cards (Adeyemi, Reyes, Vanderberg, Takeda)
- "Four specialists. One persistent brief." headline
- **Graph memory, not token soup** callout explaining the per-user profile, per-situation ACO graph, per-session rolling memory
- "Open in your workspace" CTA on each advisor modal

## Step 2 — Sign-up / sign-in

Click "Get Started" → `/login`. Sign up or sign in.

Expected: redirect to `/onboarding` because `meta.completedAt` is null.

## Step 3 — Onboarding, 3 steps

1. **Identity** — pick role + seniority + organisation
2. **Perspective** — drag-reorder analytical lenses, pick regions/audience
3. **Working style** — language, source categories, red lines

Scroll to the bottom of Step 3. Expect the **Data tier** note:

> PRAXIS runs out of the box on the free tier — Google Search grounded research,
> GDELT media volume, ReliefWeb situation reports, HDX displacement data, UNHCR,
> UCDP, World Bank, SIPRI, and Crisis Group outlooks are all enabled by default
> with no key needed.

Click **Review and complete**.

## Step 4 — First situation

After onboarding success, land on `/app/situations/new`. Give the situation a name (e.g. "Mali — Transitional governance"), optionally add source URLs, submit.

Expected: redirect to the situation's dashboard.

## Step 5 — Dashboard

On `/app/dashboard` you should see:

1. **Source-coverage banner** above the grid:
   > Source coverage: N / N+M (X%) — Free-tier grounded web search is active.
   > Unlock more by adding keys: [Configure]
2. **6-widget grid**: Risk gauge, Escalation, Advisors, Recent tools, Feed alerts, Credits
3. No "Configure key" errors — all widgets either render data or show a calm empty state

Click **Configure** in the coverage banner. You should land on `/app/settings/api-keys`.

## Step 6 — Settings → API Keys (confirm tier story)

Expect four category sections:

- **AI Models** — Google AI (tier: Free, uses platform default), Anthropic (Premium), OpenAI (Premium)
- **Conflict & Humanitarian Feeds** — ACLED (Freemium, "Not configured")
- **Web Research** — Tavily (Freemium), Parallel (Premium)
- **Scraping & Ingestion** — Firecrawl (Freemium)

For Google AI, the status pill reads "Using platform default" when `GOOGLE_AI_API_KEY` is set on the server (or Vertex ADC is active on Cloud Run).

## Step 7 — Run three tools

Navigate to each of these and confirm they render without error on the free tier:

| Tool | Path | Expected |
|---|---|---|
| Risk Monitor | `/app/risk-monitor` | Heading renders; risk composite shown or calm "insufficient data" state |
| Early Warning | `/app/early-warning` | Glasl stage panel renders; triggers list |
| Stakeholder Map | `/app/stakeholder-map` | MAW salience scatter renders |

If ACLED is unconfigured the UI should clearly say "Configure ACLED to unlock event-level data" — not crash and not silently show zeros.

## Step 8 — Admin diagnostics (optional)

If your uid is in `ADMIN_ALLOWLIST`, open `/app/admin/diagnostics`. Expect:

- 4 counter cards (users sampled, 24h credits burn, 7d credits burn, feed coverage)
- Probe group **Storage** — Firestore: OK
- Probe group **AI Providers** — Vertex (OK if AI_PROVIDER=vertex), Google AI (OK if GOOGLE_AI_API_KEY set), Anthropic (unconfigured is fine on free tier)
- Probe group **Secrets** — all five env-mounted secrets report OK
- Feed Matrix showing all 11 feeds with their availability tier
- Runtime card with Node version, AI provider, Vertex project, region

## Automation

```sh
# Unauth smoke (fast, runs in CI)
npx playwright test tests/e2e/capabilities-api.spec.ts

# Full signed-in smoke (needs a seeded fixture user)
TEST_FIREBASE_EMAIL=golden-path@tacitus.me \
TEST_FIREBASE_PASSWORD=... \
PLAYWRIGHT_BASE_URL=https://preview-url \
  npx playwright test tests/e2e/golden-path.spec.ts
```

## Failure modes and their fixes

| Symptom | Root cause | Fix |
|---|---|---|
| `USER_KEY_MASTER env var is not set` on API calls | Secret not mounted | Run `infrastructure/bootstrap-user-key-master.sh` and redeploy |
| Dashboard coverage banner missing | `/api/capabilities` 500 | Check Firestore Admin SDK init (FIREBASE_SERVICE_ACCOUNT_KEY) |
| Every premium feed shows "missing-key" even after adding a key | Capability cache not busted | Re-save the key — cache TTL is 5 minutes; the settings route clears it via the status endpoint |
| Advisor chat returns 500 | Anthropic not configured and Vertex ADC not active | Either set `GOOGLE_AI_API_KEY` or enable `AI_PROVIDER=vertex` with ADC |
| Admin diagnostics 403 for your own uid | Not in ADMIN_ALLOWLIST | Add your uid to the env var and redeploy |
