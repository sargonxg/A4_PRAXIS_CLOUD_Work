# Dashboard

**ID:** `dashboard`  ·  **Category:** context  ·  **Status:** READY

> First-touch overview hub. Six widgets: Risk Gauge, Escalation, Recommended
> Tools (role-aware), Advisors, Recent Tool Runs, Feed Alerts. Optional
> "Generate daily read" button fires a synthesised Markdown briefing.

## Route

- **Page:** `src/app/app/dashboard/page.tsx`
- **API (optional):** `POST /api/ai/dashboard-summary`
- **Sidebar:** Situation (top of nav)

## Inputs (read)

### From `AnalystProfile`

| Field | Usage |
|---|---|
| `identity.role` | Drives the Recommended-for-you widget via `recommendToolsForRole()` |
| `perspective.primaryDomain` | Boost factor in tool recommendations when situation domain is `generic` |
| `perspective.audience` | (TODO: feed into the Daily Read tone preset — Stream A Day 2) |
| `workingStyle.language` | (TODO: feed into Daily Read language directive) |

### From the active `Situation`

| Field | Usage |
|---|---|
| `name` | Header title |
| `region` | Header breadcrumb |
| `domain` | Boost in recommended tools; subtitle of Recommended widget |
| `id` | Cache key for situation-scoped reads |
| `riskScore`, `glaslStage`, `escalationTrend` | Risk Gauge + Escalation widgets |
| `graphEntities`, `documentCount` | Empty-state nudge gating |

### From SKC layers

- **Tool-output layer:** Recent-Tools widget reads from
  `/api/situations/{id}/recent-tools?limit=5`
- **Feed layer:** Feed-Alerts widget reads from
  `/api/situations/{id}/feed-alerts?region={region}`

## Outputs (persist)

- **Firestore:** Daily-Read output goes to
  `users/{uid}/situations/{sitId}/tools/dashboard-summary` when generated.
- **Pub/Sub:** none.

## Frameworks

- **INFORM Risk Index** (Hazard × Vulnerability × Coping Capacity)
- **Glasl 9-stage Escalation Model**

## Data sources

- source-linked event reporting, grounded search, humanitarian web reporting, humanitarian data APIs for the underlying widgets via SKC

## AI model

- **Tier:** Gemini Flash (`getModel()`) for the Daily Read.
- **Why:** The dashboard summary is short, fast, frequently refreshed.

## UX behaviour

- `useSituationGuard()` at top: if no situation → `<NoSituationState />`,
  if onboarding incomplete → `<OnboardingRequiredState />`.
- Sample mode shows the rich legacy SituationDashboard with the selected situation data.
- Recommended-for-you widget reorders for the user — domain boost when the
  active situation has a non-generic domain.

## Extension surface

- **Add a widget:** create `src/components/dashboard/<name>-widget.tsx`,
  copy the WidgetShell pattern, slot into the grid in `page.tsx`.
- **Tune role recommendations:** edit
  `src/lib/dashboard/role-recommendations.ts` — add roles, tools, or domain
  boosts.
- **Add a domain-specific Daily Read tone:** extend the system prompt in
  `src/app/api/ai/dashboard-summary/route.ts` with a domain branch.

## Operations

- **Required env vars:** `GOOGLE_AI_API_KEY` for Daily Read; rest of the
  dashboard works without any keys.
- **Stale-after:** 24h.
- **Cost characteristics:** 1 credit per Daily Read invocation.

## Open questions / TODO

- Stream A Day 2: audience + language tuning of the Daily Read.
- Stream A Day 4: inject the same role-aware ranking into the sidebar so
  the user sees their top tools in the nav too.
