# 03 — Context Cores & Dynamic Ontologies

> **Track C.** This file owns the concept that makes v7 different: **cores**. It defines the eight core types in detail, the inheritance and sharing model, the dynamic ontology layer that lives inside cores, the lifecycle (create → edit → fork → share → archive), and the integration with the existing 9 ontologies and 8 ACO primitives.
> **Read after `00`, alongside `01` and `02`.**

---

## 1. Why cores exist

Today, "context" in PRAXIS is scattered. The Situation has a frame. The user has preferences. The graph has nodes. Sources sit somewhere else. Memos cite some of it. The four-layer calibration block (`<analyst-profile>`, `<situation>`, `<domain>`, `<skc>`) assembles things at request time but has no UI of its own.

Cores fix that by making the units of context **first-class, named, owner-scoped, versioned, inheritable, and shareable**. A core is the thing the user reaches for when they say "use my methodology", "use my Syria sources", "use the Syria 2026 Situation".

The product story is:

> **A core is a folder of structured context with a name, an owner, and rules about who can use it.**
> **You can attach cores to Ask PRAXIS, fork cores into new analyses, share cores with a team, and inherit cores from a parent.**

If a piece of context cannot be expressed as a core, it does not belong in v7.

---

## 2. The eight core types

| Type | Purpose | Owner | Default sharing | Required fields | Optional fields |
|---|---|---|---|---|---|
| **PRAXIS Core** | Platform brain. Tool registry, workflows, answer rules, conflict grammar, truth layers, default models. | `platform` | Read-only to all signed-in users | `name`, `version`, `tools[]`, `truth_layers[]`, `primitives[]` | model defaults |
| **User Core** | Individual analyst's identity, role, mandate, communication style, preferences, jurisdiction, language, model/cost preferences. | Firebase UID | Private | `name`, `role`, `language` | `mandate`, `style`, `model_prefs`, `cost_prefs`, `jurisdiction`, `tags` |
| **Team Core** | Org/team identity, shared rubrics, shared sources, shared methodology. | Team admin | Team members get `viewer` by default | `name`, `org`, `members[]` | `rubrics[]`, `default_situation_template`, `branding` |
| **Situation Core** | The active case. Frame, goals, geography, timeline, actors, hypotheses, gaps, ontology binding, recent work. | UID, optional team_id | Private; can be shared | `name`, `frame`, `ontology_id`, `case_type` | actors, events, hypotheses, gaps, methodology, parent |
| **Source Core** | Source receipts and credibility posture for a situation (or as a reusable library). | UID, optional team_id | Inherits Situation default | `name`, `source_receipts[]` | `coverage_targets`, `credibility_rules` |
| **Document Core** | Uploaded files, OCR posture, extraction state. | UID | Inherits Situation default | `name`, `documents[]` | `extraction_rules`, `entity_filters` |
| **Graph Core** | The ACO graph for a situation: candidate vs canonical, ontology binding, embeddings. | UID, inherits Situation | Inherits Situation default | `name`, `ontology_id`, `nodes[]`, `edges[]` | `embedding_model`, `confidence_floor` |
| **Output Core** | Memos, briefs, drafts, exports for a situation. | UID, inherits Situation | Inherits Situation default | `name`, `outputs[]` | `template_id`, `branding` |

Cores are **not** containers of arbitrary data. The required fields are validated. The optional fields are well-known. The catch-all `metadata` JSONB on the table is for forward compatibility, not a free-for-all.

A note on Source/Document/Graph/Output cores: in v7 they default to a 1:1 relationship with their parent Situation Core. They exist as separate cores so that an analyst can:

- **Fork only the sources** from one Situation into another (e.g., "Use my Syria sources for this new Lebanon analysis").
- **Share only the graph** (canonical only) with another team without exposing the full Situation.
- **Reuse a methodology output** (e.g., a brief template) across Situations.

The five-card edit surface in `01` Situation panel only ever touches the linked Source/Document/Graph/Output cores indirectly. Direct edit happens in the core editor at `/app/cores/[id]`.

---

## 3. Per-type field definitions

These are the schemas Codex must implement in TypeScript under `src/lib/cores/types/` and in Python under `backend/services/cores/`. The `metadata` JSONB column stores them; runtime validation uses Zod (TS) and Pydantic (Python).

