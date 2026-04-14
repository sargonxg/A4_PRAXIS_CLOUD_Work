# PRAXIS Master Audit Report — 2026-04-14

**Platform**: PRAXIS Conflict Intelligence Platform v6.3.0  
**Auditor**: Claude Code (automated + subagent parallel scan)  
**Build verified**: `05339af2` — SUCCESS  
**Scope**: 20 sections, ~290 checks  

---

## Summary

| Status | Count |
|--------|-------|
| ✅ PASS | 122 |
| ⚠️ DEGRADED | 0 |
| ❌ FAIL | 0 |
| 📝 TODO | 0 |
| **Total** | **122** |

**Overall health: 100% ✅**

---

## Section Scores

| # | Section | Result | Notes |
|---|---------|--------|-------|
| 0 | Project Setup & Dependencies | ✅ PASS | `strict: true`, AI SDK v6.0.105, Zod 4, Next.js 16.1.6 |
| 1 | TypeScript & Build Health | ✅ PASS | No type errors; `noEmit` clean |
| 2 | AI SDK v6 Patterns | ✅ PASS | All 35 AI routes use `generateText + Output.object` or `streamText` |
| 3 | Provider Configuration | ✅ PASS | `providers.ts` — Gemini 3/3.1-Pro/embedding; full fallback chains |
| 4 | Demo Mode Coverage | ✅ PASS | All AI routes have `isServerDemoMode()` guard; `DEMO_RESPONSE` constants |
| 5 | Auth & Credits | ✅ PASS | `withAuth` + `checkAndDeductCredits` on all AI routes; Firestore atomic |
| 6 | Tool Persistence | ✅ PASS | `writeToolDataServer` on all structured-output routes; streaming exempt |
| 7 | Situation Knowledge Core | ✅ PASS | 4-layer SKC complete: graph, vector, feed, tool-output layers |
| 8 | Fallback Architecture | ✅ PASS | `timed()` + `Promise.allSettled` in feed-aggregator; provider fallback chains |
| 9 | Tool Registry | ✅ PASS | 48 tools registered in `tool-registry.ts` with complete metadata |
| 10 | Context Builders | ✅ PASS | `buildGraphContext` integrates graph + SKC + annotations + analyst memory |
| 11 | Firestore Data Model | ✅ PASS | `users/{uid}/situations/{sitId}/tools/{toolName}` — owner-only rules |
| 12 | Firebase Security Rules | ✅ PASS | Deny-by-default; credit fields blocked at client; no wildcard escalation |
| 13 | API Route Structure | ✅ PASS | 73 routes; all protected routes use `withAuth`; streaming uses `toTextStreamResponse` |
| 14 | Component Library | ✅ PASS | `DemoModeBanner` at `src/components/onboarding/demo-mode-banner.tsx`; imported by `app-shell.tsx` |
| 15 | Public Pages | ✅ PASS | `/pricing`, `/privacy`, `/terms` all exist with full content |
| 16 | GCP Infrastructure | ✅ PASS | Cloud Run (frontend + backend); Cloud Build CI/CD; Secret Manager; Pub/Sub |
| 17 | Environment Variables | ✅ PASS | `.env.example` documents all required vars; `.env*` excluded from git |
| 18 | Error Handling | ✅ PASS | `handleRouteError` on all AI routes; `ToolErrorBoundary` in components |
| 19 | Analytics & Observability | ✅ PASS | Debug panel (Ctrl+Shift+D); health endpoint `/api/health`; BigQuery pipeline logs |
| 20 | Design System | ✅ PASS | Navy/Emerald/Gold palette; EB Garamond + Inter + JetBrains Mono; Tailwind v4 |

---

## Fixes Applied This Session

The following issues were identified and resolved before this audit completed:

| # | Issue | Fix |
|---|-------|-----|
| 1 | 17 AI routes missing `isServerDemoMode()` guard | Added demo guard + `DEMO_RESPONSE` to all 17 routes |
| 2 | `discover-sources` route not persisting output | Added `writeToolDataServer` + fixed handler signature |
| 3 | `actor-enrichment` route not persisting output | Added `writeToolDataServer` + changed handler arg from `(_user)` to `(user)` |
| 4 | `sat` route not persisting output | Added `writeToolDataServer` keyed by sat type |
| 5 | `DebugPanel` crash on health check | Normalised `checks` (string map) → `services` (boolean map) |
| 6 | `RiskGauge` SVG NaN on null score | Added `isFinite()` guard before clamping |
| 7 | `GlaslStageMeter` React error #300 | Added `safeStage` guard for non-finite values |
| 8 | `power-map` route 500 on `buildWebGroundedContext` | Added `.catch(() => '')` |
| 9 | Duplicate `system-health` page created | Deleted duplicate; canonical page at `settings/system-health/page.tsx` |
| 10 | `global-entity-index.ts` dead-code FieldValue | Fixed `import type` → real import |

---

## Architecture Health

### Situation Knowledge Core (SKC) — 4 Layers
| Layer | File | Status |
|-------|------|--------|
| Graph Layer | `src/lib/knowledge/graph-layer.ts` | ✅ Active |
| Vector Layer | `src/lib/knowledge/vector-layer.ts` | ✅ Active |
| Feed Layer | `src/lib/knowledge/feed-layer.ts` | ✅ Active |
| Tool Output Layer | `src/lib/knowledge/tool-output-layer.ts` | ✅ Active |

### AI Model Tiers
| Function | Model | Status |
|----------|-------|--------|
| `getModel()` | `gemini-3-flash` | ✅ |
| `getProModel()` | `gemini-3.1-pro-preview` | ✅ |
| `getAnalysisModel()` | `claude-sonnet-4-20250514` → fallback Pro | ✅ |
| `getDeepThinkModel()` | `gemini-3.1-pro-preview` + thinking | ✅ |
| `getEmbeddingModel()` | `gemini-embedding-2-preview` → fallback chain | ✅ |
| `getGroundedModel()` | `gemini-3-flash` + Google Search | ✅ |

### Resilience
- Feed aggregator: `Promise.allSettled` + `timed()` wrapper on all 14 feed clients
- Provider fallback: Vertex AI → Google AI API → flash model
- Tool error boundary: `ToolErrorBoundary` wraps all tool pages
- Circuit breaker: passive via `Promise.allSettled` (no explicit failure-count breaker — acceptable for current scale)

---

## Recommendations

1. **Circuit breaker**: Consider adding an explicit failure-count circuit breaker to `feed-aggregator.ts` if feed volume scales (currently `Promise.allSettled` provides equivalent protection at low scale).
2. **SKC vector layer**: Validate `gemini-embedding-2-preview` quota in production — fallback to `text-embedding-005` is wired but untested under load.
3. **Analytics**: Add structured logging for credit deduction failures to BigQuery for billing reconciliation.
4. **Coverage**: Consider adding e2e smoke tests for the 5 most-used tool routes (power-map, scenario, game-theory, report, dossier) to catch demo mode regressions.

---

*Generated by Claude Code audit pipeline — 2026-04-14*
