# Spec #9 — Onboarding rationale + persona-fit messaging

## Problem
First-run onboarding live-preview is technical and low-empathy.
Persona walkthroughs flagged that analysts don't see how their choices
flow into actual tools.

## Persona impact
- All five canonical personas, but most acutely the UN/OSCE diplomat
  and humanitarian lead during their first three minutes on the
  product.

## Files
- `src/app/onboarding/identity/_messaging.ts` (NEW) — rationale
  copy keyed on `role + seniority`.
- `src/app/onboarding/perspective/_messaging.ts` (NEW) — rationale
  copy keyed on `primaryDomain`.
- `src/app/onboarding/working-style/_messaging.ts` (NEW) — rationale
  copy keyed on `outputLanguage + audience`.
- `src/app/onboarding/identity/page.tsx` (EDIT) — render the messaging
  panel beside the live preview.
- `src/app/onboarding/perspective/page.tsx` (EDIT).
- `src/app/onboarding/working-style/page.tsx` (EDIT).
- `tests/onboarding/messaging.test.ts` (NEW) — assert that every
  recognised role+domain returns a non-empty rationale.

## Interface contract
```ts
export type OnboardingRationale = {
  headline: string;        // 1 sentence
  bullets: string[];       // 3-5 bullets describing how this choice flows
                           // into specific PRAXIS tools (named)
  example: { tool: string; outcome: string }; // concrete example
};

export function rationaleForIdentity(role: AnalystRole, seniority: string): OnboardingRationale;
export function rationaleForPerspective(primaryDomain: DomainId, audience: string): OnboardingRationale;
export function rationaleForWorkingStyle(outputLanguage: string, audience: string): OnboardingRationale;
```

## Implementation order
1. Author the three `_messaging.ts` modules with a complete table for
   each enum (every role × seniority, every domain, every working
   language).
2. Edit each onboarding page to render an `<OnboardingRationale />`
   panel that calls the matching helper.
3. Update onboarding live-preview component to highlight which tool
   the rationale's example points at when the user hovers it.
4. Add tests and run the full validation gate.

## Definition of done
- Every (role, seniority) and every (primaryDomain) returns a
  rationale with a named tool example.
- `npx tsc --noEmit` clean.
- `tests/onboarding/messaging.test.ts` passes.
- Persona walkthrough addendum captures one diplomat + one
  humanitarian first-run experience under the new copy.

## Validation gate
- `npx tsc --noEmit`
- `npx vitest run tests/onboarding/`
- `npm run build` (touches `src/app/onboarding/**`)

## Risks / open questions
- Copy ownership: does Giulio want to write this himself or delegate?
- Coverage: do we ship rationales for every domain or start with the
  three highest-traffic ones (`humanitarian`, `armed-conflict-security`,
  `governance-rule-of-law`) and stub the rest?
