# Claude Tandem Prompts — 2026-04-25

Use these prompts in Claude Code only after pulling latest `main`. Each prompt
has a file ownership boundary so Claude and Codex do not collide.

## Prompt 1 — Landing + Onboarding Source Truth

```text
You are Claude Code working in tandem with Codex on PRAXIS.

First run:
git pull origin main
git status

Read: CLAUDE.md, AGENTS.md, CHANGELOG.md, docs/CONTINUATION.md,
docs/SPRINT_EXECUTION_PLAN_2026-04-25.md, docs/COMPLIANCE.md,
docs/GCP_OPERATIONS.md.

Task: clean stale source/vendor claims in public landing, onboarding, and
system-health copy. PRAXIS has pivoted away from ACLED, Firecrawl, and
Anthropic. The current stack is Google Cloud / Firebase / Vertex AI,
GDELT, UCDP, ReliefWeb, HDX, UN News, World Bank, and grounded Google Search.

Own only these files:
- src/components/landing/*
- src/app/(landing)/*
- src/app/onboarding/*
- src/components/onboarding/*
- src/app/app/settings/system-health/page.tsx
- docs/EXTERNAL_TOOLS_WIRING.md
- docs/CONTEXT_INJECTION.md only for feed examples/copy

Do not touch:
- cloudbuild.yaml
- infrastructure/*
- cloud_functions/*
- backend/*
- src/hooks/use-activity-feed.ts
- src/components/app/activity-feed.tsx
- src/app/app/dashboard/page.tsx

Definition of done:
- No user-facing CTA tells users to configure ACLED, Firecrawl, or Anthropic.
- Feed/source descriptions are truthful and compliance-safe.
- Onboarding still explains why analyst profile/context improves outputs.
- npm run build and npx tsc --noEmit pass.
- Update CHANGELOG.md and docs/CONTINUATION.md with exactly what changed.
```

## Prompt 1A — Current Handoff After Codex Workspace Preferences

```text
You are Claude Code working in tandem with Codex on PRAXIS.

First run:
git pull origin main
git status
git log --oneline -5

Read in order:
- CLAUDE.md
- AGENTS.md
- CHANGELOG.md, especially the 2026-04-26 workspace-personalization entry
- docs/CONTINUATION.md
- docs/SPRINT_EXECUTION_PLAN_2026-04-25.md
- docs/CLAUDE_TANDEM_PROMPTS_2026-04-25.md
- docs/COMPLIANCE.md

Current Codex lane just completed or is committing:
- durable user workspace tool preferences in users/{uid}/preferences/default
- new fields: hiddenToolIds, toolOrder
- sidebar applies hidden/reordered tools and shows analyst role/domain
- Settings > Preferences exposes show/hide and move controls

Do not touch these Codex-owned files unless Giulio explicitly asks you to take over:
- src/components/app/app-sidebar.tsx
- src/app/app/settings/preferences/page.tsx
- src/hooks/use-user-preferences.ts
- src/lib/navigation/tool-preferences.ts
- src/types/preferences.ts
- tests/api/preferences.test.ts
- tests/types/preferences.test.ts
- tests/unit/lib/navigation/tool-preferences.test.ts

Your non-conflicting task:
Clean stale source/vendor claims in public landing, onboarding, and
system-health copy. PRAXIS has pivoted away from ACLED, Firecrawl, Anthropic,
Tavily, and Parallel.ai as user-facing promises. The current public stack is
Google Cloud / Firebase / Vertex AI, GDELT, UCDP, ReliefWeb, HDX, UN News,
World Bank, and grounded Google Search. Be precise and compliance-safe.

Own only:
- src/components/landing/*
- src/app/(landing)/*
- src/app/onboarding/*
- src/components/onboarding/*
- src/app/app/settings/system-health/page.tsx
- docs/EXTERNAL_TOOLS_WIRING.md
- docs/CONTEXT_INJECTION.md only for feed examples/copy

Do not touch:
- cloudbuild.yaml
- infrastructure/*
- cloud_functions/*
- backend/*
- src/components/app/*
- src/hooks/*
- src/app/app/settings/preferences/page.tsx
- src/types/preferences.ts

Definition of done:
- No user-facing CTA tells users to configure ACLED, Firecrawl, Anthropic,
  Tavily, or Parallel.ai.
- Feed/source descriptions are truthful and compliance-safe.
- Onboarding still explains why analyst profile/context improves outputs.
- Login/landing do not claim named institutional trust unless the repo has
  evidence and permission.
- Update CHANGELOG.md and docs/CONTINUATION.md with exactly what changed.
- Run npx tsc --noEmit and npm run build. Run focused tests if you touch
  test-covered onboarding components.
- Commit and push to main with no Co-Authored-By line.

After that, report:
- commit hash
- files changed
- build/typecheck result
- any stale-source references intentionally left for a later backend/API pass
```

