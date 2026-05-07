# PRAXIS — Codex Pack 20: Dynamic Ontology Expansion

**File**: `PRAXIS_CODEX_20_DYNAMIC_ONTOLOGIES.md`
**Branch**: `feature/dynamic-ontologies`
**Depends on**: Pack 18 (production reality closure) merged. v1.0.0 tagged.
**Estimated effort**: ~9 days (~75 engineering hours).
**Target release**: v1.1
**Voice**: Domain architect with ontology engineering background. Knows that ontologies are *lenses* on the eight-primitive ACO substrate, not new substrates. Adding an ontology is declaring a mapping, not extending the foundation.

---

## 0. Why this pack exists

PRAXIS at v1.0 ships four ontologies — Conflict, Mediation, Governance, Narrative — covering the conflict-and-diplomacy professional. The substrate (the eight ACO primitives) is universal; the four ontologies are lenses that map domain-specific subtypes onto those primitives. Conflict's `armed_actor` is an Actor. Mediation's `position` is a Claim. Governance's `vote` is an Event. Narrative's `frame` is a Narrative. The pattern is clean and adding more ontologies costs almost nothing architecturally.

But the user base PRAXIS targets is broader than "conflict and diplomacy." The persona research and the roadmap (§1.5, §6, §9) make this clear: human-rights officers at OHCHR, economic-sanctions analysts at OFAC and the EU's DG-FISMA, humanitarian coordinators at OCHA and ICRC, treaty-body lawyers at the ICC and the Geneva offices of the major IGOs, civil-military strategists at NATO and at national defense ministries — these are all professionals whose work fits the PRAXIS shape (situations, actors, claims, interests, constraints, leverage, commitments, events, narratives), but whose vocabulary does not match Conflict, Mediation, Governance, or Narrative directly. A human-rights officer types "violation" and expects a structured `HumanRightsViolation` node, not a generic `Claim`. A sanctions analyst types "designated entity" and expects an `Actor.DesignatedEntity` with the right validators. A humanitarian coordinator types "needs assessment" and expects a workflow that looks like an OCHA Sphere-standard report.

Pack 20 ships **five new ontologies** as first-class lenses. The substrate doesn't change. The eight ACO primitives don't change. The four-layer context model doesn't change. The Tool Contract v2 doesn't change. What changes: each new ontology declares its node-types-as-subtypes-of-primitives, its edge-types, its validators, its recommended tools. Then the marketplace, suggestion engine, persona suites, and ingestion pipeline pick them up automatically per the existing patterns established in pack 06.

The five new ontologies are:

1. **Human Rights** — for OHCHR officers, human-rights NGOs, treaty-body monitoring, UPR/special-procedures work. Maps `Violation`, `Victim`, `RightHolder`, `DutyBearer`, `RemedialMeasure` onto ACO.
2. **Economic / Sanctions** — for OFAC analysts, EU sanctions teams, financial-intelligence officers, dual-use export controllers. Maps `DesignatedEntity`, `SanctionInstrument`, `PaymentChannel`, `BeneficialOwner`, `EconomicLeverage` onto ACO.
3. **Humanitarian** — for OCHA coordinators, ICRC, MSF, WFP analysts. Maps `AffectedPopulation`, `AccessConstraint`, `NeedsAssessment`, `RespondingActor`, `HumanitarianNarrative` onto ACO.
4. **Legal / Treaty** — for treaty-body lawyers, ICJ/ICC counsel, ILC members, UN Sixth Committee delegations. Maps `LegalProvision`, `Party`, `Reservation`, `Precedent`, `JurisdictionalClaim` onto ACO.
5. **Security / Defense** — for civil-military analysts, NATO desk officers, national defense planners, force-posture analysts. Maps `Capability`, `ForcePosture`, `ThreatVector`, `Doctrine`, `EngagementRule` onto ACO.

Plus one **structural** addition: ontology selection becomes **dynamic and profession-aware**. A user with `role='human_rights_officer'` opening a new case sees Human Rights ontology suggested first; a user with `role='sanctions_analyst'` sees Economic ontology first; a user with `role='diplomat'` sees Conflict first (current behavior). The suggestion engine learns from the user's past case ontologies. The ingestion pipeline can recommend a specific ontology based on the document's content (a sanctions designation document → Economic; a UN HRC resolution → Human Rights). Cases can be **multi-ontology** when the situation warrants (e.g., a Yemen case can carry both Conflict and Humanitarian ontologies simultaneously).

After this pack ships, PRAXIS serves five additional professional communities natively, the ontology substrate proves it can scale by mapping (not extending), and the marketplace tools in those domains have the right scaffolding to operate against the right node types.

---

## 1. Outcomes

