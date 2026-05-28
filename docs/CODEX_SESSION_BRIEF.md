# PRAXIS Codex Session Brief

Use this file at the start of Codex sessions in this checkout.

## Repository

- Path: `C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work`
- Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`
- Primary branch: `main`
- Canonical cloud project: `praxisbytacitus`
- Region: `us-central1`
- Live app: `https://praxis.tacitus.me`

## First Reads

1. `AGENTS.md`
2. `CLAUDE.md`
3. `ARCHITECTURE.md`
4. `docs/product/README.md`
5. `docs/product/PRAXIS_CANONICAL_APP_STRUCTURE.md`
6. `docs/product/CONTEXT_CAPSULE_POLICY_RESEARCH_GUIDE.md`
7. `docs/architecture/PRAXIS_ARCHITECTURE.md`
8. `docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md`
9. `docs/GCP_OPERATIONS.md`
10. `graphify-out/GRAPH_REPORT.md`

## Product Boundaries

- Keep the visible product simple: Ask PRAXIS and the existing cockpit/workbench surfaces are the primary user-facing shell.
- Do not add new top-level app pages or primary navigation unless explicitly requested.
- Keep Firestore/ContextCapsules canonical. Treat graph/Cognee/Neo4j-style enrichment as optional, reviewable, and non-authoritative unless promoted by a specific plan.
- Preserve visible runtime proof. Do not fake model, source, or agent status.
- Keep public claims aligned to the current stack: Google Cloud/Firebase/Vertex AI, grounded Google Search, optional crawlers, user documents, and Wikipedia background.

## Start Checks

```powershell
git fetch origin
git status --short --branch
git rev-list --left-right --count origin/main...HEAD
& "$HOME\.codex\scripts\codex-ready.ps1" -Repo "C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work" -Mode quick
```

If ADC fails:

```powershell
gcloud config configurations activate tacitus
gcloud config set project praxisbytacitus
gcloud config set run/region us-central1
gcloud auth login --update-adc
gcloud auth application-default login --project=praxisbytacitus
gcloud auth application-default set-quota-project praxisbytacitus
npm run auth:doctor -- --fix
```

## Fast Validation

Use for ordinary coding checkpoints:

```powershell
npm run typecheck
npm run test
npm run auth:doctor
npm run audit:gcp
```

Use focused tests for touched files where possible.

## Full Local Gate

Use before claiming broad readiness:

```powershell
npm run build
npm run lint
npm run audit:repo-shape
npm run audit:gate
npm run audit:architecture-reference
npm run audit:gcp
node scripts/audit-ai-routes.mjs
npx vitest run
```

Known caveat: lint warnings are tracked technical debt. Build, typecheck, route audit, GCP audit, repo-shape audit, and focused tests should pass before a deploy checkpoint.

## Ship Gate

Only run this lane when the user asks to ship, deploy, or verify live:

```powershell
git fetch origin
git status --short --branch
git rev-list --left-right --count origin/main...HEAD
npm run build
npm run audit:gcp
npm run deploy:frontend:cloud
gcloud run services describe praxis-frontend --project=praxisbytacitus --region=us-central1 --format="value(status.latestReadyRevisionName,status.url)"
```

Live proof should include:

- `https://praxis.tacitus.me/`
- `https://praxis.tacitus.me/api/health`
- `https://praxis.tacitus.me/api/health/runtime`
- Protected runtime routes returning the expected unauthenticated status when no session cookie is present.

## Common Local Blockers

- ADC can expire while normal `gcloud` user auth and Firebase auth still work.
- `.tmp-next-dev.pid` can be stale after interrupted dev-server runs.
- `verify-tools` can fail on route-registry mismatches even when typecheck/tests pass.
- Local shell env gaps are not automatically production outages; verify deployed Cloud Run separately.

## Agent Role Hints

- Use `repo_cartographer` before large changes.
- Use `explorer` for focused evidence gathering.
- Use `docs_researcher` for API/framework release notes.
- Use `frontend_qa` for browser-visible behavior.
- Use `cloud_ops_auditor` for GCP/Firebase/IAM checks.
- Use `dependency_curator` for package updates.
- Use `reviewer` before finalizing risky code.
- Use `release_manager` for ship/deploy/live proof.
