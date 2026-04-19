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

const MediaRoundupSchema = z.object({
  date: z.string().describe('Date of this roundup in ISO 8601 format (YYYY-MM-DD)'),
  headlines: z.array(
    z.object({
      title: z.string().describe('Headline title as reported or paraphrased'),
      outlet: z.string().describe('Media outlet name'),
      country: z.string().describe('Country of the outlet'),
      significance: z
        .string()
        .describe(
          'Why this headline matters for the conflict — operational, political, or humanitarian significance'
        ),
      link: z.string().optional().describe('URL to the source article if available'),
    })
  ).describe('5-10 key headlines from the past 24 hours, ordered by significance'),
  narrativeShifts: z.array(
    z.object({
      shift: z.string().describe('Name of the narrative shift, e.g. "Reframing DRM from terrorists to insurgents"'),
      from: z.string().describe('The prior dominant narrative frame'),
      to: z.string().describe('The emerging or replacing narrative frame'),
      evidence: z.string().describe('Specific outlets or events that signal this shift'),
    })
  ).describe('Notable shifts in how key actors or events are being framed compared to prior reporting'),
  propagandaAlerts: z.array(
    z.object({
      outlet: z.string().describe('Outlet or account responsible'),
      tactic: z.string().describe('Propaganda tactic, e.g. "False flag attribution", "Atrocity fabrication", "Dehumanisation"'),
      content: z.string().describe('Description of the specific content and what makes it propagandistic'),
      riskLevel: z
        .enum(['high', 'medium', 'low'])
        .describe('Risk level: high = immediate escalation or atrocity risk, medium = narrative harm, low = background noise'),
    })
  ).describe('Active propaganda or disinformation content identified in today\'s media cycle'),
  keyMessages: z
    .array(z.string())
    .describe('3-5 main takeaways from today\'s media roundup — the essential intelligence for an analyst briefing'),
  sourceDiversity: z
    .number()
    .min(0)
    .max(10)
    .describe(
      'Source diversity score for today\'s coverage: 0 = single-source or fully captured narrative, 10 = broad spectrum of independent, regional, and international voices'
    ),
});

// --- Demo response ---

