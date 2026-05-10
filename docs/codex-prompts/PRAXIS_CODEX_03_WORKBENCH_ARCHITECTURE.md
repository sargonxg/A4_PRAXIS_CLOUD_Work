# PRAXIS — Codex Prompt Pack 03
## The Policy Workbench — One Surface, Many Cases, Graph-Anchored

> **Audience:** Codex (OpenAI) and Claude Code, working on `sargonxg/A4_PRAXIS_CLOUD_Work` `main`.
> **Read first:** `AGENTS.md`, `CLAUDE.md`, `/mnt/skills/user/praxis-conventions/SKILL.md`, `docs/PRAXIS_ARCHITECTURE_AND_AGENT_HANDOFF_2026-05-06.md`, `docs/PRAXIS_PHASE_SPEC_AUDIT_2026-05-06.md`, `docs/codex-prompts/PRAXIS_MAY_1_CHANGES.md`, `docs/codex-prompts/PRAXIS_MAY_2_CHANGES.md`.
> **Companion packs (run in order):** `04_LANDING_AND_ENTRY_REBUILD.md`, `05_CONTEXT_VS_TOOLS_SEPARATION.md`.
> **Hard rules carried over:** never hardcode `gemini-*` outside `src/lib/ai/providers.ts`; never bypass `withCalibration` on AI routes; never weaken `firestore.rules` or `with-auth`; never silently mix demo data into authenticated user state; never write canonical graph mutations without analyst approval.

---

## 0. Why this pack exists

PRAXIS today has **81 routes under `/app/*`**, an **8-surface product shell** that is mostly thin re-exports of underlying tool pages, a **587-line dashboard** that special-cases Syria, a **separate 251-line `/app/syria-case` walkthrough** with the cleanest UX in the codebase, and a **1,345-line `/app/situations/new` flow** that already does the heavy lifting of case creation.

The product story Giulio is selling is **a policy workbench** — *every user creates their own situations and works on them inside one consistent operating room, anchored in a graph that carries provenance, confidence, and time*. That story is buried under three competing surfaces:

1. `/app/dashboard` — the "situation overview" hub.
2. `/app/desk` — a thin re-export of `/app/dashboard` masquerading as a Phase 3 product surface.
3. `/app/syria-case` — a separate, beautifully chaptered walkthrough that *only* works for Syria.

This pack consolidates all three into **one canonical Workbench route — `/app/workbench/[caseId]` — that any user can spin up for any situation**, and reuses the Syria chapter pattern (Frame → Receipts → Graph → DIALECTICA → Decision Product) as the universal layout. Syria becomes one example case among many, not the spine.

This is **structural work**. It is not a redesign — the components mostly exist. It is moving them into the right room and turning off the lights in the rooms nobody enters.

---

## 1. Outcomes

By the end of this pack:

| # | Outcome |
|---|---|
| 1 | Single canonical workbench surface at `/app/workbench` (case picker) and `/app/workbench/[caseId]` (active case). |
| 2 | The Syria 5-chapter flow is generalized into a reusable `WorkbenchChapterShell` that any case loads. |
| 3 | `/app/dashboard`, `/app/desk`, `/app/syria-case`, `/app/cockpit` collapse into the Workbench. The first three keep 410-style redirects for backward compatibility; `/app/cockpit` is deleted. |
| 4 | The 8 Phase 3 surfaces (Desk, Context, Library, Research, Graph, Boardroom, Draft, Tools) become **tabs inside the workbench**, scoped to the active case, instead of stand-alone routes. The legacy `/app/<surface>` URLs redirect to `/app/workbench/[caseId]?tab=<surface>` when a case is active, otherwise to `/app/workbench`. |
| 5 | Multi-user isolation is enforced: every workbench page reads only `users/{uid}/situations/{caseId}/...`. Firestore rules are unchanged (already correct). The per-route guard is moved up to a `WorkbenchScope` provider so individual chapters do not re-implement it. |
| 6 | Graph anchoring is explicit: every chapter declares which **truth layer** it writes to (Episodic / Semantic / Stance, plus Provenance + Confidence + Time on every primitive). |
| 7 | Dead routes flagged and either deleted or feature-flagged behind `?show_archive=1`. The current 81 routes drop to ~25 visible to authenticated users. |

---

## 2. Pre-work — Codex agent must confirm before starting

Before writing any code, Codex must respond to Giulio with the following one-page confirmation note. Do not start work until confirmed.

