# A5 — Role pills and role-aware UI guards

## Goal

After A1-A4, the data model knows about roles. The UI does not. A
viewer can click "Run" on a hero tool and either get an unhelpful 403
back, or — worse, if A3 missed a path — actually run it. This file
makes the UI honest about who can do what.

## Files Codex must read first

- `src/lib/situations/access.ts` (from A2)
- Every hero tool's React entry component
- The workbench shell components: `WorkbenchActiveCase`,
  `WorkbenchHeader`
- `src/components/workbench/chapter-renderer.tsx`

## Tasks

### 1. Hook for current role on active case

Create `src/hooks/use-effective-role.ts`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import type { EffectiveRole } from '@/lib/situations/access';

export function useEffectiveRole(caseId: string): EffectiveRole | null {
  const [role, setRole] = useState<EffectiveRole | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/situations/${encodeURIComponent(caseId)}/access`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setRole(data.role);
      });
    return () => { cancelled = true; };
  }, [caseId]);
  return role;
}
```

Endpoint `src/app/api/situations/[caseId]/access/route.ts`:

```typescript
export const GET = withAuth(async (req, user) => {
  const caseId = req.nextUrl.pathname.split('/')[3];
  const sit = await getSituation(user.uid, caseId);
  if (!sit) return NextResponse.json({ role: 'none' });
  const role = resolveEffectiveRole(user, sit);
  return NextResponse.json({ role });
});
```

### 2. Role pill in workbench header

In `WorkbenchHeader` (or wherever the case title lives), render a small
role pill:

```tsx
import { useEffectiveRole } from '@/hooks/use-effective-role';

const role = useEffectiveRole(caseId);

const pillStyles = {
  owner: 'bg-purple-100 text-purple-900 border-purple-200',
  editor: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  commenter: 'bg-amber-100 text-amber-900 border-amber-200',
  viewer: 'bg-slate-100 text-slate-700 border-slate-200',
  none: 'bg-red-100 text-red-900 border-red-200',
};

{role && (
  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${pillStyles[role] ?? pillStyles.viewer}`}>
    {role}
  </span>
)}
```

### 3. Disable run buttons for non-editors

In every hero tool's React entry component, disable the primary action
button when `!canEdit(role)`:

```tsx
import { useEffectiveRole } from '@/hooks/use-effective-role';
import { canEdit, canComment } from '@/lib/situations/access';

const role = useEffectiveRole(caseId);

<button
  onClick={runTool}
  disabled={!role || !canEdit(role)}
  title={!role ? 'Resolving access...' : !canEdit(role) ? `${role}s cannot run hero tools` : undefined}
>
  Run
