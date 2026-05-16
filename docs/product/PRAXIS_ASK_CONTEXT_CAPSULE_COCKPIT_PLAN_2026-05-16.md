# PRAXIS Ask + ContextCapsule Cockpit Plan

Last updated: 2026-05-16

## Product Rule

Keep the visible app simple: login, one prompt bar, active ContextCapsule, model
choice, token posture, and obvious output destinations. Move advanced context
assembly, retrieval, approval gates, and premium capsule generation into
ContextCapsules, Advanced, and backend receipts.

## Current Live Slice

- Public Home stays a product cockpit, not a marketing grid.
- Live Ask PRAXIS calls are login-gated by `withCalibration`, which performs
  auth, onboarding, request-size checks, context-health checks, and token
  deduction before the model stream starts.
- New users receive 1,000 starter PRAXIS tokens. Ask PRAXIS chat now costs 10
  starter tokens per question.
- Ask PRAXIS now exposes a small model selector in the cockpit:
  Gemini 2.5 Flash for normal capsule-aware chat, and Gemini 2.5 Pro for deeper
  memo/research turns.
- Ask PRAXIS sends the selected model, active capsule id, thread id, context
  package id, and active context stack to `/api/ai/chat`.
- Capsule-owned Ask thread turns are persisted even when the run is capsule-only
  and not tied to a legacy situation id.

## Runtime Position

Official Google documentation currently supports this split:

- Gemini model selection lives in Vertex/Gemini Enterprise Agent Platform. Keep
  Flash as the default fast cockpit model and Pro as the deeper memo/research
  model.
- Grounding should be used for source-backed claims because it connects model
  output to verifiable sources and provides audit support.
- Genkit is the structured flow/tool layer for chat, RAG, tools, and agentic
  workflows. Treat it as orchestration, not as a separate model picker.
- Agent Engine Sessions and Memory Bank are the future enterprise memory layer:
  sessions store chronological events, and Memory Bank can generate or retrieve
  scoped memories for cross-session continuity. Keep this planned until approval
  gates and data-scope policy are complete.

Primary references:

- Google models: https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/google-models
- Vertex/Gemini grounding overview: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/grounding/overview
- Genkit overview: https://genkit.dev/
- Agent Engine Sessions: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/sessions/overview
- Memory Bank: https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/memory-bank/overview

## ContextCapsule Roadmap

### CapsuleLite

CapsuleLite remains the easy in-PRAXIS capsule: user core, situation core,
source/document hints, graph/time/output slots, lock/fork/combine posture, and
Ask-thread memory. It should be cheap, fast, and editable by normal users.

### Full ContextCapsule

Full ContextCapsules are premium governed context objects built from PRAXIS plus
DIALECTICA, AGON, and KAIROS:

- DIALECTICA provides ingestion, RAG libraries, repositories, source packs,
  document cores, ontology packs, and graph ontologies.
- AGON provides conflict perception: actors, events, commitments, claims,
  relationships, pattern recognition, and conflict scene graph material.
- KAIROS provides temporal structure: chronology, freshness, forecast horizons,
  and time-sensitive claims.
- PRAXIS owns the user-facing cockpit, tool routing, writing/review/handover,
  receipts, token policy, and approval gates.

## UX Rules

- Registration stays one page: sign in/sign up, token starter posture, and a
  quick welcome into Home/Ask PRAXIS.
- The Ask bar must always show which capsule, model, token budget, and output
  path are active.
- Source/document/search/output controls stay tiny and icon-led.
- Suggested cores should appear inline from the user profile, active situation,
  recent runs, and context-health gaps.
- Full agent lists stay behind drawers or Advanced.

## Next Build Queue

1. Persist a server-side `askRuntimeReceipt` on every Ask run with model,
   provider, selected context cores, output destination, token cost, and
   grounding/search posture.
2. Add a user-facing Ask thread list under Recent runs, backed by
   `users/{uid}/capsules/{capsuleId}/askThreads`.
3. Add server classification from prompt intent to normal answer, research memo,
   sourceability review, red-team review, or handover.
4. Promote Research Memo Agent from scaffold to real capsule-aware retrieval,
   drafting, Memo Studio save, source receipt, and gap receipt.
5. Keep Agent Engine Sessions/Memory Bank disabled until approval gates define
   what can be remembered, forgotten, exported, or shared across workspaces.
