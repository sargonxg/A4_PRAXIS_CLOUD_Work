# CORES, INLINE

> **Path:** `docs/v7/build/02_CORES_INLINE.md`
> **What this is:** the simplified mental model for cores and the exact
> in-page interactions for creating, editing, attaching, and forking them.
> Where the strategic brief 03 says *what* a core is, this doc says
> *how the user touches one* without leaving the page they're on.
> **Read alongside:** `docs/v7/03_CONTEXT_AND_SUBSTRATE.md` for the full
> schemas, and Loop 4 of `01_THE_NEW_FACE.md` for the visual surface.
> **Iteration model:** three loops, each shippable as one PR.

---

## The simplified mental model

The user only ever needs to think about **two** first-paint anchors, then can attach supporting cores only when useful:

1. **My Core (User Core)** — *who I am.* Loaded automatically. Always attached. The user does not pick this; PRAXIS uses it for every query.
2. **Case Cores (Situation Cores)** — *what I'm working on.* The user can attach zero, one, or many to a thread. They can compare cases, fork one, share one, or blend one with a methodology/rubric/source core.

The other six (Team, Source, Document, Graph, Output, PRAXIS Core) are real but **not destination-level complexity** in v7. They live as panels inside drawers or as attachable chips in the first-class picker:

- Source Core → "Sources" tab inside the Situation drawer.
- Document Core → "Documents" tab inside the Situation drawer.
- Graph Core → "Graph" tab inside the Situation drawer.
- Output Core → "Outputs" tab inside the Situation drawer (read-only summary; full editing in `/app/outputs`).
- Team/methodology/rubric cores → attachable examples in the picker, with admin editing later.
- PRAXIS Core → platform-only; it contributes silently.

This is the **single most important design decision** in v7's cores experience: the schema has eight types, but the main screen starts with one always-present User Core and asks the user to attach the context cores that matter for this question.

---

## What "My Core" carries (and where the user edits it)

The User Core holds:

- **Name + role** (e.g., "Giulio · conflict analyst").
- **Mandate / desk** (e.g., "multilateral diplomacy practitioner").
- **Communication style** — formality, citation density, structure preference.
- **Language and jurisdiction.**
- **Model preferences** — which Vertex model for Quick / Deep / Memo modes; cost ceiling per thread.
- **Default attached cores** — Situations, methodology cores, team cores that always come along.
- **Saved Situations** — the analyst's recent and pinned cases.

The user edits this in two places:

1. **Quick edit:** click the User Core chip on the homepage → side drawer opens with the most-used fields (name, role, style, language). 90% of edits happen here.
2. **Full edit:** drawer's "Open full editor" → `/app/cores/me`. All fields visible. This is the "settings" page in old terms — but reframed as a core editor for consistency.

There is no separate "Profile" page in v7. The User Core *is* the profile.

---

## What "Case Core" carries (and where the user edits it)

The Situation Core holds:

- **Frame** — the four-field framing: what's happening, why it matters, what would change the assessment, what's the policy question.
- **Goals** — what the analyst is trying to achieve with this case.
- **Geography** — regions, countries, optional bounding box.
- **Case type and ontology** — primary ontology binding (one of 9), compatible secondaries.
- **Hypotheses** — open questions and stances under test.
- **Gaps** — what's missing (sources, actors, events, claims).
- **Methodology** — links to a parent methodology or rubric.
- **Tabs (managed inside the drawer):** Actors, Timeline, Sources, Documents, Graph, Outputs.

The user edits a Situation Core in three places:

1. **Quick edit (drawer):** click the chip → side drawer with the frame and a tab strip.
2. **Full edit:** drawer → "Open in workspace" → `/app/situations/[id]`. The full Situation surface (per Brief 01 §4.3).
3. **Specific tab edits:** the drawer's tab strip lets the user edit Actors, Timeline, Sources, etc., without leaving the drawer.

The drawer is the **default**. The full workspace is the escape hatch when the case gets dense.

---

## Loop 1 — User Core inline editing

**Goal of this loop:** the User Core chip on the homepage opens a working drawer that edits real fields in real Postgres, with optimistic UI and autosave.

### Drawer contents (User Core)

