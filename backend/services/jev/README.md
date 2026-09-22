# Optional JEV review adapter

This module is local, import-safe without the SDK, disabled by default, and not
wired into a route or deployed. It performs no persistence, capsule promotion,
tool execution, or automatic routing. Results are advisory review material.

## Contract

`await JevAdapter(JevConfig(...)).evaluate(state=..., questions=...)` returns a
`JevResult` (`dataclasses.asdict` makes a JSON-ready response) with
`contract_version="jev-review.v1"`, `advisory_only=True`, `status`, `model`, and
`answers`. Only `status="ok"` contains answers. Other statuses are `disabled`,
`unconfigured`, `unavailable`, `invalid-input`, `timeout`, `provider-error`, and
`invalid-response`; none means a successful review or approval.

State accepts JSON text/object/array. Questions are named dictionaries with
`type`, nonempty text `instructions`, and, for Choice/Score, `criteria`:

- `choice`: 1-255 named options mapped to text descriptions or null.
- `score`: 2-10 ordered text descriptions; scores range from zero to count minus one.
- `noul`: a yes/no instruction; the returned value is a probability, not a verdict.

The adapter intentionally supports this narrow text rubric subset of the SDK.
It caps requests at 32 questions and 64,000 encoded bytes, rejects non-finite
numbers, validates response names/types/options/probabilities/confidence/ranges,
and returns no partial answers. Choice/Score answers include `value`,
`confidence`, `probabilities`; Noul includes only `type` and `value`.

## Later integration

1. Resolve and test an optional backend dependency extra against the official
   `typesafe-sdk==0.7.1` source API inspected on 2026-09-22. The upstream main
   manifest declares Python >=3.10, pydantic >=2.12, httpx2 >=2.0 and tenacity >=9.
   This checkpoint neither installed the package nor verified a package-index
   release or compatibility with the complete backend lock/dependency graph.
2. Explicitly construct `JevConfig(enabled=True, api_key=server_secret,
   model="jev-latest", timeout_seconds=5)`. Proposed operator variables are
   `JEV_ENABLED=true` and server-only `TYPESAFE_API_KEY`; this module does not
   automatically read environment variables. Keep setup distinct from user opt-in.
3. Wire a calibrated/authenticated Next.js route through the existing private
   backend OIDC bridge. Scope state to the authenticated user's selected claim,
   draft, and source excerpts; require explicit review selection. Do not send an
   entire conversation or capsule store by default. Keep credentials server-only.
4. Render results inside the existing conversation/workbench, including actual
   returned model and unavailable/timeout states. Evaluate domain-specific rubrics
   on labeled examples before making any thresholds consequential. A model's
   confidence is not independent verification of a claim.

The client pins the official API origin, disables automatic retries, uses an
HTTP timeout and an async overall deadline, and closes the SDK client. The model
alias may move; pin an evaluated version before tuning thresholds. Do not enable
SDK debug/body logging for user content. No live calls or credentials were used
to validate this checkpoint; tests replace the SDK boundary.

## Sources

- [Official SDK](https://github.com/typesafe-ai/typesafe-sdk-python)
- [Python usage](https://docs.typesafe.ai/sdk/python/)
- [Async client and timeout contract](https://github.com/typesafe-ai/typesafe-sdk-python/blob/main/src/typesafe_sdk/_core/client/aio/client.py)
- [Response types](https://github.com/typesafe-ai/typesafe-sdk-python/blob/main/src/typesafe_sdk/_core/response_types.py)
- [Score semantics](https://docs.typesafe.ai/primitives/score)
- [Model aliases](https://docs.typesafe.ai/models)
- [Reference use cases, not an application fork](https://github.com/kenhuangus/jev-usecases)

Run from repository root: `python -m pytest backend/tests/test_jev_adapter.py -q`.
