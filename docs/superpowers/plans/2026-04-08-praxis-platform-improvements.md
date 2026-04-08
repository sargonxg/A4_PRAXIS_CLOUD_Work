# PRAXIS Platform Improvements — Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver 7 phases of platform improvements: developer reference library, situation research overhaul with canonical pre-check, activity/status tab, user confidence system, debug stabilization, data trustworthiness engine, and feature additions (Graphify, user prefs, methodology panels, graph viz).

**Architecture:** Each phase builds on prior work. Phase 1 creates the internal reference + fixes outdated research. Phase 2 adds UX systems (activity tab, feedback, debug fixes). Phase 3 adds features (Graphify, preferences, methodology, graph viz). All work targets the real `/app/*` paths only.

**Tech Stack:** Next.js 16, TypeScript 5.9, React 19, Zustand 5, Tailwind CSS 4, AI SDK v6, Firebase/Firestore, D3.js 7, Python FastAPI, NetworkX

---

## Phase 1A: Internal Developer Reference Library

### Task 1: Create tool progress reference document

**Files:**
- Create: `docs/tool-reference/README.md`
- Create: `docs/tool-reference/tool-status.json`

This is YOUR reference doc — a structured JSON + markdown file documenting every tool's implementation status, known issues, API route health, and improvement notes.

- [ ] **Step 1: Create the tool-status.json schema**

```json
{
  "$schema": "tool-reference",
  "version": "1.0.0",
  "lastUpdated": "2026-04-08",
  "tools": [
    {
      "id": "dashboard",
      "name": "Dashboard",
      "category": "context",
      "status": "operational",
      "completeness": 85,
      "page": "src/app/app/dashboard/page.tsx",
      "apiRoute": "src/app/api/ai/risk-assessment/route.ts",
      "dataSchema": "DashboardSnapshotSchema",
      "knownIssues": [],
      "recentChanges": [],
      "nextImprovements": [],
      "dependsOn": ["risk-engine", "feed-aggregator", "situation-store"],
      "firestorePath": "users/{uid}/situations/{sitId}/tool-data/dashboard-snapshot",
      "credits": 0,
      "frameworks": ["INFORM Risk Index", "Glasl Escalation Model"],
      "dataSources": ["ACLED", "GDELT", "ReliefWeb", "HDX HAPI"],
      "hasMethodologyPanel": false,
      "userFeedbackEnabled": false,
      "dataTriangulation": false,
      "lastAuditDate": "2026-04-08"
    }
  ]
}
```

- [ ] **Step 2: Populate all 40 tools by reading each page + API route**

Read each tool page file and its corresponding API route. For each tool, record:
- `status`: "operational" | "partial" | "stub" | "broken"
- `completeness`: 0-100 (does it generate data, persist, render, handle errors?)
- `knownIssues`: array of strings describing bugs or gaps
- `nextImprovements`: what would make it production-grade

- [ ] **Step 3: Create README.md index**

```markdown
# PRAXIS Tool Reference — Internal Developer Guide

> Auto-maintained reference for all 40 platform tools.
> Source of truth: `tool-status.json`

## Quick Status

| Tool | Status | Completeness | Issues |
|------|--------|-------------|--------|
| Dashboard | operational | 85% | 0 |
| ... | ... | ... | ... |

## How to Use This Document

When working on any tool:
1. Check `tool-status.json` for current state
2. Update `knownIssues` and `completeness` after changes
3. Add entries to `recentChanges` with date

## Architecture Quick Reference

- Tool pages: `src/app/app/{tool-id}/page.tsx`
- API routes: `src/app/api/ai/{tool-route}/route.ts`
- Tool registry: `src/lib/constants/tool-registry.ts`
- Data persistence: `usePersistedToolData(toolId, situationId)`
- Auth wrapper: `withAuth()` in `src/lib/api/with-auth.ts`
- Credit deduction: `checkAndDeductCredits()` in `src/lib/api/with-credits.ts`
- Situation context: `buildToolContext()` in `src/lib/ai/situation-context.ts`
```

- [ ] **Step 4: Commit**

```bash
git add docs/tool-reference/
git commit -m "feat: add internal developer tool reference library"
```

---

## Phase 1B: Situation Research Overhaul — Canonical Pre-Check

### Task 2: Add Google Search grounding to auto-structure for current events validation

**Files:**
- Modify: `src/app/api/ai/auto-structure/route.ts`
- Create: `src/lib/services/canonical-precheck.ts`

The Syria/Assad problem: the system generates outdated intelligence because it relies on LLM training data without validating against current events. Fix: add a mandatory canonical pre-check step that uses Google Search grounding to establish ground truth BEFORE the AI generates its analysis.

- [ ] **Step 1: Create canonical-precheck.ts**

