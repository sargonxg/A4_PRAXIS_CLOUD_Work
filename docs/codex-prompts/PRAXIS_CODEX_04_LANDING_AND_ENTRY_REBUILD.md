# PRAXIS — Codex Prompt Pack 04
## Landing Page and Entry Flow — De-Syria the Story, Sell the Workbench

> **Audience:** Codex (OpenAI) and Claude Code.
> **Run after:** Pack 03 (`PRAXIS_CODEX_03_WORKBENCH_ARCHITECTURE.md`). This pack assumes `/app/workbench` exists and `src/lib/cases/registry.ts` is populated.
> **Read first:** the same set as Pack 03 plus `src/components/landing/*.tsx` and the public site at `https://praxis.tacitus.me`.
> **Hard rules carried over:** never hardcode `gemini-*` outside `providers.ts`; never weaken auth/CSP; never write copy that overstates capability.

---

## 0. Why this pack exists

The current landing page makes Syria the headline. The hero has two CTAs: "Start Your Workspace" and **"Open Syria Case File"**. The proof section is `SyriaCaseProof`. Half the visible features describe the Syria walkthrough specifically. A first-time visitor who is a US housing analyst, a Sahel mediator, or a workplace HR lead reads this page and concludes PRAXIS is a Syria-tracking tool.

That is **not the product**. PRAXIS is a **policy workbench**. Syria is one example case file. The current copy reverses the relationship between the product and its example.

This pack:

1. Rewrites the hero to lead with the workbench, not Syria.
2. Collapses the two-CTA hero into **one** primary CTA (`Start Your Workspace` → `/login`) plus one secondary "Try an example case" link.
3. Replaces `SyriaCaseProof` with `ExampleCasesGallery` — a rotating carousel of 4–6 example cases (Syria stays as one, alongside Nordalia, US housing, workplace mediation, Sahel, sanctions). Each card opens the workbench preloaded with that case via `/login?mode=demo&example=<caseId>`.
4. Cleans up the 14+ landing sections and the 5-tier `Offers` JSON-LD that mentions a Syria-specific demo.
5. Repositions the post-login experience: instead of dropping the user on `/app/dashboard`, drop them at `/app/workbench` (the case picker) and surface the example cases there too.
6. Aligns SEO/structured data with the new product story.

This is **copy + component restructuring**, not a redesign. Visual style stays. Brand stays. The promise on the page changes.

---

## 1. Outcomes

| # | Outcome |
|---|---|
| 1 | Hero leads with the workbench. One primary CTA → `/login`. One secondary link → "Try an example case" → opens a small modal listing 4–6 example cases. |
| 2 | `SyriaCaseProof` is removed from the landing page (file kept for now, not imported). Replaced by `ExampleCasesGallery`. |
| 3 | All landing copy that names "Syria" as the product story is rewritten to refer to "your live cases" or "an example case file (Syria, Sahel, US housing, workplace mediation, sanctions, Nordalia synthetic)". Syria is one item in a list. |
| 4 | Post-login lands at `/app/workbench` (case picker), not `/app/dashboard`. Demo guests land at `/app/workbench?example=<caseId>` if `mode=demo&example=...` is present, otherwise `/app/workbench/syria-2026?tab=chapters` for backward compatibility. |
| 5 | `softwareJsonLd` is rewritten to describe a workbench, not a Syria case. The `Offers` block keeps the four tiers but changes `Demo` description to "Guest-session example cases (Syria, Sahel, US housing, workplace mediation) for evaluating the real PRAXIS workspace". |
| 6 | The 14 landing sections drop to 9. Removed sections justify their own deletion (auditable list below). |
| 7 | Sitemap and robots updated. OpenGraph image regenerated (the current OG card mentions Syria; the new one is workbench-led). |

---

## 2. Pre-work — Codex agent must confirm before starting

Send this confirmation note to Giulio and wait for ack:

```
PRAXIS Landing & Entry rebuild — pre-work confirmation

I have read:
- src/app/(landing)/page.tsx and all 14 imported landing sections
- src/app/app/syria-case/page.tsx and src/components/syria/*
- src/app/api/auth/* (to understand the post-login redirect flow)
- src/app/(auth)/login/page.tsx (existing /login page)
- src/lib/cases/registry.ts (created in Pack 03)
- src/app/opengraph-image.tsx (current OG image)

My understanding of the new product story:
1. PRAXIS is a POLICY WORKBENCH for analysts, diplomats, mediators, and
   policy officers. Each user creates their own situations (cases) and
   works on them in a consistent 5-chapter flow with graph-anchored
   provenance, confidence, and time on every primitive.
2. Syria is an EXAMPLE case file — alongside Sahel, US housing, workplace
   mediation, sanctions, and a Nordalia synthetic. None of them is the
   product. The product is the workbench.
3. The hero has ONE primary CTA: "Start Your Workspace" → /login. One
   secondary, lower-weight link: "Try an example case" → opens a modal
   listing the 4-6 example cases; clicking one opens a guest session of
   that case.
4. Post-login, every user lands at /app/workbench (case picker), never
   /app/dashboard.

Open questions:
- Q1: Which 4-6 example cases ship in v1 of the gallery? Default proposal:
       Syria 2026, Sahel transitional governance, US housing crisis,
       Workplace mediation (Alex/Maya synthetic), Sanctions enforcement
       audit, Nordalia synthetic NDC simulation. ACK or amend.
- Q2: Should the Syria walkthrough at the legacy URL still resolve, or do
       we 410-redirect it to the new example-case modal? Default: redirect
       to /app/workbench/syria-2026?tab=chapters with a 308.
- Q3: Marketing tone — keep the existing diplomatic/serious voice, or
       loosen for a wider professional audience? Default: keep voice; only
       change scope.

Branch I will work on: feature/landing-rebuild
Estimated effort: 1.5-2 engineering days for one Codex agent.
```

Do not start work until Giulio acks Q1, Q2, Q3.

---

## 3. Pack overview

| # | Prompt ID | Outcome | Est. effort |
|---|---|---|---|
| **C1** | `landing/hero-collapse` | Rewrite hero to single primary CTA + example-cases secondary link. Remove "Open Syria Case File" button. Update subheadline | 3 h |
| **C2** | `landing/example-cases-gallery` | Build `ExampleCasesGallery` rendering 4–6 case cards from `listExampleCases()`. Replace `SyriaCaseProof` import in landing page | 4 h |
| **C3** | `landing/section-cull` | Remove 5 redundant or Syria-specific sections; keep the 9 that explain the workbench | 2 h |
| **C4** | `landing/copy-de-syria` | Rewrite every section's copy where "Syria" is named as the product story. Syria stays as a named example only inside `ExampleCasesGallery` and one feature bullet | 3 h |
| **C5** | `landing/seo-and-jsonld` | Rewrite `softwareJsonLd`, `organizationJsonLd`, `websiteJsonLd`. Update `description`, `applicationSubCategory`, `featureList`. Update `Offers.Demo` description | 2 h |
| **C6** | `landing/og-image-rebuild` | Replace OpenGraph image content (currently Syria-flavored) with a workbench-led card. Keep visual brand | 3 h |
| **C7** | `landing/post-login-redirect` | Update post-login flow: every user lands at `/app/workbench`. Demo guest sessions land at `/app/workbench/<exampleCaseId>` based on `?example=` query | 2 h |
| **C8** | `landing/example-modal-flow` | The "Try an example case" link opens a small modal (or a `/login?mode=demo` with example picker). Integrates with the demo session flow | 3 h |
| **C9** | `landing/audit-and-tests` | Add `scripts/audit-landing.ts` enforcing the contract. Add Playwright spec covering hero, gallery, and post-login redirect | 3 h |

Total: ~25 hours, ~1.5–2 engineering days.

---

## 4. The 9 landing sections (target state)

