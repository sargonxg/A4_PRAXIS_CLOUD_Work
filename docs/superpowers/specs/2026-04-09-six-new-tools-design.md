# Design Spec: 6 New PRAXIS Tools
**Date:** 2026-04-09  
**Status:** Approved  
**Scope:** Add 6 new tools to the PRAXIS platform — 4 analysis, 2 intelligence

---

## 1. Overview

Add the following tools end-to-end (API route → tool registry → app page → demo stub):

| # | ID | Name | Category | Credits |
|---|---|---|---|---|
| 1 | `legal-tracker` | International Law & Resolution Tracker | intelligence | 2 |
| 2 | `external-actors` | Diaspora & External Actor Monitor | intelligence | 2 |
| 3 | `economic-impact` | Economic Impact Analyzer | analysis | 2 |
| 4 | `peacebuilding-index` | Peacebuilding Index | analysis | 2 |
| 5 | `human-rights` | Human Rights Monitor | analysis | 3 |
| 6 | `electoral-risk` | Electoral Violence Risk | analysis | 3 |

**Implementation order:** 1 → 2 → 3 → 4 → 5 → 6 (ascending complexity).

---

## 2. Architecture

Each tool produces exactly four artifacts:

```
src/app/api/ai/<tool-id>/route.ts          — API route
src/app/app/<tool-id>/page.tsx             — App page ('use client')
src/app/demo/<tool-id>/page.tsx            — Demo stub (re-export)
src/lib/constants/tool-registry.ts         — Registry entry (append)
```

Plus three shared file modifications:
- `src/lib/services/tool-data-service.ts` — add 6 new `ToolName` literals
- `src/lib/api/with-credits.ts` — add 6 new credit cost entries
- `src/lib/ai/web-research.ts` — export `formatWebResearchAsContext(results)` helper

---

## 3. Shared Utility: `formatWebResearchAsContext`

Add to `src/lib/ai/web-research.ts` as a named export:

```ts
export function formatWebResearchAsContext(results: WebResearchResult[]): string {
  if (!results.length) return 'No web intelligence available.';
  return results
    .map((r, i) =>
      `[${i + 1}] ${r.title}\nSource: ${r.source}${r.publishedDate ? ` (${r.publishedDate})` : ''}\nURL: ${r.url}\n${r.content || r.snippet || '(no content)'}`
    )
    .join('\n\n---\n\n');
}
```

---

## 4. Shared API Route Pattern

All 6 routes follow this exact structure:

```ts
import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getProModel } from '@/lib/ai/providers';
import { buildToolContext } from '@/lib/ai/situation-context';
import { buildGraphContext, writeToolDataServer } from '@/lib/ai/context-builder-server';
import { withAuth } from '@/lib/api/with-auth';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { validateAiRequest } from '@/lib/api/validate-request';
import { handleRouteError } from '@/lib/api/standard-error';
import { executeWebResearch, formatWebResearchAsContext } from '@/lib/ai/web-research';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

// [TOOL_SCHEMA] — Zod schema per tool

// [DEMO_RESPONSE] — Nordalia-themed static response

export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json();
    const requestSchema = z.object({ situation: z.any().optional() });
    const validation = validateAiRequest(body, requestSchema);
    if (!validation.success) return validation.response;
    const { situation } = validation.data;
    const sit = situation as Situation | undefined;
    const sitContext = sit ? buildToolContext(sit) : '';
    const situationId = sit?.id ?? '';

    if (isServerDemoMode()) return NextResponse.json(DEMO_RESPONSE);

    const creditCheck = await checkAndDeductCredits('[CREDIT_KEY]', '[LABEL]');
    if (!creditCheck.allowed) return creditCheck.response;

    const graphCtx = situationId
      ? await buildGraphContext(user.uid, situationId, '[TOOL_FIRESTORE_KEY]')
      : '';

    const webResults = await executeWebResearch(
      '[PRIMARY_QUERY]',
      sit?.name ?? '',
      user.uid,
      { toolId: '[TOOL_ID]', region: sit?.region, actors: sit?.actors, maxResults: 8 }
    );
    const webContext = formatWebResearchAsContext(webResults);

    const result = await generateText({
      model: getProModel(),
      output: Output.object({ schema: [TOOL_SCHEMA] }),
      system: '[SYSTEM_PROMPT]',
      prompt: `[PROMPT_BODY]`,
    });

    if (situationId) {
      await writeToolDataServer(user.uid, situationId, '[TOOL_FIRESTORE_KEY]', result.output as Record<string, unknown>);
    }
    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, '[TOOL_ID]');
  }
});
```

