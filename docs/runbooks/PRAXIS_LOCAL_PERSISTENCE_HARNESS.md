# Isolated PRAXIS persistence harness

This lane uses genuine Firebase SDK sign-in, the real signed-session API and
the existing Firestore schemas/rules. It proves local persistence and isolation.
It does not execute models, source extraction, Cloud Tasks or Postgres workers.
Use only synthetic accounts and permitted synthetic evidence. The UI labels
this lane explicitly. Never deploy its configuration.

## Prerequisites and launch

Run from `C:\Users\giuli\output\praxis-workspace-local-20261002` with the
repository's installed npm dependencies, Playwright Chromium and Java 21+.
The Firebase CLI is the installed repository tool; no project selection is
inherited. Do not stop another process to acquire a port.

In a first PowerShell terminal:

```powershell
.\scripts\start-local-emulators.ps1 -JavaHome '.\output\followup\tools\java21\jdk-21.0.12.1+1'
```

The optional Java path is the previously downloaded official Temurin JDK.
Its ZIP SHA256 is `f9d6e191ab098c0d416e7d588a24420a8621cd2f4720dab2459b8b7b2d2d8b4e`;
license: GPLv2 with Classpath exception. It remains ignored local tooling, not
a new application dependency. An existing Java 21+ installation can instead
be used by omitting `-JavaHome`. The script changes only its child environment.

In a second PowerShell terminal:

```powershell
.\scripts\start-local-persistence.ps1
```

Open `http://127.0.0.1:3020/login`. The demo project is `demo-praxis-local`,
Auth is `127.0.0.1:9099`, Firestore is `127.0.0.1:8080`, hub is port 4400.
Partial/mismatched configuration, non-loopback hosts and Cloud Run identity
are rejected before credential reads. Local source-byte storage is unavailable.
Provider constructors and both Postgres pools reject this lane even if real
provider/database environment values were inherited. API gates also deny
indirect classification, Capsule+ graph export and unsupported execution.

## Reproduce the journey

In a third terminal:

```powershell
$env:PRAXIS_LOCAL_EMULATORS = 'true'
$env:FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099'
npx playwright test --config playwright.local-persistence.config.ts
```

The test creates two unique synthetic accounts, uses actual login/onboarding,
creates a project and purpose-only capsule, saves two capsule revisions,
attaches v1, saves a draft assignment and supplies a controlled synthetic memo.
It corrects and reviews the memo through the UI, downloads the saved reviewed
Markdown/DOCX, refreshes/relogs in and checks outsider/rules/disabled-user
denials. The memo is supplied text, not a model answer. Project assignments are
drafts, not dispatched runs. Only a passing fresh receipt establishes the
steps completed; screenshots from an interrupted run do not establish a pass.

Evidence is under `output/followup/journey` and `output/followup/checks`.
The receipt identifies synthetic objects and the fixture hash. The test-only
password is defined in the test file; these accounts have no production access.
No production account or token is needed or recorded. Auth emulator exports
contain synthetic account state and must stay ignored and local.

If the original emulator launcher lacked `--export-on-exit`, save its synthetic
state before stopping it:

```powershell
npx --no-install firebase emulators:export output/followup/emulator-data --project demo-praxis-local --config firebase.emulators.json
```

The new launcher imports that local snapshot when available and exports it on
clean exit. Browser refresh/relogin acceptance alone does not prove a disk
restart: verify the snapshot import/reopen separately before claiming that.

After a successful journey and export, stop only these emulators, restart with
the same launcher (its log must show Auth and Firestore imports), and restart
the application. Then verify the original records, without creating replacements:

```powershell
$env:PRAXIS_LOCAL_EMULATORS = 'true'
$env:FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099'
$env:PRAXIS_LOCAL_RESTORE = 'true'
npx --no-install playwright test --config playwright.local-persistence.config.ts --grep 'disk restoration'
Remove-Item Env:PRAXIS_LOCAL_RESTORE
```

This uses the original synthetic account from `journey/receipt.json`, verifies
the same project/work-item/memo IDs, v1 context pin, corrected v2 memo and exact
source-version/hash/offset records, then compares restored Markdown byte-for-byte
and checks DOCX XML. `restoration-receipt.json` records this separate result.
It proves operational emulator backup recovery, not portable capsule import,
production durability or document rendering. Keep every emulator export local.

## Validation and recovery

An existing Next session can keep `.next`. The harness uses
`.next-local-persistence`; for a separate canonical production build use:

```powershell
$env:PRAXIS_LOCAL_VALIDATION = 'true'
npm run build
```

That flag changes only build output/TypeScript configuration to
`.next-local-validation`; it does not enable emulators or change production
features. Run lint and tests against source, not generated bundles. Do not
run simultaneous resource-heavy builds on this workstation.

Memo POST requires `expectedVersionId` (null for create-only) and a retained
`operationId`. Retry identical input with the same operation; a changed body
needs a new operation. A 409 keeps the editor's changes: reopen the canonical
version and deliberately reconcile. Saving clears prior approval. Human review
binds the exact version/body hash and intended use; it is not a truth certificate.
The API change requires older clients to refresh before saving.

Question handoffs/drafts use owner/conversation-scoped same-tab sessionStorage,
with a 30-minute logical expiry and explicit claim. This is temporary recovery,
not canonical storage. Browser opener copies and shared-device access are
exposure limits; expiry deletion is lazy. Historical URL/log text is not erased.

Stop only the server/emulators launched for this lane. Preserve other servers,
worktrees, credentials and configuration. Model calls, production publication,
team sharing and state-changing canaries require their separate authorized scope.
