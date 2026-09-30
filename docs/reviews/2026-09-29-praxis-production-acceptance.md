# PRAXIS production acceptance — 2026-09-30

Status: core user journeys passed against the deployed final source. The user
authorized the push, deployment and serial private production checks.

## Release and evidence scope

- Production: <https://praxis.tacitus.me>.
- Runtime source: `4480650999b5bd2808b55cba58f16e5a9a83d343`.
- Served revision: `praxis-frontend-01082-nkw`; build `4b8fff18-5a9d-4c4a-9d97-5cff8fe89cb8`.
- The custom domain reported this exact source and seven healthy runtime checks
  before each journey and after actual logout, last checked at
  `2026-09-30T07:40:43.555Z`.
- Exact-source GitHub [verify-main](https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work/actions/runs/36681566547)
  and [persona-smoke](https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work/actions/runs/36681566464): **SUCCESS**.
- Cloud Build's official GitHub check reports **SUCCESS** for all eight steps,
  including **preflight-audit-gcp**. Its completed build log records real
  resource reads, zero hard failures/one soft Scheduler warning and no skip.
  Deployment-time traffic and image identity are retained in the exact-source
  remote identity/build-log receipts.
  Current control-plane inspection remains blocked by local Google sign-in.
- Local build/typecheck and all non-GCP audit groups pass. **390 files / 1830
  tests pass, zero skips**. Lint: zero errors/seven tracked warnings. Dependency
  audit: 44 moderate/three low, no high/critical. Coverage was not measured.
- Local GCP audit did not pass: expired auth produced 34 resource-read failures.
  These failures are authentication diagnostics. The final Cloud Run error-log
  window and a separate current service-state read await restored sign-in.

Evidence is retained under `output/playwright/user-readiness-20260929/`.
`final-acceptance-index.json` binds all four serial journeys to the exact served
source. They used real Firebase login, real services and model responses, private
synthetic fixtures, and no mocks, traces, saved authentication state or public
capsule publication. Earlier failed/partial runs remain historical evidence.

## Live user acceptance

| Workflow | Result | Evidence |
| --- | --- | --- |
| Existing-account login and seven runtime checks | PASS | Final acceptance index and each journey |
| TXT/PDF/DOCX → original source paragraphs → capsule proposals → reject/apply decisions → Ask/history | PASS; two tests, zero skips/retries | `deployed-capsule-tests.json` |
| Method attachment and saved context reload | PASS | Capsule Studio and Home receipts |
| Switching capsules and returning from memo keeps the correct identity, label, version and document refs | PASS | Final workspace-pointer and memo-return checks |
| Empty-context direct questions, follow-up history and reload | PASS; no unrequested agent or unrelated sources | `approved-live-ask-save.receipt.json` |
| Separate private purpose-only save → attachment → brief factual recall | PASS; canonical default unchanged | Same Home receipt |
| Raw API history with actual provider/model and legacy memo read | PASS | Same Home receipt |
| Conversation/idea → long working notes + uploaded-only fact → review → unchanged rebuild → save/reuse | PASS; original documents and decisions persist | `approved-live-conversation.json` |
| Explicit no-research routing and unique uploaded-fact recall | PASS | Conversation receipt and saved runtime provenance |
| Queued research → expected owner approval → three originals/paragraphs → saved memo | PASS | `deployed-agent-proof.json` |
| Body-bound review consistent across generated artifacts | PASS; whole-draft review remains required | `deployed-review-consistency.json` |
| Memo edit/save/reopen with retained citations and outdated prior review | PASS | `deployed-edited-review-consistency.json` |
| Responsive Home/memo at 390/768/1,440 px and mobile Close | PASS; horizontal overflow within 2 px tolerance | Screenshots, hit-tests and journey receipts |
| Actual logout, masked private context, protected memo 401 and login redirect | PASS | `deployed-agent-proof.json` |
| Fresh Cloud Run error-log window | Pending interactive Google sign-in | Local auth diagnosis; no clean-log claim |

