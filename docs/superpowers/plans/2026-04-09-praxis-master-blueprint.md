# PRAXIS Master Improvement Blueprint — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement all improvements from the PRAXIS Master Improvement Blueprint v1.0 across infrastructure, context tools, analysis tools, drafting tools, simulation tools, and intelligence tools.

**Architecture:** Next.js 16 App Router + Python FastAPI on GCP Cloud Run. AI via AI SDK v6 (Gemini 2.5 Flash/Pro primary, Claude Sonnet 4 deep analysis). All tool outputs persisted in Firestore via `tool-data-service.ts`.

**Tech Stack:** TypeScript, Next.js 16, AI SDK v6 (`generateText` + `Output.object`), Firestore Admin SDK, Zod, D3.js, Tailwind CSS 4, Radix UI.

**Execution Order:** Phase 1 (Infrastructure) → Phase 2 (Context Tools) → Phase 3 (Analysis Tools) → Phase 4 (Drafting Tools). Each phase is independently deployable.

---

## Phase 1: Platform-Wide Infrastructure (§1)

### Task 1.1: Tool Output Versioning — `tool-data-service.ts`

**Files:**
- Modify: `src/lib/firebase/tool-data-service.ts`

Current state: `version: 1` is hardcoded. Each `saveToolData` overwrites without history.
Goal: Increment version on each save + write version history to subcollection.

- [ ] **Step 1.1.1: Add version increment and history write**

Replace the full file content:

```typescript
import { adminDb } from './admin';

/**
 * Firestore path: users/{uid}/situations/{situationId}/tool-data/{toolId}
 * Each save increments version and writes a snapshot to the versions subcollection.
 */

function toolDataRef(uid: string, situationId: string, toolId: string) {
  if (!adminDb) {
    throw new Error(
      'Firebase Admin SDK not initialized. Set FIREBASE_SERVICE_ACCOUNT_KEY environment variable.'
    );
  }
  return adminDb
    .collection('users')
    .doc(uid)
    .collection('situations')
    .doc(situationId)
    .collection('tool-data')
    .doc(toolId);
}

function toolVersionsRef(uid: string, situationId: string, toolId: string) {
  return toolDataRef(uid, situationId, toolId).collection('versions');
}

export async function saveToolData(
  uid: string,
  situationId: string,
  toolId: string,
  data: unknown
): Promise<void> {
  const ref = toolDataRef(uid, situationId, toolId);
  const snap = await ref.get();
  const prevVersion = snap.exists ? ((snap.data()?.version as number) ?? 1) : 0;
  const newVersion = prevVersion + 1;
  const generatedAt = new Date().toISOString();

  // Write current doc
  await ref.set({ data, generatedAt, version: newVersion });

  // Write version history entry (keep last 10)
  const versionsRef = toolVersionsRef(uid, situationId, toolId);
  await versionsRef.doc(String(newVersion)).set({ data, generatedAt, version: newVersion });

  // Prune old versions — keep latest 10
  if (newVersion > 10) {
    const oldest = String(newVersion - 10);
    const oldSnap = await versionsRef.doc(oldest).get();
    if (oldSnap.exists) await versionsRef.doc(oldest).delete();
  }
}

export async function getToolData(
  uid: string,
  situationId: string,
  toolId: string
): Promise<{ data: unknown; generatedAt: string; version: number } | null> {
  const ref = toolDataRef(uid, situationId, toolId);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const doc = snap.data();
  if (!doc) return null;
  return {
    data: doc.data,
    generatedAt: doc.generatedAt as string,
    version: (doc.version as number) ?? 1,
  };
}

export async function getToolVersions(
  uid: string,
  situationId: string,
  toolId: string
): Promise<Array<{ version: number; generatedAt: string }>> {
  const versionsRef = toolVersionsRef(uid, situationId, toolId);
  const snap = await versionsRef.orderBy('version', 'desc').limit(10).get();
  return snap.docs.map(d => ({
    version: d.data().version as number,
    generatedAt: d.data().generatedAt as string,
  }));
}

export async function deleteToolData(
  uid: string,
  situationId: string,
  toolId: string
): Promise<void> {
  const ref = toolDataRef(uid, situationId, toolId);
  await ref.delete();
  // Note: version subcollection remains for audit purposes
}
```

- [ ] **Step 1.1.2: Commit**
```bash
git add src/lib/firebase/tool-data-service.ts
git commit -m "feat: tool output versioning — increment version on save, store last 10 versions in subcollection"
```

---

### Task 1.2: Stale Data Detection — `tool-registry.ts`

**Files:**
- Modify: `src/lib/constants/tool-registry.ts`
- Modify: `src/types/situation.ts` (add `staleAfterHours` to ToolDefinition)