```typescript
/**
 * Canonical Pre-Check Service
 *
 * Before generating situation intelligence, validates key facts against
 * current web sources using Google Search grounding. This prevents the
 * system from generating analysis based on outdated information (e.g.,
 * Assad still in power after regime change).
 *
 * Returns a "ground truth" context block that is prepended to all AI prompts.
 */

import { generateText } from 'ai';
import { getGroundedModel } from '@/lib/ai/providers';

export interface CanonicalFact {
  claim: string;
  status: 'confirmed' | 'outdated' | 'disputed' | 'unverified';
  currentInfo: string;
  source?: string;
  confidence: 'high' | 'medium' | 'low';
  checkedAt: string;
}

export interface PreCheckResult {
  situationName: string;
  region: string;
  groundTruth: CanonicalFact[];
  currentLeadership: string | null;
  currentStatus: string;
  lastMajorEvent: string | null;
  warnings: string[];
  checkedAt: string;
}

export async function runCanonicalPreCheck(params: {
  situationName: string;
  region: string;
  actors: string[];
  description?: string;
}): Promise<PreCheckResult> {
  const { situationName, region, actors, description } = params;

  const groundedModel = getGroundedModel();

  const { text } = await generateText({
    model: groundedModel,
    prompt: `You are a fact-checking system. For the situation "${situationName}" in ${region || 'unknown region'}:

CRITICAL: Use your search grounding to answer with CURRENT, VERIFIED information only.

1. CURRENT LEADERSHIP: Who currently leads/governs the country or region? Has there been any recent change of government, coup, or regime change?

2. CURRENT STATUS: What is the current state of this conflict/situation as of today? Is it active, frozen, resolved, or transformed?

3. KEY ACTORS STATUS: For each actor listed, what is their current status?
Actors: ${actors.join(', ') || 'not specified'}

4. LAST MAJOR EVENT: What was the most recent significant event (within last 6 months)?

5. CRITICAL CORRECTIONS: What common misconceptions or outdated information should be flagged? (e.g., leaders who are no longer in power, ceasefires that have collapsed, new actors that have emerged)

Format your response as structured JSON:
{
  "currentLeadership": "string describing current leadership",
  "currentStatus": "string describing current situation status",
  "lastMajorEvent": "string describing most recent major event with date",
  "actorUpdates": [
    { "actor": "name", "currentStatus": "description", "changed": true/false }
  ],
  "corrections": [
    { "outdatedClaim": "what people might assume", "currentReality": "what is actually true now", "changeDate": "when this changed" }
  ],
  "warnings": ["any critical warnings about using outdated information"]
}`,
  });

  // Parse the grounded response
  let parsed: Record<string, unknown> = {};
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    }
  } catch {
    // If parsing fails, use raw text as warning
    return {
      situationName,
      region,
      groundTruth: [],
      currentLeadership: null,
      currentStatus: text.slice(0, 500),
      lastMajorEvent: null,
      warnings: ['Could not parse structured pre-check response. Raw response used as context.'],
      checkedAt: new Date().toISOString(),
    };
  }

  const corrections = (parsed.corrections as Array<Record<string, string>>) || [];
  const groundTruth: CanonicalFact[] = corrections.map((c) => ({
    claim: c.outdatedClaim || '',
    status: 'outdated' as const,
    currentInfo: c.currentReality || '',
    confidence: 'high' as const,
    checkedAt: new Date().toISOString(),
  }));

  return {
    situationName,
    region,
    groundTruth,
    currentLeadership: (parsed.currentLeadership as string) || null,
    currentStatus: (parsed.currentStatus as string) || '',
    lastMajorEvent: (parsed.lastMajorEvent as string) || null,
    warnings: (parsed.warnings as string[]) || [],
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Format pre-check results into a context block for AI prompts.
 * This is prepended to the auto-structure system prompt.
 */
export function formatPreCheckContext(result: PreCheckResult): string {
  const lines: string[] = [
    `\n\nCANONICAL GROUND TRUTH (verified via web search ${result.checkedAt}):`,
  ];

  if (result.currentLeadership) {
    lines.push(`CURRENT LEADERSHIP: ${result.currentLeadership}`);
  }
  if (result.currentStatus) {
    lines.push(`CURRENT STATUS: ${result.currentStatus}`);
  }
  if (result.lastMajorEvent) {
    lines.push(`LAST MAJOR EVENT: ${result.lastMajorEvent}`);
  }

  if (result.groundTruth.length > 0) {
    lines.push('\nCRITICAL CORRECTIONS (DO NOT use outdated information):');
    for (const fact of result.groundTruth) {
      lines.push(`- OUTDATED: "${fact.claim}" → CURRENT: "${fact.currentInfo}"`);
    }
  }

  if (result.warnings.length > 0) {
    lines.push('\nWARNINGS:');
    for (const w of result.warnings) {
      lines.push(`- ${w}`);
    }
  }

  return lines.join('\n');
}
```

- [ ] **Step 2: Integrate pre-check into auto-structure route**

In `src/app/api/ai/auto-structure/route.ts`, add the canonical pre-check as a parallel operation alongside existing context gathering:

```typescript
// After line 67 (const contextSections: string[] = [])
// Add canonical pre-check as first gather promise
import { runCanonicalPreCheck, formatPreCheckContext } from '@/lib/services/canonical-precheck';

// Add to gatherPromises array:
gatherPromises.push(
  runCanonicalPreCheck({
    situationName,
    region,
    actors: actors || [],
    description,
  }).then((preCheck) => {
    const preCheckContext = formatPreCheckContext(preCheck);
    // Prepend so it appears first in context
    contextSections.unshift(preCheckContext);

    // Save pre-check results to Firestore for tool pages to reference
    if (situationId && user.uid) {
      import('@/lib/firebase/tool-data-service').then((m) =>
        m.saveToolData(user.uid, situationId, 'canonical-precheck', preCheck)
      ).catch(() => {});
    }
  }).catch((err) => {
    console.warn('[auto-structure] Canonical pre-check failed, continuing without:', err);
  })
);
```

