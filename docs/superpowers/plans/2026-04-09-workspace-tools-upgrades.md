# PRAXIS Group 9 — Workspace Tool Upgrades

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade Workspace tools (§8) — Cases, Advisory Council, Source Monitor, and Settings — per the PRAXIS Master Improvement Blueprint v1.0.

**Architecture:** Advisory gets web-grounded personas injected at prompt start and a devil's advocacy multi-advisor mode. Source Monitor gets registered in tool-registry and gets a functional API route for automated tracking. Settings gets API key validation endpoints. Cases gets an expanded static database. All changes follow the established `generateText + Output.object` / `streamText` pattern. No new dependencies.

**Tech Stack:** Next.js 16 App Router · AI SDK v6 · Zod · Gemini 2.5 Flash/Pro · `searchWeb`, `scrapeUrl` from `@/lib/ai/firecrawl` · `withAuth` · `checkAndDeductCredits` · Firestore via `@/lib/firebase/firestore.ts`

---

## Files to Create or Modify

| File | Action | What Changes |
|------|--------|--------------|
| `src/app/api/ai/advisor-chat/route.ts` | Modify | Add web-grounded intelligence injection per persona; add `panelSummary` action; add `devilsAdvocacy` mode |
| `src/app/api/ai/media-scan/route.ts` | Modify | Rebuild as Source Monitor: automated source tracking + publication alerts |
| `src/lib/constants/tool-registry.ts` | Modify | Add `source-monitor` ToolDefinition entry |
| `src/app/api/settings/validate-key/route.ts` | Create | API key validation endpoint (test Tavily, Firecrawl, Anthropic keys) |
| `src/app/app/settings/page.tsx` | Modify | Add API key validation feedback UI; add tool visibility selector state |
| `src/app/app/cases/page.tsx` | Modify | Expand static case database to 20+ cases; add "Compare with my situation" button |

---

## Task 1: Register source-monitor in tool-registry.ts

**Files:**
- Modify: `src/lib/constants/tool-registry.ts`

The `source-monitor` page exists at `src/app/app/source-monitor/page.tsx` but is not in the tool registry (flagged as a gap in §8.3 of the Blueprint).

- [ ] **Step 1: Read the current end of tool-registry.ts**

Use Read on `src/lib/constants/tool-registry.ts` to find the last entry and the closing `]`. Note the pattern used by similar intelligence tools.

- [ ] **Step 2: Add the source-monitor ToolDefinition**

In `src/lib/constants/tool-registry.ts`, before the closing `];`, add:

```typescript
{
  id: 'source-monitor',
  name: 'Source Monitor',
  category: 'intelligence',
  description: 'Automated monitoring of user-tracked intelligence sources. Tracks think tanks, academic journals, and news organizations for new publications relevant to your situation. Applies CRAAP source evaluation and delivers new publication alerts.',
  shortDescription: 'Track sources for new publications on your situation',
  credits: 2,
  icon: 'Radar',
  aiRoute: '/api/ai/media-scan',
  dataSchema: 'SourceMonitorSchema',
  requiredSituationFields: ['name', 'region'],
  outputType: 'structured',
  frameworks: ['CRAAP Test (Currency, Relevance, Authority, Accuracy, Purpose)'],
  dataSources: ['Firecrawl', 'User-defined sources'],
  relatedTools: ['sources-library', 'media-roundup', 'argus'],
  methodology: 'Source monitoring applies a weekly automated scan of user-tracked sources using Firecrawl web search. Each new publication is scored using the CRAAP test and relevance to the active situation. High-relevance publications from credible sources (reliability ≥ 7.0) generate alerts. The source health dashboard tracks scan timestamps, coverage density, and recommended additions.',
},
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd "C:/Users/giuli/ANTIGRAVITY/A4_PRAXIS_CLOUD_TACITUS/A4_PRAXIS_CLOUD_Work"
npx tsc --noEmit 2>&1 | head -20
```

Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/constants/tool-registry.ts
git commit -m "feat(tool-registry): register source-monitor as intelligence tool (gap fix §8.3)"
```

---

## Task 2: Upgrade advisor-chat/route.ts — Web-Grounded Personas + Panel Summary + Devil's Advocacy

**Files:**
- Modify: `src/app/api/ai/advisor-chat/route.ts`

The route already has 10 expert personas with the `webSearch` AI tool. Add: (1) proactive web intelligence injection per persona before the conversation, (2) `panelSummary` action, (3) `devilsAdvocacy` mode.

- [ ] **Step 1: Add persona-specific web search query mapping**

After the `ADVISOR_PERSONAS` constant, add:

```typescript
// Each persona searches for current intelligence relevant to their domain
const PERSONA_WEB_QUERIES: Record<string, (sitName: string, region: string, year: number) => string[]> = {
  okafor: (s, r, y) => [`${s} ${r} conflict risk assessment ${y}`, `${s} ACLED violence events ${y}`],
  tanaka: (s, _r, y) => [`${s} diplomatic negotiations UN Security Council ${y}`, `${s} UNSC resolution mediation ${y}`],
  mitchell: (s, _r, y) => [`${s} military operations ceasefire violations ${y}`, `${s} armed forces security situation ${y}`],
  hassan: (s, _r, y) => [`${s} international law ICC accountability ${y}`, `${s} IHL violations war crimes ${y}`],
  ferreira: (s, _r, y) => [`${s} media narrative disinformation propaganda ${y}`, `${s} information operations framing ${y}`],
  sharma: (s, r, y) => [`${s} ${r} humanitarian crisis OCHA ${y}`, `${s} displacement food insecurity ${y}`],
  eriksen: (s, _r, y) => [`${s} economy sanctions financial flows ${y}`, `${s} resource conflict financing ${y}`],
  'al-rashid': (s, _r, y) => [`${s} mediation peace process AU UN ${y}`, `${s} peace talks agreement ${y}`],
  nakamura: (s, _r, y) => [`${s} women peace security UNSCR 1325 ${y}`, `${s} gender violence conflict ${y}`],
  mensah: (s, _r, y) => [`${s} transitional justice accountability truth commission ${y}`, `${s} reconciliation reparations ${y}`],
};
```

- [ ] **Step 2: Add web intelligence injection for regular advisor calls**

Inside the POST handler, after the `persona` lookup and before the `systemPrompt` construction, add:

```typescript
// --- Proactive web intelligence per persona ---
let liveIntelligence = '';
if (situation && advisorId && PERSONA_WEB_QUERIES[advisorId]) {
  try {
    const sit = situation as Situation;
    const year = new Date().getFullYear();
    const queries = PERSONA_WEB_QUERIES[advisorId](sit.name, sit.region || '', year);
    const results = await Promise.allSettled(queries.map((q) => searchWeb(q, { numResults: 3 })));
    const allResults = results
      .filter((r): r is PromiseFulfilledResult<WebSearchResult[]> => r.status === 'fulfilled')
      .flatMap((r) => r.value);
    if (allResults.length > 0) {
      liveIntelligence = `\n\n### Current Web Intelligence for ${advisorId} (${new Date().toISOString().split('T')[0]})\n${formatResultsAsContext(allResults.slice(0, 6))}\n\n[GROUNDING MANDATE] The web intelligence above is your PRIMARY source for current events. Cite sources when using this information. Explicitly note "INTELLIGENCE GAP: [topic]" if current web data is insufficient for a specific question.`;
    }
  } catch { /* non-blocking */ }
}
```

Add imports: `import { searchWeb, formatResultsAsContext } from '@/lib/ai/firecrawl'; import type { WebSearchResult } from '@/lib/ai/firecrawl';`

- [ ] **Step 3: Inject `liveIntelligence` into the system prompt**

Update the `systemPrompt` construction:

```typescript
const systemPrompt = `${persona}${liveIntelligence}

You are operating within PRAXIS...`
```

- [ ] **Step 4: Add `panelSummary` action**

Read the request body to detect `action`:

```typescript
const { messages, advisorId, deepAnalysis, situation, action } = await request.json();
```

Add a `panelSummary` action before the existing advisor check:

```typescript
// --- Panel Summary action ---
if (action === 'panelSummary') {
  const { advisorResponses } = await request.json() as {
    advisorResponses: Array<{ advisorId: string; advisorName: string; response: string }>;
    situation?: Situation;
  };
  // Note: request.json() was already called above — the advisorResponses come from body
  // Restructure: parse all fields from body directly at the top of handler
}
```

**Better approach** — read all fields at once at the top of the POST handler:

```typescript
const body = await request.json();
const {
  messages,
  advisorId,
  deepAnalysis,
  situation,
  action,
  advisorResponses,
} = body as {
  messages?: unknown[];
  advisorId?: string;
  deepAnalysis?: boolean;
  situation?: Situation;
  action?: 'chat' | 'panelSummary' | 'devilsAdvocacy';
  advisorResponses?: Array<{ advisorName: string; response: string }>;
};
```

Then add the panelSummary handler:

```typescript
if (action === 'panelSummary' && advisorResponses) {
  const creditCheck = await checkAndDeductCredits('ai_advisor_chat', 'Advisory panel summary');
  if (!creditCheck.allowed) return creditCheck.response;

  const sitCtx = situation ? buildToolContext(situation as unknown as Situation) : '';
  const responsesText = advisorResponses
    .map((r) => `### ${r.advisorName}\n${r.response}`)
    .join('\n\n---\n\n');

  const result = streamText({
    model: getProModel(),
    system: `You are a senior synthesis analyst for PRAXIS. Synthesize multiple expert advisor inputs into a coherent policy brief. Identify consensus, contested areas, and minority views. Be concise and actionable. ${sitCtx}`,
    prompt: `Synthesize the following expert advisor inputs into a structured advisory panel brief:

${responsesText}

Structure your synthesis as:
## Key Recommendations (Consensus)
Areas where all or most advisors agree on recommended action.

## Contested Areas
Specific points of disagreement between advisors, with the range of views represented.

## Minority Views
Important perspectives held by 1-2 advisors that the group should consider.

## Priority Actions (Next 30 Days)
The 3 most time-sensitive actions recommended by the panel, based on majority view.

Be specific. Reference advisors by name when attributing views.`,
  });

  return result.toTextStreamResponse();
}
```

- [ ] **Step 5: Add `devilsAdvocacy` mode**

Add after the `panelSummary` handler:

```typescript
if (action === 'devilsAdvocacy' && advisorId) {
  // Devil's advocacy: the named advisor challenges the consensus with counterarguments
  const persona = ADVISOR_PERSONAS[advisorId];
  if (!persona) return new Response(JSON.stringify({ error: 'Unknown advisor' }), { status: 400 });

  const creditCheck = await checkAndDeductCredits('ai_advisor_chat', 'Devil\'s advocacy analysis');
  if (!creditCheck.allowed) return creditCheck.response;

  const sitCtx = situation ? buildToolContext(situation as Situation) : '';
  const userQuestion = Array.isArray(messages) && messages.length > 0
    ? (messages[messages.length - 1] as { content: string }).content
    : 'the current situation';

  const result = streamText({
    model: getProModel(),
    system: `${persona}\n\nYou are operating in DEVIL'S ADVOCATE mode. Your job is to vigorously challenge the conventional wisdom and surface uncomfortable counterarguments. You believe the dominant analysis is missing something important. Challenge assumptions, highlight evidence that cuts against the consensus, and propose alternative interpretations — even if they make people uncomfortable. Be specific, evidence-based, and constructive in your contrarianism. ${sitCtx}`,
    messages: messages as Parameters<typeof streamText>[0]['messages'],
    tools: { webSearch },
    stopWhen: stepCountIs(1),
  });

  return result.toTextStreamResponse();
}
```

- [ ] **Step 6: Update `maxDuration` to 90s (web research adds latency)**

Change: `export const maxDuration = 90;`

- [ ] **Step 7: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 8: Commit**

```bash
git add src/app/api/ai/advisor-chat/route.ts
git commit -m "feat(advisory): web-grounded personas + panel summary + devil's advocacy mode"
```

---

## Task 3: Rebuild media-scan/route.ts as Source Monitor

**Files:**
- Modify: `src/app/api/ai/media-scan/route.ts`

The `media-scan` route is the backing route for Source Monitor (`/api/ai/media-scan`). Currently minimal. Rebuild as a full source monitoring and publication alert engine.

- [ ] **Step 1: Read the current media-scan/route.ts**

Use Read on `src/app/api/ai/media-scan/route.ts` to understand the current state before modifying.

- [ ] **Step 2: Define SourceMonitorSchema**

Replace the file contents with:

```typescript
import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getProModel } from '@/lib/ai/providers';
import { buildToolContext } from '@/lib/ai/situation-context';
import { withAuth } from '@/lib/api/with-auth';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { handleRouteError } from '@/lib/api/standard-error';
import { searchWeb, formatResultsAsContext } from '@/lib/ai/firecrawl';
import type { WebSearchResult } from '@/lib/ai/firecrawl';
import type { Situation } from '@/types/situation';