### 3.1 PRAXIS Core

```
{
  name: string,
  version: string,             // semver
  tools: SkillRef[],           // see 04
  subagents: SubagentRef[],    // see 04
  truth_layers: ['Source','Claim','Evidence','Verdict'],
  primitives: ['Actor','Claim','Interest','Constraint','Leverage','Commitment','Event','Narrative'],
  ontologies: OntologyRef[],   // 9 today, dynamic later
  default_models: { quick: string, deep: string, memo: string },
  routing_rules: RoutingRule[]
}
```

There is at most one PRAXIS Core in production at a time. It is bumped via migration when the platform's contract changes.

### 3.2 User Core

```
{
  name: string,
  role: string,                // e.g., "policy analyst", "mediator", "humanitarian lead"
  mandate: string?,            // free text, e.g., "Syria desk, OCHA"
  language: string,            // BCP-47, e.g., "en-US", "ar"
  jurisdiction: string?,       // ISO country, optional
  style: {
    formality: 'formal'|'plain'|'casual',
    citation_density: 'high'|'medium'|'low',
    structure_preference: 'narrative'|'bulleted'|'mixed'
  },
  model_prefs: {
    quick_model: string?,
    deep_model: string?,
    cost_ceiling_per_thread_usd: number?
  },
  default_attached_cores: CoreId[],  // applied to every new Ask thread
  saved_situations: CoreId[],
  tags: string[]
}
```

User Core is always attached to every Ask thread. The user can edit it under **Cores Library → Profile**.

### 3.3 Team Core

```
{
  name: string,
  org: string,
  members: { uid: string, role: 'admin'|'editor'|'viewer' }[],
  default_situation_template_id: CoreId?,
  rubrics: {
    memo_template_ids: CoreId[],
    brief_template_ids: CoreId[],
    output_branding: { logo_url?: string, colors?: {...} }
  },
  shared_skill_overrides: { [skill_id]: { default_model?: string, disabled?: boolean } }
}
```

Team Core ships **schema-only** in v7 until MT-1..5 in `docs/architecture/MULTI_TENANT_MODEL.md` is APPROVED. UI is gated behind a feature flag.

### 3.4 Situation Core

This is the densest type. Codex must implement it carefully.

```
{
  name: string,
  frame: {
    what_is_happening: string,
    why_does_it_matter: string,
    what_would_change_assessment: string,
    policy_question: string
  },
  goals: string[],
  geography: { regions: string[], iso_codes: string[], bbox?: number[] },
  case_type: CaseTypeId,         // one of the 10 today
  case_type_secondary?: CaseTypeId,
  ontology_id: OntologyId,       // primary
  ontology_compat: OntologyId[], // compatible secondaries
  ontology_version: string,
  hypotheses: { id: string, text: string, status: 'open'|'supported'|'refuted' }[],
  gaps: { id: string, kind: 'source'|'actor'|'event'|'claim'|'graph', text: string, severity: number }[],
  methodology: {
    parent_methodology_core_id?: CoreId,
    rubric_id?: string,
    notes: string
  },
  // links — populated by linkage backfill, not edited directly
  source_core_id: CoreId,
  document_core_id: CoreId,
  graph_core_id: CoreId,
  output_core_id: CoreId,
  // sharing
  shared_with_team_id?: string
}
```

The frame's four fields are exactly the four fields in today's Context tab. They are not new; they are first-class on the core now.

### 3.5 Source / Document / Graph / Output Cores

Source Core:

```
{
  name: string,
  source_receipts_count: number,
  credibility_rules: {
    require_two_independent_for: ('Claim'|'Verdict')[],
    blocked_domains: string[],
    trusted_domains: string[]
  },
  coverage_targets: {
    actors_min: number?,
    events_min: number?,
    timeframe?: { from: string, to: string }
  }
}
```

Document Core:

```
{
  name: string,
  document_count: number,
  extraction_rules: { ocr_threshold: number, language_hints: string[] },
  entity_filters: { include_types: string[], exclude_types: string[] }
}
```

Graph Core:

```
{
  name: string,
  ontology_id: OntologyId,
  ontology_version: string,
  embedding_model: string,
  confidence_floor: number,            // candidate floor, default 0.45
  promotion_policy: 'manual'|'auto-low'|'never-auto',  // never-auto in v7 default
  layers_enabled: ('Source'|'Claim'|'Evidence'|'Verdict')[]
}
```

