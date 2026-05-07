# PRAXIS Purpose Audit — 2026-05-07

## TL;DR

Audited 84 visible surface elements across the four substrate Tabs, seven Chapters, Settings, empty/loading/error states, menus, and copy. Current disposition: 7 Remove, 9 Simplify, 6 Consolidate, 12 Keep-after-review. The top recommendations are: remove implementation narration from analyst-facing surfaces, collapse duplicate source/claim actions into canonical Tabs, and reduce dense marketplaces/settings panels to the few actions an analyst actually needs first. PR 1 pure removals started in this pass and removed three low-risk elements.

## Method

Every element was checked against the five-question test from `PURPOSE_AUDIT_PROMPT.md`: analyst job, measurable use signal, click/result trace, removal harm, and first-time-user message. Findings are bucketed as Remove, Simplify, or Consolidate. Risk is the expected product or data impact of changing the element.

## Findings: Remove (7)

| ID | Location | Element | Why fail | Risk | Scope |
|----|----------|---------|----------|------|-------|
| R-01 | `src/components/workbench/ContextTab.tsx` | "Context storage contract" panel | Fails Q1/Q5: explains implementation and backend follow-up work to the analyst; no analyst job. Removed in this pass. | low | 1 file |
| R-02 | `src/components/workbench/LibraryTab.tsx` | "Save case-frame claim" button | Fails Q3/Q4: duplicates Context/Ontology claim workflow and creates a claim from a frame, not a source. Removed in this pass. | low | 1 file |
| R-03 | `src/components/workbench/draft/DraftTab.tsx` | Decorative badges: "Redaction aware", "Manifest embedded", "DOCX/PDF/Markdown" | Fails Q2/Q4: status decoration, not an action; export controls already communicate format. Removed in this pass. | low | 1 file |
| R-04 | `src/components/app/debug-panel.tsx` | User-visible debug/credit controls in normal app shell | Fails Q1/Q5 for non-admin analysts; should be admin/operator-only. | medium | 2 files |
| R-05 | `src/components/syria/ask-praxis.tsx` | Copy naming a specific practitioner identity in generic assistant explainer | Fails Q5 outside a case-specific demo; conflicts with recent no-institution-copy direction. | low | 1 file |
| R-06 | `src/components/briefing/brief-blocks-panel.tsx` | Audience placeholder examples naming specific institutions | Fails Q5; should be neutral and case-owned unless source-specific. | low | 1 file |
| R-07 | `src/app/app/tools/page.tsx` | Archived specialist-tool explanation shown before active work | Fails Q4 for first-time users; archived tools should stay behind disclosure. | low | 1 file |

## Findings: Simplify (9)

| ID | Location | Element | Current | Proposed | Risk |
|----|----------|---------|---------|----------|------|
| S-01 | `src/components/workbench/LibraryTab.tsx` | Five artifact type filters | Sources, documents, saved claims, memo versions, exports all equal weight | Default to source/document; move claims/memos/exports behind "other artifacts" | medium |
| S-02 | `src/tabs/ontology/OntologyTab.tsx` | Ontology Schema Viewer as full tab | Schema reference instead of candidate-review workbench | Keep schema as side drawer; tab default is candidates/promotions | medium |
| S-03 | `src/components/graph/PraxisGraphView.tsx` | Multiple graph layout controls | Layout options appear before usage evidence | Keep force/timeline visible; move rare layouts under filters | low |
| S-04 | `src/components/workbench/ResearchTab.tsx` | Source Scout + Research threads in one pane | Two jobs compete: discover sources vs. recall/memify | Lead with threads; put Source Scout in Library/Research side panel | medium |
| S-05 | `src/components/memo/MemoStudio.tsx` | Export buttons all visible | Markdown, DOCX, PDF are always shown | One primary export menu; default DOCX | low |
| S-06 | `src/components/workbench/draft/ExportControls.tsx` | Export packaging controls | Advanced manifest/C2PA settings are visible by default | Collapse under "advanced packaging" | low |
| S-07 | `src/components/tools/ToolMarketplace.tsx` | Twenty-two tools plus SAT banner plus 12 recipes | Dense mixed marketplace | Show recommended 3 + active recipes first; rest behind "more tools" | medium |
| S-08 | `src/app/app/settings/page.tsx` | Large settings hub | Many equally weighted sections | Group into Profile, Workspace, AI/system, Notifications; hide advanced under system | medium |
| S-09 | `src/app/app/settings/notifications/page.tsx` | 16 notification types displayed raw | Snake-case event names are visible | Render human labels from registry | low |

