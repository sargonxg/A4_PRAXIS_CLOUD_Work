# MCP and access: keep the first setup small

## Required capabilities

Codex needs a read/write PRAXIS checkout, shell/test tools and the current repository instructions. Git plus the repository's test runner are sufficient for phases 00-03 with fixtures. GDELT is an application HTTP collector; it does not require an MCP server. The graph is a product projection; it does not require a Neo4j MCP connection.

Reuse the application's existing Vertex/model gateway for deployed analysis. Coding-agent authentication and product inference authentication are separate. The kit makes no request to switch production to OpenAI or introduce a second paid provider.

## Recommended documentation MCP

The official OpenAI documentation MCP is read-only and useful for Codex setup or an eventual OpenAI adapter. Add it if absent: [1]

```powershell
codex mcp add openaiDeveloperDocs --url https://developers.openai.com/mcp
codex mcp list
```

For a trusted project config, the equivalent additive snippet is in `config.signal.example.toml`. Merge the snippet into your existing config; do not overwrite a working file. This MCP does not run product inference. Use official Google, GDELT and platform documentation for their adapters.

## Optional tools

| Tool | Add when | Simpler starting alternative |
| --- | --- | --- |
| Browser/Playwright MCP | Interactive inspection speeds up UI debugging | Existing repository Playwright tests and screenshots |
| GitHub plugin/MCP | Codex must inspect CI or prepare PRs through tools | Git and an existing authorized GitHub CLI |
| Sentry read access | A staging failure needs production-style traces | Structured worker logs and local test output |
| PRAXIS's existing MCP | The domain must become accessible from its established tool plane | Implement the app's shared server-side services first |

Do not install an unverified latest browser MCP just to satisfy this list. Prefer the installed browser capability or existing Playwright version. If an MCP becomes necessary, use its maintainer's current instructions, pin the chosen version, limit its working directory/account scope and verify a harmless read operation. No optional tool above is a prerequisite for the text pilot.

## Access checkpoints

| Phase | Access needed for live proof | Fixture work that remains possible without it |
| --- | --- | --- |
| 00-02 | Test auth or emulator; authorized dev storage | Contracts, UI states and isolated storage tests |
| 03 | GDELT and configured permitted feeds | Pagination, saturation, revisions and failure tests |
| 04-06 | Existing calibrated model gateway and test budget | Validation, review, capsule adapters and templates |
| 07-08 | Staging queue/scheduler and metrics | Retry/idempotency tests and cost dashboards |
| 09 | Rights to input media and enabled provider modalities | Locator validators and synthetic media fixtures |
| 10 | Staging deployment identity, then separate production authority | Release manifest, smoke plan and rollback preparation |

Secret values belong in the repository's approved local secret store, Cloud vault or GCP secret/identity setup. A checked-in `.env.example` can list names and descriptions only. Do not place secrets in coding prompts, MCP arguments, source packs, capsules or progress files.

## Future SIGNAL tools

After the shared domain services work, expose read-oriented tools through the existing PRAXIS tool/MCP plane if useful: `signal.list_desks`, `signal.search_evidence`, `signal.get_narrative`, `signal.get_assessment_delta` and `signal.export_approved_brief`. Bind the tenant/user from authenticated tool context. Limit result counts and locator payloads; obey artifact rights. A write tool such as proposal creation needs explicit validation and the same review workflow. No MCP tool may approve its own model proposal or bypass a user's access.

[1] [OpenAI Docs MCP](https://developers.openai.com/learn/docs-mcp), checked 5 October 2026.
