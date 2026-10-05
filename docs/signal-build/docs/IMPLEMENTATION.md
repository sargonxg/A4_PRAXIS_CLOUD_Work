# Production integration specification

## Boundaries and current source reference

SIGNAL is an additive domain module in the existing PRAXIS Next.js application. The reference inspection used commit `276d9cbb62c2cd6a212770c4fa78547c901ee82b`. It was authorized remote code inspection, not a full checkout build or live production validation. Phase 00 must re-resolve all paths and deployment contracts.

The inspected `package.json` declares Next.js 16.3.7, React 19.2.4, TypeScript 5.9.3, Vitest, Playwright, Zod, Postgres, Firebase, Google/Vertex adapters, Cloud Tasks, D3 and graph/map libraries. This is sufficient tooling for an additive module. Do not upgrade the framework, add a second frontend or install a graph database to begin. Use the checkout's lockfile and runtime requirements rather than these dated declared ranges.

The capsule compiler inspected at `src/lib/cognitive-capsule/compiler.ts` exports compiler version `cognitive-compiler/0.3.0` and accepts an objective, worker role, scope/scopes, asOf, facts and maxChars. Its receipts bind capsule and source versions/digests. Native cognitive types preserve cues, patterns, heuristics, distinctions, exceptions, red flags, diagnostic questions, language rules, cases, procedures, unknowns and revision triggers. SIGNAL should use those typed structures.

The V3 context contract at `src/lib/context/capsule-v3.ts` includes human tacit knowledge, source spine, claim ledger, reasoning scaffold, agent operating contract, memory and governance review concepts. The existing canonical envelope and legacy migration paths remain authoritative. A source receipt includes representation provenance, hash and span/page/coordinate fields. Adapt SIGNAL evidence to `src/types/source-receipt.ts`; do not define a competing source receipt in each new UI component.

The runtime contract includes manual, schedule, source_update and capsule_change triggers, idempotency and bounded execution. The inspected status uses `waiting_approval`, with an underscore. Use current types instead of hand-written assumptions. Older project-library paths were absent; the integration map must locate the present workspace services.

## Responsibility map

| Responsibility | Reuse | SIGNAL addition |
| --- | --- | --- |
| Identity and access | Existing PRAXIS user/tenant/workspace services | Desk membership and role policy |
| UI | Authenticated app shell and components | `/signal`, selector, dossiers, evidence/review, briefs |
| Configuration | Current workspace storage | Versioned desk and source-pack records |
| Evidence | Approved current evidence data plane | Revision ledger, locators, typed assertions and lineage |
| Media | Private object storage and upload intake | Tier, entitlement, derived representations and timed locators |
| Interpretation | Calibrated central provider gateway | Bounded SIGNAL extraction/comparison profiles |
| Context | Native capsule service and compiler | Situation profile and tested extension adapter |
| Review/output | Existing review and artifact services | Revision-bound assessment and brief manifests |
| Dispatch | Scheduler, queue, trusted worker, AgentRun | Collection checkpoints and relevance-triggered analytical jobs |

If the assumed evidence plane is not active in the actual deployment, document the observed state and select the smallest compatible adapter before migrating. Every additional datastore increases operational cost for the solo founder. Treat graph infrastructure as optional acceleration after a canonical ledger and inspectable projection work.

## Route and service shape

Resolve file locations from the current routing conventions. Logical endpoints may be implemented through current server actions or API routes rather than copied literally:

| Capability | Request behavior | Required guard |
| --- | --- | --- |
| Create/list desks | Save validated scope and mandate; paginate owned/accessible desks | Server-derived tenant and membership |
| Update desk/pack | Compare expected revision; create new version | Editor role and optimistic concurrency |
| Capture | Store permitted source revision plus capture occurrence | Entitlement, size/type, owner binding |
| Collect | Enqueue a bounded source-pack/window job | Quota, authenticated worker and idempotency |
| Analyze | Enqueue validated interpretation for pinned inputs | Model budget and context/evidence receipt |
| Review | Append decision for exact proposal/evidence digests | Reviewer identity/role and revision precondition |
| Inspect graph | Return scoped, paginated projection and typed relations | Visibility intersection of all evidence |
| Create brief | Produce draft from an input manifest | Approved knowledge policy and explicit unresolved evidence |
| Approve/export | Pin text/input digests, review and export entitlement | Approver role and immutable artifact revision |

