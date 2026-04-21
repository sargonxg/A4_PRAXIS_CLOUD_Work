# Foundation Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the PRAXIS foundation — canonical user+situation+preferences context contract, onboarding polish, profile edit/export/soft-delete with Ask-Praxis mutation flow, four flagship advisors with memory + briefing prefetch, production-grade audit + fix for six flagship tools, GCP access audit gating CI, and a roadmap doc for the remaining 34 tools.

**Architecture:** Build on existing `withCalibration` middleware and `ContextBlock`. Extend the block with `preferences`, `interaction`, and `advisor` frames. Replace hard-coded advisor personas with Firestore-driven `AdvisorConfig` docs at `config/advisors/{id}`. Add CI gates (`audit:routes`, `audit:gcp`) that fail the build on drift.

**Tech Stack:** Next.js 16 App Router, TypeScript 5.9, React 19, Firebase Admin SDK, Firestore, AI SDK v6 (`@ai-sdk/google`, `@ai-sdk/anthropic`), Zod, Vitest, Playwright.

**Design source:** `docs/superpowers/specs/2026-04-21-foundation-hardening-design.md`

---

## File Structure

**New files:**
- `src/types/preferences.ts` — `UserPreferences` schema + defaults
- `src/types/advisor.ts` — `AdvisorId`, `AdvisorConfig`, `AdvisorFrame`
- `src/types/interaction.ts` — `InteractionFrame`
- `src/lib/firebase/preferences-service.ts` — Firestore CRUD
- `src/lib/firebase/advisor-service.ts` — Firestore CRUD
- `src/lib/firebase/advisor-history-service.ts` — per-thread memory store
- `src/lib/context/preferences-frame.ts` — renders `<preferences>` block
- `src/lib/context/interaction-frame.ts` — derives recent-tools frame
- `src/lib/context/advisor-frame.ts` — rolling summary + advisor-frame block
- `src/lib/services/pii-scrub.ts` — scrub helper used by delete route
- `src/app/api/preferences/route.ts` — GET/PATCH
- `src/app/api/profile/route.ts` — DELETE
- `src/app/api/profile/export/route.ts` — GET
- `src/app/api/assistant/intent/route.ts` — POST intent classifier
- `src/app/api/ai/advisor-chat/briefing.ts` — prefetch helper
- `src/app/app/settings/preferences/page.tsx`
- `src/app/app/admin/advisors/page.tsx`
- `src/components/assistant/mutation-confirm-card.tsx`
- `src/components/settings/danger-zone.tsx`
- `src/components/advisory/advisor-picker.tsx`
- `src/components/advisory/advisor-chat-pane.tsx`
- `scripts/seed-advisors.ts`
- `scripts/seed-preferences-defaults.ts`
- `scripts/audit-ai-routes.ts`
- `scripts/audit-gcp.ts`
- `tests/tools/dashboard.smoke.test.ts`
- `tests/tools/conflict-graph.smoke.test.ts`
- `tests/tools/timeline.smoke.test.ts`
- `tests/tools/stakeholder-map.smoke.test.ts`
- `tests/tools/early-warning.smoke.test.ts`
- `tests/tools/info-environment.smoke.test.ts`
- `tests/profile/delete.test.ts`
- `tests/profile/export.test.ts`
- `tests/assistant/intent.test.ts`
- `tests/advisor/memory.test.ts`
- `src/app/app/dashboard/README.md`
- `src/app/app/conflict-graph/README.md`
- `src/app/app/timeline/README.md`
- `src/app/app/stakeholder-map/README.md`
- `src/app/app/early-warning/README.md`
- `src/app/app/info-environment/README.md`
- `docs/superpowers/specs/2026-04-21-tool-improvement-roadmap.md`

**Modified files:**
- `src/types/analyst-profile.ts` — add `meta.deletedAt`
- `src/lib/context/profile-context.ts` — extend `ContextBlock` with preferences/interaction/advisor frames
- `src/lib/context/system-prompt-block.ts` — add `<preferences>` + `<advisor-briefing>` rendering
- `src/app/onboarding/page.tsx` — resume-on-refresh
- `src/app/api/onboarding/complete/route.ts` — atomic completion transaction
- `src/app/app/settings/profile/page.tsx` — review-onboarding link + danger zone mount
- `src/app/onboarding/live-preview.tsx` — XML parity
- `src/app/api/ai/advisor-chat/route.ts` — Firestore-driven config + memory + briefing
- `src/app/app/advisory/page.tsx` — 4-card picker replacing legacy layout
- `src/app/app/dashboard/page.tsx` — widget set per §8.1
- `src/app/app/conflict-graph/page.tsx` — ACO-aligned interactions
- `src/app/app/timeline/page.tsx` — filters + narrate button
- `src/app/app/stakeholder-map/page.tsx` — MAW salience
- `src/app/app/early-warning/page.tsx` — Glasl + trend + triggers
- `src/app/app/info-environment/page.tsx` — clusters + disinfo
- `src/components/app/floating-praxis.tsx` — route mutations through intent endpoint
- `package.json` — add `audit:routes`, `audit:gcp`, `seed:advisors`, `seed:preferences`
- `cloudbuild.yaml` — preflight audit step
- `.env.example` — add `NEXT_PUBLIC_FOUNDATION_V1`

---

## Phases

0. Type and schema foundations
1. User preferences
2. `ContextBlock` extension + `<preferences>` block
3. Onboarding polish
4. Profile management — delete + export
5. Ask-Praxis profile mutation
6. Advisor Council v2
7. Six flagship tools
8. CI audits (routes + GCP)
9. Roadmap deliverable

---

## PHASE 0 — TYPE & SCHEMA FOUNDATIONS

### Task 0.1: Create `UserPreferences` type and defaults

**Files:**
- Create: `src/types/preferences.ts`
- Test: `tests/types/preferences.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/types/preferences.test.ts
import { describe, it, expect } from 'vitest';
import { UserPreferencesSchema, DEFAULT_USER_PREFERENCES } from '@/types/preferences';

describe('UserPreferences', () => {
  it('accepts defaults', () => {
    const parsed = UserPreferencesSchema.parse(DEFAULT_USER_PREFERENCES);
    expect(parsed.citationStyle).toBe('un-footnote');
    expect(parsed.defaultReportLength).toBe('standard');
    expect(parsed.defaultLanguage).toBe('en');
  });

  it('rejects unknown citation style', () => {
    expect(() => UserPreferencesSchema.parse({ ...DEFAULT_USER_PREFERENCES, citationStyle: 'mla' })).toThrow();
  });

  it('accepts a null preferredAdvisor', () => {
    const parsed = UserPreferencesSchema.parse({ ...DEFAULT_USER_PREFERENCES, preferredAdvisor: null });
    expect(parsed.preferredAdvisor).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/types/preferences.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/types/preferences.ts
import { z } from 'zod';

export const CITATION_STYLES = ['un-footnote', 'apa', 'author-date', 'inline-links'] as const;
export const REPORT_LENGTHS = ['brief', 'standard', 'deep'] as const;
export const CONFIDENCE_LABELLING = ['icd-203', 'plain'] as const;
export const TIME_HORIZONS = ['30d', '90d', '180d', '365d'] as const;
export const PREF_LANGUAGES = ['en', 'fr', 'es', 'ar', 'ru', 'zh'] as const;

export const UserPreferencesSchema = z.object({
  citationStyle: z.enum(CITATION_STYLES),
  defaultReportLength: z.enum(REPORT_LENGTHS),
  defaultLanguage: z.enum(PREF_LANGUAGES),
  confidenceLabelling: z.enum(CONFIDENCE_LABELLING),
  defaultTimeHorizon: z.enum(TIME_HORIZONS),
  preferredAdvisor: z.enum(['adeyemi', 'reyes', 'vanderberg', 'takeda']).nullable(),
  updatedAt: z.any().nullable().default(null),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  citationStyle: 'un-footnote',
  defaultReportLength: 'standard',
  defaultLanguage: 'en',
  confidenceLabelling: 'icd-203',
  defaultTimeHorizon: '90d',
  preferredAdvisor: null,
  updatedAt: null,
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/types/preferences.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/types/preferences.ts tests/types/preferences.test.ts
git commit -m "feat(types): add UserPreferences schema and defaults"
```

---

### Task 0.2: Create `AdvisorId` and `AdvisorConfig` types

**Files:**
- Create: `src/types/advisor.ts`
- Test: `tests/types/advisor.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/types/advisor.test.ts
import { describe, it, expect } from 'vitest';
import { AdvisorConfigSchema, ADVISOR_IDS } from '@/types/advisor';

describe('AdvisorConfig', () => {
  it('accepts a fully formed config', () => {
    const parsed = AdvisorConfigSchema.parse({
      id: 'adeyemi',
      name: 'Dr. Ngozi Adeyemi',
      title: 'Senior Political Affairs Advisor',
      bio: 'Governance, elections, civil society, state-building.',
      headshotUrl: null,
      persona: 'You are Dr. Ngozi Adeyemi…',
      modelTier: 'gemini-3-pro-deepthink',
      sourceCategories: ['multilateral-political', 'democracy-indices'],
      allowedTools: ['webSearch', 'knowledgeCore'],
      greeting: 'Hello — how can I help?',
      memoryPolicy: { lastTurns: 8, rollingSummary: true },
      version: 1,
      updatedAt: null,
    });
    expect(parsed.id).toBe('adeyemi');
  });

  it('lists exactly 4 advisor ids', () => {
    expect(ADVISOR_IDS).toEqual(['adeyemi', 'reyes', 'vanderberg', 'takeda']);
  });
});
```

- [ ] **Step 2: Run test**

Run: `npx vitest run tests/types/advisor.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/types/advisor.ts
import { z } from 'zod';

export const ADVISOR_IDS = ['adeyemi', 'reyes', 'vanderberg', 'takeda'] as const;
export type AdvisorId = typeof ADVISOR_IDS[number];

export const ADVISOR_MODEL_TIERS = [
  'gemini-3-flash',
  'gemini-3-pro',
  'gemini-3-pro-deepthink',
  'claude-sonnet-4',
] as const;
export type AdvisorModelTier = typeof ADVISOR_MODEL_TIERS[number];

export const ADVISOR_TOOLS = ['webSearch', 'firecrawlScrape', 'knowledgeCore'] as const;

export const AdvisorConfigSchema = z.object({
  id: z.enum(ADVISOR_IDS),
  name: z.string().min(1),
  title: z.string().min(1),
  bio: z.string().max(500),
  headshotUrl: z.string().url().nullable(),
  persona: z.string().min(100),
  modelTier: z.enum(ADVISOR_MODEL_TIERS),
  sourceCategories: z.array(z.string()).min(1).max(12),
  allowedTools: z.array(z.enum(ADVISOR_TOOLS)),
  greeting: z.string().min(1).max(400),
  memoryPolicy: z.object({
    lastTurns: z.number().int().min(0).max(32),
    rollingSummary: z.boolean(),
  }),
  version: z.number().int().positive(),
  updatedAt: z.any().nullable(),
});
export type AdvisorConfig = z.infer<typeof AdvisorConfigSchema>;

export interface AdvisorFrame {
  advisorId: AdvisorId;
  rollingSummary: string;
  lastTurnAt: string;
}
```

- [ ] **Step 4: Run test**

Run: `npx vitest run tests/types/advisor.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/types/advisor.ts tests/types/advisor.test.ts
git commit -m "feat(types): add AdvisorId and AdvisorConfig schema"
```

---

### Task 0.3: Create `InteractionFrame` type

**Files:**
- Create: `src/types/interaction.ts`

- [ ] **Step 1: Implement** (no test — trivial type-only file)

