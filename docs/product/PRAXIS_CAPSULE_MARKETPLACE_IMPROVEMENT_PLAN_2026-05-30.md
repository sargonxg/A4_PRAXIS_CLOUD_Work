# PRAXIS by TACITUS — Context-Capsule Marketplace & Agentic Workspace Improvement Plan

> Status: proposal / build-ready blueprint for Codex execution
> Date: 2026-05-30
> Author: strategy + architecture synthesis (grounded in the live `A4_PRAXIS_CLOUD_Work` codebase)
> Scope: make Context Capsules first-class, build the capsule marketplace, deepen the agentic
> research + sourcing + drafting loop, and keep the surface dead-simple — without rewriting what
> already works (Next.js 16 + FastAPI + GCP/Vertex + Firestore).

---

## 0. How to read this document

PRAXIS is **already a mature, deployed product** (praxis.tacitus.me). It has the hard parts: a
ContextCapsule model (ADR 0050), User Core / Situation Core, an `AnalystProfile` calibration contract
wired into every AI route via `withCalibration()`, an 11-domain taxonomy with prototypal merge, the
ACO v2.0 ontology (14 entities / 72 relationships), the 4-layer Situation Knowledge Core (SKC)
GraphRAG, 55 tool surfaces, a credits/billing spine, and Free / Practitioner $49 / Team $199 /
Institution pricing.

This plan is **additive and surgical**, not a rewrite. Every move builds on an existing primitive.
The single biggest insight: **the capsule — not the tool — is the unit of value and the unit of the
marketplace.** Keep the user-facing surface small (public Home → signed-in Home + Capsules cockpit);
tools stay attached to context and surfaced by recommendation. AI does the heavy lifting behind a
"describe what you need → get a sourced, structured, citable brief" experience.

---

## 1. Executive summary

**Vision:** PRAXIS becomes the governed, source-grounded AI workspace where any policy professional
picks (or builds, or buys) a **Context Capsule** — a reusable, certified package that configures the
AI for a specific job (conflict analysis, sanctions impact, economic policy, mediation, treaty
analysis…) — asks one question, and gets back a fully sourced, structured, export-ready deliverable
produced by a transparent agentic research loop. Creators publish capsules to a marketplace with a
trust ladder (Community → Reviewed → Verified ⭐) and earn revenue share.

**The 5 biggest moves:**

1. **Make the Context Capsule a first-class, composable, versioned, signed, evaluated artifact.**
   Generalize the existing prototypal-merge engine (already proven on the `generic` domain) into
   capsule `extends`/`imports`; add LangChain-Hub-style `contentHash` versioning + fork + publish.
2. **Ship a Capsule Builder** — a guided wizard (non-technical) + advanced mode — inside the existing
   Home + Capsules cockpit. This is the "create / draft / customize capsules" the founder wants.
3. **Build the Capsule Marketplace v1** — discovery, ratings, free/credits/paid, Stripe Connect
   payouts, private/org libraries, and a computed **Verified** badge driven by capsule evals + Sigstore
   signing. This is the moat: the GPT Store has no provenance or certification; >50% of its bots
   violate policy.
4. **Deepen the agentic research + sourcing + drafting engine** as durable, streaming, fully-cited
   runs on the existing GCP stack (Genkit/ADK + Cloud Run + Cloud Tasks + Pub/Sub + Firestore), with
   a drafting workspace that produces briefs/memos/SITREPs with inline citations and DOCX/PDF/Docs export.
5. **Make it dead-simple but powerful:** Ask-PRAXIS-first entry, capsule picker, one-button deep
   research with a visible run timeline, progressive disclosure, generative UI streaming.

**Sellable outcome:** a Practitioner can go from blank to a cited, exportable conflict brief in
minutes using a Verified capsule; a Team can maintain a private capsule library; an Institution gets
audit trails, no-train guarantees, RBAC, and a path to SOC2. Creators have a reason to publish.

---

## 2. Current state (ground truth) and the honest gaps

### What exists (do not reinvent — extend)

| Capability | Where it lives today | State |
|---|---|---|
| ContextCapsule unified schema | ADR `docs/adr/0050-context-capsule-unified-schema.md`; types in `src/types/` / `src/lib` | Defined; capsule executes as context for AI routes |
| User Core / Situation Core | `src/lib/firebase/situations-service.ts`, Firestore `users/{uid}/situations/{sitId}` | Live |
| Calibration contract | `src/lib/api/with-calibration.ts`, `src/lib/context/profile-context.ts` (`buildCalibratedContext`), `src/lib/context/system-prompt-block.ts` | Live; 53 AI routes calibrated, 11 dims audited by `scripts/audit-ai-routes.mjs` |
| Domain taxonomy + prototypal merge | `src/lib/domain/seeds.ts`, `resolve.ts`, `classifier.ts`; Firestore `config/domains/{id}` | Live — **the merge engine to generalize for capsules** |
| ACO v2.0 ontology | `backend/graphify_tacitus/schemas/relationships.py` | Live |
| SKC 4-layer GraphRAG | `src/lib/knowledge/{graph,vector,feed,tool-output}-layer.ts` | Live (Firestore vector KNN, 768-dim `text-embedding-005`) |
| Tool registry (55 surfaces) | `src/lib/constants/tool-registry.ts`, `src/lib/tools/tool-path-taxonomy.ts` | Live |
| Credits + pricing | `src/lib/api/with-credits.ts`; tiers Free/$49/$199/Institution | Live |
| Model discipline | `src/lib/ai/providers.ts`, `src/lib/ai/MODEL_MATRIX.json` (Gemini 2.5 flash/pro) | Live; enforced by audit |
| Durable agent runtime (Tasklet) | `docs/product/TASKLET_STYLE_PRAXIS_AGENT_RUNTIME_PLAN.md`; Cloud Run + Cloud Tasks + Pub/Sub | **In progress / partial** |
| Grounded research | Grounding with Google Search (canonical live path), AI SDK v6 | Live |
| Drafting / Docs Library | `src/app/app/*` cockpit, memo drafting panels | Partial; needs a real citation-aware editor + export |

