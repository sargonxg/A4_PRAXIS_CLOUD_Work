import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(join(process.cwd(), 'src/components/praxis/tasklet-praxis-workbench.tsx'), 'utf8');

describe('Tasklet PRAXIS workbench contract', () => {
  it('uses the canonical conversation turn endpoint from the one-bar composer', () => {
    expect(source).toContain('/api/conversations/${encodeURIComponent(nextThreadId)}/turns');
    expect(source).not.toContain("fetch('/api/ai/ask-praxis'");
    expect(source).toContain("currentToolId: 'ask-praxis'");
    expect(source).toContain('appliedCapsules: activeCapsules.map');
  });

  it('does not render old manual action rows above the composer', () => {
    expect(source).not.toContain('policyNextActions');
    expect(source).not.toContain('data-testid="policy-team-next-actions"');
    expect(source).not.toContain('data-testid="capsule-workspace-actions"');
    expect(source).not.toContain('Research actions');
    expect(source).not.toContain('<CapsuleMap');
    expect(source).not.toContain('Weekly Middle East Analysis');
    expect(source).not.toContain('Sudan');
  });

  it('renders the runtime health semaphore near the home control strip', () => {
    expect(source).toContain('RuntimeHealthSemaphore');
    expect(source).toContain('data-testid="runtime-health-semaphore"');
  });

  it('keeps one capsule context strip and exposes repository-backed type and domain filters', () => {
    expect(source).toContain('data-testid="capsule-context-bar"');
    expect(source).toContain('Add your capsules here');
    expect(source).toContain('capsuleTypeFilters');
    expect(source).toContain('capsuleDomainFilters');
    expect(source).toContain('All types');
    expect(source).toContain('Governance');
    expect(source).toContain('/app/capsules');
    expect(source).toContain('onApply={() => applyUserCapsule(capsule)}');
    expect(source).toContain('Apply</button>');
  });
});
