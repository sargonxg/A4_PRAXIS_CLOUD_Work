# Cognitive CLI and MCP

The CLI and stdio MCP server use the same authenticated PRAXIS API as the
workbench. Set `PRAXIS_BASE_URL`, `PRAXIS_AUTH_ORIGIN` to the exact same origin,
and `PRAXIS_SESSION` to the encoded signed `tacitus-auth-session` cookie from
your own session. Keep session values out of shell history, config files and
logs. A raw Firebase token is not accepted. HTTPS is required except localhost;
redirects are rejected. API ownership and download rights remain authoritative.

Run `npx tsx cli/praxis.ts help` for command syntax. Existing `capsule` commands
operate on local files and the local registry; `cognition` and `registry`
commands use the hosted service. Registry scope is owner-private. Native pulls
validate archive structure, manifest digests and the hosted artifact digest
before writing a new file. Outputs never overwrite an existing target.

```text
npx tsx cli/praxis.ts cognition inspect CAPSULE_ID
npx tsx cli/praxis.ts cognition history CAPSULE_ID
npx tsx cli/praxis.ts cognition diff CAPSULE_ID --from v1 --to v2
npx tsx cli/praxis.ts cognition export CAPSULE_ID --output saved.capsule --allow-write
npx tsx cli/praxis.ts cognition propose CAPSULE_ID --input proposal.json --allow-write
npx tsx cli/praxis.ts cognition review CAPSULE_ID --input decision.json --allow-write --human-review
npx tsx cli/praxis.ts registry list
npx tsx cli/praxis.ts registry publish CAPSULE_ID --envelope-version 2 --name owner/example --allow-write
npx tsx cli/praxis.ts registry pull owner/example 1.0.0 --output example.capsule --allow-write
npx tsx cli/praxis.ts registry install owner/example 1.0.0 --allow-write
npx tsx cli/praxis.ts registry update owner/example 1.1.0 --expected-digest sha256:PREVIOUS_DIGEST --allow-write
npx tsx cli/praxis.ts registry impact owner/example 1.0.0
```

Proposal JSON follows the cognition capture API (`kind`, `label`, `scope`,
`body` and the kind-specific fields). Decision JSON contains `reviewCardId`,
`decision`, `reason` and optionally `edited` for `edit_accept`. A named human
must inspect the proposed changes before invoking the human-review command.

To approve part of a grouped proposal, decision JSON can include `selectedRecordIds`,
`selectProfile`, and the current `expectedCapsuleVersion`. Explicit selection requires
that version. The server validates every selected ID against the pending card and
records the exact approved scope. Unselected records remain proposed; the card is
rebased for further human review. Reload its inventory before another decision.
An inherited `needs_review` record still requires explicit human editing before
acceptance; selecting it cannot bypass the completeness check.
`edit_accept` approves exactly the edited record and never approves a profile or
another record implicitly. After any partial approval, every decision on the
rebased card requires the current version, including rejection and requests for
evidence. Those latter decisions affect the remaining proposal as a whole.
Installed registry versions create review targets; installation does not
accept knowledge or grant tool permissions.

Start the local MCP transport with `npx tsx cli/mcp.ts`. Configure its environment
through a protected process environment. The default tool list contains reads:
capsule search, inspection, role views with compilation receipts, exact evidence,
registry listing/impact/artifact and run receipts. Search covers one paginated
owner inventory page and exposes the continuation cursor. Pass a cursor to
continue. Native artifacts are bounded to the package archive limit.

An operator can start `npx tsx cli/mcp.ts --allow-write` to additionally expose
model proposals and private registry publish/install/update/deprecate. The API
stamps external model proposals as unverified model authorship and queues them
for review. The MCP server has no accept, promotion, run-start or external-send
tool. Its write flag cannot authorize those actions. Model output remains
analysis or a proposal; structural validation and compiler receipts do not
establish factual truth.
