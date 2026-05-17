# Cleanup & Infra Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden CI, delete dead code, add repo hygiene files, and split the 2,285-line tasklet workbench into reviewable subcomponents. Zero UX changes.

**Architecture:** Pure cleanup pass. Each task is independent and commit-isolated so any task can be reverted without affecting the others. Workbench split is JSX extraction only — no state-model change.

**Tech Stack:** Next.js 16, TypeScript, Vitest, Python 3.11 + pytest, Google Cloud Build, gcloud CLI.

**Spec:** `docs/superpowers/specs/2026-05-16-cleanup-and-infra-design.md`

**Findings since spec was written:**
- `src/app/api/graph/ingest/route.ts` has zero callers in the repo and depends on `src/lib/services/conflict-service.ts` which is also only referenced by that route → both DELETE rather than auth-wrap.
- `src/app/api/agents/runs/[runId]/execute/route.ts` IS already protected by `verifyAgentWorkerRequest` (worker-auth). Only needs a documenting comment.
- Pub/Sub: only `profile.events` has a publisher (`src/lib/firebase/profile-events.ts`). The other four declared topics (`praxis.pipeline`, `praxis.extract`, `praxis.ingest`, `praxis.alert`) have no in-repo references → remove from `setup-gcp.sh`.

---

## Task 1: Add LICENSE

**Files:**
- Create: `LICENSE`

- [ ] **Step 1: Write the file**

```text
PROPRIETARY SOFTWARE LICENSE
Copyright © 2026 TACITUS. All Rights Reserved.

This software, including its source code, documentation, design assets, and
related materials (the "Software"), is the confidential and proprietary
property of TACITUS.

No part of the Software may be reproduced, distributed, transmitted, modified,
adapted, decompiled, reverse-engineered, or used to create derivative works,
in any form or by any means, without the prior written permission of TACITUS.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY ARISING FROM, OUT OF OR IN CONNECTION WITH
THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

For licensing inquiries: legal@tacitus.me
```

- [ ] **Step 2: Commit**

```bash
git add LICENSE
git commit -m "chore(repo): add proprietary LICENSE"
```

---

## Task 2: Add CONTRIBUTING.md

**Files:**
- Create: `CONTRIBUTING.md`

- [ ] **Step 1: Write the file**

```markdown
# Contributing to PRAXIS

PRAXIS is a proprietary TACITUS product. External contributions are not
accepted without a signed agreement; reach out to legal@tacitus.me first.

## Working on the codebase

Before you touch anything, read these in order:

1. `README.md`
2. `CLAUDE.md` — collaboration rules for human + AI agents
3. `AGENTS.md` — hard rules, validation gate, deploy procedure
4. `ARCHITECTURE.md`
5. `SECURITY.md` — must-read for any change touching auth, secrets, or rules

## Local quickstart

```bash
git clone https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git
cd A4_PRAXIS_CLOUD_Work
npm install
npm run dev
```

Backend + Neo4j + FalkorDB:

```bash
docker-compose up
```

## Validation gate (run before every PR)

```bash
npx tsc --noEmit
npm run lint
npm run build
npx vitest run
cd backend && pytest -q
```

## Commit style

Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`). One concern per commit.
Sign commits with the `Co-Authored-By:` trailer when authored with an AI agent.
```

- [ ] **Step 2: Commit**

```bash
git add CONTRIBUTING.md
git commit -m "chore(repo): add CONTRIBUTING.md"
```

---

## Task 3: Add CODEOWNERS

**Files:**
- Create: `CODEOWNERS`

- [ ] **Step 1: Write the file**

```text
# PRAXIS code owners
# https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-security/customizing-your-repository/about-code-owners

# Default owner for everything in the repo
*                                 @sargonxg

