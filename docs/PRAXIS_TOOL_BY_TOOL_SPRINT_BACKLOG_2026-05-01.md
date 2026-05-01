# PRAXIS Tool-by-Tool Sprint Backlog - 2026-05-01

This backlog is generated from the live PRAXIS tool registry, operating contracts, page inspection, and latest AI route audit. It turns every sidebar/tool surface into a concrete product-engineering sprint item: objective, graphics, usage, AI wiring, Ask PRAXIS writeback, persistence, and verification.

Current implementation focus: generic core + conflict/political analyst path. Other workflow paths are codified for future activation, but they should not distract this sprint from making the common and political-analysis tools excellent.

Summary: 54 registered tools; P0=20, P1=16, P2=16, P3=2.

## Cross-Tool Non-Negotiables

- Every tool must explain why it exists and what professional workflow it supports.
- Every generative tool must ask missing required questions before producing confident output.
- Every generated output must show provenance, confidence, limits, and degraded-state language.
- Every useful output must save to canonical tool data and reload/export cleanly.
- Ask PRAXIS must be able to explain, challenge, and write structured corrections to the active tool after user confirmation.
- Maps, graphs, timelines, scorecards, drafts, and feeds must be real product outputs, not decorative panels.

## Immediate Top 30 Sprint Queue

### P0 - Conflict Graph (conflict-graph)

- Category: context
- AI route: extract (6/12)
- Page: src/app/app/conflict-graph/page.tsx
- UI contract surface: yes; shared shell: no; output frame: no
- Output mode: graph
- Active generic/political path: yes
- Path membership: generic-core:core, generic-core:primary, generic-core:premium-future, political-officer:core, political-officer:primary, political-officer:premium-future, country-desk:core, country-desk:premium-future, mediator-envoy:core, mediator-envoy:premium-future, humanitarian-access:core, humanitarian-access:premium-future, legal-sanctions:core, legal-sanctions:premium-future, political-risk:core, political-risk:premium-future, policy-research:core, policy-research:premium-future, media-disinformation:core, media-disinformation:premium-future, stabilization:core, stabilization:premium-future, election-governance:core, election-governance:premium-future
- Required context: analyst-profile, user-preferences, situation-record, graph-backbone
- Graph mode: read-write; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Conflict Graph to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, graph-backbone.
- [ ] Connect output to graph backbone mode read-write; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review graph graphics: node labels, edge meaning, centrality/cluster legend, click-to-edit details, and missing-link prompts.
- [ ] Add required-question preflight: What situation, geography, and time window should this view represent? / Which actors, sources, or documents are currently missing?
- [ ] Upgrade AI route from 6/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/conflict-graph or /app/conflict-graph and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST extract route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P0 - Deep Research Agent (deep-search-agent)

- Category: intelligence
- AI route: deep-search-agent (6/12)
- Page: src/app/app/deep-search-agent/page.tsx
- UI contract surface: yes; shared shell: no; output frame: no
- Output mode: brief, feed
- Active generic/political path: yes
- Path membership: generic-core:specialized, generic-core:premium-future, political-officer:specialized, political-officer:premium-future, country-desk:premium-future, mediator-envoy:premium-future, humanitarian-access:premium-future, legal-sanctions:secondary, legal-sanctions:premium-future, political-risk:premium-future, policy-research:primary, policy-research:premium-future, media-disinformation:premium-future, stabilization:premium-future, election-governance:premium-future
- Required context: analyst-profile, user-preferences, situation-record, source-library, live-web-research, graph-backbone
- Graph mode: read-write; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Deep Research Agent to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, source-library, live-web-research, graph-backbone.
- [ ] Connect output to graph backbone mode read-write; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Review feed UI: source receipts, freshness, credibility, filters, saved-source actions, and empty/degraded states.
- [ ] Add required-question preflight: What intelligence question should collection answer? / Which source classes should be prioritized or excluded?
- [ ] Upgrade AI route from 6/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add trust controls: do not use training-data fallbacks for current legal/sanctions/research claims; show degraded/uncertain state instead.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/deep-search-agent or /app/deep-search-agent and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST deep-search-agent route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P0 - Policy Memo (policy-memo)

- Category: drafting
- AI route: policy-memo (6/12)
- Page: src/app/app/policy-memo/page.tsx
- UI contract surface: yes; shared shell: no; output frame: yes
- Output mode: draft
- Active generic/political path: yes
- Path membership: generic-core:secondary, political-officer:secondary, country-desk:primary, mediator-envoy:secondary, legal-sanctions:primary, policy-research:primary, stabilization:secondary, election-governance:secondary
- Required context: analyst-profile, user-preferences, situation-record, prior-tool-outputs, document-corpus, drafting-constraints
- Graph mode: read; LibreOffice/document lane: yes

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Policy Memo to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, prior-tool-outputs, document-corpus, drafting-constraints.
- [ ] Connect output to graph backbone mode read; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Prepare document-production lane for policy memo, options paper, decision memo with structured sections that LibreOffice/DOCX/PDF export can render.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Review drafting UI: section navigation, regenerate/rewrite actions, source/confidence panel, export, and audience/tone controls.
- [ ] Add required-question preflight: Who is the audience and what decision must the document support? / What stance, red lines, or policy constraints must the draft respect?
- [ ] Upgrade AI route from 6/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add trust controls: do not use training-data fallbacks for current legal/sanctions/research claims; show degraded/uncertain state instead.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/policy-memo or /app/policy-memo and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST policy-memo route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P0 - Executive Intelligence (situation-intelligence)

- Category: context
- AI route: situation-intelligence (6/12)
- Page: missing
- UI contract surface: no; shared shell: no; output frame: no
- Output mode: table, dashboard
- Active generic/political path: yes
- Path membership: generic-core:secondary
- Required context: analyst-profile, user-preferences, situation-record, graph-backbone
- Graph mode: read-write; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Executive Intelligence to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, graph-backbone.
- [ ] Connect output to graph backbone mode read-write; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Wire RegistryToolInfo so methodology, sources, operating contract, and related tools are visible.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Review dashboard layout: one-line diagnosis, next-best action, source coverage, stale outputs, and no-config/no-data states.
- [ ] Add required-question preflight: What situation, geography, and time window should this view represent? / Which actors, sources, or documents are currently missing?
- [ ] Upgrade AI route from 6/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/situation-intelligence or /app/situation-intelligence and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST situation-intelligence route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P0 - Source Scout (source-scout)

- Category: intelligence
- AI route: source-scout (6/12)
- Page: src/app/app/source-scout/page.tsx
- UI contract surface: yes; shared shell: no; output frame: yes
- Output mode: table, feed
- Active generic/political path: yes
- Path membership: generic-core:core, generic-core:primary, political-officer:core, political-officer:primary, country-desk:core, mediator-envoy:core, humanitarian-access:core, legal-sanctions:core, legal-sanctions:secondary, political-risk:core, political-risk:primary, policy-research:core, policy-research:primary, media-disinformation:core, media-disinformation:primary, stabilization:core, election-governance:core
- Required context: analyst-profile, user-preferences, situation-record, source-library, live-web-research
- Graph mode: read; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Source Scout to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, source-library, live-web-research.
- [ ] Connect output to graph backbone mode read; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Review feed UI: source receipts, freshness, credibility, filters, saved-source actions, and empty/degraded states.
- [ ] Add required-question preflight: What intelligence question should collection answer? / Which source classes should be prioritized or excluded?
- [ ] Upgrade AI route from 6/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/source-scout or /app/source-scout and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST source-scout route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P0 - Talking Points (talking-points)