## Prompt 2 — Onboarding Completion Payoff

```text
You are Claude Code working in tandem with Codex on PRAXIS.

First run:
git pull origin main
git status

Read: docs/SPRINT_EXECUTION_PLAN_2026-04-25.md, docs/CONTEXT_INJECTION.md,
src/lib/dashboard/role-recommendations.ts, src/app/onboarding/completion-success.tsx.

Task: improve the onboarding completion screen so the user sees how their
role/domain/audience choices will shape the workspace.

Own only:
- src/app/onboarding/completion-success.tsx
- src/app/onboarding/live-preview.tsx if needed
- src/lib/dashboard/role-recommendations.ts only if a small read-only export is needed

Do not touch dashboard, activity feed, API routes, backend, cloud functions,
or infrastructure.

Definition of done:
- Completion screen shows a concise calibration summary and top recommended tools.
- The copy is policy-professional, not marketing-heavy.
- No raw internal prompt XML is displayed by default.
- Build/typecheck pass.
- Update CHANGELOG.md.
```

## Prompt 3 — Situation Detail Overview

```text
You are Claude Code working in tandem with Codex on PRAXIS.

First run:
git pull origin main
git status

Read: docs/SPRINT_EXECUTION_PLAN_2026-04-25.md, docs/OPERATIONAL_SPINE.md,
src/app/app/situations/[id]/page.tsx, src/components/praxis/situation-dashboard.tsx,
src/components/app/activity-feed.tsx.

Task: replace the redirect-only /app/situations/[id] page with a real
situation overview: title, status, source/document health, graph health,
latest activity, and next recommended actions.

Own only:
- src/app/app/situations/[id]/page.tsx
- src/app/app/situations/[id]/*
- src/components/praxis/situation-dashboard.tsx if reusing existing display pieces

Do not touch:
- src/hooks/use-activity-feed.ts
- backend/*
- cloud_functions/*
- infrastructure/*

Definition of done:
- /app/situations/[id] is useful without redirecting to settings.
- Activity feed is mounted with situationId but no new Firestore queries/indexes.
- Empty/loading/error states are professional.
- Build/typecheck pass.
- Update CHANGELOG.md and docs/CONTINUATION.md.
```

## Prompt 4 — Tool Spec Documentation Batch

```text
You are Claude Code working in tandem with Codex on PRAXIS.

First run:
git pull origin main
git status

Read: docs/tools/_TEMPLATE.md, docs/tools/INDEX.md,
src/lib/constants/tool-registry.ts, and the page/API route for each target tool.

Task: write deep specs for top-traffic tools without changing runtime code.
Target docs in order:
- docs/tools/assistant.md
- docs/tools/risk-monitor.md
- docs/tools/early-warning.md
- docs/tools/briefing.md
- docs/tools/media-roundup.md

Own only docs/tools/* and docs/tools/INDEX.md.

Definition of done:
- Each spec follows the template.
- Each spec lists page file, API route, data sources, persistence path,
  context/calibration expectations, empty/error states, and test gaps.
- No runtime files changed.
```

## Prompt 5 — Post-Implementation Review

```text
You are Claude Code reviewing Codex's latest PRAXIS implementation.

First run:
git pull origin main
git log --oneline -5

Review only, do not edit:
- backend/routers/pipeline.py
- cloud_functions/gdelt_poller/*
- src/hooks/use-activity-feed.ts
- src/components/app/activity-feed.tsx
- src/app/app/dashboard/page.tsx
- src/app/api/notifications/[id]/route.ts
- src/app/app/admin/operator-console/page.tsx

Find bugs, deploy risks, Firestore rules/index mismatches, auth mistakes,
or user-facing regressions. Output findings ordered by severity with file
and line references. If no blocking issues, say so and list residual risks.
```
