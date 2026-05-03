import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EmptyState } from '@/components/praxis/empty-state';
import { ErrorState } from '@/components/praxis/error-state';

describe('empty/error states', () => {
  it('renders useful empty copy', () => {
    const html = renderToStaticMarkup(<EmptyState headline="No sources yet" subtext="Paste a UN Geneva URL to start." />);
    expect(html).toContain('No sources yet');
    expect(html).toContain('Paste a UN Geneva URL to start.');
  });

  it('renders useful retryable error copy', () => {
    const html = renderToStaticMarkup(<ErrorState headline="Recipe timed out" subtext="Showing cached result." onRetry={() => undefined} />);
    expect(html).toContain('Recipe timed out');
    expect(html).toContain('Retry');
  });
});
