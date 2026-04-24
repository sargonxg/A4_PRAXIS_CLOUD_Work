/**
 * POST /api/ai/stakeholder-map
 *
 * Two modes, switched by request body:
 *
 * 1. { situation, situationId } → scatter-plot scoring pass.
 *    Reads the situation graph (Firestore admin), runs the Mitchell-Agle-Wood
 *    salience engine deterministically on the client-extracted graph, and
 *    returns P/L/U triples + quadrant per actor. No AI call by default — the
 *    heavy lift happened at extraction time. Result is persisted at
 *    `users/{uid}/situations/{sid}/tools/stakeholder_map`.
 *
 * 2. { situation, situationId, explainActorId } → AI explain pass.
 *    Calls the calibrated Pro model with a focused prompt asking why that
 *    actor sits where the score engine placed it. Produces a short rationale
 *    + stakeholder card data (interests, leverage, constraints, linked
 *    entities). Also persisted.
 *
 * Wrapped in withCalibration so profile + situation + domain + preferences
 * + SKC retrieval flow through the system prompt automatically.
 */

import { NextResponse } from 'next/server';
import { Output } from 'ai';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase/admin';
import { withCalibration } from '@/lib/api/with-calibration';
import { callProModel } from '@/lib/ai/providers';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import { handleRouteError } from '@/lib/api/standard-error';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { scoreSalience, type Salience } from '@/lib/analytics/salience-engine';
import type { GraphData, GraphNode, GraphEdge } from '@/lib/firebase/graph-service';
import type { Situation } from '@/types/situation';

export const maxDuration = 45;

const ExplainSchema = z.object({
  actorId: z.string(),
  actorLabel: z.string(),
  rationale: z.string().min(40).describe('Why this actor scores as it does on power, legitimacy, urgency.'),
  keyInterests: z.array(z.string()).min(1).max(5),
  leverage: z.array(z.string()).max(5).default([]),
  constraints: z.array(z.string()).max(5).default([]),
  linkedEntities: z.array(z.string()).max(10).default([]),
});

type ExplainOutput = z.infer<typeof ExplainSchema>;

interface StakeholderMapOutput {
  salience: Salience[];
  generatedAt: string;
  actorCount: number;
  graphLoaded: boolean;
  explain?: ExplainOutput;
}

// Deterministic fallback scoring when graph is empty — uses situation.actors
// list only so the page has something to render before extraction runs.
function fallbackSalience(actors: string[]): Salience[] {
  return actors.slice(0, 10).map((label, i) => {
    // Gently distributed placeholders so the scatter plot is non-degenerate.
    const power = Math.min(1, 0.35 + ((i * 17) % 55) / 100);
    const legitimacy = Math.min(1, 0.4 + ((i * 23) % 50) / 100);
    const urgency = Math.min(1, 0.3 + ((i * 11) % 60) / 100);
    return {
      actorId: `actor-${i}`,
      actorLabel: label,
      power,
      legitimacy,
      urgency,
      quadrant: 'non-stakeholder',
    };
  });
}

