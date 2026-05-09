# 04 — Analyst Skills, Policy Product & Outputs

> **Track D.** This file owns the routing layer (how Ask picks what to do), the recategorization of the 57+ tools as **Analyst Skills**, the new shape of the **Outputs** surface, and the **Policy Product** offer (the org-facing deliverable layer).
> **Read after `00`, alongside `01`, `02`, `03`.**

---

## 1. Renaming and recategorizing: from "Tools Marketplace" to "Analyst Skills"

The repo currently has 57 tools under `skills/tools/` and 7 subagents under `skills/subagents/`. The interface today calls this surface "Tools" or "Marketplace". v7 renames it to **Analyst Skills** for two reasons:

1. **Plain language.** Analysts don't open "tools"; they apply skills. "Run the Devil's Advocate" or "Run the Stakeholder Power-Interest" reads naturally.
2. **The marketplace framing has done its job.** The catalog is internal. We are not selling third-party plug-ins in v7; we maintain a curated set of capabilities. "Marketplace" implies a store; "Skills" implies a craft.

The 57 tools become **57 skills** under five **practice categories** (the same domain split the ontologies use, plus `cross`):

- **Conflict** (5 today): escalation-ladder, escalation-timeline, leverage-trace, commitment-check, cease-fire-monitor, actor-alignment-shift.
- **Mediation** (3): zopa-finder, position-vs-interest, mediation-brief.
- **Governance** (3): coalition-map, mandate-traceback, veto-probability.
- **Narrative** (3): counter-narrative-finder, fact-check-traceback, frame-cascade.
- **Human Rights** (4): pattern-detector, treaty-body-engagement, upr-cycle-mapper, violation-tracker.
- **Economic** (4): beneficial-ownership-map, designation-tracer, evasion-pattern-detector, sanctions-impact-model.
- **Humanitarian** (4): aa-trigger-monitor, access-map, cluster-coordinator, needs-aggregator.
- **Legal** (4): jurisdictional-analyzer, precedent-finder, provision-tracer, reservation-effect-mapper.
- **Security** (4): alliance-cohesion-map, capability-assessor, escalation-modeler, posture-tracker.
- **Cross-cutting** (15+): ach, assumption-mapper, brief-exporter, causal-loop-diagram, community-synthesizer, context-health-explainer, contradiction-finder, devils-advocate, indicators-tracker, kac, memo-create, memo-refresh, outside-in-thinking, premortem, red-team, scenario-projector, stakeholder-power-interest, timeline-comparator.
- **Extraction & matching** (3): entities.gliner, sanctions, network analyze.
- **Simulation** (1): policy_abm.

The category is the prefix in each tool ID (e.g., `conflict.escalation-ladder`, `cross.devils-advocate`). v7 preserves the IDs and adds a `category` field on each skill manifest. This makes recategorization a metadata change, not a file rename, and keeps `audit:tool-marketplace` and `audit:tool-skills-present` green.

The **7 subagents** stay under `skills/subagents/`:

- `analyst_persona`, `context-preparer`, `memo-drafter`, `moderator`, `output-refiner`, `red-team-analyst`, `source-augmenter`.

Subagents are not skills. They orchestrate skills. They are exposed through Ask routing (§3) and are not first-class entries in the Analyst Skills catalog UI; they appear in a separate "Subagents" section under Cores Library.

---

## 2. The Analyst Skills surface (`/app/cores`, specialist panel)

This is the canonical view of every skill in PRAXIS. It is reachable from **Cores Library** and from drag-and-drop attachment in Ask.

Layout:

- **Filter rail** (left): category (10 categories above), ontology compatibility (9 ontologies), tier (`calibrated-ai`, `deterministic-structural`, `extraction`), input requirements.
- **Catalog grid** (centre): each skill is a card with name, one-sentence description, category badge, ontology badges, tier pill ("Structural · no AI" for `deterministic-structural`).
- **Detail panel** (right, on selection): full description, required inputs, outputs, citations of where it's been run, "Run on this Situation" CTA, "Drag to Ask" handle.

A skill is invocable in three ways:

1. **From its detail panel:** "Run on this Situation" → opens an Ask thread pre-attached to the Situation Core, in the appropriate mode, with the skill chip locked in.
2. **From Ask via slash command:** typing `/` opens the skill picker filtered by attached cores' compatibility.
3. **From Ask via auto-routing:** the routing layer (§3) picks the skill based on the user's natural-language query.

