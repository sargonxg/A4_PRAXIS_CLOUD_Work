# PRAXIS — Codex Pack 16: Agentic Boardroom

**File**: `PRAXIS_CODEX_16_AGENTIC_BOARDROOM.md`
**Branch**: `feature/agentic-boardroom`
**Depends on**: Packs 03-14 merged. v1.0.0 tagged. Pack 15 (SAT Toolkit) recommended (Red Team subagent reused). Pack 17 (Early Warning) recommended (VIEWS/UCDP feeds give analysts live data to cite).
**Estimated effort**: ~9 days (~70 engineering hours).
**Target release**: v1.1
**Voice**: Senior multi-agent systems engineer with a product-design head. The persona is a UN DPPA director walking into a real briefing — they want to hear from the political analyst, the security analyst, the legal adviser, and the regional expert. Each speaks in their own voice. Each cites their sources. Each can be challenged. The director synthesizes. PRAXIS recreates that room.

---

## 0. Why this pack exists

PRAXIS at v1.0 has tools that produce single-shot outputs. That is fine for many tasks — a ZOPA finder, a contradiction finder, a memo template auto-population — but it is structurally inadequate for the most valuable analytical work professionals do, which is **deliberation**. The political affairs officer at UN DPPA sitting on the Sudan desk does not produce briefings alone. They walk down the hall, talk to the security analyst, ping the legal adviser, get a read from the regional expert, run their conclusion past the devil's advocate. The output of that deliberation is qualitatively different from any individual analyst's solo work. The disagreements surface assumptions. The cross-references catch errors. The synthesis is richer than any single perspective.

