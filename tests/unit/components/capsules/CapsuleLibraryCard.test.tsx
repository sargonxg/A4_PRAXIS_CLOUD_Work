import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { CapsuleLibraryCard } from '@/components/capsules/CapsuleLibraryCard';

describe('CapsuleLibraryCard', () => {
  it('does not turn missing review assessments into zero unsupported claims or verified quality', () => {
    const html = renderToStaticMarkup(<CapsuleLibraryCard variant="full" capsuleId="unassessed" title="New private draft" counts={{ sources: 1 }} />);
    expect(html).toContain('Not assessed');
    expect(html).not.toContain('0 unsupported');
    expect(html).not.toContain('quality 0/100');
    expect(html).toContain('No recorded graph yet');
    expect(html).not.toContain('<circle');
  });
  it('renders the compact homepage card contract without full-only graph chrome', () => {
    const html = renderToStaticMarkup(
      <CapsuleLibraryCard
        variant="compact"
        capsuleId="cap-compact"
        title="Compact policy capsule"
        summary="A short source-backed capsule summary."
        color="#0f766e"
        categoryLabel="Situation"
        domainLabel="Mediation"
        roleLabel="Situation"
        readiness={{ tier: 'ready', score: 92 }}
        qualityScore={91}
        counts={{ sources: 4, claims: 8, graphNodes: 6, graphEdges: 9, unsupportedClaims: 0 }}
        onSelect={vi.fn()}
        addAction={{
          onAdd: vi.fn(),
          roleOptions: [{ label: 'As Situation', value: 'situation' }],
        }}
      />,
    );

    expect(html).toContain('data-testid="capsule-card-cap-compact"');
    expect(html).toContain('data-testid="capsule-card-add-split"');
    expect(html).toContain('Compact policy capsule');
    expect(html).toContain('Categories');
    expect(html).toContain('structure 91/100');
    expect(html).not.toContain('data-testid="capsule-mini-graph"');
  });

  it('labels the Add action with the proposed dock slot', () => {
    const html = renderToStaticMarkup(
      <CapsuleLibraryCard
        variant="full"
        capsuleId="cap-situation"
        title="Situation capsule"
        summary="A source-backed situation frame."
        addAction={{
          label: 'Add to Situation slot',
          onAdd: vi.fn(),
          roleOptions: [],
        }}
      />,
    );

    expect(html).toContain('data-testid="capsule-card-add-split"');
    expect(html).toContain('Add to Situation slot');
    expect(html).not.toContain('Choose context bucket');
  });

  it('renders the full library card contract and tolerates missing optional fields', () => {
    const html = renderToStaticMarkup(
      <CapsuleLibraryCard
        variant="full"
        capsuleId="cap-full"
        title="Full library capsule"
        summary="A fuller repository summary."
        color="#2563eb"
        categoryLabel="Starter library"
        readiness={{ tier: 'near', score: null, topBlocker: 'Needs sources' }}
        counts={{ sources: 0, claims: 0, graphNodes: 0, graphEdges: 0 }}
        onSelect={vi.fn()}
        openTestId="capsule-repository-open"
      />,
    );

    expect(html).toContain('data-testid="capsule-card-cap-full"');
    expect(html).toContain('data-testid="capsule-repository-open"');
    expect(html).toContain('data-testid="capsule-mini-graph"');
    expect(html).toContain('data-testid="capsule-repository-v2-scoreboard"');
    expect(html).toContain('Full library capsule');
    expect(html).toContain('Sources');
    expect(html).toContain('Claims');
    expect(html).toContain('Graph');
  });

  it('renders explicit capsule research signals for inspect decisions', () => {
    const html = renderToStaticMarkup(
      <CapsuleLibraryCard
        variant="full"
        capsuleId="cap-research"
        title="Research-ready capsule"
        summary="A fuller repository summary."
        color="#0f766e"
        categoryLabel="Starter library"
        readiness={{ tier: 'near', score: 81 }}
        counts={{ sources: 4, claims: 7, graphNodes: 12, graphEdges: 15, unsupportedClaims: 2 }}
        researchSignals={{
          sourceSpineCount: 6,
          evidenceGapCount: 3,
          refreshStatus: 'needs-refresh',
          graphNodeCount: 12,
          graphEdgeCount: 15,
          unsupportedClaimCount: 2,
          inspectHref: '/app/capsules?starter=cap-research&lane=inspect',
        }}
      />,
    );

    expect(html).toContain('data-testid="capsule-research-signals"');
    expect(html).toContain('6 source spine');
    expect(html).toContain('3 evidence gaps');
    expect(html).toContain('refresh needs-refresh');
    expect(html).toContain('graph 12/15');
    expect(html).toContain('2 unsupported');
    expect(html).toContain('Inspect');
    expect(html).toContain('/app/capsules?starter=cap-research&amp;lane=inspect');
  });
});
