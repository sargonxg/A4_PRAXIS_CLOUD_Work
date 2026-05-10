# PRAXIS — Codex Continuation Charter (Master Index, Audit & Self-Driving Plan)

**File**: `PRAXIS_CODEX_00_MASTER_CHARTER.md`
**Owner**: Giulio Catanzariti (TACITUS)
**Target environment**: praxis.tacitus.me (production), staging.praxis.tacitus.me (staging)
**Last updated**: 2026-05-06
**Codex's role in this file**: Codex is a supervising senior engineer running an autonomous audit/build/verify loop until PRAXIS v1.0.0 is shipped to praxis.tacitus.me. Codex never deletes user data, never weakens security invariants, and never bypasses the four-phase collaboration pattern: **Read & report → Propose & confirm → Execute → Verify**.

---

## 0. What this file is

This is the master charter that ties together the **eleven pack-prompts** built across the previous planning sessions. Each pack is a self-contained engineering plan with prompts, hard rules, deliverables, and verification commands. This charter does three things:

1. **Indexes every pack** with its file location, scope, status field, dependency, and entry-point prompt.
2. **Defines the autonomous loop** Codex runs over those packs until every prompt's Definition of Done is satisfied, every audit is green, and the production deploy to praxis.tacitus.me is signed.
3. **Holds the live status table** Codex updates after each loop iteration, so Giulio can see at a glance what's done, what's in progress, and what's blocked.

When the loop completes — every pack `DONE`, every audit green, persona suites green for 10 consecutive runs, staging smoke green for 24 hours, production deploy clean — Codex tags `v1.0.0` and announces.

---

## 1. The eleven packs (canonical index)

| # | Pack | File path (Windows) | Scope | Branch | Hours | Status |
|---|---|---|---|---|---|---|
| 03 | Workbench Architecture | `C:\Users\giuli\Downloads\PRAXIS_CODEX_03_WORKBENCH_ARCHITECTURE.md` | Workbench shell, case-as-module pattern, sidebar trim, route consolidation foundation | `feature/workbench-consolidation` | ~33 | ☐ |
| 04 | Landing & Entry Rebuild | `C:\Users\giuli\Downloads\PRAXIS_CODEX_04_LANDING_AND_ENTRY_REBUILD.md` | De-Syria the public landing; 9-section structure; ExampleCasesGallery; post-login redirect | `feature/landing-rebuild` | ~25 | ☐ |
| 05 | Context vs Tools Separation | `C:\Users\giuli\Downloads\PRAXIS_CODEX_05_CONTEXT_VS_TOOLS_SEPARATION.md` | Truth-layer model; ContextHealthScore; symbolic-firewall extension; Trust Score persistence | `feature/context-vs-tools` | ~50 | ☐ |
| 06 | Ontology System | `C:\Users\giuli\Downloads\PRAXIS_CODEX_06_ONTOLOGY_SYSTEM.md` | 4 ontologies (Conflict/Mediation/Governance/Narrative), LangGraph ingestion pipeline, 2-phase commit | `feature/ontology-system` | ~55 | ☐ |
| 07 | Graph Visualization | `C:\Users\giuli\Downloads\PRAXIS_CODEX_07_GRAPH_VISUALIZATION.md` | Cytoscape.js viewer, 5 layouts, edit ops with audit trail, saved views | `feature/graph-visualization` | ~42 | ☐ |
| 08 | Tools Marketplace | `C:\Users\giuli\Downloads\PRAXIS_CODEX_08_TOOLS_MARKETPLACE.md` | Curated 16-tool registry, schema-driven UI, 4 persona suites, diagnostics dashboard | `feature/tools-marketplace` | ~50 | ☐ |
| 09 | Verification & Admin | `C:\Users\giuli\Downloads\PRAXIS_CODEX_09_VERIFICATION_AND_ADMIN.md` | Reality check on packs 03-08, diagnostics completion, admin consolidation, onboarding | `chore/verification-and-admin` | ~50 | ☐ |
| 10 | Postgres Knowledge Graph | `C:\Users\giuli\Downloads\PRAXIS_CODEX_10_POSTGRES_KNOWLEDGE_GRAPH.md` | Postgres+pgvector primary, Neo4j optional via flag, migration, traversal CTEs, semantic search | `feature/postgres-knowledge-graph` | ~60 | ☐ |
| 11 | Memo Studio & Launch | `C:\Users\giuli\Downloads\PRAXIS_CODEX_11_MEMO_STUDIO_AND_LAUNCH.md` | Memo Studio (Lexical, 6 templates), final consolidation, Comprehensive Audit, v1.0.0 tag | `feature/memo-studio-and-launch` | ~62 | ☐ |
| 12 | Context Architecture | `C:\Users\giuli\Downloads\PRAXIS_CODEX_12_CONTEXT_ARCHITECTURE.md` | 4-layer context (User/Workspace/Case/Conversation), Context Preparer subagent, advisory replaces gate | `feature/context-architecture-v2` | ~58 | ☐ |
| 13 | Tool-Context Interop | `C:\Users\giuli\Downloads\PRAXIS_CODEX_13_TOOL_CONTEXT_INTEROP.md` | Tool Contract v2, ContextProvider, skills system, 3 new subagents, suggestion engine | `feature/tool-context-interop` | ~58 | ☐ |
| | **Total** | | | | **~543 hrs** | |

