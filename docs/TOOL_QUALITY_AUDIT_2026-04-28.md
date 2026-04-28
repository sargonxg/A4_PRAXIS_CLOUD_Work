# PRAXIS Tool Quality Audit — 2026-04-28

Scope: every page under `src/app/app/<tool>` should produce a useful, non-empty output for the demo Nordalia situation and for a real authenticated situation. This audit is the working log for the strategic priority: every tool produces something.

Categories:

- `silently empty`: route returns 2xx or UI completes, but no useful result appears.
- `demo leak`: hard-coded demo/Nordalia content appears in a real situation.
- `route-renders-but-UI-empty`: route returns data, but the page does not render it.
- `credit-deducted-no-output`: billing/credits run, but no durable result is shown or saved.
- `ok`: output is useful, non-empty, cited/provenanced where applicable, and saved.

Current shared-layer improvements in this pass:

- `AiPopulate` now blocks successful-but-empty responses from being saved and turns them into a visible generation error.
- `AiPopulate` now renders `OutputProvenancePanel` for generated/persisted outputs with analyst profile version, domain version, framework chips, source pills, and live-feed receipts when available.
- `OutputProvenancePanel` now supports framework chips, calibration labels, and source receipt pills with feed name + timestamp.
- Dashboard now surfaces the first ten Core MVP tools as a grouped readiness widget.
- Free research no longer depends on Firecrawl being configured. The research
  engine now always calls `searchWeb()`, which falls back to free Wikipedia,
  GDELT, and native-fetch paths when Firecrawl is absent.
- `/api/promo/redeem` grants a one-week `enterprise` promo entitlement and a
  credit top-up from server-only `PROMO_FULL_ACCESS_CODES`; `resolveTier()`
  downgrades expired promo access back to `free`.
- Brainstorming Table now accepts pasted working text, local `.txt` / `.md`
  browser files, and selected uploaded document extracts from the active
  situation so expert personas can deliberate over the user's live material.
- Dashboard now includes a case-file launchpad: readiness score, next best
  actions, and first deliverables derived from the selected policy workflow
  path on the active situation.

| Tool | Works | Non-empty | Cited / provenance | Saved | Regression category | Notes |
|---|---:|---:|---:|---:|---|---|
| dashboard | Partial | Unknown | Partial | Yes | ok / needs browser audit | Daily Read route exists; dashboard now has Core MVP tools widget. |
| early-warning | Unknown | Unknown | Shared receipt | Unknown | needs audit | Uses `ToolPageShell`; verify Regenerate on Nordalia and real situation. |
| risk-monitor | Unknown | Unknown | Shared receipt | Unknown | needs audit | High-priority Core MVP tool; verify no demo-shaped renderer leak. |
| actor-profiles | Unknown | Unknown | Shared receipt | Unknown | needs audit | Verify route output renders profiles and persists under the same tool id the page reads. |
| stakeholder-map | Unknown | Unknown | Partial | Unknown | needs audit | Explorer flagged possible page/route persistence mismatch. |
| briefing | Unknown | Unknown | Shared receipt | Unknown | needs audit | Verify generated slides/sections render after Regenerate. |
| talking-points | Unknown | Unknown | Partial | Unknown | needs audit | Not fully wrapped by shared shell; verify provenance and saved output. |
| negotiation-prep | Unknown | Unknown | Shared receipt | Unknown | needs audit | Verify ZOPA/BATNA output is situation-specific. |
| commitments | Unknown | Unknown | Shared receipt | Unknown | needs audit | Verify commitment rows save and render after reload. |
| sanctions | Unknown | Unknown | Shared receipt | Unknown | needs audit | Verify source pills for sanctions/designation data. |
| brainstorming-table | Partial | Yes | Partial | Yes | needs browser audit | API and UI support active situation corpus, pasted text, local TXT/MD, and selected uploaded documents; verify real-user generation, citations, and reload rendering in browser. |
| treaty-analyzer | Unknown | Unknown | Shared receipt | Unknown | needs audit | Uses `ToolPageShell`; verify legal instrument output is non-empty. |
| legal-tracker | Unknown | Unknown | Shared receipt | Unknown | needs audit | Verify hyphen/underscore persistence does not hide saved output. |
| human-rights | Unknown | Unknown | Shared receipt | Unknown | needs audit | Specialized policy tool; verify IHL/IHRL sections and citations. |
| economic-impact | Unknown | Unknown | Shared receipt | Unknown | needs audit | Verify macro/sector fields are not empty placeholders. |
| humanitarian | Unknown | Unknown | Partial | Unknown | demo leak sweep follow-up | Round 6 closed known leak; re-test real situation. |
| dossier | Unknown | Unknown | Partial | Unknown | demo leak sweep follow-up | Round 6 closed known leak; re-test real situation. |

