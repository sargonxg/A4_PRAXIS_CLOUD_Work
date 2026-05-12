# PRAXIS — Codex Pack 21: Marketplace Depth Expansion

**File**: `PRAXIS_CODEX_21_MARKETPLACE_DEPTH.md`
**Branch**: `feature/marketplace-depth`
**Depends on**: Packs 18, 19, 20 merged. v1.0.0 tagged. Specialist handler pattern established (Pack 18 R5+R6). Five new ontologies registered (Pack 20). Persona corpora real (Pack 18 R8).
**Estimated effort**: ~12 days (~95 engineering hours).
**Target release**: v1.2
**Voice**: Senior tools engineer who has shipped 50+ specialist tools. Knows that the marketplace's value compounds with depth, but only if every tool is held to the same SKILL.md + canary + persona-suite bar that pack 18 established for the first 22.

---

## 0. Why this pack exists

Pack 18 ships 22 marketplace tools (16 base + 4 SAT + 2 memo). All have model-backed specialist handlers, SKILL.md files, canary tests, ContextProvider-only access. Pack 20 ships 5 new ontologies (Human Rights, Economic, Humanitarian, Legal, Security), each declaring 4 recommended marketplace tool ids that don't yet exist. Pack 21 closes that gap, plus broadens depth in the existing four ontologies, plus adds cross-cutting tools that benefit every user.

The total marketplace after this pack: **52 tools**. Distribution:

| Category | Count After | Source |
|---|---:|---|
| Conflict | 6 | 3 existing + 3 new |
| Mediation | 5 | 3 existing + 2 new |
| Governance | 5 | 3 existing + 2 new |
| Narrative | 5 | 3 existing + 2 new |
| Cross-cutting | 14 | 7 existing + 7 new |
| Human Rights | 4 | new (from Pack 20 forward declarations) |
| Economic | 4 | new |
| Humanitarian | 4 | new |
| Legal | 4 | new |
| Security | 4 | new |
| SAT toolkit | 4 | existing (Pack 15) |
| Memo | 2 | existing (Pack 18) |
| **Total** | **52** | — |

Two structural decisions keep this pack disciplined:

**(1) Add to existing categories, never invent new ones.** The marketplace already has a clean category system (`conflict | mediation | governance | narrative | cross | sat | memo`); pack 20's five new ontologies become five new categories per their existing IDs. No tool gets a new top-level category. No tool spans categories (a tool is in exactly one).

**(2) Every new tool follows the established pattern strictly.** Tool Contract v2, SKILL.md with all 9 canonical sections, model-backed handler invoking the appropriate subagent, canary test asserting schema and semantic checks, persona-suite step exercising it for the relevant role. No exceptions. Pack 18's audit chain catches any deviation.

The thirty new tools are not a feature dump — they are deliberate choices about what the persona for each role most needs that doesn't exist yet. The Human Rights officer needs `violation-tracker` more than they need `treaty-comparison-tool` (treaty work is the Legal officer's domain). The OFAC analyst needs `beneficial-ownership-map` more than they need `currency-volatility-projector` (FX is not their primary surface). The choices come from professional research and are documented per-tool with explicit "why this tool, why now" rationales.

After this pack, the five new professional communities (HR, sanctions, humanitarian, legal, defense) have a marketplace that speaks their workflow, the four original ontologies gain depth in obvious gaps (`conflict.escalation-ladder` to complement `conflict.escalation-timeline`; `mediation.batna-watna-explorer` to complement `mediation.zopa-finder`), and the cross-cutting category gains the structural tools that compound across every case (`cross.stakeholder-power-interest`, `cross.causal-loop-diagram`, `cross.indicators-tracker`).

---

## 1. Outcomes

