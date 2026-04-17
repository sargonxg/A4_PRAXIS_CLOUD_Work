import { withAuth } from '@/lib/api/with-auth';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import {
  getVertexAgentConfig,
  createSession,
  streamAgentTurn,
  parseAgentEvent,
} from '@/lib/ai/vertex-agent';
import { getSituationAdmin } from '@/lib/firebase/situations';

export const maxDuration = 120;

/**
 * POST /api/ai/deep-search-agent
 *
 * Streams a research session with the Google ADK Deep Search agent on Vertex AI.
 *
 * Body: { query: string, situationId: string, sessionId?: string }
 * Returns: SSE stream of AgentEvents with PRAXIS envelope
 */
export const POST = withAuth(async (req, user) => {
  if (isServerDemoMode()) {
    return new Response(
      JSON.stringify({ error: 'Deep Research Agent requires a live AI configuration.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const credits = await checkAndDeductCredits('ai_deep_search_agent', 'ADK Deep Research Agent');
  if (!credits.allowed) return credits.response;

  const body = await req.json() as { query?: string; situationId?: string; sessionId?: string };
  const { query, situationId, sessionId: incomingSessionId } = body;

  if (!query?.trim()) {
    return new Response(
      JSON.stringify({ error: 'query is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const config = getVertexAgentConfig();
  if (!config) {
    return new Response(
      JSON.stringify({ error: 'Deep Research Agent is not configured. Set VERTEX_AGENT_ENGINE_ID env var.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Build situation-enriched query
  let enrichedQuery = query.trim();
  if (situationId && !user.isDemo) {
    try {
      const situation = await getSituationAdmin(user.uid, situationId);
      if (situation) {
        const actorList = situation.actors.slice(0, 8).join(', ') || 'not specified';
        const riskLabel = situation.riskScore >= 7 ? 'HIGH' : situation.riskScore >= 4 ? 'MODERATE' : 'LOW';
        enrichedQuery = `CONFLICT SITUATION: "${situation.name}" | Region: ${situation.region || 'unspecified'} | Key Actors: ${actorList} | Risk: ${riskLabel} (${situation.riskScore}/10)

RESEARCH QUERY: ${query.trim()}

Provide a thorough, evidence-based analysis using your web research capabilities. Ground your findings in reliable primary sources (UN reports, academic research, reputable news outlets). Structure your response as a professional intelligence brief.`;
      }
    } catch {
      // Non-blocking — proceed without context
    }
  }

  const encoder = new TextEncoder();

  function emit(obj: Record<string, unknown>): Uint8Array {
    return encoder.encode(`data: ${JSON.stringify(obj)}\n\n`);
  }

  const stream = new ReadableStream({
    async start(controller) {
      let sessionId = incomingSessionId;

      try {
        // Create session if we don't have one
        if (!sessionId) {
          controller.enqueue(emit({ type: 'status', text: 'Initializing research session…' }));
          sessionId = await createSession(config);
          controller.enqueue(emit({ type: 'session', sessionId }));
        }

        controller.enqueue(emit({ type: 'status', text: 'Connecting to Deep Research Agent…' }));

        const agentRes = await streamAgentTurn(config, sessionId, enrichedQuery);

        if (!agentRes.ok) {
          const errText = await agentRes.text();
          controller.enqueue(emit({
            type: 'error',
            text: `Agent returned HTTP ${agentRes.status}: ${errText.slice(0, 200)}`,
          }));
          controller.close();
          return;
        }

        if (!agentRes.body) {
          controller.enqueue(emit({ type: 'error', text: 'No response stream from agent' }));
          controller.close();
          return;
        }

        const reader = agentRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            // Strip SSE prefix
            const dataLine = trimmed.startsWith('data:')
              ? trimmed.slice(5).trim()
              : trimmed;

            const event = parseAgentEvent(dataLine);
            if (!event) continue;

            if (event.type === 'done') {
              controller.enqueue(emit({ type: 'done' }));
              controller.close();
              return;
            }

            if (event.type === 'error') {
              controller.enqueue(emit({ type: 'error', text: event.text }));
              continue;
            }

            // Forward with phase + author metadata
            controller.enqueue(emit({
              type: event.type,
              phase: event.phase,
              author: event.author,
              text: event.text,
            }));
          }
        }

        controller.enqueue(emit({ type: 'done' }));
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[deep-search-agent]', err);
        controller.enqueue(emit({ type: 'error', text: `Research agent error: ${message}` }));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
});