- Category: drafting
- AI route: talking-points (6/12)
- Page: src/app/app/talking-points/page.tsx
- UI contract surface: yes; shared shell: no; output frame: no
- Output mode: draft
- Active generic/political path: yes
- Path membership: generic-core:secondary, political-officer:secondary, country-desk:primary, mediator-envoy:primary, election-governance:primary
- Required context: analyst-profile, user-preferences, situation-record, prior-tool-outputs, document-corpus, drafting-constraints
- Graph mode: read; LibreOffice/document lane: yes

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Talking Points to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, prior-tool-outputs, document-corpus, drafting-constraints.
- [ ] Connect output to graph backbone mode read; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Prepare document-production lane for talking points, Q&A prep, press lines with structured sections that LibreOffice/DOCX/PDF export can render.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review drafting UI: section navigation, regenerate/rewrite actions, source/confidence panel, export, and audience/tone controls.
- [ ] Add required-question preflight: Who is the audience and what decision must the document support? / What stance, red lines, or policy constraints must the draft respect?
- [ ] Upgrade AI route from 6/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add trust controls: do not use training-data fallbacks for current legal/sanctions/research claims; show degraded/uncertain state instead.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/talking-points or /app/talking-points and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST talking-points route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P0 - Dashboard (dashboard)

- Category: context
- AI route: dashboard-summary (7/12)
- Page: src/app/app/dashboard/page.tsx
- UI contract surface: yes; shared shell: no; output frame: no
- Output mode: dashboard
- Active generic/political path: yes
- Path membership: generic-core:core, generic-core:primary, political-officer:core, political-officer:primary, country-desk:core, mediator-envoy:core, humanitarian-access:core, legal-sanctions:core, political-risk:core, policy-research:core, media-disinformation:core, stabilization:core, election-governance:core
- Required context: analyst-profile, user-preferences, situation-record
- Graph mode: read; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Dashboard to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record.
- [ ] Connect output to graph backbone mode read; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review dashboard layout: one-line diagnosis, next-best action, source coverage, stale outputs, and no-config/no-data states.
- [ ] Add required-question preflight: What situation, geography, and time window should this view represent? / Which actors, sources, or documents are currently missing?
- [ ] Upgrade AI route from 7/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/dashboard or /app/dashboard and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST dashboard-summary route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P0 - Ask PRAXIS (assistant)

- Category: drafting
- AI route: chat (8/12)
- Page: src/app/app/assistant/page.tsx
- UI contract surface: no; shared shell: no; output frame: no
- Output mode: brief
- Active generic/political path: yes
- Path membership: generic-core:core, generic-core:primary, political-officer:core, political-officer:primary, country-desk:core, mediator-envoy:core, humanitarian-access:core, legal-sanctions:core, political-risk:core, policy-research:core, media-disinformation:core, stabilization:core, election-governance:core
- Required context: analyst-profile, user-preferences, situation-record, prior-tool-outputs, document-corpus, drafting-constraints
- Graph mode: read; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Ask PRAXIS to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, prior-tool-outputs, document-corpus, drafting-constraints.
- [ ] Connect output to graph backbone mode read; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Wire RegistryToolInfo so methodology, sources, operating contract, and related tools are visible.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Add required-question preflight: Who is the audience and what decision must the document support? / What stance, red lines, or policy constraints must the draft respect?
- [ ] Upgrade AI route from 8/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add trust controls: do not use training-data fallbacks for current legal/sanctions/research claims; show degraded/uncertain state instead.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/assistant or /app/assistant and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST chat route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P0 - Report Studio (report-studio)

- Category: drafting
- AI route: report (8/12)
- Page: src/app/app/reports/page.tsx
- UI contract surface: no; shared shell: no; output frame: no
- Output mode: brief, draft
- Active generic/political path: yes
- Path membership: generic-core:secondary
- Required context: analyst-profile, user-preferences, situation-record, prior-tool-outputs, document-corpus, drafting-constraints
- Graph mode: read; LibreOffice/document lane: yes

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Report Studio to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, prior-tool-outputs, document-corpus, drafting-constraints.
- [ ] Connect output to graph backbone mode read; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Prepare document-production lane for full report, export packet with structured sections that LibreOffice/DOCX/PDF export can render.
- [ ] Wire RegistryToolInfo so methodology, sources, operating contract, and related tools are visible.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Review drafting UI: section navigation, regenerate/rewrite actions, source/confidence panel, export, and audience/tone controls.
- [ ] Add required-question preflight: Who is the audience and what decision must the document support? / What stance, red lines, or policy constraints must the draft respect?
- [ ] Upgrade AI route from 8/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/reports or /app/reports and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST report route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P0 - Sources Library (sources-library)

- Category: context
- AI route: discover-sources (8/12)
- Page: src/app/app/sources/page.tsx
- UI contract surface: yes; shared shell: no; output frame: no
- Output mode: table, dashboard
- Active generic/political path: yes
- Path membership: generic-core:secondary, humanitarian-access:secondary, policy-research:secondary, media-disinformation:secondary
- Required context: analyst-profile, user-preferences, situation-record, source-library, live-web-research
- Graph mode: read; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Sources Library to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, source-library, live-web-research.
- [ ] Connect output to graph backbone mode read; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Review dashboard layout: one-line diagnosis, next-best action, source coverage, stale outputs, and no-config/no-data states.
- [ ] Add required-question preflight: What situation, geography, and time window should this view represent? / Which actors, sources, or documents are currently missing?
- [ ] Upgrade AI route from 8/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add trust controls: do not use training-data fallbacks for current legal/sanctions/research claims; show degraded/uncertain state instead.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/sources or /app/sources and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST discover-sources route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P0 - ARGUS Intelligence (argus)

- Category: intelligence
- AI route: argus (9/12)
- Page: src/app/app/argus/page.tsx
- UI contract surface: yes; shared shell: no; output frame: no
- Output mode: table, feed
- Active generic/political path: yes
- Path membership: generic-core:specialized, generic-core:premium-future, political-officer:specialized, political-officer:premium-future, country-desk:premium-future, mediator-envoy:premium-future, humanitarian-access:premium-future, legal-sanctions:premium-future, political-risk:premium-future, policy-research:primary, policy-research:premium-future, media-disinformation:primary, media-disinformation:premium-future, stabilization:premium-future, election-governance:premium-future
- Required context: analyst-profile, user-preferences, situation-record, source-library, live-web-research, graph-backbone
- Graph mode: read-write; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use ARGUS Intelligence to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, source-library, live-web-research, graph-backbone.
- [ ] Connect output to graph backbone mode read-write; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Review feed UI: source receipts, freshness, credibility, filters, saved-source actions, and empty/degraded states.
- [ ] Add required-question preflight: What intelligence question should collection answer? / Which source classes should be prioritized or excluded?
- [ ] Upgrade AI route from 9/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add trust controls: do not use training-data fallbacks for current legal/sanctions/research claims; show degraded/uncertain state instead.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/argus or /app/argus and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST argus route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P0 - Dossier Generator (dossier)

