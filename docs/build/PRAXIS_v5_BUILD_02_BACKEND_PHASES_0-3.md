# PRAXIS by TACITUS — v5.0 Build Pack
# File 2 of 3 — Backend Build Prompts (Phases 0-3)

**Date:** 2026-05-10 · **Status:** Authoritative for the MVP build
**Read alongside:** File 1 (Agent Operating Guide — must read first) · File 3 (Frontend & Ship)

This file contains paste-ready prompts for Phases 0 through 3 of the v5 MVP build. Each prompt is self-contained, follows the standard frame in File 1 §5, and is designed to paste into Antigravity / Claude Code / Codex without further setup.

**Phase wave structure (from File 1 §8):**
- **Wave 1 (sequential, single agent):** Phase 0 → Phase 1
- **Wave 2 (three parallel agents):** Phase 2A + 2D + 2E (Agent A) | Phase 2B (Agent B) | Phase 2C + Phase 3 (Agent C)

Read File 1 §1-13 before executing any prompt below.

---

# === PHASE 0 — VISION ADOPT + PERSONA ADDENDUM + 4 ADRs ===

**Wave:** 1 (sequential, single agent)
**Effort:** 1-2 days
**Prerequisite:** Codex cleanup pass (`chore/v4-cleanup-pass-001`) merged to main.

## Prompt 0.A — Adopt v4 vision + persona addendum + 4 ADRs

```
=== PHASE 0 — Vision Adopt + Persona Addendum + 4 ADRs ===

READ FIRST:
1. README.md, CLAUDE.md, AGENTS.md
2. ARCHITECTURE.md
3. docs/architecture/PRAXIS_ARCHITECTURE.md
4. docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md
5. docs/architecture/PRAXIS_VISION_v4_01_VISION.md
6. docs/architecture/PRAXIS_VISION_v4_02_ARCHITECTURE.md
7. docs/architecture/PRAXIS_VISION_v4_03_BUILD.md
8. docs/build/PRAXIS_v5_BUILD_01_AGENT_OPERATING_GUIDE.md (full)
9. docs/v7/STATUS.md

GOAL:
Adopt the v4 vision as canonical, lock the three MVP personas in an
addendum, open the four ADRs at Proposed status awaiting Giulio's signoff,
move v7 Slice 1 to in-progress, and stub the new audit scripts.

DELIVERABLES:

1. Update ARCHITECTURE.md to reference the three v4 vision files as the
   canonical product/architecture/build direction. Demote prior "current
   direction" docs (v6.x, pre-v4 v7 briefs not in Slice 1) to historical
   references at the bottom of ARCHITECTURE.md.

2. Update CLAUDE.md and AGENTS.md "Agent Handoff" lists per File 1 §3
   read order. The first 11 reads after README.md are the vision files,
   the architecture bible, the live-app alignment, the build guide, and
   STATUS/TODO/CHANGELOG. Drop everything else from the handoff list
   (move pre-v4 docs to a "Historical references" section at the bottom).

3. Open four ADRs at Proposed status (NOT Accepted — Giulio signs):
   - docs/adr/0037-user-models-as-first-class-versioned-artifacts.md
   - docs/adr/0038-two-context-product-model-on-dual-ontology-layer.md
   - docs/adr/0039-seven-logical-graphs-one-user-facing-graph.md
   - docs/adr/0040-twelve-named-llm-graph-interaction-patterns.md
   Use MADR format (Status, Context, Decision, Consequences, Alternatives
   Considered, References). Source text from PRAXIS_VISION_v4_03_BUILD.md
   §3.

4. Append to ADR-0038 a "Persona Decision (2026-05-10)" section with the
   three locked MVP personas:

   3 personas, 3 demo Contexts, 3 work ontologies (per File 1 §1):
   (a) Foreign Policy Analyst
       — demo Context: Indo-Pacific Strategic Competition 2026
       — work ontology: Foreign Policy Research
   (b) Domestic Policy Analyst
       — demo Context: AI Regulation 2026 — US Federal & State Landscape
       — work ontology: Domestic Policy Analysis
   (c) Corporate Strategic Analyst (Public Affairs + Sustainability)
       — demo Context: Food & Beverage Regulatory & Sustainability
         Outlook 2026
       — work ontology: Corporate Strategic Analysis

   Buyer-market reach rationale: §"Why these three together" of the
   persona-confirmation chat exchange (paste from chat history if needed).

5. Update docs/v7/STATUS.md:
   - Mark Slice 1 as "in-progress, mapped to v5 Phase 1 (Ontology Module)"
   - Add a one-paragraph note pointing to v4 File 3.

6. Trim TODO.md aggressively. Anything not on the v5 build plan moves to
   docs/_archive/2026-05-pre-v5/TODO_pre_v5.md. The new TODO.md is a thin
   pointer to v5 phases plus genuine production blockers from BLOCKERS.md.

7. Add 8 new audit script stubs to package.json under scripts.audit:* and
   create the script files at scripts/audit-<name>.ts. Each stub fails
   noisily with a "v5 Phase X deliverable" message until the corresponding
   phase ships:
   - audit:llm-pattern-coverage (Phase 1)
   - audit:source-tier-discipline (Phase 2D)
   - audit:research-pipeline-shape (Phase 2C)
   - audit:document-pipeline-shape (Phase 2B)
   - audit:work-ontology-coverage (Phase 1)
   - audit:episode-bi-temporal-coverage (Phase 2E)
   - audit:user-model-versioning (Phase 3)
   - audit:drafting-templates-present (Phase 6)

   These audits go into a new audit:v5-readiness script that fails noisily;
   they are NOT in audit:gate yet. They join audit:gate as their phases
   ship.

8. Update STATUS.md:
   - Add a v5 MVP section with the 9-phase plan (table from File 1 §2).
   - Mark Phase 0 as in-progress; all others as not-started.

DO NOT TOUCH:
- src/lib/firebase/admin.ts, src/lib/api/with-auth.ts, src/middleware.ts,
  firestore.rules, storage.rules, src/lib/auth/cookie-signer.ts
- terraform/, cloudbuild.yaml (without Giulio approval)
- The 52 existing tools in src/lib/tools/registry/ (Phase 4 retags them)
- The 7 subagents in backend/agents/ (Phase 7 deploys 2)
- backend/data/ontologies/specializations/ (Phase 1 surfaces them; do not
  edit specs in Phase 0)

DO NOT INVENT:
- New ontologies (Phase 1 ships 3 work ontologies; Phase 0 only opens ADRs)
- New surfaces (every new route is in Phases 2-6)
- New audit scripts beyond the 8 listed (later phases add their own)

CONSTRAINTS:
- ADRs follow MADR. Title format: "0XXX-<kebab-case-slug>.md"
- All audit stubs return non-zero with a clear message; they do NOT skip.
- TODO.md after trim is < 50 lines. Anything cut goes to _archive.

VERIFICATION (before opening PR):
  npm run lint
  npx tsc --noEmit
  npm run test
  pytest backend/ -q
  npm run audit:gate                # green (existing audits)
  npm run audit:v5-readiness        # red (expected — stubs fail)
  npm run docs:lint                 # markdownlint, vale, lychee
  ls docs/adr/0037-*.md docs/adr/0038-*.md docs/adr/0039-*.md docs/adr/0040-*.md  # all 4 exist
  grep -c "Persona Decision" docs/adr/0038-*.md  # >= 1
  rg "v5 Phase" scripts/audit-llm-pattern-coverage.ts | head -1  # stub message present

PR TITLE: chore(v5-phase-0): adopt v4 vision + 3-persona addendum + 4 ADRs
PR BODY: Use template from File 1 §7. Reference v4 vision files and ADR-0038
  Persona Decision. Audit results: v5-readiness fails as expected (stubs).

ROLLBACK: git revert <merge-commit>
```

---

# === PHASE 1 — ONTOLOGY LAYER + 3 WORK ONTOLOGIES + tacitus-ontology PACKAGE ===

