# Admin Consolidation Plan

Date: 2026-05-06

Current admin routes:

| Route | Current state | Canonical target |
|---|---|---|
| `/app/admin` | Admin index and control panel | Canonical admin home |
| `/app/admin/diagnostics` | Real diagnostics probes | 308 to `/app/admin?tab=diagnostics` |
| `/app/admin/users` | User/credit management | 308 to `/app/admin?tab=users` |
| `/app/admin/domains` | Domain taxonomy tuning | 308 to `/app/admin?tab=domains` |
| `/app/admin/operator-console` | Jobs/runs/events | 308 to `/app/admin?tab=operator` |
| `/app/admin/advisors` | Advisor configuration | 308 to `/app/admin?tab=advisors` |
| `/app/admin/advisor-feed` | Advisor retrieval notes | 308 to `/app/admin?tab=advisor-feed` |

Implementation state: `/app/admin` now renders the operational pages as canonical tabs and `next.config.ts` permanently redirects old admin subroutes to the matching tab. The old route component files remain in place as importable tab bodies, but users and crawlers see one admin route.
