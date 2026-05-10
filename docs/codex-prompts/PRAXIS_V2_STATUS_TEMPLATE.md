# STATUS_TEMPLATE — copy to STATUS.md at session start

```markdown
# PRAXIS V2 Session Status

Session: <A | B | C | D>
Started: <ISO timestamp>
Operator: <Codex | GC | both>

---

## Approvals required (gate before code)

For Session A only — these must all show "approved" before A1 starts:

| decision | option | approved_by | timestamp |
|---|---|---|---|
| MT-1 org model | A (implicit self-org) | <pending> | |
| MT-2 case ownership | C (user-owned, org-scoped) | <pending> | |
| MT-3 roles | owner/editor/viewer/commenter | <pending> | |
| MT-4 invite | email + direct add | <pending> | |
| MT-5 migration | lazy script | <pending> | |

For Session B only — B0 must show approved before B1:

| decision | case | approved_by | timestamp |
|---|---|---|---|
| B0 KG preflight | <1 \| 2 \| 3> | <pending> | |

For Session C only — C2 binary decision:

| decision | choice | approved_by | timestamp |
|---|---|---|---|
| C2 subagents | <A: deploy \| B: rename> | <pending> | |

---

## Tasks

| file | status | started | completed | notes |
|---|---|---|---|---|
| A0_MT_DATA_MODEL | <not-started \| in-progress \| done \| blocked> | | | |
| A1_ORGID_CONTEXT | | | | |
| A2_COLLABORATORS_SCHEMA | | | | |
| A3_FIRESTORE_RULES | | | | |
| A4_TEAM_INVITE_FLOW | | | | |
| A5_ROLE_PILLS_AND_GUARDS | | | | |
| A6_MT_AUDIT_LOG | | | | |
| B0_KG_PREFLIGHT | | | | |
| B1_DUAL_WRITE_GRAPH | | | | |
| B2_READ_PATH_POSTGRES | | | | |
| B3_RETIRE_FIRESTORE_GRAPH | | | | |
| C0_COGNEE_LIVE | | | | |
| C1_MEMORY_RECALL_IN_CALIBRATION | | | | |
| C2_AGENT_ENGINE_SUBAGENTS | | | | |
| D0_STRUCTURED_EVENTS | | | | |
| D1_KPI_PIPELINE | | | | |

For each task: status values are
- `not-started`: not begun
- `in-progress`: actively being worked
- `done`: implementation done, audit green, build green
- `blocked-on:<id>`: waiting on something else
- `deferred`: explicitly skipped for this session

---

## Pending operational steps (require GC's hand)

| id | prompt | step | command | who | status |
|---|---|---|---|---|---|
| OP-001 | A1 | Set PRAXIS_INVITE_TOKEN_SECRET | `gcloud run services update praxis-monolith --update-secrets=...` | GC | pending |
| OP-002 | A3 | Deploy firestore rules to prod | `./scripts/deploy-firestore-rules.sh prod` | GC | pending |
| OP-003 | A1 | Apply self-org migration | `tsx scripts/migrate-self-orgs.ts --apply` from Cloud Shell | GC | pending |
| OP-004 | C0 | Bind COGNEE_BACKEND_URL | `gcloud run services update praxis-monolith --update-env-vars=COGNEE_BACKEND_URL=...` | GC | pending |
| OP-005 | C0 | Set COGNEE_ENABLED=true | env var update | GC | pending |
| OP-006 | C0 | Grant run.invoker on praxis-cognee | `gcloud run services add-iam-policy-binding praxis-cognee --member=...` | GC | pending |
| OP-007 | D1 | Create BigQuery dataset | `bq mk --dataset praxisbytacitus:praxis_telemetry` | GC | pending |
| OP-008 | D1 | Create logging sink | `gcloud logging sinks create praxis-telemetry-sink ...` | GC | pending |
| OP-009 | D1 | Bind sink writer permissions | `bq add-iam-policy-binding ...` | GC | pending |

(Add new rows as Codex surfaces operational requirements.)

---

## Diagnostics log

For each task that ran diagnostics, paste the output:

### A1 diagnostics — <timestamp>

```
$ npm run audit:auth-org-context
audit:auth-org-context passed (static-marker)

$ grep -q "OrgMembership" src/types/auth.ts && echo OK
OK

$ npm run build
✓ Compiled successfully

$ tsx scripts/migrate-self-orgs.ts --dry-run | head
DRY-RUN: 47 actions across 23 users
  create-self-org uid=abc123
  set-orgId uid=abc123 sit=case-001
  ...
```

(append diagnostic blocks per task)

---

## Failures and recoveries

When a task hits a failure, document:

### <task-id> — <date>

**Failure**: <signal>
**Pattern from ITERATE_LOOP**: <number, if matched>
**Recovery**: <re-prompt used>
**Result**: <success | escalated to GC | rolled back>

---

## Morning brief (end of session)

Replace at session end:

```markdown
### Session <X> — <date>

**Completed**:
- <file>: <one-line summary>
- ...

**Deferred**:
- <file>: <why>

**Blocked on operational steps**:
- <OP-NNN>: <what's needed from GC>

**Audit gate**: <green | yellow with N issues | red>

**Build**: <green | red>

**Manual smoke results**:
- <smoke 1>: <pass | fail>
- ...

**Recommendation for next session**:
- <go to <Y>, or hold pending OP-NNN, or revise plan>
```

---

## Snapshot at session start (informational)

Capture once at session start to detect regressions later:

```bash
# Run these and paste output:
git rev-parse HEAD
git status --short
node --version
npm --version
npm run audit:gate 2>&1 | tail -20
npm run build 2>&1 | tail -10

# For Sessions B/C/D: also capture
gcloud run services describe praxis-monolith --region=<region> \
  --format='value(spec.template.spec.containers[0].env)' \
  | tr ' ' '\n' | grep -E '(KG_|COGNEE_|PRAXIS_)' || echo "no v2 env yet"
```

```
HEAD: <sha>
Status: <clean | modified files>
Node: <version>
Audit gate: <pass | fail with list>
Build: <pass | fail>
Env: <relevant vars>
```
```

---

## How to use this template

1. At session start, copy this entire file to `STATUS.md` at the
   repo root (or append to existing).
2. Fill in the snapshot section.
3. As Codex works, update Tasks, Pending operational steps, and
   Diagnostics log.
4. At session end, fill in the Morning brief.
5. The next session reads STATUS.md to know what's pending.
