# {{Tool Name}}

**ID:** `{{tool-id}}`  ·  **Category:** {{context|analysis|drafting|simulation|intelligence|workspace}}  ·  **Status:** {{READY|PARTIAL|PLACEHOLDER|HIDDEN}}

> One-line elevator: what this tool does for the analyst.

## Route

- **Page:** `src/app/app/{{tool-id}}/page.tsx`
- **API:** `POST /api/ai/{{api-route}}` — `src/app/api/ai/{{api-route}}/route.ts`
- **Sidebar:** {{section}}

## Inputs (read)

### From `AnalystProfile` (via `withCalibration`)

| Field | How it shapes the output |
|---|---|
| `identity.role` | … |
| `perspective.audience` | … |
| `perspective.lenses` | … |
| `workingStyle.language` | … |
| `workingStyle.redLines` | … |

### From the active `Situation`

| Field | Usage |
|---|---|
| `name` | Header / system prompt |
| `region` | … |
| `domain` | Domain-specific framework selection |
| `actors` | … |
| `glaslStage` | … |
| `riskScore` | … |

### From SKC layers

- **Graph layer:** … (e.g. "queries `users/{uid}/situations/{sitId}/graph/main` for the actor list")
- **Vector layer:** … (e.g. "768-dim KNN against situation embeddings")
- **Feed layer:** … (e.g. "source-linked event reporting events for the last 90 days, web tone series")
- **Tool-output layer:** … (e.g. "previous risk-assessment + early-warning outputs")

## Outputs (persist)

- **Firestore:** `users/{uid}/situations/{sitId}/tools/{{tool-id}}` (via `saveToolOutput`)
- **Pub/Sub:** {{topic name or "none"}}
- **Schema:** `{{ZodSchemaName}}` in `src/lib/ai/schemas/...`

## Frameworks

- {{Framework 1 + academic citation}}
- {{Framework 2}}

## Data sources

- {{source-linked event reporting|grounded search|displacement reporting|humanitarian data|humanitarian web reporting|official multilateral news|economic institution|source-linked event reporting|security research|expert conflict analysis|Firecrawl|Grounded Search}} — what this tool actually pulls from each

## AI model

- **Tier:** `{{getModel|getProModel|getAnalysisModel|getDeepThinkModel|getGroundedModel|Vertex ADK}}`
- **Why this tier:** …
- **Fallback chain when env vars missing:** …

## UX behaviour

- Hot read on mount via `usePersistedToolData('{{tool-id}}', situationId)` — yes/no
- `useSituationGuard` — yes (guards missing situations and incomplete onboarding as needed)
- Empty state — what the user sees before first generation
- Re-generation — manual button / auto on situation change / cron-driven

## Extension surface

- **Add a new domain override:** edit `src/lib/constants/domains/{domain}.ts` then re-seed
- **Add a new framework:** add it to the relevant domain/tool configuration and reference it from the system prompt builder
- **Add a new data source:** create client in `src/lib/data-feeds/`, register in `feed-aggregator.ts`, then call from this route's handler

## Operations

- **Required env vars:** …
- **Optional env vars:** …
- **Cost characteristics:** …
- **Stale-after:** {{N}} hours (from registry `staleAfterHours`)
- **Common failure modes:** …

## Open questions / TODO

- …