### The honest gaps (what's missing to be "sellable" around capsules)

1. **No capsule CRUD/Builder UI** — capsules can't be authored, drafted, forked, versioned, or
   published by a user. This is the founder's #1 ask.
2. **No marketplace** — no discovery, ratings, install, payouts, or trust/certification surface.
3. **No capsule composability** — capsules can't import/extend each other (the merge engine exists
   for domains but isn't generalized).
4. **No capsule eval/certification** — nothing computes "is this capsule good and grounded?" so there
   is no trust signal to sell.
5. **No declarative sourcing/retrieval per capsule** — grounding choices are code, not capsule data.
6. **Drafting is thin** — no citation-per-claim editor, no brief/memo/SITREP templates, no DOCX/PDF/
   Docs export, no shareable report links.
7. **Agentic runs aren't a transparent, durable, streaming product surface** for the user.

---

## 3. The Context Capsule, done right

### 3.1 Capsule data model (extends, not replaces, ADR 0050)

Add the marketplace / composability / eval / provenance layers on top of the existing schema. Mirror
in Pydantic v2 (FastAPI) and as a Genkit Zod schema / Dotprompt output schema.

```typescript
// EXISTING (referenced, not redefined): AnalystProfile, SituationCore, DomainKey,
// ToolSurfaceId (tool-registry), FrameworkId (15 frameworks).

export interface ContextCapsule {
  // Identity & lineage (LangChain-Hub pattern)
  id: string;                         // marketplace-unique slug, e.g. "sanctions-impact-analyst"
  schemaVersion: "capsule/v2";        // ADR 0050 unified schema, bumped
  version: SemVer;                    // "2.3.1"
  contentHash: string;                // sha256 of canonicalized body == the commit hash
  status: "draft" | "published" | "deprecated" | "verified";
  forkedFrom?: CapsuleRef;            // fork lineage
  immutable: boolean;                 // true once published → edits create a new version

  // Composability (generalize the domain prototypal-merge engine)
  extends?: CapsuleRef;               // single-parent prototype chain (like domain 'generic')
  imports?: CapsuleImport[];          // multi-capsule composition (Dotprompt-partial at capsule scale)
  mergeStrategy: "prototype" | "deep-merge" | "override";

  // Persona / system frame (deepens AnalystProfile; withCalibration still injects at runtime)
  persona: {
    analystProfile: Partial<AnalystProfile>;
    systemFrame: string;             // <analyst-profile><situation-frame><output-constraints><domain-frame>
    domain: DomainKey;
    frameworks: FrameworkId[];       // e.g. ["zartman-ripeness","stedman-spoilers"]
    fewShot: FewShotExample[];       // versioned exemplars (input → ideal grounded output)
  };

  // Structured output (Gemini responseJsonSchema + Zod re-validation)
  output: {
    format: "json" | "markdown" | "report" | "brief";
    responseJsonSchema: JSONSchema7;
    propertyOrdering: string[];      // MUST match prompt ordering
    zodRef?: string;                 // defineSchema() name for type-safe path
    renderTemplate?: string;         // Handlebars for report assembly
  };

  sourcing: SourcingPolicy;          // §6 — declarative grounding contract
  retrieval: RetrievalConfig;        // §6 — drives SKC 4-layer GraphRAG

  tools: { bound: ToolSurfaceId[]; recommended: ToolSurfaceId[]; policy: "auto"|"suggest"|"manual" };

  guardrails: {
    refusalPolicy: string; blockedTopics: string[];
    piiHandling: "redact" | "block" | "allow";
    citationRequired: boolean;       // hard gate: no claim ships without a source
    maxUngroundedClaims: number;     // 0 for the "verified" tier
    safetySettings: VertexSafetySetting[];
  };

  eval: CapsuleEval;                 // §5 — capsule ships its own test suite → certification
  provenance: {
    author: { uid: string; org?: string };
    createdAt: string; publishedAt?: string;
    signature?: SigstoreBundle;      // keyless cosign over contentHash
    attestation?: InTotoAttestation; // SLSA: inputs (parent hash, golden-set hash), eval run id, builder
    certification?: CertificationBadge;
  };

  market: {
    visibility: "private" | "org" | "unlisted" | "public";
    pricing: "free" | "credits" | "subscription";
    credits?: number; category: DomainKey; tags: string[];
    installs: number; rating: number;
    revenueShare?: { authorUid: string; pct: number };  // Poe-style monetization
  };
}

interface CapsuleImport { ref: CapsuleRef; as: string; pick?: (keyof ContextCapsule)[]; }
interface CapsuleRef   { id: string; version?: SemVer; hash?: string; } // pin or float
```

### 3.2 Lifecycle

`draft → (eval) → publish (freeze contentHash, sign) → install/use → fork → new version → deprecate`.
Published versions are immutable; consumers pin a version/hash or float to latest within a semver
range. Forking copies with a `forkedFrom` pointer.

