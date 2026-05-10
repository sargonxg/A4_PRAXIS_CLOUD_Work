# Z2 — Demo to trial transition (deferrable)

## Goal

A new visitor lands on `/demo`, plays with a pre-populated case, and
at some moment decides "I want to try this with my own data." The
transition from demo to trial is currently rough — the user has to
sign up, navigate around, find onboarding, then start over.

This file makes the transition smooth: from inside the demo, "Open
in workbench" creates an account (or signs in), copies the demo case
to their workspace, and lands them in the workbench with the right
context.

**Run when**: after Sessions A-D. Sales-driven, not procurement.

## Files Codex must read first

- `src/app/demo/*` — current demo workbench
- `src/app/api/auth/*` — signup flow
- `src/app/api/situations/copy-from-demo/route.ts` (create if missing)

## Tasks

### 1. Demo "claim it" affordance

In the demo workbench header, add a primary CTA: "Use this case in
my own workspace" or "Copy to my workspace."

Click handler:
1. If signed in: POST `/api/situations/copy-from-demo` with the demo
   case id.
2. If not signed in: redirect to `/login?next=/api/situations/copy-from-demo?demoCaseId=...`.

### 2. Copy-from-demo handler

```typescript
// src/app/api/situations/copy-from-demo/route.ts
export const POST = withAuth(async (req, user) => {
  const body = await req.json();
  const demoCaseId = body.demoCaseId;

  if (!isValidDemoCaseId(demoCaseId)) {
    return NextResponse.json({ error: 'invalid demo case' }, { status: 400 });
  }

  const demoCase = await loadDemoCase(demoCaseId);
  const newCaseId = `case-${crypto.randomUUID()}`;

  // Create the user's situation, copying demo data
  await createSituationFromDemo({
    uid: user.uid,
    orgId: user.orgId,
    caseId: newCaseId,
    demoCase,
  });

  // Telemetry
  emitTelemetry({
    event: 'case.create',
    uid: user.uid, orgId: user.orgId,
    caseId: newCaseId,
    outcome: 'ok',
    details: { source: 'demo-clone', demoCaseId },
  });

  return NextResponse.json({ caseId: newCaseId });
});
```

### 3. Land in workbench with explainer

After successful copy, redirect to `/app/workbench?caseId=<new>&source=demo`.
The workbench reads the `source=demo` param and shows a one-time
banner:

> "This is a clone of the demo case. Your data is separate from the
> demo. Edit freely; you can also upload your own documents to make
> the analysis your own."

### 4. Conversion telemetry

Track the funnel:
- `case.open` from demo (existing in D0)
- "Claim it" button click → `marketplace.recipe-stage` analog
- Copy success → `case.create` with `source: 'demo-clone'`
- First user-initiated tool run on the cloned case → `tool.run-complete`

This tells you in BigQuery: of N demo visitors, how many click the
CTA, how many complete sign-up, how many actually run a tool on
their cloned case. The drop-off identifies the polish target.

### 5. Edge cases

- User clicks claim while signed in as a different user — confirm
  before proceeding.
- User claims twice — second time creates a fresh copy with a
  numeric suffix (don't dedupe; let the user have multiple copies).
- Demo case data is updated — the clone is a snapshot, not a live
  link. Re-claim creates a fresh snapshot.

### 6. Audit: `audit:demo-claim`

Static-marker for the route + UI button.

## Acceptance criteria

1. CTA visible in demo workbench.
2. Sign-in flow preserves the claim intent.
3. Copy creates a real situation owned by the user.
4. Workbench renders the cloned case with an explainer banner.
5. Conversion telemetry events fire.

## Diagnostics

```bash
# Manual: open /demo as logged-out user, click "Use in my workspace",
# complete sign-up, confirm landing on the cloned case in /app/workbench.
```

## Commit

```
feat(Z2): demo-to-trial conversion flow

Adds "claim it" CTA in the demo workbench. Click → sign-up if
needed → copy-from-demo handler clones the case to the user's
workspace → workbench lands with an explainer banner.

Conversion telemetry tracks the funnel from demo open to first
real tool run on the cloned case.

audit:demo-claim protects the contract.

Refs: V2_WORK_PACK/Z2_DEMO_TRANSITION.md
```
