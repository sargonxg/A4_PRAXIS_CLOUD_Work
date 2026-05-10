# Pack 14 Production Excellence Pass

Date: 2026-05-06
Prompt source: `docs/codex-prompts/PRAXIS_CODEX_14_PRODUCTION_EXCELLENCE.md`

## Official Platform Interpretation

Google's current naming means PRAXIS should treat Gemini Enterprise as the enterprise-facing agent work platform and governance surface, while Vertex AI remains the managed developer/model runtime used by application code. Google Cloud's Gemini Enterprise page describes app connectors, user-facing agents, centralized visibility, permissions, and Model Armor. The Gemini Enterprise Agent Platform docs cover Runtime, Sessions, Memory Bank, Agent Gateway, tracing, logging, and monitoring. Google Cloud's launch blog also describes Gemini Enterprise as the workplace "front door" while noting customer products still build Gemini experiences on Vertex AI.

Sources:

- https://cloud.google.com/gemini-enterprise
- https://cloud.google.com/blog/products/ai-machine-learning/introducing-gemini-enterprise
- https://docs.cloud.google.com/gemini-enterprise-agent-platform/scale

## Run 1

Issues marked:

- Provider model defaults were not data-driven.
- Firestore document embeddings bypassed `src/lib/ai/providers.ts`.
- Document embeddings still used `text-embedding-004`.
- Backend AI model IDs were duplicated in multiple call sites.
- No Pack 14 provider audits existed in `audit:gate`.
- Master charter status still marked Pack 14 as not started.

## Run 2

Fixes applied:

- Added model matrix and typed loader.
- Routed frontend defaults through the matrix.
- Routed document embeddings through the shared provider abstraction.
- Added backend provider constants and replaced duplicated backend model IDs.
- Added provider isolation and Vertex-default audits.
- Updated architecture and audit docs with Gemini Enterprise/Vertex AI posture.
- Updated master charter backlog/status and changelog.

## Owner-Gated Items Not Faked

These remain open because they require infrastructure, production access, spending, or owner signature:

- Terraform-managed staging/production infrastructure.
- Vertex AI Agent Platform Runtime deployment for all four subagents.
- Cloud Trace/Logging/Monitoring/Error Reporting proof across live user flows.
- Public read-only demo case and waitlist/magic-link final posture.
- Load test, cost projection, canary rollout, rollback drill, and launch gate.

## Verification Target

This pass is complete only when these local commands pass:

- `npm run audit:ai-provider-isolation`
- `npm run audit:ai-provider-vertex-default`
- `npx vitest run src/__tests__/ai-providers.test.ts`
- `npx tsc --noEmit`
- `npm run build`
- `npm run smoke:app-usability`

## Latest Local Verification

Passed on 2026-05-06:

- `npm run audit:ai-provider-isolation`
- `npm run audit:ai-provider-vertex-default`
- `npx vitest run src/__tests__/ai-providers.test.ts`
- `npx tsc --noEmit`
- `npm run build`
- `npx vitest run`
- `npm run audit:master-charter`
- `npm run audit:context-vs-tools`
- `npm run audit:codex-prompts`
- `npm run audit:tool-marketplace`
- `npm run audit:kg-backend`
- `npm run audit:memo-studio`
- `python -m py_compile` for touched backend AI files
- `npm run smoke:app-usability` against `http://localhost:3108`
- `npx playwright test tests/e2e/landing-smoke.spec.ts tests/e2e/personas` against `http://localhost:3108`
- `graphify update .`

Blocked:

- `npm run audit:gate` reached the new provider audits and passed them, then stopped at `npm run audit:gcp` because `gcloud` token refresh requires interactive reauthentication. No code failure was observed before that environment gate.
