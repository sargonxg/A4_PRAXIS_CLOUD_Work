# Spec #15 — Domain-aware tool overrides

## Problem
The domain taxonomy already merges user × situation domains into a
`MergedDomainConfig` (see `CLAUDE.md`'s domain section), but most
calibrated AI routes do not consume `domain.promptOverrides`. So a
humanitarian analyst gets the same Risk Monitor system prompt as a
diplomat working sanctions — domain context is lost.

## Persona impact
- Humanitarian lead (IPC + protection emphasis on every relevant tool).
- Legal analyst (Chapter VI/VII split + IHL emphasis on every relevant
  tool).
- Sector-specialist analysts in general.

## Files
- `src/lib/context/profile-context.ts` (EDIT) — already exposes
  `domain.promptOverrides`; add a typed accessor
  `getDomainPromptOverride(toolId)` that returns the matching string
  or null.
- `src/app/api/ai/risk-assessment/route.ts` (EDIT) — append the
  override to the system prompt when present.
- `src/app/api/ai/humanitarian/route.ts` (EDIT) — same.
- `src/app/api/ai/legal-tracker/route.ts` (EDIT) — same.
- `src/app/api/ai/briefing-generate/route.ts` (EDIT) — same.
- `src/app/admin/domains/page.tsx` (EDIT) — admin can preview the
  override they author for a specific (domain, tool) pair.
- `tests/services/domain-overrides.test.ts` (NEW) — assert that the
  override is read for a known (domain, tool) combo.

## Interface contract
```ts
export function getDomainPromptOverride(
  ctx: ContextBlock, toolId: string
): string | null;
```

Convention for storing overrides in `config/domains/{id}.promptOverrides`:
```json
{ "humanitarian": { "risk-monitor": "Emphasise IPC phases and protection severity above other dimensions when scoring Humanitarian.", "briefing": "Lead each slide with the cluster impact." } }
```

## Implementation order
1. Add the typed accessor + tests.
2. Wire into the four high-impact routes named above.
3. Add an admin preview UI so authoring overrides is not blind.
4. Document the convention in `docs/CONTEXT_INJECTION.md`.

## Definition of done
- A humanitarian analyst running Risk Monitor sees the IPC emphasis
  reflected in the output (verifiable via `tool_runs/{id}.metadata`).
- Toggling the override in admin UI updates the next tool run.

## Validation gate
- `npx tsc --noEmit`
- `npx vitest run tests/services/domain-overrides.test.ts`
- `node scripts/audit-ai-routes.mjs` (must still pass — overrides
  do not bypass calibration).

## Risks / open questions
- Override length: cap at 500 chars per (domain, tool) so the system
  prompt doesn't bloat.
- Conflict: when user.primaryDomain and situation.domain disagree,
  the merge already resolves to the situation's domain by default.
  Overrides follow the merged result; no extra logic.
