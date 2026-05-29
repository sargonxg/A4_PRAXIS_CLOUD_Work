# REUSABLE PROMPT — Context Capsule Researcher & Author ("The Wikipedia of Context for Agents")

> **What this is.** A reusable, parameterized prompt for an AI agent (CODEX, Claude, or any capable model with repo access) to *research → think → brainstorm → author → self-check* new Context Capsules for PRAXIS. Run it as-is to expand the catalog, or set the `PARAMETERS` block to target a specific segment/domain. It is designed to be run repeatedly without producing duplicates, because Step 1 always re-audits what already exists.
>
> **Mission.** We are building the **Wikipedia of context for agents** — a public/private/community library of reusable, governed context capsules so that any analyst, policymaker, or researcher can hand an agent the *tacit and explicit context a seasoned human expert would carry into that situation*. Each capsule should make an agent behave as if a domain veteran briefed it for an hour.
>
> **Repo:** `A4_PRAXIS_CLOUD_Work`. **Canonical authoring file:** `src/lib/product/context-capsules.ts` (registry `CAPSULE_STARTER_DEFINITIONS`, built via the `starter()` factory). **Schema:** v3 (`src/lib/context/capsule-v3.ts`, `src/lib/constants/capsule-cores.ts`). **Read the companion brief `CODEX_CONTEXT_CAPSULE_OVERHAUL_2026-05-28.md` first** — author against the *unified v3* shape.

---

## PARAMETERS (edit to retarget; defaults expand the whole catalog)

```yaml
target_segments: [situation, tool, output, user]   # CapsuleStarterCategory values
capsules_per_segment: 10                            # → 40 new capsules this run
target_domains: ALL                                 # or a subset of the 18 domains; "NEW" to propose new domains
priority_gaps: [user, analyst-role]                 # currently empty/sparse — fill these first
visibility_mix: { community: 0.6, public: 0.25, private: 0.15 }
min_readiness_stars: 3                              # human-gated/expert capsules may be higher
require_tacit_knowledge: true                        # every capsule MUST fill humanTacitKnowledge richly
require_source_pack: true                            # no unsourced "backed" capsules
dedupe_threshold: 0.80                               # reject if >80% conceptual overlap with an existing starter
```

---

## STEP 1 — AUDIT THE EXISTING CATALOG (always run first; this is the dedup guard)

Before inventing anything, **load and understand what already exists.**

1. Read `CAPSULE_STARTER_DEFINITIONS` in `src/lib/product/context-capsules.ts` and `CAPSULE_STARTER_CATALOG_VERSION`. Enumerate every existing starter: `{ starterId, category, domain, label, summary }`.
2. Build a **coverage matrix**: rows = the 18 `CapsuleStarterDomain` values, columns = the 4 `CapsuleStarterCategory` values (`situation | tool | output | user`). Mark each cell with count + the starterIds in it.
3. Identify, explicitly:
   - **Empty / sparse cells** (e.g. `user` category currently ≈0, `analyst-role` domain ≈0) — these are top priority.
   - **Over-covered cells** — do NOT add more there unless you find a genuinely distinct human use case.
   - **Conceptual neighbors** of anything you plan to create (for the dedupe check in Step 4).
4. Output an **Audit Report** (markdown table) before writing any new capsule. Do not skip this — it is what makes the prompt safely re-runnable.

---

## STEP 2 — THINK LIKE THE HUMAN IN THAT CONTEXT (tacit-knowledge elicitation)

This is the heart of the task. For **each** capsule you plan, do not describe a topic — **inhabit the role of the most experienced human who lives in that context** and ask: *"What do I know, assume, fear, and routinely do that a smart newcomer (or an agent) would NOT know unless I told them?"*

For every planned capsule, brainstorm answers to ALL of these, then distill them into the v3 fields:

- **Who is in the room?** The user persona, their seniority, what they're accountable for, what gets them fired.
- **What is the real question behind the stated question?** (Decision-makers rarely ask what they mean.)
- **What does a veteran assume by default** that a novice would get wrong? → `workingAssumptions`
- **What constraints are never written down** but everyone respects? (legal, political, budgetary, reputational) → `hiddenConstraints`, `approvalPolitics`
- **What are the red lines** — things you must never do/say/recommend in this context? → `redLines`
- **What "how we actually do it here" habits** govern the work? → `institutionalHabits`
- **What rules of thumb / shortcuts** does an expert use? → `practicalHeuristics`
- **Whose feelings/interests must be handled carefully?** → `stakeholderSensitivities`
- **What recurring decisions** show up again and again here? → `recurringDecisions`
- **What does the expert know without being asked** (the "you just know" knowledge)? → `promptlessKnowledge`
- **What should the agent be allowed / forbidden to do**, and **when must it stop and ask a human?** → `agentOperatingContract` (allowedActions, forbiddenActions, reviewCheckpoints, stopConditions, bestNextAction)
- **What sources are authoritative here, and how fresh must they be?** → `sourcePack` + `sourcePosture` + freshness window.
- **What output does this person actually need** (memo, decision matrix, testimony, board card)? → `outputProductIds` / output capsules.