Goal: Each tool declares its staleness threshold. Frontend shows "Stale" badge.

- [ ] **Step 1.2.1: Add `staleAfterHours` to ToolDefinition type**

Find the ToolDefinition interface in `src/types/situation.ts` and add:
```typescript
staleAfterHours?: number; // Hours after which tool output is considered stale
modelTier?: 'flash' | 'pro' | 'analysis'; // Model tier for this tool
```

- [ ] **Step 1.2.2: Add `staleAfterHours` to all tool entries in tool-registry.ts**

Staleness rules:
- 0-credit tools (dashboard, calendar, sources-library): 24h
- Daily tools (auto-briefings, alert-center): 24h
- Weekly tools (risk-monitor, early-warning, actor-profiles, stakeholder-map, power-map, info-environment, media-compass, media-roundup, timeline, humanitarian, compare): 168h (7 days)
- Monthly/deep tools (dossier, scenarios, game-theory, negotiation-prep, mediation-design, treaty-analyzer, deep-research, deep-search-agent, report-studio, commitments, sanctions): 720h (30 days)
- No expiry (documents, conflict-graph, assistant): undefined

- [ ] **Step 1.2.3: Commit**
```bash
git add src/lib/constants/tool-registry.ts src/types/situation.ts
git commit -m "feat: add staleAfterHours and modelTier to tool registry for cache staleness detection"
```

---

### Task 1.3: Stale Badge in `use-persisted-tool-data.ts`

**Files:**
- Modify: `src/hooks/use-persisted-tool-data.ts`

Goal: Return `isStale: boolean` computed from `generatedAt` vs tool's `staleAfterHours`.

- [ ] **Step 1.3.1: Add isStale to return type**

Add to the hook's return:
```typescript
isStale: boolean;
version: number;
```

Compute:
```typescript
const isStale = useMemo(() => {
  if (!generatedAt || !toolDef?.staleAfterHours) return false;
  const ageMs = Date.now() - new Date(generatedAt).getTime();
  return ageMs > toolDef.staleAfterHours * 60 * 60 * 1000;
}, [generatedAt, toolDef]);
```

- [ ] **Step 1.3.2: Commit**
```bash
git add src/hooks/use-persisted-tool-data.ts
git commit -m "feat: add isStale and version to usePersistedToolData hook"
```

---

### Task 1.4: Thinking Config for Complex Tools — `providers.ts`

**Files:**
- Modify: `src/lib/ai/providers.ts`

Goal: Add `getThinkingModel()` that enables extended thinking for scenario/game-theory/negotiation-prep/mediation-design tools.

- [ ] **Step 1.4.1: Add getThinkingModel export**

Add after `getProModel()`:
```typescript
/**
 * Thinking model — Gemini Pro with extended thinking budget.
 * Use for: scenarios, game-theory, negotiation-prep, mediation-design.
 */
export function getThinkingModel(): LanguageModel {
  if (process.env.GOOGLE_VERTEX_PROJECT && process.env.AI_PROVIDER === 'vertex') {
    const { createVertex } = require('@ai-sdk/google-vertex') as typeof import('@ai-sdk/google-vertex');
    return createVertex({
      project:  process.env.GOOGLE_VERTEX_PROJECT,
      location: process.env.GOOGLE_VERTEX_LOCATION || 'us-central1',
    })(MODEL_PRO, { thinkingConfig: { thinkingBudget: 8192, includeThoughts: false } });
  }
  const { createGoogleGenerativeAI } = require('@ai-sdk/google') as typeof import('@ai-sdk/google');
  return createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_API_KEY || '' })(
    MODEL_PRO,
    { thinkingConfig: { thinkingBudget: 8192, includeThoughts: false } }
  );
}
```

- [ ] **Step 1.4.2: Commit**
```bash
git add src/lib/ai/providers.ts
git commit -m "feat: add getThinkingModel() with 8192 token thinking budget for complex simulation tools"
```

---

### Task 1.5: Circuit Breaker Warning — `web-research.ts`

**Files:**
- Modify: `src/lib/ai/web-research.ts`

Goal: When all search providers fail, return a structured warning result instead of throwing. AI routes can inject a warning banner.

- [ ] **Step 1.5.1: Add SEARCH_FAILURE_SENTINEL export**

Add near top of web-research.ts:
```typescript
export const SEARCH_FAILURE_SENTINEL = '__SEARCH_FAILED__' as const;

export interface WebResearchSummary {
  results: WebResearchResult[];
  providers: SearchProvider[];
  failed: boolean;
  warningBanner?: string;
}
```

- [ ] **Step 1.5.2: Update executeWebResearch to return WebResearchSummary**

Wrap the existing return value so callers get `{ results, providers, failed, warningBanner }`. If all providers throw, return `{ results: [], providers: [], failed: true, warningBanner: '⚠️ Generated without live web data — results may reflect training data only.' }`.