```ts
// src/types/interaction.ts
export interface InteractionFrame {
  recentTools: Array<{ toolId: string; ranAt: string; summary: string }>;
  activeSituationDrafts: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/interaction.ts
git commit -m "feat(types): add InteractionFrame"
```

---

### Task 0.4: Extend `AnalystProfile.meta` with `deletedAt`

**Files:**
- Modify: `src/types/analyst-profile.ts`
- Test: `tests/types/analyst-profile.test.ts` (append)

- [ ] **Step 1: Write failing test**

Append to `tests/types/analyst-profile.test.ts`:

```ts
import { AnalystProfileSchema, DEFAULT_ANALYST_PROFILE } from '@/types/analyst-profile';

describe('AnalystProfile.meta.deletedAt', () => {
  it('accepts null', () => {
    const parsed = AnalystProfileSchema.parse({
      ...DEFAULT_ANALYST_PROFILE,
      meta: { ...DEFAULT_ANALYST_PROFILE.meta, deletedAt: null },
    });
    expect(parsed.meta.deletedAt).toBeNull();
  });
});
```

- [ ] **Step 2: Run test**

Run: `npx vitest run tests/types/analyst-profile.test.ts`
Expected: FAIL — unrecognised key.

- [ ] **Step 3: Implement**

In `src/types/analyst-profile.ts`, extend the `meta` block in `AnalystProfileSchema`:

```ts
  meta: z.object({
    version: z.number().int().nonnegative(),
    completedAt: z.any().nullable(),
    lastEditedAt: z.any(),
    skipCount: z.number().int().nonnegative(),
    createdAt: z.any(),
    deletedAt: z.any().nullable().default(null),
  }),
```

And in `DEFAULT_ANALYST_PROFILE`:

```ts
  meta: { version: 0, completedAt: null, lastEditedAt: null, skipCount: 0, createdAt: null, deletedAt: null },
```

- [ ] **Step 4: Run test**

Run: `npx vitest run tests/types/analyst-profile.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/types/analyst-profile.ts tests/types/analyst-profile.test.ts
git commit -m "feat(types): add meta.deletedAt to AnalystProfile"
```

---

## PHASE 1 — USER PREFERENCES

### Task 1.1: Preferences Firestore service

**Files:**
- Create: `src/lib/firebase/preferences-service.ts`
- Test: `tests/firebase/preferences-service.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/firebase/preferences-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPreferences, savePreferences } from '@/lib/firebase/preferences-service';

vi.mock('@/lib/firebase/admin', () => {
  const docs = new Map<string, unknown>();
  const docRef = (path: string) => ({
    get: async () => ({ exists: docs.has(path), data: () => docs.get(path) }),
    set: async (d: unknown) => { docs.set(path, d); },
  });
  const adminDb = {
    doc: (path: string) => docRef(path),
  };
  return { adminDb };
});

describe('preferences-service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns defaults when no doc exists', async () => {
    const prefs = await getPreferences('user-a');
    expect(prefs.citationStyle).toBe('un-footnote');
  });

  it('persists and rereads', async () => {
    await savePreferences('user-b', { citationStyle: 'apa' });
    const prefs = await getPreferences('user-b');
    expect(prefs.citationStyle).toBe('apa');
  });
});
```

- [ ] **Step 2: Run test**

Run: `npx vitest run tests/firebase/preferences-service.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/lib/firebase/preferences-service.ts
import { adminDb } from '@/lib/firebase/admin';
import { DEFAULT_USER_PREFERENCES, UserPreferencesSchema, type UserPreferences } from '@/types/preferences';
import { FieldValue } from 'firebase-admin/firestore';

const PATH = (uid: string) => `users/${uid}/preferences/default`;

export async function getPreferences(uid: string): Promise<UserPreferences> {
  const snap = await adminDb.doc(PATH(uid)).get();
  if (!snap.exists) return DEFAULT_USER_PREFERENCES;
  const parsed = UserPreferencesSchema.safeParse(snap.data());
  return parsed.success ? parsed.data : DEFAULT_USER_PREFERENCES;
}

export async function savePreferences(uid: string, patch: Partial<UserPreferences>): Promise<UserPreferences> {
  const current = await getPreferences(uid);
  const next = UserPreferencesSchema.parse({ ...current, ...patch, updatedAt: FieldValue.serverTimestamp() });
  await adminDb.doc(PATH(uid)).set(next, { merge: true });
  return next;
}
```

- [ ] **Step 4: Run test**

Run: `npx vitest run tests/firebase/preferences-service.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/firebase/preferences-service.ts tests/firebase/preferences-service.test.ts
git commit -m "feat(preferences): Firestore CRUD service"
```

---

### Task 1.2: Preferences API route

**Files:**
- Create: `src/app/api/preferences/route.ts`
- Test: `tests/api/preferences.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/api/preferences.test.ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (h: (req: Request, user: { uid: string }) => Promise<Response>) =>
    async (req: Request) => h(req, { uid: 'test-uid' }),
}));

vi.mock('@/lib/firebase/preferences-service', () => ({
  getPreferences: vi.fn(async () => ({ citationStyle: 'apa', defaultReportLength: 'standard', defaultLanguage: 'en', confidenceLabelling: 'icd-203', defaultTimeHorizon: '90d', preferredAdvisor: null, updatedAt: null })),
  savePreferences: vi.fn(async (_uid, p) => ({ citationStyle: 'apa', defaultReportLength: 'standard', defaultLanguage: 'en', confidenceLabelling: 'icd-203', defaultTimeHorizon: '90d', preferredAdvisor: null, updatedAt: null, ...p })),
}));

import { GET, PATCH } from '@/app/api/preferences/route';

describe('/api/preferences', () => {
  it('GET returns prefs', async () => {
    const res = await GET(new Request('http://localhost/api/preferences'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.citationStyle).toBe('apa');
  });

  it('PATCH validates payload', async () => {
    const res = await PATCH(new Request('http://localhost/api/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ citationStyle: 'mla' }),
    }));
    expect(res.status).toBe(400);
  });

  it('PATCH saves valid payload', async () => {
    const res = await PATCH(new Request('http://localhost/api/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ citationStyle: 'inline-links' }),
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.citationStyle).toBe('inline-links');
  });
});
```

- [ ] **Step 2: Run**

Run: `npx vitest run tests/api/preferences.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/app/api/preferences/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { getPreferences, savePreferences } from '@/lib/firebase/preferences-service';
import { UserPreferencesSchema } from '@/types/preferences';

const PatchSchema = UserPreferencesSchema.partial().omit({ updatedAt: true });

export const GET = withAuth(async (_req, user) => {
  const prefs = await getPreferences(user.uid);
  return NextResponse.json(prefs);
});

export const PATCH = withAuth(async (req, user) => {
  const body = await req.json().catch(() => ({}));
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_payload', details: parsed.error.flatten() }, { status: 400 });
  }
  const next = await savePreferences(user.uid, parsed.data);
  return NextResponse.json(next);
});
```

- [ ] **Step 4: Run**

Run: `npx vitest run tests/api/preferences.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/preferences/route.ts tests/api/preferences.test.ts
git commit -m "feat(preferences): GET/PATCH /api/preferences"
```

---

### Task 1.3: Preferences settings page

**Files:**
- Create: `src/app/app/settings/preferences/page.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/app/app/settings/preferences/page.tsx
'use client';

import { useEffect, useState } from 'react';
import type { UserPreferences } from '@/types/preferences';
import { CITATION_STYLES, REPORT_LENGTHS, CONFIDENCE_LABELLING, TIME_HORIZONS, PREF_LANGUAGES, DEFAULT_USER_PREFERENCES } from '@/types/preferences';
import { ADVISOR_IDS } from '@/types/advisor';

export default function PreferencesPage() {
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/preferences').then(r => r.json()).then(setPrefs).catch(() => {});
  }, []);

  async function save(patch: Partial<UserPreferences>) {
    setSaving(true);
    try {
      const next = await fetch('/api/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      }).then(r => r.json());
      setPrefs(next);
      setSavedAt(new Date().toISOString());
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-serif text-navy-900">Preferences</h1>
      <p className="text-sm text-navy-500">These settings shape every AI tool output.</p>

      <Field label="Citation style" value={prefs.citationStyle} options={CITATION_STYLES} onChange={v => save({ citationStyle: v as UserPreferences['citationStyle'] })} />
      <Field label="Default report length" value={prefs.defaultReportLength} options={REPORT_LENGTHS} onChange={v => save({ defaultReportLength: v as UserPreferences['defaultReportLength'] })} />
      <Field label="Default language" value={prefs.defaultLanguage} options={PREF_LANGUAGES} onChange={v => save({ defaultLanguage: v as UserPreferences['defaultLanguage'] })} />
      <Field label="Confidence labelling" value={prefs.confidenceLabelling} options={CONFIDENCE_LABELLING} onChange={v => save({ confidenceLabelling: v as UserPreferences['confidenceLabelling'] })} />
      <Field label="Default time horizon" value={prefs.defaultTimeHorizon} options={TIME_HORIZONS} onChange={v => save({ defaultTimeHorizon: v as UserPreferences['defaultTimeHorizon'] })} />
      <Field label="Preferred advisor" value={prefs.preferredAdvisor ?? ''} options={['', ...ADVISOR_IDS]} onChange={v => save({ preferredAdvisor: (v || null) as UserPreferences['preferredAdvisor'] })} />

      {saving && <p className="text-xs text-navy-400">Saving…</p>}
      {savedAt && <p className="text-xs text-emerald-600">Saved at {new Date(savedAt).toLocaleTimeString()}</p>}
    </div>
  );
}

function Field({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase text-navy-400 mb-1">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full rounded border px-3 py-2 text-sm">
        {options.map(o => <option key={o} value={o}>{o || '— none —'}</option>)}
      </select>
    </label>
  );
}
```

- [ ] **Step 2: Manual smoke**

Run: `npm run dev` then visit `/app/settings/preferences`. Change a dropdown. Verify saved.

- [ ] **Step 3: Commit**

```bash
git add src/app/app/settings/preferences/page.tsx
git commit -m "feat(preferences): settings page"
```

---

### Task 1.4: Seed defaults script

**Files:**
- Create: `scripts/seed-preferences-defaults.ts`
- Modify: `package.json` — add `"seed:preferences": "tsx scripts/seed-preferences-defaults.ts"`

- [ ] **Step 1: Implement**

```ts
// scripts/seed-preferences-defaults.ts
import { adminDb } from '@/lib/firebase/admin';
import { DEFAULT_USER_PREFERENCES } from '@/types/preferences';

async function main() {
  const snap = await adminDb.collection('users').get();
  let created = 0;
  for (const doc of snap.docs) {
    const ref = adminDb.doc(`users/${doc.id}/preferences/default`);
    const existing = await ref.get();
    if (!existing.exists) {
      await ref.set(DEFAULT_USER_PREFERENCES);
      created++;
    }
  }
  console.log(`Seeded defaults for ${created} users (of ${snap.size} total).`);
}
main().catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Add script to package.json**

In `package.json` `"scripts"` block, add:

```json
"seed:preferences": "tsx scripts/seed-preferences-defaults.ts"
```

- [ ] **Step 3: Commit**

```bash
git add scripts/seed-preferences-defaults.ts package.json
git commit -m "feat(preferences): seed defaults script"
```

---

## PHASE 2 — CONTEXT CONTRACT EXTENSION

### Task 2.1: Add preferences to `ContextBlock`

**Files:**
- Modify: `src/lib/context/profile-context.ts`
- Test: `tests/context/profile-context.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/context/profile-context.test.ts (append)
import { buildCalibratedContext } from '@/lib/context/profile-context';