Next audit procedure:

1. Start the app locally and sign in with a real non-demo account that has a Nordalia situation.
2. For each row, open `/app/<tool>`, click `Regenerate`, and watch UI + network response + persistence.
3. Mark `Works`, `Non-empty`, `Cited / provenance`, and `Saved` as yes/no.
4. Add exact route, console, or Firestore symptoms to `Notes`.
5. Promote tools from `needs audit` to one of the named categories above.

## 2026-04-28 Addendum — Billing, Access, and Data Shape

Billing transition:

- Stripe is no longer the active launch target. The app now routes paid checkout
  through Polar (`/api/polar/checkout`) and expects hosted Polar products for
  `analyst`, `team`, and optional `enterprise`.
- Self-serve paid tiers should have a 14-day Polar product trial. Firestore
  mirrors `subscription`, `subscriptionStatus`, `subscriptionProvider`,
  `polarCustomerId`, `polarSubscriptionId`, `polarProductId`,
  `polarTrialEndsAt`, and `subscriptionExpiresAt`.
- Free users keep access to Google Search-grounded research and open-data feed
  coverage. Advanced keys remain self-serve under `/settings/api-keys`; do not
  hide that path behind billing.

Immediate checklist:

1. Generate a fresh Polar production OAT and webhook secret; the token supplied
   on 2026-04-28 returned Unauthorized against both production and sandbox.
2. Create Polar products in organization `tacitus`:
   - `PRAXIS Analyst`, $99/month, 14-day trial, metadata `app=praxis`, `tier=analyst`.
   - `PRAXIS Team`, $499/month, 14-day trial, metadata `app=praxis`, `tier=team`.
   - `PRAXIS Institution`, keep contact-first unless a fixed self-serve price is
     intentionally chosen.
3. Set `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, `POLAR_SUCCESS_URL`,
   `POLAR_PRODUCT_ANALYST`, `POLAR_PRODUCT_TEAM`, and optionally
   `POLAR_PRODUCT_ENTERPRISE` in Secret Manager and local `.env.local`.
4. Add webhook endpoint `/api/polar/webhook` in Polar and subscribe to
   `subscription.created`, `subscription.active`, `subscription.updated`,
   `subscription.canceled`, `subscription.revoked`, `subscription.uncanceled`,
   and `order.paid`.
5. Browser-test `/pricing -> /login?plan=analyst -> /app/settings?upgrade=analyst`
   and verify checkout redirect, webhook entitlement update, customer portal,
   and Firestore rule protection.
6. Keep `PROMO_FULL_ACCESS_CODES` server-only. Use short campaign codes for
   pilots, rotate after each cohort, and treat this as a trial bridge rather
   than a billing substitute.

Free / trial / paid access model:

- Free users must still feel the product: dashboard, core situation setup,
  grounded search, brief research runs, limited Firecrawl URL fetch fallback,
  documents, notes, and selected top tools should produce useful cited output.
- The one-week code is for diplomats, advisors, and institutional pilots who
  need to test the full workflow before procurement. It unlocks enterprise
  gates temporarily but does not create a Polar subscription.
- Analyst paid tier should unlock higher-depth research, Deep Research Agent,
  Parallel.ai, larger document/corpus operations, more exports, and premium
  provider keys.
- Team paid tier should emphasize shared situations, shared corpora, team
  knowledge bases, collaboration, admin visibility, and higher quotas.
- Enterprise should emphasize private deployment, Vertex AI/IAM posture,
  managed knowledge bases, public/internal policy chatbots, audit logs, and
  procurement-ready support.

Firestore / NoSQL cleanup:

- Canonical user state remains `users/{uid}`; billing fields are server-only.
- Tool output storage is split between `tool-data/{toolId}` and `tools/{toolId}`.
  Pick one durable contract for the flagship tools before the next persistence
  sprint.
- Situation subcollections are broadly owner-writable. Server-generated
  artifacts should move toward API-only writes where provenance/audit matters.
- Research artifacts live in multiple layouts (`research`, `auto-briefings`,
  `tool-data`, `tools`). Normalize these toward a single `CorpusItem` envelope
  so Ask PRAXIS, SKC, and exports can retrieve them consistently.
