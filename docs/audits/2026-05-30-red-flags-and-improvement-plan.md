# PRAXIS Red Flags And Improvement Plan

Date: 2026-05-30
Status: active post-ship improvement ledger

## Production Posture

Baseline verified live revision before this documentation pass:

- Repository: `sargonxg/A4_PRAXIS_CLOUD_Work`
- Branch: `main`
- Live domain: `https://praxis.tacitus.me`
- Frontend service: `praxis-frontend`
- Last verified commit: `4098b1bcff7e4418be69afb1431a5252428384f6`
- Last verified revision: `praxis-frontend-00915-kbt`
- Runtime health: `/api/health` and `/api/health/runtime` returned `ok`

This document is the current queue for issues that are not blockers for the
deployed app, but matter for product quality, agent trust, and team handoff.

## Red Flags To Track

| Area | Current signal | Severity | Next action |
| --- | --- | --- | --- |
| Authenticated live E2E | Public smoke passes, but authenticated browser smoke still needs `TEST_FIREBASE_EMAIL` and `TEST_FIREBASE_PASSWORD` in the shell. | High | Run the authenticated production lane with the disposable Firebase account and record the run id, capsule id, memo id, and cleanup result. |
| Tool operating contract | `tool-contracts-2026-05-30` shows 51/55 tools pass the 6/7 threshold; four tool ids lack route/page coverage. | Medium | Either retire hidden tool ids from user-facing registries or add explicit cockpit actions/pages where they are meant to be live. |
| Deep pre-ship warnings | `2026-05-30-DEEP_PRESHIP_CHECKLIST` reports two model-string warnings for allowlist review. | Medium | Centralize any remaining direct model markers under the model-routing matrix or update the static audit allowlist with evidence. |
| Local vs production env | Local shells can still lack Firebase Admin, agent ledger, worker target/auth, or model env while production health is green. | Medium | Keep runtime docs explicit: local env gaps are not production outages, but cannot prove authenticated golden paths. |
| Dependency audit | `npm audit --audit-level=moderate` fails on AI SDK provider-utils and Genkit/Anthropic transitive advisories; suggested fixes are breaking `--force` upgrades. | Medium | Assign a dependency-curator pass for AI SDK and Genkit/Anthropic transitive advisories; avoid `npm audit fix --force` without a compatibility branch. |
| Cognee and Polar | Health reports Cognee memory and Polar as unconfigured/disabled, which is acceptable only while those features stay gated. | Medium | Keep disabled-first UI copy honest and do not present Cognee memory or paid checkout as fully live until configured. |
| Historical audit sprawl | Many dated audit snapshots remain useful evidence but make docs harder to scan. | Low | Keep generated historical audits, but route users through `docs/audits/README.md` and latest dated ledgers. |
| Graph visualization size | `graphify update .` skips HTML when the graph exceeds 5,000 nodes. | Low | Treat `graphify-out/graph.json` and `GRAPH_REPORT.md` as canonical; do not require HTML for this repo size. |
| Tracked local logs | Root `.next-*.log` files are tracked historical artifacts and can confuse new agents. | Low | Review whether they are still intentionally tracked; delete only with a small cleanup commit if no scripts reference them. |
| Release note drift | Release note audit passes, but build metadata can lag product copy if docs-only changes skip app constants. | Low | For behavior changes, update release notes and app build constants in the same commit as code. |

## Ten Important Improvements

1. Capsule authoring studio
   - Add a polished edit/review loop for each capsule section: identity,
     sources, tacit knowledge, ontology, graph proposals, output goal, and
     review gates.
   - Keep all mutations human-reviewed and persisted through the existing
     ContextCapsule service.

2. Capsule quality evals
   - Build a small policy-work eval set comparing generic LLM answers against
     PRAXIS capsule-augmented answers.
   - Score sourceability, specificity, tacit-context use, review caution, and
     output usefulness.

3. Graph and ontology workbench
   - Turn the current graph/ontology panel into a readable proposal explorer:
     canonical nodes, proposed nodes, missing evidence, and promotion history.
   - Preserve the review-card boundary for every graph mutation.

4. Boardroom depth
   - Make `/app/boardroom` run a simple but rigorous chaired workflow:
     chair, policy analyst, legal/compliance reviewer, sourceability reviewer,
     red-team skeptic, and stakeholder lens.
   - Keep it one composer first, with source-bound synthesis and no fake agent
     status.

5. Agentic proof rail
   - Show one compact timeline for each agent run: queued, dispatched, worker
     started, sources used, approvals requested, output saved, and returned to
     the same Ask thread.
   - Make degraded states visible without sending users to admin surfaces.

6. Memo sourceability gate
   - Extend paragraph-level sourceability in MemoDesk so users can turn weak
     paragraphs into cautious rewrites or evidence-gap review cards.
   - Block "export-ready" state for policy memo and compliance note outputs
     until sourceability has been checked.

7. Visual system refinement
   - Continue the Civic Atelier direction with denser policy-work surfaces,
     clearer typography hierarchy, restrained cards, better iconography, and
     mobile-safe capsule/boardroom layouts.
   - Avoid generic SaaS gradients and decorative clutter.

8. Firestore capsule backfill and migration proof
   - Add a dry-run/admin lane that reports which user-owned capsules are still
     missing v15 starter metadata, source posture, ontology hints, or review
     gates.
   - Backfill only missing metadata and preserve user edits/version history.

9. Live authenticated golden path
   - Run a production proof with a disposable test user: login, create capsule,
     ask with source receipts, open draft, run sourceability, save memo, and
     verify cleanup.
   - Make this the recurring release canary.

10. Documentation consolidation
    - Keep `README.md`, `docs/README.md`, `docs/product/README.md`, `STATUS.md`,
      `TODO.md`, and `CHANGELOG.md` synchronized.
    - Keep historical dated audits available but stop treating old planning
      documents as current source of truth unless the index points to them.

## Documentation Cleanup Decision

No exact duplicate Markdown files were found outside `docs/_archive` during
this pass. Historical dated audits are retained because they are evidence and
some audits still reference older filenames. The cleanup action is therefore
consolidation by index and status updates, not broad deletion.

Safe deletion candidates for a future small cleanup commit:

- tracked root `.next-dev*.log` and `.next-start*.log` files, if no script or
  audit references them;
- old generated audit snapshots after `docs/audits/README.md` has a retention
  policy and no audit depends on those paths;
- stale prompt packs only after the active prompt pack and product index no
  longer reference them.
