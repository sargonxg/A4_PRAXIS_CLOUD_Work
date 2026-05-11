# Persona Green Streak

Pack 21 reset: 2026-05-07  
10-green-run target: not yet satisfied in CI.

## Current State

| Suite | Latest recorded local status | Consecutive CI green runs |
|---|---:|---:|
| diplomat | production and CI smoke passed on 2026-05-11 | 1 |
| mediator | production and CI smoke passed on 2026-05-11 | 1 |
| analyst | production and CI smoke passed on 2026-05-11 | 1 |
| researcher | production and CI smoke passed on 2026-05-11 | 1 |

Latest production command:

`PLAYWRIGHT_BASE_URL=https://praxis.tacitus.me npm run smoke:personas -- --reporter=line`

Result: 6/6 persona specs passed against production. CI green streak is now
1/10 after the first successful GitHub Actions persona-smoke run.

Latest CI proof:

- Workflow: `persona-smoke`
- Run: `25652333690`
- Commit: `1b3a6c69`
- Result: success
- Run: `25652772692`
- Commit: `6c9e407c`
- Result: success
- Streak: 2/10

## Policy

The 52-tool marketplace can remain on `main` as a foundation surface, but no
`v1.2.0` tag should be cut until all persona suites have 10 consecutive green
CI runs after the Pack 21 reset.

## Coverage Guard

`npm run audit:tool-persona-coverage` verifies that every marketplace tool is
assigned to at least one professional role and that every Pack 20 professional
community has marketplace coverage. This is not a replacement for browser
persona runs; it is the static guard that prevents unassigned tools from
entering the marketplace.
