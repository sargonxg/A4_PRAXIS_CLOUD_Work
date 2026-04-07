# PRAXIS Cloud Run Cleanup & Deployment Hardening

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Vercel-specific code, clean up redundant files/docs, ensure bulletproof Google Cloud Run deployment for project `praxisbytacitus` (852128226674).

**Architecture:** Dual-service on Cloud Run (Next.js frontend + Python FastAPI backend). Firebase Auth + Firestore. GCP services: Vertex AI, BigQuery, Cloud Storage, Pub/Sub, Cloud Functions, Cloud Scheduler, Secret Manager, Artifact Registry.

**Tech Stack:** Next.js 16.1.6, Python FastAPI, Firebase, GCP Cloud Run, Cloud Build

---

## File Map

**Files to DELETE:**
- `vercel.json` — Vercel-specific function timeouts and cron config
- `public/vercel.svg` — Vercel branding asset
- `public/next.svg` — Next.js branding asset (unused)
- `public/file.svg` — Default Next.js template asset (unused)
- `public/globe.svg` — Default Next.js template asset (unused)
- `public/window.svg` — Default Next.js template asset (unused)
- `PRAXIS_CLOUD_DEFINITIVE.md` — Redundant with CLAUDE.md
- `PRAXIS_CLOUD_EXPANSION.md` — Roadmap doc, not needed in repo
- `TOOL_AUDIT.md` — One-time audit, stale
- `ARCHITECTURE.md` — Redundant with CLAUDE.md
- `sentry.edge.config.ts` — Edge runtime not used on Cloud Run

**Files to MODIFY:**
- `src/app/layout.tsx` — Remove Vercel Analytics/SpeedInsights
- `src/lib/ai/providers.ts` — Remove Vercel AI Gateway/OIDC, simplify to direct providers
- `src/middleware.ts` — Remove `va.vercel-scripts.com` from CSP
- `package.json` — Remove `@vercel/analytics`, `@vercel/speed-insights`
- `.dockerignore` — Tighten exclusions
- `cloudbuild.yaml` — Add Cloud Scheduler cron job setup, fix project references
- `infrastructure/setup-gcp.sh` — Add Cloud Scheduler jobs for check-alerts and generate-briefing crons
- `infrastructure/deploy-frontend.sh` — Fix: uses gcr.io instead of Artifact Registry
- `backend/Dockerfile` — Optimize: add .dockerignore, multi-stage build
- `Dockerfile` (root) — Pin Node version, add healthcheck
- `src/app/api/cron/check-alerts/route.ts` — Update comments (Cloud Scheduler, not Vercel Cron)
- `src/app/api/cron/generate-briefing/route.ts` — Update comments (Cloud Scheduler, not Vercel Cron)
- `.env.example` — Update CRON_SECRET comment, remove Vercel references
- `.env.local.example` — Same

**Files to CREATE:**
- `backend/.dockerignore` — Backend-specific Docker exclusions

---

### Task 1: Remove Vercel-specific packages and components

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `package.json`

- [ ] **Step 1: Remove Vercel imports from root layout**

In `src/app/layout.tsx`, remove lines 3-4 (imports) and lines 78-79 (components):

```tsx
// REMOVE these imports:
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

// REMOVE these from the JSX body:
<Analytics />
<SpeedInsights />
```

The final `<body>` should be:
```tsx
<body className={`${ebGaramond.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}>
  <AuthProvider>
    {children}
  </AuthProvider>
</body>
```

- [ ] **Step 2: Remove Vercel packages from package.json**

Remove these two lines from the `dependencies` section of `package.json`:
```json
"@vercel/analytics": "^1.6.1",
"@vercel/speed-insights": "^2.0.0",
```

- [ ] **Step 3: Run npm install to update lockfile**

Run: `npm install`
Expected: package-lock.json updated, no errors

- [ ] **Step 4: Verify build still works**

Run: `npx next build 2>&1 | tail -20`
Expected: Build succeeds (may have warnings, no errors)

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx package.json package-lock.json
git commit -m "chore: remove @vercel/analytics and @vercel/speed-insights"
```

---

### Task 2: Delete Vercel config and unused assets

