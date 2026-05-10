# PRAXIS Phase 3 — Product Surface

**Status:** Ships after Phase 2 is in production. Major user-visible change. The pitch deck and the app converge here.
**Constraints:** Frontend-heavy. Backend touches limited to wiring the new UI to existing Phase-2 verbs and LangGraph flows. Do not touch security boundaries.
**Audience:** Codex (orchestrator + subagents).
**Deploys to:** `praxis.tacitus.me`

---

## 0. What Phase 3 ships

The product the pitch deck promises. Eight things become true:

1. **Sidebar collapses to 8 surfaces:** Desk, Context, Library, Research, Graph, Boardroom, Draft, Tools. The 71 old `/app/*` pages stay routable but archived from default nav.
2. **Library separates sources from work products** in URL and data model.
3. **Draft is a Tiptap workspace** with paragraph-level provenance chips, Trust Score per claim, "what changed" diff, and JSON-LD provenance manifest on every export.
4. **Boardroom UI** turns the Phase-2 LangGraph flow into a visible deliberation room with five advisors, structured turns, and an "Open in Draft" action that bootstraps the work product.
5. **Cypher console (read-only)** lets power users query their situation graph directly. Saved queries become first-class artifacts.
6. **"What changed" diff engine** surfaces graph mutations and source updates on Desk.
7. **Streaming graph updates** animate into the Graph view via Server-Sent Events during Research staging.
8. **EU AI Act human-in-the-loop ack** is enforced on `forecast`, `legal-check`, `sanctions-check` verbs. Cost cap UI surfaces on Desk.

After Phase 3, the app matches the pitch.

---

## 1. Pre-flight (must be true before any subagent fans out)

- [ ] Phase 2 tag `phase-2-agentic-spine-shipped` exists on `main`.
- [ ] `https://praxis.tacitus.me/api/ai/dialectica` returns 200 on a valid request.
- [ ] LangGraph `checkpoints` table is being written to in production.
- [ ] Branch `phase/3-product-surface` is created from `main` and pushed.
- [ ] Codex has read this file fully.

---

## 2. Reference material Codex must load

Read-only inspection:

| File | Why |
|---|---|
| `docs/PRAXIS_TECHNICAL_SPECIFICATION.md` (spec v2) | §4 Sidebar collapse, §7 Draft, §6 Boardroom, §13 Improvements |
| `docs/PRAXIS_PRODUCT_SIMPLIFICATION_2026-05-03.md` | The product north-star (move it from `_archive` back into context for this phase only) |
| `src/components/app/app-sidebar.tsx` | Existing 70-tool sidebar |
| `src/lib/constants/tool-registry.ts` | `surface: 'hero' \| 'archive'` field already exists |
| `src/components/editor/work-product-editor.tsx` (if exists) or `src/app/app/editor/page.tsx` | Existing editor seed |
| `src/lib/firebase/situations.ts`, `documents-service.ts`, `reports-service.ts` | Data layer patterns to follow |
| `src/lib/exports/` (if exists) | Export pipeline to extend with JSON-LD |

External docs:

- Tiptap blocks API: <https://tiptap.dev/docs/editor/api/nodes>
- Server-Sent Events on Cloud Run / Next.js Edge: <https://nextjs.org/docs/app/building-your-application/routing/route-handlers#streaming>
- W3C PROV ontology: <https://www.w3.org/TR/prov-o/>

---

## 3. Subagent lanes

```
                Lane Y — Sidebar collapse (must run first)
                                │
   ┌──────────┬──────────┬──────┼─────┬──────────┬──────────┐
   A          B          C            D          E          F
   Library    Draft +    Boardroom    Cypher     What       AI-Act ack +
   split      provenance UI           console    changed    cost cap UI
                                │
                       Lane G — Verb hookup audit
                                │
                       Lane H — Verification
                                │
                  Lane DEPLOY — Merge + Cloud Build
```

Lane Y must run first because every subsequent lane depends on the new sidebar entries. A through F run in parallel after Y.

### Lane Y — Sidebar collapse (sequential, runs first)

**Brief.** Render eight sidebar surfaces. Mark all non-hero `tool-registry` entries `surface: 'archive'`. Keep all 71 old routes live.

