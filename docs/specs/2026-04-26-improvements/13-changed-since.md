# Spec #13 — "What changed since I last looked" diff

## Problem
Analysts juggling multiple active situations forget what changed
between visits. PRAXIS already records every change (tool runs, document
uploads, ARGUS alerts, graph proposals, feed alerts, system events) —
this spec surfaces that change feed as a single card on the situation
overview.

## Persona impact
- Diplomat with 3+ active situations.
- Humanitarian lead returning from leave.
- Researcher returning to a dossier after weeks.

## Files
- `src/lib/situations/changed-since.ts` (NEW) — server-side helper.
- `src/app/api/situations/[id]/changed-since/route.ts` (NEW) — auth-
  gated GET endpoint returning the change feed.
- `src/components/situations/changed-since-card.tsx` (NEW) — UI card.
- `src/app/app/situations/[id]/page.tsx` (EDIT) — mount the card.
- Firestore: `users/{uid}/sessions/{sessionId}` already exists for
  the spine; extend with `lastSeenSituation: { [sitId]: ISO }`.
- `tests/services/changed-since.test.ts` (NEW) — covers ranking +
  cap.

## Interface contract
```ts
export interface SituationChange {
  kind: 'argus.alert' | 'document.uploaded' | 'tool.completed'
      | 'graph.proposal' | 'feed.alert' | 'system.event';
  at: string;
  summary: string;
  href?: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
}

export async function changedSinceLastVisit(
  uid: string, situationId: string, since: string, max?: number
): Promise<SituationChange[]>;
```

## Implementation order
1. Add `lastSeenSituation` map write on every situation page load.
2. Author `changedSinceLastVisit` reading from `system_events`,
   `users/{uid}/situations/{sitId}/documents`, `tools`,
   `graph_updates`, and `tool_runs` since the timestamp; merge,
   sort by `at` desc, cap at `max ?? 30`.
3. GET endpoint wraps the helper.
4. UI card shows the top 8 by default with "View all" expanding to
   30. Each row links to the relevant tool / document / proposal.
5. Tests cover empty case, capped case, severity ordering tiebreak.

## Definition of done
- Visiting a situation after 24h shows a card with everything that
  changed.
- The visit timestamp is updated on the page mount so the next visit
  diff is correct.

## Validation gate
- `npx tsc --noEmit`
- `npx vitest run tests/services/changed-since.test.ts`

## Risks / open questions
- Cardinality: a situation with 1k events in a week could overload
  the card. Cap is 30; "View all" route needs pagination.
- Privacy: the change feed reads spine collections — make sure the
  GET endpoint enforces `uid` ownership of the situation.
