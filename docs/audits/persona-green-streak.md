# Persona Green Streak

Pack 21 reset: 2026-05-07  
10-green-run target: not yet satisfied in CI.

## Current State

| Suite | Latest recorded local status | Consecutive CI green runs |
|---|---:|---:|
| diplomat | production smoke passed on 2026-05-11 | 0 |
| mediator | production smoke passed on 2026-05-11 | 0 |
| analyst | production smoke passed on 2026-05-11 | 0 |
| researcher | production smoke passed on 2026-05-11 | 0 |

Latest production command:

`PLAYWRIGHT_BASE_URL=https://praxis.tacitus.me npm run smoke:personas -- --reporter=line`

Result: 6/6 persona specs passed against production. CI green streak remains 0
until GitHub Actions records actual consecutive workflow passes.

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