```
PRAXIS Workbench consolidation — pre-work confirmation

I have read:
- AGENTS.md, CLAUDE.md, praxis-conventions skill
- docs/PRAXIS_ARCHITECTURE_AND_AGENT_HANDOFF_2026-05-06.md
- docs/PRAXIS_PHASE_SPEC_AUDIT_2026-05-06.md
- src/app/app/dashboard/page.tsx, src/app/app/syria-case/page.tsx,
  src/app/app/situations/new/page.tsx
- src/lib/syria/chapter-flow.ts and src/components/syria/chapter-frame.tsx
- src/lib/navigation/product-surfaces.ts
- src/components/app/app-sidebar.tsx (NavSection definitions)

My understanding:
1. The product is a multi-user POLICY WORKBENCH. Each user creates SITUATIONS
   (cases) scoped to users/{uid}/situations/{caseId} in Firestore, with
   matching Postgres rows for vector/agent state and Neo4j projections for
   graph traversal.
2. Inside a situation, the analyst progresses through a 5-chapter flow:
   Situation Frame → Source Receipts → Conflict Graph → DIALECTICA Reasoning
   → Decision Product. This is the SYRIA_CHAPTER_FLOW pattern, generalized.
3. The 8 Phase 3 surfaces are TABS inside the workbench (Desk, Context,
   Library, Research, Graph, Boardroom, Draft, Tools), not stand-alone
   routes. The chapter flow is the default tab; the others are advanced
   tabs that the analyst opts into.
4. Syria is ONE example case file. All Syria-specific code is moved into
   src/lib/cases/syria-2026/ as an "example case" module. The workbench
   loads any case (Syria, user-created, other examples) through the same
   shell.

Open questions before I start:
- Q1: <if anything is genuinely unclear, ask here. Otherwise write "none">
- Q2: ...

Branch I will work on: feature/workbench-consolidation
Estimated effort: 2.5–3 engineering days for one Codex agent.
```

Do not skip this step. The point is to align before sprawl.

---

## 3. Pack overview

| # | Prompt ID | Outcome | Est. effort |
|---|---|---|---|
| **B1** | `workbench/route-and-shell` | Create `/app/workbench` (case picker) and `/app/workbench/[caseId]` (active case) with a `WorkbenchScope` provider and `WorkbenchTabs` shell | 4 h |
| **B2** | `workbench/chapter-shell-generalize` | Promote `SyriaChapterFrame` and `SYRIA_CHAPTER_FLOW` into a generic `WorkbenchChapterShell` and `CASE_CHAPTER_FLOW` that any case can render | 4 h |
| **B3** | `workbench/syria-as-example-case` | Move all Syria constants under `src/lib/cases/syria-2026/`. Add a `CaseModule` interface. Provide a `nordalia-2026` second example so the abstraction is exercised | 5 h |
| **B4** | `workbench/dashboard-collapse` | Replace `/app/dashboard` and `/app/desk` with redirects to `/app/workbench/[caseId]?tab=desk`. Delete `/app/cockpit`. Update `useKeyboardShortcuts` and `useSituationGuard` accordingly | 3 h |
| **B5** | `workbench/surfaces-as-tabs` | Convert the 8 Phase 3 surfaces from re-export pages to tabs inside `WorkbenchTabs`. Legacy URLs redirect with the surface as the `tab` query | 4 h |
| **B6** | `workbench/sidebar-rebuild` | Sidebar collapses from 8 surface buttons + 30+ archive items to: **Workbench (active case)**, **My Cases**, **New Case**, **Settings**, **Profile**. Archive items only show with `?show_archive=1` | 3 h |
| **B7** | `workbench/multi-user-guard` | Centralize the per-case auth check in `WorkbenchScope`. Remove ad-hoc `useSituationGuard` calls from chapter components. Add tests proving cross-user reads return 404 | 3 h |
| **B8** | `workbench/dead-route-cull` | Identify the routes that have no inbound link from `Workbench`, `Tools`, `Settings`, or `My Cases`. Either delete them or mark `surface: 'archive'` and gate them behind `?show_archive=1` | 4 h |
| **B9** | `workbench/audit-and-tests` | Add `scripts/audit-workbench.ts` enforcing the contract. Wire it into `npm run audit:gate`. Add Playwright case-creation flow that any user can run | 3 h |

Total: ~33 hours, ~3 engineering days for one Codex agent.

Run them in order. Do not skip the verification gate at the end of each prompt.

---

## 4. Information architecture (target state)

```
/app
├── workbench/                             ← THE single working surface
│   ├── page.tsx                           Case picker (existing cases + create new + example cases)
│   └── [caseId]/
│       ├── page.tsx                       Active case (default tab = chapters)
│       └── layout.tsx                     WorkbenchScope provider + WorkbenchTabs
│
├── cases/                                 (existing) listing — keep, but make it a thin redirect to /app/workbench
├── situations/                            (existing) /situations/new is the case-creation wizard, KEEP. Other situation routes redirect into workbench.
│
├── settings/                              user preferences
├── profile/                               user profile
├── pricing/, privacy/, terms/             public-ish pages (already exist)
├── tools/                                 Archive of legacy tools (only visible with ?show_archive=1)
├── admin/                                 admin-only routes
└── api/                                   unchanged
```

