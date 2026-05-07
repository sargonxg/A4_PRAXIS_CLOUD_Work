import { NextResponse } from 'next/server';
import { Output } from 'ai';
import { z } from 'zod';
import { callProModel } from '@/lib/ai/providers';
import { buildToolContext, buildWebGroundedContext } from '@/lib/ai/situation-context';
import { buildGraphContext, writeToolDataServer } from '@/lib/ai/context-builder-server';
import { withCalibration } from '@/lib/api/with-calibration';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { validateAiRequest } from '@/lib/api/validate-request';
import { handleRouteError } from '@/lib/api/standard-error';
import { situationContextSchema } from '@/lib/api/schemas';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

// --- Schema ---

const ArgusSchema = z.object({
  alerts: z.array(
    z.object({
      id: z.string().describe('Unique alert identifier, e.g. ARGUS-2026-001'),
      title: z.string().describe('Short alert title'),
      severity: z.enum(['critical', 'high', 'medium', 'low']).describe('Alert severity level'),
      category: z
        .enum(['military', 'political', 'humanitarian', 'economic', 'informational'])
        .describe('Domain category of the alert'),
      signal: z.string().describe('Observable signal or trigger that generated this alert'),
      evidence: z.string().describe('Evidence supporting the alert, with source citations where possible'),
      source: z.string().describe('Primary source or reporting body'),
      timestamp: z.string().describe('ISO 8601 timestamp or approximate date of the triggering event'),
      glaslImpact: z.string().describe('Impact on Glasl escalation stage, e.g. "Raises Stage 5→6 probability by ~15%"'),
      recommendedAction: z.string().describe('Recommended analyst or mediator action in response to this alert'),
      autoEscalate: z
        .boolean()
        .describe('True if this alert warrants immediate escalation to senior staff or senior diplomatic leadership'),
    })
  ).describe('Ordered array of alerts, highest severity first'),
  overallThreatLevel: z
    .enum(['critical', 'elevated', 'guarded', 'low'])
    .describe('Composite threat level across all alerts'),
  watchItems: z
    .array(z.string())
    .describe('3-6 specific items to monitor in the next 48 hours that could change the threat picture'),
  lastUpdated: z.string().describe('ISO 8601 timestamp of this scan'),
});

// --- Demo response ---

