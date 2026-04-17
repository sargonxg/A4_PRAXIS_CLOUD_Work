---
name: PRAXIS Conventions
description: PRAXIS-specific conventions, model strings, file layout, security boundaries, and verification commands. Auto-loads on any task touching src/, backend/, infrastructure/, cloud_functions/, or cloudbuild.yaml. Use this skill before generating any code in this workspace.
version: 1.0.0
---

# PRAXIS Workspace Conventions

This file is loaded into agent context for any task that touches the PRAXIS codebase. Read it fully before planning.

## Repo layout

```
src/
├── app/
│   ├── (landing)/          Public landing page
│   ├── (auth)/login        Sign-in page
│   ├── app/                Authenticated workspace pages — /app/*
│   ├── demo/               Demo workspace pages — /demo/*  (mostly thin re-exports of /app/*)
│   └── api/                Next.js API routes
│       ├── ai/             AI tool endpoints — all wrapped with withAuth + checkAndDeductCreditsForUid
│       ├── auth/           Session management
│       ├── cron/           Cloud Scheduler targets — protected by CRON_SECRET bearer
│       └── ...             documents, situations, reports, graph, health, stripe, etc.
├── components/
│   ├── ui/                 Radix primitives
│   ├── landing/            Landing page sections
│   ├── praxis/             AiPopulate, ToolPageShell scaffold, situation contexts
│   ├── visualizations/     SVG/D3 charts
│   └── ...
├── lib/
│   ├── ai/                 providers.ts, tools.ts, situation-context.ts, schemas/, prompts/
│   ├── api/                with-auth, with-credits, standard-error, validate-request
│   ├── auth/               auth-context.tsx (client), cookie-signer.ts
│   ├── firebase/           admin.ts (server), config.ts (client), services
│   ├── analytics/          risk-engine, escalation-scorer, geospatial-engine
│   ├── data-feeds/         ACLED, GDELT, UCDP, UNHCR, HDX, ReliefWeb clients
│   ├── knowledge/          Situation Knowledge Core — graph/vector/feed/tool-output layers
│   ├── constants/          tool-registry, frameworks, demo-conflict, templates
│   └── demo/               cached-responses (Nordalia investor-ready outputs)
├── stores/                 Zustand stores
├── hooks/                  React hooks
├── types/                  TypeScript types
└── middleware.ts           Edge middleware — routing + security headers + CSP

backend/                    Python FastAPI on Cloud Run
├── main.py                 FastAPI app entry
├── config.py               pydantic-settings — single source of env config
├── auth.py                 Firebase ID token verification
├── routers/                pipeline, graph, analyze
├── services/               graph_adapter (Neo4j/FalkorDB), graphiti_client, firestore_sync, gemini_client
├── graphify_tacitus/       Pipeline modules — extract, build, cluster, analyze, report, export
└── tests/

cloud_functions/            on_situation_created, on_document_uploaded, gdelt_poller
infrastructure/             setup-gcp.sh, deploy-*.sh
cloudbuild.yaml             Dual-service Cloud Run deployment
```

## Model string discipline (CRITICAL)

**Never hardcode `gemini-*` strings anywhere outside `src/lib/ai/providers.ts`.** The provider module is the single source of truth.

| Helper | Returns | Use for |
|---|---|---|
| `getModel()` | `gemini-3-flash` | Chat, lightweight analysis, terminology |
| `getProModel()` | `gemini-3.1-pro-preview` | Structured tool generation (Zod schemas) |
| `getDeepThinkModel(level)` | `gemini-3.1-pro-preview` + `thinking_level` | Game theory, scenarios, treaty legal reasoning |
| `getAnalysisModel()` | `claude-sonnet-4-20250514` → fallback Pro | Diplomatic language, bias-sensitive analysis |
| `getEmbeddingModel()` | `gemini-embedding-2-preview` → `text-embedding-005` → null | Vector search |
| `getGroundedModel()` | `gemini-3-flash` + Google Search grounding | Real-time research |
| `callProModel(opts)` | Pro→Flash fallback wrapper for `generateText` | All structured-output AI routes |

**Forbidden strings anywhere in `src/` or `backend/`:**