### 3.3 Composability

Generalize the prototypal merge already in `src/lib/domain/resolve.ts` into a capsule resolver
(`resolveCapsule(ref)`): walk `extends` (single-parent prototype chain), apply `imports` (pull named
fields from other capsules), then `mergeStrategy`. A "Mediation – Sudan" capsule = `extends`
`conflict-analysis-base` + `imports` `[citation-rigor, sudan-corpus]`.

### 3.4 Guardrails & structured output (reliability rules)

- Use **`responseJsonSchema`** (not legacy `responseSchema`) on Gemini 2.5+ with
  `responseMimeType: "application/json"`; keep `propertyOrdering` in sync with prompt ordering.
- Generation guarantees syntactic validity, **not** semantic correctness — always re-validate with
  `output.zodRef` (Zod) / Pydantic in app code (this already matches the `Output.object()` convention).
- Flatten/shorten deep schemas; compose multiple small capsule outputs rather than one mega-schema.
- Pin a model version per capsule (grounding metadata shape varies by model) before allowing "verified".

---

## 4. Capsule Builder UX (inside Home + Capsules)

A non-technical analyst should author a capsule without seeing JSON. Two modes, one surface.

**Guided wizard (default):**
1. **Job** — "What should this capsule do?" (plain language) → AI drafts persona + suggests domain,
   frameworks, and an output template.
2. **Sources** — pick sourcing mode (live Google Search / capsule corpus / SKC / hybrid), upload
   reference docs, set allow/block domains, recency window, min sources per claim.
3. **Output** — choose a deliverable shape (brief / memo / SITREP / structured JSON) from templates;
   the wizard generates the `responseJsonSchema` behind the scenes.
4. **Tools** — pick from the 55 surfaces (pre-filtered by domain); set auto/suggest/manual.
5. **Test & evaluate** — run the capsule against 2–3 sample questions; show citation coverage,
   faithfulness, schema conformance live ("dry-run eval"). One-click "expand golden set" (synthetic).
6. **Publish** — choose visibility + pricing; freeze + sign; submit to certification queue.

**Advanced mode:** a side-by-side editor exposing the raw capsule (Monaco/JSON + live preview),
`extends`/`imports`, full eval thresholds, Dotprompt body with partials.

**AI-assisted authoring throughout:** "Improve this persona", "Tighten the output schema",
"Suggest sources for this domain", "Generate few-shot examples" — the builder is itself a capsule.

---

## 5. Capsule eval & "Verified" certification (the moat)

Every capsule ships an eval suite. Certification is **computed, signed, and badged** — this is what
the GPT Store can't offer and what justifies premium pricing and Institution trust.

**Three-tier evaluation engine** (Python, in `backend/`, callable from the publish flow):
1. **Computation metrics** (cheap CI gate): JSON-schema-conformance rate, **citation coverage %**
   (segments with `groundingSupports` ÷ total), latency, cost, ROUGE/BLEU vs golden.
2. **RAGAS** (OSS, Gemini-as-judge): `Faithfulness` (core trust metric), `ResponseRelevancy`,
   `LLMContextPrecision/Recall`, `FactualCorrectness`, `ContextEntityRecall` (did it retrieve the
   right ACO entities), and for agentic capsules `ToolCallAccuracy` / `AgentGoalAccuracy`.
3. **Vertex AI Gen AI Evaluation Service** (judge = `gemini-2.5-flash`): adaptive rubrics for nuanced
   policy quality; `PointwiseMetric` (groundedness/instruction-following/coherence/safety) and
   `PairwiseMetric`/AutoSxS to prove a new version beats the previous before promotion.
4. **promptfoo** red-team: auto-generate prompt-injection / jailbreak / policy-violation cases. A
   capsule can't reach "verified" if it fails red-team.

```typescript
interface CapsuleEval {
  goldenSetRef: string;
  thresholds: { faithfulness: number; citationCoverage: number; contextRecall: number;
                schemaConformance: number; redTeamPassRate: number; safetyScore: number };
  metrics: ("faithfulness"|"response_relevancy"|"context_precision"|"context_recall"
          |"factual_correctness"|"tool_call_accuracy"|"agent_goal_accuracy")[];
  judge: "gemini-2.5-flash";
  lastRun?: { runId: string; scores: Record<string, number>; passedAt: string };
}
interface CertificationBadge {
  tier: "community" | "reviewed" | "verified";
  scores: Record<string, number>; evalRunId: string; signedBy: string; expiresAt: string;
}
```

**Certification ladder shown in the marketplace:**
- **Community** — published, signed, passes schema + safety gates.
- **Reviewed** — passes RAGAS + Vertex rubric thresholds on its golden set.
- **Verified ⭐** — Reviewed + red-team ≥98% + `maxUngroundedClaims: 0` + human analyst sign-off +
  **Sigstore signature over the eval run**. Re-certify on model upgrade / corpus drift.

**Provenance & signing:** sign `contentHash` with Sigstore/cosign keyless (Rekor transparency log) to
prove *who* published; attach an in-toto/SLSA attestation to prove *how* it was built (parent hash,
golden-set hash, eval run id). The marketplace verifies signature + attestation before rendering
Verified.

---

## 6. Agentic research & sourcing engine

Turn research into a **durable, streaming, fully-cited run** that the user watches.

