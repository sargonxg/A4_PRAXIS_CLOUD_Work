# PRAXIS — User Onboarding + Tool Calibration Contract

**Date:** 2026-04-18
**Status:** Draft (awaiting user review)
**Owner:** @Sargonx
**Implements:** Sub-project #1 (user onboarding) and #2-#3 (tool audit + tier-1/2 fixes) from the platform-wide audit workstream.

---

## 1. Problem

PRAXIS has 40 tools spread across 50+ AI routes, each one building AI context ad-hoc from whatever its author remembered to wire. There is **no user-profile onboarding** — `UserProfile` is auto-created with `role: 'analyst'` and nothing else. The consequence: every tool produces generic output, ignoring who the user is, what their mandate is, what language they work in, and what terminology or framing they must or must not use.

The situation-creation wizard is solid, but it sits in front of a blank user with no perspective. Tools downstream have no way to calibrate tone, source ranking, or terminology to the analyst's actual work context.

This design introduces a **persistent calibration contract** — an `AnalystProfile` captured during a light onboarding flow — that every AI route ingests through a single middleware. Every tool output becomes role-aware, audience-aware, and red-line-respecting. Profile is versioned for provenance.

The same work also forces a **tool audit** against 11 calibration dimensions so we can systematically upgrade all 40 tools to a consistent standard.

---

## 2. Goals and non-goals

### Goals
1. First-login user completes a 3-screen profile in ≤3 minutes, then optionally flows into the existing situation-creation wizard (pre-filled).
2. Every AI route injects a stable `<analyst-profile>` + `<situation-frame>` + `<output-constraints>` context block built by one shared module.
3. All 40 tools produce outputs calibrated by profile language, audience, red-lines, lens order, region focus.
4. Tool outputs are persisted, versioned, and stamped with the profile version that produced them.
5. GCP services used idiomatically: Vertex Memory Bank (per-user memories), Firestore Vector Search (profile-embedding-weighted retrieval), Cloud Tasks (reliable background onboarding research), BigQuery (tool-output warehouse + funnel analytics), Pub/Sub (profile lifecycle events).
6. Onboarding incomplete → persistent banner on every `/app` page until complete.
7. Dead code removed: legacy routes, ad-hoc prompt strings, duplicated graph-context builders.

### Non-goals
- Paid-tier pricing changes.
- Team/org-level shared profiles (single-user profile only in v1).
- Profile import from LinkedIn/external sources.
- Multi-profile per-user (one profile per user in v1; future: per-situation override).
- Real-time profile sync across devices (eventual consistency is fine).

---

## 3. Architectural spine

```
AnalystProfile (Firestore: users/{uid}/profile/analyst)
    ├── identity        { role, seniority, org, team }
    ├── perspective     { mandate, lenses[], regions[], audience }
    ├── workingStyle    { sourceCategories[], language, redLines, analyticalStyle }
    ├── meta            { completedAt, lastEditedAt, version, skipCount }
    └── embedding       { vector: number[768], generatedAt }

              │
              ▼
  src/lib/context/profile-context.ts   ← single module. Every AI route imports.
              │
              ▼
  buildCalibratedContext(uid, situationId, toolId)
     returns ContextBlock {
         systemPromptBlock:  string   // <analyst-profile> + <situation-frame> + <retrieved-knowledge>
         outputConstraints:  { language, audienceTone, redLineClauses[], styleHint }
         toolContext:        { situation, aco, retrievedChunks }
         provenance:         { profileVersion, situationVersion, timestamp }
     }
              │
              ▼
  src/lib/api/with-calibration.ts  ← new middleware, wraps every AI route
              │
              ▼
  All 40 tool routes: handler(req, { ...ctx, calibration })
```

### Invariants