| # | Outcome | Verification |
|---|---|---|
| 1 | 30 new marketplace tools registered with v2 contract; total tool count = 52 | `audit:tool-contract-v2` reports 52 tools, all conform |
| 2 | Each new tool has SKILL.md with all 9 canonical sections in canonical order | `audit:tool-skill-conforms` (rewritten to enforce ordered sections) reports 52/52 conform |
| 3 | Each new tool has a model-backed handler invoking the appropriate subagent | `audit:tool-canary-executable` reports 52/52 canaries green |
| 4 | Each new tool has a persona-suite test step exercising it for at least one role | `npm run test:e2e:personas` exercises every new tool at least once |
| 5 | Pack 20's 5 ontologies have 4 specialist tools each (20 total of the 30); the remaining 10 split across cross-cutting (7) and existing-ontology depth (3) | Per-ontology tool count audit |
| 6 | Suggestion engine recall@3 holds at ≥80% on the expanded eval set (covering all 52 tools) | `audit:tool-suggestion-eval` green |
| 7 | Compositions declared between every meaningful tool pair (e.g., `human-rights.violation-tracker` → `human-rights.upr-cycle-mapper` → `cross.brief-exporter`) | `audit:tool-composition-static` reports zero broken chains |
| 8 | Tool authoring spike: copying the template + filling SKILL.md + writing a canary fixture takes ≤60 minutes for a competent engineer | Time-recorded spike committed at `docs/audits/2026-NN-NN-TOOL_AUTHORING_SPIKE.md` |
| 9 | Persona-suite green streak resets after this pack and runs for 10 consecutive green | `docs/audits/persona-green-streak.md` resets and accumulates |
| 10 | Two new ADRs: 0033 (marketplace depth strategy) and 0034 (composition-chain governance) | ADRs reviewed and merged |

---

## 2. Pre-work confirmation note

> I am Codex. I have read pack 21. I understand:
> 1. **30 new tools, but each follows the existing pattern strictly.** Tool Contract v2. SKILL.md with 9 canonical sections in canonical order. Model-backed handler invoking the appropriate subagent. Canary test asserting schema + semantic. Persona-suite step.
> 2. **No new categories.** The 9 ontology ids (4 existing + 5 from Pack 20) plus `cross`, `sat`, `memo` are the complete category set. Every new tool fits in exactly one.
> 3. **The marketplace stays streamlined.** 52 tools is the cap for v1.2. Filtering by ontology, role, cost class, and recent runs ensures the user never sees more than 8-12 tools at once.
> 4. **Tool selection is research-driven.** Each new tool has an explicit "why this tool, why now" rationale committed at the top of its `index.ts`. Vanity tools (impressive but never used) get rejected.
> 5. **Forward declarations from Pack 20 are honored.** Each of the 5 new ontologies declared 4 recommended tool ids; this pack delivers them under those exact ids.
> 6. **Architecture invariants from the bible (§3) hold.** ContextProvider-only access. Symbolic firewall enforced. Model strings only in `MODEL_MATRIX.json`. Subagent invocations via `ContextProvider.subagent`.
> 7. **The 10-green-persona-suite gate is mandatory.** No `v1.2.0` tag without it.
>
> Open questions for Giulio:
> - **Q1**: Tool selection — propose the 30 tools listed in §3 with per-tool rationales. Acceptable as drafted, or amend specific selections (e.g., swap `human-rights.upr-cycle-mapper` for `human-rights.country-monitoring-tracker`)?
> - **Q2**: Specialist subagent dependencies — propose: most new tools invoke `context_preparer` + `output_refiner`; the analytical-heavy tools also invoke `complex_reasoning` task kind directly; tools producing memo annexes invoke `memo_drafter`. Acceptable, or per-tool review of subagent deps?
> - **Q3**: Composition chains — propose ~15 documented chains (e.g., `human-rights.violation-tracker` → `human-rights.pattern-detector` → `cross.brief-exporter`). Acceptable, or different chain priorities?
> - **Q4**: Memo annex auto-generation — propose: every tool whose output is suitable as a memo annex (estimated ~25 of the 52 tools) auto-generates the annex on request, using the existing memo annex pattern from Pack 15. Acceptable?
> - **Q5**: Persona-suite expansion — the 4 personas need to exercise the 30 new tools. Propose: add 10 new persona-suite test steps total (2-3 per role addition, plus 1-2 for cross-cutting), avoiding test bloat. Acceptable, or different test strategy?

Wait for answers before proceeding.

---

## 3. The 30 new tools

### 3.1 Conflict ontology — 3 new (total: 6)

**`conflict.escalation-ladder`** (Pack 21)
*Why now*: pairs with `escalation-timeline` (chronology) and `cross.scenario-projector` (futures). Maps current Events onto the 7-rung Kahn-style ladder (incident → posture → mobilization → limited engagement → broad engagement → restrained nuclear → unrestrained). Returns current rung, delta-from-prior-week, the specific Events that drove the change.
*Subagent deps*: `context_preparer`, `output_refiner`.
*Composition*: chains from `conflict.escalation-timeline`, into `cross.scenario-projector`.

