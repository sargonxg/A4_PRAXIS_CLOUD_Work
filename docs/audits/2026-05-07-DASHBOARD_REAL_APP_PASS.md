# PRAXIS Dashboard Real-App Pass

Date: 2026-05-07
Repo: `C:\Users\giuli\praxiscodexworking`
Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`

## Purpose

The active self-audit backlog says PRAXIS should prioritize real user surfaces over more target-state documentation. This pass removes the legacy `/app/dashboard` redirect and makes the dashboard a first-touch command center for the shipped workbench.

## Implemented

- `/app/dashboard` renders a real app dashboard instead of redirecting to `/app/workbench`.
- `/app` now redirects to `/app/dashboard`, giving authenticated users a stable app entry.
- Sidebar and keyboard dashboard navigation now point to `/app/dashboard`.
- The dashboard includes a larger responsive graph visualization for the active case, case metrics, marketplace count, and direct links to Workbench, Graph, Tools, Memo Studio, Boardroom, ACH, and Persona Settings.
- Dashboard copy reflects the real app: context before tools, permissive text/context persistence, soft firewall advisories, and review-gated boardroom synthesis.
- Added `npm run audit:dashboard` and included it in `npm run audit:gate` so the route cannot silently degrade back into a redirect.

## Remaining Relevant Backlog

- Public demo, waitlist, login callback, and legal route alignment remain tracked in `docs/backlog/2026-05-06-from-self-audit.md`.
- Persona green-streak evidence and production storage/firewall depth remain launch blockers under the strict charter.
- The dashboard is now a better real-user entry point, but live data hydration can continue to deepen once context/storage parity is closed.