**Eight tabs inside the workbench, scoped to the active case:**

| Tab id | Label | Content | Notes |
|---|---|---|---|
| `chapters` | **Chapters** (default) | The 5-chapter flow (Frame → Receipts → Graph → DIALECTICA → Decision Product) | This IS the workbench. Default landing tab. |
| `desk` | Desk | Status strip, executive panel, what-changed, cost cap, activity | Replaces `/app/dashboard`. |
| `context` | Context | Context Builder + onboarding + intake gates | Pack 05 redesigns this in detail. |
| `library` | Library | Sources + work products | Already split (`/app/library/sources`, `/app/library/work-products`). |
| `research` | Research | Source Scout, deep research, staged graph proposals | Existing. |
| `graph` | Graph | GraphOps, conflict graph, read-only Cypher | Existing. |
| `boardroom` | Boardroom | Brainstorming Table + advisor council | Existing. |
| `draft` | Draft | Tiptap editor, briefing studio, policy memo, exports | Existing. |

The "Tools" surface is **not a tab** — it stays at `/app/tools` as the archive entry point, surfaced only when the analyst explicitly looks for legacy/specialist tools.

---

## 5. Prompt B1 — `workbench/route-and-shell`

### Outcome
Create `/app/workbench/page.tsx` (case picker) and `/app/workbench/[caseId]/{layout.tsx,page.tsx}` (active case shell with tabs). Introduce `WorkbenchScope` (a context provider that fetches the case, gates auth, and exposes the active situation, profile, tab id, and tab setter to children). Introduce `WorkbenchTabs` (the tab bar component).

### Prerequisites
- B0 confirmation message sent and acknowledged.
- Branch `feature/workbench-consolidation` checked out from current `main`.

### Files to create
- `src/app/app/workbench/page.tsx` — case picker.
- `src/app/app/workbench/[caseId]/layout.tsx` — wraps children in `WorkbenchScope` + `WorkbenchTabs`.
- `src/app/app/workbench/[caseId]/page.tsx` — default tab (`chapters`).
- `src/components/workbench/workbench-scope.tsx` — context provider.
- `src/components/workbench/workbench-tabs.tsx` — tab strip.
- `src/components/workbench/workbench-tab-content.tsx` — tab router.
- `src/lib/workbench/tabs.ts` — `WORKBENCH_TABS` array (single source of truth, mirroring `PRODUCT_SURFACES` shape).
- `src/types/workbench.ts` — `WorkbenchTabId`, `WorkbenchTabDescriptor`.

### Files to read but not edit yet
- `src/app/app/syria-case/page.tsx` (chapter pattern reference)
- `src/components/app/app-shell.tsx` (existing shell)
- `src/hooks/use-situation-guard.ts`
- `src/stores/situation-store.ts`

### Definition of Done
- `npx tsc --noEmit` passes.
- `npm run build` produces `/app/workbench` and `/app/workbench/[caseId]` route bundles.
- `WorkbenchScope` exposes: `{ situation, analystProfile, user, activeTab, setActiveTab, isExampleCase }`.
- `WorkbenchTabs` renders 8 tabs from `WORKBENCH_TABS`. Clicking a tab updates `?tab=<id>` via `router.replace`. Server reads `searchParams.tab`.
- The case picker page lists: (a) the user's existing cases (from `useSituationStore`), (b) "Create a new case" CTA → `/app/situations/new`, (c) example cases (rendered from `src/lib/cases/registry.ts` which Pack B3 will populate).
- No reads of any other user's `users/{uid}/...` are introduced.
- One Vitest snapshot test on `WorkbenchTabs` renders 8 tabs in the documented order.

### Verification
```bash
npx tsc --noEmit
npm run build
npx vitest run src/components/workbench
```

---

## 6. Prompt B2 — `workbench/chapter-shell-generalize`

### Outcome
The Syria walkthrough's chapter shell is the cleanest UX in the repo. Promote it from a Syria-only artifact to the universal workbench layout. After this prompt, any case (Syria, Nordalia, a user's custom case) renders the same 5-chapter shell with case-specific content.