1. Profile is **always readable as a single markdown card** rendered by `AnalystProfileCard` component. Shown on hover in tool page headers. Editable inline from Settings.
2. Every AI route signature changes to `withAuth → withCredits → withCalibration → handler`.
3. Profile is **versioned** — every structural edit creates an immutable snapshot in `users/{uid}/profile/versions/{versionId}`. Tool outputs reference the version id that produced them.
4. `mandate + lenses` → Vertex embedding → cached on profile doc. SKC retrieval re-ranks chunks by cosine similarity to this vector. Profile updates enqueue an embedding refresh via Pub/Sub.
5. **Vertex AI Agent Engine Memory Bank** is extended from Deep Research Agent (already wired in P5D) to all tool invocations: each tool writes a short "what this analyst cared about" memory scoped by `uid`.
6. `withCalibration` **never hard-fails** a route. If profile missing, situation missing, or embedding unavailable, it builds a neutral fallback context and emits a warn log. Tools remain usable for unauthenticated or pre-onboarding exploration (demo mode already covers this).

---

## 4. Data model

### 4.1 Firestore schema additions

```
users/{uid}/
  profile/
    analyst                                  (the live profile)
      identity: {
        role: 'un_official' | 'diplomat' | 'think_tank' | 'ngo' | 'researcher'
            | 'journalist' | 'private_sector' | 'other'
        seniority: 'junior' | 'mid' | 'senior' | 'executive'
        org: string                           (free-text, autocomplete)
        team: string                          (free-text)
      }
      perspective: {
        mandate: string                       (1-3 sentences, 50-600 chars)
        lenses: Lens[]                        (ordered, 1-5 items, first = primary)
        regions: string[]                     (0-8 items, from REGION_SUGGESTIONS)
        audience: 'myself' | 'team' | 'senior_leadership' | 'external_partners' | 'public'
      }
      workingStyle: {
        sourceCategories: string[]            (ids from SOURCE_CATEGORIES)
        language: 'en' | 'fr' | 'es' | 'ar' | 'ru' | 'zh'
        redLines: string[]                    (0-12 items)
        analyticalStyle: 'rapid_brief' | 'deep_dive'
      }
      meta: {
        version: number                       (monotonic; incremented on structural edit)
        completedAt: Timestamp | null
        lastEditedAt: Timestamp
        skipCount: number                     (how many times user said "finish later")
        createdAt: Timestamp
      }
      embedding: {
        vector: number[768]                   (Gemini 3 embedding of mandate + lenses)
        generatedAt: Timestamp
        model: string
      }

    versions/{versionId}                      (immutable snapshots, versionId = `v{meta.version}`)
      (copy of profile at that version)

  (profile root-doc fields extended on users/{uid}:)
    onboardingCompletedAt: Timestamp | null    // fast-check for middleware (avoids nested read)
    onboardingSkipCount:   number              // increments each time user says "Finish later"; banner references this

config/
  onboarding_suggestions                      (admin-editable chip library)
    mandateChips: { roleKey: string[] }
    lensChips: string[]
    redLineChips: string[]
    orgAutocomplete: string[]
    (... per-field chip libraries)
```

Lens enum: `diplomatic | security | humanitarian | economic | legal_ihl | human_rights | development | mediation | climate_security`.

### 4.2 Firestore security rules

```
match /users/{uid}/profile/{doc=**} {
  allow read, write: if request.auth.uid == uid;
}
match /config/onboarding_suggestions {
  allow read: if request.auth != null;
  allow write: if false;    // admin-only via Admin SDK
}
```

### 4.3 BigQuery schema

```
praxis_analytics.tool_outputs (new table)
  event_id          STRING
  uid               STRING
  situation_id      STRING
  tool_id           STRING
  profile_version   INT64
  input_digest      STRING        -- SHA-256 of input args
  output_digest     STRING        -- SHA-256 of output
  token_in          INT64
  token_out         INT64
  credits_spent     INT64
  duration_ms       INT64
  language          STRING
  lens_primary      STRING
  audience          STRING
  created_at        TIMESTAMP
  -- partition by created_at DATE, cluster by (uid, tool_id)

praxis_analytics.onboarding_events (new table)
  event_id          STRING
  uid               STRING
  step              STRING        -- identity | perspective | working_style | complete | skip
  field_completed   STRING
  ms_on_step        INT64
  chip_origin       STRING        -- 'click' | 'custom' | 'ai_suggested'
  created_at        TIMESTAMP
```

### 4.4 Pub/Sub topics