**Status legend**:
- ☐ NOT STARTED
- 🟡 IN PROGRESS (commits made, audits not yet green)
- 🟢 DONE (all DoD met, audits green, persona suites green, branch merged to main)
- 🔴 BLOCKED (awaiting Giulio decision; see Blockers section below)

**Superseded files** (do not consume):
- `C:\Users\giuli\Downloads\PRAXIS_CODEX_09_FINAL_CONSOLIDATION_AND_LAUNCH.md` — replaced by Pack 09 Verification & Admin; consolidation work folded into Pack 11 K6/K7.

**Dependency graph** (strict order — do not run packs out of dependency):

```
03 ──> 04 ──> 05 ──> 06 ──> 07 ──> 08 ──> 09 ──> 10 ──> 11 ──> 12 ──> 13 ──> v1.0.0
```

Each pack's prompts reference invariants set by earlier packs. Running pack N before pack N-1 is incoherent.

---

## 2. The autonomous loop Codex runs

This is the algorithm Codex executes when handed this charter. It is the only algorithm. Codex does not deviate.

```
LOOP:
  for pack in [03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13]:
    if pack.status == DONE:
      continue

    # PHASE 1 — Read & report
    open(pack.file)
    for each prompt in pack:
      audit prompt's Definition of Done against the current codebase
      classify each DoD bullet as MET / PARTIAL / UNMET / UNKNOWN
    write a status report to docs/audits/<today>-PACK-<NN>-STATUS.md

    # PHASE 2 — Propose & confirm
    if any UNMET or PARTIAL:
      summarize the gaps in the PR description
      propose a remediation plan with file-level granularity
      tag Giulio for review
      WAIT for explicit "proceed" comment
    else:
      mark pack.status = DONE, update this charter, move to next pack

    # PHASE 3 — Execute
    on Giulio's "proceed":
      implement the remediation in small, named commits
      one prompt's worth of work per branch push
      preserve the four-phase pattern within complex prompts

    # PHASE 4 — Verify
    run pack's verification commands
    run npm run audit:gate
    run npm run test:e2e:personas (if pack 08+ work has happened)
    if any audit fails:
      identify the failing audit
      return to Phase 2 with the failure report
    else:
      mark pack.status = DONE
      update this charter (the table in §1)
      open PR, request Giulio's merge approval
      on merge: continue LOOP

  # Final gate (after all packs DONE)
  run the master verification gate (§5 of this file)
  if green:
    tag v1.0.0
    publish docs/launch/ANNOUNCEMENT.md
    deploy to praxis.tacitus.me
    write this charter's "Completion sign-off" section
  else:
    identify the failing gate
    return to LOOP for the relevant pack
```

**Hard constraints on the loop**:

- Codex never skips a pack because "it looks done." Every pack gets the Phase-1 audit even if its checkbox in §1 is already 🟢. Phase 1 is cheap; false positives are expensive.
- Codex never edits this charter's §1 status table without first running Phase 4 verification for the pack in question.
- Codex never marks a pack 🟢 if any persona suite is red, any S0 from the Reality Check Report is unfixed, or any production-readiness checklist item is unchecked.
- Codex updates the "Last loop iteration" timestamp at the bottom of this file at the end of every loop.
- Codex stops the loop and writes a Blocker entry (§6) when it encounters: (a) a question only Giulio can answer; (b) a destructive change risking owner data; (c) a third-party-service outage; (d) a budget overrun beyond `docs/architecture/COST_NOTES.md` projections.

---

## 3. Per-pack quick-audit recipes

When Codex enters Phase 1 for a pack, it runs a quick-audit recipe to classify DoD bullets. The recipes below are the canonical first checks; the pack file holds the full DoD list.