### Files to create
- `src/components/workbench/chapter-shell.tsx` — generalized version of `src/components/syria/chapter-frame.tsx`. Same accordion + numbering + active-state visuals; **no Syria styling, no Syria copy**.
- `src/lib/workbench/chapter-flow.ts` — exports `WORKBENCH_CHAPTER_FLOW` with the 5 chapter descriptors. Identical structure to `SYRIA_CHAPTER_FLOW` but with case-agnostic copy:

  | id | title | question |
  |---|---|---|
  | `situation-frame` | Situation Frame | What is happening, why does it matter, what would change the line? |
  | `source-receipts` | Source Receipts | Which sources support the case file, where is evidence still thin? |
  | `conflict-graph` | Conflict Graph | How do actors, events, claims, constraints, and commitments connect? |
  | `dialectica-reasoning` | DIALECTICA Reasoning | Which graph-grounded recipes turn evidence into policy judgment? |
  | `decision-product` | Decision Product | What can the analyst brief, save, edit, and defend with provenance? |

- `src/components/workbench/chapter-1-situation-frame.tsx` … `chapter-5-decision-product.tsx` — generic chapter components that consume `useWorkbenchScope()` and pull case-specific content from the `CaseModule` (defined in B3).
- `src/components/workbench/chapter-renderer.tsx` — given an active `caseId` and `tabId`, looks up the `CaseModule` and renders the right chapter content.

### Files to refactor (in place; preserve behaviour)
- `src/app/app/syria-case/page.tsx` — replaced by a thin wrapper that calls `<WorkbenchChapterRenderer caseId="syria-2026" />` and is then deleted in B4.
- `src/components/syria/chapter-1-situation-frame.tsx` etc. — keep, but converted into `CaseModule` providers exporting **content only**, not layout. Content is consumed by the generic chapter components.

### Hard rules
- **No new Syria-only props on the generic shell.** Anything Syria-specific must come through the `CaseModule` interface defined in B3.
- The shell uses **no Syria-flavored copy** in any string. Run `rg -i "syria" src/components/workbench/` after this prompt and expect zero matches.

### Definition of Done
- The existing `/app/syria-case` URL still renders identical pixels (visual snapshot).
- A second test page `/app/workbench/syria-2026?tab=chapters` renders the same content via the generic shell. Diff between the two render trees is empty.
- `rg -i "syria" src/components/workbench/` returns 0 matches.
- `npx tsc --noEmit && npm run build && npx vitest run` all pass.

### Verification
```bash
rg -i "syria" src/components/workbench/   # MUST return 0
npx playwright test tests/e2e/workbench-chapter-parity.spec.ts
```

(Pack will add the parity spec.)

---

## 7. Prompt B3 — `workbench/syria-as-example-case` and the `CaseModule` interface

### Outcome
Define `CaseModule` as a typed interface every example or user case implements. Move all Syria-specific constants and components into a single `src/lib/cases/syria-2026/` module that exports a `CaseModule` instance. Provide a second module (`nordalia-2026`) so the abstraction is exercised against more than one case.

### `CaseModule` interface (`src/types/case-module.ts`)

```ts
export interface CaseModule {
  id: string;                              // e.g. 'syria-2026', 'nordalia-2026'
  kind: 'example' | 'user';                // example cases ship in code; user cases ship in Firestore
  manifest: {
    name: string;
    region: string;
    summary: string;
    risk: number;                          // 0-100
    glaslStage: number;                    // 1-9
    domain: DomainId;
    tags: string[];
  };
  sources: CanonicalSourceReceipt[];       // for example cases, baked-in; for user cases, fetched from Firestore
  chapters: {
    'situation-frame':       () => Promise<ReactNode>;
    'source-receipts':       () => Promise<ReactNode>;
    'conflict-graph':        () => Promise<ReactNode>;
    'dialectica-reasoning':  () => Promise<ReactNode>;
    'decision-product':      () => Promise<ReactNode>;
  };
  truthLayers: {
    episodic: TruthLayerSnapshot;
    semantic: TruthLayerSnapshot;
    stance:   TruthLayerSnapshot;
  };
}
```

`TruthLayerSnapshot` has `nodeCount`, `edgeCount`, `confidenceMin`, `confidenceMax`, `lastUpdated`, and `provenanceCoverage` (% of nodes with ≥1 cited source).

### Files to create
- `src/types/case-module.ts` — interface above.
- `src/lib/cases/registry.ts` — the registry of example cases. Exports `getCaseModule(id)`, `listExampleCases()`.
- `src/lib/cases/syria-2026/index.ts` — re-exports the existing `src/lib/constants/syria-demo-case.ts` content as a `CaseModule`.
- `src/lib/cases/syria-2026/chapters.tsx` — async loaders for the 5 Syria chapter components.
- `src/lib/cases/nordalia-2026/index.ts` — second example case (Nordalia is the existing fictional NDC case in `src/lib/constants/demo-conflict.ts`). Cover all 5 chapters.
- `src/lib/cases/user-cases/loader.ts` — for user cases, builds a `CaseModule` from Firestore (`users/{uid}/situations/{caseId}` + subcollections).