| # | Outcome | Verification |
|---|---|---|
| 1 | Five new ontologies registered: `human-rights`, `economic`, `humanitarian`, `legal`, `security` | `npm run audit:ontology-mapping` reports 9 ontologies, all primitive coverage complete |
| 2 | Each new ontology has 8-12 node types, 4-6 edge types, 3-5 validators, 5-8 recommended tool ids per the existing pattern | Per-ontology unit test green |
| 3 | OntologyId TypeScript union extended from `'conflict' \| 'mediation' \| 'governance' \| 'narrative'` to include the five new ids | Type parity audit green |
| 4 | Each ontology has a Pydantic mirror at `backend/ontology/<id>.py` for backend-side validation | `backend/tests/test_ontology_parity.py` green |
| 5 | Multi-ontology cases supported: a single case can carry up to 3 active ontologies; node types from any active ontology validate; tools recommended from the union | `tests/unit/lib/ontology/multi-ontology.spec.ts` green |
| 6 | Profession-aware ontology routing: a new case's default-ontology suggestion is computed from `userContext.identity.role` per a documented mapping table | `tests/unit/lib/cases/ontology-suggestion.spec.ts` green |
| 7 | Ingestion-driven ontology routing: ingested documents that contain canonical signals (e.g., "OFAC SDN List", "ECHR judgment", "Sphere standards") trigger an ontology-suggestion advisory in the review queue | E2E test against three canonical document fixtures |
| 8 | Ontology classifier (gemini-2.5-flash-lite per `MODEL_MATRIX.json`) routes new cases to the most appropriate ontology with ≥80% accuracy on a 50-case eval set | `npm run audit:ontology-classifier-accuracy` green |
| 9 | Each new ontology has at least 4 specialist marketplace tool ids declared in `recommendedToolIds` (the actual tools ship in Pack 21) | Recommended tools cross-checked against pack 21 manifest |
| 10 | Workbench ontology tab updated to render any of the 9 ontologies with consistent visual treatment | Visual snapshot tests for the 5 new ontologies |
| 11 | Sample situations for each new ontology committed at `src/lib/cases/<ontology-sample>/` (e.g., `ohchr-yemen-2026`, `russia-sanctions-2026`) | Each sample case opens, populates, runs at least one tool successfully |
| 12 | Three new ADRs: 0030 (multi-ontology cases), 0031 (profession-aware ontology routing), 0032 (ontology-as-lens vs new primitives boundary) | ADRs reviewed and merged |

---

## 2. Pre-work confirmation note

> I am Codex. I have read pack 20. I understand:
> 1. **The eight ACO primitives do not change.** Adding a ninth requires an ADR + database migration + repo-wide refactor. This pack does not do that. Each new ontology declares its node types as `subtypes` of the existing eight primitives.
> 2. **Each new ontology follows the existing `CaseOntologyDefinition` shape** at `src/lib/ontology/types.ts`. No type-system changes. The only TypeScript change is extending the `OntologyId` union from 4 values to 9 values.
> 3. **The recommended tools each ontology declares may not all exist yet** — Pack 21 ships those. The recommendation field is a forward declaration that Pack 21 fulfills. Tool registry audits during this pack must accept these forward references gracefully.
> 4. **Multi-ontology cases are a meaningful capability shift**. A Yemen humanitarian case has actors that are also conflict actors; a Russia sanctions case has constraints that are also legal constraints. The architecture must support multiple active ontologies per case without breaking owner scoping or the firewall.
> 5. **Profession-aware routing requires a role taxonomy extension**. `userContext.identity.role` is currently `'diplomat' | 'mediator' | 'analyst' | 'researcher' | 'policy_advisor' | 'other'`. Pack 20 extends this to add `human_rights_officer`, `sanctions_analyst`, `humanitarian_coordinator`, `treaty_lawyer`, `defense_analyst`. The user's role is captured during onboarding; existing users can update it in settings.
> 6. **Architecture invariants from the bible (§3) hold**. ContextProvider-only access. Symbolic firewall enforced. Owner scoping absolute. ContextProvider extended only by adding new validator hooks per ontology.
>
> Open questions for Giulio:
> - **Q1**: Multi-ontology semantics — propose: a case carries `ontologyIds: string[]` (1-3 entries); the firewall validates a node against the validator from the ontology that owns its subtype; cross-ontology edges allowed if both endpoint primitives are valid in the source-or-target ontology. Acceptable, or simpler model (only one active ontology, others advisory)?
> - **Q2**: New role taxonomy — propose adding 5 roles to `UserContext.identity.role`: `human_rights_officer`, `sanctions_analyst`, `humanitarian_coordinator`, `treaty_lawyer`, `defense_analyst`. Acceptable, or different taxonomy?
> - **Q3**: Sample situations — propose one canonical sample per new ontology for the demo gallery and persona suites: OHCHR Yemen 2026 (human-rights), Russia Sanctions 2026 (economic), Sahel Drought-Conflict Response 2026 (humanitarian), ICJ Genocide Case 2026 (legal), NATO Eastern Flank 2026 (security). All public-source-derived. Acceptable, or different selection?
> - **Q4**: Ontology classifier — propose: extend `cheap_classify` task kind invocation in the Situation Genesis flow (Pack 19 S1) to emit an ontology recommendation alongside the Frame; user can accept or override. Eval set of 50 hand-labeled documents committed at `backend/agents/ontology_classifier/eval/cases.json`. Acceptable?
> - **Q5**: Profession-aware default — propose this mapping table:
>   ```
>   diplomat            → conflict (default), then governance, then narrative
>   mediator            → mediation (default), then conflict
>   analyst             → conflict (default), then narrative
>   researcher          → narrative (default), then any
>   policy_advisor      → governance (default), then conflict
>   human_rights_officer → human-rights (default), then legal
>   sanctions_analyst   → economic (default), then governance
>   humanitarian_coordinator → humanitarian (default), then conflict
>   treaty_lawyer       → legal (default), then governance
>   defense_analyst     → security (default), then conflict
>   other               → conflict (default)
>   ```
>   Acceptable, or amend?

Wait for answers before proceeding.

---

## 3. Pack overview