### Pack 03 — Workbench Architecture

```bash
# Files exist?
test -f src/types/case-module.ts
test -d src/lib/cases/syria-2026
test -d src/lib/cases/nordalia
test -f src/components/workbench/WorkbenchChapterShell.tsx
test -f src/app/app/workbench/page.tsx
test -f "src/app/app/workbench/[caseId]/page.tsx"

# Sidebar trimmed?
wc -l src/components/app/app-sidebar.tsx   # < 350?

# Legacy routes redirected?
grep -E "dashboard|desk|syria-case|cockpit" next.config.ts | grep redirect

# Audits
npm run audit:routes
npm run typecheck
```

### Pack 04 — Landing & Entry Rebuild

```bash
test -f "src/app/(landing)/page.tsx"
grep -l "ExampleCasesGallery" src/components/landing/
grep -l "listExampleCases" src/lib/landing/
# Hero CTA hierarchy: count primary vs secondary CTAs
grep -c "data-cta=primary" "src/app/(landing)/page.tsx"  # exactly 1
grep -c "data-cta=secondary" "src/app/(landing)/page.tsx"  # exactly 1

# Post-login
grep -l "resolvePostLoginRedirect" src/lib/auth/

# Legacy components actually deleted (not just unimported)
for f in HeroLegacy SyriaCaseProof DiplomatBanner; do
  test ! -f src/components/landing/${f}.tsx || echo "FAIL: $f still present"
done
```

### Pack 05 — Context vs Tools Separation

```bash
test -f src/types/truth-layer.ts
test -f backend/types/truth_layer.py
grep -rl "withContextHealthGate" src/ backend/  # legacy; should be aliased to withContextAware after pack 12
grep -rl "ContextHealthScore" src/lib/context/

test -f scripts/verify-firestore-neo4j-sync.ts
# After pack 10: scripts/reconcile-firestore-postgres.ts

# Persona flows
ls e2e/personas/ | wc -l   # >= 4
```

### Pack 06 — Ontology System

```bash
ls src/lib/ontology/  # types.ts, registry.ts, conflict/, mediation/, governance/, narrative/
ls backend/ontology/

for o in conflict mediation governance narrative; do
  for f in subtypes relations validators extraction-prompts index; do
    test -f src/lib/ontology/${o}/${f}.ts || echo "FAIL: ${o}/${f}.ts"
  done
done

npm run audit:ontology-mapping
npm run audit:ontology-versions
npm run audit:ontology-classifier-accuracy

# Ingestion pipeline
test -f backend/ingestion/pipeline.py
pytest backend/tests/test_ingestion_pipeline.py -q
pytest backend/tests/test_ingestion_atomic.py -q
```

### Pack 07 — Graph Visualization

```bash
test -f src/components/graph/PraxisGraphCanvas.tsx
test ! -f src/components/graph/graph-viewer.tsx || echo "WARN: legacy viewer still present"

# ESLint restriction
grep -l "cytoscape" .eslintrc*

# Five layouts
for l in force hierarchical ego-network timeline layered-by-truth-layer; do
  test -f src/lib/graph/layouts/${l}.ts || echo "FAIL: layout ${l}"
done

# Edit operations round-trip
npx playwright test e2e/workbench/graph-ops-roundtrip.spec.ts
npx playwright test e2e/workbench/graph-saved-views.spec.ts

# Performance
npm run audit:graph-perf-budget
```

### Pack 08 — Tools Marketplace

```bash
ls src/lib/tools/registry/ | wc -l   # exactly 16 .ts files
test -f src/lib/constants/tool-registry.legacy.ts

# Tool marketplace UI
test -f "src/app/app/workbench/[caseId]/tools/page.tsx"

# Persona suites — must be green for 10 consecutive CI runs
npm run test:e2e:personas

# Audits
npm run audit:tool-coverage
npm run audit:tool-perf-budgets
npm run audit:bundle-budgets
npm run lh:ci   # Landing>=92, Workbench>=85
```

### Pack 09 — Verification & Admin

```bash
test -f docs/audits/2026-05-06-REALITY_CHECK.md
# Severity rubric: parse the report, count S0/S1 unfixed
grep -E "^\| S0" docs/audits/2026-05-06-REALITY_CHECK.md | grep -i "unfixed" | wc -l   # must be 0
grep -E "^\| S1" docs/audits/2026-05-06-REALITY_CHECK.md | grep -i "unfixed" | wc -l   # must be 0

# Admin consolidation
test -f src/app/app/admin/page.tsx
for r in users domains operator-console advisors advisor-feed; do
  test ! -d src/app/app/admin/${r} || grep -l "redirect" next.config.ts | xargs grep "${r}"
done

# Onboarding
npx playwright test e2e/onboarding/first-run.spec.ts

# Diagnostics
test -f src/components/admin/diagnostics/   # all 7 panels
npm run audit:reality-check
```