const DEMO_RESPONSE = {
  alerts: [
    {
      id: 'ARGUS-2026-001',
      title: 'AFN forward post established inside Kessara buffer zone',
      severity: 'critical' as const,
      category: 'military' as const,
      signal:
        'UNMN aerial surveillance detected Armed Forces of Nordalia (AFN) forward observation post at coordinates 12.4°N / 31.7°E — inside the 5-km buffer zone established by the September 2025 ceasefire.',
      evidence:
        'UNMN Report #MN-2026-0118: "Three sandbagged positions and one armoured personnel carrier observed inside Sector Bravo buffer zone since 06 April 2026." Corroborated by DRM field radio intercept shared through SRSG back-channel.',
      source: 'UNMN Verification Commission / SRSG back-channel',
      timestamp: '2026-04-07T09:12:00Z',
      glaslImpact:
        'Direct ceasefire violation. Raises Stage 5→6 transition probability from 35% to 52% if not reversed within 72 hours. Stage 6 threshold indicators: demonstrative military action, explicit threat language from GoN Defence Ministry.',
      recommendedAction:
        'Request emergency meeting of the Joint Ceasefire Monitoring Committee (JCMC). Invoke Article 7 of the September Agreement. Dispatch additional UNMN observers to Sector Bravo within 24 hours.',
      autoEscalate: true,
    },
    {
      id: 'ARGUS-2026-002',
      title: 'Karovian Air Force logistics flights up 40% — forward staging indicator',
      severity: 'high' as const,
      category: 'military' as const,
      signal:
        'Open-source flight tracking (FlightRadar24 / ADS-B Exchange) shows 40% increase in KAF Il-76 sorties to Nordalia International Airport over the past 14 days versus the 90-day baseline.',
      evidence:
        'Open-source logistics monitoring indicates 3 additional AFN heavy-weapons systems (M-46 artillery) repositioned to eastern front in same period. Pattern consistent with pre-offensive resupply in 6 historical cases analysed by ARGUS.',
      source: 'OSINT / UNMN logistics tracking / GDELT signal review',
      timestamp: '2026-04-08T14:30:00Z',
      glaslImpact:
        'Leading indicator for Stage 6 "strategy of threats" escalation. Historical pattern suggests 4-6 week window before operational use of resupplied assets.',
      recommendedAction:
        'Raise with Karovian ambassador through bilateral track. Request clarification from GoN Ministry of Defence. Brief senior diplomatic forum pen-holders informally.',
      autoEscalate: false,
    },
    {
      id: 'ARGUS-2026-003',
      title: 'GoN humanitarian access blockage at Checkpoint Bravo — 11 days',
      severity: 'high' as const,
      category: 'humanitarian' as const,
      signal:
        'OCHA field team denied passage at Checkpoint Bravo for the 11th consecutive day. Approximately 47,000 civilians in DRM-controlled Sector East dependent on this corridor for food and medical supplies.',
      evidence:
        'OCHA Situation Report 2026-04-08: IPC Phase 3 (Crisis) conditions confirmed in three eastern districts. MSF warehouse in Tarova reports 6-day food stock remaining.',
      source: 'OCHA / MSF / IPC monitoring',
      timestamp: '2026-04-08T08:00:00Z',
      glaslImpact:
        'Humanitarian deterioration can trigger IHL-based international pressure, potentially accelerating both diplomatic intervention and GoN reputational entrenchment (Stage 5 face-loss dynamic).',
      recommendedAction:
        'Invoke Humanitarian Corridor Protocol (September 2025 Agreement, Annex II). Escalate to Emergency Relief Coordinator if access not restored within 48 hours.',
      autoEscalate: true,
    },
    {
      id: 'ARGUS-2026-004',
      title: 'DRM Diaspora Network mobilising coordinated disinformation campaign',
      severity: 'medium' as const,
      category: 'informational' as const,
      signal:
        'Digital Forensic Research Lab (DFRLab) flagged coordinated inauthentic behaviour across 340 social media accounts amplifying fabricated atrocity imagery attributed to GoN forces.',
      evidence:
        'Content traced to a server cluster in Westmark. Reach: ~2.1M impressions across X, Facebook, and Telegram in 72 hours. Three major international outlets ran unverified versions before correction.',
      source: 'DFRLab / Meta CIB Report',
      timestamp: '2026-04-06T19:45:00Z',
      glaslImpact:
        'Narrative escalation consistent with Stage 5 dehumanisation and international reputation warfare. If not countered, may harden GoN domestic stance and reduce space for compromise.',
      recommendedAction:
        'Share DFRLab findings with GoN and DRM through SRSG. Issue joint factual correction. Alert Communications Division to monitor spread.',
      autoEscalate: false,
    },
    {
      id: 'ARGUS-2026-005',
      title: 'Westmark Parliament vote on DRM arms package — 14 April',
      severity: 'medium' as const,
      category: 'political' as const,
      signal:
        'Westmark legislature scheduled to vote 14 April 2026 on a €120M military aid package to the DRM "in support of democratic forces." Package includes MANPADS and anti-armour systems.',
      evidence:
        'Westmark Foreign Affairs Committee published bill text 05 April. Majority coalition has 61% support per parliamentary count. Karovian Foreign Ministry issued demarche on 08 April.',
      source: 'Westmark Parliament / Karovian MFA statement',
      timestamp: '2026-04-08T11:00:00Z',
      glaslImpact:
        'If passed, significantly raises DRM military capacity and GoN-Karovia escalatory response probability. Could trigger a patron-level confrontation above Stage 6.',
      recommendedAction:
        'Engage Westmark Foreign Minister through bilateral diplomatic channel before 12 April. Propose conditions or a freeze tied to ceasefire compliance. Brief senior diplomatic forum.',
      autoEscalate: false,
    },
  ],
  overallThreatLevel: 'elevated' as const,
  watchItems: [
    'AFN forward post status in Sector Bravo — UNMN daily report 09-10 April',
    'Westmark Parliament arms vote (14 April) — advance lobbying window closes 12 April',
    'OCHA Checkpoint Bravo access — 48-hour deadline triggers ERC escalation',
    'Karovian KAF sortie rate — any further increase above 40% baseline is a Stage 6 pre-indicator',
    'DFRLab atrocity narrative spread — watch for mainstream media amplification',
    'JCMC emergency session convening — confirmation expected by 10 April EOD',
  ],
  lastUpdated: '2026-04-09T06:00:00Z',
};

// --- Route ---

