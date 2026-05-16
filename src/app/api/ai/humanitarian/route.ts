/**
 * POST /api/ai/humanitarian
 *
 * Calibrated humanitarian snapshot route — replaces the legacy fallback to
 * `/api/ai/chat` so analysts get a structured OCHA-grade snapshot grounded
 * in real ReliefWeb / UNHCR / HDX / UCDP / UN News / GDELT signals instead
 * of unstructured prose.
 *
 * Output schema is `HumanitarianSnapshotSchema` and persists via
 * `saveToolOutput({ toolId: 'humanitarian' })` so the page can read the
 * latest snapshot from `users/{uid}/situations/{sitId}/tools/humanitarian`.
 *
 * Calibration: `withCalibration('humanitarian', 'ai_humanitarian')` — credit
 * op `ai_humanitarian` (2 credits, see `with-credits.ts`).
 */

import { NextResponse } from 'next/server';
import { Output } from 'ai';
import { z } from 'zod';
import { callProModel } from '@/lib/ai/providers';
import { buildToolContext } from '@/lib/ai/situation-context';
import { buildGraphContext } from '@/lib/ai/context-builder-server';
import { withCalibration } from '@/lib/api/with-calibration';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { validateAiRequest } from '@/lib/api/validate-request';
import { handleRouteError } from '@/lib/api/standard-error';
import { getSituationIntelligence } from '@/lib/data-feeds/feed-aggregator';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Output schema
// ---------------------------------------------------------------------------

const SourceCitationSchema = z.object({
  name: z.string(),
  url: z.string().optional(),
  publishedAt: z.string().optional(),
});

const IpcPhaseEntrySchema = z.object({
  area: z.string(),
  phase: z.enum(['1', '2', '3', '4', '5']),
  population: z.number().nonnegative().optional(),
  pct: z.number().min(0).max(100).optional(),
  trend: z.enum(['improving', 'stable', 'worsening', 'unknown']),
  source: SourceCitationSchema,
});

const DisplacementSchema = z.object({
  idps: z.number().nonnegative().optional(),
  refugees: z.number().nonnegative().optional(),
  returnees: z.number().nonnegative().optional(),
  asOf: z.string().optional(),
  source: SourceCitationSchema,
});

const FundingSchema = z.object({
  requirementUsd: z.number().nonnegative().optional(),
  fundedUsd: z.number().nonnegative().optional(),
  gapPercent: z.number().min(0).max(100).optional(),
  appealName: z.string().optional(),
  source: SourceCitationSchema,
});

const ProtectionConcernSchema = z.object({
  category: z.enum([
    'civilians',
    'gbv',
    'children',
    'idps',
    'minorities',
    'humanitarian-workers',
    'access',
    'health',
    'education',
    'other',
  ]),
  description: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  source: SourceCitationSchema,
});

const AccessConstraintSchema = z.object({
  description: z.string(),
  type: z.enum(['bureaucratic', 'physical', 'security', 'climate', 'other']),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  affectedAreas: z.array(z.string()).optional(),
  source: SourceCitationSchema,
});

export const HumanitarianSnapshotSchema = z.object({
  bluf: z.string().min(20).max(800), // 1-2 sentence bottom-line-up-front
  region: z.string(),
  asOfDate: z.string(),
  ipcPhases: z.array(IpcPhaseEntrySchema),
  displacement: DisplacementSchema,
  funding: FundingSchema,
  protection: z.array(ProtectionConcernSchema),
  accessConstraints: z.array(AccessConstraintSchema),
  intelligenceGaps: z.array(z.string()),
  recommendedActions: z.array(
    z.object({
      action: z.string(),
      urgency: z.enum(['immediate', 'short-term', 'medium-term']),
      audience: z.enum(['donor', 'cluster-lead', 'mission', 'analyst']).optional(),
    })
  ),
  confidence: z.enum(['high', 'medium', 'low']),
  /** Aggregated source pointers — what the model leaned on. */
  primarySources: z.array(z.string()),
});

// ---------------------------------------------------------------------------
// Demo response — used only when isServerDemoMode() is true.
// ---------------------------------------------------------------------------