### Files to move (not delete)
- `src/lib/constants/syria-demo-case.ts` → `src/lib/cases/syria-2026/case-data.ts`. Update the 14 importers (existing imports can be kept compiling via a thin re-export shim during the migration; remove the shim at the end of B8).

### Definition of Done
- `getCaseModule('syria-2026')` returns a `CaseModule` whose chapters render identical content to the current `/app/syria-case`.
- `getCaseModule('nordalia-2026')` returns a `CaseModule` whose 5 chapters render without crashing and pull from `DEMO_CONFLICT`.
- `listExampleCases()` returns at least 2 entries.
- Loading a user case via `loadUserCaseModule(uid, caseId)` returns a working `CaseModule` populated from Firestore (`metadata`, `documents`, `sources`, `tool-data` subcollections).
- `rg "import .* syria-demo-case" src/` returns 0 matches outside `src/lib/cases/syria-2026/`.

### Verification
```bash
npx tsc --noEmit
npx vitest run src/lib/cases
```

---

## 8. Prompt B4 — `workbench/dashboard-collapse`

### Outcome
`/app/dashboard`, `/app/desk`, `/app/syria-case`, and `/app/cockpit` collapse into the workbench. The first three return 308 redirects to `/app/workbench/[caseId]?tab=<id>` when an active case is set, otherwise to `/app/workbench`. `/app/cockpit` is deleted (it has 0 inbound links from product surfaces).

### Files to edit
- `src/app/app/dashboard/page.tsx` — replace contents with a redirect:
  ```ts
  import { redirect } from 'next/navigation';
  import { resolveActiveCaseId } from '@/lib/workbench/resolve-active-case';
  export default async function DashboardLegacyRedirect() {
    const caseId = await resolveActiveCaseId();
    redirect(caseId ? `/app/workbench/${caseId}?tab=desk` : '/app/workbench');
  }
  ```
- `src/app/app/desk/page.tsx` — same pattern, `?tab=desk`.
- `src/app/app/syria-case/page.tsx` — redirect to `/app/workbench/syria-2026?tab=chapters` (always, regardless of active case — Syria is the example case).
- `src/components/workbench/tab-content/desk.tsx` — extracts the Desk content from the existing 587-line `DashboardPage` (executive panel, status strip, what-changed, cost-cap, activity feed, daily-read button) into a tab component.

### Files to delete
- `src/app/app/cockpit/page.tsx` and `src/app/app/cockpit/` directory — verify zero inbound links via `rg "/app/cockpit|cockpit/page" src/` first.

### Hard rules
- The desk-tab component **must not** import any `Syria*` constants. Pack B3 has moved them; if the import resolves, B3 was incomplete — fix B3 first.
- Demo-mode behaviour (`isDemo` branch) must be preserved by routing demo users into `/app/workbench/syria-2026?tab=desk` instead of the legacy `DEMO_SITUATION` branch.
- The `useSituationGuard` and `useKeyboardShortcuts` hooks must stop pointing at `/app/dashboard` and start pointing at `/app/workbench`. Search and update.

### Definition of Done
- `rg "/app/dashboard|/app/desk|/app/syria-case|/app/cockpit" src/` returns hits **only** in the redirect files above.
- A logged-in user with an active situation visiting `/app/dashboard` lands at `/app/workbench/<their-active-case>?tab=desk` with no flash of the old page.
- The previous Syria walkthrough at `/app/syria-case?recording=1&case=syria` lands at `/app/workbench/syria-2026?tab=chapters&recording=1` (recording flag is preserved).
- All Vitest tests pass; the existing dashboard tests are moved into `tests/workbench/desk-tab.spec.ts`.
- Playwright golden-path Syria scroll-tour spec passes against the new URL.

### Verification
```bash
npx tsc --noEmit
npm run build
npx vitest run
npx playwright test tests/e2e/workbench-syria-tour.spec.ts
```

---

## 9. Prompt B5 — `workbench/surfaces-as-tabs`

### Outcome
The 8 Phase 3 surfaces become tabs inside `WorkbenchTabs` instead of stand-alone routes. The standalone `/app/<surface>` URLs become 308 redirects to `/app/workbench/[caseId]?tab=<surface>`.

### Files to edit
- For each of `desk`, `context`, `library`, `research`, `graph`, `boardroom`, `draft`:
  - Replace `src/app/app/<surface>/page.tsx` with a redirect identical in shape to the dashboard redirect from B4.
  - Move the existing UI into `src/components/workbench/tab-content/<surface>.tsx`.