---

## 5. Tool Specifications

### 5.1 `legal-tracker` — International Law & Resolution Tracker

**Credits:** 2 | **Firestore key:** `legal_tracker` | **Credit key:** `ai_legal_tracker`

**Zod Schema:**
```ts
const LegalTrackerSchema = z.object({
  unscResolutions: z.array(z.object({
    number: z.string(),
    date: z.string(),
    type: z.enum(['Chapter VI', 'Chapter VII', 'Presidential Statement', 'Press Statement']),
    keyProvisions: z.array(z.string()),
    complianceStatus: z.enum(['complied', 'partial', 'violated', 'pending', 'unknown']),
    notes: z.string(),
  })),
  iccProceedings: z.array(z.object({
    caseRef: z.string(),
    stage: z.enum(['preliminary examination', 'investigation', 'pre-trial', 'trial', 'appeal', 'closed']),
    charges: z.array(z.string()),
    suspects: z.array(z.string()),
    latestDevelopment: z.string(),
  })),
  icjCases: z.array(z.object({
    parties: z.string(),
    issue: z.string(),
    status: z.string(),
    latestRuling: z.string().optional(),
  })),
  legalObligations: z.array(z.object({
    source: z.string(),
    obligation: z.string(),
    complianceLevel: z.enum(['high', 'medium', 'low', 'unknown']),
    notes: z.string(),
  })),
  upcomingLegalEvents: z.array(z.object({
    date: z.string(),
    body: z.string(),
    description: z.string(),
    significance: z.string(),
  })),
  intelligenceGaps: z.array(z.string()),
  confidence: z.enum(['high', 'medium', 'low']),
});
```

**Search queries:**
- Primary: `{situation} UN Security Council resolution`
- Focused: `{situation} ICC investigation indictment`, `{situation} ICJ case ruling`, `{country} international law compliance`

**System prompt:** Senior international legal analyst specializing in UN Charter law, ICC Rome Statute, Geneva Conventions.

**Demo response:** Nordalia UNSC Res 2875 (arms embargo), Res 2890 (sanctions), ICC preliminary examination on DRM/AFN atrocities, ICJ pending advisory opinion on buffer zone sovereignty, upcoming UNSC renewal vote.

**Registry entry:**
- frameworks: `['UN Charter', 'Rome Statute (ICC)', 'ICJ Statute', 'Geneva Conventions']`
- dataSources: `['UN Document Portal', 'ICC', 'ICJ', 'OHCHR']`
- relatedTools: `['sanctions', 'commitments', 'treaty-analyzer']`

---

### 5.2 `external-actors` — Diaspora & External Actor Monitor

**Credits:** 2 | **Firestore key:** `external_actors` | **Credit key:** `ai_external_actors`

**Zod Schema:**
```ts
const ExternalActorsSchema = z.object({
  externalActors: z.array(z.object({
    name: z.string(),
    type: z.enum(['state', 'diaspora', 'proxy', 'INGO', 'multilateral', 'private-sector']),
    involvement: z.array(z.enum(['military', 'financial', 'diplomatic', 'informational', 'humanitarian'])),
    alignment: z.string().describe('Which party/side they support or their stance'),
    leverage: z.string().describe('What leverage they hold and how they exercise it'),
    recentActions: z.array(z.string()),
  })),
  remittanceFlows: z.object({
    estimate: z.string(),
    mainChannels: z.array(z.string()),
    conflictRelevance: z.string(),
  }).optional(),
  armsFlows: z.object({
    knownSuppliers: z.array(z.string()),
    routes: z.array(z.string()),
    embargoBreach: z.boolean(),
  }).optional(),
  diplomaticInterventions: z.array(z.object({
    actor: z.string(),
    type: z.string(),
    description: z.string(),
    outcome: z.string(),
  })),
  proxyDynamics: z.string().describe('Analysis of proxy relationships and their conflict impact'),
  intelligenceGaps: z.array(z.string()),
  confidence: z.enum(['high', 'medium', 'low']),
});
```

