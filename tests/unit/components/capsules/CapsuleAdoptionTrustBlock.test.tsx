import type { ReactElement, ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { CapsuleAdoptionTrustBlock } from '@/components/capsules/CapsuleAdoptionTrustBlock';

describe('CapsuleAdoptionTrustBlock', () => {
  it('renders provenance, source coverage, gate state, and readiness before adoption', () => {
    const html = renderToStaticMarkup(
      <CapsuleAdoptionTrustBlock
        capsuleTitle="Public mediation capsule"
        readiness={{ tier: 'ready', score: 88, topBlocker: null }}
        sourceCoverage={{
          assessed: true,
          tierSummary: 'tier 1: 2 / tier 2: 1',
          freshnessLabel: 'source refresh current',
        }}
        humanGateLabel="Human-gated"
        lastRefreshLabel="May 23, 2026"
        provenance={{
          originLabel: 'starter-catalog',
          parentCapsuleId: 'parent-cap',
          parentHref: '/app/capsules?starter=parent-cap&lane=inspect',
        }}
        forkability="allowed"
        onFork={vi.fn()}
      />,
    );

    expect(html).toContain('data-testid="capsule-adoption-trust-block"');
    expect(html).toContain('Ready');
    expect(html).toContain('88');
    expect(html).toContain('tier 1: 2 / tier 2: 1');
    expect(html).toContain('source refresh current');
    expect(html).toContain('Human-gated');
    expect(html).toContain('May 23, 2026');
    expect(html).toContain('origin starter-catalog');
    expect(html).toContain('parent-cap');
  });

  it('calls the fork handler from the CTA and disables review-required forks with an explanation', () => {
    const onFork = vi.fn();
    const allowed = CapsuleAdoptionTrustBlock({
      capsuleTitle: 'Public mediation capsule',
      readiness: { tier: 'near', score: 64, topBlocker: 'Needs refresh' },
      sourceCoverage: {
        assessed: false,
        tierSummary: 'source coverage not assessed',
        freshnessLabel: 'freshness not assessed',
      },
      humanGateLabel: 'Needs review',
      lastRefreshLabel: 'not assessed',
      provenance: { originLabel: 'workspace' },
      forkability: 'allowed',
      onFork,
    }) as ReactElement;

    const allowedButton = findByTestId(allowed, 'capsule-adoption-fork-button') as ReactElement<{
      onClick: () => void;
    }>;
    allowedButton.props.onClick();
    expect(onFork).toHaveBeenCalledTimes(1);

    const reviewRequiredHtml = renderToStaticMarkup(
      <CapsuleAdoptionTrustBlock
        capsuleTitle="Review-required capsule"
        readiness={{ tier: 'near', score: 60, topBlocker: null }}
        sourceCoverage={{
          assessed: false,
          tierSummary: 'source coverage not assessed',
          freshnessLabel: 'freshness not assessed',
        }}
        humanGateLabel="Needs review"
        lastRefreshLabel="not assessed"
        provenance={{ originLabel: 'starter-catalog' }}
        forkability="review_required"
        onFork={onFork}
      />,
    );

    expect(reviewRequiredHtml).toContain('data-testid="capsule-adoption-fork-button"');
    expect(reviewRequiredHtml).toContain('Fork requires review first');
    expect(reviewRequiredHtml).toContain('This capsule needs human review before a private fork can be created.');
  });
});

function findByTestId(node: ReactNode, testId: string): ReactElement {
  if (!node || typeof node !== 'object') throw new Error(`Missing node ${testId}`);
  const element = node as ReactElement<{ children?: ReactNode; 'data-testid'?: string }>;
  if (element.props?.['data-testid'] === testId) return element;
  const children = element.props?.children;
  const list = Array.isArray(children) ? children : [children];
  for (const child of list) {
    try {
      return findByTestId(child, testId);
    } catch {
      // Continue searching siblings.
    }
  }
  throw new Error(`Unable to find ${testId}`);
}
