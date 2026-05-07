# ADR 0040: Chapters Layered Content Rendering

## Status

Accepted

## Context

Pack 26 requires Chapters to remain the default workbench path while avoiding generic placeholder copy for user-created cases. Demo cases can keep hand-authored chapters, but real cases need a deterministic path that renders from case state and can later accept advisory AI suggestions.

## Decision

Use a layered chapter renderer. Hand-coded case chapters render first when present. Otherwise PRAXIS uses a structured case-aware layer for the five canonical chapters: Situation Frame, Source Receipts, Conflict Graph, DIALECTICA Reasoning, and Decision Product. AI-suggested content remains advisory and must route through review before changing structured state.

## Consequences

Every case can render useful chapter content without adding a new tab or weakening review-queue discipline. Future `chapter_suggester` output can plug into the same layer contract without silently mutating case state.

## Alternatives Considered

- Keep generic fallback paragraphs. Rejected because they fail the first-session workbench goal.
- Replace hand-authored demo chapters with a single generic renderer. Rejected because the curated demos are still valuable exemplars.
