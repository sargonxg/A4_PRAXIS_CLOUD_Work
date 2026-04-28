# Five-Pillar Tool Uplift — Risk Monitor, Briefing, Dashboard, Conflict Graph, Timeline + Ask PRAXIS Backbone

**Date:** 2026-04-28
**Author:** Claude Code (Opus 4.7)
**Status:** Approved — implementation in progress
**Owner:** Giulio Catanzariti

---

## Goal

Bring five core PRAXIS tools (Dashboard, Risk Monitor, Briefing Room, Conflict Graph, Timeline) up to a production-grade, deeply calibrated, agentic level — and fully wire Ask PRAXIS as the backbone every tool can rely on for live research, citations, and write-back.

The Ask PRAXIS backbone (`/api/ai/chat`) already calibrates on AnalystProfile + situation + SKC corpus search. This pass extends it with `writeToTool`, premium-vs-free tier gating, optional Firecrawl/Parallel keys awareness, and shared server-side utilities the other tools call into.

## Non-goals

- Rebuild any of the 73 AI routes from scratch.
- Touch the security boundary files (`firebase/admin.ts`, `with-auth.ts`, `middleware.ts`, `firestore.rules`, `storage.rules`, `cookie-signer.ts`) without explicit approval.
- Re-architect the calibration contract — `withCalibration` + `buildCalibratedContext` remain authoritative.

---

## Success criteria

A free user with a fresh situation should be able to:

1. Land on the dashboard, see a clear professional recap of who they are, their situation, and their tier status, without grey surfaces.
2. Ask PRAXIS a strategic question and get a cited, calibrated answer that draws on profile + situation + SKC corpus + ARGUS + uploaded docs, with premium tools offered (and gated) inline.
3. Click "Auto-populate" on Conflict Graph and have the system stage 12+ ACO nodes / 18+ typed edges from grounded research + onboarding context, then approve before commit.
4. Open Risk Monitor and see live grounded indicators with sources, expandable to time series and Ask-PRAXIS-this-indicator deep links.
5. Open Timeline and see live events from situation + ARGUS + grounded news + extracted documents, filterable, expandable, with citations.
6. Open Briefing Room and assemble a briefing from drag-drop blocks, each block generated from the same context backbone, with optional deep research / Firecrawl / Parallel when keys present, exportable to PDF/DOCX.
7. Premium-only tools and quotas surface inline warnings with upgrade CTAs — no surprise failures.

ML-readability: every generated tool output must be a Zod-validated structured payload (already true via AI SDK v6 `Output.object`) plus an optional `<script type="application/ld+json">` mirror for downstream agents.

---

## Phase 1 — Ask PRAXIS backbone

### Architecture

The existing `/api/ai/chat` route is the backbone. Extend it with:

- **New tool: `writeToTool`** — the LLM can persist a structured JSON payload to a tool slot under `users/{uid}/situations/{sitId}/tools/{toolId}`. Used by briefing-room block generation, risk indicator backfill, etc.
- **New tool: `firecrawlFetch`** — gated. Returns 402-style structured payload `{ requiresKey: true, providerUrl: ... }` when no `firecrawl_key` is present in `users/{uid}/settings/api_keys`. Otherwise scrapes URL content.
- **New tool: `parallelResearch`** — gated, same pattern, uses `parallel-web` package.
- **New tool: `runDeepResearch`** — calls `/api/ai/deep-research` (premium-tier only). Free users get a stub result with upgrade hint.
- **Tier gating** — extract `subscription` from user profile, expose `tier: 'free' | 'analyst' | 'team' | 'institution'` in calibration context. Non-free tools refuse with structured `{ requiresTier: '...' }` for free users so the UI can render an upgrade chip.

### Shared server library

`src/lib/ai/ask-praxis.ts` (new) — a server-side helper that any tool route can call to delegate a sub-question to the Ask PRAXIS backbone (e.g., briefing block "summarise the situation in 200 words"). Returns `{ text, citations[], toolCalls[] }`.

