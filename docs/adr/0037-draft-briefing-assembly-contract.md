# ADR 0037: Draft Briefing Assembly Contract

## Status

Accepted

## Context

Pack 28 requires the Draft surface to behave as a real briefing assembly workspace instead of a placeholder memo list. Users need to select memos, set cover metadata, choose appendices, apply audience redactions, export a package, and preserve a reviewable artifact trail.

## Decision

Ship Draft as a workbench tab that assembles briefing packages client-side and persists an authenticated export manifest under the owning case. The persisted record is a `draft-briefing-package` with checksum, selected memo ids, appendix ids, audience, redaction summary, and a `c2pa-ready-manifest` flag. Demo users receive the same response shape without writing to storage.

## Consequences

Users can produce Markdown, DOCX, and PDF briefing packages immediately, and the case library can track export intent and provenance. Full server-rendered binaries, signed C2PA credentials, and durable binary storage remain a production backend follow-up rather than being implied by the current client-side exporter.

## Alternatives Considered

- Keep Draft as a static placeholder until the full export backend exists. Rejected because it blocks the useful user-facing surface requested by Pack 28.
- Claim signed C2PA support from the client exporter. Rejected because content credential signing must happen through a provisioned server-side chain.
