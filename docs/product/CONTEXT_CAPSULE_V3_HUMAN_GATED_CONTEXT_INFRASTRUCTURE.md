# ContextCapsule v3: Human-Gated Context Infrastructure

## Purpose

ContextCapsule v3 turns capsules into governed, human-authored context objects for policy work and agent inheritance. The visible product remains inside `/app/capsules`, Ask PRAXIS, and existing workbench panels; no new primary capsule application surface is required.

Firestore ContextCapsules remain canonical. Cognee advisory memory, GraphLite projections, graph extraction, search, and agents can infer, retrieve, and enrich, but their output becomes review cards until a human applies it.

## Canonical v3 Sections

The TypeScript contract in `src/lib/context/capsule-v3.ts` normalizes v2 capsules into additive v3 sections:

- `identity`: capsule id, owner, version, class, mode, visibility, forkability, and canonical store.
- `businessUseCase`: audience, purpose, decision horizon, cadence, use case, and best next action.
- `humanTacitKnowledge`: assumptions, hidden constraints, red lines, habits, approval politics, heuristics, stakeholder sensitivities, caveats, recurring decisions, and promptless human knowledge.
- `sourceSpine`: source refs, source ids, required source types, source gaps, stale refs, unsupported claim ids, independence score, freshness window, and source score.
- `contextCaptureProfile`: source bindings, usage inference, embedded graph rules, generation impact, Cognee capture, review state, and canonical truth.
- `grounding`: timeline anchors, causal links, domain taxonomy, ontology ids, ACO primitives, and GraphLite advisory projection metadata.
- `claimLedger`: supported, weak, unsupported, disputed, stale, inferred, and forbidden claims.
- `reasoningScaffold`: public method and caveats, with private notes and hidden reasoning redacted.
- `agentOperatingContract`: allowed actions, forbidden actions, source requirements, review checkpoints, recommended tools, handoff instructions, stop conditions, and best next action.
- `memoryPosture`: canonical capsule facts, advisory Cognee recall, session memory, graph proposals, stale assumptions, disputed claims, rejected inferences, dataset id, advisory mode, and allowed memory operations.
- `governance`: human gate status, author/reviewer/approval metadata, required review-card targets, and `agentsMayMutateCanonical: false`.
- `marketplaceProfile`: shelves, trust badges, reuse terms, moderation summary, forkability, public candidacy, and publish blockers.
- `outputContracts`: expected artifacts, citation posture, and review requirements.
- `evaluation`: source spine, tacit knowledge, agent operability, marketplace, freshness, and open-gap scores.

## Cognee Advisory Memory

Cognee is an optional advisory recall and enrichment layer, not a canonical source of truth. v3 isolates memory by owner, capsule id, and capsule version through dataset ids such as `owner:{ownerUid}:capsule:{capsuleId}:v{version}`.

Allowed operations map to review-safe posture:

- `remember`: store approved advisory seed packs, such as source summaries, claim ledgers, tacit notes, reasoning scaffolds, prior review cards, output contracts, and approved handover notes.
- `recall`: retrieve advisory context for Ask PRAXIS or capsule agents.
- `improve`: propose enrichment, source gaps, graph candidates, and agent-instruction improvements.
- `forget`: remove user-requested or expired sensitive context.

Every Cognee hit that influences an agent must carry a receipt with dataset id, source capsule version, memory item id, confidence, source ids, operation, and whether it is canonical or advisory. Cognee-derived changes target review cards only: `advisoryMemory`, `sourceGap`, `graphProposal`, `claimLedger`, or `agentInstructions`.

## Capsule Agent Lanes

Capsule agents run behind the current Ask/workbench runtime and Capsule Factory workflow. They return proposals, not canonical writes.

- `capsule-editor-agent`: improves capsule prose while preserving claims, receipts, caveats, and provenance.
- `tacit-knowledge-interviewer`: elicits assumptions, hidden constraints, red lines, stakeholder sensitivities, and heuristics.
- `source-spine-agent`: audits freshness, independence, missing citations, source support, and source gaps.
- `claim-ledger-agent`: classifies supported, weak, unsupported, disputed, stale, inferred, and forbidden claims.
- `cognee-memory-agent`: converts advisory recall and improve results into review cards.
- `agent-operability-agent`: checks allowed tools, source requirements, output contracts, handoff, and stop conditions.
- `marketplace-curator-agent`: scores shareability, taxonomy, usefulness, forkability, reuse terms, and moderation risk.
- `human-review-agent`: prepares final review packets for a human approver and cannot approve its own work.

## Product UX

v3 is shown in the existing capsule inspector. The inspector should make the user able to answer:

- What is known, sourced, stale, disputed, inferred, or forbidden?
- What tacit human knowledge is captured?
- Which memory is canonical and which memory is advisory?
- Which timeline anchors, causal links, ontology bindings, and GraphLite advisory projections are attached?
- Which agents can use the capsule, and what are they forbidden to do?
- Which review cards are open before marketplace publishing or agent inheritance?

Shelves are `Human-Gated`, `Expert Pick`, `Agent-Ready`, `Source-Backed`, `Needs Refresh`, `Tacit Knowledge Rich`, `Marketplace Candidate`, and `Public/Forkable`.

Trust badges are `Human Written`, `Human Reviewed`, `Human-Gated`, `AI Proposal`, `Cognee Advisory`, `Source Gap`, `Stale`, and `Rejected Inference`.

## Marketplace Gate

Publishing is blocked unless the capsule has:

- human author metadata;
- reviewer metadata and an approval receipt when human-gated;
- source spine score at or above the publish threshold;
- no unsupported final claims;
- explicit reuse terms;
- no stale human gate;
- at least one output contract;
- a moderation-ready summary.

Agents can prepare review cards and review packets, but they cannot publish capsules or mutate canonical Firestore state.

## Acceptance Gates

- `normalizeContextCapsuleV3` must preserve v2 compatibility and version history.
- v2-to-v3 adapters must not overwrite user-owned capsule state.
- Cognee, GraphLite, search, and agent improvements must generate review cards only.
- Workbench surfaces must label Cognee and GraphLite as advisory and avoid misleading human-reviewed labels.
- `audit:capsule-v3` must pass before treating the contract as shipped.

## Research Basis

- Cognee combines relational, vector, and graph memory and exposes `remember`, `recall`, `improve`, and `forget`: https://docs.cognee.ai/core-concepts/overview
- Cognee `remember()` supports dataset-aware permanent memory, ingestion, graph building, and enrichment: https://docs.cognee.ai/core-concepts/main-operations/remember
- MCP resources and tools support the split between contextual resources and explicit, reviewable tool actions: https://modelcontextprotocol.io/specification/2025-06-18/server/resources and https://modelcontextprotocol.io/specification/2025-06-18/server/tools