**Search queries:**
- Primary: `{situation} diaspora mobilization support`
- Focused: `{situation} foreign fighters arms supply`, `{situation} proxy support external funding`, `{country} regional interference sanctions`

**System prompt:** Senior analyst specializing in transnational conflict dynamics, diaspora mobilization, proxy warfare, and external actor interference.

**Demo response:** Karovia (state, military/diplomatic), Westmark diaspora network (financial, DRM support), Westmark government (diplomatic), IGAD/AU (multilateral mediation), private arms brokers (financial + military).

**Registry entry:**
- frameworks: `['Salehyan Proxy War Theory', 'Gleditsch Transnational Dimensions', 'Diaspora Mobilization Theory']`
- dataSources: `['SIPRI', 'ACLED', 'FATF reports', 'UN Panel of Experts']`
- relatedTools: `['sanctions', 'actor-profiles', 'conflict-graph']`

---

### 5.3 `economic-impact` — Economic Impact Analyzer

**Credits:** 2 | **Firestore key:** `economic_impact` | **Credit key:** `ai_economic_impact`

**Zod Schema:**
```ts
const EconomicImpactSchema = z.object({
  macroIndicators: z.object({
    gdpGrowth: z.string(),
    inflation: z.string(),
    unemployment: z.string(),
    debtToGdp: z.string(),
    tradeBalance: z.string(),
    currencyDepreciation: z.string().optional(),
    confidence: z.enum(['high', 'medium', 'low']),
  }),
  sanctionsImpact: z.object({
    targetedEntities: z.array(z.string()),
    sectorEffects: z.array(z.object({ sector: z.string(), impact: z.string() })),
    circumventionRisks: z.array(z.string()),
  }).optional(),
  reconstructionEstimate: z.object({
    infrastructure: z.string(),
    institutional: z.string(),
    social: z.string(),
    totalRange: z.string(),
    keyNeeds: z.array(z.string()),
  }),
  warEconomyActors: z.array(z.object({
    actor: z.string(),
    benefitMechanism: z.string(),
    peaceIncentive: z.enum(['high', 'medium', 'low', 'none']),
  })),
  peaceEconomicDividend: z.object({
    estimatedGain: z.string(),
    keyDrivers: z.array(z.string()),
    timeHorizon: z.string(),
  }),
  recommendations: z.array(z.string()),
  intelligenceGaps: z.array(z.string()),
  confidence: z.enum(['high', 'medium', 'low']),
});
```

**Search queries:**
- Primary: `{country} GDP economic impact conflict war`
- Focused: `{country} sanctions economic effect trade`, `{country} reconstruction cost estimate World Bank`, `{country} inflation unemployment economic crisis`

**System prompt:** Senior conflict economist specializing in World Bank FCV framework, IMF post-conflict methodology, and war economy analysis.

**Demo response:** Nordalia GDP contraction -8.4%, inflation 47%, currency -36.4%, reconstruction estimate $2.1B, war economy beneficiaries (coltan extraction, arms supply chain), peace dividend $890M/year.

**Registry entry:**
- frameworks: `['World Bank Conflict Assessment Framework', 'IMF Post-Conflict Methodology', 'Political Economy of Conflict']`
- dataSources: `['World Bank', 'IMF', 'ACLED', 'SIPRI']`
- relatedTools: `['risk-monitor', 'sanctions', 'actor-profiles']`

---

### 5.4 `peacebuilding-index` — Peacebuilding Index

**Credits:** 2 | **Firestore key:** `peacebuilding_index` | **Credit key:** `ai_peacebuilding_index`

