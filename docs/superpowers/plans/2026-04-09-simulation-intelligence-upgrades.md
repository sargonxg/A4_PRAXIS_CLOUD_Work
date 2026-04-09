# PRAXIS Groups 5 & 6 — Simulation + Intelligence Tool Upgrades

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade all Simulation (§6) and Intelligence (§7) API routes with web-grounded analysis, enhanced Zod schemas, §11 universal prompt standards, and UI additions per the PRAXIS Master Improvement Blueprint v1.0.

**Architecture:** Each tool API route gets targeted web research queries via `searchWeb`/`scrapeUrl` from `@/lib/ai/firecrawl`, extended Zod schema fields, and enhanced prompts following §11.1. The other Claude session handles Group 0 infrastructure upgrades. All functions referenced here already exist in the codebase. Use `generateText + Output.object({ schema })` for structured tools and `streamText` for streaming tools (per CLAUDE.md conventions).

**Tech Stack:** Next.js 16 App Router · AI SDK v6 (`generateText + Output.object`, `streamText`) · Zod · Gemini 2.5 Pro (`getProModel()`) · `searchWeb`, `scrapeUrl`, `formatResultsAsContext` from `@/lib/ai/firecrawl` · Tailwind CSS 4 · D3.js 7

**Prerequisite:** Group 0 (infrastructure) changes from the other session are assumed complete. The `searchWeb` and `scrapeUrl` functions are already in place and work without changes.

---

## Files to Create or Modify

| File | Action | What Changes |
|------|--------|--------------|
| `src/app/api/ai/scenario/route.ts` | Modify | Add parallel web research for current conditions; enhance prompt for structured per-scenario Glasl projection and probability calibration |
| `src/app/api/ai/negotiation/route.ts` | Modify | Add web-grounded BATNA research; extend schema with `zartmanRipeness`, `dealBreakers`, `dealEnablers`, `confidenceInterval` |
| `src/app/api/ai/game-theory/route.ts` | Modify | Add web research for payoff grounding; extend schema with `payoffJustifications` and `webGrounding` |
| `src/app/api/ai/mediation-design/route.ts` | Modify | Add web research; extend CBM schema with `glaslStageTarget`; extend spoiler schema with Stedman typology; add `webGrounding` field |
| `src/app/api/ai/commitment-scan/route.ts` | Modify | Add `searchWeb` calls for live commitment discovery; extend schema with `stedmanViolationType` and `webSources` |
| `src/app/api/ai/sanctions-scan/route.ts` | Modify | Replace single query with parallel multi-registry searches (OFAC, EU, UNSC, UK); add actor-by-actor screening; add `ownershipRiskFlags` and `complianceRiskLevel` to schema |
| `src/app/api/ai/treaty-analyze/route.ts` | Modify | Add comparative precedents search; extend schema with `ihlComplianceFlags`, `ambiguityRiskRating`, `vcltInterpretation`; inject comparative research context |
| `src/app/api/ai/argus/route.ts` | Modify | Add `urls` action for URL-based deep intelligence; add CRAAP evaluation to extract action; add cross-source triangulation to compare action |
| `src/app/api/ai/media-analyze/route.ts` | Modify | Expand from single-outlet analysis to full Media Compass: add 50-outlet static database; add `liveComparison` action; add 2D scatter data output |
| `src/app/api/ai/media-roundup/route.ts` | Modify | Add Entman 4-function framing analysis; add agenda-setting gap detection section to prompt |
| `src/app/api/ai/deep-search-agent/route.ts` | Modify | Add 120s per-turn timeout; enhance enrichedQuery for ACH output format |
| `src/app/app/scenarios/page.tsx` | Modify | Add parameter slider UI for 5 scenario dimensions |
| `src/app/app/negotiation-prep/page.tsx` | Modify | Add D3.js ZOPA range-bar visualization |

---

## Task 1: Upgrade scenario/route.ts — Web Research + Glasl Projection

**Files:**
- Modify: `src/app/api/ai/scenario/route.ts`

The route currently runs a single country-extraction heuristic for web data. Replace with parallel targeted searches matching §11.2 query standards. The route stays as `streamText` for good UX.

- [ ] **Step 1: Add parallel web searches at the top of the handler**

Replace the existing `dataContext` block (lines 62–76) with this:

```typescript
// --- Parallel web research (§11.2 query standards) ---
let webIntelligence = '';
try {
  const situationName = (situation as Situation | undefined)?.name || conflictContext.split(' ').slice(0, 3).join(' ');
  const region = (situation as Situation | undefined)?.region || '';
  const year = new Date().getFullYear();

  const queries = [
    `${situationName} current conditions ${year}`,
    `${situationName} latest developments conflict ${year}`,
    `${situationName} ${region} escalation ceasefire status`,
    `${scenarioTrigger} ${situationName} impact analysis`,
  ];

  const results = await Promise.allSettled(
    queries.map((q) => searchWeb(q, { numResults: 4 }))
  );

  const allResults = results
    .filter((r): r is PromiseFulfilledResult<WebSearchResult[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value);

  if (allResults.length > 0) {
    webIntelligence = `\n\n### Current Web Intelligence (${new Date().toISOString().split('T')[0]})\n${formatResultsAsContext(allResults.slice(0, 12))}\n`;
  }
} catch {
  /* non-blocking — proceed without web data */
}
```

Add `import type { WebSearchResult } from '@/lib/ai/firecrawl';` and `import { searchWeb, formatResultsAsContext } from '@/lib/ai/firecrawl';` at the top (replace the existing `getSituationIntelligence` import).

- [ ] **Step 2: Remove the old `getSituationIntelligence` import and `dataContext` block**

Remove line 10 (`import { getSituationIntelligence } ...`) and delete the old `dataContext` block entirely.

- [ ] **Step 3: Update the prompt to inject web intelligence and mandate probability calibration**

Replace the `const prompt = ...` assignment with:

```typescript
const prompt = `${graphCtx ? `${graphCtx}\n\n` : ''}${sitContext ? `${sitContext}\n\n` : ''}[ROLE]
You are a senior conflict analyst at a major international crisis organization for PRAXIS, a conflict intelligence platform. You serve analysts, mediators, advisors, and researchers.

[GROUNDING MANDATE]
CRITICAL: The web intelligence below is your PRIMARY source of truth. Your training data may be outdated.
If web results contradict your training data, trust the web results.
If web results are insufficient, state "INTELLIGENCE GAP: {topic}" explicitly.
${webIntelligence}

[SITUATION CONTEXT — already injected above]

[METHODOLOGY]
Apply Friedrich Glasl's 9-stage escalation model. For EACH scenario (Best/Status Quo/Worst), project:
- Current Glasl stage → Glasl stage at 30 / 60 / 90 / 180 days
- Use ICD 203 probability language: almost certain (>95%) / highly likely (>70%) / likely (>55%) / roughly even (45-55%) / unlikely (<45%) / highly unlikely (<30%)
- Probability estimate for the scenario itself, with evidence-based justification citing specific web sources

[SCENARIO PARAMETERS]
CONFLICT CONTEXT: ${conflictContext}
SCENARIO TRIGGER: ${scenarioTrigger}
${actorList}
TIME HORIZON: ${timeHorizon}
${paramContext}

Structure your response using EXACTLY these section headers:

## Scenario Probability Assessment
State the probability for this scenario (Best/Status Quo/Worst) with explicit justification citing 2-3 specific current conditions from the web intelligence above. Use ICD 203 language.

## Glasl Stage Projection
Current stage → 30-day stage → 60-day stage → 90-day stage → 180-day stage.
For each stage transition, explain what specific indicator would trigger it.

## Initial Trigger
Analyze the immediate causal chain set in motion. What happens in the first 72 hours? Which actors respond and how?

## Short-term Dynamics (1–4 weeks)
Cover: armed group behavior, ceasefire status, political elite responses, humanitarian system impacts, international reaction.

## Medium-term (1–6 months)
Cover: political stabilization or fragmentation, humanitarian crisis evolution, economic pressure effects, peace process viability, regional spillover risk. Include probability estimates for key branch points.

## Long-term (6–12 months)
What has consolidated? What remains uncertain? What structural changes have occurred?

## Key Pivot Points
List 3–5 critical decision points. For each: what is the window, who must act, consequence of inaction, probability this window opens.

## Policy Responses for This Scenario
Provide exactly 3 policy responses specific to this scenario:
- **Action**: [Specific action]
- **Implementing Actor**: [Who must act]
- **Timeline**: 30 days — [what] / 60 days — [what] / 90 days — [what]
- **Prerequisites**: [What must be true for this to work]
- **Risks**: [What could go wrong]

Be analytically rigorous. Reference specific actors by name. Cite web sources for factual claims.`;
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd "C:/Users/giuli/ANTIGRAVITY/A4_PRAXIS_CLOUD_TACITUS/A4_PRAXIS_CLOUD_Work"
npx tsc --noEmit 2>&1 | head -30
```

Expected: 0 errors on scenario/route.ts

- [ ] **Step 5: Commit**

```bash
git add src/app/api/ai/scenario/route.ts
git commit -m "feat(scenario): web-grounded research + Glasl projection + ICD-203 probability calibration"
```

---

## Task 2: Upgrade negotiation/route.ts — BATNA Web Research + Zartman Ripeness Schema

**Files:**
- Modify: `src/app/api/ai/negotiation/route.ts`

The route already has ZOPA, BATNA, and deal probability. Add: (1) web research for BATNA alternatives, (2) formal Zartman ripeness assessment fields, (3) confidence interval, (4) top 3 deal-breakers/enablers.

- [ ] **Step 1: Extend the NegotiationSchema with new fields**

After the existing `recommendations` field in `NegotiationSchema`, add:

```typescript
zartmanRipeness: z.object({
  mutuallyHurtingStalemate: z.object({
    present: z.boolean(),
    evidence: z.string().describe('Evidence for/against MHS'),
  }),
  wayOut: z.object({
    present: z.boolean(),
    evidence: z.string().describe('Whether parties see a possible agreement'),
  }),
  validSpokesperson: z.object({
    present: z.boolean(),
    notes: z.string().describe('Whether negotiators can commit their principals'),
  }),
  ripenessScore: z.number().min(0).max(100).describe('Overall ripeness score 0-100'),
  assessment: z.string().describe('Narrative ripeness assessment'),
}).describe('Zartman ripeness analysis'),
dealBreakers: z.array(z.object({
  issue: z.string(),
  reason: z.string().describe('Why this is a deal-breaker'),
  mitigationPath: z.string().describe('How it could be overcome'),
})).max(3).describe('Top 3 obstacles to a deal'),
dealEnablers: z.array(z.object({
  issue: z.string(),
  reason: z.string().describe('Why this advances the deal'),
  howToActivate: z.string().describe('What action would activate this enabler'),
})).max(3).describe('Top 3 factors that could close a deal'),
dealProbabilityInterval: z.object({
  low: z.number().min(0).max(100),
  high: z.number().min(0).max(100),
  rationale: z.string(),
}).describe('95% confidence interval on deal probability'),
webGrounding: z.array(z.string()).describe('URLs or source names used to ground BATNA assessments'),
```

- [ ] **Step 2: Add web research before the AI call**

Inside the POST handler, after the `graphCtx` block and before the `generateText` call, add:

```typescript
// --- Web-grounded BATNA research ---
let batnaContext = '';
try {
  const sitName = (situation as Situation | undefined)?.name || parties.join(' ');
  const year = new Date().getFullYear();
  const batnaQueries = parties.slice(0, 2).map(
    (party) => `${party} alternatives negotiation failure ${sitName} ${year}`
  );
  batnaQueries.push(`${sitName} peace negotiation prospects ${year}`);

  const results = await Promise.allSettled(
    batnaQueries.map((q) => searchWeb(q, { numResults: 3 }))
  );
  const allResults = results
    .filter((r): r is PromiseFulfilledResult<WebSearchResult[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value);

  if (allResults.length > 0) {
    batnaContext = `\n\n### Web Intelligence for BATNA Assessment (${new Date().toISOString().split('T')[0]})\n${formatResultsAsContext(allResults.slice(0, 8))}\n`;
  }
} catch { /* non-blocking */ }
```

Add imports at the top: `import { searchWeb, formatResultsAsContext } from '@/lib/ai/firecrawl'; import type { WebSearchResult } from '@/lib/ai/firecrawl';`

- [ ] **Step 3: Inject `batnaContext` into the prompt**

In the `generateText` call, prepend `batnaContext` to the prompt:

```typescript
prompt: `${graphCtx ? `${graphCtx}\n\n` : ''}${sitContext ? `${sitContext}\n\n` : ''}${batnaContext}Conduct a rigorous negotiation space analysis...`
```

Also extend the prompt's **BATNA** section to explicitly request web-grounded alternatives:

```
**2. BATNA STRENGTH ASSESSMENT (web-grounded)**
Use the web intelligence above to identify REALISTIC current alternatives for each party.
For each alternative, note the web source that confirms it is a real option.
Record source names in the webGrounding array.
```

And add Zartman ripeness + deal-breakers/enablers instructions at the end of the prompt:

```
**4. ZARTMAN RIPENESS ASSESSMENT**
Assess: (1) Mutually Hurting Stalemate — are all parties experiencing pain they cannot escape unilaterally? (2) Way Out — do parties perceive a negotiated solution as possible? (3) Valid Spokesperson — can negotiators make binding commitments?
Score 0-100 overall. Explain what would shift the score.

**5. DEAL-BREAKERS AND DEAL-ENABLERS**
Identify the top 3 deal-breakers (specific obstacles to agreement) and top 3 deal-enablers (specific conditions or actions that would advance a deal). For each, explain the mitigation path or activation step.

**6. DEAL PROBABILITY CONFIDENCE INTERVAL**
Provide a 95% confidence interval around your deal probability (low%, high%). State the key uncertainty driving the spread.
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: 0 errors on negotiation/route.ts

- [ ] **Step 5: Commit**

```bash
git add src/app/api/ai/negotiation/route.ts
git commit -m "feat(negotiation): web-grounded BATNA + Zartman ripeness schema + confidence intervals"
```

---

## Task 3: Upgrade game-theory/route.ts — Web-Grounded Payoffs

**Files:**
- Modify: `src/app/api/ai/game-theory/route.ts`

The route already has payoff matrix, Nash equilibria, game archetype, and sequential tree. Add web research to ground payoff values in current strategic incentives.

- [ ] **Step 1: Extend the GameTheoryOutputSchema with `payoffJustifications` and `webGrounding`**

After the `analysis` field in `GameTheoryOutputSchema`, add:

```typescript
payoffJustifications: z.array(z.object({
  actor: z.string(),
  strategy: z.string(),
  payoffRationale: z.string().describe('Why this actor gets this payoff value — grounded in current conditions'),
  webSource: z.string().optional().describe('Source URL or name confirming this incentive'),
})).describe('Evidence-based justification for each key payoff value'),
webGrounding: z.array(z.string()).describe('URLs or source names used to estimate payoffs'),
```

- [ ] **Step 2: Add parallel web research at the start of the handler**

After the `validation` block and before the `sitContext` assignment, add:

```typescript
// --- Web-grounded payoff research ---
let payoffContext = '';
try {
  const year = new Date().getFullYear();
  const payoffQueries = actors.map(
    (actor) => `${actor} strategic interests incentives ${validation.data.conflictContext || ''} ${year}`
  );

  const results = await Promise.allSettled(
    payoffQueries.map((q) => searchWeb(q, { numResults: 3 }))
  );
  const allResults = results
    .filter((r): r is PromiseFulfilledResult<WebSearchResult[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value);

  if (allResults.length > 0) {
    payoffContext = `\n\n### Web Intelligence for Payoff Estimation (${new Date().toISOString().split('T')[0]})\n${formatResultsAsContext(allResults.slice(0, 8))}\n`;
  }
} catch { /* non-blocking */ }
```

Add imports: `import { searchWeb, formatResultsAsContext } from '@/lib/ai/firecrawl'; import type { WebSearchResult } from '@/lib/ai/firecrawl';`

- [ ] **Step 3: Inject `payoffContext` into the prompt and add grounding instruction**

Prepend to the existing prompt:

```typescript
const prompt = `${sitContext ? `${sitContext}\n\n` : ''}${conflictDesc ? `${conflictDesc}\n\n` : ''}${payoffContext}You are a formal game theorist...`
```

Add to the **Payoff Matrix** instruction:

```
For each payoff value, provide a brief justification in payoffJustifications citing the current strategic interests and conditions that determine it. Reference the web intelligence above where possible. Record all web sources used in webGrounding.
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/ai/game-theory/route.ts
git commit -m "feat(game-theory): web-grounded payoff estimation with evidence-based justifications"
```

---

## Task 4: Upgrade mediation-design/route.ts — Glasl CBM Library + Stedman Typology + Web Research

**Files:**
- Modify: `src/app/api/ai/mediation-design/route.ts`

Add: (1) web research for current conditions, (2) Glasl stage → CBM mapping in schema, (3) Stedman typology classification for each spoiler, (4) detailed process risk categories.

- [ ] **Step 1: Extend the CBMSchema with `glaslStageTarget`**

In the `CBMSchema` object, add after `verificationMechanism`:

```typescript
glaslStageTarget: z.enum(['stages_1_3', 'stages_4_6', 'stages_7_9']).describe('Glasl escalation stage range this CBM is appropriate for'),
```

- [ ] **Step 2: Extend MediationDesignSchema with Stedman spoiler typology**

Replace the existing `spoilerMitigation: z.array(z.string())` with:

```typescript
spoilerMitigation: z.array(z.object({
  actor: z.string().describe('Name of the spoiler actor'),
  stedmanType: z.enum(['total', 'limited', 'greedy']).describe('Stedman spoiler typology: total=will never accept deal, limited=specific red lines, greedy=expand demands as opportunities arise'),
  managementStrategy: z.enum(['containment', 'isolation', 'inducement', 'inclusion', 'socialization', 'conditionality']).describe('Recommended management approach per Stedman typology'),
  specificActions: z.array(z.string()).describe('Concrete steps to implement the management strategy'),
})).describe('Spoiler management strategies using Stedman typology'),
```

Also add after `processRisks`:

```typescript
webGrounding: z.array(z.string()).describe('URLs or source names used to inform process design'),
```

- [ ] **Step 3: Add web research for current peace process conditions**

After the `graphCtx` block and before the `generateText` call, add:

```typescript
// --- Web research for current mediation conditions ---
let mediationContext = '';
try {
  const sitName = (situation as Situation | undefined)?.name || 'the situation';
  const year = new Date().getFullYear();
  const queries = [
    `${sitName} peace talks mediation ${year}`,
    `${sitName} negotiation efforts ceasefire agreement ${year}`,
    `${sitName} spoilers obstacles peace process`,
  ];
  const results = await Promise.allSettled(queries.map((q) => searchWeb(q, { numResults: 3 })));
  const allResults = results
    .filter((r): r is PromiseFulfilledResult<WebSearchResult[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value);
  if (allResults.length > 0) {
    mediationContext = `\n\n### Current Mediation Intelligence (${new Date().toISOString().split('T')[0]})\n${formatResultsAsContext(allResults.slice(0, 8))}\n`;
  }
} catch { /* non-blocking */ }
```

Add imports: `import { searchWeb, formatResultsAsContext } from '@/lib/ai/firecrawl'; import type { WebSearchResult } from '@/lib/ai/firecrawl';`

- [ ] **Step 4: Inject web context into the prompt and add Glasl CBM + Stedman instructions**

In the `generateText` call, update the prompt to:

```typescript
prompt: `${graphCtx ? `${graphCtx}\n\n` : ''}${sitContext ? `${sitContext}\n\n` : ''}${mediationContext}Design a comprehensive mediation process architecture for this conflict situation.

## DESIGN METHODOLOGY
...existing methodology text...

**Step 3: Confidence-Building Measures (Glasl-calibrated)**
For each CBM, assign glaslStageTarget based on current Glasl stage and projected trajectory:
- stages_1_3 (pre-violence): dialogue forums, joint working groups, cultural exchanges
- stages_4_6 (face-loss/coalition-forming): ceasefire monitoring, prisoner exchanges, humanitarian corridors  
- stages_7_9 (violence/war): observer missions, humanitarian corridors, prisoner exchanges via ICRC

**Step 4: Spoiler Management (Stedman Typology)**
For each identified spoiler from the situation actors:
- Classify using Stedman: total (existential stakes — containment/isolation needed), limited (specific red lines — inducement/inclusion), greedy (opportunistic — socialization/conditionality)
- Match management strategy to typology
- List 2-4 specific concrete actions

Record all web sources used in webGrounding.`
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/ai/mediation-design/route.ts
git commit -m "feat(mediation-design): Glasl CBM library + Stedman spoiler typology + web research grounding"
```

---

## Task 5: Upgrade commitment-scan/route.ts — Web Search Integration + Stedman Violation Typology

**Files:**
- Modify: `src/app/api/ai/commitment-scan/route.ts`

Currently has NO web search. Add: (1) web search to discover current commitments, (2) Stedman violation typology field, (3) web sources citation.

- [ ] **Step 1: Extend CommitmentSchema with Stedman violation typology and web sources**

After the `monitoringBody` field in `CommitmentSchema`, add:

```typescript
stedmanViolationType: z.enum(['intentional_spoiling', 'capacity_failure', 'poor_design', 'not_applicable']).optional().describe('If violated: Stedman cause classification — intentional (deliberate sabotage), capacity (unable to implement), design (vague obligations/no verification)'),
webSources: z.array(z.string()).describe('URLs or source names documenting this commitment and its compliance status'),
```

- [ ] **Step 2: Add web research to discover commitments before the AI call**

After the `creditCheck` block and before the `generateText` call, add:

```typescript
// --- Web search for current commitments ---
let commitmentContext = '';
try {
  const sitName = (situation as Situation | undefined)?.name || 'the situation';
  const year = new Date().getFullYear();
  const queries = [
    `${sitName} ceasefire agreement terms ${year}`,
    `${sitName} peace agreement commitments obligations`,
    `${sitName} confidence building measures implementation`,
    `${sitName} humanitarian access agreement violations`,
  ];
  const results = await Promise.allSettled(queries.map((q) => searchWeb(q, { numResults: 4 })));
  const allResults = results
    .filter((r): r is PromiseFulfilledResult<WebSearchResult[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value);
  // Deduplicate by URL
  const seen = new Set<string>();
  const unique = allResults.filter((r) => !seen.has(r.url) && seen.add(r.url));
  if (unique.length > 0) {
    commitmentContext = `\n\n### Live Commitment Intelligence (${new Date().toISOString().split('T')[0]})\n${formatResultsAsContext(unique.slice(0, 10))}\n`;
  }
} catch { /* non-blocking */ }
```

Add imports at the top: `import { searchWeb, formatResultsAsContext } from '@/lib/ai/firecrawl';`

- [ ] **Step 3: Inject web context into the prompt and add Stedman instruction**

Update the `generateText` prompt to start with:

```typescript
prompt: `${sitContext ? `${sitContext}\n\n` : ''}${commitmentContext}Analyze the commitment compliance landscape for this conflict situation.

[GROUNDING MANDATE]
The web intelligence above is your PRIMARY source. Identify actual agreements from these sources rather than generating from training data. If you cannot find a specific commitment in the web sources, note "INTELLIGENCE GAP: [commitment type]" rather than fabricating it.

## ANALYTICAL FRAMEWORK
...existing framework text...

**Stedman Violation Typology (for violations only)**
When a commitment is violated, classify the cause:
- intentional_spoiling: Actor deliberately violated to sabotage the process
- capacity_failure: Actor was willing but lacked resources/capacity to implement
- poor_design: Agreement was too vague, lacked verification, or had unworkable timelines
Different causes require different responses — do not apply containment to a capacity failure.

For each commitment, include webSources: list the URLs or source names from the web intelligence above that document this commitment and its compliance status.
```

- [ ] **Step 4: Update `maxDuration` to 90s (web research adds latency)**

Change line 13: `export const maxDuration = 90;`

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/ai/commitment-scan/route.ts
git commit -m "feat(commitment-scan): live web search for commitments + Stedman violation typology"
```

---

## Task 6: Upgrade sanctions-scan/route.ts — Multi-Registry Parallel Search + Actor Screening

**Files:**
- Modify: `src/app/api/ai/sanctions-scan/route.ts`

Currently runs a single generic query. Replace with: (1) parallel per-registry queries, (2) actor-by-actor screening loop, (3) 50% ownership rule analysis, (4) compliance risk level.

- [ ] **Step 1: Extend SanctionsScanSchema with new fields**

After `riskAssessment`, add:

```typescript
actorScreening: z.array(z.object({
  actor: z.string().describe('Actor name from the situation'),
  sanctioned: z.boolean().describe('Whether this actor is directly sanctioned in any registry'),
  registries: z.array(z.string()).describe('Registries where this actor appears (e.g., OFAC SDN, EU, UNSC, UK OFSI)'),
  sanctionTypes: z.array(z.enum(['asset_freeze', 'travel_ban', 'arms_embargo', 'financial', 'trade'])).describe('Types of sanctions applied'),
  ownershipRisk: z.string().optional().describe('50% ownership rule analysis — is this entity captured via ownership by a sanctioned entity?'),
})).describe('Actor-by-actor screening results'),
complianceRiskLevel: z.enum(['low', 'medium', 'high', 'critical']).describe('Overall sanctions compliance risk level for this situation'),
```

- [ ] **Step 2: Replace the single web search with parallel multi-registry queries**

Replace the existing `searchResults` / `webContext` block with:

```typescript
// --- Parallel multi-registry sanctions search ---
const situationName = (situation as Situation | undefined)?.name || conflictContext || 'the situation';
const country = (situation as Situation | undefined)?.region || '';
const year = new Date().getFullYear();
const registryQueries = [
  `${entities.slice(0, 3).join(' ')} OFAC SDN list sanctions ${year}`,
  `${entities.slice(0, 3).join(' ')} EU sanctions designation ${year}`,
  `${situationName} UN Security Council sanctions UNSC committee`,
  `${entities.slice(0, 3).join(' ')} UK OFSI sanctions designation`,
  `${situationName} ${country} sanctions violations evasion ${year}`,
];
// Per-actor queries for entities list
const actorQueries = entities.slice(0, 4).map(
  (e) => `"${e}" sanctions OFAC EU UNSC designation`
);
const allQueries = [...registryQueries, ...actorQueries];

const searchResults = await Promise.allSettled(
  allQueries.map((q) => searchWeb(q, { numResults: 3 }))
);
const allWebResults = searchResults
  .filter((r): r is PromiseFulfilledResult<WebSearchResult[]> => r.status === 'fulfilled')
  .flatMap((r) => r.value);
const seen = new Set<string>();
const uniqueResults = allWebResults.filter((r) => !seen.has(r.url) && seen.add(r.url));
const webContext = formatResultsAsContext(uniqueResults.slice(0, 15));
```

Add import: `import type { WebSearchResult } from '@/lib/ai/firecrawl';`

- [ ] **Step 3: Update the prompt to use new schema fields and add 50% ownership rule**

Update the AI prompt to:

```typescript
prompt: `${sitContext ? `${sitContext}\n\n` : ''}[ROLE]
You are a senior sanctions compliance analyst for PRAXIS. Analyze the following entities against all major sanctions registries.

[WEB INTELLIGENCE — ${new Date().toISOString().split('T')[0]}]
${webContext || 'No web results available. Base analysis on training data and conflict context.'}

ENTITIES TO SCREEN: ${entities.join(', ')}
${conflictContext ? `CONFLICT CONTEXT: ${conflictContext}` : ''}
SITUATION: ${situationName}

## SCREENING METHODOLOGY

**1. Registry-by-Registry Check**
For each entity, check against: OFAC SDN (US), EU consolidated list, UNSC consolidated list, UK OFSI. Note: designation date, sanction type (asset freeze / travel ban / arms embargo / financial / trade), legal basis.

**2. Actor-by-Actor Screening (actorScreening)**
For each of the ${entities.length} listed entities:
- Is this actor directly sanctioned? Which registries?
- What sanction types apply?
- 50% Ownership Rule: Is this entity majority-owned by a sanctioned entity? If so, it may be effectively sanctioned under OFAC guidance even without direct designation.

**3. Sanctions Changes**
Recent designations, delistings, modifications, investigations, evasion detected. Include dates and sources.

**4. Compliance Risk Level**
low: No major actors sanctioned, clear enforcement
medium: Some actors sanctioned, evasion risk present
high: Key actors sanctioned, systematic evasion patterns
critical: Core parties or state actors under comprehensive sanctions, active evasion documented

**5. Cross-Cutting Analysis**
Sanctions trends, enforcement patterns, strategic implications for the situation.

**6. Risk Assessment**
Priority risks, recommended monitoring actions.`
```

- [ ] **Step 4: Update `maxDuration` to 90s**

Change: `export const maxDuration = 90;`

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/ai/sanctions-scan/route.ts
git commit -m "feat(sanctions): multi-registry parallel search + actor screening + 50% ownership rule analysis"
```

---

## Task 7: Upgrade treaty-analyze/route.ts — VCLT Framework + IHL Compliance + Comparative Precedents

**Files:**
- Modify: `src/app/api/ai/treaty-analyze/route.ts`

Add: (1) comparative precedents web search, (2) VCLT interpretation fields per clause, (3) IHL/IHRL compliance flags, (4) ambiguity risk rating per clause.

- [ ] **Step 1: Extend TreatyAnalysisSchema clause object with new fields**

In the clause `z.object()` inside `TreatyAnalysisSchema`, add after `ambiguityFlag`:

```typescript
ambiguityRiskRating: z.enum(['high', 'medium', 'low', 'none']).describe('Risk level of ambiguity being exploited or causing disputes'),
vcltInterpretation: z.string().optional().describe('VCLT Article 31-33 interpretive notes: textual, contextual, or teleological issues'),
ihlFlag: z.enum(['compliant', 'below_standard', 'not_applicable']).describe('Whether this clause meets IHL/IHRL minimum standards'),
ihlNotes: z.string().optional().describe('If below IHL standards: which instrument and what the minimum requirement is'),
```

Also add after `recommendations`:

```typescript
comparativePrecedents: z.array(z.object({
  agreement: z.string().describe('Name of comparable peace agreement'),
  relevantClause: z.string().describe('How that agreement handled a similar issue'),
  lesson: z.string().describe('What this implies for the current agreement'),
})).max(3).describe('Comparable agreements and lessons for this treaty'),
webGrounding: z.array(z.string()).describe('URLs or sources used for comparative analysis'),
```

- [ ] **Step 2: Add comparative precedents web search before the AI call**

After the `creditCheck` block, add:

```typescript
// --- Comparative precedents research ---
let comparativeContext = '';
try {
  const year = new Date().getFullYear();
  const sitName = (situation as Situation | undefined)?.name || conflictContext || 'peace agreement';
  const queries = [
    `${sitName} comparable peace agreements precedents`,
    `peace agreement ambiguity disputes implementation failure lessons`,
    `IHL humanitarian clause peace agreement best practices`,
  ];
  const results = await Promise.allSettled(queries.map((q) => searchWeb(q, { numResults: 3 })));
  const allResults = results
    .filter((r): r is PromiseFulfilledResult<WebSearchResult[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value);
  if (allResults.length > 0) {
    comparativeContext = `\n\n### Comparative Precedents Research (${new Date().toISOString().split('T')[0]})\n${formatResultsAsContext(allResults.slice(0, 8))}\n`;
  }
} catch { /* non-blocking */ }
```

Add imports: `import { searchWeb, formatResultsAsContext } from '@/lib/ai/firecrawl';`

- [ ] **Step 3: Update the AI prompt with VCLT + IHL + comparative instructions**

In the `generateText` call, update prompt to:

```typescript
prompt: `${contextPrefix ? `${contextPrefix}\n\n` : ''}${comparativeContext}You are a senior legal analyst specializing in peace agreement analysis and international humanitarian law. Analyze the following treaty or agreement text.

TREATY TEXT:
${treatyText}

${conflictContext ? `CONFLICT CONTEXT: ${conflictContext}` : ''}

## ANALYTICAL FRAMEWORK

**1. Clause Analysis (per clause)**
For each clause:
- Category: ceasefire / governance / rights / economic / implementation
- Compliance status: compliant / partial / non_compliant / not_yet_due / unclear
- Ambiguity flag: boolean — does this clause contain language that is vague or contestable?
- Ambiguity risk rating: high (likely to cause disputes) / medium / low / none
- VCLT interpretation (Article 31-33): Does textual reading align with contextual/teleological? Note any interpretive tension.
- IHL flag: Does this clause meet or exceed IHL/IHRL minimum standards? Reference the specific instrument if below standard (e.g., Geneva Convention IV Article 23, ICCPR Article 9).

**2. Compliance Summary**
Overall compliance % and per-party breakdown.

**3. Comparative Precedents**
Using the comparative research above, identify 2-3 comparable agreements. For each, describe how they handled a similar clause and what lesson it provides for this agreement.

**4. Recommendations**
Prioritized recommendations for: resolving ambiguities (with specific replacement language), improving compliance, strengthening IHL-deficient clauses.

Record all web sources used in webGrounding.`
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/ai/treaty-analyze/route.ts
git commit -m "feat(treaty-analyze): VCLT framework + IHL compliance flags + comparative precedents research"
```

---

## Task 8: Upgrade argus/route.ts — URL-Based Intelligence + CRAAP Evaluation + Cross-Source Triangulation

**Files:**
- Modify: `src/app/api/ai/argus/route.ts`

Add: (1) `urls` action for deep-scraping user-provided URLs, (2) CRAAP evaluation in `extract` action, (3) cross-source triangulation in `compare` action.

- [ ] **Step 1: Add CRAAP evaluation schema**

Before `EntityExtractionSchema`, add:

```typescript
const CRAAPEvaluationSchema = z.object({
  currency: z.object({ score: z.number().min(0).max(5), notes: z.string() }),
  relevance: z.object({ score: z.number().min(0).max(5), notes: z.string() }),
  authority: z.object({ score: z.number().min(0).max(5), notes: z.string() }),
  accuracy: z.object({ score: z.number().min(0).max(5), notes: z.string() }),
  purpose: z.object({ score: z.number().min(0).max(5), notes: z.string() }),
  totalScore: z.number().min(0).max(25),
  overallRating: z.enum(['high', 'medium', 'low', 'unreliable']),
  recommendation: z.string(),
});
```

- [ ] **Step 2: Add `UrlIntelligenceSchema` for the new `urls` action**

```typescript
const UrlIntelligenceSchema = z.object({
  sources: z.array(z.object({
    url: z.string(),
    title: z.string(),
    craap: CRAAPEvaluationSchema,
    entities: z.array(z.object({
      name: z.string(),
      type: z.string(),
      description: z.string(),
    })),
    keyClaimsExtracted: z.array(z.string()),
    summary: z.string(),
  })),
  corroboratedFacts: z.array(z.string()).describe('Claims confirmed by 2+ sources'),
  conflictingClaims: z.array(z.object({
    claim: z.string(),
    sourceA: z.string(),
    sourceB: z.string(),
    note: z.string(),
  })).describe('Claims where sources disagree'),
  uniqueIntelligence: z.array(z.object({
    claim: z.string(),
    onlyFrom: z.string(),
    note: z.string(),
  })).describe('Claims found in only 1 source — treat with caution'),
  synthesizedSummary: z.string(),
});
```

- [ ] **Step 3: Add the `urls` action handler**

In the POST handler, before the `if (action === 'query')` block, add:

```typescript
// --- Action: urls — deep-scrape user-provided URLs + CRAAP + triangulation ---
if (action === 'urls') {
  const urlList: string[] = (body as { urls?: string[] }).urls?.slice(0, 5) ?? [];
  if (urlList.length === 0) {
    return NextResponse.json({ error: 'Provide at least 1 URL in the urls array' }, { status: 400 });
  }

  // Scrape all URLs in parallel
  const scrapeResults = await Promise.allSettled(urlList.map((u) => scrapeUrl(u)));
  const scraped = scrapeResults
    .map((r, i) => ({ url: urlList[i], result: r.status === 'fulfilled' ? r.value : null }))
    .filter((s): s is { url: string; result: NonNullable<typeof s.result> } => s.result !== null && s.result.success);

  if (scraped.length === 0) {
    return NextResponse.json({ error: 'Could not scrape any of the provided URLs' }, { status: 422 });
  }

  const sourceText = scraped.map((s, i) =>
    `[SOURCE ${i + 1}] URL: ${s.url}\nTitle: ${s.result.title || 'Unknown'}\n\n${s.result.content.slice(0, 5000)}`
  ).join('\n\n---\n\n');

  const result = await generateText({
    model: getProModel(),
    output: Output.object({ schema: UrlIntelligenceSchema }),
    prompt: `${sitContext ? `${sitContext}\n\n---\n\n` : ''}You are ARGUS. The user has provided ${scraped.length} URLs for deep intelligence extraction.

SCRAPED CONTENT:
${sourceText}

For each source:
1. CRAAP evaluation (Currency 0-5, Relevance 0-5, Authority 0-5, Accuracy 0-5, Purpose 0-5). Total/25. Rating: high(20-25), medium(13-19), low(7-12), unreliable(<7).
2. ACO entity extraction: extract actors, locations, agreements, events, resources.
3. Key claims: 3-5 specific factual claims made by this source.
4. Summary: 2-3 sentence summary of intelligence value.

Then triangulate across sources:
- Corroborated facts: claims confirmed by 2+ sources (higher confidence)
- Conflicting claims: where sources disagree (flag for analyst review)
- Unique intelligence: claims from only 1 source (treat with caution)

Synthesize into a 1-paragraph intelligence summary.`,
    system: 'You are ARGUS, the URL-based intelligence engine within TACITUS PRAXIS. Apply CRAAP source evaluation methodology and cross-source triangulation. Produce structured intelligence assessments for diplomatic professionals.',
  });

  return NextResponse.json(result.output);
}
```

Add `import { scrapeUrl } from '@/lib/ai/firecrawl';` to imports.

- [ ] **Step 4: Add CRAAP evaluation to the `extract` action**

In the `extract` action's `generateText` prompt, add:

```
After entity extraction, provide a CRAAP evaluation of the provided text as a source:
- Currency: When was this information produced? Is it recent enough?
- Relevance: How relevant is this to the situation?
- Authority: Who produced this? What is the source type?
- Accuracy: Are claims verifiable? Are sources cited?
- Purpose: Is this informational, analytical, advocacy, or propaganda?
Score each 0-5. Provide overall rating and recommendation.
```

Update `EntityExtractionSchema` to include:

```typescript
craapEvaluation: CRAAPEvaluationSchema.optional().describe('CRAAP source evaluation of the provided text'),
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/ai/argus/route.ts
git commit -m "feat(argus): URL-based intelligence mode + CRAAP evaluation + cross-source triangulation"
```

---

## Task 9: Upgrade media-analyze/route.ts — Media Compass with 50+ Outlet Database + Live Comparison

**Files:**
- Modify: `src/app/api/ai/media-analyze/route.ts`

The current route only analyzes a single outlet on-demand. Rebuild as Media Compass supporting: (1) 50+ outlet static database lookup, (2) `liveComparison` action with live coverage search, (3) 2D scatter data output for visualization.

- [ ] **Step 1: Add the 50+ outlet static database**

At the top of the file, before the schema, add the outlet database:

```typescript
// ---------------------------------------------------------------------------
// Static outlet database — 50+ global outlets for Media Compass
// ---------------------------------------------------------------------------
const OUTLET_DATABASE: Record<string, {
  name: string; region: string; lean: number; reliability: number;
  ownershipType: 'state' | 'public' | 'private' | 'wire' | 'nonprofit';
  language: string; domains: string[];
}> = {
  // Western — English
  'nytimes': { name: 'New York Times', region: 'North America', lean: -3, reliability: 8.5, ownershipType: 'private', language: 'en', domains: ['nytimes.com'] },
  'guardian': { name: 'The Guardian', region: 'Western Europe', lean: -4, reliability: 8.0, ownershipType: 'nonprofit', language: 'en', domains: ['theguardian.com'] },
  'bbc': { name: 'BBC', region: 'Western Europe', lean: -1, reliability: 8.5, ownershipType: 'public', language: 'en', domains: ['bbc.com', 'bbc.co.uk'] },
  'reuters': { name: 'Reuters', region: 'Global', lean: 0, reliability: 9.0, ownershipType: 'wire', language: 'en', domains: ['reuters.com'] },
  'ap': { name: 'Associated Press', region: 'Global', lean: 0, reliability: 9.0, ownershipType: 'nonprofit', language: 'en', domains: ['apnews.com'] },
  'wsj': { name: 'Wall Street Journal', region: 'North America', lean: 3, reliability: 8.0, ownershipType: 'private', language: 'en', domains: ['wsj.com'] },
  'fox': { name: 'Fox News', region: 'North America', lean: 7, reliability: 4.0, ownershipType: 'private', language: 'en', domains: ['foxnews.com'] },
  'economist': { name: 'The Economist', region: 'Western Europe', lean: 2, reliability: 8.5, ownershipType: 'private', language: 'en', domains: ['economist.com'] },
  'ft': { name: 'Financial Times', region: 'Western Europe', lean: 2, reliability: 8.5, ownershipType: 'private', language: 'en', domains: ['ft.com'] },
  'wapost': { name: 'Washington Post', region: 'North America', lean: -3, reliability: 8.0, ownershipType: 'private', language: 'en', domains: ['washingtonpost.com'] },
  // Middle East
  'aljazeera': { name: 'Al Jazeera', region: 'Middle East', lean: -2, reliability: 7.0, ownershipType: 'state', language: 'en/ar', domains: ['aljazeera.com'] },
  'alarabiya': { name: 'Al Arabiya', region: 'Middle East', lean: 3, reliability: 6.5, ownershipType: 'state', language: 'ar/en', domains: ['alarabiya.net'] },
  'trt': { name: 'TRT World', region: 'Middle East', lean: 2, reliability: 6.0, ownershipType: 'state', language: 'en', domains: ['trtworld.com'] },
  'timesofisrael': { name: 'Times of Israel', region: 'Middle East', lean: 2, reliability: 7.0, ownershipType: 'private', language: 'en', domains: ['timesofisrael.com'] },
  // Russian / Chinese state
  'rt': { name: 'RT (Russia Today)', region: 'Russia/CIS', lean: 8, reliability: 2.5, ownershipType: 'state', language: 'en', domains: ['rt.com'] },
  'tass': { name: 'TASS', region: 'Russia/CIS', lean: 8, reliability: 3.5, ownershipType: 'state', language: 'en/ru', domains: ['tass.com'] },
  'xinhua': { name: 'Xinhua', region: 'East Asia', lean: 8, reliability: 3.5, ownershipType: 'state', language: 'en/zh', domains: ['xinhuanet.com'] },
  'cgtn': { name: 'CGTN', region: 'East Asia', lean: 7, reliability: 3.0, ownershipType: 'state', language: 'en', domains: ['cgtn.com'] },
  'globaltimes': { name: 'Global Times', region: 'East Asia', lean: 9, reliability: 2.5, ownershipType: 'state', language: 'en', domains: ['globaltimes.cn'] },
  // African
  'dailynation': { name: 'Daily Nation (Kenya)', region: 'Sub-Saharan Africa', lean: 0, reliability: 7.0, ownershipType: 'private', language: 'en', domains: ['nation.africa'] },
  'dailymonitor': { name: 'Daily Monitor (Uganda)', region: 'Sub-Saharan Africa', lean: -1, reliability: 6.5, ownershipType: 'private', language: 'en', domains: ['monitor.co.ug'] },
  'mailandguardian': { name: 'Mail & Guardian', region: 'Sub-Saharan Africa', lean: -2, reliability: 7.5, ownershipType: 'private', language: 'en', domains: ['mg.co.za'] },
  'addisstandard': { name: 'Addis Standard', region: 'Sub-Saharan Africa', lean: -1, reliability: 7.0, ownershipType: 'private', language: 'en', domains: ['addisstandard.com'] },
  // South Asian
  'ndtv': { name: 'NDTV', region: 'South Asia', lean: -1, reliability: 7.0, ownershipType: 'private', language: 'en', domains: ['ndtv.com'] },
  'dawn': { name: 'Dawn', region: 'South Asia', lean: 0, reliability: 7.5, ownershipType: 'private', language: 'en', domains: ['dawn.com'] },
  'thehindu': { name: 'The Hindu', region: 'South Asia', lean: -2, reliability: 7.5, ownershipType: 'private', language: 'en', domains: ['thehindu.com'] },
  // French
  'lemonde': { name: 'Le Monde', region: 'Western Europe', lean: -2, reliability: 8.5, ownershipType: 'private', language: 'fr', domains: ['lemonde.fr'] },
  'lefigaro': { name: 'Le Figaro', region: 'Western Europe', lean: 3, reliability: 7.5, ownershipType: 'private', language: 'fr', domains: ['lefigaro.fr'] },
  // German
  'spiegel': { name: 'Der Spiegel', region: 'Western Europe', lean: -2, reliability: 8.0, ownershipType: 'private', language: 'de', domains: ['spiegel.de'] },
  'faz': { name: 'Frankfurter Allgemeine', region: 'Western Europe', lean: 2, reliability: 8.0, ownershipType: 'private', language: 'de', domains: ['faz.net'] },
  // Think tanks / specialized
  'crisisgroup': { name: 'International Crisis Group', region: 'Global', lean: 0, reliability: 9.5, ownershipType: 'nonprofit', language: 'en', domains: ['crisisgroup.org'] },
  'reliefweb': { name: 'ReliefWeb', region: 'Global', lean: 0, reliability: 9.0, ownershipType: 'nonprofit', language: 'en', domains: ['reliefweb.int'] },
  'acleddata': { name: 'ACLED', region: 'Global', lean: 0, reliability: 9.5, ownershipType: 'nonprofit', language: 'en', domains: ['acleddata.com'] },
  'unhcr': { name: 'UNHCR', region: 'Global', lean: 0, reliability: 9.0, ownershipType: 'nonprofit', language: 'en', domains: ['unhcr.org'] },
  'ocha': { name: 'OCHA', region: 'Global', lean: 0, reliability: 9.0, ownershipType: 'nonprofit', language: 'en', domains: ['unocha.org', 'reliefweb.int'] },
  'hrw': { name: 'Human Rights Watch', region: 'Global', lean: -1, reliability: 8.5, ownershipType: 'nonprofit', language: 'en', domains: ['hrw.org'] },
  'amnesty': { name: 'Amnesty International', region: 'Global', lean: -1, reliability: 8.0, ownershipType: 'nonprofit', language: 'en', domains: ['amnesty.org'] },
  // Latin American
  'folha': { name: 'Folha de S.Paulo', region: 'Latin America', lean: -1, reliability: 7.5, ownershipType: 'private', language: 'pt', domains: ['folha.uol.com.br'] },
  'clarin': { name: 'Clarín', region: 'Latin America', lean: 2, reliability: 7.0, ownershipType: 'private', language: 'es', domains: ['clarin.com'] },
};
```

- [ ] **Step 2: Extend the existing `MediaAnalysisSchema` and add a `LiveComparisonSchema`**

Update `MediaAnalysisSchema` to add `scatterPoint` for the 2D visualization:

```typescript
scatterPoint: z.object({
  lean: z.number().min(-10).max(10).describe('Political lean for 2D scatter — scaled -10 to +10'),
  reliability: z.number().min(0).max(10).describe('Reliability for 2D scatter — scaled 0-10'),
}).describe('2D scatter plot coordinates'),
```

Add a new schema for live comparison:

```typescript
const LiveComparisonSchema = z.object({
  outlets: z.array(z.object({
    outletName: z.string(),
    lean: z.number().min(-10).max(10),
    reliability: z.number().min(0).max(10),
    headlineTone: z.enum(['positive', 'neutral', 'negative']).describe('Tone of coverage'),
    framing: z.string().describe('How this outlet frames the story'),
    keyOmissions: z.array(z.string()).describe('Important context this outlet omits'),
    articleSummary: z.string().describe('What this outlet is reporting'),
    sourceUrl: z.string().optional(),
  })),
  overallNarrative: z.string().describe('Dominant narrative across outlets'),
  outlierFramings: z.array(z.string()).describe('Outlets with significantly different framings'),
  recommendedSources: z.array(z.string()).describe('High-reliability outlets to monitor for this situation'),
});
```

- [ ] **Step 3: Update the POST handler to support multiple actions**

Replace the existing handler body with:

```typescript
const { source, topic, situation, action = 'analyze', outlets } = await request.json() as {
  source?: string;
  topic?: string;
  situation?: Situation;
  action?: 'analyze' | 'liveComparison' | 'database';
  outlets?: string[];
};
```

Add a `database` action that returns matching outlets:

```typescript
if (action === 'database') {
  // Return all database outlets as scatter plot data
  const dbOutlets = Object.values(OUTLET_DATABASE).map((o) => ({
    name: o.name, region: o.region, lean: o.lean, reliability: o.reliability,
    ownershipType: o.ownershipType, language: o.language,
  }));
  return Response.json({ outlets: dbOutlets });
}
```

Add a `liveComparison` action:

```typescript
if (action === 'liveComparison') {
  const targetOutlets = outlets ?? ['reuters', 'aljazeera', 'rt', 'bbc', 'crisisgroup'];
  const sitName = (situation as Situation | undefined)?.name || topic || 'the situation';
  const year = new Date().getFullYear();

  // Search each outlet for current coverage
  const coverageResults = await Promise.allSettled(
    targetOutlets.map((outletKey) => {
      const outlet = OUTLET_DATABASE[outletKey];
      if (!outlet) return Promise.resolve([]);
      const domain = outlet.domains[0];
      return searchWeb(`site:${domain} ${sitName} ${year}`, { numResults: 2 });
    })
  );

  const outletCoverage = targetOutlets.map((key, i) => ({
    key,
    outlet: OUTLET_DATABASE[key],
    results: coverageResults[i].status === 'fulfilled' ? coverageResults[i].value : [],
  })).filter((o) => o.outlet);

  const coverageText = outletCoverage.map((o) =>
    `[${o.outlet.name}] (lean: ${o.outlet.lean}/10, reliability: ${o.outlet.reliability}/10)\n` +
    (o.results.length > 0
      ? o.results.map((r) => `  ${r.title}\n  ${r.description?.slice(0, 200) || ''}\n  URL: ${r.url}`).join('\n')
      : '  (no recent coverage found)')
  ).join('\n\n---\n\n');

  const sitCtx = (situation as Situation | undefined) ? buildToolContext(situation as Situation) : '';
  const result = await generateText({
    model: getProModel(),
    output: Output.object({ schema: LiveComparisonSchema }),
    prompt: `${sitCtx ? `${sitCtx}\n\n` : ''}Analyze how different media outlets are framing coverage of: ${sitName}

CURRENT COVERAGE BY OUTLET:
${coverageText}

For each outlet that has coverage:
- headlineTone: positive / neutral / negative
- framing: How does this outlet frame the story? (1-2 sentences)
- keyOmissions: What important context does this outlet leave out?
- articleSummary: What is this outlet actually reporting?

Then provide:
- overallNarrative: What is the dominant narrative across outlets?
- outlierFramings: Which outlets frame the story very differently?
- recommendedSources: Which outlets provide the most reliable coverage for this situation?`,
    system: 'You are a media analysis expert for PRAXIS. Identify framing differences, editorial biases, and coverage gaps across global media outlets. Reference specific headlines and content from the coverage provided.',
  });

  return Response.json({ comparison: result.output, outlets: outletCoverage.map((o) => ({ key: o.key, ...o.outlet })) });
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/ai/media-analyze/route.ts
git commit -m "feat(media-compass): 50+ outlet database + live comparison action + 2D scatter data"
```

---

## Task 10: Upgrade media-roundup/route.ts — Entman Framing + Agenda-Setting Gap Detection

**Files:**
- Modify: `src/app/api/ai/media-roundup/route.ts`

The route already has good multi-source search and scoring. Add Entman 4-function framing analysis and agenda-setting gap detection to the prompt.

- [ ] **Step 1: Update the streaming prompt to add Entman framing and coverage gap sections**

In the `streamText` call, update the `prompt` to add two new mandatory sections after the existing `Intelligence Gaps` section:

```typescript
prompt: `Generate a Media Intelligence Roundup based on these ${topResults.length} sources gathered in the ${timeLabel}.

SOURCES:
${sourceText}

INSTRUCTIONS:
1. Organize into ${maxSections} thematic sections (e.g., "Military Developments", "Diplomatic Activity", "Humanitarian Situation", "Regional Dynamics")
2. Each section: 2-3 key developments with source citations [Source Name]
3. Rate each development: CRITICAL / IMPORTANT / NOTABLE
4. Flag any contradictions between sources

## Entman Framing Analysis
Apply Robert Entman's 4-function framing model across the coverage:
- **Problem Definition**: What is the dominant definition of the problem across sources? Who/what is presented as causing the problem?
- **Causal Attribution**: Who or what is assigned responsibility? Is attribution contested across outlets?
- **Moral Evaluation**: What value judgments appear? Which actors are cast as heroes/villains?
- **Treatment Recommendation**: What actions do sources implicitly or explicitly suggest?
Compare framings across outlet types (Western mainstream vs regional vs state media vs think tanks).

## Agenda-Setting Gap Analysis  
Cross-reference coverage volume with situation severity:
- List 2-3 significant events or issues that appear underreported (less than 2 source mentions) relative to their importance
- For each gap, note: what is being underreported, why it matters, which source types are ignoring it
- Flag: "COVERAGE GAP: [topic] — reported by [1 source] but potentially significant because [reason]"

## Intelligence Gaps
What we still don't know — information that would materially change the analysis.

## Recommended Actions
What the analyst should do next based on this coverage review.

Use markdown formatting. Every factual claim must cite its source [Source Name]. If fewer than 5 sources were found, note limited coverage.`,
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/ai/media-roundup/route.ts
git commit -m "feat(media-roundup): Entman 4-function framing analysis + agenda-setting gap detection"
```

---

## Task 11: Upgrade deep-search-agent/route.ts — ACH Output Format + Timeout Robustness

**Files:**
- Modify: `src/app/api/ai/deep-search-agent/route.ts`

Add: (1) per-turn 120s timeout, (2) enhanced enrichedQuery for ACH output format, (3) graceful handling when sub-agents fail to return.

- [ ] **Step 1: Update the enrichedQuery to mandate ACH output structure**

Find the `enrichedQuery` construction block and update it:

```typescript
enrichedQuery = `CONFLICT SITUATION: "${situation.name}" | Region: ${situation.region || 'unspecified'} | Key Actors: ${actorList} | Risk: ${riskLabel} (${situation.riskScore}/10)

RESEARCH QUERY: ${query.trim()}

OUTPUT REQUIREMENTS — MANDATORY:
Structure your final response as an Analysis of Competing Hypotheses (ACH) intelligence brief:

## Executive Summary
2-3 sentence intelligence summary of key findings.

## Research Findings
Organized by sub-question. For each finding, cite the source URL.

## Hypotheses Matrix
List 2-4 competing hypotheses that explain the evidence. For each:
- H[N]: [Hypothesis statement]
- Consistent evidence: [evidence that supports this]
- Inconsistent evidence: [evidence that contradicts this]
- Diagnosticity: how much does the evidence uniquely point to this hypothesis?

## Confidence Assessment
Rank hypotheses by confidence. For the leading hypothesis, state confidence level using ICD 203 language (almost certain / highly likely / likely / roughly even / unlikely).

## Intelligence Gaps
What additional information would significantly change the assessment?

## Source Quality
Brief CRAAP evaluation of the 3 most important sources used.

Provide thorough, evidence-based analysis using web research. Ground findings in primary sources.`;
```

- [ ] **Step 2: Add 120s per-turn timeout using AbortSignal**

In the `streamAgentTurn` call inside the `stream` ReadableStream `start` function, wrap it with a timeout:

```typescript
// Add 120s timeout per agent turn
const turnAbort = AbortSignal.timeout(120_000);
// Pass turnAbort to streamAgentTurn if the function accepts a signal
// If not, wrap the Promise:
const turnPromise = streamAgentTurn(config, sessionId, enrichedQuery);
const timeoutPromise = new Promise<never>((_, reject) =>
  setTimeout(() => reject(new Error('Agent turn timed out after 120s')), 120_000)
);

// In the event loop, use Promise.race for the initial response
```

Note: Check the `streamAgentTurn` function signature in `src/lib/ai/vertex-agent.ts` before modifying. If it accepts an `AbortSignal`, pass `turnAbort`. If not, use `Promise.race`. The key is that if 120s elapses, emit a status event and continue to synthesis.

- [ ] **Step 3: Add graceful degradation on timeout**

In the catch block for agent turn failures:

```typescript
} catch (err) {
  const isTimeout = err instanceof Error && err.message.includes('timed out');
  controller.enqueue(emit({
    type: 'status',
    text: isTimeout
      ? 'Research phase timed out — synthesizing available findings…'
      : `Research error: ${err instanceof Error ? err.message : 'Unknown error'}`,
  }));
  // Continue to synthesis rather than throwing
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/ai/deep-search-agent/route.ts
git commit -m "feat(deep-search-agent): ACH output format mandate + 120s timeout robustness"
```

---

## Task 12: Scenario Planner UI — Parameter Sliders

**Files:**
- Modify: `src/app/app/scenarios/page.tsx`

Read the page file first, then add the 5 parameter slider controls.

- [ ] **Step 1: Read the current page**

```bash
# Read the page to understand current UI structure
```

Use the Read tool on `src/app/app/scenarios/page.tsx` to understand the current layout and state management before adding sliders.

- [ ] **Step 2: Add slider state to the component**

In the component, add parameter state:

```typescript
const [params, setParams] = useState({
  ceasefireCompliance: 50,
  externalIntervention: 30,
  economicPressure: 50,
  humanitarianAccess: 50,
  mediaEnvironment: 50,
});
```

- [ ] **Step 3: Add parameter slider UI panel**

Add a collapsible panel with 5 sliders before the scenario trigger input. Each slider uses an `<input type="range">` with Tailwind styling:

```tsx
<div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 space-y-3">
  <h3 className="text-sm font-medium text-white/70 uppercase tracking-wider">
    Scenario Parameters
  </h3>
  {[
    { key: 'ceasefireCompliance', label: 'Ceasefire Compliance', unit: '%' },
    { key: 'externalIntervention', label: 'External Intervention Probability', unit: '%' },
    { key: 'economicPressure', label: 'Economic Pressure Level', unit: '%' },
    { key: 'humanitarianAccess', label: 'Humanitarian Access', unit: '%' },
    { key: 'mediaEnvironment', label: 'Media Environment Freedom', unit: '%' },
  ].map(({ key, label, unit }) => (
    <div key={key} className="space-y-1">
      <div className="flex justify-between text-xs text-white/50">
        <span>{label}</span>
        <span>{params[key as keyof typeof params]}{unit}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={params[key as keyof typeof params]}
        onChange={(e) => setParams((p) => ({ ...p, [key]: Number(e.target.value) }))}
        className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-emerald-400 cursor-pointer"
      />
    </div>
  ))}
</div>
```

- [ ] **Step 4: Pass `params` to the API call**

In the function that calls `/api/ai/scenario`, add `params` to the request body:

```typescript
body: JSON.stringify({ conflictContext, scenarioTrigger, actors, timeHorizon, situation, params }),
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 6: Commit**

```bash
git add src/app/app/scenarios/page.tsx
git commit -m "feat(scenarios-ui): 5-parameter adjustment sliders for scenario calibration"
```

---

## Task 13: Negotiation Prep UI — ZOPA D3 Visualization

**Files:**
- Modify: `src/app/app/negotiation-prep/page.tsx`

Add a D3.js horizontal range-bar visualization showing each party's min/ideal/max positions per issue, with ZOPA overlap highlighted.

- [ ] **Step 1: Read the current page**

Use the Read tool on `src/app/app/negotiation-prep/page.tsx` to understand current layout and how `zopaAnalysis` data is displayed.

- [ ] **Step 2: Create a ZopaChart component inline in the page**

Add this component before the main export:

```tsx
function ZopaChart({ issues }: { issues: Array<{
  issue: string;
  partyPositions: Array<{ party: string; min: string; max: string; ideal: string }>;
  overlapExists: boolean;
}> }) {
  // Map text positions to numerical values for visualization
  // Use index-based positioning since min/max are descriptive text
  const COLORS = ['#4E79A7', '#F28E2B', '#59A14F', '#E15759'];

  return (
    <div className="space-y-4">
      {issues.map((issue) => (
        <div key={issue.issue} className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-sm font-medium text-white/90">{issue.issue}</h4>
            {issue.overlapExists ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">ZOPA exists</span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">No ZOPA</span>
            )}
          </div>
          <div className="space-y-2">
            {issue.partyPositions.map((pos, i) => (
              <div key={pos.party} className="space-y-1">
                <div className="text-xs text-white/50">{pos.party}</div>
                <div className="relative h-6 rounded bg-white/5">
                  {/* Range bar spanning full width — min to max */}
                  <div
                    className="absolute top-1 bottom-1 rounded"
                    style={{
                      left: `${(i * 5)}%`,
                      right: `${(i * 5)}%`,
                      backgroundColor: COLORS[i % COLORS.length] + '40',
                      borderLeft: `3px solid ${COLORS[i % COLORS.length]}`,
                      borderRight: `3px solid ${COLORS[i % COLORS.length]}`,
                    }}
                  />
                  {/* Ideal position marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5"
                    style={{
                      left: '50%',
                      backgroundColor: COLORS[i % COLORS.length],
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-white/40">
                  <span title={pos.min}>Min: {pos.min.slice(0, 40)}{pos.min.length > 40 ? '…' : ''}</span>
                  <span title={pos.ideal} className="text-center">↑ Ideal</span>
                  <span title={pos.max} className="text-right">Max: {pos.max.slice(0, 40)}{pos.max.length > 40 ? '…' : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Replace or supplement the existing ZOPA display with ZopaChart**

Find where `zopaAnalysis` is rendered and wrap it with:

```tsx
{data?.zopaAnalysis && data.zopaAnalysis.length > 0 && (
  <ZopaChart issues={data.zopaAnalysis} />
)}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
git add src/app/app/negotiation-prep/page.tsx
git commit -m "feat(negotiation-ui): ZOPA range-bar visualization with overlap indicators"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] 6.1 Scenario: web-grounded triggers (Task 1), parameter sliders (Task 12), Glasl projection (Task 1), policy per scenario (Task 1), probability calibration (Task 1)
- [x] 6.2 Negotiation: ZOPA visualization (Task 13), BATNA web research (Task 2), Zartman ripeness (Task 2), deal probability interval (Task 2), deal-breakers/enablers (Task 2)
- [ ] 6.3 CONCORDIA: persona generation, phase progression, coaching, transcript — **NOT INCLUDED** (Gemini Live API integration is a separate substantial effort; recommend a dedicated plan for CONCORDIA)
- [x] 6.4 Mediation Designer: Berghof phases (already in route), CBM Glasl library (Task 4), Stedman spoiler typology (Task 4), web research (Task 4), process risks (already in route)
- [x] 6.5 Game Theory: web payoffs (Task 3), archetype (already in route), Nash viz (already in route), sequential tree (already in route), commitment mechanisms (already in route)
- [x] 7.1 Deep Search: ACH output (Task 11), timeout robustness (Task 11)
- [x] 7.2 ARGUS: URL-based (Task 8), CRAAP (Task 8), triangulation (Task 8)
- [x] 7.3 Media Compass: 50+ database (Task 9), live comparison (Task 9), 2D scatter data (Task 9)
- [x] 7.4 Media Roundup: Entman framing (Task 10), agenda-setting gaps (Task 10), already streams
- [x] 7.5 Sanctions: multi-registry (Task 6), actor screening (Task 6), 50% ownership (Task 6), compliance risk (Task 6)
- [x] 7.6 Commitments: web search (Task 5), compliance scoring (already in route), Stedman typology (Task 5), web sources (Task 5)
- [x] 7.7 Treaty: VCLT framework (Task 7), ambiguity detection (already in route + enhanced), IHL compliance (Task 7), comparative analysis (Task 7)
- [ ] 7.8 Alert Center: multi-source triggers, push notifications, routing, dedup — **NOT INCLUDED** (cron route + browser push API is separate; recommend a dedicated plan)
- [ ] 7.9 Geospatial: Leaflet map, territorial control — **NOT INCLUDED** (Leaflet integration is substantial UI; recommend a dedicated plan)
- [ ] 7.1 Deep Search: multi-turn follow-up, source quality CRAAP — **PARTIAL** (ACH and timeout done; multi-turn requires session state refactor)

**Gaps to address in follow-up plans:**
1. **CONCORDIA upgrades** — Gemini Live API persona injection and phase tracking
2. **Alert Center** — Cron-based web monitoring + push notifications
3. **Geospatial Monitor** — Leaflet.js map integration + DBSCAN clustering
4. **Deep Search multi-turn** — Session state persistence in Firestore
