# Experimental context handover: research and implementation

Date: 2026-09-30. Scope: isolated `praxis-chat-first` checkout. This document records local implementation and focused validation, not deployment or empirical analytical-quality evidence.

## Product and architecture boundary

The app remains chat-first Home and Capsules. Handover belongs to saved writing and the existing capsule/workbench inspector. No additional primary navigation, canonical store, orchestration framework, or capsule-schema migration is introduced.

Firestore ContextCapsules remain canonical. The existing owner-scoped memo loader retains current/legacy identity and path checks. SQL/Cloud Tasks own durable execution; graph and optional memory projections remain advisory. DIALECTICA and Policy Vision produce review-only context proposals through versioned adapters rather than direct canonical writes.

Current product references:

- `docs/CODEX_SESSION_BRIEF.md`
- `docs/product/PRAXIS_CANONICAL_APP_STRUCTURE.md`
- `docs/product/CONTEXT_CAPSULE_V3_HUMAN_GATED_CONTEXT_INFRASTRUCTURE.md`
- `docs/reviews/2026-09-30-praxis-implementation-ledger.md`
- `src/lib/context/agent-context-packet.ts`
- `src/lib/agent-runtime/capsule-read-receipt.ts`

The current graph packet already selects bounded context and records omitted rows. Portable context and a runtime working packet are complementary: a reusable snapshot preserves lineage, while a task-specific packet selects relevant material. A regenerated inspector packet is a preview; only the actual saved run receipt establishes what a particular answer used.

## Primary-source research

Sources were searched and retrieved read-only on September 30. Standards inform the design; they do not certify the application or demonstrate analytical benefit.