## Findings: Consolidate (6)

| ID | Location A | Location B | Proposed | Risk |
|----|-----------|-----------|----------|------|
| C-01 | `src/components/workbench/LibraryTab.tsx` upload | `src/components/workbench/context/DocumentUploadInline.tsx` upload handoff | Context links to Library upload; only Library owns ingest. | low |
| C-02 | `src/components/workbench/ResearchTab.tsx` source ingest | Library ingest | Research can stage source candidates, but final ingest should route through Library queue. | medium |
| C-03 | `src/components/workbench/DeskTab.tsx` open questions | Context Tab open questions | Keep Desk as triage, Context as editing; do not duplicate question creation UX. | low |
| C-04 | `src/components/memo/MemoStudio.tsx` PDF/DOCX export | Draft/Boardroom export | Memos save; Draft/Boardroom export. Keep memo export as secondary. | low |
| C-05 | Boardroom deliberations | Chapter briefings | Present as one "Boardroom" flow with tabs: deliberate, brief, export. | medium |
| C-06 | Tool marketplace run history | DIALECTICA recipe history | Unified run ledger with filters by source: marketplace, recipe, SAT. | medium |

## Cross-cutting findings

- **Settings:** Main settings now exposes notification settings, but the hub still has too many equally weighted sections. Advanced system, graph backend, model preferences, and API keys should be grouped.
- **Modals:** No nested modal pattern was found in the audited workspace surfaces. Boardroom and Tools use route/detail views or drawers instead.
- **Menus/dropdowns:** Tool category filters exceed the 2–7 item target. They should become a menu or grouped chips.
- **Tooltips:** Some explanatory copy is doing tooltip/help-center work directly in panels. Keep visible text to task labels and next actions.
- **Empty states:** Several empty states name absence but do not provide a direct CTA, including "No chapter briefings yet" and "No persisted marketplace artifacts for this case yet."
- **Loading states:** Skeletons and spinners both exist. Keep skeletons for surface loads, spinners only inside clicked buttons.
- **Error states:** Most error states are plain-language. Some still expose service framing such as "backend unavailable"; analyst copy should say what to do next.
- **Permission states:** Needs a separate browser audit; source inspection did not prove a consistent 403 state across case, admin, and workspace routes.
- **Keyboard shortcuts:** The purpose prompt requires a discoverable shortcut menu. Source audit did not confirm `Cmd+?`.
- **Copy/language:** Several labels still use title case or implementation words: "Context Studio", "Source Scout", "Tools Marketplace", "Graph Backend", "AI Provider Keys". Some are product nouns and should be kept only if consistently defined.

## Recommended sequence

1. **Phase 1: Pure removals.** Land low-risk deletions R-01 to R-03, then remove or gate R-04 to R-07 after one focused browser pass.
2. **Phase 2: Simplify high-density surfaces.** Library filters, Research layout, Tools marketplace, Settings hub, and notification labels.
3. **Phase 3: Consolidate duplicate workflows.** Library/Research ingest boundary, Context/Desk open questions, Boardroom deliberate/brief/export, and unified run history.

## Things kept after consideration

- **Context health chip:** Kept. It looks decorative, but it provides a compact substrate-readiness signal reused across surfaces.
- **Open questions on Desk:** Kept for now. It duplicates Context partially, but Desk is the triage surface and the question action is high-value if routed consistently.
- **Research "Close thread → improve memory" button:** Kept. The label is intentional and maps directly to the product's memory-coverage job.
- **Library "Re-extract" button:** Kept. It is long-tail, but it is the corrective action for bad OCR or low ontology validity.
- **Graph layout controls:** Kept but flagged for simplification. Force/timeline are distinct analyst jobs.
- **Draft citation lookup:** Kept. It is a core writer workflow even though the current implementation searches the whole draft rather than selection text.
- **Memos version history:** Kept. It prevents silent overwrites and supports defensible analytical products.
- **Tools cost indicators:** Kept. Cost is a real analyst/operator concern in this app.
- **Boardroom dissent surface:** Kept. It is central to the product's trust posture.
- **Notification bell:** Kept. It now records actions and has settings; usage can be measured.
- **Settings system health:** Kept. It is advanced, but necessary for trust and operations.
- **Syria demo route:** Kept. It is an example, not the product, but still the strongest populated public walkthrough.
