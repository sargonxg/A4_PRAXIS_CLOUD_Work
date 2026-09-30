# Policy and narrative quality evaluation

September 30, 2026. Packet W13: independent analyst assessment and measured benefit remain open. Retained production answers below belong to historical source `9e95085f`; the integrated merged-source gate passed 440 files/2,396 tests, while corrected deployed receipts and new live acceptance remain pending in the [release record](2026-09-30-praxis-live-release.md).

The executable runner is [`scripts/evaluate-policy-narrative-quality.ts`](../../scripts/evaluate-policy-narrative-quality.ts).
It retains generated outputs against the eight cases in the
[`fictional evidence fixture`](../../tests/fixtures/policy-narrative-evidence.json).
Every case fact and institutional source capture is synthetic; these are not
retrieved GAO/OECD quotations. Transport/source tests and successful generation
do not establish analytical accuracy.

Fresh production build after the final settings balance/copy passed with exit 0 at 2026-09-30T22:09:25.634Z (final-build-receipt.json). This is local release evidence; deployed answer quality and independent analyst assessment remain separate.

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

## Historical harness evidence

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

## Historical production answers: agent review

Reviewed September 30, 2026 by the research agent against retained questions,
answers, execution receipts and the supplied test note. This is an agent-authored
review; independent analyst review remains pending. No human ratings were filled
in, and no numerical quality score, model ranking or measured benefit is claimed.
The three live questions differ in task and output length. They are separate
execution examples, not the eight-case matched with/without-capsule evaluation above.

The retained model receipt is
`output/playwright/practical-refinement-20260930/model-policy-live-1790793629878-d9b65b1e.json`;
the companion Markdown retains the questions and outputs. Its latest JSON alias
was byte-identical at review. The recorded main receipt hash was verified:
`99c696a757b1656c7dd8056ea25a64615ca5329dc19dadb3af4ff2c615613b81`.
These ignored artifacts must remain available with release evidence.

Observed production execution used commit
`9e95085f60e85bae8b4877f5548d6efd39dea79c`, revision
`praxis-frontend-01084-s8p`, build `d7d99db1-a0d2-4ff9-9525-04f82dcc0982`.
The before/after receipt covers approximately 18:40:30–18:41:22 UTC.
All three private threads resumed successfully and reported capsule version 2.
Each requested primary model actually served through `google.vertex.chat` in
one attempt, with no fallback. Token counts are provider-reported, not cost estimates.

| Request | Actual task / tier | Served model | Output bound | Reported input / output tokens | Answer words |
|---|---|---|---:|---:|---:|
| Constraint extraction | `cheap_classify` / fast | `gemini-3.1-flash-lite` | 1,024 | 11,873 / 55 | 24 |
| Balanced assessment | `balanced` / standard | `gemini-3.5-flash` | 8,192 | 11,990 / 2,128 | 307 |
| Complex trade-offs | `complex_reasoning` / deep | `gemini-3.1-pro-preview` | 16,384 | 12,040 / 2,332 | 457 |

### Premises and source boundary

The main harness supplied: “Explicitly synthetic QA working notes, not a real-world
event. Project identifier: REFINEMENT-708BAEFF-0E6. Funding remains undecided.
Public launch is prohibited until an independent audit is complete. These are
user-supplied constraints, not external verified facts.”

The original uploaded-document paragraph is identified by `[D1:para-1]` and
receipt
`document:upload-3b20ee5fda330b0b07e9b96cbdf20c84aaa1c5df9f2ebac95ebdb66b2084fbc3`.
The retained paragraph preview includes its review-only warning and undecided
funding, but is truncated before the complete audit sentence. The full supplied
constraint above comes from the retained harness/main-receipt evidence; this review
did not independently retrieve the original document. There is one evidence
paragraph and one distinct source receipt. Its original paragraph card and receipt
stub do not constitute two independent sources.

### Faithful recall and remaining inference gaps

The economical answer correctly extracts the identifier, “Funding Status:
Undecided” and “Public launch is prohibited until an independent audit is complete.”
Both longer answers retain undecided funding, the public-launch audit condition
and the synthetic status. Neither claims an audit was completed or a budget spent.
Their lengths fit their respective approximate requests. These are useful
constraint-fidelity observations; they do not establish general analytical accuracy.

The balanced answer distinguishes supplied constraints, inference and the absence
of independently verified facts. Its useful audit-scope planning is weakened by
several statements that exceed the supplied premises:

| Exact answer excerpt | Premise gap and analyst correction |
|---|---|
| “all planning allocations must be treated strictly as non-binding models, not as active expenditures.” | No allocations or legal authority were supplied. Allocation and expenditure are distinct; funding status alone does not establish that every allocation is legally non-binding. |
| “This audit must be treated strictly as an upcoming review deadline and a gating constraint, not as an achieved outcome.” | The audit gate is supplied; no scheduled deadline is supplied. State that the audit date is unknown. |
| “Because a public launch is blocked, a pilot provides a compliant, low-profile mechanism to test policy assumptions internally and generate the operational data necessary to satisfy the independent audit.” | Pilot permission and audit criteria are unknown. An internal pilot is a conditional option requiring authorization, scope, resources and confirmation from the audit owner. |
| “A pilot limits potential sunk costs to a clear, capped boundary while the funding architecture is finalized.” | No pilot cap or resource model was supplied. A cap must be proposed and authorized before it can support this conclusion. |

The deep answer usefully says the audit condition is “a procedural requirement,
not evidence that an audit has been commissioned or concluded” and that “no
allocation or expenditure can be inferred.” It correctly rules out a public phase
without the required completed independent audit. Its remaining recommendation
certainty still exceeds the note:

| Exact answer excerpt | Premise gap and analyst correction |
|---|---|
| “A closed pilot is the only structurally sound option under current constraints.” / “The current constraints dictate a pilot approach.” | Pilot feasibility, resources and permission are unknown. Compare a conditional pilot with deferral or design-only work before declaring a sole viable option. |
| “It infers that small-scale testing will generate sufficient empirical data to resolve the undecided funding status.” | Pilot evidence could inform deliberation; it does not guarantee resolution of funding. |
| “early momentum will force a positive funding decision.” | This is labeled an assumption in the answer, but its causal confidence is unsupported. Keep it an uncertain political hypothesis. |
| “Formal confirmation that the "undecided" status has shifted to an authorized allocation, mitigating the risk of mid-rollout insolvency.” | Funding resolution, an authorized allocation and solvency are separate propositions. Ask for evidence of each needed commitment and its duration. |

The balanced conclusion “a small policy pilot is the preferred posture” should
likewise be conditional. These are specific overconfident inferences, rather than
evidence that every analytical inference is invalid. Policymakers and analysts
should retain the faithful constraints while revising these decision conditions
before reusing the outputs in written products. Prompt guidance and receipt fixes
cannot guarantee valid recommendations; independent analyst review remains necessary.

### Historical metadata defects and local correction

The historical live receipt contains three reporting defects, preserved as evidence:

1. Fast execution is labeled standard, with a final “(fallback)” suffix even though
   the requested model served in one attempt. The label helper conflated the
   `stable_fallback` lifecycle category with an executed fallback and omitted fast.
   The exact false suffix is confirmed in transport metadata; current UI helper
   call sites also mislabel economical work but do not all pass the lifecycle field.
2. `capsuleCount: 0` counts only normalized client applied metadata. This probe used
   stack role `primary` in a field accepting `user`, `situation`, `tool`, `output`
   or `reference`, so normalization dropped it. The canonical primary capsule still
   resolved and its version-2 read/provenance and recalled identifier confirm use.
   The attachment bar counts the visible stack separately; zero does not mean
   the capsule was absent.
3. `sourceCount: 2` and `sourceReceiptCount: 2` count two cards for the same document
   receipt. Workbench/quality-strip labels expose those counts to users.

Local corrections label the effective fast/standard/deep task and append fallback
only for executed fallback receipts. Source audit/read/status counts use explicit
document/receipt identities while retaining both inspection cards; unrelated cards
without such identities remain distinct. Generation counts use server-resolved
saved primary, associated, dock and calibrated capsules, excluding version-zero
synthetic context. The ignored probe now uses applied role `situation`, with
stack role `primary` retained and historical receipts unchanged.

Focused regression validation: five suites, 51 tests passed; focused ESLint,
TypeScript and scoped diff checks passed. This verifies the bounded local correction.
Two follow-up unit cases also passed in the expanded 14-test proof-summary suite:
historical turns retain actual fallback receipts, and an economical fallback retains
its effective tier when the same served model is also available to deep tasks.
The affected historical-turn and workbench label callers pass that evidence;
their scoped ESLint and diff checks passed. The integrated gate subsequently passed build/typecheck and all 440 files/2,396 tests.
Deployment and a fresh authenticated production receipt are separate acceptance
steps recorded in the [live release record](2026-09-30-praxis-live-release.md).
