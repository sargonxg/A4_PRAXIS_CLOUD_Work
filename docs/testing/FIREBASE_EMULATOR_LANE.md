# Isolated authenticated CI lane

`npm run smoke:emulators` builds a separate local test application and runs the
existing onboarding, golden-path and authenticated-app suites once against Auth and
Firestore emulators. It never creates a real Firebase user or uses the shared
hosted test account. No route assertion, cookie signer, authorization check,
Firestore rule or production fallback is replaced by a mock identity.

This lane proves only emulator identity and persistence. Existing golden-path
model/boardroom/export mocks stay explicit. Hosted Firebase, reCAPTCHA, invited
access, providers, production rules enforcement and deployment acceptance remain
separate gates. Do not deploy the emulator build or present its checks as those
gates passing. The former workflow ran golden-path twice; one invocation now
preserves every distinct assertion without that duplicate run. The existing
production `next start` command serves the complete local build/public assets;
this lane does not establish standalone-image packaging acceptance.

The runner accepts Node22, an isolated `firebase-tools`15.34.0 CLI entry point
(`PRAXIS_FIREBASE_CLI`), and Java21 (`PRAXIS_TEST_JAVA_HOME` or the CI-provided
`JAVA_HOME_21_X64`). It verifies the CLI version and the Firestore1.22.0 binary's
SHA-256 before execution. The jar URL/checksum is pinned in
`scripts/emulators/environment.mjs` from the CLI's published emulator metadata.
CLI installation is isolated in the runner's temporary folder, outside app
dependencies; no production dependency or lockfile is changed.

The public/private opt-ins, all synthetic client identifiers, both exact loopback
endpoints, demo project, binding address and port must match. Partial or mixed
configuration, real credential inputs and hosted deployment markers fail closed.
No credentials are read from a file. Unowned preinitialized SDK apps are rejected,
even if they declare the demo project. Storage is unsupported and refused.

The outer runner scrubs inherited application/credential settings and uses a new
task-local Firebase CLI configuration directory. Private `.env` files in the
checkout are rejected. The emulator server uses the existing repository rules;
no rules are deployed or relaxed. A fresh synthetic account is created using
the Auth emulator SDK. The unchanged application creates its profile and saves
the onboarding reminder; a final emulator database read checks the skip count.
After the unchanged first-login suite, a separate fresh browser signs in through
the real app and uses existing authenticated APIs to create `golden-path-capsule`
as a private builder draft requiring human review, plus a fictional unreviewed
`source_note` named `treaty-source-1`. Persisted GET responses verify both IDs,
ownership and draft/privacy boundaries. This supplies the golden path's missing
real capsule prerequisite without accepting nonexistent capsules. It creates no
canonical Source Core or reviewed evidence; the original golden answer citations,
provider, export and boardroom mocks remain unchanged. This lane does not prove
canonical source attachment or those mocked backend capabilities.
The random test password and cookie-signing material remain in process memory
and are never part of the measurement receipt.

App/test Node subprocesses deny connections outside the known loopback ports.
Browser tests use a local reject-all external proxy, including HTTPS tunnels;
only loopback connections bypass it. Negative probes verify both protections
before the suites run. The production CSP is unchanged; only validated emulator
configuration adds its exact two loopback origins. Emulator identity errors
cannot invoke the production Identity Toolkit fallback.

One worker, zero retries, a512MiB JVM heap and2GiB Node heap bound this lane. Ports
must be free before startup; unknown listeners are never stopped. The runner
owns application/proxy lifecycle; `emulators:exec` owns emulator lifecycle. No
global install, PATH modification, sign-in, IAM/secret/rule change, cloud build
or deployment is performed. Java checks have a 30-second deadline, compilation 25
minutes, emulator acceptance 8 minutes, and the complete runner 36 minutes. Public
binary downloads abort after 2 minutes. Expired stages attempt graceful shutdown
before bounded cleanup of their owned process tree. Windows cleanup verifies
parent identity and descendants' creation times; it never kills by port. An
abrupt failed root produces `OWNED_DESCENDANTS_UNVERIFIED` and a failed receipt
instead of inferring that descendants stopped or killing an unowned process.
Successful root exits rely on the application's and Firebase CLI's normal cleanup
contracts. They do not independently prove that every descendant has exited. The
owned-tree termination checks apply to expired stages; a successful stage receipt
must not be described as proof of complete process-tree cleanup.
Task-local receipts record stages and limitations;
raw local logs and tooling configuration are not uploaded as CI artifacts.

Linux CI installs Chromium into a dedicated task-local `PLAYWRIGHT_BROWSERS_PATH`
and supplies that same absolute directory as `PRAXIS_TEST_BROWSERS_PATH` to the
isolated runner. Ambient browser paths/options are not forwarded. Linux refuses
a missing dedicated path; all platforms refuse a relative dedicated path.
This matters because Linux Playwright otherwise resolves its browser beneath the
runner's deliberately fresh `XDG_CACHE_HOME`, unlike Windows' retained local
application cache. The workflow pins the observed Ubuntu 24.04 OS for reproducibility;
this is not evidence that an Ubuntu upgrade caused the original failure.

`bootstrap.json` records only fixed phase/status/failure-code fields and fixed
curated messages. `failure.json` separates the recognized primary failure from
the process/descendant-cleanup failure. The outer runner awaits private-log flush
and reads at most its last 64 KiB for fixed-pattern classification. It never copies
log lines, exception text, destinations, environment values or unknown fields to
uploaded diagnostics; unrecognized errors remain explicitly unknown. Receipt
write failures cannot replace the original exception. Raw CLI/app/debug logs stay
private and are excluded from CI artifacts. A new exact-commit Linux CI result is
still required to establish the original startup cause and validate the repair.
