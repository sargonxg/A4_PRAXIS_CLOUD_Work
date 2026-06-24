# Agent Context Serialization Research for PRAXIS Capsules

Date: 2026-06-24  
Scope: Research brief for a follow-up implementation of PRAXIS capsule-to-agent context serialization. Documentation only.

## Executive Summary

1. PRAXIS should not serialize its capsule graph as only prose or only triples. The best target is a layered block: compact ontology/schema, query-specific salience ledger, incident-style local neighborhoods, explicit reasoning paths, temporal/causal chains, and source-backed claim cards. "Talk like a Graph" shows graph encoding choice can change graph-task performance by 4.8% to 61.8%, with incident encoding outperforming adjacency for neighbor/degree-style tasks because related facts are close together in the prompt: https://arxiv.org/abs/2310.04560 and https://openreview.net/pdf?id=IuXR1CCrSi.
2. Use GraphRAG's local/global split. Local entity questions need entity-centric neighborhoods and paths; global sensemaking needs community/narrative summaries. Microsoft GraphRAG explicitly separates Global Search, Local Search, DRIFT Search, and Basic Search: https://microsoft.github.io/graphrag/ and https://arxiv.org/abs/2404.16130.
3. Put the ontology in-context as executable constraints, not background explanation. Present node types, edge types, allowed head/tail primitive pairs, and validation warnings before the graph rows. Ontology-guided KGQA work shows ontology labels and reasoning paths improve generalization and multi-hop retrieval over heterogeneous KGs: https://arxiv.org/abs/2502.03992 and https://aclanthology.org/2025.acl-long.741/.
4. Encode provenance at the claim and edge level. Every decision-relevant row should carry source receipt IDs, confidence, confidence kind, review state, valid time, and "why selected." Citation research shows RAG answers are only practically verifiable when claims can be matched to relevant sources: https://aclanthology.org/2024.konvens-main.6.pdf and https://arxiv.org/pdf/2409.00729.
5. Select a subgraph before serialization. Use query/entity similarity, ontology type constraints, path relevance, source quality, confidence, recency, centrality/degree, and contradiction/negative-evidence flags. GraphReader and GraphRAG both show that graph navigation beats dumping long context: https://arxiv.org/abs/2406.14550 and https://github.com/microsoft/graphrag/blob/main/docs/query/local_search.md.
6. Treat time and causality as first-class context sections. Temporal KGQA work consistently rewrites questions into explicit time constraints, retrieves time-consistent facts, and reranks/filter by temporal relevance: https://aclanthology.org/2024.emnlp-main.394/ and https://openreview.net/forum?id=kwro5432AI.
7. The investor/user-facing "what the agent sees" view should look like an execution trace plus a grounding packet: retrieved graph rows, source receipts, omitted context, tool calls, confidence/review gates, and final claim-to-source mappings. OpenAI Agents SDK and LangSmith both position traces as the way to debug and monitor agent behavior: https://openai.github.io/openai-agents-python/tracing/ and https://docs.langchain.com/langsmith/observability.

## Local PRAXIS Findings

PRAXIS already has the right substrate:

- `ContextCapsule` has `ontologyBinding`, `embeddedGraph`, `temporality`, `causality`, `sourcing`, `retrieval`, `guardrails`, and source receipt IDs in nodes/edges (`src/types/context-capsule.ts`).
- `buildEnrichedTurnCapsule` resolves advisory memory through Firestore, Cognee, TrustGraph, and GraphLite, then returns `injectableContext.promptBlock` (`src/lib/knowledge/context-enrichment-adapter.ts`).
- `buildCapsuleRetrievalPlan` already appends a compact "Active Capsule Retrieval Plan" and describes GraphLite/TrustGraph/Capsule+ graph capture, but mostly as layer summaries rather than selected typed graph facts (`src/lib/ai/context-kernel.ts`).
- TrustGraph and GraphLite contracts already carry `score`, `sourceId`, `metadata`, `includeExplainability`, `graphCandidateIds`, and `explainabilityIds`, with `advisoryOnly: true` (`src/lib/knowledge/trustgraph-contract.ts`, `src/lib/knowledge/graphlite-contract.ts`).
- `npm run audit:ontology-system` and `npm run audit:ontology-mapping` both passed on 2026-06-24. The audit currently checks structure and markers: base OWL exists, ten backend specialization OWLs exist, capsule v2 markers exist, and the mapping flag routes through the same script (`scripts/audit-ontology-system.ts`).

