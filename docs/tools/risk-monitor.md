# Risk Monitor

**ID:** `risk-monitor`  ·  **Category:** analysis  ·  **Status:** READY

> Composite multi-dimensional risk dashboard. Combines INFORM Risk Index
> (Hazard × Vulnerability × Coping Capacity) with live ACLED/GDELT/HDX
> indicators and AI-generated narrative assessment.

## Route

- **Page:** `src/app/app/risk-monitor/page.tsx` (~789 lines, full UI)
- **API:** `POST /api/ai/risk-assessment`
- **Sidebar:** Analysis

## Inputs (read)

### From `AnalystProfile`

| Field | Usage |
|---|---|
| `identity.role` | Risk-tolerance framing (humanitarian leans on protection risks; private-sector leans on operational risk) |
| `perspective.lenses` | Reweights the radar chart axes |
| `perspective.audience` | Final narrative tone |
| `workingStyle.analyticalStyle` | Rapid brief vs. deep-dossier output shape |

### From the active `Situation`

| Field | Usage |
|---|---|
| `name`, `region`, `actors` | System prompt context |
| `riskScore` | Seeds the gauge before AI re-runs |
| `glaslStage` | Cross-references escalation level |
| `domain` | Domain-specific risk model selection |

### Live feeds

- **ACLED** — fatality counts, event-type distribution
- **GDELT** — instability index, tone shifts (Z-score anomaly detection)
- **HDX HAPI** — IPC food-security phases, displacement figures
- **World Bank WGI** — governance indicators (rule of law, gov
  effectiveness, corruption)
- **UNHCR** — refugee/IDP figures

## Outputs (persist)

- **Firestore:** `users/{uid}/situations/{sitId}/tools/risk-assessment`
  (via `saveToolOutput`)
- **Schema:** `RiskAssessmentSchema` —
  `{ overallScore, hazard, vulnerability, copingCapacity, dimensions[],
  narrative, recommendations[], sources[] }`
- **Pub/Sub:** none currently. Future: publish to a `risk.events` topic
  so Alerts and Briefing tools can react.

## Frameworks

- **INFORM Risk Index (IASC, 2024)** — geometric mean
  (H × V × C)^(1/3), normalised 0–10.
- **Glasl 9-stage Escalation Model** — referenced in the narrative
  generator.
- **Galtung ABC Conflict Triangle** — referenced when domain is
  `armed-conflict-security` or `human-rights`.

## Data sources

- ACLED, GDELT, HDX HAPI, World Bank, UNHCR — all via
  `getSituationIntelligence()` in
  `src/lib/data-feeds/feed-aggregator.ts`.

## AI model

- **Tier:** `getProModel()` (`gemini-3.1-pro-preview`) for the
  structured output.
- **Why:** Risk assessment requires reliable schema adherence across
  multiple nested dimensions.

## UX behaviour

- `useSituationGuard()` at the top.
- `usePersistedToolData('risk-assessment', situationId)` hot-hydrates
  the gauge + radar from cache before the new run completes.
- Manual "Regenerate" button + automatic regeneration on situation
  switch.
- Visualisations: `RiskGauge` (composite), `RadarChart` (5
  dimensions), `TornadoChart` (sensitivity), `TimeSeriesChart`
  (trend).

## Extension surface

- **Add a risk dimension:** extend `RiskAssessmentSchema.dimensions`,
  add a chart in the page.
- **Add a domain-specific risk model:** add an entry under
  `config/domains/{id}.frameworks` so the system prompt picks it up
  via `<domain-frame>`.

## Operations

- **Required env vars:** `GOOGLE_AI_API_KEY` (or Vertex AI ADC).
- **Recommended:** `ACLED_API_KEY` + `ACLED_EMAIL` for precise
  fatality counts (degrades gracefully without).
- **Stale-after:** 24h.
- **Cost:** 3 credits per regeneration.
- **Common failures:** ACLED rate-limit during peak windows; falls
  back to GDELT-only signal.

## Open questions / TODO

- Domain-specific risk weighting (e.g., `humanitarian` domain should
  weight food-security higher than fatality counts).
- Cross-situation risk comparison (Stream F-2).
- Real-time alerting when score crosses thresholds (depends on
  Pub/Sub topic).
