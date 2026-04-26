# Codex Kickoff — PRAXIS Strategic Uplift (Sprint 1)

**Repo:** https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work
**Workspace:** `C:\Users\giuli\praxiscodexworking` (fresh clone every Monday)
**Plan:** `docs/superpowers/specs/2026-04-26-strategic-uplift-sprint-plan.md`
**Codex invocation:** `codex -a never -s danger-full-access`
**Personality:** `pragmatic` · Model: `gpt-5.5` · Reasoning effort: `medium`

---

## 0. Bootstrap (do this **once per sprint Monday**, before opening Codex)

Open **PowerShell 7** and run, in order:

```powershell
# 0.1 Wipe any prior working folder so we start clean
if (Test-Path "C:\Users\giuli\praxiscodexworking") {
  Remove-Item -Recurse -Force "C:\Users\giuli\praxiscodexworking"
}

# 0.2 Fresh clone
New-Item -ItemType Directory -Force -Path "C:\Users\giuli\praxiscodexworking" | Out-Null
git clone https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git "C:\Users\giuli\praxiscodexworking"
Set-Location "C:\Users\giuli\praxiscodexworking"

# 0.3 Auth sanity (no secrets printed)
gcloud config list --format=json | Select-String -Pattern "account|project|region" | Select-Object -First 6
firebase login:list --json | Select-Object -First 5

# 0.4 Install + first compile to confirm baseline is green
npm install
npx tsc --noEmit
npm run build

# 0.5 Open Codex in this folder
codex -a never -s danger-full-access
```

**If `npm install` reports vulnerabilities, do NOT run `npm audit fix --force`.** That will be addressed surgically inside the Codex session (Sprint 1 — Thursday).

---

## 1. The prompt to paste into Codex (verbatim)

> Copy everything between the fences into the Codex TUI as your first message.