```
┌──────────────────────────────────────────────────┐
│ 🟦 My Core                              ⋯  ✕    │  ← header
├──────────────────────────────────────────────────┤
│                                                  │
│ Name        [Giulio Catanzariti          ]       │
│ Role        [Conflict analyst             ]      │
│ Mandate     [Multilateral diplomacy        ]     │
│ Language    [en-US ▾]   Jurisdiction [—  ▾]     │
│                                                  │
│ Style                                            │
│   Formality      ◉ Formal  ○ Plain  ○ Casual    │
│   Citation       ◉ High    ○ Medium ○ Low       │
│   Structure      ○ Narrative ◉ Bulleted ○ Mix   │
│                                                  │
│ Models                                           │
│   Quick   [gemini-flash    ▾]                    │
│   Deep    [gemini-pro      ▾]                    │
│   Memo    [gemini-pro      ▾]                    │
│   Cost ceiling per thread:  $[ 2.50 ]            │
│                                                  │
│ Default attached cores                           │
│   🟧 Mediation rubric     ⋮  ⨯                  │
│   🟫 Source quality guide ⋮  ⨯                  │
│   [+ add]                                        │
│                                                  │
│ ─────────────────────────────────────────────    │
│ Open full editor →                               │
└──────────────────────────────────────────────────┘
                                  Saved 2s ago ✓
```

### Behaviour

- Drawer opens from the right (Radix `Sheet`), 480px wide on desktop, full-screen on mobile.
- Every field is editable in place. No "edit" mode toggle.
- Autosave: 600ms debounce. Saving status in the bottom-right corner.
- The drawer can stay open while the user types in the Ask bar — the right rail just moves leftward to make room.
- Closing the drawer commits the last save and animates closed.
- Keyboard: `Esc` closes; `Cmd+S` forces immediate save (in case the user leaves quickly).

### Backend wiring

- `GET /cores/me` → returns the User Core for the authenticated user.
- `PATCH /cores/me` → updates the fields. Owner-scoped (the only owner is the caller). Audited via `core_audit`.
- The "default attached cores" list is a `core_id[]`; the API resolves them server-side and returns hydrated chips.

### Loop 1 acceptance

- [ ] Clicking the User Core chip on `/app/home` opens the drawer.
- [ ] All fields persist via `PATCH /cores/me`.
- [ ] Autosave works (no lost edits when drawer closes).
- [ ] `audit:cores-owner-scoping` green: every read/write is filtered to the caller.
- [ ] Reload preserves edits.
- [ ] Mobile drawer takes full screen, scrolls cleanly, save button visible.

---

## Loop 2 — Situation Core inline editing + creation

**Goal of this loop:** the Situation Core chip opens a drawer with the frame + tabs. New Situations can be created from the homepage without going to a separate page.

### Drawer contents (Situation Core)

```
┌─────────────────────────────────────────────────────────┐
│ 🟪 Syria 2026 transition                    ⋯  ✕       │
├─────────────────────────────────────────────────────────┤
│ Frame · Actors · Timeline · Sources · Graph · Outputs  │  ← tabs
├─────────────────────────────────────────────────────────┤
│ Frame                                                   │
│                                                         │
│ What's happening                                        │
│ [ The Assad-era political settlement is in transition ] │
│ [ following December 2024…                             ] │
│                                                         │
│ Why it matters                                          │
│ [ Regional stability, refugee return pathways…         ] │
│                                                         │
│ What would change the assessment                        │
│ [ Major escalation in northeast, foreign re-entry…    ] │
│                                                         │
│ Policy question                                         │
│ [ Should OCHA recalibrate access strategy in NES?     ] │
│                                                         │
│ Goals                                                   │
│ • Brief OCHA leadership by Friday                      │
│ • Map stakeholders in northeast Syria                  │
│ [+ add goal]                                            │
│                                                         │
│ Ontology       [Conflict ▾] +Secondary: [Humanitarian] │
│ Geography      [Syria · NES · Idlib]                   │
│                                                         │
│ Hypotheses (3)                          [+ add]         │
│ Gaps (5)                                                │
│                                                         │
│ ─────────────────────────────────────────────────────   │
│ Open in workspace →    Fork →    Share →               │
└─────────────────────────────────────────────────────────┘
                                          Saved 4s ago ✓
```