**Zod Schema:**
```ts
const PeacebuildingIndexSchema = z.object({
  pillars: z.object({
    security: z.object({
      score: z.number().min(0).max(10),
      subIndicators: z.object({ ssrProgress: z.string(), ddrStatus: z.string(), salwControl: z.string() }),
      evidence: z.array(z.string()),
    }),
    ruleOfLaw: z.object({
      score: z.number().min(0).max(10),
      subIndicators: z.object({ judicialReform: z.string(), transitionalJustice: z.string(), prisonReform: z.string() }),
      evidence: z.array(z.string()),
    }),
    governance: z.object({
      score: z.number().min(0).max(10),
      subIndicators: z.object({ electoralIntegrity: z.string(), decentralization: z.string(), antiCorruption: z.string() }),
      evidence: z.array(z.string()),
    }),
    economicRecovery: z.object({
      score: z.number().min(0).max(10),
      subIndicators: z.object({ jobCreation: z.string(), infrastructureRebuild: z.string(), tradeRestoration: z.string() }),
      evidence: z.array(z.string()),
    }),
    socialCohesion: z.object({
      score: z.number().min(0).max(10),
      subIndicators: z.object({ reconciliationProgress: z.string(), educationAccess: z.string(), diasporaReintegration: z.string() }),
      evidence: z.array(z.string()),
    }),
    humanRights: z.object({
      score: z.number().min(0).max(10),
      subIndicators: z.object({ accountability: z.string(), reparationsProgress: z.string(), hrMonitoring: z.string() }),
      evidence: z.array(z.string()),
    }),
  }),
  compositeIndex: z.number().min(0).max(100).describe('Weighted composite score: Security 25%, Rule of Law 20%, Governance 20%, Economic Recovery 15%, Social Cohesion 10%, Human Rights 10%. +5% bonus available for exceptional progress'),
  trend: z.enum(['improving', 'stable', 'deteriorating']),
  comparatorCases: z.array(z.object({ country: z.string(), score: z.number(), lesson: z.string() })),
  priorityActions: z.array(z.string()),
  intelligenceGaps: z.array(z.string()),
  confidence: z.enum(['high', 'medium', 'low']),
});
```

**Search queries:**
- Primary: `{country} peacebuilding progress governance reform`
- Focused: `{country} security sector reform SSR DDR`, `{country} transitional justice reconciliation`, `{country} economic recovery reconstruction`

**System prompt:** Senior peacebuilding analyst applying UN Peacebuilding Commission methodology and World Bank FCV framework.

**Demo response:** Nordalia composite 24/100 — Security 3/10 (ceasefire fragile, no SSR), Rule of Law 2/10 (courts paralyzed), Governance 4/10 (elections on hold), Economic Recovery 2/10 (reconstruction not started), Social Cohesion 3/10 (displacement ongoing), Human Rights 2/10 (ICC preliminary stage). Comparators: Liberia 2005, Sierra Leone 2002.

**Registry entry:**
- frameworks: `['UN Peacebuilding Commission Methodology', 'World Bank FCV Framework', 'IEP Global Peace Index']`
- dataSources: `['World Bank', 'UN Peacebuilding Commission', 'IEP']`
- relatedTools: `['risk-monitor', 'early-warning', 'human-rights']`

---

### 5.5 `human-rights` — Human Rights Monitor

**Credits:** 3 | **Firestore key:** `human_rights` | **Credit key:** `ai_human_rights`

**Zod Schema:**
```ts
const HumanRightsSchema = z.object({
  violations: z.array(z.object({
    type: z.enum(['extrajudicial killing', 'torture', 'arbitrary detention', 'forced displacement', 'SGBV', 'child soldier recruitment', 'starvation as weapon', 'attack on civilians', 'attack on infrastructure', 'enforced disappearance']),
    perpetrator: z.string(),
    scale: z.enum(['isolated', 'systematic', 'widespread']),
    evidenceLevel: z.enum(['documented', 'credible allegation', 'under investigation', 'denied']),
    legalFrameworkViolated: z.array(z.string()).describe('IHL/IHRL instruments violated, e.g. "GC IV Art. 3", "ICCPR Art. 7"'),
    latestIncident: z.string(),
    icpReporting: z.string().describe('ICD 203 probability language: confirmed/likely/possible/unlikely'),
  })),
  accountabilityMechanisms: z.array(z.object({
    type: z.enum(['ICC', 'ICJ', 'national court', 'hybrid tribunal', 'truth commission', 'sanctions', 'UN inquiry']),
    status: z.string(),
    coverage: z.string().describe('Which violations/perpetrators are covered'),
    gaps: z.string(),
  })),
  accessAssessment: z.object({
    ohchrAccess: z.enum(['full', 'partial', 'denied', 'unknown']),
    ingoAccess: z.enum(['full', 'partial', 'denied', 'unknown']),
    mediaAccess: z.enum(['full', 'partial', 'denied', 'unknown']),
    constraints: z.array(z.string()),
  }),
  protectionConcerns: z.array(z.string()),
  recommendations: z.array(z.string()),
  intelligenceGaps: z.array(z.string()),
  confidence: z.enum(['high', 'medium', 'low']),
});
```

