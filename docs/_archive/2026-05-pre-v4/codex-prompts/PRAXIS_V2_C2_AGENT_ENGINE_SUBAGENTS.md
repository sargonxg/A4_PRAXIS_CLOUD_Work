# C2 — Agent Engine subagents: deploy or rename

## Goal

The codebase advertises four named subagents — `context-preparer`,
`source-augmenter`, `output-refiner`, `memo-drafter` — plus a fifth
candidate, `red-team-analyst`. Today these are metadata labels
attached to tool registry entries. They are not deployed as Vertex
Agent Engine artifacts. The investor deck and Concordia Discors
articles describe them as if they exist.

This file forces a binary decision and executes it:

**Option A (deploy)**: Stand up the four subagents on Vertex Agent
Engine, wire each into `withCalibration` at its appointed step, store
the agent IDs in Secret Manager, and use them in production.

**Option B (rename)**: Remove the subagent metadata from the tool
registry. Update transparency cards. Stop calling them subagents.

Both options are honest. The wrong move is to leave the labels in
place without backing them up.

## Decision input

Before code, GC picks A or B. Considerations:

| | A: deploy | B: rename |
|---|---|---|
| Engineering cost | 2-3 days, then ongoing maintenance | < 1 day, one-time |
| Vertex cost | $50-200/mo per subagent at low traffic | $0 |
| Demo / deck impact | Strengthens claim | Removes claim |
| Procurement impact | Slight positive | Neutral (no claim, no risk) |
| Reversibility | Hard to undeploy without losing data | Easy to add later |

**Default recommendation: B (rename).** A real subagent only earns
its keep if it does work the inline calibration block can't.
Currently nothing in the four named roles requires Vertex Agent
Engine — `withCalibration` already does context preparation, source
augmentation, output refinement, and the memo-drafting pattern is
just a hero tool template. Deploying for symmetry with the deck is
overengineering.

If GC picks A, the work is described in section "Option A" below.
If B, section "Option B".

## Files Codex must read first

- `src/lib/tools/registry/*.ts` — wherever the subagent metadata
  lives
- `src/components/workbench/transparency-card.tsx` — where the
  subagents are displayed
- `src/lib/api/with-calibration.ts`
- Any deck/marketing copy that references them — likely in
  `docs/marketing/` or `docs/investor/`

## Option B — Rename (default)

### 1. Remove subagent metadata

```bash
rg "context-preparer|source-augmenter|output-refiner|memo-drafter|red-team-analyst" src/ docs/ -l
```

For each match, replace the subagent label with one of:
- `inline pipeline step` — for items that describe what
  `withCalibration` does
- `prompt template` — for memo-drafter (it's a system prompt
  shape)
- (delete entirely) — for items that purely existed to advertise
  the subagent concept

### 2. Tool registry cleanup

If the tool registry has a `subagents` field on tool entries:

```typescript
// Before
{
  id: 'factbook',
  subagents: ['context-preparer', 'source-augmenter', 'output-refiner'],
  // ...
}

// After
{
  id: 'factbook',
  pipeline: ['retrieve-graph', 'collect-sources', 'compose-prompt', 'call-model', 'parse-output'],
  // ...
}
```

The `pipeline` field describes what `withCalibration` actually does,
in honest terms.

### 3. Transparency-card update

The existing transparency card may say "This tool uses 4 subagents."
Replace with: "This tool runs through PRAXIS's calibrated pipeline:
graph retrieval, source collection, prompt composition, model call
(Gemini 2.5 Pro), structured output parsing."

### 4. Deck / docs / marketing

Search for references in `docs/`. For each:
- Investor deck: replace "4 named subagents" with "calibrated
  pipeline" or remove the claim entirely.
- Concordia Discors articles: either edit (preferred — articles are
  yours) or add an addendum noting the architecture has consolidated.
- White papers: same treatment.

GC reviews the doc edits before merge.

### 5. Audit: `audit:no-subagent-claims`

```typescript
// scripts/audit-no-subagent-claims.ts
const FORBIDDEN = [
  'context-preparer',
  'source-augmenter',
  'output-refiner',
  'memo-drafter',
  'red-team-analyst',
  'subagent',
];
// Search src/ and docs/. Each match must be:
//   - in a comment that explicitly explains the rename
//   - in this audit file (allow-listed)
// Otherwise fail.
```

Add to `audit:gate`.

### 6. Migration note in changelog

```markdown
## 2026-MM-DD — Subagent terminology consolidated

The subagent labels (context-preparer, source-augmenter, output-
refiner, memo-drafter) were architectural placeholders that no
longer represent how PRAXIS actually executes hero tools. The
calibrated pipeline performs all of these functions inline within
withCalibration.

No user-facing functionality is affected. Investor and architecture
documentation has been updated to use accurate terms.
```

### Acceptance criteria (Option B)

1. No tool entry advertises subagents.
2. Transparency cards describe the actual pipeline.
3. Doc references updated or annotated.
4. `audit:no-subagent-claims` passes.
5. Changelog entry added.

## Option A — Deploy

If GC picks deploy: the work below.

### 1. Define each subagent's responsibility

In `docs/architecture/SUBAGENTS.md`:

```markdown
# PRAXIS Subagents (Vertex Agent Engine)

## context-preparer
Input: caseId, heroToolId.
Job: pull graph subgraph relevant to the tool's purpose, summarize
into a 500-word context block.
Distinct from `withCalibration` because: applies a tool-specific
focus (e.g., factbook needs entity-density; ach needs hypothesis
spread).

## source-augmenter
Input: source receipts list.
Job: dedupe, score reliability, format as evidence chunks.

## output-refiner
Input: raw model output, tool schema.
Job: structural validation, repair attempts (limited), final shape.

## memo-drafter
Input: structured tool output, target audience.
Job: produce briefing-style prose at the requested register.

## red-team-analyst (deferred)
Input: any output. Job: critique, find counter-evidence, surface
weakest claim. Spawned only on user request via /api/tools/red-team.
```

If a subagent's job is genuinely the same as inline calibration code,
**don't deploy it** — it doesn't earn its weight.

### 2. Vertex Agent Engine deployment

Each subagent is an Agent Engine artifact. Codex creates the deploy
spec in `infrastructure/agent_engine/`:

```python
# infrastructure/agent_engine/context_preparer.py
from vertexai.preview import reasoning_engines

class ContextPreparer:
    def __init__(self):
        self.model = "gemini-2.5-pro"

    def query(self, *, case_id: str, tool_id: str) -> dict:
        # Pull graph subgraph
        # Summarize
        # Return shaped context
        ...

reasoning_engine = reasoning_engines.ReasoningEngine.create(
    ContextPreparer(),
    requirements=["google-cloud-aiplatform[reasoningengine]"],
    display_name="praxis-context-preparer",
)
print(f"AGENT_ID={reasoning_engine.resource_name}")
```

GC runs the create from a deploy machine. Resource name goes into
Secret Manager as `VERTEX_AGENT_CONTEXT_PREPARER_ID`.

### 3. Wire each subagent

In `withCalibration`, replace the inline step that the subagent
takes over:

```typescript
// Before: inline graph retrieval
const graphContext = await retrieveForProfile(params);

// After: subagent call
const graphContext = await invokeAgent('VERTEX_AGENT_CONTEXT_PREPARER_ID', {
  caseId, toolId,
});
```

### 4. Deploy + test each

Per subagent, GC executes:

```bash
python infrastructure/agent_engine/context_preparer.py
# capture AGENT_ID, store in Secret Manager
```

Codex provides smoke-test scripts.

### 5. Cost monitoring

Each subagent invocation costs Vertex tokens + Agent Engine compute.
Add per-tool latency + cost telemetry to the structured event log
(D0).

### 6. Audit: `audit:subagent-bindings`

Static-marker. Confirms the four `VERTEX_AGENT_*_ID` envs are
referenced in withCalibration. If any is missing, the corresponding
inline fallback runs (graceful degradation).

### Acceptance criteria (Option A)

1. Four agent definitions in `infrastructure/agent_engine/`.
2. Four secrets bound in Secret Manager.
3. `withCalibration` calls each at the appointed step.
4. Inline fallback if a binding is missing.
5. Smoke test for each subagent passes.
6. `audit:subagent-bindings` passes.

## Diagnostics

Both options share these:

```bash
# Option B (default)
npm run audit:no-subagent-claims && echo OK

# OR Option A
test -d infrastructure/agent_engine/ && echo OK
gcloud secrets list --filter="name~VERTEX_AGENT" && echo OK
npm run audit:subagent-bindings && echo OK

# Common
npm run build && echo OK
```

## If Codex stops short

**Failure mode A**: Codex picks A without GC sign-off. **Stop.**
Re-prompt:

> "The decision is binary and explicit. STATUS.md must show GC's
> choice (A or B) before code starts. Show me the status row.
> If absent, default to B (rename) and document the choice in
> STATUS.md as 'pending GC review.'"

**Failure mode B**: B chosen, but Codex misses some references.
Re-prompt:

> "Run the audit script. For every fail line, open the file and
> remove or rephrase. The check covers src/ and docs/. Documentation
> rewrites need GC review — flag them in a separate commit."

**Failure mode C**: A chosen, but a subagent has the same logic as
inline `withCalibration`. Re-prompt:

> "If the subagent's job is identical to what withCalibration does
> inline, don't deploy it. Add to docs/architecture/SUBAGENTS.md:
> 'context-preparer collapsed into withCalibration; not a separate
> deployment.' Re-evaluate each of the four — only deploy ones with
> distinct logic."

## Commit

For Option B:
```
chore(C2): subagent terminology consolidated (rename, not deploy)

The subagent labels (context-preparer, source-augmenter, output-
refiner, memo-drafter) were architectural placeholders, not
deployed Agent Engine artifacts. Removed from tool registry,
transparency cards, and documentation.

audit:no-subagent-claims prevents the labels from re-appearing.

Refs: V2_WORK_PACK/C2_AGENT_ENGINE_SUBAGENTS.md
```

For Option A:
```
feat(C2): four subagents deployed to vertex agent engine

context-preparer, source-augmenter, output-refiner, memo-drafter
deployed as Vertex Agent Engine artifacts. Resource names bound
in Secret Manager. withCalibration invokes each at its appointed
step with inline fallback if a binding is missing.

audit:subagent-bindings enforces the contract.

Refs: V2_WORK_PACK/C2_AGENT_ENGINE_SUBAGENTS.md
```