**Files in scope:**
- `src/components/app/app-sidebar.tsx`
- `src/lib/constants/tool-registry.ts`
- `src/lib/navigation/tool-preferences.ts`
- `src/components/app/situation-selector.tsx` (no change unless required)
- `src/__tests__/sidebar-collapse.test.tsx` (new)

**Files NOT to touch:** every `src/app/app/<page>/` route — they stay live, just no longer in default nav.

**Todo list:**

- [ ] In `tool-registry.ts`, set `surface: 'archive'` and `visible: false` for every entry except the 8 hero entries:
  ```
  desk, context, library, research, graph, boardroom, draft, tools
  ```
  (Note: `desk` is the new id for what was `dashboard`; alias for back-compat in URL routing.)
- [ ] Update `app-sidebar.tsx`:
  - Render 8 entries from the registry.
  - Show a "Tools" expander at the bottom listing archived entries when `?show_archive=1` or when `localStorage.getItem('praxis_show_archive') === '1'`.
  - Each sidebar item has its existing icon, label, route, and the existing tool-status semaphore badge.
- [ ] In `src/app/app/page.tsx` (the route entry), redirect `/app` → `/app/desk`.
- [ ] Add a one-time tour banner: "We've simplified the sidebar. The old tools are still here under Tools — or hit `?show_archive=1` to pin them."

**Acceptance:**
- [ ] A logged-in user sees 8 sidebar entries.
- [ ] All 71 old deep links still resolve (verify a sample of 10 in test).
- [ ] `?show_archive=1` exposes every archived entry.
- [ ] `npx vitest run src/__tests__/sidebar-collapse.test.tsx` passes.

**Test to write** — `src/__tests__/sidebar-collapse.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { AppSidebar } from '@/components/app/app-sidebar';
// (test setup with mocked auth and stores)

const HERO_IDS = ['desk', 'context', 'library', 'research', 'graph', 'boardroom', 'draft', 'tools'];

test('default sidebar shows exactly 8 hero surfaces', () => {
  render(<AppSidebar searchParams={{}} />);
  HERO_IDS.forEach(id => expect(screen.getByTestId(`sidebar-${id}`)).toBeVisible());
  expect(screen.queryByTestId('sidebar-game-theory')).toBeNull();
});

test('?show_archive=1 reveals archived entries', () => {
  render(<AppSidebar searchParams={{ show_archive: '1' }} />);
  expect(screen.getByTestId('sidebar-game-theory')).toBeVisible();
});

test('all 71 legacy routes still resolve', () => {
  // Smoke against route manifest
  const allRoutes = require('@/lib/constants/route-manifest').LEGACY_ROUTES;
  expect(allRoutes.length).toBeGreaterThanOrEqual(71);
  // Every route still exported from src/app/app/*/page.tsx
});
```

---

### Lane A — Library separates sources from work products

**Brief.** New URL space `/app/library/sources` and `/app/library/work-products`. New Firestore subcollections. Migrate existing `documents/` into `sources/` (alias retained).

**Files in scope:**
- `src/app/app/library/page.tsx` (new — redirects to `/sources`)
- `src/app/app/library/sources/page.tsx` (new)
- `src/app/app/library/work-products/page.tsx` (new)
- `src/app/app/library/[id]/page.tsx` (new — detail view)
- `src/lib/firebase/sources-service.ts` (new)
- `src/lib/firebase/work-products-service.ts` (new)
- `firestore.rules` — add rules for new subcollections
- `firestore.indexes.json` — add composite indexes for `(situationId, createdAt desc)` etc.
- `scripts/migrate-documents-to-sources.ts` (new — backfill)
- `tests/services/sources-service.test.ts`, `work-products-service.test.ts`

**Files NOT to touch:** existing `documents-service.ts` keeps its alias contract; do not delete it in this phase.

**Todo list:**

- [ ] Schema:
  ```
  users/{uid}/situations/{sit}/sources/{id}
    { name, mimeType, originalUrl?, sha256, sizeBytes,
      uploadedAt, taggedAs[], reliability?, region?, language?,
      sourceType: 'pdf'|'docx'|'url'|'feed', extracted: bool }
  
  users/{uid}/situations/{sit}/work_products/{id}
    { title, type: 'memo'|'briefing'|'talking_points'|'dossier',
      status: 'draft'|'final'|'exported', parentSources[],
      content: tiptapJSON, lastEditedAt, exportHistory[] }
  ```
