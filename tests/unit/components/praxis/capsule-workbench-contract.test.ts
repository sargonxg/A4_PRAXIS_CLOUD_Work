import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const componentPath = join(process.cwd(), 'src/components/capsules/CapsuleWorkbenchPanel.tsx');
const componentSource = existsSync(componentPath) ? readFileSync(componentPath, 'utf8') : '';
const sectionSource = [
  'src/components/capsules/CapsuleOntologyWorkbench.tsx',
  'src/components/capsules/workbench/CapsuleAdvancedDrawer.tsx',
  'src/components/capsules/workbench/CapsuleStudioOverviewSection.tsx',
  'src/components/capsules/workbench/CapsuleSourceabilityGatesSection.tsx',
  'src/components/capsules/workbench/CapsuleHistorySection.tsx',
  'src/components/capsules/workbench/CapsulePillarsSection.tsx',
  'src/components/capsules/workbench/CapsuleTimelineSection.tsx',
  'src/components/capsules/workbench/CapsuleCausalChainSection.tsx',
  'src/components/capsules/workbench/CapsuleQualitySection.tsx',
  'src/components/capsules/workbench/CapsuleClaimReceiptsSection.tsx',
  'src/components/capsules/workbench/CapsuleAnatomySection.tsx',
  'src/components/capsules/workbench/CapsuleGraphSection.tsx',
  'src/components/capsules/workbench/CapsuleTacitKnowledgeSection.tsx',
  'src/components/capsules/workbench/CapsuleAgentWorkflowSection.tsx',
  'src/components/capsules/workbench/CapsuleOutputsSection.tsx',
  'src/components/capsules/workbench/CapsuleReviewQueueSection.tsx',
  'src/components/capsules/workbench/CapsuleWorkbenchSections.tsx',
  'src/components/capsules/viewers/CapsuleGraphViewer.tsx',
  'src/components/capsules/viewers/CapsuleTemporalViewer.tsx',
].map((path) => readFileSync(join(process.cwd(), path), 'utf8')).join('\n');
const capsuleWorkbenchSource = `${componentSource}\n${sectionSource}`;
const workbenchSource = readFileSync(join(process.cwd(), 'src/components/praxis/tasklet-praxis-workbench.tsx'), 'utf8');

describe('Capsule workbench UI contract', () => {
  it('renders the clicked-capsule workbench as one coherent surface', () => {
    expect(componentSource).toContain('data-testid="capsule-workbench-panel"');
    for (const expected of [
      'Situation',
      'User',
      'Tools',
      'Output',
      'Graph / Ontology',
      'Timeline scrubber',
      'Causal chain',
      'Quality meter',
      'History',
      'Fix this',
      'Reliability tier',
    ]) {
      expect(capsuleWorkbenchSource).toContain(expected);
    }
    expect(capsuleWorkbenchSource).toContain('data-testid="capsule-knowledge-graph"');
    expect(capsuleWorkbenchSource).toContain('data-testid="capsule-timeline-scrubber"');
    expect(capsuleWorkbenchSource).toContain('data-testid="capsule-causal-chain-view"');
    expect(capsuleWorkbenchSource).toContain('data-testid="capsule-quality-meter"');
    expect(capsuleWorkbenchSource).toContain('data-testid="capsule-claim-receipts"');
    expect(capsuleWorkbenchSource).toContain('data-testid="capsule-history-section"');
    expect(capsuleWorkbenchSource).toContain('data-testid="capsule-version-diff"');
    expect(capsuleWorkbenchSource).toContain('/history?limit=8');
    expect(capsuleWorkbenchSource).toContain('/diff?from=v');
    expect(capsuleWorkbenchSource).toContain('Claim ledger');
    expect(capsuleWorkbenchSource).toContain('Source refs');
    expect(capsuleWorkbenchSource).toContain("import('vis-timeline/standalone')");
    expect(componentSource).toContain('CapsuleOntologyWorkbench');
    expect(componentSource).toContain('CapsuleAdvancedDrawer');
    expect(capsuleWorkbenchSource).toContain('CapsulePillarsSection');
    expect(capsuleWorkbenchSource).toContain('CapsuleTimelineSection');
    expect(capsuleWorkbenchSource).toContain('CapsuleCausalChainSection');
    expect(capsuleWorkbenchSource).toContain('CapsuleQualitySection');
    expect(capsuleWorkbenchSource).toContain('CapsuleClaimReceiptsSection');
    expect(capsuleWorkbenchSource).toContain('data-testid="capsule-ontology-workbench"');
    expect(capsuleWorkbenchSource).toContain('data-testid="capsule-advanced-drawer"');
    expect(capsuleWorkbenchSource).toContain('proposals stay review-gated');
    expect(capsuleWorkbenchSource).toContain('Advisory memory');
    expect(capsuleWorkbenchSource).toContain('No source receipts attached yet.');
  });

  it('wires the shared workbench into both detail and inspector click paths', () => {
    expect(workbenchSource).toContain("from '@/components/capsules/CapsuleWorkbenchPanel'");
    expect(workbenchSource).toContain('<CapsuleWorkbenchPanel');
    expect(workbenchSource).toContain('repositoryDocuments={repositoryDocuments}');
    expect(workbenchSource).toContain('agentRuns={agentRuns}');
    expect(workbenchSource).toContain("fetch(`/api/context/capsules/${encodeURIComponent(selectedCapsuleIdForMemories)}/memories`");
    expect(workbenchSource).toContain('tacitMemories={capsuleMemories}');
    expect(workbenchSource).toContain('data-testid="capsule-detail-panel"');
    expect(workbenchSource).toContain('data-testid="capsule-inspector-sheet"');
  });
});
