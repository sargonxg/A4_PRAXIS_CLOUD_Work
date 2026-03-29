# Changelog

All notable changes to PRAXIS by TACITUS are documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [3.6.3] — 2026-03-29

### Fixed

- **Unified subscription tiers** — `SubscriptionTier` type in `firestore.ts` was `free|pro|enterprise` but pricing page and Stripe checkout used `free|analyst|team|enterprise`. Aligned to match pricing page tiers (analyst/team/enterprise). Dead code in `subscription/tiers.ts` identified.
- **Stripe webhook hardened** — Added idempotency (skip duplicate events), audit trail logging (credit_transactions collection), and proper error responses (500 for Firestore failures so Stripe retries). Field name corrected from `subscriptionTier` to `subscription` to match Firestore schema.
- **Stripe env var documentation** — Added `STRIPE_PRICE_ANALYST`, `STRIPE_PRICE_TEAM`, `STRIPE_PRICE_ENTERPRISE`, `STRIPE_PRICE_CREDITS_100` to `.env.local.example`.

---

## [3.6.2] — 2026-03-29

### Added

- **Token refresh loop** — Firebase ID tokens expire after 1 hour. Added `onIdTokenChanged()` listener in `auth-context.tsx` that detects token changes and proactively refreshes 5 minutes before expiry. Session cookie is automatically updated with fresh tokens. Users no longer hit 401s on long sessions.
- **Error boundaries** — Added Next.js `error.tsx` at root, `/app`, and `/demo` levels. Wired existing `ErrorBoundary` component into `AppShell` main content area. Any tool page crash now shows a styled fallback with "Try Again" and "Report Issue" buttons instead of a white screen.

---

## [3.6.1] — 2026-03-28

### Security — Auth Hardening

- **CRITICAL: Removed unsafe JWT fallback in `admin.ts`** — Previously decoded JWT payloads without cryptographic verification when Admin SDK verification failed. Attacker could craft fake JWTs to impersonate any user. Now strictly requires verified tokens via Firebase Admin SDK.
- **CRITICAL: Removed silent credit bypass on Firestore failure** — `with-credits.ts` returned `allowed: true` when Firestore was unavailable, allowing unlimited AI usage. Now returns 503 and blocks the request.
- **CRITICAL: Fixed credit deduction race condition** — `firestore.ts` used check-then-deduct pattern vulnerable to concurrent requests double-spending credits. Now uses `runTransaction()` for atomic check + deduct.
- **HIGH: Removed unsafe JWT decode in `with-credits.ts`** — `getSessionUid()` decoded JWT without verification to extract UID. Now uses `verifyIdToken()` from Admin SDK.
- **HIGH: Added server-side token validation to session route** — `POST /api/auth/session` stored tokens without verification. Now verifies token via Firebase Admin SDK before setting cookie.
- **HIGH: Added CSRF/origin validation to session route** — Validates `origin` header matches `host` to prevent cross-site session manipulation.
- **HIGH: Fixed rate limiter memory leak** — `rateLimitMap` in `with-auth.ts` grew unbounded. Added periodic garbage collection (every 5 minutes) to remove expired entries.
- **HIGH: Hardened Firestore security rules** — Users could previously modify `credits`, `totalCreditsUsed`, `subscription` fields directly via client SDK. Rules now block writes to protected fields; only Admin SDK (server-side) can modify credits.
- **MEDIUM: Moved Firebase client config to environment variables** — API key, project ID, and other client config moved from hardcoded values to `NEXT_PUBLIC_FIREBASE_*` env vars with backwards-compatible defaults.

### Changed

- Updated `.env.local.example` with Firebase client SDK env var documentation

---

## [3.6.0] — 2026-03-28

### Security

- **Wrapped 6 unprotected AI routes with `withAuth()`** — `claude-analyze`, `deep-research`, `grounded-search`, `media-analyze`, `research`, `terminology` were previously exposed without authentication verification or rate limiting. All now require valid Firebase session + enforce 100 req/min rate limit.
- **Added credit deduction to `auto-structure`** — This resource-intensive pipeline (web scraping, feed polling, multi-tool initialization) was missing `checkAndDeductCredits()`. Now deducts 5 credits (ai_research tier).