- `src/lib/workbench/tabs.ts` — set the 8 `WorkbenchTabDescriptor` entries with `id`, `label`, `iconName`, `summary`, `requiresCase: true`, `defaultForChaptersTab: false` except for `chapters` itself.
- `src/components/workbench/workbench-tab-content.tsx` — switch on `activeTab`, render the right `tab-content/*` component.

### Hard rules
- **Library** is already split into `/app/library/sources` and `/app/library/work-products`. Inside the workbench, the Library tab renders a sub-nav switching between the two. Do not collapse them.
- **Tools** is **not** a tab. Keep `/app/tools` as the archive entry, reachable from the sidebar with `?show_archive=1`.
- The `withCalibration` wrapper on AI routes is not affected — only frontend routing changes here.

### Definition of Done
- `rg "import .* from '@/app/app/(desk|context|library|research|graph|boardroom|draft)/page'" src/` returns 0 matches (no other code is depending on these as components).
- Visiting `/app/desk` while logged-in with an active case lands at `/app/workbench/<id>?tab=desk` with content unchanged.
- Visiting `/app/desk` without an active case lands at `/app/workbench` (case picker).
- `npx tsx scripts/audit-phase3-product-surface.ts` is updated to assert tabs, not standalone routes; passes.

### Verification
```bash
npx tsc --noEmit
npm run build
npx tsx scripts/audit-phase3-product-surface.ts
npx vitest run src/components/workbench
```

---

## 10. Prompt B6 — `workbench/sidebar-rebuild`

### Outcome
The 1,117-line `src/components/app/app-sidebar.tsx` collapses to a narrow shell. Default sidebar items are: **Workbench** (active case + tab quick-jump), **My Cases**, **New Case**, **Settings**, **Profile**, **Sign out**. The 30+ archive items are hidden by default and surface only with `?show_archive=1`.

### Target sidebar shape (default)

```
┌──────────────────────────────┐
│  PRAXIS by TACITUS           │
│                              │
│  ▣  Workbench                │  ← expands to show 8 tabs of the active case
│      Chapters     1          │
│      Desk         2          │
│      Context      3          │
│      Library      4          │
│      Research     5          │
│      Graph        6          │
│      Boardroom    7          │
│      Draft        8          │
│                              │
│  ⚏  My Cases (n)             │
│  ＋  New Case                 │
│                              │
│  ⚙  Settings                 │
│  ◐  Profile                  │
│                              │
│  Sign out                    │
└──────────────────────────────┘
```

### Files to edit
- `src/components/app/app-sidebar.tsx` — rewrite. Drop `navSections`, `productSurfaceItems`, `registryArchiveItems`, `legacyArchiveItems` from the default render path. Expose them only when `searchParams.has('show_archive')`.
- `src/components/app/situation-selector.tsx` — keep, but render it inside the **My Cases** entry as a popover.

### Definition of Done
- A fresh user landing at `/app/workbench` sees a sidebar with **5 top-level items** (plus Sign out). Counted by Playwright.
- With `?show_archive=1`, the archived legacy tools render below in a clearly labelled "Archive (legacy tools)" group.
- Keyboard shortcut `g d` (go-to dashboard) → `/app/workbench/[caseId]?tab=desk`. Other go-to shortcuts updated similarly.
- `wc -l src/components/app/app-sidebar.tsx` < 350 lines.

### Verification
```bash
npx playwright test tests/e2e/sidebar-default.spec.ts
npx vitest run src/components/app
```

---

## 11. Prompt B7 — `workbench/multi-user-guard`

### Outcome
Centralize per-case auth in `WorkbenchScope`. No chapter, tab, or sub-component fetches `users/{otherUid}/...`. Add automated tests that prove cross-user reads are impossible from the client.

### Files to edit
- `src/components/workbench/workbench-scope.tsx` — fetches the case via `loadUserCaseModule(currentUid, caseId)`. If the case does not belong to the user, render a `<NotFound>` (Next 404) immediately. **Never** render chapter content for a case the user does not own.
- `src/hooks/use-situation-guard.ts` — narrow to "is the user onboarded" only. Drop the active-situation logic; that lives in `WorkbenchScope` now.
- `src/lib/cases/user-cases/loader.ts` — must verify ownership server-side before returning. Use the Firebase Admin SDK (`adminAuth.verifyIdToken` is already in use elsewhere).

### Tests to add (`tests/firebase/workbench-multi-user.spec.ts`)
- User A creates a case. User B authenticates and tries to load `/app/workbench/<A's caseId>` — must hit `notFound()` (404), not see any case data.
- User B tries to call `loadUserCaseModule(uidB, <A's caseId>)` directly — must throw `CaseNotFoundError`.
- User B tries to call any AI route with `situationId = <A's caseId>` — must return 403 (the existing `withCalibration` should already do this; verify).