Every skill view shows its provenance: which subagent wraps it (if any), which model tier, which calibration layers it expects. This is mostly visible to admins; analysts get a simplified version.

`audit:tool-marketplace`, `audit:tool-skills-present`, `audit:tool-skill-conforms`, `audit:tool-context-isolation` continue to pass after the rename.

---

## 3. The Ask PRAXIS routing layer

This is the heart of the v7 simplification. The user types a question; the routing layer decides what to do.

### 3.1 Inputs

Every Ask submission lands at the routing layer with:

- **Query text** (natural language).
- **Mode** (`Quick | Deep | Plan | Memo | Brief | Talking Points`).
- **Attached cores**: User Core, Situation Core (default), plus optional cores.
- **Conversation history** (for follow-ups in the same thread).
- **User capabilities** (e.g., `ontology-editor`, `org-admin`).

### 3.2 Output

The routing layer chooses one of four actions and emits:

- **`direct_answer`** — answer from retrieval over attached cores; no skill invoked. Used for "what does PRAXIS know about X" questions.
- **`run_skill`** — pick one skill, fill its required inputs from cores, execute, return the structured output framed as a chat message.
- **`run_subagent_plan`** — pick a subagent, which produces a multi-step plan composed of skills; execute; stream progress.
- **`clarify`** — return a clarifying question with two or three button choices when the query is ambiguous (e.g., "Are you asking for a stakeholder map for the current Situation or a different one?").

### 3.3 How it picks

The router is intentionally simple and inspectable:

- **Step 1: detect intent.** Pattern-match the query against intent templates, a few dozen total, e.g., "find contradictions in {topic}", "build me a memo on {topic}", "who are the actors in {scope}?". A small classifier (Vertex Gemini) backs ambiguous cases. Output: `intent` ∈ {answer, structure, draft, plan, monitor, compare, validate, summarize}.
- **Step 2: filter skills by ontology + tier.** Skills incompatible with the active ontology are excluded. `deterministic-structural` skills are surfaced first when the intent is `structure` or `validate`.
- **Step 3: rank by fit.** Compute a fit score per skill: how well its declared inputs are present in attached cores, how often the user has run it before, how recently. Top 3 are surfaced in the Ask suggestion rail; top 1 is the routing default.
- **Step 4: confirmation gates.** Skills tagged "destructive" or "writes to graph" require explicit user confirmation via `MutationConfirmCard`. Read-only skills run immediately when confidence is above threshold.
- **Step 5: emit chosen action.** If confidence is low across all options, emit `clarify` with two or three button choices.

The router lives in `backend/services/ask/router.py` (new) and `src/lib/ask/router-client.ts` (new). Both share the same skill metadata via the existing tool registry.

### 3.4 Manual override (always available)

The user is always allowed to override:

- Slash command in Ask bar (`/skill_name`) locks the run to one skill.
- Drag a skill chip from the Analyst Skills catalog to Ask bar — same effect.
- "Don't auto-route" toggle in User Core: every query becomes a `direct_answer` unless a skill is explicitly chosen. For users who prefer manual control.

### 3.5 Observability

Every routing decision logs:

- Input intent classification + confidence.
- Top 3 candidate skills + scores.
- Chosen action + skill / subagent name.
- Whether the user accepted or overrode.

This feeds the routing-quality dashboard. Acceptance rate is the main signal. If acceptance drops below 70% sustained, we tune the router. This is an explicit metric in `monitoring/v7_dashboard.json`.

---

## 4. Subagents (the orchestration layer)

The 7 subagents under `skills/subagents/` are the next abstraction above skills. Each subagent owns a multi-skill workflow:

- **`context-preparer`** — given a Situation Core with sparse content, runs source intake, entity extraction, and a first-pass ACO scan; returns a structured context ready for analysis.
- **`memo-drafter`** — given a Situation Core and a question, drafts a memo by sequencing skills: timeline-comparator → stakeholder-power-interest → contradiction-finder → memo-create.
- **`red-team-analyst`** — devils-advocate + premortem + assumption-mapper + outside-in-thinking; returns a red-team report.
- **`output-refiner`** — given an existing draft, runs contradiction-finder, evidence-summary-bar consistency, citation-resolver; returns a clean draft.
- **`source-augmenter`** — given source-sparse claims, runs source scout + credibility check + chunk dedup.
- **`moderator`** — given a Boardroom session, orchestrates persona turns, summarizes, surfaces dissent.
- **`analyst_persona`** — composes user-style adaptation (`<analyst-profile>`) into intermediate skill calls.