- [ ] **Step 3: Update the system prompt to enforce ground truth**

In the same file, modify the system prompt (around line 209) to include a stronger instruction:

```typescript
// Add after "IMPORTANT: Use the webSearch tool ONCE..." line:
`
CRITICAL INSTRUCTION: The CANONICAL GROUND TRUTH section above contains VERIFIED current information from web search. You MUST use this information and NEVER contradict it. If the ground truth says a leader has been deposed, do NOT refer to them as current leader. If the ground truth says a ceasefire has collapsed, do NOT describe it as holding. The ground truth overrides your training data.
`
```

- [ ] **Step 4: Save pre-check results to situation metadata**

```typescript
// After pre-check completes, update situation with verified current info
if (preCheck.currentLeadership || preCheck.currentStatus) {
  await updateSituation(user.uid, situationId, {
    canonicalPreCheck: {
      currentLeadership: preCheck.currentLeadership,
      currentStatus: preCheck.currentStatus,
      lastMajorEvent: preCheck.lastMajorEvent,
      corrections: preCheck.groundTruth.length,
      checkedAt: preCheck.checkedAt,
    },
  }).catch(() => {});
}
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/services/canonical-precheck.ts src/app/api/ai/auto-structure/route.ts
git commit -m "feat: add canonical pre-check for current events validation in situation research"
```

---

## Phase 2A: Activity/Status Tab

### Task 3: Create activity store for real-time operation tracking

**Files:**
- Create: `src/stores/activity-store.ts`
- Modify: `src/lib/api/with-auth.ts` (add activity logging hook)

- [ ] **Step 1: Create activity-store.ts**

```typescript
import { create } from 'zustand';

export type OperationStatus = 'pending' | 'running' | 'completed' | 'failed';
export type OperationType = 'ai-generation' | 'data-fetch' | 'pipeline' | 'research' | 'export';

export interface ActiveOperation {
  id: string;
  type: OperationType;
  tool: string;
  label: string;
  status: OperationStatus;
  progress?: number; // 0-100
  startedAt: string;
  completedAt?: string;
  error?: string;
  situationId?: string;
}

interface ActivityStore {
  operations: ActiveOperation[];
  isOpen: boolean;

  startOperation: (op: Omit<ActiveOperation, 'status' | 'startedAt'>) => void;
  updateOperation: (id: string, updates: Partial<ActiveOperation>) => void;
  completeOperation: (id: string) => void;
  failOperation: (id: string, error: string) => void;
  clearCompleted: () => void;
  toggle: () => void;

  // Derived
  activeCount: () => number;
  hasErrors: () => boolean;
}

const MAX_OPERATIONS = 100;

export const useActivityStore = create<ActivityStore>((set, get) => ({
  operations: [],
  isOpen: false,

  startOperation: (op) =>
    set((state) => ({
      operations: [
        { ...op, status: 'running', startedAt: new Date().toISOString() },
        ...state.operations,
      ].slice(0, MAX_OPERATIONS),
    })),

  updateOperation: (id, updates) =>
    set((state) => ({
      operations: state.operations.map((op) =>
        op.id === id ? { ...op, ...updates } : op
      ),
    })),

  completeOperation: (id) =>
    set((state) => ({
      operations: state.operations.map((op) =>
        op.id === id
          ? { ...op, status: 'completed' as const, completedAt: new Date().toISOString() }
          : op
      ),
    })),

  failOperation: (id, error) =>
    set((state) => ({
      operations: state.operations.map((op) =>
        op.id === id
          ? { ...op, status: 'failed' as const, error, completedAt: new Date().toISOString() }
          : op
      ),
    })),

  clearCompleted: () =>
    set((state) => ({
      operations: state.operations.filter((op) => op.status === 'running' || op.status === 'pending'),
    })),

  toggle: () => set((state) => ({ isOpen: !state.isOpen })),

  activeCount: () => get().operations.filter((op) => op.status === 'running').length,
  hasErrors: () => get().operations.some((op) => op.status === 'failed'),
}));
```

- [ ] **Step 2: Commit**

```bash
git add src/stores/activity-store.ts
git commit -m "feat: add activity store for real-time operation tracking"
```

### Task 4: Create Activity Panel UI component

**Files:**
- Create: `src/components/app/activity-panel.tsx`
- Modify: `src/components/app/app-shell.tsx`

- [ ] **Step 1: Create activity-panel.tsx**

Build the Activity Panel as a slide-out panel (similar to debug panel positioning) that shows:
- Active operations with spinner
- Completed operations with checkmark
- Failed operations with error message
- Progress bars where applicable
- Clear completed button
- Tool name + situation context for each operation

Use the same design language as debug-panel.tsx: navy-950 bg, gold accents, monospace text, Framer Motion animations.