| Prompt | Outcome | Est. hrs |
|---|---|---|
| T1 | Foundations: extend OntologyId union, multi-ontology types, role taxonomy extension | 5 |
| T2 | Human Rights ontology — node types, edges, validators, recommended tools | 8 |
| T3 | Economic / Sanctions ontology | 8 |
| T4 | Humanitarian ontology | 8 |
| T5 | Legal / Treaty ontology | 8 |
| T6 | Security / Defense ontology | 8 |
| T7 | Multi-ontology case support: schema, firewall, ContextProvider, workbench rendering | 10 |
| T8 | Profession-aware routing: onboarding role capture, mapping table, ontology suggestion engine | 6 |
| T9 | Ontology classifier: LangGraph subgraph + eval set + integration with Situation Genesis | 8 |
| T10 | Sample situations + workbench visual rendering + ADRs + final verification | 6 |
| **Total** | | **~75** |

---

## 4. Hard rules

- **The eight ACO primitives are inviolable.** Adding a ninth is out of scope; the firewall enforces this at the database (`CHECK (primitive IN (...))`) and the type system.
- **Each ontology's node types must map to existing primitives.** The audit `npm run audit:ontology-mapping` enforces 100% primitive coverage per ontology.
- **Each ontology's validators are deterministic.** No LLM calls in validator logic. Validators run on every write through the firewall.
- **Multi-ontology cases preserve owner scoping.** A user adding a second ontology to their case never gives another user access; ontologies are configuration, not authorization.
- **The ontology classifier is advisory.** It recommends; the user (or the Situation Genesis flow) decides. Wrong classifier output never blocks case creation.
- **Sample situations are public-source only.** Every claim in a sample case cites a publicly available document. No internal data, no real PII, no privileged correspondence.
- **All prior invariants from packs 03-19 hold.** ACO substrate, four-layer context, ContextProvider-only, owner scoping, two-phase commit, model strings only in providers.

---

## 5. Prompt T1 — Foundations: extend types, role taxonomy

### Persona
TypeScript architect. Extends a clean union type without breaking the existing 4-ontology code paths.

### Phase 1 — Read & report

- Inspect `src/lib/ontology/types.ts` and `src/lib/ontology/registry.ts` (already read).
- Inspect `src/types/context.ts` for current `role` type.
- Inspect `backend/types/context.py` for Python parity.
- Output `docs/audits/2026-NN-NN-ONTOLOGY_FOUNDATIONS_PLAN.md`.

### Phase 2 — Propose & confirm

Type changes:

```ts
// src/lib/ontology/types.ts
export type OntologyId =
  | 'conflict'
  | 'mediation'
  | 'governance'
  | 'narrative'
  | 'human-rights'
  | 'economic'
  | 'humanitarian'
  | 'legal'
  | 'security';
```

```ts
// src/types/context.ts (UserContext.identity.role extension)
export type UserRole =
  | 'diplomat'
  | 'mediator'
  | 'analyst'
  | 'researcher'
  | 'policy_advisor'
  | 'human_rights_officer'
  | 'sanctions_analyst'
  | 'humanitarian_coordinator'
  | 'treaty_lawyer'
  | 'defense_analyst'
  | 'other';
```

```ts
// src/types/case.ts (CaseContext extension)
export interface CaseContext {
  // ... existing fields
  ontologyIds: OntologyId[];          // 1-3 active ontologies; first = primary
  primaryOntologyId: OntologyId;      // convenience accessor
}
```

Pydantic mirrors at `backend/types/context.py` and `backend/types/case.py`.

Wait for sign-off on the multi-ontology shape (one primary + up to 2 secondary) and the role taxonomy extension.

### Phase 3 — Execute

- Update types.
- Update registry to handle 9 ontologies.
- Add role taxonomy migrations (existing users default to current role).
- Run typecheck — it will surface every place the 4-ontology union is hard-coded; fix each.

### Phase 4 — Verify

- `npm run typecheck` green.
- `npm run audit:context-types-parity` green.
- `pytest backend/tests/test_context_parity.py` green.

---

## 6. Prompt T2 — Human Rights ontology

### Persona
Human-rights protection officer's product partner. Knows OHCHR/treaty-body vocabulary, UPR cycle, special-procedures, and the difference between civil-political and economic-social-cultural rights.

### Outcome

`src/lib/ontology/human-rights/index.ts` defining the ontology.

### Specification