const DEMO_SNAPSHOT = {
  bluf:
    'Demo snapshot: the selected situation eastern provinces are at IPC Phase 4 with rising IDP outflows and a 56% HRP funding gap; immediate cluster reinforcement of food and protection is warranted.',
  region: 'the selected situation — Eastern Provinces',
  asOfDate: '2026-04-26',
  ipcPhases: [
    {
      area: 'Eastern Provinces',
      phase: '4' as const,
      population: 1280000,
      pct: 22.0,
      trend: 'worsening' as const,
      source: { name: 'IPC (demo)', url: '' },
    },
    {
      area: 'Capital Region',
      phase: '2' as const,
      population: 1340000,
      pct: 23.0,
      trend: 'stable' as const,
      source: { name: 'IPC (demo)', url: '' },
    },
  ],
  displacement: {
    idps: 1420000,
    refugees: 386000,
    returnees: 12800,
    asOf: '2026-04-20',
    source: { name: 'UNHCR (demo)', url: '' },
  },
  funding: {
    requirementUsd: 487000000,
    fundedUsd: 214280000,
    gapPercent: 56,
    appealName: 'the selected situation HRP 2026',
    source: { name: 'OCHA FTS (demo)', url: '' },
  },
  protection: [
    {
      category: 'civilians' as const,
      description: 'Buffer-zone violations affecting agricultural communities.',
      severity: 'high' as const,
      source: { name: 'OHCHR (demo)', url: '' },
    },
  ],
  accessConstraints: [
    {
      description: 'Convoy access blocked at Kessara corridor since 2026-04-18.',
      type: 'security' as const,
      severity: 'high' as const,
      affectedAreas: ['Kessara', 'Eastern Provinces'],
      source: { name: 'OCHA Access Monitor (demo)', url: '' },
    },
  ],
  intelligenceGaps: [
    'No fresh OCHA situation report since 2026-04-18.',
    'Funding tracker has no FTS reconciliation for 2026-04 yet.',
  ],
  recommendedActions: [
    {
      action: 'Brief donor cluster on the funding gap and the protection severity uptick.',
      urgency: 'short-term' as const,
      audience: 'donor' as const,
    },
  ],
  confidence: 'medium' as const,
  primarySources: ['ReliefWeb', 'UNHCR', 'OCHA FTS', 'IPC'],
};

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export const POST = withCalibration('humanitarian', 'ai_humanitarian', {
  retrievalQuery: (_req, body) => {
    const sit = body.situation as { region?: string; name?: string } | undefined;
    const focus = typeof body.focus === 'string' ? body.focus : '';
    return [sit?.region, sit?.name, focus].filter(Boolean).join(' — ') || 'humanitarian snapshot';
  },
})(async (request, user) => {
  try {
    const body = await request.json().catch(() => ({}));

    const requestSchema = z.object({
      situation: z.any().optional(),
      focus: z.string().max(500).optional(), // optional analyst question to bias the snapshot
    });

    const validation = validateAiRequest(body, requestSchema);
    if (!validation.success) return validation.response;
    const { situation, focus } = validation.data;

    if (isServerDemoMode()) {
      return NextResponse.json(DEMO_SNAPSHOT);
    }

    const sit = situation as Situation | undefined;
    const situationId = sit?.id ?? '';
    const country = sit?.region ?? '';

    const sitContext = sit ? buildToolContext(sit) : '';
    const graphCtx = situationId
      ? await buildGraphContext(user.uid, situationId, 'humanitarian')
      : '';

    // Pull live humanitarian data — never throw to the user; degrade to AI-only.
    let dataContext = '';
    let primarySources: string[] = [];
    try {
      const intel = await getSituationIntelligence({ country, limit: 30 });
      const lines: string[] = [];

      if (intel.humanitarian?.displacement) {
        lines.push(
          `UNHCR displacement (HDX HAPI): IDPs=${intel.humanitarian.displacement.idps}, refugees=${intel.humanitarian.displacement.refugees}.`
        );
        primarySources.push('UNHCR');
      }
      if (intel.humanitarian?.foodSecurity?.length) {
        const phases = intel.humanitarian.foodSecurity
          .map((p) => `Phase ${p.phase}=${p.population} (${p.pct}%)`)
          .join('; ');
        lines.push(`IPC food-security phases (HDX HAPI): ${phases}.`);
        primarySources.push('IPC', 'HDX');
      }
      if (intel.humanitarian?.funding) {
        lines.push(
          `OCHA FTS funding (HDX HAPI): required=${intel.humanitarian.funding.required}, funded=${intel.humanitarian.funding.funded}, gap=${100 - intel.humanitarian.funding.pct}%.`
        );
        primarySources.push('OCHA FTS');
      }
      if (intel.events?.length) {
        const recentReports = intel.events
          .filter((e) => e.source === 'reliefweb' || e.source === 'unnews')
          .slice(0, 8)
          .map((e) => `[${e.source}|${e.severity}|${e.date}] ${e.title}: ${e.description.slice(0, 200)}`);
        if (recentReports.length) {
          lines.push('Recent humanitarian reports (use as evidence):\n' + recentReports.join('\n'));
          if (intel.sources.reliefweb > 0) primarySources.push('ReliefWeb');
          if (intel.sources.unnews > 0) primarySources.push('UN News');
        }
      }

      if (lines.length) {
        dataContext = `\n## LIVE HUMANITARIAN DATA (PRIMARY SOURCES)\n${lines.join('\n')}\n`;
      } else {
        dataContext = '\nNo live humanitarian feeds returned data — base the snapshot on the situation context below and clearly mark intelligence gaps.';
      }
    } catch (err) {
      console.warn('[humanitarian] feed aggregation failed, degrading to AI-only:', err);
      dataContext = '\nLive humanitarian feeds unavailable — base the snapshot on the situation context below and clearly mark intelligence gaps.';
    }

    primarySources = Array.from(new Set(primarySources));

    const { systemPromptBlock, outputConstraints, provenance } = user.calibration;
    const langDirective =
      outputConstraints.language !== 'en'
        ? `\n\nRESPOND IN: ${outputConstraints.language.toUpperCase()} (analyst's working language).`
        : '';
    const redLineDirective = outputConstraints.redLineClauses.length
      ? `\n\nRED LINES — DO NOT:\n${outputConstraints.redLineClauses.map((r) => `  - ${r}`).join('\n')}`
      : '';

    const result = await callProModel({
      output: Output.object({ schema: HumanitarianSnapshotSchema }),
      system: `You are a senior humanitarian analyst trained on UN OCHA, IASC cluster reporting, IPC Food Security Phase Classification, and UNHCR Refugee Data Finder methodology. You serve the analyst described below — calibrate audience, language, and red lines to their profile.

${systemPromptBlock}

GROUNDING MANDATE:
- The "LIVE HUMANITARIAN DATA" block below is your PRIMARY source of truth.
- Cite each figure to its origin (ReliefWeb, UNHCR, OCHA FTS, IPC, HDX HAPI, UN News).
- When evidence is insufficient, output an intelligenceGaps[] entry rather than fabricating numbers.
- BLUF must be analyst-grade: 1-2 sentences, named decision-maker action, ICD 203 probability language when forecasting.
- Confidence must reflect data freshness and source diversity.${langDirective}${redLineDirective}`,
      prompt: `${graphCtx ? `${graphCtx}\n\n` : ''}${sitContext ? `${sitContext}\n\n` : ''}
${dataContext}

${focus ? `\nANALYST FOCUS: ${focus}\n` : ''}

## OUTPUT REQUIREMENTS
1. bluf: bottom-line-up-front; named action; 1-2 sentences.
2. ipcPhases: list every area with a population estimate; cite source per row.
3. displacement: integers; cite UNHCR or HDX HAPI; include asOf date.
4. funding: USD figures; gapPercent; cite OCHA FTS or HDX HAPI.
5. protection: real concerns with severity; cite source.
6. accessConstraints: bureaucratic/physical/security/climate/other with affectedAreas; cite source.
7. intelligenceGaps: missing data clearly named; do NOT fabricate numbers.
8. recommendedActions: 2-5 action items with urgency and audience.
9. confidence: must reflect feed coverage and freshness.
10. primarySources: aggregate of feed names actually relied on.

If a section has no evidence in the live data, RETURN AN EMPTY ARRAY for that field plus an intelligenceGaps[] entry naming the missing source.`,
    });

    if (situationId) {
      await saveToolOutput({
        uid: user.uid,
        situationId,
        toolId: 'humanitarian',
        profileVersion: provenance.profileVersion,
        output: result.output as Record<string, unknown>,
        metadata: {
          primarySources,
          dataContextLength: dataContext.length,
          focus: focus ?? null,
        },
      }).catch((err) => console.warn('[humanitarian] saveToolOutput failed:', err));
    }

    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'humanitarian');
  }
});