### Definition of Done
- The new tests pass.
- `firestore.rules` is **not modified** (it is already correct).
- `rg "users/\$\{[a-zA-Z]+\}" src/` returns no patterns where the uid variable is anything other than the authenticated user's id (i.e., no `otherUid`, no path-derived uid).

### Verification
```bash
npx vitest run tests/firebase/workbench-multi-user.spec.ts
```

---

## 12. Prompt B8 — `workbench/dead-route-cull`

### Outcome
The 81 `/app/*` routes drop to ~25. Routes with zero inbound links from `Workbench`, `Tools` archive, `Settings`, or `My Cases` are either deleted or marked `surface: 'archive'` and hidden behind `?show_archive=1`.

### Process
1. Run the route inventory script:
   ```bash
   npx tsx scripts/audit-routes.ts > /tmp/route-inventory.txt
   ```
2. For each route under `/app/*`:
   - Find inbound links via `rg "href=['\"]/app/<route>" src/`.
   - Find imports of its `page.tsx` via `rg "from '@/app/app/<route>/page'" src/`.
   - If both return zero, the route is dead.

### Routes Codex must delete or archive (verify each before deciding)

| Route | Action | Why |
|---|---|---|
| `/app/cockpit` | DELETE | Already removed in B4. |
| `/app/desks/*` (subroutes) | KEEP behind `?show_archive=1` | Sidebar entry was a legacy specialist surface. Move into Tools archive. |
| `/app/desktop` | DELETE if present | Stale. |
| `/app/projects` | KEEP if used by case-creation; DELETE otherwise | Verify with `rg "/app/projects" src/`. |
| `/app/methodology` | KEEP at top-level (`/methodology` public-ish doc) | Appears to be a legitimate methodology page; do not move. Confirm. |
| `/app/syria-case` | DELETE (already redirected in B4) | Replaced by workbench. |
| `/app/sanctions` and `/app/sanctions-explorer` | KEEP one, archive the other | Identify the canonical one, alias the other. |
| `/app/source-monitor` and `/app/source-scout` | KEEP one (Research tab uses `source-scout`), archive `source-monitor` | Verify. |
| `/app/conflict-graph` and `/app/graph` and `/app/graphops` | KEEP one inside Graph tab, archive the others or alias | Resolve duplication. |
| Tool routes for "specialist" tools (e.g., `/app/peacebuilding-index`, `/app/electoral-risk`, `/app/economic-impact`) | KEEP behind `?show_archive=1` in `/app/tools` archive grid | Don't delete; these have non-trivial content, just don't surface them. |

**Do not delete anything you are unsure about.** When unsure, mark `visible: false` in the tool registry, leave the route file in place, and link to it only from `/app/tools?show_archive=1`.

### Files to edit
- `src/lib/constants/tool-registry.ts` — set `surface: 'archive'` and `visible: false` on archived tools.
- `src/lib/navigation/tool-preferences.ts` — same.
- `scripts/audit-workbench.ts` (created in B9) — enforces the 25-route cap.

### Definition of Done
- `find src/app/app -name 'page.tsx' | wc -l` is **≤ 25**.
- All deletions show up in the diff with a clear commit message: `chore(workbench): remove dead route /app/<name> (zero inbound links, replaced by <new-route>)`.
- `npm run build` passes; production sitemap regenerates without 404s.

### Verification
```bash
find src/app/app -name 'page.tsx' | wc -l           # ≤ 25
npx tsx scripts/audit-routes.ts | tee /tmp/audit.txt
npm run build
```

---

## 13. Prompt B9 — `workbench/audit-and-tests`

### Outcome
A single audit script (`scripts/audit-workbench.ts`) that enforces the workbench contract, plus a Playwright case-creation flow that any user can run end-to-end. Both are wired into `npm run audit:gate`.

### Audit script must enforce
1. `/app/workbench/page.tsx` exists and is a server component.
2. `/app/workbench/[caseId]/{layout.tsx,page.tsx}` exist.
3. `WORKBENCH_TABS` has exactly 8 entries with the documented ids.
4. `WORKBENCH_CHAPTER_FLOW` has exactly 5 entries with the documented ids.
5. `getCaseModule('syria-2026')` and `getCaseModule('nordalia-2026')` resolve.
6. No code under `src/components/workbench/` imports anything matching `syria-` or `nordalia-` (case-specific code lives only under `src/lib/cases/<case>/`).
7. `find src/app/app -name 'page.tsx' | wc -l` ≤ 25.
8. `rg "/app/(dashboard|desk|cockpit|syria-case)\b" src/app/app/*/page.tsx` only matches redirect files (each file < 20 lines).

