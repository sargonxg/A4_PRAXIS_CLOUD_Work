# ITERATE_LOOP — recovery patterns for v2

When Codex stops short on a v2 file, the failure modes are different
from the night pack. Multi-tenant rules can be silently wrong.
Postgres cutovers can lose data. Operational changes (Cognee, Cloud
Logging) often need GC's hand. This file is the recovery playbook.

## How to read this file

For each failure pattern: a recognition signal, the underlying cause,
and a re-prompt that gets Codex back on track. Pull the matching
re-prompt and paste it into the next Codex turn.

---

## Pattern 1 — "I made the change but tests/audits aren't passing"

**Signal**: Codex reports the file is done, but `audit:gate` fails
or rules tests fail.

**Cause**: Codex implemented the happy path but missed an edge case
that the audit / test catches.

**Re-prompt**:

> "Run the failing audit/test in isolation and paste its full output
> here. For each FAIL line, open the file at the indicated location
> and walk me through what's missing. Do not move on to other tasks
> until every line passes. If the audit itself is wrong (false
> positive), say so and propose the audit fix; otherwise the code
> is wrong."

---

## Pattern 2 — "The migration script is dangerous and I'm hesitant"

**Signal**: Codex hedges, asks GC to run things manually, or skips
the script entirely.

**Cause**: Codex correctly identified that a destructive operation
needs human oversight, but didn't write the script that GC will
later run.

**Re-prompt**:

> "Write the script even if you don't run it. Include:
> (1) `--dry-run` mode that prints what would change without writing
> (2) `--apply` flag required for any write
> (3) Idempotency: re-running with `--apply` is safe
> (4) Logging to a `migration_log` collection or stdout
> (5) Clear error messages with rollback instructions
> Then put a note in STATUS.md describing exactly when GC should
> run it and from where. Don't skip the script — the script is the
> deliverable."

---

## Pattern 3 — "Codex modified an off-limits file"

**Signal**: Diff shows changes to `cookie-signer.ts`, `middleware.ts`,
`firebase/admin.ts`, or `firestore.rules` outside of A3.

**Cause**: Codex's autonomous loop expanded scope into protected
territory.

**Re-prompt**:

> "Stop. The off-limits files for this pack are listed in 00_README
> hard rules. Revert any changes to those files except the explicit
> additive payload field in cookie-signer.ts (allowed in A1) or the
> rules expansion in A3 (allowed only there). Show me a diff that
> excludes the protected files, and re-confirm the audit gate."

---

## Pattern 4 — "Postgres cutover is mid-flight and something feels off"

**Signal**: Dual-write is enabled but parity audit shows > 5% drift,
or read fallback fires too often, or the dead-letter queue grows.

**Cause**: A bug in the dual-write path, schema mismatch, or auth
issue between monolith and FastAPI.

**Re-prompt**:

> "Pause forward progress. Stay on the current step (B1, B2, or B3)
> and diagnose. Run:
> (1) The parity audit: `tsx scripts/audit-dual-write-parity.ts`
> (2) Inspect graph_dual_write_backlog: how many entries, what's
>     the most common error?
> (3) For one drifting case, dump both Firestore and Postgres state
>     and identify which fields differ.
> Report findings. Do NOT advance to the next B-file until drift is
> < 1%. If drift is structural (schema mismatch), call it out and
> hold for GC."

---

## Pattern 5 — "Cognee binding succeeds in dev but fails in prod"

**Signal**: Smoke test green locally, returns 401/403/timeout in
production after deploy.

**Cause**: Service-to-service auth not bound, VPC routing missing,
or env var not propagated to the Cloud Run revision.

**Re-prompt**:

> "Production-only failure. Run, in order:
> (1) `gcloud run services describe praxis-monolith --region=...
>      --format='value(spec.template.spec.containers[0].env)'`
>     — confirm COGNEE_BACKEND_URL and COGNEE_ENABLED are set on
>     the active revision.
> (2) `gcloud run services get-iam-policy praxis-cognee --region=...`
>     — confirm the monolith service account has run.invoker.
> (3) `gcloud run services logs read praxis-cognee --limit=20`
>     — what error does the cognee service log when monolith calls?
> Paste each output. Do not 'fix' anything until the root cause is
> identified."

---

## Pattern 6 — "Firestore rules tests pass but a real collaborator
can't see a shared case"

**Signal**: A3 tests green; manual two-account smoke fails.

**Cause**: Rules tests use the @firebase/rules-unit-testing
emulator. The emulator's interpretation of `request.auth.token` may
differ from production tokens. The cookie may not be carrying the
custom claims (orgId, roles).

**Re-prompt**:

> "Diagnose at the boundary between session cookie and rules.
> (1) Sign in as the collaborator. Inspect their session cookie
>     payload (decode the JWT-style body section).
>     Does it include orgId? roles?
> (2) If not, A1's cookie-refresh isn't running. Check
>     scripts/migrate-self-orgs.ts log — was the user's data
>     migrated? Was the cookie refreshed after invite accept (A4)?
> (3) If cookie is correct, the rules helper isn't reading
>     request.auth.token correctly. Test with a Firestore rules
>     log statement (`debug` block) to see what the rule sees.
> Report what's in the cookie before fixing anything."

