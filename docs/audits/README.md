# PRAXIS Audit Index

Date: 2026-05-30
Status: current audit routing index

Use the latest dated audit for current evidence. Older dated audits are retained
as historical proof unless a specific cleanup commit removes them with updated
references.

## Current Audits

- [`2026-05-30-red-flags-and-improvement-plan.md`](./2026-05-30-red-flags-and-improvement-plan.md)
  - Current red flags, 10 important improvements, and docs cleanup decision.
- [`2026-05-30-DEEP_PRESHIP_CHECKLIST.md`](./2026-05-30-DEEP_PRESHIP_CHECKLIST.md)
  - Static pre-ship checklist; latest result was 139 pass, 2 warn, 0 blocked.
- [`2026-05-25-capsule-consolidation-audit.md`](./2026-05-25-capsule-consolidation-audit.md)
  - Latest capsule consolidation audit, now regenerated for catalog v15.
- [`2026-05-19-capsule-depth-audit.md`](./2026-05-19-capsule-depth-audit.md)
  - Capsule depth audit, now regenerated for catalog v15.
- [`tool-contracts-2026-05-30.md`](./tool-contracts-2026-05-30.md)
  - Latest tool operating-contract audit.

## Retention Policy

- Keep dated audit snapshots when they document a deploy, production proof,
  migration, or generated contract state.
- Do not delete old audit files just because they are old; delete only when
  references and generated scripts have been checked.
- If a generated audit creates a newer file for the same date/topic, update this
  index instead of adding another top-level pointer.
