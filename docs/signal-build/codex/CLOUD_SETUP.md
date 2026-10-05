# Codex Cloud alternative

## Choose Cloud when it helps

Cloud is useful for a repeatable Linux checkout, unattended build tasks and a reviewable branch/PR workflow. Start locally if your current auth, staging tools or unfinished PRAXIS changes exist only on the laptop. Use the same committed kit and progress file on either platform; do not maintain divergent specifications.

No Codex Cloud environment was created in this conversation. This environment's tools do not expose account-side Codex Cloud environment provisioning. The setup below is the concrete handoff for creating it in your account. Availability and repository permissions depend on that account.

## Account setup

In Codex, choose **Work in > Cloud**, then create an environment. Alternatively, use **Settings > Codex Cloud > Environments**. Select `sargonxg/A4_PRAXIS_CLOUD_Work`; connect GitHub if requested. Review the prepared configuration and publish the development environment after setup checks pass. This follows the current official setup flow. [1]

Name it `PRAXIS SIGNAL development`. Keep it private initially. Put the kit on the feature branch at `docs/signal-build/`. Ensure the task uses that branch and can read the kit; if branch selection differs in your client, verify `git rev-parse HEAD` and the kit path before any implementation. An environment prepared from a different branch does not magically contain your local ZIP.

## Paste this environment preparation request

> Prepare this existing PRAXIS repository for SIGNAL development. Read its AGENTS.md chain and required architecture documents, then docs/signal-build/codex/CLOUD_SETUP.md and docs/signal-build/codex/phases/00_REPOSITORY_AUDIT.md. Determine the runtime and package manager from the current checkout and lockfile. Install locked dependencies without changing the lockfile, run relevant baseline typecheck/lint/tests and establish an authenticated test or emulator lane. Use the existing Playwright test setup; install only its required browser/system dependencies. Record the tested install commands and a startup procedure that starts the app and checks readiness. Do not deploy or connect to production data. Begin with deterministic fixture tests; list missing staging/auth/provider access without printing secrets. Confirm the feature branch contains docs/signal-build. Provide a setup report with exact commands, failures and required configuration. Keep the environment private.

Use the generated install/start fields in the current environment editor. Do not blindly paste an old universal setup script. The existing package manifest inspected for the kit contains `typecheck`, `lint`, `test`, `build` and Playwright lanes, but Codex must verify them against its checkout.

## Network and access

For deterministic development, enable package registry access and the official documentation domains needed for the phase. For source smoke tests add `api.gdeltproject.org` and specific configured feed domains. For model or staging integration add only the endpoints and identity required by the repository's existing adapters. Record actual allowed destinations in the setup report.

Use environment configuration for non-secret flags and supported secret/vault mechanisms for credentials. Current Cloud documentation distinguishes directly supplied variables from HTTPS network secrets. Pick the delivery mode that the existing SDK actually supports; a Google credential used to sign requests is not interchangeable with a substituted header placeholder. Never commit credentials or expose them in logs. [1]

Do not grant production database mutation or production deployment access to make the basic development environment work. A staging identity and segregated test data are sufficient. External platform collection entitlements remain separate from developer environment access.

## First Cloud task

After the environment is published, create a task on the feature branch and paste `codex/START_PROMPT.md`. Execute phase 00, then each phase in order. Make each phase's code and progress available through the repository's review workflow before the next independent Cloud task; new tasks do not inherit another task's uncommitted work.

For a task that ended midway, paste `RESUME_PROMPT.md` into its continuation, or start a new task from the committed checkpoint. Verify the current revision. Environment snapshots and caches do not replace source control.

Cloud is a development environment. SIGNAL production still uses the existing PRAXIS deployment at `praxis.tacitus.me/signal`; phase 10 supplies its staging and release gates.

[1] [Cloud environments](https://learn.chatgpt.com/docs/environments/cloud-environments), checked 5 October 2026.
