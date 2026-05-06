# PRAXIS Phase 1 Foundation Pre-flight

Date: 2026-05-06
Source plan: `docs/phases/PRAXIS_PHASE_1_FOUNDATION.md`
GitHub remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`

## Queued Phase Order

The phase source files are now staged in `docs/phases/`:

1. `PRAXIS_PHASE_1_FOUNDATION.md`
2. `PRAXIS_PHASE_2_AGENTIC_SPINE.md`
3. `PRAXIS_PHASE_3_PRODUCT_SURFACE.md`

Do not start Phase 2 until Phase 1 has shipped and the `phase-1-foundation-shipped` tag is on `main`. Do not start Phase 3 until Phase 2 has shipped and the `phase-2-agentic-spine-shipped` tag is on `main`.

## Result

Phase 1 implementation is blocked before Lane Y. The phase plan requires a clean working tree, a `phase/1-foundation` branch pushed from `main`, a Cloud SQL instance named `praxis-pg`, and a `NEO4J_URI` Secret Manager entry. Those are not all true yet.

## Checks

| Check | Status | Evidence |
|---|---:|---|
| Codex read the phase file fully | Pass | `C:\Users\giuli\Downloads\PRAXIS_PHASE_1_FOUNDATION.md` was read and copied into `docs/phases/PRAXIS_PHASE_1_FOUNDATION.md`. |
| Repo target confirmed | Pass | Remote is `origin https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`. |
| Local `main` matches `origin/main` commit | Pass | Both resolve to `0f2b58771667f0fb9423d56097604321c2579083`. |
| Working tree clean | Fail | `git status --short --branch` shows active modified and untracked files. |
| Local `phase/1-foundation` exists | Fail | `git branch --list phase/1-foundation` returned no branch. |
| Remote `phase/1-foundation` exists | Fail | `git ls-remote --heads origin phase/1-foundation` returned no branch. |
| Active GCP project | Pass | `gcloud config get-value project` returned `praxisbytacitus`. |
| Required Cloud SQL instance `praxis-pg` exists | Fail | `gcloud sql instances describe praxis-pg --project praxisbytacitus` returned 404. Existing instance: `praxisbytacitus-instance`, Postgres 16, `us-east4`, `RUNNABLE`. |
| Required `NEO4J_URI` secret exists | Fail | `gcloud secrets versions access latest --secret=NEO4J_URI --project praxisbytacitus` returned not found, and `gcloud secrets list --filter='name~NEO4J'` returned no matches. |

## Next Safe Step

Checkpoint or otherwise resolve the current dirty working tree, then create and push `phase/1-foundation` from clean `main`. After that, either provision resources matching the phase names (`praxis-pg`, `NEO4J_URI`) or amend the phase plan to use the existing Cloud SQL instance name if that is the intended production database.