- [ ] `firestore.rules`:
  ```
  match /users/{uid}/situations/{sit}/sources/{id} {
    allow read, write: if request.auth.uid == uid;
  }
  match /users/{uid}/situations/{sit}/work_products/{id} {
    allow read, write: if request.auth.uid == uid;
  }
  ```
- [ ] `sources-service.ts` and `work-products-service.ts` follow the same pattern as `documents-service.ts` (canonical situations service).
- [ ] Migration script: for each existing `documents/` row, copy into `sources/` with the same id, mark `documents/` row `migratedToSourceId`. Idempotent (re-run is no-op).
- [ ] Library page composition:
  - `/app/library` → tabbed view of Sources / Work Products
  - Source upload accepts PDF, DOCX, URL, plain text
  - Work products show with status + last edited timestamp + parent sources

**Acceptance:**
- [ ] A new source uploaded via Library appears in `sources/` (and the legacy `documents/` alias stays in sync for one release).
- [ ] A work product references its parent sources via `parentSources[]`.
- [ ] `pytest backend/tests/test_phase3_indexes.py -v` passes — verifies all required indexes exist.
- [ ] `vitest run tests/services/sources-service.test.ts work-products-service.test.ts` passes.

---

### Lane B — Draft workspace + paragraph-level provenance

**Brief.** Replace `/app/editor` with `/app/draft`. Tiptap editor. Each paragraph carries `data-provenance-id`. Right rail shows provenance chip set per paragraph. Export pipeline embeds JSON-LD provenance manifest.

**Files in scope:**
- `src/app/app/draft/page.tsx` (new)
- `src/app/app/draft/[workProductId]/page.tsx` (new)
- `src/components/editor/work-product-editor.tsx` (new or rewrite)
- `src/components/editor/provenance-chips.tsx` (new)
- `src/components/editor/trust-score-badge.tsx` (new)
- `src/components/editor/contradiction-marker.tsx` (new)
- `src/lib/exports/json-ld-prov.ts` (new)
- `src/lib/exports/{docx,pdf,markdown}.ts` (extend — embed JSON-LD footer)
- `src/lib/draft/provenance-store.ts` (new — local + Firestore-synced provenance map)
- `src/__tests__/draft-provenance.test.tsx`

**Todo list:**

- [ ] Tiptap config with custom block extension `ProvenanceParagraph` carrying `data-provenance-id`.
- [ ] On paragraph creation, generate UUID, register in `provenance-store` with empty provenance.
- [ ] Provenance chip set per paragraph:
  - **Source basis** — array of `parentSources` chips, click → source detail.
  - **Cypher path** — opens path in Graph view.
  - **Trust Score** — animated 0–100 badge, color-coded.
  - **Confidence band** — EXTRACTED / INFERRED / AMBIGUOUS / ASSESSED.
  - **Change since last read** — green dot if updated since `lastReadAt`.
  - **Contradicts** — red marker if firewall flagged a contradiction.
- [ ] Applied actions inside Draft (right-rail menu per active paragraph):
  - "Risk-score this section" → calls `/api/ai/score`.
  - "Generate talking points" → calls `/api/ai/talking-points`.
  - "Pull contradicting evidence" → inverse firewall.
  - "Time-travel: this paragraph at last export" → snapshot diff.
  - "Boardroom challenge this paragraph" → spawns scoped Boardroom session.
  - "Cypher this paragraph" → opens Cypher console seeded with anchor traversal.
- [ ] `json-ld-prov.ts` builds the W3C PROV manifest per spec v2 §7.4.
- [ ] DOCX/PDF/Markdown exports embed the manifest in a footer block.

**Acceptance:**
- [ ] Typing a paragraph and clicking "Anchor to graph" attaches a Cypher path.
- [ ] DOCX export carries the JSON-LD manifest (parse the footer; assert `wasGeneratedBy.agent === 'praxis-v6.x'`).
- [ ] Trust Score badge updates live as the firewall verifies claims.
- [ ] `vitest run src/__tests__/draft-provenance.test.tsx` passes.

**Playwright test snippet:**