> Treat every capsule as if you were writing the onboarding brief you'd give a brilliant new hire on day one — the stuff that isn't in any manual.

---

## STEP 3 — AUTHOR THE CAPSULES (exact contract — must compile and drop into the registry)

Author each capsule as a call to the existing `starter()` factory (do **not** hand-roll raw objects — the factory builds the profile bundles). Signature:

```ts
starter(
  starterId,        // kebab-case, unique. Pattern: `starter-<category>-<domain>-<slug>`
  category,         // 'situation' | 'tool' | 'output' | 'user'
  domain,           // one of the 18 CapsuleStarterDomain values (or propose a NEW one + add to the union)
  label,            // human title
  summary,          // <200 chars, the one-line pitch
  detail,           // full description of what this capsule is for and who uses it
  tags,             // string[]
  coreRefs,         // CapsuleCoreRefsLike — bind the 12 core kinds:
                    //   user, situation, path, source, document, graph, time, tool, objective, product, output, memory
  recommendedToolIds,
  outputProductIds,
  combinesWellWith, // starterIds it pairs with (compose into richer context)
  {
    readinessStars: 1|2|3|4|5,
    sourcePack: [ /* {sourceType, publisher, title, url, date, reliabilityTier} */ ],
    excerpts: [ ... ],
    suggestedQuestions: [ ... ],
    suggestedNextActions: [ ... ],
    agentWorkflow: { /* step plan the agent should follow */ },
    aiUseGuidance: "How an agent should USE this capsule — and how it must NOT.",
    // The tacit-knowledge payload from Step 2 flows into richProfile / contextCaptureProfile / curationProfile:
    richProfile: { humanTacitKnowledge: { workingAssumptions, hiddenConstraints, redLines,
        institutionalHabits, approvalPolitics, practicalHeuristics, stakeholderSensitivities,
        caveats, recurringDecisions, promptlessKnowledge },
      agentOperatingContract: { allowedActions, forbiddenActions, sourceRequirements,
        reviewCheckpoints, toolRecommendations, bestNextAction, handoffInstructions, stopConditions },
      memoryPosture: { canonicalCapsuleFacts, advisoryCogneeRecall: [], cogneeMode: 'advisory-only',
        cogneeDatasetId, /* see Cognee guardrail */ } },
    curationProfile: { ... },
    intelligenceProfile: { ... },
    cogneeProfile: { ... },         // advisory-only seed profile (do NOT enable Cognee)
    contextCaptureProfile: { ... },
    humanReview: { status, reviewedBy, reviewedAt, limitations, humanReviewGate }, // for human-gated/expert capsules
    ontologyOverlay: { ... },       // map domain → ontology case types
  }
)
```

**Visibility / community / marketplace** — set on the capsule's `marketplaceProfile`:
```ts
{ publicCandidate: boolean, forkable: boolean, reuseTerms: string, moderationSummary: string,
  shelves: [ 'expert-pick' | 'agent-ready' | 'source-backed' | 'tacit-knowledge-rich'
           | 'human-gated' | 'marketplace-candidate' | 'public-forkable' ... ],
  trustBadges: [ 'human-written' | 'human-reviewed' | 'human-gated' | 'ai-proposal'
              | 'cognee-advisory' | 'source-gap' ... ],
  requiredBeforePublish: [ ... ] }
```
- **community** (default): forkable, `publicCandidate:false` until reviewed, `marketplace-candidate` shelf.
- **public**: `publicCandidate:true`, `public-forkable` shelf, must satisfy `requiredBeforePublish` (sources + human review).
- **private**: not forkable, no public shelf.

**Domains:** keep to the 18 existing `CapsuleStarterDomain` values where possible. If a capsule genuinely needs a new domain (e.g. `legal-compliance`, `intelligence-analysis`, `crisis-comms`), add it to the union in `context-capsules.ts:773-791` AND add its ontology stack to `DOMAIN_ONTOLOGY_STACKS`, and say so in your report.

**Coverage target this run:** produce `capsules_per_segment` (default 10) for each segment in `target_segments` (default all 4 → 40 capsules), spread across domains, **prioritizing the empty/sparse cells from Step 1** (especially `user` capsules and `analyst-role`). Lean into policy / analysis / research use cases.

---

## STEP 4 — SELF-CHECK & DEDUPE (every capsule must pass before you keep it)

For each authored capsule, run this checklist and **discard or revise any that fail**:

1. **Dedupe:** Is conceptual overlap with any existing starter > `dedupe_threshold`? If yes, either merge into `combinesWellWith` or sharpen the distinct human use case, or drop it.
2. **Tacit-richness:** Are `humanTacitKnowledge` fields actually filled with non-obvious, expert-grade content (not generic filler)? At least 3 substantive entries in `workingAssumptions`, `hiddenConstraints`, and `redLines`. If it reads like a Wikipedia stub, rewrite it.
3. **Sourcing:** If the capsule claims to be `source-backed`, does `sourcePack` contain real, citable, dated sources with `reliabilityTier`? No fabricated URLs — if uncertain, mark `source-gap` and lower `readinessStars`.
4. **Agent contract present:** `agentOperatingContract` has at least one `forbiddenAction`, one `stopCondition`, and a `bestNextAction`. An agent must know its limits.
5. **Core bindings valid:** `coreRefs` reference valid core kinds; the declared `category` matches the dominant core (a `situation` capsule centers a situation core, a `tool` capsule centers tool cores, etc.).
6. **Readiness honesty:** `readinessStars` reflects reality (5 = human-reviewed + sourced + tacit-rich; 1–2 = draft/intake). No inflated stars.
7. **Schema validity:** The `starter()` call type-checks and the object passes the existing `scripts/audit-capsule-*.ts` audits (contract, depth, inventory, memory-contract).
8. **Cognee guardrail:** `memoryPosture.cogneeMode` stays `'advisory-only'`; do not enable Cognee, do not exceed 0.600 confidence, `advisoryCogneeRecall` stays empty at authoring time.
9. **No PII / no real private individuals' sensitive data** in seeded content. Use roles/institutions, not unconsented personal data.

Then run a **catalog-level check**: no duplicate `starterId`s; coverage matrix improved (report before/after counts); `CAPSULE_STARTER_CATALOG_VERSION` bumped with a new dated tag.

---

## STEP 5 — IMPROVE EXISTING CAPSULES (opportunistic, optional per run)

While auditing in Step 1, if you find existing starters that are weak (thin tacit knowledge, missing agent contract, stale sources, no output binding), propose targeted improvements as a separate list — do not silently rewrite. For each: `{ starterId, weakness, proposed fix }`. Apply only the high-confidence ones, leave the rest as suggestions for human review.

---

## STEP 6 — DELIVERABLES (what you output)

1. **Audit Report** (Step 1 coverage matrix, before).
2. **The new `starter(...)` calls**, ready to paste into `CAPSULE_STARTER_DEFINITIONS` (grouped by segment, then domain). Each fully filled per Step 3.
3. **Self-check table** (Step 4 results per capsule: pass/fail/notes, dedupe overlaps found).
4. **Updated coverage matrix** (after) showing gaps closed.
5. **Catalog version bump** + any new domains added to the union and ontology map.
6. **Improvement suggestions** for existing capsules (Step 5).
7. **Verification:** confirm `npm run typecheck`, `npm run lint`, `vitest run`, and `scripts/audit-capsule-inventory.ts` / `audit-capsule-depth.ts` / `audit-capsule-contract.ts` pass. Report exact output; do not claim success without it.

---

## GUARDRAILS (non-negotiable)
- **Build on unified v3** (read `CODEX_CONTEXT_CAPSULE_OVERHAUL_2026-05-28.md`). Use the `starter()` factory, never raw objects.
- **Cognee stays disabled-first, advisory-only, ≤0.600.** No live ingestion at authoring time.
- **No fabricated sources.** Real, dated, tiered, or marked `source-gap`.
- **Tacit knowledge must be expert-grade**, not generic — this is the whole value of the Wikipedia-of-context.
- **Human-gated capsules** (policy judgment, legal, anything high-stakes) require a `humanReview` block and the `human-gated` shelf before they can be `public`.
- **No `Co-Authored-By` lines** in commits; author email `giuliocatanzariti@gmail.com`.
- **Mobile-ready, production-quality, tests green** before done.

---

## EXAMPLE SEED IDEAS (to prime, not to limit — brainstorm far beyond these)

- **user**: `starter-user-senior-policy-advisor` (knows the minister's risk appetite, what never goes in writing), `starter-user-humanitarian-field-officer`, `starter-user-intelligence-analyst-estimative`, `starter-user-corporate-geopolitical-risk-lead`, `starter-user-legislative-staffer`, `starter-user-investigative-researcher`.
- **situation**: emerging-sanctions-package, post-coup-recognition-decision, supply-chain-shock, AI-incident-response, contested-election-aftermath, ceasefire-monitoring.
- **tool**: stakeholder-power-interest-mapper, assumption-stress-tester, source-reliability-grader, scenario-tree-builder, red-team-devils-advocate, BLUF-memo-compressor.
- **output**: ministerial-decision-memo, intelligence-estimate-with-confidence, board-geopolitical-risk-card, congressional-testimony-pack, litigation-risk-note, research-literature-synthesis.

Run Step 1 first. Always.
