# PRAXIS chat-first release

Date: September 30, 2026. Implementation is in the isolated `improve/praxis-chat-first` checkout, reconciled against `9e95085f60e85bae8b4877f5548d6efd39dea79c`, retaining the preceding `2441af6ccecc343d7201ef31e75993c32422128c` wave. Prior refinement/onboarding/Rules changes are a separate baseline, not authorship claimed by this release. Publication and real-service receipts will be appended after acceptance.

## Resulting experience

- Chat and Capsules are the primary navigation. Saved conversations, new threads, mobile navigation and global search use the same authenticated shell. Research controls and context roles remain available through disclosures.
- Login uses Google or email; onboarding has a visible Finish later path. Access is presented as free experimental software. Server checkout is disabled unless deliberately enabled by the operator.
- Capsule creation uses Purpose, Material, and Review/save. Save and use in chat uses the just-saved capsule version. The private library has explicit inspection and attachment actions.
- Capsule inspection has Overview, Evidence, Timeline, and Review tabs, a graph synchronized with accessible lists, claim-to-source tracing, and expandable method/ontology/runtime details. The native dialog contains keyboard focus and restores focus and scroll when closed. Inspection does not silently attach context.
- Active Ask context resolves exact owner/capsule/version references before provider work. Unavailable, archived, malformed or fractional pins return recoverable errors instead of substituting latest context. Unpinned legacy context reports the actual resolved version.
- Saved memo versions retain immutable context snapshots. Handover previews expose review scope, limitations, exclusions and unresolved dependencies; generation requires the matching preview hash. ZIP payloads contain readable memo/context/source-reference files, PDF, Word, and SHA-256 integrity records.

## Experimental and privacy boundaries

PRAXIS is independent experimental software operated by Giulio Catanzariti; TACITUS is not represented as an incorporated entity. Mandatory rights remain intact. No retention schedule, service commitment, certification or analytical accuracy claim has been invented. Automatic Google Analytics/Firebase Analytics initialization is removed. Existing authentication, App Check, Firestore and signing configuration are preserved.

Next.js and its matching tooling were patched to 16.3.7 after a critical advisory was found. The refreshed production dependency audit has zero high/critical findings; 44 moderate and three low findings remain.

## Evidence and acceptance status

Local evidence lives in `C:\Users\giuli\output\praxis-chat-first-baseline`, outside the release source. It contains the captured baseline, reconciliation patch, mandatory gate logs, dependency audit, Graphify refresh, full test logs, public/fixture browser logs and rendered accessibility reports.

- Independent source review found no remaining blocker in the reachable chat/capsule/handover paths. Review-driven fixes cover version substitution, malformed persisted pins, stale memo context, account deletion races, legacy provenance recovery, readable conflict messages and inspector keyboard boundaries.
- Complete integrated mandatory gate passed, including TypeScript, production build, route/capsule/agent/architecture/surface/runtime/simplification checks and GCP readiness. The final graph/copy refinement also passed its subsequent production build. Full lint has zero errors and five existing warnings.
- Final clean whole-suite run: 436 files / 2,304 tests passed, with no skips (`pinned-evidence-final-vitest.log`). The final complete mandatory gate also passed (`pinned-evidence-final-audit-gate.log`). Focused runs, including 17 graph/studio/workbench tests, verify first-frame spacing/captions and initialized, measured, one-time fit regressions; they are not added to the whole-suite unique count. The baseline Cloud Build environment/secret-preservation test is retained.
- Public browser regression: eight tests passed. Rendered public acceptance: 30 route/viewport combinations across 320, 390, 768, 1024 and 1440 pixels passed HTTP, single heading, overflow, and WCAG A/AA axe checks. Login, pricing, guidance and privacy/terms were included.
- Complete loopback-only mocked readiness run: two browser journeys passed. They cover capsule save/edit/attachment, isolated threads, error retry, all inspection tabs, keyboard focus, mobile widths, scroll recovery, exact saved memo text, edit/reopen, separate feedback, human-review-required downloads and explicit legacy no-capsule recovery. Later fitting refinement has a final rendered checkpoint below; API/auth fixtures never run against production.
- Final Graphify AST refresh produced 18,509 nodes; clustering produced 881 communities and removed the stale oversized HTML. Terraform/SQL parser extras were unavailable. This map supports maintenance and is not runtime correctness proof; generated graph output is excluded from the release commit.
- Real authenticated persistence, TXT/PDF/DOCX intake, later capsule-aware Ask, saved history, and handover preview/download must be verified against the exact deployed release. Mocked API/auth journeys and health checks do not establish those results.

