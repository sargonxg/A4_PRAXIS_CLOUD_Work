# PRAXIS Tasklet-Style MVP Cleanup Ledger

Date: 2026-05-15  
Status: first implementation ledger for the Tasklet-style PRAXIS cleanup and foundation pass

## 2026-05-15 Update

- The first viewport now has a Tasklet-style PRAXIS workbench instead of a
  generic landing hero.
- The authenticated Home surface reuses the same workbench shell.
- The marketplace is now policy-agent first; the raw canonical tool archive can
  remain behind specialist/advanced access until deletion evidence is complete.
- Research Memo Agent is wired as the first non-noop worker branch and creates
  a Memo Studio draft with source/gap receipts.
- Added `audit:tasklet-policy-workbench` to prevent regressions in the new
  surface, policy-agent destinations, and deferred integration claims.

## Purpose

This ledger keeps the cleanup tied to the product target:

```text
Homepage prompt -> ContextCapsule -> active user/situation/source/tool/output cores
-> Ask PRAXIS / Library / Memo Studio / Canvas -> auditable agent runs
```

The implementation should remove or archive anything that competes with that
shape, but only after route/import/reference evidence proves the target is not
needed for the MVP.

## Keep

- Public product routes: `/`, `/learn`, `/tacitus`, `/pricing`,
  `/release-notes`, auth, legal, and security pages.
- Authenticated spine: `Home`, `Ask PRAXIS`, `Library`, `Memo Studio`,
  `Canvas`, `Advanced`.
- ContextCapsule contracts and UI: `src/lib/product/context-capsules.ts`,
  `/app/contexts`, User Core, Situation Core, active stack, readiness, fork,
  lock, share, lineage, and combination proposal flows.
- Policy/conflict/statecraft tools that attach to capsules: Ask PRAXIS,
  Sourceability, grounded research, source/document intake, timeline, graph and
  power map, ACH/scenario, memo drafting, red-team review, and handover.
- Runtime foundation: Cloud SQL agent run ledger, Cloud Tasks dispatch,
  Genkit/ADK mirror contracts, approval states, and GCP/Firebase/Vertex
  boundaries.

## Fold Or Archive

- Old demo-first public surfaces should redirect into the real app or be moved
  under archived evidence when no longer useful.
- Syria showcase components remain evidence until references are removed; they
  should not be the public homepage or primary product story.
- Boardroom, ACH, advisor/persona, diagnostics, and specialist routes should
  stay reachable through `Advanced` or workbench context rather than primary
  navigation.
- Historical v4/v5/v7 prompt packs should remain archived evidence unless an
  active build ledger reactivates them.

## Remove Only With Evidence

Before deleting code or docs:

1. Run `rg "<route-or-file-or-heading>"`.
2. Check `src/proxy.ts`, `src/lib/navigation/primary-nav.ts`, app routes,
   tests, docs indexes, and `ARCHITECTURE.md`.
3. Prefer route redirects or archive notes for useful historical material.
4. Delete only generated scratch, duplicate surfaces, stale fake-live claims,
   or unreferenced code with no build/runtime role.

Current high-confidence cleanup class:

- generated scratch artifacts;
- duplicate public pages already folded by proxy;
- stale UI copy claiming live browser automation, external sending, MCP write
  tools, broad SaaS connectors, or code sandboxing without approval gates.

## Next Deletion Pass

- Extend `audit:route-consolidation` with the next folded routes after each
  route is proven safe.
- Run `npx knip` before package/dependency cleanup.
- Add a focused route inventory for `/demo/*`, Syria-only components, and old
  tour components before removing them.
- Keep `graphify update .` as the post-code-change graph refresh gate.