| Source | Relevant guidance | Application |
| --- | --- | --- |
| [W3C PROV-O](https://www.w3.org/TR/prov-o/) | Entities, activities and agents; specific derivation relations for quotations, revisions and primary sources. | Preserve source/revision/reviewer responsibility. Provenance and identity do not establish truth. A standards-facing projection can be additive later. |
| [RO-Crate 1.2 structure](https://www.researchobject.org/ro-crate/specification/1.2/structure) | Distinguishes attached file packages from metadata describing online resources; human and machine context can travel together. | Clearly state that this export is references-only for source files. Include a readable README, source metadata, limitations and a manifest. No RO-Crate conformance is claimed. |
| [RO-Crate provenance](https://www.researchobject.org/ro-crate/specification/1.2/provenance) | Retain old versions and record curation/creation actions, responsible people and software versions. | Resolve the capsule version used by the saved memo rather than loading newer context silently. |
| [Anthropic context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) | Finite attention; high-signal context, identifiers for retrieval, progressive disclosure, compaction and structured notes. | Preserve the bounded existing agent packet, make omissions visible, and provide dependency pointers rather than placing the full corpus into every prompt. Vendor guidance is not a PRAXIS quality evaluation. |
| [MCP resources](https://modelcontextprotocol.io/specification/2026-07-28/server/resources) and [tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools) | Context selection is application-driven; tools are executable actions with human-control and trust boundaries. | Imported/source text cannot transfer permissions or authorize actions. No new MCP integration was needed for this work. |
| [WAI complex images](https://www.w3.org/WAI/tutorials/images/complex/) | Complex visual information requires a complete structured text equivalent. | Synchronize graph inspection with accessible node/relationship/source lists; this is handled by the UI owner. |
| [WAI disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) and [modal dialogs](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) | Keyboard operation, expanded state, dialog focus and return focus. | Keep simple overview/evidence/review actions visible and expose technical depth through controlled disclosures in the existing inspector. |
| [WCAG target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [dragging alternatives](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html), [motion preferences](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) | Minimum target/spacing requirements, non-drag operations and control of nonessential motion. | Larger app controls and graph/list alternatives; reduced-motion behavior belongs to the UI owner. |

## Implemented package contract

Owned source:

- `src/lib/memo/handover-package.ts`: deterministic semantic projection, preview binding, file hashes and integrity verification.
- `src/lib/memo/context-snapshot.ts`: complete context schema, immutable inheritance and explicit selection/removal semantics.
- `src/lib/firebase/memo-service.ts`: context recorded on each newly saved version and mirrored on its envelope.
- `src/components/memo/memo-desk.tsx`: current capsule pins and explicitly unverified current source-reference metadata in the existing save payload.
- `src/app/api/memos/[id]/handover-package/route.ts`: authenticated preview/download flow using existing stores.

The snapshot is deliberately selected rather than wholesale serialization:

- Exact saved memo body, saved version ID and normalized SHA-256 body hash.
- A matching pinned capsule version containing purpose, scope, summary, bounded claim statements/caveats, source metadata, public method and negative agent boundaries.
- The original source files and passages are excluded. Metadata never implies claim-support verification.
- Private notes, tacit knowledge, hidden reasoning, account identifiers, access policies, raw model/tool payloads and authority-granting instructions are excluded.
- Source links reject executable/credential-bearing URLs and remove query/fragment components. No source URLs are fetched and no foreign source access is granted.
- Owner-scoped document/core references and missing receipts are unresolved dependencies, not assertions that the recipient has access.
- Text/row bounds are disclosed; long claim text carries an explicit truncation flag. Source/claim text remains evidence to review rather than instructions.

The user can inspect included/omitted materials and limitations before creating a temporary download. The recipient must supply missing source material with permission and conduct their own review.

### Capsule and memo versioning

The API uses `loadMemoById` and the memo's `currentVersionId`, with owner and memo identity checks. Each newly saved version carries a complete `contextSnapshot` with nullable capsule ID/version, explicit source lists, claim-check references and run/conversation/output references. Ordinary edits that omit context inherit only the prior immutable recorded version. Envelope and block metadata never establish a version's context.

Explicit capsule removal records the no-capsule marker, clears the envelope pin and removes stale source/claim/output-capsule references unless independent references were explicitly supplied. Explicit empty source arrays remain empty. Selecting a different capsule version resets omitted old source references. A source list records lineage; it does not prove support for the edited body.

Legacy or malformed version context remains `legacy-unbound` on ordinary edits; those drafts can still be saved. Handover returns HTTP 409 `memo_context_unrecorded` until a deliberate capsule selection or removal is saved. A first new save without context records an empty association. A recorded memo with no capsule association remains exportable as a clearly labeled draft/no-capsule snapshot.

A capsule reference must include a positive exact version. The route checks raw owner, capsule ID and version before any normalizer can supply defaults. The current capsule is used only when all three match; otherwise the owner-scoped `versions/vN` snapshot must match. A newer capsule is never substituted. Archival export intentionally preserves historical owner-scoped lineage even if that capsule was archived afterward; the shared active-Ask resolver instead prevents archived attachments from being revived.

### Review truth

The server verifies the existing human-approval signature and binds review to owner/reviewer, memo ID, saved version ID and normalized body hash. A changed, forged, foreign-reviewer or stale-version approval does not certify the export. Instead it is visibly a draft with mandatory review limitations.

A valid approval is labeled with its actual intended use and recorded limitations. It describes owner review of the memo body; it is not independent source verification, approval of every capsule dependency, or transferable recipient authorization. The approval attestation and owner UID are not serialized into the public package.

### Preview and download API

`GET /api/memos/:id/handover-package`

Returns `{ ok, memoId, preview }` with private/no-store headers. It performs no package, Storage or canonical-content writes. The shared authentication wrapper's existing rate-limit accounting remains in place.

The exported `HandoverPreview` includes:

- `schemaVersion`, `previewHash`, `mode: draft | human-reviewed`
- `memoId`, `memoVersionId`, `bodyHash`
- `capsule`: ID, requested/resolved version, `pinned | none`, label/purpose/counts when present
- `files`, `included`, `omitted`, `unresolvedDependencies`, `warnings`
- `review`: status, intended use, approval date and limitations

`POST /api/memos/:id/handover-package` with JSON `{ "previewHash": "sha256:..." }`

The semantic preview hash covers the body, version, title, projected context, sources, review scope and disclosure inventory. The API reloads the saved data before generation and checks that exact hash. It excludes generation timestamps so an unchanged preview remains confirmable.

- Missing confirmation: HTTP 409 with `{ previewRequired: true, preview, error }`.
- Changed content: HTTP 409 with refreshed preview and `code: preview_changed`.
- Invalid/oversized JSON confirmation: HTTP 400; streaming input bound is 2 KiB.
- Cross-origin POST: HTTP 403.
- Demo account: HTTP 403.
- Missing/foreign memo: HTTP 404.
- Missing/mismatched capsule version: HTTP 409, `code: capsule_version_unavailable`.
- Missing, malformed or legacy-unbound version context: HTTP 409, `code: memo_context_unrecorded`.
- Deleted/deleting account at upload or receipt commit: HTTP 409, `code: ACCOUNT_UNAVAILABLE`; unreadable account state: HTTP 503 with `retryable: true`.

Successful response retains `ok`, `memoId`, `signedUrl`, `expiresAt`, `bucketUri` and `manifest.files/pathId`. It adds preview/review, access semantics, payload integrity manifest, package hash and manifest hash. The UI owner updates the existing caller; old no-body automatic exports now receive a preview-required response.

### Package files and integrity

The ZIP includes README, memo Markdown/Word/PDF, sanitized capsule JSON/PDF, sanitized receipt CSV, source metadata, context/dependency manifest and integrity manifest. CSV cells are protected against leading spreadsheet formula characters. Markdown contains the authoritative saved text. Word/PDF are plain-text renditions; original rich layout and all-script PDF-font fidelity are not claimed.

The versioned integrity manifest contains SHA-256 hashes and byte counts for every payload file, excluding itself. The authenticated API returns its hash and the ZIP hash. The pure verifier rejects malformed inventories, missing/unlisted/duplicate/traversal paths and byte/hash mismatches.

Hashes detect corruption relative to the supplied manifest. They do not authenticate the sender; an attacker who replaces both payload and manifest can replace unsigned hashes. The package explicitly sets `contentSignature: false` and `analyticalVerification: false`.

The signed Storage URL is a 24-hour bearer download capability, not a content signature. URL expiration neither deletes the stored package nor recalls recipients' downloaded copies. Existing owner-scoped handover metadata is retained; no retention schedule or deletion capability is invented.

Export generation rechecks account availability immediately before Storage upload. Receipt persistence uses the existing owner-checked Firestore transaction, so concurrent erasure is a conflict. URL signing happens before the receipt commit; a failed signing or owner check compensates by deleting the uploaded object. Storage and Firestore are separate stores: this is guarded persistence with compensation, not a claim of cross-store atomic erasure. A failed compensation is logged without private identifiers and still returns the failed request; operational cleanup/retry proof remains a deployment concern.

## Focused local verification

On September 30:

```powershell
npx vitest run tests/unit/lib/firebase/memo-service.test.ts tests/unit/lib/memo/handover-package.test.ts tests/unit/api/memo-handover-package.test.ts tests/unit/api/memo-reviewed-export.test.ts --maxWorkers=1
```

Result at 13:07:15 on September 30: 4 suites / 70 tests passed. Counts are one combined run rather than a sum of overlapping runs. Scoped ESLint of the helper, route, memo service and affected tests passed; affected tracked-file whitespace checks passed.

Checks cover exact historical versions; missing/foreign/unversioned context; saved-body review hash compatibility; forged/stale/edited/wrong-reviewer approvals; private payload exclusion; malformed/credential-bearing source links; disclosed row bounds; stale previews; legacy preview requirements; no-write previews/errors; malformed/oversized/cross-origin requests; actual ZIP/Word/PDF bytes; formula-safe CSV; file hashes and changed/missing/unlisted/malformed inventories.

Additional persistence checks cover recorded no-context creation, capsule removal after a capsuled version, preservation of the old version, mutable envelope changes, omitted-context inheritance, explicit empty/independent source lists, invalid partial pins, changed capsule versions, legacy/malformed ordinary saves, and deliberate recovery. API tests use the actual owner-write helper with mocked Firestore/Storage to cover deletion after preparation, deletion after upload, commit-time unreadable account state and failed URL signing without surviving receipt/object writes.

API storage/Firestore/auth fixtures are mocked. These tests do not establish live Firebase authorization, durable cloud storage, provider availability, deployment state or analytical correctness. Full integration typecheck/build and browser preview/download proof belong to the coordinating release gate.

## Deterministic capsule preparation and persistence correction

`POST /api/capsules/assist/:action` is explicitly classified as non-AI context preparation. The `architect` action compiles supplied document text into review-required proposals; `persona`, `output-schema`, `sources`, and `few-shot` use fixed templates and bounded extraction. None executes a model or independently verifies evidence. They use `withAuth`, the existing shared minute limiter, schema validation, and current account checks. They do not reserve or deduct funded AI allowance. Actual provider-backed routes retain their calibrated/funded controls.

This corrects the live evidence-proposal request that returned `ai_usage_limit` after the account allowance check, despite not making any provider call. It does not remove or replenish the allowance required by a later Ask request.

The JSON reader enforces actual streamed bytes (750,000), aggregate text characters (250,000), and nesting depth (32), without trusting `Content-Length`. Malformed JSON/schema and limit failures occur before private preparation. Missing/deleting/deleted accounts fail with 409; an unreadable account marker fails with 503.

The architect workflow forces commit-time account guards for scaffold creation, exact version snapshots, review-card writes, patch-rejection audits and an active-context mirror. Each write transaction reads the owner marker, so concurrent erasure invalidates that transaction and the retry checks account state again. A version bump also checks the current capsule version before overwriting. This is protection for the architect preparation path; other capsule workflows keep their existing behavior. It does not make all preparation steps one transaction, so partial proposals committed before erasure begins can still exist until the account cleanup removes them.

The assist tool-output receipt opts into the same owner guard and atomically writes its canonical envelope, version and compatibility receipt. Account/persistence failures propagate to the handler. Other callers retain the existing best-effort receipt behavior. Architect receipts contain the capsule ID/exact version, review-card IDs, counts and summary. They do not duplicate original passages, full graphs or proposal patches already persisted in the owner-scoped review cards; the API still returns the complete proposal for inspection. This avoids valid bounded input expanding into an oversized Firestore receipt.

Guarded tool envelopes and memo save boundaries recursively omit undefined object properties, preserving explicit null/false/zero/empty strings and native Firestore values. Undefined array positions become null rather than moving later entries. This fixes real optional architect date fields and omitted memo `changeNote` fields; the strict regression fixtures reject nested undefined before serialization rather than silently dropping it during JSON cloning.

Focused tests cover zero-allowance deterministic preparation, no provider/credit execution, malformed and over-limit input, owner-state failure, commit-time deletion/conflict retries, preserved human review requirements, real 20-document expanded proposals with compact receipts, and exact memo context/version records. Final integrated validation and renewed live upload/review/attachment/Ask and handover-download acceptance remain coordinating release checks.

Correction verification on September 30: one combined run of the assist route, memo service, architect service, capsule service, entity extraction, tool-output receipt, funded-credit wrapper, auth wrapper and two memo API suites passed **194 tests / 10 suites**. Scoped ESLint and affected-file whitespace checks passed. Independent review separately passed 75 overlapping tests / 5 suites and approved the source/doc correction; those counts are not added to the combined total. The coordinating agent owns integrated typecheck/build, Graphify refresh, deployment and renewed real-service acceptance.

## Explicit remaining work

- Live authenticated preview → confirmation → package-download journey with final deployed source.
- Rich Word/PDF layout and font acceptance beyond plain-text output.
- Recipient import as review-required proposals through existing adapters; this ZIP does not claim compatibility with `.core` v1 imports.
- Optional source-file bundling, explicit rights/recipient choices, recipient signatures and an RO-Crate/PROV export adapter.
- Package retention/deletion/revocation policy with real persistence proof. Temporary link expiry is not erasure.
- Independent analytical evaluation of evidence fidelity and handover usefulness.

These are separate proof gates; the local focused tests do not close them.

## Self-evaluation

The agent-self-evaluation skill was applied to this owned implementation slice.

| Axis | Score | Evidence / specific improvement |
| --- | --- | --- |
| Accuracy | 4/5 | Owner/version/body review checks and real archive bytes pass the focused suites; live Storage/auth behavior still needs release proof. |
| Completeness | 4/5 | Requested API/package safeguards are implemented; preview UI is owned separately and must pass its browser journey. |
| Clarity | 4/5 | Explicit contract and readable guide distinguish drafts, references and hashes; the disclosure text can be refined after usability testing. |
| Actionability | 4/5 | Exported preview type and existing endpoint are ready for caller integration; combined typecheck/build and final deployment remain coordinator gates. |
| Conciseness | 4/5 | Allowlist projection and verification are centralized; the longer helper can become smaller typed projections when the portable schema stabilizes. |

Overall: 4.0/5 for this implementation slice. Highest-value follow-ups are the real authenticated preview/download journey, recipient import/source access proof, and rich-document/font acceptance. The user should receive the simple working flow and its actual scope rather than an unsupported claim that every recipient/source/export format is solved.


## Publication checkpoint

See the [final publication receipt](2026-09-30-praxis-final-publication.md): source 52102b5c is published and health/configuration checks passed. Final-source handover, worker and rendered acceptance remain pending after the user's instruction to publish and close. Historical/local evidence above retains its original scope.