export const POST = withCalibration('argus', 'ai_analysis', {
  retrievalQuery: (_req, body) => {
    const s = body.situation as { name?: string; region?: string } | undefined;
    return [s?.name, s?.region].filter(Boolean).join(' — ') || undefined;
  },
})(async (request, ctx) => {
  try {
    const body = await request.json();

    const requestSchema = z.object({
      situation: situationContextSchema.optional(),
    });

    const validation = validateAiRequest(body, requestSchema);
    if (!validation.success) return validation.response;
    const { situation } = validation.data;

    // --- Demo mode ---
    if (isServerDemoMode()) {
      return NextResponse.json(DEMO_RESPONSE);
    }

    // Credits + profile gate already handled by withCalibration above.

    // --- Contexts ---
    const sitContext = situation ? buildToolContext(situation as unknown as Situation) : '';
    const situationId = (situation as Situation | undefined)?.id ?? '';

    const [graphCtx, webCtx] = await Promise.all([
      situationId
        ? buildGraphContext(ctx.uid, situationId, 'argus').catch(() => '')
        : Promise.resolve(''),
      situation
        ? buildWebGroundedContext(
            {
              name: (situation as unknown as Situation).name,
              region: (situation as unknown as Situation).region,
              actors: (situation as unknown as Situation).actors,
            },
            'argus',
            ctx.uid
          ).catch(() => '')
        : Promise.resolve(''),
    ]);

    // --- Calibrated system prompt ---
    const { systemPromptBlock, outputConstraints, provenance } = ctx.calibration;
    const langDirective = outputConstraints.language !== 'en'
      ? `\n\nRESPOND IN: ${outputConstraints.language.toUpperCase()}.`
      : '';
    const redLineDirective = outputConstraints.redLineClauses.length
      ? `\n\nRED LINES — DO NOT:\n${outputConstraints.redLineClauses.map(r => `  - ${r}`).join('\n')}`
      : '';

    // --- AI generation ---
    const result = await callProModel({
      output: Output.object({ schema: ArgusSchema }),
      system: `You are ARGUS, the automated alert and early warning signal scanner within TACITUS PRAXIS. You serve multilateral diplomacy practitioners, diplomatic mediators, and conflict analysts.

Your mandate: scan the full intelligence picture and surface the most operationally significant alerts. Every alert must be grounded in verifiable signals. Use ICD 203 probability language. Prioritise leading indicators — signals that precede escalation 1-4 weeks before it occurs.

GROUNDING MANDATE: Web intelligence provided is PRIMARY source of truth. Prioritise over training data. Flag "INTELLIGENCE GAP: {topic}" where evidence is insufficient.

${systemPromptBlock}

Calibrate framing, tone, and recommendations to the analyst profile above. Honour the output-constraints block.${langDirective}${redLineDirective}`,
      prompt: `${graphCtx ? `${graphCtx}\n\n` : ''}${sitContext ? `${sitContext}\n\n` : ''}${webCtx}

Scan the above intelligence picture and generate a structured ARGUS alert report.

ALERT GENERATION RULES:
1. Identify 3-7 alerts across the five categories (military, political, humanitarian, economic, informational)
2. Order alerts by severity: critical → high → medium → low
3. For each alert: cite the observable signal, evidence chain, source, and timestamp
4. Assess Glasl escalation impact for every alert — be specific about stage transitions and probability shifts
5. Set autoEscalate: true ONLY for alerts that cross the Stage 6 threshold or involve mass atrocity risk
6. watchItems: 3-6 specific observable events in the next 48 hours that could change the threat picture

THREAT LEVEL GUIDE:
- critical: Active Stage 6+ dynamics or imminent mass atrocity risk
- elevated: Stage 5 upper boundary, multiple high-severity alerts, patron escalation risk
- guarded: Stage 4-5, isolated incidents, frameworks holding
- low: Stage 1-3, no active flashpoints

Set lastUpdated to the current ISO 8601 timestamp.`,
    });

    // --- Persist ---
    if (situationId) {
      await writeToolDataServer(ctx.uid, situationId, 'argus', result.output as Record<string, unknown>);
      await saveToolOutput({
        uid: ctx.uid,
        situationId,
        toolId: 'argus',
        profileVersion: provenance.profileVersion,
        output: result.output as Record<string, unknown>,
      }).catch((err) => console.warn('[argus] saveToolOutput failed:', err));
    }

    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'argus');
  }
});