- Category: drafting
- AI route: dossier-generate (9/12)
- Page: src/app/app/dossier/page.tsx
- UI contract surface: no; shared shell: no; output frame: no
- Output mode: table, draft
- Active generic/political path: yes
- Path membership: political-officer:secondary, country-desk:secondary, policy-research:secondary
- Required context: analyst-profile, user-preferences, situation-record, prior-tool-outputs, document-corpus, drafting-constraints
- Graph mode: read; LibreOffice/document lane: yes

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Dossier Generator to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, prior-tool-outputs, document-corpus, drafting-constraints.
- [ ] Connect output to graph backbone mode read; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Prepare document-production lane for diplomatic dossier, actor dossier, case file with structured sections that LibreOffice/DOCX/PDF export can render.
- [ ] Wire RegistryToolInfo so methodology, sources, operating contract, and related tools are visible.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Review drafting UI: section navigation, regenerate/rewrite actions, source/confidence panel, export, and audience/tone controls.
- [ ] Add required-question preflight: Who is the audience and what decision must the document support? / What stance, red lines, or policy constraints must the draft respect?
- [ ] Upgrade AI route from 9/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/dossier or /app/dossier and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST dossier-generate route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P0 - Human Rights Monitor (human-rights)

- Category: analysis
- AI route: human-rights (9/12)
- Page: src/app/app/human-rights/page.tsx
- UI contract surface: yes; shared shell: no; output frame: no
- Output mode: table, scorecard
- Active generic/political path: no
- Path membership: generic-core:hidden-default, political-officer:hidden-default, humanitarian-access:secondary, legal-sanctions:primary
- Required context: analyst-profile, user-preferences, situation-record, prior-tool-outputs, document-corpus, drafting-constraints, graph-backbone
- Graph mode: read; LibreOffice/document lane: yes

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Human Rights Monitor to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, prior-tool-outputs, document-corpus, drafting-constraints, graph-backbone.
- [ ] Connect output to graph backbone mode read; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Prepare document-production lane for legal analysis note, compliance note with structured sections that LibreOffice/DOCX/PDF export can render.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Review scorecard graphics: driver decomposition, confidence per score, method note, and assumption-edit controls.
- [ ] Add required-question preflight: What decision or assessment will this analysis support? / What time horizon should the analysis use?
- [ ] Upgrade AI route from 9/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add trust controls: do not use training-data fallbacks for current legal/sanctions/research claims; show degraded/uncertain state instead.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/human-rights or /app/human-rights and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST human-rights route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P0 - Humanitarian (humanitarian)

- Category: context
- AI route: humanitarian (9/12)
- Page: src/app/app/humanitarian/page.tsx
- UI contract surface: no; shared shell: no; output frame: no
- Output mode: table, dashboard
- Active generic/political path: yes
- Path membership: generic-core:hidden-default, political-officer:specialized, humanitarian-access:primary, stabilization:secondary
- Required context: analyst-profile, user-preferences, situation-record
- Graph mode: read; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Humanitarian to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record.
- [ ] Connect output to graph backbone mode read; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Wire RegistryToolInfo so methodology, sources, operating contract, and related tools are visible.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Review dashboard layout: one-line diagnosis, next-best action, source coverage, stale outputs, and no-config/no-data states.
- [ ] Add required-question preflight: What situation, geography, and time window should this view represent? / Which actors, sources, or documents are currently missing?
- [ ] Upgrade AI route from 9/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/humanitarian or /app/humanitarian and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST humanitarian route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P0 - Legal & Resolution Tracker (legal-tracker)

- Category: intelligence
- AI route: legal-tracker (9/12)
- Page: src/app/app/legal-tracker/page.tsx
- UI contract surface: yes; shared shell: no; output frame: no
- Output mode: table, feed
- Active generic/political path: no
- Path membership: generic-core:hidden-default, political-officer:hidden-default, country-desk:secondary, legal-sanctions:primary, election-governance:secondary
- Required context: analyst-profile, user-preferences, situation-record, document-corpus, drafting-constraints, source-library, live-web-research
- Graph mode: read; LibreOffice/document lane: yes

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Legal & Resolution Tracker to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, document-corpus, drafting-constraints, source-library, live-web-research.
- [ ] Connect output to graph backbone mode read; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Prepare document-production lane for legal analysis note, compliance note with structured sections that LibreOffice/DOCX/PDF export can render.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Review feed UI: source receipts, freshness, credibility, filters, saved-source actions, and empty/degraded states.
- [ ] Add required-question preflight: What intelligence question should collection answer? / Which source classes should be prioritized or excluded?
- [ ] Upgrade AI route from 9/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add trust controls: do not use training-data fallbacks for current legal/sanctions/research claims; show degraded/uncertain state instead.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/legal-tracker or /app/legal-tracker and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST legal-tracker route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P0 - Media Roundup (media-roundup)

- Category: intelligence
- AI route: media-roundup (9/12)
- Page: src/app/app/media-roundup/page.tsx
- UI contract surface: no; shared shell: no; output frame: no
- Output mode: table, feed
- Active generic/political path: yes
- Path membership: political-officer:specialized, country-desk:secondary, humanitarian-access:secondary, political-risk:secondary, media-disinformation:primary, election-governance:secondary
- Required context: analyst-profile, user-preferences, situation-record, source-library, live-web-research
- Graph mode: read; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Media Roundup to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, source-library, live-web-research.
- [ ] Connect output to graph backbone mode read; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Wire RegistryToolInfo so methodology, sources, operating contract, and related tools are visible.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Review feed UI: source receipts, freshness, credibility, filters, saved-source actions, and empty/degraded states.
- [ ] Add required-question preflight: What intelligence question should collection answer? / Which source classes should be prioritized or excluded?
- [ ] Upgrade AI route from 9/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/media-roundup or /app/media-roundup and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST media-roundup route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P0 - Sanctions Tracker (sanctions)

- Category: intelligence
- AI route: sanctions-scan (9/12)
- Page: src/app/app/sanctions/page.tsx
- UI contract surface: yes; shared shell: no; output frame: no
- Output mode: table, feed
- Active generic/political path: yes
- Path membership: political-officer:specialized, country-desk:primary, legal-sanctions:primary, political-risk:primary
- Required context: analyst-profile, user-preferences, situation-record, document-corpus, drafting-constraints, source-library, live-web-research
- Graph mode: read; LibreOffice/document lane: yes

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Sanctions Tracker to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, document-corpus, drafting-constraints, source-library, live-web-research.
- [ ] Connect output to graph backbone mode read; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Prepare document-production lane for legal analysis note, compliance note with structured sections that LibreOffice/DOCX/PDF export can render.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Review feed UI: source receipts, freshness, credibility, filters, saved-source actions, and empty/degraded states.
- [ ] Add required-question preflight: What intelligence question should collection answer? / Which source classes should be prioritized or excluded?
- [ ] Upgrade AI route from 9/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add trust controls: do not use training-data fallbacks for current legal/sanctions/research claims; show degraded/uncertain state instead.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/sanctions or /app/sanctions and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST sanctions-scan route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P0 - Treaty Analyzer (treaty-analyzer)

