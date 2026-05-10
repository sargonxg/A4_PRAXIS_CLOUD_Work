# PRAXIS — Codex Pack 11: Memo Studio, Final Consolidation & Comprehensive Audit

**Branch**: `feature/memo-studio-and-launch`
**Depends on**: Packs 03, 04, 05, 06, 07, 08, 09, 10 merged.
**Owner gate**: This is the last pack before launch. Do not merge to `main` without Giulio's signed sign-off on the Comprehensive Audit + roadmap, and on the final production readiness checklist.
**Estimated effort**: ~7 days (~62 engineering hours).
**Voice**: Product engineering lead getting to launch. Decisive, focused on user value, comprehensive on the close-out.

---

## 0. Why this pack exists

Through packs 03-10, PRAXIS has accumulated all the structural pieces a policy/diplomacy/conflict professional needs: a workbench shell with cases as first-class objects, four ontologies that map domain knowledge onto the eight ACO primitives, a typed and validated ingestion pipeline writing to a Postgres-backed knowledge graph, a Cytoscape-based viewer with five layouts and round-trip edit operations, sixteen curated tools running with persona E2E coverage, a diagnostics dashboard, and a consolidated admin surface. What it does not yet have is the artifact most of its target users actually produce in their day jobs: **memos**.

A diplomat at the UK Mission produces talking points before a Security Council debate, a mandate brief before a renewal vote, and a sit-rep after an incident. A mediator at the end of a session produces a memo capturing positions, interests, BATNAs, ZOPA, and next steps. A counter-terrorism policy adviser produces a one-page situation/complication/insight/recommendation memo for principals. A discourse analyst produces frame-analysis reports. These are the units of work the user takes *out* of PRAXIS into their meeting, their office, their published article. If PRAXIS structures the knowledge but cannot output the memo cleanly, with citations grounded in the graph, exported in the right format, the rest of the architecture is plumbing that ends in a leak.

Memo Studio closes that gap. It is a block-based editor where:

1. The user picks a case and a template (Mandate brief / Mediation summary / Policy memo / Sit-rep / Frame analysis / Talking points).
2. PRAXIS auto-populates the template's structural blocks from the case's graph: Actors involved (from Actor nodes), Key events (from Event nodes ordered by time), Commitments (from Commitment nodes), Recent claims (from high-confidence Claim nodes), Frames invoked (from Narrative-ontology Frame nodes), and so on.
3. The user edits, adds, removes, refines. The editor feels like Notion or Lexical — fast, keyboard-first, predictable.
4. Every assertion in the memo can be cited to one or more graph nodes. Click a citation → the source node opens in a side panel. On export, citations become numbered footnotes with full provenance.
5. The user exports to DOCX (with proper UN-style formatting), PDF (with PRAXIS branding), or plain Markdown for downstream tools.
6. The memo is itself a tool run (per pack 08): persisted, versioned, re-runnable. Re-running re-pulls from the latest graph state and shows a diff.

That is the feature that turns PRAXIS from a structuring tool into a working surface for the persona it serves.

This pack also closes everything else needed for launch:

- **Final route consolidation.** Even after pack 09, the codebase will have residual sprawl. This pack does the final sweep, deletes the rest, redirects the rest, gets the route count to the documented "one app" minimum.
- **Final cleanup.** Dead code, type strictness, dependency hygiene, observability, documentation refresh — all the things a senior engineer does in the week before launch.
- **The Comprehensive Audit.** Codex reads the entire codebase one final time and produces the document Giulio asked for: **WHAT'S DONE / WHAT'S BROKEN / WHAT'S NEXT.** Per pack, per area, with severity, owner, and timeline. The roadmap for v1.1, v2, and the "if PRAXIS were a $20M company in 18 months" horizon.

After this pack merges and the gate is signed, `v1.0.0` is tagged. PRAXIS is launched.

---

## 1. Outcomes

| # | Outcome | Verification |
|---|---|---|
| 1 | Memo Studio surface at `/app/workbench/[caseId]/memos` with create-from-template, edit, export, version-history | Every persona suite includes a memo creation step ending in a valid DOCX export |
| 2 | Six memo templates shipped: Mandate brief, Mediation summary, Policy memo, Sit-rep, Frame analysis, Talking points | All six templates listed in the registry; each renders for at least one sample case; per-template snapshot tests green |
| 3 | Memo blocks support graph citations; clicking a citation opens the node detail panel from pack 07 | Citation round-trip test green; export resolves citations to footnotes |
| 4 | Memo export to DOCX, PDF, Markdown with proper formatting per template | Snapshot of exported DOCX matches reference; manual inspection by Giulio approves typography and section ordering |
| 5 | Auto-population of template structural blocks from the active case graph | Each template documents its auto-populated blocks; integration tests assert the right node primitives feed the right blocks |
| 6 | Memo runs persist as tool runs (extending pack 08 G5) with versioned snapshots | Re-running a memo creates a new version with diff-able prior |
| 7 | Final route consolidation: route count matches the canonical map; sidebar ≤ 8 items | `npm run audit:routes` exits 0; `find src/app -maxdepth 4 -type d \| wc -l` matches |
| 8 | Final dead-code, type-safety, dependency, doc-drift, observability passes complete | Combined `audit:gate` + bundle budgets + Lighthouse all green |
| 9 | Comprehensive Audit at `docs/audits/2026-05-06-COMPREHENSIVE.md` with WHAT'S DONE / WHAT'S BROKEN / WHAT'S NEXT, per pack and cross-cutting | File exists, signed by Giulio |
| 10 | Roadmap at `docs/roadmap/v1.1-and-beyond.md` lists ≥ 30 prioritized items with effort estimates and target releases | Reviewed and signed |
| 11 | `v1.0.0` tagged; CHANGELOG entry written; launch announcement drafted | Tag exists; CHANGELOG and launch notes committed |

