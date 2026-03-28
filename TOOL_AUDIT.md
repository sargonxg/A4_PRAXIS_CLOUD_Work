# PRAXIS Tool Audit — v3.6

> Last audited: 2026-03-28

## Summary

| Category | Count | Status |
|----------|-------|--------|
| AI Chat Tools (tools.ts) | 21 | All wired to chat assistant |
| API Routes (total) | 59 | All secured |
| API Routes (AI) | 34 | All have withAuth + credits |
| App Pages | 42 | All use useSituationGuard |
| Demo Pages | 30 | All scoped to demo data |
| Cron Jobs | 2 | CRON_SECRET secured |

---

## Chat Tools (src/lib/ai/tools.ts)

All 21 tools are exported as `tacitusTools` and passed to the AI assistant via `streamText({ tools: tacitusTools })` in `/api/ai/chat/route.ts:186`. The AI agent invokes these tools autonomously during chat sessions based on user queries.

| # | Tool | Purpose | Model | Used By |
|---|------|---------|-------|---------|
| 1 | `webSearch` | Firecrawl-powered web research with reliability scoring | Flash | Chat, Auto-structure, Advisor-chat |
| 2 | `analyzeDocument` | Conflict Grammar entity extraction from documents | Flash | Chat (tool-call) |
| 3 | `queryConflictGraph` | Query PRAXIS knowledge graph | Flash | Chat, ARGUS |
| 4 | `draftSection` | Draft diplomatic report sections | Flash | Chat (tool-call) |
| 5 | `editForDiplomaticTone` | Two-pass UN language editing (regex + AI) | Flash | Chat (tool-call) |
| 6 | `analyzeMediaSource` | Media outlet bias/reliability assessment | Flash | Chat (tool-call) |
| 7 | `compareMediaCoverage` | Cross-source narrative comparison | Flash | Chat (tool-call) |
| 8 | `checkUNTerminology` | UN Editorial Manual compliance (30+ regex rules + AI) | Flash | Chat (tool-call) |
| 9 | `draftResolutionLanguage` | UNSC resolution language with Chapter VII patterns | Flash | Chat (tool-call) |
| 10 | `generateTalkingPoints` | Diplomat talking points with Q&A prep | Flash | Chat (tool-call) |
| 11 | `escalationAssessment` | Glasl 9-stage escalation analysis | Flash | Chat (tool-call) |
| 12 | `negotiationSpaceAnalysis` | ZOPA/BATNA Fisher-Ury mapping | Flash | Chat (tool-call) |
| 13 | `narrativeEcosystemMap` | Competing narrative landscape analysis | Flash | Chat (tool-call) |
| 14 | `historicalParallelAnalysis` | Historical conflict parallels with similarity scoring | Flash | Chat (tool-call) |
| 15 | `generateTimeline` | Structured conflict timeline with Glasl classifications | Flash | Chat (tool-call) |
| 16 | `sanctionsCheck` | Sanctions regime info (UN, OFAC, EU, UK OFSI) | Flash | Chat (tool-call) |
| 17 | `humanitarianSnapshot` | OCHA-style humanitarian situation reports | Flash | Chat (tool-call) |
| 18 | `compareConflicts` | Side-by-side 8-dimension conflict comparison | Flash | Chat (tool-call) |
| 19 | `canonicalNameLookup` | Official name resolution from authoritative sources | Flash | Chat (tool-call) |
| 20 | `deepSourceResearch` | Multi-source autonomous research (news, academic, gov) | Flash | Chat (tool-call) |
| 21 | `verifyAndStandardize` | Multi-source fact verification | Flash | Chat (tool-call) |

---

## API Routes — Full Audit

### AI Routes (34 total)