Output Core:

```
{
  name: string,
  output_count: number,
  template_id?: string,
  branding?: { logo_url?: string, colors?: {...} },
  default_export_formats: ('md'|'docx'|'pdf')[]
}
```

These linked cores hold *configuration*, not the heavy data. The heavy data is in `source_receipts`, `documents`, `graph_nodes`/`graph_edges`, `memos`/`drafts`, each row referencing `core_id`.

---

## 4. Inheritance

A core can declare a single `parent_core_id`. Inheritance rules:

- **Shallow.** Inherit only from the immediate parent. No transitive automatic inheritance. Parent's parent is not pulled in.
- **Type-matched.** A Situation Core can only inherit from another Situation Core. A User Core only from another User Core. Etc.
- **Override-by-presence.** Child fields override parent fields when the child sets them. Empty child fields fall back to the parent.
- **Lists merge with explicit policy.** For list fields (e.g., `members`, `rubrics.memo_template_ids`), the merge policy is declared per-field: `replace` (child wins), `union` (combine), `prepend`, `append`.
- **Visible at attach time.** When a core is attached to Ask, the resolved view (parent + child) is shown in the chip's hover panel. The user sees what is being applied.

The most common use of inheritance is **Situation Core forking**. From the Situation Core editor, the user clicks **Fork**:

- A new Situation Core is created with the current core as its `parent_core_id`.
- Frame, ontology, methodology are copied (not just inherited) to give a clean editable starting point.
- Source/Document/Graph/Output cores are linked **by inheritance**, not duplicated, by default. The user can choose "Fork sources" to deep-copy source receipts.
- The fork lineage is visible in the core's `Inheritance` tab.

`POST /cores/{id}/fork` (in `02` §3) implements this.

A separate "clone defaults" pattern applies at User Core creation only: copy a peer's User Core fields into a new one, then break the link. After clone, no live inheritance.

---

## 5. Sharing

Cores are private by default. Sharing is opt-in, per-grant, per-role.

- **Roles:** `owner`, `editor`, `commenter`, `viewer`. The default for a new grant is `viewer`.
- **Principals:** `user` (by Firebase UID or email), `team` (team_id), `link` (a generated token, viewer-only by default), `public` (read-only, off by default for v7).
- **Expiry:** every grant supports an optional `expires_at`. Default is no expiry; the UI nudges expiry for `link` and `public` grants.
- **Revocation:** soft (sets `revoked_at`); audited.
- **Audit:** every grant create / revoke / role-change writes to `core_audit`. `audit:cores-owner-scoping` (Track B) enforces.

The UI for sharing is a single dialog reachable from the core editor's `Sharing` tab and from the core's three-dot menu. It shows who has access, by what role, with what expiry, and offers add / change-role / revoke actions.

A "Share" button on the Ask chip lets the user share the core directly while it is attached to a thread, without leaving Ask.

**Public link sharing is disabled by default in v7** until GC approves it. Schema supports it; UI hides the affordance behind a flag.

---

## 6. Dynamic ontologies

This is the most subtle part of cores and the one Codex is most likely to get wrong. Read this section twice.

### 6.1 The current state (preserved)

The repo has 9 domain ontologies under `src/lib/ontology/` and `backend/ontology/`:

- conflict, mediation, governance, narrative, human-rights, economic, humanitarian, legal, security.

Each ontology is a static module that defines: domains, primitives mapping (which ACO primitives are most relevant), subtypes per primitive, default relations, validation rules, classifier prompts.

The 8 ACO primitives are fixed: Actor, Claim, Interest, Constraint, Leverage, Commitment, Event, Narrative.

The 4 truth layers are fixed: Source, Claim, Evidence, Verdict.

`audit:ontology`, `audit:ontology-mapping`, `audit:ontology-versions`, `audit:ontology-classifier-accuracy` enforce this contract.

**None of this changes.** The 8 primitives stay 8. The 4 layers stay 4. The 9 ontologies stay 9.

### 6.2 What "dynamic" means

"Dynamic ontology" in v7 does **not** mean adding new primitives or layers. It means three specific things:

1. **Per-Situation ontology binding.** The Situation Core declares its primary ontology and a set of compatible secondaries. Different situations bind to different ontologies. The graph respects the binding; ACO subtype validation uses the bound ontology's subtype catalog.
2. **Per-Situation subtype extension.** A Situation Core can declare a few **local subtypes** under any primitive, scoped to that Situation only. Example: a humanitarian-specific actor subtype "Cluster Lead" used only in this case. The local subtype validates locally; it does not pollute the global ontology.
3. **Per-Situation relation extension.** Same idea for relations between primitives. Locally declared relation types are scoped to the Situation Core.

Local extensions are stored on the Situation Core's `metadata.local_ontology_extensions`:

```
{
  primitive_subtypes: { Actor: ['ClusterLead', 'AccessOfficer'], Event: ['CashTransferRound'] },
  relations: [{ name: 'reports_to_cluster', source: 'Actor', target: 'Actor' }]
}
```

A `core_audit` event captures every extension. `audit:ontology-locked-primitives` (new) checks that no Situation Core attempts to register a new primitive or layer.

### 6.3 Promotion of local extensions

If a local extension is reused across many Situations, it is a candidate to promote into the canonical ontology. Promotion is a manual workflow:

- The owner submits a proposal from the Situation Core editor: "Promote `ClusterLead` to humanitarian ontology v1.x".
- An ontology-editor (a person with the `ontology-editor` capability — granted by org admin) reviews.
- Promotion edits the canonical ontology module (`src/lib/ontology/humanitarian.ts` and `backend/ontology/humanitarian.py`) and bumps the version.
- All Situation Cores using the local extension are migrated to the canonical name.
- `audit:ontology-versions` enforces the version bump.

This workflow ships in v7.1, not v7. In v7, local extensions exist but stay local. The promotion endpoint exists as a stub.

### 6.4 Ontology selection at Situation creation

When the user creates a new Situation:

- They name it.
- They write the four-field frame.
- The classifier (`src/lib/ontology/classifier.ts`) runs and **suggests** an ontology and a case type with confidence.
- The user confirms or overrides. They can pick a primary and up to two secondaries (compatible).
- The Situation Core stores the choices and the version.

Default flow: classifier confidence ≥ 0.7 auto-confirms; below that, the user must confirm. `audit:ontology-classifier-accuracy` runs against a labelled corpus and must stay above the existing baseline.

### 6.5 Ontology binding on Ask

When a user asks PRAXIS something, the assembled calibration block includes the bound ontology's name and version. The routing layer prefers skills compatible with the bound ontology. Cross-ontology skills (those tagged compatible with multiple) work everywhere.

If a skill is incompatible with the bound ontology, the suggestion rail shows it greyed out with a tooltip: "Not compatible with the {ontology_name} ontology bound to this Situation. Switch ontology or pick a different skill."

---

## 7. Lifecycle

The lifecycle of a core:

1. **Create.** From the Cores library page, a sidebar `+`, or a contextual button (e.g., **+ New Situation**). Opens a wizard if the type needs structured input (Situation always; others optional).
2. **Edit.** In the core editor at `/app/cores/[id]`, autosaved. Every edit appends a row to `core_audit`. Concurrent edits are last-write-wins with a warning toast.
3. **Fork.** From the editor's three-dot menu or the Inheritance tab. Forks set `parent_core_id`. By default copies frame and methodology, links sources/documents/graph/output by inheritance.
4. **Attach.** From the sidebar Cores panel via drag-and-drop, from the Ask chip "+ Attach core", or from a core's "Use in Ask" action. Recorded in the thread's attachment list, audited.
5. **Share.** From the Sharing tab or chip menu. Adds a row to `core_grants`. Audited.
6. **Archive.** Soft-archive, hidden from default lists, restorable for 30 days. Hard delete after 30 days requires admin.
7. **Lock.** An admin can lock a core to prevent edits (e.g., a published team rubric). Lock is an `update` audit event with `status='locked'`.

UI surfaces all of these. There is no dead-end where a user has a core they can't edit, share, fork, or archive.

---

## 8. Audits to add (Track C specific)