Subagents are picked by the routing layer for `Plan`, `Memo`, `Brief`, and `Boardroom` modes. They are not exposed to users as a primary surface; users see "Drafting your memo (4 of 6 steps)" with the underlying steps inspectable on hover.

Subagents are first-class objects under `skills/subagents/`. Their schemas are validated by `audit:tool-skill-conforms` (extended to cover subagents) and they appear in the Skills catalog under a separate "Subagents" tab, marked as orchestration.

---

## 5. The Outputs surface (`/app/outputs`)

Outputs are where work becomes useful. The surface is intentionally small.

### 5.1 My outputs

A list view, filterable by Situation, type (Memo / Brief / Talking Points / Handover / Board pack / Custom), status (Draft / Review / Final), and provenance integrity score.

Each row shows: title, type, Situation, last edited, owner, sharing state, integrity score, three-dot menu (Open, Duplicate, Share, Export, Archive).

### 5.2 New output flow

Click **+ New output** and pick a template:

- **Policy memo.** 4-page max. Sections: Bottom line, Background, Analysis, Recommendation. Uses the `cross.memo-create` skill.
- **Decision brief.** 1-page. Sections: Decision required, Options, Recommendation, Risks. Uses `cross.brief-exporter`.
- **Talking points.** Bulleted, 5–10 items, with sub-bullets for evidence. Uses `cross.brief-exporter` with a talking-points template.
- **Handover.** Multi-section, 6–10 pages. Sections: Situation, Actors, Timeline, Hypotheses, Open questions, Source list, Recommended next steps. Uses `memo-drafter` subagent.
- **Board pack.** Multi-document deliverable: cover memo + appendix briefs. Used by execs/principals.
- **Custom.** Free-form draft starting from the Situation Core; user picks skills to compose.

The flow is wizard-style:

1. Pick template → Pick Situation (defaults to active) → Pick optional cores to attach.
2. Confirm outline (auto-suggested by the relevant subagent).
3. Generate first draft. User edits in TipTap.
4. Run `output-refiner` to clean up. Provenance integrity score computed.
5. Mark Final, Export to MD/DOCX/PDF, or Share.

`audit:export-coverage` covers MD/DOCX/PDF presence per output type.

### 5.3 Provenance integrity score

Every output displays a score 0–100:

- **Score components:**
  - % of claims with at least one citation (40 weight).
  - % of citations that resolve to a source receipt or a canonical graph node (30 weight).
  - % of canonical-vs-candidate cited material (20 weight) — outputs based on candidate evidence are flagged.
  - Coverage of the Situation Core's required ontology elements for the case type (10 weight).
- **Threshold for Final:** 100 on claim coverage, ≥ 80 overall. Below 80 → "Draft" only.
- **Display:** a small progress ring on the output card, hover for breakdown.

This score is the visible signal that "PRAXIS produces decision-ready work." It is mandatory for every output and tested in `tests/v7/`.

### 5.4 Branding and team rubrics

If the user has a Team Core attached with `output_branding` set, exports use the team's logo and colour. Memo templates can be team-specific. This is the foundation for the Policy Product (§6).

---

## 6. Policy Product

The **Policy Product** is the org-facing offer that turns PRAXIS into a deliverable surface for principals, boards, and external stakeholders. It is a **derivative of the Outputs surface**, not a separate product.

### 6.1 What the Policy Product is

A Policy Product is a **bundled, branded, recurring deliverable**: a board pack, a sit-rep series, a weekly brief, a quarterly outlook. It is configured once and produced repeatedly with minimal edits.

Three v7 patterns:

1. **Sit-rep.** Daily or weekly situation update on one or more Situation Cores. Auto-drafted from gaps + new evidence + recent Ask threads. Reviewed by an analyst. Exported in a team-branded template.
2. **Board pack.** Periodic (monthly, quarterly) decision-grade compilation of analyses across multiple Situations. Composes memos and briefs.
3. **Briefing series.** A subscriber-facing series tied to a topic (e.g., "Sahel weekly"). Internal-only or external-facing depending on team config.

