# PRAXIS Next Bricks — 2026-04-26

Purpose: a single concrete punch list for the next Codex / Claude Code
sessions. Pulls together the open items surfaced during the 2026-04-26
public-UX / onboarding / tool-audit lane and the settings/landing pass
that followed. Pair with `docs/SPRINT_EXECUTION_PLAN_2026-04-25.md`,
`docs/PRAXIS_HIGH_IMPACT_PRODUCT_PLAN_2026-04-26.md`, and the new
`docs/tools/UX_AUDIT_2026-04-26.md`.

If a brick is taken, mark `[in progress: <agent>]` next to it and
strike it through when shipped to `main`.

---

## Lane assignments at 2026-04-26 EOD

| Lane | Owner | Files |
|---|---|---|
| Public UX / source truth | Claude Code (this session) | `src/components/landing/*`, `src/app/(auth)/login`, `src/app/app/settings/system-health` |
| Onboarding first-run UX | Claude Code (this session) | `src/app/onboarding/*`, `src/components/onboarding/*`, `src/app/app/situations/new`, `src/components/praxis/situation-onboarding.tsx` |
| Workspace personalization | Codex | `src/lib/auth/auth-context.tsx`, `src/components/app/app-sidebar.tsx`, `src/components/dashboard/recommended-tools-widget.tsx`, `src/lib/navigation/tool-preferences.ts`, `src/lib/dashboard/role-recommendations.ts`, `src/types/preferences.ts`, `src/hooks/use-user-preferences.ts` |
| Operational spine | Codex | `cloud_functions/*`, `infrastructure/*`, `cloudbuild.yaml`, `backend/*`, `firestore.rules`, `firestore.indexes.json` |
| Tool audit doc | Claude Code | `docs/tools/UX_AUDIT_2026-04-26.md` |
| BYO graph backend copy | Claude Code (this session) | `src/app/app/settings/graph-backend/page.tsx` |

---

## Top 10 high-impact bricks for the next 7 days

Each brick is sized to be completable in one focused session. They are
ordered by user-visible impact × shippability.

### 1. Tool ID canonicalization sweep
- Problem: registry uses hyphen IDs (`risk-monitor`), routes use
  underscore IDs (`risk_assessment`), and pages mix both. Persistence
  scatters across `tools/{toolId}` (legacy) and `tool-data/{toolId}`
  (UI/SKC) with mismatched keys. Sidebar, recent-tools, dependency
  resolution, and "Why this output?" provenance all drift.
- Action: build a central `toolKey()` helper consumed by every save
  path, registry resolution, sidebar status, persisted-tool hook, and
  SKC dependency resolver. Migrate two of the worst offenders first:
  Briefing Room (`briefing` vs `briefing_room`), Daily Brief
  (`auto-briefings` / `auto-briefing` / `daily_brief`), Conflict Graph,
  Early Warning. Documents at the top of `docs/tools/UX_AUDIT_2026-04-26.md`.
- Files: `src/lib/services/tool-data-service.ts`,
  `src/lib/api/save-tool-output.ts`, the migrating pages, the matching
  routes.
- Owner: Codex, after current preferences/dashboard work lands.

### 2. Canonical tool-output envelope
- Problem: tool outputs are saved with inconsistent shapes — some have
  `generatedAt`, others have `version`, others lack provenance. SKC
  retrieval, "Why this output?" inspector, and cross-tool memory all
  need a stable contract.
- Action: define `ToolOutputEnvelope` with
  `{ toolId, schemaVersion, data, generatedAt, version, profileVersion,
  domainVersion, model, sources[], confidence, assumptions[],
  approvedFacts[], retrievalTrace }`. Apply to one high-value tool first
  (Briefing Room) and migrate others incrementally.
- Files: new `src/types/tool-output.ts`, `src/lib/api/save-tool-output.ts`,
  `src/lib/knowledge/tool-output-layer.ts`, the touched tool's route +
  page.
- Owner: Codex.