</button>
```

For commenter-allowed tools (e.g., adding a memo to a thread, posting
a thread comment), check `canComment(role)` instead.

### 4. Hide editor-only chapters from viewers

In `chapter-renderer.tsx`, filter the chapter list by role:

```tsx
const role = useEffectiveRole(caseId);
const visibleChapters = WORKBENCH_CHAPTER_FLOW.filter((c) => {
  if (!role || !canRead(role)) return false;
  if (c.requiresEdit && !canEdit(role)) return false;
  if (c.requiresComment && !canComment(role)) return false;
  return true;
});
```

Add `requiresEdit` / `requiresComment` to the `WorkbenchChapter` type
in `src/lib/workbench/chapter-flow.ts`. Sample assignment:

| chapter | requires |
|---|---|
| desk | nothing (any role) |
| research | comment (commenters can add notes) |
| memos | comment (commenters can write memos) |
| draft | edit |
| ach | edit (changing competing hypotheses) |
| tools | edit (running hero tools) |
| boardroom | edit |

### 5. Substrate tabs role-gating

Same treatment for the substrate tabs (Context, Library, Ontology,
Graph). The Graph tab is editor+; Context and Ontology are read-only
for viewers; Library is comment+.

### 6. Server-side enforcement (defense in depth)

UI gating is for UX, not security. The actual access enforcement
happens in:

- Firestore rules (A3) — ultimate gate
- API route handlers — call `resolveEffectiveRole` before any mutation

Codex should grep every hero-tool POST handler and confirm:

```typescript
const role = resolveEffectiveRole(user, situation);
if (!canEdit(role)) {
  return NextResponse.json({ error: 'forbidden' }, { status: 403 });
}
```

is present before the model call. If a route doesn't check, add the
check. Server-side 403 is correct here (vs 404 for read access) because
the user already has read access; we're refusing to mutate.

### 7. Audit: `audit:role-aware-ui`

```typescript
// scripts/audit-role-aware-ui.ts
// For every hero tool's React entry component:
//   - imports useEffectiveRole
//   - the primary action button has a `disabled` attribute referencing
//     canEdit(role) or canComment(role)
// For every hero tool's POST handler:
//   - imports resolveEffectiveRole
//   - calls canEdit(role) and returns 403 on failure
```

Add to `audit:gate`.

### 8. Banner for viewers

When `role === 'viewer'`, render a thin banner above the workbench
content: "You are viewing this case. Editing actions are disabled."

When `role === 'commenter'`, render: "You can read and add memos to
this case. Graph editing and hero-tool runs are disabled."

When `role === 'none'`: route should have already 404'd. Defensive
banner: "You don't have access to this case."

## Acceptance criteria

1. `useEffectiveRole` hook returns the right role for any case.
2. `/api/situations/[caseId]/access` returns the role.
3. Role pill in workbench header.
4. Hero-tool run buttons disabled for non-editors.
5. Chapter list filtered by role.
6. Substrate tabs filtered by role.
7. Every hero-tool POST handler enforces `canEdit` server-side.
8. `audit:role-aware-ui` passes.
9. Manual smoke: log in as a viewer collaborator; confirm:
   - role pill says "VIEWER"
   - Run buttons disabled with hover tooltip
   - Tools/Draft/ACH chapters hidden
   - Banner visible
   - Attempting a mutation via curl returns 403

## Diagnostics

```bash
test -f src/hooks/use-effective-role.ts && echo OK
test -f src/app/api/situations/\\[caseId\\]/access/route.ts && echo OK
grep -l "useEffectiveRole" src/components/workbench/*.tsx | head -3
npm run audit:role-aware-ui && echo OK
npm run build && echo OK
```

## If Codex stops short

**Failure mode A**: Run buttons are disabled but the keyboard shortcut
or programmatic call still fires. Re-prompt:

> "Audit every entry point that triggers a hero-tool run: button
> click, keyboard shortcut, drag-drop staging, scheduled run. Each
> must call `canEdit(role)` before invoking. The disabled button is
> a UX hint, not the gate."

**Failure mode B**: Role pill flickers between "viewer" and "owner"
because the hook resolves async. Re-prompt:

> "Render a neutral skeleton pill while role is null (still
> resolving). Don't show 'viewer' as the loading state. Once
> resolved, the pill stays stable."

**Failure mode C**: A role-aware filter accidentally hides the desk
chapter from the owner. Re-prompt:

> "The desk chapter has no role requirement (everyone with read
> access sees it). Confirm the filter logic: a chapter renders when
> role-allows-it OR there's no requirement. Don't invert the
> condition."

## Commit

```
feat(mt): role pills + role-aware UI guards

UI now reflects the user's effective role on each case. Role pill
in the workbench header, run buttons disabled for non-editors,
chapters and tabs filtered by role, banner for viewer/commenter
states.

Server-side role enforcement added to every hero-tool POST handler
as defense in depth (Firestore rules from A3 are the ultimate
gate).

audit:role-aware-ui keeps the contract.

Refs: V2_WORK_PACK/A5_ROLE_PILLS_AND_GUARDS.md
```
