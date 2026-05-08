# PRAXIS Context Injection Contract

> **The single most important architecture in PRAXIS.** It is what turns a
> generic Gemini call into a calibrated diplomatic-intelligence response. If
> you change one thing in this codebase without breaking anything else, this
> is the place.

Policy professionals work with enormous *implicit* context: who they brief,
what their mandate is, which actors they are tracking, which frameworks they
respect, what red lines they enforce. Most AI tools force them to re-state
that context on every prompt. PRAXIS makes it **explicit** — captured once
in onboarding, attached to every tool call, kept hot via real-time sync.

This document is the contract. It explains the four layers, where each is
captured, where each is read, how each propagates, and how to extend it.

---

## TL;DR

Every calibrated-ai-tier hero tool's AI route, plus every backend chapter
recipe that accepts a `situationId`, is wrapped by `withCalibration`. The
wrapper assembles a `CalibrationContext` from four data sources and renders
an XML-shaped `systemPromptBlock` that is prepended to the AI system prompt.

```
AnalystProfile  ──▶┐
Situation       ──▶│           ┌──────────────────┐
Domain config   ──▶├──▶ build ─▶│ systemPromptBlock │── injected into ──▶ AI
SKC retrieval   ──▶┘           └──────────────────┘
```

The contract is: **every hero tool tagged `tier: 'calibrated-ai'` in
`src/lib/constants/tool-registry.ts` has its `aiRoute` wrapped by
`withCalibration`, which prepends the systemPromptBlock before the AI
system prompt.** This is enforced statically by
`audit:hero-tool-calibration-coverage` as part of `audit:gate`.

Two visible hero tools are intentionally classified
`tier: 'deterministic-structural'` because they do not call a model:
`context-builder` (domain classifier) and `graphops` (graph maintenance
dispatcher). Their UI surfaces a "Structural · no AI" pill so analysts do
not expect Pro-tier reasoning from them.

---

## The four context layers

### Layer 1 — `<analyst-profile>`  *(who is asking)*

Captured in the 3-screen onboarding wizard at `/onboarding`. Stored at
Firestore path `users/{uid}/profile/analyst`.

| Field | Why the AI cares |
|---|---|
| `identity.role` | Whether to lean diplomatic, journalistic, humanitarian, academic in tone and frame |
| `identity.seniority` | Length and formality of output |
| `identity.org` | Implicit mandate (UN DPPA vs. private think tank vs. NGO) |
| `perspective.mandate` | What the user is *for* — injected verbatim |
| `perspective.lenses` | Ranked list of analytical frameworks the AI should privilege (Glasl, Fisher-Ury, etc.) |
| `perspective.regions` | Geographic priors |
| `perspective.audience` | Who the output is *for*. Drives diplomatic register |
| `perspective.primaryDomain` + `secondaryDomains` | Selects domain config (Layer 3) |
| `workingStyle.language` | Output language directive (en / fr / es / ar / ru / zh) |
| `workingStyle.redLines` | **Hard constraints** — phrases / framings the AI must avoid |
| `workingStyle.analyticalStyle` | Rapid-brief vs. deep-dossier shape |

Where it is rendered: `src/lib/context/system-prompt-block.ts` →
`renderAnalystProfileBlock()` (lines ~63–90).

---

### Layer 2 — `<situation-frame>`  *(what is being analysed)*

The active Situation is the user's *current case file*. It carries:

| Field | Usage in prompts |
|---|---|
| `name` | Subject of analysis |
| `type` | (international / civil / mixed) — affects framework selection |
| `region` | Geo bias for feeds and naming |
| `domain` | Top-level domain (one of 11) — selects the domain frame |
| `actors[]` | Pre-known actor list to ground entity resolution |
| `riskScore`, `glaslStage`, `escalationTrend` | Calibrates urgency and recommendation tone |
| `geoBoundingBox` | Map centroid, geo filters |

Where stored: `users/{uid}/situations/{sitId}` (the situation's metadata
document).

Where it is rendered: `src/lib/context/system-prompt-block.ts` →
`renderSituationBlock()` (line 95+).

---

### Layer 3 — `<domain-frame>`  *(what kind of work this is)*

The 11-domain taxonomy in PRAXIS is more than a tag. Each domain document at
`config/domains/{id}` carries:

- `lensWeights` — multipliers on AnalystProfile lenses, applied per-domain
- `frameworks[]` — ordered list of frameworks PRAXIS reaches for in this
  domain (e.g., `armed-conflict-security` privileges Glasl + Stedman; the
  `humanitarian` domain privileges OCHA + IPC)
