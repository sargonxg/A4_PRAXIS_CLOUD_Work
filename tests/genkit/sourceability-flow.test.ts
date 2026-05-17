import { beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('sourceabilityFlow', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.prompt.mockReturnValue(vi.fn(async () => {
      throw new Error('provider unavailable');
    }));
  });

  it('runs the sourceability dotprompt and normalizes source ids', async () => {
    const promptRunner = vi.fn(async () => ({
      output: {
        status: 'supported',
        explanation: 'The provided UN note directly supports the claim.',
        supportingSourceIds: ['src-1', 'unknown-source'],
        missingEvidence: [],
        suggestedRewrite: 'The ceasefire monitoring mission reported 12 incidents in March 2026.',
        citationWarnings: [],
      },
    }));
    mocks.prompt.mockReturnValue(promptRunner);

    const { sourceabilityFlow } = await import('@/lib/genkit/flows/sourceability');
    const result = await sourceabilityFlow({
      claimText: 'The ceasefire monitoring mission reported 12 incidents in March 2026.',
      sourceSnippets: [{
        id: 'src-1',
        title: 'UN monitoring update',
        date: '2026-03-31',
        url: 'https://example.org/un-note',
        span: 'The ceasefire monitoring mission reported 12 incidents in March 2026.',
      }],
    });

    expect(mocks.defineFlow).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'sourceability' }),
      expect.any(Function),
    );
    expect(mocks.prompt).toHaveBeenCalledWith('sourceability');
    expect(promptRunner).toHaveBeenCalledWith(
      expect.objectContaining({ claimText: expect.stringContaining('ceasefire monitoring') }),
      expect.objectContaining({ config: { temperature: 0 } }),
    );
    expect(result).toMatchObject({
      status: 'supported',
      supportingSourceIds: ['src-1'],
    });
  }, 10_000);

  it('marks direct provided evidence as supported deterministically', async () => {
    const { sourceabilityFlow } = await import('@/lib/genkit/flows/sourceability');
    const result = await sourceabilityFlow({
      claimText: 'The committee approved the remote work policy on 4 May 2026.',
      sourceSnippets: [
        {
          id: 'minutes',
          title: 'HR committee minutes',
          date: '2026-05-04',
          span: 'On 4 May 2026, the committee approved the remote work policy after legal review.',
        },
        {
          id: 'brief',
          title: 'Policy rollout brief',
          date: '2026-05-05',
          span: 'The approved remote work policy moved into the rollout communications stage.',
        },
      ],
    });

    expect(result.status).toBe('supported');
    expect(result.supportingSourceIds).toContain('minutes');
    expect(result.missingEvidence).toEqual([]);
  });

  it('marks partial evidence as weak deterministically', async () => {
    const { sourceabilityFlow } = await import('@/lib/genkit/flows/sourceability');
    const result = await sourceabilityFlow({
      claimText: 'The policy will significantly reduce attrition across the whole organization.',
      sourceSnippets: [{
        id: 'survey',
        title: 'Employee survey',
        span: 'Employees reported that remote work policy flexibility may improve retention in some teams.',
      }],
    });

    expect(result.status).toBe('weak');
    expect(result.supportingSourceIds).toEqual(['survey']);
    expect(result.citationWarnings).toContain('Evidence overlap is partial; cite cautiously or narrow the claim.');
  });

  it('marks missing evidence as unsupported deterministically', async () => {
    const { sourceabilityFlow } = await import('@/lib/genkit/flows/sourceability');
    const result = await sourceabilityFlow({
      claimText: 'The sanctions package has full regional support.',
      sourceSnippets: [{
        id: 'weather',
        title: 'Weather bulletin',
        span: 'Heavy rainfall is expected across the northern districts this week.',
      }],
    });

    expect(result.status).toBe('unsupported');
    expect(result.supportingSourceIds).toEqual([]);
    expect(result.suggestedRewrite).toContain('Treat as an evidence gap');
  });

  it('marks temporal claims without dated snippets as needing date checks', async () => {
    const { sourceabilityFlow } = await import('@/lib/genkit/flows/sourceability');
    const result = await sourceabilityFlow({
      claimText: 'The latest relief convoy currently reaches three border towns.',
      sourceSnippets: [{
        id: 'convoy',
        title: 'Relief convoy note',
        span: 'The relief convoy reaches three border towns according to the operations summary.',
      }],
    });

    expect(result.status).toBe('needs_date_check');
    expect(result.supportingSourceIds).toEqual(['convoy']);
    expect(result.citationWarnings).toContain('Temporal wording needs a dated source.');
  });
});