### 6.2 Where it lives

Under `/app/outputs?policy=true` or via a tab on the Outputs surface called **Policy products**. Hidden by default for individual users; visible when the user's Team Core declares `policy_products_enabled: true`.

### 6.3 What configures one

A Policy Product Core (a specialized Output Core) holds:

- Cadence (daily, weekly, monthly, ad-hoc).
- Source Situations (1..N Situation Core IDs).
- Template ID (memo / brief / handover / custom).
- Branding (from Team Core).
- Subscriber list (for external delivery, optional).
- Approval workflow (who reviews before publish).
- Distribution channels (email, link, scheduled export to Drive).

### 6.4 What's in v7 vs later

In v7:

- The Sit-rep pattern, internal-only.
- Manual draft from a "Generate this period's sit-rep" button on the Policy Product detail page.
- Approval is informal (analyst marks Final).
- Export to MD/DOCX/PDF and email-via-link.

In v7.1+:

- Scheduled auto-drafting (cron-style cadence).
- External subscriber lists with secure delivery.
- Multi-step approval workflows.
- Integration with Slack / Teams / Drive for distribution.

This is intentionally a small slice in v7. The bigger Policy Product story is real but not the priority for the simplification rewrite.

---

## 7. The Sources surface and how skills consume it

The Cores Library (`/app/cores`, see `01` §4.3) is where Source Cores and Document Cores live. Skills consume sources via the calibration block's `<skc>` layer.

Two patterns:

- **Inbox → Library.** A user uploads files. They land in the Inbox. The `source-augmenter` subagent runs (entity extraction, credibility check, dedupe). The user reviews and promotes to Library. Library entries become source receipts citable by skills.
- **Library → Coverage.** The Coverage panel computes which actors/events/claims have weak source backing. The user can run `cross.contradiction-finder` or `cross.indicators-tracker` directly from a coverage gap.

Source Scout (the open-web search affordance) is a button on Library: `+ Add via Source Scout`. The Scout opens in a modal, performs the search, lets the user select results, and adds them as source receipts.

---

## 8. Skill manifest contract

Each skill under `skills/tools/<id>/` has:

- `manifest.json` — id, name, description, category, ontology compatibility, tier, required inputs, outputs schema, model preferences (if AI-tier).
- `prompt.md` (AI-tier only) — the skill's prompt, calibration-layer aware, with placeholder slots for the four blocks.
- `validators.ts` and `validators.py` — input/output schema validators.
- `README.md` — analyst-facing description.

`audit:tool-contracts`, `audit:tool-skills-present`, `audit:tool-skill-conforms` enforce the contract. Codex must keep them green when adding a new skill or renaming.

A skill manifest example shape (illustrative, not literal):

```
{
  "id": "cross.devils-advocate",
  "name": "Devil's Advocate",
  "category": "cross",
  "ontology_compat": ["conflict","mediation","governance","narrative","human-rights","economic","humanitarian","legal","security"],
  "tier": "calibrated-ai",
  "required_inputs": ["situation_core_id"],
  "optional_inputs": ["focus_claim_ids"],
  "outputs": { "schema": "DevilsAdvocateReport@1" },
  "calibration_layers": ["analyst-profile","situation","domain","skc"],
  "model_prefs": { "default": "gemini-pro", "deep": "gemini-pro" },
  "destructive": false,
  "writes_to_graph": false
}
```

---

## 9. Boardroom (specialist panel inside Cores Library, simplified)

Boardroom (formerly Advisor Table / Brainstorming Table) survives in v7 but moves to **Cores Library → Boardroom**. It is a multi-persona dialogue surface.

In v7, Boardroom:

- Is invocable via Ask in `Boardroom` mode (which routes to the `moderator` subagent).
- Outputs a Boardroom briefing → lands in Outputs as a special output type.
- Personas are configured per-User-Core (favourites) and per-Team-Core (org defaults).

Most users won't use Boardroom directly; it's a power-user surface. The simplification is that it isn't on the front page demanding attention.

---

## 10. ACH (specialist panel inside Cores Library)

ACH (Analysis of Competing Hypotheses) similarly stays under **Cores Library → ACH**. It is a structured analytic technique rich enough to deserve its own surface; it is not asked of every analyst on every case.

