# PRAXIS — Codex Pack 15: SAT Toolkit (Analyst's Toolkit)

**File**: `PRAXIS_CODEX_15_SAT_TOOLKIT.md`
**Branch**: `feature/sat-toolkit`
**Depends on**: Packs 03-14 merged. v1.0.0 tagged.
**Estimated effort**: ~5 days (~38 engineering hours).
**Target release**: v1.1
**Voice**: Domain-aware product engineer. The persona for this pack is the trained analyst (CIA / FCDO / UN DPPA / NATO / academic) who learned the Heuer-Pherson techniques in their first year of service. PRAXIS speaks their vocabulary.

---

## 0. Why this pack exists

Structured Analytic Techniques (SATs) are the canonical analyst toolkit. Heuer's *Psychology of Intelligence Analysis* (1999) and Heuer & Pherson's *Structured Analytic Techniques for Intelligence Analysis* (2010, updated through 2020) are reference texts in every major intelligence service training curriculum. The CIA's Red Cell, formed after 9/11, used SATs to challenge analytical orthodoxy. UK Civil Service intelligence training, FCDO desk-officer onboarding, UN DPPA analytical-rigor courses, and most academic security-studies programs teach the same canon. When a senior analyst opens a workbench and sees "Analysis of Competing Hypotheses" as a first-class action, that signal is worth more than any feature description.

PRAXIS at v1.0 has tools, memos, graph operations, and subagents — but it lacks the canonical vocabulary. The closest existing tool, `cross.contradiction-finder`, partially implements ACH-style logic without naming it as such. This pack ships the four highest-leverage SATs as **first-class workbench surfaces** (not just tools): **Analysis of Competing Hypotheses (ACH)**, **Key Assumptions Check (KAC)**, **Red Team Analysis**, and **Premortem**. They sit together in a new "Analyst's Toolkit" sub-marketplace, branded explicitly as Heuer-Pherson SATs, with citations to the source literature.

The architectural shift is small. ACH gets a dedicated workbench tab because its central artifact (the hypothesis × evidence matrix) is a structured surface that doesn't fit a one-shot tool-run; the user iterates on it over hours or days as new evidence arrives. The other three are tool-shaped and live in the marketplace. A new subagent — `red_team_analyst` — joins the four existing ones on Vertex AI Agent Engine. The Memo Drafter learns to incorporate SAT outputs into memo annexes in a standard format.

After this pack: when a UK Mission policy adviser opens PRAXIS to prepare a council statement, they see ACH and Key Assumptions Check as natural starting points; when an FCDO crisis-team analyst gets a contested intelligence read, they fire Red Team Analysis on the dominant hypothesis; when a UN mediator drafts a peace-process recommendation, they run Premortem against it before sharing. PRAXIS becomes the workbench analysts already trained for.

---

## 1. Outcomes

| # | Outcome | Verification |
|---|---|---|
| 1 | New workbench tab `/app/workbench/[caseId]/ach/[achId]` for Analysis of Competing Hypotheses with full hypothesis × evidence matrix, persistent across sessions | E2E test green; matrix round-trips through save/reload; export to DOCX produces a clean ACH report |
| 2 | New tool `cross.kac` (Key Assumptions Check) ships in the marketplace with a SKILL.md and persona-suite coverage | Tool registered; suggestion engine includes it for relevant cases |
| 3 | New tool `cross.red-team` invokes a new `red_team_analyst` subagent deployed to Vertex AI Agent Engine, returns adversary-perspective analysis on a target Actor | Subagent eval set ≥ 12 cases passes; Cloud Trace propagation verified |
| 4 | New tool `cross.premortem` produces structured failure-pathway analysis on a memo's recommendation section | Tool runs against existing memo fixtures; output schema-conformant |
| 5 | "Analyst's Toolkit" sub-marketplace section in the tools tab visually grouping the four SATs with Heuer-Pherson attribution | Visual snapshot test; manual review by Giulio |
| 6 | All four SAT outputs can be appended as memo annexes via Memo Drafter integration | Each SAT → "Append to memo as annex" produces a properly-formatted block in the active memo |
| 7 | ACH surface integrates with the existing review queue: when ACH ranks a hypothesis as well-supported, the user can promote its constituent claims to Verdict layer through the firewall (no firewall bypass) | Round-trip test green |
| 8 | Updated SKILL.md template adds an optional "SAT category" field; SATs are catalogued separately in the suggestion engine's role-affinity table for analyst/researcher/policy_advisor roles | Suggestion eval recall@3 still ≥ 80%; analyst role gets ACH as top suggestion when case has ≥ 2 competing claims |
| 9 | Three new ADRs committed: 0021 (SATs as first-class), 0022 (red_team_analyst subagent), 0023 (ACH workbench surface) | ADRs reviewed and merged |