export const maxDuration = 120;

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const PublicationAlertSchema = z.object({
  sourceUrl: z.string().describe('Domain or URL of the source'),
  sourceName: z.string().describe('Human-readable name of the source'),
  publicationTitle: z.string().describe('Title of the new publication'),
  publicationUrl: z.string().describe('Direct URL to the publication'),
  publishedDate: z.string().optional().describe('Publication date if extractable'),
  summary: z.string().describe('2-sentence AI summary of the publication'),
  relevanceScore: z.number().min(0).max(10).describe('Relevance to the active situation (0 to 10)'),
  sourceReliability: z.number().min(0).max(10).describe('Source reliability rating (0 to 10)'),
  craapRating: z.enum(['high', 'medium', 'low']).describe('CRAAP evaluation: high(>15/25), medium(10 to 15), low(<10)'),
  alertPriority: z.enum(['critical', 'high', 'medium', 'low']).describe('Alert priority based on relevance × reliability'),
});

const SourceMonitorSchema = z.object({
  monitoredSources: z.number().describe('Number of sources scanned in this run'),
  newPublications: z.array(PublicationAlertSchema).describe('New publications found since last scan'),
  coverageGaps: z.array(z.object({
    topic: z.string().describe('Topic with insufficient coverage'),
    recommendedSources: z.array(z.string()).describe('Sources that should cover this but were not found'),
  })).describe('Important topics with limited coverage from tracked sources'),
  sourceHealthSummary: z.array(z.object({
    sourceName: z.string(),
    domain: z.string(),
    lastActivity: z.string().describe('Most recent publication found'),
    publicationCount: z.number().describe('Publications found in this scan'),
    averageRelevance: z.number().min(0).max(10),
  })).describe('Health summary per monitored source'),
  recommendedNewSources: z.array(z.string()).describe('Sources not currently tracked but publishing relevant content'),
  scanTimestamp: z.string().describe('ISO timestamp of this scan'),
});