- Category: intelligence
- AI route: treaty-analyze (9/12)
- Page: src/app/app/treaty-analyzer/page.tsx
- UI contract surface: yes; shared shell: yes; output frame: no
- Output mode: table, feed
- Active generic/political path: no
- Path membership: generic-core:hidden-default, political-officer:hidden-default, legal-sanctions:primary
- Required context: analyst-profile, user-preferences, situation-record, document-corpus, drafting-constraints, source-library, live-web-research
- Graph mode: read; LibreOffice/document lane: yes

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Treaty Analyzer to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, document-corpus, drafting-constraints, source-library, live-web-research.
- [ ] Connect output to graph backbone mode read; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Prepare document-production lane for legal analysis note, compliance note with structured sections that LibreOffice/DOCX/PDF export can render.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Review feed UI: source receipts, freshness, credibility, filters, saved-source actions, and empty/degraded states.
- [ ] Add required-question preflight: What intelligence question should collection answer? / Which source classes should be prioritized or excluded?
- [ ] Upgrade AI route from 9/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add trust controls: do not use training-data fallbacks for current legal/sanctions/research claims; show degraded/uncertain state instead.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/treaty-analyzer or /app/treaty-analyzer and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST treaty-analyze route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P0 - Documents (documents)

- Category: context
- AI route: /api/documents (n/a)
- Page: src/app/app/documents/page.tsx
- UI contract surface: yes; shared shell: no; output frame: no
- Output mode: table, dashboard
- Active generic/political path: yes
- Path membership: generic-core:core, generic-core:primary, political-officer:core, political-officer:primary, country-desk:core, mediator-envoy:core, humanitarian-access:core, legal-sanctions:core, legal-sanctions:secondary, political-risk:core, policy-research:core, policy-research:secondary, media-disinformation:core, stabilization:core, election-governance:core
- Required context: analyst-profile, user-preferences, situation-record, graph-backbone
- Graph mode: read-write; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Documents to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, graph-backbone.
- [ ] Connect output to graph backbone mode read-write; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Review dashboard layout: one-line diagnosis, next-best action, source coverage, stale outputs, and no-config/no-data states.
- [ ] Add required-question preflight: What situation, geography, and time window should this view represent? / Which actors, sources, or documents are currently missing?
- [ ] Confirm whether this tool should have an AI route; if yes, add calibrated route, schema, persistence, and smoke test.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/documents or /app/documents and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] No AI route check required unless this workspace tool becomes generative.
- [ ] Verify export/reload path reads the saved output with provenance.
### P0 - GraphOps (graphops)

- Category: context
- AI route: ops (n/a)
- Page: src/app/app/graphops/page.tsx
- UI contract surface: no; shared shell: no; output frame: no
- Output mode: table, dashboard
- Active generic/political path: yes
- Path membership: generic-core:core, generic-core:primary, political-officer:core, political-officer:primary, country-desk:core, mediator-envoy:core, humanitarian-access:core, legal-sanctions:core, political-risk:core, policy-research:core, media-disinformation:core, stabilization:core, election-governance:core
- Required context: analyst-profile, user-preferences, situation-record
- Graph mode: read; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use GraphOps to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record.
- [ ] Connect output to graph backbone mode read; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Wire RegistryToolInfo so methodology, sources, operating contract, and related tools are visible.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Review dashboard layout: one-line diagnosis, next-best action, source coverage, stale outputs, and no-config/no-data states.
- [ ] Add required-question preflight: What situation, geography, and time window should this view represent? / Which actors, sources, or documents are currently missing?
- [ ] Confirm whether this tool should have an AI route; if yes, add calibrated route, schema, persistence, and smoke test.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/graphops or /app/graphops and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST ops route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P1 - Brief Builder (brief-builder)

- Category: drafting
- AI route: brief-builder (6/12)
- Page: missing
- UI contract surface: no; shared shell: no; output frame: no
- Output mode: table, draft
- Active generic/political path: no
- Path membership: none
- Required context: analyst-profile, user-preferences, situation-record, prior-tool-outputs, document-corpus, drafting-constraints
- Graph mode: read; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Brief Builder to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, prior-tool-outputs, document-corpus, drafting-constraints.
- [ ] Connect output to graph backbone mode read; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Wire RegistryToolInfo so methodology, sources, operating contract, and related tools are visible.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Review drafting UI: section navigation, regenerate/rewrite actions, source/confidence panel, export, and audience/tone controls.
- [ ] Add required-question preflight: Who is the audience and what decision must the document support? / What stance, red lines, or policy constraints must the draft respect?
- [ ] Upgrade AI route from 6/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/brief-builder or /app/brief-builder and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST brief-builder route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P1 - ARGUS Grounded (deep-research)

- Category: intelligence
- AI route: deep-research (6/12)
- Page: missing
- UI contract surface: no; shared shell: no; output frame: no
- Output mode: brief, feed
- Active generic/political path: no
- Path membership: none
- Required context: analyst-profile, user-preferences, situation-record, source-library, live-web-research
- Graph mode: read; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use ARGUS Grounded to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, source-library, live-web-research.
- [ ] Connect output to graph backbone mode read; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Wire RegistryToolInfo so methodology, sources, operating contract, and related tools are visible.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Review feed UI: source receipts, freshness, credibility, filters, saved-source actions, and empty/degraded states.
- [ ] Add required-question preflight: What intelligence question should collection answer? / Which source classes should be prioritized or excluded?
- [ ] Upgrade AI route from 6/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/deep-research or /app/deep-research and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST deep-research route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P1 - Red-Team Review (red-team-review)

- Category: analysis
- AI route: red-team-review (6/12)
- Page: missing
- UI contract surface: no; shared shell: no; output frame: no
- Output mode: table, scorecard
- Active generic/political path: no
- Path membership: media-disinformation:primary
- Required context: analyst-profile, user-preferences, situation-record, prior-tool-outputs, graph-backbone
- Graph mode: read; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Red-Team Review to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, prior-tool-outputs, graph-backbone.
- [ ] Connect output to graph backbone mode read; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Wire RegistryToolInfo so methodology, sources, operating contract, and related tools are visible.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Review scorecard graphics: driver decomposition, confidence per score, method note, and assumption-edit controls.
- [ ] Add required-question preflight: What decision or assessment will this analysis support? / What time horizon should the analysis use?
- [ ] Upgrade AI route from 6/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/red-team-review or /app/red-team-review and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST red-team-review route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P1 - Stakeholder Map (stakeholder-map)

- Category: analysis
- AI route: stakeholder-map (8/12)
- Page: src/app/app/stakeholder-map/page.tsx
- UI contract surface: yes; shared shell: no; output frame: no
- Output mode: graph
- Active generic/political path: yes
- Path membership: generic-core:core, generic-core:primary, political-officer:core, political-officer:primary, country-desk:core, mediator-envoy:core, mediator-envoy:primary, humanitarian-access:core, legal-sanctions:core, political-risk:core, policy-research:core, media-disinformation:core, stabilization:core, stabilization:primary, election-governance:core
- Required context: analyst-profile, user-preferences, situation-record, prior-tool-outputs, graph-backbone
- Graph mode: read-write; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Stakeholder Map to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, prior-tool-outputs, graph-backbone.
- [ ] Connect output to graph backbone mode read-write; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review graph graphics: node labels, edge meaning, centrality/cluster legend, click-to-edit details, and missing-link prompts.
- [ ] Add required-question preflight: What decision or assessment will this analysis support? / What time horizon should the analysis use?
- [ ] Upgrade AI route from 8/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/stakeholder-map or /app/stakeholder-map and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST stakeholder-map route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P1 - Actor Profiles (actor-profiles)

