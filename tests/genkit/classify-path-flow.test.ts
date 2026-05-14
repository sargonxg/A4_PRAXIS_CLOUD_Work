import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  prompt: vi.fn(),
  defineFlow: vi.fn((_config, fn) => fn),
}));

vi.mock('@/lib/genkit', () => ({
  ai: {
    defineFlow: mocks.defineFlow,
    prompt: mocks.prompt,
  },
  gemini25Flash: { name: 'googleai/gemini-2.5-flash' },
}));

describe('classifyPathFlow', () => {
  it('runs the classify-path dotprompt and normalizes alternates', async () => {
    const promptRunner = vi.fn(async () => ({
      output: {
        pathId: 'diplomacy-path',
        confidence: 0.87,
        rationale: 'The seed text is about negotiations and red lines.',
        alternates: [
          { id: 'conflict-path', confidence: 0.55 },
          { id: 'diplomacy-path', confidence: 0.4 },
        ],
      },
    }));
    mocks.prompt.mockReturnValue(promptRunner);

    const { classifyPathFlow } = await import('@/lib/genkit/flows/classify-path');
    const result = await classifyPathFlow({
      domainId: 'diplomacy-negotiation',
      name: 'Border talks',
      description: 'Parties need redline mapping, leverage, and a negotiation brief.',
      sourceUrls: [],
    });

    expect(mocks.defineFlow).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'classifyPath' }),
      expect.any(Function),
    );
    expect(mocks.prompt).toHaveBeenCalledWith('classify-path');
    expect(promptRunner).toHaveBeenCalledWith(
      expect.objectContaining({
        domainId: 'diplomacy-negotiation',
        pathCatalogue: expect.stringContaining('diplomacy-path'),
      }),
      expect.objectContaining({ config: { temperature: 0 } }),
    );
    expect(result).toMatchObject({
      pathId: 'diplomacy-path',
      confidence: 0.87,
      alternates: [{ id: 'conflict-path', confidence: 0.55 }],
    });
  }, 15000);

  it('falls back deterministically when the model fails', async () => {
    mocks.prompt.mockReturnValue(vi.fn(async () => {
      throw new Error('model unavailable');
    }));

    const { classifyPathFlow } = await import('@/lib/genkit/flows/classify-path');
    const result = await classifyPathFlow({
      domainId: 'humanitarian',
      name: 'Flood displacement response',
      description: 'ReliefWeb reports needs, access constraints, UNHCR displacement, and IPC risk.',
      sourceUrls: [],
    });

    expect(result.pathId).toBe('humanitarian-path');
    expect(result.confidence).toBeGreaterThan(0);
  });
});