# Security-critical paths (require extra review when team grows)
/firestore.rules                  @sargonxg
/storage.rules                    @sargonxg
/src/middleware.ts                @sargonxg
/src/proxy.ts                     @sargonxg
/src/lib/firebase/admin.ts        @sargonxg
/src/lib/api/with-auth.ts         @sargonxg
/src/lib/auth/cookie-signer.ts    @sargonxg
/cloudbuild.yaml                  @sargonxg
/infrastructure/                  @sargonxg
```

- [ ] **Step 2: Commit**

```bash
git add CODEOWNERS
git commit -m "chore(repo): add CODEOWNERS"
```

---

## Task 4: Refresh SECURITY.md

**Files:**
- Modify: `SECURITY.md` (full rewrite)

- [ ] **Step 1: Overwrite the file**

```markdown
# PRAXIS Security

Last updated: 2026-05-16.

This file summarizes the active security posture, the review checklist, and
the incident-response procedure. It does not replace the implementation docs
in `CLAUDE.md`, `AGENTS.md`, `docs/AUTH.md`, `docs/COMPLIANCE.md`, and
`docs/GCP_OPERATIONS.md`.

## Core Rules

- Do not commit secrets.
- Do not print secrets in logs or final reports.
- Keep provider keys, Firebase Admin credentials, cookie-signing secrets,
  user-key master secrets, and billing secrets server-side only.
- Keep the Python backend private on Cloud Run.
- Browser clients call Next.js API routes, not private backend URLs.
- Admin APIs require authenticated admin sessions and allowlist checks.
- Destructive operations require explicit confirmation bodies.
- Public UI must not expose internal credit costs.

## Trust Boundary

- Frontend / API gateway: Next.js Cloud Run service.
- Backend: private FastAPI Cloud Run service.
- Service-to-service calls: Cloud Run OIDC with expected audience and trusted
  service-account allowlist.
- End-user identity: Firebase token or trusted internal `X-PRAXIS-UID` after
  service auth.
- Firestore and Storage access: rules plus server-side Admin SDK for privileged
  writes.

## Review Checklist

- [ ] Auth routes reject missing, malformed, expired, and forged sessions.
- [ ] Admin routes reject non-admin users.
- [ ] Backend service-only routes reject unauthenticated public calls.
- [ ] `X-PRAXIS-UID` is accepted only after trusted service authentication.
- [ ] Firestore rules protect billing, subscription, promo, and admin fields.
- [ ] Storage rules enforce ownership and avoid broad public reads.
- [ ] AI routes use schema validation and calibrated context.
- [ ] Calibrated AI routes reject malformed JSON, oversized bodies, excessive
      chat history, and very large aggregate text before credit deduction or
      model calls.
- [ ] Logs redact secrets, tokens, document text where inappropriate, and raw
      provider responses that may contain sensitive user data.
- [ ] Webhooks verify signatures.
- [ ] Cron / internal routes do not rely only on shared secrets when user impact
      is destructive.
- [ ] User API keys are encrypted with envelope encryption.
- [ ] Local secrets have a rotation procedure.

## Incident Response

**Report channel.** Suspected security issues go to `security@tacitus.me`.
Encrypted reports may use the PGP key published at `https://tacitus.me/.well-known/security.txt`.

**Severity matrix.**

| Severity | Definition | Response SLA | Resolution SLA |
|----------|------------|--------------|----------------|
| **P0 — Critical** | Active exploitation, data exfiltration, full auth bypass, secrets leak in public repo, billing fraud at scale | Acknowledge within 1 hour, 24/7 | Mitigation within 24 hours |
| **P1 — High** | Theoretical auth bypass, privilege escalation, persistent data corruption, single-user PII leak | Acknowledge within 4 hours (business) | Patch within 7 days |
| **P2 — Medium** | Information disclosure with limited impact, abuse / DoS without persistence, security-hardening gaps | Acknowledge within 2 business days | Patch within 30 days |
| **P3 — Low** | Best-practice deviations, defense-in-depth improvements | Acknowledge within 5 business days | Schedule next planning cycle |

**Triage flow.**

1. Reporter emails `security@tacitus.me` with reproduction steps and impact.
2. On-call (currently @sargonxg) assigns severity and opens a private incident
   doc in `docs/incidents/YYYY-MM-DD-<slug>.md` (gitignored until resolved).