- `profile.events` — `created | updated | completed | skipped | embedding_refreshed`
- `tool.completed` — `{ uid, toolId, situationId, profileVersion, outputDigest }` — consumers: BQ streaming insert, Memory Bank writer, SKC indexer.

---

## 5. Onboarding flow

### 5.1 Entry points

1. **First login** — `auth-context.tsx` reads `users/{uid}.onboardingCompletedAt`. If null and not demo, redirect to `/onboarding`.
2. **Skipped previously** — middleware renders a persistent banner on every `/app/*` page: "Complete your analyst profile to calibrate PRAXIS to your work. [Continue]" — dismissable per session but re-shown each new session until complete.
3. **Manual** — Settings page has an "Edit analyst profile" button (same component as onboarding screens, just inline).

### 5.2 Screens

**Screen 1 — Identity (≤30s)**
- Role: 8 radio cards (icon + label). Selecting a role updates chip suggestions on Screens 2 and 3 in the background.
- Seniority: 4-button segmented control.
- Org + team: single combined autocomplete input backed by `config/onboarding_suggestions.orgAutocomplete` with free-text fallback.

**Screen 2 — Perspective (≤90s, the payload screen)**
- Mandate: stacked-chip builder. 8 role-aware starter chips. Clicking stacks chip text into an editable `<textarea>`. User can edit the composed text freely or paste their own. Helper text under field: "This will be injected into every tool's AI prompt as your point of view."
- Lenses: 9 chips, click to toggle, drag to reorder. First lens is primary (bolder visual). Helper text: "Determines which sources rank higher in your research."
- Regions: 15-chip grid from existing `REGION_SUGGESTIONS` + custom text input. Helper text: "Your daily brief, ARGUS, and alert center will filter to these regions by default."
- Audience: 5 radio cards. Helper: "Calibrates tone for drafts and briefings."

**Screen 3 — Working Style (≤45s)**
- Source categories: 8 category cards from existing `SOURCE_CATEGORIES` (Foundational always on).
- Language: 6-flag row (UN six languages).
- Red lines: chip stack, 8 starter chips, click-to-add, custom chip input. Helper: "Hard constraints applied to every drafting tool."
- Analytical style: 2 cards (rapid-brief / deep-dive).

Each screen has a right-side **"Your AI assistant will see:"** live preview panel showing the rendered `<analyst-profile>` block as the user fills it. Selling the value visibly.

### 5.3 Persistence

- Each "Next" writes the delta to `users/{uid}/profile/analyst` (merge).
- Final "Complete" calls `POST /api/onboarding/complete` which:
  1. Validates all required fields.
  2. Bumps `meta.version`, writes snapshot to `versions/v{n}`.
  3. Enqueues Vertex embedding job via Cloud Tasks.
  4. Publishes `profile.completed` to Pub/Sub.
  5. Sets `users/{uid}.onboardingCompletedAt`.
  6. Returns redirect target: `/app/situations/new?fromOnboarding=1` (pre-filled with profile regions + source categories) OR `/demo` if user chose "browse demo".

### 5.4 Suggestion chip source

`config/onboarding_suggestions` is an admin-editable document. A separate `POST /api/onboarding/chips/suggest` route (new) accepts `{ role, fieldKey, currentText }` and returns 3-5 additional AI-generated chips via Gemini 3 Flash grounded search. Used when user clicks "Suggest more" on a chip field. Chips are cached per `(role, fieldKey)` for 1 hour to reduce cost.

### 5.5 Drag-to-reorder for lenses

Uses `@dnd-kit/sortable` (already a dep, check `package.json`). If not present, inline the minimum needed. Keyboard-accessible (Up/Down arrows). Touch support out of the box.

---

## 6. Tool calibration contract

### 6.1 `buildCalibratedContext`