Current (14): `Hero`, `SyriaCaseProof`, `HowItWorks`, `AiCompanionSection`, `ProblemSection`, `ConflictGrammarHighlight`, `DomainCatalogue`, `DataSubstrate`, `GroundingBackbone`, `LivePlatformPreview`, `UseCaseCards`, `AdvisoryCouncil`, `SecuritySection`, `Testimonials`, `PricingTeaser`, `WaitlistForm`, `Footer`.

Target (9 + footer/waitlist):

| # | Section | Replaces | Purpose |
|---|---|---|---|
| 1 | `Hero` | (rewritten) | Workbench-first headline, one primary CTA, one secondary link |
| 2 | `HowItWorks` | (kept) | The 5-chapter flow shown abstractly; case-agnostic |
| 3 | `ExampleCasesGallery` | replaces `SyriaCaseProof` | 4–6 example cases, each a guest session entry |
| 4 | `ProblemSection` | (kept, copy edit) | What goes wrong without the workbench |
| 5 | `ConflictGrammarHighlight` | (kept) | The 8 ACO primitives — the substrate every case uses |
| 6 | `GroundingBackbone` | (kept) | Source-grounded, citation-tied, audit-trail story |
| 7 | `UseCaseCards` | (rewritten) | The 5–7 personas (diplomat, analyst, mediator, humanitarian, researcher, sanctions, HR) |
| 8 | `SecuritySection` | (kept) | Per-tenant isolation, Firebase Auth, GCP private workspace |
| 9 | `PricingTeaser` | (kept) | Four tiers, no hidden Syria-specific copy |
| | `WaitlistForm` | (kept) | Email capture |
| | `Footer` | (kept) | Standard footer |

Removed:

| Removed section | Why |
|---|---|
| `AiCompanionSection` | Redundant with `HowItWorks` and `GroundingBackbone`. |
| `DomainCatalogue` | Detail that belongs inside `/app/workbench` after login, not on the landing page. |
| `DataSubstrate` | Subsumed into `GroundingBackbone`. |
| `LivePlatformPreview` | Replaced by the `ExampleCasesGallery` (which is a real live preview). |
| `AdvisoryCouncil` | Detail that belongs inside the Boardroom tab, not the landing page. |
| `Testimonials` | The current testimonials are placeholder text. Re-add only when there are real ones with attribution. |

Codex must keep the **deleted** components in `src/components/landing/_archive/` rather than deleting outright, in case Giulio wants to bring any back. Move, do not delete.

---

## 5. Prompt C1 — `landing/hero-collapse`

### Outcome
The hero has **one** primary CTA and **one** secondary link. The "Open Syria Case File" button is gone. Subheadline explains the workbench, not Syria.

### Files to edit
- `src/components/landing/hero.tsx`

### Target hero copy

```
Headline:   The policy workbench for grounded statecraft.

Subhead:    Build live cases, anchor them in a graph that carries provenance,
            confidence, and time, run grounded research and DIALECTICA
            reasoning, and export decision-ready briefings — every step
            traceable, every claim cited.

Trust       [ Source-grounded research ] [ Mandate-aware analysis ]
chips:      [ ACO conflict grammar + versioned graph ]
            [ Six example cases on first login ] [ Citations and audit trail ]

Primary CTA:   Start Your Workspace        →  /login
Secondary:     Try an example case          (opens modal)

Footnote:   Sign in for your private workspace · or open a guest session of
            an example case file.
```

### Hard rules
- The word "Syria" must not appear in the hero (or anywhere above the fold).
- The primary CTA route is `/login`. Do not change.
- The secondary link is **not a button**. It is a styled text link with an `aria-haspopup="dialog"`. It opens the example-cases modal built in C8.
- Trust chips drop from 5 to 5 (count unchanged; chip 4 changed from "Shared Syria case after login" to "Six example cases on first login").
- Practitioner audience list (`practitionerBackgrounds`) stays intact; do not add or remove personas.

### Definition of Done
- The hero renders with one primary CTA and one secondary link. Visual snapshot test passes.
- Lighthouse LCP score does not regress.
- `rg -i "syria" src/components/landing/hero.tsx` returns 0 matches.

