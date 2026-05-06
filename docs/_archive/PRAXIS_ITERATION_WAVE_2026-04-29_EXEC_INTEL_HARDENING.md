# PRAXIS Iteration Wave — Executive Intelligence Hardening

Date: 2026-04-29.
Status: implemented, pending live authenticated browser QA.

## Strategic Read

The app is moving from "many impressive tools" toward a system users can trust
as an intelligence workspace. The highest-leverage weakness found in this wave
was not another missing widget; it was product contract consistency:

- A new high-value AI route existed but was not yet a registered tool.
- The route saved to the legacy `tools` path but not the canonical reload path.
- Model/schema failures could become generic server exceptions.
- Recommendations did not lead users to the new highest-value dashboard output.
- User-facing source copy still contained retired source claims in registry and
  landing tour surfaces.

## 5 Critical / High-Priority Items

1. First-class tool registration.
   - Status: done.
   - Change: `situation-intelligence` is now in the tool registry with route,
     schema, credits, stale window, frameworks, sources, related tools, and
     methodology.
   - Verification: registry test asserts route, schema, and stale window.

2. Explicit metering and route contract.
   - Status: done.
   - Change: added `ai_situation_intelligence` to the server credit table and
     changed the route to use that operation instead of generic `ai_analysis`.
   - Verification: route smoke test asserts `withCalibration` receives the
     new operation.

3. Server-side canonical persistence.
   - Status: done.
   - Change: the route now writes successful output to
     `tool-data/situation-intelligence` via `saveToolData`, and still records
     `saveToolOutput` metadata for the tool-output layer.
   - Verification: smoke test asserts `saveToolData` receives the generated
     output.

4. Controlled AI/schema failure behavior.
   - Status: done.
   - Change: model generation and Zod validation are wrapped; invalid output
     returns a controlled 502 with `schema_validation_failed`.
   - Verification: smoke test covers invalid mocked model output.

5. Retired source-claim cleanup.
   - Status: first pass done.
   - Change: removed user-facing ACLED claims from the tool registry, in-app
     docs page, and landing quadrant tour surfaces touched in this wave.
   - Verification: targeted `rg "ACLED"` over those surfaces returns no
     matches.

## 5 Secondary / High-Value Items

1. Recommendation path to the new panel.
   - Status: done.
   - Change: `situation-intelligence` is the cross-role first recommendation
     and links to `/dashboard#executive-intelligence`.

2. Dashboard anchor and saved-state copy.
   - Status: done.
   - Change: the Executive Intelligence panel has a stable anchor and confirms
     server persistence when the route reports it.

3. Persona-relevant recommendation coverage.
   - Status: done.
   - Change: role recommendation tests were updated so researchers and
     journalists still surface `sources-library` after the new first action.

4. Focused route tests.
   - Status: done.
   - Change: added route smoke tests for calibration operation, canonical save,
     weak-input refusal, and invalid-output 502 behavior.

5. Documentation traceability.
   - Status: done.
   - Change: this wave document plus TODO, changelog, testing guide, and
     continuation handoff are updated.

## Persona Findings

- New user: the dashboard now has a clearer first "generate intelligence"
  action, but live browser QA must confirm the user sees it after onboarding
  and understands weak-input guidance.
- Power user: saved Executive Intelligence output should now reload from the
  canonical `tool-data` path without relying on client-side follow-up save.
- Technical user: route failures are easier to classify because schema failures
  return a stable `kind`.
- Skeptical user: source claims are less overpromised; visible ACLED claims were
  removed from the current user-facing surfaces in scope.
- Enterprise/professional user: export, provenance, confidence, and explicit
  persistence improve trust, but live provider/browser testing is still needed.

## Multi-Path Flow Notes

- Dashboard entry: recommendation can deep-link to the panel.
- Direct dashboard generation: route requires real situation id/name and enough
  input detail.
- Weak input: route returns 422 before spending AI calls.
- Invalid model output: route returns controlled 502.
- Reload path: canonical `tool-data/situation-intelligence` now receives the
  result server-side.

## Next Wave

1. Run authenticated browser QA for first-time, returning, and skeptical users.
2. Add Playwright coverage for the dashboard panel once test auth fixtures are
   available.
3. Unify `saveToolOutput` and `tool-data` persistence into a single envelope
   to remove duplicate write paths.
4. Add export format options beyond JSON, likely Markdown first.
5. Continue retiring stale source/vendor claims in older historical docs only
   where they are not explicitly archival.
