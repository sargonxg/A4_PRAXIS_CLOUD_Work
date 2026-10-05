# Codex: start from this extracted folder

This file is the portable entry point. You may read the kit from any folder the user gives you. Do not require the kit to be installed at a particular path before beginning.

## Read and locate

Resolve the actual directory containing this file as `kitRoot`; do not assume a Windows username, drive or path. Read `START_HERE.md`, `codex/CONTROLLER.md`, `research/README.md`, `research/RESEARCH_DECISIONS.md` and the active instructions governing your current working directory.

The product belongs in the existing `sargonxg/A4_PRAXIS_CLOUD_Work` PRAXIS repository, at `/signal`. This folder contains the complete design/build kit and a reference harness, not that private production repository. Locate the actual PRAXIS checkout using the user's supplied project path, current Git root and known accessible project locations. Do not scan an entire drive or invent an empty replacement application. If the repository cannot be located, ask for its local path while inspecting the kit and running its deterministic reference checks where possible.

## Establish the working boundary

Run Codex in the chosen PRAXIS checkout or an isolated worktree, with this extracted kit accessible. The supplied `scripts/Launch-SignalBuild.ps1 -RepositoryPath <actual-path>` launches that configuration using `--cd` and `--add-dir`. It does not copy files, create a branch, commit, install dependencies or deploy. If the current session lacks repository write access, provide that exact relaunch command; do not remove the sandbox to work around the boundary.

Read the repository's AGENTS.md chain and required architecture documents before modifying it. Inspect branch, commit and dirty state. Preserve unrelated changes. Use the existing feature worktree if supplied. Otherwise create a feature branch/worktree only after establishing an appropriate baseline and authorized write location. The separate preparation script can create an isolated worktree from a clean baseline. Never discard unfinished PRAXIS work to make setup pass.

## Install the instruction kit

Copy the kit into `docs/signal-build/` in the selected worktree if absent. Keep its relative layout, including research, code, fixtures, schemas and scripts. Exclude runtime databases, credentials and dependencies. If that destination already contains a previous kit, compare `RELEASE.json` and reconcile the update; preserve `docs/signal/PROGRESS.md`, implementation code and local user changes. The kit's AGENTS.md is scoped to its own folder. Do not copy it over the repository's root instructions.

Create or continue `docs/signal/PROGRESS.md`. Execute `codex/START_PROMPT.md` under the installed kit, beginning with phase 00 if no verified integration checkpoint exists. Follow the twelve phase prompts and their acceptance gates. Use the new research files in the phases named in `research/README.md`. The current repository's contracts and deployed capabilities govern exact implementation paths.

## Work through completion

Implement and test the text pilot through phases 00-08; targeted media is phase 09 and conditional on access. Prepare staging/release and operator handoff through phases 10-11. Keep evidence, proposals, reviewed knowledge and approved artifacts separate. Preserve global country selection, custom regions and multi-country theatres. Do not turn topic clusters or similarity into verified propaganda, intent or coordination.

Continue independent work when a credential or external source blocks a live check. Record which tests are fixture-only, blocked, staging or live. Review/deployment authorizations are distinct from code preparation. Do not claim production integration, live analytical quality or deployment from the reference package's tests.