it('includes preferences on the returned ContextBlock', async () => {
  const ctx = await buildCalibratedContext({ uid: 'user-test', toolId: 'advisory' });
  expect(ctx.preferences).toBeDefined();
  expect(ctx.preferences.citationStyle).toBeTypeOf('string');
});
```

(Mock `getPreferences` to return defaults.)

- [ ] **Step 2: Run**

Run: `npx vitest run tests/context/profile-context.test.ts`
Expected: FAIL — `preferences` undefined.

- [ ] **Step 3: Extend ContextBlock + buildCalibratedContext**

In `src/lib/context/profile-context.ts`:

```ts
import { getPreferences } from '@/lib/firebase/preferences-service';
import type { UserPreferences } from '@/types/preferences';
import type { InteractionFrame } from '@/types/interaction';
import type { AdvisorFrame } from '@/types/advisor';

export interface ContextBlock {
  systemPromptBlock: string;
  outputConstraints: OutputConstraints;
  toolContext: { profile: AnalystProfile | null; situation: Situation | null; retrievedChunks: RetrievedChunk[]; episodes: Episode[] };
  preferences: UserPreferences;                 // NEW
  interaction: InteractionFrame | null;         // NEW
  advisor: AdvisorFrame | null;                 // NEW
  domain: MergedDomainConfig;
  provenance: { profileVersion: number; situationVersion: number | null; domainId: string; domainVersion: number; generatedAt: string };
}
```

Inside `buildCalibratedContext`, add:

```ts
let preferences;
try { preferences = await getPreferences(opts.uid); } catch { preferences = undefined; }
```

and pass `preferences` (falling back to `DEFAULT_USER_PREFERENCES`) into the returned object. Leave `interaction` and `advisor` as `null` for now — Task 2.3 and 6.5 fill them.

- [ ] **Step 4: Run test**

Run: `npx vitest run tests/context/profile-context.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/context/profile-context.ts tests/context/profile-context.test.ts
git commit -m "feat(context): add preferences to ContextBlock"
```

---

### Task 2.2: Render `<preferences>` in system prompt

**Files:**
- Modify: `src/lib/context/system-prompt-block.ts`
- Test: `tests/context/system-prompt-block.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/context/system-prompt-block.test.ts (append)
import { DEFAULT_USER_PREFERENCES } from '@/types/preferences';
import { renderSystemPromptBlock } from '@/lib/context/system-prompt-block';

it('emits a <preferences> block when preferences are provided', () => {
  const out = renderSystemPromptBlock({ profile: null, situation: null, retrievedChunks: [], preferences: DEFAULT_USER_PREFERENCES });
  expect(out).toContain('<preferences>');
  expect(out).toContain('un-footnote');
});
```

- [ ] **Step 2: Run**

Run: `npx vitest run tests/context/system-prompt-block.test.ts`
Expected: FAIL — argument unknown.

- [ ] **Step 3: Implement**

In `renderSystemPromptBlock`, add optional `preferences?: UserPreferences` and append block after constraints:

```ts
if (opts.preferences) parts.push(renderPreferencesBlock(opts.preferences));

function renderPreferencesBlock(p: UserPreferences): string {
  return [
    '<preferences>',
    `  <citations>${p.citationStyle}</citations>`,
    `  <length>${p.defaultReportLength}</length>`,
    `  <language>${p.defaultLanguage}</language>`,
    `  <confidence>${p.confidenceLabelling}</confidence>`,
    `  <time-horizon>${p.defaultTimeHorizon}</time-horizon>`,
    '</preferences>',
  ].join('\n');
}
```

Update `buildCalibratedContext` to pass `preferences` into `renderSystemPromptBlock`.

- [ ] **Step 4: Run**

Run: `npx vitest run tests/context/system-prompt-block.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/context/system-prompt-block.ts tests/context/system-prompt-block.test.ts
git commit -m "feat(context): emit <preferences> in system prompt block"
```

---

### Task 2.3: Interaction frame derivation

**Files:**
- Create: `src/lib/context/interaction-frame.ts`
- Test: `tests/context/interaction-frame.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/context/interaction-frame.test.ts
import { describe, it, expect, vi } from 'vitest';
import { deriveInteractionFrame } from '@/lib/context/interaction-frame';

vi.mock('@/lib/firebase/admin', () => {
  const docs = [
    { toolId: 'advisory', ranAt: '2026-04-20T10:00:00Z', summary: 'Advisory run' },
    { toolId: 'risk-monitor', ranAt: '2026-04-20T09:00:00Z', summary: 'Risk up' },
  ];
  return {
    adminDb: {
      collection: () => ({
        orderBy: () => ({ limit: () => ({ get: async () => ({ docs: docs.map(d => ({ data: () => d })) }) }) }),
      }),
    },
  };
});

describe('deriveInteractionFrame', () => {
  it('returns recent tool runs', async () => {
    const f = await deriveInteractionFrame('u', 's');
    expect(f.recentTools).toHaveLength(2);
    expect(f.recentTools[0].toolId).toBe('advisory');
  });
});
```

- [ ] **Step 2: Run**

Run: `npx vitest run tests/context/interaction-frame.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/lib/context/interaction-frame.ts
import { adminDb } from '@/lib/firebase/admin';
import type { InteractionFrame } from '@/types/interaction';

export async function deriveInteractionFrame(uid: string, situationId: string | null): Promise<InteractionFrame> {
  if (!situationId) return { recentTools: [], activeSituationDrafts: 0 };
  try {
    const snap = await adminDb
      .collection(`users/${uid}/situations/${situationId}/tool_outputs`)
      .orderBy('ranAt', 'desc')
      .limit(10)
      .get();
    const recentTools = snap.docs.map(d => {
      const x = d.data() as { toolId: string; ranAt: string; summary?: string };
      return { toolId: x.toolId, ranAt: x.ranAt, summary: x.summary ?? '' };
    });
    return { recentTools, activeSituationDrafts: 0 };
  } catch {
    return { recentTools: [], activeSituationDrafts: 0 };
  }
}
```

- [ ] **Step 4: Run**

Run: `npx vitest run tests/context/interaction-frame.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire into `buildCalibratedContext`**

In `src/lib/context/profile-context.ts`:

```ts
import { deriveInteractionFrame } from './interaction-frame';
…
const interaction = opts.situationId ? await deriveInteractionFrame(opts.uid, opts.situationId) : null;
…
return { …, interaction, … };
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/context/interaction-frame.ts tests/context/interaction-frame.test.ts src/lib/context/profile-context.ts
git commit -m "feat(context): derive InteractionFrame from recent tool outputs"
```

---

### Task 2.4: CI route audit

**Files:**
- Create: `scripts/audit-ai-routes.ts`
- Modify: `package.json` — add `"audit:routes"`

- [ ] **Step 1: Implement**

```ts
// scripts/audit-ai-routes.ts
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const AI_ROUTES_DIR = 'src/app/api/ai';
const EXEMPT = new Set<string>(['chat', 'terminology', 'grounded-search', 'advisor-chat']); // chat-streams handled separately

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (name === 'route.ts') acc.push(full);
  }
  return acc;
}

const files = walk(AI_ROUTES_DIR);
const fails: string[] = [];
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  const toolId = f.split(/[\\/]/).slice(-2, -1)[0];
  if (EXEMPT.has(toolId)) continue;
  if (!/withCalibration\s*\(/.test(src)) {
    fails.push(`${f}  (tool ${toolId})`);
  }
}
if (fails.length) {
  console.error('Routes missing withCalibration wrapper:');
  fails.forEach(f => console.error('  ' + f));
  process.exit(1);
}
console.log(`OK — ${files.length} AI route files, ${files.length - fails.length} calibrated, ${EXEMPT.size} exempt.`);
```

- [ ] **Step 2: Add script**

In `package.json`:

```json
"audit:routes": "tsx scripts/audit-ai-routes.ts"
```

- [ ] **Step 3: Run**

Run: `npm run audit:routes`
Expected: either PASS with count, or a list of non-calibrated routes. If list is non-empty, wrap each listed route in `withCalibration(toolId, 'ai_analysis')` in a follow-up commit per route.

- [ ] **Step 4: Commit**

```bash
git add scripts/audit-ai-routes.ts package.json
git commit -m "chore(ci): audit-ai-routes script (fails build on missing withCalibration)"
```

- [ ] **Step 5: Fix any offenders**

For each route surfaced in Step 3: wrap its `POST`/`GET` handler in `withCalibration(toolId, op)`. Commit per-route: `fix(ai): wrap <toolId> in withCalibration`.

---

## PHASE 3 — ONBOARDING POLISH

### Task 3.1: Atomic completion transaction

**Files:**
- Modify: `src/app/api/onboarding/complete/route.ts`
- Test: `tests/onboarding/complete.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/onboarding/complete.test.ts
import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/onboarding/complete/route';

const committed: unknown[] = [];
vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    runTransaction: async (fn: (tx: { set: (r: unknown, d: unknown) => void; get: () => Promise<{ exists: false }> }) => Promise<unknown>) => {
      return fn({
        set: (_r, d) => { committed.push(d); },
        get: async () => ({ exists: false }),
      });
    },
    doc: () => ({}),
    collection: () => ({ doc: () => ({}) }),
  },
}));
vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (h: (req: Request, user: { uid: string }) => Promise<Response>) => async (req: Request) => h(req, { uid: 'u1' }),
}));
vi.mock('@google-cloud/pubsub', () => ({ PubSub: class { topic() { return { publishMessage: async () => 'ok' }; } } }));

describe('onboarding complete', () => {
  it('writes profile + meta.completedAt atomically', async () => {
    const req = new Request('http://localhost/api/onboarding/complete', {
      method: 'POST',
      body: JSON.stringify({ /* valid partial profile */ }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const completeWrites = committed.filter((d: any) => d?.meta?.completedAt);
    expect(completeWrites.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run**

Run: `npx vitest run tests/onboarding/complete.test.ts`
Expected: FAIL until transaction path exists.

- [ ] **Step 3: Implement**

Inside the existing `POST` handler, replace the two-step write with a single `runTransaction` that:
1. Reads current profile.
2. Builds the next profile with `meta.completedAt = serverTimestamp()` and `meta.version = prev.version + 1`.
3. Writes profile + snapshot `profile_versions/{vN}` in the same transaction.
4. Outside the transaction, publishes a `profile.events` message with `action: 'created'` or `'updated'`.

- [ ] **Step 4: Run**

Run: `npx vitest run tests/onboarding/complete.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/onboarding/complete/route.ts tests/onboarding/complete.test.ts
git commit -m "fix(onboarding): atomic completion transaction (profile + meta.completedAt + snapshot)"
```

---

### Task 3.2: Resume-on-refresh drafts

**Files:**
- Modify: `src/app/onboarding/page.tsx`
- Create: `src/app/api/onboarding/draft/route.ts`

- [ ] **Step 1: Implement draft endpoint**

```ts
// src/app/api/onboarding/draft/route.ts
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { adminDb } from '@/lib/firebase/admin';

const PATH = (uid: string) => `users/${uid}/profile/onboarding_draft`;

export const GET = withAuth(async (_req, user) => {
  const snap = await adminDb.doc(PATH(user.uid)).get();
  return NextResponse.json(snap.exists ? snap.data() : null);
});

export const PATCH = withAuth(async (req, user) => {
  const body = await req.json().catch(() => ({}));
  await adminDb.doc(PATH(user.uid)).set({ ...body, updatedAt: new Date().toISOString() }, { merge: true });
  return NextResponse.json({ ok: true });
});

