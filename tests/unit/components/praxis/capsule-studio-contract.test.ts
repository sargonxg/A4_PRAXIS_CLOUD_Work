import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Capsule Studio living graph UI contract', () => {
  const whyPanelPath = join(process.cwd(), 'src/components/capsules/viewers/CapsuleGraphWhyPanel.tsx');
  const whyPanelSource = existsSync(whyPanelPath) ? readFileSync(whyPanelPath, 'utf8') : '';
  const viewerSource = readFileSync(join(process.cwd(), 'src/components/capsules/viewers/CapsuleGraphViewer.tsx'), 'utf8');
  const sectionSource = readFileSync(join(process.cwd(), 'src/components/capsules/workbench/CapsuleGraphSection.tsx'), 'utf8');
  const source = [
    'src/components/capsules/CapsuleWorkbenchPanel.tsx',
    'src/components/capsules/workbench/CapsuleStudioOverviewSection.tsx',
    'src/components/capsules/workbench/CapsuleGraphSection.tsx',
    'src/components/capsules/viewers/CapsuleGraphViewer.tsx',
  ].map((path) => readFileSync(join(process.cwd(), path), 'utf8')).join('\n');

  it('lazy-loads React Force Graph and removes the static preview caps', () => {
    expect(source).toContain("dynamic(() => import('react-force-graph-2d')");
    expect(source).toContain("import('@/components/capsules/viewers/CapsuleGraphViewer')");
    expect(source).toContain('ssr: false');
    expect(source).toContain('nodeCanvasObject');
    expect(source).toContain('nodePointerAreaPaint');
    expect(source).toContain('onNodeClick');
    expect(source).toContain('onLinkHover');
    expect(source).toContain('zoomToFit');
    expect(source).not.toContain('graph.nodes.slice(0, 14)');
    expect(source).not.toContain('nodes.slice(0, 14)');
  });

  it('presents Capsule Studio rails, graph search, detail, and proposal controls', () => {
    for (const expected of [
      'Capsule Studio',
      'Sources & freshness',
      'Claim ledger',
      'Tools attached',
      'Outputs produced',
      'Memory & tacit knowledge',
      'Trust & readiness',
      'History/diff',
      'Proposed changes',
      'GraphLite advisory projection',
      'Firestore canonical',
      'Build graph from sources',
      'data-testid="capsule-studio-graph-search"',
      'data-testid="capsule-graph-detail-panel"',
    ]) {
      expect(source).toContain(expected);
    }
  });

  it('surfaces F2 graph lenses, bi-temporal scrubber, and invalidated history controls', () => {
    for (const expected of [
      'data-testid="capsule-graph-lens-bar"',
      'RELATIONSHIP_LENS_OPTIONS',
      'RELATIONSHIP_CATEGORIES',
      'data-testid={`capsule-graph-lens-${category}`}',
      'data-testid="capsule-graph-invalidated-toggle"',
      'const [showInvalidated, setShowInvalidated] = useState(false)',
      'data-testid="capsule-graph-temporal-scrubber"',
      'As it was',
      'As we knew it',
      'type="range"',
      'opacity: 0.12',
    ]) {
      expect(source).toContain(expected);
    }
  });

  it('renders a reusable graph why panel with rationale, provenance, and contradiction history', () => {
    expect(viewerSource).toContain('CapsuleGraphWhyPanel,');
    expect(viewerSource).toContain("from '@/components/capsules/viewers/CapsuleGraphWhyPanel'");
    expect(whyPanelSource).toContain('data-testid="capsule-graph-why-panel"');
    for (const expected of [
      'Why this exists',
      'No recorded rationale (extracted directly from source)',
      'derivedFrom',
      'onOpenClaim',
      'generatedBy',
      'supersededBy',
      'judgeRationale',
      'CONTRADICTS',
      'confidenceKind',
      'AMBIGUOUS',
    ]) {
      expect(whyPanelSource).toContain(expected);
    }
  });

  it('keeps the graph viewer generic while wiring claim chips from the section', () => {
    expect(viewerSource).not.toContain("from '@/lib/context/capsule-workbench-view-model'");
    expect(sectionSource).toContain('onOpenClaim={handleOpenClaim}');
    expect(sectionSource).toContain('querySelector(\'[data-testid="capsule-claim-receipts"]\')');
  });
});