// ---------------------------------------------------------------------------
// Default source list (used when user has no custom sources configured)
// ---------------------------------------------------------------------------

const DEFAULT_MONITORED_SOURCES = [
  { name: 'International Crisis Group', domain: 'crisisgroup.org', reliability: 9.5 },
  { name: 'ReliefWeb', domain: 'reliefweb.int', reliability: 9.0 },
  { name: 'Human Rights Watch', domain: 'hrw.org', reliability: 8.5 },
  { name: 'Amnesty International', domain: 'amnesty.org', reliability: 8.0 },
  { name: 'UN News', domain: 'news.un.org', reliability: 8.5 },
  { name: 'ACLED', domain: 'acleddata.com', reliability: 9.5 },
  { name: 'SIPRI', domain: 'sipri.org', reliability: 9.0 },
  { name: 'Chatham House', domain: 'chathamhouse.org', reliability: 8.5 },
  { name: 'Foreign Policy', domain: 'foreignpolicy.com', reliability: 7.5 },
  { name: 'IISS', domain: 'iiss.org', reliability: 8.5 },
];

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export const POST = withAuth(async (request, _user) => {
  try {
    const body = await request.json() as {
      situation?: Situation;
      customSources?: Array<{ name: string; domain: string; reliability?: number }>;
      action?: 'scan' | 'health';
    };
    const { situation, customSources, action = 'scan' } = body;

    const creditCheck = await checkAndDeductCredits('ai_media_scan', 'Source monitor scan');
    if (!creditCheck.allowed) return creditCheck.response;

    const sitCtx = situation ? buildToolContext(situation) : '';
    const sitName = situation?.name || 'the situation';
    const year = new Date().getFullYear();

    const sources = customSources && customSources.length > 0
      ? customSources
      : DEFAULT_MONITORED_SOURCES;

    // --- Scan all sources in parallel ---
    const scanResults = await Promise.allSettled(
      sources.map(async (source) => {
        const query = `site:${source.domain} ${sitName} ${year}`;
        const results = await searchWeb(query, { numResults: 3 });
        return { source, results };
      })
    );

    const allFindings: Array<{ source: typeof sources[0]; results: WebSearchResult[] }> = scanResults
      .filter((r): r is PromiseFulfilledResult<{ source: typeof sources[0]; results: WebSearchResult[] }> =>
        r.status === 'fulfilled'
      )
      .map((r) => r.value);

    // Build context for AI synthesis
    const findingsText = allFindings.map(({ source, results }) =>
      `### ${source.name} (${source.domain}) — reliability: ${source.reliability ?? 7}/10\n` +
      (results.length > 0
        ? results.map((r) =>
            `- **${r.title}** | ${r.publishedDate || 'date unknown'}\n  ${r.description?.slice(0, 200) || ''}\n  URL: ${r.url}`
          ).join('\n')
        : '- No new publications found')
    ).join('\n\n');

    // --- AI synthesis ---
    const result = await generateText({
      model: getProModel(),
      output: Output.object({ schema: SourceMonitorSchema }),
      prompt: `${sitCtx ? `${sitCtx}\n\n` : ''}You are the PRAXIS Source Monitor. Analyze the following publications found across ${sources.length} monitored sources for the situation "${sitName}".

SCAN RESULTS:
${findingsText}

For each publication found:
1. Assess relevance (0 to 10): How directly does this address "${sitName}"? 10 = exclusively about this situation, 1 = tangentially related
2. Apply CRAAP evaluation: Currency (is it recent?), Relevance (to situation?), Authority (credible source?), Accuracy (fact-based?), Purpose (informational vs advocacy). Score 0 to 5 each. Total: high(>18/25), medium(12 to 18), low(<12)
3. Alert priority = high relevance (≥7) + high reliability (≥8) → critical; relevance ≥6 + reliability ≥7 → high; etc.
4. Summarize each publication in 2 sentences

For coverage gaps: identify important topics related to "${sitName}" that none of the sources covered (e.g., specific actor dynamics, humanitarian dimensions, diplomatic developments).

For source health: aggregate per-source statistics from the scan results.

For recommended new sources: based on what's missing in coverage, name 2-3 sources that should be added.

scanTimestamp: "${new Date().toISOString()}"`,
      system: 'You are the PRAXIS Source Monitor, an automated intelligence tracking system. Evaluate publication relevance, source credibility, and coverage gaps for conflict analysts. Produce actionable alerts with precise relevance and reliability assessments.',
    });

    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'media-scan');
  }
});
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/ai/media-scan/route.ts
git commit -m "feat(source-monitor): rebuild route as publication monitoring engine with CRAAP evaluation"
```

---

## Task 4: Create API Key Validation Endpoint

**Files:**
- Create: `src/app/api/settings/validate-key/route.ts`

§8.4.1 requires that when a user enters a Tavily/Firecrawl/Anthropic key, a test call validates it before saving.

- [ ] **Step 1: Verify the directory exists**

```bash
ls "C:/Users/giuli/ANTIGRAVITY/A4_PRAXIS_CLOUD_TACITUS/A4_PRAXIS_CLOUD_Work/src/app/api/settings" 2>/dev/null || echo "directory does not exist"
```

If the directory doesn't exist, it will be created when the file is written.

- [ ] **Step 2: Create the validation route**

Create `src/app/api/settings/validate-key/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';

