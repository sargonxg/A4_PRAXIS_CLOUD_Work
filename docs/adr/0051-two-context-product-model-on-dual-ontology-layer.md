# ADR 0051: Two-context product model on dual-ontology layer

Date: 2026-05-10
Status: Proposed (awaiting Giulio sign-off)

## Context

PRAXIS already operates in two modes (per
`docs/architecture/PRAXIS_SIMPLIFIED_CONTEXT_CORE_MODEL_2026-05-08.md`):

- **General PRAXIS mode** — questions answered from the platform model, tool
  catalog, and broad product knowledge.
- **Context-bound mode** — every answer attached to a specific user, team,
  situation, source corpus, document corpus, graph, or output package.

The product surface today carries domain ontologies (10 specializations under
`backend/data/ontologies/specializations/`) that say *what* a situation is
about — armed conflict, sanctions, human rights, etc.

A second ontology dimension is missing: *how a practitioner works on the
situation*. A UN DPPA desk officer, a foreign-ministry policy lead, a
mediation NGO programme manager, a think-tank analyst, a sanctions desk
officer, a humanitarian programme officer, a foreign correspondent, and an
academic each work on the same domain with different review cadences,
deliverables, audiences, and risk postures.

## Decision

Adopt a **dual-ontology layer** beneath the two-mode product:

1. **Domain ontologies** — existing 10 specializations under
   `backend/data/ontologies/specializations/`. Continue to govern
   extraction lenses, entity types, and analysis frameworks.
2. **Work ontologies** — eight new templates under
   `backend/data/ontologies/work/` (placeholder created in Phase D). They
   govern episode taxonomies, output templates, review cadences, audiences,
   and the calibration tone. Initial set:
   - UN DPPA, Foreign ministry, Mediation NGO, Think tank, Sanctions desk,
     Humanitarian, Foreign correspondent, Academic.

3. Every Situation declares **both** a domain ontology (already today) and a
   work ontology (new). Existing Situations default to a `generic-analyst`
   work ontology until reassigned.

4. `buildCalibratedContext` resolves both and merges them with the user's
   primary domain and work ontology. The merged result emits a
   `<domain-frame>` (existing) plus a `<work-frame>` (new) inside
   `systemPromptBlock`.

5. The audit gate `audit:work-ontology-coverage` enforces presence; the
   audit gate `audit:ontology` continues to enforce domain presence.

## Consequences

- All AI routes pick up the work-ontology automatically through the
  calibrated-context contract; no per-route changes needed.
- Output templates (memos, briefings, dossiers) can branch on work-ontology
  without each tool re-implementing audience/tone logic.
- Persona work (`docs/personas/`) stays orthogonal — personas describe
  *who* the analyst is; work-ontologies describe *how the role works*.
- The `generic-analyst` default keeps backward compatibility with the
  existing 10 domains until each domain gets explicit work-ontology
  defaults.

## Alternatives Considered

- **Encode work attributes as fields on the AnalystProfile.** Rejected:
  ties practitioner role to user identity instead of to the situation; a
  user may work different situations under different roles.
- **One ontology with both axes.** Rejected: explodes lens-weight matrices
  combinatorially and conflates domain semantics with work practice.

## References

- `docs/architecture/PRAXIS_SIMPLIFIED_CONTEXT_CORE_MODEL_2026-05-08.md`
- `src/lib/domain/seeds.ts` — current domain taxonomy.
- `backend/data/ontologies/work/README.md` — placeholder.
- ADR 0030 (Dynamic ontology lenses).