3. For P0 / P1, rotate any exposed secrets immediately via Secret Manager and
   redeploy via Cloud Build with the rotation noted in the incident doc.
4. Land the fix on a private branch; merge to `main` only when verification
   passes the full `npm run audit:gate` plus the post-deploy smoke check.
5. Publish a post-mortem to `docs/incidents/` within 14 days of resolution
   (sanitized of attacker-specific detail when warranted).

**Specific runbooks** for the most common exposures live in
`docs/runbooks/SECURITY_RUNBOOK.md` (TODO: create as separate PR if missing).
Until then, the procedure for the four primary exposure classes is:

- **Provider key (Google AI, Anthropic, Firecrawl, etc.) leaked.** Rotate in
  the provider console → update Secret Manager version → redeploy → revoke the
  old key after the new revision is healthy.
- **Firebase Admin credential leaked.** Disable the service-account key in IAM
  → generate replacement → update `praxis-firebase-sa` secret → redeploy →
  audit Firestore logs for the leaked-key window.
- **Billing webhook abuse.** Disable the webhook endpoint, rotate the signing
  secret, replay missed events from the provider dashboard after the fix
  lands.
- **Accidental public exposure of the backend Cloud Run service.** Set
  `--no-allow-unauthenticated` immediately, audit access logs, and confirm
  `BACKEND_TRUSTED_SERVICE_ACCOUNTS` is enforced.

## Deeper References

- `docs/AUTH.md`.
- `docs/COMPLIANCE.md`.
- `docs/GCP_OPERATIONS.md`.
- `docs/OPERATIONAL_SPINE.md`.
- `firestore.rules`.
- `storage.rules`.
- `src/proxy.ts`.
- `backend/auth.py`.
- `TODO.md`.
```

- [ ] **Step 2: Commit**

```bash
git add SECURITY.md
git commit -m "docs(security): refresh SECURITY.md with incident response runbook"
```

---

## Task 5: Delete dead `graph/ingest` route and orphan conflict-service

**Files:**
- Delete: `src/app/api/graph/ingest/route.ts`
- Delete: `src/lib/services/conflict-service.ts`

**Pre-check:** confirm zero references outside the two files themselves.

- [ ] **Step 1: Verify dead status**

Run:
```bash
grep -rE "api/graph/ingest|from '@/lib/services/conflict-service'|from '../../../lib/services/conflict-service'" src/ backend/ tests/ --include="*.ts" --include="*.tsx" --include="*.py" || echo "ZERO MATCHES"
```

Expected: `ZERO MATCHES` (graphify-out artifacts are generated reports, not source — ignore them).

- [ ] **Step 2: Delete files**

```bash
rm src/app/api/graph/ingest/route.ts
rm src/lib/services/conflict-service.ts
# Also remove the now-empty directory if empty
rmdir src/app/api/graph/ingest 2>/dev/null || true
```

- [ ] **Step 3: Verify build still passes**

Run:
```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Add CHANGELOG entry**

In `CHANGELOG.md`, under `[Unreleased]` → `### Removed`, add:
```markdown
- Dead route `api/graph/ingest` and its orphan `conflict-service` (zero callers).
```
If `[Unreleased]` or `### Removed` does not yet exist, create them at the top.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: delete dead graph/ingest route and orphan conflict-service"
```

---

## Task 6: Document worker-auth on agents execute route

**Files:**
- Modify: `src/app/api/agents/runs/[runId]/execute/route.ts:1-7`

- [ ] **Step 1: Add documenting comment block above imports**

Edit the top of the file from:
```ts
import { NextResponse } from 'next/server';
import { verifyAgentWorkerRequest } from '@/lib/agent-runtime/worker-auth';
```

To:
```ts
/**
 * Internal worker-only execution endpoint.
 *
 * AUTH: gated by `verifyAgentWorkerRequest` (HMAC + worker token). NOT a
 * user-facing route. Do NOT add `withAuth` — browser sessions are rejected
 * by design. Worker authentication contract lives in
 * `src/lib/agent-runtime/worker-auth.ts`.
 */
