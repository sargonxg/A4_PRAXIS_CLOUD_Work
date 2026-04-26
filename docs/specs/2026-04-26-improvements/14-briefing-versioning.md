# Spec #14 — Briefing Room v2: versioning + locking

## Problem
Diplomats want to walk into a UNSC informal with the brief they
prepared with — not whatever the AI regenerated 90 seconds ago. Today
"Regenerate" silently overwrites; there's no notion of "this is the
version I'm presenting".

## Persona impact
- UN/OSCE diplomat (UNSC informal preparation).
- Mediator (locked talking points before a track-1.5 meeting).

## Files
- `src/lib/firebase/tool-data-service.ts` (EDIT) — extend version
  helpers to support `locked: boolean` flag.
- `src/app/api/tool-data/[toolId]/lock/route.ts` (NEW) — POST to
  lock a specific version.
- `src/app/app/briefing/page.tsx` (EDIT) — version timeline + lock
  CTA + diff viewer.
- `src/components/briefing/version-timeline.tsx` (NEW).
- `src/components/briefing/version-diff.tsx` (NEW).
- `tests/services/briefing-versioning.test.ts` (NEW).

## Schema
`tools/briefing/versions/{n}` already exists. Extend the doc:
```ts
{ data, version, generatedAt, locked: boolean, lockedBy?: string,
  lockedAt?: string, lockedNote?: string }
```

`tools/briefing` (latest) gains `lockedVersion?: number` so the page
shows a "currently presenting v3" banner when the latest version
isn't the one walking into the meeting.

## Implementation order
1. Extend `saveToolData` to copy `locked: false` on writes;
   `lockToolVersion(version, note)` flips it true.
2. Lock endpoint validates ownership + version existence.
3. Page renders the version timeline (last 10), each row showing
   generated-at + locked badge + "view diff vs prior" link.
4. Lock CTA writes the `lockedVersion` pointer on the latest doc and
   sets the version's `locked: true`.
5. Version-diff component renders a side-by-side diff of slide
   contents (BLUF, key developments, sources) using
   `diff-match-patch`.

## Definition of done
- Analyst can lock a version, regenerate freely, and the briefing
  page surfaces "Presenting v3" with a one-click "View locked".
- Diff viewer highlights changed text between any two versions.
- Locked versions cannot be deleted (server enforces).

## Validation gate
- `npx tsc --noEmit`
- `npx vitest run tests/services/briefing-versioning.test.ts`
- `npm run build` (touches shared briefing components).

## Risks / open questions
- Lock UX: confirm dialog before lock? Default yes — irreversible
  decisions deserve a confirm.
- Diff: client-side diff for small slides is fine; for very long
  briefs we may need server-side diff.
