# PRAXIS final publication and acceptance, 30 September 2026

Publication is authorized. This receipt records the chat-first release, the subsequent [anti-slop review](2026-09-30-anti-slop-review.md), and real-service acceptance. It supplements the [implementation receipt](2026-09-30-praxis-chat-first-release.md).

## Release identity

The first release was served from `7a56d33822c2e0aa28e25fec792bcb1750f524ac`, automatic Cloud Build `3239045f-58f9-4266-9a93-0e579a886572`, revision `praxis-frontend-01085-j5w`, 100% production traffic. Build and revision agreed on image `sha256:7b9204ea951d1e5368e9241d476e9e81059bb6b7b40c708d8ff4aec1d7353d55`. Public health/runtime returned 200; unauthenticated private capsule/run APIs returned 401.

Final refinement identity and acceptance: pending the integrated gate and publication below.

## What changed

Chat and Capsules are the primary routes. Login and optional onboarding lead to the same workbench. Users can upload TXT, PDF and Word sources, review capsule proposals, inspect the evidence map, attach a numeric saved version, return to conversations, and preview a bounded context handover.

The anti-slop pass shortened default Guide copy from 657 to 159 words and Learn from 436 to 229. Necessary technical limits remain in native disclosures. It removed unsupported universal agent/onboarding promises, corrected the operator identity, simplified repeated page sections, and fixed notification names, keyboard actions, focus return, heading semantics and contrast.

The same-minor gRPC patch changes the existing override and resolved lock entry from `1.14.4` to `1.14.5`. All 14 high dependency findings propagated from [GHSA-m9gg-hp2v-232j](https://github.com/advisories/GHSA-m9gg-hp2v-232j), published on 30 September 2026. The documented vulnerable inbound-server configuration was not found in PRAXIS; the production cloud/Firebase dependencies still warrant the patch. `npm ls --all` passed with all six consumer paths on the patched version. Fresh audit: zero high/critical, 44 moderate and three low remaining. No major upgrades or unrelated lock changes were made.

## Failures found through real-service checks

- The initial capsule canary stopped at proposal creation with 429 `ai_usage_limit`. All three document formats had uploaded and extracted successfully. Capsule assists compile supplied material and fixed templates without a provider; the final change removes inappropriate AI charging while preserving authenticated account, ownership, throttling and bounded-input checks. Model-backed analysis still reserves funded capacity.
- The first handover acceptance stopped at memo save with 500. Cloud logs identified an undefined optional `changeNote` in the Firestore version. The final change sanitizes optional data at persistence and tests strict undefined rejection.
- Signed-in rendered checks found an unnamed notification control, duplicate page heading, invalid graph-region ARIA and low-contrast labels. These findings were corrected before the final gate.
- A funded retry proved uploaded-original retrieval, proposal rejection/application, persisted numeric versions and chat attachment. It then stopped at Ask because the initial synthetic allowance was below the actual Ask cost. The configured acceptance account received bounded nonmonetary test capacity, with an auditable transaction. No account, recovery message, credential or paid purchase was created. These failed attempts are not counted as passing end-to-end analysis.

## Final checks

| Check | Result |
| --- | --- |
| Mandatory integrated source gate | Refinement passed: typecheck, build, lint (zero errors/five existing warnings), repo shape, audit gate, architecture, GCP and AI route checks; 436 files/2,338 tests. Pre-push fetch found four newer main commits; combined-source gate pending. |
| Deployed source/build/revision identity | Pending |
| Real login and protected routes | Passed on the first release; final rerun pending |
| Real TXT/PDF/DOCX to capsule, review, attachment, Ask and server-history reload | Pending final rerun |
| Real reviewed handover, stale-preview refusal, temporary download and payload integrity | Pending |
| Public/signed-in responsive and accessibility acceptance | Public first-release 30/30 passed; final rerun pending |

Evidence is held under `C:\Users\giuli\output\praxis-chat-first-baseline`. Private account history, identifiers and signed download URLs are excluded from public source receipts.

## Practical limits

Capsule pinning fixes the capsule record and document references; referenced source bodies and optional current workspace/web dependencies are not immutable historical snapshots. Inspection opens the current saved capsule and labels that distinction. Handover exports a bounded context projection and references, not source originals, their permissions or universal import support. Hashes prove byte integrity, not sender identity or analytical approval. Link expiry does not delete the stored package, and failed compensation can require operational cleanup.

PRAXIS remains experimental software operated by Giulio Catanzariti. Paid access and automated account erasure remain disabled. Software acceptance with synthetic material does not establish analytical accuracy, scanned OCR, large-document capacity, customer outcomes or production load capacity. Dependency findings and remaining operator decisions retain their recorded scope.
