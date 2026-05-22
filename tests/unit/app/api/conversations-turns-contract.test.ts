import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const routeSource = readFileSync(join(process.cwd(), 'src/app/api/conversations/[conversationId]/turns/route.ts'), 'utf8');

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
});
