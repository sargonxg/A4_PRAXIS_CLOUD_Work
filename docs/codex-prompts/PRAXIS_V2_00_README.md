# PRAXIS V2 Work Pack — institutional-grade foundations

## What this is

The night pack delivered an **honest single-user app**: one analyst, one
account, one set of cases. Real institutional procurement (UN missions,
INGOs, foundations, government agencies) requires more: shared
workspaces with roles, an auditable knowledge graph, durable memory,
production observability.

This pack closes those gaps across four sessions. Each session is one
night of focused Codex work. Run them in order — later sessions assume
earlier ones shipped.

## Pre-condition

The night pack must be **shipped and green** before this pack starts.
Specifically: `audit:gate` passes, `STATUS.md` shows night-pack tasks as
`done` or explicitly `deferred`, no Cognee/marketplace UI lies, and the
calibration invariant is enforced by audit. If any of those is not true,
finish the night pack first.

## Session map

### Session A — Multi-tenant foundations (~1 night)

The product story today is "team workspace for analysts." The code
today is "owner-scoped single-user app." Closing this gap is the single
biggest unlock for institutional sales. **This session is required
before you can credibly say the word "team" in a sales call.**

- `A0_MT_DATA_MODEL.md` — architectural decisions, data model, scope
- `A1_ORGID_CONTEXT.md` — `withAuth` returns org context; backend reads
- `A2_COLLABORATORS_SCHEMA.md` — `situation.collaborators` field
- `A3_FIRESTORE_RULES.md` — expand rules for shared cases (security
  review point)
- `A4_TEAM_INVITE_FLOW.md` — invite UI + handlers
- `A5_ROLE_PILLS_AND_GUARDS.md` — UI shows role; calibration respects
  it
- `A6_MT_AUDIT_LOG.md` — who-did-what-when, mandatory for compliance

### Session B — Postgres KG cutover (~1 night, risk-gated)

The architecture documents say Postgres is the "production knowledge
graph." Code says Firestore. This session aligns them. Risk-gated by
the row-count diagnostic from night-pack `01_DIAGNOSTICS.md`: if the
Cloud SQL graph_nodes table has any non-demo rows, the cutover plan
changes.

- `B0_KG_PREFLIGHT.md` — mandatory pre-flight checks
- `B1_DUAL_WRITE_GRAPH.md` — frontend graph writes to BOTH backends
- `B2_READ_PATH_POSTGRES.md` — reads move to Postgres; Firestore shadow
- `B3_RETIRE_FIRESTORE_GRAPH.md` — remove the old write path

### Session C — Memory + Agent Engine (~1 night, operational)

The Cognee service exists, isolated, undeployed. The four named
subagents are labels. Either bind them or rename them honestly. This
session does both: turns Cognee on, and either deploys the subagents or
removes their decorative metadata.

- `C0_COGNEE_LIVE.md` — bind `COGNEE_BACKEND_URL`, smoke live handlers
- `C1_MEMORY_RECALL_IN_CALIBRATION.md` — wire `MemoryLayer.recall` into
  `withCalibration`'s context block
- `C2_AGENT_ENGINE_SUBAGENTS.md` — deploy the 4 subagents, OR rename

### Session D — Production observability (~1 night)

You currently can't answer "how many real users ran a hero tool last
week, by tool, by case-thickness." This session puts that in reach.
Required for any SLA conversation, any pricing decision based on usage,
any retention narrative.

- `D0_STRUCTURED_EVENTS.md` — emit standardized events from every
  hero tool + tab + chapter
- `D1_KPI_PIPELINE.md` — sink to BigQuery + the dashboard that matters

### Bonus / deferrable

- `Z1_EXPORT_E2E.md` — verify Briefing/Boardroom export end-to-end
- `Z2_DEMO_TRANSITION.md` — polish demo-to-trial handoff
- `Z3_DEEP_RESEARCH_CONSOLIDATE.md` — merge `/api/ai/deep-research` and
  `/api/ai/deep-search-agent`

These are nice-to-have. Run them when there's a free evening; do not
hold a session on them.

## Hard rules for this pack

1. **No new tools, no new product surfaces.** Same rule as night pack.
   Multi-tenant means the same product, accessible to a team. Not a
   different product.
2. **Security review on every Firestore rules change.** `A3` is the
   most dangerous file in this pack. Every rule change must have a
   matching test in `tests/security/firestore-rules.test.ts`. No
   merge without tests.
3. **Postgres KG cutover is risk-gated.** If `B0_KG_PREFLIGHT.md`
   surfaces any non-demo rows in Cloud SQL, stop and re-plan. Do not
   proceed with cutover on a non-empty production table without an
   explicit dump + restore plan.
4. **No data migrations during a deploy window.** Postgres ALTERs and
   Firestore schema changes go through a controlled migration step,
   not a live deploy.
5. **Custom claims on the session cookie are append-only.** The night
   pack added `onboardingComplete`. This pack adds `orgId`, `roles`.
   The HMAC algorithm and verification logic stay frozen.
6. **Backwards-compat for solo users.** Everything multi-tenant must
   work for a user with no team — i.e., implicit "self-org" with the
   user as sole member. No regression for the current solo-user
   experience.

## How a session runs (same as night pack)

1. Copy `STATUS_TEMPLATE.md` → `STATUS.md` (or append to existing).
2. Read the session's `A0` / `B0` / `C0` / `D0` first — these are the
   architecture/decision files.
3. Paste each prompt file into Codex in order.
4. After each, run the **Diagnostics** block. Every line must print
   `OK` (or the explicit allowed exception) before the next file.
5. When Codex stops short, use the recovery prompts from
   `ITERATE_LOOP.md`.
6. End-of-session: update `STATUS.md` with the morning brief.

## What this pack does NOT include

- Billing, metering, payment integration — separate session, after
  multi-tenant lands (you can't bill what you can't account to a team).
- SSO / SAML / OIDC enterprise auth — separate session, depends on
  customer ask.
- Data residency / GDPR / SOC2 evidence — compliance project, not a
  code project.
- Demo content overhaul — Sales/marketing scope, not engineering.
- New investor-facing demos — same.
- Mobile responsive overhaul — defer until web procurement closes.

## Done condition

The pack is "done" when:

- A team of 3 analysts can share a case, see each other's edits, and
  hand off briefings between them.
- The graph displayed in the Graph tab is read from Postgres
  `graph_nodes`, not Firestore.
- Cognee live handlers respond to `recall` and `cognify` in production
  with non-stub responses.
- The 4 named subagents are either deployed Agent Engine artifacts
  named in production, or renamed honestly throughout the codebase.
- A KPI dashboard exists with: weekly active analysts, hero-tool runs
  per case, mean prompt-health score, retention curve.
- An audit log exists that captures every state-changing action with
  user, org, situation, action, timestamp, and a tamper-evident hash.

If you reach all six by end of Session D, you are credibly v2 — ready
for institutional procurement conversations.