- `preferredFeeds[]` — which data feeds to weight in retrieval
- `promptOverrides` — per-tool prompt prefix that fires only inside this
  domain. Example: in `economic-sanctions`, the briefing tool gets an
  override that requires inclusion of designated entities and effective
  dates.

Resolution: `mergeUserAndSituationDomains()` in
`src/lib/context/profile-context.ts` (line 182). Situation domain wins; user
domain is the fallback for situations created before the taxonomy was added.

Where it is rendered: `system-prompt-block.ts` → `<domain-frame>` block
(lines ~105–119, only emitted when domain ≠ `generic`).

---

### Layer 4 — Retrieval context from SKC  *(what is already known)*

The Situation Knowledge Core (SKC) is a 4-layer hybrid GraphRAG system:

1. **Graph layer** — Neo4j (when configured) or Firestore subcollection.
   Stores ACO-typed actors, claims, interests, constraints, leverages,
   commitments, events, narratives, plus the 6 extended types.
2. **Vector layer** — Firestore native KNN (768-dim, COSINE).
   Stores document chunks, prior tool outputs, and conversation memories.
3. **Feed layer** — TTL-cached external feeds (ACLED, GDELT, HDX,
   ReliefWeb, UNHCR, World Bank, …).
4. **Tool-output layer** — every prior tool invocation's structured
   output is queryable so a Briefing tool can read what a Risk Monitor
   produced 30 minutes ago.

Retrieval is invoked by `buildCalibratedContext({ uid, situationId, toolId,
retrievalQuery })`. The retrievalQuery is *lens-weighted*: a profile that
ranks `humanitarian` first will pull humanitarian-flavoured chunks
preferentially.

Where it is rendered: as a block of relevant excerpts injected into the
system prompt below `<output-constraints>`.

---

### Layer 5 (cross-cutting) — `<output-constraints>`

The contract that every answer must obey:

- Output language (from `workingStyle.language`)
- Red-line phrases (from `workingStyle.redLines` — quoted verbatim with
  "must not produce" framing)
- Audience tone (from `perspective.audience` — myself / team / senior
  leadership / external partners / public)
- Schema constraints (from the tool's Zod schema, via AI SDK
  `Output.object()`)
- Citation discipline (always cite source feeds where claims originate)

Where rendered: `system-prompt-block.ts` lines ~170–183.

---

## How a single AI call assembles the prompt

```
POST /api/ai/auto-briefing
  ──▶ withAuth()                                  (verify Firebase token)
      ──▶ checkAndDeductCredits()                 (atomic Firestore)
          ──▶ buildCalibratedContext({            (the heart of it)
                  uid: req.user.uid,
                  situationId: body.situationId,
                  toolId: 'auto-briefing',
                  retrievalQuery: body.topic,
              })
              ──▶ load AnalystProfile             (Firestore, hot via cache)
              ──▶ load Situation                  (Firestore)
              ──▶ resolveDomain(profile, situation) (5 min cache)
              ──▶ SKC.retrieve(...)               (vector + graph + feeds)
              ──▶ renderSystemPromptBlock(...)    (returns XML string)
          ──▶ handler(req, calibratedContext)     (the tool's own logic)
              ──▶ generateText({                  (Vercel AI SDK call)
                      system: calibratedContext.systemPromptBlock
                            + TOOL_SPECIFIC_PROMPT,
                      schema: BriefingSchema,
                      messages: [...],
                  })
              ──▶ saveToolOutput(...)             (Firestore subcollection)
              ──▶ pubsub.publish('profile.events',{...})  (analytics)
              ──▶ return structuredOutput
```

The wrapper `withCalibration(toolId, creditOpType)(handler)` factory in
`src/lib/api/with-calibration.ts` is what makes this work uniformly across
calibrated AI surfaces. **Adding a new calibrated-ai-tier hero tool? Wrap
its AI route with `withCalibration` and you're done with the contract** —
every layer above plugs in for free. Deterministic structural tools must be
declared as `tier: 'deterministic-structural'` in the tool registry and
labelled honestly in the UI.

---

## Worked example — the Briefing tool

User asks for a daily briefing on a Yemen ceasefire situation. They are a
UN PAO who completed onboarding three weeks ago.

What the model receives (paraphrased):

