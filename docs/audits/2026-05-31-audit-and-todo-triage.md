# PRAXIS Audit Runner And TODO Triage

Date: 2026-05-31
Status: Session 5 launch-hardening artifact

## Audit Runner

Current local inventory before cleanup:

- `package.json` exposes 71 `audit:*` commands.
- `scripts/` contains 63 audit implementation files.

The safe cleanup in this branch consolidates the launch orchestration layer
instead of deleting historically referenced leaf audits:

- `audit:launch` now routes through `scripts/audit-runner.ts launch`.
- `audit:gate` now routes through `scripts/audit-runner.ts gate`.
- `audit:routes` now routes through `scripts/audit-runner.ts routes`.
- `audit:simplification` now routes through `scripts/audit-runner.ts simplification`.

Leaf audits remain callable because architecture docs, generated deep pre-ship
checks, authenticated runtime lanes, and older proof ledgers still reference
specific script names. Removing those in this PR would trade visible sprawl for
broken reproducibility. The next cleanup should retire a leaf audit only with:

1. a replacement group in `scripts/audit-runner.ts`;
2. references updated in docs/tests/runbooks;
3. one green `npm run audit:launch-readiness` after removal.

## TODO And Stub Triage

Session 5 scan:

```powershell
rg -l "\b(TODO|FIXME|STUB|stub|placeholder)\b" src tests scripts docs --glob '!docs/_archive/**' --glob '!docs/audits/**' --glob '!node_modules/**'
```

Result: 64 files, 156 matches.

### Implemented In This Branch

- Billing CTAs now call the real checkout route for authenticated users and use
  signup-to-checkout for signed-out users.
- Settings exposes Manage billing through the portal route.
- Legal pages no longer display pending-review banners and now state the beta,
  US-data, and Polar sub-processor posture.
- Public and signed-in homes route policy missions to capsule creation.
- Authenticated golden-path coverage is wired into CI when disposable Firebase
  credentials are present.

### Ticketed

- `src/lib/agent-runtime/capsule-factory.ts` still carries the session-3 approval
  seam note. It is intentional documentation for future supervisor approval
  hooks, not a disabled Session 5 user path.
- `src/lib/agents/registry.ts` keeps inactive persona entries marked as stubs.
  These are registry placeholders and should be promoted only when a route and
  proof event stream exist.
- `src/lib/ai/ask-praxis-tools.ts` contains a free-user stub path for gated
  grounded search. Keep it honest until the paid web provider is configured.
- `docs/tools/*` still uses TODO sections for tool-catalog authoring. Convert
  those to owner/date/action fields in the next docs cleanup pass.

### Accepted Copy / Test Fixtures

- UI `placeholder` attributes are expected in inputs and textareas and are not
  unresolved implementation stubs.
- Test fixtures using `sha256:placeholder`, source-placeholder guards, or
  minimal stubs are retained where the test explicitly verifies placeholder
  rejection or mocks a small dependency surface.
- Historical build prompts mention `TODO.md`; those references are not product
  debt and should not be deleted.

## Remaining Gap

The audit runner makes the ship gate modular, but the raw audit leaf count is
still intentionally high. A follow-up cleanup can reduce that number only after
updating the generated pre-ship checks and historical runbooks that currently
assert specific audit names.