- Category: analysis
- AI route: actor-profiles (9/12)
- Page: src/app/app/actors/page.tsx
- UI contract surface: yes; shared shell: no; output frame: no
- Output mode: table, scorecard
- Active generic/political path: yes
- Path membership: political-officer:secondary, country-desk:primary, mediator-envoy:secondary, humanitarian-access:primary, media-disinformation:secondary, election-governance:primary
- Required context: analyst-profile, user-preferences, situation-record, prior-tool-outputs, graph-backbone
- Graph mode: read-write; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Actor Profiles to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, prior-tool-outputs, graph-backbone.
- [ ] Connect output to graph backbone mode read-write; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Review scorecard graphics: driver decomposition, confidence per score, method note, and assumption-edit controls.
- [ ] Add required-question preflight: What decision or assessment will this analysis support? / What time horizon should the analysis use?
- [ ] Upgrade AI route from 9/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/actors or /app/actors and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST actor-profiles route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P1 - Brainstorming Table (brainstorming-table)

- Category: simulation
- AI route: brainstorming-table (9/12)
- Page: src/app/app/brainstorming-table/page.tsx
- UI contract surface: yes; shared shell: no; output frame: yes
- Output mode: table, table
- Active generic/political path: yes
- Path membership: generic-core:specialized, generic-core:premium-future, political-officer:secondary, political-officer:premium-future, country-desk:premium-future, mediator-envoy:primary, mediator-envoy:premium-future, humanitarian-access:premium-future, legal-sanctions:premium-future, political-risk:premium-future, policy-research:primary, policy-research:premium-future, media-disinformation:premium-future, stabilization:premium-future, election-governance:premium-future
- Required context: analyst-profile, user-preferences, situation-record, prior-tool-outputs, graph-backbone
- Graph mode: none; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Brainstorming Table to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, prior-tool-outputs, graph-backbone.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Add required-question preflight: Which actors and choices should the model include? / Which assumptions should be stress-tested?
- [ ] Upgrade AI route from 9/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/brainstorming-table or /app/brainstorming-table and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST brainstorming-table route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P1 - Early Warning (early-warning)

- Category: analysis
- AI route: escalation-scan (9/12)
- Page: src/app/app/early-warning/page.tsx
- UI contract surface: yes; shared shell: yes; output frame: no
- Output mode: scorecard
- Active generic/political path: yes
- Path membership: generic-core:secondary, political-officer:secondary, humanitarian-access:primary, political-risk:secondary, election-governance:primary
- Required context: analyst-profile, user-preferences, situation-record, prior-tool-outputs, graph-backbone
- Graph mode: read; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Early Warning to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, prior-tool-outputs, graph-backbone.
- [ ] Connect output to graph backbone mode read; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review scorecard graphics: driver decomposition, confidence per score, method note, and assumption-edit controls.
- [ ] Add required-question preflight: What decision or assessment will this analysis support? / What time horizon should the analysis use?
- [ ] Upgrade AI route from 9/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/early-warning or /app/early-warning and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST escalation-scan route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P1 - Geospatial Monitor (geospatial-monitor)

- Category: intelligence
- AI route: geospatial (9/12)
- Page: src/app/app/geospatial-monitor/page.tsx
- UI contract surface: yes; shared shell: no; output frame: no
- Output mode: map
- Active generic/political path: yes
- Path membership: political-officer:specialized, humanitarian-access:primary, political-risk:secondary
- Required context: analyst-profile, user-preferences, situation-record, source-library, live-web-research
- Graph mode: read; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Geospatial Monitor to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, source-library, live-web-research.
- [ ] Connect output to graph backbone mode read; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review map graphics: location precision, empty map state, hotspot legend, source/freshness badges, and click-through event details.
- [ ] Add required-question preflight: What intelligence question should collection answer? / Which source classes should be prioritized or excluded?
- [ ] Upgrade AI route from 9/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/geospatial-monitor or /app/geospatial-monitor and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST geospatial route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P1 - Info Environment (info-environment)

- Category: analysis
- AI route: info-environment (9/12)
- Page: src/app/app/info-environment/page.tsx
- UI contract surface: yes; shared shell: no; output frame: no
- Output mode: table, scorecard
- Active generic/political path: yes
- Path membership: political-officer:specialized, media-disinformation:primary, election-governance:secondary
- Required context: analyst-profile, user-preferences, situation-record, prior-tool-outputs, source-library, live-web-research, graph-backbone
- Graph mode: read; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Info Environment to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, prior-tool-outputs, source-library, live-web-research, graph-backbone.
- [ ] Connect output to graph backbone mode read; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Review scorecard graphics: driver decomposition, confidence per score, method note, and assumption-edit controls.
- [ ] Add required-question preflight: What decision or assessment will this analysis support? / What time horizon should the analysis use?
- [ ] Upgrade AI route from 9/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/info-environment or /app/info-environment and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST info-environment route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P1 - Risk Monitor (risk-monitor)

- Category: analysis
- AI route: risk-assessment (9/12)
- Page: src/app/app/risk-monitor/page.tsx
- UI contract surface: yes; shared shell: no; output frame: no
- Output mode: table, scorecard
- Active generic/political path: yes
- Path membership: generic-core:secondary, political-officer:primary, country-desk:secondary, humanitarian-access:primary, political-risk:primary, stabilization:primary
- Required context: analyst-profile, user-preferences, situation-record, prior-tool-outputs, graph-backbone
- Graph mode: read; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Risk Monitor to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, prior-tool-outputs, graph-backbone.
- [ ] Connect output to graph backbone mode read; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Review scorecard graphics: driver decomposition, confidence per score, method note, and assumption-edit controls.
- [ ] Add required-question preflight: What decision or assessment will this analysis support? / What time horizon should the analysis use?
- [ ] Upgrade AI route from 9/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/risk-monitor or /app/risk-monitor and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST risk-assessment route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.

## Remaining Tools

### P1 - Timeline (timeline)

- Category: context
- AI route: risk-assessment (9/12)
- Page: src/app/app/timeline/page.tsx
- UI contract surface: yes; shared shell: no; output frame: no
- Output mode: timeline
- Active generic/political path: yes
- Path membership: generic-core:core, generic-core:primary, political-officer:core, political-officer:primary, country-desk:core, mediator-envoy:core, humanitarian-access:core, legal-sanctions:core, political-risk:core, policy-research:core, media-disinformation:core, stabilization:core, election-governance:core
- Required context: analyst-profile, user-preferences, situation-record, graph-backbone
- Graph mode: read-write; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Timeline to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, graph-backbone.
- [ ] Connect output to graph backbone mode read-write; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review timeline graphics: causal arrows, event confidence, date uncertainty, source fragments, and add/correct event affordances.
- [ ] Add required-question preflight: What situation, geography, and time window should this view represent? / Which actors, sources, or documents are currently missing?
- [ ] Upgrade AI route from 9/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/timeline or /app/timeline and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST risk-assessment route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P1 - Alert Center (alert-center)