Key UI elements:
- Floating trigger button (bottom-right, mirroring debug panel on bottom-left)
- Badge showing active operation count
- Operation rows with status icon, tool name, elapsed time
- Collapsible error details
- Filter: All / Active / Failed

- [ ] **Step 2: Wire into app-shell.tsx**

Add `<ActivityPanel />` to the AppShell component alongside DebugPanel.

- [ ] **Step 3: Commit**

```bash
git add src/components/app/activity-panel.tsx src/components/app/app-shell.tsx
git commit -m "feat: add activity panel UI for real-time operation tracking"
```

### Task 5: Instrument API routes with activity tracking

**Files:**
- Create: `src/lib/api/with-activity.ts`
- Modify: Key AI API routes to log activity

- [ ] **Step 1: Create client-side activity tracking hook**

```typescript
/**
 * Client-side wrapper that logs operations to the activity store.
 * Used by tool pages when they call AI API routes.
 */

import { useActivityStore } from '@/stores/activity-store';
import { useDebugStore } from '@/stores/debug-store';

export function useTrackedFetch() {
  const { startOperation, completeOperation, failOperation } = useActivityStore();
  const debugLog = useDebugStore((s) => s.log);

  return async function trackedFetch(
    url: string,
    options: RequestInit & {
      toolName: string;
      operationType?: 'ai-generation' | 'data-fetch' | 'research';
      situationId?: string;
    }
  ): Promise<Response> {
    const { toolName, operationType = 'ai-generation', situationId, ...fetchOptions } = options;
    const opId = `${toolName}-${Date.now()}`;

    startOperation({
      id: opId,
      type: operationType,
      tool: toolName,
      label: `Generating ${toolName}`,
      situationId,
    });

    debugLog({
      id: opId,
      type: 'request',
      tool: toolName,
      endpoint: url,
      situation: situationId,
      ts: new Date().toISOString(),
    });

    const startTime = Date.now();

    try {
      const res = await fetch(url, fetchOptions);
      const elapsed = ((Date.now() - startTime) / 1000);

      if (res.ok) {
        completeOperation(opId);
        debugLog({
          id: `${opId}-done`,
          type: 'success',
          tool: toolName,
          endpoint: url,
          status: res.status,
          elapsed,
          ts: new Date().toISOString(),
        });
      } else {
        const errorText = await res.clone().text().catch(() => 'Unknown error');
        failOperation(opId, `HTTP ${res.status}: ${errorText.slice(0, 200)}`);
        debugLog({
          id: `${opId}-err`,
          type: 'error',
          tool: toolName,
          endpoint: url,
          status: res.status,
          elapsed,
          error: errorText.slice(0, 200),
          ts: new Date().toISOString(),
        });
      }

      return res;
    } catch (err) {
      const elapsed = ((Date.now() - startTime) / 1000);
      const msg = err instanceof Error ? err.message : 'Network error';
      failOperation(opId, msg);
      debugLog({
        id: `${opId}-err`,
        type: 'error',
        tool: toolName,
        elapsed,
        error: msg,
        ts: new Date().toISOString(),
      });
      throw err;
    }
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/api/with-activity.ts
git commit -m "feat: add useTrackedFetch hook for unified activity + debug logging"
```

---

## Phase 2B: User Confidence & Feedback System

### Task 6: Create tool confidence feedback component

**Files:**
- Create: `src/components/praxis/tool-feedback.tsx`
- Create: `src/lib/services/feedback-service.ts`

- [ ] **Step 1: Create feedback-service.ts**

```typescript
/**
 * Tool Feedback Service
 *
 * Stores user confidence ratings and improvement suggestions per tool output.
 * Feedback is stored in Firestore at:
 *   users/{uid}/situations/{sitId}/tool-data/{toolId}/feedback
 *
 * This data is used to:
 * 1. Show confidence indicators on tool outputs
 * 2. Inform AI regeneration prompts (low confidence = adjust approach)
 * 3. Aggregate patterns for tool improvement
 */

import { adminDb, ensureInitialized } from '@/lib/firebase/admin';

export interface ToolFeedback {
  confidence: 1 | 2 | 3 | 4 | 5; // 1=not confident, 5=very confident
  issues?: string[]; // ['outdated', 'incomplete', 'inaccurate', 'irrelevant', 'biased']
  suggestion?: string;
  approved?: boolean; // user explicitly marked as "ready/approved"
  createdAt: string;
  toolId: string;
  situationId: string;
}

export async function saveToolFeedback(
  uid: string,
  situationId: string,
  toolId: string,
  feedback: Omit<ToolFeedback, 'createdAt' | 'toolId' | 'situationId'>
): Promise<void> {
  await ensureInitialized();
  const ref = adminDb
    .collection('users').doc(uid)
    .collection('situations').doc(situationId)
    .collection('tool-feedback').doc(toolId);

  await ref.set({
    ...feedback,
    toolId,
    situationId,
    createdAt: new Date().toISOString(),
  }, { merge: true });
}

export async function getToolFeedback(
  uid: string,
  situationId: string,
  toolId: string
): Promise<ToolFeedback | null> {
  await ensureInitialized();
  const doc = await adminDb
    .collection('users').doc(uid)
    .collection('situations').doc(situationId)
    .collection('tool-feedback').doc(toolId)
    .get();

  return doc.exists ? (doc.data() as ToolFeedback) : null;
}
```

