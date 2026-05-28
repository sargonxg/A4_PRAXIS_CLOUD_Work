# Lane: Frontend QA And Product Surface

## Scope

- Ask PRAXIS cockpit and workbench surfaces.
- Responsive layout, overflow, loading/empty/error states.
- Source previews, receipts, agent run rails, capsule/workbench UI.
- Browser console and network failures.

## No-Touch Boundaries

- Do not add new top-level app pages or primary navigation without explicit approval.
- Do not replace the Civic Atelier direction without updating design guidance.
- Do not hide runtime proof or source/receipt state to make UI simpler.

## Start Reads

- `docs/CODEX_SESSION_BRIEF.md`
- `docs/product/PRAXIS_CANONICAL_APP_STRUCTURE.md`
- `docs/product/CONTEXT_CAPSULE_POLICY_RESEARCH_GUIDE.md`
- `docs/architecture/PRAXIS_ARCHITECTURE.md`
- `src/components/ask/`
- `src/components/praxis/`

## Validation

```powershell
npm run typecheck
npm run test
npm run smoke:tasklet-app
```

For layout-sensitive changes, add Playwright screenshots at desktop and mobile widths and inspect browser console errors.

## Done Evidence

- Files changed and why.
- Route(s) inspected.
- Viewport(s) checked.
- Console/network findings.
- Tests and screenshots or reason screenshots were not needed.
