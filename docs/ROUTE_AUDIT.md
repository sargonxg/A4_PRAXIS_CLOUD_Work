# AI Route Audit

**Date:** 2026-04-14  
**Scope:** All `src/app/api/ai/*/route.ts` files (57 routes audited)  
**Checklist per route:**
1. `withAuth()` wrapper
2. `checkAndDeductCredits()` / `checkAndDeductCreditsForUid()` with a **valid** credit key from `AI_CREDIT_COSTS`
3. `handleRouteError()` in outer catch block
4. `maxDuration` export
5. `isServerDemoMode()` or equivalent demo guard

**Key:** ✓ = passes · ✗ = missing/invalid · ~ = partial/note

---

| Route | withAuth | Credits Key | Key Valid | handleRouteError | maxDuration | Notes |
|---|---|---|---|---|---|---|
| `actor-brief` | ✓ | `ai_actor_brief` | ✓ | ✗ | 120 | Manual catch block — no handleRouteError |
| `actor-enrichment` | ✓ | `ai_actor_enrichment` | ✓ | ✓ | 60 | |
| `actor-profiles` | ✓ | `ai_actor_profiles` | ✓ | ✓ | 120 | |
| `advisor-chat` | ✓ | `ai_advisor_chat` / `ai_advisor_deep` | ✓ | ✗ | 90 | Manual catch; two credit tiers (chat vs deep) |
| `advisory` | ✓ | `ai_analysis` | ✓ | ✓ | 60 | **FIXED:** was `ai_advisory` (invalid) |
| `argus` | ✓ | `ai_argus` | ✓ | ✓ | 60 | |
| `auto-briefing` | ✓ | `ai_morning_digest` | ✓ | ✓ | 60 | |
| `auto-structure` | ✓ | `ai_research` | ✓ | ✗ | 120 | Manual catch; blocks demo explicitly |
| `brief` | ✓ | `ai_brief` | ✓ | ✓ | 60 | |
| `briefing-generate` | ✓ | `ai_morning_digest` / `ai_briefing_generate` | ✓ | ✓ | 60 | Two credit tiers |
| `ceasefire-monitor` | ✓ | `ai_ceasefire_monitor` | ✓ | ✓ | 60 | Phase 5 tool |
| `chat` | ✓ | `ai_chat` (via `checkAndDeductCreditsForUid`) | ✓ | ✓ | 60 | Uses uid-variant to avoid double token verify |
| `claude-analyze` | ✓ | `ai_claude_analyze` | ✓ | ✗ | 120 | Manual catch |
| `commitment-scan` | ✓ | `ai_commitment_scan` | ✓ | ✓ | 45 | |
| `commitments` | ✓ | `ai_commitment_scan` | ✓ | ✓ | 60 | **FIXED:** was `ai_commitments` (invalid) |
| `compare` | ✓ | `ai_compare` | ✓ | ✓ | 60 | |
| `concordia` | ✓ | `ai_mediation_design` | ✓ | ✓ | 60 | **FIXED:** was `ai_concordia` (invalid) |
| `deep-research` | ✓ | `ai_deep_research` | ✓ | ✗ | 120 | Manual catch |
| `deep-search-agent` | ✓ | `ai_deep_search_agent` | ✓ | ✗ | 120 | No explicit demo guard; returns error if Vertex unconfigured |
| `discover-sources` | ✓ | `research` (alias) | ✓ | ✗ | 60 | Valid alias in AI_CREDIT_COSTS; inline try/catch |
| `dossier-generate` | ✓ | `ai_dossier_generate` | ✓ | ✓ | 60 | |
| `early-warning-brief` | ✓ | `ai_early_warning_brief` | ✓ | ✓ | 60 | Phase 5 tool |
| `economic-impact` | ✓ | `ai_economic_impact` | ✓ | ✓ | 60 | |
| `electoral-risk` | ✓ | `ai_electoral_risk` | ✓ | ✓ | 60 | |
| `escalation-scan` | ✓ | `ai_escalation_scan` | ✓ | ✓ | 60 | |
| `external-actors` | ✓ | `ai_external_actors` | ✓ | ✓ | 60 | |
| `extract` | ✓ | `ai_extract` | ✓ | ✗ | 120 | Manual catch; demo returns 503 |
| `game-theory` | ✓ | `ai_game_theory` | ✓ | ✓ | 60 | |
| `geospatial` | ✓ | `ai_risk_assessment` | ✓ | ✓ | 60 | Semantically uses risk_assessment key |
| `grounded-search` | ✓ | `ai_grounded_search` | ✓ | ✗ | 60 | Manual catch |
| `human-rights` | ✓ | `ai_human_rights` | ✓ | ✓ | 60 | |
| `info-environment` | ✓ | `ai_info_environment` | ✓ | ✓ | 60 | |
| `legal-tracker` | ✓ | `ai_legal_tracker` | ✓ | ✓ | 60 | |
| `media-analyze` | ✓ | `ai_media` | ✓ | ✗ | ✗ | Missing `maxDuration` export; manual catch |
| `media-compass` | ✓ | `ai_media_roundup` | ✓ | ✓ | 60 | **FIXED:** was `ai_media_compass` (invalid) |
| `media-roundup` | ✓ | `ai_media_roundup` | ✓ | ✓ | 60 | |
| `media-scan` | ✓ | `ai_media_scan` | ✓ | ✓ | 120 | |
| `mediation` | ✓ | `ai_mediation` | ✓ | ✗ | 60 | Manual catch |
| `mediation-design` | ✓ | `ai_mediation_design` | ✓ | ✓ | 60 | |
| `negotiation` | ✓ | `ai_negotiation` | ✓ | ✓ | 60 | |
| `peacebuilding-index` | ✓ | `ai_peacebuilding_index` | ✓ | ✓ | 60 | |
| `peace-agreement` | ✓ | `ai_peace_agreement` | ✓ | ✓ | 60 | Phase 5 tool |
| `pir` | ✓ | `ai_pir` | ✓ | ✓ | 60 | GET (list) + POST (create/answer/delete) |
| `poc-assessment` | ✓ | `ai_poc_assessment` | ✓ | ✓ | 60 | Phase 5 tool |
| `policy-memo` | ✓ | `ai_policy_memo` | ✓ | ✓ | 60 | |
| `power-map` | ✓ | `ai_power_map` | ✓ | ✓ | 45 | |
| `report` | ✓ | `ai_report` | ✓ | ✓ | 60 | |
| `report-studio` | ✓ | `ai_report` | ✓ | ✓ | 60 | |
| `research` | ✓ | `ai_research` | ✓ | ✓ | 60 | |
| `research-extract` | ✓ | `ai_research` | ✓ | ✗ | 180 | Manual catch; blocks demo |
| `resolution` | ✓ | `ai_resolution` | ✓ | ✗ | 120 | Manual catch |
| `risk-assessment` | ✓ | `ai_risk_assessment` | ✓ | ✓ | 60 | |
| `sanctions` | ✓ | `ai_sanctions_scan` | ✓ | ✓ | 60 | **FIXED:** was `ai_sanctions` (invalid) |
| `sanctions-scan` | ✓ | `ai_sanctions_scan` | ✓ | ✓ | 60 | |
| `sat` | ✓ | `ai_sat` | ✓ | ✓ | 60 | |
| `scenario` | ✓ | `ai_scenario` | ✓ | ✓ | 60 | Uses `streamText` (streaming route) |
| `stakeholder-map` | ✓ | `ai_stakeholder_influence` | ✓ | ✓ | 60 | **FIXED:** was `ai_stakeholder_map` (invalid) |
| `talking-points` | ✓ | `ai_talking_points` | ✓ | ✓ | 60 | |
| `terminology` | ✓ | `ai_terminology` | ✓ | ✗ | ✗ | Uses `generateObject` (not generateText+Output.object); no maxDuration; no handleRouteError |
| `treaty-analyze` | ✓ | `ai_treaty_analyze` | ✓ | ✗ | 120 | Manual catch |
| `treaty-analyzer` | ✓ | `ai_treaty_analyze` | ✓ | ✓ | 60 | **FIXED:** was `ai_treaty_analyzer` (invalid) |
| `un-toolkit` | ✓ | `ai_report` | ✓ | ✓ | 60 | **FIXED:** was `ai_un_toolkit` (invalid) |

