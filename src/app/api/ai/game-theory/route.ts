import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getThinkingModel } from '@/lib/ai/providers';
import { buildToolContext, buildWebGroundedContext } from '@/lib/ai/situation-context';
import { buildGraphContext, writeToolDataServer } from '@/lib/ai/context-builder-server';
import { withCalibration } from '@/lib/api/with-calibration';
import { validateAiRequest } from '@/lib/api/validate-request';
import { handleRouteError } from '@/lib/api/standard-error';
import { situationContextSchema } from '@/lib/api/schemas';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import type { Situation } from '@/types/situation';
import { isServerDemoMode } from '@/lib/compat/sample-mode';

const DEMO_RESPONSE = {
  actors: [{ id: 'a1', name: 'Government', strategies: ['Negotiate', 'Escalate'], dominantStrategy: 'Negotiate' }, { id: 'a2', name: 'Armed Group', strategies: ['Cooperate', 'Defect'], dominantStrategy: null }],
  payoffMatrix: [{ actor1Strategy: 'Negotiate', actor2Strategy: 'Cooperate', payoffs: { a1: 7, a2: 7 }, isNashEquilibrium: true, isParetoOptimal: true }, { actor1Strategy: 'Escalate', actor2Strategy: 'Defect', payoffs: { a1: 2, a2: 2 }, isNashEquilibrium: true, isParetoOptimal: false }],
  equilibria: { nashEquilibria: [{ strategies: { a1: 'Negotiate', a2: 'Cooperate' }, description: 'Mutual cooperation achieves stable peace equilibrium' }], paretoOptimalOutcomes: [{ strategies: { a1: 'Negotiate', a2: 'Cooperate' }, description: 'Best outcome for all parties' }], dominantStrategyEquilibrium: null },
  archetypes: [{ name: 'Coordination Game', description: 'Both parties benefit from aligning on a shared solution', stateValue: 7, implication: 'Focus on confidence-building measures' }],
  strategicInsights: 'Demo: In this scenario, mutual negotiation produces the optimal Pareto equilibrium. Both parties have dominant incentives to cooperate when security guarantees are in place.',
  recommendations: ['Establish confidence-building measures as preconditions', 'Propose phased implementation to reduce defection risk', 'Engage third-party guarantors to enforce agreements'],
  matrixDimensions: { actors: ['Government', 'Armed Group'], rows: ['Negotiate', 'Escalate'], columns: ['Cooperate', 'Defect'] },
};

export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Request schema
// ---------------------------------------------------------------------------

