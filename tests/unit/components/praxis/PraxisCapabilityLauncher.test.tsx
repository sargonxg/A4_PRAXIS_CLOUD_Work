import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { PraxisCapabilityLauncher } from '@/components/praxis/PraxisCapabilityLauncher';

describe('PraxisCapabilityLauncher', () => {
  it('surfaces the five high-visibility capabilities without adding navigation', () => {
    const html = renderToStaticMarkup(
      <PraxisCapabilityLauncher
        contextMode="instant"
        activeCapsuleLabel={null}
        sourceCount={0}
        reviewQueueCount={2}
        createdWorkCount={1}
        onAskInstant={vi.fn()}
        onSaveInstantContext={vi.fn()}
        onImproveCapsule={vi.fn()}
        onCreateWorkProduct={vi.fn()}
        onCreateWatchlist={vi.fn()}
        onOpenReviewQueue={vi.fn()}
      />,
    );

    expect(html).toContain('data-testid="praxis-capability-launcher"');
    expect(html).toContain('Instant context');
    expect(html).toContain('Save as capsule');
    expect(html).toContain('Improve capsule');
    expect(html).toContain('Work product');
    expect(html).toContain('Source intelligence');
    expect(html).toContain('Review queue');
    expect(html).toContain('not saved');
  });

  it('labels the saved-capsule path without hiding review complexity', () => {
    const html = renderToStaticMarkup(
      <PraxisCapabilityLauncher
        contextMode="capsule"
        activeCapsuleLabel="Federal AI Governance File"
        sourceCount={3}
        reviewQueueCount={4}
        createdWorkCount={2}
        onAskInstant={vi.fn()}
        onSaveInstantContext={vi.fn()}
        onImproveCapsule={vi.fn()}
        onCreateWorkProduct={vi.fn()}
        onCreateWatchlist={vi.fn()}
        onOpenReviewQueue={vi.fn()}
      />,
    );

    expect(html).toContain('Ask active capsule');
    expect(html).toContain('Federal AI Governance File');
    expect(html).toContain('3 sources');
    expect(html).toContain('4 open');
    expect(html).toContain('2 saved');
  });
});