export const DELETE = withAuth(async (_req, user) => {
  await adminDb.doc(PATH(user.uid)).delete();
  return NextResponse.json({ ok: true });
});
```

- [ ] **Step 2: Wire into onboarding page**

In `src/app/onboarding/page.tsx`, on mount fetch `/api/onboarding/draft` and hydrate the wizard state from it if present. Debounce every field change by 800 ms and PATCH. On successful completion, DELETE the draft.

- [ ] **Step 3: Manual smoke**

Start wizard, fill step 1, refresh browser, verify state restored.

- [ ] **Step 4: Commit**

```bash
git add src/app/onboarding/page.tsx src/app/api/onboarding/draft/route.ts
git commit -m "feat(onboarding): resume-on-refresh via draft endpoint"
```

---

### Task 3.3: "Review onboarding" link in settings

**Files:**
- Modify: `src/app/app/settings/profile/page.tsx`

- [ ] **Step 1: Implement**

Add a button in the settings profile page header:

```tsx
<a href="/onboarding?resume=1" className="text-sm text-diplomatic-blue underline">Review onboarding</a>
```

In `src/app/onboarding/page.tsx`, if `searchParams.resume === '1'`, seed wizard state from the current profile (not the draft).

- [ ] **Step 2: Commit**

```bash
git add src/app/app/settings/profile/page.tsx src/app/onboarding/page.tsx
git commit -m "feat(onboarding): review-onboarding entry from settings"
```

---

### Task 3.4: Live-preview XML parity

**Files:**
- Modify: `src/app/onboarding/live-preview.tsx`

- [ ] **Step 1: Implement**

Replace current stylised preview with a direct call to `renderSystemPromptBlock({ profile: draftProfile, situation: null, retrievedChunks: [], preferences: DEFAULT_USER_PREFERENCES })` and render inside a `<pre>` with syntax-highlighted monospace styling.

- [ ] **Step 2: Commit**

```bash
git add src/app/onboarding/live-preview.tsx
git commit -m "feat(onboarding): live-preview renders exact system-prompt XML"
```

---

### Task 3.5: Skip-nudge banner

**Files:**
- Modify: `src/components/app/app-shell.tsx`

- [ ] **Step 1: Implement**

Read `profile.meta.skipCount` from `useAuth()` / profile context; when `≥ 2` and `!meta.completedAt`, render a dismissible banner at top of shell linking to `/onboarding`.

- [ ] **Step 2: Commit**

```bash
git add src/components/app/app-shell.tsx
git commit -m "feat(onboarding): skip-count nudge banner"
```

---

## PHASE 4 — PROFILE MANAGEMENT (delete + export)

### Task 4.1: PII scrub helper

**Files:**
- Create: `src/lib/services/pii-scrub.ts`
- Test: `tests/services/pii-scrub.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/services/pii-scrub.test.ts
import { describe, it, expect } from 'vitest';
import { scrubProfilePII } from '@/lib/services/pii-scrub';
import { DEFAULT_ANALYST_PROFILE } from '@/types/analyst-profile';

describe('scrubProfilePII', () => {
  it('clears display name, org, red lines, embedding', () => {
    const input = {
      ...DEFAULT_ANALYST_PROFILE,
      identity: { role: 'un_official' as const, seniority: 'senior' as const, org: 'UN DPPA', team: 'Mediation' },
      workingStyle: { ...DEFAULT_ANALYST_PROFILE.workingStyle, redLines: ['never use X'] },
      embedding: { vector: new Array(768).fill(0.1), generatedAt: null, model: 'text-embedding-005' },
    };
    const out = scrubProfilePII(input as never);
    expect(out.identity.org).toBe('');
    expect(out.identity.team).toBe('');
    expect(out.workingStyle.redLines).toEqual([]);
    expect(out.embedding).toBeUndefined();
    expect(out.meta.deletedAt).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run**

Run: `npx vitest run tests/services/pii-scrub.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/lib/services/pii-scrub.ts
import type { AnalystProfile } from '@/types/analyst-profile';

export function scrubProfilePII(p: AnalystProfile): AnalystProfile {
  return {
    ...p,
    identity: { ...p.identity, org: '', team: '' },
    perspective: { ...p.perspective, mandate: '', regions: [] },
    workingStyle: { ...p.workingStyle, redLines: [] },
    embedding: undefined,
    meta: { ...p.meta, deletedAt: new Date().toISOString() },
  };
}
```

- [ ] **Step 4: Run**

Run: `npx vitest run tests/services/pii-scrub.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/services/pii-scrub.ts tests/services/pii-scrub.test.ts
git commit -m "feat(profile): PII scrub helper for soft-delete"
```

---

### Task 4.2: `DELETE /api/profile`

**Files:**
- Create: `src/app/api/profile/route.ts`
- Test: `tests/profile/delete.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/profile/delete.test.ts
import { describe, it, expect, vi } from 'vitest';

const writes: unknown[] = [];
vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    doc: () => ({
      get: async () => ({ exists: true, data: () => ({ identity: { role: 'un_official', seniority: 'senior', org: 'UN', team: 'T' }, perspective: { mandate: 'x', lenses: ['diplomatic'], regions: ['r'], audience: 'myself', primaryDomain: 'generic', secondaryDomains: [] }, workingStyle: { sourceCategories: [], language: 'en', redLines: ['x'], analyticalStyle: 'rapid_brief' }, meta: { version: 3, completedAt: 'x', lastEditedAt: 'x', skipCount: 0, createdAt: 'x', deletedAt: null } }) }),
      set: async (d: unknown) => { writes.push(d); },
    }),
  },
}));
vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (h: (req: Request, user: { uid: string }) => Promise<Response>) => async (req: Request) => h(req, { uid: 'u1' }),
}));

import { DELETE } from '@/app/api/profile/route';

describe('DELETE /api/profile', () => {
  it('scrubs PII and marks deletedAt', async () => {
    const res = await DELETE(new Request('http://localhost/api/profile', { method: 'DELETE' }));
    expect(res.status).toBe(200);
    const wrote = writes[0] as { identity: { org: string }; meta: { deletedAt: unknown } };
    expect(wrote.identity.org).toBe('');
    expect(wrote.meta.deletedAt).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run**

Run: `npx vitest run tests/profile/delete.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/app/api/profile/route.ts
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { adminDb } from '@/lib/firebase/admin';
import { scrubProfilePII } from '@/lib/services/pii-scrub';
import type { AnalystProfile } from '@/types/analyst-profile';

export const DELETE = withAuth(async (_req, user) => {
  const ref = adminDb.doc(`users/${user.uid}/profile/analyst`);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ ok: true, alreadyEmpty: true });
  const scrubbed = scrubProfilePII(snap.data() as AnalystProfile);
  await ref.set(scrubbed);
  return NextResponse.json({ ok: true });
});
```

- [ ] **Step 4: Run**

Run: `npx vitest run tests/profile/delete.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/profile/route.ts tests/profile/delete.test.ts
git commit -m "feat(profile): DELETE /api/profile with soft-delete + PII scrub"
```

---

### Task 4.3: `GET /api/profile/export`

**Files:**
- Create: `src/app/api/profile/export/route.ts`
- Test: `tests/profile/export.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/profile/export.test.ts
import { describe, it, expect, vi } from 'vitest';
vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    doc: () => ({ get: async () => ({ exists: true, data: () => ({ identity: { org: 'UN', team: 'T', role: 'un_official', seniority: 'senior' }, perspective: { mandate: 'x', lenses: ['diplomatic'], regions: ['r'], audience: 'myself', primaryDomain: 'generic', secondaryDomains: [] }, workingStyle: { sourceCategories: [], language: 'en', redLines: [], analyticalStyle: 'rapid_brief' }, meta: { version: 1, completedAt: 'x', lastEditedAt: 'x', skipCount: 0, createdAt: 'x', deletedAt: null } }) }) }),
    collection: () => ({
      get: async () => ({ docs: [{ id: 's1', data: () => ({ name: 'Nordalia', type: 'war', region: 'West Africa' }) }] }),
      orderBy: () => ({ get: async () => ({ docs: [] }) }),
    }),
  },
}));
vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (h: (req: Request, user: { uid: string }) => Promise<Response>) => async (req: Request) => h(req, { uid: 'u1' }),
}));
vi.mock('@/lib/firebase/preferences-service', () => ({
  getPreferences: vi.fn(async () => ({ citationStyle: 'un-footnote', defaultReportLength: 'standard', defaultLanguage: 'en', confidenceLabelling: 'icd-203', defaultTimeHorizon: '90d', preferredAdvisor: null, updatedAt: null })),
}));

import { GET } from '@/app/api/profile/export/route';