- [ ] **Step 2: Create tool-feedback.tsx component**

A notification-style feedback prompt that appears at the bottom of tool outputs. Shows:
- 5-star confidence rating
- Quick issue tags (outdated, incomplete, inaccurate, irrelevant, biased)
- Optional text suggestion
- "Mark as ready" approval button

Design: subtle bottom bar, navy-900 bg, appears after tool output renders. Not intrusive but always accessible.

- [ ] **Step 3: Create API route for feedback**

Create `src/app/api/tool-feedback/route.ts` with GET and POST handlers using `withAuth`.

- [ ] **Step 4: Commit**

```bash
git add src/components/praxis/tool-feedback.tsx src/lib/services/feedback-service.ts src/app/api/tool-feedback/route.ts
git commit -m "feat: add user confidence feedback system for tool outputs"
```

### Task 7: Add feedback prompts to tool pages

**Files:**
- Modify: Tool pages that use `usePersistedToolData` (start with 5 key tools)

- [ ] **Step 1: Add ToolFeedback to risk-monitor, actor-profiles, early-warning, stakeholder-map, auto-briefings**

Import and render `<ToolFeedback toolId={toolId} situationId={situation.id} />` at the bottom of each tool's output section.

- [ ] **Step 2: Wire low-confidence into regeneration prompts**

When a user rates confidence <= 2 and provides issues, append this context to the next AI generation prompt for that tool:

```typescript
const feedback = await getToolFeedback(uid, situationId, toolId);
if (feedback && feedback.confidence <= 2) {
  prompt += `\n\nUSER FEEDBACK ON PREVIOUS OUTPUT: The analyst rated the previous output ${feedback.confidence}/5 confidence. Issues flagged: ${feedback.issues?.join(', ')}. ${feedback.suggestion ? `Suggestion: ${feedback.suggestion}` : ''}\nPlease address these concerns in your new output.`;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/app/risk-monitor/ src/app/app/actors/ src/app/app/early-warning/ src/app/app/stakeholder-map/ src/app/app/auto-briefings/
git commit -m "feat: integrate confidence feedback into core tool pages"
```

---

## Phase 2C: Debug Panel Stabilization

### Task 8: Fix debug panel crash scenarios

**Files:**
- Modify: `src/components/app/debug-panel.tsx`
- Modify: `src/stores/debug-store.ts`

- [ ] **Step 1: Add error boundary and safe health fetch**

```typescript
// In debug-panel.tsx, wrap the health fetch with proper error handling:
const fetchHealth = async () => {
  setHealthLoading(true);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout
    const res = await fetch('/api/health', { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    setHealth(data);
  } catch (err) {
    setHealth({ status: 'error', services: {}, timestamp: new Date().toISOString() });
    console.warn('[DebugPanel] Health check failed:', err);
  } finally {
    setHealthLoading(false);
  }
};
```

- [ ] **Step 2: Guard against undefined entries in store**

```typescript
// In debug-store.ts, add safety to log function:
log: (entry) =>
  set((state) => ({
    entries: [
      { ...entry, ts: entry.ts || new Date().toISOString(), id: entry.id || crypto.randomUUID() },
      ...state.entries,
    ].slice(0, MAX_ENTRIES),
  })),
```

- [ ] **Step 3: Add React error boundary wrapper**

```typescript
// Wrap DebugPanel export with error boundary
import { Component, type ReactNode } from 'react';

class DebugErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed bottom-4 left-4 z-50 rounded bg-red-900/80 px-3 py-2 text-xs text-red-200">
          Debug panel crashed. <button onClick={() => this.setState({ hasError: false })} className="underline">Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function SafeDebugPanel() {
  return (
    <DebugErrorBoundary>
      <DebugPanel />
    </DebugErrorBoundary>
  );
}
```

- [ ] **Step 4: Handle missing credits gracefully**

The debug panel shows `credits` from `useAuth()`. If auth context is not yet loaded, it crashes. Add null check:

```typescript
// Guard the credit display
const creditDisplay = typeof credits === 'number' ? credits : '...';
```

- [ ] **Step 5: Commit**

```bash
git add src/components/app/debug-panel.tsx src/stores/debug-store.ts
git commit -m "fix: stabilize debug panel with error boundary, timeout, and null guards"
```

---

## Phase 3A: Data Trustworthiness & Triangulation

### Task 9: Create data trustworthiness scoring engine

**Files:**
- Create: `src/lib/analytics/trustworthiness-engine.ts`

- [ ] **Step 1: Create the engine**

