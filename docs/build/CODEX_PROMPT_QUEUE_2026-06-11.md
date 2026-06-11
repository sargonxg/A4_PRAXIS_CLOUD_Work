# CODEX Prompt Queue — PRAXIS MVP Heavy Lifting (2026-06-11)

Paste prompts **sequentially** into CODEX. Always paste the **Context Preamble**
(Section 0) first in every new CODEX session, then one numbered prompt at a
time. Each prompt is self-contained, ends with the validation gate, and tells
CODEX to do all the heavy lifting.

---

## 0. CONTEXT PREAMBLE — paste this at the start of every CODEX session

```
You are working on PRAXIS by TACITUS — an AI-native, capsule-context agentic
workbench for policy, diplomacy, and conflict analysis.

REPOSITORIES
- PRAXIS app:        https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work  (work on main)
- DIALECTICA engine: https://github.com/sargonxg/A3_DIALECTICAbyTACITUS_v3
- TACITUS website:   https://github.com/sargonxg/A2_TACITUS_WEBSITE_NEXTJS2 (design reference)

PRODUCTION
- Domain: https://praxis.tacitus.me (Cloud Run service `praxis-frontend`)
- GCP project: praxisbytacitus (852128226674), region us-central1
- Deploy (frontend-only changes):
  gcloud builds submit --config cloudbuild.frontend.yaml --project praxisbytacitus \
    --substitutions "_SOURCE_COMMIT=$(git rev-parse HEAD),_SOURCE_BRANCH=main,_BUILD_SOURCE=local-submit"
- Deploy (backend/infra changes): cloudbuild.yaml (full pipeline)
- NEVER use infrastructure/deploy-frontend.sh (it drops Cloud Run secrets).

PRODUCT CONTRACT (do not violate)
- Public Home (/) and signed-in Home (/app) are EXACTLY the same simple surface:
  one prompt, one capsule dock on top, mission cards, sidebar (Ask, Saved
  context, Boardroom, Drafts), agentic-workflows row. Login only unlocks power.
- The product object is the ContextCapsule (v2 root marketplace capsules +
  v3 user-scoped capsules with 14 sections incl. tacit knowledge, claim
  ledger, ontology binding, agent operating contract).
- Everything an agent proposes is REVIEW-GATED: imports, graph changes,
  source packs, memories become review cards; humans approve before canonical.
- Complexity lives in Learn/Inspect/Boardroom/Editor — never on the home page.
- Design identity: PRAXIS emerald #10B981 accents on cream "Civic Atelier"
  paper, EB Garamond headings, Inter body, mono uppercase kickers,
  "Every claim has a receipt." (matches tacitus.me verified-context identity).

READ FIRST (in the PRAXIS repo)
CLAUDE.md → AGENTS.md → docs/PRAXIS_CODEX_PLAYBOOK.md → STATUS.md (top entry)
→ CHANGELOG.md [Unreleased].

HARD RULES
- Never hardcode model strings outside src/lib/ai/providers.ts / MODEL_MATRIX.json.
- Every AI route uses withCalibration; never bypass withAuth.
- Never touch src/lib/firebase/admin.ts, with-auth.ts, proxy.ts security
  headers, firestore.rules, storage.rules, cookie-signer.ts without explicit
  human approval.
- Commit as giuliocatanzariti@gmail.com. NO Co-Authored-By lines.

VALIDATION GATE (run before every commit; all must pass)
npx tsc --noEmit && npm run lint && npx vitest run && npm run build \
  && npm run audit:gate && node scripts/audit-ai-routes.mjs

RELEASE GOVERNANCE (for any product-visible change)
Bump APP_BUILD_NUMBER in src/lib/constants/app-version.ts, add a release-note
entry in src/lib/product/release-notes.ts, mention "Build <number>" in
CHANGELOG.md [Unreleased], keep package.json version == APP_VERSION, add a
STATUS.md checkpoint. `npm run audit:release-notes` enforces this.

CONTRACT TESTS PIN COPY/TEST-IDS. When you intentionally change pinned copy,
update the pinning test in the same commit (marketing-home-contract,
session5-public-billing-contract, ask-context-bar-contract,
tasklet-workbench-contract, learn-page-contract, futurist-ai-lab-contract,
e2e landing specs).
```

---

## PHASE A — One simple core (stack, dock, structure)