---

## Pattern 7 — "Telemetry events drop or duplicate"

**Signal**: BigQuery shows missing events for an action that
definitely happened, or 2x events for one action.

**Cause**: Async emit pattern with race conditions, or middleware
double-invoke (Next.js route handlers can run twice in dev).

**Re-prompt**:

> "Check three places:
> (1) The emit site itself — is `emitTelemetry` called once per
>     action, or inside a hook that fires multiple times?
> (2) Next.js route file — is the handler exported once, or are
>     there multiple HTTP method exports calling the same emit?
> (3) Middleware — does it run before AND after the route, both
>     emitting?
> The schema's idempotency field (event id) can dedupe in BigQuery
> if needed — but find and fix the source first. Show me the emit
> site for the affected event."

---

## Pattern 8 — "I rewrote everything and now nothing works"

**Signal**: Build broken, tests broken, multiple files changed,
unclear scope.

**Cause**: Codex took a too-wide refactor that bled across multiple
v2 files at once.

**Re-prompt**:

> "Stop. Before any more code:
> (1) `git status` — list every modified file.
> (2) For each file, name which v2 prompt (A1, A2, ...) it belongs
>     to.
> (3) For any file not belonging to the current prompt's scope,
>     `git checkout HEAD -- <file>` to revert.
> Re-anchor on the current prompt's task list. Implement only those.
> Show me the reduced diff."

---

## Pattern 9 — "Audit script itself is buggy"

**Signal**: Audit fails for a reason that doesn't make sense — e.g.,
it complains about missing imports that are present.

**Cause**: The audit script's regex / AST analysis has a false
positive.

**Re-prompt**:

> "The audit may be wrong. Show me the offending line of the audit
> script and the file it claims is failing. If the audit is checking
> a string that's also legitimate elsewhere (allowlist gap), update
> the audit's allowlist with a comment explaining why. Audits exist
> to catch real regressions, not to gatekeep on pattern matches.
> If the audit is correct and the file is wrong, fix the file."

---

## Pattern 10 — "Operational step blocking; Codex needs to wait"

**Signal**: Codex needs an env var, an IAM bind, a service deploy,
or a database connection that requires GC's GCP/console access.

**Cause**: Many v2 tasks have operational steps that Codex cannot
execute.

**Re-prompt** (use this to instruct Codex what to do while waiting):

> "This step requires GC to run a command in GCP. Do the following:
> (1) Write the exact command(s) GC needs to run, with all
>     parameters spelled out (no placeholders unless GC must fill
>     them in).
> (2) Add a row in STATUS.md under `## Pending operational steps`
>     with: prompt-file, step-description, command, who-runs,
>     status (pending|done).
> (3) If the next prompt-file depends on this step, mark it
>     `blocked-on:<step-id>` in STATUS.md.
> (4) Continue with any tasks that don't depend on the blocked
>     step. If everything in the current prompt depends on it,
>     stop and surface the block."

---

## Pattern 11 — "Custom claims aren't propagating; users see stale state"

**Signal**: User accepts an invite but doesn't see the new org until
sign-out/sign-in.

**Cause**: A4's cookie-refresh isn't running, OR the client is
reading stale cookie data, OR the middleware redirect isn't
triggering for stale cookies.

**Re-prompt**:

> "Test the refresh chain:
> (1) Sign in as user B, accept an invite to org X.
> (2) Inspect the response: is there a Set-Cookie header with the
>     refreshed payload?
> (3) After accept, GET /api/users/me — does the response include
>     org X in memberships?
> (4) Refresh the workbench — does the org pill change?
> Whichever step fails first is where the bug is. Don't fix
> downstream symptoms; fix the first failing step."

---

## Pattern 12 — "Cost surge: dual-write or Cognee is expensive"

**Signal**: GCP billing shows unexpected line items after a v2
deploy.

**Cause**: Per-event Cognee calls without budget guards, or
Postgres reads firing more than estimated.

**Re-prompt**:

> "Audit the cost surge:
> (1) Cognee calls per day, per org — pull from the BigQuery
>     events table:
>     SELECT org_id, COUNT(*) FROM events WHERE event LIKE 'memory.%'
>     AND DATE(ts) = CURRENT_DATE() - 1 GROUP BY org_id;
> (2) Top 10 orgs by call count — anything anomalous?
> (3) Per-call cost estimate from Cognee logs.
> If a small number of orgs are responsible, tighten the rate limit
> for those orgs and exempt others. If usage is uniform but high,
> raise the rate limit and absorb cost; volume is what we want.
> Document findings in STATUS.md."

---

## When NONE of the patterns apply

Take a step back. The right question is rarely "what's the next
prompt to send" — it's "what's the smallest test that proves the
last claim was true."

Re-prompt:

> "Pause forward progress. Reproduce the last successful state:
> what was the last green diagnostic? Re-run it. If it now fails,
> we regressed somewhere — bisect. If it still passes, the issue
> is local to the new file. Show me the smallest reproducible
> failure. Don't speculate; reproduce."