---

## 2. Pre-work confirmation note

> I am Codex. I have read pack 11. I understand:
> 1. Memo Studio is the headline feature of this pack and a non-negotiable launch dependency. The other deliverables (consolidation, cleanup, audit, roadmap) are the launch-readiness scaffolding around it.
> 2. Memo blocks ground in the knowledge graph. Every assertion can carry one or more `nodeIds: string[]` citations. The user-facing experience is: click citation → side panel opens with node detail (pack 07's existing component); export → citations become numbered footnotes with full provenance.
> 3. The six templates are: Mandate brief (Diplomat / governance ontology), Mediation summary (Mediator / mediation ontology), Policy memo (Analyst / any ontology), Sit-rep (Diplomat or Analyst / conflict ontology), Frame analysis (Researcher / narrative ontology), Talking points (Diplomat / any ontology).
> 4. The block-based editor uses a vetted library — recommend **Lexical** for its TypeScript types, performance on 50+ block documents, and clean serialization. Tiptap is the alternative; ProseMirror direct is not appropriate at v1.
> 5. Memo runs are tool runs (pack 08 G5 schema extended). Versioning: each save creates a new `MemoVersion` row; the user can diff and revert.
> 6. The Comprehensive Audit is the final document of v1. It must be honest, comprehensive, and structured (per-pack tables, per-area summaries, cross-cutting findings, prioritized backlog).
> 7. I will not break any prior pack's invariants: ACO substrate, model strings only in providers, withCalibration / withContextHealthGate, symbolic firewall, atomic two-phase writes, owner-scoped queries, KG_BACKEND-flag respect.
>
> Open questions for Giulio:
> - **Q1**: Editor library — Lexical (recommended) or Tiptap? Lexical has cleaner types and Meta-grade performance; Tiptap has a richer ecosystem of plugins. Both support custom block nodes (which we need for citations and graph snippets). Confirm.
> - **Q2**: Six templates as listed. Acceptable, or do you want to add a Negotiation prep brief or a Foreign Office Country brief at v1?
> - **Q3**: DOCX styling — propose mirroring the FCDO (Foreign, Commonwealth & Development Office) style for Mandate brief and Sit-rep, McKinsey one-pager style for Policy memo, Harvard PON style for Mediation summary. Acceptable, or do you want one neutral PRAXIS style across all?
> - **Q4**: Roadmap horizon — propose three buckets: **v1.1 (next 60 days)** — fixes from the Comprehensive Audit + small features users will ask for in week one; **v2 (3-6 months)** — multi-tenant teams, custom user-authored ontologies, real-time ingestion sources, Neo4j-revival for graph algorithms; **v3 (6-18 months)** — language coverage, mobile workbench, public sharing, agentic chains, white-label deployment. Acceptable bucketing?

Wait for answers before proceeding.

---

## 3. Pack overview

| Prompt | Outcome | Est. hrs |
|---|---|---|
| K1 | Memo Studio architecture: types, schema, persistence, routing | 6 |
| K2 | Block-based editor (Lexical) with PRAXIS-themed blocks and citation block | 8 |
| K3 | Six memo templates + auto-population from graph | 8 |
| K4 | Memo export: DOCX, PDF, Markdown with footnoted citations | 7 |
| K5 | Onboarding refinement: first memo as the "first win" | 4 |
| K6 | Final route consolidation, dead code, dependency hygiene, type strictness | 8 |
| K7 | Documentation refresh: 10 top-level docs, ADRs, runbooks, system diagram | 8 |
| K8 | Final unified `audit:gate`, persona suite stability, performance budgets | 5 |
| K9 | Comprehensive Audit + Roadmap + Launch readiness sign-off + `v1.0.0` tag | 8 |
| **Total** | | **~62** |

---

## 4. Hard rules

- Memo blocks render as proper React components. No `dangerouslySetInnerHTML`. No HTML strings stored — only structured JSON.
- Citations resolve via `node_id`. If a cited node has been merged, split, or marked superseded (per pack 07 / pack 10), the citation surfaces a yellow indicator and offers a "resolve" UX (point at the new node).
- Auto-population is read-only against the graph. The memo never mutates the graph. (Memo edits propose changes; the user invokes graph edit ops separately.)
- Export is deterministic. The same memo at the same graph snapshot produces byte-identical DOCX (modulo timestamp metadata in the file).
- Memo runs persist as tool runs (pack 08 G5) with `tool_id = 'memo.studio'`. They appear in the Runs tab.
- Versioning is monotonic: each save creates a new immutable `MemoVersion`. Reverting creates a new version that copies prior content.
- All memo content is owner-scoped and case-scoped. Sharing is read-only to case collaborators.
- No model strings outside `src/lib/ai/providers.ts`. Memo's optional "Suggest improvements" feature uses providers correctly.
- All edits go through `withCalibration`. No memo write path bypasses it.

---

## 5. Prompt K1 — Memo Studio architecture

### Persona
Architect. Designs the data model and API once, correctly, before the editor is built. Knows that a sloppy memo schema produces an editor that fights the data forever after.

### Phase 1 — Read & report

Inventory the existing surfaces that touch memo-shaped output: pack 08's `cross.brief-exporter` tool, any export utilities in `src/lib/exports/` (the repo has this), any existing template fragments in `src/lib/cases/syria-2026/` or `src/lib/cases/northwind-mediation/`. Output `docs/audits/2026-05-06-MEMO_INVENTORY.md`.

### Phase 2 — Propose & confirm

Propose the type model:

```ts
// src/types/memo.ts
type MemoId = string;
type MemoVersionId = string;

type MemoTemplateId =
  | 'mandate-brief'
  | 'mediation-summary'
  | 'policy-memo'
  | 'sit-rep'
  | 'frame-analysis'
  | 'talking-points';

interface Memo {
  id: MemoId;
  caseId: string;
  ownerUid: string;
  templateId: MemoTemplateId;
  title: string;
  status: 'draft' | 'review' | 'final' | 'archived';
  currentVersionId: MemoVersionId;
  createdAt: string;
  updatedAt: string;
}

interface MemoVersion {
  id: MemoVersionId;
  memoId: MemoId;
  versionNumber: number;
  authorUid: string;
  createdAt: string;
  graphSnapshotId: string;        // the case-graph state this version was authored against
  blocks: MemoBlock[];
  changeNote?: string;
}

type MemoBlock =
  | HeadingBlock | ParagraphBlock | BulletListBlock | NumberedListBlock
  | QuoteBlock | CitationBlock | GraphSnippetBlock | TableBlock
  | DividerBlock | CalloutBlock;

interface BaseBlock {
  id: string;
  type: string;
  citations?: { nodeIds: string[]; surface: 'inline' | 'footnote' }[];
  metadata?: Record<string, unknown>;
}

interface ParagraphBlock extends BaseBlock {
  type: 'paragraph';
  content: InlineContent[];      // text runs with optional inline citations
}

// ... full schema
```

Persistence: `users/{uid}/situations/{caseId}/memos/{memoId}` (the metadata) and `users/{uid}/situations/{caseId}/memos/{memoId}/versions/{versionId}` (the immutable versions). Stored in Firestore with the same owner-scoped pattern as runs.

API:
- `POST /v1/cases/{caseId}/memos` — create from template, returns `{ memoId, versionId }`.
- `GET /v1/cases/{caseId}/memos/{memoId}` — current version content.
- `PUT /v1/cases/{caseId}/memos/{memoId}` — save: creates a new immutable version, updates `currentVersionId`.
- `GET /v1/cases/{caseId}/memos/{memoId}/versions` — list.
- `GET /v1/cases/{caseId}/memos/{memoId}/versions/{versionId}` — fetch specific.
- `POST /v1/cases/{caseId}/memos/{memoId}/export` — DOCX / PDF / MD.
- `POST /v1/cases/{caseId}/memos/{memoId}/refresh` — re-run auto-population against latest graph; produces a new version with a diff against prior.

Wait for sign-off.

### Phase 3 — Execute

- Author types in `src/types/memo.ts` (Zod-validated) and Pydantic mirror in `backend/types/memo.py`.
- Set up Firestore rules for the new collections (owner-scoped, case-collaborator read).
- Implement the API routes in `backend/routers/memos.py` with `withCalibration` wrapping write paths.
- Implement client SDK in `src/lib/memos/client.ts`.
- Set up routing: `/app/workbench/[caseId]/memos` (list), `/app/workbench/[caseId]/memos/[memoId]` (editor), `/app/workbench/[caseId]/memos/[memoId]/versions/[versionId]` (read-only past version).

### Phase 4 — Verify

- Schema parity test: Pydantic ↔ Zod field equality.
- API integration test for each endpoint.
- Firestore rules test: non-owner cannot read; non-collaborator cannot read.

### Files to create

- `src/types/memo.ts`, `backend/types/memo.py`.
- `backend/routers/memos.py`.
- `src/lib/memos/client.ts`.
- `src/app/app/workbench/[caseId]/memos/page.tsx`, `.../[memoId]/page.tsx`, `.../versions/[versionId]/page.tsx`.
- `firestore.rules` updates.
- `backend/tests/test_memo_api.py`.
- `docs/audits/2026-05-06-MEMO_INVENTORY.md`.

### Verification commands

```bash
npm run typecheck
pytest backend/tests/test_memo_api.py -q
npm test -- firestore.rules.test
```

---

## 6. Prompt K2 — Block-based editor with citations

### Persona
Frontend engineer who has shipped a Lexical-based editor before. Knows that the right level of abstraction is "custom block nodes for the things that matter" (citations, graph snippets, callouts) and "default Lexical nodes for the rest" (text runs, headings, lists).

### Outcome

A working editor at `/app/workbench/[caseId]/memos/[memoId]` with:
- Standard blocks: heading (3 levels), paragraph, bullet list, numbered list, quote, divider.
- Custom blocks: citation (renders `[1]` inline; resolves to node detail on click), graph snippet (renders a small Cytoscape view of cited nodes), callout (info / warning / quote attribution), table.
- Keyboard-first interaction: `/` opens block menu, arrow keys navigate, undo/redo via Lexical's history.
- Auto-save every 5 seconds (debounced); save creates a new MemoVersion only when blocks have changed.
- Side panel opens on citation click — reuses pack 07's NodeDetailPanel.

### Files to create

- `src/components/memo/MemoEditor.tsx` (Lexical instance + plugins).
- `src/components/memo/blocks/CitationNode.tsx` — Lexical custom node.
- `src/components/memo/blocks/GraphSnippetNode.tsx`.
- `src/components/memo/blocks/CalloutNode.tsx`.
- `src/components/memo/blocks/TableNode.tsx` (or use Lexical's table plugin if mature enough).
- `src/components/memo/plugins/citation-picker.tsx` — typeahead UI to search graph nodes by label (uses pack 10 J6 semantic search).
- `src/components/memo/plugins/auto-save.tsx`.
- `src/components/memo/plugins/keyboard-shortcuts.tsx`.
- `src/components/memo/serialization/blocks-to-json.ts`, `json-to-blocks.ts` — round-trip between Lexical state and the `MemoBlock[]` schema.
- `src/components/memo/__tests__/serialization.test.ts` — round-trip property tests.
- `e2e/workbench/memo-editor.spec.ts`.

### Hard rules

- Editor renders 50+ blocks at 60fps. No layout shift on paste of large content.
- Citation insertion: user presses `@`, types node search query, picks from list. Nothing else. No "add citation by URL" or "free-form citation" — citations must resolve to a node id.
- Graph snippet block accepts a list of node ids; renders the induced subgraph (1-hop neighborhood by default) using a tiny Cytoscape instance.
- A11y: every block reachable by keyboard, screen reader announces block type on focus.

### Definition of Done

- Round-trip serialization is lossless for all block types.
- E2E memo creation flow: open template → editor → type → cite → save → close → reopen → identical state.
- 60fps benchmark on 100-block document.

### Verification commands

```bash
npm run test -- src/components/memo
npx playwright test e2e/workbench/memo-editor.spec.ts
```

---

## 7. Prompt K3 — Six templates + auto-population

### Persona
Domain expert + product engineer. Each template encodes a tradition (UN drafting style, Harvard PON, McKinsey one-pager). The encoding is not just typography; it's structure, ordering, what claims belong where.

### Outcome

Six templates ship, each with auto-populated structural blocks pulling from the case graph. Adding a seventh template later is one new file under `src/lib/memo/templates/`.

### Template breakdown

Each template lives at `src/lib/memo/templates/<id>/index.ts` exporting a `MemoTemplate`:

```ts
interface MemoTemplate {
  id: MemoTemplateId;
  label: string;
  description: string;
  recommendedFor: { persona: string; ontologyId?: OntologyId }[];
  sectionStructure: TemplateSection[];
  exportStyles: { docx: DocxStyleSheet; pdf: PdfStyleSheet };
}

interface TemplateSection {
  id: string;
  title: string;
  description: string;
  initialBlocks: MemoBlock[];
  autoPopulator?: (caseGraph: CaseGraph) => MemoBlock[];
  required: boolean;
}
```

**1. Mandate brief** (`mandate-brief`) — recommended for Diplomat × Governance ontology.
Sections: Origins (mandate Constraint nodes); Current scope (active Mandate + Procedure); Recent actions (Decision events ordered by time); Voting alignment (Vote nodes grouped by Actor); Renewal considerations (free text); Recommendations (free text).

**2. Mediation summary** (`mediation-summary`) — recommended for Mediator × Mediation ontology.
Sections: Parties and counsel (Actor.Party + Actor.LegalCounsel); Stated positions (Claim.Position grouped by party); Underlying interests (Claim.Interest); BATNAs and WATNAs (auto-included only if the user has elevated permission to see; see pack 06 BATNA-confidentiality validator); ZOPA discussion (free text + auto-suggest from ZOPA tool output); Agreement progress (AgreementClause + Acceptance events); Next steps (free text).

**3. Policy memo** (`policy-memo`) — recommended for Analyst × any ontology. McKinsey one-pager shape.
Sections: Situation (auto: highest-confidence Verdict nodes from last 30 days); Complication (auto: contradictions + escalating events); Key insight (free text); Recommendation (free text); Risks (free text).

**4. Sit-rep** (`sit-rep`) — recommended for Diplomat / Analyst × Conflict ontology.
Sections: As-of timestamp; Headline (free text, single sentence); Current actor positions (top-3 Actor.StateActor by edge count); Recent events (Event nodes from last 7 days); Watchpoints (free text + auto-suggest from contradictions); Sources cited (auto-listed).

**5. Frame analysis** (`frame-analysis`) — recommended for Researcher × Narrative ontology.
Sections: Frames active (Narrative.Frame nodes); Frame propagation (auto: graph snippet of `INVOKES_FRAME` edges); Counter-narratives (Narrative.CounterNarrative); Outlets and amplifiers (Actor.Outlet + Actor.Amplifier ranked by edge count); Audience targeting (Actor.Audience); Implications (free text).

**6. Talking points** (`talking-points`) — recommended for Diplomat × any ontology. Bullet-only.
Sections: Meeting context (free text); Key messages (3-5 bullets, free text); Lines to take (auto: top-confidence Claim.Position nodes); If pressed (free text); Avoid raising (free text).

### Files to create

- `src/lib/memo/templates/<id>/index.ts` — six templates.
- `src/lib/memo/templates/<id>/auto-populate.ts` — per-template populator function.
- `src/lib/memo/templates/registry.ts` — `getMemoTemplate`, `listMemoTemplates`.
- `src/components/memo/MemoTemplatePicker.tsx` — modal: cards for the six templates, recommended-for indicator based on case ontology.
- `src/lib/memo/templates/__tests__/auto-populate.test.ts` — for each template + sample case, assert the right blocks are populated.
- `e2e/workbench/memo-templates.spec.ts` — create one memo per template against a relevant sample case; verify auto-population non-empty.

### Hard rules

- Auto-populators are pure functions: `(caseGraph) → MemoBlock[]`. No side effects, no LLM calls. Reproducible.
- BATNA confidentiality from pack 06 is honored: if the current user is not the Mediator (case role), BATNA / WATNA blocks render as `[Confidential — visible to mediator only]`.
- Templates declare their `recommendedFor` so the picker can highlight the best fit for the active case's ontology.
- Adding a seventh template is a single new directory; no edits to a central list (use `import.meta.glob` or static-import barrel).

### Definition of Done

- All six templates render against their canonical sample case.
- Auto-population tests green.
- Template picker shows the right recommended fit per ontology.
- Manual smoke: a Mediator creates a Mediation summary against Northwind; the auto-populated Positions and Interests are correct; the BATNA section renders the confidentiality redaction for a viewer-role test user.

### Verification commands

```bash
npm run test -- src/lib/memo
npx playwright test e2e/workbench/memo-templates.spec.ts
```

---

## 8. Prompt K4 — Memo export: DOCX, PDF, Markdown with footnoted citations

### Persona
Document-engineering specialist. Knows that DOCX is XML-in-a-zip, that footnote ordering is non-trivial, and that the difference between a well-formatted UN brief and a Word document that "looks right" is in the use of styles, not direct formatting.

### Outcome

Three export formats per template; citations resolved to numbered footnotes; styling matches the template's tradition (Q3).

### Files to create

- `backend/services/memo_export/__init__.py`.
- `backend/services/memo_export/docx.py` — uses `python-docx` or `docx-templater` (recommend `python-docx` for fidelity). One styles dictionary per template.
- `backend/services/memo_export/pdf.py` — generate via Pandoc (route DOCX → PDF) or directly via `weasyprint` from HTML render. Recommend WeasyPrint for control over typography.
- `backend/services/memo_export/markdown.py` — straightforward; citations as footnotes.
- `backend/services/memo_export/citations.py` — assigns sequential `[1] [2] [3]` numbers; assembles full footnote text including provenance entries from the cited nodes.
- `backend/routers/memo_export.py` — `POST /v1/cases/{caseId}/memos/{memoId}/export?format={docx|pdf|md}` returns a signed Cloud Storage URL or streams the file.
- `backend/services/memo_export/styles/` — one stylesheet per template (DOCX style XML + PDF CSS).
- `backend/tests/test_memo_export.py` — for each (template, format), generate; assert structural correctness; for DOCX, assert specific style names and section ordering.
- `e2e/workbench/memo-export.spec.ts` — E2E download flow.

### Hard rules

- Export is server-side; the client gets a signed URL. No client-side DOCX generation (bundle cost + correctness risk).
- Footnote ordering is by first occurrence in the rendered text.
- Provenance text in footnotes is human-readable (e.g., "Source: UNSC/RES/2617, ¶12, retrieved 2026-04-15") not raw JSON.
- DOCX styles use named paragraph styles (Heading1, Heading2, BodyText, Quote, FootnoteText) so the user can re-style in Word without breaking anything.
- PDF generation under 5s for a 50-block memo.
- Cited nodes that have been merged or superseded surface a footnote with the resolution (e.g., "Note: cited node 'X' was merged into 'Y' on YYYY-MM-DD; see Y in the workbench").

### Definition of Done

- All three formats produce valid output.
- Manual inspection by Giulio: DOCX export of a Mandate brief against UN CTED looks like a real FCDO mandate brief.
- Snapshot tests on representative export bytes.

### Verification commands

```bash
pytest backend/tests/test_memo_export.py -q
npx playwright test e2e/workbench/memo-export.spec.ts
```

---

## 9. Prompt K5 — Onboarding refinement: first memo as the "first win"

### Persona
Onboarding designer. Builds on pack 09 I7 (Welcome modal + 5-step coach). Knows that the user's first session has to end with an artifact they can show someone, or they will not return.

### Outcome

The pack 09 onboarding coach is extended so its final step is "create your first memo and export it." The user's first 8-minute session ends with a downloaded DOCX of a real memo grounded in a real (sample) case.

### Files to edit

- `src/components/onboarding/Coach.tsx` — extend from 5 steps to 6: …, "Now run a tool", **"Now create your first memo"**.
- `src/components/onboarding/CoachStep.tsx` — add a "memo" variant that highlights the Memos tab and the "New memo" CTA.
- `src/lib/onboarding/state.ts` — add `firstMemoCreatedAt`, `firstExportedAt` fields.
- `e2e/onboarding/first-run.spec.ts` — extend the E2E so it ends with a successful DOCX download.

### Hard rules

- The onboarding coach is dismissible at any step. Coach completion is celebrated but not required; PRAXIS is not a tutorial-as-product.
- The first memo's auto-populated content is non-empty against the sample case the user picked. If a case has insufficient graph density, the coach asks the user to ingest one more document first (loop).

### Definition of Done

- `e2e/onboarding/first-run.spec.ts` ends with file download and exits green.
- Wall-clock under 10 minutes from sign-up to downloaded memo.
- Manual smoke with a fresh test account confirms the experience feels grounded, not gimmicky.

### Verification commands

```bash
npx playwright test e2e/onboarding/first-run.spec.ts
```

---

## 10. Prompt K6 — Final route consolidation, dead code, dependency hygiene, type strictness

### Persona
Senior engineer doing the final cleanup. Knows that the consolidation work specified earlier may have left tail items: components that became unused after route deletions, dependencies that lost their consumers, type drift that crept in from the new memo work.

### Phase 1 — Read & report

- Run the full audit chain from pack 09 — does it still exit 0 after packs 10 and the K1-K5 work in this pack?
- Run knip, ts-prune, depcheck, madge — any new findings?
- Run typescript strict + mypy strict — any new violations from memo work?
- Inventory routes: does the canonical map still hold? Any new routes added by K1 that need documenting?
- Output `docs/audits/2026-05-06-FINAL_CLEANUP.md`.

### Phase 2 — Propose & confirm

Propose targeted fixes:
- Delete unused exports surfaced.
- Drop unused deps.
- Tighten any `any` introduced in memo code.
- Update the canonical route map in `docs/architecture/ROUTE_MAP.md` to include `/memos`, `/memos/[memoId]`, etc.
- Fix any circular imports introduced by memo blocks importing graph components.

Wait for sign-off.

### Phase 3 — Execute

Apply fixes in named commits.

### Phase 4 — Verify

- All audits exit 0.
- Bundle size: workbench route bundle has not grown more than 8% from pre-pack-11 baseline (memo editor adds Lexical; budget accordingly).
- Persona suites green.

### Files to create

- `docs/audits/2026-05-06-FINAL_CLEANUP.md`.
- Updated `docs/architecture/ROUTE_MAP.md`.

### Files to edit

Whatever the audit surfaces.

### Verification commands

```bash
npm run audit:gate
npm run audit:bundle-budgets
npm run typecheck:strict
mypy backend/ --strict
```

---

## 11. Prompt K7 — Documentation refresh

### Persona
Technical writer with senior engineering judgment. Refreshes every top-level doc against the post-pack-11 reality. Adds the missing ADRs for memo-related decisions.

### Outcome

All 10 top-level docs (`README`, `ARCHITECTURE`, `CLAUDE`, `AGENTS`, `DESIGN`, `DEPLOYMENT`, `SECURITY`, `TESTING`, `TODO`, `CHANGELOG`) refreshed. New ADRs for: Postgres-first KG (pack 10 architectural call), Memo Studio data model (pack 11), Lexical editor choice. Runbooks updated. System overview diagram updated.

### Files to create

- `docs/adr/0009-postgres-first-knowledge-graph.md`.
- `docs/adr/0010-memo-studio-data-model.md`.
- `docs/adr/0011-lexical-editor-choice.md`.
- Updated `docs/architecture/SYSTEM_OVERVIEW.md` diagram (with memo studio + Postgres explicitly).

### Files to edit

- `README.md` — quick-start updated; mentions memo studio as the user-visible top feature.
- `ARCHITECTURE.md` — Postgres-first; memo studio; updated system diagram.
- `CLAUDE.md`, `AGENTS.md` — invariants from packs 03-11.
- `DESIGN.md` — memo block design tokens; editor patterns.
- `DEPLOYMENT.md` — Cloud SQL setup, pgvector extension enable, Alembic migrations in deploy.
- `SECURITY.md` — Postgres connection security, memo confidentiality (BATNA).
- `TESTING.md` — memo editor + export tests, persona suites updated to include memos.
- `TODO.md` — wiped and re-populated only with v1.1+ items.
- `CHANGELOG.md` — `[1.0.0]` entry with full pack 03-11 summary.

### Hard rules

- Every doc carries a `Last reviewed: 2026-05-06` line at the top.
- Internal links checked by `lychee --offline`.
- ADRs follow MADR format.

### Definition of Done

- `npm run audit:docs` exits 0.
- Manual review by Giulio.

### Verification commands

```bash
npm run audit:docs
```

---

## 12. Prompt K8 — Final unified `audit:gate`, persona stability, performance budgets

### Persona
Release engineer. Final pass on the gate.

### Outcome

`npm run audit:gate` runs all checks (from packs 03-11) in dependency order, exits 0 in under 12 minutes, and prints a clean summary table.

### Files to edit

- `scripts/audit-gate.ts` (orchestrator from pack 09 H9 / superseded by pack 11) — add memo audits, post-pack-10 audits, post-pack-11 audits.
- The audit list, finalized:
  - Fast (target <90s): typecheck, lint, knip, ts-prune, depcheck, madge, ontology-mapping, ontology-versions, route-map, doc-drift, postgres-schema-current.
  - Medium (target <4min): unit tests, ontology-classifier-accuracy, tool-coverage, type-safety counts, kg-drift dry-run, security audits, observability audit.
  - Slow (target <8min): persona E2E suites, perf budgets (graph + tools + bundle), Lighthouse CI, semantic search precision.

### Definition of Done

- Single command exits 0 in under 12 minutes on a clean checkout.
- Persona suites green for 10 consecutive runs in CI staging.
- Lighthouse thresholds met (Landing ≥ 92, Workbench ≥ 85, Memo editor ≥ 80 — slightly relaxed for Lexical bundle).

### Verification commands

```bash
npm run audit:gate
npm run audit:gate -- --fast-only   # under 90s
```

---

## 13. Prompt K9 — Comprehensive Audit, Roadmap, Launch Sign-off, `v1.0.0` Tag

### Persona
The launch lead writing the "what we built" story. Honest, comprehensive, structured. The document Giulio asked for: WHAT'S DONE / WHAT'S BROKEN / WHAT'S NEXT.

### Phase 1 — Read & report

Codex performs a final, comprehensive read of the entire codebase. The output is a single document `docs/audits/2026-05-06-COMPREHENSIVE.md` with:

**1. Executive summary** (1 page)
- What PRAXIS is, in two paragraphs.
- The pack-by-pack delivery story (numbers: lines added, files created, tests written).
- One paragraph each: architecture, product surface, operational posture.

**2. WHAT'S DONE** — per-pack tables.

For each of packs 03-11, a table:
| Deliverable | Status | Quality | Notes |
|---|---|---|---|
| (per row from the pack's outcomes table) | DONE / PARTIAL / DEFERRED | A / B / C | comment |

Status DONE means "shipped, tested, in production." PARTIAL means "shipped but with named gaps." DEFERRED means "specified, not built, in roadmap."
Quality A means "exemplary." B means "fit for purpose." C means "works but technical debt acknowledged."

**3. WHAT'S BROKEN** — cross-cutting findings.

A list of every gap, technical debt, untested path, performance concern, or known issue. Severity-tagged. Owner-tagged.

**4. WHAT'S NEXT** — the roadmap.

Three buckets per Q4:

**v1.1 (next 60 days)** — the post-launch fix-it list. Targets:
- Fixes from the Comprehensive Audit (§3).
- The S2 backlog from pack 09 I9.
- Tier-1 user-requested features (anticipate the first 5: drag-drop document upload, multi-document selection, citation auto-suggest improvements, bulk node editing, export-template customization).

**v2 (3-6 months)** — feature expansion:
- Multi-tenant teams (org/team accounts; shared cases).
- Custom user-authored ontologies (the sealed v1 set becomes one of many).
- Real-time ingestion sources (RSS feeds, social streams, document drop folders).
- Neo4j revival as graph-algorithms engine (Louvain communities, PageRank-on-graph, motif finding).
- Memo collaboration (multiple editors, comments, suggestions).
- Mobile workbench (read-only views, simple memo editing).
- Webhooks for external integration (Slack notifications on Context Health changes, etc.).

**v3 (6-18 months)** — strategic horizon:
- Internationalization (Arabic, French, Russian, Chinese — the UN6 minus English).
- Public sharing of cases / views (anonymous read-only links).
- White-label deployment for INGOs / governments.
- Agentic chains (LLM proposes the next tool / next memo section).
- Edge computing for low-bandwidth field deployments.
- Custom tools authored by users (third-party tool marketplace).
- Advanced analytics dashboards (cohort, usage, content quality).

Each item has: title, one-sentence rationale, estimated effort (S/M/L/XL), dependency notes.

**5. Launch readiness summary**

The pack-08 production readiness checklist, fully checked off. With Giulio's signature.

**6. Cross-pack metrics dashboard**

Numbers: total LoC by language; test count; coverage %; persona suite stability over last 30 CI runs; bundle sizes per route; current monthly cost forecast; current monthly token spend across the four sample cases.

### Phase 2 — Propose & confirm

Send to Giulio. The Comprehensive Audit is the merge-blocker for this PR and for `v1.0.0`. Wait for review.

### Phase 3 — Execute

- Address any concrete gaps Giulio flags during review (file new backlog items; remediate any newly identified S0).
- Sign `docs/launch/PRODUCTION_READINESS.signed.md`.
- Tag `v1.0.0` after merge.
- Draft the launch announcement at `docs/launch/ANNOUNCEMENT.md`.

### Phase 4 — Verify

- Single `npm run audit:gate` exits 0.
- All persona suites green for 10 consecutive runs.
- Comprehensive Audit signed.
- Tag exists.

### Files to create

- `docs/audits/2026-05-06-COMPREHENSIVE.md`.
- `docs/roadmap/v1.1-and-beyond.md`.
- `docs/launch/PRODUCTION_READINESS.signed.md`.
- `docs/launch/ANNOUNCEMENT.md`.

### Files to edit

- `CHANGELOG.md` — `## [1.0.0] - 2026-05-06` entry with the 9-pack story.

### Verification commands

```bash
npm run audit:gate
npm run test:e2e:personas
git tag --list v1.0.0
```

---

## 14. Final verification gate (before tagging v1.0.0)

```bash
# Foundations
npm run typecheck
npm run lint
npm run test
pytest backend/ -q
mypy backend/ --strict

# The single gate
npm run audit:gate

# The persona bar
npm run test:e2e:personas    # 10 consecutive runs in staging

# Memo studio E2E
npx playwright test e2e/workbench/memo-editor.spec.ts
npx playwright test e2e/workbench/memo-templates.spec.ts
npx playwright test e2e/workbench/memo-export.spec.ts
npx playwright test e2e/onboarding/first-run.spec.ts

# Performance
npm run lh:ci
npm run audit:tool-perf-budgets
npm run audit:bundle-budgets

# Drift
npm run audit:kg-drift

# Documentation
npm run audit:docs

# Tag
git tag --list v1.0.0
test -f docs/launch/PRODUCTION_READINESS.signed.md
test -f docs/audits/2026-05-06-COMPREHENSIVE.md
```

All commands exit 0. Comprehensive Audit signed. Roadmap signed. Tag created. Launch announcement drafted. Merge.

---

## 15. Out of scope

- Memo collaboration (live multi-editor) — v2.
- Memo comments / suggestions — v2.
- Custom user-authored memo templates — v2.
- Memo export to LaTeX / .typ / .pages — backlog.
- Memo translation across languages — v3 (i18n).
- AI-assisted memo writing beyond auto-population (e.g., "improve this paragraph") — backlog.
- Voice-dictated memos — backlog.
- Memo-as-graph (memos appearing as nodes in the case graph) — interesting, deferred.

---

## 16. Closing note

This is the last pack. After merge, `v1.0.0` is tagged and PRAXIS is launched.

The thing this pack delivers that none of the prior eight packs did is **the artifact a real user takes out of PRAXIS into their meeting**. Everything before pack 11 was infrastructure. Memo Studio is product. A diplomat at the UK Mission opens a UN CTED case in PRAXIS, runs the Mandate brief template, the brief auto-populates with the binding mandates and recent decisions, the diplomat tightens the language, exports to DOCX in FCDO style, walks into the briefing. That is the moment the architecture justifies itself.

The Comprehensive Audit is your map. WHAT'S DONE tells you what shipped. WHAT'S BROKEN tells you what to triage in week one. WHAT'S NEXT tells you what to spend the next 18 months on. None of those documents are flexible — write them honestly or do not write them.

The four persona suites must be green for 10 consecutive CI runs before merge. No exceptions. Every prior pack carried that bar; this pack carries it as the launch gate.

Branch: `feature/memo-studio-and-launch`. Commit prefix `memo(<area>): <prompt-id> <description>` for memo work; `launch(<area>): <prompt-id> <description>` for K6-K9. PR titled `Pack 11 — Memo Studio, Final Consolidation & Comprehensive Audit`.

After merge:
1. Tag `v1.0.0`.
2. Publish `docs/launch/ANNOUNCEMENT.md`.
3. Move on to v1.1.

PRAXIS is launched.
