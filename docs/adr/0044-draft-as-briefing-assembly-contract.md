# ADR 0044: Draft As Briefing Assembly Contract

## Status

Accepted

## Context

Pack 28 defines Draft as the final assembly surface for memos, cover metadata, appendices, redaction settings, and export manifests. ADR 0037 captured the implementation slice; this ADR preserves the pack-numbered architecture contract requested by the prompt.

## Decision

Draft is the briefing assembly workspace. The current implementation assembles selected memos client-side and persists an authenticated export manifest under the case with checksum, memo ids, appendix ids, redaction summary, and `c2pa-ready-manifest` metadata. Full server-rendered binaries and signed C2PA remain explicit production follow-up.

## Consequences

Users can produce briefing packages now, and PRAXIS records export provenance without overstating signed credential support.

## Alternatives Considered

- Wait for full server export before shipping Draft. Rejected because the user-facing surface was the last placeholder.
- Present client exports as signed C2PA artifacts. Rejected because real signing requires provisioned server credentials.
