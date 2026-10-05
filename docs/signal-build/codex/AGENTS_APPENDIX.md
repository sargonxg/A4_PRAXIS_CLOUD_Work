# Optional SIGNAL pointer for the existing root AGENTS.md

Do not replace root AGENTS.md or create AGENTS.override.md. After reading the existing instruction chain, Codex may append this short pointer if it fits the repository's documentation policy:

```markdown
## PRAXIS SIGNAL

For work on `/signal`, read `docs/signal-build/codex/CONTROLLER.md` and
`docs/signal/PROGRESS.md`, then the current phase under
`docs/signal-build/codex/phases/`. Preserve this repository's canonical
auth, model, capsule, evidence, worker and deployment contracts. The kit's
local SQLite harness is a reference, not production infrastructure.
Keep source-bound proposals separate from reviewed knowledge, bind reviews
to exact revisions, and expose coverage and verification limits honestly.
When working on Codex or OpenAI integrations, consult the official OpenAI
documentation MCP if configured, otherwise official documentation.
```

Codex loads instruction files through an ancestry chain; a file nested in `docs/signal-build/` is not automatically a repository-wide instruction. The start and phase prompts explicitly ask it to read the controller, so the pointer is convenient rather than required. [1]

[1] [AGENTS.md instruction discovery](https://learn.chatgpt.com/docs/agent-configuration/agents-md), checked 5 October 2026.
