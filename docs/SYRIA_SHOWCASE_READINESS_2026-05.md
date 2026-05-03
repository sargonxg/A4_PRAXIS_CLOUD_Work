# Syria Showcase Readiness Checklist

Date: 2026-05-03

Status: Internal preview. Do not link the Syria showcase from the public landing
page until every release item below is green and Giulio signs off.

## Engineering Backbone

- [x] **A1 done.** Tool registry collapsed to 12 hero tools; verified by
  `npm run verify-tools` in the A1 consolidation slice.
- [x] **A2 done.** `conflict-grammar-v1` schema published with generated
  TypeScript and Python models.
- [x] **A3 done.** Numeric confidence, source spans, and provenance-step helpers
  are first-class across graph primitives and reasoning output.
- [x] **A4 done.** One canonical graph, three computed views, hypotheses store,
  and scenario-fork helpers exist.
- [x] **A5 done.** Five named DIALECTICA recipes are implemented with deterministic
  backend tests.
- [x] **A7+A8 done.** Cost-gated Syria ingest and extraction endpoints stage
  document-derived hypotheses before canonical promotion.
- [x] **A9 done.** Syria recipe cards call the DIALECTICA route and visibly fall
  back to cached answers when live execution is unavailable.
- [ ] **A10 done.** TCGC-Syria-v0 eval harness is not yet complete or CI-gated.

## Showcase Surface

- [ ] **B1-B7 done.** Five-chapter Syria workspace exists, live recipe cards are
  wired, analog cases are present, and this pass adds the counterfactual slider.
  Remaining gaps: 90-second source-to-graph stream, full two-sided narrative
  citation overlay, and complete 3-click decision-product provenance.
- [x] **B8 done.** Guided tour engine drives the Syria chapter flow and keeps the
  old `recording=1` link working as a compatibility shim.
- [ ] **B9-B10 done.** Briefing, policy memo, and talking-points provenance exports
  still need full DOCX footnote preservation across all products.

## Test Gate

- [ ] **B11 done.** Six persona Playwright specs are not yet implemented.
- [ ] **B13 done.** Visual regression baselines are not yet established.
- [x] **B14 done.** Shared useful empty/error-state components exist and the Syria
  recipe card now exposes retryable cached-fallback states instead of bare failure.

## Release

- [ ] **`npm run audit:gate` green.** The one-command gate is still pending final
  wiring with A10 and the showcase Playwright suites.

## Current Delta In This Pass

- Added Syria counterfactual toggles with deterministic confidence decay.
- Wired the PATH-SEARCH recipe to accept counterfactual overlays.
- Added a reusable guided-tour shell for chaptered workspaces.
- Added a persistent workspace Trust drawer with model, source-library,
  evaluation, privacy, and methodological limits.
- Added shared empty and error state components for polished failure handling.

Signed off by Giulio:

- [ ] Giulio reviewed the checklist and approved public showcase release.
