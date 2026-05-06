# PRAXIS Model Selection

Date: 2026-05-06
Pack: 14 Production Excellence

## Current Posture

PRAXIS is Vertex AI first for production model runtime. Gemini Enterprise is the enterprise agent and work platform PRAXIS should align with for agent governance, enterprise data connectors, sessions, Memory Bank, and Agent Platform Runtime. Vertex AI remains the developer and managed model runtime used by the application code.

Official platform references:

- https://cloud.google.com/gemini-enterprise
- https://cloud.google.com/blog/products/ai-machine-learning/introducing-gemini-enterprise
- https://docs.cloud.google.com/gemini-enterprise-agent-platform/scale

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
| `balanced` | `gemini-2.5-flash` | Default chat, tool synthesis, lightweight analysis. |
| `cheap_classify` | `gemini-2.5-flash` | Ontology classification and ranking until a cheaper verified model is approved. |
| `complex_reasoning` | `gemini-2.5-pro` | Contradiction analysis, legal reasoning, scenario depth. |
| `long_context` | `gemini-2.5-pro` | Long source synthesis. |
| `writing_quality` | `gemini-2.5-pro` | Memos, refined outputs, diplomatic prose. |
| `embeddings_text` | `text-embedding-005` | 768-dimensional default embeddings. |
| `embeddings_long` | `text-embedding-005` | Kept on the stable 768-dimensional embedding path until a migration is signed. |

## Pack 14 Decisions

- Region default is documented as `us-central1`. This still needs owner sign-off before Terraform/canary production rollout.
- pgvector remains primary. Vertex AI Vector Search 2 is documented as the secondary at-scale path, not an immediate replacement.
- Google AI Studio remains a local developer fallback. It is not the production default.
- Gemini preview and third-party model IDs are not encoded as defaults until access, cost, and owner approval are verified.
