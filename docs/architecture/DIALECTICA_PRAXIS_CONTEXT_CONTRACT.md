# DIALECTICA PRAXIS Context Contract

Last updated: 2026-05-15

## Product Boundary

PRAXIS owns the workbench: context selection, asking, writing, review, handover,
and the lightweight MVP context object.

DIALECTICA by TACITUS will own full context creation: ingestion, extraction,
graph construction, ontology alignment, provenance, versioning, advanced context
packages, and durable knowledge creation.

Use Context Core Lite now. Build full cores with DIALECTICA by TACITUS later.

## Modes

```ts
type ContextCreationMode = "praxis_lite" | "dialectica_future";
```

| Mode | User label | Status | Owner |
| --- | --- | --- | --- |
| `praxis_lite` | Context Core Lite | Available now | PRAXIS |
| `dialectica_future` | DIALECTICA Core Builder | Coming soon | DIALECTICA by TACITUS |

## Context Core Lite

`Context Core Lite` is the current MVP path. It is intentionally small and uses
existing PRAXIS infrastructure:

- Situation Core
- User Core when available
- Praxis Capsule
- Context Package
- active context stack
- source and document refs
- health, missing cores, assumptions, and gaps

The type lives in `src/lib/context/context-core-lite.ts`.

## DIALECTICA Future Export

The future contract lives in
`src/lib/context/dialectica-context-contract.ts`.

DIALECTICA exports reviewable context data. PRAXIS consumes it, but does not
turn unsupported or conflicting material into facts.

```ts
type DialecticaContextExport = {
  contractVersion: string;
  packageId: string;
  exportedAt: string;
  title: string;
  situationCoreId?: string;
  userCoreId?: string;
  capsuleId?: string;
  contextPackageId?: string;
  claims: {
    id: string;
    kind: "fact" | "evidence_gap" | "conflicting_claim";
    text: string;
    sourceIds: string[];
  }[];
  assumptions: string[];
  uncertainties: string[];
  evidenceGaps: string[];
  sourceReceipts: {
    id: string;
    title: string;
    url?: string;
    citation?: string;
    excerpt?: string;
  }[];
};
```

## Mapping Rule

- `fact` claims may enter the factual preview.
- `evidence_gap` claims stay evidence gaps.
- `conflicting_claim` claims stay conflicts.
- assumptions stay assumptions.
- uncertainties stay uncertainties.
- source receipts survive the mapping.

This keeps the fast PRAXIS MVP from corrupting the long-term architecture.