export const maxDuration = 15;

/**
 * POST /api/settings/validate-key
 * Body: { provider: 'tavily' | 'firecrawl' | 'anthropic' | 'openai', apiKey: string }
 * Returns: { valid: boolean, error?: string }
 */
export const POST = withAuth(async (request) => {
  try {
    const { provider, apiKey } = await request.json() as {
      provider: 'tavily' | 'firecrawl' | 'anthropic' | 'openai';
      apiKey: string;
    };

    if (!apiKey?.trim()) {
      return NextResponse.json({ valid: false, error: 'API key is required' }, { status: 400 });
    }

    switch (provider) {
      case 'tavily': {
        // Tavily test: minimal search call
        const res = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: apiKey, query: 'test', max_results: 1 }),
          signal: AbortSignal.timeout(10_000),
        });
        if (res.status === 401 || res.status === 403) {
          return NextResponse.json({ valid: false, error: 'Invalid Tavily API key' });
        }
        return NextResponse.json({ valid: res.ok });
      }

      case 'firecrawl': {
        // Firecrawl test: check account endpoint
        const res = await fetch('https://api.firecrawl.dev/v1/team', {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(10_000),
        });
        if (res.status === 401 || res.status === 403) {
          return NextResponse.json({ valid: false, error: 'Invalid Firecrawl API key' });
        }
        return NextResponse.json({ valid: res.ok });
      }

      case 'anthropic': {
        // Anthropic test: minimal models list call
        const res = await fetch('https://api.anthropic.com/v1/models', {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023.06.01', // Anthropic API requires this exact header value
          },
          signal: AbortSignal.timeout(10_000),
        });
        if (res.status === 401 || res.status === 403) {
          return NextResponse.json({ valid: false, error: 'Invalid Anthropic API key' });
        }
        return NextResponse.json({ valid: res.ok });
      }

      case 'openai': {
        // OpenAI test: models list
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(10_000),
        });
        if (res.status === 401 || res.status === 403) {
          return NextResponse.json({ valid: false, error: 'Invalid OpenAI API key' });
        }
        return NextResponse.json({ valid: res.ok });
      }

      default:
        return NextResponse.json({ valid: false, error: 'Unknown provider' }, { status: 400 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Validation failed';
    const isTimeout = msg.includes('timed out') || msg.includes('timeout');
    return NextResponse.json(
      { valid: false, error: isTimeout ? 'Request timed out — check your network' : msg },
      { status: 500 }
    );
  }
});
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/settings/validate-key/route.ts
git commit -m "feat(settings): API key validation endpoint for Tavily, Firecrawl, Anthropic, OpenAI"
```

---

## Task 5: Settings Page — API Key Validation UI

**Files:**
- Modify: `src/app/app/settings/page.tsx`

Add green check / red error feedback when user enters an API key, using the new `/api/settings/validate-key` endpoint.

- [ ] **Step 1: Read the current settings page**

Use Read on `src/app/app/settings/page.tsx` to understand current state management and API key input structure.

- [ ] **Step 2: Add validation state per key**

In the component, add state for validation status:

```typescript
const [keyValidation, setKeyValidation] = useState<Record<string, 'idle' | 'validating' | 'valid' | 'invalid'>>({});
const [keyErrors, setKeyErrors] = useState<Record<string, string>>({});
```

- [ ] **Step 3: Add validateApiKey function**

```typescript
const validateApiKey = async (provider: string, apiKey: string) => {
  if (!apiKey.trim()) return;
  setKeyValidation((prev) => ({ ...prev, [provider]: 'validating' }));
  try {
    const res = await fetch('/api/settings/validate-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey }),
    });
    const data = await res.json() as { valid: boolean; error?: string };
    setKeyValidation((prev) => ({ ...prev, [provider]: data.valid ? 'valid' : 'invalid' }));
    if (!data.valid && data.error) {
      setKeyErrors((prev) => ({ ...prev, [provider]: data.error! }));
    } else {
      setKeyErrors((prev) => { const n = { ...prev }; delete n[provider]; return n; });
    }
  } catch {
    setKeyValidation((prev) => ({ ...prev, [provider]: 'invalid' }));
    setKeyErrors((prev) => ({ ...prev, [provider]: 'Network error during validation' }));
  }
};
```

- [ ] **Step 4: Update API key input fields to show validation status**

Find the existing API key `<input>` elements and add:
1. `onBlur` handler that calls `validateApiKey(provider, value)`
2. A status indicator element to the right of the input:

```tsx
{/* After each API key input field: */}
{keyValidation[provider] === 'validating' && (
  <span className="text-xs text-white/40 animate-pulse">Validating…</span>
)}
{keyValidation[provider] === 'valid' && (
  <span className="text-xs text-emerald-400">✓ Valid</span>
)}
{keyValidation[provider] === 'invalid' && (
  <span className="text-xs text-red-400">✗ {keyErrors[provider] || 'Invalid key'}</span>
)}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 6: Commit**

