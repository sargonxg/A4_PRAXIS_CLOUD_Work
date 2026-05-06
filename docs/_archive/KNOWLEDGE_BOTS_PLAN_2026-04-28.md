# PRAXIS Knowledge Bots Plan - 2026-04-28

Goal: let teams build policy knowledge bases in PRAXIS and publish source-bound
assistants, including ARGUS-style public or internal chatbots.

## Product Shape

1. Corpus Builder: upload documents, URLs, notes, tool outputs, and approved
   source feeds into a situation or organization corpus.
2. Evidence Pipeline: OCR/layout extraction, chunking, embeddings, entity/ACO
   extraction, source reliability labels, and approval state.
3. Bot Studio: choose audience, persona, citation rules, allowed sources,
   escalation language, refusal policy, and public/internal visibility.
4. Runtime: retrieval, answer drafting, citation verification, uncertainty
   disclosure, audit event, feedback loop.
5. Governance: revoke bot, expire sources, redact private chunks, export audit
   logs, and review unanswered/high-risk questions.

## Storage Contract

Near-term Firestore envelope:

- `users/{uid}/situations/{sid}/corpus/{corpusItemId}`
- `users/{uid}/situations/{sid}/tool-data/{toolId}` for versioned generated
  outputs
- `users/{uid}/situations/{sid}/tools/{toolId}` for current/legacy live tool
  outputs and annotations
- `organizations/{orgId}/corpora/{corpusId}/items/{corpusItemId}` for team
  corpora
- `published_bots/{botId}` for public/internal bot metadata
- `published_bots/{botId}/events/{eventId}` for question, retrieval, and
  safety/audit summaries

Each `CorpusItem` should include source type, owner scope, visibility, hash,
language, extraction status, citation metadata, reliability label, chunk count,
embedding model, and approval state.

2026-04-28 implementation note: `src/lib/knowledge/evidence-envelope.ts`
now normalizes tool outputs into a citation-ready envelope and projects them
into `CorpusItem`. `searchSituationCorpus()` reads both `tool-data` and
`tools`, preferring versioned `tool-data` while backfilling legacy/current
`tools` rows. This is the first step toward a single corpus table without
breaking existing tool pages.

## Retrieval Path

- Phase 1: Firestore vector search for private/situation corpora close to app
  state.
- Phase 2: Vertex AI Vector Search for larger organization/public corpora.
- Phase 3: Vertex AI Search/RAG Engine for managed enterprise search surfaces
  where governance, scale, and hybrid retrieval outweigh local simplicity.

## Agentic Path

- LangGraph owns PRAXIS-native workflows: source scout, corpus curator,
  contradiction finder, red-team reviewer, and bot answer verifier.
- Google ADK / Vertex AI Agent Engine owns managed deep research and
  Google-native enterprise agent deployments.
- Agents propose corpus and graph updates; humans approve canonical changes.

## First Build Tickets

1. Normalize tool outputs, notes, documents, and research into `CorpusItem`.
   Status: tool outputs are partially done through the evidence envelope; next
   iteration should add analyst notes and explicit research run artifacts.
2. Add a corpus health panel: chunk count, source age, citation coverage,
   extraction failures, and retrieval latency.
3. Add a private "Bot Preview" for a single situation before any public sharing.
4. Add answer-grounding checks: every material claim needs a cited chunk or a
   visible "not found in corpus" response.
5. Add public/internal publishing controls only after audit logging, revocation,
   and source-scope enforcement are tested.
