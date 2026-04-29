import { conductResearch, type ResearchMode, type ResearchDepth } from '@/lib/ai/research-engine';
import { isServerDemoMode, hashInput, getCachedResponse, formatAsStreamResponse } from '@/lib/demo/demo-mode';
import { withCalibration } from '@/lib/api/with-calibration';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import { validateAiRequest } from '@/lib/api/validate-request';
import { z } from 'zod';

export const maxDuration = 120;

type RequestResearchMode = ResearchMode;
type RequestResearchDepth = ResearchDepth;

const DeepResearchRequestSchema = z.object({
  query: z.string().min(1),
  mode: z.enum(['briefing', 'background', 'media-scan', 'actor-profile']).optional(),
  depth: z.enum(['quick', 'standard', 'comprehensive']).optional(),
  conflictContext: z.string().optional(),
  situationId: z.string().optional(),
});

export const POST = withCalibration('deep_research', 'ai_deep_think', {
  retrievalQuery: (_req, body) => {
    const q = typeof body.query === 'string' ? body.query : '';
    const ctxStr = typeof body.conflictContext === 'string' ? body.conflictContext : '';
    return [q, ctxStr].filter(Boolean).join(' — ') || undefined;
  },
})(async (request, ctx) => {
  try {
    const body = await request.json();
    const validation = validateAiRequest(body, DeepResearchRequestSchema);
    if (!validation.success) return validation.response;
    const {
      query,
      mode = 'briefing',
      depth = 'standard',
      conflictContext,
      situationId,
    } = validation.data as {
      query: string;
      mode?: RequestResearchMode;
      depth?: RequestResearchDepth;
      conflictContext?: string;
      situationId?: string;
    };

    // --- Demo mode: return pre-computed responses when no API key is set ---
    if (isServerDemoMode()) {
      const inputHash = hashInput({ content: query, mode, depth, context: conflictContext });
      if (inputHash) {
        const cached = getCachedResponse('deep_research', inputHash);
        if (cached) return formatAsStreamResponse(cached);
      }
      return new Response(
        JSON.stringify({ error: 'AI service not configured. Set GOOGLE_AI_API_KEY in environment variables.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Credits + profile gate already handled by withCalibration above.

    // Note: conductResearch wraps its own system prompt; calibration provenance is captured
    // by saveToolOutput below. Situation-specific calibration is still applied via profile gate.
    void ctx.calibration.systemPromptBlock;

    const result = await conductResearch({
      query,
      mode,
      depth,
      conflictContext,
    });

    // Best-effort persistence — only if situationId provided
    if (situationId && ctx.uid) {
      // conductResearch returns a stream; we can't easily capture full text without consuming it.
      // Emit a metadata-only saveToolOutput so profile-version provenance is recorded.
      await saveToolOutput({
        uid: ctx.uid,
        situationId,
        toolId: 'deep_research',
        profileVersion: ctx.calibration.provenance.profileVersion,
        toolRunId: ctx.toolRunId,
        output: { query, mode, depth, conflictContext, streamed: true },
        metadata: { streamed: true },
      }).catch((err) => console.warn('[deep_research] saveToolOutput failed:', err));
    }

    return result.toTextStreamResponse();
  } catch (err) {
    console.error('Deep research route error:', err);
    return new Response(JSON.stringify({ error: 'Research request failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