### Verification
```bash
npx tsc --noEmit
npx vitest run src/components/landing
npx playwright test tests/e2e/landing-hero.spec.ts
```

---

## 6. Prompt C2 — `landing/example-cases-gallery`

### Outcome
A new component `ExampleCasesGallery` that renders 4–6 case cards from `listExampleCases()`. Each card has a title, region, summary, risk score, glasl stage, and a CTA to "Open guest session". Clicking the CTA navigates to `/login?mode=demo&example=<caseId>` and the post-login redirect (C7) sends the user to `/app/workbench/<caseId>?tab=chapters`.

### Files to create
- `src/components/landing/example-cases-gallery.tsx`
- `src/lib/cases/landing-cards.ts` — projection of `CaseModule` to a small `LandingCaseCard` shape (title, region, oneLineSummary, risk, glasl, tags, primaryColor).

### Files to edit
- `src/app/(landing)/page.tsx` — replace `import { SyriaCaseProof }` with `import { ExampleCasesGallery }` and render in the same slot. Remove the `<SyriaCaseProof />` JSX line.

### Target card shape

```
┌──────────────────────────────────────────┐
│  EXAMPLE · Civil conflict                │
│  Syria Transition                         │
│  Northeast integration & regional spillover
│                                           │
│  Risk 78  Glasl 5  Sources 72             │
│                                           │
│  [ Open guest session →  ]                │
└──────────────────────────────────────────┘
```

### Default 6 example cases

| caseId | Title | Region | Type |
|---|---|---|---|
| `syria-2026` | Syria Transition | Syrian Arab Republic | Civil conflict |
| `nordalia-2026` | Nordalia NDC Simulation | Synthetic | International dispute |
| `sahel-2026` | Sahel Transitional Governance | West Africa | Political crisis |
| `us-housing-2026` | US Housing Affordability | United States | Policy/economic |
| `workplace-2026` | Workplace Mediation (Alex/Maya) | Organizational | Mediation case |
| `sanctions-2026` | Sanctions Enforcement Audit | Multi-region | Compliance |

If `listExampleCases()` returns fewer than 6 entries because Pack 03 only shipped 2, the gallery renders the available ones plus a "More cases coming" placeholder card. Do not synthesize fake data here; the gallery only renders cases that have a real `CaseModule`.

### Definition of Done
- The gallery renders ≥ 2 case cards on first launch (Syria + Nordalia from Pack 03). The other 4 are added incrementally as their `CaseModule`s are authored — gated by the registry, not by the gallery.
- Clicking a card produces a `/login?mode=demo&example=<caseId>&redirect=...` URL with the right encoded redirect.
- Mobile breakpoint: cards stack to a single column. Visual snapshot test passes.
- The component does not import any Syria-specific module directly. It imports `listExampleCases()` from `@/lib/cases/registry`.

### Verification
```bash
npx vitest run src/components/landing/example-cases-gallery
npx playwright test tests/e2e/landing-example-gallery.spec.ts
```

---

## 7. Prompt C3 — `landing/section-cull`

### Outcome
Move 5 sections to `_archive/`, drop their imports from `src/app/(landing)/page.tsx`. The page renders 9 sections + footer + waitlist.

### Files to edit
- `src/app/(landing)/page.tsx` — remove imports and JSX for the 5 removed sections.
- `src/components/landing/_archive/` — new directory; move the 5 component files here. Update no other imports (the components are no longer used).

### Specific moves
- `src/components/landing/ai-companion-section.tsx` → `_archive/`
- `src/components/landing/domain-catalogue.tsx` → `_archive/`
- `src/components/landing/data-substrate.tsx` → `_archive/`
- `src/components/landing/live-platform-preview.tsx` → `_archive/`
- `src/components/landing/advisory-council.tsx` → `_archive/`
- `src/components/landing/testimonials.tsx` → `_archive/`

(That is 6 files including `testimonials`. The 9-section target counts the live components + footer + waitlist.)