**Files:**
- Delete: `vercel.json`
- Delete: `public/vercel.svg`, `public/next.svg`, `public/file.svg`, `public/globe.svg`, `public/window.svg`

- [ ] **Step 1: Delete vercel.json**

```bash
rm vercel.json
```

- [ ] **Step 2: Delete unused public assets**

```bash
rm public/vercel.svg public/next.svg public/file.svg public/globe.svg public/window.svg
```

Verify remaining public files:
```bash
ls public/
```
Expected: `favicon.svg`, `robots.txt`, `sitemap.xml` (and any other app-specific assets)

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove vercel.json and unused public assets"
```

---

### Task 3: Remove redundant documentation files

**Files:**
- Delete: `PRAXIS_CLOUD_DEFINITIVE.md`, `PRAXIS_CLOUD_EXPANSION.md`, `TOOL_AUDIT.md`, `ARCHITECTURE.md`

- [ ] **Step 1: Delete redundant docs**

```bash
rm PRAXIS_CLOUD_DEFINITIVE.md PRAXIS_CLOUD_EXPANSION.md TOOL_AUDIT.md ARCHITECTURE.md
```

These are all redundant with CLAUDE.md (which is the authoritative project reference) or contain stale one-time content.

- [ ] **Step 2: Remove sentry.edge.config.ts**

```bash
rm sentry.edge.config.ts
```

Edge runtime config is Vercel-specific. Cloud Run uses standard Node.js — `sentry.server.config.ts` covers server-side.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove redundant docs and edge sentry config"
```

---

### Task 4: Rewrite providers.ts — remove Vercel AI Gateway, simplify to direct GCP providers

**Files:**
- Modify: `src/lib/ai/providers.ts`

This is the most important code change. The current file is built around Vercel AI Gateway (OIDC tokens). For Cloud Run, we use direct Google AI / Vertex AI / Anthropic providers.

- [ ] **Step 1: Rewrite providers.ts**

Replace the entire file with a Cloud Run-native version:

```typescript
/**
 * PRAXIS AI Provider Abstraction — Cloud Run Edition
 *
 * Auth priority on Cloud Run:
 *   1. Vertex AI via Application Default Credentials (ADC) — zero config on Cloud Run
 *   2. Google AI Studio via GOOGLE_AI_API_KEY — dev fallback
 *   3. Anthropic via ANTHROPIC_API_KEY — deep analysis
 *
 * All routes call getModel() / getProModel() / getAnalysisModel().
 */

import type { LanguageModel } from 'ai';

export type ProviderName = 'google' | 'vertex';

export interface ProviderInfo {
  name: ProviderName;
  displayName: string;
  modelId: string;
  groundedModelId: string;
  isConfigured: boolean;
  configNote: string;
}

// ---------------------------------------------------------------------------
// Model IDs
// ---------------------------------------------------------------------------

const MODEL_FLASH = 'gemini-2.5-flash';
const MODEL_PRO   = 'gemini-2.5-pro';

// ---------------------------------------------------------------------------
// Provider factory
// ---------------------------------------------------------------------------

function createModel(modelId: string): LanguageModel {
  if (process.env.GOOGLE_VERTEX_PROJECT && process.env.AI_PROVIDER === 'vertex') {
    const { createVertex } = require('@ai-sdk/google-vertex') as typeof import('@ai-sdk/google-vertex');
    return createVertex({
      project:  process.env.GOOGLE_VERTEX_PROJECT,
      location: process.env.GOOGLE_VERTEX_LOCATION || 'us-central1',
    })(modelId);
  }
  const { createGoogleGenerativeAI } = require('@ai-sdk/google') as typeof import('@ai-sdk/google');
  return createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_API_KEY || '' })(modelId);
}

function createAnthropicModel(): LanguageModel | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const { createAnthropic } = require('@ai-sdk/anthropic') as typeof import('@ai-sdk/anthropic');
  return createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })('claude-sonnet-4');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Standard model (gemini-2.5-flash) — chat, lightweight analysis, terminology. */
export function getModel(modelId?: string): LanguageModel {
  return createModel(modelId ?? MODEL_FLASH);
}

/** Pro model (gemini-2.5-pro) — structured tool generation, dossiers, reports. */
export function getProModel(): LanguageModel {
  return createModel(MODEL_PRO);
}

/**
 * Analysis model — Claude Sonnet if ANTHROPIC_API_KEY is set, else Gemini Pro.
 */
export function getAnalysisModel(): LanguageModel {
  return createAnthropicModel() ?? createModel(MODEL_PRO);
}

/**
 * Tool-specific model — same as getModel/getProModel but accepts pro flag.
 * userId param kept for future per-user tracking via BigQuery.
 */
export function getModelForTool(_toolTag: string, _userId?: string, pro = false): LanguageModel {
  return createModel(pro ? MODEL_PRO : MODEL_FLASH);
}

/** Grounded search model — Google AI Studio with Search grounding. */
export function getGroundedModel(modelId: string = MODEL_FLASH): LanguageModel {
  const { createGoogleGenerativeAI } = require('@ai-sdk/google') as typeof import('@ai-sdk/google');
  return createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_API_KEY || '' })(modelId);
}

/** User-preference model — routes to the model the user selected in settings. */
export function getModelForUser(settings?: { preferredModel?: string; model?: string }): LanguageModel {
  switch (settings?.preferredModel ?? settings?.model) {
    case 'gemini-2.5-pro':  return getProModel();
    case 'claude-sonnet-4': return getAnalysisModel();
    default:                return getModel();
  }
}

/** Async variant — kept for back-compat. */
export async function getModelAsync(modelId?: string): Promise<LanguageModel> {
  return getModel(modelId);
}

// ---------------------------------------------------------------------------
// Provider info — used by settings page and status indicators
// ---------------------------------------------------------------------------

export function getProviderInfo(): ProviderInfo {
  if (process.env.GOOGLE_VERTEX_PROJECT && process.env.AI_PROVIDER === 'vertex') {
    return {
      name:            'vertex',
      displayName:     'Google Vertex AI',
      modelId:         MODEL_FLASH,
      groundedModelId: MODEL_FLASH,
      isConfigured:    true,
      configNote:      `Project: ${process.env.GOOGLE_VERTEX_PROJECT} · Location: ${process.env.GOOGLE_VERTEX_LOCATION ?? 'us-central1'}`,
    };
  }
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  return {
    name:            'google',
    displayName:     'Google AI Studio',
    modelId:         MODEL_FLASH,
    groundedModelId: `${MODEL_FLASH} + Search Grounding`,
    isConfigured:    !!apiKey,
    configNote:      apiKey
      ? `API key configured (${apiKey.slice(0, 6)}...)`
      : 'Set GOOGLE_AI_API_KEY in environment',
  };
}

export function getAvailableProviders() {
  return {
    google: {
      name:         'Google AI Studio',
      configured:   !!process.env.GOOGLE_AI_API_KEY,
      model:        MODEL_FLASH,
      capabilities: ['Chat', 'Google Search Grounding', 'Tool Use', 'Streaming'],
      note:         'Primary provider — set GOOGLE_AI_API_KEY',
    },
    vertex: {
      name:         'Google Vertex AI',
      configured:   !!process.env.GOOGLE_VERTEX_PROJECT,
      model:        MODEL_FLASH,
      capabilities: ['VPC-SC', 'IAM', 'Audit Logs', 'Enterprise SLA', 'ADC Auth'],
      note:         'Set AI_PROVIDER=vertex + GOOGLE_VERTEX_PROJECT for Vertex',
    },
    anthropic: {
      name:         'Anthropic Claude',
      configured:   !!process.env.ANTHROPIC_API_KEY,
      model:        'claude-sonnet-4',
      capabilities: ['Deep Analysis', 'Diplomatic Language', 'Complex Reasoning'],
      note:         process.env.ANTHROPIC_API_KEY
        ? 'Active — used for deep analysis'
        : 'Set ANTHROPIC_API_KEY to enable Claude models',
    },
  };
}

// ---------------------------------------------------------------------------
// Legacy exports — back-compat for files that import raw provider instances
// ---------------------------------------------------------------------------

export const google = (() => {
  const { createGoogleGenerativeAI } = require('@ai-sdk/google') as typeof import('@ai-sdk/google');
  return createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_API_KEY || '' });
})();

export const models = {
  flash: google(MODEL_FLASH),
  pro:   google(MODEL_PRO),
} as const;
```

