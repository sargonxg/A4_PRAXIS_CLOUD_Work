# Context Engineering Theory and Ontology Blueprint for PRAXIS

Date: 2026-06-24

Scope: This document extends `docs/research/2026-06-24-agent-context-serialization-research.md`. The prior document defined the PRAXIS Agent Context Graph Packet and a first implementation path. This document goes deeper into the research theory behind context engineering, graph-grounded reasoning, ontology design, provenance, and knowledge-product generation, then translates that evidence into a PRAXIS build blueprint.

Status: Research and architecture proposal. This file does not change runtime behavior.

## Executive Synthesis

The strongest conclusion across the literature is that "more context" is not the same as "better context." Long-context models degrade when relevant evidence is buried, polluted by distractors, or serialized without a reasoning structure. Liu et al. show the classic "lost in the middle" effect: models use information at the beginning and end of context more reliably than information in the middle ([arXiv:2307.03172](https://arxiv.org/abs/2307.03172)). Recent work on long-context degradation finds that even when retrieval is perfect, longer inputs can reduce performance substantially, and a retrieve-then-recite-then-answer pattern can outperform dumping long context into the model ([EMNLP Findings 2025](https://aclanthology.org/2025.findings-emnlp.1264.pdf)). Chroma's engineering report calls this broader behavior "context rot" and finds reliability declines across many models as context grows, with presentation and focused prompting materially affecting outcomes ([Chroma research report](https://research.trychroma.com/context-rot)).

Context engineering should therefore be treated as a control discipline over an agent's finite attention budget. Anthropic defines it as strategies for curating and maintaining the optimal token set during inference, emphasizing compaction, structured note-taking, progressive disclosure, and sub-agent isolation ([Anthropic Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)). LangChain frames the operational loop as four actions: write context, select context, compress context, and isolate context ([LangChain](https://www.langchain.com/blog/context-engineering-for-agents)). These are useful engineering categories, but PRAXIS should make them stricter: context must be selected, ordered, attributed, validated, and versioned.

For agentic policy work, ontology-grounded graphs are the missing control surface. GraphRAG and KGQA research suggests graphs help most when they constrain retrieval to entity neighborhoods, community summaries, temporal/causal paths, or ontology-valid multi-hop chains rather than acting as a generic blob of extra facts ([GraphRAG survey](https://arxiv.org/html/2408.08921v2), [LLMs meet KGs for QA survey](https://aclanthology.org/2025.emnlp-main.1249.pdf)). Microsoft GraphRAG's public documentation separates global search over community summaries from local search over entity neighborhoods and DRIFT search that mixes community and local evidence ([Microsoft GraphRAG docs](https://microsoft.github.io/graphrag/query/overview/)). GraphReader shows that an agent can structure long text as a graph and outperform much longer direct context on long-context and multi-hop benchmarks ([arXiv:2406.14550](https://arxiv.org/abs/2406.14550)).

The PRAXIS design implication is direct: capsules should not merely store context; they should expose a bounded, source-backed, ontology-valid reasoning substrate. The embedded graph should become an "agent affordance graph" that tells the agent which nodes, paths, temporal constraints, causal hypotheses, contradictions, and source receipts it is allowed to rely on. The Agent Context Packet should serialize not just facts, but also the rules for using them.

## Seven Principles

1. Context is a scarce attention budget, not a storage layer. Larger windows still suffer from position bias, distractor sensitivity, and context pollution ([Lost in the Middle](https://arxiv.org/abs/2307.03172), [Context Length Alone Hurts](https://aclanthology.org/2025.findings-emnlp.1264.pdf)).

2. Selection is a reasoning act. Retrieval should be optimized for task relevance, source support, ontology fit, temporal applicability, contradiction status, and path utility, not only semantic similarity ([Retrieval meets Long Context LLMs](https://arxiv.org/html/2310.03025v2), [GraphRAG survey](https://arxiv.org/html/2408.08921v2)).

3. Ordering is part of semantics. Evidence placement, source-first layouts, and beginning/end anchoring matter because models do not attend uniformly across long prompts ([Lost in the Middle](https://arxiv.org/abs/2307.03172)).

4. Compression must preserve provenance. Query-aware compression can reduce prompt length while preserving task performance, but compression that drops citation links or contradiction cues makes downstream faithfulness unverifiable ([Prompt Compression survey](https://arxiv.org/html/2407.08892)).

5. Graphs help when they constrain multi-hop reasoning. Entity neighborhoods, ontology-valid paths, temporal chains, causal hypotheses, and community summaries are useful because they shape traversal and inference; noisy or over-expanded graphs can degrade results ([GraphReader](https://arxiv.org/abs/2406.14550), [GraphRAG analysis](https://www.vldb.org/pvldb/vol18/p5623-zhou.pdf)).

6. Ontology is an agent contract. A graph schema should tell agents what kinds of things exist, what relations are admissible, what evidence is required, and what inferences are only advisory. OWL/RDF and SHACL provide portable semantic and validation standards ([OWL 2 overview](https://www.w3.org/TR/owl2-overview/), [RDF 1.1 concepts](https://www.w3.org/TR/rdf11-concepts/), [SHACL](https://www.w3.org/TR/shacl/)); property graphs provide a practical operational projection for traversal and packet serialization.

7. Faithfulness is a postcondition, not a style preference. Correct answers can still have unfaithful citations; generated claims must be checked against source receipts, contradiction ledgers, and ontology constraints before being presented as capsule-grounded analysis ([Correctness is not Faithfulness](https://staff.fnwi.uva.nl/m.derijke/wp-content/papercite-data/pdf/wallat-2025-correctness.pdf), [AIS](https://aclanthology.org/2023.cl-4.2.pdf), [MIRAGE](https://aclanthology.org/2024.emnlp-main.347.pdf)).

## 1. Context Engineering as a Discipline

### Definition

The practical definition for PRAXIS is:

> Context engineering is the design, selection, compression, ordering, isolation, validation, and governance of the information an agent is allowed to use at inference time.

This is broader than prompt engineering. Prompt engineering writes instructions. Context engineering controls the entire inference substrate: instructions, memory, retrieved evidence, graph neighborhoods, tools, schemas, scratchpads, intermediate artifacts, and output contracts. Anthropic's engineering guidance emphasizes maintaining an optimal set of tokens through compaction, progressive disclosure, structured notes, and sub-agent isolation ([Anthropic Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)). LangChain's write/select/compress/isolate taxonomy is a useful operational vocabulary for agent systems ([LangChain](https://www.langchain.com/blog/context-engineering-for-agents)).

For PRAXIS, the discipline should be stricter than either general framework:

- Write: persist capsule facts, source receipts, claim cards, graph proposals, rejected inferences, and human review state.
- Select: choose the smallest sufficient packet for the current task using query, role, source, temporal, causal, ontology, and contradiction signals.
- Compress: summarize or abstract only when provenance, uncertainty, and contradiction state survive the compression.
- Order: serialize by use: task lens, ontology contract, source index, claims, graph neighborhoods, paths, temporal/causal constraints, output rules.
- Isolate: separate canonical capsule context from advisory graph memory, unreviewed proposals, external web context, scratchpads, and generated drafts.
- Verify: extract generated claims and prove they are supported, contradicted, stale, inferred, or outside capsule scope.
- Govern: require review-card promotion before advisory memory or graph facts become canonical.

### Long-Context Degradation and "Context Rot"

The research base now strongly warns against treating long context as a substitute for retrieval and packet design.

Liu et al. found that language models perform best when relevant information appears at the beginning or end of context and worse when it appears in the middle ([arXiv:2307.03172](https://arxiv.org/abs/2307.03172)). This matters for PRAXIS because capsule packets can easily bury decisive source receipts inside long background sections.

The "Context Length Alone Hurts" study reports that performance can degrade even when a prompt contains the correct evidence, and proposes an evidence-recitation step that forces the model to surface the relevant facts before solving ([EMNLP Findings 2025](https://aclanthology.org/2025.findings-emnlp.1264.pdf)). This directly supports a PRAXIS two-stage answer mode: first bind relevant `SR-*` and `CL-*` identifiers, then generate.

"Retrieval meets Long Context LLMs" finds that retrieval-augmented long-context use is often better than long-context alone, but adding more retrieved chunks can hurt; top-5 or top-10 retrieval can outperform top-20 in some settings ([arXiv:2310.03025](https://arxiv.org/html/2310.03025v2)). The PRAXIS implication is that `expanded` context packets should not simply include every plausible receipt. Expansion should add missing dimensions, not more semantically similar text.

Prompt-compression surveys find that extractive compression is often surprisingly strong and that query-aware compression tends to outperform query-agnostic compression ([arXiv:2407.08892](https://arxiv.org/html/2407.08892)). For PRAXIS, extractive compression is safer for sourceability because it can preserve source spans and quote anchors; abstractive compression should be marked as derived and linked back to receipts.

The "context rot" term is mostly an engineering label rather than a settled academic construct. Chroma's report is still useful because it tests many models and reinforces a practical point: long-context reliability is not guaranteed by nominal context window size ([Chroma research report](https://research.trychroma.com/context-rot)). PRAXIS should cite this as engineering evidence, not as peer-reviewed proof.

### Retrieval Versus Long Context

The best current answer is hybrid:

- Use retrieval to select the most relevant and diverse evidence.
- Use long context for local completeness only after selection.
- Use graphs to retrieve relationships and paths that vector similarity misses.
- Use explicit ordering and recitation to mitigate position bias.
- Use verification to catch unsupported synthesis.

This aligns with GraphReader's result that graph-structured exploration can beat direct long-context reading for long documents ([arXiv:2406.14550](https://arxiv.org/abs/2406.14550)) and with GraphRAG patterns that separate global community search from local entity-neighborhood search ([Microsoft GraphRAG docs](https://microsoft.github.io/graphrag/query/overview/)).

## 2. Knowledge-Graph-Grounded Reasoning

### What GraphRAG Adds

GraphRAG is not one algorithm. It is a family of techniques that use graph structure before or during retrieval and generation. Common steps are:

1. Extract entities, events, claims, relations, communities, and source links.
2. Build a graph or graph projection.
3. Select relevant nodes, edges, paths, or communities.
4. Serialize the selected graph evidence into a prompt or agent state.
5. Generate with source constraints and, ideally, verify the generated claims.

Surveys describe GraphRAG as a response to vector RAG's weakness on multi-hop, relational, and globally summarized questions ([Graph Retrieval-Augmented Generation survey](https://arxiv.org/html/2408.08921v2), [Graph-based RAG survey](https://arxiv.org/pdf/2504.10499)). Microsoft GraphRAG's implementation distinguishes local search over entity neighborhoods, global search over community summaries, DRIFT search that combines local and community evidence, and basic vector search ([Microsoft GraphRAG docs](https://microsoft.github.io/graphrag/query/overview/)).

For PRAXIS, the useful pattern is not "add a graph backend." The useful pattern is "make graph retrieval explain which relational evidence was selected and why."

### Evidence of Improvement

The evidence is strongest for tasks that require multi-hop traversal, entity disambiguation, long-document organization, or global summarization.

GraphReader converts long text into a graph of nodes and uses an agent to explore neighbors, then answer from gathered evidence. It reports strong performance on long-context and multi-hop benchmarks while using a 4k context model ([arXiv:2406.14550](https://arxiv.org/abs/2406.14550)). The result supports PRAXIS's decision to serialize selected graph neighborhoods rather than raw large corpora.

KGQA surveys show that LLMs can improve knowledge graph question answering through semantic parsing, retrieval, reasoning-path generation, and answer verbalization, but that performance depends heavily on entity linking, relation matching, and graph completeness ([LLMs meet KGs for QA survey](https://aclanthology.org/2025.emnlp-main.1249.pdf)). This is a warning for PRAXIS: ontology and entity hygiene are not optional engineering details.

VLDB's in-depth GraphRAG analysis is especially important because it evaluates design tradeoffs rather than only proposing a new method. Its broad lesson is that graph construction, retrieval granularity, and query type strongly affect performance ([PVLDB 2025](https://www.vldb.org/pvldb/vol18/p5623-zhou.pdf)). PRAXIS should therefore evaluate graph context by task class: direct answer, source gap analysis, briefing, negotiation memo, contradiction review, and handover.

### Temporal and Causal Graphs

Policy work is temporal and causal by default. A static entity graph cannot answer questions like "what changed after the ceasefire condition," "which commitment expires first," or "which leverage point plausibly caused the actor's shift."

Temporal KGQA work such as TimeR4 emphasizes explicit temporal reasoning and retrieval for time-sensitive questions ([EMNLP 2024](https://aclanthology.org/2024.emnlp-main.394/)). STAR-RAG frames temporal reasoning as a retrieval-augmented task that should respect time-aware evidence rather than treating all facts as timeless ([OpenReview](https://openreview.net/forum?id=kwro5432AI)).

CausalRAG argues for causal retrieval when answering "why" or intervention-style questions, because correlation-only context is insufficient for causal claims ([ACL Findings 2025](https://aclanthology.org/2025.findings-acl.1165.pdf)). For PRAXIS, this supports the existing caution in `src/lib/ontology/universal.ts`: causal edges should require evidence references and should carry confidence and caveats.

### Failure Modes

Graph-grounded reasoning fails in predictable ways:

- Entity resolution errors create false joins.
- Relation extraction errors create false paths.
- Hub nodes dominate retrieval and hide smaller but decisive evidence.
- Community summaries become too abstract and drop source-level nuance.
- Graphs overfit the extraction ontology and miss off-schema events.
- Causal edges are inferred from correlation or narrative proximity.
- Temporal facts become stale when validity intervals are missing.
- Generated answers cite graph summaries instead of underlying sources.
- Agents treat advisory graph proposals as canonical facts.

PRAXIS already has partial defenses: source receipt IDs, review state, advisory labels, temporal and causal fields, and a read contract. The missing piece is a graph-aware verifier that checks whether the generated knowledge product actually respected those defenses.

## 3. Ontology Design for Agents

### Upper Ontology Versus Domain Ontology

An upper ontology provides general categories such as actor, event, claim, relation, time, source, and evidence. A domain ontology defines specialized classes and relations for a particular field. In PRAXIS, the ACO primitives form a practical mid-level ontology for policy analysis:

- Actor
- Claim
- Interest
- Constraint
- Leverage
- Commitment
- Event
- Narrative

This is not a full philosophical upper ontology. It is better understood as an agent-operational ontology: the set of concepts an agent needs to structure policy reasoning, evidence review, and knowledge-product generation.

Domain ontologies should specialize these primitives:

| Domain | Extensions |
| --- | --- |
| Conflict and security | belligerent, mediator, armed group, capability, escalation ladder, ceasefire term, violation, de-escalation channel |
| Mediation and negotiation | BATNA, red line, concession, confidence-building measure, guarantor, sequencing condition, verification mechanism |
| Sanctions and economic statecraft | sanctioned entity, license, exemption, asset freeze, supply dependency, evasion route, market exposure |
| Humanitarian and protection | affected population, protected site, access constraint, displacement route, aid corridor, protection risk |
| Governance and legal compliance | jurisdiction, authority, mandate, obligation, deadline, noncompliance, remedy, due-process constraint |
| Narrative and information operations | frame, audience, channel, amplification network, counter-narrative, source ecosystem, credibility cue |
| Cyber and hybrid operations | target, infrastructure dependency, exploit claim, intrusion set, campaign, mitigation, attribution confidence |

The research reason for domain ontology is that LLM grounding improves when the model's retrieval and generation space is constrained by typed entities and typed relations. KGQA surveys repeatedly find that entity linking and relation selection are central bottlenecks ([LLMs meet KGs for QA survey](https://aclanthology.org/2025.emnlp-main.1249.pdf)). Emerging work on ontology-constrained agent reasoning reports better role consistency and metric accuracy in enterprise workflows, but it should be treated as preprint evidence until independently replicated ([arXiv:2604.00555](https://arxiv.org/html/2604.00555v2)).

### OWL/RDF Versus Property Graph

PRAXIS should use a hybrid model.

OWL/RDF is strong for portable semantics, class hierarchy, formal inference, and interoperability. W3C RDF defines a web-standard data model for statements about resources ([RDF 1.1 concepts](https://www.w3.org/TR/rdf11-concepts/)). OWL 2 adds formal ontology expressivity, including classes, properties, individuals, and entailment regimes ([OWL 2 overview](https://www.w3.org/TR/owl2-overview/)). SHACL provides a standard way to validate RDF graphs against shapes and constraints ([SHACL](https://www.w3.org/TR/shacl/)).

Property graphs are strong for operational traversal, application ergonomics, and LLM packet serialization. Nodes and edges with properties are easier to project into an Agent Context Packet, easier to score for salience, and easier to display in the cockpit.

The blueprint is therefore:

- Keep the capsule embedded graph as the operational property-graph projection.
- Maintain a machine-readable ontology contract that can be exported to RDF/OWL where useful.
- Validate capsule graphs with SHACL-like shapes or TypeScript validators before packet generation.
- Serialize only the operational slice the agent needs, not the full ontology.

### Expressivity and LLM Grounding

Ontology expressivity has a tradeoff. Rich OWL axioms can encode subtle constraints, but dumping them into a prompt is usually counterproductive. Low-expressivity typed paths are more useful at inference time:

- `Actor -> makes_claim -> Claim`
- `Claim -> supported_by -> SourceReceipt`
- `Claim -> contradicts -> Claim`
- `Actor -> has_interest -> Interest`
- `Constraint -> blocks -> Commitment`
- `Leverage -> pressures -> Actor`
- `Event -> violates_after -> Commitment`
- `Narrative -> amplifies -> Claim`

The richer ontology should validate the graph before inference. The packet should expose only the agent-facing affordances: admissible node types, relation types, path templates, source requirements, closure assumptions, and forbidden inferences.

### ACO Primitive Design Patterns

#### Actor

Actor nodes should include aliases, role, jurisdiction, affiliation, authority basis, capability, legitimacy signal, and confidence. Edges should separate formal authority from practical influence. For example, `holds_office`, `commands_force`, `funds_actor`, `mediates_between`, `sanctions`, and `is_proxy_for` should not collapse into a generic `related_to` relation.

#### Claim

Claim nodes should be atomic. Each claim needs polarity, modality, scope, time validity, source receipts, support status, contradiction status, and review state. The AIS literature defines attribution as whether output statements are supported by cited sources, not merely whether the answer is factually plausible ([AIS](https://aclanthology.org/2023.cl-4.2.pdf)). Atomic claim nodes make that test possible.

#### Interest

Interest nodes should distinguish stated interests, revealed interests, inferred interests, red lines, and preference intensity. Inferred interests should never be canonical without evidence and review. The model should be allowed to say "the capsule suggests an inferred interest" only when that status is explicit.

#### Constraint

Constraint nodes should classify legal, political, military, economic, logistical, informational, humanitarian, temporal, and institutional constraints. Each constraint should include the actor or action constrained, the time window, the source, and whether the constraint is binding, claimed, contested, or inferred.

#### Leverage

Leverage nodes should encode the mechanism: coercion, incentive, dependency, access, legitimacy, information, financial exposure, security guarantee, legal authority, or agenda control. A leverage relation should include directionality and plausible pathway. This prevents shallow statements like "X has leverage over Y" without explaining mechanism or evidence.

#### Commitment

Commitment nodes should encode promisor, promisee, condition, deadline, verification mechanism, compliance status, violation evidence, and remedy. Temporal edges such as `expires`, `renews`, `violates_after`, and `valid_during` are essential. PRAXIS already has universal temporal relation names in `src/lib/ontology/universal.ts`; the next step is domain-specific validation.

#### Event

Event nodes need time, place, participants, trigger, source receipts, uncertainty, and downstream effects. Event extraction should distinguish reported event, confirmed event, alleged event, and forecast event.

#### Narrative

Narrative nodes should capture frame, audience, channel, sponsor, amplification pattern, counter-narrative, and linked claims. Narrative should not be treated as "soft context"; in policy work it often explains actor incentives and public constraints.

## 4. Evidence, Provenance, and Faithfulness

### Attribution Is Not Just Citation

Citation correctness and answer correctness are separable. A model may produce a correct answer with irrelevant citations, or a wrong answer with citations that look plausible. "Correctness is not Faithfulness in RAG Attributions" makes this point directly and argues that attribution should be evaluated separately from answer correctness ([paper PDF](https://staff.fnwi.uva.nl/m.derijke/wp-content/papercite-data/pdf/wallat-2025-correctness.pdf)).

AIS formalizes attribution as whether generated statements are supported by source material ([Computational Linguistics 2023](https://aclanthology.org/2023.cl-4.2.pdf)). MIRAGE evaluates internal attribution in multi-document settings and is useful because policy capsules usually combine multiple sources ([EMNLP 2024](https://aclanthology.org/2024.emnlp-main.347.pdf)). Multi-source attribution research shows that attributing synthesis across sources is harder than citing a single passage ([NAACL 2024](https://aclanthology.org/2024.naacl-long.216.pdf)).

ContextCite distinguishes contributive context from merely corroborative context and is relevant for PRAXIS because a citation should prove the specific claim, not just be generally related ([arXiv:2409.00729](https://arxiv.org/pdf/2409.00729)). Error-tolerant attribution work is also relevant because source documents may contain extraction errors, OCR noise, or partially incorrect statements ([EMNLP Findings 2025](https://aclanthology.org/2025.findings-emnlp.339.pdf)).

### Credibility-Aware and Contradiction-Aware RAG

Credibility-aware RAG requires more than ranking sources by semantic relevance. It should consider source type, primary versus secondary status, publication date, chain of custody, source independence, known bias, extraction confidence, and whether the source is reporting, alleging, analyzing, or advocating.

Contradiction handling is also central. A capsule should distinguish:

- supported claim
- weakly supported claim
- contradicted claim
- disputed claim
- stale claim
- inferred claim
- source gap
- off-capsule claim

The current PRAXIS capsule model already contains many of these categories. The research implication is to make them operational in generation: disputed and contradicted claims should be carried into the packet and the verifier, not merely stored as metadata.

### Confidence Calibration

Confidence should not be a single model self-score. It should combine:

- retrieval confidence
- extraction confidence
- source credibility
- source agreement
- temporal freshness
- ontology validity
- causal evidence strength
- contradiction status
- verifier entailment result

RAG hallucination surveys emphasize that hallucination reduction depends on retrieval quality, evidence grounding, generation constraints, and verification, not a single intervention ([ACM Computing Surveys](https://dl.acm.org/doi/10.1145/3703155)). PRAXIS should therefore expose confidence as a calibrated composite with visible reasons.

## 5. Knowledge-Product Generation

### Grounded Output Contracts

Briefings, memos, and handovers should be generated under a strict output contract:

1. Every atomic factual claim must bind to one or more `SR-*`, `CL-*`, or graph path identifiers.
2. Every inference must be labeled as inference and linked to the evidence path that supports it.
3. Every causal claim must cite a causal edge or explicitly state that the causal relation is hypothesized.
4. Every temporal claim must cite a date, interval, or freshness status.
5. Every contradiction must be surfaced rather than averaged away.
6. Every off-capsule assertion must be labeled as outside capsule scope.
7. Unsupported claims must be repaired, downgraded, or removed.

This is consistent with schema-constrained generation research such as RECLAIM, which uses constrained decoding and sentence-level citation structures to improve citation behavior ([NAACL Findings 2025](https://aclanthology.org/2025.findings-naacl.55.pdf)). Emerging work on executable schema contracts argues that generation systems should be bound by verifiable schemas, though this area is still early ([arXiv:2606.05415](https://arxiv.org/html/2606.05415v1)).

### Verification and Critique Loop

The PRAXIS generation loop should be:

1. Build packet.
2. Generate draft.
3. Extract atomic claims from the draft.
4. Map each claim to source receipts, claim cards, graph nodes, graph edges, and reasoning paths.
5. Run support classification: supported, partially supported, contradicted, neutral, outside capsule, or unverifiable.
6. Run ontology validation: node/edge types, path templates, temporal validity, causal caveats, commitment status.
7. Run contradiction review against capsule disputed and contradicted claims.
8. Repair or refuse unsupported sections.
9. Emit a proof object with cited evidence, failed checks, confidence rationale, and omitted-context warnings.

VeriCite-style citation verification is relevant because it evaluates whether cited evidence actually supports generated claims ([arXiv:2510.11394](https://arxiv.org/html/2510.11394)). This should be treated as a design inspiration unless PRAXIS adopts a specific verifier implementation.

## 6. Competitive and Landscape Notes

This section cites public product documentation and marketing pages. Treat product capability claims as vendor-positioning evidence unless independently benchmarked.

### Palantir AIP and Ontology

Palantir publicly frames the Ontology as an operational layer that maps data sources into objects, properties, links, actions, and functions ([Palantir Ontology overview](https://palantir.com/docs/foundry/ontology/overview/)). AIP documentation describes connecting AI applications, agents, and workflows to enterprise context through that Ontology ([AIP overview](https://palantir.com/docs/foundry/aip/overview/), [AIP architecture](https://palantir.com/docs/foundry/architecture-center/aip-architecture/)). The inference for PRAXIS is that leading operational-intelligence systems converge on an ontology-as-action-surface model, not a document-chat model.

### Recorded Future

Recorded Future describes an Intelligence Graph and AI outputs that provide referenced answers and top sources ([Recorded Future AI](https://www.recordedfuture.com/platform/ai), [Recorded Future AI launch blog](https://www.recordedfuture.com/blog/introducing-recorded-future-ai)). The citable claim is that their product positions attribution and graph-backed intelligence as core. The inference is that PRAXIS should compete on capsule transparency, policy ontology, and reviewable source-to-claim proof rather than generic chat.

### Dataminr

Dataminr positions its platform around real-time external data, event detection, and AI agents that provide instant context for threat intelligence teams ([Dataminr AI platform](https://www.dataminr.com/ai-platform/), [Dataminr Intel Agents](https://www.dataminr.com/resources/blog/dataminr-intel-agents-deliver-instant-context-for-cyber-threat-intelligence-teams/)). The relevant pattern is entity/event context assembled from many live sources. PRAXIS should borrow the event-centric context pattern but remain stricter about source receipts, review states, and capsule governance.

### Primer

Primer's knowledge-discovery materials emphasize searching and structuring large document collections, including access controls down to passages in enterprise contexts ([Primer Knowledge Discovery](https://primer.ai/solutions/knowledge-discovery)). The relevant pattern is passage-level governance. PRAXIS should treat source-span permissions and provenance as first-class, especially if capsules ingest private documents.

### Landscape Inference

Across these products and GraphRAG engineering stacks, the visible convergence is:

- operational ontology
- graph-backed context
- source-level attribution
- entity/event intelligence
- agent workflows on top of curated context
- observability and human review

PRAXIS's differentiated path should be policy-specific: ACO primitives, capsule versioning, sourceability ledgers, review-card promotion, and knowledge products that can prove they stayed inside the capsule.

## PRAXIS Blueprint

### Current Substrate

The repo already has a strong foundation:

- `src/types/context-capsule.ts` defines capsule grounding, temporality, causality, ontology binding, embedded graph, confidence kinds, review state, and source receipt links.
- `src/lib/context/agent-context-salience.ts` scores and selects claims, sources, graph nodes, graph edges, timeline anchors, causal links, and omitted-context reasons.
- `src/lib/context/agent-context-packet.ts` renders the Agent Context Graph Packet with ontology contract, salience ledger, source index, claim cards, incident neighborhoods, reasoning paths, temporal frame, causal chains, and agent instructions.
- `src/lib/ai/context-kernel.ts` appends the Agent Context Packet to prompt blocks and keeps capsule and advisory graph layers separated.
- `src/lib/context/capsule-v3.ts` already models source spine, claim ledger, reasoning scaffold, memory posture, governance, output contracts, and evaluation.
- `src/lib/ontology/universal.ts` already defines universal evidence, temporal, causal, and contestation relations with readiness validation.
- `src/lib/agent-runtime/capsule-read-receipt.ts` produces a read contract that marks advisory graph memory, human gates, source gaps, and stop conditions.
- `src/lib/agent-runtime/workflow-plan.ts` already distinguishes direct answers, research briefs, memo output, gap fill, multi-agent review, handover, and capsule governance.

The missing capability is not another context field. The missing capability is an end-to-end grounding verifier that turns graph selection into enforceable output constraints.

### Target Architecture: Agent Affordance Graph

Add a capsule-level `CapsuleGraphAffordanceProfile`.

Purpose: Tell the agent how the embedded graph may be used.

Fields:

- `ontologyVersion`: active ontology pack versions.
- `graphProjectionVersion`: packet graph projection version.
- `canonicality`: canonical, advisory, proposed, rejected, mixed.
- `closureAssumptions`: open world, closed within packet, closed for named scope, unknown.
- `allowedNodeTypes`: ACO and domain node types.
- `allowedEdgeTypes`: evidence, temporal, causal, influence, commitment, narrative, governance.
- `pathTemplates`: named ontology-valid path patterns.
- `sourceRequirements`: source receipt minimums per edge or claim type.
- `temporalRequirements`: required date, interval, or freshness fields.
- `causalRequirements`: direct evidence, caveat, confidence cap, counter-evidence check.
- `forbiddenInferences`: claims the agent must not make without human review.
- `verificationPolicy`: required verifier stages before output.

This profile should render into Agent Context Packet v2 before graph neighborhoods. It should not be hidden metadata.

### Domain Ontology Extensions

Build ontology packs as composable TypeScript modules under `src/lib/ontology/`.

1. `conflict-security.ts`
   - Nodes: armed_actor, civilian_actor, mediator, guarantor, front_line, escalation_event, ceasefire_term, violation_report.
   - Edges: attacks, controls_area, mediates_between, guarantees, violates, de_escalates, escalates.
   - Path templates: `Actor -> violates -> Commitment -> valid_during -> Interval`; `Event -> escalates -> ConflictState -> affects -> Actor`.

2. `mediation-negotiation.ts`
   - Nodes: red_line, concession, BATNA, confidence_building_measure, guarantor, verification_mechanism.
   - Edges: conditions, trades_for, guarantees, verifies, blocks, enables.
   - Path templates: `Actor -> has_interest -> Interest -> conflicts_with -> Interest <- has_interest <- Actor`.

3. `sanctions-economic.ts`
   - Nodes: sanctioned_entity, license, exemption, asset, supply_dependency, evasion_route, market_exposure.
   - Edges: owns, controls, supplies, restricts, exempts, routes_through, depends_on.
   - Path templates: `Constraint -> restricts -> Actor -> depends_on -> Resource`.

4. `humanitarian-protection.ts`
   - Nodes: affected_population, protected_site, access_constraint, aid_corridor, displacement_route, protection_risk.
   - Edges: blocks_access_to, threatens, protects, displaces, enables_delivery_to.
   - Path templates: `Event -> creates -> ProtectionRisk -> affects -> Population`.

5. `governance-legal.ts`
   - Nodes: jurisdiction, authority, mandate, obligation, deadline, remedy, noncompliance.
   - Edges: authorizes, obligates, expires, violates_after, remedies, preempts.
   - Path templates: `Actor -> has_authority_under -> Mandate -> authorizes -> Action`.

6. `narrative-information.ts`
   - Nodes: frame, audience, channel, amplification_network, counter_narrative, credibility_signal.
   - Edges: amplifies, reframes, targets_audience, contradicts_claim, undermines, legitimizes.
   - Path templates: `Narrative -> amplifies -> Claim -> influences -> Actor`.

7. `cyber-hybrid.ts`
   - Nodes: intrusion_set, campaign, target_system, vulnerability, mitigation, attribution_assessment.
   - Edges: exploits, targets, mitigates, attributed_to, enables, disrupts.
   - Path templates: `Actor -> attributed_to <- Campaign -> exploits -> Vulnerability`.

Each pack should include:

- TypeScript node and edge definitions.
- Validation rules.
- Required source receipt policy.
- Packet rendering labels.
- Graph path templates.
- Fixture capsules.
- Eval questions.

### Graph Construction and Curation

The construction pipeline should be:

1. Extract candidate entities, claims, events, commitments, interests, constraints, leverage points, and narratives.
2. Normalize entities and aliases.
3. Bind every candidate to source spans and source receipts.
4. Classify each item under ACO plus active domain packs.
5. Create edges only when relation-specific source requirements are met.
6. Mark uncertain edges as advisory or inferred, not canonical.
7. Detect contradictions and competing narratives.
8. Add temporal validity and freshness status.
9. Add causal caveats and confidence caps.
10. Produce graph construction manifest: extractor version, ontology version, source set, extraction coverage, unresolved ambiguities, rejected candidates.

The construction manifest matters because GraphRAG failures often come from graph construction quality, not generation quality ([PVLDB GraphRAG analysis](https://www.vldb.org/pvldb/vol18/p5623-zhou.pdf)).

### Retrieval and Salience Improvements

Upgrade `src/lib/context/agent-context-salience.ts` from selected rows to selected reasoning subgraphs.

Current packet reasoning paths are mostly simple selected edge paths. The next version should compute:

- weighted k-shortest ontology-valid paths
- temporal chains
- causal chains
- contradiction neighborhoods
- actor-interest-constraint triangles
- commitment-compliance paths
- narrative-claim-source paths
- source diversity coverage
- hub dampening
- omitted-path ledger

Scoring should combine:

- query overlap
- task role
- ontology fit
- source credibility
- source independence
- evidence strength
- temporal freshness
- causal relevance
- contradiction value
- path length penalty
- hub penalty
- ACO primitive coverage
- domain-pack coverage

The packet should include why each selected path matters, not only the path itself.

### Agent Context Packet v2

Add these sections to `src/lib/context/agent-context-packet.ts`:

1. `Graph Affordance Profile`
   - What the graph can and cannot support.

2. `Graph Construction Manifest`
   - Source set, extractor version, ontology version, review state, unresolved ambiguities.

3. `Selected Reasoning Subgraph`
   - Nodes, edges, paths, community summaries, contradiction neighborhoods, and omitted high-scoring candidates.

4. `Path Templates Used`
   - Which ontology-valid patterns were selected for the task.

5. `Closure and Uncertainty`
   - What is known complete, what is open-world, what is stale, what is advisory.

6. `Verifier Plan`
   - Required post-generation checks for this task.

### Verification Loop

Add a new verifier module: `src/lib/context/agent-context-verifier.ts`.

Inputs:

- generated output
- packet grounding map
- source receipts
- claim cards
- selected graph nodes and edges
- reasoning paths
- ontology affordance profile
- output contract

Outputs:

- atomic generated claims
- support classification per claim
- evidence IDs per claim
- contradiction IDs per claim
- ontology validation result
- temporal validation result
- causal validation result
- unsupported-claim repairs
- final groundedness score
- proof artifact for UI and audit

Support classes:

- `supported`
- `partially_supported`
- `contradicted`
- `stale`
- `inferred_not_labeled`
- `outside_capsule`
- `unverifiable`

Hard gates:

- Do not emit final memo if any central factual claim is `contradicted` without being framed as disputed.
- Do not emit final memo if any causal claim lacks a causal edge, direct source statement, or explicit caveat.
- Do not emit final memo if any commitment deadline or violation claim lacks a temporal anchor.
- Do not present advisory graph proposals as canonical.
- Do not suppress material contradictions.

### Evaluation Harness

Add focused evals to `src/lib/agent-runtime/research-eval.ts` and fixtures under `tests/fixtures/`.

Task families:

- direct answer from capsule
- multi-hop actor-interest-constraint analysis
- temporal commitment status
- causal hypothesis with caveat
- contradiction-aware briefing
- source-gap analysis
- negotiation memo
- handover with omitted-context ledger

Metrics:

- context precision
- context recall
- path sufficiency
- citation faithfulness
- claim support rate
- contradiction surfacing rate
- ontology conformance
- temporal correctness
- causal caveat correctness
- abstention correctness
- capsule-vs-generic delta

## Prioritized Build Backlog

| Priority | Action | Impact | Effort | Primary files |
| --- | --- | --- | --- | --- |
| P0 | Build `agent-context-verifier` and require claim-to-source support classification before knowledge-product output | Very high | Medium-large | `src/lib/context/agent-context-verifier.ts`, `src/lib/agent-runtime/sourceability-ledger.ts`, `src/lib/ai/context-kernel.ts`, answer/memo envelope modules, focused tests |
| P0 | Upgrade salience from row selection to ontology-valid multi-hop subgraph selection | Very high | Medium | `src/lib/context/agent-context-salience.ts`, `src/lib/context/agent-context-packet.ts`, graph fixtures and unit tests |
| P0 | Add `CapsuleGraphAffordanceProfile` and render it in Agent Context Packet v2 | High | Medium | `src/types/context-capsule.ts`, `src/lib/context/capsule-v3.ts`, `src/lib/context/agent-context-packet.ts`, `src/lib/ontology/types.ts` |
| P1 | Add ACO domain ontology packs and path templates | High | Medium-large | `src/lib/ontology/*.ts`, `src/lib/ontology/universal.ts`, ontology validator tests |
| P1 | Add contradiction and competing-narrative arbitration to packet selection and sourceability ledgers | High | Medium | `src/lib/context/agent-context-salience.ts`, `src/lib/agent-runtime/sourceability-ledger.ts`, `src/lib/context/capsule-v3.ts` |
| P1 | Add graph construction manifest and review-state reporting | Medium-high | Medium | capsule extraction services, `src/lib/context/agent-context-packet.ts`, `src/lib/services/entity-extraction.ts` |
| P1 | Build eval suite for multi-hop, temporal, causal, contradiction, and memo faithfulness tasks | High | Medium | `src/lib/agent-runtime/research-eval.ts`, `tests/fixtures/`, `tests/unit/lib/agent-runtime/` |
| P2 | Add UI proof surface for selected paths, failed verifier checks, and omitted context | Medium-high | Medium | `src/components/capsules/CapsuleAgentView.tsx`, workbench proof components |
| P2 | Add RDF/OWL/SHACL export and validation adapter for ontology portability | Medium | Medium | `src/lib/ontology/export-rdf.ts`, `src/lib/ontology/shacl-adapter.ts`, scripts/audits |
| P2 | Add DIALECTICA-compatible review-only graph adapter for upstream ontology/context packages | Medium-high | Large | adapter boundary modules, capsule promotion paths, docs/runbooks |

## Open Research Questions and Risks

1. How much ontology expressivity helps before it becomes prompt noise? OWL/RDF is powerful for validation, but the packet should likely remain a compact property-graph projection.

2. Which verifier should PRAXIS trust? LLM-as-judge, NLI models, retrieval-based entailment, and rule validators all have failure modes. The safest first version is hybrid: deterministic schema checks plus LLM/NLI support classification.

3. How should PRAXIS calibrate source credibility? Academic RAG work often treats documents as equally reliable, while policy work needs source independence, provenance, bias, and chain-of-custody signals.

4. How can capsules avoid false precision in causal claims? CausalRAG-style retrieval helps, but causality in policy domains often remains contested and should preserve caveats.

5. How should graph updates handle stale facts? Temporal validity and review state must be part of selection; otherwise the graph can make obsolete claims more authoritative.

6. How should advisory memory from external graph systems be promoted? PRAXIS should preserve its current review-card-only path and never silently promote upstream graph inferences.

7. What benchmark best measures "policy capability"? Generic QA benchmarks miss PRAXIS's core work: sourceable memos, contradiction-aware briefings, negotiation constraints, and accountable handovers.

## Top Five Build Actions

1. Implement the capsule grounding verifier: every generated knowledge product must be decomposed into claims and checked against source receipts, claim cards, graph paths, temporal anchors, and contradiction state.

2. Replace one-edge packet paths with weighted ontology-valid multi-hop subgraph selection.

3. Add `CapsuleGraphAffordanceProfile` so the agent knows what the embedded graph can support, what is advisory, and what inferences are forbidden.

4. Add ACO domain ontology packs for conflict/security, mediation, sanctions/economic statecraft, humanitarian/protection, governance/legal, narrative/information operations, and cyber/hybrid work.

5. Build an eval harness that measures citation faithfulness, path sufficiency, contradiction surfacing, temporal correctness, causal caveating, and capsule-vs-generic improvement.

## Single Highest-Leverage Change

Build the capsule grounding verifier first.

The embedded graph and Agent Context Packet already give PRAXIS a strong context substrate. The highest-leverage improvement is to make generated outputs prove they respected that substrate. A verifier that maps every atomic output claim back to source receipts, claim cards, ontology-valid graph paths, temporal anchors, and contradiction state would immediately convert capsules from "better prompts" into accountable knowledge products.