**Pipeline (orchestrator → workers → verify → synthesize):**
1. **Plan** — decompose the question into sub-questions (capsule persona + domain frameworks shape this).
2. **Source** — fan out across sourcing connectors per the capsule's `SourcingPolicy`:
   Grounding with Google Search (canonical live path), plus optional **Exa / Tavily / Firecrawl**
   for deep web, and policy-specific feeds **GDELT / ACLED / ReliefWeb / OpenAlex/Semantic Scholar**.
   Fuse, dedupe, and rank by source trust + recency.
3. **Retrieve** — SKC 4-layer GraphRAG (graph expansion over ACO relationships + Firestore vector KNN
   + feed + prior tool outputs); capsule-owned corpora via **Vertex AI RAG Engine** when declared.
4. **Verify** — claim decomposition + faithfulness check; drop/flag any segment lacking
   `groundingSupports`; enforce `minSourcesPerClaim`.
5. **Synthesize** — produce the capsule's structured output with inline citations.

**Durable orchestration on the existing stack:** model each run as an `AgentRun` document in Firestore
(plan, steps, tool calls, approvals, outputs, retries, audit events — matching the Tasklet runtime
plan). Long steps dispatch via **Cloud Tasks**; events fan out on **Pub/Sub**; the UI streams the run
timeline via Firestore `onSnapshot` (and AI SDK v6 streaming for token-level output). Orchestrate with
**Genkit flows + Vertex ADK**; keep **LangGraph** as the open-source reference pattern for the
supervisor/worker loop (useful for on-prem Institution deals).

**Citation grounding mechanic:** parse `candidate.groundingMetadata` on every grounded response —
`groundingChunks[]` (uri/title) + `groundingSupports[]` (segment offsets + chunk indices); render
inline markers by walking supports in descending `endIndex`. Do not depend on `confidenceScores`
(empty on Gemini 2.5+); derive confidence from the faithfulness eval pass.

**Human-in-the-loop:** capsule `tools.policy: "suggest"` pauses for approval before expensive/external
tool calls; the run timeline shows "approve / skip / edit".

---

## 7. Drafting & deliverables workspace

The writing surface where evidence becomes a brief. Build on the cockpit's Docs Library.

- **Editor:** TipTap/ProseMirror (or BlockNote) with a **citation mark** type — every sentence can
  carry source references resolved from the run's grounding metadata. Hover → source card.
- **Templates:** brief / memo / SITREP / talking points / decision memo — each is a capsule output
  template, so templates are themselves marketplace items.
- **AI actions:** redraft, expand, tighten, change audience tone (uses `AnalystProfile.workingStyle`),
  insert evidence, **fact-check pass** (re-runs verification over the draft and flags unsupported claims).
- **Provenance per claim:** store source map alongside the doc; "show sources" toggles inline footnotes.
- **Export:** DOCX (`docx`), PDF (Puppeteer/`pdf-lib` on Cloud Run), **Google Docs/Slides** via Drive
  API, plus shareable read-only report links with watermark + audit log.

---

## 8. Simple-but-powerful UX — the pre/post-login simplification (CRITICAL)

> This section is a direct response to the current live UI (May 2026 screenshots). It is the most
> important UX work in the plan: the product *feels* heavy, and the logged-out page exposes nearly the
> entire working cockpit. The real capability must read as **three things only — the Capsule, the
> Agentic engine, the Marketplace** — and everything else must be progressively disclosed.

### 8.0 What's wrong today (review of the live UI)

**Logged-out Home (`/`) — Screenshot 1.** The public front door is currently rendering the full
authenticated cockpit to anonymous visitors:
- A black promo bar, a green "Systems ready for Ask, agents, memory, and exports" status pill, a
  **"Diagnostics: 2 red flags"** button, and a "Search app" — all internal/operational chrome that
  means nothing to a first-time visitor and erodes trust ("red flags" on a marketing page).
- The entire **5-column context model** (User Core / Situation / Sources / Thinking devices / Output)
  with "Context health: needs review", "Sources needed", a horizontal scrollbar, and a prompt box —
  i.e. the working tool — is shown *before anyone signs in*.