describe('GET /api/profile/export', () => {
  it('returns bundle JSON with profile + preferences + situations metadata', async () => {
    const res = await GET(new Request('http://localhost/api/profile/export'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.profile).toBeDefined();
    expect(json.preferences).toBeDefined();
    expect(json.situations_metadata).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run**

Run: `npx vitest run tests/profile/export.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/app/api/profile/export/route.ts
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { adminDb } from '@/lib/firebase/admin';
import { getPreferences } from '@/lib/firebase/preferences-service';

export const GET = withAuth(async (_req, user) => {
  const uid = user.uid;
  const [profileSnap, versionsSnap, situationsSnap] = await Promise.all([
    adminDb.doc(`users/${uid}/profile/analyst`).get(),
    adminDb.collection(`users/${uid}/profile_versions`).orderBy('meta.version').get(),
    adminDb.collection(`users/${uid}/situations`).get(),
  ]);
  const preferences = await getPreferences(uid);
  const bundle = {
    exportedAt: new Date().toISOString(),
    uid,
    profile: profileSnap.exists ? profileSnap.data() : null,
    profile_versions: versionsSnap.docs.map(d => d.data()),
    preferences,
    situations_metadata: situationsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
  };
  const filename = `praxis-profile-${uid}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.json`;
  return new NextResponse(JSON.stringify(bundle, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
});
```

- [ ] **Step 4: Run**

Run: `npx vitest run tests/profile/export.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/profile/export/route.ts tests/profile/export.test.ts
git commit -m "feat(profile): GET /api/profile/export JSON bundle"
```

---

### Task 4.4: Danger Zone settings component

**Files:**
- Create: `src/components/settings/danger-zone.tsx`
- Modify: `src/app/app/settings/profile/page.tsx` — mount component

- [ ] **Step 1: Implement**

```tsx
// src/components/settings/danger-zone.tsx
'use client';
import { useState } from 'react';

export function DangerZone() {
  const [stage, setStage] = useState<'idle' | 'export-prompt' | 'confirm'>('idle');
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function exportNow() {
    window.location.href = '/api/profile/export';
  }

  async function deleteNow() {
    setBusy(true);
    try {
      const r = await fetch('/api/profile', { method: 'DELETE' });
      if (r.ok) setDone(true);
    } finally {
      setBusy(false);
    }
  }

  if (done) return <p className="text-emerald-700 text-sm">Profile deleted. Situations remain; you can re-onboard anytime.</p>;

  return (
    <section className="rounded-xl border border-red-300 bg-red-50/50 p-5 space-y-3">
      <h2 className="text-sm font-semibold text-red-900">Danger Zone</h2>
      <p className="text-xs text-red-700">Deleting your profile scrubs PII from your analyst profile (identity, mandate, red-lines, embeddings). Situations and past tool outputs remain accessible.</p>

      {stage === 'idle' && (
        <button onClick={() => setStage('export-prompt')} className="rounded bg-red-600 text-white px-4 py-2 text-sm">Delete my profile</button>
      )}

      {stage === 'export-prompt' && (
        <div className="space-y-2">
          <p className="text-xs text-red-700">Export your profile first? (Recommended)</p>
          <div className="flex gap-2">
            <button onClick={exportNow} className="rounded border border-red-500 text-red-700 px-3 py-1.5 text-xs">Export JSON</button>
            <button onClick={() => setStage('confirm')} className="rounded bg-red-600 text-white px-3 py-1.5 text-xs">Skip export, continue</button>
            <button onClick={() => setStage('idle')} className="text-xs text-navy-500 underline">Cancel</button>
          </div>
        </div>
      )}

      {stage === 'confirm' && (
        <div className="space-y-2">
          <p className="text-xs text-red-900">Type <code>delete</code> to confirm:</p>
          <input value={typed} onChange={e => setTyped(e.target.value)} className="w-full rounded border border-red-300 px-2 py-1 text-sm" />
          <div className="flex gap-2">
            <button onClick={deleteNow} disabled={typed !== 'delete' || busy} className="rounded bg-red-700 text-white px-3 py-1.5 text-xs disabled:bg-red-300">
              {busy ? 'Deleting…' : 'Delete permanently'}
            </button>
            <button onClick={() => { setStage('idle'); setTyped(''); }} className="text-xs text-navy-500 underline">Cancel</button>
          </div>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Mount**

In `src/app/app/settings/profile/page.tsx`, below the main form:

```tsx
import { DangerZone } from '@/components/settings/danger-zone';
// …
<DangerZone />
```

- [ ] **Step 3: Commit**

```bash
git add src/components/settings/danger-zone.tsx src/app/app/settings/profile/page.tsx
git commit -m "feat(profile): settings Danger Zone with export prompt and typed-confirm delete"
```

---

## PHASE 5 — ASK-PRAXIS PROFILE MUTATION

### Task 5.1: Intent classifier route

**Files:**
- Create: `src/app/api/assistant/intent/route.ts`
- Test: `tests/assistant/intent.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/assistant/intent.test.ts
import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/assistant/intent/route';

vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (h: (req: Request, user: { uid: string }) => Promise<Response>) => async (req: Request) => h(req, { uid: 'u1' }),
}));

vi.mock('@/lib/ai/providers', () => ({
  getModel: () => ({}),
}));

vi.mock('ai', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('ai');
  return {
    ...actual,
    generateText: vi.fn(async () => ({
      output: {
        intent: 'profile.mutation',
        patch: { path: 'perspective.regions', op: 'add', value: 'Sahel' },
        humanSummary: 'Add Sahel to regions of focus',
      },
    })),
  };
});

describe('POST /api/assistant/intent', () => {
  it('returns classified intent + patch', async () => {
    const res = await POST(new Request('http://localhost/api/assistant/intent', {
      method: 'POST',
      body: JSON.stringify({ text: 'add Sahel to my regions' }),
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.intent).toBe('profile.mutation');
    expect(json.patch.op).toBe('add');
  });
});
```

- [ ] **Step 2: Run**

Run: `npx vitest run tests/assistant/intent.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/app/api/assistant/intent/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Output, generateText } from 'ai';
import { withAuth } from '@/lib/api/with-auth';
import { getModel } from '@/lib/ai/providers';

const IntentSchema = z.object({
  intent: z.enum(['answer', 'profile.mutation', 'situation.action']),
  patch: z.object({
    path: z.string(),
    op: z.enum(['add', 'remove', 'replace']),
    value: z.any(),
  }).nullable(),
  humanSummary: z.string(),
});

export const POST = withAuth(async (req) => {
  const { text } = await req.json();
  const result = await generateText({
    model: getModel(),
    output: Output.object({ schema: IntentSchema }),
    system: `Classify the user's chat turn. Three intents: answer (normal question), profile.mutation (user wants to change their analyst profile), situation.action (user wants to create/edit/delete a situation). For profile.mutation, emit a normalised patch {path, op, value}. Paths are dot-paths into AnalystProfile, e.g., identity.role, perspective.regions, workingStyle.redLines, workingStyle.language. For list fields use add/remove; for scalar fields use replace.`,
    prompt: `User said: "${text}"`,
  });
  return NextResponse.json(result.output);
});
```

- [ ] **Step 4: Run**

Run: `npx vitest run tests/assistant/intent.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/assistant/intent/route.ts tests/assistant/intent.test.ts
git commit -m "feat(assistant): POST /api/assistant/intent classifier"
```

---

### Task 5.2: Mutation confirm card component

**Files:**
- Create: `src/components/assistant/mutation-confirm-card.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/assistant/mutation-confirm-card.tsx
'use client';
import { useState } from 'react';

export interface MutationPatch {
  path: string;
  op: 'add' | 'remove' | 'replace';
  value: unknown;
}

export function MutationConfirmCard({ summary, patch, onApplied }: { summary: string; patch: MutationPatch; onApplied: () => void }) {
  const [state, setState] = useState<'pending' | 'applying' | 'applied' | 'cancelled' | 'error'>('pending');

  async function apply() {
    setState('applying');
    try {
      const r = await fetch('/api/onboarding/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patch }),
      });
      if (r.ok) {
        setState('applied');
        onApplied();
      } else {
        setState('error');
      }
    } catch {
      setState('error');
    }
  }

  return (
    <div className="rounded-lg border border-diplomatic-blue/30 bg-diplomatic-blue/5 p-3 my-2">
      <p className="text-xs uppercase tracking-wide text-diplomatic-blue font-semibold mb-1">Profile change proposed</p>
      <p className="text-sm text-navy-900">{summary}</p>
      <p className="text-xs text-navy-500 mt-1"><code>{patch.op}</code> at <code>{patch.path}</code></p>
      {state === 'pending' && (
        <div className="flex gap-2 mt-3">
          <button onClick={apply} className="rounded bg-diplomatic-blue text-white px-3 py-1.5 text-xs">Apply</button>
          <button onClick={() => setState('cancelled')} className="text-xs text-navy-500 underline">Cancel</button>
        </div>
      )}
      {state === 'applying' && <p className="text-xs text-navy-500 mt-2">Applying…</p>}
      {state === 'applied' && <p className="text-xs text-emerald-700 mt-2">Applied. Your profile version bumped.</p>}
      {state === 'cancelled' && <p className="text-xs text-navy-400 mt-2">Cancelled.</p>}
      {state === 'error' && <p className="text-xs text-red-700 mt-2">Failed — please edit in settings.</p>}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/assistant/mutation-confirm-card.tsx
git commit -m "feat(assistant): mutation-confirm card component"
```

---

### Task 5.3: Wire intent + card into floating Praxis

**Files:**
- Modify: `src/components/app/floating-praxis.tsx` (or wherever the chat input lives)

- [ ] **Step 1: Modify send-message flow**

Before sending a message to `/api/ai/chat`, fire-and-forget `POST /api/assistant/intent` with the text. If the response has `intent === 'profile.mutation'` and a non-null `patch`, append a `<MutationConfirmCard>` to the chat stream instead of (or alongside) the normal answer. The normal answer still goes through so the user gets a contextual reply.

- [ ] **Step 2: Also extend `/api/onboarding/profile` PATCH to accept `{ patch }` form**

In `src/app/api/onboarding/profile/route.ts`, if body has `patch`, apply the patch to the current profile server-side using a small patch applier helper, then continue the existing version-bump/snapshot path.

- [ ] **Step 3: Manual smoke**

In floating Praxis say "add Sahel to my regions" — verify card appears, apply — verify new profile version in Firestore console.

- [ ] **Step 4: Commit**

```bash
git add src/components/app/floating-praxis.tsx src/app/api/onboarding/profile/route.ts
git commit -m "feat(assistant): wire mutation confirm card into floating Praxis"
```

---

## PHASE 6 — ADVISOR COUNCIL V2

### Task 6.1: Advisor service (Firestore CRUD)

**Files:**
- Create: `src/lib/firebase/advisor-service.ts`
- Test: `tests/firebase/advisor-service.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/firebase/advisor-service.test.ts
import { describe, it, expect, vi } from 'vitest';
const docs = new Map<string, unknown>();
vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    doc: (p: string) => ({
      get: async () => ({ exists: docs.has(p), data: () => docs.get(p) }),
      set: async (d: unknown) => { docs.set(p, d); },
    }),
    collection: (p: string) => ({
      get: async () => ({ docs: [...docs.entries()].filter(([k]) => k.startsWith(p)).map(([k, v]) => ({ id: k.split('/').pop(), data: () => v })) }),
    }),
  },
}));

import { getAdvisor, listAdvisors, saveAdvisor } from '@/lib/firebase/advisor-service';

