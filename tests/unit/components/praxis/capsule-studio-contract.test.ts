import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Capsule Studio living graph UI contract', () => {
  const source = readFileSync(join(process.cwd(), 'src/components/capsules/CapsuleWorkbenchPanel.tsx'), 'utf8');

  it('lazy-loads React Force Graph and removes the static preview caps', () => {
    expect(source).toContain("dynamic(() => import('react-force-graph-2d')");
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
      'Build graph from sources',
      'data-testid="capsule-studio-graph-search"',
      'data-testid="capsule-graph-detail-panel"',
    ]) {
      expect(source).toContain(expected);
    }
  });
});
