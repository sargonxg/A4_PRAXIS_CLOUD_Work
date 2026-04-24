# Early Warning

**Purpose.** Escalation monitor. Shows the current Glasl stage, 7-day trend, active trigger events, and dyadic actor-pair heat.

**Methodology.** `POST /api/ai/escalation-scan` (calibrated) produces structured output validated against a Zod schema: `{ glaslStage, trend, triggers[], actorPairs[] }`. Cron `/api/cron/early-warning-refresh` runs every 6h and flags active situations as stale; the tool page reads the flag on mount and re-fetches under the authenticated user's credit budget.

**Inputs.** Graph analysis, recent episodes, ACLED + GDELT feeds, user profile (audience, language).

**Outputs.** Stage gauge (Glasl 1-9), trend sparkline, trigger list, actor-pair matrix. Persisted at `tools/early-warning`.

**Frameworks.** Glasl 9-stage escalation ladder (primary), CEWARN methodology (trigger coding), Fearon rationalist explanations for war (dyadic analysis).
