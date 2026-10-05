# Temporal graph and continuing context

This is the proposed production representation, to be adapted to the contracts found in phase 00. The included SQLite harness does not implement the entire model.

## Canonical records and projections

Keep canonical evidence, assertions, review decisions and artifact manifests in the existing durable PRAXIS storage. Build a queryable graph projection from those records. A graph database is optional when measured path traversal or graph volume justifies it; it is not required for the first paid brief. Source revisions, claims and reviewed narrative memberships remain recoverable if the projection is deleted and rebuilt.

Every edge has a predicate, directed subject/object, evidence/review references, scope, provenance and revision. Use observable predicates such as `quotes`, `links_to`, `syndicated_copy_candidate`, `asserts`, `supports`, `contradicts`, `frames_as`, `member_of_narrative`, `revises` and `depends_on`. Candidate similarity and reviewed assertion are separate edge states. DISARM can supply an optional tactic vocabulary; a matched tactic is not proof of an operator or campaign. [R23]

## Four clocks

Keep event-valid time, original publication time, capture/ingestion time and recorded review time separately. Unknown times stay unknown. An ingestion date must not be substituted for an event date. Use intervals for uncertain dates and open-ended validity where justified. PostgreSQL range types are an implementation option if the existing storage plane uses PostgreSQL; the product's temporal semantics are still an application responsibility. [R19]

Two analyst questions require different views: "What do we assess now about that period?" and "What did the system know as of the briefing date?" The first applies current reviewed interpretation to event-valid time. The second pins all source, membership and review revisions to the recorded snapshot. Retroactive corrections must not rewrite a previously issued brief.

## Capsule extension and manifest

Use the current native compiler/envelope discovered in phase 00. Define a versioned SIGNAL extension carrying desk scope, mandate, question, time horizon, reviewed distinctions, competing hypotheses, open questions, source panel, receipts and references to pinned evidence/assessment revisions. Do not invent a second native capsule format.

Compile under a declared token budget. Selection must include material dissent and relevant uncertainty, not merely the highest-scoring affirmative sources. Store the compilation policy revision, selected/omitted references, cutoff time and model/task configuration. If a budget omits decisive evidence, the assessment cannot be marked complete without review.

The artifact manifest pins each dependency by typed ID, revision/digest and visibility status. A source correction, entity merge, membership change, withdrawal, licence expiry or changed analytical assumption can invalidate dependent assessments and briefs. Traverse dependency edges to mark affected artifacts stale; enqueue recomputation under existing budget/review controls. Never silently replace an approved artifact.

## Assessment delta

A useful delta says which evidence or assumption changed, which judgment changes, why, what remains disputed, and how the customer's decision question is affected. The structural comparison is deterministic; interpreting its implications is a reviewed analytical task. A new timestamp or an extra unrelated article is not automatically a meaningful assessment change.

The reference helpers in `code/analysis-baselines.mjs` demonstrate manifest comparison and transitive invalidation. They are pure functions with synthetic tests, not an integrated native compiler or an automated geopolitical judgment.

## Production acceptance

Prove an issued brief can be reconstructed from its manifest. Correct a source, withdraw another, and show only reachable dependents become stale. Repeat for a changed narrative membership and a revoked private-source entitlement. Show the earlier artifact with its original knowledge cutoff and the replacement with its own review trail. Resolve graph paths only within the authenticated tenant and permitted evidence scope; IDs guessed from another tenant must reveal neither content nor existence.
