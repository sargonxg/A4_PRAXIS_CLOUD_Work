import { streamText } from 'ai';
import { getModel } from '@/lib/ai/providers';
import { buildToolContext } from '@/lib/ai/situation-context';
import { searchWeb, formatResultsAsContext } from '@/lib/ai/firecrawl';
import { withAuth } from '@/lib/api/with-auth';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { handleRouteError } from '@/lib/api/standard-error';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

export const POST = withAuth(async (request, _user) => {
  try {
    const creditCheck = await checkAndDeductCredits('ai_brief', 'Intelligence brief generation');
    if (!creditCheck.allowed) return creditCheck.response!;

    const body = await request.json() as {
      situationName?: string;
      situation?: Situation;
    };

    const { situationName, situation } = body;

    // Build rich context — prefer full situation object; fallback to name
    const sitContext = situation ? buildToolContext(situation) : '';

    // Live web research to ground the brief in current reporting
    let liveContext = '';
    try {
      const searchTerm = situation?.name ?? situationName ?? '';
      if (searchTerm) {
        const results = await searchWeb(
          `${searchTerm} latest developments conflict update 2025 2026`,
          { numResults: 4 },
        );
        if (results.length > 0) {
          liveContext = '\n\nLIVE INTELLIGENCE SOURCES:\n' + formatResultsAsContext(results);
        }
      }
    } catch { /* non-blocking */ }

    const name = situation?.name ?? situationName ?? 'the active situation';
    const region = situation?.region ?? '';
    const glaslStage = situation?.glaslStage ?? null;
    const riskScore = situation?.riskScore ?? null;
    const actors = situation?.actors?.slice(0, 4).join(', ') ?? '';

    const result = streamText({
      model: getModel(),
      system: `You are a senior UN Political Affairs Officer preparing a concise morning intelligence brief.
Write in professional UN diplomatic register. Use **bold headers** for each section.
Be precise, evidence-grounded, and actionable. Avoid speculation — note uncertainty where relevant.`,
      messages: [
        {
          role: 'user',
          content: `${sitContext ? `${sitContext}\n\n---\n\n` : ''}${liveContext ? `${liveContext}\n\n---\n\n` : ''}Generate a morning intelligence brief for: **${name}**${region ? ` (${region})` : ''}.

${glaslStage ? `Glasl Escalation Stage: ${glaslStage}/9` : ''}
${riskScore ? `Risk Score: ${riskScore}/10` : ''}
${actors ? `Key Actors: ${actors}` : ''}

Structure the brief with these three sections:

**Situation Overview**
2–3 sentences on the current state of the conflict — key dynamics, recent developments, trajectory.

**Key Risks & Flashpoints**
2–3 bullet points on the most significant near-term risks or escalation triggers. Be specific.

**Priority Action**
1 clear recommended action for a mediator or political affairs officer right now.

Keep the entire brief under 250 words. Cite live sources where available.`,
        },
      ],
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    return handleRouteError(err, 'brief');
  }
});