### Tabs inside the drawer

Each tab inside the Situation drawer is a thin view, not the full panel from `/app/situations/[id]`. Quick-edit only.

- **Frame** (default): the four-field frame plus goals, ontology, geography.
- **Actors:** list of actors with quick-add. "See all" link to the full Situation page.
- **Timeline:** chronological events with quick-add. "See all" link.
- **Sources:** count + last 5 added + "Open Sources" link to `/app/sources`.
- **Graph:** thumbnail of the graph with stats. "Open Graph" link.
- **Outputs:** count + last 5 + "Open Outputs" link.

The tab strip is intentionally narrow. **The drawer is for adjusting context, not for deep work.** Deep work happens in `/app/situations/[id]` and `/app/sources`, etc.

### Creating a new Situation Core (homepage)

The "+ new Situation" affordance lives:
- In the Situations rail item (left rail, expand → "+ new").
- In the situation pill in the header (dropdown → "+ new Situation at the bottom").
- In the Ask bar's empty state when no Situation is active.

Click → a popover opens (not a full drawer):

```
┌─────────────────────────────────────────┐
│ New Situation                           │
├─────────────────────────────────────────┤
│ Name        [                       ]   │
│                                         │
│ Start from                              │
│   ◉ A blank frame                       │
│   ○ Fork from another Situation         │
│   ○ Use a team template                 │
│                                         │
│ Suggested ontology  [—  ▾]              │
│   (auto-detected after you add a frame) │
│                                         │
│ [ Cancel ]              [ Create ]      │
└─────────────────────────────────────────┘
```

Creating a Situation:
1. Inserts a row in `cores` (kind=`situation`).
2. Inserts a row in the legacy `situations` table linked via `core_id` for backward compat with the existing graph/timeline UIs.
3. Sets the new Situation as the active one in the header pill.
4. Opens the drawer in edit mode so the user starts adding the frame.

### Forking a Situation Core

From the Situation drawer's three-dot menu → **Fork into new Situation**:

```
┌─────────────────────────────────────────┐
│ Fork "Syria 2026 transition"            │
├─────────────────────────────────────────┤
│ New name  [Syria 2026 — refugees focus] │
│                                         │
│ Inherit                                 │
│   ☑ Frame and goals                     │
│   ☑ Methodology                         │
│   ☑ Ontology binding                    │
│   ☑ Sources (linked, not copied)        │
│   ☐ Actors (copy current map)           │
│   ☐ Timeline events                     │
│   ☐ Hypotheses and gaps                 │
│                                         │
│ [ Cancel ]              [ Fork ]        │
└─────────────────────────────────────────┘
```

The fork sets `parent_core_id` and copies/links per the user's choices. After fork, the new Situation is created and the user is asked "Open the new Situation now?" → if yes, the header pill swaps and the homepage reloads with the new context.

### Backend wiring

- `POST /cores` (kind=`situation`, name, optional `parent_core_id`).
- `GET /cores/{id}` → hydrates the Situation core with frame, ontology, gaps, hypotheses.
- `PATCH /cores/{id}` → updates fields. Audited.
- `POST /cores/{id}/fork` → copies/links per request body, returns the new core.
- `GET /cores?kind=situation` → lists situations the user can see (owned + granted).

### Loop 2 acceptance

- [ ] Clicking the Situation Core chip opens the drawer.
- [ ] Frame fields autosave.
- [ ] All six tabs render (deep tabs link to `/app/situations/[id]`).
- [ ] Creating a new Situation from the popover works end-to-end.
- [ ] Forking creates a new core with `parent_core_id` set; the new core inherits per the chosen options.
- [ ] After fork, the user can immediately switch to the new Situation.
- [ ] Existing Situations not yet in the cores table get a `core_id` backfilled the first time they're opened (lazy migration; full backfill in Slice 1c per Brief 02 §6).
- [ ] `audit:cores-schema` green.
- [ ] `audit:cores-types-parity` green (TS + Pydantic models match).

---

## Loop 3 — Attaching, picking, sharing

**Goal of this loop:** the cores strip on the homepage and Ask surface becomes a real picker. Drag-and-drop. Share dialog.

### Cores rail (left, on every authenticated page)