```ts
// src/lib/context/profile-context.ts

export interface ContextBlock {
  systemPromptBlock: string
  outputConstraints: {
    language: SupportedLanguage
    audienceTone: AudienceTone
    redLineClauses: string[]
    styleHint: 'rapid_brief' | 'deep_dive'
  }
  toolContext: {
    situation: Situation | null
    aco: ACOGraph | null
    retrievedChunks: RetrievedChunk[]
  }
  provenance: {
    profileVersion: number
    situationVersion: number | null
    generatedAt: string
  }
}

export async function buildCalibratedContext(opts: {
  uid: string
  situationId?: string
  toolId: string
  retrievalQuery?: string
  retrievalTopK?: number
}): Promise<ContextBlock>
```

The function:
1. Reads profile (falls back to neutral defaults if missing — returns `profileVersion: 0`).
2. Reads situation (if `situationId` provided) + ACO graph.
3. If `retrievalQuery` provided, calls SKC vector layer re-ranked by profile embedding.
4. Composes `systemPromptBlock` string from templates in `src/lib/prompts/context-block.ts`.
5. Returns block.

### 6.2 `withCalibration` middleware

```ts
// src/lib/api/with-calibration.ts

type CalibratedHandler<T> = (
  req: NextRequest,
  ctx: AuthCtx & CreditsCtx & { calibration: ContextBlock }
) => Promise<NextResponse<T>>

export const withCalibration =
  (toolId: string, opts?: { retrievalQuery?: (req) => string }) =>
  <T>(handler: CalibratedHandler<T>) =>
  withAuth(withCredits(toolId, async (req, ctx) => {
    const body = await req.clone().json().catch(() => ({}))
    const calibration = await buildCalibratedContext({
      uid: ctx.uid,
      situationId: body.situationId,
      toolId,
      retrievalQuery: opts?.retrievalQuery?.(req),
    })
    return handler(req, { ...ctx, calibration })
  }))
```

### 6.3 System-prompt-block template

```xml
<analyst-profile version="{profileVersion}">
  Role: {seniority} {role} at {org} · {team}
  Mandate: {mandate}
  Primary lens: {lenses[0]}. Secondary: {lenses[1..]}.
  Regions of focus: {regions.join(', ')}
  Audience: {audience}
  Output language: {language}
  Red lines:
  {redLines.map(r => `- ${r}`).join('\n')}
  Preferred style: {analyticalStyle}
</analyst-profile>

<situation-frame>
  Name: {situation.name}
  Type: {situation.type}
  Region: {situation.region}
  Key actors: {situation.actors.join(', ')}
  Risk: {riskScore}/10 · Glasl {glaslStage} · {escalationTrend}
  Last updated: {humanRelative(updatedAt)}
</situation-frame>

<retrieved-knowledge>
  {chunks.map(c => `[${c.id}] ${c.text}  — ${c.source}`).join('\n\n')}
</retrieved-knowledge>

<output-constraints>
  - Respond in {language}.
  - Tone: {audienceTone} register.
  {redLines.map(r => `- Constraint: ${r}`).join('\n')}
  - {styleHint === 'deep_dive' ? 'Favor depth, caveats, and citations.' : 'Favor brevity and actionable bullets.'}
</output-constraints>
```

### 6.4 Per-tool integration pattern

```ts
// src/app/api/ai/risk-monitor/route.ts (after refactor)

export const POST = withCalibration('risk-monitor', {
  retrievalQuery: (req) => 'risk factors escalation indicators',
})<{ output: RiskAssessment }>(async (req, { uid, calibration }) => {
  const { situationId } = await req.json()

  const prompt = buildRiskMonitorPrompt({
    contextBlock: calibration.systemPromptBlock,
    situationId,
  })

  const { object } = await generateText({
    model: getProModel(),
    prompt,
    experimental_output: Output.object({ schema: RiskAssessmentSchema }),
  })

  await saveToolOutput({
    uid, situationId, toolId: 'risk-monitor',
    output: object,
    profileVersion: calibration.provenance.profileVersion,
  })

  await publishToolCompleted({ uid, toolId: 'risk-monitor', situationId })

  return NextResponse.json({ output: object })
})
```

---

## 7. Tool audit

### 7.1 Audit script

`scripts/audit-tools.ts` — reads every `src/app/api/ai/*/route.ts`, greps for 11 patterns, writes report to `docs/audits/tools-{YYYY-MM-DD}.md`. Committed. Re-runnable.

