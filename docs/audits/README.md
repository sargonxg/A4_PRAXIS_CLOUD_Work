# PRAXIS Audit Index

Date: 2026-05-30
Status: current audit routing index

Use the latest dated audit for current evidence. Older dated audits are retained
as historical proof unless a specific cleanup commit removes them with updated
references.

## Current Audits

- [`2026-05-30-full-ux-agentic-capsule-legal-diagnostic.md`](./2026-05-30-full-ux-agentic-capsule-legal-diagnostic.md)
  - Current full UX, legal/privacy readability, capsule, boardroom, and
    agentic-runtime diagnostic with fixes and remaining red flags.
- [`2026-05-30-launch-readiness.md`](./2026-05-30-launch-readiness.md)
  - Launch-readiness contract report; latest result is 46 pass, 1 warn, 0 fail.
- [`2026-05-30-red-flags-and-improvement-plan.md`](./2026-05-30-red-flags-and-improvement-plan.md)
  - Current red flags, 10 important improvements, and docs cleanup decision.
- [`2026-05-30-DEEP_PRESHIP_CHECKLIST.md`](./2026-05-30-DEEP_PRESHIP_CHECKLIST.md)
  - Static pre-ship checklist; latest result was 139 pass, 2 warn, 0 blocked.
- [`2026-05-31-DEEP_PRESHIP_CHECKLIST.md`](./2026-05-31-DEEP_PRESHIP_CHECKLIST.md)
  - Latest generated static pre-ship checklist; latest result is 140 pass, 2
    warn, 0 blocked.
- [`2026-05-30-capsule-research-dossiers-audit.md`](./2026-05-30-capsule-research-dossiers-audit.md)
  - Current v16 research-dossier, claim-ledger, source-refresh, and graph-seed
    capsule audit.
- [`2026-05-30-capsule-backfill-readiness-audit.md`](./2026-05-30-capsule-backfill-readiness-audit.md)
  - Static readiness audit for owner-scoped starter research-dossier
    subcollections and the diagnostic backfill path.
- [`2026-05-25-capsule-consolidation-audit.md`](./2026-05-25-capsule-consolidation-audit.md)
  - Latest capsule consolidation audit, now regenerated for catalog v16.
- [`2026-05-19-capsule-depth-audit.md`](./2026-05-19-capsule-depth-audit.md)
  - Capsule depth audit, now regenerated for catalog v16.
- [`tool-contracts-2026-05-31.md`](./tool-contracts-2026-05-31.md)
  - Latest tool operating-contract audit.

## Retention Policy

- Keep dated audit snapshots when they document a deploy, production proof,
  migration, or generated contract state.
- Do not delete old audit files just because they are old; delete only when
  references and generated scripts have been checked.
- If a generated audit creates a newer file for the same date/topic, update this
  index instead of adding another top-level pointer.