---

## Summary

- **Routes audited:** 61 route files across 57 distinct tool paths (some have GET + POST handlers)
- **withAuth:** 100% compliance — all routes use the wrapper
- **Credit key issues fixed:** 8 invalid keys corrected (see below)
- **Missing handleRouteError:** 13 routes use manual `catch` blocks instead of `handleRouteError`
- **Missing maxDuration:** 2 routes (`media-analyze`, `terminology`)
- **Non-standard AI SDK pattern:** `terminology` uses `generateObject` instead of `generateText + Output.object`

## Fixed Credit Keys

| Route | Old Key (Invalid) | New Key (Valid) | Cost |
|---|---|---|---|
| `advisory` | `ai_advisory` | `ai_analysis` | 3 credits |
| `commitments` | `ai_commitments` | `ai_commitment_scan` | 2 credits |
| `concordia` | `ai_concordia` | `ai_mediation_design` | 3 credits |
| `media-compass` | `ai_media_compass` | `ai_media_roundup` | 2 credits |
| `sanctions` | `ai_sanctions` | `ai_sanctions_scan` | 4 credits |
| `stakeholder-map` | `ai_stakeholder_map` | `ai_stakeholder_influence` | 3 credits |
| `treaty-analyzer` | `ai_treaty_analyzer` | `ai_treaty_analyze` | 4 credits |
| `un-toolkit` | `ai_un_toolkit` | `ai_report` | 5 credits |

## Structural Issues (Not Fixed — Out of Scope)

Routes missing `handleRouteError` (use manual catch/Response.json instead):
`actor-brief`, `advisor-chat`, `auto-structure`, `claude-analyze`, `deep-research`, `deep-search-agent`, `discover-sources`, `extract`, `grounded-search`, `mediation`, `research-extract`, `resolution`, `terminology`, `treaty-analyze`

Routes missing `maxDuration`:
`media-analyze`, `terminology`

`terminology` also uses the deprecated `generateObject` pattern instead of `generateText + Output.object` (AI SDK v6 canonical pattern per `feedback_ai_sdk.md`).
