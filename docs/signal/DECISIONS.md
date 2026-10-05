# SIGNAL implementation decisions

- User selected the uploaded kit despite its filename: RELEASE.json declares v0.2.0 and twelve phases 00–11. This is the implemented specification. /signal is explicitly authorized as an additive authenticated PRAXIS module.
- The architecture alignment records SQL graph cutover as unproven. SIGNAL uses the current canonical Firestore owner plane rather than declaring a new SQL system production-ready. Browser access remains denied under the existing security rules; all operations pass through authenticated server APIs. Additive index declarations provide scheduler group lookups and suppress indexing of evidence payloads.
- Solo-founder text pilot is intentionally bounded: 80 immutable revisions, 160 proposals, 40 briefs, aggregate at most 700KB. Capacity errors preserve previous state and require a new desk; no automatic deletion of historical evidence. Collection/model quotas reserve in transactions and account for failed attempts.
- Revisions include content, language, publication clock, synthetic flag and rights digest. URL normalization removes only known tracking params and fragments. Same-source correction marks dependent readings and artifacts stale, keeping historic approved text unchanged.
- Native capsule snapshots are immutable and deterministic. Accepted source readings use SOURCE_REPORTS, preserving the distinction from verified event truth. Human review never asserts authenticity, coordination or deceptive intent automatically.
- Models propose only. Editorial approval binds the exact text and evidence/context manifest. Changed panel/scope/context, rejected/stale readings and edited text need new review. Exports require declared redistribution rights; drafts are never exported as approved.
- Media tiers, paid contextual datasets and social collection remain disabled until entitled inputs and provider/evaluation gates pass. No dummy synthetic evidence is seeded into customer desks.
- Human-labeled semantic-quality target (200 records, two languages, three countries) is a pilot validation requirement, not fulfilled by synthetic unit tests or inferred from a model's confidence.
- User authorized publication after tests. Existing main push auto-deploys frontend; stage and inspect changes before any main push. Preserve existing main history and live rollback revision.

GDELT discovery is gated by `SIGNAL_GDELT_ENABLED` and disabled for this release following the observed provider HTTP 503. Enable it only after a bounded successful live discovery check; supplied text and permissioned RSS are available.