```ts
export const HUMAN_RIGHTS_ONTOLOGY: CaseOntologyDefinition = {
  id: 'human-rights',
  version: '1.0.0',
  label: 'Human Rights Ontology',
  description: 'Violations, victims, rights-holders, duty-bearers, and remedial measures for human-rights monitoring, treaty-body engagement, UPR cycles, and special-procedures work.',
  domains: ['human-rights', 'protection', 'upr', 'treaty-body', 'special-procedures'],

  nodeTypes: [
    { id: 'rights_holder',     label: 'Rights Holder',     primitive: 'Actor',      description: 'Individual or group whose rights are at stake.' },
    { id: 'duty_bearer',       label: 'Duty Bearer',       primitive: 'Actor',      description: 'State, non-state actor, or institution responsible for fulfilling rights obligations.' },
    { id: 'monitoring_body',   label: 'Monitoring Body',   primitive: 'Actor',      description: 'Treaty body, special procedure, NHRI, or NGO conducting human-rights monitoring.' },
    { id: 'violation_claim',   label: 'Violation Claim',   primitive: 'Claim',      description: 'Asserted violation of an enumerated right, with evidence and pattern attribution.' },
    { id: 'protected_interest', label: 'Protected Interest', primitive: 'Interest', description: 'Interest protected by a specific right (life, dignity, due process, etc.).' },
    { id: 'legal_obligation',  label: 'Legal Obligation',  primitive: 'Constraint', description: 'Treaty article, customary norm, or domestic law constraining a duty bearer.' },
    { id: 'accountability_lever', label: 'Accountability Lever', primitive: 'Leverage', description: 'Mechanism for inducing duty-bearer compliance: UPR, treaty body, special procedure, sanction, prosecution.' },
    { id: 'remedial_measure',  label: 'Remedial Measure',  primitive: 'Commitment', description: 'Reparation, guarantee of non-repetition, institutional reform, or other remedy.' },
    { id: 'incident_event',    label: 'Incident Event',    primitive: 'Event',      description: 'Documented incident: arbitrary detention, torture, extrajudicial killing, restriction on freedom of expression, etc.' },
    { id: 'pattern_narrative', label: 'Pattern Narrative', primitive: 'Narrative',  description: 'Framing that connects individual incidents into a pattern: systematic, widespread, targeted, etc.' },
  ],

  edgeTypes: [
    { id: 'violates',           label: 'violates',          from: ['Actor'],     to: ['Constraint'],              description: 'Duty bearer violates a legal obligation.' },
    { id: 'protects',           label: 'protects',          from: ['Constraint'], to: ['Interest'],               description: 'Legal obligation protects a specific interest.' },
    { id: 'evidences_pattern',  label: 'evidences pattern', from: ['Event'],     to: ['Narrative'],               description: 'Documented incident contributes to a pattern narrative.' },
    { id: 'targets',            label: 'targets',           from: ['Actor'],     to: ['Actor'],                   description: 'Duty bearer or non-state actor targets a rights holder.' },
    { id: 'requires_remedy',    label: 'requires remedy',   from: ['Claim'],     to: ['Commitment'],              description: 'Violation claim requires a specific remedial measure.' },
    { id: 'engages_lever',      label: 'engages lever',     from: ['Actor'],     to: ['Leverage'],                description: 'Monitoring body engages an accountability lever (UPR, special procedure, etc.).' },
  ],

  validators: [
    { id: 'human-rights.has-rights-holder', label: 'Rights holder identified', severity: 'warn',
      description: 'Human-rights cases require at least one rights holder (individual, group, or population).' },
    { id: 'human-rights.has-duty-bearer',   label: 'Duty bearer identified',   severity: 'warn',
      description: 'Violation claims require a named duty bearer.' },
    { id: 'human-rights.violation-cites-obligation', label: 'Violation cites legal basis', severity: 'warn',
      description: 'Each violation claim should cite the specific legal obligation it asserts is breached.' },
    { id: 'human-rights.pattern-evidenced', label: 'Pattern narrative evidenced', severity: 'info',
      description: 'A pattern narrative should be evidenced by at least 3 distinct incident events.' },
  ],

  recommendedToolIds: [
    'human-rights.violation-tracker',     // Pack 21
    'human-rights.upr-cycle-mapper',      // Pack 21
    'human-rights.treaty-body-engagement', // Pack 21
    'human-rights.pattern-detector',      // Pack 21
    'cross.contradiction-finder',
    'cross.brief-exporter',
    'cross.scenario-projector',
  ],
};
```

### Files to create

- `src/lib/ontology/human-rights/index.ts`.
- `backend/ontology/human_rights.py` — Pydantic mirror.
- `tests/unit/lib/ontology/human-rights.spec.ts`.

### Phase 4 — Verify

- Ontology mapping audit reports complete primitive coverage.
- Sample case using human-rights ontology validates correctly through the firewall.

---

## 7. Prompt T3 — Economic / Sanctions ontology

### Persona
OFAC senior analyst. Knows the difference between primary and secondary sanctions, designation vs derivation, sectoral vs entity-level, beneficial-ownership networks, and the channels through which financial pressure actually flows.

### Outcome