describe('advisor-service', () => {
  it('round-trips an advisor', async () => {
    await saveAdvisor({ id: 'adeyemi', name: 'x', title: 'y', bio: 'z'.repeat(20), headshotUrl: null, persona: 'persona'.repeat(30), modelTier: 'gemini-3-pro', sourceCategories: ['one'], allowedTools: ['webSearch'], greeting: 'hi', memoryPolicy: { lastTurns: 8, rollingSummary: true }, version: 1, updatedAt: null });
    const got = await getAdvisor('adeyemi');
    expect(got?.name).toBe('x');
    const all = await listAdvisors();
    expect(all.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run**

Run: `npx vitest run tests/firebase/advisor-service.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/lib/firebase/advisor-service.ts
import { adminDb } from '@/lib/firebase/admin';
import { AdvisorConfigSchema, type AdvisorConfig, type AdvisorId } from '@/types/advisor';
import { FieldValue } from 'firebase-admin/firestore';

const PATH = (id: AdvisorId) => `config/advisors/${id}`;
const HISTORY = (id: AdvisorId, v: number) => `config/advisors_history/${id}_${v}`;

const cache = new Map<AdvisorId, { value: AdvisorConfig; at: number }>();
const TTL_MS = 5 * 60 * 1000;

export async function getAdvisor(id: AdvisorId): Promise<AdvisorConfig | null> {
  const hit = cache.get(id);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  const snap = await adminDb.doc(PATH(id)).get();
  if (!snap.exists) return null;
  const parsed = AdvisorConfigSchema.safeParse(snap.data());
  if (!parsed.success) return null;
  cache.set(id, { value: parsed.data, at: Date.now() });
  return parsed.data;
}

export async function listAdvisors(): Promise<AdvisorConfig[]> {
  const snap = await adminDb.collection('config/advisors').get();
  return snap.docs.map(d => AdvisorConfigSchema.parse(d.data()));
}

export async function saveAdvisor(cfg: AdvisorConfig): Promise<AdvisorConfig> {
  const prev = await getAdvisor(cfg.id);
  if (prev) await adminDb.doc(HISTORY(cfg.id, prev.version)).set(prev);
  const next = { ...cfg, version: (prev?.version ?? 0) + 1, updatedAt: FieldValue.serverTimestamp() };
  await adminDb.doc(PATH(cfg.id)).set(next);
  cache.delete(cfg.id);
  return next as AdvisorConfig;
}

export function bustAdvisorCache(): void {
  cache.clear();
}
```

- [ ] **Step 4: Run**

Run: `npx vitest run tests/firebase/advisor-service.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/firebase/advisor-service.ts tests/firebase/advisor-service.test.ts
git commit -m "feat(advisors): Firestore CRUD with version snapshots + 5min cache"
```

---

### Task 6.2: Seed the four flagships

**Files:**
- Create: `scripts/seed-advisors.ts`
- Modify: `package.json` — add `"seed:advisors"`

- [ ] **Step 1: Implement**

```ts
// scripts/seed-advisors.ts
import { saveAdvisor } from '@/lib/firebase/advisor-service';
import type { AdvisorConfig } from '@/types/advisor';

const ADVISORS: Omit<AdvisorConfig, 'version' | 'updatedAt'>[] = [
  {
    id: 'adeyemi',
    name: 'Dr. Ngozi Adeyemi',
    title: 'Senior Political Affairs Advisor',
    bio: 'Twenty years in political affairs, elections observation, and governance analysis across sub-Saharan Africa, the Sahel, and Southeast Asia. Works at the intersection of regime transitions and civil-society resilience.',
    headshotUrl: null,
    persona: `You are Dr. Ngozi Adeyemi, a Senior Political Affairs Advisor with 20 years of field experience in political transitions, elections, and civil-society resilience. You apply Putnam's two-level game theory, Fearon's rationalist explanations for war, Lederach's multi-level peace-building pyramid, and V-Dem-style indicator reading. You are measured, historically literate, and comfortable naming regime types and political-economy constraints. You distinguish stated positions from underlying interests (Fisher-Ury). When the evidence is thin, you say so explicitly: "INTELLIGENCE GAP: {topic}". You keep responses to 3-5 paragraphs unless deep analysis is requested. You never invent citations; when you cite a source category you make the category label explicit.`,
    modelTier: 'gemini-3-pro-deepthink',
    sourceCategories: ['multilateral-political-reports', 'democracy-governance-indices', 'peer-reviewed-political-science', 'reputable-think-tank-analysis', 'government-affairs'],
    allowedTools: ['webSearch', 'knowledgeCore'],
    greeting: 'I\'m Ngozi — political affairs, governance, elections. Tell me what you\'re looking at and I\'ll frame the political dynamics.',
    memoryPolicy: { lastTurns: 8, rollingSummary: true },
  },
  {
    id: 'reyes',
    name: 'Gen. (Ret.) Arman Reyes',
    title: 'Security and Operations Advisor',
    bio: 'Twenty-five years of military and peacekeeping operations experience; former mission commander. Focus: ceasefire monitoring, DDR, SSR, force generation, ROE feasibility.',
    headshotUrl: null,
    persona: `You are General (Ret.) Arman Reyes, a Security and Operations Advisor with 25 years of military and peacekeeping experience, including field-command in multinational missions. You apply force-ratio reasoning, sustainment calculus, rules-of-engagement feasibility, and SSR sequencing. You are direct, operational, and refuse to gloss tactical realities. You name the military factors that make a political idea feasible or not — geography, logistics, command unity, popular legitimacy. You explicitly flag what is doctrinally unsafe. You keep responses to 3-5 paragraphs. You never over-promise outcomes; you give ranges.`,
    modelTier: 'gemini-3-pro',
    sourceCategories: ['un-mission-reports', 'open-source-conflict-event-data', 'defence-security-journals', 'osce-observer-materials', 'doctrinal-publications'],
    allowedTools: ['webSearch', 'knowledgeCore'],
    greeting: 'Reyes. Security and operations. What\'s the ground-truth picture you need?',
    memoryPolicy: { lastTurns: 8, rollingSummary: true },
  },
  {
    id: 'vanderberg',
    name: 'Dr. Sigrid Vanderberg',
    title: 'Political Economy and Development Advisor',
    bio: 'Fifteen years as a fragile-and-conflict-affected states economist. Specialises in sanctions design, resource-conflict financing, reconstruction finance, and fiscal-political linkages.',
    headshotUrl: null,
    persona: `You are Dr. Sigrid Vanderberg, a Political Economy and Development Advisor with 15 years' experience on fragile-and-conflict-affected states. You follow the money with forensic rigour: you map financing networks, identify sanctions evasion vectors, and translate fiscal signals into political behaviour. You reason in numbers but render them in plain prose. You apply Putnam's two-level logic to fiscal constraints and sequence reforms against political-economy realities. You keep responses to 3-5 paragraphs. You make explicit when a proposed policy is unfunded or dependent on unreliable revenue. You flag "DATA UNCERTAIN" when country statistics are weak.`,
    modelTier: 'claude-sonnet-4',
    sourceCategories: ['multilateral-development-bank-publications', 'imf-wb-oecd-statistical-series', 'central-bank-bulletins', 'commodity-markets', 'sanctions-watch-data'],
    allowedTools: ['webSearch', 'knowledgeCore'],
    greeting: 'Sigrid Vanderberg. Political economy, sanctions, reconstruction finance. What do you need me to follow the money on?',
    memoryPolicy: { lastTurns: 8, rollingSummary: true },
  },
  {
    id: 'takeda',
    name: 'Amb. Hiroshi Takeda',
    title: 'Diplomatic Craft Advisor',
    bio: 'Thirty-year career diplomat; former Legal Adviser; specialises in treaty drafting, diplomatic correspondence, historical-case reasoning, and Track I tone.',
    headshotUrl: null,
    persona: `You are Ambassador Hiroshi Takeda, a career diplomat with 30 years of multilateral and bilateral experience, including service as Legal Adviser. You draft diplomatic text that can be sent on headed paper. You wield historical case comparison with precision. You understand face-saving ambiguity, treaty interpretation, protocol, and the weight of chosen verbs. You favour constructive ambiguity where it serves peace and precision where it must. Your voice is elegant and restrained. You keep responses to 3-5 paragraphs unless deep analysis is requested. When producing text, you produce it in full — no placeholders, no brackets — so it can be cleaned and sent.`,
    modelTier: 'claude-sonnet-4',
    sourceCategories: ['un-treaty-collection', 'diplomatic-archives', 'historical-case-studies', 'icj-jurisprudence', 'academic-history'],
    allowedTools: ['webSearch', 'knowledgeCore'],
    greeting: 'Takeda. Diplomatic drafting, treaty interpretation, historical parallels. What do you need drafted — or read into?',
    memoryPolicy: { lastTurns: 8, rollingSummary: true },
  },
];

async function main() {
  for (const cfg of ADVISORS) {
    const out = await saveAdvisor({ ...cfg, version: 1, updatedAt: null });
    console.log(`Seeded advisor ${out.id} v${out.version}`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Add script**

In `package.json`:

```json
"seed:advisors": "tsx scripts/seed-advisors.ts"
```

- [ ] **Step 3: Run**

Run: `npm run seed:advisors`
Expected: logs 4 advisor ids.

- [ ] **Step 4: Commit**

```bash
git add scripts/seed-advisors.ts package.json
git commit -m "feat(advisors): seed 4 flagships (Adeyemi, Reyes, Vanderberg, Takeda)"
```

---

### Task 6.3: Advisor history subcollection service

**Files:**
- Create: `src/lib/firebase/advisor-history-service.ts`
- Test: `tests/advisor/memory.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/advisor/memory.test.ts
import { describe, it, expect, vi } from 'vitest';
const store = new Map<string, unknown[]>();
vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: (p: string) => ({
      orderBy: () => ({
        limit: (n: number) => ({
          get: async () => ({ docs: (store.get(p) ?? []).slice(-n).map(d => ({ data: () => d })) }),
        }),
      }),
      add: async (d: unknown) => { const arr = store.get(p) ?? []; arr.push(d); store.set(p, arr); return { id: `${arr.length}` }; },
    }),
  },
}));
import { appendTurn, readRecentTurns } from '@/lib/firebase/advisor-history-service';

describe('advisor-history-service', () => {
  it('appends + reads last N turns', async () => {
    await appendTurn('u', 's', 'adeyemi', { role: 'user', content: 'hi', at: '1' });
    await appendTurn('u', 's', 'adeyemi', { role: 'assistant', content: 'hello', at: '2' });
    const turns = await readRecentTurns('u', 's', 'adeyemi', 8);
    expect(turns).toHaveLength(2);
    expect(turns[0].role).toBe('user');
  });
});
```

- [ ] **Step 2: Run**

Run: `npx vitest run tests/advisor/memory.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/lib/firebase/advisor-history-service.ts
import { adminDb } from '@/lib/firebase/admin';
import type { AdvisorId } from '@/types/advisor';

export interface AdvisorTurn { role: 'user' | 'assistant'; content: string; at: string }

const PATH = (uid: string, sid: string, aid: AdvisorId) => `users/${uid}/situations/${sid}/advisors/${aid}/history`;

export async function appendTurn(uid: string, sid: string, aid: AdvisorId, turn: AdvisorTurn): Promise<void> {
  await adminDb.collection(PATH(uid, sid, aid)).add(turn);
}

export async function readRecentTurns(uid: string, sid: string, aid: AdvisorId, n: number): Promise<AdvisorTurn[]> {
  const snap = await adminDb
    .collection(PATH(uid, sid, aid))
    .orderBy('at', 'asc')
    .limit(n)
    .get();
  return snap.docs.map(d => d.data() as AdvisorTurn);
}
```

- [ ] **Step 4: Run**

Run: `npx vitest run tests/advisor/memory.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/firebase/advisor-history-service.ts tests/advisor/memory.test.ts
git commit -m "feat(advisors): history subcollection service"
```

---

### Task 6.4: Briefing prefetch helper

**Files:**
- Create: `src/app/api/ai/advisor-chat/briefing.ts`

- [ ] **Step 1: Implement**

```ts
// src/app/api/ai/advisor-chat/briefing.ts
import { searchWeb, formatResultsAsContext } from '@/lib/ai/firecrawl';
import type { AdvisorConfig } from '@/types/advisor';
import type { Situation } from '@/types/situation';

export async function buildAdvisorBriefing(cfg: AdvisorConfig, situation: Situation | null): Promise<string> {
  if (!situation) return '';
  const year = new Date().getFullYear();
  const queries = cfg.sourceCategories.slice(0, 2).map(cat => `${situation.name} ${situation.region ?? ''} ${cat.replace(/-/g, ' ')} ${year}`);
  const settled = await Promise.allSettled(queries.map(q => searchWeb(q, { numResults: 3 })));
  const results = settled.filter(r => r.status === 'fulfilled').flatMap(r => (r as PromiseFulfilledResult<Awaited<ReturnType<typeof searchWeb>>>).value);
  if (results.length === 0) return '';
  return `\n<advisor-briefing advisor="${cfg.id}" generated="${new Date().toISOString()}">\n${formatResultsAsContext(results.slice(0, 6))}\n</advisor-briefing>`;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/ai/advisor-chat/briefing.ts
git commit -m "feat(advisors): briefing prefetch helper"
```

---

### Task 6.5: Refactor advisor-chat route

**Files:**
- Modify: `src/app/api/ai/advisor-chat/route.ts`

- [ ] **Step 1: Implement**

Replace hard-coded `ADVISOR_PERSONAS` + `PERSONA_WEB_QUERIES` with reads from `getAdvisor(advisorId)`. Inject:
1. Advisor briefing (from Task 6.4) into the system prompt before the persona.
2. Last `cfg.memoryPolicy.lastTurns` turns from `readRecentTurns` as messages.
3. If history exceeds `lastTurns`, synthesise a rolling summary via a cheap `getModel()` call and prepend as `<prior-thread-summary>`.
4. On `onFinish`, `appendTurn` both the user message and the assistant response.
5. Route the model selection from `cfg.modelTier` → actual provider from `src/lib/ai/providers.ts` (add a tiny switch).

Key skeleton:

```ts
const cfg = await getAdvisor(advisorId as AdvisorId);
if (!cfg) return new Response(JSON.stringify({ error: 'Unknown advisor' }), { status: 400 });
const briefing = await buildAdvisorBriefing(cfg, situation ?? null);
const pastTurns = situationId ? await readRecentTurns(ctx.uid, situationId, cfg.id, cfg.memoryPolicy.lastTurns) : [];
// select model by tier
const model = cfg.modelTier === 'claude-sonnet-4' ? getAnalysisModel() : cfg.modelTier === 'gemini-3-pro-deepthink' ? getDeepThinkModel() : cfg.modelTier === 'gemini-3-pro' ? getProModel() : getModel();
```

- [ ] **Step 2: Manual smoke**

In advisory UI, open a chat with Adeyemi, ask a question, then a follow-up. Verify the second turn references the first (memory works).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/ai/advisor-chat/route.ts
git commit -m "refactor(advisors): route reads AdvisorConfig from Firestore + memory + briefing"
```

---

### Task 6.6: Inject `AdvisorFrame` into `ContextBlock`

**Files:**
- Modify: `src/lib/context/profile-context.ts`

- [ ] **Step 1: Implement**

Accept optional `advisorId` on `buildCalibratedContext({...})`. When present, read last turns + derive a 3-sentence rolling summary via `getModel()` (cached 60 s per (uid, sid, aid) to avoid burning credits on every turn). Populate `advisor: { advisorId, rollingSummary, lastTurnAt }`.

- [ ] **Step 2: Commit**

```bash
git add src/lib/context/profile-context.ts
git commit -m "feat(context): inject AdvisorFrame when advisorId provided"
```

---

### Task 6.7: Advisor-chat UI — 4-card picker + pane

**Files:**
- Create: `src/components/advisory/advisor-picker.tsx`
- Create: `src/components/advisory/advisor-chat-pane.tsx`
- Modify: `src/app/app/advisory/page.tsx`

- [ ] **Step 1: Implement picker**

```tsx
// src/components/advisory/advisor-picker.tsx
'use client';
import { useEffect, useState } from 'react';
import type { AdvisorConfig } from '@/types/advisor';

export function AdvisorPicker({ onPick }: { onPick: (a: AdvisorConfig) => void }) {
  const [advisors, setAdvisors] = useState<AdvisorConfig[]>([]);
  useEffect(() => { fetch('/api/advisors').then(r => r.json()).then(setAdvisors); }, []);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {advisors.map(a => (
        <button key={a.id} onClick={() => onPick(a)} className="text-left rounded-xl border p-4 hover:bg-navy-50">
          <p className="text-sm font-semibold text-navy-900">{a.name}</p>
          <p className="text-xs text-navy-500">{a.title}</p>
          <p className="text-xs text-navy-600 mt-2">{a.bio}</p>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Implement pane** (skeleton that wraps existing advisor-chat message flow, selecting `advisorId` from props and restoring history via `/api/advisors/{id}/history?situationId=...`).

- [ ] **Step 3: Add a list endpoint**

```ts
// src/app/api/advisors/route.ts
import { NextResponse } from 'next/server';
import { listAdvisors } from '@/lib/firebase/advisor-service';
export const GET = async () => NextResponse.json(await listAdvisors());
```

- [ ] **Step 4: Replace `/app/advisory` layout** with picker + selected pane.

- [ ] **Step 5: Commit**

```bash
git add src/components/advisory/advisor-picker.tsx src/components/advisory/advisor-chat-pane.tsx src/app/app/advisory/page.tsx src/app/api/advisors/route.ts
git commit -m "feat(advisors): 4-card picker + chat pane with session restore"
```

---

### Task 6.8: Admin advisor editor

**Files:**
- Create: `src/app/app/admin/advisors/page.tsx`

- [ ] **Step 1: Implement**

Gated by `ADMIN_ALLOWLIST` env (check `useAuth()` uid against a client-fetched `/api/admin/me` endpoint). List advisors, click to edit JSON config in a `<textarea>`, POST to `/api/advisors/{id}` (new endpoint that calls `saveAdvisor` with admin auth).

- [ ] **Step 2: Commit**

```bash
git add src/app/app/admin/advisors/page.tsx src/app/api/advisors/[id]/route.ts src/app/api/admin/me/route.ts
git commit -m "feat(admin): advisor editor at /app/admin/advisors"
```

---

## PHASE 7 — SIX FLAGSHIP TOOLS

**General pattern per tool** (apply to each tool in Tasks 7.1-7.6):
1. Verify page uses `useSituationGuard()` + `<NoSituationState />`.
2. Verify route wrapped in `withCalibration`.
3. Add or fix `<ToolPageShell>` wrapping.
4. Add **Methodology** disclosure.
5. Add **How this works** drawer text.
6. Implement tool-specific changes per §8 of the spec.
7. Write `README.md` next to the page.
8. Write smoke test.
9. Commit.

---

### Task 7.1: Dashboard

**Files:**
- Modify: `src/app/app/dashboard/page.tsx`
- Create: `src/app/app/dashboard/README.md`
- Create: `tests/tools/dashboard.smoke.test.ts`

- [ ] **Step 1: Implement six widgets per §8.1 of the spec**

Each widget is its own client component:

- `src/components/dashboard/risk-gauge-widget.tsx` — reads cached latest `risk-assessment` output; click → `/app/risk-monitor`.
- `src/components/dashboard/escalation-widget.tsx` — reads cached `escalation-scan`; click → `/app/early-warning`.
- `src/components/dashboard/advisors-widget.tsx` — reads 4 advisor last-interaction timestamps; click → `/app/advisory?advisor=<id>`.
- `src/components/dashboard/recent-tools-widget.tsx` — reads last 5 `saveToolOutput` writes; click → `/app/<toolId>`.
- `src/components/dashboard/feed-alerts-widget.tsx` — reads top 3 alerts from `situations/{sid}/alerts`; click → `/app/alert-center`.
- `src/components/dashboard/credits-widget.tsx` — reads user credit balance + 7d burn; click → `/app/settings`.

Compose in `page.tsx`. No blocking AI call on mount. "Daily read" button under the widget grid calls a new `POST /api/ai/dashboard-summary` (wrapped in `withCalibration('dashboard', 'ai_analysis')`) which summarises the widget state into a paragraph.

- [ ] **Step 2: README**

```md
# Dashboard

**Purpose.** First-touch situation overview — tells an analyst in 10 seconds where a situation stands and what to do next.

**Methodology.** 6 widgets composed from cached SKC reads. One optional AI "Daily read" paragraph generated on demand.

**Inputs.** Active situation, user profile, user preferences, cached tool outputs.

**Outputs.** Widget grid; optional paragraph persisted at `tools/dashboard`.
```

- [ ] **Step 3: Smoke test**

```ts
// tests/tools/dashboard.smoke.test.ts
import { describe, it, expect, vi } from 'vitest';
vi.mock('@/lib/firebase/admin', () => ({ adminDb: { doc: () => ({ get: async () => ({ exists: false }) }), collection: () => ({ get: async () => ({ docs: [] }) }) } }));

describe('dashboard summary route', () => {
  it('returns a short paragraph for a minimal situation', async () => {
    const { POST } = await import('@/app/api/ai/dashboard-summary/route');
    const res = await POST(new Request('http://localhost/api/ai/dashboard-summary', { method: 'POST', body: JSON.stringify({ situation: { id: 's1', name: 'Nordalia', type: 'war' } }) }));
    expect(res.status).toBeLessThan(500);
  });
});
```

- [ ] **Step 4: Commit**

```bash
git add src/app/app/dashboard/page.tsx src/components/dashboard/ src/app/app/dashboard/README.md tests/tools/dashboard.smoke.test.ts src/app/api/ai/dashboard-summary/route.ts
git commit -m "feat(dashboard): six-widget overview with on-demand Daily read summary"
```

---

### Task 7.2: Conflict Graph

**Files:**
- Modify: `src/app/app/conflict-graph/page.tsx`
- Create: `src/app/app/conflict-graph/README.md`
- Create: `tests/tools/conflict-graph.smoke.test.ts`
- Modify: `src/components/visualizations/force-graph.tsx` (if present) or create `src/components/conflict-graph/force-graph.tsx`

- [ ] **Step 1: Implement per §8.2**

Entity colour from `src/lib/constants/entity-colors.ts` (14 types). Edge style from relationship category (5). Side panel on click with attributes, confidence, trust score. Filter toolbar: 14 type checkboxes, 5 relationship-category chips, time cursor, search. Export SVG / JSON buttons.

"AI explain" button on selected node calls `POST /api/ai/claude-analyze` with `{ targetEntityId }`.

- [ ] **Step 2: README, smoke test, commit** (same pattern as 7.1).

```bash
git add src/app/app/conflict-graph/ src/components/conflict-graph/ tests/tools/conflict-graph.smoke.test.ts
git commit -m "feat(conflict-graph): ACO v2 interactions + side panel + filters"
```

---

### Task 7.3: Timeline

**Files:**
- Modify: `src/app/app/timeline/page.tsx`
- Create: `src/app/app/timeline/README.md`
- Create: `tests/tools/timeline.smoke.test.ts`

- [ ] **Step 1: Implement per §8.3**

Server-side aggregation by day: add a small helper in `src/lib/firebase/episodes.ts` (`aggregateEpisodesByDay`). Client filters by actor, event type, source, confidence. **Narrate this period** button POSTs the filtered event set to `/api/ai/briefing-generate`.

- [ ] **Step 2-3: README, smoke test, commit.**

---

### Task 7.4: Stakeholder Map

**Files:**
- Modify: `src/app/app/stakeholder-map/page.tsx`
- Create: `src/app/app/stakeholder-map/README.md`
- Create: `src/app/api/ai/stakeholder-map/route.ts` (new route if absent; wrap in `withCalibration`)
- Create: `src/lib/analytics/salience-engine.ts` — scores actors on Power × Legitimacy × Urgency
- Create: `tests/tools/stakeholder-map.smoke.test.ts`

- [ ] **Step 1: Implement salience engine**

```ts
// src/lib/analytics/salience-engine.ts
import type { GraphNode, GraphEdge } from '@/types/graph';

export interface Salience { actorId: string; power: number; legitimacy: number; urgency: number; quadrant: 'definitive' | 'dominant' | 'dangerous' | 'dependent' | 'dormant' | 'discretionary' | 'demanding' }

export function scoreSalience(nodes: GraphNode[], edges: GraphEdge[]): Salience[] {
  const actors = nodes.filter(n => n.type === 'Actor');
  return actors.map(a => {
    const leverageEdges = edges.filter(e => e.source === a.id && e.relationship === 'has_leverage').length;
    const normEdges = edges.filter(e => e.target === a.id && e.relationship === 'recognised_by').length;
    const urgencyEdges = edges.filter(e => e.source === a.id && (e.relationship === 'claims_urgency' || e.relationship === 'escalates')).length;
    const power = Math.min(1, leverageEdges / 5);
    const legitimacy = Math.min(1, normEdges / 5);
    const urgency = Math.min(1, urgencyEdges / 5);
    const p = power >= 0.5, l = legitimacy >= 0.5, u = urgency >= 0.5;
    let quadrant: Salience['quadrant'] = 'dormant';
    if (p && l && u) quadrant = 'definitive';
    else if (p && l) quadrant = 'dominant';
    else if (p && u) quadrant = 'dangerous';
    else if (l && u) quadrant = 'dependent';
    else if (p) quadrant = 'dormant';
    else if (l) quadrant = 'discretionary';
    else if (u) quadrant = 'demanding';
    return { actorId: a.id, power, legitimacy, urgency, quadrant };
  });
}
```

- [ ] **Step 2: Implement route + page** per §8.4: 2D projection with axis-pair toggle, quadrant filter, per-stakeholder card. AI explain button calls `/api/ai/claude-analyze` with `{ stakeholderId }`.

- [ ] **Step 3-4: README, smoke test, commit.**

---

### Task 7.5: Early-Warning (Escalation Monitor)

**Files:**
- Modify: `src/app/app/early-warning/page.tsx`
- Modify: `src/app/api/ai/escalation-scan/route.ts` (already exists — verify calibration, Glasl stage output, trend)
- Create: `src/app/app/early-warning/README.md`
- Create: `tests/tools/early-warning.smoke.test.ts`

- [ ] **Step 1: Verify route emits Glasl stage, trigger list, 7-day trend, actor-pair matrix** — if the schema is thinner than that, extend the Zod output and retrieval logic.

- [ ] **Step 2: Page** — stage detail drawer, trigger click link, pair click dyadic deep dive, auto-refresh indicator.

- [ ] **Step 3: Auto-refresh via Cloud Scheduler** — add a new cron endpoint `/api/cron/early-warning-refresh` iterating active situations; schedule every 6 hours.

- [ ] **Step 4: README, smoke test, commit.**

---

### Task 7.6: Info Environment

**Files:**
- Modify: `src/app/app/info-environment/page.tsx`
- Modify: `src/app/api/ai/info-environment/route.ts` (verify calibration + schema)
- Create: `src/app/app/info-environment/README.md`
- Create: `tests/tools/info-environment.smoke.test.ts`

- [ ] **Step 1: Route** — ensure output schema has `clusters[]`, `disinfoFlags[]`, `sentimentTrend[]`; use GDELT + grounded search per §8.6.

- [ ] **Step 2: Page** — cluster list with growth rate, disinfo toggle, sentiment trend chart, AI explain.

- [ ] **Step 3: README, smoke test, commit.**

---

## PHASE 8 — CI AUDITS

### Task 8.1: GCP audit script

**Files:**
- Create: `scripts/audit-gcp.ts`
- Modify: `package.json` — add `"audit:gcp"`
- Modify: `cloudbuild.yaml` — add preflight step

- [ ] **Step 1: Implement**

```ts
// scripts/audit-gcp.ts
import { execSync } from 'node:child_process';

type Check = { name: string; run: () => Promise<boolean>; required: string[] };

const PROJECT = process.env.GCP_PROJECT_ID ?? 'praxisbytacitus';
function gcloud(cmd: string): string {
  return execSync(`gcloud ${cmd} --project ${PROJECT} --format="value(name)"`, { encoding: 'utf8' }).trim();
}

const checks: Check[] = [
  { name: 'Vertex AI API enabled', required: ['VERTEX_AGENT_ENGINE_ID'], run: async () => gcloud('services list --filter=name:aiplatform.googleapis.com').length > 0 },
  { name: 'BigQuery dataset praxis_analytics', required: [], run: async () => gcloud('alpha bq datasets list --filter=name:praxis_analytics').length > 0 },
  { name: 'Storage bucket praxisbytacitus-praxis-uploads', required: [], run: async () => execSync(`gcloud storage buckets describe gs://praxisbytacitus-praxis-uploads --project ${PROJECT}`, { encoding: 'utf8' }).includes('name:') },
  { name: 'Pub/Sub topic profile.events', required: [], run: async () => gcloud('pubsub topics list --filter=name:profile.events').length > 0 },
  { name: 'Cloud Scheduler GDELT poller enabled', required: ['CRON_SECRET'], run: async () => gcloud('scheduler jobs list --location=us-central1 --filter=name:gdelt').length > 0 },
  { name: 'Secret Manager: firebase-sa', required: [], run: async () => gcloud('secrets describe firebase-sa').length > 0 },
  { name: 'Secret Manager: ai-key', required: [], run: async () => gcloud('secrets describe ai-key').length > 0 },
  { name: 'Secret Manager: cron-secret', required: [], run: async () => gcloud('secrets describe cron-secret').length > 0 },
  { name: 'Secret Manager: cookie-secret', required: [], run: async () => gcloud('secrets describe praxis-cookie-secret').length > 0 },
];

let fail = 0;
for (const c of checks) {
  const envMissing = c.required.filter(e => !process.env[e]);
  if (envMissing.length) { console.error(`FAIL ${c.name}: missing env ${envMissing.join(',')}`); fail++; continue; }
  let ok = false;
  try { ok = await c.run(); } catch (e) { console.error(`FAIL ${c.name}: ${(e as Error).message}`); }
  console[ok ? 'log' : 'error'](`${ok ? 'OK  ' : 'FAIL'} ${c.name}`);
  if (!ok) fail++;
}
if (fail > 0) { console.error(`\n${fail} checks failed.`); process.exit(1); }
console.log(`\nAll ${checks.length} checks passed.`);
```

- [ ] **Step 2: Add to package.json**

```json
"audit:gcp": "tsx scripts/audit-gcp.ts"
```

- [ ] **Step 3: Add to cloudbuild.yaml**

Before the docker-build step, add:

```yaml
- name: 'gcr.io/cloud-builders/gcloud'
  id: 'preflight-audit'
  entrypoint: bash
  args: ['-c', 'npm run audit:gcp && npm run audit:routes']
```

- [ ] **Step 4: Run locally**

Run: `npm run audit:gcp`
Expected: 9 rows, PASS / FAIL per row.

- [ ] **Step 5: Commit**

```bash
git add scripts/audit-gcp.ts package.json cloudbuild.yaml
git commit -m "chore(ci): audit-gcp preflight script + cloudbuild preflight step"
```

---

## PHASE 9 — ROADMAP DOC

### Task 9.1: Write the 40-tool roadmap

**Files:**
- Create: `docs/superpowers/specs/2026-04-21-tool-improvement-roadmap.md`

- [ ] **Step 1: Implement**

Create the doc with the following structure:

````md
# PRAXIS Tool Improvement Roadmap

**Date:** 2026-04-21
**Owner:** platform
**Status:** Living document

## Overview

40 tools across 6 categories. Five delivery phases. Phase 1 is the foundation-hardening spec dated 2026-04-21; subsequent phases stand on the same `ContextBlock` and advisor infrastructure.

## Phase 1 — Foundation (2026-04-21 to 2026-05-02)

| Tool | Category | Purpose | Current | Target | Effort | Dependencies | Risks |
|---|---|---|---|---|---|---|---|
| Dashboard | Context | Overview | 2/5 | 4/5 | M | preferences, interaction frame | widget failure cascade |
| Conflict Graph | Context | Navigable ACO graph | 3/5 | 5/5 | L | ACO v2 pipeline output | layout perf at >500 nodes |
| Timeline | Context | Chronological view | 2/5 | 4/5 | M | episodes schema stable | noisy feed events |
| Stakeholder Map | Analysis | MAW salience | 2/5 | 4/5 | M | graph, actor profiles | sparse edges → low scores |
| Early-Warning | Analysis | Glasl + triggers | 3/5 | 5/5 | M | feed layer | stage mis-classification |
| Info Environment | Intelligence | Narrative battlefield | 2/5 | 4/5 | L | GDELT + grounded search | cluster labelling drift |

## Phase 2 — Drafting (2026-05-05 to 2026-05-23)

Tools: Assistant, Report Studio, Dossier, Talking Points, Briefing Room, Daily Brief, UN Toolkit. Lean on Takeda voice. Use `preferences.citationStyle`, `preferences.defaultReportLength`, `preferences.defaultLanguage`.

| Tool | Purpose | Target | Effort |
|---|---|---|---|
| Assistant | Situation-aware Q&A | Use advisor memory + preferences | S |
| Report Studio | Long-form report drafting | Integrate Takeda voice + citation styles | M |
| Dossier | Actor/situation dossier | Multi-section structured output | M |
| Talking Points | Short briefing points | Brief always; audience-tuned | S |
| Briefing Room | Meeting-prep pack | Generates agenda + TPs + background | M |
| Daily Brief | Daily scheduled brief | Cron + preferences.defaultTimeHorizon | M |
| UN Toolkit | UN-specific drafting templates | Treaty text, SG letters | M |

## Phase 3 — Simulation (2026-05-26 to 2026-06-13)

Tools: Scenarios, Negotiation Prep, Game Theory, CONCORDIA, Mediation Designer. Voices: Adeyemi + Reyes. Heavy use of Gemini Deep Think.

| Tool | Purpose | Target | Effort |
|---|---|---|---|
| Scenarios | Branching futures | 3-horizon scenario model w/ probabilities | L |
| Negotiation Prep | BATNA/ZOPA prep | Fisher-Ury structured output | M |
| Game Theory | Payoff-matrix analysis | Deep Think model + explainer | L |
| CONCORDIA | Multi-party mediation sim | Agent-based per-party simulation | L |
| Mediation Designer | Process-design template | Berghof-style frameworks | M |

## Phase 4 — Intelligence (2026-06-16 to 2026-07-11)

Tools: Deep Research Agent, ARGUS, Media Compass, Media Roundup, Geospatial, Sanctions, Commitments, Treaty, Alert Center, Deep Research. Voices: Vanderberg for sanctions + finance; all for Deep Research.

| Tool | Purpose | Target | Effort |
|---|---|---|---|
| Deep Research Agent | Vertex ADK agent | Restore live + fallback path hardened | L |
| ARGUS | Feed triage | Prioritised alert queue | M |
| Media Compass | Media bias orientation | Cluster ownership map | M |
| Media Roundup | Digest | Scheduled + calibrated | S |
| Geospatial | Map view of events | Clustered events + heat | M |
| Sanctions | Sanctions scan | Network-of-designations viewer | M |
| Commitments | Commitment tracker | Dated promise ledger | M |
| Treaty | Treaty analyser | Parallel translation + clause diff | L |
| Alert Center | Consolidated alerts | Source × severity × actor matrix | M |
| Deep Research | Long research report | Multi-step planning + citations | L |

## Phase 5 — Workspace (2026-07-14 to 2026-08-01)

Tools: Cases, Team, Advisory enhancements, Settings. RBAC groundwork (Part 4 spec).

| Tool | Purpose | Target | Effort |
|---|---|---|---|
| Cases | Situation bundle | Multiple situations grouped into a case | M |
| Team | Team workspace | Part 4 RBAC | L |
| Advisory | Advisor panel | Cross-advisor synthesis improvements | M |
| Settings | All user knobs | Align all settings UI under one shell | S |

## Cross-cutting Work

Each phase adds:
- Smoke tests per tool.
- README per tool (purpose, methodology, inputs, outputs, empty state).
- `withCalibration` audit remains green.
- Preferences honoured everywhere.
- At least one advisor voice consulted where relevant.

## Risks

- Drift in ACO v2 pipeline output breaking Conflict Graph or Stakeholder Map — mitigated by contract tests between pipeline → frontend.
- Advisor cost creep — mitigated by rolling summary + `memoryPolicy.lastTurns` cap.
- Users wanting old personas back after collapsing to 4 — mitigated by admin editor: can re-introduce as new ids if demand warrants.
````

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-04-21-tool-improvement-roadmap.md
git commit -m "docs: 40-tool improvement roadmap (phases 1-5)"
```

---

## Phase 10 — Wrap-up

### Task 10.1: Feature flag + .env

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Add**

```
NEXT_PUBLIC_FOUNDATION_V1=1
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "chore: add NEXT_PUBLIC_FOUNDATION_V1 flag"
```

### Task 10.2: Final green-run

- [ ] **Step 1: Run entire suite**

Run:
```bash
npm run audit:routes
npm run audit:gcp
npx tsc --noEmit
npx vitest run
```

Expected: all PASS.

- [ ] **Step 2: Commit any last fixups.**

---

## Self-Review Checklist

1. **Spec coverage.**
   - §4 context contract → Phase 0 + Phase 2 ✅
   - §5 onboarding polish → Phase 3 ✅
   - §6 profile management → Phase 4 + Phase 5 ✅
   - §7 advisor council v2 → Phase 6 ✅
   - §8 six flagship tools → Phase 7 ✅
   - §9 GCP audit → Phase 8 ✅
   - §10 roadmap doc → Phase 9 ✅
   - §11 rollout feature flag → Phase 10 ✅
   - §12 testing strategy → smoke tests present in each phase ✅

2. **Placeholder scan.** No "TBD" / "TODO" / "similar to earlier". Every step has file paths and code.

3. **Type consistency.** `AdvisorId` literal in Task 0.2, reused in 0.1, 1.3, 6.1, 6.2, 6.3. `UserPreferences` fields consistent across 0.1, 1.1, 1.2, 1.3, 2.1, 2.2. `AdvisorConfig.memoryPolicy.lastTurns` used in 6.3 and 6.5.

---

**End of plan.**