- [ ] **Step 2: Verify no broken imports**

Run: `npx tsc --noEmit 2>&1 | head -30`
Expected: No new type errors related to providers.ts exports

- [ ] **Step 3: Commit**

```bash
git add src/lib/ai/providers.ts
git commit -m "refactor: remove Vercel AI Gateway, use direct GCP providers"
```

---

### Task 5: Clean up middleware CSP and cron route comments

**Files:**
- Modify: `src/middleware.ts`
- Modify: `src/app/api/cron/check-alerts/route.ts`
- Modify: `src/app/api/cron/generate-briefing/route.ts`

- [ ] **Step 1: Remove va.vercel-scripts.com from CSP in middleware.ts**

In `src/middleware.ts`, line 86, in the `connect-src` directive, remove `va.vercel-scripts.com`.

Before:
```
connect-src 'self' ... va.vercel-scripts.com wss://*.firebaseio.com ...
```

After:
```
connect-src 'self' ... wss://*.firebaseio.com ...
```

- [ ] **Step 2: Update cron route comments**

In `src/app/api/cron/check-alerts/route.ts`, update comment from:
```
Runs daily at 06:00 UTC via Vercel Cron (configured in vercel.json)
```
To:
```
Runs daily at 06:00 UTC via Cloud Scheduler
```

In `src/app/api/cron/generate-briefing/route.ts`, update comment from:
```
Runs daily at 05:00 UTC via Vercel Cron (configured in vercel.json)
```
To:
```
Runs daily at 05:00 UTC via Cloud Scheduler
```

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts src/app/api/cron/check-alerts/route.ts src/app/api/cron/generate-briefing/route.ts
git commit -m "chore: remove Vercel CSP domain, update cron comments for Cloud Scheduler"
```

---

### Task 6: Optimize Dockerfiles

**Files:**
- Modify: `Dockerfile` (root — frontend)
- Modify: `backend/Dockerfile`
- Create: `backend/.dockerignore`

- [ ] **Step 1: Optimize frontend Dockerfile**

Read the current `Dockerfile`, then update it with:
- Healthcheck instruction
- Explicit EXPOSE
- Better layer caching

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_PRAXIS_BACKEND_URL
ENV NEXT_PUBLIC_PRAXIS_BACKEND_URL=$NEXT_PUBLIC_PRAXIS_BACKEND_URL
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1
CMD ["node", "server.js"]
```

- [ ] **Step 2: Optimize backend Dockerfile**

Replace `backend/Dockerfile` with a multi-stage build:

```dockerfile
FROM python:3.11-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends gcc g++ && \
    rm -rf /var/lib/apt/lists/*
COPY pyproject.toml ./
RUN pip install --no-cache-dir -e .

FROM python:3.11-slim AS runner
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY . .
ENV PORT=8080
ENV PYTHONUNBUFFERED=1
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import httpx; r = httpx.get('http://localhost:8080/health'); assert r.status_code == 200" || exit 1
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1"]
```

- [ ] **Step 3: Create backend/.dockerignore**

```
__pycache__
*.pyc
.pytest_cache
tests/
.env*
*.md
.git
```

- [ ] **Step 4: Verify Docker builds locally**

Run: `docker build -t praxis-frontend-test .`
Expected: Build succeeds

Run: `cd backend && docker build -t praxis-backend-test .`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add Dockerfile backend/Dockerfile backend/.dockerignore
git commit -m "perf: optimize Dockerfiles with multi-stage builds and healthchecks"
```

---

### Task 7: Fix deploy-frontend.sh (gcr.io to Artifact Registry)

**Files:**
- Modify: `infrastructure/deploy-frontend.sh`

- [ ] **Step 1: Update deploy-frontend.sh**

The script currently pushes to `gcr.io` which is deprecated. Update to use Artifact Registry at `us-central1-docker.pkg.dev`:

```bash
#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="praxisbytacitus"
REGION="us-central1"
REPO="us-central1-docker.pkg.dev/${PROJECT_ID}/praxis"
SERVICE="praxis-frontend"

