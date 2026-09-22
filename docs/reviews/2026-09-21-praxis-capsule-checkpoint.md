# PRAXIS capsule and homepage implementation checkpoint

Implementation and release verification checkpoint. Deployment evidence is recorded separately below; this is not a claim of commercial readiness.

## Delivered locally

- Public homepage: question-first layout, compact mobile navigation, capsule exploration and builder login handoffs, explicit sign-in and AI-review expectations. Existing workspace routes are retained.
- Twelve spotlighted starters spanning policy situations, methods and output formats. They are inspectable and use the existing typed attachment path; being spotlighted is not a certification of evidence or freshness.
- Three more specific saved method profiles: IAD-informed institutional analysis, conditional fiscal/distributional scenarios, and chronology with counterfactual checks. Inputs, procedure, graph/ontology templates, challenge questions and review gates are inspectable. Method references remain separate from case evidence.
- Saved method inputs, steps and checks enter the protected tool-capsule prompt. Private snapshot edits take precedence over the catalog. Budget compaction surfaces omitted method details as a gap instead of silently inventing instructions.
- Canonical PDF/DOCX/text extraction for builder intake, per-file failures and truncation warnings, unique draft IDs and save-before-publish. Structure checks no longer fabricate sample model outputs or imply an evaluation pass.
- Conservative document proposals: actual text receipts and offsets, explicit actor labels, validated ISO timeline dates, unknown dates retained, no fabricated causal edges or claims padded from filenames/prompts.
- Saved review proposals can be inspected and approved/rejected with a reason. Owner-scoped reads and transactional decision guards prevent overwriting completed decisions.
- Starter seeding no longer manufactures ratings, favorites, marketplace publication or trust-score increases. Existing stored ratings are not erased: a separately reviewed migration is needed to distinguish legacy synthetic records from genuine user activity.
- Spotlight attachment reads and, if necessary, seeds only the selected capsule, with a bounded request timeout. Existing saved edits are not overwritten. The real test account's full library was 312 records / 36.6 MB: full inventory pagination remains a performance priority.
- Document intake no longer invents a `default` situation ID. With no selected case, it creates a private source workspace and reuses its returned ID for uploads and architect proposals.
- Patched compatible dependencies including Next.js, MapLibre, XML parsing and OpenTelemetry. Latest audit: zero high/critical findings; 44 moderate and 3 low remain.

## Verification

- Final Vitest run: 363 files / 1,550 tests passed (`output/praxis-tests-final.log`). Separate JEV adapter suite: 14 passed. Lint: zero errors, eight existing navigation warnings.
- Full release audit gate passed after runtime fixes (`output/praxis-gate-final.log`). Final contrast/wrapping-only refinements also undergo the Cloud Build production compilation.
- Real Firebase browser journey now passes in 55 seconds: attachment, upload, architect build, correct draft inspection, rejection and persisted decision read-back (`output/praxis-journey-final.log`). Inspector reads only its selected capsule; case-scoped preparation avoids reading the whole catalogue.
- Supplied external credential path restored Firebase Admin access. GCP audit passed with zero hard/soft failures. The key is not copied into the repository or deployment bundle.
- Latest focused service, spotlight and prompt checks after removing synthetic ratings: 55 tests passed.
- Freshness regression: dated fixtures now use an explicit May clock; a September test confirms expired sources/reviews still prevent publication. Production freshness logic was not weakened.
- Production login smoke: real canary sign-in and navigation through launchpad, capsules, Boardroom and settings passed on `https://praxis.tacitus.me` (`output/praxis-live-login-2026-09-21.log`). This tests the deployed baseline, not local changes or model-analysis quality.
- AST graph refreshed locally. Optional Terraform/SQL parsers were unavailable; graph extraction is not complete proof of those languages.

## Method references

The recipes are PRAXIS adaptations, not institutional endorsements, numerical estimates or validated findings.

- [Ostrom Workshop IAD framework](https://ostromworkshop.indiana.edu/courses-teaching/teaching-tools/iad-framework/index.html).
- [IMF technical note on fiscal multipliers](https://www.imf.org/en/publications/tnm/issues/2016/12/31/fiscal-multipliers-size-determinants-and-use-in-macroeconomic-projections-41784).
- [World Bank Impact Evaluation in Practice](https://www.worldbank.org/en/programs/sief-trust-fund/publication/impact-evaluation-in-practice).

## Still required before release / sale

1. Repeat the passed local journey on the deployed revision. Track remaining moderate/low dependency findings; do not force the suggested Genkit downgrade.
2. Deploy the validated checkpoint and verify the served commit plus live browser journeys. Cloud authentication is now working; no credential or IAM change is required.
3. Prove the newly edited authenticated source upload → builder → review → attach → actual analysis journey with persistent storage. Unit tests and the old deployed login smoke do not establish this new end-to-end path.
4. Reconcile the builder's draft schema and canonical capsule representations; complete DIALECTICA adapter round trips and durable ingestion/review integration.
5. Run real capsule-vs-raw-document comparative evaluations with analyst review. Method injection is proven in tests; better analytical outcomes are not yet measured.
6. Finish billing/entitlement, tenant isolation, recovery, retention/deletion and paid-pilot acceptance checks described in the preceding readiness review. Not every page or commercial workflow has been reworked in this checkpoint.

Catalog adaptations apply to newly built snapshots. Existing saved capsules are not globally overwritten with the new methods; versioned, user-visible updates need their own migration/review path.