Important gap: the current prompt block tells the model what layers exist, but not enough of the typed graph itself. It should serialize selected graph content in a deterministic, cited, type-constrained format.

## 1. Graph Serialization for LLM Reasoning

**Finding: encoding matters, and no single encoding wins every task.** "Talk like a Graph" is the strongest direct evidence. It benchmarked multiple graph-to-text encodings on graph reasoning tasks and found large variance by encoding, task, and graph structure. Its reported gains from choosing the right encoder range from 4.8% to 61.8%: https://arxiv.org/abs/2310.04560. The paper's concrete result for connected-node retrieval is especially relevant to PRAXIS: adjacency reached 19.8% accuracy while incident reached 53.8% because the incident format puts relevant neighbor facts close to the queried node: https://openreview.net/pdf?id=IuXR1CCrSi.

**Finding: global questions need summaries, not raw triples.** Microsoft GraphRAG extracts entities, relationships, and claims; clusters the graph; summarizes communities bottom-up; then uses those community summaries for corpus-wide questions. It reports improved comprehensiveness and diversity over naive RAG on 1M-token datasets: https://arxiv.org/abs/2404.16130. The official docs describe Global Search for holistic questions, Local Search for entity-specific questions, and DRIFT for flexible multi-hop traversal: https://microsoft.github.io/graphrag/.

**Finding: agentic graph exploration helps when context is too large.** GraphReader structures long text as a graph, has the agent plan, call graph-reading functions, read node content and neighbors, take notes, and reflect. It reports that a 4k-context GraphReader outperformed GPT-4-128k across 16k to 256k input lengths on LV-Eval and several single/multi-hop benchmarks: https://arxiv.org/abs/2406.14550 and https://aclanthology.org/2024.findings-emnlp.746/.

**Finding: triples are useful for one-hop facts, but task-aware verbalization can beat raw triples.** KAPING retrieves semantically relevant KG facts and prepends them to the prompt, outperforming zero-shot baselines by up to 48% on KGQA: https://arxiv.org/abs/2306.04136. KnowGPT argues that KG prompting suffers from huge search space, API cost, and prompt-engineering burden; it combines informative path extraction with context-aware prompt construction and reports 92.6% OpenBookQA accuracy: https://arxiv.org/abs/2312.06185 and https://proceedings.neurips.cc/paper_files/paper/2024/hash/0b8705a611ed1ce19cdb759031078705-Abstract-Conference.html.

**Finding: Graph-of-Thoughts is relevant to agent process, not source graph serialization.** GoT models generated thoughts as a graph with dependency edges and operations such as aggregation, refinement, scoring, and ranking. It improves some elaborate problem-solving tasks, including sorting quality by 62% over Tree-of-Thoughts while reducing cost by more than 31%: https://ojs.aaai.org/index.php/AAAI/article/view/29720. PRAXIS should borrow the "graph of operations" idea for agent trace display, but the capsule context should remain an evidence graph, not an exposed chain-of-thought transcript.

**Ranked recommendation for PRAXIS**