```ts
test('Draft paragraph carries provenance chip set', async ({ page }) => {
  await page.goto('/app/draft');
  await page.locator('[data-testid="new-work-product"]').click();
  await page.locator('[data-testid="editor"]').type('State A leverages aid corridors.');
  await page.locator('[data-testid="anchor-to-graph"]').click();
  await expect(page.locator('[data-testid="provenance-chip-cypher"]')).toBeVisible();
  await expect(page.locator('[data-testid="trust-score-badge"]')).toContainText(/\d{1,3}/);
});
```

---

### Lane C — Boardroom UI

**Brief.** Visualize the Phase-2 Boardroom LangGraph as a deliberation room. Five advisor cards arranged around a center "Synthesis" panel. Real-time turn streaming via SSE. "Open in Draft" creates a work product.

**Files in scope:**
- `src/app/app/boardroom/page.tsx` (new)
- `src/app/app/boardroom/[sessionId]/page.tsx` (new — session view)
- `src/components/boardroom/deliberation-room.tsx` (new)
- `src/components/boardroom/advisor-card.tsx` (new)
- `src/components/boardroom/synthesis-panel.tsx` (new)
- `src/components/boardroom/replay-controls.tsx` (new)
- `src/app/api/ai/boardroom/route.ts` (already exists from Phase 2 — extend with SSE)
- `src/app/api/ai/boardroom/[sessionId]/replay/route.ts` (new)
- `src/__tests__/boardroom-ui.test.tsx`

**Todo list:**

- [ ] Layout: pentagon arrangement of five advisor cards, Synthesis panel in the center, "Question" composer at top, "Boardroom history" rail on left.
- [ ] Each advisor card shows: mandate, current state (waiting / thinking / done), structured turn output (position + evidence_refs + counter_points), thinking-level chip.
- [ ] SSE stream: backend emits `advisor.turn.start`, `advisor.turn.token`, `advisor.turn.complete`, `firewall.claim.verified`, `synthesis.start`, `synthesis.complete`.
- [ ] Frontend renders tokens live; firewall annotations appear inline.
- [ ] Human-in-the-loop interrupt: when backend pauses before `principal_close`, frontend shows a guidance composer; submit calls `POST /api/ai/boardroom/{sessionId}/resume` with the note.
- [ ] Replay mode: scrub through past turns from checkpoints.
- [ ] "Open in Draft" button on Synthesis panel: creates `work_products/{newId}` with first section seeded from `bootstrap_outline_for_draft`, navigates to `/app/draft/{newId}`.

**Acceptance:**
- [ ] A new Boardroom session shows live token streaming.
- [ ] Replay reproduces a completed session turn-by-turn from checkpoints.
- [ ] "Open in Draft" works.
- [ ] `vitest run src/__tests__/boardroom-ui.test.tsx` passes.
- [ ] Playwright: a full session completes within 90s in the test fixture.

---

### Lane D — Cypher console (read-only)

**Brief.** Power-user feature inside `/app/graph`. Read-only Cypher against the analyst's situation graph. Tenant-scoped. Saved queries are first-class.

**Files in scope:**
- `src/app/app/graph/page.tsx` (extend — add Cypher tab)
- `src/components/graph/cypher-console.tsx` (new)
- `src/components/graph/cypher-result-graph.tsx` (new)
- `src/components/graph/cypher-result-table.tsx` (new)
- `src/components/graph/saved-queries-rail.tsx` (new)
- `src/app/api/graph/cypher/route.ts` (new — POST, calls backend)
- `backend/routers/graph_cypher.py` (new — read-only Cypher executor)
- `backend/agents/firewall/cypher_validator.py` (extend — re-use validator)
- `src/__tests__/cypher-console.test.tsx`

**Todo list:**

- [ ] Console UI: Monaco Editor with Cypher language tokens, run button, format button, history.
- [ ] On run: POST `/api/graph/cypher` with `{ situationId, cypher, params, lens }`.
- [ ] Backend route validates with `cypher_validator` (read-only, parametrized, tenant-scoped). Rejects on any forbidden token.
- [ ] Result rendering: switch between graph view (using existing `force-graph` component) and table.
- [ ] Saved queries: save to `users/{uid}/situations/{sit}/saved_queries/{id}` Firestore + mirror to Postgres `saved_queries` for analytics.
- [ ] CSV export of result table.

