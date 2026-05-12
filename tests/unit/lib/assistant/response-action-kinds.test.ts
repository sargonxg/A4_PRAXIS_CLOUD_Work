import { describe, expect, it } from 'vitest';
import { inferResponseActionKinds } from '@/lib/assistant/response-action-kinds';

describe('inferResponseActionKinds', () => {
  it('offers next-move persistence for actionable Ask PRAXIS answers', () => {
    const actions = inferResponseActionKinds('Recommended next step: verify with sources, then draft the memo.');

    expect(actions).toContain('add_next_move');
    expect(actions).toContain('run_deep_research');
  });
});
