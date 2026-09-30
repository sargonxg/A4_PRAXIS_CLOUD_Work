import { describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';

vi.mock('next/dynamic', () => ({
  default: (load: () => Promise<unknown>) => load.toString().includes('tasklet-praxis-workbench') ? 'memo-workbench' : 'home-shell',
}));
vi.mock('@/components/ui/skeleton', () => ({ Skeleton: 'skeleton' }));

import AppIndexPage from '@/app/app/page';

describe('authenticated Home saved memo dispatch', () => {
  it('opens a saved memo link in the existing workbench with bounded resource IDs', async () => {
    const page = await AppIndexPage({ searchParams: Promise.resolve({ memoId: ' case__policy-memo ', capsuleId: ' capsule-123 ' }) }) as ReactElement<Record<string, unknown>>;
    expect(page.type).toBe('memo-workbench');
    expect(page.props).toMatchObject({ mode: 'app', initialMemoId: 'case__policy-memo', capsuleId: 'capsule-123', initialPanel: 'ask' });
  });

  it.each([undefined, '', '  ', ['first', 'second'], 'a'.repeat(257), '../memo', 'memo\u0000id'])('keeps invalid or ambiguous memo IDs on Home (%j)', async (memoId) => {
    const page = await AppIndexPage({ searchParams: Promise.resolve({ memoId }) }) as ReactElement<{ children: ReactElement }>;
    expect(page.props.children.type).toBe('home-shell');
  });

  it('ignores ambiguous capsule parameters without losing a valid memo', async () => {
    const page = await AppIndexPage({ searchParams: Promise.resolve({ memoId: 'case__policy-memo', capsuleId: ['a', 'b'] }) }) as ReactElement<Record<string, unknown>>;
    expect(page.props).toMatchObject({ initialMemoId: 'case__policy-memo', capsuleId: 'default' });
  });
});
