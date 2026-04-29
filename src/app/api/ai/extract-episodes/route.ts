import { NextResponse } from 'next/server';
import { Output } from 'ai';
import { z } from 'zod';
import { callProModel } from '@/lib/ai/providers';
import { withCalibration } from '@/lib/api/with-calibration';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import { createEpisode } from '@/lib/firebase/episodes';
import { handleRouteError } from '@/lib/api/standard-error';
import { validateAiRequest } from '@/lib/api/validate-request';
import {
  ExtractEpisodesOutputSchema,
  type Episode,
  type ExtractedEpisode,
} from '@/types/episode';

export const maxDuration = 60;

const RequestSchema = z.object({
  situationId: z.string().min(1),
});

/**
 * POST /api/ai/extract-episodes
 *
 * Runs Gemini Pro over the situation's description + contextNotes + sourceUrls
 * and produces 3–12 chronological Episode objects. All extracted episodes are
 * batch-written to users/{uid}/situations/{sid}/episodes/{episodeId} with
 * extractedBy='ai' and profile/domain provenance stamped from the calibration
 * context.
 *
 * Called automatically fire-and-forget after POST /api/situations creation,
 * and also available manually from the Timeline UI (P3 follow-up).
 *
 * See: docs/superpowers/specs/2026-04-19-generic-route-production-readiness-design.md §6
 */
export const POST = withCalibration('extract-episodes', 'ai_analysis')(
  async (request, user) => {
    try {
      const body = await request.json();
      const validation = validateAiRequest(body, RequestSchema);
      if (!validation.success) return validation.response;
      const { situationId } = validation.data;

      const { toolContext, provenance, systemPromptBlock, outputConstraints } =
        user.calibration;
      const situation = toolContext.situation;
      if (!situation || situation.id !== situationId) {
        return NextResponse.json(
          { error: 'Situation not found or access denied' },
          { status: 404 },
        );
      }

      // Compose source-text input for the AI
      const sourceLines = (situation.sourceUrls ?? [])
        .slice(0, 3)
        .map((url, i) => `  [${i + 1}] ${url}`)
        .join('\n');

      const situationInput = [
        `NAME: ${situation.name}`,
        situation.region ? `REGION: ${situation.region}` : null,
        situation.type ? `TYPE: ${situation.type}` : null,
        (situation.actors?.length ?? 0) > 0
          ? `KEY ACTORS: ${situation.actors.join(', ')}`
          : null,
        '',
        'DESCRIPTION:',
        situation.description || '(no description provided)',
        '',
        situation.contextNotes
          ? `CONTEXT NOTES:\n${situation.contextNotes}`
          : null,
        sourceLines ? `SOURCE URLS (first 3):\n${sourceLines}` : null,
      ]
        .filter(Boolean)
        .join('\n');

      const langDirective = outputConstraints.language !== 'en'
        ? `\n\nRESPOND IN: ${outputConstraints.language.toUpperCase()} (analyst's working language).`
        : '';

      const result = await callProModel({
        output: Output.object({ schema: ExtractEpisodesOutputSchema }),
        system: `You are a conflict-intelligence historian building a chronology of notable episodes in a situation's evolution. You work for the specific analyst described below — calibrate lens, mandate, audience, and red lines.

${systemPromptBlock}

Your job: extract 3–12 chronological Episodes that capture the pivotal moments, turning points, and inflection events in this situation's history. Neutral, evidence-based, cite actors using the situation's canonical names.${langDirective}`,
        prompt: `Extract between 3 and 12 Episodes (hard cap: 12) from the situation below.

${situationInput}

RULES
- Each Episode is one discrete historical moment (a ceasefire, a coup, an election, a speech, a military operation, a treaty, etc.).
- Order chronologically in your head but the output can be unordered — the system will sort by date.
- \`date\` is ISO 8601 — use "YYYY-MM-DD" when exact, "YYYY-MM" when only month is known, "YYYY" when only the year is known. Set \`dateConfidence\` accordingly.
- \`title\` is a short headline (≤100 chars).
- \`description\` is 2–4 neutral sentences of what happened and why it mattered.
- \`actors\` lists the actors central to the episode (use canonical names from the situation).
- \`importance\`: 1 (minor) to 5 (pivotal turning point). Reserve 5 for genuine inflection points.
- \`tags\`: free-form labels like "ceasefire", "coup", "election", "offensive", "treaty", "sanctions".
- \`sources\`: if you cite a URL from the source list, include it. Otherwise empty array.
- If the situation has little historical context, return fewer episodes rather than inventing events. A strong 3-episode chronology beats a fabricated 12.`,
      });

      const extracted = (result.output as { episodes: ExtractedEpisode[] })
        .episodes;

      const saved: Episode[] = [];
      for (const ep of extracted) {
        try {
          const created = await createEpisode(user.uid, situationId, {
            title: ep.title,
            date: ep.date,
            dateConfidence: ep.dateConfidence,
            description: ep.description,
            actors: ep.actors ?? [],
            importance: ep.importance,
            tags: ep.tags ?? [],
            sources: ep.sources ?? [],
            extractedBy: 'ai',
            profileVersion: provenance.profileVersion,
            domainVersion: provenance.domainVersion,
          });
          saved.push(created);
        } catch (err) {
          console.warn('[extract-episodes] createEpisode failed:', err);
        }
      }

      await saveToolOutput({
        uid: user.uid,
        situationId,
        toolId: 'extract-episodes',
        profileVersion: provenance.profileVersion,
        toolRunId: user.toolRunId,
        output: {
          episodeCount: saved.length,
          episodes: saved,
          generatedFrom: {
            situationName: situation.name,
            sourceUrlCount: situation.sourceUrls?.length ?? 0,
            hasContextNotes: Boolean(situation.contextNotes),
          },
        },
        metadata: {
          domainVersion: provenance.domainVersion,
          extractedCount: extracted.length,
          savedCount: saved.length,
        },
      }).catch((err) => console.warn('[extract-episodes] saveToolOutput failed:', err));

      return NextResponse.json({ episodes: saved });
    } catch (err) {
      return handleRouteError(err, 'extract-episodes');
    }
  },
);