### Hard rules
- Do not delete the files. Move them. They may have value later.
- After this prompt, `rg "AiCompanionSection|DomainCatalogue|DataSubstrate|LivePlatformPreview|AdvisoryCouncil|Testimonials" src/app/(landing)/` returns 0 matches.
- Bundle size on the landing route should drop by ≥ 20%. Verify with `npm run build` and inspect `.next/standalone` chunk sizes.

### Definition of Done
- Landing page renders the 9 sections + footer + waitlist.
- `npm run build` is green; landing chunk shrinks.
- `npx playwright test tests/e2e/landing-sections.spec.ts` confirms 9 sections.

---

## 8. Prompt C4 — `landing/copy-de-syria`

### Outcome
Every section's copy that names "Syria" as the product story is rewritten. Syria appears only as one example among many.

### Audit (Codex must perform before editing)
```bash
rg -i "syria" src/components/landing/
```

### Allowed Syria mentions after this prompt
- Inside `ExampleCasesGallery` (one card among 4–6).
- One mention in `ConflictGrammarHighlight` as an example: "e.g., 'Syria SDF–Damascus integration agreement' becomes a Commitment node with 14 cited sources." — example illustrative, not exclusive.
- Possibly one mention in `UseCaseCards` for the diplomat persona example: "A UN PAO opens a Syria case file before a Tuesday consultation; PRAXIS surfaces overnight delta and three citation-defensible bullets." — clearly framed as one example among many.

### Disallowed (Codex must rewrite)
- Hero copy mentioning Syria.
- `softwareJsonLd.description` mentioning Syria specifically.
- `Offers.Demo.description` saying "Guest-session Syria public-source case".
- Trust signals listing "Shared Syria case after login".
- `ProblemSection` framing the problem as Syria-specific.
- `GroundingBackbone` listing Syria as the example feed source.

### Files to edit
- All `src/components/landing/*.tsx` flagged by the rg audit.
- `src/app/(landing)/page.tsx` (JSON-LD blocks moved to C5 but adjacent change here).

### Voice
Keep the existing diplomatic/serious voice. Do not loosen tone. Do not add buzzwords ("AI-powered", "cutting-edge", "revolutionary"). The product is dignified; the copy stays dignified.

### Definition of Done
- `rg -i "syria" src/components/landing/` returns ≤ 3 matches, all in the explicitly-allowed locations above.
- Lighthouse copy quality does not regress (manual review).

### Verification
```bash
rg -i "syria" src/components/landing/  # ≤ 3 matches
npx playwright test tests/e2e/landing-copy.spec.ts
```

---

## 9. Prompt C5 — `landing/seo-and-jsonld`

### Outcome
The three JSON-LD blocks in `src/app/(landing)/page.tsx` reflect the new product story. Search engines and link-unfurlers describe a workbench, not a Syria case.

### `softwareJsonLd` — target diff (excerpt)

