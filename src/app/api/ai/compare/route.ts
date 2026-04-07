import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getProModel } from '@/lib/ai/providers';
import { withAuth } from '@/lib/api/with-auth';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { NextResponse } from 'next/server';
import { buildGraphContext } from '@/lib/ai/context-builder-server';

export const maxDuration = 120;

const ComparisonSchema = z.object({
  summary: z.string().describe('High-level comparative summary in 2-3 paragraphs'),
  dimensions: z.array(z.object({
    dimension: z.string().describe('Comparison dimension (e.g., Conflict Type, Actors, Escalation Stage)'),
    situationA: z.string().describe('Assessment for situation A'),
    situationB: z.string().describe('Assessment for situation B'),
    significance: z.string().describe('What this difference means analytically'),
  })).describe('Structured comparison across key dimensions'),
  sharedPatterns: z.array(z.string()).describe('Structural similarities between the two situations'),
  keyDifferences: z.array(z.string()).describe('Most significant divergences'),
  lessonsApplicable: z.array(z.object({
    lesson: z.string(),
    fromSituation: z.enum(['a', 'b']),
    applicableTo: z.string(),
  })).describe('Lessons from one situation applicable to the other'),
  analogyStrength: z.enum(['strong', 'moderate', 'weak']).describe('How closely these situations map to each other'),
  analyticalCaveats: z.array(z.string()).describe('Important caveats and limitations of this comparison'),
});

export const POST = withAuth(async (request: Request, user) => {
  const body = await request.json();
  const { situationIdA, situationIdB, focusAreas } = body as {
    situationIdA: string;
    situationIdB: string;
    focusAreas?: string;
  };

  if (!situationIdA || !situationIdB) {
    return NextResponse.json({ error: 'Two situation IDs required' }, { status: 400 });
  }

  const creditCheck = await checkAndDeductCredits('ai_compare', 'Situation comparison');
  if (!creditCheck.allowed) return creditCheck.response;

  const [graphA, graphB] = await Promise.all([
    buildGraphContext(user.uid, situationIdA, 'compare').catch(() => ''),
    buildGraphContext(user.uid, situationIdB, 'compare').catch(() => ''),
  ]);

  const { text } = await generateText({
    model: getProModel(),
    experimental_output: Output.object({ schema: ComparisonSchema }),
    prompt: `You are a senior UN conflict analyst conducting a comparative analysis of two situations.

SITUATION A:
${graphA}

SITUATION B:
${graphB}

FOCUS AREAS: ${focusAreas || 'All dimensions — conflict dynamics, actors, escalation, opportunities for resolution'}

Conduct a rigorous comparative analysis. Identify structural similarities and key divergences.
Extract actionable lessons transferable between situations. Use calibrated confidence language.
Avoid superficial comparisons — focus on analytically significant patterns.`,
  });

  const parsed = typeof text === 'object' ? text : JSON.parse(text || '{}');
  return NextResponse.json(parsed);
});