### Prompt 1 — One context stack everywhere (capsules page = home dock)
```
In A4_PRAXIS_CLOUD_Work: the home dock (src/components/app/ask-context-bar.tsx
+ src/components/app/use-active-context-stack.ts, persisted via
/api/workspace/context-stack) and the capsules workbench
(src/components/praxis/tasklet-praxis-workbench.tsx, in-memory `activeCapsules`
chips + applyCapsuleCard(capsule, role)) are two separate context-stack stores.

Unify them. Make the workbench read/write the same ActiveContextStackState
through useActiveContextStack, mapping its CapsuleRole buckets
(user/situation/tools/output) onto capsuleRefs[].role. Mount the same
<AskContextBar variant="home"> at the top of the /app/capsules repository
section so /app/capsules carries the exact same dock as /app, and remove the
now-duplicated chip UI from the workbench. Attaching a capsule from a card
must update the shared dock instantly; detaching from the dock must update
the workbench.

Keep every pinned string in tests/unit/components/ask-context-bar-contract.test.ts
and tasklet-workbench-contract.test.ts (update pins only if you intentionally
change behavior, in the same commit). Run the full validation gate.
```

### Prompt 2 — Bucket quick-pick on capsule cards
```
In tasklet-praxis-workbench.tsx CapsuleCard (~line 8540): the "Add" button uses
capsuleDefaultRole. Replace it with a split-button: default "Add" keeps current
behavior; a chevron opens a 4-item menu — "As User core / As Situation /
As Tool / As Output" — calling applyCapsuleCard(capsule, role) with the
matching CapsuleRole. Emerald accent on the default. The dock (after Prompt 1)
must reflect the chosen bucket immediately. Add a unit contract test asserting
the four role labels exist in the workbench source. Full validation gate.
```

### Prompt 3 — Decompose the 11,000-line workbench monolith
```
src/components/praxis/tasklet-praxis-workbench.tsx is ~11k lines and bundles
Ask panel, capsule library, repository lane, inspector, boardroom glue, and
conversation loading. Decompose it into modules WITHOUT behavior change:
src/components/praxis/workbench/{capsule-library.tsx, capsule-card.tsx,
capsule-detail-panel.tsx, repository-lane.tsx, ask-panel.tsx, hooks.ts,
helpers.ts}. Move pure helpers first, then leaf components, keeping the
top-level component as the orchestrator. Preserve ALL data-testids and pinned
strings (tasklet-workbench-contract.test.ts, instrument-visual-contract.test.ts,
capsule-studio-contract.test.ts pin many — keep them passing, updating only
file paths the tests read if they read the monolith path; prefer keeping a
re-export so source-scan tests still find strings, or update tests in the same
commit). Work in 3-4 commits, running the full validation gate after each.
This unblocks every later UI prompt — prioritize it.
```

---

## PHASE B — Capsule depth & DIALECTICA interop

### Prompt 4 — Top-10 starter capsule content rewrite (make them human)
```
In src/lib/product/context-capsules.ts (the starter catalog, ~500KB — work in
chunks): take the 10 flagship human-gated policy capsules
(HUMAN_GATED_POLICY_JUDGMENT_SEED_FAMILY shelf). For each one rewrite
richProfile.purpose, nextIdeas, tacit-knowledge entries, and research-dossier
summaries so they read like a senior analyst wrote them: specific actors,
dates, numbers; varied sentence shapes; explicit caveats; zero boilerplate
repeated between capsules. Give each capsule DIFFERENT embedded graph seeds
(node/edge counts and ACO entity types: Actor, Claim, Event, Interest,
Constraint, Leverage, Commitment, Narrative, Risk) so cards and Inspect look
organically captured, not templated. audit:gate includes capsule-depth and
research-dossier audits that derive expectations from the live catalog — keep
them passing. Release governance bump. Full validation gate.
```

### Prompt 5 — DIALECTICA-side capsule export
```
In A3_DIALECTICAbyTACITUS_v3: add "Export capsule for PRAXIS (.json)".
Output must match the PRAXIS contract in
src/lib/context/dialectica-context-contract.ts of A4_PRAXIS_CLOUD_Work:
{ contractVersion: '2026-05-15.prx-dialectica-context.v1', packageId,
  exportedAt (ISO datetime), title,
  claims[] {id, kind: 'fact'|'evidence_gap'|'conflicting_claim', text, sourceIds[]},
  assumptions[], uncertainties[], evidenceGaps[],
  sourceReceipts[] {id, title, url?, citation?, excerpt?} }
Map DIALECTICA promoted graph claims → 'fact'; contested/review-rejected →
'conflicting_claim'; open gaps → 'evidence_gap'; carry provenance receipts.
Add a round-trip test validating output against a copied Zod schema fixture.
PRAXIS already imports this format at POST /api/context/capsules/import/dialectica
and via the "Import capsule" button — verify end-to-end manually with one
exported file.
```

