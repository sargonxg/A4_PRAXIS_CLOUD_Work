# Onboarding manual verification checklist

Run these before marking Plan A complete.

## Prereqs
- [ ] `npm run build` passes
- [ ] `npx vitest run` all green
- [ ] `npx tsc --noEmit` no errors
- [ ] Staging deploy up with `firestore.rules` deployed
- [ ] `npm run seed:onboarding` ran once against staging

## Fresh user flow
- [ ] Sign up with a new Firebase account → redirected to `/onboarding` (not /app/dashboard)
- [ ] Step 1: Role, seniority, org fields editable and persistable (refresh mid-flow → fields retained)
- [ ] Step 2: Mandate textarea accepts chip clicks (appends text); can edit freely; char counter works
- [ ] Step 2: Lens drag-reorder works with mouse + keyboard (Tab to handle, Space to grab, arrows to move, Space to drop)
- [ ] Step 2: Region chips toggle; custom region adds; max=8 enforced
- [ ] Step 2: Audience selection changes live preview on the right
- [ ] Step 3: Source categories toggle; language selector updates preview
- [ ] Step 3: Red lines — suggestions load; "Suggest more" button calls Gemini and returns new chips; custom input works
- [ ] Step 4: Summary matches what was entered; both "Create first situation" and "Go to dashboard" buttons redirect correctly
- [ ] After completion, `/app/*` shows no onboarding banner
- [ ] Login again → lands on dashboard, not re-routed to onboarding

## Skip flow
- [ ] Click "Finish later" on any step → lands on dashboard
- [ ] Banner appears on every `/app/*` page
- [ ] Banner can be dismissed for the session but reappears on next session load
- [ ] Clicking banner CTA returns to `/onboarding` with partial data retained

## Firestore verification
- [ ] `users/{uid}/profile/analyst` exists with expected fields
- [ ] `users/{uid}/profile_versions/v1` snapshot created after completion
- [ ] `users/{uid}.onboardingCompletedAt` is set (Timestamp)
- [ ] `users/{uid}/profile/analyst.embedding.vector` has 768 numbers after a short delay

## Tool integration sanity (one tool)
- [ ] Pick one AI route (e.g., /api/ai/chat) and manually verify it can be called post-onboarding — **expected: still uses old context, not calibrated.** That's correct — Plan B wires the actual tools. Plan A only ships the contract infrastructure.

## Audit report
- [ ] `docs/audits/tools-2026-04-18.md` committed
- [ ] Most tools score <=3/11 (expected baseline — no tools use withCalibration yet)
- [ ] Running `npm run audit:verify` reports "current with routes"

## Demo mode
- [ ] Demo user login does NOT redirect to onboarding
- [ ] Demo user sees no onboarding banner