const requestSchema = z.object({
  actors: z.array(z.string()).min(2).max(4),
  strategies: z.record(z.string(), z.array(z.string())),
  analysisType: z.enum(['strategic_form', 'sequential', 'archetypes']).default('strategic_form'),
  situation: situationContextSchema.optional(),
  conflictContext: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Output schema
// ---------------------------------------------------------------------------

const GameTheoryOutputSchema = z.object({
  actors: z.array(z.object({
    id: z.string(),
    name: z.string(),
    strategies: z.array(z.string()),
    dominantStrategy: z.string().nullable(),
  })),
  payoffMatrix: z.array(z.object({
    actor1Strategy: z.string(),
    actor2Strategy: z.string(),
    payoffs: z.record(z.string(), z.number()),
    isNashEquilibrium: z.boolean(),
    isParetoOptimal: z.boolean(),
  })),
  equilibria: z.object({
    nashEquilibria: z.array(z.object({
      strategies: z.record(z.string(), z.string()),
      description: z.string(),
    })),
    paretoFrontier: z.array(z.object({
      strategies: z.record(z.string(), z.string()),
      jointPayoff: z.number(),
    })),
    dominantStrategies: z.record(z.string(), z.string().nullable()),
  }),
  gameArchetype: z.object({
    name: z.enum([
      "Prisoner's Dilemma",
      'Chicken Game',
      'Stag Hunt',
      'Assurance Game',
      'Battle of the Sexes',
      'Coordination Game',
      'Zero-Sum',
      'Mixed',
    ]),
    description: z.string(),
    conflictImplication: z.string(),
    cooperationConditions: z.string(),
  }),
  sequentialTree: z.array(z.object({
    id: z.string(),
    actor: z.string(),
    action: z.string(),
    parentId: z.string().nullable(),
    probability: z.number(),
    payoffEstimate: z.number(),
    depth: z.number(),
  })),
  analysis: z.object({
    strategicLandscape: z.string(),
    dominantPatterns: z.string(),
    cooperationBarriers: z.string(),
    commitmentMechanisms: z.string(),
    historicalParallels: z.string(),
    policyRecommendations: z.array(z.string()),
  }),
});

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export const POST = withCalibration('game_theory', 'ai_game_theory', {
  retrievalQuery: (_req, body) => {
    const actors = Array.isArray(body.actors) ? (body.actors as string[]).join(', ') : '';
    const ctx = typeof body.conflictContext === 'string' ? body.conflictContext : '';
    return [actors, ctx].filter(Boolean).join(' — ') || undefined;
  },
})(async (request: Request, user) => {
  if (!process.env.GOOGLE_AI_API_KEY) {
    return new Response(JSON.stringify({ error: 'AI not configured' }), { status: 503 });
  }

  try {
    const body = await request.json();

    const validation = validateAiRequest(body, requestSchema);
    if (!validation.success) return validation.response;

    const { actors, strategies, analysisType, situation, conflictContext } = validation.data;
    const situationId = (situation as unknown as { id?: string })?.id ?? '';

    if (isServerDemoMode()) {
      return NextResponse.json(DEMO_RESPONSE);
    }

    // Credits + profile gate already handled by withCalibration above.

    const sitContext = situation ? buildToolContext(situation as unknown as Situation) : '';

    const graphCtx = situationId
      ? await buildGraphContext(user.uid, situationId, 'game_theory').catch(() => '')
      : '';

    // --- Web grounded context ---
    const webCtx = situation
      ? await buildWebGroundedContext(
          { name: (situation as unknown as Situation).name, region: (situation as unknown as Situation).region, actors: (situation as unknown as Situation).actors as string[] | undefined },
          'game-theory',
          user.uid
        )
      : '';

    // Build actor strategy descriptions for the prompt
    const actorStrategyList = actors
      .map((actor) => {
        const actorStrategies = strategies[actor] ?? [];
        return `  - ${actor}: [${actorStrategies.map((s) => `"${s}"`).join(', ')}]`;
      })
      .join('\n');

    const conflictDesc = conflictContext
      ? `CONFLICT CONTEXT: ${conflictContext}`
      : sitContext
      ? ''
      : 'No specific conflict context provided.';

    const analysisFocus =
      analysisType === 'sequential'
        ? 'Focus especially on the sequential game tree — model 2 full levels of moves and responses with realistic probabilities.'
        : analysisType === 'archetypes'
        ? 'Focus especially on game archetype identification and its conflict implications.'
        : 'Focus especially on the payoff matrix and Nash equilibrium identification.';

    const prompt = `${graphCtx ? `${graphCtx}\n\n` : ''}${webCtx ? `${webCtx}\n\n` : ''}${sitContext ? `${sitContext}\n\n` : ''}${conflictDesc ? `${conflictDesc}\n\n` : ''}You are a formal game theorist and conflict analyst applying rigorous strategic interaction analysis to this armed or political conflict. Your framework draws on:

- Nash (1950): Nash Equilibrium — no actor can unilaterally improve their payoff
- von Neumann & Morgenstern (1944): Expected utility and zero-sum analysis
- Schelling (1960): Focal points, commitment, threats, and promises as conflict instruments
- Fearon (1995): Rationalist explanations for war — information asymmetry, commitment problems, issue indivisibility
- Putnam (1988): Two-level games — domestic constraints shaping international bargaining

ACTORS IN THIS ANALYSIS:
${actors.map((a) => `  - ${a}`).join('\n')}

STRATEGIES UNDER CONSIDERATION:
${actorStrategyList}

ANALYSIS TYPE: ${analysisType}
${analysisFocus}

YOUR TASK:

1. **Payoff Matrix**: For each combination of Actor 1 and Actor 2 strategies, assign integer payoffs from -10 to +10 for each actor. Be analytically rigorous — payoffs should reflect real strategic interests, not symmetric values. Factor in military costs, political legitimacy, economic interests, and international standing. Identify which cells are Nash Equilibria (no actor can unilaterally deviate to improve) and which are Pareto Optimal (no outcome makes everyone better off without making someone worse off).

2. **Dominant Strategies**: For each actor, identify their dominant strategy if one exists (a strategy that is always best regardless of what others do). If no pure dominant strategy exists, state null.

3. **Nash Equilibria**: List all Nash Equilibria found. For each, describe why it is stable and what it implies for conflict dynamics. If the Nash Equilibrium is suboptimal for both parties (as in a Prisoner's Dilemma), explain the tragedy of strategic logic at play.

4. **Game Archetype**: Classify this conflict interaction as one of the canonical game types. Be precise — for example, if actors have dominant strategies that lead to mutual defection but cooperation would be better for both, it is a Prisoner's Dilemma. If the key dynamic is mutual destruction deterrence, it may be Chicken. Match the actual payoff structure to the archetype.

5. **Sequential Tree**: Model the first two levels of sequential moves. Start with whichever actor would move first (typically the initiating party or the one with current escalation options). For each node: assign a probability (0–1, sums to 1 across siblings), estimate the payoff outcome (-10 to +10 aggregate), and assign a depth (0 = root, 1 = first move, 2 = response). Include at least 6–8 nodes total.

6. **Strategic Analysis**:
   - Strategic Landscape: What is the overall structure of strategic interaction? Who has the most leverage?
   - Dominant Patterns: What behavioral patterns does game theory predict for these actors?
   - Cooperation Barriers: What specific commitment problems, information asymmetries, or indivisibilities prevent cooperation (Fearon 1995)?
   - Commitment Mechanisms: What Schelling-style commitment devices, third-party guarantors, or sequencing arrangements could unlock cooperation?
   - Historical Parallels: Name 2–3 historical conflicts with structurally similar game dynamics and what they reveal.
   - Policy Recommendations: 4–6 specific, actionable recommendations for mediators or policymakers based on the game-theoretic analysis.

Reference the actors by their exact names. Ground payoff values in real strategic interests — economic, military, political, reputational. Be analytically precise, not generic.`;

    // Calibrated system prompt (analyst profile + situation + red lines)
    const { systemPromptBlock, outputConstraints, provenance } = user.calibration;
    const langDirective = outputConstraints.language !== 'en'
      ? `\n\nRESPOND IN: ${outputConstraints.language.toUpperCase()}.`
      : '';
    const redLineDirective = outputConstraints.redLineClauses.length
      ? `\n\nRED LINES — DO NOT:\n${outputConstraints.redLineClauses.map(r => `  - ${r}`).join('\n')}`
      : '';

    const result = await generateText({
      model: getThinkingModel(),
      output: Output.object({ schema: GameTheoryOutputSchema }),
      prompt,
      system: `You are a formal game theorist and conflict analyst at a major international peace research institute. You apply Nash equilibrium theory, Schelling focal points, Fearon rationalist war causes, and Putnam two-level games to armed conflicts and political crises. You produce rigorous, mathematically consistent payoff matrices with analytically defensible values. Every payoff you assign must be explainable by reference to strategic interests. Never produce symmetric or arbitrary payoff values — they must reflect real incentive structures.

${systemPromptBlock}

Calibrate the framing and recommendations to the analyst profile above (mandate, lens, audience). Honour the output-constraints block.${langDirective}${redLineDirective}`,
    });

    if (situationId && user.uid) {
      await writeToolDataServer(user.uid, situationId, 'game_theory', result.output as Record<string, unknown>).catch(
        (err) => console.error('[game-theory] persist failed:', err),
      );
      await saveToolOutput({
        uid: user.uid,
        situationId,
        toolId: 'game_theory',
        profileVersion: provenance.profileVersion,
        output: result.output as Record<string, unknown>,
      }).catch((err) => console.warn('[game-theory] saveToolOutput failed:', err));
    }
    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'game-theory');
  }
});
