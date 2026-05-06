# Documentation Improvement Roadmap

> Prioritised backlog of documentation improvements. Each item is scoped, actionable, and includes the business reason.

---

## Priority 1 — High value, low effort

### 1.1 `.env.local.example` file
**What:** Create a `.env.local.example` file at the repo root listing every environment variable with a blank or placeholder value and an inline comment explaining what it is and where to get it.
**Why:** README currently documents env vars in prose. Developers (and onboarding AI assistants) miss variables because they're reading text, not copying a file. `vercel env pull` + a checked-in example file is the standard pattern.
**File to create:** `.env.local.example`

```
# Required — Google Gemini (AI generation)
GOOGLE_AI_API_KEY=

# Required — Firebase Admin SDK (server-side auth + Firestore)
# JSON string: Firebase Console → Project Settings → Service Accounts → Generate new private key
FIREBASE_SERVICE_ACCOUNT_KEY=

# Optional — Claude deep analysis (falls back to Gemini Pro if absent)
ANTHROPIC_API_KEY=

# Optional — Firecrawl web research
FIRECRAWL_API_KEY=

# Required — Deep Research Agent (Vertex AI ADK Reasoning Engine ID, numeric)
VERTEX_AGENT_ENGINE_ID=

# Optional — Vertex AI region (default: us-central1)
VERTEX_AGENT_LOCATION=

# Optional — GCP project (default: praxisbytacitus)
GOOGLE_CLOUD_PROJECT=

# Required — Cron job auth + bulk credit reset
CRON_SECRET=

# Optional — Transactional email (welcome, password reset overrides)
RESEND_API_KEY=

# Optional — Sentry error monitoring
NEXT_PUBLIC_SENTRY_DSN=

# Optional — Stripe payments
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Optional — ACLED armed conflict data
ACLED_API_KEY=
ACLED_EMAIL=
```

---

### 1.2 Firestore index and rules documentation
**What:** Add `docs/FIRESTORE.md` documenting the deployed security rules and indexes. Include the exact rules in a code block, explain each rule's intent, and list the composite indexes needed for complex queries.
**Why:** Firestore security rules are not visible in the codebase after `firebase deploy`. Developers and ops can't audit them without Firebase Console access. The indexes are invisible entirely.
**File to create:** `docs/FIRESTORE.md`

---

### 1.3 API route catalogue in machine-readable form
**What:** Create `docs/API.md` with one table per section (auth, AI, data, admin, cron) documenting: method, route, auth requirement, request shape, response shape, and credits cost.
**Why:** Currently scattered across README, CLAUDE.md, and code. A dedicated, searchable reference is essential for frontend devs calling APIs and for writing integration tests.
**File to create:** `docs/API.md`

---

### 1.4 CONTRIBUTING.md
**What:** Standard contributing guide covering: local setup, branch naming convention, commit message format, PR process, how to run tests, and how to add a new tool page (the most common contribution type).
**Why:** There is no contribution guide. New developers have no idea how to add a tool page without reading CLAUDE.md end-to-end. A concise guide with a "Adding a new tool" walkthrough cuts onboarding time dramatically.
**File to create:** `CONTRIBUTING.md`

---

## Priority 2 — Medium value, medium effort

### 2.1 AI tool development guide
**What:** `docs/ADDING_AI_TOOLS.md` — step-by-step walkthrough for adding a new AI tool: tool registry entry, Zod schema, API route, page component, credit cost, demo data, sidebar entry.
**Why:** PRAXIS has 40+ tool pages. The pattern is consistent but undocumented as a guide. A developer adding tool #41 currently has to reverse-engineer tool #40.

---

### 2.2 Credit system documentation
**What:** `docs/CREDITS.md` — authoritative reference for the credit system: how credits are stored (Firestore), how `checkAndDeductCredits` works (atomic transaction), refund behaviour on error, demo user behaviour, self-service top-up, admin bulk reset, and Stripe integration points.
**Why:** Credits are a core monetisation mechanism. The logic is split across `with-credits.ts`, `firestore.ts`, and API routes. A single reference prevents bugs from developers making untested assumptions.

---

### 2.3 Data feed integration guide
**What:** `docs/DATA_FEEDS.md` — for each of the 9 data feeds: the base URL, rate limits, caching strategy, what fields PRAXIS extracts, and the helper functions to call.
**Why:** When ACLED changes their API, or a feed goes down, the developer needs to know exactly what's affected. Currently this requires reading each client file individually.