```
You are working inside C:\Users\giuli\praxiscodexworking — a fresh clone of
https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work (PRAXIS by TACITUS).

Codex was launched with: codex -a never -s danger-full-access
Personality: pragmatic. Model: gpt-5.5. Reasoning: medium.

────────────────────────────────────────────────────────────────────────
WHAT THIS PROJECT IS
────────────────────────────────────────────────────────────────────────
PRAXIS is the AI-native workspace for policy, diplomacy, and political
analysis. Next.js 16 frontend + Python FastAPI backend on GCP Cloud Run
(project praxisbytacitus, region us-central1, domain praxis.tacitus.me).

48 tool pages under src/app/app/, 49 AI routes under src/app/api/ai/,
11 live data feeds, 11-domain taxonomy, AnalystProfile calibration
contract, 4 advisor voices, 15 analytical frameworks. ACO v2 conflict
ontology powers the graph backend.

────────────────────────────────────────────────────────────────────────
READ THESE FIRST (in this order, do not skip)
────────────────────────────────────────────────────────────────────────
1. CLAUDE.md                                              — full conventions
2. AGENTS.md                                              — agent quick links
3. README.md                                              — overview, scripts, deploy
4. docs/CONTINUATION.md                                   — last session handoff
5. docs/superpowers/specs/2026-04-26-strategic-uplift-sprint-plan.md
                                                          — THE plan you execute
6. docs/superpowers/specs/2026-04-24-praxis-completion-master-plan.md
                                                          — Phases A→D you're layering on
7. docs/superpowers/specs/2026-04-21-tool-improvement-roadmap.md
                                                          — tool-by-tool roadmap context
8. CHANGELOG.md (last 200 lines only)                     — recent shipped state

After reading, post a 6-bullet summary in the chat:
  • current PRAXIS version
  • what the last session shipped
  • what Sprint 1 will deliver (5 days)
  • acceptance gates per day
  • known blockers (lint, npm vulns, etc.)
  • commit + author rules

────────────────────────────────────────────────────────────────────────
HARD RULES (non-negotiable)
────────────────────────────────────────────────────────────────────────
- Working dir: C:\Users\giuli\praxiscodexworking ONLY. Never touch
  C:\Users\giuli\A4_PRAXIS_CLOUD_Work or any other PRAXIS clone.
- Author = giuliocatanzariti@gmail.com ONLY. NO `Co-Authored-By` lines
  on any commit. Verify with `git log -1 --format=%an %ae` after commit.
- Never commit secrets. .env*, auth.json, *.pem, id_rsa*, *.key are
  off-limits — read-only at most. gitleaks pre-commit must remain green.
- Every shell call wraps with `rtk` when an RTK filter exists
  (see ~/.claude/CLAUDE.md golden rule). Examples:
      rtk git status           rtk npm run build
      rtk vitest run           rtk gh pr view <num>
- Mobile-ready bar: any user-facing change renders cleanly on a
  380-pixel-wide viewport without horizontal scroll.
- Single source of model strings: src/lib/ai/providers.ts. Never
  hardcode `gemini-*` outside that file. Verify with:
      rg "gemini-2\.0|gemini-2\.5|gemini-3-pro-preview" src/ backend/
  Must return zero matches. If not, that's the first bug to fix.
- Security boundary files require an explicit confirmation before edit:
  src/lib/firebase/admin.ts, src/lib/api/with-auth.ts,
  src/middleware.ts, firestore.rules, storage.rules,
  src/lib/auth/cookie-signer.ts.

────────────────────────────────────────────────────────────────────────
SPRINT 1 — FREE-TIER FOUNDATION + ONBOARDING HONESTY
Week 2026-04-27 → 2026-05-01 (5 deliverables, one per day)
Personas: Quinn (free prospect), Amara (humanitarian), all (settings)
────────────────────────────────────────────────────────────────────────

DAY 1 — MON — Settings → API Keys v2 (server-only writes + validation)
WHAT: Finish master-plan Phase A6. All user API keys round-trip through
      server-side routes that envelope-encrypt with AES-256-GCM
      (src/lib/crypto/envelope.ts already exists). Plaintext writes from
      the client are removed. Per-provider live validation.
FILES TO TOUCH:
  - src/app/app/settings/api-keys/page.tsx          (rewrite to call API only)
  - src/app/api/settings/api-keys/route.ts          (POST/GET, list status)
  - src/app/api/settings/api-keys/validate/route.ts (live key check, no persist)
  - src/app/api/settings/api-keys/[provider]/route.ts (DELETE)
  - src/lib/providers/user-keys.ts                  (server helper)
  - infrastructure/bootstrap-user-key-master.sh     (idempotent secret create)
  - firestore.rules                                 (deny client read of *_encrypted)
  - scripts/migrate-user-api-keys.mjs               (already exists; verify)
TESTS:
  - tests/integration/api-keys.test.ts
      • POST encrypts then GET returns masked value, never plaintext
      • DELETE removes only the named provider
      • Validate hits real provider with timeout 5 s
  - tests/unit/envelope.test.ts
      • NIST GCM vector pass
      • AAD mismatch fails decryption (uid|provider replay protection)
RUN:
      rtk vitest run tests/integration/api-keys.test.ts tests/unit/envelope.test.ts
      rtk npm run migrate:user-api-keys -- --commit   (only on staging-mirror data)
COMMIT:
      rtk git add -A
      rtk git commit -m "feat(settings): server-only API key writes with envelope crypto"
ACCEPTANCE:
  • Adding ACLED key in Settings shows live "Validated" within 5 s.
  • users/{uid}/settings/api_keys (plaintext) returns empty after migration.
  • npx tsc --noEmit clean. node scripts/audit-ai-routes.mjs clean.

DAY 2 — TUE — Tier-aware empty states everywhere
WHAT: Every dashboard widget + humanitarian + geospatial-monitor +
      risk-monitor renders a meaningful state when its data feed is
      missing-key, platform-only, or simply empty. No console errors,
      no blank cards.
FILES TO TOUCH:
  - src/components/app/dashboard-widgets/*.tsx
  - src/app/app/{humanitarian,geospatial-monitor,risk-monitor}/page.tsx
  - src/lib/data-feeds/capabilities.ts              (already strong; consume)
  - src/components/praxis/feed-empty-state.tsx      (new — reusable)
TESTS:
  - tests/components/feed-empty-state.test.tsx
  - tests/e2e/free-tier-dashboard.spec.ts
      • brand-new user (Playwright fixture) lands on dashboard
      • all widgets render either data or an explainer card
      • no console errors during render
RUN:
      rtk vitest run tests/components/feed-empty-state.test.tsx
      rtk playwright test tests/e2e/free-tier-dashboard.spec.ts
COMMIT:
      rtk git commit -m "feat(ux): tier-aware empty states across dashboard + humanitarian + geospatial + risk"
ACCEPTANCE:
  • New keyless user sees zero error widgets. Every "missing" state
    has one CTA linking to the right Settings anchor.

DAY 3 — WED — Onboarding honesty pass
WHAT: Step 2 gets a Domain confirm card (auto-suggest from
      classifyDomain + 1-click override). Step 3 gets a Capability
      preview pulled from resolveFeedCapabilities. Step 4 (Done)
      surfaces a "Add an API key now" deep link for users whose
      lenses lean premium (security, legal_ihl).
FILES TO TOUCH:
  - src/app/onboarding/step-perspective.tsx
  - src/app/onboarding/step-working-style.tsx
  - src/app/onboarding/completion-success.tsx
  - src/lib/domain/classifier.ts                    (already exists; consume)
  - src/lib/data-feeds/capabilities.ts              (consume)
TESTS:
  - tests/onboarding/domain-confirm.test.tsx
  - tests/onboarding/capability-preview.test.tsx
  - tests/e2e/onboarding-newuser.spec.ts
      • signup → 4 steps → land in /app/dashboard with 4+ widgets rendered
      • refresh mid-Step 2 → resume preserves Step 1 input
RUN:
      rtk vitest run tests/onboarding/
      rtk playwright test tests/e2e/onboarding-newuser.spec.ts
COMMIT:
      rtk git commit -m "feat(onboarding): domain confirm + capability preview + premium-key deep link"
ACCEPTANCE:
  • Inés-persona dry run: time from signup to dashboard ≤ 4 minutes.
  • Quinn-persona dry run: dashboard usable with zero keys configured.

DAY 4 — THU — Secret hygiene + critical npm vuln
WHAT: Add gitleaks pre-commit (.pre-commit-config.yaml) and a CI step
      (.github/workflows/ci.yml) that runs gitleaks on PR. Identify the
      one critical npm vulnerability and apply the minimum-blast-radius
      fix (targeted package bump, not `npm audit fix --force`).
FILES TO TOUCH:
  - .pre-commit-config.yaml                         (new)
  - .github/workflows/ci.yml                        (add gitleaks job)
  - package.json + package-lock.json                (targeted bump only)
TESTS:
  - tests/integration/gitleaks-pre-commit.test.sh   (fixture .env with fake key blocks commit)
RUN:
      rtk pre-commit run --all-files
      rtk npm audit --omit=dev    (must report 0 critical after fix)
      rtk npm run build
COMMIT (two commits — keep them distinct):
      rtk git commit -m "ci(sec): gitleaks pre-commit + CI step"
      rtk git commit -m "fix(deps): resolve critical production vulnerability — <package> <fromVer>→<toVer>"
ACCEPTANCE:
  • npm audit --omit=dev: 0 critical.
  • Pre-commit blocks fixture-secret commit; passes clean tree.

DAY 5 — FRI — Settings shell consolidation + ship to staging
WHAT: One shell at /app/settings with 5 sub-pages (Profile, API Keys,
      Model Preferences, Graph Backend, Notifications). No tool-local
      settings dialogs. Then ship to staging Cloud Run.
FILES TO TOUCH:
  - src/app/app/settings/layout.tsx                 (shell with nav)
  - src/app/app/settings/{profile,api-keys,model-preferences,graph-backend,notifications}/page.tsx
  - remove any per-tool settings drawers
TESTS:
  - tests/e2e/settings-shell.spec.ts
      • each sub-page reachable via shell nav
      • back/forward preserves sub-page
RUN (full preflight):
      rtk npx tsc --noEmit
      rtk npm run build
      rtk node scripts/audit-ai-routes.mjs
      rtk npm run audit:gcp
      rtk vitest run
      rtk npm run smoke:public
COMMIT:
      rtk git commit -m "feat(settings): consolidate to single shell with 5 sub-pages"
DEPLOY TO STAGING:
      gcloud config set project praxisbytacitus
      gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus \
        --substitutions=_TARGET=staging
POST-DEPLOY VERIFY:
      curl -sI https://staging.praxis.tacitus.me/
      curl -sI https://staging.praxis.tacitus.me/login
      curl -sI https://staging.praxis.tacitus.me/onboarding
      curl -s  https://staging.praxis.tacitus.me/api/health   (expect "ok")
WRITE-UP:
      Append a "Sprint 1 — what shipped" section to docs/CONTINUATION.md
      Add a `[Unreleased] — 2026-05-01` entry to CHANGELOG.md
      rtk git commit -m "docs: Sprint 1 progress note + changelog entry"
ACCEPTANCE FOR FULL SPRINT:
  • All 5 days' acceptance criteria pass.
  • Staging URL serves /onboarding for a new user end-to-end.
  • golden-path Playwright passes (will be tightened further in Sprint 6).

────────────────────────────────────────────────────────────────────────
END-OF-SPRINT REPORT (post in chat before stopping)
────────────────────────────────────────────────────────────────────────
Print a markdown table:

| Deliverable | Status | Proof (file path or command output line) | Commit SHA |
|---|---|---|---|

Then list:
  • Any deviations from this plan and why
  • Any items deferred to Sprint 2 with one-line justification
  • npm vuln state (critical / high / moderate counts)
  • Staging URL and a sample golden-path screen-recording path

DO NOT START SPRINT 2 UNLESS EXPLICITLY ASKED.
DO NOT DEPLOY TO PRODUCTION (praxis.tacitus.me) IN SPRINT 1. STAGING ONLY.
DO NOT TOUCH security boundary files without an explicit human "yes".
```