```ts
export const ECONOMIC_ONTOLOGY: CaseOntologyDefinition = {
  id: 'economic',
  version: '1.0.0',
  label: 'Economic / Sanctions Ontology',
  description: 'Designated entities, sanction instruments, payment channels, beneficial ownership, and economic leverage for sanctions analysis, financial-intelligence, and dual-use export-control work.',
  domains: ['sanctions', 'export-control', 'financial-intelligence', 'illicit-finance', 'trade-policy'],

  nodeTypes: [
    { id: 'designated_entity',  label: 'Designated Entity',  primitive: 'Actor',      description: 'Entity (state, company, individual, vessel) currently under sanction or under designation review.' },
    { id: 'beneficial_owner',   label: 'Beneficial Owner',   primitive: 'Actor',      description: 'Ultimate beneficial owner controlling a designated or relevant entity, often through layered ownership.' },
    { id: 'enforcement_actor',  label: 'Enforcement Actor',  primitive: 'Actor',      description: 'Designating authority (OFAC, OFSI, EU Council, UN 1267 Committee) or financial regulator.' },
    { id: 'designation_claim',  label: 'Designation Claim',  primitive: 'Claim',      description: 'Asserted basis for designation: WMD proliferation, terrorism financing, human-rights abuses, etc.' },
    { id: 'commercial_interest', label: 'Commercial Interest', primitive: 'Interest', description: 'Revenue stream, supply-chain access, or market position the entity is preserving.' },
    { id: 'sanction_instrument', label: 'Sanction Instrument', primitive: 'Constraint', description: 'Specific sanction: SDN listing, sectoral restriction, asset freeze, transit ban, secondary-sanctions risk.' },
    { id: 'economic_leverage',  label: 'Economic Leverage',  primitive: 'Leverage',   description: 'Channel through which pressure operates: dollar clearing, SWIFT, reinsurance, port access, technology export.' },
    { id: 'compliance_commitment', label: 'Compliance Commitment', primitive: 'Commitment', description: 'Public undertaking to comply: divestment, exit, license application, JCPOA-style verification.' },
    { id: 'transaction_event',  label: 'Transaction Event',  primitive: 'Event',      description: 'Observed financial movement, license issued, designation added, license revoked, OFAC enforcement action.' },
    { id: 'evasion_narrative',  label: 'Evasion Narrative',  primitive: 'Narrative',  description: 'Framing of how entities evade sanctions: shell companies, ship-to-ship transfers, crypto channels, parallel banking.' },
  ],

  edgeTypes: [
    { id: 'controls_via_ownership', label: 'controls via ownership', from: ['Actor'], to: ['Actor'], description: 'Beneficial owner controls a designated entity through equity or other means.' },
    { id: 'restricts',            label: 'restricts',            from: ['Constraint'], to: ['Actor'],   description: 'Sanction instrument restricts a designated entity.' },
    { id: 'flows_through',        label: 'flows through',        from: ['Leverage'],   to: ['Constraint'], description: 'Economic leverage operates through a constraint channel.' },
    { id: 'designates',           label: 'designates',           from: ['Actor'],      to: ['Actor'],   description: 'Enforcement actor designates an entity.' },
    { id: 'evades',               label: 'evades',               from: ['Actor'],      to: ['Constraint'], description: 'Designated entity evades a sanction instrument.' },
    { id: 'enforces',             label: 'enforces',             from: ['Event'],      to: ['Constraint'], description: 'Enforcement event applies a sanction instrument.' },
  ],

  validators: [
    { id: 'economic.has-designated-entity', label: 'Designated entity present', severity: 'warn', description: 'Sanctions cases need at least one designated entity or designation candidate.' },
    { id: 'economic.designation-basis',     label: 'Designation basis cited',   severity: 'warn', description: 'Each designation claim should cite the specific basis (E.O. number, EU regulation, UNSCR).' },
    { id: 'economic.ownership-chain',       label: 'Ownership chain traceable', severity: 'info', description: 'Beneficial-ownership chains should be traceable to a named ultimate owner.' },
  ],

  recommendedToolIds: [
    'economic.designation-tracer',      // Pack 21
    'economic.beneficial-ownership-map', // Pack 21
    'economic.sanctions-impact-model',  // Pack 21
    'economic.evasion-pattern-detector', // Pack 21
    'cross.scenario-projector',
    'cross.brief-exporter',
  ],
};
```

### Files

Same pattern as T2: `src/lib/ontology/economic/index.ts`, `backend/ontology/economic.py`, unit test.

---

## 8. Prompt T4 — Humanitarian ontology

### Persona
OCHA senior coordinator. Knows the Sphere standards, the cluster system, IASC accountability principles, and the practical reality of the humanitarian-development-peace nexus.

### Outcome

