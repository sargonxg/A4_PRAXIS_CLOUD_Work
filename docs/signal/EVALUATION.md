# SIGNAL analyst labeling and evaluation

The source-reading Review controls are the analyst labeling lane: inspect the pinned source quotation and UTF-16 span, attribution, negation, modality and conditions before accepting, rejecting or leaving unresolved. Review rationale and identity remain in the append-only ledger. An accepted reading is a human judgment about a source statement, not verified event truth. Approved JSON bundles preserve source, claim and review snapshots for authorized labeling input; an exported artifact is not automatically an evaluation gold label.

## Run the bounded offline evaluator

```bash
npx tsx scripts/evaluate-signal.ts --demo
npx tsx scripts/evaluate-signal.ts --demo-dataset > /tmp/signal-development.json
npx tsx scripts/evaluate-signal.ts /tmp/signal-development.json
```

The bundled development examples cover Brazil, Sudan and Japan in Portuguese and English. They are explicitly synthetic, with deterministic literal spans. Only a simple first-sentence keyword baseline runs by default; the evaluator makes no network or model calls. Raw-model and model-plus-context lanes report `not_measured` until predictions are supplied. Synthetic examples never count toward human gold or held-out analytical quality.

## Dataset contract

JSON uses `schemaVersion: "signal-evaluation/1"`, a meaningful immutable `datasetVersion`, and at most 2,000 records (32 MB CLI input limit). Each record has:

- Unique `id`, `split` (`development` or `heldout`), two-letter `country`, and `language`.
- `synthetic`, `labelProvenance` (`human` or `synthetic`), and retained authorized `sourceText`.
- `expectedClaims`: human labels or explicitly synthetic reference labels.
- `predictions`: optional `keyword`, `rawModel`, and `modelPlusContext` claim arrays. Empty arrays mean observed abstention; absent lanes mean unmeasured.

Each claim has `quote`, UTF-16 `start` and `end`, `speaker` (use `unknown` when unknown), `polarity`, `modality`, `conditions` (empty when none), and optional `accepted` (defaults false). Values follow SIGNAL's source-reading enums. Use the emitted demo dataset as a complete template. Reference quotations must exactly match their source spans, including Unicode boundaries. Incorrect prediction spans remain evaluable and are reported as failures.

Human analysts must independently label held-out material without inspecting lane predictions. Keep development material and held-out records distinct, with unique IDs and immutable dataset versions. Supply only evidence authorized for the evaluator's private filesystem; reports print record IDs and error categories rather than source quotations. Keep datasets and reports outside the tracked checkout when they contain private material.

## Interpret results honestly

Reports separate development and held-out samples, list human-label counts and country/language coverage, and show every metric's numerator and denominator. Exact-span precision measures literal source grounding; exact-claim precision/recall additionally require matched attribution, polarity, modality and conditions. Field accuracy is restricted to matched source spans and states its denominator. Unknown counts, accepted fabricated quotations, missing lane records and up to 20 error examples remain explicit. Duplicate predictions do not inflate recall; zero predicted claims produce null precision.

Context regression compares paired raw-model and model-plus-context records, identifying records where previously complete correct extraction gains an error or omission. This is descriptive evidence from the supplied predictions, not a causal performance estimate.

The 200-record target across at least three countries and two languages applies to independently human-labeled held-out records. Until those records exist, benchmark status remains `not_measured`, even when small-sample lane metrics are available. Meeting sample size alone does not establish acceptable quality: inspect complete prediction coverage, errors, grounding precision and context regressions before enabling broader analytical claims. No 200-record human gold benchmark or live model comparison has been completed by this implementation.