### 3. Humanitarian tool real route
- Problem: Humanitarian page hits `/api/ai/chat` instead of a structured
  route. No `withCalibration`, no Zod schema, no persistence. ReliefWeb,
  HDX, and OCHA grounding aren't applied.
- Action: build `/api/ai/humanitarian/route.ts` with a
  `HumanitarianSnapshotSchema` (access constraints, IPC, IDP figures,
  source-by-source coverage, gaps). Wire `withCalibration('humanitarian',
  'ai_humanitarian', { retrievalQuery })`. Add credit op
  `'ai_humanitarian'` to `with-credits.ts`. Persist to canonical envelope.
- Owner: Codex or Claude.

### 4. "Why this output?" inspector
- Problem: tools render structured output but never surface what shaped
  it: profile version, primary domain, model, sources used, confidence.
- Action: shared `<OutputProvenancePanel />` reading from the tool-output
  envelope. Default-collapsed under each tool result.
- Files: `src/components/praxis/output-provenance-panel.tsx`,
  `src/components/app/tool-page-shell.tsx`.
- Depends on: brick #2.

### 5. Demo-leak audit pass
- Problem: at least 5 tools render demo data (Nordalia parties, fixed
  monitored regions, ARGUS demo tabs, Conflict Graph hard-coded sample,
  Risk Monitor static feed) in `!isDemo` mode. Live users see fake data.
- Action: tool-by-tool, gate every demo constant behind
  `isClientDemoMode()` (already imported elsewhere) or remove. Replace
  with empty-state if no live data is loaded yet.
- Files: see `docs/tools/UX_AUDIT_2026-04-26.md` for the per-tool list.
- Owner: split between Codex and Claude.

### 6. Document → graph cross-link
- Problem: uploading a document creates a Firestore row but no in-app
  affordance ties it to graph nodes or tool outputs. Users cannot
  click an entity in Conflict Graph to see the originating paragraph.
- Action: store `documentId` on each ACO node provenance; render a
  hover affordance on graph nodes; deep-link Documents page with
  `?docId=` to scroll to the source text.
- Files: `backend/graphify_tacitus/extract.py` (provenance write),
  `src/app/app/conflict-graph/page.tsx`, `src/app/app/documents/page.tsx`.
- Owner: Codex (backend changes), Claude (UI).

### 7. Situation detail overview page
- Problem: `/app/situations/[id]` redirects to settings rather than
  serving a real case overview.
- Action: render situation status, source/document health, graph
  health, latest activity feed (already mountable), recommended next
  action, outstanding approvals queue. No new Firestore queries —
  reuse existing snapshots.
- Files: `src/app/app/situations/[id]/page.tsx`,
  `src/components/praxis/situation-dashboard.tsx`. (Prompt 3 in
  `docs/CLAUDE_TANDEM_PROMPTS_2026-04-25.md`.)
- Owner: Claude.

### 8. Real notification bell
- Problem: top-bar notifications still read demo Zustand state for
  authenticated users. Firestore `users/{uid}/notifications` is wired
  on the spine side but the bell ignores it.
- Action: swap `src/components/shared/notifications.tsx` to call
  `useActivityFeed` (or a new `useNotifications`) for authenticated
  users; preserve demo behavior under `isClientDemoMode()`. Mark-read
  via `PATCH /api/notifications/[id]` already exists.
- Owner: Codex.

### 9. BYO database — second data plane
- Problem: graph backend page now supports Spanner/Neo4j/FalkorDB but
  Firestore is the only canonical user-data plane. Enterprises that
  want their own Firestore project / Postgres / Spanner for situations
  can't plug in.
- Action (research first, no code yet): write a one-page brief on what
  it would take to add a `users/{uid}/settings/data_plane` that the
  server-side `firebase/admin.ts` honors when reading/writing
  user-owned data, and the trade-offs vs Workload Identity / VPC SC.
  Park this until a real customer asks.
- Owner: Claude (research + brief), Codex (implementation later).