### Pack 10 — Postgres Knowledge Graph

```bash
# Schema
alembic upgrade head
alembic downgrade base
alembic upgrade head

# Repos
pytest backend/tests/test_postgres_repos.py -q
pytest backend/tests/test_postgres_schema.py -q

# Atomic ingestion
pytest backend/tests/test_ingestion_postgres_atomicity.py -q

# Migration verified
npx tsx scripts/migrate-neo4j-to-postgres.ts --verify-only

# Traversal performance
pytest backend/tests/test_graph_traversal_perf.py -q --benchmark-only

# Semantic search precision
pytest backend/tests/test_semantic_search.py -q

# Audits
npm run audit:postgres-schema-current
npm run audit:kg-drift
npm run audit:graph-query-perf
```

### Pack 11 — Memo Studio & Launch

```bash
# Editor + 6 templates
ls src/lib/memo/templates/ | grep -cE "mandate-brief|mediation-summary|policy-memo|sit-rep|frame-analysis|talking-points"   # 6

# E2E
npx playwright test e2e/workbench/memo-editor.spec.ts
npx playwright test e2e/workbench/memo-templates.spec.ts
npx playwright test e2e/workbench/memo-export.spec.ts
npx playwright test e2e/onboarding/first-run.spec.ts

# Comprehensive Audit
test -f docs/audits/2026-05-06-COMPREHENSIVE.md
test -f docs/roadmap/v1.1-and-beyond.md
test -f docs/launch/PRODUCTION_READINESS.signed.md

# Tag
git tag --list v1.0.0   # must exist before pack 12 begins
```

### Pack 12 — Context Architecture

```bash
# Types parity
pytest backend/tests/test_context_parity.py -q

# No 412 from legacy paths
npx playwright test e2e/api/context-aware-no-412.spec.ts

# Preparer eval
python -m backend.agents.context_preparer.eval.run_eval

# Settings UI
npx playwright test e2e/settings/user-preferences.spec.ts
npx playwright test e2e/settings/workspace-guidelines.spec.ts

# Workspace retrieval
pytest backend/tests/test_workspace_retrieval.py -q

# Audits
npm run audit:context-aware-coverage
npm run audit:context-types-parity
npm run audit:preparer-eval-fresh
```

### Pack 13 — Tool-Context Interop

```bash
# Contract v2
npm run audit:tool-contract-v2
npm run audit:tool-skills-present
npm run audit:tool-skill-conforms
npm run audit:tool-context-isolation
npm run audit:tool-composition-static

# Subagent evals
python -m backend.agents.source_augmenter.eval.run_eval
python -m backend.agents.output_refiner.eval.run_eval
python -m backend.agents.memo_drafter.eval.run_eval

# Suggestion eval
npm run audit:tool-suggestion-eval

# Spike: add a 17th tool from template
bash scripts/spike-add-tool.sh test-spike-tool   # < 60min

# Production deploy verified
test -f docs/launch/staging-smoke-pack-13.signed.md
test -f docs/launch/production-smoke-pack-13.signed.md
```

---

## 4. The continuation contract

When Codex finds incomplete work in a pack, it follows the four-phase pattern. Below is the contract that defines what counts as "complete" for the purposes of marking a pack 🟢.

A pack is 🟢 only when **all** of the following are true:

1. Every Definition of Done bullet in every prompt is satisfied. No "mostly done." No "good enough."
2. Every verification command in the pack's "Final verification gate" exits 0.
3. The pack's branch is merged to `main` cleanly with no merge-conflict residue.
4. `npm run audit:gate` exits 0 from a fresh checkout of `main` after the merge.
5. The four persona E2E suites (Diplomat-Syria, Mediator-Northwind, Analyst-Sahel, Researcher-Nordalia from Pack 08) are green for 10 consecutive CI runs after the merge.
6. The pack's deliverables have been documented (commits, CHANGELOG entry, ADR if applicable).
7. Giulio has replied "merge approved" or equivalent on the PR.

If any of these is false, the pack is 🟡 IN PROGRESS, and Codex's loop continues to work on it — never moves to the next pack.

