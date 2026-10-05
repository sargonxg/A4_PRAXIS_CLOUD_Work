# Acceptance gates and evidence

The local package has 29 passing reference tests (17 deterministic/domain/HTTP checks and 12 additional analytical-guard checks), recorded in `test-results.txt`. These are reference tests, not the PRAXIS test suite. Browser QA, Windows execution, live GDELT, real model interpretation, native capsule import and deployment were not run for the reference package.

## Required production behavior

| Gate | Verification | Failure that must be caught |
| --- | --- | --- |
| Global scopes | UI/storage tests for ordinary country, regional and multi-country desks | Hardcoded conflict country or falsely universal coverage |
| Identity | Cross-tenant API, graph, search, signed media and export checks | Private evidence leakage or trusted client tenant ID |
| Durable capture | Restart/reload plus duplicate/edited-source tests | Lost state, overwritten source version or double capture |
| Four clocks | GDELT/RSS fixtures with missing/conflicting dates | Discovery timestamp presented as publication/event time |
| Evidence locator | Exact quote/hash/offset unit, repeated quote, PDF/image/timed-media tests | Invented quote, wrong occurrence or stale representation |
| Rights | Capture/derivation/export/retention tests | Unauthorized complete-body storage or unrestricted private media |
| Provider health | Timeout, 429/503, invalid response, saturation and recovery | Collector failure displayed as no activity |
| Analysis fidelity | Labeled multilingual sample plus deterministic span validation | Lost negation, modality, attribution, time or place |
| Review | Version conflict, reconsideration and append-only history | Model self-approval or approval applied to different inputs |
| Graph | Rebuildability, typed edge, inspector and equivalent list | Similarity interpreted as influence/coordination |
| Native context | Capsule round-trip, legacy compatibility and compiler receipt tests | Parallel capsule schema or unreviewed memory promotion |
| Assessment delta | Changed source/context with preserved prior artifact | Silent replacement or unexplained geopolitical conclusion |
| Output approval | Edit invalidation, pinned manifest and citation resolution | Mutable text presented as approved or fabricated source reference |
| Watched collection | Browser closed, restart/crash/retry/cancel and duplicate dispatch | Client timer dependency or duplicate analytical/artifact commits |
| Quotas | Provider/model/media budget exhaustion and backpressure | Unbounded worldwide collection or recursive job fan-out |
| Release | Build, auth journey, baseline PRAXIS smoke and staging evidence | New route claimed live without an actual deployed check |

## Minimum complete journey

Create a country desk and question. Enable a reviewed pack or ingest permitted material. Capture a source revision, extract a attributed proposal and inspect its original evidence. Review it. Open the native situation context and its compiler receipt. Produce a draft brief, review and approve it. Reopen the desk. Capture a changed source revision. Show affected claims, an assessment delta and a new draft without rewriting the historical brief. Export its evidence manifest according to source entitlements.

Repeat the journey for a second country, a custom regional scope and a multi-country issue. Simulate a collector failure and exhausted budget. Verify another tenant cannot retrieve any private item through direct IDs, graph edges, caches or exports. For enabled watched desks, prove collection continues with the browser closed.

## Evaluation target

Create an analyst-labeled gold sample of 200 records across at least three countries and two languages, with a held-out portion. Include official statements, local coverage, duplicated material, accusations, denials, conditional/proposed actions, ambiguous actors, translations and missing dates. Retain labels, source rights and version history.

Measure extracted evidence precision/recall, attributed proposition fidelity, scope/modality errors, analyst correction time and supported briefing assertions. Compare keyword triage, raw-model interpretation and model-plus-reviewed-context against the same sample. A useful capsule must improve a measured workflow and may also introduce bias; evaluate contrary evidence handling explicitly.

Proposed initial release targets: zero accepted fabricated quotations; at least 95% evidence-span precision on the labeled set; no critical cross-tenant access failures; every approved artifact resolves its input manifest. These are targets, not measured claims. Report sample sizes, language breakdowns and failures instead of substituting a model's confidence for evaluation.

## Evidence recording

Every check records commit, command, runtime/configuration, date, result and whether it used synthetic fixtures, an emulator, staging services or a live external provider. Screenshots must be from an actual running implementation. A blocked live test remains blocked even if its mocked counterpart passes. Write failure cause and next action into progress. Do not make broad test runs a substitute for exercising the actual customer journey.