1. **Hybrid typed context packet**: schema + salience-ranked claim cards + incident neighborhoods + explicit paths + temporal/causal sequences. Best general choice.
2. **Incident/neighborhood encoding** for local multi-hop, actor/commitment, leverage, and "what connects X to Y" questions.
3. **Community/narrative summaries** for broad capsule-level synthesis, strategic themes, and investor demos.
4. **Path lists** for causal, provenance, and comparison tasks where the model must show how evidence connects.
5. **Raw triples** only as a compact fallback or machine-readable appendix; do not make them the only context.
6. **Free prose only** for brief human summaries, never as the sole agent substrate.

## 2. Ontology Grounding

Ontology grounding helps because it constrains the model's search space and reduces relation ambiguity. OntoSCPrompt integrates KG ontology into prompt learning and separates query-structure generation from KG-specific filling, targeting generalization across heterogeneous KG schemas: https://arxiv.org/abs/2502.03992. ORT uses ontology labels to construct reverse reasoning paths from the question purpose back to conditions, then uses those paths to guide KG retrieval; the authors report state-of-the-art performance on WebQSP and CWQ: https://aclanthology.org/2025.acl-long.741/.

For PRAXIS, the ontology must be presented as:

- **Core primitive contract**: Actor, Claim, Interest, Constraint, Leverage, Commitment, Event, Narrative.
- **Active ontology stack**: backend case specialization IDs plus frontend ontology IDs and work ontology ID.
- **Allowed edge schema**: relationship ID, label, allowed source primitive(s), allowed target primitive(s), direction, and short semantics.
- **Validation warnings**: missing primitive coverage, dangling ontology refs, unsupported edge types, stale/low-confidence nodes, and review-state constraints.
- **Vocabulary notes only when needed**: include short definitions for active node/edge types, not the full ontology library.

Best practice: put the ontology section before graph facts and instruct the agent to reject or downgrade facts that violate the schema unless explicitly labeled as a proposed extension. This matches PRAXIS's existing advisory/promotion design and the `candidateSuggestions` / `rejectedSuggestions` ontology stack fields in `capsule-service.ts`.

## 3. Provenance and Confidence

RAG and graph context reduce hallucination only when the answer can be traced to supporting evidence. RAGE argues citation quality is necessary for practical verification and evaluates whether generated answers identify relevant sources correctly: https://aclanthology.org/2024.konvens-main.6.pdf. ContextCite distinguishes corroborative citation from contributive attribution and estimates which context chunks caused a generation, making source influence auditable: https://arxiv.org/pdf/2409.00729. Multi-source attribution work shows long-form answers often require multiple citations per sentence and that single-source attribution models underperform in multi-source settings: https://aclanthology.org/2024.naacl-long.216.pdf.

Credibility must be explicit. CAG finds that RAG systems are vulnerable to flawed, outdated, and noisy retrieved context, and that models do not reliably use credibility annotations without training or careful design: https://aclanthology.org/2024.emnlp-main.1109.pdf. For PRAXIS, confidence should therefore be operational, not decorative:

- `confidence`: numeric 0-1, displayed and included in the prompt.
- `confidenceKind`: `EXTRACTED`, `INFERRED`, or `ASSESSED`.
- `reviewState`: canonical/proposed/advisory/reviewed/missing.
- `sourceReceiptIds`: mandatory for canonical and reviewed graph rows.
- `derivedFrom`: upstream element IDs for imported or inferred rows.
- `recordedAt`, `validFrom`, `validTo`, `asOf`: temporal scope.
- `contradictedBy` or `counterEvidenceRefs`: recommended new field for high-value claims.

Prompt rule: "Use high-confidence reviewed/canonical evidence first. Treat inferred/advisory rows as hypotheses. If sources conflict, report the conflict rather than averaging it away."

## 4. Salience and Subgraph Selection

Dumping the whole graph is worse than selecting the right graph. GraphRAG Local Search starts by identifying semantically related entities, then extracts related entities, relationships, covariates, community reports, and source text, then prioritizes and filters them into the context window: https://github.com/microsoft/graphrag/blob/main/docs/query/local_search.md. DRIFT adds iterative expansion from initial entities through relationships and communities for multi-hop questions: https://microsoft.github.io/graphrag/.

