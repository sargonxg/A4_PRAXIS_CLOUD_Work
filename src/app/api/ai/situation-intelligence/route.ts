import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Output } from 'ai';
import { withCalibration } from '@/lib/api/with-calibration';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import { saveToolData } from '@/lib/firebase/tool-data-service';
import { callProModel } from '@/lib/ai/providers';
import { buildCrossToolContext, buildToolContext, buildWebGroundedContext } from '@/lib/ai/situation-context';
import {
  SituationIntelligenceSchema,
  splitSourceFragments,
  validateSituationIntelligence,
  type SituationIntelligence,
} from '@/lib/ai/schemas/situation-intelligence';
import type { Situation } from '@/types/situation';

const TOOL_ID = 'situation-intelligence';

interface SituationIntelligenceRequest {
  situation?: Situation;
  inputText?: string;
}

function buildUserInput(situation: Situation, inputText?: string): string {
  const parts = [
    `Situation: ${situation.name}`,
    situation.region ? `Region: ${situation.region}` : null,
    situation.description ? `Description:\n${situation.description}` : null,
    situation.contextNotes ? `Analyst notes:\n${situation.contextNotes}` : null,
    situation.actors?.length ? `Actors:\n${situation.actors.map((actor) => `- ${actor}`).join('\n')}` : null,
    situation.sourceUrls?.length ? `Source URLs:\n${situation.sourceUrls.join('\n')}` : null,
    inputText?.trim() ? `Additional source text:\n${inputText.trim()}` : null,
  ].filter(Boolean);

  return parts.join('\n\n');
}

function scenarioTypesAreComplete(output: SituationIntelligence): boolean {
  const types = new Set(output.scenarios.map((scenario) => scenario.type));
  return types.has('best') && types.has('likely') && types.has('worst');
}

export const POST = withCalibration(TOOL_ID, 'ai_situation_intelligence', {
  retrievalQuery: (_req, body) => {
    const situation = body.situation as { name?: string; region?: string; actors?: string[] } | undefined;
    if (!situation?.name) return undefined;
    return [situation.name, situation.region, ...(situation.actors ?? [])].filter(Boolean).join(' ');
  },
})(async (req, ctx) => {
  const body = (await req.json().catch(() => ({}))) as SituationIntelligenceRequest;
  const situation = body.situation ?? null;

  if (!situation?.id || !situation.name) {
    return NextResponse.json(
      { error: 'A real active situation with an id and name is required.' },
      { status: 400 },
    );
  }

  const userInput = buildUserInput(situation, body.inputText);
  if (userInput.trim().length < 80) {
    return NextResponse.json(
      { error: 'The situation needs more real input before PRAXIS can generate trustworthy intelligence.' },
      { status: 422 },
    );
  }

  const sourceFragments = splitSourceFragments(userInput);
  const sourceBlock = sourceFragments
    .map((fragment) => `[${fragment.id}] ${fragment.label}\n${fragment.excerpt}`)
    .join('\n\n');
  const toolContext = buildToolContext(situation);
  const webContext = await buildWebGroundedContext(
    { name: situation.name, region: situation.region, actors: situation.actors, description: situation.description },
    TOOL_ID,
    ctx.uid,
  );
  const crossToolContext = ctx.uid
    ? await buildCrossToolContext(ctx.uid, situation.id, [
      'dashboard',
      'risk-assessment',
      'power-map',
      'conflict-graph',
      'scenarios',
    ])
    : '';

  let parsed: SituationIntelligence;
  try {
    const result = await callProModel({
      output: Output.object({ schema: SituationIntelligenceSchema }),
      system: `${ctx.calibration.systemPromptBlock}

You are PRAXIS, a senior intelligence system. Produce only live, situation-specific analysis derived from the supplied situation, source fragments, calibration context, and prior tool outputs. Do not invent source documents. Do not use placeholder names. Do not give generic management advice.

Required reasoning rules:
- Executive panel: one-line diagnosis, exactly 3 key insights, biggest risk, and best action.
- strategicInsight must be non-obvious and must explicitly combine at least 2 actors plus 1 constraint.
- Timeline items must be cause -> effect relationships extracted or inferred from real input.
- Actor dossiers must cover goals, leverage, and vulnerabilities for each material actor.
- Scenarios must be best, likely, and worst. Probabilities are estimates derived from tensions, constraints, actor leverage, and warning signals; never random.
- Risk score must be 0-100 and explained by named drivers.
- Actions must be concrete, situation-specific, and include expected outcomes.
- Live graph must be built from extracted primitives only: Actor -> Claim -> Interest -> Constraint -> Event. Every edge needs evidence.
- Provenance must reference the provided source fragment ids whenever possible. If the input is weak, say so in confidence.inputWeaknesses and confidence.note.
- Keep outputs concise enough for an executive dashboard but specific enough to act on.`,
      prompt: `SITUATION CONTEXT
${toolContext}

LIVE SOURCE CONTEXT
${webContext}

PRIOR SAVED ANALYSES
${crossToolContext || 'No prior saved analyses found for this situation.'}

SOURCE FRAGMENTS
${sourceBlock}

Generate the complete PRAXIS situation intelligence object now.`,
    });

    parsed = validateSituationIntelligence(result.output);
  } catch (err) {
    const isSchemaError = err instanceof ZodError;
    console.warn('[situation-intelligence] generation failed:', err);
    return NextResponse.json(
      {
        error: isSchemaError
          ? 'The AI output did not meet the PRAXIS intelligence schema. Please retry with more source detail.'
          : 'PRAXIS could not generate situation intelligence from the current input.',
        kind: isSchemaError ? 'schema_validation_failed' : 'generation_failed',
      },
      { status: 502 },
    );
  }

  if (!scenarioTypesAreComplete(parsed)) {
    return NextResponse.json(
      { error: 'AI output failed scenario coverage validation.' },
      { status: 502 },
    );
  }

  if (parsed.strategicInsight.actors.length < 2 || parsed.strategicInsight.constraint.trim().length < 10) {
    return NextResponse.json(
      { error: 'AI output failed strategic insight validation.' },
      { status: 502 },
    );
  }

  const response = {
    ...parsed,
    generatedAt: new Date().toISOString(),
    toolId: TOOL_ID,
  };

  let toolDataSaved = false;
  try {
    await saveToolData(ctx.uid, situation.id, TOOL_ID, response);
    toolDataSaved = true;
  } catch (err) {
    console.warn('[situation-intelligence] tool-data save failed:', err);
  }

  void saveToolOutput({
    uid: ctx.uid,
    situationId: situation.id,
    toolId: TOOL_ID,
    profileVersion: ctx.calibration.provenance.profileVersion,
    output: response,
    metadata: {
      kind: 'executive-situation-intelligence',
      source: 'real-ai',
      sourceFragmentCount: sourceFragments.length,
      toolDataSaved,
    },
  }).catch((err) => console.warn('[situation-intelligence] save failed:', err));

  return NextResponse.json({
    ...response,
    persistence: { toolDataSaved },
  });
});