```
<analyst-profile>
  Role: UN / IO Official (senior)
  Org: UN DPPA, Yemen Desk
  Mandate: I produce twice-weekly secretariat-grade analytical notes for
   the Special Envoy on de-escalation pathways, prioritising IHL-anchored
   framing and party-neutrality.
  Lenses (ranked): mediation, diplomatic, security, humanitarian
  Regions of focus: Yemen, Red Sea, Horn of Africa
  Primary domain: diplomacy-negotiation
  Audience: senior leadership
</analyst-profile>

<situation-frame>
  Name: Yemen — Hodeidah Ceasefire Monitoring (Q2 2026)
  Type: civil
  Region: Yemen
  Domain: diplomacy-negotiation
  Actors: Houthis (Ansar Allah); Yemeni Govt; UAE-backed STC; Saudi-led
   Coalition; UN Mission to Support the Hodeidah Agreement (UNMHA)
  Risk score: 64 (high)
  Glasl stage: 5 (loss of face)
  Escalation trend: deteriorating
</situation-frame>

<domain-frame domain="diplomacy-negotiation">
  Frameworks (privileged): Fisher-Ury principled negotiation; Zartman
   ripeness; Berghof mediation; Putnam two-level games.
  Preferred feeds: UN News RSS, ReliefWeb, ICG CrisisWatch, ACLED.
  Prompt overrides for tool=briefing:
    • Lead with the negotiation track state, not the violence count.
    • Surface ripeness indicators where present.
    • Always reference the Hodeidah Agreement clauses by article.
</domain-frame>

<retrieved-context>
  [vector hits on the situation's documents — 3 chunks, sorted by
   cosine similarity to "Hodeidah ceasefire status April 2026"]
  [graph excerpts — UNMHA → monitors → ceasefire-zone-1; Houthis →
   commits-to → withdrawal-clause; …]
  [recent tool outputs — Risk Monitor v17, Early Warning v9]
  [ACLED — 23 events in Hodeidah governorate, last 7 days]
</retrieved-context>

<output-constraints>
  Language: en
  Audience tone: senior leadership (concise, bottom-line-up-front, no
   bullet fluff)
  Red lines (must not produce): party-political language; speculative
   attribution without citation; phrases that imply UN endorsement of any
   party.
  Schema: BriefingSchema (headline, executive_summary, escalation_signals,
   negotiation_state, recommended_actions, sources[]).
</output-constraints>

— TOOL-SPECIFIC SYSTEM PROMPT FROM auto-briefing/route.ts FOLLOWS —
```

The result is *automatically* in English, uses Fisher-Ury framing, leads
with negotiation state (because the domain says so), avoids partisan
language (because the red lines say so), and cites ACLED + UNMHA + Hodeidah
Agreement articles. None of which the user typed in their request.

---

## How the contract stays warm

Context isn't static. It updates through three mechanisms:

1. **Profile edits** — Settings page bumps `meta.version`, writes a
   `profile_versions/{vN}` snapshot, publishes a `profile.events`
   Pub/Sub message. The `buildCalibratedContext` call always reads the
   *latest* version.
2. **Situation updates** — Every situation field has a Firestore
   `onSnapshot` listener in the workspace stores. New documents,
   extracted entities, and changing risk scores propagate within seconds.
3. **SKC retrieval is per-call** — Every AI route call retrieves fresh
   vector + graph + feed slices for the specific question being asked.
   No staleness window beyond the feed-layer TTLs (1h for ACLED, 15min
   for GDELT, etc.).

The `withCalibration` wrapper is also responsible for the **hard gate**:
if `profile.meta.completedAt` is missing for a non-demo user, it returns
HTTP 403, and the client renders `<OnboardingRequiredState />`. Tools
cannot be called without a complete profile. This is what guarantees the
contract is non-empty.

---

## How to add a new tool that respects the contract

The boilerplate is intentionally tiny:

```ts
// src/app/api/ai/<your-tool>/route.ts
import { withCalibration } from '@/lib/api/with-calibration';
import { generateText } from 'ai';
import { getProModel } from '@/lib/ai/providers';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import { YourToolSchema } from '@/lib/ai/schemas/your-tool';

export const POST = withCalibration('your-tool', 'ai_analysis')(
  async (req, ctx) => {
    const { systemPromptBlock } = ctx.calibration;

    const result = await generateText({
      model: getProModel(),
      system: systemPromptBlock + '\n\n' + YOUR_TOOL_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: ctx.body.prompt }],
      experimental_output: Output.object({ schema: YourToolSchema }),
    });

    await saveToolOutput({
      uid: ctx.uid,
      situationId: ctx.situationId,
      toolId: 'your-tool',
      profileVersion: ctx.calibration.profileVersion,
      output: result.experimental_output,
    });

    return NextResponse.json(result.experimental_output);
  },
);
```

