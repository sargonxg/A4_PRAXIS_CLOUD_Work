import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const componentPath = join(process.cwd(), 'src/components/capsules/CapsuleWorkbenchPanel.tsx');
const componentSource = existsSync(componentPath) ? readFileSync(componentPath, 'utf8') : '';
const workbenchSource = readFileSync(join(process.cwd(), 'src/components/praxis/tasklet-praxis-workbench.tsx'), 'utf8');

describe('Capsule workbench UI contract', () => {
  it('renders the clicked-capsule workbench as one coherent surface', () => {
    expect(componentSource).toContain('data-testid="capsule-workbench-panel"');
    for (const expected of [
      'Overview',
      'Anatomy',
      'Evidence',
      'Graph / Ontology',
      'Tacit Knowledge',
      'Agent Workflow',
      'Outputs',
      'Review Queue',
    ]) {
      expect(componentSource).toContain(expected);
    }
    expect(componentSource).toContain('data-testid="capsule-knowledge-graph"');
    expect(componentSource).toContain('proposals stay review-gated');
    expect(componentSource).toContain('Advisory memory');
    expect(componentSource).toContain('No source receipts attached yet.');
  });

  it('wires the shared workbench into both detail and inspector click paths', () => {
    expect(workbenchSource).toContain("from '@/components/capsules/CapsuleWorkbenchPanel'");
    expect(workbenchSource).toContain('<CapsuleWorkbenchPanel');
    expect(workbenchSource).toContain('repositoryDocuments={repositoryDocuments}');
    expect(workbenchSource).toContain('agentRuns={agentRuns}');
    expect(workbenchSource).toContain('data-testid="capsule-detail-panel"');
    expect(workbenchSource).toContain('data-testid="capsule-inspector-sheet"');
  });
});
