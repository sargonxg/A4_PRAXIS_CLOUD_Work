# Phase 04 - useful, source-bound multilingual analysis

Additional required reading: [research/ANALYTICAL_METHOD.md](../../research/ANALYTICAL_METHOD.md), [research/MULTILINGUAL_EVALUATION.md](../../research/MULTILINGUAL_EVALUATION.md). Use these as design inputs; verify current provider/repository contracts in this checkout.

Implement T1 analysis through the current calibrated PRAXIS model gateway. Read the model instruction templates and acceptance fixtures. Select deployed model IDs through current configuration; verify availability in the actual provider and region. Do not hardcode a model merely because the blueprint used it for illustrative pricing.

Build a deterministic preprocessor for representation slicing, language hints, duplicate grouping and stable locators. Model analysis proposes entities, attributed claims, polarity, modality, scope, frame and stance. Preserve allegation/report distinctions and original-language quotations. Validate every quote and locator against the pinned representation before saving any proposal. An extraction run records model/prompt/compiler versions, token and cost usage, evidence hashes and context receipts.

Use separate steps for extracting what a source says and judging its relationship to other evidence. Narrative candidates group interpretations with linked claims and alternative frames; topic keywords alone are not narratives. Embeddings may retrieve similar items but cannot prove identity, contradiction, coordination or truth. Comparisons require matched actor, proposition, time, place and modal context. Missing evidence yields unknown, not a filled answer.

Bound tokens, retries, concurrency and per-desk spend. Parse structured responses and reject or quarantine invalid outputs. Source text can contain malicious instructions; it must never change tool authority. Do not let the model fetch arbitrary URLs or approve its own findings. Model proposals remain proposed.

Acceptance: use a labeled sample spanning at least three countries and two languages, with negation, proposals, conditions, reported accusations, attribution and aliases. Validate exact spans deterministically and have an analyst judge semantic fidelity. Measure precision/recall and failure rates against the keyword/raw-model baseline. A fabricated quotation must be rejected. Capture a bounded live provider proof if authorized; without it, deliver the validated adapter and explicitly record the missing quality/availability proof. No provider mock may be labeled live analysis.
