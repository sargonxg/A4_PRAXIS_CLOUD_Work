# Information Environment

**Purpose.** Monitors the narrative landscape around a situation — narrative clusters, disinformation flags, sentiment trend.

**Methodology.** `POST /api/ai/info-environment` (calibrated) combines:
- GDELT grounded-search queries weighted by `domain.preferredFeeds`
- Narrative clustering (semantic similarity over retrieved article titles + leads)
- Disinfo detection heuristics (source reputation, contradictory-claim flags, botnet signatures)
- 30-day sentiment trend aggregated from GDELT tone scores

**Inputs.** Situation metadata, user preferences (language for retrieved articles), feed layer (GDELT-primary, ReliefWeb-secondary).

**Outputs schema.**
```ts
{
  clusters: [{ label, growthRate, sampleArticles[], dominantFraming }],
  disinfoFlags: [{ claim, reason, confidence, sources[] }],
  sentimentTrend: [{ date, score, volume }],
}
```

Persisted at `tools/info-environment`.

**Frameworks.** Galtung cultural-violence triangle (narrative framing), Stedman spoiler narrative dynamics, information-operations taxonomy (DFRLab-style).