import { NextResponse } from 'next/server';
import { verifyAgentWorkerRequest } from '@/lib/agent-runtime/worker-auth';
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/agents/runs/\[runId\]/execute/route.ts
git commit -m "docs(api): document worker-auth contract on agents execute route"
```

---

## Task 7: Purge unused Pub/Sub topics from `setup-gcp.sh`

**Files:**
- Modify: `infrastructure/setup-gcp.sh:59` (the topic-loop line)

- [ ] **Step 1: Verify which topics are actually used**

Run:
```bash
grep -rE "praxis\.(pipeline|extract|ingest|alert)|profile\.events" src/ backend/ cloud_functions/ --include="*.ts" --include="*.tsx" --include="*.py"
```

Expected output: only `profile.events` matches (in `src/lib/firebase/profile-events.ts`).

- [ ] **Step 2: Read the current loop**

Run:
```bash
sed -n '55,65p' infrastructure/setup-gcp.sh
```

You'll see something like:
```bash
for topic in praxis.pipeline praxis.extract praxis.ingest praxis.alert profile.events; do
  gcloud pubsub topics create "$topic" --project="$PROJECT_ID" 2>/dev/null || true
done
```

- [ ] **Step 3: Reduce to only the live topic**

Replace the loop with:
```bash
# Pub/Sub topics. Only `profile.events` has an active publisher
# (src/lib/firebase/profile-events.ts). Re-add other topics here when a
# publisher or subscriber is added in code.
for topic in profile.events; do
  gcloud pubsub topics create "$topic" --project="$PROJECT_ID" 2>/dev/null || true
done
```

- [ ] **Step 4: Add CHANGELOG entry**

Under `[Unreleased]` → `### Removed` in `CHANGELOG.md`, append:
```markdown
- Pub/Sub topics `praxis.pipeline`, `praxis.extract`, `praxis.ingest`, `praxis.alert` removed from `setup-gcp.sh` (zero publishers / subscribers in repo). Re-add when a real consumer lands.
```

- [ ] **Step 5: Commit**

```bash
git add infrastructure/setup-gcp.sh CHANGELOG.md
git commit -m "chore(infra): drop unused Pub/Sub topics from setup-gcp.sh"
```

---

## Task 8: Add post-deploy smoke check script

**Files:**
- Create: `infrastructure/verify-deployment.sh`

- [ ] **Step 1: Write the script**

```bash
#!/usr/bin/env bash
# Post-deploy smoke check. Polls the live frontend and API until both
# return 200, or fails after 60 seconds.
#
# Run from Cloud Build (post-deploy step) or locally:
#   ./infrastructure/verify-deployment.sh
#
# Override the target host via SMOKE_HOST env var (default praxis.tacitus.me).

set -euo pipefail

HOST="${SMOKE_HOST:-praxis.tacitus.me}"
DEADLINE=$(( $(date +%s) + 60 ))
URLS=(
  "https://${HOST}/"
  "https://${HOST}/api/health"
)

echo "[smoke] target host: ${HOST}"

while [[ $(date +%s) -lt ${DEADLINE} ]]; do
  ALL_OK=1
  for url in "${URLS[@]}"; do
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${url}" || echo "000")
    echo "[smoke] ${url} -> ${code}"
    if [[ "${code}" != "200" ]]; then
      ALL_OK=0
    fi
  done
  if [[ ${ALL_OK} -eq 1 ]]; then
    echo "[smoke] all green"
    exit 0
  fi
  sleep 5
done

echo "[smoke] FAILED after 60s — one or more endpoints did not return 200"
exit 1
```

- [ ] **Step 2: Make executable**

```bash
chmod +x infrastructure/verify-deployment.sh
```

- [ ] **Step 3: Smoke-test it locally**

Run:
```bash
./infrastructure/verify-deployment.sh
```