```diff
-  applicationSubCategory: "Policy & Statecraft AI",
+  applicationSubCategory: "Policy Workbench & Conflict Intelligence",

   description:
-    "PRAXIS by TACITUS is a policy and conflict-intelligence workspace for diplomats, conflict analysts, mediators, and policy officers. It connects mandate calibration, source intake, conflict-graph extraction, risk assessment, drafting, and exportable briefings with citations and methodology notes.",
+    "PRAXIS is a policy workbench: every user builds their own live cases, anchors them in a graph that carries provenance, confidence, and time on every primitive, and progresses through a five-chapter flow — Situation Frame, Source Receipts, Conflict Graph, DIALECTICA Reasoning, Decision Product. Six example cases (Syria, Sahel, US housing, workplace mediation, sanctions, Nordalia synthetic) are available as guest sessions before login.",

   featureList: [
-    "Mandate-aware tools calibrated to your role and active situation",
-    "ACO v2.0 — 14-entity conflict ontology with 72 typed relationships",
-    "Glasl 9-stage escalation, Fisher-Ury, INFORM Risk Index, OCHA, IPC",
-    "Conflict graph extraction with cited evidence and version history",
-    "Syria public-source workspace with local media compass, narrative divergence board, GraphOps, and editable work products",
-    ...
+    "One workbench per user; each case scoped to users/{uid}/situations/{caseId}",
+    "Five-chapter flow: Situation Frame → Source Receipts → Conflict Graph → DIALECTICA Reasoning → Decision Product",
+    "ACO Conflict Grammar v2.0 — 14-entity conflict ontology with 72 typed relationships",
+    "Three truth layers (Episodic, Semantic, Stance) on every graph; bi-temporal validity on every primitive",
+    "Five DIALECTICA reasoning recipes (Leverage Trace, Commitment Check, Interest vs Position, Counter-Narrative, Path Search)",
+    "Source-grounded research via Google Cloud, GDELT, UCDP, ReliefWeb, OCHA, HDX, UNHCR, UN News, World Bank, and approved private corpora — provenance preserved",
+    "Six example cases as guest sessions (Syria, Sahel, US housing, workplace mediation, sanctions, Nordalia synthetic)",
+    "Mandate-aware tools calibrated to analyst role and active case",
+    "Drafting Studio with paragraph-level provenance and JSON-LD export manifest (ICD-203 aligned)",
+    "Boardroom: six-advisor deliberation room with synthesis to draft",
+    "Private GCP workspace per tenant; Firebase Auth; isolated Firestore + Cloud SQL + Neo4j",
+  ],
```

### `Offers` — `Demo` description rewrite

```diff
-      description: "Guest-session Syria public-source case for evaluating the real PRAXIS workspace, media intelligence, graph workflows, and briefing exports",
+      description: "Guest-session example cases (Syria, Sahel, US housing, workplace mediation, sanctions, Nordalia synthetic) for evaluating the real PRAXIS workspace, graph workflows, DIALECTICA reasoning, and briefing exports",
```

### `Offers` — `Analyst`/`Team`/`Institution` descriptions

Keep the four tiers and prices. Rewrite each `description` to reference "live cases" (plural) instead of "Syria case" or "single case".

