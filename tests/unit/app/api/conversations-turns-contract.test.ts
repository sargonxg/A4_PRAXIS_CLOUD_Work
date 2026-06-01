import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const routeSource = readFileSync(join(process.cwd(), 'src/app/api/conversations/[conversationId]/turns/route.ts'), 'utf8');
const chatRouteSource = readFileSync(join(process.cwd(), 'src/app/api/ai/chat/route.ts'), 'utf8');
const answerEnvelopeSource = readFileSync(join(process.cwd(), 'src/lib/ai/ask-answer-envelope.ts'), 'utf8');
const chatStreamPayloadSource = readFileSync(join(process.cwd(), 'src/lib/ai/ask-chat-stream-payload.ts'), 'utf8');
const persistedEnvelopeContractSource = `${chatRouteSource}\n${answerEnvelopeSource}`;

describe('conversation turns Ask PRAXIS contract', () => {
  it('delegates logged-in turns with the full capsule routing envelope', () => {
    for (const expected of [
      'threadId: cleanConversationId',
      'capsuleId: parsed.data.capsuleId',
      'appliedCapsules',
      'contextPackageId',
      'activeContextStack',
      'currentPath',
      'currentToolId',
      "new URL('/api/ai/ask-praxis', request.url)",
    ]) {
      expect(routeSource).toContain(expected);
    }
  });

  it('returns a capsule-context 412 instead of silently calling the model with no signal', () => {
    expect(routeSource).toContain('hasConversationCapsuleSignal');
    expect(routeSource).toContain("code: 'capsule_context_required'");
    expect(routeSource).toContain('{ status: 412 }');
  });

  it('passes the paid agentic search toggle through aiSettings only', () => {
    expect(routeSource).toContain('agenticSearchPremium');
    expect(routeSource).toContain('aiSettings: withResearchGraphSetting(parsed.data.aiSettings, researchGraphExtra)');
    expect(routeSource).not.toContain('EXA_API_KEY');
  });

  it('does not subscription-gate the free Research graph per-turn toggle', () => {
    expect(routeSource).toContain('researchGraphExtra');
    expect(routeSource).toContain('requestedAgenticSearchPremium');
    expect(routeSource).not.toContain('research_graph_requires_subscription');
    expect(routeSource).not.toContain("meetsTier(tier, 'analyst') && requestedResearchGraph");
  });

  it('persists reload-critical Ask answer envelope fields as first-class saved turn data', () => {
    expect(chatRouteSource).toContain('answerEnvelope: input.runtime.answerEnvelope');
    expect(chatRouteSource).toContain('queuedRunId: queuedRunIdFromAnswerEnvelope(input.runtime.answerEnvelope)');
    expect(chatRouteSource).toContain('runId: queuedRunIdFromAnswerEnvelope(input.runtime.answerEnvelope)');
    expect(chatRouteSource).toContain('orchestrationTraceId: input.runtime.orchestrationReceipt?.traceId');
    for (const expected of [
      'orchestrationReceipt',
      'answerQualitySummary',
      'agenticDepthRecommendation',
      'contextRepairActions',
      'sourceCards',
      'documentPackCandidate',
      'supervisor.queuedRun',
      'agentRunSnapshot',
    ]) {
      expect(persistedEnvelopeContractSource).toContain(expected);
    }
  });

  it('persists a compact AgentRun snapshot on the saved conversation turn', () => {
    expect(chatRouteSource).toContain('agentRunSnapshotFromAnswerEnvelope');
    expect(chatRouteSource).toContain('latestAgentRunSnapshot: agentRunSnapshotFromAnswerEnvelope(input.runtime.answerEnvelope)');
    expect(chatRouteSource).toContain('agentRunSnapshot: agentRunSnapshotFromAnswerEnvelope(input.runtime.answerEnvelope)');
  });

  it('streams sourceability verdicts as a first-class chat payload item', () => {
    expect(answerEnvelopeSource).toContain('sourceabilityVerdicts');
    expect(chatRouteSource).toContain('buildAskChatFinishPayloads');
    expect(chatStreamPayloadSource).toContain("type: 'sourceabilityVerdicts'");
    expect(chatStreamPayloadSource).toContain('sourceabilityVerdicts: input.answerEnvelope.sourceabilityVerdicts');
  });
});
