import { inferTruthLayerForKind } from '../src/types/truth-layers';

type GraphNode = {
  id: string;
  kind?: string;
  layer?: string;
  confidence?: number;
};

export function previewTruthLayerMigration(nodes: GraphNode[]) {
  return nodes.map((node) => ({
    id: node.id,
    before: node.layer ?? null,
    after: node.layer ?? inferTruthLayerForKind(node.kind),
    changed: !node.layer,
    confidence: typeof node.confidence === 'number' ? Math.max(0, Math.min(1, node.confidence)) : 0.5,
  }));
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/migrate-truth-layers.ts')) {
  const dryRun = process.argv.includes('--dry-run') || !process.argv.includes('--apply');
  const fixture: GraphNode[] = [
    { id: 'actor-1', kind: 'actor' },
    { id: 'constraint-1', kind: 'constraint' },
    { id: 'commitment-1', kind: 'commitment' },
  ];
  const preview = previewTruthLayerMigration(fixture);
  console.log(JSON.stringify({ mode: dryRun ? 'dry-run' : 'apply-blocked', nodes: preview }, null, 2));
  if (!dryRun) {
    throw new Error('Production Firestore truth-layer migration is intentionally blocked until explicitly wired with a reviewed export.');
  }
}
