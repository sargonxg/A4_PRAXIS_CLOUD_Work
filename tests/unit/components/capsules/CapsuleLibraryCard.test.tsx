import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { CapsuleLibraryCard } from '@/components/capsules/CapsuleLibraryCard';

describe('CapsuleLibraryCard', () => {
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
    expect(html).toContain('quality 91/100');
    expect(html).not.toContain('data-testid="capsule-mini-graph"');
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
});