Expected: prints two 200s and `all green`. If non-200 returns, investigate before continuing.

- [ ] **Step 4: Commit**

```bash
git add infrastructure/verify-deployment.sh
git commit -m "feat(infra): add post-deploy smoke check script"
```

---

## Task 9: Wire vitest stage into Cloud Build

**Files:**
- Modify: `cloudbuild.yaml` (insert new step after `install-node-deps`, parallel with lint/typecheck)

- [ ] **Step 1: Insert step before the existing `build-app-gate` step**

After line 60 (the `audit-routes` step ends), and before line 62 (`smoke-public`), insert:

```yaml
  - name: 'node:20'
    entrypoint: bash
    args: ['-c', 'npx vitest run --reporter=dot']
    id: 'frontend-vitest'
    waitFor: ['install-node-deps']
```

Then modify the `build-app-gate` step's `waitFor` (currently `['lint', 'typecheck', 'audit-routes']`) to add `'frontend-vitest'`:

```yaml
    waitFor: ['lint', 'typecheck', 'audit-routes', 'frontend-vitest']
```

- [ ] **Step 2: Validate YAML**

Run:
```bash
python -c "import yaml; yaml.safe_load(open('cloudbuild.yaml'))" && echo "YAML OK"
```

Expected: `YAML OK`.

- [ ] **Step 3: Commit**

```bash
git add cloudbuild.yaml
git commit -m "ci: run vitest in cloudbuild and gate build on it"
```

---

## Task 10: Wire backend pytest stage into Cloud Build

**Files:**
- Modify: `cloudbuild.yaml` (insert new step parallel with the vitest one)

- [ ] **Step 1: Insert step just after the `frontend-vitest` step from Task 9**

```yaml
  - name: 'python:3.11-slim'
    entrypoint: bash
    args:
      - '-c'
      - |
        set -e
        cd backend
        pip install --quiet -e ".[dev]"
        pytest -q
    id: 'backend-pytest'
    waitFor: ['check-model-strings']
```

Then add `'backend-pytest'` to the `build-app-gate` `waitFor` list so deploys block on it:

```yaml
    waitFor: ['lint', 'typecheck', 'audit-routes', 'frontend-vitest', 'backend-pytest']
```

- [ ] **Step 2: Validate YAML**

```bash
python -c "import yaml; yaml.safe_load(open('cloudbuild.yaml'))" && echo "YAML OK"
```

- [ ] **Step 3: Local sanity-run**

```bash
cd backend && pytest -q
```

If any tests fail locally, fix the tests before pushing. Pytest failures will block Cloud Build once this lands.

- [ ] **Step 4: Commit**

```bash
git add cloudbuild.yaml
git commit -m "ci: run backend pytest in cloudbuild and gate build on it"
```

---

## Task 11: Wire smoke check into Cloud Build as final step

**Files:**
- Modify: `cloudbuild.yaml` (append step after `deploy-frontend`)

- [ ] **Step 1: Append step after the current last step (`deploy-frontend`, around line 272)**

Add immediately before the `images:` block:

```yaml
  # ── Post-deploy smoke check ────────────────────────────────────────────────
  # Fails the build if the frontend or /api/health does not return 200 within
  # 60s of the deploy completing. Surfaces regressions to the Cloud Build
  # alert channel; does NOT auto-rollback (that is a separate ops concern).
  - name: 'gcr.io/cloud-builders/curl'
    entrypoint: bash
    args:
      - '-c'
      - |
        set -e
        chmod +x infrastructure/verify-deployment.sh
        SMOKE_HOST=praxis.tacitus.me ./infrastructure/verify-deployment.sh
    id: 'post-deploy-smoke'
    waitFor: ['set-frontend-env']
```

- [ ] **Step 2: Validate YAML**

```bash
python -c "import yaml; yaml.safe_load(open('cloudbuild.yaml'))" && echo "YAML OK"
```

- [ ] **Step 3: Commit**