**Acceptance:**
- [ ] `MATCH (a:Actor) RETURN a LIMIT 10` succeeds and renders.
- [ ] `MATCH (a) DELETE a` is rejected before execution (test).
- [ ] `MATCH (n) RETURN n` returns only nodes with `n.tenantId = current user's tenantId`.
- [ ] Saved queries persist across sessions.
- [ ] `vitest run src/__tests__/cypher-console.test.tsx` passes including injection tests.

**Adversarial test:**

```ts
test('destructive cypher rejected', async () => {
  const res = await fetch('/api/graph/cypher', {
    method: 'POST',
    body: JSON.stringify({ cypher: 'MATCH (a) DELETE a', situationId: 's1' }),
  });
  expect(res.status).toBe(400);
  const body = await res.json();
  expect(body.error).toContain('read-only');
});
```

---

### Lane E — "What changed" diff engine + streaming graph updates

**Brief.** Two related features. (1) Desk surfaces a "What changed since last read" panel: graph mutations + source updates between snapshots. (2) During Research staging, proposed graph mutations animate into the Graph view via SSE.

**Files in scope:**
- `src/app/app/desk/page.tsx` (extend)
- `src/components/desk/what-changed-panel.tsx` (new)
- `src/lib/graph/diff-engine.ts` (new)
- `src/lib/graph/diff-engine.test.ts`
- `src/components/graph/graph-view.tsx` (extend with SSE listener)
- `src/app/api/graph/changes/route.ts` (new — GET, returns diff)
- `src/app/api/graph/staging-stream/route.ts` (new — SSE)
- `backend/routers/graph_diff.py` (new)
- `backend/services/graph_diff.py` (new)

**Todo list:**

- [ ] `diff-engine.ts`: pure function, given `(snapshotA, snapshotB)` returns `{ addedNodes, removedNodes, modifiedNodes, addedEdges, removedEdges, modifiedEdges, sourceUpdates }`.
- [ ] Backend `graph_diff.py`: query Neo4j for changes between two `assertedFrom` timestamps for a situation; compare against snapshot.
- [ ] `what-changed-panel.tsx`: shows the diff as a feed:
  ```
  • 3 new actor proposals (click to review)
  • 2 source updates: Reuters article re-issued
  • 1 commitment marked unfulfilled
  • Risk Score moved from MODERATE → HIGH
  ```
- [ ] SSE staging stream on Research:
  - When extraction LangGraph emits `graph.proposal.staged`, backend pushes via SSE.
  - Frontend listens; new proposed nodes animate into Graph view (gold pulse, magnetic dock).
  - Approve/reject buttons inline on the proposal toast.
- [ ] On Desk, "What changed" panel auto-refreshes every 60s when the Desk is in viewport.

**Acceptance:**
- [ ] Diff engine returns expected structure on fixture snapshots (≥6 unit tests).
- [ ] SSE stream pushes a new proposed node within 500ms of backend staging.
- [ ] Approve button mutates the canonical Firestore graph and triggers Neo4j sync.
- [ ] `vitest run src/lib/graph/diff-engine.test.ts` passes.

---

### Lane F — EU AI Act ack + Cost cap UI

**Brief.** Three high-risk verbs (`forecast`, `legal-check`, `sanctions-check`) require a once-per-session human-in-the-loop ack, persisted in `tool_runs.aiActAcknowledgedAt`. Cost cap enforcement surfaces on Desk with "Lift cap" admin action.

**Files in scope:**
- `src/lib/api/with-ai-act-ack.ts` (new — middleware)
- The three high-risk verb routes (`src/app/api/ai/{forecast,legal-check,sanctions-check}/route.ts`)
- `src/components/compliance/ai-act-ack-modal.tsx` (new)
- `src/components/desk/cost-cap-panel.tsx` (new)
- `src/app/api/situations/[id]/cost-cap/route.ts` (new — GET/PATCH)
- `src/lib/api/with-credits.ts` (extend — cost-cap rejection path)
- `src/__tests__/ai-act-ack.test.tsx`

**Todo list:**