**`conflict.cease-fire-monitor`** (Pack 21)
*Why now*: ceasefires are the most frequent context in active mediation files; today the user has to assemble compliance manually. Polls the case graph for `Event` nodes typed `CeasefireViolation`/`IncidentReport` over a sliding window; produces daily compliance score, identifies which Actors drive violations, flags pattern shifts.
*Subagent deps*: `context_preparer`.
*Composition*: chains into `cross.brief-exporter`.

**`conflict.actor-alignment-shift`** (Pack 21)
*Why now*: coalition dynamics are central to every conflict-resolution analysis; today users eyeball it. Detects when an Actor's pattern of `SUPPORTS`/`OPPOSES` edges shifts measurably across two time windows.
*Subagent deps*: `context_preparer`, `output_refiner`.
*Composition*: chains from `governance.coalition-map`, into `cross.scenario-projector`.

### 3.2 Mediation ontology — 2 new (total: 5)

**`mediation.batna-watna-explorer`** (Pack 21)
*Why now*: Harvard PON's BATNA/WATNA framework is the foundation of principled negotiation; PRAXIS should expose it as a first-class action. Inventories explicit and inferable BATNAs/WATNAs per party; surfaces gaps; honors confidentiality (BATNA visible only to mediator role).
*Subagent deps*: `context_preparer`, `memo_drafter`.
*Composition*: chains from `mediation.position-vs-interest`, into `mediation.zopa-finder`.

**`mediation.face-saving-options`** (Pack 21)
*Why now*: deadlocks resolve when each party can claim narrative victory; this tool generates 3-5 framings of a contested provision. Output: structured options with risk-of-rejection per party.
*Subagent deps*: `output_refiner`, `memo_drafter`.
*Composition*: chains from `mediation.zopa-finder`.

### 3.3 Governance ontology — 2 new (total: 5)

**`governance.veto-coalition-mapper`** (Pack 21)
*Why now*: existing `veto-probability` gives the probability; this tool reverse-engineers the *minimum coalition* needed to block. Useful for UNSC reform, sanctions-committee work, P5 dynamics analysis.
*Subagent deps*: `context_preparer`.

**`governance.compliance-monitor`** (Pack 21)
*Why now*: mandate-traceback (existing) explains *what* the mandate says; compliance-monitor scores *how well it's being followed* by tracked actors. Pairs with sanctions-committee work, peacekeeping-mandate renewal, treaty-body monitoring.
*Subagent deps*: `context_preparer`, `output_refiner`.

### 3.4 Narrative ontology — 2 new (total: 5)

**`narrative.disinformation-network-mapper`** (Pack 21)
*Why now*: counter-disinformation is the persona's #1 ask in narrative analysis; existing tools fact-check but don't map *the network propagating the frame*. Maps Outlet/Amplifier/Audience subgraph for a Frame; identifies coordination signatures (synchronized posting, identical phrasing, shared infrastructure).
*Subagent deps*: `context_preparer`, `complex_reasoning`.

**`narrative.frame-coalition-shift`** (Pack 21)
*Why now*: detecting when a frame's amplifier coalition changes is the early warning of narrative-driven realignment.
*Subagent deps*: `context_preparer`.

### 3.5 Cross-cutting — 7 new (total: 14)

**`cross.stakeholder-power-interest`** (Pack 21)
*Why now*: the standard 2x2 (power × interest) is on every policy curriculum and every consultant deck for a reason — it organizes thinking. Plots Actors on the grid, identifies high-power-low-interest (manage carefully) and high-power-high-interest (engage closely) quadrants.
*Subagent deps*: `context_preparer`.

**`cross.causal-loop-diagram`** (Pack 21)
*Why now*: systems thinking is undervalued in standard analysis; CLDs from CAUSED_BY edges identify reinforcing vs balancing loops. Useful for systemic-analysis memos, climate-conflict, gray-zone dynamics.
*Subagent deps*: `context_preparer`, `complex_reasoning`.

**`cross.indicators-tracker`** (Pack 21)
*Why now*: Heuer-Pherson's Indicators-and-Warnings SAT operationalized for the workbench. User defines indicators ("if X happens, this scenario becomes likely"); engine auto-monitors case graph for matches; surfaces alerts.
*Subagent deps*: `context_preparer`.

**`cross.timeline-comparator`** (Pack 21)
*Why now*: comparative case analysis is the strongest pattern in policy memos but is currently manual. Compares timelines of two cases (within or across users) on shared dimensions.
*Subagent deps*: `context_preparer`, `output_refiner`.