```
│ Q  │  ← Ask threads (last 10)
│ ★  │  ← Cores (User Core, plus user's recent 10 cores)
│ S  │  ← Situations (just situations, last 10)
│ R  │  ← Sources
│ O  │  ← Outputs
│ A  │  ← Advanced
```

Hover any rail item → a flyout panel expands with the items in that scope. From the flyout, the user can:
- Click a core to open it (drawer).
- Drag a core to the Ask bar's cores strip to attach it.
- Right-click a core → context menu (Open, Edit, Share, Fork, Archive).

Drag-and-drop uses `@dnd-kit/core` (already in deps). On mobile, the drag is replaced by a "+ attach" sheet that lists cores grouped by type.

### The picker behaviour

- **From the homepage:** the "+ attach core" button is prominent in the empty strip, not tucked behind a menu. It opens the picker even before a Situation is selected.
- **From the cores strip:** click "+ attach core" → a popover lists the user's cores and seeded examples (filterable by type, ontology, owner, recent use), with "create new" and "browse examples" links at the bottom.
- **From the cores rail:** drag a core to the Ask bar.
- **From the homepage tools strip:** clicking a tool that needs a specific core type (e.g., a methodology core) auto-suggests the user's most-used compatible core; the user can swap.

Default empty home:

```
┌──────────────────────────────────────────────────────────────┐
│ 🟦 User Core        [+ attach core]                           │
├──────────────────────────────────────────────────────────────┤
│ Pick or create a Situation Core to start             disabled │
└──────────────────────────────────────────────────────────────┘
```

Clicking "+ attach core" opens the first-class picker:

```
┌──────────────────────────────────────────────────────────────┐
│ Attach cores                                           ✕     │
├──────────────────────────────────────────────────────────────┤
│ Search cores, examples, methodologies, rubrics...            │
│ [ situation ] [ methodology ] [ rubric ] [ source ] [ recent ]│
│                                                              │
│ Examples                                                     │
│ ☐ Syria 2026 transition                 Situation · Conflict │
│ ☐ US housing access California          Situation · Policy   │
│ ☐ Workplace mediation                   Situation · Mediation│
│ ☐ Sanctions-evasion case                Situation · Sanctions│
│ ☐ Humanitarian access NES               Situation · Humanit. │
│ ☐ Mediation issue-framing rubric        Rubric · Team        │
│ ☐ Source reliability methodology        Methodology · Praxis │
│                                                              │
│ Selected: 3 cores                                            │
│ 🟪 Workplace mediation  🟧 Mediation rubric  🟫 Source guide │
│                                                              │
│ [ Browse all examples ]                         [ Attach ]   │
└──────────────────────────────────────────────────────────────┘
```

The picker supports multi-select. A user can attach a methodology core, a team-rubric core, two Situation Cores, and a source core to one Ask thread. The strip is reorderable; order determines calibration precedence. Each chip contributes to the calibration block. If two Situation Cores are attached, the strip shows a non-blocking warning: **"Two Situations attached — answers will reference both."**

Example seeds are first-class in the picker via `/app/cores?examples=1`. Keep 6-10 diverse examples covering all 9 ontologies, including Syria 2026 transition, US housing access California, workplace mediation, sanctions-evasion, humanitarian access NES, governance transition Tunisia, narrative laundering, treaty interpretation, plus at least one methodology core and one team-rubric core.

### Sharing dialog

From any core's three-dot menu → **Share**:

```
┌────────────────────────────────────────────────────┐
│ Share "Syria 2026 transition"                  ✕  │
├────────────────────────────────────────────────────┤
│ Who has access                                     │
│   👤 Giulio  (you, owner)                          │
│   👤 Maria   (editor)             [Change] [×]     │
│   👥 Syria team  (viewer)         [Change] [×]     │
│                                                    │
│ Add people or teams                                │
│   [ email or team name…              ▾ Viewer ]    │
│                                                    │
│ ☐ Create a view-only link (off in v7 by default)  │
│                                                    │
│                                       [ Done ]     │
└────────────────────────────────────────────────────┘
```

Adding a grant calls `POST /cores/{id}/grants`. Roles: viewer / editor / owner. Public link sharing checkbox is rendered but disabled in v7 (per Brief 02 §16 Q2).

