# Archived Audit Scripts - 2026-05-08

These scripts were removed from the active `scripts/` surface during the May 8 codebase cleanup because they are historical phase audits and are not referenced by the current `package.json` audit gate.

They are stored as `.ts.txt` files so TypeScript does not compile archived evidence.

Current replacements live in the active `scripts/` directory and are wired through `npm run audit:gate`, especially:

- `scripts/audit-ai-routes.mjs`
- `scripts/audit-workbench.ts`
- `scripts/audit-surface-registry-coherence.ts`
- `scripts/audit-context-aware-coverage.ts`
- `scripts/audit-hero-tool-calibration-coverage.ts`
- `scripts/audit-repo-shape.ts`

Keep these archived copies for evidence and archaeology. Do not rewire them into CI without first checking whether their invariant is still valid.
