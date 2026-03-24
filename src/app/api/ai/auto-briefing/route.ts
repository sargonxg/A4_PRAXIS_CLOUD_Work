import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getModel } from '@/lib/ai/providers';
import { buildToolContext } from '@/lib/ai/situation-context';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { handleRouteError } from '@/lib/api/standard-error';
import type { Situation } from '@/types/situation';

export const maxDuration = 45;

const AutoBriefingSchema = z.object({
  situationName: z.string().describe('Name of the conflict situation'),
  riskLevel: z.enum(['critical', 'high', 'medium', 'low']).describe('Overall risk level as of this brief'),
  trend: z.enum(['escalating', 'stable', 'de-escalating']).describe('Current trajectory of the conflict'),
  headline: z.string().describe('One-sentence headline capturing the most significant current development'),
  keyDevelopments: z.array(z.string()).min(3).max(6).describe('Bullet-point key developments since last brief'),
  securitySituation: z.string().describe('Current security/military situation and key dynamics'),
  politicalDynamics: z.string().describe('Political track status — negotiations, key actor positions, spoiler activity'),
  humanitarianUpdate: z.string().describe('Humanitarian situation — access, displacement, protection concerns'),
  mediaEnvironment: z.string().describe('Information environment — key narratives, media coverage, disinformation'),
  actionItems: z.array(z.string()).min(3).max(6).describe('Prioritized action items for the analyst or mission'),
  nextReview: z.string().describe('When and what to monitor for the next briefing cycle'),
});

const DEMO_RESPONSE = {
  situationName: 'Nordalia Crisis',
  riskLevel: 'high' as const,
  trend: 'escalating' as const,
  headline: 'Ceasefire under severe stress: 14 AFN buffer zone violations in 30 days; humanitarian access blocked for 11th consecutive day.',
  keyDevelopments: [
    'UNMN confirmed 14 AFN artillery incidents in buffer zone — highest frequency since ceasefire signing',
    'OCHA convoy blocked at Marka checkpoint for 11th consecutive day; 2.3M civilians without sustained aid access',
    'DRM claims GoN is preparing Kessara corridor offensive; UNMN cannot confirm but reports DRM repositioning',
    'Karovia Foreign Minister cancelled scheduled GoN meeting — no explanation',
    'World Bank escrow compliance maintained — only commitment with full implementation this reporting period',
  ],
  securitySituation: 'UNMN reports sustained AFN artillery violations in the 5km buffer zone. No direct engagement, but DRM tactical repositioning increases proximity risk. Joint Ceasefire Monitoring Commission still not established (overdue 45 days), leaving monitoring to ad hoc UNMN patrols only.',
  politicalDynamics: 'Political track stalled. No pre-negotiation contacts this week. Karovia cancellation is the most significant diplomatic signal — possibly indicating displeasure with GoN escalatory behavior, but unconfirmed. AU mediation team reports no progress on ground rules for pre-talks.',
  humanitarianUpdate: 'CRITICAL: Eleven consecutive days of blocked OCHA convoy access. 2.3M people in DRM territory relying on pre-positioned stocks only. MSF reports increasing critical medical cases unable to reach Nordalia City. Nutrition surveillance indicates acute malnutrition increasing in three eastern districts.',
  mediaEnvironment: 'GoN state media amplifying counterterrorism narrative around Kessara. NIMN published buffer zone violation documentation today. International coverage increasing — BBC and Al Jazeera both ran humanitarian crisis features. Operation MIRROR social media campaign actively suppressing UNMN reporting.',
  actionItems: [
    'URGENT: Invoke OCHA escalation mechanism — emergency humanitarian access meeting within 48 hours',
    'Request UNMN formally report buffer zone violations to UNSC under S/2025/891 mandate',
    'Senior bilateral engagement with Karovia to clarify FM cancellation signal',
    'Issue joint AU-UN ceasefire compliance statement before international media cycle closes',
    'Brief UNSC P3 on deteriorating access ahead of monthly Nordalia consultation',
  ],
  nextReview: '24 hours — monitor Karovian diplomatic signals, OCHA convoy status, and any DRM statement on Kessara',
};

export async function POST(request: Request) {
  try {
    const creditCheck = await checkAndDeductCredits('ai_auto_briefing', 'Daily intelligence brief');
    if (!creditCheck.allowed) return creditCheck.response!;

    if (isServerDemoMode()) {
      return NextResponse.json(DEMO_RESPONSE);
    }

    const body = await request.json();
    const { situation } = body as { situation?: Situation };
    const sitContext = situation ? buildToolContext(situation as Situation) : '';

    const result = await generateText({
      model: getModel(),
      output: Output.object({ schema: AutoBriefingSchema }),
      prompt: `${sitContext ? `${sitContext}\n\n` : ''}Generate a concise daily intelligence brief for this conflict situation.

## BRIEF FORMAT (UN DPPA Morning Note standard)

**Purpose**: A morning intelligence brief for senior diplomatic/political staff. Must be scannable in under 5 minutes. Leads with the most critical development and provides sufficient context for immediate decision-making.

**RISK LEVEL CALIBRATION**
- Critical: Active large-scale hostilities, imminent atrocity risk, or full peace process collapse
- High: Significant ceasefire violations, blocked humanitarian access, active spoiler pressure
- Medium: Tension but ceasefire holding, process ongoing with obstacles
- Low: Stable situation, implementation on track

**TREND CALIBRATION**
- Escalating: Increasing violence, more violations, diplomatic deterioration
- Stable: No significant change from previous reporting period
- De-escalating: Fewer incidents, positive diplomatic signals, improved access

**CONTENT REQUIREMENTS**
1. Headline: One sentence — the single most significant development
2. Key Developments: 3-5 specific, factual bullet points (not generic statements)
3. Security Situation: Current military/security dynamics with specific indicators
4. Political Dynamics: Negotiation track status, actor positions, spoiler activity
5. Humanitarian Update: Access, displacement, protection — flag CRITICAL if warranted
6. Media Environment: Key narratives and information operation activity
7. Action Items: Concrete, time-bound recommendations for the mission/analyst
8. Next Review: Specific monitoring triggers for the next cycle

Be specific, evidence-grounded, and actionable. Avoid diplomatic boilerplate. Write as a senior UN DPPA political affairs officer would for the Special Representative's morning briefing.`,
      system: 'You are a senior UN DPPA political affairs officer responsible for daily conflict situation briefings. You write for senior UN officials and diplomatic professionals who need precise, actionable intelligence. Apply the UN Morning Note standard: concise, specific, evidence-based, and actionable. Never use vague diplomatic language when specific facts are available.',
    });

    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'auto-briefing');
  }
}