The final research run is `a1ca19fa-2c7f-4430-9a95-65afcdae837c`, saved memo `x0q5GHEkJ9VMnT998EzX__policy-memo`.
The three-document input capsule is `capsule-275e1ee2-fa28-48b2-b118-4f6c11a5c305`.
The separate conversation-created capsule is `capsule-6bbd0135-e09d-453e-969c-f80f8a7f9d84`.

## Product and quality boundaries

The existing Home + Capsules/workbench structure remains the visible product.
ContextCapsules/Firestore own reviewed product context; the existing SQL ledger,
Cloud Tasks and worker own durable agent execution. No additional agent framework,
canonical store or primary navigation was introduced.

Brief supplied-context recall follows the current question rather than saved
memo templates. Explicit research restrictions govern routing and tools; an
external-only restriction can preserve requested local document analysis.
Actual provider/model receipts come from the constructed generation model.

Generated memos remain `reviewRequired:true`, `exportReady:false`.
Source diagnostics and unapplied feedback do not approve the primary body.
Editing invalidates its earlier body review while immutable run/output receipts
retain the generated evidence. These live journeys prove operation; they do not
measure whether capsules improve analytical quality.

A second agent inspected the generated draft before editing. Agent-assisted
corrections were applied through the real owner editor and verified
after saving/reopening. Missing evidence must remain unverified rather than
becoming proof of absence; budget authorization must remain distinct from
expenditure. Corrections, source-text attribution and whole-draft approval are
separate questions. The corrected saved draft remains review-required; this
canary is not independent end-user validation or proof of generator accuracy.

The fresh generated body conflated funding allocation/approval with expenditure,
inferred absence of spending from unconfirmed funding, and overinterpreted a
future review deadline. It also described an independent news source as a public
institutional auditing framework and attached a GAO citation to private synthetic
facts. The edited body removes those deductions and attributions, cites uploaded
documents for the synthetic example and treats institutional links as source
leads awaiting original-passage review. Its requested substantiation from two
public institutions remains incomplete. Grounded response segments are not
verbatim source-page extracts. The operational research PASS does not certify
source fidelity or analytical correctness.

Minor observed usability limits include opaque capsule IDs in answer prose,
a generic graph attribution on purpose-only recall and noisy diagnostic labels.
These are recorded for refinement; they are not independent factual verification.

Still unproven: fresh signup/verification/reset, expiry/deletion and two-account
switching; paid entitlements/purchases; inventory pagination/capacity; scanned
OCR and long-document limits; duplicate/interrupted worker recovery. Optional
JEV remains disabled. Dependency advisories remain maintenance work.

## Documentation and continuation

- [User readiness](2026-09-29-praxis-user-readiness.md): implementation and limits.
- [Policy research guide](../product/CONTEXT_CAPSULE_POLICY_RESEARCH_GUIDE.md):
  policy briefs, analyst and narrative workflows using reviewed context.
- [Runtime architecture](../architecture/PRAXIS_AGENT_RUNTIME_ARCHITECTURE.md):
  ownership, execution preferences, approval and output boundaries.
- [Current tools and GitHub research](2026-09-29-praxis-tooling-research.md):
  dated official evidence and priorities for strengthening the existing runtime.

Copy-ready continuations:

- Restore scoped Google sign-in, inspect the exact served revision and Cloud
  Build step metadata, then query the error window covering all four canaries
  and logout. Do not infer clean logs from healthy endpoints.
- Verify disposable signup, verification/reset, expiry/deletion and switching
  two real accounts against this release, with redacted receipts.
- Compare six to ten real-provider policy/narrative products with and without
  reviewed capsules using identical sources and an analyst rubric. Inspect
  original source passages, institutional attribution, commitment versus
  implementation, uncertainty and citations. Do not use generated grounding
  segments as original source text.
- Inject duplicate dispatch and interrupted artifact/version writes in an
  isolated environment; prove recovery without duplicated or missing products.
- Verify server-enforced free/paid entitlements and Polar purchases using a
  configured sandbox; keep JEV disabled until its separate live proof passes.