**Wave:** 1 (sequential, single agent, after Phase 0 merges)
**Effort:** 3-5 days
**Prerequisite:** Phase 0 merged.

## Prompt 1.A — Ontology surfacing + 3 work ontologies + MIT package

```
=== PHASE 1 — Ontology Layer + 3 Work Ontologies + tacitus-ontology Package ===

READ FIRST:
1. docs/build/PRAXIS_v5_BUILD_01_AGENT_OPERATING_GUIDE.md (full)
2. docs/architecture/PRAXIS_VISION_v4_02_ARCHITECTURE.md §1-3 (the 8
   meta-primitives, the two ontology categories)
3. docs/architecture/PRAXIS_VISION_v4_03_BUILD.md §1 Module 1
4. docs/architecture/PRAXIS_ARCHITECTURE.md §3 (8 ACO primitives invariant)
5. docs/architecture/ONTOLOGY_SYSTEM.md (existing system)
6. backend/data/ontologies/specializations/  # all existing 13 lenses
7. backend/services/ontology_system.py
8. docs/adr/0038-*.md (Persona Decision section — 3 work ontologies)
9. /mnt/skills/user/praxis-conventions/SKILL.md

GOAL:
Surface the existing 13 domain ontologies as a visible /ontologies route,
author the 3 MVP work ontologies (Foreign Policy Research, Domestic Policy
Analysis, Corporate Strategic Analysis), and publish tacitus-ontology v1.0
as a separate MIT GitHub repository.

DELIVERABLES:

PART A — Domain ontology surfacing (in-app):

1. Build /ontologies (list page) at src/app/ontologies/page.tsx:
   - Cards for each of the 13 specializations
   - Each card: name, primary domain, primitive coverage, "active in MVP"
     badge (3 cards: Conflict, Mediation, Humanitarian) or "v1.5+" tag
   - Search + filter by domain
   - Top section: "Domain Ontologies" / Bottom section: "Work Ontologies"
     (3 active; remaining 5 stub as "v1.5+")

2. Build /ontologies/[id] (detail page) at src/app/ontologies/[id]/page.tsx:
   - Description, intended domain, example use cases
   - Subtypes per primitive (table)
   - Mandatory relations (table)
   - External mappings (BFO, CCO, PLOVER, POLECAT, UCDP, FrameNet)
   - Usage stats (how many active Contexts use this lens — query Firestore)
   - Active in MVP yes/no

PART B — Work ontology authoring (NEW):

3. Create the directory backend/data/ontologies/work/ with README.md
   pointing to PRAXIS_VISION_v4_02_ARCHITECTURE.md §3.2.

4. Author 3 work ontologies as YAML/Pydantic specs at
   backend/data/ontologies/work/<id>.yaml + .py:

   (i) foreign-policy-research.yaml — Foreign Policy Research
       Subtypes per primitive (per File 1 §1 + File 2 §3.2 of v4
       architecture):
       Actor: ResearcherSelf, ResearchInstitution, EditorialBoard, FundingSource,
              MediaContact, AcademicPeer, PolicymakerAudience, ExternalSource
       Claim: ResearchHypothesis, EditorialPosition, MethodologicalChoice
       Interest: PublicationGoal, IntellectualPositioning, FundingAlignment
       Constraint: PublicationDeadline, EthicalReview, EditorialStandards,
                   FundingScope, AcademicStandards
       Leverage: PublicationVenue, CitationCapital, NetworkAccess
       Commitment: PublicationDeliverable, ConferencePresentation, EditorialOutput
       Event: ResearchCycle, PeerReviewMilestone, PublicationLaunch,
              ConferenceParticipation
       Narrative: AnalyticalFraming, PolicyRecommendationFraming

   (ii) domestic-policy-analysis.yaml — Domestic Policy Analysis
       Actor: AnalystSelf, Supervisor, Principal (Senator/Rep/Director),
              CommitteeMember, AdvocacyOrgPartner, JournalistContact,
              SubjectMatterExpert, ConstituentAudience
       Claim: PolicyPosition, RegulatoryInterpretation, EvidenceClaim,
              PoliticalViability
       Interest: PolicyOutcome, ElectoralInterest, BudgetaryInterest,
                 CoalitionInterest
       Constraint: LegislativeCalendar, BudgetCycle, ProcessConstraint,
                   PartisanFraming, LegalStandard, EthicalRule
       Leverage: CommitteeAssignment, MediaAccess, CoalitionStrength,
                 ConstituentBase, EvidenceQuality
       Commitment: HearingTestimony, PolicyMemoCommit, BudgetRequest,
                   RegulatoryCommentLetter
       Event: HearingCycle, BudgetCycle, RegulatoryRulemaking, ElectionCycle,
              CommitteeMarkup, LegislativeSession
       Narrative: PolicyFraming, BipartisanFraming, ConstituentFraming

   (iii) corporate-strategic-analysis.yaml — Corporate Strategic Analysis
        Actor: AnalystSelf, ExecutiveSupervisor, BoardAudience, InvestorAudience,
               RegulatorActor, NGOActor, JournalistContact, IndustryPeer,
               EmployeeAudience, CustomerAudience
        Claim: StrategicPosition, RegulatoryComplianceClaim, MaterialityAssessment,
               StakeholderClaim, FinancialClaim
        Interest: ShareholderValue, RegulatoryAlignment, ReputationalProtection,
                  StrategicPositioning, ESGCredibility
        Constraint: SECDisclosure, RegulatoryRule, BoardMandate, FinancialPosture,
                    ESGStandard (GRI/SASB/TCFD/ISSB), ReputationalRisk
        Leverage: MarketPosition, RegulatoryRelationship, MediaRelationship,
                  InvestorBacking, CertificationCredibility
        Commitment: SustainabilityPledge, RegulatoryCommitment, BoardDirective,
                    DisclosureCommitment, StakeholderEngagement
        Event: BoardMeeting, EarningsCall, SustainabilityReportRelease,
               RegulatoryFiling, NGOCampaignEvent, ESGRatingEvent
        Narrative: CorporateFraming, ESGFraming, ReputationalFraming

   For each work ontology, provide:
   - YAML spec at backend/data/ontologies/work/<id>.yaml
   - Pydantic models at backend/data/ontologies/work/<id>.py (mirror)
   - Mandatory relations declarations
   - Validators (Pydantic field validators)
   - Extraction prompt templates (string blobs in <id>.prompts.py)

5. Update backend/services/ontology_system.py:
   - Resolve domain ontology stack from Context's frame + primary geography
   - Resolve work ontology from active User Model's mandate + role
   - Auto-stack: Indo-Pacific Context → Conflict + Mediation + Humanitarian
                  AI Regulation Context → existing domain (use Mediation +
                  Humanitarian as fallback for MVP, or accept that this
                  Context stretches the MVP domain ontologies — document as
                  v1.5 to author Governance + Regulatory ontologies)
                  F&B Sustainability → Mediation (stakeholder dynamics) +
                  add Humanitarian for sustainability/social aspects (or
                  document as v1.5 to author Sustainability ontology)
   - Document the ontology fit for each demo Context with TODO comments
     about the v1.5 expansion of domain ontologies for non-conflict
     contexts.

PART C — tacitus-ontology MIT package publication:

6. Create a separate GitHub repository: github.com/tacitus-ai/tacitus-ontology
   (Giulio creates the repo; agent submits the initial commit as a PR).
   Contents:
   - LICENSE (MIT)
   - README.md (overview, usage, citation)
   - tacitus_ontology/__init__.py (Python package)
   - tacitus_ontology/primitives.py (8 meta-primitives as Pydantic + JSON
     Schema + OWL/Turtle)
   - tacitus_ontology/specializations/ (3 active MVP domain ontologies +
     stubs for the 10 v1.5)
   - tacitus_ontology/work/ (3 MVP work ontologies)
   - tacitus_ontology/mappings/ (BFO, CCO, PLOVER, POLECAT, UCDP, FrameNet
     mappings — full for MVP ontologies, stubs elsewhere)
   - tests/test_primitives.py, test_mappings.py
   - pyproject.toml (PyPI publishable as `tacitus-ontology`)
   - .github/workflows/ci.yml (lint + test on push)

7. Update PRAXIS the product's backend/requirements.txt to depend on
   `tacitus-ontology>=1.0.0` (once published to PyPI). Backend imports
   shift from local YAML reads to package imports.

PART D — Audit:

8. Implement scripts/audit-llm-pattern-coverage.ts (was a stub from
   Phase 0). It scans src/lib/tools/registry/**/*.ts for declared
   `lPatterns` field on tool registry entries; fails if any tool
   references an L-pattern outside L1-L12.

9. Implement scripts/audit-work-ontology-coverage.ts. It scans every
   Context in Firestore and ensures `workOntologyId` is set; fails if any
   Context lacks one. (For MVP, the demo Contexts are seeded; the audit
   ensures runtime invariant.)

10. Add audit:llm-pattern-coverage and audit:work-ontology-coverage to
    audit:gate in package.json.

11. Update PRAXIS_ARCHITECTURE.md §3 to reference the work ontologies as a
    second category, with pointer to backend/data/ontologies/work/.

DO NOT TOUCH:
- The 13 existing domain ontology specs at backend/data/ontologies/
  specializations/. (Surface them; don't edit them.)
- The 7 subagents.
- src/lib/firebase/admin.ts, src/middleware.ts, firestore.rules.
- The 52 tool registry entries.

DO NOT INVENT:
- A ninth meta-primitive. (The 8 are settled per ADR-0038.)
- A new ontology category. (Domain + Work only.)

CONSTRAINTS:
- Work ontology subtypes match the meta-primitive whitelist
  (Actor/Claim/Interest/Constraint/Leverage/Commitment/Event/Narrative).
- Each work ontology has at least 4 subtypes per primitive.
- Pydantic models are byte-parity with YAML spec (audit:ontology-mapping
  catches drift).
- tacitus-ontology v1.0.0 is publishable to PyPI as a clean Python package.
- No SDK imports outside ai/providers.* (this phase doesn't touch AI calls,
  but verify nothing else slipped in).

VERIFICATION (before opening PR):
  npm run lint
  npx tsc --noEmit
  npm run test
  pytest backend/ -q
  pytest tests/test_ontology_system.py -v   # extension test for work
                                            # ontology resolution
  npm run audit:gate
  npm run audit:llm-pattern-coverage         # green
  npm run audit:work-ontology-coverage       # green (no Contexts seeded
                                            # yet so trivially green)
  npm run audit:ontology-mapping             # green
  npm run audit:ontology-versions            # green
  npm run build

  # Manual smoke
  npm run dev
  open http://localhost:3000/ontologies      # list shows 13 domain + 3
                                             # work ontologies
  open http://localhost:3000/ontologies/conflict  # detail loads, mappings
                                                  # render
  open http://localhost:3000/ontologies/foreign-policy-research  # work
                                                                  # ontology
                                                                  # detail
                                                                  # loads

  # tacitus-ontology package check
  cd /tmp && git clone <tacitus-ontology repo> && cd tacitus-ontology
  python -m pytest tests/  # all tests green
  python -m build  # creates wheel

PR TITLE: feat(v5-phase-1): ontology surfacing + 3 work ontologies +
  tacitus-ontology v1.0
PR BODY: Reference ADR-0040 (L-pattern coverage), ADR-0038 (work ontologies),
  PRAXIS_VISION_v4_02_ARCHITECTURE.md §3.2 (work ontology spec).
  Audit results green. tacitus-ontology v1.0 published to GitHub awaiting
  PyPI publication.

ROLLBACK: git revert <merge-commit>; the published tacitus-ontology repo
  stays (delete the GitHub repo if catastrophic).
```