That's it. Calibration is plumbed for free. Don't write a system prompt
that doesn't begin with `systemPromptBlock`.

---

## Where to extend the contract

Common extension points, in order of how often you'll touch them:

1. **Add a new lens** — `src/types/analyst-profile.ts:LENSES` array; the
   onboarding wizard picks them up automatically.
2. **Add a new domain** — `src/lib/domain/seeds.ts` and run
   `npx tsx scripts/seed-domains.ts`.
3. **Add a domain prompt override for one tool** — edit the domain
   document at `config/domains/{id}.promptOverrides[toolId]` from the
   `/app/admin/domains` page (gated by `ADMIN_ALLOWLIST`). No deploy.
4. **Add a new layer of context** — extend `CalibrationContext` in
   `with-calibration.ts`, add the renderer in `system-prompt-block.ts`,
   and decide whether the new layer is *always* injected (every route)
   or *opt-in* per route.
5. **Add a tool-side persistence schema** — Zod schema in
   `src/lib/ai/schemas/`; Firestore writes via `saveToolOutput`.

---

## Anti-patterns to avoid

- **Reading AnalystProfile directly inside a route handler.** Always
  read it through `withCalibration` so the cache + version snapshot
  semantics are honoured.
- **Building a system prompt by hand for "speed."** Even a 2-line
  prompt should start with `systemPromptBlock`. The contract loses
  power the moment any tool opts out.
- **Persisting tool output anywhere except
  `users/{uid}/situations/{sitId}/tools/{toolId}`.** Cross-tool reads
  via SKC's tool-output layer assume that path.
- **Caching `buildCalibratedContext` across requests.** It's already
  lightly cached internally (5-minute domain cache). Caching the full
  block elsewhere will leak stale red lines across users.

---

## Health-check the contract

The audit script at `scripts/audit-hero-tool-calibration-coverage.ts`
enumerates every `surface === 'hero' && visible === true` registry entry.
For entries tiered `calibrated-ai`, it resolves `aiRoute` and verifies the
route export is wrapped in `withCalibration`; deterministic structural tools
must be explicitly tiered to be exempt. Run it any time you add or refactor a
hero route:

```bash
npm run audit:hero-tool-calibration-coverage
```

Expected output: zero warnings, zero failures. If a calibrated-ai hero route
appears without calibration, a deterministic-structural hero route starts
using `withCalibration`, or a visible hero tool omits `tier`, that's a bug —
the contract has a hole.

---

## What is NOT calibrated

For honesty: not every authenticated request in PRAXIS is calibrated.
Specifically:

- Marketplace recipes (`/api/tools/marketplace/run`) are not standalone AI
  outputs; non-SAT recipes now stage prompts into calibrated hero-tool
  invocations.
- The Cognee memory proxy (`/api/memory/[...slug]`) does not invoke
  `withCalibration`; it forwards to the isolated memory service when
  `COGNEE_BACKEND_URL` is set.
- DIALECTICA chapter recipes are backend recipe scaffolds unless they are
  explicitly routed through a calibrated Next.js API boundary.
- Two visible hero tools (`context-builder`, `graphops`) are
  `tier: 'deterministic-structural'`.

When this document says "calibration," it means "calibrated-ai tier hero
tool routes plus explicitly calibrated backend chapter recipes." That is the
gate.

---

## Evolution roadmap

Layered improvements in order of priority:

1. **Persistence retrofits (Stream B)** — promote 8 PARTIAL tools so
   their outputs reliably participate in the tool-output retrieval
   layer, closing feedback loops between tools.
2. **Audience-tuned generation (Stream A Day 2)** — currently every
   tool's tone is loosely keyed off `audience`. Make the audience
   directive *explicit* in every renderer, with a controlled
   vocabulary of tone presets.
3. **Memory layer** — currently the SKC's vector layer holds tool
   outputs and document chunks. A *conversation memory* layer (chat
   history per situation) is the natural next addition; it slots into
   the same vector index with a `messageType=chat` filter.
4. **Cross-situation transfer** — the contract today is
   situation-scoped. A second-order layer (`<related-situations>`)
   could pull from the user's *other* situations when patterns repeat
   (e.g., the same actor, the same actor archetype, the same
   ceasefire clause).
5. **Feedback channel** — when the user thumbs-up / thumbs-down a tool
   output, write that to a `feedback` subcollection and use it to
   reweight retrieval. Closes the calibration loop.

These are the right improvements to build *next*. Each one extends the
contract without breaking the existing 53 routes.