- "PRAXIS will read / may use" capability rows, a **Created Work** list (Ask pack / Tool artifact /
  Output capsule with Open/Attach/Continue/Inspect actions), and a **Capsules** section with a
  "Sign in to build" + "Repository lane" and a giant **filter receipt** ("all capsules / 205
  catalogued", Types/Domains/Policy Teams facet clouds).
- Net: severe information overload, no clear single call to action, no narrative of *why* PRAXIS, and
  pre-login is ~95% identical to post-login.

**Logged-in Home (`/app`) — Screenshot 2.** Same density carries in, plus a left rail (New capsule /
Capsules / Capsule workspace / Recent / Created Work / Agent runs) and a floating "Guide assistant".
The hero "What can PRAXIS do for you?" sits above the same heavy cockpit. There are too many competing
entry points (Open Capsules, Personal Knowledge Board, Search app, Diagnostics, New capsule, Browse
capsules) for the user to know the one thing to do next.

### 8.1 Design principles (apply everywhere)

1. **Pre-login sells; post-login works.** The public site must never render the cockpit. It explains
   the value (capsules + agentic research + marketplace), shows proof, and drives one action: *start*.
2. **One primary action per screen.** Home = one prompt/CTA. Everything else is secondary.
3. **Progressive disclosure.** The 5-column context model, diagnostics, context-health, receipts, and
   filter facets are *advanced* surfaces revealed on demand — not the default view.
4. **Three capabilities, named plainly:** **Capsules** (what configures the AI), **Research runs**
   (the agentic engine that does the work), **Marketplace** (get more capsules). Everything else is
   "extra".
5. **Hide operational chrome from users.** "Diagnostics / red flags / systems ready / Search app /
   catalogued counts" are operator tools → move behind an admin/debug flag, never on marketing or the
   default cockpit.
6. **Light, calm, spacious.** Fewer borders/cards on screen at once; generous whitespace; one accent.

### 8.2 New public (logged-out) Home — `src/app/page.tsx`

Replace the cockpit with a clean marketing/landing page. Sections, top to bottom:
- **Nav:** logo · Capsules (marketplace preview) · Pricing · Learn · **Sign in** · **Start free** (one
  filled CTA). Remove Diagnostics, Search app, status pills, promo bar.
- **Hero:** one line — *"Turn any policy question into a sourced, citable brief."* Subline names the
  three capabilities in one sentence. **One** prompt box ("Ask a policy question…") + **Start free**.
  Typing a question → sign-in/sign-up, then lands in the cockpit with that question pre-filled.
- **Three capability cards** (not the cockpit): *Context Capsules* · *Agentic research* ·
  *Capsule marketplace* — each one sentence + icon.
- **Marketplace teaser:** 6–8 Verified capsule cards (Conflict Analysis, Sanctions Impact, …) read-only.
- **Proof / trust:** "every claim cited", "no-train", Verified badge explainer; logos/quotes when available.
- **Pricing strip** (Free / Practitioner / Team / Institution) → Pricing page.
- **Footer.** All gated cockpit data fetches removed from this route (faster, no auth needed).

### 8.3 New signed-in Home — `src/app/app/page.tsx`

A calm launchpad, not the full cockpit:
- **One hero prompt** ("What do you want to analyze?") with an inline **capsule chip** (defaults to a
  recommended/last-used capsule; click to swap). Submitting starts a **research run** → opens the run
  timeline. This is the single primary action.
- **Three quiet entry points** below: *Your capsules* · *Browse marketplace* · *Recent work* (max 3–4
  items, "see all" link). Nothing else.
- The **5-column context model becomes an "Advanced / Edit context" disclosure** — collapsed by
  default, opened by power users who want to hand-tune User Core/Situation/Sources/Tools/Output. Most
  users never open it; the capsule + agentic engine fill it automatically.
- **Move operator chrome** (Diagnostics, "systems ready", Search app, "catalogued" counts, context-
  health red flags) behind an admin/debug panel gated by the existing `ADMIN_ALLOWLIST` / a debug flag.
  Replace user-facing "Context health: needs review / 2 red flags" with a single soft hint only when it
  blocks a run (e.g. "Add a source to improve grounding").

### 8.4 Categorize the "extra" (what moves out of the default view)

| Today (overloaded default) | Where it goes |
|---|---|
| Diagnostics / red flags / "systems ready" / Search app | Admin/debug panel (flag-gated), not user-facing |
| 5-column context model, context-health, "sources needed" | "Advanced / Edit context" disclosure inside the cockpit |
| "PRAXIS will read / may use" capability rows | A small "How this capsule sources" popover on the capsule |
| Created Work list on Home | Recent work (max 3–4) + a "Work" tab |
| Capsules filter receipt ("205 catalogued", Types/Domains/Teams clouds) | Inside the Marketplace/Capsules page as collapsible filters |
| Repository lane / Personal Knowledge Board / Capsule workspace | One "Workspace" entry in the rail; consolidate overlapping names |

### 8.5 Other UX upgrades

- **Run timeline** as the post-submit hero: a live, collapsible trace (plan → sources → verify → draft)
  so power is *visible* but calm. Streaming via AI SDK v6 generative UI.
- **Capsule picker:** ⌘K command palette + gallery (recently used / your library / marketplace).
- **Onboarding to first value:** 3-screen wizard → land on a starter Verified capsule + a sample
  question → first cited brief in <5 minutes.
- **Naming cleanup:** unify "Capsule workspace / Repository lane / Personal Knowledge Board" into one
  clear term. Fewer nouns = simpler product.
- **Collaboration:** shared workspaces + co-editing briefs (Firestore realtime first; Yjs/Liveblocks if
  concurrent cursors needed); comments and org capsule sharing.

### 8.6 Acceptance criteria for the simplification

- Logged-out `/` makes **zero authenticated/cockpit data calls** and shows **no** Diagnostics / context
  model / receipts; it has exactly **one** primary CTA.
- A first-time visitor can state in one sentence what PRAXIS does after 5 seconds on the page.
- Signed-in `/app` default view shows the prompt + capsule chip + ≤4 recent items and **nothing else**
  above the fold; the context model is collapsed by default.
- All operator chrome is flag-gated and invisible to normal users.
- Lighthouse/CWV on `/` improves (no heavy client cockpit bundle on the public route).

---

## 9. Reference architecture (extends the current one)

```
┌──────────────────────────────────────────────────────────────────────┐
│ Frontend — Next.js 16 (Cloud Run)                                      │
│  Home + Capsules cockpit · Capsule Builder · Marketplace · Drafting     │
│  AI SDK v6 streaming / generative UI · ⌘K · TipTap citation editor      │
├──────────────────────────────────────────────────────────────────────┤
│ App API (src/app/api/*)  withAuth → withCredits → withCalibration       │
│  /api/capsules/*   CRUD, fork, publish, resolve(extends/imports)        │
│  /api/marketplace/*  list, install, rate, payouts (Stripe Connect)      │
│  /api/runs/*       create/stream AgentRun · /api/draft/* · /api/export/* │
├──────────────────────────────────────────────────────────────────────┤
│ Backend — Python FastAPI (Cloud Run, private)                           │
│  Genkit flows + Vertex ADK · agentic plan→source→retrieve→verify→synth  │
│  Eval engine (computation + RAGAS + Vertex Gen AI Eval + promptfoo)      │
│  Capsule signing (cosign/Sigstore + in-toto)                            │
├──────────────────────────────────────────────────────────────────────┤
│ Data / runtime                                                          │
│  Firestore (capsules, runs, drafts, orgs) · Firestore vector KNN (SKC)  │
│  Vertex AI RAG Engine (capsule corpora) · Grounding w/ Google Search    │
│  Cloud Tasks (durable steps) · Pub/Sub (events) · Cloud Scheduler        │
│  Cloud Storage (uploads/exports) · Secret Manager · BigQuery (analytics)│
│  Stripe Connect (marketplace payouts)                                   │
└──────────────────────────────────────────────────────────────────────┘
```

**Tech-stack decisions:**

| Concern | Chosen | Why | OSS alternative |
|---|---|---|---|
| Capsule store | Firestore | Single source of truth, owner-only rules, realtime | Postgres + pgvector |
| Capsule versioning | `contentHash` + immutable docs | LangChain-Hub pattern, simple, auditable | git-backed |
| Composability | generalize domain prototypal merge | code already exists | — |
| SKC vector | Firestore vector KNN (768-dim) | ACL-native, cheap, already built | Qdrant |
| Capsule corpora | Vertex AI RAG Engine | managed, swappable backends, matches embeddings | LlamaIndex + Qdrant |
| Live research | Grounding with Google Search | canonical, already wired | Exa/Tavily |
| Agent orchestration | Genkit + Vertex ADK | on-stack, traced | LangGraph |
| Durable runs | Cloud Tasks + Pub/Sub + Firestore | already in the Tasklet plan | Temporal |
| Eval | RAGAS + Vertex Gen AI Eval + promptfoo | reference-free faithfulness + managed rubrics + red-team | DeepEval |
| Signing | Sigstore/cosign + in-toto | cryptographic Verified badge | — |
| Drafting editor | TipTap | citation marks, mature | BlockNote/Lexical |
| Export | docx + pdf-lib + Drive API | covers DOCX/PDF/Docs | Pandoc |
| Marketplace payments | Stripe Connect | standard creator payouts | — |
| Collaboration | Firestore realtime → Yjs/Liveblocks | start simple | Yjs |
| Observability | Genkit traces + Cloud Logging/Trace | on-stack | Langfuse |

---

## 10. Recommended launch capsule set (8–10, domain-anchored)

Each ships persona + frameworks + output schema + sourcing policy + bound tools + golden set, and
targets **Verified** at launch to seed trust.

1. **Conflict Analysis Brief** — Glasl/Galtung; actors, escalation, scenarios; live + ACLED/GDELT.
2. **Sanctions Impact Analysis** — designations, evasion, second-order economic effects; gov + news.
3. **Economic Policy Analysis** — policy → macro/sector impact, stakeholders, options memo; OpenAlex + gov data.
4. **Mediation / Negotiation Readiness** — Zartman ripeness + Stedman spoilers; positions/interests, BATNA map.
5. **Treaty / Legal Review** — clause analysis, obligations, precedent; document corpus + grounded search.
6. **Humanitarian SITREP** — OCHA/IPC frameworks; needs, access, severity; ReliefWeb.
7. **Election / Political Risk Watch** — actors, scenarios, timeline; live search + recency window.
8. **Energy / Resource Security** — supply, leverage, chokepoints; news + structured feeds.
9. **Stakeholder Mapping & Decision Memo** — salience (Mitchell-Agle-Wood), recommendation memo.
10. **OSINT Source-to-Brief** — turn a media report/URL into talking points with citations (viral on-ramp).

The last one is the free, shareable flywheel capsule — low credit cost, high "wow", easy to share.

---

## 11. Security, trust & compliance

- **Provenance & audit trail:** every AgentRun and capsule publish writes an immutable audit event;
  every claim carries its source map. Sells directly to gov/Institution buyers.
- **No-train guarantee** — Vertex with no data used for training; state it explicitly in marketing.
- **RBAC / multi-tenant** — extend `firestore.rules` for org-scoped capsule libraries and roles
  (owner/editor/viewer); keep owner-only isolation intact (a Security Boundary file — change only with approval).
- **Marketplace trust & safety** — certification ladder + Sigstore signing + red-team gate + report/abuse flow.
- **Data residency** — Institution tier: region-pinned Firestore/Vertex; Vertex AI Search for governed corpora.
- **Path to SOC2** — audit logging, access reviews, secret hygiene (already on Secret Manager), change control.
- **Respect the existing Security Boundaries** in `CLAUDE.md` (`with-auth.ts`, `admin.ts`, `proxy.ts`,
  `firestore.rules`, `cookie-signer.ts`) — do not loosen; extend via new files.

---

## 12. Phased roadmap

| Phase | Goal | Scope | Success metric | Effort |
|---|---|---|---|---|
| **0 — Hardening** | stable base | green `npm run build`/`typecheck`/`lint`/`vitest`/audits; finalize durable AgentRun runtime; pin model versions per capsule | all gates green; AgentRun durable + streaming | ~1 wk |
| **1 — Sellable MVP** | capsules + cited deliverables + **simplified UX** | **pre/post-login simplification + homepage rebuild (EPIC 1.9, do first)**; capsule schema v2 + resolver (extends/imports); Capsule Builder (wizard); 8–10 launch capsules; agentic research run w/ citations; drafting workspace + DOCX/PDF export; dry-run eval | a first-time visitor understands PRAXIS in 5 s; a Practitioner produces a cited, exported brief from a Verified capsule in <5 min | ~5–7 wks |
| **2 — Marketplace** | network effects | discovery/ratings/install; free/credits/paid; Stripe Connect payouts; private/org libraries; full eval engine + Sigstore Verified badge; collaboration v1 | first external creator publishes a Verified capsule; first paid install | ~4–6 wks |
| **3 — Enterprise** | Institution scale | RBAC/org admin; Vertex AI Search corpora; data residency; audit export; SOC2 path; co-editing | first Institution pilot with private capsule library + audit trail | ~6–8 wks |

---

## 13. Codex execution backlog (Phases 0–1, file-level)

> Conventions to honor in every task: model strings only via `src/lib/ai/providers.ts` +
> `MODEL_MATRIX.json`; AI routes wrap `withCalibration()` → `withAuth` → credits; persist via
> `saveToolOutput`; gate UI with `useSituationGuard()`; structured output via `Output.object()` + Zod;
> never touch Security Boundary files without explicit approval. Validate each epic with
> `npx tsc --noEmit && npm run build && npm run lint && npx vitest run` plus relevant audits
> (`node scripts/audit-ai-routes.mjs`, `npm run audit:repo-shape`, `npm run audit:gate`).

### EPIC 0.1 — Hardening & durable AgentRun
- Confirm all validation gates green; record a checkpoint in `STATUS.md`.
- Finalize the `AgentRun` Firestore model + Cloud Tasks dispatch + Pub/Sub events + `onSnapshot`
  streaming per `docs/product/TASKLET_STYLE_PRAXIS_AGENT_RUNTIME_PLAN.md`. Files: `src/app/api/runs/*`,
  backend run workers, `firestore.rules` (runs collection, owner-only).
- **Acceptance:** a run persists plan/steps/outputs/audit events and streams to the UI; survives a
  worker restart (durable). Add a Vitest contract test for the run state machine.

### EPIC 1.1 — Capsule schema v2 + resolver
- Extend the ADR 0050 type with the v2 fields (§3.1) in `src/types/context-capsule.ts` (+ Zod schema
  in `src/lib/ai/schemas/context-capsule.ts`; Pydantic mirror in `backend/`).
- Implement `resolveCapsule(ref)` in `src/lib/capsules/resolve.ts` by generalizing the prototypal merge
  from `src/lib/domain/resolve.ts` (extends → imports → mergeStrategy). Unit tests for merge order.
- **Acceptance:** a capsule with `extends` + `imports` resolves to a single effective capsule;
  `contentHash` is stable/canonical; round-trips through Firestore.

### EPIC 1.2 — Capsule CRUD API + storage
- Firestore collection `capsules/{id}` (+ `versions/{hash}` immutable). Routes under
  `src/app/api/capsules/*`: create, get, list (mine/org/public), update-draft, fork, publish
  (freeze hash). All wrapped `withAuth`; publish enforces eval-pass + visibility.
- Extend `firestore.rules`: owner can write drafts; published versions immutable; org/public read rules.
- **Acceptance:** create→draft→fork→publish lifecycle works end-to-end with rules tests.

### EPIC 1.3 — Capsule Builder UI (wizard)
- New cockpit surface under `src/app/app/capsules/builder/*` + components in `src/components/capsules/*`
  (6-step wizard §4, advanced JSON mode with Monaco + live preview).
- AI-assisted authoring routes (`/api/capsules/assist/*`) using `withCalibration` (persona drafting,
  schema generation, source suggestions, few-shot generation).
- **Acceptance:** a non-technical user authors and publishes a capsule without editing JSON.

### EPIC 1.4 — Declarative sourcing + retrieval
- Implement `SourcingPolicy` + `RetrievalConfig` (§6) consumed by the research engine. Wire
  `mode: live-search|corpus|skc|hybrid` to: Grounding w/ Google Search (existing), SKC layers
  (`src/lib/knowledge/*`), and Vertex AI RAG Engine (`backend/` corpus client, new).
- Add connectors behind a uniform interface in `src/lib/data-feeds/`: Exa, Tavily, Firecrawl, GDELT,
  ACLED, ReliefWeb, OpenAlex (feature-flagged; keys in Secret Manager). Fuse + dedupe + trust-rank.
- **Acceptance:** switching a capsule's sourcing mode changes retrieval with no code change; citations
  carry source uri/title.

### EPIC 1.5 — Agentic research run (cited)
- Genkit/ADK flow: plan → source → retrieve → verify → synthesize, persisting into `AgentRun`.
  Backend: `backend/ai/flows.py` (+ ADK agent). Parse `groundingMetadata` → inline citation map.
  Verification step enforces `minSourcesPerClaim` / `maxUngroundedClaims`.
- Frontend run timeline component (`src/components/runs/run-timeline.tsx`) streaming via `onSnapshot` +
  AI SDK v6.
- **Acceptance:** "ask → deep research" yields a structured, fully-cited output with a visible trace;
  ungrounded claims are flagged.

### EPIC 1.6 — Drafting workspace + export
- TipTap editor with a citation mark in `src/components/drafting/*`; brief/memo/SITREP/talking-points
  templates (capsule outputs). AI actions (redraft/expand/tighten/tone/fact-check) via calibrated routes.
- Export service: `/api/export/*` → DOCX (`docx`), PDF (`pdf-lib`/Puppeteer on Cloud Run), Google Docs
  (Drive API); shareable read-only report links with audit log.
- **Acceptance:** a run output opens in the editor with inline citations and exports to DOCX/PDF/Docs.

### EPIC 1.7 — Dry-run capsule eval (MVP slice of §5)
- Backend eval endpoint computing computation metrics + RAGAS Faithfulness + citation coverage on
  2–3 sample prompts; surfaced in the Builder "Test & evaluate" step. (Full Vertex Gen AI Eval +
  promptfoo red-team + Sigstore signing land in Phase 2.)
- **Acceptance:** the Builder shows live faithfulness / citation-coverage / schema-conformance before publish.

### EPIC 1.8 — 8–10 launch capsules
- Author the §10 capsules as seed data (`scripts/seed-capsules.ts`, idempotent) with golden sets.
- **Acceptance:** all launch capsules pass dry-run eval thresholds and appear in "your library".

### EPIC 1.9 — Pre/post-login simplification & homepage rebuild (§8) — DO THIS FIRST in Phase 1
This is the highest-visibility work and should land before/alongside 1.1. Implements §8 in full.
- **Public Home rebuild** — `src/app/page.tsx`: remove the cockpit and ALL authenticated/cockpit data
  fetches from the public route. Build a light marketing page (nav → hero with one prompt + one
  "Start free" CTA → three capability cards → marketplace teaser → trust/proof → pricing strip →
  footer) per §8.2. New marketing components in `src/components/marketing/*`. Typing a question routes
  to sign-up then deep-links into `/app` with the question pre-filled.
- **Signed-in Home rebuild** — `src/app/app/page.tsx`: calm launchpad per §8.3 — one hero prompt + a
  capsule chip (default recommended/last-used) + ≤4 recent items + three quiet links (Your capsules /
  Browse marketplace / Recent work). Submitting starts a research run (ties to EPIC 1.5).
- **Demote the 5-column context model** to an "Advanced / Edit context" collapsible disclosure inside
  the cockpit components; collapsed by default.
- **Flag-gate operator chrome** — Diagnostics / "systems ready" / Search app / "catalogued" counts /
  context-health "red flags": behind `ADMIN_ALLOWLIST` or a `NEXT_PUBLIC_PRAXIS_DEBUG` flag; removed
  from default user view. Replace user-facing context-health with a single soft hint shown only when it
  blocks a run.
- **Categorize "extra"** per the §8.4 table: receipts/filter facets move into the Marketplace/Capsules
  page as collapsible filters; "PRAXIS will read/may use" becomes a small "How this capsule sources"
  popover; Created Work → Recent work (≤4) + a Work tab.
- **Naming cleanup** — unify "Capsule workspace / Repository lane / Personal Knowledge Board" into ONE
  term (e.g. "Workspace") across nav, rail, and routes; keep legacy routes as redirects.
- **Acceptance (must verify):** logged-out `/` makes zero authenticated/cockpit data calls and shows no
  Diagnostics/context-model/receipts, with exactly one primary CTA; signed-in `/app` default shows
  prompt + capsule chip + ≤4 recent items above the fold with the context model collapsed; all operator
  chrome is flag-gated; `npm run build` + `npm run audit:repo-shape` pass; add a Playwright check that
  `/` renders the marketing hero and not the cockpit. Capture before/after screenshots in the PR.

---

## 14. Risks & open questions

- **Capsule schema sprawl** — keep ADR 0050 the single source of truth; bump to `capsule/v2` via a
  migration, don't fork the type.
- **Eval cost** — Gemini-as-judge runs cost credits; gate full eval to publish-time, dry-run uses a
  small sample.
- **Grounding metadata variance by model** — pin model version per capsule; re-certify on model change.
- **Marketplace trust & safety / payouts** — Stripe Connect KYC, abuse reporting, and content
  moderation are Phase 2 prerequisites before public listing.
- **Surface creep** — every new capability must land inside Home + Capsules; resist new top-level nav.
- **Open decisions for the founder:** (1) primary launch buyer (think-tank/NGO/gov vs corporate risk)
  to prioritize launch capsules; (2) marketplace monetization at GA (credits-only vs paid + payouts);
  (3) collaboration depth in Phase 2 (Firestore realtime vs Liveblocks).

---

### Appendix A — Research provenance
Capsule/RAG/eval design synthesized from a completed deep-research stream (2025–2026 sources):
Vertex AI RAG Engine / Vertex AI Search / Grounding with Google Search; Gemini `responseJsonSchema`;
Genkit Dotprompt (partials/variants); Firestore vector KNN; RAGAS + Vertex Gen AI Evaluation Service +
promptfoo; LangGraph + LlamaIndex; Sigstore model-signing v1.0 + in-toto/SLSA; LangChain Hub
versioning; comparative analysis of Custom GPTs / Gemini Gems / Claude Projects / Poe. Full source
links retained in the workflow output. The agentic/marketplace/UX research streams hit a model session
limit and were completed from in-repo ground truth (`CLAUDE.md`, `README.md`, ADRs) plus established
patterns; re-run the workflow after 4:50am ET to deepen sections 6–8 with fresh citations if desired.