- `gemini-2.0-*` (deprecated)
- `gemini-2.5-*` (deprecated)
- `gemini-3-pro-preview` (discontinued by Google March 26, 2026)

**Verification:** `rg "gemini-2\.0|gemini-2\.5|gemini-3-pro-preview" src/ backend/` must return zero matches.

**Thinking levels (Gemini 3+):** Use `thinking_level: 'low' | 'medium' | 'high'`. The old `thinking_budget` parameter is deprecated. `MEDIUM` is the new default for Gemini 3.1 — meaningful improvement over the old binary on/off.

## API route conventions

Every AI route under `src/app/api/ai/*/route.ts` follows this shape:

```typescript
import { withAuth } from '@/lib/api/with-auth';
import { checkAndDeductCreditsForUid } from '@/lib/api/with-credits';
import { handleRouteError } from '@/lib/api/standard-error';
import { validateAiRequest } from '@/lib/api/validate-request';
import { writeToolDataServer } from '@/lib/firebase/tool-data-service';
import { isServerDemoMode, getCachedResponse, formatAsStreamResponse } from '@/lib/demo/demo-mode';
import { callProModel } from '@/lib/ai/providers';
import { buildToolContext } from '@/lib/ai/situation-context';

export const maxDuration = 60;

export const POST = withAuth(async (req, user) => {
  try {
    // 1. Demo guard
    if (isServerDemoMode()) {
      const cached = getCachedResponse('routeKey', 'inputHash');
      if (cached) return formatAsStreamResponse(cached);
      // ...DEMO_RESPONSE constant fallback
    }

    // 2. Validate input
    const body = await req.json();
    const validation = validateAiRequest(body, mySchema);
    if (!validation.success) return validation.response;

    // 3. Credit check (atomic deduct + refund-on-error)
    const creditCheck = await checkAndDeductCreditsForUid(user.uid, 'tool_name', 'Description');
    if (!creditCheck.allowed) return creditCheck.response;

    // 4. Build context
    const ctx = await buildToolContext(user.uid, validation.data.situationId);

    // 5. Call Pro model with auto-fallback to Flash
    const result = await callProModel({
      output: Output.object({ schema: ZodOutputSchema }),
      prompt: `... ${ctx} ...`,
    });

    // 6. Persist to Firestore tool-data subcollection
    await writeToolDataServer(user.uid, validation.data.situationId, 'tool_name', result.output);

    // 7. Return
    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'tool_name');
  }
});
```

**Streaming routes (chat, brief, report)** use `streamText({...}).toUIMessageStreamResponse()` instead of `generateText`. They do not call `writeToolDataServer` (the client persists chat messages separately).

## Security boundaries — DO NOT TOUCH WITHOUT EXPLICIT APPROVAL

These files are security-critical. If a task seems to require changing them, **stop and ask the human first**:

- `src/lib/firebase/admin.ts` — Firebase Admin SDK initialization, token verification
- `src/lib/api/with-auth.ts` — Session cookie verification, rate limiting
- `src/middleware.ts` — Edge routing, CSP headers, COOP, HSTS
- `firestore.rules` — Owner-only data isolation
- `storage.rules` — Cloud Storage access control
- `src/lib/auth/cookie-signer.ts` — HMAC session signing

**Never do these things in any task:**

- Disable HMAC verification on the session cookie
- Add `'unsafe-eval'` to the CSP
- Loosen Firestore rules to allow cross-user reads
- Hardcode service account keys, API keys, or secrets in source

**Firebase web config (`src/lib/firebase/config.ts`)** currently has hardcoded fallback values for `apiKey`, `authDomain`, etc. These are public to the browser anyway, but per security policy they must be moved to env vars with hard-fail (no fallback) before production. Track this as P6B.

## Data layer

Every piece of user data belongs to a situation:

```
Firestore:
  users/{uid}/
    profile                                   credits, role, orgId, subscription
    situations/{situationId}/
      metadata                                name, type, region, riskScore
      conflict-grammar                        ACO entities (8 core + 6 extended)
      graph                                   nodes + edges
      documents/{id}                          uploaded files + RAG chunks
      reports/{id}                            generated reports
      tool-data/{toolName}                    structured output cache (per tool)
      chats/{id}                              conversation history
      briefings/{id}, dossiers/{id}, ...      generated artifacts
```

