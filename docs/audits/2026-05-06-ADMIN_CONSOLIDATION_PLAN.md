# Admin Consolidation Plan

Date: 2026-05-06

Current admin routes:

| Route | Current state | Canonical target |
|---|---|---|
| `/app/admin` | Admin index and control panel | Keep as canonical admin home |
| `/app/admin/diagnostics` | Real diagnostics probes | Future `/app/admin?tab=diagnostics` |
| `/app/admin/users` | User/credit management | Future `/app/admin?tab=users` |
| `/app/admin/domains` | Domain taxonomy tuning | Future `/app/admin?tab=domains` |
| `/app/admin/operator-console` | Jobs/runs/events | Future `/app/admin?tab=operator` |
| `/app/admin/advisors` | Advisor configuration | Future `/app/admin?tab=advisors` |
| `/app/admin/advisor-feed` | Advisor retrieval notes | Future `/app/admin?tab=advisor-feed` |

Decision for this slice: keep existing routes live to avoid breaking real admin tools during the launch-readiness pass. The next implementation slice should extract each page into `src/components/admin/*Tab.tsx`, render them from `/app/admin`, then convert old route files to 308 redirects.