### Files

- `src/app/api/ai/ask-praxis/route.ts` — new dedicated streaming endpoint (mirrors chat but tighter for ASK use). For now we keep `chat/` as the canonical streaming endpoint and route Ask PRAXIS UI to it; `ask-praxis/route.ts` is a thin alias for clarity and future divergence.
- `src/lib/ai/tools.ts` — register four new tools.
- `src/lib/ai/ask-praxis.ts` — shared server helper.
- `src/lib/api/tier.ts` — new tier resolution helper.
- `src/components/app/floating-praxis.tsx` — surface tier warnings + premium key state.
- `src/components/assistant/chat-interface.tsx` — render tool-invocation chips for new tools (writeToTool, firecrawlFetch, parallelResearch, runDeepResearch).

### Validation

- `npx tsc --noEmit` clean.
- `npm run build` clean.
- `node scripts/audit-ai-routes.mjs` shows ask-praxis route either calibrated or exempt with rationale.
- Vitest unit on tier resolver and writeToTool guards.

---

## Phase 2 — Dashboard recap

### Visual changes

- Replace `bg-slate-900/50` and similar mid-grey card surfaces with `bg-slate-950 border border-slate-800` for darker professional surfaces; replace `bg-white` / `bg-slate-100` light surfaces with deep navy.
- Apply emerald + gold accents per design system.
- Mobile: ensure all widgets stack cleanly at sm breakpoint.

### New widgets

- `OnboardingRecapWidget` — reads `users/{uid}/profile/analyst`, renders identity (role, organisation, displayName), top 3 mandate chips, ordered lenses (chip row), regions of focus, audience, primary domain. Click → `/app/settings`.
- `SituationStatusStrip` — header strip with situation name, region, domain, riskScore, glaslStage, escalationTrend, source coverage badge, last update, document/entity counts, sparkline of risk over 30 days where data exists.
- `AccountStatusCard` — subscription tier badge, credits remaining, premium-key status (firecrawl, parallel — present / missing with copy-link to Settings), upgrade CTA.

### Layout

```
[ Header: greeting + situation name + Generate-daily-read CTA ]
[ Source coverage banner ]
[ SituationStatusStrip ]
[ OnboardingRecapWidget | AccountStatusCard ]
[ Risk gauge | Escalation | Recommended tools ]
[ Core tools | Advisors | Recent tools | Feed alerts ]
[ OperationalStatusPanel | ActivityFeed ]
[ Tool methodology ]
```

### Files

- `src/components/dashboard/onboarding-recap-widget.tsx` (new)
- `src/components/dashboard/situation-status-strip.tsx` (new)
- `src/components/dashboard/account-status-card.tsx` (new)
- `src/app/app/dashboard/page.tsx` — recompose layout, kill grey surfaces.
- Touch-up of existing dashboard widgets to match new surface palette.

---

## Phase 3 — Conflict Graph populate-from-onboarding

### Flow

1. User clicks **"Auto-populate from onboarding"** on `/app/conflict-graph`.
2. Frontend POSTs `/api/graph/populate?mode=from-onboarding`.
3. Server builds prompt from `AnalystProfile` + `Situation` (name, region, actors, description, sourceUrls) + uploaded documents (top 6 chunks via SKC vector layer) + grounded search (top 8 results).
4. `getProModel()` extracts entities + relationships using full ACO 14-types × 72-relationships schema. Targets minimum 12 nodes, 18 typed edges. Each node has `sources[]` and `confidence`.
5. Result writes to `users/{uid}/situations/{sitId}/graph/staged` (not `main`).
6. Frontend renders side-by-side **diff** (existing nodes/edges vs staged additions). User clicks **Approve** → server merges `staged → main` and clears staged. Approval recorded in `system_events`.
7. Re-runs use `mode=merge`: only new entities/edges added; idempotent.

### Files