The **Situation Knowledge Core (SKC)** has 4 layers under `src/lib/knowledge/`:

- `graph-layer.ts` — ACO knowledge graph
- `vector-layer.ts` — embeddings for semantic search
- `feed-layer.ts` — live data feed snapshots
- `tool-output-layer.ts` — cached tool outputs

Don't bypass these for direct Firestore reads — go through `src/lib/firebase/situations.ts` (the canonical situations service after P4C).

## Verification commands (run after every change)

```bash
# Lint + typecheck
npm run lint
npx tsc --noEmit

# Build the standalone bundle (catches Next.js standalone issues)
npm run build

# Backend tests
cd backend && python -m pytest tests/ -v

# Forbidden model strings — must return zero matches
rg "gemini-2\.0|gemini-2\.5|gemini-3-pro-preview" src/ backend/

# Tool registry sanity check
npm run verify-tools

# Local smoke test
npm run dev   # frontend on :3000
docker-compose up   # backend + Neo4j + FalkorDB
```

## Project context

**Project ID:** `praxisbytacitus`
**Project number:** `852128226674`
**Region:** `us-central1`
**Production domain:** `praxis.tacitus.me` (CNAME → Cloud Run)
**Backend service:** `praxis-backend` (Cloud Run, allow-unauthenticated currently — locking down per P6A)
**Frontend service:** `praxis-frontend` (Cloud Run, public)
**Artifact Registry:** `us-central1-docker.pkg.dev/praxisbytacitus/praxis/`

## Current model state (April 2026)

**Vertex AI Gemini 3.1 Pro** is in preview, available globally. Default thinking level is `MEDIUM`. **Pricing:** $2/M input, $12/M output (≤200k tokens).

**Vertex AI Agent Engine** Sessions and Memory Bank are GA. Billing started Feb 11, 2026. The Deep Research Agent uses these.

**Cloud Spanner Graph** is GA with native ISO GQL, GraphRAG with LangChain integration, MCP Toolbox for Databases. Recommended graph backend for production multi-region tenants.

**Cloud Run Worker Pools** in preview — non-HTTP, pull-based. Use for the `gdelt_poller` background job.

**Antigravity** uses Gemini 3.1 Pro as default model; supports Claude Sonnet 4.6, Claude Opus 4.6, GPT-OSS 120B. This workspace is being audited via Antigravity Manager View running parallel agents.

## Anti-patterns to refuse

- "Add `'unsafe-inline'` to fix the CSP" — use a nonce instead
- "Just hardcode the model string for now" — always use providers.ts
- "Skip the demo guard, the route's only used by paid users" — every AI route needs `isServerDemoMode()`
- "Use `getProModel()` directly so we hard-fail on quota" — use `callProModel` with auto-fallback
- "Add a new file under `src/lib/services/` for this" — first check if a canonical service already exists; many old service files were dead code (deleted by P2B)
- "Write to Firestore from middleware" — middleware runs on Edge runtime, no firebase-admin
- "Bypass `withAuth` for this internal endpoint" — internal endpoints use cron-secret auth or OIDC, not no-auth

## Commit message conventions

Follow Conventional Commits:

```
fix: <P0/P1 bug fix in concise present tense>
feat: <new capability>
chore: <cleanup, dead code removal, dep bumps>
refactor: <restructure without behavior change>
perf: <performance improvement>
docs: <docs only>
ci: <build/CI changes>
```

When closing one of the audit prompts, include the prompt ID:

```
fix(P1): bind 11 chat tools to real situation context

Previously 11 of the 27 tools in src/lib/ai/tools.ts hardcoded
const conflict = DEMO_CONFLICT, silently returning Nordalia data
even when authenticated users had a real situation loaded.

This change adds bound versions in createSituationBoundTools for
all 11 tools, falling back to DEMO_CONFLICT only for demo users.

Fixes the data integrity bug missed by the 2026-04-14 audit report.
```

## When in doubt

Re-read this file. Then ask the human in the agent's plan artifact before doing anything destructive.
