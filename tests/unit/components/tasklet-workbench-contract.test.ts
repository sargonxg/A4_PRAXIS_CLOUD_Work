import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(join(process.cwd(), 'src/components/praxis/tasklet-praxis-workbench.tsx'), 'utf8');

describe('Tasklet PRAXIS workbench contract', () => {
  it('keeps model routing TACITUS-owned in the main composer', () => {
    expect(source).toContain('TACITUS routes model, worker, and tools');
    expect(source).not.toContain('aria-label="Model"');
    expect(source).not.toContain('setSelectedModel');
  });

  it('uses the canonical conversation turn endpoint from the one-bar composer', () => {
    expect(source).toContain('/api/conversations/${encodeURIComponent(nextThreadId)}/turns');
    expect(source).not.toContain("fetch('/api/ai/ask-praxis'");
    expect(source).toContain("currentToolId: 'ask-praxis'");
    expect(source).toContain('appliedCapsules: activeCapsules.map');
  });

  it('keeps conversation URLs capsule-scoped for sends and copied links', () => {
    expect(source).toContain('const currentConversationPath = buildConversationPath(currentCapsuleId, nextThreadId)');
    expect(source).toContain('currentPath: currentConversationPath');
    expect(source).toContain("url.searchParams.set('capsuleId', capsuleId)");
  });

  it('restores saved conversation turns before falling back to legacy Ask thread history', () => {
    expect(source).toContain('fetch(`/api/conversations/${encodeURIComponent(threadIdToLoad)}`');
    expect(source).toContain('savedConversationTurnsToMessages');
    expect(source).toContain('loadLegacyAskThreadHistory');
  });

  it('keeps retry/source-check actions on the active conversation thread', () => {
    expect(source).toContain('const nextThreadId = ensureConversationThread()');
    expect(source).toContain("onSourceCheck={() => void sendToPraxis(selectedAgent, `Source-check this answer in the active conversation");
    expect(source).toContain('retryFromMessage(index)');
  });

  it('defines explainable selected-span targets with follow-up prompts', () => {
    for (const expected of [
      'support check',
      'decision horizon',
      'alternative explanation',
      'informal power',
      'constraint text',
      'decision question',
    ]) {
      expect(source).toContain(expected);
    }

    expect(source).toContain('askPrompt');
    expect(source).toContain('sourceCheckPrompt');
    expect(source).toContain('memoNote');
    expect(source).toContain('Turn into memo note');
  });

  it('keeps selected text available through span attach success and failure states', () => {
    expect(source).toContain('selectedSpanStatus');
    expect(source).toContain('Attach to active capsule');
    expect(source).toContain('Ask PRAXIS about this span');
    expect(source).toContain('Source-check this span');
    expect(source).toContain('setAttachedSpan');
    expect(source).not.toContain("setSelectedText('');\n    setSelectedMessageId(null);\n    setStatus(`Selected text attached");
  });

  it('uses specific Ask PRAXIS failure guidance instead of a generic dead end', () => {
    expect(source).toContain('describeAskFailure');
    expect(source).toContain('Your prompt is still in the composer');
    expect(source).toContain('network');
    expect(source).not.toContain('I could not complete that request. Check authentication and model access, then try again.');
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
    expect(source).toContain('data-testid="capsule-taxonomy-surface"');
    expect(source).toContain('data-testid="capsule-tool-output-lanes"');
    expect(source).toContain('Thinking devices');
    expect(source).toContain('Artifacts');
    expect(source).toContain('All types');
    expect(source).toContain('Governance');
    expect(source).toContain('/app/capsules');
    expect(source).toContain('onApply={() => applyUserCapsule(capsule)}');
    expect(source).toContain('Apply</button>');
  });

  it('drives taxonomy buttons from the shared statistics contract', () => {
    expect(source).toContain('buildCapsuleTaxonomyStats');
    expect(source).toContain('userCapsuleTaxonomyStats');
    expect(source).toContain('publicCapsuleTaxonomyStats');
    expect(source).toContain('onSelect={setCapsuleTypeFilter}');
    expect(source).toContain('onSelect={setCapsuleDomainFilter}');
    expect(source).toContain("showRepairStates={isRepositoryPage}");
    expect(source).toContain('Source refs');
    expect(source).toContain('Document refs');
    expect(source).not.toContain('function capsuleTypeCount(');
  });

  it('uses the login-matched shared brand treatment in the app workbench', () => {
    expect(source).toContain("import { PraxisBrandChip } from '@/components/brand/praxis-brand-chip'");
    expect(source).toContain('<PraxisBrandChip');
    expect(source).not.toContain('bg-sage text-white">◳');
  });

  it('renders app capsules as a first-class dense repository surface', () => {
    expect(source).toContain('const isCapsuleRepositoryPage = initialPanel ===');
    expect(source).toContain('Capsule repository');
    expect(source).toContain("'capsule-repository-page'");
    expect(source).toContain('lg:grid-cols-3');
    expect(source).toContain('data-testid="document-repository-section"');
    expect(source).toContain('Attach</button>');
    expect(source).toContain('Detach</button>');
  });

  it('renders repository as its own cockpit page state instead of a sheet-only action', () => {
    expect(source).toContain("initialPanel?: 'ask' | 'capsules' | 'repository'");
    expect(source).toContain("const isRepositoryPage = initialPanel === 'repository' && mode === 'app'");
    expect(source).toContain("href={isAuthenticated ? '/app/repository' : '/login?mode=signup&redirect=%2Fapp%2Frepository'}");
    expect(source).toContain("data-testid={isRepositoryPage ? 'capsule-repository-page' : 'capsule-manager'}");
    expect(source).toContain('Find missing sources');
  });
});