```bash
git add src/app/app/settings/page.tsx
git commit -m "feat(settings-ui): API key validation with live status indicators"
```

---

## Task 6: Expand Cases Static Database

**Files:**
- Modify: `src/app/app/cases/page.tsx`

- [ ] **Step 1: Read the current cases page**

Use Read on `src/app/app/cases/page.tsx` to understand the current case data structure and how cases are displayed.

- [ ] **Step 2: Expand the case database to 20+ cases**

Find the existing case data array (likely a `const CASES` or similar) and add cases spanning:
- Interstate wars: Gulf War 1991, Iran-Iraq War, Falklands
- Civil wars: Rwanda 1994, Bosnia 1992-95, Sierra Leone, Liberia
- Peace processes: South Africa TRC, Northern Ireland GFA 1998, Mozambique 1992, El Salvador 1992
- Active/recent: Yemen, Syria, Ethiopia-Tigray, Myanmar, Colombia (post-FARC)
- Sanctions regimes: Zimbabwe, North Korea, Iran

Each case should follow the type already defined in the page. Use this structure:

```typescript
{
  id: 'good-friday-1998',
  name: 'Good Friday Agreement',
  type: 'political',
  region: 'Western Europe',
  country: 'United Kingdom / Ireland',
  period: '1968–1998',
  status: 'resolved',
  actors: ['IRA', 'British Government', 'Irish Government', 'Ulster Unionists', 'SDLP', 'Sinn Féin'],
  glaslStage: 7, // at peak before settlement
  outcome: 'Power-sharing agreement, IRA decommissioning, cross-border institutions',
  lessonsLearned: [
    'Multi-party inclusive talks essential — initial exclusion of Sinn Féin delayed resolution by years',
    'External facilitation (George Mitchell) provided neutral process architecture',
    'Referendum ratification gave popular legitimacy that spoilers could not delegitimize',
    'Identity and symbolic issues (flags, parades) must be addressed alongside structural issues',
  ],
  keyFrameworks: ['Fisher-Ury interests-based negotiation', 'Lax-Sebenius deal design', 'Zartman ripeness'],
  comparableConflicts: ['Basque Country', 'South Africa transition'],
},
```