```bash
git add cloudbuild.yaml
git commit -m "ci: add post-deploy smoke check to cloudbuild"
```

---

## Task 12: Split `tasklet-praxis-workbench.tsx` — Extract `WorkbenchHeader`

**Files:**
- Create: `src/components/workbench/WorkbenchHeader.tsx`
- Modify: `src/components/praxis/tasklet-praxis-workbench.tsx`

- [ ] **Step 1: Read the parent file to locate the header JSX**

Run:
```bash
grep -n "WorkbenchHeader\|<header\|className=\".*header\"" src/components/praxis/tasklet-praxis-workbench.tsx | head -20
```

Identify the contiguous JSX block that renders the workbench's top bar (situation chip, title, mode switcher). Note the start line and end line. Note every prop it consumes from the parent's render scope.

- [ ] **Step 2: Create the new component file**

```tsx
// src/components/workbench/WorkbenchHeader.tsx
'use client';

import type { ReactNode } from 'react';

export interface WorkbenchHeaderProps {
  // Fill in the EXACT prop names you identified in Step 1.
  // Example shape — replace with actuals before saving:
  //   situationName: string;
  //   mode: 'compose' | 'review';
  //   onModeChange: (next: 'compose' | 'review') => void;
  //   actions?: ReactNode;
}

export function WorkbenchHeader(props: WorkbenchHeaderProps): ReactNode {
  // Paste the JSX block from the parent file here, verbatim.
  // Only change identifiers that referred to parent-scope variables —
  // those become props or destructured props.
  return null;
}
```

Replace the placeholder body and prop interface with the literal JSX + the exact closure variables you found.

- [ ] **Step 3: Replace the JSX block in the parent with the new component**

In `tasklet-praxis-workbench.tsx`, delete the original JSX block and replace with:

```tsx
<WorkbenchHeader
  /* same props you defined in the new file */
/>
```

Add at the top of the parent:
```ts
import { WorkbenchHeader } from '@/components/workbench/WorkbenchHeader';
```

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 5: Local smoke**

```bash
npm run dev
```

Open `http://localhost:3000/app` and confirm the workbench header looks identical to before (manual eyeball compare).

- [ ] **Step 6: Commit**

```bash
git add src/components/workbench/WorkbenchHeader.tsx src/components/praxis/tasklet-praxis-workbench.tsx
git commit -m "refactor(workbench): extract WorkbenchHeader subcomponent"
```

---

## Task 13: Split workbench — Extract `CapsuleColumn`

**Files:**
- Create: `src/components/workbench/CapsuleColumn.tsx`
- Modify: `src/components/praxis/tasklet-praxis-workbench.tsx`

Repeat the exact pattern from Task 12 for the capsule-list column.

- [ ] **Step 1: Identify the capsule-column JSX block in the parent file** (grep for `capsule`, `Capsule`, drop targets).
- [ ] **Step 2: Create `src/components/workbench/CapsuleColumn.tsx`** with all consumed parent-scope variables promoted to typed props.
- [ ] **Step 3: Replace the parent JSX with `<CapsuleColumn ... />`** and import.
- [ ] **Step 4: `npx tsc --noEmit`** — green.
- [ ] **Step 5: `npm run dev`** and visually confirm parity.
- [ ] **Step 6: Commit**

```bash
git add src/components/workbench/CapsuleColumn.tsx src/components/praxis/tasklet-praxis-workbench.tsx
git commit -m "refactor(workbench): extract CapsuleColumn subcomponent"
```

---

## Task 14: Split workbench — Extract `RuntimePanel`

**Files:**
- Create: `src/components/workbench/RuntimePanel.tsx`
- Modify: `src/components/praxis/tasklet-praxis-workbench.tsx`

Same pattern as Task 12 for the agent-runtime status / step log block.

- [ ] **Step 1: Identify runtime-panel JSX (grep `runtime`, `RuntimeStep`, `Step log`, etc.).**
- [ ] **Step 2: Create the file with promoted props.**
- [ ] **Step 3: Replace + import in parent.**
- [ ] **Step 4: `npx tsc --noEmit`** — green.
- [ ] **Step 5: `npm run dev`** + eyeball.
- [ ] **Step 6: Commit**