**`cross.assumption-mapper`** (Pack 21)
*Why now*: complements KAC (existing SAT) by *visualizing* the assumption graph — which assumptions support which conclusions. Useful for collaborative review.
*Subagent deps*: `context_preparer`.

**`cross.outside-in-thinking`** (Pack 21)
*Why now*: Heuer-Pherson outside-in method (STEEP/PESTEL framework) ensures the analyst considers external forces (technology, demographics, climate, economics) that shape but aren't internal to the situation.
*Subagent deps*: `context_preparer`, `output_refiner`.

**`cross.devils-advocate`** (Pack 21)
*Why now*: completes the SAT toolkit (KAC + Red Team + Premortem already exist; Devil's Advocate generates the strongest counter-argument). Pairs with the Boardroom's Devil's Advocate persona.
*Subagent deps*: `red_team_analyst`, `output_refiner`.

### 3.6 Human Rights ontology — 4 new (total: 4)

**`human-rights.violation-tracker`**
*Why now*: HR officers' core daily work. Ingests reports of incidents, classifies violations against the relevant treaty articles, tracks patterns, flags when individual incidents cross the threshold to *systematic* or *widespread*.
*Subagent deps*: `context_preparer`, `output_refiner`.

**`human-rights.upr-cycle-mapper`**
*Why now*: the UPR cycle (4.5 years per state) is the structural rhythm of OHCHR work. This tool maps a state's recommendations from prior cycles, current implementation status, and upcoming review window.
*Subagent deps*: `context_preparer`.

**`human-rights.treaty-body-engagement`**
*Why now*: each treaty body has its own rhythm and procedures (CEDAW vs CAT vs CRC). This tool prepares engagement: list of relevant prior concluding observations, due reports, individual communications status.
*Subagent deps*: `context_preparer`, `memo_drafter`.

**`human-rights.pattern-detector`**
*Why now*: distinguishing isolated from systematic is the legal threshold. Aggregates incidents by location/perpetrator/type/time, computes pattern signatures, calibrates language ("emerging pattern" vs "systematic").
*Subagent deps*: `context_preparer`, `complex_reasoning`.

### 3.7 Economic / Sanctions ontology — 4 new (total: 4)

**`economic.designation-tracer`**
*Why now*: the OFAC analyst's core daily work. Traces a designation back to its E.O./regulation/UNSCR basis, identifies derivative designations (the "50% rule"), maps to companion lists.
*Subagent deps*: `context_preparer`.

**`economic.beneficial-ownership-map`**
*Why now*: sanctions evasion runs through layered ownership. This tool builds the BO graph from available filings, OpenCorporates data, leaks (Pandora/Panama). Highlights gaps where the chain breaks.
*Subagent deps*: `context_preparer`, `complex_reasoning`.

**`economic.sanctions-impact-model`**
*Why now*: estimating expected economic impact of a proposed designation requires modeling the entity's revenue exposure, payment-channel dependencies, substitutability. This tool produces a structured impact estimate with confidence bands.
*Subagent deps*: `context_preparer`, `complex_reasoning`, `output_refiner`.

**`economic.evasion-pattern-detector`**
*Why now*: detecting evasion (ship-to-ship transfers, shell companies, parallel banking, crypto channels) is the most-asked sanctions analysis task. Pattern matching on transaction-event sequences in the case graph.
*Subagent deps*: `context_preparer`, `complex_reasoning`.

### 3.8 Humanitarian ontology — 4 new (total: 4)

**`humanitarian.needs-aggregator`**
*Why now*: HRP planning starts with aggregating needs across clusters. This tool consolidates assessments by sector and population, surfaces gaps, formats for HRP/HNO output.
*Subagent deps*: `context_preparer`, `output_refiner`.

**`humanitarian.access-map`**
*Why now*: humanitarian access is dynamic and constrained; this tool maps access by route/region/time, identifies bottleneck constraints (visa, customs, security, civ-mil coordination), proposes negotiation priorities.
*Subagent deps*: `context_preparer`.

**`humanitarian.cluster-coordinator`**
*Why now*: cluster lead coordination is fragmented across email, meetings, ad-hoc tools. This tool surfaces the coordination view: what each cluster is doing, gaps, deconfliction needs.
*Subagent deps*: `context_preparer`, `memo_drafter`.

**`humanitarian.aa-trigger-monitor`**
*Why now*: pairs with Pack 17's AA playbook. Monitors anticipatory-action triggers against current case state; alerts when triggers fire, surfaces relevant playbook entries.
*Subagent deps*: `context_preparer`.

### 3.9 Legal / Treaty ontology — 4 new (total: 4)

**`legal.provision-tracer`**
*Why now*: legal officers spend hours tracing provisions through treaties, customary law, soft-law, jurisprudence. This tool builds the provision-network from a starting point (an article, a custom, a precedent).
*Subagent deps*: `context_preparer`, `complex_reasoning`.

**`legal.precedent-finder`**
*Why now*: the closer the precedent, the stronger the argument. This tool searches across cases (with permission) for precedent language on a topic; ranks by jurisdictional weight + factual similarity.
*Subagent deps*: `context_preparer`.

**`legal.reservation-effect-mapper`**
*Why now*: reservations and declarations modify treaty obligations in non-obvious ways; this tool maps the effective obligations per party considering all reservations, derogations, and declarations.
*Subagent deps*: `context_preparer`, `complex_reasoning`.

**`legal.jurisdictional-analyzer`**
*Why now*: standing/admissibility/compromissory clause analysis is gateway-critical. This tool inventories jurisdictional bases, identifies likely challenges, suggests counter-arguments.
*Subagent deps*: `context_preparer`, `output_refiner`.

### 3.10 Security / Defense ontology — 4 new (total: 4)

**`security.posture-tracker`**
*Why now*: force posture is the observable signal of intent. This tool tracks posture events over time, normalizes across actors, produces a posture-trajectory view.
*Subagent deps*: `context_preparer`.

**`security.capability-assessor`**
*Why now*: capability ≠ intent, but capability sets the upper bound of what's possible. Distinguishes demonstrated from asserted capability, calibrates confidence per source.
*Subagent deps*: `context_preparer`, `output_refiner`.

**`security.escalation-modeler`**
*Why now*: pairs with `cross.scenario-projector` but security-specific. Models escalation paths considering doctrine, posture, and rules of engagement.
*Subagent deps*: `context_preparer`, `complex_reasoning`.

**`security.alliance-cohesion-map`**
*Why now*: alliance cohesion (NATO, JCPOA-era P5+1, etc.) is fragile and consequential. This tool tracks public statements, force contributions, posture changes per ally; computes cohesion index.
*Subagent deps*: `context_preparer`, `output_refiner`.

---

## 4. Hard rules

- **No new categories.** 9 ontologies + cross + sat + memo = the complete category set.
- **One tool per `index.ts` file** at `src/lib/tools/registry/<id>.ts`. No tool spans multiple files except shared helpers.
- **Every tool's SKILL.md has all 9 canonical sections in canonical order.** The rewritten `audit:tool-skill-conforms` enforces this strictly.
- **Every tool has a model-backed handler** invoking the appropriate subagent. No prompt-contract scaffolds. Pack 18's pattern is the floor, not the ceiling.
- **Every tool has a canary test** at `tests/tools/<id>.spec.ts` asserting schema + semantic checks.
- **Every tool has at least one persona-suite step.** Pack 18 R10 + this pack's S9 ensure the suites stay green.
- **Composition declarations are static.** Each tool's `composition.canChainInto` and `canChainFrom` lists are checked at build time; broken chains fail CI.
- **All prior invariants from packs 03-20 hold.**

---

## 5. Prompts U1-U10 — Tool authoring sprint

The prompt structure follows the same pattern as packs 18 R5+R6 (specialist handlers): Read & report → Propose & confirm → Execute → Verify, with each prompt covering 3-4 tools.

| Prompt | Tools | Hours |
|---|---|---:|
| U1 | Conflict (3 new) + Mediation (2 new) | 12 |
| U2 | Governance (2 new) + Narrative (2 new) | 10 |
| U3 | Cross-cutting wave-1 (4 of 7): stakeholder-power-interest, causal-loop-diagram, indicators-tracker, timeline-comparator | 12 |
| U4 | Cross-cutting wave-2 (3 of 7): assumption-mapper, outside-in-thinking, devils-advocate | 9 |
| U5 | Human Rights (4 tools) | 12 |
| U6 | Economic / Sanctions (4 tools) | 12 |
| U7 | Humanitarian (4 tools) | 10 |
| U8 | Legal / Treaty (4 tools) | 10 |
| U9 | Security / Defense (4 tools) | 10 |
| U10 | Final integration: composition chains + suggestion engine eval refresh + persona suite expansion + ADRs + green streak | 8 |
| **Total** | **30 tools** | **~95** |

Each U-prompt follows the template:

### U-prompt template

**Phase 1 — Read & report**: inspect existing tool patterns at `src/lib/tools/registry/` for the relevant category; identify any structural decisions to inherit (e.g., how mediation tools handle confidentiality flags).

**Phase 2 — Propose & confirm**: for each tool in the prompt's batch, propose:
- Full v2 contract (id, version, title, description, category, contextSpec, composition, sideEffects, subagentDeps, skill.file, inputSchema, outputSchema, estimatedRuntimeMs, costClass, streaming).
- SKILL.md outline with the 9 canonical sections filled in.
- Handler implementation sketch (subagent invocation pattern, schema mapping, citation extraction).
- Canary fixture (sample case + expected output assertions).
- Persona-suite step.
- "Why this tool, why now" rationale.

Wait for sign-off per batch.

**Phase 3 — Execute**:
- Author each tool's `src/lib/tools/registry/<id>.ts` with full contract.
- Author each tool's `skills/tools/<id>/SKILL.md`.
- Author each tool's handler at `src/lib/tools/marketplace/handlers/<id>.ts`.
- Author each tool's canary at `tests/tools/<id>.spec.ts`.
- Add persona-suite step.
- Update `src/lib/ontology/<ontology-id>/index.ts` `recommendedToolIds` if needed (Pack 20 forward-declared most; cross-check actuals match).
- Add composition declarations.

**Phase 4 — Verify**:
- `npm run audit:tool-contract-v2` reports the new count (e.g., 25 after U1, 27 after U2…).
- `npm run audit:tool-skills-present` and `npm run audit:tool-skill-conforms` green.
- `npm run audit:tool-canary-executable` green for new tools.
- Persona suites exercise the new tools; record-keeping at `docs/audits/persona-green-streak.md` advances.
- `npm run audit:tool-suggestion-eval` recall@3 ≥ 80% on expanded set.

---

## 6. Final verification gate

```bash
# Foundations
npm run typecheck
npm run lint
npm run test
pytest backend/ -q
mypy backend/ --strict

# Marketplace gates (extended)
npm run audit:tool-contract-v2          # 52 tools, all conform
npm run audit:tool-skills-present       # 52/52
npm run audit:tool-skill-conforms       # ordered sections enforced
npm run audit:tool-context-isolation    # ContextProvider only
npm run audit:tool-canary-executable    # 52/52 green
npm run audit:tool-composition-static   # zero broken chains
npm run audit:tool-suggestion-eval      # recall@3 ≥ 80%

# Architecture invariants unchanged
npm run audit:gate

# Persona suites — production bar
npm run test:e2e:personas               # 10 consecutive green

# Authoring spike
test -f docs/audits/2026-NN-NN-TOOL_AUTHORING_SPIKE.md

# Tag
git tag v1.2.0
```

All exit 0. Ten green persona runs. PRAXIS v1.2.0 ships with a 52-tool marketplace that genuinely covers the persona's daily workflow.

---

## 7. Out of scope

- User-authored marketplace tools — v2 (significant authoring UX + sandboxing).
- Tool versioning across breaking-change migrations — v1.3+.
- Tool A/B testing infrastructure — v1.3+.
- Tool-level cost ceilings beyond cost class — v1.3+.
- Cross-tenant tool sharing — v2.

---

## 8. Closing note

Marketplace depth is what makes a workbench sticky. v1.0's 22 tools cover the basics. v1.2's 52 tools cover the daily workflow of nine professional communities — diplomats, mediators, governance officers, narrative analysts, human-rights officers, sanctions analysts, humanitarian coordinators, treaty lawyers, defense analysts. The persona for each role opens PRAXIS and finds that the actions they would take with paper-and-pencil are exactly the marketplace tools they're recommended.

The discipline is unchanged: same v2 contract, same SKILL.md template, same canary pattern, same firewall enforcement, same ContextProvider-only access, same persona-suite gate. The marketplace grows by following the pattern, not by inventing new categories or new contract shapes.

Branch: `feature/marketplace-depth`. Commit prefix `tool(<id>): U<N> <description>`. PR titled `Pack 21 — Marketplace Depth Expansion`.

After merge, tag `v1.2.0`. Begin Pack 22 (Production verification of the GCP/Gemini Enterprise stack against the expanded surface).

---

**File path**: `C:\Users\giuli\Downloads\PRAXIS_CODEX_21_MARKETPLACE_DEPTH.md`