---

### 2.4 Deployment runbook
**What:** `docs/DEPLOYMENT.md` — step-by-step production deployment procedure: pre-deploy checklist (build, lint, type check), Vercel env var verification (using `/api/auth/test-firebase`), post-deploy smoke tests, rollback procedure, and cron job verification.
**Why:** Deployments are currently a push-and-pray operation. A runbook prevents the class of production incidents seen in this codebase (broken auth, misconfigured env vars, 500s on AI routes).

---

### 2.5 Demo data documentation
**What:** `docs/DEMO_DATA.md` — documents the Nordalia Crisis scenario: what it represents, which files define it, how to add or update it, and what the demo versions of each page render.
**Why:** The demo is a critical sales tool. Anyone maintaining or updating demo data needs to understand the scenario structure. Currently this requires reading `src/lib/constants/` files with no narrative context.

---

## Priority 3 — High value, higher effort

### 3.1 Architecture Decision Records (ADRs)
**What:** `docs/adr/` directory with one file per significant architectural decision. Start with the 5 most impactful:
- ADR-001: Why `middleware.ts` and not `proxy.ts` (broke Google Sign-In in v3.9.1)
- ADR-002: Why raw ID token in cookie vs Firebase session cookie
- ADR-003: Why `signInWithRedirect` vs popup (COOP headers)
- ADR-004: Why Turbopack and not Webpack
- ADR-005: Why demo mode uses a separate cookie rather than a special Firebase user
**Why:** These decisions are currently undocumented. The next developer (or future AI assistant) will revisit them, waste time, and may break things (as happened with `proxy.ts`). ADRs are the standard engineering practice for capturing irreversible decisions with context.

---

### 3.2 Situation data model deep-dive
**What:** `docs/SITUATION_MODEL.md` — full documentation of the situation data model: TypeScript types, Firestore document structure, ACO v2.0 entity definitions (with examples), how the conflict graph is built, and how tools consume situation context via `buildToolContext()`.
**Why:** The situation model is the heart of PRAXIS. Every tool page, every AI prompt, every data fetch depends on it. It's currently only documented in types and CLAUDE.md snippets.

---

### 3.3 Inline JSDoc on public interfaces
**What:** Add JSDoc comments to the 10 most-used TypeScript interfaces and functions: `AuthContextValue`, `AuthUser`, `Situation`, `withAuth`, `checkAndDeductCredits`, `ensureUserProfile`, `buildToolContext`, `getSituationIntelligence`, `AiPopulate`, `useSituationGuard`.
**Why:** These are the interfaces every tool developer touches first. JSDoc appears in IDE tooltips and is the fastest path to understanding intent. Currently they have no comments at all.

---

### 3.4 Test coverage documentation
**What:** `docs/TESTING.md` — documents the test strategy, what is tested (unit vs integration), how to run tests, how to mock Firebase in tests, and which paths have zero coverage (auth flow, credit deduction, Firestore operations).
**Why:** The codebase has Vitest configured but test coverage appears minimal. Documenting the absence of tests is as valuable as documenting their presence — it clarifies the risk surface and guides future investment.

---

## Maintenance: Fix Stale Content

These are existing docs with known inaccuracies to fix as part of routine maintenance:

| File | Issue |
|------|-------|
| `README.md` | ~~Fixed in v5.2.0~~ — was showing v3.9.5, 100 credits, 21 tools |
| `TOOL_AUDIT.md` | Does not include tools 22-27 (v5.0), Geospatial Monitor, Game Theory, Deep Research Agent |
| `src/TOOL_AUDIT.md` | Duplicate of `TOOL_AUDIT.md` — one should be deleted |
| `CHANGELOG.md` | v3.7.0 through v3.9.x entries could be condensed since pre-4.0 is mostly historical |

---

## Documentation Stack Recommendation

For a project of this scale, consider adopting **Nextra** or **Docusaurus** as a documentation site (hosted at `docs.praxis.tacitus.me`):

- Auto-generates API reference from TypeScript types via `typedoc`
- Supports Mermaid diagrams natively
- Versioned docs (one set per major release)
- Search across all docs

Until then, the flat-file approach in this repo is appropriate — but keep `docs/` as the canonical location for anything longer than a README section.