---

## 2. Per-day verification gates (cheat sheet)

If at any point a gate fails, **stop, post the failure, ask before patching the gate itself.**

```bash
# Type check
rtk npx tsc --noEmit

# Production build
rtk npm run build

# AI route compliance (every route has withCalibration + credit key + schema)
rtk node scripts/audit-ai-routes.mjs

# GCP resource readiness (APIs, secrets, indexes, Pub/Sub topics, Scheduler jobs)
rtk npm run audit:gcp

# Per-tool calibration scoring
rtk npm run audit:tools

# Vitest unit + integration
rtk vitest run

# Playwright unauth smoke
rtk npm run smoke:public

# Playwright signed-in golden path
rtk npm run smoke:golden-path

# Backend pytest (if backend/ touched)
cd backend && python -m pytest tests/ -v
```

**The four-pass deploy gate (production):**
```bash
rtk npx tsc --noEmit && \
rtk npm run build && \
rtk node scripts/audit-ai-routes.mjs && \
rtk npm run audit:gcp
```

If all four pass, then and only then:
```bash
gcloud config set project praxisbytacitus
gcloud builds submit --config=cloudbuild.yaml --project=praxisbytacitus
# Verify
curl -sI https://praxis.tacitus.me/
curl -sI https://praxis.tacitus.me/login
curl -sI https://praxis.tacitus.me/onboarding
curl -s  https://praxis.tacitus.me/api/health
```

