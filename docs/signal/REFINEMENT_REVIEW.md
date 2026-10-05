# SIGNAL visualization and feedback review

Requested outcome: test and improve the live SIGNAL workspace, especially the 3D and media landscape views, and collect actionable feedback.

## Observations and implemented changes

The authenticated baseline audit exercised all six tabs at desktop and mobile sizes using an owned, disposable synthetic desk. It found no page exceptions, horizontal overflow or unnamed controls in those checks. Keyboard tab navigation worked. It also found substantive product gaps: Narratives showed a list and opaque graph receipts; neither an interactive 3D network nor a media landscape was implemented. Several controls were 37–38 pixels high and dense forms made inspection harder on mobile.

The user selected a geographic globe as the highest-priority view. Coverage therefore receives a real geographic globe using a local Natural Earth basemap, distinct selected-scope markers and current captured-source counts from explicit analyst-assigned coverage countries. Unknown mapping and missing basemap reference anchors remain visible. Country markers use Natural Earth illustrative label points, rather than publisher coordinates or calculated centroids. Country assignment is optional capture metadata; changing it creates an immutable metadata revision without changing the text hash or legacy unmapped revision IDs. Geographic labels describe the source coverage, not publisher headquarters or independently verified events.

An additional locally rendered Three.js evidence network is available in Narratives. Camera controls orbit, zoom and reset the view. Selecting a source or claim opens its exact Evidence record; selecting an interpretation focuses its exact narrative or assessment. Search, kind, review state, language and current-only filters derive from saved evidence. A keyboard-accessible list and interactive SVG fallback retain inspection when WebGL is unavailable. Rendering runs on demand, bounds the retained panel, caps pixel density and disposes GPU resources and listeners when the view closes.

Coverage now shows a media landscape of actual captured URL hostnames, languages and review states. Current source families, retained revisions, original text, discovery headlines, withdrawn evidence, synthetic inputs and unknown publication times have explicit denominators. Host grouping does not establish publisher ownership, source independence, audience reach, ideology or influence. 3D coordinates are a reading layout, without geographical or analytical distance meaning.

Shared pure projection rules keep current acceptance counts consistent with activation history, review receipts, source withdrawal and stale context. Account transitions immediately hide the prior owner's workspace, and delayed responses cannot overwrite the next owner's view or trigger an old download. Form and common button controls have a 44-pixel minimum height.

## Feedback collection

Open **Private feedback** below a desk's active view. Record its area, category, a rating and a concrete observation. Notes remain private in the owner-scoped desk, with server-created provenance and the observed desk version. They never accept a claim, alter an approved brief or enter capsule knowledge. Export the notes as JSON to share them yourself. Synthetic test feedback is explicitly labelled; the 30-note bound retains existing notes when full.

No external reviewers have been contacted and no customer feedback is claimed. Browser QA observations and synthetic test notes are testing evidence, not customer research or the independently reviewed 200-record gold benchmark. Follow-up tasks and acceptance criteria are maintained in [IMPROVEMENT_BACKLOG.md](IMPROVEMENT_BACKLOG.md).

## Verification and release

Validation results and deployed source provenance will be appended after the complete repository gate, authenticated browser checks and public release verification finish. Initial focused checks passed 10 projection tests and 14 strict feedback API/domain tests; these cover activation history, withdrawal, source semantics, private persistence, forged provenance, owner isolation, version conflicts and preservation of accepted evidence and approved briefs.

Pre-globe validation checkpoint: the configured full gate passed, including production build and runtime/GCP audits. The full unit suite passed 489 files / 2,969 tests, and the newly added owner-transition suite passed all seven tests separately. Country metadata then passed five new tests and the 19 existing domain tests. These are checkpoints; final geographic browser and frozen-source release results remain pending.

Geographic focused checkpoint: all nine globe projection tests and ten evidence/media projection tests passed. Shared geography is compiled locally from Natural Earth 110m Admin-0, with source URL, source SHA-256 and public-domain license retained. Desktop/mobile and WebGL-fallback browser verification is prepared against real authenticated synthetic fixtures; it is not yet claimed as executed.

Final integrated repository checkpoint: all 492 unit-test files / 2,990 tests pass. The complete configured audit gate passes, including TypeScript, production build, source/runtime/architecture audits and GCP checks. Full lint passes with zero errors and five existing warnings outside SIGNAL. Geographic browser verification and publication remain pending.

Actual authenticated local-candidate browser checkpoint: both new visualization tests pass (1.6 minutes). Real software WebGL2 rendered both globe and evidence network. The test exercised geographic Brazil raycast, country counts and unmapped inventory, camera controls, exact source/interpretation inspection, filters, private feedback save/reload/JSON download, withdrawal/history and mobile overflow. With WebGL deliberately unavailable, the interactive SVG world map, keyboard country selection and exact source drilldown remained usable; the evidence network list/fallback also passed. No TLS bypass was used, and only explicitly owned synthetic fixtures were deleted. Full baseline browser workflows, exact tagged Node22 candidate and public release verification follow.