Recent GraphRAG surveys and systems converge on similar signals: entity linking, relation matching, BFS/DFS/shortest paths, LLM or semantic pruning, and top-k/threshold selection. A 2025 survey describes graph traversal as expanding from linked entities but warns about exponential noise, recommending adaptive filtering and relation relevance: https://arxiv.org/html/2501.00309v2. SubgraphRAG frames retrieval as selecting a size-constrained query subgraph that covers relevant evidence while fitting LLM context capacity: https://arxiv.org/pdf/2410.20724.

Recommended PRAXIS ranking signals:

1. Query semantic similarity to node label, claim text, edge label, and source excerpt.
2. Direct mention or alias match to user query entities.
3. Ontology fit: active case ontology and allowed primitive pair.
4. Path utility: lies on a short path between query entities, target outputs, or contested claims.
5. Source quality: trusted domain/tier, source recency, sourceReceipt count.
6. Evidence strength: confidence, confidenceKind, reviewState, contradiction count.
7. Temporal relevance: valid at query as-of date, close to requested date, not expired.
8. Graph structure: degree/betweenness/community rank, but capped so hubs do not dominate.
9. Task fit: causal questions prefer causal chains; comparison questions prefer matched actor/claim/interest rows; memo drafting prefers source-backed claims and commitments.
10. Novelty/coverage: diversify across ACO primitives to avoid all-Actor/all-Claim packets.

## 5. Temporal and Causal Structure

Temporal reasoning requires more than dates attached to facts. TimeR4 uses a retrieve-rewrite-retrieve-rerank pipeline: rewrite the question with explicit time constraints, retrieve semantically and temporally relevant facts, then rerank/filter by temporal constraints; it reports relative gains of 47.8% and 22.5% on two temporal KGQA datasets: https://aclanthology.org/2024.emnlp-main.394/. STAR-RAG argues that semantic retrieval alone neglects temporal constraints, causing time-inconsistent answers and inflated token use; it uses time-aligned graph propagation to prioritize time-consistent evidence: https://openreview.net/forum?id=kwro5432AI.

For PRAXIS, serialize time in two coordinated sections:

- **Temporal Frame**: capsule `asOf`, valid window, requested query time, stale/expired items, and date interpretation rules.
- **Temporal Facts and Chains**: ordered event/commitment/claim rows with `validFrom`, `validTo`, `recordedAt`, `sourceReceiptIds`, and `confidence`.

Causality should be serialized as paths, not isolated edges:

```text
Causal chain C1 [confidence=0.72, status=advisory]
E17 Event -> causes -> C42 Claim -> enables -> K9 Commitment
why: event reported before commitment; source receipts SR-12, SR-19
caveat: causal relation is assessed, not directly stated
```

Use PRAXIS `CapsuleCausalLink` fields directly: `cause`, `effect`, `relation`, `evidenceRefs`, `confidence`, and `caveat`. Add source-backed intermediary rows where possible. For causal claims, confidence should be capped unless evidence explicitly supports causation rather than mere temporal correlation.

## 6. Verification Surface: What the Agent Sees

The best "what the agent sees" surface combines consumer trust cues with developer-grade traceability:

- OpenAI Agents SDK tracing records LLM generations, tool calls, handoffs, guardrails, and custom events, and exposes traces for debugging and monitoring: https://openai.github.io/openai-agents-python/tracing/.
- LangSmith positions observability around end-to-end traces, RAG pipeline visibility, agent decisions, costs, latency, debugging failures, and hallucination diagnosis: https://docs.langchain.com/langsmith/observability and https://www.langchain.com/langsmith/observability.
- Microsoft Copilot describes "grounding" as connecting prompts to contextual, relevant data sources rather than relying only on general training data: https://support.microsoft.com/en-us/microsoft-365-copilot/what-information-does-copilot-use-to-answer-my-prompt.
- Perplexity's help center says answers include numbered citations linking to original sources so users can verify information: https://www.perplexity.ai/help-center/en/articles/10352895-how-does-perplexity-work.html.
- Microsoft Copilot Studio documentation says website knowledge sources retrieve relevant information and generate grounded, cited responses: https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/generative-ai-public-websites.

