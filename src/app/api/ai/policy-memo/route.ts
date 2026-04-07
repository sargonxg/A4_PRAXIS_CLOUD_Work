import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getProModel } from '@/lib/ai/providers';
import { withAuth } from '@/lib/api/with-auth';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { NextResponse } from 'next/server';
import { buildGraphContext, writeToolDataServer } from '@/lib/ai/context-builder-server';

export const maxDuration = 120;

const PolicyMemoSchema = z.object({
  classification: z.string().describe('Classification level: FOR OFFICIAL USE ONLY or UNCLASSIFIED'),
  to: z.string().describe('Addressee: Senior Leadership, DPPA, or relevant body'),
  from: z.string().describe('Drafter: PRAXIS Conflict Intelligence'),
  subject: z.string().describe('Concise subject line capturing the policy question'),
  executiveSummary: z.string().describe('2-3 sentence summary of the problem, recommendation, and expected outcome'),
  problemStatement: z.string().describe('Analytical framing of the policy problem — why action is required now'),
  contextAndBackground: z.string().describe('Relevant history, actors, and dynamics in 3-4 paragraphs'),
  policyOptions: z.array(z.object({
    option: z.string(),
    pros: z.array(z.string()),
    cons: z.array(z.string()),
    riskLevel: z.enum(['low', 'medium', 'high']),
    resourceImplications: z.string(),
  })).describe('2-4 realistic policy options with trade-off analysis'),
  recommendation: z.string().describe('Recommended course of action with rationale'),
  implementationSteps: z.array(z.string()).describe('Concrete near-term actions in priority order'),
  monitoringIndicators: z.array(z.string()).describe('Early warning indicators to track implementation effectiveness'),
  risks: z.string().describe('Key risks to the recommended approach and mitigation strategies'),
});

export const POST = withAuth(async (request: Request, user) => {
  const body = await request.json();
  const { situationId, policyQuestion, audience = 'Senior Leadership' } = body;

  const creditCheck = await checkAndDeductCredits('ai_policy_memo', 'Policy memo');
  if (!creditCheck.allowed) return creditCheck.response;

  const graphContext = await buildGraphContext(user.uid, situationId, 'policy-memo').catch(() => '');

  const { text } = await generateText({
    model: getProModel(),
    experimental_output: Output.object({ schema: PolicyMemoSchema }),
    prompt: `You are a senior UN political affairs officer drafting a policy memorandum for ${audience}.

GRAPH INTELLIGENCE:
${graphContext}

POLICY QUESTION: ${policyQuestion || 'What are the recommended policy options for managing this situation?'}

Draft a comprehensive policy memorandum following UN DPPA standards. Be analytical, concrete, and action-oriented.
Use calibrated confidence language. All recommendations must be politically feasible and grounded in the situation context.`,
  });

  const parsed = typeof text === 'object' ? text : JSON.parse(text || '{}');
  await writeToolDataServer(user.uid, situationId, 'policy_memo', parsed).catch(() => {});

  return NextResponse.json(parsed);
});