- Category: intelligence
- AI route: check-alerts (n/a)
- Page: missing
- UI contract surface: no; shared shell: no; output frame: no
- Output mode: table, feed
- Active generic/political path: no
- Path membership: generic-core:hidden-default, political-officer:hidden-default
- Required context: analyst-profile, user-preferences, situation-record, source-library, live-web-research
- Graph mode: read; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Alert Center to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, source-library, live-web-research.
- [ ] Connect output to graph backbone mode read; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Wire RegistryToolInfo so methodology, sources, operating contract, and related tools are visible.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Review feed UI: source receipts, freshness, credibility, filters, saved-source actions, and empty/degraded states.
- [ ] Add required-question preflight: What intelligence question should collection answer? / Which source classes should be prioritized or excluded?
- [ ] Confirm whether this tool should have an AI route; if yes, add calibrated route, schema, persistence, and smoke test.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/alert-center or /app/alert-center and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST check-alerts route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P1 - Case Library (cases)

- Category: workspace
- AI route: conflicts (n/a)
- Page: src/app/app/cases/page.tsx
- UI contract surface: yes; shared shell: no; output frame: no
- Output mode: table, workspace
- Active generic/political path: no
- Path membership: none
- Required context: analyst-profile, user-preferences, situation-record, team-workspace
- Graph mode: none; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Case Library to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, team-workspace.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Add required-question preflight: What workspace object or setting is being managed? / Who can view, change, or export this object?
- [ ] Confirm whether this tool should have an AI route; if yes, add calibrated route, schema, persistence, and smoke test.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/cases or /app/cases and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST conflicts route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P1 - Settings (settings)

- Category: workspace
- AI route: ai (n/a)
- Page: src/app/app/settings/page.tsx
- UI contract surface: no; shared shell: no; output frame: no
- Output mode: table, workspace
- Active generic/political path: no
- Path membership: generic-core:hidden-default, political-officer:hidden-default, country-desk:hidden-default, mediator-envoy:hidden-default, humanitarian-access:hidden-default, legal-sanctions:hidden-default, political-risk:hidden-default, policy-research:hidden-default, media-disinformation:hidden-default, stabilization:hidden-default, election-governance:hidden-default
- Required context: analyst-profile, user-preferences, situation-record, team-workspace
- Graph mode: none; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Settings to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, team-workspace.
- [ ] Wire RegistryToolInfo so methodology, sources, operating contract, and related tools are visible.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Add required-question preflight: What workspace object or setting is being managed? / Who can view, change, or export this object?
- [ ] Confirm whether this tool should have an AI route; if yes, add calibrated route, schema, persistence, and smoke test.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/settings or /app/settings and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST ai route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P1 - Source Monitor (source-monitor)

- Category: intelligence
- AI route: intelligence (n/a)
- Page: src/app/app/source-monitor/page.tsx
- UI contract surface: no; shared shell: no; output frame: no
- Output mode: table, feed
- Active generic/political path: no
- Path membership: generic-core:hidden-default, political-officer:hidden-default
- Required context: analyst-profile, user-preferences, situation-record, source-library, live-web-research
- Graph mode: read; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Source Monitor to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, source-library, live-web-research.
- [ ] Connect output to graph backbone mode read; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Wire RegistryToolInfo so methodology, sources, operating contract, and related tools are visible.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Review feed UI: source receipts, freshness, credibility, filters, saved-source actions, and empty/degraded states.
- [ ] Add required-question preflight: What intelligence question should collection answer? / Which source classes should be prioritized or excluded?
- [ ] Confirm whether this tool should have an AI route; if yes, add calibrated route, schema, persistence, and smoke test.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/source-monitor or /app/source-monitor and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST intelligence route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P1 - Team Hub (team)

- Category: workspace
- AI route:  (n/a)
- Page: src/app/app/team/page.tsx
- UI contract surface: no; shared shell: no; output frame: no
- Output mode: table, workspace
- Active generic/political path: no
- Path membership: generic-core:hidden-default, political-officer:hidden-default, country-desk:hidden-default, mediator-envoy:hidden-default, humanitarian-access:hidden-default, legal-sanctions:hidden-default, political-risk:hidden-default, policy-research:hidden-default, media-disinformation:hidden-default, stabilization:hidden-default, election-governance:hidden-default
- Required context: analyst-profile, user-preferences, situation-record, team-workspace
- Graph mode: none; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Team Hub to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, team-workspace.
- [ ] Wire RegistryToolInfo so methodology, sources, operating contract, and related tools are visible.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Add required-question preflight: What workspace object or setting is being managed? / Who can view, change, or export this object?
- [ ] Confirm whether this tool should have an AI route; if yes, add calibrated route, schema, persistence, and smoke test.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/team or /app/team and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST  route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P2 - Calendar Monitor (calendar)

- Category: context
- AI route: chat (8/12)
- Page: src/app/app/calendar/page.tsx
- UI contract surface: yes; shared shell: no; output frame: no
- Output mode: table, dashboard
- Active generic/political path: no
- Path membership: none
- Required context: analyst-profile, user-preferences, situation-record
- Graph mode: read; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Calendar Monitor to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record.
- [ ] Connect output to graph backbone mode read; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Review dashboard layout: one-line diagnosis, next-best action, source coverage, stale outputs, and no-config/no-data states.
- [ ] Add required-question preflight: What situation, geography, and time window should this view represent? / Which actors, sources, or documents are currently missing?
- [ ] Upgrade AI route from 8/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/calendar or /app/calendar and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST chat route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P2 - Compare (compare)

- Category: analysis
- AI route: chat (8/12)
- Page: src/app/app/compare/page.tsx
- UI contract surface: yes; shared shell: no; output frame: no
- Output mode: table, scorecard
- Active generic/political path: no
- Path membership: generic-core:hidden-default, political-officer:hidden-default, policy-research:secondary
- Required context: analyst-profile, user-preferences, situation-record, prior-tool-outputs, graph-backbone
- Graph mode: read; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Compare to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, prior-tool-outputs, graph-backbone.
- [ ] Connect output to graph backbone mode read; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Review scorecard graphics: driver decomposition, confidence per score, method note, and assumption-edit controls.
- [ ] Add required-question preflight: What decision or assessment will this analysis support? / What time horizon should the analysis use?
- [ ] Upgrade AI route from 8/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/compare or /app/compare and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST chat route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P2 - Advisory Council (advisory)

- Category: workspace
- AI route: advisory (9/12)
- Page: src/app/app/advisory/page.tsx
- UI contract surface: yes; shared shell: no; output frame: yes
- Output mode: brief, workspace
- Active generic/political path: no
- Path membership: generic-core:hidden-default, political-officer:hidden-default, country-desk:hidden-default, mediator-envoy:hidden-default, humanitarian-access:hidden-default, legal-sanctions:hidden-default, political-risk:hidden-default, policy-research:hidden-default, media-disinformation:hidden-default, stabilization:hidden-default, election-governance:hidden-default
- Required context: analyst-profile, user-preferences, situation-record, team-workspace
- Graph mode: none; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Advisory Council to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, team-workspace.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Add required-question preflight: What workspace object or setting is being managed? / Who can view, change, or export this object?
- [ ] Upgrade AI route from 9/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/advisory or /app/advisory and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST advisory route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P2 - Commitment Tracker (commitments)

