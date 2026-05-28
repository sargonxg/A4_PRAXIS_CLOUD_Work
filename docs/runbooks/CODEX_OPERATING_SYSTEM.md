# Codex Operating System

This runbook defines how Codex should be used on PRAXIS.

## Modes

### Diagnose

Purpose: understand state without changing it.

Use when the user asks for audit, review, architecture mapping, cloud diagnosis, or production status.

Default commands:

```powershell
git status --short --branch
git log --oneline -5
& "$HOME\.codex\scripts\codex-ready.ps1" -Repo . -Mode quick -SkipNetwork
```

Expected roles: `repo_cartographer`, `explorer`, `cloud_ops_auditor`, `frontend_qa`.

Launch:

```powershell
codex -C "C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work" --profile diagnose
```

### Build

Purpose: make scoped local changes with tests.

Use when the user asks to implement, fix, refactor, or improve a bounded behavior.

Default commands:

```powershell
npm run typecheck
npm run test
```

Add Playwright, audit, or browser checks when the change touches UI, runtime, auth, or routing.

Expected roles: `explorer`, `docs_researcher`, `reviewer`, `frontend_qa`.

Launch:

```powershell
codex -C "C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work" --profile build
```

### Ship

Purpose: move a validated checkpoint to production and prove it is serving.

Use only when the user asks to commit, push, deploy, or make production current.

Required evidence:

- Branch sync against `origin/main`.
- Dirty tree review.
- Local validation commands.
- Commit hash.
- Cloud Build id.
- Cloud Run revision and traffic.
- Live URL probes.

Expected roles: `release_manager`, `cloud_ops_auditor`, `frontend_qa`, `reviewer`.

Launch:

```powershell
codex -C "C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work" --profile ship
```

## MCP Task Profiles

### Daily

Use for ordinary coding:

- GitHub
- Context7
- Memory
- Playwright
- Sequential Thinking
- Serena

### Cloud

Use for deploy/runtime/auth:

- Firebase MCP
- Cloudflare MCP
- Google Developer Knowledge MCP
- gcloud CLI
- Firebase CLI

### Research

Use for API docs, product/market research, and current information:

- Exa
- Parallel Search
- OpenAI Developer Docs
- Context7

### Frontend

Use for browser-visible work:

- Browser plugin
- Playwright MCP
- node_repl
- screenshots

## External Action Rule

Search, inspect, and draft freely within the requested scope. Require explicit user approval before pushing, deploying, merging, publishing, opening paid jobs, changing credentials, changing IAM, or mutating third-party services.
