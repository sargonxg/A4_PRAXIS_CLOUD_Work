# App Simplification + Admin Power — Design

Date: 2026-05-13
Status: Ideation with a first slice already shipped.
Author: Claude with Giulio.

---

## 0. The Bet

A normal PRAXIS user should see roughly four things — Ask PRAXIS, the
cores, the library, and the editor. Every other surface either:

- collapses into one of those four, or
- moves behind an "Advanced" or "Administration" section that's
  closed by default and reads like a control room when opened.

The product should feel like Apple Notes with Apple Mail beside it,
not like a 55-tool marketplace with a sidebar full of menus. Behind
that small surface, the backend keeps doing crazy work: ingestion,
calibration, graph stitching, retrieval, audit, agent orchestration,
admin policy. The user just doesn't see it unless they ask.

This doc captures the full scope and the order to ship it.

---

## 1. Shipped in this session

| Move | Where | Notes |
|---|---|---|
| Grouped sidebar with Workspace · Advanced · Administration | `src/components/app/app-sidebar.tsx` + `src/lib/navigation/primary-nav.ts` | Workspace always open; Advanced closed; Administration admin-only and closed. Auto-expands when navigating inside a group. Collapsed icon rail still shows everything. |
| Cores promoted to primary nav | `NAV_GROUPS.workspace.cores → /app/contexts` | The cores editor was previously a settings-style page; now it's a top-level destination. |
| Mobile bottom nav reduced to the 4-tab Workspace spine | `mobile-bottom-nav.tsx` | Matches desktop spine. |
| Hero animation: rotating headline phrases, organic chamber, data ribbons, expert-eye scan, knowledge laminate, grounding beam | landing pass | (Separate doc — kept here as context for tone.) |

---

## 2. Still to ship (ordered by leverage)

### 2.1 Workbench drag-and-drop core composer  *(highest leverage)*

The workbench is where everyday work happens. Today it shows tabs and
panels; the work of *changing the active core stack* is buried.

Target: a single horizontal **capsule strip** at the top of every
workbench page that:

- Renders the six (eventually seven) cores as tile chips.
- Each chip is `dnd-kit/sortable` draggable for reordering.
- Each chip exposes a one-click swap menu: "User → Senior Analyst",
  "Situation → Indo-Pacific 2026", "Source → Receipts pack v3".
- A drop target labelled "Replace" appears on hover so a user can
  drag a chip from a Cores-page list right into the active strip.
- A "Save as capsule" button writes the current stack to
  `users/{uid}/capsules/{capsuleId}` for share/fork.

Backend: extend `src/lib/knowledge/context-engine.ts` (codex's recent
adapter) with `attachCapsule(situationId, capsuleId)` and
`forkCapsule(capsuleId, scope)`. The strip becomes the only UI for
core manipulation; deep core editors live one click into a chip.