- Category: intelligence
- AI route: commitment-scan (9/12)
- Page: src/app/app/commitments/page.tsx
- UI contract surface: yes; shared shell: no; output frame: no
- Output mode: table, feed
- Active generic/political path: no
- Path membership: mediator-envoy:primary, humanitarian-access:secondary, legal-sanctions:secondary, stabilization:primary
- Required context: analyst-profile, user-preferences, situation-record, source-library, live-web-research
- Graph mode: read; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Commitment Tracker to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, source-library, live-web-research.
- [ ] Connect output to graph backbone mode read; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Review feed UI: source receipts, freshness, credibility, filters, saved-source actions, and empty/degraded states.
- [ ] Add required-question preflight: What intelligence question should collection answer? / Which source classes should be prioritized or excluded?
- [ ] Upgrade AI route from 9/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/commitments or /app/commitments and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST commitment-scan route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P2 - CONCORDIA (concordia)

- Category: simulation
- AI route: mediation-design (9/12)
- Page: src/app/app/concordia/page.tsx
- UI contract surface: yes; shared shell: no; output frame: no
- Output mode: brief, table
- Active generic/political path: no
- Path membership: generic-core:hidden-default, political-officer:hidden-default, mediator-envoy:secondary
- Required context: analyst-profile, user-preferences, situation-record, prior-tool-outputs, graph-backbone
- Graph mode: none; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use CONCORDIA to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, prior-tool-outputs, graph-backbone.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Add required-question preflight: Which actors and choices should the model include? / Which assumptions should be stress-tested?
- [ ] Upgrade AI route from 9/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/concordia or /app/concordia and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST mediation-design route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P2 - Economic Impact (economic-impact)

- Category: analysis
- AI route: economic-impact (9/12)
- Page: src/app/app/economic-impact/page.tsx
- UI contract surface: yes; shared shell: no; output frame: no
- Output mode: table, scorecard
- Active generic/political path: no
- Path membership: generic-core:hidden-default, political-officer:hidden-default, country-desk:secondary, political-risk:primary, stabilization:secondary
- Required context: analyst-profile, user-preferences, situation-record, prior-tool-outputs, graph-backbone
- Graph mode: read; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Economic Impact to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, prior-tool-outputs, graph-backbone.
- [ ] Connect output to graph backbone mode read; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Review scorecard graphics: driver decomposition, confidence per score, method note, and assumption-edit controls.
- [ ] Add required-question preflight: What decision or assessment will this analysis support? / What time horizon should the analysis use?
- [ ] Upgrade AI route from 9/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/economic-impact or /app/economic-impact and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST economic-impact route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P2 - Electoral Violence Risk (electoral-risk)

- Category: analysis
- AI route: electoral-risk (9/12)
- Page: src/app/app/electoral-risk/page.tsx
- UI contract surface: yes; shared shell: no; output frame: no
- Output mode: table, scorecard
- Active generic/political path: no
- Path membership: generic-core:hidden-default, political-officer:hidden-default, election-governance:primary
- Required context: analyst-profile, user-preferences, situation-record, prior-tool-outputs, graph-backbone
- Graph mode: read; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Electoral Violence Risk to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, prior-tool-outputs, graph-backbone.
- [ ] Connect output to graph backbone mode read; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Review scorecard graphics: driver decomposition, confidence per score, method note, and assumption-edit controls.
- [ ] Add required-question preflight: What decision or assessment will this analysis support? / What time horizon should the analysis use?
- [ ] Upgrade AI route from 9/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/electoral-risk or /app/electoral-risk and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST electoral-risk route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P2 - External Actor Monitor (external-actors)

- Category: intelligence
- AI route: external-actors (9/12)
- Page: src/app/app/external-actors/page.tsx
- UI contract surface: yes; shared shell: no; output frame: no
- Output mode: table, feed
- Active generic/political path: no
- Path membership: generic-core:hidden-default, political-officer:hidden-default, country-desk:primary, political-risk:secondary, media-disinformation:secondary
- Required context: analyst-profile, user-preferences, situation-record, source-library, live-web-research
- Graph mode: read; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use External Actor Monitor to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, source-library, live-web-research.
- [ ] Connect output to graph backbone mode read; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Review feed UI: source receipts, freshness, credibility, filters, saved-source actions, and empty/degraded states.
- [ ] Add required-question preflight: What intelligence question should collection answer? / Which source classes should be prioritized or excluded?
- [ ] Upgrade AI route from 9/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/external-actors or /app/external-actors and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST external-actors route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P2 - Game Theory (game-theory)

- Category: simulation
- AI route: game-theory (9/12)
- Page: src/app/app/game-theory/page.tsx
- UI contract surface: yes; shared shell: no; output frame: no
- Output mode: table, table
- Active generic/political path: no
- Path membership: generic-core:hidden-default, political-officer:hidden-default, mediator-envoy:secondary
- Required context: analyst-profile, user-preferences, situation-record, prior-tool-outputs, graph-backbone
- Graph mode: none; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Game Theory to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, prior-tool-outputs, graph-backbone.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Add required-question preflight: Which actors and choices should the model include? / Which assumptions should be stress-tested?
- [ ] Upgrade AI route from 9/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/game-theory or /app/game-theory and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST game-theory route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P2 - Media Compass (media-compass)

- Category: intelligence
- AI route: media-analyze (9/12)
- Page: src/app/app/media-compass/page.tsx
- UI contract surface: yes; shared shell: no; output frame: no
- Output mode: table, feed
- Active generic/political path: no
- Path membership: media-disinformation:primary
- Required context: analyst-profile, user-preferences, situation-record, source-library, live-web-research
- Graph mode: read; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Media Compass to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, source-library, live-web-research.
- [ ] Connect output to graph backbone mode read; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Review feed UI: source receipts, freshness, credibility, filters, saved-source actions, and empty/degraded states.
- [ ] Add required-question preflight: What intelligence question should collection answer? / Which source classes should be prioritized or excluded?
- [ ] Upgrade AI route from 9/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/media-compass or /app/media-compass and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST media-analyze route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P2 - Mediation Designer (mediation-design)

- Category: simulation
- AI route: mediation-design (9/12)
- Page: src/app/app/mediation-design/page.tsx
- UI contract surface: yes; shared shell: no; output frame: no
- Output mode: table, table
- Active generic/political path: no
- Path membership: generic-core:hidden-default, political-officer:hidden-default, mediator-envoy:primary, stabilization:secondary
- Required context: analyst-profile, user-preferences, situation-record, prior-tool-outputs, document-corpus, drafting-constraints, graph-backbone
- Graph mode: none; LibreOffice/document lane: yes

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Mediation Designer to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, prior-tool-outputs, document-corpus, drafting-constraints, graph-backbone.
- [ ] Prepare document-production lane for draft artifact with structured sections that LibreOffice/DOCX/PDF export can render.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Add required-question preflight: Which actors and choices should the model include? / Which assumptions should be stress-tested?
- [ ] Upgrade AI route from 9/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/mediation-design or /app/mediation-design and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST mediation-design route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P2 - Negotiation Prep (negotiation-prep)