- `src/app/api/graph/populate/route.ts` — extend to accept `mode` and `staged` writes.
- `src/lib/ai/graph-extractor.ts` (new or extend existing) — ACO-typed extraction prompt + Zod schema.
- `src/components/conflict-graph/auto-populate-panel.tsx` (new) — CTA + diff renderer + approve/cancel.
- `src/app/app/conflict-graph/page.tsx` — mount panel.

---

## Phase 4 — Risk Monitor + Timeline

### Risk Monitor

- New AI route `/api/ai/risk-indicators` — calibrated, returns `{ indicators: RiskIndicator[] }` where `RiskIndicator = { id, name, value, unit, trend, sourceUrl, sourceFeed, lastUpdated, confidence, framework }`.
- New `src/lib/constants/indicator-catalog.ts` — domain-specific indicator catalogs (armed-conflict-security, humanitarian, etc.) sourced from INFORM Risk Index, Glasl, Galtung Triangle, Stedman spoilers.
- Page replaces static `RISK_TIMELINE_DATA` import with `usePersistedToolData('risk-monitor')`.
- Each indicator card is expandable: time series chart, source pill chain, related-tool deep-link, "Ask PRAXIS about this indicator" CTA.

### Timeline

- New AI route `/api/ai/timeline-events` — calibrated, returns `{ events: TimelineEvent[] }` where `TimelineEvent = { id, ts, title, summary, type, severity, actors[], sources[], expandable: { details, citations, related } }`. Aggregates situation events + ARGUS alerts + extracted document events + grounded news.
- Page replaces static fixtures with live data via `usePersistedToolData('timeline')`.
- UX: filters (actor, type, severity, date-range), depth modes (simple ↔ detailed), expandable detail panes per event, drag to zoom, mobile.

### Files

- `src/app/api/ai/risk-indicators/route.ts` (new)
- `src/app/api/ai/timeline-events/route.ts` (new)
- `src/lib/constants/indicator-catalog.ts` (new)
- `src/lib/ai/risk-indicators.ts` (new)
- `src/lib/ai/timeline-events.ts` (new)
- `src/app/app/risk-monitor/page.tsx` — convert from fixtures to live.
- `src/app/app/timeline/page.tsx` — convert from fixtures to live.
- `src/components/risk-monitor/indicator-card.tsx` (new)
- `src/components/timeline/event-card.tsx` (new) and `expandable-event-pane.tsx` (new)

---

## Phase 5 — Briefing Room

### Architecture

`BriefingDocument` model:

```ts
type BriefingBlock =
  | { type: 'title'; content: string }
  | { type: 'executive-summary'; content: string; sources: Source[] }
  | { type: 'risk-assessment'; indicators: RiskIndicator[]; commentary: string; sources: Source[] }
  | { type: 'actor-snapshot'; actors: ActorSnapshot[]; sources: Source[] }
  | { type: 'timeline'; events: TimelineEvent[]; sources: Source[] }
  | { type: 'key-events'; events: { ts: string; title: string }[]; sources: Source[] }
  | { type: 'recommendations'; items: string[]; sources: Source[] }
  | { type: 'citation-list'; sources: Source[] }
  | { type: 'freeform'; markdown: string }
  | { type: 'chart'; chartType: 'line' | 'bar' | 'radar'; data: unknown };

type BriefingDocument = {
  id: string;
  type: 'morning' | 'security-council' | 'emergency' | 'mediation' | 'custom';
  status: 'draft' | 'review' | 'final';
  blocks: BriefingBlock[];
  profileVersion: number;
  createdAt: string;
  updatedAt: string;
};
```

### UX

- Three-pane: left = block library (drag source), centre = canvas (drop target with `@dnd-kit/sortable`), right = inspector (per-block sources, regenerate, ask-praxis-this-block).
- Top toolbar: briefing type preset (selecting one auto-loads a default block layout), "Run deep research" CTA (premium, calls Vertex ADK Deep Research Agent or grounded fallback), source toggles (situation, ARGUS, docs, Firecrawl, Parallel — disabled with tooltip if no key), export (PDF/DOCX).
- Reminder banner if Firecrawl/Parallel keys missing: link to Settings.
- Drafts saved to `users/{uid}/situations/{sitId}/tools/briefing/drafts/{draftId}` and selectable from a "Recent drafts" dropdown.