For packs 12 and 13 specifically, two additional gates apply:
- 24-hour staging smoke at `staging.praxis.tacitus.me` recorded in `docs/launch/staging-smoke-pack-XX.signed.md`.
- Production smoke at `praxis.tacitus.me` recorded in `docs/launch/production-smoke-pack-XX.signed.md`.

---

## 5. Master verification gate (run after all packs are 🟢)

```bash
# Foundations
npm run typecheck
npm run lint
npm run test
pytest backend/ -q
mypy backend/ --strict

# The unified gate
npm run audit:gate

# Per-pack audits (full chain)
npm run audit:routes
npm run audit:ontology-mapping
npm run audit:ontology-versions
npm run audit:ontology-classifier-accuracy
npm run audit:graph-viewer-uniqueness
npm run audit:graph-perf-budget
npm run audit:tool-coverage
npm run audit:tool-perf-budgets
npm run audit:bundle-budgets
npm run audit:reality-check
npm run audit:postgres-schema-current
npm run audit:kg-drift
npm run audit:graph-query-perf
npm run audit:context-aware-coverage
npm run audit:context-types-parity
npm run audit:preparer-eval-fresh
npm run audit:tool-contract-v2
npm run audit:tool-skills-present
npm run audit:tool-skill-conforms
npm run audit:tool-context-isolation
npm run audit:tool-composition-static
npm run audit:subagent-eval-fresh
npm run audit:tool-suggestion-eval
npm run audit:docs
npm run audit:security
npm run audit:dead-code
npm run audit:type-safety
npm run audit:test-coverage
npm run audit:observability

# Persona suites — production bar
npm run test:e2e:personas

# Performance budgets
npm run lh:ci
npm run analyze   # bundle stats

# Drift verifiers
npx tsx scripts/reconcile-firestore-postgres.ts --dry-run

# Subagent evals
python -m backend.agents.context_preparer.eval.run_eval
python -m backend.agents.source_augmenter.eval.run_eval
python -m backend.agents.output_refiner.eval.run_eval
python -m backend.agents.memo_drafter.eval.run_eval

# Migration verified
npx tsx scripts/migrate-neo4j-to-postgres.ts --verify-only

# Staging deploy 24h smoke
test -f docs/launch/staging-smoke-pack-13.signed.md

# Production deploy
test -f docs/launch/production-smoke-pack-13.signed.md

# Documentation completeness
test -f docs/audits/2026-05-06-COMPREHENSIVE.md
test -f docs/roadmap/v1.1-and-beyond.md
test -f docs/launch/PRODUCTION_READINESS.signed.md
test -f docs/launch/ANNOUNCEMENT.md

# ADRs (full set 0001-0018)
for n in 0001 0002 0003 0004 0005 0006 0007 0008 0009 0010 0011 0012 0013 0014 0015 0016 0017 0018; do
  ls docs/adr/${n}-*.md || echo "FAIL: ADR ${n} missing"
done

# Tag
git tag --list v1.0.0
```

All commands exit 0. PRAXIS v1.0.0 is launchable.

---

## 6. Blockers (live; Codex appends here)

When Codex encounters a question only Giulio can answer, it stops the loop and writes an entry here. Format:

```
## YYYY-MM-DD HH:MM — Pack NN — <one-line summary>

**Pack**: <pack number>
**Prompt**: <prompt id, e.g. E5>
**Severity**: S0 / S1 / S2 / S3
**Question**: <the specific decision needed>
**Context**: <2-3 sentences>
**Recommended path**: <Codex's recommendation if any>
**Blocked since**: <timestamp>
**Resolved**: <pending | YYYY-MM-DD; resolution: ...>
```

### 2026-05-06 18:16 - Self-audit launch blockers

**Pack**: 03-14 cross-cutting
**Prompt**: architecture self-audit follow-up
**Severity**: S0 / S1
**Question**: close the active self-audit launch blockers before any `v1.0.0` readiness claim.
**Context**: `docs/audits/2026-05-06-SELF_AUDIT.md` supersedes the older reality-check severity ledger and records open S0/S1 findings. The actionable queue is stored in `docs/backlog/2026-05-06-from-self-audit.md`.
**Recommended path**: start with the public demo contract, canonical entry/legal routes, and persona CI green-streak evidence; then move to context/storage, firewall, marketplace, and platform posture.
**Blocked since**: 2026-05-06 18:16 -04:00
**Resolved**: pending

---

## 7. Live status table (Codex updates after every loop iteration)