### Definition of Done
- Three JSON-LD blocks parse as valid schema.org JSON-LD (use https://validator.schema.org).
- Google Rich Results Test passes for the URL after deploy (manual check).
- `rg -i "syria" src/app/(landing)/page.tsx` returns at most 1 match (in the Demo offer description, listed as one of six examples).

### Verification
```bash
npx tsc --noEmit
npm run build
# Spot-check the rendered HTML
curl -s https://praxis.tacitus.me | grep -o 'application/ld+json[^<]*' | head
```

---

## 10. Prompt C6 — `landing/og-image-rebuild`

### Outcome
The current OpenGraph image at `src/app/opengraph-image.tsx` is Syria-flavored. Replace its content with a workbench-led card. Keep the visual brand (navy background, gold accents, mono ACO sigil).

### Files to edit
- `src/app/opengraph-image.tsx`

### Target content

```
┌──────────────────────────────────────────────────────────┐
│ PRAXIS by TACITUS                                          │
│                                                            │
│ The policy workbench for grounded statecraft.             │
│                                                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Frame    │→ │ Receipts │→ │  Graph   │→ │DIALECTICA│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                            │
│   praxis.tacitus.me                          [TACITUS sigil]│
└──────────────────────────────────────────────────────────┘
```

### Definition of Done
- OG image renders at 1200×630, ≤ 200 KB.
- The 4 chapter chips are visible and ordered.
- The word "Syria" does not appear in the image.
- Twitter Card Validator and Facebook Sharing Debugger render the new image.

### Verification
```bash
curl -s https://praxis.tacitus.me/opengraph-image | file -
```

---

## 11. Prompt C7 — `landing/post-login-redirect`

### Outcome
The login flow redirects every user to `/app/workbench`, not `/app/dashboard`. Demo guest sessions handle the `?example=<caseId>` query param to land at `/app/workbench/<caseId>?tab=chapters` directly.

### Files to edit
- `src/app/(auth)/login/page.tsx` — update the `redirect` query handling.
- `src/lib/auth/post-login-redirect.ts` — new helper. Centralize the rule:

```ts
export function resolvePostLoginRedirect(params: URLSearchParams, isDemoMode: boolean): string {
  // Explicit redirect wins, but must be /app/* and same-origin
  const explicit = params.get('redirect');
  if (explicit && /^\/app\//.test(explicit)) return explicit;

  if (isDemoMode) {
    const example = params.get('example');
    if (example && /^[a-z0-9-]+$/.test(example)) {
      return `/app/workbench/${example}?tab=chapters`;
    }
    // Default demo lands on syria-2026 for backward compatibility
    return '/app/workbench/syria-2026?tab=chapters';
  }

  // Authenticated users land at the case picker
  return '/app/workbench';
}
```

- `src/middleware.ts` — keep its existing routing rules; only update any hardcoded `/app/dashboard` redirect to `/app/workbench`.

### Definition of Done
- A signed-in user with no situations lands at `/app/workbench` (case picker).
- A signed-in user with situations also lands at `/app/workbench` (case picker, where they pick the case to enter; do not auto-pick).
- A demo user clicking "Try an example case → Sahel" lands at `/app/workbench/sahel-2026?tab=chapters`.
- A demo user with no `?example=` lands at `/app/workbench/syria-2026?tab=chapters` for backward compatibility.

### Verification
```bash
npx playwright test tests/e2e/post-login-redirect.spec.ts
```

---

## 12. Prompt C8 — `landing/example-modal-flow`

### Outcome
The hero's "Try an example case" secondary link opens a small dialog that renders `ExampleCasesGallery` (or a compact variant). Clicking a case starts a demo session for that case.

### Files to create
- `src/components/landing/example-cases-modal.tsx` — wraps `ExampleCasesGallery` in a Radix Dialog.
- `src/components/landing/hero.tsx` — update the secondary link to open the modal.

### Behavior
- Modal traps focus, Esc closes, click outside closes.
- Modal title: "Six example cases — open a guest session".
- Mobile: full-screen sheet (Radix Dialog with appropriate breakpoint styles).
- Each card click navigates to `/login?mode=demo&example=<caseId>` and closes the modal.

### Definition of Done
- Modal opens via mouse, keyboard (Enter on the link), and screen reader (announced as a dialog).
- Modal is accessible (axe-core scan passes; WCAG 2.1 AA).
- Closing modal returns focus to the secondary link.
- No layout shift on landing page when modal mounts.

### Verification
```bash
npx playwright test tests/e2e/landing-example-modal.spec.ts
npx tsx scripts/a11y-check.ts                # if available; otherwise add one
```

---

## 13. Prompt C9 — `landing/audit-and-tests`

### Outcome
A single audit script `scripts/audit-landing.ts` enforces the contract. Wired into `npm run audit:gate`.

### Audit must enforce
1. The hero file does not contain the literal `"Syria"` string.
2. `src/app/(landing)/page.tsx` imports exactly 9 sections (plus `Footer` and `WaitlistForm`).
3. `src/components/landing/_archive/` contains the 6 retired components.
4. `softwareJsonLd.description` does not contain `"Syria"` as the only example (regex: must contain at least 3 of the 6 example case names).
5. `Offers.Demo.description` lists at least 3 example cases.
6. The OG image does not contain `Syria` text (parse the JSX or run a snapshot).
7. `resolvePostLoginRedirect` returns `/app/workbench` for the no-redirect, non-demo case.

### Playwright spec (`tests/e2e/landing-rebuild.spec.ts`)
1. Navigate to `/` (production landing).
2. Hero has one primary CTA labelled "Start Your Workspace".
3. Hero has one secondary link "Try an example case" with `aria-haspopup="dialog"`.
4. Click the secondary link; modal opens; lists ≥ 2 example cases.
5. Click the Syria card; URL changes to `/login?mode=demo&example=syria-2026`.
6. Visual snapshot of full landing page; compare to baseline.
7. `softwareJsonLd` JSON parses and contains the workbench description.

### Wire into the audit gate
Update `package.json`:
```json
{
  "scripts": {
    "audit:landing": "tsx scripts/audit-landing.ts",
    "audit:gate": "npx tsc --noEmit && npm run lint && npm run build && npm run audit:routes && npm run audit:gcp && npm run audit:workbench && npm run audit:landing && npx vitest run"
  }
}
```

### Definition of Done
- `npm run audit:landing` exits 0 on `main` after this pack.
- The Playwright spec passes against `npm run dev` and a deployed staging.
- `npm run audit:gate` passes.

### Verification
```bash
npm run audit:gate
npx playwright test tests/e2e/landing-rebuild.spec.ts
```

---

## 14. Hard rules — applied to every prompt in this pack

- **No new copy that overstates capability.** Do not add "AI-powered", "revolutionary", "cutting-edge", "next-generation", or similar marketing buzzwords. The voice is dignified.
- **No new analytics scripts**, no new third-party trackers, no new fonts. Performance budget is preserved.
- **No `'unsafe-inline'`, no inline scripts** outside the existing nonce-protected JSON-LD blocks.
- **No copy that names a real public figure** as endorser, advisor, or user without explicit written permission.
- **No images of real people** without clear attribution and licence. The `practitionerBackgrounds` array is professions, not names; keep it that way.
- **No deletion of existing components** — move to `_archive/`. Reversibility beats correctness in copy refactors.
- **No silent layout regressions.** Each prompt that touches the hero or page composition includes a Playwright visual diff against a baseline. If the diff exceeds 5% pixel difference, stop and ask Giulio.

---

## 15. Verification gate (run at the end of the pack)

```bash
git status
npx tsc --noEmit
npm run lint
npm run build
npm run audit:routes
npm run audit:gcp
npm run audit:workbench
npm run audit:landing
npx vitest run
npx playwright test
```

Lighthouse against the deployed landing page must remain ≥ 90 on Performance, Accessibility, Best Practices, SEO. If any score drops more than 3 points from baseline, stop and investigate.

Then:

```bash
git checkout -b feature/landing-rebuild
git add -A
git commit -m "feat(landing): de-Syria the story, sell the workbench

The hero leads with the policy workbench. One primary CTA → /login.
One secondary link opens an example-cases modal. SyriaCaseProof is
removed; replaced by ExampleCasesGallery rendering 4–6 example cases
(Syria stays as one).

The 14 landing sections drop to 9 (+ footer + waitlist). Five
redundant or Syria-flavored sections move to _archive/. Copy across
all sections rewritten so Syria appears only as one example among
six. JSON-LD updated to describe a workbench, not a Syria case. OG
image rebuilt.

Post-login redirect now lands at /app/workbench (case picker) for
authenticated users; demo guests land at /app/workbench/<example>?tab=chapters
based on ?example= query.

Closes pack 04 (C1-C9). Verified by audit:gate + Playwright."
git push origin feature/landing-rebuild
```

Open a PR and tag Giulio for review. **Do not merge to `main` without his sign-off** — landing copy is sales surface.

---

## 16. Out of scope

- Pricing tiers and amounts. Pricing is a business decision; this pack does not touch the four-tier offer.
- Production marketing campaign launch (Twitter/LinkedIn/Concordia Discors essay) — separate workstream.
- Post-login onboarding rebuild. The case picker is a thin shell here; deeper onboarding (welcome flow, first-case helper) is in **Pack 05**.
- A/B testing infrastructure. Once. The current change is one-way.

---

## 17. Closing note for the agent

The current landing page reads like a Syria-tracking tool because it leads with a Syria case proof. Giulio's actual product is **a policy workbench that any analyst, diplomat, mediator, humanitarian lead, or HR mediator can use to anchor their work in a graph with provenance, confidence, and time on every primitive**. Syria is one example.

Every pixel and every word on the landing page should answer one question: **"Does this make me believe a workbench is the right tool for *my* work?"** If it answers a different question — like "Is this a Syria tracker?" — it is wrong.

Stay tight. Cull. Choose. The page is about a workbench.