### 10. Visual coherence pass
- Problem: version badges drift (footer was v6.3.1 — fixed this session
  to v6.4.0; sidebar still says v6.3 build 2026.04.14; package.json is
  6.2.0). Heroes/landing/onboarding share a palette but section spacing
  and badge styles diverge.
- Action: pick one source of truth for the displayed version (export
  from `package.json` or a `src/lib/constants/app-version.ts`).
  Audit landing sections for consistent badge/pill styles. Audit
  onboarding screens against the new completion-success layout to
  share spacing tokens.
- Owner: Claude or designer.

---

## Cleanups done this session (for changelog reference)

- Public copy: removed ACLED / Firecrawl / Anthropic / Tavily /
  Parallel.ai claims from landing features grid, live platform preview,
  and the unverifiable "trusted by UN/OSCE/think tanks" line on /login.
- Onboarding: per-step "Why this matters" rationale on Identity /
  Perspective / Working Style; live preview now defaults to a human
  calibration card with raw `<analyst-profile>` XML behind an Advanced
  disclosure; completion screen now shows a calibration summary plus
  top recommended tools and routes to "Create your first situation".
- Situation creation wizard: per-input explainer copy describing what
  PRAXIS does with each field. No schema/persistence change.
- Welcome modal / walkthrough / demo-mode banner: replaced
  "Gemini 2.5 + Claude" copy with "Vertex AI / Gemini" and grounded
  Google Search wording.
- Settings → Graph Backend: added a clear "PRAXIS works without this"
  default-state explainer plus a credentials-storage note.
- Settings → System Health: removed `ACLED` and
  `SIPRI-via-Firecrawl` strings from user-facing detail rows.
- Production fix: `src/app/api/ai/legal-tracker/route.ts` was
  calibrating as `commitments` with credit op `ai_analysis`. Restored
  to `('legal_tracker', 'ai_legal_tracker')` — fixes attribution for
  `tool_runs`, credit accounting, and SKC dependency resolution.
- Landing footer version badge: `v6.3.1` → `v6.4.0` to match
  `CLAUDE.md` / `README.md` / `docs/CONTINUATION.md`.

## Known drifts intentionally left

- `package.json` still reads `6.2.0` while docs say `6.4.0`. Bumping
  this affects build metadata; deferred to Codex deploy lane.
- `src/components/app/app-sidebar.tsx` build line `v6.3 · Build
  2026.04.14` — Codex-owned, leave for the workspace-personalization
  lane to bump.
- `src/lib/api/with-credits.ts` comment references `v6.3.1` — historical
  comment, fine to leave.
- `src/app/api/data/geospatial/route.ts` still has internal
  `ACLED_EVENT_TYPES` / `MinimalACLEDEvent` types. Variable names, not
  user copy. Refactor in a future Codex pass once the ACLED-shaped
  contract is replaced by GDELT/UCDP-shaped types.
- `src/lib/constants/source-categories.ts` exposes a `useFirecrawl` flag
  consumed by `situations/new/page.tsx`. Rename to a neutral key (e.g.
  `useGroundedSearch`) when Codex opens that file.

## Hard rules carrying over

1. Never break `withCalibration` on AI routes — every route needs the
   correct `toolId` and credit op key; cross-check
   `src/lib/api/with-credits.ts` before changing either.
2. Never reference retired vendors (ACLED, Firecrawl, Tavily,
   Parallel.ai) in user-facing copy.
3. Never auto-commit to `main` when an agent reports failed
   typecheck / build / route audit / vitest.
4. Never add a new Firestore collection without rules + indexes in the
   same commit.
5. Always commit as `giuliocatanzariti@gmail.com` with no
   Co-Authored-By trailer.

## Validation gate for any Claude / Codex commit this week

```bash
npx tsc --noEmit --pretty false
node scripts/audit-ai-routes.mjs
npx vitest run
npm run build              # only when touching shared UI / shell components
npm run audit:gcp          # only when touching infrastructure / GCP code
```

`npm run build` on Windows still emits warnings about `node:*` chunk
names during standalone trace copy — this is environment noise, not a
regression. Cloud Build is the authoritative container build.