Add at minimum these 15 additional cases (expand the structure to match existing entries):
1. `south-africa-1994` — Negotiated transition, ANC-NP talks, CODESA
2. `mozambique-1992` — Rome General Peace Accords, FRELIMO-RENAMO
3. `el-salvador-1992` — Chapultepec Agreement, UN verification (ONUSAL)
4. `rwanda-1994` — Genocide, Arusha Accords failure, lessons
5. `bosnia-1995` — Dayton Agreement, ethnic partition, power-sharing
6. `sierra-leone-2002` — Special Court, DDR, post-conflict reconstruction
7. `northern-ireland-1998` — Good Friday Agreement (above template)
8. `colombia-2016` — FARC peace accord, gender provisions, rural reform
9. `south-sudan-2015` — ARCSS, power-sharing failure, relapse
10. `minsk-ukraine` — Minsk I & II, implementation failure
11. `yemen-current` — Houthi conflict, UN mediation, humanitarian crisis
12. `ethiopia-tigray-2022` — Pretoria Agreement, AU mediation, ceasefire
13. `myanmar-2021` — Military coup, NUG resistance, ASEAN involvement
14. `iran-nuclear-jcpoa` — JCPOA, multilateral sanctions, compliance tracking
15. `sudan-civil-war-2023` — SAF-RSF conflict, IGAD mediation, humanitarian collapse