Return a useful conflict response for stale revisions, denied for unauthorized access, limited for exhausted quotas and partial for incomplete collection. A provider error is distinct from a desk without matching material. Avoid leaking record existence or private source titles through unauthorized errors. Every list supports pagination and a stable order.

## Capture and analysis sequence

1. Resolve a desk and pinned source-pack revision. Validate allowed sources, language/geography scope and budget.
2. Create or resume a bounded collection run. Discover metadata and preserve coverage flags. Fetch only authorized representations.
3. Commit source identity, immutable revision, capture occurrence and collection checkpoint transactionally. Record a durable source-change event.
4. Normalize/slice permitted representations and resolve deterministic locators. Relevance and duplicate triage decide which inputs deserve interpretation.
5. Compile approved situation/user/tool context with current native compiler. Record context receipts. Call the gateway with structured SIGNAL prompts and bounded inputs.
6. Validate the response schema, exact evidence spans, cross-source IDs, language/scoping constraints and input revision. Store proposed objects with execution provenance.
7. Let an authorized reviewer accept, reject, qualify or leave unresolved. Append decisions and rebuild projections without erasing previous state.
8. Generate a draft assessment and briefing from pinned inputs. A distinct review approves the artifact and its manifest. New evidence marks affected judgments for review.

Collection retry and analytical rerun keys are different. Collection key includes tenant, source-pack revision and bounded window/partition. Interpretation key includes representation revision, prompt/model profile and compiled context digest. Artifact publication key includes the exact input manifest and output revision. A changed prompt may create a new derivation without duplicating the source.

## Source updates and invalidation

Source identity is stable; captured revision content is immutable. A corrected article, changed official statement, new OCR or improved translation creates a new linked representation/revision. Track supersedes, corrects, withdraws and derived_from distinctly. Unknown original state remains unknown.

A source update finds dependent proposals, reviewed judgments, context entries and artifacts. It adds a revision trigger with reason and old/new hashes. A reviewer can retain the old judgment with an explicit rationale or create a new assessment. Do not overwrite an approved capsule or briefing in place. Withdrawal can restrict access and trigger review while retaining allowed audit metadata; retention policy determines whether original bytes must be deleted.

## Security and operational behavior

All services derive tenant context from authenticated authority, including worker/tool invocations. Never trust a browser-supplied tenant ID. Projections, search, caches, signed URLs and exports carry the same evidence visibility restrictions. A source allowed in one customer desk does not become global shared content simply because its URL is public.

Collectors enforce redirect-aware SSRF protection and current source entitlements. Limit fetch time, bytes, parse complexity, redirects and media duration. Treat source instructions as untrusted text. Disable model-initiated arbitrary network calls in extraction. Server logs record IDs, health and usage rather than secrets or private source bodies.

Use queue backpressure, durable leases, finite retries and idempotent commits. Source-health records include last attempted/successful run, lag, provider failures, unresolved saturation, panel omissions and reasons. Stop new paid interpretation at a configured cap; preserve captures and show the stop. No global automatic watch loop is part of the default product.

## Definition of a text pilot

An authorized user can choose any supported country, define a regional or multi-country scope, configure a source panel, capture and analyze permitted material, review an exact source reading, inspect evidence and graph, use native context, compare a new source revision with the last approved assessment, and approve/export a cited brief. A watched desk continues while its browser is closed. The user can see collection failures, coverage gaps, spend and stale conclusions.

The pilot is incomplete until that journey is proved with current auth/storage/provider/worker contracts in staging. Local fixtures establish specific invariants; they do not prove production integration, geopolitical accuracy, commercial demand or a service-level guarantee.