# Get backend URL
BACKEND_URL=$(gcloud run services describe praxis-backend \
  --region="${REGION}" --format='value(status.url)' 2>/dev/null || echo "")

if [ -z "$BACKEND_URL" ]; then
  echo "WARNING: Backend not deployed yet. Deploy backend first."
  echo "Using placeholder URL — frontend won't connect to backend."
  BACKEND_URL="https://praxis-backend-placeholder.run.app"
fi

echo "Building frontend with BACKEND_URL=${BACKEND_URL}..."
docker build \
  --build-arg NEXT_PUBLIC_PRAXIS_BACKEND_URL="${BACKEND_URL}" \
  -t "${REPO}/${SERVICE}:latest" .

echo "Pushing to Artifact Registry..."
docker push "${REPO}/${SERVICE}:latest"

echo "Deploying to Cloud Run..."
gcloud run deploy "${SERVICE}" \
  --image="${REPO}/${SERVICE}:latest" \
  --region="${REGION}" \
  --platform=managed \
  --allow-unauthenticated \
  --memory=1Gi \
  --cpu=1 \
  --min-instances=1 \
  --max-instances=10 \
  --set-secrets="FIREBASE_SERVICE_ACCOUNT_KEY=firebase-sa-key:latest,GOOGLE_AI_API_KEY=google-ai-api-key:latest,CRON_SECRET=cron-secret:latest,COOKIE_SIGNING_SECRET=cookie-signing-secret:latest"

FRONTEND_URL=$(gcloud run services describe "${SERVICE}" --region="${REGION}" --format='value(status.url)')
echo ""
echo "Frontend deployed: ${FRONTEND_URL}"
```

- [ ] **Step 2: Commit**

```bash
git add infrastructure/deploy-frontend.sh
git commit -m "fix: deploy-frontend.sh uses Artifact Registry instead of deprecated gcr.io"
```

---

### Task 8: Add Cloud Scheduler cron jobs to setup-gcp.sh

**Files:**
- Modify: `infrastructure/setup-gcp.sh`

- [ ] **Step 1: Read current setup-gcp.sh and add cron jobs**

After the existing GDELT poller Cloud Scheduler job, add two more jobs for the Next.js cron routes (replacing vercel.json crons):

Add after the existing `gcloud scheduler jobs create http praxis-gdelt-poller` block:

```bash
# ── Cloud Scheduler: Daily Alert Check (06:00 UTC) ──────────────────────
echo "Creating Cloud Scheduler job: praxis-check-alerts..."
gcloud scheduler jobs create http praxis-check-alerts \
  --location="${REGION}" \
  --schedule="0 6 * * *" \
  --uri="https://praxis-frontend-${PROJECT_NUMBER}.${REGION}.run.app/api/cron/check-alerts" \
  --http-method=GET \
  --headers="Authorization=Bearer \$(gcloud auth print-identity-token)" \
  --oidc-service-account-email="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --oidc-token-audience="https://praxis-frontend-${PROJECT_NUMBER}.${REGION}.run.app" \
  --description="Daily conflict alert check" \
  --quiet 2>/dev/null || \
gcloud scheduler jobs update http praxis-check-alerts \
  --location="${REGION}" \
  --schedule="0 6 * * *" \
  --uri="https://praxis-frontend-${PROJECT_NUMBER}.${REGION}.run.app/api/cron/check-alerts" \
  --http-method=GET \
  --oidc-service-account-email="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --quiet

# ── Cloud Scheduler: Daily Briefing Generation (05:00 UTC) ───────────────
echo "Creating Cloud Scheduler job: praxis-generate-briefing..."
gcloud scheduler jobs create http praxis-generate-briefing \
  --location="${REGION}" \
  --schedule="0 5 * * *" \
  --uri="https://praxis-frontend-${PROJECT_NUMBER}.${REGION}.run.app/api/cron/generate-briefing" \
  --http-method=GET \
  --headers="Authorization=Bearer \$(gcloud auth print-identity-token)" \
  --oidc-service-account-email="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --oidc-token-audience="https://praxis-frontend-${PROJECT_NUMBER}.${REGION}.run.app" \
  --description="Daily intelligence briefing generation" \
  --quiet 2>/dev/null || \