---

# === PHASE 2A — CONTEXT PAGE SHELL + 8-PANEL SIDEBAR ===

**Wave:** 2 (parallel — Agent A frontend), after Phase 1 merges
**Effort:** 1 week
**Prerequisite:** Phase 1 merged.

## Prompt 2A.A — Context page shell with 8-panel sidebar

```
=== PHASE 2A — Context Page Shell + 8-Panel Sidebar ===

READ FIRST:
1. docs/build/PRAXIS_v5_BUILD_01_AGENT_OPERATING_GUIDE.md
2. docs/architecture/PRAXIS_VISION_v4_01_VISION.md §4 (Context Management
   sidebar architecture, 8 panels)
3. docs/architecture/PRAXIS_VISION_v4_03_BUILD.md §1 Module 2
4. src/app/app/cases/, src/app/app/situations/, src/app/app/syria-case/
   (the legacy surfaces being collapsed; archived in cleanup pass)
5. src/app/app/workbench/[caseId]/  (existing workbench tabs that migrate)
6. src/components/cytoscape/  (existing graph viz wrapper)
7. /mnt/skills/user/praxis-conventions/SKILL.md
8. /mnt/skills/public/frontend-design/SKILL.md

GOAL:
Build the unified Contexts surface at /contexts and /contexts/[id] with the
8-panel sidebar architecture. Migrate workbench tabs into the new shell.
Add basic empty-state UX for new Contexts.

DELIVERABLES:

1. /contexts — Context list at src/app/contexts/page.tsx:
   - Cards for each owned Context (read from
     users/{uid}/situations via withCalibration)
   - Each card: name, work episode badge, source count, last-modified,
     thumbnail (a small graph snippet or static placeholder)
   - "+ New Context" button → opens 30-second wizard
     (src/components/contexts/NewContextWizard.tsx)
   - Search/filter by name, by domain ontology stack, by date range
   - Sort: last-modified (default), name, source count

2. /contexts/[id] — unified Context page at
   src/app/contexts/[id]/page.tsx:
   - Layout: sidebar (left, 280px wide, sticky) + main canvas (right, fill)
   - Sidebar shows the 8 panels per File 1 §1:
     ⊙ Frame
     ☰ Sources (with sub-tabs: Documents, Research, Vetted feeds)
     ⌬ Extraction Lenses (domain ontologies — power-user, read-only by
       default)
     ⊞ Work Process (work ontology editable form)
     ⌚ Timeline (situation episodes + work episodes, dual strand)
     ◊ Graph (Cytoscape canvas)
     ✎ Drafts
     ⚙ Methods used
   - Active panel selection persisted in URL search param ?panel=<name>
   - Active panel renders in main canvas

3. Each of the 8 panels as separate components at
   src/components/contexts/panels/<Name>Panel.tsx:

   FramePanel — 4 canonical fields editable, Frame Health indicator,
     Context metadata (geography, primary actors, assumptions, gaps).

   SourcesPanel — three sub-tabs (Documents, Research, Vetted feeds);
     drag-drop upload zone at top; each row shows tier badge, title,
     language, date, count of graph nodes extracted, count of drafts
     citing. Click row → side panel showing parsed content + provenance.

   ExtractionLensesPanel — read-only by default; shows active stack;
     per-primitive coverage; per-lens contribution; list of inactive
     lenses; power-user "edit stack" toggle.

   WorkProcessPanel — editable form following the work ontology template.
     Reads users/{uid}/situations/{caseId}/metadata.workOntologyId and
     fetches from backend/data/ontologies/work/. Renders fields per the
     work ontology spec (roles, deliverables, cycles, constraints).

   TimelinePanel — two strands on single time axis; situation episodes
     above, work episodes below. Click episode → scope every other panel
     to that point in time. Bi-temporal slider at top. (Phase 2E
     implements the deep semantics; this phase ships UI scaffold.)

   GraphPanel — Cytoscape canvas using existing wrapper at
     src/components/cytoscape/. Color-coded by primitive, sized by
     centrality, ontology-shape variation. Layout switcher
     (force-directed, hierarchical, timeline). Click node → side panel
     with provenance. "Show candidate layer" toggle.

   DraftsPanel — list of drafts produced from this Context. Sortable
     by deliverable type, work episode, last-modified, status. Click →
     /draft/[draftId].

   MethodsUsedPanel — history of every Method run with input, output,
     model, cost, latency, work episode. Re-runnable. Forkable.

4. NewContextWizard at src/components/contexts/NewContextWizard.tsx:
   - 30-second flow: name → primary domain (auto-suggest from name) →
     work ontology (auto-suggest from active User Model) → 4-field
     frame → submit
   - Submit creates Firestore doc + Postgres rows (graph nodes empty)
   - Redirects to /contexts/[newCaseId] with empty Sources panel ready

5. Migrate existing workbench tabs:
   - Frame: existing src/app/app/workbench/[caseId]/frame logic
   - Sources: existing logic (extend with tier UI in Phase 2D)
   - Graph: existing logic (Cytoscape already wired)
   - Add 5 new panels (Extraction Lenses, Work Process, Timeline,
     Drafts, Methods used) as scaffolds; details in Phases 2B-E.

6. Add 301 redirects in src/middleware.ts (consult Giulio if any change
   to middleware) — actually, add redirects in
   src/app/app/cases/page.tsx, .../situations/page.tsx, etc. as
   `redirect('/contexts')` Server Actions. Do not modify middleware.ts
   itself.

7. Update src/app/app/page.tsx homepage to surface 4 most-recent Contexts
   as cards below the Ask bar (per File 1 §2 of v4 PRODUCT). Don't build
   the full Ask bar yet — that's Phase 5. Just the recent-Contexts strip
   for now.

8. Update audit:routes script to expect the new /contexts and
   /contexts/[id] routes.

DO NOT TOUCH:
- src/middleware.ts (LOCKED)
- src/app/app/workbench/[caseId]/  (deprecate by route, keep code as
  reference until Phase 2 sub-phases finish migration)
- The 7 subagents.
- The 52 tool registry entries.
- Cytoscape wrapper internals (use it; don't refactor).

DO NOT INVENT:
- A new editor library (Lexical comes in Phase 6).
- A new graph viz library (Cytoscape stays).
- A new state management library (TanStack Query stays).

CONSTRAINTS:
- Tailwind 4 only.
- All new types extend src/types/context.ts (with byte-parity in
  backend/types/context.py — coordinate with Agent C if extending types).
- Owner-scoping: every Context read goes through withCalibration; every
  write through withContextAware. Audit:owner-scoping enforces.
- All 8 panels must render without crashing on empty data (a brand-new
  Context with no sources, no graph, no episodes).
- Lighthouse mobile score on /contexts/[id] >= 80.

VERIFICATION:
  npm run lint
  npx tsc --noEmit
  npm run test
  npm run audit:gate
  npm run audit:routes               # canonical /contexts entries present
  npm run audit:context-types-parity
  npm run audit:owner-scoping
  npm run build

  # Manual smoke
  npm run dev
  open http://localhost:3000/contexts          # list loads
  click "+ New Context" → wizard → submit      # creates new Context
  open /contexts/[newId]                       # 8 panels load
  click each of 8 panels                       # each renders without
                                                # error
  open http://localhost:3000/app                # recent Contexts visible

PR TITLE: feat(M2-2A): Context page shell + 8-panel sidebar
PR BODY: Reference v4 PRODUCT §4. ADR-0038. Migrate workbench tabs (legacy
  routes redirect). Frame Health indicator wired. Empty states handled.
  Lighthouse mobile: 84.

ROLLBACK: git revert <merge-commit>; legacy workbench routes still work.
```

