# Policy and narrative quality evaluation

September 30, 2026. Implementation packet W13; empirical benefit remains open.

The executable runner is [`scripts/evaluate-policy-narrative-quality.ts`](../../scripts/evaluate-policy-narrative-quality.ts).
It retains generated outputs against the eight cases in the
[`fictional evidence fixture`](../../tests/fixtures/policy-narrative-evidence.json).
Every case fact and institutional source capture is synthetic; these are not
retrieved GAO/OECD quotations. Transport/source tests and successful generation
do not establish analytical accuracy.

## Defined comparison and acceptance

Both conditions receive the exact same evidence bytes, question, system prompt,
requested model, output limit, temperature and timeout. The baseline frames the
material as supplied evidence; the capsule condition adds a situation-context
envelope. Grading answers and forbidden-inference lists are excluded from both
prompts. This isolates a limited prompt-framing comparison. It does not measure
the entire PRAXIS capsule injection/persistence/retrieval pipeline or its routing.

Original generated text, input prompts, evidence hashes, requested and reported
models, model-matrix/runner/fixture hashes, source commit and dirty state, response
IDs, token usage, latency, finish reasons and errors are retained. No hidden
fallback or automatic retry is allowed. Unequal or missing reported model IDs,
empty outputs and provider errors must be treated as incomplete comparisons.
Trials counterbalance condition order; all outputs remain available, with no
best-result selection. A timestamped run directory is exclusive and never
overwrites another run.

Acceptance for the harness is same-material integrity, no grading-answer leakage,
bounded execution, honest error receipts and a completely unscored human rubric.
Model accuracy is a separate acceptance decision made from the original outputs.

## Run locally

Default execution makes no provider request and loads no local credentials:

```powershell
npx tsx scripts/evaluate-policy-narrative-quality.ts --dry-run
```

Explicit execution uses existing local provider/environment configuration through
the application's provider abstraction. It does not change credentials, create
workspace records or use a production account. Provider calls can consume quota.
Use a single case to establish availability before a full run:

```powershell
npx tsx scripts/evaluate-policy-narrative-quality.ts --execute --case=allocation-is-not-expenditure --task-kind=cheap_classify
npx tsx scripts/evaluate-policy-narrative-quality.ts --execute --task-kind=balanced --repetitions=3
npx tsx scripts/evaluate-policy-narrative-quality.ts --execute --task-kind=complex_reasoning --case=contradictory-sources-require-synthesis
```

Optional `--max-output-tokens=`, `--timeout-ms=` and `--output=` are bounded;
use `--case=` to select one case. Unknown options are rejected. Output lives under
the ignored `output/quality/` directory. Preserve original outputs; put any
reviewer corrections in a separate product. Exit code 1 means errors/incomplete
generation, not a failed analyst judgment. Exit code 0 never means quality passed.

## Human review

`analyst-rubric.json` starts with null ratings, reviewer and preference. Inspect
each original output and cite its actual words when marking expected checks or
critical errors. Rate factual fidelity, attribution, uncertainty/scope, usefulness
and writing clarity from 1 to 5, documenting the reason. Treat fabricated facts,
false institutional attribution and erased source-access gaps as critical errors.
Do not score an unavailable output or unequal-model comparison as a capsule win.

Record reviewer identity, date, expertise, condition visibility and limitations.
For a stronger study, an independent analyst should receive randomized A/B labels;
the runner's condition names are currently visible, so review is not blinded.
A model critique is another generated assessment, not independent human evidence.

These eight regressions do not cover every policymaker task. Add representative
decision briefs, options comparison, commitment-versus-implementation assessment,
conflicting-source analysis, narrative comparison and context handover before
making broad usefulness claims. Representative users, task completion, time and
revision burden require an actual study; no benefit percentage is preset.

## Execution evidence

Five focused harness tests passed: same-material/no-grading-leak integrity,
unscored reviewer fields, bounded CLI settings, credential redaction and rejection
of unmatched/missing/failed model outputs. Scoped ESLint passed. Application
typecheck remains the root integration gate.

The final dry-run retained all eight cases and 16 prompts, with every output
marked not executed: `output/quality/coordinator-20260930-final-dry-run/manifest.json`.
The authorized one-case economical-provider probe recorded two provider-error
receipts before any model request because no local provider was configured:
`output/quality/coordinator-20260930-final-provider-probe/manifest.json`.
Status is `incomplete-provider-output-or-model-errors`; exit code 1. No provider
output, premium availability or analytical benefit is established by this probe.
The reviewer rubric remains unscored. These local ignored artifacts require
preservation with a later release/evaluation receipt; do not infer generation
success from the implemented runner.

Related: [implementation ledger](2026-09-30-praxis-implementation-ledger.md),
[user guide](../product/CONTEXT_CAPSULE_POLICY_RESEARCH_GUIDE.md).
