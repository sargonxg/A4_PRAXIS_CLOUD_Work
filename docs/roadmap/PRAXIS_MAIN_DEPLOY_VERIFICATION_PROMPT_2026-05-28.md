# PRAXIS Main + Deploy Verification Prompt - 2026-05-28

Use this prompt for the next Codex or Claude agent. It is intentionally operational: do not summarize from memory, prove the current state from Git, GitHub, Cloud Run, and live `praxis.tacitus.me`.

````text
We are in the PRAXIS repo:
C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work

Goal:
Audit and, if explicitly approved, complete the ship path for all PRAXIS work done today by Codex and Claude agents. Prove that every intended commit is on GitHub `main`, compatible with the current repo, deployed to Cloud Run, and actually serving on https://praxis.tacitus.me.

Important starting assumption:
Do not trust any previously remembered HEAD SHA. `main` moved multiple times today while agents were active. Re-read the live repo state first. As of this prompt draft, this checkout was on `main` and synced with `origin/main`, with observed HEAD `4aa6b22aa08f7574e9f50d687623022dd0cc0d41`, but that may already be stale.

No-touch constraints:
- Do not reset, checkout away, or delete other agents' work.
- Do not overwrite user changes or generated output without understanding it.
- Do not deploy until local gates and GitHub checks are green for the exact HEAD being deployed.
- Do not call the task done until Cloud Run traffic and live endpoint probes prove `praxis.tacitus.me` is serving the new revision.
- Treat older failed GitHub runs as superseded only if the latest runs for the exact current HEAD are green.

Phase 1 - Establish Repo And Agent State
Run from the repo root:

```powershell
git rev-parse --show-toplevel
git remote -v
git branch --show-current
git fetch origin main
git rev-parse HEAD
git rev-parse origin/main
git rev-list --left-right --count HEAD...origin/main
git status --short --branch
git worktree list --porcelain
git stash list
git log --all --since="2026-05-28 00:00:00 -0400" --oneline --decorate --graph
git branch --format="%(refname:short)" --sort=-committerdate
```

Also inspect active local agent/process activity:

```powershell
Get-Process | Where-Object { $_.ProcessName -match 'codex|claude|node|npm|pnpm|yarn|git|gcloud|pwsh|powershell' } |
  Select-Object Id,ProcessName,StartTime,Path |
  Format-Table -AutoSize
```

For each worktree from `git worktree list --porcelain`, check:

```powershell
git -C <worktree-path> status --short --branch
git -C <worktree-path> rev-parse --abbrev-ref HEAD
git -C <worktree-path> rev-parse HEAD
git -C <worktree-path> rev-list --left-right --count HEAD...origin/main
git -C <worktree-path> log --since="2026-05-28 00:00:00 -0400" --oneline --decorate -20
```

Record:
- Current local HEAD and `origin/main` HEAD.
- Whether local `main` is clean and synced.
- Any local branches/worktrees ahead of `origin/main`.
- Any uncommitted or untracked files from Codex/Claude agents.
- Any active agent/build/deploy process that may still be writing.

If there is any dirty tree or branch ahead of `origin/main`, stop and classify each item:
- intended ship work,
- generated artifact that must be refreshed and committed,
- local temp/cache/log file that should be ignored,
- unrelated/unsafe work requiring user confirmation.

Phase 2 - Confirm GitHub Main Contains The Day's Work
Use GitHub CLI against the current repo:

```powershell
gh repo view --json nameWithOwner,defaultBranchRef,url
gh run list --branch main --limit 25
gh api repos/sargonxg/A4_PRAXIS_CLOUD_Work/commits/main --jq .sha
```

Compare the remote main SHA to local:

```powershell
git ls-remote origin refs/heads/main
git rev-parse HEAD
git rev-list --left-right --count HEAD...origin/main
```

Review today's pushed commits:

```powershell
git log origin/main --since="2026-05-28 00:00:00 -0400" --oneline --decorate --reverse
git show --stat --oneline --decorate -1 origin/main
```

Expected commits today may include, but are not limited to:
- UI polish commits from other agents.
- PRAXIS simplification / agentic kernel commit(s).
- Surface polish verification fixes.
- Graphify refresh commits.
- Any later Codex/Claude commits after this prompt was written.

Do not rely on that list as complete. The source of truth is `git log origin/main --since`.

Phase 3 - Local Compatibility Gates
Run a fresh local gate set against the exact tree intended for deploy:

```powershell
git diff --check
npm run audit:simplification
npm run audit:capsule-v3
npm run audit:capsule-contract
npm run audit:capsule-memory-contract
npm run audit:graph-proposal-review-contract
npm run audit:cognee
npm run audit:genkit-runtime
npm run audit:agent-runtime-proof
npm run audit:ask-same-window-contract
npm run audit:agent-process-contract
npm run typecheck
npm run lint
npm run build
```

Run focused tests that cover the slices touched today:

```powershell
npx vitest run `
  tests/unit/simplification/visible-vocabulary-contract.test.ts `
  tests/unit/lib/agent-runtime/tool-registry.test.ts `
  tests/unit/lib/agent-runtime/status.test.ts `
  tests/unit/lib/agent-runtime/api-schema.test.ts `
  tests/unit/lib/ai/ask-answer-envelope.test.ts `
  tests/unit/lib/ai/ask-orchestrator.test.ts `
  tests/unit/components/tasklet-workbench-contract.test.ts `
  tests/unit/components/ask-source-preview-contract.test.ts `
  tests/unit/components/instrument-visual-contract.test.ts `
  tests/unit/app/api/conversations-turns-contract.test.ts `
  tests/unit/app/api/agent-run-retry-contract.test.ts `
  tests/unit/ci/verify-main-workflow.test.ts `
  tests/unit/scripts/auth-runtime-preflight.test.ts `
  tests/unit/scripts/deploy-main-cloudrun.test.ts
```

If credentials are present, run the authenticated/runtime lane:

```powershell
if ($env:TEST_FIREBASE_EMAIL -and $env:TEST_FIREBASE_PASSWORD) {
  npm run test:auth-runtime:agent
} else {
  Write-Host "SKIP: TEST_FIREBASE_EMAIL / TEST_FIREBASE_PASSWORD missing"
}
```

Known warning classes to record, not hide:
- `audit:genkit-runtime` may warn if live Google AI / Vertex env is absent.
- `audit:agent-runtime-proof` may warn if agent ledger, worker URL, OIDC/shared secret, or ADK env is absent.
- `npm run lint` may pass with existing warnings. Record count and whether any are new.
- `graphify update .` may skip HTML if the graph exceeds the node limit; that is not a build failure.

If any gate fails:
- Re-run once after `git status --short` to rule out concurrent edit drift.
- Inspect the exact failing line.
- Fix only the root cause.
- Re-run the relevant focused test/audit and then the full gate subset.
- Do not deploy with red local gates.

Phase 4 - Refresh Generated Artifacts Deliberately
If source files changed since the last graphify output:

```powershell
graphify update .
git status --short
```

If `graphify-out/GRAPH_REPORT.md`, `graphify-out/graph.json`, or `graphify-out/manifest.json` changed, inspect the stat and commit those generated artifacts with the code they describe, unless the repo policy has changed.

Phase 5 - Commit/Push Discipline
Only after local gates pass:

```powershell
git status --short --branch
git fetch origin main
git rev-list --left-right --count HEAD...origin/main
```

If behind, rebase or merge conservatively, then rerun affected gates. If ahead and clean:

```powershell
git push origin main
```

After push:

```powershell
git fetch origin main
git rev-list --left-right --count HEAD...origin/main
git status --short --branch
gh run list --branch main --limit 20
```

Wait for the latest `verify-main` and `persona-smoke` runs for the exact current `HEAD` SHA:

```powershell
$head = git rev-parse HEAD
gh run list --branch main --limit 20
gh run view <run-id> --json conclusion,status,headSha,name,displayTitle,url
```

Acceptance:
- `headSha` equals `$head`.
- `status` is `completed`.
- `conclusion` is `success`.
- Older failed runs are documented as superseded only if their `headSha` is not current.

Phase 6 - Deploy To Cloud Run
Do not deploy until:
- local gates passed,
- `origin/main` equals local HEAD,
- GitHub checks for that exact HEAD are green,
- user/deployment approval is explicit for this run.

First identify the deploy path in repo:

```powershell
Select-String -Path package.json -Pattern "deploy:frontend|cloudrun|cloud"
Get-ChildItem -Path . -Filter "*cloudbuild*" -Recurse
Get-ChildItem -Path scripts -Filter "*deploy*" -Recurse
```

Preferred deploy path if still valid:

```powershell
npm run deploy:frontend:cloud
```

If a PowerShell deploy script is the active path, inspect it first:

```powershell
Get-Content scripts/deploy-main-cloudrun.ps1 -TotalCount 240
```

Then run only the approved deploy command.

Record:
- deploy command,
- Cloud Build ID if used,
- image name,
- image digest,
- Cloud Run service,
- region,
- latest ready revision,
- traffic split.

Phase 7 - Cloud Run Revision And Image Proof
Resolve gcloud:

```powershell
if ($env:GCLOUD_BIN) { & $env:GCLOUD_BIN version } else { gcloud version }
```

Verify service state. Adjust project/region only if repo config proves different:

```powershell
$project = "praxisbytacitus"
$region = "us-central1"
$service = "praxis-frontend"
$gcloud = if ($env:GCLOUD_BIN) { $env:GCLOUD_BIN } else { "gcloud" }

& $gcloud run services describe $service --project $project --region $region --format=json
& $gcloud run services describe $service --project $project --region $region --format="value(status.latestReadyRevisionName)"
& $gcloud run services describe $service --project $project --region $region --format="table(status.traffic.revisionName,status.traffic.percent,status.traffic.tag)"
& $gcloud run revisions list --service $service --project $project --region $region --limit 5
```

