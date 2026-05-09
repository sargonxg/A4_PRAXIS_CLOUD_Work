# PRAXIS v7 Production-Ready Build Todo

This is the active build list for turning the simplified PRAXIS vision into a
usable production product: Home, Ask PRAXIS, Cores, and Outputs over a powerful
context substrate.

## Definition of done

- A signed-in user can land on Home, pick or create a Case Core, edit My Core,
  ask PRAXIS, apply an Analyst Skill, and save/export an output without seeing
  legacy complexity.
- Ask PRAXIS resolves User Core plus Case Core on every turn and displays what
  it used: route, cores, context health, citations, and missing context.
- Analyst Skills are not a dashboard. They are staged through Ask PRAXIS or
  launched from the Case Core with clear structural-vs-AI labels.
- The landing page describes exactly what the app does and points to the public
  demo or waitlist without overclaiming production posture.
- The v7 path is flag-controlled, audit-guarded, mobile-usable, and deployable
  through the existing GCP/Firebase stack.

## P0 - Make the simplified app coherent

1. **Merge/checkpoint Loop A foundations.**
   - Status: PR #8 open from `v7/loop-a-foundations`.
   - Required: CI or prepared Postgres migration upgrade/downgrade proof.
   - Required: decide Alembic head strategy before prod migration.

2. **Keep the canonical execution ledger current.**
   - Status: old branch still carries the previous slice ledger; Loop A PR has
     the canonical A-G ledger.
   - Required: after PR #8 lands, rebase the richer v7 app branch and convert
     its local Slice 1-15 status into Loop B-G status.

3. **Finish My Core as a real user surface.**
   - Status: drawer hydrate/autosave works; full `/app/cores/me` editor now
     exists locally.
   - Required: browser-verify edit/save on desktop and mobile.
   - Required: make this the only obvious profile/settings writing path for v7.

4. **Make Case Core the obvious workspace object.**
   - Status: create, edit frame, fork, share, and attach picker exist locally.
   - Required: production backfill proof for legacy situations into Core IDs.
   - Required: add a clean mobile Case Core summary view for actors, timeline,
     sources, graph, outputs.

5. **Make Ask PRAXIS feel like the product.**
   - Status: Ask route, runtime panel, core resolver, routing receipts, and
     local fallback exist locally.
   - Required: remove visual competition from legacy `ChatInterface` when v7 is
     enabled, or collapse it behind "advanced legacy chat".
   - Required: stream responses or show a polished progress state.
   - Required: make Skill execution results saveable into Outputs.

## P1 - Make value visible in the first 90 seconds

6. **Home should be a command center, not a dashboard.**
   - Show active Case Core, Ask box, three best next actions, and three likely
     Analyst Skills.
   - Hide legacy widgets unless the user opens Advanced.
   - Mobile first: the Ask box and Case Core chip must be first screen.

7. **Analyst Skills should be consolidated and useful.**
   - Keep all implemented tools behind the scenes.
   - Expose no more than 8-10 first-party Skills at launch.
   - Route the rest through Ask PRAXIS ranking and advanced search.
   - Each visible Skill needs: input from cores, execution status, result,
     citations, save/export path, cost/posture label.

8. **Outputs need an end-to-end happy path.**
   - From Ask: "Create handover" -> draft -> cite -> export MD/DOCX/PDF.
   - Persist as Output Core.
   - Display provenance integrity before export.

9. **Landing page must match the real app.**
   - Position: "the AI knowledge layer for policy and political analysis."
   - Show simple Home/Ask/Core/Outputs flow, not internal architecture.
   - Remove claims that are not backed by current production behaviour.
   - Verify mobile hero and graph animation.

## P2 - Production confidence

10. **Runtime proof over static audits.**
    - Add a v7 browser smoke that covers Home -> My Core edit -> Case Core
      create -> Ask -> Skill -> Output.
    - Add backend contract tests for `/cores/me`, `/cores`, `/ask/run`, and
      cross-tenant denial.
    - Add a production smoke script that can run against `praxis.tacitus.me`
      with a test user.

11. **GCP/Firebase readiness.**
    - Refresh gcloud/ADC and make `audit:gcp` green locally or in CI.
    - Confirm Firebase Auth, Firestore metadata, Cloud SQL, Secret Manager,
      Cloud Run revisions, and v7 flag state.
    - Keep `COGNEE_ENABLED=false` honest in UI until production memory is
      proven.

12. **Migration and data posture.**
    - Run 0019/0020 upgrade/downgrade against ephemeral Postgres.
    - Decide and document Alembic multiple-head strategy.
    - Run lazy backfill for existing situations into Case Cores behind a dry-run
      and audit log.

## P3 - Polish

13. **Reduce visual noise.**
    - One primary action per screen.
    - No nested cards inside cards.
    - Keep text contrast at slate-700 or darker.
    - Keep mobile tap targets at least 40px high.

14. **Make AI honesty visible.**
    - Every Ask/Skill result shows whether it is local fallback, structural,
      staged, or calibrated AI.
    - Every saved output shows core/citation basis.
    - Thin context asks for the next source or Case Core field instead of
      pretending confidence.

15. **Ship rhythm.**
    - One PR per loop or regression.
    - Every PR updates `STATUS.md`, `FIX_LOG.md`, this file, and the audit that
      would catch the same issue next time.