**Search queries:**
- Primary: `{situation} human rights violations report`
- Focused: `{situation} international humanitarian law IHL`, `{country} ICC investigation accountability`, `{situation} civilian protection OHCHR`

**System prompt:** Senior human rights analyst with expertise in IHL, Geneva Conventions, Rome Statute, and OHCHR reporting methodology. Apply ICD 203 probability language for all assessments.

**Demo response:** Nordalia AFN/DRM violations — extrajudicial killings (systematic, documented, GC IV Art.3), arbitrary detention (systematic, Belara facility), forced displacement (widespread); ICC preliminary examination open; OHCHR partial access; HRW/Amnesty reporting on Kessara corridor.

**Registry entry:**
- frameworks: `['Geneva Conventions (IHL)', 'ICCPR/ICESCR', 'Rome Statute (ICC)', 'UPR Methodology']`
- dataSources: `['HRW', 'Amnesty International', 'OHCHR', 'ICRC']`
- relatedTools: `['legal-tracker', 'peacebuilding-index', 'commitments']`

---

### 5.6 `electoral-risk` — Electoral Violence Risk

**Credits:** 3 | **Firestore key:** `electoral_risk` | **Credit key:** `ai_electoral_risk`

**Zod Schema:**
```ts
const ElectoralRiskSchema = z.object({
  electionDetails: z.object({
    scheduledDate: z.string(),
    type: z.enum(['presidential', 'parliamentary', 'local', 'constitutional referendum', 'transitional', 'unknown']),
    electoralSystem: z.string(),
    keyContestants: z.array(z.string()),
    administrationBody: z.string(),
    commissionCredibility: z.enum(['high', 'medium', 'low', 'compromised']),
  }),
  riskIndicators: z.object({
    structural: z.array(z.object({
      indicator: z.string(),
      level: z.enum(['high', 'medium', 'low']),
      evidence: z.string(),
    })),
    institutional: z.array(z.object({
      indicator: z.string(),
      level: z.enum(['high', 'medium', 'low']),
      evidence: z.string(),
    })),
    behavioral: z.array(z.object({
      indicator: z.string(),
      level: z.enum(['high', 'medium', 'low']),
      evidence: z.string(),
    })),
  }),
  phaseRisks: z.object({
    preElection: z.object({ level: z.enum(['critical', 'high', 'medium', 'low']), keyRisks: z.array(z.string()) }),
    electionDay: z.object({ level: z.enum(['critical', 'high', 'medium', 'low']), keyRisks: z.array(z.string()) }),
    postElection: z.object({ level: z.enum(['critical', 'high', 'medium', 'low']), keyRisks: z.array(z.string()) }),
  }),
  hotspotRegions: z.array(z.object({ region: z.string(), riskLevel: z.enum(['critical', 'high', 'medium', 'low']), rationale: z.string() })),
  mitigationMeasures: z.array(z.object({ measure: z.string(), actor: z.string(), priority: z.enum(['urgent', 'important', 'recommended']) })),
  overallRisk: z.enum(['critical', 'high', 'medium', 'low']),
  intelligenceGaps: z.array(z.string()),
  confidence: z.enum(['high', 'medium', 'low']),
});
```

**Search queries:**
- Primary: `{country} election date candidates violence risk`
- Focused: `{country} electoral commission independence credibility`, `{country} voter registration irregularities`, `{country} election security forces deployment`

**System prompt:** Senior electoral security analyst applying UNDP Electoral Risk Assessment framework, IFES Electoral Violence indicators, and ACE Electoral Knowledge Network methodology.

**Demo response:** Nordalia transitional elections postponed (no date set); presidential (GoN-backed incumbent vs. DRM coalition candidate); critical pre-election risk (militia mobilization, voter displacement); eastern provinces hotspot; commission credibility compromised. Overall: CRITICAL.

