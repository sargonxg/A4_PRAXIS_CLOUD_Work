# Windows PowerShell setup

## Why start locally

Your existing PRAXIS repository and authorized development setup are the best first integration environment. Codex can inspect the actual checkout and run its tools there. Native Windows/PowerShell execution is supported; WSL is an alternative if this repository's dependencies require Linux. [1]

These commands are prepared for your laptop. They have not been executed on Windows here. The Node reference harness and its HTTP journey were tested on Linux. Keep the kit's architecture and prompts the same if you choose WSL or Cloud.

## Fast path from any extraction folder

Locate the folder containing `BOOTSTRAP.md` after extraction. Start Codex against your existing checkout while granting access to the kit:

```powershell
& "C:\path\to\PRAXIS_SIGNAL_Build_Kit\scripts\Launch-SignalBuild.ps1" `
  -RepositoryPath "C:\path\to\A4_PRAXIS_CLOUD_Work"
```

This launcher resolves its own kit location, uses `--cd` and `--add-dir`, and asks Codex to follow `BOOTSTRAP.md`. It performs no Git mutation or copying itself. The additional directory is a workspace-write grant to the kit, not a read-only mount. If you prefer to create the isolated worktree explicitly first, use the steps below and pass that worktree to the launcher.

## 1 Check tools

Use Git and the Node version required by the current repository. The separate reference harness requires Node 22.13 or newer; Node 24.19.0 was used for its tests. If you need installers, use [Git for Windows](https://git-scm.com/download/win) and [Node.js](https://nodejs.org/en/download). Reopen PowerShell after installation.

```powershell
git --version
node --version
npm.cmd --version
```

Install or update Codex with the official npm package, then sign in. If already installed and working, retain your existing installation. [2,3]

```powershell
npm.cmd install -g @openai/codex@latest
codex --version
codex login
```

If PowerShell blocks an npm-created `codex.ps1`, use `codex.cmd` for these commands. This avoids changing your machine's execution policy just to run the CLI. Select ChatGPT sign-in if that is how you use Codex. Product inference in deployed SIGNAL is a separate provider/billing setup; your coding login does not configure Vertex or an application API key.

## 2 Get the real repository

Use your existing local PRAXIS checkout. Replace `C:\src\A4_PRAXIS_CLOUD_Work` below with its actual path. Do not clone over an existing directory.

If you do not have a checkout, authenticate to GitHub with your normal Git credentials, then clone into an empty destination:

```powershell
git clone https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git C:\src\A4_PRAXIS_CLOUD_Work
```

Check the branch, working tree and remote. Choose a baseline that includes the PRAXIS work you intend to build on. `git fetch origin` updates remote references; it does not merge them into your working branch.

```powershell
Set-Location C:\src\A4_PRAXIS_CLOUD_Work
git status --short
git branch --show-current
git remote -v
git fetch origin
```

If the existing tree is dirty, checkpoint or resolve your intended changes using your normal workflow. Do not run `reset --hard` or discard changes to satisfy this guide. The preparation script refuses a dirty tree so it cannot silently build from a baseline that omits your work.

## 3 Prepare the isolated worktree

Extract `PRAXIS_SIGNAL_Build_Kit.zip` to any destination. It contains one top-level folder named `PRAXIS_SIGNAL_Build_Kit`; locate the resulting folder containing `BOOTSTRAP.md`. The example below assumes that actual kit root is `C:\Downloads\PRAXIS_SIGNAL_Build_Kit`. The script lives inside its `scripts` directory. It creates a new branch/worktree, copies the kit into `docs/signal-build/`, and leaves the root AGENTS.md intact. It does not install app packages, commit, push, alter secrets or deploy.

```powershell
& C:\Downloads\PRAXIS_SIGNAL_Build_Kit\scripts\Prepare-SignalWorktree.ps1 `
  -RepositoryPath C:\src\A4_PRAXIS_CLOUD_Work `
  -WorktreePath C:\src\PRAXIS_SIGNAL `
  -BranchName feature/praxis-signal `
  -BaseRef HEAD
```

Use `-BaseRef origin/main` only when you have inspected that baseline and want to start there. A branch/worktree name that already exists is not overwritten. If you already have a suitable clean worktree, manually copy the kit into its `docs/signal-build/` folder instead of creating another one.

If your policy blocks the downloaded preparation script, review its plain-text contents and unblock that specific downloaded file if appropriate for your machine. You can also execute its documented Git/copy steps manually. Do not globally disable execution controls.

## 4 Start the first build session

```powershell
Set-Location C:\src\PRAXIS_SIGNAL
codex --sandbox workspace-write --ask-for-approval on-request
```

Paste the complete text from `docs/signal-build/codex/START_PROMPT.md`. Begin with phase 00. It reads the actual repository instructions, installs dependencies with the current lockfile when appropriate, records the baseline and identifies where SIGNAL belongs. Do not pre-empt that audit by introducing a new framework or copying the reference server into the app route.

For subsequent sessions, use the launcher or paste a phase prompt yourself:

```powershell
& .\docs\signal-build\scripts\Start-SignalPhase.ps1 -Phase 01
```

For a noninteractive phase after setup is verified:

```powershell
& .\docs\signal-build\scripts\Start-SignalPhase.ps1 -Phase 01 -NonInteractive
```

The launcher asks Codex to read the prompt file rather than passing a huge document through PowerShell arguments. It preserves default sandbox restrictions. Noninteractive work may record a blocked network or permission check; use an interactive session for setup that requires you to approve or authenticate a tool.

## 5 Resume and check progress

Start Codex from the same worktree and paste `RESUME_PROMPT.md`. `docs/signal/PROGRESS.md` is the durable source of what passed and what is next. CLI session memory is convenient, but repository files preserve the handoff across machines. Use focused Git checkpoints after phases; inspect the diff and use the repository's normal branch/PR workflow.

If you want Cloud next, commit the kit and progress on the feature branch and push that branch through your normal authorized workflow. Never add `.env`, service-account JSON, provider keys, local SQLite data or customer documents to that commit.

## Official references checked 5 October 2026

[1] [Windows sandbox](https://learn.chatgpt.com/docs/windows/windows-sandbox)

[2] [Official Codex installation example](https://developers.openai.com/cookbook/examples/codex/using_goals_in_codex)

[3] [Codex CLI](https://learn.chatgpt.com/docs/codex/cli)

[4] [Developer commands](https://learn.chatgpt.com/docs/developer-commands?surface=cli)