PRAXIS already sketched an agentic boardroom in earlier work — a multi-agent deliberation system where specialized agents (political analyst, security analyst, humanitarian analyst, legal adviser, mediation strategist, media analyst, economist, regional expert, devil's advocate, synthesis lead) reason together over a case. The sketch had the right shape: distinct personas, role-specific tools, multi-round deliberation, structured consensus and dissents. What it lacked was the depth, polish, and production discipline that makes the boardroom feel like a real briefing rather than a prompt engineering exercise.

This pack delivers the production-grade Agentic Boardroom. Eight things are different from any prior implementation:

1. **Each persona is a deeply-specified expert** with a structured persona model (background, credentials, mental models, signature questions, signature blind spots), not a one-line system prompt. The political analyst doesn't just "analyze politics" — they apply specific frameworks (Putnam two-level games, principal-agent dynamics, audience costs) and ask specific questions ("who benefits?", "what's the domestic constraint?", "is the principal speaking or the agent?").

2. **Each persona has a corpus** — a curated knowledge library of 10-50 reference documents (canonical methodology texts, classic case studies, recent papers) that the persona retrieves from during deliberation. The security analyst has the UCDP codebooks, ICRC IHL primer, the Eck (2012) data-comparison paper, the IISS Military Balance entries; the legal adviser has UN Charter articles, Geneva Conventions, ILC Articles on State Responsibility, recent advisory opinions. Personas grow expertise as their corpora grow.

3. **Each persona has tools they're proficient with** — a curated subset of the PRAXIS marketplace that maps to their role. The economist gets `cross.scenario-projector` + `governance.compliance-monitor`; the security analyst gets `cross.ucdp-events` + `conflict.escalation-ladder`; the legal adviser gets `governance.amendment-impact-tracer` + `governance.precedent-finder`. Tool affinity drives which questions each persona can answer with structured analysis vs. expert intuition.

4. **The conversation is naturally varied**. Personas speak at different lengths (the regional expert opens with a 200-word framing; the devil's advocate cuts in with a 30-word challenge; the political analyst structures a 400-word argument with three citations). They use different forms (running prose, numbered points, direct questions, brief acknowledgments, strong dissents). They build on each other ("Yes, and…"), correct each other ("Actually, the JCPOA precedent is closer here…"), and concede ("That's a fair point — I hadn't considered the audience cost angle"). The transcript reads like a real meeting, not a structured turn-by-turn exchange.

5. **The boardroom has visual presence**. A round-table layout shows participants around the table, the active speaker highlighted, pending speakers cued, the moderator (a visible "synthesis lead" persona) orchestrating. Speech bubbles appear with varied sizes proportional to message length. Citation pills attach to claims. Tool-use indicators appear when a persona invokes a tool inline ("Sarah is checking UCDP…").

6. **The orchestration is real**. A Moderator subagent coordinates: opens with framing, calls on appropriate personas based on the question, manages turn-taking, surfaces points of agreement and disagreement, runs structured rounds, calls explicit votes when needed, produces a synthesis. The orchestration is an explicit LangGraph deployed to Vertex AI Agent Engine with named nodes (open, gather_initial_takes, surface_disagreements, deepen, vote_or_synthesize, close).

7. **The output is a structured deliberation artifact** persisted as a first-class object in the case (alongside tool runs and memos). Every claim made is timestamped, attributable to a persona, citation-bearing where applicable. The transcript exports as DOCX with proper attribution. Key conclusions can be promoted to the case graph through the review queue (synthesis claims labeled `synthesized: true` per the symbolic firewall, never auto-promoted to Verdict).

8. **Personas are extensible by the user**. Power users can author custom personas by uploading a corpus + filling a persona template + selecting a tool affinity. Custom personas live in the user's workspace; they participate in deliberations alongside the canonical ones. Workspaces accumulate house-style expertise over time.

After this pack, opening a PRAXIS case and clicking "Convene the boardroom" feels like walking into a Wednesday-morning interagency briefing where the analysts already know the file and have strong views. That experience — not any single feature — is what differentiates PRAXIS from "ChatGPT with a fancy UI."

---

## 1. Outcomes

| # | Outcome | Verification |
|---|---|---|
| 1 | New workbench tab `/app/workbench/[caseId]/boardroom` with full deliberation lifecycle (configure → convene → deliberate → synthesize → export) | E2E test green; deliberation round-trips through save/reload |
| 2 | Ten canonical analyst personas shipped with deep persona specs, corpora, and tool affinities | Each persona's smoke deliberation produces in-character output cited from its corpus |
| 3 | New `moderator` subagent deployed to Vertex AI Agent Engine orchestrating multi-round deliberation with explicit phases | Cloud Trace shows complete LangGraph run; eval set ≥ 12 cases passes |
| 4 | New `analyst_persona` subagent (parameterized by persona spec) deployed to Agent Engine; one deployment serves all ten personas via parameterization | Subagent eval per persona ≥ 80%; per-persona character-conformity rated by external reviewers |
| 5 | Visual round-table UI with active-speaker highlighting, varied speech-bubble sizes, citation pills, inline tool-use indicators | Visual snapshot test; manual review of three deliberation recordings |
| 6 | Each persona uses a curated tool subset; tool invocations during deliberation render inline; results inform subsequent contributions | Tool-use deliberation flow tested for 3 personas |
| 7 | Persona corpora retrievable via Vertex AI Vector Search (or pgvector fallback per Pack 14 N3); each persona retrieves 3-5 chunks per contribution when relevant | Corpus retrieval P95 < 500ms; relevance verified manually on 20 sample queries |
| 8 | Deliberation transcript persists as a first-class artifact; exports to DOCX with full attribution; key conclusions promoted to case graph through review queue | Round-trip test green; export passes formatting review |
| 9 | Custom-persona authoring: power-user UI for creating new personas (corpus upload + spec + tool affinity); custom personas participate alongside canonical ten | E2E test creates a custom persona, includes in deliberation, verifies it speaks in voice |
| 10 | Three new ADRs committed: 0026 (Agentic Boardroom architecture), 0027 (parameterized analyst_persona subagent), 0028 (persona corpus retrieval pattern) | ADRs reviewed and merged |
| 11 | Cost ceiling: a 5-persona, 4-round deliberation completes for ≤ $1.50 P95 on staging; surfaces in cost dashboard per-deliberation | Cost telemetry verified against 50 sample deliberations |
| 12 | Boardroom integrates with Pack 15 SAT Toolkit: convening a "Red Team round" inserts the Red Team Analyst persona; convening "ACH round" runs hypothesis-evidence scoring across the personas | E2E test for SAT-integrated deliberation |

---

## 2. Pre-work confirmation note

> I am Codex. I have read pack 16. I understand:
> 1. **The Agentic Boardroom is a multi-agent deliberation system**, not a chat interface. Ten canonical specialist personas (Political Analyst, Security Analyst, Humanitarian Analyst, Legal Adviser, Mediation Strategist, Media Analyst, Economist, Regional Expert, Devil's Advocate, Synthesis Lead) plus a Moderator orchestrating. Personas can be customized by power users.
> 2. **Each persona is parameterized into one `analyst_persona` subagent** deployed to Vertex AI Agent Engine. The subagent takes `persona_id` as input and loads the corresponding persona spec, corpus retrieval handle, and tool subset. This is more efficient than ten separate subagent deployments.
> 3. **The Moderator is its own subagent** with a LangGraph that manages phases (opening → initial takes → disagreement surfacing → deepening → vote/synthesis → closing). It calls the analyst_persona subagent multiple times per deliberation, choosing which persona speaks when based on the discussion state.
> 4. **Persona corpora are curated** — each canonical persona ships with 10-50 reference documents (citations always attributed properly). Corpora live in Cloud Storage; chunks indexed in pgvector (or Vertex AI Vector Search per Pack 14 N3) under per-persona namespaces. Custom personas use user-uploaded corpora.
> 5. **Tool affinity** — each persona declares a subset of the marketplace tools they're proficient with. During deliberation, the persona can invoke a tool inline; the result is rendered alongside their contribution and informs subsequent reasoning.
> 6. **Conversation natural variation** is engineered. The persona's system prompt explicitly instructs varied speaking lengths (30 words for a quick acknowledgment, 400 for a structured argument), varied forms (prose, bullets, questions, dissents), and contextual responsiveness ("Yes, and…", "Actually…", "I'd push back on…"). The Moderator's prompt enforces turn-taking that doesn't feel mechanical.
> 7. **All deliberation outputs are labeled `synthesized: true`** per the symbolic firewall (Bible §6). Synthesis claims promoted to the case graph go through the review queue, never auto-promoted to Verdict.
> 8. **Cost discipline**: a 5-persona, 4-round deliberation has a hard cost ceiling of $1.50 enforced at the Moderator subagent. Personas use `gemini-3-flash` for default contributions and `claude-opus-4.7@vertex` for the Synthesis Lead's final synthesis (per Bible §15 model selection).
> 9. **Architecture invariants** from the bible (§3) are inviolable. ACO substrate unchanged, four-layer context unchanged, ContextProvider-only access, no model strings outside MODEL_MATRIX.json, persona suites green for 10 consecutive runs before merge.
>
> Open questions for Giulio:
> - **Q1**: The ten canonical personas — propose: Political Analyst, Security Analyst, Humanitarian Analyst, Legal Adviser, Mediation Strategist, Media/Narrative Analyst, Economist, Regional Expert, Devil's Advocate, Synthesis Lead. Acceptable, or amend? (Note: Red Team Analyst from Pack 15 is reused; Devil's Advocate is the broader persona for any topic.)
> - **Q2**: Persona corpus seeding — propose: ship each canonical persona with a starter corpus of 15-25 documents (canonical methodology texts, classic case studies, recent papers) totaling ~5MB per persona, served from a `gs://praxis-persona-corpora/` bucket with public read so all tenants share the canonical foundation. Custom corpora live in user workspaces. Acceptable?
> - **Q3**: Deliberation rounds — propose: default 4 rounds (opening framing → initial takes → disagreement → synthesis); user can extend to 6 if depth needed; max 8 hard cap to control cost. Acceptable?
> - **Q4**: Visual round-table — propose: SVG-rendered table with persona avatars (geometric, role-coded, not photographic), active-speaker highlighting, varied speech-bubble sizes, citation pills attached to claims. Optional "transcript-only" view for keyboard-first users. Acceptable, or different visual approach?
> - **Q5**: Custom persona authoring — propose: ship in this pack as a "Pro" feature gated behind a workspace flag (so v1.1 ships with the canonical ten universally; custom personas roll out to power users selectively). Acceptable, or open to all tenants from launch?
> - **Q6**: Corpus retrieval backend — propose: pgvector for v1.1 (consistent with Pack 14 N3 default); migrate to Vertex AI Vector Search at v2 when corpus volume justifies. Acceptable?

Wait for answers before proceeding.

---

## 3. Pack overview

| Prompt | Outcome | Est. hrs |
|---|---|---|
| Q1 | Foundations: persona spec types, corpus types, deliberation types, schemas | 6 |
| Q2 | Ten canonical persona specs authored with full depth (background, frameworks, signature questions, blind spots, tool affinity, corpus manifest) | 10 |
| Q3 | Persona corpora seeded (15-25 docs per persona), Cloud Storage bucket, ingestion pipeline, pgvector indexing | 8 |
| Q4 | `analyst_persona` parameterized subagent: LangGraph, system prompt template, corpus retrieval, tool invocation, output schema | 9 |
| Q5 | `moderator` subagent: orchestration LangGraph with explicit phases, turn-taking logic, synthesis production | 8 |
| Q6 | Boardroom workbench surface: configure → convene → live deliberation view → synthesis review → export | 10 |
| Q7 | Visual round-table UI with active-speaker highlighting, varied bubble sizes, citation pills, tool-use indicators | 8 |
| Q8 | Custom-persona authoring UI for power users; corpus upload, spec template, tool affinity selection | 6 |
| Q9 | SAT integration (Pack 15): Red Team round + ACH round patterns; ADRs; final verification | 5 |
| **Total** | | **~70** |

---

## 4. Hard rules

- **Personas never speak from un-grounded knowledge.** Every claim a persona makes either (a) cites a corpus document the persona retrieved during the deliberation, (b) cites a node in the case graph, (c) cites a tool result they invoked, or (d) is explicitly framed as opinion ("In my judgment…"). Statements without one of these four cannot be persisted as part of the synthesis.
- **The Moderator never produces substantive analytical claims** — only orchestration: framing the question, calling on personas, surfacing agreements/disagreements, calling for synthesis. Substance comes from the analyst personas.
- **Synthesis claims are labeled `synthesized: true` and capped at confidence ≤ 0.6** per the symbolic firewall (Bible §6.4). Promoting a synthesis claim to the case graph routes through the review queue.
- **Per-deliberation cost ceiling**: $1.50 P95 enforced at the Moderator subagent. If a deliberation would exceed, it short-circuits with a graceful "ceiling reached, here's what we have so far" close.
- **Per-persona system prompts reference the bible's invariants**: every persona is instructed to respect the symbolic firewall (no Verdict-layer assertions), the four-layer context model, the citation discipline.
- **Conversation variation is structural, not cosmetic**. The Moderator's LangGraph explicitly schedules different contribution types (long opening, short reaction, structured argument, brief consensus check), and the analyst_persona subagent has explicit modes for each.
- **All ten canonical personas have eval sets** at `backend/agents/analyst_persona/eval/personas/<persona_id>/cases.json` with 8-12 cases per persona. CI gate: each persona's eval pass rate ≥ 80%; persona-character conformity (judged by automated rubric) ≥ 75%.
- **Custom personas** are sandboxed: they run on Cloud Run with the same isolation as canonical ones, can't access tools they didn't declare, can't read corpora outside their declared manifest.
- **Persona corpora are versioned**. Updates to a canonical corpus go through a quarterly review process committed to `docs/persona-corpora/CHANGELOG.md`. Reproducibility: a deliberation persisted in 2026 can be re-run in 2027 against the same corpus version and produce comparable output.
- **Boardroom respects the four-phase pattern** (Read & report → Propose & confirm → Execute → Verify) inside its own runtime — the user sees a clear configure phase before deliberation starts, can intervene mid-deliberation, reviews the synthesis before promoting to graph or memo.

---

## 5. Prompt Q1 — Foundations: types, schemas, persistence

### Persona
Architect. Designs the data model once, correctly, before any agent code is written.

### Phase 1 — Read & report

- Read existing subagent type patterns at `backend/agents/<id>/output_schema.py`.
- Read tool contract types at `src/lib/tools/types.ts`.
- Read prior boardroom sketches in conversation history; harvest type ideas without copying flawed structure.
- Output `docs/audits/2026-NN-NN-BOARDROOM_FOUNDATIONS.md` listing types to add.

### Phase 2 — Propose & confirm

```ts
// src/types/boardroom.ts (Zod-validated; Pydantic mirror at backend/types/boardroom.py)

export type PersonaId =
  | 'political-analyst'
  | 'security-analyst'
  | 'humanitarian-analyst'
  | 'legal-adviser'
  | 'mediation-strategist'
  | 'media-analyst'
  | 'economist'
  | 'regional-expert'
  | 'devils-advocate'
  | 'synthesis-lead'
  | string;  // custom persona ids prefixed 'custom:'

export interface PersonaSpec {
  id: PersonaId;
  version: string;                     // e.g. "1.0.0"; bumped when spec changes
  displayName: string;
  shortRole: string;                   // e.g. "Political Analyst"
  avatar: { kind: 'geometric'; shape: string; color: string };

  background: {
    professionalProfile: string;        // 2-3 paragraph bio
    credentials: string[];              // explicit institutional/role markers
    yearsOfExperience: number;
    languages: string[];
  };

  expertise: {
    domains: string[];                  // ["mediation", "civil-military relations", ...]
    frameworks: PersonaFramework[];     // Putnam, Glasl, Harvard PON, etc.
    signatureQuestions: string[];       // "Who benefits?" "What is the BATNA?"
    signatureBlindSpots: string[];      // self-aware limitations
    confidenceProfile: 'cautious' | 'measured' | 'assertive';
  };

  voice: {
    register: 'formal' | 'professional' | 'plainspoken';
    typicalUtteranceLength: { min: number; median: number; max: number };  // word counts
    formPreferences: ('prose' | 'bullets' | 'questions' | 'caveats')[];
    signaturePhrases: string[];         // e.g. "On the structural side…"
    avoidPhrases: string[];             // anti-cliché list
  };

  tools: {
    proficient: ToolId[];               // can invoke during deliberation
    referenced: ToolId[];               // can mention but not invoke
  };

  corpus: {
    manifest: CorpusEntry[];            // 10-50 reference documents
    namespace: string;                  // pgvector namespace e.g. 'persona:political-analyst:v1.0.0'
    retrievalBudget: { topK: number; maxTokens: number };
  };

  systemPromptTemplate: string;         // path to `backend/agents/analyst_persona/prompts/personas/<id>.md`
}

export interface PersonaFramework {
  name: string;
  source: string;                       // citation
  applicability: string;                // when to invoke
  invocationCue: string;                // what triggers it in deliberation
}

export interface CorpusEntry {
  id: string;
  title: string;
  citation: string;                     // canonical citation
  kind: 'methodology' | 'case-study' | 'reference' | 'policy-doc' | 'paper';
  source: string;                       // URL or canonical reference
  license: string;                      // CC-BY-4.0, public domain, fair use, owner-submitted, etc.
  storageUri: string;                   // gs://... for canonical, user-storage for custom
}

export interface Deliberation {
  id: string;
  caseId: string;
  ownerUid: string;
  title: string;                        // "Sudan Q3 outlook briefing"
  status: 'configuring' | 'in_progress' | 'concluded' | 'aborted';
  config: DeliberationConfig;
  rounds: DeliberationRound[];
  synthesis?: DeliberationSynthesis;
  createdAt: string;
  startedAt?: string;
  concludedAt?: string;
  costSummary: { usd: number; tokensIn: number; tokensOut: number };
}

export interface DeliberationConfig {
  question: string;                     // the framing question
  context: { sourceMemoIds?: string[]; focusedNodeIds?: string[] };
  participants: PersonaId[];            // 3-7 personas
  rounds: number;                       // default 4, max 8
  moderatorStyle: 'structured' | 'socratic' | 'consensus_seeking' | 'red_team';
  satIntegration?: 'red_team' | 'ach' | 'kac' | 'premortem' | null;
}

export interface DeliberationRound {
  number: number;
  phase: 'opening' | 'initial_takes' | 'disagreement' | 'deepening' | 'synthesis' | 'close';
  contributions: PersonaContribution[];
  agreementsSurfaced: string[];
  disagreementsSurfaced: string[];
}

export interface PersonaContribution {
  id: string;
  personaId: PersonaId;
  roundNumber: number;
  utteranceForm: 'prose' | 'bullets' | 'question' | 'short_react' | 'dissent';
  text: string;
  wordCount: number;                    // tracked for variation
  respondingToContributionId?: string;  // explicit reply chain
  agreesWith?: string[];                // ids of contributions agreed
  disagreesWith?: string[];
  citations: ContributionCitation[];
  toolInvocations: ToolInvocation[];
  selfRatedConfidence: number;          // 0..1
  generatedAt: string;
}

export interface ContributionCitation {
  kind: 'corpus' | 'graph_node' | 'tool_result' | 'external_url';
  ref: string;                          // corpus entry id, node id, tool run id, url
  excerpt?: string;
  relevance: number;                    // 0..1
}

export interface ToolInvocation {
  toolId: ToolId;
  inputSummary: string;
  outputSummary: string;
  toolRunId: string;                    // links to ToolRun artifact
  invokedAt: string;
}

export interface DeliberationSynthesis {
  consensusClaims: SynthesisClaim[];
  dissentingViews: DissentingView[];
  unresolvedQuestions: string[];
  confidenceOverall: number;            // 0..1, capped at 0.6 (synthesized firewall rule)
  generatedBy: 'synthesis-lead';
  generatedAt: string;
}

export interface SynthesisClaim {
  id: string;
  text: string;
  supportedBy: PersonaId[];
  citations: ContributionCitation[];
  confidence: number;                   // 0..0.6
  proposedAsGraphAddition?: {            // if user accepts, routes through review queue
    primitive: ACOPrimitive;
    subtype: string;
    layer: 'Claim';                     // never higher
  };
}

export interface DissentingView {
  text: string;
  heldBy: PersonaId[];
  rationale: string;
  citations: ContributionCitation[];
}
```

Persistence:
- Persona specs (canonical): `backend/personas/canonical/<id>/spec.json` (in repo, version-controlled).
- Persona specs (custom): `users/{uid}/workspace/personas/{id}` (Firestore) + corpus blobs in user's workspace bucket.
- Deliberations: `users/{uid}/situations/{caseId}/deliberations/{deliberationId}` (Firestore metadata) + `users/{uid}/situations/{caseId}/deliberations/{deliberationId}/contributions/{contributionId}` (subcollection).
- Synthesis: embedded in Deliberation document.

Wait for sign-off.

### Phase 3 — Execute

- Author types in `src/types/boardroom.ts` and Pydantic mirror.
- Set up Firestore rules for the new collections.
- Author parity test.

### Phase 4 — Verify

```bash
npm run typecheck
pytest backend/tests/test_boardroom_parity.py -q
```

---

## 6. Prompt Q2 — Ten canonical persona specs

### Persona
Domain expert + product designer. Knows that a persona spec at the depth this pack requires takes a real day per persona to research and author well.

### Outcome

Ten canonical PersonaSpec files committed to `backend/personas/canonical/<id>/spec.json` with full depth.

### Spec authoring guidelines (per persona)

For each canonical persona, the spec captures:

1. **A real professional profile** — not "AI agent that analyzes politics" but "Senior political affairs officer with 15 years at UN DPPA, posted to Khartoum 2018-2021 and Geneva 2021-2024, lead drafter on three Security Council mandate renewals, holds an MA from Sciences Po and an MPhil from Oxford. Specialized in power-sharing arrangements and electoral processes." The persona should feel like a real colleague.

2. **Three to five named frameworks** with citations. The political analyst gets Putnam (1988) two-level games, principal-agent theory (Eisenhardt 1989), audience cost theory (Fearon 1994), the diversionary war hypothesis. Each framework includes when to invoke it.

3. **Five to ten signature questions** the persona habitually asks. The political analyst asks "Who benefits domestically?" "What is the agent's mandate from the principal?" "Are these audience costs locked in?" The security analyst asks "What capabilities does this actor actually have?" "What is the chain of command?" "Where are the supply lines?"

4. **Three to five signature blind spots** the persona is self-aware about. The political analyst can over-attribute agency to elites and miss bottom-up dynamics. The security analyst can over-rely on capabilities and miss intentions. The economist can treat preferences as exogenous. Self-awareness improves deliberation by giving other personas predictable openings to push back.

5. **A voice profile**: typical utterance length ranges (shorter for the Devil's Advocate, longer for the Regional Expert), form preferences (the Mediation Strategist prefers structured prose with named parties; the Devil's Advocate prefers questions and dissents), 3-5 signature phrases that mark the persona, anti-cliché phrases to avoid.

6. **Tool affinity**: 4-8 tools from the marketplace the persona is proficient with, plus 4-8 they can reference but not invoke. The political analyst invokes `governance.coalition-map`, `governance.veto-coalition-mapper`, `cross.scenario-projector`; references `cross.contradiction-finder` and the SAT toolkit but doesn't invoke.

7. **Corpus manifest**: 15-25 reference documents with full citations, license, source URI. Mix of methodology texts (Putnam 1988 for political analyst), classic case studies (Schelling on coercion for security analyst), and recent papers (e.g., a 2024 article on multi-party negotiation for the Mediation Strategist).

### The ten canonical personas

| Persona | Background | Frameworks | Signature questions |
|---|---|---|---|
| **Political Analyst** | UN DPPA / FCDO senior political affairs officer profile; 15+ years; specialized in power-sharing, elections, constitutional reform | Putnam two-level games, principal-agent, audience costs, diversionary war | "Who benefits?", "Is the principal speaking?", "What's the domestic constraint?" |
| **Security Analyst** | Former military intelligence officer turned conflict analyst; reads UCDP and IISS data fluently | Capabilities-vs-intentions, chain-of-command analysis, escalation ladder, security dilemma | "What can they do?", "What do they signal?", "Where do supply lines run?" |
| **Humanitarian Analyst** | OCHA / ICRC veteran; field deployments in Syria, South Sudan, Yemen | Sphere standards, Do No Harm, humanitarian-development-peace nexus | "Who is most affected?", "What is access?", "What about protection?" |
| **Legal Adviser** | Former ILC member or senior treaty officer; international law specialist | UN Charter system, Geneva Conventions/AP, ILC Articles on State Responsibility, customary IHL | "What is the legal basis?", "Who is bound?", "What is the precedent?" |
| **Mediation Strategist** | Veteran mediator (HD Centre / CMI / UN DPA mediation profile); track record on multi-party processes | Harvard PON principled negotiation, Glasl escalation, multi-party process design, ZOPA/BATNA | "What are the unstated interests?", "Where's the ZOPA?", "Who has the leverage?" |
| **Media/Narrative Analyst** | Former journalist turned discourse analyst; covers state media, social media, framing | Frame analysis (Entman), Ben Nimmo 4D, dominant-narrative tracking, source-credibility scoring | "Who's framing this?", "Whose audience is being targeted?", "What's the dominant narrative?" |
| **Economist** | DPI / IMF / World Bank profile; specialized in conflict economies, sanctions, resource flows | Collier's greed-vs-grievance, sanctions-impact assessment, conflict-as-development-failure, fiscal-political-survival logic | "What's the resource flow?", "Who depends on what?", "What's the fiscal constraint?" |
| **Regional Expert** | Country/regional specialist; deep contextual fluency on the case region | Comparative historical analysis, deep area-studies, longue durée framing | "What is the historical analogue?", "Who are the local actors I haven't named?", "What is the regional dynamic?" |
| **Devil's Advocate** | Contrarian methodologist; trained in red-teaming and assumption-checking | Heuer-Pherson SATs, red-team analysis, KAC, premortem (overlaps with Pack 15) | "What if we're wrong?", "What are we missing?", "What's the strongest counter?" |
| **Synthesis Lead** | Senior analyst capable of integrating multiple perspectives; chairs the room | Multi-perspective synthesis, calibrated uncertainty, structured analytic conclusion | "Where do we agree?", "What are the irreducible disagreements?", "What is our calibrated answer?" |

### Files to create (per persona × 10)

- `backend/personas/canonical/<id>/spec.json` — the PersonaSpec document.
- `backend/personas/canonical/<id>/persona.md` — long-form rationale (the "why this persona, why these frameworks") for transparency and future engineers.
- `backend/agents/analyst_persona/prompts/personas/<id>.md` — the persona-specific system prompt template.
- `backend/personas/canonical/<id>/corpus_manifest.yaml` — 15-25 corpus entries.

### Verification

- All ten persona specs validate against the PersonaSpec Zod schema.
- For each persona, manual review by Giulio: "would I want this colleague at my briefing?"
- Spec linter audit `audit:persona-specs-valid` runs in CI.

---

## 7. Prompt Q3 — Persona corpora seeding + ingestion + retrieval

### Persona
Knowledge engineer. Curates each corpus carefully; gets the licensing right; ingests cleanly.

### Outcome

For each canonical persona, 15-25 reference documents seeded into `gs://praxis-persona-corpora/<persona-id>/v<version>/`, ingested into pgvector under namespace `persona:<id>:v<version>`, retrievable by the analyst_persona subagent.

### Per-persona corpus selection guidelines

Every corpus document must clear three filters:

1. **Authority**: it's a primary source, a peer-reviewed paper, a canonical methodology text, or an official report. No blogs, no wikipedia, no synthesized summaries.
2. **License**: CC-BY-4.0 (e.g., UCDP, World Bank), public domain (e.g., UN documents), fair-use excerpts (small excerpts of canonical texts with proper citation), or owner-submitted (TACITUS/GC's own work). Each entry's `license` field is honest.
3. **Relevance**: the document is plausibly retrievable for at least 5 deliberation questions a real persona of that role would face. Vanity citations (impressive but never useful) get dropped.

### Sample corpus seeds (illustrative, not exhaustive)

**Political Analyst corpus**:
- Putnam, R.D. (1988). "Diplomacy and Domestic Politics: The Logic of Two-Level Games." *International Organization* 42(3) — methodology, fair-use excerpt
- Fearon, J. (1994). "Domestic Political Audiences and the Escalation of International Disputes." *APSR* — methodology, fair-use excerpt
- Recent UN Sudan reports (S/2025/...) — public domain
- Crisis Group's recent Africa briefing series — owner license / fair use
- Wallensteen, P. (2018). *Understanding Conflict Resolution* — selected chapters, fair use
- TACITUS Conflict Grammar Corpus extracts — owner-submitted
- ~15 more recent papers and reports

**Security Analyst corpus**:
- UCDP GED v25.1 codebook — CC-BY-4.0
- UCDP Candidate Events Dataset codebook — CC-BY-4.0
- Eck, K. (2012). "In data we trust? A comparison of UCDP GED and ACLED conflict events datasets." *Cooperation and Conflict* — fair use
- ICRC IHL primer — public access
- IISS Military Balance country sections (recent) — fair use excerpts
- Schelling, T. (1966). *Arms and Influence* — selected chapters, fair use
- Posen, B. (1993). "The Security Dilemma and Ethnic Conflict." *Survival* — fair use
- ~15 more case studies and reports

**Legal Adviser corpus**:
- UN Charter (full text) — public domain
- Geneva Conventions + Additional Protocols — public domain
- ILC Articles on State Responsibility — public domain
- Recent ICJ advisory opinions — public domain
- UN Security Council resolutions on case-relevant topics — public domain
- Cassese, A. *International Criminal Law* — selected chapters, fair use
- ~15 more treaty texts and case law

(And so on for each of the ten personas.)

### Ingestion pipeline

- Cloud Storage bucket `gs://praxis-persona-corpora/` with public-read on canonical/, restricted on user-custom/.
- Cloud Build trigger: on commit to `backend/personas/canonical/<id>/corpus_manifest.yaml`, run `scripts/ingest-persona-corpus.sh <id>` to refresh the persona's pgvector index.
- Ingestion: chunk via the existing pipeline (Pack 06), embed via `text-embedding-005` (768-dim per Bible §15), store in `persona_corpus_chunks` table with namespace = `persona:<id>:v<version>`.
- Retrieval: at deliberation time, the analyst_persona subagent calls `retrieve_persona_corpus(persona_id, query, top_k=5)`.

### Files to create

- `infrastructure/terraform/modules/cloud-storage/persona-corpora.tf` — bucket setup.
- `backend/migrations/alembic/versions/0005_persona_corpus_chunks.py` — schema.
- `backend/services/persona_corpus/ingester.py`.
- `backend/services/persona_corpus/retriever.py`.
- `scripts/ingest-persona-corpus.sh`, `scripts/refresh-all-canonical-corpora.sh`.
- `docs/persona-corpora/CHANGELOG.md` — quarterly review log.
- `backend/tests/test_persona_corpus_retrieval.py`.

### Files to edit

- `audit:gate` — append `audit:persona-corpora-fresh` (each canonical corpus reingest in last 90 days OR docs unchanged).

### Verification

- Each canonical persona has 15-25 corpus chunks indexed.
- For 20 sample queries (2 per persona), retrieval returns relevant chunks (manually rated ≥ 4/5 by Giulio).
- Re-running ingest is idempotent.

---

## 8. Prompt Q4 — `analyst_persona` parameterized subagent

### Persona
Agent engineer. Builds one well-instrumented subagent that serves all ten personas via parameterization, rather than ten separate deployments.

### Outcome

A single LangGraph subagent at `backend/agents/analyst_persona/` deployed once to Vertex AI Agent Engine, parameterized by `persona_id`. Every contribution call routes through this one subagent.

### Subagent design

Six-node LangGraph:

1. **`load_persona`** — fetches the PersonaSpec from `backend/personas/canonical/<persona_id>/spec.json` (or Firestore for custom personas). Initializes voice/tool/corpus configuration.

2. **`gather_context`** — assembles the deliberation context: the configuring question, prior round contributions, the case graph summary scoped to the persona's tool affinity, the user's communication-style preference.

3. **`retrieve_corpus`** — invokes `retrieve_persona_corpus(persona_id, query)` with a query synthesized from the deliberation question + the prior contributions. Returns 3-5 corpus chunks ranked by relevance.

4. **`maybe_invoke_tool`** — based on the deliberation question and the persona's tool affinity, decides whether to invoke a marketplace tool. If yes, calls the tool through ContextProvider.subagent (treating it as a sub-call), captures the output, makes it available for the contribution.

5. **`compose_contribution`** — generates the persona's actual utterance using `claude-opus-4.7@vertex` (writing-quality task kind per Bible §15) with a system prompt that:
   - Loads the persona's voice profile, signature phrases, and form preferences.
   - Instructs varied utterance length (adapt based on the deliberation phase: opening = long, reaction = short, synthesis-prep = structured).
   - Requires every claim be cited (corpus, graph, tool result, or explicit opinion).
   - Forbids generic statements that any persona could have made; enforces persona-character.
   - Caps confidence at 0.6 for any synthesized claim.

6. **`structure_output`** — validates the contribution against the `PersonaContribution` Pydantic schema; computes word count; extracts citations into the structured citation array; rates self-confidence.

### Files to create

- `backend/agents/analyst_persona/__init__.py`.
- `backend/agents/analyst_persona/graph.py`.
- `backend/agents/analyst_persona/state.py`.
- `backend/agents/analyst_persona/persona_loader.py`.
- `backend/agents/analyst_persona/prompts/system_template.md` — base template that interpolates persona-specific blocks.
- `backend/agents/analyst_persona/prompts/personas/<id>.md` — 10 persona-specific blocks.
- `backend/agents/analyst_persona/output_schema.py` — Pydantic for `PersonaContribution`.
- `backend/agents/analyst_persona/runner.py`.
- `backend/agents/analyst_persona/eval/personas/<id>/cases.json` — 8-12 cases per persona.
- `backend/agents/analyst_persona/eval/run_eval.py`.
- `backend/agents/analyst_persona/eval/character_conformity_rubric.py` — automated rubric scoring how well outputs match the persona's voice profile.
- `skills/subagents/analyst_persona/SKILL.md`.

### Files to edit

- `backend/agents/deploy.py` — add deployment.
- `MODEL_MATRIX.json` — `analyst_persona` uses `writing_quality` task kind.
- `infrastructure/terraform/modules/agent-engine/` — add the new Agent Engine resource.

### Hard rules

- Eval set must include each persona's 8-12 cases; pass rate ≥ 80%.
- Character-conformity rubric ≥ 75% (validates voice match: signature phrases used, form preferences honored, length within typical range).
- Cost ceiling per contribution: $0.04 P95.
- Latency P95 per contribution: 5s.
- Cloud Trace propagation verified.

### Definition of Done

- Subagent deployed to staging and production Agent Engine.
- All ten personas pass their eval sets.
- Sample deliberation with 5 personas runs end-to-end on staging; transcript reads naturally; citations validate.

---

## 9. Prompt Q5 — `moderator` subagent

### Persona
Orchestration engineer. Designs the conversation flow that makes the boardroom feel like a real briefing.

### Outcome

A LangGraph subagent at `backend/agents/moderator/` deployed to Vertex AI Agent Engine, orchestrating multi-round deliberation with explicit phases.

### Subagent design

The Moderator has its own LangGraph with eight nodes:

1. **`open`** — produces the framing utterance: restates the question, names the participants, sets the agenda. ~80 words. Emitted as a Moderator contribution distinct from analyst contributions.

2. **`schedule_initial_takes`** — calls each participating persona once for their initial take on the question. Order: Regional Expert first (sets context), then domain experts (Political, Security, Humanitarian, Legal, Economist) in parallel-ish ordering, then Mediation Strategist or Media Analyst as relevant, then Devil's Advocate. Each persona's contribution is invoked via `analyst_persona` subagent with phase=`initial_takes`.

3. **`detect_disagreements`** — uses `gemini-3-flash` (cheap classification) to scan the initial takes and surface 2-4 substantive disagreements (not phrasing differences). Outputs structured list.

4. **`schedule_disagreement_rounds`** — for each surfaced disagreement, schedules contributions: the persona who raised it elaborates, the persona who disagreed responds, optionally the Devil's Advocate adds a stress test. Phase=`disagreement`. Utterances are shorter and more reactive than initial takes.

5. **`schedule_deepening`** — picks the 1-2 most important questions remaining; calls relevant personas for deeper analysis; allows them to invoke tools (the security analyst pulls UCDP events; the political analyst runs a coalition map). Phase=`deepening`. Utterances are structured and citation-heavy.

6. **`call_synthesis`** — invokes the Synthesis Lead persona explicitly. Synthesis Lead receives the full deliberation transcript and produces structured `DeliberationSynthesis`: consensus claims, dissenting views, unresolved questions, calibrated overall confidence.

7. **`close`** — produces a closing utterance: thanks participants, summarizes synthesis at high level, flags items for user attention. ~60 words.

8. **`cost_guard`** — runs after every node; if cumulative cost approaches $1.50 ceiling, short-circuits to `call_synthesis` with a graceful "we're nearing our cost ceiling, here's what we have" annotation.

### Moderator system prompt highlights

- Never produce substantive analytical claims; orchestrate only.
- Surface disagreements explicitly; don't paper over them.
- Vary the call order so different personas open different rounds.
- When the Devil's Advocate raises a strong challenge, give the challenged persona right of reply.
- Recognize when a deliberation has reached natural close (3 substantive disagreements all addressed; no new arguments in the last round) and synthesize early.

### Files to create

- `backend/agents/moderator/__init__.py`, `graph.py`, `state.py`.
- `backend/agents/moderator/prompts/system.md`.
- `backend/agents/moderator/prompts/synthesis_lead.md` — used when calling synthesis lead.
- `backend/agents/moderator/output_schema.py`.
- `backend/agents/moderator/runner.py`.
- `backend/agents/moderator/eval/cases.json` — 12 cases including: 5-persona basic, 7-persona complex, deliberation that hits cost guard, deliberation with strong dissent, deliberation that closes early.
- `backend/agents/moderator/eval/run_eval.py`.
- `skills/subagents/moderator/SKILL.md`.

### Hard rules

- Per-deliberation cost ceiling enforced at the Moderator: $1.50 P95.
- Eval pass rate ≥ 85%.
- Cloud Trace shows complete LangGraph run with all child analyst_persona invocations nested.

---

## 10. Prompt Q6 — Boardroom workbench surface

### Persona
Frontend engineer. Builds the surface that turns "the agents are deliberating" into something a user wants to watch.

### Outcome

A new tab `/app/workbench/[caseId]/boardroom` with full deliberation lifecycle.

### Pages

- **Index page** at `/app/workbench/[caseId]/boardroom` — list of past deliberations on this case + "Convene the boardroom" CTA.
- **Configure page** at `/app/workbench/[caseId]/boardroom/new` — wizard: framing question, participant selection (3-7 personas; sensible defaults based on case ontology), round count, moderator style, optional SAT integration.
- **Live page** at `/app/workbench/[caseId]/boardroom/[deliberationId]` — the round-table view (see Prompt Q7) with live updates as the deliberation progresses.
- **Synthesis page** at `/app/workbench/[caseId]/boardroom/[deliberationId]/synthesis` — formatted synthesis with claims, dissents, unresolved questions, "Promote claim X to graph" buttons that route through review queue, "Append synthesis to memo" CTA, "Export DOCX" CTA.

### Backend API

- `POST /v1/cases/{caseId}/deliberations` — create with config; returns deliberation id.
- `POST /v1/cases/{caseId}/deliberations/{id}/start` — invokes Moderator subagent; streams contributions via SSE.
- `GET /v1/cases/{caseId}/deliberations/{id}` — fetch full state.
- `POST /v1/cases/{caseId}/deliberations/{id}/synthesis/promote` — promote a synthesis claim through review queue.
- `POST /v1/cases/{caseId}/deliberations/{id}/abort` — graceful abort mid-deliberation.

### Files to create

- All pages above.
- `backend/routers/deliberations.py`.
- `backend/services/deliberation_orchestrator.py` — wraps the Moderator subagent invocation, handles streaming.
- `e2e/workbench/boardroom-flow.spec.ts`.
- `e2e/workbench/boardroom-abort-and-cost-guard.spec.ts`.

---

## 11. Prompt Q7 — Visual round-table UI

### Persona
Design-engineering lead. Knows that the visual presence of the boardroom is what differentiates the experience from a chat interface.

### Outcome

A round-table view that renders the deliberation as a meeting in progress.

### Visual specifications

- **Layout**: SVG-rendered oval table viewed from above; persona avatars positioned around the table. Avatars are geometric (role-coded color + shape, not photographic — no fake photos of fake people).
- **Active speaker**: highlighted with a soft glow + speech bubble appearing over their seat.
- **Speech bubble sizes**: vary proportional to word count. A 30-word reaction has a small bubble; a 400-word structured argument has a large bubble. Bubbles fade after 8 seconds and the contribution moves into the transcript pane.
- **Citation pills**: small chips inside speech bubbles. Hover shows the full citation. Click navigates to the cited source (graph node, tool result, or corpus document).
- **Tool-use indicators**: when a persona invokes a tool, an animated indicator appears ("Sarah is checking UCDP…") for the duration; the tool result renders as a small inline card embedded in the contribution.
- **Moderator presence**: the Moderator is shown at the head of the table with a distinct visual treatment (no speech bubbles for orchestration utterances; instead, italicized chyron text under the table: "Round 2 — disagreement surfacing").
- **Transcript pane**: a parallel right-side panel showing the full transcript, scrollable, searchable, with the same citation pills.
- **Controls**: play/pause/skip, speed control (1x default, 2x for power users skimming), "Jump to disagreement", "Jump to synthesis".

### Accessibility

- A "transcript-only" view available for keyboard-first users and screen readers.
- All citation pills have keyboard navigation and ARIA labels.
- Animations respect `prefers-reduced-motion`.

### Files to create

- `src/components/boardroom/RoundTable.tsx` — the SVG round table.
- `src/components/boardroom/SpeechBubble.tsx`.
- `src/components/boardroom/CitationPill.tsx`.
- `src/components/boardroom/ToolUseIndicator.tsx`.
- `src/components/boardroom/ModeratorChyron.tsx`.
- `src/components/boardroom/TranscriptPane.tsx`.
- `src/components/boardroom/PlaybackControls.tsx`.
- `src/components/boardroom/PersonaAvatar.tsx` — geometric SVG avatars per persona.
- Visual snapshot tests for each component.

### Verification

- Visual snapshot suite green.
- Manual review of three recorded deliberations (one fast tactical, one deep policy, one deeply-disagreeing) confirms the experience feels like a real briefing.
- Lighthouse desktop ≥ 92 on the live page; ≥ 85 mobile.

---

## 12. Prompt Q8 — Custom-persona authoring (Pro feature)

### Persona
Power-user-experience engineer. Knows that the canonical ten personas are the floor, not the ceiling, and that letting users author their own personas is what turns PRAXIS into infrastructure.

### Outcome

A power-user UI at `/app/settings/personas` for creating and managing custom personas.

### Authoring flow

1. **Spec form**: structured form matching the PersonaSpec schema. Fields with helpful tooltips. Validation against Zod schema.
2. **Corpus upload**: drag-and-drop a folder of reference documents (PDFs, MDs, TXTs). Each document gets a citation form (auto-filled from document metadata where possible). License declaration required per document. Cap: 50 documents per custom persona, 50MB total.
3. **Tool affinity**: multi-select from the marketplace tools. Tooltip explains tool affinity vs. references.
4. **Voice profile**: simple form for typical utterance length, signature phrases (3-5), avoid phrases (3-5), confidence profile (cautious/measured/assertive).
5. **System prompt**: auto-generated from the spec; user can review and edit.
6. **Test deliberation**: one-click "Test this persona" runs a tiny single-persona deliberation against a sample question; user reviews voice match before saving.

### Persistence

Custom personas live at `users/{uid}/workspace/personas/{personaId}` (Firestore) + corpus blobs at `gs://praxis-user-uploads/{uid}/personas/{personaId}/`. Indexed in pgvector with namespace `persona:custom:{uid}:{personaId}:v{version}`.

### Sandboxing

- Custom personas can only invoke tools they declared in their affinity.
- Custom personas can only retrieve from their declared corpus.
- Custom persona system prompts are wrapped in a safety preamble that prevents prompt-injection escapes (the user's spec is *content*, not instruction).

### Files to create

- `src/app/app/settings/personas/page.tsx`, `[personaId]/page.tsx`, `new/page.tsx`.
- `src/components/personas/PersonaSpecForm.tsx`.
- `src/components/personas/CorpusUploader.tsx`.
- `src/components/personas/VoiceProfileEditor.tsx`.
- `src/components/personas/TestDeliberation.tsx`.
- `backend/routers/custom_personas.py`.
- `backend/services/custom_personas/spec_validator.py`.
- `backend/services/custom_personas/system_prompt_generator.py`.
- `backend/services/custom_personas/sandbox.py`.
- `e2e/settings/custom-persona-creation.spec.ts`.

### Hard rules

- Custom personas behind a workspace flag; defaults off; Giulio enables for selected tenants in v1.1.
- Cap: 10 custom personas per workspace in v1.1; revisit at v2.

---

## 13. Prompt Q9 — SAT integration, ADRs, final verification

### Outcome

Integration with Pack 15 SAT Toolkit; three new ADRs; full audit chain green.

### SAT integration patterns

- **Red Team round**: when configured, the Moderator inserts the Red Team Analyst persona (deployed as part of analyst_persona subagent) into the deliberation as the antagonist. Phase added: `red_team_challenge`.
- **ACH integration**: a deliberation can be configured to score its disagreements via ACH automatically. After the disagreement phase, an ACH matrix is constructed from the deliberation contributions and persisted alongside.
- **KAC integration**: the Synthesis Lead can be instructed to run KAC on the synthesis as its final step; KAC results append to the synthesis as an annex.
- **Premortem integration**: optional final round runs Premortem against the synthesis claims.

### ADRs

- `0026-agentic-boardroom-architecture.md` — explains the multi-persona deliberation model, the parameterized analyst_persona subagent vs. ten separate, the cost ceiling at moderator level.
- `0027-parameterized-analyst-persona-subagent.md` — explains why one subagent serves all personas, the corpus-namespacing pattern, the system-prompt-template pattern.
- `0028-persona-corpus-retrieval.md` — explains the per-persona pgvector namespace pattern, the canonical-vs-custom corpus distinction, the licensing discipline.

### Files to edit

- `PRAXIS_ARCHITECTURE.md` — §11 (tools/personas section new); §12 (subagents) update count from 5 to 7 (analyst_persona + moderator added); §18.4 (ADR catalog) add 0026-0028; §23 (changelog) entry.
- `PRAXIS_IMPROVEMENT_ROADMAP.md` — mark roadmap entry "Agentic Boardroom" as DONE.
- `CHANGELOG.md` — entry under [1.1.0].

### Final verification gate

```bash
# Foundations
npm run typecheck
npm run lint
npm run test
pytest backend/ -q
mypy backend/ --strict

# Pack-specific
npm run audit:persona-specs-valid       # all 10 canonical specs validate
npm run audit:persona-corpora-fresh     # canonical corpora ingested
npm run audit:subagent-deployment-fresh # analyst_persona + moderator deployed
npm run audit:subagent-eval-fresh       # all 7 subagents (4 base + red_team + analyst_persona + moderator)

pytest backend/agents/analyst_persona/eval/run_eval.py -q --target=staging
pytest backend/agents/moderator/eval/run_eval.py -q --target=staging
pytest backend/tests/test_persona_corpus_retrieval.py -q

# Architecture invariants unchanged
npm run audit:gate

# Persona suites — must remain green
npm run test:e2e:personas               # 10 consecutive

# Boardroom-specific E2E
npx playwright test e2e/workbench/boardroom-flow.spec.ts
npx playwright test e2e/workbench/boardroom-abort-and-cost-guard.spec.ts
npx playwright test e2e/settings/custom-persona-creation.spec.ts

# Live integration smoke
PRAXIS_ENV=staging python scripts/smoke-boardroom.py --personas=5 --rounds=4
```

All exit 0. PR mergeable.

---

## 14. Out of scope

- Real-time voice deliberation (personas speaking with TTS) — v2 if user demand justifies.
- Cross-case deliberations (a persona compares insights across cases) — v2; depends on cross-case search infrastructure.
- Deliberations with external human participants joining — v2; depends on multi-tenant team model.
- Adversarial prompt-injection hardening beyond the basic safety preamble — v2 with a dedicated security audit.
- Persona-to-persona direct messaging outside the moderated round — never; the Moderator is the structural authority.
- Auto-promotion of synthesis claims to Verdict layer — never; firewall invariant.

---

## 15. Closing note

The Agentic Boardroom is the pack that demonstrates what PRAXIS is uniquely capable of. Sixteen marketplace tools and four base subagents are useful infrastructure; ten deeply-specified analyst personas deliberating in a visible, citable, exportable, replayable conversation is a *product*. It is the thing that, when shown to a UN DPPA director or an FCDO desk officer or a senior mediator at HD Centre, produces the reaction "I want this for my team."

The architectural discipline this pack maintains is the same as every prior pack. Personas don't bypass the symbolic firewall. Synthesis claims are labeled and capped. The Moderator orchestrates but doesn't produce substance. Cost is bounded at the orchestration layer. Eval sets gate every persona's character. Corpora are licensed honestly. Custom personas are sandboxed. The bible's invariants hold.

The opportunity this pack opens is workspace-as-expertise. A user's workspace doesn't just accumulate cases and memos — it accumulates personas, with their corpora and tools, that compound the user's analytical leverage over time. The political officer who spent six months training a custom Sudan-region-expert persona on their personal corpus owns something durable, transferable, and irreplaceable. PRAXIS becomes their professional infrastructure.

Branch: `feature/agentic-boardroom`. Commit prefix `boardroom(<area>): <prompt-id> <description>` (e.g., `boardroom(persona): Q2 author political-analyst spec v1.0.0`, `boardroom(moderator): Q5 implement disagreement-surfacing node`). PR titled `Pack 16 — Agentic Boardroom`.

After merge, update §1 of the Master Charter to add row 16.

---

**File path**: `C:\Users\giuli\Downloads\PRAXIS_CODEX_16_AGENTIC_BOARDROOM.md`