**Registry entry:**
- frameworks: `['UNDP Electoral Risk Assessment', 'IFES Electoral Violence Indicators', 'ACE Electoral Knowledge Network']`
- dataSources: `['ACE Electoral Knowledge Network', 'IFES', 'Carter Center', 'NDI/IRI']`
- relatedTools: `['risk-monitor', 'early-warning', 'actor-profiles']`

---

## 6. Tool Registry Entries

All 6 are appended to `src/lib/constants/tool-registry.ts` under the appropriate category comments (`// ── ANALYSIS` for tools 3–6, `// ── INTELLIGENCE` for tools 1–2). Each follows the existing `ToolDefinition` shape with: `id`, `name`, `category`, `description`, `shortDescription`, `credits`, `icon`, `aiRoute`, `dataSchema`, `requiredSituationFields`, `outputType: 'structured'`, `frameworks`, `dataSources`, `relatedTools`, `methodology`, `staleAfterHours: 168`.

**Icons (Lucide):**
- `legal-tracker` → `Scale`
- `external-actors` → `Globe2`
- `economic-impact` → `TrendingDown`
- `peacebuilding-index` → `BarChart2`
- `human-rights` → `ShieldAlert`
- `electoral-risk` → `Landmark`

---

## 7. Tool Data Service Changes

Add to `ToolName` union in `src/lib/services/tool-data-service.ts`:
```ts
| 'legal_tracker'
| 'external_actors'
| 'economic_impact'
| 'peacebuilding_index'
| 'human_rights'
| 'electoral_risk'
```

---

## 8. Credits Changes

Add to `AI_CREDIT_COSTS` in `src/lib/api/with-credits.ts`:
```ts
'ai_legal_tracker': 2,
'ai_external_actors': 2,
'ai_economic_impact': 2,
'ai_peacebuilding_index': 2,
'ai_human_rights': 3,
'ai_electoral_risk': 3,
```

---

## 9. App Page Pattern

All tool pages follow the commitments/sanctions page pattern:
1. `'use client'`
2. Import `useSituationGuard`, `useToolData<ToolData>('[firestore_key]')`, `AiPopulate`, `RegistryToolInfo`, `NoSituationState`
3. Guard: `const { situation, isLoading: guardLoading } = useSituationGuard()`
4. Show `NoSituationState` if no situation
5. Show `AiPopulate` with `toolId`, `apiRoute`, `situation`, `buttonLabel`
6. Render data from `useToolData` with typed interfaces matching the Zod schema
7. Each section has a loading skeleton and a no-data empty state

**Demo pages** are single-line re-exports:
```ts
export { default } from '../../app/<tool-id>/page';
```

---

## 10. Prompt Template (Section 11 Standard)

All 6 routes implement the Section 11 universal prompt template:

```
[ROLE] You are a {TOOL_SPECIFIC_ROLE} for PRAXIS, a conflict intelligence platform...
[GROUNDING MANDATE] CRITICAL: web research results are PRIMARY source of truth...
[WEB INTELLIGENCE] ### Current Web Intelligence ({timestamp}) {webContext}
[SITUATION CONTEXT] {sitContext}
[GRAPH CONTEXT] {graphCtx}
[METHODOLOGY] {tool-specific framework}
[OUTPUT REQUIREMENTS] {schema description with ICD 203 language}
[USER ROLE ADAPTATION] tailor to analyst/mediator/advisor/researcher
```

---

## 11. Testing Checklist (Per Tool)

Per §12.1 of the Master Blueprint:
- [ ] API route returns 200 on valid POST with Sudan Civil War test situation
- [ ] Zod schema validates (no `generateObject` errors)
- [ ] `executeWebResearch` fires (check `[web-research]` console logs)
- [ ] Output persists to Firestore (`useToolData` reads back)
- [ ] UI renders without crashes
- [ ] Regenerate button works
- [ ] Credits deducted correctly (check `AI_CREDIT_COSTS`)
- [ ] Demo mode returns static response
- [ ] Mobile responsive (375px)

---

## 12. Out of Scope

- No new shared analytics engines (no equivalent to `risk-engine.ts` needed)
- No data feed integrations (all data via `executeWebResearch`)
- No layouts (`layout.tsx`) — only tools that need a non-default Next.js layout have one; these tools don't
- No visualization components beyond what's inline in the page
