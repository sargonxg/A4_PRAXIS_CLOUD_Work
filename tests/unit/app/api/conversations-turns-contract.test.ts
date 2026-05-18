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
});
