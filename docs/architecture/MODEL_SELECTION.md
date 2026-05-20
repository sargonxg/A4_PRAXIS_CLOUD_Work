# PRAXIS Model Selection

Date: 2026-05-20
Pack: 15 Gemini 3.5 Flash default

## Current Posture

PRAXIS is Vertex AI first for production model runtime. Gemini Enterprise is the enterprise agent and work platform PRAXIS should align with for agent governance, enterprise data connectors, sessions, Memory Bank, and Agent Platform Runtime. Vertex AI remains the developer and managed model runtime used by the application code.

Official platform references:

- https://cloud.google.com/gemini-enterprise
- https://cloud.google.com/blog/products/ai-machine-learning/introducing-gemini-enterprise
- https://docs.cloud.google.com/gemini-enterprise-agent-platform/scale
- https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/3-5-flash
- https://ai.google.dev/gemini-api/docs/models

## Source Of Truth

Model defaults live in `src/lib/ai/MODEL_MATRIX.json`.

Runtime helpers live in:

- `src/lib/ai/model-matrix.ts`
- `src/lib/ai/providers.ts`
- `backend/ai/providers.py`

Active runtime code must not import Google, Vertex, Anthropic, or OpenAI SDKs directly. The boundary is enforced by:

- `npm run audit:ai-provider-isolation`
- `npm run audit:ai-provider-vertex-default`

## Task Kinds

| Task kind | Current model | Notes |
|---|---|---|
| `balanced` | `gemini-3.5-flash` | Default Ask PRAXIS chat, tool synthesis, lightweight analysis, and fast agent lanes. Official Gemini Enterprise Agent Platform docs list this model ID as GA with global/us/eu availability. |
| `cheap_classify` | `gemini-3.5-flash` | Ontology classification and ranking until a cheaper verified Gemini 3 Flash-Lite default is approved. |
| `complex_reasoning` | `gemini-3.1-pro-preview` | Contradiction analysis, legal reasoning, scenario depth, deep memos, and high-stakes agent workflows. |
| `long_context` | `gemini-3.1-pro-preview` | Long source synthesis and deep reasoning paths. |
| `writing_quality` | `gemini-3.1-pro-preview` | Memos, refined outputs, diplomatic prose. |
| `embeddings_text` | `text-embedding-005` | 768-dimensional default embeddings. |
| `embeddings_long` | `text-embedding-005` | Kept on the stable 768-dimensional embedding path until a migration is signed. |

## Pack 15 Decisions

- Gemini 3.5 Flash (`gemini-3.5-flash`) is the default for standard Ask answer generation after official Google Cloud docs listed it as GA on 2026-05-20.
- Fast agent lanes that use the shared `balanced` task kind inherit Gemini 3.5 Flash; deep/high-stakes/research memo paths remain on Gemini 3.1 Pro Preview.
- Gemini 2.5 GA models remain the stable fallback chain for chat, deep, and cheap paths.
- Gemini 3 frontier traffic uses the configured Gemini global endpoint policy by default.
- pgvector remains primary. Vertex AI Vector Search 2 is documented as the secondary at-scale path, not an immediate replacement.
- Google AI Studio remains a local developer fallback. It is not the production default.
- Third-party model IDs are not encoded as defaults until access, cost, and owner approval are verified.
