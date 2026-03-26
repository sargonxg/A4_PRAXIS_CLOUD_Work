# PRAXIS Tool Page Audit

Generated: 2026-03-25

## Legend

- **Guard**: `useSituationGuard()` + `NoSituationState` fallback
- **Persistence**: `AiPopulate` wrapper or `usePersistedToolData` hook
- **API Route**: Primary API endpoint exists at expected path
- **withAuth**: API route uses `withAuth()` wrapper
- **Credits**: `checkAndDeductCredits` called in API route
- **Status**: Working / Partial / Broken

## Audit Results

| # | Tool | Guard | Persistence | API Route | withAuth | Credits | Status |
|---|------|-------|-------------|-----------|----------|---------|--------|
| 1 | actors | Yes | AiPopulate | `/api/ai/actor-profiles` | Yes | Yes | Working |
| 2 | advisory | Yes | None (chat-based, stateless) | `/api/ai/advisor-chat` | Yes | Yes | Working |
| 3 | alerts | Yes | None (reads `useNotificationStore`) | N/A (no AI route) | N/A | N/A | Working |
| 4 | argus | Yes | AiPopulate | `/api/ai/argus` + `/api/ai/deep-research` | Yes | Yes | Working |
| 5 | auto-briefings | Yes | AiPopulate | `/api/ai/auto-briefing` | Yes | Yes | Working |
| 6 | briefing | Yes | AiPopulate | `/api/ai/briefing-generate` | Yes | Yes | Working |
| 7 | calendar | Yes | usePersistedToolData | `/api/ai/chat` | Yes | Yes | Working |
| 8 | cases | Yes | None (reads `useSituationStore`) | N/A (situation browser) | N/A | N/A | Working |
| 9 | commitments | Yes | AiPopulate | `/api/ai/commitment-scan` | Yes | Yes | Working |
| 10 | compare | Yes | None (chat-based comparison) | `/api/ai/chat` | Yes | Yes | Working |
| 11 | concordia | Yes | None (chat-based mediation) | `/api/ai/mediation` | Yes | Yes | Working |
| 12 | conflict-graph | Yes | usePersistedToolData | `/api/ai/extract` | Yes | Yes | Working |
| 13 | dashboard | Yes | None (reads `useSituationStore`) | `/api/ai/chat` | Yes | Yes | Working |
| 14 | dossier | Yes | AiPopulate | `/api/ai/dossier-generate` | Yes | Yes | Working |
| 15 | early-warning | Yes | AiPopulate | `/api/ai/risk-assessment` | Yes | Yes | Working |
| 16 | info-environment | Yes | AiPopulate | `/api/ai/info-environment` | Yes | Yes | Working |
| 17 | media-compass | Yes | usePersistedToolData | `/api/ai/media-scan` + `/api/ai/deep-research` | Yes (media-scan) | Yes | Working |
| 18 | media-roundup | Yes | usePersistedToolData | `/api/ai/media-roundup` | Yes | Yes | Working |
| 19 | mediation-design | Yes | AiPopulate | `/api/ai/mediation-design` | Yes | Yes | Working |
| 20 | negotiation-prep | Yes | AiPopulate | `/api/ai/negotiation` | Yes | Yes | Working |
| 21 | risk-monitor | Yes | AiPopulate | `/api/ai/risk-assessment` | Yes | Yes | Working |
| 22 | sanctions | Yes | AiPopulate | `/api/ai/sanctions-scan` | Yes | Yes | Working |
| 23 | scenarios | Yes | AiPopulate + usePersistedToolData | `/api/ai/scenario` | Yes | Yes | Working |
| 24 | stakeholder-map | Yes | usePersistedToolData | `/api/ai/power-map` | Yes | Yes | Working |
| 25 | talking-points | Yes | usePersistedToolData | `/api/ai/talking-points` | Yes | Yes | Working |
| 26 | treaty-analyzer | Yes | AiPopulate | `/api/ai/treaty-analyze` | Yes | Yes | Working |
| 27 | un-toolkit | Yes | None (interactive builder) | `/api/ai/resolution` + `/api/ai/terminology` + `/api/ai/chat` | Yes | Yes | Working |

## Summary

- **Working**: 27 / 27
- **Partial**: 0 / 27
- **Broken**: 0 / 27

All 27 tool pages have `useSituationGuard()` and `NoSituationState` properly wired.

## Notes

- **alerts**: Not an AI tool. Reads from `useNotificationStore` (populated by cron job at `/api/cron/check-alerts`). No persistence or AI route needed.
- **cases**: Not an AI tool. Situation browser using `useSituationStore`. No persistence or AI route needed.
- **advisory**: Chat-based tool (stateless per session). Uses `/api/ai/advisor-chat` with streaming. No persistence needed by design.
- **compare**: Chat-based comparison tool. Uses `/api/ai/chat` with streaming. No persistence needed by design.
- **concordia**: Chat-based mediation tool. Uses `/api/ai/mediation`. No persistence needed by design.
- **dashboard**: Reads situation data from store. Chat features use `/api/ai/chat`. No AiPopulate needed.
- **un-toolkit**: Interactive UN resolution builder. Multiple AI endpoints for different features. No AiPopulate needed.
- **buildToolContext**: All routes marked "Yes" for withAuth also use `buildToolContext`. Routes missing withAuth also lack buildToolContext (argus, extract, mediation, commitment-scan, resolution, terminology, treaty-analyze).
- **Credits**: All AI routes call `checkAndDeductCredits`. No credit leaks found.
