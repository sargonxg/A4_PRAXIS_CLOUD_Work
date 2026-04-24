# PRAXIS Completion — Master Plan

**Date:** 2026-04-24
**Author:** PRAXIS platform
**Status:** Approved by user — executing
**Scope:** Close the remaining foundation gaps so PRAXIS runs as a production-grade, business-ready product for a first-time user on the free tier, with a clean upgrade path into premium data feeds, and a credible operational posture.

This supersedes any overlapping items from:
- `2026-04-21-foundation-hardening-design.md` (already in-flight; this plan continues rather than replaces it)
- `2026-04-21-tool-improvement-roadmap.md` (Phase 1 is referenced from here)

---

## 1. Objectives

1. **Secure-by-default** — no per-user secret ever stored in plaintext. User-supplied API keys live encrypted at rest; server-side decryption only.
2. **Free-tier viable** — a new user with zero external API keys gets a working dashboard, working tools, and real (grounded) intelligence via Google Search / Vertex AI (ADC on Cloud Run, no key required).
3. **Premium feeds opt-in** — ACLED, GDELT, ReliefWeb, HDX, UNHCR, UCDP, World Bank, SIPRI, Crisis Group, Tavily, Parallel, Firecrawl are each **discoverable**, **explained**, **signupable**, **validatable**, and **cleanly degraded** when absent.
4. **GCP integration complete** — Firestore, Vertex AI, BigQuery, Cloud Storage, Pub/Sub, Cloud Functions, Cloud Scheduler, Secret Manager all verified and monitored.
5. **Observability** — a system-health dashboard that shows live state of every GCP dependency, every data feed, credit burn, error rates, and tool-level freshness.
6. **Landing** — advisor presentation trimmed to four flagships, improved narrative, honest about free-vs-premium.
7. **End-to-end verified** — scripted golden-path run: signup → onboard → create situation → dashboard → three tools produce calibrated output.

## 2. Non-Goals

- New AI tools beyond the 40 already catalogued
- Multi-tenant / team RBAC (Part 4 spec covers this)
- Mobile packaging
- Replacing the existing 6-widget dashboard already built per foundation-hardening §8.1 (we only extend it)
- Re-architecting the ACO pipeline

## 3. Phases

Execution proceeds strictly A → B → C → D. Each phase ends in a buildable commit and a progress report.

### Phase A — Tiered Feeds + BYO API Keys + Secure Storage

**Problem**: Today `users/{uid}/settings/api_keys` stores raw API keys in Firestore (`src/app/app/settings/api-keys/page.tsx:48` has the TODO). The feed aggregator has no tier model — it hits every feed and hopes. New users with no ACLED/GDELT key get dead widgets. There's no UX for "this feed needs a key, here's how to get one."

**Deliverables**:

1. **Server-side envelope encryption** (`src/lib/crypto/envelope.ts`)
   - AES-256-GCM via Node `crypto`
   - Master key from Secret Manager (`praxis-user-key-master` — 32-byte base64)
   - Per-record `{ciphertext, iv, tag, aad, alg, v, updatedAt}`
   - AAD = `uid|provider` so ciphertext cannot be replayed across users/providers
   - Tested against NIST GCM vectors

2. **Secret Manager bootstrap** (`infrastructure/bootstrap-user-key-master.sh`)
   - Idempotent: generate if missing, skip if present
   - Grants `roles/secretmanager.secretAccessor` to Cloud Run frontend SA

3. **Server-side API routes** (no client-side Firestore write of raw keys)
   - `POST /api/settings/api-keys` — validate + encrypt + store
   - `GET /api/settings/api-keys/status` — returns `{ provider: { present, masked, validated, validatedAt } }`, never plaintext
   - `DELETE /api/settings/api-keys/:provider` — clear
   - `POST /api/settings/api-keys/validate` — live-check vs provider without persisting

4. **Firestore doc shape migration** (`users/{uid}/settings/api_keys_encrypted/{provider}`)
   - Migration script reads old `api_keys` doc, encrypts per-provider, writes new docs, deletes old doc
   - `scripts/migrate-user-api-keys.mjs` — dry-run by default, `--commit` to execute
   - Firestore rule: only service account can read/write encrypted docs