```ts
export const HUMANITARIAN_ONTOLOGY: CaseOntologyDefinition = {
  id: 'humanitarian',
  version: '1.0.0',
  label: 'Humanitarian Ontology',
  description: 'Affected populations, access, needs, response, and the humanitarian-development-peace nexus for OCHA-style coordination, ICRC field work, and humanitarian-development planning.',
  domains: ['humanitarian', 'protection', 'response-planning', 'cluster-coordination', 'sphere'],

  nodeTypes: [
    { id: 'affected_population', label: 'Affected Population', primitive: 'Actor',     description: 'Population group: IDPs, refugees, host community, returnees, by demographic and location.' },
    { id: 'responding_actor',    label: 'Responding Actor',    primitive: 'Actor',     description: 'UN agency, NGO, INGO, government counterpart, ICRC, donor.' },
    { id: 'gatekeeper_actor',    label: 'Gatekeeper Actor',    primitive: 'Actor',     description: 'State or non-state actor controlling humanitarian access (checkpoint, visa, customs, security).' },
    { id: 'needs_claim',         label: 'Needs Claim',         primitive: 'Claim',     description: 'Assessed need with quantification: food security IPC level, WASH coverage, protection incidents, SAM/MAM rates.' },
    { id: 'protection_interest', label: 'Protection Interest', primitive: 'Interest',  description: 'Sphere-aligned protection interest: physical safety, dignity, family unity, livelihood preservation.' },
    { id: 'access_constraint',   label: 'Access Constraint',   primitive: 'Constraint', description: 'Bureaucratic, security, financial, or natural constraint on response delivery.' },
    { id: 'response_lever',      label: 'Response Lever',      primitive: 'Leverage',  description: 'Funding instrument, surge capacity, advocacy channel, civ-mil coordination, anticipatory action mechanism.' },
    { id: 'response_commitment', label: 'Response Commitment', primitive: 'Commitment', description: 'HRP allocation, donor pledge, MoU with government, ceasefire-window agreement.' },
    { id: 'incident_event',      label: 'Incident Event',      primitive: 'Event',     description: 'Displacement spike, attack on health facility, cholera outbreak, drought trigger, access blockage.' },
    { id: 'humanitarian_narrative', label: 'Humanitarian Narrative', primitive: 'Narrative', description: 'Framing of crisis: forgotten emergency, complex emergency, climate-conflict spillover, protracted displacement.' },
  ],

  edgeTypes: [
    { id: 'affects',          label: 'affects',          from: ['Event'], to: ['Actor'],         description: 'Incident affects an affected population.' },
    { id: 'controls_access',  label: 'controls access',  from: ['Actor'], to: ['Constraint'],    description: 'Gatekeeper actor controls an access constraint.' },
    { id: 'addresses_need',   label: 'addresses need',   from: ['Commitment'], to: ['Claim'],    description: 'Response commitment addresses a needs claim.' },
    { id: 'requires_lever',   label: 'requires lever',   from: ['Claim'], to: ['Leverage'],      description: 'Needs claim requires a specific response lever.' },
    { id: 'protects',         label: 'protects',         from: ['Commitment'], to: ['Interest'], description: 'Response commitment protects a Sphere interest.' },
  ],

  validators: [
    { id: 'humanitarian.has-population', label: 'Affected population identified', severity: 'warn', description: 'Humanitarian cases require at least one affected population.' },
    { id: 'humanitarian.has-needs',      label: 'Needs claims present',           severity: 'warn', description: 'A humanitarian case without quantified needs cannot drive response planning.' },
    { id: 'humanitarian.access-mapped',  label: 'Access constraints mapped',      severity: 'info', description: 'Active access constraints should be enumerated.' },
  ],

  recommendedToolIds: [
    'humanitarian.needs-aggregator',    // Pack 21
    'humanitarian.access-map',          // Pack 21
    'humanitarian.cluster-coordinator', // Pack 21
    'humanitarian.aa-trigger-monitor',  // Pack 21 (anticipatory action; pairs with Pack 17)
    'cross.views-forecast',             // Pack 17
    'cross.ucdp-events',                // Pack 17
    'cross.aa-playbook',                // Pack 17
    'cross.brief-exporter',
  ],
};
```

### Files
Same pattern.

---

## 9. Prompt T5 — Legal / Treaty ontology

### Persona
ILC member or senior treaty-body lawyer. Knows the difference between binding and non-binding instruments, the distinction between treaty interpretation under VCLT 31-32 and customary norm formation, the structure of Parties / Reservations / Declarations / Objections, and how precedent moves across jurisdictions.

### Outcome

```ts
export const LEGAL_ONTOLOGY: CaseOntologyDefinition = {
  id: 'legal',
  version: '1.0.0',
  label: 'Legal / Treaty Ontology',
  description: 'Legal provisions, parties, reservations, precedents, and jurisdictional claims for treaty-body work, ICJ/ICC matters, and international-law analysis.',
  domains: ['public-international-law', 'treaty-law', 'customary-law', 'icj', 'icc', 'treaty-body'],

  nodeTypes: [
    { id: 'party',              label: 'Party',              primitive: 'Actor',     description: 'State, IGO, or other entity bound by a treaty or norm.' },
    { id: 'tribunal',           label: 'Tribunal',           primitive: 'Actor',     description: 'Adjudicatory body: ICJ, ICC, ECHR, IACtHR, ad hoc tribunal, treaty body.' },
    { id: 'jurisdictional_claim', label: 'Jurisdictional Claim', primitive: 'Claim', description: 'Claim about a tribunal\'s jurisdiction, a party\'s standing, or admissibility of an issue.' },
    { id: 'protected_interest', label: 'Protected Interest', primitive: 'Interest',  description: 'Underlying legal interest: state sovereignty, individual rights, peremptory norms, common heritage.' },
    { id: 'legal_provision',    label: 'Legal Provision',    primitive: 'Constraint', description: 'Treaty article, customary norm, soft-law standard, jus cogens norm constraining party conduct.' },
    { id: 'enforcement_lever',  label: 'Enforcement Lever',  primitive: 'Leverage',  description: 'Mechanism for enforcing or invoking a provision: state responsibility, countermeasures, treaty-body procedure, judicial proceeding.' },
    { id: 'reservation_commitment', label: 'Reservation / Declaration', primitive: 'Commitment', description: 'Party reservation, declaration, derogation, or undertaking conditioning treaty obligations.' },
    { id: 'judicial_event',     label: 'Judicial Event',     primitive: 'Event',     description: 'Filing, judgment, advisory opinion, provisional measures, withdrawal, accession.' },
    { id: 'doctrinal_narrative', label: 'Doctrinal Narrative', primitive: 'Narrative', description: 'Doctrinal framing: erga omnes, opinio juris, persistent objector, fragmentation.' },
  ],

  edgeTypes: [
    { id: 'binds',            label: 'binds',            from: ['Constraint'], to: ['Actor'],    description: 'Legal provision binds a party.' },
    { id: 'reserves_against', label: 'reserves against', from: ['Commitment'], to: ['Constraint'], description: 'Party reserves against a specific provision.' },
    { id: 'cites_precedent',  label: 'cites precedent',  from: ['Event'],      to: ['Event'],    description: 'Judicial event cites prior judicial event as precedent.' },
    { id: 'asserts_breach',   label: 'asserts breach',   from: ['Claim'],      to: ['Constraint'], description: 'Claim asserts breach of a legal provision.' },
    { id: 'has_jurisdiction', label: 'has jurisdiction', from: ['Actor'],      to: ['Claim'],    description: 'Tribunal has jurisdiction over a claim.' },
  ],

  validators: [
    { id: 'legal.has-provision', label: 'Legal provision cited', severity: 'warn', description: 'Legal cases require at least one cited provision (treaty article, customary norm, etc.).' },
    { id: 'legal.party-bound',   label: 'Party bound by provision', severity: 'warn', description: 'When asserting breach, the bound party should be explicitly named.' },
    { id: 'legal.jurisdiction-grounded', label: 'Jurisdiction grounded', severity: 'info', description: 'Jurisdictional claims should cite the basis (compromissory clause, optional declaration, treaty body procedure).' },
  ],

  recommendedToolIds: [
    'legal.provision-tracer',           // Pack 21
    'legal.precedent-finder',           // Pack 21
    'legal.reservation-effect-mapper',  // Pack 21
    'legal.jurisdictional-analyzer',    // Pack 21
    'governance.amendment-impact-tracer', // existing
    'cross.contradiction-finder',
    'cross.brief-exporter',
  ],
};
```