const DEMO_RESPONSE = {
  date: '2026-04-09',
  headlines: [
    {
      title: 'UNMN demands AFN withdrawal from Sector Bravo buffer zone within 72 hours',
      outlet: 'Reuters',
      country: 'International',
      significance:
        'First formal UNMN ultimatum since ceasefire signing. Triggers Article 7 review mechanism. Failure to comply activates Security Council notification protocol — the first such escalation of the UNMN mandate.',
      link: 'https://reuters.com/world/africa/unmn-buffer-zone-nordalia-2026-04-09',
    },
    {
      title: 'Westmark arms vote: coalition holds, €120M DRM package to proceed 14 April',
      outlet: 'Westmark Free Press',
      country: 'Federal Republic of Westmark',
      significance:
        'Confirms patron escalation track. GoN Defence Ministry immediately threatened to "respond proportionally." Karovia recalled its Westmark ambassador for consultations — most severe diplomatic signal since conflict onset.',
      link: 'https://westmarkfreepress.wm/politics/arms-vote-confirmed-2026-04-09',
    },
    {
      title: 'OCHA: 47,000 civilians at acute food risk as Checkpoint Bravo enters day 11',
      outlet: 'UN News',
      country: 'International',
      significance:
        'IPC Phase 3 threshold crossed in three eastern districts. MSF 6-day supply warning now public. International pressure on GoN will intensify — creates diplomatic leverage window for humanitarian access negotiation.',
      link: 'https://news.un.org/en/story/2026/04/nordalia-checkpoint-bravo',
    },
    {
      title: 'GoN: buffer zone activity is "defensive posture responding to DRM provocation"',
      outlet: 'Nordalia Broadcasting Corporation',
      country: 'Nordalia',
      significance:
        'GoN framing positions ceasefire violation as reactive, not offensive. Consistent with Stage 5 face-saving narrative. Likely precursor to GoN blocking JCMC emergency session request.',
      link: 'https://nbc.gov.nd/news/defense-statement-040926',
    },
    {
      title: 'DFRLab confirms coordinated DRM diaspora disinformation network — 340 accounts',
      outlet: 'DFRLab / Atlantic Council',
      country: 'International',
      significance:
        'Provides GoN with international legitimacy boost and weakens DRM\'s moral framing internationally. Westmark government under pressure to distance from DRM ahead of arms vote. Narrative blowback risk for DRM political wing.',
      link: 'https://dfrlab.org/2026/04/09/nordalia-ib-network',
    },
    {
      title: 'Commander Asante: "Ceasefire is over if AFN post not removed by Friday"',
      outlet: 'Eastern Provinces Voice',
      country: 'Nordalia',
      significance:
        'First explicit public ultimatum from DRM military command. Classic Stage 6 "strategy of threats" language. If GoN does not respond, DRM may stage a demonstrative military action to show credibility.',
      link: 'https://epvoice.nd/asante-statement-2026-04-09',
    },
    {
      title: 'AU Panel of the Wise offers emergency mediation for buffer zone standoff',
      outlet: 'African Union News',
      country: 'International',
      significance:
        'De-escalation opportunity. AU Panel has credibility with both parties from November 2025 prisoner exchange. Time-limited — window closes if Friday ultimatum passes without response.',
      link: 'https://au.int/news/panel-wise-nordalia-2026-04-09',
    },
    {
      title: 'Karovian KAF: additional logistics flights "routine resupply, not pre-positioning"',
      outlet: 'Karovian News Agency',
      country: 'Republic of Karovia',
      significance:
        'Karovia is denying pre-offensive resupply interpretation. Denial itself signals awareness of international observation. Pattern of denial followed by escalation documented in three prior KAF deployments.',
      link: 'https://kna.gov.kv/en/defense-2026-04-09',
    },
  ],
  narrativeShifts: [
    {
      shift: 'Ceasefire framing: from "fragile but holding" to "on the verge of collapse"',
      from:
        'International outlets characterised the ceasefire as "stressed but functional" through March 2026, noting back-channel maintenance and prisoner exchanges as stabilisers.',
      to:
        'As of 8-9 April, Reuters, AP, and UN News all shifted to "on the verge of collapse" language following the Sector Bravo incursion and Commander Asante\'s Friday ultimatum. UNMN\'s formal 72-hour demand accelerated this shift.',
      evidence:
        'Reuters headline change tracked via media monitoring: 2 April "ceasefire holding despite tensions" vs. 9 April "UNMN ultimatum as ceasefire teeters." AP followed within 4 hours.',
    },
    {
      shift: 'DRM moral legitimacy: from sympathetic reform movement to tainted actor',
      from:
        'DRM political wing successfully maintained an international narrative of democratic reform and civilian protection through Q1 2026, amplified by Westmark media and diaspora networks.',
      to:
        'DFRLab coordinated inauthentic behaviour report is shifting international framing. Several Westmark opposition politicians now citing report to argue against arms package. DRM moral authority partially compromised.',
      evidence:
        'Westmark Free Press published DFRLab findings prominently; previously buried similar reports. Three EU member state foreign ministries issued statements of "concern" — shift from prior silence.',
    },
    {
      shift: 'Humanitarian crisis: from background context to primary frame',
      from:
        'Eastern humanitarian conditions were a secondary frame in most international outlets, subordinate to political and military developments.',
      to:
        'OCHA IPC Phase 3 declaration and MSF supply warning have elevated humanitarian conditions to primary frame in UN, AP, and several European outlets. GoN blocking behaviour now explicitly named rather than passively described.',
      evidence:
        'UN News led with humanitarian angle for first time since October 2025. BBC, Le Monde, and Der Spiegel all ran humanitarian-led pieces on 8-9 April.',
    },
  ],
  propagandaAlerts: [
    {
      outlet: '@NordaliaWatch coordinated network (X / Telegram)',
      tactic: 'Atrocity fabrication and coordinated amplification',
      content:
        'Network of 340 accounts (DFRLab confirmed) amplifying fabricated atrocity imagery from unrelated conflicts, attributed to AFN. Three mainstream outlets ran unverified images before correction. Designed to accelerate Westmark arms vote and international condemnation of GoN.',
      riskLevel: 'high' as const,
    },
    {
      outlet: 'Nordalia Broadcasting Corporation (NBC)',
      tactic: 'Dehumanisation and delegitimisation',
      content:
        'NBC morning broadcast 09 April described UNMN demand as "foreign interference in Nordalian sovereignty" and referred to SRSG Santos as an "agent of Westmark interests." Classic Stage 5 dehumanisation of mediating third party — undermines future mediation space.',
      riskLevel: 'medium' as const,
    },
    {
      outlet: 'Karovian News Agency (KNA)',
      tactic: 'False balance and whataboutism',
      content:
        'KNA published side-by-side casualty figures presenting unverified GoN-provided data (0 civilian deaths) alongside UNMN-verified figures (47) without methodological context, implying equivalence. Designed to muddy accountability debate at Security Council.',
      riskLevel: 'medium' as const,
    },
  ],
  keyMessages: [
    'The 72-hour UNMN buffer zone ultimatum is the most significant procedural escalation since the September Agreement — failure to comply triggers Security Council notification and may collapse the ceasefire framework.',
    'Commander Asante\'s Friday ultimatum and the UNMN demand create converging deadlines: both expire around 11-12 April, creating a narrow de-escalation window that the AU Panel of the Wise offer could fill.',
    'The Westmark arms vote (14 April) now has confirmed majority support — diplomatic engagement with Westmark Foreign Minister before 12 April is the last viable intervention point before patron escalation locks in.',
    'The DFRLab disinformation finding partially undercuts DRM moral legitimacy internationally, creating a brief window to pressure DRM political wing toward compliance — leverage that expires if Asante\'s ultimatum passes.',
    'Humanitarian framing has become primary in international media — GoN blocking behaviour at Checkpoint Bravo is now named, not passive. A unilateral GoN gesture on access could shift international narrative and reduce pressure ahead of Security Council.',
  ],
  sourceDiversity: 5.2,
};