- Category: simulation
- AI route: negotiation (9/12)
- Page: src/app/app/negotiation-prep/page.tsx
- UI contract surface: yes; shared shell: no; output frame: no
- Output mode: table, table
- Active generic/political path: no
- Path membership: generic-core:hidden-default, political-officer:hidden-default, mediator-envoy:primary
- Required context: analyst-profile, user-preferences, situation-record, prior-tool-outputs, graph-backbone
- Graph mode: none; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Negotiation Prep to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, prior-tool-outputs, graph-backbone.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Add required-question preflight: Which actors and choices should the model include? / Which assumptions should be stress-tested?
- [ ] Upgrade AI route from 9/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/negotiation-prep or /app/negotiation-prep and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST negotiation route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P2 - Peacebuilding Index (peacebuilding-index)

- Category: analysis
- AI route: peacebuilding-index (9/12)
- Page: src/app/app/peacebuilding-index/page.tsx
- UI contract surface: yes; shared shell: no; output frame: no
- Output mode: table, scorecard
- Active generic/political path: no
- Path membership: generic-core:hidden-default, political-officer:hidden-default, stabilization:primary
- Required context: analyst-profile, user-preferences, situation-record, prior-tool-outputs, graph-backbone
- Graph mode: read; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Peacebuilding Index to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, prior-tool-outputs, graph-backbone.
- [ ] Connect output to graph backbone mode read; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Review scorecard graphics: driver decomposition, confidence per score, method note, and assumption-edit controls.
- [ ] Add required-question preflight: What decision or assessment will this analysis support? / What time horizon should the analysis use?
- [ ] Upgrade AI route from 9/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/peacebuilding-index or /app/peacebuilding-index and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST peacebuilding-index route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P2 - Power Map (power-map)

- Category: analysis
- AI route: power-map (9/12)
- Page: src/app/app/power-map/page.tsx
- UI contract surface: yes; shared shell: no; output frame: no
- Output mode: table, scorecard
- Active generic/political path: no
- Path membership: generic-core:hidden-default, political-officer:hidden-default, mediator-envoy:secondary
- Required context: analyst-profile, user-preferences, situation-record, prior-tool-outputs, graph-backbone
- Graph mode: read; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Power Map to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, prior-tool-outputs, graph-backbone.
- [ ] Connect output to graph backbone mode read; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Review scorecard graphics: driver decomposition, confidence per score, method note, and assumption-edit controls.
- [ ] Add required-question preflight: What decision or assessment will this analysis support? / What time horizon should the analysis use?
- [ ] Upgrade AI route from 9/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/power-map or /app/power-map and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST power-map route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P2 - Scenario Planner (scenarios)

- Category: simulation
- AI route: scenario (9/12)
- Page: src/app/app/scenarios/page.tsx
- UI contract surface: yes; shared shell: no; output frame: no
- Output mode: brief, table
- Active generic/political path: no
- Path membership: political-risk:primary
- Required context: analyst-profile, user-preferences, situation-record, prior-tool-outputs, graph-backbone
- Graph mode: none; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Scenario Planner to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, prior-tool-outputs, graph-backbone.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Add required-question preflight: Which actors and choices should the model include? / Which assumptions should be stress-tested?
- [ ] Upgrade AI route from 9/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/scenarios or /app/scenarios and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST scenario route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P2 - UN Toolkit (un-toolkit)

- Category: drafting
- AI route: un-toolkit (9/12)
- Page: src/app/app/un-toolkit/page.tsx
- UI contract surface: yes; shared shell: no; output frame: no
- Output mode: table, draft
- Active generic/political path: no
- Path membership: generic-core:hidden-default, political-officer:hidden-default, legal-sanctions:secondary
- Required context: analyst-profile, user-preferences, situation-record, prior-tool-outputs, document-corpus, drafting-constraints
- Graph mode: read; LibreOffice/document lane: yes

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use UN Toolkit to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, prior-tool-outputs, document-corpus, drafting-constraints.
- [ ] Connect output to graph backbone mode read; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Prepare document-production lane for draft clauses, mandate language, UN note with structured sections that LibreOffice/DOCX/PDF export can render.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Review drafting UI: section navigation, regenerate/rewrite actions, source/confidence panel, export, and audience/tone controls.
- [ ] Add required-question preflight: Who is the audience and what decision must the document support? / What stance, red lines, or policy constraints must the draft respect?
- [ ] Upgrade AI route from 9/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/un-toolkit or /app/un-toolkit and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST un-toolkit route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P3 - Daily Brief (auto-briefings)

- Category: drafting
- AI route: auto-briefing (10/12)
- Page: src/app/app/auto-briefings/page.tsx
- UI contract surface: yes; shared shell: no; output frame: no
- Output mode: table, draft
- Active generic/political path: no
- Path membership: none
- Required context: analyst-profile, user-preferences, situation-record, prior-tool-outputs, document-corpus, drafting-constraints
- Graph mode: read; LibreOffice/document lane: no

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Daily Brief to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, prior-tool-outputs, document-corpus, drafting-constraints.
- [ ] Connect output to graph backbone mode read; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Review drafting UI: section navigation, regenerate/rewrite actions, source/confidence panel, export, and audience/tone controls.
- [ ] Add required-question preflight: Who is the audience and what decision must the document support? / What stance, red lines, or policy constraints must the draft respect?
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/auto-briefings or /app/auto-briefings and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST auto-briefing route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.
### P3 - Briefing Room (briefing)

- Category: drafting
- AI route: briefing-generate (10/12)
- Page: src/app/app/briefing/page.tsx
- UI contract surface: yes; shared shell: no; output frame: no
- Output mode: brief, draft
- Active generic/political path: yes
- Path membership: generic-core:core, generic-core:primary, political-officer:core, political-officer:primary, country-desk:core, country-desk:primary, mediator-envoy:core, humanitarian-access:core, humanitarian-access:primary, legal-sanctions:core, legal-sanctions:primary, political-risk:core, political-risk:primary, policy-research:core, policy-research:primary, media-disinformation:core, media-disinformation:secondary, stabilization:core, stabilization:primary, election-governance:core, election-governance:primary
- Required context: analyst-profile, user-preferences, situation-record, prior-tool-outputs, document-corpus, drafting-constraints
- Graph mode: read; LibreOffice/document lane: yes

To do:
- [ ] Clarify tool purpose in the page header: Help a policy or intelligence user use Briefing Room to turn the active situation into a concrete, reviewable work product.
- [ ] Wire the shared context blueprint: required layers are analyst-profile, user-preferences, situation-record, prior-tool-outputs, document-corpus, drafting-constraints.
- [ ] Connect output to graph backbone mode read; future-proof for Dialectica ontology-backed retrieval/proposals.
- [ ] Prepare document-production lane for intelligence briefing, daily read, situation brief with structured sections that LibreOffice/DOCX/PDF export can render.
- [ ] Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.
- [ ] Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.
- [ ] Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.
- [ ] Review drafting UI: section navigation, regenerate/rewrite actions, source/confidence panel, export, and audience/tone controls.
- [ ] Add required-question preflight: Who is the audience and what decision must the document support? / What stance, red lines, or policy constraints must the draft respect?
- [ ] Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.
- [ ] Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.

Verification:
- [ ] Open /demo/briefing or /app/briefing and verify header, operating contract, loading, empty, error, and generated states.
- [ ] Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.
- [ ] POST briefing-generate route with a realistic situation fixture and verify non-empty, schema-valid output.
- [ ] Verify export/reload path reads the saved output with provenance.

## Regeneration

Run `npm run generate:tool-backlog` after changing the registry, contracts, pages, or route audits.