### Files
Same pattern.

---

## 10. Prompt T6 — Security / Defense ontology

### Persona
NATO senior civil-military analyst or national defense planner. Knows the difference between capabilities, posture, and intent; the structure of doctrines and rules of engagement; the operational implications of force-posture changes.

### Outcome

```ts
export const SECURITY_ONTOLOGY: CaseOntologyDefinition = {
  id: 'security',
  version: '1.0.0',
  label: 'Security / Defense Ontology',
  description: 'Capabilities, force posture, doctrine, threat vectors, and engagement rules for civil-military analysis, NATO desk work, and national-defense planning.',
  domains: ['defense-planning', 'civil-military', 'force-posture', 'nato', 'strategic-analysis'],

  nodeTypes: [
    { id: 'force_actor',         label: 'Force Actor',         primitive: 'Actor',      description: 'State military, alliance, partner force, non-state armed actor with operational identity.' },
    { id: 'commander_actor',     label: 'Commander Actor',     primitive: 'Actor',      description: 'Named decision authority: head of state, defense minister, theater commander, alliance secretary-general.' },
    { id: 'capability_claim',    label: 'Capability Claim',    primitive: 'Claim',      description: 'Asserted capability: stockpile, range, readiness, lift, ISR, cyber, EW, nuclear posture.' },
    { id: 'strategic_interest',  label: 'Strategic Interest',  primitive: 'Interest',   description: 'Strategic objective: deterrence, denial, escalation control, alliance cohesion, freedom of action.' },
    { id: 'engagement_rule',     label: 'Engagement Rule',     primitive: 'Constraint', description: 'Rule of engagement, escalation threshold, treaty constraint (NPT, INF legacy, OST), operational limit.' },
    { id: 'coercive_lever',      label: 'Coercive Lever',      primitive: 'Leverage',   description: 'Means of imposing cost or signaling resolve: posture change, exercise, deployment, demonstration.' },
    { id: 'doctrinal_commitment', label: 'Doctrinal Commitment', primitive: 'Commitment', description: 'Stated doctrine: nuclear declaratory policy, alliance Article V/IV, no-first-use, integrated deterrence.' },
    { id: 'posture_event',       label: 'Posture Event',       primitive: 'Event',      description: 'Force-posture change: deployment, redeployment, basing change, exercise, mobilization, withdrawal.' },
    { id: 'threat_narrative',    label: 'Threat Narrative',    primitive: 'Narrative',  description: 'Framing of threat: peer competition, hybrid threat, terrorism, proxy warfare, gray-zone operations.' },
  ],

  edgeTypes: [
    { id: 'fields',          label: 'fields',          from: ['Actor'], to: ['Claim'],     description: 'Force actor fields a capability.' },
    { id: 'constrains',      label: 'constrains',      from: ['Constraint'], to: ['Actor'], description: 'Engagement rule constrains a force actor.' },
    { id: 'signals',         label: 'signals',         from: ['Event'], to: ['Narrative'], description: 'Posture event signals a strategic message.' },
    { id: 'commits',         label: 'commits',         from: ['Actor'], to: ['Commitment'], description: 'Force actor or alliance commits to a doctrine or posture.' },
    { id: 'escalates_against', label: 'escalates against', from: ['Event'], to: ['Actor'], description: 'Posture event escalates against a target actor.' },
  ],

  validators: [
    { id: 'security.has-force-actor',   label: 'Force actor identified',     severity: 'warn', description: 'Security cases require at least one force actor.' },
    { id: 'security.capability-bounded', label: 'Capability claims bounded', severity: 'info', description: 'Capability claims should distinguish demonstrated from asserted capability.' },
    { id: 'security.engagement-rule-cited', label: 'Engagement rules cited', severity: 'info', description: 'When citing rules of engagement, ground in specific doctrine or treaty.' },
  ],

  recommendedToolIds: [
    'security.posture-tracker',         // Pack 21
    'security.capability-assessor',     // Pack 21
    'security.escalation-modeler',      // Pack 21
    'security.alliance-cohesion-map',   // Pack 21
    'conflict.escalation-timeline',     // existing
    'cross.scenario-projector',         // existing
    'cross.brief-exporter',
  ],
};
```

### Files
Same pattern.

---

## 11. Prompt T7 — Multi-ontology case support

