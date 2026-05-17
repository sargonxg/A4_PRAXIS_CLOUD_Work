# Codex Tooling Audit - 2026-05-17

Scope: Codex and connected tooling used for PRAXIS coding sessions in
`C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work`.

## Update Results

- Codex stable: `codex-cli 0.130.0`.
- npm registry `@openai/codex@latest`: `0.130.0`.
- npm registry `@openai/codex@alpha`: `0.131.0-alpha.22`.
- Side-by-side alpha install: `C:\Users\giuli\AppData\Local\codex-alpha`, running `codex-cli 0.131.0-alpha.22`.
- Ran `codex update`; it completed successfully and remained on the current stable version.
- Updated global CLI tools used by PRAXIS sessions:
  - `npm` `11.14.1`
  - `firebase-tools` `15.18.0`
  - `vercel` `54.1.0`
  - `agent-browser` `0.27.0`
  - `firecrawl-cli` `1.17.1`
  - `eslint` `10.4.0`
  - `@commitlint/cli` `21.0.1`
  - `codeburn` `0.9.9`
- `npm outdated -g --depth=0` is clean after the update.

Windows left locked temporary cleanup directories for prior `agent-browser` and
`@openai/codex` binaries while this Codex session was active. The actual command
versions verified successfully.

## Codex Configuration

Active user config: `C:\Users\giuli\.codex\config.toml`.

- Model default: `gpt-5.5`
- Reasoning effort: `medium`
- Approval policy: `never`
- Sandbox mode: `danger-full-access`
- Windows sandbox: `elevated`
- Features enabled:
  - `terminal_resize_reflow`
  - `memories`
  - `prevent_idle_sleep`
  - `multi_agent`

Trusted PRAXIS project entry exists for:
`c:\users\giuli\antigravity\praxismay2026\a4_praxis_cloud_work`.

## MCP Servers

Configured through `codex mcp list`:

| Name | Transport | Target | Status | Auth |
| --- | --- | --- | --- | --- |
| `firebase` | `npx` | `firebase-tools@latest mcp --dir C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work --only core auth firestore storage` | enabled | unsupported |
| `openaiDeveloperDocs` | remote MCP | `https://developers.openai.com/mcp` | enabled | unsupported |
| `parallel-search` | remote MCP | `https://search-mcp.parallel.ai/mcp` | enabled | bearer token via `PARALLEL_API_KEY` |

`PARALLEL_API_KEY` is set in the current shell environment.

## Agents

Codex multi-agent support is enabled. Configured roles in
`C:\Users\giuli\.codex\config.toml`:

- `explorer` -> `agents/explorer.toml`
- `reviewer` -> `agents/reviewer.toml`
- `docs_researcher` -> `agents/docs-researcher.toml`

The user-level agent library exists at `C:\Users\giuli\.codex\agents` and was
last refreshed on 2026-05-17.

## Skills And Plugins

User-level Codex skills:

- Main skill directory: `C:\Users\giuli\.codex\skills`
- Most skills were refreshed on 2026-05-17.
- Legacy `graphify` skill exists under `C:\Users\giuli\.agents\skills`.

Curated Vercel plugin cache:

- Path: `C:\Users\giuli\.codex\plugins\cache\openai-curated\vercel\dc902811\skills`
- Last refreshed: 2026-05-16.
- Includes Next.js, Vercel CLI/API/deployments/env-vars/functions/storage,
  shadcn, AI SDK, AI Gateway, agent-browser, verification, workflow, and related
  Vercel skills.

`codex plugin marketplace upgrade` does not apply to this curated cache because
it is not configured as a Git marketplace.

## Cloud And Repo Tooling

Verified installed tools:

- Node.js `v24.12.0`
- npm `11.14.1`
- Git `2.52.0.windows.1`
- GitHub CLI `2.90.0`
- Google Cloud SDK `568.0.0`
- Firebase CLI `15.18.0`
- Vercel CLI `54.1.0`
- Playwright `1.59.1`

Not installed on PATH:

- `pnpm`
- `yarn`
- `bun`

This repo uses npm scripts, so those missing package managers are not blockers.

## Auth Health

Working:

- `gh auth status`: logged in as `sargonxg`.
- `vercel whoami`: logged in as `sargonx646`.
- `gcloud auth list`: active account `giulio@tacitus.me`.
- `gcloud` project access to `praxisbytacitus`: OK.
- `npm run audit:gcp`: passed with 0 hard failures and 1 soft scheduler warning.

Needs human browser reauth:

- `gcloud auth application-default print-access-token` cannot refresh ADC in this
  non-interactive session.
- `npm run auth:doctor` fails only at Application Default Credentials refresh.
- `firebase projects:list --json` fails because Firebase credentials are no
  longer valid and asks for `firebase login --reauth`.

Repair commands:

```powershell
gcloud auth login --update-adc
gcloud auth application-default login --project=praxisbytacitus
gcloud auth application-default set-quota-project praxisbytacitus
firebase login --reauth
npm run auth:doctor -- --fix
```

## PRAXIS Repo Commands Codex Uses Most

Development:

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run typecheck`
- `npm run lint`
- `npx vitest run`
- `npx playwright test ...`

Repo and architecture audits:

- `npm run audit:repo-shape`
- `npm run audit:gate`
- `npm run audit:architecture-reference`
- `npm run audit:architecture-chain`
- `npm run audit:gcp`
- `node scripts/audit-ai-routes.mjs`
- `graphify update .`

Cloud and deploy:

- `npm run auth:doctor`
- `gcloud builds submit --config=cloudbuild.frontend.yaml --project=praxisbytacitus`
- `npm run deploy:frontend:cloud`
- `firebase ...` through CLI and MCP after reauth

## Current Readiness

Codex and global CLI tools are updated. MCP configuration points at the correct
PRAXIS checkout. Cloud runtime audit passes. The only operational blockers found
are human-interactive Firebase reauth and GCP Application Default Credentials
reauth.