```typescript
/**
 * Data Trustworthiness Engine
 *
 * Assigns confidence weights to information based on:
 * 1. Source reliability (UN agencies > think tanks > media > social media)
 * 2. Triangulation (same fact from 3+ independent sources = high confidence)
 * 3. Recency (more recent = higher weight)
 * 4. Consistency (does it align with other verified data?)
 *
 * Used by: feed-aggregator, tool generation, risk-engine
 */

export type TrustLevel = 'verified' | 'high' | 'medium' | 'low' | 'unverified';

export interface TrustworthinessScore {
  level: TrustLevel;
  score: number; // 0-100
  sources: number; // how many independent sources confirm this
  reasoning: string;
  triangulated: boolean; // 3+ independent sources
}

// Source reliability tiers (0-100)
const SOURCE_RELIABILITY: Record<string, number> = {
  // Tier 1: Official/institutional (85-100)
  'ACLED': 95,
  'UNHCR': 95,
  'OCHA': 95,
  'World Bank': 90,
  'HDX HAPI': 90,
  'UCDP': 90,
  'SIPRI': 88,
  'ReliefWeb': 85,
  'UN News': 85,

  // Tier 2: Expert/analytical (70-84)
  'Crisis Group': 82,
  'Chatham House': 80,
  'RAND': 80,
  'Carnegie': 78,
  'Brookings': 78,
  'ISW': 75,
  'Bellingcat': 75,
  'Human Rights Watch': 80,
  'Amnesty International': 80,

  // Tier 3: Major media (60-74)
  'Reuters': 72,
  'AP': 72,
  'BBC': 70,
  'Al Jazeera': 68,
  'AFP': 70,
  'Financial Times': 70,

  // Tier 4: GDELT/aggregated (50-64)
  'GDELT': 55,

  // Tier 5: User-provided/unverified (30-49)
  'user-document': 40,
  'firecrawl': 45,
  'wikipedia': 60,
};

export function getSourceReliability(source: string): number {
  return SOURCE_RELIABILITY[source] || 35;
}

export function computeTrustworthiness(params: {
  sources: string[];
  recencyDays: number;
  consistencyWithBaseline?: boolean;
}): TrustworthinessScore {
  const { sources, recencyDays, consistencyWithBaseline } = params;

  // Source reliability: average of all sources
  const avgReliability = sources.length > 0
    ? sources.reduce((sum, s) => sum + getSourceReliability(s), 0) / sources.length
    : 30;

  // Triangulation bonus: 3+ sources = +15, 2 = +5
  const triangulationBonus = sources.length >= 3 ? 15 : sources.length >= 2 ? 5 : 0;
  const triangulated = sources.length >= 3;

  // Recency factor: 0-7 days = 1.0, 8-30 = 0.85, 31-90 = 0.7, 90+ = 0.5
  const recencyFactor = recencyDays <= 7 ? 1.0
    : recencyDays <= 30 ? 0.85
    : recencyDays <= 90 ? 0.7
    : 0.5;

  // Consistency bonus
  const consistencyBonus = consistencyWithBaseline === true ? 10 : consistencyWithBaseline === false ? -10 : 0;

  const rawScore = (avgReliability + triangulationBonus + consistencyBonus) * recencyFactor;
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  const level: TrustLevel = score >= 85 ? 'verified'
    : score >= 70 ? 'high'
    : score >= 50 ? 'medium'
    : score >= 30 ? 'low'
    : 'unverified';

  return {
    level,
    score,
    sources: sources.length,
    triangulated,
    reasoning: `${sources.length} source(s), avg reliability ${avgReliability.toFixed(0)}, ${recencyDays}d old, ${triangulated ? 'triangulated' : 'not triangulated'}`,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/analytics/trustworthiness-engine.ts
git commit -m "feat: add data trustworthiness scoring engine with source reliability tiers"
```

### Task 10: Integrate trustworthiness into feed aggregator

**Files:**
- Modify: `src/lib/data-feeds/feed-aggregator.ts`

- [ ] **Step 1: Add trustworthiness scoring to SituationIntelligence**

Extend the `IntelligenceItem` interface to include `trustScore`:

```typescript
export interface IntelligenceItem {
  // ... existing fields ...
  trustScore?: TrustworthinessScore;
}
```

- [ ] **Step 2: Score each item in getSituationIntelligence**

After aggregating items from all sources, compute trustworthiness for each:

```typescript
import { computeTrustworthiness } from '@/lib/analytics/trustworthiness-engine';

// After merging all events:
for (const item of merged) {
  const daysSinceEvent = item.date
    ? Math.floor((Date.now() - new Date(item.date).getTime()) / 86400000)
    : 30;

  item.trustScore = computeTrustworthiness({
    sources: [item.source],
    recencyDays: daysSinceEvent,
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/data-feeds/feed-aggregator.ts
git commit -m "feat: integrate trustworthiness scoring into intelligence feed aggregator"
```

---

## Phase 3B: Feature Additions

### Task 11: Enhance D3 Force Graph with ACO colors

**Files:**
- Modify: `src/components/visualizations/force-graph.tsx`
- Modify: `src/app/app/conflict-graph/page.tsx`

- [ ] **Step 1: Add ACO color constants**

```typescript
export const ACO_COLORS: Record<string, string> = {
  actor: '#4E79A7',
  claim: '#F28E2B',
  interest: '#59A14F',
  constraint: '#E15759',
  leverage: '#EDC948',
  commitment: '#76B7B2',
  event: '#B07AA1',
  narrative: '#FF9DA7',
  // Extended types
  institution: '#9C755F',
  norm: '#BAB0AC',
  resource: '#E15759',
  risk: '#FF6B6B',
  policy: '#4CC9F0',
  grievance: '#F72585',
};
```