### Prompt 6 — Import preview dialog (inspect before you accept)
```
In PRAXIS: importing a DIALECTICA .json or Capsule+ .zip currently creates the
capsule immediately (claims stay review-gated). Add a preview step to
CapsuleImportButton (src/components/capsules/CapsuleImportButton.tsx): parse
client-side first (reuse parseDialecticaContextExport /
mapDialecticaExportToPraxisPreview), show a compact dialog — title, fact/
conflicting/gap counts, source receipts list, what stays review-gated — with
Confirm import / Cancel. After import, deep-link "Review now" to the capsule's
review queue in Inspect. Add unit tests for the preview mapping. Full gate.
```

### Prompt 7 — True graph stats on capsule docs
```
Capsule cards render a seeded constellation (CapsuleMiniGraph) with derived
counts when real seeds are absent. Make real numbers exist: denormalize
embeddedGraph stats onto each capsule doc — { graphStats: { nodeCount,
edgeCount, entityTypeCounts, updatedAt } } — updated in capsule-service
whenever graph nodes/edges/proposals change, and backfill via an idempotent
scripts/backfill-capsule-graph-stats.ts. CapsuleMiniGraph then prefers real
counts and entity mixes. Firestore rules untouched (server writes only).
Add unit tests for the stat updater. Full gate.
```

### Prompt 8 — Capsule version timeline & diff in Inspect
```
Capsules write immutable versions/{vN} snapshots on every applied review card.
In Capsule Studio Inspect (CapsuleWorkbenchPanel area), add a "History" section:
list versions (vN, date, applied review-card title), and a two-version diff
view for label/summary/claimLedger/sourceRefs (added/removed/changed rows,
green/red). Read-only; use the existing /api/context/capsules/[capsuleId]/history
and /diff routes (check their shapes first). Add focused unit tests. Full gate.
```

---

## PHASE C — Agentic power (the wow)

### Prompt 9 — Source-Gap Scout: planned → live agent
```
src/lib/product/policy-agents.ts lists 'source-gap-scout' as planned. Give it
a real worker path mirroring 'research-memo': add an execution mode in
src/lib/agent-runtime/worker.ts that loads the active capsule's evidence gaps
and unsupported claims, runs grounded Google Search through the existing
sourcing lanes (models via providers.ts ONLY), and produces review-gated
source-pack review cards (createCapsuleReviewCard, target: 'sourceGap',
sourceType: 'agent') with per-candidate receipts (url, snippet, date).
Flip readiness to 'live', add it to AGENT_DESTINATIONS in
src/components/app/policy-agent-strip.tsx, extend
npm run audit:agent-process-contract, add worker unit tests next to
tests/unit/lib/agent-runtime/worker.test.ts. Full gate. Deploy needs the full
cloudbuild.yaml only if backend files changed; frontend-only otherwise.
```

### Prompt 10 — Live run timeline inline in home chat
```
When Ask queues a durable run, the home chat (src/components/app/praxis-chat.tsx)
shows a chip linking to /agents/{runId}. Upgrade it: under the chip, mount a
compact live timeline driven by the Firestore run mirror
(users/{uid}/runs/{runId} with events subcollection — see
src/lib/agent-runtime/firestore-mirror.ts and the existing
src/components/runs/run-timeline.tsx). Show phase dots (plan → act → reflect /
plan→source→retrieve→verify→synthesize for research), the latest event line,
tool-call count, and pending-approval badge with inline Approve/Reject that
calls the existing approvals route. Collapse automatically on completion with
a "Open result" link (outputHref). Keep it under ~120px tall. Unit-test the
event→view-model mapping. Full gate.
```

### Prompt 11 — Approval inbox
```
Pending agent approvals are only visible inside a focused run. Add an
approval inbox: a small badge on the home dock (count of pending approvals
across runs, from the Firestore mirror) opening a panel listing each pending
approval — run objective, tool, risk level, requested time — with
Approve/Reject using the existing
/api/agents/runs/[runId]/approvals/[approvalId] route. No new top-level page:
render as a sheet/panel from the dock. Contract test for the badge + panel
testids. Full gate.
```