For the serving revision receiving traffic, inspect image and annotations:

```powershell
$revision = & $gcloud run services describe $service --project $project --region $region --format="value(status.traffic[0].revisionName)"
& $gcloud run revisions describe $revision --project $project --region $region --format=json
```

Strong proof:
- Match Cloud Build image digest to the Cloud Run serving revision digest.
- If the app exposes commit SHA in health output or env labels, match it to `git rev-parse HEAD`.
- If it does not expose commit SHA, record that as a gap and use image/revision/build digest evidence.

Phase 8 - Live `praxis.tacitus.me` Probes
Run unauthenticated probes and record status, body summary, and timing:

```powershell
$urls = @(
  "https://praxis.tacitus.me/",
  "https://praxis.tacitus.me/login",
  "https://praxis.tacitus.me/api/health",
  "https://praxis.tacitus.me/api/health/runtime",
  "https://praxis.tacitus.me/api/health/agentic-search",
  "https://praxis.tacitus.me/api/app/search?q=test"
)

foreach ($url in $urls) {
  try {
    $start = Get-Date
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 30
    $elapsed = ((Get-Date) - $start).TotalMilliseconds
    [PSCustomObject]@{
      Url = $url
      Status = [int]$response.StatusCode
      Ms = [math]::Round($elapsed)
      Length = $response.Content.Length
      Preview = $response.Content.Substring(0, [Math]::Min(240, $response.Content.Length))
    }
  } catch {
    $resp = $_.Exception.Response
    [PSCustomObject]@{
      Url = $url
      Status = if ($resp) { [int]$resp.StatusCode } else { "NO_RESPONSE" }
      Error = $_.Exception.Message
    }
  }
}
```

Expected:
- `/` and `/login` return 200 and render PRAXIS content.
- `/api/health`, `/api/health/runtime`, `/api/health/agentic-search` return healthy/ready summaries.
- `/api/app/search?q=test` may return 401 if unauthenticated; that can be correct if protected. Record it explicitly instead of treating it as a failure.

If browser validation is needed, use the in-app browser or Playwright to check:
- homepage loads without console errors,
- login page loads,
- normal app navigation preserves Home + Capsules primary surface,
- Ask PRAXIS visible vocabulary is simplified,
- Capsules page loads,
- no obvious hydration/runtime exceptions.

Phase 9 - Authenticated Runtime Proof If Env Exists
If `TEST_FIREBASE_EMAIL` and `TEST_FIREBASE_PASSWORD` exist:

```powershell
npm run test:auth-runtime:agent
```

Also run any existing live runtime health audit if configured:

```powershell
npm run audit:runtime-health-live
```

If these are missing, record as a gap:
`Authenticated runtime lane was not executed because TEST_FIREBASE_EMAIL / TEST_FIREBASE_PASSWORD were not available in this shell.`

Phase 10 - Final Report Format
Produce a concise but complete report with these sections:

1. Repo Identity
- path,
- remote,
- branch,
- current HEAD,
- `origin/main` SHA,
- ahead/behind count,
- worktree cleanliness.

2. Today Commit Inventory
- all commits on `origin/main` since 2026-05-28 00:00 America/New_York,
- which agents/slices they appear to represent,
- any local branches/worktrees/stashes with unpushed work.

3. Local Gates
- command,
- pass/fail,
- warning count,
- exact failure and fix if any.

4. GitHub Gates
- latest `verify-main` run URL/conclusion/headSha,
- latest `persona-smoke` run URL/conclusion/headSha,
- any superseded failed runs and why they are superseded.

5. Deploy Proof
- deploy command,
- Cloud Build ID,
- image digest,
- Cloud Run service/revision,
- traffic split,
- evidence that the deployed revision corresponds to the intended GitHub HEAD.

6. Live `praxis.tacitus.me` Proof
- endpoint statuses,
- health body summaries,
- auth/protected route expectations,
- screenshots or browser notes if run.

7. Gaps / Issues / Follow-Ups
Explicitly call out:
- missing auth test credentials,
- missing Genkit/Vertex/model env,
- missing agent ledger/worker/OIDC env,
- any lint warnings that remain,
- graphify HTML visualization skipped due graph size,
- inability to match deployed revision to exact commit if no SHA/digest label exists,
- any still-active agents or worktrees with uncommitted work,
- any Cloud Run traffic not fully on latest ready revision.

8. Final Verdict
Use one of:
- `READY: all intended work is on GitHub main, checks are green, deployed revision is serving praxis.tacitus.me.`
- `NOT READY: ...` with the smallest exact blocker list.

Do not say READY unless every checkpoint above has evidence.
````