- [ ] `with-ai-act-ack` middleware:
  ```ts
  export const withAiActAck = (handler) => async (req, ctx) => {
    const ack = req.headers.get('X-AI-Act-Ack');
    if (!ack) return new Response(JSON.stringify({
      error: 'AI Act ack required',
      message: 'This is decision-support, not a decision. Please acknowledge.',
    }), { status: 428, headers: { 'Content-Type': 'application/json' } });
    // record on the tool_run
    ctx.aiActAcknowledgedAt = new Date().toISOString();
    return handler(req, ctx);
  };
  ```
- [ ] Wrap the three high-risk verb routes with `withAiActAck`.
- [ ] Frontend modal triggers on first call to a high-risk verb in a session, sets `localStorage.setItem('aiActAck', sessionStorage.id)`, attaches header on subsequent calls.
- [ ] Cost cap UI: shows current month's spend per Situation, the cap, and a progress bar. At ≥80% of cap, a yellow warning banner. At cap, blocked state with "Request cap lift" action that emails the admin.
- [ ] `with-credits` already enforces cap (Phase-1 Lane B / spec v2 I-18); ensure the rejection path returns 402 with a clear message that the UI can render.

**Acceptance:**
- [ ] Calling `/api/ai/forecast` without ack returns 428.
- [ ] After ack, the same call succeeds and `tool_run.aiActAcknowledgedAt` is set.
- [ ] Cost cap reached → 402 → UI shows blocked state.
- [ ] `vitest run src/__tests__/ai-act-ack.test.tsx` passes.

---

### Lane G — Verb hookup audit (final integration)

**Brief.** Every page in the new sidebar surfaces (Desk, Context, Library, Research, Graph, Boardroom, Draft) calls the 20 verbs from Phase 2. Audit that no surface is calling a legacy `/api/ai/*` route.

**Files in scope:**
- All `src/app/app/{desk,context,library,research,graph,boardroom,draft}/**/*.tsx`
- `scripts/audit-verb-hookup.ts` (new)
- `src/lib/ai/api-client.ts` (extend — typed verb clients)

**Todo list:**

- [ ] `scripts/audit-verb-hookup.ts`: scans all `.tsx` in the eight surface directories, lists every `/api/ai/*` call, fails if any is not in the 20-verb table.
- [ ] Replace any straggler legacy calls with verb clients.
- [ ] Verb client per verb: `src/lib/ai/clients/{verb}.ts` with typed input/output.

**Acceptance:**
- [ ] `npx tsx scripts/audit-verb-hookup.ts` exits 0.
- [ ] Every verb client passes its Zod schema validation on a live call.

---

### Lane H — Synthesis & verification

**Brief.** Run full verification.

```bash
# Type / lint / build
npx tsc --noEmit && npm run lint && npm run build

# Frontend tests
npx vitest run

# Backend tests
cd backend && pytest tests/ agents/ -v

# Audits
npm run audit:routes
npx tsx scripts/audit-spine.ts
npx tsx scripts/audit-verb-hookup.ts

# Forbidden patterns
rg "MemorySaver|InMemorySaver" backend/agents/ --type py | grep -v tests/
rg "claude-|firecrawl|tavily|parallel-web|falkor|spanner" src/ backend/

# Playwright golden path (the full new product)
npm run smoke:golden-path

# Lighthouse on the authenticated workspace
npx lighthouse https://praxis.tacitus.me/app/desk --quiet --output=json
```

All must pass.

---

## 4. Commit + deploy to `praxis.tacitus.me`

**Step 1 — Subagent merges into `phase/3-product-surface`:**

Conventional-commit scopes:

```
feat(ui):       Lane Y, A, B, C, D, E, F
feat(api):      Lane G — verb hookup
test:           any new test files
chore(rules):   firestore.rules + indexes.json updates
```

**Step 2 — Phase synthesis:**

```bash
git checkout phase/3-product-surface
git pull
# Run Lane H verification — all green
git tag phase-3-product-surface-rc1
git push origin phase-3-product-surface-rc1
```

**Step 3 — Merge to main:**

```bash
git checkout main && git pull
git merge --no-ff phase/3-product-surface
git push origin main
```

**Step 4 — Cloud Build deploy (automatic):**

Pipeline:

1. All Phase-1 and Phase-2 gates run.
2. **Deploy Firestore rules + indexes** (extends Phase 1's deploy):
   ```yaml
   - id: firestore-rules
     name: gcr.io/cloud-builders/firebase
     args: ['deploy', '--only', 'firestore:rules,firestore:indexes', '--project', 'praxisbytacitus']
   ```
3. Backend image built → Cloud Run.
4. Frontend image built → Cloud Run.
5. **Run document-to-source migration** as a one-shot Cloud Run job:
   ```yaml
   - id: migrate-documents-to-sources
     name: gcr.io/cloud-builders/gcloud
     entrypoint: bash
     args:
       - '-c'
       - |
         gcloud run jobs execute praxis-migrate-docs-sources \
           --region us-central1 --wait --project praxisbytacitus
   ```
6. Smoke against `https://praxis.tacitus.me/app/desk` (authenticated test account).

**Step 5 — Post-deploy verification:**

```bash
# Health
curl -fsSL https://praxis.tacitus.me/api/health | jq .

# New sidebar present
curl -fsSL https://praxis.tacitus.me/app/desk -H "Cookie: $TEST_COOKIE" | grep -E 'data-testid="sidebar-(desk|context|library|research|graph|boardroom|draft|tools)"' | wc -l
# Should be exactly 8

# Library separation
curl -fsSL https://praxis.tacitus.me/app/library/sources -H "Cookie: $TEST_COOKIE"
curl -fsSL https://praxis.tacitus.me/app/library/work-products -H "Cookie: $TEST_COOKIE"

# AI Act ack enforced
curl -X POST https://praxis.tacitus.me/api/ai/forecast \
  -H "Authorization: Bearer $TEST_JWT" -H "Content-Type: application/json" \
  -d '{"situationId":"s1","lens":"generic","params":{"horizon":"6mo"}}'
# Expect 428

# JSON-LD provenance in DOCX export
# Run a smoke that creates a work product, exports DOCX, opens it, asserts the manifest
npm run smoke:golden-path -- --project=production
```

**Roll back** if anything fails:

```bash
gcloud run services update-traffic praxis-frontend --to-revisions=PREVIOUS=100 --region us-central1
gcloud run services update-traffic praxis-backend --to-revisions=PREVIOUS=100 --region us-central1
# Roll back Firestore rules if needed:
firebase deploy --only firestore:rules --project praxisbytacitus --version=previous
```

---

## 5. Definition of done

- [ ] All eight lanes (Y + A–F + G) merged into `main`.
- [ ] Cloud Build green on the merge commit.
- [ ] `https://praxis.tacitus.me/app/desk` shows 8 sidebar entries.
- [ ] `/app/library/sources` and `/app/library/work-products` render correctly.
- [ ] A Draft work product can be created, anchored, exported with a JSON-LD manifest in the DOCX footer.
- [ ] A Boardroom session streams live and "Open in Draft" creates a seeded work product.
- [ ] Cypher console rejects destructive queries.
- [ ] `forecast`, `legal-check`, `sanctions-check` enforce the AI Act ack.
- [ ] Cost cap UI displays and the 402 path is reachable.
- [ ] `npm run smoke:golden-path` passes against production.
- [ ] Tag `phase-3-product-surface-shipped` pushed.
- [ ] Final tag `praxis-v7-product-surface-shipped` pushed (the public version bump).

---

## 6. Codex orchestrator prompt (paste-ready)

```
You are the orchestrator for PRAXIS Phase 3 — Product Surface.
Read /docs/phases/PRAXIS_PHASE_3_PRODUCT_SURFACE.md fully.

Pre-flight: §1. If any item is false, stop and ask.

Order:
  1. Lane Y (sequential).
  2. Lanes A, B, C, D, E, F in parallel.
  3. Lane G after F merges.
  4. Lane H verification.
  5. Merge to main + Cloud Build deploys to praxis.tacitus.me.

Hard rules (Phase-1 and Phase-2 rules still apply, plus):
- Frontend-heavy. Do not touch src/middleware.ts, src/lib/firebase/admin.ts,
  src/lib/api/with-auth.ts, firestore.rules security predicates without
  explicit approval. (firestore.rules ADDITIONS for new subcollections OK.)
- Every new sidebar surface page must call only the 20 verbs from Phase 2.
- Every export must embed the JSON-LD provenance manifest.
- High-risk verbs must be wrapped with withAiActAck.

Begin Lane Y. Report back when ready to fan out.
```

---

## 7. Subagent prompts (paste-ready)

### Lane Y — Sidebar collapse
```
You are subagent Y. Lane Y — Sidebar collapse.
Read /docs/phases/PRAXIS_PHASE_3_PRODUCT_SURFACE.md §3 Lane Y only.
Mark every non-hero registry entry surface='archive', visible=false.
All 71 old routes must still resolve. ?show_archive=1 must reveal them.
Verify: vitest run src/__tests__/sidebar-collapse.test.tsx.
```

### Lane A — Library split
```
You are subagent A. Lane A — Library separates sources from work products.
Read /docs/phases/PRAXIS_PHASE_3_PRODUCT_SURFACE.md §3 Lane A only.
New Firestore subcollections sources/ and work_products/. Idempotent migration
script. firestore.rules additions only — do not loosen existing predicates.
Verify: vitest run tests/services/sources-service.test.ts work-products-service.test.ts.
```

### Lane B — Draft + provenance
```
You are subagent B. Lane B — Draft workspace + provenance chips.
Read /docs/phases/PRAXIS_PHASE_3_PRODUCT_SURFACE.md §3 Lane B only.
Tiptap. Custom ProvenanceParagraph block extension. Right-rail chip set.
JSON-LD W3C PROV manifest in every DOCX/PDF/Markdown footer.
Verify: vitest run src/__tests__/draft-provenance.test.tsx + the Playwright snippet.
```

### Lane C — Boardroom UI
```
You are subagent C. Lane C — Boardroom deliberation room.
Read /docs/phases/PRAXIS_PHASE_3_PRODUCT_SURFACE.md §3 Lane C only.
Pentagon layout, SSE streaming from the Phase-2 LangGraph backend, replay
mode from checkpoints, "Open in Draft" creates a seeded work product.
Verify: vitest run src/__tests__/boardroom-ui.test.tsx + Playwright session.
```

### Lane D — Cypher console
```
You are subagent D. Lane D — Read-only Cypher console.
Read /docs/phases/PRAXIS_PHASE_3_PRODUCT_SURFACE.md §3 Lane D only.
Re-use cypher_validator from Phase 2. Read-only Neo4j sessions only.
Saved queries persist to Firestore + mirror to Postgres saved_queries.
Verify: vitest run src/__tests__/cypher-console.test.tsx including injection tests.
```

### Lane E — What changed + streaming graph updates
```
You are subagent E. Lane E — Diff engine + SSE streaming proposals.
Read /docs/phases/PRAXIS_PHASE_3_PRODUCT_SURFACE.md §3 Lane E only.
Pure diff function with ≥6 unit tests. SSE backend route emits proposal
events. Frontend animates new proposed nodes into Graph view.
Verify: vitest run src/lib/graph/diff-engine.test.ts.
```

### Lane F — AI Act ack + Cost cap UI
```
You are subagent F. Lane F — EU AI Act ack + cost cap UI.
Read /docs/phases/PRAXIS_PHASE_3_PRODUCT_SURFACE.md §3 Lane F only.
withAiActAck middleware on three verbs. 428 response if no header.
Cost cap UI surfaces on Desk; 402 path reachable.
Verify: vitest run src/__tests__/ai-act-ack.test.tsx.
```

### Lane G — Verb hookup audit
```
You are subagent G. Lane G — Verb hookup audit.
Read /docs/phases/PRAXIS_PHASE_3_PRODUCT_SURFACE.md §3 Lane G only.
Run after Lane F merges.
Replace any straggler /api/ai/* legacy call in the eight new surfaces with
typed verb clients. Audit script must exit 0.
Verify: npx tsx scripts/audit-verb-hookup.ts.
```

---

## 8. After Phase 3

The pitch deck and the app converge. PRAXIS is now a workspace where:

> An analyst opens a Situation, drops sources into the Library, sees graph proposals stage in real-time during Research, approves them on the Graph view, runs a Boardroom deliberation that streams live with five Gemini advisors at varying thinking levels, opens the Draft, writes a memo where every paragraph carries a Trust Score and a Cypher path, exports a DOCX whose footer contains a JSON-LD W3C PROV manifest, and ships the brief. The next analyst inherits the work — the Library, the graph, the boardroom history, the draft history, all of it — and picks up where the predecessor left off.

That is what the spec set out to build. Three phases, three deploys, one product.