- [ ] **Step 2: Apply colors to force graph nodes**

Update the node rendering in force-graph.tsx to use ACO_COLORS based on `node.type`:

```typescript
// In the D3 simulation node rendering:
nodeGroup.append('circle')
  .attr('r', (d) => Math.max(8, Math.sqrt(d.connections || 1) * 4))
  .attr('fill', (d) => ACO_COLORS[d.type?.toLowerCase()] || '#8884d8')
  .attr('stroke', (d) => {
    const base = ACO_COLORS[d.type?.toLowerCase()] || '#8884d8';
    return d3.color(base)?.darker(0.5)?.toString() || base;
  })
  .attr('stroke-width', 1.5);
```

- [ ] **Step 3: Add legend overlay**

Add a small legend showing ACO type colors in the bottom-right of the graph:

```typescript
// Legend component
function ACOLegend({ visibleTypes }: { visibleTypes: string[] }) {
  return (
    <div className="absolute bottom-4 right-4 rounded-lg bg-navy-900/90 p-3 backdrop-blur-sm">
      <div className="text-[10px] font-semibold text-navy-400 mb-2">ACO Entity Types</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {visibleTypes.map((type) => (
          <div key={type} className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: ACO_COLORS[type] || '#8884d8' }}
            />
            <span className="text-[10px] text-navy-300 capitalize">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/visualizations/force-graph.tsx src/app/app/conflict-graph/page.tsx
git commit -m "feat: enhance D3 force graph with ACO color palette and legend"
```

### Task 12: Add methodology panels to tool pages

**Files:**
- Create: `src/components/praxis/methodology-panel.tsx`

- [ ] **Step 1: Create reusable MethodologyPanel component**

```typescript
/**
 * MethodologyPanel — Expandable panel showing analytical methodology
 * for each tool. Data driven by tool-registry.ts.
 */

'use client';

import { useState } from 'react';
import { ChevronDown, BookOpen, Database, Link2 } from 'lucide-react';
import { getToolById } from '@/lib/constants/tool-registry';
import { cn } from '@/lib/utils/cn';

interface MethodologyPanelProps {
  toolId: string;
  className?: string;
}

export function MethodologyPanel({ toolId, className }: MethodologyPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tool = getToolById(toolId);
  if (!tool) return null;

  return (
    <div className={cn('border-t border-navy-200 dark:border-navy-800', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-medium text-navy-500 hover:text-navy-700 dark:text-navy-400 dark:hover:text-navy-200 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5" />
          <span>Methodology & Sources</span>
        </div>
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-3">
          {/* Methodology */}
          <div>
            <h4 className="text-[10px] font-semibold uppercase text-navy-400 mb-1">Analytical Methodology</h4>
            <p className="text-xs text-navy-600 dark:text-navy-300 leading-relaxed">
              {tool.methodology}
            </p>
          </div>

          {/* Frameworks */}
          {tool.frameworks.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold uppercase text-navy-400 mb-1 flex items-center gap-1">
                <Link2 className="h-3 w-3" /> Frameworks
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {tool.frameworks.map((fw) => (
                  <span key={fw} className="rounded-full bg-navy-100 dark:bg-navy-800 px-2 py-0.5 text-[10px] text-navy-600 dark:text-navy-300">
                    {fw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Data Sources */}
          {tool.dataSources.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold uppercase text-navy-400 mb-1 flex items-center gap-1">
                <Database className="h-3 w-3" /> Data Sources
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {tool.dataSources.map((ds) => (
                  <span key={ds} className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-[10px] text-emerald-700 dark:text-emerald-300">
                    {ds}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Credits */}
          <div className="text-[10px] text-navy-400">
            Cost: {tool.credits} credit{tool.credits !== 1 ? 's' : ''} per generation
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add MethodologyPanel to all tool pages**

For each of the 40 tool pages, add `<MethodologyPanel toolId="tool-id" />` at the bottom of the page content. Start with the 10 most-used tools, then batch the rest.

- [ ] **Step 3: Commit**

```bash
git add src/components/praxis/methodology-panel.tsx
git commit -m "feat: add reusable methodology panel component for all tool pages"
```

### Task 13: User Preferences System — trusted sources and nomenclature

**Files:**
- Modify: `src/stores/preferences-store.ts`
- Modify: `src/app/app/settings/page.tsx`
- Create: `src/app/api/user-preferences/route.ts`

- [ ] **Step 1: Extend preferences store**

Add to the existing preferences store:

```typescript
// New fields in preferences store:
trustedSources: string[]; // Sources the user considers highly reliable
mediaPreferences: {
  preferredOutlets: string[];
  avoidedOutlets: string[];
  languagePreference: string; // 'en', 'ar', 'fr', etc.
};
nomenclature: Record<string, string>; // Custom term mappings, e.g., { "Myanmar": "Burma" }
analyticalFramework: string; // Preferred default framework
```

- [ ] **Step 2: Add settings UI sections**

Add new settings tabs/sections:
- "Trusted Sources" — multi-select from known sources with reliability indicators
- "Media Preferences" — preferred/avoided outlets
- "Nomenclature" — custom term mappings (entity name preferences)
- "Analytical Framework" — default framework selection

- [ ] **Step 3: Persist to Firestore**

Save preferences to `users/{uid}/settings/preferences` on change.

- [ ] **Step 4: Wire preferences into AI context**

Modify `buildToolContext()` in `situation-context.ts` to include user preferences:

```typescript
if (userPreferences?.trustedSources?.length) {
  context += `\nUser's trusted sources (prioritize these): ${userPreferences.trustedSources.join(', ')}`;
}
if (userPreferences?.nomenclature) {
  const terms = Object.entries(userPreferences.nomenclature).map(([k, v]) => `${k} → ${v}`).join(', ');
  context += `\nUser nomenclature preferences: ${terms}`;
}
```

- [ ] **Step 5: Commit**

```bash
git add src/stores/preferences-store.ts src/app/app/settings/ src/app/api/user-preferences/ src/lib/ai/situation-context.ts
git commit -m "feat: add user preferences system — trusted sources, media prefs, nomenclature"
```

### Task 14: Graphify integration — wire safishamsi/graphify as premium graph backend

**Files:**
- Create: `src/lib/services/graphify-client.ts`
- Modify: `src/app/app/settings/graph-backend/page.tsx`
- Modify: `backend/services/graph_adapter.py`

- [ ] **Step 1: Create graphify-client.ts**

```typescript
/**
 * Graphify Client — Integration with safishamsi/graphify
 * Premium graph backend option for PRAXIS.
 *
 * Graphify provides:
 * - Temporal knowledge graphs with bi-temporal support
 * - ACO-native entity types
 * - Built-in conflict analysis functions
 * - Graph diff and evolution tracking
 */

