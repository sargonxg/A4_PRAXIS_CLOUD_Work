# Codex Orchestration Playbook

Date: 2026-05-06
Pack: 14 Production Excellence

Codex work on PRAXIS follows the same production loop as the master charter: read and report, propose the concrete slice, execute in scoped commits, then verify with audits and browser evidence.

## Five Patterns

1. Typed schema boundaries: subagents and scripts exchange Zod, Pydantic, JSON Schema, or explicit JSON contracts. Free-form prose is allowed inside artifacts, not between execution layers.
2. Worktree isolation: parallel agents use separate git worktrees or disjoint file ownership. No agent resets or reverts another agent's work.
3. Critic loop: broad slices get a review pass focused on regressions, missing tests, auth, data loss, and production truthfulness before commit.
4. Demo-driven development: user-critical flows get Playwright evidence first or immediately after implementation. HTTP 200 is not sufficient.
5. MCP/tool continuity: durable prompts, audit ledgers, graphify outputs, and startup docs keep Codex, Claude Code, and future agents aligned.

## PRAXIS Gates

- Confirm repo path and remote before repo-level work.
- Preserve prompt packs in `docs/codex-prompts/`.
- Update `docs/backlog/2026-05-06-master-charter-completion-todo.md` when a gap changes state.
- Run the smallest relevant audit first, then broader gates.
- Keep owner-gated items explicit. Terraform apply, canary promotion, production load tests, and launch signature are not simulated.

## Handoff Format

Every large pass should end with:

- Commit hash and branch.
- Verification commands and results.
- Any blocked gates with exact cause.
- Live app evidence when production was touched.
- Next runnable slice.