### Playwright spec (`tests/e2e/workbench-case-creation-flow.spec.ts`)
1. Sign in as a fresh test user.
2. Land at `/app/workbench` (case picker, empty state visible).
3. Click "Create a new case" → `/app/situations/new` wizard.
4. Complete the 4-step wizard with synthetic content.
5. Wizard redirects to `/app/workbench/<newCaseId>?tab=chapters`.
6. Default tab is Chapters; Chapter 1 (Situation Frame) is open.
7. Switch to Desk tab; verify executive panel renders.
8. Switch to Graph tab; verify GraphOps loads.
9. Sign out; sign in as a different user; visit `/app/workbench/<newCaseId>` → 404.

### Wire into the audit gate
Update `package.json`:
```json
{
  "scripts": {
    "audit:workbench": "tsx scripts/audit-workbench.ts",
    "audit:gate": "npx tsc --noEmit && npm run lint && npm run build && npm run audit:routes && npm run audit:gcp && npm run audit:workbench && npx vitest run"
  }
}
```

### Definition of Done
- `npm run audit:workbench` exits 0 on `main` after this pack.
- The Playwright spec passes against `npm run dev` locally and against a Cloud Run staging deploy.
- `npm run audit:gate` passes.

### Verification
```bash
npm run audit:gate
npx playwright test tests/e2e/workbench-case-creation-flow.spec.ts
```

---

## 14. Hard rules — applied to every prompt in this pack

These reinforce the existing PRAXIS guardrails. Codex **must not** violate them.

- **No new `gemini-*` strings** anywhere outside `src/lib/ai/providers.ts`.
- **No bypass of `withCalibration`** on AI routes. The frontend can change shape; the AI route boundary contract does not move in this pack.
- **No weakening of `firestore.rules`, `with-auth`, or `cookie-signer`.** If a route needs new access, the auth rule comes first, then the route.
- **No silent demo↔real data mixing.** Demo users land on `syria-2026`; real users land on their own cases. The `WorkbenchScope` provider must distinguish and never pass demo data into a real user's render path.
- **No new `'unsafe-inline'` or `'unsafe-eval'`** in CSP. Use the existing nonce.
- **No client-side reads of `users/{otherUid}/...`.** Period.
- **No removal of `withCalibration` exempt list entries.** If a route is exempt today, it stays exempt unless explicitly approved.
- **No deleting tests.** If a test no longer applies (e.g., it covered `/app/dashboard`), move it under `tests/workbench/` and update assertions.

---

## 15. Verification gate (run at the end of the pack)

```bash
git status                    # must be clean before push
npx tsc --noEmit
npm run lint
npm run build
npm run audit:routes
npm run audit:gcp
npm run audit:workbench
npx vitest run
npx playwright test
```

All must pass. Then:

```bash
git checkout -b feature/workbench-consolidation
git add -A
git commit -m "feat(workbench): collapse dashboard/desk/syria-case into /app/workbench

The 81 /app/* routes drop to 25. Eight Phase 3 surfaces become tabs
inside the workbench. The Syria 5-chapter walkthrough is now a generic
WorkbenchChapterShell that any user case renders. Syria moves to
src/lib/cases/syria-2026/ as one example among many; nordalia-2026
ships as a second example to exercise the abstraction.

Multi-user isolation is centralised in WorkbenchScope. Cross-user
reads return 404. Sidebar collapses from 1,117 lines to <350.

Closes pack 03 (B1-B9). Verified by audit:gate + Playwright."
git push origin feature/workbench-consolidation
```

Open a PR and tag Giulio for review. **Do not merge to `main` without his sign-off.**

---

## 16. Out of scope for this pack

The following are explicitly **not** part of pack 03. They are addressed in packs 04 (landing) and 05 (context vs tools):

- Landing page copy, hero, single CTA, multi-case examples gallery → **Pack 04**.
- Context Studio rebuild (the building of context, separate from analysis tools) → **Pack 05**.
- DIALECTICA recipe wiring against live Neo4j queries → **future pack** (see open red flags in `PRAXIS_PHASE_SPEC_AUDIT_2026-05-06.md`).
- The 20-verb facade for `/api/ai/*` routes → **future pack**, called out in the audit.

---

## 17. Closing note for the agent

Giulio cares about the **shape** of the product more than any individual feature. The point of this pack is to make the shape legible: **one workbench, many cases, graph-anchored, scoped per user**. Every Codex decision should be measured against that sentence.

If you find code that is unsafe, dead, or contradicts the shape — flag it in the PR description, do not silently delete it. If you are unsure whether to delete or archive, archive. Reversibility beats correctness in early refactors.

When in doubt, re-read `praxis-conventions/SKILL.md` and the **Hard Rules** section above.
