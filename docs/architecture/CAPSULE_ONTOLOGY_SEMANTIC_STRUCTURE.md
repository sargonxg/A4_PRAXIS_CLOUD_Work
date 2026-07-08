# ContextCapsule — Ontology & Semantic Structure: Assessment + Recommendations

> Written 2026-07-08. Owner: Giulio Catanzariti. Companion doc:
> `CAPSULE_ATTACHABLE_DOCK_BUILD.md`. Grounded in
> `src/lib/context/capsule-v3.ts`, `src/lib/ontology/types.ts`,
> `src/lib/graph/core-primitives.ts`, and ACO v2.0 (`CLAUDE.md`).

## 1. Verdict on the current structure

The V3 semantic core is **sound and unusually complete** for a context-object
schema. Its strengths, worth protecting:

- **Ontology binding is explicit and bounded** — `domainId`, `taxonomyPath`,
  max-3 `ontologyIds` (of 9), `acoPrimitives` (of 8 core), plus a
  `bindingRationale` string. Bounded bindings keep retrieval and rendering
  tractable.
- **Embedded graph is advisory-by-construction** — `advisoryOnly: true`,
  `canonicalStore` literal, `promotionGate`, per-element provenance
  (`generatedBy`, `confidenceKind` EXTRACTED/INFERRED/ASSESSED, review states,
  invalidation reasons incl. `SOURCE_RETRACTED` / `TEMPORAL_EXPIRY`). This is
  bitemporal-lite done right for a product this age.
- **Claims are first-class** with support posture, receipts, and
  cross-claim contradictions (`ContextCapsuleCrossClaimContradiction`).
- **Temporality + causality live in `grounding`** — timeline anchors with
  kinds (as-of/validity windows) and typed causal links with caveats.
- **Separation of knowledge kinds**: tacit knowledge ≠ claims ≠ sources ≠
  method (`reasoningScaffold`) ≠ permissions (`agentOperatingContract`).
  This mirrors how a human analyst actually organizes expertise.

The structure can absolutely "be worked on and improved" — the extension
points below are additive; nothing requires a V4 break.

## 2. Gaps and recommendations (priority order)

### R1 — Close the entity-type gap between capsule graphs and ACO (high)

`ContextCapsuleGraphLiteNodeV3.entityType` is a free `string`, while ACO v2.0
defines 14 typed entities with subtypes, and edges have 72 typed
relationships. Free strings will drift ("actor" vs "Actor" vs "state_actor")
and break cross-capsule queries and constellation coloring.

**Do:** validate `entityType` against the ACO 14 (+ subtype as a separate
optional field) and `relationshipType` against the 72-relationship registry
at write time (audit script + Zod refinement in `CapsuleV3Schema`), with an
`x-` escape prefix for experimental types. Report drift in
`audit:capsule-contract`.

### R2 — Stable semantic identity for graph nodes (high)

Node `id`s are capsule-local. Two capsules about the same crisis cannot be
joined, compared, or deduplicated, which blocks the "Wikipedia of context"
ambition (fork-and-compare, cross-capsule contradiction detection).

**Do:** add optional `canonicalRef?: { space: 'wikidata' | 'aco' | 'tacitus',
id: string }` on nodes. Populate opportunistically (extraction agents can
propose Wikidata QIDs for states, IOs, named individuals). Never required —
gap objects stay local.

### R3 — Claim ↔ graph ↔ source triangle (high)

Claims reference receipts; graph elements reference receipts; but claims and
graph elements do not reference each other. The load-bearing question an
analyst asks — "which claims does this edge rest on, and which sources back
that claim?" — needs a three-way join today done by inference.

**Do:** add `claimRefs: string[]` to graph nodes/edges (additive), and let
the Inspect panel render the triangle. This also gives the sourceability
review agent a deterministic target: every `canonical` edge should reach at
least one supported claim.

### R4 — Ontology registry as data, not code (medium)

The 9 `OntologyId`s are a hardcoded union; domains already live in Firestore
(`config/domains/{id}`) precisely so taxonomy evolves without deploys.
Ontologies will face the same pressure (e.g. adding `climate-security`,
`electoral`).

**Do:** mirror the domain pattern: `config/ontologies/{id}` docs with
version, primitive mappings, and path templates; keep the TS union as the
*seed* + fallback. Resolver with cache, never throws, unknown → nearest
parent or `conflict`.

### R5 — Semantic export: JSON-LD projection (medium)

For policytech credibility (and future interop with institutional knowledge
bases), capsules should have a standards-facing projection.

**Do:** a pure function `capsuleToJsonLd(capsule)` emitting a `@context`
mapping ACO primitives to schema.org/PROV-O where clean (`Actor` →
`prov:Agent`, `Event` → `schema:Event`, provenance → `prov:wasGeneratedBy`,
claims → `schema:Claim` with `schema:appearance` receipts). Export-only; the
V3 JSON stays canonical. No RDF store, no triple database — a projection.

### R6 — Confidence calibration discipline (medium)

`confidence: number | null` exists on anchors, links, claims, and graph
elements, but nothing defines what 0.7 means or keeps model-emitted numbers
honest.

**Do:** document a 4-band scale (aligned with EXTRACTED/INFERRED/AMBIGUOUS/
ASSESSED analytic tradecraft, ICD-203 style: unlikely/even/likely/very
likely) and have the dry-run eval check band consistency (an EXTRACTED
element with confidence 0.2 is a contract smell). UI renders bands, not raw
floats.

### R7 — Cross-capsule contradiction surface (later)

`ContextCapsuleCrossClaimContradiction` exists inside one capsule. Once R2
lands, a background audit can detect contradictions *between* docked
capsules (situation capsule says X, tool capsule assumes ¬X) and surface a
dock warning before generation. High analyst value; needs R2 + R3 first.

### R8 — Language/register layer for outputs (later, product-led)

Policy writing is register-sensitive (UN drafting English vs. op-ed vs.
démarche). Output contracts already carry format; add an optional
`register` + `terminologyRefs` (controlled vocab per domain, e.g. agreed UN
terminology) so the output capsule can govern language choice with receipts.
This is the Harvey/Legora differentiation for diplomacy.

## 3. What NOT to do

- No V4 schema break — every recommendation above is additive to V3.
- No triple store / graph database as canonical store — Firestore capsule
  docs stay canonical; anything richer is a derived projection.
- No unbounded ontology bindings — the max-3 rule is a feature.
- No agent-writable ontology mutations — registry changes are admin-gated
  like domains.

## 4. Sequencing with the build queue

R1 + R3 ride along with capsule-depth enrichment (HANDOVER P1) since both
touch the same audit + Architect path. R2 unlocks marketplace comparisons
(P8). R4 is a prerequisite for scaling the catalog past ~300 capsules.
R5/R8 are marketplace/positioning plays — schedule when sharing lane opens.