---

# === PHASE 2B — DOCUMENT PIPELINE ===

**Wave:** 2 (parallel — Agent B backend), after Phase 1 merges
**Effort:** 1 week
**Prerequisite:** Phase 1 merged.

## Prompt 2B.A — Document pipeline with Docling + GLiNER + Gemini extraction

```
=== PHASE 2B — Document Pipeline (Docling + GLiNER + Gemini Extraction) ===

READ FIRST:
1. docs/build/PRAXIS_v5_BUILD_01_AGENT_OPERATING_GUIDE.md
2. docs/architecture/PRAXIS_VISION_v4_02_ARCHITECTURE.md §5.1 (Document
   pipeline D1-D12 detailed)
3. docs/architecture/PRAXIS_VISION_v4_03_BUILD.md §1 Module 2 PART D
4. cloud_functions/on_document_uploaded/ (existing trigger)
5. backend/graphify_tacitus/ (existing extraction)
6. backend/services/ontology_system.py (resolves active stack)
7. backend/data/ontologies/specializations/ (the 13 lenses)
8. /mnt/skills/user/praxis-conventions/SKILL.md

GOAL:
Implement the Document pipeline as a 12-step chain: receive → parse
(Docling) → chunk (spaCy) → embed (text-embedding-005) → receipt →
extract (GLiNER L1 + Gemini L2) → resolve (Wikidata) → firewall → route
→ commit → index → notify. Replace the current pdf-parse with Docling.
Add GLiNER pre-pass for cost reduction.

DELIVERABLES:

1. backend/services/docling_parser.py:
   - Wraps DS4SD/docling (MIT) for structurally faithful PDF + DOCX +
     HTML parsing. Preserves byte spans.
   - Public API: parse(file_path: str, mime_type: str) → ParsedDocument
     with chunks, text, byte_spans, structure metadata.
   - Format support: PDF (Docling), DOCX (Docling), HTML
     (BeautifulSoup), TXT (plain), audio (Whisper via Vertex).
   - Tests at backend/tests/test_docling_parser.py with sample PDFs
     covering: text-heavy report, scanned PDF, slide deck,
     mixed-content document.

2. backend/services/gliner_pre_pass.py:
   - Wraps urchade/GLiNER (Apache 2.0) for fast NER without LLM call.
   - Public API: detect_entities(text: str, primitives: list[str]) →
     list[EntitySpan] with span, primitive type, confidence.
   - Loaded once at module import; reused across calls (singleton model).
   - Tests at backend/tests/test_gliner_pre_pass.py.

3. backend/graphify_tacitus/extraction.py — refactor:
   - L1 step: GLiNER detects entity spans (no LLM, fast, free).
   - L2 step: Gemini 3.1 Pro typed extraction with the active ontology
     stack's prompts (one prompt per active lens).
   - Combine: GLiNER spans inform Gemini's attention; Gemini does the
     typed structuring.
   - Output: candidate ACO nodes + edges with provenance (doc_id, span,
     confidence).
   - Cost target: $0.01-0.05 per document (vs. ~$0.05-0.20 without
     GLiNER pre-pass).

4. backend/services/wikidata_resolver.py:
   - Public API: resolve_actor(name: str, type_hint: str = None) →
     Optional[WikidataQID] with disambiguation.
   - Uses SPARQL query against query.wikidata.org.
   - Caches results in Firestore at
     ontologies/wikidata-cache/{normalized_name}.
   - LightGBM scorer (existing or v1.5) for fuzzy matches.
   - Tests with known entities: "Russia" → Q159, "United Nations" →
     Q1065, "Hayʼat Tahrir al-Sham" → Q21731129.

5. cloud_functions/on_document_uploaded/main.py — refactor as 12-step
   chain per File 2 §5.1 of v4 architecture:
   [1] receive (existing trigger)
   [2] parse (Docling) — NEW
   [3] chunk (semantic, spaCy boundaries) — extend
   [4] embed (text-embedding-005, 768-dim, batched) — extend
   [5] receipt (Source Receipt at tier T0/T1/T2) — extend with tier
       (Phase 2D will add UI)
   [6] extract (GLiNER L1 + Gemini L2) — refactor
   [7] resolve (Wikidata canonical) — NEW service call
   [8] firewall (existing symbolic firewall) — keep
   [9] route (≥0.8 → Evidence; 0.5-0.8 → Review Queue; <0.5 → discard)
   [10] commit (two-phase commit) — keep
   [11] index (pgvector update; Cognee disabled) — extend
   [12] notify (Firestore subscription update) — keep

6. Add scripts/audit-document-pipeline-shape.ts (was a stub from
   Phase 0). It scans the cloud function code and ensures the 12 steps
   are present in order, each labeled with `# [N] step_name` comment.

