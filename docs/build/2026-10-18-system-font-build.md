# Reproducible build with existing system-font fallbacks

The production build at native attachment checkpoint `fe612465` failed while
`next/font/google` downloaded EB Garamond, Inter and JetBrains Mono. Retaining
the executor's existing proxy did not resolve it; a direct diagnostic returned
`Tunnel connection failed: 403 Forbidden`. No download bypass, new font asset,
credential, certificate change or security setting was introduced.

The root layout now uses the existing CSS font stacks without the build-time
Google loader. Installed named fonts remain first, followed by the existing
system sans, serif and monospace fallbacks. The unused, undefined
`--font-geist-mono` reference was removed so the monospace stack remains valid.
The exact rendered face and line wrapping can vary by platform. This does not
claim to bundle or render the named faces on machines where they are absent.

Validation in this executor:

- `npm run build`: passed, including Next production compilation, type checks
  and route generation, without font network access.
- `npm run lint`: passed with five existing warnings and zero errors.
- Local production server, system Chromium 154: `/` and `/login` each returned
  200 at 1440x900 and 390x844; computed sans/serif/mono stacks retained their
  roles, zero Google font requests, zero horizontal overflow. Server stopped
  after verification. No authenticated account, Firestore or provider claim.
- The first full suite after this change passed 3078/3079 tests; its sole
  failure expected the removed Google loader. The visual-contract test now
  verifies the existing roles and full fallback stacks, alias preservation,
  absence of the loader and absence of the undefined monospace variable.
  Independent review approved the source and test changes; the reviewer ran
  the visual-contract file, 10/10 passed.
- Final `vitest run` with the real pinned Rust test enabled: all 3079 tests
  across 500 files passed, no skips. `tsc --noEmit`, repository-shape and
  architecture-reference audits also passed after the font change. This is
  local evidence; the full cloud readiness gate is not established here.

Native adapter tests use the pinned Rust binary and synthetic archive described
in `docs/architecture/TACITUS_NATIVE_ATTACHMENT_SLICE.md`. Hosted native artifact
authority remains intentionally unbound and fails closed. Graphify and gcloud
are unavailable here; graph refresh and live GCP resource audit are not passes.
No deployment or cloud setting change was performed. Existing Cloud Build
recipes include IAM and capacity flags; trigger state must be established
before any main merge that could invoke those recipes.