Ask can launch ACH for a Situation by routing the intent "I want to compare competing hypotheses about X" → `cross.ach` skill → opens the ACH surface pre-populated.

---

## 11. Audits to add (Track D specific)

- `audit:skills-rename` — every skill manifest declares `category` and the ID prefix matches.
- `audit:skill-ontology-compat` — every skill declares at least one compatible ontology.
- `audit:routing-coverage` — for every intent template, at least one skill is reachable; `clarify` is the fallback only when no skill scores above threshold.
- `audit:output-templates-present` — six templates (Policy memo, Decision brief, Talking points, Handover, Board pack, Custom) exist.
- `audit:provenance-score-shape` — every output has a computed integrity score in the database.
- `audit:export-coverage` (existing) — MD/DOCX/PDF for every output type, kept green.
- `audit:subagent-conforms` — subagents validate their plans against the skill registry.

These run inside `npm run audit:gate`.

---

## 12. Migration plan for skills

The 57 skills do not need to move files. The v7 changes are:

1. Add `category` to each manifest. (One-line change × 57.)
2. Add `ontology_compat` to manifests that don't have it. (Mostly already present.)
3. Update the catalog UI to read `category` and group accordingly.
4. Update the routing layer to filter by category + ontology + tier.
5. Update the Skills catalog panel inside `/app/cores`.

This is a low-risk slice. Codex ships it as part of slice 8 in `01` §10.

---

## 13. The Ask intent vocabulary (initial)

To make the routing layer concrete, here is the v7 starter intent vocabulary. Codex extends as needed but does not invent new intents without a PR-level discussion.

| Intent | Trigger phrases (examples) | Default action |
|---|---|---|
| `answer` | "what / who / when / where / explain / summarize" | direct_answer |
| `structure` | "build a stakeholder map / timeline / actor profile / coalition map" | run_skill (structural) |
| `validate` | "find contradictions / red-team / pre-mortem this / devil's advocate" | run_skill (validation) |
| `compare` | "compare / contrast / X vs Y" | run_skill (comparator) |
| `monitor` | "track / monitor / detect changes in" | run_skill (monitor) |
| `draft` | "write me a memo / brief / talking points / handover" | run_subagent_plan (drafting) |
| `plan` | "what should I do next / give me a plan" | run_subagent_plan (planning) |
| `extract` | "pull entities / extract claims from this document" | run_skill (extraction) |
| `match` | "is X on the sanctions list / does X match Y" | run_skill (matching) |
| `simulate` | "simulate / run an ABM / model the impact of" | run_skill (simulation) |

A skill is tagged with the intents it serves. A subagent declares the intents it orchestrates. The routing layer is a mapping intent × ontology × cores → skill/subagent rank.

---

## 14. What "skills/outputs/policy done" looks like

The Track D definition of done:

- 57 skills carry `category` + `ontology_compat`. The Skills catalog renders them grouped by category. Drag-and-drop to Ask works.
- 7 subagents are wired into the routing layer. The catalog has a Subagents tab.
- The routing layer routes ≥ 70% of test queries to the correct skill on a held-out evaluation set; acceptance rate ≥ 70% in production within the first month.
- The Outputs surface offers all six templates; provenance integrity scores compute correctly.
- A Policy Product (sit-rep) can be created, drafted manually, and exported.
- Boardroom and ACH live under Cores Library specialist panels and remain functional through Ask routing.
- All Track D audits green.
- `STATUS.md` says Track D v7 shipped.

---

## 15. The user-visible promise

When all four tracks ship, this is what an analyst experiences:

1. They sign in. They see Home with their active Situation, an Ask bar, a Next-actions rail.
2. They type "build me a stakeholder power-interest map for this Situation". The router picks `cross.stakeholder-power-interest`, runs it against the Situation Core, returns a structured map with citations. The Situation panel updates to reflect the new map.
3. They type "now find me three contradictions in the recent claims". The router picks `cross.contradiction-finder`, returns three. Each is a citation chip linking to the source.
4. They type "draft a 1-pager for the principal". The router picks `memo-drafter`, drafts, runs `output-refiner`, returns a draft in Outputs. Provenance integrity score is 92.
5. They click Export to PDF. The PDF carries the team brand, the citations, and the provenance footer.
6. Total time: under five minutes. Total clicks: under twenty. Total moments of "which tool do I use?": zero.

That is the promise. Hold the line.
