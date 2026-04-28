# PRAXIS Database and Dashboard Improvement Plan

Status: active implementation note as of 2026-04-28.

## Sources Checked

- Firestore best practices: https://firebase.google.com/docs/firestore/best-practices
- Firestore data model: https://firebase.google.com/docs/firestore/data-model
- Firestore structure guidance: https://firebase.google.com/docs/firestore/manage-data/structure-data
- Firestore aggregation queries: https://firebase.google.com/docs/firestore/query-data/aggregation-queries
- Firestore vector search: https://firebase.google.com/docs/firestore/vector-search
- Vertex AI RAG Engine API: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/model-reference/rag-api-v1
- Vertex AI Search as RAG backend: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/rag-engine/use-vertexai-search
- Firecrawl v2 API docs: https://docs.firecrawl.dev/api-reference/v2-introduction

## Product Change Shipped

The dashboard now has a case-file launchpad. It reads the active situation and
shows:

- readiness score;
- frame, actors, evidence, and deliberation readiness;
- next best actions;
- first deliverables based on the selected policy workflow path.

Situation creation now asks for one of ten policy-professional workflow paths.
The selected path tunes:

- situation type;
- user role;
- initial source categories;
- dashboard deliverables;
- first recommended tools.

## Database Implications

Current shape remains correct for near-term PRAXIS:

- `users/{uid}` is the owner/account root.
- `users/{uid}/situations/{situationId}` is the active case-file root.
- Growing artifacts stay in subcollections: documents, chunks, tools,
  tool-data, graph updates, reports, research, and future agent runs.
- Firestore remains canonical for user-facing state. Cloud SQL remains only for
  LangGraph checkpoints.

Changes introduced:

- `workflowPath` and `workflowPathLabel` are now saved on the situation root.
  These are small, stable fields suitable for Firestore document storage and
  dashboard reads.

Next database work:

1. Add a canonical `corpus_items` envelope under each situation for document
   chunks, source saves, research results, tool outputs, and approved notes.
2. Use Firestore vector search for user/situation-scoped corpus retrieval once
   embeddings are consistently generated.
3. Move large original files to Cloud Storage and keep extracted text/chunks in
   Firestore. This avoids Firestore document-size pressure and prepares for
   Document AI OCR/layout fallback.
4. Add aggregation-based counts where possible instead of scanning collections
   for dashboard totals.
5. Keep hot counters off single frequently written documents. If real-time
   counters become high-write, shard them.
6. Add single-field index exemptions for large text, vector, and TTL fields
   where they are not queried directly.

## Google Cloud Path

Near term:

- Firestore vector search for private, situation-scoped chunks.
- Vertex AI embeddings for chunk vectors.
- Cloud Tasks for async document extraction, embeddings, source research, and
  agent turns.
- Secret Manager for provider keys and webhook secrets.
- Model Armor checks before public/internal knowledge-base bot answers.

Scale path:

- Vertex AI Search and Vertex AI RAG Engine for larger managed corpora,
  organization knowledge bases, and enterprise deployments.
- Vertex AI Agent Engine / ADK for managed deep research agents where Google
  runtime, IAM, and enterprise observability are preferred.

## Firecrawl / Parallel Path

Firecrawl should remain the premium web acquisition layer:

- source discovery;
- scrape clean markdown from URLs;
- crawl/map target sites;
- support future source ingestion jobs.

Parallel should remain the premium multi-step research layer:

- high-depth source discovery;
- research-plan execution;
- source diversification;
- citation-grade search results.

Free users keep Google/open-data fallback search. Paid users unlock premium
depth, parallelism, larger context, and more source ingestion.
