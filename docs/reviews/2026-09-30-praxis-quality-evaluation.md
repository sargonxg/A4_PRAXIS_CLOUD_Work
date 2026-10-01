# Policy and narrative quality evaluation

September 30, 2026. Independent analyst assessment/measured benefit remain open. Retained provider answers and same-run corrected memo belong to `9e95085f`/`cf04`; the latter seven-phase workflow passed. Accepted CSS-only `01a95497` passed local/build/CI/preservation and 12 public cases without an authenticated rerun. Current separately served 52102/01099 is unaccepted by this packet and disables checkout/erasure. Execution receipts do not score analytical quality; the human rubric remains unscored. The [release record](2026-09-30-praxis-live-release.md) owns exact evidence and request errors.

## Final-source answer fidelity

`model-policy-live-1790815848620-bcb1ab63.json` retains the original three provider answers and verified server history on exact `cf04c6bb`. Its status is `EXECUTION_PASS_REVIEW_PENDING`; all human-rubric verdicts remain null. A separate coordinator-agent review records concrete findings in `coordinator-model-content-review-1790815848620-bcb1ab63.json`. These are different synthetic tasks, not a matched quality/cost experiment or measured capsule benefit.

The supplied notes label the project synthetic, leave funding undecided, and prohibit public launch until an independent audit is complete. They establish no capital allocation/disbursement, completed audit or mandatory pilot.

| Actual route / task | Original answer evidence | Assessment and required correction |
| --- | --- | --- |
| Fast `gemini-3.1-flash-lite`: extraction | “Currently undecided (Supplied synthetic constraint)” and “Public launch is prohibited until an independent audit is complete”. | This short answer preserves the supplied constraints and synthetic boundary. It does not establish general analytical accuracy. |
| Standard `gemini-3.5-flash`: balanced assessment | “Project funding remains officially undecided”, “lower-cost small pilot”, “The optimal next step”. | The stored answer explicitly labels all parameters supplied synthetic constraints; that boundary is present. “Officially” lacks authority evidence, and cost/optimality need conditions or an assumption label. Distinguish a plausible recommendation from established fact. |
| Deep `gemini-3.1-pro-preview`: trade-offs | “No capital has been secured, allocated, or expended.” | Undecided funding does not establish those negative facts. Keep the funding decision uncertain and mark the capital/allocation/expenditure position unknown. |
| Same deep answer | “a small pilot becomes mandatory” for hypothetical severe audit findings. | The notes supply no such mandate. Present a conditional option subject to actual findings and decision authority. |

The retained complex heading is intact: “Trade-Off Assessment: Small Policy Pilot vs. Staged Launch”. Apparent malformed prose in optimized tool output is absent from stored bytes and is not an app cleanup/formatting defect. Original provider answers remain unchanged. These findings support the existing analytical-fidelity and claim-attribution priorities; they are not retrospective human rubric scores. The generated worker memo requires separate primary-body review.

The executable runner is [`scripts/evaluate-policy-narrative-quality.ts`](../../scripts/evaluate-policy-narrative-quality.ts).
It retains generated outputs against the eight cases in the
[`fictional evidence fixture`](../../tests/fixtures/policy-narrative-evidence.json).
Every case fact and institutional source capture is synthetic; these are not
retrieved GAO/OECD quotations. Transport/source tests and successful generation
do not establish analytical accuracy.

Builds, tests and deployed operational receipts belong to the [release record](2026-09-30-praxis-live-release.md). The independent human rubric remains unscored; successful generation does not establish factual fidelity or improved analyst outcomes.

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

## Final-source worker memo review

Actual run `26603946-3a18-4d5f-abf0-afa57652ca29` saved memo `EQmR6hElM0OwBluCh6ct__policy-memo` on `cf04c6bb`. Its original generated body and 23-finding review agree across run, memo, version, block and output; the checkpoint is `PENDING_REVIEW` with export blocked. Successful persistence closes the former undefined-publication-date failure on this journey; it does not validate the prose.

`coordinator-worker-primary-body-review-26603946.json` retains these original-body findings:

| Original quotation | Source-grounded correction |
| --- | --- |
| “a policy commitment establishes a responsibility to respect principles” | Canada’s original passage recommends a commitment to meet an existing human-rights responsibility; it does not say the commitment creates that responsibility. |
| “Unconfirmed funding means authorization is absent” | Unknown approval is not proof of absent authorization, allocation or expenditure. |
| “Therefore, operational implementation has not occurred” | A prohibition on public launch until an independent audit is complete establishes neither whether those events occurred nor whether internal activity occurred. |
| “implementation requires verifiable evidence of operational logistics and expenditure” | Spending is not a necessary indicator for every policy; operational activity and results need context-appropriate evidence. |

The coordinator-agent approved six bound primary-body corrections for persistence, hash `55a0c703cf5947df30e52a78ed622989e6a2c3f31a390ce45447771f041edade`. The 470-word revision restores the audit/launch condition, uses Canada/VP originals as scoped illustrations, labels OGP/PDF originals unavailable and retains whole-draft human review. Its initially omitted launch condition was repaired before approval. Root verified the actual persisted current-version body exactly matches that hash; save/reopen preserved citations and made the old review outdated. Same-run Close/logout/private-route 401 passed. Raw `deployed-agent-proof.json` has no status field; stdout/parent phase passed with `errors: []`. Original provider output remains retained. This is agent-assisted source review, not human approval, a numerical analyst score or final export acceptance.

## Delivery self-evaluation

This `agent-self-evaluation` assessment rates the engineering delivery and documentation. It is not a human analyst rubric, a model-quality score or a rating of the app’s factual accuracy. Current app acceptance remains bound to the named release receipts.

| Axis | Score /5 | Evidence and remaining gap |
| --- | --- | --- |
| Accuracy | 4 | Source-bound receipts and stored-byte checks support reported behavior; original model/memo factual gaps are disclosed. Generated answers still require source review. |
| Completeness | 3 | Prior cf04 core workflows are proved; current 52102 is unaccepted by this packet. Paid lifecycle, verification-email delivery, erasure, load/restore and representative analysts remain unproven. Complete those gates before broader readiness claims. |
| Clarity | 4 | Shorter copy/labels improve scanning; the retained Guide contrast failure was repaired and passed exact 01a public QA. Opaque source IDs and mobile Quickstart overlap remain follow-ups. |
| Actionability | 4 | Repository guides/review records and the 80-ID ledger provide a continuation path. Exact accepted checkpoints are separated from the current unaccepted successor; sandbox lifecycle and credential rotation remain dependencies. |
| Conciseness | 4 | Public copy was shortened. The comprehensive audit intentionally retains detail, with links and status tables for scanning. |

Average: **3.8/5**. Prioritize current-source journey acceptance, a signed subscription lifecycle when a sandbox is available, an independent source-fidelity benchmark, then mobile/source-label follow-ups. The completeness gap requires those real-service and representative-user checks; local tests cannot close it.