### Prompt 12 — Deep Research lane in the composer
```
backend/ai/flows.py already has agentic_research_flow
(plan→source→retrieve→verify→synthesize) and the ADK bridge exists
(src/lib/agent-runtime/adk-bridge.ts). Add a "Deep research" toggle next to
the Ask send button (off by default; tooltip: "Multi-step sourced research —
runs as a reviewable agent run"). When on, the orchestrator forces
agenticMode 'queue_agent_run' with a research-memo run configured for the
5-phase research flow, and the inline run timeline (Prompt 10) shows the five
phases. Honor minSourcesPerClaim gates so synthesis blocks on unsupported
claims. Credits: use the existing deep-search cost in with-credits.ts. Update
ask-orchestrator unit tests. Full gate.
```

### Prompt 13 — Red-team pass before export
```
In the memo desk (src/components/memo/memo-desk.tsx) export gate: add an
optional "Red-team this draft" action that runs the red-team-analyst lane
(reuse boardroom red-team-review tooling) over the draft, producing inline
annotations (challenge, severity, affected paragraph) rendered as review
comments in the margin rail. Export gate shows "red-teamed ✓" once run.
No silent rewriting — annotations only. Calibrated route, persisted via
saveToolOutput. Unit tests for the annotation mapper. Full gate.
```

### Prompt 14 — Orchestration receipt drawer (full transparency)
```
The answer activity strip (praxis-chat.tsx AnswerAgentActivity) shows triage
mode + agent + run link. Make the strip clickable: open a drawer rendering the
full AskConversationOrchestrationReceipt — triage decision and why, capsule
context health, selected/blocked/approval-required tools, grounding plan,
model tier, language policy, supervisor action. Read-only, mono labels,
emerald accents. This is the "PRAXIS augmented generation" proof surface.
Add a contract test for drawer testids. Full gate.
```

### Prompt 15 — Daily Brief agent live on schedule
```
Make 'daily-brief' a live agent: worker path that takes the user's primary
capsule (or chosen capsule set), pulls fresh grounded search + capsule deltas
since last brief, and writes a dated memo draft + notification. Wire the
existing Cloud Scheduler cron (briefings 5am — see docs/GCP_OPERATIONS.md and
src/app/api/cron/) to enqueue runs for opted-in users (a `dailyBrief: {enabled,
capsuleId}` field on user settings; add the settings toggle in the Workspace
tab). All output review-gated as a draft, never auto-published. Flip registry
readiness, extend agent-process-contract audit, worker unit tests. Full gate.
```

---

## PHASE D — Research & source trust

### Prompt 16 — Source trust tiers on every receipt
```
Source receipts carry reliabilityTier (1-3) in capsule-v2 ContextCapsuleSourceRef
but answer source cards don't show it. Compute/display a trust tier on every
source preview card and receipt chip (Ask answers, memo citation rail, capsule
Inspect): tier badge (T1 mono emerald / T2 slate / T3 amber "verify"), date
freshness, and sort source cards by tier then recency. Single shared
<SourceTierBadge> component. Where tier is unknown, show "unrated" — never
invent a tier. Unit tests for the tier resolver. Full gate.
```

### Prompt 17 — Evidence coverage meter on answers
```
Add a compact evidence coverage meter to the answer quality strip: percentage
of claims supported (from sourceabilityVerdicts), unsupported count, and a
one-click "Find sources for gaps" that queues the Source-Gap Scout (Prompt 9)
scoped to this answer's unsupported claims. Show honest zero states. Unit
tests for the coverage math. Full gate.
```

---

## PHASE E — Design, mobile, performance

### Prompt 18 — Mobile excellence pass
```
Run the existing visual diagnostics (tests/e2e/capsule-workspace-visual-
diagnostics.spec.ts and mobile-landing.spec.ts) at 360/390/768 widths and fix
every overflow/cramp on: home dock (chips must wrap, actions collapse into a
"⋯" menu under 640px), capsule cards grid (single column, constellation
scales), memo desk (rails become bottom sheets), boardroom composer. No
horizontal scroll anywhere. Update/extend the e2e specs to lock the fixes.
Full gate + run the e2e specs locally with npx playwright test.
```