PRAXIS should expose:

1. **Context packet preview**: the exact serialized prompt block or a redacted equivalent.
2. **Grounding map**: answer claim -> graph row(s) -> source receipt(s).
3. **Selection rationale**: why each graph row entered the packet and what was omitted.
4. **Trace timeline**: retrieval, graph expansion, reranking, LLM generation, verifier/checker.
5. **Risk flags**: stale sources, advisory-only rows, inferred edges, conflicts, missing primitives.
6. **One-click source inspection**: receipt cards and excerpt highlights.
7. **Model-use boundaries**: which parts came from capsule context, external search, model knowledge, or tools.

This is compelling for users and investors because it makes the capsule visibly useful: it is not just a graph visualization, it is the agent's working memory and evidence contract.

## Proposed Serialization Spec

Name: `PRAXIS Agent Context Graph Packet v1`

Target integration: replace or augment the graph-related part of `injectableContext.promptBlock` emitted by `buildEnrichedTurnCapsule` / `buildCapsuleRetrievalPlan`.

### Section Structure

```text
## PRAXIS Agent Context Graph Packet v1
packet_id: capsule:{capsuleId}:turn:{turnId}:graph-packet-v1
capsule: {capsuleId} v{capsuleVersion}
as_of: {temporality.asOf || requestTime}
query: {userQuery}
budget: {selectedTokens}/{maxTokens}
canonical_store: Firestore ContextCapsules
advisory_policy: advisory graph rows require review before promotion

### 1. Task Lens
- user_intent: {classification}
- answer_mode: {ask|draft|review|scenario|agent_run}
- required_output: {capsule.output.format or route output contract}
- high_stakes_flags: {legal/security/financial/etc.}

### 2. Active Ontology Contract
core_primitives: Actor, Claim, Interest, Constraint, Leverage, Commitment, Event, Narrative
active_ontology_ids: {ontologyBinding.ontologyIds + activeOntologyStackId}
work_ontology_id: {starterSnapshot.ontologyOverlay.workOntologyId?}
allowed_node_types:
- {entityType} -> primitive={primitive}; description={short}
allowed_edge_types:
- {relationshipType}: {fromPrimitive[]} -> {toPrimitive[]}; semantics={short}
validators:
- {validatorId}: {severity}; {message}
extension_policy: off-schema rows are proposals, not facts

### 3. Salience Ledger
selection_policy: query_similarity + ontology_fit + path_utility + source_quality + confidence + recency + coverage
selected_counts: nodes={n}; edges={m}; claims={c}; sources={s}; omitted={o}
omitted_context:
- {id}: reason={low_relevance|stale|unsupported|duplicate|budget}

### 4. Source Receipt Index
[SR-1] title={title}; url={url?}; date={date?}; tier={tier?}; freshness={fresh|stale|unknown}; trust={0-1?}
excerpt: "{short excerpt}"

### 5. Claim Cards
[CL-1] text={claim}
type: {Claim subtype}; status={canonical|reviewed|proposed|advisory}; confidence={0-1}; kind={EXTRACTED|INFERRED|ASSESSED}
valid_time: {validFrom?}..{validTo?}; recorded_at={recordedAt?}
supports: [SR-1, SR-2]; contradicts: [SR-3?]
linked_nodes: [N-1, N-4]; linked_edges: [E-2]
use_rule: cite when used; qualify if confidence < 0.75 or status != canonical/reviewed

### 6. Incident Neighborhoods
[N-1] {label} :: {entityType}/{primitive}; status={reviewState}; confidence={confidence}; sources=[SR-1]
  OUT E-1 {relationshipType} -> N-2 {label}; conf={confidence}; sources=[SR-2]; time={validFrom?..validTo?}
  IN  E-4 {relationshipType} <- N-5 {label}; conf={confidence}; sources=[SR-4]

### 7. Reasoning Paths
[P-1] purpose={multi-hop|comparison|causal|provenance}
N-1 Actor -> E-1 controls -> N-2 Leverage -> E-2 pressures -> N-3 Actor
why_selected: shortest high-confidence path connecting query actor to target actor
sources: [SR-1, SR-2]

### 8. Temporal Frame
query_time: {requestTime}
capsule_as_of: {temporality.asOf}
valid_window: {temporality.validFrom}..{temporality.validUntil}
timeline:
- [T-1] {date} {kind}: {label}; nodes=[N-1]; sources=[SR-1]; confidence={confidence}
stale_or_expired:
- {id}: expired_at={date}; action=verify_before_use

### 9. Causal Chains
[C-1] relation={causes|enables|blocks|escalates|de-escalates|correlates}; confidence={confidence}
cause={nodeOrClaimId}; effect={nodeOrClaimId}; evidence=[SR-1, SR-2]
chain: N-4 Event -> causes -> CL-2 Claim -> enables -> N-7 Commitment
caveat: {caveat}

### 10. Agent Use Instructions
- Prefer canonical/reviewed, source-backed claims over advisory/inferred rows.
- Cite source receipt IDs for any decision-relevant claim.
- If evidence conflicts, state the conflict and cite both sides.
- Treat missing ontology primitives as evidence gaps.
- Do not promote advisory graph rows without a review-card path.
- Label outside knowledge separately from capsule context.
```