5. **Feed capability resolver** (`src/lib/data-feeds/capabilities.ts`)
   ```ts
   resolveFeedCapabilities(uid): Promise<FeedCapabilityMatrix>
   // returns:
   // {
   //   free: ['grounded-search', 'gdelt', 'reliefweb', 'unhcr', 'ucdp', 'worldbank', 'hdx'],
   //   premium: { acled: 'configured'|'missing', sipri: 'unavailable', tavily: 'configured' },
   //   missing: [{ provider:'acled', signup:'...', docs:'...', costHint:'free tier available', unlocks:['event timeline','risk score']}],
   //   fallback: 'grounded-search'
   // }
   ```
   - Single source of truth used by UI, tool routes, onboarding
   - 5-minute per-request memo; bust on API-key settings change

6. **Tier-aware feed aggregator** (refactor `src/lib/data-feeds/feed-aggregator.ts`)
   - Each feed call knows its tier
   - Premium feed with no key returns `{ events: [], status: 'missing-key', provider:'acled' }` (not thrown)
   - Aggregator reports which feeds contributed + which were skipped + which failed
   - `dataQuality.coverageGaps` populated with human-readable reasons ("ACLED skipped — no API key; configure in Settings → API Keys")

7. **Per-user credential injection**
   - Every feed client accepts an optional `{ apiKey, email? }` from the capability resolver
   - Server-side: `getUserApiKey(uid, provider)` resolves ENV → Firestore-decrypted → null
   - Existing `process.env.ACLED_API_KEY` remains a tenant-wide fallback (platform-provided)

8. **Settings UI v2** (`src/app/app/settings/api-keys/page.tsx` rewrite)
   - One card per provider, grouped by category: AI Models · Conflict Feeds · Humanitarian Feeds · Web Research · Scraping
   - Each card: provider name + logo, tier badge (Free / Premium / Freemium), cost hint, "Get a key" signup link, docs link, what it unlocks list, live-validate button, status chip, delete button
   - Zero-state top card: "You're on the free tier. Google Search gives you live grounded intelligence. Add premium feeds below to unlock structured datasets."
   - Calls the server-side API routes only — no direct Firestore writes

9. **Dashboard + tool empty-states**
   - `FeedAlertsWidget` and tool pages that depend on premium feeds show a neutral "Configure [provider] to unlock" card when key is missing — NOT an error
   - Link the setting card anchor directly

10. **Onboarding Step 3 copy update**
    - "Free tier works out of the box using Google Search. Premium feeds (ACLED for event data, GDELT for media volume, SIPRI for arms flows, …) are optional — add them any time in Settings → API Keys."
    - Zero UX blocking — all steps still 3.

**Exit criteria for Phase A**:
- New user with no provider keys sees a working dashboard with grounded-search-powered widgets.
- Adding an ACLED key in Settings lights up the ACLED-dependent surfaces within 5 minutes (cache TTL) or immediately on refresh.
- `users/{uid}/settings/api_keys` (plaintext) collection is empty in Firestore after migration.
- `npm run typecheck` clean.
- Capability matrix is the single source of truth consulted by widgets, tool routes, and onboarding.

### Phase B — Advisor Council v2 completion + Landing trim

**Deliverables**:

1. Advisor catalogue reduced to 4 flagships (keep the foundation-hardening spec's picks — Takeda/Adeyemi/Reyes/Vanderberg) with Firestore `advisors/{id}` docs; admin-editable at `/app/admin/advisors`.
2. `src/components/landing/advisory-council.tsx` rewritten to render only the 4, each with photo, title, voice summary, sample question, and "Ask [name]" CTA that deep-links into `/app/advisory?advisor=...`.
3. Per-advisor model tier wired via `resolveAdvisorModel(advisorId)` — uses `getProModel` or `getDeepThinkModel` per advisor config.
4. Vertex ADC path confirmed for all advisor calls — no API key required on Cloud Run; graceful fallback to Gemini 3 + grounded search when Agent Engine ID not set.
5. Landing copy audit: remove any "10 advisors" references, refresh hero subhead to match free-tier pitch.

### Phase C — Observability + Diagnostics

**Deliverables**:

1. `/app/admin/diagnostics` page (admin-gated via `ADMIN_ALLOWLIST`):
   - **GCP readiness strip** — Firestore, Vertex, BigQuery, Pub/Sub, Scheduler, Storage, Functions, Secret Manager. Green/amber/red with last-check timestamps.
   - **Data feed matrix** — all 11 feeds × last call timestamp × success rate (24h) × median latency.
   - **Credits ledger** — daily BigQuery burn, top 10 users by credits-last-30d, top 10 tools by credits-last-30d.
   - **Tool error rate** — last 100 `withCalibration` invocations per tool with pass/fail ratio.
   - **Route latency heatmap** — 73 API routes × p50/p95/p99 over 24h.
2. `scripts/audit-gcp.mjs` extended to check Pub/Sub topics, Scheduler jobs, Storage buckets, Firestore indexes. Returns non-zero if any required resource is missing.
3. BigQuery dataset `praxis_analytics` gets a `tool_invocations` table. `withCalibration` writes a row per call (uid-hashed, toolId, profileVersion, creditsDelta, ms, status) — already partly wired; finish it.
4. `/settings/system-health` (user-facing, non-admin) gets a trimmed view: feed availability, their own credit burn trend, last 10 tool runs.
5. Alert: Cloud Monitoring alert policy template in `infrastructure/monitoring-alerts.sh` for error-budget burns (route 5xx > 5% over 10m).

### Phase D — End-to-end free-tier QA

**Deliverables**:

1. `tests/e2e/golden-path.spec.ts` Playwright test:
   - Signup as new user (test fixture)
   - Complete onboarding (identity → perspective → working style → submit)
   - Create a new situation with 2 source URLs
   - Land on dashboard; assert 6 widgets render with tier-appropriate states
   - Run three tools: Risk Monitor, Early Warning, Stakeholder Map
   - Assert each tool produces a non-empty calibrated output
2. `docs/golden-path.md` — documented, screenshotted, verified walkthrough.
3. Fix list from dry runs — each failure fixed in a small commit.
4. `npm run smoke:golden-path` — CI-capable script that runs the above headless.

## 4. Security Posture (cross-cutting)

- No raw user secret in Firestore after Phase A.
- All server-side routes touching secrets: `withAuth` + per-route CSRF token (short-lived, signed).
- Secret Manager access limited to Cloud Run SA (`roles/secretmanager.secretAccessor` at resource scope).
- Firestore rules updated: `users/{uid}/settings/api_keys_encrypted/**` deny-all for clients.
- Build-time secrets audit: `scripts/audit-secrets.mjs` scans for `AIza...`, `sk-...`, `tvly-...`, `fc-...`, service-account JSON patterns in tracked files. Fails the build.
- The `AQ.Ab8RN6I...` string is treated as the Firebase App Check public key (already client-side) — we document this explicitly so future maintainers don't confuse it with a secret.

## 5. Sequencing

```
A1 envelope crypto + Secret Manager bootstrap
A2 server-side API routes
A3 Firestore rules + migration script
A4 capability resolver
A5 feed-aggregator tier awareness
A6 settings UI v2
A7 dashboard + tool tier empty-states
A8 onboarding copy
A9 Phase A verification pass
 ↓
B1 advisor Firestore seed (4 flagships)
B2 landing advisory-council rewrite
B3 per-advisor model resolver
B4 Vertex ADC fallback verify
B5 landing copy audit
 ↓
C1 diagnostics page shell
C2 GCP readiness probes
C3 feed matrix card
C4 credits ledger card
C5 tool error rate card
C6 route latency card
C7 audit-gcp.mjs extensions
C8 BigQuery tool_invocations table
C9 Cloud Monitoring alert templates
 ↓
D1 Playwright golden-path test
D2 dry runs + fix list
D3 golden-path docs
D4 smoke script + CI wiring
```

Each arrow is a committable checkpoint.

## 6. Risks

- **KMS vs app-level encryption** — we're using app-level AES-256-GCM with a Secret Manager-held master key. A future migration to Cloud KMS is straightforward (re-encrypt records under a KMS-wrapped DEK). Documented, not blocking.
- **Firestore migration downtime** — mitigated by dual-read during rollout (try new location first, fall back to old), then run destructive migration after 24h of dual-read with no misses.
- **Advisor cost creep** — capped by the existing 5-min advisor-config cache and `memoryPolicy.lastTurns`.
- **BigQuery logging volume** — `tool_invocations` writes are sampled at 100% initially; if cost spikes, drop to 10% with `mod(hash(uid), 10) == 0` sampling.

## 7. What the user sees after each phase

- **After A**: A new signup with just Google account can complete onboarding, create a situation, see 6 dashboard widgets with real grounded-search content, and run every tool. Settings → API Keys clearly explains what each premium feed unlocks, links to signup, validates keys live.
- **After B**: Landing page is tight. Four advisors, each with credible bio + sample ask. Advisor Council inside the app works with session memory and the right model tier.
- **After C**: Admin can open `/app/admin/diagnostics` and see the entire platform's heartbeat on one screen. On-call alerts fire when anything breaks.
- **After D**: A scripted walkthrough proves the golden path is green from cold signup to three calibrated tool outputs. Anyone new joining the team can run it in 10 minutes.

---

**Execution starts immediately on Phase A.**