// --- Route ---

export const POST = withCalibration('media_roundup', 'ai_analysis', {
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

    // Web-grounded context is the PRIMARY data source for media roundup
    const [graphCtx, webCtx] = await Promise.all([
      situationId
        ? buildGraphContext(ctx.uid, situationId, 'media_roundup').catch(() => '')
        : Promise.resolve(''),
      situation
        ? buildWebGroundedContext(
            {
              name: (situation as unknown as Situation).name,
              region: (situation as unknown as Situation).region,
              actors: (situation as unknown as Situation).actors,
            },
            'media-roundup',
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
      output: Output.object({ schema: MediaRoundupSchema }),
      system: `You are PRAXIS Media Intelligence, a professional daily media roundup generator for conflict and policy analysts. You serve UN Political Affairs Officers, diplomatic mediators, and think tank researchers.

Your mandate: synthesise the day's media coverage into a structured, actionable intelligence briefing. Every headline must carry operational significance — not just what happened, but why it matters for the conflict dynamics.

GROUNDING MANDATE: Web intelligence provided below is your PRIMARY data source. Derive headlines, narrative shifts, and propaganda alerts from what the sources actually report. Where sources are insufficient, note the gap explicitly. Prioritise sources with high trustworthiness over state-controlled outlets. Always flag contradictions between sources.

Apply Galtung's cultural violence lens to identify dehumanisation and structural narrative harm in propaganda alerts.

${systemPromptBlock}

Calibrate framing, tone, and recommendations to the analyst profile above. Honour the output-constraints block.${langDirective}${redLineDirective}`,
      prompt: `${graphCtx ? `${graphCtx}\n\n` : ''}${sitContext ? `${sitContext}\n\n` : ''}${webCtx}

Generate a Media Intelligence Roundup for today based on the web intelligence above.

ROUNDUP INSTRUCTIONS:
1. date: today's date in YYYY-MM-DD format
2. headlines: 5-10 headlines ordered by operational significance. For each: name the outlet and country, and explain WHY it matters for conflict dynamics (not just what happened). Include source links where available from the web intelligence.
3. narrativeShifts: identify 2-4 notable shifts in how actors, events, or issues are being framed compared to prior coverage — track from/to narrative frames with specific evidence
4. propagandaAlerts: flag active disinformation, coordinated inauthentic behaviour, dehumanisation, or atrocity fabrication — rate risk level (high/medium/low) based on escalation potential
5. keyMessages: 3-5 crisp takeaways for an analyst who only has 60 seconds — what must they know from today's media cycle?
6. sourceDiversity: rate 0-10 based on the breadth of outlets, viewpoints, and languages represented in today's coverage

Ground everything in the web intelligence provided. Be specific — name actual outlets, actual claims, actual shifts. Flag "INTELLIGENCE GAP: {topic}" where today's sources do not cover a critical area.`,
    });

    // --- Persist ---
    if (situationId) {
      await writeToolDataServer(ctx.uid, situationId, 'media_roundup', result.output as Record<string, unknown>);
      await saveToolOutput({
        uid: ctx.uid,
        situationId,
        toolId: 'media_roundup',
        profileVersion: provenance.profileVersion,
        output: result.output as Record<string, unknown>,
      }).catch((err) => console.warn('[media_roundup] saveToolOutput failed:', err));
    }

    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'media-roundup');
  }
});