| Route | Auth | Credits | Context | Error | Status |
|-------|------|---------|---------|-------|--------|
| `ai/actor-brief` | withAuth | ai_actor_profiles (3) | buildToolContext | handleRouteError | OK |
| `ai/actor-enrichment` | withAuth | ai_actor_profiles (3) | buildToolContext | inline | OK |
| `ai/actor-profiles` | withAuth | ai_actor_profiles (3) | buildToolContext | handleRouteError | OK |
| `ai/advisor-chat` | withAuth | ai_chat (1) | buildToolContext | inline | OK |
| `ai/argus` | withAuth | ai_research (5) | N/A | inline | OK |
| `ai/auto-briefing` | withAuth | ai_auto_briefing (2) | buildToolContext | inline | OK |
| `ai/auto-structure` | withAuth | ai_research (5) | inline | inline | **FIXED v3.6** |
| `ai/briefing-generate` | withAuth | ai_briefing (3) | buildToolContext | inline | OK |
| `ai/chat` | withAuth | ai_chat (1) | buildSituationContext | handleRouteError | OK |
| `ai/claude-analyze` | withAuth | ai_claude_analyze | N/A | inline | **FIXED v3.6** |
| `ai/commitment-scan` | withAuth | ai_commitment_scan (2) | buildToolContext | inline | OK |
| `ai/deep-research` | withAuth | ai_deep_research | N/A | inline | **FIXED v3.6** |
| `ai/discover-sources` | withAuth | ai_research (5) | buildToolContext | inline | OK |
| `ai/dossier-generate` | withAuth | ai_dossier (4) | buildToolContext | inline | OK |
| `ai/escalation-scan` | withAuth | ai_risk_assessment (3) | buildToolContext | handleRouteError | OK |
| `ai/extract` | withAuth | ai_extract (3) | N/A | inline | OK |
| `ai/grounded-search` | withAuth | ai_grounded_search | N/A | inline | **FIXED v3.6** |
| `ai/info-environment` | withAuth | ai_info_environment (3) | buildToolContext | inline | OK |
| `ai/media-analyze` | withAuth | ai_media | N/A | inline | **FIXED v3.6** |
| `ai/media-roundup` | withAuth | ai_media_scan (2) | buildToolContext | inline | OK |
| `ai/media-scan` | withAuth | ai_media_scan (2) | buildToolContext | handleRouteError | OK |
| `ai/mediation` | withAuth | ai_mediation (3) | buildToolContext | inline | OK |
| `ai/mediation-design` | withAuth | ai_mediation (3) | buildToolContext | inline | OK |
| `ai/negotiation` | withAuth | ai_negotiation (3) | buildToolContext | handleRouteError | OK |
| `ai/power-map` | withAuth | ai_power_map (3) | buildToolContext | handleRouteError | OK |
| `ai/report` | withAuth | ai_report (5) | buildToolContext | handleRouteError | OK |
| `ai/research` | withAuth | ai_research (5) | N/A | handleRouteError | **FIXED v3.6** |
| `ai/resolution` | withAuth | ai_research (5) | buildToolContext | inline | OK |
| `ai/risk-assessment` | withAuth | ai_risk_assessment (3) | buildToolContext | handleRouteError | OK |
| `ai/sanctions-scan` | withAuth | ai_sanctions_scan (2) | buildToolContext | inline | OK |
| `ai/scenario` | withAuth | ai_scenario (3) | buildToolContext | handleRouteError | OK |
| `ai/talking-points` | withAuth | ai_research (5) | buildToolContext | inline | OK |
| `ai/terminology` | withAuth | ai_terminology (1) | N/A | inline | **FIXED v3.6** |
| `ai/treaty-analyze` | withAuth | ai_research (5) | buildToolContext | inline | OK |

### Data & System Routes (25 total)

| Route | Auth | Purpose |
|-------|------|---------|
| `auth/login` | Firebase | Email/password login |
| `auth/logout` | Cookie clear | Session destruction |
| `auth/session` | Cookie | Session get/set/delete |
| `cron/check-alerts` | CRON_SECRET | Daily GDELT alert scan (06:00 UTC) |
| `cron/generate-briefing` | CRON_SECRET | Daily auto-briefing (05:00 UTC) |
| `data/conflicts` | withAuth | Conflict reference data |
| `documents/[id]` | withAuth | Document detail |
| `documents/[id]/extract` | withAuth + credits | Document entity extraction |
| `documents/retrieve` | withAuth | RAG chunk retrieval |
| `documents/upload` | withAuth | Document upload (5min timeout) |
| `export` | withAuth | Full data export to ZIP |
| `graph/ingest` | withAuth | Knowledge graph entity ingestion |
| `graph/query` | withAuth | Knowledge graph query |
| `health` | Public | Health check |
| `reports` | withAuth | Report CRUD |
| `reports/[id]` | withAuth | Report detail |
| `reports/[id]/export` | withAuth | Report export (DOCX/PDF) |
| `settings/ai` | withAuth | AI settings CRUD |
| `situations` | withAuth | Situation CRUD |
| `situations/[id]` | withAuth | Situation detail |
| `sources` | withAuth | Intelligence source library |
| `stripe/checkout` | withAuth | Stripe checkout session |
| `stripe/webhook` | Stripe signature | Subscription webhook |
| `tool-data` | withAuth | Persisted tool output CRUD |

---

## Page Guard Audit

All `/app/*` pages use `useSituationGuard()` except these 3 intentional exceptions:

| Page | Reason |
|------|--------|
| `/app/settings` | User-level settings, not situation-specific |
| `/app/situations` | Redirect page — no UI to guard |
| `/app/situations/new` | Situation creation — guard would prevent entry |

---

## Fixes Applied in v3.6

| Issue | File | Fix |
|-------|------|-----|
| Missing withAuth | `api/ai/claude-analyze/route.ts` | Wrapped with `withAuth()` |
| Missing withAuth | `api/ai/deep-research/route.ts` | Wrapped with `withAuth()` |
| Missing withAuth | `api/ai/grounded-search/route.ts` | Wrapped with `withAuth()` |
| Missing withAuth | `api/ai/media-analyze/route.ts` | Wrapped with `withAuth()` |
| Missing withAuth | `api/ai/research/route.ts` | Wrapped with `withAuth()` |
| Missing withAuth | `api/ai/terminology/route.ts` | Wrapped with `withAuth()` |
| Missing credits | `api/ai/auto-structure/route.ts` | Added `checkAndDeductCredits('ai_research')` |