### Field Mapping

- `capsuleId`, `capsuleVersion`, `associatedCapsules`, `coreRefs`: `PraxisCapsule` and `TurnCapsule`.
- `sourceReceiptIds`: `ContextCapsule.embeddedGraph.nodes[].sourceReceiptIds`, `edges[].sourceReceiptIds`, retrieval repository source receipts, source cards.
- `ontologyBinding`: `domainId`, `taxonomyPath`, `ontologyIds`, `acoPrimitives`, `bindingRationale`.
- `embeddedGraph`: `nodes`, `edges`, `relationshipType`, `reviewState`, `confidence`, `confidenceKind`, `derivedFrom`, `generatedBy`, invalidation metadata.
- `temporality`: `timelineAnchors`, `asOf`, `validFrom`, `validUntil`.
- `causality`: `causalLinks[]`.
- `starterSnapshot.contextCaptureProfile`: allowed node/edge types, required provenance, review state, promotion gate.
- `TrustGraphRecallResponse` / `GraphLiteRecallResponse`: advisory hits, score, sourceId, metadata, graphCandidateIds, explainabilityIds.

### Serialization Rules

1. Deterministic order: source index, claim cards, neighborhoods, paths, temporal, causal.
2. Stable IDs: use existing IDs when possible; otherwise derive `N-{hash}`, `E-{hash}`, `CL-{hash}`, `SR-{hash}`.
3. Context budget tiers:
   - tiny: ontology + top 5 claim cards + top 3 paths.
   - standard: ontology + top 12 claims + top 20 nodes + top 30 edges + source index.
   - expanded: add community summaries and omitted-context ledger.
4. Confidence display:
   - `>=0.85`: strong if reviewed/canonical and source-backed.
   - `0.60-0.84`: usable with qualification.
   - `<0.60`: advisory only.
   - inferred/assessed causal edges cap at 0.75 unless directly source-stated and reviewed.
5. Omit rows that lack source receipts unless they are user-provided context, schema rows, or explicitly marked advisory/missing.
6. Include negative evidence and contradictions before low-value supporting duplicates.

## Ontology-Library Gaps to Fill

The audits pass, so these are capability gaps rather than broken checks.

