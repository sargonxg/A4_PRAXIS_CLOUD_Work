# ContextCapsule Quality, Rating, and Enrichment Audit

Date: 2026-05-20

## Conclusion

Keep Firestore ContextCapsules canonical. Cognee, Graphiti/Zep, Mem0, grounded search, and Exa-style research should feed retrieval receipts and reviewable improvement proposals, not mutate canonical capsule content directly. User-facing stars should measure usefulness in real work, while readiness stars, health, trust, evaluations, and quality audits remain separate quality signals.

## Current Database Map

- Canonical capsule documents are owner-scoped at `users/{uid}/capsules/{capsuleId}` through `src/lib/context/capsule-service.ts`. The persisted shape includes `coreRefs`, provenance, access policy, community profile, trust semaphore, health, active situations, version, and optional `starterSnapshot`.
- Existing community fields already support `userRating`, `averageRating`, `ratingCount`, `favorite`, tags, marketplace listing, and publish metadata. Existing access policy includes `allowCommunityRating`.
- `POST /api/context/capsules/[capsuleId]` already accepts `{ action: "rate", rating }` and calls `rateCapsule`. The route rejects demo/sample mutation before rating.
- Capsule details are stored in subcollections through `src/lib/context/capsule-details-service.ts`: `notes`, `evaluations`, and `memories`. Capsule spans, history, source/document attachment, and Capsule+ export/import have separate capsule-scoped routes under `/api/context/capsules`.
- Capsule+ is a portable bundle with `manifest.json`, `capsule.json`, graph `nodes`, `edges`, `proposals`, `sourceReceipts`, and Postgres seed SQL. Import enforces owner match and review state constraints before graph rows become canonical.
- Graph proposal boundaries are already review-gated: PRAXIS stores graph proposals separately and promotes only approved rows. This should be reused for capsule improvement proposals.

## Current UX Map

- `/app/capsules` is implemented inside `TaskletPraxisWorkbench`; repository compatibility redirects into the capsule surface instead of adding a new route.
- Cards already expose capsule type, domain, policy team, source posture, reasoning style, health, source/document/tool/output readiness bars, starter shelf, repository lane, and inspector affordances.
- The inspector already separates rich profile fields, device profile fields, source pack, starter excerpts, suggested questions, next actions, and anatomy.
- Gaps: the workbench summary type only carries minimal `community`; starter summaries omit explicit disabled rating state; there is no real star control on cards or inspector; rating is not visually distinguished from readiness/health/trust.
- Starter fallback cards should remain read-only. Usefulness rating should be disabled until the starter is saved or forked into a user capsule.

## Current Content Quality Map

- Starter catalog taxonomy is broad: situation, tool, output, and user starters carry `type:*`, `domain:*`, and `team:*` tags.
- Starter content has source packs, excerpts, readiness stars, rich profiles, agent workflow hints, recommended tools, output targets, compatibility, and device profiles for intellectual tools.
- Existing tests already check source pack size, HTTPS URLs, source dates/publishers, readiness stars, rich profile completeness, device method steps, best inputs, expected outputs, failure modes, human review gates, and sourceability requirements.
- Remaining gap: no single audit helper produces an actionable scorecard or reviewable proposal list from those checks. The checks live as assertions, not as product-facing quality data.

## Provider Benchmark

- Cognee is an open-source memory platform built around relational, vector, and graph stores; its documented user operations are remember, recall, improve, and forget. This makes it useful as an optional enrichment/recall layer, but its multi-store architecture would duplicate PRAXIS canonical Firestore and review-gated graph records if promoted to source of truth. Source: https://docs.cognee.ai/core-concepts/overview
- Graphiti/Zep focuses on temporal knowledge graphs for dynamic agent applications. It is strong where changing facts, historical context, and hybrid semantic/full-text/graph search matter, but PRAXIS already review-gates graph promotion and should treat Graphiti as a future temporal proposal source rather than canonical capsule storage. Source: https://help.getzep.com/graphiti/getting-started/overview
- Mem0 positions itself as a universal, self-improving memory layer for LLM applications with managed and open-source options. It is a plausible recall provider, but its value is memory personalization, not capsule governance. Source: https://docs.mem0.ai/introduction
- LangChain context engineering frames agent reliability around passing the right context, tools, model, and response format. This supports PRAXIS’s capsule posture: capsules should compile model-ready context and agent instructions, not just store raw memories. Source: https://docs.langchain.com/oss/python/langchain/context-engineering
- Gemini grounded search returns `groundingMetadata`, including search queries, source chunks, and supports for inline citations. PRAXIS should preserve this as sourceability evidence and receipt metadata. Source: https://ai.google.dev/gemini-api/docs/google-search
- Exa Research is designed for multi-step, source-reading investigations with explicit instructions and constrained schemas. This fits reviewable capsule improvement proposals and quality audits, not automatic canonical mutation. Source: https://exa.ai/docs/reference/exa-research

## Implementation Checklist

- Add explicit `CapsuleUsefulnessRating` contract to workbench summaries: user rating, average rating, count, enabled state, and disabled reason.
- Render compact star controls on cards and inspector with `lucide-react` icons; POST to the existing rating API and refresh the capsule after rating.
- Disable star controls for starter fallback templates and explain that the user must save/fork first.
- Keep readiness stars, health score, trust label, evaluations, and user usefulness rating visually separate.
- Add a deterministic starter quality audit helper returning taxonomy, sourceability, expert-method, agent-usability, review-gate, and content-depth scores.
- Add review-gated improvement proposal types and helper output. Proposals may suggest tags, source gaps, device refinements, memory notes, or agent instruction improvements, but must stay in `proposed` review state until explicitly applied.
- Surface enrichment receipts as canonical Firestore status, Cognee status, memory hit ids/count, warnings, and writeback proposal ids. Do not write Cognee hits into canonical capsule subcollections automatically.