### Default attached cores (from User Core)

The User Core's `default_attached_cores` field holds the cores that auto-attach to every new Ask thread. Loop 3 wires this end-to-end:

- Editing the list in the User Core drawer immediately reflects on the next thread.
- The list is reorderable (drag).
- The list is capped at 5 items in v7 (UX limit; the schema allows more).
- User Core is the only chip that is always present. Situation, methodology, rubric, source, document, graph, and output cores are explicit attachments.

### Loop 3 acceptance

- [ ] Cores rail flyout works on hover.
- [ ] Drag-and-drop from rail → Ask bar attaches a core; visible in the strip.
- [ ] "+ attach core" popover works from the empty homepage and from an active Ask thread.
- [ ] Multi-select attach works; chip order is persisted and used in calibration precedence.
- [ ] `/app/cores?examples=1` exposes seeded Situation, methodology, and rubric cores.
- [ ] Two attached Situation Cores show the non-blocking conflict warning.
- [ ] Sharing dialog adds and revokes grants; recipients see the shared core in their cores rail.
- [ ] Default attached cores in User Core auto-attach to new Ask threads.
- [ ] Mobile: drag replaced by a "+ attach" sheet, but everything else works.
- [ ] `audit:cores-grants-coverage` (new): no shared core leaks to non-grantees.

---

## Anti-patterns to avoid

These are the easy mistakes Codex must not make:

1. **A core editor that's a separate page first.** Drawer-first. The full page (`/app/cores/[id]`) is the escape hatch, not the default. Users edit inline.
2. **A wizard that's longer than 3 steps.** Creating a Situation: 1 popover, 4 fields, done. Forking: 1 dialog, checkboxes, done. If a flow needs 5+ steps, the design is wrong.
3. **A modal for everything.** Drawers (Sheet) for context-rich editing. Popovers for quick picks. Modals only for destructive confirmations.
4. **Treating the User Core like a settings page.** It is a core. It looks like the other core drawers. It autosaves. It does not have a separate "settings" navigation entry.
5. **Hiding the simplification by mirroring eight destinations in the UI.** User and Situation are the anchors. Supporting cores can be attached as chips, but they do not become new primary navigation destinations.
6. **Breaking owner scoping for a feature.** Every cores read and write must be owner- or grant-scoped. No shortcuts. `audit:cores-owner-scoping` is the gate.
7. **Skipping the audit log on shares.** Every grant create/revoke writes to `core_audit`. `audit:cores-grants-coverage` enforces.

---

## The dynamic ontology piece

Per Brief 03 §6: "dynamic ontology" means *per-Situation binding and per-Situation local extensions*, not new primitives.

In the Situation drawer's Frame tab:

- The **Ontology** field is a dropdown with the 9 domain ontologies. Default: auto-detected from the frame text (the existing classifier in `src/lib/ontology/classifier.ts`).
- A small "+ secondary" button lets the user add up to two compatible secondaries.
- A "Local subtypes" link opens a small panel where the user can add Situation-specific subtypes under any primitive (e.g., add `ClusterLead` under `Actor` for a humanitarian situation). These extensions are scoped to this Situation only — they do not pollute the global ontology.
- The "Propose for promotion" affordance exists but is a stub in v7 (the workflow ships in v7.1 per Brief 03 §6.3).

The 8 ACO primitives and 4 truth layers are **never** editable by the user. `audit:ontology-locked-primitives` (new in Brief 03 §8) enforces.

---

## Iteration discipline

Each loop:
1. Build the drawer + behaviour.
2. Wire the backend endpoint.
3. Add an audit if a new contract is introduced.
4. Take screenshots at desktop and mobile widths.
5. Commit a 5-minute walk-through video to `docs/v7/build/walkthroughs/`.
6. Update `STATUS.md`.
7. Run the verify prompt before starting the next loop.

After all three loops merge:
- The user can edit their own core inline.
- The user can edit any case core inline.
- The user can create, fork, share, and attach cores without leaving the homepage.
- The user can attach multiple cores to one Ask thread without leaving the homepage, including methodology and rubric examples.

If after these three loops a user still has to leave the homepage to do core work, the loops failed. Hold the line on inline.
