# PRAXIS Persona QA Wave — 2026-04-29

## Objective

Continue the agentic improvement loop with real browser checks, persona-based
evaluation, and immediate fixes for high-impact trust and workflow defects.
This wave focuses on demo-to-product coherence because the demo workspace is
the first serious proof point for non-authenticated evaluators.

## Environment

- Workspace: `C:\Users\giuli\praxiscodexworking`
- Local app: `http://localhost:3100`
- Browser tool: `agent-browser 0.26.0`
- Session mode tested: unauthenticated, local demo session
- Known limitation: real paid/authenticated browser QA with live user data and
  live AI credentials remains separate from demo-session QA.

## Persona Inputs Collected

### 1. First-Time User

- Entry points checked: `/`, `/pricing`, `/privacy`, `/terms`,
  `/login?mode=demo`, `/demo/dashboard`.
- What they need: understand what PRAXIS does within the first minute and see a
  believable sample workspace.
- Finding: the demo dashboard loaded, but product positioning still used a
  comparison phrase instead of PRAXIS's own product promise.
- Action: updated the demo banner to describe the PRAXIS sample workspace and
  clearly label synthetic Nordalia data.
- Verification target: no visible "Bloomberg Terminal" copy in active demo UI.

### 2. Serious Customer / Buyer

- Entry points checked: `/demo/dashboard`, `/demo/briefing`,
  `/demo/conflict-graph`, `/demo/risk-monitor`.
- What they need: trust that sample outputs are not silently pretending to be
  live intelligence.
- Finding: the dashboard brief showed an admin-facing AI configuration failure
  message in demo mode, which reads like a broken product to evaluators. The
  live feed empty state also named a retired source credential instead of the
  current broader feed posture.
- Action: demo mode now renders a situation-derived brief from the active
  synthetic situation instead of exposing provider setup internals. The feed
  empty state now describes event and humanitarian feed credentials generally
  and keeps AI Search as the immediate next action.
- Verification target: demo brief shows situation update, priority actions, and
  watch points without claiming live AI generation.

### 3. Returning User

- Entry points checked: `/demo/scenarios`, `/demo/assistant`,
  `/demo/sources`, `/demo/global-search`.
- What they need: stable navigation and consistent workspace language across
  tools.
- Finding: routes loaded without framework overlays after demo session was
  active; copy consistency still needs broader sidebar/tool-by-tool cleanup.
- Action: logged the remaining consistency task for follow-up; this wave fixed
  the most visible dashboard and assistant prompt language.
- Verification target: repeated route opens should not flip back to login once
  the demo session is active.

### 4. Power User / Analyst

- Entry points checked: dashboard, conflict graph, risk monitor, scenarios,
  briefing.
- What they need: output surfaces that explain what is computed from situation
  data, what is synthetic demo data, and what requires real AI/provider access.
- Finding: the Daily Intelligence Brief did not distinguish demo experience
  from live provider readiness.
- Action: demo brief is now computed from situation primitives available in the
  current workspace: name, region, actors, risk framing, and analysis tools.
- Verification target: real mode still fails clearly when AI is unavailable;
  demo mode remains useful without pretending to be live model output.

### 5. Skeptical Security / Trust Reviewer

- Entry points checked: unauthenticated `/app/dashboard`, demo login, demo
  dashboard.
- What they need: fail-closed auth, no leaked provider or secret details, and
  transparent data provenance.
- Finding: unauthenticated app route redirected correctly. The demo dashboard
  exposed operational AI-provider setup language that was unnecessary for the
  demo user.
- Action: removed the provider setup message from demo mode only; preserved
  explicit failure messaging for real mode.
- Verification target: `/app/dashboard` still redirects to login without a
  session, and demo UI does not leak deployment setup instructions.

## Changes Implemented In This Wave

- `src/components/onboarding/demo-mode-banner.tsx`
  - Replaced stale competitive positioning with PRAXIS sample-workspace copy.
  - Explicitly labels synthetic Nordalia data and production grounding posture.
