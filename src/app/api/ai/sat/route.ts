import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getThinkingModel } from '@/lib/ai/providers';
import { buildToolContext } from '@/lib/ai/situation-context';
import { buildGraphContext, writeToolDataServer } from '@/lib/ai/context-builder-server';
import { withCalibration } from '@/lib/api/with-calibration';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import { handleRouteError } from '@/lib/api/standard-error';
import type { Situation } from '@/types/situation';
import { isServerDemoMode } from '@/lib/demo/demo-mode';

const DEMO_RESPONSE = { satType: 'challenge', title: 'Challenge Assessment: Ceasefire Prospects', findings: [{ point: 'Assumption of GoN good faith may be overstated', confidence: 'medium', evidence: 'Historical pattern of ceasefire violations in previous agreements', implication: 'Monitoring mechanisms with enforcement teeth are critical' }, { point: 'DRM internal cohesion may be weaker than assessed', confidence: 'low', evidence: 'Reports of factional tensions in Eastern command', implication: 'A deal with DRM leadership may not bind field commanders' }, { point: 'Karovian withdrawal of support may be conditional', confidence: 'medium', evidence: 'Karovia has economic interests in Eastern mining concessions', implication: 'Economic incentives needed to secure Karovian neutrality' }], overallAssessment: 'The baseline assessment is partially confirmed but should be stress-tested against spoiler dynamics and implementation capacity gaps.', revisedConfidence: 'partially_confirmed', keyUncertainties: ['DRM factional command control', 'Karovian strategic intentions post-ceasefire'], recommendedActions: ['Commission rapid assessment of DRM internal cohesion', 'Engage Karovia on economic incentive package', 'Design monitoring protocol with automatic triggers'] };

export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const SATResultSchema = z.object({
  satType: z.enum(['challenge', 'assumptions', 'red_team', 'competing_hypotheses']),
  title: z.string().describe('Short title for this SAT result'),
  findings: z.array(z.object({
    point: z.string().describe('Key finding or alternative view'),
    confidence: z.enum(['high', 'medium', 'low']).describe('Confidence in this finding'),
    evidence: z.string().describe('Supporting evidence or reasoning'),
    implication: z.string().describe('What this means for the analysis'),
  })).min(3).max(8),
  overallAssessment: z.string().describe('Summary of what this SAT analysis reveals about the original assessment'),
  revisedConfidence: z.enum(['confirmed', 'partially_confirmed', 'uncertain', 'challenged', 'refuted']).describe('Impact on original assessment confidence'),
  keyUncertainties: z.array(z.string()).min(2).max(5).describe('Main uncertainties this analysis cannot resolve'),
  recommendedActions: z.array(z.string()).min(2).max(4).describe('Concrete next steps based on this analysis'),
});

// ---------------------------------------------------------------------------
// SAT type definitions
// ---------------------------------------------------------------------------