export const POST = withCalibration('stakeholder_map', 'ai_analysis', {
  retrievalQuery: (_req, body) => {
    const s = body.situation as { name?: string; region?: string } | undefined;
    return s?.name ? `${s.name} ${s.region ?? ''} actors stakeholders`.trim() : undefined;
  },
})(async (request, ctx) => {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      situation?: Situation;
      situationId?: string;
      explainActorId?: string;
    };

    const situation = body.situation ?? null;
    const situationId = body.situationId ?? situation?.id ?? '';

    // ── Demo mode: compute from situation.actors only, no persistence ─────────
    if (isServerDemoMode()) {
      const actors = situation?.actors ?? ['Government', 'Opposition', 'Mediator', 'Regional Patron'];
      return NextResponse.json({
        salience: fallbackSalience(actors),
        generatedAt: new Date().toISOString(),
        actorCount: actors.length,
        graphLoaded: false,
      } as StakeholderMapOutput);
    }

    // ── Load graph via admin SDK ─────────────────────────────────────────────
    let graphData: GraphData | null = null;
    if (situationId && adminDb) {
      try {
        const snap = await adminDb
          .collection('users').doc(ctx.uid)
          .collection('situations').doc(situationId)
          .collection('graph').doc('main')
          .get();
        if (snap.exists) graphData = snap.data() as GraphData;
      } catch (err) {
        console.warn('[stakeholder-map] graph load failed:', err);
      }
    }

    const nodes: GraphNode[] = graphData?.nodes ?? [];
    const edges: GraphEdge[] = graphData?.edges ?? [];

    const salience = nodes.length > 0
      ? scoreSalience(nodes, edges)
      : fallbackSalience(situation?.actors ?? []);

    // ── Optional AI explain pass ─────────────────────────────────────────────
    let explain: ExplainOutput | undefined;
    if (body.explainActorId) {
      const target = salience.find((s) => s.actorId === body.explainActorId);
      if (!target) {
        return NextResponse.json(
          { error: `actorId ${body.explainActorId} not found in salience output` },
          { status: 404 },
        );
      }
      const { systemPromptBlock, outputConstraints, provenance } = ctx.calibration;
      const redLines = outputConstraints.redLineClauses.length
        ? `\n\nRED LINES — DO NOT:\n${outputConstraints.redLineClauses.map((r: string) => `  - ${r}`).join('\n')}`
        : '';
      const lang = outputConstraints.language !== 'en'
        ? `\n\nRESPOND IN: ${outputConstraints.language.toUpperCase()}.`
        : '';

      const linkedRelations = edges
        .filter((e) => e.source === target.actorId || e.target === target.actorId)
        .slice(0, 30)
        .map((e) => `${e.source} —[${e.type}]→ ${e.target}`)
        .join('\n');

      const result = await callProModel({
        output: Output.object({ schema: ExplainSchema }),
        system: `${systemPromptBlock}\n\nYou explain Mitchell-Agle-Wood stakeholder salience to senior UN political-affairs officers. Explanations are grounded, specific, and honour the calibration above.${lang}${redLines}`,
        prompt: `Situation: ${situation?.name ?? '(unnamed)'} — ${situation?.region ?? ''}
Actor: ${target.actorLabel} (id: ${target.actorId})

Deterministic salience scores (0-1 each):
  power       = ${target.power.toFixed(2)}
  legitimacy  = ${target.legitimacy.toFixed(2)}
  urgency     = ${target.urgency.toFixed(2)}
  quadrant    = ${target.quadrant}

Graph edges involving this actor:
${linkedRelations || '(none)'}

Explain — in one analytical paragraph — why this actor sits where it sits. Then list keyInterests, leverage, constraints, and linkedEntities (actor labels this actor interacts with most). Strict schema compliance.`,
      });

      explain = { ...(result.output as ExplainOutput), actorId: target.actorId, actorLabel: target.actorLabel };

      // Persist only when we have a full pass
      await saveToolOutput({
        uid: ctx.uid,
        situationId,
        toolId: 'stakeholder_map',
        profileVersion: provenance.profileVersion,
        output: { salience, explain } as unknown as Record<string, unknown>,
        metadata: { kind: 'explain', actorId: target.actorId },
      }).catch((err) => console.warn('[stakeholder-map] save failed:', err));
    } else if (situationId) {
      // Persist the plain scoring pass too, so the client can load from cache.
      await saveToolOutput({
        uid: ctx.uid,
        situationId,
        toolId: 'stakeholder_map',
        profileVersion: ctx.calibration.provenance.profileVersion,
        output: { salience } as unknown as Record<string, unknown>,
        metadata: { kind: 'salience' },
      }).catch((err) => console.warn('[stakeholder-map] save failed:', err));
    }

    const payload: StakeholderMapOutput = {
      salience,
      generatedAt: new Date().toISOString(),
      actorCount: salience.length,
      graphLoaded: graphData !== null,
      ...(explain ? { explain } : {}),
    };

    return NextResponse.json(payload);
  } catch (err) {
    return handleRouteError(err, 'stakeholder-map');
  }
});
