# Canonical SIGNAL data contracts

These are domain requirements to adapt into PRAXIS's existing schemas. They are not permission to replace native capsule envelopes. Use explicit schema/profile versions and migrations. Every private record carries server-derived tenant/workspace/desk ownership and access policy.

## Geography, desks and panels

| Record | Required fields and semantics |
| --- | --- |
| Geography entry | Stable ID; kind; country/territory codes where applicable; names/aliases; source and registry version; display policy |
| Regional/theatre definition | ID/version; country IDs; inclusion/exclusion rules; optional administrative IDs/geometry references; source/license; reviewer |
| Desk revision | ID/version; mandate/question; audience; geography scope; languages; window; source-pack revision; capsule IDs; review cadence; watched status; budget |
| Source-pack revision | Panel ID/version; source IDs; collector config; subject/publisher geography; languages; editorial rationale; exclusions; retention/redistribution basis; health expectations |
| Collection run | ID; scope/pack revisions; bounded query/window/partition; attempt/checkpoint; idempotency key; counts; status; saturation/gaps; started/ended/last success |

Country of publication, publisher headquarters, mentioned place, alleged event place, intended audience and desk relevance are separate attributed fields. Desk relevance may be a proposal; a place match is not verified event geolocation. Theatres may overlap or cross borders. Registry identifiers do not establish recognition or sovereign boundaries.

## Sources and locators

| Record | Required fields and semantics |
| --- | --- |
| Source identity | Stable provider/source ID, canonical URL with documented normalization, publisher attribution and capture policy |
| Source revision | Source ID; exact representation hash; raw metadata provenance; original language; publication time and reason if unknown; supersession/withdrawal relation |
| Capture occurrence | Revision ID; discovery and capture times; collector/run ID; response metadata; acquisition/rights basis |
| Representation | ID/hash; kind (headline, original text, PDF text, OCR, translation, transcript, image, audio, video); byte/object reference; derived_from; parser/model/version; retained access policy |
| Evidence locator | Representation ID/hash; locator type; quote/position/page/region/time selector; coordinate/offset unit; creation provenance |

Keep four clocks: publication, discovery, capture and asserted event time. Retain source raw dates/time zones when available and record parsing confidence/reason separately. A provider's discovery date cannot fill publication or event time. Unknowns use null plus a reason, never an invented current timestamp.

Text selectors contain exact quote, start/end and representation hash. Declare units; JavaScript UTF-16 code-unit offsets are not UTF-8 byte offsets or Unicode code-point offsets. Validate the exact slice after normalization. If a quote repeats, preserve its selected occurrence rather than finding an arbitrary first match. PDF selectors retain page and available coordinates; OCR retains image region and transformation. Audio/video selectors retain start/end in milliseconds, sample/frame metadata and media hash.

Translations and transcripts are derived representations with their own hashes. A translated claim must link both original evidence and translation. Partial capture is marked partial; it cannot silently stand in for the full source. Source access does not itself grant redistribution. The reference harness's 600-character cap is an application bound, not a copyright safe harbor.

## Interpretation and review

| Record | Required fields and semantics |
| --- | --- |
| Actor proposal | Canonical ID candidate; name/aliases; type; dated affiliations; identity evidence; ambiguity status |
| Claim proposal | ID/version; attributed speaker; proposition; polarity; modality; conditions; temporal/geographic scope; evidence locators; derivation receipt; review state |
| Claim relation | Qualified supports/contradicts/reports/quotes link; compatible scope; evidence; proposal/review state |
| Narrative revision | Frame; linked attributed claims; described actors/audience if evidenced; scope/window; observed circulation; alternative frames; supporting and contrary evidence |
| Event assertion | What allegedly occurred, time/place/participants, modality and evidence; verification state independent of mention volume |
| Assessment revision | Question; conclusion; basis; alternatives; uncertainty/confidence rationale; invalidators; context receipts; prior revision; review state |
| Review decision | Target ID/version/digest; evidence and context input digests; decision; reviewer identity/role; rationale; timestamp; supersedes if reconsidered |

Separate review state (`proposed`, `accepted`, `rejected`, `unresolved`, with native equivalents) from four independent judgment dimensions: event truth, authenticity, coordination and intent. Each dimension can be unassessed, supported, contested or contradicted with linked evidence and a reviewer. Do not assign a single fake precision score that merges them. Use calibrated confidence only if its meaning and evaluation are established; otherwise report qualitative uncertainty and reasons.

An assertion that a source reports an allegation is not an assertion that the allegation is true. Model proposals may contain findings to review; they cannot approve them. Analyst acceptance binds the exact proposition and locators. Approval of a narrative grouping does not establish a coordinated campaign. DISARM/EEAS tags annotate reviewed observations and methodological hypotheses, not automatic actor attribution.

## Ledger and graph

Canonical typed assertions include subject, predicate, object/value, temporal/subject scope, evidence, derivation, review and visibility. Common safe predicates include mentions, quotes, reports_claim, cites, contains_span, derived_from, supersedes, frames_as and depends_on. Similarity/duplicate relations are candidates until their basis is reviewed. Claimed responsibility is an attributed assertion.

Graph nodes and edges include canonical record IDs and version references. Never silently turn near-duplicate content into `controls`, `coordinates`, `causes` or `influences`. Any analytical edge needs its explicit inference status, evidence and reviewer. Reconstruction must produce the same projection for the same manifest. Projection/query pagination and visibility filtering happen before source text is returned.

## Context and artifacts

Situation capsules contain scoped country/theatre background, reviewed distinctions, actor/alias knowledge, language rules, unknowns, counterexamples and revision triggers. User capsules define audience/mandate; Tool capsules define source/provider access and interpretation constraints; Output capsules hold an artifact and its lineage. Import/export adapters preserve the existing canonical/native structure and test legacy compatibility.

An approved brief manifest contains artifact revision/text hash, source/representation revisions, accepted and explicitly qualified unresolved claims, narrative/assessment versions, capsule/compiler receipt, model/prompt profile, reviewer decision, generated/approved times and export entitlements. A displayed draft is mutable; an approved artifact revision is pinned. Any edit creates a new draft needing its own approval.

An assessment delta references old/new assessment manifests and categorizes evidence change, interpretation change, unchanged finding, unresolved question and decision implication. It records the contextual distinction applied and invalidation reason. First observed in the monitored panel is not original creation; uncertainty belongs in both UI and exported artifacts.

## API and worker invariants

Use validated inputs, idempotency keys for repeatable mutations and expected version/digest for updates/reviews. Tenant ownership comes from auth, not the request payload. Collection worker identity is verified separately from user sessions. Response schemas distinguish absent, unknown, incomplete, failed, saturated and denied states. Use bounded pagination and structured conflict/retry errors. No client or model can write canonical accepted state directly.