gcloud scheduler jobs update http praxis-generate-briefing \
  --location="${REGION}" \
  --schedule="0 5 * * *" \
  --uri="https://praxis-frontend-${PROJECT_NUMBER}.${REGION}.run.app/api/cron/generate-briefing" \
  --http-method=GET \
  --oidc-service-account-email="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --quiet
```

Also add `PROJECT_NUMBER="852128226674"` near the top of the script alongside `PROJECT_ID`.

- [ ] **Step 2: Commit**

```bash
git add infrastructure/setup-gcp.sh
git commit -m "feat: add Cloud Scheduler jobs for daily alerts and briefing crons"
```

---

### Task 9: Update .env files — remove Vercel references

**Files:**
- Modify: `.env.example`
- Modify: `.env.local.example`

- [ ] **Step 1: Update CRON_SECRET comments in both files**

In both `.env.example` and `.env.local.example`, find the CRON_SECRET comment and change from:
```
# Secret for Vercel cron job auth + POST /api/admin/set-all-credits
```
To:
```
# Secret for Cloud Scheduler cron job auth + POST /api/admin/set-all-credits
```

Also remove any references to `vercel env pull` or `VERCEL_OIDC_TOKEN` in either file.

- [ ] **Step 2: Commit**

```bash
git add .env.example .env.local.example
git commit -m "chore: update env examples — remove Vercel references"
```

---

### Task 10: Update .dockerignore

**Files:**
- Modify: `.dockerignore`

- [ ] **Step 1: Update .dockerignore with tighter exclusions**

```
node_modules
.next
.git
.gitignore

# Backend and cloud functions are separate Docker builds
backend/
cloud_functions/
infrastructure/

# Documentation
*.md
docs/
CLAUDE.md

# Environment files
.env*
!.env.example

# IDE and OS
.vscode/
.idea/
*.swp
.DS_Store
Thumbs.db

# Test files
vitest.config.ts
src/__tests__/

# Config files not needed in Docker
vercel.json
firebase.json
firestore.rules
firestore.indexes.json
storage.rules
eslint.config.mjs
postcss.config.mjs
tsconfig.json
sentry.*.config.ts
```

- [ ] **Step 2: Commit**

```bash
git add .dockerignore
git commit -m "chore: tighten .dockerignore for smaller Docker context"
```

---

### Task 11: Verify full build and deployment readiness

**Files:** (read-only verification)

- [ ] **Step 1: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | tail -20`
Expected: No errors (warnings OK)

- [ ] **Step 2: Verify Next.js builds**

Run: `npx next build 2>&1 | tail -30`
Expected: Build completes successfully

- [ ] **Step 3: Verify Docker frontend build**

Run: `docker build -t praxis-frontend-verify .`
Expected: Build succeeds, image created

- [ ] **Step 4: Verify Docker backend build**

Run: `cd backend && docker build -t praxis-backend-verify .`
Expected: Build succeeds, image created

- [ ] **Step 5: Check no remaining Vercel references in source**

Run: `grep -r "vercel" src/ --include="*.ts" --include="*.tsx" -l`
Expected: No files (or only legitimate references like URL patterns in CORS)

Run: `grep -r "VERCEL_OIDC" src/ -l`
Expected: No files

- [ ] **Step 6: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: resolve any remaining issues from cleanup"
```

---

### Task 12: Update CLAUDE.md to reflect changes

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update CLAUDE.md**

Add a new section at the top after the version line:

```markdown
> Version 6.1.0 — Pure GCP Cloud Run (Vercel removed)
```

Update the "Env Vars" section to remove Vercel references. Remove any mention of `vercel.json`, Vercel Crons, `@vercel/analytics`, `@vercel/speed-insights`, Vercel AI Gateway, or `VERCEL_OIDC_TOKEN`.

Update cron job documentation to reference Cloud Scheduler instead of vercel.json.

Update the AI Model Tiers section — remove Vercel AI Gateway references, document direct provider usage.

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for v6.1.0 — pure GCP Cloud Run"
```
