# PRAXIS Next 20 Improvements — 2026-04-29

Status: active implementation wave.

This plan consolidates three subagent audits:

- Product / UX audit.
- AI / backend reliability audit.
- Security / cloud / deploy audit.

## Top 10 Critical / High-Impact Improvements

1. Canonicalize tool-output persistence.
   - Status: started.
   - Evidence: `saveToolOutput` previously wrote only `tools/{toolId}` while
     other systems used `tool-data/{toolId}`.
   - This wave: `saveToolOutput` now writes a versioned canonical
     `tool-data/{toolId}` envelope and a legacy `tools/{toolId}` compatibility
     document.
   - Next: migrate remaining direct `writeToolDataServer` paths into the same
     envelope and backfill old outputs.

2. Make exports provenance-bearing.
   - Status: started.
   - This wave: Export Center now reads both `tool-data` and `tools`, prefers
     canonical envelopes, labels canonical versus legacy outputs, and includes
     export provenance metadata in bundled JSON.
   - Next: add source receipts, model/provider, tool-run ID, and profile/domain
     version to every exported artifact.

3. Enforce GCP resource audit in Cloud Build.
   - Status: started.
   - This wave: granted Cloud Build read-only audit roles and flipped
     `_AUDIT_GCP_SKIP` to `0`.
   - Next: confirm the next Cloud Build deploy fails closed if a required
     mounted secret or runtime resource is missing.

4. Add route-level request validation before model work.
   - Status: started.
   - This wave: added Zod validation to `deep-research` and
     `deep-search-agent`; improved `terminology` validation.
   - Next: add a shared `validate` option inside `withCalibration` so invalid
     requests are rejected before credits/tool-runs wherever possible.

5. Bind streaming lifecycle to actual stream completion.
   - Status: pending.
   - Problem: `withCalibration` can mark streaming routes complete when a 2xx
     response is returned rather than when the stream finishes.
   - Next: add a `finalizeStream` helper and use it for chat, grounded-search,
     and deep-search-agent.

6. Harden Vertex Agent Engine session ownership.
   - Status: pending.
   - Problem: `deep-search-agent` accepts an incoming `sessionId`.
   - Next: bind sessions to `{uid, engineId}`, ignore unowned session IDs, and
     add bounded fetch timeouts.

7. Make grounded search receipt-based and auditable.
   - Status: started.
   - This wave: Ask PRAXIS grounded mode now sends `situationId`, allowing
     grounded-search outputs to persist against the active situation.
   - Next: require source receipt extraction and persist
     `{title, url, publishedAt, claimSupported}` with the answer.

8. Add Situation Health / trust panel.
   - Status: pending.
   - Goal: show graph coverage, source freshness, citation coverage, tool
     failure state, and stale outputs in one user-facing trust panel.

9. Move long-running work to durable async execution.
   - Status: pending.
   - Target: Deep Research, Brainstorming Table, Source Scout, red-team review,
     graph cartography, and backend pipeline runs.
   - Path: Cloud Tasks + LangGraph checkpoints + `background_jobs`.

10. Narrow client write access to server-owned Firestore outputs.
    - Status: pending.
    - Problem: broad owner write access under situation subcollections can let
      clients write state consumed by server workflows.
    - Next: split client-writable notes/preferences from server-owned
      `tool-data`, graph outputs, jobs, and extraction state.

## Second 10 High-Value Improvements

11. Turn Ask PRAXIS into a durable situation notebook.
    - Persist chat turns, reload history, show citation/tool-call panels, and
      promote useful answers into report sections.

12. Make first-run activation produce one cited artifact.
    - After situation creation, produce a starter Situation Intelligence card
      or one clearly framed CTA that generates a cited artifact.

13. Unify Ask PRAXIS naming and entry points.
    - Status: started.
    - This wave: assistant headers and empty state now use Ask PRAXIS.

14. Refresh guided-tour and demo copy.
    - Status: started.
    - This wave: stale “15+ tools,” “Active Conflicts,” and Karovia-specific
      prompt text were replaced with current situation/PRAXIS wording.

15. Make empty states role/domain-aware.
    - Use onboarding profile and domain to recommend the first three actions.

16. Harden document upload processing.
    - Add byte limits before parsing, MIME/magic verification, upload quota,
      async extraction, and rejected-file audit events.

17. Replace shared cron secrets with Cloud Scheduler OIDC.
    - Move mutating cron jobs to POST-only OIDC-authenticated handlers with a
      local-dev-only secret fallback.

18. Reduce backend UID impersonation blast radius.
    - Add request IDs, signed user-context assertions, service-specific route
      allowlists, and backend audit rows.

19. Populate model/cost/token telemetry into `tool_runs`.
    - Capture provider, model, token usage, credit cost, output path, and prompt
      version on completion.

20. Replace service-account JSON credentials with Workload Identity / ADC.
    - Keep Secret Manager only where no ADC path exists; rotate old JSON keys
      after the migration.

## Improvements Completed Or Started This Wave

- Tool audit understands delegated Ask PRAXIS route source.
- `terminology` works in Vertex-only production, validates input, and persists
  outputs.
- `extract-episodes` persists a canonical tool output envelope in addition to
  episode documents.
- `deep-research` and `deep-search-agent` validate request bodies.
- `deep-search-agent` saves under `deep-search-agent` instead of colliding with
  `deep_research`, and saves a final marker even if the stream ends without an
  explicit done event.
- `grounded-search` receives `situationId` from Ask PRAXIS grounded mode and
  includes `toolRunId` in persisted metadata.
- `saveToolOutput` now writes canonical `tool-data` envelopes and legacy
  compatibility docs.
- Export Center reads canonical and legacy output collections.
- Cloud Build GCP audit is configured to enforce (`_AUDIT_GCP_SKIP=0`).
- GCP audit now checks all currently mounted required secrets, including
  Firecrawl, Parallel, UCDP, and Vertex Agent Engine.
- Ask PRAXIS naming and guided-tour copy were updated for product coherence.