### Persona
Backend architect. Extends the case model to carry multiple ontologies without breaking owner scoping or the firewall.

### Phase 2 — Propose & confirm

Schema changes:

```sql
-- backend/migrations/versions/0014_multi_ontology.py
ALTER TABLE situations
  ADD COLUMN ontology_ids text[] NOT NULL DEFAULT ARRAY[ontology_id],
  ADD COLUMN primary_ontology_id text NOT NULL DEFAULT ontology_id;

-- After backfill, drop the old single-value column or alias to primary
```

Firewall behavior:
- A node's subtype must be valid in **at least one** of the case's `ontologyIds`.
- Validators run from the ontology that owns the subtype; cross-ontology edges allowed if both endpoint primitives are valid in source-or-target's ontology.

ContextProvider:
- `ctx.case().ontologyIds` returns the array.
- `ctx.case().primaryOntologyId` returns the primary.
- `ctx.case().validatorsForSubtype(subtype)` returns the right validators.

Wait for sign-off on the schema migration approach (additive vs. replace).

### Phase 3 — Execute

- Migration with backfill from `ontology_id` → `[ontology_id]`.
- Firewall validator dispatcher updated.
- ContextProvider extended.
- Workbench ontology tab supports multi-ontology display.
- Sample multi-ontology case: Yemen 2026 carrying Conflict + Humanitarian.

### Phase 4 — Verify

- Migration runs cleanly on staging.
- Multi-ontology case validates correctly.
- Single-ontology cases unaffected.

---

## 12. Prompt T8 — Profession-aware routing

### Persona
Product engineer. Reduces friction by recommending the right ontology based on what the user does for a living.

### Outcome

- Onboarding captures `role` per the extended taxonomy.
- Mapping table at `src/lib/cases/role-ontology-affinity.ts`.
- Suggestion engine in case-creation UI defaults to the role's primary ontology.
- User can override; user's chosen ontologies feed back to update affinity over time.
- Settings page lets user update role.

### Files

- `src/lib/cases/role-ontology-affinity.ts`.
- `src/components/onboarding/RolePicker.tsx` updated.
- `src/app/app/settings/preferences/page.tsx` updated.
- Tests.

---

## 13. Prompt T9 — Ontology classifier subagent

### Persona
ML engineer. Wires a `cheap_classify` task-kind invocation to recommend an ontology from a Frame description or initial document.

### Outcome

- LangGraph subgraph at `backend/agents/ontology_classifier/` (small; one node calling gemini-2.5-flash-lite).
- Eval set of 50 hand-labeled (description, expected_ontology) pairs.
- Integration with Pack 19 S1 Situation Genesis: classifier's recommendation appears in the populated case header, user can override.
- `npm run audit:ontology-classifier-accuracy` requires ≥80% on eval.

### Files

- `backend/agents/ontology_classifier/graph.py`, `prompts/system.md`, `output_schema.py`, `runner.py`.
- `backend/agents/ontology_classifier/eval/cases.json`.
- Integration in genesis_orchestrator.

---

## 14. Prompt T10 — Sample situations + workbench rendering + ADRs + final verification

### Outcome

Five sample situations:
- `src/lib/cases/ohchr-yemen-2026/` — Human Rights primary, Humanitarian secondary.
- `src/lib/cases/russia-sanctions-2026/` — Economic primary, Governance secondary.
- `src/lib/cases/sahel-aa-2026/` — Humanitarian primary, Conflict secondary.
- `src/lib/cases/icj-genocide-2026/` — Legal primary, Human Rights secondary.
- `src/lib/cases/nato-eastern-flank-2026/` — Security primary, Conflict secondary.

Each case has 30-60 nodes derived entirely from public sources, citations included, demonstrating the multi-ontology pattern.

Workbench ontology tab updated to render all 9 ontologies with the same visual treatment.

ADRs:
- `0030-multi-ontology-cases.md`.
- `0031-profession-aware-ontology-routing.md`.
- `0032-ontology-as-lens-vs-new-primitives.md`.

### Final verification

```bash
npm run audit:ontology-mapping        # 9 ontologies, all complete
npm run audit:ontology-versions       # version monotonicity
npm run audit:ontology-classifier-accuracy  # ≥80%
npm run audit:context-types-parity
npm run test:e2e:personas             # green for 10 runs
npm run audit:gate
```

---

## 15. Out of scope

- User-authored custom ontologies — v2 (significant authoring UX).
- Cross-ontology automatic actor identity resolution — v2.
- Ontology-specific subagents beyond the classifier — v1.2+.
- Ontology versioning across migrations — v1.2+.

---

## 16. Closing note

The substrate is the same. The eight ACO primitives are the same. The four-layer context is the same. The Tool Contract v2 is the same. Five new ontologies prove the architecture's claim that ontologies are lenses, not new substrates. Five new professional communities now have a workbench that speaks their vocabulary. The pattern that enabled adding these five enables adding ten more later — public health, supply-chain risk, climate-security, electoral integrity, anti-corruption — without any new structural decisions.

After this pack, PRAXIS becomes a workbench that scales by mapping, not by adding code. That is the product the architecture was always designed to support.

Branch: `feature/dynamic-ontologies`. Commit prefix `ontology(<id>): T<N> <description>`. PR titled `Pack 20 — Dynamic Ontology Expansion`.

---

**File path**: `C:\Users\giuli\Downloads\PRAXIS_CODEX_20_DYNAMIC_ONTOLOGIES.md`