### Audited

- Full API route audit: all 59 routes verified for auth, credits, situation context, error handling
- All 35+ app pages verified for `useSituationGuard()` — 3 intentional exceptions (settings, situations list, new situation)
- All 21 chat tools verified as wired to assistant via `tacitusTools` in chat route
- Zero TODO/FIXME/HACK comments found in API layer
- Zero demo data leaks into production paths confirmed
- All environment variable usage verified — no hardcoded secrets

### Documentation

- Added `CHANGELOG.md` (this file)
- Added `TOOL_AUDIT.md` — complete tool-by-tool wiring status with API routes, pages, and recommendations
- Updated `CLAUDE.md` — reflects v3.6 state, corrected tool count, added audit findings
- Updated `README.md` — professional format with full architecture, all 59 API routes, improvement roadmap

---

## [3.5.0] — 2026-03-26

### Added

- Sources Library page (`/app/sources`) — browse ACLED, GDELT, ReliefWeb, HDX, World Bank, Wikipedia feeds
- Unified web crawler infrastructure via Firecrawl (`scrapeMultiple`, `crawlUrl`)
- 29 tool pages across Situation Room, Analysis & Drafting, Intelligence Tools, Workspace
- Persisted tool data with 24h TTL via `usePersistedToolData` hook
- Source mode picker: all / web+docs / docs-only / llm-only
- Auto-structure pipeline — auto-populates new situations with research, actors, risk scores

### Changed

- AI model tiers: Flash for chat, Pro for structured tools, Claude for deep analysis, Grounded for research
- Tool pages use `AiPopulate` pattern for automatic data generation on first visit

---

## [3.4.0] — 2026-03-20

### Added

- Advisory Council chatbot (`/app/advisory`) — multi-actor perspective analysis
- Auto-briefings system with Vercel cron jobs (05:00 UTC daily)
- Alert center with GDELT-based early warning (06:00 UTC daily)
- Compare tool for side-by-side conflict analysis
- Briefing room with speaker notes

---

## [3.3.0] — 2026-03-15

### Added

- AiPopulate pattern — auto-generates structured data on first tool visit
- 25+ AI tools with Zod schemas and structured output
- Conflict Grammar v2.0 — 14-entity ontology (8 core + 6 extended)
- INFORM Risk Index 5-dimension scoring
- Glasl 9-stage escalation tracking
- Fisher/Ury ZOPA/BATNA negotiation analysis
- Mitchell/Agle/Wood stakeholder power mapping
- CRAAP test media reliability scoring
- NATO STRATCOM info environment assessment
- UN DPPA morning brief standard
- Berghof mediation process design

---

## [3.2.0] — 2026-03-10

### Added

- Document upload & RAG pipeline (PDF, DOCX, TXT, MD)
- Knowledge graph visualization with D3.js force layout
- Report export to DOCX and PDF
- Treaty analyzer with ambiguity flagging
- Sanctions tracker with escalation scanning
- Commitment compliance monitoring

---

## [3.1.0] — 2026-03-05

### Added

- Floating "Ask PRAXIS" chat panel on all pages
- Mobile responsive layout — sidebar becomes drawer overlay
- Keyboard shortcuts: `/` opens chat, `Esc` closes
- PRAXIS super-agent mode in chat — platform-aware, can guide users to tools

---

## [3.0.0] — 2026-03-01

### Added

- Dual-app architecture: `/app/*` (authenticated) + `/demo/*` (cookie-only)
- Pre-loaded Nordalia Crisis demo with cached AI responses
- Firebase Auth (Google + email/password)
- Firestore-backed situation-driven data model
- TACITUS credit system (100 on sign-up, per-use deduction)
- Vercel deployment with iad1 region
- 35+ tool pages
- Stripe payment routes (checkout + webhook)

---

## [2.x] — Pre-release

Internal prototypes. Not publicly available.