- [ ] **Step 1.5.3: Commit**
```bash
git add src/lib/ai/web-research.ts
git commit -m "feat: web-research circuit breaker — return warning sentinel when all providers fail"
```

---

### Task 1.6: Web-Grounded Context Builder — `situation-context.ts`

**Files:**
- Modify: `src/lib/ai/situation-context.ts`

Goal: Add `buildWebGroundedContext(situation, toolId, uid)` that prepends live web research to any tool's system prompt.

- [ ] **Step 1.6.1: Add buildWebGroundedContext function**

```typescript
export async function buildWebGroundedContext(
  situation: { name: string; region?: string; actors?: string[]; description?: string },
  toolId: string,
  uid: string
): Promise<string> {
  const { executeWebResearch } = await import('@/lib/ai/web-research');
  const query = `${situation.name} ${situation.region ?? ''} latest developments intelligence`;
  const research = await executeWebResearch(query, situation.name, {
    toolId,
    actors: situation.actors,
    description: situation.description,
    maxResults: 8,
  }, uid);

  if (research.failed || research.results.length === 0) {
    return research.warningBanner
      ? `\n### Web Intelligence\n${research.warningBanner}\n`
      : '';
  }

  const citations = research.results
    .slice(0, 6)
    .map((r, i) => `[${i + 1}] ${r.title} — ${r.source} (${r.publishedDate ?? 'recent'})\n${r.snippet ?? r.content.slice(0, 200)}`)
    .join('\n\n');

  return `\n### Current Intelligence (Web-Grounded)\nThe following verified sources are your ground truth. Prioritize these over training data.\n\n${citations}\n`;
}
```

- [ ] **Step 1.6.2: Commit**
```bash
git add src/lib/ai/situation-context.ts
git commit -m "feat: buildWebGroundedContext — prepend live web research to any tool system prompt"
```

---

### Task 1.7: Cross-Tool Intelligence Sharing

**Files:**
- Modify: `src/lib/ai/situation-context.ts`

Goal: `buildToolContext` checks Firestore for recent outputs from `relatedTools[]` and injects summaries.

- [ ] **Step 1.7.1: Add cross-tool context injection**

In `buildToolContext`, after the existing context building, add:
```typescript
// Cross-tool intelligence: inject summaries from related tools
if (toolDef?.relatedTools?.length && uid && situationId) {
  const { getToolData } = await import('@/lib/firebase/tool-data-service');
  const relatedSummaries: string[] = [];
  for (const relatedId of toolDef.relatedTools.slice(0, 3)) {
    const related = await getToolData(uid, situationId, relatedId);
    if (related?.data) {
      const summary = typeof related.data === 'object'
        ? JSON.stringify(related.data).slice(0, 400)
        : String(related.data).slice(0, 400);
      relatedSummaries.push(`### Prior Analysis: ${relatedId}\n${summary}`);
    }
  }
  if (relatedSummaries.length > 0) {
    context += `\n\n${relatedSummaries.join('\n\n')}`;
  }
}
```

- [ ] **Step 1.7.2: Commit**
```bash
git add src/lib/ai/situation-context.ts
git commit -m "feat: cross-tool intelligence sharing — inject related tool outputs into tool context"
```

---

## Phase 2: Context Tools (§3)

### Task 2.1: Dashboard — Web-Grounded Snapshot + Tool Completeness

**Files:**
- Modify: `src/app/api/ai/risk-assessment/route.ts`
- Modify: `src/app/app/dashboard/page.tsx`

- [ ] **Step 2.1.1: Inject web-grounded context in risk-assessment route**

In `/api/ai/risk-assessment/route.ts`, after `buildToolContext`, add:
```typescript
const webCtx = await buildWebGroundedContext(
  { name: situation.name, region: situation.region, actors: situation.actors },
  'dashboard',
  uid
);
// Prepend webCtx to the system prompt
```

- [ ] **Step 2.1.2: Update AI prompt for dashboard per blueprint**

Replace/update the system prompt with the dashboard-specific prompt from blueprint §3.1.

- [ ] **Step 2.1.3: Add action recommendations to RiskAssessmentSchema**

Add to Zod schema:
```typescript
actionRecommendations: z.array(z.object({
  action: z.string(),
  urgency: z.enum(['immediate', 'short-term', 'medium-term']),
  linkedTool: z.string().optional(),
  rationale: z.string(),
})).optional(),
dataGaps: z.array(z.string()).optional(),
keyDevelopments: z.array(z.object({
  headline: z.string(),
  source: z.string(),
  date: z.string().optional(),
})).optional(),
```

- [ ] **Step 2.1.4: Commit**
```bash
git add src/app/api/ai/risk-assessment/route.ts
git commit -m "feat: dashboard — web-grounded risk snapshot with action recommendations and data gaps"
```

---

### Task 2.2: Timeline — Web-Sourced Events + Glasl Overlay

**Files:**
- Modify: `src/app/api/ai/risk-assessment/route.ts` (timeline mode)
- Note: Timeline shares the risk-assessment route, uses `mode` param

- [ ] **Step 2.2.1: Add timeline mode with web research**

When request body contains `mode: 'timeline'`, run targeted web searches:
```typescript
const timelineQueries = [
  `${situation.name} timeline key events 2020 2021 2022`,
  `${situation.name} timeline key events 2023 2024 2025`,
  `${situation.name} chronology major developments`,
];
```
Run these as separate executeWebResearch calls and merge results into context.

- [ ] **Step 2.2.2: Update timeline Zod schema**

Add to TimelineEventSchema:
```typescript
glaslStage: z.number().min(1).max(9).optional(),
eventType: z.enum(['military', 'diplomatic', 'humanitarian', 'political', 'protest', 'election']).optional(),
sourceUrl: z.string().optional(),
suggestedTools: z.array(z.string()).optional(),
```

- [ ] **Step 2.2.3: Commit**
```bash
git add src/app/api/ai/risk-assessment/route.ts
git commit -m "feat: timeline — web-sourced event population with Glasl stage and event type classification"
```

---

### Task 2.3: Documents — Entity Extraction Enhancement

**Files:**
- Modify: `src/app/api/documents/route.ts` (if exists) or relevant document handler

- [ ] **Step 2.3.1: Add auto-entity extraction on upload**

After text extraction, if document text > 500 chars, automatically run entity extraction:
```typescript
// Fire-and-forget entity extraction
extractEntities({ text: extractedText, situationId, uid }).catch(console.error);
```

- [ ] **Step 2.3.2: Add "Import from URL" support**

Add handler for `type: 'web-source'` in document creation. Use Firecrawl scrape endpoint to fetch clean markdown from URL, then run same entity extraction pipeline.

- [ ] **Step 2.3.3: Commit**
```bash
git commit -m "feat: documents — auto entity extraction on upload and URL import support"
```

---

## Phase 3: Analysis Tools (§4)

### Task 3.1: Risk Monitor — INFORM Methodology + Confidence Scoring

**Files:**
- Modify: `src/app/api/ai/risk-assessment/route.ts`

- [ ] **Step 3.1.1: Restructure RiskAssessmentSchema for INFORM 3-pillar**

Add INFORM pillars to schema:
```typescript
informPillars: z.object({
  hazardExposure: z.object({
    score: z.number().min(0).max(10),
    indicators: z.array(z.object({
      name: z.string(),
      score: z.number(),
      source: z.string(),
      confidence: z.enum(['high', 'medium', 'low']),
    })),
  }),
  vulnerability: z.object({
    score: z.number().min(0).max(10),
    indicators: z.array(z.object({
      name: z.string(),
      score: z.number(),
      source: z.string(),
      confidence: z.enum(['high', 'medium', 'low']),
    })),
  }),
  copingLack: z.object({
    score: z.number().min(0).max(10),
    indicators: z.array(z.object({
      name: z.string(),
      score: z.number(),
      source: z.string(),
      confidence: z.enum(['high', 'medium', 'low']),
    })),
  }),
  composite: z.number().min(0).max(10), // (H × V × C)^(1/3)
}).optional(),
sensitivityAnalysis: z.array(z.object({
  dimension: z.string(),
  currentScore: z.number(),
  impactIfHigher: z.number(),
  impactIfLower: z.number(),
})).optional(),
```

- [ ] **Step 3.1.2: Run 5 dimension-specific web searches**

For risk-monitor mode, run targeted searches per dimension:
```typescript
const dimensionQueries = [
  `${situation.name} armed conflict violence security incidents recent`,
  `${situation.region} socioeconomic poverty food insecurity vulnerability`,
  `${situation.region} governance corruption institutional capacity`,
  `${situation.name} political crisis instability recent`,
  `${situation.name} humanitarian access displacement refugees`,
];
```

- [ ] **Step 3.1.3: Update risk-monitor system prompt**

Replace with INFORM-methodology prompt from blueprint §4.1.

- [ ] **Step 3.1.4: Commit**
```bash
git commit -m "feat: risk-monitor — INFORM 3-pillar methodology, per-dimension web research, confidence scoring, sensitivity analysis"
```

---

### Task 3.2: Early Warning — Glasl Assessment + Leading Indicators

**Files:**
- Modify: `src/app/api/ai/escalation-scan/route.ts`

- [ ] **Step 3.2.1: Add leading indicators and de-escalation opportunities to schema**

```typescript
leadingIndicators: z.array(z.object({
  indicator: z.string(),
  status: z.enum(['present', 'emerging', 'absent']),
  source: z.string().optional(),
  timeToEscalation: z.string().optional(),
})),
deescalationOpportunities: z.array(z.object({
  window: z.string(),
  action: z.string(),
  actor: z.string(),
  probability: z.number().min(0).max(1),
  timeframe: z.string(),
})),
trajectoryScenarios: z.object({
  baseline: z.object({ description: z.string(), probability: z.number(), glaslIn90Days: z.number() }),
  optimistic: z.object({ description: z.string(), probability: z.number(), glaslIn90Days: z.number() }),
  pessimistic: z.object({ description: z.string(), probability: z.number(), glaslIn90Days: z.number() }),
}),
```

- [ ] **Step 3.2.2: Run escalation-specific web searches**

```typescript
const escalationQueries = [
  `${situation.name} escalation indicators violence today`,
  `${situation.name} diplomatic breakdown negotiations`,
  `${situation.name} troop mobilization military activity`,
  `${situation.name} ceasefire violations latest`,
];
```

- [ ] **Step 3.2.3: Auto-create alert if Glasl ≥ 6**

After generation, check `if (result.glaslStage >= 6)` and POST to `/api/ai/alert-center` with severity HIGH.

- [ ] **Step 3.2.4: Commit**
```bash
git commit -m "feat: early-warning — leading indicators, de-escalation opportunities, trajectory scenarios, auto-alert at Glasl ≥6"
```

---

### Task 3.3: Actor Profiles — Deep Web Research + Stedman/Fisher-Ury/MAW

**Files:**
- Modify: `src/app/api/ai/actor-profiles/route.ts`

- [ ] **Step 3.3.1: Run 4 web searches per actor**

```typescript
for (const actor of situation.actors ?? []) {
  const actorQueries = [
    `${actor} leadership structure organization profile`,
    `${actor} military capabilities resources funding`,
    `${actor} stated position demands ${situation.name}`,
    `${actor} alliances external support patrons`,
  ];
  // Run in parallel, inject into per-actor context block
}
```

- [ ] **Step 3.3.2: Add Stedman/Fisher-Ury/MAW to schema**

```typescript
spoilerClassification: z.enum(['total', 'limited', 'greedy', 'non-spoiler']),
spoilerEvidence: z.string(),
statedPositions: z.array(z.string()),
underlyingInterests: z.array(z.string()),
mawScores: z.object({
  power: z.number().min(1).max(10),
  legitimacy: z.number().min(1).max(10),
  urgency: z.number().min(1).max(10),
  stakeholderType: z.enum(['dormant', 'discretionary', 'demanding', 'dominant', 'dangerous', 'dependent', 'definitive']),
}),
```

- [ ] **Step 3.3.3: Add actor relationship matrix**

```typescript
relationshipMatrix: z.array(z.object({
  actorA: z.string(),
  actorB: z.string(),
  relationship: z.enum(['ally', 'adversary', 'neutral', 'competitor', 'patron-client']),
  strength: z.number().min(1).max(5),
  basis: z.string(),
})).optional(),
```

- [ ] **Step 3.3.4: Commit**
```bash
git commit -m "feat: actor-profiles — per-actor web research, Stedman spoiler classification, Fisher-Ury interests, MAW salience scoring"
```

---

### Task 3.4: Power Map — Barnett-Duvall Four Faces + Leverage Mapping

**Files:**
- Modify: `src/app/api/ai/power-map/route.ts`

- [ ] **Step 3.4.1: Add Barnett-Duvall four faces to schema**

```typescript
powerFaces: z.object({
  compulsory: z.object({ score: z.number(), description: z.string() }),
  institutional: z.object({ score: z.number(), description: z.string() }),
  structural: z.object({ score: z.number(), description: z.string() }),
  productive: z.object({ score: z.number(), description: z.string() }),
}).optional(),
leverageMap: z.array(z.object({
  from: z.string(),
  to: z.string(),
  type: z.enum(['economic', 'military', 'diplomatic', 'informational']),
  description: z.string(),
  strength: z.number().min(1).max(5),
})).optional(),
powerAsymmetry: z.array(z.object({
  actorA: z.string(),
  actorB: z.string(),
  ratio: z.number(),
  implication: z.string(),
})).optional(),
```

- [ ] **Step 3.4.2: Commit**
```bash
git commit -m "feat: power-map — Barnett-Duvall four faces of power, leverage mapping, asymmetry index"
```

---

### Task 3.5: Info Environment — Narrative Mapping + 4D Framework

**Files:**
- Modify: `src/app/api/ai/info-environment/route.ts`

- [ ] **Step 3.5.1: Run 5+ multi-perspective searches**

```typescript
const narrativeQueries = [
  `${situation.name} western media coverage framing`,
  `${situation.name} regional media narrative analysis`,
  `${situation.name} state media propaganda messaging`,
  `${situation.name} disinformation misinformation spread`,
  `${situation.name} think tank analysis information environment`,
];
```

- [ ] **Step 3.5.2: Add 4D framework and narrative evolution to schema**

```typescript
narratives: z.array(z.object({
  name: z.string(),
  description: z.string(),
  source: z.string(),
  targetAudience: z.string(),
  fourDClassification: z.enum(['dismiss', 'distort', 'distract', 'dismay']).optional(),
  originator: z.string().optional(),
  amplificationChannels: z.array(z.string()).optional(),
  strategicObjective: z.string().optional(),
})),
counterNarrativeOpportunities: z.array(z.object({
  gap: z.string(),
  suggestedStrategy: z.string(),
  targetAudience: z.string(),
})).optional(),
```

- [ ] **Step 3.5.3: Commit**
```bash
git commit -m "feat: info-environment — multi-perspective narrative mapping, Ben Nimmo 4D framework, counter-narrative opportunities"
```

---

## Phase 4: Drafting Tools (§5)

### Task 4.1: Add Policy Memo to Tool Registry

**Files:**
- Modify: `src/lib/constants/tool-registry.ts`

- [ ] **Step 4.1.1: Add policy-memo ToolDefinition entry**

```typescript
{
  id: 'policy-memo',
  name: 'Policy Memo',
  category: 'drafting',
  description: 'Structured policy options analysis using Putnam Two-Level Game Theory. Generates 3-4 policy options with SWOT analysis, feasibility ratings, and win-set computation considering both domestic and international constraints.',
  shortDescription: 'Policy options with Putnam two-level analysis and SWOT',
  credits: 3,
  icon: 'FileCheck',
  aiRoute: '/api/ai/policy-memo',
  dataSchema: 'PolicyMemoSchema',
  requiredSituationFields: ['name', 'region', 'actors', 'description'],
  outputType: 'structured',
  frameworks: ['Putnam Two-Level Game Theory'],
  dataSources: ['Google Search Grounding', 'Tavily'],
  relatedTools: ['negotiation-prep', 'talking-points', 'report-studio'],
  staleAfterHours: 720,
  modelTier: 'pro',
  methodology: 'Policy options are analyzed through Putnam\'s Two-Level Game framework: Level I (international negotiation space — what counterparts will accept) and Level II (domestic politics — what is ratifiable and implementable). For each option, a "win-set" is computed representing the overlap between what is internationally achievable and domestically sustainable. Historical precedents are retrieved via web search to ground each option in empirical evidence.',
},
```

- [ ] **Step 4.1.2: Commit**
```bash
git add src/lib/constants/tool-registry.ts
git commit -m "feat: register policy-memo tool with Putnam two-level game framework"
```

---

### Task 4.2: Enhance Policy Memo Route — Putnam + SWOT + Decision Matrix

**Files:**
- Modify: `src/app/api/ai/policy-memo/route.ts`

- [ ] **Step 4.2.1: Update PolicyMemoSchema with Putnam analysis**

```typescript
const PolicyOptionSchema = z.object({
  title: z.string(),
  description: z.string(),
  levelOneAnalysis: z.string(), // International negotiation space
  levelTwoAnalysis: z.string(), // Domestic political constraints
  winSet: z.string(), // Overlap description
  swot: z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    opportunities: z.array(z.string()),
    threats: z.array(z.string()),
  }),
  feasibility: z.number().min(1).max(5),
  risk: z.number().min(1).max(5),
  timeline: z.string(),
  requiredResources: z.array(z.string()),
  keyActors: z.array(z.string()),
  historicalPrecedent: z.string().optional(),
});

