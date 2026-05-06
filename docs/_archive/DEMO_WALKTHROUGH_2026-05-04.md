# PRAXIS demo walkthrough — 2026-05-04

Three first-class demo templates land in the cockpit. The same eight sidebar
sections work for every desk; the templates demonstrate that one toolset
covers international conflict, sovereign / political risk, and domestic policy
analysis without rebuilding the workspace.

## Information architecture

Sidebar matches the target documented in
`docs/PRAXIS_PRODUCT_SIMPLIFICATION_2026-05-03.md`:

1. Desk
2. Context
3. Library
4. Research
5. Graph
6. Boardroom
7. Draft
8. Specialist Tools

Cockpit at `/app/cockpit` is the home. App index redirects there. Sidebar logo
points at it. Workspace selector shows real workspaces and the three demo
templates. Sidebar links preserve `?case=<id>` so the case sticks across
navigation.

## Three demo templates

| id | Lens | Region | Persona | Default route |
|---|---|---|---|---|
| `syria` | International conflict + diplomacy | Syrian Arab Republic | UN-NY desk · peace and security | `/cockpit?case=syria` |
| `pakistan-political-risk` | Sovereign / political risk | Islamic Republic of Pakistan | Sovereign / political risk analyst | `/desks/political-risk?case=pakistan-political-risk` |
| `us-housing` | Domestic policy | United States · multi-state | Domestic policy analyst · housing portfolio | `/desks/us-housing?case=us-housing` |

Registry: `src/lib/constants/demo-templates.ts`.

Pakistan and US-Housing seed data: `src/lib/constants/cases/{pakistan-political-risk,us-housing}.ts`.

Each non-Syria template ships:

- 11–13 situation stakeholders (with Mitchell-Agle-Wood scores, position,
  interests, leverage, constraints)
- 5 office-side stakeholders (your team's principals, compliance, comms,
  counsel, junior research)
- 5 documents (real publishers, real landing-page URLs)
- 12 sources (multilateral · think-tank · national / local media · industry)
- 8 media outlets (positioned on the media-compass canvas)
- 11-event timeline through May 2026
- KPIs and a briefing title

Helper: `resolveCaseTemplate(caseParam)` returns the template; null for Syria
or unknown.

## Recording walkthrough — 10 URLs

1. `https://praxis.tacitus.me/app/cockpit` — homepage. Three templates, four
   product questions, paths-by-analyst-type, all eight tool sections.
2. `https://praxis.tacitus.me/app/cockpit?case=syria` — pick Syria template.
   Sticky case context propagates through the sidebar.
3. `https://praxis.tacitus.me/app/stakeholder-map?case=syria` — graph map with
   dark backdrop, decorative high-salience edges, full Syria stakeholder set.
4. `https://praxis.tacitus.me/app/cockpit?case=pakistan-political-risk` —
   pivot lens to Pakistan political risk.
5. `https://praxis.tacitus.me/app/stakeholder-map?case=pakistan-political-risk`
   — Situation / Office tab toggle, richer side card with position, interests,
   leverage, constraints.
6. `https://praxis.tacitus.me/app/media-compass?case=pakistan-political-risk`
   — eight Pakistan outlets in gold next to the 32-outlet baseline.
7. `https://praxis.tacitus.me/app/cockpit?case=us-housing` — pivot to
   domestic policy.
8. `https://praxis.tacitus.me/app/desks/us-housing?case=us-housing` — full
   domestic desk page with KPIs and walkthrough nav.
9. `https://praxis.tacitus.me/app/library?case=us-housing` — case documents
   section in gold above workspace artifacts.
10. `https://praxis.tacitus.me/app/editor?case=us-housing` — case-seeded
    draft, case-aware research prompts, Library sidebar with one-click
    citation insert.

## Validation gate

```
npx tsc --noEmit                  # clean
npm run build                     # ✓ Compiled successfully
node scripts/audit-ai-routes.mjs  # 62/62 calibrated, 5 exempt
npx vitest run                    # 485 pass, 7 pre-existing failures unchanged
```

## Deploy

```
gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus
```

Watches: `https://praxis.tacitus.me/`, `/login`, `/app/cockpit`, `/api/health`.