| # | Pack | Status | Last touched | Blockers | Notes |
|---|---|---|---|---|---|
| 03 | Workbench Architecture | 🟡 | 2026-05-06 | Persona CI streak missing | Workbench foundation audits pass; charter 10-green CI persona bar is not met. |
| 04 | Landing & Entry Rebuild | 🟡 | 2026-05-06 | Public demo and canonical entry routes | Landing visuals improved; `/demo/syria-2024`, `/waitlist`, `/login/callback`, and `/legal/*` remain launch blockers. |
| 05 | Context vs Tools Separation | 🟡 | 2026-05-06 | Firewall coverage and Trust Score persistence | Advisory posture works; hard-tier write-path and streaming claim persistence need proof. |
| 06 | Ontology System | 🟡 | 2026-05-06 | Backend classifier and ingestion atomicity | Four ontology mappings pass; classifier/2-phase ingestion depth remains. |
| 07 | Graph Visualization | 🟡 | 2026-05-06 | Edit round-trip persistence | Graph viewer audit passes; merge/revert/audit-trail proof remains. |
| 08 | Tools Marketplace | 🟡 | 2026-05-06 | Specialist handlers and memo tools | 16-tool registry audits pass; specialist canaries, composition proof, and memo tools remain. |
| 09 | Verification & Admin | 🟡 | 2026-05-06 | Production metrics evidence | Admin foundation passes; scheduler, parity, and structured logging proof remain. |
| 10 | Postgres Knowledge Graph | 🟡 | 2026-05-06 | Production cutover and embedding dimension | KG backend audits pass; production parity, reconciliation, and dimension drift remain. |
| 11 | Memo Studio & Launch | 🟡 | 2026-05-06 | 60-second wow and export proof | Memo Studio audit passes; first-run export and launch sign-off remain. |
| 12 | Context Architecture | 🟡 | 2026-05-06 | Production round-trip proof | Context-aware audits pass; synthetic live layer round trips remain. |
| 13 | Tool-Context Interop | 🟡 | 2026-05-06 | Subagent runtime evidence | Contract v2 audits pass; Agent Engine binding/telemetry remain. |
| 14 | Production Excellence | 🟡 | 2026-05-06 | Canary, Cloud SQL, scheduler, staging proof | Provider and platform foundation pass; production-excellence gate remains. |

**Last loop iteration**: 2026-05-06 18:16 -04:00
**Loop iterations completed**: 1
**Total commits across all packs**: 0
**Open PRs**: 0
**Persona suite green-streak**: 0 / 10

---

## 8. Hard rules that bind every pack

These rules are inviolable across all 11 packs. Any change to them requires an explicit ADR + Giulio sign-off.

1. **The eight ACO primitives are the substrate.** Actor, Claim, Interest, Constraint, Leverage, Commitment, Event, Narrative. Every node carries one and only one. Enforced at the database layer (Postgres CHECK constraint, pack 10).
2. **Model strings only in `src/lib/ai/providers.ts` and `backend/ai/providers.py`.** No model names hard-coded in tool handlers, subagent prompts, or routes.
3. **`withCalibration` wraps every AI route.** Tracks tokens, cost, latency, model. No exceptions.
4. **`withContextAware` (post-pack-12) replaces the old `withContextHealthGate`.** No 412 on low context health. Tools are advisory + AI-assisted, not blocking.
5. **The symbolic firewall is preserved.** Deterministic symbolic conclusions are never overridden by probabilistic neural predictions. Subagents never write structured assertions to the graph; their outputs are labeled `synthesized: true`.
6. **Every Firestore read carries `owner_uid` and (when applicable) `case_id`.** Every Postgres query carries the same predicates. There is no `findAll()`-shaped API.
7. **Two-phase commit (Firestore + Postgres post-pack-10) is atomic.** Crash injection tests cover all paths.
8. **Bi-temporal validity (`valid_from`, `valid_to`, `asserted_from`, `asserted_to`) is mandatory on every node and edge.**
9. **Every tool reads context exclusively through `ContextProvider` (post-pack-13).** Direct store access from a tool handler is a static contract violation.
10. **Every tool has a SKILL.md** at `skills/tools/<tool_id>/SKILL.md` (post-pack-13).
11. **Every subagent invocation is logged, costed, and surfaced in the diagnostics dashboard.**
12. **Persona suites are the production bar.** Diplomat-Syria, Mediator-Northwind, Analyst-Sahel, Researcher-Nordalia. 10 consecutive green CI runs before any merge to main.
13. **`firestore.rules` may not be weakened.** Tightening is welcome. Loosening requires owner-data-implications review.
14. **No new dependencies without a PR-description justification** (license, last-publish, weekly download count, why).
15. **No deletion of routes, files, or dependencies in haste.** Phase 1 (Read & report) → Phase 2 (Propose & confirm) → Phase 3 (Execute) → Phase 4 (Verify), in that order, every time.
16. **Deployment target is praxis.tacitus.me.** Staging smokes at `staging.praxis.tacitus.me` are required for packs 12 and 13.