- `audit:cores-types-parity` — TS Zod types and Python Pydantic models for each core kind match field-for-field. Existing `audit:context-types-parity` covers the calibration block; this is its cores cousin.
- `audit:cores-inheritance-rules` — every core's parent (if set) is type-matched and reachable. No cycles.
- `audit:ontology-locked-primitives` — no Situation Core attempts to add a primitive or truth layer outside the 8 + 4. New.
- `audit:ontology-local-extensions` — every local subtype/relation declared on a Situation Core is well-formed and unique within the core.
- `audit:cores-grants-coverage` — every endpoint that returns rows from a non-owner-owned core checks for a valid grant.

These run inside `npm run audit:gate` and the Python equivalents under `audit:gate:python`.

---

## 9. The four-layer calibration block (preserved)

`docs/CONTEXT_INJECTION.md` describes the four-layer block (`<analyst-profile>`, `<situation>`, `<domain>`, `<skc>`). v7 keeps this contract verbatim. Cores are how the four layers get assembled, not a replacement for the block.

When Ask runs:

- `<analyst-profile>` is built from the User Core (always attached).
- `<situation>` is built from the Situation Core (always attached for case-bound questions).
- `<domain>` is built from the Situation's bound ontology + any compatible secondaries.
- `<skc>` (situation knowledge cards / retrieved fragments) comes from the assembled Source + Document + Graph cores plus optional Cognee recall.

Additional attached cores augment the blocks but do not change their structure. E.g., attaching another Situation Core adds its frame to `<situation>` as a `related_situation` block, not as a replacement.

The order, the tags, and the audit `audit:hero-tool-calibration-coverage` all stay.

---

## 10. Worked examples

Three short walk-throughs to make the model concrete.

### 10.1 Forking a Situation

Maria works on Country A. She has a rich Situation Core (frame, methodology, sources, graph, memos). A new crisis breaks in Country B that resembles A.

- She opens her Country A Situation.
- Three-dot menu → **Fork into new Situation**.
- Wizard: name "Country B 2026", choose to copy the frame (yes), copy methodology (yes), link sources by inheritance (yes), copy ontology binding (yes).
- New Situation Core created with `parent_core_id = Country_A`. Frame is editable, methodology is editable, sources show "inherited from Country A; click to detach if you want a clean slate".
- She edits the frame to reflect Country B specifics, asks PRAXIS for an initial gap analysis, and the answer references Country A's methodology and sources by default.

### 10.2 Sharing a Team rubric

A team uses a specific memo structure. The lead creates a Team Core "ACME Memo Standards" with three template IDs.

- She shares the Team Core with everyone in the team as `viewer`.
- Each team member's User Core auto-receives the Team Core in their `default_attached_cores`.
- When any member opens Ask and runs a Memo mode, the rubric template list pulled is the team's, not the platform default.
- A member can override locally by setting their User Core's `default_attached_cores` to exclude the Team Core for this Ask thread.

### 10.3 Local ontology extension

David is working on a humanitarian access case. He needs a subtype `ClusterLead` for actors. The humanitarian ontology doesn't have it yet.

- In the Situation Core editor → Ontology tab → Local extensions → **+ Subtype**: primitive `Actor`, name `ClusterLead`, definition.
- The new subtype is selectable when creating actors in this Situation.
- It does not appear in other Situations.
- After three Situations use it, David clicks **Propose for promotion**. The proposal goes to `docs/v7/ontology-proposals/`. An ontology editor reviews, promotes, and migrates.

This is a v7.1 promotion workflow; in v7, the proposal endpoint is a stub.

---

## 11. What "cores done" looks like

The Track C definition of done:

- All eight core types implemented in TS and Python with shared schemas (`audit:cores-types-parity` green).
- Inheritance and forking work end-to-end with type-matching enforced.
- Sharing UI present for User, Situation, Source/Document/Graph/Output cores. Team Cores schema-only until MT-1..5 approved.
- Dynamic ontology binding works at Situation creation and is reflected in every Ask call.
- Local ontology subtype/relation extensions are stored and audited; no Situation can add a new primitive or layer.
- Worked examples §10 are reproducible by a fresh user in production.
- All Track C audits green.
- `STATUS.md` says Track C v7 shipped.

The non-negotiable: **no claim, in any output, anywhere in the app, may exist without an attached core that can justify it.** That is the rule that keeps cores from being decoration.