- `src/components/praxis/situation-dashboard.tsx`
  - Added `buildDemoDailyBrief` for deterministic, situation-derived demo
    briefing text.
  - Demo mode bypasses `/api/health` and `/api/ai/chat` for the daily brief.
  - Real mode still uses the live AI path and still surfaces real provider
    failure when generation is unavailable.
- `src/app/api/ai/chat/route.ts`
  - Replaced stale assistant system-prompt positioning with a direct PRAXIS
    mission statement focused on situations, sources, graph primitives, cited
    assessments, briefings, and decision support.
- `src/components/praxis/intelligence-feed.tsx`
  - Removed retired provider-specific setup copy from the empty state.
  - Hid zero-count event-feed filter chips until event items are present.
- `src/components/onboarding/welcome-modal.tsx`
  - Aligned the demo welcome modal with the current Nordalia contested-border
    sample workspace and changed AI/provider language to sample-workspace
    language.
- `src/components/app/app-sidebar.tsx`,
  `src/components/praxis/tool-info-from-registry.tsx`, and
  `src/components/assistant/chat-interface.tsx`
  - Cleaned active UI/helper copy that still surfaced retired source language.

## 5 Critical Items — Current Status

1. Demo trust gap in dashboard brief — fixed in this wave.
2. Stale product/source positioning in demo and assistant context — fixed in
   touched active surfaces; broader docs/history references remain non-runtime.
3. Auth fail-closed behavior for protected app route — verified manually in
   browser smoke.
4. Real Executive Intelligence authenticated QA — still open; requires a real
   authenticated session and live provider credentials.
5. Full route-by-route console/network capture — partially complete; needs
   automation through Playwright or scripted `agent-browser`.

## 5 Secondary Items — Current Status

1. Broader sidebar/tool copy coherence — queued.
2. Mobile demo dashboard pass — queued.
3. Slow-network loading state pass — queued.
4. Formal persona test fixture scripts — queued.
5. Update historical docs with current product language — queued, lower risk
   because runtime surfaces were prioritized.

## Recheck Commands

```powershell
rg -n "Bloomberg Terminal|AI service is not yet configured|ACLED_API_KEY" src\components\praxis\situation-dashboard.tsx src\components\onboarding\demo-mode-banner.tsx src\components\praxis\intelligence-feed.tsx src\app\api\ai\chat\route.ts
npx tsc --noEmit
npx eslint src/components/praxis/situation-dashboard.tsx src/components/onboarding/demo-mode-banner.tsx src/components/onboarding/welcome-modal.tsx src/components/praxis/intelligence-feed.tsx src/components/app/app-sidebar.tsx src/components/praxis/tool-info-from-registry.tsx src/components/assistant/chat-interface.tsx src/app/api/ai/chat/route.ts
agent-browser open http://localhost:3100/demo/dashboard
agent-browser wait --load networkidle
agent-browser get text body
```

## Validation Completed

- `rg -n "Bloomberg Terminal|AI service is not yet configured|ACLED_API_KEY|Powered by Vertex AI / Gemini|Nordalia Crisis scenario"` on touched active runtime files: no matches.
- `npx tsc --noEmit`: passed.
- Targeted `npx eslint` on touched TS/TSX files: passed with no errors; the
  remaining warnings are existing warning debt in `situation-dashboard.tsx`.
- `agent-browser open http://localhost:3100/demo/dashboard` and
  `agent-browser get text body`: confirmed the demo banner, daily brief,
  intelligence-feed empty state, and welcome modal now show the corrected copy.
- `npm run build`: passed. Remaining warning: Next.js reports the existing
  `middleware` file convention deprecation and recommends `proxy`.

## Next Iteration

Run a scripted persona matrix across desktop and mobile:

1. New user: landing -> pricing -> demo -> dashboard -> first tool.
2. Serious customer: demo dashboard -> Executive Intelligence -> export.
3. Returning user: direct demo route opens and session continuity.
4. Power user: three tool outputs, reload persistence, export/share behavior.
5. Security reviewer: protected route redirect, API failure shape, no secret or
   provider leakage in UI.