---

## 2. Pre-work confirmation note

> I am Codex. I have read pack 15. I understand:
> 1. The four SATs: ACH, KAC, Red Team Analysis, Premortem. Each implemented with explicit Heuer-Pherson attribution.
> 2. ACH gets a dedicated workbench tab because the hypothesis × evidence matrix is a multi-session artifact, not a single tool run. KAC, Red Team, and Premortem ship as standard tools in the marketplace.
> 3. The new `red_team_analyst` subagent deploys to Vertex AI Agent Engine following the same pattern as the existing four. Same SKILL.md format. Same eval-set discipline. Output labeled `synthesized: true`. Goes through the symbolic firewall.
> 4. SAT outputs can be appended as memo annexes. The Memo Drafter learns four new annex formats.
> 5. The architecture invariants from the bible (§3) are inviolable: ACO substrate unchanged, four-layer context unchanged, ContextProvider-only access, no model strings outside MODEL_MATRIX.json, persona suites green for 10 consecutive runs before merge.
> 6. The Heuer-Pherson source attribution is essential. Every SAT mentions its source in the SKILL.md and in the workbench UI. Credibility with the trained-analyst persona depends on this.
>
> Open questions for Giulio:
> - **Q1**: ACH evidence sourcing — propose: candidate evidence is auto-pulled from Claim and Event nodes in the case graph (filtered to the hypotheses' topic via pgvector semantic search on hypothesis text), with the user able to add free-text evidence. Acceptable, or do you want the user to manually select from the graph?
> - **Q2**: Red Team subagent system prompt sensitivity — the subagent models adversary thinking, which can produce uncomfortable outputs (e.g., articulating an authoritarian state's perspective on a sanctions regime). Propose: every Red Team output carries a prominent "modeling adversary perspective" disclaimer; eval set includes an adversarial-prompt-injection test; outputs never auto-promote to Verdict layer. Acceptable?
> - **Q3**: Premortem scope — propose: Premortem operates on a memo's recommendation section by default, but can also operate on a generic policy proposal entered as free text. The "imagine catastrophic failure" framing is the canonical Klein 2007 formulation. Acceptable?
> - **Q4**: Marketplace organization — propose: a new "Analyst's Toolkit" tab section above the existing per-ontology grids, with a small Heuer-Pherson citation link to the source literature. Acceptable, or do you prefer integrated alphabetical?

Wait for answers before proceeding.

---

## 3. Pack overview

| Prompt | Outcome | Est. hrs |
|---|---|---|
| O1 | Foundations: types, schemas, ACH persistence model, SKILL.md template extension | 5 |
| O2 | ACH workbench surface (hypothesis × evidence matrix, ranking algorithm, persistence) | 8 |
| O3 | `cross.kac` tool + Key Assumptions Check workflow | 5 |
| O4 | `red_team_analyst` subagent: LangGraph subgraph, system prompt, output schema, eval set | 6 |
| O5 | `cross.red-team` tool wrapping the subagent | 4 |
| O6 | `cross.premortem` tool with structured failure-pathway output | 4 |
| O7 | Memo annex integration: four annex formats in Memo Drafter; "append as annex" UI on each SAT output | 4 |
| O8 | Marketplace "Analyst's Toolkit" section + suggestion engine updates + ADRs + final verification | 2 |
| **Total** | | **~38** |

---

## 4. Hard rules

- Heuer-Pherson attribution appears in every SAT's SKILL.md and on the workbench surface (ACH page, tool "About" panels). Credibility is non-negotiable.
- Every SAT output that produces structured assertions (ACH ranked hypotheses, KAC flagged assumptions, Red Team adversary claims, Premortem failure pathways) is labeled `synthesized: true`, capped at confidence ≤ 0.6 unless the user explicitly promotes through the review queue.
- The `red_team_analyst` subagent never writes to the graph directly. Its outputs are advisory, routed through the symbolic firewall and the review queue if the user accepts.
- ACH's hypothesis ranking algorithm is the canonical Heuer formulation: hypotheses ranked by **inconsistency count** (least disconfirming evidence wins), not by support count. Documented prominently in the UI.
- All four SATs respect the user's `confidenceTolerance` preference: low-tolerance users see stricter cutoffs on what counts as "well-supported."
- Persona suites updated: at minimum the Analyst-Sahel and Diplomat-Syria suites must include an SAT step (ACH for Diplomat preparing an argument, Red Team for Analyst verifying a hypothesis).
- All prior pack invariants hold. ACO substrate, four-layer context, ContextProvider-only, owner scoping, two-phase commit, model strings only in providers.

---

## 5. Prompt O1 — Foundations: types, schemas, ACH persistence

### Persona
Architect. Designs the data model once, correctly, before the UI is built.

### Phase 1 — Read & report

- Read existing tool contract types at `src/lib/tools/types.ts` and Pydantic mirrors.
- Read Memo schema at `src/types/memo.ts`.
- Read existing subagent output schema patterns at `backend/agents/<id>/output_schema.py`.
- Output `docs/audits/2026-NN-NN-SAT_FOUNDATIONS.md` listing types to add.

### Phase 2 — Propose & confirm

Propose:

```ts
// src/types/sats.ts (Zod-validated; Pydantic mirror at backend/types/sats.py)

export type SATCategory = 'ach' | 'kac' | 'red_team' | 'premortem';

export interface ACHMatrix {
  id: string;
  caseId: string;
  ownerUid: string;
  title: string;
  status: 'draft' | 'in_progress' | 'concluded' | 'archived';
  hypotheses: ACHHypothesis[];
  evidence: ACHEvidence[];
  scores: ACHScore[];                  // [hypothesisId, evidenceId, score]
  ranking?: ACHRanking[];              // computed from scores
  createdAt: string;
  updatedAt: string;
}

export interface ACHHypothesis {
  id: string;
  text: string;                         // the candidate explanation
  proposedBy: 'user' | 'subagent';
  notes?: string;
}

export interface ACHEvidence {
  id: string;
  text: string;
  sourceKind: 'graph_node' | 'free_text' | 'document';
  sourceRef?: string;                   // node id / doc id if applicable
  weight: number;                       // 0..1, user-rated relevance
  diagnosticity?: number;               // 0..1, how much it discriminates between hypotheses
}

export interface ACHScore {
  hypothesisId: string;
  evidenceId: string;
  rating: 'consistent' | 'inconsistent' | 'irrelevant' | 'unknown';
  note?: string;
}

export interface ACHRanking {
  hypothesisId: string;
  inconsistencyCount: number;           // canonical Heuer ranking metric
  weightedInconsistency: number;        // weighted by evidence diagnosticity
  rank: number;
  conclusion: 'most_likely' | 'plausible' | 'unlikely' | 'rejected';
}

export interface KACReport {
  id: string;
  caseId: string;
  ownerUid: string;
  scopeRef: { kind: 'memo' | 'analysis_text'; ref: string };
  assumptions: KACAssumption[];
  generatedAt: string;
  subagentRunId: string;
}

export interface KACAssumption {
  id: string;
  text: string;
  status: 'stated' | 'unstated';        // explicit in the source vs implicit
  supportLevel: 'well_supported' | 'questionable' | 'unsupported' | 'unrated';
  evidence?: string[];                   // node ids supporting it
  userVerdict?: 'accept' | 'flag' | 'reject';
}

export interface RedTeamReport {
  id: string;
  caseId: string;
  ownerUid: string;
  targetActorId: string;                // the Actor whose perspective is modeled
  framingNote: string;                   // explicit "modeling adversary perspective"
  analysis: {
    interests: string[];
    constraints: string[];
    likelyMoves: { move: string; rationale: string; probability: 'high' | 'medium' | 'low' }[];
    viewOfOtherActors: { actorId: string; view: string }[];
  };
  generatedAt: string;
  subagentRunId: string;
}

export interface PremortemReport {
  id: string;
  caseId: string;
  ownerUid: string;
  scopeRef: { kind: 'memo_recommendation' | 'free_text'; ref: string };
  failurePathways: PremortemPathway[];
  generatedAt: string;
  subagentRunId: string;
}

export interface PremortemPathway {
  id: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'catastrophic';
  likelihood: 'low' | 'medium' | 'high';
  triggeringConditions: string[];
  mitigations: string[];
}
```

Persistence:
- ACH matrices: `users/{uid}/situations/{caseId}/ach/{achId}` (Firestore metadata) + `users/{uid}/situations/{caseId}/ach/{achId}/scores/{scoreId}` subcollection for scores (so updates don't rewrite the whole matrix).
- KAC reports: `users/{uid}/situations/{caseId}/kac/{kacId}`.
- Red Team reports: `users/{uid}/situations/{caseId}/red-team/{rtId}`.
- Premortem reports: `users/{uid}/situations/{caseId}/premortem/{pmId}`.

Tool contract extension — add optional `satCategory?: SATCategory` field to v2 contract; suggestion engine uses it for grouping.

Wait for sign-off.

### Phase 3 — Execute

- Author types in `src/types/sats.ts` and Pydantic mirror `backend/types/sats.py`.
- Extend tool contract with `satCategory` field.
- Set up Firestore rules for the new collections (owner-scoped).
- Author parity test.

### Phase 4 — Verify

```bash
npm run typecheck
pytest backend/tests/test_sats_parity.py -q
npm run audit:tool-contract-v2   # still passes; new optional field
```

---

## 6. Prompt O2 — ACH workbench surface

### Persona
Frontend engineer who has shipped matrix-style UIs. Knows that the hypothesis × evidence matrix is the central artifact and that anything else (export, history, sharing) wraps around it.

### Phase 1 — Read & report

Audit the existing workbench shell. Plan the new tab at `/app/workbench/[caseId]/ach/[achId]`. Identify the case-shell hook for adding new tabs.

### Phase 2 — Propose & confirm

Propose the surface:

- **Index page** at `/app/workbench/[caseId]/ach`: list of existing ACH analyses; "New ACH" CTA.
- **Detail page** at `/app/workbench/[caseId]/ach/[achId]`:
  - **Header**: title, status, Heuer-Pherson attribution link, last-updated.
  - **Hypotheses panel**: 3–7 hypotheses, each editable, drag-reorder. "Suggest hypotheses" button invokes a subagent that proposes 3 candidates from the case graph based on competing claims.
  - **Evidence panel**: list of evidence items. "Pull from graph" button auto-suggests evidence (Claims and Events from the case graph filtered by semantic relevance to hypotheses). "Add free text" button.
  - **Matrix**: rows = evidence, columns = hypotheses. Each cell is a score selector (consistent / inconsistent / irrelevant / unknown) with optional note. Cells colored. Optional weighting and diagnosticity sliders per evidence row.
  - **Ranking panel**: live computation of the canonical Heuer ranking. Displays hypotheses sorted by inconsistency count (lowest = most likely). Each hypothesis shows its conclusion class.
  - **Actions**: Save, Export ACH report (DOCX with Heuer-style appendix), Append to memo as annex, Promote concluded hypothesis to graph (routes through review queue).

Wait for sign-off on the panel layout.

### Phase 3 — Execute

- Author `src/app/app/workbench/[caseId]/ach/page.tsx` (index).
- Author `src/app/app/workbench/[caseId]/ach/[achId]/page.tsx` (detail).
- Author components:
  - `src/components/sats/ACHMatrix.tsx` (the matrix).
  - `src/components/sats/HypothesesPanel.tsx`.
  - `src/components/sats/EvidencePanel.tsx`.
  - `src/components/sats/RankingPanel.tsx`.
- Implement ranking algorithm at `src/lib/sats/ach-ranking.ts`:
  ```ts
  export function rankACH(matrix: ACHMatrix): ACHRanking[] {
    return matrix.hypotheses
      .map(h => {
        const scores = matrix.scores.filter(s => s.hypothesisId === h.id);
        const inconsistencyCount = scores.filter(s => s.rating === 'inconsistent').length;
        const weightedInconsistency = scores
          .filter(s => s.rating === 'inconsistent')
          .reduce((sum, s) => {
            const ev = matrix.evidence.find(e => e.id === s.evidenceId);
            return sum + (ev?.weight ?? 0.5) * (ev?.diagnosticity ?? 0.5);
          }, 0);
        return { hypothesisId: h.id, inconsistencyCount, weightedInconsistency };
      })
      .sort((a, b) => a.weightedInconsistency - b.weightedInconsistency)
      .map((r, i) => ({
        ...r,
        rank: i + 1,
        conclusion: i === 0 ? 'most_likely' : i < 2 ? 'plausible' : i < 4 ? 'unlikely' : 'rejected',
      }));
  }
  ```
- Backend API at `backend/routers/ach.py`:
  - `POST /v1/cases/{caseId}/ach` — create.
  - `GET /v1/cases/{caseId}/ach/{achId}` — fetch.
  - `PUT /v1/cases/{caseId}/ach/{achId}` — update (atomic via two-phase commit if it touches graph).
  - `POST /v1/cases/{caseId}/ach/{achId}/suggest-hypotheses` — subagent-driven hypothesis suggestion (uses Context Preparer).
  - `POST /v1/cases/{caseId}/ach/{achId}/suggest-evidence` — pulls from case graph via pgvector semantic search.
  - `POST /v1/cases/{caseId}/ach/{achId}/promote` — promote concluded hypothesis through review queue.
- E2E test at `e2e/workbench/ach-flow.spec.ts`: create ACH → add 3 hypotheses → pull evidence from graph → score 5 cells → ranking computes correctly → save → reload → state preserved.

### Phase 4 — Verify

- Round-trip persistence: create, save, navigate away, return, full state preserved.
- Export to DOCX produces a clean Heuer-style appendix.
- Performance: 5 hypotheses × 20 evidence (100 cells) renders smoothly; auto-save debounced at 2s.
- Ranking algorithm tested with 12 edge-case scenarios.

### Files to create

- `src/types/sats.ts`, `backend/types/sats.py` (from O1).
- `src/lib/sats/ach-ranking.ts` + tests.
- Pages and components above.
- `backend/routers/ach.py`.
- `e2e/workbench/ach-flow.spec.ts`.
- DOCX export template at `backend/services/sat_export/ach.py`.

---

## 7. Prompt O3 — `cross.kac` tool + Key Assumptions Check workflow

### Persona
Tool engineer. Builds within the existing v2 contract pattern.

### Outcome

A tool that takes a memo or analysis text, identifies stated and unstated assumptions, lets the user verdict each, persists as a KAC report, and can be appended as a memo annex.

### Phase 2 — Propose & confirm

Tool contract:

```ts
// src/lib/tools/registry/cross.kac.ts
export const tool: ToolModule = {
  contract: {
    id: 'cross.kac',
    version: '1.0.0',
    title: 'Key Assumptions Check',
    description: 'Surface the assumptions underlying an analysis. Heuer-Pherson SAT.',
    category: 'meta',
    satCategory: 'kac',
    contextSpec: {
      user: { role: true },
      caseGraph: { minNodeCount: 3 },
      graceful: true,
    },
    sideEffects: { proposesGraphChanges: false, writesAuditLogs: true },
    subagentDeps: ['memo_drafter'],   // reused in "extract assumptions" mode
    skill: { file: 'skills/tools/cross.kac/SKILL.md' },
    inputSchema: {
      type: 'object',
      required: ['scope'],
      properties: {
        scope: {
          oneOf: [
            { type: 'object', required: ['kind', 'memoId'], properties: { kind: { const: 'memo' }, memoId: { type: 'string' } } },
            { type: 'object', required: ['kind', 'text'], properties: { kind: { const: 'analysis_text' }, text: { type: 'string', maxLength: 20000 } } },
          ],
        },
      },
    },
    outputSchema: { /* matches KACReport */ },
    estimatedRuntimeMs: 8000,
    costClass: 'medium',
    streaming: false,
  },
  handler: async (input, ctx) => {
    const text = await resolveScopeText(input.scope, ctx);
    const userContext = await ctx.user();

    // Reuse memo_drafter subagent in "extract assumptions" mode
    const result = await ctx.subagent('memo_drafter', {
      mode: 'extract_assumptions',
      text,
      confidence_tolerance: userContext.preferences.confidenceTolerance ?? 'medium',
    });

    const report: KACReport = {
      id: generateId(),
      caseId: input.caseId,
      ownerUid: userContext.uid,
      scopeRef: input.scope,
      assumptions: result.assumptions.map(a => ({
        ...a,
        userVerdict: undefined,
      })),
      generatedAt: new Date().toISOString(),
      subagentRunId: result.runId,
    };

    await ctx.log({ kind: 'kac_generated', kacId: report.id, assumptionCount: report.assumptions.length });
    return report;
  },
};
```

Memo Drafter gets a new `mode: 'extract_assumptions'` capability. Its system prompt for that mode (committed at `backend/agents/memo_drafter/prompts/modes/extract_assumptions.md`) explicitly instructs:
- Extract both stated and unstated assumptions.
- For each, classify as well-supported / questionable / unsupported based on evidence visible in case graph.
- Cite specific Claim/Event nodes when assigning support level.
- Maximum 12 assumptions per call (cost ceiling).

### Phase 3 — Execute

- Author tool at `src/lib/tools/registry/cross.kac.ts`.
- Author SKILL.md at `skills/tools/cross.kac/SKILL.md`. Nine canonical sections. Heuer-Pherson attribution prominent.
- Extend Memo Drafter with `extract_assumptions` mode; update its eval set to include 4 cases.
- Author UI: when tool runs, output renders as a verdict-table where user can mark each assumption as accept / flag / reject. Verdicts persist back to the KAC report.
- "Append to memo as annex" button on the verdicted report.

### Phase 4 — Verify

- Tool registers, suggestion engine includes it.
- Manual smoke: run KAC on a Mediation Brief memo against Northwind; surfaces 8–12 assumptions; Mediator-persona test verdicts each; append to memo produces a clean annex.
- Memo Drafter eval set still passes (regression on existing modes).

---

## 8. Prompt O4 — `red_team_analyst` subagent

### Persona
ML/agent engineer. Follows the established subagent pattern from pack 13 M5.

### Outcome

A new LangGraph subagent at `backend/agents/red_team_analyst/` deployed to Vertex AI Agent Engine. Cost ceiling $0.08/call. P95 latency 6s. Eval set ≥ 12 cases.

### Subagent design

Five-node graph:

1. **`gather`** — pulls the target Actor's full subgraph (1-hop neighborhood), the Actor's stated Interests/Constraints, recent Events involving the Actor, and the case Frame.
2. **`model_perspective`** — uses claude-opus-4.7@vertex (writing-quality task kind) with a strict system prompt to produce structured adversary-perspective analysis: their interests as they see them (not as we see them), their constraints, their likely moves, their view of other actors. **Crucial guardrail in the system prompt**: never advocate for the adversary, never produce content that could be misused as actual adversary planning, always frame as "modeling perspective for analytical purposes."
3. **`structure_output`** — parses the prose into the `RedTeamReport.analysis` structure.
4. **`safety_check`** — gates output against a deny-list (no specific operational planning, no specific targeting, no calls for violence). If the model produced any flagged content, the entire output is rejected and a sanitized stub returned.
5. **`self_rate`** — produces a confidence score 0..1 with self-assessment of how well the perspective was modeled.

System prompt skeleton at `backend/agents/red_team_analyst/prompts/system.md`:

```
You are the PRAXIS Red Team Analyst. Your role is to model how a target actor
might think about a situation, so the user can identify "rational actor" bias
in their own analysis. You are not the adversary; you model the adversary's
perspective for analytical purposes.

Inputs:
- The target Actor (their declared interests, constraints, history).
- The case context.
- The user's existing analysis (optional).

Output (strict JSON, validated against RedTeamReport schema):
- interests: how the target sees their own interests (not our framing).
- constraints: what the target perceives as their constraints.
- likelyMoves: 3-5 moves they may make, each with rationale and probability.
- viewOfOtherActors: how the target views the other Actors in the case.

Hard rules — MUST NOT:
- Produce specific operational planning (where, when, how to attack X).
- Produce content that could function as actual adversary tradecraft.
- Advocate for the adversary's position; you are modeling, not arguing.
- Speculate beyond what is grounded in the case graph and public knowledge.

Confidence calibration: outputs cap at confidence 0.6 (synthesized).
Always include the framing note: "modeling adversary perspective for analysis."
```

### Files to create

- `backend/agents/red_team_analyst/__init__.py`.
- `backend/agents/red_team_analyst/graph.py`.
- `backend/agents/red_team_analyst/state.py`.
- `backend/agents/red_team_analyst/prompts/system.md`.
- `backend/agents/red_team_analyst/prompts/safety_deny_list.md`.
- `backend/agents/red_team_analyst/output_schema.py` (Pydantic, mirrors `RedTeamReport`).
- `backend/agents/red_team_analyst/runner.py`.
- `backend/agents/red_team_analyst/eval/cases.json` (12 cases: 3 per ontology, covering Conflict / Mediation / Governance / Narrative).
- `backend/agents/red_team_analyst/eval/run_eval.py`.
- `backend/agents/red_team_analyst/eval/adversarial_prompts.json` — 8 prompt-injection attempts that should fail safely.
- `skills/subagents/red_team_analyst/SKILL.md`.
- `backend/tests/test_red_team_analyst.py`.

### Files to edit

- `backend/agents/deploy.py` — add deployment for the new subagent.
- `MODEL_MATRIX.json` — `red_team_analyst` uses `writing_quality` task kind.
- `infrastructure/terraform/modules/agent-engine/` — add the fifth Agent Engine resource.
- Diagnostics dashboard — add fifth subagent panel row.

### Hard rules

- Eval set must include adversarial prompt-injection tests; those tests must result in safe sanitized outputs.
- Cost ceiling enforced: $0.08/call.
- Output always carries `synthesized: true` and confidence ≤ 0.6.
- Output never written to graph automatically; routes through review queue if user wants to promote.
- Cloud Trace propagation verified.

### Definition of Done

- Subagent deployed to staging and production Agent Engines.
- Eval pass rate ≥ 80% on legitimate cases; 100% safe on adversarial cases.
- Cost-per-call ≤ $0.08 P95 on staging.
- Latency P95 ≤ 6s.

### Verification commands

```bash
bash scripts/deploy-subagents-staging.sh red_team_analyst
python -m backend.agents.red_team_analyst.eval.run_eval --target=staging
python -m backend.agents.red_team_analyst.eval.run_adversarial --target=staging
pytest backend/tests/test_red_team_analyst.py -q
```

---

## 9. Prompt O5 — `cross.red-team` tool

### Outcome

A thin tool wrapping the `red_team_analyst` subagent. Same v2 contract pattern. Inputs: `targetActorId`, optional `framing` text. Output: `RedTeamReport`.

### Files to create

- `src/lib/tools/registry/cross.red-team.ts`.
- `skills/tools/cross.red-team/SKILL.md`.
- `e2e/workbench/red-team-flow.spec.ts`.

### UI specifics

- Tool's input form lets user pick target Actor from the case graph (autocomplete on Actor labels).
- Output renders with prominent yellow banner: "This is a model of how Actor [X] might think. It is not endorsement or advocacy."
- "Append to memo as annex" button.
- "Add to review queue" option for individual claims (e.g., "Actor X believes Y" can be added as a Claim node through the firewall if the user accepts).

---

## 10. Prompt O6 — `cross.premortem` tool

### Outcome

A tool that imagines a memo's recommendation has failed catastrophically and asks "what went wrong?"

### Files to create

- `src/lib/tools/registry/cross.premortem.ts`.
- `skills/tools/cross.premortem/SKILL.md`.
- `backend/agents/memo_drafter/prompts/modes/premortem.md` — new Memo Drafter mode.
- `e2e/workbench/premortem-flow.spec.ts`.

### Outcome shape

The Klein 2007 formulation: assume the project has failed, work backward to identify likely failure pathways. Each pathway has severity, likelihood, triggering conditions, mitigations.

Tool reuses Memo Drafter in `premortem` mode rather than creating yet another subagent. Premortem is similar enough in shape to memo block drafting (structured prose with structured evidence) that splitting it out wouldn't pay rent.

### UI specifics

- Input: select a memo's recommendation block, or paste free text.
- Output: 5–10 failure pathways rendered as expandable cards, sortable by severity × likelihood.
- "Append as annex" appends a "Premortem (Klein 2007)" section to the memo.

---

## 11. Prompt O7 — Memo annex integration

### Persona
Document-engineering specialist. Knows that the export step is where polish matters.

### Outcome

Each SAT output can be appended to an active memo as an annex. The memo's DOCX/PDF/Markdown export includes the annex with proper formatting and source attribution.

### Annex formats

- **ACH annex**: matrix table (rows = hypotheses, columns = evidence; cells colored) + ranking + conclusion narrative. Cited as "Heuer (1999), *Psychology of Intelligence Analysis*, ch. 8."
- **KAC annex**: numbered list of assumptions with verdicts and supporting evidence. Cited as "Heuer & Pherson (2010), *Structured Analytic Techniques*, technique 8.1."
- **Red Team annex**: structured perspective summary with the framing disclaimer. Cited as "Heuer & Pherson, technique 9.4."
- **Premortem annex**: failure pathway table sorted by severity. Cited as "Klein (2007), *Performing a Project Premortem*, Harvard Business Review."

### Files to edit

- `backend/services/memo_export/docx.py` — add four annex renderers.
- `backend/services/memo_export/pdf.py` — same for PDF.
- `backend/services/memo_export/markdown.py` — same for MD.
- `src/types/memo.ts` — extend `MemoBlock` union with `SATAnnexBlock` variant.
- Memo editor component — recognize SAT annex blocks; render appropriately.

### Files to create

- `e2e/workbench/sat-memo-annex.spec.ts` — for each of the four SATs, run, append to memo, export DOCX, verify annex appears with correct formatting.

---

## 12. Prompt O8 — Marketplace section, suggestion engine, ADRs, final verification

### Persona
The final assembler.

### Outcome

The four SATs are visually grouped in the marketplace, the suggestion engine surfaces them appropriately, ADRs are committed, all gates are green.

### Marketplace section

- New section above the existing per-ontology grids in `/app/workbench/[caseId]/tools`: "Analyst's Toolkit (Heuer-Pherson SATs)".
- Four cards: ACH (links to the workbench tab), KAC, Red Team, Premortem.
- Citation footer: "Based on Richards J. Heuer Jr. & Randolph H. Pherson, *Structured Analytic Techniques for Intelligence Analysis* (CQ Press, multiple editions). PRAXIS implementations are independent."

### Suggestion engine

- Update `src/lib/tools/suggestion/role-affinity.ts` so analyst, researcher, policy_advisor roles get strong affinity for SATs.
- Update suggestion rationales: "Recommended because ACH is well-suited when you have multiple competing claims about Actor X."

### ADRs

Three new ADRs at `docs/adr/`:

- `0021-sats-as-first-class.md` — why SATs warrant first-class treatment, the four chosen, the Heuer-Pherson attribution rationale.
- `0022-red-team-analyst-subagent.md` — why a fifth subagent, the safety guardrails, the cost/latency targets.
- `0023-ach-workbench-surface.md` — why ACH gets a dedicated tab vs being a regular tool, the persistence model.

### Files to edit

- `PRAXIS_ARCHITECTURE.md` — §11 (tools marketplace) update tool count from 16/18 to 22; §18.4 (ADR catalog) add 0021–0023; §23 (changelog) bump to 1.1.
- `PRAXIS_IMPROVEMENT_ROADMAP.md` — mark §2.1, 2.2, 2.3, 2.4 as DONE in v1.1.
- `CHANGELOG.md` — entry under [1.1.0] section.

### Final verification gate

```bash
# Foundations
npm run typecheck
npm run lint
npm run test
pytest backend/ -q
mypy backend/ --strict

# Pack-specific audits
npm run audit:tool-contract-v2          # 22 tools, all conform
npm run audit:tool-skills-present
npm run audit:subagent-deployment-fresh # red_team_analyst deployed
npm run audit:subagent-eval-fresh       # all 5 subagents eval-fresh
npm run audit:tool-suggestion-eval      # recall@3 ≥ 80% (analyst now sees ACH)

# Architecture invariants unchanged
npm run audit:gate

# Persona suites — must remain green
npm run test:e2e:personas               # 10 consecutive

# SAT-specific
npx playwright test e2e/workbench/ach-flow.spec.ts
npx playwright test e2e/workbench/red-team-flow.spec.ts
npx playwright test e2e/workbench/premortem-flow.spec.ts
npx playwright test e2e/workbench/sat-memo-annex.spec.ts

# Subagent
python -m backend.agents.red_team_analyst.eval.run_eval --target=staging
python -m backend.agents.red_team_analyst.eval.run_adversarial --target=staging
```

All exit 0. PR mergeable.

---

## 13. Out of scope

- Devil's Advocacy (§2.6 of roadmap) — v2.
- Outside-In Thinking (§2.8) — v2.
- Indicators-and-Warnings (§2.7) — bundled with the indicator engine in pack 17 (early warning).
- Cross-case ACH comparison — v2.
- ACH live-collaboration — v2 (depends on multi-tenant teams).
- Auto-promotion of well-supported hypotheses to graph without user action — never; firewall invariant.

---

## 14. Closing note

Pack 15 is the pack that makes PRAXIS unambiguously a serious analyst's workbench. The Heuer-Pherson canon is not decorative; it is the vocabulary the persona was trained in. ACH alone, done well, is more recognizable to a CIA, FCDO, or UN DPPA analyst than any list of features. Pair that with the new "Analyst's Toolkit" marketplace section and the source attribution in every annex, and the persona's first reaction on opening PRAXIS becomes "this is built by people who understand my work."

The architectural cost is small: one new subagent (red_team_analyst), one new workbench tab (ACH), three new tools, four new memo annex formats, three new ADRs. The substrate doesn't change. The four-layer context doesn't change. The bible's invariants hold without exception.

The persona-suite test that gates this pack is the right one to anchor against: an analyst-persona spec that opens an ACH on a real case, scores 10 cells, exports a DOCX, and verifies the Heuer-style appendix renders correctly. If that test runs green ten times in a row, the pack is ready.

Branch: `feature/sat-toolkit`. Commit prefix `sat(<area>): <prompt-id> <description>` (e.g., `sat(ach): O2 implement ranking algorithm with diagnosticity weights`). PR titled `Pack 15 — SAT Toolkit (Analyst's Toolkit)`.

After merge, update §1 of the Master Charter to add row 15.

---

**File path**: `C:\Users\giuli\Downloads\PRAXIS_CODEX_15_SAT_TOOLKIT.md`