const SAT_CONFIGS = {
  challenge: {
    name: 'Challenge This Assessment',
    instruction: `Apply the "Challenge This Assessment" Structured Analytical Technique (SAT). Your goal is to rigorously challenge the original assessment by:
1. Identify 3-5 specific claims in the assessment that are most vulnerable to challenge
2. For each claim: What evidence would be needed to disprove it? What evidence is missing?
3. What alternative explanations exist for the same evidence base?
4. Are there cognitive biases (mirror imaging, confirmation bias, anchoring) that might have shaped this assessment?
5. What would a fully adversarial analyst argue against each key conclusion?`,
  },
  assumptions: {
    name: 'Check Key Assumptions',
    instruction: `Apply the "Key Assumptions Check" SAT (Heuer & Pherson). Systematically surface and scrutinize all assumptions:
1. List all explicit assumptions stated or implied in the assessment
2. For each assumption: How confident is this assumption? What is it based on?
3. What would happen to the conclusion if each assumption proved false?
4. Rank assumptions by: (a) confidence level and (b) impact on conclusion if wrong
5. Identify the "linchpin" assumptions — those most critical to the conclusion and least well-supported`,
  },
  red_team: {
    name: 'Red Team Analysis',
    instruction: `Apply Red Team analysis methodology. Adopt the perspective of an informed adversary or critic:
1. Argue the strongest possible counter-case to the original assessment
2. Identify what the adversary/opposite party might know that the analyst does not
3. What deceptive or denial operations might explain the observed evidence differently?
4. What course of action would an adversary take if they wanted to make this assessment wrong?
5. What "weak signals" or low-probability but high-impact scenarios has the original assessment underweighted?
6. Explicitly identify the assessment's most exploitable analytical vulnerabilities`,
  },
  competing_hypotheses: {
    name: 'Analysis of Competing Hypotheses',
    instruction: `Apply Analysis of Competing Hypotheses (ACH) methodology (Heuer 1999):
1. Generate 3-5 competing hypotheses that could explain the situation
2. For each hypothesis: List key evidence that is consistent with it and inconsistent with it
3. Score each hypothesis against each piece of evidence (+/0/-)
4. Identify which evidence is most diagnostic (best distinguishes between hypotheses)
5. Assess which hypothesis is least inconsistent with the overall evidence base
6. Flag critical evidence gaps that would allow hypothesis elimination`,
  },
};

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export const POST = withCalibration('advisory', 'ai_deep_think', {
  retrievalQuery: (_req, body) => {
    const s = body.situation as { name?: string; region?: string } | undefined;
    const t = typeof body.toolName === 'string' ? body.toolName : '';
    return [s?.name, s?.region, t].filter(Boolean).join(' — ') || undefined;
  },
})(async (request, ctx) => {
  try {
    const body = await request.json() as {
      satType: 'challenge' | 'assumptions' | 'red_team' | 'competing_hypotheses';
      assessmentContent: string;
      toolName?: string;
      situation?: Situation;
    };

    const { satType, assessmentContent, toolName, situation } = body;

    if (!satType || !assessmentContent) {
      return NextResponse.json({ error: 'satType and assessmentContent are required' }, { status: 400 });
    }

    if (isServerDemoMode()) {
      return NextResponse.json(DEMO_RESPONSE);
    }

    // Credits + profile gate already handled by withCalibration above.

    const sitContext = situation ? buildToolContext(situation) : '';
    const situationId = situation?.id ?? '';
    const graphCtx = situationId
      ? await buildGraphContext(ctx.uid, situationId, 'sat').catch(() => '')
      : '';

    const { systemPromptBlock, outputConstraints, provenance } = ctx.calibration;
    const langDirective = outputConstraints.language !== 'en'
      ? `\n\nRESPOND IN: ${outputConstraints.language.toUpperCase()}.`
      : '';
    const redLineDirective = outputConstraints.redLineClauses.length
      ? `\n\nRED LINES — DO NOT:\n${outputConstraints.redLineClauses.map(r => `  - ${r}`).join('\n')}`
      : '';

    const satConfig = SAT_CONFIGS[satType];

    const result = await generateText({
      model: getThinkingModel(),
      output: Output.object({ schema: SATResultSchema }),
      prompt: `${graphCtx ? `${graphCtx}\n\n` : ''}${sitContext ? `${sitContext}\n\n` : ''}You are applying a Structured Analytical Technique (SAT) to challenge and improve an analytical assessment.

TOOL/ASSESSMENT SOURCE: ${toolName || 'AI Analysis Tool'}

ORIGINAL ASSESSMENT TO ANALYZE:
${assessmentContent}

SAT TYPE: ${satConfig.name}

${satConfig.instruction}

Apply this SAT rigorously. The goal is NOT to confirm the original assessment but to stress-test it and surface analytical vulnerabilities. Be intellectually honest: if the assessment holds up well under scrutiny, say so, but still identify its weakest points. If it has serious problems, be explicit.

satType in your output: "${satType}"`,
      system: `You are a senior intelligence analyst specializing in Structured Analytical Techniques (SATs) and cognitive bias mitigation. You apply rigorous analytical frameworks to challenge, test, and improve intelligence assessments. Your work is used by multilateral diplomacy practitioners and diplomatic professionals. Never simply validate the original assessment — your value lies in finding what it misses, assumes, or gets wrong.

${systemPromptBlock}

Calibrate framing, tone, and recommendations to the analyst profile above. Honour the output-constraints block.${langDirective}${redLineDirective}`,
    });

    if (situationId && ctx.uid) {
      await writeToolDataServer(ctx.uid, situationId, `sat_${satType}`, result.output as Record<string, unknown>).catch(console.error);
      await saveToolOutput({
        uid: ctx.uid,
        situationId,
        toolId: 'advisory',
        profileVersion: provenance.profileVersion,
        output: result.output as Record<string, unknown>,
        metadata: { sat: satType, sourceToolName: toolName },
      }).catch((err) => console.warn('[sat] saveToolOutput failed:', err));
    }

    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'sat');
  }
});