```bash
git add src/components/workbench/RuntimePanel.tsx src/components/praxis/tasklet-praxis-workbench.tsx
git commit -m "refactor(workbench): extract RuntimePanel subcomponent"
```

---

## Task 15: Split workbench — Extract `EvidenceDrawer`

**Files:**
- Create: `src/components/workbench/EvidenceDrawer.tsx`
- Modify: `src/components/praxis/tasklet-praxis-workbench.tsx`

Same pattern for the citation / source-fragment viewer block.

- [ ] **Step 1: Identify evidence-drawer JSX (grep `evidence`, `citation`, `source-fragment`).**
- [ ] **Step 2: Create file.**
- [ ] **Step 3: Replace + import.**
- [ ] **Step 4: `npx tsc --noEmit`** — green.
- [ ] **Step 5: `npm run dev`** + eyeball.
- [ ] **Step 6: Commit**

```bash
git add src/components/workbench/EvidenceDrawer.tsx src/components/praxis/tasklet-praxis-workbench.tsx
git commit -m "refactor(workbench): extract EvidenceDrawer subcomponent"
```

---

## Task 16: Split workbench — Extract `WorkbenchFooter`

**Files:**
- Create: `src/components/workbench/WorkbenchFooter.tsx`
- Modify: `src/components/praxis/tasklet-praxis-workbench.tsx`

Same pattern for the bottom actions / lock button / telemetry block.

- [ ] **Step 1: Identify footer JSX (grep `footer`, `lock`, `LockButton`).**
- [ ] **Step 2: Create file.**
- [ ] **Step 3: Replace + import.**
- [ ] **Step 4: `npx tsc --noEmit`** — green.
- [ ] **Step 5: `npm run dev`** + eyeball.
- [ ] **Step 6: Confirm parent line count**

```bash
wc -l src/components/praxis/tasklet-praxis-workbench.tsx
```

Expected: ≤ 400 lines. If still larger, find one more cohesive subcomponent to extract before the final commit.

- [ ] **Step 7: Commit**

```bash
git add src/components/workbench/WorkbenchFooter.tsx src/components/praxis/tasklet-praxis-workbench.tsx
git commit -m "refactor(workbench): extract WorkbenchFooter, parent now orchestrator-only"
```

---

## Task 17: Final verification gate

- [ ] **Step 1: Type + lint + build**

```bash
npx tsc --noEmit
npm run lint
npm run build
```

All green (warnings OK in lint).

- [ ] **Step 2: Vitest + relevant audits**

```bash
npx vitest run
npm run audit:repo-shape
npm run audit:calibration
npm run audit:cognee
```

All green.

- [ ] **Step 3: Backend pytest**

```bash
cd backend && pytest -q && cd ..
```

Green.

- [ ] **Step 4: Local boot smoke**

```bash
npm run dev
```

Open `http://localhost:3000/app/dashboard`, sign in (or skip if already authenticated), open the workbench, click through the capsule column → runtime panel → evidence drawer → footer lock. Confirm visual parity with pre-split.

- [ ] **Step 5: CHANGELOG bookkeeping**

Confirm `CHANGELOG.md` `[Unreleased]` lists:
- Added: CI vitest stage, CI pytest stage, post-deploy smoke check
- Changed: `tasklet-praxis-workbench` split into 5 subcomponents
- Removed: `api/graph/ingest` route, `conflict-service`, four unused Pub/Sub topics

- [ ] **Step 6: Final commit (if CHANGELOG dirty)**

```bash
git add CHANGELOG.md
git commit -m "docs(changelog): record cleanup & infra spec landing"
```

- [ ] **Step 7: Hand-off note**

The next spec in the sequence is `#2 Visual System Upgrade`. Brainstorm that one fresh — do not start coding visuals from this branch's momentum.