export interface GraphifyConfig {
  endpoint: string;
  apiKey: string;
  projectId: string;
}

export class GraphifyClient {
  private config: GraphifyConfig;

  constructor(config: GraphifyConfig) {
    this.config = config;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${this.config.endpoint}/health`, {
        headers: { 'Authorization': `Bearer ${this.config.apiKey}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async pushGraph(situationId: string, nodes: unknown[], edges: unknown[]): Promise<void> {
    const res = await fetch(`${this.config.endpoint}/api/v1/graphs/${situationId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'X-Project-ID': this.config.projectId,
      },
      body: JSON.stringify({ nodes, edges }),
    });
    if (!res.ok) throw new Error(`Graphify push failed: ${res.status}`);
  }

  async queryGraph(situationId: string, query: string): Promise<unknown> {
    const res = await fetch(`${this.config.endpoint}/api/v1/graphs/${situationId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'X-Project-ID': this.config.projectId,
      },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error(`Graphify query failed: ${res.status}`);
    return res.json();
  }

  async getEvolution(situationId: string, from: string, to: string): Promise<unknown> {
    const res = await fetch(
      `${this.config.endpoint}/api/v1/graphs/${situationId}/evolution?from=${from}&to=${to}`,
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-Project-ID': this.config.projectId,
        },
      }
    );
    if (!res.ok) throw new Error(`Graphify evolution failed: ${res.status}`);
    return res.json();
  }
}
```

- [ ] **Step 2: Add Graphify option to graph-backend settings**

Add a "Graphify (Premium)" option alongside Neo4j and FalkorDB in the settings page.

- [ ] **Step 3: Add GraphifyAdapter to backend**

In `backend/services/graph_adapter.py`, add a `GraphifyAdapter` class that implements the same interface as `Neo4jAdapter`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/services/graphify-client.ts src/app/app/settings/graph-backend/ backend/services/graph_adapter.py
git commit -m "feat: add Graphify integration as premium graph backend option"
```

---

## Phase 4: Build, Verify & Update Reference

### Task 15: TypeScript build verification

- [ ] **Step 1: Run TypeScript type check**

```bash
npx tsc --noEmit
```

Fix any type errors introduced by the changes.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Fix any lint issues.

- [ ] **Step 3: Update tool-status.json**

Update the reference library with all changes made, marking tools that received methodology panels, feedback systems, or other improvements.

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: v6.3.0 — platform improvements: canonical pre-check, activity tracking, feedback system, trustworthiness engine, ACO graph colors, methodology panels"
```

---

## Summary of Deliverables

| Phase | Deliverable | Key Files |
|-------|-------------|-----------|
| 1A | Developer Reference Library | `docs/tool-reference/` |
| 1B | Canonical Pre-Check | `src/lib/services/canonical-precheck.ts` |
| 2A | Activity Panel | `src/stores/activity-store.ts`, `src/components/app/activity-panel.tsx` |
| 2B | Feedback System | `src/components/praxis/tool-feedback.tsx`, `src/lib/services/feedback-service.ts` |
| 2C | Debug Stabilization | `src/components/app/debug-panel.tsx` |
| 3A | Trustworthiness Engine | `src/lib/analytics/trustworthiness-engine.ts` |
| 3B | ACO Graph Colors | `src/components/visualizations/force-graph.tsx` |
| 3B | Methodology Panels | `src/components/praxis/methodology-panel.tsx` |
| 3B | User Preferences | `src/stores/preferences-store.ts` |
| 3B | Graphify Integration | `src/lib/services/graphify-client.ts` |
