# PRAXIS one-workbench preflight - 2026-05-06

Branch: `feature/praxis-one-workbench`

Repository: `C:\Users\giuli\praxiscodexworking`

Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`

## Starting state

- The checkout was dirty before this wave began.
- `main` was behind `origin/main` by 20 commits.
- `/app/workbench` did not exist.
- `/app` redirected to `/app/cockpit`.
- `/app/syria-case` contained the best current five-chapter walkthrough.
- Landing composition had already been partially rebuilt into the shorter `Hero -> SixSteps -> Dialectica -> LiveDemo -> BuiltFor -> Trust -> PricingCTA -> Footer` flow.

## Implementation strategy

- Preserve existing dirty work; no reset or destructive checkout.
- Add the workbench destination before redirecting legacy pages.
- Keep Syria as an example case, not the product spine.
- Prefer local deterministic audits and build checks over live GCP operations.
- Leave large dead-route deletion and production schedulers for a later checkpoint after the workbench route is stable.