### Files

- `src/app/app/briefing/page.tsx` — rewrite to block-based builder (preserve existing slide-renderer fallback for read-mode of existing data).
- `src/components/briefing/block-library.tsx` (new)
- `src/components/briefing/briefing-canvas.tsx` (new)
- `src/components/briefing/block-renderer.tsx` (new) — switches on block type.
- `src/components/briefing/inspector.tsx` (new)
- `src/components/briefing/export-controls.tsx` (existing logic — keep + extend for new model)
- `src/app/api/ai/brief-builder/route.ts` (new) — accepts `{ blockType, briefingType, contextOverrides }`, returns a single block JSON.
- `src/lib/ai/briefing-blocks.ts` (new) — per-block generators.
- `src/types/briefing.ts` (new) — types above.

---

## Cross-cuts

### Premium gating

- New helper `src/lib/api/tier.ts` resolves user tier from Firestore (`users/{uid}.subscription`) with sensible default `'free'`. Demo mode stays unlimited.
- New helper `requireTier(min: Tier)` returns either `{ ok: true }` or `{ ok: false, requiresTier, currentTier }`.
- Tools that need keys: read `users/{uid}/settings/api_keys` and either succeed or return `{ requiresKey: 'firecrawl' | 'parallel' | ... }`.
- UI: a shared `<UpgradeChip />` and `<MissingKeyChip />` component pair shown inline next to disabled CTAs.

### ML readability

Each tool output already returns Zod-validated JSON via AI SDK v6 `Output.object`. We add an optional `<script type="application/ld+json">` mirror render in `ToolOutputFrame` for future agent consumers.

### Docs to update

- `CHANGELOG.md` — `[Unreleased] — 2026-04-28` section per phase.
- `docs/CONTINUATION.md` — top entry summarising what shipped + what's next.
- `docs/SPRINT_BACKLOG.md` — mark phases done with commit hashes.
- `docs/AGENTIC_SYSTEM.md` — note the new tools (writeToTool, firecrawlFetch, parallelResearch, runDeepResearch) and how Ask PRAXIS routes heavy questions.
- `docs/tools/INDEX.md` — refresh per-tool spec for Dashboard, Risk Monitor, Briefing, Conflict Graph, Timeline.
- `CLAUDE.md` — confirm fresh-clone start instructions still hold; add new tier helper to Conventions.

### Validation gate (per phase)

```bash
npx tsc --noEmit
npm run build
node scripts/audit-ai-routes.mjs
node scripts/audit-gcp.mjs   # only when ready to deploy
npx vitest run
```

### Deploy

Run `./infrastructure/deploy.sh` (Cloud Build) at the end of the session. Confirm Cloud Run revisions for both frontend and backend ready, then smoke `curl https://praxis.tacitus.me/`.

---

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Live data grounding fails for free users | Always fall back to grounded Google Search via `getModel()`; surface coverage banner. |
| Drag-drop briefing breaks existing read-mode | Keep slide renderer as a read-mode fallback when document.blocks empty. |
| Auto-populate floods graph with low-confidence garbage | Stage-then-approve flow + min-confidence threshold + sources required per node. |
| Cloud Build deploy failure | Validate locally first; document hash of last green commit in CHANGELOG. |
| Token budget overrun in single session | Commit per phase; document state in CONTINUATION; leave clean handoff if a phase slips. |

---

## Out-of-session follow-ups

- Premium webhook integration with Stripe Meters (already partially scaffolded).
- Vertex ADK Deep Research Agent full wiring (currently a stub for free fallback).
- Briefing collaborative real-time editing (multi-user) — out of scope.