Affected files (anticipated):
- `src/components/app/core-context-strip.tsx` (exists — upgrade to dnd).
- `src/components/app/active-core-stack.tsx` (exists — wire to capsules).
- New `src/components/cores/capsule-picker.tsx` for the chip swap menu.
- `src/app/api/context/packages/route.ts` (codex's new route) for
  list/save.

### 2.2 Editor like a real Word document

`/app/write` today is a memo studio with claim chips on the right and
a textarea-style body. Target:

- Full-page document canvas with serif body, Word-style page chrome
  (title bar, page numbers, A4 dimensions, generous margins).
- Cited brackets `[3]` render as superscript and link to source
  receipts in a side rail that *only appears on hover/selection*, so
  the default reading state is just the document.
- Inline AI commands via `/` slash menu: `/grounded`, `/cite`,
  `/red-team`, `/rewrite-cautiously`, `/scenario`.
- Comments + accept-changes UI like Track Changes.
- Export targets: Markdown (default), Word `.docx`, PDF with cited
  footnotes.

Library candidates (review before picking):
- **Tiptap** with the Pro Document module — gives Word-like
  selection model, comments, track-changes, page breaks, table of
  contents. Mature.
- **Lexical** (Meta) — leaner, but no first-party page chrome /
  track-changes; would need building.
- **BlockNote** — easiest to drop in, but more Notion-style than
  Word-style.

Recommend Tiptap. Decision pending.

### 2.3 Page consolidation / "remove old pages"

Audit pass to remove or fold:

| Today | Verdict |
|---|---|
| `/app/dashboard` | Keep but demote to Advanced. Most users skip it. |
| `/app/cases` (legacy "cases" list) | Fold into Library; redirect. |
| `/app/situations` and `/app/situations/new` | Fold into a "Start a Situation" flow that lives inside the Cores page; redirect both routes. |
| `/app/profile` | Fold into `/app/settings/profile`; redirect. |
| `/app/settings/personas/*` | Move to Admin. Personas are an admin concept. |
| `/app/settings/api-keys`, `model-preferences`, `notifications`, `system-health` | Move to Admin → Settings. |
| `/app/tools/archive` | Already gated by `?show_archive=1`. Make it admin-only. |

Each consolidation is a small PR: delete the old page, add a redirect
in `next.config.ts` or via a server component that calls `redirect()`.

### 2.4 Ask PRAXIS expansion

Today's Ask is a single-turn answer with the active core stack
attached. Expand to:

- Multi-turn with persisted thread per Situation.
- Tool routing visible: when Ask invokes a tool ("Run scenario",
  "Find source"), a small "tool chip" appears in the message footer.
- Source picker inline: `@source` token autocompletes against the
  active Source Core.
- Output piping: "Send to Memo Studio" sticks the answer at the
  cursor in the active document.
- Voice input on supported devices.

### 2.5 Tools and contexts called by specific name; library audit

User wants the registry to read like a phone book — every tool and
every context appears under one canonical name everywhere. Pass:

- Sweep `src/lib/constants/tool-registry.ts` and
  `src/lib/tools/tool-navigation.ts` to ensure every tool has one
  `displayName` and one `slug`. Remove the `shortLabel` / `label` /
  `name` triple where it exists.
- Same sweep for contexts in `src/lib/context/*` and demo cores.
- Add an `audit:names` script that fails if any tool or core has more
  than one user-visible string.

### 2.6 Administration panel — full knowledge for admins

Today admin pages exist but are fragmented. Bring them under
`/app/admin` with a consistent shell that exposes:

- **Sources** — every feed enabled on this tenancy, last poll status,
  per-feed token rotation, per-feed enable/disable.
- **Reads** — log of what every agent read on behalf of which user,
  with cost, model, latency. Filterable by uid, situation, tool.
- **Controls** — feature flags, rate limits, model routing overrides,
  domain enable/disable.
- **Users** — already exists; extend with per-user core override.
- **Audit invariants** — surface the existing `audit:*` scripts as
  one-click runs from the admin shell.

### 2.7 Apple-grade interaction polish

Once 2.1–2.6 land, sweep for:

- Every primary action becomes a single button with one verb. No
  trailing icons unless the verb is "open" / "ship" / "fork".
- Empty states are short and warm — "No capsule yet. Build one."
- Every page header is one line, one sentence under.
- No more than two CTAs on any single screen.

---

## 3. Decisions to make before 2.1

1. **Capsule scope:** does a capsule wrap *all six* cores or just a
   subset chosen by the user? (Recommend all six; "subset" is just
   "User Core unspecified" inside a six-core capsule.)
2. **Forking model:** does fork = copy-on-write with parent link, or
   independent copy? (Recommend copy-on-write so we can show
   provenance trees in admin.)
3. **Tiptap commercial vs. OSS:** Tiptap Pro features cost. Acceptable?
4. **Admin email allowlist surfacing:** can the client know who is an
   admin via `user.role === 'admin'`, or do we need a `/api/admin/me`
   round-trip? (Currently using role. Confirm role is set on admin
   accounts in production.)

---

## 4. Out of scope for this doc

- Pricing surface changes.
- New AI provider integrations.
- Memory Core (Cognee) exposure — covered in the hero spec.
- Public-facing landing page beyond the existing hero. Already shipped.

---

## 5. Next step

Land the workbench capsule strip (§2.1) as the next ship. Then editor
upgrade (§2.2). Then the page consolidation pass (§2.3). Each is its
own PR. Decisions in §3 unblock §2.1.
