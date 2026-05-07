# Pack 26 Follow-Up Backlog

Owner: Giulio / PRAXIS engineering
Target release: surface hardening wave after Pack 26 first slice

## P0

- Add review-queue write APIs for graph proposals from Context Studio; never auto-promote synthesized nodes.
- Extend the context-scope audit trail with previous-value diffs once the canonical case field schema is finalized.

## P1

- Deploy and wire `chapter_suggester` so chapter gaps are suggested from case state, not hard-coded heuristics.
- Deploy and wire `desk_advisor` so Desk next actions combine stale data, tool results, memos, and review queue state.
- Add non-destructive context re-genesis jobs with before/after diff, dry-run preview, and rollback.
- Add status lifecycle controls to Open Questions beyond create/list once the owner-scoped board has production usage data.

## P2

- Add user-case Playwright coverage that creates a new case, opens Chapters, Desk, and Context, edits local scope, and verifies the UI does not use generic placeholder panels.
- Add source upload handoff from Context Studio to the Library ingestion path once the upload pipeline is fully production-backed.
- Add open-question owner assignment and artifact references for memo/tool/boardroom resolution.

## P3

- Add richer chapter visuals after the surface contracts stabilize: small graph miniatures, source receipt previews, memo export readiness, and tool-run provenance strips.
