# PRAXIS publication and acceptance

Published at [praxis.tacitus.me](https://praxis.tacitus.me). The chat-first experience and [anti-slop review](2026-09-30-anti-slop-review.md) are released. The user's final instruction was to publish the completed work and close; further deep live acceptance was deferred.

The [integrated release record](2026-09-30-praxis-live-release.md) and [80-item improvement analysis](2026-09-30-praxis-improvement-analysis.md) record dated user journeys, public checks and remaining work.

## What changed

Chat and Capsules are the primary routes. Google/email login leads to the same workbench; onboarding is optional. Capsule creation follows Purpose → Material → Review and save. Inspection combines Overview, Evidence, Timeline and Review with a real evidence map, accessible lists and source tracing. Secondary tools and technical detail open when needed.

The requested [anti-slop guidance](https://github.com/miqdadbadjuber/anti-slop), snapshot `91f12ec67e9de6043cfd93b846404986ba73c3f4`, informed the review without a global installation/config change. Default Guide copy fell from 657 to 159 words; Learn from 436 to 229. Repeated badges/instructions and unsupported promises were removed. Branding, plain-language starter actions, notifications, keyboard focus, headings and contrast were refined.

PRAXIS remains experimental software operated by Giulio Catanzariti, without an incorporated TACITUS entity. Optional analytics initialization, paid checkout and automated account erasure remain disabled. The frontend deployment explicitly keeps checkout disabled while preserving other operator settings and secret mounts.

## Technical changes

- Exact owner/capsule/version guards run before funded analysis. Deterministic capsule preparation uses supplied material and fixed templates without charging AI allowance.
- Memo context is captured at save time. Handover requires exact body/version review and the current preview hash; stale or missing confirmation is refused. ZIP packages include Word, PDF, readable context/source references and an integrity manifest.
- Handover origin validation uses the configured trusted public HTTPS origin across Cloud Run proxies, without trusting forwarded host headers.
- Background supervisor reviews retain the original capsule version through approval and memo persistence. Failed revision retains the original draft/findings and reports the failure. Successful generation does not automatically mark findings resolved.
- Failed/cancelled/expired retries create a fresh child/task, clearing parent dispatch, approvals, checkpoints and outcomes while keeping captured context, tools, governance and bounds. Strict elapsed deadlines work before the sweep updates the parent; malformed/future deadlines are refused. Genuine failed dispatch on a still-live run retains its recovery path.

Expired runs cannot acquire/renew/own an execution lease or persist a result. An already in-flight provider request is not cancelled at session expiry; separate attempt/phase timeouts remain. Initial API output does not expose raw captured metadata, so local reset/inheritance proof must be distinguished from later live context-read/memo proof.

## Served release

| Item | Verified value |
| --- | --- |
| Source | `52102b5c4e775a0744a16af96c01e3a09e350123` |
| Automatic Cloud Build | `ab92d5af-8c20-4a97-ae7d-4b501794a972`, SUCCESS; finished 2026-10-01T01:58:54Z |
| Ready revision / traffic | `praxis-frontend-01099-wpp`, 100% |
| Image digest | `sha256:2ba62252139929c26393507c51f30b145454c18d545da07008afa03222e94a09` |
| Canonical health/runtime | HTTP 200 / ok, exact source/build/revision; root independently verified at 2026-10-01T02:00:49Z |
| Source CI | [Verify Main 36802901865](https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work/actions/runs/36802901865) and [Persona Smoke 36802901867](https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work/actions/runs/36802901867): SUCCESS |
| Configuration preservation | Both immediate/original baseline comparisons passed all 21 checks; zero changed operator environment values or secret bindings; paid checkout false. |
| Private unauthenticated APIs | AgentRuns and capsules returned 401. |

Upstream history is preserved through `01a954972892121764974538c863cbeccb094b4a`, including signup identity synchronization, mobile answer wrapping and guide-link contrast. The older upstream build completed before the final deployment. One main push triggered the release; no duplicate manual build was submitted. This receipt is a documentation-only follow-up and does not redeploy the frontend.

## Checks and remaining acceptance

| Check | Result and scope |
| --- | --- |
| Local release gate | All nine steps passed: typecheck, production build, lint (zero errors/five existing warnings), repo shape, integrated audit, architecture, GCP, AI routes and full unit suite. |
| Source binding | Initial gate phases ran on `489b037d`; the sole later upstream change was guide emerald-700 → emerald-800. Scoped guide lint and the final unit suite ran on `52102b5c`; its exact Cloud Build preflights and production compile passed. |
| Full unit suite | 443 files / 2,623 tests passed. |
| Retry regression | RED reproduced 10 failures; GREEN passed 37 tests across four suites, scoped lint/diff checks and independent review. |
| Dependency audit | Zero high/critical; 44 moderate and three low remain. Matching Next.js tooling and gRPC received scoped patches. |
| Maintenance graph | Final `52102b5c` binding/hashes passed: 18,627 nodes, 40,920 edges, 888 communities; no dangling endpoints. Coverage excludes four SQL, six Terraform and 62 unclassified files. |
| Prior real capsule/chat journey | TXT/PDF/DOCX intake, proposal rejection/application, saved v2, attachment and real Vertex Ask reached a persisted source-aware answer. A stale empty-composer test assertion failed afterward and was corrected. Read-only recovery passed on `18dd6e39`. This is historical journey evidence. |
| Final live handover, worker and visual acceptance | Pending/deferred at the user's instruction. No final child retry/approval, provider generation, handover-download rerun or public/authenticated render run was started. |

The first final-candidate gate stopped at incomplete worker-test types; those fixtures were repaired. A later gate stopped at the old “Stakeholder map & ACH” audit marker; verification now matches the clearer label and still requires the analysis-of-competing-hypotheses prompt. The design verifier also reads the current shell and checkout disclosure. Failed/older runs remain preserved and are not counted as passing final acceptance.

Private evidence: `C:\Users\giuli\output\praxis-chat-first-baseline`, including `final-521-local-gate-binding.json`, `final-close-canonical-probes.json`, `antislop-graphify-final521-final.log` and `release-manager-52102b-*`. Credentials, account history, private identifiers and signed URLs are excluded from public receipts. Generated audits/graph artifacts, unrelated work, preservation stashes and the main checkout's ignored environment were kept outside release staging.

## Practical limits

Capsule pins freeze records/references, not original source bodies or current workspace/web research. Inspection opens the current saved capsule and labels that distinction. Handover does not transfer original files, source permissions or universal import support. Hashes prove byte integrity, not sender identity or analytical approval. Download-link expiry does not delete the stored package; failed cleanup can require operator intervention.

Synthetic acceptance establishes the tested software paths, not analytical accuracy, scanned OCR, large-document/load capacity or customer outcomes. Retention decisions and moderate/low dependency findings remain explicit. Final handover download, one bounded saved-version worker run and current responsive/keyboard screenshots are the deferred acceptance checks.

## Delivery self-evaluation

Applied `agent-self-evaluation`: publication and the requested copy/design changes are delivered; deeper live checks have an explicit boundary.

| Axis | Score | Evidence and remaining improvement |
| --- | ---: | --- |
| Accuracy | 4/5 | Exact source/build/digest/health and passing checks are recorded; final handover/worker behavior still lacks live proof. |
| Completeness | 4/5 | Both sites are published and the main journeys redesigned. The user deferred the remaining deep acceptance, which stays visible above. |
| Clarity | 4/5 | Guide/Learn reading burden fell 76%/47%; advanced provenance terms remain in optional detail. |
| Actionability | 4/5 | The release is live with source-bound receipts; validate the deferred live paths before broader readiness claims. |
| Conciseness | 4/5 | Repeated copy/cards were removed; necessary source, review and export limits retain some length. |

Overall: 4.0/5. Highest-impact remaining improvements are final-source handover/worker acceptance and current keyboard/responsive screenshots. Self-check: the published pages and receipts make the score reviewable without presenting deferred acceptance as complete.