---

## 3. Commit + author discipline

Author and email are enforced repo-locally. Confirm before the first commit:

```bash
rtk git config user.name  "Giulio Catanzariti"
rtk git config user.email "giuliocatanzariti@gmail.com"
rtk git config --local commit.gpgsign false   # only if your global gpgsign causes prompts
```

After every commit, verify:
```bash
rtk git log -1 --format="%an <%ae>"
```

If the line ever shows `Co-Authored-By:` in the body or any other email, **revert and re-commit**.

---

## 4. Subsequent sprints

Each sprint Monday: re-run the **§0 Bootstrap** block (fresh wipe + clone). That guarantees no leftover state from the previous week's experimentation.

The sprint plan file `docs/superpowers/specs/2026-04-26-strategic-uplift-sprint-plan.md` defines deliverables per day for Sprints 2 → 6. When kicking off a new sprint, paste the corresponding sprint section into Codex with the same WHAT / FILES / TESTS / RUN / COMMIT / ACCEPTANCE structure shown above for Sprint 1.

---

## 5. When you (Codex) are stuck

- **Build fails:** read the first error, not the last; fix root cause; do not silence types with `any`.
- **Test fails:** verify the test premise before patching the test. The test was probably right.
- **Hook blocks a command:** read the hook output; adjust the action; never bypass with `--no-verify`.
- **Permission denied:** ask the human in chat — do not try sudo, escalation, or skipping the sandbox.
- **Network call hangs:** kill it; use the resilient-fetch wrapper at `src/lib/data-feeds/resilient-fetch.ts`.
- **Plan ambiguity:** ask — do not guess. Reply in the chat with the choices you see and your recommendation.

---

*— End of kickoff prompt. Last updated 2026-04-26.*