## Material limitations

1. Chat resolves the attached capsule version; the inspection link opens the current saved capsule, explicitly labelled as such. Exact historical inspection is not implemented. Workspace/web research can add current sources separately when allowed by the request. Context details explain how to request attached sources only; capsule pinning does not freeze the entire workspace or external world.
2. Handover exports a bounded, sanitized context projection and source references. It does not transfer original source permissions, raw documents, secrets, private/tacit notes, or a universal recipient import integration. Integrity hashes are not sender authentication or analytical approval. Temporary-link expiry does not erase stored packages.
3. Storage compensation can fail and requires operational cleanup; cross-store atomic erasure is not promised. Account erasure remains disabled pending independent Rules/Storage/lifecycle proof. Paid billing, provider cancellation and fresh-account recovery are separate operational gates.
4. The inactive MemoDesk/LazyMemoDesk caller has no production route or shell consumer. Its save-time context association is not generator provenance; bind its writer request to an exact pin before activating it. Reachable tasklet memo saving and export use immutable recorded context.
5. Synthetic acceptance establishes software behavior, not policy correctness, OCR coverage, capacity, universal interoperability or outcomes for users.

See the [implementation plan](2026-09-30-praxis-chat-first-plan.md), [inspection review](2026-09-30-praxis-capsule-inspection.md), [handover research](2026-09-30-context-handover-research.md), and the separate [prior refinement release](2026-09-30-praxis-live-release.md).

## Final reconciliation checkpoint

The complete mandatory `audit:gate` passed after incorporating main `9e95085f`, including its onboarding persistence/error safeguards and Rules error sanitization. Log: `reconciled-release-audit-gate-final.log`. Final whole-repository lint passed with zero errors and five existing navigation warnings (`reconciled-release-lint.log`).

The first combined-source whole Vitest run passed 434 files / 2,276 tests but failed the route-cleanup audit's 30-second setup hook; its two assertions did not execute. The large refreshed maintenance graph exposed repeated text scans. This is recorded as a failed run, not passing/skipped acceptance. Equivalent indexed counting reduced profiled audit time from 14.1 to 2.0 seconds, retaining the 30-second hook and original assertions; four focused tests and scoped lint passed. The subsequent final clean whole-suite run passed all 436 files / 2,304 tests with no skips.

Final independent review then found that the supplemental Ask evidence pack could reload a newer capsule after primary pinned-version resolution. Chat now supplies its resolved owner/version-validated snapshot, retrieval is bounded to that snapshot's document references, empty selections never widen, and unversioned generated digests/history/memory are omitted from the pinned pack. Generic unpinned worker enrichment is preserved. Runtime regression gate: 41 tests across four suites; two real chat-handler regressions confirm exact snapshot forwarding and recoverable 409 before model/stream/database work. Reviewer independently passed the overlapping 23-test evidence-pack suite and closed the blocker. Document bodies remain current owner-scoped records rather than immutable deep source snapshots.

The phrase "use only the attached saved capsule" also had an intent-parsing gap that could permit wider workspace retrieval. Two regression cases failed before the narrow modifier correction. Afterward, 56 tests across three routing suites passed, including quoted/conceptual restrictions, local supplied-only work and retained external research. Root's parser/test/context-disclosure lint passed. All source and tests remained frozen through the successful final complete gate and whole-suite run.

Captured rollback baseline: source `9e95085f60e85bae8b4877f5548d6efd39dea79c`, Cloud Run revision `praxis-frontend-01084-s8p`, 100% production traffic. Its Cloud Build was `d7d99db1-a0d2-4ff9-9525-04f82dcc0982`. This is the preceding release, not the new UX deployment.