7. Add audit:document-pipeline-shape to audit:gate.

8. backend/tests/test_document_pipeline_e2e.py:
   - Upload a known PDF
   - Assert: 12 steps logged in order
   - Assert: graph_nodes contain >= 5 candidates per primitive
   - Assert: at least 1 actor resolved to Wikidata
   - Assert: source receipt created with correct tier
   - Assert: pgvector embeddings present (768-dim)
   - Assert: total cost < $0.10
   - Assert: total latency < 30s

DO NOT TOUCH:
- Symbolic firewall internals at src/lib/firewall/, backend/firewall/.
  Use the existing API.
- Two-phase commit protocol at src/lib/firebase/two-phase-commit.ts.
- pgvector schema (768-dim is locked).
- The 13 ontology lens specs (Phase 1 surfaced them; don't edit).
- Cognee bridge (stays disabled-first).

DO NOT INVENT:
- A new chunking strategy (spaCy sentence boundaries are fine).
- A new embedding dimension (768 is locked).
- A new firewall rule (use existing).

CONSTRAINTS:
- Docling is MIT-licensed; verify license file present.
- GLiNER is Apache 2.0; verify license file present.
- All Wikidata calls obey rate limit (1 query/sec; use cached results
  when possible).
- Extraction cost reduction: ≥60% vs. pre-GLiNER baseline (measure with
  benchmark fixture).
- Latency target: ≤30s per typical 10-page PDF.

VERIFICATION:
  cd backend && pytest tests/test_docling_parser.py -v
  cd backend && pytest tests/test_gliner_pre_pass.py -v
  cd backend && pytest tests/test_wikidata_resolver.py -v
  cd backend && pytest tests/test_document_pipeline_e2e.py -v
  cd backend && mypy --strict
  npm run audit:gate
  npm run audit:document-pipeline-shape  # green
  npm run audit:embedding-dim             # green (768 only)
  npm run audit:firewall-coverage         # green
  npm run audit:bi-temporal-coverage      # green

  # Cost benchmark
  python backend/scripts/benchmark_extraction_cost.py
    # Expected: GLiNER+Gemini ≤ 0.4 × Gemini-only cost

PR TITLE: feat(M2-2B): Document pipeline with Docling + GLiNER + Gemini
PR BODY: Reference v4 ARCHITECTURE §5.1. ADR-0038. Cost reduction 65%
  benchmark. 12-step chain audit-enforced.

ROLLBACK: git revert <merge-commit>; existing pdf-parse fallback re-enabled.
```

---

# === PHASE 2C — RESEARCH PIPELINE (SIMPLIFIED MVP) ===

**Wave:** 2 (parallel — Agent C backend), after Phase 1 merges
**Effort:** 1 week
**Prerequisite:** Phase 1 merged.

## Prompt 2C.A — Research pipeline (Google Grounded Search + Wikidata SPARQL)

```
=== PHASE 2C — Research Pipeline (Simplified MVP) ===

READ FIRST:
1. docs/build/PRAXIS_v5_BUILD_01_AGENT_OPERATING_GUIDE.md
2. docs/architecture/PRAXIS_VISION_v4_02_ARCHITECTURE.md §5.2 (Research
   pipeline R1-R13)
3. docs/architecture/PRAXIS_VISION_v4_03_BUILD.md §1 Module 2 PART C
4. backend/agents/source_augmenter/  (existing subagent — but Phase 7
   deploys, this phase wires the pipeline)
5. The simplified MVP per File 1 §1: Google Grounded Search + Wikidata
   SPARQL only. Firecrawl + Parallel AI deferred to v1.5.
6. /mnt/skills/user/praxis-conventions/SKILL.md

GOAL:
Implement the Research pipeline as a 13-step LangGraph state machine
(simplified for MVP — drop Firecrawl deep-crawl and Parallel AI multi-
search; Google Grounded Search + Wikidata SPARQL alone is sufficient).
This is the source-augmenter equivalent of the Document pipeline.

DELIVERABLES:

1. backend/services/google_grounded_search.py:
   - Wraps Vertex AI's native grounding for Gemini calls.
   - Public API: grounded_search(query: str, max_results: int = 10) →
     list[GroundedResult] with text, url, snippet, citations.
   - Tier T5 (per Source Tier system).
   - Cost: ~$0.01-0.03 per call (free with Gemini grounding).
   - Tests at backend/tests/test_google_grounded_search.py.

2. backend/services/wikidata_sparql.py:
   - Public API: sparql_query(query: str) → list[dict] for arbitrary
     SPARQL queries.
   - Higher-level helpers: actor_disambiguation(name) → list[Actor],
     entity_facts(qid) → dict, related_entities(qid, relation) →
     list[Entity].
   - Caches results in Firestore at ontologies/wikidata-cache/.
   - Rate-limited (1 query/sec).
   - Tests at backend/tests/test_wikidata_sparql.py.

3. backend/agents/source_augmenter/state_machine.py — refactor as a
   13-step LangGraph state machine per File 2 §5.2 of v4 architecture
   (simplified):
   [R1] decompose (Gemini 3.1 Pro decomposes into 3-5 sub-questions)
   [R2] source_pick (vetted feeds → Wikidata → Google Grounded)
   [R3] fan_out (Cloud Tasks dispatch)
   [R4] fetch_parse (typed Pydantic models per source)
   [R5] relevance_score (Gemini 3 Flash + embedding cosine)
   [R6] cross_verify (≥2 sources for promotion past Claim layer)
   [R7] receipts (Source Receipt at tier T1-T5)
   [R8] extract (GLiNER L1 + Gemini L2 — share with Document pipeline)
   [R9] resolve (Wikidata canonical)
   [R10] firewall
   [R11] route (T1-T3 cross-verified → Evidence; T4-T5 → Review Queue;
                T7 → Review Queue, never auto-promoted)
   [R12] commit (two-phase commit)
   [R13] respond (structured research report streamed back)

4. backend/routers/research.py:
   - POST /api/research/run with body { question: str, contextId: str,
     userModelId: str }
   - Authenticates via withCalibration
   - Triggers source_augmenter state machine
   - Streams response back via Server-Sent Events (SSE) for the
     research report sections
   - Total time: 30-60s (MVP target — full agentic deep search with
     Firecrawl + Parallel AI to v1.5 will be 30-90s)
   - Cost target: $0.10-0.30 per query

5. src/lib/research/pipeline.ts — Next.js orchestrator:
   - Public function runResearch(question, contextId, userModelId) →
     AsyncIterable<ResearchUpdate> for streaming UI updates
   - Calls /api/research/run via fetch + SSE
   - Returns structured updates: subQuestionGenerated, sourceFound,
     extractionCandidate, finalReport

6. New Research Methods registered in src/lib/tools/registry/:
   - research.deep-research-agent.ts (the orchestrator — full pipeline)
   - research.wikidata-sparql.ts (lower-level entity grounding)
   - research.google-grounded-search.ts (lower-level web context)
   Each with skills/tools/<id>/SKILL.md and Tool Contract v2 conformance.

7. Add scripts/audit-research-pipeline-shape.ts (was a stub from Phase 0).
   It scans backend/agents/source_augmenter/state_machine.py and ensures
   the 13 steps are present in order with `# [R<N>] step_name` comments.

8. Add audit:research-pipeline-shape to audit:gate.

9. Tests at backend/tests/test_research_pipeline_e2e.py:
   - Run with question "What's the current US federal stance on AI
     transparency in 2026?"
   - Assert: 13 steps logged
   - Assert: research report streams back with executive summary,
     key findings (cited), source matrix, gaps, contradictions,
     follow-ups, candidates
   - Assert: total cost <= $0.40
   - Assert: total latency <= 60s
   - Assert: at least 5 sources found, mixed tiers (T1-T5)
   - Assert: each finding has tier badge

DO NOT TOUCH:
- Firecrawl integration code (placeholder for v1.5).
- Parallel AI integration code (placeholder for v1.5).
- The 7 subagents' deployment configs (Phase 7).
- Symbolic firewall.
- Two-phase commit.

DO NOT INVENT:
- A new web search API (Google Grounded Search alone for MVP).
- A new agentic deep search loop (the simplified pipeline is sufficient).

CONSTRAINTS:
- Cost cap: $0.40 per Research call (enforce at Vertex Agent Engine
  runtime).
- Latency target: 60s P95.
- All Source Receipts written carry tier (T0-T7) and cross-verification
  flag.
- Cross-verification: any factual claim promoted past Claim layer must
  have ≥2 sources (different domains).
- Cognee disabled (do not write to Cognee in Research pipeline).

VERIFICATION:
  cd backend && pytest tests/test_google_grounded_search.py -v
  cd backend && pytest tests/test_wikidata_sparql.py -v
  cd backend && pytest tests/test_research_pipeline_e2e.py -v
  cd backend && mypy --strict
  npm run audit:gate
  npm run audit:research-pipeline-shape  # green
  npm run audit:tool-contract-v2          # 3 new Methods conform
  npm run audit:tool-skills-present       # 3 new SKILL.md present

PR TITLE: feat(M2-2C): Research pipeline (Google Grounded + Wikidata SPARQL)
PR BODY: Reference v4 ARCHITECTURE §5.2. MVP simplified — Firecrawl +
  Parallel AI deferred. 13-step audit-enforced. 3 new Research Methods.

ROLLBACK: git revert <merge-commit>; legacy /api/ai/deep-research route
  remains as fallback.
```

---

# === PHASE 2D — SOURCE TIER SYSTEM ===

**Wave:** 2 (parallel — Agent A finishes 2A then handles 2D), after Phase 2A
**Effort:** 3 days
**Prerequisite:** Phase 2A merged (or in same wave for Agent A).

## Prompt 2D.A — Source Tier system + UI badges + audit

```
=== PHASE 2D — Source Tier System (T0-T7) ===

READ FIRST:
1. docs/build/PRAXIS_v5_BUILD_01_AGENT_OPERATING_GUIDE.md
2. docs/architecture/PRAXIS_VISION_v4_02_ARCHITECTURE.md §4 (Source
   provenance tiers T0-T7)
3. /mnt/skills/user/praxis-conventions/SKILL.md

GOAL:
Implement the Source Tier system end-to-end: type definitions, Postgres
migration, UI badges with color + label, confidence cap enforcement at
firewall, audit script.

DELIVERABLES:

1. src/lib/sources/tiers.ts:
   - Type SourceTier = 'T0' | 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7'
   - Const TIER_DEFINITIONS with label, description, confidence cap,
     citation weight, can_promote_to_verdict, ui_color (per File 2 §4 of
     v4 architecture)
   - Helper functions: getTierDefinition(tier), canPromoteToVerdict(tier,
     reviewed: bool), confidenceCapForTier(tier)

2. backend/types/source.py — byte-parity Pydantic mirror.

3. Postgres migration backend/migrations/0024_source_tier.py:
   - ALTER TABLE workspace_chunks ADD COLUMN tier TEXT NOT NULL
     DEFAULT 'T7'
   - ALTER TABLE document_chunks ADD COLUMN tier TEXT NOT NULL
     DEFAULT 'T7'
   - CHECK constraint on both: tier IN ('T0','T1','T2','T3','T4','T5',
     'T6','T7')
   - Backfill existing rows: T0 if user-uploaded with no detected
     authority; otherwise T7 (synthesized) for safety. Manual review
     of legacy rows in v1.5.
   - Idx: btree on (case_id, tier) for tier-filtered queries.

4. SourceTierBadge component at src/components/sources/TierBadge.tsx:
   - Renders tier with color (green for T0/T1, teal for T2, yellow for
     T3, amber for T4/T5, orange for T6, red for T7) + text label
   - Tooltip on hover showing tier description
   - Used in SourcesPanel rows, in citation footnotes, in source
     receipts side panel

5. Update Document pipeline (Phase 2B) and Research pipeline (Phase 2C)
   to write tier field on every Source Receipt. (Coordinate with Agents B
   and C.)

6. Update symbolic firewall (src/lib/firewall/structural.ts and
   backend/firewall/structural.py) to enforce confidence caps:
   - Reject Verdict-layer write if source tier is T6 or T7
   - Cap confidence at tier ceiling on Claim-layer writes
   - Surface contradictions (T1 disagrees with T6) as advisories on
     output

7. Implement scripts/audit-source-tier-discipline.ts (was a stub from
   Phase 0):
   - Every workspace_chunk and document_chunk row has tier set
   - Every Source Receipt in Firestore has tier field
   - Every citation in drafts/reports references a tier-aware Source
     Receipt
   - No T6 or T7 source feeds Verdict-layer write

8. Add audit:source-tier-discipline to audit:gate.

DO NOT TOUCH:
- pgvector schema (768-dim).
- Cognee config.
- The 13 ontology specs.

DO NOT INVENT:
- A 9th tier or new tier semantics.
- A way to bypass the confidence cap.

CONSTRAINTS:
- Tier values are exactly T0-T7. No "T1.5" or modifications.
- Confidence cap enforcement at firewall is hard, not advisory.
- Backfill logic is conservative (defaults to T7 — least trusted).
- UI tier color is consistent across all surfaces (one source of truth in
  src/lib/sources/tiers.ts).

VERIFICATION:
  npm run lint
  npx tsc --noEmit
  npm run test
  pytest backend/ -q
  pytest tests/test_migration_0024.py -v
  npm run audit:gate
  npm run audit:source-tier-discipline  # green
  npm run audit:firewall-coverage        # green
  npm run audit:context-types-parity     # green (TS/Pydantic byte parity)
  npm run build

  # Manual smoke
  npm run dev
  open /contexts/syria-2026  # tier badges visible on every source
                              # in Sources panel

PR TITLE: feat(M2-2D): Source Tier system (T0-T7) + audit + UI badges
PR BODY: Reference v4 ARCHITECTURE §4. Migration 0024 backfilled.
  Firewall confidence-cap enforcement live. 24 audit pass.

ROLLBACK: git revert <migration commit>; rollback migration via Alembic.
```

---

# === PHASE 2E — EPISODE + TIMELINE MODULE ===

**Wave:** 2 (parallel — Agent A finishes 2D then 2E), after Phase 2A
**Effort:** 4 days
**Prerequisite:** Phase 2A merged.

## Prompt 2E.A — Episode + Timeline module

```
=== PHASE 2E — Episode + Timeline Module ===

READ FIRST:
1. docs/build/PRAXIS_v5_BUILD_01_AGENT_OPERATING_GUIDE.md
2. docs/architecture/PRAXIS_VISION_v4_02_ARCHITECTURE.md §6 (Episode
   dimension, situation episodes + work episodes)
3. /mnt/skills/user/praxis-conventions/SKILL.md

GOAL:
Implement the Episode + Timeline module: Postgres episode_state table,
Timeline panel with dual-strand rendering, episode-scoped re-rendering of
other panels, basic bi-temporal scoping (full DIALECTICA-grade in v1.5).

DELIVERABLES:

1. Postgres migration backend/migrations/0025_episode_state.py:
   - CREATE TABLE episode_state (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       case_id UUID NOT NULL,
       episode_id TEXT NOT NULL,
       owner_uid TEXT NOT NULL,
       strand TEXT NOT NULL CHECK (strand IN ('situation', 'work')),
       episode_type TEXT NOT NULL,  -- e.g., 'PRST', 'briefing-cycle'
       title TEXT NOT NULL,
       valid_from TIMESTAMPTZ NOT NULL,
       valid_to TIMESTAMPTZ,
       graph_snapshot_id UUID,  -- optional snapshot reference
       metadata JSONB,
       created_at TIMESTAMPTZ DEFAULT now()
     );
   - INDEX (case_id, valid_from); INDEX (case_id, strand);
   - INDEX (owner_uid, case_id) for owner-scoped queries.

2. backend/types/episode.py — Pydantic Episode model.
3. src/types/episode.ts — TS mirror, byte-parity.

4. backend/routers/episodes.py:
   - GET /api/episodes/[caseId] → list of episodes for case (paginated)
   - POST /api/episodes/[caseId] → create new episode (owner-scoped)
   - PUT /api/episodes/[caseId]/[episodeId] → update episode
   - DELETE → soft delete (set valid_to)
   - GET /api/episodes/[caseId]/[episodeId]/graph-snapshot → returns
     graph nodes valid as of this episode

5. TimelinePanel component at
   src/components/contexts/panels/TimelinePanel.tsx:
   - Dual-strand horizontal axis: situation episodes above, work
     episodes below
   - Click episode → set URL search param ?episode=<id> + dispatch
     scope event
   - Bi-temporal slider control at top with current scope indicator
   - "+ Add episode" button (manual creation)
   - Filter by strand (situation only / work only / both)
   - Filter by episode type
   - Color-coded by primitive type

6. EpisodeContext (React) at src/components/contexts/EpisodeContext.tsx:
   - Provider that wraps the Context page
   - Provides: scopedEpisode (current selection), setScopedEpisode
   - Other panels (FramePanel, SourcesPanel, GraphPanel, DraftsPanel)
     subscribe to scopedEpisode and filter their data accordingly
   - Default scope: most recent episode (latest valid_from)

7. Backend filtering helpers at
   backend/services/episode_scoping.py:
   - scoped_graph_nodes(case_id, episode_id) → SELECT WHERE
     valid_from <= episode.valid_from AND
     (valid_to IS NULL OR valid_to > episode.valid_from)
   - scoped_sources(case_id, episode_id) → similar logic
   - scoped_drafts(case_id, episode_id) → drafts produced *for* this
     episode (work_episode_id field)

8. Implement scripts/audit-episode-bi-temporal-coverage.ts (was a stub):
   - Every episode_state row has valid_from set
   - Every graph_node row has valid_from set
   - Every graph_edge row has valid_from set
   - All bi-temporal queries use the parametrized scoping helpers (no
     direct SQL with hardcoded NOW())

9. Add audit:episode-bi-temporal-coverage to audit:gate.

10. Tests at backend/tests/test_episode_scoping.py:
    - Create case with 5 episodes spanning 1 year
    - Insert graph nodes with various valid_from values
    - Query at episode E2 → assert only nodes with valid_from <= E2 returned
    - Query at episode E5 → assert all relevant nodes returned
    - Query bi-temporally (asserted_to before E3) → assert correct
      historical view

DO NOT TOUCH:
- Postgres existing schemas (graph_nodes, graph_edges already have
  valid_from columns from earlier migrations).
- The Timeline UI in legacy workbench (will be replaced by this panel).
- Symbolic firewall.
- Cognee.

DO NOT INVENT:
- A new bi-temporal substrate (Graphiti integration is v1.5).
- A new episode primitive (Event meta-primitive covers it).

CONSTRAINTS:
- All episode queries are owner-scoped via withCalibration.
- valid_from is mandatory; valid_to is nullable (open-ended episodes).
- Episode strand is exactly 'situation' or 'work' (no other values).
- Default to episode-scoped UI as opt-in (not enforced) for MVP. Full
  bi-temporal default in v1.5.

VERIFICATION:
  npm run lint
  npx tsc --noEmit
  npm run test
  pytest backend/ -q
  pytest tests/test_migration_0025.py -v
  pytest tests/test_episode_scoping.py -v
  npm run audit:gate
  npm run audit:episode-bi-temporal-coverage  # green
  npm run audit:bi-temporal-coverage           # green
  npm run audit:owner-scoping                  # green

  # Manual smoke
  npm run dev
  open /contexts/syria-2026?panel=timeline
  click an episode → other panels re-scope

PR TITLE: feat(M2-2E): Episode + Timeline module + bi-temporal scoping
PR BODY: Reference v4 ARCHITECTURE §6. Migration 0025 applied. Dual-strand
  Timeline live. Episode scope re-renders Sources + Graph + Drafts panels.

ROLLBACK: git revert; rollback migration 0025.
```

---

# === PHASE 3 — USER MODELS MODULE ===

**Wave:** 2 (parallel — Agent C, after Phase 2C), after Phase 1 merges
**Effort:** 1 week
**Prerequisite:** Phase 1 merged.

## Prompt 3.A — User Models module + 3 seeded personas + capture loop

```
=== PHASE 3 — User Models Module + 3 Seeded Personas + Capture Loop ===

READ FIRST:
1. docs/build/PRAXIS_v5_BUILD_01_AGENT_OPERATING_GUIDE.md
2. docs/architecture/PRAXIS_VISION_v4_01_VISION.md §4 (User Model fields)
3. docs/architecture/PRAXIS_VISION_v4_02_ARCHITECTURE.md §3.2 (work
   ontology integration with User Models)
4. docs/architecture/PRAXIS_VISION_v4_03_BUILD.md §1 Module 3
5. docs/adr/0037-*.md (User Models as first-class versioned artifacts)
6. docs/adr/0038-*.md Persona Decision section (3 MVP personas)
7. /mnt/skills/user/praxis-conventions/SKILL.md

GOAL:
Implement the User Models module — typed versioned forkable artifacts,
3 seeded public personas, library + editor surfaces, the capture loop
that grows User Model value over time.

DELIVERABLES:

1. Postgres migration backend/migrations/0026_user_model_versions.py:
   - CREATE TABLE user_model_versions (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       user_uid TEXT NOT NULL,
       parent_model_id UUID NULL,
       model_id TEXT NOT NULL,
       version INT NOT NULL,
       fields_json JSONB NOT NULL,
       published_at TIMESTAMPTZ,
       deprecated_at TIMESTAMPTZ,
       created_at TIMESTAMPTZ DEFAULT now()
     );
   - CHECK (deprecated_at IS NULL OR deprecated_at >= published_at)
   - UNIQUE(user_uid, model_id, version)
   - INDEX (user_uid, model_id, version DESC) for latest-version queries
   - INDEX (parent_model_id) for fork-tracking

2. Firestore schema:
   users/{uid}/user-models/{modelId}/
     current     # latest published model
     drafts/{draftId}  # uncommitted edits
   (No history sub-collection in MVP — Postgres user_model_versions has it.)

3. Extend src/types/context.ts UserContext with full User Model fields per
   File 1 §4.1 of v4 PRODUCT:
   - identity (string)
   - role, mandate, organization
   - methodologyToolkit (string[])
   - communicationStyle, confidenceTolerance
   - defaultOntologyStacks (per-domain map)
   - toolAffinities (Method IDs ranked)
   - standingAssumptions (string[])
   - prohibitedFrames (string[])
   - outputPreferences (citationFormat, briefVsLong, languagePosture)
   - sourcePreferences (trusted, deprioritized, languages)
   - parentModelId (nullable)
   - workOntologyId (e.g., 'foreign-policy-research')
   - audienceDefaults (typical reader profile)

4. Mirror in backend/types/context.py — byte-parity required.

5. Update withCalibration and withContextAware middlewares to load
   User Model fields into ContextSnapshot.user.

6. Build /users library at src/app/users/page.tsx:
   - "Public Library" section: 3 seeded archetypes as cards
   - "Your Models" section: user's owned + forked models
   - Each card: name, role, fork count, "fork" or "open" button
   - Search + filter by role/methodology

7. Build /users/[modelId] editor at src/app/users/[modelId]/page.tsx:
   - All fields editable in tabs:
     Identity / Mandate / Methodology / Style / Standing assumptions /
     Prohibited frames / Sources / Audience defaults
   - Diff vs parent (if forked)
   - Version history dropdown (read from user_model_versions)
   - Save → write to drafts/{draftId} in Firestore
   - Publish → write to user_model_versions in Postgres + update
     current in Firestore

8. Seed the 3 public User Models (per ADR-0038 Persona Decision):

   (a) foreign-policy-analyst:
       Identity: "Foreign Policy Analyst"
       Role: think-tank fellow / diplomatic correspondent / NGO
         researcher / government-affairs at multinational
       Mandate: track global political dynamics, produce analysis for
         institutional readers
       Methodology: Heuer-Pherson SATs, scenario planning, ACH,
         stakeholder analysis, framework analysis
       Style: analytical-thorough, neutral register, citation-heavy
       Standing assumptions:
         "Great-power competition is the master frame for the 2020s"
         "Domestic politics drive foreign policy more than foreign
           policy drives domestic"
       Source preferences (trusted): ICG, Foreign Affairs, Foreign Policy,
         Brookings, CFR, RAND, peer-reviewed PolSci, Reuters, AP, AFP,
         V-Dem, World Bank governance
       Prohibited frames: none specific (analyst exercises judgment)
       Audience: think-tank readers, policymaker peers, executive
         briefings, public-facing op-eds
       Typical deliverables: country card, scenario brief, policy memo,
         op-ed, conference paper, executive summary
       Default ontology stacks: Conflict + Mediation + Humanitarian for
         Indo-Pacific; defaults vary by region
       Work ontology: foreign-policy-research

   (b) domestic-policy-analyst:
       Identity: "Domestic Policy Analyst — US"
       Role: state/federal policy researcher / advocacy group analyst /
         think-tank fellow / civic-tech researcher / campaign policy
         staff
       Mandate: analyze US policy issues for legislative, regulatory,
         advocacy or research purposes
       Methodology: stakeholder analysis, regulatory analysis, legislative
         tracking, coalition analysis, evidence-based policy review
       Style: precise-accessible, data-grounded, audience-tunable
       Standing assumptions:
         "Policy moves through coalition dynamics"
         "Evidence-based framing requires both empirical rigor and
           political viability"
       Source preferences (trusted): GAO, CBO, CRS reports, Brookings,
         AEI, CAP, Heritage, state-level think tanks, peer-reviewed
         policy journals, Census, BLS, HUD, FRED, Politico, NYT, WSJ
       Prohibited frames:
         "Avoid hyperpartisan framing in formal deliverables"
         "Always present empirical evidence before normative claims"
       Audience: legislators, regulators, advocacy boards, journalists,
         public
       Typical deliverables: policy memo, hearing prep, talking points,
         op-ed, white paper, fact sheet, hill brief
       Default ontology stacks: Conflict + Mediation + Humanitarian for
         AI Reg context (MVP fits; v1.5 adds Governance + Regulatory)
       Work ontology: domestic-policy-analysis

   (c) corporate-strategic-analyst:
       Identity: "Corporate Strategic Analyst — Public Affairs &
         Sustainability"
       Role: corporate public affairs lead / sustainability / ESG
         director / regulatory affairs / political risk officer /
         government-affairs consultant
       Mandate: analyze political, regulatory, and sustainability
         dynamics affecting corporate strategy
       Methodology: stakeholder mapping, regulatory tracking, materiality
         assessment, scenario planning, political risk frameworks
       Style: executive-focused, decision-oriented, BLUF discipline,
         plain language
       Standing assumptions:
         "Corporate strategy is shaped by regulatory and political
           dynamics, not just market dynamics"
         "Stakeholder engagement is a strategic capability, not a PR
           function"
       Source preferences (trusted): industry reports, regulatory
         filings (SEC, EPA, FDA, USDA), trade press, GAO/CBO,
         sustainability standards (GRI, SASB, TCFD, ISSB), peer
         benchmarks, news
       Prohibited frames:
         "Avoid greenwashing-adjacent claims without verifiable
           evidence"
         "Never advise on what's said publicly without legal/comms
           review noted"
       Audience: C-suite, board, investors, regulators, employees,
         customers
       Typical deliverables: executive briefing, board memo,
         sustainability report, regulatory comment letter, stakeholder
         map, scenario brief, talking points
       Default ontology stacks: Mediation + Humanitarian for F&B
         context (MVP fits; v1.5 adds Sustainability + Regulatory)
       Work ontology: corporate-strategic-analysis

9. Implement the capture loop:
   - After every Ask response, surface a small footer prompt:
     "Save this framing as a standing assumption / methodology
     preference / source preference on your active User Model?"
   - One-click acceptance → writes to active model's draft document
   - User can later publish from the editor

10. Implement scripts/audit-user-model-versioning.ts (was a stub):
    - user_model_versions is append-only (no UPDATEs that change
      fields_json)
    - parent_model_id references resolve to existing model versions
    - version numbers monotonic per (user_uid, model_id)

11. Add audit:user-model-versioning to audit:gate.

12. Tests at backend/tests/test_user_models_e2e.py and
    src/tests/users.test.ts:
    - Create User Model
    - Edit User Model
    - Fork User Model
    - Publish version 2
    - Assert append-only behavior
    - Assert parent_model_id references work

DO NOT TOUCH:
- Existing UserContext minimum required fields (identity, role, mandate,
  preferences) — extend, don't replace.
- Firestore rules security boundary.
- The "compare two User Models" surface — it's v1.5.

DO NOT INVENT:
- A new versioning scheme (semver-like is fine but stay simple).
- A new auth flow.

CONSTRAINTS:
- All user-models writes are owner-scoped (uid in path).
- All fields stored as snake_case in JSON; rendered camelCase in TS.
- Fork creates a new model_id with parent_model_id reference; does not
  copy version history.
- User Models are private by default in MVP. Team sharing v1.5.
- Audit byte-parity TS/Python.

VERIFICATION:
  npm run lint
  npx tsc --noEmit
  npm run test
  pytest backend/ -q
  pytest tests/test_migration_0026.py -v
  pytest tests/test_user_models_e2e.py -v
  npm run audit:gate
  npm run audit:user-model-versioning      # green
  npm run audit:context-types-parity        # green
  npm run audit:owner-scoping               # green
  npm run build

  # Manual smoke
  npm run dev
  open /users  → 3 public archetypes visible
  click "Foreign Policy Analyst" → fork → opens /users/<newId> editor
  edit fields → save draft → publish version 1 → verify in Postgres
  open /users → fork shows in "Your Models" section

PR TITLE: feat(M3): User Models module + 3 seeded personas + capture loop
PR BODY: Reference ADR-0037, ADR-0038 Persona Decision. Migration 0026
  applied. 3 personas seeded. Capture loop integrated into Ask response
  footer.

ROLLBACK: git revert; rollback migration 0026; restore Firestore from
  daily backup.
```

---

## Wave 2 completion checklist

Before opening the wave-2-merge PR, verify all five Phase 2 sub-phases (2A,
2B, 2C, 2D, 2E) and Phase 3 are merged with green audits:

- [ ] Phase 2A — Context page shell + 8-panel sidebar
- [ ] Phase 2B — Document pipeline (Docling + GLiNER + Gemini)
- [ ] Phase 2C — Research pipeline (Google Grounded + Wikidata SPARQL)
- [ ] Phase 2D — Source Tier system + audit
- [ ] Phase 2E — Episode + Timeline module
- [ ] Phase 3 — User Models module + 3 seeded personas

After all six are green:
- Run full audit chain on the wave-2 integration branch
- Run persona suite stubs (will be fully implemented Phase 8)
- Open `mvp/wave-2/main` PR squashing all sub-phase commits to `main`

---

*End of File 2 of 3. Open File 3 — Frontend Phases 4-8 — for Methods,
Drafting Studio, Subagents, Demo Seeding, and Ship.*