### Prompt 19 — Performance: split the heavy bundles
```
Audit bundle composition (next build output + @next/bundle-analyzer dev-only).
Lazy-load with next/dynamic: Monaco (capsule builder JSON mode), TipTap (memo
desk), D3/force-graph + vis-timeline (capsule Inspect), boardroom workspace.
Ensure /  and /app first load JS drops materially (report before/after
numbers in the PR description). No behavior change; loading skeletons in
emerald. Full gate.
```

### Prompt 20 — Onboarding to first capsule in 60 seconds
```
After signup, users land on /app with an empty dock. Add a one-time
"Build your User Core" inline card (dismissible, shown only when no capsules
exist): three questions (role, what you work on, output you ship most) that
create a user-core capsule via the existing capsule API and attach it as
primary. Reuse onboarding chips (src/lib/constants/onboarding-chips.ts).
Must not add a route or modal wall — inline card under the dock. Contract
test. Full gate.
```

### Prompt 21 — Empty states & skeleton coherence
```
Sweep every visible surface (home chat, dock, capsule grid, Inspect, memo
desk, boardroom, settings, /agents/[runId]) for inconsistent loading and
empty states. Standardize: emerald skeleton pulse, one-line honest empty copy
("No saved context — direct ask", "No runs yet"), no layout shift (fixed-size
skeletons). Build a tiny shared <EmptyState icon label hint action?>
component and use it everywhere. Full gate.
```

---

## PHASE F — Trust, CI, hygiene

### Prompt 22 — CI golden path with disposable Firebase credentials
```
The authenticated golden-path CI proof exists but skips without
TEST_FIREBASE_EMAIL / TEST_FIREBASE_PASSWORD secrets. Create a disposable
Firebase user in project praxisbytacitus (document the steps in
docs/runbooks/), add the two GitHub Actions secrets, and un-skip the golden
path in the smoke workflow so every push to main proves: public home → login
→ capsule attach → Ask turn → run queue → memo draft. Make the workflow fail
loudly (not skip) when secrets are present but the path breaks.
```

### Prompt 23 — Run failure forensics
```
When an agent run fails, /agents/[runId] shows status but little why. Surface
structured failure forensics: last event before failure, failing tool call
with sanitized error, retry guidance, and a "Retry run" affordance (existing
retry route). Mirror a sanitized failureSummary onto the Firestore run doc
from the worker. Never leak stack traces or internal URLs to the client.
Worker unit tests for failureSummary. Full gate.
```

### Prompt 24 — Dead-surface cleanup, evidence-based
```
Re-run the route/component inventory (docs/audits API route inventory pattern):
identify components and routes with zero imports and zero test references
(candidates: legacy domain-picker duplicate in src/components/domain/ vs
src/components/cores/, retired compatibility routes already 410, unused
visualization components). For each candidate, present evidence (no imports,
no tests, no docs reference), then delete in small commits. Do NOT delete
anything referenced by proxy.ts redirects, audits, or docs without updating
those in the same commit. Full gate after each commit.
```

### Prompt 25 — Consolidate the three accent palettes
```
globals.css carries three overlapping palettes (navy/gold Civic Atelier, lab
dark, emerald verified-context). Consolidate: define --color-praxis-emerald-*
tokens in @theme, repoint --color-praxis-action* to emerald, migrate remaining
visible gold accents on app surfaces (memo desk chrome, workbench buttons,
inspector) to the emerald tokens, and document the palette decision tree in
DESIGN.md (emerald = action/brand; gold = retained only for archival/legacy
badges; lab palette = /agents run surfaces only). Visual contract tests
updated in the same commits. Full gate.
```

---

## Suggested order & batching

| Batch | Prompts | Why first |
|---|---|---|
| 1 | 3 → 1 → 2 | Decomposition unblocks everything; then one stack, then buckets |
| 2 | 9 → 10 → 11 → 14 | The visible agentic wow: live agent, live progress, approvals, transparency |
| 3 | 5 → 6 → 7 → 8 → 4 | DIALECTICA round-trip + capsule depth |
| 4 | 12 → 15 → 13 → 16 → 17 | Research power + trust |
| 5 | 18 → 19 → 20 → 21 | Design, mobile, performance, onboarding |
| 6 | 22 → 23 → 24 → 25 | CI proof, forensics, hygiene |

After every batch: run the full validation gate, bump build number + release
note + changelog + STATUS checkpoint, commit to main, deploy with
cloudbuild.frontend.yaml (or cloudbuild.yaml when backend changed), and verify
https://praxis.tacitus.me/, /login, /app, /release-notes, and /api/health.