11 dimensions, each 0/1:
1. Reads AnalystProfile (via `withCalibration` or direct)
2. Reads current situation
3. Uses `buildCalibratedContext`
4. Applies output language from profile
5. Applies red-lines constraints
6. Applies audience tone
7. Uses SKC retrieval (lens-weighted)
8. Persists output to Firestore subcollection
9. Writes Memory Bank trace
10. Validates output schema (Zod)
11. Deducts credits correctly

Target: all tools 11/11 (pure feed-pass-through tools get a documented exception for #9).

### 7.2 Tier ordering

| Tier | Count | Tools | Target |
|---|---|---|---|
| T1 — Core daily | 10 | Dashboard, Assistant, Conflict Graph, Actor Profiles, Risk Monitor, Early Warning, Report Studio, Daily Brief, Deep Research, Scenarios | 11/11 |
| T2 — Analysis depth | 12 | Stakeholder Map, Power Map, Game Theory, Negotiation Prep, Info Environment, Compare, Media Compass, Dossier, Talking Points, Briefing Room, Mediation Designer, CONCORDIA | 11/11 |
| T3 — Feeds & monitors | 10 | ARGUS, Media Roundup, Source Monitor, Alert Center, Geospatial, Humanitarian, Sanctions, Commitments, Treaty, Timeline | 11/11 (minus #9) |
| T4 — Specialized/workspace | 8 | Electoral Risk, Economic Impact, Peacebuilding Index, Human Rights, External Actors, Cases, Team, Advisory, UN Toolkit, Settings | per-tool |

### 7.3 Proactive tool improvements (per tool, during fix)

- **Dashboard**: profile-driven "Questions your profile suggests you should ask today" card (3 Gemini-generated questions/day from mandate × situation state).
- **Assistant**: auto-seed every thread with profile context; inline SKC citation popovers.
- **Conflict Graph**: profile-lens filter toggle (dim nodes outside user's primary lens).
- **Daily Brief**: auto-scheduled 6am delivery in profile.language with audience tone, no per-user config.
- **Report Studio**: template suggestions matching user's audience + past outputs.
- **Scenarios**: seed prompts respect red-lines.
- **Deep Research Agent**: cross-reference Memory Bank to avoid re-researching known ground.
- **Dossier**: one-click for any graph actor; tone auto-matches audience.
- **Alert Center**: subscribe to alerts filtered by profile.regions × profile.lenses by default.

---

## 8. GCP service additions

| Purpose | Service | Status |
|---|---|---|
| Long-term analyst preferences | Vertex AI Agent Engine Memory Bank | Extend to all 40 tools |
| Profile-aware retrieval | Firestore Vector Search (native KNN) | New index on profile.embedding |
| Long-running onboarding research | Cloud Tasks → Cloud Run | New queue: `onboarding-research` |
| Tool output warehouse | BigQuery `praxis_analytics.tool_outputs` | New table |
| Profile lifecycle events | Pub/Sub `profile.events` | New topic |
| Tool completion events | Pub/Sub `tool.completed` | New topic |
| Suggestion chip library | Firestore `config/onboarding_suggestions` | New doc |
| Chip generation (dynamic) | Gemini 3 Flash grounded search | New endpoint `/api/onboarding/chips/suggest` |
| Onboarding funnel analytics | BigQuery + Looker Studio | Extend P6D dashboard |
| Embedding job orchestration | Cloud Tasks (profile embedding queue) | New queue |

Everything else (Firestore, Cloud Run, Cloud Build, Firebase Auth) reused.

### 8.1 Dead code / consolidations

- Verify and delete `/api/ai/research-extract` if orphaned (looks like duplicate of `/api/ai/extract` — confirm with codebase grep before removal).
- Verify and delete `/api/ai/claude-analyze` if orphaned (suspected pre-AI-SDK-v6 shim — confirm no callers before removal).
- Consolidate every prompt string into `src/lib/prompts/registry.ts` — one file per tool, exported + typed + unit-testable.
- Delete ad-hoc `buildGraphContext` variants — all routes use `calibration.toolContext.aco`.
- Verify and extend `ToolPageShell` (from P7A) across all 40 tool pages.

---

## 9. Error handling

- Profile save → local retain + retry banner, never blocks flow.
- Embedding job failure → lazy regeneration on next tool call.
- Pub/Sub publish failure → Cloud Tasks fallback with idempotency key `uid:versionId`.
- First-situation pipeline fail → situation still usable manually.
- Vertex Memory Bank unavailable → trace swallowed with warn log, tool still returns.
- Suggestion chip endpoint down → hardcoded fallback from `config/onboarding_suggestions`.
- `withCalibration` can't build → neutral fallback block, warn log, tool proceeds.

---

## 10. Testing

- Unit: `profile-context.test.ts` — profile fixtures → expected context blocks.
- Unit: `buildCalibratedContext.test.ts` — permutations of (profile × situation × tool).
- Unit: `withCalibration.test.ts` — mock handler, assert injection.
- Integration: Playwright — full 3-screen onboarding + first situation + dashboard render.
- Contract: audit script runs in CI; all 40 AI routes revalidated post-fix; PR blocks if any regresses below target tier score.
- Snapshot: profile version serialize/deserialize byte-stable.

---

## 11. Build sequence (phases)

| Phase | Scope | Blocks next? |
|---|---|---|
| P1 | Schema: `AnalystProfile` types, Firestore rules, versions subcollection, `config/onboarding_suggestions` doc | Yes |
| P2 | `buildCalibratedContext` + `withCalibration` + `profile-context.ts` + embedding job + Pub/Sub topics + `saveToolOutput` helper | Yes |
| P3 | `/onboarding` UI — 3 screens with chips, drag-reorder lenses, persistence-on-next, live preview panel, first-login detection, banner for incomplete | Parallel with P4 |
| P4 | Audit script + first-run audit report committed | Parallel with P3 |
| P5 | T1 tool fixes (10 tools) against 11-dim checklist + tool-specific proactive improvements | Yes (validates contract) |
| P6 | T2 tool fixes (12 tools) | No |
| P7 | T3 tool fixes (10 tools, feed-heavy) | No |
| P8 | T4 tool fixes + workspace pages (8 tools) | No |
| P9 | GCP additions: Cloud Tasks queue, BQ tool_outputs table, Looker funnel | No |
| P10 | Dead-code sweep + `src/lib/prompts/registry.ts` consolidation + final E2E | No |

Each phase = its own commit, its own PR, its own Rolling Release canary.

---

## 12. Success criteria

- All 40 tools score 11/11 on audit (or documented T3 exception).
- First-login → working situation + first tool output in ≤5 minutes median.
- Profile completion rate ≥80% within first 3 sessions.
- Every tool output carries a profile version stamp.
- Memory Bank has per-user entries for every analyst within 1 week of profile completion.
- Zero hardcoded prompts outside `src/lib/prompts/registry.ts`.
- Zero AI routes without `withCalibration` wrapping (CI guard).

---

## 13. Implementation-plan split

This spec is large enough to warrant **two implementation plans**, sequenced:

- **Plan A — Onboarding foundation (P1-P4)**: schema, middleware, UI, audit script. Ships a usable onboarding flow with all downstream scaffolding in place. ~1-2 weeks.
- **Plan B — Tool fixes (P5-P10)**: tiered tool upgrades + GCP additions + dead-code sweep + consolidation. Driven by the Plan A audit report output. ~3-4 weeks.

Plan A is written immediately after this spec is approved. Plan B is written after P4 audit report exists, so Plan B can reference concrete gaps per tool.

## 14. Open questions for implementation

1. Do we keep `aiProvider` / `aiSettings` as a separate concern from `AnalystProfile`, or fold them in? Proposal: keep separate — profile is about *who the user is*, AI settings are *how they run models*.
2. Embedding model: Gemini embedding 2 preview (current) vs text-embedding-005 fallback. Proposal: primary = gemini-embedding-2-preview, fallback chain already exists in `getEmbeddingModel()`.
3. For demo users, do we short-circuit onboarding? Proposal: yes — demo gets a pre-built `AnalystProfile` for the Nordalia scenario.
4. Team/org sharing of profiles — v2, out of scope.