const PolicyMemoSchema = z.object({
  title: z.string(),
  executiveSummary: z.string(),
  situationAssessment: z.string(),
  options: z.array(PolicyOptionSchema).min(3).max(4),
  recommendedOption: z.string(),
  implementationRoadmap: z.string(),
  risks: z.array(z.string()),
  citations: z.array(z.string()),
});
```

- [ ] **Step 4.2.2: Run web research for each policy type**

```typescript
const policyQueries = [
  `${situation.name} policy options recommendations international community`,
  `${situation.name} peace negotiations framework options`,
  `similar conflict ${situation.type} policy memo recommendations precedent`,
];
```

- [ ] **Step 4.2.3: Update system prompt**

Use the Putnam Two-Level Game prompt from blueprint §5.7.

- [ ] **Step 4.2.4: Commit**
```bash
git commit -m "feat: policy-memo — Putnam two-level game analysis, SWOT per option, decision matrix, web-grounded precedents"
```

---

### Task 4.3: Report Studio — Cross-Tool Data Injection + Template Library

**Files:**
- Modify: `src/app/api/ai/report/route.ts`

- [ ] **Step 4.3.1: Add template selection to report route**

Add `template` field to request body:
```typescript
const REPORT_TEMPLATES = {
  'un-dppa': { sections: ['executive-summary', 'background', 'political-analysis', 'security', 'humanitarian', 'recommendations'], audience: 'UN Political Affairs Officers', tone: 'diplomatic' },
  'ocha-snapshot': { sections: ['key-figures', 'situation-overview', 'access', 'protection', 'response', 'funding'], audience: 'Humanitarian Coordinators', tone: 'factual' },
  'unsc-briefing': { sections: ['bluf', 'situation-assessment', 'key-developments', 'international-response', 'recommendations'], audience: 'UNSC Members', tone: 'concise' },
  'policy-brief': { sections: ['summary', 'background', 'analysis', 'options', 'recommendations'], audience: 'Policymakers', tone: 'analytical' },
  'donor-report': { sections: ['executive-summary', 'context', 'program-update', 'impact', 'risks', 'outlook'], audience: 'Donors', tone: 'results-oriented' },
} as const;
```

- [ ] **Step 4.3.2: Inject related tool outputs into report context**

Before generation, fetch from Firestore:
```typescript
const toolOutputsForReport = ['risk-monitor', 'early-warning', 'actor-profiles', 'humanitarian', 'timeline'];
const toolContext = await Promise.all(
  toolOutputsForReport.map(id => getToolData(uid, situationId, id))
);
// Inject non-null results as structured context blocks
```

- [ ] **Step 4.3.3: Add citations array to ReportSchema**

```typescript
citations: z.array(z.object({
  id: z.number(),
  title: z.string(),
  source: z.string(),
  url: z.string().optional(),
  date: z.string().optional(),
})).optional(),
```

- [ ] **Step 4.3.4: Commit**
```bash
git commit -m "feat: report-studio — template library (UN DPPA, OCHA, UNSC, policy brief, donor), cross-tool data injection, citation management"
```

---

### Task 4.4: Talking Points — Audience Selector + Q&A Prep

**Files:**
- Modify: `src/app/api/ai/talking-points/route.ts`

- [ ] **Step 4.4.1: Add audience and Q&A to schema**

```typescript
const TalkingPointsSchema = z.object({
  audience: z.string(),
  keyMessages: z.array(z.string()),
  talkingPoints: z.array(z.object({
    point: z.string(),
    sharedInterest: z.string(),
    concession: z.string().optional(),
    bridgeToCommonGround: z.string(),
  })),
  anticipatedQuestions: z.array(z.object({
    question: z.string(),
    stakeholder: z.string(),
    recommendedResponse: z.string(),
  })),
  toneGuidance: z.string(),
});
```

- [ ] **Step 4.4.2: Commit**
```bash
git commit -m "feat: talking-points — audience-specific generation, Fisher-Ury interest framing, adversarial Q&A prep"
```

---

### Task 4.5: Daily Brief — Harden Cron + Deep Research Mode

**Files:**
- Modify: `src/app/api/cron/generate-briefing/route.ts`

- [ ] **Step 4.5.1: Add retry logic with exponential backoff**

Wrap the generation call with:
```typescript
async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      await new Promise(r => setTimeout(r, attempt * 5000));
    }
  }
  throw new Error('unreachable');
}
```

- [ ] **Step 4.5.2: Add BLUF field to auto-briefing schema**

```typescript
bluf: z.string(), // Bottom-line-up-front: single paragraph
icdConfidenceLanguage: z.boolean().default(true), // Use ICD 203 probability terms
```

- [ ] **Step 4.5.3: Commit**
```bash
git commit -m "feat: daily-brief — retry logic (3 attempts, 5s backoff), BLUF field, ICD 203 confidence language"
```

---

### Task 4.6: UN Toolkit — Diplomatic Tone Editor + Resolution Drafter

**Files:**
- Modify: `src/app/api/ai/terminology/route.ts`

- [ ] **Step 4.6.1: Add diplomatic tone editing mode**

When request body contains `mode: 'tone-edit'` and `inputText`, generate diplomatically edited version:
- Passive voice transformation
- Hedging language insertion
- British spelling
- UN register vocabulary

- [ ] **Step 4.6.2: Add resolution drafting mode**

When `mode: 'resolution'`, generate preambular + operative clauses:
```typescript
const ResolutionSchema = z.object({
  preambularClauses: z.array(z.object({ verb: z.string(), text: z.string() })),
  operativeClauses: z.array(z.object({ verb: z.string(), text: z.string(), paragraph: z.number() })),
  notes: z.string().optional(),
});
```

- [ ] **Step 4.6.3: Commit**
```bash
git commit -m "feat: un-toolkit — diplomatic tone editor mode, resolution drafter with preambular/operative clauses"
```

---

### Task 4.7: Briefing Room — BLUF + ICD 203 + Speaker Notes

**Files:**
- Modify: `src/app/api/ai/briefing-generate/route.ts`

- [ ] **Step 4.7.1: Update BriefingSchema with BLUF and speaker notes**

```typescript
const BriefingSchema = z.object({
  title: z.string(),
  bluf: z.string(), // Single paragraph, bottom-line-up-front
  sections: z.array(z.object({
    heading: z.string(),
    content: z.string(),
    speakerNotes: z.string(),
    anticipatedQuestions: z.array(z.string()).optional(),
  })),
  keyJudgments: z.array(z.object({
    judgment: z.string(),
    confidence: z.enum(['almost no chance', 'very unlikely', 'unlikely', 'roughly even', 'likely', 'very likely', 'almost certain']),
    evidence: z.string(),
  })),
  lastUpdated: z.string(),
});
```

- [ ] **Step 4.7.2: Update system prompt to use ICD 203 confidence language**

Add to system prompt: "You MUST use ICD 203 Analytic Standards probability language: 'almost no chance' (<5%), 'very unlikely' (5-20%), 'unlikely' (20-45%), 'roughly even' (45-55%), 'likely' (55-80%), 'very likely' (80-95%), 'almost certain' (>95%). Never use vague hedging like 'may' or 'could'."

- [ ] **Step 4.7.3: Run 48-hour focused web search**

```typescript
const briefingQuery = `${situation.name} news developments past 48 hours latest`;
const webCtx = await buildWebGroundedContext(...);
```

- [ ] **Step 4.7.4: Commit**
```bash
git commit -m "feat: briefing-room — BLUF, ICD 203 confidence language, speaker notes, 48h web-grounded research"
```

---

## Phase 5: Simulation Tools (§6) — Thinking Model Integration

### Task 5.1: Apply Thinking Model to Complex Simulation Tools

**Files:**
- Modify: `src/app/api/ai/scenario/route.ts`
- Modify: `src/app/api/ai/game-theory/route.ts`
- Modify: `src/app/api/ai/negotiation/route.ts`
- Modify: `src/app/api/ai/mediation-design/route.ts`

- [ ] **Step 5.1.1: Replace getProModel() with getThinkingModel() in simulation routes**

In each of the 4 simulation routes, change:
```typescript
// Before:
const model = getProModel();
// After:
const model = getThinkingModel(); // Extended thinking for complex reasoning
```

- [ ] **Step 5.1.2: Commit**
```bash
git commit -m "feat: simulation tools — use extended thinking model (8192 token budget) for scenarios, game-theory, negotiation, mediation"
```

---

## Phase 6: Intelligence Tools — Deep Research Enhancements (§7)

### Task 6.1: Actor Profiles — Deduplicate (applies to §4.3 above)

Already covered in Phase 3, Task 3.3.

### Task 6.2: ARGUS — Multi-Source Alert Intelligence

**Files:**
- Modify: `src/app/api/ai/argus/route.ts`

- [ ] **Step 6.2.1: Run ARGUS-specific web searches**

```typescript
const argusQueries = [
  `${situation.name} security incident alert warning today`,
  `${situation.name} military movement deployment recent`,
  `${situation.name} humanitarian emergency alert`,
  `${situation.name} political crisis escalation warning`,
];
```

- [ ] **Step 6.2.2: Add alert severity scoring**

Add to schema: `severity: z.enum(['critical', 'high', 'medium', 'low'])` per alert.

- [ ] **Step 6.2.3: Commit**
```bash
git commit -m "feat: argus — multi-source alert intelligence with severity scoring and targeted web searches"
```

---

## Final Validation

- [ ] **TypeScript check**: `npx tsc --noEmit`
- [ ] **Review all 40 AI routes** for web research usage
- [ ] **Deploy to Cloud Run** via `./infrastructure/deploy.sh`
- [ ] **Smoke test** each modified tool in production
- [ ] **Audit commit log** for completeness

---

## Implementation Notes

1. **API route pattern (NEVER change):** All routes use `generateText + Output.object({schema})` per AI SDK v6. Never switch to `generateObject`.
2. **Auth pattern:** All protected routes wrap with `withAuth()` from `src/lib/api/with-auth.ts`.
3. **Credit pattern:** All AI-generating routes call `checkAndDeductCredits()` before AI call.
4. **Context pattern:** Always call `buildToolContext()` then optionally `buildWebGroundedContext()` before AI call.
5. **Persistence pattern:** Use `writeToolDataServer()` for server-side saves, not direct Firestore calls.