- [ ] **Step 3: Add "Compare with my situation" button**

After each case card's detail view, add a button:

```tsx
<button
  onClick={() => {
    // Navigate to compare tool with this case pre-selected
    router.push(`/app/compare?caseId=${encodeURIComponent(caseItem.id)}&caseName=${encodeURIComponent(caseItem.name)}`);
  }}
  className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
>
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
  Compare with my situation
</button>
```

Import `useRouter` from `next/navigation` if not already imported.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
git add src/app/app/cases/page.tsx
git commit -m "feat(cases): expand database to 20+ historical conflicts + compare pipeline button"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] 8.1 Cases: expanded case database (Task 6), compare pipeline button (Task 6)
- [ ] 8.1.2 AI-enriched case details: Web research on case view — **NOT INCLUDED** (requires Firestore caching pattern and on-demand enrichment; recommend adding as a follow-up after core cases UI is stable)
- [ ] 8.1.4 User-contributed cases: Firestore write + public sharing — **NOT INCLUDED** (requires Firestore schema addition and moderation consideration; separate small task)
- [x] 8.2 Advisory: web-grounded personas (Task 2), devil's advocacy mode (Task 2), panel summary (Task 2)
- [ ] 8.2.3 Structured analytic techniques: each advisor uses domain methods — **PARTIALLY COVERED** by existing persona prompts; deeper implementation requires per-method schema output
- [x] 8.3 Source Monitor: tool-registry registration (Task 1), publication tracking (Task 3), CRAAP evaluation (Task 3), source health (Task 3)
- [ ] 8.3.2 Automated weekly cron: cron-based monitoring — **NOT INCLUDED** (requires Cloud Scheduler integration; beyond scope of this API-layer plan)
- [x] 8.4.1 API key validation: endpoint (Task 4) + UI feedback (Task 5)
- [ ] 8.4.2 Model preference per tool: settings UI + reading preferences in routes — **NOT INCLUDED** (requires Firestore schema + provider switching in each route; separate plan)
- [ ] 8.4.3 Notification preferences: Firebase Cloud Messaging setup — **NOT INCLUDED** (requires FCM token management; separate plan)
- [ ] 8.4.4 Data export: ZIP generation + Cloud Storage — **NOT INCLUDED** (requires Cloud Storage write + Cloud Function; separate plan)
- [ ] 8.4.5 Tool visibility selector: sidebar filtering — **NOT INCLUDED** (requires sidebar refactor + Firestore user preferences; separate plan)

**Known gaps for follow-up plans:**
1. `cases` — AI-enriched case details (web search on demand per case view)
2. `cases` — User-contributed case Firestore write
3. `advisory` — Per-advisor structured analytic technique schema output
4. `settings` — Model preference per tool category (Firestore read in each route)
5. `settings` — Browser push notifications (FCM setup)
6. `settings` — Data export ZIP (Cloud Storage + Cloud Function)
7. `settings` — Tool visibility sidebar selector
