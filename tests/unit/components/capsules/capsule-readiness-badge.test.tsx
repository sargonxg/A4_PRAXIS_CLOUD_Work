import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CapsuleReadinessBadge } from '@/components/capsules/CapsuleReadinessBadge';

describe('CapsuleReadinessBadge', () => {
  it('renders ready tier color, score, and default tooltip', () => {
    const html = renderToStaticMarkup(<CapsuleReadinessBadge score={91} tier="ready" size="sm" />);

    expect(html).toContain('bg-emerald-500');
    expect(html).toContain('91');
    expect(html).toContain('title="Ready"');
  });

  it('renders blocked tier color and top-blocker tooltip', () => {
    const html = renderToStaticMarkup(
      <CapsuleReadinessBadge score={32} tier="blocked" topBlocker="Missing source receipts" />,
    );

    expect(html).toContain('bg-red-500');
    expect(html).toContain('Top blocker: Missing source receipts');
  });

  it('renders a scoreless near badge without throwing', () => {
    const html = renderToStaticMarkup(<CapsuleReadinessBadge score={Number.NaN} tier="near" />);

    expect(html).toContain('bg-amber-400');
    expect(html).toContain('—');
  });
});
