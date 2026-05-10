# 0037 - User Models As First-Class Versioned Artifacts

## Status

Proposed

## Context

The v5 MVP is built around three buyer-facing analyst personas. PRAXIS needs a
durable representation of the user's role, mandate, audience, methodology,
style, standing assumptions, prohibited frames, and source preferences. Without
a first-class User Model, those details remain scattered across prompts,
settings, and one-off route logic.

## Decision

Treat User Models as first-class product artifacts. The MVP starts with three
seeded public User Models and allows users to fork private copies. Versioning
is the architectural direction, with MVP implementation permitted to ship a
current/draft path first when the phase prompt scopes append-only history to a
later step.

## Consequences

- Ask PRAXIS, Methods, Context setup, and Drafting can share a consistent
  representation of the user's work posture.
- Public seed models remain read-only.
- Private forks must be owner-scoped.
- Version history must be append-only once implemented.

## Alternatives Considered

- Store persona settings only in profile preferences. This is too weak for
  repeatable work-product generation.
- Keep personas only as prompts. This is hard to audit and easy to drift.
- Delay User Models entirely. That weakens the three-persona MVP demo arc.

## References

- `docs/architecture/PRAXIS_VISION_v4_01_VISION.md`
- `docs/architecture/PRAXIS_VISION_v4_03_BUILD.md`
- `docs/build/PRAXIS_v5_BUILD_02_BACKEND_PHASES_0-3.md`