1. **Add cross-cutting evidence edge types across every ontology**: `supports_claim`, `contradicts_claim`, `qualifies_claim`, `derived_from_source`, `reported_by`, `observed_in`. Some ontologies have equivalents, but a universal support/contradiction vocabulary would make citations and verification easier for agents.
2. **Add temporal relation edge types**: `precedes`, `follows`, `expires`, `renews`, `violates_after`, `valid_during`. PRAXIS has temporal fields, but agents need explicit graph paths for temporal reasoning.
3. **Add causal relation edge types aligned to `CapsuleCausalRelation`**: `causes`, `enables`, `blocks`, `escalates`, `de_escalates`, `correlates`, with confidence caps and evidence requirements.
4. **Add uncertainty/contestation nodes or edge attributes**: `DisputedClaim`, `CompetingNarrative`, `EvidenceGap`, `Assumption`, `UnknownActor`. Agents reason better when gaps are represented as objects, not prose warnings.
5. **Normalize backend ten case specializations and frontend nine ontology IDs**: backend docs list active conflict, frozen conflict, negotiation/mediation, counter-terrorism, humanitarian crisis, political transition, sanctions/economic statecraft, strategic competition, cyber/hybrid, forced displacement; frontend `OntologyId` is conflict, mediation, governance, narrative, human-rights, economic, humanitarian, legal, security. The build task should document/encode the mapping explicitly.
6. **Add case-specific path templates**:
   - conflict/security: Actor -> Leverage -> Actor; Event -> violates -> Commitment; Claim/Event -> escalates -> Event.
   - mediation: Actor -> holds_position -> Claim -> reveals_interest -> Interest -> enables_package -> Commitment.
   - economic/sanctions: Actor -> owns_or_controls -> Actor; Event -> triggers_instrument -> Constraint; Constraint -> requires_compliance -> Commitment.
   - narrative: Actor/Leverage -> amplifies -> Narrative/Claim; Claim -> contests -> Claim; Narrative -> targets_audience -> Interest.
7. **Extend validators to check source/time/causal readiness**, not only primitive presence. Examples: "causal edge needs evidenceRefs," "event node needs valid time when used in temporal chain," "claim card used in answer must have at least one receipt or explicit uncertainty."

## Risks and Open Questions

- **Token pressure**: incident neighborhoods can grow quickly. The implementation needs hard budgets and omitted-context receipts.
- **False precision**: numeric confidence can look more scientific than it is. The UI and prompt should pair it with `confidenceKind` and review state.
- **Source quality is domain-sensitive**: a generic trust score may be misleading for policy, conflict, sanctions, or humanitarian contexts.
- **Causal overclaiming**: agents may overread `correlates` or temporally adjacent events as causation. Keep causal caveats mandatory.
- **Schema drift**: backend OWL case types and frontend ontology IDs must be kept in sync or the model will see inconsistent ontology names.
- **Citation faithfulness**: self-generated citations are not enough. The follow-up build should preserve claim-to-source mappings and add post-generation citation checks where practical.
- **Investor demo risk**: a beautiful graph view is not the same as an agent-usable packet. The proof surface must show exact selected context, not just a visualization.

## Top Recommendations

1. Implement `PRAXIS Agent Context Graph Packet v1` as an additional block inside `injectableContext.promptBlock`.
2. Use incident neighborhoods and explicit paths for local/multi-hop reasoning; use community summaries for global capsule synthesis.
3. Put the active ontology contract before graph facts and enforce allowed node/edge primitive pairs.
4. Make every claim/edge source-backed, confidence-labeled, time-scoped, and review-state-aware.
5. Add a salience selector with query similarity, ontology fit, path utility, source quality, confidence, recency, centrality, and coverage.
6. Serialize temporal and causal chains as ordered paths with caveats, not as flat fact lists.
7. Build a "what the agent saw" surface that shows selected context, omitted context, traces, source receipts, and answer claim mappings.