---

## 9. Cross-cutting invariants Codex enforces during the loop

When Codex audits a pack in Phase 1, it also verifies these cross-cutting invariants. A regression in any of them sends the pack back to Phase 2 with a high-severity entry.

- **Pydantic ↔ Zod parity**: every type that lives in both `src/types/*.ts` and `backend/types/*.py` has a parity test. Codex runs `pytest backend/tests/test_*_parity.py -q`.
- **Bi-temporal field population**: ingested nodes have `valid_from` populated (default to document publication date if extraction can't infer); `asserted_from` defaults to `now()`. Codex spot-checks the most recent 50 ingested nodes per case fixture.
- **Owner scoping**: any `findAll`, `list_all`, or unscoped query is a contract violation. Codex greps for likely offenders.
- **Symbolic firewall enforcement**: any new write path against the graph routes through the firewall. Codex confirms via `grep -L "applySymbolicFirewall" backend/routers/`.
- **Atomic 2-phase commit**: any new write path uses the `in_transaction` helper. Codex greps for direct `await session.commit()` outside the transaction helper.
- **Subagent boundaries**: subagents never import graph write APIs. Codex confirms via static import-graph analysis.
- **Workspace-secret hygiene**: `gitleaks` scan must be clean.
- **Model-string lockdown**: `grep -rE 'claude-|gpt-|gemini-|text-embedding-' src/ backend/ | grep -v providers.ts | grep -v providers.py` must return only test fixtures.

---

## 10. Onboarding for Codex (read once at the start of every loop)

When Codex picks up this charter, it should also:

1. Read the ten top-level docs: `README.md`, `ARCHITECTURE.md`, `CLAUDE.md`, `AGENTS.md`, `DESIGN.md`, `DEPLOYMENT.md`, `SECURITY.md`, `TESTING.md`, `TODO.md`, `CHANGELOG.md`.
2. Read the conventions skill: `/mnt/skills/user/praxis-conventions/SKILL.md`.
3. Read the most recent comprehensive audit: `docs/audits/2026-05-06-COMPREHENSIVE.md` (created in Pack 11 K9; if not yet present, the loop hasn't reached that point).
4. Read the active blockers section (§6 of this file).
5. Read the most recent staging deploy log to confirm production posture.

If any of these are missing, that itself is a Phase-1 finding to surface in the next status report.

---

## 11. Loop iteration log (Codex appends here)

Codex writes an entry here after every full loop pass. Format:

```
## Loop iteration N — YYYY-MM-DD HH:MM
- Started at: ...
- Ended at: ...
- Packs touched: 03, 04, 05
- Packs marked DONE this pass: 03
- Packs in progress: 04
- Packs blocked: 05 (see §6 entry 2026-05-06 14:32)
- Commits made: 47
- Audits run: full chain, 23/26 green
- Persona suite runs: 12 (10 green, 2 red — flake in graph-load-large; root-caused, fix in 04 PR)
- Staging deploys: 0
- Production deploys: 0
- Notes: ...
```

## Loop iteration 1 — 2026-05-06 18:16
- Started at: 2026-05-06 18:00 -04:00
- Ended at: 2026-05-06 18:16 -04:00
- Packs touched: 03-14 cross-cutting master pass
- Packs marked DONE this pass: none; all remain yellow until the self-audit S0/S1 queue is closed
- Packs in progress: 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14
- Packs blocked: cross-cutting S0/S1 items in `docs/backlog/2026-05-06-from-self-audit.md`
- Commits made: 0
- Audits run: `audit:master-charter`, `audit:architecture-chain`, `audit:architecture-reference`, `audit:workbench`, `audit:landing`, `audit:routes`, `audit:ai-provider-isolation`, `audit:context-vs-tools`, `audit:context-aware-coverage`, `audit:tool-marketplace`, `audit:tool-contract-v2`, `audit:ontology`, `audit:graph-viewer`, `audit:memo-studio`, `audit:reality-check`, `audit:codex-prompts`, `audit:operational-metrics`
- Persona suite runs: 0 in this pass; green-streak remains 0 / 10
- Staging deploys: 0
- Production deploys: 0
- Notes: Preserved the master charter as the live control file, connected the architecture self-audit to the active backlog, and corrected the stale "no open S0/S1" status posture.

---

## 12. Completion sign-off

Codex writes this section only when the master verification gate (§5) is fully green and Giulio has confirmed launch. Format:

```
## v1.0.0 — Launched YYYY-MM-DD HH:MM

- Production URL: https://praxis.tacitus.me
- Tag: v1.0.0
- CHANGELOG entry: # [1.0.0] — YYYY-MM-DD
- Comprehensive Audit: docs/audits/2026-05-06-COMPREHENSIVE.md (signed)
- Production Readiness: docs/launch/PRODUCTION_READINESS.signed.md (signed by Giulio Catanzariti)
- Roadmap: docs/roadmap/v1.1-and-beyond.md (signed)
- Total engineering hours: ~543
- Total commits: ...
- Pack-by-pack delivery story: see CHANGELOG.md
- Persona suite final-state: 4 suites × 10 consecutive green CI runs
- Subagent evals final-state: all four ≥ floor

PRAXIS v1.0.0 is launched.
```

(Pending.)

---

## 13. Codex prompt — the one to paste into a Codex session

When Giulio wants to trigger an autonomous loop iteration, this is the prompt:

> You are Codex acting as supervising senior engineer for the PRAXIS project. Read the master charter at `C:\Users\giuli\Downloads\PRAXIS_CODEX_00_MASTER_CHARTER.md`. Run the autonomous loop defined in §2 of that file. Strictly follow the four-phase collaboration pattern (Read & report → Propose & confirm → Execute → Verify) on every prompt. Update §7 (live status table) and §11 (loop iteration log) at the end of the iteration. Stop and write a §6 (Blockers) entry if you encounter a question only I can answer. The deployment target is praxis.tacitus.me. The hard rules in §8 are inviolable. Begin.

---

## 14. Closing note

This charter exists so that the work of building PRAXIS is no longer dependent on a human reading 11 separate pack documents in sequence and orchestrating them by hand. Codex reads this single file, runs the loop, asks Giulio when it must, and continues until the production deploy at praxis.tacitus.me is signed and v1.0.0 is tagged.

The loop is **patient**. It will run for many iterations. Each iteration reduces the gap between specification and reality. No iteration introduces new product features outside what the eleven packs already specify; new features go to `docs/roadmap/v1.1-and-beyond.md`.

The loop is **honest**. A pack is not 🟢 because Codex is tired or the audit is "mostly green." A pack is 🟢 because every clause of §4 is true.

The loop is **safe**. The four-phase pattern, the hard rules, the cross-cutting invariants, and the explicit Giulio-sign-off gates exist so that an autonomous coding agent can do load-bearing work on a real product without surprising its owner.

When this file's §12 is written, PRAXIS is launched.

---

**File path**: `C:\Users\giuli\Downloads\PRAXIS_CODEX_00_MASTER_CHARTER.md`
**Companion files (the eleven packs, listed in dependency order)**:

1. `C:\Users\giuli\Downloads\PRAXIS_CODEX_03_WORKBENCH_ARCHITECTURE.md`
2. `C:\Users\giuli\Downloads\PRAXIS_CODEX_04_LANDING_AND_ENTRY_REBUILD.md`
3. `C:\Users\giuli\Downloads\PRAXIS_CODEX_05_CONTEXT_VS_TOOLS_SEPARATION.md`
4. `C:\Users\giuli\Downloads\PRAXIS_CODEX_06_ONTOLOGY_SYSTEM.md`
5. `C:\Users\giuli\Downloads\PRAXIS_CODEX_07_GRAPH_VISUALIZATION.md`
6. `C:\Users\giuli\Downloads\PRAXIS_CODEX_08_TOOLS_MARKETPLACE.md`
7. `C:\Users\giuli\Downloads\PRAXIS_CODEX_09_VERIFICATION_AND_ADMIN.md`
8. `C:\Users\giuli\Downloads\PRAXIS_CODEX_10_POSTGRES_KNOWLEDGE_GRAPH.md`
9. `C:\Users\giuli\Downloads\PRAXIS_CODEX_11_MEMO_STUDIO_AND_LAUNCH.md`
10. `C:\Users\giuli\Downloads\PRAXIS_CODEX_12_CONTEXT_ARCHITECTURE.md`
11. `C:\Users\giuli\Downloads\PRAXIS_CODEX_13_TOOL_CONTEXT_INTEROP.md`

**Superseded (do not consume)**:
- `C:\Users\giuli\Downloads\PRAXIS_CODEX_09_FINAL_CONSOLIDATION_AND_LAUNCH.md`
