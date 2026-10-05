# Ordered build sessions

Run each prompt from the PRAXIS worktree root. Prompt file paths below are relative to `docs/signal-build/codex/`. The build kit does not claim these phases are already implemented in PRAXIS.

| Order | Prompt | Complete result |
| --- | --- | --- |
| 00 | `phases/00_REPOSITORY_AUDIT.md` | Current checkout map, baseline checks and integration plan |
| 01 | `phases/01_CONTRACTS_AND_STORAGE.md` | Tenant-scoped canonical contracts and tested persistence |
| 02 | `phases/02_GLOBAL_DESK_UI.md` | Authenticated global `/signal` desk and truthful empty states |
| 03 | `phases/03_COLLECTION_AND_CAPTURE.md` | GDELT, RSS, supplied material, revisions and source health |
| 04 | `phases/04_TEXT_ANALYSIS.md` | Validated multilingual claim and frame proposals |
| 05 | `phases/05_REVIEW_GRAPH_CAPSULES.md` | Version-bound review, inspectable graph and native capsule adapter |
| 06 | `phases/06_ASSESSMENTS_AND_BRIEFS.md` | Continuing assessments, deltas and approved brief lifecycle |
| 07 | `phases/07_WATCHED_DESKS.md` | Durable scheduling, retries, cancellation and budget controls |
| 08 | `phases/08_PILOT_OPERATIONS.md` | Evaluation, coverage, usage and customer desk operations |
| 09 | `phases/09_MEDIA_TIERS.md` | Selectively enabled OCR, audio and video evidence |
| 10 | `phases/10_STAGING_AND_RELEASE.md` | Tested staging release, rollback and reviewable production plan |
| 11 | `phases/11_OPERATOR_HANDOFF.md` | Reproducible setup, runbook, demo and complete handoff |

Phases 01-03 build the first complete capture journey. Phases 04-06 create the valuable analytical workflow. Phases 07-08 make a text pilot operable. Phase 09 can follow the text launch. Phase 10 can release only the capabilities that passed their gates; disabled future features must stay clearly disabled.

For an interactive session, run `codex`, then paste: `Read docs/signal-build/codex/CONTROLLER.md and docs/signal/PROGRESS.md, then execute docs/signal-build/codex/phases/03_COLLECTION_AND_CAPTURE.md. Implement and test it, update progress, and report the evidence.` Replace the phase filename as needed.

The included `scripts/Start-SignalPhase.ps1` can open the same instruction in Codex, or run a noninteractive phase. See the setup document. Avoid launching dependent phases simultaneously or creating multiple independent branches that mutate the same schemas.
