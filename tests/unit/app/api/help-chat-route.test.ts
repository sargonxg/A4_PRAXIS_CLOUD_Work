import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  streamText: vi.fn(),
  getModel: vi.fn(() => 'mock-model'),
  getAdminDbOrThrow: vi.fn(() => {
    throw new Error('help route must not touch Firestore');
  }),
}));

vi.mock('ai', () => ({
  streamText: mocks.streamText,
}));

vi.mock('@/lib/ai/providers', () => ({
  getModel: mocks.getModel,
}));

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDbOrThrow: mocks.getAdminDbOrThrow,
}));

vi.mock('@/lib/api/with-auth', () => ({
  withAuth: (handler: (request: Request, user: { uid: string; isDemo: boolean }) => Promise<Response>) => (
    request: Request,
  ) => handler(request, { uid: 'user-1', isDemo: false }),
}));

describe('/api/help/chat route', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.streamText.mockReturnValue({
      textStream: (async function* stream() {
        yield 'PRAXIS help answer';
      })(),
    });
  });

  it('streams product help without reading or writing user conversations', async () => {
    const { POST } = await import('@/app/api/help/chat/route');
    const response = await POST(new Request('https://praxis.tacitus.me/api/help/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Can you read my active capsule?' }],
      }),
    }));

    expect(response.status).toBe(200);
    expect(mocks.getAdminDbOrThrow).not.toHaveBeenCalled();
    expect(mocks.streamText).toHaveBeenCalledWith(expect.objectContaining({
      model: 'mock-model',
      system: expect.stringContaining('never reads or writes user capsules'),
      messages: [expect.objectContaining({
        role: 'user',
        content: 'Can you read my active capsule?',
      })],
    }));
  });

  it('keeps the product-help implementation isolated from Ask persistence and AgentRun creation', () => {
    const routeSource = readFileSync(join(process.cwd(), 'src/app/api/help/chat/route.ts'), 'utf8');
    const helpClientSource = readFileSync(join(process.cwd(), 'src/components/app/help-agent.tsx'), 'utf8');

    expect(helpClientSource).toContain("fetch('/api/help/chat'");
    expect(routeSource).not.toContain('/api/conversations/');
    expect(routeSource).not.toContain('askPraxisPost');
    expect(routeSource).not.toContain('createAgentRun');
    expect(routeSource).not.toContain('persist');
    expect(routeSource).not.toContain('checkAndDeductCredits');
    expect(routeSource).not.toContain('getAdminDbOrThrow');
  });
});
